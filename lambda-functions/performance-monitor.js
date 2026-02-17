/**
 * Performance Monitor Lambda — Ersätter SE Ranking CWV
 *
 * Kollar Core Web Vitals och prestanda för alla kunders sajter
 * via Googles PageSpeed Insights API (gratis, 25k requests/dag).
 *
 * Körs veckovis via EventBridge (måndag 06:30 CET).
 *
 * Mäter:
 * - LCP (Largest Contentful Paint)
 * - INP (Interaction to Next Paint)
 * - CLS (Cumulative Layout Shift)
 * - Performance Score (0-100)
 * - Accessibility Score
 * - SEO Score (Lighthouse)
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
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

async function getCustomerSites() {
  // Hämta alla sajter från wordpress-parametrar
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

  return Object.values(sites).filter(s => s.url);
}

// ── BigQuery Table ──

async function ensureTable(bq, dataset) {
  const tableId = 'performance_log';
  try {
    await bq.dataset(dataset).table(tableId).get();
  } catch (e) {
    if (e.code === 404) {
      console.log('Creating performance_log table...');
      await bq.query({
        query: `
          CREATE TABLE \`${dataset}.${tableId}\` (
            id STRING,
            customer_id STRING,
            site_url STRING,
            scan_date DATE,
            strategy STRING,
            performance_score FLOAT64,
            seo_score FLOAT64,
            accessibility_score FLOAT64,
            best_practices_score FLOAT64,
            lcp_ms FLOAT64,
            inp_ms FLOAT64,
            cls FLOAT64,
            fcp_ms FLOAT64,
            ttfb_ms FLOAT64,
            speed_index_ms FLOAT64,
            total_blocking_time_ms FLOAT64,
            dom_size INT64,
            total_requests INT64,
            total_bytes INT64,
            opportunities STRING,
            diagnostics STRING,
            status STRING,
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

// ── PageSpeed Insights API ──

/**
 * Kör PageSpeed Insights för en URL
 * API: https://developers.google.com/speed/docs/insights/v5/get-started
 * Gratis: 25,000 requests/dag (mer än tillräckligt)
 */
async function runPageSpeedTest(url, strategy = 'mobile') {
  const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;

  const res = await axios.get(apiUrl, {
    params: {
      url,
      strategy, // 'mobile' eller 'desktop'
      category: ['performance', 'seo', 'accessibility', 'best-practices'],
      locale: 'sv'
    },
    timeout: 60000 // PageSpeed kan ta tid
  });

  const data = res.data;
  const lighthouse = data.lighthouseResult;
  const categories = lighthouse.categories;
  const audits = lighthouse.audits;

  // Core Web Vitals
  const cwv = {
    lcp: audits['largest-contentful-paint']?.numericValue || null,
    inp: audits['interaction-to-next-paint']?.numericValue ||
         audits['max-potential-fid']?.numericValue || null,
    cls: audits['cumulative-layout-shift']?.numericValue || null,
    fcp: audits['first-contentful-paint']?.numericValue || null,
    ttfb: audits['server-response-time']?.numericValue || null,
    speedIndex: audits['speed-index']?.numericValue || null,
    totalBlockingTime: audits['total-blocking-time']?.numericValue || null
  };

  // Scores (0-1, vi konverterar till 0-100)
  const scores = {
    performance: (categories.performance?.score || 0) * 100,
    seo: (categories.seo?.score || 0) * 100,
    accessibility: (categories.accessibility?.score || 0) * 100,
    bestPractices: (categories['best-practices']?.score || 0) * 100
  };

  // Resource summary
  const resources = lighthouse.audits['resource-summary']?.details?.items || [];
  const totalRequests = resources.reduce((sum, r) => sum + (r.requestCount || 0), 0);
  const totalBytes = resources.reduce((sum, r) => sum + (r.transferSize || 0), 0);

  // DOM-storlek
  const domSize = audits['dom-size']?.numericValue || null;

  // Förbättringsmöjligheter (top 5)
  const opportunities = Object.values(audits)
    .filter(a => a.details?.type === 'opportunity' && a.details?.overallSavingsMs > 100)
    .sort((a, b) => (b.details?.overallSavingsMs || 0) - (a.details?.overallSavingsMs || 0))
    .slice(0, 5)
    .map(a => ({
      title: a.title,
      savingsMs: a.details?.overallSavingsMs,
      savingsBytes: a.details?.overallSavingsBytes
    }));

  // Diagnostik (varningar)
  const diagnostics = Object.values(audits)
    .filter(a => a.details?.type === 'table' && a.score !== null && a.score < 0.9)
    .slice(0, 5)
    .map(a => ({ title: a.title, score: a.score, displayValue: a.displayValue }));

  return { cwv, scores, totalRequests, totalBytes, domSize, opportunities, diagnostics };
}

// ── Status Classification ──

