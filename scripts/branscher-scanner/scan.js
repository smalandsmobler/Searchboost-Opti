#!/usr/bin/env node
/**
 * Prospect-scanner för 90 möbelföretag — STEG 1-3
 * Läser prospects-filtered.json, kör HTTP-verifiering, djup SEO-scan, scoring.
 * Skriver scan-results.json + scan-log.txt.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const ROOT = '/Users/weerayootandersson/Downloads/Searchboost-Opti';
const LEADS_DIR = path.join(ROOT, 'docs/leads/branscher-2026-04-16');
const INPUT = path.join(LEADS_DIR, 'prospects-filtered.json');
const OUTPUT = path.join(LEADS_DIR, 'scan-results.json');
const LOGFILE = path.join(LEADS_DIR, 'scan-log.txt');

const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';
const REQUEST_TIMEOUT = 15000;
const MAX_REDIRECTS = 5;
const CONCURRENCY_HTTP = 12;
const CONCURRENCY_PSI = 4;
const PAGESPEED_KEY = process.env.PAGESPEED_KEY || '';

const logStream = fs.createWriteStream(LOGFILE, { flags: 'w' });
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.log(line);
  logStream.write(line + '\n');
}

// --- HTTP helpers -----------------------------------------------------------

function httpRequest(targetUrl, { method = 'GET', timeout = REQUEST_TIMEOUT, headers = {} } = {}) {
  return new Promise((resolve, reject) => {
    let url;
    try { url = new URL(targetUrl); } catch (e) { return reject(new Error('invalid-url: ' + targetUrl)); }
    const lib = url.protocol === 'https:' ? https : http;
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: Object.assign({
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml,*/*;q=0.8',
        'Accept-Language': 'sv-SE,sv;q=0.9,en;q=0.5',
      }, headers),
      rejectUnauthorized: false,
    };
    const req = lib.request(opts, (res) => {
      const chunks = [];
      let size = 0;
      const maxSize = 3 * 1024 * 1024; // 3MB cap
      res.on('data', (c) => {
        if (size < maxSize) { chunks.push(c); size += c.length; }
      });
      res.on('end', () => {
        const body = Buffer.concat(chunks).toString('utf8');
        resolve({ statusCode: res.statusCode, headers: res.headers, body, url: targetUrl });
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(timeout, () => { req.destroy(new Error('timeout')); });
    req.end();
  });
}

async function followRedirects(startUrl, { maxRedirects = MAX_REDIRECTS } = {}) {
  const chain = [];
  let current = startUrl;
  let httpsUpgraded = false;
  for (let i = 0; i <= maxRedirects; i++) {
    let res;
    try { res = await httpRequest(current, { method: 'GET' }); }
    catch (err) { return { error: err.message, chain, final: current }; }
    chain.push({ url: current, status: res.statusCode });
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      let next = res.headers.location;
      if (next.startsWith('/')) {
        const u = new URL(current);
        next = `${u.protocol}//${u.host}${next}`;
      } else if (!next.startsWith('http')) {
        next = new URL(next, current).toString();
      }
      if (current.startsWith('http:') && next.startsWith('https:')) httpsUpgraded = true;
      current = next;
      continue;
    }
    return {
      chain,
      final: current,
      httpsUpgraded,
      status: res.statusCode,
      headers: res.headers,
      body: res.body,
    };
  }
  return { error: 'too-many-redirects', chain, final: current };
}

async function headCheck(url) {
  try {
    const res = await httpRequest(url, { method: 'HEAD', timeout: 8000 });
    return { ok: true, status: res.statusCode };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// --- HTML parsing (lightweight, no external libs) ---------------------------

function stripTags(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'i');
  const m = html.match(re);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : null;
}

function extractAllTags(html, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, 'gi');
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) out.push(m[1].replace(/<[^>]+>/g, '').trim());
  return out;
}

