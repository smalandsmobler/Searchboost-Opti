/**
 * Autonomous Optimizer Lambda — Körs var 6:e timme
 * Plockar uppgifter från BigQuery work queue och utför
 * autonoma SEO-optimeringar (metadata, internlänkar, schema).
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const axios = require('axios');
const fs = require('fs');
let Langfuse, langfuseClient;
try { ({ Langfuse } = require('langfuse')); } catch(e) { /* optional */ }

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// OpenRouter gratis-modeller (Qwen, Llama, DeepSeek, Gemini) — roterar var 6:e timme
const FREE_MODELS = [
  'qwen/qwen3-235b-a22b:free',
  'meta-llama/llama-4-maverick:free',
  'deepseek/deepseek-r1-0528:free',
  'google/gemini-2.0-flash-exp:free'
];

// Module-level — sätts i handler
let AI_MODEL = FREE_MODELS[0];

// ── INTELLIGENT MODEL ROUTING (2026-05-03) ──
// Måste ligga på modul-scope: fix*-handlers (fixMetadata m.fl.) anropar selectModel().
// Tier 1 (billig, snabb): meta titles/descriptions, alt-text, enkel klassificering
// Tier 2 (medel): schema markup, content-förbättringar, internlänk-förslag
// Tier 3 (dyr, kraftfull): komplex content-generering, kundrapporter, strategisk analys
const MODEL_TIERS = {
  tier1: 'google/gemini-2.0-flash-lite-001',      // ~$0.075/1M tokens
  tier2: 'anthropic/claude-haiku-4.5',              // ~$0.25/1M input
  tier3: 'anthropic/claude-sonnet-4.6'              // ~$3/1M input — bara för kundrapporter
};
function selectModel(taskType) {
  const tier1Tasks = ['meta_title', 'meta_description', 'alt_text', 'focus_keyword', 'classify', 'validate'];
  const tier3Tasks = ['customer_report', 'strategy', 'full_article', 'competitor_analysis'];
  if (tier1Tasks.includes(taskType)) return MODEL_TIERS.tier1;
  if (tier3Tasks.includes(taskType)) return MODEL_TIERS.tier3;
  return MODEL_TIERS.tier2; // schema, content_fix, internal_links, faq
}

/**
 * OpenRouter-klient som efterliknar Anthropics messages.create()-API.
 * OpenRouter är OpenAI-kompatibelt (/chat/completions), inte Anthropic-kompatibelt.
 */
function createOpenRouterClient(apiKey) {
  return {
    messages: {
      create: async (params) => {
        const { model, max_tokens, messages } = params;
        // Konvertera Anthropic-format → OpenAI-format
        const openAiMessages = messages.map(m => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content
            : (m.content || []).map(c => c.text || '').join('')
        }));
        const resp = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          { model, max_tokens, messages: openAiMessages, temperature: 0.7 },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://searchboost.se',
              'X-Title': 'Searchboost Opti'
            },
            timeout: 60000
          }
        );
        const text = resp.data.choices?.[0]?.message?.content || '';
        // Returnera i Anthropics format (content[0].text)
        return { content: [{ type: 'text', text }] };
      }
    }
  };
}

// PROMPT CACHING (2026-05-01)
// Cachning kräver minst 1024 tokens preamble för att aktiveras. Vi lägger en
// gemensam SYSTEM_PROMPT som identifierar Searchboost SEO-agenten + output-regler.
// Per-Anthropic dokumentation sparar detta 90% input-cost för calls som upprepar
// systemet inom 5 min (Lambda invocation = en burst → cache hits från call 2+).
const SYSTEM_PROMPT_CACHED = [
  {
    type: 'text',
    text: `Du är en autonom SEO-agent på Searchboost — en svensk byrå som optimerar webbplatser av alla typer: WordPress (via Rank Math + WP REST API), headless WordPress, Sanity CMS och React/Next.js-sajter.

REGLER FÖR ALLA OUTPUT:
1. Skriv ALLTID på korrekt svenska med ÅÄÖ — aldrig ASCII-ersättningar (a/o/e för å/ö/ä).
2. Title-tags: max 60 tecken, primärt keyword inom de FÖRSTA 30 tecknen, naturligt språk.
3. Meta-descriptions: 130-155 tecken, inkludera 1-2 keywords + ett trust signal (siffra, år, garanti, antal produkter) om det finns i sidinnehållet, avsluta med uppmaning.
4. JSON-output: rena JSON-objekt utan markdown-fences.
5. Inga emojis i output om inte explicit ombett.
6. När du föreslår content-fixar: leverera HTML, ALDRIG Markdown.
7. Schema.org JSON-LD: alltid @context "https://schema.org", @id med kanonisk URL, @type korrekt. Lägg till sameAs (LinkedIn/Wikidata) för Organization. Lägg alltid till areaServed "SE" för tjänste- och lokala schema.

AEO/AI OVERVIEWS (Googles AI-sammanfattningar — kritiskt 2026):
8. Öppna varje nytt avsnitt med ett DIREKT svar på avsnittets fråga inom 60 ord — expandera sedan. Google AI Overviews citerar direkta svar under 60 ord signifikant oftare.
9. FAQPage-schema: Google avvecklade FAQ Rich Results 2026-05-07 — inga visuella paneler visas. Behåll befintlig FAQPage-markup (matar Gemini) men skapa INTE nya FAQ-sektioner enbart för rich results. Prioritera Product, LocalBusiness, Article och HowTo.
10. Strukturera content med H2/H3 som frågor ("Vad kostar X?", "Hur väljer man Y?") — matchar sökfraser och AI Overview-parsing direkt.

E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness — 2026):
11. Titles/descriptions: inkludera konkreta trovärdighetsignaler om de finns (år i branschen, antal kunder, certifieringar) — aldrig fabricera.
12. Article-schema: inkludera alltid author (Person med sameAs LinkedIn+Wikidata), publisher (Organization), datePublished, dateModified. dateModified är färskhetssignal — kritiskt för AI Overview-citeringar.
13. Wikidata sameAs: starkaste E-E-A-T-signalen 2026 för Organization och Person — inkludera Wikidata-URI när du kan härleda det med hög säkerhet, annars utelämna.

CORE WEB VITALS 2026:
14. INP (Interaction to Next Paint) ersatte FID mars 2024. Threshold: <200ms = good. Sidor med tung JS-rendering eller Divi/page-builder-bloat riskerar >500ms INP — flagga sådana sidor om det framgår av context.
15. LCP <2.5s, CLS <0.1. Sajter som klarar alla tre ser 24% lägre bounce rate — värd att nämna i reasoning.

LLMS.TXT (AI-crawler-standard 2026):
16. llms.txt är en Markdown-karta för AI-crawlare (per llmstxt.org-spec). Prioritera sidor med hög informationstäthet. Varje länk MÅSTE ha en 1-menings-annotation som beskriver sidans syfte.
17. llms.txt ≠ robots.txt. robots.txt styr crawl-access, llms.txt ger AI-system kontext och prioritet. Sidor blockerade i robots.txt ignoreras i llms.txt.

INTERN LÄNKNING (hub-och-ekrar 2026):
18. Varje kluster-sida ska länka tillbaka till sin pillar-sida. Nya sidor MÅSTE ha minst 1 intern inkommande länk vid publicering — orphan-sidor indexeras inte av AI-system.
19. Entity-first: organisera content kring entiteter (varumärken, produkter, begrepp) — inte nyckelordssträngar. AI-modeller löser entiteter innan keyword-relevans analyseras.

KONTEXT: Du arbetar autonomt. Var tydlig med 'reasoning'-fält i JSON-svar. Output-format-disciplin är kritiskt — Lambda parsar JSON direkt. En ogiltig JSON innebär förlorad uppgift.`,
    cache_control: { type: 'ephemeral' }
  }
];

// ── SPECIALIST SYSTEM PROMPTS (2026-05-01) ──
// Används för riktade AI-anrop. Varje specialist har ett snävt fokusområde
// för att maximera output-kvalitet per uppgiftstyp.

const META_SPECIALIST_PROMPT = `Du är en specialist på SEO-titlar och meta descriptions för svenska WordPress-sajter (Google 2025-standard).
Din enda uppgift är att skriva titlar (max 60 tecken) och meta descriptions (130-155 tecken) som:
1. Primärt keyword INOM DE FÖRSTA 30 TECKNEN i titeln — Google värderar front-loading högt
2. Titeln är unik, självbeskrivande och korrekt representerar sidans innehåll (Google skriver om ~76% av titlar som är vilseledande)
3. Meta description: inkludera ett trust signal (specifik siffra, år, produktantal, garanti) om sidinnehållet ger belägg för det
4. Avslutar descriptions med en tydlig uppmaning (Läs mer, Se sortiment, Boka idag, Köp nu etc)
5. Alltid korrekt svenska med ÅÄÖ — aldrig ASCII-ersättningar
6. Aldrig keyword-stuffing eller onaturliga fraser
7. Aldrig fabricera fakta — använd bara trust signals som faktiskt finns i sidinnehållet
Output: Alltid JSON med fälten title, description, reasoning.`;

const SCHEMA_SPECIALIST_PROMPT = `Du är en specialist på Schema.org strukturerad data för svenska WordPress-sajter (Google + AEO/AI Overviews 2025-standard).
Din uppgift är att generera korrekt JSON-LD schema markup. Regler:
1. Välj rätt @type baserat på sidans innehåll (Article, Product, LocalBusiness, FAQPage, HowTo, BreadcrumbList, Service, Organization)
2. ALLTID inkludera "@id" med kanonisk URL som unik identifierare — detta förankrar entiteten i AI-kunskapsgrafer
3. ALLTID "@context": "https://schema.org" — aldrig förkortat
4. Fyll i alla relevanta properties — aldrig tomma strängar, aldrig placeholder-data
5. För Organization/LocalBusiness: lägg till "sameAs" array med LinkedIn-URL och/eller Wikidata-URL om du kan härleda dem (annars utelämna sameAs)
6. För Service och Organization: lägg alltid till "areaServed": "SE" — detta är kritiskt för svenska sökresultat
7. För FAQPage: extrahera 3-5 konkreta frågor och svar från sidinnehållet — frågor MÅSTE vara synliga för användaren på sidan (Google penaliserar dolda FAQs)
8. För Article/BlogPosting: inkludera author (Person med name), publisher (Organization med logo), datePublished, dateModified, mainEntityOfPage (@id = sidans URL)
9. För Product: inkludera brand (@type Brand), sku om det finns, offers med priceCurrency "SEK" och availability
10. PRIORITETSORDNING schema-typer (rich snippets 2026): Product+AggregateRating > LocalBusiness > Article/BlogPosting > HowTo > BreadcrumbList > FAQPage. OBS: Google avvecklade FAQ Rich Results 2026-05-07 — FAQPage ger inga visuella snippets men matar AI-system, välj det bara om sidan är utpräglat FAQ-baserad
11. Output: Alltid raw JSON-LD utan markdown-fences, redo att injiceras i <script type="application/ld+json">`;

const CONTENT_SPECIALIST_PROMPT = `Du är en specialist på SEO-innehåll för svenska WordPress-sajter (Google Core 2025 + AI Overviews-standard).
Din uppgift är att förbättra och komplettera befintligt innehåll:
1. ANSWER-FIRST: Varje H2/H3-avsnitt ska ÖPPNA med ett direkt 1-2-meningssvar på avsnittets rubrikfråga — Google och AI-system (ChatGPT, Claude, Gemini) citerar sidor som svarar direkt
2. H2/H3-rubriker: formulera som frågor ("Vad kostar X?", "Hur väljer man Y?") — matchar sökfraser och AEO-format
3. Lead-paragrafer ska svara direkt på sidans primära fråga inom 90 ord
4. Fakta ska vara specifika: siffror, datum, processer — inte vaga påståenden
5. FAQ-sektion: lägg till en "Vanliga frågor"-sektion BARA om sidan är genuint informativ och frågorna tillför värde för läsaren — Google avvecklade FAQ Rich Results 2026-05-07 så motivet är nu enbart läsbarhet och AI-parsing, inte SERP-display
6. Rubriker innehåller sekundära keywords och LSI-termer naturligt
7. Intern länkning: föreslå 3-5 relevanta interna sidor att länka till
8. Alltid korrekt svenska med ÅÄÖ — aldrig ASCII-ersättningar
9. Output: HTML (inte Markdown), inkludera reasoning-fältet`;

