#!/usr/bin/env node
/**
 * Searchboost Lead Generator v3 — med SE Ranking composite scoring
 *
 * Enkelt läge:   node scripts/lead-generator.js example.se
 * Bulk-läge:     node scripts/lead-generator.js --bulk domains.txt
 * Med SE Ranking CSV: node scripts/lead-generator.js --bulk domains.txt --seranking-csv export.csv
 * Med utskick:   node scripts/lead-generator.js --bulk domains.txt --send
 * Bekräfta inte: node scripts/lead-generator.js --bulk domains.txt --send --yes
 * Min poäng:     node scripts/lead-generator.js --bulk domains.txt --send --min-score 40
 * Output-mapp:   node scripts/lead-generator.js example.se --output docs/leads/
 *
 * Composite scoring (0-100):
 *   hygiene_gap     × 0.25  (tekniska SEO-problem från crawl)
 *   organic_gap     × 0.35  (kw/sida vs benchmark 15)
 *   traffic_quality × 0.25  (trafik/kw vs benchmark 0.5)
 *   trend_penalty   × 0.15  (trafik-nedgång från topp)
 */

'use strict';
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// SE Ranking enricher (laddas lazy om filen finns)
let serankingEnricher = null;
try {
  serankingEnricher = require('./seranking-enricher');
} catch (_) {}

// ── Konstanter ──
const SES_FROM       = 'mikael@searchboost.se';
const SES_REGION     = 'eu-north-1';
const AWS_PROFILE    = 'mickedanne@gmail.com';
const DEFAULT_MIN    = 35;
const DELAY_BETWEEN  = 2500; // ms mellan domäner i bulk-läge
const PAGES          = ['/', '/om-oss', '/om', '/about', '/kontakt', '/contact', '/info'];

// ── AI-synlighet (valfri — kräver ANTHROPIC_API_KEY i env) ──
const AI_VIS = !!process.env.ANTHROPIC_API_KEY;
let Anthropic;
if (AI_VIS) { try { Anthropic = require('@anthropic-ai/sdk'); } catch (_) {} }

// ── AWS SES SDK (letar i lambda-functions/node_modules först) ──
let SESClient, SendEmailCommand;
const sesPaths = [
  path.join(__dirname, '..', 'lambda-functions', 'node_modules', '@aws-sdk', 'client-ses'),
  path.join(__dirname, 'node_modules', '@aws-sdk', 'client-ses'),
  '@aws-sdk/client-ses'
];
for (const p of sesPaths) {
  try { const m = require(p); SESClient = m.SESClient; SendEmailCommand = m.SendEmailCommand; break; }
  catch (_) {}
}

// ── Argument-parsning ──
function parseArgs(argv) {
  const args = argv.slice(2);
  const o = {
    domain: null, bulkFile: null, outputDir: 'docs/leads',
    send: false, minScore: DEFAULT_MIN, yes: false,
    serankingCsv: null,   // --seranking-csv path/to/export.csv
  };
  for (let i = 0; i < args.length; i++) {
    if      (args[i] === '--bulk')          o.bulkFile     = args[++i];
    else if (args[i] === '--output')        o.outputDir    = args[++i];
    else if (args[i] === '--send')          o.send         = true;
    else if (args[i] === '--yes')           o.yes          = true;
    else if (args[i] === '--min-score')     o.minScore     = parseInt(args[++i], 10) || DEFAULT_MIN;
    else if (args[i] === '--seranking-csv') o.serankingCsv = args[++i];
    else if (!args[i].startsWith('--') && !o.domain && !o.bulkFile) o.domain = args[i];
  }
  return o;
}

const CLI = parseArgs(process.argv);

