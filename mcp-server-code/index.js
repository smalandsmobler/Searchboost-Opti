const express = require('express');
const { SSMClient, GetParameterCommand, GetParametersByPathCommand, PutParameterCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { generateReportPDF, fetchPageSpeed } = require('./pdf-report-generator');

const app = express();
app.use(express.json());

// ── Parse Claude AI JSON (handles ```json wrapping) ──
function parseClaudeJSON(text) {
  let cleaned = text.trim();
  // Remove ```json ... ``` wrapping
  const match = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (match) cleaned = match[1].trim();
  return JSON.parse(cleaned);
}
app.use(express.static(path.join(__dirname, '..', 'dashboard')));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── API Key Authentication Middleware ──
// Skyddar alla /api/ endpoints. Dashboard, statiska filer och /health är öppna.
let _cachedApiKey = null;
let _apiKeyCacheTime = 0;

async function getApiKey() {
  const now = Date.now();
  if (_cachedApiKey && (now - _apiKeyCacheTime) < 86400000) return _cachedApiKey; // 24h cache
  try {
    const { SSMClient: S, GetParameterCommand: G } = require('@aws-sdk/client-ssm');
    const s = new S({ region: process.env.AWS_REGION || 'eu-north-1' });
    const r = await s.send(new G({ Name: '/seo-mcp/dashboard/api-key', WithDecryption: true }));
    _cachedApiKey = r.Parameter.Value;
    _apiKeyCacheTime = now;
    return _cachedApiKey;
  } catch (e) {
    console.error('Could not load API key from SSM:', e.message);
    return null;
  }
}

app.use(async (req, res, next) => {
  // Öppna routes: statiska filer, health, OPTIONS, PDF reports
  if (!req.path.startsWith('/api/')) return next();
  if (req.method === 'OPTIONS') return next();
  if (req.path.startsWith('/api/reports/pdf/') || req.path.startsWith('/api/reports/download/')) return next();

  const apiKey = await getApiKey();
  if (!apiKey) return next(); // Om SSM-nyckeln inte finns, tillåt (backward compat)

  const provided = req.headers['x-api-key'] || req.query.api_key;
  if (provided === apiKey) return next();

  return res.status(401).json({ error: 'Ogiltig eller saknad API-nyckel', hint: 'Skicka x-api-key header' });
});

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: REGION });

// ── Cache for SSM parameters (24h TTL) ──
// SSM params change very rarely. Restart PM2 to force refresh.
// KMS free tier = 20k requests/month — long cache prevents hitting limit.
const paramCache = {};
const CACHE_TTL = 86400000; // 24 hours

async function getParam(name) {
  const now = Date.now();
  if (paramCache[name] && (now - paramCache[name].ts) < CACHE_TTL) {
    return paramCache[name].value;
  }
  const res = await ssm.send(new GetParameterCommand({
    Name: name, WithDecryption: true
  }));
  paramCache[name] = { value: res.Parameter.Value, ts: now };
  return res.Parameter.Value;
}

// ── Cache for WordPress sites list (24h — same as SSM) ──
let _sitesCache = null;
let _sitesCacheTime = 0;

async function getWordPressSites() {
  const now = Date.now();
  if (_sitesCache && (now - _sitesCacheTime) < CACHE_TTL) {
    return _sitesCache;
  }
  const allParams = [];
  let nextToken;
  do {
    const res = await ssm.send(new GetParametersByPathCommand({
      Path: '/seo-mcp/wordpress/', Recursive: true, WithDecryption: true,
      ...(nextToken ? { NextToken: nextToken } : {})
    }));
    allParams.push(...(res.Parameters || []));
    nextToken = res.NextToken;
  } while (nextToken);
  const sites = {};
  for (const p of allParams) {
    const parts = p.Name.split('/');
    const siteId = parts[3]; // e.g. site1
    const key = parts[4];    // url, username, app-password
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    sites[siteId][key] = p.Value;
  }
  _sitesCache = Object.values(sites).filter(s => s.url);
  _sitesCacheTime = Date.now();
  return _sitesCache;
}

// ── Get ALL WordPress sites (including placeholder — for onboarding status) ──
async function getAllWordPressSites() {
  const allParams = [];
  let nextToken;
  do {
    const res = await ssm.send(new GetParametersByPathCommand({
      Path: '/seo-mcp/wordpress/', Recursive: true, WithDecryption: true,
      ...(nextToken ? { NextToken: nextToken } : {})
    }));
    allParams.push(...(res.Parameters || []));
    nextToken = res.NextToken;
  } while (nextToken);
  const sites = {};
  for (const p of allParams) {
    const parts = p.Name.split('/');
    const siteId = parts[3];
    const key = parts[4];
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    sites[siteId][key] = p.Value;
  }
  // Also fetch integrations data for each site
  const intParams = [];
  let intToken;
  do {
    const res = await ssm.send(new GetParametersByPathCommand({
      Path: '/seo-mcp/integrations/', Recursive: true, WithDecryption: true,
      ...(intToken ? { NextToken: intToken } : {})
    }));
    intParams.push(...(res.Parameters || []));
    intToken = res.NextToken;
  } while (intToken);
  for (const p of intParams) {
    const parts = p.Name.split('/');
    const siteId = parts[3];
    const key = parts[4];
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    sites[siteId][key] = p.Value;
  }
  return Object.values(sites).filter(s => s.url);
}

// ── BigQuery client (lazy init) ──
let bqClient = null;
let bqDataset = null;

async function getBigQuery() {
  if (bqClient) return { bq: bqClient, dataset: bqDataset };
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  bqDataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  bqClient = new BigQuery({ projectId });
  return { bq: bqClient, dataset: bqDataset };
}

// ── Anthropic client (lazy init) ──
let claude = null;
async function getClaude() {
  if (claude) return claude;
  const apiKey = await getParam('/seo-mcp/anthropic/api-key');
  claude = new Anthropic({ apiKey });
  return claude;
}

// ── Trello helpers ──
let _trelloCardsCache = null;
let _trelloCardsCacheTime = 0;
const TRELLO_CARDS_CACHE_TTL = 600000; // 10 min

async function getCachedTrelloCards(boardId) {
  const now = Date.now();
  if (_trelloCardsCache && (now - _trelloCardsCacheTime) < TRELLO_CARDS_CACHE_TTL) {
    return _trelloCardsCache;
  }
  _trelloCardsCache = await trelloApi('GET', `/boards/${boardId}/cards`, { fields: 'name,desc' });
  _trelloCardsCacheTime = Date.now();
  return _trelloCardsCache;
}

async function trelloApi(method, path, data = {}) {
  const apiKey = await getParam('/seo-mcp/trello/api-key');
  const token = await getParam('/seo-mcp/trello/token');
  const url = `https://api.trello.com/1${path}`;
  const params = { key: apiKey, token, ...data };
  if (method === 'GET') {
    const res = await axios.get(url, { params });
    return res.data;
  }
  const res = await axios[method.toLowerCase()](url, null, { params });
  return res.data;
}

async function createTrelloCard(listId, name, desc) {
  return trelloApi('POST', '/cards', { idList: listId, name, desc });
}

// ── WordPress REST API helpers ──
async function wpApi(site, method, endpoint, data = null) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const config = {
    method,
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json'
    }
  };
  if (data) config.data = data;
  const res = await axios(config);
  return res.data;
}

// ── Rank Math API helper ──
async function rankMathApi(site, endpoint) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res = await axios.get(`${site.url}/wp-json/rankmath/v1${endpoint}`, {
    headers: { 'Authorization': `Basic ${auth}` }
  });
  return res.data;
}

// ── BigQuery logging (uses DML INSERT for sandbox compatibility) ──
async function logOptimization(entry) {
  try {
    const { bq, dataset } = await getBigQuery();
    const row = { timestamp: new Date().toISOString(), ...entry };
    const cols = Object.keys(row);
    const vals = cols.map(c => {
      const v = row[c];
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'number') return String(v);
      return `'${String(v).replace(/'/g, "\\'")}'`;
    });
    const sql = `INSERT INTO \`${dataset}.seo_optimization_log\` (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
    await bq.query(sql);
  } catch (err) {
    console.error('BigQuery log error:', err.message);
  }
}

async function addToWorkQueue(task) {
  try {
    const { bq, dataset } = await getBigQuery();
    const row = {
      queue_id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      ...task
    };
    const cols = Object.keys(row);
    const vals = cols.map(c => {
      const v = row[c];
      if (v === null || v === undefined) return 'NULL';
      if (typeof v === 'number') return String(v);
      return `'${String(v).replace(/'/g, "\\'")}'`;
    });
    const sql = `INSERT INTO \`${dataset}.seo_work_queue\` (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
    await bq.query(sql);
  } catch (err) {
    console.error('BigQuery queue error:', err.message);
  }
}

// ── SE Ranking API helpers ──
let _seRankingKey = null;

async function getSeRankingKey() {
  if (_seRankingKey) return _seRankingKey;
  _seRankingKey = await getParam('/seo-mcp/seranking/api-key').catch(() => null);
  return _seRankingKey;
}

async function seRankingApi(method, endpoint, data = null) {
  const apiKey = await getSeRankingKey();
  if (!apiKey) return null;
  // Auth via query parameter (SE Ranking kräver ?apikey= inte header)
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `https://api.seranking.com/v1${endpoint}${separator}apikey=${apiKey}&output=json`;
  const config = { method: method || 'GET', url, timeout: 30000 };
  if (data && (method === 'POST' || method === 'PUT')) {
    config.headers = { 'Content-Type': 'application/json' };
    config.data = data;
  }
  const res = await axios(config);
  return res.data;
}

// Project API (api4) — for project rankings, keywords etc.
async function seRankingProjectApi(method, endpoint, data = null) {
  const apiKey = await getSeRankingKey();
  if (!apiKey) return null;
  // Auth via query parameter
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `https://api4.seranking.com${endpoint}${separator}apikey=${apiKey}&output=json`;
  const config = { method: method || 'GET', url, timeout: 30000 };
  if (data) {
    config.headers = { 'Content-Type': 'application/json' };
    config.data = data;
  }
  const res = await axios(config);
  return res.data;
}

// ── Google Search Console API helper ──
let gscAuth = null;

async function getGscAuth() {
  if (gscAuth) return gscAuth;
  // Ensure credentials file is written (same as BigQuery)
  await getBigQuery();
  const { GoogleAuth } = require('google-auth-library');
  gscAuth = new GoogleAuth({
    keyFile: '/tmp/wif-config.json',
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly']
  });
  return gscAuth;
}

async function gscSearchAnalytics(siteUrl, keywords, days = 7) {
  const auth = await getGscAuth();
  const client = await auth.getClient();
  const token = await client.getAccessToken();

  // GSC property URL format: must match exactly what's in GSC
  const encodedSiteUrl = encodeURIComponent(siteUrl);

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const body = {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    dimensions: ['query'],
    rowLimit: 500
  };

  // If we have specific keywords, filter for them
  if (keywords && keywords.length > 0) {
    // GSC doesn't support OR-filter for multiple keywords easily,
    // so we fetch all and filter client-side
  }

  const res = await axios.post(
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
    body,
    { headers: {
      'Authorization': `Bearer ${token.token || token}`,
      'x-goog-user-project': 'seo-aouto'
    } }
  );

  return res.data.rows || [];
}

// ── Parse ABC keywords from Trello card description ──
function parseAbcKeywords(description) {
  if (!description) return { A: [], B: [], C: [], all: [] };

  const result = { A: [], B: [], C: [], all: [] };
  const lines = description.split('\n');

  for (const line of lines) {
    const matchA = line.match(/^A\s*[=:]\s*(.+)/i);
    const matchB = line.match(/^B\s*[=:]\s*(.+)/i);
    const matchC = line.match(/^C\s*[=:]\s*(.+)/i);

    if (matchA) {
      const words = matchA[1].split(',').map(w => w.trim()).filter(Boolean);
      result.A.push(...words);
      result.all.push(...words.map(w => ({ keyword: w, category: 'A' })));
    } else if (matchB) {
      const words = matchB[1].split(',').map(w => w.trim()).filter(Boolean);
      result.B.push(...words);
      result.all.push(...words.map(w => ({ keyword: w, category: 'B' })));
    } else if (matchC) {
      const words = matchC[1].split(',').map(w => w.trim()).filter(Boolean);
      result.C.push(...words);
      result.all.push(...words.map(w => ({ keyword: w, category: 'C' })));
    }
  }

  return result;
}

// ── Generic BigQuery DML insert helper ──
async function bqInsert(table, row) {
  const { bq, dataset } = await getBigQuery();
  const cols = Object.keys(row);
  const vals = cols.map(c => {
    const v = row[c];
    if (v === null || v === undefined) return 'NULL';
    if (typeof v === 'number') return String(v);
    return `'${String(v).replace(/'/g, "\\'")}'`;
  });
  const sql = `INSERT INTO \`${dataset}.${table}\` (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
  await bq.query(sql);
}

// ── Ensure pipeline tables exist ──
async function ensurePipelineTables() {
  const { bq, dataset } = await getBigQuery();
  const tables = [
    {
      name: 'customer_pipeline',
      schema: `customer_id STRING NOT NULL, company_name STRING, contact_person STRING,
        contact_email STRING, website_url STRING, stage STRING NOT NULL,
        stage_updated_at TIMESTAMP, prospect_notes STRING, initial_traffic_trend STRING,
        service_type STRING, monthly_amount_sek INT64, contract_start_date DATE,
        contract_end_date DATE, contract_status STRING, audit_meeting_date TIMESTAMP,
        startup_meeting_date TIMESTAMP, created_at TIMESTAMP, updated_at TIMESTAMP,
        trello_card_id STRING, audit_summary STRING`
    },
    {
      name: 'customer_keywords',
      schema: `id STRING NOT NULL, customer_id STRING NOT NULL, keyword STRING NOT NULL,
        tier STRING NOT NULL, phase STRING NOT NULL, monthly_search_volume INT64,
        keyword_difficulty INT64, current_position INT64, target_url STRING,
        created_at TIMESTAMP, updated_at TIMESTAMP`
    },
    {
      name: 'action_plans',
      schema: `plan_id STRING NOT NULL, customer_id STRING NOT NULL, created_at TIMESTAMP,
        month_number INT64, task_type STRING, task_description STRING, target_url STRING,
        target_keyword STRING, priority INT64, status STRING, work_queue_id STRING,
        completed_at TIMESTAMP, estimated_effort STRING, source STRING`
    },
    {
      name: 'seo_optimization_log',
      schema: `timestamp TIMESTAMP, customer_id STRING, site_url STRING, optimization_type STRING,
        page_url STRING, before_state STRING, after_state STRING, claude_reasoning STRING,
        impact_estimate FLOAT64, source STRING, time_spent_minutes INT64, performed_by STRING`
    },
    {
      name: 'seo_work_queue',
      schema: `id STRING, customer_id STRING, site_url STRING, task_type STRING,
        page_url STRING, context_data STRING, priority INT64, status STRING,
        created_at TIMESTAMP, started_at TIMESTAMP, completed_at TIMESTAMP`
    },
    {
      name: 'weekly_reports',
      schema: `email_sent_at TIMESTAMP, customer_id STRING, report_html STRING,
        metrics_json STRING, recipient_list STRING`
    },
    {
      name: 'performance_log',
      schema: `customer_id STRING, url STRING, mobile_score INT64, desktop_score INT64,
        mobile_fcp STRING, mobile_lcp STRING, mobile_cls STRING, mobile_tbt STRING,
        desktop_fcp STRING, desktop_lcp STRING, desktop_cls STRING, desktop_tbt STRING,
        scanned_at TIMESTAMP`
    }
  ];
  for (const t of tables) {
    try {
      await bq.query(`SELECT 1 FROM \`${dataset}.${t.name}\` LIMIT 1`);
    } catch (e) {
      if (e.message && e.message.includes('Not found')) {
        console.log(`Creating table ${t.name}...`);
        await bq.query(`CREATE TABLE \`${dataset}.${t.name}\` (${t.schema})`);
        console.log(`Table ${t.name} created.`);
      }
    }
  }

  // Add missing columns to existing tables
  const alterColumns = [
    { table: 'customer_pipeline', column: 'audit_summary', type: 'STRING' },
    // Multi-salesperson support
    { table: 'customer_pipeline', column: 'assigned_to', type: 'STRING' },
    { table: 'customer_pipeline', column: 'assigned_to_name', type: 'STRING' },
    // Domain analysis results
    { table: 'customer_pipeline', column: 'analysis_score', type: 'INT64' },
    { table: 'customer_pipeline', column: 'analysis_summary', type: 'STRING' },
    { table: 'customer_pipeline', column: 'analysis_json', type: 'STRING' },
    { table: 'customer_pipeline', column: 'analysis_date', type: 'TIMESTAMP' },
    // Cost estimate
    { table: 'customer_pipeline', column: 'cost_estimate_sek', type: 'INT64' },
    { table: 'customer_pipeline', column: 'cost_estimate_type', type: 'STRING' },
    { table: 'customer_pipeline', column: 'cost_estimate_json', type: 'STRING' },
    // Presentation tracking
    { table: 'customer_pipeline', column: 'last_presentation_url', type: 'STRING' },
    { table: 'customer_pipeline', column: 'last_presentation_date', type: 'TIMESTAMP' },
    // Geographic focus & order tracking
    { table: 'customer_pipeline', column: 'geographic_focus', type: 'STRING' },
    { table: 'customer_pipeline', column: 'order_confirmed_at', type: 'TIMESTAMP' },
    { table: 'customer_pipeline', column: 'order_confirmed_by', type: 'STRING' },
    { table: 'customer_pipeline', column: 'activated_at', type: 'TIMESTAMP' },
    // Existing columns
    { table: 'action_plans', column: 'source', type: 'STRING' },
    { table: 'seo_work_queue', column: 'source', type: 'STRING' },
    { table: 'seo_work_queue', column: 'site_url', type: 'STRING' },
    { table: 'seo_work_queue', column: 'queue_id', type: 'STRING' },
    { table: 'seo_work_queue', column: 'processed_at', type: 'TIMESTAMP' },
    { table: 'seo_work_queue', column: 'description', type: 'STRING' },
    { table: 'seo_work_queue', column: 'severity', type: 'STRING' }
  ];
  for (const col of alterColumns) {
    try {
      await bq.query(`SELECT ${col.column} FROM \`${dataset}.${col.table}\` LIMIT 1`);
    } catch (e) {
      if (e.message && e.message.includes('Unrecognized name')) {
        console.log(`Adding column ${col.column} to ${col.table}...`);
        await bq.query(`ALTER TABLE \`${dataset}.${col.table}\` ADD COLUMN ${col.column} ${col.type}`);
      }
    }
  }

  // Create salespeople table if not exists
  try {
    await bq.query(`SELECT 1 FROM \`${dataset}.salespeople\` LIMIT 1`);
  } catch (e) {
    if (e.message && e.message.includes('Not found')) {
      console.log('Creating salespeople table...');
      await bq.query(`CREATE TABLE \`${dataset}.salespeople\` (
        salesperson_id STRING NOT NULL,
        email STRING NOT NULL,
        display_name STRING NOT NULL,
        role STRING NOT NULL,
        is_active BOOL,
        created_at TIMESTAMP
      )`);
      // Seed with Mikael as admin
      await bq.query(`INSERT INTO \`${dataset}.salespeople\` (salesperson_id, email, display_name, role, is_active, created_at)
        VALUES ('mikael', 'mikael@searchboost.nu', 'Mikael Larsson', 'admin', true, CURRENT_TIMESTAMP())`);
      console.log('salespeople table created + Mikael seeded.');
    }
  }

  // Migrate old stage names to new ones (one-time)
  try {
    const stageMap = { 'prospect': 'analys', 'audit': 'analys', 'proposal': 'presentation', 'contract': 'orderbekraftelse', 'active': 'aktiv' };
    for (const [oldStage, newStage] of Object.entries(stageMap)) {
      const [check] = await bq.query(`SELECT COUNT(*) as cnt FROM \`${dataset}.customer_pipeline\` WHERE stage = '${oldStage}'`);
      if (check[0] && check[0].cnt > 0) {
        console.log(`Migrating ${check[0].cnt} customers from stage '${oldStage}' to '${newStage}'...`);
        await bq.query(`UPDATE \`${dataset}.customer_pipeline\` SET stage = '${newStage}', updated_at = CURRENT_TIMESTAMP() WHERE stage = '${oldStage}'`);
      }
    }
  } catch (e) {
    console.error('Stage migration error (non-fatal):', e.message);
  }

  // Set assigned_to for existing customers without one (default to mikael)
  try {
    await bq.query(`UPDATE \`${dataset}.customer_pipeline\` SET assigned_to = 'mikael', assigned_to_name = 'Mikael Larsson' WHERE assigned_to IS NULL`);
  } catch (e) { /* ignore if column doesn't exist yet */ }
}

