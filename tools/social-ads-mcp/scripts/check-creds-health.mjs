#!/usr/bin/env node
/**
 * Kontrollera live-status på alla social/ads-credentials för aktiva kunder.
 * Skriver resultat till BQ channel_creds_health.
 *
 * Körs:
 *   AWS_PROFILE=mikael node tools/social-ads-mcp/scripts/check-creds-health.mjs
 *
 * Schemaläggs via EventBridge cron (1 gång per dygn).
 */

import { SSMClient, GetParameterCommand, DescribeParametersCommand } from '@aws-sdk/client-ssm';
import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';

const ssm = new SSMClient({ region: 'eu-north-1' });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function listIntegrationPaths() {
  const paths = [];
  // Två prefix att täcka: standard integrations/ + egen-paths som searchboost/
  for (const prefix of ['/seo-mcp/integrations/', '/seo-mcp/searchboost/']) {
    let token;
    do {
      const res = await ssm.send(new DescribeParametersCommand({
        MaxResults: 50,
        ParameterFilters: [{ Key: 'Name', Option: 'BeginsWith', Values: [prefix] }],
        NextToken: token,
      }));
      paths.push(...(res.Parameters || []).map(p => p.Name));
      token = res.NextToken;
    } while (token);
  }
  return paths;
}

const CHECKS = {
  linkedin: async (token) => {
    const r = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000, validateStatus: () => true,
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
      headers: { Authorization: `Bearer ${token}` },
      timeout: 8000, validateStatus: () => true,
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

async function main() {
  // Set BQ-creds från SSM
  const credsJson = execSync('aws ssm get-parameter --name /seo-mcp/bigquery/credentials --with-decryption --region eu-north-1 --profile mikael --query Parameter.Value --output text').toString();
  fs.writeFileSync('/tmp/bq-creds-cred-check.json', credsJson);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds-cred-check.json';
  const bq = new BigQuery({ projectId: 'seo-aouto' });

  const paths = await listIntegrationPaths();
  // Plocka ut access-token-paths per kund
  const tokens = paths.filter(p => /-(access-token|bearer)$/.test(p));
  console.log(`Hittade ${tokens.length} token-paths att kolla...`);

  const rows = [];
  for (const path of tokens) {
    // Match både /seo-mcp/integrations/<cid>/<key> och /seo-mcp/<cid>/<key>
    const m = path.match(/^\/seo-mcp\/(?:integrations\/)?([^/]+)\/(.+)$/);
    if (!m) continue;
    const [, customer_id, key] = m;
    const channel = mapTokenKeyToChannel(key);
    if (!channel || !CHECKS[channel]) continue;
    try {
      const token = await getParam(path);
      const r = await CHECKS[channel](token);
      const row = {
        customer_id, channel: channel === 'meta' ? 'meta_ads' : channel,
        ssm_path: path,
        status: r.ok ? 'ok' : (r.status || 'unknown'),
        http_status: r.http,
        reason: r.reason || null,
        checked_at: new Date().toISOString(),
      };
      rows.push(row);
      console.log(`  ${customer_id} ${channel}: ${row.status} (HTTP ${row.http_status})`);
    } catch (e) {
      console.log(`  ${customer_id} ${key}: skip (${e.message})`);
    }
  }

  if (rows.length === 0) { console.log('Inga rader att skriva.'); return; }

  // Skriv batchen
  await bq.dataset('seo_data').table('channel_creds_health').insert(rows);
  console.log(`\nSkrev ${rows.length} rader till channel_creds_health.`);

  // Summera per status
  const summary = rows.reduce((a, r) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  console.log('Status-fördelning:', JSON.stringify(summary));
}

main().catch(e => { console.error(e); process.exit(1); });
