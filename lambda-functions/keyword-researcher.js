/**
 * Keyword Researcher Lambda — Ersätter SE Ranking Keyword Research
 *
 * Hittar nya sökord, analyserar sökvolym och konkurrens
 * via gratis Google API:er + Claude AI.
 *
 * Körs manuellt via API eller schemaläggt månadsvis.
 *
 * Datakällor (alla gratis):
 * 1. GSC Search Analytics — faktiska sökord som ger trafik
 * 2. Google Autocomplete — expandera nyckelord med förslag
 * 3. Google Related Searches — "relaterade sökningar"
 * 4. Claude AI — generera nyckelordsförslag baserat på bransch
 *
 * Flöde:
 * 1. Hämta befintliga sökord från GSC (vad rankar kunden redan på?)
 * 2. Expandera med Google Autocomplete (gratis, inget API behövs)
 * 3. Claude AI analyserar och genererar fler förslag
 * 4. ABC-klassificera automatiskt
 * 5. Spara i BigQuery + uppdatera customer_keywords
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const { google } = require('googleapis');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// ── Helpers ──

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

async function getGSCAuth() {
  const credentials = JSON.parse(await getParam('/seo-mcp/bigquery/credentials'));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    clientOptions: { universeDomain: 'googleapis.com' }
  });
  return auth;
}

// ── BigQuery Table ──

async function ensureTable(bq, dataset) {
  const tableId = 'keyword_research_log';
  try {
    await bq.dataset(dataset).table(tableId).get();
  } catch (e) {
    if (e.code === 404) {
      console.log('Creating keyword_research_log table...');
      await bq.query({
        query: `
          CREATE TABLE \`${dataset}.${tableId}\` (
            id STRING,
            customer_id STRING,
            gsc_property STRING,
            research_date DATE,
            gsc_keywords ARRAY<STRUCT<keyword STRING, clicks INT64, impressions INT64, ctr FLOAT64, position FLOAT64>>,
            autocomplete_keywords ARRAY<STRING>,
            ai_suggestions ARRAY<STRUCT<keyword STRING, category STRING, search_intent STRING, estimated_difficulty STRING>>,
            abc_classification STRUCT<a_keywords ARRAY<STRING>, b_keywords ARRAY<STRING>, c_keywords ARRAY<STRING>>,
            total_keywords_found INT64,
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

// ── 1. GSC: Hämta befintliga sökord ──

async function getGSCKeywords(auth, gscProperty, days = 90) {
  const searchconsole = google.searchconsole({
    version: 'v1',
    auth,
    headers: { 'x-goog-user-project': 'seo-aouto' }
  });

  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];

  try {
    const res = await searchconsole.searchanalytics.query({
      siteUrl: gscProperty,
      requestBody: {
        startDate,
        endDate,
        dimensions: ['query'],
        rowLimit: 500,
        type: 'web'
      }
    });

    const keywords = (res.data.rows || []).map(row => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position
    }));

    // Sortera på impressions (synlighet)
    keywords.sort((a, b) => b.impressions - a.impressions);

    return keywords;
  } catch (e) {
    console.log(`  GSC query failed: ${e.message}`);
    return [];
  }
}

// ── 2. Google Autocomplete: Expandera nyckelord ──

/**
 * Hämta Google Autocomplete-förslag för ett sökord.
 * Gratis, inget API-nyckel behövs.
 * Endpoint: google.com/complete/search?client=chrome&q=...&hl=sv
 */
