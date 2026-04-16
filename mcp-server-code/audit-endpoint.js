'use strict';
/**
 * audit-endpoint.js — Express router för /api/audit-url
 *
 * POST /api/audit-url   body: { url, email }
 * Gör samma SEO-checks som prospect-scanner.py men i Node.js.
 * Returnerar JSON och sparar lead till BigQuery + skickar SES-alert vid score >= 6.
 *
 * Mount i index.js:
 *   const auditRouter = require('./audit-endpoint');
 *   app.use(auditRouter);
 */

const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');

const router = express.Router();

// ── In-memory rate limiter: max 5 requests per IP per hour ──
const rateLimitMap = new Map(); // ip -> { count, resetAt }

function checkRateLimit(ip) {
  const now = Date.now();
  const WINDOW = 60 * 60 * 1000; // 1 timme
  const MAX = 5;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW });
    return true;
  }
  if (entry.count >= MAX) return false;
  entry.count++;
  return true;
}

// Rensa gamla IP-poster var 30:e minut för att hålla minnet rent
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    if (now > entry.resetAt) rateLimitMap.delete(ip);
  }
}, 30 * 60 * 1000);


// ── PageSpeed helper ─────────────────────────────────────────

async function fetchPageSpeed(url) {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
  try {
    const { data } = await axios.get(apiUrl, { timeout: 20000 });
    const cats = data?.lighthouseResult?.categories || {};
    const rawScore = cats?.performance?.score;
    const score = rawScore != null ? Math.round(rawScore * 100) : null;

    const audits = data?.lighthouseResult?.audits || {};
    const metric = (key) => {
      const v = audits[key]?.displayValue || '';
      return v.split('\u00a0')[0].split(' ')[0] || null;
    };

    return {
      score,
      lcp: metric('largest-contentful-paint'),
      tbt: metric('total-blocking-time'),
      cls: metric('cumulative-layout-shift'),
    };
  } catch {
    return null;
  }
}


// ── Platform detection ───────────────────────────────────────

function detectPlatform(finalUrl, responseHeaders, html) {
  const bodyLower = html.toLowerCase();
  const headers = Object.fromEntries(
    Object.entries(responseHeaders).map(([k, v]) => [k.toLowerCase(), String(v).toLowerCase()])
  );

  if (bodyLower.includes('defaultwebpage.cgi') || html.trim().length < 200) {
    return { key: 'dead', label: 'Standard cPanel-sida — inget CMS installerat' };
  }
  if (bodyLower.includes('wixstatic.com') || Object.keys(headers).some(k => k.startsWith('x-wix-'))) {
    return { key: 'wix', label: 'Wix (begränsad optimeringsmöjlighet)' };
  }
  if (bodyLower.includes('squarespace.com')) {
    return { key: 'squarespace', label: 'Squarespace (begränsad optimeringsmöjlighet)' };
  }
  if (bodyLower.includes('weebly.com')) {
    return { key: 'weebly', label: 'Weebly (begränsad optimeringsmöjlighet)' };
  }
  if (bodyLower.includes('myshopify.com') || headers['x-shopid']) {
    return { key: 'shopify', label: 'Shopify (optimerbar via metafält)' };
  }
  if (bodyLower.includes('wp-content') || bodyLower.includes('wp-json')) {
    return { key: 'wordpress', label: 'WordPress (stark kandidat — full optimering möjlig)' };
  }
  return { key: 'custom', label: 'Custom/okänt CMS' };
}


// ── Main audit function ───────────────────────────────────────

