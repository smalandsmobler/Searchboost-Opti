/**
 * Content Publisher Lambda
 *
 * Genererar SEO-optimerade artiklar med Claude AI och publicerar
 * till kunders WordPress-sajter.
 *
 * Flöde:
 * 1. Hämtar new_content-jobb från action_plans (skapade av keyword-researcher)
 * 2. Fallback: väljer sajter i rotation om inga action_plans-jobb finns
 * 3. Claude AI genererar unik artikel anpassad för varje sajt
 * 4. Bäddar in INTERNLÄNKAR till kundens egna hubb-sidor (INGA korsbacklinks)
 * 5. Publicerar via WordPress REST API
 * 6. Loggar i BigQuery + markerar action_plan som completed
 *
 * OBS: Korsbacklinks mellan kundsajter är BORTTAGET — det är ett länknätverk
 * som Google straffar. Alla länkar är nu internlänkar inom samma sajt.
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
  maxArticlesPerRun: 3,
  minDaysBetweenPosts: 3,
  articleTypes: [
    'industry_tips',
    'seo_guide',
    'local_business',
    'digital_marketing',
    'case_study_style'
  ],
  customerTopics: {
    'mobelrondellen':          { industry: 'möbler och inredning',              location: 'Småland',     topics: ['heminredning', 'möbelval', 'hållbara möbler', 'kontorsinredning'] },
    'smalandskontorsmobler':   { industry: 'kontorsmöbler',                     location: 'Småland',     topics: ['ergonomi', 'kontorsinredning', 'arbetsplats', 'stående skrivbord'] },
    'phvast':                  { industry: 'konsulttjänster',                   location: 'Jönköping',   topics: ['företagsutveckling', 'konsultverksamhet', 'ledarskap', 'förändringsledning'] },
    'kompetensutveckla':       { industry: 'utbildning och kompetensutveckling',location: 'Sverige',     topics: ['personalutveckling', 'kurser', 'ledarskapsutbildning', 'certifieringar'] },
    'ferox':                   { industry: 'konsult',                           location: 'Sverige',     topics: ['affärsutveckling', 'strategi', 'tillväxt', 'digitalisering'] },
    'searchboost':             { industry: 'SEO och digital marknadsföring',    location: 'Jönköping',   topics: ['sökmotoroptimering', 'Google Ads', 'webbanalys', 'content marketing'] },
    'ilmonte':                 { industry: 'restaurang',                        location: 'Sverige',     topics: ['restaurangmarknadsföring', 'matupplevelser', 'lokal marknadsföring', 'google maps'] },
    'tobler':                  { industry: 'tjänsteföretag',                    location: 'Sverige',     topics: ['kundservice', 'digitalisering', 'effektivisering', 'kvalitet'] },
    'traficator':              { industry: 'trafikskola',                       location: 'Sverige',     topics: ['körkortsutbildning', 'trafiksäkerhet', 'riskutbildning', 'övningskörning'] },
    'wedosigns':               { industry: 'skylt och design',                  location: 'Sverige',     topics: ['företagsskyltar', 'visuell identitet', 'butiksskyltning', 'varumärkesbyggande'] }
  }
};

// ── Helpers ──

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
      } catch (e) {}
    }
  }

  const all = Object.values(sites);
  const valid = all.filter(s => s.url && s.username && s.username !== 'placeholder' && s['app-password'] && s['app-password'] !== 'placeholder');
  const skipped = all.filter(s => s.url && (!s.username || s.username === 'placeholder' || !s['app-password'] || s['app-password'] === 'placeholder'));
  console.log(`Found ${valid.length} WordPress sites with valid credentials`);
  if (skipped.length > 0) console.log(`Skipped ${skipped.length} sites (no credentials): ${skipped.map(s => s.id).join(', ')}`);
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

// ── Hämta hubb-sidor för en kund (sidor att länka till internt) ──

async function getHubPages(site, bq, dataset) {
  // Hämta kundens A-nyckelord — dessa är hubb-sidorna
  try {
    const [rows] = await bq.query({
      query: `SELECT a_keywords, b_keywords FROM \`${dataset}.customer_keywords\`
              WHERE customer_id = @cid ORDER BY updated_at DESC LIMIT 1`,
      params: { cid: site.id }
    });
    if (!rows.length) return [];

    // Hämta action_plans för att hitta hub-URL:er
    const [planRows] = await bq.query({
      query: `SELECT DISTINCT target_url, target_keyword FROM \`${dataset}.action_plans\`
              WHERE customer_id = @cid AND target_url IS NOT NULL AND month_number = 1
              ORDER BY priority DESC LIMIT 10`,
      params: { cid: site.id }
    });

    return planRows.map(r => ({
      url: r.target_url,
      keyword: r.target_keyword || ''
    }));
  } catch (e) {
    console.log(`  Kunde inte hämta hubb-sidor för ${site.id}: ${e.message}`);
    return [];
  }
}

// ── Hämta new_content-jobb från action_plans ──

async function getNewContentJobs(bq, dataset, siteId, max = 1) {
  try {
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.action_plans\`
              WHERE customer_id = @cid
              AND task_type = 'new_content'
              AND status IN ('planned', 'active')
              AND target_keyword IS NOT NULL
              ORDER BY priority DESC
              LIMIT @max`,
      params: { cid: siteId, max }
    });
    return rows;
  } catch (e) {
    return [];
  }
}

// ── Generera artikel med Claude AI (med internlänkar, INGA korsbacklinks) ──

async function generateArticle(claude, site, hubPages, targetKeyword, articleType) {
  const config = CONFIG.customerTopics[site.id] || {
    industry: 'tjänsteföretag',
    location: 'Sverige',
    topics: ['digital marknadsföring', 'företagsutveckling']
  };

  const topic = targetKeyword || config.topics[Math.floor(Math.random() * config.topics.length)];

  // Bygg internlänk-info för prompten
  const internalLinkInfo = hubPages.length > 0
    ? hubPages.slice(0, 4).map(h => `- ${h.url}${h.keyword ? ` (nyckelord: "${h.keyword}")` : ''}`).join('\n')
    : '(inga hubb-sidor konfigurerade ännu — inga internlänkar)';

  const prompt = `Du är en erfaren svensk content-skribent. Skriv en SEO-optimerad bloggartikel på svenska.

SAJT: ${site.url}
BRANSCH: ${config.industry}
PLATS: ${config.location}
MÅLSÖKORD: ${topic}
ARTIKELTYP: ${articleType}

INTERNLÄNKAR ATT INKLUDERA (länkar till kundens EGNA sidor — VIKTIGT för SEO):
${internalLinkInfo}

INSTRUKTIONER:
1. Skriv en artikel på 800-1200 ord optimerad för sökordet: "${topic}"
2. Inkludera 2-4 naturliga internlänkar till kundens egna sidor listade ovan
   - Länkarna ska passa kontextuellt — inte tvingade
   - Exempel: "Läs mer om [tjänst](url)" eller "Se även vår guide om [ämne](url)"
   - Lägg ALDRIG in länkar till externa sajter eller konkurrenter
3. Titel: catchy och SEO-optimerad, max 60 tecken, innehåller målsökordet
4. Meta description: max 155 tecken, innehåller målsökordet
5. Strukturera med H2/H3 underrubriker
6. Avsluta med en call-to-action kopplad till kundens tjänster
7. Tonen: professionell men lättillgänglig

Svara i JSON-format:
{
  "title": "Artikeltitel",
  "slug": "artikel-slug-url",
  "meta_description": "Meta description max 155 tecken",
  "content": "<h2>...</h2><p>...</p> (full HTML-formaterad artikel med internlänkar)",
  "internal_links_included": ["url1", "url2"],
  "primary_keyword": "${topic}",
  "word_count": 1000
}`;

  const response = await claude.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude returnerade inte giltig JSON');
  return JSON.parse(jsonMatch[0]);
}

// ── Publicera artikel till WordPress ──

async function publishToWordPress(site, article) {
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

// ── Scheduling: välj sajter för idag (fallback om inga action_plan-jobb) ──

async function getSitesForToday(bq, dataset, sites) {
  const [rows] = await bq.query({
    query: `SELECT customer_id, MAX(published_at) as last_published
            FROM \`${dataset}.content_publishing_log\`
            GROUP BY customer_id`
  }).catch(() => [[]]);

  const lastPublished = {};
  for (const row of rows) {
    lastPublished[row.customer_id] = new Date(row.last_published.value || row.last_published);
  }

  const now = new Date();
  const eligible = sites.filter(site => {
    const last = lastPublished[site.id];
    if (!last) return true;
    const daysSince = (now - last) / (1000 * 60 * 60 * 24);
    return daysSince >= CONFIG.minDaysBetweenPosts;
  });

  eligible.sort((a, b) => {
    const aLast = lastPublished[a.id] ? lastPublished[a.id].getTime() : 0;
    const bLast = lastPublished[b.id] ? lastPublished[b.id].getTime() : 0;
    return aLast - bLast;
  });

  return eligible.slice(0, CONFIG.maxArticlesPerRun);
}

async function ensureTable(bq, dataset) {
  const tableId = 'content_publishing_log';
  try {
    await bq.dataset(dataset).table(tableId).get();
  } catch (e) {
    if (e.code === 404) {
      console.log('Creating content_publishing_log table...');
      await bq.query({
        query: `CREATE TABLE \`${dataset}.${tableId}\` (
          id STRING,
          customer_id STRING,
          site_url STRING,
          post_id INT64,
          post_url STRING,
          title STRING,
          slug STRING,
          primary_keyword STRING,
          word_count INT64,
          internal_links_to ARRAY<STRING>,
          article_type STRING,
          plan_id STRING,
          published_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
        )`
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

  const forceSiteId = event?.siteId;
  const forceArticleType = event?.articleType;
  const forceKeyword = event?.keyword;

  try {
    const { bq, dataset } = await getBigQuery();
    await ensureTable(bq, dataset);

    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    const claude = new Anthropic({ apiKey });

    const allSites = await getWordPressSites();
    console.log(`Network: ${allSites.length} sites with valid credentials`);

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

        // ── PRIMÄRT: Kolla om keyword-researcher har lagt ett new_content-jobb ──
        const planJobs = forceKeyword ? [] : await getNewContentJobs(bq, dataset, site.id, 1);
        const planJob = planJobs[0] || null;

        const targetKeyword = forceKeyword || planJob?.target_keyword || null;
        const articleType = forceArticleType || CONFIG.articleTypes[Math.floor(Math.random() * CONFIG.articleTypes.length)];

        if (planJob) {
          console.log(`  Kör action_plan-jobb: "${targetKeyword}" (plan_id: ${planJob.plan_id})`);
        } else {
          console.log(`  Fallback: rotation-artikel${targetKeyword ? ` om "${targetKeyword}"` : ''}`);
        }

        // Hämta kundens hubb-sidor för internlänkning
        const hubPages = await getHubPages(site, bq, dataset);
        console.log(`  Hubb-sidor att länka till: ${hubPages.length}`);

        // Generera artikel
        console.log(`  Genererar artikel (${articleType})...`);
        const article = await generateArticle(claude, site, hubPages, targetKeyword, articleType);
        console.log(`  Genererad: "${article.title}" (${article.word_count} ord)`);

        // Publicera
        console.log(`  Publicerar till WordPress...`);
        const post = await publishToWordPress(site, article);
        console.log(`  Publicerad: ${post.link} (ID: ${post.id})`);

        // Logga i BigQuery
        const logId = `cp_${Date.now()}_${site.id}`;
        await bq.query({
          query: `INSERT INTO \`${dataset}.content_publishing_log\`
                  (id, customer_id, site_url, post_id, post_url, title, slug, primary_keyword, word_count, internal_links_to, article_type, plan_id, published_at)
                  VALUES (@id, @customer_id, @site_url, @post_id, @post_url, @title, @slug, @primary_keyword, @word_count, @internal_links_to, @article_type, @plan_id, CURRENT_TIMESTAMP())`,
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
            internal_links_to: article.internal_links_included || [],
            article_type: articleType,
            plan_id: planJob?.plan_id || ''
          }
        });

        // Markera action_plan-jobbet som klart
        if (planJob) {
          await bq.query({
            query: `UPDATE \`${dataset}.action_plans\`
                    SET status = 'completed', completed_at = CURRENT_TIMESTAMP()
                    WHERE plan_id = @pid`,
            params: { pid: planJob.plan_id }
          });
        }

        // Lägg ny sida i action_plans för autonomous-optimizer att följa upp med metadata
        await bq.query({
          query: `INSERT INTO \`${dataset}.action_plans\`
                  (plan_id, customer_id, month_number, task_type, target_url, target_keyword, priority, status, created_at)
                  VALUES (@pid, @cid, 1, 'short_title', @url, @kw, 80, 'planned', CURRENT_TIMESTAMP())`,
          params: {
            pid: `follow_${logId}`,
            cid: site.id,
            url: post.link,
            kw: article.primary_keyword
          }
        });

        console.log(`  Follow-up metadata-optimering lagd i action_plans`);

        results.push({
          site: site.id,
          title: article.title,
          url: post.link,
          internalLinks: article.internal_links_included,
          wordCount: article.word_count,
          fromPlan: !!planJob
        });

      } catch (err) {
        console.error(`  Fel vid publicering till ${site.id}: ${err.message}`);
        results.push({ site: site.id, error: err.message });
      }
    }

    const successful = results.filter(r => !r.error).length;
    console.log(`\n=== Content Publisher klart: ${successful}/${targetSites.length} artiklar publicerade ===`);

    return {
      statusCode: 200,
      body: JSON.stringify({ published: successful, total: targetSites.length, results })
    };

  } catch (err) {
    console.error('Content Publisher failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