function extractMeta(html, nameOrProp, attr = 'name') {
  const re = new RegExp(`<meta[^>]+${attr}=["']${nameOrProp}["'][^>]*>`, 'i');
  const m = html.match(re);
  if (!m) return null;
  const c = m[0].match(/content=["']([^"']*)["']/i);
  return c ? c[1] : null;
}

function detectCMS(html, headers) {
  const h = html.slice(0, 50000).toLowerCase();
  const xPoweredBy = (headers['x-powered-by'] || '').toLowerCase();
  const server = (headers['server'] || '').toLowerCase();
  const gen = extractMeta(html, 'generator') || '';

  if (h.includes('wp-content') || h.includes('wp-includes') || h.includes('/wp-json') || /wordpress/i.test(gen))
    return 'WordPress';
  if (h.includes('cdn.shopify.com') || h.includes('shopify.theme') || h.includes('myshopify'))
    return 'Shopify';
  if (h.includes('static.wixstatic') || h.includes('wix.com') || h.includes('x-wix-') || /wix/i.test(xPoweredBy))
    return 'Wix';
  if (h.includes('squarespace.com') || h.includes('squarespace-cdn') || h.includes('sqsp'))
    return 'Squarespace';
  if (/magento/i.test(gen) || h.includes('mage/cookies'))
    return 'Magento';
  if (/joomla/i.test(gen) || h.includes('/media/jui/'))
    return 'Joomla';
  if (h.includes('cdn.prestashop.com') || /prestashop/i.test(gen))
    return 'PrestaShop';
  if (h.includes('drupal-settings-json') || /drupal/i.test(gen))
    return 'Drupal';
  if (h.includes('data-page-element') || h.includes('elementor'))
    return 'WordPress'; // Elementor → WordPress
  if (h.includes('webflow.com') || h.includes('data-wf-'))
    return 'Webflow';
  if (h.includes('litium.com'))
    return 'Litium';
  if (h.includes('/dynamicweb/'))
    return 'DynamicWeb';
  if (h.includes('sylius'))
    return 'Sylius';
  if (h.includes('epicenter') || h.includes('centra'))
    return 'Centra';
  if (h.includes('storm-commerce') || h.includes('/storm/'))
    return 'Storm';
  if (server.includes('iis') && h.includes('__viewstate'))
    return 'ASP.NET/Custom';

  return 'Okänt/Custom';
}

