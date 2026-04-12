/**
 * Social Planner — Searchboost Opti
 *
 * Hanterar:
 * - AI-generering av LinkedIn + Instagram-inlägg (Claude)
 * - Schemaläggning: inlägg sparas i BQ social_content_queue
 * - Posting: LinkedIn Company Pages API + Meta Graph API
 * - Auto-schema: Tisdag + torsdag 08:00 för Searchboost AB
 * - Per-kund: generera inlägg baserat på GSC-trender + nyckelord
 *
 * Flöde:
 * 1. generatePost(customerId, platform, topic?) → spara utkast i BQ
 * 2. social-poster Lambda hämtar approved/scheduled → postar
 * 3. Log post_id + posted_at tillbaka till BQ
 */

const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');

// ── Plattformskonfiguration ──

const PLATFORMS = {
  linkedin: {
    label: 'LinkedIn',
    maxChars: 3000,
    recommendedChars: 1200,
    hashtagCount: 5,
    postFn: postToLinkedIn,
  },
  instagram: {
    label: 'Instagram',
    maxChars: 2200,
    recommendedChars: 800,
    hashtagCount: 15,
    postFn: postToInstagram,
  },
  facebook: {
    label: 'Facebook',
    maxChars: 63206,
    recommendedChars: 400,
    hashtagCount: 3,
    postFn: postToFacebook,
  },
};

// ── Auto-schema: Searchboost AB ──
// Tisdag (2) + torsdag (4), 08:00 CET
const SEARCHBOOST_SCHEDULE = {
  days: [2, 4],    // 0=sön, 1=mån, 2=tis, 3=ons, 4=tor
  hour: 8,
  minute: 0,
};

// ── Beräkna nästa postdatum ──

function getNextPostDates(count = 2) {
  const now = new Date();
  const dates = [];
  const d = new Date(now);

  while (dates.length < count) {
    d.setDate(d.getDate() + 1);
    if (SEARCHBOOST_SCHEDULE.days.includes(d.getDay())) {
      const postDate = new Date(d);
      postDate.setHours(SEARCHBOOST_SCHEDULE.hour, SEARCHBOOST_SCHEDULE.minute, 0, 0);
      dates.push(postDate.toISOString());
    }
  }
  return dates;
}

// ── AI-generering via Claude ──

async function generatePost(options) {
  const {
    platform = 'linkedin',
    topic,
    customerId,
    customerName,
    keywords = [],
    gscTopQueries = [],
    tone = 'professionell och engagerande',
    language = 'sv',
    postType = 'tip',   // tip | case | question | trend | story
    anthropicKey,
  } = options;

  const platformConfig = PLATFORMS[platform];
  if (!platformConfig) throw new Error(`Okänd plattform: ${platform}`);

  const client = new Anthropic({ apiKey: anthropicKey });

  // Bygg kontextrik prompt
  const topKeywordsStr = [...new Set([...keywords, ...gscTopQueries])].slice(0, 8).join(', ');
  const isSearchboost = customerId === 'searchboost' || !customerId;

  const systemPrompt = isSearchboost
    ? `Du är social media-skribent för Searchboost, en svensk SEO- och digitalmarknadsföringsbyrå i Stockholm.
Searchboost hjälper svenska SME-företag med SEO, Google Ads och social media.
Tone of voice: ${tone}. Språk: svenska.
Skriv aldrig om dig själv i tredje person. Inga emojis i titeln. Max 3 emojis totalt.
Avsluta alltid med en fråga till läsaren eller en call-to-action.`
    : `Du är social media-skribent för ${customerName || customerId}.
Tone of voice: ${tone}. Språk: svenska.
Relevanta nyckelord: ${topKeywordsStr}.
Max 3 emojis. Avsluta med fråga eller CTA.`;

  const postTypeInstructions = {
    tip:      `Skriv ett praktiskt tips om ${topic || 'SEO eller digital marknadsföring'}.`,
    case:     `Skriv ett kort case study om ett resultat inom ${topic || 'SEO'} utan att nämna klientens namn.`,
    question: `Skriv ett engagerande inlägg som ställer en tankeväckande fråga om ${topic || 'digital närvaro'}.`,
    trend:    `Skriv om en aktuell trend inom ${topic || 'SEO och AI'} och vad den innebär.`,
    story:    `Skriv ett kort storytelling-inlägg relaterat till ${topic || 'att synas på Google'}.`,
  };

  const userPrompt = `${postTypeInstructions[postType] || postTypeInstructions.tip}

Plattform: ${platformConfig.label}
Rekommenderad längd: ${platformConfig.recommendedChars} tecken
Hashtags: inkludera ${platformConfig.hashtagCount} relevanta hashtags i slutet

Returnera EXAKT detta JSON-format (inget annat):
{
  "hook": "första raden som stannar scrollet (max 140 tecken)",
  "body": "resten av inläggets text",
  "hashtags": ["hashtag1", "hashtag2"],
  "suggested_image_prompt": "beskriv en bild som skulle passa inlägget (på engelska, för image-generering)"
}`;

  const response = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const raw = response.content[0].text;

  // Extrahera JSON
  let parsed;
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    // Fallback: returnera råtext
    parsed = {
      hook: raw.split('\n')[0].substring(0, 140),
      body: raw,
      hashtags: ['#SEO', '#DigitalMarknadsföring', '#Searchboost'],
      suggested_image_prompt: 'Professional digital marketing office with charts',
    };
  }

  // Bygg fulltext
  const fullText = `${parsed.hook}\n\n${parsed.body}\n\n${(parsed.hashtags || []).map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}`;

  return {
    platform,
    hook: parsed.hook,
    body: parsed.body,
    hashtags: parsed.hashtags || [],
    full_text: fullText,
    char_count: fullText.length,
    suggested_image_prompt: parsed.suggested_image_prompt || '',
    generated_at: new Date().toISOString(),
    customer_id: customerId || 'searchboost',
    post_type: postType,
    topic: topic || null,
  };
}

