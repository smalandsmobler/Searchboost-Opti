/**
 * Auto Article Generator Lambda
 *
 * Kors varje onsdag kl 07:00 CET (EventBridge: cron(0 5 ? * WED *))
 *
 * Genererar och publicerar SEO-optimerade blogginlagg automatiskt for
 * kunder med konfigurerade WordPress-credentials. Max 1 artikel per
 * kund per korning for att halla kostnader under kontroll.
 *
 * Flode per kund:
 * 1. Hamta A/B-nyckelord fran BigQuery customer_keywords
 * 2. Kontrollera nyligen publicerade artiklar (undvika dubletter, 30 dagar)
 * 3. Hamta content opportunities (zero_click / near_page1)
 * 4. Generera artikel med Claude Sonnet (kvalitet > kostnad for artiklar)
 * 5. Publicera via WP REST API med Rank Math-meta
 * 6. Logga i BigQuery seo_optimization_log
 *
 * Uppskattad kostnad: ~$0.05-0.10 per artikel (claude-3-5-sonnet-20241022)
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// ── SSM Cache ──

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

// ── BigQuery Setup ──

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

// ── Kund-konfiguration ──

const CUSTOMER_INDUSTRY = {
  mobelrondellen:        { type: 'furniture_store', desc: 'mobelbutik i Smaland' },
  smalandskontorsmobler: { type: 'furniture_store', desc: 'kontorsmober, ergonomi, Smaland' },
  phvast:                { type: 'consulting',      desc: 'konsultbolag, Jonkoping' },
  kompetensutveckla:     { type: 'education',       desc: 'kurser och kompetensutveckling' },
  ferox:                 { type: 'consulting',      desc: 'affarsutvekling och strategi' },
  searchboost:           { type: 'seo_agency',      desc: 'SEO-byra, Google Ads, digital marknadsforing' },
  ilmonte:               { type: 'restaurant',      desc: 'restaurang, mat och dryck' },
  tobler:                { type: 'service',         desc: 'tjansteforetag' },
  traficator:            { type: 'education',       desc: 'trafikskola, korkort, korlektioner' },
  wedosigns:             { type: 'retail',          desc: 'skyltar, trycksaker, visuell kommunikation' },
  nordicsnusonline:      { type: 'retail',          desc: 'snus och nikotinprodukter online' },
};

// ── BigQuery Queries ──

async function fetchKeywords(bq, projectId, datasetId, customerId) {
  const query = `
    SELECT keyword, classification, search_volume
    FROM \`${projectId}.${datasetId}.customer_keywords\`
    WHERE customer_id = @cid
      AND classification IN ('A', 'B')
    ORDER BY search_volume DESC
    LIMIT 20
  `;
  const [rows] = await bq.query({
    query,
    params: { cid: customerId },
    types: { cid: 'STRING' },
  });
  return rows || [];
}

async function fetchRecentTopics(bq, projectId, datasetId, customerId) {
  const query = `
    SELECT notes
    FROM \`${projectId}.${datasetId}.seo_optimization_log\`
    WHERE customer_id = @cid
      AND optimization_type = 'article_generated'
      AND created_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
  `;
  try {
    const [rows] = await bq.query({
      query,
      params: { cid: customerId },
      types: { cid: 'STRING' },
    });
    return (rows || []).map(r => r.notes).filter(Boolean);
  } catch {
    return []; // Tabellen kanske inte har nagon historik an
  }
}

async function fetchContentOpportunities(bq, projectId, datasetId, customerId) {
  const query = `
    SELECT keyword, opportunity_type, potential_score
    FROM \`${projectId}.${datasetId}.content_opportunities\`
    WHERE customer_id = @cid
      AND status = 'pending'
    ORDER BY potential_score DESC
    LIMIT 10
  `;
  try {
    const [rows] = await bq.query({
      query,
      params: { cid: customerId },
      types: { cid: 'STRING' },
    });
    return rows || [];
  } catch {
    return []; // Tabellen kan saknas for vissa kunder
  }
}

// ── Valj primart nyckelord ──

function selectPrimaryKeyword(keywords, opportunities, recentTopics) {
  // Prioritera content_opportunities (zero_click / near_page1)
  for (const opp of opportunities) {
    const alreadyCovered = recentTopics.some(t =>
      t.toLowerCase().includes(opp.keyword.toLowerCase())
    );
    if (!alreadyCovered) {
      const match = keywords.find(k =>
        k.keyword.toLowerCase() === opp.keyword.toLowerCase()
      );
      if (match) return match;
      // Returnera opportunity-nyckelordet aven om det saknas i customer_keywords
      return { keyword: opp.keyword, classification: 'B', search_volume: opp.potential_score || 0 };
    }
  }

  // Annars: forsta A-nyckelordet som inte nyligen tackts
  for (const kw of keywords) {
    const alreadyCovered = recentTopics.some(t =>
      t.toLowerCase().includes(kw.keyword.toLowerCase())
    );
    if (!alreadyCovered) return kw;
  }

  // Fallback: det forsta nyckelordet oavsett historik
  return keywords[0] || null;
}

// ── Claude: Generera artikel ──

async function generateArticle(anthropicKey, customerId, companyName, siteUrl, primaryKw, secondaryKws, recentTopics) {
  const client = new Anthropic({ apiKey: anthropicKey });

  const industryDesc = CUSTOMER_INDUSTRY[customerId]?.desc || 'tjansteforetag';
  const secondaryList = secondaryKws.map(k => k.keyword).join(', ');
  const recentList = recentTopics.slice(0, 5).join(', ') || 'inga';

  const systemPrompt = `Du ar en expert SEO-skribent for svenska foretag. Skriv valstrukturerade, informativa artiklar som rankar bra i Google.`;

  const userPrompt = `Skriv en SEO-optimerad bloggartikel for ${companyName} (${industryDesc}).
Webbplats: ${siteUrl}
Primart nyckelord: ${primaryKw.keyword} (sokvolym: ${primaryKw.search_volume || 'okand'})
Sekundara nyckelord att inkludera naturligt: ${secondaryList}
Undvik dessa amnen (nyligen tackta): ${recentList}

Formatera svaret som JSON:
{
  "title": "Artikelrubrik (50-65 tecken, inkludera primart nyckelord)",
  "slug": "url-vanligt-format-med-bindestreck",
  "metaDescription": "Meta-beskrivning 140-160 tecken",
  "excerpt": "Kort sammanfattning 1-2 meningar",
  "content": "Komplett artikelinnehall i HTML (h2/h3, p-taggar, minst 800 ord, strukturerat med tydliga sektioner, inkludera en FAQ-sektion i slutet med 3 fragor)",
  "focusKeyword": "${primaryKw.keyword}",
  "categories": ["Blogg"],
  "tags": ["${primaryKw.keyword}", "ytterligare 3-4 relevanta taggar"]
}`;

  const response = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  return parseArticleJSON(response.content[0].text);
}

async function retryWithSimplePrompt(anthropicKey, rawResponse) {
  // Om forsta parsingen misslyckas: be Claude ge ren JSON
  const client = new Anthropic({ apiKey: anthropicKey });
  const retryResponse = await client.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Nedan ar ett svar. Extrahera och returnera BARA det rena JSON-objektet, utan forklaring eller kod-block:\n\n${rawResponse}`,
      },
    ],
  });
  return parseArticleJSON(retryResponse.content[0].text);
}

function parseArticleJSON(raw) {
  // Ta bort eventuella ```json ... ``` wrappers
  const cleaned = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/, '')
    .trim();

  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Ingen giltig JSON i Claude-svaret');

  const parsed = JSON.parse(match[0]);

  // Validera obligatoriska falt
  if (!parsed.title || !parsed.content || !parsed.slug) {
    throw new Error('Ofullstandig artikel-JSON: title, content eller slug saknas');
  }

  return parsed;
}

// ── WP REST API Helpers ──

function wpAxiosConfig(username, password) {
  return {
    auth: { username, password },
    timeout: 20000,
    httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
  };
}

async function findOrCreateCategory(siteUrl, username, appPassword, categoryName) {
  const base = siteUrl.replace(/\/$/, '');

  // Soka befintlig kategori
  try {
    const res = await axios.get(
      `${base}/wp-json/wp/v2/categories?search=${encodeURIComponent(categoryName)}&per_page=5`,
      wpAxiosConfig(username, appPassword)
    );
    const existing = (res.data || []).find(
      c => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (existing) return existing.id;
  } catch { /* Faller igenom till skapande */ }

  // Skapa ny kategori
  const res = await axios.post(
    `${base}/wp-json/wp/v2/categories`,
    { name: categoryName },
    wpAxiosConfig(username, appPassword)
  );
  return res.data.id;
}