async function auditUrl(rawUrl) {
  // Normalisera URL
  let url = rawUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }

  const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  let finalUrl = url;
  let html = '';
  let responseHeaders = {};
  let httpsActive = url.startsWith('https://');

  // Fetch med axios — följer redirects automatiskt
  try {
    const resp = await axios.get(url, {
      timeout: 12000,
      maxRedirects: 5,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SearchboostScanner/1.0; +https://searchboost.se/scanner)'
      },
      // Tillåt self-signed certs (för gamla siter)
      httpsAgent: (() => {
        const https = require('https');
        return new https.Agent({ rejectUnauthorized: false });
      })(),
    });
    finalUrl = resp.request?.res?.responseUrl || url;
    html = resp.data || '';
    responseHeaders = resp.headers || {};
    httpsActive = finalUrl.startsWith('https://');
  } catch (err) {
    // Försök http om https misslyckas
    if (url.startsWith('https://')) {
      try {
        const fallbackUrl = 'http://' + url.slice(8);
        const resp2 = await axios.get(fallbackUrl, {
          timeout: 10000,
          maxRedirects: 5,
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SearchboostScanner/1.0)' },
        });
        finalUrl = resp2.request?.res?.responseUrl || fallbackUrl;
        html = resp2.data || '';
        responseHeaders = resp2.headers || {};
        httpsActive = false;
      } catch {
        return {
          domain,
          reachable: false,
          error: 'Kunde inte nå domänen',
          score: 0,
          platform: 'unknown',
          platform_label: 'Okänd',
          issues: [],
          warnings: [],
          good: [],
          pitch: '',
          pagespeed: null,
        };
      }
    } else {
      return {
        domain,
        reachable: false,
        error: 'Kunde inte nå domänen: ' + err.message,
        score: 0,
        platform: 'unknown',
        platform_label: 'Okänd',
        issues: [],
        warnings: [],
        good: [],
        pitch: '',
        pagespeed: null,
      };
    }
  }

  const $ = cheerio.load(html);
  const platform = detectPlatform(finalUrl, responseHeaders, html);

  const issues = [];
  const warnings = [];
  const good = [];

  // 1. Title
  const title = $('title').first().text().trim();
  if (!title) {
    issues.push('Ingen title-tagg — sidan visas utan rubrik i Google');
  } else if (title.length < 30) {
    warnings.push(`Title för kort (${title.length} tecken) — bör vara 30–60 tecken`);
  } else if (title.length > 60) {
    warnings.push(`Title för lång (${title.length} tecken) — trunkeras i sökresultaten`);
  } else {
    good.push(`Title: "${title.slice(0, 60)}" (${title.length} tecken)`);
  }

  // 2. Meta description
  const desc = $('meta[name="description"]').attr('content');
  if (desc === undefined || desc === null) {
    issues.push('Ingen meta description — Google skriver sin egen, du tappar klick');
  } else if (desc.length < 120) {
    warnings.push(`Meta description för kort (${desc.length} tecken) — bör vara 120–155 tecken`);
  } else if (desc.length > 155) {
    warnings.push(`Meta description för lång (${desc.length} tecken) — trunkeras i sökresultaten`);
  } else {
    good.push(`Meta description: ${desc.length} tecken`);
  }

  // 3. H1
  const h1Count = $('h1').length;
  if (h1Count === 0) {
    issues.push('H1-tagg saknas — Google förstår inte vad sidan handlar om');
  } else if (h1Count > 1) {
    warnings.push(`Flera H1-taggar (${h1Count} st) — bara en H1 per sida rekommenderas`);
  } else {
    good.push('H1-tagg: exakt 1 st');
  }

  // 4. HTTPS
  if (httpsActive) {
    good.push('HTTPS aktivt');
  } else {
    issues.push('Ingen HTTPS — sidan är osäker och Google straffar det');
  }

  // 5. Noindex
  const robotsMeta = $('meta[name="robots"]').attr('content') || '';
  if (robotsMeta.toLowerCase().includes('noindex')) {
    issues.push('noindex-tagg hittad — sidan är DOLD för Google!');
  }

  // 6. Structured data
  const jsonLd = $('script[type="application/ld+json"]');
  let hasJsonLd = false;
  jsonLd.each((_, el) => {
    const content = $(el).html() || '';
    if (content.trim()) hasJsonLd = true;
  });
  if (!hasJsonLd) {
    issues.push('Ingen structured data — du syns inte i rich results');
  } else {
    good.push('Structured data (JSON-LD) hittad');
  }

  // 7. Open Graph
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content');
  if (!ogTitle || !ogDesc) {
    warnings.push('Open Graph saknas — delningar på sociala medier ser dåliga ut');
  } else {
    good.push('Open Graph: og:title och og:description hittade');
  }

  // 8. Sitemap (HEAD request)
  const sitemapUrl = `https://${domain}/sitemap.xml`;
  let sitemapOk = false;
  try {
    const sitemapResp = await axios.head(sitemapUrl, {
      timeout: 6000,
      validateStatus: () => true,
      httpsAgent: (() => {
        const https = require('https');
        return new https.Agent({ rejectUnauthorized: false });
      })(),
    });
    sitemapOk = sitemapResp.status >= 200 && sitemapResp.status < 300;
  } catch {
    sitemapOk = false;
  }

  if (sitemapOk) {
    good.push('Sitemap hittad på /sitemap.xml');
  } else {
    warnings.push('Ingen sitemap — Google kanske missar sidor');
  }

  // 9. PageSpeed
  const pagespeed = await fetchPageSpeed(finalUrl);
  const psScore = pagespeed?.score ?? null;

  if (psScore !== null) {
    if (psScore < 50) {
      issues.push(`Sidhastighet (mobil): ${psScore}/100 — mycket långsam, Google straffar hårt`);
    } else if (psScore < 70) {
      warnings.push(`Sidhastighet (mobil): ${psScore}/100 — långsam, Google straffar`);
    } else {
      good.push(`Sidhastighet (mobil): ${psScore}/100`);
    }
  } else {
    warnings.push('Sidhastighet: kunde inte hämtas');
  }

  // ── Score ─────────────────────────────────────────────────
  let score = issues.length * 2 + warnings.length;
  if (['wix', 'squarespace', 'weebly', 'dead'].includes(platform.key)) score += 3;
  score = Math.min(score, 10);

  let scoreLabel;
  if (score >= 6) scoreLabel = 'Stark kandidat';
  else if (score >= 4) scoreLabel = 'Möjlig kandidat';
  else scoreLabel = 'Lägre prio';

  // ── Pitch ─────────────────────────────────────────────────
  const pitch = issues.length > 0
    ? `Vi körde en automatisk analys av ${domain}. Vi hittade ${issues.length} kritiska SEO-problem som kostar er synlighet varje dag. Kan vi visa er resultaten på 15 minuter?`
    : `Vi körde en automatisk analys av ${domain}. Er sajt har bra grund men vi ser tydliga möjligheter att förbättra er synlighet i Google. Kan vi visa resultaten på 15 minuter?`;

  return {
    domain,
    reachable: true,
    scan_date: new Date().toISOString(),
    platform: platform.key,
    platform_label: platform.label,
    https: httpsActive,
    score,
    score_label: scoreLabel,
    issues,
    warnings,
    good,
    pitch,
    pagespeed,
    title: title || null,
    meta_description: desc || null,
  };
}


