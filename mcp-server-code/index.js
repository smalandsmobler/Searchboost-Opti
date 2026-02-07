const express = require('express');
const { SSMClient, GetParameterCommand, GetParametersByPathCommand, PutParameterCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(express.json());
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
  const res = await ssm.send(new GetParametersByPathCommand({
    Path: '/seo-mcp/wordpress/', Recursive: true, WithDecryption: true
  }));
  const sites = {};
  for (const p of res.Parameters) {
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

// ── BigQuery logging ──
async function logOptimization(entry) {
  try {
    const { bq, dataset } = await getBigQuery();
    await bq.dataset(dataset).table('seo_optimization_log').insert([{
      timestamp: new Date().toISOString(),
      ...entry
    }]);
  } catch (err) {
    console.error('BigQuery log error:', err.message);
  }
}

async function addToWorkQueue(task) {
  try {
    const { bq, dataset } = await getBigQuery();
    await bq.dataset(dataset).table('seo_work_queue').insert([{
      queue_id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      created_at: new Date().toISOString(),
      status: 'pending',
      ...task
    }]);
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
  const boardId = await getParam('/seo-mcp/trello/board-id');
  const lists = await trelloApi('GET', `/boards/${boardId}/lists`);
  const siteList = lists.find(l => l.name.toLowerCase().includes(site.id)) || lists[0];
  await createTrelloCard(
    siteList.id,
    `Metadata: ${result.title.substring(0, 40)}...`,
    `**Typ:** Metadata-optimering\n**Sida:** ${post.link}\n**Keyword:** ${targetKeyword}\n**Ändring:** ${result.reasoning}`
  );

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

    // Test WordPress connection
    let wpConnectionTest = 'ok';
    try {
      const site = { id: siteId, url: wordpress_url.replace(/\/$/, ''), username: wordpress_username, 'app-password': wordpress_app_password };
      await wpApi(site, 'GET', '/posts?per_page=1');
    } catch (wpErr) {
      wpConnectionTest = `failed: ${wpErr.message}`;
    }

    // Create Trello card for new customer
    try {
      const boardId = await getParam('/seo-mcp/trello/board-id');
      const lists = await trelloApi('GET', `/boards/${boardId}/lists`);
      const firstList = lists[0];
      await createTrelloCard(
        firstList.id,
        `Ny kund: ${company_name}`,
        `**Företag:** ${company_name}\n**Kontakt:** ${contact_person || '-'}\n**E-post:** ${contact_email}\n**Webb:** ${wordpress_url}\n**WP-anslutning:** ${wpConnectionTest}\n**Google Ads:** ${google_ads_id || '-'}\n**Meta Pixel:** ${meta_pixel_id || '-'}\n**Registrerad:** ${new Date().toISOString()}`
      );
    } catch (trelloErr) {
      console.error('Trello card creation failed:', trelloErr.message);
    }

    console.log(`[ONBOARD] New customer registered: ${company_name} (${siteId})`);

    res.json({
      success: true,
      siteId,
      wpConnectionTest,
      message: `${company_name} har registrerats! Site ID: ${siteId}`
    });
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
  wpApi
};

// ── Start server ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SEO MCP Server listening on port ${PORT}`);
  console.log(`Region: ${REGION}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
