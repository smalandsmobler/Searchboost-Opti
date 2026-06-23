#!/usr/bin/env node
/**
 * fortnox-mcp — Searchboost ekonomi-MCP
 *
 * Verktyg:
 *   Fortnox:      fakturor, kunder, leverantörsfakturor, vouchers, finansiell sammanfattning
 *   Google Sheets: läs/skriv KPI-sheetet (1v1-3uXykfp4M4RNk9ag3NWpzQ0ZMyeXVgHCL9-HtaM4)
 *   BigQuery:     GSC + analytics (valfritt, delar SA med perispa)
 *
 * Start: node server.js
 * Setup: node setup.js
 */

const { McpServer }          = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z }    = require('zod');
const https    = require('https');
const http     = require('http');
const fs       = require('fs');
const path     = require('path');
const crypto   = require('crypto');

// ── Config ────────────────────────────────────────────────────────
const CFG_PATH = path.join(__dirname, 'config.json');
function loadConfig() {
  if (!fs.existsSync(CFG_PATH)) {
    throw new Error('Ingen config.json. Kör: node setup.js');
  }
  return JSON.parse(fs.readFileSync(CFG_PATH, 'utf-8'));
}
const cfg = loadConfig();

// ── Fortnox REST client ───────────────────────────────────────────
const FX_BASE = 'https://api.fortnox.se/3';

