#!/usr/bin/env node
/**
 * Qualify Leads — Searchboost Lead Pipeline
 *
 * Kör hela lead-kvalificeringsprocessen i två faser:
 *
 *   FAS 1 (snabb): Hämtar SE Ranking-data + sitemap per domän
 *                  → Rankar alla domäner på organic gap + trend
 *                  → Sparar checkpoint löpande
 *
 *   FAS 2 (djup):  Crawlar topp-N domäner för kontaktinfo + SEO-hygien
 *                  → Beräknar composite score (organic + hygiene + trend)
 *                  → Sparar rapport per domän + ringlistor + pipeline.csv
 *
 * Användning:
 *   node qualify-leads.js                            # Kör allt (859 domäner)
 *   node qualify-leads.js --top 50                   # Bara crawl av topp 50
 *   node qualify-leads.js --csv export.csv           # Med SE Ranking CSV-export
 *   node qualify-leads.js --resume                   # Fortsätt från checkpoint
 *   node qualify-leads.js --phase1-only              # Bara fas 1
 *   node qualify-leads.js --phase2-only              # Bara fas 2 (kräver checkpoint)
 *   node qualify-leads.js --concurrency 5            # Parallella anrop (default: 4)
 *   node qualify-leads.js --min-score 40             # Minimiscore för rapport
 *
 * Output:
 *   docs/leads/qualify-checkpoint.json   Löpande status + SE Ranking data
 *   docs/leads/qualify-results.json      Slutresultat med composite scoring
 *   docs/leads/qualify-ringlista.md      Ringlista toppledd med kontaktinfo
 *   docs/leads/pipeline.csv              Uppdateras med alla domains
 *   docs/leads/[domain]-[datum].md       Individuella rapporter
 */

'use strict';
const fs   = require('fs');
const path = require('path');
const url  = require('url');
const https = require('https');
const http  = require('http');
const { enrichDomain, parseSERankingCSV, calcCompositeScore } = require('./seranking-enricher');

// ── Konfiguration ─────────────────────────────────────────────────────────────
const DOMAINS_FILE    = path.join(__dirname, 'hubspot-domains.txt');
const OUTPUT_DIR      = path.join(__dirname, '..', 'docs', 'leads');
const CHECKPOINT_FILE = path.join(OUTPUT_DIR, 'qualify-checkpoint.json');
const RESULTS_FILE    = path.join(OUTPUT_DIR, 'qualify-results.json');
const RINGLISTA_FILE  = path.join(OUTPUT_DIR, 'qualify-ringlista.md');
const PIPELINE_FILE   = path.join(OUTPUT_DIR, 'pipeline.csv');

const PAGES_TO_CRAWL  = ['/', '/om-oss', '/om', '/about', '/kontakt', '/contact'];
const DELAY_API_MS    = 1200;   // fördröjning mellan API-anrop fas 1
const DELAY_CRAWL_MS  = 2000;   // fördröjning mellan crawl-anrop fas 2
const DEFAULT_TOP     = 80;     // antal domäner att djupcrawla i fas 2
const DEFAULT_CONC    = 4;      // parallella anrop
const DEFAULT_MIN     = 40;     // minsta composite score för ringlista

// ── CLI-parsning ──────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const o = {
    csvFile:     null,
    top:         DEFAULT_TOP,
    concurrency: DEFAULT_CONC,
    minScore:    DEFAULT_MIN,
    resume:      false,
    phase1Only:  false,
    phase2Only:  false,
  };
  for (let i = 0; i < args.length; i++) {
    if      (args[i] === '--csv')         o.csvFile     = args[++i];
    else if (args[i] === '--top')         o.top         = parseInt(args[++i], 10) || DEFAULT_TOP;
    else if (args[i] === '--concurrency') o.concurrency = parseInt(args[++i], 10) || DEFAULT_CONC;
    else if (args[i] === '--min-score')   o.minScore    = parseInt(args[++i], 10) || DEFAULT_MIN;
    else if (args[i] === '--resume')      o.resume      = true;
    else if (args[i] === '--phase1-only') o.phase1Only  = true;
    else if (args[i] === '--phase2-only') o.phase2Only  = true;
  }
  return o;
}

