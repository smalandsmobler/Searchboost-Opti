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

// Module-level — sätts om i handler beroende på OpenRouter-nyckel
let AI_MODEL = process.env.AI_MODEL || 'claude-haiku-4-5-20251001';

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
  // BUG FIX: Hitta "DONE"-listan explicit, INTE lists[0] (= "Analys" med 64 kort)
  const list = lists.find(l => l.name.toUpperCase() === 'DONE') || lists[lists.length - 1] || lists[0];
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

// ── Hjälpfunktion: redirect-kontroll ──
function isRedirectPage(content) {
  return /<!--\s*redirect\s*-->|<meta[^>]+http-equiv=['"]refresh['"][^>]*>/i.test(content) ||
         /^\s*location\s*:/im.test(content);
}

// ── Optimization handlers ──

// ── Data-driven signal boost: GSC + Ads-data höjer prioritet på rätt sidor ──
// Returnerar Map<url, boostScore> där boostScore är en multiplikator (1.0–3.0)
async function getSignalBoost(bq, dataset, customerId) {
  const boost = new Map();

  try {
    // GSC-signal: hög impression + låg CTR = sida syns men konverterar inte klikck
    // → metadata-fix har störst ROI här
    const [gscRows] = await bq.query({
      query: `
        SELECT page, SUM(impressions) as imp, AVG(position) as pos,
               SAFE_DIVIDE(SUM(clicks), SUM(impressions)) as ctr
        FROM \`${dataset}.gsc_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
          AND page IS NOT NULL
        GROUP BY page
        HAVING imp > 50
        ORDER BY imp DESC
        LIMIT 50
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    for (const row of (gscRows || [])) {
      const url = row.page;
      if (!url) continue;
      let score = 1.0;
      // Hög impression + låg CTR = metadata-problem
      if ((row.imp || 0) > 500 && (row.ctr || 0) < 0.03) score += 1.5;
      else if ((row.imp || 0) > 200 && (row.ctr || 0) < 0.05) score += 1.0;
      // Position 4–10 = nära toppen, schema/H1 kan knuffa upp
      if ((row.pos || 99) >= 4 && (row.pos || 99) <= 10) score += 0.5;
      if (boost.has(url)) boost.set(url, Math.max(boost.get(url), score));
      else boost.set(url, score);
    }
  } catch (e) {
    // GSC-data saknas — fortsätt utan boost
  }

  try {
    // Ads-signal: om kunden kör betalda annonser på en URL
    // → organisk SEO på samma URL har multiplicerad effekt
    const [adsRows] = await bq.query({
      query: `
        SELECT campaign_name, SUM(spend) as total_spend, SUM(clicks) as total_clicks
        FROM \`${dataset}.ads_daily_metrics\`
        WHERE customer_id = @cid
          AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 14 DAY)
        GROUP BY campaign_name
        HAVING total_spend > 0
        LIMIT 20
      `,
      params: { cid: customerId }
    }).catch(() => [[]]);

    if ((adsRows || []).length > 0) {
      // Kunden har aktiv annonsering — höj alla SEO-tasks generellt
      // (kan inte matcha URL direkt om vi inte har destination URL i ads_daily)
      for (const [url, score] of boost.entries()) {
        boost.set(url, score + 0.3);
      }
    }
  } catch (e) {
    // Ads-data saknas
  }

  return boost;
}

async function getCustomerKeywords(bq, dataset, customerId) {
  try {
    const [rows] = await bq.query({
      query: `SELECT keyword, tier FROM \`${dataset}.customer_keywords\` WHERE customer_id = @cid ORDER BY tier`,
      params: { cid: customerId }
    });
    const a = rows.filter(r => r.tier === 'A').map(r => r.keyword);
    const b = rows.filter(r => r.tier === 'B').map(r => r.keyword);
    const c = rows.filter(r => r.tier === 'C').map(r => r.keyword);
    return { a, b, c, all: [...a, ...b, ...c] };
  } catch (e) {
    return { a: [], b: [], c: [], all: [] };
  }
}

// ── Hämta WP-post via ID (eller URL/slug om ID saknas — gäller GSC-only tasks) ──
async function fetchWpPost(site, context) {
  const postId = context.id;
  if (postId && postId !== 0) {
    try {
      const post = await wpApi(site, 'GET', `/posts/${postId}`);
      return { post, wpType: 'posts' };
    } catch (e) {
      const post = await wpApi(site, 'GET', `/pages/${postId}`);
      return { post, wpType: 'pages' };
    }
  }
  // Inget ID (GSC-only task) — hämta via URL/slug
  const targetUrl = context.url || context.page_url;
  if (!targetUrl) throw new Error('Ingen post-ID eller URL i context_data');
  return wpApiByUrl(site, targetUrl);
}

async function fixMetadata(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: task.task_type, action: 'skipped_redirect_page' };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const kwContext = kw.all.length > 0
    ? `\n\nKundens ABC-nyckelord:\nA-nyckelord (viktigast): ${kw.a.join(', ') || 'saknas'}\nB-nyckelord: ${kw.b.join(', ') || 'saknas'}\nC-nyckelord: ${kw.c.join(', ') || 'saknas'}\n\nAnvänd ett eller flera relevanta nyckelord naturligt i titel och beskrivning.`
    : '';

  const pageText = post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 500);

  const suggestion = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 800,
    messages: [{
      role: 'user',
      content: `Optimera SEO-title och meta description för denna WordPress-sida på svenska.

Nuvarande titel: "${post.title.rendered}"
URL: ${post.link}
Innehållsutdrag: ${pageText}${kwContext}

Krav:
- Title: max 60 tecken, inkludera primärt keyword
- Description: 130-155 tecken, inkludera 1-2 keywords, avsluta med uppmaning
- Naturlig svenska, inte keyword-stuffing

Svara i JSON: {"title": "...", "description": "...", "reasoning": "vilket keyword och varför"}`
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

async function fixInternalLinks(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;
  if (isRedirectPage(post.content.rendered)) {
    return { type: 'no_internal_links', action: 'skipped_redirect_page' };
  }

  const allPosts = await wpApi(site, 'GET', '/posts?per_page=30&status=publish');
  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const kwHint = kw.all.length > 0
    ? `\nKundens nyckelord (prioritera dessa som anchor text): ${kw.a.concat(kw.b).slice(0, 10).join(', ')}`
    : '';

  const suggestion = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Hitta 2-3 naturliga internlänkmöjligheter i denna text. Anchor text ska helst matcha kundens nyckelord.
Sida: ${post.link}
Text: ${post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 1500)}
Tillgängliga sidor: ${allPosts.filter(p => p.id !== postId).slice(0, 15).map(p => `${p.title.rendered}: ${p.link}`).join('\n')}${kwHint}
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

async function fixThinContent(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'thin_content', action: 'skipped_redirect_page' };
  }

  const currentText = post.content.rendered.replace(/<[^>]+>/g, '');
  const wordCount = currentText.split(/\s+/).filter(Boolean).length;

  // Om under 100 ord — för lite att jobba med, flagga
  if (wordCount < 100) {
    await trelloCard(
      `Tunn sida (behöver manuell text): ${context.title.substring(0, 40)}`,
      `**Behöver manuell granskning**\nSida: ${context.url}\nInnehållet är för kort (${wordCount} ord). Behöver utökas manuellt.`
    );
    return { type: 'thin_content', action: 'flagged_for_review', wordCount };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  const kwContext = kw.all.length > 0
    ? `\n\nKundens viktigaste sökord:\nA-nyckelord (primära): ${kw.a.join(', ') || 'saknas'}\nB-nyckelord: ${kw.b.join(', ') || 'saknas'}\nC-nyckelord: ${kw.c.join(', ') || 'saknas'}\n\nFörsök inkludera 2-4 relevanta nyckelord naturligt i texten.`
    : '';

  const suggestion = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Du är en expert på svensk SEO-copywriting. Sidan har för lite innehåll (${wordCount} ord). Utöka med ytterligare 200-300 ord av hög kvalitet.

Sida: ${post.link}
Nuvarande titel: ${post.title.rendered}
Nuvarande text: ${currentText.substring(0, 1000)}${kwContext}

Krav:
- Texten ska passa naturligt in i slutet av befintlig text
- Inkludera relevanta nyckelord naturligt (ej keyword-stuffing)
- Naturlig svenska, informativ och hjälpsam ton
- 2-3 stycken HTML (<p>-taggar)

Svara i JSON:
{"newParagraph": "<p>...</p><p>...</p>", "reasoning": "vilka nyckelord användes och varför"}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  const updatedContent = post.content.rendered + '\n' + result.newParagraph;
  await wpApi(site, 'POST', `/${wpType}/${postId}`, { content: updatedContent });

  await trelloCard(
    `Innehåll utökat: ${post.title.rendered.substring(0, 40)}`,
    `**Innehållsoptimering**\nSida: ${post.link}\nFrån ${wordCount} ord. Lade till ~250 ord.\n${result.reasoning}`
  );

  return { type: 'thin_content', action: 'content_expanded', wordCount, reasoning: result.reasoning };
}

async function fixMissingAltText(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'missing_alt_text', action: 'skipped_redirect_page' };
  }

  // Hitta bilder utan alt-text
  const imgRegex = /<img(?![^>]*alt=['"][^'"]+['"])[^>]*>/gi;
  const imgs = post.content.rendered.match(imgRegex) || [];
  if (imgs.length === 0) return { type: 'missing_alt_text', action: 'no_images_found' };

  const pageTitle = post.title.rendered;
  let content = post.content.rendered;
  let fixed = 0;

  for (const img of imgs.slice(0, 5)) {
    // Extrahera src för kontext
    const srcMatch = img.match(/src=['"]([^'"]+)['"]/i);
    const src = srcMatch ? srcMatch[1] : '';
    const filename = src.split('/').pop().replace(/[-_]/g, ' ').replace(/\.[^.]+$/, '');

    const suggestion = await claude.messages.create({
      model: AI_MODEL,
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `Skriv en kort, beskrivande alt-text (max 10 ord) för en bild på sidan "${pageTitle}". Filnamn: "${filename}". Svara BARA med alt-texten, inget annat.`
      }]
    });

    const altText = suggestion.content[0].text.trim().replace(/^["']|["']$/g, '');
    // BUG FIX: Ersätt tomt alt="" ELLER lägg till nytt (undviker dubblerat alt-attribut)
    let fixedImg;
    if (/alt=["'][^"']*["']/i.test(img)) {
      // Bilden har alt="" (tomt) — ersätt med ny text
      fixedImg = img.replace(/alt=["'][^"']*["']/i, `alt="${altText}"`);
    } else {
      // Bilden saknar alt helt — lägg till
      fixedImg = img.replace(/<img/, `<img alt="${altText}"`);
    }
    content = content.replace(img, fixedImg);
    fixed++;
  }

  if (fixed > 0) {
    await wpApi(site, 'POST', `/${wpType}/${postId}`, { content });
  }

  return { type: 'missing_alt_text', fixed, reasoning: `Lade till alt-text på ${fixed} bilder` };
}

