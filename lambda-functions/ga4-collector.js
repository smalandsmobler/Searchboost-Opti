/**
 * GA4 Collector Lambda — Daglig GA4-datainsamling
 *
 * Kör varje dag kl 04:30 CET (30 min efter data-collector).
 * Hämtar sessions, users, revenue, conversions och top-sidor per kund.
 *
 * Krav: Service Account måste ha "Viewer"-roll på varje GA4-property.
 * Lägg till: GA4 Admin → Property Access Management → + Add user → SA-email → Viewer
 *
 * BigQuery-tabell: ga4_daily_metrics
 * Kolumner: customer_id, date, sessions, users, new_users, bounce_rate,
 *           avg_session_duration, screen_page_views, conversions,
 *           total_revenue, page_path (top 20 sidor/dag), source, medium
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const { BetaAnalyticsDataClient } = require('@google-analytics/data');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ssmCache = new Map();

// ── Kunder med GA4-property-id ──
const CUSTOMERS = [
  { id: 'smalandskontorsmobler', name: 'Smålands Kontorsmöbler' },
  { id: 'mobelrondellen',        name: 'Möbelrondellen' },
  { id: 'ilmonte',               name: 'Ilmonte' },
  { id: 'searchboost',           name: 'Searchboost' },
  { id: 'tobler',                name: 'Tobler' },
];

async function getParam(name) {
  if (ssmCache.has(name)) return ssmCache.get(name);
  try {
    const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
    ssmCache.set(name, res.Parameter.Value);
    return res.Parameter.Value;
  } catch (e) {
    ssmCache.set(name, null);
    return null;
  }
}

async function initBQ() {
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/bq-creds.json', creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds.json';
  return { bq: new BigQuery({ projectId }), dataset, projectId };
}

async function initGA4Client() {
  // Använder samma SA som BigQuery
  return new BetaAnalyticsDataClient({
    keyFilename: '/tmp/bq-creds.json',
  });
}

async function ensureTable(bq, dataset) {
  const schema = [
    { name: 'customer_id',           type: 'STRING' },
    { name: 'date',                  type: 'DATE' },
    { name: 'page_path',             type: 'STRING' },
    { name: 'source',                type: 'STRING' },
    { name: 'medium',                type: 'STRING' },
    { name: 'sessions',              type: 'INTEGER' },
    { name: 'users',                 type: 'INTEGER' },
    { name: 'new_users',             type: 'INTEGER' },
    { name: 'screen_page_views',     type: 'INTEGER' },
    { name: 'conversions',           type: 'INTEGER' },
    { name: 'total_revenue',         type: 'FLOAT' },
    { name: 'avg_session_duration',  type: 'FLOAT' },
    { name: 'bounce_rate',           type: 'FLOAT' },
    { name: 'collected_at',          type: 'TIMESTAMP' },
  ];
  const tableRef = bq.dataset(dataset).table('ga4_daily_metrics');
  const [exists] = await tableRef.exists();
  if (!exists) {
    await tableRef.create({
      schema,
      timePartitioning: { type: 'DAY', field: 'date' },
      clustering: { fields: ['customer_id', 'source'] },
    });
    console.log('Skapade tabell ga4_daily_metrics');
  }
  return tableRef;
}

async function fetchGA4Data(ga4Client, propertyId, dateStr) {
  const rows = [];

  try {
    // 1. Top sidor med sessions/users/revenue
    const [pageResp] = await ga4Client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      dimensions: [{ name: 'pagePath' }, { name: 'sessionDefaultChannelGroup' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'newUsers' },
        { name: 'screenPageViews' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
      limit: 50,
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
    });

    for (const row of (pageResp.rows || [])) {
      const dims = row.dimensionValues || [];
      const vals = row.metricValues || [];
      rows.push({
        page_path:            dims[0]?.value || '/',
        source:               dims[1]?.value || 'unknown',
        medium:               '',
        sessions:             parseInt(vals[0]?.value || '0'),
        users:                parseInt(vals[1]?.value || '0'),
        new_users:            parseInt(vals[2]?.value || '0'),
        screen_page_views:    parseInt(vals[3]?.value || '0'),
        conversions:          parseInt(vals[4]?.value || '0'),
        total_revenue:        parseFloat(vals[5]?.value || '0'),
        avg_session_duration: parseFloat(vals[6]?.value || '0'),
        bounce_rate:          parseFloat(vals[7]?.value || '0'),
      });
    }
  } catch (e) {
    console.error(`  GA4 page-rapport fel (property ${propertyId}): ${e.message}`);
  }

  // 2. Source/medium sammanfattning
  try {
    const [srcResp] = await ga4Client.runReport({
      property: `properties/${propertyId}`,
      dateRanges: [{ startDate: dateStr, endDate: dateStr }],
      dimensions: [{ name: 'sessionSource' }, { name: 'sessionMedium' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'conversions' },
        { name: 'totalRevenue' },
      ],
      limit: 20,
    });

    for (const row of (srcResp.rows || [])) {
      const dims = row.dimensionValues || [];
      const vals = row.metricValues || [];
      rows.push({
        page_path:            '__source_summary__',
        source:               dims[0]?.value || '',
        medium:               dims[1]?.value || '',
        sessions:             parseInt(vals[0]?.value || '0'),
        users:                parseInt(vals[1]?.value || '0'),
        new_users:            0,
        screen_page_views:    0,
        conversions:          parseInt(vals[2]?.value || '0'),
        total_revenue:        parseFloat(vals[3]?.value || '0'),
        avg_session_duration: 0,
        bounce_rate:          0,
      });
    }
  } catch (e) {
    console.error(`  GA4 source-rapport fel: ${e.message}`);
  }

  return rows;
}

async function collectCustomer(customer, ga4Client, bqTable, dateStr) {
  const propertyId = await getParam(`/seo-mcp/integrations/${customer.id}/ga4-property-id`);
  if (!propertyId) {
    console.log(`  ${customer.id}: Ingen GA4 property-id — hoppar över`);
    return { customer_id: customer.id, rows: 0, error: 'no_property_id' };
  }

  const rows = await fetchGA4Data(ga4Client, propertyId, dateStr);
  if (rows.length === 0) {
    console.log(`  ${customer.id}: Inga GA4-rader`);
    return { customer_id: customer.id, rows: 0, error: 'no_data' };
  }

  const bqRows = rows.map(r => ({
    customer_id: customer.id,
    date: dateStr,
    collected_at: { value: new Date().toISOString() },
    ...r,
  }));

  await bqTable.insert(bqRows);
  console.log(`  ${customer.id}: ${bqRows.length} rader → BQ`);
  return { customer_id: customer.id, rows: bqRows.length };
}

exports.handler = async (event) => {
  console.log('GA4 Collector startar', new Date().toISOString());

  // Datum att samla in (igår om inget annat anges)
  const dateStr = event.date || new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  console.log(`Datum: ${dateStr}`);

  const { bq, dataset } = await initBQ();
  const ga4Client = await initGA4Client();
  const bqTable = await ensureTable(bq, dataset);

  const results = [];
  for (const customer of CUSTOMERS) {
    console.log(`Kund: ${customer.id}`);
    try {
      const res = await collectCustomer(customer, ga4Client, bqTable, dateStr);
      results.push(res);
    } catch (e) {
      console.error(`  ${customer.id} FEL: ${e.message}`);
      results.push({ customer_id: customer.id, rows: 0, error: e.message });
    }
  }

  const summary = {
    date: dateStr,
    customers_processed: results.length,
    total_rows: results.reduce((s, r) => s + (r.rows || 0), 0),
    errors: results.filter(r => r.error).length,
    results,
  };
  console.log('Klar:', JSON.stringify(summary, null, 2));
  return summary;
};
