/**
 * LinkedIn Ads Integration Module
 *
 * Hamtar kampanjdata, kampanjgrupper och konverteringar via LinkedIn Marketing API (v2).
 * Anvander OAuth2 access token for autentisering.
 *
 * SSM-parametrar:
 *   /seo-mcp/integrations/{id}/linkedin-ad-account-id  — LinkedIn ad account ID (sponsoredAccount URN-nummer)
 *   /seo-mcp/integrations/{id}/linkedin-access-token   — OAuth2 access token
 */

const axios = require('axios');

const LINKEDIN_API_BASE = 'https://api.linkedin.com/rest';
const LINKEDIN_API_VERSION = '202402'; // LinkedIn uses YYYYMM versioning

/**
 * Hamtar LinkedIn Ads credentials fran SSM.
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<{adAccountId: string, accessToken: string}|null>}
 */
async function getCredentials(customerId, getParam) {
  try {
    const adAccountId = await getParam(`/seo-mcp/integrations/${customerId}/linkedin-ad-account-id`);
    const accessToken = await getParam(`/seo-mcp/integrations/${customerId}/linkedin-access-token`);
    return { adAccountId, accessToken };
  } catch (err) {
    return null;
  }
}

/**
 * Gor ett GET-anrop till LinkedIn Marketing API.
 * @param {string} endpoint - API-endpoint
 * @param {string} accessToken - OAuth2 access token
 * @param {Object} params - Query-parametrar
 * @returns {Promise<Object>} Respons-data
 */
async function linkedinApiGet(endpoint, accessToken, params = {}) {
  const response = await axios.get(`${LINKEDIN_API_BASE}${endpoint}`, {
    params,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'LinkedIn-Version': LINKEDIN_API_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    timeout: 30000,
  });
  return response.data;
}

/**
 * Beraknar datumintervall for senaste 30 dagarna.
 * LinkedIn anvander epoch-millisekunder for dateRange.
 * @returns {{startDate: Object, endDate: Object, isoStart: string, isoEnd: string}}
 */
function getLast30DaysRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);

  return {
    startDate: {
      year: start.getFullYear(),
      month: start.getMonth() + 1,
      day: start.getDate(),
    },
    endDate: {
      year: end.getFullYear(),
      month: end.getMonth() + 1,
      day: end.getDate(),
    },
    isoStart: start.toISOString().split('T')[0],
    isoEnd: end.toISOString().split('T')[0],
  };
}

/**
 * Hamtar kampanjgrupper (Campaign Groups) fran LinkedIn.
 * @param {string} adAccountId - LinkedIn ad account ID
 * @param {string} accessToken - Access token
 * @returns {Promise<Array>}
 */
async function getCampaignGroups(adAccountId, accessToken) {
  try {
    const data = await linkedinApiGet(
      '/adAccounts/' + adAccountId + '/adCampaignGroups',
      accessToken,
      {
        q: 'search',
        'search.status.values[0]': 'ACTIVE',
        'search.status.values[1]': 'PAUSED',
        'search.status.values[2]': 'COMPLETED',
        count: 100,
      }
    );
    return data.elements || [];
  } catch (err) {
    // Fallback: kan vara ett annat API-svar format
    return [];
  }
}

/**
 * Hamtar kampanjer fran LinkedIn.
 * @param {string} adAccountId - LinkedIn ad account ID
 * @param {string} accessToken - Access token
 * @returns {Promise<Array>}
 */
async function getCampaigns(adAccountId, accessToken) {
  try {
    const data = await linkedinApiGet(
      '/adAccounts/' + adAccountId + '/adCampaigns',
      accessToken,
      {
        q: 'search',
        'search.status.values[0]': 'ACTIVE',
        'search.status.values[1]': 'PAUSED',
        'search.status.values[2]': 'COMPLETED',
        count: 100,
      }
    );
    return data.elements || [];
  } catch (err) {
    return [];
  }
}

/**
 * Hamtar analytics-data (insights) for kampanjer fran LinkedIn.
 * Anvander adAnalytics endpoint med campaign-pivot.
 *
 * @param {string} adAccountId - LinkedIn ad account ID
 * @param {string} accessToken - Access token
 * @param {Array<string>} campaignUrns - Lista av kampanj-URN:er
 * @param {Object} dateRange - Start- och slutdatum
 * @returns {Promise<Array>}
 */
async function getCampaignAnalytics(adAccountId, accessToken, campaignUrns, dateRange) {
  if (!campaignUrns.length) return [];

  try {
    // LinkedIn Ads Reporting API
    const params = {
      q: 'analytics',
      pivot: 'CAMPAIGN',
      dateRange: JSON.stringify({
        start: dateRange.startDate,
        end: dateRange.endDate,
      }),
      timeGranularity: 'ALL',
      'campaigns[0]': campaignUrns[0],
      fields: 'impressions,clicks,costInLocalCurrency,externalWebsiteConversions,' +
              'externalWebsitePostClickConversions,externalWebsitePostViewConversions,' +
              'likes,comments,shares,follows,totalEngagements,videoViews',
    };

    // Lagg till alla kampanj-URN:er (max 20 at gangen)
    const batchSize = 20;
    const allAnalytics = [];

    for (let i = 0; i < campaignUrns.length; i += batchSize) {
      const batch = campaignUrns.slice(i, i + batchSize);
      const batchParams = { ...params };
      batch.forEach((urn, idx) => {
        batchParams[`campaigns[${idx}]`] = urn;
      });

      const data = await linkedinApiGet('/adAnalytics', accessToken, batchParams);
      if (data.elements) {
        allAnalytics.push(...data.elements);
      }
    }

    return allAnalytics;
  } catch (err) {
    return [];
  }
}

