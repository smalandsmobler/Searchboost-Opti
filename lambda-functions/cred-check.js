/**
 * cred-check — Daglig credential sanity-check på alla aktiva kunder.
 *
 * Körs via EventBridge varje morgon 06:00 CET. Testar varje kunds
 * WP-credentials live via REST API, rapporterar till BigQuery
 * customer_cred_status, och larmar om credentialer går sönder
 * (rotation, WP-uppgradering, plugin-konflikt osv).
 *
 * Tre outputs:
 *  1. BigQuery insert: customer_cred_status (historik)
 *  2. Om någon kund ändrat status (OK → FAIL): SNS-larm
 *  3. CloudWatch log: full rapport
 */
const https = require('https');
const { BigQuery } = require('@google-cloud/bigquery');
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });
const sns = new SNSClient({ region: REGION });

const PROJECT_ID = 'searchboost-485810';
const DATASET = 'seo_data';
const SNS_TOPIC = process.env.SNS_TOPIC_ARN
  || 'arn:aws:sns:eu-north-1:176823989073:seo-optimizer-alerts';

const ACTIVE_CUSTOMERS = [
  'searchboost', 'ilmonte', 'mobelrondellen', 'tobler',
  'traficator', 'jelmtech', 'smalandskontorsmobler', 'humanpower',
];

async function getParam(name, withDecryption = false) {
  try {
    const r = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: withDecryption }));
    return r.Parameter.Value;
  } catch (e) {
    return null;
  }
}

function httpsGet(urlString, headers = {}, timeout = 15000) {
  return new Promise((resolve) => {
    const u = new URL(urlString);
    const req = https.request({
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: 'GET',
      headers: { 'User-Agent': 'Mozilla/5.0 SBS-CredCheck-Lambda', ...headers },
      timeout,
    }, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try { resolve({ status: res.statusCode, json: JSON.parse(body) }); }
        catch { resolve({ status: res.statusCode, json: null, body }); }
      });
    });
    req.on('error', (e) => resolve({ status: null, error: e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ status: null, error: 'timeout' }); });
    req.end();
  });
}

async function checkCustomer(cust) {
  const out = {
    customer_id: cust,
    checked_at: new Date().toISOString(),
    url: null, user: null,
    auth_ok: false, role: null,
    can_edit_posts: false,
    can_publish_posts: false,
    can_manage_options: false,
    code_snippets: false,
    rank_math: false,
    woocommerce: false,
    error: null,
  };

  const url = await getParam(`/seo-mcp/wordpress/${cust}/url`);
  const user = await getParam(`/seo-mcp/wordpress/${cust}/username`);
  const app = await getParam(`/seo-mcp/wordpress/${cust}/app-password`, true);

  out.url = url;
  out.user = user;

  if (!url || !user || !app || app === 'placeholder') {
    out.error = 'ssm_creds_missing';
    return out;
  }

  const auth = Buffer.from(`${user}:${app}`).toString('base64');
  const headers = { Authorization: `Basic ${auth}` };

  const me = await httpsGet(`${url.replace(/\/$/, '')}/wp-json/wp/v2/users/me?context=edit`, headers);
  if (me.status !== 200 || !me.json) {
    out.error = `auth_failed_${me.status || 'network'}`;
    return out;
  }

  out.auth_ok = true;
  const roles = me.json.roles || [];
  out.role = roles[0] || null;
  const caps = me.json.capabilities || {};
  out.can_edit_posts = !!caps.edit_posts;
  out.can_publish_posts = !!caps.publish_posts;
  out.can_manage_options = !!caps.manage_options;

  const ns = await httpsGet(`${url.replace(/\/$/, '')}/wp-json/`, headers);
  if (ns.status === 200 && ns.json) {
    const namespaces = ns.json.namespaces || [];
    out.code_snippets = namespaces.includes('code-snippets/v1');
    out.rank_math = namespaces.includes('rankmath/v1');
    out.woocommerce = namespaces.some((n) => n.startsWith('wc/'));
  }

  return out;
}

async function getPreviousStatus(bq) {
  try {
    const [rows] = await bq.query({
      query: `
        SELECT customer_id, auth_ok
        FROM \`${PROJECT_ID}.${DATASET}.customer_cred_status\`
        WHERE checked_at = (
          SELECT MAX(checked_at) FROM \`${PROJECT_ID}.${DATASET}.customer_cred_status\`
          WHERE checked_at < CURRENT_TIMESTAMP()
        )
      `,
    });
    const map = {};
    for (const r of rows) map[r.customer_id] = r.auth_ok;
    return map;
  } catch (err) {
    console.log('No previous status (first run?):', err.message);
    return {};
  }
}

async function alert(subject, message) {
  try {
    await sns.send(new PublishCommand({ TopicArn: SNS_TOPIC, Subject: subject.slice(0, 100), Message: message }));
  } catch (e) {
    console.error('SNS publish failed:', e.message);
  }
}

exports.handler = async () => {
  // BQ credentials
  const bqCredRaw = await getParam('/seo-mcp/bigquery/credentials', true);
  const bqCred = JSON.parse(bqCredRaw);
  const bq = new BigQuery({ projectId: PROJECT_ID, credentials: bqCred });

  // Ensure table exists
  const tableRef = `${PROJECT_ID}.${DATASET}.customer_cred_status`;
  await bq.query({
    query: `
      CREATE TABLE IF NOT EXISTS \`${tableRef}\` (
        checked_at TIMESTAMP,
        customer_id STRING,
        url STRING,
        user STRING,
        auth_ok BOOL,
        role STRING,
        can_edit_posts BOOL,
        can_publish_posts BOOL,
        can_manage_options BOOL,
        code_snippets BOOL,
        rank_math BOOL,
        woocommerce BOOL,
        error STRING
      )
      PARTITION BY DATE(checked_at)
      CLUSTER BY customer_id
    `,
  });

  const prev = await getPreviousStatus(bq);

  // Check all customers in parallel
  const results = await Promise.all(ACTIVE_CUSTOMERS.map(checkCustomer));

  // Insert to BQ
  await bq.dataset(DATASET).table('customer_cred_status').insert(results);

  // Detect status changes
  const newlyFailed = [];
  const recovered = [];
  for (const r of results) {
    const was = prev[r.customer_id];
    if (was === true && !r.auth_ok) newlyFailed.push(r);
    if (was === false && r.auth_ok) recovered.push(r);
  }

  if (newlyFailed.length > 0) {
    const msg = [
      'KRITISKT: WP-credentials slutade fungera på en eller flera kunder',
      '',
      ...newlyFailed.map((r) => `${r.customer_id}: ${r.error} (${r.url})`),
      '',
      'Kör cred_check.py lokalt för att verifiera + åtgärda i SSM.',
    ].join('\n');
    await alert(`[CRED-CHECK] ${newlyFailed.length} kunder tappade access`, msg);
  }

  if (recovered.length > 0) {
    const msg = recovered.map((r) => `${r.customer_id} (${r.url})`).join('\n');
    await alert(`[CRED-CHECK] ${recovered.length} kunder återfick access`, msg);
  }

  const ok = results.filter((r) => r.auth_ok).length;
  const fail = results.length - ok;
  console.log(`✓ Cred-check klar: ${ok} OK / ${fail} fail`);
  return {
    statusCode: 200,
    total: results.length,
    ok, fail,
    newly_failed: newlyFailed.map((r) => r.customer_id),
    recovered: recovered.map((r) => r.customer_id),
  };
};
