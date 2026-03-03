#!/usr/bin/env node
/**
 * SE Ranking Enricher — Searchboost Lead System
 *
 * Hämtar organisk data (keywords, trafik, domain trust, trend) per domän.
 * Fungerar i två lägen:
 *   Läge A — SE Ranking API (när aktivt)
 *   Läge B — Sitemap-räkning (alltid tillgängligt, ger sidantal)
 *
 * Användning:
 *   node seranking-enricher.js domain.se            # Testa en domän
 *   node seranking-enricher.js --csv export.csv     # Parsa manuell SE Ranking-export
 *
 * Som modul:
 *   const { enrichDomain, parseSERankingCSV, calcCompositeScore } = require('./seranking-enricher');
 *
 * Ratios som beräknas (grund för composite scoring):
 *   kw_per_page       = organic_keywords / indexed_pages  (benchmark: 15+)
 *   traffic_per_kw    = organic_traffic  / organic_keywords (benchmark: 0.5+)
 *   traffic_per_page  = organic_traffic  / indexed_pages   (benchmark: 2+)
 *   traffic_decline   = % nedgång från historisk topp (36 mån)
 */

'use strict';
const https   = require('https');
const http    = require('http');
const fs      = require('fs');
const path    = require('path');
const urlMod  = require('url');

// ── Konfiguration ──────────────────────────────────────────────────────────────
const SERANKING_KEY  = process.env.SERANKING_API_KEY || 'e474f1ab-69be-f744-b4e2-c265555c3718';
const SERANKING_BASE = 'https://api4.seranking.com';  // SE Ranking Data API v4
const SERANKING_BASE_V1 = 'https://api.seranking.com/v1';
const SE_COUNTRY     = 'sv';   // sv = Sverige

// Riktmärken — vad en väloptimerad sida bör uppnå
const BENCH = {
  kw_per_page:      15,    // Nyckelord per indexerad sida
  traffic_per_kw:  0.5,    // Klick per nyckelord och månad
  traffic_per_page: 2,     // Klick per sida och månad
};

// ── HTTP-hjälpare ──────────────────────────────────────────────────────────────
function makeRequest(targetUrl, extraHeaders = {}, timeoutMs = 12000) {
  return new Promise((resolve) => {
    let done = false;
    const finish = (result) => { if (!done) { done = true; resolve(result); } };

    const parsed = urlMod.parse(targetUrl);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const opts   = {
      hostname: parsed.hostname,
      path:     parsed.path || '/',
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      method:   'GET',
      timeout:  timeoutMs,
      headers:  {
        'User-Agent': 'SearchboostLeadSystem/2.0 (+https://searchboost.se)',
        'Accept':     'application/json, text/html, */*',
        ...extraHeaders,
      },
    };

    const req = lib.request(opts, (res) => {
      const statusCode = res.statusCode;
      const headers    = res.headers;
      let data = '';
      res.setEncoding('utf8');
      // 2 MB-gräns — räcker för ~13 000 URL-taggar, undviker OOM på stora sitemaps
      res.on('data', c => { data += c; if (data.length > 2_000_000) { res.destroy(); } });
      res.on('end',   () => finish({ status: statusCode, body: data, headers }));
      res.on('error', () => finish({ status: statusCode || 0, body: data, headers }));
      // close garanterar att Promise alltid löser, även om destroy() anropas utan error-event
      res.on('close', () => finish({ status: statusCode || 0, body: data, headers }));
    });
    req.on('timeout', () => { req.destroy(); finish({ status: 0, body: '', headers: {}, error: 'timeout' }); });
    req.on('error',   () => finish({ status: 0, body: '', headers: {} }));
    req.end();
  });
}

function parseJSON(str) {
  try { return JSON.parse(str); } catch (_) { return null; }
}

// ── SE Ranking API-anrop ───────────────────────────────────────────────────────
async function serankingGET(endpoint, params = {}, base = SERANKING_BASE_V1) {
  const qs  = new URLSearchParams({ ...params, apikey: SERANKING_KEY }).toString();
  const url = `${base}${endpoint}?${qs}`;
  const res = await makeRequest(url, { 'Authorization': `Token ${SERANKING_KEY}` });
  const data = parseJSON(res.body);
  return { status: res.status, data };
}

