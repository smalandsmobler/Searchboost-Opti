#!/usr/bin/env node
/**
 * Publicerar "Scenpodium för utomhusevenemang — checklista inför sommaren 2026"
 * till ilmonte.se via WordPress REST API.
 *
 * Kör detta skript på EC2 (där SSM-credentials finns tillgängliga via IAM-rollen):
 *   node scripts/publish-ilmonte-utomhusevenemang.js
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
  path.join(__dirname, '../content-pages/ilmonte-scenpodium-utomhusevenemang-checklista.html'),
  'utf8'
);

const ARTICLE = {
  title: 'Scenpodium för utomhusevenemang — komplett checklista inför sommaren 2026',
  slug: 'scenpodium-utomhusevenemang-checklista-sommaren-2026',
  status: 'publish',
  category_id: 1068,
  focus_keyword: 'scenpodium utomhus',
  meta_title: 'Scenpodium för utomhusevenemang — checklista inför sommaren 2026 | Ilmonte',
  meta_description: 'Planerar du ett utomhusevenemang sommaren 2026? Vår checklista hjälper dig välja rätt scenpodium — material, säkerhetskrav, förankring och logistik för festival, konsert och skolavslutning.',
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
  console.log('\n=== Publicerar ilmonte-artikel: Scenpodium för utomhusevenemang ===\n');

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
  console.log('\nÖvriga väntande ilmonte-artiklar:');
  console.log('  node scripts/publish-ilmonte-hyra-kopa-scenpodium.js');
  console.log('  node scripts/publish-ilmonte-kopa-scenpodium-2026.js');
}

main().catch(err => {
  console.error('Fel:', err.message);
  process.exit(1);
});
