/**
 * GSC Regression Watcher Lambda
 *
 * Körs dagligen 06:00 CET. För varje URL i seo_optimization_log senaste 14 dagar:
 *   1. Hämtar avg position 7d FÖRE optimering
 *   2. Hämtar avg position 7d EFTER optimering
 *   3. Om position dropade >5 ranks → flagga som regression
 *   4. Skickar mail till mikael@searchboost.se med lista
 *   5. Loggar i BigQuery: seo_regression_log (auto-skapas)
 *
 * Förebygger silent regressions från autonom optimering.
 *
 * EventBridge: cron(0 4 * * ? *)  (06:00 CET)
 */
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const nodemailer = require('nodemailer');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

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

async function ensureRegressionLogTable(bq, dataset) {
  const schema = [
    { name: 'detected_at', type: 'TIMESTAMP', mode: 'REQUIRED' },
    { name: 'customer_id', type: 'STRING', mode: 'REQUIRED' },
    { name: 'url', type: 'STRING', mode: 'REQUIRED' },
    { name: 'optimization_id', type: 'STRING', mode: 'NULLABLE' },
    { name: 'optimization_type', type: 'STRING', mode: 'NULLABLE' },
    { name: 'optimized_at', type: 'TIMESTAMP', mode: 'NULLABLE' },
    { name: 'position_before', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'position_after', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'position_drop', type: 'FLOAT', mode: 'NULLABLE' },
    { name: 'clicks_before', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'clicks_after', type: 'INTEGER', mode: 'NULLABLE' },
    { name: 'severity', type: 'STRING', mode: 'NULLABLE' },
    { name: 'alert_sent', type: 'BOOLEAN', mode: 'NULLABLE' },
  ];
  try {
    const table = bq.dataset(dataset).table('seo_regression_log');
    const [exists] = await table.exists();
    if (!exists) {
      await bq.dataset(dataset).createTable('seo_regression_log', { schema });
      console.log('Created seo_regression_log table');
    }
  } catch (e) {
    console.error('ensureRegressionLogTable:', e.message);
  }
}

let _transporter = null;
async function getTransporter() {
  if (_transporter) return _transporter;
  const host = await getParam('/seo-mcp/email/smtp-host').catch(() => null);
  const user = await getParam('/seo-mcp/email/username').catch(() => null);
  const pass = await getParam('/seo-mcp/email/password').catch(() => null);
  if (host && user && pass) {
    _transporter = nodemailer.createTransport({
      host, port: 587, secure: false,
      auth: { user, pass },
      tls: { rejectUnauthorized: false }
    });
  }
  return _transporter;
}

/**
 * Hitta regressioner: optimeringar gjorda för 7-14 dagar sedan,
 * jämför position 7d innan vs 7d efter optimering.
 */
async function findRegressions(bq, dataset) {
  const sql = `
WITH recent_opts AS (
  SELECT
    optimization_id,
    customer_id,
    url,
    optimization_type,
    created_at as optimized_at,
    DATE(created_at) as opt_date
  FROM \`${bq.projectId}.${dataset}.seo_optimization_log\`
  WHERE created_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 14 DAY)
    AND created_at < TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)
    AND url IS NOT NULL
),
gsc_before AS (
  SELECT
    o.optimization_id,
    AVG(g.position) as pos_before,
    SUM(g.clicks) as clicks_before
  FROM recent_opts o
  JOIN \`${bq.projectId}.${dataset}.gsc_daily_metrics\` g
    ON g.customer_id = o.customer_id
    AND g.page = o.url
    AND g.date BETWEEN DATE_SUB(o.opt_date, INTERVAL 7 DAY) AND o.opt_date
  GROUP BY o.optimization_id
),
gsc_after AS (
  SELECT
    o.optimization_id,
    AVG(g.position) as pos_after,
    SUM(g.clicks) as clicks_after
  FROM recent_opts o
  JOIN \`${bq.projectId}.${dataset}.gsc_daily_metrics\` g
    ON g.customer_id = o.customer_id
    AND g.page = o.url
    AND g.date BETWEEN DATE_ADD(o.opt_date, INTERVAL 1 DAY) AND DATE_ADD(o.opt_date, INTERVAL 7 DAY)
  GROUP BY o.optimization_id
)
SELECT
  o.optimization_id,
  o.customer_id,
  o.url,
  o.optimization_type,
  o.optimized_at,
  b.pos_before,
  a.pos_after,
  (a.pos_after - b.pos_before) as position_drop,
  b.clicks_before,
  a.clicks_after
FROM recent_opts o
JOIN gsc_before b USING(optimization_id)
JOIN gsc_after a USING(optimization_id)
WHERE (a.pos_after - b.pos_before) > 5
ORDER BY (a.pos_after - b.pos_before) DESC
LIMIT 50
`;

  try {
    const [rows] = await bq.query({ query: sql });
    return rows;
  } catch (e) {
    console.error('Regression query error:', e.message);
    return [];
  }
}

