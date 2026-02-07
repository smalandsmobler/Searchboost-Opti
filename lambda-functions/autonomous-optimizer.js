/**
 * Autonomous Optimizer Lambda — Körs var 6:e timme
 * Plockar uppgifter från BigQuery work queue och utför
 * autonoma SEO-optimeringar (metadata, internlänkar, schema).
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getWordPressSites() {
  const res = await ssm.send(new GetParametersByPathCommand({
    Path: '/seo-mcp/wordpress/', Recursive: true, WithDecryption: true
  }));
  const sites = {};
  for (const p of res.Parameters) {
    const parts = p.Name.split('/');
    const siteId = parts[3];
    const key = parts[4];
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    sites[siteId][key] = p.Value;
  }
  return Object.values(sites).filter(s => s.url);
}

async function wpApi(site, method, endpoint, data = null) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const config = {
    method,
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
    timeout: 15000
  };
  if (data) config.data = data;
  return (await axios(config)).data;
}

async function getBigQuery() {
  const creds = JSON.parse(await getParam('/seo-mcp/bigquery/credentials'));
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  return { bq: new BigQuery({ projectId, credentials: creds }), dataset };
}

async function trelloCard(name, desc) {
  const apiKey = await getParam('/seo-mcp/trello/api-key');
  const token = await getParam('/seo-mcp/trello/token');
  const boardId = await getParam('/seo-mcp/trello/board-id');
  const lists = (await axios.get(`https://api.trello.com/1/boards/${boardId}/lists`, {
    params: { key: apiKey, token }
  })).data;
  const list = lists[0];
  await axios.post('https://api.trello.com/1/cards', null, {
    params: { key: apiKey, token, idList: list.id, name, desc }
  });
}

// ── Optimization handlers ──

async function fixMetadata(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const postId = context.id;
  const post = await wpApi(site, 'GET', `/posts/${postId}`);

  const suggestion = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Optimera SEO-title för denna WordPress-sida. Nuvarande: "${post.title.rendered}" (${post.title.rendered.length} tecken). URL: ${post.link}. Max 60 tecken, på svenska, inkludera relevanta keywords. Svara i JSON: {"title": "...", "description": "max 155 tecken", "reasoning": "..."}`
    }]
  });

  const result = JSON.parse(suggestion.content[0].text);
  await wpApi(site, 'POST', `/posts/${postId}`, {
    meta: { rank_math_title: result.title, rank_math_description: result.description }
  });

  await trelloCard(
    `SEO: ${result.title.substring(0, 40)}...`,
    `**Metadata-optimering**\nSida: ${post.link}\nFrån: ${post.title.rendered}\nTill: ${result.title}\n${result.reasoning}`
  );

  return { type: 'metadata', result };
}

async function fixInternalLinks(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const postId = context.id;
  const post = await wpApi(site, 'GET', `/posts/${postId}`);
  const allPosts = await wpApi(site, 'GET', '/posts?per_page=30&status=publish');

  const suggestion = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Hitta 2-3 naturliga internlänkmöjligheter i denna text.
Sida: ${post.link}
Text: ${post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 1500)}
Tillgängliga sidor: ${allPosts.filter(p => p.id !== postId).slice(0, 15).map(p => `${p.title.rendered}: ${p.link}`).join('\n')}
Svara i JSON: {"links": [{"anchorText": "...", "targetUrl": "..."}]}`
    }]
  });

  const result = JSON.parse(suggestion.content[0].text);
  let content = post.content.rendered;
  let added = 0;

  for (const link of result.links) {
    const re = new RegExp(`(${link.anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)`, 'i');
    const newContent = content.replace(re, `<a href="${link.targetUrl}">$1</a>`);
    if (newContent !== content) { content = newContent; added++; }
  }

  if (added > 0) {
    await wpApi(site, 'POST', `/posts/${postId}`, { content });
    await trelloCard(
      `Internlänkar: +${added} på ${post.title.rendered.substring(0, 30)}`,
      `**Internlänkning**\nSida: ${post.link}\nLade till ${added} nya internlänkar`
    );
  }

  return { type: 'internal_links', added };
}

async function fixThinContent(site, task, claude) {
  const context = JSON.parse(task.context_data);
  // For thin content, we add to queue but don't auto-fix — needs human review
  await trelloCard(
    `Tunn sida: ${context.title.substring(0, 40)}`,
    `**Behöver manuell granskning**\nSida: ${context.url}\nInnehållet är för kort (under 300 ord). Behöver utökas manuellt.`
  );
  return { type: 'thin_content', action: 'flagged_for_review' };
}

// ── Main handler ──
const TASK_HANDLERS = {
  'short_title': fixMetadata,
  'long_title': fixMetadata,
  'no_internal_links': fixInternalLinks,
  'thin_content': fixThinContent,
  'missing_h1': fixMetadata,
  'missing_alt_text': fixThinContent, // Flag for review
  'no_schema': fixThinContent         // Flag for review
};

exports.handler = async (event) => {
  console.log('=== Autonomous Optimizer Started ===');
  const MAX_TASKS = 5; // Process max 5 tasks per run

  try {
    const { bq, dataset } = await getBigQuery();
    const sites = await getWordPressSites();
    const apiKey = await getParam('/seo-mcp/anthropic/api-key');
    const claude = new Anthropic({ apiKey });

    // Get pending tasks from queue
    const [tasks] = await bq.query({
      query: `SELECT * FROM \`${dataset}.seo_work_queue\` WHERE status = 'pending' ORDER BY priority DESC LIMIT ${MAX_TASKS}`
    });

    console.log(`Found ${tasks.length} pending tasks`);
    const results = [];

    for (const task of tasks) {
      const site = sites.find(s => s.id === task.customer_id);
      if (!site) {
        console.log(`  Skipping task ${task.queue_id}: site ${task.customer_id} not found`);
        continue;
      }

      const handler = TASK_HANDLERS[task.task_type];
      if (!handler) {
        console.log(`  No handler for task type: ${task.task_type}`);
        continue;
      }

      try {
        console.log(`  Processing: ${task.task_type} for ${site.url}`);
        const result = await handler(site, task, claude);
        results.push({ queue_id: task.queue_id, ...result });

        // Mark task as processed
        await bq.query({
          query: `UPDATE \`${dataset}.seo_work_queue\` SET status = 'completed', processed_at = CURRENT_TIMESTAMP() WHERE queue_id = @queueId`,
          params: { queueId: task.queue_id }
        });

        // Log optimization
        await bq.dataset(dataset).table('seo_optimization_log').insert([{
          timestamp: new Date().toISOString(),
          customer_id: task.customer_id,
          site_url: site.url,
          optimization_type: task.task_type,
          page_url: task.page_url,
          before_state: task.context_data,
          after_state: JSON.stringify(result),
          claude_reasoning: `Auto-optimized: ${task.task_type}`,
          impact_estimate: task.priority / 10
        }]);

      } catch (err) {
        console.error(`  Error processing ${task.queue_id}: ${err.message}`);
        await bq.query({
          query: `UPDATE \`${dataset}.seo_work_queue\` SET status = 'error' WHERE queue_id = @queueId`,
          params: { queueId: task.queue_id }
        });
      }
    }

    console.log(`=== Optimizer Complete: ${results.length}/${tasks.length} tasks processed ===`);
    return { statusCode: 200, body: JSON.stringify({ processed: results.length, results }) };
  } catch (err) {
    console.error('Optimizer failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