async function fixNoSchema(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'no_schema', action: 'skipped_redirect_page' };
  }

  const title = post.title.rendered;
  const url = post.link;
  const text = post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 800);

  const suggestion = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 1000,
    messages: [{
      role: 'user',
      content: `Generera schema.org JSON-LD markup för denna WordPress-sida.
Titel: ${title}
URL: ${url}
Innehållsutdrag: ${text}

Välj lämplig schema-typ (Article, Service, Product, FAQPage, WebPage etc).
Svara i JSON: {"schemaType": "...", "schemaJson": {...}, "reasoning": "..."}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // BUG FIX: Injicera INTE <script> i content — WordPress/Divi strippar det.
  // Använd Rank Math meta-fält istället.
  // rank_math_rich_snippet_type = schema-typ (Article, Service, etc.)
  // rank_math_snippet_data = serialized schema-data för Rank Math
  // Fallback: lägg i yoast_head_json om Rank Math ej installerat
  let schemaSaved = false;
  try {
    await wpApi(site, 'POST', `/${wpType}/${postId}`, {
      meta: {
        rank_math_rich_snippet_type: result.schemaType.toLowerCase(),
        rank_math_schema_data: JSON.stringify(result.schemaJson)
      }
    });
    schemaSaved = true;
  } catch (e) {
    // Rank Math ej aktiverat — försök med custom_html-blocket istället
    try {
      // Lägg schema i ett HTML-kommentarsskyddat script-block som är safer
      const schemaBlock = `<!-- wp:html -->\n<script type="application/ld+json">\n${JSON.stringify(result.schemaJson, null, 2)}\n</script>\n<!-- /wp:html -->`;
      const updatedContent = post.content.rendered + '\n' + schemaBlock;
      await wpApi(site, 'POST', `/${wpType}/${postId}`, { content: updatedContent });
      schemaSaved = true;
    } catch (e2) { /* Schema kunde ej sparas */ }
  }

  await trelloCard(
    `Schema ${result.schemaType}: ${title.substring(0, 35)}`,
    `**Schema Markup**\nSida: ${url}\nTyp: ${result.schemaType}\n${result.reasoning}`
  );

  return { type: 'no_schema', schemaType: result.schemaType, saved: schemaSaved, reasoning: result.reasoning };
}

async function fixMissingH1(site, task, claude) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'missing_h1', action: 'skipped_redirect_page' };
  }

  // Kontrollera om H1 faktiskt saknas i content
  if (/<h1/i.test(post.content.rendered)) {
    return { type: 'missing_h1', action: 'h1_already_exists' };
  }

  const suggestion = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 200,
    messages: [{
      role: 'user',
      content: `Skriv en SEO-optimerad H1-rubrik för denna WordPress-sida.
Nuvarande titel: ${post.title.rendered}
URL: ${post.link}
Innehållsutdrag: ${post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 500)}

Max 60 tecken, inkludera primärt keyword. Svara i JSON: {"h1": "...", "reasoning": "..."}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // BUG FIX: De flesta WP-teman renderar post.title.rendered som <h1> i frontend.
  // Lägg INTE till <h1> i content (ger 2x H1). Optimera istället Rank Math-titeln
  // och spara H1-texten som Rank Math-fältet, som visas i strukturerad data.
  let h1Method = 'rank_math_meta';
  try {
    await wpApi(site, 'POST', `/${wpType}/${postId}`, {
      meta: { rank_math_title: result.h1 }
    });
  } catch (e) {
    // Rank Math ej tillgängligt — uppdatera post title istället (inte content)
    h1Method = 'post_title';
    await wpApi(site, 'POST', `/${wpType}/${postId}`, {
      title: result.h1
    });
  }

  return { type: 'missing_h1', h1: result.h1, method: h1Method, reasoning: result.reasoning };
}

