#!/usr/bin/env node
/**
 * Publicerar "Hyra eller köpa scenpodium?" till ilmonte.se via WordPress REST API.
 * Kör detta skript på EC2 (där SSM-credentials finns tillgängliga via IAM-rollen).
 *
 * Körs med:  node scripts/publish-ilmonte-hyra-kopa-scenpodium.js
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

// ── Artikelinnehåll ──────────────────────────────────────────────────────────

function extractBodyContent(html) {
  const match = html.match(/<article>([\s\S]*)<\/article>/i);
  return match ? match[1].trim() : html;
}

const rawHtml = fs.readFileSync(
  path.join(__dirname, '../content-pages/ilmonte-hyra-eller-kopa-scenpodium.html'),
  'utf8'
);

const ARTICLE = {
  title: 'Hyra eller köpa scenpodium? — 5 faktorer som avgör ditt val',
  slug: 'hyra-eller-kopa-scenpodium-5-faktorer',
  status: 'publish',
  category_id: 1068,   // Blogg på ilmonte.se
  focus_keyword: 'hyra eller köpa scenpodium',
  meta_title: 'Hyra eller köpa scenpodium? 5 avgörande faktorer | Ilmonte',
  meta_description: 'Ska du hyra eller köpa ett scenpodium? Vi går igenom 5 faktorer — kostnad, frekvens, lagring och kvalitet — så att du fattar rätt beslut för ditt event.',
  content: extractBodyContent(rawHtml)
};

// ── Hjälpfunktioner ──────────────────────────────────────────────────────────

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
  if (!site.url || !site.username || !site['app-password']) {
    throw new Error(`Saknar credentials för ${siteId} i SSM`);
  }
  return site;
}

async function wpPost(site, endpoint, data) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res = await axios({
    method: 'POST',
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    data,
  });
  return res.data;
}

async function wpGet(site, endpoint) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res = await axios({
    method: 'GET',
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.data;
}

async function wpPut(site, endpoint, data) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res = await axios({
    method: 'PUT',
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    data,
  });
  return res.data;
}

// ── Rank Math meta ───────────────────────────────────────────────────────────

async function updateRankMath(site, postId, article) {
  console.log('  Uppdaterar Rank Math meta...');
  try {
    await wpPut(site, `/posts/${postId}`, {
      meta: {
        rank_math_title: article.meta_title,
        rank_math_description: article.meta_description,
        rank_math_focus_keyword: article.focus_keyword,
        rank_math_seo_score: '',
      }
    });
    console.log('  ✓ Rank Math meta uppdaterat');
  } catch (err) {
    console.warn('  ⚠ Rank Math-uppdatering misslyckades (ej kritiskt):', err.message);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Publicerar ilmonte-artikel: Hyra eller köpa scenpodium? ===\n');

  // 1. Hämta credentials från SSM
  console.log('Hämtar credentials från SSM...');
  const site = await getWordPressSite('ilmonte');
  console.log(`✓ Site: ${site.url}`);

  // 2. Kolla om artikeln redan finns
  const existing = await wpGet(site, `/posts?slug=${ARTICLE.slug}&per_page=1`);

  let post;
  if (existing.length > 0) {
    console.log(`Artikeln finns redan (ID: ${existing[0].id}) — uppdaterar...`);
    post = await wpPut(site, `/posts/${existing[0].id}`, {
      title: ARTICLE.title,
      content: ARTICLE.content,
      status: ARTICLE.status,
      categories: [ARTICLE.category_id],
    });
  } else {
    console.log('Publicerar ny artikel...');
    post = await wpPost(site, '/posts', {
      title: ARTICLE.title,
      slug: ARTICLE.slug,
      content: ARTICLE.content,
      status: ARTICLE.status,
      categories: [ARTICLE.category_id],
    });
  }

  console.log(`✓ Artikel publicerad: ${post.link}`);
  console.log(`  Post ID: ${post.id}`);

  // 3. Uppdatera Rank Math
  await updateRankMath(site, post.id, ARTICLE);

  console.log('\n=== Klart! ===');
  console.log(`URL: ${post.link}`);
  console.log('\nKom ihåg att uppdatera memory/kund_ilmonte_tasks.md med artikellänken.');
}

main().catch(err => {
  console.error('Fel:', err.message);
  process.exit(1);
});