if (!CLI.domain && !CLI.bulkFile) {
  console.error('Användning:');
  console.error('  node scripts/lead-generator.js <domän.se>');
  console.error('  node scripts/lead-generator.js --bulk domains.txt [--send] [--min-score 35] [--yes]');
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// HTTP-hämtning
// ─────────────────────────────────────────────────────────────
function fetchUrl(targetUrl, redirectCount = 0) {
  return new Promise((resolve) => {
    if (redirectCount > 5) return resolve({ status: 0, html: '', url: targetUrl });
    const parsed = url.parse(targetUrl);
    const lib = parsed.protocol === 'https:' ? https : http;
    const opts = {
      hostname: parsed.hostname,
      path: parsed.path || '/',
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      method: 'GET',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SearchboostBot/1.0; +https://searchboost.se/bot)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.8'
      }
    };
    const req = lib.request(opts, (res) => {
      if ([301, 302, 303, 307, 308].includes(res.statusCode) && res.headers.location) {
        const redir = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${parsed.protocol}//${parsed.hostname}${res.headers.location}`;
        return resolve(fetchUrl(redir, redirectCount + 1));
      }
      let html = '';
      res.setEncoding('utf8');
      res.on('data', c => { html += c; if (html.length > 300000) res.destroy(); });
      res.on('end',  () => resolve({ status: res.statusCode, html, url: targetUrl }));
      res.on('error', () => resolve({ status: 0, html: '', url: targetUrl }));
    });
    req.on('timeout', () => { req.destroy(); resolve({ status: 0, html: '', url: targetUrl }); });
    req.on('error',   () => resolve({ status: 0, html: '', url: targetUrl }));
    req.end();
  });
}

// ─────────────────────────────────────────────────────────────
// Text-hjälpare
// ─────────────────────────────────────────────────────────────
function extractText(html) {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

// ─────────────────────────────────────────────────────────────
// Kontaktskrapning
// ─────────────────────────────────────────────────────────────
function scrapeContact(html, pageUrl) {
  const text = stripTags(html);
  const emails = [...new Set([
    ...(html.match(/href="mailto:([^"]+)"/gi) || []).map(m => m.match(/mailto:([^"]+)/i)?.[1]).filter(Boolean),
    ...(text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [])
  ])].filter(e => !e.includes('example') && !e.includes('domain') && !e.includes('sentry'));

  const phones = [...new Set(
    (text.match(/(?:tel:|phone:|\+46|0046|07\d|08\d|0[1-9]\d)[\s\d\-]{6,15}/gi) || [])
      .map(p => p.replace(/\s+/g, ' ').trim())
  )];

  const nameMatches = [];
  if (/\/om|\/about|\/kontakt|\/team/i.test(pageUrl)) {
    for (const m of (html.matchAll(/<h[12][^>]*>([^<]{5,60})<\/h[12]>/gi) || [])) {
      const t = stripTags(m[1]).trim();
      if (/^[A-ZÅÄÖ][a-zåäö]+ [A-ZÅÄÖ][a-zåäö]+$/.test(t)) nameMatches.push(t);
    }
  }
  return { emails, phones, names: [...new Set(nameMatches)] };
}