async function optimizeH2H3(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'h2_h3_optimization', action: 'skipped_redirect_page' };
  }

  // Räkna befintliga H2/H3
  const h2count = (post.content.rendered.match(/<h2/gi) || []).length;
  const h3count = (post.content.rendered.match(/<h3/gi) || []).length;
  if (h2count >= 3) {
    return { type: 'h2_h3_optimization', action: 'sufficient_headings', h2count, h3count };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  if (kw.all.length === 0) {
    return { type: 'h2_h3_optimization', action: 'no_keywords' };
  }

  const currentText = post.content.rendered.replace(/<[^>]+>/g, '').substring(0, 1500);

  const suggestion = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 1200,
    messages: [{
      role: 'user',
      content: `Förbättra rubrikstrukturen (H2/H3) för denna WordPress-sida på svenska.

Sida: ${post.title.rendered}
URL: ${post.link}
Befintliga H2: ${h2count}, H3: ${h3count}
Primära nyckelord (A): ${kw.a.join(', ')}
Sekundära nyckelord (B): ${kw.b.slice(0, 5).join(', ')}
LSI/synonymer att inkludera: bredda med variationer och semantiskt relaterade termer
Nuvarande text: ${currentText}

Krav:
- Föreslå 2-3 nya H2-rubriker med relevanta nyckelord och synonymer
- Varje H2 ska täcka ett semantiskt ämnesområde
- Naturlig svenska, ej keyword-stuffing
- Inkludera 1-2 LSI-termer per rubrik

Svara i JSON: {"headings": [{"level": "h2", "text": "...", "afterText": "första 20 ord av stycket den ska sättas framför", "keyword": "vilket nyckelord/synonym"}], "reasoning": "..."}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  let content = post.content.rendered;
  let added = 0;

  // BUG FIX: afterText-regex misslyckas ofta — Claude returnerar ren text men content är HTML.
  // Strategi: försök exakt match först, annars fördela H2:ar jämnt bland <p>-stycken.
  const paragraphs = content.match(/<p[^>]*>/gi) || [];
  const insertAt = paragraphs.length > 3
    ? [Math.floor(paragraphs.length * 0.3), Math.floor(paragraphs.length * 0.6), Math.floor(paragraphs.length * 0.85)]
    : [1, Math.floor(paragraphs.length / 2), paragraphs.length - 1];

  for (let i = 0; i < result.headings.length; i++) {
    const h = result.headings[i];
    if (!h.text) continue;

    // Försök 1: matcha afterText mot HTML-content (exakt)
    if (h.afterText) {
      const escaped = h.afterText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 30);
      const re = new RegExp(`(<p[^>]*>\\s*${escaped})`, 'i');
      if (re.test(content)) {
        content = content.replace(re, `<${h.level}>${h.text}</${h.level}>\n$1`);
        added++;
        continue;
      }
      // Försök 2: matcha utan HTML-taggar i texten (ta bort taggar från afterText)
      const cleanAfter = h.afterText.replace(/<[^>]+>/g, '').trim().substring(0, 25);
      if (cleanAfter.length > 5) {
        const escapedClean = cleanAfter.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const reClean = new RegExp(`(<p[^>]*>[^<]*${escapedClean})`, 'i');
        if (reClean.test(content)) {
          content = content.replace(reClean, `<${h.level}>${h.text}</${h.level}>\n$1`);
          added++;
          continue;
        }
      }
    }

    // Försök 3 (fallback): sätt H2 vid beräknad paragraf-position
    const targetParagraphIndex = insertAt[i] || insertAt[insertAt.length - 1] || 1;
    let pCount = 0;
    const re3 = /(<p[^>]*>)/gi;
    let match;
    let replaced = false;
    const tmpContent = content;
    content = content.replace(re3, (m) => {
      pCount++;
      if (pCount === targetParagraphIndex && !replaced) {
        replaced = true;
        return `<${h.level}>${h.text}</${h.level}>\n${m}`;
      }
      return m;
    });
    if (replaced) added++;
    else content = tmpContent; // Undo om det misslyckades
  }

  if (added > 0) {
    await wpApi(site, 'POST', `/${wpType}/${postId}`, { content });
    await trelloCard(
      `H2/H3 optimerat: ${post.title.rendered.substring(0, 35)}`,
      `**Rubrikoptimering**\nSida: ${post.link}\nLade till ${added} nya H2/H3-rubriker med nyckelord och synonymer.\n${result.reasoning}`
    );
  }

  return { type: 'h2_h3_optimization', added, reasoning: result.reasoning };
}

async function enrichWithSynonyms(site, task, claude, bq, dataset) {
  const context = JSON.parse(task.context_data);
  const { post, wpType } = await fetchWpPost(site, context);
  const postId = post.id;

  if (isRedirectPage(post.content.rendered)) {
    return { type: 'synonym_gap', action: 'skipped_redirect_page' };
  }

  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  if (kw.all.length === 0) {
    return { type: 'synonym_gap', action: 'no_keywords' };
  }

  const currentText = post.content.rendered.replace(/<[^>]+>/g, '');
  const wordCount = currentText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 150) {
    return { type: 'synonym_gap', action: 'too_short', wordCount };
  }

  const suggestion = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Du är en expert på svensk SEO-copywriting. Analysera sidan och identifiera saknade synonymer/LSI-termer till primärnyckelorden. Lägg till dem naturligt.

Sida: ${post.title.rendered}
Primära nyckelord: ${kw.a.join(', ')}
Sekundära nyckelord: ${kw.b.slice(0, 5).join(', ')}
Nuvarande text (${wordCount} ord): ${currentText.substring(0, 1200)}

Uppgift:
1. Identifiera 3-5 synonymer/LSI-termer som saknas i texten
2. Skriv ett nytt stycke (150-200 ord HTML) som naturligt integrerar dessa termer
3. Stycket ska passa semantiskt med sidans ämne

Svara i JSON: {"missingTerms": ["term1", "term2"], "newParagraph": "<p>...</p>", "reasoning": "varför dessa termer"}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);
  const updatedContent = post.content.rendered + '\n' + result.newParagraph;
  await wpApi(site, 'POST', `/${wpType}/${postId}`, { content: updatedContent });

  await trelloCard(
    `Synonymer tillagda: ${post.title.rendered.substring(0, 35)}`,
    `**Synonymberikning**\nSida: ${post.link}\nTillagda termer: ${(result.missingTerms || []).join(', ')}\n${result.reasoning}`
  );

  return { type: 'synonym_gap', terms: result.missingTerms, reasoning: result.reasoning };
}

// ── Svenska namn för task-typer ──
function formatTaskType(type) {
  const names = {
    'short_title':        'Förlängde titel',
    'long_title':         'Kortade ner titel',
    'thin_content':       'Utökade innehåll',
    'missing_h1':         'La till H1-rubrik',
    'no_internal_links':  'La till interna länkar',
    'missing_alt_text':   'La till alt-text på bilder',
    'no_schema':          'La till schema markup',
    'h2_optimization':    'Optimerade H2-rubriker',
    'h3_optimization':    'Optimerade H3-rubriker',
    'h2_h3_optimization': 'Optimerade H2/H3-rubriker med synonymer',
    'synonym_gap':        'Berikat text med synonymer och LSI-termer',
    'metadata':           'Optimerade metadata',
    'title':              'Optimerade sidtitel',
    'description':        'Skrev meta-beskrivning',
    'faq_schema':         'La till FAQ-schema',
    'internal_links':     'Förbättrade intern länkning',
    'content':            'Innehållsoptimering',
    'schema':             'La till schema markup',
    'technical':          'Teknisk SEO-fix',
    'manual':             'Manuell åtgärd'
  };
  return names[type] || type || 'SEO-optimering';
}

// ── Artikelgenerering ──
async function createArticle(site, task, claude, bq, dataset) {
  const kw = await getCustomerKeywords(bq, dataset, task.customer_id);
  if (kw.all.length === 0) {
    return { type: 'create_article', action: 'no_keywords' };
  }

  // Hämta befintliga inlägg för att undvika duplicering
  const existingPosts = await wpApi(site, 'GET', '/posts?per_page=50&_fields=id,title,link');
  const existingTitles = existingPosts.map(p => p.title.rendered.toLowerCase());

  // Välj nyckelord att skriva om (rotera baserat på antal befintliga artiklar)
  const targetKeywords = kw.a.length > 0 ? kw.a : kw.b.length > 0 ? kw.b : kw.c;
  const kwIndex = existingPosts.length % targetKeywords.length;
  const primaryKw = targetKeywords[kwIndex] || kw.all[0];
  const relatedKws = kw.all.filter(k => k !== primaryKw).slice(0, 5);

  const suggestion = await claude.messages.create({
    model: AI_MODEL,
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Du är en expert på svensk SEO-content. Skriv en informativ blogg/guide-artikel.

Företag: ${site.url}
Primärt sökord: ${primaryKw}
Relaterade sökord att inkludera: ${relatedKws.join(', ')}
Befintliga artiklar (undvik liknande titlar): ${existingTitles.slice(0, 10).join(', ')}

Krav:
- Titel: SEO-optimerad, 50-65 tecken, inkludera primärt sökord
- Innehåll: 600-900 ord
- Struktur: H2 + H3-rubriker, korta stycken
- Naturlig svenska, hjälpsam ton
- Inkludera interna länkar till befintliga sidor
- Avsluta med CTA
- HTML-format med p, h2, h3, ul, li, a-taggar

Svara i JSON:
{"title": "Artikeltitel", "content": "<h2>...</h2><p>...</p>...", "excerpt": "Kort sammanfattning (150 tecken)", "slug": "url-slug", "reasoning": "Varför denna vinkel valdes"}`
    }]
  });

  const result = parseClaudeJSON(suggestion.content[0].text);

  // Kolla att titeln inte redan finns
  if (existingTitles.includes(result.title.toLowerCase())) {
    return { type: 'create_article', action: 'duplicate_title', title: result.title };
  }

  // Publicera som utkast (draft) — kan ändras till 'publish' för full automation
  const newPost = await wpApi(site, 'POST', '/posts', {
    title: result.title,
    content: result.content,
    excerpt: result.excerpt,
    slug: result.slug,
    status: 'publish',
    categories: [],
    meta: {
      rank_math_title: result.title,
      rank_math_description: result.excerpt
    }
  });

  await trelloCard(
    `Ny artikel: ${result.title.substring(0, 45)}`,
    `**Artikelgenerering**\nSökord: ${primaryKw}\nURL: ${newPost.link}\n${result.reasoning}`
  );

  return { type: 'create_article', action: 'published', title: result.title, url: newPost.link, keyword: primaryKw };
}

