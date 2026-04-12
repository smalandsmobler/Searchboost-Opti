/**
 * Monthly Client Report Lambda — Körs 1:a varje månad kl 08:00 CET
 * EventBridge: cron(0 7 1 * ? *)
 *
 * Per aktiv kund:
 *   1. Hämtar GSC-data för senaste 30d vs föregående 30d
 *   2. Hämtar antal utförda optimeringar
 *   3. Claude Haiku genererar 150-ords textsammanfattning
 *   4. Bygger HTML-mail och skickar via SES/SMTP
 *
 * Loggar resultat i BigQuery: monthly_report_log (auto-skapas)
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const nodemailer = require('nodemailer');
const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const crypto = require('crypto');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// ── SSM helpers ──

async function getParam(name) {
  try {
    const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
    return res.Parameter.Value;
  } catch (e) {
    return null;
  }
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

// ── BigQuery ──

let _bqCache = null;
async function getBigQuery() {
  if (_bqCache) return _bqCache;
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  _bqCache = { bq: new BigQuery({ projectId }), dataset };
  return _bqCache;
}

async function ensureMonthlyReportLogTable(bq, dataset) {
  const schema = [
    { name: 'report_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'customer_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'period_start', type: 'DATE', mode: 'NULLABLE' },
    { name: 'period_end', type: 'DATE', mode: 'NULLABLE' },
    { name: 'total_clicks', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'total_impressions', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'avg_position', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'optimizations_count', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'email_sent', type: 'BOOLEAN', mode: 'NULLABLE' },
    { name: 'sent_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'error_message', type: 'STRING', mode: 'NULLABLE' },
  ];
  try {
    const table = bq.dataset(dataset).table('monthly_report_log');
    const [exists] = await table.exists();
    if (!exists) {
      await bq.dataset(dataset).createTable('monthly_report_log', { schema });
      console.log('Created monthly_report_log table');
    }
  } catch (e) {
    console.error('ensureMonthlyReportLogTable:', e.message);
  }
}

// ── E-post ──

let _transporter = null;
async function getTransporter() {
  if (_transporter) return _transporter;
  const host = await getParam('/seo-mcp/email/smtp-host');
  const user = await getParam('/seo-mcp/email/username');
  const pass = await getParam('/seo-mcp/email/password');
  if (host && user && pass) {
    _transporter = nodemailer.createTransport({
      host,
      port: 587,
      secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }
  return _transporter;
}

// ── Hämta kunddata ──

async function getCustomerMetrics(bq, dataset, customerId) {
  const result = {
    // Denna period (senaste 30d)
    clicks: 0,
    impressions: 0,
    avg_position: null,
    top_queries: [],
    optimizations_count: 0,
    // Föregående period (dag 31-60)
    prev_clicks: 0,
    prev_impressions: 0,
    prev_avg_position: null,
  };

  // GSC — nuvarande period
  try {
    const [gscRows] = await bq.query({
      query: `
        SELECT
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) THEN clicks ELSE 0 END) AS clicks_now,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) THEN impressions ELSE 0 END) AS impressions_now,
          AVG(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) THEN position END) AS pos_now,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) THEN clicks ELSE 0 END) AS clicks_prev,
          SUM(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) THEN impressions ELSE 0 END) AS impressions_prev,
          AVG(CASE WHEN date >= DATE_SUB(CURRENT_DATE(), INTERVAL 60 DAY) AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY) THEN position END) AS pos_prev
        FROM \`${bq.projectId}.${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @customerId
      `,
      params: { customerId }
    });
    if (gscRows.length > 0) {
      const r = gscRows[0];
      result.clicks = parseInt(r.clicks_now) || 0;
      result.impressions = parseInt(r.impressions_now) || 0;
      result.avg_position = parseFloat(r.pos_now) || null;
      result.prev_clicks = parseInt(r.clicks_prev) || 0;
      result.prev_impressions = parseInt(r.impressions_prev) || 0;
      result.prev_avg_position = parseFloat(r.pos_prev) || null;
    }
  } catch (e) {
    // Tabell saknas eller kund har ingen GSC-data — OK
  }

  // GSC — top 5 sökord
  try {
    const [topRows] = await bq.query({
      query: `
        SELECT query, SUM(clicks) as clicks, AVG(position) as avg_pos
        FROM \`${bq.projectId}.${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @customerId
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
        GROUP BY query
        ORDER BY clicks DESC
        LIMIT 5
      `,
      params: { customerId }
    });
    result.top_queries = topRows.map(r => ({
      query: r.query,
      clicks: parseInt(r.clicks) || 0,
      position: parseFloat(r.avg_pos) ? parseFloat(r.avg_pos).toFixed(1) : '—'
    }));
  } catch (e) {
    // Ingen data
  }

  // Optimeringar
  try {
    const [optRows] = await bq.query({
      query: `
        SELECT COUNT(*) as cnt
        FROM \`${bq.projectId}.${dataset}.seo_optimization_log\`
        WHERE customer_id = @customerId
          AND created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
      `,
      params: { customerId }
    });
    result.optimizations_count = parseInt(optRows[0]?.cnt) || 0;
  } catch (e) {
    // Ingen data
  }

  return result;
}

// ── Claude Haiku — AI-sammanfattning ──

async function generateAISummary(contactPerson, companyName, metrics) {
  try {
    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    if (!apiKey) return null;

    const client = new Anthropic({ apiKey });

    const clickChange = metrics.prev_clicks > 0
      ? Math.round(((metrics.clicks - metrics.prev_clicks) / metrics.prev_clicks) * 100)
      : null;
    const impressionChange = metrics.prev_impressions > 0
      ? Math.round(((metrics.impressions - metrics.prev_impressions) / metrics.prev_impressions) * 100)
      : null;

    const prompt = `Du är SEO-strateg på Searchboost. Skriv en professionell, positiv och konkret månadssammanfattning (~150 ord) på svenska till kunden ${contactPerson} på ${companyName}.

Data från senaste 30 dagarna:
- Organiska klick: ${metrics.clicks} (${clickChange !== null ? (clickChange >= 0 ? '+' : '') + clickChange + '% vs föregående period' : 'jämförelsedata saknas'})
- Visningar i sökning: ${metrics.impressions} (${impressionChange !== null ? (impressionChange >= 0 ? '+' : '') + impressionChange + '%' : 'jämförelsedata saknas'})
- Genomsnittlig position: ${metrics.avg_position ? metrics.avg_position.toFixed(1) : 'data saknas'}
- SEO-optimeringar utförda: ${metrics.optimizations_count} st
- Top sökord: ${metrics.top_queries.slice(0, 3).map(q => q.query).join(', ') || 'data samlas in'}

Skriv som ett naturligt stycke (inte punktlista). Inled med "Den här månaden..." och avsluta med ett positivt framåtblickande. Max 160 ord.`;

    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }]
    });

    return response.content[0]?.text?.trim() || null;
  } catch (e) {
    console.error('AI summary error:', e.message);
    return null;
  }
}

// ── HTML-mail builder ──

function buildEmailHtml(options) {
  const {
    contactPerson,
    companyName,
    periodLabel,
    metrics,
    aiSummary,
    portalUrl,
  } = options;

  const clickChange = metrics.prev_clicks > 0
    ? Math.round(((metrics.clicks - metrics.prev_clicks) / metrics.prev_clicks) * 100)
    : null;
  const impressionChange = metrics.prev_impressions > 0
    ? Math.round(((metrics.impressions - metrics.prev_impressions) / metrics.prev_impressions) * 100)
    : null;

  const changeLabel = (pct) => {
    if (pct === null) return '';
    const sign = pct >= 0 ? '+' : '';
    const color = pct >= 0 ? '#00e676' : '#ff5252';
    return `<span style="font-size:12px;color:${color};margin-left:4px">${sign}${pct}%</span>`;
  };

  const topQueriesHtml = metrics.top_queries.length > 0 ? `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-top:16px">
      <tr style="background:#f0f0f0">
        <th style="padding:8px 12px;text-align:left;font-size:13px;color:#555">Sökord</th>
        <th style="padding:8px 12px;text-align:right;font-size:13px;color:#555">Klick</th>
        <th style="padding:8px 12px;text-align:right;font-size:13px;color:#555">Position</th>
      </tr>
      ${metrics.top_queries.map((q, i) => `
        <tr style="background:${i % 2 === 0 ? '#fff' : '#fafafa'}">
          <td style="padding:8px 12px;font-size:13px;color:#333">${q.query}</td>
          <td style="padding:8px 12px;font-size:13px;color:#333;text-align:right">${q.clicks}</td>
          <td style="padding:8px 12px;font-size:13px;color:#333;text-align:right">${q.position}</td>
        </tr>
      `).join('')}
    </table>
  ` : '<p style="color:#888;font-size:13px">Sökordsdata samlas in — syns i nästa rapport.</p>';

  const summaryHtml = aiSummary
    ? `<p style="color:#444;line-height:1.7;font-size:15px">${aiSummary}</p>`
    : `<p style="color:#444;line-height:1.7;font-size:15px">Den här månaden har vi arbetat aktivt med din webbplats SEO. Vi har utfört ${metrics.optimizations_count} optimeringar och fortsätter förbättra din synlighet i Google.</p>`;

  return `<!DOCTYPE html>
<html lang="sv">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Månadsrapport ${periodLabel} — ${companyName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:'Helvetica Neue',Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff">

    <!-- Header -->
    <div style="background:#0e0c19;padding:28px 32px;text-align:center">
      <img src="https://searchboost.se/wp-content/uploads/searchboost-logo-white.png"
           alt="Searchboost" height="36" style="display:inline-block">
    </div>

    <!-- Title bar -->
    <div style="background:#e91e8c;padding:16px 32px">
      <h1 style="margin:0;color:#fff;font-size:18px;font-weight:600">
        Månadsrapport &mdash; ${periodLabel}
      </h1>
    </div>

    <!-- Body -->
    <div style="padding:32px">
      <p style="color:#333;font-size:15px;margin-top:0">Hej ${contactPerson},</p>

      ${summaryHtml}

      <!-- Metrics grid -->
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:24px 0">
        <tr>
          <td width="25%" style="padding:4px">
            <div style="background:#f9f9f9;border-radius:8px;padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:#0e0c19">
                ${metrics.clicks}${changeLabel(clickChange)}
              </div>
              <div style="font-size:12px;color:#888;margin-top:4px">Organiska klick</div>
            </div>
          </td>
          <td width="25%" style="padding:4px">
            <div style="background:#f9f9f9;border-radius:8px;padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:#0e0c19">
                ${metrics.impressions}${changeLabel(impressionChange)}
              </div>
              <div style="font-size:12px;color:#888;margin-top:4px">Visningar</div>
            </div>
          </td>
          <td width="25%" style="padding:4px">
            <div style="background:#f9f9f9;border-radius:8px;padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:#0e0c19">
                ${metrics.avg_position ? metrics.avg_position.toFixed(1) : '—'}
              </div>
              <div style="font-size:12px;color:#888;margin-top:4px">Avg. position</div>
            </div>
          </td>
          <td width="25%" style="padding:4px">
            <div style="background:#f9f9f9;border-radius:8px;padding:16px;text-align:center">
              <div style="font-size:28px;font-weight:700;color:#e91e8c">
                ${metrics.optimizations_count}
              </div>
              <div style="font-size:12px;color:#888;margin-top:4px">Optimeringar</div>
            </div>
          </td>
        </tr>
      </table>

      <!-- Top sökord -->
      <h3 style="color:#0e0c19;font-size:15px;margin:24px 0 8px">Top 5 sökord denna månad</h3>
      ${topQueriesHtml}

      <!-- CTA -->
      ${portalUrl ? `
      <div style="margin-top:32px;text-align:center">
        <a href="${portalUrl}" style="display:inline-block;background:#e91e8c;color:#fff;text-decoration:none;padding:14px 28px;border-radius:6px;font-weight:600;font-size:15px">
          Se din fullständiga rapport &rarr;
        </a>
      </div>
      ` : ''}

      <p style="color:#888;font-size:13px;margin-top:32px">
        Har du frågor om rapporten? Svara direkt på detta mail eller kontakta oss via <a href="https://searchboost.se" style="color:#e91e8c">searchboost.se</a>.
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#f0f0f0;padding:16px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#888">
        Searchboost AB &middot; <a href="https://searchboost.se" style="color:#888">searchboost.se</a>
        &middot; <a href="mailto:mikael@searchboost.se" style="color:#888">mikael@searchboost.se</a>
      </p>
      <p style="margin:4px 0 0;font-size:11px;color:#aaa">
        Du f&aring;r detta mail eftersom du &auml;r kund hos Searchboost.
      </p>
    </div>

  </div>
</body>
</html>`;
}

// ── Logga till BigQuery ──

async function logReport(bq, dataset, entry) {
  try {
    await bq.dataset(dataset).table('monthly_report_log').insert([entry]);
  } catch (e) {
    console.error('Log insert error:', e.message);
  }
}

// ── Intern sammanfattning till Mikael ──

function buildInternalSummaryHtml(periodLabel, results) {
  const rows = results.map(r => `
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:8px 12px;font-size:13px">${r.companyName}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:center">${r.metrics.clicks}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:center">${r.metrics.optimizations_count}</td>
      <td style="padding:8px 12px;font-size:13px;text-align:center;color:${r.emailSent ? '#00b300' : '#cc0000'}">${r.emailSent ? 'Skickad' : 'Missad'}</td>
      <td style="padding:8px 12px;font-size:13px;color:#888">${r.error || ''}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;padding:24px;max-width:700px">
  <h2 style="color:#0e0c19">Intern sammanfattning — Månadsrapporter ${periodLabel}</h2>
  <p>Skickade rapporter: <strong>${results.filter(r => r.emailSent).length}</strong> / ${results.length}</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
    <tr style="background:#f0f0f0">
      <th style="padding:8px 12px;text-align:left;font-size:13px">Kund</th>
      <th style="padding:8px 12px;text-align:center;font-size:13px">Klick</th>
      <th style="padding:8px 12px;text-align:center;font-size:13px">Opt.</th>
      <th style="padding:8px 12px;text-align:center;font-size:13px">Status</th>
      <th style="padding:8px 12px;text-align:left;font-size:13px">Fel</th>
    </tr>
    ${rows}
  </table>
</body>
</html>`;
}

// ── Main handler ──

exports.handler = async (event) => {
  console.log('Monthly client report started', new Date().toISOString());

  const { bq, dataset } = await getBigQuery();
  await ensureMonthlyReportLogTable(bq, dataset);

  // Hämta alla aktiva kunder
  const [customers] = await bq.query({
    query: `
      SELECT customer_id, company_name, website_url
      FROM \`${bq.projectId}.${dataset}.customer_pipeline\`
      WHERE status = 'active'
      ORDER BY company_name
    `
  });

  if (customers.length === 0) {
    console.log('Inga aktiva kunder hittades');
    return { statusCode: 200, body: 'No active customers' };
  }

  const fromEmail = await getParam('/seo-mcp/email/from') || 'noreply@searchboost.se';
  const mikaelEmail = await getParam('/seo-mcp/email/recipients') || 'mikael@searchboost.se';
  const portalBaseUrl = 'http://51.21.116.7/portal.html';
  const transporter = await getTransporter();

  // Periodlabel — föregående månad
  const now = new Date();
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const monthNames = ['Januari','Februari','Mars','April','Maj','Juni','Juli','Augusti','September','Oktober','November','December'];
  const periodLabel = `${monthNames[prevMonth.getMonth()]} ${prevMonth.getFullYear()}`;

  const periodStart = prevMonth.toISOString().slice(0, 10);
  const periodEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);

  const results = [];

  for (const customer of customers) {
    const customerId = customer.customer_id;
    const reportId = crypto.randomUUID();
    let emailSent = false;
    let errorMessage = null;

    console.log(`Processing customer: ${customerId}`);

    try {
      // Hämta SSM-parametrar för kunden
      const integrationParams = await getParamsByPath(`/seo-mcp/integrations/${customerId}/`);
      const contactEmail = integrationParams['contact-email'];
      const contactPerson = integrationParams['contact-person'] || 'kund';
      const companyName = integrationParams['company-name'] || customer.company_name || customerId;

      if (!contactEmail) {
        console.log(`${customerId}: ingen contact-email i SSM, hoppar över`);
        results.push({ customerId, companyName, metrics: { clicks: 0, optimizations_count: 0 }, emailSent: false, error: 'Ingen contact-email' });
        continue;
      }

      // Hämta kunddata
      const metrics = await getCustomerMetrics(bq, dataset, customerId);

      // Generera AI-sammanfattning
      const aiSummary = await generateAISummary(contactPerson, companyName, metrics);

      // Bygg HTML-mail
      const htmlBody = buildEmailHtml({
        contactPerson,
        companyName,
        periodLabel,
        metrics,
        aiSummary,
        portalUrl: `${portalBaseUrl}?customer=${customerId}`,
      });

      // Skicka mail
      if (transporter) {
        await transporter.sendMail({
          from: `Searchboost SEO <${fromEmail}>`,
          to: contactEmail,
          subject: `Din SEO-rapport för ${periodLabel} — ${companyName}`,
          html: htmlBody,
        });
        emailSent = true;
        console.log(`${customerId}: mail skickat till ${contactEmail}`);
      } else {
        errorMessage = 'SMTP ej konfigurerat';
        console.warn(`${customerId}: ingen transporter, mail EJ skickat`);
      }

      // Logga i BigQuery
      await logReport(bq, dataset, {
        report_id: reportId,
        customer_id: customerId,
        period_start: periodStart,
        period_end: periodEnd,
        total_clicks: metrics.clicks,
        total_impressions: metrics.impressions,
        avg_position: metrics.avg_position || null,
        optimizations_count: metrics.optimizations_count,
        email_sent: emailSent,
        sent_at: new Date().toISOString(),
        error_message: errorMessage,
      });

      results.push({ customerId, companyName, metrics, emailSent, error: errorMessage });

    } catch (err) {
      console.error(`${customerId} error:`, err.message);
      errorMessage = err.message;

      await logReport(bq, dataset, {
        report_id: reportId,
        customer_id: customerId,
        period_start: periodStart,
        period_end: periodEnd,
        total_clicks: 0,
        total_impressions: 0,
        avg_position: null,
        optimizations_count: 0,
        email_sent: false,
        sent_at: new Date().toISOString(),
        error_message: errorMessage,
      });

      results.push({ customerId, companyName: customerId, metrics: { clicks: 0, optimizations_count: 0 }, emailSent: false, error: err.message });
    }
  }

  // Skicka intern sammanfattning till Mikael
  try {
    if (transporter) {
      const internalHtml = buildInternalSummaryHtml(periodLabel, results);
      await transporter.sendMail({
        from: `Searchboost Opti <${fromEmail}>`,
        to: mikaelEmail,
        subject: `[Intern] Månadsrapporter skickade — ${periodLabel} (${results.filter(r => r.emailSent).length}/${results.length})`,
        html: internalHtml,
      });
      console.log('Intern sammanfattning skickad till Mikael');
    }
  } catch (e) {
    console.error('Intern sammanfattning fel:', e.message);
  }

  const summary = {
    period: periodLabel,
    total_customers: results.length,
    emails_sent: results.filter(r => r.emailSent).length,
    errors: results.filter(r => r.error).length,
  };

  console.log('Monthly report completed:', JSON.stringify(summary));
  return { statusCode: 200, body: JSON.stringify(summary) };
};
