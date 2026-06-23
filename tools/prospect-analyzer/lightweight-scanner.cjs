#!/usr/bin/env node
/**
 * Lightweight prospect SEO-scanner.
 *
 * Skillnaden mot lambda-functions/prospect-analyzer.js:
 * - Den fullständiga analyzern är tung (WP REST API, GSC OAuth, full Lighthouse, AI-presentation)
 *   och avsedd för EN prospect i taget när Mikael bestämmer sig för att gå djupt.
 * - Detta script är OPTIMERAT FÖR VOLYM — 2000+ domäner. Bara HTTP GET startsidan,
 *   parsa meta-tags, kolla robots.txt + sitemap.xml, valfri PageSpeed-mätning (om PSI-nyckel finns),
 *   beräkna en samlad score, skriv till BQ prospect_seo_scores.
 * - Resultat används av BillionMail-flödet för segmenterade utskick.
 *
 * Användning:
 *   node tools/prospect-analyzer/lightweight-scanner.js <csv-fil>
 *   CSV-format: en kolumn "domain", värdet kan vara "example.se" eller "https://example.se".
 *
 * Concurrency: 10 parallella requests. Timeout 15s per domän.
 * Beräknad körtid: 2000 domäner ≈ 30-40 min med PSI, 10 min utan.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { BigQuery } = require(path.join(__dirname, '../../lambda-functions/node_modules/@google-cloud/bigquery'));
const axios = require(path.join(__dirname, '../../lambda-functions/node_modules/axios'));

const PROJECT = 'seo-aouto';
const DATASET = 'seo_data';
const CONCURRENCY = 10;
const TIMEOUT_MS = 15000;
const USER_AGENT = 'SearchBoost-Prospect-Scanner/1.0 (+https://searchboost.se)';

function normalizeDomain(input) {
  let d = String(input || '').trim().toLowerCase();
  if (!d) return null;
  d = d.replace(/^https?:\/\//, '').replace(/\/$/, '');
  return d;
}

function extractTag(html, regex) {
  const m = html.match(regex);
  return m ? m[1].trim() : null;
}

function countMatches(html, regex) {
  const m = html.match(regex);
  return m ? m.length : 0;
}

function calculateScore(features) {
  let score = 100;
  const problems = [];
  const recommendations = [];

  if (!features.has_meta_title) { score -= 15; problems.push('Saknar meta-titel'); recommendations.push('Lägg till unik <title> per sida med viktigaste sökordet först (50-60 tecken)'); }
  else if (features.meta_title && features.meta_title.length < 30) { score -= 5; problems.push('För kort meta-titel'); recommendations.push('Utöka meta-titlar till 50-60 tecken'); }

  if (!features.has_meta_description) { score -= 10; problems.push('Saknar meta-beskrivning'); recommendations.push('Skriv unika meta-beskrivningar 150-160 tecken med CTA'); }

  if (!features.has_h1) { score -= 10; problems.push('Saknar H1'); recommendations.push('Lägg en tydlig H1 per sida'); }
  else if (features.h1_count > 1) { score -= 5; problems.push(`${features.h1_count} H1-rubriker (ska vara en)`); }

  if (!features.has_robots_txt) { score -= 5; problems.push('Saknar robots.txt'); recommendations.push('Lägg robots.txt i roten med sitemap-referens'); }
  if (!features.has_sitemap) { score -= 5; problems.push('Saknar sitemap.xml'); recommendations.push('Generera XML-sitemap och länka från robots.txt'); }

  if (!features.has_schema) { score -= 10; problems.push('Saknar structured data'); recommendations.push('Lägg till JSON-LD schema (Organization, BreadcrumbList, FAQPage där relevant)'); }
  if (!features.has_open_graph) { score -= 5; problems.push('Saknar Open Graph-taggar'); recommendations.push('Lägg till og:title, og:description, og:image för delningar'); }

  if (!features.is_https) { score -= 15; problems.push('Ej HTTPS'); recommendations.push('Aktivera HTTPS med Let\'s Encrypt — kritiskt för rankning'); }

  if (features.pagespeed_performance && features.pagespeed_performance < 50) { score -= 15; problems.push(`Mycket långsam (Lighthouse ${features.pagespeed_performance}/100)`); recommendations.push('Optimera bilder, aktivera browser-cache, minska JS-bundles'); }
  else if (features.pagespeed_performance && features.pagespeed_performance < 75) { score -= 5; problems.push(`Långsam (Lighthouse ${features.pagespeed_performance}/100)`); }

  if (features.images_missing_alt > 0) { score -= Math.min(10, features.images_missing_alt); problems.push(`${features.images_missing_alt} bilder utan alt-text`); recommendations.push('Lägg beskrivande alt-text på alla bilder'); }

  if (features.word_count && features.word_count < 200) { score -= 10; problems.push(`Tunt innehåll (${features.word_count} ord)`); recommendations.push('Utöka huvudsidan till minst 500-800 ord med relevant innehåll'); }

  score = Math.max(0, Math.min(100, score));
  let segment = 'good';
  if (score < 50) segment = 'bad';
  else if (score < 75) segment = 'medium';

  return { score, segment, problems, recommendations };
}

async function fetchHttp(url) {
  try {
    const res = await axios.get(url, {
      timeout: TIMEOUT_MS,
      headers: { 'User-Agent': USER_AGENT },
      maxRedirects: 5,
      validateStatus: () => true,
    });
    return { status: res.status, headers: res.headers, data: typeof res.data === 'string' ? res.data : '' };
  } catch (e) {
    return { status: 0, error: e.message };
  }
}

async function probeDomain(domain) {
  const start = Date.now();
  const protocol = 'https';
  const baseUrl = `${protocol}://${domain}`;

  const homeRes = await fetchHttp(baseUrl);
  const robotsRes = await fetchHttp(`${baseUrl}/robots.txt`);
  const sitemapRes = await fetchHttp(`${baseUrl}/sitemap.xml`);

  const html = homeRes.data || '';
  const isHttps = homeRes.status > 0 && homeRes.status < 500;

  const features = {
    domain,
    scanned_at: new Date().toISOString(),
    http_status: homeRes.status,
    is_https: isHttps,
    has_robots_txt: robotsRes.status === 200,
    has_sitemap: sitemapRes.status === 200,
    meta_title: extractTag(html, /<title[^>]*>([^<]+)<\/title>/i),
    meta_description: extractTag(html, /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i),
    has_h1: /<h1[^>]*>[\s\S]*?<\/h1>/i.test(html),
    h1_count: countMatches(html, /<h1[^>]*>/gi),
    has_schema: /<script[^>]+type=["']application\/ld\+json["']/i.test(html),
    has_open_graph: /<meta\s+property=["']og:/i.test(html),
    is_mobile_responsive: /<meta\s+name=["']viewport["']/i.test(html),
    image_count: countMatches(html, /<img[^>]*>/gi),
    images_missing_alt: countMatches(html, /<img(?![^>]*\salt=)/gi),
    internal_link_count: countMatches(html, new RegExp(`<a[^>]+href=["'](?:${baseUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}|/[^"'#]+)["']`, 'gi')),
    external_link_count: countMatches(html, /<a[^>]+href=["']https?:\/\/(?!__SELF__)/gi),
    word_count: (html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').length) || 0,
  };
  features.has_meta_title = !!features.meta_title;
  features.has_meta_description = !!features.meta_description;

  // PageSpeed (om PSI-nyckel finns) — valfritt, dyrt
  if (process.env.PSI_API_KEY && homeRes.status === 200) {
    try {
      const psi = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
        params: { url: baseUrl, key: process.env.PSI_API_KEY, strategy: 'mobile', category: ['performance', 'seo', 'accessibility'] },
        timeout: 60000,
      });
      const cats = psi.data?.lighthouseResult?.categories || {};
      features.pagespeed_performance = Math.round((cats.performance?.score || 0) * 100);
      features.pagespeed_seo = Math.round((cats.seo?.score || 0) * 100);
      features.pagespeed_accessibility = Math.round((cats.accessibility?.score || 0) * 100);
    } catch (e) { /* PSI-fail, OK */ }
  }

  const { score, segment, problems, recommendations } = calculateScore(features);
  features.overall_score = score;
  features.segment = segment;
  features.problems = problems;
  features.recommendations = recommendations;
  features.email_sent = false;

  const elapsed = Date.now() - start;
  console.log(`${domain.padEnd(40)} ${score.toString().padStart(3)}/100 ${segment.padEnd(7)} ${elapsed}ms`);
  return features;
}

