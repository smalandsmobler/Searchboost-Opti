/**
 * Weekly Audit Lambda — Körs varje måndag 06:00 UTC
 * Analyserar alla kunders WordPress-sites, identifierar SEO-problem,
 * och lägger till prioriterade uppgifter i BigQuery work queue.
 *
 * SEO-signal-loop (2026-02):
 *   Innan kön fylls läser auditen gsc_daily_metrics för att:
 *   - Boosta prioritet på sidor med hög synlighet men låg CTR (pos 4-15, >50 impr/vecka)
 *   - Boosta sidor med positivt momentum (klättrar >2 platser senaste veckan)
 *   - Boosta sidor utan klick trots högt antal visningar (potential-sidor)
 *   - Identifiera task_type 'h2_optimization' och 'synonym_gap' för sidor med hög volym
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

/**
 * Hämtar GSC-signaler per URL för en kund.
 *
 * Returnerar Map<url, { gscBoost, extraTasks }>
 *   gscBoost  — multiplikator för prioritet (1.0–4.0)
 *   extraTasks — extra task_types att lägga till utöver de som WP-crawlen hittar
 *               t.ex. 'h2_optimization' eller 'synonym_gap'
 *
 * Signallogik:
 *   +2.0 om sidan har >200 visningar/vecka men CTR <2% (stor potential, låg klickfrekvens)
 *   +1.5 om sidan har position 4-10 (nära sida 1-toppen) och >50 visningar/vecka
 *   +1.0 om sidan klättrat >2 platser senaste veckan jämfört med veckan före
 *   +0.5 om sidan har 0 klick trots >100 visningar (missar title/meta helt)
 *   extra task 'h2_optimization' om sidan är i position 4-20 med >100 visningar
 *   extra task 'synonym_gap' om sidan rankar på >5 unika sökord (bred topik)
 */
