#!/usr/bin/env node
/**
 * Regression-vakten — GSC-positionsövervakning per kund
 * Kör (från mcp-server-code/): npm run regression
 * Alternativt: cd mcp-server-code && node ../scripts/regression-check.js
 *
 * OBS: Kör från mcp-server-code/ — scriptet behöver dess node_modules (AWS SDK, BigQuery).
 * Kräver: AWS-profil "mickedanne@gmail.com" + SSM-access (eu-north-1)
 * Hämtar BigQuery-credentials från SSM, kör frågor mot gsc_daily_metrics,
 * jämför senaste 7 dagar mot föregående 7 dagar, flaggar regressioner.
 * Skriver resultat till memory/kund_{slug}_tasks.md.
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');

// ── Konfiguration ──────────────────────────────────────────────────────────
const REGION = 'eu-north-1';
const AWS_PROFILE = 'mickedanne@gmail.com';
const BQ_PROJECT = 'searchboost-485810';
const BQ_DATASET = 'seo_data';
const MEMORY_DIR = path.join(__dirname, '..', 'memory');

const CUSTOMERS = [
  { id: 'searchboost',            slug: 'searchboost',            hasGsc: true },
  { id: 'mobelrondellen',         slug: 'mobelrondellen',         hasGsc: true },
  { id: 'kompetensutveckla',      slug: 'kompetensutveckla',      hasGsc: true },
  { id: 'phvast',                 slug: 'phvast',                 hasGsc: true },
  { id: 'smalandskontorsmobler',  slug: 'smalandskontorsmobler',  hasGsc: true },
  { id: 'ilmonte',                slug: 'ilmonte',                hasGsc: false, reason: 'Inte ägare i GSC' },
  { id: 'tobler',                 slug: 'tobler',                 hasGsc: false, reason: 'GSC ej konfigurerad' },
  { id: 'traficator',             slug: 'traficator',             hasGsc: false, reason: 'GSC ej konfigurerad' },
  { id: 'jelmtech',               slug: 'jelmtech',               hasGsc: false, reason: 'GSC ej konfigurerad' },
  { id: 'humanpower',             slug: 'humanpower',             hasGsc: false, reason: 'Ej aktiv kund' },
  { id: 'nordicsnusonline',       slug: 'nordicsnusonline',       hasGsc: false, reason: 'Ej aktiv kund' },
];

// ── Trösklar ───────────────────────────────────────────────────────────────
const POSITION_DROP_THRESHOLD = 3;    // > 3 platser ned → regression
const TOP20_THRESHOLD = 20;            // fallit ur topp 20 → regression
const CLICKS_DROP_THRESHOLD = 0.50;   // > 50% klikktapp → regression

// ── Datum-helpers ──────────────────────────────────────────────────────────
function getDateRanges() {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const d = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d.toISOString().split('T')[0];
  };
  return {
    current:  { start: d(7),  end: d(1)  },
    previous: { start: d(14), end: d(8)  },
    today,
  };
}

// ── SSM ────────────────────────────────────────────────────────────────────
async function getSsmParam(ssm, name) {
  const cmd = new GetParameterCommand({ Name: name, WithDecryption: true });
  const r = await ssm.send(cmd);
  return r.Parameter.Value;
}

async function initBigQuery() {
  process.env.AWS_PROFILE = AWS_PROFILE;
  const ssm = new SSMClient({ region: REGION });
  const credsJson = await getSsmParam(ssm, '/seo-mcp/bigquery/credentials');
  const creds = JSON.parse(credsJson);
  return new BigQuery({
    projectId: BQ_PROJECT,
    credentials: creds,
  });
}

// ── BigQuery ───────────────────────────────────────────────────────────────
async function fetchTopQueries(bq, customerId, startDate, endDate, limit = 20) {
  const q = `
    SELECT
      query,
      ROUND(AVG(position), 1)  AS avg_position,
      SUM(clicks)              AS total_clicks,
      SUM(impressions)         AS total_impressions
    FROM \`${BQ_PROJECT}.${BQ_DATASET}.gsc_daily_metrics\`
    WHERE customer_id = @customerId
      AND date BETWEEN @startDate AND @endDate
    GROUP BY query
    ORDER BY total_clicks DESC, total_impressions DESC
    LIMIT @limit
  `;
  const [rows] = await bq.query({
    query: q,
    params: { customerId, startDate, endDate, limit },
  });
  return rows;
}

// ── Regression-analys ──────────────────────────────────────────────────────
function detectRegressions(currentRows, previousRows) {
  const prevMap = new Map(previousRows.map(r => [r.query, r]));
  const regressions = [];

  for (const curr of currentRows) {
    const prev = prevMap.get(curr.query);
    if (!prev) continue;

    const posDrop = curr.avg_position - prev.avg_position;
    const prevClicks = Number(prev.total_clicks);
    const currClicks = Number(curr.total_clicks);
    const clickDrop = prevClicks > 0
      ? (prevClicks - currClicks) / prevClicks
      : 0;

    const flags = [];
    if (posDrop > POSITION_DROP_THRESHOLD)
      flags.push(`pos ${prev.avg_position} → ${curr.avg_position} (▼${posDrop.toFixed(1)})`);
    if (prev.avg_position <= TOP20_THRESHOLD && curr.avg_position > TOP20_THRESHOLD)
      flags.push(`fallit ur topp 20 (var ${prev.avg_position})`);
    if (clickDrop > CLICKS_DROP_THRESHOLD && prevClicks >= 5)
      flags.push(`klick ${prevClicks} → ${currClicks} (▼${Math.round(clickDrop * 100)}%)`);

    if (flags.length)
      regressions.push({ query: curr.query, flags });
  }
  return regressions;
}

// ── Minnesfil-helpers ──────────────────────────────────────────────────────
function memoryFilePath(slug) {
  return path.join(MEMORY_DIR, `kund_${slug}_tasks.md`);
}

function ensureMemoryFile(slug, customerId) {
  const fp = memoryFilePath(slug);
  if (!fs.existsSync(fp)) {
    fs.writeFileSync(fp, `# ${customerId} — Tasks & Status\n\n> Automatiskt skapad av regression-check.js\n\n`);
  }
  return fp;
}

function upsertSection(filePath, header, content) {
  let text = fs.readFileSync(filePath, 'utf8');
  const sectionRe = new RegExp(`(## ${header}[\\s\\S]*?)(?=^## |$)`, 'm');
  const newSection = `## ${header}\n\n${content}\n`;
  if (sectionRe.test(text)) {
    text = text.replace(sectionRe, newSection);
  } else {
    text += `\n${newSection}`;
  }
  fs.writeFileSync(filePath, text);
}

// ── Rapport per kund ───────────────────────────────────────────────────────
async function checkCustomer(bq, customer, ranges) {
  const { id, slug, hasGsc, reason } = customer;
  const fp = ensureMemoryFile(slug, id);

  if (!hasGsc) {
    upsertSection(fp, 'Regressionsvarningar', `_Ingen GSC-data: ${reason}. Regressionscheck ej möjlig._\n\nSenaste check: ${ranges.today}`);
    console.log(`  [SKIP] ${id} — ${reason}`);
    return;
  }

  let currentRows, previousRows;
  try {
    [currentRows, previousRows] = await Promise.all([
      fetchTopQueries(bq, id, ranges.current.start,  ranges.current.end),
      fetchTopQueries(bq, id, ranges.previous.start, ranges.previous.end),
    ]);
  } catch (err) {
    upsertSection(fp, 'Regressionsvarningar', `_Kunde inte hämta GSC-data: ${err.message}_\n\nSenaste check: ${ranges.today}`);
    console.log(`  [ERROR] ${id}: ${err.message}`);
    return;
  }

  if (!currentRows.length) {
    upsertSection(fp, 'Regressionsvarningar', `_Inga GSC-rader för perioden ${ranges.current.start}–${ranges.current.end}._\n\nSenaste check: ${ranges.today}`);
    console.log(`  [EMPTY] ${id} — inga rader`);
    return;
  }

  const regressions = detectRegressions(currentRows, previousRows);

  if (!regressions.length) {
    upsertSection(fp, 'Regressionsvarningar', `Inga regressioner ${ranges.today}\n\n_Kontrollerade topp-${currentRows.length} queries (${ranges.current.start}–${ranges.current.end})._`);
    console.log(`  [OK] ${id} — inga regressioner`);
    return;
  }

  const lines = regressions.map(r => `- **${r.query}**: ${r.flags.join(' | ')}`).join('\n');
  const content = `### ⚠️ ${ranges.today}\n\n${lines}\n\n_Period: ${ranges.current.start}–${ranges.current.end} vs ${ranges.previous.start}–${ranges.previous.end}_`;
  upsertSection(fp, 'Regressionsvarningar', content);
  console.log(`  [VARNING] ${id} — ${regressions.length} regression(er)`);
  regressions.forEach(r => console.log(`    • ${r.query}: ${r.flags.join(' | ')}`));
}

// ── Veckosummering (körs varje måndag) ────────────────────────────────────
async function weekSummary(bq, ranges) {
  const day = new Date().getDay(); // 1 = måndag
  if (day !== 1) return;

  const lines = [];
  for (const c of CUSTOMERS.filter(c => c.hasGsc)) {
    try {
      const [curr, prev] = await Promise.all([
        fetchTopQueries(bq, c.id, ranges.current.start,  ranges.current.end, 50),
        fetchTopQueries(bq, c.id, ranges.previous.start, ranges.previous.end, 50),
      ]);
      const prevMap = new Map(prev.map(r => [r.query, r]));
      let up = 0, down = 0;
      for (const r of curr) {
        const p = prevMap.get(r.query);
        if (!p) continue;
        const d = r.avg_position - p.avg_position;
        if (d < -1) up++;
        else if (d > 1) down++;
      }
      lines.push(`| ${c.id} | ${up} | ${down} |`);
    } catch {
      lines.push(`| ${c.id} | — | — |`);
    }
  }

  const summaryPath = path.join(MEMORY_DIR, 'kunder.md');
  let text = fs.existsSync(summaryPath) ? fs.readFileSync(summaryPath, 'utf8') : '';
  const section = `## Veckosummering ${ranges.today}\n\n| Kund | Keywords upp | Keywords ner |\n|------|-------------|-------------|\n${lines.join('\n')}\n`;
  const re = /## Veckosummering[\s\S]*?(?=^## |\Z)/m;
  text = re.test(text) ? text.replace(re, section) : text + '\n' + section;
  fs.writeFileSync(summaryPath, text);
  console.log('\n[Veckosummering skriven till memory/kunder.md]');
}

// ── Main ───────────────────────────────────────────────────────────────────
(async () => {
  console.log('=== Regression-vakten — Searchboost ===');
  const ranges = getDateRanges();
  console.log(`Period: ${ranges.current.start}–${ranges.current.end} vs ${ranges.previous.start}–${ranges.previous.end}\n`);

  let bq;
  try {
    bq = await initBigQuery();
    console.log('BigQuery: ansluten\n');
  } catch (err) {
    console.error(`[FATAL] Kunde inte ansluta till BigQuery: ${err.message}`);
    console.error('Kontrollera att AWS-profilen "mickedanne@gmail.com" är konfigurerad och har SSM-access.\n');
    process.exit(1);
  }

  for (const customer of CUSTOMERS) {
    process.stdout.write(`Kontrollerar ${customer.id}...\n`);
    await checkCustomer(bq, customer, ranges);
  }

  await weekSummary(bq, ranges);

  console.log('\n=== Klar ===');
})();
