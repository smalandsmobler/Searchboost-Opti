/**
 * seo-creds-health-watcher — Lambda
 *
 * Pollar alla social/ads-credentials i SSM 1x/dygn.
 * Skriver resultat till BQ channel_creds_health.
 * Skickar mail till Mikael om något har gått från ok → revoked sedan förra körningen.
 *
 * EventBridge cron: cron(0 6 * * ? *)   — 06:00 UTC = 08:00 svensk tid
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand, DescribeParametersCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const axios = require('axios');
const nodemailer = require('nodemailer');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function listTokenPaths() {
  const paths = [];
  for (const prefix of ['/seo-mcp/integrations/', '/seo-mcp/searchboost/']) {
    let nextToken;
    do {
      const res = await ssm.send(new DescribeParametersCommand({
        MaxResults: 50,
        ParameterFilters: [{ Key: 'Name', Option: 'BeginsWith', Values: [prefix] }],
        NextToken: nextToken,
      }));
      paths.push(...(res.Parameters || []).map(p => p.Name));
      nextToken = res.NextToken;
    } while (nextToken);
  }
  return paths.filter(p => /-(access-token|bearer)$/.test(p));
}

const CHECKS = {
  linkedin: async (token) => {
    const r = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` }, timeout: 8000, validateStatus: () => true,
    });
    if (r.status === 200) return { ok: true, http: 200 };
    const code = r.data?.code;
    if (code === 'REVOKED_ACCESS_TOKEN') return { ok: false, http: 401, status: 'revoked', reason: code };
    if (code === 'INVALID_ACCESS_TOKEN') return { ok: false, http: 401, status: 'expired', reason: code };
    return { ok: false, http: r.status, status: 'unknown', reason: r.data?.message || `HTTP ${r.status}` };
  },
  meta: async (token) => {
    const r = await axios.get(`https://graph.facebook.com/v18.0/me?access_token=${encodeURIComponent(token)}`, {
      timeout: 8000, validateStatus: () => true,
    });
    if (r.status === 200) return { ok: true, http: 200 };
    return { ok: false, http: r.status, status: r.status === 401 ? 'expired' : 'unknown', reason: r.data?.error?.message || `HTTP ${r.status}` };
  },
  facebook: async (token) => CHECKS.meta(token),
  twitter: async (token) => {
    const r = await axios.get('https://api.twitter.com/2/users/me', {
      headers: { Authorization: `Bearer ${token}` }, timeout: 8000, validateStatus: () => true,
    });
    return r.status === 200 ? { ok: true, http: 200 } : { ok: false, http: r.status, status: 'expired', reason: r.data?.detail || `HTTP ${r.status}` };
  },
};

function mapTokenKeyToChannel(key) {
  if (key.startsWith('linkedin-')) return 'linkedin';
  if (key.startsWith('meta-')) return 'meta';
  if (key.startsWith('facebook-')) return 'facebook';
  if (key.startsWith('twitter-')) return 'twitter';
  return null;
}

async function getBigQuery() {
  const credsJson = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  fs.writeFileSync('/tmp/bq-creds.json', credsJson);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds.json';
  return new BigQuery({ projectId });
}

async function getTransporter() {
  try {
    const host = await getParam('/seo-mcp/email/smtp-host');
    const user = await getParam('/seo-mcp/email/username');
    const pass = await getParam('/seo-mcp/email/password');
    return nodemailer.createTransport({ host, port: 465, secure: true, auth: { user, pass } });
  } catch { return null; }
}

exports.handler = async () => {
  console.log('creds-health-watcher start', new Date().toISOString());
  const bq = await getBigQuery();

  // Hämta senaste status per (customer_id, channel) för diff-check
  const [prevRows] = await bq.query({
    query: `
      SELECT customer_id, channel, status,
             ROW_NUMBER() OVER (PARTITION BY customer_id, channel ORDER BY checked_at DESC) rn
      FROM \`seo-aouto.seo_data.channel_creds_health\`
      QUALIFY rn = 1
    `,
  });
  const prevStatus = new Map(prevRows.map(r => [`${r.customer_id}/${r.channel}`, r.status]));

  const paths = await listTokenPaths();
  console.log(`Token-paths att kolla: ${paths.length}`);

  const rows = [];
  const newlyBroken = [];

  for (const path of paths) {
    const m = path.match(/^\/seo-mcp\/(?:integrations\/)?([^/]+)\/(.+)$/);
    if (!m) continue;
    const [, customer_id, key] = m;
    const channel = mapTokenKeyToChannel(key);
    if (!channel || !CHECKS[channel]) continue;
    try {
      const token = await getParam(path);
      const r = await CHECKS[channel](token);
      const channelName = channel === 'meta' ? 'meta_ads' : channel;
      const row = {
        customer_id, channel: channelName, ssm_path: path,
        status: r.ok ? 'ok' : (r.status || 'unknown'),
        http_status: r.http, reason: r.reason || null,
        checked_at: new Date().toISOString(),
      };
      rows.push(row);

      const prev = prevStatus.get(`${customer_id}/${channelName}`);
      if (prev === 'ok' && row.status !== 'ok') {
        newlyBroken.push({ customer_id, channel: channelName, was: prev, now: row.status, reason: row.reason });
      }
      console.log(`  ${customer_id} ${channel}: ${row.status} (HTTP ${row.http_status})${prev && prev !== row.status ? ` [was: ${prev}]` : ''}`);
    } catch (e) {
      console.error(`  ${customer_id} ${key}: ${e.message}`);
    }
  }

  if (rows.length > 0) {
    await bq.dataset('seo_data').table('channel_creds_health').insert(rows);
    console.log(`Skrev ${rows.length} rader.`);
  }

  // Mail-notis vid nya brott
  if (newlyBroken.length > 0) {
    const transporter = await getTransporter();
    if (transporter) {
      const list = newlyBroken.map(b =>
        `<tr><td style="padding:8px 12px;font-family:monospace">${b.customer_id}</td><td style="padding:8px 12px">${b.channel}</td><td style="padding:8px 12px;color:#f87171"><strong>${b.was} → ${b.now}</strong></td><td style="padding:8px 12px;color:#7a6e90;font-size:12px">${b.reason || ''}</td></tr>`
      ).join('');
      const html = `<!DOCTYPE html><html><body style="background:#05050f;color:#c8b8e0;font-family:-apple-system,sans-serif;padding:32px">
<div style="max-width:640px;margin:auto;background:#0e0c19;border:1px solid rgba(248,113,113,0.3);border-radius:16px;padding:32px">
<div style="color:#7a6e90;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;font-weight:600">Creds-health · larm</div>
<h1 style="color:#fff;font-size:24px;margin:8px 0 0;font-family:'Inter Tight',Inter,sans-serif">${newlyBroken.length} kanal${newlyBroken.length>1?'er':''} har gått sönder sedan igår</h1>
<p style="margin-top:16px;color:#c8b8e0">Följande tokens behöver re-autentiseras innan vi kan posta/läsa för respektive kund:</p>
<table style="width:100%;margin-top:16px;background:#080818;border:1px solid rgba(200,184,224,0.1);border-radius:12px;overflow:hidden;border-collapse:collapse">
<tr style="background:#0e0c19"><th style="padding:10px 12px;text-align:left;font-size:11px;color:#7a6e90;text-transform:uppercase">Kund</th><th style="padding:10px 12px;text-align:left;font-size:11px;color:#7a6e90;text-transform:uppercase">Kanal</th><th style="padding:10px 12px;text-align:left;font-size:11px;color:#7a6e90;text-transform:uppercase">Status</th><th style="padding:10px 12px;text-align:left;font-size:11px;color:#7a6e90;text-transform:uppercase">Skäl</th></tr>
${list}
</table>
<p style="margin-top:20px;font-size:13px;color:#7a6e90">Översikt: <a href="https://opti.searchboost.se/customers-overview.html" style="color:#f23a9e">opti.searchboost.se/customers-overview.html</a></p>
</div></body></html>`;
      await transporter.sendMail({
        from: 'Searchboost Opti <noreply@searchboost.se>',
        to: 'mikael@searchboost.se',
        subject: `[Creds-larm] ${newlyBroken.length} kanal${newlyBroken.length>1?'er':''} behöver re-auth`,
        html,
      });
      console.log('Mail skickat till Mikael.');
    }
  }

  return { statusCode: 200, body: JSON.stringify({ checked: rows.length, newly_broken: newlyBroken.length }) };
};
