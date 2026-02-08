const express = require('express');
const { SSMClient, GetParameterCommand, GetParametersByPathCommand, PutParameterCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'dashboard')));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: REGION });

// ── Cache for SSM parameters ──
const paramCache = {};
const CACHE_TTL = 300000; // 5 min

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

async function getWordPressSites() {
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
      return `'${String(v).replace(/'/g, "\\'")}'`;
    });
    const sql = `INSERT INTO \`${dataset}.seo_work_queue\` (${cols.join(', ')}) VALUES (${vals.join(', ')})`;
    await bq.query(sql);
  } catch (err) {
    console.error('BigQuery queue error:', err.message);
  }
}

// ── SE Ranking API helper ──
async function seRankingApi(endpoint) {
  const apiKey = await getParam('/seo-mcp/seranking/api-key').catch(() => null);
  if (!apiKey) return null;
  const res = await axios.get(`https://api4.seranking.com${endpoint}`, {
    headers: { 'Authorization': `Token ${apiKey}` }
  });
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
    { table: 'action_plans', column: 'source', type: 'STRING' },
    { table: 'seo_work_queue', column: 'source', type: 'STRING' }
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

  return { seoData, analysis: JSON.parse(analysis.content[0].text) };
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

  const result = JSON.parse(suggestion.content[0].text);

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

  const result = JSON.parse(faq.content[0].text);

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

  const result = JSON.parse(suggestion.content[0].text);

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
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_pipeline\` ORDER BY updated_at DESC`
    });
    const grouped = {};
    for (const r of rows) {
      if (!grouped[r.stage]) grouped[r.stage] = [];
      grouped[r.stage].push(r);
    }
    // Calculate MRR from active contracts
    const active = grouped.active || [];
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

    const validStages = ['prospect', 'audit', 'proposal', 'contract', 'active', 'completed', 'churned'];
    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: `Ogiltigt steg. Tillåtna: ${validStages.join(', ')}` });
    }

    // Validate contract stage requires extra fields
    if (stage === 'contract' && (!service_type || !monthly_amount_sek || !contract_start_date)) {
      return res.status(400).json({ error: 'contract-steg kräver service_type, monthly_amount_sek, contract_start_date' });
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
      stage: 'active',
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

    res.json({ success: true, customer_id: customerId, stage: 'active' });
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
      // Search all cards on the board for one matching this customer
      const allCards = await trelloApi('GET', `/boards/${boardId}/cards`, { fields: 'name,desc' });
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
          await bq.query(`UPDATE \`${dataset}.customer_pipeline\` SET stage = 'active', stage_updated_at = '${now}', updated_at = '${now}', contract_status = 'active', website_url = '${wordpress_url}', company_name = '${company_name.replace(/'/g, "\\'")}', contact_email = '${contact_email}' WHERE customer_id = '${siteId}'`);
        } else {
          // Create new pipeline entry
          await bqInsert('customer_pipeline', {
            customer_id: siteId, company_name, contact_person: contact_person || null,
            contact_email, website_url: wordpress_url, stage: 'active',
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
