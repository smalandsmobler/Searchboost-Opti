#!/usr/bin/env node
/**
 * perispa setup — hämtar WP-credentials från AWS SSM och skapar config.json
 *
 * Användning:
 *   node setup.js --from-ssm                    # Alla kunder
 *   node setup.js --from-ssm --site jelmtech    # En specifik kund
 *   node setup.js --from-file wp_credentials.md # Från lokal fil
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, 'config.json');
const SSM_PREFIX = '/seo-mcp/wordpress/';
const AWS_PROFILE = 'mickedanne@gmail.com';
const AWS_REGION = 'eu-north-1';

// Kända site-slugs
const KNOWN_SITES = [
  'smalandskontorsmobler',
  'mobelrondellen',
  'jelmtech',
  'searchboost',
  'traficator',
  'humanpower',
  'nordicsnusonline',
  'tobler',
  'ilmonte',
];

function awsCmd(cmd) {
  return execSync(
    `aws ${cmd} --region ${AWS_REGION} --profile "${AWS_PROFILE}" --output json`,
    { encoding: 'utf-8', timeout: 30000 }
  );
}

function getSSMParam(name) {
  try {
    const raw = awsCmd(
      `ssm get-parameter --name "${name}" --with-decryption`
    );
    return JSON.parse(raw).Parameter.Value;
  } catch {
    return null;
  }
}

function fetchSiteFromSSM(slug) {
  console.log(`  Hämtar ${slug}...`);
  const url = getSSMParam(`${SSM_PREFIX}${slug}/url`);
  const username = getSSMParam(`${SSM_PREFIX}${slug}/username`);
  const appPassword = getSSMParam(`${SSM_PREFIX}${slug}/app-password`);

  if (!url || !username || !appPassword) {
    console.log(`  ⚠ ${slug}: saknar credentials (url=${!!url} user=${!!username} pass=${!!appPassword})`);
    return null;
  }

  // Hämta extra metadata om det finns
  const companyName = getSSMParam(`/seo-mcp/integrations/${slug}/company-name`);
  const gscProperty = getSSMParam(`/seo-mcp/integrations/${slug}/gsc-property`);

  return {
    slug,
    url: url.replace(/\/$/, ''),
    username,
    app_password: appPassword,
    company_name: companyName || slug,
    gsc_property: gscProperty || null,
  };
}

function fromSSM(siteFilter) {
  console.log('Hämtar WordPress-credentials från AWS SSM...\n');

  const sites = siteFilter
    ? KNOWN_SITES.filter(s => s === siteFilter)
    : KNOWN_SITES;

  if (sites.length === 0) {
    console.error(`Okänd site: ${siteFilter}`);
    console.error(`Kända: ${KNOWN_SITES.join(', ')}`);
    process.exit(1);
  }

  const config = loadExistingConfig();
  let added = 0;

  for (const slug of sites) {
    const site = fetchSiteFromSSM(slug);
    if (site) {
      config.sites[slug] = site;
      added++;
    }
  }

  saveConfig(config);
  console.log(`\nKlart! ${added} siter konfigurerade → ${CONFIG_PATH}`);
}

function loadExistingConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch {
      // Korrupt fil, börja om
    }
  }
  return {
    version: '1.0.0',
    created: new Date().toISOString(),
    sites: {},
  };
}

function saveConfig(config) {
  config.updated = new Date().toISOString();
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}

// --- CLI ---
const args = process.argv.slice(2);

if (args.includes('--from-ssm')) {
  const siteIdx = args.indexOf('--site');
  const siteFilter = siteIdx !== -1 ? args[siteIdx + 1] : null;
  fromSSM(siteFilter);
} else if (args.includes('--list')) {
  const config = loadExistingConfig();
  const sites = Object.values(config.sites);
  if (sites.length === 0) {
    console.log('Ingen config. Kör: node setup.js --from-ssm');
  } else {
    console.log(`${sites.length} siter konfigurerade:\n`);
    for (const s of sites) {
      console.log(`  ${s.slug.padEnd(25)} ${s.url}  (${s.username})`);
    }
  }
} else {
  console.log(`perispa setup

Användning:
  node setup.js --from-ssm                  Hämta alla credentials från AWS SSM
  node setup.js --from-ssm --site jelmtech  Hämta en specifik site
  node setup.js --list                      Visa konfigurerade siter
`);
}
