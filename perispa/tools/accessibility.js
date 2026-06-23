/**
 * perispa — Accessibility tools (v2)
 * Uppgraderad med axe-core, scan-historik, list/get scans
 * Baserat på Respira 6.8.1 accessibility-modul
 */

const { z } = require('zod');
const { JSDOM } = require('jsdom');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// axe-core source för injektion i JSDOM
const AXE_SOURCE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf-8');
const AXE_VERSION = require('axe-core/package.json').version;

// Scan-historik lagras lokalt per site
const SCANS_DIR = path.join(__dirname, '..', 'snapshots', 'accessibility');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

// Auto-fixable regler (axe-core rule ID -> fix-typ)
const AUTO_FIXABLE_RULES = {
  'image-alt': 'fix_image_alt',
  'color-contrast': 'fix_color_contrast',
  'label': 'fix_form_label',
  'heading-order': 'fix_heading_order',
  'frame-title': 'fix_iframe_title',
};

// --- Scan Storage ---
function ensureScansDir(siteName) {
  const dir = path.join(SCANS_DIR, siteName || '_default');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function saveScan(siteName, scan) {
  const dir = ensureScansDir(siteName);
  const file = path.join(dir, `${scan.id}.json`);
  fs.writeFileSync(file, JSON.stringify(scan, null, 2));

  // Behåll index (max 100 senaste)
  const indexFile = path.join(dir, '_index.json');
  let index = [];
  if (fs.existsSync(indexFile)) {
    try { index = JSON.parse(fs.readFileSync(indexFile, 'utf-8')); } catch {}
  }
  index.push({ id: scan.id, url: scan.url, score: scan.score, scanned_at: scan.scanned_at, page_id: scan.page_id || null });
  if (index.length > 100) index = index.slice(-100);
  fs.writeFileSync(indexFile, JSON.stringify(index, null, 2));
}

function loadScanIndex(siteName) {
  const indexFile = path.join(ensureScansDir(siteName), '_index.json');
  if (!fs.existsSync(indexFile)) return [];
  try { return JSON.parse(fs.readFileSync(indexFile, 'utf-8')); } catch { return []; }
}

function loadScan(siteName, scanId) {
  const file = path.join(ensureScansDir(siteName), `${scanId}.json`);
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf-8')); } catch { return null; }
}

// --- Fetch page HTML ---
async function fetchPageHtml(site, pageId, type, wpFetch) {
  const endpoint = type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
  const res = await wpFetch(site, `${endpoint}/${pageId}`, { params: { context: 'edit' } });
  return {
    raw: res.data.content?.raw || res.data.content?.rendered || '',
    rendered: res.data.content?.rendered || '',
    link: res.data.link || '',
    title: res.data.title?.rendered || '',
  };
}

// --- Fetch live page HTML (full rendered DOM) ---
async function fetchLiveHtml(url) {
  const https = require('https');
  const http = require('http');
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { rejectUnauthorized: false, timeout: 30000, headers: { 'User-Agent': 'PerispaAccessibilityScanner/2.0' } }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// --- Run axe-core scan (injiceras i JSDOM-kontext) ---
async function runAxeScan(html, url, level = 'AA') {
  const dom = new JSDOM(html, { url, pretendToBeVisual: true, runScripts: 'dangerously' });

  // Injicera axe-core i JSDOM window
  dom.window.eval(AXE_SOURCE);

  const tagMap = {
    'A': ['wcag2a', 'wcag21a'],
    'AA': ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    'AAA': ['wcag2a', 'wcag2aa', 'wcag2aaa', 'wcag21a', 'wcag21aa'],
  };

  const results = await dom.window.axe.run(dom.window.document, {
    runOnly: { type: 'tag', values: tagMap[level] || tagMap['AA'] },
  });

  dom.window.close();
  return results;
}

// --- Beräkna score ---
function calculateScore(violations) {
  let total = 0;
  const severityWeight = { critical: 10, serious: 5, moderate: 3, minor: 1 };
  for (const v of violations) {
    const weight = severityWeight[v.impact] || 2;
    const nodeCount = (v.nodes || []).length || 1;
    total += weight * nodeCount;
  }
  return Math.max(0, Math.round(100 - total * 2.5));
}

// --- Map violations till Respira-kompatibelt format ---
function mapViolations(axeViolations) {
  return axeViolations.map(v => ({
    id: v.id,
    impact: v.impact,
    description: v.description,
    help: v.help,
    helpUrl: v.helpUrl,
    tags: v.tags,
    nodes: (v.nodes || []).slice(0, 50).map(n => ({
      html: n.html,
      target: n.target,
      failureSummary: n.failureSummary,
    })),
    auto_fixable: !!AUTO_FIXABLE_RULES[v.id],
  }));
}

module.exports = function registerAccessibilityTools(server, getSite, wpFetch) {

  // ─── 1. Scan Accessibility (uppgraderad med axe-core) ───
  server.tool('perispa_scan_accessibility', 'Kör en WCAG-tillgänglighetsanalys med axe-core på en sida', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    level: z.enum(['A', 'AA', 'AAA']).optional().default('AA'),
    scan_live: z.boolean().optional().default(true).describe('true = hämta renderad HTML från live-URL, false = analysera rå content'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const siteName = args.site || Object.keys(require('../config.json').sites)[0];
      const page = await fetchPageHtml(s, args.page_id, args.type, wpFetch);

      let html;
      if (args.scan_live && page.link) {
        try {
          html = await fetchLiveHtml(page.link);
        } catch {
          // Fallback till rå content
          html = `<!DOCTYPE html><html lang="sv"><head><title>${page.title}</title></head><body>${page.rendered || page.raw}</body></html>`;
        }
      } else {
        html = `<!DOCTYPE html><html lang="sv"><head><title>${page.title}</title></head><body>${page.rendered || page.raw}</body></html>`;
      }

      const axeResults = await runAxeScan(html, page.link || s.url, args.level);
      const violations = mapViolations(axeResults.violations);
      const score = calculateScore(axeResults.violations);

      const counts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
      for (const v of axeResults.violations) {
        if (counts[v.impact] !== undefined) counts[v.impact] += (v.nodes || []).length || 1;
      }
      const autoFixable = axeResults.violations.filter(v => AUTO_FIXABLE_RULES[v.id]).length;

      const scan = {
        id: crypto.randomUUID(),
        page_id: args.page_id,
        url: page.link,
        title: page.title,
        score,
        level: args.level,
        violation_count: axeResults.violations.length,
        node_count: Object.values(counts).reduce((a, b) => a + b, 0),
        critical_count: counts.critical,
        serious_count: counts.serious,
        moderate_count: counts.moderate,
        minor_count: counts.minor,
        auto_fixable: autoFixable,
        violations,
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        axe_version: AXE_VERSION,
        scanned_at: new Date().toISOString(),
      };

      saveScan(siteName, scan);

      return text({
        scan_id: scan.id,
        page_id: args.page_id,
        url: page.link,
        accessibility_score: score,
        level: args.level,
        total_violations: scan.violation_count,
        total_affected_nodes: scan.node_count,
        critical: counts.critical,
        serious: counts.serious,
        moderate: counts.moderate,
        minor: counts.minor,
        auto_fixable: autoFixable,
        passes: axeResults.passes.length,
        incomplete: axeResults.incomplete.length,
        axe_version: AXE_VERSION,
        top_issues: violations.slice(0, 10).map(v => ({
          rule: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          auto_fixable: v.auto_fixable,
        })),
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // ─── 2. List Accessibility Scans ───
  server.tool('perispa_list_accessibility_scans', 'Lista sparade tillgänglighetsscanningar', {
    site: z.string().optional(),
    page: z.number().optional().default(1),
    limit: z.number().optional().default(20),
  }, async (args) => {
    try {
      const siteName = args.site || Object.keys(require('../config.json').sites)[0];
      const index = loadScanIndex(siteName);
      const total = index.length;
      const items = index.reverse().slice((args.page - 1) * args.limit, args.page * args.limit);

      return text({
        scans: items,
        total,
        page: args.page,
        limit: args.limit,
        total_pages: Math.ceil(total / args.limit),
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // ─── 3. Get Accessibility Scan ───
  server.tool('perispa_get_accessibility_scan', 'Hämta en specifik tillgänglighetsskanning med alla detaljer', {
    site: z.string().optional(),
    scan_id: z.string(),
  }, async (args) => {
    try {
      const siteName = args.site || Object.keys(require('../config.json').sites)[0];
      const scan = loadScan(siteName, args.scan_id);
      if (!scan) return err(`Skanning ${args.scan_id} hittades inte`);
      return text(scan);
    } catch (e) {
      return err(e.message);
    }
  });

  // ─── 4. Apply Accessibility Fixes (uppgraderad) ───
  server.tool('perispa_apply_accessibility_fixes', 'Auto-fixa vanliga tillgänglighetsproblem baserat på axe-core-resultat', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    fix_types: z.array(z.string()).optional().describe('Specifika axe-core rule IDs att fixa (t.ex. image-alt, frame-title). Tomt = fixa alla'),
    dry_run: z.boolean().optional().default(false).describe('true = visa vad som skulle fixas utan att ändra'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = res.data.content?.raw || res.data.content?.rendered || '';
      const original = content;
      const applied = [];
      const skipped = [];

      // image-alt: lägg till alt="" + role="presentation" på bilder utan alt
      if (!args.fix_types?.length || args.fix_types.includes('image-alt')) {
        const before = content;
        // Bilder utan alt-attribut alls
        content = content.replace(/<img(?![^>]*\balt=)([^>]*>)/gi, '<img alt="" role="presentation"$1');
        if (content !== before) applied.push({ rule: 'image-alt', description: 'Lade till alt="" role="presentation" på bilder utan alt' });
        else skipped.push('image-alt');
      }

      // frame-title: lägg till title på iframes utan
      if (!args.fix_types?.length || args.fix_types.includes('frame-title')) {
        const before = content;
        content = content.replace(/<iframe(?![^>]*\btitle=)([^>]*>)/gi, '<iframe title="Inbäddat innehåll"$1');
        if (content !== before) applied.push({ rule: 'frame-title', description: 'Lade till title="Inbäddat innehåll" på iframes' });
        else skipped.push('frame-title');
      }

      // label: lägg till aria-label på input utan label/aria
      if (!args.fix_types?.length || args.fix_types.includes('label')) {
        const before = content;
        content = content.replace(/<input(?![^>]*(?:aria-label|aria-labelledby))(?![^>]*type="(?:hidden|submit|button)")([^>]*>)/gi, (match, rest) => {
          const typeMatch = match.match(/type="([^"]+)"/);
          const type = typeMatch ? typeMatch[1] : 'text';
          return `<input aria-label="${type} fält"${rest}`;
        });
        if (content !== before) applied.push({ rule: 'label', description: 'Lade till aria-label på formulärfält utan label' });
        else skipped.push('label');
      }

      // heading-order: kan inte auto-fixas pålitligt
      if (args.fix_types?.includes('heading-order')) {
        skipped.push('heading-order (kräver manuell granskning)');
      }

      // color-contrast: kan inte auto-fixas pålitligt
      if (args.fix_types?.includes('color-contrast')) {
        skipped.push('color-contrast (kräver manuell granskning)');
      }

      // Lazy loading bonus
      if (!args.fix_types?.length || args.fix_types.includes('lazy-loading')) {
        const before = content;
        content = content.replace(/<img(?![^>]*\bloading=)([^>]*>)/gi, '<img loading="lazy"$1');
        if (content !== before) applied.push({ rule: 'lazy-loading', description: 'Lade till loading="lazy" på bilder' });
      }

      if (applied.length === 0) {
        return text({ message: 'Inga fixar att applicera — sidan ser bra ut!', skipped });
      }

      if (args.dry_run) {
        return text({ dry_run: true, would_fix: applied, skipped });
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body: { content } });

      return text({
        fixed: true,
        page_id: args.page_id,
        fixes_applied: applied,
        skipped,
        total_fixed: applied.length,
      });
    } catch (e) {
      return err(e.message);
    }
  });
};
