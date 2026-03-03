/**
 * Security Monitor Lambda - Kör var 6:e timme via EventBridge
 * Kollar varje aktiv kunds WordPress-sajt för:
 *   1. Nya admin-användare (jämförs mot känd lista i security_known_state)
 *   2. SSL-certifikat-utgång (<30d varning, <7d kritisk)
 *   3. Nya plugins aktiverade
 * Sparar events i BigQuery security_events.
 * Skickar Slack-notis för critical/warning.
 */
const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const tls = require('tls');
const https = require('https');
const fs = require('fs');
const { randomUUID } = require('crypto');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getParamSafe(name) {
  try { return await getParam(name); } catch (e) { return null; }
}

async function getBigQuery() {
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/bq-creds.json', creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds.json';
  return { bq: new BigQuery({ projectId }), dataset, projectId };
}

async function ensureSecurityTables(bq, projectId, dataset) {
  const eventsSchema = [
    { name: 'event_id', type: 'STRING' },
    { name: 'customer_id', type: 'STRING' },
    { name: 'site_url', type: 'STRING' },
    { name: 'event_type', type: 'STRING' },
    { name: 'severity', type: 'STRING' },
    { name: 'details', type: 'STRING' },
    { name: 'detected_at', type: 'TIMESTAMP' },
    { name: 'resolved_at', type: 'TIMESTAMP' },
    { name: 'status', type: 'STRING' },
    { name: 'notified_slack', type: 'BOOL' }
  ];
  const knownStateSchema = [
    { name: 'customer_id', type: 'STRING' },
    { name: 'check_type', type: 'STRING' },
    { name: 'known_values_json', type: 'STRING' },
    { name: 'updated_at', type: 'TIMESTAMP' }
  ];
  try {
    await bq.dataset(dataset).createTable('security_events', { schema: eventsSchema });
    console.log('Skapade security_events-tabell');
  } catch (e) { if (!e.message.includes('Already Exists')) console.log('security_events finns redan'); }
  try {
    await bq.dataset(dataset).createTable('security_known_state', { schema: knownStateSchema });
    console.log('Skapade security_known_state-tabell');
  } catch (e) { if (!e.message.includes('Already Exists')) console.log('security_known_state finns redan'); }
}