function parsePage(html, headers, finalUrl) {
  const title = extractTag(html, 'title');
  const description = extractMeta(html, 'description');
  const viewport = extractMeta(html, 'viewport');
  const canonical = (() => {
    const m = html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i);
    if (!m) return null;
    const c = m[0].match(/href=["']([^"']*)["']/i);
    return c ? c[1] : null;
  })();
  const robotsMeta = extractMeta(html, 'robots');
  const h1s = extractAllTags(html, 'h1');
  const h2s = extractAllTags(html, 'h2');
  const schemaMatches = html.match(/<script[^>]+application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || [];
  const imgTags = html.match(/<img\b[^>]*>/gi) || [];
  const imgsWithoutAlt = imgTags.filter((t) => !/\balt=/.test(t) || /\balt=["']?\s*["']?/.test(t) && !/\balt=["'][^"']+["']/.test(t));

  const bodyText = stripTags(html);
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;

  const u = new URL(finalUrl);
  const isHttps = u.protocol === 'https:';
  const server = headers['server'] || null;

  return {
    title,
    titleLen: title ? title.length : 0,
    description,
    descLen: description ? description.length : 0,
    viewport,
    canonical,
    robotsMeta,
    h1Count: h1s.length,
    h1First: h1s[0] || null,
    h2Count: h2s.length,
    hasSchema: schemaMatches.length > 0,
    imgTotal: imgTags.length,
    imgWithoutAlt: imgsWithoutAlt.length,
    wordCount,
    isHttps,
    server,
  };
}

// --- Sitemap & robots -------------------------------------------------------

async function fetchRobots(baseUrl) {
  const u = new URL(baseUrl);
  const url = `${u.protocol}//${u.host}/robots.txt`;
  try {
    const res = await httpRequest(url);
    if (res.statusCode === 200 && res.body) {
      const sitemaps = [];
      res.body.split('\n').forEach((line) => {
        const m = line.match(/^\s*sitemap\s*:\s*(.+)$/i);
        if (m) sitemaps.push(m[1].trim());
      });
      return { exists: true, sitemapsInRobots: sitemaps };
    }
  } catch (e) { /* ignore */ }
  return { exists: false, sitemapsInRobots: [] };
}

async function fetchSitemap(baseUrl, robotsInfo) {
  const candidates = [];
  if (robotsInfo.sitemapsInRobots.length > 0) candidates.push(...robotsInfo.sitemapsInRobots);
  const u = new URL(baseUrl);
  candidates.push(`${u.protocol}//${u.host}/sitemap.xml`);
  candidates.push(`${u.protocol}//${u.host}/sitemap_index.xml`);

  const seen = new Set();
  for (const c of candidates) {
    if (seen.has(c)) continue;
    seen.add(c);
    try {
      const res = await httpRequest(c);
      if (res.statusCode === 200 && /<(urlset|sitemapindex)/i.test(res.body)) {
        // Parse urls (simple)
        const urls = [];
        const reLoc = /<loc>\s*([^<\s]+)\s*<\/loc>/gi;
        let m;
        while ((m = reLoc.exec(res.body)) !== null) urls.push(m[1]);
        // If sitemapindex, fetch up to 3 sub-sitemaps
        if (/<sitemapindex/i.test(res.body)) {
          const subUrls = [];
          for (const sub of urls.slice(0, 3)) {
            try {
              const r2 = await httpRequest(sub);
              if (r2.statusCode === 200) {
                const m2 = r2.body.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi);
                for (const x of m2) subUrls.push(x[1]);
              }
            } catch { /* ignore */ }
          }
          return { exists: true, source: c, urls: subUrls, indexOf: urls.length };
        }
        return { exists: true, source: c, urls };
      }
    } catch { /* ignore */ }
  }
  return { exists: false, source: null, urls: [] };
}

async function sampleSitemapUrls(urls, sampleSize = 8) {
  if (!urls || urls.length === 0) return { sampled: 0, ok: 0, notFound: 0, redirect: 0, errors: 0 };
  const shuffled = urls.slice().sort(() => Math.random() - 0.5).slice(0, sampleSize);
  const results = await Promise.all(shuffled.map(async (u) => headCheck(u)));
  let ok = 0, notFound = 0, redirect = 0, errors = 0;
  for (const r of results) {
    if (!r.ok) { errors++; continue; }
    if (r.status === 200) ok++;
    else if (r.status === 404) notFound++;
    else if (r.status >= 300 && r.status < 400) redirect++;
    else errors++;
  }
  return { sampled: shuffled.length, ok, notFound, redirect, errors };
}

// --- PageSpeed --------------------------------------------------------------

async function pageSpeedInsights(url) {
  const params = new URLSearchParams({
    url,
    strategy: 'mobile',
    category: 'performance',
  });
  if (PAGESPEED_KEY) params.append('key', PAGESPEED_KEY);
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params}`;
  try {
    const res = await httpRequest(endpoint, { timeout: 50000 });
    if (res.statusCode !== 200) return { ok: false, status: res.statusCode };
    const data = JSON.parse(res.body);
    const perf = data.lighthouseResult?.categories?.performance?.score;
    const audits = data.lighthouseResult?.audits || {};
    return {
      ok: true,
      score: perf != null ? Math.round(perf * 100) : null,
      lcp: audits['largest-contentful-paint']?.numericValue || null,
      fcp: audits['first-contentful-paint']?.numericValue || null,
      cls: audits['cumulative-layout-shift']?.numericValue || null,
    };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// --- Scoring ----------------------------------------------------------------

function computeScores(scan) {
  // Lead-score (intern)
  let leadScore = 0;
  const flags = [];

  if (scan.cms === 'WordPress') { leadScore += 20; flags.push('WordPress — vi kan optimera direkt'); }

  const thinHome = scan.page && scan.page.wordCount < 200;
  const thinSitemap = scan.thinContentPercent != null && scan.thinContentPercent > 50;
  if (thinHome || thinSitemap) {
    leadScore += 15;
    flags.push(thinSitemap
      ? `${scan.thinContentPercent}% av sidorna har under 200 ord`
      : `Startsidan har bara ${scan.page.wordCount} ord (thin content)`);
  }

  if (scan.pagespeed && typeof scan.pagespeed.score === 'number' && scan.pagespeed.score < 50) {
    leadScore += 15;
    flags.push(`PageSpeed ${scan.pagespeed.score}/100 — superslö`);
  }

  if (scan.sitemap && !scan.sitemap.exists) {
    leadScore += 15;
    flags.push('Saknar sitemap — Google hittar inte alla sidor');
  }

  if (scan.sitemapSample && scan.sitemapSample.sampled > 0) {
    const brokenPct = Math.round(((scan.sitemapSample.notFound + scan.sitemapSample.errors) / scan.sitemapSample.sampled) * 100);
    if (brokenPct > 10) {
      leadScore += 10;
      flags.push(`${brokenPct}% trasiga URL:er i sitemap`);
    }
  }

  if (scan.redirectCount > 5) {
    leadScore += 10;
    flags.push(`${scan.redirectCount} redirects i kedjan — redirect-röra`);
  }

  if (scan.sitemapSample && scan.sitemapSample.notFound > 3) {
    leadScore += 10;
    flags.push(`${scan.sitemapSample.notFound} trasiga sidor (404) i sitemap-sample`);
  }

  if (scan.page && (!scan.page.title || !scan.page.description)) {
    leadScore += 10;
    flags.push('Saknar meta title eller description på startsidan');
  }

  if (scan.page && !scan.page.isHttps) {
    leadScore += 10;
    flags.push('Ingen HTTPS — Google varnar besökare');
  }

  if (scan.page && !scan.page.viewport) {
    leadScore += 10;
    flags.push('Inte mobilanpassad (saknar viewport) — 60% av trafiken är mobil');
  }

  // SEO-score (extern, till kunden)
  let seoScore = 100;
  if (scan.page) {
    if (!scan.page.title) seoScore -= 10;
    if (!scan.page.description) seoScore -= 10;
    if (scan.page.h1Count > 1) seoScore -= 8;
    if (!scan.page.viewport) seoScore -= 10;
    if (!scan.page.hasSchema) seoScore -= 8;
    if (scan.page.imgTotal > 0 && (scan.page.imgWithoutAlt / scan.page.imgTotal) > 0.3) seoScore -= 8;
    if (!scan.page.isHttps) seoScore -= 10;
    if (scan.page.wordCount < 200) seoScore -= 8;
    if (!scan.page.canonical) seoScore -= 5;
  }
  if (scan.pagespeed && typeof scan.pagespeed.score === 'number' && scan.pagespeed.score < 50) seoScore -= 10;
  if (scan.sitemap && !scan.sitemap.exists) seoScore -= 5;
  seoScore = Math.max(20, seoScore);

  const action = leadScore >= 70 ? 'RING' : leadScore >= 40 ? 'MEJLA' : 'SKIPPA';
  return { leadScore, seoScore, flags, action };
}

// --- Per-domain scan --------------------------------------------------------

async function scanDomain(prospect) {
  const result = {
    domain: prospect.domain,
    company: prospect.company,
    category: prospect.category,
    segment: prospect.segment,
    city: prospect.city,
    note: prospect.note,
    dead: false,
    error: null,
    startedAt: new Date().toISOString(),
  };

  // Step 1 — HTTP verify
  const startUrl = `https://${prospect.domain}`;
  const redir = await followRedirects(startUrl);
  result.redirectChain = redir.chain || [];
  result.redirectCount = (redir.chain || []).length;
  result.finalUrl = redir.final;
  result.httpsUpgraded = !!redir.httpsUpgraded;

  if (redir.error || !redir.body || (redir.status && redir.status >= 400)) {
    result.dead = true;
    result.error = redir.error || `status=${redir.status}`;
    log(`[DEAD] ${prospect.domain} — ${result.error}`);
    return result;
  }

  // Step 2 — Parse page
  try {
    result.page = parsePage(redir.body, redir.headers || {}, redir.final);
    result.cms = detectCMS(redir.body, redir.headers || {});
  } catch (err) {
    result.error = 'parse-error: ' + err.message;
    result.dead = true;
    log(`[PARSE-ERR] ${prospect.domain} — ${err.message}`);
    return result;
  }

  // Robots + sitemap
  result.robots = await fetchRobots(redir.final);
  result.sitemap = await fetchSitemap(redir.final, result.robots);
  if (result.sitemap.exists && result.sitemap.urls.length > 0) {
    result.sitemapSample = await sampleSitemapUrls(result.sitemap.urls, 8);
    // thin content % — om vi har flera sidors wordcount så beräknar vi. Här använder vi bara startsida som proxy.
    result.thinContentPercent = null;
  }

  // PageSpeed deferred — run separately for concurrency control
  return result;
}

