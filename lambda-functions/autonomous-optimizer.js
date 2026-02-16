/**
 * Autonomous Optimizer Lambda — Körs var 6:e timme
 * Plockar uppgifter från BigQuery work queue och utför
 * autonoma SEO-optimeringar (metadata, internlänkar, schema).
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
const Anthropic = require('@anthropic-ai/sdk');
const axios = require('axios');
const fs = require('fs');

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getWordPressSites() {
  // Hämta från gamla sökvägen /seo-mcp/wordpress/
  const wpRes = await ssm.send(new GetParametersByPathCommand({
    Path: '/seo-mcp/wordpress/', Recursive: true, WithDecryption: true
  }));
  const sites = {};
  for (const p of (wpRes.Parameters || [])) {
    const parts = p.Name.split('/');
    const siteId = parts[3];
    const key = parts[4];
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    sites[siteId][key] = p.Value;
  }

  // Hämta från nya sökvägen /seo-mcp/integrations/ (wp-url, wp-username, wp-app-password)
  let intToken;
  const intParams = [];
  do {
    const intRes = await ssm.send(new GetParametersByPathCommand({
      Path: '/seo-mcp/integrations/', Recursive: true, WithDecryption: true,
      ...(intToken ? { NextToken: intToken } : {})
    }));
    intParams.push(...(intRes.Parameters || []));
    intToken = intRes.NextToken;
  } while (intToken);

  for (const p of intParams) {
    const match = p.Name.match(/\/seo-mcp\/integrations\/([^/]+)\/(wp-.+)/);
    if (!match) continue;
    const [, siteId, wpKey] = match;
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    const key = wpKey.replace('wp-', '');
    if (!sites[siteId][key] || sites[siteId][key] === 'placeholder') {
      sites[siteId][key] = p.Value;
    }
  }

  for (const siteId of Object.keys(sites)) {
    if (!sites[siteId].url) {
      try {
        const urlParam = await ssm.send(new GetParameterCommand({ Name: `/seo-mcp/wordpress/${siteId}/url` }));
        sites[siteId].url = urlParam.Parameter.Value;
      } catch (e) { /* URL saknas */ }
    }
  }

  const all = Object.values(sites);
  const valid = all.filter(s => s.url && s.username && s.username !== 'placeholder' && s['app-password'] && s['app-password'] !== 'placeholder');
  const skipped = all.filter(s => s.url && (!s.username || s.username === 'placeholder' || !s['app-password'] || s['app-password'] === 'placeholder'));
  console.log(`Found ${valid.length} WordPress sites with valid credentials`);
  if (skipped.length > 0) console.log(`Skipped ${skipped.length} sites missing credentials: ${skipped.map(s => s.id).join(', ')}`);
  return valid;
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
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  return { bq: new BigQuery({ projectId }), dataset };
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

// ── Helper: parse JSON from Claude (strips markdown code blocks) ──
function parseClaudeJSON(text) {
  let clean = text.trim();
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?```\s*$/, '');
  }
  return JSON.parse(clean);
}

// ── Optimization handlers ──

async function fixMetadata(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const postId = context.id;
  let post, wpType = 'posts';
  try {
    post = await wpApi(site, 'GET', `/posts/${postId}`);
  } catch (e) {
    post = await wpApi(site, 'GET', `/pages/${postId}`);
    wpType = 'pages';
  }

  const suggestion = await claude.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Optimera SEO-title för denna WordPress-sida. Nuvarande: "${post.title.rendered}" (${post.title.rendered.length} tecken). URL: ${post.link}. Max 60 tecken, på svenska, inkludera relevanta keywords. Svara i JSON: {"title": "...", "description": "max 155 tecken", "reasoning": "..."}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  await wpApi(site, 'POST', `/${wpType}/${postId}`, {
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
  let post, wpType = 'posts';
  try {
    post = await wpApi(site, 'GET', `/posts/${postId}`);
  } catch (e) {
    post = await wpApi(site, 'GET', `/pages/${postId}`);
    wpType = 'pages';
  }
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

  const result = parseClaudeJSON(suggestion.content[0].text);
  let content = post.content.rendered;
  let added = 0;

  for (const link of result.links) {
    const re = new RegExp(`(${link.anchorText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(?![^<]*>)`, 'i');
    const newContent = content.replace(re, `<a href="${link.targetUrl}">$1</a>`);
    if (newContent !== content) { content = newContent; added++; }
  }

  if (added > 0) {
    await wpApi(site, 'POST', `/${wpType}/${postId}`, { content });
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

// ── Svenska namn för task-typer ──
function formatTaskType(type) {
  const names = {
    'short_title': 'Förlängde titel',
    'long_title': 'Kortade ner titel',
    'thin_content': 'Utökade innehåll',
    'missing_h1': 'La till H1-rubrik',
    'no_internal_links': 'La till interna länkar',
    'missing_alt_text': 'La till alt-text på bilder',
    'no_schema': 'La till schema markup',
    'metadata': 'Optimerade metadata',
    'title': 'Optimerade sidtitel',
    'description': 'Skrev meta-beskrivning',
    'faq_schema': 'La till FAQ-schema',
    'internal_links': 'Förbättrade intern länkning',
    'content': 'Innehållsoptimering',
    'schema': 'La till schema markup',
    'technical': 'Teknisk SEO-fix',
    'manual': 'Manuell åtgärd'
  };
  return names[type] || type || 'SEO-optimering';
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

    // Reset error tasks back to pending (retry)
    await bq.query({ query: `UPDATE \`${dataset}.seo_work_queue\` SET status = 'pending' WHERE status = 'error'` });
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
        await bq.query({
          query: `INSERT INTO \`${dataset}.seo_optimization_log\` (timestamp, customer_id, site_url, optimization_type, page_url, before_state, after_state, claude_reasoning, impact_estimate)
                  VALUES (CURRENT_TIMESTAMP(), @customer_id, @site_url, @optimization_type, @page_url, @before_state, @after_state, @claude_reasoning, @impact_estimate)`,
          params: {
            customer_id: task.customer_id,
            site_url: site.url,
            optimization_type: task.task_type,
            page_url: task.page_url,
            before_state: task.context_data,
            after_state: JSON.stringify(result),
            claude_reasoning: `[Auto] ${formatTaskType(task.task_type)}: ${result.reasoning || result.action || ''}`.substring(0, 500),
            impact_estimate: String(task.priority / 10)
          }
        });

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
