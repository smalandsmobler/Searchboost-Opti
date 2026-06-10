#!/usr/bin/env node
/**
 * Publicerar sandgjutning-guiden till traficator.se via WordPress REST API.
 * Kör detta skript på EC2 (där SSM-credentials finns tillgängliga).
 *
 * Körs med:  node scripts/publish-traficator-sandgjutning.js
 *
 * Kräver: @aws-sdk/client-ssm, axios (installerade i mcp-server-code/node_modules)
 *
 * OBS: WP REST gav 500 vid tidigare kontakt — kontrollera att app-password är satt
 *      i SSM /seo-mcp/wordpress/traficator/app-password (ej "placeholder").
 * OBS: Kategori-ID är satt till 1 (Okategoriserade). Kontrollera rätt kategori-ID
 *      i traficator.se/wp-admin/edit-tags.php?taxonomy=category och justera nedan.
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
  title: 'Sandgjutning — komplett guide 2026: metod, material och tillämpningar',
  slug: 'sandgjutning-guide-2026',
  status: 'publish',
  category_id: 1,   // OBS: Verifiera rätt kategori-ID i traficator.se/wp-admin
  focus_keyword: 'sandgjutning',
  meta_title: 'Sandgjutning — komplett guide 2026 | Traficator',
  meta_description: 'Lär dig allt om sandgjutning: hur processen fungerar steg för steg, vilka material som passar, fördelar, begränsningar och när sandgjutning är rätt val. Guide från Traficator.',
  content: fs.readFileSync(
    path.join(__dirname, '../content-pages/traficator-sandgjutning-guide-2026.html'),
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
  console.log('=== Traficator Sandgjutning-guide Publicering ===\n');

  // 1. Hämta WP-credentials
  console.log('1. Hämtar WP-credentials från SSM...');
  const site = await getWordPressSite('traficator');
  if (!site.url || !site.username || !site['app-password']) {
    throw new Error(`Saknar credentials för traficator. Hittade: ${JSON.stringify(Object.keys(site))}`);
  }
  if (site['app-password'] === 'placeholder') {
    throw new Error(
      'traficator har placeholder-lösenord.\n' +
      'Generera ett Application Password i WP-admin → Användare → Din profil → Application Passwords.\n' +
      'Spara sedan i SSM: aws ssm put-parameter --name /seo-mcp/wordpress/traficator/app-password --value "XXXX XXXX XXXX" --type SecureString --overwrite --region eu-north-1'
    );
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
  console.log('\nUppdatera memory/kund_traficator_tasks.md med länken ovan.');
}

main().catch(err => {
  console.error('FEL:', err.message);
  process.exit(1);
});
