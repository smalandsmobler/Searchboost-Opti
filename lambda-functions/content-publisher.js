/**
 * Content Publisher Lambda — Eget "BabyLoveGrowth"-system
 *
 * Genererar SEO-optimerade artiklar med Claude AI och publicerar
 * till kunders WordPress-sajter. Bygger in korsreferens-backlinks
 * mellan sajterna i nätverket för att öka domain rating.
 *
 * Körs dagligen via EventBridge (eller manuellt via API).
 *
 * Flöde:
 * 1. Hämtar alla WP-sajter med giltiga credentials
 * 2. Väljer vilka sajter som ska få artiklar idag (rotation)
 * 3. Claude AI genererar unik artikel anpassad för varje sajt
 * 4. Bäddar in relevanta backlinks till andra sajter i nätverket
 * 5. Publicerar via WordPress REST API
 * 6. Loggar allt i BigQuery
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// ── Konfiguration ──

const CONFIG = {
  // Max antal artiklar per körning
  maxArticlesPerRun: 3,
  // Dagar mellan artiklar per sajt (undvik spam)
  minDaysBetweenPosts: 3,
  // Artikeltyper att rotera mellan
  articleTypes: [
    'industry_tips',      // Tips för kundens bransch
    'seo_guide',          // SEO-guide relevant för branschen
    'local_business',     // Lokalt företagande
    'digital_marketing',  // Digital marknadsföring
    'case_study_style'    // "Så gjorde vi"-artikel
  ],
  // Kategorier per kundtyp
  customerTopics: {
    'mobelrondellen': { industry: 'möbler och inredning', location: 'Småland', topics: ['heminredning', 'möbelval', 'hållbara möbler', 'kontorsinredning'] },
    'smalandskontorsmobler': { industry: 'kontorsmöbler', location: 'Småland', topics: ['ergonomi', 'kontorsinredning', 'arbetsplats', 'stående skrivbord'] },
    'phvast': { industry: 'konsulttjänster', location: 'Jönköping', topics: ['företagsutveckling', 'konsultverksamhet', 'ledarskap', 'förändringsledning'] },
    'kompetensutveckla': { industry: 'utbildning och kompetensutveckling', location: 'Sverige', topics: ['personalutveckling', 'kurser', 'ledarskapsutbildning', 'certifieringar'] },
    'ferox': { industry: 'konsult', location: 'Sverige', topics: ['affärsutveckling', 'strategi', 'tillväxt', 'digitalisering'] },
    'searchboost': { industry: 'SEO och digital marknadsföring', location: 'Jönköping', topics: ['sökmotoroptimering', 'Google Ads', 'webbanalys', 'content marketing'] },
    'ilmonte': { industry: 'restaurang', location: 'Sverige', topics: ['restaurangmarknadsföring', 'matupplevelser', 'lokal marknadsföring', 'google maps'] },
    'tobler': { industry: 'tjänsteföretag', location: 'Sverige', topics: ['kundservice', 'digitalisering', 'effektivisering', 'kvalitet'] },
    'traficator': { industry: 'trafikskola', location: 'Sverige', topics: ['körkortsutbildning', 'trafiksäkerhet', 'riskutbildning', 'övningskörning'] },
    'wedosigns': { industry: 'skylt och design', location: 'Sverige', topics: ['företagsskyltar', 'visuell identitet', 'butiksskyltning', 'varumärkesbyggande'] }
  }
};

// ── Helpers (samma mönster som autonomous-optimizer) ──

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getWordPressSites() {
  const wpRes = await ssm.send(new GetParametersByPathCommand({
    Path: '/seo-mcp/wordpress/', Recursive: true, WithDecryption: true
  }));
  const sites = {};
  for (const p of (wpRes.Parameters || [])) {
    const parts = p.Name.split('/');
    const siteId = parts[3];
    const key = parts[4];
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    sites[siteId][key] = p.Value;
  }

  let intToken;
  const intParams = [];
  do {
    const intRes = await ssm.send(new GetParametersByPathCommand({
      Path: '/seo-mcp/integrations/', Recursive: true, WithDecryption: true,
      ...(intToken ? { NextToken: intToken } : {})
    }));
    intParams.push(...(intRes.Parameters || []));
    intToken = intRes.NextToken;
  } while (intToken);

  for (const p of intParams) {
    const match = p.Name.match(/\/seo-mcp\/integrations\/([^/]+)\/(wp-.+)/);
    if (!match) continue;
    const [, siteId, wpKey] = match;
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    const key = wpKey.replace('wp-', '');
    if (!sites[siteId][key] || sites[siteId][key] === 'placeholder') {
      sites[siteId][key] = p.Value;
    }
  }

  for (const siteId of Object.keys(sites)) {
    if (!sites[siteId].url) {
      try {
        const urlParam = await ssm.send(new GetParameterCommand({ Name: `/seo-mcp/wordpress/${siteId}/url` }));
        sites[siteId].url = urlParam.Parameter.Value;
      } catch (e) { /* URL saknas */ }
    }
  }

  const all = Object.values(sites);
  const valid = all.filter(s => s.url && s.username && s.username !== 'placeholder' && s['app-password'] && s['app-password'] !== 'placeholder');
  const skipped = all.filter(s => s.url && (!s.username || s.username === 'placeholder' || !s['app-password'] || s['app-password'] === 'placeholder'));
  console.log(`Found ${valid.length} WordPress sites with valid credentials`);
  if (skipped.length > 0) console.log(`Skipped ${skipped.length} sites missing credentials: ${skipped.map(s => s.id).join(', ')}`);
  return valid;
}

