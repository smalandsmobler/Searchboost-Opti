/**
 * Weekly Report Lambda — Körs varje fredag 15:00 UTC (16:00 CET)
 * EventBridge: cron(0 15 ? * FRI *)
 *
 * Skickar:
 *   1. Per-kund veckologg till varje kund med utfört arbete (kundfacing ton)
 *   2. Intern sammanfattning till Mikael (alla kunder i ett mail)
 *
 * Datakällor:
 *   - BigQuery: seo_optimization_log (senaste 7 dagar)
 *   - BigQuery: seo_work_queue (köstatus)
 *   - BigQuery: customer_pipeline (aktiva kunder)
 *   - BigQuery: gsc_daily_metrics (GSC-trender, topp-sökord, positionsförändringar)
 *   - BigQuery: ads_daily_metrics (spend, ROAS per plattform)
 *   - BigQuery: social_daily_metrics (followers, engagement)
 *   - SSM: kontaktuppgifter per kund
 *   - Trello: DONE-kort (senaste 7 dagar)
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

let _transporter = null;
async function getTransporter() {
  if (_transporter) return _transporter;
  const host = await getParam('/seo-mcp/email/smtp-host');
  const user = await getParam('/seo-mcp/email/username');
  const pass = await getParam('/seo-mcp/email/password');
  _transporter = nodemailer.createTransport({
    host,
    port: 587,
    secure: false,
    auth: { user, pass },
    tls: { rejectUnauthorized: false }
  });
  return _transporter;
}

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getParamsByPath(path) {
  const params = {};
  let nextToken;
  do {
    const res = await ssm.send(new GetParametersByPathCommand({
      Path: path,
      Recursive: true,
      WithDecryption: true,
      ...(nextToken ? { NextToken: nextToken } : {})
    }));
    for (const p of (res.Parameters || [])) {
      const key = p.Name.replace(path, '').replace(/^\//, '');
      params[key] = p.Value;
    }
    nextToken = res.NextToken;
  } while (nextToken);
  return params;
}

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

/**
 * Hämta GSC-trender, ads-ROAS och social-engagement för en kund
 * Jämför denna vecka (dag 0-6) med föregående vecka (dag 7-13)
 */
