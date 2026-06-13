/**
 * perispa — PageSpeed Insights tools
 * perispa_pagespeed_test, perispa_pagespeed_all, perispa_pagespeed_monitor
 */

const { z } = require('zod');
const https = require('https');
const fs = require('fs');
const path = require('path');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { rejectUnauthorized: false, timeout: 60000 }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); } catch { reject(new Error('Invalid JSON fran PageSpeed API')); }
      });
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('Timeout (60s) vid PageSpeed-anrop')); });
  });
}

function parsePageSpeedResult(data) {
  const lhr = data.lighthouseResult;
  if (!lhr) return null;

  const audits = lhr.audits || {};
  const score = Math.round((lhr.categories?.performance?.score || 0) * 100);

  return {
    performance_score: score,
    lcp: audits['largest-contentful-paint']?.numericValue || null,
    lcp_display: audits['largest-contentful-paint']?.displayValue || 'N/A',
    inp: audits['interaction-to-next-paint']?.numericValue || audits['max-potential-fid']?.numericValue || null,
    inp_display: audits['interaction-to-next-paint']?.displayValue || audits['max-potential-fid']?.displayValue || 'N/A',
    cls: audits['cumulative-layout-shift']?.numericValue || null,
    cls_display: audits['cumulative-layout-shift']?.displayValue || 'N/A',
    fcp: audits['first-contentful-paint']?.numericValue || null,
    fcp_display: audits['first-contentful-paint']?.displayValue || 'N/A',
    tbt: audits['total-blocking-time']?.numericValue || null,
    tbt_display: audits['total-blocking-time']?.displayValue || 'N/A',
    opportunities: Object.values(audits)
      .filter(a => a.details?.type === 'opportunity' && a.score !== null && a.score < 1)
      .map(a => ({ title: a.title, savings: a.displayValue, score: Math.round((a.score || 0) * 100) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 10),
  };
}

function getHistoryDir() {
  const dir = path.join(__dirname, '..', 'pagespeed-history');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function getHistoryFile(siteSlug, strategy) {
  return path.join(getHistoryDir(), `${siteSlug}-${strategy}.json`);
}

function loadHistory(siteSlug, strategy) {
  const filePath = getHistoryFile(siteSlug, strategy);
  if (fs.existsSync(filePath)) {
    try { return JSON.parse(fs.readFileSync(filePath, 'utf-8')); } catch { return []; }
  }
  return [];
}

function saveHistory(siteSlug, strategy, entry) {
  const filePath = getHistoryFile(siteSlug, strategy);
  const history = loadHistory(siteSlug, strategy);
  history.push(entry);
  // Behall max 100 poster
  if (history.length > 100) history.splice(0, history.length - 100);
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2), 'utf-8');
}

module.exports = function registerPagespeedTools(server, getSite, wpFetch) {

  // --- Single page test ---
  server.tool('perispa_pagespeed_test', 'Testa en URL med PageSpeed Insights API (performance score + Core Web Vitals)', {
    url: z.string().describe('URL att testa'),
    strategy: z.string().optional().default('mobile').describe('mobile eller desktop'),
  }, async (args) => {
    try {
      const strategy = args.strategy === 'desktop' ? 'desktop' : 'mobile';
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(args.url)}&strategy=${strategy}&category=performance`;

      const data = await httpsGet(apiUrl);
      const result = parsePageSpeedResult(data);
      if (!result) return err('Kunde inte hamta Lighthouse-data for ' + args.url);

      return text({
        url: args.url,
        strategy: strategy,
        tested_at: new Date().toISOString(),
        ...result,
      });
    } catch (e) { return err(e.message); }
  });

  // --- Test all pages ---
  server.tool('perispa_pagespeed_all', 'Testa ALLA publicerade sidor pa en site (max 20 — sorterat pa lagst score forst)', {
    site: z.string().optional().describe('site-slug'),
    strategy: z.string().optional().default('mobile').describe('mobile eller desktop'),
    max_pages: z.number().optional().default(10).describe('Max antal sidor att testa (max 20)'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const strategy = args.strategy === 'desktop' ? 'desktop' : 'mobile';
      const maxPages = Math.min(parseInt(args.max_pages) || 10, 20);

      // Hamta publicerade sidor
      const pagesRes = await wpFetch(s, 'wp/v2/pages', {
        params: { per_page: maxPages, status: 'publish', _fields: 'id,title,link,slug', orderby: 'menu_order', order: 'asc' },
      }).catch(() => ({ data: [] }));

      const pages = Array.isArray(pagesRes.data) ? pagesRes.data : [];
      if (pages.length === 0) return err('Inga publicerade sidor hittades');

      // Testa varje sida sekventiellt (for att inte overbelasta API:t)
      const results = [];
      for (const page of pages) {
        const url = page.link;
        if (!url) continue;

        try {
          const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance`;
          const data = await httpsGet(apiUrl);
          const parsed = parsePageSpeedResult(data);

          results.push({
            url: url,
            title: page.title?.rendered || page.slug,
            performance_score: parsed ? parsed.performance_score : null,
            lcp: parsed?.lcp_display || 'N/A',
            inp: parsed?.inp_display || 'N/A',
            cls: parsed?.cls_display || 'N/A',
            fcp: parsed?.fcp_display || 'N/A',
            tbt: parsed?.tbt_display || 'N/A',
            top_opportunity: parsed?.opportunities?.[0]?.title || 'Inga',
          });
        } catch (e) {
          results.push({ url: url, title: page.title?.rendered || page.slug, performance_score: null, error: e.message });
        }
      }

      // Sortera pa score (lagst forst)
      results.sort((a, b) => (a.performance_score ?? 999) - (b.performance_score ?? 999));

      const avgScore = results.filter(r => r.performance_score !== null);
      const average = avgScore.length > 0 ? Math.round(avgScore.reduce((s, r) => s + r.performance_score, 0) / avgScore.length) : null;

      return text({
        site: s.url || s.id,
        strategy: strategy,
        tested_at: new Date().toISOString(),
        pages_tested: results.length,
        average_score: average,
        results: results,
      });
    } catch (e) { return err(e.message); }
  });

  // --- Monitor (compare with history) ---
  server.tool('perispa_pagespeed_monitor', 'Jamfor nuvarande PageSpeed-resultat med sparade historiska resultat', {
    site: z.string().optional().describe('site-slug'),
    strategy: z.string().optional().default('mobile').describe('mobile eller desktop'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const strategy = args.strategy === 'desktop' ? 'desktop' : 'mobile';
      const siteSlug = s.id || s.slug || args.site || 'unknown';

      // Hamta startsidan
      const siteUrl = s.url || '';
      if (!siteUrl) return err('Kunde inte bestamma site-URL');

      // Testa startsidan
      const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(siteUrl)}&strategy=${strategy}&category=performance`;
      const data = await httpsGet(apiUrl);
      const current = parsePageSpeedResult(data);
      if (!current) return err('Kunde inte hamta PageSpeed-data');

      // Ladda historik
      const history = loadHistory(siteSlug, strategy);
      const lastEntry = history.length > 0 ? history[history.length - 1] : null;

      // Skapa ny post
      const newEntry = {
        timestamp: new Date().toISOString(),
        url: siteUrl,
        performance_score: current.performance_score,
        lcp: current.lcp,
        inp: current.inp,
        cls: current.cls,
        fcp: current.fcp,
        tbt: current.tbt,
      };

      // Spara
      saveHistory(siteSlug, strategy, newEntry);

      // Jamfor med foregaende
      let changes = null;
      if (lastEntry) {
        changes = {
          previous_test: lastEntry.timestamp,
          score_diff: current.performance_score - (lastEntry.performance_score || 0),
          lcp_diff_ms: current.lcp !== null && lastEntry.lcp !== null ? Math.round(current.lcp - lastEntry.lcp) : null,
          inp_diff_ms: current.inp !== null && lastEntry.inp !== null ? Math.round(current.inp - lastEntry.inp) : null,
          cls_diff: current.cls !== null && lastEntry.cls !== null ? Math.round((current.cls - lastEntry.cls) * 1000) / 1000 : null,
          fcp_diff_ms: current.fcp !== null && lastEntry.fcp !== null ? Math.round(current.fcp - lastEntry.fcp) : null,
          tbt_diff_ms: current.tbt !== null && lastEntry.tbt !== null ? Math.round(current.tbt - lastEntry.tbt) : null,
        };
      }

      return text({
        site: siteUrl,
        strategy: strategy,
        tested_at: newEntry.timestamp,
        current: {
          performance_score: current.performance_score,
          lcp: current.lcp_display,
          inp: current.inp_display,
          cls: current.cls_display,
          fcp: current.fcp_display,
          tbt: current.tbt_display,
        },
        changes: changes || 'Forsta testet — ingen historik att jamfora med',
        history_entries: history.length + 1,
        opportunities: current.opportunities,
      });
    } catch (e) { return err(e.message); }
  });

};
