/**
 * social-scheduler.js — Lambda körs var 15:e minut via EventBridge
 * EventBridge: cron(0/15 * * * ? *)
 *
 * Gör:
 * 1. Auto-genererar LinkedIn-inlägg om < 2 schemalagda framåt (mån-fre, 2x/vecka)
 * 2. Hämtar approved-inlägg med scheduled_at <= nu från BQ
 * 3. Postar till rätt plattform
 * 4. Uppdaterar status → posted + sparar platform_post_id
 *
 * Schema: Tisdag + torsdag 08:00 CET (Searchboost AB)
 * Author: Personlig profil (w_member_social). När LinkedIn godkänner
 *         Marketing Developer Platform byts personUrn mot organizationId.
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

// ── SSM helpers ──

const ssmCache = new Map();

async function getParam(name) {
  if (ssmCache.has(name)) return ssmCache.get(name);
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  ssmCache.set(name, res.Parameter.Value);
  return res.Parameter.Value;
}

async function getParamSafe(name) {
  try { return await getParam(name); } catch { return null; }
}

// ── BigQuery ──

let _bq = null;
let _projectId = null;
let _datasetId = null;

async function getBQ() {
  if (_bq) return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  _projectId = await getParam('/seo-mcp/bigquery/project-id');
  _datasetId = await getParam('/seo-mcp/bigquery/dataset');
  const credsPath = '/tmp/bq-social-scheduler.json';
  fs.writeFileSync(credsPath, creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  _bq = new BigQuery({ projectId: _projectId, keyFilename: credsPath });
  return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
}

// ── Credentials per kund + plattform ──

async function getPostingCredentials(customerId, platform) {
  const isSearchboost = customerId === 'searchboost';
  const prefix = isSearchboost ? '/seo-mcp/searchboost' : `/seo-mcp/integrations/${customerId}`;

  if (platform === 'linkedin') {
    return {
      accessToken:    await getParamSafe(`${prefix}/linkedin-access-token`),
      organizationId: await getParamSafe(`${prefix}/linkedin-company-id`),
      personUrn:      await getParamSafe(`${prefix}/linkedin-person-urn`),
    };
  }
  if (platform === 'instagram') {
    return {
      accessToken:         await getParamSafe(`${prefix}/meta-access-token`),
      instagramBusinessId: await getParamSafe(`/seo-mcp/integrations/${customerId}/instagram-business-id`),
    };
  }
  if (platform === 'facebook') {
    return {
      accessToken:    await getParamSafe(`${prefix}/meta-access-token`),
      facebookPageId: await getParamSafe(`/seo-mcp/integrations/${customerId}/facebook-page-id`),
    };
  }
  throw new Error(`Okänd plattform: ${platform}`);
}

// ── Posting-funktioner ──

async function postToLinkedIn(post, creds) {
  const { accessToken, organizationId, personUrn } = creds;
  if (!accessToken) throw new Error('LinkedIn: accessToken saknas');

  // Prioritetsordning: personUrn FÖRST (w_member_social), org när partner-godkänd
  let authorUrn;
  if (personUrn) {
    authorUrn = personUrn;
  } else if (organizationId) {
    authorUrn = organizationId.startsWith('urn:') ? organizationId : `urn:li:organization:${organizationId}`;
  } else {
    const meRes = await axios.get('https://api.linkedin.com/v2/me', {
      headers: { 'Authorization': `Bearer ${accessToken}` }, timeout: 10000,
    });
    const id = meRes.data?.id;
    if (!id) throw new Error('LinkedIn: Kunde inte hämta person-ID');
    authorUrn = `urn:li:person:${id}`;
  }

  const body = {
    author: authorUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: { text: post.full_text },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
  };

  let res;
  try {
    res = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      timeout: 15000,
    });
  } catch (err) {
    throw new Error(`LinkedIn API ${err.response?.status}: ${JSON.stringify(err.response?.data) || err.message}`);
  }

  return { post_id: res.headers['x-restli-id'] || res.data?.id || 'unknown' };
}

async function postToInstagram(post, creds) {
  const { accessToken, instagramBusinessId } = creds;
  if (!accessToken || !instagramBusinessId) throw new Error('Instagram: creds saknas');

  const containerRes = await axios.post(
    `https://graph.facebook.com/v21.0/${instagramBusinessId}/media`, null,
    { params: { caption: post.full_text, media_type: 'TEXT', access_token: accessToken }, timeout: 15000 }
  );
  const creationId = containerRes.data?.id;
  if (!creationId) throw new Error('Instagram: kunde inte skapa media-container');

  const publishRes = await axios.post(
    `https://graph.facebook.com/v21.0/${instagramBusinessId}/media_publish`, null,
    { params: { creation_id: creationId, access_token: accessToken }, timeout: 15000 }
  );
  return { post_id: publishRes.data?.id || 'unknown' };
}

async function postToFacebook(post, creds) {
  const { accessToken, facebookPageId } = creds;
  if (!accessToken || !facebookPageId) throw new Error('Facebook: creds saknas');

  const res = await axios.post(
    `https://graph.facebook.com/v21.0/${facebookPageId}/feed`, null,
    { params: { message: post.full_text, access_token: accessToken }, timeout: 15000 }
  );
  return { post_id: res.data?.id || 'unknown' };
}

async function publishPost(post, creds) {
  switch (post.platform) {
    case 'linkedin':  return postToLinkedIn(post, creds);
    case 'instagram': return postToInstagram(post, creds);
    case 'facebook':  return postToFacebook(post, creds);
    default: throw new Error(`Okänd plattform: ${post.platform}`);
  }
}

// ── BQ-uppdatering ──

async function markPosted(bq, projectId, datasetId, postId, platformPostId) {
  try {
    await bq.query({
      query: `UPDATE \`${projectId}.${datasetId}.social_content_queue\`
              SET status = 'posted', posted_at = CURRENT_TIMESTAMP(), linkedin_post_id = @pid
              WHERE post_id = @id`,
      params: { id: postId, pid: platformPostId || '' },
    });
  } catch (e) {
    console.warn('markPosted BQ-fel (streaming buffer ok):', e.message);
  }
}

async function markFailed(bq, projectId, datasetId, postId, errorMessage) {
  try {
    await bq.query({
      query: `UPDATE \`${projectId}.${datasetId}.social_content_queue\`
              SET status = 'failed', error_message = @err
              WHERE post_id = @id`,
      params: { id: postId, err: (errorMessage || '').substring(0, 500) },
    });
  } catch (e) {
    console.warn('markFailed BQ-fel:', e.message);
  }
}

// ── Auto-generering: fyll på köen med 2 inlägg/vecka ──

const TOPICS = [
  { topic: 'varför de flesta SEO-strategier misslyckas för svenska SME', postType: 'tip' },
  { topic: 'hur Google AI Overviews påverkar organisk trafik 2026', postType: 'trend' },
  { topic: 'lokal SEO för svenska B2B-företag — konkreta steg', postType: 'tip' },
  { topic: 'skillnaden mellan bra och dåliga bakåtlänkar', postType: 'tip' },
  { topic: 'hur snabb webbplats påverkar konverteringar direkt', postType: 'case' },
  { topic: 'Google Ads vs SEO — när ska man välja vad?', postType: 'question' },
  { topic: 'vad händer med din ranking när du slutar jobba med SEO', postType: 'story' },
  { topic: 'content som rankar vs content som bara existerar', postType: 'tip' },
  { topic: 'core web vitals — vad Google faktiskt mäter och varför det spelar roll', postType: 'tip' },
  { topic: 'AI-genererat innehåll och SEO — vad fungerar 2026', postType: 'trend' },
  { topic: 'schema markup och strukturerad data — varför det lönar sig', postType: 'tip' },
  { topic: 'hur vi hjälpte ett B2B-företag tredubbla sin organiska trafik', postType: 'case' },
  { topic: 'intern länkning — den underskattade SEO-taktiken', postType: 'tip' },
  { topic: 'meta-beskrivningar påverkar inte ranking men påverkar klick', postType: 'tip' },
  { topic: 'sökordsanalys — hur du hittar sökord som faktiskt konverterar', postType: 'tip' },
  { topic: 'varför din konkurrent rankar högre trots sämre innehåll', postType: 'question' },
  { topic: 'E-E-A-T och varför Google vill se din expertis', postType: 'trend' },
  { topic: 'hur lång tid tar SEO egentligen — ärlig genomgång', postType: 'tip' },
  { topic: 'teknisk SEO-audit på 30 minuter — var du ska börja', postType: 'tip' },
  { topic: 'vad ROI på SEO faktiskt betyder och hur du mäter det', postType: 'case' },
  { topic: 'hur mobiloptimering påverkar din ranking 2026', postType: 'tip' },
  { topic: 'Google Search Console — de 5 rapporterna du måste förstå', postType: 'tip' },
  { topic: 'varför SEO och content marketing måste jobba ihop', postType: 'tip' },
  { topic: 'hur du bygger auktoritet online som B2B-företag', postType: 'tip' },
  { topic: 'zero-click searches — hot eller möjlighet för ditt företag?', postType: 'question' },
  { topic: 'hur ofta du ska publicera nytt innehåll — sanningen', postType: 'tip' },
  { topic: 'sökordsintention — nyckeln till content som rankar och konverterar', postType: 'tip' },
];

let _topicIndex = Math.floor(Math.random() * TOPICS.length);

function getNextTopic() {
  const t = TOPICS[_topicIndex % TOPICS.length];
  _topicIndex++;
  return t;
}

// Nästa Tisdag (2) och Torsdag (4) 08:00 CET
function getNextPostDates(count) {
  const TARGET_DAYS = [2, 4];
  const dates = [];
  const now = new Date();
  // Konvertera till CET (UTC+1/+2)
  const cetOffset = 1; // Approximation, bra nog för scheduling
  let d = new Date(now);

  while (dates.length < count) {
    d = new Date(d.getTime() + 24 * 60 * 60 * 1000);
    if (TARGET_DAYS.includes(d.getDay())) {
      const postDate = new Date(d);
      postDate.setUTCHours(8 - cetOffset, 0, 0, 0);
      if (postDate > now) {
        dates.push(postDate.toISOString());
      }
    }
  }
  return dates;
}

async function ensureUpcomingPosts(bq, projectId, datasetId) {
  // Kolla hur många approved/scheduled inlägg vi har framåt
  const [rows] = await bq.query({
    query: `SELECT COUNT(*) as cnt FROM \`${datasetId}.social_content_queue\`
            WHERE customer_id = 'searchboost' AND platform = 'linkedin'
              AND status IN ('approved', 'scheduled')
              AND scheduled_at >= CURRENT_TIMESTAMP()`,
  }).catch(() => [[{ cnt: 0 }]]);

  const existing = Number(rows[0]?.cnt || 0);
  const needed = Math.max(0, 2 - existing);

  if (needed === 0) {
    console.log(`Auto-gen: ${existing} inlägg redan schemalagda, inget behövs`);
    return { generated: 0 };
  }

  console.log(`Auto-gen: ${existing} inlägg schemalagda, genererar ${needed} nya`);

  const anthropicKey = await getParam('/seo-mcp/anthropic/api-key');
  const client = new Anthropic({ apiKey: anthropicKey });
  const nextDates = getNextPostDates(needed);
  let generated = 0;

  for (let i = 0; i < needed; i++) {
    const { topic, postType } = getNextTopic();

    const systemPrompt = `Du är en expert på digital marknadsföring och SEO i Sverige. Du skriver LinkedIn-inlägg för Searchboost — en SEO-byrå som hjälper svenska företag att synas på Google. Skriv alltid på svenska. Inga emojis.`;

    const postTypeInstructions = {
      tip: `Skriv ett tips-inlägg med 3 konkreta, genomförbara råd. Avsluta med en fråga som uppmuntrar kommentarer.`,
      trend: `Skriv om en aktuell trend inom SEO/digital marknadsföring. Förklara implikationerna för svenska företag.`,
      case: `Skriv om ett case-study eller resultat. Konkreta siffror och lärdomar.`,
      question: `Skriv ett engagerande inlägg med en retorisk fråga som utgångspunkt. Ge din syn och bjud in till diskussion.`,
      story: `Berätta en kort story om en utmaning och lösning inom SEO.`,
    };

    const userPrompt = `${postTypeInstructions[postType] || postTypeInstructions.tip}

Ämne: ${topic}

Returnera JSON (bara JSON, inga backticks):
{
  "hook": "första meningen som stoppar scrollningen (max 15 ord)",
  "body": "resten av inlägget (800-1200 tecken)",
  "hashtags": ["hashtag1", "hashtag2", "hashtag3", "hashtag4", "hashtag5"]
}`;

    let parsed;
    try {
      const response = await client.messages.create({
        model: 'claude-haiku-4-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
      });

      const raw = response.content[0].text;
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (e) {
      console.error('Auto-gen: AI-generering misslyckades:', e.message);
      continue;
    }

    const hashtags = (parsed.hashtags || ['#SEO', '#DigitalMarknadsföring']).join(' ');
    const fullText = `${parsed.hook}\n\n${parsed.body}\n\n${hashtags}`;

    const row = {
      post_id:                `sb_li_auto_${Date.now()}_${i}`,
      customer_id:            'searchboost',
      platform:               'linkedin',
      status:                 'approved',
      hook:                   parsed.hook || '',
      body:                   parsed.body || '',
      full_text:              fullText,
      hashtags:               (parsed.hashtags || []).join(','),
      char_count:             fullText.length,
      suggested_image_prompt: '',
      topic,
      post_type:              postType,
      scheduled_at:           nextDates[i] || getNextPostDates(i + 1)[0],
      created_at:             new Date().toISOString(),
      posted_at:              null,
      linkedin_post_id:       null,
      error_message:          null,
    };

    try {
      const table = _bq.dataset(datasetId).table('social_content_queue');
      await table.insert([row]);
      console.log(`Auto-gen: Schemalagt "${row.hook.substring(0, 50)}..." till ${row.scheduled_at}`);
      generated++;
    } catch (e) {
      console.error('Auto-gen: BQ insert misslyckades:', e.message);
    }
  }

  return { generated };
}

// ── Hämta inlägg att posta nu ──

async function getPendingPosts(bq, datasetId) {
  const [rows] = await bq.query({
    query: `SELECT * FROM \`${datasetId}.social_content_queue\`
            WHERE status = 'approved'
              AND scheduled_at <= CURRENT_TIMESTAMP()
              AND posted_at IS NULL
            ORDER BY scheduled_at ASC
            LIMIT 10`,
  });
  return rows || [];
}

// ── Main handler ──

exports.handler = async (event) => {
  console.log('=== SOCIAL SCHEDULER START ===', new Date().toISOString());
  const { bq, projectId, datasetId } = await getBQ();

  // Steg 1: Auto-generera inlägg om köen är tom
  try {
    const genResult = await ensureUpcomingPosts(bq, projectId, datasetId);
    if (genResult.generated > 0) {
      console.log(`Auto-gen: ${genResult.generated} nya inlägg skapade`);
    }
  } catch (e) {
    console.error('Auto-gen fel (fortsätter ändå):', e.message);
  }

  // Steg 2: Posta inlägg vars tid har kommit
  const pending = await getPendingPosts(bq, datasetId);
  console.log(`${pending.length} inlägg att posta nu`);

  const results = { posted: 0, failed: 0 };

  for (const post of pending) {
    const logId = `${post.post_id} → ${post.platform} (${post.customer_id})`;
    console.log(`  Postar ${logId}`);
    try {
      const creds = await getPostingCredentials(post.customer_id, post.platform);
      const result = await publishPost(post, creds);
      await markPosted(bq, projectId, datasetId, post.post_id, result.post_id);
      console.log(`  OK: ${result.post_id}`);
      results.posted++;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error(`  FEL ${logId}: ${msg}`);
      await markFailed(bq, projectId, datasetId, post.post_id, msg);
      results.failed++;
    }
  }

  console.log(`=== SOCIAL SCHEDULER KLAR: ${JSON.stringify(results)} ===`);
  return { statusCode: 200, body: JSON.stringify({ success: true, ...results }) };
};