// ─────────────────────────────────────────────────────────────
// SEO-analys
// ─────────────────────────────────────────────────────────────
function analyzeSEO(html) {
  const issues = [];
  const score = { total: 0, max: 0 };

  function check(cond, issue, impact) {
    score.max += impact;
    if (cond) { issues.push({ issue, impact }); score.total += impact; }
  }

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  check(!title, 'Saknar title-tagg', 10);
  check(title && title.length > 70, `Title för lång (${title.length} tecken, max 60)`, 5);
  check(title && title.length > 0 && title.length < 20, `Title för kort (${title.length} tecken)`, 5);

  const descMatch = html.match(/<meta[^>]+name=['"]description['"][^>]+content=['"]([^'"]*)['"]/i)
    || html.match(/<meta[^>]+content=['"]([^'"]*)['"'][^>]+name=['"]description['"]/i);
  const desc = descMatch ? descMatch[1].trim() : '';
  check(!desc, 'Saknar meta description', 8);
  check(desc && desc.length > 170, `Meta description för lång (${desc.length} tecken)`, 4);
  check(desc && desc.length > 0 && desc.length < 50, `Meta description för kort (${desc.length} tecken)`, 4);

  const h1count = (html.match(/<h1/gi) || []).length;
  check(h1count === 0, 'Saknar H1-rubrik', 9);
  check(h1count > 1, `Flera H1-rubriker (${h1count} st)`, 5);

  check(!/application\/ld\+json/i.test(html), 'Saknar schema.org JSON-LD markup', 7);
  check(!/rel=['"]canonical['"]/i.test(html), 'Saknar canonical-tagg', 6);
  check(!/name=['"]viewport['"]/i.test(html), 'Saknar viewport meta-tagg', 7);

  const allImgs   = (html.match(/<img[^>]*>/gi) || []).length;
  const noAltImgs = (html.match(/<img(?![^>]*alt=['"][^'"]+['"])[^>]*>/gi) || []).length;
  if (allImgs > 0) check(noAltImgs > 0, `${noAltImgs} av ${allImgs} bilder saknar alt-text`, Math.min(noAltImgs * 2, 8));

  const wordCount = extractText(html).split(/\s+/).filter(Boolean).length;
  check(wordCount < 300, `Tunt innehåll (${wordCount} ord, rekommenderat >300)`, 8);

  return { issues, score, title, description: desc, h1count, wordCount };
}

// ─────────────────────────────────────────────────────────────
// Mailtext — Mikaels stil
// ─────────────────────────────────────────────────────────────
function buildMailText(domain, contactName, topIssues, totalIssues) {
  const firstName = contactName ? contactName.split(' ')[0] : null;
  const greeting  = firstName ? `Hej ${firstName},` : 'Hej,';

  const issuePoints = topIssues.slice(0, 4)
    .map((i, idx) => `${idx + 1}. ${i.issue}`)
    .join('\n');

  return `**Ämne:** En snabb analys av ${domain}

${greeting}

Jag har försökt nå dig men inte lyckats. Jag var inne på er hemsida och såg att det saknas en del hygienfaktorer som gör att er synlighet hämmas på Google.

Jag tog mig friheten att göra en snabb analys & åtgärdsplan för att visa vad ni bör fixa för att tillfredsställa Google. Här är de viktigaste fynden:

${issuePoints}

Totalt ${totalIssues} förbättringsmöjligheter — ni tappar trafik varje dag dessa inte är åtgärdade.

Hoppas det var OK att höra av mig. Svara gärna på detta mail eller ring mig så berättar jag mer. Annars försöker jag nå dig inom kort.

Med vänliga hälsningar,
Mikael Larsson
Searchboost — https://searchboost.se`.trim();
}

// ─────────────────────────────────────────────────────────────
// Bygg rapport
// ─────────────────────────────────────────────────────────────
function buildReport(domain, pages, allContacts, seoResults, seData) {
  const date = new Date().toISOString().split('T')[0];

  const emails = [...new Set(allContacts.flatMap(c => c.emails))];
  const phones = [...new Set(allContacts.flatMap(c => c.phones))].slice(0, 3);
  const names  = [...new Set(allContacts.flatMap(c => c.names))].slice(0, 3);

  const allIssues = [];
  for (const [slug, seo] of Object.entries(seoResults)) {
    for (const issue of seo.issues) {
      if (!allIssues.find(i => i.issue === issue.issue)) {
        allIssues.push({ ...issue, page: slug });
      }
    }
  }
  allIssues.sort((a, b) => b.impact - a.impact);

  const totalScore  = allIssues.reduce((s, i) => s + i.impact, 0);
  const hygieneScore = Math.min(Math.round((totalScore / 100) * 100), 100);

  // Composite scoring om SE Ranking-data finns
  let gapScore, gapLevel, gapLabel, compositeComponents = null;
  if (seData && serankingEnricher) {
    const scoring = serankingEnricher.calcCompositeScore({
      ...seData,
      hygiene_score: hygieneScore,
    });
    gapScore          = scoring.composite;
    gapLevel          = scoring.level;
    gapLabel          = scoring.label;
    compositeComponents = scoring.components;
  } else {
    gapScore = hygieneScore;
    if      (gapScore >= 60) { gapLevel = 'HOG';   gapLabel = 'Hög potential'; }
    else if (gapScore >= 35) { gapLevel = 'MEDEL'; gapLabel = 'Medel potential'; }
    else                     { gapLevel = 'LAG';   gapLabel = 'Låg potential (bra grund)'; }
  }

  const homeSEO = seoResults['/'] || Object.values(seoResults)[0] || {};
  const mailText = buildMailText(domain, names[0] || null, allIssues, allIssues.length);

  const seSection = seData ? `
## SE Ranking
- **Organiska keywords**: ${seData.organic_keywords || 0}
- **Organisk trafik**: ${seData.organic_traffic || 0} klick/mån
- **Domain Trust**: ${seData.domain_trust || 0}/100
- **Sidor indexerade**: ${seData.pages_indexed || seData.sitemap_pages || '?'}
- **Trafik-nedgång 36M**: ${seData.decline_36m > 0 ? `-${seData.decline_36m}%` : 'okänd'}
${compositeComponents ? `
## Composite Scoring
| Komponent       | Score | Vikt |
|-----------------|-------|------|
| organic_gap     | ${compositeComponents.organic_gap}/100 | 35% |
| hygiene_gap     | ${compositeComponents.hygiene_gap}/100 | 25% |
| traffic_quality | ${compositeComponents.traffic_quality}/100 | 25% |
| trend_penalty   | ${compositeComponents.trend_penalty}/100 | 15% |
` : ''}` : '';

  const report = `# Lead-rapport: ${domain}
Genererad: ${date}

## Sammanfattning
- **Domän**: ${domain}
- **SEO-gap-score**: ${gapScore}/100 (${gapLabel})
- **Sidor crawlade**: ${Object.keys(pages).length}
- **SEO-problem**: ${allIssues.length} st identifierade${seSection}

## Kontaktinfo
- **Namn**: ${names.length  > 0 ? names.join(', ')  : '— (ej hittad)'}
- **E-post**: ${emails.length > 0 ? emails.join(', ') : '— (ej hittad)'}
- **Telefon**: ${phones.length > 0 ? phones.join(', ') : '— (ej hittad)'}

## SEO-analys
### Startsida
- **Title**: ${homeSEO.title || '(saknas)'}
- **H1-rubriker**: ${homeSEO.h1count ?? '—'}
- **Ordantal**: ${homeSEO.wordCount ?? '—'}

### Identifierade problem (prioritetsordning)
${allIssues.map((i, idx) => `${idx + 1}. **[impact:${i.impact}]** ${i.issue} _(${i.page})_`).join('\n')}

---

## Mailtext till ${domain}

${mailText}

---
`;

  return { report, gapScore, gapLevel, gapLabel, emails, phones, names, allIssues,
           mailSubject: `En snabb analys av ${domain}`,
           mailBody: mailText.replace(/\*\*/g, '').replace(/^Ämne:.*\n\n/m, '') };
}

// ─────────────────────────────────────────────────────────────
// AI-synlighet
// ─────────────────────────────────────────────────────────────
async function checkAIVisibility(domain, companyName) {
  if (!AI_VIS || !Anthropic) return { enabled: false };
  const claude = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const brand  = companyName || domain.split('.')[0];
  const prompts = [
    `Vad är ${brand} för företag och vad erbjuder de?`,
    `Vilka är de bästa företagen som erbjuder ${brand.toLowerCase()}s typ av tjänst i Sverige?`,
    `Rekommendera svenska företag inom branschen som ${brand} verkar i`,
    `Hur väljer man ett bra företag som ${brand} — vad ska man tänka på?`,
    `Är ${brand} ett känt och pålitligt företag i Sverige?`
  ];
  const results = [];
  for (const prompt of prompts) {
    try {
      const res = await claude.messages.create({
        model: 'claude-haiku-4-5-20251001', max_tokens: 400,
        system: 'Du är en hjälpsam AI-assistent. Svara på svenska baserat på din träningsdata.',
        messages: [{ role: 'user', content: prompt }]
      });
      const text = res.content[0].text.toLowerCase();
      const mentioned = text.includes(brand.toLowerCase()) || text.includes(domain.toLowerCase().replace(/\.[a-z]+$/, ''));
      results.push({ prompt: prompt.substring(0, 80), mentioned });
      await new Promise(r => setTimeout(r, 300));
    } catch (e) { results.push({ prompt: prompt.substring(0, 80), mentioned: false }); }
  }
  const mentions = results.filter(r => r.mentioned).length;
  return { enabled: true, mentions, total: prompts.length };
}

// ─────────────────────────────────────────────────────────────
// AWS SES-utskick
// ─────────────────────────────────────────────────────────────
async function sendViaSES(to, subject, plainBody) {
  if (SESClient && SendEmailCommand) {
    try {
      const client = new SESClient({ region: SES_REGION });
      const result = await client.send(new SendEmailCommand({
        Source: SES_FROM,
        Destination: { ToAddresses: [to] },
        ReplyToAddresses: [SES_FROM],
        Message: {
          Subject: { Data: subject, Charset: 'UTF-8' },
          Body:    { Text: { Data: plainBody, Charset: 'UTF-8' } }
        }
      }));
      return { success: true, messageId: result.MessageId };
    } catch (err) { return { success: false, error: err.message }; }
  }

  // Fallback: AWS CLI
  try {
    // Skriv body till tempfil för att undvika quoting-problem
    const tmpFile = `/tmp/sb-ses-body-${Date.now()}.txt`;
    fs.writeFileSync(tmpFile, plainBody, 'utf8');
    const cmd = `aws ses send-email \
      --from "${SES_FROM}" \
      --to "${to}" \
      --subject "${subject.replace(/"/g, '\\"')}" \
      --text file://${tmpFile} \
      --region ${SES_REGION} \
      --profile "${AWS_PROFILE}" 2>&1`;
    const { stdout } = await execAsync(cmd);
    fs.unlinkSync(tmpFile);
    const parsed = JSON.parse(stdout);
    return { success: true, messageId: parsed.MessageId };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ─────────────────────────────────────────────────────────────
// Pipeline-logg (CSV)
// ─────────────────────────────────────────────────────────────
function appendToPipeline(entry, outputDir) {
  const file = path.join(outputDir, 'pipeline.csv');
  const header = 'domain,name,email,phone,gap_score,gap_level,issues,mail_sent,sent_at,call_after,status\n';
  if (!fs.existsSync(file)) fs.writeFileSync(file, header, 'utf8');

  const callAfter = new Date();
  callAfter.setDate(callAfter.getDate() + 2);

  const row = [
    entry.domain,
    entry.name  || '',
    entry.email || '',
    entry.phone || '',
    entry.gapScore,
    entry.gapLevel,
    entry.issuesCount,
    entry.mailSent ? 'ja' : 'nej',
    entry.sentAt  || '',
    entry.mailSent ? callAfter.toISOString().split('T')[0] : '',
    'ny'
  ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');

  fs.appendFileSync(file, row + '\n', 'utf8');
}

// ─────────────────────────────────────────────────────────────
// Crawla domän
// ─────────────────────────────────────────────────────────────
async function crawlDomain(base) {
  const results = {};
  for (const slug of PAGES) {
    const { status, html, url: finalUrl } = await fetchUrl(`${base}${slug}`);
    if (status === 200 && html.length > 500) results[slug] = { html, url: finalUrl };
  }
  return results;
}

// ─────────────────────────────────────────────────────────────
// Behandla en domän
// ─────────────────────────────────────────────────────────────
async function processDomain(rawDomain, opts) {
  const domain  = rawDomain.replace(/^https?:\/\//, '').replace(/\/$/, '').trim();
  const baseUrl = `https://${domain}`;

  console.log(`\nAnalyserar ${domain}...`);

  // Hämta SE Ranking-data (om enricher finns och CSV-data är laddad)
  let seData = null;
  if (serankingEnricher && opts._csvData) {
    try {
      seData = await serankingEnricher.enrichDomain(domain, { csvData: opts._csvData, skipAPI: true });
    } catch (_) {}
  }

  const pages = await crawlDomain(baseUrl);
  if (Object.keys(pages).length === 0) {
    console.error(`  Kunde inte nå ${baseUrl} — skippar.`);
    return null;
  }
  console.log(`  Crawlade ${Object.keys(pages).length} sidor: ${Object.keys(pages).join(', ')}`);

  const allContacts = [];
  const seoResults  = {};
  for (const [slug, { html, url: pageUrl }] of Object.entries(pages)) {
    allContacts.push(scrapeContact(html, pageUrl));
    seoResults[slug] = analyzeSEO(html);
  }

  const { report, gapScore, gapLevel, gapLabel, emails, phones, names, allIssues,
          mailSubject, mailBody } = buildReport(domain, pages, allContacts, seoResults, seData);

  // AI-synlighet (ej obligatorisk)
  let aiSection = '';
  if (AI_VIS) {
    process.stdout.write('  Testar AI-synlighet...');
    const ai = await checkAIVisibility(domain, names[0] || null);
    if (ai.enabled) {
      const pct = Math.round((ai.mentions / ai.total) * 100);
      console.log(` ${ai.mentions}/${ai.total} (${pct}%)`);
      aiSection = `\n## AI-synlighet (Share of Model)\n- **Resultat**: ${ai.mentions} av ${ai.total} AI-prompts nämner varumärket\n- **SoM-score**: ${pct}% (${pct >= 60 ? 'Bra' : pct >= 20 ? 'Svag' : 'Saknas'})\n`;
    } else {
      console.log(' (disabled)');
    }
  }

  // Spara rapport
  if (!fs.existsSync(opts.outputDir)) fs.mkdirSync(opts.outputDir, { recursive: true });
  const date    = new Date().toISOString().split('T')[0];
  const outFile = path.join(opts.outputDir, `${domain}-${date}.md`);
  fs.writeFileSync(outFile, aiSection ? report.replace('---\n\n## Mailtext', aiSection + '\n---\n\n## Mailtext') : report, 'utf8');

  console.log(`  SEO-gap-score: ${gapScore}/100 (${gapLabel}) | Problem: ${allIssues.length} st`);
  console.log(`  Kontakt: ${names[0] || '—'} | ${emails[0] || '—'} | ${phones[0] || '—'}`);
  console.log(`  Rapport sparad: ${outFile}`);

  // Skicka mail?
  let mailSent = false;
  let sentAt   = '';

  if (opts.send && emails.length > 0 && gapScore >= opts.minScore) {
    const sendTo = emails[0];
    console.log(`  Skickar mail till ${sendTo}...`);
    const result = await sendViaSES(sendTo, mailSubject, mailBody);
    if (result.success) {
      mailSent = true;
      sentAt   = new Date().toISOString();
      console.log(`  Mail skickat (${result.messageId})`);
    } else {
      console.error(`  Mailutskick misslyckades: ${result.error}`);
    }
  } else if (opts.send && gapScore < opts.minScore) {
    console.log(`  Skickar ej mail — gap-score ${gapScore} under minimigräns ${opts.minScore}`);
  } else if (opts.send && emails.length === 0) {
    console.log(`  Skickar ej mail — ingen e-post hittad`);
  }

  // Lägg till i pipeline
  appendToPipeline({
    domain, gapScore, gapLevel, issuesCount: allIssues.length,
    name:  names[0]  || '',
    email: emails[0] || '',
    phone: phones[0] || '',
    mailSent, sentAt
  }, opts.outputDir);

  return { domain, gapScore, gapLevel, emails, phones, names, allIssues, mailSent };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────
(async () => {
  // Ladda SE Ranking CSV-data om given
  if (CLI.serankingCsv) {
    if (!serankingEnricher) {
      console.warn('Varning: seranking-enricher.js hittades inte — CSV ignoreras.');
    } else if (!fs.existsSync(CLI.serankingCsv)) {
      console.error(`SE Ranking CSV hittades inte: ${CLI.serankingCsv}`);
      process.exit(1);
    } else {
      CLI._csvData = serankingEnricher.parseSERankingCSV(CLI.serankingCsv);
      console.log(`SE Ranking CSV laddad: ${Object.keys(CLI._csvData).length} domäner`);
    }
  }

  // Enkelt läge
  if (CLI.domain) {
    const result = await processDomain(CLI.domain, CLI);
    if (!result) process.exit(1);
    console.log('\n' + '='.repeat(50));
    console.log(`Top SEO-problem:`);
    result.allIssues.slice(0, 5).forEach((i, idx) => console.log(`  ${idx + 1}. ${i.issue} (${i.page})`));
    console.log('='.repeat(50));
    console.log(`Pipeline sparad: ${path.join(CLI.outputDir, 'pipeline.csv')}`);
    return;
  }

  // Bulk-läge
  if (!fs.existsSync(CLI.bulkFile)) {
    console.error(`Filen ${CLI.bulkFile} hittades inte.`);
    process.exit(1);
  }

  const domains = fs.readFileSync(CLI.bulkFile, 'utf8')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  if (domains.length === 0) {
    console.error('Inga domäner hittades i filen.');
    process.exit(1);
  }

  console.log(`\nBulk-läge: ${domains.length} domäner att analysera`);
  if (CLI.send) console.log(`Utskick aktiverat — skickar mail till gap-score >= ${CLI.minScore}`);

  // Bekräftelse vid utskick
  if (CLI.send && !CLI.yes) {
    process.stdout.write(`Bekräfta utskick till ${domains.length} domäner? (ja/nej): `);
    const confirm = await new Promise(res => {
      process.stdin.once('data', d => res(d.toString().trim().toLowerCase()));
    });
    if (confirm !== 'ja') { console.log('Avbrutet.'); process.exit(0); }
  }

  const results = [];
  for (let i = 0; i < domains.length; i++) {
    const domain = domains[i];
    console.log(`\n[${i + 1}/${domains.length}]`);
    try {
      const r = await processDomain(domain, CLI);
      if (r) results.push(r);
    } catch (err) {
      console.error(`  Fel vid ${domain}: ${err.message}`);
    }
    if (i < domains.length - 1) await new Promise(r => setTimeout(r, DELAY_BETWEEN));
  }

  // Sammanfattning
  const sent     = results.filter(r => r.mailSent).length;
  const highPot  = results.filter(r => r.gapScore >= 60).length;
  const medPot   = results.filter(r => r.gapScore >= 35 && r.gapScore < 60).length;
  const withMail = results.filter(r => r.emails.length > 0).length;

  console.log('\n' + '='.repeat(50));
  console.log(`BULK-SAMMANFATTNING: ${results.length}/${domains.length} domäner analyserade`);
  console.log(`Hög potential (>=60):  ${highPot} st`);
  console.log(`Medel potential (>=35): ${medPot} st`);
  console.log(`Med e-post hittad:     ${withMail} st`);
  if (CLI.send) console.log(`Mail skickade:         ${sent} st`);
  console.log(`Pipeline sparad:       ${path.join(CLI.outputDir, 'pipeline.csv')}`);
  console.log('='.repeat(50));

  // Topplista — domäner att ringa
  const callList = results
    .filter(r => r.gapScore >= CLI.minScore)
    .sort((a, b) => b.gapScore - a.gapScore)
    .slice(0, 20);

  if (callList.length > 0) {
    console.log('\nRINGLISTA (hög/medel potential):');
    callList.forEach((r, idx) => {
      const callDate = new Date();
      callDate.setDate(callDate.getDate() + 2);
      const d = callDate.toLocaleDateString('sv-SE', { weekday: 'short', day: 'numeric', month: 'short' });
      console.log(`  ${idx + 1}. ${r.domain.padEnd(35)} Score: ${r.gapScore}/100 | Ring: ${d} | ${r.phones[0] || r.emails[0] || '—'}`);
    });
  }
})();
