/**
 * Backlink Monitor Lambda — SE Ranking Data API
 *
 * Hämtar backlink-data via SE Ranking Backlinks API och sparar i BigQuery.
 * Kör DAGLIGEN via EventBridge för att bränna 1M credits innan 2026-02-20.
 *
 * Per domän hämtas:
 * 1. Summary (backlinks, refdomains, DIR, dofollow/nofollow)
 * 2. Refdomains (alla hänvisande domäner, limit 500)
 * 3. Anchors (alla ankartexter, limit 500)
 *
 * Sparar i 3 BigQuery-tabeller:
 * - backlink_snapshots (daglig summering per domän)
 * - backlink_refdomains (alla refdomains per snapshot)
 * - backlink_anchors (alla anchors per snapshot)
 *
 * Domäner att tracka:
 * - Alla kunder (customer_pipeline)
 * - Konkurrenter (hårdkodade)
 * - Prospects (hårdkodade)
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const axios = require('axios');
const fs = require('fs');

const ssm = new SSMClient({ region: 'eu-north-1' });

// ── Domäner att tracka ──

const COMPETITORS = [
  { domain: 'vaning18.se', name: 'Våning 18' },
  { domain: 'pineberry.se', name: 'Pineberry' },
  { domain: 'brath.se', name: 'Brath' },
  { domain: 'adgrabber.io', name: 'Adgrabber' },
  { domain: 'adrelevance.se', name: 'Adrelevance' },
  { domain: 'emaxmedia.se', name: 'Emax Media' },
];

const PROSPECTS = [
  { domain: 'nordicsnusonline.com', name: 'Nordic Snus Online' },
  { domain: 'vame.se', name: 'Vamé' },
];

const CUSTOMER_DOMAINS = {
  searchboost: 'searchboost.nu',
  mobelrondellen: 'mobelrondellen.se',
  phvast: 'phvast.se',
  ilmonte: 'ilmonte.se',
  tobler: 'tobler.se',
  traficator: 'traficator.se',
  kompetensutveckla: 'kompetensutveckla.se',
  ferox: 'feroxkonsult.se',
  wedosigns: 'wedosigns.se',
  smalandskontorsmobler: 'smalandskontorsmobler.se',
};

// ── Helpers ──

async function getParam(name) {
  const { Parameter } = await ssm.send(new GetParameterCommand({
    Name: name, WithDecryption: true
  }));
  return Parameter.Value;
}

let _bqClient = null;
let _dataset = null;

async function getBigQuery() {
  if (_bqClient) return { bq: _bqClient, dataset: _dataset };
  const credsJson = await getParam('/seo-mcp/bigquery/credentials');
  const creds = JSON.parse(credsJson);
  const tmpPath = '/tmp/gcp-creds.json';
  fs.writeFileSync(tmpPath, credsJson);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = tmpPath;
  _bqClient = new BigQuery({ projectId: 'searchboost-485810', credentials: creds });
  _dataset = 'seo_data';
  return { bq: _bqClient, dataset: _dataset };
}

async function seRankingGet(endpoint, apiKey) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `https://api.seranking.com/v1${endpoint}${separator}apikey=${apiKey}&output=json`;
  const res = await axios.get(url, { timeout: 30000 });
  return res.data;
}

function today() {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

// ── Main fetch per domain ──

async function fetchDomainData(domain, apiKey) {
  const result = { summary: null, refdomains: [], anchors: [] };

  // 1. Summary
  try {
    const data = await seRankingGet(`/backlinks/summary?target=${encodeURIComponent(domain)}&mode=host`, apiKey);
    result.summary = data?.summary?.[0] || null;
  } catch (e) {
    console.error(`  Summary error for ${domain}: ${e.message}`);
  }

  // 2. Refdomains (max 500)
  try {
    const data = await seRankingGet(`/backlinks/refdomains?target=${encodeURIComponent(domain)}&mode=host&limit=500`, apiKey);
    result.refdomains = data?.refdomains || [];
  } catch (e) {
    console.error(`  Refdomains error for ${domain}: ${e.message}`);
  }

  // 3. Anchors (max 500)
  try {
    const data = await seRankingGet(`/backlinks/anchors?target=${encodeURIComponent(domain)}&mode=host&limit=500`, apiKey);
    result.anchors = data?.anchors || [];
  } catch (e) {
    console.error(`  Anchors error for ${domain}: ${e.message}`);
  }

  return result;
}

// ── Save to BigQuery ──

async function saveSnapshot(bq, dataset, date, domain, domainType, customerId, summary) {
  if (!summary) return;
  const row = {
    snapshot_date: date,
    domain,
    domain_type: domainType,
    customer_id: customerId || null,
    backlinks: summary.backlinks || 0,
    refdomains: summary.refdomains || 0,
    dofollow_backlinks: summary.dofollow_backlinks || 0,
    nofollow_backlinks: summary.nofollow_backlinks || 0,
    dofollow_refdomains: summary.dofollow_refdomains || 0,
    domain_inlink_rank: summary.domain_inlink_rank || 0,
    text_backlinks: summary.text_backlinks || 0,
    from_home_page_backlinks: summary.from_home_page_backlinks || 0,
    edu_backlinks: summary.edu_backlinks || 0,
    gov_backlinks: summary.gov_backlinks || 0,
    pages_with_backlinks: summary.pages_with_backlinks || 0,
    anchors_count: summary.anchors || 0,
  };

  await bq.dataset(dataset).table('backlink_snapshots').insert([row]);
}

async function saveRefdomains(bq, dataset, date, domain, refdomains) {
  if (!refdomains.length) return;
  const rows = refdomains.map(rd => ({
    snapshot_date: date,
    domain,
    refdomain: rd.refdomain,
    backlinks: rd.backlinks || 0,
    dofollow_backlinks: rd.dofollow_backlinks || 0,
    domain_inlink_rank: rd.domain_inlink_rank || 0,
    first_seen: rd.first_seen || '',
  }));

  // Insert in batches of 200 to avoid limits
  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    await bq.dataset(dataset).table('backlink_refdomains').insert(batch);
  }
}

async function saveAnchors(bq, dataset, date, domain, anchors) {
  if (!anchors.length) return;
  const rows = anchors.map(a => ({
    snapshot_date: date,
    domain,
    anchor: (a.anchor || '').substring(0, 500),
    backlinks: a.backlinks || 0,
    refdomains: a.refdomains || 0,
    dofollow_backlinks: a.dofollow_backlinks || 0,
    first_seen: a.first_seen || '',
    last_visited: a.last_visited || '',
  }));

  for (let i = 0; i < rows.length; i += 200) {
    const batch = rows.slice(i, i + 200);
    await bq.dataset(dataset).table('backlink_anchors').insert(batch);
  }
}

// ── Lambda handler ──

exports.handler = async (event) => {
  console.log('=== Backlink Monitor started ===');
  const startTime = Date.now();
  const date = today();

  // Get API key
  let apiKey;
  try {
    apiKey = await getParam('/seo-mcp/seranking/api-key');
  } catch (e) {
    console.error('Failed to get SE Ranking API key:', e.message);
    return { statusCode: 500, error: 'No API key' };
  }

  // Check credits first
  try {
    const sub = await seRankingGet('/account/subscription', apiKey);
    const info = sub?.subscription_info || {};
    console.log(`Credits: ${info.units_left} / ${info.units_limit} (expires ${info.expiraton_date})`);
    if (parseFloat(info.units_left) < 100) {
      console.error('Less than 100 credits remaining, aborting');
      return { statusCode: 200, message: 'Low credits, skipping' };
    }
  } catch (e) {
    console.error('Failed to check credits:', e.message);
  }

  const { bq, dataset } = await getBigQuery();

  // Build domain list
  const domains = [];

  // Customers
  for (const [id, domain] of Object.entries(CUSTOMER_DOMAINS)) {
    domains.push({ domain, type: 'customer', customerId: id });
  }

  // Competitors
  for (const c of COMPETITORS) {
    domains.push({ domain: c.domain, type: 'competitor', customerId: null });
  }

  // Prospects
  for (const p of PROSPECTS) {
    domains.push({ domain: p.domain, type: 'prospect', customerId: null });
  }

  console.log(`Tracking ${domains.length} domains (${Object.keys(CUSTOMER_DOMAINS).length} customers, ${COMPETITORS.length} competitors, ${PROSPECTS.length} prospects)`);

  // Check if we already ran today
  try {
    const [rows] = await bq.query({
      query: `SELECT COUNT(*) as cnt FROM \`${dataset}.backlink_snapshots\` WHERE snapshot_date = @date`,
      params: { date }
    });
    if (rows[0]?.cnt > 0) {
      console.log(`Already have ${rows[0].cnt} snapshots for ${date}, skipping duplicates`);
      // Delete existing data for today to allow re-run
      await bq.query({
        query: `DELETE FROM \`${dataset}.backlink_snapshots\` WHERE snapshot_date = @date`,
        params: { date }
      });
      await bq.query({
        query: `DELETE FROM \`${dataset}.backlink_refdomains\` WHERE snapshot_date = @date`,
        params: { date }
      });
      await bq.query({
        query: `DELETE FROM \`${dataset}.backlink_anchors\` WHERE snapshot_date = @date`,
        params: { date }
      });
      console.log('Cleared existing data for today');
    }
  } catch (e) {
    // Table might be empty, that's fine
  }

  const results = { success: 0, errors: 0, details: [] };

  for (const { domain, type, customerId } of domains) {
    console.log(`\n--- ${domain} (${type}) ---`);
    try {
      const data = await fetchDomainData(domain, apiKey);

      if (data.summary) {
        await saveSnapshot(bq, dataset, date, domain, type, customerId, data.summary);
        console.log(`  Summary: BL=${data.summary.backlinks} RD=${data.summary.refdomains} DIR=${data.summary.domain_inlink_rank}`);
      }

      if (data.refdomains.length) {
        await saveRefdomains(bq, dataset, date, domain, data.refdomains);
        console.log(`  Refdomains: ${data.refdomains.length} saved`);
      }

      if (data.anchors.length) {
        await saveAnchors(bq, dataset, date, domain, data.anchors);
        console.log(`  Anchors: ${data.anchors.length} saved`);
      }

      results.success++;
      results.details.push({
        domain, type,
        backlinks: data.summary?.backlinks || 0,
        refdomains: data.summary?.refdomains || 0,
        dir: data.summary?.domain_inlink_rank || 0,
        refdomains_saved: data.refdomains.length,
        anchors_saved: data.anchors.length,
      });

      // Small delay to be nice to the API
      await new Promise(r => setTimeout(r, 500));

    } catch (e) {
      console.error(`  ERROR for ${domain}: ${e.message}`);
      results.errors++;
    }
  }

  // Check credits after
  try {
    const sub = await seRankingGet('/account/subscription', apiKey);
    const info = sub?.subscription_info || {};
    console.log(`\nCredits remaining: ${info.units_left} / ${info.units_limit}`);
    results.credits_remaining = parseFloat(info.units_left);
  } catch (e) {}

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n=== Done in ${elapsed}s — ${results.success} OK, ${results.errors} errors ===`);

  return {
    statusCode: 200,
    date,
    domains_tracked: domains.length,
    ...results,
    elapsed_seconds: elapsed,
  };
};
