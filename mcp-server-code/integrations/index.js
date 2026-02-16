/**
 * Searchboost Opti — Ads Integration Aggregator
 *
 * Samlar alla annonsplattform-integrationer och erbjuder en bekvamlighetsmetod
 * for att hamta ALL annonsdata for en kund i ett enda anrop.
 *
 * Varje plattform kontrollerar sina egna SSM-credentials och returnerar
 * { available: false, error: '...' } om kunden inte har den plattformen konfigurerad.
 *
 * Anvandning:
 *   const integrations = require('./integrations');
 *   const allData = await integrations.getAllAdsData('mobelrondellen', getParam);
 *   // allData.google_ads.available === true/false
 *   // allData.meta_ads.available === true/false
 *   // ...
 */

const googleAds = require('./google-ads');
const metaAds = require('./meta-ads');
const linkedinAds = require('./linkedin-ads');
const tiktokAds = require('./tiktok-ads');

/**
 * Lista over alla stodda plattformar och deras SSM-nyckelnamn for snabb exists-check.
 * Anvands for att snabbt avgora vilka plattformar en kund har konfigurerat.
 */
const PLATFORM_CONFIG = {
  google_ads: {
    module: googleAds,
    fetchMethod: 'getGoogleAdsData',
    requiredParam: 'google-ads-customer-id',
    label: 'Google Ads',
  },
  meta_ads: {
    module: metaAds,
    fetchMethod: 'getMetaAdsData',
    requiredParam: 'meta-ad-account-id',
    label: 'Meta (Facebook/Instagram)',
  },
  linkedin_ads: {
    module: linkedinAds,
    fetchMethod: 'getLinkedInAdsData',
    requiredParam: 'linkedin-ad-account-id',
    label: 'LinkedIn',
  },
  tiktok_ads: {
    module: tiktokAds,
    fetchMethod: 'getTikTokAdsData',
    requiredParam: 'tiktok-advertiser-id',
    label: 'TikTok',
  },
};

/**
 * Kontrollerar vilka annonsplattformar som ar konfigurerade for en kund.
 * Gor snabba SSM-lookups for att se vilka credentials som finns.
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<Object>} Objekt med plattformsnamn som nycklar och boolean som varden
 */
async function getConfiguredPlatforms(customerId, getParam) {
  const results = {};

  const checks = Object.entries(PLATFORM_CONFIG).map(async ([key, config]) => {
    try {
      await getParam(`/seo-mcp/integrations/${customerId}/${config.requiredParam}`);
      results[key] = { configured: true, label: config.label };
    } catch (err) {
      results[key] = { configured: false, label: config.label };
    }
  });

  await Promise.all(checks);
  return results;
}

/**
 * Hamtar ALL annonsdata for en kund fran alla konfigurerade plattformar.
 *
 * Kontrollerar forst vilka plattformar kunden har credentials for,
 * och hamtar sedan data parallellt fran alla aktiverade plattformar.
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @param {Object} [options] - Valfria alternativ
 * @param {Array<string>} [options.platforms] - Begransar till specifika plattformar (ex: ['google_ads', 'meta_ads'])
 * @returns {Promise<Object>} Aggregerat objekt med data per plattform + summering
 */
async function getAllAdsData(customerId, getParam, options = {}) {
  const platformFilter = options.platforms || null;
  const startTime = Date.now();

  // Bestam vilka plattformar som ska hamtas
  const platformsToFetch = Object.entries(PLATFORM_CONFIG)
    .filter(([key]) => !platformFilter || platformFilter.includes(key));

  // Hamta data parallellt fran alla plattformar
  const fetchPromises = platformsToFetch.map(async ([key, config]) => {
    try {
      const data = await config.module[config.fetchMethod](customerId, getParam);
      return { key, data };
    } catch (err) {
      return {
        key,
        data: {
          available: false,
          error: `Ovantant fel vid hamtning fran ${config.label}: ${err.message}`,
          platform: key,
          customerId,
        },
      };
    }
  });

  const results = await Promise.all(fetchPromises);

  // Bygg resultat-objekt
  const platformData = {};
  for (const { key, data } of results) {
    platformData[key] = data;
  }

  // Berakna aggregerad summering over alla plattformar
  const activePlatforms = results.filter(r => r.data.available);
  const aggregatedSummary = {
    totalPlatforms: activePlatforms.length,
    activePlatforms: activePlatforms.map(r => PLATFORM_CONFIG[r.key].label),
    inactivePlatforms: results
      .filter(r => !r.data.available)
      .map(r => PLATFORM_CONFIG[r.key].label),
    totalSpend: 0,
    totalClicks: 0,
    totalImpressions: 0,
    totalConversions: 0,
    currency: 'SEK',
    fetchTimeMs: 0,
  };

  for (const { data } of activePlatforms) {
    const summary = data.summary || {};
    aggregatedSummary.totalSpend += parseFloat(summary.totalSpend || summary.totalCost || 0);
    aggregatedSummary.totalClicks += parseInt(summary.totalClicks || 0);
    aggregatedSummary.totalImpressions += parseInt(summary.totalImpressions || 0);
    aggregatedSummary.totalConversions += parseInt(summary.totalConversions || 0);
  }

  aggregatedSummary.totalSpend = aggregatedSummary.totalSpend.toFixed(2);
  aggregatedSummary.totalCtr = aggregatedSummary.totalImpressions > 0
    ? (aggregatedSummary.totalClicks / aggregatedSummary.totalImpressions * 100).toFixed(2)
    : '0.00';
  aggregatedSummary.costPerConversion = aggregatedSummary.totalConversions > 0
    ? (parseFloat(aggregatedSummary.totalSpend) / aggregatedSummary.totalConversions).toFixed(2)
    : null;
  aggregatedSummary.fetchTimeMs = Date.now() - startTime;

  return {
    customerId,
    summary: aggregatedSummary,
    platforms: platformData,
  };
}

/**
 * Hamtar en sammanfattning av annonsutgifter per plattform, utan detaljerad kampanjdata.
 * Snabbare an getAllAdsData for oversiktsvyer.
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<Object>} Forenklade utgiftssiffror per plattform
 */
async function getAdsSpendSummary(customerId, getParam) {
  const allData = await getAllAdsData(customerId, getParam);
  const spend = {};

  for (const [key, config] of Object.entries(PLATFORM_CONFIG)) {
    const platformData = allData.platforms[key];
    if (platformData && platformData.available) {
      const summary = platformData.summary || {};
      spend[key] = {
        label: config.label,
        spend: parseFloat(summary.totalSpend || summary.totalCost || 0).toFixed(2),
        clicks: parseInt(summary.totalClicks || 0),
        conversions: parseInt(summary.totalConversions || 0),
        available: true,
      };
    } else {
      spend[key] = {
        label: config.label,
        available: false,
        error: platformData?.error || 'Inte konfigurerad',
      };
    }
  }

  return {
    customerId,
    totalSpend: allData.summary.totalSpend,
    currency: 'SEK',
    platforms: spend,
  };
}

module.exports = {
  // Individuella plattforms-moduler
  googleAds,
  metaAds,
  linkedinAds,
  tiktokAds,

  // Aggregeringsfunktioner
  getAllAdsData,
  getAdsSpendSummary,
  getConfiguredPlatforms,

  // Plattforms-konfiguration (for dynamisk UI-rendering)
  PLATFORM_CONFIG,
};