// ── Budget tier helpers ──
const TIER_LIMITS = {
  basic:    { auto_tasks_per_month: 15, manual_tasks_per_month: 0,  content_creation: false, schema_markup: false },
  standard: { auto_tasks_per_month: 30, manual_tasks_per_month: 5,  content_creation: false, schema_markup: true },
  premium:  { auto_tasks_per_month: 50, manual_tasks_per_month: 10, content_creation: true,  schema_markup: true }
};

function getContractTier(monthlyAmount) {
  if (!monthlyAmount || monthlyAmount <= 5000) return 'basic';
  if (monthlyAmount <= 10000) return 'standard';
  return 'premium';
}

// ══════════════════════════════════════════
// MCP TOOLS — SEO Operations
// ══════════════════════════════════════════

// Tool 1: Analyze site SEO
async function analyzeSiteSEO(siteUrl) {
  const client = await getClaude();

  // Fetch page HTML
  const { data: html } = await axios.get(siteUrl, { timeout: 15000 });

  // Extract key SEO elements
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is);
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/gis);
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["'](.*?)["']/is);
  const robotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["'](.*?)["']/is);

  const seoData = {
    url: siteUrl,
    title: titleMatch ? titleMatch[1].trim() : null,
    titleLength: titleMatch ? titleMatch[1].trim().length : 0,
    description: descMatch ? descMatch[1].trim() : null,
    descriptionLength: descMatch ? descMatch[1].trim().length : 0,
    h1Tags: h1Match ? h1Match.map(h => h.replace(/<[^>]+>/g, '').trim()) : [],
    canonical: canonicalMatch ? canonicalMatch[1] : null,
    robots: robotsMatch ? robotsMatch[1] : null,
    hasSchema: html.includes('application/ld+json'),
    hasSitemap: null,
    htmlSize: html.length
  };

  // Check sitemap
  try {
    await axios.get(`${new URL(siteUrl).origin}/sitemap.xml`, { timeout: 5000 });
    seoData.hasSitemap = true;
  } catch { seoData.hasSitemap = false; }

  // Claude analysis
  const analysis = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Analysera dessa SEO-data för ${siteUrl} och ge konkreta förbättringsförslag på svenska. Fokusera på: title, description, h1, schema, internlänkar.

SEO-data: ${JSON.stringify(seoData, null, 2)}

Svara i JSON-format:
{
  "score": 0-100,
  "issues": [{"type": "...", "severity": "high|medium|low", "description": "...", "fix": "..."}],
  "summary": "kort sammanfattning"
}`
    }]
  });

  return { seoData, analysis: parseClaudeJSON(analysis.content[0].text) };
}

// Tool 2: Optimize metadata
async function optimizeMetadata(site, postId, targetKeyword) {
  const post = await wpApi(site, 'GET', `/posts/${postId}`);
  const client = await getClaude();

  const suggestion = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Optimera SEO-metadata för denna WordPress-sida.
Nuvarande title: ${post.title.rendered}
URL: ${post.link}
Target keyword: ${targetKeyword}

Ge förslag på svenska:
{
  "title": "optimerad title (max 60 tecken)",
  "description": "optimerad description (max 155 tecken)",
  "reasoning": "varför denna ändring"
}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // Update via Rank Math REST API
  await wpApi(site, 'POST', `/posts/${postId}`, {
    meta: {
      rank_math_title: result.title,
      rank_math_description: result.description
    }
  });

  // Log to BigQuery
  await logOptimization({
    customer_id: site.id,
    site_url: site.url,
    optimization_type: 'metadata',
    page_url: post.link,
    before_state: JSON.stringify({ title: post.title.rendered }),
    after_state: JSON.stringify({ title: result.title, description: result.description }),
    claude_reasoning: result.reasoning,
    impact_estimate: 0.7
  });

  // Log to Trello
  try {
    const boardId = await getParam('/seo-mcp/trello/board-id');
    const lists = await trelloApi('GET', `/boards/${boardId}/lists`);
    const doneList = lists.find(l => l.name.toLowerCase().includes('done')) || lists[0];
    await createTrelloCard(
      doneList.id,
      `SEO: ${site.id} — Metadata: ${result.title.substring(0, 30)}...`,
      `**Typ:** Metadata-optimering\n**Kund:** ${site.id}\n**Sida:** ${post.link}\n**Keyword:** ${targetKeyword}\n**Ändring:** ${result.reasoning}`
    );
  } catch (trelloErr) {
    console.error('Trello card error:', trelloErr.message);
  }

  return result;
}

// Tool 3: Generate FAQ schema
async function generateFAQSchema(site, postId, topic) {
  const post = await wpApi(site, 'GET', `/posts/${postId}`);
  const client = await getClaude();
  const content = post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 3000);

  const faq = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Skapa 3-5 FAQ-frågor baserat på denna text om "${topic}". Skriv på svenska.

Text: ${content}

Svara i JSON:
{
  "faqs": [{"question": "...", "answer": "..."}]
}`
    }]
  });

  const result = parseClaudeJSON(faq.content[0].text);

  // Build JSON-LD
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: result.faqs.map(f => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer }
    }))
  };

  // Append schema to post content
  const schemaHtml = `\n<!-- FAQ Schema -->\n<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
  await wpApi(site, 'POST', `/posts/${postId}`, {
    content: post.content.rendered + schemaHtml
  });

  await logOptimization({
    customer_id: site.id,
    site_url: site.url,
    optimization_type: 'faq_schema',
    page_url: post.link,
    before_state: JSON.stringify({ hasSchema: false }),
    after_state: JSON.stringify({ schema }),
    claude_reasoning: `Generated ${result.faqs.length} FAQ items for "${topic}"`,
    impact_estimate: 0.5
  });

  return { schema, faqs: result.faqs };
}

// Tool 4: Add internal links
async function addInternalLinks(site, postId, targetKeyword) {
  const post = await wpApi(site, 'GET', `/posts/${postId}`);
  const allPosts = await wpApi(site, 'GET', '/posts?per_page=50&status=publish');
  const client = await getClaude();

  const suggestion = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Hitta möjligheter för internlänkar i denna text.
Nuvarande sida: ${post.link}
Keyword: ${targetKeyword}

Text (förkortad): ${post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 2000)}

Tillgängliga sidor att länka till:
${allPosts.filter(p => p.id !== postId).map(p => `- ${p.title.rendered}: ${p.link}`).join('\n')}

Svara i JSON:
{
  "links": [{"anchorText": "text att länka", "targetUrl": "url att länka till", "context": "mening där länken ska in"}],
  "reasoning": "varför dessa länkar"
}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // Apply links to content
  let updatedContent = post.content.rendered;
  for (const link of result.links) {
    const regex = new RegExp(`(${link.anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)`, 'i');
    updatedContent = updatedContent.replace(regex, `<a href="${link.targetUrl}">$1</a>`);
  }

  if (updatedContent !== post.content.rendered) {
    await wpApi(site, 'POST', `/posts/${postId}`, { content: updatedContent });
  }

  await logOptimization({
    customer_id: site.id,
    site_url: site.url,
    optimization_type: 'internal_links',
    page_url: post.link,
    before_state: JSON.stringify({ linkCount: (post.content.rendered.match(/<a /g) || []).length }),
    after_state: JSON.stringify({ linkCount: (updatedContent.match(/<a /g) || []).length, newLinks: result.links }),
    claude_reasoning: result.reasoning,
    impact_estimate: 0.6
  });

  return result;
}

// Tool 5: Full site audit (used by weekly-audit Lambda)
async function fullSiteAudit(site) {
  const posts = await wpApi(site, 'GET', '/posts?per_page=100&status=publish');
  const pages = await wpApi(site, 'GET', '/pages?per_page=100&status=publish');
  const allContent = [...posts, ...pages];

  const issues = [];
  for (const item of allContent) {
    const problems = [];
    const title = item.title.rendered;
    const content = item.content.rendered;

    // Check title length
    if (!title || title.length < 20) problems.push({ type: 'short_title', severity: 'high' });
    if (title && title.length > 60) problems.push({ type: 'long_title', severity: 'medium' });

    // Check content length
    const textContent = content.replace(/<[^>]+>/g, '');
    if (textContent.length < 300) problems.push({ type: 'thin_content', severity: 'high' });

    // Check for H1
    if (!content.match(/<h1/i)) problems.push({ type: 'missing_h1', severity: 'medium' });

    // Check for internal links
    const internalLinks = (content.match(new RegExp(`<a[^>]*href=["']${site.url}`, 'gi')) || []).length;
    if (internalLinks === 0) problems.push({ type: 'no_internal_links', severity: 'medium' });

    // Check for images without alt
    const imgsWithoutAlt = (content.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
    if (imgsWithoutAlt > 0) problems.push({ type: 'missing_alt_text', severity: 'low', count: imgsWithoutAlt });

    // Check schema
    if (!content.includes('application/ld+json')) problems.push({ type: 'no_schema', severity: 'low' });

    if (problems.length > 0) {
      issues.push({
        id: item.id,
        type: item.type,
        title,
        url: item.link,
        problems,
        priority: problems.reduce((sum, p) => sum + (p.severity === 'high' ? 3 : p.severity === 'medium' ? 2 : 1), 0)
      });
    }
  }

  // Sort by priority descending
  issues.sort((a, b) => b.priority - a.priority);

  // Add top issues to work queue
  for (const issue of issues.slice(0, 10)) {
    await addToWorkQueue({
      customer_id: site.id,
      priority: issue.priority,
      task_type: issue.problems[0].type,
      page_url: issue.url,
      context_data: JSON.stringify(issue)
    });
  }

  return {
    site: site.url,
    totalPages: allContent.length,
    pagesWithIssues: issues.length,
    topIssues: issues.slice(0, 10)
  };
}

// ══════════════════════════════════════════
// EXPRESS ROUTES — Health + Dashboard API
// ══════════════════════════════════════════

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// Dashboard API: Get all customers and their status
app.get('/api/customers', async (req, res) => {
  try {
    const sites = await getWordPressSites();
    res.json({ customers: sites.map(s => ({ id: s.id, url: s.url })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════
// ONBOARDING STATUS API
// ══════════════════════════════════════════

// GET /api/customers/onboarding-status — Full picture of all customers
app.get('/api/customers/onboarding-status', async (req, res) => {
  try {
    const allSites = await getAllWordPressSites();
    const { bq, dataset } = await getBigQuery();

    // Get pipeline data
    let pipelineRows = [];
    try {
      const [rows] = await bq.query({ query: `SELECT * FROM \`${dataset}.customer_pipeline\`` });
      pipelineRows = rows;
    } catch (e) { /* table might not exist yet */ }

    // Get keyword counts per customer
    let keywordCounts = {};
    try {
      const [rows] = await bq.query({ query: `SELECT customer_id, COUNT(*) as cnt FROM \`${dataset}.customer_keywords\` GROUP BY customer_id` });
      for (const r of rows) keywordCounts[r.customer_id] = r.cnt;
    } catch (e) { /* table might not exist */ }

    // Build status per customer
    const pipelineMap = {};
    for (const r of pipelineRows) pipelineMap[r.customer_id] = r;

    const customers = allSites.map(site => {
      const pipeline = pipelineMap[site.id] || {};
      const hasUrl = !!site.url;
      const hasUsername = !!(site.username && site.username !== 'placeholder');
      const hasAppPassword = !!(site['app-password'] && site['app-password'] !== 'placeholder');
      const hasGsc = !!(site['gsc-property']);
      const hasKeywords = (keywordCounts[site.id] || 0) > 0;
      const automationReady = hasUrl && hasUsername && hasAppPassword;

      const missing = [];
      if (!hasUsername) missing.push('WP-användarnamn');
      if (!hasAppPassword) missing.push('WP App-lösenord');
      if (!hasGsc) missing.push('GSC Property');
      if (!hasKeywords) missing.push('ABC-nyckelord');

      let health = 'red';
      if (automationReady && hasGsc) health = 'green';
      else if (automationReady || hasGsc) health = 'yellow';

      return {
        customer_id: site.id,
        company_name: site['company-name'] || pipeline.company_name || site.id,
        website_url: site.url,
        stage: pipeline.stage || 'okänd',
        monthly_amount_sek: pipeline.monthly_amount_sek || null,
        health,
        completeness: {
          has_url: hasUrl,
          has_username: hasUsername,
          has_app_password: hasAppPassword,
          has_gsc: hasGsc,
          has_keywords: hasKeywords,
          automation_ready: automationReady
        },
        missing,
        contact_email: site['contact-email'] || pipeline.contact_email || null,
        contact_person: site['contact-person'] || pipeline.contact_person || null
      };
    });

    const summary = {
      total: customers.length,
      automation_ready: customers.filter(c => c.completeness.automation_ready).length,
      missing_wp_creds: customers.filter(c => !c.completeness.has_username || !c.completeness.has_app_password).length,
      missing_gsc: customers.filter(c => !c.completeness.has_gsc).length,
      missing_keywords: customers.filter(c => !c.completeness.has_keywords).length,
      green: customers.filter(c => c.health === 'green').length,
      yellow: customers.filter(c => c.health === 'yellow').length,
      red: customers.filter(c => c.health === 'red').length
    };

    res.json({ customers, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/credentials — Update WP credentials + GSC from dashboard
app.post('/api/customers/:id/credentials', async (req, res) => {
  try {
    const { id } = req.params;
    const { wordpress_username, wordpress_app_password, gsc_property, contact_email, ga4_property_id, gtm_container_id, google_ads_id, meta_pixel_id, test_connection } = req.body;

    if (!wordpress_username && !wordpress_app_password && !gsc_property && !contact_email && !ga4_property_id && !gtm_container_id && !google_ads_id && !meta_pixel_id) {
      return res.status(400).json({ error: 'Ange minst ett fält att uppdatera' });
    }

    const updates = [];

    if (wordpress_username) {
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/wordpress/${id}/username`,
        Value: wordpress_username,
        Type: 'SecureString',
        Overwrite: true
      }));
      updates.push('username');
    }

    if (wordpress_app_password) {
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/wordpress/${id}/app-password`,
        Value: wordpress_app_password,
        Type: 'SecureString',
        Overwrite: true
      }));
      updates.push('app-password');
    }

    if (gsc_property) {
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/integrations/${id}/gsc-property`,
        Value: gsc_property,
        Type: 'String',
        Overwrite: true
      }));
      updates.push('gsc-property');
    }

    if (contact_email) {
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/integrations/${id}/contact-email`,
        Value: contact_email,
        Type: 'String',
        Overwrite: true
      }));
      updates.push('contact-email');
    }

    if (ga4_property_id) {
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/integrations/${id}/ga-property-id`,
        Value: ga4_property_id,
        Type: 'String',
        Overwrite: true
      }));
      updates.push('ga-property-id');
    }

    if (gtm_container_id) {
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/integrations/${id}/gtm-container-id`,
        Value: gtm_container_id,
        Type: 'String',
        Overwrite: true
      }));
      updates.push('gtm-container-id');
    }

    if (google_ads_id) {
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/integrations/${id}/google-ads-id`,
        Value: google_ads_id,
        Type: 'String',
        Overwrite: true
      }));
      updates.push('google-ads-id');
    }

    if (meta_pixel_id) {
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/integrations/${id}/meta-pixel-id`,
        Value: meta_pixel_id,
        Type: 'String',
        Overwrite: true
      }));
      updates.push('meta-pixel-id');
    }

    // Clear caches so changes take effect immediately
    _sitesCache = null;
    _sitesCacheTime = 0;
    // Clear param cache for this customer
    Object.keys(paramCache).forEach(k => {
      if (k.includes(id)) delete paramCache[k];
    });

    let wpTest = null;
    if (test_connection) {
      try {
        // Re-fetch sites to get updated credentials
        const sites = await getWordPressSites();
        const site = sites.find(s => s.id === id);
        if (site) {
          const posts = await wpApi(site, 'GET', '/posts?per_page=1');
          wpTest = { success: true, posts_found: Array.isArray(posts) ? posts.length : 0 };
        } else {
          wpTest = { success: false, error: 'Kunden hittades inte i SSM efter uppdatering' };
        }
      } catch (e) {
        wpTest = { success: false, error: e.message };
      }
    }

    // Log the credential update
    logOptimization({
      type: 'credential_update',
      site_id: id,
      page_url: '',
      description: `Credentials uppdaterade: ${updates.join(', ')}`,
      performed_by: 'dashboard',
      time_spent_minutes: '0'
    });

    res.json({
      success: true,
      updated: updates,
      wp_connection: wpTest,
      message: `Uppdaterade ${updates.length} fält för ${id}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/test-wp-connection — Test WordPress REST API
app.post('/api/customers/:id/test-wp-connection', async (req, res) => {
  try {
    const { id } = req.params;

    // Force refresh sites cache
    _sitesCache = null;
    _sitesCacheTime = 0;

    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === id);

    if (!site) {
      return res.json({
        success: false,
        error: 'Kunden saknar giltiga WordPress-credentials i SSM',
        hint: 'Lägg till användarnamn och app-lösenord först'
      });
    }

    const posts = await wpApi(site, 'GET', '/posts?per_page=1');
    const pages = await wpApi(site, 'GET', '/pages?per_page=1');

    res.json({
      success: true,
      url: site.url,
      posts_found: Array.isArray(posts) ? posts.length : 0,
      pages_found: Array.isArray(pages) ? pages.length : 0,
      message: `WordPress REST API fungerar för ${site.url}`
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      hint: err.response?.status === 401 ? 'Felaktiga credentials (401)' :
            err.response?.status === 403 ? 'Åtkomst nekad (403) — kontrollera användarrättigheter' :
            err.code === 'ECONNREFUSED' ? 'Kunde inte ansluta — kontrollera att sajten är nåbar' :
            'Okänt fel — kontrollera URL och credentials'
    });
  }
});

// Dashboard API: Get optimization log
app.get('/api/optimizations', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.seo_optimization_log\` ORDER BY timestamp DESC LIMIT 50`
    });
    res.json({ optimizations: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard API: Get work queue
app.get('/api/queue', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.seo_work_queue\` WHERE status = 'pending' ORDER BY priority DESC LIMIT 20`
    });
    res.json({ queue: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard API: Get weekly reports
app.get('/api/reports', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.weekly_reports\` ORDER BY email_sent_at DESC LIMIT 10`
    });
    res.json({ reports: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════
// PIPELINE API — Customer lifecycle
// ══════════════════════════════════════════

// GET /api/pipeline — Pipeline overview grouped by stage
app.get('/api/pipeline', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const sp = req.query.salesperson;
    let query = `SELECT * FROM \`${dataset}.customer_pipeline\``;
    if (sp) query += ` WHERE assigned_to = '${sp.replace(/'/g, '')}'`;
    query += ` ORDER BY updated_at DESC`;
    const [rows] = await bq.query({ query });
    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.stage]) grouped[r.stage] = [];
      grouped[r.stage].push(r);
    }
    // Calculate MRR from active contracts (stage = 'aktiv')
    const active = grouped.aktiv || [];
    const mrr = active.reduce((sum, c) => sum + (c.monthly_amount_sek || 0), 0);
    res.json({ pipeline: grouped, summary: { total: rows.length, mrr, active: active.length } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prospects — Add a new prospect
app.post('/api/prospects', async (req, res) => {
  try {
    const { company_name, website_url, contact_person, contact_email, prospect_notes, initial_traffic_trend } = req.body;
    if (!company_name || !website_url) {
      return res.status(400).json({ error: 'company_name och website_url krävs' });
    }
    const domain = new URL(website_url).hostname.replace(/^www\./, '');
    const customerId = domain.replace(/\./g, '-');
    const now = new Date().toISOString();

    await ensurePipelineTables();
    await bqInsert('customer_pipeline', {
      customer_id: customerId,
      company_name,
      contact_person: contact_person || null,
      contact_email: contact_email || null,
      website_url,
      stage: 'prospect',
      stage_updated_at: now,
      prospect_notes: prospect_notes || null,
      initial_traffic_trend: initial_traffic_trend || null,
      service_type: null,
      monthly_amount_sek: null,
      contract_start_date: null,
      contract_end_date: null,
      contract_status: null,
      audit_meeting_date: null,
      startup_meeting_date: null,
      created_at: now,
      updated_at: now,
      trello_card_id: null
    });

    res.json({ success: true, customer_id: customerId, stage: 'prospect' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/customers/:id/stage — Advance customer through pipeline
app.patch('/api/customers/:id/stage', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { stage, service_type, monthly_amount_sek, contract_start_date, audit_meeting_date, startup_meeting_date } = req.body;

    if (!stage) return res.status(400).json({ error: 'stage krävs' });

    const validStages = ['analys', 'presentation', 'forsaljning', 'orderbekraftelse', 'uppstart', 'atgardsplan', 'aktiv', 'completed', 'churned'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: `Ogiltigt steg. Tillåtna: ${validStages.join(', ')}` });
    }

    // Validate orderbekraftelse stage requires contract fields
    if (stage === 'orderbekraftelse' && (!service_type || !monthly_amount_sek || !contract_start_date)) {
      return res.status(400).json({ error: 'orderbekraftelse-steg kräver service_type, monthly_amount_sek, contract_start_date' });
    }

    const { bq, dataset } = await getBigQuery();
    const now = new Date().toISOString();

    // Build SET clause dynamically
    const updates = [`stage = '${stage}'`, `stage_updated_at = '${now}'`, `updated_at = '${now}'`];

    if (service_type) updates.push(`service_type = '${service_type}'`);
    if (monthly_amount_sek) {
      updates.push(`monthly_amount_sek = ${monthly_amount_sek}`);
      updates.push(`contract_status = 'active'`);
    }
    if (contract_start_date) {
      updates.push(`contract_start_date = '${contract_start_date}'`);
      // Calculate end date: start + 3 months
      const start = new Date(contract_start_date);
      start.setMonth(start.getMonth() + 3);
      updates.push(`contract_end_date = '${start.toISOString().split('T')[0]}'`);
    }
    if (audit_meeting_date) updates.push(`audit_meeting_date = '${audit_meeting_date}'`);
    if (startup_meeting_date) updates.push(`startup_meeting_date = '${startup_meeting_date}'`);
    if (stage === 'completed') updates.push(`contract_status = 'completed'`);
    if (stage === 'churned') updates.push(`contract_status = 'cancelled'`);

    await bq.query(`UPDATE \`${dataset}.customer_pipeline\` SET ${updates.join(', ')} WHERE customer_id = '${customerId}'`);

    // Set contract tier in SSM if amount provided
    if (monthly_amount_sek) {
      const tier = getContractTier(monthly_amount_sek);
      try {
        await ssm.send(new PutParameterCommand({
          Name: `/seo-mcp/integrations/${customerId}/contract-tier`,
          Value: tier,
          Type: 'String',
          Overwrite: true
        }));
      } catch (e) { console.error('SSM contract-tier error:', e.message); }
    }

    res.json({ success: true, customer_id: customerId, stage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/migrate-to-pipeline — Migrate existing SSM customer
app.post('/api/customers/:id/migrate-to-pipeline', async (req, res) => {
  try {
    const customerId = req.params.id;
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);
    if (!site) return res.status(404).json({ error: 'Kund hittades inte i SSM' });

    // Get integration data
    let integrations = {};
    try {
      const intParams = [];
      let nextToken;
      do {
        const r = await ssm.send(new GetParametersByPathCommand({
          Path: `/seo-mcp/integrations/${customerId}/`, Recursive: true, WithDecryption: true,
          ...(nextToken ? { NextToken: nextToken } : {})
        }));
        intParams.push(...(r.Parameters || []));
        nextToken = r.NextToken;
      } while (nextToken);
      for (const p of intParams) {
        const key = p.Name.split('/').pop();
        integrations[key] = p.Value;
      }
    } catch (e) { /* no integrations */ }

    await ensurePipelineTables();
    const now = new Date().toISOString();
    await bqInsert('customer_pipeline', {
      customer_id: customerId,
      company_name: integrations['company-name'] || customerId,
      contact_person: integrations['contact-person'] || null,
      contact_email: integrations['contact-email'] || null,
      website_url: site.url,
      stage: 'aktiv',
      stage_updated_at: now,
      prospect_notes: null,
      initial_traffic_trend: null,
      service_type: req.body.service_type || 'seo',
      monthly_amount_sek: req.body.monthly_amount_sek || null,
      contract_start_date: req.body.contract_start_date || null,
      contract_end_date: null,
      contract_status: 'active',
      audit_meeting_date: null,
      startup_meeting_date: null,
      created_at: now,
      updated_at: now,
      trello_card_id: null
    });

    res.json({ success: true, customer_id: customerId, stage: 'aktiv' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════
// KEYWORD API — ABC keyword management
// ══════════════════════════════════════════

// POST /api/customers/:id/keywords — Add keywords (batch)
app.post('/api/customers/:id/keywords', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { phase, keywords } = req.body;
    if (!phase || !keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'phase och keywords[] krävs' });
    }
    if (!['initial', 'final'].includes(phase)) {
      return res.status(400).json({ error: 'phase måste vara initial eller final' });
    }

    await ensurePipelineTables();
    const now = new Date().toISOString();
    let inserted = 0;

    for (const kw of keywords) {
      if (!kw.keyword || !kw.tier) continue;
      const id = `kw-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await bqInsert('customer_keywords', {
        id,
        customer_id: customerId,
        keyword: kw.keyword.trim().toLowerCase(),
        tier: kw.tier.toUpperCase(),
        phase,
        monthly_search_volume: kw.monthly_search_volume || null,
        keyword_difficulty: kw.keyword_difficulty || null,
        current_position: kw.current_position || null,
        target_url: kw.target_url || null,
        created_at: now,
        updated_at: now
      });
      inserted++;
    }

    res.json({ success: true, customer_id: customerId, phase, inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/keywords — Get keywords with analysis data
app.get('/api/customers/:id/keywords', async (req, res) => {
  try {
    const customerId = req.params.id;
    const phase = req.query.phase || 'both';
    const { bq, dataset } = await getBigQuery();

    let query;
    if (phase === 'both') {
      query = `SELECT * FROM \`${dataset}.customer_keywords\` WHERE customer_id = @customerId ORDER BY tier, keyword`;
    } else {
      query = `SELECT * FROM \`${dataset}.customer_keywords\` WHERE customer_id = @customerId AND phase = @phase ORDER BY tier, keyword`;
    }

    const [rows] = await bq.query({ query, params: { customerId, phase } });
    const byTier = { A: [], B: [], C: [] };
    for (const r of rows) {
      if (byTier[r.tier]) byTier[r.tier].push(r);
    }

    res.json({
      customer_id: customerId,
      total: rows.length,
      by_tier: { A: byTier.A.length, B: byTier.B.length, C: byTier.C.length },
      keywords: rows
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/keywords/analyze — Run keyword analysis with GSC
app.post('/api/customers/:id/keywords/analyze', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { bq, dataset } = await getBigQuery();

    // Get final keywords (or initial if no final)
    const [kwRows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_keywords\`
              WHERE customer_id = @customerId
              ORDER BY CASE WHEN phase = 'final' THEN 0 ELSE 1 END, tier, keyword`,
      params: { customerId }
    });

    if (kwRows.length === 0) {
      return res.status(404).json({ error: 'Inga nyckelord finns för denna kund' });
    }

    // Get GSC property
    let gscProperty = null;
    try {
      gscProperty = await getParam(`/seo-mcp/integrations/${customerId}/gsc-property`);
    } catch (e) {
      const sites = await getWordPressSites();
      const site = sites.find(s => s.id === customerId);
      if (site) gscProperty = site.url.replace(/\/$/, '') + '/';
    }

    // Fetch GSC data
    let gscRows = [];
    if (gscProperty) {
      try {
        gscRows = await gscSearchAnalytics(gscProperty, kwRows.map(k => k.keyword), 28);
      } catch (e) {
        console.error('GSC analyze error:', e.message);
      }
    }

    // Build GSC lookup
    const gscMap = {};
    for (const row of gscRows) {
      gscMap[row.keys[0].toLowerCase()] = {
        position: Math.round(row.position * 10) / 10,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0
      };
    }

    // Update keywords with GSC data
    const results = [];
    for (const kw of kwRows) {
      const gsc = gscMap[kw.keyword.toLowerCase()];
      if (gsc) {
        await bq.query({
          query: `UPDATE \`${dataset}.customer_keywords\`
                  SET current_position = ${Math.round(gsc.position)},
                      monthly_search_volume = ${Math.round(gsc.impressions / 28 * 30)},
                      updated_at = '${new Date().toISOString()}'
                  WHERE id = '${kw.id}'`
        });
        results.push({ ...kw, current_position: Math.round(gsc.position), estimated_volume: Math.round(gsc.impressions / 28 * 30), clicks_28d: gsc.clicks });
      } else {
        results.push({ ...kw, current_position: null, estimated_volume: null, clicks_28d: 0 });
      }
    }

    res.json({ customer_id: customerId, gsc_property: gscProperty, analyzed: results.length, keywords: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════
// ACTION PLAN API — 3-month plans
// ══════════════════════════════════════════

// POST /api/customers/:id/action-plan — Generate 3-month action plan
app.post('/api/customers/:id/action-plan', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { bq, dataset } = await getBigQuery();

    // Get pipeline data
    const [pipeRows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @customerId LIMIT 1`,
      params: { customerId }
    });
    const pipeline = pipeRows[0];
    const tier = pipeline ? getContractTier(pipeline.monthly_amount_sek) : 'basic';
    const limits = TIER_LIMITS[tier];

    // Get keywords (prefer final, fallback to initial)
    const [kwRows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_keywords\`
              WHERE customer_id = @customerId
              ORDER BY CASE WHEN phase = 'final' THEN 0 ELSE 1 END, tier, keyword`,
      params: { customerId }
    });
    const aWords = kwRows.filter(k => k.tier === 'A');
    const bWords = kwRows.filter(k => k.tier === 'B');
    const cWords = kwRows.filter(k => k.tier === 'C');

    // Get audit issues from work queue
    const [queueRows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.seo_work_queue\`
              WHERE customer_id = @customerId AND status = 'pending'
              ORDER BY priority DESC`,
      params: { customerId }
    });

    await ensurePipelineTables();
    const now = new Date().toISOString();
    const planTasks = [];
    let priority = 100;

    // ── MONTH 1: Foundation ──
    // Fix critical audit issues
    for (const issue of queueRows.slice(0, Math.min(queueRows.length, limits.auto_tasks_per_month))) {
      const ctx = issue.context_data ? JSON.parse(issue.context_data) : {};
      const canAuto = ['short_title', 'long_title', 'missing_h1', 'no_internal_links'].includes(issue.task_type);
      planTasks.push({
        month: 1, task_type: issue.task_type,
        desc: `Fixa ${issue.task_type.replace(/_/g, ' ')}: ${ctx.title || issue.page_url}`,
        url: issue.page_url,
        keyword: aWords[0]?.keyword || null,
        priority: priority--,
        effort: canAuto ? 'auto' : 'manual'
      });
    }
    // Optimize A-word pages
    for (const kw of aWords) {
      if (kw.target_url) {
        planTasks.push({
          month: 1, task_type: 'metadata_optimization',
          desc: `Optimera title/description för A-ord: ${kw.keyword}`,
          url: kw.target_url, keyword: kw.keyword,
          priority: priority--, effort: 'auto'
        });
      }
    }

    // ── MONTH 2: Growth ──
    // B-word optimization
    for (const kw of bWords) {
      planTasks.push({
        month: 2, task_type: 'metadata_optimization',
        desc: `Optimera title/description för B-ord: ${kw.keyword}`,
        url: kw.target_url || null, keyword: kw.keyword,
        priority: priority--, effort: 'auto'
      });
    }
    // Internal link clusters for A-words
    for (const kw of aWords) {
      planTasks.push({
        month: 2, task_type: 'internal_linking',
        desc: `Bygg internlänkskluster kring A-ord: ${kw.keyword}`,
        url: kw.target_url || null, keyword: kw.keyword,
        priority: priority--, effort: 'auto'
      });
    }
    // Schema markup (standard/premium only)
    if (limits.schema_markup) {
      planTasks.push({
        month: 2, task_type: 'schema_markup',
        desc: 'Lägg till FAQ/Organisation-schema på nyckelsidor',
        url: null, keyword: null,
        priority: priority--, effort: 'hybrid'
      });
    }

    // ── MONTH 3: Refinement ──
    // C-word optimization
    for (const kw of cWords) {
      planTasks.push({
        month: 3, task_type: 'metadata_optimization',
        desc: `Optimera för C-ord: ${kw.keyword}`,
        url: kw.target_url || null, keyword: kw.keyword,
        priority: priority--, effort: 'auto'
      });
    }
    // Re-audit
    planTasks.push({
      month: 3, task_type: 'technical_fix',
      desc: 'Re-audit: jämför före/efter för alla optimerade sidor',
      url: null, keyword: null,
      priority: priority--, effort: 'auto'
    });
    // End-of-contract report
    planTasks.push({
      month: 3, task_type: 'manual_review',
      desc: 'Slutrapport + förnyelseförslag',
      url: null, keyword: null,
      priority: priority--, effort: 'manual'
    });

    // Insert all plan tasks to BigQuery
    for (const t of planTasks) {
      const planId = `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await bqInsert('action_plans', {
        plan_id: planId,
        customer_id: customerId,
        created_at: now,
        month_number: t.month,
        task_type: t.task_type,
        task_description: t.desc,
        target_url: t.url,
        target_keyword: t.keyword,
        priority: t.priority,
        status: 'planned',
        work_queue_id: null,
        completed_at: null,
        estimated_effort: t.effort
      });
    }

    // Group for response
    const byMonth = { 1: [], 2: [], 3: [] };
    for (const t of planTasks) {
      byMonth[t.month].push(t);
    }

    res.json({
      customer_id: customerId,
      tier,
      limits,
      total_tasks: planTasks.length,
      plan: byMonth
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/action-plan — View plan with progress
app.get('/api/customers/:id/action-plan', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { bq, dataset } = await getBigQuery();

    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.action_plans\`
              WHERE customer_id = @customerId
              ORDER BY month_number, priority DESC`,
      params: { customerId }
    });

    if (rows.length === 0) {
      return res.json({ customer_id: customerId, plan: null, message: 'Ingen åtgärdsplan skapad ännu' });
    }

    const byMonth = {};
    for (const r of rows) {
      const m = r.month_number;
      if (!byMonth[m]) byMonth[m] = { tasks: [], completed: 0, total: 0 };
      byMonth[m].tasks.push(r);
      byMonth[m].total++;
      if (r.status === 'completed') byMonth[m].completed++;
    }

    // Get budget usage for current month
    let budgetUsed = 0;
    try {
      const [pipeRows] = await bq.query({
        query: `SELECT monthly_amount_sek, contract_start_date FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @customerId LIMIT 1`,
        params: { customerId }
      });
      if (pipeRows[0]) {
        const tier = getContractTier(pipeRows[0].monthly_amount_sek);
        const limits = TIER_LIMITS[tier];
        const [countRows] = await bq.query({
          query: `SELECT COUNT(*) as cnt FROM \`${dataset}.action_plans\`
                  WHERE customer_id = @customerId AND status = 'completed'
                  AND completed_at >= TIMESTAMP_TRUNC(CURRENT_TIMESTAMP(), MONTH)`,
          params: { customerId }
        });
        budgetUsed = countRows[0]?.cnt || 0;
        res.json({
          customer_id: customerId,
          tier,
          budget: { used: budgetUsed, limit: limits.auto_tasks_per_month },
          plan: byMonth
        });
        return;
      }
    } catch (e) { /* continue without budget */ }

    res.json({ customer_id: customerId, plan: byMonth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/action-plan/activate-month — Queue a month's tasks
app.post('/api/customers/:id/action-plan/activate-month', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { month_number } = req.body;
    if (!month_number) return res.status(400).json({ error: 'month_number krävs' });

    const { bq, dataset } = await getBigQuery();

    // Get planned auto tasks for this month
    const [tasks] = await bq.query({
      query: `SELECT * FROM \`${dataset}.action_plans\`
              WHERE customer_id = @customerId AND month_number = @month
              AND status = 'planned' AND estimated_effort = 'auto'
              ORDER BY priority DESC`,
      params: { customerId, month: month_number }
    });

    let queued = 0;
    for (const task of tasks) {
      const queueId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await addToWorkQueue({
        customer_id: customerId,
        priority: task.priority,
        task_type: task.task_type,
        page_url: task.target_url || '',
        context_data: JSON.stringify({
          action_plan_id: task.plan_id,
          keyword: task.target_keyword,
          description: task.task_description
        })
      });

      // Update plan status
      await bq.query(`UPDATE \`${dataset}.action_plans\` SET status = 'queued', work_queue_id = '${queueId}' WHERE plan_id = '${task.plan_id}'`);
      queued++;
    }

    res.json({ success: true, customer_id: customerId, month_number, queued });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Manual audit endpoint ──
app.post('/api/customers/:id/manual-audit', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { summary, issues } = req.body;
    if (!summary && (!issues || !issues.length)) {
      return res.status(400).json({ error: 'Ange minst en analys-sammanfattning eller issues' });
    }
    const { bq, dataset } = await getBigQuery();

    // Save audit summary to customer_pipeline
    if (summary) {
      try {
        await bq.query({
          query: `UPDATE \`${dataset}.customer_pipeline\` SET audit_summary = @summary, updated_at = CURRENT_TIMESTAMP() WHERE customer_id = @customerId`,
          params: { summary, customerId }
        });
      } catch (e) {
        // If audit_summary column doesn't exist yet, add it
        if (e.message && e.message.includes('Unrecognized name: audit_summary')) {
          await bq.query(`ALTER TABLE \`${dataset}.customer_pipeline\` ADD COLUMN audit_summary STRING`);
          await bq.query({
            query: `UPDATE \`${dataset}.customer_pipeline\` SET audit_summary = @summary, updated_at = CURRENT_TIMESTAMP() WHERE customer_id = @customerId`,
            params: { summary, customerId }
          });
        } else throw e;
      }
    }

    // Save issues to seo_work_queue with source='manual'
    let issueCount = 0;
    if (issues && issues.length) {
      for (const issue of issues) {
        await addToWorkQueue({
          customer_id: customerId,
          task_type: issue.problem_type || 'audit_issue',
          page_url: issue.url || '',
          priority: issue.priority || 5,
          description: issue.description || '',
          severity: issue.severity || 'medium',
          source: 'manual'
        });
        issueCount++;
      }
    }

    res.json({ success: true, customer_id: customerId, summary_saved: !!summary, issues_added: issueCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Manual action plan endpoint ──
app.post('/api/customers/:id/manual-action-plan', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { tasks } = req.body;
    if (!tasks || !tasks.length) {
      return res.status(400).json({ error: 'Ange minst en åtgärd' });
    }
    const now = new Date().toISOString();
    let inserted = 0;

    for (const task of tasks) {
      await bqInsert('action_plans', {
        plan_id: `plan-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        customer_id: customerId,
        created_at: now,
        month_number: task.month || 1,
        task_type: task.task_type || 'manual_task',
        task_description: task.description || '',
        target_url: task.target_url || '',
        target_keyword: task.keyword || '',
        priority: task.priority || 5,
        status: 'planned',
        estimated_effort: task.effort || 'manual',
        source: 'manual'
      });
      inserted++;
    }

    res.json({ success: true, customer_id: customerId, tasks_added: inserted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Manual work log endpoint ──
app.post('/api/customers/:id/manual-work-log', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { entries } = req.body;
    if (!entries || !entries.length) {
      return res.status(400).json({ error: 'Ange minst en arbetspost' });
    }

    // Get customer site URL
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);
    const siteUrl = site?.url || '';

    let logged = 0;
    for (const entry of entries) {
      const performer = entry.performed_by || 'Okänd';
      const mins = entry.time_minutes || 0;
      await logOptimization({
        customer_id: customerId,
        site_url: siteUrl,
        optimization_type: entry.type || 'Annat',
        page_url: entry.page_url || '',
        before_state: JSON.stringify({ source: 'manual', performed_by: performer, time_minutes: mins }),
        after_state: JSON.stringify({ description: entry.description || '', performed_by: performer }),
        claude_reasoning: `[Manuellt — ${performer}] ${entry.description || ''}`,
        impact_estimate: 5
      });
      logged++;
    }

    res.json({ success: true, customer_id: customerId, logged });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Get audit summary endpoint ──
app.get('/api/customers/:id/audit', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { bq, dataset } = await getBigQuery();

    // Get audit summary from pipeline
    let summary = null;
    try {
      const [rows] = await bq.query({
        query: `SELECT audit_summary FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @customerId`,
        params: { customerId }
      });
      if (rows.length > 0) summary = rows[0].audit_summary;
    } catch (e) { /* column may not exist yet */ }

    // Get manual audit issues from work queue
    const [issues] = await bq.query({
      query: `SELECT * FROM \`${dataset}.seo_work_queue\` WHERE customer_id = @customerId AND source = 'manual' ORDER BY created_at DESC`,
      params: { customerId }
    });

    res.json({ customer_id: customerId, summary, issues: issues || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard API: Get per-customer stats (last 30 days)
app.get('/api/customers/:id/stats', async (req, res) => {
  try {
    const customerId = req.params.id;

    // Get customer info from SSM
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);
    if (!site) return res.status(404).json({ error: 'Kund hittades inte' });

    // Get integration data from SSM
    let integrations = {};
    try {
      const intParams = [];
      let nextToken;
      do {
        const r = await ssm.send(new GetParametersByPathCommand({
          Path: `/seo-mcp/integrations/${customerId}/`, Recursive: true, WithDecryption: true,
          ...(nextToken ? { NextToken: nextToken } : {})
        }));
        intParams.push(...(r.Parameters || []));
        nextToken = r.NextToken;
      } while (nextToken);
      for (const p of intParams) {
        const key = p.Name.split('/').pop();
        integrations[key] = p.Value;
      }
    } catch (e) { /* no integrations */ }

    // Get optimizations from BigQuery (last 30 days)
    let optimizations = [];
    let queueItems = [];
    let optimizationsByType = [];
    try {
      const { bq, dataset } = await getBigQuery();
      const [optRows] = await bq.query({
        query: `SELECT * FROM \`${dataset}.seo_optimization_log\`
                WHERE customer_id = @customerId
                AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
                ORDER BY timestamp DESC`,
        params: { customerId }
      });
      optimizations = optRows || [];

      const [typeRows] = await bq.query({
        query: `SELECT optimization_type, COUNT(*) as count
                FROM \`${dataset}.seo_optimization_log\`
                WHERE customer_id = @customerId
                AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
                GROUP BY optimization_type ORDER BY count DESC`,
        params: { customerId }
      });
      optimizationsByType = typeRows || [];

      const [qRows] = await bq.query({
        query: `SELECT * FROM \`${dataset}.seo_work_queue\`
                WHERE customer_id = @customerId
                ORDER BY priority DESC LIMIT 10`,
        params: { customerId }
      });
      queueItems = qRows || [];
    } catch (bqErr) {
      console.error('BigQuery stats error:', bqErr.message);
    }

    res.json({
      customer: {
        id: site.id,
        url: site.url,
        ...integrations
      },
      stats: {
        total_optimizations: optimizations.length,
        by_type: optimizationsByType,
        queue_items: queueItems.length
      },
      optimizations,
      queue: queueItems
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard API: Get SE Ranking positions for a customer
app.get('/api/customers/:id/rankings', async (req, res) => {
  try {
    const customerId = req.params.id;

    // Get customer URL from SSM
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);
    if (!site) return res.status(404).json({ error: 'Kund hittades inte' });

    // 1. Get ABC keywords from Trello (search all lists for card matching customer)
    let abcKeywords = { A: [], B: [], C: [], all: [] };
    let trelloCardFound = false;
    try {
      const boardId = await getParam('/seo-mcp/trello/board-id');
      // Search all cards on the board for one matching this customer (cached 10 min)
      const allCards = await getCachedTrelloCards(boardId);
      const custLower = customerId.toLowerCase().replace(/-/g, '');
      const abcCard = allCards.find(c => {
        const nameLower = c.name.toLowerCase().replace(/[^a-zåäö0-9]/g, '');
        const matchesName = nameLower.includes(custLower) || custLower.includes(nameLower.replace(/\.\w+$/, ''));
        const hasAbc = c.desc && /[ABC]\s*[=:]/i.test(c.desc);
        return matchesName && hasAbc;
      });
      if (abcCard) {
        abcKeywords = parseAbcKeywords(abcCard.desc);
        trelloCardFound = true;
      }
    } catch (trelloErr) {
      console.error('Trello ABC fetch error:', trelloErr.message);
    }

    // 2. Get GSC data
    // Determine GSC property URL
    let gscProperty = null;
    try {
      gscProperty = await getParam(`/seo-mcp/integrations/${customerId}/gsc-property`);
    } catch (e) { /* not set */ }

    // Default: derive from site URL
    if (!gscProperty) {
      gscProperty = site.url.replace(/\/$/, '') + '/';
      // Ensure https:// prefix
      if (!gscProperty.startsWith('http')) gscProperty = 'https://' + gscProperty;
    }

    let gscRows = [];
    try {
      gscRows = await gscSearchAnalytics(gscProperty, abcKeywords.all.map(k => k.keyword));
    } catch (gscErr) {
      console.error('GSC API error:', gscErr.response?.data?.error?.message || gscErr.message);
      // If property not accessible, try with/without trailing slash and www
      if (gscErr.response?.status === 403 || gscErr.response?.status === 404) {
        // Try alternative URL formats
        const altUrls = [];
        const baseUrl = site.url.replace(/\/$/, '');
        if (!baseUrl.includes('www.')) {
          altUrls.push(baseUrl.replace('https://', 'https://www.') + '/');
        } else {
          altUrls.push(baseUrl.replace('https://www.', 'https://') + '/');
        }
        altUrls.push('sc-domain:' + baseUrl.replace(/https?:\/\/(www\.)?/, ''));

        for (const altUrl of altUrls) {
          try {
            gscRows = await gscSearchAnalytics(altUrl, []);
            gscProperty = altUrl;
            break;
          } catch (e) { /* try next */ }
        }
      }
    }

    // 3. Build lookup from GSC data: keyword -> { position, clicks, impressions, ctr }
    const gscMap = {};
    for (const row of gscRows) {
      const query = row.keys[0].toLowerCase();
      gscMap[query] = {
        position: Math.round(row.position * 10) / 10,
        clicks: row.clicks || 0,
        impressions: row.impressions || 0,
        ctr: Math.round((row.ctr || 0) * 1000) / 10
      };
    }

    // 4. Combine: ABC keywords with GSC positions
    const today = new Date().toISOString().split('T')[0];
    let rankings = [];

    if (abcKeywords.all.length > 0) {
      // Show ABC keywords with their GSC data
      for (const kw of abcKeywords.all) {
        const gscData = gscMap[kw.keyword.toLowerCase()] || null;
        rankings.push({
          keyword: kw.keyword,
          category: kw.category,
          position: gscData?.position || null,
          clicks: gscData?.clicks || 0,
          impressions: gscData?.impressions || 0,
          ctr: gscData?.ctr || 0
        });
      }
    } else {
      // No ABC keywords — show top GSC keywords sorted by impressions
      const topGsc = gscRows
        .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
        .slice(0, 50);
      for (const row of topGsc) {
        rankings.push({
          keyword: row.keys[0],
          category: null,
          position: Math.round(row.position * 10) / 10,
          clicks: row.clicks || 0,
          impressions: row.impressions || 0,
          ctr: Math.round((row.ctr || 0) * 1000) / 10
        });
      }
    }

    // Sort: ABC categories first (A, B, C), then alphabetically within each
    rankings.sort((a, b) => {
      if (a.category && b.category) {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return a.keyword.localeCompare(b.keyword, 'sv');
      }
      if (a.category) return -1;
      if (b.category) return 1;
      return a.keyword.localeCompare(b.keyword, 'sv');
    });

    // Stats
    const withPos = rankings.filter(k => k.position);
    const inTop3 = withPos.filter(k => k.position <= 3).length;
    const inTop10 = withPos.filter(k => k.position <= 10).length;
    const inTop30 = withPos.filter(k => k.position <= 30).length;

    res.json({
      source: 'gsc',
      gsc_property: gscProperty,
      trello_keywords: trelloCardFound,
      date: today,
      stats: {
        total: rankings.length,
        top3: inTop3,
        top10: inTop10,
        top30: inTop30,
        abc: { A: abcKeywords.A.length, B: abcKeywords.B.length, C: abcKeywords.C.length }
      },
      rankings
    });
  } catch (err) {
    console.error('Rankings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Trigger a site analysis
app.post('/api/analyze', async (req, res) => {
  try {
    const { siteUrl } = req.body;
    const result = await analyzeSiteSEO(siteUrl);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trigger metadata optimization
app.post('/api/optimize-metadata', async (req, res) => {
  try {
    const { siteId, postId, keyword } = req.body;
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === siteId);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    const result = await optimizeMetadata(site, postId, keyword);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Onboarding: Register new customer ──
app.post('/api/onboard', async (req, res) => {
  try {
    // Verify API key
    const apiKey = req.headers['x-api-key'];
    const validKey = await getParam('/seo-mcp/onboard/api-key').catch(() => null);
    if (!validKey || apiKey !== validKey) {
      return res.status(401).json({ error: 'Ogiltig API-nyckel' });
    }

    const {
      company_name, contact_person, contact_email,
      wordpress_url, wordpress_username, wordpress_app_password,
      gsc_property, ga_property_id, google_ads_id, meta_pixel_id
    } = req.body;

    // Validate required fields
    if (!company_name || !contact_email || !wordpress_url || !wordpress_username || !wordpress_app_password) {
      return res.status(400).json({ error: 'Saknade obligatoriska fält' });
    }

    // Generate siteId from domain
    const domain = new URL(wordpress_url).hostname.replace(/^www\./, '');
    const siteId = domain.replace(/\./g, '-');

    // Check if customer already exists
    const existingSites = await getWordPressSites();
    if (existingSites.find(s => s.id === siteId)) {
      return res.status(409).json({ error: `Kunden ${domain} finns redan registrerad` });
    }

    // Save WordPress credentials to SSM
    const ssmParams = [
      { name: `/seo-mcp/wordpress/${siteId}/url`, value: wordpress_url.replace(/\/$/, '') },
      { name: `/seo-mcp/wordpress/${siteId}/username`, value: wordpress_username },
      { name: `/seo-mcp/wordpress/${siteId}/app-password`, value: wordpress_app_password },
    ];

    // Save integration data
    const integrations = [
      { name: `/seo-mcp/integrations/${siteId}/company-name`, value: company_name },
      { name: `/seo-mcp/integrations/${siteId}/contact-person`, value: contact_person || '' },
      { name: `/seo-mcp/integrations/${siteId}/contact-email`, value: contact_email },
    ];
    if (gsc_property) integrations.push({ name: `/seo-mcp/integrations/${siteId}/gsc-property`, value: gsc_property });
    if (ga_property_id) integrations.push({ name: `/seo-mcp/integrations/${siteId}/ga-property-id`, value: ga_property_id });
    if (google_ads_id) integrations.push({ name: `/seo-mcp/integrations/${siteId}/google-ads-id`, value: google_ads_id });
    if (meta_pixel_id) integrations.push({ name: `/seo-mcp/integrations/${siteId}/meta-pixel-id`, value: meta_pixel_id });

    // Write all parameters
    for (const p of [...ssmParams, ...integrations]) {
      await ssm.send(new PutParameterCommand({
        Name: p.name,
        Value: p.value,
        Type: 'SecureString',
        Overwrite: false
      }));
    }

    // Clear cache so new customer shows up immediately
    for (const key of Object.keys(paramCache)) {
      if (key.includes('/seo-mcp/wordpress/')) delete paramCache[key];
    }

    console.log(`[ONBOARD] New customer registered: ${company_name} (${siteId})`);

    // Send response immediately — don't block on WP test or Trello
    res.json({
      success: true,
      siteId,
      message: `${company_name} har registrerats! Site ID: ${siteId}`
    });

    // Fire-and-forget: Log to BigQuery, test WP connection, create Trello card
    (async () => {
      // 1. Log to BigQuery so customer appears in dashboard immediately
      try {
        await logOptimization({
          customer_id: siteId,
          site_url: wordpress_url,
          optimization_type: 'customer_onboarding',
          page_url: wordpress_url,
          before_state: JSON.stringify({ status: 'new' }),
          after_state: JSON.stringify({
            company_name, contact_email, contact_person: contact_person || null,
            gsc_property: gsc_property || null,
            ga_property_id: ga_property_id || null,
            google_ads_id: google_ads_id || null,
            meta_pixel_id: meta_pixel_id || null
          }),
          claude_reasoning: 'Ny kund registrerad via onboarding-formuläret',
          impact_estimate: 'N/A'
        });
        console.log(`[ONBOARD] BigQuery logged for ${siteId}`);
      } catch (bqErr) {
        console.error(`[ONBOARD] BigQuery log failed for ${siteId}:`, bqErr.message);
      }

      // 1b. Upsert customer_pipeline row
      try {
        await ensurePipelineTables();
        const now = new Date().toISOString();
        // Check if customer exists in pipeline (e.g. added as prospect earlier)
        const { bq, dataset } = await getBigQuery();
        const [existing] = await bq.query({
          query: `SELECT customer_id FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @customerId LIMIT 1`,
          params: { customerId: siteId }
        });
        if (existing.length > 0) {
          // Update existing pipeline entry to active
          await bq.query(`UPDATE \`${dataset}.customer_pipeline\` SET stage = 'aktiv', stage_updated_at = '${now}', updated_at = '${now}', contract_status = 'active', website_url = '${wordpress_url}', company_name = '${company_name.replace(/'/g, "\\'")}', contact_email = '${contact_email}' WHERE customer_id = '${siteId}'`);
        } else {
          // Create new pipeline entry
          await bqInsert('customer_pipeline', {
            customer_id: siteId, company_name, contact_person: contact_person || null,
            contact_email, website_url: wordpress_url, stage: 'aktiv',
            stage_updated_at: now, prospect_notes: null, initial_traffic_trend: null,
            service_type: null, monthly_amount_sek: null, contract_start_date: null,
            contract_end_date: null, contract_status: 'active', audit_meeting_date: null,
            startup_meeting_date: null, created_at: now, updated_at: now, trello_card_id: null
          });
        }
        console.log(`[ONBOARD] Pipeline updated for ${siteId}`);
      } catch (pipeErr) {
        console.error(`[ONBOARD] Pipeline update failed for ${siteId}:`, pipeErr.message);
      }

      // 2. Test WP connection
      let wpConnectionTest = 'ok';
      try {
        const site = { id: siteId, url: wordpress_url.replace(/\/$/, ''), username: wordpress_username, 'app-password': wordpress_app_password };
        await wpApi(site, 'GET', '/posts?per_page=1');
      } catch (wpErr) {
        wpConnectionTest = `failed: ${wpErr.message}`;
      }
      console.log(`[ONBOARD] WP connection test for ${siteId}: ${wpConnectionTest}`);

      // 3. Create Trello card with filled/missing fields
      try {
        const filled = [];
        const missing = [];

        filled.push(`- Företagsnamn: ${company_name}`);
        if (contact_person) filled.push(`- Kontaktperson: ${contact_person}`);
        else missing.push('- Kontaktperson');
        filled.push(`- E-post: ${contact_email}`);
        filled.push(`- WordPress URL: ${wordpress_url}`);
        filled.push(`- WP-användare: ${wordpress_username}`);
        filled.push(`- WP App-lösenord: ****`);
        filled.push(`- WP-anslutning: ${wpConnectionTest}`);

        if (gsc_property) filled.push(`- Google Search Console: ${gsc_property}`);
        else missing.push('- Google Search Console');
        if (ga_property_id) filled.push(`- Google Analytics: ${ga_property_id}`);
        else missing.push('- Google Analytics');
        if (google_ads_id) filled.push(`- Google Ads: ${google_ads_id}`);
        else missing.push('- Google Ads');
        if (meta_pixel_id) filled.push(`- Meta Pixel: ${meta_pixel_id}`);
        else missing.push('- Meta Pixel');

        let desc = `✅ **Ifyllt:**\n${filled.join('\n')}`;
        if (missing.length > 0) {
          desc += `\n\n❌ **Saknas:**\n${missing.join('\n')}`;
        }
        desc += `\n\n📅 Registrerad: ${new Date().toISOString()}`;

        const boardId = await getParam('/seo-mcp/trello/board-id');
        const lists = await trelloApi('GET', `/boards/${boardId}/lists`);
        const onboardList = lists.find(l => l.name.toLowerCase().includes('on-boarding') || l.name.toLowerCase().includes('onboarding')) || lists[0];
        await createTrelloCard(onboardList.id, `Ny kund: ${company_name}`, desc);
        console.log(`[ONBOARD] Trello card created for ${siteId}`);
      } catch (trelloErr) {
        console.error('[ONBOARD] Trello card creation failed:', trelloErr.message);
      }
    })();
  } catch (err) {
    console.error('[ONBOARD] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Trigger full audit for a site
app.post('/api/audit', async (req, res) => {
  try {
    const { siteId } = req.body;
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === siteId);
    if (!site) return res.status(404).json({ error: 'Site not found' });
    const result = await fullSiteAudit(site);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════
// SE RANKING API ENDPOINTS
// ══════════════════════════════════════════

// GET /api/seranking/credits — Check remaining API credits
app.get('/api/seranking/credits', async (req, res) => {
  try {
    const data = await seRankingApi('GET', '/account/subscription');
    if (!data) return res.status(500).json({ error: 'SE Ranking API-nyckel saknas eller är ogiltig' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/domain-analysis — SE Ranking domain overview
app.get('/api/customers/:id/domain-analysis', async (req, res) => {
  try {
    const customerId = req.params.id;
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);

    // Allow domain override via query param (for prospects without WP)
    let domain = req.query.domain;
    if (!domain && site) {
      domain = site.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    }
    if (!domain) return res.status(400).json({ error: 'Ingen domän hittad. Skicka ?domain=example.se' });

    const source = req.query.source || 'se'; // Default to Sweden
    const data = await seRankingApi('GET', `/domain/overview/db?source=${source}&domain=${domain}&with_subdomains=1`);
    if (!data) return res.status(500).json({ error: 'SE Ranking API ej tillgängligt' });

    res.json({ customer_id: customerId, domain, source, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/backlinks — SE Ranking backlink summary
app.get('/api/customers/:id/backlinks', async (req, res) => {
  try {
    const customerId = req.params.id;
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);

    let domain = req.query.domain;
    if (!domain && site) {
      domain = site.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    }
    if (!domain) return res.status(400).json({ error: 'Ingen domän hittad. Skicka ?domain=example.se' });

    const data = await seRankingApi('GET', `/backlinks/summary?target=${encodeURIComponent(domain)}&mode=host`);
    if (!data) return res.status(500).json({ error: 'SE Ranking API ej tillgängligt' });

    res.json({ customer_id: customerId, domain, data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/keywords/enrich — Enrich ABC keywords with SE Ranking data
app.post('/api/customers/:id/keywords/enrich', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { bq, dataset } = await getBigQuery();

    // 1. Get existing keywords from BigQuery
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_keywords\` WHERE customer_id = @cid`,
      params: { cid: customerId }
    });
    if (!rows.length) return res.status(404).json({ error: 'Inga nyckelord hittade för kunden' });

    const keywords = rows.map(r => r.keyword).filter(Boolean);
    if (!keywords.length) return res.status(400).json({ error: 'Inga nyckelord att berika' });

    // 2. Send to SE Ranking keyword export
    const source = req.query.source || 'se';
    // Use URLSearchParams for form-encoded data
    const params = new URLSearchParams();
    keywords.forEach(kw => params.append('keywords[]', kw));

    const apiKey = await getSeRankingKey();
    const seRes = await axios.post(
      `https://api.seranking.com/v1/keywords/export?source=${source}&apikey=${apiKey}&output=json`,
      params.toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 30000
      }
    );
    const seData = seRes.data;

    // 3. Build lookup from SE Ranking data
    const kwMap = {};
    if (Array.isArray(seData)) {
      for (const item of seData) {
        kwMap[(item.keyword || '').toLowerCase()] = item;
      }
    }

    // 4. Update BigQuery with enriched data
    let updated = 0;
    for (const row of rows) {
      const kwLower = (row.keyword || '').toLowerCase();
      const seKw = kwMap[kwLower];
      if (seKw) {
        const vol = seKw.volume || seKw.search_volume || 0;
        const diff = seKw.difficulty || seKw.keyword_difficulty || 0;
        const cpc = seKw.cpc || 0;
        await bq.query({
          query: `UPDATE \`${dataset}.customer_keywords\`
                  SET monthly_search_volume = ${vol}, keyword_difficulty = ${diff}
                  WHERE customer_id = @cid AND keyword = @kw`,
          params: { cid: customerId, kw: row.keyword }
        });
        updated++;
      }
    }

    res.json({
      success: true,
      customer_id: customerId,
      total_keywords: keywords.length,
      enriched: updated,
      se_ranking_results: Array.isArray(seData) ? seData.length : 0,
      sample: Array.isArray(seData) ? seData.slice(0, 5) : seData
    });
  } catch (err) {
    console.error('Keyword enrich error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/keywords/discover — Discover new keywords via SE Ranking
app.post('/api/customers/:id/keywords/discover', async (req, res) => {
  try {
    const customerId = req.params.id;
    const source = req.query.source || 'se';
    const limit = parseInt(req.query.limit) || 20;

    // Get seed keywords from request body or BigQuery A-tier keywords
    let seeds = req.body.seeds || [];
    if (!seeds.length) {
      const { bq, dataset } = await getBigQuery();
      const [rows] = await bq.query({
        query: `SELECT keyword FROM \`${dataset}.customer_keywords\` WHERE customer_id = @cid AND tier = 'A' LIMIT 5`,
        params: { cid: customerId }
      });
      seeds = rows.map(r => r.keyword).filter(Boolean);
    }
    if (!seeds.length) return res.status(400).json({ error: 'Inga seed-nyckelord. Skicka seeds[] i body.' });

    // Fetch similar + questions for each seed
    const results = { similar: [], questions: [], seeds_used: seeds };
    for (const seed of seeds) {
      try {
        const similar = await seRankingApi('GET', `/keywords/similar?source=${source}&keyword=${encodeURIComponent(seed)}&limit=${limit}`);
        if (similar) results.similar.push({ seed, data: similar });
      } catch (e) { console.error(`Similar error for "${seed}":`, e.message); }

      try {
        const questions = await seRankingApi('GET', `/keywords/questions?source=${source}&keyword=${encodeURIComponent(seed)}&limit=${limit}`);
        if (questions) results.questions.push({ seed, data: questions });
      } catch (e) { console.error(`Questions error for "${seed}":`, e.message); }
    }

    res.json({ customer_id: customerId, source, ...results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/competitors — SE Ranking competitor analysis
app.get('/api/customers/:id/competitors', async (req, res) => {
  try {
    const customerId = req.params.id;
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);

    let domain = req.query.domain;
    if (!domain && site) {
      domain = site.url.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');
    }
    if (!domain) return res.status(400).json({ error: 'Ingen domän hittad' });

    const source = req.query.source || 'se';
    const competitors = req.query.competitors ? req.query.competitors.split(',') : [];

    // Get own domain data
    const ownData = await seRankingApi('GET', `/domain/overview/db?source=${source}&domain=${domain}&with_subdomains=1`);

    // Get competitor data
    const compResults = [];
    for (const comp of competitors) {
      try {
        const compData = await seRankingApi('GET', `/domain/overview/db?source=${source}&domain=${comp.trim()}&with_subdomains=1`);
        compResults.push({ domain: comp.trim(), data: compData });
      } catch (e) { console.error(`Competitor error for "${comp}":`, e.message); }
    }

    res.json({
      customer_id: customerId,
      domain,
      source,
      own: ownData,
      competitors: compResults
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/seranking/keyword-research — Bulk keyword research (for content planning)
app.post('/api/seranking/keyword-research', async (req, res) => {
  try {
    const { keywords, source } = req.body;
    if (!keywords || !keywords.length) return res.status(400).json({ error: 'keywords[] krävs' });

    const apiKey = await getSeRankingKey();
    if (!apiKey) return res.status(500).json({ error: 'SE Ranking API-nyckel saknas' });

    const src = source || 'se';
    const formData = new FormData();
    keywords.forEach(kw => formData.append('keywords[]', kw));

    const seRes = await axios.post(
      `https://api.seranking.com/v1/keywords/export?source=${src}&apikey=${apiKey}&output=json`,
      formData,
      {
        headers: formData.getHeaders?.() || { 'Content-Type': 'multipart/form-data' },
        timeout: 30000
      }
    );

    res.json({ source: src, total: keywords.length, results: seRes.data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════
// BACKLINK MONITOR — BigQuery data endpoints
// ══════════════════════════════════════════

// GET /api/backlinks/overview — Latest snapshot for all domains
app.get('/api/backlinks/overview', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `
        WITH latest AS (
          SELECT domain, MAX(snapshot_date) as latest_date
          FROM \`${dataset}.backlink_snapshots\`
          GROUP BY domain
        )
        SELECT s.*
        FROM \`${dataset}.backlink_snapshots\` s
        JOIN latest l ON s.domain = l.domain AND s.snapshot_date = l.latest_date
        ORDER BY s.domain_inlink_rank DESC`
    });
    res.json({ domains: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backlinks/history/:domain — Historical data for a domain
app.get('/api/backlinks/history/:domain', async (req, res) => {
  try {
    const domain = req.params.domain;
    const days = parseInt(req.query.days) || 30;
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.backlink_snapshots\`
              WHERE domain = @domain AND snapshot_date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
              ORDER BY snapshot_date DESC`,
      params: { domain, days }
    });
    res.json({ domain, days, snapshots: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backlinks/refdomains/:domain — Latest refdomains for a domain
app.get('/api/backlinks/refdomains/:domain', async (req, res) => {
  try {
    const domain = req.params.domain;
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.backlink_refdomains\`
              WHERE domain = @domain AND snapshot_date = (
                SELECT MAX(snapshot_date) FROM \`${dataset}.backlink_refdomains\` WHERE domain = @domain
              )
              ORDER BY domain_inlink_rank DESC`,
      params: { domain }
    });
    res.json({ domain, refdomains: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backlinks/anchors/:domain — Latest anchors for a domain
app.get('/api/backlinks/anchors/:domain', async (req, res) => {
  try {
    const domain = req.params.domain;
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.backlink_anchors\`
              WHERE domain = @domain AND snapshot_date = (
                SELECT MAX(snapshot_date) FROM \`${dataset}.backlink_anchors\` WHERE domain = @domain
              )
              ORDER BY backlinks DESC`,
      params: { domain }
    });
    res.json({ domain, anchors: rows, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/backlinks/compare — Compare two domains
app.get('/api/backlinks/compare', async (req, res) => {
  try {
    const domains = (req.query.domains || '').split(',').map(d => d.trim()).filter(Boolean);
    if (domains.length < 2) return res.status(400).json({ error: 'Skicka ?domains=a.se,b.se' });
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `
        WITH latest AS (
          SELECT domain, MAX(snapshot_date) as latest_date
          FROM \`${dataset}.backlink_snapshots\`
          WHERE domain IN UNNEST(@domains)
          GROUP BY domain
        )
        SELECT s.*
        FROM \`${dataset}.backlink_snapshots\` s
        JOIN latest l ON s.domain = l.domain AND s.snapshot_date = l.latest_date
        ORDER BY s.domain_inlink_rank DESC`,
      params: { domains }
    });
    res.json({ domains, data: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/backlinks/run-monitor — Trigger backlink monitor (runs inline using server deps)
app.post('/api/backlinks/run-monitor', async (req, res) => {
  try {
    res.json({ status: 'started', message: 'Monitor körs i bakgrunden' });

    const date = new Date().toISOString().split('T')[0];
    const apiKey = await getSeRankingKey();
    if (!apiKey) { console.error('[BL Monitor] No SE Ranking API key'); return; }
    const { bq, dataset } = await getBigQuery();

    const BL_CUSTOMERS = {
      searchboost:'searchboost.nu', mobelrondellen:'mobelrondellen.se', phvast:'phvast.se',
      ilmonte:'ilmonte.se', tobler:'tobler.se', traficator:'traficator.se',
      kompetensutveckla:'kompetensutveckla.se', ferox:'feroxkonsult.se',
      wedosigns:'wedosigns.se', smalandskontorsmobler:'smalandskontorsmobler.se'
    };
    const BL_COMPETITORS = ['vaning18.se','pineberry.se','brath.se','adgrabber.io','adrelevance.se','emaxmedia.se'];
    const BL_PROSPECTS = ['nordicsnusonline.com','vame.se'];

    const allDomains = [
      ...Object.entries(BL_CUSTOMERS).map(([id,d]) => ({domain:d, type:'customer', customerId:id})),
      ...BL_COMPETITORS.map(d => ({domain:d, type:'competitor', customerId:null})),
      ...BL_PROSPECTS.map(d => ({domain:d, type:'prospect', customerId:null})),
    ];

    // Clear today's data if re-running
    try {
      await bq.query({ query: `DELETE FROM \`${dataset}.backlink_snapshots\` WHERE snapshot_date = @date`, params:{date} });
      await bq.query({ query: `DELETE FROM \`${dataset}.backlink_refdomains\` WHERE snapshot_date = @date`, params:{date} });
      await bq.query({ query: `DELETE FROM \`${dataset}.backlink_anchors\` WHERE snapshot_date = @date`, params:{date} });
    } catch(e) {}

    console.log(`[BL Monitor] Starting for ${allDomains.length} domains on ${date}`);
    let ok = 0, errors = 0;

    for (const {domain, type, customerId} of allDomains) {
      try {
        const s_data = await seRankingApi('GET', `/backlinks/summary?target=${encodeURIComponent(domain)}&mode=host`);
        const s = s_data?.summary?.[0];
        if (s) {
          await bq.dataset(dataset).table('backlink_snapshots').insert([{
            snapshot_date:date, domain, domain_type:type, customer_id:customerId,
            backlinks:s.backlinks||0, refdomains:s.refdomains||0,
            dofollow_backlinks:s.dofollow_backlinks||0, nofollow_backlinks:s.nofollow_backlinks||0,
            dofollow_refdomains:s.dofollow_refdomains||0, domain_inlink_rank:s.domain_inlink_rank||0,
            text_backlinks:s.text_backlinks||0, from_home_page_backlinks:s.from_home_page_backlinks||0,
            edu_backlinks:s.edu_backlinks||0, gov_backlinks:s.gov_backlinks||0,
            pages_with_backlinks:s.pages_with_backlinks||0, anchors_count:s.anchors||0
          }]);
        }

        const rd_data = await seRankingApi('GET', `/backlinks/refdomains?target=${encodeURIComponent(domain)}&mode=host&limit=500`);
        const rds = rd_data?.refdomains || [];
        for (let i = 0; i < rds.length; i += 200) {
          await bq.dataset(dataset).table('backlink_refdomains').insert(
            rds.slice(i, i+200).map(rd => ({
              snapshot_date:date, domain, refdomain:rd.refdomain,
              backlinks:rd.backlinks||0, dofollow_backlinks:rd.dofollow_backlinks||0,
              domain_inlink_rank:rd.domain_inlink_rank||0, first_seen:rd.first_seen||''
            }))
          );
        }

        const anc_data = await seRankingApi('GET', `/backlinks/anchors?target=${encodeURIComponent(domain)}&mode=host&limit=500`);
        const ancs = anc_data?.anchors || [];
        for (let i = 0; i < ancs.length; i += 200) {
          await bq.dataset(dataset).table('backlink_anchors').insert(
            ancs.slice(i, i+200).map(a => ({
              snapshot_date:date, domain, anchor:(a.anchor||'').substring(0,500),
              backlinks:a.backlinks||0, refdomains:a.refdomains||0,
              dofollow_backlinks:a.dofollow_backlinks||0,
              first_seen:a.first_seen||'', last_visited:a.last_visited||''
            }))
          );
        }

        console.log(`[BL Monitor] ${domain}: BL=${s?.backlinks||0} RD=${rds.length} Anc=${ancs.length}`);
        ok++;
        await new Promise(r => setTimeout(r, 300));
      } catch(e) {
        console.error(`[BL Monitor] ${domain} ERROR: ${e.message}`);
        errors++;
      }
    }
    console.log(`[BL Monitor] Done: ${ok} OK, ${errors} errors`);
  } catch (err) {
    console.error('[BL Monitor] Fatal error:', err.message);
  }
});

// ── Export functions for Lambda use ──
module.exports = {
  analyzeSiteSEO,
  optimizeMetadata,
  generateFAQSchema,
  addInternalLinks,
  fullSiteAudit,
  getWordPressSites,
  getParam,
  getClaude,
  getBigQuery,
  logOptimization,
  addToWorkQueue,
  trelloApi,
  createTrelloCard,
  wpApi,
  bqInsert,
  ensurePipelineTables,
  getContractTier,
  TIER_LIMITS
};

// ══════════════════════════════════════════
// PRESENTATIONS — Generate reveal.js presentations
// ══════════════════════════════════════════

const presentationGenerator = require('./presentation-generator');

// Serve generated presentations as static files
app.use('/presentations', express.static(path.join(__dirname, '..', 'presentations', 'output')));

// Serve generated PDF reports as static files
app.use('/reports', express.static(path.join(__dirname, '..', 'presentations', 'output', 'reports')));

// ══════════════════════════════════════════
// SALES FLOW — Domain analysis, cost estimate, order, startup, activate
// ══════════════════════════════════════════

// Helper: Calculate cost estimate from analysis results
function calculateCostEstimate(analysisResult) {
  const { score, issues } = analysisResult;
  const criticalCount = (issues || []).filter(i => i.severity === 'high').length;
  const warningCount = (issues || []).filter(i => i.severity === 'medium').length;
  const totalIssues = (issues || []).length;

  let amount, tier, reason;
  const breakdown = [];

  if (totalIssues <= 5 && score >= 70) {
    amount = 3500; tier = 'basic'; reason = 'Grundläggande SEO-optimering';
    breakdown.push({ name: 'Metadata-optimering', price: '1 500 kr' });
    breakdown.push({ name: 'Teknisk SEO-genomgång', price: '1 000 kr' });
    breakdown.push({ name: 'Schema markup', price: '1 000 kr' });
  } else if (totalIssues <= 15 && score >= 40) {
    amount = 5000; tier = 'standard'; reason = 'Standard SEO-paket';
    breakdown.push({ name: 'Komplett metadata-optimering', price: '2 000 kr' });
    breakdown.push({ name: 'Teknisk SEO + hastighet', price: '1 500 kr' });
    breakdown.push({ name: 'Schema markup + intern länkning', price: '1 500 kr' });
  } else {
    amount = 8000; tier = 'premium'; reason = 'Omfattande SEO-insats';
    breakdown.push({ name: 'Djupgående metadata-optimering', price: '2 500 kr' });
    breakdown.push({ name: 'Teknisk SEO + hastighetsoptimering', price: '2 000 kr' });
    breakdown.push({ name: 'Innehållsoptimering + intern länkning', price: '2 000 kr' });
    breakdown.push({ name: 'Schema markup + strukturerade data', price: '1 500 kr' });
  }

  return { amount, tier, reason, breakdown, monthly: amount, critical_issues: criticalCount, warning_issues: warningCount };
}

// POST /api/domain-analysis — One-click domain analysis (the core feature)
app.post('/api/domain-analysis', async (req, res) => {
  try {
    const { domain, salesperson_id, company_name } = req.body;
    if (!domain) return res.status(400).json({ error: 'domain krävs (t.ex. example.se)' });

    // Normalize domain
    let url = domain.trim();
    if (!url.startsWith('http')) url = 'https://' + url;
    const parsedUrl = new URL(url);
    const cleanDomain = parsedUrl.hostname.replace(/^www\./, '');
    const customerId = cleanDomain.replace(/\./g, '-');
    const siteUrl = parsedUrl.origin;

    await ensurePipelineTables();
    const { bq, dataset } = await getBigQuery();
    const now = new Date().toISOString();

    // Check if customer already exists
    const [existing] = await bq.query({
      query: `SELECT customer_id, stage FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @cid LIMIT 1`,
      params: { cid: customerId }
    });

    // 1. Create prospect if doesn't exist
    if (!existing || existing.length === 0) {
      await bqInsert('customer_pipeline', {
        customer_id: customerId,
        company_name: company_name || cleanDomain,
        contact_person: null,
        contact_email: null,
        website_url: siteUrl + '/',
        stage: 'analys',
        stage_updated_at: now,
        prospect_notes: null,
        initial_traffic_trend: null,
        service_type: null,
        monthly_amount_sek: null,
        contract_start_date: null,
        contract_end_date: null,
        contract_status: null,
        audit_meeting_date: null,
        startup_meeting_date: null,
        created_at: now,
        updated_at: now,
        trello_card_id: null,
        assigned_to: salesperson_id || 'mikael',
        assigned_to_name: salesperson_id ? null : 'Mikael Larsson'
      });
    }

    // 2. Run SEO analysis on homepage
    let analysisResult;
    try {
      analysisResult = await analyzeSiteSEO(siteUrl);
    } catch (e) {
      // If main URL fails, try with trailing slash or www
      try {
        analysisResult = await analyzeSiteSEO(siteUrl + '/');
      } catch (e2) {
        return res.status(400).json({ error: `Kunde inte analysera ${siteUrl}: ${e2.message}` });
      }
    }

    const score = analysisResult.analysis?.score || 0;
    const issues = analysisResult.analysis?.issues || [];
    const seoData = analysisResult.seoData || {};

    // 3. Try to fetch additional pages from sitemap
    let additionalPages = [];
    try {
      const sitemapUrl = `${siteUrl}/sitemap.xml`;
      const { data: sitemapXml } = await axios.get(sitemapUrl, { timeout: 8000 });
      const urlMatches = sitemapXml.match(/<loc>(.*?)<\/loc>/gi) || [];
      const pageUrls = urlMatches
        .map(m => m.replace(/<\/?loc>/gi, ''))
        .filter(u => u !== siteUrl && u !== siteUrl + '/')
        .slice(0, 5);

      for (const pageUrl of pageUrls) {
        try {
          const { data: pageHtml } = await axios.get(pageUrl, { timeout: 8000 });
          const titleMatch = pageHtml.match(/<title[^>]*>(.*?)<\/title>/is);
          const descMatch = pageHtml.match(/<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/is);
          const h1Match = pageHtml.match(/<h1[^>]*>(.*?)<\/h1>/is);
          additionalPages.push({
            url: pageUrl,
            title: titleMatch ? titleMatch[1].trim() : null,
            description: descMatch ? descMatch[1].trim() : null,
            h1: h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : null,
            hasSchema: pageHtml.includes('application/ld+json')
          });
        } catch (e) { /* skip pages that fail */ }
      }
    } catch (e) { /* sitemap not found — that's fine */ }

    // 4. Generate phone-pitch summary via Claude
    let summary = '';
    try {
      const client = await getClaude();
      const summaryResponse = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Du är en SEO-expert som ska sammanfatta en SEO-analys för en säljare som ska ringa kunden.

Företag: ${company_name || cleanDomain}
Sajt: ${siteUrl}
SEO-score: ${score}/100
Antal problem: ${issues.length}
Kritiska problem: ${issues.filter(i => i.severity === 'high').length}

Analysdata:
- Title: ${seoData.title || 'SAKNAS'}
- Description: ${seoData.description || 'SAKNAS'}
- H1: ${JSON.stringify(seoData.h1Tags || [])}
- Schema markup: ${seoData.hasSchema ? 'Ja' : 'Nej'}
- Sitemap: ${seoData.hasSitemap ? 'Ja' : 'Nej'}
- Extra sidor analyserade: ${additionalPages.length}

Problem hittade:
${issues.map(i => `- [${i.severity}] ${i.description}`).join('\n')}

Skriv en kort sammanfattning (3-4 meningar) som säljaren kan läsa upp i telefon. Fokusera på:
1. Vad som är bra med sajten
2. De viktigaste problemen som kostar dem trafik/kunder
3. Vad vi kan göra åt det

Svara ENBART med sammanfattningstexten, inga JSON-format.`
        }]
      });
      summary = summaryResponse.content[0].text;
    } catch (e) {
      summary = `${company_name || cleanDomain} har SEO-score ${score}/100 med ${issues.length} identifierade problem. ${issues.filter(i => i.severity === 'high').length} är kritiska och bör åtgärdas omgående.`;
    }

    // 5. Calculate cost estimate
    const costEstimate = calculateCostEstimate({ score, issues });

    // 6. Save to BigQuery
    try {
      await bq.query({
        query: `UPDATE \`${dataset}.customer_pipeline\` SET
          analysis_score = @score,
          analysis_summary = @summary,
          analysis_json = @json,
          analysis_date = CURRENT_TIMESTAMP(),
          cost_estimate_sek = @cost,
          cost_estimate_type = 'auto',
          cost_estimate_json = @costJson,
          stage = 'analys',
          stage_updated_at = CURRENT_TIMESTAMP(),
          updated_at = CURRENT_TIMESTAMP()
          WHERE customer_id = @cid`,
        params: {
          score,
          summary,
          json: JSON.stringify({ seoData, issues, additionalPages }),
          cost: costEstimate.amount,
          costJson: JSON.stringify(costEstimate),
          cid: customerId
        }
      });
    } catch (e) {
      console.error('BigQuery update error:', e.message);
    }

    // 7. Fetch PageSpeed Insights (non-blocking — don't fail if it times out)
    let pageSpeed = null;
    try {
      pageSpeed = await fetchPageSpeed(siteUrl);
    } catch (e) {
      console.error('PageSpeed fetch error (non-critical):', e.message);
    }

    // 8. Generate PDF report (åtgärdsrapport)
    let pdfResult = null;
    try {
      const outputDir = path.join(__dirname, '..', 'presentations', 'output', 'reports');
      pdfResult = await generateReportPDF({
        companyName: company_name || cleanDomain,
        domain: cleanDomain,
        date: new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }),
        score,
        issues,
        seoData,
        additionalPages,
        summary,
        costEstimate,
        pageSpeed
      }, outputDir);
      console.log('PDF report generated:', pdfResult.filename);

      // Save PDF path to BigQuery
      try {
        await bq.query({
          query: `UPDATE \`${dataset}.customer_pipeline\` SET
            last_presentation_url = @pdfUrl,
            last_presentation_date = CURRENT_TIMESTAMP()
            WHERE customer_id = @cid`,
          params: {
            pdfUrl: `/reports/${pdfResult.filename}`,
            cid: customerId
          }
        });
      } catch (e) {
        console.error('BQ PDF path update error:', e.message);
      }
    } catch (e) {
      console.error('PDF generation error (non-critical):', e.message);
    }

    // 9. Return everything
    res.json({
      success: true,
      customer_id: customerId,
      company_name: company_name || cleanDomain,
      website_url: siteUrl,
      score,
      summary,
      issues,
      seo_data: seoData,
      additional_pages: additionalPages,
      cost_estimate: costEstimate,
      page_speed: pageSpeed,
      pdf_report: pdfResult ? { filename: pdfResult.filename, url: `/reports/${pdfResult.filename}` } : null,
      stage: 'analys',
      next_action: 'Redigera kostnadsuppskattning och generera mötespresentation'
    });
  } catch (err) {
    console.error('Domain analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/pdf/:filename — Serve generated PDF reports
app.get('/api/reports/pdf/:filename', (req, res) => {
  const filename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = path.join(__dirname, '..', 'presentations', 'output', 'reports', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
  res.sendFile(filePath);
});

// GET /api/reports/download/:filename — Download PDF report
app.get('/api/reports/download/:filename', (req, res) => {
  const filename = req.params.filename.replace(/[^a-zA-Z0-9._-]/g, '');
  const filePath = path.join(__dirname, '..', 'presentations', 'output', 'reports', filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.sendFile(filePath);
});

// POST /api/reports/generate-pdf — Manually generate/regenerate PDF for existing customer
app.post('/api/reports/generate-pdf', async (req, res) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) return res.status(400).json({ error: 'customer_id krävs' });

    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @cid LIMIT 1`,
      params: { cid: customer_id }
    });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Kund hittades inte' });

    const customer = rows[0];
    const analysisJson = customer.analysis_json ? JSON.parse(customer.analysis_json) : {};
    const costJson = customer.cost_estimate_json ? JSON.parse(customer.cost_estimate_json) : null;

    // Fetch PageSpeed
    let pageSpeed = null;
    if (customer.website_url) {
      try {
        pageSpeed = await fetchPageSpeed(customer.website_url);
      } catch (e) { console.error('PageSpeed error:', e.message); }
    }

    const outputDir = path.join(__dirname, '..', 'presentations', 'output', 'reports');
    const domain = (customer.website_url || '').replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '');

    const pdfResult = await generateReportPDF({
      companyName: customer.company_name || domain,
      domain: domain,
      date: new Date().toLocaleDateString('sv-SE', { day: 'numeric', month: 'long', year: 'numeric' }),
      score: customer.analysis_score || 0,
      issues: analysisJson.issues || [],
      seoData: analysisJson.seoData || {},
      additionalPages: analysisJson.additionalPages || [],
      summary: customer.analysis_summary || '',
      costEstimate: costJson || { amount: customer.cost_estimate_sek || 0 },
      pageSpeed
    }, outputDir);

    // Update BQ
    await bq.query({
      query: `UPDATE \`${dataset}.customer_pipeline\` SET
        last_presentation_url = @pdfUrl,
        last_presentation_date = CURRENT_TIMESTAMP()
        WHERE customer_id = @cid`,
      params: { pdfUrl: `/reports/${pdfResult.filename}`, cid: customer_id }
    });

    res.json({
      success: true,
      pdf_report: { filename: pdfResult.filename, url: `/reports/${pdfResult.filename}` }
    });
  } catch (err) {
    console.error('PDF regeneration error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/customers/:id/cost-estimate — Edit cost estimate before presentation
app.patch('/api/customers/:id/cost-estimate', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { cost_estimate_sek, cost_estimate_json } = req.body;
    if (!cost_estimate_sek) return res.status(400).json({ error: 'cost_estimate_sek krävs' });

    const { bq, dataset } = await getBigQuery();
    await bq.query({
      query: `UPDATE \`${dataset}.customer_pipeline\` SET
        cost_estimate_sek = @cost,
        cost_estimate_type = 'manual',
        cost_estimate_json = @json,
        updated_at = CURRENT_TIMESTAMP()
        WHERE customer_id = @cid`,
      params: {
        cost: cost_estimate_sek,
        json: cost_estimate_json ? JSON.stringify(cost_estimate_json) : null,
        cid: customerId
      }
    });

    res.json({ success: true, customer_id: customerId, cost_estimate_sek, type: 'manual' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/confirm-order — Order confirmation
app.post('/api/customers/:id/confirm-order', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { service_type, monthly_amount_sek, contract_start_date } = req.body;
    if (!service_type || !monthly_amount_sek || !contract_start_date) {
      return res.status(400).json({ error: 'service_type, monthly_amount_sek, contract_start_date krävs' });
    }

    const { bq, dataset } = await getBigQuery();
    const start = new Date(contract_start_date);
    start.setMonth(start.getMonth() + 3);
    const endDate = start.toISOString().split('T')[0];

    await bq.query({
      query: `UPDATE \`${dataset}.customer_pipeline\` SET
        stage = 'orderbekraftelse',
        stage_updated_at = CURRENT_TIMESTAMP(),
        service_type = @service_type,
        monthly_amount_sek = @amount,
        contract_start_date = @startDate,
        contract_end_date = @endDate,
        contract_status = 'active',
        order_confirmed_at = CURRENT_TIMESTAMP(),
        updated_at = CURRENT_TIMESTAMP()
        WHERE customer_id = @cid`,
      params: {
        service_type,
        amount: monthly_amount_sek,
        startDate: contract_start_date,
        endDate,
        cid: customerId
      }
    });

    // Set contract tier in SSM
    const tier = getContractTier(monthly_amount_sek);
    try {
      const { SSMClient, PutParameterCommand } = require('@aws-sdk/client-ssm');
      const ssm = new SSMClient({ region: process.env.AWS_REGION || 'eu-north-1' });
      await ssm.send(new PutParameterCommand({
        Name: `/seo-mcp/integrations/${customerId}/contract-tier`,
        Value: tier, Type: 'String', Overwrite: true
      }));
    } catch (e) { console.error('SSM contract-tier error:', e.message); }

    res.json({ success: true, customer_id: customerId, stage: 'orderbekraftelse', tier });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/startup — Save startup meeting data (keywords + geographic focus)
app.post('/api/customers/:id/startup', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { geographic_focus, keywords, startup_meeting_date } = req.body;

    const { bq, dataset } = await getBigQuery();
    const now = new Date().toISOString();

    // Update pipeline with geographic focus and stage
    await bq.query({
      query: `UPDATE \`${dataset}.customer_pipeline\` SET
        stage = 'uppstart',
        stage_updated_at = CURRENT_TIMESTAMP(),
        geographic_focus = @geo,
        startup_meeting_date = @meetingDate,
        updated_at = CURRENT_TIMESTAMP()
        WHERE customer_id = @cid`,
      params: {
        geo: geographic_focus || null,
        meetingDate: startup_meeting_date || now,
        cid: customerId
      }
    });

    // Save keywords (phase='final')
    let keywordCount = 0;
    if (keywords && keywords.length > 0) {
      for (const kw of keywords) {
        if (!kw.keyword || !kw.keyword.trim()) continue;
        const kwId = `kw-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        await bqInsert('customer_keywords', {
          id: kwId,
          customer_id: customerId,
          keyword: kw.keyword.trim(),
          tier: kw.tier || 'B',
          phase: 'final',
          monthly_search_volume: kw.monthly_search_volume || null,
          keyword_difficulty: kw.keyword_difficulty || null,
          current_position: null,
          target_url: kw.target_url || null,
          created_at: now,
          updated_at: now
        });
        keywordCount++;
      }
    }

    res.json({ success: true, customer_id: customerId, stage: 'uppstart', keywords_saved: keywordCount, geographic_focus });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/activate — Activate autonomous optimization
app.post('/api/customers/:id/activate', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { bq, dataset } = await getBigQuery();

    // Check prerequisites
    const [keywords] = await bq.query({
      query: `SELECT COUNT(*) as cnt FROM \`${dataset}.customer_keywords\` WHERE customer_id = @cid`,
      params: { cid: customerId }
    });
    const kwCount = keywords[0]?.cnt || 0;

    const [plans] = await bq.query({
      query: `SELECT COUNT(*) as cnt FROM \`${dataset}.action_plans\` WHERE customer_id = @cid`,
      params: { cid: customerId }
    });
    const planCount = plans[0]?.cnt || 0;

    const warnings = [];
    if (kwCount === 0) warnings.push('Inga nyckelord sparade — rekommenderar att lägga till ABC-nyckelord först');
    if (planCount === 0) warnings.push('Ingen åtgärdsplan — rekommenderar att generera en 3-månaders plan');

    // Activate: set stage and timestamp
    await bq.query({
      query: `UPDATE \`${dataset}.customer_pipeline\` SET
        stage = 'aktiv',
        stage_updated_at = CURRENT_TIMESTAMP(),
        activated_at = CURRENT_TIMESTAMP(),
        updated_at = CURRENT_TIMESTAMP()
        WHERE customer_id = @cid`,
      params: { cid: customerId }
    });

    // Queue month 1 tasks if action plan exists
    let queued = 0;
    if (planCount > 0) {
      try {
        const [tasks] = await bq.query({
          query: `SELECT * FROM \`${dataset}.action_plans\` WHERE customer_id = @cid AND month_number = 1 AND status = 'planned' AND estimated_effort = 'auto'`,
          params: { cid: customerId }
        });
        for (const task of tasks) {
          const queueId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
          await bqInsert('seo_work_queue', {
            id: queueId,
            customer_id: customerId,
            site_url: '',
            task_type: task.task_type,
            page_url: task.target_url || '',
            context_data: JSON.stringify({ keyword: task.target_keyword, description: task.task_description }),
            priority: task.priority || 50,
            status: 'pending',
            created_at: new Date().toISOString()
          });
          queued++;
          // Update action plan status
          await bq.query(`UPDATE \`${dataset}.action_plans\` SET status = 'queued', work_queue_id = '${queueId}' WHERE plan_id = '${task.plan_id}'`);
        }
      } catch (e) { console.error('Queue month 1 error:', e.message); }
    }

    res.json({ success: true, customer_id: customerId, stage: 'aktiv', queued_tasks: queued, warnings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/salespeople — List all salespeople
app.get('/api/salespeople', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.salespeople\` WHERE is_active = true ORDER BY display_name`
    });
    res.json({ salespeople: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/salespeople — Add a new salesperson
app.post('/api/salespeople', async (req, res) => {
  try {
    const { salesperson_id, email, display_name, role } = req.body;
    if (!salesperson_id || !email || !display_name) {
      return res.status(400).json({ error: 'salesperson_id, email, display_name krävs' });
    }
    const { bq, dataset } = await getBigQuery();
    await bq.query({
      query: `INSERT INTO \`${dataset}.salespeople\` (salesperson_id, email, display_name, role, is_active, created_at)
        VALUES (@id, @email, @name, @role, true, CURRENT_TIMESTAMP())`,
      params: { id: salesperson_id, email, name: display_name, role: role || 'salesperson' }
    });
    res.json({ success: true, salesperson_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════
// PRESENTATIONS — Generate reveal.js slides
// ══════════════════════════════════════════

// GET /api/presentations/templates — List available templates
app.get('/api/presentations/templates', (req, res) => {
  try {
    const templates = presentationGenerator.listTemplates();
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/presentations/generate — Generate presentation for customer
app.post('/api/presentations/generate', async (req, res) => {
  try {
    const { customer_id, template, use_ai, custom_pricing } = req.body;
    if (!customer_id) return res.status(400).json({ error: 'customer_id krävs' });

    // Fetch customer data
    const { bq, dataset } = await getBigQuery();
    const [pipeline] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @cid LIMIT 1`,
      params: { cid: customer_id }
    });
    const customer = pipeline[0] || { customer_id, company_name: customer_id };

    // Fetch keywords
    const [keywords] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_keywords\` WHERE customer_id = @cid`,
      params: { cid: customer_id }
    });

    // Fetch latest audit
    const [audits] = await bq.query({
      query: `SELECT * FROM \`${dataset}.seo_optimization_log\` WHERE customer_id = @cid ORDER BY created_at DESC LIMIT 20`,
      params: { cid: customer_id }
    });

    // Fetch queue stats
    const [queue] = await bq.query({
      query: `SELECT status, COUNT(*) as cnt FROM \`${dataset}.seo_work_queue\` WHERE customer_id = @cid GROUP BY status`,
      params: { cid: customer_id }
    });

    const auditData = {
      total_pages: customer.total_pages || audits.length || '—',
      total_issues: queue.reduce((sum, q) => sum + (q.status === 'pending' ? q.cnt : 0), 0),
      stat_articles: keywords.length || '—',
      stat_articles_label: 'Nyckelord',
      stat_articles_detail: 'ABC-klassificerade',
      stat_extra1: queue.reduce((sum, q) => sum + q.cnt, 0) || '—',
      stat_extra1_label: 'Uppgifter',
      stat_extra1_detail: 'I arbetskö',
      stat_extra2: audits.length || '—',
      stat_extra2_label: 'Optimeringar',
      stat_extra2_detail: 'Genomförda',
      issues: queue.filter(q => q.status === 'pending'),
      keywords: keywords.map(k => ({ keyword: k.keyword, tier: k.tier }))
    };

    let html;

    // Build custom pricing override if provided
    let pricingOverride = {};
    if (custom_pricing) {
      pricingOverride = {
        total_price: custom_pricing.total_price || null,
        pricing_package_name: custom_pricing.package_name || null,
        pricing_items: custom_pricing.pricing_items || null,
        pricing_includes: custom_pricing.pricing_includes || null,
        timeline: custom_pricing.timeline || null
      };
    }

    if (use_ai) {
      // Use Claude AI to generate content
      const apiKey = await getParam('/seo-mcp/anthropic/api-key');
      const anthropic = new Anthropic({ apiKey });
      html = await presentationGenerator.generateWithAI(anthropic, customer, auditData);
      // Override pricing in AI-generated HTML if custom_pricing was provided
      if (custom_pricing && html) {
        // Re-generate with overrides by parsing AI content and re-rendering
        const mergedContent = { ...pricingOverride };
        html = presentationGenerator.generateSeoAudit(customer, auditData, mergedContent);
      }
    } else {
      // Use template with basic data + custom pricing
      html = presentationGenerator.generateSeoAudit(customer, auditData, pricingOverride);
    }

    // Save to output directory
    const outputDir = path.join(__dirname, '..', 'presentations', 'output');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const filename = `${customer_id}-seo-audit-${Date.now()}.html`;
    const filepath = path.join(outputDir, filename);
    fs.writeFileSync(filepath, html, 'utf-8');

    const presUrl = `/presentations/${filename}`;

    // Save presentation URL to pipeline
    try {
      const { bq: bq2, dataset: ds2 } = await getBigQuery();
      await bq2.query({
        query: `UPDATE \`${ds2}.customer_pipeline\` SET last_presentation_url = @url, last_presentation_date = CURRENT_TIMESTAMP(), updated_at = CURRENT_TIMESTAMP() WHERE customer_id = @cid`,
        params: { url: presUrl, cid: customer_id }
      });
    } catch (e) { console.error('Save presentation URL error:', e.message); }

    res.json({
      success: true,
      customer_id,
      filename,
      url: presUrl,
      slides: 12,
      template: template || 'seo-audit'
    });
  } catch (err) {
    console.error('Presentation generation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/presentations/preview — Preview with custom data (no save)
app.post('/api/presentations/preview', (req, res) => {
  try {
    const { customer_data, audit_data, ai_content } = req.body;
    const html = presentationGenerator.generateSeoAudit(
      customer_data || {},
      audit_data || {},
      ai_content || {}
    );
    res.type('html').send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/presentations — List generated presentations
app.get('/api/presentations', (req, res) => {
  try {
    const outputDir = path.join(__dirname, '..', 'presentations', 'output');
    if (!fs.existsSync(outputDir)) return res.json({ presentations: [] });

    const files = fs.readdirSync(outputDir)
      .filter(f => f.endsWith('.html'))
      .map(f => {
        const stats = fs.statSync(path.join(outputDir, f));
        const parts = f.replace('.html', '').split('-seo-audit-');
        return {
          filename: f,
          customer_id: parts[0] || f,
          created_at: stats.mtime.toISOString(),
          url: `/presentations/${f}`,
          size: stats.size
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({ presentations: files });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Performance Gauges API ──

// GET /api/customers/:id/performance — Live PageSpeed scores + cached history
app.get('/api/customers/:id/performance', async (req, res) => {
  try {
    const { id } = req.params;
    const sites = await getAllWordPressSites();
    const site = sites.find(s => s.id === id);
    if (!site || !site.url) return res.status(404).json({ error: 'Kund ej hittad' });

    const siteUrl = site.url.replace(/\/$/, '');
    const { bq, dataset } = await getBigQuery();

    // 1. Check cache (< 24h old)
    const cacheQuery = `
      SELECT mobile_score, desktop_score, mobile_fcp, mobile_lcp, mobile_cls, mobile_tbt,
             desktop_fcp, desktop_lcp, desktop_cls, desktop_tbt, scanned_at
      FROM \`${dataset}.performance_log\`
      WHERE customer_id = @id
      ORDER BY scanned_at DESC
      LIMIT 2
    `;
    let rows = [];
    try {
      const [result] = await bq.query({ query: cacheQuery, params: { id } });
      rows = result;
    } catch (e) {
      // Table may not exist yet
    }

    const now = new Date();
    const latest = rows[0];
    const previous = rows[1] || null;

    // If cache is < 24h old, return it
    if (latest && (now - new Date(latest.scanned_at.value || latest.scanned_at)) < 86400000) {
      return res.json({
        customer_id: id,
        url: siteUrl,
        cached: true,
        mobile: {
          score: latest.mobile_score,
          fcp: latest.mobile_fcp,
          lcp: latest.mobile_lcp,
          cls: latest.mobile_cls,
          tbt: latest.mobile_tbt
        },
        desktop: {
          score: latest.desktop_score,
          fcp: latest.desktop_fcp,
          lcp: latest.desktop_lcp,
          cls: latest.desktop_cls,
          tbt: latest.desktop_tbt
        },
        previous: previous ? {
          mobile_score: previous.mobile_score,
          desktop_score: previous.desktop_score,
          scanned_at: previous.scanned_at.value || previous.scanned_at
        } : null,
        scanned_at: latest.scanned_at.value || latest.scanned_at
      });
    }

    // 2. Fresh scan
    const pageSpeed = await fetchPageSpeed(siteUrl);

    // 3. Store in BigQuery
    if (pageSpeed.mobile || pageSpeed.desktop) {
      try {
        const insertQuery = `
          INSERT INTO \`${dataset}.performance_log\`
          (customer_id, url, mobile_score, desktop_score,
           mobile_fcp, mobile_lcp, mobile_cls, mobile_tbt,
           desktop_fcp, desktop_lcp, desktop_cls, desktop_tbt, scanned_at)
          VALUES (@id, @url, @ms, @ds, @mfcp, @mlcp, @mcls, @mtbt,
                  @dfcp, @dlcp, @dcls, @dtbt, CURRENT_TIMESTAMP())
        `;
        await bq.query({
          query: insertQuery,
          params: {
            id, url: siteUrl,
            ms: pageSpeed.mobile?.score || 0,
            ds: pageSpeed.desktop?.score || 0,
            mfcp: pageSpeed.mobile?.fcp || '',
            mlcp: pageSpeed.mobile?.lcp || '',
            mcls: pageSpeed.mobile?.cls || '',
            mtbt: pageSpeed.mobile?.tbt || '',
            dfcp: pageSpeed.desktop?.fcp || '',
            dlcp: pageSpeed.desktop?.lcp || '',
            dcls: pageSpeed.desktop?.cls || '',
            dtbt: pageSpeed.desktop?.tbt || ''
          }
        });
      } catch (e) {
        console.error('Performance log insert error:', e.message);
      }
    }

    res.json({
      customer_id: id,
      url: siteUrl,
      cached: false,
      mobile: pageSpeed.mobile,
      desktop: pageSpeed.desktop,
      previous: latest ? {
        mobile_score: latest.mobile_score,
        desktop_score: latest.desktop_score,
        scanned_at: latest.scanned_at.value || latest.scanned_at
      } : null,
      scanned_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('Performance endpoint error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/performance/history — Last 12 weeks of scores
app.get('/api/customers/:id/performance/history', async (req, res) => {
  try {
    const { id } = req.params;
    const { bq, dataset } = await getBigQuery();
    const query = `
      SELECT mobile_score, desktop_score, scanned_at
      FROM \`${dataset}.performance_log\`
      WHERE customer_id = @id
      ORDER BY scanned_at DESC
      LIMIT 12
    `;
    const [rows] = await bq.query({ query, params: { id } });
    res.json({
      customer_id: id,
      history: rows.reverse().map(r => ({
        mobile: r.mobile_score,
        desktop: r.desktop_score,
        date: r.scanned_at.value || r.scanned_at
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/performance/scan — Force a fresh scan
app.post('/api/customers/:id/performance/scan', async (req, res) => {
  try {
    const { id } = req.params;
    const sites = await getAllWordPressSites();
    const site = sites.find(s => s.id === id);
    if (!site || !site.url) return res.status(404).json({ error: 'Kund ej hittad' });

    const siteUrl = site.url.replace(/\/$/, '');
    const pageSpeed = await fetchPageSpeed(siteUrl);

    // Store
    if (pageSpeed.mobile || pageSpeed.desktop) {
      const { bq, dataset } = await getBigQuery();
      try {
        await bq.query({
          query: `
            INSERT INTO \`${dataset}.performance_log\`
            (customer_id, url, mobile_score, desktop_score,
             mobile_fcp, mobile_lcp, mobile_cls, mobile_tbt,
             desktop_fcp, desktop_lcp, desktop_cls, desktop_tbt, scanned_at)
            VALUES (@id, @url, @ms, @ds, @mfcp, @mlcp, @mcls, @mtbt,
                    @dfcp, @dlcp, @dcls, @dtbt, CURRENT_TIMESTAMP())
          `,
          params: {
            id, url: siteUrl,
            ms: pageSpeed.mobile?.score || 0,
            ds: pageSpeed.desktop?.score || 0,
            mfcp: pageSpeed.mobile?.fcp || '',
            mlcp: pageSpeed.mobile?.lcp || '',
            mcls: pageSpeed.mobile?.cls || '',
            mtbt: pageSpeed.mobile?.tbt || '',
            dfcp: pageSpeed.desktop?.fcp || '',
            dlcp: pageSpeed.desktop?.lcp || '',
            dcls: pageSpeed.desktop?.cls || '',
            dtbt: pageSpeed.desktop?.tbt || ''
          }
        });
      } catch (e) {
        console.error('Performance scan insert error:', e.message);
      }
    }

    res.json({
      customer_id: id,
      url: siteUrl,
      mobile: pageSpeed.mobile,
      desktop: pageSpeed.desktop,
      scanned_at: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Touchpoints (GA4 kontaktytor) ──────────────────────────────
app.get('/api/customers/:id/touchpoints', async (req, res) => {
  try {
    const customerId = req.params.id;

    // Check if GA4 property ID is configured for this customer
    let ga4PropertyId = null;
    try {
      ga4PropertyId = await getParam(`/seo-mcp/integrations/${customerId}/ga4-property-id`);
    } catch (e) { /* not set */ }

    if (!ga4PropertyId) {
      return res.json({
        mock: true,
        phone_clicks: 0,
        email_clicks: 0,
        form_submissions: 0,
        total: 0,
        period: '28d',
        daily: [],
        message: 'GA4 ej konfigurerad for denna kund'
      });
    }

    // GA4 Data API — kräver google-auth-library (redan installerad for GSC)
    const { GoogleAuth } = require('google-auth-library');
    await getBigQuery(); // Ensure credentials file exists at /tmp/wif-config.json
    const auth = new GoogleAuth({
      keyFile: '/tmp/wif-config.json',
      scopes: ['https://www.googleapis.com/auth/analytics.readonly']
    });
    const client = await auth.getClient();

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 27); // 28 days total

    const formatDate = (d) => d.toISOString().split('T')[0];

    // Request 1: Totals for phone, email, form
    const totalsResponse = await client.request({
      url: `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId}:runReport`,
      method: 'POST',
      headers: { 'x-goog-user-project': 'seo-aouto' },
      data: {
        dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'eventName' }, { name: 'linkUrl' }],
        dimensionFilter: {
          orGroup: {
            expressions: [
              { filter: { fieldName: 'eventName', stringFilter: { value: 'click', matchType: 'EXACT' } } },
              { filter: { fieldName: 'eventName', stringFilter: { value: 'form_submit', matchType: 'EXACT' } } },
              { filter: { fieldName: 'eventName', stringFilter: { value: 'generate_lead', matchType: 'EXACT' } } }
            ]
          }
        }
      }
    });

    let phoneClicks = 0, emailClicks = 0, formSubmissions = 0;
    const rows = totalsResponse.data?.rows || [];
    for (const row of rows) {
      const eventName = row.dimensionValues?.[0]?.value || '';
      const linkUrl = (row.dimensionValues?.[1]?.value || '').toLowerCase();
      const count = parseInt(row.metricValues?.[0]?.value || '0', 10);

      if (eventName === 'click' && linkUrl.startsWith('tel:')) {
        phoneClicks += count;
      } else if (eventName === 'click' && linkUrl.startsWith('mailto:')) {
        emailClicks += count;
      } else if (eventName === 'form_submit' || eventName === 'generate_lead') {
        formSubmissions += count;
      }
    }

    // Request 2: Daily totals for sparkline
    const dailyResponse = await client.request({
      url: `https://analyticsdata.googleapis.com/v1beta/properties/${ga4PropertyId}:runReport`,
      method: 'POST',
      headers: { 'x-goog-user-project': 'seo-aouto' },
      data: {
        dateRanges: [{ startDate: formatDate(startDate), endDate: formatDate(endDate) }],
        metrics: [{ name: 'eventCount' }],
        dimensions: [{ name: 'date' }],
        dimensionFilter: {
          orGroup: {
            expressions: [
              { filter: { fieldName: 'eventName', stringFilter: { value: 'click', matchType: 'EXACT' } } },
              { filter: { fieldName: 'eventName', stringFilter: { value: 'form_submit', matchType: 'EXACT' } } },
              { filter: { fieldName: 'eventName', stringFilter: { value: 'generate_lead', matchType: 'EXACT' } } }
            ]
          }
        },
        orderBys: [{ dimension: { dimensionName: 'date' } }]
      }
    });

    const daily = [];
    const dailyRows = dailyResponse.data?.rows || [];
    for (const row of dailyRows) {
      const dateStr = row.dimensionValues?.[0]?.value || '';
      const count = parseInt(row.metricValues?.[0]?.value || '0', 10);
      // GA4 date format: YYYYMMDD → YYYY-MM-DD
      const formatted = dateStr.length === 8
        ? `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`
        : dateStr;
      daily.push({ date: formatted, total: count });
    }

    // Fill missing dates with 0
    const dailyMap = {};
    for (const d of daily) dailyMap[d.date] = d.total;
    const filledDaily = [];
    for (let i = 0; i < 28; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = formatDate(d);
      filledDaily.push({ date: key, total: dailyMap[key] || 0 });
    }

    res.json({
      mock: false,
      phone_clicks: phoneClicks,
      email_clicks: emailClicks,
      form_submissions: formSubmissions,
      total: phoneClicks + emailClicks + formSubmissions,
      period: '28d',
      daily: filledDaily
    });

  } catch (err) {
    console.error('Touchpoints error:', err.message);
    // Fallback to mock on any GA4 error
    res.json({
      mock: true,
      phone_clicks: 0,
      email_clicks: 0,
      form_submissions: 0,
      total: 0,
      period: '28d',
      daily: [],
      message: `GA4-fel: ${err.message}`
    });
  }
});

// ── AI Analytics Chat ──────────────────────────────────────────
app.post('/api/customers/:id/analytics-chat', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Meddelande saknas' });
    }

    // Gather customer data in parallel
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);
    const customerName = site?.url?.replace(/https?:\/\/(www\.)?/, '').replace(/\/$/, '') || customerId;

    const { bq, dataset } = await getBigQuery();

    // Fetch relevant data in parallel
    const [optimizations, queueTasks, rankings, keywords] = await Promise.all([
      // Recent optimizations (last 30 days)
      bq.query({
        query: `SELECT task_type, page_url, old_value, new_value, timestamp
                FROM \`${dataset}.seo_optimization_log\`
                WHERE customer_id = @cid
                ORDER BY timestamp DESC LIMIT 20`,
        params: { cid: customerId }
      }).then(([rows]) => rows).catch(() => []),

      // Work queue
      bq.query({
        query: `SELECT task_type, page_url, priority, status, source
                FROM \`${dataset}.seo_work_queue\`
                WHERE customer_id = @cid AND status != 'completed'
                ORDER BY created_at DESC LIMIT 20`,
        params: { cid: customerId }
      }).then(([rows]) => rows).catch(() => []),

      // GSC rankings (cached via internal call)
      (async () => {
        try {
          let gscProperty = null;
          try { gscProperty = await getParam(`/seo-mcp/integrations/${customerId}/gsc-property`); } catch (e) {}
          if (!gscProperty && site) {
            gscProperty = site.url.replace(/\/$/, '') + '/';
            if (!gscProperty.startsWith('http')) gscProperty = 'https://' + gscProperty;
          }
          if (gscProperty) {
            return await gscSearchAnalytics(gscProperty, []);
          }
        } catch (e) {}
        return [];
      })(),

      // Keywords from BigQuery
      bq.query({
        query: `SELECT keyword, category, search_volume
                FROM \`${dataset}.customer_keywords\`
                WHERE customer_id = @cid
                ORDER BY category, search_volume DESC`,
        params: { cid: customerId }
      }).then(([rows]) => rows).catch(() => [])
    ]);

    // Build context summary for Claude
    const contextParts = [];
    contextParts.push(`Kund: ${customerName} (ID: ${customerId})`);

    if (rankings?.length > 0) {
      const top10 = rankings.filter(r => r.position <= 10).length;
      const avgPos = (rankings.reduce((s, r) => s + r.position, 0) / rankings.length).toFixed(1);
      const totalClicks = rankings.reduce((s, r) => s + (r.clicks || 0), 0);
      const totalImpressions = rankings.reduce((s, r) => s + (r.impressions || 0), 0);
      contextParts.push(`GSC-data (28 dagar): ${rankings.length} sokord, snittposition ${avgPos}, ${top10} i topp 10, ${totalClicks} klick, ${totalImpressions} visningar`);
      // Top 5 keywords
      const topKw = rankings.sort((a, b) => b.clicks - a.clicks).slice(0, 5);
      contextParts.push('Topp 5 sokord (klick): ' + topKw.map(k => `${k.query} (pos ${k.position.toFixed(1)}, ${k.clicks} klick)`).join(', '));
    } else {
      contextParts.push('GSC-data: Ej tillganglig');
    }

    if (keywords?.length > 0) {
      const aKw = keywords.filter(k => k.category === 'A').map(k => k.keyword);
      const bKw = keywords.filter(k => k.category === 'B').map(k => k.keyword);
      contextParts.push(`ABC-nyckelord: ${aKw.length} A-ord (${aKw.slice(0, 5).join(', ')}), ${bKw.length} B-ord`);
    }

    if (optimizations?.length > 0) {
      contextParts.push(`Senaste optimeringar: ${optimizations.length} st senaste 30 dagarna`);
      const types = {};
      optimizations.forEach(o => { types[o.task_type] = (types[o.task_type] || 0) + 1; });
      contextParts.push('Typer: ' + Object.entries(types).map(([t, c]) => `${t}: ${c}`).join(', '));
    }

    if (queueTasks?.length > 0) {
      contextParts.push(`Arbetsko: ${queueTasks.length} uppgifter vantar`);
    }

    const systemPrompt = `Du ar en SEO-analytiker for Searchboost Opti. Svara kort och koncist pa svenska.
Anvand bara data som finns i kontexten nedan. Om data saknas, saga det.
Var specifik med siffror nar de finns tillgangliga.
Svara aldrig med mer an 3-4 meningar.

KUNDDATA:
${contextParts.join('\n')}`;

    // Call Claude Haiku
    const anthropic = await getClaude();
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message.trim() }]
    });

    const answer = response.content?.[0]?.text || 'Kunde inte generera svar.';

    res.json({
      answer,
      model: 'claude-3-haiku-20240307',
      tokens_used: (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0),
      customer_id: customerId
    });

  } catch (err) {
    console.error('Analytics chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Report Export (PDF/PPTX) ──────────────────────────────────

const reportExporter = require('./report-exporter');

// POST /api/customers/:id/report/export — Generera PDF eller PPTX-rapport
app.post('/api/customers/:id/report/export', async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'pdf', type = 'seo-report' } = req.body;

    if (!['pdf', 'pptx'].includes(format)) {
      return res.status(400).json({ error: 'Format maste vara pdf eller pptx' });
    }

    // Hamta kunddata
    const sites = await getAllWordPressSites();
    const site = sites.find(s => s.id === id);
    if (!site) return res.status(404).json({ error: 'Kund ej hittad' });

    // Hamta all data parallellt
    const { bq, dataset } = await getBigQuery();
    const [statsResult, rankingsResult, perfResult, planResult] = await Promise.allSettled([
      bq.query({ query: `SELECT COUNT(*) as cnt FROM \`${dataset}.seo_optimization_log\` WHERE customer_id = @id AND created_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)`, params: { id } }),
      bq.query({ query: `SELECT keyword, position, clicks, impressions, change_7d FROM \`${dataset}.customer_keywords\` WHERE customer_id = @id ORDER BY clicks DESC LIMIT 20`, params: { id } }).catch(() => [[]]),
      (async () => {
        try {
          const pageSpeed = await fetchPageSpeed(site.url.replace(/\/$/, ''));
          return pageSpeed;
        } catch (e) { return null; }
      })(),
      bq.query({ query: `SELECT * FROM \`${dataset}.action_plans\` WHERE customer_id = @id ORDER BY created_at DESC LIMIT 1`, params: { id } }).catch(() => [[]])
    ]);

    const optimizations30d = statsResult.status === 'fulfilled' ? (statsResult.value[0]?.[0]?.cnt || 0) : 0;

    // Hamta namn fran SSM
    let companyName = id;
    try { companyName = await getParam(`/seo-mcp/integrations/${id}/company-name`); } catch (e) {}

    const reportData = {
      companyName,
      domain: site.url,
      date: new Date().toISOString().split('T')[0],
      mobileScore: perfResult.status === 'fulfilled' && perfResult.value ? (perfResult.value.mobile?.score || 0) : 0,
      desktopScore: perfResult.status === 'fulfilled' && perfResult.value ? (perfResult.value.desktop?.score || 0) : 0,
      topKeywords: rankingsResult.status === 'fulfilled' ? (rankingsResult.value[0] || []).map(r => ({
        keyword: r.keyword, position: r.position, clicks: r.clicks,
        impressions: r.impressions, change: r.change_7d || 0
      })) : [],
      clicks28d: 0,
      impressions28d: 0,
      avgPosition: 0,
      top10Count: 0,
      totalKeywords: 0,
      optimizations30d,
      issues: [],
      actionPlan: [],
      contactName: 'Mikael',
      contactEmail: 'mikael@searchboost.se'
    };

    let outputPath;
    if (type === 'sales-presentation') {
      outputPath = await reportExporter.generateSalesPresentation(reportData, format);
    } else {
      outputPath = await reportExporter.generateSeoReport(reportData, format);
    }

    // Returnera filen
    const filename = path.basename(outputPath);
    res.json({
      success: true,
      format,
      type,
      filename,
      url: `/presentations/output/${filename}`,
      size: fs.statSync(outputPath).size
    });

  } catch (err) {
    console.error('Report export error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/formats — Lista tillgangliga export-format
app.get('/api/reports/formats', (req, res) => {
  res.json({
    formats: [
      { id: 'pdf', name: 'PDF', description: 'PDF-rapport for utskrift och e-post', icon: 'pdf' },
      { id: 'pptx', name: 'PowerPoint', description: 'PPTX-presentation for kundmoeten', icon: 'pptx' }
    ],
    types: [
      { id: 'seo-report', name: 'SEO-rapport', description: 'Manadsrapport med prestanda, sokord och atgarder' },
      { id: 'sales-presentation', name: 'Saljpresentation', description: 'Presentation for nya kunder med analys och prisforslag' }
    ]
  });
});

// ── Portal Auth (JWT-baserad kundinloggning) ──────────────────
try {
  require('./portal-auth')(app, getParam, getBigQuery);
} catch (e) {
  console.warn('Portal auth ej laddat (saknar jsonwebtoken/bcryptjs?):', e.message);
}

// ── Ads Integration Endpoints ─────────────────────────────────

const integrations = require('./integrations');

// GET /api/customers/:id/ads — Hamta all annonsdata fran alla plattformar
app.get('/api/customers/:id/ads', async (req, res) => {
  try {
    const customerId = req.params.id;
    const platforms = req.query.platforms ? req.query.platforms.split(',') : null;
    const data = await integrations.getAllAdsData(customerId, getParam, { platforms });
    res.json(data);
  } catch (err) {
    console.error('Ads data error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/ads/spend — Enklare sammanfattning av annonsutgifter
app.get('/api/customers/:id/ads/spend', async (req, res) => {
  try {
    const customerId = req.params.id;
    const data = await integrations.getAdsSpendSummary(customerId, getParam);
    res.json(data);
  } catch (err) {
    console.error('Ads spend error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/ads/platforms — Vilka plattformar ar konfigurerade
app.get('/api/customers/:id/ads/platforms', async (req, res) => {
  try {
    const customerId = req.params.id;
    const data = await integrations.getConfiguredPlatforms(customerId, getParam);
    res.json(data);
  } catch (err) {
    console.error('Ads platforms error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// EduAdmin API (kurshantering for Kompetensutveckla m.fl.)
// ═══════════════════════════════════════════════════════════════
const eduadmin = require('./integrations/eduadmin');

// Helper: get EduAdmin credentials from SSM
async function getEduAdminCredentials(customerId) {
  const prefix = `/seo-mcp/integrations/${customerId}/`;
  const username = await getParam(`${prefix}eduadmin-api-username`);
  const password = await getParam(`${prefix}eduadmin-api-password`);
  if (!username || !password) throw new Error(`EduAdmin credentials not configured for ${customerId}`);
  return { username, password };
}

// GET /api/customers/:id/eduadmin/summary — Dashboard overview
app.get('/api/customers/:id/eduadmin/summary', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const summary = await eduadmin.getDashboardSummary(username, password);
    res.json(summary);
  } catch (err) {
    console.error('EduAdmin summary error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/eduadmin/courses — All course templates
app.get('/api/customers/:id/eduadmin/courses', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const showOnWebOnly = req.query.all !== 'true';
    const courses = await eduadmin.getCourseTemplates(username, password, { showOnWebOnly });
    res.json(courses);
  } catch (err) {
    console.error('EduAdmin courses error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/eduadmin/courses/:courseId — Single course detail
app.get('/api/customers/:id/eduadmin/courses/:courseId', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const course = await eduadmin.getCourseTemplate(username, password, req.params.courseId);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) {
    console.error('EduAdmin course detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/eduadmin/events — Upcoming events
app.get('/api/customers/:id/eduadmin/events', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const daysAhead = parseInt(req.query.days) || 90;
    const events = await eduadmin.getUpcomingEvents(username, password, { daysAhead });
    res.json(events);
  } catch (err) {
    console.error('EduAdmin events error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/eduadmin/ondemand — On-demand (e-learning) courses
app.get('/api/customers/:id/eduadmin/ondemand', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const courses = await eduadmin.getOnDemandCourses(username, password);
    res.json(courses);
  } catch (err) {
    console.error('EduAdmin ondemand error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/eduadmin/bookings — Recent bookings
app.get('/api/customers/:id/eduadmin/bookings', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const daysBack = parseInt(req.query.days) || 30;
    const bookings = await eduadmin.getRecentBookings(username, password, { daysBack });
    res.json(bookings);
  } catch (err) {
    console.error('EduAdmin bookings error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/eduadmin/categories — Categories
app.get('/api/customers/:id/eduadmin/categories', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const categories = await eduadmin.getCategories(username, password);
    res.json(categories);
  } catch (err) {
    console.error('EduAdmin categories error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/eduadmin/locations — Locations
app.get('/api/customers/:id/eduadmin/locations', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const locations = await eduadmin.getLocations(username, password);
    res.json(locations);
  } catch (err) {
    console.error('EduAdmin locations error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/eduadmin/personnel — Personnel/instructors
app.get('/api/customers/:id/eduadmin/personnel', async (req, res) => {
  try {
    const { username, password } = await getEduAdminCredentials(req.params.id);
    const personnel = await eduadmin.getPersonnel(username, password);
    res.json(personnel);
  } catch (err) {
    console.error('EduAdmin personnel error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`SEO MCP Server listening on port ${PORT}`);
  console.log(`Region: ${REGION}`);
  console.log(`Health: http://localhost:${PORT}/health`);
  // Ensure pipeline tables exist on startup
  try {
    await ensurePipelineTables();
    console.log('Pipeline tables verified.');
  } catch (e) {
    console.error('Pipeline table init error:', e.message);
  }
});
