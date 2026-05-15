/**
 * seo-algorithm-watcher — Vecko-skanner för Google + AI-SEO-förändringar
 *
 * Körs varje måndag 04:00 UTC (06:00 CEST / 05:00 CET) via EventBridge.
 *
 * Vad den gör:
 *  1. Hämtar RSS/Atom från officiella källor (Google Search Central blog,
 *     Search Engine Land, Search Engine Journal, Schema.org GitHub-releases).
 *  2. Filtrerar artiklar publicerade senaste 7 dagar.
 *  3. Klassificerar varje träff via Claude Haiku (OpenRouter): critical /
 *     important / info — med 1-mening varför + förslag på action.
 *  4. Loggar alla träffar till BigQuery seo_algorithm_intel.
 *  5. Mejlar Mikael en sammanfattning (gul info-ruta för critical, vanlig
 *     listning för important+info).
 *  6. För critical-hits: skapar tasks i seo_work_queue för ALLA aktiva
 *     kunder så autonomous-optimizer plockar upp dem inom 6h.
 *
 * Filosofi: hellre 1 falsk positiv per månad än att missa en viktig
 * algoritm-uppdatering. Mikael granskar alltid mailet innan deploy.
 */
const https = require('https');
const { BigQuery } = require('@google-cloud/bigquery');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESv2Client({ region: REGION });

const PROJECT_ID = 'searchboost-485810';
const DATASET = 'seo_data';

// Källor — RSS/Atom-feeds som vi pollar varje vecka
const SOURCES = [
  { name: 'Google Search Central',  url: 'https://developers.google.com/search/blog/rss.xml',          weight: 1.0 },
  { name: 'Search Engine Land',     url: 'https://searchengineland.com/feed',                          weight: 0.7 },
  { name: 'Search Engine Journal',  url: 'https://www.searchenginejournal.com/feed/',                  weight: 0.7 },
  { name: 'Schema.org releases',    url: 'https://github.com/schemaorg/schemaorg/releases.atom',       weight: 0.9 },
  { name: 'OpenAI documentation',   url: 'https://platform.openai.com/docs/changelog.rss',             weight: 0.6 },
  { name: 'Anthropic news',         url: 'https://www.anthropic.com/news/rss.xml',                     weight: 0.6 },
];

async function getParam(name) {
  const r = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return r.Parameter.Value;
}

function httpsGetText(urlString, timeout = 15000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlString);
      const req = https.request({
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'GET',
        headers: { 'User-Agent': 'Mozilla/5.0 SBS-AlgoWatcher/1.0', Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*' },
        timeout,
      }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          httpsGetText(new URL(res.headers.location, urlString).toString(), timeout).then(resolve);
          return;
        }
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', () => resolve({ status: 0, body: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
      req.end();
    } catch (e) {
      resolve({ status: 0, body: '' });
    }
  });
}

// Enkel RSS/Atom-parser via regex (Lambda-stenlätt, inga deps)
function parseFeed(xml, sourceName) {
  const items = [];
  // RSS 2.0: <item>...</item>, Atom: <entry>...</entry>
  const itemPattern = /<(item|entry)\b[^>]*>([\s\S]*?)<\/\1>/g;
  let match;
  while ((match = itemPattern.exec(xml)) !== null) {
    const block = match[2];
    const title = stripCdata(extractTag(block, 'title')) || '';
    const linkRaw = extractTag(block, 'link');
    let link = linkRaw && linkRaw.trim();
    if (!link || link.startsWith('<')) {
      const hrefMatch = block.match(/<link[^>]*\bhref=["']([^"']+)["']/);
      if (hrefMatch) link = hrefMatch[1];
    }
    const description = stripCdata(extractTag(block, 'description') || extractTag(block, 'summary') || extractTag(block, 'content')) || '';
    const pubDateRaw = extractTag(block, 'pubDate') || extractTag(block, 'published') || extractTag(block, 'updated') || '';
    const pubDate = pubDateRaw ? new Date(pubDateRaw) : null;
    if (title) {
      items.push({
        source: sourceName,
        title: cleanText(title).slice(0, 240),
        url: link || '',
        summary: cleanText(description).slice(0, 600),
        published_at: pubDate && !isNaN(pubDate) ? pubDate.toISOString() : null,
      });
    }
  }
  return items;
}

