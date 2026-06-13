/**
 * Supermetrics Connector
 *
 * Hanterar Supermetrics-konton per kund och ger en unified ads-datakälla.
 *
 * Arkitektur:
 * - Supermetrics MCP används av Claude direkt för kampanjhantering
 * - Denna modul hanterar: SSM-lagring av konto-IDs, health checks,
 *   aggregering av ads-data via direkta platform-APIs
 *
 * Varje kund kan ha kopplat:
 *   ds_id       : 'AW' | 'FA' | 'AC' | 'TIK'
 *   account_id  : plattformens konto-ID (Google Ads, Meta act_, TikTok etc.)
 *
 * SSM-nycklar per kund:
 *   /seo-mcp/integrations/{siteId}/supermetrics-gads-account-id
 *   /seo-mcp/integrations/{siteId}/supermetrics-meta-account-id
 *   /seo-mcp/integrations/{siteId}/supermetrics-linkedin-account-id
 *   /seo-mcp/integrations/{siteId}/supermetrics-tiktok-account-id
 */

const { SSMClient, PutParameterCommand, GetParameterCommand } = require('@aws-sdk/client-ssm');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// ── Platform configs ──────────────────────────────────────────────────────────

const PLATFORMS = {
  google_ads: {
    label: 'Google Ads',
    ds_id: 'AW',
    ssmKey: 'supermetrics-gads-account-id',
    credKeys: ['google-ads-customer-id', 'google-ads-developer-token', 'google-ads-refresh-token'],
    icon: 'G',
    color: '#4285F4',
  },
  meta_ads: {
    label: 'Meta Ads',
    ds_id: 'FA',
    ssmKey: 'supermetrics-meta-account-id',
    credKeys: ['meta-ad-account-id', 'meta-access-token'],
    icon: 'M',
    color: '#1877F2',
  },
  linkedin_ads: {
    label: 'LinkedIn Ads',
    ds_id: 'LI',
    ssmKey: 'supermetrics-linkedin-account-id',
    credKeys: ['linkedin-ad-account-id', 'linkedin-access-token'],
    icon: 'in',
    color: '#0A66C2',
  },
  tiktok_ads: {
    label: 'TikTok Ads',
    ds_id: 'TIK',
    ssmKey: 'supermetrics-tiktok-account-id',
    credKeys: ['tiktok-advertiser-id', 'tiktok-access-token'],
    icon: 'T',
    color: '#FE2C55',
  },
};

// ── SSM helpers ───────────────────────────────────────────────────────────────

async function getParamSafe(name) {
  try {
    const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
    return res.Parameter.Value;
  } catch {
    return null;
  }
}

async function putParam(name, value) {
  await ssm.send(new PutParameterCommand({
    Name: name,
    Value: value,
    Type: 'SecureString',
    Overwrite: true,
  }));
}

// ── Core functions ────────────────────────────────────────────────────────────

/**
 * Hämtar alla konfigurerade Supermetrics-konton för en kund.
 */
async function getLinkedAccounts(customerId) {
  const results = {};
  await Promise.all(
    Object.entries(PLATFORMS).map(async ([key, cfg]) => {
      const path = `/seo-mcp/integrations/${customerId}/${cfg.ssmKey}`;
      const accountId = await getParamSafe(path);
      results[key] = {
        platform: cfg.label,
        ds_id: cfg.ds_id,
        account_id: accountId || null,
        linked: !!accountId,
        icon: cfg.icon,
        color: cfg.color,
      };
    })
  );
  return results;
}

/**
 * Sparar Supermetrics account-ID för en plattform.
 */
async function linkAccount(customerId, platform, accountId) {
  const cfg = PLATFORMS[platform];
  if (!cfg) throw new Error(`Okänd plattform: ${platform}`);
  const path = `/seo-mcp/integrations/${customerId}/${cfg.ssmKey}`;
  await putParam(path, accountId);
  return { ok: true, platform, accountId };
}

/**
 * Sparar API-credentials för en annonsplattform.
 * Stöder: google_ads, meta_ads, linkedin_ads, tiktok_ads
 */
async function saveCredentials(customerId, platform, credentials) {
  const cfg = PLATFORMS[platform];
  if (!cfg) throw new Error(`Okänd plattform: ${platform}`);

  const promises = [];
  for (const [key, value] of Object.entries(credentials)) {
    if (value) {
      const path = `/seo-mcp/integrations/${customerId}/${key}`;
      promises.push(putParam(path, value));
    }
  }
  await Promise.all(promises);

  // Om account-ID finns, länka direkt
  const accountIdKey = {
    google_ads: 'google-ads-customer-id',
    meta_ads: 'meta-ad-account-id',
    linkedin_ads: 'linkedin-ad-account-id',
    tiktok_ads: 'tiktok-advertiser-id',
  }[platform];

  if (credentials[accountIdKey]) {
    await linkAccount(customerId, platform, credentials[accountIdKey]);
  }

  return { ok: true, platform, saved: Object.keys(credentials).length };
}

/**
 * Kollar om en kund har minst en annonsplattform konfigurerad.
 */