async function getCustomerMetrics(bq, dataset, customerId) {
  const metrics = {
    gsc: null,
    ads: null,
    social: null
  };

  // ── GSC-trender ──
  try {
    const [gscRows] = await bq.query({
      query: `
        SELECT
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN clicks ELSE 0 END) AS clicks_this_week,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN clicks ELSE 0 END) AS clicks_prev_week,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN impressions ELSE 0 END) AS impressions_this_week,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN impressions ELSE 0 END) AS impressions_prev_week,
          AVG(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN position END) AS avg_position_this_week,
          AVG(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN position END) AS avg_position_prev_week
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    // Topp 5 sökord denna vecka (mest klick)
    const [topKeywords] = await bq.query({
      query: `
        SELECT
          query,
          SUM(clicks) AS clicks,
          SUM(impressions) AS impressions,
          AVG(position) AS avg_position
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
          AND query IS NOT NULL AND query != ''
        GROUP BY query
        ORDER BY clicks DESC
        LIMIT 5
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    // Sökord som klättrat mest (förbättrad position denna vecka vs förra)
    const [risingKeywords] = await bq.query({
      query: `
        SELECT
          q.query,
          ROUND(prev.avg_pos - q.avg_pos, 1) AS position_gain,
          ROUND(q.avg_pos, 1) AS current_position,
          q.clicks AS clicks_this_week
        FROM (
          SELECT query, AVG(position) AS avg_pos, SUM(clicks) AS clicks
          FROM \`${dataset}.gsc_daily_metrics\`
          WHERE customer_id = @cid
            AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            AND query IS NOT NULL AND query != ''
          GROUP BY query
          HAVING SUM(impressions) >= 10
        ) q
        JOIN (
          SELECT query, AVG(position) AS avg_pos
          FROM \`${dataset}.gsc_daily_metrics\`
          WHERE customer_id = @cid
            AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
            AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            AND query IS NOT NULL AND query != ''
          GROUP BY query
        ) prev ON q.query = prev.query
        WHERE prev.avg_pos - q.avg_pos >= 1
        ORDER BY position_gain DESC
        LIMIT 3
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    if ((gscRows || []).length > 0) {
      const r = gscRows[0];
      const clicksDiff = (r.clicks_this_week || 0) - (r.clicks_prev_week || 0);
      const impDiff = (r.impressions_this_week || 0) - (r.impressions_prev_week || 0);
      const posChange = (r.avg_position_prev_week || 0) - (r.avg_position_this_week || 0); // positiv = bättre
      metrics.gsc = {
        clicks_this_week: Number(r.clicks_this_week) || 0,
        clicks_prev_week: Number(r.clicks_prev_week) || 0,
        clicks_diff: clicksDiff,
        clicks_pct: r.clicks_prev_week > 0 ? Math.round((clicksDiff / r.clicks_prev_week) * 100) : null,
        impressions_this_week: Number(r.impressions_this_week) || 0,
        impressions_prev_week: Number(r.impressions_prev_week) || 0,
        impressions_diff: impDiff,
        avg_position: r.avg_position_this_week ? Number(r.avg_position_this_week).toFixed(1) : null,
        position_change: posChange ? Number(posChange).toFixed(1) : null,
        top_keywords: (topKeywords || []).map(k => ({
          query: k.query,
          clicks: Number(k.clicks),
          impressions: Number(k.impressions),
          position: Number(k.avg_position).toFixed(1)
        })),
        rising_keywords: (risingKeywords || []).map(k => ({
          query: k.query,
          gain: Number(k.position_gain).toFixed(1),
          position: Number(k.current_position).toFixed(1)
        }))
      };
    }
  } catch (e) {
    console.log(`GSC metrics error for ${customerId}: ${e.message}`);
  }

  // ── Ads-data (spend + ROAS) ──
  try {
    const [adsRows] = await bq.query({
      query: `
        SELECT
          platform,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN spend ELSE 0 END) AS spend_this_week,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN spend ELSE 0 END) AS spend_prev_week,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN conversions ELSE 0 END) AS conversions_this_week,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN conversion_value ELSE 0 END) AS conv_value_this_week,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN clicks ELSE 0 END) AS clicks_this_week,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN impressions ELSE 0 END) AS impressions_this_week
        FROM \`${dataset}.ads_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
        GROUP BY platform
        HAVING spend_this_week > 0 OR spend_prev_week > 0
        ORDER BY spend_this_week DESC
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    if ((adsRows || []).length > 0) {
      const platforms = (adsRows || []).map(r => {
        const spend = Number(r.spend_this_week) || 0;
        const convValue = Number(r.conv_value_this_week) || 0;
        const roas = spend > 0 ? (convValue / spend).toFixed(2) : null;
        const ctr = r.impressions_this_week > 0
          ? ((Number(r.clicks_this_week) / Number(r.impressions_this_week)) * 100).toFixed(1)
          : null;
        return {
          platform: r.platform,
          spend: spend.toFixed(0),
          spend_prev: Number(r.spend_prev_week || 0).toFixed(0),
          conversions: Number(r.conversions_this_week) || 0,
          roas,
          clicks: Number(r.clicks_this_week) || 0,
          ctr
        };
      });

      const totalSpend = platforms.reduce((s, p) => s + Number(p.spend), 0);
      const totalConvValue = (adsRows || []).reduce((s, r) => s + (Number(r.conv_value_this_week) || 0), 0);
      metrics.ads = {
        platforms,
        total_spend: totalSpend.toFixed(0),
        total_roas: totalSpend > 0 ? (totalConvValue / totalSpend).toFixed(2) : null
      };
    }
  } catch (e) {
    console.log(`Ads metrics error for ${customerId}: ${e.message}`);
  }

  // ── Social media ──
  try {
    const [socialRows] = await bq.query({
      query: `
        SELECT
          platform,
          MAX(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN followers END) AS followers_now,
          MAX(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY) AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN followers END) AS followers_prev,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN likes + comments + shares ELSE 0 END) AS total_engagement,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) THEN impressions ELSE 0 END) AS impressions_this_week,
          AVG(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) AND impressions > 0
            THEN SAFE_DIVIDE(likes + comments + shares, impressions) END) AS avg_engagement_rate
        FROM \`${dataset}.social_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
        GROUP BY platform
        ORDER BY platform
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    if ((socialRows || []).length > 0) {
      metrics.social = (socialRows || []).map(r => ({
        platform: r.platform,
        followers: Number(r.followers_now) || null,
        followers_gain: r.followers_now && r.followers_prev
          ? Number(r.followers_now) - Number(r.followers_prev)
          : null,
        engagement: Number(r.total_engagement) || 0,
        engagement_rate: r.avg_engagement_rate
          ? (Number(r.avg_engagement_rate) * 100).toFixed(2) + '%'
          : null,
        impressions: Number(r.impressions_this_week) || 0
      }));
    }
  } catch (e) {
    console.log(`Social metrics error for ${customerId}: ${e.message}`);
  }

  return metrics;
}

/**
 * Hämta alla aktiva kunder med kontaktuppgifter från SSM
 */
async function getActiveCustomers() {
  const customers = [];

  // Hämta alla WordPress-kunder (de som har en URL i SSM)
  const wpParams = await getParamsByPath('/seo-mcp/wordpress/');

  // Gruppera per kund-ID
  const customerIds = new Set();
  for (const key of Object.keys(wpParams)) {
    const customerId = key.split('/')[0];
    if (customerId && customerId !== 'undefined') {
      customerIds.add(customerId);
    }
  }

  // Hämta kontaktuppgifter för varje kund
  for (const customerId of customerIds) {
    try {
      const integrations = await getParamsByPath(`/seo-mcp/integrations/${customerId}/`);
      const wpUrl = wpParams[`${customerId}/url`];

      customers.push({
        customer_id: customerId,
        contact_email: integrations['contact-email'] || null,
        contact_person: integrations['contact-person'] || null,
        company_name: integrations['company-name'] || customerId,
        site_url: wpUrl || null,
        gsc_property: integrations['gsc-property'] || null
      });
    } catch (e) {
      console.log(`Kunde inte hämta data för ${customerId}: ${e.message}`);
    }
  }

  return customers;
}

async function getTrelloDoneCards() {
  try {
    const apiKey = await getParam('/seo-mcp/trello/api-key');
    const token = await getParam('/seo-mcp/trello/token');
    const boardId = await getParam('/seo-mcp/trello/board-id');

    const listsRes = await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
      params: { key: apiKey, token }
    });
    const doneList = listsRes.data.find(l => l.name.toLowerCase().includes('done'));
    if (!doneList) {
      console.log('No DONE list found on Trello board');
      return [];
    }

    const cardsRes = await axios.get(`https://api.trello.com/1/lists/${doneList.id}/cards`, {
      params: { key: apiKey, token, fields: 'name,desc,dateLastActivity' }
    });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return cardsRes.data.filter(card => new Date(card.dateLastActivity) >= sevenDaysAgo);
  } catch (err) {
    console.error('Trello fetch error:', err.message);
    return [];
  }
}