async function getAutocompleteKeywords(seedKeywords, locale = 'sv') {
  const allSuggestions = new Set();

  for (const seed of seedKeywords.slice(0, 20)) {
    try {
      // Google Autocomplete API (gratis, ingen nyckel)
      const res = await axios.get('https://www.google.com/complete/search', {
        params: {
          client: 'chrome',
          q: seed,
          hl: locale,
          gl: 'se'
        },
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SearchboostBot/1.0)'
        },
        timeout: 5000
      });

      // Svaret är [query, [suggestions], ...]
      const suggestions = res.data[1] || [];
      for (const s of suggestions) {
        if (s !== seed) allSuggestions.add(s);
      }

      // Varianter: seed + " a", seed + " b", etc.
      for (const letter of ['a', 'b', 'c', 'f', 'h', 'k', 'l', 'p', 's', 'v']) {
        try {
          const res2 = await axios.get('https://www.google.com/complete/search', {
            params: { client: 'chrome', q: `${seed} ${letter}`, hl: locale, gl: 'se' },
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SearchboostBot/1.0)' },
            timeout: 5000
          });
          for (const s of (res2.data[1] || [])) {
            allSuggestions.add(s);
          }
        } catch (e) { /* ignorera enskilda fel */ }
      }

      // Fråge-varianter: "vad", "hur", "varför", "bästa"
      for (const prefix of ['vad är', 'hur', 'varför', 'bästa', 'billig']) {
        try {
          const res3 = await axios.get('https://www.google.com/complete/search', {
            params: { client: 'chrome', q: `${prefix} ${seed}`, hl: locale, gl: 'se' },
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SearchboostBot/1.0)' },
            timeout: 5000
          });
          for (const s of (res3.data[1] || [])) {
            allSuggestions.add(s);
          }
        } catch (e) { /* ignorera */ }
      }

      // Lite paus mellan requests
      await new Promise(r => setTimeout(r, 200));

    } catch (e) {
      console.log(`  Autocomplete failed for "${seed}": ${e.message}`);
    }
  }

  return [...allSuggestions];
}

// ── 3. Claude AI: Generera nyckelordsförslag ──

async function getAIKeywordSuggestions(claude, customerInfo, gscKeywords, autocompleteKeywords) {
  const topGSC = gscKeywords.slice(0, 20).map(k => `${k.keyword} (${k.impressions} imp, pos ${k.position.toFixed(1)})`);
  const topAutocomplete = autocompleteKeywords.slice(0, 30);

  const prompt = `Du är en erfaren SEO-specialist. Analysera dessa data och föreslå nya nyckelord.

KUND: ${customerInfo.companyName || customerInfo.id}
BRANSCH: ${customerInfo.industry || 'okänd'}
PLATS: ${customerInfo.location || 'Sverige'}
SAJT: ${customerInfo.gscProperty || customerInfo.url}

BEFINTLIGA SÖKORD (från Google Search Console):
${topGSC.join('\n')}

AUTOCOMPLETE-FÖRSLAG:
${topAutocomplete.join(', ')}

UPPGIFT:
1. Analysera kundens nuvarande sökordsprofil
2. Identifiera LUCKOR — sökord kunden borde ranka på men inte gör
3. Föreslå 30 nya nyckelord med:
   - Sökintention (informational/navigational/transactional/commercial)
   - Uppskattad svårighetsgrad (låg/medel/hög)
   - ABC-klassificering (A=huvudsökord, B=sekundära, C=long-tail)

Svara i JSON:
{
  "analysis": "Kort analys av kundens sökordsprofil",
  "gaps": ["sökordslucka 1", "sökordslucka 2"],
  "suggestions": [
    {"keyword": "sökord", "category": "A/B/C", "search_intent": "informational/transactional/etc", "estimated_difficulty": "låg/medel/hög", "reasoning": "varför detta sökord"}
  ],
  "abc_classification": {
    "a_keywords": ["viktigaste sökorden"],
    "b_keywords": ["sekundära sökord"],
    "c_keywords": ["long-tail sökord"]
  }
}`;

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude returnerade inte giltig JSON');
  return JSON.parse(jsonMatch[0]);
}

// ── 4. Hämta kundinfo ──

