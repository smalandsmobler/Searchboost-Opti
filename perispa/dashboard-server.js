#!/usr/bin/env node
/**
 * Perispa Agency Dashboard Server
 * Port: 4000  →  http://localhost:4000
 *
 * Aggregerar WP REST API-data från alla kunder i config.json
 * och serverar ett agency-dashboard UI.
 *
 * Start: node dashboard-server.js
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');
const url   = require('url');

const PORT        = parseInt(process.env.PORT || '4000', 10);
const CONFIG_PATH = path.join(__dirname, 'config.json');
const DASH_DIR    = path.join(__dirname, 'dashboard');

// ── Config ──────────────────────────────────────────────────────
function loadConfig() {
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}
let cfg = loadConfig();

// ── WP REST client ───────────────────────────────────────────────
function wpFetch(site, endpoint, opts = {}) {
  return new Promise((resolve, reject) => {
    const base   = site.url.replace(/\/$/, '');
    const reqUrl = new URL(`${base}/wp-json/${endpoint}`);
    if (opts.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        if (v != null) reqUrl.searchParams.set(k, String(v));
      }
    }
    const auth = Buffer.from(`${site.username}:${site.app_password}`).toString('base64');
    const mod  = reqUrl.protocol === 'https:' ? https : http;
    const req  = mod.request(reqUrl, {
      method:            opts.method || 'GET',
      headers:           { Authorization: `Basic ${auth}`, 'User-Agent': 'perispa-dashboard/1.0', ...opts.headers },
      rejectUnauthorized: false,
      timeout:           12000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({
            data:       json,
            status:     res.statusCode,
            total:      res.headers['x-wp-total']      ? parseInt(res.headers['x-wp-total'])      : null,
            totalPages: res.headers['x-wp-totalpages'] ? parseInt(res.headers['x-wp-totalpages']) : null,
          });
        } catch {
          resolve({ data, status: res.statusCode, total: null, totalPages: null });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ── Helpers ──────────────────────────────────────────────────────
function json(res, data, status = 200) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(body);
}

function serveStatic(res, filePath) {
  const ext = path.extname(filePath);
  const mime = {
    '.html': 'text/html',
    '.css':  'text/css',
    '.js':   'application/javascript',
    '.json': 'application/json',
    '.png':  'image/png',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
  }[ext] || 'text/plain';
  try {
    const content = fs.readFileSync(filePath);
    res.writeHead(200, { 'Content-Type': mime });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not found');
  }
}

// ── Site status: en snabb ping ───────────────────────────────────
async function getSiteStatus(slug) {
  const site = cfg.sites[slug];
  if (!site) return { slug, online: false, error: 'Okänd site' };
  const t0 = Date.now();
  try {
    const r = await wpFetch(site, 'wp/v2/types', { params: { per_page: 1 } });
    return {
      slug,
      online:   r.status < 400,
      status:   r.status,
      latency:  Date.now() - t0,
      company:  site.company_name || slug,
      url:      site.url,
    };
  } catch (e) {
    return { slug, online: false, error: e.message, latency: Date.now() - t0, company: site.company_name || slug, url: site.url };
  }
}

// ── Site stats: pages / posts / media ────────────────────────────
async function getSiteStats(slug) {
  const site = cfg.sites[slug];
  if (!site) return null;
  const [pagesRes, postsRes, mediaRes, pluginsRes] = await Promise.allSettled([
    wpFetch(site, 'wp/v2/pages',   { params: { per_page: 1, status: 'publish' } }),
    wpFetch(site, 'wp/v2/posts',   { params: { per_page: 1, status: 'publish' } }),
    wpFetch(site, 'wp/v2/media',   { params: { per_page: 1 } }),
    wpFetch(site, 'wp/v2/plugins', { params: { per_page: 100 } }),
  ]);

  const pages   = pagesRes.status   === 'fulfilled' ? (pagesRes.value.total   ?? '?') : '?';
  const posts   = postsRes.status   === 'fulfilled' ? (postsRes.value.total   ?? '?') : '?';
  const media   = mediaRes.status   === 'fulfilled' ? (mediaRes.value.total   ?? '?') : '?';

  let plugins = { active: 0, inactive: 0, total: 0, list: [] };
  if (pluginsRes.status === 'fulfilled' && Array.isArray(pluginsRes.value.data)) {
    const pl = pluginsRes.value.data;
    plugins = {
      total:    pl.length,
      active:   pl.filter(p => p.status === 'active').length,
      inactive: pl.filter(p => p.status !== 'active').length,
      list:     pl.map(p => ({ name: p.name, status: p.status, version: p.version })).slice(0, 20),
    };
  }

  return { slug, pages, posts, media, plugins };
}

// ── Recent content ───────────────────────────────────────────────
async function getRecentContent(slug) {
  const site = cfg.sites[slug];
  if (!site) return [];
  const [pR, poR] = await Promise.allSettled([
    wpFetch(site, 'wp/v2/pages', { params: { per_page: 5, orderby: 'modified', order: 'desc', context: 'edit' } }),
    wpFetch(site, 'wp/v2/posts', { params: { per_page: 5, orderby: 'modified', order: 'desc', context: 'edit' } }),
  ]);
  const items = [];
  if (pR.status === 'fulfilled' && Array.isArray(pR.value.data)) {
    pR.value.data.forEach(p => items.push({ id: p.id, title: p.title?.rendered || p.title?.raw, type: 'page', modified: p.modified, link: p.link }));
  }
  if (poR.status === 'fulfilled' && Array.isArray(poR.value.data)) {
    poR.value.data.forEach(p => items.push({ id: p.id, title: p.title?.rendered || p.title?.raw, type: 'post', modified: p.modified, link: p.link }));
  }
  return items.sort((a, b) => new Date(b.modified) - new Date(a.modified)).slice(0, 8);
}

// ── SEO quick score ──────────────────────────────────────────────
async function getSeoScore(slug) {
  const site = cfg.sites[slug];
  if (!site) return null;
  try {
    const r = await wpFetch(site, 'wp/v2/pages', { params: { per_page: 20, context: 'edit', status: 'publish' } });
    if (!Array.isArray(r.data)) return null;

    let missingTitle = 0, missingDesc = 0, missingFocus = 0, total = r.data.length;
    for (const p of r.data) {
      const m = p.meta || {};
      const t = m.rank_math_title || m._yoast_wpseo_title || '';
      const d = m.rank_math_description || m._yoast_wpseo_metadesc || '';
      const f = m.rank_math_focus_keyword || m._yoast_wpseo_focuskw || '';
      if (!t) missingTitle++;
      if (!d) missingDesc++;
      if (!f) missingFocus++;
    }
    const score = Math.max(0, Math.round(100 - ((missingTitle + missingDesc * 0.8 + missingFocus * 0.4) / (total * 2.2)) * 100));
    return { slug, score, total, missingTitle, missingDesc, missingFocus };
  } catch {
    return null;
  }
}

// ── Overview: alla sites parallellt ─────────────────────────────
async function getOverview() {
  const slugs = Object.keys(cfg.sites);
  const results = await Promise.allSettled(
    slugs.map(async (slug) => {
      const [status, stats, seo] = await Promise.allSettled([
        getSiteStatus(slug),
        getSiteStats(slug),
        getSeoScore(slug),
      ]);
      return {
        slug,
        company:  cfg.sites[slug].company_name || slug,
        url:      cfg.sites[slug].url,
        gsc:      cfg.sites[slug].gsc_property,
        status:   status.status   === 'fulfilled' ? status.value   : { online: false, error: status.reason?.message },
        stats:    stats.status    === 'fulfilled' ? stats.value    : null,
        seo:      seo.status      === 'fulfilled' ? seo.value      : null,
      };
    })
  );
  return results.map(r => r.status === 'fulfilled' ? r.value : { slug: '?', error: r.reason?.message });
}

// ── HTTP Router ──────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  const parsed   = url.parse(req.url, true);
  const pathname = parsed.pathname;

  // ── API ──────────────────────────────────────────────────────
  if (pathname.startsWith('/api/')) {

    // Reload config
    if (pathname === '/api/reload') {
      cfg = loadConfig();
      return json(res, { ok: true, sites: Object.keys(cfg.sites).length });
    }

    // Overview (all sites)
    if (pathname === '/api/overview') {
      try {
        const data = await getOverview();
        return json(res, data);
      } catch (e) {
        return json(res, { error: e.message }, 500);
      }
    }

    // List sites
    if (pathname === '/api/sites') {
      const sites = Object.entries(cfg.sites).map(([slug, s]) => ({
        slug, url: s.url, company: s.company_name || slug, gsc: s.gsc_property, username: s.username,
      }));
      return json(res, sites);
    }

    // Single site routes: /api/sites/:slug/...
    const siteMatch = pathname.match(/^\/api\/sites\/([^/]+)(?:\/(.+))?$/);
    if (siteMatch) {
      const slug   = siteMatch[1];
      const action = siteMatch[2] || 'status';

      if (!cfg.sites[slug]) return json(res, { error: 'Site saknas' }, 404);

      try {
        if (action === 'status')  return json(res, await getSiteStatus(slug));
        if (action === 'stats')   return json(res, await getSiteStats(slug));
        if (action === 'recent')  return json(res, await getRecentContent(slug));
        if (action === 'seo')     return json(res, await getSeoScore(slug));
        if (action === 'plugins') return json(res, (await getSiteStats(slug))?.plugins || []);

        // Proxy raw WP endpoint: /api/sites/:slug/wp/...
        if (action.startsWith('wp/')) {
          const site = cfg.sites[slug];
          const r = await wpFetch(site, action, { params: parsed.query });
          return json(res, { data: r.data, total: r.total });
        }
      } catch (e) {
        return json(res, { error: e.message }, 500);
      }
    }

    return json(res, { error: 'Okänt API-anrop' }, 404);
  }

  // ── Static files ─────────────────────────────────────────────
  if (pathname === '/' || pathname === '/index.html') {
    return serveStatic(res, path.join(DASH_DIR, 'index.html'));
  }

  const filePath = path.join(DASH_DIR, pathname.replace(/^\//, ''));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveStatic(res, filePath);
  }

  res.writeHead(404); res.end('Not found');
});

server.listen(PORT, () => {
  console.log(`\nPerispa Agency Dashboard`);
  console.log(`  URL:   http://localhost:${PORT}`);
  console.log(`  Sites: ${Object.keys(cfg.sites).join(', ')}`);
  console.log('');
});