async function processBatch(domains) {
  const credsJson = execSync('aws ssm get-parameter --name /seo-mcp/bigquery/credentials --with-decryption --region eu-north-1 --profile mikael --query Parameter.Value --output text').toString();
  fs.writeFileSync('/tmp/bq-creds.json', credsJson);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds.json';
  const bq = new BigQuery({ projectId: PROJECT });

  const results = [];
  const queue = [...domains];
  const inFlight = new Set();

  async function next() {
    if (queue.length === 0) return;
    const d = queue.shift();
    const p = probeDomain(d).then((r) => { results.push(r); inFlight.delete(p); });
    inFlight.add(p);
    if (inFlight.size >= CONCURRENCY) await Promise.race(inFlight);
    return next();
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => next()));
  await Promise.all([...inFlight]);

  // Streaming insert i chunks om 500
  console.log(`\nSkriver ${results.length} resultat till BQ...`);
  const chunk = 500;
  for (let i = 0; i < results.length; i += chunk) {
    await bq.dataset(DATASET).table('prospect_seo_scores').insert(results.slice(i, i + chunk));
  }
  console.log('Klart.');

  // Summera segments
  const segments = results.reduce((acc, r) => { acc[r.segment] = (acc[r.segment] || 0) + 1; return acc; }, {});
  console.log('\nSegment-fördelning:');
  console.log(`  bad    : ${segments.bad || 0}  ← skickar utskick`);
  console.log(`  medium : ${segments.medium || 0}`);
  console.log(`  good   : ${segments.good || 0}`);
}

async function main() {
  const csvFile = process.argv[2];
  if (!csvFile) {
    console.error('Usage: node lightweight-scanner.js <csv-file>');
    process.exit(1);
  }
  const csv = fs.readFileSync(csvFile, 'utf8');
  const lines = csv.split('\n').map((l) => l.trim()).filter(Boolean);
  const header = lines[0].split(',');
  const domainCol = header.findIndex((h) => /domain|url|site/i.test(h));
  const domains = lines.slice(1).map((l) => normalizeDomain(l.split(',')[domainCol >= 0 ? domainCol : 0])).filter(Boolean);
  console.log(`Skannar ${domains.length} domäner med concurrency=${CONCURRENCY}...\n`);
  await processBatch(domains);
}

main().catch((e) => { console.error(e); process.exit(1); });