const CLI = parseArgs(process.argv);

// ── HTTP-hämtning (crawl) ─────────────────────────────────────────────────────
function fetchUrl(targetUrl, redirectCount = 0) {
  return new Promise((resolve) => {
    if (redirectCount > 5) return resolve({ status: 0, html: '', url: targetUrl });
    const parsed = url.parse(targetUrl);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const opts   = {
      hostname: parsed.hostname,
      path:     parsed.path || '/',
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      method:   'GET',
      timeout:  10000,
      headers:  {
        'User-Agent': 'Mozilla/5.0 (compatible; SearchboostBot/1.0; +https://searchboost.se/bot)',
        'Accept':     'text/html,application/xhtml+xml',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8',
      },
    };
    let resolved = false;
    const done = (result) => {
      if (!resolved) { resolved = true; clearTimeout(wallClock); resolve(result); }
    };
    // Wall-clock timeout 12s — avbryter även om servern håller kopplingen öppen
    const wallClock = setTimeout(() => {
      try { req.destroy(); } catch (_) {}
      done({ status: 0, html: '', url: targetUrl });
    }, 12000);
    const req = lib.request(opts, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redir = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.protocol}//${parsed.hostname}${res.headers.location}`;
        res.resume(); // töm svaret för att frigöra socket
        if (redirectCount < 3) {
          // Yttre wallClock fortsätter gälla — done() anropas av den som vinner
          fetchUrl(redir, redirectCount + 1).then(done).catch(() => done({ status: 0, html: '', url: targetUrl }));
        } else {
          done({ status: 0, html: '', url: targetUrl });
        }
        return;
      }
      let html = '';
      res.setEncoding('utf8');
      res.on('data', c => { html += c; if (html.length > 300000) res.destroy(); });
      res.on('end',  () => done({ status: res.statusCode, html, url: targetUrl }));
      res.on('error', () => done({ status: 0, html: '', url: targetUrl }));
    });
    req.on('timeout', () => { req.destroy(); done({ status: 0, html: '', url: targetUrl }); });
    req.on('error',   () => done({ status: 0, html: '', url: targetUrl }));
    req.end();
  });
}

