#!/usr/bin/env node
/**
 * Plausible customer-onboarding-skript.
 * Kör så fort Mikael har genererat admin-API-key och sparat i SSM:
 *   aws ssm put-parameter --name /seo-mcp/plausible/api-key --value '<key>' \
 *     --type SecureString --overwrite --region eu-north-1 --profile mikael
 *
 * Detta skript:
 *   1. Läser alla aktiva kunder från customer_pipeline
 *   2. Skapar en site i Plausible per kund (POST /api/v1/sites)
 *   3. Loggar resultat till BQ customer_channels (channel='plausible', status='active')
 *   4. Sammanfattar vad som behöver göras manuellt (GA4-import, tracker-aktivering på sajt)
 */
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';
import { execSync } from 'child_process';
import fs from 'fs';

const PLAU_URL = 'https://analytics.searchboost.se';
const ssm = new SSMClient({ region: 'eu-north-1' });
const getParam = async n => (await ssm.send(new GetParameterCommand({ Name: n, WithDecryption: true }))).Parameter.Value;

const credsJson = execSync('aws ssm get-parameter --name /seo-mcp/bigquery/credentials --with-decryption --region eu-north-1 --profile mikael --query Parameter.Value --output text').toString();
fs.writeFileSync('/tmp/bq-creds.json', credsJson);
process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/bq-creds.json';
const bq = new BigQuery({ projectId: 'seo-aouto' });

const apiKey = await getParam('/seo-mcp/plausible/api-key');
if (apiKey === 'PLACEHOLDER_GENERATE_IN_PLAUSIBLE_SETTINGS') {
  console.error(`Plausible API-key är fortfarande placeholder.
1. Gå till https://analytics.searchboost.se/register och skapa admin-konto (mikael@searchboost.se)
2. Settings → API Keys → "+ New API key" med scope "sites:provision:*"
3. Spara värdet: aws ssm put-parameter --name /seo-mcp/plausible/api-key --value '<key>' --type SecureString --overwrite --region eu-north-1 --profile mikael
4. Kör om: node tools/plausible-onboard-customers.mjs`);
  process.exit(1);
}

// Hämta alla aktiva kunder + deras domäner
const [customers] = await bq.query({
  query: `
    SELECT cp.customer_id, cp.company_name, cp.website_url,
           ANY_VALUE(wp.value) AS wp_url
    FROM \`seo-aouto.seo_data.customer_pipeline\` cp
    LEFT JOIN (
      SELECT REGEXP_EXTRACT(name, r'^/seo-mcp/wordpress/([^/]+)/url') AS cid, value
      FROM \`seo-aouto.seo_data.cred_check_results\`
      WHERE name LIKE '/seo-mcp/wordpress/%/url'
    ) wp ON wp.cid = cp.customer_id
    WHERE cp.stage IN ('aktiv','active')
    GROUP BY cp.customer_id, cp.company_name, cp.website_url
    ORDER BY cp.customer_id
  `
}).catch(async () => {
  // Fallback: bara från pipeline + per-kund SSM
  return await bq.query({
    query: `SELECT customer_id, company_name, website_url FROM \`seo-aouto.seo_data.customer_pipeline\` WHERE stage IN ('aktiv','active')`,
  });
});

console.log(`Aktiva kunder: ${customers.length}`);

const channelRows = [];
const results = [];

for (const c of customers) {
  let domain = c.website_url || c.wp_url || '';
  if (!domain) {
    try { domain = await getParam(`/seo-mcp/wordpress/${c.customer_id}/url`); } catch {}
  }
  domain = String(domain || '').replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase();
  if (!domain) { console.log(`  ${c.customer_id}: ingen domän — skip`); continue; }

  try {
    // POST /api/v1/sites — skapar en site
    const res = await axios.post(`${PLAU_URL}/api/v1/sites`, new URLSearchParams({
      domain, timezone: 'Europe/Stockholm',
    }).toString(), {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 15000, validateStatus: () => true,
    });
    const ok = res.status === 200 || res.status === 201;
    const exists = res.status === 400 && res.data?.error?.includes('already exists');
    console.log(`  ${c.customer_id.padEnd(25)} ${domain.padEnd(35)} ${ok ? 'created' : (exists ? 'exists' : `HTTP ${res.status}`)}`);
    results.push({ customer_id: c.customer_id, domain, status: ok ? 'created' : (exists ? 'exists' : 'error'), detail: ok || exists ? null : res.data });

    if (ok || exists) {
      channelRows.push({
        customer_id: c.customer_id, channel: 'plausible',
        status: 'active', last_activity: new Date().toISOString(),
        next_action: 'Tracker live på sajten (WP-plugin v1.2+ injekterar automatiskt)',
        cost_monthly_sek: null, contact_person: null,
        notes: `Plausible site_id=${domain}`,
        updated_at: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.log(`  ${c.customer_id.padEnd(25)} ${domain.padEnd(35)} ERROR ${e.message}`);
    results.push({ customer_id: c.customer_id, domain, status: 'error', detail: e.message });
  }
}

// Logga channels-uppdateringar
if (channelRows.length > 0) {
  await bq.dataset('seo_data').table('customer_channels').insert(channelRows);
  console.log(`\nLog → customer_channels: ${channelRows.length} rader`);
}

console.log('\n=== SUMMARY ===');
console.log(`Skapat: ${results.filter(r => r.status === 'created').length}`);
console.log(`Existerade: ${results.filter(r => r.status === 'exists').length}`);
console.log(`Fel: ${results.filter(r => r.status === 'error').length}`);
console.log('\nNästa steg (manuellt):');
console.log('  • Tracker: WP-plugin v1.2+ auto-injekterar. Verifiera per kund på https://analytics.searchboost.se');
console.log('  • GA4-import: Plausible UI → varje site → Settings → Imports & Exports → Google Analytics');
console.log('  • Looker Studio: använd /docs/brand/SearchBoost-Brand-Package-2026/03_mallar/looker-studio-template-spec.md');