const REPORT_SPECIALIST_PROMPT = `Du är en specialist på kundkommunikation för en SEO-byrå (Searchboost).
Din uppgift är att sammanfatta SEO-arbete på ett sätt som är:
1. Konkret och faktabaserat — specifika siffror, inte fluff
2. Förståeligt för en icke-teknisk företagare
3. Kopplat till affärsvärde (klick = potentiella kunder)
4. Ärligt om vad som fungerat och vad som behöver tid
5. Framåtblickande — vad händer nästa period
6. Max 300 ord, aldrig bullet-listor med mer än 5 punkter
7. Alltid korrekt svenska med ÅÄÖ`;

// ── A/B PROMPT SELECTION (2026-05-01) ──
// 50/50-split: version A = standardprompt, version B = specialist-prompt
function selectPromptVersion(specialist) {
  // 50/50 A/B split — A = standard prompt, B = experimental variant
  const version = Math.random() < 0.5 ? 'A' : 'B';
  return version;
}

// Samlar A/B-loggposter under körningens livstid, skrivs till BQ i slutet
const abLogEntries = [];

// SAFE-MODE GUARD (2026-05-01)
// När SAFE_MODE_NO_CONTENT_WRITES=true skriver optimizern ALDRIG till `content`-fältet.
// Detta skyddar Gutenberg-blocks, Divi-shortcodes, Flatsome UX-builder-data från att förstöras.
// Endast Rank Math meta-fält (title, description, schema, focus_keyword) skrivs.
// Content-fixar (internlänkar, tunna sidor, alt-text, H2/H3, synonymer) flaggas istället
// till manuell review via Trello/task-fil.
// Sätt env var SAFE_MODE_NO_CONTENT_WRITES=false för att stänga av (när säker content-write byggts).
const SAFE_MODE_NO_CONTENT_WRITES = process.env.SAFE_MODE_NO_CONTENT_WRITES !== 'false';

async function flagForManualReview(taskType, postLink, reason) {
  try {
    await trelloCard(
      `[MANUAL] ${taskType}: ${postLink.substring(0, 60)}`,
      `**Säker autonom optimering — flaggad för manuell review**\n` +
      `Sida: ${postLink}\n` +
      `Anledning: ${reason}\n` +
      `Optimizer kan inte göra denna fix säkert utan att riskera page-builder-data. ` +
      `Hantera via Perispa MCP eller direkt i WP-admin.`
    );
  } catch (e) { /* Trello unreachable */ }
}

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

// ── Säker status-DML ──
// seo-aouto kan vara free-tier/sandbox där DML (UPDATE/DELETE) ger 403 billingNotEnabled.
// En oskyddad UPDATE kraschar HELA optimizern. All status-uppdatering går via denna helper:
// misslyckas DML loggas det och körningen fortsätter (optimeringen + streaming-insert till
// seo_optimization_log sker ändå). Returnerar true vid lyckad DML, false annars.
async function safeDml(bq, query, params) {
  try {
    await bq.query({ query, params });
    return true;
  } catch (e) {
    const msg = (e && e.message ? e.message : String(e)).substring(0, 120);
    console.warn(`  [BQ-DML] status-uppdatering misslyckades (${msg}) — fortsätter`);
    return false;
  }
}

async function getWordPressSites() {
  // Hämta från gamla sökvägen /seo-mcp/wordpress/
  // VIKTIGT: SSM GetParametersByPath returnerar max 10 params per anrop.
  // Utan paginering trunkeras listan till de 3 första kunderna alfabetiskt
  // och resten av kunderna blir osynliga för optimizern. Paginera alltid.
  const wpParams = [];
  let wpToken;
  do {
    const wpRes = await ssm.send(new GetParametersByPathCommand({
      Path: '/seo-mcp/wordpress/', Recursive: true, WithDecryption: true,
      MaxResults: 10,
      ...(wpToken ? { NextToken: wpToken } : {})
    }));
    wpParams.push(...(wpRes.Parameters || []));
    wpToken = wpRes.NextToken;
  } while (wpToken);

  const sites = {};
  for (const p of wpParams) {
    const parts = p.Name.split('/');
    const siteId = parts[3];
    const key = parts[4];
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    sites[siteId][key] = p.Value;
  }

  // Hämta från nya sökvägen /seo-mcp/integrations/ (wp-url, wp-username, wp-app-password)
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

  const all = Object.values(sites).filter(s => !/-staging$/.test(s.id));
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
    timeout: 15000
  };
  if (data) config.data = data;
  return (await axios(config)).data;
}

// ── WooCommerce REST API (wc/v3) ──
async function wcApi(site, method, endpoint, data = null, params = null) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const config = {
    method,
    url: `${site.url}/wp-json/wc/v3${endpoint}`,
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    timeout: 20000
  };
  if (data) config.data = data;
  if (params) config.params = params;
  const res = await axios(config);
  return { data: res.data, total: parseInt(res.headers['x-wp-total'] || '0', 10) };
}

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  const bq = new BigQuery({ projectId });
  const _origDs = bq.dataset.bind(bq);
  bq.dataset = (n, o = {}) => _origDs(n, { projectId, ...o });
  return { bq, dataset };
}

async function trelloCard(name, desc) {
  const apiKey = await getParam('/seo-mcp/trello/api-key');
  const token = await getParam('/seo-mcp/trello/token');
  const boardId = await getParam('/seo-mcp/trello/board-id');
  const lists = (await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
    params: { key: apiKey, token }
  })).data;
  // BUG FIX: Hitta "DONE"-listan explicit, INTE lists[0] (= "Analys" med 64 kort)
  const list = lists.find(l => l.name.toUpperCase() === 'DONE') || lists[lists.length - 1] || lists[0];
  await axios.post('https://api.trello.com/1/cards', null, {
    params: { key: apiKey, token, idList: list.id, name, desc }
  });
}

// ── Helper: parse JSON from Claude (strips markdown code blocks) ──
function parseClaudeJSON(text) {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(clean);
}

