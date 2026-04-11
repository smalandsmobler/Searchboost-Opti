/**
 * social-poster.js — Per-kund wrapper för Social Media Posting
 *
 * Wrapprar runt social-planner.js med SSM-credential-hantning per kund.
 * Används direkt från index.js via /api/customers/:id/social/* endpoints.
 *
 * Funktioner:
 *   postToFacebook(customerId, message, imageUrl, scheduleTime)
 *   postToInstagram(customerId, message, imageUrl, scheduleTime)
 *   postToLinkedIn(customerId, message, imageUrl, scheduleTime)
 *   getScheduledPosts(customerId, options)
 *   cancelPost(customerId, postId)
 */

const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const socialPlanner = require('./social-planner');
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
  const credsPath = '/tmp/bq-social-poster.json';
  fs.writeFileSync(credsPath, creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  _bq = new BigQuery({ projectId: _projectId, keyFilename: credsPath });
  return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
}

// ── Hämta credentials per kund + plattform ──

async function getCredentials(customerId, platform) {
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

// ── Logga post i BQ ──

async function logPost(customerId, platform, fullText, imageUrl, postId, scheduleTime) {
  const { bq, datasetId } = await getBQ();
  const table = bq.dataset(datasetId).table('social_content_queue');
  const isScheduled = scheduleTime && new Date(scheduleTime) > new Date();
  await table.insert([{
    post_id:                `${customerId}_${platform}_${Date.now()}`,
    customer_id:            customerId,
    platform,
    status:                 isScheduled ? 'approved' : 'posted',
    hook:                   (fullText || '').split('\n')[0] || '',
    body:                   (fullText || '').split('\n').slice(1).join('\n').trim(),
    full_text:              fullText || '',
    hashtags:               '',
    char_count:             (fullText || '').length,
    suggested_image_prompt: imageUrl || '',
    topic:                  '',
    post_type:              'manual',
    scheduled_at:           scheduleTime ? new Date(scheduleTime).toISOString() : new Date().toISOString(),
    created_at:             new Date().toISOString(),
    posted_at:              isScheduled ? null : new Date().toISOString(),
    linkedin_post_id:       postId || null,
    error_message:          null,
  }]);
}

// ── Posta till Facebook (direkt) ──

async function postToFacebook(customerId, message, imageUrl = null, scheduleTime = null) {
  const creds = await getCredentials(customerId, 'facebook');
  if (!creds.accessToken || !creds.facebookPageId) {
    throw new Error('Facebook-credentials saknas. Kontrollera meta-access-token och facebook-page-id i SSM.');
  }

  const content = { full_text: message, image_url: imageUrl };
  const result = await socialPlanner.postToFacebook(content, creds);

  await logPost(customerId, 'facebook', message, imageUrl, result.post_id, scheduleTime);
  return result;
}

// ── Posta till Instagram (direkt) ──

async function postToInstagram(customerId, message, imageUrl = null, scheduleTime = null) {
  const creds = await getCredentials(customerId, 'instagram');
  if (!creds.accessToken || !creds.instagramBusinessId) {
    throw new Error('Instagram-credentials saknas. Kontrollera meta-access-token och instagram-business-id i SSM.');
  }

  const content = { full_text: message, image_url: imageUrl };
  const result = await socialPlanner.postToInstagram(content, creds);

  await logPost(customerId, 'instagram', message, imageUrl, result.post_id, scheduleTime);
  return result;
}

// ── Posta till LinkedIn (direkt) ──

async function postToLinkedIn(customerId, message, imageUrl = null, scheduleTime = null) {
  const creds = await getCredentials(customerId, 'linkedin');
  if (!creds.accessToken) {
    throw new Error('LinkedIn-credentials saknas. Kontrollera linkedin-access-token i SSM.');
  }

  const content = { full_text: message, image_url: imageUrl };
  const result = await socialPlanner.postToLinkedIn(content, creds);

  await logPost(customerId, 'linkedin', message, imageUrl, result.post_id, scheduleTime);
  return result;
}

// ── Hämta schemalagda/postade inlägg för en kund ──

async function getScheduledPosts(customerId, options = {}) {
  const { platform, status, days = 30 } = options;
  const { bq, datasetId } = await getBQ();

  let where = `customer_id = @cid AND (
    scheduled_at >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL ${parseInt(days)} DAY)
    OR status IN ('draft', 'approved', 'scheduled')
  )`;
  const params = { cid: customerId };
  if (platform) { where += ' AND platform = @plat'; params.plat = platform; }
  if (status)   { where += ' AND status = @st';     params.st = status; }

  const [rows] = await bq.query({
    query: `SELECT * FROM \`${datasetId}.social_content_queue\`
            WHERE ${where}
            ORDER BY scheduled_at DESC
            LIMIT 50`,
    params,
  });
  return rows || [];
}

// ── Avbryt/radera schemalagd post ──

async function cancelPost(customerId, postId) {
  const { bq, projectId, datasetId } = await getBQ();
  await bq.query({
    query: `DELETE FROM \`${projectId}.${datasetId}.social_content_queue\`
            WHERE post_id = @pid AND customer_id = @cid AND status != 'posted'`,
    params: { pid: postId, cid: customerId },
  });
  return { success: true };
}

module.exports = {
  postToFacebook,
  postToInstagram,
  postToLinkedIn,
  getScheduledPosts,
  cancelPost,
  getCredentials,
};