async function getGscSignals(bq, dataset, customerId) {
  const signals = new Map(); // url → { gscBoost, extraTasks }

  try {
    // Aggregera per landningssida (page)
    const [pageRows] = await bq.query({
      query: `
        WITH current_week AS (
          SELECT
            page,
            SUM(clicks) AS clicks,
            SUM(impressions) AS impressions,
            AVG(position) AS avg_position,
            COUNT(DISTINCT query) AS unique_queries
          FROM \`${dataset}.gsc_daily_metrics\`
          WHERE customer_id = @cid
            AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            AND page IS NOT NULL
          GROUP BY page
          HAVING impressions >= 10
        ),
        prev_week AS (
          SELECT
            page,
            AVG(position) AS avg_position_prev
          FROM \`${dataset}.gsc_daily_metrics\`
          WHERE customer_id = @cid
            AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
            AND date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
            AND page IS NOT NULL
          GROUP BY page
        )
        SELECT
          c.page,
          c.clicks,
          c.impressions,
          ROUND(c.avg_position, 2) AS avg_position,
          c.unique_queries,
          ROUND(COALESCE(p.avg_position_prev, c.avg_position), 2) AS avg_position_prev,
          ROUND(COALESCE(p.avg_position_prev, c.avg_position) - c.avg_position, 2) AS position_gain
        FROM current_week c
        LEFT JOIN prev_week p ON c.page = p.page
        ORDER BY c.impressions DESC
        LIMIT 100
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    for (const row of (pageRows || [])) {
      const url = row.page;
      if (!url) continue;

      let boost = 1.0;
      const extraTasks = new Set();

      const impr = Number(row.impressions) || 0;
      const clicks = Number(row.clicks) || 0;
      const pos = Number(row.avg_position) || 50;
      const posGain = Number(row.position_gain) || 0;
      const ctr = impr > 0 ? clicks / impr : 0;
      const uniqueQueries = Number(row.unique_queries) || 0;

      // Sidan har stor synlighet men dålig CTR → title/meta behöver fixas mest
      if (impr > 200 && ctr < 0.02) {
        boost += 2.0;
      } else if (impr > 100 && ctr < 0.03) {
        boost += 1.0;
      }

      // Position 4-10 = strax utanför topp 3, kan klättra med lite optimering
      if (pos >= 4 && pos <= 10 && impr >= 50) {
        boost += 1.5;
        extraTasks.add('h2_optimization');
      }

      // Position 11-20 = sida 2, kan ta sig till sida 1
      if (pos > 10 && pos <= 20 && impr >= 100) {
        boost += 0.8;
        extraTasks.add('h2_optimization');
      }

      // Klättrar → momentum, passa på att optimera nu
      if (posGain >= 3) {
        boost += 1.0;
      } else if (posGain >= 1) {
        boost += 0.5;
      }

      // 0 klick trots många visningar → title/meta saknar helt attraktivitet
      if (clicks === 0 && impr > 100) {
        boost += 0.5;
      }

      // Bred topik (många sökord) → behöver bättre täckning av synonymer
      if (uniqueQueries >= 5 && pos <= 20) {
        extraTasks.add('synonym_gap');
      }

      if (boost > 1.0 || extraTasks.size > 0) {
        signals.set(url, {
          gscBoost: Math.min(boost, 4.0), // max 4x
          extraTasks: Array.from(extraTasks)
        });
      }
    }

    console.log(`  GSC signals: ${signals.size} pages with boost/extra tasks`);
  } catch (e) {
    console.error(`  GSC signals error for ${customerId}: ${e.message}`);
  }

  return signals;
}

// ── URL-mönster som aldrig ska SEO-optimeras ──
const SKIP_URL_PATTERNS = [
  // WooCommerce funktionssidor
  /\/(kassan|checkout|varukorg|cart|kassa)(\/|$)/i,
  /\/(min-konto|my-account|mitt-konto)(\/|$)/i,
  /\/(betalning|payment|order-received|orderbekraftelse)(\/|$)/i,
  /\/(sample-page|provida)(\/|$)/i,
  // WooCommerce butik och produktsidor
  /\/(butik|shop|store)(\/|$)/i,
  /\/(produkt|product)(\/|$)/i,
  /\/(produktkategori|product-category)(\/|$)/i,
  // WordPress-teststeg och dolda sidor
  /\/(dold|test|temp|tmp|staging|dev|draft)([-_]|\/|$)/i,
  // Vanliga WordPress-sidor utan SEO-värde
  /\/(wp-content|wp-includes|wp-admin)\//i,
  /\/(feed|sitemap)(\/|$)/i,
];

// Slugs som aldrig har SEO-värde
const SKIP_SLUGS = new Set([
  'kassan', 'checkout', 'varukorg', 'cart', 'kassa',
  'my-account', 'min-konto', 'mitt-konto',
  'betalning', 'order-received', 'orderbekraftelse', 'sample-page',
  'butik', 'shop', 'store', 'produkt', 'product',
  'privacy-policy', 'integritetspolicy', 'cookie-policy', 'cookiepolicy',
  'terms', 'villkor', 'anvandarvillkor', 'gdpr', 'personuppgifter',
  'tack', 'thank-you', 'bekraftelse',
  'login', 'logga-in', 'register', 'registrera',
]);

function shouldSkipUrl(url, title) {
  // Kontrollera URL-mönster
  for (const pattern of SKIP_URL_PATTERNS) {
    if (pattern.test(url)) return true;
  }
  // Kontrollera specifika slugs
  const slug = (url.replace(/\/$/, '').split('/').pop() || '').toLowerCase();
  if (SKIP_SLUGS.has(slug)) return true;
  return false;
}

async function auditSite(site) {
  console.log(`Auditing: ${site.url}`);
  const issues = [];

  try {
    const posts = await wpApi(site, '/posts?per_page=100&status=publish');
    const pages = await wpApi(site, '/pages?per_page=100&status=publish');
    const allContent = [...posts, ...pages];
    let skippedCount = 0;

    for (const item of allContent) {
      // Hoppa över kassasidor, interna WooCommerce-sidor etc.
      if (shouldSkipUrl(item.link, item.title.rendered)) {
        skippedCount++;
        continue;
      }

      const problems = [];
      const title = item.title.rendered;
      const content = item.content.rendered;
      const text = content.replace(/<[^>]+>/g, '').trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;

      // Rank Math meta description (om tillgänglig via API-svar)
      const metaDesc = (item.meta && (item.meta.rank_math_description || item.meta._yoast_wpseo_metadesc)) || '';

      // Titel-problem
      if (!title || title.length < 20) problems.push({ type: 'short_title', severity: 'high' });
      if (title && title.length > 60) problems.push({ type: 'long_title', severity: 'medium' });

      // Meta description (separat task — fixMetadata hanterar den)
      if (!metaDesc || metaDesc.length < 50) problems.push({ type: 'missing_description', severity: 'high' });

      // Innehåll — ordräkning (inte teckenräkning)
      if (wordCount < 300) problems.push({ type: 'thin_content', severity: 'high', wordCount });
      if (wordCount >= 300 && wordCount < 500) problems.push({ type: 'thin_content', severity: 'medium', wordCount });

      // H1
      if (!content.match(/<h1/i)) problems.push({ type: 'missing_h1', severity: 'medium' });


      // H2-rubriker — om sidan har innehåll men inga/få H2
      const h2count = (content.match(/<h2/gi) || []).length;
      if (h2count < 2 && wordCount >= 400) {
        problems.push({ type: 'h2_optimization', severity: 'medium', h2count });
      }

      // Interna länkar
      const internalLinks = (content.match(new RegExp(`<a[^>]*href=["']${site.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')) || []).length;
      if (internalLinks === 0) problems.push({ type: 'no_internal_links', severity: 'medium' });

      // Bilder utan alt-text
      const imgsNoAlt = (content.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
      if (imgsNoAlt > 0) problems.push({ type: 'missing_alt_text', severity: 'medium', count: imgsNoAlt });

      // Schema markup
      if (!content.includes('application/ld+json')) problems.push({ type: 'no_schema', severity: 'medium' });

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
    console.log(`  Found ${issues.length} pages with issues (${allContent.length} total, ${skippedCount} skipped — checkout/woo pages)`);
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

      // ── SEO-signal-loop: hämta GSC-signaler för att boosta rätt sidor ──
      const gscSignals = await getGscSignals(bq, dataset, site.id);

      // Applicera GSC-boost på prioritet + lägg till extra task_types
      const boostedIssues = issues.map(issue => {
        const signal = gscSignals.get(issue.url);
        if (!signal) return issue;

        const boostedPriority = Math.round(issue.priority * signal.gscBoost);
        const allProblems = [...issue.problems];

        // Lägg till extra task_types från GSC-signalen om de inte redan finns
        for (const extraType of (signal.extraTasks || [])) {
          if (!allProblems.some(p => p.type === extraType)) {
            allProblems.push({ type: extraType, severity: 'medium', source: 'gsc_signal' });
          }
        }

        return {
          ...issue,
          problems: allProblems,
          priority: boostedPriority,
          gsc_boost: signal.gscBoost
        };
      });

      // Lägg även till GSC-signalerade sidor som WP-crawlen INTE hittat problem på
      // (sidor med hög potentiell vinst men inga uppenbara SEO-fel)
      const issueUrls = new Set(issues.map(i => i.url));
      for (const [url, signal] of gscSignals.entries()) {
        if (issueUrls.has(url)) continue;
        if (signal.extraTasks.length === 0) continue;
        // Bara lägga till om det finns konkreta extra-tasks
        boostedIssues.push({
          id: null,
          title: url.split('/').filter(Boolean).pop() || url,
          url,
          problems: signal.extraTasks.map(t => ({ type: t, severity: 'medium', source: 'gsc_signal' })),
          priority: Math.round(5 * signal.gscBoost),
          gsc_boost: signal.gscBoost,
          gsc_only: true
        });
      }

      // Sortera om efter boostade prioriteter
      boostedIssues.sort((a, b) => b.priority - a.priority);

      // Hämta (URL + task_type)-kombinationer som redan hanteras eller optimerats senaste 30 dagarna
      const [existingRows] = await bq.query({
        query: `
          SELECT DISTINCT page_url, task_type FROM \`${dataset}.seo_work_queue\`
          WHERE customer_id = @cid AND status IN ('pending', 'in_progress')
          UNION DISTINCT
          SELECT DISTINCT page_url, optimization_type AS task_type FROM \`${dataset}.seo_optimization_log\`
          WHERE customer_id = @cid AND timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)
        `,
        params: { cid: site.id }
      });
      // De-dup på (URL + task_type) — inte bara URL, så varje problemtyp kan åtgärdas separat
      const alreadyHandled = new Set(existingRows.map(r => `${r.page_url}::${r.task_type}`));

      // Skapa en queue-rad per problem per sida (max 3 problem/sida, max 30 totalt)
      const queueItems = [];
      for (const issue of boostedIssues) {
        if (queueItems.length >= 30) break;
        const contextData = JSON.stringify({
          ...issue,
          gsc_signal: gscSignals.has(issue.url)
            ? { boost: gscSignals.get(issue.url).gscBoost, extraTasks: gscSignals.get(issue.url).extraTasks }
            : null
        });
        let addedForThisPage = 0;
        for (const problem of issue.problems) {
          if (addedForThisPage >= 3) break;
          if (queueItems.length >= 30) break;
          if (alreadyHandled.has(`${issue.url}::${problem.type}`)) continue;
          queueItems.push({
            queue_id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            customer_id: site.id,
            priority: issue.priority,
            task_type: problem.type,
            page_url: issue.url,
            context_data: contextData,
            status: 'pending',
            created_at: new Date().toISOString(),
            processed_at: null
          });
          addedForThisPage++;
        }
      }

      const boostedCount = boostedIssues.filter(i => i.gsc_boost && i.gsc_boost > 1).length;
      const gscOnlyCount = boostedIssues.filter(i => i.gsc_only).length;
      console.log(`  ${issues.length} sidor med WP-problem, ${boostedCount} boostade av GSC-signal, ${gscOnlyCount} GSC-only`);
      console.log(`  ${existingRows.length} redan hanterade (URL+task), ${queueItems.length} nya läggs till`);

      // Batch INSERT — bara nya sidor
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
      } else {
        console.log(`  Inga nya sidor att lägga till — allt redan hanterat`);
      }

      // ── Lägg till artikelgenerering (1 per kund per vecka) ──
      const articleExists = existingRows.some(r => r.task_type === 'create_article');
      if (!articleExists) {
        const articleQueueId = `q-${Date.now()}-article-${Math.random().toString(36).slice(2, 8)}`;
        const articleItem = {
          queue_id: articleQueueId,
          customer_id: site.id,
          site_url: site.url,
          task_type: 'create_article',
          page_url: site.url,
          context_data: JSON.stringify({ type: 'auto_article', customer_id: site.id }),
          priority: 3,
          status: 'pending'
        };
        const esc = (s) => (s || '').replace(/'/g, "\\'").replace(/\\/g, '\\\\');
        await bq.query({
          query: `INSERT INTO \`${dataset}.seo_work_queue\` (queue_id, customer_id, site_url, task_type, page_url, context_data, priority, status, created_at)
                  VALUES ('${esc(articleItem.queue_id)}', '${esc(articleItem.customer_id)}', '${esc(articleItem.site_url)}', '${esc(articleItem.task_type)}', '${esc(articleItem.page_url)}', '${esc(articleItem.context_data)}', ${articleItem.priority}, 'pending', CURRENT_TIMESTAMP())`
        });
        console.log(`  Artikelgenerering köad för ${site.id}`);
      }

      allResults.push({
        site: site.url,
        totalIssues: issues.length,
        gscBoosted: boostedCount,
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