// ── Domain Overview — prova flera endpoint-varianter ─────────────────────────
async function fetchSERankingOverview(domain) {
  const clean = domain.replace(/^www\./, '');

  // Variant 1: Data API v4 (nyare)
  const r1 = await serankingGET('/research/domains', { domain: clean, se: SE_COUNTRY }, SERANKING_BASE);
  if (r1.status === 200 && r1.data && !r1.data.error_description) {
    return normalizeOverview(r1.data, 'api4/research/domains');
  }

  // Variant 2: v1 research endpoint
  const r2 = await serankingGET('/research/domains', { domain: clean, se: SE_COUNTRY });
  if (r2.status === 200 && r2.data && !r2.data.error_description) {
    return normalizeOverview(r2.data, 'v1/research/domains');
  }

  // Variant 3: domain-specific path
  const r3 = await serankingGET(`/research/domain/${encodeURIComponent(clean)}`, { se: SE_COUNTRY });
  if (r3.status === 200 && r3.data && !r3.data.error_description) {
    return normalizeOverview(r3.data, 'v1/research/domain');
  }

  // Alla försök misslyckades
  const errCode = r1.status || r2.status || r3.status;
  const errBody = r1.data || r2.data;
  return {
    success: false,
    error: errBody?.error_description || errBody?.error || `HTTP ${errCode}`,
    organic_keywords: 0, organic_traffic: 0, domain_trust: 0, pages_indexed: 0,
  };
}

function normalizeOverview(d, source) {
  // SE Ranking returnerar data i varierande fältnamn beroende på API-version
  return {
    success:          true,
    source,
    organic_keywords: d.organic_keywords ?? d.keywords_count ?? d.keywords ?? d.organic ?? 0,
    organic_traffic:  d.organic_traffic  ?? d.traffic        ?? d.organic_traffic_count ?? 0,
    domain_trust:     d.domain_trust     ?? d.dt             ?? d.trust ?? 0,
    pages_indexed:    d.pages_indexed    ?? d.pages          ?? d.indexed_pages ?? 0,
  };
}

// ── Traffic History — trend-data ──────────────────────────────────────────────
async function fetchSERankingHistory(domain) {
  const clean   = domain.replace(/^www\./, '');
  const now     = new Date();
  const dateEnd = now.toISOString().split('T')[0];
  const past    = new Date(now); past.setMonth(past.getMonth() - 36);
  const dateFrom = past.toISOString().split('T')[0];

  // Prova v1 history endpoint
  const r = await serankingGET('/research/domain-history', {
    domain: clean, se: SE_COUNTRY,
    date_from: dateFrom, date_to: dateEnd,
    type: 'organic',
  });

  if (r.status === 200 && Array.isArray(r.data) && r.data.length > 0) {
    return buildTrendData(r.data);
  }

  // Fallback: prova utan type-param
  const r2 = await serankingGET('/research/domain-history', {
    domain: clean, se: SE_COUNTRY,
    date_from: dateFrom, date_to: dateEnd,
  });
  if (r2.status === 200 && Array.isArray(r2.data) && r2.data.length > 0) {
    return buildTrendData(r2.data);
  }

  return { success: false, peak_traffic: 0, decline_6m: 0, decline_36m: 0, trend_score: 0, history: [] };
}

function buildTrendData(points) {
  const sorted = points
    .map(p => ({
      date:     p.date || p.month || '',
      traffic:  p.organic_traffic ?? p.traffic ?? 0,
      keywords: p.organic_keywords ?? p.keywords ?? 0,
    }))
    .filter(p => p.date)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return { success: false, peak_traffic: 0, decline_6m: 0, decline_36m: 0, trend_score: 0, history: [] };
  }

  const peakTraffic    = Math.max(...sorted.map(p => p.traffic));
  const currentTraffic = sorted[sorted.length - 1].traffic;
  const decline6m      = calcDecline(sorted, 6);
  const decline36m     = calcDecline(sorted, 36);
  const trend_score    = calcTrendScore(peakTraffic, currentTraffic, decline6m);

  return {
    success:         true,
    history:         sorted,
    peak_traffic:    peakTraffic,
    current_traffic: currentTraffic,
    decline_6m:      decline6m,
    decline_36m:     decline36m,
    trend_score,
  };
}

// Beräkna % nedgång jämfört med X månader sedan
function calcDecline(points, months) {
  if (points.length < 2) return 0;
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months);
  const cutStr = cutoff.toISOString().split('T')[0];
  const startPt = points.find(p => p.date >= cutStr) || points[0];
  const endPt   = points[points.length - 1];
  if (!startPt || startPt.traffic === 0) return 0;
  return Math.max(0, Math.round(((startPt.traffic - endPt.traffic) / startPt.traffic) * 100));
}