// ── Hjälpfunktion: redirect-kontroll ──
function isRedirectPage(content) {
  return /<!--\s*redirect\s*-->|<meta[^>]+http-equiv=['"]refresh['"][^>]*>/i.test(content) ||
         /^\s*location\s*:/im.test(content);
}

// ── Optimization handlers ──

// ── Data-driven signal boost: GSC + Ads-data höjer prioritet på rätt sidor ──
// Returnerar Map<url, boostScore> där boostScore är en multiplikator (1.0–3.0)
async function getSignalBoost(bq, dataset, customerId) {
  const boost = new Map();

  try {
    // GSC-signal: hög impression + låg CTR = sida syns men konverterar inte klikck
    // → metadata-fix har störst ROI här
    const [gscRows] = await bq.query({
      query: `
        SELECT page, SUM(impressions) as imp, AVG(position) as pos,
               SAFE_DIVIDE(SUM(clicks), SUM(impressions)) as ctr
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
          AND page IS NOT NULL
        GROUP BY page
        HAVING imp > 50
        ORDER BY imp DESC
        LIMIT 50
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    for (const row of (gscRows || [])) {
      const url = row.page;
      if (!url) continue;
      let score = 1.0;
      // Hög impression + låg CTR = metadata-problem
      if ((row.imp || 0) > 500 && (row.ctr || 0) < 0.03) score += 1.5;
      else if ((row.imp || 0) > 200 && (row.ctr || 0) < 0.05) score += 1.0;
      // Position 4–10 = nära toppen, schema/H1 kan knuffa upp
      if ((row.pos || 99) >= 4 && (row.pos || 99) <= 10) score += 0.5;
      if (boost.has(url)) boost.set(url, Math.max(boost.get(url), score));
      else boost.set(url, score);
    }
  } catch (e) {
    // GSC-data saknas — fortsätt utan boost
  }

  try {
    // Ads-signal: om kunden kör betalda annonser på en URL
    // → organisk SEO på samma URL har multiplicerad effekt
    const [adsRows] = await bq.query({
      query: `
        SELECT campaign_name, SUM(spend) as total_spend, SUM(clicks) as total_clicks
        FROM \`${dataset}.ads_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
        GROUP BY campaign_name
        HAVING total_spend > 0
        LIMIT 20
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    if ((adsRows || []).length > 0) {
      // Kunden har aktiv annonsering — höj alla SEO-tasks generellt
      // (kan inte matcha URL direkt om vi inte har destination URL i ads_daily)
      for (const [url, score] of boost.entries()) {
        boost.set(url, score + 0.3);
      }
    }
  } catch (e) {
    // Ads-data saknas
  }

  return boost;
}

async function getCustomerKeywords(bq, dataset, customerId) {
  try {
    const [rows] = await bq.query({
      query: `SELECT keyword, tier FROM \`${dataset}.customer_keywords\` WHERE customer_id = @cid ORDER BY tier`,
      params: { cid: customerId }
    });
    const a = rows.filter(r => r.tier === 'A').map(r => r.keyword);
    const b = rows.filter(r => r.tier === 'B').map(r => r.keyword);
    const c = rows.filter(r => r.tier === 'C').map(r => r.keyword);
    return { a, b, c, all: [...a, ...b, ...c] };
  } catch (e) {
    return { a: [], b: [], c: [], all: [] };
  }
}

// ── Hämta WP-post via ID (eller URL/slug om ID saknas — gäller GSC-only tasks) ──
async function fetchWpPost(site, context) {
  const postId = context.id;
  if (postId && postId !== 0) {
    try {
      const post = await wpApi(site, 'GET', `/posts/${postId}`);
      return { post, wpType: 'posts' };
    } catch (e) {
      const post = await wpApi(site, 'GET', `/pages/${postId}`);
      return { post, wpType: 'pages' };
    }
  }
  // Inget ID (GSC-only task) — hämta via URL/slug
  const targetUrl = context.url || context.page_url;
  if (!targetUrl) throw new Error('Ingen post-ID eller URL i context_data');
  return wpApiByUrl(site, targetUrl);
}

async function fixMetadata(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: task.task_type, action: 'skipped_redirect_page' };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const kwContext = kw.all.length > 0
    ? `\n\nKundens ABC-nyckelord:\nA-nyckelord (viktigast): ${kw.a.join(', ') || 'saknas'}\nB-nyckelord: ${kw.b.join(', ') || 'saknas'}\nC-nyckelord: ${kw.c.join(', ') || 'saknas'}\n\nAnvänd ett eller flera relevanta nyckelord naturligt i titel och beskrivning.`
    : '';

  const pageText = post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 500);

  const suggestion = await claude.messages.create({
    model: selectModel('meta_title'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Optimera SEO-title och meta description för denna WordPress-sida på svenska.

Nuvarande titel: "${post.title.rendered}"
URL: ${post.link}
Innehållsutdrag: ${pageText}${kwContext}

Krav:
- Title: max 60 tecken, inkludera primärt keyword
- Description: 130-155 tecken, inkludera 1-2 keywords, avsluta med uppmaning
- Naturlig svenska, inte keyword-stuffing

Svara i JSON: {"title": "...", "description": "...", "reasoning": "vilket keyword och varför"}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  await wpApi(site, 'POST', `/${wpType}/${postId}`, {
    meta: { rank_math_title: result.title, rank_math_description: result.description }
  });

  await trelloCard(
    `SEO: ${result.title.substring(0, 40)}...`,
    `**Metadata-optimering**\nSida: ${post.link}\nFrån: ${post.title.rendered}\nTill: ${result.title}\n${result.reasoning}`
  );

  return { type: 'metadata', result };
}

async function fixInternalLinks(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;
  if (isRedirectPage(post.content.rendered)) {
    return { type: 'no_internal_links', action: 'skipped_redirect_page' };
  }

  const allPosts = await wpApi(site, 'GET', '/posts?per_page=30&status=publish');
  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const kwHint = kw.all.length > 0
    ? `\nKundens nyckelord (prioritera dessa som anchor text): ${kw.a.concat(kw.b).slice(0, 10).join(', ')}`
    : '';

  const suggestion = await claude.messages.create({
    model: selectModel('internal_links'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Hitta 2-3 naturliga internlänkmöjligheter i denna text. Anchor text ska helst matcha kundens nyckelord.
Sida: ${post.link}
Text: ${post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 1500)}
Tillgängliga sidor: ${allPosts.filter(p => p.id !== postId).slice(0, 15).map(p => `${p.title.rendered}: ${p.link}`).join('\n')}${kwHint}
Svara i JSON: {"links": [{"anchorText": "...", "targetUrl": "..."}]}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  let content = post.content.rendered;
  let added = 0;

  for (const link of result.links) {
    const re = new RegExp(`(${link.anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)`, 'i');
    const newContent = content.replace(re, `<a href="${link.targetUrl}">$1</a>`);
    if (newContent !== content) { content = newContent; added++; }
  }

  if (added > 0) {
    if (SAFE_MODE_NO_CONTENT_WRITES) {
      await flagForManualReview('internal_links', post.link,
        `${added} interna länkar föreslås: ${result.links.map(l => l.anchorText + ' → ' + l.targetUrl).join(', ')}`);
      return { type: 'internal_links', action: 'flagged_safe_mode', suggested: added };
    }
    await wpApi(site, 'POST', `/${wpType}/${postId}`, { content });
    await trelloCard(
      `Internlänkar: +${added} på ${post.title.rendered.substring(0, 30)}`,
      `**Internlänkning**\nSida: ${post.link}\nLade till ${added} nya internlänkar`
    );
  }

  return { type: 'internal_links', added };
}

async function fixThinContent(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'thin_content', action: 'skipped_redirect_page' };
  }

  const currentText = post.content.rendered.replace(/<[^>]+>/g, '');
  const wordCount = currentText.split(/\s+/).filter(Boolean).length;

  // Om under 100 ord — för lite att jobba med, flagga
  if (wordCount < 100) {
    await trelloCard(
      `Tunn sida (behöver manuell text): ${context.title.substring(0, 40)}`,
      `**Behöver manuell granskning**\nSida: ${context.url}\nInnehållet är för kort (${wordCount} ord). Behöver utökas manuellt.`
    );
    return { type: 'thin_content', action: 'flagged_for_review', wordCount };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const kwContext = kw.all.length > 0
    ? `\n\nKundens viktigaste sökord:\nA-nyckelord (primära): ${kw.a.join(', ') || 'saknas'}\nB-nyckelord: ${kw.b.join(', ') || 'saknas'}\nC-nyckelord: ${kw.c.join(', ') || 'saknas'}\n\nFörsök inkludera 2-4 relevanta nyckelord naturligt i texten.`
    : '';

  const suggestion = await claude.messages.create({
    model: selectModel('content_fix'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Du är en expert på svensk SEO-copywriting. Sidan har för lite innehåll (${wordCount} ord). Utöka med ytterligare 200-300 ord av hög kvalitet.

Sida: ${post.link}
Nuvarande titel: ${post.title.rendered}
Nuvarande text: ${currentText.substring(0, 1000)}${kwContext}

Krav:
- Texten ska passa naturligt in i slutet av befintlig text
- Inkludera relevanta nyckelord naturligt (ej keyword-stuffing)
- Naturlig svenska, informativ och hjälpsam ton
- 2-3 stycken HTML (<p>-taggar)

Svara i JSON:
{"newParagraph": "<p>...</p><p>...</p>", "reasoning": "vilka nyckelord användes och varför"}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  if (SAFE_MODE_NO_CONTENT_WRITES) {
    await flagForManualReview('thin_content', post.link,
      `${wordCount} ord. Förslag på 250 ord finns. Anledning: ${result.reasoning}. ` +
      `Föreslagen text:\n${result.newParagraph?.substring(0, 500) || '(saknas)'}`);
    return { type: 'thin_content', action: 'flagged_safe_mode', wordCount };
  }
  const updatedContent = post.content.rendered + '\n' + result.newParagraph;
  await wpApi(site, 'POST', `/${wpType}/${postId}`, { content: updatedContent });

  await trelloCard(
    `Innehåll utökat: ${post.title.rendered.substring(0, 40)}`,
    `**Innehållsoptimering**\nSida: ${post.link}\nFrån ${wordCount} ord. Lade till ~250 ord.\n${result.reasoning}`
  );

  return { type: 'thin_content', action: 'content_expanded', wordCount, reasoning: result.reasoning };
}

async function fixMissingAltText(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'missing_alt_text', action: 'skipped_redirect_page' };
  }

  // Hitta bilder utan alt-text
  const imgRegex = /<img(?![^>]*alt=['"][^'"]+['"])[^>]*>/gi;
  const imgs = post.content.rendered.match(imgRegex) || [];
  if (imgs.length === 0) return { type: 'missing_alt_text', action: 'no_images_found' };

  const pageTitle = post.title.rendered;
  let content = post.content.rendered;
  let fixed = 0;

  for (const img of imgs.slice(0, 5)) {
    // Extrahera src för kontext
    const srcMatch = img.match(/src=['"]([^'"]+)['"]/i);
    const src = srcMatch ? srcMatch[1] : '';
    const filename = src.split('/').pop().replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');

    const suggestion = await claude.messages.create({
      model: selectModel('alt_text'),
    system: SYSTEM_PROMPT_CACHED,
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Skriv en kort, beskrivande alt-text (max 10 ord) för en bild på sidan "${pageTitle}". Filnamn: "${filename}". Svara BARA med alt-texten, inget annat.`
      }]
    });

    const altText = suggestion.content[0].text.trim().replace(/^["']|["']$/g, '');
    // BUG FIX: Ersätt tomt alt="" ELLER lägg till nytt (undviker dubblerat alt-attribut)
    let fixedImg;
    if (/alt=["'][^"']*["']/i.test(img)) {
      // Bilden har alt="" (tomt) — ersätt med ny text
      fixedImg = img.replace(/alt=["'][^"']*["']/i, `alt="${altText}"`);
    } else {
      // Bilden saknar alt helt — lägg till
      fixedImg = img.replace(/<img/, `<img alt="${altText}"`);
    }
    content = content.replace(img, fixedImg);
    fixed++;
  }

  if (fixed > 0) {
    if (SAFE_MODE_NO_CONTENT_WRITES) {
      await flagForManualReview('missing_alt_text', post.link,
        `${fixed} bilder saknar alt-text. Detta kräver content-skrivning som kan förstöra page-builder. ` +
        `Använd Perispa MCP \`perispa_fix_missing_alt\` istället.`);
      return { type: 'missing_alt_text', action: 'flagged_safe_mode', count: fixed };
    }
    await wpApi(site, 'POST', `/${wpType}/${postId}`, { content });
  }

  return { type: 'missing_alt_text', fixed, reasoning: `Lade till alt-text på ${fixed} bilder` };
}

async function fixNoSchema(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'no_schema', action: 'skipped_redirect_page' };
  }

  const title = post.title.rendered;
  const url = post.link;
  const text = post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 800);

  const suggestion = await claude.messages.create({
    model: selectModel('schema'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `Generera schema.org JSON-LD markup för denna WordPress-sida (Google 2025-standard + AEO/AI Overviews).
Titel: ${title}
URL: ${url}
Innehållsutdrag: ${text}

Välj lämplig schema-typ (Article, Service, Product, FAQPage, LocalBusiness, WebPage etc).
Krav:
- Inkludera "@id" med kanonisk URL
- Inkludera "areaServed": "SE" för Service/LocalBusiness
- För Article: inkludera author, publisher, datePublished, dateModified, mainEntityOfPage
- För FAQPage: extrahera frågor FRÅN det synliga sidinnehållet (3-5 frågor)
- För Product: inkludera brand, priceCurrency "SEK", availability
- Prioritera Product, LocalBusiness, Article, HowTo — dessa ger fortfarande rich snippets i SERP (2026). FAQPage kan väljas om sidan är FAQ-centrerad men ger inga visuella rich results sedan 2026-05-07
Svara i JSON: {"schemaType": "...", "schemaJson": {...}, "reasoning": "..."}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // BUG FIX: Injicera INTE <script> i content — WordPress/Divi strippar det.
  // Använd Rank Math meta-fält istället.
  // rank_math_rich_snippet_type = schema-typ (Article, Service, etc.)
  // rank_math_snippet_data = serialized schema-data för Rank Math
  // Fallback: lägg i yoast_head_json om Rank Math ej installerat
  let schemaSaved = false;
  try {
    await wpApi(site, 'POST', `/${wpType}/${postId}`, {
      meta: {
        rank_math_rich_snippet_type: result.schemaType.toLowerCase(),
        rank_math_schema_data: JSON.stringify(result.schemaJson)
      }
    });
    schemaSaved = true;
  } catch (e) {
    // Rank Math ej aktiverat — flagga för manuell hantering
    if (SAFE_MODE_NO_CONTENT_WRITES) {
      await flagForManualReview('no_schema', post.link,
        `Rank Math saknas. Schema ${result.schemaType} föreslås. Hantera manuellt eller installera Rank Math.`);
    } else {
      // Bara om SAFE_MODE explicit avstängt: lägg schema som content (riskabelt)
      try {
        const schemaBlock = `<!-- wp:html -->\n<script type="application/ld+json">\n${JSON.stringify(result.schemaJson, null, 2)}\n</script>\n<!-- /wp:html -->`;
        const updatedContent = post.content.rendered + '\n' + schemaBlock;
        await wpApi(site, 'POST', `/${wpType}/${postId}`, { content: updatedContent });
        schemaSaved = true;
      } catch (e2) { /* Schema kunde ej sparas */ }
    }
  }

  await trelloCard(
    `Schema ${result.schemaType}: ${title.substring(0, 35)}`,
    `**Schema Markup**\nSida: ${url}\nTyp: ${result.schemaType}\n${result.reasoning}`
  );

  return { type: 'no_schema', schemaType: result.schemaType, saved: schemaSaved, reasoning: result.reasoning };
}

// ── FAQ-sektion + FAQPage schema (AI-parsing, ej rich results) ──
// OBS 2026-05-07: Google avvecklade FAQ Rich Results — inga visuella expanderbara paneler visas längre.
// FAQPage-schema matar fortfarande Googles AI-system och AI Overviews men ger ingen SERP-display.
// Denna funktion körs bara i explicit manuellt läge eller om sidan är starkt FAQ-centrerad.
async function addFaqAeoSection(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'faq_aeo_section', action: 'skipped_redirect_page' };
  }

  // Hoppa över om FAQPage-schema redan finns
  const existingContent = post.content.rendered;
  if (/FAQPage|acceptedAnswer|mainEntity.*Question/i.test(existingContent)) {
    return { type: 'faq_aeo_section', action: 'faq_already_exists' };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const pageText = existingContent.replace(/<[^>]+>/g, '').substring(0, 1500);
  const kwHint = kw.a.length > 0 ? `\nPrimära nyckelord: ${kw.a.slice(0, 4).join(', ')}` : '';

  const suggestion = await claude.messages.create({
    model: selectModel('schema'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 1800,
    messages: [{
      role: 'user',
      content: `Generera en FAQ-sektion med FAQPage schema för denna sida. FAQPage-schema ökar citat i Google AI Overviews med 3x.

Sida: ${post.title.rendered}
URL: ${post.link}
Innehåll (utdrag): ${pageText}${kwHint}

Krav:
- 4-6 frågor och svar baserade på sidans faktiska innehåll och ämne
- Frågor formulerade som verkliga användarsökfrågor ("Vad kostar X?", "Hur fungerar Y?")
- Svar: 1-3 meningar, direkt och faktabaserat — answer-first format
- HTML-sektionen ska vara synlig på sidan (FAQPage-schema kräver synliga Q&As)
- FAQPage JSON-LD: @context, @id med sidans URL, @type FAQPage, mainEntity-array

Svara i JSON:
{
  "htmlSection": "<section class=\\"faq-section\\"><h2>Vanliga frågor</h2><dl><dt>Fråga?</dt><dd>Svar.</dd></dl></section>",
  "schemaJson": {"@context":"https://schema.org","@id":"URL#faq","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Fråga?","acceptedAnswer":{"@type":"Answer","text":"Svar."}}]},
  "questions": ["fråga1", "fråga2"],
  "reasoning": "varför dessa frågor valdes"
}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  if (SAFE_MODE_NO_CONTENT_WRITES) {
    await flagForManualReview('faq_aeo_section', post.link,
      `FAQ-sektion med ${(result.questions || []).length} frågor föreslås för AEO/AI Overviews. ` +
      `Frågor: ${(result.questions || []).join(', ')}. Hantera via Perispa MCP.`);
    return { type: 'faq_aeo_section', action: 'flagged_safe_mode', questions: result.questions };
  }

  // Injicera FAQ-HTML + FAQPage JSON-LD i content
  const schemaBlock = `\n<!-- wp:html -->\n<script type="application/ld+json">\n${JSON.stringify(result.schemaJson, null, 2)}\n</script>\n<!-- /wp:html -->`;
  const updatedContent = existingContent + '\n' + result.htmlSection + schemaBlock;

  await wpApi(site, 'POST', `/${wpType}/${postId}`, { content: updatedContent });

  await trelloCard(
    `FAQ AEO: ${post.title.rendered.substring(0, 40)}`,
    `**FAQ-sektion + FAQPage schema (AI Overviews)**\nSida: ${post.link}\nFrågor: ${(result.questions || []).join(', ')}\n${result.reasoning}`
  );

  return { type: 'faq_aeo_section', questions: result.questions, reasoning: result.reasoning };
}

async function fixMissingH1(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'missing_h1', action: 'skipped_redirect_page' };
  }

  // Kontrollera om H1 faktiskt saknas i content
  if (/<h1/i.test(post.content.rendered)) {
    return { type: 'missing_h1', action: 'h1_already_exists' };
  }

  const suggestion = await claude.messages.create({
    model: selectModel('meta_title'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Skriv en SEO-optimerad H1-rubrik för denna WordPress-sida.
Nuvarande titel: ${post.title.rendered}
URL: ${post.link}
Innehållsutdrag: ${post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 500)}

Max 60 tecken, inkludera primärt keyword. Svara i JSON: {"h1": "...", "reasoning": "..."}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // Lägg in <h1> som första element i content — det enda sättet att garantera H1 i DOM.
  // Temat kanske renderar post-titeln som H1, men vi kan inte veta det säkert.
  // En explicit <h1> i content är alltid rätt och fungerar på alla teman.
  const h1Tag = `<!-- wp:heading {"level":1} -->\n<h1 class="wp-block-heading">${result.h1}</h1>\n<!-- /wp:heading -->`;
  const updatedContent = h1Tag + '\n' + post.content.rendered;
  await wpApi(site, 'POST', `/${wpType}/${postId}`, { content: updatedContent });

  await trelloCard(
    `H1 tillagd: ${post.title.rendered.substring(0, 40)}`,
    `**H1-rubrik**\nSida: ${post.link}\nH1: ${result.h1}\n${result.reasoning}`
  );

  return { type: 'missing_h1', h1: result.h1, method: 'content_prepend', reasoning: result.reasoning };
}

async function optimizeH2H3(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'h2_h3_optimization', action: 'skipped_redirect_page' };
  }

  // Räkna befintliga H2/H3
  const h2count = (post.content.rendered.match(/<h2/gi) || []).length;
  const h3count = (post.content.rendered.match(/<h3/gi) || []).length;
  if (h2count >= 3) {
    return { type: 'h2_h3_optimization', action: 'sufficient_headings', h2count, h3count };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  if (kw.all.length === 0) {
    return { type: 'h2_h3_optimization', action: 'no_keywords' };
  }

  const currentText = post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 1500);

  const suggestion = await claude.messages.create({
    model: selectModel('content_fix'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `Förbättra rubrikstrukturen (H2/H3) för denna WordPress-sida på svenska.

Sida: ${post.title.rendered}
URL: ${post.link}
Befintliga H2: ${h2count}, H3: ${h3count}
Primära nyckelord (A): ${kw.a.join(', ')}
Sekundära nyckelord (B): ${kw.b.slice(0, 5).join(', ')}
LSI/synonymer att inkludera: bredda med variationer och semantiskt relaterade termer
Nuvarande text: ${currentText}

Krav:
- Föreslå 2-3 nya H2-rubriker med relevanta nyckelord och synonymer
- Varje H2 ska täcka ett semantiskt ämnesområde
- Naturlig svenska, ej keyword-stuffing
- Inkludera 1-2 LSI-termer per rubrik

Svara i JSON: {"headings": [{"level": "h2", "text": "...", "afterText": "första 20 ord av stycket den ska sättas framför", "keyword": "vilket nyckelord/synonym"}], "reasoning": "..."}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  let content = post.content.rendered;
  let added = 0;

  // BUG FIX: afterText-regex misslyckas ofta — Claude returnerar ren text men content är HTML.
  // Strategi: försök exakt match först, annars fördela H2:ar jämnt bland <p>-stycken.
  const paragraphs = content.match(/<p[^>]*>/gi) || [];
  const insertAt = paragraphs.length > 3
    ? [Math.floor(paragraphs.length * 0.3), Math.floor(paragraphs.length * 0.6), Math.floor(paragraphs.length * 0.85)]
    : [1, Math.floor(paragraphs.length / 2), paragraphs.length - 1];

  for (let i = 0; i < result.headings.length; i++) {
    const h = result.headings[i];
    if (!h.text) continue;

    // Försök 1: matcha afterText mot HTML-content (exakt)
    if (h.afterText) {
      const escaped = h.afterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 30);
      const re = new RegExp(`(<p[^>]*>\\s*${escaped})`, 'i');
      if (re.test(content)) {
        content = content.replace(re, `<${h.level}>${h.text}</${h.level}>\n$1`);
        added++;
        continue;
      }
      // Försök 2: matcha utan HTML-taggar i texten (ta bort taggar från afterText)
      const cleanAfter = h.afterText.replace(/<[^>]+>/g, '').trim().substring(0, 25);
      if (cleanAfter.length > 5) {
        const escapedClean = cleanAfter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reClean = new RegExp(`(<p[^>]*>[^<]*${escapedClean})`, 'i');
        if (reClean.test(content)) {
          content = content.replace(reClean, `<${h.level}>${h.text}</${h.level}>\n$1`);
          added++;
          continue;
        }
      }
    }

    // Försök 3 (fallback): sätt H2 vid beräknad paragraf-position
    const targetParagraphIndex = insertAt[i] || insertAt[insertAt.length - 1] || 1;
    let pCount = 0;
    const re3 = /(<p[^>]*>)/gi;
    let match;
    let replaced = false;
    const tmpContent = content;
    content = content.replace(re3, (m) => {
      pCount++;
      if (pCount === targetParagraphIndex && !replaced) {
        replaced = true;
        return `<${h.level}>${h.text}</${h.level}>\n${m}`;
      }
      return m;
    });
    if (replaced) added++;
    else content = tmpContent; // Undo om det misslyckades
  }

  if (added > 0) {
    if (SAFE_MODE_NO_CONTENT_WRITES) {
      await flagForManualReview('h2_h3_optimization', post.link,
        `${added} H2/H3-rubriker föreslås. ${result.reasoning}. Hantera manuellt — content-write riskerar page-builder.`);
      return { type: 'h2_h3_optimization', action: 'flagged_safe_mode', suggested: added };
    }
    await wpApi(site, 'POST', `/${wpType}/${postId}`, { content });
    await trelloCard(
      `H2/H3 optimerat: ${post.title.rendered.substring(0, 35)}`,
      `**Rubrikoptimering**\nSida: ${post.link}\nLade till ${added} nya H2/H3-rubriker med nyckelord och synonymer.\n${result.reasoning}`
    );
  }

  return { type: 'h2_h3_optimization', added, reasoning: result.reasoning };
}

async function enrichWithSynonyms(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'synonym_gap', action: 'skipped_redirect_page' };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  if (kw.all.length === 0) {
    return { type: 'synonym_gap', action: 'no_keywords' };
  }

  const currentText = post.content.rendered.replace(/<[^>]+>/g, '');
  const wordCount = currentText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 150) {
    return { type: 'synonym_gap', action: 'too_short', wordCount };
  }

  const suggestion = await claude.messages.create({
    model: selectModel('content_fix'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Du är en expert på svensk SEO-copywriting. Analysera sidan och identifiera saknade synonymer/LSI-termer till primärnyckelorden. Lägg till dem naturligt.

Sida: ${post.title.rendered}
Primära nyckelord: ${kw.a.join(', ')}
Sekundära nyckelord: ${kw.b.slice(0, 5).join(', ')}
Nuvarande text (${wordCount} ord): ${currentText.substring(0, 1200)}

Uppgift:
1. Identifiera 3-5 synonymer/LSI-termer som saknas i texten
2. Skriv ett nytt stycke (150-200 ord HTML) som naturligt integrerar dessa termer
3. Stycket ska passa semantiskt med sidans ämne

Svara i JSON: {"missingTerms": ["term1", "term2"], "newParagraph": "<p>...</p>", "reasoning": "varför dessa termer"}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  if (SAFE_MODE_NO_CONTENT_WRITES) {
    await flagForManualReview('synonym_gap', post.link,
      `Synonymer/LSI saknas: ${(result.missingTerms || []).join(', ')}. ${result.reasoning}. ` +
      `Föreslagen text:\n${result.newParagraph?.substring(0, 500) || '(saknas)'}`);
    return { type: 'synonym_gap', action: 'flagged_safe_mode', terms: result.missingTerms };
  }
  const updatedContent = post.content.rendered + '\n' + result.newParagraph;
  await wpApi(site, 'POST', `/${wpType}/${postId}`, { content: updatedContent });

  await trelloCard(
    `Synonymer tillagda: ${post.title.rendered.substring(0, 35)}`,
    `**Synonymberikning**\nSida: ${post.link}\nTillagda termer: ${(result.missingTerms || []).join(', ')}\n${result.reasoning}`
  );

  return { type: 'synonym_gap', terms: result.missingTerms, reasoning: result.reasoning };
}

// ═══════════════════════════════════════════════════════════════
// WOOCOMMERCE HANDLERS — Produktnivå-optimering
// ═══════════════════════════════════════════════════════════════

/**
 * Kolla om sajten har WooCommerce — returnera false snabbt om inte
 */
async function siteHasWooCommerce(site) {
  try {
    await wcApi(site, 'GET', '/products', null, { per_page: 1 });
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Optimera produkttitel + short_description + meta (Rank Math) med Claude
 * Task-typ: 'product_metadata'
 */
async function fixProductMetadata(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const productId = context.id || context.product_id;
  if (!productId) return { type: 'product_metadata', action: 'no_product_id' };

  let product;
  try {
    const res = await wcApi(site, 'GET', `/products/${productId}`);
    product = res.data;
  } catch (e) {
    return { type: 'product_metadata', action: 'product_not_found', error: e.message };
  }

  if (product.status !== 'publish') return { type: 'product_metadata', action: 'skipped_not_published' };

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const kwContext = kw.all.length > 0
    ? `\nKundens ABC-nyckelord:\nA: ${kw.a.join(', ') || 'saknas'}\nB: ${kw.b.slice(0, 5).join(', ')}\nC: ${kw.c.slice(0, 5).join(', ')}`
    : '';

  const currentDesc = (product.short_description || '').replace(/<[^>]+>/g, '').substring(0, 300);
  const fullDesc = (product.description || '').replace(/<[^>]+>/g, '').substring(0, 400);

  const suggestion = await claude.messages.create({
    model: selectModel('meta_description'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Optimera SEO för denna WooCommerce-produkt på svenska.

Produktnamn: "${product.name}"
SKU: ${product.sku || 'saknas'}
Kategori: ${(product.categories || []).map(c => c.name).join(', ') || 'okänd'}
Nuvarande short_description: ${currentDesc || 'saknas'}
Nuvarande description (utdrag): ${fullDesc || 'saknas'}
Pris: ${product.price || 'saknas'} kr
${kwContext}

Krav:
- SEO-titel: max 60 tecken, inkludera primärt keyword + produktnamn
- Meta description: 130-155 tecken, fokus på värde + nyckelord + uppmaning
- Short description (HTML): 2-3 meningar, benefits-fokus, max 150 ord
- Naturlig svenska, aldrig keyword-stuffing

Svara i JSON: {"seoTitle": "...", "seoDescription": "...", "shortDescription": "<p>...</p>", "reasoning": "vilket keyword och varför"}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // Uppdatera WooCommerce-produkt
  await wcApi(site, 'PUT', `/products/${productId}`, {
    short_description: result.shortDescription
  });

  // Uppdatera Rank Math-meta via WP REST (produkter är custom post type 'product')
  await wpApi(site, 'POST', `/posts/${productId}`, {
    meta: { rank_math_title: result.seoTitle, rank_math_description: result.seoDescription }
  }).catch(() => {/* Rank Math ej installerat — ignorera */});

  await trelloCard(
    `WooSEO: ${product.name.substring(0, 40)}`,
    `**Produkt-metadata**\nProdukt: ${product.permalink}\nTitel: ${result.seoTitle}\n${result.reasoning}`
  );

  return { type: 'product_metadata', productId, result };
}

/**
 * Utöka tunn produktbeskrivning med Claude
 * Task-typ: 'product_description'
 */
async function fixProductDescription(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const productId = context.id || context.product_id;
  if (!productId) return { type: 'product_description', action: 'no_product_id' };

  let product;
  try {
    const res = await wcApi(site, 'GET', `/products/${productId}`);
    product = res.data;
  } catch (e) {
    return { type: 'product_description', action: 'product_not_found' };
  }

  if (product.status !== 'publish') return { type: 'product_description', action: 'skipped' };

  const currentDesc = (product.description || '').replace(/<[^>]+>/g, '');
  const wordCount = currentDesc.split(/\s+/).filter(Boolean).length;

  if (wordCount >= 200) return { type: 'product_description', action: 'already_sufficient', wordCount };

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const kwHint = kw.a.length > 0 ? `\nPrimära nyckelord att inkludera: ${kw.a.slice(0, 3).join(', ')}` : '';

  const suggestion = await claude.messages.create({
    model: selectModel('content_fix'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Skriv en SEO-optimerad produktbeskrivning på svenska för WooCommerce.

Produktnamn: "${product.name}"
Kategori: ${(product.categories || []).map(c => c.name).join(', ') || 'okänd'}
Befintlig beskrivning: ${currentDesc.substring(0, 500) || 'Saknas helt'}
Pris: ${product.price || 'okänt'} kr
SKU: ${product.sku || 'saknas'}${kwHint}

Krav:
- 150-300 ord
- Börja med produktens nytta/problem som löses
- Inkludera tekniska detaljer som kunder söker efter
- 2-4 stycken HTML med <p>-taggar, gärna en <ul> med features
- Naturlig svenska, ingen keyword-stuffing

Svara i JSON: {"description": "<p>...</p>...", "wordCount": 180, "reasoning": "..."}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  await wcApi(site, 'PUT', `/products/${productId}`, {
    description: result.description
  });

  await trelloCard(
    `Produkttext: ${product.name.substring(0, 40)}`,
    `**Produktbeskrivning utökad**\nFrån ${wordCount} ord → ~${result.wordCount} ord\nProdukt: ${product.permalink}\n${result.reasoning}`
  );

  return { type: 'product_description', productId, wordCount, newWordCount: result.wordCount, reasoning: result.reasoning };
}

/**
 * Fixa saknad alt-text på produktbilder
 * Task-typ: 'product_images'
 */
async function fixProductImages(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const productId = context.id || context.product_id;
  if (!productId) return { type: 'product_images', action: 'no_product_id' };

  let product;
  try {
    const res = await wcApi(site, 'GET', `/products/${productId}`);
    product = res.data;
  } catch (e) {
    return { type: 'product_images', action: 'product_not_found' };
  }

  const images = (product.images || []).filter(img => !img.alt || img.alt.trim() === '');
  if (images.length === 0) return { type: 'product_images', action: 'all_images_have_alt' };

  const updatedImages = [...(product.images || [])];
  let fixed = 0;

  for (const img of images.slice(0, 5)) {
    const filename = (img.src || '').split('/').pop().replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');
    const suggestion = await claude.messages.create({
      model: selectModel('alt_text'),
    system: SYSTEM_PROMPT_CACHED,
      max_tokens: 80,
      messages: [{
        role: 'user',
        content: `Alt-text (max 10 ord) för produktbild på "${product.name}". Filnamn: "${filename}". Svara BARA med alt-texten.`
      }]
    });
    const altText = suggestion.content[0].text.trim().replace(/^["']|["']$/g, '');
    const idx = updatedImages.findIndex(i => i.id === img.id);
    if (idx !== -1) {
      updatedImages[idx] = { ...updatedImages[idx], alt: altText };
      fixed++;
    }
  }

  if (fixed > 0) {
    await wcApi(site, 'PUT', `/products/${productId}`, { images: updatedImages });
  }

  return { type: 'product_images', productId, fixed };
}

/**
 * Lägg till Product schema.org markup på en produkt via Rank Math
 * Task-typ: 'product_schema'
 */
async function fixProductSchema(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const productId = context.id || context.product_id;
  if (!productId) return { type: 'product_schema', action: 'no_product_id' };

  let product;
  try {
    const res = await wcApi(site, 'GET', `/products/${productId}`);
    product = res.data;
  } catch (e) {
    return { type: 'product_schema', action: 'product_not_found' };
  }

  if (product.status !== 'publish') return { type: 'product_schema', action: 'skipped' };

  const schemaJson = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: (product.short_description || product.description || '').replace(/<[^>]+>/g, '').substring(0, 500),
    url: product.permalink,
    sku: product.sku || undefined,
    image: (product.images || []).slice(0, 3).map(i => i.src),
    offers: {
      '@type': 'Offer',
      price: product.price || product.regular_price,
      priceCurrency: 'SEK',
      availability: product.stock_status === 'instock'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: product.permalink
    }
  };

  // Spara via Rank Math custom meta på 'product' post type
  try {
    await wpApi(site, 'POST', `/posts/${productId}`, {
      meta: {
        rank_math_rich_snippet_type: 'product',
        rank_math_schema_data: JSON.stringify(schemaJson)
      }
    });
  } catch (e) {
    // Rank Math ej tillgängligt — ignorera
  }

  return { type: 'product_schema', productId, schemaType: 'Product', name: product.name };
}

/**
 * WooCommerce-audit: crawla alla produkter, hitta SEO-problem, lägg i work_queue
 * Kallas autonomt en gång per körning för kunder med WooCommerce + inga woo-tasks i kön
 */
async function runWooAudit(site, bq, dataset) {
  let page = 1;
  const issues = [];
  const MAX_PRODUCTS = 200; // Max per körning

  while (issues.length < MAX_PRODUCTS) {
    let res;
    try {
      res = await wcApi(site, 'GET', '/products', null, {
        per_page: 50, page, status: 'publish',
        orderby: 'modified', order: 'asc'
      });
    } catch (e) { break; }

    if (!res.data || res.data.length === 0) break;

    for (const p of res.data) {
      const desc = (p.description || '').replace(/<[^>]+>/g, '');
      const shortDesc = (p.short_description || '').replace(/<[^>]+>/g, '');
      const descWords = desc.split(/\s+/).filter(Boolean).length;
      const imgsWithoutAlt = (p.images || []).filter(i => !i.alt || !i.alt.trim()).length;

      if (!shortDesc || shortDesc.length < 30) {
        issues.push({ type: 'product_metadata', priority: 8, productId: p.id, name: p.name, url: p.permalink });
      } else if (descWords < 100) {
        issues.push({ type: 'product_description', priority: 7, productId: p.id, name: p.name, url: p.permalink });
      }
      if (imgsWithoutAlt > 0) {
        issues.push({ type: 'product_images', priority: 6, productId: p.id, name: p.name, url: p.permalink });
      }
    }

    if (res.data.length < 50) break;
    page++;
  }

  if (issues.length === 0) return 0;

  // Lägg upp till 20 nya tasks i work_queue (undvik dubletter)
  const [existingRows] = await bq.query({
    query: `SELECT page_url FROM \`${dataset}.seo_work_queue\`
            WHERE customer_id = @cid AND task_type LIKE 'product_%' AND status = 'pending'`,
    params: { cid: site.id }
  }).catch(() => [[]]);
  const existingUrls = new Set((existingRows || []).map(r => r.page_url));

  // Bygg rader för streaming insert (DML INSERT blockeras i free-tier seo-aouto)
  const rows = [];
  for (const issue of issues.slice(0, 20)) {
    if (existingUrls.has(issue.url)) continue;
    rows.push({
      queue_id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      customer_id: site.id,
      site_url: site.url,
      task_type: issue.type,
      page_url: issue.url,
      priority: issue.priority,
      status: 'pending',
      context_data: JSON.stringify({ id: issue.productId, product_id: issue.productId, url: issue.url, title: issue.name }),
      created_at: new Date().toISOString(),
      source: 'woo_audit'
    });
  }

  let added = 0;
  if (rows.length > 0) {
    try {
      await bq.dataset(dataset).table('seo_work_queue').insert(rows);
      added = rows.length;
    } catch (e) {
      const msg = (e && e.message ? e.message : String(e)).substring(0, 120);
      console.warn(`  WooAudit ${site.id}: streaming insert misslyckades (${msg})`);
    }
  }

  console.log(`  WooAudit ${site.id}: hittade ${issues.length} problem, lade till ${added} tasks`);
  return added;
}

// ── Svenska namn för task-typer ──
function formatTaskType(type) {
  const names = {
    'short_title':        'Förlängde titel',
    'long_title':         'Kortade ner titel',
    'thin_content':       'Utökade innehåll',
    'missing_h1':         'La till H1-rubrik',
    'no_internal_links':  'La till interna länkar',
    'missing_alt_text':   'La till alt-text på bilder',
    'no_schema':          'La till schema markup',
    'h2_optimization':    'Optimerade H2-rubriker',
    'h3_optimization':    'Optimerade H3-rubriker',
    'h2_h3_optimization': 'Optimerade H2/H3-rubriker med synonymer',
    'synonym_gap':        'Berikat text med synonymer och LSI-termer',
    'metadata':           'Optimerade metadata',
    'title':              'Optimerade sidtitel',
    'description':        'Skrev meta-beskrivning',
    'faq_schema':         'La till FAQ-schema',
    'faq_aeo_section':    'La till FAQ-sektion + FAQPage schema (AI Overviews)',
    'internal_links':     'Förbättrade intern länkning',
    'content':            'Innehållsoptimering',
    'schema':             'La till schema markup',
    'technical':          'Teknisk SEO-fix',
    'manual':             'Manuell åtgärd',
    'product_metadata':   'WooCommerce produktmetadata optimerad',
    'product_description':'WooCommerce produktbeskrivning utökad',
    'product_images':     'WooCommerce produktbilder alt-text fixad',
    'product_schema':     'WooCommerce produkt-schema tillagd'
  };
  return names[type] || type || 'SEO-optimering';
}

// ── Artikelgenerering ──
async function createArticle(site, task, claude, bq, dataset) {
  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  if (kw.all.length === 0) {
    return { type: 'create_article', action: 'no_keywords' };
  }

  // Hämta befintliga inlägg för att undvika duplicering
  const existingPosts = await wpApi(site, 'GET', '/posts?per_page=50&_fields=id,title,link');
  const existingTitles = existingPosts.map(p => p.title.rendered.toLowerCase());

  // Välj nyckelord att skriva om (rotera baserat på antal befintliga artiklar)
  const targetKeywords = kw.a.length > 0 ? kw.a : kw.b.length > 0 ? kw.b : kw.c;
  const kwIndex = existingPosts.length % targetKeywords.length;
  const primaryKw = targetKeywords[kwIndex] || kw.all[0];
  const relatedKws = kw.all.filter(k => k !== primaryKw).slice(0, 5);

  const suggestion = await claude.messages.create({
    model: selectModel('full_article'),
    system: SYSTEM_PROMPT_CACHED,
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Du är en expert på svensk SEO-content. Skriv en informativ blogg/guide-artikel.

Företag: ${site.url}
Primärt sökord: ${primaryKw}
Relaterade sökord att inkludera: ${relatedKws.join(', ')}
Befintliga artiklar (undvik liknande titlar): ${existingTitles.slice(0, 10).join(', ')}

Krav:
- Titel: SEO-optimerad, 50-65 tecken, inkludera primärt sökord
- Innehåll: 600-900 ord
- Struktur: H2 + H3-rubriker, korta stycken
- Naturlig svenska, hjälpsam ton
- Inkludera interna länkar till befintliga sidor
- Avsluta med CTA
- HTML-format med p, h2, h3, ul, li, a-taggar

Svara i JSON:
{"title": "Artikeltitel", "content": "<h2>...</h2><p>...</p>...", "excerpt": "Kort sammanfattning (150 tecken)", "slug": "url-slug", "reasoning": "Varför denna vinkel valdes"}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // Kolla att titeln inte redan finns
  if (existingTitles.includes(result.title.toLowerCase())) {
    return { type: 'create_article', action: 'duplicate_title', title: result.title };
  }

  // Publicera som utkast (draft) — kan ändras till 'publish' för full automation
  const newPost = await wpApi(site, 'POST', '/posts', {
    title: result.title,
    content: result.content,
    excerpt: result.excerpt,
    slug: result.slug,
    status: 'publish',
    categories: [],
    meta: {
      rank_math_title: result.title,
      rank_math_description: result.excerpt
    }
  });

  await trelloCard(
    `Ny artikel: ${result.title.substring(0, 45)}`,
    `**Artikelgenerering**\nSökord: ${primaryKw}\nURL: ${newPost.link}\n${result.reasoning}`
  );

  return { type: 'create_article', action: 'published', title: result.title, url: newPost.link, keyword: primaryKw };
}

// ── llms.txt generator (per sajt — AI-crawler-standard 2026) ──
// Hämtar alla publicerade sidor + inlägg, bygger en Markdown-karta per llmstxt.org-spec,
// och sparar den som en WP-sida med slug 'llms-txt-content' (llms-txt-generator Lambda
// läser denna och publicerar som statisk fil på /llms.txt).
async function generateLlmsTxt(site, task) {
  const EXCLUDE_SLUGS = ['checkout', 'cart', 'my-account', 'login', 'tack', 'kassan', 'varukorg', 'kassa', 'bekraftelse'];

  let siteName = site.id;
  let siteDesc = '';
  try {
    const settings = await wpApi(site, 'GET', '/settings');
    siteName = settings.title || site.id;
    siteDesc = settings.description || '';
  } catch (e) { /* inget WP-settings-stöd */ }

  const pages = [];
  try {
    let pg = 1;
    while (pages.length < 60) {
      const batch = await wpApi(site, 'GET', `/pages?status=publish&per_page=100&page=${pg}&_fields=title,link,excerpt`);
      if (!batch.length) break;
      pages.push(...batch);
      if (batch.length < 100) break;
      pg++;
    }
  } catch (e) { /* pages API ej tillgänglig */ }

  const posts = [];
  try {
    const batch = await wpApi(site, 'GET', `/posts?status=publish&per_page=30&orderby=date&order=desc&_fields=title,link,excerpt`);
    posts.push(...batch);
  } catch (e) { /* posts API ej tillgänglig */ }

  const filteredPages = pages.filter(p => {
    const seg = (p.link || '').replace(/\/$/, '').split('/').pop() || '';
    return !EXCLUDE_SLUGS.some(ex => seg.includes(ex));
  });

  const siteUrl = site.url.replace(/\/$/, '');
  const lines = [
    `# ${siteName}`,
    '',
    `> ${siteDesc || `${siteName} — officiell webbplats`}`,
    '',
    '## Viktiga sidor',
    '',
  ];
  for (const p of filteredPages.slice(0, 25)) {
    const title = (p.title.rendered || '').replace(/&#\d+;/g, '').replace(/<[^>]+>/g, '').trim();
    const excerpt = (p.excerpt?.rendered || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 120);
    if (title) lines.push(`- [${title}](${p.link}): ${excerpt || `Information om ${title.toLowerCase()}`}`);
  }
  if (posts.length > 0) {
    lines.push('');
    lines.push('## Artiklar och guider');
    lines.push('');
    for (const p of posts.slice(0, 20)) {
      const title = (p.title.rendered || '').replace(/&#\d+;/g, '').replace(/<[^>]+>/g, '').trim();
      const excerpt = (p.excerpt?.rendered || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 120);
      if (title) lines.push(`- [${title}](${p.link}): ${excerpt || `Artikel: ${title.toLowerCase()}`}`);
    }
  }

  const content = lines.join('\n');

  // Spara som WP-sida med slug llms-txt-content (llms-txt-generator Lambda läser denna)
  const safeContent = `<!-- wp:preformatted --><pre class="wp-block-preformatted">${content.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre><!-- /wp:preformatted -->`;
  try {
    const existing = await wpApi(site, 'GET', '/pages?slug=llms-txt-content&per_page=1&_fields=id');
    if (existing.length > 0) {
      await wpApi(site, 'POST', `/pages/${existing[0].id}`, { content: safeContent, status: 'publish' });
    } else {
      await wpApi(site, 'POST', '/pages', {
        title: 'LLMs.txt Content',
        slug: 'llms-txt-content',
        content: safeContent,
        status: 'publish'
      });
    }
  } catch (e) {
    console.log(`  llms_txt ${site.id}: WP API-fel: ${e.message}`);
    throw e;
  }
  return { type: 'llms_txt', action: 'generated', pages: filteredPages.length, posts: posts.length, chars: content.length };
}

// ── E-E-A-T author schema (Article + Person + Organization per sida 2026) ──
// Lägger till/uppdaterar Article-schema med author Person och publisher Organization
// inkl. sameAs LinkedIn+Wikidata där det kan hämtas ur SSM. dateModified sätts alltid.
async function addEeatAuthorSchema(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);

  // Hämta kundinfo ur SSM (saknas → tomma strängar)
  let companyName = site.id;
  let contactPerson = '';
  let linkedinUrl = '';
  try { companyName = await getParam(`/seo-mcp/integrations/${site.id}/company-name`); } catch (e) {}
  try { contactPerson = await getParam(`/seo-mcp/integrations/${site.id}/contact-person`); } catch (e) {}
  try { linkedinUrl = await getParam(`/seo-mcp/integrations/${site.id}/linkedin-org-url`); } catch (e) {}

  const siteUrl = site.url.replace(/\/$/, '');
  const postUrl = (post.link || `${siteUrl}/${post.slug || post.id}`).replace(/\/$/, '');
  const headline = (post.title?.rendered || post.title || '').replace(/&#\d+;/g, '').replace(/<[^>]+>/g, '').trim();
  const datePublished = post.date || new Date().toISOString();
  const dateModified = post.modified || post.date || new Date().toISOString();

  const publisher = {
    '@type': 'Organization',
    '@id': `${siteUrl}/#organization`,
    name: companyName,
    url: siteUrl,
    areaServed: 'SE',
  };
  if (linkedinUrl) publisher.sameAs = [linkedinUrl];

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${postUrl}#article`,
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
    headline,
    datePublished,
    dateModified,
    publisher,
  };
  if (contactPerson) {
    schema.author = { '@type': 'Person', name: contactPerson };
  }

  // Skriv via Rank Math postmeta
  await wpApi(site, 'POST', `/${wpType}/${post.id}`, {
    meta: { rank_math_schema_Article: JSON.stringify(schema) }
  });

  return { type: 'eeat_author_schema', action: 'applied', url: postUrl, headline };
}

// ── Säkra uppgifter: körs alltid (även utan åtgärdsplan) ──
const SAFE_TASK_TYPES = new Set([
  'short_title', 'long_title', 'missing_description', 'missing_h1', 'no_schema', 'thin_content',
  'h2_optimization', 'h3_optimization', 'h2_h3_optimization', 'synonym_gap',
  'missing_alt_text', 'create_article', 'no_internal_links',
  // faq_aeo_section borttagen 2026-05-15: Google avvecklade FAQ Rich Results, ingen visuell SERP-nytta
  // 2026 AI-crawlare + E-E-A-T
  'llms_txt', 'eeat_author_schema',
  // WooCommerce
  'product_metadata', 'product_description', 'product_images', 'product_schema'
]);

// ── Main handler ──
const TASK_HANDLERS = {
  'short_title':          fixMetadata,
  'long_title':           fixMetadata,
  'missing_description':  fixMetadata,
  'no_internal_links':    fixInternalLinks,
  'thin_content':         fixThinContent,
  'missing_h1':           fixMissingH1,
  'missing_alt_text':     fixMissingAltText,
  'no_schema':            fixNoSchema,
  'faq_aeo_section':      addFaqAeoSection,
  'h2_optimization':      optimizeH2H3,
  'h3_optimization':      optimizeH2H3,
  'h2_h3_optimization':   optimizeH2H3,
  'synonym_gap':          enrichWithSynonyms,
  'create_article':       createArticle,
  // 2026 AI-crawlare + E-E-A-T
  'llms_txt':             generateLlmsTxt,
  'eeat_author_schema':   addEeatAuthorSchema,
  // WooCommerce
  'product_metadata':     fixProductMetadata,
  'product_description':  fixProductDescription,
  'product_images':       fixProductImages,
  'product_schema':       fixProductSchema
};

// ── Beräkna aktuell planmånad (månader sedan planen skapades, 1-indexerad, max 3) ──
function currentPlanMonth(createdAt) {
  const start = new Date(createdAt.value || createdAt);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.min(Math.max(months + 1, 1), 3);
}

// ── Hämta uppgifter från action_plans för en kund (aktuell månad) ──
async function getActionPlanTasks(bq, dataset, customerId, maxTasks) {
  try {
    // Hitta planens skapandedatum för att räkna ut aktuell månad
    const [planMeta] = await bq.query({
      query: `SELECT MIN(created_at) as created_at FROM \`${dataset}.action_plans\`
              WHERE customer_id = @cid AND status IN ('planned', 'active', 'error')`,
      params: { cid: customerId }
    });
    if (!planMeta.length || !planMeta[0].created_at) return [];

    const month = currentPlanMonth(planMeta[0].created_at);
    console.log(`  ${customerId}: action_plan aktuell månad = ${month}`);

    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.action_plans\`
              WHERE customer_id = @cid
              AND status IN ('planned', 'active', 'error')
              AND month_number = @month
              AND target_url IS NOT NULL
              AND target_url != ''
              ORDER BY priority DESC
              LIMIT @maxTasks`,
      params: { cid: customerId, month, maxTasks }
    });
    return rows;
  } catch (e) {
    console.log(`  Ingen action_plan hittad for ${customerId}: ${e.message}`);
    return [];
  }
}

// ── Kör en action_plan-uppgift och uppdatera dess status ──
async function runActionPlanTask(planTask, site, claude, bq, dataset) {
  // Bygg ett task-objekt som handler-funktionerna förstår
  const fakeTask = {
    queue_id: planTask.plan_id,
    customer_id: planTask.customer_id,
    task_type: mapPlanTaskType(planTask.task_type),
    page_url: planTask.target_url,
    priority: planTask.priority || 50,
    context_data: JSON.stringify({
      id: extractWpIdFromUrl(planTask.target_url),
      url: planTask.target_url,
      title: planTask.task_description || '',
      keyword: planTask.target_keyword || ''
    })
  };

  const handler = TASK_HANDLERS[fakeTask.task_type];
  if (!handler) {
    console.log(`  Ingen handler for plan task_type: ${planTask.task_type} (mappat: ${fakeTask.task_type})`);
    await safeDml(bq, `UPDATE \`${dataset}.action_plans\` SET status = 'skipped' WHERE plan_id = @pid`, { pid: planTask.plan_id });
    return null;
  }

  const result = await handler(site, fakeTask, claude, bq, dataset);

  // Markera planen som klar (DML kan blockeras i free-tier — safeDml sväljer felet)
  await safeDml(bq, `UPDATE \`${dataset}.action_plans\`
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP()
            WHERE plan_id = @pid`, { pid: planTask.plan_id });

  // Logga i seo_optimization_log (streaming insert — DML ej tillgängligt i Lambda-kontexten)
  await bq.dataset(dataset).table('seo_optimization_log').insert([{
    timestamp: { value: new Date().toISOString() },
    customer_id: planTask.customer_id,
    site_url: site.url,
    optimization_type: fakeTask.task_type,
    page_url: planTask.target_url,
    before_state: planTask.task_description || '',
    after_state: JSON.stringify(result),
    claude_reasoning: ('[Plan M' + (planTask.month_number || 1) + '] ' + formatTaskType(fakeTask.task_type) + ': ' + (result.reasoning || result.action || '')).substring(0, 500),
    impact_estimate: String((planTask.priority || 50) / 10)
  }]);

  return result;
}

// ── Mappa action_plan task_type → handler-nyckel ──
function mapPlanTaskType(type) {
  const map = {
    // Metadata-varianter
    'metadata_optimization': 'short_title',
    'metadata':              'short_title',  // BUG FIX: 'metadata' mappades inte
    'title_optimization':    'short_title',
    'title':                 'short_title',  // BUG FIX
    'meta_title':            'short_title',
    'meta_description':      'short_title',
    'description':           'short_title',  // BUG FIX
    // Innehållsvarianter
    'content_optimization':  'thin_content',
    'content_expansion':     'thin_content',
    'content':               'thin_content', // BUG FIX
    // Länkning
    'internal_linking':      'no_internal_links',
    'internal_links':        'no_internal_links',
    // Schema
    'schema_markup':         'no_schema',
    'schema':                'no_schema',    // BUG FIX
    'faq_schema':            'no_schema',    // BUG FIX
    // FAQ AEO
    'faq_aeo_section':       'faq_aeo_section',
    'faq_aeo':               'faq_aeo_section',
    'aeo_faq':               'faq_aeo_section',
    // Rubriker
    'h1_optimization':       'missing_h1',
    'h2_optimization':       'h2_optimization',
    'h3_optimization':       'h3_optimization',
    'h2_h3_optimization':    'h2_h3_optimization',
    // Synonymer/LSI
    'synonym_gap':           'synonym_gap',
    'synonym_optimization':  'synonym_gap',
    // Bilder
    'alt_text':              'missing_alt_text',
    'missing_alt_text':      'missing_alt_text',
    // WooCommerce
    'product_metadata':      'product_metadata',
    'product_seo':           'product_metadata',
    'product_title':         'product_metadata',
    'product_description':   'product_description',
    'product_content':       'product_description',
    'product_images':        'product_images',
    'product_alt':           'product_images',
    'product_schema':        'product_schema',
    // 2026 AI-crawlare + E-E-A-T
    'llms_txt':              'llms_txt',
    'llms':                  'llms_txt',
    'eeat_author_schema':    'eeat_author_schema',
    'eeat_schema':           'eeat_author_schema',
    'author_schema':         'eeat_author_schema'
    // OBS: 'technical' och 'manual' → ingen handler → graceful skip (korrekt)
  };
  return map[type] || type;
}

// ── Försök extrahera WordPress post-ID från URL (fallback: 0) ──
function extractWpIdFromUrl(url) {
  // Kan inte extrahera utan WP-anrop — returnar 0 och låter handler hämta via slug
  return 0;
}

// ── Hämta WP-post via URL/slug istället för ID ──
async function wpApiByUrl(site, targetUrl) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const slug = targetUrl.replace(/\/$/, '').split('/').pop();

  // BUG FIX: Tom slug = startsidan — hämta via WP front_page setting
  if (!slug || targetUrl.replace(/^https?:\/\/[^/]+\/?$/, '') === '') {
    try {
      const settingsRes = await axios.get(`${site.url}/wp-json/wp/v2/settings`, {
        headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
      });
      const frontPageId = settingsRes.data?.page_on_front;
      if (frontPageId) {
        const pageRes = await axios.get(`${site.url}/wp-json/wp/v2/pages/${frontPageId}`, {
          headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
        });
        return { post: pageRes.data, wpType: 'pages' };
      }
    } catch (e) {}
    // Fallback: hämta page med slug 'hem' eller 'home'
    for (const homeSlug of ['hem', 'home', 'start', 'startsida']) {
      try {
        const res = await axios.get(`${site.url}/wp-json/wp/v2/pages?slug=${homeSlug}&status=publish`, {
          headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
        });
        if (res.data && res.data.length > 0) return { post: res.data[0], wpType: 'pages' };
      } catch (e) {}
    }
    throw new Error('Kunde inte hitta startsidan via slug eller front_page setting');
  }

  // Försök posts
  try {
    const res = await axios.get(`${site.url}/wp-json/wp/v2/posts?slug=${slug}&status=publish`, {
      headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
    });
    if (res.data && res.data.length > 0) return { post: res.data[0], wpType: 'posts' };
  } catch (e) {}
  // Försök WooCommerce products (viktigt för kunder med WC-butik som ilmonte)
  try {
    const res = await axios.get(`${site.url}/wp-json/wc/v3/products?slug=${slug}&status=publish`, {
      headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
    });
    if (res.data && res.data.length > 0) return { post: res.data[0], wpType: 'products' };
  } catch (e) {}
  // Försök pages
  try {
    const res = await axios.get(`${site.url}/wp-json/wp/v2/pages?slug=${slug}&status=publish`, {
      headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
    });
    if (res.data && res.data.length > 0) return { post: res.data[0], wpType: 'pages' };
  } catch (e) {}
  throw new Error('Kunde inte hitta sida via slug: ' + slug);
}


// ── A/B LOG WRITER (2026-05-01) ──
// Skriver ackumulerade A/B-loggposter till BigQuery prompt_ab_log-tabellen.
// Körs i slutet av varje Lambda-invokation. Fel är icke-kritiska.
async function writeABLog(bq, dataset) {
  if (abLogEntries.length === 0) return;
  try {
    const table = bq.dataset(dataset).table('prompt_ab_log');
    // Create table if not exists
    try {
      await table.insert(abLogEntries);
    } catch (e) {
      if (e.code === 404) {
        await bq.dataset(dataset).createTable('prompt_ab_log', {
          schema: {
            fields: [
              { name: 'timestamp', type: 'TIMESTAMP' },
              { name: 'specialist', type: 'STRING' },
              { name: 'prompt_version', type: 'STRING' },
              { name: 'model', type: 'STRING' },
              { name: 'input_tokens', type: 'INTEGER' },
              { name: 'output_tokens', type: 'INTEGER' },
              { name: 'optimization_id', type: 'STRING' },
              { name: 'customer_id', type: 'STRING' }
            ]
          }
        });
        await bq.dataset(dataset).table('prompt_ab_log').insert(abLogEntries);
      }
    }
    console.log(`A/B log: ${abLogEntries.length} entries written`);
  } catch (e) {
    console.error('A/B log write failed (non-critical):', e.message);
  }
}

exports.handler = async (event) => {
  console.log('=== Autonomous Optimizer Started ===');
  // Budget per körning — höjt tillfälligt för veckorapport-deadline
  const MAX_TASKS_PER_CUSTOMER = parseInt(process.env.MAX_TASKS_PER_CUSTOMER || '8', 10);
  const MAX_TOTAL = parseInt(process.env.MAX_TOTAL || '50', 10);
  const LOCK_PARAM = '/seo-mcp/optimizer-running-lock';
  const LOCK_TTL_MS = 12 * 60 * 1000; // 12 minuter — Lambda timeout är 15 min

  // ── Concurrent execution guard (SSM-lås) ──
  let lockAcquired = false;
  try {
    const { SSMClient, GetParameterCommand, PutParameterCommand, DeleteParameterCommand } = require('@aws-sdk/client-ssm');
    const ssmLock = new SSMClient({ region: process.env.AWS_REGION || 'eu-north-1' });
    try {
      const existing = await ssmLock.send(new GetParameterCommand({ Name: LOCK_PARAM }));
      const lockTime = parseInt(existing.Parameter.Value, 10);
      if (!isNaN(lockTime) && Date.now() - lockTime < LOCK_TTL_MS) {
        console.log(`En annan instans kör redan (lås från ${new Date(lockTime).toISOString()}) — avslutar.`);
        return { status: 'skipped', reason: 'concurrent-execution' };
      }
    } catch (e) { /* Parametern finns inte — OK att fortsätta */ }
    await ssmLock.send(new PutParameterCommand({
      Name: LOCK_PARAM, Value: String(Date.now()), Type: 'String', Overwrite: true
    }));
    lockAcquired = true;
    console.log('SSM-lås satt.');
  } catch (lockErr) {
    console.warn('Kunde inte sätta SSM-lås (fortsätter ändå):', lockErr.message);
  }

  try {
    const { bq, dataset } = await getBigQuery();
    const sites = await getWordPressSites();

    const openrouterKey = await getParam('/seo-mcp/openrouter/api-key');

    // Model routing (MODEL_TIERS/selectModel) ligger nu på modul-scope (se topp av filen)
    AI_MODEL = MODEL_TIERS.tier1; // default fallback

    // Langfuse tracing (cloud.langfuse.com)
    if (Langfuse) {
      try {
        const lfSecret = await getParam('/seo-mcp/langfuse/secret-key');
        const lfPublic = await getParam('/seo-mcp/langfuse/public-key');
        langfuseClient = new Langfuse({
          secretKey: lfSecret,
          publicKey: lfPublic,
          baseUrl: 'https://cloud.langfuse.com',
          flushAt: 50,
          flushInterval: 10000
        });
      } catch(e) { console.log('Langfuse init skip:', e.message); }
    }
    const claude = {
      messages: {
        create: async ({ model, system, max_tokens, messages }, opts) => {
          const systemText = Array.isArray(system)
            ? system.map(s => s.text || '').join('\n')
            : (system || '');
          const msgs = systemText
            ? [{ role: 'system', content: systemText }, ...messages]
            : messages;
          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openrouterKey}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://searchboost.se',
              'X-Title': 'Searchboost Opti'
            },
            body: JSON.stringify({ model, messages: msgs, max_tokens })
          });
          const data = await resp.json();
          if (data.error) throw new Error(`OpenRouter: ${data.error.message}`);

          const inputTokens = data.usage?.prompt_tokens || 0;
          const outputTokens = data.usage?.completion_tokens || 0;
          const outputText = data.choices[0].message.content;

          // A/B logging
          abLogEntries.push({
            timestamp: new Date().toISOString(),
            specialist: opts?.specialist || 'general',
            prompt_version: opts?.promptVersion || 'A',
            model: model,
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            optimization_id: opts?.optimizationId || null,
            customer_id: opts?.customerId || null
          });

          // Langfuse tracing
          if (langfuseClient) {
            try {
              const generation = langfuseClient.generation({
                name: opts?.specialist || 'seo-optimization',
                model: model,
                input: msgs,
                output: outputText,
                metadata: {
                  specialist: opts?.specialist || 'general',
                  prompt_version: opts?.promptVersion || 'A',
                  customer_id: opts?.customerId || null,
                  optimization_id: opts?.optimizationId || null
                },
                usage: { input: inputTokens, output: outputTokens }
              });
              generation.end();
            } catch(e) { /* non-critical */ }
          }

          return { content: [{ text: outputText }] };
        }
      }
    };

    const blockedCustomers = new Set();
    const results = [];
    let totalProcessed = 0;

    for (const site of sites) {
      if (totalProcessed >= MAX_TOTAL) break;
      if (blockedCustomers.has(site.id)) continue;

      // Skippa staging/dev/test-miljöer — kör BARA mot livesajter
      if (!isLiveSite(site.url)) {
        console.log(`  Skippar ${site.id} (${site.url}) — ej livesajt`);
        continue;
      }

      // Kontrollera site-typ via SSM (react-standalone / sanity → ej WP-API, skippa med info)
      try {
        const siteType = await getParam(`/seo-mcp/integrations/${site.id}/site-type`).catch(() => 'wordpress');
        if (siteType === 'react-standalone' || siteType === 'sanity') {
          console.log(`  Skippar ${site.id} — site-type="${siteType}" kräver anpassad integration (ej WP REST API)`);
          continue;
        }
      } catch(e) { /* SSM-param saknas = WordPress (standard) */ }

      // Skippa om inga nyckelord finns
      const customerKw = await getCustomerKeywords(bq, dataset, site.id);
      if (customerKw.all.length === 0) {
        console.log(`  Skippar ${site.id} — inga nyckelord konfigurerade`);
        continue;
      }

      const remaining = MAX_TOTAL - totalProcessed;
      const maxForThisCustomer = Math.min(MAX_TASKS_PER_CUSTOMER, remaining);

      // ── PRIMÄRT: Hämta uppgifter från action_plans (aktuell månad) ──
      const planTasks = await getActionPlanTasks(bq, dataset, site.id, maxForThisCustomer);

      if (planTasks.length > 0) {
        console.log(`  ${site.id}: ${planTasks.length} uppgifter från action_plan`);

        for (const planTask of planTasks) {
          if (blockedCustomers.has(site.id)) break;
          if (totalProcessed >= MAX_TOTAL) break;

          // Validera target_url mot blocklist
          if (shouldSkipPlanUrl(planTask.target_url)) {
            console.log(`  Skippar plan-uppgift — blockad URL: ${planTask.target_url}`);
            await safeDml(bq, `UPDATE \`${dataset}.action_plans\` SET status = 'skipped' WHERE plan_id = @pid`, { pid: planTask.plan_id });
            continue;
          }

          try {
            console.log(`  [Plan] ${planTask.task_type} → ${planTask.target_url}`);
            const result = await runActionPlanTask(planTask, site, claude, bq, dataset);
            if (result) {
              results.push({ plan_id: planTask.plan_id, customer_id: site.id, ...result });
              totalProcessed++;
            }
          } catch (err) {
            console.error(`  Fel vid plan-uppgift ${planTask.plan_id}: ${err.message}`);
            if (err.response && err.response.status === 403) {
              blockedCustomers.add(site.id);
            }
            const newStatus = (err.response && err.response.status === 404) ? 'skipped' : 'error';
            if (newStatus === 'skipped') {
              console.log(`  Skippar permanent (404): ${planTask.target_url}`);
            }
            await safeDml(bq, `UPDATE \`${dataset}.action_plans\` SET status = @status WHERE plan_id = @pid`, { status: newStatus, pid: planTask.plan_id });
          }
        }

      } else {
        // ── SEKUNDÄRT FALLBACK: work_queue (kunder utan action_plan) ──
        console.log(`  ${site.id}: ingen action_plan — kör work_queue (fallback)`);

        // Hämta fler uppgifter än vi kör — sorterar om med signal-boost efteråt
        const fetchLimit = Math.min(maxForThisCustomer * 4, 40);
        const [rawQueueTasks] = await bq.query({
          query: `SELECT * FROM \`${dataset}.seo_work_queue\`
                  WHERE customer_id = @cid AND status = 'pending'
                  ORDER BY priority DESC LIMIT @max`,
          params: { cid: site.id, max: fetchLimit }
        });

        // GSC + Ads signal-boost — re-prioritera kön
        const signalBoost = await getSignalBoost(bq, dataset, site.id);
        const queueTasks = rawQueueTasks
          .map(task => {
            const boost = signalBoost.get(task.page_url) || 1.0;
            return { ...task, _effectivePriority: (task.priority || 5) * boost };
          })
          .sort((a, b) => b._effectivePriority - a._effectivePriority)
          .slice(0, maxForThisCustomer);

        if (signalBoost.size > 0) {
          console.log(`  Signal-boost aktiv — ${signalBoost.size} URL:er med GSC/Ads-data`);
        }

        for (const task of queueTasks) {
          if (blockedCustomers.has(site.id)) break;
          if (totalProcessed >= MAX_TOTAL) break;

          // Bara säkra uppgifter i fallback-läge (ingen plan = ingen åtgärdsplan godkänd av Mikael)
          if (!SAFE_TASK_TYPES.has(task.task_type)) {
            console.log(`  Skippar ${task.task_type} — kräver åtgärdsplan`);
            continue;
          }

          const handler = TASK_HANDLERS[task.task_type];
          if (!handler) {
            await safeDml(bq, `UPDATE \`${dataset}.seo_work_queue\` SET status = 'skipped' WHERE queue_id = @qid`, { qid: task.queue_id });
            continue;
          }

          try {
            console.log(`  [Queue] ${task.task_type} → ${task.page_url}`);
            const result = await handler(site, task, claude, bq, dataset);
            results.push({ queue_id: task.queue_id, customer_id: site.id, ...result });
            totalProcessed++;

            // UPDATE via DML — safeDml sväljer fel (DML kan blockeras i free-tier)
            await safeDml(bq, `UPDATE \`${dataset}.seo_work_queue\` SET status = 'completed', processed_at = CURRENT_TIMESTAMP() WHERE queue_id = @qid`, { qid: task.queue_id });

            // Streaming insert — DML INSERT INTO fungerar ej i Lambda-kontexten
            await bq.dataset(dataset).table('seo_optimization_log').insert([{
              timestamp: { value: new Date().toISOString() },
              customer_id: task.customer_id,
              site_url: site.url,
              optimization_type: task.task_type,
              page_url: task.page_url,
              before_state: task.context_data,
              after_state: JSON.stringify(result),
              claude_reasoning: ('[Queue] ' + formatTaskType(task.task_type) + ': ' + (result.reasoning || result.action || '')).substring(0, 500),
              impact_estimate: String((task.priority || 5) / 10)
            }]);

          } catch (err) {
            console.error(`  Fel vid queue-uppgift ${task.queue_id}: ${err.message}`);
            if (err.response && err.response.status === 403) {
              blockedCustomers.add(site.id);
            }
            const newStatus = (err.response && err.response.status === 404) ? 'skipped' : 'error';
            if (newStatus === 'skipped') {
              console.log(`  Skippar permanent (404): ${task.page_url}`);
            }
            await safeDml(bq, `UPDATE \`${dataset}.seo_work_queue\` SET status = @status WHERE queue_id = @qid`, { status: newStatus, qid: task.queue_id });
          }
        }
      }
    }

    // ── WooCommerce-audit: körs efter alla site-loopar ──
    // Fyller work_queue med produkt-tasks för nästa körning om WooCommerce finns
    for (const site of sites) {
      if (blockedCustomers.has(site.id)) continue;
      try {
        const hasWoo = await siteHasWooCommerce(site);
        if (!hasWoo) continue;
        await runWooAudit(site, bq, dataset);
      } catch (e) {
        console.log(`  WooAudit ${site.id} fel: ${e.message}`);
      }
    }

    console.log(`=== Optimizer klar: ${totalProcessed} uppgifter körda ===`);

    // Skriv A/B-logg till BigQuery (non-critical — påverkar ej resultat vid fel)
    await writeABLog(bq, dataset);
    if (langfuseClient) { try { await langfuseClient.flushAsync(); } catch(e) {} }

    return { statusCode: 200, body: JSON.stringify({ processed: totalProcessed, results }) };
  } catch (err) {
    console.error('Optimizer misslyckades:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    // ── Frigör SSM-låset ──
    if (lockAcquired) {
      try {
        const { SSMClient, DeleteParameterCommand } = require('@aws-sdk/client-ssm');
        const ssmLock = new SSMClient({ region: process.env.AWS_REGION || 'eu-north-1' });
        await ssmLock.send(new DeleteParameterCommand({ Name: LOCK_PARAM }));
        console.log('SSM-lås frigjort.');
      } catch (e) { console.warn('Kunde inte frigöra SSM-lås:', e.message); }
    }
  }
};