function extractTag(block, tag) {
  const m = block.match(new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return m ? m[1] : '';
}

function stripCdata(s) {
  if (!s) return '';
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
}

function cleanText(s) {
  return (s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(d))
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ').trim();
}

function within7Days(iso) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return (Date.now() - t) < 7 * 24 * 60 * 60 * 1000 && t <= Date.now();
}

async function classifyWithLLM(items, openrouterKey) {
  if (!items.length) return [];
  // Skicka i batch — ger LLM kontext för att rangordna mot varandra
  const list = items.map((it, i) => `${i + 1}. [${it.source}] "${it.title}" — ${it.summary.slice(0, 280)}`).join('\n');
  const prompt = `Du är SEO-strategiansvarig på Searchboost (svensk SEO-byrå med 8 aktiva kunder, WordPress + Rank Math).

Klassificera följande nyheter senaste 7 dagar med tanke på vad som påverkar svenska SEO + AI-sökoptimering (Google AI Overviews, ChatGPT, Claude, Gemini, Perplexity):

${list}

Returnera ett JSON-array, ett objekt per nyhet i samma ordning:
{
  "index": <nummer>,
  "level": "critical" | "important" | "info" | "noise",
  "reason": "<1 mening om varför det är på denna nivå>",
  "action": "<1 mening om vad vi bör göra, eller 'Ingen åtgärd' för info/noise>"
}

KLASSIFICERINGSREGLER:
- critical = Google core update, rich-result-ändringar, schema-deprekering, AI-crawler user-agent-byte, INP/CWV-threshold-ändring, eller annat som omedelbart kan påverka kundernas rankning/synlighet.
- important = Best practice-uppdatering, nya schema-typer, AI-citerings-mönster, tips från Search Liaison som påverkar strategi inom 1-3 månader.
- info = Allmänt SEO-news utan direkt åtgärd, branschtrender.
- noise = Konferensannonsering, produktreklam, irrelevant innehåll, sponsrade artiklar.

Svara enbart med JSON-array, ingen markdown.`;

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://searchboost.se',
      'X-Title': 'Searchboost Algorithm Watcher'
    },
    body: JSON.stringify({
      model: 'anthropic/claude-haiku-4-5-20251001',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4000,
    })
  });
  const data = await resp.json();
  if (data.error) {
    console.error('LLM-fel:', data.error);
    return items.map((_, i) => ({ index: i + 1, level: 'info', reason: 'LLM-fel — manuell granskning', action: 'Granska manuellt' }));
  }
  const text = data.choices[0].message.content;
  try {
    const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error('JSON-parse-fel:', e.message, text.slice(0, 200));
    return items.map((_, i) => ({ index: i + 1, level: 'info', reason: 'Parse-fel', action: 'Granska manuellt' }));
  }
}

async function ensureTable(bq) {
  await bq.query({
    query: `CREATE TABLE IF NOT EXISTS \`${PROJECT_ID}.${DATASET}.seo_algorithm_intel\` (
      detected_at TIMESTAMP,
      source STRING,
      level STRING,
      title STRING,
      url STRING,
      summary STRING,
      reason STRING,
      action STRING,
      published_at TIMESTAMP
    )
    PARTITION BY DATE(detected_at)
    CLUSTER BY level, source`,
  });
}

async function logToBq(bq, rows) {
  if (!rows.length) return;
  await bq.dataset(DATASET).table('seo_algorithm_intel').insert(rows);
}

async function getActiveCustomers(bq) {
  try {
    const [rows] = await bq.query({
      query: `SELECT customer_id FROM \`${PROJECT_ID}.${DATASET}.customer_pipeline\`
              WHERE stage = 'active' AND customer_id IS NOT NULL`
    });
    return rows.map(r => r.customer_id);
  } catch (e) {
    console.log('Kunde inte hämta aktiva kunder:', e.message);
    return [];
  }
}