// ── Säkra uppgifter: körs alltid (även utan åtgärdsplan) ──
const SAFE_TASK_TYPES = new Set([
  'short_title', 'long_title', 'missing_description', 'missing_h1', 'no_schema', 'thin_content',
  'h2_optimization', 'h3_optimization', 'h2_h3_optimization', 'synonym_gap',
  'missing_alt_text', 'create_article'
]);

// ── Main handler ──
const TASK_HANDLERS = {
  'short_title':          fixMetadata,
  'long_title':           fixMetadata,
  'missing_description':  fixMetadata,
  'no_internal_links':    fixInternalLinks,
  'thin_content':         fixThinContent,
  'missing_h1':           fixMissingH1,
  'missing_alt_text':     fixMissingAltText,
  'no_schema':            fixNoSchema,
  'h2_optimization':      optimizeH2H3,
  'h3_optimization':      optimizeH2H3,
  'h2_h3_optimization':   optimizeH2H3,
  'synonym_gap':          enrichWithSynonyms,
  'create_article':       createArticle
};

// ── Beräkna aktuell planmånad (månader sedan planen skapades, 1-indexerad, max 3) ──
function currentPlanMonth(createdAt) {
  const start = new Date(createdAt.value || createdAt);
  const now = new Date();
  const months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  return Math.min(Math.max(months + 1, 1), 3);
}