// ── Kontrollera om en sajt-URL är en livesajt (inte staging/dev) ──
// Regel: optimizern får ALDRIG köra mot staging-, dev- eller testmiljöer.
// Staging-indikatorer: localhost, .local, staging., dev., test., .wpengine.com,
// .kinsta.cloud, .wp-staging.com, searchboost.nu (vår stagingdomän),
// tobler.searchboost.se (tobler staging).
function isLiveSite(url) {
  if (!url) return false;
  const STAGING_PATTERNS = [
    /^https?:\/\/localhost/i,
    /\.local(:\d+)?(\/|$)/i,
    /\bstaging\b/i,
    /\/\/dev\./i,
    /\/\/test\./i,
    /\.wpengine\.com/i,
    /\.kinsta\.cloud/i,
    /\.wp-staging\.com/i,
    /searchboost\.nu/i,
    /tobler\.searchboost\./i,
  ];
  return !STAGING_PATTERNS.some(p => p.test(url));
}

// ── Kontrollera om en plan-URL är blockad ──
function shouldSkipPlanUrl(url) {
  if (!url) return true;
  const BLOCKED = [
    /\/(kassan|checkout|varukorg|cart|kassa)(\/|$)/i,
    /\/(min-konto|my-account|mitt-konto)(\/|$)/i,
    /\/(betalning|payment|order-received|orderbekraftelse)(\/|$)/i,
    // OBS: /butik och /shop blockeras INTE längre — de kan vara produktkategorier
    // Produktsidor (/produkt/, /product/) är tillåtna och hanteras av WooCommerce-handlers
    /\/(login|logga-in|register|registrera)(\/|$)/i,
    /\/(tack|thank-you|bekraftelse)(\/|$)/i,
    /\/(wp-content|wp-includes|wp-admin)\//i,
    /\/(feed|sitemap)(\/|$)/i,
  ];
  return BLOCKED.some(p => p.test(url));
}
