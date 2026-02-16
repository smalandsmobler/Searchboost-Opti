/**
 * Meta (Facebook/Instagram) Ads Integration Module
 *
 * Hamtar kampanjdata, ad sets, ads och pixel-events via Meta Marketing API (v21.0).
 * Anvander long-lived access token for autentisering.
 *
 * SSM-parametrar:
 *   /seo-mcp/integrations/{id}/meta-ad-account-id  — Meta ad account ID (act_XXXXX)
 *   /seo-mcp/integrations/{id}/meta-access-token   — Long-lived access token
 *   /seo-mcp/integrations/{id}/meta-pixel-id       — Meta Pixel ID (valfri, for pixel-events)
 */

const axios = require('axios');

const META_API_VERSION = 'v21.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;

/**
 * Hamtar Meta Ads credentials fran SSM.
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<{adAccountId: string, accessToken: string, pixelId: string|null}|null>}
 */
async function getCredentials(customerId, getParam) {
  try {
    const adAccountId = await getParam(`/seo-mcp/integrations/${customerId}/meta-ad-account-id`);
    const accessToken = await getParam(`/seo-mcp/integrations/${customerId}/meta-access-token`);
    let pixelId = null;
    try {
      pixelId = await getParam(`/seo-mcp/integrations/${customerId}/meta-pixel-id`);
    } catch (e) {
      // Pixel ID ar valfritt
    }
    return { adAccountId, accessToken, pixelId };
  } catch (err) {
    return null;
  }
}

/**
 * Gor ett GET-anrop till Meta Marketing API med automatisk paginering.
 * @param {string} endpoint - API-endpoint (ex: /act_123/campaigns)
 * @param {string} accessToken - Access token
 * @param {Object} params - Query-parametrar
 * @returns {Promise<Array>} Alla resultat-rader
 */
async function metaApiGet(endpoint, accessToken, params = {}) {
  const allData = [];
  let url = `${META_BASE_URL}${endpoint}`;

  const queryParams = {
    access_token: accessToken,
    ...params,
  };

  let hasMore = true;
  while (hasMore) {
    const response = await axios.get(url, {
      params: queryParams,
      timeout: 30000,
    });

    const data = response.data;
    if (data.data) {
      allData.push(...data.data);
    }

    // Paginering via cursor
    if (data.paging && data.paging.next) {
      url = data.paging.next;
      // Nasta sida har alla params i URL:en
      Object.keys(queryParams).forEach(k => delete queryParams[k]);
    } else {
      hasMore = false;
    }
  }

  return allData;
}

/**
 * Beraknar datumintervall for senaste 30 dagarna i Meta-format.
 * @returns {{since: string, until: string}}
 */
function getLast30DaysRange() {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 30);
  return {
    since: start.toISOString().split('T')[0],
    until: end.toISOString().split('T')[0],
  };
}

/**
 * Hamtar komplett annonsdata fran Meta (kampanjer, ad sets, ads).
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<Object>} Komplett annonsdataobjekt
 */
