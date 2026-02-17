/**
 * Prospect Analyzer Lambda — Ersätter SE Ranking Analys-PDF + Manuell Åtgärdsplan
 *
 * Genererar automatiskt:
 * 1. SEO-analys (HTML) — skickas till kunden innan mötet
 * 2. Presentation (Markdown) — visas på mötet med ROI-uppskattningar och pris
 *
 * Datakällor:
 * - WordPress REST API (crawl av alla sidor, identifiera SEO-problem)
 * - Google PageSpeed Insights API (Core Web Vitals + Performance Score)
 * - Google Search Console (befintliga positioner + sökvolymer)
 * - Google Autocomplete (relaterade sökord)
 * - Claude AI (analys, uppskattningar, åtgärdsplan, ROI-beräkning)
 *
 * Trigger: Manuellt via API — POST /api/prospect-analysis
 * Input: { url: "https://example.se", companyName: "Företag AB", industry: "bransch" }
 */
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
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

// ── 1. WordPress Crawl — Identifiera SEO-problem ──

/**
 * Crawla en sajt via WordPress REST API (utan credentials).
 * WP REST API är ofta öppet för läsning av publicerat innehåll.
 * Om sajten inte kör WP, faller vi tillbaka på vanlig HTML-crawl.
 */
async function crawlSite(url) {
  const result = {
    platform: 'unknown',
    totalPages: 0,
    totalPosts: 0,
    pages: [],
    issues: {
      critical: [],
      structural: [],
      content: []
    },
    summary: {}
  };

  const cleanUrl = url.replace(/\/$/, '');

  // Försök WordPress REST API
  try {
    const wpPages = await axios.get(`${cleanUrl}/wp-json/wp/v2/pages?per_page=100&status=publish`, { timeout: 15000 });
    const wpPosts = await axios.get(`${cleanUrl}/wp-json/wp/v2/posts?per_page=100&status=publish`, { timeout: 15000 });

    result.platform = 'wordpress';
    result.totalPages = wpPages.data.length;
    result.totalPosts = wpPosts.data.length;

    const allContent = [
      ...wpPages.data.map(p => ({ ...p, type: 'page' })),
      ...wpPosts.data.map(p => ({ ...p, type: 'post' }))
    ];

    let missingDescription = 0;
    let missingH1 = 0;
    let shortTitle = 0;
    let longTitle = 0;
    let duplicateTitles = 0;
    let thinContent = 0;
    let missingAltText = 0;
    let noInternalLinks = 0;
    let noSchema = 0;
    let uncategorizedUrls = 0;

    const titleCounts = {};

    for (const item of allContent) {
      const title = item.title?.rendered || '';
      const content = item.content?.rendered || '';
      const text = content.replace(/<[^>]+>/g, '');
      const pageUrl = item.link || '';

      // Räkna titlar för duplikat-check
      const cleanTitle = title.toLowerCase().trim();
      titleCounts[cleanTitle] = (titleCounts[cleanTitle] || 0) + 1;

      const pageIssues = [];

      // Title-problem
      if (!title || title.length < 20) {
        pageIssues.push('short_title');
        shortTitle++;
      }
      if (title && title.length > 60) {
        pageIssues.push('long_title');
        longTitle++;
      }

      // H1 saknas
      if (!content.match(/<h1/i)) {
        pageIssues.push('missing_h1');
        missingH1++;
      }

      // Tunt innehåll
      if (text.length < 300) {
        pageIssues.push('thin_content');
        thinContent++;
      }

      // Alt-text saknas
      const imgsTotal = (content.match(/<img/gi) || []).length;
      const imgsNoAlt = (content.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
      if (imgsNoAlt > 0) {
        pageIssues.push(`missing_alt_text:${imgsNoAlt}`);
        missingAltText += imgsNoAlt;
      }

      // Interna länkar
      const internalLinks = (content.match(new RegExp(`<a[^>]*href=["']${cleanUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')) || []).length;
      if (internalLinks === 0) {
        pageIssues.push('no_internal_links');
        noInternalLinks++;
      }

      // Schema markup
      if (!content.includes('application/ld+json')) {
        noSchema++;
      }

      // /uncategorized/ i URL
      if (pageUrl.includes('/uncategorized/')) {
        pageIssues.push('uncategorized_url');
        uncategorizedUrls++;
      }

      result.pages.push({
        title,
        url: pageUrl,
        type: item.type,
        wordCount: text.split(/\s+/).filter(w => w.length > 0).length,
        issues: pageIssues,
        imagesTotal: imgsTotal,
        imagesNoAlt: imgsNoAlt,
        internalLinks
      });
    }

    // Duplikattitlar
    for (const [title, count] of Object.entries(titleCounts)) {
      if (count > 1) duplicateTitles += count;
    }

    // Meta descriptions — kräver Rank Math/Yoast-data eller head-crawl
    // Vi crawlar hemsidan + 5 slumpmässiga sidor för meta-check
    const pagesToCheck = [cleanUrl, ...allContent.slice(0, 10).map(p => p.link).filter(Boolean)];
    for (const pageUrl of pagesToCheck) {
      try {
        const headRes = await axios.get(pageUrl, { timeout: 10000, maxRedirects: 3 });
        const html = headRes.data;
        const metaMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
        if (!metaMatch || metaMatch[1].length < 10) {
          missingDescription++;
        }
      } catch (e) { /* timeout etc */ }
    }

    // Uppskatta total missing descriptions baserat på stickprov
    const checkRatio = missingDescription / Math.max(pagesToCheck.length, 1);
    const estimatedMissingDesc = Math.round(checkRatio * allContent.length);

    result.summary = {
      totalContent: allContent.length,
      missingDescription: estimatedMissingDesc,
      missingH1,
      shortTitle,
      longTitle,
      duplicateTitles,
      thinContent,
      missingAltText,
      noInternalLinks,
      noSchema,
      uncategorizedUrls
    };

    // Klassificera problem
    if (estimatedMissingDesc > 0) result.issues.critical.push({ type: 'Description missing', count: estimatedMissingDesc, impact: 'Google visar slumpmässigt utdrag istället för kontrollerat budskap' });
    if (missingH1 > 0) result.issues.critical.push({ type: 'H1-tagg saknas', count: missingH1, impact: 'Google förstår inte sidans ämne' });
    if (shortTitle > 0) result.issues.structural.push({ type: 'Title för kort', count: shortTitle, impact: 'Missar sökord i title-taggen' });
    if (longTitle > 0) result.issues.structural.push({ type: 'Title för lång', count: longTitle, impact: 'Klipps i sökresultaten' });
    if (duplicateTitles > 0) result.issues.structural.push({ type: 'Duplicerade sidtitlar', count: duplicateTitles, impact: 'Google vet inte vilken sida som ska rankas' });
    if (thinContent > 0) result.issues.content.push({ type: 'Tunt innehåll (<300 tecken)', count: thinContent, impact: 'Google ignorerar sidor med lite text' });
    if (missingAltText > 0) result.issues.critical.push({ type: 'Alt-text saknas på bilder', count: `${missingAltText} bilder`, impact: 'Missar bildsök-trafik + tillgänglighet' });
    if (noInternalLinks > 0) result.issues.structural.push({ type: 'Sidor utan interna länkar', count: noInternalLinks, impact: '"Föräldralösa" sidor som Google knappt hittar' });
    if (uncategorizedUrls > 0) result.issues.content.push({ type: 'URL:er under /uncategorized/', count: uncategorizedUrls, impact: 'Oprofessionellt och noll SEO-värde' });

  } catch (wpError) {
    // Inte WordPress eller API stängt — fallback till HTML-crawl
    console.log(`  WP API not available: ${wpError.message}, falling back to HTML crawl`);
    result.platform = 'non-wordpress';

    try {
      const htmlRes = await axios.get(cleanUrl, { timeout: 15000, maxRedirects: 3 });
      const html = htmlRes.data;

      // Basic HTML-analys
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      const metaDescMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
      const h1Match = html.match(/<h1[^>]*>([^<]*)<\/h1>/i);
      const imgs = (html.match(/<img/gi) || []).length;
      const imgsNoAlt = (html.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
      const schemaExists = html.includes('application/ld+json');

      result.summary = {
        totalContent: 'Okänt (ej WordPress)',
        pageTitle: titleMatch ? titleMatch[1] : 'SAKNAS',
        metaDescription: metaDescMatch ? metaDescMatch[1] : 'SAKNAS',
        h1: h1Match ? h1Match[1] : 'SAKNAS',
        images: imgs,
        imagesNoAlt: imgsNoAlt,
        hasSchema: schemaExists
      };

      if (!metaDescMatch) result.issues.critical.push({ type: 'Meta description saknas', count: 'Startsidan', impact: 'Google visar slumpmässigt utdrag' });
      if (!h1Match) result.issues.critical.push({ type: 'H1-tagg saknas', count: 'Startsidan', impact: 'Google förstår inte sidans ämne' });
      if (imgsNoAlt > 0) result.issues.critical.push({ type: 'Alt-text saknas', count: `${imgsNoAlt} bilder`, impact: 'Missar bildsök-trafik' });
      if (!schemaExists) result.issues.structural.push({ type: 'Schema markup saknas', count: 'Hela sajten', impact: 'Inga rikare sökresultat' });

    } catch (htmlError) {
      console.log(`  HTML crawl also failed: ${htmlError.message}`);
      result.issues.critical.push({ type: 'Sajten kunde inte nås', count: 1, impact: 'Kontrollera URL' });
    }
  }

  return result;
}

// ── 2. PageSpeed Insights — Core Web Vitals ──

async function getPageSpeed(url) {
  const results = {};

  for (const strategy of ['mobile', 'desktop']) {
    try {
      const res = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
        params: {
          url,
          strategy,
          category: ['performance', 'seo', 'accessibility', 'best-practices'],
          locale: 'sv'
        },
        timeout: 60000
      });

      const lighthouse = res.data.lighthouseResult;
      const categories = lighthouse.categories;
      const audits = lighthouse.audits;

      results[strategy] = {
        performance: Math.round((categories.performance?.score || 0) * 100),
        seo: Math.round((categories.seo?.score || 0) * 100),
        accessibility: Math.round((categories.accessibility?.score || 0) * 100),
        bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
        lcp: audits['largest-contentful-paint']?.numericValue || null,
        inp: audits['interaction-to-next-paint']?.numericValue || audits['max-potential-fid']?.numericValue || null,
        cls: audits['cumulative-layout-shift']?.numericValue || null,
        fcp: audits['first-contentful-paint']?.numericValue || null,
        ttfb: audits['server-response-time']?.numericValue || null,
        speedIndex: audits['speed-index']?.numericValue || null,
        totalBlockingTime: audits['total-blocking-time']?.numericValue || null
      };

      // Resursproblem
      const jsNotMinified = Object.values(audits).filter(a => a.id === 'unminified-javascript' && a.score < 1);
      const cssNotMinified = Object.values(audits).filter(a => a.id === 'unminified-css' && a.score < 1);
      const unusedJs = audits['unused-javascript']?.details?.items?.length || 0;
      const unusedCss = audits['unused-css-rules']?.details?.items?.length || 0;
      const largeImages = audits['uses-optimized-images']?.details?.items?.length || 0;

      results[strategy].resourceIssues = {
        jsNotMinified: jsNotMinified.length > 0,
        cssNotMinified: cssNotMinified.length > 0,
        unusedJs,
        unusedCss,
        largeImages
      };

      // Top opportunities
      results[strategy].opportunities = Object.values(audits)
        .filter(a => a.details?.type === 'opportunity' && a.details?.overallSavingsMs > 100)
        .sort((a, b) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
        .slice(0, 5)
        .map(a => ({ title: a.title, savingsMs: a.details?.overallSavingsMs }));

    } catch (e) {
      console.log(`  PageSpeed ${strategy} failed: ${e.message}`);
      results[strategy] = { error: e.message };
    }
  }

  return results;
}

// ── 3. GSC — Befintliga positioner (om vi har access) ──

async function getGSCData(gscProperty) {
  if (!gscProperty) return null;

  try {
    const auth = await getGSCAuth();
    const searchconsole = google.searchconsole({
      version: 'v1', auth,
      headers: { 'x-goog-user-project': 'seo-aouto' }
    });

    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];

    const res = await searchconsole.searchanalytics.query({
      siteUrl: gscProperty,
      requestBody: {
        startDate, endDate,
        dimensions: ['query'],
        rowLimit: 100,
        type: 'web'
      }
    });

    return (res.data.rows || []).map(row => ({
      keyword: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      estimatedVolume: Math.round(row.impressions / 90 * 30)
    })).sort((a, b) => b.impressions - a.impressions);

  } catch (e) {
    console.log(`  GSC query failed: ${e.message}`);
    return null;
  }
}

// ── 4. Google Autocomplete — Relaterade sökord ──

async function getAutocompleteSuggestions(seedKeywords, locale = 'sv') {
  const suggestions = new Set();

  for (const seed of seedKeywords.slice(0, 10)) {
    try {
      const res = await axios.get('https://www.google.com/complete/search', {
        params: { client: 'chrome', q: seed, hl: locale, gl: 'se' },
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SearchboostBot/1.0)' },
        timeout: 5000
      });
      for (const s of (res.data[1] || [])) {
        if (s !== seed) suggestions.add(s);
      }
    } catch (e) { /* ignorera */ }
    await new Promise(r => setTimeout(r, 200));
  }

  return [...suggestions];
}

// ── 5. Claude AI — Generera analys + presentation ──

async function generateAnalysisAndPresentation(claude, data) {
  const { url, companyName, industry, crawlResult, pageSpeed, gscKeywords, autocompleteSuggestions, contactPerson, priceTier } = data;

  // Bygg data-sammanfattning
  const crawlSummary = crawlResult.platform === 'wordpress'
    ? `WordPress-sajt med ${crawlResult.summary.totalContent} sidor.
Kritiska problem: ${crawlResult.issues.critical.map(i => `${i.type}: ${i.count}`).join(', ') || 'Inga'}
Strukturella problem: ${crawlResult.issues.structural.map(i => `${i.type}: ${i.count}`).join(', ') || 'Inga'}
Innehållsproblem: ${crawlResult.issues.content.map(i => `${i.type}: ${i.count}`).join(', ') || 'Inga'}`
    : `Ej WordPress (${crawlResult.platform}). Begränsad analys.`;

  const psiSummary = `Desktop: ${pageSpeed.desktop?.performance || 'N/A'}/100, Mobil: ${pageSpeed.mobile?.performance || 'N/A'}/100
LCP desktop: ${pageSpeed.desktop?.lcp ? (pageSpeed.desktop.lcp / 1000).toFixed(1) + 's' : 'N/A'}
LCP mobil: ${pageSpeed.mobile?.lcp ? (pageSpeed.mobile.lcp / 1000).toFixed(1) + 's' : 'N/A'}
CLS: ${pageSpeed.mobile?.cls !== null ? pageSpeed.mobile?.cls?.toFixed(3) : 'N/A'}`;

  const gscSummary = gscKeywords
    ? `${gscKeywords.length} sökord trackade.\nTopp 10:\n${gscKeywords.slice(0, 10).map(k => `  ${k.keyword}: pos ${k.position.toFixed(0)}, ${k.impressions} imp, ~${k.estimatedVolume} sökningar/mån`).join('\n')}`
    : 'Ingen GSC-data tillgänglig (vi har inte access till denna sajt ännu).';

  const autoSummary = autocompleteSuggestions.length > 0
    ? `Autocomplete-förslag: ${autocompleteSuggestions.slice(0, 20).join(', ')}`
    : 'Inga autocomplete-förslag hämtade.';

  // Prisintervall
  const priceInfo = {
    small: { monthly: '5 000', total3m: '15 000', desc: 'Liten sajt, grundläggande SEO' },
    medium: { monthly: '8 000', total3m: '24 000', desc: 'Medelstor sajt, full optimering' },
    large: { monthly: '12 000', total3m: '36 000', desc: 'Stor sajt, omfattande arbete' },
    enterprise: { monthly: '15 000', total3m: '45 000', desc: 'Komplex sajt, strukturomläggning' }
  };
  const pricing = priceInfo[priceTier || 'medium'];

  const prompt = `Du är en SEO-expert på Searchboost.se (Mikael Larsson). Generera två dokument baserat på denna analys.

FÖRETAG: ${companyName}
URL: ${url}
BRANSCH: ${industry || 'Okänd'}
KONTAKTPERSON: ${contactPerson || 'Okänd'}

=== CRAWL-DATA ===
${crawlSummary}

Detaljerade sidproblem (topp 20):
${JSON.stringify(crawlResult.pages?.slice(0, 20).map(p => ({
  title: p.title, url: p.url, issues: p.issues, wordCount: p.wordCount
})), null, 2)}

=== PAGESPEED ===
${psiSummary}

Desktop-möjligheter: ${JSON.stringify(pageSpeed.desktop?.opportunities || [])}
Mobil-möjligheter: ${JSON.stringify(pageSpeed.mobile?.opportunities || [])}

=== SÖKORD (GSC) ===
${gscSummary}

=== AUTOCOMPLETE-FÖRSLAG ===
${autoSummary}

=== PRISMODELL ===
Månadsavgift: ${pricing.monthly} kr/mån
Totalt 3 månader: ${pricing.total3m} kr

---

GENERERA TVÅ DOKUMENT:

## DOKUMENT 1: ANALYS (skickas till kunden innan mötet)
Markdown-format. Ska innehålla:
- Sammanfattning (2-3 meningar, rak och ärlig)
- Identifierade problem — tabell med Kritiska/Strukturella/Innehåll
  Format: | Problem | Antal | Påverkan |
  Exakt samma format som SE Ranking-analyser
- Prestanda (PageSpeed-poäng i tabell)
- Om vi har GSC-data: Nuvarande ranking-tabell

Tonen ska vara professionell men inte säljig. Ren fakta.
ANVÄND INTE emojis. Inga utropstecken.

## DOKUMENT 2: PRESENTATION (visas på mötet)
Markdown-format, anpassat för slides. Exakt detta format:

# {CompanyName} — SEO-paket 3 månader
## Searchboost | Offert {year}-{month}
---
## Om {CompanyName}
{kort beskrivning baserad på crawl-data}
---
## Nuläge — vad vår analys visar
### Ranking
{Tabell med positioner OM vi har GSC-data, annars skriv "Vi har inte trackat era positioner ännu — det ingår i paketet"}
### Prestanda
{PageSpeed-tabell}
---
## Identifierade problem — sammanfattning
### Kritiska (Hög prioritet)
{Tabell}
### Strukturella
{Tabell}
### Innehåll & URL-struktur
{Tabell om det finns sådana problem}
---
## Vad vi gör — 3-månaders SEO-plan
### Månad 1: Teknisk SEO & grunden
{Tabell med åtgärder baserade på faktiska problem}
### Månad 2: Innehåll & on-page
{Tabell}
### Månad 3: Prestanda & tillväxt
{Tabell}
---
## Sökordsanalys — tillväxtpotential
### Nuvarande ranking + möjligheter
{Tabell med faktiska + föreslagna sökord, nuvarande position, mål, uppskattad sökvolym}
### Nya sökordskluster att rikta in sig mot
{Tabell med kluster}
---
## Vad ni får — sammanfattning
### Under 3 månader
{Punktlista med alla åtgärder, med antal}
### Förväntat resultat
{Tabell: KPI | Nuläge | Mål efter 3 mån}
  Inkludera: sökord i topp 10, mobil PageSpeed, desktop PageSpeed, % sidor med meta description, organisk trafik
---
## Rapportering & transparens
Veckologg varje fredag kl 16:00
Månadsrapport 1:a varje månad
---
## Prissättning
SEO-paket 3 månader: ${pricing.monthly} kr/mån
Totalt: ${pricing.total3m} kr (exkl. moms)
{inkluderat: lista}
---
## Nästa steg
1. Ni godkänner förslaget
2. Vi behöver: WordPress admin-inlogg
3. Vi installerar Rank Math Pro och börjar direkt
4. Första veckorapporten veckan efter start
---
*Searchboost — vi gör er synliga.*

VIKTIGT:
- Alla siffror ska vara baserade på faktisk data, inte uppskattade
- Uppskattningar av sökvolym ska markeras med ~ (tilde)
- ROI-beräkningar ska vara konservativa
- Åtgärder ska baseras på FAKTISKA problem, inte generiska
- Sökvolymerna: uppskatta baserat på bransch och land (Sverige), var realistisk
- INGA emojis utom checkmarks (✅) i sammanfattningen
- Formatet ska vara exakt som Jelmtech-exemplet

Svara i JSON:
{
  "analysis_md": "hela analys-dokumentet i markdown",
  "presentation_md": "hela presentationen i markdown"
}`;

  const response = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude returnerade inte giltig JSON');
  return JSON.parse(jsonMatch[0]);
}

// ── 6. BigQuery-tabell ──

async function ensureTable(bq, dataset) {
  const tableId = 'prospect_analyses';
  try {
    await bq.dataset(dataset).table(tableId).get();
  } catch (e) {
    if (e.code === 404) {
      console.log('Creating prospect_analyses table...');
      await bq.query({
        query: `
          CREATE TABLE \`${dataset}.${tableId}\` (
            id STRING,
            company_name STRING,
            url STRING,
            industry STRING,
            contact_person STRING,
            analysis_date DATE,
            platform STRING,
            total_pages INT64,
            critical_issues INT64,
            structural_issues INT64,
            content_issues INT64,
            mobile_score INT64,
            desktop_score INT64,
            seo_score INT64,
            gsc_keywords INT64,
            price_tier STRING,
            analysis_md STRING,
            presentation_md STRING,
            raw_data STRING,
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
  console.log('=== Prospect Analyzer Started ===');
  console.log('Event:', JSON.stringify(event));

  const url = event?.url;
  const companyName = event?.companyName || extractCompanyFromUrl(url);
  const industry = event?.industry || '';
  const contactPerson = event?.contactPerson || '';
  const priceTier = event?.priceTier || 'medium'; // small/medium/large/enterprise
  const gscProperty = event?.gscProperty || null; // om vi redan har access

  if (!url) {
    return { statusCode: 400, body: JSON.stringify({ error: 'url krävs' }) };
  }

  try {
    const { bq, dataset } = await getBigQuery();
    await ensureTable(bq, dataset);

    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    const claude = new Anthropic({ apiKey });

    // ── Steg 1: Crawla sajten ──
    console.log(`\n1. Crawling ${url}...`);
    const crawlResult = await crawlSite(url);
    console.log(`   Platform: ${crawlResult.platform}`);
    console.log(`   Pages: ${crawlResult.totalPages}, Posts: ${crawlResult.totalPosts}`);
    console.log(`   Critical issues: ${crawlResult.issues.critical.length}`);
    console.log(`   Structural issues: ${crawlResult.issues.structural.length}`);

    // ── Steg 2: PageSpeed Insights ──
    console.log(`\n2. Running PageSpeed Insights...`);
    const pageSpeed = await getPageSpeed(url);
    console.log(`   Desktop: ${pageSpeed.desktop?.performance || 'N/A'}/100`);
    console.log(`   Mobile: ${pageSpeed.mobile?.performance || 'N/A'}/100`);

    // ── Steg 3: GSC-data (om vi har access) ──
    console.log(`\n3. Fetching GSC data...`);
    const gscKeywords = await getGSCData(gscProperty);
    console.log(`   Keywords: ${gscKeywords ? gscKeywords.length : 'N/A (ingen access)'}`);

    // ── Steg 4: Autocomplete-förslag ──
    console.log(`\n4. Fetching Autocomplete suggestions...`);
    const seeds = [];
    if (companyName) seeds.push(companyName.toLowerCase());
    if (industry) seeds.push(industry.toLowerCase());
    // Extrahera nyckelord från sidtitlar
    if (crawlResult.pages?.length > 0) {
      crawlResult.pages.slice(0, 5).forEach(p => {
        const words = p.title.split(/[\s|—–-]+/).filter(w => w.length > 3);
        seeds.push(...words.slice(0, 2));
      });
    }
    if (gscKeywords) {
      gscKeywords.slice(0, 5).forEach(k => seeds.add ? seeds.add(k.keyword) : seeds.push(k.keyword));
    }
    const autocompleteSuggestions = await getAutocompleteSuggestions([...new Set(seeds)]);
    console.log(`   Suggestions: ${autocompleteSuggestions.length}`);

    // ── Steg 5: AI-analys + presentation ──
    console.log(`\n5. Generating analysis and presentation with AI...`);
    const aiResult = await generateAnalysisAndPresentation(claude, {
      url, companyName, industry, contactPerson, priceTier,
      crawlResult, pageSpeed, gscKeywords, autocompleteSuggestions
    });
    console.log(`   Analysis: ${aiResult.analysis_md.length} chars`);
    console.log(`   Presentation: ${aiResult.presentation_md.length} chars`);

    // ── Steg 6: Spara i BigQuery ──
    const analysisId = `pa_${Date.now()}_${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
    await bq.query({
      query: `
        INSERT INTO \`${dataset}.prospect_analyses\`
        (id, company_name, url, industry, contact_person, analysis_date,
         platform, total_pages, critical_issues, structural_issues, content_issues,
         mobile_score, desktop_score, seo_score, gsc_keywords, price_tier,
         analysis_md, presentation_md, raw_data)
        VALUES (@id, @company_name, @url, @industry, @contact_person, CURRENT_DATE(),
                @platform, @total_pages, @critical, @structural, @content,
                @mobile, @desktop, @seo, @gsc_kw, @price_tier,
                @analysis_md, @presentation_md, @raw_data)
      `,
      params: {
        id: analysisId,
        company_name: companyName,
        url,
        industry,
        contact_person: contactPerson,
        platform: crawlResult.platform,
        total_pages: crawlResult.totalPages + crawlResult.totalPosts,
        critical: crawlResult.issues.critical.length,
        structural: crawlResult.issues.structural.length,
        content: crawlResult.issues.content.length,
        mobile: pageSpeed.mobile?.performance || 0,
        desktop: pageSpeed.desktop?.performance || 0,
        seo: pageSpeed.mobile?.seo || 0,
        gsc_kw: gscKeywords ? gscKeywords.length : 0,
        price_tier: priceTier,
        analysis_md: aiResult.analysis_md,
        presentation_md: aiResult.presentation_md,
        raw_data: JSON.stringify({
          crawlSummary: crawlResult.summary,
          pageSpeed: {
            mobile: { performance: pageSpeed.mobile?.performance, lcp: pageSpeed.mobile?.lcp, cls: pageSpeed.mobile?.cls },
            desktop: { performance: pageSpeed.desktop?.performance, lcp: pageSpeed.desktop?.lcp, cls: pageSpeed.desktop?.cls }
          },
          topKeywords: gscKeywords?.slice(0, 20) || [],
          autocomplete: autocompleteSuggestions.slice(0, 20)
        })
      }
    });

    console.log(`\n=== Prospect Analyzer Complete ===`);
    console.log(`Company: ${companyName}`);
    console.log(`Total issues: ${crawlResult.issues.critical.length + crawlResult.issues.structural.length + crawlResult.issues.content.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: analysisId,
        companyName,
        url,
        platform: crawlResult.platform,
        totalPages: crawlResult.totalPages + crawlResult.totalPosts,
        scores: {
          mobile: pageSpeed.mobile?.performance,
          desktop: pageSpeed.desktop?.performance,
          seo: pageSpeed.mobile?.seo
        },
        issues: {
          critical: crawlResult.issues.critical.length,
          structural: crawlResult.issues.structural.length,
          content: crawlResult.issues.content.length
        },
        gscKeywords: gscKeywords ? gscKeywords.length : 0,
        analysis_md: aiResult.analysis_md,
        presentation_md: aiResult.presentation_md
      })
    };

  } catch (err) {
    console.error('Prospect Analyzer failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── Utilities ──

function extractCompanyFromUrl(url) {
  if (!url) return 'Okänt företag';
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return hostname.replace('.se', '').replace('.com', '').replace('.nu', '');
  } catch {
    return url;
  }
}
