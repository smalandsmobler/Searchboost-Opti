/**
 * LLMs.txt Generator Lambda
 *
 * Körs varje måndag kl 07:00 CET (EventBridge: cron(0 6 ? * MON *))
 *
 * Genererar llms.txt-filer för varje kundsajt — den nya standarden för att
 * hjälpa AI-modeller (ChatGPT, Claude, Gemini, Perplexity) förstå sajten.
 *
 * llms.txt ≠ robots.txt. Det är en Markdown-karta för AI-crawlare.
 * Format: https://llmstxt.org
 *
 * Flöde per kund:
 * 1. Hämta sidor + inlägg via WP REST API
 * 2. Generera Markdown-innehåll i llms.txt-format
 * 3. Spara via WP REST API som en rotplacerad sida med slug "llms"
 *    (kräver att Searchboost-pluginet har ett rewrite-rule för /llms.txt)
 * 4. Logga i BigQuery: llms_txt_log
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

const ssmCache = new Map();
async function getParam(name) {
  if (ssmCache.has(name)) return ssmCache.get(name);
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  ssmCache.set(name, res.Parameter.Value);
  return res.Parameter.Value;
}
async function getParamSafe(name) {
  try { return await getParam(name); } catch { return null; }
}

let _bq, _projectId, _datasetId;
async function getBQ() {
  if (_bq) return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  _projectId = await getParam('/seo-mcp/bigquery/project-id');
  _datasetId = await getParam('/seo-mcp/bigquery/dataset');
  const credsPath = '/tmp/bq-creds-llms.json';
  fs.writeFileSync(credsPath, creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  _bq = new BigQuery({ projectId: _projectId, keyFilename: credsPath });
  return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
}

async function ensureLogTable(bq, datasetId) {
  const schema = [
    { name: 'log_id',        type: 'STRING', mode: 'REQUIRED' },
    { name: 'customer_id',   type: 'STRING', mode: 'REQUIRED' },
    { name: 'site_url',      type: 'STRING' },
    { name: 'llms_txt',      type: 'STRING' },
    { name: 'page_count',    type: 'INTEGER' },
    { name: 'post_count',    type: 'INTEGER' },
    { name: 'status',        type: 'STRING' },
    { name: 'error_message', type: 'STRING' },
    { name: 'created_at',    type: 'TIMESTAMP' },
  ];
  try {
    await bq.dataset(datasetId).createTable('llms_txt_log', {
      schema: { fields: schema },
      timePartitioning: { type: 'DAY', field: 'created_at' },
    });
  } catch (e) {
    if (!e.message.includes('Already Exists')) throw e;
  }
}

// Sidkategorier för llms.txt-strukturering
const PAGE_CATEGORIES = {
  product:  ['produkt', 'product', 'shop', 'butik', 'sortiment', 'kop', 'order'],
  service:  ['tjanst', 'service', 'erbjudande', 'losung', 'konsult'],
  guide:    ['guide', 'tips', 'hur', 'how', 'rad', 'hjalp', 'learn', 'utbildning'],
  about:    ['om-oss', 'about', 'historia', 'team', 'medarbetare', 'foretag'],
  contact:  ['kontakt', 'contact', 'hitta', 'besok'],
  faq:      ['faq', 'vanliga-fragor', 'fraga'],
  blog:     ['blogg', 'blog', 'nyheter', 'news', 'artikel'],
};

function categorizeSlug(slug) {
  const s = (slug || '').toLowerCase();
  for (const [cat, keywords] of Object.entries(PAGE_CATEGORIES)) {
    if (keywords.some(kw => s.includes(kw))) return cat;
  }
  return 'other';
}

async function fetchWPPages(siteUrl, username, appPassword) {
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const agent = new (require('https').Agent)({ rejectUnauthorized: false });
  const res = await axios.get(
    `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages?per_page=50&status=publish&_fields=id,slug,title,link,excerpt`,
    { headers: { Authorization: `Basic ${auth}` }, timeout: 15000, httpsAgent: agent }
  );
  return res.data || [];
}

async function fetchWPPosts(siteUrl, username, appPassword) {
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const agent = new (require('https').Agent)({ rejectUnauthorized: false });
  const res = await axios.get(
    `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts?per_page=20&status=publish&_fields=id,slug,title,link,excerpt`,
    { headers: { Authorization: `Basic ${auth}` }, timeout: 15000, httpsAgent: agent }
  );
  return res.data || [];
}

// Publicera llms.txt-innehållet som en WordPress-option
// Searchboost-pluginet exponerar det sedan via /llms.txt endpoint.
// Om pluginet inte stöder detta: spara i BQ och Mikael deployer manuellt.
async function publishLlmsTxt(siteUrl, username, appPassword, content) {
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const agent = new (require('https').Agent)({ rejectUnauthorized: false });

  // Försök spara via WP REST settings (kräver manage_options capability)
  try {
    await axios.post(
      `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/settings`,
      { searchboost_llms_txt: content },
      { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, timeout: 15000, httpsAgent: agent }
    );
    return { method: 'wp_settings' };
  } catch (e) {
    // WP settings-endpoint stöder inte custom keys utan plugin-registrering
    // Spara som ett utkast-sida med slug 'llms-txt-content' för manuell deploy
    try {
      const existing = await axios.get(
        `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages?slug=llms-txt-content&_fields=id`,
        { headers: { Authorization: `Basic ${auth}` }, timeout: 10000, httpsAgent: agent }
      );
      const existingId = existing.data?.[0]?.id;

      const payload = {
        title: 'LLMs.txt Content (auto-generated)',
        content: `<!-- DO NOT EDIT. Auto-generated by Searchboost Opti. Deploy to site root as /llms.txt -->\n<pre>${content}</pre>`,
        slug: 'llms-txt-content',
        status: 'draft',
      };

      if (existingId) {
        await axios.post(
          `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages/${existingId}`,
          payload,
          { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, timeout: 15000, httpsAgent: agent }
        );
      } else {
        await axios.post(
          `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages`,
          payload,
          { headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' }, timeout: 15000, httpsAgent: agent }
        );
      }
      return { method: 'wp_draft_page' };
    } catch (e2) {
      return { method: 'bq_only', error: e2.message };
    }
  }
}

function generateLlmsTxtContent(siteUrl, companyName, industryDesc, pages, posts) {
  const domain = siteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Gruppera sidor per kategori
  const grouped = {};
  for (const page of pages) {
    const cat = categorizeSlug(page.slug);
    if (!grouped[cat]) grouped[cat] = [];
    const title = page.title?.rendered || page.slug;
    const excerpt = (page.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim().substring(0, 120);
    grouped[cat].push({ title, url: page.link, excerpt });
  }

  const catLabels = {
    product:  'Produkter och sortiment',
    service:  'Tjänster',
    guide:    'Guider och resurser',
    about:    'Om företaget',
    contact:  'Kontakt',
    faq:      'Vanliga frågor',
    blog:     'Artiklar och nyheter',
    other:    'Övriga sidor',
  };

  let content = `# ${companyName}\n`;
  content += `> ${industryDesc}\n\n`;

  // Lägg till varje kategori om den har sidor
  for (const [cat, label] of Object.entries(catLabels)) {
    const items = grouped[cat];
    if (!items || items.length === 0) continue;

    content += `## ${label}\n`;
    for (const item of items.slice(0, 10)) {
      const desc = item.excerpt ? `: ${item.excerpt}` : '';
      content += `- [${item.title}](${item.url})${desc}\n`;
    }
    content += '\n';
  }

  // Blogginlägg
  if (posts.length > 0) {
    const existingBlog = grouped['blog'] || [];
    if (existingBlog.length === 0) {
      content += `## Artiklar och nyheter\n`;
      for (const post of posts.slice(0, 8)) {
        const title = post.title?.rendered || post.slug;
        const excerpt = (post.excerpt?.rendered || '').replace(/<[^>]+>/g, '').trim().substring(0, 100);
        const desc = excerpt ? `: ${excerpt}` : '';
        content += `- [${title}](${post.link})${desc}\n`;
      }
      content += '\n';
    }
  }

  // Optional-sektion (lägre prioritet för AI-crawlare per llmstxt.org-spec)
  content += `## Optional\n`;
  content += `- [Integritetspolicy](${siteUrl.replace(/\/$/, '')}/integritetspolicy/)\n`;
  content += `- [Sitemap](${siteUrl.replace(/\/$/, '')}/sitemap.xml)\n`;

  return content;
}

// Kund-industribeskrivningar för llms.txt-preamble
const CUSTOMER_DESCRIPTIONS = {
  mobelrondellen:         'Möbelbutik i Småland med bred sortiment av hem- och kontorsmöbler.',
  smalandskontorsmobler:  'Kontorsmöbler och ergonomiska lösningar för kontor och hemmakontor i Sverige.',
  phvast:                 'Konsultbolag i Jönköping med specialisering inom affärsutveckling.',
  kompetensutveckla:      'Kurser och kompetensutveckling för yrkesverksamma i Sverige.',
  ferox:                  'Affärsutveckling och strategisk rådgivning.',
  searchboost:            'SEO-byrå som hjälper svenska företag synas bättre på Google.',
  ilmonte:                'Restaurang med mat och dryck i världsklass.',
  tobler:                 'Professionella tjänster och lösningar.',
  traficator:             'Trafikskola med körkortskurser och körlektioner.',
  wedosigns:              'Skyltar, trycksaker och visuell kommunikation för företag.',
  nordicsnusonline:       'Snus och nikotinprodukter online med snabb leverans i Sverige.',
};

exports.handler = async (event) => {
  console.log('=== LLMS.TXT GENERATOR START ===');

  const { bq, datasetId } = await getBQ();
  await ensureLogTable(bq, datasetId);

  const res = await ssm.send(new GetParametersByPathCommand({
    Path: '/seo-mcp/wordpress/',
    Recursive: true,
    WithDecryption: false,
  }));

  const wpSites = {};
  for (const p of (res.Parameters || [])) {
    const parts = p.Name.replace('/seo-mcp/wordpress/', '').split('/');
    if (parts.length === 2) {
      const [customerId, key] = parts;
      if (!wpSites[customerId]) wpSites[customerId] = {};
      wpSites[customerId][key] = true;
    }
  }

  const eligible = Object.keys(wpSites).filter(cid =>
    wpSites[cid].url && wpSites[cid].username && wpSites[cid]['app-password']
  );

  console.log(`${eligible.length} kunder med WP-credentials`);

  const results = { processed: 0, published: 0, failed: 0, skipped: 0 };
  const logs = [];

  for (const customerId of eligible) {
    const siteUrl     = await getParamSafe(`/seo-mcp/wordpress/${customerId}/url`);
    const wpUser      = await getParamSafe(`/seo-mcp/wordpress/${customerId}/username`);
    const wpPass      = await getParamSafe(`/seo-mcp/wordpress/${customerId}/app-password`);
    const companyName = await getParamSafe(`/seo-mcp/integrations/${customerId}/company-name`) || customerId;

    if (!siteUrl || !wpUser || !wpPass || wpPass === 'placeholder') {
      results.skipped++;
      continue;
    }

    const industryDesc = CUSTOMER_DESCRIPTIONS[customerId] || `${companyName} — svensk verksamhet.`;
    const logEntry = {
      log_id:       `${customerId}_${Date.now()}`,
      customer_id:  customerId,
      site_url:     siteUrl,
      llms_txt:     '',
      page_count:   0,
      post_count:   0,
      status:       'pending',
      error_message: null,
      created_at:   new Date().toISOString(),
    };

    try {
      const [pages, posts] = await Promise.all([
        fetchWPPages(siteUrl, wpUser, wpPass).catch(() => []),
        fetchWPPosts(siteUrl, wpUser, wpPass).catch(() => []),
      ]);

      const content = generateLlmsTxtContent(siteUrl, companyName, industryDesc, pages, posts);
      logEntry.llms_txt  = content;
      logEntry.page_count = pages.length;
      logEntry.post_count = posts.length;

      const publishResult = await publishLlmsTxt(siteUrl, wpUser, wpPass, content);
      logEntry.status = 'published';
      if (publishResult.error) logEntry.error_message = publishResult.error;

      results.published++;
      console.log(`  ${companyName}: llms.txt genererat (${pages.length} sidor, ${posts.length} inlägg) via ${publishResult.method}`);
    } catch (e) {
      logEntry.status = 'failed';
      logEntry.error_message = e.message.substring(0, 200);
      console.error(`  ${customerId} fel: ${e.message.substring(0, 100)}`);
      results.failed++;
    }

    logs.push(logEntry);
    results.processed++;
    await new Promise(r => setTimeout(r, 500));
  }

  if (logs.length > 0) {
    try {
      await bq.dataset(datasetId).table('llms_txt_log').insert(logs);
    } catch (e) {
      console.error(`BQ insert fel: ${e.message}`);
    }
  }

  console.log(`=== LLMS.TXT GENERATOR KLAR: ${JSON.stringify(results)} ===`);
  return { statusCode: 200, body: JSON.stringify({ success: true, ...results }) };
};