// Trend-score 0-100: 100 = kraftig nedgång = säljmöjlighet
function calcTrendScore(peak, current, decline6m) {
  if (peak === 0) return 0;
  const peakDecline = Math.round(((peak - current) / peak) * 100);
  return Math.min(100, Math.round(peakDecline * 0.6 + Math.max(decline6m, 0) * 0.4));
}

// ── Sitemap-räkning (sidantal utan API) ───────────────────────────────────────
async function fetchSitemapPageCount(domain) {
  const candidates = [
    `https://${domain}/sitemap.xml`,
    `https://${domain}/sitemap_index.xml`,
    `https://www.${domain}/sitemap.xml`,
    `https://${domain}/page-sitemap.xml`,
    `https://${domain}/post-sitemap.xml`,
    `https://${domain}/wp-sitemap.xml`,
  ];

  for (const target of candidates) {
    const res = await makeRequest(target, {}, 8000);
    if (res.status !== 200 || !res.body) continue;
    const xml = res.body;

    // Sitemap index — räkna sub-sitemaps, estimera sidor
    if (xml.includes('<sitemapindex')) {
      const subCount = (xml.match(/<sitemap>/gi) || []).length;
      if (subCount > 0) {
        // Heuristik: förstasidan + ca 30 URL:er/sub-sitemap i genomsnitt
        return { pageCount: subCount * 30, found: true, type: 'index', url: target };
      }
    }

    // Normal sitemap — räkna <url>-taggar
    const urlCount = (xml.match(/<url>/gi) || []).length;
    if (urlCount > 0) {
      return { pageCount: urlCount, found: true, type: 'urlset', url: target };
    }

    // Reserv: räkna <loc>-taggar
    const locCount = (xml.match(/<loc>/gi) || []).length;
    if (locCount > 0) {
      return { pageCount: locCount, found: true, type: 'loc', url: target };
    }
  }

  // Ingen sitemap hittad — estimera från robots.txt eller returnera 0
  return { pageCount: 0, found: false };
}

// ── Composite Scoring ─────────────────────────────────────────────────────────
/**
 * Beräknar composite_score 0-100 (100 = maximal säljmöjlighet)
 *
 * Vikter:
 *   hygiene_gap     25%  — tekniska SEO-problem (från crawl)
 *   organic_gap     35%  — kw/sida under benchmark
 *   traffic_quality 25%  — trafik/kw under benchmark
 *   trend_penalty   15%  — trafik-nedgång från topp
 */
function calcCompositeScore(data) {
  const pages = data.pages_indexed || data.sitemap_pages || 1;
  const kws   = Math.max(data.organic_keywords || 0, 0);
  const traf  = Math.max(data.organic_traffic  || 0, 0);

  const kwPerPage      = pages > 0 ? kws  / pages : 0;
  const trafficPerKw   = kws   > 0 ? traf / kws   : 0;
  const trafficPerPage = pages > 0 ? traf / pages  : 0;

  // Organic gap: 100 = noll keywords alls, 0 = benchmark uppnått
  const organicGap     = Math.min(100, Math.round(Math.max(0, 1 - kwPerPage   / BENCH.kw_per_page)   * 100));
  // Traffic quality: 100 = ingen trafik per keyword, 0 = benchmark uppnått
  const trafficQuality = Math.min(100, Math.round(Math.max(0, 1 - trafficPerKw / BENCH.traffic_per_kw) * 100));
  // Hygiene gap: direkt från crawl-analysen (0-100)
  const hygieneGap     = Math.min(100, Math.max(0, data.hygiene_score || 0));
  // Trend penalty: trendScore från history (0-100)
  const trendPenalty   = Math.min(100, Math.max(0, data.trend_score   || 0));

  const composite = Math.round(
    hygieneGap     * 0.25 +
    organicGap     * 0.35 +
    trafficQuality * 0.25 +
    trendPenalty   * 0.15
  );

  return {
    composite,
    level: composite >= 70 ? 'HOG' : composite >= 45 ? 'MEDEL' : 'LAG',
    label: composite >= 70 ? 'Hög potential' : composite >= 45 ? 'Medel potential' : 'Låg potential',
    components: { hygiene_gap: hygieneGap, organic_gap: organicGap, traffic_quality: trafficQuality, trend_penalty: trendPenalty },
    ratios: {
      kw_per_page:       Math.round(kwPerPage      * 10) / 10,
      traffic_per_kw:    Math.round(trafficPerKw   * 100) / 100,
      traffic_per_page:  Math.round(trafficPerPage * 100) / 100,
    },
  };
}

