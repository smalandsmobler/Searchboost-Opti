/**
 * seo-skill-watcher — Vecko-bevakning av Claude/Anthropic skill-releases
 *
 * Körs varje måndag 06:30 CEST (04:30 UTC) via EventBridge — direkt efter
 * algorithm-watcher så vi får en samlad inkorg på måndag morgon.
 *
 * Vad den gör:
 *  1. Hämtar fullt repo-träd för anthropics/skills (1 GitHub-anrop).
 *  2. Listar alla SKILL.md-filer i repo.
 *  3. Jämför mot förra veckans snapshot i BigQuery seo_skill_inventory.
 *  4. NYA eller UPPDATERADE skills → hämtar SKILL.md från
 *     raw.githubusercontent.com (ingen rate limit) och kör LLM-bedömning:
 *     är detta relevant för Searchboost SEO-byrå med 8 WP-kunder?
 *  5. Loggar inventeringen + relevanta träffar.
 *  6. Mejlar Mikael förslag med install-kommandon (cURL + tar).
 *
 * Vi installerar ALDRIG automatiskt — Lambda saknar tillgång till Mikaels
 * ~/.claude/skills/. Mejlet innehåller copy-paste-kommandon istället.
 *
 * Stöd för flera repos: lägg till i SKILL_REPOS-array.
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

// Repos att bevaka. Lägg till fler vid behov.
const SKILL_REPOS = [
  { owner: 'anthropics', repo: 'skills', branch: 'main', label: 'Anthropic Skills' },
];

async function getParam(name) {
  const r = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return r.Parameter.Value;
}

function httpsJsonGet(urlString, headers = {}, timeout = 15000) {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlString);
      const req = https.request({
        hostname: u.hostname,
        port: 443,
        path: u.pathname + u.search,
        method: 'GET',
        headers: {
          'User-Agent': 'SBS-SkillWatcher/1.0',
          Accept: 'application/vnd.github+json',
          ...headers
        },
        timeout
      }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, json: JSON.parse(body) }); }
          catch { resolve({ status: res.statusCode, json: null, body }); }
        });
      });
      req.on('error', () => resolve({ status: 0 }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0 }); });
      req.end();
    } catch (e) { resolve({ status: 0 }); }
  });
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
        headers: { 'User-Agent': 'SBS-SkillWatcher/1.0' },
        timeout
      }, (res) => {
        let body = '';
        res.on('data', (c) => (body += c));
        res.on('end', () => resolve({ status: res.statusCode, body }));
      });
      req.on('error', () => resolve({ status: 0, body: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, body: '' }); });
      req.end();
    } catch (e) { resolve({ status: 0, body: '' }); }
  });
}

async function listAllSkills(repoCfg) {
  // 1 anrop: hela trädet rekursivt
  const url = `https://api.github.com/repos/${repoCfg.owner}/${repoCfg.repo}/git/trees/${repoCfg.branch}?recursive=1`;
  const r = await httpsJsonGet(url);
  if (r.status !== 200 || !r.json || !Array.isArray(r.json.tree)) {
    console.warn(`Tree-API misslyckades för ${repoCfg.label}: status ${r.status}`);
    return [];
  }
  const skills = [];
  for (const node of r.json.tree) {
    if (node.type !== 'blob') continue;
    // Anthropic skills har SKILL.md i sin mapp; även README.md som fallback
    if (!/\/SKILL\.md$|^SKILL\.md$/i.test(node.path)) continue;
    const parts = node.path.split('/');
    const skillName = parts[parts.length - 2] || node.path;
    const category = parts.length > 2 ? parts.slice(0, parts.length - 2).join('/') : '';
    skills.push({
      repo: `${repoCfg.owner}/${repoCfg.repo}`,
      repo_label: repoCfg.label,
      path: node.path,
      name: skillName,
      category,
      sha: node.sha,
    });
  }
  return skills;
}

async function fetchSkillContent(repoCfg, path) {
  const url = `https://raw.githubusercontent.com/${repoCfg.owner}/${repoCfg.repo}/${repoCfg.branch}/${path}`;
  const r = await httpsGetText(url);
  if (r.status !== 200) return null;
  return r.body;
}

function parseFrontmatter(md) {
  if (!md) return { meta: {}, body: '' };
  const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.+)$/);
    if (kv) meta[kv[1].toLowerCase()] = kv[2].replace(/^['"]|['"]$/g, '').trim();
  }
  return { meta, body: m[2] };
}

async function ensureTable(bq) {
  await bq.query({
    query: `CREATE TABLE IF NOT EXISTS \`${PROJECT_ID}.${DATASET}.seo_skill_inventory\` (
      detected_at TIMESTAMP,
      repo STRING,
      name STRING,
      path STRING,
      sha STRING,
      category STRING,
      description STRING,
      is_new BOOL,
      is_updated BOOL,
      relevance STRING,
      relevance_reason STRING,
      action STRING
    )
    PARTITION BY DATE(detected_at)
    CLUSTER BY repo, name`
  });
}

async function loadLastSnapshot(bq) {
  try {
    const [rows] = await bq.query({
      query: `WITH last_run AS (
        SELECT MAX(DATE(detected_at)) AS d FROM \`${PROJECT_ID}.${DATASET}.seo_skill_inventory\`
        WHERE detected_at < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
      )
      SELECT repo, name, path, sha FROM \`${PROJECT_ID}.${DATASET}.seo_skill_inventory\`
      WHERE DATE(detected_at) = (SELECT d FROM last_run)`
    });
    const map = new Map();
    for (const r of rows) map.set(`${r.repo}::${r.path}`, r.sha);
    return map;
  } catch (e) {
    console.log('Ingen tidigare snapshot:', e.message);
    return new Map();
  }
}

async function classifyRelevance(skills, openrouterKey) {
  if (!skills.length) return [];
  // Skicka en batch så LLM kan rangordna mot varandra
  const list = skills.map((s, i) => {
    const desc = (s.description || '').slice(0, 300).replace(/\s+/g, ' ');
    return `${i + 1}. [${s.repo_label}] ${s.name}${s.category ? ` (${s.category})` : ''}: ${desc}`;
  }).join('\n');
  const prompt = `Du är CTO på Searchboost, en svensk SEO-byrå.

KONTEXT — vad vi gör:
- 8 aktiva WordPress-kunder (Rank Math för SEO)
- AI-driven SEO-optimering via OpenRouter + Claude Code
- Content-generering (artiklar, meta, schema)
- BigQuery för all kunddata
- Veckorapporter, social media, LinkedIn-publicering
- Perispa MCP-server för WordPress-arbete
- Egen Lambda-stack på AWS (autonomous-optimizer, weekly-audit, weekly-report, algorithm-watcher)

UPPGIFT: Klassificera följande Anthropic/Claude skills efter relevans för vårt tjänsteutbud:

${list}

Returnera JSON-array, ett objekt per skill i samma ordning:
{
  "index": <nummer>,
  "relevance": "install_now" | "consider" | "irrelevant",
  "reason": "<1 mening om varför>",
  "use_case": "<konkret hur vi skulle använda det, eller 'Ingen' för irrelevant>"
}

RIKTLINJER:
- install_now = direkt nytta för SEO-arbete, content, WordPress, data, kundrapporter, AI-optimering.
- consider = potentiell framtida nytta, kan testas men inte kritiskt.
- irrelevant = inte applicerbart på SEO-byrå (t.ex. spelutveckling, kemiformler, video-redigering).

Svara enbart med JSON-array, ingen markdown.`;

  const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openrouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://searchboost.se',
      'X-Title': 'Searchboost Skill Watcher'
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
    return skills.map((_, i) => ({ index: i + 1, relevance: 'consider', reason: 'LLM-fel', use_case: 'Granska manuellt' }));
  }
  const text = data.choices[0].message.content;
  try {
    return JSON.parse(text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim());
  } catch (e) {
    return skills.map((_, i) => ({ index: i + 1, relevance: 'consider', reason: 'Parse-fel', use_case: 'Granska manuellt' }));
  }
}

function buildInstallCmd(skill) {
  const repoParts = skill.repo.split('/');
  const safeName = skill.name.replace(/[^a-zA-Z0-9_-]/g, '_');
  const dirPath = skill.path.replace(/\/SKILL\.md$/i, '');
  return `mkdir -p ~/.claude/skills && cd /tmp && rm -rf sw-${safeName} && curl -sL https://github.com/${skill.repo}/archive/refs/heads/${SKILL_REPOS[0].branch}.tar.gz -o sw-${safeName}.tgz && tar -xzf sw-${safeName}.tgz && cp -r ${repoParts[1]}-${SKILL_REPOS[0].branch}/${dirPath} ~/.claude/skills/${safeName} && rm -rf sw-${safeName} sw-${safeName}.tgz && echo "Installed: ${safeName}"`;
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildEmailHtml(installNow, consider, totalSkills, newCount, updatedCount, weekLabel) {
  const installCard = (s) => `
    <div style="margin:0 0 16px;padding:14px 16px;background:#e8f5e9;border-left:3px solid #43a047;border-radius:6px">
      <div style="font-size:15px;font-weight:600;color:#1b5e20;margin-bottom:4px">${escapeHtml(s.name)} ${s.is_new ? '<span style="background:#43a047;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;margin-left:6px">NY</span>' : '<span style="background:#fb8c00;color:#fff;font-size:10px;padding:2px 6px;border-radius:3px;margin-left:6px">UPPDATERAD</span>'}</div>
      <div style="font-size:12px;color:#666;margin-bottom:6px">${escapeHtml(s.repo)}${s.category ? ' · ' + escapeHtml(s.category) : ''}</div>
      <div style="font-size:13px;color:#333;margin-bottom:6px">${escapeHtml(s.description || '(ingen beskrivning)')}</div>
      <div style="font-size:13px;color:#444;margin-bottom:8px"><strong>Varför:</strong> ${escapeHtml(s.reason)}</div>
      <div style="font-size:13px;color:#444;margin-bottom:10px"><strong>Användning hos oss:</strong> ${escapeHtml(s.use_case)}</div>
      <div style="font-size:11px;color:#999;margin-bottom:4px">Kör i terminalen:</div>
      <pre style="background:#0e0c19;color:#a5d6a7;font-size:11px;padding:10px 12px;border-radius:4px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;margin:0">${escapeHtml(buildInstallCmd(s))}</pre>
    </div>`;
  const considerCard = (s) => `
    <div style="margin:0 0 12px;padding:10px 14px;background:#f8f9fa;border-radius:6px">
      <div style="font-size:14px;font-weight:600;color:#0e0c19;margin-bottom:3px">${escapeHtml(s.name)}</div>
      <div style="font-size:12px;color:#666;margin-bottom:4px">${escapeHtml(s.repo)}</div>
      <div style="font-size:12px;color:#444">${escapeHtml(s.reason)}</div>
    </div>`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;max-width:680px;margin:0 auto;color:#0e0c19;background:#fff">
  <div style="background:#db007f;padding:24px;text-align:center">
    <h1 style="color:#fff;font-size:20px;margin:0">Claude Skills — vecko-bevakning</h1>
    <p style="color:rgba(255,255,255,0.9);margin:6px 0 0;font-size:13px">${weekLabel}</p>
  </div>
  <div style="padding:24px">
    <p style="font-size:14px;color:#666;margin:0 0 16px">Skannat ${totalSkills} skills · ${newCount} nya · ${updatedCount} uppdaterade.</p>
    ${installNow.length ? `
      <h2 style="color:#1b5e20;font-size:16px;border-bottom:2px solid #43a047;padding-bottom:6px;margin:24px 0 12px">INSTALLERA NU — ${installNow.length}</h2>
      <p style="font-size:13px;color:#666;margin:0 0 14px">Klistra in kommandot i terminalen för att installera lokalt på din Mac.</p>
      ${installNow.map(installCard).join('')}
    ` : ''}
    ${consider.length ? `
      <h2 style="color:#f57c00;font-size:16px;border-bottom:2px solid #fb8c00;padding-bottom:6px;margin:24px 0 12px">ÖVERVÄG — ${consider.length}</h2>
      ${consider.map(considerCard).join('')}
    ` : ''}
    ${!installNow.length && !consider.length ? '<p style="color:#999;font-size:14px;text-align:center;padding:24px">Inga nya eller uppdaterade skills denna vecka.</p>' : ''}
  </div>
  <div style="background:#f8f9fa;padding:14px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e8e8e8">Searchboost Skill Watcher · seo-skill-watcher Lambda</div>
</body></html>`;
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
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  const bq = new BigQuery({ projectId: 'seo-aouto' });
  const _origDs = bq.dataset.bind(bq);
  bq.dataset = (n, o = {}) => _origDs(n, { projectId, ...o });
  return { bq };
}

exports.handler = async (event) => {
  console.log('=== Skill Watcher Started ===');
  const force = event && event.force === true;

  const { bq } = await getBigQuery();
  await ensureTable(bq);

  // Dedup per ISO-vecka
  if (!force) {
    try {
      const [existing] = await bq.query({
        query: `SELECT COUNT(*) as cnt FROM \`${PROJECT_ID}.${DATASET}.seo_skill_inventory\`
                WHERE EXTRACT(ISOWEEK FROM DATETIME(detected_at, 'Europe/Stockholm'))
                    = EXTRACT(ISOWEEK FROM DATETIME(CURRENT_TIMESTAMP(), 'Europe/Stockholm'))
                AND EXTRACT(ISOYEAR FROM DATETIME(detected_at, 'Europe/Stockholm'))
                    = EXTRACT(ISOYEAR FROM DATETIME(CURRENT_TIMESTAMP(), 'Europe/Stockholm'))`
      });
      if (existing[0] && Number(existing[0].cnt) > 0) {
        console.log('Redan körd denna vecka — avbryter');
        return { statusCode: 200, body: 'already_run_this_week' };
      }
    } catch (e) { console.log('Dedup-fel (ignoreras):', e.message); }
  }

  // 1. Hämta alla skills från alla repos
  const allSkills = [];
  for (const repoCfg of SKILL_REPOS) {
    console.log(`Listar skills i ${repoCfg.label}…`);
    const skills = await listAllSkills(repoCfg);
    console.log(`  ${skills.length} skills hittade`);
    allSkills.push(...skills.map(s => ({ ...s, _repoCfg: repoCfg })));
  }

  // 2. Jämför mot förra snapshotten
  const lastSnap = await loadLastSnapshot(bq);
  for (const s of allSkills) {
    const key = `${s.repo}::${s.path}`;
    const prevSha = lastSnap.get(key);
    s.is_new = !prevSha;
    s.is_updated = prevSha && prevSha !== s.sha;
  }
  const changedSkills = allSkills.filter(s => s.is_new || s.is_updated);
  console.log(`Förändringar: ${changedSkills.filter(s => s.is_new).length} nya, ${changedSkills.filter(s => s.is_updated).length} uppdaterade`);

  // 3. Hämta SKILL.md-innehåll för ändrade skills
  for (const s of changedSkills) {
    const md = await fetchSkillContent(s._repoCfg, s.path);
    const { meta, body } = parseFrontmatter(md);
    s.description = meta.description || meta.name || body.split('\n').find(l => l.trim().length > 20) || '';
    s.description = s.description.slice(0, 400);
  }

  // 4. LLM-klassificering av enbart ändrade
  let classifications = [];
  if (changedSkills.length > 0) {
    try {
      const openrouterKey = await getParam('/seo-mcp/openrouter/api-key');
      classifications = await classifyRelevance(changedSkills, openrouterKey);
    } catch (e) {
      console.error('Klassificeringsfel:', e.message);
    }
  }

  // 5. Para ihop
  for (let i = 0; i < changedSkills.length; i++) {
    const c = classifications.find(x => Number(x.index) === i + 1) || { relevance: 'consider', reason: 'Ej klassificerad', use_case: 'Granska manuellt' };
    changedSkills[i].relevance = c.relevance;
    changedSkills[i].reason = c.reason;
    changedSkills[i].use_case = c.use_case;
  }

  // 6. Logga ALLA skills (snapshot) + relevansdata för ändrade
  const detectedAt = new Date().toISOString();
  const rows = allSkills.map(s => {
    const ch = changedSkills.find(c => c.path === s.path && c.repo === s.repo);
    return {
      detected_at: detectedAt,
      repo: s.repo,
      name: s.name,
      path: s.path,
      sha: s.sha,
      category: s.category || '',
      description: (ch && ch.description) || '',
      is_new: !!s.is_new,
      is_updated: !!s.is_updated,
      relevance: (ch && ch.relevance) || 'unchanged',
      relevance_reason: (ch && ch.reason) || '',
      action: (ch && ch.use_case) || ''
    };
  });
  try { await bq.dataset(DATASET).table('seo_skill_inventory').insert(rows); }
  catch (e) { console.error('BQ insert fel:', e.message); }

  // 7. Mejla Mikael
  const installNow = changedSkills.filter(s => s.relevance === 'install_now');
  const consider = changedSkills.filter(s => s.relevance === 'consider');
  const newCount = changedSkills.filter(s => s.is_new).length;
  const updatedCount = changedSkills.filter(s => s.is_updated).length;

  if (installNow.length > 0 || consider.length > 0 || force) {
    try {
      const emailFrom = process.env.EMAIL_FROM || await getParam('/seo-mcp/email/from');
      const recipients = (await getParam('/seo-mcp/email/recipients')).split(',').map(e => e.trim());
      const today = new Date();
      const weekNum = Math.ceil((today - new Date(today.getFullYear(), 0, 1)) / (7 * 86400000));
      const subject = `[Skills] V${weekNum} — ${installNow.length} att installera, ${consider.length} att överväga`;
      const html = buildEmailHtml(installNow, consider, allSkills.length, newCount, updatedCount, `Vecka ${weekNum} · ${today.toISOString().slice(0, 10)}`);
      await sendEmail(recipients, emailFrom, subject, html);
      console.log('Mejl skickat');
    } catch (e) { console.error('Mejl-fel:', e.message); }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      total_skills: allSkills.length,
      new: newCount,
      updated: updatedCount,
      install_now: installNow.length,
      consider: consider.length
    })
  };
};