// ── Hämta uppgifter från action_plans för en kund (aktuell månad) ──
async function getActionPlanTasks(bq, dataset, customerId, maxTasks) {
  try {
    // Hitta planens skapandedatum för att räkna ut aktuell månad
    const [planMeta] = await bq.query({
      query: `SELECT MIN(created_at) as created_at FROM \`${dataset}.action_plans\`
              WHERE customer_id = @cid AND status IN ('planned', 'active')`,
      params: { cid: customerId }
    });
    if (!planMeta.length || !planMeta[0].created_at) return [];

    const month = currentPlanMonth(planMeta[0].created_at);
    console.log(`  ${customerId}: action_plan aktuell månad = ${month}`);

    const [rows] = await bq.query({
      query: `SELECT * FROM \`${dataset}.action_plans\`
              WHERE customer_id = @cid
              AND status IN ('planned', 'active')
              AND month_number = @month
              AND target_url IS NOT NULL
              AND target_url != ''
              ORDER BY priority DESC
              LIMIT @maxTasks`,
      params: { cid: customerId, month, maxTasks }
    });
    return rows;
  } catch (e) {
    console.log(`  Ingen action_plan hittad for ${customerId}: ${e.message}`);
    return [];
  }
}

// ── Kör en action_plan-uppgift och uppdatera dess status ──
async function runActionPlanTask(planTask, site, claude, bq, dataset) {
  // Bygg ett task-objekt som handler-funktionerna förstår
  const fakeTask = {
    queue_id: planTask.plan_id,
    customer_id: planTask.customer_id,
    task_type: mapPlanTaskType(planTask.task_type),
    page_url: planTask.target_url,
    priority: planTask.priority || 50,
    context_data: JSON.stringify({
      id: extractWpIdFromUrl(planTask.target_url),
      url: planTask.target_url,
      title: planTask.task_description || '',
      keyword: planTask.target_keyword || ''
    })
  };

  const handler = TASK_HANDLERS[fakeTask.task_type];
  if (!handler) {
    console.log(`  Ingen handler for plan task_type: ${planTask.task_type} (mappat: ${fakeTask.task_type})`);
    await bq.query({
      query: `UPDATE \`${dataset}.action_plans\` SET status = 'skipped' WHERE plan_id = @pid`,
      params: { pid: planTask.plan_id }
    });
    return null;
  }

  const result = await handler(site, fakeTask, claude, bq, dataset);

  // Markera planen som klar
  await bq.query({
    query: `UPDATE \`${dataset}.action_plans\`
            SET status = 'completed', completed_at = CURRENT_TIMESTAMP()
            WHERE plan_id = @pid`,
    params: { pid: planTask.plan_id }
  });

  // Logga i seo_optimization_log
  await bq.query({
    query: `INSERT INTO \`${dataset}.seo_optimization_log\`
            (timestamp, customer_id, site_url, optimization_type, page_url, before_state, after_state, claude_reasoning, impact_estimate)
            VALUES (CURRENT_TIMESTAMP(), @customer_id, @site_url, @opt_type, @page_url, @before, @after, @reasoning, @impact)`,
    params: {
      customer_id: planTask.customer_id,
      site_url: site.url,
      opt_type: fakeTask.task_type,
      page_url: planTask.target_url,
      before: planTask.task_description || '',
      after: JSON.stringify(result),
      reasoning: ('[Plan M' + (planTask.month_number || 1) + '] ' + formatTaskType(fakeTask.task_type) + ': ' + (result.reasoning || result.action || '')).substring(0, 500),
      impact: String((planTask.priority || 50) / 10)
    }
  });

  return result;
}

