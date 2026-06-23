/**
 * perispa — Content Gap Analysis tools
 * perispa_content_gaps, perispa_suggest_articles, perispa_keyword_cannibalization
 */

const { z } = require('zod');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

// --- BQ-hjalpare (delad logik med gsc.js) ---

function loadBQCredentials() {
  const localPath = path.join(__dirname, '..', 'bq-credentials.json');
  if (fs.existsSync(localPath)) return JSON.parse(fs.readFileSync(localPath, 'utf-8'));
  return null;
}

function createJWT(credentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/bigquery',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(header + '.' + payload);
  const signature = sign.sign(credentials.private_key, 'base64url');
  return header + '.' + payload + '.' + signature;
}

function httpsPost(url, body, headers) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const data = typeof body === 'string' ? body : JSON.stringify(body);
    const opts = {
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data), ...headers },
      rejectUnauthorized: false,
    };
    const req = https.request(opts, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try { resolve(JSON.parse(buf)); } catch { reject(new Error('Invalid JSON fran BQ')); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

let cachedToken = null;
let cachedTokenExpiry = 0;

async function getBQToken(credentials) {
  const jwt = createJWT(credentials);
  const body = `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${jwt}`;
  return new Promise((resolve, reject) => {
    const opts = {
      hostname: 'oauth2.googleapis.com',
      path: '/token',
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
      rejectUnauthorized: false,
    };
    const req = https.request(opts, (res) => {
      let buf = '';
      res.on('data', c => buf += c);
      res.on('end', () => {
        try {
          const data = JSON.parse(buf);
          if (data.access_token) resolve(data.access_token);
          else reject(new Error('Kunde inte hamta BQ-token'));
        } catch { reject(new Error('Invalid token response')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function getToken(credentials) {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry) return cachedToken;
  cachedToken = await getBQToken(credentials);
  cachedTokenExpiry = now + 3500 * 1000;
  return cachedToken;
}

async function queryBQ(credentials, sql) {
  const token = await getToken(credentials);
  const projectId = credentials.project_id || 'searchboost-485810';
  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`;
  const result = await httpsPost(url, { query: sql, useLegacySql: false }, { Authorization: `Bearer ${token}` });
  if (result.error) throw new Error(result.error.message || JSON.stringify(result.error));
  return result;
}

function bqRowsToObjects(result) {
  if (!result.rows || !result.schema) return [];
  const fields = result.schema.fields.map(f => f.name);
  return result.rows.map(row => {
    const obj = {};
    row.f.forEach((cell, i) => {
      const val = cell.v;
      if (val !== null && val !== undefined && !isNaN(val) && val !== '') {
        obj[fields[i]] = Number(val);
      } else {
        obj[fields[i]] = val;
      }
    });
    return obj;
  });
}

function stripTags(html) {
  return (html || '').replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function normalize(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9\u00e5\u00e4\u00f6]/g, ' ').replace(/\s+/g, ' ').trim();
}

const BQ_MISSING_MSG = 'BigQuery-credentials saknas. Konfigurera:\n1. Kor: node setup.js --from-ssm\n2. Eller: lagg filen bq-credentials.json i perispa/';

module.exports = function registerContentGapTools(server, getSite, wpFetch) {

  // --- Content Gaps ---
  server.tool('perispa_content_gaps', 'Hitta sokord dar kunden far impressions men saknar dedikerad sida', {
    site: z.string().optional().describe('customer_id / site-slug'),
    days: z.number().optional().default(30).describe('Antal dagar tillbaka'),
    min_impressions: z.number().optional().default(10).describe('Minsta antal impressions for att inkluderas'),
  }, async (args) => {
    try {
      const credentials = loadBQCredentials();
      if (!credentials) return err(BQ_MISSING_MSG);

      const s = getSite(args.site);
      const customerId = s.id || s.slug || args.site || 'unknown';

      // Steg 1: Hamta topp 100 queries fran BQ
      const sql = `SELECT query, SUM(clicks) as clicks, SUM(impressions) as impressions, ROUND(AVG(position), 1) as avg_position FROM \`searchboost-485810.seo_data.gsc_daily_metrics\` WHERE customer_id = '${customerId.replace(/'/g, "\\'")}' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${parseInt(args.days)} DAY) GROUP BY query HAVING SUM(impressions) >= ${parseInt(args.min_impressions)} ORDER BY impressions DESC LIMIT 100`;

      const bqResult = await queryBQ(credentials, sql);
      const queries = bqRowsToObjects(bqResult);

      // Steg 2: Hamta alla sidor + inlagg fran WP
      const [pagesRes, postsRes] = await Promise.all([
        wpFetch(s, 'wp/v2/pages', { params: { per_page: 100, _fields: 'id,title,slug,link' } }).catch(() => ({ data: [] })),
        wpFetch(s, 'wp/v2/posts', { params: { per_page: 100, _fields: 'id,title,slug,link' } }).catch(() => ({ data: [] })),
      ]);

      const pages = Array.isArray(pagesRes.data) ? pagesRes.data : [];
      const posts = Array.isArray(postsRes.data) ? postsRes.data : [];
      const allContent = [...pages, ...posts];

      // Bygg sokbar text per sida
      const pageTexts = allContent.map(p => {
        const title = normalize(p.title?.rendered || p.title?.raw || '');
        const slug = normalize(p.slug || '');
        return { id: p.id, title: p.title?.rendered || '', slug: p.slug, link: p.link, searchable: title + ' ' + slug };
      });

      // Steg 3: For varje query, kolla om nagon sida matchar
      const gaps = [];
      for (const q of queries) {
        const queryNorm = normalize(q.query);
        const queryWords = queryNorm.split(' ').filter(w => w.length > 2);
        const hasMatch = pageTexts.some(p => {
          // Exakt match i slug eller titel
          if (p.searchable.includes(queryNorm)) return true;
          // Alla ord i queryn finns i sidans text
          if (queryWords.length > 0 && queryWords.every(w => p.searchable.includes(w))) return true;
          return false;
        });
        if (!hasMatch) {
          gaps.push(q);
        }
      }

      // Sortera pa impressions (redan sorterat fran BQ, men saker pa det)
      gaps.sort((a, b) => (b.impressions || 0) - (a.impressions || 0));

      return text({
        customer_id: customerId,
        period_days: args.days,
        min_impressions: args.min_impressions,
        total_queries_analyzed: queries.length,
        total_pages_checked: allContent.length,
        content_gaps_found: gaps.length,
        gaps: gaps,
      });
    } catch (e) { return err(e.message); }
  });

  // --- Suggest Articles ---
  server.tool('perispa_suggest_articles', 'Foreslaa nya artiklar baserat pa content gaps (sokord utan dedikerad sida)', {
    site: z.string().optional().describe('customer_id / site-slug'),
    count: z.number().optional().default(5).describe('Antal artiklar att foreslaa'),
  }, async (args) => {
    try {
      const credentials = loadBQCredentials();
      if (!credentials) return err(BQ_MISSING_MSG);

      const s = getSite(args.site);
      const customerId = s.id || s.slug || args.site || 'unknown';

      // Hamta topp queries med impressions
      const sql = `SELECT query, SUM(clicks) as clicks, SUM(impressions) as impressions, ROUND(AVG(position), 1) as avg_position FROM \`searchboost-485810.seo_data.gsc_daily_metrics\` WHERE customer_id = '${customerId.replace(/'/g, "\\'")}' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) GROUP BY query HAVING SUM(impressions) >= 5 ORDER BY impressions DESC LIMIT 100`;

      const bqResult = await queryBQ(credentials, sql);
      const queries = bqRowsToObjects(bqResult);

      // Hamta befintligt innehall
      const [pagesRes, postsRes] = await Promise.all([
        wpFetch(s, 'wp/v2/pages', { params: { per_page: 100, _fields: 'id,title,slug' } }).catch(() => ({ data: [] })),
        wpFetch(s, 'wp/v2/posts', { params: { per_page: 100, _fields: 'id,title,slug' } }).catch(() => ({ data: [] })),
      ]);

      const pages = Array.isArray(pagesRes.data) ? pagesRes.data : [];
      const posts = Array.isArray(postsRes.data) ? postsRes.data : [];
      const allContent = [...pages, ...posts];

      const pageTexts = allContent.map(p => {
        const title = normalize(p.title?.rendered || p.title?.raw || '');
        const slug = normalize(p.slug || '');
        return title + ' ' + slug;
      });

      // Hitta gaps
      const gaps = queries.filter(q => {
        const queryNorm = normalize(q.query);
        const queryWords = queryNorm.split(' ').filter(w => w.length > 2);
        return !pageTexts.some(pt => {
          if (pt.includes(queryNorm)) return true;
          if (queryWords.length > 0 && queryWords.every(w => pt.includes(w))) return true;
          return false;
        });
      });

      // Gruppera liknande sokord och skapa artikelforslag
      const used = new Set();
      const suggestions = [];
      const maxCount = Math.min(parseInt(args.count), gaps.length);

      for (const gap of gaps) {
        if (suggestions.length >= maxCount) break;
        const queryNorm = normalize(gap.query);
        if (used.has(queryNorm)) continue;

        // Hitta relaterade sokord
        const related = gaps.filter(g => {
          const gNorm = normalize(g.query);
          if (used.has(gNorm)) return false;
          const words = queryNorm.split(' ').filter(w => w.length > 2);
          return words.some(w => gNorm.includes(w)) && gNorm !== queryNorm;
        }).slice(0, 5);

        // Markera alla relaterade som anvanda
        used.add(queryNorm);
        related.forEach(r => used.add(normalize(r.query)));

        // Skapa slug
        const slug = queryNorm.replace(/\s+/g, '-').replace(/[^a-z0-9\u00e5\u00e4\u00f6-]/g, '').slice(0, 60);

        // Samla total potential
        const totalImpressions = (gap.impressions || 0) + related.reduce((s, r) => s + (r.impressions || 0), 0);

        suggestions.push({
          title: gap.query.charAt(0).toUpperCase() + gap.query.slice(1),
          slug: slug,
          focus_keyword: gap.query,
          related_keywords: related.map(r => r.query),
          estimated_impressions: totalImpressions,
          avg_position: gap.avg_position,
          description: `Artikel om "${gap.query}" — det har sokordet genererar ${gap.impressions} impressions men saknar en dedikerad sida. Inkludera aven: ${related.map(r => r.query).join(', ') || 'inga relaterade sokord hittade'}.`,
        });
      }

      return text({
        customer_id: customerId,
        total_gaps_found: gaps.length,
        suggestions_count: suggestions.length,
        suggestions: suggestions,
      });
    } catch (e) { return err(e.message); }
  });

  // --- Keyword Cannibalization ---
  server.tool('perispa_keyword_cannibalization', 'Hitta sokord dar flera sidor konkurrerar om samma sokord', {
    site: z.string().optional().describe('customer_id / site-slug'),
    days: z.number().optional().default(30).describe('Antal dagar tillbaka'),
  }, async (args) => {
    try {
      const credentials = loadBQCredentials();
      if (!credentials) return err(BQ_MISSING_MSG);

      const s = getSite(args.site);
      const customerId = s.id || s.slug || args.site || 'unknown';

      // Hamta alla query+page-kombinationer dar samma query rankar for flera sidor
      const sql = `WITH page_queries AS ( SELECT query, page, SUM(clicks) as clicks, SUM(impressions) as impressions, ROUND(AVG(position), 1) as avg_position FROM \`searchboost-485810.seo_data.gsc_daily_metrics\` WHERE customer_id = '${customerId.replace(/'/g, "\\'")}' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${parseInt(args.days)} DAY) GROUP BY query, page HAVING SUM(impressions) >= 5 ), cannibalized AS ( SELECT query, COUNT(DISTINCT page) as page_count FROM page_queries GROUP BY query HAVING COUNT(DISTINCT page) > 1 ) SELECT pq.query, pq.page, pq.clicks, pq.impressions, pq.avg_position FROM page_queries pq INNER JOIN cannibalized c ON pq.query = c.query ORDER BY c.page_count DESC, pq.query, pq.impressions DESC`;

      const result = await queryBQ(credentials, sql);
      const rows = bqRowsToObjects(result);

      // Gruppera per query
      const grouped = {};
      for (const row of rows) {
        if (!grouped[row.query]) {
          grouped[row.query] = { query: row.query, pages: [] };
        }
        grouped[row.query].pages.push({
          page: row.page,
          clicks: row.clicks,
          impressions: row.impressions,
          avg_position: row.avg_position,
        });
      }

      const cannibalized = Object.values(grouped).sort((a, b) => b.pages.length - a.pages.length);

      return text({
        customer_id: customerId,
        period_days: args.days,
        cannibalized_queries: cannibalized.length,
        details: cannibalized,
        recommendation: cannibalized.length > 0
          ? `${cannibalized.length} sokord rankar for flera sidor. Overvaag att konsolidera innehallet eller saatta canonical-taggar for att undvika intern konkurrens.`
          : 'Inga kannibaliserade sokord hittades — bra!',
      });
    } catch (e) { return err(e.message); }
  });

};