// ── BigQuery save ─────────────────────────────────────────────

async function saveLeadToBigQuery(domain, email, scanDate, score, platform) {
  try {
    // Hämta BQ credentials från SSM via miljövariabler om möjligt
    // I produktion hanteras credentials av Lambda/EC2 IAM-roll eller SSM
    const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
    const ssm = new SSMClient({ region: process.env.AWS_REGION || 'eu-north-1' });

    const credResp = await ssm.send(new GetParameterCommand({
      Name: '/seo-mcp/bigquery/credentials',
      WithDecryption: true,
    }));
    const credJson = JSON.parse(credResp.Parameter.Value);

    const bq = new BigQuery({
      projectId: 'searchboost-485810',
      credentials: credJson,
    });

    const tableId = 'searchboost-485810.seo_data.audit_leads';
    const dataset = bq.dataset('seo_data');
    const table = dataset.table('audit_leads');

    // Skapa tabell om den inte finns
    const [tableExists] = await table.exists();
    if (!tableExists) {
      await dataset.createTable('audit_leads', {
        schema: {
          fields: [
            { name: 'domain', type: 'STRING' },
            { name: 'email', type: 'STRING' },
            { name: 'scan_date', type: 'TIMESTAMP' },
            { name: 'score', type: 'INTEGER' },
            { name: 'platform', type: 'STRING' },
          ],
        },
        timePartitioning: { type: 'DAY', field: 'scan_date' },
      });
    }

    await table.insert([{
      domain,
      email: email || '',
      scan_date: new Date(scanDate).toISOString(),
      score,
      platform,
    }]);
  } catch (err) {
    console.error('[audit-endpoint] BigQuery-fel:', err.message);
  }
}


// ── SES alert ────────────────────────────────────────────────

async function sendAlertEmail(result, leadEmail) {
  try {
    const ses = new SESClient({ region: process.env.AWS_REGION || 'eu-north-1' });
    const issueList = result.issues.map(i => `  - ${i}`).join('\n');

    const body = [
      `Ny stark prospect hittad via audit-verktyget!`,
      ``,
      `Domän: ${result.domain}`,
      `Poäng: ${result.score}/10 — ${result.score_label}`,
      `Plattform: ${result.platform_label}`,
      leadEmail ? `Lead-email: ${leadEmail}` : '',
      ``,
      `Kritiska problem:`,
      issueList,
      ``,
      `Pitch:`,
      result.pitch,
    ].filter(l => l !== undefined).join('\n');

    await ses.send(new SendEmailCommand({
      Source: 'noreply@searchboost.se',
      Destination: { ToAddresses: ['mikael@searchboost.se'] },
      Message: {
        Subject: {
          Data: `Ny prospect: ${result.domain} — ${result.score}/10`,
          Charset: 'UTF-8',
        },
        Body: {
          Text: { Data: body, Charset: 'UTF-8' },
        },
      },
    }));
  } catch (err) {
    console.error('[audit-endpoint] SES-fel:', err.message);
  }
}


// ── Route ─────────────────────────────────────────────────────

/**
 * POST /api/audit-url
 * Body: { url: "https://example.se", email: "kund@example.se" }
 * Returns: { domain, platform, score, issues, warnings, good, pitch, pagespeed }
 */
router.post('/api/audit-url', async (req, res) => {
  const ip = req.ip || req.connection?.remoteAddress || 'unknown';

  if (!checkRateLimit(ip)) {
    return res.status(429).json({
      error: 'För många förfrågningar. Försök igen om en timme.',
    });
  }

  const { url, email } = req.body || {};

  if (!url) {
    return res.status(400).json({ error: 'Fält url är obligatoriskt' });
  }

  let result;
  try {
    result = await auditUrl(url);
  } catch (err) {
    console.error('[audit-endpoint] Oväntat fel:', err.message);
    return res.status(500).json({ error: 'Intern serverfel vid analys' });
  }

  // Spara lead i bakgrunden (await inte — vi vill inte blockera svaret)
  saveLeadToBigQuery(
    result.domain,
    email || '',
    result.scan_date || new Date().toISOString(),
    result.score,
    result.platform
  ).catch(() => {}); // Tyst fel — BigQuery är inte kritiskt

  // Skicka alert om stark kandidat
  if (result.score >= 6) {
    sendAlertEmail(result, email).catch(() => {});
  }

  return res.json(result);
});

module.exports = router;