// ── Mappa action_plan task_type → handler-nyckel ──
function mapPlanTaskType(type) {
  const map = {
    // Metadata-varianter
    'metadata_optimization': 'short_title',
    'metadata':              'short_title',  // BUG FIX: 'metadata' mappades inte
    'title_optimization':    'short_title',
    'title':                 'short_title',  // BUG FIX
    'meta_title':            'short_title',
    'meta_description':      'short_title',
    'description':           'short_title',  // BUG FIX
    // Innehållsvarianter
    'content_optimization':  'thin_content',
    'content_expansion':     'thin_content',
    'content':               'thin_content', // BUG FIX
    // Länkning
    'internal_linking':      'no_internal_links',
    'internal_links':        'no_internal_links',
    // Schema
    'schema_markup':         'no_schema',
    'schema':                'no_schema',    // BUG FIX
    'faq_schema':            'no_schema',    // BUG FIX
    // Rubriker
    'h1_optimization':       'missing_h1',
    'h2_optimization':       'h2_optimization',
    'h3_optimization':       'h3_optimization',
    'h2_h3_optimization':    'h2_h3_optimization',
    // Synonymer/LSI
    'synonym_gap':           'synonym_gap',
    'synonym_optimization':  'synonym_gap',
    // Bilder
    'alt_text':              'missing_alt_text',
    'missing_alt_text':      'missing_alt_text'
    // OBS: 'technical' och 'manual' → ingen handler → graceful skip (korrekt)
  };
  return map[type] || type;
}

