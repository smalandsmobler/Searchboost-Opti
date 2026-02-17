/**
 * Data Collector Lambda — Daglig datapipeline
 *
 * Kors varje dag kl 04:00 CET via EventBridge.
 * Samlar in data fran alla datakallor per kund och skriver till BigQuery.
 *
 * Datakallor:
 * 1. Google Search Console (GSC) — sokord, klick, impressions, positioner
 * 2. Google Ads — kampanjer, spend, konverteringar
 * 3. Meta Ads — kampanjer, spend, konverteringar
 * 4. LinkedIn Ads — kampanjer, engagement
 * 5. TikTok Ads — kampanjer, video engagement
 * 6. Instagram (organisk) — followers, engagement, reach
 * 7. Facebook Page (organisk) — followers, impressions, engagement
 * 8. LinkedIn Company (organisk) — followers, impressions, shares
 * 9. TikTok Creator (organisk) — followers, video views, engagement
 *
 * BigQuery-tabeller:
 * - gsc_daily_metrics: Daglig sokordsdata per kund (partitionerad pa date, klustrad pa customer_id+query)
 * - ads_daily_metrics: Daglig annonsdata per kund och plattform
 * - social_daily_metrics: Daglig social media-data (organisk)
 * - data_collection_log: Logg over varje datainsamling
 *
 * Forbattringar vs v1:
 * - SSM parameter-cache (reducerar ~50 anrop/kund till ~1 bulk-fetch)
 * - Retry med exponential backoff for alla externa API-anrop
 * - Lambda timeout-guard (avbryter insamling 30s innan Lambda-timeout)
 * - GAQL parameteriserad (ingen SQL-injection)
 * - LinkedIn Ads + TikTok Ads implementerade
 * - Parallella SSM-lookups for ads/social credential-check
 * - Social-insamling loggas i data_collection_log
 * - Backfill-stod via event.startDate + event.endDate
 * - google-auth-library i package.json
 *
 * Kostnadsberakning:
 * - Lambda: ~$0.05/dag (512MB, ~30s per kund x 10 kunder)
 * - BigQuery: ~$0.00/dag (INSERT ar gratis, lagring ~$0.02/GB/man)
 * - Total: ~$2-5/man (vs Supermetrics $99-299/man)
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// Lambda timeout-guard: avbryt 30s innan Lambda-timeout (default 300s)
const LAMBDA_TIMEOUT_MS = parseInt(process.env.LAMBDA_TIMEOUT_MS || '300000');
const GUARD_BUFFER_MS = 30000;
let lambdaStartTime = 0;

function timeRemaining() {
  return LAMBDA_TIMEOUT_MS - (Date.now() - lambdaStartTime) - GUARD_BUFFER_MS;
}

function shouldAbort() {
  return timeRemaining() < 0;
}

// ── SSM Helpers med cache ──

const ssmCache = new Map();

async function getParam(name) {
  if (ssmCache.has(name)) return ssmCache.get(name);
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  const val = res.Parameter.Value;
  ssmCache.set(name, val);
  return val;
}

async function getParamSafe(name) {
  if (ssmCache.has(name)) return ssmCache.get(name);
  try {
    return await getParam(name);
  } catch (e) {
    ssmCache.set(name, null);
    return null;
  }
}

// Bulk-fetch alla parametrar under en path och cacha dem
async function prefetchParams(path) {
  let nextToken;
  do {
    const res = await ssm.send(new GetParametersByPathCommand({
      Path: path,
      Recursive: true,
      WithDecryption: true,
      ...(nextToken ? { NextToken: nextToken } : {})
    }));
    for (const p of (res.Parameters || [])) {
      ssmCache.set(p.Name, p.Value);
    }
    nextToken = res.NextToken;
  } while (nextToken);
}

// ── Retry med exponential backoff ──

async function withRetry(fn, { maxRetries = 3, baseDelay = 1000, label = 'API' } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const status = err.response?.status;

      // Retryable: 429 (rate limit), 500, 502, 503, 504, timeout
      const retryable = !status || status === 429 || status >= 500 || err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT';
      if (!retryable || attempt === maxRetries) throw err;

      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 500;
      console.log(`  ${label} retry ${attempt + 1}/${maxRetries} efter ${Math.round(delay)}ms (${status || err.code})`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw lastError;
}

// ── BigQuery Setup ──

let bq = null;
let cachedProjectId = null;
let cachedDatasetId = null;

async function getBigQuery() {
  if (bq) return bq;
  const credsJson = await getParam('/seo-mcp/bigquery/credentials');
  cachedProjectId = await getParam('/seo-mcp/bigquery/project-id');
  cachedDatasetId = await getParam('/seo-mcp/bigquery/dataset');

  const credsPath = '/tmp/bq-creds.json';
  fs.writeFileSync(credsPath, credsJson);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;

  bq = new BigQuery({ projectId: cachedProjectId, keyFilename: credsPath });
  return bq;
}

async function getDatasetId() {
  if (cachedDatasetId) return cachedDatasetId;
  cachedDatasetId = await getParam('/seo-mcp/bigquery/dataset');
  return cachedDatasetId;
}

async function ensureTables() {
  const bigquery = await getBigQuery();
  const datasetId = await getDatasetId();
  const dataset = bigquery.dataset(datasetId);

  const tables = [
    {
      name: 'gsc_daily_metrics',
      schema: [
        { name: 'customer_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'date', type: 'DATE', mode: 'REQUIRED' },
        { name: 'query', type: 'STRING', mode: 'REQUIRED' },
        { name: 'page', type: 'STRING' },
        { name: 'clicks', type: 'INTEGER' },
        { name: 'impressions', type: 'INTEGER' },
        { name: 'ctr', type: 'FLOAT' },
        { name: 'position', type: 'FLOAT' },
        { name: 'device', type: 'STRING' },
        { name: 'country', type: 'STRING' },
        { name: 'collected_at', type: 'TIMESTAMP' },
      ],
      partition: 'date',
      cluster: ['customer_id', 'query'],
    },
    {
      name: 'ads_daily_metrics',
      schema: [
        { name: 'customer_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'date', type: 'DATE', mode: 'REQUIRED' },
        { name: 'platform', type: 'STRING', mode: 'REQUIRED' },
        { name: 'campaign_id', type: 'STRING' },
        { name: 'campaign_name', type: 'STRING' },
        { name: 'impressions', type: 'INTEGER' },
        { name: 'clicks', type: 'INTEGER' },
        { name: 'spend', type: 'FLOAT' },
        { name: 'conversions', type: 'INTEGER' },
        { name: 'conversion_value', type: 'FLOAT' },
        { name: 'ctr', type: 'FLOAT' },
        { name: 'cpc', type: 'FLOAT' },
        { name: 'cpa', type: 'FLOAT' },
        { name: 'roas', type: 'FLOAT' },
        { name: 'currency', type: 'STRING' },
        { name: 'collected_at', type: 'TIMESTAMP' },
      ],
      partition: 'date',
      cluster: ['customer_id', 'platform'],
    },
    {
      name: 'social_daily_metrics',
      schema: [
        { name: 'customer_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'date', type: 'DATE', mode: 'REQUIRED' },
        { name: 'platform', type: 'STRING', mode: 'REQUIRED' },
        { name: 'account_id', type: 'STRING' },
        { name: 'account_name', type: 'STRING' },
        { name: 'followers', type: 'INTEGER' },
        { name: 'followers_change', type: 'INTEGER' },
        { name: 'posts_published', type: 'INTEGER' },
        { name: 'reach', type: 'INTEGER' },
        { name: 'impressions', type: 'INTEGER' },
        { name: 'engagement', type: 'INTEGER' },
        { name: 'likes', type: 'INTEGER' },
        { name: 'comments', type: 'INTEGER' },
        { name: 'shares', type: 'INTEGER' },
        { name: 'saves', type: 'INTEGER' },
        { name: 'clicks', type: 'INTEGER' },
        { name: 'video_views', type: 'INTEGER' },
        { name: 'engagement_rate', type: 'FLOAT' },
        { name: 'story_views', type: 'INTEGER' },
        { name: 'reel_plays', type: 'INTEGER' },
        { name: 'collected_at', type: 'TIMESTAMP' },
      ],
      partition: 'date',
      cluster: ['customer_id', 'platform'],
    },
    {
      name: 'data_collection_log',
      schema: [
        { name: 'collection_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'customer_id', type: 'STRING', mode: 'REQUIRED' },
        { name: 'source', type: 'STRING', mode: 'REQUIRED' },
        { name: 'status', type: 'STRING' },
        { name: 'records_collected', type: 'INTEGER' },
        { name: 'date_range_start', type: 'DATE' },
        { name: 'date_range_end', type: 'DATE' },
        { name: 'duration_ms', type: 'INTEGER' },
        { name: 'error_message', type: 'STRING' },
        { name: 'collected_at', type: 'TIMESTAMP' },
      ],
      partition: null,
      cluster: null,
    },
  ];

  await Promise.all(tables.map(async t => {
    try {
      const opts = { schema: { fields: t.schema } };
      if (t.partition) opts.timePartitioning = { type: 'DAY', field: t.partition };
      if (t.cluster) opts.clustering = { fields: t.cluster };
      await dataset.createTable(t.name, opts);
      console.log(`  Tabell skapad: ${t.name}`);
    } catch (e) {
      if (!e.message.includes('Already Exists')) throw e;
    }
  }));
}

// ── GSC Auth ──

let gscAuth = null;

async function getGscAuth() {
  if (gscAuth) return gscAuth;
  await getBigQuery(); // sakerstall credentials-fil
  const { GoogleAuth } = require('google-auth-library');
  gscAuth = new GoogleAuth({
    keyFile: '/tmp/bq-creds.json',
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
  });
  return gscAuth;
}

// ── Kund-discovery (anvander prefetchad cache) ──

async function getCustomers() {
  // Allt ar redan cachat fran prefetchParams
  const customers = {};
  for (const [key, val] of ssmCache.entries()) {
    const match = key.match(/\/seo-mcp\/integrations\/([^/]+)\/(.+)/);
    if (!match) continue;
    const [, customerId, paramKey] = match;
    if (!customers[customerId]) customers[customerId] = { id: customerId };
    customers[customerId][paramKey] = val;
  }
  return Object.values(customers);
}

// ── BigQuery helpers ──

async function dedupeAndInsert(tableName, customerId, extraFilters, rows) {
  if (!rows || rows.length === 0) return;
  const bigquery = await getBigQuery();
  const datasetId = await getDatasetId();

  // DELETE duplicates for idempotens
  let where = 'customer_id = @customerId';
  const params = { customerId };
  for (const [k, v] of Object.entries(extraFilters)) {
    where += ` AND ${k} = @${k}`;
    params[k] = v;
  }

  try {
    await bigquery.query({
      query: `DELETE FROM \`${bigquery.projectId}.${datasetId}.${tableName}\` WHERE ${where}`,
      params,
    });
  } catch (e) {
    // Tabellen kan vara tom — ignorera
    if (!e.message.includes('Not found')) {
      console.log(`  Dedupe ${tableName} for ${customerId}: ${e.message}`);
    }
  }

  // INSERT i batches av 500 (BigQuery streaming insert max)
  const table = bigquery.dataset(datasetId).table(tableName);
  for (let i = 0; i < rows.length; i += 500) {
    await table.insert(rows.slice(i, i + 500));
  }
}

// ── Loggning ──

async function logCollection(customerId, source, status, recordsCollected, dateStart, dateEnd, durationMs, errorMessage) {
  try {
    const bigquery = await getBigQuery();
    const datasetId = await getDatasetId();
    const table = bigquery.dataset(datasetId).table('data_collection_log');

    await table.insert([{
      collection_id: `${customerId}_${source}_${Date.now()}`,
      customer_id: customerId,
      source,
      status,
      records_collected: recordsCollected,
      date_range_start: dateStart,
      date_range_end: dateEnd,
      duration_ms: durationMs,
      error_message: errorMessage || null,
      collected_at: new Date().toISOString(),
    }]);
  } catch (e) {
    console.error(`  Log-insert misslyckades for ${customerId}/${source}: ${e.message}`);
  }
}

// ══════════════════════════════════════════════════════
// GSC Data Collection
// ══════════════════════════════════════════════════════

async function collectGscData(customer, dateStart, dateEnd) {
  const gscProperty = customer['gsc-property'];
  if (!gscProperty) return { collected: 0, error: 'Ingen GSC-property' };

  const auth = await getGscAuth();
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  const encodedSiteUrl = encodeURIComponent(gscProperty);

  const body = {
    startDate: dateStart,
    endDate: dateEnd,
    dimensions: ['query', 'page', 'date', 'device', 'country'],
    rowLimit: 5000,
  };

  const res = await withRetry(() => axios.post(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
    body,
    {
      headers: {
        'Authorization': `Bearer ${token.token || token}`,
        'x-goog-user-project': 'seo-aouto',
      },
      timeout: 30000,
    }
  ), { label: `GSC ${customer.id}` });

  const rows = res.data.rows || [];
  if (rows.length === 0) return { collected: 0, error: null };

  const now = new Date().toISOString();
  const bqRows = rows.map(r => ({
    customer_id: customer.id,
    date: r.keys[2],
    query: r.keys[0],
    page: r.keys[1],
    clicks: r.clicks || 0,
    impressions: r.impressions || 0,
    ctr: r.ctr || 0,
    position: r.position || 0,
    device: r.keys[3] || 'UNKNOWN',
    country: r.keys[4] || 'UNKNOWN',
    collected_at: now,
  }));

  // Deduplicate pa datumintervall
  const bigquery = await getBigQuery();
  const datasetId = await getDatasetId();
  try {
    await bigquery.query({
      query: `DELETE FROM \`${bigquery.projectId}.${datasetId}.gsc_daily_metrics\`
              WHERE customer_id = @customerId AND date BETWEEN @dateStart AND @dateEnd`,
      params: { customerId: customer.id, dateStart, dateEnd },
    });
  } catch (e) {
    if (!e.message.includes('Not found')) console.log(`  GSC dedupe: ${e.message}`);
  }

  const table = bigquery.dataset(datasetId).table('gsc_daily_metrics');
  for (let i = 0; i < bqRows.length; i += 500) {
    await table.insert(bqRows.slice(i, i + 500));
  }

  return { collected: bqRows.length, error: null };
}

// ══════════════════════════════════════════════════════
// Ads Data Collection
// ══════════════════════════════════════════════════════

// Plattforms-konfiguration: vilka SSM-nycklar kravs + vilken funktion samlar data
const ADS_PLATFORMS = {
  google_ads: {
    requiredKeys: ['google-ads-customer-id', 'google-ads-developer-token', 'google-ads-refresh-token', 'google-ads-client-id', 'google-ads-client-secret'],
    collect: collectGoogleAdsData,
  },
  meta_ads: {
    requiredKeys: ['meta-ad-account-id', 'meta-access-token'],
    collect: collectMetaAdsData,
  },
  linkedin_ads: {
    requiredKeys: ['linkedin-ad-account-id', 'linkedin-access-token'],
    collect: collectLinkedInAdsData,
  },
  tiktok_ads: {
    requiredKeys: ['tiktok-advertiser-id', 'tiktok-access-token'],
    collect: collectTikTokAdsData,
  },
};

async function collectAdsData(customer, dateStr) {
  const results = { total: 0, platforms: {} };

  // Parallell credential-check for alla plattformar
  const checks = await Promise.all(
    Object.entries(ADS_PLATFORMS).map(async ([platform, config]) => {
      const creds = {};
      let allPresent = true;
      for (const key of config.requiredKeys) {
        const val = await getParamSafe(`/seo-mcp/integrations/${customer.id}/${key}`);
        if (!val) { allPresent = false; break; }
        creds[key] = val;
      }
      return { platform, config, creds, allPresent };
    })
  );

  for (const { platform, config, creds, allPresent } of checks) {
    if (!allPresent) {
      results.platforms[platform] = { collected: 0, error: 'Ej konfigurerad' };
      continue;
    }

    try {
      const rows = await config.collect(customer.id, creds, dateStr);
      if (rows.length > 0) {
        await dedupeAndInsert('ads_daily_metrics', customer.id, { platform, date: dateStr }, rows);
      }
      results.platforms[platform] = { collected: rows.length, error: null };
      results.total += rows.length;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      results.platforms[platform] = { collected: 0, error: msg };
    }
  }

  return results;
}

async function collectGoogleAdsData(customerId, creds, dateStr) {
  // OAuth2 access token
  const tokenRes = await withRetry(() => axios.post('https://oauth2.googleapis.com/token', {
    client_id: creds['google-ads-client-id'],
    client_secret: creds['google-ads-client-secret'],
    refresh_token: creds['google-ads-refresh-token'],
    grant_type: 'refresh_token',
  }), { label: 'Google Ads token' });

  // GAQL — parameteriserad (ingen SQL-injection)
  const gaql = [
    'SELECT campaign.id, campaign.name,',
    'metrics.impressions, metrics.clicks, metrics.cost_micros,',
    'metrics.conversions, metrics.conversions_value, segments.date',
    'FROM campaign',
    `WHERE segments.date = '${dateStr.replace(/[^0-9-]/g, '')}'`,
    'ORDER BY metrics.cost_micros DESC',
  ].join(' ');

  const adsCustomerId = creds['google-ads-customer-id'].replace(/-/g, '');
  const res = await withRetry(() => axios.post(
    `https://googleads.googleapis.com/v17/customers/${adsCustomerId}/googleAds:searchStream`,
    { query: gaql },
    {
      headers: {
        'Authorization': `Bearer ${tokenRes.data.access_token}`,
        'developer-token': creds['google-ads-developer-token'],
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  ), { label: `Google Ads ${customerId}` });

  const now = new Date().toISOString();
  const rows = [];

  for (const result of (res.data || [])) {
    for (const row of (result.results || [])) {
      const spend = (parseInt(row.metrics?.costMicros || '0')) / 1000000;
      const clicks = parseInt(row.metrics?.clicks || 0);
      const impressions = parseInt(row.metrics?.impressions || 0);
      const conversions = parseFloat(row.metrics?.conversions || 0);
      const convValue = parseFloat(row.metrics?.conversionsValue || 0);

      rows.push({
        customer_id: customerId,
        date: dateStr,
        platform: 'google_ads',
        campaign_id: String(row.campaign?.id || ''),
        campaign_name: row.campaign?.name || '',
        impressions, clicks, spend,
        conversions: Math.round(conversions),
        conversion_value: convValue,
        ctr: impressions > 0 ? clicks / impressions : 0,
        cpc: clicks > 0 ? spend / clicks : 0,
        cpa: conversions > 0 ? spend / conversions : 0,
        roas: spend > 0 ? convValue / spend : 0,
        currency: 'SEK',
        collected_at: now,
      });
    }
  }
  return rows;
}

async function collectMetaAdsData(customerId, creds, dateStr) {
  const res = await withRetry(() => axios.get(
    `https://graph.facebook.com/v21.0/act_${creds['meta-ad-account-id']}/campaigns`, {
      params: {
        fields: `id,name,insights.time_range({"since":"${dateStr}","until":"${dateStr}"}){impressions,clicks,spend,actions,action_values}`,
        access_token: creds['meta-access-token'],
        limit: 100,
      },
      timeout: 30000,
    }
  ), { label: `Meta Ads ${customerId}` });

  const now = new Date().toISOString();
  const rows = [];

  for (const campaign of (res.data?.data || [])) {
    const insights = campaign.insights?.data?.[0];
    if (!insights) continue;

    const spend = parseFloat(insights.spend || 0);
    const clicks = parseInt(insights.clicks || 0);
    const impressions = parseInt(insights.impressions || 0);

    let conversions = 0, convValue = 0;
    for (const action of (insights.actions || [])) {
      if (['purchase', 'lead', 'complete_registration', 'contact'].includes(action.action_type)) {
        conversions += parseInt(action.value || 0);
      }
    }
    for (const av of (insights.action_values || [])) {
      if (['purchase', 'lead'].includes(av.action_type)) {
        convValue += parseFloat(av.value || 0);
      }
    }

    rows.push({
      customer_id: customerId, date: dateStr, platform: 'meta_ads',
      campaign_id: String(campaign.id || ''), campaign_name: campaign.name || '',
      impressions, clicks, spend, conversions, conversion_value: convValue,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? convValue / spend : 0,
      currency: 'SEK', collected_at: now,
    });
  }
  return rows;
}

async function collectLinkedInAdsData(customerId, creds, dateStr) {
  const adAccountId = creds['linkedin-ad-account-id'];
  const accessToken = creds['linkedin-access-token'];

  // Hamta kampanjer med statistik
  const dateEpoch = new Date(dateStr).getTime();
  const res = await withRetry(() => axios.get(
    `https://api.linkedin.com/v2/adAnalyticsV2?q=analytics&dateRange.start.year=${dateStr.slice(0,4)}&dateRange.start.month=${parseInt(dateStr.slice(5,7))}&dateRange.start.day=${parseInt(dateStr.slice(8,10))}&dateRange.end.year=${dateStr.slice(0,4)}&dateRange.end.month=${parseInt(dateStr.slice(5,7))}&dateRange.end.day=${parseInt(dateStr.slice(8,10))}&timeGranularity=DAILY&pivot=CAMPAIGN&accounts=urn:li:sponsoredAccount:${adAccountId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
      timeout: 30000,
    }
  ), { label: `LinkedIn Ads ${customerId}` });

  const now = new Date().toISOString();
  const rows = [];

  for (const el of (res.data?.elements || [])) {
    const spend = parseFloat(el.costInLocalCurrency || 0);
    const clicks = parseInt(el.clicks || 0);
    const impressions = parseInt(el.impressions || 0);
    const conversions = parseInt(el.externalWebsiteConversions || 0);
    const convValue = parseFloat(el.externalWebsitePostClickConversionValue || 0);

    const campaignUrn = el.pivotValues?.[0] || '';
    const campaignId = campaignUrn.split(':').pop();

    rows.push({
      customer_id: customerId, date: dateStr, platform: 'linkedin_ads',
      campaign_id: campaignId, campaign_name: '',
      impressions, clicks, spend, conversions, conversion_value: convValue,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? convValue / spend : 0,
      currency: 'SEK', collected_at: now,
    });
  }
  return rows;
}

async function collectTikTokAdsData(customerId, creds, dateStr) {
  const res = await withRetry(() => axios.get(
    'https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/', {
      params: {
        advertiser_id: creds['tiktok-advertiser-id'],
        report_type: 'BASIC',
        dimensions: JSON.stringify(['campaign_id']),
        data_level: 'AUCTION_CAMPAIGN',
        metrics: JSON.stringify(['campaign_name', 'impressions', 'clicks', 'spend', 'conversion', 'total_purchase_value']),
        start_date: dateStr,
        end_date: dateStr,
        page_size: 100,
      },
      headers: { 'Access-Token': creds['tiktok-access-token'] },
      timeout: 30000,
    }
  ), { label: `TikTok Ads ${customerId}` });

  const now = new Date().toISOString();
  const rows = [];

  for (const item of (res.data?.data?.list || [])) {
    const dims = item.dimensions || {};
    const metrics = item.metrics || {};
    const spend = parseFloat(metrics.spend || 0);
    const clicks = parseInt(metrics.clicks || 0);
    const impressions = parseInt(metrics.impressions || 0);
    const conversions = parseInt(metrics.conversion || 0);
    const convValue = parseFloat(metrics.total_purchase_value || 0);

    rows.push({
      customer_id: customerId, date: dateStr, platform: 'tiktok_ads',
      campaign_id: String(dims.campaign_id || ''), campaign_name: metrics.campaign_name || '',
      impressions, clicks, spend, conversions, conversion_value: convValue,
      ctr: impressions > 0 ? clicks / impressions : 0,
      cpc: clicks > 0 ? spend / clicks : 0,
      cpa: conversions > 0 ? spend / conversions : 0,
      roas: spend > 0 ? convValue / spend : 0,
      currency: 'SEK', collected_at: now,
    });
  }
  return rows;
}

// ══════════════════════════════════════════════════════
// Social Media Data Collection (organisk)
// ══════════════════════════════════════════════════════

const SOCIAL_PLATFORMS = {
  instagram: {
    requiredKeys: ['instagram-business-id', 'meta-access-token'],
    collect: collectInstagramData,
  },
  facebook_page: {
    requiredKeys: ['facebook-page-id', 'meta-access-token'],
    collect: collectFacebookPageData,
  },
  linkedin_company: {
    requiredKeys: ['linkedin-org-id', 'linkedin-access-token'],
    collect: collectLinkedInOrgData,
  },
  tiktok: {
    requiredKeys: ['tiktok-creator-id', 'tiktok-access-token'],
    collect: collectTikTokCreatorData,
  },
};

async function collectSocialData(customer, dateStr) {
  const results = { total: 0, platforms: {} };

  // Parallell credential-check
  const checks = await Promise.all(
    Object.entries(SOCIAL_PLATFORMS).map(async ([platform, config]) => {
      const creds = {};
      let allPresent = true;
      for (const key of config.requiredKeys) {
        const val = await getParamSafe(`/seo-mcp/integrations/${customer.id}/${key}`);
        if (!val) { allPresent = false; break; }
        creds[key] = val;
      }
      return { platform, config, creds, allPresent };
    })
  );

  for (const { platform, config, creds, allPresent } of checks) {
    if (!allPresent) continue; // Tysta — social ar optional

    try {
      const rows = await config.collect(customer.id, creds, dateStr);
      if (rows.length > 0) {
        await dedupeAndInsert('social_daily_metrics', customer.id, { platform, date: dateStr }, rows);
      }
      results.platforms[platform] = { collected: rows.length, error: null };
      results.total += rows.length;
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      results.platforms[platform] = { collected: 0, error: msg };
    }
  }

  return results;
}

function socialRow(customerId, dateStr, platform, overrides) {
  return {
    customer_id: customerId, date: dateStr, platform,
    account_id: '', account_name: '',
    followers: 0, followers_change: 0,
    posts_published: 0, reach: 0, impressions: 0,
    engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0,
    video_views: 0, engagement_rate: 0,
    story_views: 0, reel_plays: 0,
    collected_at: new Date().toISOString(),
    ...overrides,
  };
}

async function collectInstagramData(customerId, creds, dateStr) {
  const igId = creds['instagram-business-id'];
  const token = creds['meta-access-token'];
  const nextDay = new Date(new Date(dateStr).getTime() + 86400000).toISOString().split('T')[0];

  // Parallella anrop: konto-info + insights + senaste media
  const [accountRes, insightsRes, mediaRes] = await Promise.all([
    withRetry(() => axios.get(`https://graph.facebook.com/v21.0/${igId}`, {
      params: { fields: 'followers_count,username', access_token: token }, timeout: 15000,
    }), { label: 'IG account' }),

    withRetry(() => axios.get(`https://graph.facebook.com/v21.0/${igId}/insights`, {
      params: {
        metric: 'reach,impressions,profile_views,follower_count',
        period: 'day', since: dateStr, until: nextDay, access_token: token,
      }, timeout: 15000,
    }), { label: 'IG insights' }).catch(e => ({ data: { data: [] } })),

    withRetry(() => axios.get(`https://graph.facebook.com/v21.0/${igId}/media`, {
      params: {
        fields: 'id,timestamp,like_count,comments_count,media_type',
        limit: 25, access_token: token,
      }, timeout: 15000,
    }), { label: 'IG media' }).catch(e => ({ data: { data: [] } })),
  ]);

  const dayInsights = {};
  for (const m of (insightsRes.data?.data || [])) {
    dayInsights[m.name] = m.values?.[0]?.value || 0;
  }

  let totalLikes = 0, totalComments = 0, postsToday = 0;
  for (const post of (mediaRes.data?.data || [])) {
    if (post.timestamp?.split('T')[0] === dateStr) {
      postsToday++;
      totalLikes += post.like_count || 0;
      totalComments += post.comments_count || 0;
    }
  }

  const followers = accountRes.data?.followers_count || 0;
  const engagement = totalLikes + totalComments;

  return [socialRow(customerId, dateStr, 'instagram', {
    account_id: igId,
    account_name: accountRes.data?.username || '',
    followers,
    followers_change: dayInsights.follower_count || 0,
    posts_published: postsToday,
    reach: dayInsights.reach || 0,
    impressions: dayInsights.impressions || 0,
    engagement, likes: totalLikes, comments: totalComments,
    clicks: dayInsights.profile_views || 0,
    engagement_rate: followers > 0 ? engagement / followers : 0,
  })];
}

async function collectFacebookPageData(customerId, creds, dateStr) {
  const pageId = creds['facebook-page-id'];
  const token = creds['meta-access-token'];
  const nextDay = new Date(new Date(dateStr).getTime() + 86400000).toISOString().split('T')[0];

  const [pageRes, insightsRes] = await Promise.all([
    withRetry(() => axios.get(`https://graph.facebook.com/v21.0/${pageId}`, {
      params: { fields: 'fan_count,name', access_token: token }, timeout: 15000,
    }), { label: 'FB page' }),

    withRetry(() => axios.get(`https://graph.facebook.com/v21.0/${pageId}/insights`, {
      params: {
        metric: 'page_impressions,page_post_engagements,page_fan_adds,page_views_total,page_actions_post_reactions_total',
        period: 'day', since: dateStr, until: nextDay, access_token: token,
      }, timeout: 15000,
    }), { label: 'FB insights' }).catch(e => ({ data: { data: [] } })),
  ]);

  const dayInsights = {};
  for (const m of (insightsRes.data?.data || [])) {
    const val = m.values?.[0]?.value || 0;
    dayInsights[m.name] = typeof val === 'object' ? Object.values(val).reduce((a, b) => a + b, 0) : val;
  }

  const followers = pageRes.data?.fan_count || 0;
  const engagement = dayInsights.page_post_engagements || 0;

  return [socialRow(customerId, dateStr, 'facebook_page', {
    account_id: pageId,
    account_name: pageRes.data?.name || '',
    followers,
    followers_change: dayInsights.page_fan_adds || 0,
    impressions: dayInsights.page_impressions || 0,
    engagement,
    likes: dayInsights.page_actions_post_reactions_total || 0,
    clicks: dayInsights.page_views_total || 0,
    engagement_rate: followers > 0 ? engagement / followers : 0,
  })];
}

async function collectLinkedInOrgData(customerId, creds, dateStr) {
  const orgId = creds['linkedin-org-id'];
  const token = creds['linkedin-access-token'];
  const dateStart = new Date(dateStr).getTime();
  const dateEnd = dateStart + 86400000;

  // Parallella anrop
  const [followerRes, shareRes] = await Promise.all([
    withRetry(() => axios.get(
      `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}`, {
        headers: { 'Authorization': `Bearer ${token}` }, timeout: 15000,
      }
    ), { label: 'LI followers' }).catch(e => ({ data: { elements: [] } })),

    withRetry(() => axios.get(
      `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=urn:li:organization:${orgId}&timeIntervals.timeGranularityType=DAY&timeIntervals.timeRange.start=${dateStart}&timeIntervals.timeRange.end=${dateEnd}`, {
        headers: { 'Authorization': `Bearer ${token}` }, timeout: 15000,
      }
    ), { label: 'LI shares' }).catch(e => ({ data: { elements: [] } })),
  ]);

  const fStats = followerRes.data?.elements?.[0];
  const followers = (fStats?.followerCounts?.organicFollowerCount || 0) + (fStats?.followerCounts?.paidFollowerCount || 0);

  const agg = shareRes.data?.elements?.[0]?.totalShareStatistics || {};
  const likes = agg.likeCount || 0;
  const comments = agg.commentCount || 0;
  const shares = agg.shareCount || 0;
  const engagement = likes + comments + shares;

  return [socialRow(customerId, dateStr, 'linkedin_company', {
    account_id: orgId, followers,
    impressions: agg.impressionCount || 0,
    engagement, likes, comments, shares,
    clicks: agg.clickCount || 0,
    engagement_rate: followers > 0 ? engagement / followers : 0,
  })];
}

async function collectTikTokCreatorData(customerId, creds, dateStr) {
  const creatorId = creds['tiktok-creator-id'];
  const token = creds['tiktok-access-token'];

  // Parallella anrop
  const [statsRes, videoRes] = await Promise.all([
    withRetry(() => axios.get('https://business-api.tiktok.com/open_api/v1.3/business/get/', {
      params: { business_id: creatorId, fields: JSON.stringify(['followers_count', 'likes_count']) },
      headers: { 'Access-Token': token }, timeout: 15000,
    }), { label: 'TT stats' }).catch(e => ({ data: { data: {} } })),

    withRetry(() => axios.get('https://business-api.tiktok.com/open_api/v1.3/business/video/list/', {
      params: {
        business_id: creatorId,
        fields: JSON.stringify(['item_id', 'create_time', 'video_views', 'likes', 'comments', 'shares']),
      },
      headers: { 'Access-Token': token }, timeout: 15000,
    }), { label: 'TT videos' }).catch(e => ({ data: { data: { videos: [] } } })),
  ]);

  const followers = statsRes.data?.data?.followers_count || 0;
  let likes = 0, videoViews = 0, comments = 0, shares = 0, postsToday = 0;

  for (const video of (videoRes.data?.data?.videos || [])) {
    const createDate = new Date((video.create_time || 0) * 1000).toISOString().split('T')[0];
    if (createDate === dateStr) {
      postsToday++;
      videoViews += video.video_views || 0;
      likes += video.likes || 0;
      comments += video.comments || 0;
      shares += video.shares || 0;
    }
  }

  const engagement = likes + comments + shares;

  return [socialRow(customerId, dateStr, 'tiktok', {
    account_id: creatorId, followers,
    posts_published: postsToday,
    engagement, likes, comments, shares,
    video_views: videoViews,
    engagement_rate: followers > 0 ? engagement / followers : 0,
  })];
}

// ══════════════════════════════════════════════════════
// Main Handler
// ══════════════════════════════════════════════════════

exports.handler = async (event) => {
  lambdaStartTime = Date.now();
  console.log('=== DATA COLLECTOR v2 START ===');
  console.log(`Event: ${JSON.stringify(event)}`);

  // Backfill-stod: event.startDate + event.endDate, eller gardag
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = event?.date || yesterday.toISOString().split('T')[0];

  // GSC hamtar alltid 3 dagar tillbaka (latency)
  const gscEnd = dateStr;
  const gscStartDate = new Date(dateStr);
  gscStartDate.setDate(gscStartDate.getDate() - 2);
  const gscStart = gscStartDate.toISOString().split('T')[0];

  // For backfill: anvand startDate/endDate fran event
  const backfillStart = event?.startDate || gscStart;
  const backfillEnd = event?.endDate || gscEnd;

  console.log(`Datum: ${dateStr} (GSC: ${backfillStart} -> ${backfillEnd})`);

  // 1. Prefetch ALLA SSM-parametrar i ett svep (istallet for ~50 anrop per kund)
  console.log('Prefetchar SSM-parametrar...');
  await prefetchParams('/seo-mcp/');
  console.log(`  ${ssmCache.size} parametrar cachade`);

  // 2. Sakerstall BigQuery-tabeller
  await ensureTables();

  // 3. Hamta alla kunder
  const customers = await getCustomers();
  console.log(`Hittade ${customers.length} kunder`);

  const results = {
    date: dateStr,
    customers: {},
    totals: { gsc_records: 0, ads_records: 0, social_records: 0, errors: 0 },
    aborted: false,
  };

  for (const customer of customers) {
    // Timeout-guard: avbryt om vi narmar oss Lambda-timeout
    if (shouldAbort()) {
      console.log(`\nTIMEOUT GUARD: Avbryter — ${Math.round(timeRemaining() / 1000)}s kvar`);
      results.aborted = true;
      break;
    }

    const custStart = Date.now();
    console.log(`\n--- ${customer.id} ---`);
    results.customers[customer.id] = {};

    // 1. GSC
    try {
      const gscResult = await collectGscData(customer, backfillStart, backfillEnd);
      results.customers[customer.id].gsc = gscResult;
      results.totals.gsc_records += gscResult.collected;

      await logCollection(customer.id, 'gsc',
        gscResult.error ? 'error' : (gscResult.collected > 0 ? 'success' : 'empty'),
        gscResult.collected, backfillStart, backfillEnd, Date.now() - custStart, gscResult.error
      );

      if (gscResult.collected > 0) console.log(`  GSC: ${gscResult.collected} rader`);
      else if (gscResult.error) console.log(`  GSC: ${gscResult.error}`);
    } catch (e) {
      console.error(`  GSC CRASH: ${e.message}`);
      results.customers[customer.id].gsc = { collected: 0, error: e.message };
      results.totals.errors++;
      await logCollection(customer.id, 'gsc', 'crash', 0, backfillStart, backfillEnd, Date.now() - custStart, e.message);
    }

    // 2. Ads
    const adsStart = Date.now();
    try {
      const adsResult = await collectAdsData(customer, dateStr);
      results.customers[customer.id].ads = adsResult;
      results.totals.ads_records += adsResult.total;

      for (const [platform, pResult] of Object.entries(adsResult.platforms)) {
        if (pResult.collected > 0) {
          console.log(`  ${platform}: ${pResult.collected} kampanjer`);
          await logCollection(customer.id, platform, 'success', pResult.collected, dateStr, dateStr, Date.now() - adsStart, null);
        }
        if (pResult.error && pResult.error !== 'Ej konfigurerad') {
          console.log(`  ${platform}: ${pResult.error}`);
          results.totals.errors++;
          await logCollection(customer.id, platform, 'error', 0, dateStr, dateStr, Date.now() - adsStart, pResult.error);
        }
      }
    } catch (e) {
      console.error(`  ADS CRASH: ${e.message}`);
      results.customers[customer.id].ads = { total: 0, error: e.message };
      results.totals.errors++;
    }

    // 3. Social
    const socialStart = Date.now();
    try {
      const socialResult = await collectSocialData(customer, dateStr);
      results.customers[customer.id].social = socialResult;
      results.totals.social_records += socialResult.total;

      for (const [platform, pResult] of Object.entries(socialResult.platforms)) {
        if (pResult.collected > 0) {
          console.log(`  ${platform} (social): ${pResult.collected}`);
          await logCollection(customer.id, platform, 'success', pResult.collected, dateStr, dateStr, Date.now() - socialStart, null);
        }
        if (pResult.error) {
          console.log(`  ${platform} (social): ${pResult.error}`);
          await logCollection(customer.id, platform, 'error', 0, dateStr, dateStr, Date.now() - socialStart, pResult.error);
        }
      }
    } catch (e) {
      console.error(`  SOCIAL CRASH: ${e.message}`);
      results.customers[customer.id].social = { total: 0, error: e.message };
      results.totals.errors++;
    }
  }

  const duration = Date.now() - lambdaStartTime;
  console.log(`\n=== DATA COLLECTOR v2 KLAR ===`);
  console.log(`Tid: ${(duration / 1000).toFixed(1)}s`);
  console.log(`GSC: ${results.totals.gsc_records} | Ads: ${results.totals.ads_records} | Social: ${results.totals.social_records} | Fel: ${results.totals.errors}`);
  if (results.aborted) console.log('OBS: Avbruten pga timeout-guard');

  return {
    statusCode: 200,
    body: JSON.stringify({
      success: true,
      version: 2,
      date: dateStr,
      duration_seconds: (duration / 1000).toFixed(1),
      aborted: results.aborted,
      totals: results.totals,
      customers: Object.fromEntries(
        Object.entries(results.customers).map(([id, data]) => [
          id,
          {
            gsc: data.gsc?.collected || 0,
            ads: data.ads?.total || 0,
            social: data.social?.total || 0,
            errors: [
              data.gsc?.error,
              ...Object.values(data.ads?.platforms || {}).map(p => p.error).filter(e => e && e !== 'Ej konfigurerad'),
              ...Object.values(data.social?.platforms || {}).map(p => p.error).filter(Boolean),
            ].filter(Boolean),
          },
        ])
      ),
    }),
  };
};

// ── Lokal testning ──
if (require.main === module) {
  exports.handler({ date: new Date().toISOString().split('T')[0] })
    .then(r => console.log(JSON.stringify(JSON.parse(r.body), null, 2)))
    .catch(e => console.error(e));
}