async function sendSlack(webhookUrl, severity, customerName, details, siteUrl) {
  if (!webhookUrl) return;
  const colors = { critical: '#ef4444', warning: '#eab308', resolved: '#22c55e', info: '#00d4ff' };
  const payload = JSON.stringify({
    attachments: [{
      color: colors[severity] || colors.info,
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*${severity.toUpperCase()} — ${customerName}*\n${details}` }
        },
        {
          type: 'context',
          elements: [{ type: 'mrkdwn', text: `${siteUrl} | ${new Date().toISOString()}` }]
        }
      ]
    }]
  });
  try {
    await new Promise((resolve, reject) => {
      const url = new URL(webhookUrl);
      const req = https.request({ hostname: url.hostname, path: url.pathname + url.search, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
      }, (res) => { res.on('data', () => {}); res.on('end', resolve); });
      req.on('error', reject);
      req.setTimeout(5000, () => { req.destroy(); resolve(); });
      req.write(payload);
      req.end();
    });
  } catch (e) { /* fire-and-forget */ }
}

async function wpApi(siteUrl, username, appPassword, endpoint) {
  const auth = Buffer.from(`${username}:${appPassword}`).toString('base64');
  const cleanUrl = siteUrl.replace(/\/$/, '');
  const fullUrl = `${cleanUrl}/wp-json/wp/v2${endpoint}`;
  return new Promise((resolve, reject) => {
    const url = new URL(fullUrl);
    const options = {
      hostname: url.hostname, path: url.pathname + url.search, method: 'GET',
      headers: { 'Authorization': `Basic ${auth}`, 'User-Agent': 'SearchboostSecurity/1.0' },
      timeout: 15000
    };
    const proto = url.protocol === 'https:' ? https : require('http');
    const req = proto.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 100)}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

function checkSSL(siteUrl) {
  return new Promise((resolve) => {
    let hostname;
    try { hostname = new URL(siteUrl).hostname; } catch (e) { return resolve({ ok: false, error: 'Ogiltig URL' }); }
    const socket = tls.connect({ host: hostname, port: 443, servername: hostname, timeout: 10000 }, () => {
      try {
        const cert = socket.getPeerCertificate();
        socket.destroy();
        if (!cert || !cert.valid_to) return resolve({ ok: false, error: 'Certifikat saknar giltighetsdatum' });
        const expiry = new Date(cert.valid_to);
        const daysLeft = Math.floor((expiry - new Date()) / (1000 * 60 * 60 * 24));
        resolve({ ok: true, daysLeft, expiry: expiry.toISOString() });
      } catch (e) { resolve({ ok: false, error: e.message }); }
    });
    socket.on('error', (e) => { socket.destroy(); resolve({ ok: false, error: e.message }); });
    socket.on('timeout', () => { socket.destroy(); resolve({ ok: false, error: 'Timeout' }); });
  });
}

async function getKnownState(bq, projectId, dataset, customerId, checkType) {
  try {
    const [rows] = await bq.query({
      query: `SELECT known_values_json FROM \`${projectId}.${dataset}.security_known_state\`
              WHERE customer_id = @cid AND check_type = @type LIMIT 1`,
      params: { cid: customerId, type: checkType }
    });
    if (rows && rows.length > 0) return JSON.parse(rows[0].known_values_json);
  } catch (e) { /* tabell kan vara tom */ }
  return null;
}

async function saveKnownState(bq, projectId, dataset, customerId, checkType, values) {
  const json = JSON.stringify(values);
  const now = new Date().toISOString();
  // Försök DELETE + INSERT (enklare än MERGE för Lambda)
  try {
    await bq.query({
      query: `DELETE FROM \`${projectId}.${dataset}.security_known_state\`
              WHERE customer_id = @cid AND check_type = @type`,
      params: { cid: customerId, type: checkType }
    });
  } catch (e) { /* ok */ }
  try {
    await bq.query({
      query: `INSERT INTO \`${projectId}.${dataset}.security_known_state\`
              (customer_id, check_type, known_values_json, updated_at)
              VALUES (@cid, @type, @json, @now)`,
      params: { cid: customerId, type: checkType, json, now }
    });
  } catch (e) { console.error('saveKnownState error:', e.message); }
}

async function isDuplicateEvent(bq, projectId, dataset, customerId, eventType) {
  try {
    const [rows] = await bq.query({
      query: `SELECT event_id FROM \`${projectId}.${dataset}.security_events\`
              WHERE customer_id = @cid AND event_type = @type AND status = 'open' LIMIT 1`,
      params: { cid: customerId, type: eventType }
    });
    return rows && rows.length > 0;
  } catch (e) { return false; }
}

async function saveEvent(bq, projectId, dataset, event) {
  const isDup = await isDuplicateEvent(bq, projectId, dataset, event.customer_id, event.event_type);
  if (isDup) { console.log(`    [dedup] ${event.event_type} för ${event.customer_id} är redan open`); return false; }
  await bq.query({
    query: `INSERT INTO \`${projectId}.${dataset}.security_events\`
            (event_id, customer_id, site_url, event_type, severity, details, detected_at, resolved_at, status, notified_slack)
            VALUES (@eid, @cid, @url, @type, @sev, @det, CURRENT_TIMESTAMP(), NULL, 'open', @notified)`,
    params: {
      eid: event.event_id, cid: event.customer_id, url: event.site_url,
      type: event.event_type, sev: event.severity, det: event.details,
      notified: event.notified_slack || false
    }
  });
  return true;
}

async function checkAdminUsers(bq, projectId, dataset, customer, siteUrl, username, appPassword, slackWebhook) {
  const events = [];
  try {
    const users = await wpApi(siteUrl, username, appPassword, '/users?roles=administrator&per_page=100');
    if (!Array.isArray(users)) { console.log('    Admin-check: oväntat svar'); return events; }
    const currentAdmins = users.map(u => ({ id: String(u.id), login: u.slug, name: u.name }));
    const currentIds = currentAdmins.map(u => u.id).sort();
    const knownState = await getKnownState(bq, projectId, dataset, customer.customer_id, 'admin_users');
    if (knownState === null) {
      await saveKnownState(bq, projectId, dataset, customer.customer_id, 'admin_users', currentIds);
      console.log(`    Admin-check: ${currentIds.length} admins sparade som baslinje`);
    } else {
      const newAdmins = currentAdmins.filter(u => !knownState.includes(u.id));
      if (newAdmins.length > 0) {
        for (const admin of newAdmins) {
          const details = `Ny admin-användare hittad: "${admin.name}" (login: ${admin.login})`;
          console.log(`    KRITISK: ${details}`);
          const saved = await saveEvent(bq, projectId, dataset, {
            event_id: randomUUID(), customer_id: customer.customer_id, site_url: siteUrl,
            event_type: 'new_admin_user', severity: 'critical', details, notified_slack: true
          });
          if (saved) { await sendSlack(slackWebhook, 'critical', customer.company_name, details, siteUrl); events.push('new_admin_user'); }
        }
        await saveKnownState(bq, projectId, dataset, customer.customer_id, 'admin_users', currentIds);
      } else { console.log(`    Admin-check: OK (${currentIds.length} admins, inga nya)`); }
    }
  } catch (e) { console.log(`    Admin-check misslyckades: ${e.message}`); }
  return events;
}

async function checkSslCert(bq, projectId, dataset, customer, siteUrl, slackWebhook) {
  const events = [];
  try {
    const result = await checkSSL(siteUrl);
    if (!result.ok) { console.log(`    SSL-check: fel — ${result.error}`); return events; }
    const { daysLeft } = result;
    console.log(`    SSL-check: ${daysLeft} dagar kvar`);
    if (daysLeft <= 7) {
      const details = `SSL-certifikat går ut om ${daysLeft} dagar — KRITISKT`;
      const saved = await saveEvent(bq, projectId, dataset, {
        event_id: randomUUID(), customer_id: customer.customer_id, site_url: siteUrl,
        event_type: 'ssl_expiry_critical', severity: 'critical', details, notified_slack: true
      });
      if (saved) { await sendSlack(slackWebhook, 'critical', customer.company_name, details, siteUrl); events.push('ssl_critical'); }
    } else if (daysLeft <= 30) {
      const details = `SSL-certifikat går ut om ${daysLeft} dagar — förnyas snart`;
      const saved = await saveEvent(bq, projectId, dataset, {
        event_id: randomUUID(), customer_id: customer.customer_id, site_url: siteUrl,
        event_type: 'ssl_expiry_warning', severity: 'warning', details, notified_slack: true
      });
      if (saved) { await sendSlack(slackWebhook, 'warning', customer.company_name, details, siteUrl); events.push('ssl_warning'); }
    }
  } catch (e) { console.log(`    SSL-check misslyckades: ${e.message}`); }
  return events;
}

async function checkPlugins(bq, projectId, dataset, customer, siteUrl, username, appPassword, slackWebhook) {
  const events = [];
  try {
    const plugins = await wpApi(siteUrl, username, appPassword, '/plugins?status=active&per_page=200');
    if (!Array.isArray(plugins)) { console.log('    Plugin-check: oväntat svar'); return events; }
    const currentSlugs = plugins.map(p => p.plugin || p.slug || '').filter(Boolean).sort();
    const knownState = await getKnownState(bq, projectId, dataset, customer.customer_id, 'active_plugins');
    if (knownState === null) {
      await saveKnownState(bq, projectId, dataset, customer.customer_id, 'active_plugins', currentSlugs);
      console.log(`    Plugin-check: ${currentSlugs.length} plugins sparade som baslinje`);
    } else {
      const newPlugins = currentSlugs.filter(s => !knownState.includes(s));
      if (newPlugins.length > 0) {
        const details = `${newPlugins.length} ny/nya plugin(s) aktiverade: ${newPlugins.join(', ')}`;
        console.log(`    VARNING: ${details}`);
        const saved = await saveEvent(bq, projectId, dataset, {
          event_id: randomUUID(), customer_id: customer.customer_id, site_url: siteUrl,
          event_type: 'new_plugin_activated', severity: 'warning', details, notified_slack: true
        });
        if (saved) { await sendSlack(slackWebhook, 'warning', customer.company_name, details, siteUrl); events.push('new_plugin'); }
        await saveKnownState(bq, projectId, dataset, customer.customer_id, 'active_plugins', currentSlugs);
      } else { console.log(`    Plugin-check: OK (${currentSlugs.length} plugins, inga nya)`); }
    }
  } catch (e) { console.log(`    Plugin-check misslyckades: ${e.message}`); }
  return events;
}

exports.handler = async (event) => {
  console.log('=== Security Monitor Started ===');
  const startTime = Date.now();
  try {
    const { bq, dataset, projectId } = await getBigQuery();
    await ensureSecurityTables(bq, projectId, dataset);
    const slackWebhook = await getParamSafe('/seo-mcp/slack/webhook-url');
    if (!slackWebhook) console.log('OBS: Slack webhook saknas — notiser inaktiverade');

    const [customers] = await bq.query({
      query: `SELECT customer_id, company_name, website_url FROM \`${projectId}.${dataset}.customer_pipeline\`
              WHERE stage = 'active' ORDER BY company_name`
    });
    console.log(`Hittade ${customers.length} aktiva kunder`);
    const summary = [];

    for (const customer of customers) {
      const siteUrl = customer.website_url || '';
      console.log(`Kollar: ${customer.company_name} (${siteUrl})`);
      const allEvents = [];

      const wpUrl = await getParamSafe(`/seo-mcp/wordpress/${customer.customer_id}/url`);
      let username = await getParamSafe(`/seo-mcp/wordpress/${customer.customer_id}/username`);
      let appPassword = await getParamSafe(`/seo-mcp/wordpress/${customer.customer_id}/app-password`);
      const resolvedUrl = wpUrl || siteUrl;
      const hasWpCreds = username && username !== 'placeholder' && appPassword && appPassword !== 'placeholder';

      if (hasWpCreds) {
        const adminEvts = await checkAdminUsers(bq, projectId, dataset, customer, resolvedUrl, username, appPassword, slackWebhook);
        const pluginEvts = await checkPlugins(bq, projectId, dataset, customer, resolvedUrl, username, appPassword, slackWebhook);
        allEvents.push(...adminEvts, ...pluginEvts);
      } else {
        console.log('    WP-credentials saknas — hoppar över WP-checks, kör bara SSL');
      }
      if (resolvedUrl) {
        const sslEvts = await checkSslCert(bq, projectId, dataset, customer, resolvedUrl, slackWebhook);
        allEvents.push(...sslEvts);
      }
      summary.push({ customer: customer.customer_id, company: customer.company_name, events: allEvents.length });
      console.log(`  Klar: ${allEvents.length} nya events`);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`=== Security Monitor klar på ${duration}s ===`);
    return { statusCode: 200, body: JSON.stringify({ message: 'Security check complete', duration: `${duration}s`, summary }) };
  } catch (err) {
    console.error('Security monitor misslyckades:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
