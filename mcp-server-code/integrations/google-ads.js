/**
 * Google Ads Integration Module
 *
 * Hamtar kampanjdata, sokordsrapporter och konverteringsdata via Google Ads REST API (v17).
 * Anvander OAuth2 for autentisering och SSM Parameter Store for credentials.
 *
 * SSM-parametrar:
 *   /seo-mcp/integrations/{id}/google-ads-customer-id   — Google Ads kund-ID (xxx-xxx-xxxx)
 *   /seo-mcp/integrations/{id}/google-ads-developer-token — Developer token
 *   /seo-mcp/google-ads/oauth-token                      — OAuth2 refresh token (delad)
 *   /seo-mcp/google-ads/client-id                        — OAuth2 client ID
 *   /seo-mcp/google-ads/client-secret                    — OAuth2 client secret
 */

const axios = require('axios');

const GOOGLE_ADS_API_VERSION = 'v17';
const GOOGLE_ADS_BASE_URL = `https://googleads.googleapis.com/${GOOGLE_ADS_API_VERSION}`;
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

// Cache for OAuth access tokens (kortare TTL an SSM-cache, tokens lever ~1h)
let _accessTokenCache = null;
let _accessTokenExpiry = 0;

/**
 * Hamtar en giltig OAuth2 access token via refresh token.
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<string>} Access token
 */
async function getAccessToken(getParam) {
  const now = Date.now();
  if (_accessTokenCache && now < _accessTokenExpiry) {
    return _accessTokenCache;
  }

  const refreshToken = await getParam('/seo-mcp/google-ads/oauth-token');
  const clientId = await getParam('/seo-mcp/google-ads/client-id');
  const clientSecret = await getParam('/seo-mcp/google-ads/client-secret');

  const response = await axios.post(GOOGLE_TOKEN_URL, {
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
  });

  _accessTokenCache = response.data.access_token;
  // Satt expiry 5 minuter fore faktisk for att undvika race conditions
  _accessTokenExpiry = now + (response.data.expires_in - 300) * 1000;
  return _accessTokenCache;
}

/**
 * Hamtar Google Ads kund-ID och developer token fran SSM.
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<{customerId: string, developerToken: string}|null>}
 */