function classifyPerformance(scores, cwv) {
  // Baserat på Google's CWV-tröskelvärden
  const lcpGood = cwv.lcp && cwv.lcp <= 2500;
  const clsGood = cwv.cls !== null && cwv.cls <= 0.1;
  const inpGood = cwv.inp && cwv.inp <= 200;

  if (scores.performance >= 90 && lcpGood && clsGood) return 'excellent';
  if (scores.performance >= 50 && (lcpGood || clsGood)) return 'good';
  if (scores.performance >= 25) return 'needs_improvement';
  return 'poor';
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== Performance Monitor Started ===');

  // Stöd för manuell trigger med specifik sajt
  const forceSiteId = event?.siteId;
  const forceStrategy = event?.strategy || 'mobile';

  try {
    const { bq, dataset } = await getBigQuery();
    await ensureTable(bq, dataset);

    const allSites = await getCustomerSites();
    console.log(`Found ${allSites.length} sites to monitor`);

    const targetSites = forceSiteId
      ? allSites.filter(s => s.id === forceSiteId)
      : allSites;

    const results = [];

    for (const site of targetSites) {
      try {
        console.log(`\n--- ${site.id}: ${site.url} ---`);

        // Kör PageSpeed test (mobil)
        const testResult = await runPageSpeedTest(site.url, forceStrategy);
        const status = classifyPerformance(testResult.scores, testResult.cwv);

        console.log(`  Performance: ${testResult.scores.performance.toFixed(0)}/100`);
        console.log(`  SEO: ${testResult.scores.seo.toFixed(0)}/100`);
        console.log(`  LCP: ${testResult.cwv.lcp ? (testResult.cwv.lcp / 1000).toFixed(1) + 's' : 'N/A'}`);
        console.log(`  CLS: ${testResult.cwv.cls !== null ? testResult.cwv.cls.toFixed(3) : 'N/A'}`);
        console.log(`  Status: ${status}`);

        // Spara i BigQuery
        const logId = `perf_${Date.now()}_${site.id}`;
        await bq.query({
          query: `
            INSERT INTO \`${dataset}.performance_log\`
            (id, customer_id, site_url, scan_date, strategy,
             performance_score, seo_score, accessibility_score, best_practices_score,
             lcp_ms, inp_ms, cls, fcp_ms, ttfb_ms, speed_index_ms, total_blocking_time_ms,
             dom_size, total_requests, total_bytes,
             opportunities, diagnostics, status)
            VALUES (@id, @customer_id, @site_url, CURRENT_DATE(), @strategy,
                    @performance_score, @seo_score, @accessibility_score, @best_practices_score,
                    @lcp_ms, @inp_ms, @cls, @fcp_ms, @ttfb_ms, @speed_index_ms, @total_blocking_time_ms,
                    @dom_size, @total_requests, @total_bytes,
                    @opportunities, @diagnostics, @status)
          `,
          params: {
            id: logId,
            customer_id: site.id,
            site_url: site.url,
            strategy: forceStrategy,
            performance_score: testResult.scores.performance,
            seo_score: testResult.scores.seo,
            accessibility_score: testResult.scores.accessibility,
            best_practices_score: testResult.scores.bestPractices,
            lcp_ms: testResult.cwv.lcp,
            inp_ms: testResult.cwv.inp,
            cls: testResult.cwv.cls,
            fcp_ms: testResult.cwv.fcp,
            ttfb_ms: testResult.cwv.ttfb,
            speed_index_ms: testResult.cwv.speedIndex,
            total_blocking_time_ms: testResult.cwv.totalBlockingTime,
            dom_size: testResult.domSize,
            total_requests: testResult.totalRequests,
            total_bytes: testResult.totalBytes,
            opportunities: JSON.stringify(testResult.opportunities),
            diagnostics: JSON.stringify(testResult.diagnostics),
            status
          }
        });

        results.push({
          site: site.id,
          url: site.url,
          performance: testResult.scores.performance,
          seo: testResult.scores.seo,
          lcp: testResult.cwv.lcp,
          cls: testResult.cwv.cls,
          status,
          topOpportunity: testResult.opportunities[0]?.title || 'None'
        });

        // Vänta lite mellan requests (respektera API rate limits)
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (err) {
        console.error(`  Error for ${site.id}: ${err.message}`);
        results.push({ site: site.id, error: err.message });
      }
    }

    const successful = results.filter(r => !r.error).length;
    const poorSites = results.filter(r => r.status === 'poor' || r.status === 'needs_improvement');

    console.log(`\n=== Performance Monitor Complete ===`);
    console.log(`Scanned: ${successful}/${targetSites.length}`);
    console.log(`Poor/Needs Improvement: ${poorSites.length}`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        scanned: successful,
        total: targetSites.length,
        poorSites: poorSites.length,
        results
      })
    };

  } catch (err) {
    console.error('Performance Monitor failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
