/**
 * TikTok Ads Integration Module
 *
 * Hamtar kampanjdata, ad groups och ads via TikTok Marketing API (v1.3).
 * Anvander access token for autentisering.
 *
 * SSM-parametrar:
 *   /seo-mcp/integrations/{id}/tiktok-advertiser-id  — TikTok advertiser ID
 *   /seo-mcp/integrations/{id}/tiktok-access-token   — TikTok API access token
 */

const axios = require('axios');

const TIKTOK_API_BASE = 'https://business-api.tiktok.com/open_api/v1.3';

/**
 * Hamtar TikTok Ads credentials fran SSM.
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<{advertiserId: string, accessToken: string}|null>}
 */
async function getCredentials(customerId, getParam) {
  try {
    const advertiserId = await getParam(`/seo-mcp/integrations/${customerId}/tiktok-advertiser-id`);
    const accessToken = await getParam(`/seo-mcp/integrations/${customerId}/tiktok-access-token`);
    return { advertiserId, accessToken };
  } catch (err) {
    return null;
  }
}

/**
 * Gor ett GET-anrop till TikTok Marketing API.
 * @param {string} endpoint - API-endpoint (ex: /campaign/get/)
 * @param {string} accessToken - Access token
 * @param {Object} params - Query-parametrar
 * @returns {Promise<Object>} Respons-data
 */
async function tiktokApiGet(endpoint, accessToken, params = {}) {
  const response = await axios.get(`${TIKTOK_API_BASE}${endpoint}`, {
    params,
    headers: {
      'Access-Token': accessToken,
    },
    timeout: 30000,
  });

  const data = response.data;
  if (data.code !== 0) {
    const error = new Error(`TikTok API error: ${data.message}`);
    error.tiktokCode = data.code;
    throw error;
  }

  return data.data;
}

/**
 * Gor ett POST-anrop till TikTok Marketing API (for report-endpoints).
 * @param {string} endpoint - API-endpoint
 * @param {string} accessToken - Access token
 * @param {Object} body - Request body
 * @returns {Promise<Object>} Respons-data
 */