async function getMetaAdsData(customerId, getParam) {
  const creds = await getCredentials(customerId, getParam);
  if (!creds) {
    return {
      available: false,
      error: 'Meta Ads-credentials saknas i SSM for denna kund',
      platform: 'meta_ads',
      customerId,
    };
  }

  const { since, until } = getLast30DaysRange();
  const timeRange = JSON.stringify({ since, until });

  try {
    // --- Kampanjdata med insights ---
    const campaignFields = 'name,status,objective,daily_budget,lifetime_budget,start_time,stop_time';
    const campaignInsightFields = 'campaign_name,impressions,reach,clicks,ctr,cpc,cpm,spend,actions,cost_per_action_type';

    const rawCampaigns = await metaApiGet(
      `/${creds.adAccountId}/campaigns`,
      creds.accessToken,
      {
        fields: campaignFields,
        effective_status: '["ACTIVE","PAUSED","COMPLETED"]',
        limit: 100,
      }
    );

    // Hamta insights for kampanjerna
    const campaignInsights = await metaApiGet(
      `/${creds.adAccountId}/insights`,
      creds.accessToken,
      {
        fields: campaignInsightFields,
        time_range: timeRange,
        level: 'campaign',
        limit: 100,
      }
    );

    // Skapa en lookup for insights per kampanjnamn
    const insightsByCampaign = {};
    for (const insight of campaignInsights) {
      insightsByCampaign[insight.campaign_name] = insight;
    }

    const campaigns = rawCampaigns.map(campaign => {
      const insight = insightsByCampaign[campaign.name] || {};
      const actions = insight.actions || [];
      const conversions = actions
        .filter(a => ['lead', 'contact', 'purchase', 'complete_registration'].includes(a.action_type))
        .reduce((sum, a) => sum + parseInt(a.value || 0), 0);

      return {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
        objective: campaign.objective,
        dailyBudget: campaign.daily_budget
          ? (parseInt(campaign.daily_budget) / 100).toFixed(2)
          : null,
        lifetimeBudget: campaign.lifetime_budget
          ? (parseInt(campaign.lifetime_budget) / 100).toFixed(2)
          : null,
        reach: parseInt(insight.reach || 0),
        impressions: parseInt(insight.impressions || 0),
        clicks: parseInt(insight.clicks || 0),
        ctr: parseFloat(insight.ctr || 0).toFixed(2),
        cpc: parseFloat(insight.cpc || 0).toFixed(2),
        cpm: parseFloat(insight.cpm || 0).toFixed(2),
        spend: parseFloat(insight.spend || 0).toFixed(2),
        conversions,
      };
    });

    // --- Ad Sets med malsgrupp och insights ---
    const adSetFields = 'name,status,targeting,daily_budget,lifetime_budget,optimization_goal';
    const adSetInsightFields = 'adset_name,impressions,reach,clicks,ctr,cpc,spend,actions';

    const rawAdSets = await metaApiGet(
      `/${creds.adAccountId}/adsets`,
      creds.accessToken,
      {
        fields: adSetFields,
        effective_status: '["ACTIVE","PAUSED"]',
        limit: 100,
      }
    );

    const adSetInsights = await metaApiGet(
      `/${creds.adAccountId}/insights`,
      creds.accessToken,
      {
        fields: adSetInsightFields,
        time_range: timeRange,
        level: 'adset',
        limit: 100,
      }
    );

    const insightsByAdSet = {};
    for (const insight of adSetInsights) {
      insightsByAdSet[insight.adset_name] = insight;
    }

    const adSets = rawAdSets.map(adSet => {
      const insight = insightsByAdSet[adSet.name] || {};
      const targeting = adSet.targeting || {};

      // Extrahera malsgruppsinformation
      const ageMin = targeting.age_min || null;
      const ageMax = targeting.age_max || null;
      const geoLocations = targeting.geo_locations?.countries || [];
      const interests = (targeting.flexible_spec || [])
        .flatMap(spec => (spec.interests || []).map(i => i.name))
        .slice(0, 10);

      return {
        id: adSet.id,
        name: adSet.name,
        status: adSet.status,
        optimizationGoal: adSet.optimization_goal,
        dailyBudget: adSet.daily_budget
          ? (parseInt(adSet.daily_budget) / 100).toFixed(2)
          : null,
        targeting: {
          ageRange: ageMin && ageMax ? `${ageMin}-${ageMax}` : null,
          countries: geoLocations,
          interests,
        },
        impressions: parseInt(insight.impressions || 0),
        reach: parseInt(insight.reach || 0),
        clicks: parseInt(insight.clicks || 0),
        spend: parseFloat(insight.spend || 0).toFixed(2),
      };
    });

    // --- Ads (kreativitet + engagement) ---
    const adInsightFields = 'ad_name,impressions,reach,clicks,ctr,spend,actions,engagement';

    const adInsights = await metaApiGet(
      `/${creds.adAccountId}/insights`,
      creds.accessToken,
      {
        fields: adInsightFields,
        time_range: timeRange,
        level: 'ad',
        limit: 50,
      }
    );

    const ads = adInsights.map(insight => {
      const actions = insight.actions || [];
      const engagement = actions
        .filter(a => ['post_engagement', 'page_engagement', 'like', 'comment', 'share'].includes(a.action_type))
        .reduce((sum, a) => sum + parseInt(a.value || 0), 0);

      return {
        name: insight.ad_name,
        impressions: parseInt(insight.impressions || 0),
        reach: parseInt(insight.reach || 0),
        clicks: parseInt(insight.clicks || 0),
        ctr: parseFloat(insight.ctr || 0).toFixed(2),
        spend: parseFloat(insight.spend || 0).toFixed(2),
        engagement,
      };
    });

    // --- Aggregerade siffror ---
    const totalSpend = campaigns.reduce((sum, c) => sum + parseFloat(c.spend), 0);
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0);
    const totalImpressions = campaigns.reduce((sum, c) => sum + c.impressions, 0);
    const totalReach = campaigns.reduce((sum, c) => sum + c.reach, 0);
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0);

    return {
      available: true,
      platform: 'meta_ads',
      customerId,
      period: { since, until },
      summary: {
        totalCampaigns: campaigns.length,
        totalAdSets: adSets.length,
        totalAds: ads.length,
        totalSpend: totalSpend.toFixed(2),
        totalClicks,
        totalImpressions,
        totalReach,
        totalCtr: totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0.00',
        totalConversions,
        costPerConversion: totalConversions > 0
          ? (totalSpend / totalConversions).toFixed(2)
          : null,
        currency: 'SEK',
      },
      campaigns,
      adSets,
      ads,
    };
  } catch (err) {
    const errorData = err.response?.data?.error;
    return {
      available: false,
      error: `Meta Ads API-fel: ${errorData?.message || err.message}`,
      errorCode: errorData?.code || null,
      errorSubcode: errorData?.error_subcode || null,
      platform: 'meta_ads',
      customerId,
    };
  }
}