// ── Skapa veckans inlägg för Searchboost ──

const SEARCHBOOST_TOPICS = [
  { topic: 'varför de flesta SEO-strategier misslyckas', postType: 'tip' },
  { topic: 'hur Google AI Overviews påverkar organisk trafik', postType: 'trend' },
  { topic: 'skillnaden mellan bra och dåliga bakåtlänkar', postType: 'tip' },
  { topic: 'hur snabb webbplats påverkar konverteringar', postType: 'case' },
  { topic: 'lokal SEO för svenska företag', postType: 'tip' },
  { topic: 'Google Ads vs SEO — när ska man välja vad?', postType: 'question' },
  { topic: 'vad händer med din ranking när du inte jobbar med SEO', postType: 'story' },
  { topic: 'Content som rankar vs content som bara existerar', postType: 'tip' },
  { topic: 'hur ofta Google uppdaterar algoritmen', postType: 'trend' },
  { topic: 'schema markup och varför det lönar sig', postType: 'tip' },
  { topic: 'core web vitals — vad Google faktiskt mäter', postType: 'tip' },
  { topic: 'AI-genererat innehåll och SEO 2025', postType: 'trend' },
];

let _topicIndex = 0;
function getNextTopic() {
  const t = SEARCHBOOST_TOPICS[_topicIndex % SEARCHBOOST_TOPICS.length];
  _topicIndex++;
  return t;
}

async function generateWeeklySearchboostPosts(anthropicKey, bq, datasetId) {
  // Kolla hur många inlägg vi redan har schemalagda
  const [existing] = await bq.query({
    query: `
      SELECT COUNT(*) as cnt
      FROM \`${datasetId}.social_content_queue\`
      WHERE customer_id = 'searchboost'
        AND platform = 'linkedin'
        AND status IN ('draft', 'scheduled', 'approved')
        AND scheduled_at >= CURRENT_TIMESTAMP()
    `,
  }).catch(() => [[{ cnt: 0 }]]);

  const existingCount = Number(existing[0]?.cnt || 0);
  const needed = Math.max(0, 2 - existingCount); // Håll alltid 2 framåt

  if (needed === 0) return { generated: 0, reason: 'Redan 2+ inlägg schemalagda' };

  const nextDates = getNextPostDates(needed);
  const generated = [];

  for (let i = 0; i < needed; i++) {
    const { topic, postType } = getNextTopic();
    const post = await generatePost({
      platform: 'linkedin',
      topic,
      postType,
      customerId: 'searchboost',
      customerName: 'Searchboost',
      anthropicKey,
    });

    const row = {
      post_id: `sb_li_${Date.now()}_${i}`,
      customer_id: 'searchboost',
      platform: 'linkedin',
      status: 'approved',  // Direkt godkänt — Mikael sade posta direkt
      hook: post.hook,
      body: post.body,
      full_text: post.full_text,
      hashtags: (post.hashtags || []).join(','),
      char_count: post.char_count,
      suggested_image_prompt: post.suggested_image_prompt || '',
      topic: post.topic || '',
      post_type: post.post_type,
      scheduled_at: nextDates[i] || getNextPostDates(i + 1)[i],
      created_at: new Date().toISOString(),
      posted_at: null,
      linkedin_post_id: null,
      error_message: null,
    };

    const table = bq.dataset(datasetId.split('.').pop()).table('social_content_queue');
    await table.insert([row]);
    generated.push(row);
  }

  return { generated: generated.length, posts: generated };
}

// ── LinkedIn Company Pages API ──