async function publishArticle(siteUrl, username, appPassword, article) {
  const base = siteUrl.replace(/\/$/, '');

  const categoryId = await findOrCreateCategory(siteUrl, username, appPassword, 'Blogg');

  const payload = {
    title: article.title,
    content: article.content,
    excerpt: article.excerpt || '',
    slug: article.slug,
    status: 'publish',
    categories: [categoryId],
    tags: [], // Taggar skapas separat via WP taxonomy API vid behov
    meta: {
      rank_math_title: article.title,
      rank_math_description: article.metaDescription || '',
      rank_math_focus_keyword: article.focusKeyword || '',
    },
  };

  const res = await axios.post(
    `${base}/wp-json/wp/v2/posts`,
    payload,
    wpAxiosConfig(username, appPassword)
  );

  return res.data;
}

// ── BigQuery Logg ──

async function logToBigQuery(bq, datasetId, customerId, articleTitle, wordCount, postUrl, status, errorMsg) {
  const row = {
    log_id: `art_${customerId}_${Date.now()}`,
    customer_id: customerId,
    page_url: postUrl || '',
    optimization_type: 'article_generated',
    original_content: '',
    optimized_content: articleTitle,
    notes: `${articleTitle} (${wordCount} ord)`,
    status,
    error_message: errorMsg ? String(errorMsg).substring(0, 300) : null,
    created_at: new Date().toISOString(),
  };

  try {
    await bq.dataset(datasetId).table('seo_optimization_log').insert([row]);
  } catch (e) {
    console.error(`  BQ insert-fel: ${e.message}`);
  }
}