async function runPageSpeedForAll(results) {
  const live = results.filter((r) => !r.dead && r.finalUrl);
  log(`Running PageSpeed for ${live.length} live domains (concurrency ${CONCURRENCY_PSI})...`);
  const queue = [...live];
  async function worker() {
    while (queue.length) {
      const r = queue.shift();
      if (!r) break;
      const ps = await pageSpeedInsights(r.finalUrl);
      r.pagespeed = ps;
      if (ps.ok) log(`[PSI] ${r.domain} — score=${ps.score}`);
      else log(`[PSI-FAIL] ${r.domain} — ${ps.error || ps.status}`);
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY_PSI }, () => worker()));
}

// --- Main -------------------------------------------------------------------

async function runWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let idx = 0;
  async function spawn() {
    while (true) {
      const i = idx++;
      if (i >= items.length) break;
      try { results[i] = await worker(items[i], i); }
      catch (err) { results[i] = { error: err.message, item: items[i] }; }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => spawn()));
  return results;
}

(async () => {
  const input = JSON.parse(fs.readFileSync(INPUT, 'utf8'));
  const prospects = input.kept || input;
  log(`Loaded ${prospects.length} prospects. PSI key=${PAGESPEED_KEY ? 'yes' : 'no'}`);

  const t0 = Date.now();
  let completed = 0;
  const results = await runWithConcurrency(prospects, async (p, i) => {
    const r = await scanDomain(p);
    completed++;
    if (completed % 10 === 0) log(`Progress: ${completed}/${prospects.length}`);
    return r;
  }, CONCURRENCY_HTTP);

  log(`Scan-phase 1 done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  await runPageSpeedForAll(results);

  // Compute scores
  for (const r of results) {
    if (r.dead) {
      r.leadScore = 0;
      r.seoScore = 0;
      r.action = 'DEAD';
      r.flags = ['Sajt ej åtkomlig — kontrollera domän/server'];
      continue;
    }
    const s = computeScores(r);
    r.leadScore = s.leadScore;
    r.seoScore = s.seoScore;
    r.flags = s.flags;
    r.action = s.action;
  }

  // Write
  fs.writeFileSync(OUTPUT, JSON.stringify({
    generatedAt: new Date().toISOString(),
    count: results.length,
    results,
  }, null, 2), 'utf8');

  // Summary
  const counts = { RING: 0, MEJLA: 0, SKIPPA: 0, DEAD: 0 };
  for (const r of results) counts[r.action] = (counts[r.action] || 0) + 1;
  log(`DONE. Counts: ${JSON.stringify(counts)}  Total time: ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  logStream.end();
})().catch((err) => {
  console.error(err);
  log('FATAL: ' + err.stack);
  logStream.end();
  process.exit(1);
});