async function postToLinkedIn(content, credentials) {
  const { accessToken, organizationId, personUrn } = credentials;

  if (!accessToken) {
    throw new Error('LinkedIn: accessToken krävs');
  }

  // Hämta author URN — prioritetsordning: personUrn > organization
  // OBS: w_member_social scope = personlig profil ONLY
  //      w_organization_social scope krävs för company pages (LinkedIn partner-produkt)
  let authorUrn;
  if (personUrn) {
    // Personlig profil — fungerar alltid med w_member_social
    authorUrn = personUrn;
  } else if (organizationId) {
    // Kräver w_organization_social scope (LinkedIn Marketing Developer Platform)
    authorUrn = organizationId.startsWith('urn:') ? organizationId : `urn:li:organization:${organizationId}`;
  } else {
    // Fallback: hämta via /v2/me
    try {
      const meRes = await axios.get('https://api.linkedin.com/v2/me', {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        timeout: 10000,
      });
      const id = meRes.data?.id;
      if (!id) throw new Error('Inget id i /v2/me-svar');
      authorUrn = `urn:li:person:${id}`;
    } catch {
      throw new Error('LinkedIn: Kunde inte hämta person-ID. Kör OAuth-flödet igen.');
    }
  }

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: content.full_text || content.text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
    },
  };

  let res;
  try {
    res = await axios.post(
      'https://api.linkedin.com/v2/ugcPosts',
      body,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
        timeout: 15000,
      }
    );
  } catch (err) {
    const liErr = err.response?.data;
    throw new Error(`LinkedIn API ${err.response?.status}: ${JSON.stringify(liErr) || err.message}`);
  }

  return {
    post_id: res.headers['x-restli-id'] || res.data?.id || 'unknown',
    url: `https://www.linkedin.com/feed/update/${res.headers['x-restli-id'] || ''}`,
  };
}

// ── Meta Graph API — Instagram Business ──

async function postToInstagram(content, credentials) {
  const { accessToken, instagramBusinessId } = credentials;

  if (!accessToken || !instagramBusinessId) {
    throw new Error('Instagram: accessToken och instagramBusinessId krävs');
  }

  // Steg 1: Skapa media-container
  const containerRes = await axios.post(
    `https://graph.facebook.com/v21.0/${instagramBusinessId}/media`,
    null,
    {
      params: {
        caption: content.full_text || content.text,
        media_type: 'TEXT',
        access_token: accessToken,
      },
      timeout: 15000,
    }
  );

  const creationId = containerRes.data?.id;
  if (!creationId) throw new Error('Instagram: kunde inte skapa media-container');

  // Steg 2: Publicera
  const publishRes = await axios.post(
    `https://graph.facebook.com/v21.0/${instagramBusinessId}/media_publish`,
    null,
    {
      params: { creation_id: creationId, access_token: accessToken },
      timeout: 15000,
    }
  );

  return {
    post_id: publishRes.data?.id || 'unknown',
    url: null,
  };
}

// ── Facebook Page API ──

async function postToFacebook(content, credentials) {
  const { accessToken, facebookPageId } = credentials;

  if (!accessToken || !facebookPageId) {
    throw new Error('Facebook: accessToken och facebookPageId krävs');
  }

  const res = await axios.post(
    `https://graph.facebook.com/v21.0/${facebookPageId}/feed`,
    null,
    {
      params: {
        message: content.full_text || content.text,
        access_token: accessToken,
      },
      timeout: 15000,
    }
  );

  return {
    post_id: res.data?.id || 'unknown',
    url: `https://www.facebook.com/${facebookPageId}/posts/${(res.data?.id || '').split('_')[1] || ''}`,
  };
}

// ── Posta ett schemalagt inlägg ──

async function publishScheduledPost(post, credentials) {
  const platformConfig = PLATFORMS[post.platform];
  if (!platformConfig) throw new Error(`Okänd plattform: ${post.platform}`);

  const result = await platformConfig.postFn(
    { full_text: post.full_text, text: post.full_text },
    credentials
  );

  return result;
}

// ── BQ-tabellschema för social_content_queue ──

const SOCIAL_QUEUE_SCHEMA = [
  { name: 'post_id',                type: 'STRING', mode: 'REQUIRED' },
  { name: 'customer_id',            type: 'STRING', mode: 'REQUIRED' },
  { name: 'platform',               type: 'STRING', mode: 'REQUIRED' }, // linkedin | instagram | facebook
  { name: 'status',                 type: 'STRING' }, // draft | approved | scheduled | posted | failed
  { name: 'hook',                   type: 'STRING' }, // Första raden
  { name: 'body',                   type: 'STRING' }, // Resten av texten
  { name: 'full_text',              type: 'STRING' }, // Hook + body + hashtags
  { name: 'hashtags',               type: 'STRING' }, // Kommaseparerade
  { name: 'char_count',             type: 'INTEGER' },
  { name: 'suggested_image_prompt', type: 'STRING' },
  { name: 'topic',                  type: 'STRING' },
  { name: 'post_type',              type: 'STRING' }, // tip | case | question | trend | story
  { name: 'scheduled_at',           type: 'TIMESTAMP' },
  { name: 'created_at',             type: 'TIMESTAMP' },
  { name: 'posted_at',              type: 'TIMESTAMP' },
  { name: 'linkedin_post_id',       type: 'STRING' },
  { name: 'error_message',          type: 'STRING' },
];

module.exports = {
  generatePost,
  generateWeeklySearchboostPosts,
  publishScheduledPost,
  postToLinkedIn,
  postToInstagram,
  postToFacebook,
  getNextPostDates,
  SOCIAL_QUEUE_SCHEMA,
  PLATFORMS,
  SEARCHBOOST_SCHEDULE,
};