// ── Rakna ord i HTML ──

function countWords(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== AUTO ARTICLE GENERATOR START ===');

  const { bq, projectId, datasetId } = await getBQ();

  const anthropicKey = await getParamSafe('/seo-mcp/anthropic/api-key');
  if (!anthropicKey) throw new Error('Anthropic API-nyckel saknas i SSM');

  // Hamta alla WP-customers fran SSM
  const ssmRes = await ssm.send(new GetParametersByPathCommand({
    Path: '/seo-mcp/wordpress/',
    Recursive: true,
    WithDecryption: false,
  }));

  const wpSites = {};
  for (const p of (ssmRes.Parameters || [])) {
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

  console.log(`${eligibleCustomers.length} kunder med WP-parametrar i SSM`);

  const results = { processed: 0, articlesPublished: 0, failed: 0, skipped: 0 };

  for (const customerId of eligibleCustomers) {
    const siteUrl     = await getParamSafe(`/seo-mcp/wordpress/${customerId}/url`);
    const wpUser      = await getParamSafe(`/seo-mcp/wordpress/${customerId}/username`);
    const wpPass      = await getParamSafe(`/seo-mcp/wordpress/${customerId}/app-password`);
    const companyName = await getParamSafe(`/seo-mcp/integrations/${customerId}/company-name`) || customerId;

    if (!siteUrl || !wpUser || !wpPass || wpPass === 'placeholder') {
      console.log(`  Skippar ${customerId} (placeholder eller ofullstandiga creds)`);
      results.skipped++;
      continue;
    }

    console.log(`  Bearbetar ${companyName} (${siteUrl})`);
    results.processed++;

    // 1. Hamta nyckelord
    let keywords = [];
    try {
      keywords = await fetchKeywords(bq, projectId, datasetId, customerId);
    } catch (e) {
      console.error(`  Nyckelord-fel for ${customerId}: ${e.message}`);
    }

    if (!keywords.length) {
      console.log(`  Inga A/B-nyckelord hittade for ${customerId} — hoppar over`);
      results.skipped++;
      continue;
    }

    // 2. Hamta nyligen publicerade amnen
    const recentTopics = await fetchRecentTopics(bq, projectId, datasetId, customerId);

    // 3. Hamta content opportunities
    const opportunities = await fetchContentOpportunities(bq, projectId, datasetId, customerId);

    // 4. Valj primart nyckelord
    const primaryKw = selectPrimaryKeyword(keywords, opportunities, recentTopics);
    if (!primaryKw) {
      console.log(`  Kunde inte valja primarnyckelord for ${customerId}`);
      results.skipped++;
      continue;
    }

    // Sekundara: nasta 4 nyckelord (exkl. primara)
    const secondaryKws = keywords
      .filter(k => k.keyword !== primaryKw.keyword)
      .slice(0, 4);

    console.log(`  Nyckelord: "${primaryKw.keyword}" (klass ${primaryKw.classification}, vol ${primaryKw.search_volume})`);

    // 5. Generera artikel med Claude Sonnet
    let article;
    let rawResponse = '';
    try {
      article = await generateArticle(
        anthropicKey, customerId, companyName, siteUrl,
        primaryKw, secondaryKws, recentTopics
      );
    } catch (firstErr) {
      console.warn(`  Forsta parsning misslyckades: ${firstErr.message} — forsok igen`);
      try {
        // Retry: be om ren JSON
        const client = new Anthropic({ apiKey: anthropicKey });
        const retryMsg = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `Svara BARA med ett rent JSON-objekt (ingen forklaring, inga kod-block) for en SEO-artikel:
{
  "title": "...",
  "slug": "...",
  "metaDescription": "...",
  "excerpt": "...",
  "content": "...",
  "focusKeyword": "${primaryKw.keyword}",
  "categories": ["Blogg"],
  "tags": ["${primaryKw.keyword}"]
}
Foretag: ${companyName}, Primarnyckelord: ${primaryKw.keyword}, Sprak: svenska`,
          }],
        });
        article = parseArticleJSON(retryMsg.content[0].text);
      } catch (retryErr) {
        console.error(`  Artikel-generering misslyckades for ${customerId}: ${retryErr.message}`);
        await logToBigQuery(bq, datasetId, customerId, primaryKw.keyword, 0, '', 'failed', retryErr.message);
        results.failed++;
        await new Promise(r => setTimeout(r, 2000));
        continue;
      }
    }

    // 6. Publicera via WP REST API
    let publishedPost;
    try {
      publishedPost = await publishArticle(siteUrl, wpUser, wpPass, article);
      const wordCount = countWords(article.content);
      console.log(`  Publicerad: "${article.title}" (${wordCount} ord) → ${publishedPost.link}`);
      await logToBigQuery(bq, datasetId, customerId, article.title, wordCount, publishedPost.link, 'completed', null);
      results.articlesPublished++;
    } catch (publishErr) {
      console.error(`  Publicering misslyckades for ${customerId}: ${publishErr.message}`);
      await logToBigQuery(bq, datasetId, customerId, article.title, 0, '', 'failed', publishErr.message);
      results.failed++;
    }

    // Vartelar 2 sekunder mellan kunder (rate limiting)
    await new Promise(r => setTimeout(r, 2000));
  }

  console.log(`=== ARTICLE GENERATOR KLAR: ${JSON.stringify(results)} ===`);
  return { statusCode: 200, body: JSON.stringify({ success: true, ...results }) };
};
