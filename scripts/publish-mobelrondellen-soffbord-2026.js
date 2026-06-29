#!/usr/bin/env node
/**
 * Publicerar "Soffbord guide 2026"-artikeln till mobelrondellen.se via WordPress REST API.
 * Kör detta skript på EC2 (där SSM-credentials finns tillgängliga).
 *
 * Körs med:  node scripts/publish-mobelrondellen-soffbord-2026.js
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

const ARTICLE = {
  title: 'Soffbord guide 2026 — så väljer du rätt modell till ditt vardagsrum',
  slug: 'soffbord-guide-2026',
  status: 'publish',
  focus_keyword: 'soffbord guide',
  meta_title: 'Soffbord guide 2026 — välj rätt storlek, höjd och material | Möbelrondellen',
  meta_description: 'Funderar du på att köpa soffbord? Vår guide 2026 hjälper dig välja rätt storlek, höjd, material och form — för ett snyggt och funktionellt vardagsrum.',
  content: fs.readFileSync(
    path.join(__dirname, '../content-pages/mobelrondellen-soffbord-guide-2026.html'),
    'utf8'
  )
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/^[\s\S]*<body[^>]*>/i, '')
    .replace(/<\/body>[\s\S]*$/i, '')
    .replace(/<article>/gi, '')
    .replace(/<\/article>/gi, '')
    .trim()
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
  return site;
}

function authHeader(site) {
  return Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
}

async function wpGet(site, endpoint) {
  const res = await axios({
    method: 'GET',
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: { Authorization: `Basic ${authHeader(site)}` },
    timeout: 15000
  });
  return res.data;
}

async function wpPost(site, endpoint, data) {
  const res = await axios({
    method: 'POST',
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: {
      Authorization: `Basic ${authHeader(site)}`,
      'Content-Type': 'application/json'
    },
    data,
    timeout: 30000
  });
  return res.data;
}

async function findBlogCategory(site) {
  try {
    const categories = await wpGet(site, '/categories?per_page=50');
    const preferred = ['blogg', 'blog', 'guider', 'inspiration'];
    for (const pref of preferred) {
      const match = categories.find(c => c.slug === pref || c.name.toLowerCase() === pref);
      if (match) {
        console.log(`  ✓ Kategorin "${match.name}" hittad (ID: ${match.id})`);
        return match.id;
      }
    }
    console.log('  ⚠ Ingen blogg-kategori hittad — använder Uncategorized (ID 1)');
    return 1;
  } catch (err) {
    console.log(`  ⚠ Kunde inte hämta kategorier: ${err.message} — använder ID 1`);
    return 1;
  }
}

async function updateRankMath(site, postId, metaTitle, metaDesc, focusKeyword) {
  const auth = authHeader(site);
  try {
    await axios({
      method: 'POST',
      url: `${site.url}/wp-json/rankmath/v1/updateMeta`,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      data: {
        objectID: postId,
        objectType: 'post',
        title: metaTitle,
        description: metaDesc,
        focusKeyword
      },
      timeout: 15000
    });
    console.log('  ✓ Rank Math meta uppdaterad');
  } catch (err) {
    console.log('  ⚠ Rank Math REST misslyckades, försöker via post meta...');
    try {
      await wpPost(site, `/posts/${postId}`, {
        meta: {
          rank_math_title: metaTitle,
          rank_math_description: metaDesc,
          rank_math_focus_keyword: focusKeyword
        }
      });
      console.log('  ✓ Rank Math meta via post meta uppdaterad');
    } catch (err2) {
      console.log(`  ⚠ Rank Math meta kunde inte uppdateras: ${err2.message}`);
    }
  }
}

// ── Huvudflöde ──────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Möbelrondellen — Soffbord guide 2026 — Publicering ===\n');

  // 1. Hämta WP-credentials
  console.log('1. Hämtar WP-credentials från SSM...');
  const site = await getWordPressSite('mobelrondellen');
  if (!site.url || !site.username || !site['app-password']) {
    throw new Error(`Saknar credentials för mobelrondellen. Hittade: ${JSON.stringify(Object.keys(site))}`);
  }
  if (site['app-password'] === 'placeholder') {
    throw new Error('mobelrondellen har placeholder-lösenord. Generera ett Application Password i WP-admin.');
  }
  console.log(`  ✓ Sajt: ${site.url}, Användare: ${site.username}`);

  // 2. Kontrollera dubletter
  console.log('2. Kontrollerar om artikel redan existerar...');
  const existing = await wpGet(site, `/posts?slug=${ARTICLE.slug}&status=any`);
  if (existing.length > 0) {
    console.log(`  ⚠ Artikel med slug "${ARTICLE.slug}" finns redan (ID: ${existing[0].id})`);
    console.log('  Avbryter — uppdatera manuellt om ändringar önskas.');
    return;
  }
  console.log('  ✓ Ingen dubblett hittad');

  // 3. Hitta rätt kategori
  console.log('3. Söker blogg-kategori...');
  const categoryId = await findBlogCategory(site);

  // 4. Publicera artikel
  console.log('4. Publicerar artikel till WordPress...');
  const post = await wpPost(site, '/posts', {
    title: ARTICLE.title,
    slug: ARTICLE.slug,
    content: ARTICLE.content,
    status: ARTICLE.status,
    categories: [categoryId],
    comment_status: 'open',
    ping_status: 'closed'
  });
  console.log(`  ✓ Publicerad! Post ID: ${post.id}`);
  console.log(`  URL: ${post.link}`);

  // 5. Uppdatera Rank Math SEO-meta
  console.log('5. Uppdaterar Rank Math SEO-meta...');
  await updateRankMath(
    site,
    post.id,
    ARTICLE.meta_title,
    ARTICLE.meta_description,
    ARTICLE.focus_keyword
  );

  console.log('\n=== KLART ===');
  console.log(`Artikel publicerad: ${post.link}`);
  console.log(`Titel: ${ARTICLE.title}`);
  console.log(`Fokuskeyword: ${ARTICLE.focus_keyword}`);
  console.log('\nUppdatera memory/kund_mobelrondellen_tasks.md med länken ovan.');
}

main().catch(err => {
  console.error('FEL:', err.message);
  process.exit(1);
});