async function hasAnyAdsConfigured(customerId) {
  const accounts = await getLinkedAccounts(customerId);
  return Object.values(accounts).some(a => a.linked);
}

/**
 * Returnerar en sammanfattning för uppförsäljning.
 * Visar vilka plattformar som SAKNAR koppling.
 */
async function getUpsellStatus(customerId) {
  const accounts = await getLinkedAccounts(customerId);
  const linked = Object.entries(accounts).filter(([, v]) => v.linked).map(([k]) => k);
  const missing = Object.entries(accounts).filter(([, v]) => !v.linked).map(([k, v]) => ({
    platform: k,
    label: v.platform,
    icon: v.icon,
    color: v.color,
  }));

  return {
    customerId,
    linkedCount: linked.length,
    linkedPlatforms: linked,
    missingPlatforms: missing,
    upsellOpportunity: missing.length > 0,
    message: missing.length === 0
      ? 'Alla plattformar kopplade'
      : `${missing.length} plattform(er) ej kopplade: ${missing.map(m => m.label).join(', ')}`,
  };
}

/**
 * Bygger en Supermetrics-compatible account list för alla kunder.
 * Används för översiktsvy i dashboarden.
 */
async function getAllCustomersAdsSummary(customers) {
  const results = await Promise.all(
    customers.map(async (customer) => {
      const accounts = await getLinkedAccounts(customer.id);
      const linkedCount = Object.values(accounts).filter(a => a.linked).length;
      return {
        customerId: customer.id,
        name: customer.name || customer.id,
        linkedPlatforms: linkedCount,
        totalPlatforms: Object.keys(PLATFORMS).length,
        accounts,
      };
    })
  );
  return results;
}

/**
 * ROAS-beräkning baserad på kampanjdata.
 * Indata: array av kampanjer med {revenue, spend}
 */
function calculateROAS(campaigns) {
  const totalRevenue = campaigns.reduce((s, c) => s + (parseFloat(c.revenue || c.conversion_value || 0)), 0);
  const totalSpend = campaigns.reduce((s, c) => s + (parseFloat(c.spend || c.cost || 0)), 0);
  if (totalSpend === 0) return null;
  return parseFloat((totalRevenue / totalSpend).toFixed(2));
}

/**
 * Beräknar rekommenderat månadsbudget för en kund baserat på bransch.
 * Används i upsell-kalkylatorn.
 */
function getBudgetRecommendation(industry, monthlyRevenue) {
  const INDUSTRY_BENCHMARKS = {
    ecommerce:      { minPct: 0.10, maxPct: 0.20, avgCPA: 150 },
    services:       { minPct: 0.05, maxPct: 0.15, avgCPA: 400 },
    furniture:      { minPct: 0.08, maxPct: 0.15, avgCPA: 250 },
    office:         { minPct: 0.06, maxPct: 0.12, avgCPA: 300 },
    health:         { minPct: 0.08, maxPct: 0.18, avgCPA: 180 },
    default:        { minPct: 0.07, maxPct: 0.15, avgCPA: 300 },
  };

  const bench = INDUSTRY_BENCHMARKS[industry] || INDUSTRY_BENCHMARKS.default;
  const revenue = parseFloat(monthlyRevenue) || 0;

  return {
    industry,
    monthlyRevenue: revenue,
    recommendedMinBudget: Math.round(revenue * bench.minPct),
    recommendedMaxBudget: Math.round(revenue * bench.maxPct),
    estimatedCPA: bench.avgCPA,
    estimatedConversions: revenue > 0
      ? `${Math.round((revenue * bench.minPct) / bench.avgCPA)}–${Math.round((revenue * bench.maxPct) / bench.avgCPA)} konv/mån`
      : 'Ange omsättning för beräkning',
    note: `Baserat på branschsnitt för ${industry}`,
  };
}

// ── ROAS trend builder ────────────────────────────────────────────────────────

/**
 * Aggregerar ROAS-trend från BigQuery ads_daily_metrics.
 * Returnerar array med {date, spend, conversions, conversion_value, roas}
 */
function buildROASTrend(rows) {
  const byDate = {};
  for (const row of rows) {
    const d = row.date?.value || row.date;
    if (!byDate[d]) byDate[d] = { date: d, spend: 0, conversions: 0, conversion_value: 0 };
    byDate[d].spend += parseFloat(row.spend || 0);
    byDate[d].conversions += parseInt(row.conversions || 0);
    byDate[d].conversion_value += parseFloat(row.conversion_value || 0);
  }

  return Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      spend: parseFloat(d.spend.toFixed(2)),
      roas: d.spend > 0 ? parseFloat((d.conversion_value / d.spend).toFixed(2)) : 0,
      cpa: d.conversions > 0 ? parseFloat((d.spend / d.conversions).toFixed(2)) : null,
    }));
}

module.exports = {
  PLATFORMS,
  getLinkedAccounts,
  linkAccount,
  saveCredentials,
  hasAnyAdsConfigured,
  getUpsellStatus,
  getAllCustomersAdsSummary,
  calculateROAS,
  getBudgetRecommendation,
  buildROASTrend,
};
