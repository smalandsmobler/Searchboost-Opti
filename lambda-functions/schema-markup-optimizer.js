/**
 * Schema Markup Optimizer Lambda
 *
 * Körs varje tisdag kl 06:00 CET (EventBridge: cron(0 5 ? * TUE *))
 *
 * Genererar och lägger till strukturerad data (JSON-LD schema markup) på
 * kunders WordPress-sidor för att förbättra rich results i Google.
 *
 * Stödda schema-typer:
 * - LocalBusiness (alla lokala företag)
 * - Product (e-handel: möbler, snus etc.)
 * - Article / BlogPosting (blogginlägg)
 * - Service (konsult, SEO, utbildning)
 * - FAQPage (sidor med FAQ-innehåll)
 * - BreadcrumbList (navigationskedja)
 * - Review / AggregateRating (produktrecensioner)
 * - Course (Kompetensutveckla)
 *
 * Flöde per kund:
 * 1. Hämta sidor via WP REST API
 * 2. Analysera sidtyp + befintligt innehåll
 * 3. Claude genererar lämplig JSON-LD
 * 4. Spara som Rank Math custom schema ELLER injektera i page head via WP API
 * 5. Logga i BigQuery: schema_optimization_log
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
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
  const credsPath = '/tmp/bq-creds.json';
  fs.writeFileSync(credsPath, creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  _bq = new BigQuery({ projectId: _projectId, keyFilename: credsPath });
  return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
}

async function ensureSchemaLogTable(bq, datasetId) {
  const schema = [
    { name: 'log_id',        type: 'STRING', mode: 'REQUIRED' },
    { name: 'customer_id',   type: 'STRING', mode: 'REQUIRED' },
    { name: 'page_id',       type: 'INTEGER' },
    { name: 'page_url',      type: 'STRING' },
    { name: 'schema_type',   type: 'STRING' },
    { name: 'schema_json',   type: 'STRING' },
    { name: 'status',        type: 'STRING' }, // applied | failed | skipped
    { name: 'error_message', type: 'STRING' },
    { name: 'created_at',    type: 'TIMESTAMP' },
  ];
  try {
    await bq.dataset(datasetId).createTable('schema_optimization_log', {
      schema: { fields: schema },
      timePartitioning: { type: 'DAY', field: 'created_at' },
    });
  } catch (e) {
    if (!e.message.includes('Already Exists')) throw e;
  }
}

// ── WP API Helpers ──

async function getWPPages(siteUrl, username, appPassword, limit = 20) {
  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages?per_page=${limit}&_fields=id,slug,title,link,content,type`;
  const res = await axios.get(url, {
    auth: { username, password: appPassword },
    timeout: 15000,
    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
  });
  return res.data || [];
}

async function getWPPosts(siteUrl, username, appPassword, limit = 10) {
  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts?per_page=${limit}&_fields=id,slug,title,link,content,type,date,modified,categories`;
  const res = await axios.get(url, {
    auth: { username, password: appPassword },
    timeout: 15000,
    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
  });
  return res.data || [];
}

async function updatePageMeta(siteUrl, username, appPassword, postId, metaKey, metaValue) {
  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/pages/${postId}`;
  await axios.post(url,
    { meta: { [metaKey]: metaValue } },
    {
      auth: { username, password: appPassword },
      timeout: 15000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
    }
  );
}

async function addCustomSchema(siteUrl, username, appPassword, postId, schemaJson) {
  // Rankmath stöder rankmath_schema_custom meta-fältet
  // Alternativt: injektera via yoast_wpseo_schema_graph_pieces filter (kräver plugin)
  // Vi sparar som custom field rank_math_schema_custom
  const url = `${siteUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts/${postId}`;
  await axios.post(url,
    { meta: { rank_math_schema_custom: schemaJson } },
    {
      auth: { username, password: appPassword },
      timeout: 15000,
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
    }
  );
}

// ── Analysera sidtyp ──

function detectPageType(page, siteUrl, industryType) {
  const slug = (page.slug || '').toLowerCase();
  const title = (page.title?.rendered || '').toLowerCase();
  const content = (page.content?.rendered || '').toLowerCase().substring(0, 500);

  if (slug === '' || slug === 'home' || slug === 'hem' || slug === 'start') return 'homepage';
  if (slug.includes('kontakt') || slug.includes('contact')) return 'contact';
  if (slug.includes('om-oss') || slug.includes('about') || slug.includes('om-')) return 'about';
  if (slug.includes('tjanst') || slug.includes('service') || slug.includes('erbjudande')) return 'service';
  if (slug.includes('produkt') || slug.includes('product') || slug.includes('shop')) return 'product';
  if (slug.includes('kurs') || slug.includes('utbildning') || slug.includes('course')) return 'course';
  if (slug.includes('faq') || slug.includes('vanliga') || content.includes('<h') && content.includes('?')) return 'faq';
  if (page.type === 'post') return 'article';
  if (industryType === 'restaurant') return 'restaurant';

  return 'webpage';
}

// ── Claude genererar schema ──

async function generateSchema(anthropicKey, page, pageType, companyName, siteUrl, industryInfo) {
  const client = new Anthropic({ apiKey: anthropicKey });

  const cleanContent = (page.content?.rendered || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 600);

  const systemPrompt = `Du är en teknisk SEO-specialist. Generera JSON-LD schema markup för en WordPress-sida.
Svara BARA med ett giltigt JSON-objekt (inga kodblock, ingen förklaring).
Använd @context: "https://schema.org". Var specifik och konkret.`;

  const userPrompt = `Företag: ${companyName}
Webb: ${siteUrl}
Sidtyp: ${pageType}
Sidrubrik: ${page.title?.rendered || ''}
Sidans URL: ${page.link || siteUrl}
Bransch: ${industryInfo}
Innehåll (utdrag): ${cleanContent}

Generera lämplig JSON-LD schema för denna sida. ${getSchemaInstructions(pageType, companyName, siteUrl)}`;

  const response = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 800,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = response.content[0].text.trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Ingen giltig JSON i svaret');

  JSON.parse(match[0]); // Validera
  return match[0];
}

function getSchemaInstructions(pageType, companyName, siteUrl) {
  const instructions = {
    homepage:   `Använd LocalBusiness (eller specifik subtyp) med name, address, telephone, openingHours, url, sameAs.`,
    service:    `Använd Service med name, description, provider (Organization), areaServed, serviceType.`,
    product:    `Använd Product med name, description, brand, offers (Offer med price, priceCurrency, availability).`,
    course:     `Använd Course med name, description, provider (Organization), courseMode, educationalLevel.`,
    faq:        `Använd FAQPage med mainEntity (array av Question med acceptedAnswer). Extrahera 3-5 frågor från innehållet.`,
    article:    `Använd Article/BlogPosting med headline, author (Person eller Organization), datePublished, publisher.`,
    contact:    `Använd ContactPage + LocalBusiness med contactPoint.`,
    about:      `Använd AboutPage + Organization med foundingDate, numberOfEmployees, description.`,
    restaurant: `Använd Restaurant med servesCuisine, priceRange, hasMenu, openingHours.`,
    webpage:    `Använd WebPage med name, description, breadcrumb (BreadcrumbList).`,
  };
  return instructions[pageType] || instructions.webpage;
}

// ── Kontrollera om sida redan har schema ──

function hasExistingSchema(content) {
  return content && (
    content.includes('"@context"') ||
    content.includes("'@context'") ||
    content.includes('application/ld+json')
  );
}

// ── Kund-konfiguration ──

const CUSTOMER_INDUSTRY = {
  mobelrondellen:         { type: 'furniture_store',  desc: 'möbelbutik i Småland' },
  smalandskontorsmobler:  { type: 'furniture_store',  desc: 'kontorsmöbler, ergonomi, Småland' },
  phvast:                 { type: 'consulting',        desc: 'konsultbolag, Jönköping' },
  kompetensutveckla:      { type: 'education',         desc: 'kurser och kompetensutveckling' },
  ferox:                  { type: 'consulting',        desc: 'affärsutveckling och strategi' },
  searchboost:            { type: 'seo_agency',        desc: 'SEO-byrå, Google Ads, digital marknadsföring' },
  ilmonte:                { type: 'restaurant',        desc: 'restaurang, mat och dryck' },
  tobler:                 { type: 'service',           desc: 'tjänsteföretag' },
  traficator:             { type: 'education',         desc: 'trafikskola, körkort, körlektioner' },
  wedosigns:              { type: 'retail',            desc: 'skyltar, trycksaker, visuell kommunikation' },
  nordicsnusonline:       { type: 'retail',            desc: 'snus och nikotinprodukter online' },
};

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== SCHEMA MARKUP OPTIMIZER START ===');

  const { bq, projectId, datasetId } = await getBQ();
  const anthropicKey = await getParamSafe('/seo-mcp/anthropic/api-key');
  if (!anthropicKey) throw new Error('Anthropic API-nyckel saknas');

  await ensureSchemaLogTable(bq, datasetId);

  // Hämta kunder med WP-credentials
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

  const eligibleCustomers = Object.keys(wpSites).filter(cid =>
    wpSites[cid].url && wpSites[cid].username && wpSites[cid]['app-password']
  );

  console.log(`${eligibleCustomers.length} kunder med WP-credentials`);

  const results = { processed: 0, schemasAdded: 0, failed: 0, skipped: 0 };

  for (const customerId of eligibleCustomers) {
    const siteUrl      = await getParamSafe(`/seo-mcp/wordpress/${customerId}/url`);
    const wpUser       = await getParamSafe(`/seo-mcp/wordpress/${customerId}/username`);
    const wpPass       = await getParamSafe(`/seo-mcp/wordpress/${customerId}/app-password`);
    const companyName  = await getParamSafe(`/seo-mcp/integrations/${customerId}/company-name`) || customerId;

    if (!siteUrl || !wpUser || !wpPass || wpPass === 'placeholder') {
      console.log(`  Skippar ${customerId} (placeholder creds)`);
      results.skipped++;
      continue;
    }

    const industryInfo = CUSTOMER_INDUSTRY[customerId]?.desc || 'tjänsteföretag';
    console.log(`  Bearbetar ${companyName} (${siteUrl})`);

    let pages = [];
    try {
      pages = await getWPPages(siteUrl, wpUser, wpPass, 15);
    } catch (e) {
      console.error(`  WP API fel för ${customerId}: ${e.message}`);
      results.failed++;
      continue;
    }

    const logs = [];
    let schemasThisSite = 0;

    for (const page of pages) {
      if (schemasThisSite >= 5) break; // Max 5 per kund per körning

      const pageContent = page.content?.rendered || '';
      if (hasExistingSchema(pageContent)) {
        continue; // Har redan schema
      }

      const pageType = detectPageType(page, siteUrl, CUSTOMER_INDUSTRY[customerId]?.type);
      const logEntry = {
        log_id: `${customerId}_${page.id}_${Date.now()}`,
        customer_id: customerId,
        page_id: page.id,
        page_url: page.link || '',
        schema_type: pageType,
        schema_json: '',
        status: 'pending',
        error_message: null,
        created_at: new Date().toISOString(),
      };

      try {
        const schemaJson = await generateSchema(anthropicKey, page, pageType, companyName, siteUrl, industryInfo);
        logEntry.schema_json = schemaJson;

        // Injektera schema via WP custom field
        await addCustomSchema(siteUrl, wpUser, wpPass, page.id, schemaJson);

        logEntry.status = 'applied';
        schemasThisSite++;
        results.schemasAdded++;
        console.log(`    Schema tillagd: ${page.title?.rendered} (${pageType})`);
      } catch (e) {
        logEntry.status = 'failed';
        logEntry.error_message = e.message.substring(0, 200);
        console.error(`    Fel: ${page.title?.rendered}: ${e.message.substring(0, 100)}`);
        results.failed++;
      }

      logs.push(logEntry);
      await new Promise(r => setTimeout(r, 500)); // Rate limiting
    }

    if (logs.length > 0) {
      try {
        await bq.dataset(datasetId).table('schema_optimization_log').insert(logs);
      } catch (e) {
        console.error(`  BQ insert fel: ${e.message}`);
      }
    }

    results.processed++;
  }

  console.log(`=== SCHEMA OPTIMIZER KLAR: ${JSON.stringify(results)} ===`);
  return { statusCode: 200, body: JSON.stringify({ success: true, ...results }) };
};