// ── Försök extrahera WordPress post-ID från URL (fallback: 0) ──
function extractWpIdFromUrl(url) {
  // Kan inte extrahera utan WP-anrop — returnar 0 och låter handler hämta via slug
  return 0;
}

// ── Hämta WP-post via URL/slug istället för ID ──
async function wpApiByUrl(site, targetUrl) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const slug = targetUrl.replace(/\/$/, '').split('/').pop();

  // BUG FIX: Tom slug = startsidan — hämta via WP front_page setting
  if (!slug || targetUrl.replace(/^https?:\/\/[^/]+\/?$/, '') === '') {
    try {
      const settingsRes = await axios.get(`${site.url}/wp-json/wp/v2/settings`, {
        headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
      });
      const frontPageId = settingsRes.data?.page_on_front;
      if (frontPageId) {
        const pageRes = await axios.get(`${site.url}/wp-json/wp/v2/pages/${frontPageId}`, {
          headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
        });
        return { post: pageRes.data, wpType: 'pages' };
      }
    } catch (e) {}
    // Fallback: hämta page med slug 'hem' eller 'home'
    for (const homeSlug of ['hem', 'home', 'start', 'startsida']) {
      try {
        const res = await axios.get(`${site.url}/wp-json/wp/v2/pages?slug=${homeSlug}&status=publish`, {
          headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
        });
        if (res.data && res.data.length > 0) return { post: res.data[0], wpType: 'pages' };
      } catch (e) {}
    }
    throw new Error('Kunde inte hitta startsidan via slug eller front_page setting');
  }

  // Försök posts
  try {
    const res = await axios.get(`${site.url}/wp-json/wp/v2/posts?slug=${slug}&status=publish`, {
      headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
    });
    if (res.data && res.data.length > 0) return { post: res.data[0], wpType: 'posts' };
  } catch (e) {}
  // Försök pages
  try {
    const res = await axios.get(`${site.url}/wp-json/wp/v2/pages?slug=${slug}&status=publish`, {
      headers: { 'Authorization': `Basic ${auth}` }, timeout: 15000
    });
    if (res.data && res.data.length > 0) return { post: res.data[0], wpType: 'pages' };
  } catch (e) {}
  throw new Error('Kunde inte hitta sida via slug: ' + slug);
}


