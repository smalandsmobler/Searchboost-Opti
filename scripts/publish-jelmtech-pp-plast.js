#!/usr/bin/env node
/**
 * Publicerar PP-plast-artikeln till jelmtech.se via WordPress REST API.
 * Kör detta skript på EC2 (där SSM-credentials finns tillgängliga).
 *
 * Körs med:  node scripts/publish-jelmtech-pp-plast.js
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
  title: 'PP-plast formsprutning — komplett guide till polypropylen',
  slug: 'pp-plast-formsprutning-guide',
  status: 'publish',
  category_id: 48,   // Produktutveckling på jelmtech.se
  focus_keyword: 'PP plast formsprutning',
  meta_title: 'PP-plast formsprutning — egenskaper, parametrar och tillämpningar | Jelmtech',
  meta_description: 'Komplett guide till PP-plast (polypropylen): mekaniska egenskaper, smälttemperatur, svinn, levande gångjärn och när PP väljs framför ABS eller polyamid. Från Jelm techs formsprutningsexperter.',
  content: fs.readFileSync(
    path.join(__dirname, '../content-pages/jelmtech-pp-plast-formsprutning.html'),
    'utf8'
  ).replace(/<!--[\s\S]*?-->/g, '').trim()
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

async function wpPost(site, endpoint, data) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
  const res = await axios({
    method: 'POST',
    url: `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json'
    },
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

// ── Rank Math meta via REST ──────────────────────────────────────────────────

async function updateRankMath(site, postId, metaTitle, metaDesc, focusKeyword) {
  const auth = Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
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
      console.log('  ⚠ Rank Math meta kunde inte uppdateras:', err2.message);
    }
  }
}

// ── Huvudflöde ──────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Jelmtech PP-plast Publicering ===\n');

  // 1. Hämta WP-credentials
  console.log('1. Hämtar WP-credentials från SSM...');
  const site = await getWordPressSite('jelmtech');
  if (!site.url || !site.username || !site['app-password']) {
    throw new Error(`Saknar credentials för jelmtech. Hittade: ${JSON.stringify(Object.keys(site))}`);
  }
  if (site['app-password'] === 'placeholder') {
    throw new Error('jelmtech har placeholder-lösenord. Generera ett Application Password i WP-admin.');
  }
  console.log(`  ✓ Sajt: ${site.url}, Användare: ${site.username}`);

  // 2. Kolla om artikeln redan finns (undvik dubletter)
  console.log('2. Kontrollerar om artikel redan existerar...');
  const existing = await wpGet(site, `/posts?slug=${ARTICLE.slug}&status=any`);
  if (existing.length > 0) {
    console.log(`  ⚠ Artikel med slug "${ARTICLE.slug}" finns redan (ID: ${existing[0].id})`);
    console.log('  Avbryter — uppdatera manuellt om ändringar önskas.');
    return;
  }
  console.log('  ✓ Ingen dubblett hittad');

  // 3. Publicera artikel
  console.log('3. Publicerar artikel till WordPress...');
  const post = await wpPost(site, '/posts', {
    title: ARTICLE.title,
    slug: ARTICLE.slug,
    content: ARTICLE.content,
    status: ARTICLE.status,
    categories: [ARTICLE.category_id],
    comment_status: 'open',
    ping_status: 'closed'
  });
  console.log(`  ✓ Publicerad! Post ID: ${post.id}`);
  console.log(`  URL: ${post.link}`);

  // 4. Uppdatera Rank Math SEO-meta
  console.log('4. Uppdaterar Rank Math SEO-meta...');
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
  console.log('\nUppdatera memory/kund_jelmtech_tasks.md med länken ovan.');
}

main().catch(err => {
  console.error('FEL:', err.message);
  process.exit(1);
});
