/**
 * perispa — Google Search Console tools (via BigQuery)
 * perispa_gsc_top_queries, perispa_gsc_top_pages, perispa_gsc_query_trend
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
        try { resolve(JSON.parse(buf)); } catch { reject(new Error('Invalid JSON fran BQ: ' + buf.slice(0, 300))); }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

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
          else reject(new Error('Kunde inte hamta BQ-token: ' + buf.slice(0, 300)));
        } catch { reject(new Error('Invalid token response')); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Cache token i minnet (giltig ~1h)
let cachedToken = null;
let cachedTokenExpiry = 0;

async function getToken(credentials) {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry) return cachedToken;
  cachedToken = await getBQToken(credentials);
  cachedTokenExpiry = now + 3500 * 1000; // 3500s marginal
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
      // Konvertera numeriska varden
      if (val !== null && val !== undefined && !isNaN(val) && val !== '') {
        obj[fields[i]] = Number(val);
      } else {
        obj[fields[i]] = val;
      }
    });
    return obj;
  });
}

const BQ_MISSING_MSG = 'BigQuery-credentials saknas. Konfigu:r\n1. Kor: node setup.js --from-ssm\n2. Eller: lagg filen bq-credentials.json i perispa/\n   (service account JSON med BigQuery-behorighet)';

module.exports = function registerGscTools(server, getSite, wpFetch) {

  // --- Top queries ---
  server.tool('perispa_gsc_top_queries', 'Hamta topp-sokord fran GSC (via BigQuery gsc_daily_metrics)', {
    site: z.string().optional().describe('customer_id / site-slug'),
    days: z.number().optional().default(30).describe('Antal dagar tillbaka'),
    limit: z.number().optional().default(20).describe('Max antal resultat'),
  }, async (args) => {
    try {
      const credentials = loadBQCredentials();
      if (!credentials) return err(BQ_MISSING_MSG);

      const s = getSite(args.site);
      const customerId = s.id || s.slug || args.site || 'unknown';
      const sql = `SELECT query, SUM(clicks) as clicks, SUM(impressions) as impressions, ROUND(AVG(position), 1) as avg_position FROM \`searchboost-485810.seo_data.gsc_daily_metrics\` WHERE customer_id = '${customerId.replace(/'/g, "\\'")}' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${parseInt(args.days)} DAY) GROUP BY query ORDER BY clicks DESC LIMIT ${parseInt(args.limit)}`;

      const result = await queryBQ(credentials, sql);
      const rows = bqRowsToObjects(result);

      return text({
        customer_id: customerId,
        period_days: args.days,
        total_queries: rows.length,
        queries: rows,
      });
    } catch (e) { return err(e.message); }
  });

  // --- Top pages ---
  server.tool('perispa_gsc_top_pages', 'Hamta topp-sidor per trafik fran GSC (via BigQuery)', {
    site: z.string().optional().describe('customer_id / site-slug'),
    days: z.number().optional().default(30).describe('Antal dagar tillbaka'),
    limit: z.number().optional().default(20).describe('Max antal resultat'),
  }, async (args) => {
    try {
      const credentials = loadBQCredentials();
      if (!credentials) return err(BQ_MISSING_MSG);

      const s = getSite(args.site);
      const customerId = s.id || s.slug || args.site || 'unknown';
      const sql = `SELECT page, SUM(clicks) as clicks, SUM(impressions) as impressions, ROUND(AVG(position), 1) as avg_position FROM \`searchboost-485810.seo_data.gsc_daily_metrics\` WHERE customer_id = '${customerId.replace(/'/g, "\\'")}' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${parseInt(args.days)} DAY) GROUP BY page ORDER BY clicks DESC LIMIT ${parseInt(args.limit)}`;

      const result = await queryBQ(credentials, sql);
      const rows = bqRowsToObjects(result);

      return text({
        customer_id: customerId,
        period_days: args.days,
        total_pages: rows.length,
        pages: rows,
      });
    } catch (e) { return err(e.message); }
  });

  // --- Query trend ---
  server.tool('perispa_gsc_query_trend', 'Trend for ett specifikt sokord over tid fran GSC', {
    site: z.string().optional().describe('customer_id / site-slug'),
    query: z.string().describe('Sokordet att analysera'),
    days: z.number().optional().default(90).describe('Antal dagar tillbaka'),
  }, async (args) => {
    try {
      const credentials = loadBQCredentials();
      if (!credentials) return err(BQ_MISSING_MSG);

      const s = getSite(args.site);
      const customerId = s.id || s.slug || args.site || 'unknown';
      const sql = `SELECT date, clicks, impressions, position FROM \`searchboost-485810.seo_data.gsc_daily_metrics\` WHERE customer_id = '${customerId.replace(/'/g, "\\'")}' AND query = '${args.query.replace(/'/g, "\\'")}' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${parseInt(args.days)} DAY) ORDER BY date`;

      const result = await queryBQ(credentials, sql);
      const rows = bqRowsToObjects(result);

      // Sammanfattning
      const totalClicks = rows.reduce((s, r) => s + (r.clicks || 0), 0);
      const totalImpressions = rows.reduce((s, r) => s + (r.impressions || 0), 0);
      const avgPosition = rows.length > 0 ? Math.round(rows.reduce((s, r) => s + (r.position || 0), 0) / rows.length * 10) / 10 : null;

      return text({
        customer_id: customerId,
        query: args.query,
        period_days: args.days,
        data_points: rows.length,
        summary: { total_clicks: totalClicks, total_impressions: totalImpressions, avg_position: avgPosition },
        trend: rows,
      });
    } catch (e) { return err(e.message); }
  });

};