exports.handler = async (event) => {
  console.log('=== Autonomous Optimizer Started ===');
  // Budget per körning — höjt tillfälligt för veckorapport-deadline
  const MAX_TASKS_PER_CUSTOMER = parseInt(process.env.MAX_TASKS_PER_CUSTOMER || '8', 10);
  const MAX_TOTAL = parseInt(process.env.MAX_TOTAL || '50', 10);

  try {
    const { bq, dataset } = await getBigQuery();
    const sites = await getWordPressSites();

    // Force Anthropic direkt — OpenRouter-nyckel utgången och grok-3-mini-slug 404
    const claude = new Anthropic({ apiKey: await getParam('/seo-mcp/anthropic/api-key') });
    AI_MODEL = 'claude-haiku-4-5-20251001';

    const blockedCustomers = new Set();
    const results = [];
    let totalProcessed = 0;

    for (const site of sites) {
      if (totalProcessed >= MAX_TOTAL) break;
      if (blockedCustomers.has(site.id)) continue;

      // Skippa om inga nyckelord finns
      const customerKw = await getCustomerKeywords(bq, dataset, site.id);
      if (customerKw.all.length === 0) {
        console.log(`  Skippar ${site.id} — inga nyckelord konfigurerade`);
        continue;
      }

      const remaining = MAX_TOTAL - totalProcessed;
      const maxForThisCustomer = Math.min(MAX_TASKS_PER_CUSTOMER, remaining);

      // ── PRIMÄRT: Hämta uppgifter från action_plans (aktuell månad) ──
      const planTasks = await getActionPlanTasks(bq, dataset, site.id, maxForThisCustomer);

      if (planTasks.length > 0) {
        console.log(`  ${site.id}: ${planTasks.length} uppgifter från action_plan`);

        for (const planTask of planTasks) {
          if (blockedCustomers.has(site.id)) break;
          if (totalProcessed >= MAX_TOTAL) break;

          // Validera target_url mot blocklist
          if (shouldSkipPlanUrl(planTask.target_url)) {
            console.log(`  Skippar plan-uppgift — blockad URL: ${planTask.target_url}`);
            await bq.query({
              query: `UPDATE \`${dataset}.action_plans\` SET status = 'skipped' WHERE plan_id = @pid`,
              params: { pid: planTask.plan_id }
            });
            continue;
          }

          try {
            console.log(`  [Plan] ${planTask.task_type} → ${planTask.target_url}`);
            const result = await runActionPlanTask(planTask, site, claude, bq, dataset);
            if (result) {
              results.push({ plan_id: planTask.plan_id, customer_id: site.id, ...result });
              totalProcessed++;
            }
          } catch (err) {
            console.error(`  Fel vid plan-uppgift ${planTask.plan_id}: ${err.message}`);
            if (err.response && err.response.status === 403) {
              blockedCustomers.add(site.id);
            }
            const newStatus = (err.response && err.response.status === 404) ? 'skipped' : 'error';
            if (newStatus === 'skipped') {
              console.log(`  Skippar permanent (404): ${planTask.target_url}`);
            }
            await bq.query({
              query: `UPDATE \`${dataset}.action_plans\` SET status = @status WHERE plan_id = @pid`,
              params: { status: newStatus, pid: planTask.plan_id }
            });
          }
        }

      } else {
        // ── SEKUNDÄRT FALLBACK: work_queue (kunder utan action_plan) ──
        console.log(`  ${site.id}: ingen action_plan — kör work_queue (fallback)`);

        // Hämta fler uppgifter än vi kör — sorterar om med signal-boost efteråt
        const fetchLimit = Math.min(maxForThisCustomer * 4, 40);
        const [rawQueueTasks] = await bq.query({
          query: `SELECT * FROM \`${dataset}.seo_work_queue\`
                  WHERE customer_id = @cid AND status = 'pending'
                  ORDER BY priority DESC LIMIT @max`,
          params: { cid: site.id, max: fetchLimit }
        });

        // GSC + Ads signal-boost — re-prioritera kön
        const signalBoost = await getSignalBoost(bq, dataset, site.id);
        const queueTasks = rawQueueTasks
          .map(task => {
            const boost = signalBoost.get(task.page_url) || 1.0;
            return { ...task, _effectivePriority: (task.priority || 5) * boost };
          })
          .sort((a, b) => b._effectivePriority - a._effectivePriority)
          .slice(0, maxForThisCustomer);

        if (signalBoost.size > 0) {
          console.log(`  Signal-boost aktiv — ${signalBoost.size} URL:er med GSC/Ads-data`);
        }

        for (const task of queueTasks) {
          if (blockedCustomers.has(site.id)) break;
          if (totalProcessed >= MAX_TOTAL) break;

          // Bara säkra uppgifter i fallback-läge (ingen plan = ingen åtgärdsplan godkänd av Mikael)
          if (!SAFE_TASK_TYPES.has(task.task_type)) {
            console.log(`  Skippar ${task.task_type} — kräver åtgärdsplan`);
            continue;
          }

          const handler = TASK_HANDLERS[task.task_type];
          if (!handler) {
            await bq.query({
              query: `UPDATE \`${dataset}.seo_work_queue\` SET status = 'skipped' WHERE queue_id = @qid`,
              params: { qid: task.queue_id }
            });
            continue;
          }

          try {
            console.log(`  [Queue] ${task.task_type} → ${task.page_url}`);
            const result = await handler(site, task, claude, bq, dataset);
            results.push({ queue_id: task.queue_id, customer_id: site.id, ...result });
            totalProcessed++;

            await bq.query({
              query: `UPDATE \`${dataset}.seo_work_queue\` SET status = 'completed', processed_at = CURRENT_TIMESTAMP() WHERE queue_id = @qid`,
              params: { qid: task.queue_id }
            });

            await bq.query({
              query: `INSERT INTO \`${dataset}.seo_optimization_log\`
                      (timestamp, customer_id, site_url, optimization_type, page_url, before_state, after_state, claude_reasoning, impact_estimate)
                      VALUES (CURRENT_TIMESTAMP(), @customer_id, @site_url, @opt_type, @page_url, @before, @after, @reasoning, @impact)`,
              params: {
                customer_id: task.customer_id,
                site_url: site.url,
                opt_type: task.task_type,
                page_url: task.page_url,
                before: task.context_data,
                after: JSON.stringify(result),
                reasoning: ('[Queue] ' + formatTaskType(task.task_type) + ': ' + (result.reasoning || result.action || '')).substring(0, 500),
                impact: String((task.priority || 5) / 10) // BUG FIX: priority kan vara null → NaN
              }
            });

          } catch (err) {
            console.error(`  Fel vid queue-uppgift ${task.queue_id}: ${err.message}`);
            if (err.response && err.response.status === 403) {
              blockedCustomers.add(site.id);
            }
            const newStatus = (err.response && err.response.status === 404) ? 'skipped' : 'error';
            if (newStatus === 'skipped') {
              console.log(`  Skippar permanent (404): ${task.page_url}`);
            }
            await bq.query({
              query: `UPDATE \`${dataset}.seo_work_queue\` SET status = @status WHERE queue_id = @qid`,
              params: { status: newStatus, qid: task.queue_id }
            });
          }
        }
      }
    }

    console.log(`=== Optimizer klar: ${totalProcessed} uppgifter körda ===`);
    return { statusCode: 200, body: JSON.stringify({ processed: totalProcessed, results }) };
  } catch (err) {
    console.error('Optimizer misslyckades:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

// ── Kontrollera om en plan-URL är blockad (WooCommerce-sidor etc.) ──
function shouldSkipPlanUrl(url) {
  if (!url) return true;
  const BLOCKED = [
    /\/(kassan|checkout|varukorg|cart|kassa)(\/|$)/i,
    /\/(min-konto|my-account|mitt-konto)(\/|$)/i,
    /\/(betalning|payment|order-received|orderbekraftelse)(\/|$)/i,
    /\/(butik|shop|store)(\/|$)/i,
    /\/(login|logga-in|register|registrera)(\/|$)/i,
    /\/(tack|thank-you|bekraftelse)(\/|$)/i,
    /\/(wp-content|wp-includes|wp-admin)\//i,
    /\/(feed|sitemap)(\/|$)/i,
  ];
  return BLOCKED.some(p => p.test(url));
}