async function queueCriticalTasks(bq, criticalHits, customerIds) {
  if (!criticalHits.length || !customerIds.length) return 0;
  const rows = [];
  const now = new Date().toISOString();
  for (const hit of criticalHits) {
    for (const cid of customerIds) {
      rows.push({
        queue_id: `algo-${Date.now()}-${cid}-${Math.random().toString(36).slice(2, 8)}`,
        customer_id: cid,
        task_type: 'algorithm_response',
        page_url: '',
        priority: 100,
        status: 'pending',
        context_data: JSON.stringify({
          source: hit.source,
          title: hit.title,
          url: hit.url,
          reason: hit.reason,
          action: hit.action,
          detected_at: now
        }),
        created_at: now,
        source: 'algorithm-watcher'
      });
    }
  }
  if (!rows.length) return 0;
  await bq.dataset(DATASET).table('seo_work_queue').insert(rows);
  return rows.length;
}

function buildEmailHtml(critical, important, info, weekLabel) {
  const card = (level, color, label) => `
    <h2 style="color:${color};font-size:16px;border-bottom:2px solid ${color};padding-bottom:6px;margin:24px 0 12px">${label}</h2>`;
  const item = (h) => `
    <div style="margin:0 0 14px;padding:12px 16px;background:#f8f9fa;border-radius:6px">
      <div style="font-size:14px;font-weight:600;color:#0e0c19;margin-bottom:4px">${escapeHtml(h.title)}</div>
      <div style="font-size:12px;color:#666;margin-bottom:6px">${escapeHtml(h.source)}${h.published_at ? ' · ' + new Date(h.published_at).toLocaleDateString('sv-SE') : ''} · <a href="${escapeHtml(h.url)}" style="color:#db007f">Läs</a></div>
      <div style="font-size:13px;color:#444;margin-bottom:4px"><strong>Varför:</strong> ${escapeHtml(h.reason)}</div>
      <div style="font-size:13px;color:#444"><strong>Åtgärd:</strong> ${escapeHtml(h.action)}</div>
    </div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;color:#0e0c19;background:#fff">
  <div style="background:#db007f;padding:24px;text-align:center">
    <h1 style="color:#fff;font-size:20px;margin:0">Algoritm- och AI-bevakning</h1>
    <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px">${weekLabel}</p>
  </div>
  <div style="padding:24px">
    <p style="font-size:14px;color:#666;margin:0 0 18px">Veckans förändringar inom Googles algoritm, schema-standard och AI-sökmotorer. Sammanställt automatiskt.</p>
    ${critical.length ? card('critical', '#d32f2f', `KRITISKT — ${critical.length}`) + critical.map(item).join('') : ''}
    ${critical.length ? '<div style="margin:12px 0 24px;padding:10px 14px;background:#fff3e0;border-left:3px solid #ff9800;border-radius:4px;font-size:13px;color:#555">Kritiska träffar har automatiskt skapat tasks i seo_work_queue för alla aktiva kunder. Autonomous-optimizer plockar upp dem inom 6 timmar — granska gärna kön innan.</div>' : ''}
    ${important.length ? card('important', '#f57c00', `VIKTIGT — ${important.length}`) + important.map(item).join('') : ''}
    ${info.length ? card('info', '#0288d1', `INFO — ${info.length}`) + info.map(item).join('') : ''}
    ${!critical.length && !important.length && !info.length ? '<p style="color:#999;font-size:14px;text-align:center;padding:24px">Inga relevanta uppdateringar denna vecka.</p>' : ''}
  </div>
  <div style="background:#f8f9fa;padding:14px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e8e8e8">Searchboost Algorithm Watcher · seo-algorithm-watcher Lambda</div>
</body></html>`;
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

async function sendEmail(to, from, subject, html) {
  await ses.send(new SendEmailCommand({
    FromEmailAddress: from,
    Destination: { ToAddresses: to },
    Content: { Simple: { Subject: { Data: subject, Charset: 'UTF-8' }, Body: { Html: { Data: html, Charset: 'UTF-8' } } } }
  }));
}

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  const bq = new BigQuery({ projectId: 'seo-aouto' });
  const _origDs = bq.dataset.bind(bq);
  bq.dataset = (n, o = {}) => _origDs(n, { projectId, ...o });
  return { bq, dataset };
}