/**
 * Hamtar Meta Pixel events for senaste 30 dagarna.
 * Returnerar aggregerade event-counts (PageView, Lead, Contact, Purchase, etc.).
 *
 * @param {string} customerId - Searchboost-internt kund-ID
 * @param {Function} getParam - SSM parameter-hamtare
 * @returns {Promise<Object>} Pixel-event-data
 */
async function getMetaPixelEvents(customerId, getParam) {
  const creds = await getCredentials(customerId, getParam);
  if (!creds) {
    return {
      available: false,
      error: 'Meta Ads-credentials saknas i SSM for denna kund',
      platform: 'meta_pixel',
      customerId,
    };
  }

  if (!creds.pixelId) {
    return {
      available: false,
      error: 'Meta Pixel ID saknas i SSM for denna kund',
      platform: 'meta_pixel',
      customerId,
    };
  }

  const { since, until } = getLast30DaysRange();

  try {
    // Hamta pixel-statistik per event
    const response = await axios.get(
      `${META_BASE_URL}/${creds.pixelId}/stats`,
      {
        params: {
          access_token: creds.accessToken,
          start_time: since,
          end_time: until,
          aggregation: 'event',
        },
        timeout: 30000,
      }
    );

    const rawStats = response.data.data || [];

    // Formatera event-data
    const events = rawStats.map(stat => ({
      eventName: stat.event,
      count: parseInt(stat.count || 0),
      value: parseFloat(stat.value || 0),
    }));

    // Populara events som vi specifikt tracker
    const trackedEvents = ['PageView', 'Lead', 'Contact', 'Purchase', 'ViewContent',
      'AddToCart', 'InitiateCheckout', 'CompleteRegistration', 'Search', 'SubmitApplication'];

    const eventSummary = {};
    for (const eventName of trackedEvents) {
      const found = events.find(e => e.eventName === eventName);
      eventSummary[eventName] = found ? found.count : 0;
    }

    return {
      available: true,
      platform: 'meta_pixel',
      customerId,
      pixelId: creds.pixelId,
      period: { since, until },
      eventSummary,
      allEvents: events,
    };
  } catch (err) {
    const errorData = err.response?.data?.error;
    return {
      available: false,
      error: `Meta Pixel API-fel: ${errorData?.message || err.message}`,
      errorCode: errorData?.code || null,
      platform: 'meta_pixel',
      customerId,
    };
  }
}

module.exports = {
  getMetaAdsData,
  getMetaPixelEvents,
};