async function wpApi(site, method, endpoint, data = null) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const config = {
    method,
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    timeout: 30000
  };
  if (data) config.data = data;
  return (await axios(config)).data;
}

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

// ── Content Generation ──

/**
 * Bygg länknätverk: välj 2-3 sajter att länka till från artikeln
 */
function selectBacklinkTargets(currentSite, allSites) {
  const others = allSites.filter(s => s.id !== currentSite.id);
  // Slumpa ordning och ta 2-3
  const shuffled = others.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(3, shuffled.length));
}

/**
 * Generera artikel med Claude AI
 */
async function generateArticle(claude, site, backlinkTargets, articleType) {
  const config = CONFIG.customerTopics[site.id] || {
    industry: 'tjänsteföretag',
    location: 'Sverige',
    topics: ['digital marknadsföring', 'företagsutveckling']
  };

  const topic = config.topics[Math.floor(Math.random() * config.topics.length)];

  // Bygg backlinkinfo för prompten
  const backlinkInfo = backlinkTargets.map(t => {
    const tc = CONFIG.customerTopics[t.id] || { industry: 'tjänsteföretag', location: 'Sverige' };
    return `- ${t.url} (${tc.industry} i ${tc.location})`;
  }).join('\n');

  const prompt = `Du är en erfaren svensk content-skribent. Skriv en SEO-optimerad bloggartikel på svenska.

SAJT: ${site.url}
BRANSCH: ${config.industry}
PLATS: ${config.location}
ÄMNE: ${topic}
ARTIKELTYP: ${articleType}

BACKLINKS ATT INKLUDERA NATURLIGT (dofollow):
${backlinkInfo}

INSTRUKTIONER:
1. Skriv en artikel på 800-1200 ord som är relevant för ${config.industry}
2. Inkludera NATURLIGA kontextuella länkar till backlinkssajterna ovan. Länkarna ska passa i texten — inte tvingade.
   - Exempel: "Företag som [Sajt X](url) har visat att..." eller "För mer om ergonomi, se [sajt Y](url)"
3. Titel ska vara catchy och SEO-optimerad (max 60 tecken)
4. Inkludera en meta description (max 155 tecken)
5. Strukturera med H2/H3 underrubriker
6. Avsluta med en call-to-action
7. Tonen ska vara professionell men lättillgänglig

Svara i JSON-format:
{
  "title": "Artikeltitel",
  "slug": "artikel-slug-url",
  "meta_description": "Meta description max 155 tecken",
  "content": "<h2>...</h2><p>...</p> (full HTML-formaterad artikel)",
  "backlinks_included": ["url1", "url2"],
  "primary_keyword": "huvudsökord",
  "word_count": 1000
}`;

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  // Extrahera JSON (kan vara inbäddad i ```json ... ```)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude returnerade inte giltig JSON');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Publicera artikel till WordPress
 */
async function publishToWordPress(site, article) {
  // Skapa kategorin "Blogg" om den inte finns
  let categoryId;
  try {
    const categories = await wpApi(site, 'GET', '/categories?search=Blogg');
    if (categories.length > 0) {
      categoryId = categories[0].id;
    } else {
      const newCat = await wpApi(site, 'POST', '/categories', { name: 'Blogg' });
      categoryId = newCat.id;
    }
  } catch (e) {
    console.log(`  Kunde inte skapa/hitta kategori: ${e.message}`);
  }

  // Lägg till Rank Math SEO-metadata
  const postData = {
    title: article.title,
    slug: article.slug,
    content: article.content,
    status: 'publish',
    meta: {
      rank_math_title: article.title,
      rank_math_description: article.meta_description,
      rank_math_focus_keyword: article.primary_keyword
    }
  };

  if (categoryId) postData.categories = [categoryId];

  const post = await wpApi(site, 'POST', '/posts', postData);
  return post;
}

// ── Scheduling Logic ──

/**
 * Kolla vilka sajter som ska få artiklar idag
 */
async function getSitesForToday(bq, dataset, sites) {
  // Kolla senaste publicering per sajt
  const [rows] = await bq.query({
    query: `
      SELECT customer_id, MAX(published_at) as last_published
      FROM \`${dataset}.content_publishing_log\`
      GROUP BY customer_id
    `
  }).catch(() => [[]]);  // Tabellen kanske inte finns ännu

  const lastPublished = {};
  for (const row of rows) {
    lastPublished[row.customer_id] = new Date(row.last_published.value || row.last_published);
  }

  const now = new Date();
  const eligible = sites.filter(site => {
    const last = lastPublished[site.id];
    if (!last) return true; // Aldrig publicerat — prioritera
    const daysSince = (now - last) / (1000 * 60 * 60 * 24);
    return daysSince >= CONFIG.minDaysBetweenPosts;
  });

  // Rotera: prioritera sajter som publicerat minst
  eligible.sort((a, b) => {
    const aLast = lastPublished[a.id] ? lastPublished[a.id].getTime() : 0;
    const bLast = lastPublished[b.id] ? lastPublished[b.id].getTime() : 0;
    return aLast - bLast; // Äldst publicering först
  });

  return eligible.slice(0, CONFIG.maxArticlesPerRun);
}

/**
 * Skapa BigQuery-tabellen om den inte finns
 */
async function ensureTable(bq, dataset) {
  const tableId = 'content_publishing_log';
  try {
    await bq.dataset(dataset).table(tableId).get();
  } catch (e) {
    if (e.code === 404) {
      console.log('Creating content_publishing_log table...');
      await bq.query({
        query: `
          CREATE TABLE \`${dataset}.${tableId}\` (
            id STRING,
            customer_id STRING,
            site_url STRING,
            post_id INT64,
            post_url STRING,
            title STRING,
            slug STRING,
            primary_keyword STRING,
            word_count INT64,
            backlinks_to ARRAY<STRING>,
            backlinks_from ARRAY<STRING>,
            article_type STRING,
            published_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
          )
        `
      });
      console.log('Table created.');
    } else {
      throw e;
    }
  }
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== Content Publisher Started ===');
  console.log('Event:', JSON.stringify(event));

  // Stöd för manuell trigger med specifik sajt
  const forceSiteId = event?.siteId;
  const forceArticleType = event?.articleType;

  try {
    const { bq, dataset } = await getBigQuery();
    await ensureTable(bq, dataset);

    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    const claude = new Anthropic({ apiKey });

    const allSites = await getWordPressSites();
    console.log(`Network: ${allSites.length} sites with valid credentials`);

    // Välj sajter för idag
    let targetSites;
    if (forceSiteId) {
      targetSites = allSites.filter(s => s.id === forceSiteId);
      if (targetSites.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: `Site ${forceSiteId} not found or no credentials` }) };
      }
    } else {
      targetSites = await getSitesForToday(bq, dataset, allSites);
    }

    console.log(`Target sites today: ${targetSites.map(s => s.id).join(', ')}`);

    if (targetSites.length === 0) {
      console.log('No sites eligible for publishing today.');
      return { statusCode: 200, body: JSON.stringify({ message: 'No sites eligible', published: 0 }) };
    }

    const results = [];

    for (const site of targetSites) {
      try {
        console.log(`\n--- Publishing to ${site.id} (${site.url}) ---`);

        // Välj artikeltyp
        const articleType = forceArticleType ||
          CONFIG.articleTypes[Math.floor(Math.random() * CONFIG.articleTypes.length)];

        // Välj backlink-mål
        const backlinkTargets = selectBacklinkTargets(site, allSites);
        console.log(`  Backlinks to: ${backlinkTargets.map(t => t.id).join(', ')}`);

        // Generera artikel
        console.log(`  Generating ${articleType} article...`);
        const article = await generateArticle(claude, site, backlinkTargets, articleType);
        console.log(`  Generated: "${article.title}" (${article.word_count} words)`);

        // Publicera
        console.log(`  Publishing to WordPress...`);
        const post = await publishToWordPress(site, article);
        console.log(`  Published: ${post.link} (ID: ${post.id})`);

        // Logga i BigQuery
        const logId = `cp_${Date.now()}_${site.id}`;
        await bq.query({
          query: `
            INSERT INTO \`${dataset}.content_publishing_log\`
            (id, customer_id, site_url, post_id, post_url, title, slug, primary_keyword, word_count, backlinks_to, article_type, published_at)
            VALUES (@id, @customer_id, @site_url, @post_id, @post_url, @title, @slug, @primary_keyword, @word_count, @backlinks_to, @article_type, CURRENT_TIMESTAMP())
          `,
          params: {
            id: logId,
            customer_id: site.id,
            site_url: site.url,
            post_id: post.id,
            post_url: post.link,
            title: article.title,
            slug: article.slug,
            primary_keyword: article.primary_keyword,
            word_count: article.word_count || 1000,
            backlinks_to: article.backlinks_included || [],
            article_type: articleType
          }
        });

        results.push({
          site: site.id,
          title: article.title,
          url: post.link,
          backlinks: article.backlinks_included,
          wordCount: article.word_count
        });

      } catch (err) {
        console.error(`  Error publishing to ${site.id}: ${err.message}`);
        results.push({ site: site.id, error: err.message });
      }
    }

    const successful = results.filter(r => !r.error).length;
    console.log(`\n=== Content Publisher Complete: ${successful}/${targetSites.length} articles published ===`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        published: successful,
        total: targetSites.length,
        results
      })
    };

  } catch (err) {
    console.error('Content Publisher failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
