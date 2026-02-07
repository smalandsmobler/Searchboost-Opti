/**
 * Weekly Report Lambda — Körs varje måndag 08:00 UTC
 * Sammanställer veckans SEO-arbete och skickar rapport via SES.
 */
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: REGION });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getBigQuery() {
  const creds = JSON.parse(await getParam('/seo-mcp/bigquery/credentials'));
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  return { bq: new BigQuery({ projectId, credentials: creds }), dataset };
}

function buildReportHTML(optimizations, queueStats, weekLabel) {
  const byType = {};
  const bySite = {};

  for (const opt of optimizations) {
    byType[opt.optimization_type] = (byType[opt.optimization_type] || 0) + 1;
    bySite[opt.site_url] = (bySite[opt.site_url] || 0) + 1;
  }

  const typeRows = Object.entries(byType)
    .map(([type, count]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${type}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${count}</td></tr>`)
    .join('');

  const siteRows = Object.entries(bySite)
    .map(([site, count]) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${site}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${count}</td></tr>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;color:#0e0c19">
  <div style="background:#db007f;padding:24px;text-align:center">
    <h1 style="color:white;margin:0;font-size:24px">Searchboost Opti</h1>
    <p style="color:rgba(255,255,255,0.9);margin:8px 0 0">Veckorapport SEO — ${weekLabel}</p>
  </div>

  <div style="padding:24px">
    <div style="display:flex;gap:16px;margin-bottom:24px">
      <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:32px;font-weight:700;color:#db007f">${optimizations.length}</div>
        <div style="font-size:13px;color:#666">Optimeringar</div>
      </div>
      <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:32px;font-weight:700;color:#db007f">${Object.keys(bySite).length}</div>
        <div style="font-size:13px;color:#666">Sites</div>
      </div>
      <div style="flex:1;background:#f8f9fa;border-radius:8px;padding:16px;text-align:center">
        <div style="font-size:32px;font-weight:700;color:#db007f">${queueStats.pending || 0}</div>
        <div style="font-size:13px;color:#666">I kö</div>
      </div>
    </div>

    <h2 style="color:#0e0c19;font-size:18px;border-bottom:2px solid #db007f;padding-bottom:8px">Per optimeringstyp</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f8f9fa"><th style="padding:8px;text-align:left">Typ</th><th style="padding:8px;text-align:center">Antal</th></tr>
      ${typeRows || '<tr><td colspan="2" style="padding:8px;color:#999">Inga optimeringar denna vecka</td></tr>'}
    </table>

    <h2 style="color:#0e0c19;font-size:18px;border-bottom:2px solid #db007f;padding-bottom:8px;margin-top:24px">Per site</h2>
    <table style="width:100%;border-collapse:collapse">
      <tr style="background:#f8f9fa"><th style="padding:8px;text-align:left">Site</th><th style="padding:8px;text-align:center">Optimeringar</th></tr>
      ${siteRows || '<tr><td colspan="2" style="padding:8px;color:#999">Inga sites processade</td></tr>'}
    </table>

    ${optimizations.length > 0 ? `
    <h2 style="color:#0e0c19;font-size:18px;border-bottom:2px solid #db007f;padding-bottom:8px;margin-top:24px">Senaste ändringar</h2>
    <ul style="padding-left:20px">
      ${optimizations.slice(0, 10).map(o => `<li style="margin-bottom:8px"><strong>${o.optimization_type}</strong> på <a href="${o.page_url}" style="color:#db007f">${o.page_url}</a></li>`).join('')}
    </ul>
    ` : ''}
  </div>

  <div style="background:#f8f9fa;padding:16px;text-align:center;font-size:12px;color:#999">
    <p>Searchboost Opti — Automatisk SEO-optimering</p>
    <p>searchboost.se</p>
  </div>
</body>
</html>`;
}

exports.handler = async (event) => {
  console.log('=== Weekly Report Started ===');

  try {
    const { bq, dataset } = await getBigQuery();
    const emailFrom = await getParam('/seo-mcp/email/from');
    const emailTo = (await getParam('/seo-mcp/email/recipients')).split(',').map(e => e.trim());

    // Get this week's optimizations
    const [optimizations] = await bq.query({
      query: `SELECT * FROM \`${dataset}.seo_optimization_log\` WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY) ORDER BY timestamp DESC`
    });

    // Get queue stats
    const [queueRows] = await bq.query({
      query: `SELECT status, COUNT(*) as count FROM \`${dataset}.seo_work_queue\` GROUP BY status`
    });
    const queueStats = {};
    for (const row of queueRows) {
      queueStats[row.status] = row.count;
    }

    const now = new Date();
    const weekLabel = `Vecka ${getWeekNumber(now)}, ${now.getFullYear()}`;

    const html = buildReportHTML(optimizations, queueStats, weekLabel);

    // Send email via SES
    await ses.send(new SendEmailCommand({
      Source: emailFrom,
      Destination: { ToAddresses: emailTo },
      Message: {
        Subject: { Data: `SEO Veckorapport — ${weekLabel} — ${optimizations.length} optimeringar`, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } }
      }
    }));

    // Store report in BigQuery
    await bq.dataset(dataset).table('weekly_reports').insert([{
      email_sent_at: now.toISOString(),
      customer_id: 'all',
      report_html: html,
      metrics_json: JSON.stringify({ total: optimizations.length, byType: {}, bySite: {}, queueStats }),
      recipient_list: emailTo
    }]);

    console.log(`=== Report sent to ${emailTo.join(', ')} ===`);
    return { statusCode: 200, body: JSON.stringify({ sent: true, recipients: emailTo, optimizations: optimizations.length }) };
  } catch (err) {
    console.error('Report failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function getWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
}
