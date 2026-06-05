#!/usr/bin/env node
/**
 * Publicerar "Skyddsräcke på byggställning — regler, typer och rätt montering" till tobler.se
 * via WordPress REST API + Rank Math SEO-meta.
 *
 * Körs på EC2 (IAM-rollen ger SSM-åtkomst):
 *   node scripts/publish-tobler-skyddsracke.js
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
const ssm = new SSMClient({ region: REGION });

// ── Artikeldata ──────────────────────────────────────────────────────────────

const rawHtml = fs.readFileSync(
  path.join(__dirname, '../content-pages/tobler-skyddsracke-byggstallning.html'),
  'utf8'
);

function extractArticleBody(html) {
  const match = html.match(/<article>([\s\S]*?)<\/article>/i);
  return match ? match[1].trim() : html;
}

const ARTICLE = {
  title:            'Skyddsräcke på byggställning — regler, typer och rätt montering',
  slug:             'skyddsracke-byggstallning-regler-typer-montering',
  status:           'publish',
  category_id:      249,   // Branschkunskap
  focus_keyword:    'skyddsräcke byggställning',
  meta_title:       'Skyddsräcke på byggställning — regler, typer och montering | Tobler',
  meta_description: 'Vilka krav gäller för skyddsräcke på byggställning? Vi går igenom AFS 2013:4, räckestyper och steg-för-steg-montering för ett godkänt fallskydd.',
  content:          extractArticleBody(rawHtml),
};

// ── SSM-helpers ──────────────────────────────────────────────────────────────

async function getSiteCredentials(siteId) {
  const res = await ssm.send(new GetParametersByPathCommand({
    Path:           `/seo-mcp/wordpress/${siteId}/`,
    Recursive:      true,
    WithDecryption: true,
  }));
  const site = { id: siteId };
  for (const p of (res.Parameters || [])) {
    const key = p.Name.split('/').pop();
    site[key] = p.Value;
  }
  if (!site.url || !site.username || !site['app-password']) {
    throw new Error(`Saknar WP-credentials för "${siteId}" i SSM`);
  }
  return site;
}

function basicAuth(site) {
  return Buffer.from(`${site.username}:${site['app-password']}`).toString('base64');
}

// ── WordPress REST-helpers ───────────────────────────────────────────────────

async function wpRequest(method, site, endpoint, data) {
  const res = await axios({
    method,
    url:     `${site.url}/wp-json/wp/v2${endpoint}`,
    headers: {
      Authorization:  `Basic ${basicAuth(site)}`,
      'Content-Type': 'application/json',
    },
    data,
    timeout: 20000,
  });
  return res.data;
}

async function findPostBySlug(site, slug) {
  try {
    const posts = await wpRequest('GET', site, `/posts?slug=${slug}&per_page=1`, null);
    return posts.length > 0 ? posts[0] : null;
  } catch {
    return null;
  }
}

async function updateRankMath(site, postId, meta) {
  return wpRequest('POST', site, `/posts/${postId}`, {
    meta: {
      rank_math_focus_keyword:    meta.focus_keyword,
      rank_math_title:            meta.meta_title,
      rank_math_description:      meta.meta_description,
    },
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Tobler — Publicerar skyddsräcke-artikel ===\n');

  const site = await getSiteCredentials('tobler');
  console.log(`Sajt: ${site.url}`);

  const existing = await findPostBySlug(site, ARTICLE.slug);

  let post;
  if (existing) {
    console.log(`Uppdaterar befintligt inlägg (ID: ${existing.id})`);
    post = await wpRequest('POST', site, `/posts/${existing.id}`, {
      title:      ARTICLE.title,
      content:    ARTICLE.content,
      status:     ARTICLE.status,
      categories: [ARTICLE.category_id],
    });
  } else {
    console.log('Skapar nytt inlägg...');
    post = await wpRequest('POST', site, '/posts', {
      title:      ARTICLE.title,
      slug:       ARTICLE.slug,
      content:    ARTICLE.content,
      status:     ARTICLE.status,
      categories: [ARTICLE.category_id],
    });
  }

  console.log(`\nPublicerat! ID: ${post.id}`);
  console.log(`URL: ${post.link}`);

  // Uppdatera Rank Math-meta
  console.log('\nSätter Rank Math SEO-meta...');
  await updateRankMath(site, post.id, ARTICLE);
  console.log('  focus_keyword:', ARTICLE.focus_keyword);
  console.log('  meta_title:   ', ARTICLE.meta_title);
  console.log('  meta_desc:    ', ARTICLE.meta_description.substring(0, 60) + '...');

  console.log('\n=== Klart ===');
  console.log('Artikel live:', post.link);
}

main().catch(err => {
  console.error('\nFEL:', err.message || err);
  process.exit(1);
});