function extractCustomerFromCard(card) {
  const nameMatch = card.name.match(/SEO:\s*(\S+)/i);
  if (nameMatch) return nameMatch[1];
  const descMatch = (card.desc || '').match(/\*\*Kund:\*\*\s*(\S+)/);
  if (descMatch) return descMatch[1];
  return 'ospecificerad';
}

/**
 * Matcha optimeringar till kunder baserat på customer_id eller site_url
 */
function groupByCustomer(optimizations, trelloCards, customers) {
  const groups = {};

  // Initiera grupper för alla kunder
  for (const customer of customers) {
    groups[customer.customer_id] = {
      customer,
      optimizations: [],
      trelloCards: []
    };
  }

  // Gruppera optimeringar — matcha på customer_id eller site_url
  for (const opt of optimizations) {
    let matched = false;

    // Först: matcha på customer_id direkt
    if (opt.customer_id && groups[opt.customer_id]) {
      groups[opt.customer_id].optimizations.push(opt);
      matched = true;
    }

    // Fallback: matcha på site_url
    if (!matched && opt.site_url) {
      for (const customer of customers) {
        if (customer.site_url && opt.site_url.includes(customer.site_url.replace(/https?:\/\//, '').replace(/\/$/, ''))) {
          groups[customer.customer_id].optimizations.push(opt);
          matched = true;
          break;
        }
      }
    }

    if (!matched) {
      // Ospecificerad kund
      if (!groups['_unmatched']) {
        groups['_unmatched'] = { customer: { customer_id: '_unmatched', company_name: 'Ospecificerad' }, optimizations: [], trelloCards: [] };
      }
      groups['_unmatched'].optimizations.push(opt);
    }
  }

  // Gruppera Trello-kort
  for (const card of trelloCards) {
    const cardCustomer = extractCustomerFromCard(card);
    let matched = false;
    for (const customer of customers) {
      if (cardCustomer.includes(customer.customer_id) || customer.customer_id.includes(cardCustomer)) {
        groups[customer.customer_id].trelloCards.push(card);
        matched = true;
        break;
      }
    }
    if (!matched) {
      if (!groups['_unmatched']) {
        groups['_unmatched'] = { customer: { customer_id: '_unmatched', company_name: 'Ospecificerad' }, optimizations: [], trelloCards: [] };
      }
      groups['_unmatched'].trelloCards.push(card);
    }
  }

  return groups;
}

// ── Kundfacing veckologg — HTML med siffror och utfört arbete ──
function buildCustomerReportHTML(customer, optimizations, trelloCards, weekLabel, metrics) {
  const name = customer.contact_person || 'där';
  const companyName = customer.company_name || customer.customer_id;

  // Utfört arbete-rader
  const optItems = optimizations.map(o => {
    const type = formatOptType(o.optimization_type);
    const page = (o.page_url || '').replace(/^https?:\/\/[^/]+/, '').replace(/\/$/, '') || '/';
    return `<li style="margin-bottom:6px;font-size:14px">${escapeHtml(type)} <span style="color:#999;font-size:12px">(${escapeHtml(page)})</span></li>`;
  });
  const trelloItems = trelloCards.map(c =>
    `<li style="margin-bottom:6px;font-size:14px">${escapeHtml(c.name)}</li>`
  );
  const allItems = [...optItems, ...trelloItems];

  // ── Veckans siffror (GSC-block) ──
  let gscBlock = '';
  if (metrics && metrics.gsc && metrics.gsc.clicks_this_week > 0) {
    const g = metrics.gsc;
    const clickArrow = g.clicks_diff > 0 ? '▲' : g.clicks_diff < 0 ? '▼' : '–';
    const clickColor = g.clicks_diff > 0 ? '#00c853' : g.clicks_diff < 0 ? '#e53935' : '#666';
    const clickPct = g.clicks_pct !== null ? ` (${g.clicks_pct > 0 ? '+' : ''}${g.clicks_pct}%)` : '';
    const posArrow = g.position_change > 0 ? '▲' : g.position_change < 0 ? '▼' : '';
    const posColor = g.position_change > 0 ? '#00c853' : '#e53935';

    const topKwRows = (g.top_keywords || []).map(k =>
      `<tr>
        <td style="padding:5px 8px;font-size:13px;border-bottom:1px solid #f5f5f5">${escapeHtml(k.query)}</td>
        <td style="padding:5px 8px;font-size:13px;border-bottom:1px solid #f5f5f5;text-align:right">${k.clicks}</td>
        <td style="padding:5px 8px;font-size:13px;border-bottom:1px solid #f5f5f5;text-align:right">${k.position}</td>
      </tr>`
    ).join('');

    const risingBlock = (g.rising_keywords || []).length > 0 ? `
      <div style="margin-top:12px;font-size:12px;color:#666;text-transform:uppercase;font-weight:600;margin-bottom:4px">Klättrat i Google</div>
      ${g.rising_keywords.map(k =>
        `<div style="font-size:13px;margin-bottom:4px">
          <span style="color:#00c853">▲ ${k.gain} platser</span>
          <span style="color:#333"> — ${escapeHtml(k.query)}</span>
          <span style="color:#999"> (nu pos ${k.position})</span>
        </div>`
      ).join('')}` : '';

    gscBlock = `
    <div style="margin-bottom:20px;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
      <div style="background:#f8f9fa;padding:10px 14px;border-bottom:1px solid #e8e8e8;font-size:13px;font-weight:600;color:#444">
        Trafik från Google (organisk)
      </div>
      <div style="padding:14px">
        <table style="width:100%;margin-bottom:8px" cellspacing="0" cellpadding="0">
          <tr>
            <td style="text-align:center;padding:8px">
              <div style="font-size:28px;font-weight:700;color:#db007f">${g.clicks_this_week}</div>
              <div style="font-size:12px;color:#666">Klick denna vecka</div>
              <div style="font-size:12px;color:${clickColor};font-weight:600">${clickArrow} ${Math.abs(g.clicks_diff)}${clickPct}</div>
            </td>
            <td style="text-align:center;padding:8px">
              <div style="font-size:28px;font-weight:700;color:#db007f">${g.impressions_this_week.toLocaleString('sv-SE')}</div>
              <div style="font-size:12px;color:#666">Visningar</div>
            </td>
            ${g.avg_position ? `<td style="text-align:center;padding:8px">
              <div style="font-size:28px;font-weight:700;color:#db007f">${g.avg_position}</div>
              <div style="font-size:12px;color:#666">Snittsposition</div>
              ${g.position_change ? `<div style="font-size:12px;color:${posColor};font-weight:600">${posArrow} ${Math.abs(g.position_change)} platser</div>` : ''}
            </td>` : ''}
          </tr>
        </table>
        ${topKwRows ? `
        <table style="width:100%;border-collapse:collapse;margin-top:8px">
          <tr style="background:#f8f9fa">
            <th style="padding:5px 8px;font-size:11px;color:#999;text-align:left;text-transform:uppercase">Sökord</th>
            <th style="padding:5px 8px;font-size:11px;color:#999;text-align:right;text-transform:uppercase">Klick</th>
            <th style="padding:5px 8px;font-size:11px;color:#999;text-align:right;text-transform:uppercase">Position</th>
          </tr>
          ${topKwRows}
        </table>` : ''}
        ${risingBlock}
      </div>
    </div>`;
  }

  // ── Annonser-block (om relevant) ──
  let adsBlock = '';
  if (metrics && metrics.ads && Number(metrics.ads.total_spend) > 0) {
    const a = metrics.ads;
    const platformRows = a.platforms.map(p => {
      const roasColor = p.roas >= 3 ? '#00c853' : p.roas >= 1 ? '#ffa000' : '#e53935';
      return `<tr>
        <td style="padding:5px 8px;font-size:13px;border-bottom:1px solid #f5f5f5">${formatPlatformName(p.platform)}</td>
        <td style="padding:5px 8px;font-size:13px;border-bottom:1px solid #f5f5f5;text-align:right">${Number(p.spend).toLocaleString('sv-SE')} kr</td>
        <td style="padding:5px 8px;font-size:13px;border-bottom:1px solid #f5f5f5;text-align:right">${p.clicks.toLocaleString('sv-SE')}</td>
        <td style="padding:5px 8px;font-size:13px;border-bottom:1px solid #f5f5f5;text-align:right;color:${roasColor};font-weight:600">${p.roas ? p.roas + 'x' : '–'}</td>
      </tr>`;
    }).join('');

    adsBlock = `
    <div style="margin-bottom:20px;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
      <div style="background:#f8f9fa;padding:10px 14px;border-bottom:1px solid #e8e8e8;font-size:13px;font-weight:600;color:#444">
        Annonsering
      </div>
      <div style="padding:14px">
        <div style="margin-bottom:10px;font-size:14px">
          Totalt spenderat: <strong>${Number(a.total_spend).toLocaleString('sv-SE')} kr</strong>
          ${a.total_roas ? ` | Total ROAS: <strong style="color:${a.total_roas >= 3 ? '#00c853' : '#ffa000'}">${a.total_roas}x</strong>` : ''}
        </div>
        <table style="width:100%;border-collapse:collapse">
          <tr style="background:#f8f9fa">
            <th style="padding:5px 8px;font-size:11px;color:#999;text-align:left;text-transform:uppercase">Plattform</th>
            <th style="padding:5px 8px;font-size:11px;color:#999;text-align:right;text-transform:uppercase">Spend</th>
            <th style="padding:5px 8px;font-size:11px;color:#999;text-align:right;text-transform:uppercase">Klick</th>
            <th style="padding:5px 8px;font-size:11px;color:#999;text-align:right;text-transform:uppercase">ROAS</th>
          </tr>
          ${platformRows}
        </table>
      </div>
    </div>`;
  }

  // ── Social media-block ──
  let socialBlock = '';
  if (metrics && metrics.social && metrics.social.length > 0) {
    const platformItems = metrics.social.map(p => {
      const followerText = p.followers
        ? `${p.followers.toLocaleString('sv-SE')} följare`
        : '';
      const gainText = p.followers_gain !== null
        ? `<span style="color:${p.followers_gain >= 0 ? '#00c853' : '#e53935'};font-size:12px;font-weight:600"> ${p.followers_gain >= 0 ? '+' : ''}${p.followers_gain}</span>`
        : '';
      const engText = p.engagement_rate ? ` | ${p.engagement_rate} eng.` : '';
      return `<div style="margin-bottom:6px;font-size:13px">
        <strong>${formatPlatformName(p.platform)}</strong>: ${followerText}${gainText}${engText}
        ${p.impressions > 0 ? `<span style="color:#999"> | ${p.impressions.toLocaleString('sv-SE')} visningar</span>` : ''}
      </div>`;
    }).join('');

    socialBlock = `
    <div style="margin-bottom:20px;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
      <div style="background:#f8f9fa;padding:10px 14px;border-bottom:1px solid #e8e8e8;font-size:13px;font-weight:600;color:#444">
        Sociala medier
      </div>
      <div style="padding:14px">
        ${platformItems}
      </div>
    </div>`;
  }

  const hasWork = allItems.length > 0;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;max-width:580px;margin:0 auto;color:#0e0c19;background:#fff">
  <div style="background:#db007f;padding:24px;text-align:center">
    <img src="https://opti.searchboost.se/assets/searchboost-logo.png" alt="Searchboost" width="160" style="display:block;margin:0 auto 8px;max-width:160px">
    <p style="color:rgba(255,255,255,0.9);margin:0;font-size:14px">Veckologg — ${escapeHtml(weekLabel)}</p>
  </div>

  <div style="padding:24px">
    <p style="font-size:15px;margin:0 0 16px">Hej ${escapeHtml(name)}!</p>
    <p style="font-size:14px;color:#444;margin:0 0 20px">
      Här är en sammanfattning av vad vi gjort för ${escapeHtml(companyName)} den här veckan,
      samt hur er synlighet i Google ser ut.
    </p>

    ${gscBlock}
    ${adsBlock}
    ${socialBlock}

    ${hasWork ? `
    <div style="margin-bottom:20px;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
      <div style="background:#f8f9fa;padding:10px 14px;border-bottom:1px solid #e8e8e8;font-size:13px;font-weight:600;color:#444">
        Utfört arbete denna vecka (${allItems.length} åtgärder)
      </div>
      <div style="padding:14px">
        <ul style="margin:0;padding-left:18px">
          ${allItems.join('')}
        </ul>
      </div>
    </div>` : `
    <div style="margin-bottom:20px;padding:14px;background:#f8f9fa;border-radius:8px;font-size:14px;color:#666">
      Inget specifikt arbete loggat denna vecka.
    </div>`}

    <p style="font-size:14px;color:#444;margin:0 0 8px">
      Har du frågor är det bara att svara på det här mailet.
    </p>
    <p style="font-size:14px;color:#444;margin:0">
      Hälsningar,<br>
      Mikael<br>
      <strong>Searchboost</strong>
    </p>
  </div>

  <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e8e8e8">
    <p style="margin:0">Searchboost — SEO &amp; Digital marknadsföring</p>
    <p style="margin:4px 0 0">searchboost.se | mikael@searchboost.se</p>
  </div>
</body>
</html>`;
}

// ── Intern sammanfattning (Mikaels mail) ──
function buildInternalReportHTML(groups, optimizations, trelloCards, queueStats, weekLabel, allMetrics) {
  const totalOpts = optimizations.length;
  const totalCards = trelloCards.length;

  // Filtrera bort _unmatched och tomma grupper
  const activeGroups = Object.entries(groups)
    .filter(([id, g]) => id !== '_unmatched' && (g.optimizations.length > 0 || g.trelloCards.length > 0 || (allMetrics && allMetrics[id])))
    .sort((a, b) => (b[1].optimizations.length + b[1].trelloCards.length) - (a[1].optimizations.length + a[1].trelloCards.length));

  const customerSections = activeGroups.map(([customerId, data]) => {
    const displayName = data.customer.company_name || customerId;
    const email = data.customer.contact_email || '—';
    const m = allMetrics && allMetrics[customerId];

    const optRows = data.optimizations.map(o =>
      `<tr><td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;font-size:12px">${formatOptType(o.optimization_type)}</td>` +
      `<td style="padding:5px 8px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#666">${truncate(o.page_url || '', 45)}</td></tr>`
    ).join('');

    const trelloRows = data.trelloCards.map(c =>
      `<li style="margin-bottom:4px;font-size:12px">${escapeHtml(c.name)}</li>`
    ).join('');

    const emailStatus = data.customer.contact_email ? 'Skickat' : 'Inget mail';

    // GSC-sammanfattning för intern vy
    let gscSummary = '';
    if (m && m.gsc && m.gsc.clicks_this_week > 0) {
      const g = m.gsc;
      const clickArrow = g.clicks_diff > 0 ? '▲' : g.clicks_diff < 0 ? '▼' : '–';
      const clickColor = g.clicks_diff > 0 ? '#00c853' : g.clicks_diff < 0 ? '#e53935' : '#888';
      const pctStr = g.clicks_pct !== null ? ` (${g.clicks_pct > 0 ? '+' : ''}${g.clicks_pct}%)` : '';
      const posStr = g.avg_position ? ` | Pos: ${g.avg_position}` : '';
      gscSummary = `<div style="font-size:12px;margin-bottom:4px">
        <span style="color:#666">GSC:</span>
        <strong>${g.clicks_this_week} klick</strong>
        <span style="color:${clickColor}"> ${clickArrow}${Math.abs(g.clicks_diff)}${pctStr}</span>
        <span style="color:#888"> | ${g.impressions_this_week.toLocaleString('sv-SE')} visningar${posStr}</span>
      </div>`;

      if ((g.rising_keywords || []).length > 0) {
        gscSummary += `<div style="font-size:11px;color:#666;margin-bottom:4px">
          Klättrat: ${g.rising_keywords.map(k => `<strong>${escapeHtml(k.query)}</strong> ▲${k.gain} (→ pos ${k.position})`).join(' | ')}
        </div>`;
      }
    }

    // Ads-sammanfattning för intern vy
    let adsSummary = '';
    if (m && m.ads && Number(m.ads.total_spend) > 0) {
      const a = m.ads;
      const roasColor = a.total_roas >= 3 ? '#00c853' : a.total_roas >= 1 ? '#ffa000' : '#e53935';
      adsSummary = `<div style="font-size:12px;margin-bottom:4px">
        <span style="color:#666">Annonser:</span>
        <strong>${Number(a.total_spend).toLocaleString('sv-SE')} kr</strong>
        ${a.total_roas ? `<span style="color:${roasColor}"> | ROAS ${a.total_roas}x</span>` : ''}
        <span style="color:#888"> — ${a.platforms.map(p => formatPlatformName(p.platform)).join(', ')}</span>
      </div>`;
    }

    // Social-sammanfattning för intern vy
    let socialSummary = '';
    if (m && m.social && m.social.length > 0) {
      const socialParts = m.social.map(p => {
        const gainStr = p.followers_gain !== null
          ? ` <span style="color:${p.followers_gain >= 0 ? '#00c853' : '#e53935'}">${p.followers_gain >= 0 ? '+' : ''}${p.followers_gain}</span>`
          : '';
        return `${formatPlatformName(p.platform)}: ${p.followers ? p.followers.toLocaleString('sv-SE') : '–'}${gainStr}`;
      }).join(' | ');
      socialSummary = `<div style="font-size:12px;margin-bottom:4px">
        <span style="color:#666">Social:</span> ${socialParts}
      </div>`;
    }

    const hasSummary = gscSummary || adsSummary || socialSummary;

    return `
    <div style="margin-bottom:16px;border:1px solid #e8e8e8;border-radius:8px;overflow:hidden">
      <div style="background:#f8f9fa;padding:10px 14px;border-bottom:1px solid #e8e8e8">
        <strong style="font-size:14px">${escapeHtml(displayName)}</strong>
        <span style="float:right;font-size:12px;color:#666">${data.optimizations.length} opt. | ${data.trelloCards.length} kort | ${emailStatus}</span>
      </div>
      <div style="padding:12px 14px">
        <div style="font-size:11px;color:#999;margin-bottom:8px">Kontakt: ${escapeHtml(email)}</div>

        ${hasSummary ? `
        <div style="background:#f0f7ff;border-radius:6px;padding:10px 12px;margin-bottom:10px">
          ${gscSummary}${adsSummary}${socialSummary}
        </div>` : ''}

        ${data.optimizations.length > 0 ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:8px">
          <tr style="background:#f8f9fa">
            <th style="padding:5px 8px;text-align:left;font-size:11px;color:#999;text-transform:uppercase">Typ</th>
            <th style="padding:5px 8px;text-align:left;font-size:11px;color:#999;text-transform:uppercase">Sida</th>
          </tr>
          ${optRows}
        </table>` : ''}
        ${data.trelloCards.length > 0 ? `
        <div style="margin-top:8px">
          <div style="font-size:11px;color:#999;text-transform:uppercase;margin-bottom:4px">Trello (DONE)</div>
          <ul style="margin:0;padding-left:18px">${trelloRows}</ul>
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  const customersWithWork = activeGroups.filter(([id]) => id !== '_unmatched').length;
  const customersWithEmail = activeGroups.filter(([id, g]) => id !== '_unmatched' && g.customer.contact_email).length;

  // Totaler för GSC, ads, social
  const allGsc = Object.values(allMetrics || {}).filter(m => m.gsc && m.gsc.clicks_this_week > 0);
  const totalClicks = allGsc.reduce((s, m) => s + (m.gsc.clicks_this_week || 0), 0);
  const totalSpend = Object.values(allMetrics || {})
    .filter(m => m.ads && Number(m.ads.total_spend) > 0)
    .reduce((s, m) => s + Number(m.ads.total_spend), 0);

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0e0c19;background:#fff">
  <div style="background:#db007f;padding:24px;text-align:center">
    <img src="https://opti.searchboost.se/assets/searchboost-logo.png" alt="Searchboost" width="160" style="display:block;margin:0 auto 8px;max-width:160px">
    <p style="color:rgba(255,255,255,0.9);margin:0">Intern veckologg — ${weekLabel}</p>
  </div>

  <div style="padding:24px">
    <table style="width:100%;margin-bottom:24px" cellspacing="0" cellpadding="0">
      <tr>
        <td style="width:19%;text-align:center;background:#f8f9fa;border-radius:8px;padding:14px 4px">
          <div style="font-size:28px;font-weight:700;color:#db007f">${totalOpts}</div>
          <div style="font-size:12px;color:#666">Opt.</div>
        </td>
        <td style="width:3px"></td>
        <td style="width:19%;text-align:center;background:#f8f9fa;border-radius:8px;padding:14px 4px">
          <div style="font-size:28px;font-weight:700;color:#db007f">${totalCards}</div>
          <div style="font-size:12px;color:#666">Trello</div>
        </td>
        <td style="width:3px"></td>
        <td style="width:19%;text-align:center;background:#f8f9fa;border-radius:8px;padding:14px 4px">
          <div style="font-size:28px;font-weight:700;color:#db007f">${customersWithWork}</div>
          <div style="font-size:12px;color:#666">Kunder</div>
        </td>
        <td style="width:3px"></td>
        <td style="width:19%;text-align:center;background:#f8f9fa;border-radius:8px;padding:14px 4px">
          <div style="font-size:28px;font-weight:700;color:#db007f">${totalClicks.toLocaleString('sv-SE')}</div>
          <div style="font-size:12px;color:#666">Klick GSC</div>
        </td>
        <td style="width:3px"></td>
        <td style="width:19%;text-align:center;background:#f8f9fa;border-radius:8px;padding:14px 4px">
          <div style="font-size:28px;font-weight:700;color:#db007f">${totalSpend > 0 ? Math.round(totalSpend).toLocaleString('sv-SE') : '–'}</div>
          <div style="font-size:12px;color:#666">kr ads</div>
        </td>
      </tr>
    </table>

    <h2 style="color:#0e0c19;font-size:16px;border-bottom:2px solid #db007f;padding-bottom:8px;margin-bottom:16px">Per kund</h2>
    ${customerSections || '<p style="color:#999;font-size:14px">Inget arbete loggat denna vecka.</p>'}

    ${queueStats.pending ? `
    <div style="margin-top:16px;padding:12px 16px;background:#fff8e1;border-left:4px solid #ffa000;border-radius:4px;font-size:13px">
      <strong>${queueStats.pending}</strong> uppgifter i kö för kommande vecka
    </div>` : ''}
  </div>

  <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#999;border-top:1px solid #e8e8e8">
    <p style="margin:0">Searchboost Opti — Intern veckologg</p>
    <p style="margin:4px 0 0">searchboost.se</p>
  </div>
</body>
</html>`;
}

function formatPlatformName(platform) {
  const names = {
    'google_ads': 'Google Ads',
    'meta': 'Meta',
    'meta_ads': 'Meta Ads',
    'linkedin': 'LinkedIn',
    'linkedin_ads': 'LinkedIn Ads',
    'tiktok': 'TikTok',
    'tiktok_ads': 'TikTok Ads',
    'instagram': 'Instagram',
    'facebook': 'Facebook',
    'facebook_page': 'Facebook',
    'linkedin_org': 'LinkedIn',
    'tiktok_creator': 'TikTok'
  };
  return names[platform] || platform || 'Okänd';
}

function formatOptType(type) {
  const types = {
    'short_title': 'Förlängde sidtiteln',
    'long_title': 'Kortade ner sidtiteln',
    'thin_content': 'Utökade sidinnehållet',
    'missing_h1': 'La till H1-rubrik',
    'no_internal_links': 'La till interna länkar',
    'missing_alt_text': 'La till alt-text på bilder',
    'no_schema': 'La till schema markup',
    'metadata': 'Optimerade metadata',
    'meta': 'Optimerade metadata',
    'title': 'Optimerade sidtiteln',
    'description': 'Skrev meta-beskrivning',
    'meta_description': 'Skrev meta-beskrivning',
    'faq_schema': 'La till FAQ-schema',
    'internal_links': 'Förbättrade intern länkning',
    'content': 'Innehållsoptimering',
    'schema': 'La till schema markup',
    'technical': 'Teknisk SEO-fix',
    'manual': 'Manuell åtgärd',
    'h1': 'La till H1-rubrik',
    'h2_optimization': 'Förbättrade underrubriker',
    'h3_optimization': 'Förbättrade underrubriker',
    'synonym_gap': 'Utökade nyckelordsvarianter',
    'keyword': 'Nyckelordsoptimering',
    'keywords': 'Nyckelordsoptimering',
    'image': 'Optimerade bilder',
    'images': 'Optimerade bilder',
    'speed': 'Förbättrade sidladdning',
    'canonical': 'Satte canonical-länk',
    'redirect': 'Skapade omdirigering'
  };

  const mapped = types[type];
  if (mapped) return mapped;

  // Fallback: aldrig visa råa typnamn (kan innehålla tekniska termer)
  // Rensa bort prefix och returna ett läsbart alternativ
  const cleaned = (type || '')
    .replace(/^auto[_\s]?/i, '')
    .replace(/[_-]/g, ' ')
    .trim();

  if (!cleaned) return 'SEO-optimering';

  // Slå upp den rensade varianten också
  return types[cleaned.toLowerCase().replace(/\s/g, '_')] || 'SEO-optimering';
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function truncate(str, max) {
  return str.length > max ? str.substring(0, max) + '...' : str;
}

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}

exports.handler = async (event) => {
  console.log('=== Weekly Report (Friday) Started ===');

  // Tillåt force=true för att köra om en redan skickad rapport (t.ex. vid test)
  const force = event && event.force === true;

  try {
    const { bq, dataset } = await getBigQuery();
    const emailFrom = await getParam('/seo-mcp/email/from');
    const mikaelEmail = (await getParam('/seo-mcp/email/recipients')).split(',').map(e => e.trim());

    // ── Deduplicering: kolla om vi redan skickat intern rapport idag ──
    // Kontrollerar IDAG (DATE-nivå) istället för vecka för att undvika
    // race condition vid simultana Lambda-körningar — båda ser 0 rader
    // om vecko-check används och ingen hunnit skriva till BQ ännu.
    if (!force) {
      const [existingReports] = await bq.query({
        query: `SELECT COUNT(*) as cnt FROM \`${dataset}.weekly_reports\`
                WHERE customer_id = 'internal'
                AND DATE(email_sent_at) = CURRENT_DATE()`
      });
      if (existingReports[0] && Number(existingReports[0].cnt) > 0) {
        console.log('Rapport redan skickad idag — avbryter (använd force=true för att skicka om)');
        return {
          statusCode: 200,
          body: JSON.stringify({ skipped: true, reason: 'already_sent_today' })
        };
      }
    } else {
      console.log('force=true — skickar rapport oavsett deduplicering');
    }

    // Hämta data parallellt
    const [optimizationsResult, queueResult, trelloCards, customers] = await Promise.all([
      bq.query({
        query: `SELECT * FROM \`${dataset}.seo_optimization_log\` WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY) ORDER BY timestamp DESC`
      }),
      bq.query({
        query: `SELECT status, COUNT(*) as count FROM \`${dataset}.seo_work_queue\` GROUP BY status`
      }),
      getTrelloDoneCards(),
      getActiveCustomers()
    ]);

    const optimizations = optimizationsResult[0];
    const queueStats = {};
    for (const row of queueResult[0]) {
      queueStats[row.status] = row.count;
    }

    const now = new Date();
    const weekLabel = `Vecka ${getWeekNumber(now)}, ${now.getFullYear()}`;

    // Gruppera per kund
    const groups = groupByCustomer(optimizations, trelloCards, customers);

    console.log(`Hittade ${optimizations.length} optimeringar, ${trelloCards.length} Trello-kort, ${customers.length} kunder`);

    // ── Hämta GSC + Ads + Social-metrics per kund parallellt ──
    const allMetrics = {};
    const metricsPromises = customers.map(async c => {
      try {
        allMetrics[c.customer_id] = await getCustomerMetrics(bq, dataset, c.customer_id);
      } catch (e) {
        console.log(`Metrics fetch failed for ${c.customer_id}: ${e.message}`);
        allMetrics[c.customer_id] = { gsc: null, ads: null, social: null };
      }
    });
    await Promise.all(metricsPromises);
    console.log(`Hämtade metrics för ${Object.keys(allMetrics).length} kunder`);

    const transporter = await getTransporter();

    // ── 1. Per-kund veckologgar ──
    const customerResults = [];
    for (const [customerId, group] of Object.entries(groups)) {
      // Skippa unmatched och kunder utan arbete och utan metrics
      if (customerId === '_unmatched') continue;
      const m = allMetrics[customerId] || { gsc: null, ads: null, social: null };
      const hasWork = group.optimizations.length > 0 || group.trelloCards.length > 0;
      const hasMetrics = (m.gsc && m.gsc.clicks_this_week > 0) || (m.ads && Number(m.ads.total_spend) > 0) || (m.social && m.social.length > 0);
      if (!hasWork && !hasMetrics) continue;
      // Skippa kunder utan e-post
      if (!group.customer.contact_email) {
        console.log(`Skipping ${customerId}: ingen contact_email`);
        customerResults.push({ customer_id: customerId, sent: false, reason: 'no_email' });
        continue;
      }
      // Skippa searchboost (intern)
      if (customerId === 'searchboost') {
        console.log(`Skipping searchboost (intern)`);
        continue;
      }

      const customerHtml = buildCustomerReportHTML(
        group.customer,
        group.optimizations,
        group.trelloCards,
        weekLabel,
        m
      );

      try {
        await transporter.sendMail({
          from: `"Mikael på Searchboost" <${emailFrom}>`,
          to: group.customer.contact_email,
          bcc: mikaelEmail.join(', '),
          replyTo: mikaelEmail[0],
          subject: `Veckologg SEO — ${group.customer.company_name} — ${weekLabel}`,
          html: customerHtml
        });

        console.log(`✅ Kundmail skickat till ${group.customer.contact_email} (${customerId})`);
        customerResults.push({ customer_id: customerId, sent: true, email: group.customer.contact_email });

        // Spara per-kund rapport i BigQuery
        await bq.query({
          query: `INSERT INTO \`${dataset}.weekly_reports\` (email_sent_at, customer_id, report_html, metrics_json, recipient_list)
                  VALUES (CURRENT_TIMESTAMP(), @customer_id, @report_html, @metrics_json, @recipient_list)`,
          params: {
            customer_id: customerId,
            report_html: customerHtml,
            metrics_json: JSON.stringify({
              optimizations: group.optimizations.length,
              trelloCards: group.trelloCards.length,
              total: group.optimizations.length + group.trelloCards.length,
              gsc: m.gsc,
              ads: m.ads ? { total_spend: m.ads.total_spend, total_roas: m.ads.total_roas } : null,
              social: m.social ? m.social.map(p => ({ platform: p.platform, followers: p.followers, followers_gain: p.followers_gain })) : null
            }),
            recipient_list: group.customer.contact_email
          }
        });
      } catch (emailErr) {
        console.error(`❌ Kunde inte skicka till ${group.customer.contact_email}: ${emailErr.message}`);
        customerResults.push({ customer_id: customerId, sent: false, reason: emailErr.message, email: group.customer.contact_email });
      }
    }

    // ── 2. Intern sammanfattning till Mikael ──
    const internalHtml = buildInternalReportHTML(groups, optimizations, trelloCards, queueStats, weekLabel, allMetrics);

    await transporter.sendMail({
      from: `"Searchboost Opti" <${emailFrom}>`,
      to: mikaelEmail.join(', '),
      subject: `Intern veckologg SEO — ${weekLabel} — ${optimizations.length} optimeringar, ${trelloCards.length} kort`,
      html: internalHtml
    });

    // Spara intern rapport
    await bq.query({
      query: `INSERT INTO \`${dataset}.weekly_reports\` (email_sent_at, customer_id, report_html, metrics_json, recipient_list)
              VALUES (CURRENT_TIMESTAMP(), @customer_id, @report_html, @metrics_json, @recipient_list)`,
      params: {
        customer_id: 'internal',
        report_html: internalHtml,
        metrics_json: JSON.stringify({
          total: optimizations.length,
          trelloCards: trelloCards.length,
          queueStats,
          customerResults,
          metrics_summary: Object.entries(allMetrics).map(([cid, m]) => ({
            customer_id: cid,
            gsc_clicks: m.gsc ? m.gsc.clicks_this_week : null,
            gsc_clicks_diff: m.gsc ? m.gsc.clicks_diff : null,
            ads_spend: m.ads ? m.ads.total_spend : null,
            ads_roas: m.ads ? m.ads.total_roas : null
          }))
        }),
        recipient_list: mikaelEmail.join(', ')
      }
    });

    const sentCount = customerResults.filter(r => r.sent).length;
    const failedCount = customerResults.filter(r => !r.sent).length;

    console.log(`=== Klart! ${sentCount} kundmail skickade, ${failedCount} misslyckade, intern rapport skickad till ${mikaelEmail.join(', ')} ===`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        sent: true,
        internalReport: { recipients: mikaelEmail },
        customerReports: customerResults,
        summary: { optimizations: optimizations.length, trelloCards: trelloCards.length, customers: customers.length }
      })
    };
  } catch (err) {
    console.error('Report failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
