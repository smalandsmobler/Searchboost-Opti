#!/usr/bin/env node
/**
 * Publicerar "Utemöbler 2026 — vad håller i Dalarnas klimat?" till mobelrondellen.se
 * via WordPress REST API + Rank Math SEO-meta.
 *
 * Körs på EC2 (IAM-rollen ger SSM-åtkomst):
 *   node scripts/publish-mobelrondellen-utemobler-dalarna-2026.js
 *
 * Kräver: @aws-sdk/client-ssm, axios (i mcp-server-code/node_modules)
 */

const path = require('path');
const fs   = require('fs');

const { SSMClient, GetParametersByPathCommand } = require(
  path.join(__dirname, '../mcp-server-code/node_modules/@aws-sdk/client-ssm')
);
const axios = require(
  path.join(__dirname, '../mcp-server-code/node_modules/axios')
);

const REGION = 'eu-north-1';
const ssm    = new SSMClient({ region: REGION });

// ── Artikelinnehåll ──────────────────────────────────────────────────────────

function extractBodyContent(html) {
  const match = html.match(/<article>([\s\S]*)<\/article>/i);
  return match ? match[1].trim() : html;
}

const rawHtml = fs.readFileSync(
  path.join(__dirname, '../content-pages/mobelrondellen-utemobler-dalarna-2026.html'),
  'utf8'
);

const ARTICLE = {
  title:            'Utemöbler 2026 — vad håller i Dalarnas klimat?',
  slug:             'utemobler-2026-dalarna-klimat',
  status:           'publish',
  category_id:      1,            // Standard "Okategoriserade" — justera om mobelrondellen har bloggkategori-ID
  focus_keyword:    'utemöbler Dalarna',
  meta_title:       'Utemöbler 2026 — vad håller i Dalarnas klimat? | Möbelrondellen',
  meta_description: 'Vilka utemöbler klarar Dalarnas kalla vintrar, snö och stora temperaturskillnader? Vi guidar dig till rätt material och skötsel — så att din uteplatsmöblering håller i många år.',
  content:          extractBodyContent(rawHtml),
};

// ── Hjälpfunktioner ──────────────────────────────────────────────────────────

async function getWordPressSite(siteId) {
  const res = await ssm.send(new GetParametersByPathCommand({
    Path: `/seo-mcp/wordpress/${siteId}/`,
    Recursive:       true,
    WithDecryption:  true,
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

async function wpGet(site, endpoint) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res  = await axios({
    method:  'GET',
    url:     `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { Authorization: `Basic ${auth}` },
  });
  return res.data;
}

async function wpPost(site, endpoint, data) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res  = await axios({
    method:  'POST',
    url:     `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    data,
  });
  return res.data;
}

async function wpPut(site, endpoint, data) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res  = await axios({
    method:  'PUT',
    url:     `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    data,
  });
  return res.data;
}

async function findBlogCategory(site) {
  try {
    const cats = await wpGet(site, '/categories?per_page=50&search=blogg');
    if (cats.length > 0) {
      console.log(`  Hittade bloggkategori: "${cats[0].name}" (ID: ${cats[0].id})`);
      return cats[0].id;
    }
  } catch (_) {}
  console.log('  Ingen bloggkategori funnen — publicerar utan kategori');
  return undefined;
}

// ── Rank Math meta ───────────────────────────────────────────────────────────

async function updateRankMath(site, postId) {
  console.log('  Uppdaterar Rank Math meta...');
  try {
    await wpPut(site, `/posts/${postId}`, {
      meta: {
        rank_math_title:         ARTICLE.meta_title,
        rank_math_description:   ARTICLE.meta_description,
        rank_math_focus_keyword: ARTICLE.focus_keyword,
        rank_math_seo_score:     '',
      },
    });
    console.log('  ✓ Rank Math meta uppdaterat');
  } catch (err) {
    console.warn('  ⚠ Rank Math-uppdatering misslyckades (ej kritiskt):', err.message);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Publicerar mobelrondellen-artikel: Utemöbler 2026 — Dalarna ===\n');

  console.log('Hämtar credentials från SSM...');
  const site = await getWordPressSite('mobelrondellen');
  console.log(`✓ Site: ${site.url}`);

  const categoryId = await findBlogCategory(site);
  const postBody   = {
    title:      ARTICLE.title,
    slug:       ARTICLE.slug,
    content:    ARTICLE.content,
    status:     ARTICLE.status,
    ...(categoryId ? { categories: [categoryId] } : {}),
  };

  const existing = await wpGet(site, `/posts?slug=${ARTICLE.slug}&per_page=1`);

  let post;
  if (existing.length > 0) {
    console.log(`Artikeln finns redan (ID: ${existing[0].id}) — uppdaterar...`);
    post = await wpPut(site, `/posts/${existing[0].id}`, postBody);
  } else {
    console.log('Publicerar ny artikel...');
    post = await wpPost(site, '/posts', postBody);
  }

  console.log(`✓ Artikel publicerad: ${post.link}`);
  console.log(`  Post ID: ${post.id}`);

  await updateRankMath(site, post.id);

  console.log('\n=== Klart! ===');
  console.log(`URL: ${post.link}`);
  console.log('\nKom ihåg att uppdatera memory/kund_mobelrondellen_tasks.md med artikellänken.');
}

main().catch(err => {
  console.error('Fel:', err.message);
  process.exit(1);
});
