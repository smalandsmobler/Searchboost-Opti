/**
 * social-scheduler.js — Lambda körs var 15:e minut via EventBridge
 * EventBridge: cron(0/15 * * * ? *)
 *
 * Gör:
 * 1. Hämtar approved-inlägg med scheduled_at <= nu från BQ
 * 2. Postar till rätt plattform (Facebook / Instagram / LinkedIn)
 * 3. Uppdaterar status → posted + sparar platform_post_id
 * 4. Loggar fel → status = failed
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
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

// ── Hämta inlägg att posta nu ──

async function getPendingPosts(bq, datasetId) {
  const [rows] = await bq.query({
    query: `
      SELECT *
      FROM \`${datasetId}.social_content_queue\`
      WHERE status = 'approved'
        AND scheduled_at <= CURRENT_TIMESTAMP()
        AND posted_at IS NULL
      ORDER BY scheduled_at ASC
      LIMIT 20
    `,
  });
  return rows || [];
}

// ── Uppdatera status i BQ ──

async function markPosted(bq, projectId, datasetId, postId, platformPostId) {
  await bq.query({
    query: `
      UPDATE \`${projectId}.${datasetId}.social_content_queue\`
      SET status = 'posted',
          posted_at = CURRENT_TIMESTAMP(),
          linkedin_post_id = @pid
      WHERE post_id = @id
    `,
    params: { id: postId, pid: platformPostId || '' },
  });
}

async function markFailed(bq, projectId, datasetId, postId, errorMessage) {
  await bq.query({
    query: `
      UPDATE \`${projectId}.${datasetId}.social_content_queue\`
      SET status = 'failed',
          error_message = @err
      WHERE post_id = @id
    `,
    params: { id: postId, err: (errorMessage || '').substring(0, 500) },
  });
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

  let authorUrn;
  if (organizationId) {
    authorUrn = organizationId.startsWith('urn:') ? organizationId : `urn:li:organization:${organizationId}`;
  } else if (personUrn) {
    authorUrn = personUrn;
  } else {
    const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${accessToken}` }, timeout: 10000,
    });
    const sub = profileRes.data?.sub;
    if (!sub) throw new Error('LinkedIn: Ingen sub i userinfo-svar');
    authorUrn = `urn:li:person:${sub}`;
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

  const res = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    timeout: 15000,
  });

  return { post_id: res.headers['x-restli-id'] || res.data?.id || 'unknown' };
}

async function postToInstagram(post, creds) {
  const { accessToken, instagramBusinessId } = creds;
  if (!accessToken || !instagramBusinessId) throw new Error('Instagram: accessToken och instagramBusinessId krävs');

  const containerRes = await axios.post(
    `https://graph.facebook.com/v21.0/${instagramBusinessId}/media`,
    null,
    { params: { caption: post.full_text, media_type: 'TEXT', access_token: accessToken }, timeout: 15000 }
  );
  const creationId = containerRes.data?.id;
  if (!creationId) throw new Error('Instagram: kunde inte skapa media-container');

  const publishRes = await axios.post(
    `https://graph.facebook.com/v21.0/${instagramBusinessId}/media_publish`,
    null,
    { params: { creation_id: creationId, access_token: accessToken }, timeout: 15000 }
  );
  return { post_id: publishRes.data?.id || 'unknown' };
}

async function postToFacebook(post, creds) {
  const { accessToken, facebookPageId } = creds;
  if (!accessToken || !facebookPageId) throw new Error('Facebook: accessToken och facebookPageId krävs');

  const res = await axios.post(
    `https://graph.facebook.com/v21.0/${facebookPageId}/feed`,
    null,
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

// ── Main handler ──

exports.handler = async (event) => {
  console.log('=== SOCIAL SCHEDULER START ===');
  const { bq, projectId, datasetId } = await getBQ();

  const pending = await getPendingPosts(bq, datasetId);
  console.log(`${pending.length} inlägg att posta`);

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
