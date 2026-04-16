const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// ── Slack-notiser ──
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL || '';
async function slackAlert(message, level = 'warning') {
  const emoji = level === 'critical' ? ':rotating_light:' : level === 'info' ? ':white_check_mark:' : ':warning:';
  try {
    await axios.post(SLACK_WEBHOOK, {
      text: `${emoji} *Searchboost Opti* — ${message}`
    });
  } catch (e) {
    console.error('Slack-notis misslyckades:', e.message);
  }
}
const { SSMClient, GetParameterCommand, GetParametersByPathCommand, PutParameterCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const { generateReportPDF, fetchPageSpeed } = require('./pdf-report-generator');

const app = express();
app.set('trust proxy', 1); // Nginx reverse proxy sätter X-Forwarded-For
app.use(express.json());

// ── Security headers ──
app.use(helmet({
  contentSecurityPolicy: false, // Dashboard använder inline scripts
  crossOriginEmbedderPolicy: false
}));

// ── HTTPS-redirect (gäller bara när X-Forwarded-Proto sätts av Nginx) ──
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] === 'http') {
    return res.redirect(301, 'https://' + req.headers.host + req.url);
  }
  next();
});

// ── Rate limiting på portal-login (max 10 försök/15 min per IP) ──
const portalLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'För många inloggningsförsök. Försök igen om 15 minuter.' },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    slackAlert(`Brute force-försök blockerat på kundportalen — IP: ${req.ip}`, 'critical');
    res.status(options.statusCode).json(options.message);
  }
});

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
  if (!req.path.startsWith('/api/')) return next(); // Inkl. /oauth/* — öppna

  if (req.method === 'OPTIONS') return next();
  if (req.path.startsWith('/api/reports/pdf/') || req.path.startsWith('/api/reports/download/')) return next();
  if (req.path === '/api/portal/login') return next(); // Kundportal login behöver ingen API-nyckel
  if (req.path === '/api/onboard') return next(); // Onboarding har egen auth-check (onboard/api-key)
  if (req.path.startsWith('/api/shopify/')) return next(); // Shopify OAuth — anropas av Shopify, ingen API-nyckel
  if (req.path.startsWith('/api/chatbot/')) return next(); // Chatbot widget på searchboost.se — öppen

  // Om Bearer JWT-token finns: validera den mot portal-hemligheterna
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      let jwtSecret;
      try {
        jwtSecret = await getParam('/seo-mcp/portal/jwt-secret');
      } catch (e) { /* JWT-secret saknas */ }
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret);
        req.portalCustomer = { id: decoded.customer_id, name: decoded.name, email: decoded.email };
        return next(); // Giltig JWT → tillåt
      }
    } catch (e) {
      // Ogiltig JWT → faller igenom till X-Api-Key-check
    }
  }

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

