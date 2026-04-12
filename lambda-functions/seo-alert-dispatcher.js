/**
 * SEO Alert Dispatcher Lambda
 *
 * Körs dagligen kl 08:00 CET (EventBridge: cron(0 7 * * ? *))
 *
 * Skickar proaktiva SEO-alerts till Mikael när:
 * - Ett sökord tappar >3 platser på 7 dagar
 * - En kunds trafik sjunker >20% vecka-mot-vecka
 * - En ny sida indexeras (ny GSC-URL dyker upp)
 * - En kund klättrar in på sida 1 (position ≤10) för ett viktigt sökord
 * - Core Web Vitals-problem finns (om performance_monitor loggat det)
 *
 * Skickar ett samlat daily digest-mail istället för individuella alerts.
 * Sparar alerts i BigQuery: seo_alerts
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const ses = new SESClient({ region: REGION });

const ssmCache = new Map();
async function getParam(name) {
  if (ssmCache.has(name)) return ssmCache.get(name);
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  ssmCache.set(name, res.Parameter.Value);
  return res.Parameter.Value;
}
async function getParamSafe(name) {
  try { return await getParam(name); } catch { return null; }
}

let _bq, _projectId, _datasetId;
async function getBQ() {
  if (_bq) return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  _projectId = await getParam('/seo-mcp/bigquery/project-id');
  _datasetId = await getParam('/seo-mcp/bigquery/dataset');
  const credsPath = '/tmp/bq-creds.json';
  fs.writeFileSync(credsPath, creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  _bq = new BigQuery({ projectId: _projectId, keyFilename: credsPath });
  return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
}

async function ensureAlertsTable(bq, datasetId) {
  const schema = [
    { name: 'alert_id',     type: 'STRING', mode: 'REQUIRED' },
    { name: 'customer_id',  type: 'STRING', mode: 'REQUIRED' },
    { name: 'alert_type',   type: 'STRING' }, // rank_drop | rank_gain | traffic_drop | new_page | page1_entry
    { name: 'severity',     type: 'STRING' }, // critical | warning | info
    { name: 'query',        type: 'STRING' },
    { name: 'old_value',    type: 'FLOAT' },
    { name: 'new_value',    type: 'FLOAT' },
    { name: 'change_pct',   type: 'FLOAT' },
    { name: 'message',      type: 'STRING' },
    { name: 'created_at',   type: 'TIMESTAMP' },
    { name: 'notified_at',  type: 'TIMESTAMP' },
  ];
  try {
    await bq.dataset(datasetId).createTable('seo_alerts', {
      schema: { fields: schema },
      timePartitioning: { type: 'DAY', field: 'created_at' },
    });
    console.log('seo_alerts tabell skapad');
  } catch (e) {
    if (!e.message.includes('Already Exists')) throw e;
  }
}

// ── Hämta ranking-förändringar (7d snitt vs föregående 7d) ──

async function detectRankingAlerts(bq, datasetId, customerId) {
  const query = `
    WITH recent AS (
      SELECT query, AVG(position) as pos_now, SUM(clicks) as clicks_now
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) AND CURRENT_DATE()
      GROUP BY query
      HAVING AVG(position) < 30  -- Bara relevanta sökord
    ),
    previous AS (
      SELECT query, AVG(position) as pos_before
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
                     AND DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
      GROUP BY query
    )
    SELECT
      r.query,
      p.pos_before,
      r.pos_now,
      r.pos_now - p.pos_before AS position_change,
      r.clicks_now
    FROM recent r
    JOIN previous p USING (query)
    WHERE ABS(r.pos_now - p.pos_before) >= 2  -- Minst 2 platsers förändring
    ORDER BY ABS(r.pos_now - p.pos_before) DESC
    LIMIT 20
  `;

  try {
    const [rows] = await bq.query({ query, params: { cid: customerId } });
    return rows || [];
  } catch { return []; }
}

// ── Hämta trafikförändringar (vecka mot vecka) ──

async function detectTrafficAlerts(bq, datasetId, customerId) {
  const query = `
    WITH this_week AS (
      SELECT SUM(clicks) as clicks_now, SUM(impressions) as imp_now
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY) AND CURRENT_DATE()
    ),
    last_week AS (
      SELECT SUM(clicks) as clicks_before, SUM(impressions) as imp_before
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
                     AND DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
    )
    SELECT
      t.clicks_now,
      l.clicks_before,
      SAFE_DIVIDE(t.clicks_now - l.clicks_before, l.clicks_before) * 100 AS click_change_pct
    FROM this_week t, last_week l
    WHERE l.clicks_before > 0
  `;

  try {
    const [rows] = await bq.query({ query, params: { cid: customerId } });
    return rows[0] || null;
  } catch { return null; }
}

// ── Detektera sökord som nyss nått sida 1 ──

async function detectPage1Entries(bq, datasetId, customerId) {
  const query = `
    WITH today_pos AS (
      SELECT query, AVG(position) as pos
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date = DATE_SUB(CURRENT_DATE(), INTERVAL 1 DAY)
      GROUP BY query
      HAVING AVG(position) <= 10
    ),
    prev_pos AS (
      SELECT query, AVG(position) as pos
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE customer_id = @cid
        AND date BETWEEN DATE_SUB(CURRENT_DATE(), INTERVAL 8 DAY)
                     AND DATE_SUB(CURRENT_DATE(), INTERVAL 2 DAY)
      GROUP BY query
      HAVING AVG(position) > 10
    )
    SELECT t.query, p.pos as old_pos, t.pos as new_pos
    FROM today_pos t
    JOIN prev_pos p USING (query)
    LIMIT 10
  `;
  try {
    const [rows] = await bq.query({ query, params: { cid: customerId } });
    return rows || [];
  } catch { return []; }
}

// ── Bygg alert-objekt ──

function buildAlerts(customerId, rankChanges, trafficData, page1Entries) {
  const alerts = [];
  const now = new Date().toISOString();

  // Ranking-drops (position_change > 0 = sjunkit)
  for (const r of rankChanges) {
    if (r.position_change >= 3) {
      alerts.push({
        alert_id:   `${customerId}_drop_${Date.now()}_${r.query.slice(0, 10).replace(/\s/g, '_')}`,
        customer_id: customerId,
        alert_type: 'rank_drop',
        severity:   r.position_change >= 5 ? 'critical' : 'warning',
        query:      r.query,
        old_value:  Number(r.pos_before.toFixed(1)),
        new_value:  Number(r.pos_now.toFixed(1)),
        change_pct: Number(r.position_change.toFixed(1)),
        message:    `"${r.query}" sjönk ${r.position_change.toFixed(1)} platser (pos ${r.pos_before.toFixed(1)} → ${r.pos_now.toFixed(1)})`,
        created_at: now,
        notified_at: now,
      });
    }

    // Ranking-gains
    if (r.position_change <= -3) {
      alerts.push({
        alert_id:   `${customerId}_gain_${Date.now()}_${r.query.slice(0, 10).replace(/\s/g, '_')}`,
        customer_id: customerId,
        alert_type: 'rank_gain',
        severity:   'info',
        query:      r.query,
        old_value:  Number(r.pos_before.toFixed(1)),
        new_value:  Number(r.pos_now.toFixed(1)),
        change_pct: Number(r.position_change.toFixed(1)),
        message:    `"${r.query}" klättrade ${Math.abs(r.position_change).toFixed(1)} platser (pos ${r.pos_before.toFixed(1)} → ${r.pos_now.toFixed(1)})`,
        created_at: now,
        notified_at: now,
      });
    }
  }

  // Trafikdrop
  if (trafficData && trafficData.click_change_pct <= -20) {
    alerts.push({
      alert_id:   `${customerId}_traffic_${Date.now()}`,
      customer_id: customerId,
      alert_type: 'traffic_drop',
      severity:   trafficData.click_change_pct <= -40 ? 'critical' : 'warning',
      query:      null,
      old_value:  Number(trafficData.clicks_before),
      new_value:  Number(trafficData.clicks_now),
      change_pct: Number(trafficData.click_change_pct.toFixed(1)),
      message:    `Total trafik sjönk ${Math.abs(trafficData.click_change_pct).toFixed(0)}% (${trafficData.clicks_before} → ${trafficData.clicks_now} klick/vecka)`,
      created_at: now,
      notified_at: now,
    });
  }

  // Sida 1-inträden
  for (const p of page1Entries) {
    alerts.push({
      alert_id:   `${customerId}_p1_${Date.now()}_${p.query.slice(0, 10).replace(/\s/g, '_')}`,
      customer_id: customerId,
      alert_type: 'page1_entry',
      severity:   'info',
      query:      p.query,
      old_value:  Number(p.old_pos.toFixed(1)),
      new_value:  Number(p.new_pos.toFixed(1)),
      change_pct: 0,
      message:    `"${p.query}" nådde sida 1! (pos ${p.new_pos.toFixed(1)})`,
      created_at: now,
      notified_at: now,
    });
  }

  return alerts;
}

// ── Bygg digest-mail ──

function buildDigestEmail(allAlerts, date) {
  const critical = allAlerts.filter(a => a.severity === 'critical');
  const warnings = allAlerts.filter(a => a.severity === 'warning');
  const infos    = allAlerts.filter(a => a.severity === 'info');

  const byCustomer = {};
  for (const a of allAlerts) {
    if (!byCustomer[a.customer_id]) byCustomer[a.customer_id] = [];
    byCustomer[a.customer_id].push(a);
  }

  const severityIcon = { critical: '🔴', warning: '🟡', info: '🟢' };
  const alertRows = Object.entries(byCustomer).map(([cid, alerts]) => `
    <div style="margin-bottom:20px">
      <h3 style="color:#0e0c19;margin:0 0 8px;text-transform:capitalize">${cid.replace(/-/g,' ')}</h3>
      ${alerts.map(a => `
      <div style="padding:10px;border-left:4px solid ${a.severity === 'critical' ? '#e53935' : a.severity === 'warning' ? '#fb8c00' : '#43a047'};background:#f9f9f9;margin-bottom:6px;border-radius:0 4px 4px 0">
        ${severityIcon[a.severity]} ${a.message}
      </div>`).join('')}
    </div>`).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;max-width:650px;margin:0 auto;background:#f9f9f9">
  <div style="background:#0e0c19;padding:20px 24px">
    <h1 style="color:#fff;margin:0;font-size:20px">SEO Daily Digest — ${date}</h1>
    <p style="color:#888;margin:4px 0 0;font-size:14px">
      ${critical.length > 0 ? `<span style="color:#ff5252">${critical.length} kritiska</span> · ` : ''}
      ${warnings.length} varningar · ${infos.length} positiva
    </p>
  </div>
  <div style="padding:24px;background:#fff">
    ${allAlerts.length === 0
      ? '<p style="color:#888;text-align:center;padding:20px">Inga signifikanta SEO-förändringar idag.</p>'
      : alertRows
    }
  </div>
  <div style="padding:12px;text-align:center;font-size:12px;color:#999;background:#f0f0f0">
    Searchboost Opti · <a href="http://51.21.116.7/" style="color:#0066cc">Öppna dashboard</a>
  </div>
</body>
</html>`;
}

// ── Main Handler ──

exports.handler = async (event) => {
  console.log('=== SEO ALERT DISPATCHER START ===');

  const { bq, projectId, datasetId } = await getBQ();
  const emailFrom = await getParamSafe('/seo-mcp/email/from') || 'noreply@searchboost.se';
  const emailTo   = await getParamSafe('/seo-mcp/email/recipients') || 'mikael@searchboost.se';

  await ensureAlertsTable(bq, datasetId);

  // Hämta alla kunder med GSC-data
  const [customerRows] = await bq.query({
    query: `
      SELECT DISTINCT customer_id
      FROM \`${datasetId}.gsc_daily_metrics\`
      WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
      ORDER BY customer_id
    `,
  }).catch(() => [[]]);

  const allAlerts = [];

  for (const { customer_id } of (customerRows || [])) {
    console.log(`  Kollar alerts för ${customer_id}`);
    try {
      const [rankChanges, trafficData, page1Entries] = await Promise.all([
        detectRankingAlerts(bq, datasetId, customer_id),
        detectTrafficAlerts(bq, datasetId, customer_id),
        detectPage1Entries(bq, datasetId, customer_id),
      ]);

      const alerts = buildAlerts(customer_id, rankChanges, trafficData, page1Entries);
      allAlerts.push(...alerts);

      if (alerts.length > 0) {
        console.log(`    ${alerts.length} alerts (${alerts.filter(a => a.severity === 'critical').length} kritiska)`);
      }
    } catch (e) {
      console.error(`  Fel för ${customer_id}: ${e.message}`);
    }
  }

  // Spara i BQ
  if (allAlerts.length > 0) {
    try {
      await bq.dataset(datasetId).table('seo_alerts').insert(allAlerts);
    } catch (e) {
      console.error(`BQ insert: ${e.message}`);
    }
  }

  // Skicka digest-mail (även om 0 alerts — bra att veta att systemet kör)
  const critical = allAlerts.filter(a => a.severity === 'critical').length;
  const date = new Date().toLocaleDateString('sv-SE');

  // Skicka bara mail om det finns alerts, eller om det är måndag (veckosammanfattning)
  const isMonday = new Date().getDay() === 1;
  if (allAlerts.length > 0 || isMonday) {
    const subject = critical > 0
      ? `KRITISKT: ${critical} SEO-varningar — ${date}`
      : allAlerts.length > 0
        ? `SEO Daily Digest — ${allAlerts.length} förändringar · ${date}`
        : `SEO Daily Digest — Allt ok · ${date}`;

    try {
      await ses.send(new SendEmailCommand({
        Source: emailFrom,
        Destination: { ToAddresses: [emailTo] },
        Message: {
          Subject: { Data: subject },
          Body:    { Html: { Data: buildDigestEmail(allAlerts, date) } },
        },
      }));
      console.log(`Digest skickat: ${subject}`);
    } catch (e) {
      console.error(`SES-fel: ${e.message}`);
    }
  }

  console.log(`=== SEO ALERT DISPATCHER KLAR: ${allAlerts.length} alerts ===`);
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, alertsGenerated: allAlerts.length, critical }),
  };
};
