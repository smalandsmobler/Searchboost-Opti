/**
 * GSC Backfill — Alla kunder 90 dagar
 * Kör: node scripts/gsc-backfill-all.js
 */

const { google } = require('googleapis');
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────
const BQ_PROJECT  = 'searchboost-485810';
const BQ_DATASET  = 'seo_data';
const BQ_TABLE    = 'gsc_daily_metrics';
const GSC_PROJECT = 'seo-aouto';     // GSC API aktiverad här
const DAYS        = 90;
const PAGE_SIZE   = 25000;
const BATCH_SIZE  = 500;

const KEY_FILE = path.join(__dirname, '..', 'lambda-functions', 'node_modules',
  '..', '..', 'lambda-functions', 'bq-credentials.json');

// Försök hitta credentials
function findCredentials() {
  const candidates = [
    path.join(__dirname, '..', 'lambda-functions', 'bq-credentials.json'),
    path.join(__dirname, '..', 'perispa', 'bq-credentials.json'),
    '/tmp/bq-credentials.json',
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) { console.log('Credentials:', p); return p; }
  }
  throw new Error('bq-credentials.json hittades inte');
}

// ── Sites att backfilla (alla med GSC-property) ──────────────────
const SITES = [
  { customer_id: 'smalandskontorsmobler', gsc_property: 'https://www.smalandskontorsmobler.se/' },
  { customer_id: 'mobelrondellen',        gsc_property: 'https://www.mobelrondellen.se/' },
  { customer_id: 'jelmtech',              gsc_property: 'https://jelmtech.se/' },
  { customer_id: 'searchboost',           gsc_property: 'https://searchboost.se/' },
  { customer_id: 'traficator',            gsc_property: 'https://traficator.se/' },
  { customer_id: 'nordicsnusonline',      gsc_property: 'https://nordicsnusonline.com/' },
  { customer_id: 'tobler',               gsc_property: 'https://tobler.se/' },
  { customer_id: 'ilmonte',              gsc_property: 'https://ilmonte.se/' },
];

// ── Hjälpfunktioner ──────────────────────────────────────────────
function dateRange(days) {
  const end   = new Date(); end.setDate(end.getDate() - 2); // GSC har ~2 dagars fördröjning
  const start = new Date(end); start.setDate(start.getDate() - days + 1);
  const fmt = d => d.toISOString().slice(0, 10);
  return { startDate: fmt(start), endDate: fmt(end) };
}

async function fetchGscData(searchconsole, property, startDate, endDate) {
  const rows = [];
  let startRow = 0;
  while (true) {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: property,
      requestBody: {
        startDate, endDate,
        dimensions: ['query', 'page', 'device', 'country', 'date'],
        rowLimit: PAGE_SIZE,
        startRow,
      },
    });
    const data = res.data.rows || [];
    rows.push(...data);
    process.stdout.write(`  GSC: ${rows.length} rader...\r`);
    if (data.length < PAGE_SIZE) break;
    startRow += PAGE_SIZE;
  }
  return rows;
}

function transformRows(gscRows, customerId) {
  return gscRows.map(r => ({
    customer_id:  customerId,
    date:         r.keys[4],
    query:        r.keys[0] || '',
    page:         r.keys[1] || '',
    device:       (r.keys[2] || 'DESKTOP').toUpperCase(),
    country:      (r.keys[3] || 'swe').toLowerCase(),
    clicks:       r.clicks    || 0,
    impressions:  r.impressions || 0,
    ctr:          r.ctr       || 0,
    position:     r.position  || 0,
  }));
}

async function deleteExisting(bq, customerId, startDate, endDate) {
  const query = `
    DELETE FROM \`${BQ_PROJECT}.${BQ_DATASET}.${BQ_TABLE}\`
    WHERE customer_id = @customer_id
      AND date BETWEEN @start_date AND @end_date
  `;
  await bq.query({
    query,
    params: { customer_id: customerId, start_date: startDate, end_date: endDate },
  });
}

async function insertBatch(table, rows) {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    await table.insert(rows.slice(i, i + BATCH_SIZE));
    process.stdout.write(`  BQ: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} rader...\r`);
  }
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  const credFile = findCredentials();
  const auth = new google.auth.GoogleAuth({
    keyFile: credFile,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  const authClient = await auth.getClient();
  authClient.quotaProjectId = GSC_PROJECT; // Cross-project: SA i searchboost-485810, API i seo-aouto

  const searchconsole = google.searchconsole({ version: 'v1', auth: authClient });
  const bq = new BigQuery({ keyFilename: credFile, projectId: BQ_PROJECT });
  const table = bq.dataset(BQ_DATASET).table(BQ_TABLE);

  const { startDate, endDate } = dateRange(DAYS);
  console.log(`\nPeriod: ${startDate} → ${endDate} (${DAYS} dagar)`);
  console.log(`Kunder: ${SITES.length}\n`);

  const summary = [];

  for (const site of SITES) {
    const start = Date.now();
    process.stdout.write(`[${site.customer_id}] Hämtar GSC...\n`);
    try {
      const gscRows = await fetchGscData(searchconsole, site.gsc_property, startDate, endDate);
      console.log(`  GSC: ${gscRows.length} rader totalt`);

      if (gscRows.length === 0) {
        console.log('  Inga data — hoppar över.\n');
        summary.push({ customer: site.customer_id, rows: 0, status: 'tom' });
        continue;
      }

      const rows = transformRows(gscRows, site.customer_id);

      process.stdout.write(`  Raderar befintlig data...\n`);
      await deleteExisting(bq, site.customer_id, startDate, endDate);

      process.stdout.write(`  Skriver ${rows.length} rader till BigQuery...\n`);
      await insertBatch(table, rows);

      const secs = ((Date.now() - start) / 1000).toFixed(1);
      console.log(`  Klar! ${rows.length} rader på ${secs}s\n`);
      summary.push({ customer: site.customer_id, rows: rows.length, status: 'ok', secs });

    } catch (e) {
      console.error(`  FEL: ${e.message}\n`);
      summary.push({ customer: site.customer_id, rows: 0, status: 'fel', error: e.message });
    }
  }

  console.log('\n═══════════════════════════════════════');
  console.log('SAMMANFATTNING');
  console.log('═══════════════════════════════════════');
  for (const s of summary) {
    const icon = s.status === 'ok' ? '✓' : s.status === 'tom' ? '○' : '✗';
    console.log(`${icon} ${s.customer.padEnd(25)} ${s.rows.toString().padStart(6)} rader  ${s.status}`);
  }
  const total = summary.reduce((a, s) => a + s.rows, 0);
  console.log(`\nTotalt: ${total} rader insatta`);
}

main().catch(e => { console.error('Kritiskt fel:', e.message); process.exit(1); });