exports.handler = async (event) => {
  console.log('=== Algorithm Watcher Started ===');
  const force = event && event.force === true;

  const { bq } = await getBigQuery();
  await ensureTable(bq);

  // Dedup: en körning per ISO-vecka
  if (!force) {
    try {
      const [existing] = await bq.query({
        query: `SELECT COUNT(*) as cnt FROM \`${PROJECT_ID}.${DATASET}.seo_algorithm_intel\`
                WHERE EXTRACT(ISOWEEK FROM DATETIME(detected_at, 'Europe/Stockholm'))
                    = EXTRACT(ISOWEEK FROM DATETIME(CURRENT_TIMESTAMP(), 'Europe/Stockholm'))
                AND EXTRACT(ISOYEAR FROM DATETIME(detected_at, 'Europe/Stockholm'))
                    = EXTRACT(ISOYEAR FROM DATETIME(CURRENT_TIMESTAMP(), 'Europe/Stockholm'))`
      });
      if (existing[0] && Number(existing[0].cnt) > 0) {
        console.log('Redan körd denna ISO-vecka — avbryter');
        return { statusCode: 200, body: 'already_run_this_week' };
      }
    } catch (e) { console.log('Dedup-check fel (ignoreras):', e.message); }
  }

  // 1. Hämta alla feeds
  const allItems = [];
  for (const source of SOURCES) {
    console.log(`Hämtar ${source.name}…`);
    const r = await httpsGetText(source.url);
    if (r.status === 200 && r.body) {
      const items = parseFeed(r.body, source.name).filter(it => within7Days(it.published_at));
      console.log(`  ${items.length} träffar senaste 7d`);
      allItems.push(...items);
    } else {
      console.warn(`  ${source.name}: status=${r.status} (skippas)`);
    }
  }

  console.log(`Totalt ${allItems.length} träffar att klassificera`);

  // 2. Klassificera via LLM
  let classifications = [];
  if (allItems.length > 0) {
    try {
      const openrouterKey = await getParam('/seo-mcp/openrouter/api-key');
      classifications = await classifyWithLLM(allItems, openrouterKey);
    } catch (e) {
      console.error('Klassificeringsfel:', e.message);
    }
  }

  // 3. Para ihop items + classifications
  const enriched = allItems.map((it, idx) => {
    const c = classifications.find(x => Number(x.index) === idx + 1) || { level: 'info', reason: 'Ej klassificerad', action: 'Granska manuellt' };
    return { ...it, level: c.level, reason: c.reason, action: c.action };
  }).filter(x => x.level !== 'noise');

  const critical = enriched.filter(x => x.level === 'critical');
  const important = enriched.filter(x => x.level === 'important');
  const info = enriched.filter(x => x.level === 'info');
  console.log(`Resultat: critical=${critical.length} important=${important.length} info=${info.length}`);

  // 4. Logga till BQ
  const now = new Date().toISOString();
  const rows = enriched.map(x => ({
    detected_at: now,
    source: x.source,
    level: x.level,
    title: x.title,
    url: x.url,
    summary: x.summary,
    reason: x.reason,
    action: x.action,
    published_at: x.published_at,
  }));
  try { await logToBq(bq, rows); } catch (e) { console.error('BQ insert fel:', e.message); }

  // 5. Kritiska → tasks i seo_work_queue för alla kunder
  let tasksCreated = 0;
  if (critical.length > 0) {
    try {
      const cids = await getActiveCustomers(bq);
      tasksCreated = await queueCriticalTasks(bq, critical, cids);
      console.log(`Skapade ${tasksCreated} tasks i seo_work_queue (${cids.length} kunder × ${critical.length} kritiska)`);
    } catch (e) { console.error('Queue-fel:', e.message); }
  }

  // 6. Mejla Mikael
  if (enriched.length > 0 || force) {
    try {
      const emailFrom = await getParam('/seo-mcp/email/from');
      const recipients = (await getParam('/seo-mcp/email/recipients')).split(',').map(e => e.trim());
      const today = new Date();
      const weekNum = Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / (7 * 86400000));
      const subject = `[Algoritm-bevakning] V${weekNum} — ${critical.length} kritiska, ${important.length} viktiga, ${info.length} info`;
      const html = buildEmailHtml(critical, important, info, `Vecka ${weekNum} · ${today.toISOString().slice(0, 10)}`);
      await sendEmail(recipients, emailFrom, subject, html);
      console.log('Mejl skickat till:', recipients.join(', '));
    } catch (e) { console.error('Mejl-fel:', e.message); }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      total: enriched.length,
      critical: critical.length,
      important: important.length,
      info: info.length,
      tasks_queued: tasksCreated,
    })
  };
};