function severity(drop) {
  if (drop >= 20) return 'critical';
  if (drop >= 10) return 'high';
  if (drop >= 5) return 'medium';
  return 'low';
}

function buildAlertHtml(regressions) {
  const rows = regressions.map(r => `
    <tr style="border-bottom:1px solid #eee">
      <td style="padding:8px;font-size:13px"><a href="${r.url}" style="color:#0e0c19">${r.url.substring(0, 60)}</a></td>
      <td style="padding:8px;font-size:13px;text-align:center">${r.customer_id}</td>
      <td style="padding:8px;font-size:13px;text-align:center">${r.optimization_type}</td>
      <td style="padding:8px;font-size:13px;text-align:center">${r.pos_before?.toFixed(1) || '?'}</td>
      <td style="padding:8px;font-size:13px;text-align:center">${r.pos_after?.toFixed(1) || '?'}</td>
      <td style="padding:8px;font-size:13px;text-align:center;color:#cc0000">+${r.position_drop?.toFixed(1)}</td>
      <td style="padding:8px;font-size:13px;text-align:center;color:#888">${severity(r.position_drop)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="sv">
<head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;padding:24px;max-width:900px">
  <h2 style="color:#cc0000">⚠ SEO-regressioner upptäckta — ${regressions.length} URL(s)</h2>
  <p>Följande URL:er har dropat ranking efter en autonom optimering. Kolla om optimeringen ska rullas tillbaka.</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:13px">
    <tr style="background:#f0f0f0">
      <th style="padding:8px;text-align:left">URL</th>
      <th style="padding:8px">Kund</th>
      <th style="padding:8px">Typ</th>
      <th style="padding:8px">Pos. före</th>
      <th style="padding:8px">Pos. efter</th>
      <th style="padding:8px">Drop</th>
      <th style="padding:8px">Severity</th>
    </tr>
    ${rows}
  </table>
  <p style="color:#888;font-size:12px;margin-top:24px">
    Lambda: seo-regression-watcher · Körs 06:00 CET dagligen.<br>
    Tröskel: position-drop >5 ranks 7d efter optimering.<br>
    Källa: BigQuery seo_optimization_log JOIN gsc_daily_metrics.
  </p>
</body>
</html>`;
}

exports.handler = async (event) => {
  console.log('Regression watcher started', new Date().toISOString());

  const { bq, dataset } = await getBigQuery();
  await ensureRegressionLogTable(bq, dataset);

  const regressions = await findRegressions(bq, dataset);
  console.log(`Found ${regressions.length} regressions`);

  if (regressions.length === 0) {
    return { statusCode: 200, body: JSON.stringify({ regressions: 0 }) };
  }

  // Logga i BQ
  const rows = regressions.map(r => ({
    detected_at: new Date().toISOString(),
    customer_id: r.customer_id,
    url: r.url,
    optimization_id: r.optimization_id,
    optimization_type: r.optimization_type,
    optimized_at: r.optimized_at?.value || r.optimized_at,
    position_before: r.pos_before,
    position_after: r.pos_after,
    position_drop: r.position_drop,
    clicks_before: r.clicks_before || 0,
    clicks_after: r.clicks_after || 0,
    severity: severity(r.position_drop),
    alert_sent: false,
  }));

  try {
    await bq.dataset(dataset).table('seo_regression_log').insert(rows);
  } catch (e) {
    console.error('Insert error:', e.message);
  }

  // Skicka mail till Mikael
  const transporter = await getTransporter();
  if (transporter) {
    const fromEmail = await getParam('/seo-mcp/email/from').catch(() => 'noreply@searchboost.se');
    const mikaelEmail = await getParam('/seo-mcp/email/recipients').catch(() => 'mikael@searchboost.se');
    try {
      await transporter.sendMail({
        from: `Searchboost Watchdog <${fromEmail}>`,
        to: mikaelEmail,
        subject: `[Regression] ${regressions.length} SEO-droppar upptäckta`,
        html: buildAlertHtml(regressions),
      });
      console.log('Alert mail skickat till', mikaelEmail);
    } catch (e) {
      console.error('Mail error:', e.message);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      regressions: regressions.length,
      severity_counts: {
        critical: regressions.filter(r => severity(r.position_drop) === 'critical').length,
        high: regressions.filter(r => severity(r.position_drop) === 'high').length,
        medium: regressions.filter(r => severity(r.position_drop) === 'medium').length,
      }
    })
  };
};
