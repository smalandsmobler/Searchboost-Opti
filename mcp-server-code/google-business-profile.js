'use strict';

/**
 * Google Business Profile API-modul
 * Anvander axios direkt mot GBP REST API v4 / mybusinessaccountmanagement v1
 *
 * SSM-parametrar per kund:
 *   /seo-mcp/integrations/{customerId}/gbp-access-token
 *   /seo-mcp/integrations/{customerId}/gbp-refresh-token
 *   /seo-mcp/integrations/{customerId}/gbp-location-id   (format: locations/123456789)
 *   /seo-mcp/integrations/{customerId}/gbp-account-id    (format: accounts/123456789)
 *   /seo-mcp/integrations/gbp-client-id                  (delad OAuth-app)
 *   /seo-mcp/integrations/gbp-client-secret
 */

const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

const GBP_BASE       = 'https://mybusiness.googleapis.com/v4';
const REVIEWS_BASE   = 'https://mybusiness.googleapis.com/v4';
const ACCOUNTS_BASE  = 'https://mybusinessaccountmanagement.googleapis.com/v1';
const TOKEN_URL      = 'https://oauth2.googleapis.com/token';
const REQUEST_TIMEOUT = 15000; // 15 sekunder

// ─────────────────────────────────────────────────────────────────────────────
// getLocations
// Hämtar alla GBP-lokaler kopplade till ett konto.
// Returnerar [{locationId, name, address, locationName}]
// ─────────────────────────────────────────────────────────────────────────────
async function getLocations(accessToken, accountId) {
  if (!accountId) throw new Error('accountId krävs (format: accounts/123456789)');

  try {
    const response = await axios.get(
      `${ACCOUNTS_BASE}/${accountId}/locations`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          readMask: 'name,title,storefrontAddress,websiteUri,phoneNumbers',
          pageSize: 100
        },
        timeout: REQUEST_TIMEOUT
      }
    );

    const locations = response.data.locations || [];
    return locations.map(loc => {
      const parts = loc.name ? loc.name.split('/') : [];
      const locationId = parts.length >= 2 ? `locations/${parts[parts.length - 1]}` : loc.name;
      const addr = loc.storefrontAddress;
      const addressStr = addr
        ? [addr.addressLines?.[0], addr.locality, addr.administrativeArea, addr.regionCode]
            .filter(Boolean).join(', ')
        : '';
      return {
        locationId,
        locationName: loc.name,
        name: loc.title || loc.name,
        address: addressStr,
        phone: loc.phoneNumbers?.primaryPhone || '',
        website: loc.websiteUri || ''
      };
    });
  } catch (err) {
    console.error('[GBP] getLocations fel:', err.response?.status, err.response?.data || err.message);
    throw new Error(`GBP getLocations misslyckades: ${err.response?.data?.error?.message || err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getReviews
// Hämtar senaste recensioner for en lokal.
// Returnerar [{reviewId, author, rating, ratingValue, comment, createTime, replied, replyComment}]
// ─────────────────────────────────────────────────────────────────────────────
async function getReviews(accessToken, locationId, limit = 20) {
  if (!locationId) throw new Error('locationId krävs (format: locations/123456789)');

  const locationName = locationId.startsWith('locations/') ? locationId : `locations/${locationId}`;

  try {
    const response = await axios.get(
      `${REVIEWS_BASE}/${locationName}/reviews`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { pageSize: Math.min(limit, 50) },
        timeout: REQUEST_TIMEOUT
      }
    );

    const reviews = response.data.reviews || [];

    const STAR_MAP = {
      ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5
    };

    return reviews.map(r => ({
      reviewId: r.reviewId,
      reviewName: r.name,
      author: r.reviewer?.displayName || 'Anonym',
      authorProfilePhotoUrl: r.reviewer?.profilePhotoUrl || '',
      rating: r.starRating || 'UNKNOWN',
      ratingValue: STAR_MAP[r.starRating] || 0,
      comment: r.comment || '',
      createTime: r.createTime,
      updateTime: r.updateTime,
      replied: !!r.reviewReply,
      replyComment: r.reviewReply?.comment || '',
      replyUpdateTime: r.reviewReply?.updateTime || null
    }));
  } catch (err) {
    console.error('[GBP] getReviews fel:', err.response?.status, err.response?.data || err.message);
    throw new Error(`GBP getReviews misslyckades: ${err.response?.data?.error?.message || err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// replyToReview
// Svarar pa en recension (eller uppdaterar befintligt svar).
// ─────────────────────────────────────────────────────────────────────────────
async function replyToReview(accessToken, locationId, reviewId, replyText) {
  if (!locationId) throw new Error('locationId krävs');
  if (!reviewId) throw new Error('reviewId krävs');
  if (!replyText || !replyText.trim()) throw new Error('replyText krävs');

  const locationName = locationId.startsWith('locations/') ? locationId : `locations/${locationId}`;
  const reviewName = `${locationName}/reviews/${reviewId}`;

  try {
    const response = await axios.put(
      `${GBP_BASE}/${reviewName}/reply`,
      { comment: replyText.trim() },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: REQUEST_TIMEOUT
      }
    );
    return { success: true, reply: response.data };
  } catch (err) {
    console.error('[GBP] replyToReview fel:', err.response?.status, err.response?.data || err.message);
    throw new Error(`GBP replyToReview misslyckades: ${err.response?.data?.error?.message || err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// createPost
// Skapar ett GBP-inlägg (Local Post).
// post: { summary, callToAction: {actionType, url}, media: {url} }
// actionType: BOOK | ORDER | SHOP | LEARN_MORE | SIGN_UP | CALL
// ─────────────────────────────────────────────────────────────────────────────
async function createPost(accessToken, locationId, post) {
  if (!locationId) throw new Error('locationId krävs');
  if (!post || !post.summary) throw new Error('post.summary krävs');

  const locationName = locationId.startsWith('locations/') ? locationId : `locations/${locationId}`;

  const body = {
    languageCode: 'sv',
    summary: post.summary,
    topicType: 'STANDARD'
  };

  if (post.callToAction && post.callToAction.actionType && post.callToAction.url) {
    body.callToAction = {
      actionType: post.callToAction.actionType,
      url: post.callToAction.url
    };
  }

  if (post.media && post.media.url) {
    body.media = [{
      mediaFormat: 'PHOTO',
      sourceUrl: post.media.url
    }];
  }

  try {
    const response = await axios.post(
      `${GBP_BASE}/${locationName}/localPosts`,
      body,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: REQUEST_TIMEOUT
      }
    );
    return { success: true, post: response.data };
  } catch (err) {
    console.error('[GBP] createPost fel:', err.response?.status, err.response?.data || err.message);
    throw new Error(`GBP createPost misslyckades: ${err.response?.data?.error?.message || err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// getPostInsights
// Hämtar impressioner och klick per inlägg (sista 30 dagarna).
// Returnerar [{postName, summary, impressions, clicks, createTime}]
// ─────────────────────────────────────────────────────────────────────────────
async function getPostInsights(accessToken, locationId) {
  if (!locationId) throw new Error('locationId krävs');

  const locationName = locationId.startsWith('locations/') ? locationId : `locations/${locationId}`;

  // Hämta inlägg
  let posts = [];
  try {
    const postsResp = await axios.get(
      `${GBP_BASE}/${locationName}/localPosts`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { pageSize: 20 },
        timeout: REQUEST_TIMEOUT
      }
    );
    posts = postsResp.data.localPosts || [];
  } catch (err) {
    console.error('[GBP] getPostInsights — hämta inlägg fel:', err.response?.data || err.message);
    throw new Error(`GBP getPostInsights misslyckades: ${err.response?.data?.error?.message || err.message}`);
  }

  if (!posts.length) return [];

  // Hämta insights via reportLocalPostInsights
  try {
    const insightResp = await axios.post(
      `${GBP_BASE}/${locationName}/localPosts:reportInsights`,
      {
        localPostNames: posts.map(p => p.name),
        basicRequest: {
          metricRequests: [
            { metric: 'LOCAL_POST_VIEWS_SEARCH' },
            { metric: 'LOCAL_POST_ACTIONS_CALL_TO_ACTION' }
          ],
          timeRange: {
            startTime: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            endTime: new Date().toISOString()
          }
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: REQUEST_TIMEOUT
      }
    );

    const insightMap = {};
    const localPostMetrics = insightResp.data.localPostMetrics || [];
    for (const m of localPostMetrics) {
      insightMap[m.localPostName] = { impressions: 0, clicks: 0 };
      for (const metric of m.metricValues || []) {
        const val = metric.value ? parseInt(metric.value, 10) : 0;
        if (metric.metric === 'LOCAL_POST_VIEWS_SEARCH') insightMap[m.localPostName].impressions = val;
        if (metric.metric === 'LOCAL_POST_ACTIONS_CALL_TO_ACTION') insightMap[m.localPostName].clicks = val;
      }
    }

    return posts.map(p => ({
      postName: p.name,
      summary: (p.summary || '').substring(0, 100),
      createTime: p.createTime,
      impressions: insightMap[p.name]?.impressions || 0,
      clicks: insightMap[p.name]?.clicks || 0
    }));
  } catch (err) {
    // Insights API kan returnera 403 om location inte är verifierad — returnera posts utan metrics
    console.error('[GBP] getPostInsights — insights fel:', err.response?.data || err.message);
    return posts.map(p => ({
      postName: p.name,
      summary: (p.summary || '').substring(0, 100),
      createTime: p.createTime,
      impressions: null,
      clicks: null
    }));
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// refreshAccessToken
// Förnyar OAuth2 access token med refresh token.
// Returnerar { accessToken, expiresIn }
// ─────────────────────────────────────────────────────────────────────────────
async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  if (!refreshToken) throw new Error('refreshToken krävs');
  if (!clientId) throw new Error('clientId krävs');
  if (!clientSecret) throw new Error('clientSecret krävs');

  try {
    const response = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: REQUEST_TIMEOUT
      }
    );

    return {
      accessToken: response.data.access_token,
      expiresIn: response.data.expires_in || 3600,
      tokenType: response.data.token_type || 'Bearer'
    };
  } catch (err) {
    console.error('[GBP] refreshAccessToken fel:', err.response?.data || err.message);
    throw new Error(`GBP tokenförnyelse misslyckades: ${err.response?.data?.error_description || err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// generateReviewReply
// Genererar ett svar på en recension med Claude Haiku.
// Regler:
//   4-5 stjärnor: Positiv, tacksam, nämn ett specifikt ord från recensionen, 2-3 meningar
//   1-3 stjärnor: Empatisk, lösningsorienterad, be dem kontakta direkt, 3-4 meningar
//   Språk: svenska om recensionen är på svenska, annars engelska
//   Avsluta alltid med: // Teamet på [Företagsnamn]
//   Signera aldrig med namn
// ─────────────────────────────────────────────────────────────────────────────
async function generateReviewReply(review, businessContext, anthropicKey) {
  if (!anthropicKey) throw new Error('Anthropic API-nyckel krävs');
  if (!review) throw new Error('review krävs');

  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const businessName = businessContext?.companyName || businessContext?.name || 'Företaget';
  const ratingValue = review.ratingValue || 0;
  const isMostlySwedish = isSwedishText(review.comment || '');

  const toneGuide = ratingValue >= 4
    ? `Positiv och tacksam. Nämn ett specifikt ord eller detalj från recensionen. Håll svaret kort, 2-3 meningar.`
    : `Empatisk och lösningsorienterad. Beklaga upplevelsen. Be dem kontakta er direkt för att lösa problemet. 3-4 meningar.`;

  const language = isMostlySwedish ? 'svenska' : 'english';
  const signoff = isMostlySwedish
    ? `// Teamet på ${businessName}`
    : `// The Team at ${businessName}`;

  const systemPrompt = `Du är en professionell kundtjänstrepresentant som skriver svar på Google-recensioner åt ${businessName}.
Skriv alltid på ${language}.
Regler:
- Signera ALDRIG med ett personnamn
- Avsluta ALLTID med exakt: ${signoff}
- ${toneGuide}
- Använd inga emojis
- Var personlig och specifik, inte generisk`;

  const userPrompt = `Skriv ett svar på denna ${ratingValue}-stjärniga Google-recension:

"${review.comment || '(Ingen text, bara betyg)'}"

Recensent: ${review.author || 'Anonym'}`;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const replyText = message.content[0]?.text?.trim() || '';
    return { replyText, language, ratingValue };
  } catch (err) {
    console.error('[GBP] generateReviewReply fel:', err.message);
    throw new Error(`Kunde inte generera recensionssvar: ${err.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Intern hjälpfunktion: enkel heuristik for att avgöra om text är på svenska
// ─────────────────────────────────────────────────────────────────────────────
function isSwedishText(text) {
  if (!text || text.length < 10) return true; // default: svenska
  const lower = text.toLowerCase();
  const swedishWords = ['och', 'är', 'det', 'att', 'en', 'ett', 'med', 'av', 'för', 'på', 'jag', 'här', 'var', 'bra', 'mycket', 'inte', 'men', 'som'];
  const englishWords = ['and', 'the', 'was', 'very', 'great', 'good', 'love', 'nice', 'highly', 'recommend', 'service'];
  let svScore = 0, enScore = 0;
  for (const w of swedishWords) { if (lower.includes(` ${w} `) || lower.startsWith(`${w} `)) svScore++; }
  for (const w of englishWords) { if (lower.includes(` ${w} `) || lower.startsWith(`${w} `)) enScore++; }
  return svScore >= enScore;
}

module.exports = {
  getLocations,
  getReviews,
  replyToReview,
  createPost,
  getPostInsights,
  refreshAccessToken,
  generateReviewReply
};
