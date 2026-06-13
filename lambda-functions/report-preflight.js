/**
 * report-preflight — Dag-före-kontroll inför vecko-/månadsrapporter
 *
 * Körs dagen innan rapportutskick (torsdag för veckorapport, sista dagen
 * i månaden för månadsrapport) och kontrollerar per aktiv kund att:
 *   1. Det finns loggat arbete i seo_optimization_log inom rapportfönstret.
 *      (Annars skulle ett "tomt" åtgärdsmail riskeras — kunden flaggas.)
 *   2. Åtgärdsplanen (action_plans) följts — öppna uppgifter listas så
 *      Mikael hinner slutföra och logga dem innan utskick.
 *
 * Skickar ENDAST ett internt mail till Mikael. Skickar aldrig kundmail.
 *
 * Event:
 *   - report_type: 'weekly' (default) | 'monthly' — styr fönstret (7 vs 30 dagar)
 *   - dry_run: true → bygg rapporten men skicka inget mail (returnera HTML)
 *
 * Datakällor:
 *   - BigQuery: customer_pipeline (aktiva kunder, stage='aktiv')
 *   - BigQuery: seo_optimization_log (loggat arbete)
 *   - BigQuery: action_plans (öppna uppgifter)
 *   - SSM: SMTP + mottagare
 */
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const nodemailer = require('nodemailer');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// Öppna action_plan-statusar = uppgifter som ännu inte slutförts.
const OPEN_PLAN_STATUSES = ['planned', 'queued', 'pending'];

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

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

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  const bq = new BigQuery({ projectId: 'seo-aouto' });
  const _origDs = bq.dataset.bind(bq);
  bq.dataset = (n, o = {}) => _origDs(n, { projectId, ...o });
  const _origQuery = bq.query.bind(bq);
  bq.query = (arg, ...rest) => {
    const opts = typeof arg === 'string' ? { query: arg } : { ...arg };
    if (!opts.defaultDataset) opts.defaultDataset = { datasetId: dataset, projectId };
    return _origQuery(opts, ...rest);
  };
  return { bq, dataset };
}

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPreflightHtml(reportType, windowDays, rows, sendDateLabel) {
  const blockers = rows.filter(r => r.work_count === 0);
  const openTasksTotal = rows.reduce((s, r) => s + r.open_plans, 0);
  const reportName = reportType === 'monthly' ? 'månadsrapport' : 'veckorapport';

  const customerSections = rows.map(r => {
    const isBlocker = r.work_count === 0;
    const statusColor = isBlocker ? '#e53935' : (r.open_plans > 0 ? '#ffa000' : '#00c853');
    const statusText = isBlocker
      ? 'INGET ARBETE LOGGAT — mail uteblir'
      : (r.open_plans > 0 ? `${r.open_plans} öppna åtgärder kvar` : 'Klar — arbete loggat, inga öppna åtgärder');

    const taskRows = r.open_tasks.map(t =>
      `<li style="margin-bottom:4px;font-size:12px;color:#555">${escapeHtml(t.task_description || t.task_type || 'Uppgift')}` +
      `${t.target_url ? ` <span style="color:#999">${escapeHtml(t.target_url)}</span>` : ''}</li>`
    ).join('');

    return `
    <div style="margin-bottom:14px;border:1px solid #e8e8e8;border-left:4px solid ${statusColor};border-radius:6px;overflow:hidden">
      <div style="background:#f8f9fa;padding:10px 14px">
        <strong style="font-size:14px">${escapeHtml(r.company_name)}</strong>
        <span style="float:right;font-size:12px;color:${statusColor};font-weight:600">${statusText}</span>
      </div>
      <div style="padding:10px 14px;font-size:12px;color:#666">
        Loggat arbete (senaste ${windowDays} dagar): <strong>${r.work_count}</strong> åtgärder
        ${r.open_tasks.length > 0 ? `
        <div style="margin-top:8px">
          <div style="font-size:11px;color:#999;text-transform:uppercase;margin-bottom:4px">Öppna åtgärder i planen</div>
          <ul style="margin:0;padding-left:18px">${taskRows}</ul>
        </div>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'IBM Plex Sans',Helvetica,Arial,sans-serif;max-width:640px;margin:0 auto;color:#0e0c19;background:#fff">
  <div style="background:#db007f;padding:24px;text-align:center">
    <p style="color:#fff;font-size:18px;font-weight:700;margin:0">Dag-före-kontroll inför ${reportName}</p>
    <p style="color:rgba(255,255,255,0.9);margin:4px 0 0;font-size:13px">Utskick planerat: ${sendDateLabel}</p>
  </div>
  <div style="padding:24px">
    <div style="margin-bottom:20px;padding:14px 16px;border-radius:8px;background:${blockers.length > 0 ? '#fff3f3' : '#f1f8f1'};border-left:4px solid ${blockers.length > 0 ? '#e53935' : '#00c853'}">
      <div style="font-size:15px;font-weight:600;color:${blockers.length > 0 ? '#e53935' : '#2e7d32'}">
        ${blockers.length > 0
          ? `${blockers.length} kund${blockers.length === 1 ? '' : 'er'} saknar loggat arbete — åtgärda innan ${sendDateLabel}`
          : 'Alla aktiva kunder har loggat arbete — inga tomma mail'}
      </div>
      <div style="font-size:13px;color:#666;margin-top:6px">
        ${rows.length} aktiva kunder · ${openTasksTotal} öppna åtgärder totalt i planerna
      </div>
    </div>
    ${customerSections}
    <p style="font-size:12px;color:#999;margin-top:20px">
      Kunder utan loggat arbete får inget åtgärdsmail (tom-mail-gaten i rapport-Lambdan).
      Logga arbetet i seo_work_queue / dashboarden innan utskicket så att mailet går ut.
    </p>
  </div>
</body>
</html>`;
}

exports.handler = async (event = {}) => {
  const reportType = event.report_type === 'monthly' ? 'monthly' : 'weekly';
  const windowDays = reportType === 'monthly' ? 30 : 7;
  const dryRun = event.dry_run === true;

  // Beräkna utskicksdatum (dagen efter kontrollen).
  const sendDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const sendDateLabel = sendDate.toLocaleDateString('sv-SE', { weekday: 'long', day: 'numeric', month: 'long' });

  try {
    const { bq, dataset } = await getBigQuery();

    const [customers] = await bq.query({
      query: `SELECT customer_id, company_name
              FROM \`${dataset}.customer_pipeline\`
              WHERE stage = 'aktiv'
              ORDER BY company_name`
    });

    const rows = [];
    for (const c of customers) {
      const [[workRow]] = await bq.query({
        query: `SELECT COUNT(*) AS cnt
                FROM \`${dataset}.seo_optimization_log\`
                WHERE customer_id = @cid
                  AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @days DAY)`,
        params: { cid: c.customer_id, days: windowDays }
      }).catch(() => [[{ cnt: 0 }]]);

      const [openTasks] = await bq.query({
        query: `SELECT task_type, task_description, target_url, priority
                FROM \`${dataset}.action_plans\`
                WHERE customer_id = @cid
                  AND status IN UNNEST(@statuses)
                ORDER BY priority ASC
                LIMIT 10`,
        params: { cid: c.customer_id, statuses: OPEN_PLAN_STATUSES }
      }).catch(() => [[]]);

      rows.push({
        customer_id: c.customer_id,
        company_name: c.company_name || c.customer_id,
        work_count: Number(workRow ? workRow.cnt : 0),
        open_plans: openTasks.length,
        open_tasks: openTasks
      });
    }

    const blockers = rows.filter(r => r.work_count === 0).map(r => r.company_name);
    const html = buildPreflightHtml(reportType, windowDays, rows, sendDateLabel);

    if (dryRun) {
      console.log(`[dry_run] Pre-flight ${reportType}: ${rows.length} kunder, ${blockers.length} utan arbete`);
      return {
        statusCode: 200,
        body: JSON.stringify({ dry_run: true, report_type: reportType, customers: rows.length, blockers, html })
      };
    }

    const emailFrom = await getParam('/seo-mcp/email/from');
    const recipients = (await getParam('/seo-mcp/email/recipients')).split(',').map(e => e.trim());
    const transporter = await getTransporter();

    const subjectFlag = blockers.length > 0 ? `⚠ ${blockers.length} utan arbete` : 'allt loggat';
    await transporter.sendMail({
      from: `"Searchboost Opti" <${emailFrom}>`,
      to: recipients.join(', '),
      subject: `Dag-före-kontroll ${reportType === 'monthly' ? 'månadsrapport' : 'veckorapport'} — ${subjectFlag}`,
      html
    ,
        textEncoding: 'base64',
        headers: { 'Content-Language': 'sv-SE' }
      });

    console.log(`Pre-flight ${reportType} skickad till ${recipients.join(', ')} — ${blockers.length} blockerare`);
    return {
      statusCode: 200,
      body: JSON.stringify({ sent: true, report_type: reportType, customers: rows.length, blockers })
    };
  } catch (err) {
    console.error('Pre-flight failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