async function getParamSafe(name) {
  try { return await getParam(name); } catch { return null; }
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

let bqProjectId = null;
async function getBigQuery() {
  if (bqClient) return { bq: bqClient, dataset: bqDataset, projectId: bqProjectId };
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  bqProjectId = await getParam('/seo-mcp/bigquery/project-id');
  bqDataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  bqClient = new BigQuery({ projectId: bqProjectId });
  return { bq: bqClient, dataset: bqDataset, projectId: bqProjectId };
}

// ── AI client (lazy init) — Anthropic direkt ──
let claude = null;
async function getClaude() {
  if (claude) return claude;
  const apiKey = await getParam('/seo-mcp/anthropic/api-key');
  claude = new Anthropic({ apiKey });
  console.log('[AI] Anthropic direkt');
  return claude;
}

// ── Modellnamn — renodlad Claude Haiku ──
// Tier-guide:
//   cheap/haiku = claude-haiku-4-5-20251001 — snabb & billig
//   sonnet      = claude-sonnet-4-6          — balanserad kvalitet
//   opus        = claude-opus-4-6            — maxkvalitet
function getModel(tier = 'sonnet') {
  if (tier === 'cheap' || tier === 'haiku' || tier === 'grok' || tier === 'kimi') return 'claude-haiku-4-5-20251001';
  if (tier === 'opus')  return 'claude-opus-4-6';
  return 'claude-sonnet-4-6';
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

// ── Kunder som är blockade på main EC2 — routa via worker (13.61.132.229) ──
const WORKER_PROXIED_CUSTOMERS = new Set(['ilmonte']);
let _workerUrl = null;
let _workerKey = null;
async function getWorkerConfig() {
  if (!_workerUrl) {
    _workerUrl = await getParam('/seo-mcp/worker/url').catch(() => 'http://13.61.132.229:4000');
    _workerKey = await getParam('/seo-mcp/worker/api-key').catch(() => null);
  }
  return { url: _workerUrl, key: _workerKey };
}

// ── WordPress REST API helpers ──
async function wpApi(site, method, endpoint, data = null) {
  // Om kunden är blockad på main EC2 → routa via worker-proxy
  const siteId = site.customer_id || site.id;
  if (siteId && WORKER_PROXIED_CUSTOMERS.has(siteId)) {
    const { url: workerUrl, key: workerKey } = await getWorkerConfig();
    const res = await axios.post(`${workerUrl}/worker/wp-proxy`, {
      wp_url: site.url,
      username: site.username,
      password: site['app-password'],
      path: `/wp/v2${endpoint}`,
      method,
      data
    }, {
      headers: { 'Authorization': `Bearer ${workerKey}` },
      timeout: 30000
    });
    return res.data;
  }

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
      // impact_estimate kolumn är STRING i BQ — alltid som sträng
      if (c === 'impact_estimate') return `'${String(v).replace(/'/g, "\\'")}'`;
      // time_spent_minutes är INT64
      if (c === 'time_spent_minutes') return String(parseInt(v, 10) || 0);
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
      // priority kolumn är INT64 i BQ — alltid som heltal
      if (c === 'priority') return String(parseInt(v, 10) || 0);
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
    },
    {
      name: 'link_prospects',
      schema: `customer_id STRING NOT NULL, prospect_id STRING NOT NULL, url STRING,
        domain_name STRING, link_type STRING, status STRING,
        notes STRING, created_at TIMESTAMP, updated_at TIMESTAMP`
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
        VALUES ('mikael', 'mikael@searchboost.se', 'Mikael Larsson', 'admin', true, CURRENT_TIMESTAMP())`);
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
    model: await getModel('cheap'),
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
    model: await getModel('cheap'),
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
    model: await getModel('cheap'),
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
    model: await getModel('cheap'),
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
// ══════════════════════════════════════════
// CHATBOT — searchboost.se widget (öppen, ingen API-nyckel)
// ══════════════════════════════════════════

// In-memory konversationshistorik (räcker för prototyp, max 500 sessioner)
const chatSessions = new Map();
const MAX_SESSIONS = 500;

const CHATBOT_SYSTEM_PROMPT = `Du är en erfaren SEO-specialist och arbetar för Searchboost.se.
Du heter "Searchboosts AI" men företrädare Mikael Larsson (mikael@searchboost.se, 073-xxx xx xx) hör av sig personligen.

Ditt enda mål: hjälp besökaren förstå varför deras sajt inte rankar, och erbjud en kostnadsfri Searchboost-analys.

KONVERSATIONSSTRATEGI:
1. Fråga vad de kämpar med (trafik? synlighet? konkurrenter rankar före?)
2. Ställ EN konkret följdfråga om deras bransch/domän
3. Förklara kort varför det är svårt (konkurrens, tekniska problem, innehåll)
4. Erbjud kostnadsfri analys: "Jag kan be Mikael köra en fullständig SEO-analys på din sajt — helt gratis, ingen förpliktelse."
5. BE om domän + email för att skicka rapporten

REGLER:
- Max 2-3 meningar per svar
- Alltid svenska, naturlig ton
- Aldrig avslöja priser — hänvisa till ett möte med Mikael
- Om de frågar om pris: "Det beror helt på er nuläge — det är just därför analysen är viktig, den visar exakt vad ni behöver."
- Om de ger email: tacka och bekräfta att Mikael hör av sig inom 24h
- Varumärke: Searchboost.se — transparent, inga dolda kostnader, resultat inom 4-8 veckor`;

app.post('/api/chatbot/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) return res.status(400).json({ error: 'message och sessionId krävs' });

    // Rensa gamla sessioner om gränsen nås
    if (chatSessions.size >= MAX_SESSIONS) {
      const firstKey = chatSessions.keys().next().value;
      chatSessions.delete(firstKey);
    }

    let history = chatSessions.get(sessionId) || [];
    history.push({ role: 'user', content: message });

    const anthropicApiKey = await getParam('/seo-mcp/anthropic/api-key');
    const anthropic = new Anthropic({ apiKey: anthropicApiKey });

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: CHATBOT_SYSTEM_PROMPT,
      messages: history,
    });

    const reply = response.content[0].type === 'text' ? response.content[0].text : 'Förlåt, försök igen.';
    history.push({ role: 'assistant', content: reply });

    // Spara max 20 meddelanden per session
    if (history.length > 20) history = history.slice(-20);
    chatSessions.set(sessionId, history);

    res.json({ reply });
  } catch (err) {
    console.error('Chatbot error:', err.message);
    res.status(500).json({ error: 'Kunde inte svara just nu.' });
  }
});

app.post('/api/chatbot/capture-lead', async (req, res) => {
  try {
    const { email, domain, sessionId } = req.body;
    if (!email) return res.status(400).json({ error: 'email krävs' });

    // Logga lead till BigQuery om möjligt (icke-kritiskt — misslyckas tyst)
    try {
      const bqCreds = await getParam('/seo-mcp/bigquery/credentials');
      const bqProjectId = await getParam('/seo-mcp/bigquery/project-id');
      const bqDataset = await getParam('/seo-mcp/bigquery/dataset');
      const bq = new BigQuery({ credentials: JSON.parse(bqCreds), projectId: bqProjectId });
      await bq.dataset(bqDataset).table('chatbot_leads').insert([{
        email,
        domain: domain || null,
        session_id: sessionId || null,
        created_at: new Date().toISOString(),
        source: 'searchboost_website_chatbot',
      }]);
    } catch (bqErr) {
      console.error('BQ lead insert failed (non-critical):', bqErr.message);
    }

    // Skicka notis till Mikael via SES
    try {
      const sesClient = new SESClient({ region: process.env.AWS_REGION || 'eu-north-1' });
      await sesClient.send(new SendEmailCommand({
        Source: 'noreply@searchboost.se',
        Destination: { ToAddresses: ['mikael@searchboost.se'] },
        Message: {
          Subject: { Data: `Ny lead från chatboten — ${domain || email}` },
          Body: {
            Text: {
              Data: `Ny lead från searchboost.se chatboten:\n\nEmail: ${email}\nDomän: ${domain || 'ej angiven'}\nSession: ${sessionId || 'okänd'}\n\nHör av dig inom 24h!`
            }
          }
        }
      }));
    } catch (sesErr) {
      console.error('SES notification failed (non-critical):', sesErr.message);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Lead capture error:', err.message);
    res.status(500).json({ error: 'Kunde inte spara lead.' });
  }
});

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

// POST /api/queue/purge-junk — Rensa kassasidor och interna WooCommerce-sidor ur kön
app.post('/api/queue/purge-junk', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    // Patterns: /kassan/, /varukorg/, /checkout/, /cart/, /min-konto/, /my-account/,
    // /dold/, /test/, /temp/, /betalning/, /order-received/, /sample-page/
    const [result] = await bq.query({
      query: `DELETE FROM \`${dataset}.seo_work_queue\`
              WHERE status = 'pending'
              AND (
                REGEXP_CONTAINS(page_url, r'/(kassan|varukorg|checkout|cart|kassa|min-konto|my-account|mitt-konto|betalning|order-received|orderbekraftelse|sample-page|privacy-policy|integritetspolicy|cookie-policy|gdpr|tack|thank-you|bekraftelse|login|logga-in|register|registrera)(/|$)')
                OR REGEXP_CONTAINS(page_url, r'/(dold|test|temp|tmp|staging|dev|draft)[-_/]')
              )`
    });
    const deleted = result ? result.numDmlAffectedRows || 0 : 0;
    res.json({ ok: true, deleted: Number(deleted), message: `Rensade ${deleted} junk-URLs ur kön` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard API: Get weekly reports
app.get('/api/reports', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    // Hämta kolumnnamn först för att undvika ORDER BY-fel
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.weekly_reports\` LIMIT 50`
    });
    // Sortera i JS istället — stöder både email_sent_at och sent_at
    rows.sort((a, b) => {
      const ta = a.email_sent_at || a.sent_at || a.created_at || 0;
      const tb = b.email_sent_at || b.sent_at || b.created_at || 0;
      return tb > ta ? 1 : -1;
    });
    res.json({ reports: rows.slice(0, 10) });
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
      searchboost:'searchboost.se', mobelrondellen:'mobelrondellen.se', phvast:'phvast.se',
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
        model: await getModel('sonnet'),
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
      model: await getModel('cheap'),
      max_tokens: 500,
      system: systemPrompt,
      messages: [{ role: 'user', content: message.trim() }]
    });

    const answer = response.content?.[0]?.text || 'Kunde inte generera svar.';

    res.json({
      answer,
      model: await getModel('haiku'),
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
  app.use('/api/portal/login', portalLoginLimiter);
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
// Supermetrics Connector + Enhanced Ads Endpoints
// ═══════════════════════════════════════════════════════════════
const supermetrics = require('./supermetrics-connector');

// GET /api/customers/:id/ads/campaigns — Kampanjnivå-data per plattform
app.get('/api/customers/:id/ads/campaigns', async (req, res) => {
  try {
    const customerId = req.params.id;
    const platform = req.query.platform || null; // optional: google_ads | meta_ads | linkedin_ads | tiktok_ads
    const days = parseInt(req.query.days || '30');

    let data;
    if (platform === 'google_ads') {
      const googleAds = require('./integrations/google-ads');
      data = await googleAds.getGoogleAdsData(customerId, getParam);
    } else if (platform === 'meta_ads') {
      const metaAds = require('./integrations/meta-ads');
      data = await metaAds.getMetaAdsData(customerId, getParam);
    } else {
      // Hämta från alla
      data = await integrations.getAllAdsData(customerId, getParam);
    }

    res.json(data);
  } catch (err) {
    console.error('Ads campaigns error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/ads/roas — ROAS + nyckelmätvärden
app.get('/api/customers/:id/ads/roas', async (req, res) => {
  try {
    const customerId = req.params.id;
    const days = parseInt(req.query.days || '30');
    const { bq, dataset: datasetId } = await getBigQuery();

    const sql = `
      SELECT
        platform,
        SUM(spend) AS total_spend,
        SUM(conversions) AS total_conversions,
        SUM(conversion_value) AS total_revenue,
        SUM(clicks) AS total_clicks,
        SUM(impressions) AS total_impressions,
        SAFE_DIVIDE(SUM(conversion_value), SUM(spend)) AS roas,
        SAFE_DIVIDE(SUM(spend), SUM(conversions)) AS cpa,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) AS ctr
      FROM \`${bq.projectId}.${datasetId}.ads_daily_metrics\`
      WHERE customer_id = @customerId
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
      GROUP BY platform
      ORDER BY total_spend DESC
    `;

    const [rows] = await bq.query({ query: sql, params: { customerId, days } });

    const overall = {
      totalSpend: rows.reduce((s, r) => s + parseFloat(r.total_spend || 0), 0),
      totalRevenue: rows.reduce((s, r) => s + parseFloat(r.total_revenue || 0), 0),
      totalConversions: rows.reduce((s, r) => s + parseInt(r.total_conversions || 0), 0),
      totalClicks: rows.reduce((s, r) => s + parseInt(r.total_clicks || 0), 0),
    };
    overall.roas = overall.totalSpend > 0
      ? parseFloat((overall.totalRevenue / overall.totalSpend).toFixed(2))
      : null;
    overall.cpa = overall.totalConversions > 0
      ? parseFloat((overall.totalSpend / overall.totalConversions).toFixed(2))
      : null;

    res.json({ customerId, days, byPlatform: rows, overall });
  } catch (err) {
    console.error('ROAS error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/ads/trends — Daglig trend senaste N dagar
app.get('/api/customers/:id/ads/trends', async (req, res) => {
  try {
    const customerId = req.params.id;
    const days = parseInt(req.query.days || '30');
    const platform = req.query.platform || null;
    const { bq, dataset: datasetId } = await getBigQuery();

    let sql = `
      SELECT
        date,
        platform,
        SUM(spend) AS spend,
        SUM(clicks) AS clicks,
        SUM(impressions) AS impressions,
        SUM(conversions) AS conversions,
        SUM(conversion_value) AS conversion_value,
        SAFE_DIVIDE(SUM(conversion_value), SUM(spend)) AS roas,
        SAFE_DIVIDE(SUM(spend), NULLIF(SUM(conversions), 0)) AS cpa
      FROM \`${bq.projectId}.${datasetId}.ads_daily_metrics\`
      WHERE customer_id = @customerId
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
    `;
    const params = { customerId, days };
    if (platform) { sql += ' AND platform = @platform'; params.platform = platform; }
    sql += ' GROUP BY date, platform ORDER BY date ASC';

    const [rows] = await bq.query({ query: sql, params });
    const trend = supermetrics.buildROASTrend(rows);

    res.json({ customerId, days, platform, trend, rowCount: rows.length });
  } catch (err) {
    console.error('Ads trends error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/ads/upsell — Uppförsäljningsstatus per kund
app.get('/api/customers/:id/ads/upsell', async (req, res) => {
  try {
    const customerId = req.params.id;
    const status = await supermetrics.getUpsellStatus(customerId);
    res.json(status);
  } catch (err) {
    console.error('Upsell status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/ads/credentials — Spara annonsplattform-credentials
app.post('/api/customers/:id/ads/credentials', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { platform, ...credentials } = req.body;

    if (!platform) return res.status(400).json({ error: 'platform krävs' });
    const result = await supermetrics.saveCredentials(customerId, platform, credentials);
    res.json(result);
  } catch (err) {
    console.error('Ads credentials error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/ads/link — Länka Supermetrics account-ID
app.post('/api/customers/:id/ads/link', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { platform, account_id } = req.body;
    if (!platform || !account_id) return res.status(400).json({ error: 'platform + account_id krävs' });
    const result = await supermetrics.linkAccount(customerId, platform, account_id);
    res.json(result);
  } catch (err) {
    console.error('Link account error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/ads/accounts — Kopplade Supermetrics-konton
app.get('/api/customers/:id/ads/accounts', async (req, res) => {
  try {
    const accounts = await supermetrics.getLinkedAccounts(req.params.id);
    res.json(accounts);
  } catch (err) {
    console.error('Ads accounts error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ads/upsell-overview — Alla kunder: vilka saknar annonskoppling
app.get('/api/ads/upsell-overview', async (req, res) => {
  try {
    const customers = await getWordPressSites();
    const summary = await supermetrics.getAllCustomersAdsSummary(customers);
    const withoutAds = summary.filter(c => c.linkedPlatforms === 0);
    const withAds = summary.filter(c => c.linkedPlatforms > 0);
    res.json({
      total: summary.length,
      withAds: withAds.length,
      withoutAds: withoutAds.length,
      upsellTargets: withoutAds.map(c => ({ customerId: c.customerId, name: c.name })),
      activeCustomers: withAds,
    });
  } catch (err) {
    console.error('Upsell overview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ads/budget-recommendation — Budgetrekommendation för en kund
app.get('/api/ads/budget-recommendation', async (req, res) => {
  try {
    const { industry, monthly_revenue } = req.query;
    const rec = supermetrics.getBudgetRecommendation(
      industry || 'default',
      parseFloat(monthly_revenue || 0)
    );
    res.json(rec);
  } catch (err) {
    console.error('Budget recommendation error:', err.message);
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

// ── Data Pipeline History Endpoints ──
// Hamtar historisk data fran data-collector Lambda

// GSC historik — dagliga sokordspositioner over tid
app.get('/api/customers/:id/gsc-history', async (req, res) => {
  try {
    const customerId = req.params.id;
    const days = parseInt(req.query.days || '30');
    const limit = parseInt(req.query.limit || '5000');
    const query = req.query.query || null; // filtrera pa specifikt sokord

    const { bq, dataset: datasetId } = await getBigQuery();

    // Aggregera per datum + sökord (en rad per unik kombination)
    let sql = `
      SELECT date, query,
        SUM(clicks) as clicks, SUM(impressions) as impressions,
        SAFE_DIVIDE(SUM(clicks), SUM(impressions)) as ctr,
        AVG(position) as position
      FROM \`${bq.projectId}.${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @customerId
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
    `;
    const params = { customerId, days };

    if (query) {
      sql += ` AND query = @queryFilter`;
      params.queryFilter = query;
    }

    sql += ` GROUP BY date, query ORDER BY date DESC, clicks DESC LIMIT @limit`;
    params.limit = limit;

    const [rows] = await bq.query({ query: sql, params });

    // Aggregera dagstotaler
    const dailyTotals = {};
    for (const row of rows) {
      const d = row.date?.value || row.date;
      if (!dailyTotals[d]) dailyTotals[d] = { date: d, clicks: 0, impressions: 0, queries: 0 };
      dailyTotals[d].clicks += row.clicks || 0;
      dailyTotals[d].impressions += row.impressions || 0;
      dailyTotals[d].queries++;
    }

    // Normalize date format in rows (BigQuery returns {value: "..."} for DATE)
    const normalizedRows = rows.map(r => ({
      ...r,
      date: r.date?.value || r.date
    }));

    res.json({
      customer_id: customerId,
      days,
      total_rows: normalizedRows.length,
      daily_totals: Object.values(dailyTotals).sort((a, b) => a.date.localeCompare(b.date)),
      data: normalizedRows.slice(0, 500), // Max 500 rader for portal
      rows: normalizedRows.slice(0, 500), // backward compat
    });
  } catch (err) {
    if (err.message?.includes('Not found: Table')) {
      return res.json({ customer_id: req.params.id, days: 0, total_rows: 0, daily_totals: [], rows: [], message: 'Ingen historisk GSC-data annu. Data-collector kors varje natt.' });
    }
    console.error('GSC history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Ads historik — kampanjdata over tid
app.get('/api/customers/:id/ads-history', async (req, res) => {
  try {
    const customerId = req.params.id;
    const days = parseInt(req.query.days || '30');
    const platform = req.query.platform || null;

    const { bq, dataset: datasetId } = await getBigQuery();

    let sql = `
      SELECT date, platform, campaign_id, campaign_name,
             impressions, clicks, spend, conversions, conversion_value,
             ctr, cpc, cpa, roas, currency
      FROM \`${bq.projectId}.${datasetId}.ads_daily_metrics\`
      WHERE customer_id = @customerId
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
    `;
    const params = { customerId, days };

    if (platform) {
      sql += ` AND platform = @platform`;
      params.platform = platform;
    }

    sql += ` ORDER BY date DESC, spend DESC LIMIT 500`;

    const [rows] = await bq.query({ query: sql, params });

    // Aggregera per plattform per dag
    const dailyByPlatform = {};
    for (const row of rows) {
      const d = row.date?.value || row.date;
      const p = row.platform;
      const key = `${d}_${p}`;
      if (!dailyByPlatform[key]) {
        dailyByPlatform[key] = { date: d, platform: p, spend: 0, clicks: 0, impressions: 0, conversions: 0, conversion_value: 0 };
      }
      dailyByPlatform[key].spend += row.spend || 0;
      dailyByPlatform[key].clicks += row.clicks || 0;
      dailyByPlatform[key].impressions += row.impressions || 0;
      dailyByPlatform[key].conversions += row.conversions || 0;
      dailyByPlatform[key].conversion_value += row.conversion_value || 0;
    }

    const dailyTotals = Object.values(dailyByPlatform)
      .map(d => ({
        ...d,
        spend: parseFloat(d.spend.toFixed(2)),
        roas: d.spend > 0 ? parseFloat((d.conversion_value / d.spend).toFixed(2)) : 0,
        cpa: d.conversions > 0 ? parseFloat((d.spend / d.conversions).toFixed(2)) : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json({
      customer_id: customerId,
      days,
      total_rows: rows.length,
      daily_totals: dailyTotals,
      campaigns: rows.slice(0, 100),
    });
  } catch (err) {
    if (err.message?.includes('Not found: Table')) {
      return res.json({ customer_id: req.params.id, days: 0, total_rows: 0, daily_totals: [], campaigns: [], message: 'Ingen historisk annonsdata annu.' });
    }
    console.error('Ads history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Social media historik — followers, engagement over tid
app.get('/api/customers/:id/social-history', async (req, res) => {
  try {
    const customerId = req.params.id;
    const days = parseInt(req.query.days || '30');
    const platform = req.query.platform || null;

    const { bq, dataset: datasetId } = await getBigQuery();

    let sql = `
      SELECT date, platform, account_name, followers, followers_change,
             posts_published, reach, impressions, engagement,
             likes, comments, shares, saves, clicks,
             video_views, engagement_rate, story_views, reel_plays
      FROM \`${bq.projectId}.${datasetId}.social_daily_metrics\`
      WHERE customer_id = @customerId
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
    `;
    const params = { customerId, days };

    if (platform) {
      sql += ` AND platform = @platform`;
      params.platform = platform;
    }

    sql += ` ORDER BY date DESC LIMIT 500`;

    const [rows] = await bq.query({ query: sql, params });

    // Sammanfatta per plattform
    const platformSummary = {};
    for (const row of rows) {
      const p = row.platform;
      if (!platformSummary[p]) {
        platformSummary[p] = {
          platform: p,
          latest_followers: 0,
          total_engagement: 0,
          total_reach: 0,
          total_impressions: 0,
          total_clicks: 0,
          avg_engagement_rate: 0,
          data_points: 0,
        };
      }
      platformSummary[p].total_engagement += row.engagement || 0;
      platformSummary[p].total_reach += row.reach || 0;
      platformSummary[p].total_impressions += row.impressions || 0;
      platformSummary[p].total_clicks += row.clicks || 0;
      platformSummary[p].avg_engagement_rate += row.engagement_rate || 0;
      platformSummary[p].data_points++;
      // Senaste followers (data sorterad DESC)
      if (!platformSummary[p].latest_followers) {
        platformSummary[p].latest_followers = row.followers || 0;
      }
    }

    // Berakna genomsnitt
    for (const s of Object.values(platformSummary)) {
      if (s.data_points > 0) {
        s.avg_engagement_rate = parseFloat((s.avg_engagement_rate / s.data_points).toFixed(4));
      }
    }

    res.json({
      customer_id: customerId,
      days,
      total_rows: rows.length,
      platform_summary: Object.values(platformSummary),
      daily_data: rows,
    });
  } catch (err) {
    if (err.message?.includes('Not found: Table')) {
      return res.json({ customer_id: req.params.id, days: 0, total_rows: 0, platform_summary: [], daily_data: [], message: 'Ingen historisk social data annu.' });
    }
    console.error('Social history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Data collection status — senaste korningarna
app.get('/api/data-collection/status', async (req, res) => {
  try {
    const { bq, dataset: datasetId } = await getBigQuery();

    const [rows] = await bq.query({
      query: `
        SELECT customer_id, source, status, records_collected, duration_ms,
               date_range_start, date_range_end, error_message, collected_at
        FROM \`${bq.projectId}.${datasetId}.data_collection_log\`
        ORDER BY collected_at DESC
        LIMIT 100
      `,
    });

    // Gruppera per kund + kalla
    const latest = {};
    for (const row of rows) {
      const key = `${row.customer_id}_${row.source}`;
      if (!latest[key]) latest[key] = row;
    }

    res.json({
      total_logs: rows.length,
      latest_per_source: Object.values(latest),
      all_logs: rows,
    });
  } catch (err) {
    if (err.message?.includes('Not found: Table')) {
      return res.json({ total_logs: 0, latest_per_source: [], all_logs: [], message: 'Data-collector har inte korts annu.' });
    }
    console.error('Data collection status error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Prospect Analysis (Deep SEO analysis for prospecting) ──

// POST /api/prospect-analysis — Run deep analysis on a prospect's website
app.post('/api/prospect-analysis', async (req, res) => {
  try {
    const { url, company_name, industry, contact_person, price_tier } = req.body;
    if (!url) return res.status(400).json({ error: 'url krävs (t.ex. https://example.se)' });

    let siteUrl = url.trim();
    if (!siteUrl.startsWith('http')) siteUrl = 'https://' + siteUrl;
    const parsedUrl = new URL(siteUrl);
    const cleanDomain = parsedUrl.hostname.replace(/^www\./, '');
    const cleanUrl = parsedUrl.origin;
    const companyName = company_name || cleanDomain;

    console.log(`[Prospect] Starting analysis: ${companyName} (${cleanUrl})`);

    // 1. WordPress crawl — identify SEO problems
    let crawlResult = { platform: 'unknown', totalPages: 0, totalPosts: 0, pages: [], issues: { critical: [], structural: [], content: [] }, summary: {} };
    try {
      const [wpPages, wpPosts] = await Promise.all([
        axios.get(`${cleanUrl}/wp-json/wp/v2/pages?per_page=100&status=publish`, { timeout: 12000 }),
        axios.get(`${cleanUrl}/wp-json/wp/v2/posts?per_page=100&status=publish`, { timeout: 12000 })
      ]);
      crawlResult.platform = 'wordpress';
      crawlResult.totalPages = wpPages.data.length;
      crawlResult.totalPosts = wpPosts.data.length;

      const allContent = [
        ...wpPages.data.map(p => ({ ...p, type: 'page' })),
        ...wpPosts.data.map(p => ({ ...p, type: 'post' }))
      ];

      let missingH1 = 0, shortTitle = 0, longTitle = 0, thinContent = 0, missingAltText = 0, noInternalLinks = 0, noSchema = 0;
      const titleCounts = {};

      for (const item of allContent) {
        const title = item.title?.rendered || '';
        const content = item.content?.rendered || '';
        const text = content.replace(/<[^>]+>/g, '');
        const pageUrl = item.link || '';
        const cleanTitle = title.toLowerCase().trim();
        titleCounts[cleanTitle] = (titleCounts[cleanTitle] || 0) + 1;
        const pageIssues = [];
        if (!title || title.length < 20) { pageIssues.push('short_title'); shortTitle++; }
        if (title && title.length > 60) { pageIssues.push('long_title'); longTitle++; }
        if (!content.match(/<h1/i)) { missingH1++; }
        if (text.length < 300) { pageIssues.push('thin_content'); thinContent++; }
        const imgsNoAlt = (content.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
        if (imgsNoAlt > 0) { missingAltText += imgsNoAlt; }
        const internalLinks = (content.match(new RegExp(`<a[^>]*href=["']${cleanUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')) || []).length;
        if (internalLinks === 0) { noInternalLinks++; }
        if (!content.includes('application/ld+json')) { noSchema++; }

        crawlResult.pages.push({
          title, url: pageUrl, type: item.type,
          wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
          issues: pageIssues
        });
      }

      let duplicateTitles = 0;
      for (const [, count] of Object.entries(titleCounts)) { if (count > 1) duplicateTitles += count; }

      // Meta description check (sample 10 pages, parallel)
      const pagesToCheck = [cleanUrl, ...allContent.slice(0, 9).map(p => p.link).filter(Boolean)];
      const metaChecks = await Promise.all(
        pagesToCheck.map(async (pageUrl) => {
          try {
            const { data: html } = await axios.get(pageUrl, { timeout: 5000, maxRedirects: 2 });
            const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
            return (!metaMatch || metaMatch[1].length < 10) ? 1 : 0;
          } catch (e) { return 0; }
        })
      );
      const missingDescription = metaChecks.reduce((sum, v) => sum + v, 0);
      const checkRatio = missingDescription / Math.max(pagesToCheck.length, 1);
      const estimatedMissingDesc = Math.round(checkRatio * allContent.length);

      crawlResult.summary = { totalContent: allContent.length, missingDescription: estimatedMissingDesc, missingH1, shortTitle, longTitle, duplicateTitles, thinContent, missingAltText, noInternalLinks, noSchema };
      if (estimatedMissingDesc > 0) crawlResult.issues.critical.push({ type: 'Meta description saknas', count: estimatedMissingDesc, impact: 'Google visar slumpmässigt utdrag' });
      if (missingH1 > 0) crawlResult.issues.critical.push({ type: 'H1-tagg saknas', count: missingH1, impact: 'Google förstår inte sidans ämne' });
      if (shortTitle > 0) crawlResult.issues.structural.push({ type: 'Title för kort', count: shortTitle, impact: 'Missar sökord i title' });
      if (longTitle > 0) crawlResult.issues.structural.push({ type: 'Title för lång', count: longTitle, impact: 'Klipps i sökresultaten' });
      if (duplicateTitles > 0) crawlResult.issues.structural.push({ type: 'Duplicerade titlar', count: duplicateTitles, impact: 'Google vet inte vilken sida som ska rankas' });
      if (thinContent > 0) crawlResult.issues.content.push({ type: 'Tunt innehåll', count: thinContent, impact: 'Google ignorerar sidor med lite text' });
      if (missingAltText > 0) crawlResult.issues.critical.push({ type: 'Alt-text saknas', count: missingAltText, impact: 'Missar bildsök-trafik' });
      if (noInternalLinks > 0) crawlResult.issues.structural.push({ type: 'Inga interna länkar', count: noInternalLinks, impact: 'Föräldralösa sidor' });
    } catch (wpError) {
      // Not WordPress — fallback to HTML crawl
      crawlResult.platform = 'non-wordpress';
      try {
        const { data: html } = await axios.get(cleanUrl, { timeout: 15000, maxRedirects: 3 });
        const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
        const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
        const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
        const imgsNoAlt = (html.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
        crawlResult.summary = { totalContent: 'Okänt', pageTitle: titleMatch ? titleMatch[1] : 'SAKNAS', metaDescription: metaDescMatch ? metaDescMatch[1] : 'SAKNAS', h1: h1Match ? h1Match[1] : 'SAKNAS', imagesNoAlt: imgsNoAlt, hasSchema: html.includes('application/ld+json') };
        if (!metaDescMatch) crawlResult.issues.critical.push({ type: 'Meta description saknas', count: 'Startsidan', impact: 'Google visar slumpmässigt utdrag' });
        if (!h1Match) crawlResult.issues.critical.push({ type: 'H1-tagg saknas', count: 'Startsidan', impact: 'Google förstår inte sidans ämne' });
        if (imgsNoAlt > 0) crawlResult.issues.critical.push({ type: 'Alt-text saknas', count: imgsNoAlt, impact: 'Missar bildsök-trafik' });
        if (!html.includes('application/ld+json')) crawlResult.issues.structural.push({ type: 'Schema markup saknas', count: 'Hela sajten', impact: 'Inga rikare sökresultat' });
      } catch (htmlError) {
        crawlResult.issues.critical.push({ type: 'Sajten kunde inte nås', count: 1, impact: 'Kontrollera URL' });
      }
    }

    console.log(`[Prospect] Crawl done: ${crawlResult.platform}, ${crawlResult.totalPages + crawlResult.totalPosts} sidor`);

    // 2. PageSpeed Insights
    let pageSpeed = null;
    try {
      pageSpeed = await fetchPageSpeed(cleanUrl);
      console.log(`[Prospect] PageSpeed: mobile=${pageSpeed?.mobile?.score}, desktop=${pageSpeed?.desktop?.score}`);
    } catch (e) {
      console.log(`[Prospect] PageSpeed failed: ${e.message}`);
    }

    // 3. Google Autocomplete suggestions
    const seeds = [companyName.toLowerCase()];
    if (industry) seeds.push(industry.toLowerCase());
    if (crawlResult.pages?.length > 0) {
      crawlResult.pages.slice(0, 5).forEach(p => {
        const words = (p.title || '').split(/[\s|—–-]+/).filter(w => w.length > 3);
        seeds.push(...words.slice(0, 2));
      });
    }
    const uniqueSeeds = [...new Set(seeds)].slice(0, 3); // max 3 seeds, parallel
    const autocompleteSuggestions = [];
    await Promise.all(uniqueSeeds.map(async (seed) => {
      try {
        const acRes = await axios.get('https://www.google.com/complete/search', {
          params: { client: 'chrome', q: seed, hl: 'sv', gl: 'se' },
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SearchboostBot/1.0)' },
          timeout: 4000
        });
        for (const s of (acRes.data[1] || [])) {
          if (s !== seed && !autocompleteSuggestions.includes(s)) autocompleteSuggestions.push(s);
        }
      } catch (e) { /* skip */ }
    }));
    console.log(`[Prospect] Autocomplete: ${autocompleteSuggestions.length} suggestions`);

    // 4. AI analysis + presentation
    const client = await getClaude();
    const totalIssues = crawlResult.issues.critical.length + crawlResult.issues.structural.length + crawlResult.issues.content.length;
    const crawlSummary = crawlResult.platform === 'wordpress'
      ? `WordPress-sajt med ${crawlResult.summary.totalContent} sidor.\nKritiska: ${crawlResult.issues.critical.map(i => `${i.type}: ${i.count}`).join(', ') || 'Inga'}\nStrukturella: ${crawlResult.issues.structural.map(i => `${i.type}: ${i.count}`).join(', ') || 'Inga'}\nInnehåll: ${crawlResult.issues.content.map(i => `${i.type}: ${i.count}`).join(', ') || 'Inga'}`
      : `Ej WordPress (${crawlResult.platform}). Begränsad analys.`;
    const psiSummary = `Desktop: ${pageSpeed?.desktop?.score ?? 'N/A'}/100, Mobil: ${pageSpeed?.mobile?.score ?? 'N/A'}/100`;

    const pricing = {
      small: { monthly: '5 000', total3m: '15 000' },
      medium: { monthly: '8 000', total3m: '24 000' },
      large: { monthly: '12 000', total3m: '36 000' },
      enterprise: { monthly: '15 000', total3m: '45 000' }
    }[price_tier || 'medium'];

    const aiResponse = await client.messages.create({
      model: await getModel('haiku'),
      max_tokens: 2500,
      messages: [{
        role: 'user',
        content: `Du är SEO-expert på Searchboost.se. Generera en SEO-analys och säljpresentation baserat på data.

FÖRETAG: ${companyName}
URL: ${cleanUrl}
BRANSCH: ${industry || 'Okänd'}

CRAWL-DATA:
${crawlSummary}

PAGESPEED:
${psiSummary}

AUTOCOMPLETE-FÖRSLAG:
${autocompleteSuggestions.slice(0, 15).join(', ')}

PRISMODELL: ${pricing.monthly} kr/mån (${pricing.total3m} kr totalt 3 mån)

Svara i JSON:
{
  "analysis_md": "## SEO-analys: {företag}\\n\\nSammanfattning (2-3 meningar)\\n\\n### Identifierade problem\\n| Problem | Antal | Påverkan |\\n...\\n\\n### Prestanda\\n| Mått | Värde |\\n...\\n\\nIngen emoji. Professionell ton.",
  "presentation_md": "# {företag} — SEO-paket 3 månader\\n## Searchboost | Offert 2026\\n---\\n## Nuläge\\n...\\n---\\n## Problem\\n...\\n---\\n## 3-månaders plan\\n### Månad 1\\n...\\n### Månad 2\\n...\\n### Månad 3\\n...\\n---\\n## Prissättning\\n${pricing.monthly} kr/mån\\n---\\n## Nästa steg\\n...",
  "phone_pitch": "3-4 meningar säljaren kan läsa i telefon. Vad som är bra + vad som kostar dem trafik + vad vi gör.",
  "suggested_keywords": ["sökord1", "sökord2", "...max 10 st"]
}`
      }]
    });

    const aiResult = parseClaudeJSON(aiResponse.content[0].text);
    console.log(`[Prospect] AI done: analysis=${aiResult.analysis_md?.length || 0} chars, presentation=${aiResult.presentation_md?.length || 0} chars`);

    // 5. Calculate score + cost
    const mobileScore = pageSpeed?.mobile?.score || 0;
    const desktopScore = pageSpeed?.desktop?.score || 0;
    const seoScore = Math.max(0, 100 - (crawlResult.issues.critical.length * 15 + crawlResult.issues.structural.length * 8 + crawlResult.issues.content.length * 5));
    const costEstimate = calculateCostEstimate({ score: seoScore, issues: crawlResult.issues.critical.concat(crawlResult.issues.structural, crawlResult.issues.content).map(i => ({ severity: crawlResult.issues.critical.includes(i) ? 'high' : 'medium', description: i.type })) });

    // 6. Save to BigQuery
    const analysisId = `pa_${Date.now()}_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 20)}`;
    const { bq, dataset } = await getBigQuery();

    // Ensure table exists
    try { await bq.dataset(dataset).table('prospect_analyses').get(); } catch (e) {
      if (e.code === 404) {
        await bq.query({ query: `CREATE TABLE \`${dataset}.prospect_analyses\` (
          id STRING, company_name STRING, url STRING, industry STRING, contact_person STRING,
          analysis_date DATE, platform STRING, total_pages INT64,
          critical_issues INT64, structural_issues INT64, content_issues INT64,
          mobile_score INT64, desktop_score INT64, seo_score INT64,
          price_tier STRING, monthly_cost INT64,
          phone_pitch STRING, analysis_md STRING, presentation_md STRING,
          suggested_keywords STRING, autocomplete STRING,
          raw_data STRING, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
        )` });
      }
    }

    await bq.query({
      query: `INSERT INTO \`${dataset}.prospect_analyses\`
        (id, company_name, url, industry, contact_person, analysis_date,
         platform, total_pages, critical_issues, structural_issues, content_issues,
         mobile_score, desktop_score, seo_score, price_tier, monthly_cost,
         phone_pitch, analysis_md, presentation_md, suggested_keywords, autocomplete, raw_data)
        VALUES (@id, @company_name, @url, @industry, @contact_person, CURRENT_DATE(),
                @platform, @total_pages, @critical, @structural, @content,
                @mobile, @desktop, @seo, @price_tier, @monthly_cost,
                @phone_pitch, @analysis_md, @presentation_md, @keywords, @autocomplete, @raw_data)`,
      params: {
        id: analysisId, company_name: companyName, url: cleanUrl, industry: industry || '',
        contact_person: contact_person || '', platform: crawlResult.platform,
        total_pages: crawlResult.totalPages + crawlResult.totalPosts,
        critical: crawlResult.issues.critical.length, structural: crawlResult.issues.structural.length,
        content: crawlResult.issues.content.length,
        mobile: mobileScore, desktop: desktopScore, seo: seoScore,
        price_tier: price_tier || 'medium', monthly_cost: costEstimate.amount,
        phone_pitch: aiResult.phone_pitch || '', analysis_md: aiResult.analysis_md || '',
        presentation_md: aiResult.presentation_md || '',
        keywords: JSON.stringify(aiResult.suggested_keywords || []),
        autocomplete: JSON.stringify(autocompleteSuggestions.slice(0, 20)),
        raw_data: JSON.stringify({ crawlSummary: crawlResult.summary, pageSpeed, issueDetails: crawlResult.issues })
      }
    });

    console.log(`[Prospect] Saved: ${analysisId}`);

    res.json({
      success: true,
      id: analysisId,
      company_name: companyName,
      url: cleanUrl,
      platform: crawlResult.platform,
      total_pages: crawlResult.totalPages + crawlResult.totalPosts,
      scores: { mobile: mobileScore, desktop: desktopScore, seo: seoScore },
      issues: {
        critical: crawlResult.issues.critical,
        structural: crawlResult.issues.structural,
        content: crawlResult.issues.content,
        total: totalIssues
      },
      cost_estimate: costEstimate,
      phone_pitch: aiResult.phone_pitch,
      suggested_keywords: aiResult.suggested_keywords || [],
      autocomplete: autocompleteSuggestions.slice(0, 20),
      analysis_md: aiResult.analysis_md,
      presentation_md: aiResult.presentation_md,
      page_speed: pageSpeed
    });
  } catch (err) {
    console.error('[Prospect] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prospect-analyses — List all saved prospect analyses
app.get('/api/prospect-analyses', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    try { await bq.dataset(dataset).table('prospect_analyses').get(); } catch (e) {
      if (e.code === 404) return res.json({ analyses: [], total: 0 });
      throw e;
    }
    const [rows] = await bq.query({
      query: `SELECT id, company_name, url, industry, analysis_date, platform, total_pages,
              critical_issues, structural_issues, content_issues,
              mobile_score, desktop_score, seo_score, price_tier, monthly_cost,
              phone_pitch, suggested_keywords, created_at
       FROM \`${dataset}.prospect_analyses\`
       ORDER BY created_at DESC
       LIMIT 100`
    });
    res.json({ analyses: rows, total: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/prospect-analyses/:id — Get full details for one analysis
app.get('/api/prospect-analyses/:id', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.prospect_analyses\` WHERE id = @id LIMIT 1`,
      params: { id: req.params.id }
    });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Analys ej hittad' });
    const row = rows[0];
    try { row.suggested_keywords = JSON.parse(row.suggested_keywords); } catch (e) {}
    try { row.autocomplete = JSON.parse(row.autocomplete); } catch (e) {}
    try { row.raw_data = JSON.parse(row.raw_data); } catch (e) {}
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/prospect-analyses/:id — Delete an analysis
app.delete('/api/prospect-analyses/:id', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    await bq.query({
      query: `DELETE FROM \`${dataset}.prospect_analyses\` WHERE id = @id`,
      params: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/prospect-analyses/:id/to-pipeline — Convert analysis to pipeline prospect
app.post('/api/prospect-analyses/:id/to-pipeline', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.prospect_analyses\` WHERE id = @id LIMIT 1`,
      params: { id: req.params.id }
    });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Analys ej hittad' });
    const analysis = rows[0];
    const cleanDomain = new URL(analysis.url).hostname.replace(/^www\./, '');
    const customerId = cleanDomain.replace(/\./g, '-');
    const now = new Date().toISOString();

    await ensurePipelineTables();
    const [existing] = await bq.query({
      query: `SELECT customer_id FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @cid LIMIT 1`,
      params: { cid: customerId }
    });

    if (!existing || existing.length === 0) {
      await bqInsert('customer_pipeline', {
        customer_id: customerId, company_name: analysis.company_name,
        contact_person: analysis.contact_person || null, contact_email: null,
        website_url: analysis.url + '/', stage: 'analys', stage_updated_at: now,
        prospect_notes: analysis.phone_pitch || null, initial_traffic_trend: null,
        service_type: 'seo', monthly_amount_sek: analysis.monthly_cost || null,
        contract_start_date: null, contract_end_date: null, contract_status: null,
        audit_meeting_date: null, startup_meeting_date: null,
        created_at: now, updated_at: now, trello_card_id: null,
        assigned_to: 'mikael', assigned_to_name: 'Mikael Larsson'
      });
    }

    res.json({ success: true, customer_id: customerId, stage: 'analys' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════
// SECURITY MONITORING ENDPOINTS
// ══════════════════════════════════════════════════════

async function sendSlackSecurity(webhookUrl, severity, customerName, details, siteUrl) {
  if (!webhookUrl) return;
  const colors = { critical: '#ef4444', warning: '#eab308', resolved: '#22c55e', info: '#00d4ff' };
  const payload = {
    attachments: [{
      color: colors[severity] || colors.info,
      blocks: [
        { type: 'section', text: { type: 'mrkdwn', text: `*${severity.toUpperCase()} — ${customerName}*\n${details}` } },
        { type: 'context', elements: [{ type: 'mrkdwn', text: `${siteUrl} | ${new Date().toISOString()}` }] }
      ]
    }]
  };
  try {
    await axios.post(webhookUrl, payload, { timeout: 5000 });
  } catch (e) { /* fire-and-forget */ }
}

// POST /api/security/event — ta emot event från WP-plugin
app.post('/api/security/event', async (req, res) => {
  try {
    const { customer_id, site_url, event_type, severity, details } = req.body;
    if (!customer_id || !event_type) return res.status(400).json({ error: 'customer_id och event_type krävs' });

    const { bq, dataset } = await getBigQuery();

    // Deduplicering — finns redan open event av samma typ?
    const [existing] = await bq.query({
      query: `SELECT event_id FROM \`${dataset}.security_events\`
              WHERE customer_id = @cid AND event_type = @type AND status = 'open' LIMIT 1`,
      params: { cid: customer_id, type: event_type }
    }).catch(() => [[]]);

    if (existing && existing.length > 0) {
      return res.json({ success: true, deduplicated: true });
    }

    const eventId = require('crypto').randomUUID();
    const now = new Date().toISOString();

    await bq.query({
      query: `INSERT INTO \`${dataset}.security_events\`
              (event_id, customer_id, site_url, event_type, severity, details, detected_at, resolved_at, status, notified_slack)
              VALUES (@eid, @cid, @url, @type, @sev, @det, @now, NULL, 'open', @notified)`,
      params: {
        eid: eventId, cid: customer_id, url: site_url || '', type: event_type,
        sev: severity || 'info', det: details || '', now, notified: false
      }
    });

    // Skicka Slack vid critical/warning
    if (severity === 'critical' || severity === 'warning') {
      const slackWebhook = await getParamSafe('/seo-mcp/slack/webhook-url');
      if (slackWebhook) {
        // Hämta företagsnamn
        const [custRows] = await bq.query({
          query: `SELECT company_name FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @cid LIMIT 1`,
          params: { cid: customer_id }
        }).catch(() => [[]]);
        const companyName = (custRows && custRows.length > 0) ? custRows[0].company_name : customer_id;
        await sendSlackSecurity(slackWebhook, severity, companyName, details || '', site_url || '');
        // Markera som notifierad
        await bq.query({
          query: `UPDATE \`${dataset}.security_events\` SET notified_slack = true WHERE event_id = @eid`,
          params: { eid: eventId }
        }).catch(() => {});
      }
    }

    res.json({ success: true, event_id: eventId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/security — hämta alla events + summary per kund
app.get('/api/security', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [events] = await bq.query({
      query: `SELECT se.event_id, se.customer_id, se.site_url, se.event_type, se.severity,
                     se.details, se.detected_at, se.resolved_at, se.status, se.notified_slack,
                     cp.company_name
              FROM \`${dataset}.security_events\` se
              LEFT JOIN \`${dataset}.customer_pipeline\` cp ON se.customer_id = cp.customer_id
              ORDER BY se.detected_at DESC
              LIMIT 200`
    }).catch(() => [[]]);

    // Bygg summary per kund
    const summaryMap = {};
    for (const e of events) {
      if (!summaryMap[e.customer_id]) {
        summaryMap[e.customer_id] = {
          customer_id: e.customer_id,
          company_name: e.company_name || e.customer_id,
          open_critical: 0, open_warning: 0, open_info: 0, total_open: 0
        };
      }
      if (e.status === 'open') {
        summaryMap[e.customer_id].total_open++;
        if (e.severity === 'critical') summaryMap[e.customer_id].open_critical++;
        else if (e.severity === 'warning') summaryMap[e.customer_id].open_warning++;
        else summaryMap[e.customer_id].open_info++;
      }
    }

    res.json({ events, summary: Object.values(summaryMap) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/security/:eventId/resolve — markera event som löst
app.post('/api/security/:eventId/resolve', async (req, res) => {
  try {
    const { eventId } = req.params;
    const now = new Date().toISOString();
    const { bq, dataset } = await getBigQuery();

    // Hämta event-info för Slack-notis
    const [rows] = await bq.query({
      query: `SELECT se.customer_id, se.event_type, se.details, se.site_url, cp.company_name
              FROM \`${dataset}.security_events\` se
              LEFT JOIN \`${dataset}.customer_pipeline\` cp ON se.customer_id = cp.customer_id
              WHERE se.event_id = @eid LIMIT 1`,
      params: { eid: eventId }
    }).catch(() => [[]]);

    await bq.query({
      query: `UPDATE \`${dataset}.security_events\`
              SET status = 'resolved', resolved_at = @now
              WHERE event_id = @eid`,
      params: { eid: eventId, now }
    });

    // Grön Slack-notis om vi har webhook
    if (rows && rows.length > 0) {
      const e = rows[0];
      const slackWebhook = await getParamSafe('/seo-mcp/slack/webhook-url');
      if (slackWebhook) {
        await sendSlackSecurity(slackWebhook, 'resolved', e.company_name || e.customer_id,
          `Åtgärdat: ${e.details || e.event_type}`, e.site_url || '');
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Content Blueprint API ──────────────────────────────────────────────────

// GET /api/content-blueprints — lista alla blueprints (senaste per kund)
app.get('/api/content-blueprints', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const month = req.query.month || null; // ?month=2026-03

    let query;
    if (month) {
      query = `
        SELECT blueprint_id, customer_id, month, company_name, theme,
               articles, quick_wins, monthly_goal, created_at, status
        FROM \`${dataset}.content_blueprints\`
        WHERE month = @month
        ORDER BY company_name ASC
      `;
    } else {
      // Senaste blueprint per kund
      query = `
        SELECT b.blueprint_id, b.customer_id, b.month, b.company_name, b.theme,
               b.articles, b.quick_wins, b.monthly_goal, b.created_at, b.status
        FROM \`${dataset}.content_blueprints\` b
        INNER JOIN (
          SELECT customer_id, MAX(created_at) as latest
          FROM \`${dataset}.content_blueprints\`
          GROUP BY customer_id
        ) latest ON b.customer_id = latest.customer_id AND b.created_at = latest.latest
        ORDER BY b.company_name ASC
      `;
    }

    const params = month ? { month } : {};
    const [rows] = await bq.query({ query, params });

    // Deserialisera JSON-fält
    const blueprints = rows.map(r => ({
      ...r,
      articles: (() => { try { return JSON.parse(r.articles || '[]'); } catch { return []; } })(),
      quick_wins: (() => { try { return JSON.parse(r.quick_wins || '[]'); } catch { return []; } })(),
      created_at: r.created_at?.value || r.created_at
    }));

    res.json({ blueprints, total: blueprints.length });
  } catch (err) {
    if (err.message.includes('Not found') || err.message.includes('notFound')) {
      return res.json({ blueprints: [], total: 0, note: 'content_blueprints-tabellen finns inte ännu' });
    }
    console.error('content-blueprints error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/content-blueprints/:customer_id — alla blueprints för en kund
app.get('/api/content-blueprints/:customer_id', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const { customer_id } = req.params;

    const [rows] = await bq.query({
      query: `
        SELECT blueprint_id, customer_id, month, company_name, theme,
               articles, quick_wins, monthly_goal, created_at, status
        FROM \`${dataset}.content_blueprints\`
        WHERE customer_id = @cid
        ORDER BY created_at DESC
        LIMIT 12
      `,
      params: { cid: customer_id }
    });

    const blueprints = rows.map(r => ({
      ...r,
      articles: (() => { try { return JSON.parse(r.articles || '[]'); } catch { return []; } })(),
      quick_wins: (() => { try { return JSON.parse(r.quick_wins || '[]'); } catch { return []; } })(),
      created_at: r.created_at?.value || r.created_at
    }));

    res.json({ blueprints, customer_id });
  } catch (err) {
    if (err.message.includes('Not found') || err.message.includes('notFound')) {
      return res.json({ blueprints: [], customer_id: req.params.customer_id });
    }
    res.status(500).json({ error: err.message });
  }
});

// POST /api/content-blueprints/trigger — trigga Lambda manuellt för en kund
app.post('/api/content-blueprints/trigger', async (req, res) => {
  try {
    const { customer_id } = req.body;
    if (!customer_id) return res.status(400).json({ error: 'customer_id krävs' });

    const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
    const lambda = new LambdaClient({ region: REGION });

    const payload = JSON.stringify({ customer_id, force: true });
    const result = await lambda.send(new InvokeCommand({
      FunctionName: 'seo-content-blueprint-generator',
      InvocationType: 'Event', // asynkront
      Payload: Buffer.from(payload)
    }));

    res.json({ success: true, statusCode: result.StatusCode, customer_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/content-blueprint/months — lista tillgängliga månader
app.get('/api/content-blueprint/months', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `
        SELECT DISTINCT month
        FROM \`${dataset}.content_blueprints\`
        ORDER BY month DESC
        LIMIT 24
      `
    });
    res.json({ months: rows.map(r => r.month) });
  } catch (err) {
    res.json({ months: [] });
  }
});

// ── Global felhanterare ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  slackAlert(`Serverfel på \`${req.method} ${req.path}\`: ${err.message}`, 'critical');
  res.status(500).json({ error: 'Internt serverfel' });
});

// ── Trello Autosync — var 3:e timme ──
// Kollar vad som hänt sedan senaste körning och lägger kommentar på kundkortens Trello-kort.
// Täcker alla åtgärder: optimizer, manuellt arbete, keyword-researcher, work_queue.
let _trelloLastSync = null;

async function trelloAutoSync() {
  const syncStart = new Date();
  const lookbackMs = 3 * 60 * 60 * 1000; // 3 timmar
  const since = _trelloLastSync
    ? new Date(_trelloLastSync).toISOString()
    : new Date(Date.now() - lookbackMs).toISOString();

  console.log(`[Trello AutoSync] Kollar aktivitet sedan ${since}`);

  try {
    const { bq, dataset } = await getBigQuery();
    const boardId = await getParam('/seo-mcp/trello/board-id');

    // Hämta alla kort på boardet (namn + id + beskrivning)
    const allCards = await trelloApi('GET', `/boards/${boardId}/cards`, {
      fields: 'name,desc,id'
    });

    // Hämta automatiska optimeringar sedan senaste sync (ej manuella)
    const [optRows] = await bq.query({
      query: `
        SELECT customer_id, optimization_type, page_url, impact_estimate, timestamp
        FROM \`${dataset}.seo_optimization_log\`
        WHERE TIMESTAMP(timestamp) >= TIMESTAMP(@since)
          AND NOT STARTS_WITH(COALESCE(claude_reasoning, ''), '[Manuellt')
        ORDER BY customer_id, timestamp
      `,
      params: { since }
    });

    // Hämta manuellt arbete sedan senaste sync
    // Manuella poster identifieras på att claude_reasoning börjar med "[Manuellt"
    const [manualRows] = await bq.query({
      query: `
        SELECT customer_id, optimization_type, claude_reasoning, timestamp
        FROM \`${dataset}.seo_optimization_log\`
        WHERE STARTS_WITH(claude_reasoning, '[Manuellt')
          AND TIMESTAMP(timestamp) >= TIMESTAMP(@since)
        ORDER BY customer_id, timestamp
      `,
      params: { since }
    }).catch(() => [[]]);

    // Grupera per kund
    const byCustomer = {};
    for (const row of optRows) {
      if (!byCustomer[row.customer_id]) byCustomer[row.customer_id] = { opts: [], manual: [] };
      byCustomer[row.customer_id].opts.push(row);
    }
    for (const row of (manualRows || [])) {
      if (!byCustomer[row.customer_id]) byCustomer[row.customer_id] = { opts: [], manual: [] };
      byCustomer[row.customer_id].manual.push(row);
    }

    let synced = 0;
    for (const [customerId, data] of Object.entries(byCustomer)) {
      if (data.opts.length === 0 && data.manual.length === 0) continue;

      // Hitta Trello-kortet för kunden (matchar på kortnamn)
      const card = allCards.find(c => {
        const name = c.name.toLowerCase();
        return name.includes(customerId.toLowerCase()) ||
               name.includes(customerId.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase());
      });
      if (!card) continue;

      // Bygg kommentarstext
      const lines = [`**Autosync ${new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Stockholm' })}**`];

      if (data.opts.length > 0) {
        lines.push(`\n**Automatiska optimeringar (${data.opts.length} st):**`);
        for (const o of data.opts.slice(0, 10)) {
          const ts = new Date(o.timestamp).toLocaleTimeString('sv-SE', { timeZone: 'Europe/Stockholm', hour: '2-digit', minute: '2-digit' });
          lines.push(`- ${ts} ${o.optimization_type}: ${(o.page_url || '').split('/').pop() || o.page_url}`);
        }
        if (data.opts.length > 10) lines.push(`- ...och ${data.opts.length - 10} till`);
      }

      if (data.manual.length > 0) {
        lines.push(`\n**Manuellt arbete (${data.manual.length} st):**`);
        for (const m of data.manual.slice(0, 5)) {
          const desc = (m.claude_reasoning || '').replace(/^\[Manuellt[^\]]*\]\s*/, '').substring(0, 80);
          lines.push(`- ${m.optimization_type || 'arbete'}: ${desc}`);
        }
      }

      const commentText = lines.join('\n');

      await trelloApi('POST', `/cards/${card.id}/actions/comments`, {
        text: commentText
      });
      synced++;
    }

    _trelloLastSync = syncStart.toISOString();
    console.log(`[Trello AutoSync] Klar — uppdaterade ${synced} kundkort`);
  } catch (err) {
    console.error('[Trello AutoSync] Fel:', err.message);
  }
}

// Starta autosync var 3:e timme (10800000ms)
// Vänta 2 min efter serverstart innan första körning
setTimeout(() => {
  trelloAutoSync();
  setInterval(trelloAutoSync, 3 * 60 * 60 * 1000);
}, 2 * 60 * 1000);

// ── Länkverifiering — varje måndag kl 07:00 CET ──
// Kör en gång/timme och kontrollerar om det är måndag 07:xx CET
let _linkVerifyLastRun = null;
setInterval(async () => {
  const now = new Date();
  const cetOffset = 60; // CET = UTC+1 (vintertid), CEST = UTC+2 — enkel approximation
  const cetHour = (now.getUTCHours() + 1) % 24;
  const cetDay = now.getUTCDay(); // 0=sön, 1=mån
  const dateKey = now.toISOString().slice(0, 10);
  if (cetDay === 1 && cetHour === 7 && _linkVerifyLastRun !== dateKey) {
    _linkVerifyLastRun = dateKey;
    console.log('[Link Verification Cron] Startar veckovis verifiering...');
    try {
      await runLinkVerification();
    } catch (e) {
      console.error('[Link Verification Cron] Fel:', e.message);
    }
  }
}, 60 * 60 * 1000); // körs varje timme

// ══════════════════════════════════════════
// LÄNKBYGGE — Link Prospects

// GET /api/customers/:id/link-prospects — hämta alla länkprospekt för kund
app.get('/api/customers/:id/link-prospects', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const customerId = req.params.id;
    const [rows] = await bq.query({
      query: `
        SELECT prospect_id, url, domain_name, link_type, status, notes,
               created_at, updated_at
        FROM \`${dataset}.link_prospects\`
        WHERE customer_id = @customer_id
        ORDER BY
          CASE status
            WHEN 'acquired' THEN 1
            WHEN 'pending' THEN 2
            WHEN 'contacted' THEN 3
            WHEN 'discovered' THEN 4
            WHEN 'rejected' THEN 5
            ELSE 6
          END,
          created_at DESC
      `,
      params: { customer_id: customerId }
    });
    res.json({ prospects: rows });
  } catch (e) {
    console.error('GET link-prospects error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/customers/:id/link-prospects — lägg till nytt länkprospekt
app.post('/api/customers/:id/link-prospects', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const customerId = req.params.id;
    const { url, link_type, notes } = req.body;
    if (!url) return res.status(400).json({ error: 'url krävs' });

    const { v4: uuidv4 } = require('crypto');
    const prospectId = require('crypto').randomUUID ? require('crypto').randomUUID() : `lp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const domainName = url.replace(/https?:\/\/(www\.)?/, '').split('/')[0];
    const now = new Date().toISOString();

    await bq.dataset(dataset).table('link_prospects').insert([{
      customer_id: customerId,
      prospect_id: prospectId,
      url,
      domain_name: domainName,
      link_type: link_type || 'directory',
      status: 'discovered',
      notes: notes || '',
      created_at: { value: now },
      updated_at: { value: now }
    }]);

    res.json({ success: true, prospect_id: prospectId, domain_name: domainName });
  } catch (e) {
    console.error('POST link-prospects error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/customers/:id/link-prospects/:prospect_id — uppdatera status/notes
app.patch('/api/customers/:id/link-prospects/:prospect_id', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const { id: customerId, prospect_id } = req.params;
    const { status, notes } = req.body;

    const validStatuses = ['discovered', 'contacted', 'pending', 'acquired', 'rejected', 'lost'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: `Ogiltigt status. Tillåtna: ${validStatuses.join(', ')}` });
    }

    const updates = [];
    const params = { customer_id: customerId, prospect_id };

    if (status !== undefined) {
      updates.push('status = @status');
      params.status = status;
    }
    if (notes !== undefined) {
      updates.push('notes = @notes');
      params.notes = notes;
    }
    if (!updates.length) return res.status(400).json({ error: 'Inget att uppdatera' });

    updates.push('updated_at = CURRENT_TIMESTAMP()');

    await bq.query({
      query: `UPDATE \`${dataset}.link_prospects\` SET ${updates.join(', ')} WHERE customer_id = @customer_id AND prospect_id = @prospect_id`,
      params
    });

    // Funktion 3 — Trello-synk när länk förvärvas
    if (status === 'acquired') {
      try {
        const [rows] = await bq.query({
          query: `SELECT domain_name, link_type FROM \`${dataset}.link_prospects\` WHERE customer_id = @customer_id AND prospect_id = @prospect_id LIMIT 1`,
          params: { customer_id: customerId, prospect_id }
        });
        const prospect = rows[0] || {};
        const domainName = prospect.domain_name || prospect_id;
        const linkType = prospect.link_type || 'okänd';
        const dateStr = new Date().toLocaleDateString('sv-SE');

        const boardId = await getParam('/seo-mcp/trello/board-id');
        const allCards = await trelloApi('GET', `/boards/${boardId}/cards`, { fields: 'name,id' });
        const card = allCards.find(c => {
          const name = c.name.toLowerCase();
          return name.includes(customerId.toLowerCase()) ||
                 name.includes(customerId.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase());
        });
        if (card) {
          await trelloApi('POST', `/cards/${card.id}/actions/comments`, {
            text: `Länk förvärvad ✓ ${domainName} (${linkType}) — ${dateStr}`
          });
          console.log(`[Link Acquired] Trello-kommentar tillagd på ${card.id} för ${customerId}`);
        }
      } catch (trelloErr) {
        console.error('[Link Acquired] Trello-fel:', trelloErr.message);
      }
    }

    res.json({ success: true });
  } catch (e) {
    console.error('PATCH link-prospects error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/customers/:id/link-prospects/:prospect_id/send-outreach — skicka outreach-mail för granskning
app.post('/api/customers/:id/link-prospects/:prospect_id/send-outreach', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const { id: customerId, prospect_id } = req.params;

    // Hämta prospect-data
    const [rows] = await bq.query({
      query: `SELECT url, domain_name, notes, link_type, status FROM \`${dataset}.link_prospects\` WHERE customer_id = @customer_id AND prospect_id = @prospect_id LIMIT 1`,
      params: { customer_id: customerId, prospect_id }
    });
    if (!rows || !rows[0]) {
      return res.status(404).json({ error: 'Prospect hittades inte' });
    }
    const prospect = rows[0];

    // Hämta kundinfo från SSM
    const emailFrom = await getParam('/seo-mcp/email/from');
    const mikaelEmail = await getParam('/seo-mcp/email/recipients').then(v => v.split(',')[0].trim());
    const companyName = await getParam(`/seo-mcp/integrations/${customerId}/company-name`).catch(() => customerId);

    const subject = `[Outreach klar att skicka] ${prospect.domain_name} — ${customerId}`;
    const bodyText = [
      `Outreach-mail redo för granskning`,
      ``,
      `Kund: ${companyName} (${customerId})`,
      `Prospekt: ${prospect.domain_name}`,
      `URL: ${prospect.url}`,
      `Länktyp: ${prospect.link_type}`,
      ``,
      `--- Outreach-mall ---`,
      prospect.notes || '(ingen mall angiven)',
      ``,
      `Granska och skicka manuellt till rätt kontakt på ${prospect.domain_name}.`
    ].join('\n');

    await ses.send(new SendEmailCommand({
      Source: emailFrom,
      Destination: { ToAddresses: [mikaelEmail] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Text: { Data: bodyText, Charset: 'UTF-8' } }
      }
    }));

    // Uppdatera status till "contacted"
    await bq.query({
      query: `UPDATE \`${dataset}.link_prospects\` SET status = 'contacted', updated_at = CURRENT_TIMESTAMP() WHERE customer_id = @customer_id AND prospect_id = @prospect_id`,
      params: { customer_id: customerId, prospect_id }
    });

    console.log(`[Outreach] Mail skickat för ${prospect.domain_name} (kund: ${customerId}) till ${mikaelEmail}`);
    res.json({ success: true, message: 'Outreach skickat för granskning' });
  } catch (e) {
    console.error('send-outreach error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/link-verification/run — verifiera att "acquired" länkprospekt fortfarande lever
async function runLinkVerification() {
  console.log('[Link Verification] Startar verifiering...');
  const { bq, dataset } = await getBigQuery();

  const [rows] = await bq.query({
    query: `SELECT customer_id, prospect_id, url, domain_name FROM \`${dataset}.link_prospects\` WHERE status = 'acquired'`
  });

  if (!rows || rows.length === 0) {
    console.log('[Link Verification] Inga acquired-prospekt att verifiera.');
    return { checked: 0, ok: 0, lost: 0 };
  }

  let ok = 0;
  let lost = 0;
  const dateStr = new Date().toLocaleDateString('sv-SE');

  for (const row of rows) {
    let isAlive = false;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(row.url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' });
      clearTimeout(timeout);
      if (resp.status >= 200 && resp.status <= 399) {
        isAlive = true;
      }
    } catch (fetchErr) {
      // timeout eller nätverksfel — räknas som lost
      isAlive = false;
    }

    if (isAlive) {
      ok++;
    } else {
      lost++;
      const lostNote = `Länk borttagen ${dateStr}`;
      await bq.query({
        query: `UPDATE \`${dataset}.link_prospects\` SET status = 'lost', notes = CONCAT(COALESCE(notes, ''), ' | ', @note), updated_at = CURRENT_TIMESTAMP() WHERE customer_id = @customer_id AND prospect_id = @prospect_id`,
        params: { note: lostNote, customer_id: row.customer_id, prospect_id: row.prospect_id }
      }).catch(e => console.error('[Link Verification] BQ update-fel:', e.message));
      console.log(`[Link Verification] Länk borttagen: ${row.url} (${row.customer_id})`);
    }
  }

  const report = { checked: rows.length, ok, lost };
  console.log(`[Link Verification] Klar — ${report.checked} kollade, ${ok} ok, ${lost} borttagna`);
  return report;
}

app.post('/api/link-verification/run', async (req, res) => {
  try {
    const report = await runLinkVerification();
    res.json({ success: true, ...report });
  } catch (e) {
    console.error('link-verification error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/customers/:id/link-prospects/:prospect_id — ta bort prospect
app.delete('/api/customers/:id/link-prospects/:prospect_id', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const { id: customerId, prospect_id } = req.params;

    await bq.query({
      query: `DELETE FROM \`${dataset}.link_prospects\` WHERE customer_id = @customer_id AND prospect_id = @prospect_id`,
      params: { customer_id: customerId, prospect_id }
    });

    res.json({ success: true });
  } catch (e) {
    console.error('DELETE link-prospects error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/customers/:id/link-prospects/auto-discover — AI genererar 10-15 länkprospekt
app.post('/api/customers/:id/link-prospects/auto-discover', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const customerId = req.params.id;

    // Hämta kundinfo: nyckelord + bransch
    const [keywordRows] = await bq.query({
      query: `SELECT keyword, tier FROM \`${dataset}.customer_keywords\` WHERE customer_id = @customer_id ORDER BY tier, keyword LIMIT 20`,
      params: { customer_id: customerId }
    }).catch(() => [[]]);

    const [pipelineRows] = await bq.query({
      query: `SELECT company_name, website_url, geographic_focus FROM \`${dataset}.customer_pipeline\` WHERE customer_id = @customer_id LIMIT 1`,
      params: { customer_id: customerId }
    }).catch(() => [[]]);

    const customer = pipelineRows[0] || {};
    const keywords = (keywordRows || []).map(r => `${r.tier}: ${r.keyword}`).join(', ') || 'okänd bransch';
    const companyName = customer.company_name || customerId;
    const websiteUrl = customer.website_url || '';
    const geoFocus = customer.geographic_focus || 'Sverige';

    const claudeClient = await getClaude();
    const message = await claudeClient.messages.create({
      model: await getModel('cheap'),
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `Du är en svensk SEO-specialist. Generera 12 relevanta länkbyggesmöjligheter för följande företag:

Företag: ${companyName}
Webbplats: ${websiteUrl}
Geografiskt fokus: ${geoFocus}
Nyckelord: ${keywords}

Returnera ENBART en JSON-array (utan markdown-wrapping) med 12 objekt. Varje objekt ska ha:
- "url": fullständig URL till sajten (https://...)
- "domain_name": domännamn utan www
- "link_type": en av "directory", "supplier", "media", "blog", "partner"
- "notes": kort motivering på svenska (max 60 tecken)

Fokusera på svenska sajter: lokala företagskataloger, branschkataloger, leverantörssajter, lokala medier och nischade bloggar. Undvik generiska kataloger som hitta.se och eniro.se.`
      }]
    });

    const rawText = message.content[0].text;
    let suggestions;
    try {
      suggestions = parseClaudeJSON(rawText);
    } catch (parseErr) {
      console.error('auto-discover parse error:', parseErr.message, rawText.substring(0, 200));
      return res.status(500).json({ error: 'Kunde inte tolka AI-svar', raw: rawText.substring(0, 300) });
    }

    if (!Array.isArray(suggestions)) {
      return res.status(500).json({ error: 'AI returnerade inte en array' });
    }

    const now = new Date().toISOString();
    const rows = suggestions.slice(0, 15).map(s => ({
      customer_id: customerId,
      prospect_id: require('crypto').randomUUID ? require('crypto').randomUUID() : `lp-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      url: s.url || '',
      domain_name: s.domain_name || (s.url || '').replace(/https?:\/\/(www\.)?/, '').split('/')[0],
      link_type: s.link_type || 'directory',
      status: 'discovered',
      notes: s.notes || '',
      created_at: { value: now },
      updated_at: { value: now }
    }));

    await bq.dataset(dataset).table('link_prospects').insert(rows);

    res.json({ success: true, discovered: rows.length, prospects: rows.map(r => ({ ...r, created_at: now, updated_at: now })) });
  } catch (e) {
    console.error('auto-discover error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ══════════════════════════════════════════
// LINKEDIN CONTENT AUTOMATION
// ══════════════════════════════════════════

// Hjälpfunktion: se till att linkedin_drafts-tabellen finns
async function ensureLinkedInTable() {
  const { bq, dataset } = await getBigQuery();
  try {
    await bq.query(`SELECT 1 FROM \`${dataset}.linkedin_drafts\` LIMIT 1`);
  } catch (e) {
    if (e.message && e.message.includes('Not found')) {
      console.log('Creating table linkedin_drafts...');
      await bq.query(`CREATE TABLE \`${dataset}.linkedin_drafts\` (
        id STRING NOT NULL,
        post_text STRING,
        hashtags STRING,
        type STRING,
        status STRING,
        created_at TIMESTAMP,
        scheduled_for TIMESTAMP
      )`);
      console.log('Table linkedin_drafts created.');
    }
  }
}

// POST /api/linkedin/generate — Generera LinkedIn-inlägg med Claude
app.post('/api/linkedin/generate', async (req, res) => {
  try {
    const { topic, customer_id, type = 'tip' } = req.body;
    if (!topic) return res.status(400).json({ error: 'topic krävs' });

    const typeLabels = {
      tip: 'SEO-tips',
      case_study: 'kundcase',
      insight: 'insikt/analys',
      news: 'nyhet inom SEO/digital marknadsföring'
    };

    const client = await getClaude();
    const response = await client.messages.create({
      model: await getModel('cheap'),
      max_tokens: 600,
      system: `Du är innehållsstrateg för Searchboost.se, en svensk SEO-byrå.
Searchboost hjälper svenska små- och medelstora företag att ranka högre på Google.
Du skriver LinkedIn-inlägg på svenska som bygger förtroende och visar expertis inom SEO.
Tonen är professionell men personlig — inte klinisk eller säljig.
Inlägg ska vara 150-300 tecken (exkl. hashtags) och ha tydligt värde för läsaren.
Svara ALLTID med giltig JSON utan markdown-wrapper.`,
      messages: [{
        role: 'user',
        content: `Skriv ett LinkedIn-inlägg av typen "${typeLabels[type] || type}" om ämnet: "${topic}".
${customer_id ? 'Koppla gärna till ett konkret kundexempel (anonymt).' : ''}

Svara med JSON:
{
  "post_text": "inläggstexten här (150-300 tecken, exkl hashtags)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "suggested_image_prompt": "kort bildbeskrivning på engelska för att generera en AI-bild"
}`
      }]
    });

    const raw = response.content[0].text;
    let parsed;
    try {
      parsed = parseClaudeJSON(raw);
    } catch (parseErr) {
      console.error('linkedin/generate parse error:', parseErr.message, raw.substring(0, 200));
      return res.status(500).json({ error: 'Kunde inte tolka svar från AI' });
    }

    const postText = parsed.post_text || '';
    const hashtags = Array.isArray(parsed.hashtags) ? parsed.hashtags : [];
    res.json({
      post_text: postText,
      hashtags,
      char_count: postText.length,
      suggested_image_prompt: parsed.suggested_image_prompt || ''
    });
  } catch (e) {
    console.error('linkedin/generate error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/linkedin/calendar — Hämta 2-veckors publiceringsschema (tisdag + torsdag)
app.get('/api/linkedin/calendar', async (req, res) => {
  try {
    const topics = [
      { type: 'tip',        label: 'SEO-tips',   topic: 'lokal SEO för småföretag' },
      { type: 'insight',    label: 'Insikt',      topic: 'hur Google rankingfaktorer förändrats 2026' },
      { type: 'tip',        label: 'SEO-tips',   topic: 'teknisk SEO — page speed och Core Web Vitals' },
      { type: 'case_study', label: 'Kundcase',    topic: 'från osynlig till topp 3 på Google' },
      { type: 'news',       label: 'Nyhet',       topic: 'Googles senaste uppdatering och vad det innebär' },
      { type: 'tip',        label: 'SEO-tips',   topic: 'content-strategi och nyckelordsforskning' },
      { type: 'insight',    label: 'Insikt',      topic: 'SEO vs betald annonsering — när lönar sig vad' },
      { type: 'case_study', label: 'Kundcase',    topic: 'e-handel som tredubblade organisk trafik' },
      { type: 'tip',        label: 'SEO-tips',   topic: 'Google Business Profile och lokal synlighet' },
      { type: 'news',       label: 'Nyhet',       topic: 'AI-sök och vad det betyder för din SEO-strategi' }
    ];

    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=sön, 2=tis, 4=tor
    const daysToTuesday = (2 - dayOfWeek + 7) % 7 || 7;
    const firstTuesday = new Date(today);
    firstTuesday.setDate(today.getDate() + daysToTuesday);

    const days = [];
    let topicIdx = 0;
    for (let week = 0; week < 5; week++) {
      const tuesday = new Date(firstTuesday);
      tuesday.setDate(firstTuesday.getDate() + week * 7);
      const thursday = new Date(tuesday);
      thursday.setDate(tuesday.getDate() + 2);

      days.push({ date: tuesday.toISOString().split('T')[0], weekday: 'Tisdag', ...topics[topicIdx % topics.length] });
      topicIdx++;
      days.push({ date: thursday.toISOString().split('T')[0], weekday: 'Torsdag', ...topics[topicIdx % topics.length] });
      topicIdx++;
    }

    res.json({ calendar: days.slice(0, 10) });
  } catch (e) {
    console.error('linkedin/calendar error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/linkedin/save-draft — Spara utkast i BigQuery
app.post('/api/linkedin/save-draft', async (req, res) => {
  try {
    await ensureLinkedInTable();
    const { post_text, hashtags, type, scheduled_for } = req.body;
    if (!post_text) return res.status(400).json({ error: 'post_text krävs' });

    const { bq, dataset } = await getBigQuery();
    const id = `li_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date().toISOString();

    const row = {
      id,
      post_text,
      hashtags: Array.isArray(hashtags) ? hashtags.join(' ') : (hashtags || ''),
      type: type || 'tip',
      status: 'draft',
      created_at: { value: now },
      scheduled_for: scheduled_for ? { value: scheduled_for } : null
    };

    await bq.dataset(dataset).table('linkedin_drafts').insert([row]);
    res.json({ success: true, id, created_at: now });
  } catch (e) {
    console.error('linkedin/save-draft error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/linkedin/drafts — Lista sparade utkast
app.get('/api/linkedin/drafts', async (req, res) => {
  try {
    await ensureLinkedInTable();
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query(`
      SELECT id, post_text, hashtags, type, status, created_at, scheduled_for
      FROM \`${dataset}.linkedin_drafts\`
      ORDER BY created_at DESC
      LIMIT 50
    `);
    res.json({ drafts: rows });
  } catch (e) {
    console.error('linkedin/drafts error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/linkedin/drafts/:id — Uppdatera status eller text på utkast
app.patch('/api/linkedin/drafts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, post_text } = req.body;
    if (!status && !post_text) return res.status(400).json({ error: 'status eller post_text krävs' });

    const { bq, dataset } = await getBigQuery();
    const setClauses = [];
    if (status) setClauses.push(`status = '${status.replace(/'/g, "''")}'`);
    if (post_text) setClauses.push(`post_text = '${post_text.replace(/'/g, "''")}'`);

    await bq.query(`
      UPDATE \`${dataset}.linkedin_drafts\`
      SET ${setClauses.join(', ')}
      WHERE id = '${id.replace(/'/g, "''")}'
    `);
    res.json({ success: true });
  } catch (e) {
    console.error('linkedin/drafts PATCH error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Shopify OAuth ──
const SHOPIFY_CLIENT_ID = '119091d3ee9ef04ea643d9d230a0b8ed';
const SHOPIFY_CLIENT_SECRET = 'c3b2cf7e35aa25c1a82ce89bb0fa9caf';
const SHOPIFY_REDIRECT_URI = 'https://opti.searchboost.se/api/shopify/callback';
const SHOPIFY_SCOPES = 'read_products,write_products,read_content,write_content,read_themes,write_themes,read_metafields,write_metafields';

// Nonce-store i minnet (räcker för en server-process, omstart rensar dem)
const shopifyNonces = {};

// GET /api/shopify/auth/:shop — Starta OAuth-flödet
app.get('/api/shopify/auth/:shop', (req, res) => {
  const shop = req.params.shop;
  const shopDomain = `${shop}.myshopify.com`;
  const state = require('crypto').randomBytes(16).toString('hex');
  shopifyNonces[state] = { shop, createdAt: Date.now() };

  const params = new URLSearchParams({
    client_id: SHOPIFY_CLIENT_ID,
    scope: SHOPIFY_SCOPES,
    redirect_uri: SHOPIFY_REDIRECT_URI,
    state
  });

  res.redirect(`https://${shopDomain}/admin/oauth/authorize?${params.toString()}`);
});

// GET /api/shopify/callback — Ta emot OAuth-callback från Shopify
app.get('/api/shopify/callback', async (req, res) => {
  const { code, state, shop } = req.query;

  // Validera state
  if (!state || !shopifyNonces[state]) {
    return res.status(400).send('Ogiltig state-parameter. OAuth-flödet kan ha gått ut.');
  }
  const nonceData = shopifyNonces[state];
  delete shopifyNonces[state]; // Engångsanvändning

  const shopDomain = `${nonceData.shop}.myshopify.com`;

  try {
    // Byt code mot access_token
    const tokenRes = await axios.post(
      `https://${shopDomain}/admin/oauth/access_token`,
      {
        client_id: SHOPIFY_CLIENT_ID,
        client_secret: SHOPIFY_CLIENT_SECRET,
        code
      }
    );
    const accessToken = tokenRes.data.access_token;

    // Spara access_token i SSM
    await ssm.send(new PutParameterCommand({
      Name: `/seo-mcp/shopify/${nonceData.shop}/access-token`,
      Value: accessToken,
      Type: 'SecureString',
      Overwrite: true
    }));

    // Spara shop-domän i SSM
    await ssm.send(new PutParameterCommand({
      Name: `/seo-mcp/shopify/${nonceData.shop}/shop-domain`,
      Value: shopDomain,
      Type: 'String',
      Overwrite: true
    }));

    console.log(`[Shopify] OAuth klar för ${shopDomain} — token sparad i SSM`);

    res.send(`<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <title>Shopify kopplat</title>
  <style>
    body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #0d1117; color: #e6edf3; }
    .box { text-align: center; padding: 2rem; border: 1px solid #30363d; border-radius: 8px; background: #161b22; }
    h1 { color: #3fb950; margin-bottom: 0.5rem; }
    p { color: #8b949e; }
  </style>
</head>
<body>
  <div class="box">
    <h1>Shopify kopplat!</h1>
    <p>Token sparad för <strong>${shopDomain}</strong>.</p>
    <p>Du kan stänga det här fönstret.</p>
  </div>
</body>
</html>`);
  } catch (e) {
    console.error('[Shopify] OAuth-fel:', e.message);
    res.status(500).send(`OAuth misslyckades: ${e.message}`);
  }
});

// ──────────────────────────────────────────────────────────────────
// customer_tasks — Kanban-ersättning för Trello (2026-04-09)
// ──────────────────────────────────────────────────────────────────

app.get('/api/customers/:id/tasks', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { bq, dataset } = await getBigQuery();
    const query = `
      SELECT task_id, customer_id, title, description, status, priority,
             FORMAT_DATE('%Y-%m-%d', due_date) AS due_date,
             FORMAT_TIMESTAMP('%Y-%m-%d %H:%M', created_at) AS created_at,
             FORMAT_TIMESTAMP('%Y-%m-%d %H:%M', updated_at) AS updated_at,
             FORMAT_TIMESTAMP('%Y-%m-%d %H:%M', completed_at) AS completed_at,
             created_by, assigned_to, tags, notes
      FROM \`${bq.projectId}.${dataset}.customer_tasks\`
      WHERE customer_id = @cid
      ORDER BY
        CASE status WHEN 'todo' THEN 1 WHEN 'in_progress' THEN 2 WHEN 'blocked' THEN 3 WHEN 'done' THEN 4 ELSE 5 END,
        priority DESC,
        created_at DESC
      LIMIT 500
    `;
    const [rows] = await bq.query({
      query,
      params: { cid: customerId },
    });
    res.json({ customer_id: customerId, tasks: rows });
  } catch (err) {
    console.error('GET tasks error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/customers/:id/tasks', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { title, description, status, priority, due_date, tags, notes, created_by } = req.body;
    if (!title) return res.status(400).json({ error: 'title krävs' });
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { bq, dataset } = await getBigQuery();
    const query = `
      INSERT INTO \`${bq.projectId}.${dataset}.customer_tasks\`
        (task_id, customer_id, title, description, status, priority, due_date,
         created_at, updated_at, created_by, tags, notes)
      VALUES
        (@task_id, @customer_id, @title, @description, @status, @priority,
         SAFE_CAST(@due_date AS DATE),
         CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP(), @created_by, @tags, @notes)
    `;
    await bq.query({
      query,
      params: {
        task_id: taskId,
        customer_id: customerId,
        title,
        description: description || '',
        status: status || 'todo',
        priority: priority || 2,
        due_date: due_date || null,
        created_by: created_by || 'mikael',
        tags: tags || '',
        notes: notes || '',
      },
      types: { due_date: 'STRING' },
    });
    res.json({ success: true, task_id: taskId });
  } catch (err) {
    console.error('POST task error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/customers/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id: customerId, taskId } = req.params;
    const fields = ['title', 'description', 'status', 'priority', 'due_date', 'tags', 'notes', 'assigned_to'];
    const updates = [];
    const params = { task_id: taskId, customer_id: customerId };
    for (const f of fields) {
      if (f in req.body) {
        if (f === 'due_date') {
          updates.push(`due_date = SAFE_CAST(@due_date AS DATE)`);
          params.due_date = req.body.due_date || null;
        } else {
          updates.push(`${f} = @${f}`);
          params[f] = req.body[f];
        }
      }
    }
    if (req.body.status === 'done') {
      updates.push('completed_at = CURRENT_TIMESTAMP()');
    }
    if (updates.length === 0) return res.status(400).json({ error: 'inga fält att uppdatera' });
    updates.push('updated_at = CURRENT_TIMESTAMP()');
    const { bq, dataset } = await getBigQuery();
    const query = `
      UPDATE \`${bq.projectId}.${dataset}.customer_tasks\`
      SET ${updates.join(', ')}
      WHERE task_id = @task_id AND customer_id = @customer_id
    `;
    const types = { due_date: 'STRING' };
    await bq.query({ query, params, types });
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH task error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/customers/:id/tasks/:taskId', async (req, res) => {
  try {
    const { id: customerId, taskId } = req.params;
    const { bq, dataset } = await getBigQuery();
    const query = `
      DELETE FROM \`${bq.projectId}.${dataset}.customer_tasks\`
      WHERE task_id = @task_id AND customer_id = @customer_id
    `;
    await bq.query({ query, params: { task_id: taskId, customer_id: customerId } });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE task error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Aggregerad Kanban-vy (alla kunder, grupperat på status)
app.get('/api/tasks/kanban', async (req, res) => {
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `
        SELECT task_id, customer_id, title, description, status, priority,
               FORMAT_DATE('%Y-%m-%d', due_date) AS due_date,
               FORMAT_TIMESTAMP('%Y-%m-%d %H:%M', updated_at) AS updated_at,
               tags
        FROM \`${bq.projectId}.${dataset}.customer_tasks\`
        WHERE status != 'done' OR DATE(completed_at) >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
        ORDER BY priority DESC, updated_at DESC
        LIMIT 1000
      `,
    });
    const grouped = { todo: [], in_progress: [], blocked: [], done: [] };
    for (const r of rows) {
      const s = r.status || 'todo';
      if (grouped[s]) grouped[s].push(r);
      else grouped.todo.push(r);
    }
    res.json(grouped);
  } catch (err) {
    console.error('kanban error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── Oväntade fel — logga + notifiera ──
process.on('uncaughtException', (err) => {
  console.error('uncaughtException:', err);
  slackAlert(`Kritiskt fel (uncaughtException): ${err.message}`, 'critical');
});

process.on('unhandledRejection', (reason) => {
  console.error('unhandledRejection:', reason);
  slackAlert(`Ohanterat Promise-fel: ${reason}`, 'warning');
});

// ══════════════════════════════════════════════════════════════
// Social Planner — Content-schemaläggning + AI-generering
// ══════════════════════════════════════════════════════════════

const socialPlanner = require('./social-planner');

// Säkerställ BQ-tabell vid uppstart
async function ensureSocialQueueTable() {
  try {
    const { bq, dataset } = await getBigQuery();
    const ds = bq.dataset(dataset);
    await ds.createTable('social_content_queue', {
      schema: { fields: socialPlanner.SOCIAL_QUEUE_SCHEMA },
      timePartitioning: { type: 'DAY', field: 'scheduled_at' },
      clustering: { fields: ['customer_id', 'platform', 'status'] },
    });
    console.log('social_content_queue tabell skapad');
  } catch (e) {
    if (!e.message.includes('Already Exists')) console.log('social_content_queue:', e.message);
  }
}

// GET /api/social/posts — Hämta inlägg (filter: customerId, platform, status)
app.get('/api/social/posts', async (req, res) => {
  try {
    const { customer_id, platform, status, days = 30 } = req.query;
    const { bq, dataset } = await getBigQuery();

    let where = `scheduled_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${parseInt(days)} DAY)`;
    const params = {};
    if (customer_id) { where += ' AND customer_id = @cid'; params.cid = customer_id; }
    if (platform)    { where += ' AND platform = @plat';   params.plat = platform; }
    if (status)      { where += ' AND status = @status';   params.status = status; }

    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.social_content_queue\` WHERE ${where} ORDER BY scheduled_at ASC LIMIT 100`,
      params,
    });
    res.json({ posts: rows || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/social/generate — Generera AI-inlägg (spara som draft)
app.post('/api/social/generate', async (req, res) => {
  try {
    const { customer_id = 'searchboost', platform = 'linkedin', topic, post_type = 'tip', schedule_now = false } = req.body;
    const anthropicKey = await getParam('/seo-mcp/anthropic/api-key');

    // Hämta kunddata för kontext
    let keywords = [], gscTopQueries = [], customerName = customer_id;
    try {
      const companyName = await getParamSafe(`/seo-mcp/integrations/${customer_id}/company-name`);
      if (companyName) customerName = companyName;
    } catch {}

    const post = await socialPlanner.generatePost({
      platform,
      topic,
      postType: post_type,
      customerId: customer_id,
      customerName,
      keywords,
      gscTopQueries,
      anthropicKey,
    });

    // Bestäm schemaläggningsdatum
    let scheduledAt;
    if (schedule_now) {
      const nextDates = socialPlanner.getNextPostDates(1);
      scheduledAt = nextDates[0];
    } else {
      // Draft — schemalägg till nästa lediga slot
      const nextDates = socialPlanner.getNextPostDates(1);
      scheduledAt = nextDates[0];
    }

    const row = {
      post_id: `${customer_id}_${platform}_${Date.now()}`,
      customer_id,
      platform,
      status: 'draft',
      hook: post.hook,
      body: post.body,
      full_text: post.full_text,
      hashtags: (post.hashtags || []).join(','),
      char_count: post.char_count,
      suggested_image_prompt: post.suggested_image_prompt || '',
      topic: post.topic || '',
      post_type: post.post_type,
      scheduled_at: scheduledAt,
      created_at: new Date().toISOString(),
      posted_at: null,
      linkedin_post_id: null,
      error_message: null,
    };

    const { bq, dataset } = await getBigQuery();
    const table = bq.dataset(dataset).table('social_content_queue');
    await table.insert([row]);

    res.json({ success: true, post: row });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/social/posts/:postId/approve — Godkänn ett utkast
app.post('/api/social/posts/:postId/approve', async (req, res) => {
  try {
    const { postId } = req.params;
    const { scheduled_at } = req.body; // Valfritt: ändra schemaläggningsdatum
    const { bq, dataset, projectId } = await getBigQuery();

    const updateFields = ['status = @status'];
    const params = { id: postId, status: 'approved' };

    if (scheduled_at) {
      updateFields.push('scheduled_at = @sat');
      params.sat = scheduled_at;
    }

    await bq.query({
      query: `UPDATE \`${projectId}.${dataset}.social_content_queue\`
              SET ${updateFields.join(', ')}
              WHERE post_id = @id`,
      params,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/social/posts/:postId/update — Redigera text + schema
app.post('/api/social/posts/:postId/update', async (req, res) => {
  try {
    const { postId } = req.params;
    const { full_text, scheduled_at, status } = req.body;
    const { bq, dataset, projectId } = await getBigQuery();

    const sets = [];
    const params = { id: postId };
    if (full_text)    { sets.push('full_text = @ft');     params.ft = full_text; }
    if (scheduled_at) { sets.push('scheduled_at = @sat'); params.sat = scheduled_at; }
    if (status)       { sets.push('status = @st');        params.st = status; }

    if (sets.length === 0) return res.json({ success: true, message: 'Inget att uppdatera' });

    await bq.query({
      query: `UPDATE \`${projectId}.${dataset}.social_content_queue\`
              SET ${sets.join(', ')}
              WHERE post_id = @id`,
      params,
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/social/posts/:postId — Ta bort utkast
app.delete('/api/social/posts/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { bq, dataset, projectId } = await getBigQuery();
    await bq.query({
      query: `DELETE FROM \`${projectId}.${dataset}.social_content_queue\` WHERE post_id = @id AND status != 'posted'`,
      params: { id: postId },
    });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/social/posts/:postId/post-now — Posta direkt (utan att vänta på Lambda)
app.post('/api/social/posts/:postId/post-now', async (req, res) => {
  try {
    const { postId } = req.params;
    const { bq, dataset, projectId } = await getBigQuery();

    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.social_content_queue\` WHERE post_id = @id LIMIT 1`,
      params: { id: postId },
    });
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Inlägg ej hittat' });

    const post = rows[0];
    const creds = await getPostingCredentials(post.customer_id, post.platform);
    const result = await socialPlanner.publishScheduledPost(post, creds);

    // BQ UPDATE kan misslyckas p.g.a. streaming buffer-lock (ny rad < 90 min)
    // Det påverkar inte om inlägget faktiskt postades — ignorera detta fel
    try {
      await bq.query({
        query: `UPDATE \`${projectId}.${dataset}.social_content_queue\`
                SET status = 'posted', posted_at = CURRENT_TIMESTAMP(), linkedin_post_id = @pid
                WHERE post_id = @id`,
        params: { id: postId, pid: result.post_id || '' },
      });
    } catch (bqErr) {
      console.warn('BQ UPDATE efter posting misslyckades (streaming buffer):', bqErr.message);
    }

    res.json({ success: true, linkedin_post_id: result.post_id, url: result.url, note: 'Postad!' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/social/calendar — Kalendervy (alla inlägg nästa 30 dagar)
app.get('/api/social/calendar', async (req, res) => {
  try {
    const { customer_id } = req.query;
    const { bq, dataset } = await getBigQuery();

    let where = 'scheduled_at >= CURRENT_TIMESTAMP() AND scheduled_at <= TIMESTAMP_ADD(CURRENT_TIMESTAMP(), INTERVAL 60 DAY)';
    const params = {};
    if (customer_id) { where += ' AND customer_id = @cid'; params.cid = customer_id; }

    const [upcoming] = await bq.query({
      query: `SELECT post_id, customer_id, platform, status, hook, scheduled_at, posted_at, post_type
              FROM \`${dataset}.social_content_queue\`
              WHERE ${where}
              ORDER BY scheduled_at ASC`,
      params,
    });

    // Även senaste 7 dagars postade inlägg
    const [recent] = await bq.query({
      query: `SELECT post_id, customer_id, platform, status, hook, scheduled_at, posted_at, post_type, linkedin_post_id
              FROM \`${dataset}.social_content_queue\`
              WHERE status = 'posted'
                AND posted_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
              ORDER BY posted_at DESC LIMIT 20`,
    });

    res.json({ upcoming: upcoming || [], recent: recent || [] });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/social/credentials/:customerId — Vilka plattformar är kopplade
app.get('/api/social/credentials/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const isSearchboost = customerId === 'searchboost';
    const prefix = isSearchboost ? '/seo-mcp/searchboost' : `/seo-mcp/integrations/${customerId}`;

    const [liToken, liCompany, metaToken, igId, fbId] = await Promise.all([
      getParamSafe(`${prefix}/linkedin-access-token`),
      getParamSafe(`${prefix}/linkedin-company-id`),
      getParamSafe(`${isSearchboost ? '/seo-mcp/searchboost' : `/seo-mcp/integrations/${customerId}`}/meta-access-token`),
      getParamSafe(`/seo-mcp/integrations/${customerId}/instagram-business-id`),
      getParamSafe(`/seo-mcp/integrations/${customerId}/facebook-page-id`),
    ]);

    res.json({
      linkedin:  { linked: !!(liToken && liCompany),  has_token: !!liToken, has_company_id: !!liCompany },
      instagram: { linked: !!(metaToken && igId),      has_token: !!metaToken, has_business_id: !!igId },
      facebook:  { linked: !!(metaToken && fbId),      has_token: !!metaToken, has_page_id: !!fbId },
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/social/credentials/:customerId — Spara LinkedIn credentials
app.post('/api/social/credentials/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params;
    const { platform, access_token, company_id, page_id, business_id } = req.body;
    const { SSMClient, PutParameterCommand } = require('@aws-sdk/client-ssm');
    const ssmWrite = new SSMClient({ region: REGION });

    const isSearchboost = customerId === 'searchboost';
    const prefix = isSearchboost ? '/seo-mcp/searchboost' : `/seo-mcp/integrations/${customerId}`;

    const puts = [];
    if (platform === 'linkedin') {
      if (access_token) puts.push([`${prefix}/linkedin-access-token`, access_token]);
      if (company_id)   puts.push([`${prefix}/linkedin-company-id`,    company_id]);
    } else if (platform === 'instagram' || platform === 'facebook') {
      if (access_token) puts.push([`${prefix}/meta-access-token`,          access_token]);
      if (business_id)  puts.push([`/seo-mcp/integrations/${customerId}/instagram-business-id`, business_id]);
      if (page_id)      puts.push([`/seo-mcp/integrations/${customerId}/facebook-page-id`,      page_id]);
    }

    await Promise.all(puts.map(([name, value]) =>
      ssmWrite.send(new (require('@aws-sdk/client-ssm').PutParameterCommand)({
        Name: name, Value: value, Type: 'SecureString', Overwrite: true,
      }))
    ));

    res.json({ success: true, saved: puts.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ── Helper: hämta posting-credentials (används av post-now endpoint) ──
async function getPostingCredentials(customerId, platform) {
  const isSearchboost = customerId === 'searchboost';
  const prefix = isSearchboost ? '/seo-mcp/searchboost' : `/seo-mcp/integrations/${customerId}`;

  if (platform === 'linkedin') {
    return {
      accessToken:    await getParamSafe(`${prefix}/linkedin-access-token`),
      organizationId: await getParamSafe(`${prefix}/linkedin-company-id`),
      personUrn:      await getParamSafe(`${prefix}/linkedin-person-urn`),
    };
  }
  if (platform === 'instagram') {
    return {
      accessToken:         await getParamSafe(`${prefix}/meta-access-token`),
      instagramBusinessId: await getParamSafe(`/seo-mcp/integrations/${customerId}/instagram-business-id`),
    };
  }
  if (platform === 'facebook') {
    return {
      accessToken:    await getParamSafe(`${prefix}/meta-access-token`),
      facebookPageId: await getParamSafe(`/seo-mcp/integrations/${customerId}/facebook-page-id`),
    };
  }
  throw new Error(`Okänd plattform: ${platform}`);
}

// ══════════════════════════════════════════════════════════════
// LinkedIn OAuth 2.0 — Hämta access token för company page
// ══════════════════════════════════════════════════════════════

// GET /oauth/linkedin — Starta OAuth-flöde (öppnas i browser av Mikael)
app.get('/oauth/linkedin', async (req, res) => {
  try {
    const clientId = await getParam('/seo-mcp/searchboost/linkedin-client-id');
    const redirectUri = encodeURIComponent('http://51.21.116.7/oauth/linkedin/callback');
    // w_member_social: posta, openid+profile: hämta member ID automatiskt
    const scope = encodeURIComponent('w_member_social openid profile');
    const state = Math.random().toString(36).substring(2);

    // Spara state tillfälligt (enkel in-memory, räcker för en session)
    app._liOAuthState = state;

    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}`;
    res.redirect(authUrl);
  } catch (e) {
    res.send(`<h2>Fel: ${e.message}</h2><p>Säkerställ att /seo-mcp/searchboost/linkedin-client-id finns i SSM.</p>`);
  }
});

// ══════════════════════════════════════════════════════════════
// Mobil-Claude SSM-proxy — hämta WP-creds utan AWS CLI
// ══════════════════════════════════════════════════════════════

// GET /api/site/:siteId/wp-credentials — returnerar WP URL + username + app-password
// Kräver X-Api-Key. Används av mobil-Claude som inte har AWS CLI.
// Exempel: GET /api/site/smalandskontorsmobler/wp-credentials
app.get('/api/site/:siteId/wp-credentials', async (req, res) => {
  try {
    const { siteId } = req.params;
    const prefix = `/seo-mcp/wordpress/${siteId}`;
    const [url, username, appPassword] = await Promise.all([
      getParamSafe(`${prefix}/url`),
      getParamSafe(`${prefix}/username`),
      getParamSafe(`${prefix}/app-password`),
    ]);
    if (!url) return res.status(404).json({ error: `Ingen site hittad: ${siteId}` });
    res.json({ site: siteId, url, username, app_password: appPassword });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/sites — lista alla konfigurerade WP-siter
app.get('/api/sites', async (req, res) => {
  try {
    const sites = await getWordPressSites();
    res.json({ sites: sites.map(s => ({ id: s.customerId, url: s.url, username: s.username })) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/social/linkedin/set-company — Manuellt sätta company ID
app.post('/api/social/linkedin/set-company', async (req, res) => {
  try {
    const { company_id } = req.body;
    if (!company_id) return res.status(400).json({ error: 'company_id krävs' });
    const numericId = String(company_id).replace(/\D/g, '');
    if (!numericId) return res.status(400).json({ error: 'Ogiltigt company_id — ange numeriskt ID' });
    const ssmW = new SSMClient({ region: REGION });
    await ssmW.send(new PutParameterCommand({
      Name: '/seo-mcp/searchboost/linkedin-company-id',
      Value: numericId,
      Type: 'String',
      Overwrite: true,
    }));
    res.json({ success: true, company_id: numericId, urn: `urn:li:organization:${numericId}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /oauth/linkedin/callback — LinkedIn skickar hit efter godkännande
app.get('/oauth/linkedin/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.send(`<h2>LinkedIn nekade: ${error}</h2><p>${error_description}</p>`);
  }

  if (!code) {
    return res.status(400).send('<h2>Ingen kod mottagen från LinkedIn</h2>');
  }

  try {
    const clientId     = await getParam('/seo-mcp/searchboost/linkedin-client-id');
    const clientSecret = await getParam('/seo-mcp/searchboost/linkedin-client-secret');
    const redirectUri  = 'http://51.21.116.7/oauth/linkedin/callback';
    const ax = require('axios');

    // Byt kod mot access token
    const tokenRes = await ax.post(
      'https://www.linkedin.com/oauth/v2/accessToken',
      new URLSearchParams({
        grant_type:    'authorization_code',
        code,
        redirect_uri:  redirectUri,
        client_id:     clientId,
        client_secret: clientSecret,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000 }
    );

    const { access_token, expires_in } = tokenRes.data;
    if (!access_token) throw new Error('Ingen access_token i svaret');

    // Hämta person member ID via OpenID Connect userinfo (kräver openid+profile scope)
    let personUrn = null;
    let memberNumericId = null;

    // Metod 1: OpenID Connect /v2/userinfo — returnerar sub = numeriskt member ID
    try {
      const userinfoRes = await ax.get('https://api.linkedin.com/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${access_token}` },
        timeout: 10000,
      });
      const sub = userinfoRes.data?.sub;
      if (sub) {
        memberNumericId = sub;
        personUrn = `urn:li:person:${sub}`;
        console.log('LinkedIn member ID via userinfo:', sub);
      }
    } catch (uiErr) {
      console.warn('LinkedIn userinfo misslyckades:', uiErr.response?.data || uiErr.message);
    }

    // Metod 2: /v2/me (fallback)
    if (!personUrn) {
      try {
        const meRes = await ax.get('https://api.linkedin.com/v2/me', {
          headers: { 'Authorization': `Bearer ${access_token}` },
          timeout: 10000,
        });
        const id = meRes.data?.id;
        if (id) {
          memberNumericId = id;
          personUrn = `urn:li:person:${id}`;
          console.log('LinkedIn member ID via /v2/me:', id);
        }
      } catch (meErr) {
        console.warn('LinkedIn /v2/me misslyckades:', meErr.response?.data || meErr.message);
      }
    }

    const organizations = [];
    const autoCompanyId = null;

    // Spara i SSM
    const ssmW = new SSMClient({ region: REGION });
    const puts = [
      ssmW.send(new PutParameterCommand({
        Name: '/seo-mcp/searchboost/linkedin-access-token',
        Value: access_token,
        Type: 'SecureString',
        Overwrite: true,
      })),
    ];
    if (personUrn) {
      puts.push(ssmW.send(new PutParameterCommand({
        Name: '/seo-mcp/searchboost/linkedin-person-urn',
        Value: personUrn,
        Type: 'String',
        Overwrite: true,
      })));
    }
    if (autoCompanyId) {
      puts.push(ssmW.send(new PutParameterCommand({
        Name: '/seo-mcp/searchboost/linkedin-company-id',
        Value: autoCompanyId,
        Type: 'String',
        Overwrite: true,
      })));
    }
    await Promise.all(puts);

    const expiresDate = new Date(Date.now() + expires_in * 1000).toLocaleDateString('sv-SE');
    const orgListHtml = organizations.length > 0
      ? `<div style="text-align:left;margin-top:16px">
          <p style="color:#00e676;font-size:13px">Hittade ${organizations.length} företagssida(or) du administrerar:</p>
          ${organizations.map(o => `<div style="background:#111;padding:10px;border-radius:6px;margin:6px 0;font-size:13px">
            <strong>${o.name}</strong><br>
            <span style="color:#888">ID: ${o.id}</span>
            ${autoCompanyId === o.id ? ' <span style="color:#00e676">✓ Auto-sparad</span>' : ''}
          </div>`).join('')}
        </div>`
      : `<div style="margin-top:16px;padding:12px;background:#2a1a0a;border-radius:8px;font-size:13px">
          <p style="color:#f90;margin:0">Hittade ingen företagssida automatiskt.</p>
          <p style="color:#888;margin:8px 0 4px">Hitta ditt Company Page ID:</p>
          <ol style="color:#888;margin:0;padding-left:18px;font-size:12px">
            <li>Gå till linkedin.com/company/searchboost-ab/admin/</li>
            <li>Ta siffran i URL:en (t.ex. .../admin/<strong>12345678</strong>/)</li>
          </ol>
          <form onsubmit="saveCompanyId(event)" style="margin-top:12px">
            <input id="cid" type="text" placeholder="Numeriskt company ID" style="padding:8px;border-radius:4px;border:1px solid #444;background:#1a1a2e;color:#fff;width:180px">
            <button type="submit" style="padding:8px 16px;background:#0077b5;color:#fff;border:none;border-radius:4px;cursor:pointer;margin-left:8px">Spara</button>
          </form>
          <p id="cid-status" style="color:#00e676;font-size:12px;margin-top:8px"></p>
        </div>`;

    res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>LinkedIn kopplat!</title>
<style>body{font-family:sans-serif;max-width:540px;margin:60px auto;text-align:center;background:#0e0c19;color:#fff}
.ok{color:#00e676;font-size:48px}.card{background:#1a1a2e;border-radius:12px;padding:28px;margin-top:24px}
a{color:#00d4ff}</style></head>
<body>
  <div class="ok">&#10003;</div>
  <h2>LinkedIn kopplat!</h2>
  <div class="card">
    <p>Access token sparad i SSM.</p>
    ${personUrn ? `<p style="color:#00e676;font-size:13px">Person URN sparad: <strong>${personUrn}</strong></p>` : '<p style="color:#f90;font-size:13px">Person URN kunde ej hämtas automatiskt — postar ändå.</p>'}
    ${personUrn ? `<p style="color:#888;font-size:12px">Person URN: ${personUrn}</p>` : ''}
    <p style="color:#888;font-size:14px">Token giltigt till: ${expiresDate}</p>
    ${orgListHtml}
    <p style="margin-top:20px"><a href="http://51.21.116.7/">Gå tillbaka till dashboarden &rarr;</a></p>
  </div>
<script>
async function saveCompanyId(e) {
  e.preventDefault();
  const id = document.getElementById('cid').value.trim();
  if (!id) return;
  const r = await fetch('/api/social/linkedin/set-company', {
    method: 'POST',
    headers: {'Content-Type':'application/json', 'X-Api-Key': '${process.env.DASHBOARD_API_KEY || 'sb-api-key'}'},
    body: JSON.stringify({company_id: id})
  });
  const d = await r.json();
  document.getElementById('cid-status').textContent = d.success
    ? 'Sparat! Company ID: ' + d.company_id + ' (' + d.urn + ')'
    : 'Fel: ' + (d.error || 'okänt');
}
</script>
</body>
</html>`);

  } catch (e) {
    res.send(`<h2 style="color:red">Fel: ${e.message}</h2><p>${e.response?.data ? JSON.stringify(e.response.data) : ''}</p>`);
  }
});

// ── Rankings history — top N sökord med positionsdata över tid ──
app.get('/api/customers/:id/rankings/history', async (req, res) => {
  try {
    const customerId = req.params.id;
    const days = parseInt(req.query.days || '30');
    const topN = parseInt(req.query.topN || '10');

    const { bq, dataset: datasetId } = await getBigQuery();

    const sql = `
      SELECT
        query,
        date,
        AVG(position) as avg_position,
        SUM(clicks) as clicks,
        SUM(impressions) as impressions
      FROM \`${bq.projectId}.${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @customerId
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL @days DAY)
        AND query IN (
          SELECT query FROM \`${bq.projectId}.${datasetId}.gsc_daily_metrics\`
          WHERE customer_id = @customerId
            AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
          GROUP BY query ORDER BY SUM(clicks) DESC LIMIT @topN
        )
      GROUP BY query, date
      ORDER BY query, date ASC
    `;

    const [rows] = await bq.query({ query: sql, params: { customerId, days, topN } });

    // Normalize BigQuery DATE objects
    const normalized = rows.map(r => ({
      query: r.query,
      date: r.date?.value || r.date,
      avg_position: typeof r.avg_position === 'number' ? r.avg_position : parseFloat(r.avg_position) || null,
      clicks: parseInt(r.clicks) || 0,
      impressions: parseInt(r.impressions) || 0,
    }));

    // Gruppera per sökord
    const seriesMap = {};
    for (const row of normalized) {
      if (!seriesMap[row.query]) seriesMap[row.query] = [];
      seriesMap[row.query].push({ date: row.date, position: row.avg_position, clicks: row.clicks });
    }

    const queries = Object.keys(seriesMap);
    const series = queries.map(q => ({ query: q, data: seriesMap[q] }));

    res.json({ customer_id: customerId, days, queries, series });
  } catch (err) {
    if (err.message?.includes('Not found: Table')) {
      return res.json({ customer_id: req.params.id, days: 0, queries: [], series: [] });
    }
    console.error('Rankings history error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Dessa endpoints är öppna (ingen API-nyckel krävs) ──
// Lägg till i middleware-whitelist nedan om den körs innan auth
// (OAuth-callback måste vara tillgänglig utan API-nyckel)

// ══════════ Google Business Profile ══════════
const gbp = require('./google-business-profile');

// GET /api/customers/:id/gbp/status — kolla om GBP är konfigurerat
app.get('/api/customers/:id/gbp/status', async (req, res) => {
  const customerId = req.params.id;
  const prefix = `/seo-mcp/integrations/${customerId}`;
  try {
    const [accessToken, locationId, accountId] = await Promise.all([
      getParamSafe(`${prefix}/gbp-access-token`),
      getParamSafe(`${prefix}/gbp-location-id`),
      getParamSafe(`${prefix}/gbp-account-id`)
    ]);
    const configured = !!(accessToken && locationId && accountId);
    res.json({
      configured,
      hasAccessToken: !!accessToken,
      hasLocationId: !!locationId,
      hasAccountId: !!accountId,
      locationId: configured ? locationId : null,
      accountId: configured ? accountId : null
    });
  } catch (err) {
    console.error('[GBP status] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/gbp/connect — spara GBP credentials
app.post('/api/customers/:id/gbp/connect', async (req, res) => {
  const customerId = req.params.id;
  const { accessToken, refreshToken, locationId, accountId } = req.body;
  if (!accessToken || !locationId || !accountId) {
    return res.status(400).json({ error: 'accessToken, locationId och accountId krävs' });
  }
  const prefix = `/seo-mcp/integrations/${customerId}`;
  try {
    await Promise.all([
      ssm.send(new PutParameterCommand({ Name: `${prefix}/gbp-access-token`,  Value: accessToken,  Type: 'SecureString', Overwrite: true })),
      ssm.send(new PutParameterCommand({ Name: `${prefix}/gbp-location-id`,   Value: locationId,   Type: 'String',       Overwrite: true })),
      ssm.send(new PutParameterCommand({ Name: `${prefix}/gbp-account-id`,    Value: accountId,    Type: 'String',       Overwrite: true })),
      ...(refreshToken ? [ssm.send(new PutParameterCommand({ Name: `${prefix}/gbp-refresh-token`, Value: refreshToken, Type: 'SecureString', Overwrite: true }))] : [])
    ]);
    // Rensa cache sa att nya värden hämtas direkt
    delete paramCache[`${prefix}/gbp-access-token`];
    delete paramCache[`${prefix}/gbp-refresh-token`];
    delete paramCache[`${prefix}/gbp-location-id`];
    delete paramCache[`${prefix}/gbp-account-id`];
    res.json({ success: true, message: 'GBP-credentials sparade' });
  } catch (err) {
    console.error('[GBP connect] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/gbp/reviews — hämta recensioner
app.get('/api/customers/:id/gbp/reviews', async (req, res) => {
  const customerId = req.params.id;
  const prefix = `/seo-mcp/integrations/${customerId}`;
  const limit = parseInt(req.query.limit, 10) || 20;
  try {
    let accessToken = await getParamSafe(`${prefix}/gbp-access-token`);
    const locationId = await getParamSafe(`${prefix}/gbp-location-id`);
    if (!accessToken || !locationId) {
      return res.status(400).json({ error: 'GBP inte konfigurerat för denna kund', configured: false });
    }
    // Försök förnya token om refresh-token finns
    const refreshToken  = await getParamSafe(`${prefix}/gbp-refresh-token`);
    const clientId      = await getParamSafe('/seo-mcp/integrations/gbp-client-id');
    const clientSecret  = await getParamSafe('/seo-mcp/integrations/gbp-client-secret');
    if (refreshToken && clientId && clientSecret) {
      try {
        const refreshed = await gbp.refreshAccessToken(refreshToken, clientId, clientSecret);
        accessToken = refreshed.accessToken;
        // Uppdatera SSM med ny token i bakgrunden
        ssm.send(new PutParameterCommand({ Name: `${prefix}/gbp-access-token`, Value: accessToken, Type: 'SecureString', Overwrite: true }))
          .catch(e => console.error('[GBP] SSM token-uppdatering fel:', e.message));
        delete paramCache[`${prefix}/gbp-access-token`];
      } catch (e) {
        console.error('[GBP] Token-förnyelse misslyckades, försöker med befintlig token:', e.message);
      }
    }
    const reviews = await gbp.getReviews(accessToken, locationId, limit);
    res.json({ success: true, reviews, total: reviews.length });
  } catch (err) {
    console.error('[GBP reviews] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/gbp/reviews/:reviewId/reply — svara på recension
app.post('/api/customers/:id/gbp/reviews/:reviewId/reply', async (req, res) => {
  const customerId = req.params.id;
  const reviewId   = req.params.reviewId;
  const { replyText, autoGenerate } = req.body;
  const prefix = `/seo-mcp/integrations/${customerId}`;

  if (!autoGenerate && (!replyText || !replyText.trim())) {
    return res.status(400).json({ error: 'replyText krävs, eller ange autoGenerate: true' });
  }

  try {
    let accessToken = await getParamSafe(`${prefix}/gbp-access-token`);
    const locationId = await getParamSafe(`${prefix}/gbp-location-id`);
    if (!accessToken || !locationId) {
      return res.status(400).json({ error: 'GBP inte konfigurerat för denna kund', configured: false });
    }

    // Tokenförnyelse
    const refreshToken  = await getParamSafe(`${prefix}/gbp-refresh-token`);
    const clientId      = await getParamSafe('/seo-mcp/integrations/gbp-client-id');
    const clientSecret  = await getParamSafe('/seo-mcp/integrations/gbp-client-secret');
    if (refreshToken && clientId && clientSecret) {
      try {
        const refreshed = await gbp.refreshAccessToken(refreshToken, clientId, clientSecret);
        accessToken = refreshed.accessToken;
        ssm.send(new PutParameterCommand({ Name: `${prefix}/gbp-access-token`, Value: accessToken, Type: 'SecureString', Overwrite: true }))
          .catch(e => console.error('[GBP] SSM token-uppdatering fel:', e.message));
        delete paramCache[`${prefix}/gbp-access-token`];
      } catch (e) {
        console.error('[GBP] Token-förnyelse misslyckades:', e.message);
      }
    }

    let finalReplyText = replyText;

    if (autoGenerate) {
      // Hämta recensionens innehåll för AI
      const reviews = await gbp.getReviews(accessToken, locationId, 50);
      const review = reviews.find(r => r.reviewId === reviewId);
      if (!review) return res.status(404).json({ error: 'Recensionen hittades inte' });

      const anthropicKey = await getParamSafe('/seo-mcp/anthropic/api-key');
      const companyName  = await getParamSafe(`${prefix}/company-name`);
      const generated = await gbp.generateReviewReply(review, { companyName }, anthropicKey);
      finalReplyText = generated.replyText;

      // Preview-läge: returnera utan att posta
      if (req.body.preview) {
        return res.json({ success: true, preview: true, replyText: finalReplyText, review });
      }
    }

    const result = await gbp.replyToReview(accessToken, locationId, reviewId, finalReplyText);
    res.json({ success: true, result, replyText: finalReplyText });
  } catch (err) {
    console.error('[GBP reply] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/customers/:id/gbp/posts — skapa GBP-inlägg
app.post('/api/customers/:id/gbp/posts', async (req, res) => {
  const customerId = req.params.id;
  const { summary, actionType, actionUrl, mediaUrl } = req.body;
  const prefix = `/seo-mcp/integrations/${customerId}`;

  if (!summary || !summary.trim()) {
    return res.status(400).json({ error: 'summary krävs' });
  }

  try {
    let accessToken = await getParamSafe(`${prefix}/gbp-access-token`);
    const locationId = await getParamSafe(`${prefix}/gbp-location-id`);
    if (!accessToken || !locationId) {
      return res.status(400).json({ error: 'GBP inte konfigurerat för denna kund', configured: false });
    }

    // Tokenförnyelse
    const refreshToken  = await getParamSafe(`${prefix}/gbp-refresh-token`);
    const clientId      = await getParamSafe('/seo-mcp/integrations/gbp-client-id');
    const clientSecret  = await getParamSafe('/seo-mcp/integrations/gbp-client-secret');
    if (refreshToken && clientId && clientSecret) {
      try {
        const refreshed = await gbp.refreshAccessToken(refreshToken, clientId, clientSecret);
        accessToken = refreshed.accessToken;
        ssm.send(new PutParameterCommand({ Name: `${prefix}/gbp-access-token`, Value: accessToken, Type: 'SecureString', Overwrite: true }))
          .catch(e => console.error('[GBP] SSM token-uppdatering fel:', e.message));
        delete paramCache[`${prefix}/gbp-access-token`];
      } catch (e) {
        console.error('[GBP] Token-förnyelse misslyckades:', e.message);
      }
    }

    const postData = {
      summary: summary.trim(),
      ...(actionType && actionUrl ? { callToAction: { actionType, url: actionUrl } } : {}),
      ...(mediaUrl ? { media: { url: mediaUrl } } : {})
    };

    const result = await gbp.createPost(accessToken, locationId, postData);
    res.json({ success: true, post: result.post });
  } catch (err) {
    console.error('[GBP post] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// Möjligheter — Content Opportunities
// ══════════════════════════════════════════════════════════════

app.get('/api/opportunities', async (req, res) => {
  try {
    const { bq, datasetId } = await getBigQuery();
    const { customerId, type, status, limit = 200 } = req.query;
    let where = 'WHERE 1=1';
    const params = { lim: parseInt(limit) };
    if (customerId) { where += ' AND customer_id = @cid'; params.cid = customerId; }
    if (type)       { where += ' AND opportunity_type = @type'; params.type = type; }
    if (status)     { where += ' AND status = @status'; params.status = status; }
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${datasetId}.content_opportunities\` ${where} ORDER BY potential_score DESC, created_at DESC LIMIT @lim`,
      params,
    }).catch(() => [[]]);
    res.json({ opportunities: rows || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.patch('/api/opportunities/:oppId', async (req, res) => {
  try {
    const { bq, projectId, datasetId } = await getBigQuery();
    const { status } = req.body;
    if (!['pending','in_queue','done'].includes(status)) return res.status(400).json({ error: 'Ogiltigt status' });
    await bq.query({
      query: `UPDATE \`${projectId}.${datasetId}.content_opportunities\` SET status = @status WHERE opp_id = @oppId`,
      params: { status, oppId: req.params.oppId },
    });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ══════════════════════════════════════════════════════════════
// CLIENT HEALTH SCORE
// ══════════════════════════════════════════════════════════════

// GET /api/customers/:id/health-score
app.get('/api/customers/:id/health-score', async (req, res) => {
  const customerId = req.params.id;
  try {
    const { bq, dataset } = await getBigQuery();
    const now = new Date();
    const d7  = new Date(now - 7  * 86400000).toISOString().slice(0, 10);
    const d14 = new Date(now - 14 * 86400000).toISOString().slice(0, 10);
    const d30 = new Date(now - 30 * 86400000).toISOString().slice(0, 10);

    // 1. GSC-trafik: clicks senaste 7d vs föregående 7d
    let trafficScore = 0;
    let trafficDetail = 'Ingen GSC-data';
    let trafficTrend = 'stable';
    try {
      const [trafficRows] = await bq.query({
        query: `SELECT
          COALESCE(SUM(IF(date >= @d7,  clicks, 0)), 0) AS clicks_curr,
          COALESCE(SUM(IF(date >= @d14 AND date < @d7, clicks, 0)), 0) AS clicks_prev
          FROM \`${dataset}.gsc_daily_metrics\`
          WHERE customer_id = @cid AND date >= @d14`,
        params: { cid: customerId, d7, d14 }
      });
      if (trafficRows.length > 0) {
        const curr = Number(trafficRows[0].clicks_curr || 0);
        const prev = Number(trafficRows[0].clicks_prev || 0);
        if (prev === 0 && curr === 0) {
          trafficScore = 0; trafficDetail = 'Inga klick senaste 14d';
        } else if (prev === 0) {
          trafficScore = 25; trafficDetail = `${curr} klick (ingen förra vecka)`; trafficTrend = 'improving';
        } else {
          const changePct = Math.round(((curr - prev) / prev) * 100);
          if (curr > prev * 1.02)  { trafficScore = 25; trafficTrend = 'improving'; }
          else if (curr >= prev * 0.95) { trafficScore = 15; trafficTrend = 'stable'; }
          else { trafficScore = 5; trafficTrend = 'declining'; }
          const sign = changePct >= 0 ? '+' : '';
          trafficDetail = `${sign}${changePct}% trafik vs förra veckan (${curr} vs ${prev} klick)`;
        }
      }
    } catch (e) { /* GSC-tabell kanske saknas */ }

    // 2. Genomsnittsposition senaste 7d
    let positionScore = 0;
    let positionDetail = 'Ingen positionsdata';
    try {
      const [posRows] = await bq.query({
        query: `SELECT AVG(position) AS avg_pos FROM \`${dataset}.gsc_daily_metrics\`
                WHERE customer_id = @cid AND date >= @d7`,
        params: { cid: customerId, d7 }
      });
      if (posRows.length > 0 && posRows[0].avg_pos != null) {
        const avgPos = Math.round(Number(posRows[0].avg_pos) * 10) / 10;
        if (avgPos <= 5)       positionScore = 20;
        else if (avgPos <= 10) positionScore = 15;
        else if (avgPos <= 15) positionScore = 10;
        else if (avgPos <= 20) positionScore = 5;
        positionDetail = `Snitt pos ${avgPos}`;
      }
    } catch (e) { /* */ }

    // 3. Optimeringshistorik senaste 30d
    let optsScore = 0;
    let optsDetail = '0 optimeringar senaste 30d';
    try {
      const [optsRows] = await bq.query({
        query: `SELECT COUNT(*) AS cnt FROM \`${dataset}.seo_optimization_log\`
                WHERE customer_id = @cid AND timestamp >= @d30`,
        params: { cid: customerId, d30 }
      });
      const cnt = Number(optsRows[0]?.cnt || 0);
      if (cnt >= 10)     optsScore = 20;
      else if (cnt >= 5) optsScore = 15;
      else if (cnt >= 1) optsScore = 10;
      optsDetail = `${cnt} opt senaste 30d`;
    } catch (e) { /* */ }

    // 4. Keywords på sida 1 (position ≤10) senaste 7d
    let kwScore = 0;
    let kwDetail = 'Ingen nyckelordsdata';
    try {
      const [kwRows] = await bq.query({
        query: `SELECT
          COUNT(DISTINCT query) AS total_kw,
          COUNTIF(position <= 10) AS top10_kw
          FROM (
            SELECT query, AVG(position) AS position
            FROM \`${dataset}.gsc_daily_metrics\`
            WHERE customer_id = @cid AND date >= @d7
            GROUP BY query
          )`,
        params: { cid: customerId, d7 }
      });
      if (kwRows.length > 0) {
        const total = Number(kwRows[0].total_kw || 0);
        const top10 = Number(kwRows[0].top10_kw || 0);
        if (total > 0) {
          const pct = Math.round((top10 / total) * 100);
          if (pct >= 30)     kwScore = 20;
          else if (pct >= 15) kwScore = 15;
          else if (pct >= 5)  kwScore = 10;
          kwDetail = `${pct}% på sida 1 (${top10}/${total} sökord)`;
        }
      }
    } catch (e) { /* */ }

    // 5. Arbetsköstatus — antal pending tasks
    let queueScore = 15;
    let queueDetail = '0 väntande uppgifter';
    try {
      const [qRows] = await bq.query({
        query: `SELECT COUNT(*) AS cnt FROM \`${dataset}.seo_work_queue\`
                WHERE customer_id = @cid AND status = 'pending'`,
        params: { cid: customerId }
      });
      const pending = Number(qRows[0]?.cnt || 0);
      if (pending === 0)       queueScore = 15;
      else if (pending <= 3)   queueScore = 10;
      else if (pending <= 10)  queueScore = 5;
      else                     queueScore = 0;
      queueDetail = `${pending} väntande uppgifter`;
    } catch (e) { /* */ }

    // Totalsumma + betyg
    const score = trafficScore + positionScore + optsScore + kwScore + queueScore;
    let grade;
    if (score >= 90) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 50) grade = 'C';
    else if (score >= 30) grade = 'D';
    else grade = 'F';

    let trend;
    if (trafficTrend === 'improving' || optsScore >= 15) trend = 'improving';
    else if (trafficTrend === 'declining' && optsScore < 10) trend = 'declining';
    else trend = 'stable';

    res.json({
      score,
      grade,
      breakdown: {
        traffic:       { score: trafficScore,  max: 25, detail: trafficDetail },
        position:      { score: positionScore, max: 20, detail: positionDetail },
        optimizations: { score: optsScore,     max: 20, detail: optsDetail },
        keywords:      { score: kwScore,       max: 20, detail: kwDetail },
        queue:         { score: queueScore,    max: 15, detail: queueDetail }
      },
      trend,
      calculated_at: now.toISOString()
    });
  } catch (err) {
    console.error('[health-score] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// H1 OPTIMIZER
// ══════════════════════════════════════════════════════════════

// POST /api/customers/:id/optimize-h1
app.post('/api/customers/:id/optimize-h1', async (req, res) => {
  const customerId = req.params.id;
  const { dryRun = true, pageIds } = req.body;
  try {
    // Hämta WP-credentials
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);
    if (!site || !site['app-password'] || site['app-password'] === 'placeholder') {
      return res.status(400).json({ error: 'WordPress-credentials saknas eller ej aktiverade för denna kund.' });
    }

    // E-handelsskydd via SSM
    const isEcommerce = await getParam(`/seo-mcp/integrations/${customerId}/is-ecommerce`).catch(() => null);

    // Hämta alla publicerade sidor och inlägg
    let pages = [], posts = [];
    try { pages = await wpApi(site, 'GET', '/pages?per_page=100&status=publish'); } catch (e) { /* */ }
    try { posts = await wpApi(site, 'GET', '/posts?per_page=100&status=publish'); } catch (e) { /* */ }

    let allItems = [...pages.map(p => ({ ...p, _type: 'pages' })), ...posts.map(p => ({ ...p, _type: 'posts' }))];

    // Filtrera på pageIds om angivet
    if (pageIds && Array.isArray(pageIds) && pageIds.length > 0) {
      allItems = allItems.filter(item => pageIds.includes(item.id));
    }

    const claude = await getClaude();
    const model = await getModel('haiku');

    const suggestions = [];
    let updated = 0;
    let skipped_ecommerce = 0;

    for (const item of allItems) {
      const content = item.content?.rendered || '';
      const title   = item.title?.rendered || '';
      const pageUrl = item.link || item.slug || String(item.id);

      // E-handelsskydd
      const contentHasShopCodes = /\[woocommerce|vc_woocommerce|\[product/i.test(content);
      if (isEcommerce === 'true' || contentHasShopCodes) {
        skipped_ecommerce++;
        continue;
      }

      // Extrahera befintlig H1
      const h1Match = content.match(/<h1[^>]*>(.*?)<\/h1>/is);
      const currentH1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : null;

      // Skippa om H1 redan finns och skiljer sig från sidtiteln (redan optimerad)
      const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
      const needsOptimization = !currentH1 || currentH1.toLowerCase() === cleanTitle.toLowerCase();
      if (!needsOptimization) continue;

      // Claude Haiku: generera förbättrat H1
      let newH1 = null;
      try {
        const prompt = `Du är en SEO-expert. Generera ett optimerat H1-rubrik för denna webbsida.
Sidtitel: "${cleanTitle}"
URL: ${pageUrl}
Nuvarande H1: ${currentH1 ? `"${currentH1}"` : 'saknas'}

Krav:
- 20-60 tecken
- Innehåll sökordsfokuserat (svenska)
- Skilj sig från sidtiteln om möjligt
- Returnera BARA det nya H1-texten, inget annat`;

        const resp = await claude.messages.create({
          model,
          max_tokens: 100,
          messages: [{ role: 'user', content: prompt }]
        });
        newH1 = (resp.content?.[0]?.text || '').trim().replace(/^["']|["']$/g, '');
      } catch (e) {
        newH1 = null;
      }

      if (!newH1) continue;

      suggestions.push({
        id: item.id,
        type: item._type,
        url: pageUrl,
        current_h1: currentH1,
        page_title: cleanTitle,
        suggested_h1: newH1
      });

      // Om inte dryRun: uppdatera sidan via WP REST API
      if (!dryRun) {
        try {
          let updatedContent;
          if (currentH1 && h1Match) {
            // Ersätt befintlig H1
            updatedContent = content.replace(/<h1[^>]*>.*?<\/h1>/is, `<h1>${newH1}</h1>`);
          } else {
            // Lägg till H1 längst upp i innehållet
            updatedContent = `<h1>${newH1}</h1>\n${content}`;
          }
          await wpApi(site, 'POST', `/${item._type}/${item.id}`, { content: updatedContent });

          // Logga i BigQuery
          await logOptimization({
            customer_id:       customerId,
            site_url:          site.url,
            page_url:          pageUrl,
            optimization_type: 'h1_optimization',
            original_value:    currentH1 || '',
            new_value:         newH1,
            impact_estimate:   'medium',
            performed_by:      'h1-optimizer'
          });

          updated++;
        } catch (e) {
          console.error(`[h1-optimizer] Kunde inte uppdatera ${pageUrl}:`, e.message);
        }
      }
    }

    res.json({
      processed:         suggestions.length + skipped_ecommerce,
      suggestions,
      updated:           dryRun ? 0 : updated,
      skipped_ecommerce,
      dryRun
    });
  } catch (err) {
    console.error('[h1-optimizer] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// INTERNAL LINKING ANALYZER
// ══════════════════════════════════════════════════════════════

// GET /api/customers/:id/internal-links
app.get('/api/customers/:id/internal-links', async (req, res) => {
  const customerId = req.params.id;
  try {
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);
    if (!site || !site['app-password'] || site['app-password'] === 'placeholder') {
      return res.status(400).json({ error: 'WordPress-credentials saknas eller ej aktiverade för denna kund.' });
    }

    const companyName = await getParam(`/seo-mcp/integrations/${customerId}/company-name`).catch(() => customerId);
    const siteUrl = site.url.replace(/\/$/, '');

    // Hämta alla publicerade sidor och inlägg
    let pages = [], posts = [];
    try { pages = await wpApi(site, 'GET', '/pages?per_page=100&status=publish'); } catch (e) { /* */ }
    try { posts = await wpApi(site, 'GET', '/posts?per_page=100&status=publish'); } catch (e) { /* */ }
    await new Promise(r => setTimeout(r, 200));

    const allItems = [
      ...pages.map(p => ({ id: p.id, url: p.link || '', title: (p.title?.rendered || '').replace(/<[^>]+>/g, '').trim(), content: p.content?.rendered || '', type: 'page' })),
      ...posts.map(p => ({ id: p.id, url: p.link || '', title: (p.title?.rendered || '').replace(/<[^>]+>/g, '').trim(), content: p.content?.rendered || '', type: 'post' }))
    ];

    // Bygg URL-index för snabb uppslag
    const urlSet = new Set(allItems.map(p => p.url.replace(/\/$/, '')));

    // Hjälpfunktion: extrahera interna länkar från HTML-innehåll
    function extractInternalLinks(html, fromUrl) {
      const links = [];
      const re = /<a\s[^>]*href=["']([^"']+)["'][^>]*>/gi;
      let m;
      while ((m = re.exec(html)) !== null) {
        const href = m[1];
        // Intern länk: börjar med siteUrl eller relativ
        let fullUrl = href;
        if (href.startsWith('/') && !href.startsWith('//')) {
          fullUrl = siteUrl + href;
        }
        fullUrl = fullUrl.replace(/\/$/, '').split('#')[0].split('?')[0];
        if (fullUrl.startsWith(siteUrl) && fullUrl !== fromUrl.replace(/\/$/, '')) {
          links.push(fullUrl);
        }
      }
      return [...new Set(links)];
    }

    // Beräkna outbound + bygg inbound-karta
    const inboundMap = {}; // url -> [källsida-url]
    allItems.forEach(p => { inboundMap[p.url.replace(/\/$/, '')] = []; });

    const pageData = allItems.map(p => {
      const outbound = extractInternalLinks(p.content, p.url);
      return { id: p.id, url: p.url, title: p.title, type: p.type, outboundLinks: outbound, inboundLinks: [] };
    });

    // Fyll inbound
    pageData.forEach(p => {
      p.outboundLinks.forEach(targetUrl => {
        const key = targetUrl.replace(/\/$/, '');
        if (inboundMap[key] !== undefined) {
          inboundMap[key].push(p.url);
        }
      });
    });

    // Tilldela inbound
    pageData.forEach(p => {
      p.inboundLinks = [...new Set(inboundMap[p.url.replace(/\/$/, '')] || [])];
      p.internalLinksCount = p.outboundLinks.length;
    });

    // Analysresultat
    const orphanPages    = pageData.filter(p => p.inboundLinks.length === 0);
    const lowLinked      = pageData.filter(p => p.inboundLinks.length > 0 && p.inboundLinks.length < 2);
    const topLinked      = [...pageData].sort((a, b) => b.inboundLinks.length - a.inboundLinks.length).slice(0, 5);
    const avgLinksPerPage = pageData.length ? (pageData.reduce((s, p) => s + p.inboundLinks.length, 0) / pageData.length).toFixed(1) : 0;

    // Claude Haiku: förslag på internlänkningar
    let suggestions = [];
    try {
      const claude = await getClaude();
      const model  = await getModel('haiku');
      const prompt = `Analysera dessa internlänkar för ${companyName} och föreslå 3-5 nya länkningar.
Fokusera på: orphan pages (inga inkommande), sidor med låg synlighet men bra innehåll.
Svara på svenska med konkreta förslag: "Lägg till länk från /url/ till /url/ med ankartexten 'X'"
Sidor: ${JSON.stringify(pageData.map(p => ({ url: p.url, title: p.title, inbound: p.inboundLinks.length })))}`;

      const resp = await claude.messages.create({
        model,
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }]
      });
      const raw = (resp.content?.[0]?.text || '').trim();
      // Dela upp på radbrytningar och filtrera tomma rader
      suggestions = raw.split('\n').map(s => s.trim()).filter(s => s.length > 10 && /länk/i.test(s));
      if (!suggestions.length) suggestions = [raw];
    } catch (e) {
      console.error('[internal-links] Claude-fel:', e.message);
    }

    res.json({
      customerId,
      totalPages: pageData.length,
      avgLinksPerPage: Number(avgLinksPerPage),
      pages: pageData,
      orphanPages: orphanPages.map(p => ({ id: p.id, url: p.url, title: p.title })),
      lowLinked: lowLinked.map(p => ({ id: p.id, url: p.url, title: p.title, inboundCount: p.inboundLinks.length })),
      topLinked: topLinked.map(p => ({ id: p.id, url: p.url, title: p.title, inboundCount: p.inboundLinks.length })),
      suggestions
    });
  } catch (err) {
    console.error('[internal-links] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// BULK META OPTIMIZER
// ══════════════════════════════════════════════════════════════

// POST /api/customers/:id/bulk-optimize-meta
app.post('/api/customers/:id/bulk-optimize-meta', async (req, res) => {
  const customerId = req.params.id;
  const { pageIds, dryRun = false } = req.body;
  try {
    const sites = await getWordPressSites();
    const site = sites.find(s => s.id === customerId);
    if (!site || !site['app-password'] || site['app-password'] === 'placeholder') {
      return res.status(400).json({ error: 'WordPress-credentials saknas eller ej aktiverade för denna kund.' });
    }

    const companyName = await getParam(`/seo-mcp/integrations/${customerId}/company-name`).catch(() => customerId);

    // Hämta alla publicerade sidor och inlägg
    let pages = [], posts = [];
    try { pages = await wpApi(site, 'GET', '/pages?per_page=100&status=publish'); } catch (e) { /* */ }
    await new Promise(r => setTimeout(r, 200));
    try { posts = await wpApi(site, 'GET', '/posts?per_page=100&status=publish'); } catch (e) { /* */ }

    let allItems = [
      ...pages.map(p => ({ ...p, _type: 'pages' })),
      ...posts.map(p => ({ ...p, _type: 'posts' }))
    ];

    // Filtrera på pageIds om angivet
    if (pageIds && Array.isArray(pageIds) && pageIds.length > 0) {
      allItems = allItems.filter(item => pageIds.includes(item.id));
    }

    // Hjälpfunktion: kolla om title/description behöver optimering
    function needsOptimization(item) {
      const title = (item.yoast_head_json?.title || item.title?.rendered || '').replace(/<[^>]+>/g, '').trim();
      const desc  = (item.yoast_head_json?.description || item.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim();
      const titleBad = !title || title.length < 50 || title.length > 65;
      const descBad  = !desc  || desc.length < 120  || desc.length > 160;
      return titleBad || descBad;
    }

    // Filtrera sidor som behöver optimering
    const toOptimize = allItems.filter(needsOptimization).slice(0, 20); // max 20 per batch
    const skippedCount = allItems.length - toOptimize.length;

    if (toOptimize.length === 0) {
      return res.json({ optimized: 0, skipped: skippedCount, errors: [], results: [], message: 'Alla sidor är redan optimerade.' });
    }

    // Bygg payload till Claude
    const pagesPayload = toOptimize.map(item => ({
      id: item.id,
      url: item.link || item.slug || String(item.id),
      title: (item.title?.rendered || '').replace(/<[^>]+>/g, '').trim(),
      excerpt: (item.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim().substring(0, 300)
    }));

    // Batch-anrop till Claude Haiku — ett enda anrop för alla sidor
    const claude = await getClaude();
    const model  = await getModel('haiku');
    const prompt = `Företag: ${companyName}. Optimera SEO title + meta description för dessa ${pagesPayload.length} sidor.
Svara med BARA ett JSON-array: [{"id":1,"title":"...","description":"..."},...]
Regler: title 55-65 tecken, description 140-160 tecken, inkludera primärt nyckelord, svenska.
Sidor: ${JSON.stringify(pagesPayload)}`;

    let claudeResults = [];
    try {
      const resp = await claude.messages.create({
        model,
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });
      claudeResults = parseClaudeJSON(resp.content[0].text);
    } catch (e) {
      return res.status(500).json({ error: 'Claude kunde inte generera förslag: ' + e.message });
    }

    // Bygg resultat-array med old/new
    const results = [];
    const errors  = [];
    let optimized = 0;

    for (const suggestion of claudeResults) {
      const item = toOptimize.find(p => p.id === suggestion.id);
      if (!item) continue;

      const oldTitle = (item.title?.rendered || '').replace(/<[^>]+>/g, '').trim();
      const oldDesc  = (item.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim();

      results.push({
        pageId: item.id,
        url: item.link || item.slug || String(item.id),
        type: item._type,
        oldTitle,
        newTitle: suggestion.title || oldTitle,
        oldDesc,
        newDesc: suggestion.description || oldDesc
      });

      if (!dryRun) {
        try {
          // Uppdatera via WP REST API med Rank Math-meta
          await wpApi(site, 'POST', `/${item._type}/${item.id}`, {
            meta: {
              rank_math_title: suggestion.title,
              rank_math_description: suggestion.description
            }
          });
          await new Promise(r => setTimeout(r, 200));

          // Logga i BigQuery
          await logOptimization({
            customer_id:       customerId,
            site_url:          site.url,
            page_url:          item.link || String(item.id),
            optimization_type: 'bulk_meta',
            original_value:    oldTitle,
            new_value:         suggestion.title,
            impact_estimate:   'medium',
            performed_by:      'bulk-meta-optimizer'
          });

          optimized++;
        } catch (e) {
          errors.push({ pageId: item.id, url: item.link || String(item.id), error: e.message });
        }
      }
    }

    res.json({
      optimized: dryRun ? 0 : optimized,
      skipped: skippedCount,
      dryRun,
      errors,
      results
    });
  } catch (err) {
    console.error('[bulk-meta] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// LLM.TXT GENERATOR — GEO (Generative Engine Optimization)
// Skapar en AI-läsbar fil för varje kundsite som hjälper
// ChatGPT Search, Perplexity, Google AI Overviews att förstå sajten.
// ══════════════════════════════════════════════════════════════

// POST /api/customers/:id/generate-llm-txt
// body: { upload: true|false (default false = bara returnera), model: 'haiku'|'sonnet' }
app.post('/api/customers/:id/generate-llm-txt', async (req, res) => {
  const customerId = req.params.id;
  const { upload = false } = req.body;
  try {
    const companyName = await getParamSafe(`/seo-mcp/integrations/${customerId}/company-name`) || customerId;
    const siteUrl     = await getParamSafe(`/seo-mcp/wordpress/${customerId}/url`) ||
                        await getParamSafe(`/seo-mcp/integrations/${customerId}/url`) || '';
    const wpUser      = await getParamSafe(`/seo-mcp/wordpress/${customerId}/username`);
    const wpPass      = await getParamSafe(`/seo-mcp/wordpress/${customerId}/app-password`);

    // Hämta sidor och nyckelord för kontext
    let pages = [], keywords = [];
    if (siteUrl && wpUser && wpPass && wpPass !== 'placeholder') {
      try {
        const pagesRes = await axios.get(`${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages?per_page=20&status=publish&_fields=id,title,link,excerpt`, {
          auth: { username: wpUser, password: wpPass }, timeout: 10000,
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });
        pages = pagesRes.data || [];
      } catch { /* WP ej åtkomlig */ }
    }

    // Hämta keywords från BQ
    try {
      const { bq, datasetId } = await getBigQuery();
      const [rows] = await bq.query({
        query: `SELECT keyword, classification FROM \`${datasetId}.customer_keywords\` WHERE customer_id = @cid AND classification IN ('A','B') ORDER BY classification, search_volume DESC LIMIT 20`,
        params: { cid: customerId },
      }).catch(() => [[]]);
      keywords = (rows || []).map(r => r.keyword);
    } catch { /* BQ ej tillgänglig */ }

    // Hämta GSC top queries om tillgängligt
    let topQueries = [];
    try {
      const gscProp = await getParamSafe(`/seo-mcp/integrations/${customerId}/gsc-property`);
      if (gscProp) {
        const gscData = await fetchGSCData(customerId, gscProp, 14);
        topQueries = (gscData || []).slice(0, 10).map(q => q.query).filter(Boolean);
      }
    } catch { /* GSC ej tillgänglig */ }

    // Generera llm.txt med Claude
    const anthropicKey = await getParamSafe('/seo-mcp/anthropic/api-key');
    if (!anthropicKey) return res.status(500).json({ error: 'Anthropic API-nyckel saknas' });

    const client = new (require('@anthropic-ai/sdk'))({ apiKey: anthropicKey });

    const pageList = pages.slice(0, 15).map(p =>
      `- [${(p.title?.rendered || '').replace(/<[^>]+>/g,'')}](${p.link}): ${(p.excerpt?.rendered || '').replace(/<[^>]+>/g,'').trim().substring(0,100)}`
    ).join('\n');

    const prompt = `Skapa en llm.txt-fil för ${companyName} (${siteUrl}).

llm.txt är ett standardformat (inspirerat av robots.txt) som hjälper AI-sökmotorer (ChatGPT, Perplexity, Google AI Overviews) förstå en webbplats.

Format:
# Företagsnamn

> Kort beskrivning (2-3 meningar) om vad företaget erbjuder

## Om oss
[2-4 meningar med fakta om företaget]

## Produkter/Tjänster
[Bullet-lista med huvudprodukter/-tjänster och vad de innebär]

## Vanliga frågor om oss
[3-5 FAQ-frågor med korta svar som AI:er sannolikt ställer]

## Kontakt
[Kontaktinfo om tillgänglig]

## Viktiga sidor
[Lista med de viktigaste sidorna från sidlistan nedan]

---
Befintliga sidor:
${pageList || '(inga sidor tillgängliga)'}

Nyckelord vi ranknar för: ${keywords.slice(0,10).join(', ') || '(okänt)'}
Top sökfrågor: ${topQueries.join(', ') || '(okänt)'}

Svara BARA med llm.txt-filens innehåll, inget annat. Svenska.`;

    const response = await client.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const llmTxtContent = response.content[0].text.trim();

    // Om upload=true, ladda upp via WP (skapa/uppdatera sida eller fil)
    let uploadResult = null;
    if (upload && siteUrl && wpUser && wpPass && wpPass !== 'placeholder') {
      try {
        // Hitta befintlig llm.txt-sida om den finns
        const searchRes = await axios.get(`${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages?slug=llm-txt&_fields=id`, {
          auth: { username: wpUser, password: wpPass }, timeout: 10000,
          httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
        });
        const existing = (searchRes.data || [])[0];

        const pageData = {
          title: 'llm.txt',
          content: `<pre>${llmTxtContent}</pre>`,
          slug: 'llm-txt',
          status: 'publish',
        };

        if (existing) {
          await axios.post(`${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages/${existing.id}`, pageData, {
            auth: { username: wpUser, password: wpPass }, timeout: 10000,
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
          });
          uploadResult = { action: 'updated', url: `${siteUrl.replace(/\/$/, '')}/llm-txt/` };
        } else {
          const createRes = await axios.post(`${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages`, pageData, {
            auth: { username: wpUser, password: wpPass }, timeout: 10000,
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
          });
          uploadResult = { action: 'created', url: createRes.data?.link || `${siteUrl.replace(/\/$/, '')}/llm-txt/` };
        }
      } catch (e) {
        uploadResult = { action: 'failed', error: e.message };
      }
    }

    res.json({
      customer_id: customerId,
      company_name: companyName,
      site_url: siteUrl,
      llm_txt: llmTxtContent,
      char_count: llmTxtContent.length,
      pages_analyzed: pages.length,
      keywords_used: keywords.length,
      upload: uploadResult,
    });
  } catch (err) {
    console.error('[llm-txt] fel:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/customers/:id/llm-txt — hämta befintlig llm.txt (om uppladdad)
app.get('/api/customers/:id/llm-txt', async (req, res) => {
  const customerId = req.params.id;
  try {
    const siteUrl = await getParamSafe(`/seo-mcp/wordpress/${customerId}/url`) ||
                    await getParamSafe(`/seo-mcp/integrations/${customerId}/url`) || '';
    if (!siteUrl) return res.status(404).json({ error: 'Site URL saknas' });

    const llmRes = await axios.get(`${siteUrl.replace(/\/$/, '')}/llm-txt/`, {
      timeout: 8000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
    }).catch(() => null);

    if (llmRes) {
      const text = (llmRes.data || '').replace(/<[^>]+>/g, '').trim();
      res.json({ exists: true, url: `${siteUrl.replace(/\/$/, '')}/llm-txt/`, content: text.substring(0, 3000) });
    } else {
      res.json({ exists: false, url: null });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════
// Per-kund Social Media Posting — /api/customers/:id/social/*
// ══════════════════════════════════════════════════════════════

// POST /api/customers/:id/social/post — Skapa/schemalägga post
app.post('/api/customers/:id/social/post', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { platform = 'linkedin', message, imageUrl, scheduleTime, post_type = 'tip', topic, useAI = false } = req.body;

    if (!['linkedin', 'instagram', 'facebook'].includes(platform)) {
      return res.status(400).json({ error: 'Ogiltig plattform. Välj: linkedin, instagram, facebook' });
    }

    const { bq, dataset } = await getBigQuery();

    let fullText = message;
    let hook = '', body = '', hashtags = [], suggestedImagePrompt = '';

    // Om useAI=true: generera innehåll med Claude
    if (useAI) {
      const anthropicKey = await getParam('/seo-mcp/anthropic/api-key');
      let customerName = customerId;
      try { customerName = (await getParamSafe(`/seo-mcp/integrations/${customerId}/company-name`)) || customerId; } catch {}

      const generated = await socialPlanner.generatePost({
        platform,
        topic: topic || message,
        postType: post_type,
        customerId,
        customerName,
        anthropicKey,
      });
      fullText = generated.full_text;
      hook = generated.hook;
      body = generated.body;
      hashtags = generated.hashtags || [];
      suggestedImagePrompt = generated.suggested_image_prompt || '';
    } else {
      // Manuell text — dela upp i hook + body
      const lines = (message || '').split('\n');
      hook = lines[0] || '';
      body = lines.slice(1).join('\n').trim();
    }

    const scheduledAt = scheduleTime ? new Date(scheduleTime).toISOString() : socialPlanner.getNextPostDates(1)[0];

    const row = {
      post_id: `${customerId}_${platform}_${Date.now()}`,
      customer_id: customerId,
      platform,
      status: 'approved',
      hook,
      body,
      full_text: fullText,
      hashtags: hashtags.join(','),
      char_count: (fullText || '').length,
      suggested_image_prompt: suggestedImagePrompt || imageUrl || '',
      topic: topic || '',
      post_type,
      scheduled_at: scheduledAt,
      created_at: new Date().toISOString(),
      posted_at: null,
      linkedin_post_id: null,
      error_message: null,
    };

    const table = bq.dataset(dataset).table('social_content_queue');
    await table.insert([row]);

    res.json({ success: true, post: row, scheduled_at: scheduledAt });
  } catch (e) {
    console.error('[social/post] fel:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// POST /api/customers/:id/social/post-now — Posta direkt
app.post('/api/customers/:id/social/post-now', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { platform = 'linkedin', message, imageUrl, post_type = 'tip', topic, useAI = false } = req.body;

    if (!['linkedin', 'instagram', 'facebook'].includes(platform)) {
      return res.status(400).json({ error: 'Ogiltig plattform. Välj: linkedin, instagram, facebook' });
    }

    let fullText = message;

    if (useAI) {
      const anthropicKey = await getParam('/seo-mcp/anthropic/api-key');
      let customerName = customerId;
      try { customerName = (await getParamSafe(`/seo-mcp/integrations/${customerId}/company-name`)) || customerId; } catch {}
      const generated = await socialPlanner.generatePost({
        platform, topic: topic || message, postType: post_type,
        customerId, customerName, anthropicKey,
      });
      fullText = generated.full_text;
    }

    const creds = await getPostingCredentials(customerId, platform);
    const result = await socialPlanner.publishScheduledPost(
      { platform, full_text: fullText, customer_id: customerId },
      creds
    );

    // Logga i BQ
    try {
      const { bq, dataset } = await getBigQuery();
      const table = bq.dataset(dataset).table('social_content_queue');
      await table.insert([{
        post_id: `${customerId}_${platform}_${Date.now()}`,
        customer_id: customerId,
        platform,
        status: 'posted',
        hook: (fullText || '').split('\n')[0] || '',
        body: '',
        full_text: fullText,
        hashtags: '',
        char_count: (fullText || '').length,
        suggested_image_prompt: imageUrl || '',
        topic: topic || '',
        post_type,
        scheduled_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        posted_at: new Date().toISOString(),
        linkedin_post_id: result.post_id || '',
        error_message: null,
      }]);
    } catch (logErr) {
      console.error('[social/post-now] BQ-logg misslyckades:', logErr.message);
    }

    res.json({ success: true, platform_post_id: result.post_id, url: result.url || null });
  } catch (e) {
    console.error('[social/post-now] fel:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// GET /api/customers/:id/social/posts — Lista posts (filter: platform, status, days)
app.get('/api/customers/:id/social/posts', async (req, res) => {
  try {
    const customerId = req.params.id;
    const { platform, status, days = 30 } = req.query;
    const { bq, dataset } = await getBigQuery();

    let where = `customer_id = @cid AND (
      scheduled_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${parseInt(days)} DAY)
      OR status IN ('draft', 'approved', 'scheduled')
    )`;
    const params = { cid: customerId };
    if (platform) { where += ' AND platform = @plat'; params.plat = platform; }
    if (status)   { where += ' AND status = @st';     params.st = status; }

    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.social_content_queue\`
              WHERE ${where}
              ORDER BY scheduled_at DESC
              LIMIT 50`,
      params,
    });

    res.json({ customer_id: customerId, posts: rows || [] });
  } catch (e) {
    console.error('[social/posts] fel:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/customers/:id/social/posts/:postId — Avbryt/radera schemalagd post
app.delete('/api/customers/:id/social/posts/:postId', async (req, res) => {
  try {
    const { id: customerId, postId } = req.params;
    const { bq, dataset, projectId } = await getBigQuery();

    await bq.query({
      query: `DELETE FROM \`${projectId}.${dataset}.social_content_queue\`
              WHERE post_id = @pid AND customer_id = @cid AND status != 'posted'`,
      params: { pid: postId, cid: customerId },
    });

    res.json({ success: true });
  } catch (e) {
    console.error('[social/delete] fel:', e.message);
    res.status(500).json({ error: e.message });
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
  // Ensure social content queue table
  try {
    await ensureSocialQueueTable();
  } catch (e) {
    console.error('Social queue table init error:', e.message);
  }
  // Slack-notis vid uppstart
  slackAlert(`Servern startad — port ${PORT} :rocket:`, 'info');
});