function fxFetch(endpoint, opts = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(`${FX_BASE}/${endpoint}`);
    if (opts.params) {
      for (const [k, v] of Object.entries(opts.params)) {
        if (v != null) u.searchParams.set(k, String(v));
      }
    }
    const body    = opts.body ? JSON.stringify(opts.body) : undefined;
    const headers = {
      Authorization:  `Bearer ${cfg.fortnox.access_token}`,
      Accept:         'application/json',
      'Content-Type': 'application/json',
      ...opts.headers,
    };
    if (body) headers['Content-Length'] = Buffer.byteLength(body);

    const req = https.request(u, { method: opts.method || 'GET', headers, timeout: 20000 }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            const msg = json?.ErrorInformation?.message || json?.message || data.slice(0, 200);
            reject(new Error(`Fortnox ${res.statusCode}: ${msg}`));
          } else {
            resolve(json);
          }
        } catch {
          reject(new Error(`Ogiltigt JSON från Fortnox: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Fortnox timeout')); });
    if (body) req.write(body);
    req.end();
  });
}

// ── Google Sheets API client (via service account JWT) ────────────
let _sheetsToken = null;
let _sheetsTokenExpiry = 0;

function loadSA() {
  const saPath = cfg.sheets?.service_account_path || path.join(__dirname, '..', 'perispa', 'bq-credentials.json');
  if (!fs.existsSync(saPath)) return null;
  return JSON.parse(fs.readFileSync(saPath, 'utf-8'));
}

async function getSheetsToken() {
  if (_sheetsToken && Date.now() < _sheetsTokenExpiry) return _sheetsToken;
  const sa = loadSA();
  if (!sa) throw new Error('Service account saknas. Lägg bq-credentials.json i perispa/ eller ange path i config.json');

  const now  = Math.floor(Date.now() / 1000);
  const head = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const pay  = Buffer.from(JSON.stringify({
    iss:   sa.client_email,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud:   'https://oauth2.googleapis.com/token',
    iat:   now,
    exp:   now + 3600,
  })).toString('base64url');
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(`${head}.${pay}`);
  const sig = sign.sign(sa.private_key, 'base64url');
  const jwt = `${head}.${pay}.${sig}`;

  const token = await new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req  = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        const j = JSON.parse(d);
        if (j.error) reject(new Error(`Token-fel: ${j.error_description}`));
        else resolve(j.access_token);
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  _sheetsToken       = token;
  _sheetsTokenExpiry = Date.now() + 3500 * 1000;
  return token;
}

const SHEET_ID = cfg.sheets?.sheet_id || '1v1-3uXykfp4M4RNk9ag3NWpzQ0ZMyeXVgHCL9-HtaM4';

async function sheetsGet(range) {
  const token = await getSheetsToken();
  return new Promise((resolve, reject) => {
    const u = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}`;
    https.get(u, { headers: { Authorization: `Bearer ${token}` } }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function sheetsUpdate(range, values) {
  const token = await getSheetsToken();
  const body  = JSON.stringify({ range, majorDimension: 'ROWS', values });
  return new Promise((resolve, reject) => {
    const u = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`;
    const req = https.request(u, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Helpers ───────────────────────────────────────────────────────
function txt(o)   { return { content: [{ type: 'text', text: typeof o === 'string' ? o : JSON.stringify(o, null, 2) }] }; }
function err(msg) { return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true }; }

// ── MCP Server ────────────────────────────────────────────────────
const server = new McpServer({ name: 'fortnox-mcp', version: '1.0.0' });

// ═══════════════════════════════════════════════════════════════
//  FORTNOX TOOLS
// ═══════════════════════════════════════════════════════════════

// Fakturor — lista
server.tool('fortnox_invoices', 'Lista fakturor från Fortnox med filter', {
  status:       z.enum(['all','unpaid','paid','overdue','cancelled']).optional().default('all'),
  customer_nr:  z.string().optional(),
  from_date:    z.string().optional().describe('YYYY-MM-DD'),
  to_date:      z.string().optional().describe('YYYY-MM-DD'),
  limit:        z.number().optional().default(50),
}, async (args) => {
  try {
    const params = { limit: args.limit, sortby: 'invoicedate', sortorder: 'descend' };
    if (args.customer_nr) params.customernumber = args.customer_nr;
    if (args.from_date)   params.fromdate = args.from_date;
    if (args.to_date)     params.todate   = args.to_date;
    if (args.status === 'unpaid')   params.filter = 'unpaid';
    if (args.status === 'paid')     params.filter = 'fullypaid';
    if (args.status === 'overdue')  params.filter = 'overdue';
    if (args.status === 'cancelled') params.filter = 'cancelled';

    const r = await fxFetch('invoices', { params });
    const invoices = (r.Invoices || []).map(i => ({
      nr:           i.DocumentNumber,
      customer:     i.CustomerName,
      customer_nr:  i.CustomerNumber,
      date:         i.InvoiceDate,
      due:          i.DueDate,
      total_ex_vat: i.Net,
      total_inc_vat: i.Total,
      vat:          i.VAT,
      balance:      i.Balance,
      currency:     i.Currency,
      status:       i.Balance > 0 ? (new Date(i.DueDate) < new Date() ? 'Förfallen' : 'Obetald') : 'Betald',
    }));
    const totalNet = invoices.reduce((s, i) => s + i.total_ex_vat, 0);
    const totalPaid = invoices.filter(i => i.status === 'Betald').reduce((s, i) => s + i.total_inc_vat, 0);
    return txt({ count: invoices.length, total_net: totalNet, total_paid_inc_vat: totalPaid, invoices });
  } catch (e) { return err(e.message); }
});

// Faktura — detalj
server.tool('fortnox_invoice', 'Hämta en specifik faktura', {
  invoice_nr: z.string(),
}, async (args) => {
  try {
    const r = await fxFetch(`invoices/${args.invoice_nr}`);
    return txt(r.Invoice);
  } catch (e) { return err(e.message); }
});

// Skapa faktura
server.tool('fortnox_create_invoice', 'Skapa ny faktura i Fortnox', {
  customer_nr: z.string(),
  rows:        z.array(z.object({
    description: z.string(),
    price:       z.number(),
    quantity:    z.number().default(1),
    account_nr:  z.string().optional().default('3001'),
    vat_pct:     z.number().optional().default(25),
  })),
  invoice_date: z.string().optional().describe('YYYY-MM-DD, default idag'),
  due_days:     z.number().optional().default(20),
  our_ref:      z.string().optional(),
}, async (args) => {
  try {
    const today    = args.invoice_date || new Date().toISOString().slice(0, 10);
    const due      = new Date(today);
    due.setDate(due.getDate() + args.due_days);
    const dueStr   = due.toISOString().slice(0, 10);

    const body = {
      Invoice: {
        CustomerNumber: args.customer_nr,
        InvoiceDate:    today,
        DueDate:        dueStr,
        OurReference:   args.our_ref || 'Mikael Larsson',
        InvoiceRows:    args.rows.map(r => ({
          Description:   r.description,
          Price:         r.price,
          DeliveredQuantity: r.quantity,
          AccountNumber: r.account_nr,
          VAT:           r.vat_pct,
        })),
      }
    };
    const result = await fxFetch('invoices', { method: 'POST', body });
    return txt({ created: true, invoice_nr: result.Invoice?.DocumentNumber, total: result.Invoice?.Total });
  } catch (e) { return err(e.message); }
});

// Kunder
server.tool('fortnox_customers', 'Lista kunder i Fortnox', {
  search: z.string().optional(),
}, async (args) => {
  try {
    const params = {};
    if (args.search) params.name = args.search;
    const r = await fxFetch('customers', { params });
    const customers = (r.Customers || []).map(c => ({
      nr:      c.CustomerNumber,
      name:    c.Name,
      email:   c.Email,
      org_nr:  c.OrganisationNumber,
      city:    c.City,
    }));
    return txt(customers);
  } catch (e) { return err(e.message); }
});

// Leverantörsfakturor (kostnader)
server.tool('fortnox_supplier_invoices', 'Hämta leverantörsfakturor / kostnader', {
  from_date: z.string().optional(),
  to_date:   z.string().optional(),
  status:    z.enum(['all','unpaid','paid']).optional().default('all'),
  limit:     z.number().optional().default(30),
}, async (args) => {
  try {
    const params = { limit: args.limit, sortorder: 'descend' };
    if (args.from_date) params.fromdate = args.from_date;
    if (args.to_date)   params.todate   = args.to_date;
    if (args.status === 'unpaid') params.filter = 'unpaid';
    if (args.status === 'paid')   params.filter = 'fullypaid';

    const r = await fxFetch('supplierinvoices', { params });
    const inv = (r.SupplierInvoices || []).map(i => ({
      nr:       i.GivenNumber,
      supplier: i.SupplierName,
      date:     i.InvoiceDate,
      due:      i.DueDate,
      total:    i.Total,
      balance:  i.Balance,
      status:   i.Balance > 0 ? 'Obetald' : 'Betald',
    }));
    const totalCost = inv.reduce((s, i) => s + i.total, 0);
    return txt({ count: inv.length, total_cost: totalCost, invoices: inv });
  } catch (e) { return err(e.message); }
});

// Finansiell sammanfattning
server.tool('fortnox_financials', 'Finansiell månadssammanfattning — intäkter, kostnader, MRR', {
  year:  z.number().optional().default(new Date().getFullYear()),
  month: z.number().optional().default(new Date().getMonth() + 1),
}, async (args) => {
  try {
    const m     = String(args.month).padStart(2, '0');
    const from  = `${args.year}-${m}-01`;
    const lastDay = new Date(args.year, args.month, 0).getDate();
    const to    = `${args.year}-${m}-${lastDay}`;

    const [invRes, supRes] = await Promise.allSettled([
      fxFetch('invoices', { params: { fromdate: from, todate: to, filter: 'fullypaid', limit: 200 } }),
      fxFetch('supplierinvoices', { params: { fromdate: from, todate: to, limit: 100 } }),
    ]);

    const invoices     = invRes.status === 'fulfilled' ? (invRes.value.Invoices || []) : [];
    const suppliers    = supRes.status === 'fulfilled' ? (supRes.value.SupplierInvoices || []) : [];
    const totalRevenue = invoices.reduce((s, i) => s + (i.Net || 0), 0);
    const totalCosts   = suppliers.reduce((s, i) => s + (i.Total || 0), 0);
    const ebit         = totalRevenue - totalCosts;

    return txt({
      period:         `${args.year}-${m}`,
      revenue_ex_vat: Math.round(totalRevenue),
      costs:          Math.round(totalCosts),
      ebit:           Math.round(ebit),
      margin_pct:     totalRevenue > 0 ? Math.round((ebit / totalRevenue) * 100) : 0,
      invoice_count:  invoices.length,
      top_customers:  invoices
        .reduce((acc, i) => {
          const ex = acc.find(x => x.name === i.CustomerName);
          if (ex) ex.amount += i.Net;
          else acc.push({ name: i.CustomerName, amount: i.Net });
          return acc;
        }, [])
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5),
    });
  } catch (e) { return err(e.message); }
});

// Utestående fordringar
server.tool('fortnox_outstanding', 'Visa alla utestående fakturor + förfallna', {}, async () => {
  try {
    const [unpaid, overdue] = await Promise.all([
      fxFetch('invoices', { params: { filter: 'unpaid', limit: 100 } }),
      fxFetch('invoices', { params: { filter: 'overdue', limit: 100 } }),
    ]);
    const fmt = (arr, tag) => (arr || []).map(i => ({
      nr: i.DocumentNumber, customer: i.CustomerName,
      due: i.DueDate, balance: i.Balance, tag,
    }));
    const all   = [...fmt(unpaid.Invoices, 'obetald'), ...fmt(overdue.Invoices, 'FÖRFALLEN')];
    const total = all.reduce((s, i) => s + i.balance, 0);
    return txt({ total_outstanding: total, count: all.length, invoices: all });
  } catch (e) { return err(e.message); }
});

// ═══════════════════════════════════════════════════════════════
//  GOOGLE SHEETS TOOLS
// ═══════════════════════════════════════════════════════════════

server.tool('sheets_read', 'Läs data från Searchboost KPI-sheetet', {
  range: z.string().describe('T.ex. "MRR!A1:F20" eller "Fakturor!A:H"'),
}, async (args) => {
  try {
    const r = await sheetsGet(args.range);
    return txt({ range: r.range, rows: r.values?.length || 0, data: r.values });
  } catch (e) { return err(e.message); }
});

server.tool('sheets_write', 'Skriv data till Searchboost KPI-sheetet', {
  range:  z.string().describe('T.ex. "MRR!B2:D2"'),
  values: z.array(z.array(z.any())).describe('2D-array med värden'),
}, async (args) => {
  try {
    const r = await sheetsUpdate(args.range, args.values);
    return txt({ updated: r.updatedCells, range: r.updatedRange });
  } catch (e) { return err(e.message); }
});

server.tool('sheets_sync_fortnox', 'Synka Fortnox-fakturor till KPI-sheetet automatiskt', {
  year:  z.number().optional().default(new Date().getFullYear()),
  month: z.number().optional().default(new Date().getMonth() + 1),
}, async (args) => {
  try {
    const m    = String(args.month).padStart(2, '0');
    const from = `${args.year}-${m}-01`;
    const to   = `${args.year}-${m}-${new Date(args.year, args.month, 0).getDate()}`;

    // Hämta betalda fakturor denna månad
    const r = await fxFetch('invoices', { params: { fromdate: from, todate: to, filter: 'fullypaid', limit: 200 } });
    const invoices = r.Invoices || [];
    const totalNet = invoices.reduce((s, i) => s + (i.Net || 0), 0);
    const count    = invoices.length;
    const avgNet   = count > 0 ? Math.round(totalNet / count) : 0;

    // Skriv till MRR-fliken (rad för denna månad)
    const monthNames = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
    const monthName  = monthNames[args.month - 1];

    // Hitta rätt rad i sheetet
    const sheetData = await sheetsGet('MRR!A:A');
    const rows      = sheetData.values || [];
    const rowIndex  = rows.findIndex(r => r[0]?.toLowerCase() === monthName.toLowerCase());

    if (rowIndex === -1) {
      return txt({ ok: false, message: `Hittade inte månadsrad för ${monthName} i sheetet` });
    }

    const sheetRow = rowIndex + 1; // 1-indexerat
    await sheetsUpdate(`MRR!B${sheetRow}:D${sheetRow}`, [[
      `${totalNet} kr`,
      count,
      avgNet,
    ]]);

    return txt({
      ok:          true,
      month:       monthName,
      total_net:   totalNet,
      invoices:    count,
      avg:         avgNet,
      sheet_row:   sheetRow,
      message:     `Uppdaterade rad ${sheetRow} (${monthName}) i KPI-sheetet`,
    });
  } catch (e) { return err(e.message); }
});

server.tool('sheets_kpi_overview', 'Läs hela KPI-dashboarden och returnera en sammanfattning', {}, async () => {
  try {
    const [mrr, pipe, costs] = await Promise.allSettled([
      sheetsGet('MRR!A1:F13'),
      sheetsGet('Pipeline!A1:I10'),
      sheetsGet('PL!A1:D30'),
    ]);

    return txt({
      mrr:      mrr.status      === 'fulfilled' ? mrr.value.values      : 'Kunde inte läsa',
      pipeline: pipe.status     === 'fulfilled' ? pipe.value.values     : 'Kunde inte läsa',
      costs:    costs.status    === 'fulfilled' ? costs.value.values    : 'Kunde inte läsa',
    });
  } catch (e) { return err(e.message); }
});

// ═══════════════════════════════════════════════════════════════
//  BIGQUERY / GSC TOOLS (delar SA med perispa)
// ═══════════════════════════════════════════════════════════════

let _bqToken = null;
let _bqTokenExpiry = 0;

async function getBqToken() {
  if (_bqToken && Date.now() < _bqTokenExpiry) return _bqToken;
  const saPath = path.join(__dirname, '..', 'perispa', 'bq-credentials.json');
  if (!fs.existsSync(saPath)) throw new Error('bq-credentials.json saknas i perispa/');
  const sa  = JSON.parse(fs.readFileSync(saPath, 'utf-8'));
  const now = Math.floor(Date.now() / 1000);
  const h   = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
  const p   = Buffer.from(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/bigquery',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600,
  })).toString('base64url');
  const s   = crypto.createSign('RSA-SHA256');
  s.update(`${h}.${p}`);
  const jwt = `${h}.${p}.${s.sign(sa.private_key, 'base64url')}`;

  const token = await new Promise((resolve, reject) => {
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req  = https.request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { const j = JSON.parse(d); if (j.error) reject(new Error(j.error_description)); else resolve(j.access_token); });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  _bqToken = token; _bqTokenExpiry = Date.now() + 3500 * 1000;
  return token;
}

async function bqQuery(sql) {
  const token   = await getBqToken();
  const project = cfg.bq?.project || 'searchboost-485810';
  const body    = JSON.stringify({ query: sql, useLegacySql: false, timeoutMs: 30000 });
  return new Promise((resolve, reject) => {
    const req = https.request(
      `https://bigquery.googleapis.com/bigquery/v2/projects/${project}/queries`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) } },
      (res) => {
        let d = '';
        res.on('data', c => d += c);
        res.on('end', () => {
          const j = JSON.parse(d);
          if (j.error) reject(new Error(j.error.message));
          else {
            const cols = (j.schema?.fields || []).map(f => f.name);
            const rows = (j.rows || []).map(r => Object.fromEntries(cols.map((c, i) => [c, r.f[i]?.v])));
            resolve({ cols, rows, total: parseInt(j.totalRows || '0') });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

server.tool('bq_gsc_summary', 'GSC-sammanfattning per kund (klick, impressions, snittposition) senaste N dagar', {
  customer_id: z.string().optional().describe('Lämna tomt för alla kunder'),
  days:        z.number().optional().default(30),
  limit:       z.number().optional().default(20),
}, async (args) => {
  try {
    const where = args.customer_id ? `WHERE customer_id = '${args.customer_id}'` : '';
    const sql = `
      SELECT customer_id,
             SUM(clicks) AS clicks,
             SUM(impressions) AS impressions,
             ROUND(AVG(position), 1) AS avg_position,
             COUNT(DISTINCT query) AS unique_queries
      FROM \`searchboost-485810.seo_data.gsc_daily_metrics\`
      WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${args.days} DAY)
      ${where ? 'AND ' + where.replace('WHERE ', '') : ''}
      GROUP BY customer_id
      ORDER BY clicks DESC
      LIMIT ${args.limit}`;
    const r = await bqQuery(sql);
    return txt(r);
  } catch (e) { return err(e.message); }
});

server.tool('bq_mrr_vs_gsc', 'Korrelera MRR-kunder med GSC-prestanda', {
  days: z.number().optional().default(30),
}, async (args) => {
  try {
    const sql = `
      SELECT customer_id,
             SUM(clicks) AS clicks,
             SUM(impressions) AS impressions,
             ROUND(AVG(position), 1) AS avg_pos,
             COUNT(DISTINCT query) AS queries
      FROM \`searchboost-485810.seo_data.gsc_daily_metrics\`
      WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${args.days} DAY)
      GROUP BY customer_id ORDER BY clicks DESC`;
    const r = await bqQuery(sql);
    return txt({ days: args.days, data: r.rows });
  } catch (e) { return err(e.message); }
});

server.tool('bq_query', 'Kör ett raw BigQuery SQL-query mot seo_data', {
  sql: z.string(),
}, async (args) => {
  try {
    const r = await bqQuery(args.sql);
    return txt(r);
  } catch (e) { return err(e.message); }
});

// ── Starta servern ────────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('fortnox-mcp startad\n');
}

main().catch(e => { process.stderr.write(`Fel: ${e.message}\n`); process.exit(1); });
