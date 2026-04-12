/**
 * Social Poster Lambda — Körs varje timme via EventBridge
 * EventBridge: cron(0 * * * ? *)
 *
 * Gör:
 * 1. Hämtar alla approved-inlägg med scheduled_at <= nu från BQ
 * 2. Postar till rätt plattform (LinkedIn / Instagram / Facebook)
 * 3. Uppdaterar status → posted + sparar post_id
 * 4. Genererar nya veckoinlägg för Searchboost om kön är <2
 */

const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const fs = require('fs');
const path = require('path');

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

async function prefetchParams(path_) {
  let nextToken;
  do {
    const { SSMClient: _, GetParametersByPathCommand: __ } = require('@aws-sdk/client-ssm');
    const res = await ssm.send(new GetParametersByPathCommand({
      Path: path_,
      Recursive: true,
      WithDecryption: true,
      ...(nextToken ? { NextToken: nextToken } : {}),
    }));
    for (const p of (res.Parameters || [])) ssmCache.set(p.Name, p.Value);
    nextToken = res.NextToken;
  } while (nextToken);
}

// ── BigQuery setup ──

let _bq = null;
let _projectId = null;
let _datasetId = null;

async function getBQ() {
  if (_bq) return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
  const creds = await getParam('/seo-mcp/bigquery/credentials');
  _projectId = await getParam('/seo-mcp/bigquery/project-id');
  _datasetId = await getParam('/seo-mcp/bigquery/dataset');
  const credsPath = '/tmp/bq-creds.json';
  fs.writeFileSync(credsPath, creds);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
  _bq = new BigQuery({ projectId: _projectId, keyFilename: credsPath });
  return { bq: _bq, projectId: _projectId, datasetId: _datasetId };
}

// ── Hämta inlägg att posta ──

async function getPendingPosts(bq, datasetId) {
  const [rows] = await bq.query({
    query: `
      SELECT *
      FROM \`${datasetId}.social_content_queue\`
      WHERE status = 'approved'
        AND scheduled_at <= CURRENT_TIMESTAMP()
        AND posted_at IS NULL
      ORDER BY scheduled_at ASC
      LIMIT 10
    `,
  });
  return rows || [];
}

// ── Uppdatera post-status i BQ ──

async function markPosted(bq, projectId, datasetId, postId, linkedinPostId) {
  await bq.query({
    query: `
      UPDATE \`${projectId}.${datasetId}.social_content_queue\`
      SET status = 'posted',
          posted_at = CURRENT_TIMESTAMP(),
          linkedin_post_id = @postId
      WHERE post_id = @id
    `,
    params: { id: postId, postId: linkedinPostId || '' },
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

// ── Säkerställ BQ-tabell ──

async function ensureSocialQueueTable(bq, datasetId) {
  const { SOCIAL_QUEUE_SCHEMA } = require('./social-planner');
  const dataset = bq.dataset(datasetId);
  try {
    await dataset.createTable('social_content_queue', {
      schema: { fields: SOCIAL_QUEUE_SCHEMA },
      timePartitioning: { type: 'DAY', field: 'scheduled_at' },
      clustering: { fields: ['customer_id', 'platform', 'status'] },
    });
    console.log('Tabell social_content_queue skapad');
  } catch (e) {
    if (!e.message.includes('Already Exists')) throw e;
  }
}

// ── Hämta credentials per kund + plattform ──

async function getPostingCredentials(customerId, platform) {
  const base = `/seo-mcp/integrations/${customerId}`;

  if (platform === 'linkedin') {
    // Searchboost använder egna credentials
    const isSearchboost = customerId === 'searchboost';
    const prefix = isSearchboost ? '/seo-mcp/searchboost' : base;
    return {
      accessToken:    await getParamSafe(`${prefix}/linkedin-access-token`),
      organizationId: await getParamSafe(`${prefix}/linkedin-company-id`),
    };
  }

  if (platform === 'instagram') {
    return {
      accessToken:          await getParamSafe(`${base}/meta-access-token`),
      instagramBusinessId:  await getParamSafe(`${base}/instagram-business-id`),
    };
  }

  if (platform === 'facebook') {
    return {
      accessToken:    await getParamSafe(`${base}/meta-access-token`),
      facebookPageId: await getParamSafe(`${base}/facebook-page-id`),
    };
  }

  throw new Error(`Okänd plattform: ${platform}`);
}

// ── Main handler ──

exports.handler = async (event) => {
  console.log('=== SOCIAL POSTER START ===');
  const { bq, projectId, datasetId } = await getBQ();
  const anthropicKey = await getParamSafe('/seo-mcp/anthropic/api-key');

  // 1. Säkerställ tabell
  await ensureSocialQueueTable(bq, datasetId);

  // 2. Hämta inlägg att posta nu
  const pending = await getPendingPosts(bq, datasetId);
  console.log(`${pending.length} inlägg att posta`);

  const results = { posted: 0, failed: 0, skipped: 0 };

  // 3. Posta
  const { publishScheduledPost } = require('./social-planner');

  for (const post of pending) {
    console.log(`  Postar ${post.post_id} → ${post.platform} (${post.customer_id})`);

    try {
      const creds = await getPostingCredentials(post.customer_id, post.platform);
      const result = await publishScheduledPost(post, creds);

      await markPosted(bq, projectId, datasetId, post.post_id, result.post_id);
      console.log(`  OK: ${result.post_id}`);
      results.posted++;
    } catch (err) {
      const msg = err.response?.data?.message || err.message;
      console.error(`  FEL: ${msg}`);
      await markFailed(bq, projectId, datasetId, post.post_id, msg);
      results.failed++;
    }
  }

  // 4. Auto-generera veckoinlägg för Searchboost om kön är tom
  if (anthropicKey) {
    try {
      const { generateWeeklySearchboostPosts } = require('./social-planner');
      const gen = await generateWeeklySearchboostPosts(anthropicKey, bq, datasetId);
      if (gen.generated > 0) {
        console.log(`Auto-genererade ${gen.generated} nya Searchboost-inlägg`);
        results.generated = gen.generated;
      }
    } catch (e) {
      console.error(`Auto-generering misslyckades: ${e.message}`);
    }
  }

  console.log(`=== SOCIAL POSTER KLAR: ${JSON.stringify(results)} ===`);
  return { statusCode: 200, body: JSON.stringify({ success: true, ...results }) };
};