// ── Huvud-funktion ─────────────────────────────────────────────────────────────
/**
 * enrichDomain(domain, opts) → enriched data object
 *
 * opts.skipAPI     — hoppa över SE Ranking API (bara sitemap)
 * opts.skipSitemap — hoppa över sitemap-hämtning
 * opts.csvData     — pre-laddad SE Ranking CSV-data { [domain]: {...} }
 */
async function enrichDomain(domain, opts = {}) {
  const clean = domain.replace(/^https?:\/\//, '').replace(/\/$/, '').replace(/^www\./, '').trim();

  const result = {
    domain:           clean,
    timestamp:        new Date().toISOString(),
    api_available:    false,
    api_error:        null,
    organic_keywords: 0,
    organic_traffic:  0,
    domain_trust:     0,
    pages_indexed:    0,
    peak_traffic:     0,
    current_traffic:  0,
    decline_6m:       0,
    decline_36m:      0,
    trend_score:      0,
    sitemap_pages:    0,
    sitemap_found:    false,
  };

  // 1. Sitemap — sidantal (alltid, fungerar utan API)
  if (!opts.skipSitemap) {
    const sm = await fetchSitemapPageCount(clean);
    result.sitemap_pages = sm.pageCount;
    result.sitemap_found = sm.found;
    result.pages_indexed = sm.pageCount;   // initialt — skrivs över av API om tillgänglig
  }

  // 2. Pre-laddad CSV-data (manuell export från SE Ranking)
  if (opts.csvData) {
    const row = opts.csvData[clean] || opts.csvData[`www.${clean}`];
    if (row) {
      result.api_available    = true;
      result.organic_keywords = row.organic_keywords || 0;
      result.organic_traffic  = row.organic_traffic  || 0;
      result.domain_trust     = row.domain_trust     || 0;
      if (row.pages_indexed) result.pages_indexed = row.pages_indexed;
      return result;
    }
  }

  // 3. SE Ranking API
  if (!opts.skipAPI) {
    const overview = await fetchSERankingOverview(clean);

    if (overview.success) {
      result.api_available    = true;
      result.organic_keywords = overview.organic_keywords;
      result.organic_traffic  = overview.organic_traffic;
      result.domain_trust     = overview.domain_trust;
      if (overview.pages_indexed > 0) result.pages_indexed = overview.pages_indexed;

      // Hämta historik/trend
      const hist = await fetchSERankingHistory(clean);
      if (hist.success) {
        result.peak_traffic    = hist.peak_traffic;
        result.current_traffic = hist.current_traffic;
        result.decline_6m      = hist.decline_6m;
        result.decline_36m     = hist.decline_36m;
        result.trend_score     = hist.trend_score;
      }
    } else {
      result.api_error = overview.error;
    }
  }

  return result;
}

// ── CSV-parser (manuell SE Ranking-export) ─────────────────────────────────────
/**
 * Parsar SE Ranking Competitive Research CSV-export.
 * Kolumner (varierar per SE Ranking-version):
 *   Domain, Domain Trust, Organic Keywords, Organic Traffic, Traffic Cost, Backlinks, Ref. Domains
 *
 * Returnerar: { [domain]: enrichedData }
 */
function parseSERankingCSV(filePath) {
  if (!fs.existsSync(filePath)) throw new Error(`CSV-filen hittades inte: ${filePath}`);
  const raw   = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return {};

  const headers = parseCsvLine(lines[0]).map(h => h.toLowerCase().trim());
  const result  = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const row = {};
    headers.forEach((h, idx) => { row[h] = cols[idx]?.trim() || ''; });

    const domain = (row['domain'] || row['domains'] || cols[0] || '').replace(/^www\./, '').trim();
    if (!domain || domain.startsWith('#')) continue;

    result[domain] = {
      domain,
      api_available:    true,
      from_csv:         true,
      domain_trust:     parseInt(row['domain trust']      || row['dt']       || '0', 10),
      organic_keywords: parseInt(row['organic keywords']  || row['keywords'] || '0', 10),
      organic_traffic:  parseInt(row['organic traffic']   || row['traffic']  || '0', 10),
      pages_indexed:    parseInt(row['pages']             || row['indexed']  || '0', 10),
      backlinks:        parseInt(row['backlinks']         || row['bl']       || '0', 10),
      ref_domains:      parseInt(row['ref. domains']      || row['rd']       || '0', 10),
    };
  }

  return result;
}

