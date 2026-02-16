/**
 * Weekly Audit Lambda — Körs varje måndag 06:00 UTC
 * Analyserar alla kunders WordPress-sites, identifierar SEO-problem,
 * och lägger till prioriterade uppgifter i BigQuery work queue.
 */
const { SSMClient, GetParameterCommand, GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
const { BigQuery } = require('@google-cloud/bigquery');
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
    // /seo-mcp/integrations/{siteId}/wp-app-password → siteId, wp-app-password
    const match = p.Name.match(/\/seo-mcp\/integrations\/([^/]+)\/(wp-.+)/);
    if (!match) continue;
    const [, siteId, wpKey] = match;
    if (!sites[siteId]) sites[siteId] = { id: siteId };
    // Mappa wp-app-password → app-password, wp-username → username
    const key = wpKey.replace('wp-', '');
    // Bara överskrid om gammal sökväg har placeholder
    if (!sites[siteId][key] || sites[siteId][key] === 'placeholder') {
      sites[siteId][key] = p.Value;
    }
  }

  // Hämta URL från wordpress/ om den inte finns
  for (const siteId of Object.keys(sites)) {
    if (!sites[siteId].url) {
      // Försök hämta från /seo-mcp/wordpress/{siteId}/url
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

async function wpApi(site, endpoint) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res = await axios.get(`${site.url}/wp-json/wp/v2${endpoint}`, {
    headers: { 'Authorization': `Basic ${auth}` },
    timeout: 15000
  });
  return res.data;
}

async function getBigQuery() {
  const wifConfig = await getParam('/seo-mcp/bigquery/credentials');
  const projectId = await getParam('/seo-mcp/bigquery/project-id');
  const dataset = await getParam('/seo-mcp/bigquery/dataset');
  fs.writeFileSync('/tmp/wif-config.json', wifConfig);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = '/tmp/wif-config.json';
  return { bq: new BigQuery({ projectId }), dataset };
}

async function auditSite(site) {
  console.log(`Auditing: ${site.url}`);
  const issues = [];

  try {
    const posts = await wpApi(site, '/posts?per_page=100&status=publish');
    const pages = await wpApi(site, '/pages?per_page=100&status=publish');
    const allContent = [...posts, ...pages];

    for (const item of allContent) {
      const problems = [];
      const title = item.title.rendered;
      const content = item.content.rendered;
      const text = content.replace(/<[^>]+>/g, '');

      if (!title || title.length < 20) problems.push({ type: 'short_title', severity: 'high' });
      if (title && title.length > 60) problems.push({ type: 'long_title', severity: 'medium' });
      if (text.length < 300) problems.push({ type: 'thin_content', severity: 'high' });
      if (!content.match(/<h1/i)) problems.push({ type: 'missing_h1', severity: 'medium' });

      const internalLinks = (content.match(new RegExp(`<a[^>]*href=["']${site.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')) || []).length;
      if (internalLinks === 0) problems.push({ type: 'no_internal_links', severity: 'medium' });

      const imgsNoAlt = (content.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
      if (imgsNoAlt > 0) problems.push({ type: 'missing_alt_text', severity: 'low', count: imgsNoAlt });

      if (!content.includes('application/ld+json')) problems.push({ type: 'no_schema', severity: 'low' });

      if (problems.length > 0) {
        issues.push({
          id: item.id,
          title,
          url: item.link,
          problems,
          priority: problems.reduce((s, p) => s + (p.severity === 'high' ? 3 : p.severity === 'medium' ? 2 : 1), 0)
        });
      }
    }

    issues.sort((a, b) => b.priority - a.priority);
    console.log(`  Found ${issues.length} pages with issues (${allContent.length} total)`);
  } catch (err) {
    console.error(`  Error auditing ${site.url}: ${err.message}`);
  }

  return issues;
}

exports.handler = async (event) => {
  console.log('=== Weekly SEO Audit Started ===');
  const startTime = Date.now();

  try {
    const sites = await getWordPressSites();
    console.log(`Found ${sites.length} sites to audit`);

    if (sites.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: 'No WordPress sites configured' }) };
    }

    const { bq, dataset } = await getBigQuery();
    const allResults = [];

    for (const site of sites) {
      const issues = await auditSite(site);

      // Add top 10 issues per site to work queue
      const queueItems = issues.slice(0, 10).map(issue => ({
        queue_id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        customer_id: site.id,
        priority: issue.priority,
        task_type: issue.problems[0].type,
        page_url: issue.url,
        context_data: JSON.stringify(issue),
        status: 'pending',
        created_at: new Date().toISOString(),
        processed_at: null
      }));

      // Batch INSERT — alla items i en enda query för snabbhet
      if (queueItems.length > 0) {
        const valueRows = queueItems.map(item => {
          const esc = (s) => (s || '').replace(/'/g, "\\'").replace(/\\/g, '\\\\');
          return `('${esc(item.queue_id)}', '${esc(item.customer_id)}', '${esc(site.url)}', '${esc(item.task_type)}', '${esc(item.page_url)}', '${esc(item.context_data)}', ${item.priority || 5}, 'pending', CURRENT_TIMESTAMP())`;
        });
        await bq.query({
          query: `INSERT INTO \`${dataset}.seo_work_queue\` (queue_id, customer_id, site_url, task_type, page_url, context_data, priority, status, created_at)
                  VALUES ${valueRows.join(',\n')}`
        });
        console.log(`  Inserted ${queueItems.length} items to work queue`);
      }

      allResults.push({
        site: site.url,
        totalIssues: issues.length,
        addedToQueue: queueItems.length
      });
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`=== Audit Complete in ${duration}s ===`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Weekly audit complete',
        duration: `${duration}s`,
        results: allResults
      })
    };
  } catch (err) {
    console.error('Audit failed:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