/**
 * Hamtar komplett annonsdata fran LinkedIn for senaste 30 dagarna.
 * Inkluderar kampanjgrupper, kampanjer och analytics.
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<Object>} Komplett annonsdataobjekt
 */
async function getLinkedInAdsData(customerId, getParam) {
  const creds = await getCredentials(customerId, getParam);
  if (!creds) {
    return {
      available: false,
      error: 'LinkedIn Ads-credentials saknas i SSM for denna kund',
      platform: 'linkedin_ads',
      customerId,
    };
  }

  const dateRange = getLast30DaysRange();

  try {
    // --- Hamta kampanjgrupper ---
    const rawGroups = await getCampaignGroups(creds.adAccountId, creds.accessToken);
    const campaignGroups = rawGroups.map(group => ({
      id: group.id,
      name: group.name,
      status: group.status,
      totalBudget: group.totalBudget
        ? parseFloat(group.totalBudget.amount || 0).toFixed(2)
        : null,
    }));

    // --- Hamta kampanjer ---
    const rawCampaigns = await getCampaigns(creds.adAccountId, creds.accessToken);

    // Bygg kampanj-URN:er for analytics-hamtning
    const campaignUrns = rawCampaigns.map(c => `urn:li:sponsoredCampaign:${c.id}`);

    // --- Hamta analytics ---
    const analytics = await getCampaignAnalytics(
      creds.adAccountId, creds.accessToken, campaignUrns, dateRange
    );

    // Skapa en lookup for analytics per kampanj-URN
    const analyticsByCampaign = {};
    for (const entry of analytics) {
      // pivotValue ar kampanj-URN
      const urn = entry.pivotValue || entry.pivot;
      analyticsByCampaign[urn] = entry;
    }

    const campaigns = rawCampaigns.map(campaign => {
      const urn = `urn:li:sponsoredCampaign:${campaign.id}`;
      const stats = analyticsByCampaign[urn] || {};

      const impressions = parseInt(stats.impressions || 0);
      const clicks = parseInt(stats.clicks || 0);
      const costLocal = parseFloat(stats.costInLocalCurrency || 0);
      const conversions = parseInt(stats.externalWebsiteConversions || 0)
        + parseInt(stats.externalWebsitePostClickConversions || 0);

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        type: campaign.type,
        objectiveType: campaign.objectiveType,
        dailyBudget: campaign.dailyBudget
          ? parseFloat(campaign.dailyBudget.amount || 0).toFixed(2)
          : null,
        totalBudget: campaign.totalBudget
          ? parseFloat(campaign.totalBudget.amount || 0).toFixed(2)
          : null,
        impressions,
        clicks,
        ctr: impressions > 0 ? (clicks / impressions * 100).toFixed(2) : '0.00',
        cpc: clicks > 0 ? (costLocal / clicks).toFixed(2) : '0.00',
        spend: costLocal.toFixed(2),
        conversions,
        engagement: {
          likes: parseInt(stats.likes || 0),
          comments: parseInt(stats.comments || 0),
          shares: parseInt(stats.shares || 0),
          follows: parseInt(stats.follows || 0),
          totalEngagements: parseInt(stats.totalEngagements || 0),
          videoViews: parseInt(stats.videoViews || 0),
        },
      };
    });

    // --- Aggregerade siffror ---
    const totalSpend = campaigns.reduce((sum, c) => sum + parseFloat(c.spend), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);
    const totalEngagements = campaigns.reduce((sum, c) => sum + c.engagement.totalEngagements, 0);

    return {
      available: true,
      platform: 'linkedin_ads',
      customerId,
      period: {
        startDate: dateRange.isoStart,
        endDate: dateRange.isoEnd,
      },
      summary: {
        totalCampaignGroups: campaignGroups.length,
        totalCampaigns: campaigns.length,
        totalSpend: totalSpend.toFixed(2),
        totalClicks,
        totalImpressions,
        totalCtr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00',
        totalConversions,
        totalEngagements,
        costPerConversion: totalConversions > 0
          ? (totalSpend / totalConversions).toFixed(2)
          : null,
        costPerClick: totalClicks > 0
          ? (totalSpend / totalClicks).toFixed(2)
          : null,
        currency: 'SEK',
      },
      campaignGroups,
      campaigns,
    };
  } catch (err) {
    return {
      available: false,
      error: `LinkedIn Ads API-fel: ${err.response?.data?.message || err.message}`,
      statusCode: err.response?.status || null,
      platform: 'linkedin_ads',
      customerId,
    };
  }
}

module.exports = {
  getLinkedInAdsData,
};