function parseCsvLine(line) {
  const result = [];
  let cur = '';
  let inQ = false;
  for (const c of line) {
    if      (c === '"')             { inQ = !inQ; }
    else if (c === ',' && !inQ)     { result.push(cur); cur = ''; }
    else                            { cur += c; }
  }
  result.push(cur);
  return result;
}

// ── CLI-läge ──────────────────────────────────────────────────────────────────
if (require.main === module) {
  const args = process.argv.slice(2);

  // Parsa CSV-export
  if (args.includes('--csv')) {
    const idx  = args.indexOf('--csv');
    const file = args[idx + 1];
    if (!file || !fs.existsSync(file)) {
      console.error('Ange en giltig CSV: node seranking-enricher.js --csv export.csv');
      process.exit(1);
    }
    const data  = parseSERankingCSV(file);
    const count = Object.keys(data).length;
    console.log(`Parsade ${count} domäner från CSV.`);
    const outFile = file.replace(/\.csv$/i, '-parsed.json');
    fs.writeFileSync(outFile, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Sparad: ${outFile}`);
    process.exit(0);
  }

  if (args.length === 0 || args[0].startsWith('--')) {
    console.log('Användning:');
    console.log('  node seranking-enricher.js <domän.se>');
    console.log('  node seranking-enricher.js --csv seranking-export.csv');
    process.exit(0);
  }

  const domain = args[0].replace(/^https?:\/\//, '').replace(/\/$/, '').trim();

  (async () => {
    console.log(`\nEnrichar ${domain}...`);
    const data = await enrichDomain(domain);

    console.log('\n── SE Ranking Overview ──────────────────');
    console.log(`API tillgänglig:    ${data.api_available ? 'JA' : 'NEJ (' + (data.api_error || 'N/A') + ')'}`);
    console.log(`Organiska keywords: ${data.organic_keywords}`);
    console.log(`Organisk trafik:    ${data.organic_traffic} klick/mån`);
    console.log(`Domain Trust:       ${data.domain_trust}/100`);
    console.log(`Sidor (API):        ${data.pages_indexed}`);
    console.log(`Sidor (sitemap):    ${data.sitemap_pages} (${data.sitemap_found ? 'hittad' : 'ej hittad'})`);

    if (data.api_available && data.peak_traffic > 0) {
      console.log('\n── Trafik-trend ─────────────────────────');
      console.log(`Topp-trafik:        ${data.peak_traffic} klick/mån`);
      console.log(`Nuläge:             ${data.current_traffic} klick/mån`);
      console.log(`Nedgång 6M:         ${data.decline_6m}%`);
      console.log(`Nedgång 36M:        ${data.decline_36m}%`);
      console.log(`Trend-score:        ${data.trend_score}/100`);
    }

    const pages = data.pages_indexed || 1;
    if (data.organic_keywords > 0 || data.sitemap_pages > 0) {
      console.log('\n── Ratios (vs benchmark) ────────────────');
      const kpp  = Math.round((data.organic_keywords / pages) * 10) / 10;
      const tpk  = data.organic_keywords > 0 ? Math.round((data.organic_traffic / data.organic_keywords) * 100) / 100 : 0;
      const tpp  = Math.round((data.organic_traffic / pages) * 100) / 100;
      console.log(`KW/sida:            ${kpp}   (benchmark: ${BENCH.kw_per_page})`);
      console.log(`Trafik/KW:          ${tpk}  (benchmark: ${BENCH.traffic_per_kw})`);
      console.log(`Trafik/sida:        ${tpp}   (benchmark: ${BENCH.traffic_per_page})`);
    }

    // Composite scoring med dummy hygiene (0)
    const scoring = calcCompositeScore(data);
    console.log('\n── Composite Score (utan crawl-data) ────');
    console.log(`Score:              ${scoring.composite}/100 — ${scoring.label}`);
    console.log(`  organic_gap:      ${scoring.components.organic_gap}`);
    console.log(`  traffic_quality:  ${scoring.components.traffic_quality}`);
    console.log(`  trend_penalty:    ${scoring.components.trend_penalty}`);
    console.log(`  hygiene_gap:      ${scoring.components.hygiene_gap} (saknas — kräver crawl)`);
  })();
}

module.exports = { enrichDomain, parseSERankingCSV, calcCompositeScore, fetchSitemapPageCount, BENCH };