async function tiktokApiPost(endpoint, accessToken, body = {}) {
  const response = await axios.post(`${TIKTOK_API_BASE}${endpoint}`, body, {
    headers: {
      'Access-Token': accessToken,
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  const data = response.data;
  if (data.code !== 0) {
    const error = new Error(`TikTok API error: ${data.message}`);
    error.tiktokCode = data.code;
    throw error;
  }

  return data.data;
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
 * Hamtar kampanjer fran TikTok med paginering.
 * @param {string} advertiserId - TikTok advertiser ID
 * @param {string} accessToken - Access token
 * @returns {Promise<Array>}
 */
async function fetchCampaigns(advertiserId, accessToken) {
  const allCampaigns = [];
  let page = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const data = await tiktokApiGet('/campaign/get/', accessToken, {
      advertiser_id: advertiserId,
      page,
      page_size: pageSize,
      filtering: JSON.stringify({
        status: ['CAMPAIGN_STATUS_ENABLE', 'CAMPAIGN_STATUS_DISABLE', 'CAMPAIGN_STATUS_BUDGET_EXCEED'],
      }),
    });

    const campaigns = data.list || [];
    allCampaigns.push(...campaigns);

    if (campaigns.length < pageSize || allCampaigns.length >= (data.page_info?.total_number || 0)) {
      hasMore = false;
    }
    page++;
  }

  return allCampaigns;
}

/**
 * Hamtar ad groups fran TikTok med paginering.
 * @param {string} advertiserId - TikTok advertiser ID
 * @param {string} accessToken - Access token
 * @returns {Promise<Array>}
 */
async function fetchAdGroups(advertiserId, accessToken) {
  const allAdGroups = [];
  let page = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const data = await tiktokApiGet('/adgroup/get/', accessToken, {
      advertiser_id: advertiserId,
      page,
      page_size: pageSize,
    });

    const adGroups = data.list || [];
    allAdGroups.push(...adGroups);

    if (adGroups.length < pageSize || allAdGroups.length >= (data.page_info?.total_number || 0)) {
      hasMore = false;
    }
    page++;
  }

  return allAdGroups;
}

/**
 * Hamtar integrerad rapport for kampanjer (Reporting API).
 * @param {string} advertiserId - TikTok advertiser ID
 * @param {string} accessToken - Access token
 * @param {string} startDate - Startdatum YYYY-MM-DD
 * @param {string} endDate - Slutdatum YYYY-MM-DD
 * @param {string} dataLevel - Rapportniva: AUCTION_CAMPAIGN, AUCTION_ADGROUP, AUCTION_AD
 * @returns {Promise<Array>}
 */
async function fetchReport(advertiserId, accessToken, startDate, endDate, dataLevel) {
  const allRows = [];
  let page = 1;
  const pageSize = 100;
  let hasMore = true;

  while (hasMore) {
    const data = await tiktokApiGet('/report/integrated/get/', accessToken, {
      advertiser_id: advertiserId,
      report_type: 'BASIC',
      data_level: dataLevel,
      dimensions: JSON.stringify(dataLevel === 'AUCTION_CAMPAIGN'
        ? ['campaign_id']
        : dataLevel === 'AUCTION_ADGROUP'
          ? ['adgroup_id']
          : ['ad_id']
      ),
      metrics: JSON.stringify([
        'spend', 'impressions', 'clicks', 'ctr', 'cpc',
        'reach', 'frequency', 'conversion', 'cost_per_conversion',
        'total_complete_payment_rate', 'video_play_actions',
        'video_watched_2s', 'video_watched_6s',
        'likes', 'comments', 'shares', 'follows',
        'profile_visits',
      ]),
      start_date: startDate,
      end_date: endDate,
      page,
      page_size: pageSize,
    });

    const rows = data.list || [];
    allRows.push(...rows);

    if (rows.length < pageSize || allRows.length >= (data.page_info?.total_number || 0)) {
      hasMore = false;
    }
    page++;
  }

  return allRows;
}

/**
 * Hamtar komplett annonsdata fran TikTok for senaste 30 dagarna.
 * Inkluderar kampanjer, ad groups och detaljerad statistik.
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<Object>} Komplett annonsdataobjekt
 */
async function getTikTokAdsData(customerId, getParam) {
  const creds = await getCredentials(customerId, getParam);
  if (!creds) {
    return {
      available: false,
      error: 'TikTok Ads-credentials saknas i SSM for denna kund',
      platform: 'tiktok_ads',
      customerId,
    };
  }

  const { startDate, endDate } = getLast30DaysRange();

  try {
    // --- Hamta kampanjer ---
    const rawCampaigns = await fetchCampaigns(creds.advertiserId, creds.accessToken);

    // --- Hamta kampanjrapport ---
    const campaignReport = await fetchReport(
      creds.advertiserId, creds.accessToken, startDate, endDate, 'AUCTION_CAMPAIGN'
    );

    // Skapa lookup for rapport per kampanj-ID
    const reportByCampaign = {};
    for (const row of campaignReport) {
      const dims = row.dimensions || {};
      reportByCampaign[dims.campaign_id] = row.metrics || {};
    }

    const campaigns = rawCampaigns.map(campaign => {
      const metrics = reportByCampaign[campaign.campaign_id] || {};

      return {
        id: campaign.campaign_id,
        name: campaign.campaign_name,
        status: campaign.status || campaign.operation_status,
        objective: campaign.objective_type,
        budgetMode: campaign.budget_mode,
        budget: campaign.budget ? parseFloat(campaign.budget).toFixed(2) : null,
        spend: parseFloat(metrics.spend || 0).toFixed(2),
        impressions: parseInt(metrics.impressions || 0),
        clicks: parseInt(metrics.clicks || 0),
        ctr: parseFloat(metrics.ctr || 0).toFixed(4),
        cpc: parseFloat(metrics.cpc || 0).toFixed(2),
        reach: parseInt(metrics.reach || 0),
        frequency: parseFloat(metrics.frequency || 0).toFixed(2),
        conversions: parseInt(metrics.conversion || 0),
        costPerConversion: parseFloat(metrics.cost_per_conversion || 0).toFixed(2),
        engagement: {
          videoPlays: parseInt(metrics.video_play_actions || 0),
          videoWatched2s: parseInt(metrics.video_watched_2s || 0),
          videoWatched6s: parseInt(metrics.video_watched_6s || 0),
          likes: parseInt(metrics.likes || 0),
          comments: parseInt(metrics.comments || 0),
          shares: parseInt(metrics.shares || 0),
          follows: parseInt(metrics.follows || 0),
          profileVisits: parseInt(metrics.profile_visits || 0),
        },
      };
    });

    // --- Hamta ad groups ---
    const rawAdGroups = await fetchAdGroups(creds.advertiserId, creds.accessToken);

    const adGroupReport = await fetchReport(
      creds.advertiserId, creds.accessToken, startDate, endDate, 'AUCTION_ADGROUP'
    );

    const reportByAdGroup = {};
    for (const row of adGroupReport) {
      const dims = row.dimensions || {};
      reportByAdGroup[dims.adgroup_id] = row.metrics || {};
    }

    const adGroups = rawAdGroups.map(adGroup => {
      const metrics = reportByAdGroup[adGroup.adgroup_id] || {};

      // Extrahera malsgruppsinformation
      const targeting = {};
      if (adGroup.location_ids) targeting.locations = adGroup.location_ids;
      if (adGroup.age_groups) targeting.ageGroups = adGroup.age_groups;
      if (adGroup.gender) targeting.gender = adGroup.gender;
      if (adGroup.interest_category_ids) targeting.interestCategories = adGroup.interest_category_ids;
      if (adGroup.languages) targeting.languages = adGroup.languages;

      return {
        id: adGroup.adgroup_id,
        name: adGroup.adgroup_name,
        campaignId: adGroup.campaign_id,
        status: adGroup.status || adGroup.operation_status,
        placementType: adGroup.placement_type,
        budget: adGroup.budget ? parseFloat(adGroup.budget).toFixed(2) : null,
        bidType: adGroup.bid_type,
        targeting,
        spend: parseFloat(metrics.spend || 0).toFixed(2),
        impressions: parseInt(metrics.impressions || 0),
        clicks: parseInt(metrics.clicks || 0),
        ctr: parseFloat(metrics.ctr || 0).toFixed(4),
        conversions: parseInt(metrics.conversion || 0),
      };
    });

    // --- Aggregerade siffror ---
    const totalSpend = campaigns.reduce((sum, c) => sum + parseFloat(c.spend), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalVideoPlays = campaigns.reduce((sum, c) => sum + c.engagement.videoPlays, 0);
    const totalLikes = campaigns.reduce((sum, c) => sum + c.engagement.likes, 0);
    const totalComments = campaigns.reduce((sum, c) => sum + c.engagement.comments, 0);
    const totalShares = campaigns.reduce((sum, c) => sum + c.engagement.shares, 0);

    return {
      available: true,
      platform: 'tiktok_ads',
      customerId,
      period: { startDate, endDate },
      summary: {
        totalCampaigns: campaigns.length,
        totalAdGroups: adGroups.length,
        totalSpend: totalSpend.toFixed(2),
        totalClicks,
        totalImpressions,
        totalReach,
        totalCtr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00',
        totalConversions,
        costPerConversion: totalConversions > 0
          ? (totalSpend / totalConversions).toFixed(2)
          : null,
        costPerClick: totalClicks > 0
          ? (totalSpend / totalClicks).toFixed(2)
          : null,
        engagement: {
          totalVideoPlays,
          totalLikes,
          totalComments,
          totalShares,
        },
        currency: 'SEK',
      },
      campaigns,
      adGroups,
    };
  } catch (err) {
    return {
      available: false,
      error: `TikTok Ads API-fel: ${err.message}`,
      tiktokCode: err.tiktokCode || null,
      statusCode: err.response?.status || null,
      platform: 'tiktok_ads',
      customerId,
    };
  }
}

module.exports = {
  getTikTokAdsData,
};