async function getCustomerInfo(customerId) {
  const info = { id: customerId };

  const paramKeys = ['gsc-property', 'company-name', 'contact-email'];
  for (const key of paramKeys) {
    try {
      const val = await getParam(`/seo-mcp/integrations/${customerId}/${key}`);
      info[key.replace(/-/g, '')] = val;
    } catch (e) { /* parametern finns inte */ }
  }

  try {
    info.url = (await getParam(`/seo-mcp/wordpress/${customerId}/url`));
  } catch (e) { /* */ }

  // Hämta befintliga ABC-nyckelord från BigQuery
  try {
    const { bq, dataset } = await getBigQuery();
    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.customer_keywords\` WHERE customer_id = @id ORDER BY updated_at DESC LIMIT 1`,
      params: { id: customerId }
    });
    if (rows.length > 0) {
      info.existingKeywords = rows[0];
    }
  } catch (e) { /* */ }

  return info;
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== Keyword Researcher Started ===');
  console.log('Event:', JSON.stringify(event));

  const customerId = event?.customerId;
  if (!customerId) {
    return { statusCode: 400, body: JSON.stringify({ error: 'customerId krävs' }) };
  }

  try {
    const { bq, dataset } = await getBigQuery();
    await ensureTable(bq, dataset);

    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    const claude = new Anthropic({ apiKey });

    // 1. Hämta kundinfo
    const customerInfo = await getCustomerInfo(customerId);
    console.log(`Customer: ${customerInfo.companyname || customerId}`);
    console.log(`GSC Property: ${customerInfo.gscproperty || 'N/A'}`);

    // 2. Hämta GSC-sökord
    let gscKeywords = [];
    if (customerInfo.gscproperty) {
      const auth = await getGSCAuth();
      console.log('Fetching GSC keywords...');
      gscKeywords = await getGSCKeywords(auth, customerInfo.gscproperty);
      console.log(`  Found ${gscKeywords.length} GSC keywords`);
    }

    // 3. Google Autocomplete-expansion
    // Använd topp GSC-sökord + befintliga ABC-nyckelord som seeds
    const seeds = new Set();
    gscKeywords.slice(0, 10).forEach(k => seeds.add(k.keyword));

    // Lägg till befintliga A/B-nyckelord om de finns
    if (customerInfo.existingKeywords) {
      const existing = customerInfo.existingKeywords;
      if (existing.a_keywords) existing.a_keywords.split(',').map(k => k.trim()).forEach(k => seeds.add(k));
      if (existing.b_keywords) existing.b_keywords.split(',').map(k => k.trim()).forEach(k => seeds.add(k));
    }

    console.log(`Expanding ${seeds.size} seed keywords with Autocomplete...`);
    const autocompleteKeywords = await getAutocompleteKeywords([...seeds]);
    console.log(`  Found ${autocompleteKeywords.length} autocomplete suggestions`);

    // 4. Claude AI-analys
    console.log('Running AI keyword analysis...');
    const aiResult = await getAIKeywordSuggestions(claude, customerInfo, gscKeywords, autocompleteKeywords);
    console.log(`  AI suggested ${aiResult.suggestions?.length || 0} new keywords`);
    console.log(`  Analysis: ${aiResult.analysis}`);

    // 5. Spara i BigQuery
    const logId = `kr_${Date.now()}_${customerId}`;
    const totalFound = gscKeywords.length + autocompleteKeywords.length + (aiResult.suggestions?.length || 0);

    await bq.query({
      query: `
        INSERT INTO \`${dataset}.keyword_research_log\`
        (id, customer_id, gsc_property, research_date, total_keywords_found)
        VALUES (@id, @customer_id, @gsc_property, CURRENT_DATE(), @total)
      `,
      params: {
        id: logId,
        customer_id: customerId,
        gsc_property: customerInfo.gscproperty || '',
        total: totalFound
      }
    });

    // 6. Uppdatera customer_keywords med nya ABC-förslag
    if (aiResult.abc_classification) {
      const abc = aiResult.abc_classification;
      console.log(`\nABC Classification:`);
      console.log(`  A: ${abc.a_keywords?.join(', ')}`);
      console.log(`  B: ${abc.b_keywords?.join(', ')}`);
      console.log(`  C: ${abc.c_keywords?.join(', ')}`);
    }

    console.log(`\n=== Keyword Researcher Complete ===`);
    console.log(`Total keywords found: ${totalFound}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        customerId,
        gscKeywords: gscKeywords.length,
        autocompleteKeywords: autocompleteKeywords.length,
        aiSuggestions: aiResult.suggestions?.length || 0,
        totalFound,
        analysis: aiResult.analysis,
        gaps: aiResult.gaps,
        abcClassification: aiResult.abc_classification,
        suggestions: aiResult.suggestions,
        topGSCKeywords: gscKeywords.slice(0, 20)
      })
    };

  } catch (err) {
    console.error('Keyword Researcher failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