// ── Text-hjälpare ─────────────────────────────────────────────────────────────
function stripTags(html) { return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ── SEO-hygien-analys ─────────────────────────────────────────────────────────
function analyzeSEO(html) {
  const issues = [];
  let total = 0, max = 0;

  function check(cond, issue, impact) {
    max += impact;
    if (cond) { issues.push({ issue, impact }); total += impact; }
  }

  const titleM = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title  = titleM ? titleM[1].trim() : '';
  check(!title,                              'Saknar title-tagg',               10);
  check(title && title.length > 70,          `Title för lång (${title.length}c)`, 5);
  check(title && title.length > 0 && title.length < 20, `Title för kort`,       5);

  const descM = html.match(/<meta[^>]+name=['"]description['"][^>]+content=['"]([^'"]*)['"]/i)
             || html.match(/<meta[^>]+content=['"]([^'"]*)['"'][^>]+name=['"]description['"]/i);
  const desc  = descM ? descM[1].trim() : '';
  check(!desc,                    'Saknar meta description',         8);
  check(desc && desc.length > 170, `Description för lång`,           4);

  const h1 = (html.match(/<h1/gi) || []).length;
  check(h1 === 0,  'Saknar H1-rubrik',                          9);
  check(h1 > 1,   `Flera H1-rubriker (${h1} st)`,              5);

  check(!/application\/ld\+json/i.test(html), 'Saknar schema.org markup',         7);
  check(!/rel=['"]canonical['"]/i.test(html), 'Saknar canonical',                 6);
  check(!/name=['"]viewport['"]/i.test(html), 'Saknar viewport',                  7);

  const allImgs   = (html.match(/<img[^>]*>/gi) || []).length;
  const noAltImgs = (html.match(/<img(?![^>]*alt=['"][^'"]+['"])[^>]*>/gi) || []).length;
  if (allImgs > 0) check(noAltImgs > 0, `${noAltImgs}/${allImgs} bilder utan alt`, Math.min(noAltImgs * 2, 8));

  const words = extractText(html).split(/\s+/).filter(Boolean).length;
  check(words < 300, `Tunt innehåll (${words} ord)`, 8);

  const hygieneScore = max > 0 ? Math.min(Math.round((total / max) * 100), 100) : 0;
  return { issues, hygieneScore, title, desc, h1count: h1, wordCount: words };
}

// ── Kontaktskrapning ──────────────────────────────────────────────────────────
function scrapeContact(html, pageUrl) {
  const text   = stripTags(html);
  // Avkoda HTML-entiteter i mailto-adresser (&#105;&#110;... → info@...)
  const decodeEntities = (s) => s
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&amp;/gi, '&').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>');
  const emails = [...new Set([
    ...(html.match(/href="mailto:([^"]+)"/gi) || [])
      .map(m => decodeEntities(m.match(/mailto:([^"]+)/i)?.[1] || ''))
      .map(e => e.split('?')[0].split('&')[0].trim())  // ta bort ?subject=... efteråt
      .filter(Boolean),
    ...(text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || []),
  ])].filter(e => !e.includes('example') && !e.includes('sentry') && !e.includes('domain') && e.includes('@'));

  const phones = [...new Set(
    (text.match(/(?:tel:|phone:|\+46|0046|07\d|08\d|0[1-9]\d)[\s\d\-]{6,15}/gi) || [])
      .map(p => p.replace(/\s+/g, ' ').trim())
  )];

  const names = [];
  if (/\/om|\/about|\/kontakt|\/team/i.test(pageUrl)) {
    for (const m of (html.matchAll(/<h[12][^>]*>([^<]{5,60})<\/h[12]>/gi) || [])) {
      const t = stripTags(m[1]).trim();
      if (/^[A-ZÅÄÖ][a-zåäö]+ [A-ZÅÄÖ][a-zåäö]+$/.test(t)) names.push(t);
    }
  }
  return { emails, phones, names: [...new Set(names)] };
}

// ── Checkpoint-hantering ──────────────────────────────────────────────────────
function loadCheckpoint() {
  if (fs.existsSync(CHECKPOINT_FILE)) {
    try { return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8')); }
    catch (_) {}
  }
  return { phase1: {}, phase2: {}, completed_phase1: [], completed_phase2: [], createdAt: new Date().toISOString() };
}

function saveCheckpoint(cp) {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(cp, null, 2), 'utf8');
}

// ── Pipeline CSV ──────────────────────────────────────────────────────────────
function ensurePipelineHeader() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(PIPELINE_FILE)) {
    fs.writeFileSync(PIPELINE_FILE,
      'domain,name,email,phone,composite_score,level,organic_keywords,organic_traffic,kw_per_page,trend_score,issues,mail_sent,sent_at,call_after,status\n',
      'utf8');
  }
}

function appendToPipeline(entry) {
  ensurePipelineHeader();
  const callAfter = new Date();
  callAfter.setDate(callAfter.getDate() + 2);

  const row = [
    entry.domain,
    entry.name         || '',
    entry.email        || '',
    entry.phone        || '',
    entry.score        || 0,
    entry.level        || '',
    entry.organic_keywords || 0,
    entry.organic_traffic  || 0,
    entry.kw_per_page  || 0,
    entry.trend_score  || 0,
    entry.issues_count || 0,
    'nej',
    '',
    callAfter.toISOString().split('T')[0],
    'ny',
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');

  fs.appendFileSync(PIPELINE_FILE, row + '\n', 'utf8');
}

// ── Parallell körning med begränsat antal ─────────────────────────────────────
async function runConcurrent(tasks, concurrency, fn) {
  const results = [];
  let index     = 0;

  async function worker() {
    while (index < tasks.length) {
      const i    = index++;
      const task = tasks[i];
      try {
        const r = await fn(task, i, tasks.length);
        results.push(r);
      } catch (err) {
        console.error(`  Fel vid ${task}: ${err.message}`);
        results.push({ domain: task, error: err.message });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, tasks.length) }, worker));
  return results;
}

// ── FAS 1: SE Ranking + Sitemap för alla domäner ──────────────────────────────
async function runPhase1(domains, checkpoint, csvData) {
  const remaining = domains.filter(d => !checkpoint.completed_phase1.includes(d));
  console.log(`\nFAS 1 — SE Ranking + Sitemap`);
  console.log(`Totalt: ${domains.length} | Kvar: ${remaining.length} | Klara: ${checkpoint.completed_phase1.length}`);
  if (remaining.length === 0) { console.log('Fas 1 redan klar.'); return checkpoint; }

  let processed = 0;
  for (const domain of remaining) {
    try {
      process.stdout.write(`  [${++processed}/${remaining.length}] ${domain.padEnd(40)}`);
      const data = await enrichDomain(domain, { csvData: csvData || null });
      checkpoint.phase1[domain] = data;
      checkpoint.completed_phase1.push(domain);

      const pages = data.pages_indexed || 1;
      const kpp   = data.organic_keywords > 0 ? Math.round((data.organic_keywords / pages) * 10) / 10 : 0;
      const api   = data.api_available ? 'API' : 'MAP';
      process.stdout.write(` kw=${data.organic_keywords} tr=${data.organic_traffic} p=${pages} kw/p=${kpp} [${api}]\n`);

      // Spara checkpoint varje 10 domäner
      if (processed % 10 === 0) saveCheckpoint(checkpoint);
    } catch (err) {
      process.stdout.write(` FEL: ${err.message}\n`);
      checkpoint.phase1[domain] = { domain, error: err.message, organic_keywords: 0, organic_traffic: 0, pages_indexed: 0 };
      checkpoint.completed_phase1.push(domain);
    }

    await new Promise(r => setTimeout(r, DELAY_API_MS));
  }

  saveCheckpoint(checkpoint);
  console.log(`\nFas 1 klar — ${domains.length} domäner bearbetade.`);
  return checkpoint;
}

// ── Ranka domäner efter organic gap (fas 1-data) ──────────────────────────────
function rankByOrganicGap(checkpoint) {
  return Object.values(checkpoint.phase1)
    .filter(d => !d.error)
    .map(d => {
      const pages = Math.max(d.pages_indexed || d.sitemap_pages || 1, 1);
      const hasApiData = d.api_available && d.organic_keywords > 0;

      let preScore;
      let kw_per_page = 0;

      if (hasApiData) {
        // Med SE Ranking-data: ranka på organic gap + traffic quality + trend
        const kwPP    = d.organic_keywords / pages;
        const tPK     = d.organic_keywords > 0 ? d.organic_traffic / d.organic_keywords : 0;
        const orgGap  = Math.min(100, Math.round(Math.max(0, 1 - kwPP / 15)  * 100));
        const trafQ   = Math.min(100, Math.round(Math.max(0, 1 - tPK / 0.5)  * 100));
        const trend   = d.trend_score || 0;
        preScore      = Math.round(orgGap * 0.50 + trafQ * 0.35 + trend * 0.15);
        kw_per_page   = Math.round(kwPP * 10) / 10;
      } else {
        // Utan API-data: ranka på webbplatsstorlek (fler sidor = mer potential att optimera)
        // Normalisera sitemap-sidor mot ett max på 1000 → score 0-50
        const siteSize = d.sitemap_pages || d.pages_indexed || 0;
        preScore  = Math.min(50, Math.round((siteSize / 1000) * 50));
        kw_per_page = 0;
      }

      return { ...d, pre_score: preScore, kw_per_page, has_api_data: hasApiData };
    })
    .sort((a, b) => {
      // Domäner med API-data före de utan
      if (a.has_api_data !== b.has_api_data) return a.has_api_data ? -1 : 1;
      return b.pre_score - a.pre_score;
    });
}

// ── FAS 2: Djupcrawl av topp-N ────────────────────────────────────────────────
async function runPhase2(topDomains, checkpoint) {
  const remaining = topDomains.filter(d => !checkpoint.completed_phase2.includes(d));
  console.log(`\nFAS 2 — Djupcrawl (kontakt + hygien)`);
  console.log(`Totalt: ${topDomains.length} | Kvar: ${remaining.length} | Klara: ${checkpoint.completed_phase2.length}`);
  if (remaining.length === 0) { console.log('Fas 2 redan klar.'); return checkpoint; }

  let processed = 0;
  for (const domain of remaining) {
    const seData = checkpoint.phase1[domain] || {};
    process.stdout.write(`  [${++processed}/${remaining.length}] ${domain.padEnd(40)}`);

    try {
      const base         = `https://${domain}`;
      const pages        = {};
      const contacts     = [];
      const seoResults   = {};

      for (const slug of PAGES_TO_CRAWL) {
        const { status, html, url: finalUrl } = await Promise.race([
          fetchUrl(`${base}${slug}`),
          new Promise(r => setTimeout(() => r({ status: 0, html: '', url: `${base}${slug}` }), 10000)),
        ]);
        if (status === 200 && html.length > 500) {
          pages[slug] = { html, url: finalUrl };
          contacts.push(scrapeContact(html, finalUrl));
          seoResults[slug] = analyzeSEO(html);
        }
      }

      if (Object.keys(pages).length === 0) {
        process.stdout.write(` OFFLINE\n`);
        checkpoint.phase2[domain] = { domain, offline: true };
        checkpoint.completed_phase2.push(domain);
        continue;
      }

      // Aggregera kontaktinfo
      const emails = [...new Set(contacts.flatMap(c => c.emails))];
      const phones = [...new Set(contacts.flatMap(c => c.phones))].slice(0, 3);
      const names  = [...new Set(contacts.flatMap(c => c.names))].slice(0, 3);

      // Hygien-score
      const allIssues = [];
      for (const [, seo] of Object.entries(seoResults)) {
        for (const iss of seo.issues) {
          if (!allIssues.find(i => i.issue === iss.issue)) allIssues.push(iss);
        }
      }
      allIssues.sort((a, b) => b.impact - a.impact);
      const hygieneRaw   = allIssues.reduce((s, i) => s + i.impact, 0);
      const hygieneScore = Math.min(Math.round((hygieneRaw / 100) * 100), 100);

      // Composite score
      const enriched = { ...seData, hygiene_score: hygieneScore };
      const scoring  = calcCompositeScore(enriched);

      checkpoint.phase2[domain] = {
        domain, emails, phones, names, allIssues, hygieneScore,
        composite: scoring.composite,
        level:     scoring.level,
        label:     scoring.label,
        components: scoring.components,
        ratios:    scoring.ratios,
        pages_crawled: Object.keys(pages).length,
      };
      checkpoint.completed_phase2.push(domain);

      process.stdout.write(` score=${scoring.composite} (${scoring.level}) email=${emails[0] || '—'}\n`);

      // Spara checkpoint varje 5 domäner
      if (processed % 5 === 0) saveCheckpoint(checkpoint);

      await new Promise(r => setTimeout(r, DELAY_CRAWL_MS));
    } catch (err) {
      process.stdout.write(` FEL: ${err.message}\n`);
      checkpoint.phase2[domain] = { domain, error: err.message };
      checkpoint.completed_phase2.push(domain);
    }
  }

  saveCheckpoint(checkpoint);
  console.log(`\nFas 2 klar.`);
  return checkpoint;
}

// ── Bygg rapport per domän ────────────────────────────────────────────────────
function buildDomainReport(se, crawl, minScore) {
  if (!crawl || crawl.offline || crawl.error) return null;

  const date       = new Date().toISOString().split('T')[0];
  const domain     = se.domain || crawl.domain;
  const emails     = crawl.emails  || [];
  const phones     = crawl.phones  || [];
  const names      = crawl.names   || [];
  const issues     = crawl.allIssues || [];
  const composite  = crawl.composite || 0;
  const level      = crawl.label    || '';

  if (composite < minScore) return null;

  // Mailtext
  const firstName = names[0] ? names[0].split(' ')[0] : null;
  const greeting  = firstName ? `Hej ${firstName},` : 'Hej,';
  const topIssues = issues.slice(0, 4).map((i, n) => `${n + 1}. ${i.issue}`).join('\n');
  const mailBody  = `Ämne: En snabb analys av ${domain}

${greeting}

Jag har försökt nå dig men inte lyckats. Jag var inne på er hemsida och såg att det saknas en del hygienfaktorer som gör att er synlighet hämmas på Google.

Jag tog mig friheten att göra en snabb analys & åtgärdsplan för att visa vad ni bör fixa för att tillfredsställa Google. Här är de viktigaste fynden:

${topIssues}

Totalt ${issues.length} förbättringsmöjligheter — ni tappar trafik varje dag dessa inte är åtgärdade.

Hoppas det var OK att höra av mig. Svara gärna på detta mail eller ring mig så berättar jag mer.

Med vänliga hälsningar,
Mikael Larsson
Searchboost — https://searchboost.se`;

  const report = `# Lead-rapport: ${domain}
Genererad: ${date}

## Sammanfattning
- **Domän**: ${domain}
- **Composite score**: ${composite}/100 (${level})
- **SE Ranking data**: ${se.organic_keywords || 0} keywords | ${se.organic_traffic || 0} klick/mån | DT ${se.domain_trust || 0}
- **Sidor**: ${se.pages_indexed || se.sitemap_pages || '?'} indexerade
- **KW/sida**: ${crawl.ratios?.kw_per_page || '?'} (benchmark: 15+)
- **Trafik/KW**: ${crawl.ratios?.traffic_per_kw || '?'} (benchmark: 0.5+)
- **Trafik-trend**: ${se.decline_36m > 0 ? `-${se.decline_36m}% senaste 36M` : 'okänd'}

## Scoring-komponenter
| Komponent       | Score | Vikt |
|-----------------|-------|------|
| organic_gap     | ${crawl.components?.organic_gap || 0}/100 | 35% |
| hygiene_gap     | ${crawl.components?.hygiene_gap || 0}/100 | 25% |
| traffic_quality | ${crawl.components?.traffic_quality || 0}/100 | 25% |
| trend_penalty   | ${crawl.components?.trend_penalty || 0}/100 | 15% |

## Kontaktinfo
- **Namn**: ${names.join(', ')    || '— (ej hittad)'}
- **E-post**: ${emails.join(', ') || '— (ej hittad)'}
- **Telefon**: ${phones.join(', ')|| '— (ej hittad)'}

## SEO-problem (prioritetsordning)
${issues.slice(0, 10).map((i, n) => `${n + 1}. **[${i.impact}p]** ${i.issue}`).join('\n') || 'Inga problem hittade'}

---

## Förberedd mailtext

${mailBody}

---
`;

  return { report, mailBody, composite, level };
}

// ── Bygg ringlistor ───────────────────────────────────────────────────────────
function buildRinglista(checkpoint, topN = 50) {
  const date   = new Date().toISOString().split('T')[0];
  const items  = [];

  for (const [domain, crawl] of Object.entries(checkpoint.phase2)) {
    if (!crawl || crawl.offline || crawl.error) continue;
    const se = checkpoint.phase1[domain] || {};
    items.push({
      domain,
      composite:        crawl.composite || 0,
      level:            crawl.level     || 'LAG',
      label:            crawl.label     || '',
      email:            (crawl.emails  || [])[0] || '',
      phone:            (crawl.phones  || [])[0] || '',
      name:             (crawl.names   || [])[0] || '',
      organic_keywords: se.organic_keywords || 0,
      organic_traffic:  se.organic_traffic  || 0,
      domain_trust:     se.domain_trust     || 0,
      kw_per_page:      crawl.ratios?.kw_per_page || 0,
      trend_decline:    se.decline_36m || 0,
      issues_count:     (crawl.allIssues || []).length,
    });
  }

  items.sort((a, b) => b.composite - a.composite);
  const top  = items.slice(0, topN);
  const high = top.filter(i => i.level === 'HOG');
  const mid  = top.filter(i => i.level === 'MEDEL');

  const callDate = new Date(); callDate.setDate(callDate.getDate() + 2);
  const callStr  = callDate.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  let md = `# Ringlista — Searchboost Leads
Genererad: ${date} | Ringdatum: ${callStr}

**Totalt i pipeline:** ${items.length} domäner
**Hög potential (HOG):** ${items.filter(i => i.level === 'HOG').length} st
**Medel potential:** ${items.filter(i => i.level === 'MEDEL').length} st
**Visar topp:** ${Math.min(topN, items.length)} st

---

## HOG POTENTIAL (${high.length} st)

`;

  if (high.length > 0) {
    md += `| # | Domän | Score | KW | Trafik | KW/sida | Trend | Kontakt | Issues |\n`;
    md += `|---|-------|-------|----|----|---------|-------|---------|--------|\n`;
    high.forEach((r, i) => {
      const trend = r.trend_decline > 0 ? `-${r.trend_decline}%` : '–';
      const contact = r.name ? `${r.name.split(' ')[0]}` : (r.email ? r.email.split('@')[0] : '–');
      md += `| ${i+1} | [${r.domain}](https://${r.domain}) | **${r.composite}** | ${r.organic_keywords} | ${r.organic_traffic} | ${r.kw_per_page} | ${trend} | ${contact} | ${r.issues_count} |\n`;
    });
  }

  md += `\n## MEDEL POTENTIAL (${mid.length} st)\n\n`;
  if (mid.length > 0) {
    md += `| # | Domän | Score | KW | Trafik | KW/sida | Kontakt |\n`;
    md += `|---|-------|-------|----|--------|---------|--------|\n`;
    mid.forEach((r, i) => {
      const contact = r.name ? `${r.name.split(' ')[0]}` : (r.email ? r.email.split('@')[0] : '–');
      md += `| ${i+1} | [${r.domain}](https://${r.domain}) | ${r.composite} | ${r.organic_keywords} | ${r.organic_traffic} | ${r.kw_per_page} | ${contact} |\n`;
    });
  }

  md += `\n---\n\n## Detaljerad ringlista (med kontaktinfo)\n\n`;
  top.forEach((r, i) => {
    const nextCall = new Date(); nextCall.setDate(nextCall.getDate() + 2);
    const d = nextCall.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
    md += `### ${i+1}. ${r.domain} — Score ${r.composite}/100 (${r.label})\n`;
    md += `- **Ring**: ${d}\n`;
    md += `- **Kontakt**: ${r.name || '—'}\n`;
    md += `- **E-post**: ${r.email || '—'}\n`;
    md += `- **Telefon**: ${r.phone || '—'}\n`;
    md += `- **KW**: ${r.organic_keywords} | **Trafik**: ${r.organic_traffic}/mån | **KW/sida**: ${r.kw_per_page}\n`;
    if (r.trend_decline > 0) md += `- **Trafik-nedgång 36M**: -${r.trend_decline}%\n`;
    md += `\n`;
  });

  return { md, items, top, high, mid };
}

// ── Main ──────────────────────────────────────────────────────────────────────
(async () => {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  ensurePipelineHeader();

  // Läs domäner
  if (!fs.existsSync(DOMAINS_FILE)) {
    console.error(`Filen ${DOMAINS_FILE} hittades inte.`);
    process.exit(1);
  }
  const allDomains = fs.readFileSync(DOMAINS_FILE, 'utf8')
    .split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  console.log(`Leadpipeline startad — ${allDomains.length} domäner från ${path.basename(DOMAINS_FILE)}`);

  // Ladda SE Ranking CSV om given
  let csvData = null;
  if (CLI.csvFile) {
    if (!fs.existsSync(CLI.csvFile)) {
      console.error(`CSV-filen hittades inte: ${CLI.csvFile}`);
      process.exit(1);
    }
    csvData = parseSERankingCSV(CLI.csvFile);
    console.log(`CSV-data laddad: ${Object.keys(csvData).length} domäner`);
  }

  // Ladda/skapa checkpoint
  let checkpoint = CLI.resume ? loadCheckpoint() : loadCheckpoint();
  if (!CLI.resume && !CLI.phase2Only) {
    // Rensa fas1-data om vi kör om utan resume
    const freshStart = checkpoint.completed_phase1.length === 0;
    if (!freshStart) {
      console.log(`Återanvänder checkpoint (${checkpoint.completed_phase1.length} fas1 klara, ${checkpoint.completed_phase2.length} fas2 klara).`);
      console.log(`Tips: --resume för att fortsätta, annars startar fas1 om med befintliga data.`);
    }
  }

  // FAS 1
  if (!CLI.phase2Only) {
    checkpoint = await runPhase1(allDomains, checkpoint, csvData);
  }

  // Ranka och välj topp för fas 2
  const ranked     = rankByOrganicGap(checkpoint);
  const topDomains = ranked.slice(0, CLI.top).map(d => d.domain);

  console.log(`\nRanking klar — topp ${topDomains.length} domäner valda för djupcrawl`);
  if (ranked.length > 0) {
    console.log('Topp 10 efter organic gap:');
    ranked.slice(0, 10).forEach((d, i) =>
      console.log(`  ${i+1}. ${d.domain.padEnd(40)} pre_score=${d.pre_score} kw=${d.organic_keywords} kw/p=${d.kw_per_page}`)
    );
  }

  // FAS 2
  if (!CLI.phase1Only) {
    checkpoint = await runPhase2(topDomains, checkpoint);
  }

  // Bygg slutresultat
  const date = new Date().toISOString().split('T')[0];
  let reportCount = 0;

  for (const domain of topDomains) {
    const se    = checkpoint.phase1[domain] || {};
    const crawl = checkpoint.phase2[domain];
    if (!crawl) continue;

    // Pipeline CSV
    appendToPipeline({
      domain,
      name:             (crawl.names  || [])[0] || '',
      email:            (crawl.emails || [])[0] || '',
      phone:            (crawl.phones || [])[0] || '',
      score:            crawl.composite || 0,
      level:            crawl.level     || '',
      organic_keywords: se.organic_keywords || 0,
      organic_traffic:  se.organic_traffic  || 0,
      kw_per_page:      crawl.ratios?.kw_per_page || 0,
      trend_score:      se.trend_score || 0,
      issues_count:     (crawl.allIssues || []).length,
    });

    // Individuell rapport (bara om score >= minScore)
    const r = buildDomainReport(se, crawl, CLI.minScore);
    if (r) {
      const outFile = path.join(OUTPUT_DIR, `${domain}-${date}.md`);
      fs.writeFileSync(outFile, r.report, 'utf8');
      reportCount++;
    }
  }

  // Ringlistor
  const { md: ringMd, items, top, high, mid } = buildRinglista(checkpoint, CLI.top);
  fs.writeFileSync(RINGLISTA_FILE, ringMd, 'utf8');

  // Sammanfattning JSON
  const summary = {
    generated: new Date().toISOString(),
    domains_total:   allDomains.length,
    phase1_completed: checkpoint.completed_phase1.length,
    phase2_completed: checkpoint.completed_phase2.length,
    top_results:     top.length,
    high_potential:  high.length,
    mid_potential:   mid.length,
    reports_saved:   reportCount,
    top50: top.slice(0, 50).map(r => ({
      domain: r.domain, composite: r.composite, level: r.level,
      email: r.email, phone: r.phone, name: r.name,
      organic_keywords: r.organic_keywords, organic_traffic: r.organic_traffic,
    })),
  };
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(summary, null, 2), 'utf8');

  // Slutsammanfattning
  console.log('\n' + '═'.repeat(60));
  console.log('QUALIFY-LEADS — KLAR');
  console.log('═'.repeat(60));
  console.log(`Domäner fas 1:      ${checkpoint.completed_phase1.length}/${allDomains.length}`);
  console.log(`Domäner fas 2:      ${checkpoint.completed_phase2.length}`);
  console.log(`HOG potential:      ${high.length} st`);
  console.log(`MEDEL potential:    ${mid.length} st`);
  console.log(`Rapporter sparade:  ${reportCount} st (score >= ${CLI.minScore})`);
  console.log('─'.repeat(60));
  console.log(`Ringlista:          ${RINGLISTA_FILE}`);
  console.log(`Pipeline CSV:       ${PIPELINE_FILE}`);
  console.log(`Resultat JSON:      ${RESULTS_FILE}`);
  console.log(`Checkpoint:         ${CHECKPOINT_FILE}`);
  console.log('═'.repeat(60));

  if (top.length > 0) {
    console.log('\nTOPP 10 LEADS:');
    top.slice(0, 10).forEach((r, i) => {
      const contact = r.phone || r.email || '—';
      console.log(`  ${i+1}. ${r.domain.padEnd(38)} ${r.composite}/100 | ${contact}`);
    });
  }
})();