async function getCredentials(customerId, getParam) {
  try {
    const adsCustomerId = await getParam(`/seo-mcp/integrations/${customerId}/google-ads-customer-id`);
    const developerToken = await getParam(`/seo-mcp/integrations/${customerId}/google-ads-developer-token`);
    return {
      customerId: adsCustomerId.replace(/-/g, ''),
      developerToken,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Kor en Google Ads Query Language (GAQL) fraga mot Search endpoint.
 * @param {string} customerId - Google Ads kund-ID (utan bindestreck)
 * @param {string} developerToken - Developer token
 * @param {string} accessToken - OAuth2 access token
 * @param {string} query - GAQL-fraga
 * @returns {Promise<Array>} Resultat-rader
 */
async function executeGaql(customerId, developerToken, accessToken, query) {
  const url = `${GOOGLE_ADS_BASE_URL}/customers/${customerId}/googleAds:searchStream`;
  const response = await axios.post(
    url,
    { query },
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': developerToken,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    }
  );

  // searchStream returnerar en array av batches, varje batch har results
  const results = [];
  if (Array.isArray(response.data)) {
    for (const batch of response.data) {
      if (batch.results) {
        results.push(...batch.results);
      }
    }
  }
  return results;
}

/**
 * Beraknar datumintervall for senaste 30 dagarna i YYYY-MM-DD format.
 * @returns {{startDate: string, endDate: string}}
 */
function getLast30DaysRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    startDate: start.toISOString().split('T')[0],
    endDate: end.toISOString().split('T')[0],
  };
}

/**
 * Hamtar kampanjdata fran Google Ads for senaste 30 dagarna.
 * Inkluderar kampanjer, sokordsrapport och konverteringsdata.
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<Object>} Komplett annonsdataobjekt
 */
async function getGoogleAdsData(customerId, getParam) {
  const creds = await getCredentials(customerId, getParam);
  if (!creds) {
    return {
      available: false,
      error: 'Google Ads-credentials saknas i SSM for denna kund',
      platform: 'google_ads',
      customerId,
    };
  }

  let accessToken;
  try {
    accessToken = await getAccessToken(getParam);
  } catch (err) {
    return {
      available: false,
      error: `OAuth-token kunde inte hamtas: ${err.message}`,
      platform: 'google_ads',
      customerId,
    };
  }

  const { startDate, endDate } = getLast30DaysRange();

  try {
    // --- Kampanjdata ---
    const campaignQuery = `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign_budget.amount_micros,
        metrics.clicks,
        metrics.impressions,
        metrics.ctr,
        metrics.average_cpc,
        metrics.conversions,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND campaign.status != 'REMOVED'
      ORDER BY metrics.cost_micros DESC
    `;
    const campaignResults = await executeGaql(
      creds.customerId, creds.developerToken, accessToken, campaignQuery
    );

    const campaigns = campaignResults.map(row => ({
      id: row.campaign?.id,
      name: row.campaign?.name,
      status: row.campaign?.status,
      budget: row.campaignBudget?.amountMicros
        ? (parseInt(row.campaignBudget.amountMicros) / 1_000_000).toFixed(2)
        : null,
      clicks: parseInt(row.metrics?.clicks || 0),
      impressions: parseInt(row.metrics?.impressions || 0),
      ctr: parseFloat(row.metrics?.ctr || 0),
      averageCpc: row.metrics?.averageCpc
        ? (parseInt(row.metrics.averageCpc) / 1_000_000).toFixed(2)
        : '0.00',
      conversions: parseFloat(row.metrics?.conversions || 0),
      cost: row.metrics?.costMicros
        ? (parseInt(row.metrics.costMicros) / 1_000_000).toFixed(2)
        : '0.00',
    }));

    // --- Sokordsrapport ---
    const keywordQuery = `
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        metrics.clicks,
        metrics.impressions,
        metrics.average_cpc,
        metrics.conversions,
        metrics.search_impression_share
      FROM keyword_view
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND ad_group_criterion.status != 'REMOVED'
      ORDER BY metrics.impressions DESC
      LIMIT 100
    `;
    const keywordResults = await executeGaql(
      creds.customerId, creds.developerToken, accessToken, keywordQuery
    );

    const keywords = keywordResults.map(row => ({
      keyword: row.adGroupCriterion?.keyword?.text,
      matchType: row.adGroupCriterion?.keyword?.matchType,
      clicks: parseInt(row.metrics?.clicks || 0),
      impressions: parseInt(row.metrics?.impressions || 0),
      averageCpc: row.metrics?.averageCpc
        ? (parseInt(row.metrics.averageCpc) / 1_000_000).toFixed(2)
        : '0.00',
      conversions: parseFloat(row.metrics?.conversions || 0),
      impressionShare: parseFloat(row.metrics?.searchImpressionShare || 0),
    }));

    // --- Konverteringsrapport ---
    const conversionQuery = `
      SELECT
        conversion_action.name,
        conversion_action.type,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion
      FROM conversion_action
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
      ORDER BY metrics.conversions DESC
    `;
    const conversionResults = await executeGaql(
      creds.customerId, creds.developerToken, accessToken, conversionQuery
    );

    const conversions = conversionResults.map(row => ({
      name: row.conversionAction?.name,
      type: row.conversionAction?.type,
      conversions: parseFloat(row.metrics?.conversions || 0),
      value: parseFloat(row.metrics?.conversionsValue || 0),
      costPerConversion: row.metrics?.costPerConversion
        ? (parseInt(row.metrics.costPerConversion) / 1_000_000).toFixed(2)
        : '0.00',
    }));

    // --- Aggregerade siffror ---
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalCost = campaigns.reduce((sum, c) => sum + parseFloat(c.cost), 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    return {
      available: true,
      platform: 'google_ads',
      customerId,
      period: { startDate, endDate },
      summary: {
        totalCampaigns: campaigns.length,
        totalClicks,
        totalImpressions,
        totalCtr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00',
        totalCost: totalCost.toFixed(2),
        totalConversions,
        costPerConversion: totalConversions > 0
          ? (totalCost / totalConversions).toFixed(2)
          : null,
        currency: 'SEK',
      },
      campaigns,
      keywords,
      conversions,
    };
  } catch (err) {
    return {
      available: false,
      error: `Google Ads API-fel: ${err.response?.data?.error?.message || err.message}`,
      platform: 'google_ads',
      customerId,
    };
  }
}

/**
 * Hamtar enbart konverteringsdata fran Google Ads for senaste 30 dagarna.
 * Lattare anrop an getGoogleAdsData om man bara behover konverteringar.
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<Object>} Konverteringsdata
 */
async function getGoogleAdsConversions(customerId, getParam) {
  const creds = await getCredentials(customerId, getParam);
  if (!creds) {
    return {
      available: false,
      error: 'Google Ads-credentials saknas i SSM for denna kund',
      platform: 'google_ads',
      customerId,
    };
  }

  let accessToken;
  try {
    accessToken = await getAccessToken(getParam);
  } catch (err) {
    return {
      available: false,
      error: `OAuth-token kunde inte hamtas: ${err.message}`,
      platform: 'google_ads',
      customerId,
    };
  }

  const { startDate, endDate } = getLast30DaysRange();

  try {
    // Konverteringar per kampanj
    const query = `
      SELECT
        campaign.name,
        conversion_action.name,
        conversion_action.type,
        metrics.conversions,
        metrics.conversions_value,
        metrics.cost_per_conversion,
        metrics.cost_micros
      FROM campaign
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
        AND metrics.conversions > 0
      ORDER BY metrics.conversions DESC
    `;
    const results = await executeGaql(
      creds.customerId, creds.developerToken, accessToken, query
    );

    const conversions = results.map(row => ({
      campaignName: row.campaign?.name,
      conversionAction: row.conversionAction?.name,
      type: row.conversionAction?.type,
      conversions: parseFloat(row.metrics?.conversions || 0),
      value: parseFloat(row.metrics?.conversionsValue || 0),
      costPerConversion: row.metrics?.costPerConversion
        ? (parseInt(row.metrics.costPerConversion) / 1_000_000).toFixed(2)
        : '0.00',
      cost: row.metrics?.costMicros
        ? (parseInt(row.metrics.costMicros) / 1_000_000).toFixed(2)
        : '0.00',
    }));

    const totalConversions = conversions.reduce((sum, c) => sum + c.conversions, 0);
    const totalValue = conversions.reduce((sum, c) => sum + c.value, 0);
    const totalCost = conversions.reduce((sum, c) => sum + parseFloat(c.cost), 0);

    return {
      available: true,
      platform: 'google_ads',
      customerId,
      period: { startDate, endDate },
      summary: {
        totalConversions,
        totalValue: totalValue.toFixed(2),
        totalCost: totalCost.toFixed(2),
        costPerConversion: totalConversions > 0
          ? (totalCost / totalConversions).toFixed(2)
          : null,
        currency: 'SEK',
      },
      conversions,
    };
  } catch (err) {
    return {
      available: false,
      error: `Google Ads API-fel: ${err.response?.data?.error?.message || err.message}`,
      platform: 'google_ads',
      customerId,
    };
  }
}

module.exports = {
  getGoogleAdsData,
  getGoogleAdsConversions,
};
