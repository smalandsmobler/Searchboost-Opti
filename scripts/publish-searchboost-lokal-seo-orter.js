#!/usr/bin/env node
/**
 * Publicerar "Lokal SEO för svenska orter 2026"-artikeln till searchboost.se via WordPress REST API.
 * Kör detta skript på EC2 (där SSM-credentials finns tillgängliga via IAM-roll).
 *
 * Körs med:  node scripts/publish-searchboost-lokal-seo-orter.js
 *
 * Kräver: @aws-sdk/client-ssm, axios (installerade i mcp-server-code/node_modules)
 */

const path = require('path');
const { SSMClient, GetParametersByPathCommand } = require(
  path.join(__dirname, '../mcp-server-code/node_modules/@aws-sdk/client-ssm')
);
const axios = require(
  path.join(__dirname, '../mcp-server-code/node_modules/axios')
);
const fs = require('fs');

const REGION = 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

const htmlRaw = fs.readFileSync(
  path.join(__dirname, '../content-pages/seo-skola/lokal-seo-svenska-orter-2026.html'),
  'utf8'
);

const bodyMatch = htmlRaw.match(/<body[^>]*>([\s\S]*)<\/body>/i);
const bodyContent = bodyMatch ? bodyMatch[1].trim() : htmlRaw;

const ARTICLE = {
  title: 'Lokal SEO för svenska orter 2026 — så rankar du på stadens namn',
  slug: 'lokal-seo-svenska-orter-2026',
  status: 'publish',
  focus_keyword: 'lokal SEO orter',
  meta_title: 'Lokal SEO för svenska orter 2026 — landningssidor och lokala sökord | Searchboost',
  meta_description: 'Lär dig skapa lokala landningssidor för svenska städer som rankar i Google 2026. Guide till nyckelordsstrategi, sidstruktur och intern länkning för lokal SEO.',
  content: bodyContent
};

async function getWordPressSite(siteId) {
  const res = await ssm.send(new GetParametersByPathCommand({
    Path: `/seo-mcp/wordpress/${siteId}/`,
    Recursive: true,
    WithDecryption: true
  }));
  const site = { id: siteId };
  for (const p of (res.Parameters || [])) {
    const key = p.Name.split('/').pop();
    site[key] = p.Value;
  }
  return site;
}

async function wpPost(site, endpoint, data) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res = await axios({
    method: 'POST',
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    data,
    timeout: 30000
  });
  return res.data;
}

async function wpGet(site, endpoint) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res = await axios({
    method: 'GET',
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { Authorization: `Basic ${auth}` },
    timeout: 15000
  });
  return res.data;
}

async function updateRankMath(site, postId, metaTitle, metaDesc, focusKeyword) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  try {
    await axios({
      method: 'POST',
      url: `${site.url}/wp-json/rankmath/v1/updateMeta`,
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      data: { objectID: postId, objectType: 'post', title: metaTitle, description: metaDesc, focusKeyword },
      timeout: 15000
    });
    console.log('  ✓ Rank Math meta uppdaterad');
  } catch (err) {
    console.log('  ⚠ Rank Math REST misslyckades, försöker via post meta...');
    try {
      await wpPost(site, `/posts/${postId}`, {
        meta: { rank_math_title: metaTitle, rank_math_description: metaDesc, rank_math_focus_keyword: focusKeyword }
      });
      console.log('  ✓ Rank Math meta via post meta uppdaterad');
    } catch (err2) {
      console.log('  ⚠ Rank Math meta kunde inte uppdateras:', err2.message);
    }
  }
}

async function getSeoSkolaParentId(site) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  try {
    const res = await axios({
      method: 'GET',
      url: `${site.url}/wp-json/wp/v2/pages?slug=seo-skola&per_page=1`,
      headers: { Authorization: `Basic ${auth}` },
      timeout: 15000
    });
    if (res.data && res.data.length > 0) {
      console.log(`  ✓ SEO-skola föräldrasida hittad (ID: ${res.data[0].id})`);
      return res.data[0].id;
    }
  } catch (err) {
    console.log('  ⚠ Kunde inte hämta SEO-skola parent ID:', err.message);
  }
  return 0;
}

async function main() {
  console.log('=== Searchboost Lokal SEO Orter 2026 — Publicering ===\n');

  console.log('1. Hämtar WP-credentials från SSM...');
  const site = await getWordPressSite('searchboost');
  if (!site.url || !site.username || !site['app-password']) {
    throw new Error(`Saknar credentials för searchboost. Hittade: ${JSON.stringify(Object.keys(site))}`);
  }
  if (site['app-password'] === 'placeholder') {
    throw new Error('searchboost har placeholder-lösenord. Generera ett Application Password i WP-admin.');
  }
  console.log(`  ✓ Sajt: ${site.url}, Användare: ${site.username}`);

  console.log('2. Kontrollerar om artikel redan existerar...');
  const existing = await wpGet(site, `/posts?slug=${ARTICLE.slug}&status=any`);
  if (existing.length > 0) {
    console.log(`  ⚠ Artikel med slug "${ARTICLE.slug}" finns redan (ID: ${existing[0].id})`);
    console.log('  Avbryter — uppdatera manuellt om ändringar önskas.');
    return;
  }
  console.log('  ✓ Ingen dubblett hittad');

  console.log('3. Hämtar SEO-skola föräldrasida...');
  const parentId = await getSeoSkolaParentId(site);

  console.log('4. Publicerar artikel till WordPress...');
  const postData = {
    title: ARTICLE.title,
    slug: ARTICLE.slug,
    content: ARTICLE.content,
    status: ARTICLE.status,
    comment_status: 'open',
    ping_status: 'closed'
  };
  if (parentId) postData.parent = parentId;

  const post = await wpPost(site, '/posts', postData);
  console.log(`  ✓ Publicerad! Post ID: ${post.id}`);
  console.log(`  URL: ${post.link}`);

  console.log('5. Uppdaterar Rank Math SEO-meta...');
  await updateRankMath(site, post.id, ARTICLE.meta_title, ARTICLE.meta_description, ARTICLE.focus_keyword);

  console.log('\n=== KLART ===');
  console.log(`Artikel publicerad: ${post.link}`);
  console.log(`Titel: ${ARTICLE.title}`);
  console.log(`Fokuskeyword: ${ARTICLE.focus_keyword}`);
  console.log('\nUppdatera memory/kund_searchboost_tasks.md med länken ovan.');
}

main().catch(err => {
  console.error('FEL:', err.message);
  process.exit(1);
});
