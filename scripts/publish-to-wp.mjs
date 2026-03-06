#!/usr/bin/env node
/**
 * publish-to-wp.js
 * Publicerar alla HTML-sidor från content-pages/ till WordPress på searchboost.se
 * + genererar sitemap.xml efter publicering
 *
 * Kör: WP_USER=searchboost WP_PASS="xxxx xxxx xxxx" node scripts/publish-to-wp.js
 * Test: DRY_RUN=1 WP_USER=x WP_PASS=x node scripts/publish-to-wp.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const WP_URL  = process.env.WP_URL  || 'https://searchboost.se';
const WP_USER = process.env.WP_USER || '';
const WP_PASS = process.env.WP_PASS || '';
const DRY_RUN = process.env.DRY_RUN === '1';

if (!DRY_RUN && (!WP_USER || !WP_PASS)) {
  console.error('Fel: Sätt WP_USER och WP_PASS som miljövariabler.');
  process.exit(1);
}

const AUTH = Buffer.from(`${WP_USER}:${WP_PASS}`).toString('base64');
const CONTENT_DIR = path.join(__dirname, '..', 'content-pages');

// === Sidkarta ===
const PAGES = [
  // SEO-skola
  { file: 'seo-skola/vad-ar-seo.html',                   slug: 'vad-ar-seo',                parent: 'seo-skola' },
  { file: 'seo-skola/hur-fungerar-google.html',           slug: 'hur-fungerar-google',        parent: 'seo-skola' },
  { file: 'seo-skola/rankingfaktorer.html',               slug: 'rankingfaktorer',            parent: 'seo-skola' },
  { file: 'seo-skola/nyckelordsforskning.html',           slug: 'nyckelordsforskning',        parent: 'seo-skola' },
  { file: 'seo-skola/teknisk-seo.html',                   slug: 'teknisk-seo',                parent: 'seo-skola' },
  { file: 'seo-skola/seo-texter.html',                    slug: 'seo-texter',                 parent: 'seo-skola' },
  { file: 'seo-skola/lankbygge.html',                     slug: 'lankbygge',                  parent: 'seo-skola' },
  { file: 'seo-skola/lokal-seo.html',                     slug: 'lokal-seo',                  parent: 'seo-skola' },
  { file: 'seo-skola/mobile-seo.html',                    slug: 'mobile-seo',                 parent: 'seo-skola' },
  { file: 'seo-skola/page-speed-core-web-vitals.html',    slug: 'page-speed-core-web-vitals', parent: 'seo-skola' },
  { file: 'seo-skola/schema-markup.html',                 slug: 'schema-markup',              parent: 'seo-skola' },
  { file: 'seo-skola/interna-lankar.html',                slug: 'interna-lankar',             parent: 'seo-skola' },
  { file: 'seo-skola/content-gaps.html',                  slug: 'content-gaps',               parent: 'seo-skola' },
  { file: 'seo-skola/domain-authority.html',              slug: 'domain-authority',           parent: 'seo-skola' },
  { file: 'seo-skola/google-search-console.html',         slug: 'google-search-console',      parent: 'seo-skola' },
  { file: 'seo-skola/google-business-profile.html',       slug: 'google-business-profile',    parent: 'seo-skola' },
  { file: 'seo-skola/lokala-citationer.html',             slug: 'lokala-citationer',          parent: 'seo-skola' },
  { file: 'seo-skola/seo-vs-sem.html',                    slug: 'seo-vs-sem',                 parent: 'seo-skola' },
  { file: 'seo-skola/vad-kostar-seo.html',                slug: 'vad-kostar-seo',             parent: 'seo-skola' },
  { file: 'seo-skola/hur-lang-tid-tar-seo.html',          slug: 'hur-lang-tid-tar-seo',       parent: 'seo-skola' },
  { file: 'seo-skola/seo-strategi-smaforetag.html',       slug: 'seo-strategi-smaforetag',    parent: 'seo-skola' },
  { file: 'seo-skola/seo-rapportering.html',              slug: 'seo-rapportering',           parent: 'seo-skola' },
  { file: 'seo-skola/wordpress-seo.html',                 slug: 'wordpress-seo',              parent: 'seo-skola' },
  { file: 'seo-skola/varfor-seo-2026.html',               slug: 'varfor-seo-2026',            parent: 'seo-skola' },
  { file: 'seo-skola/title-meta-description.html',        slug: 'title-meta-description',     parent: 'seo-skola' },
  // Tjänster
  { file: 'tjanster/seo-audit-tjanst.html',               slug: 'seo-audit',                  parent: 'tjanster' },
  { file: 'tjanster/lokal-seo.html',                      slug: 'lokal-seo-tjanst',           parent: 'tjanster' },
  { file: 'tjanster/e-handel-seo.html',                   slug: 'e-handel-seo',               parent: 'tjanster' },
  // Lokala
  { file: 'lokala/seo-byra-linkoping.html',               slug: 'seo-byra-linkoping',         parent: '' },
  { file: 'lokala/seo-byra-norrkoping.html',              slug: 'seo-byra-norrkoping',        parent: '' },
  { file: 'lokala/seo-byra-jonkoping.html',               slug: 'seo-byra-jonkoping',         parent: '' },
  { file: 'lokala/seo-byra-vaxjo.html',                   slug: 'seo-byra-vaxjo',             parent: '' },
  { file: 'lokala/seo-byra-varnamo.html',                 slug: 'seo-byra-varnamo',           parent: '' },
  { file: 'lokala/seo-byra-halmstad.html',                slug: 'seo-byra-halmstad',          parent: '' },
  { file: 'lokala/seo-byra-kalmar.html',                  slug: 'seo-byra-kalmar',            parent: '' },
  // Case studies
  { file: 'case-studies/ehandel-kontorsmobler.html',      slug: 'ehandel-kontorsmobler',      parent: 'case-studies' },
  { file: 'case-studies/konsultforetag-seo.html',         slug: 'konsultforetag-seo',         parent: 'case-studies' },
  { file: 'case-studies/mobelforetag-smaland.html',       slug: 'mobelforetag-smaland',       parent: 'case-studies' },
  // FAQ + ordlista
  { file: 'faq/vanliga-fragor.html',                      slug: 'vanliga-fragor-om-seo',      parent: '' },
  { file: 'ordlista/seo-ordlista.html',                   slug: 'seo-ordlista',               parent: '' },
];

// === Hjälpfunktioner ===

function extractMeta(html) {
  const titleMatch    = html.match(/<title>([^<]+)<\/title>/i);
  const descMatch     = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const bodyMatch     = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

  return {
    title:   titleMatch  ? titleMatch[1].trim()  : '',
    desc:    descMatch   ? descMatch[1].trim()   : '',
    content: bodyMatch   ? bodyMatch[1].trim()   : html,
  };
}

async function getOrCreateParent(parentSlug) {
  if (!parentSlug) return 0;

  // Kolla om föräldrasidan redan finns
  const res = await fetch(`${WP_URL}/wp-json/wp/v2/pages?slug=${parentSlug}&per_page=1`, {
    headers: { Authorization: `Basic ${AUTH}` },
  });
  const pages = await res.json();
  if (pages.length > 0) return pages[0].id;

  // Skapa föräldrasidan
  const parentTitles = {
    'seo-skola':     'SEO-skola',
    'tjanster':      'Tjänster',
    'case-studies':  'Case studies',
  };

  console.log(`  Skapar föräldrasida: ${parentSlug}`);
  const create = await fetch(`${WP_URL}/wp-json/wp/v2/pages`, {
    method: 'POST',
    headers: {
      Authorization:  `Basic ${AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title:  parentTitles[parentSlug] || parentSlug,
      slug:   parentSlug,
      status: 'publish',
    }),
  });
  const created = await create.json();
  return created.id;
}

async function publishPage(page, parentId) {
  const filePath = path.join(CONTENT_DIR, page.file);
  if (!fs.existsSync(filePath)) {
    console.warn(`  VARNING: Fil saknas — ${page.file}`);
    return null;
  }

  const html            = fs.readFileSync(filePath, 'utf8');
  const { title, desc, content } = extractMeta(html);

  if (DRY_RUN) {
    console.log(`  [DRY RUN] ${page.slug} — "${title}"`);
    return { id: 0, link: `${WP_URL}/${page.slug}/` };
  }

  // Kolla om sidan redan finns (uppdatera isfall)
  const check = await fetch(`${WP_URL}/wp-json/wp/v2/pages?slug=${page.slug}&per_page=1`, {
    headers: { Authorization: `Basic ${AUTH}` },
  });
  const existing = await check.json();

  const payload = {
    title:   title,
    slug:    page.slug,
    content: content,
    status:  'publish',
    parent:  parentId,
    meta:    { _yoast_wpseo_metadesc: desc, rank_math_description: desc },
  };

  let result;
  if (existing.length > 0) {
    console.log(`  Uppdaterar: ${page.slug}`);
    const upd = await fetch(`${WP_URL}/wp-json/wp/v2/pages/${existing[0].id}`, {
      method: 'PUT',
      headers: { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    result = await upd.json();
  } else {
    console.log(`  Publicerar: ${page.slug}`);
    const pub = await fetch(`${WP_URL}/wp-json/wp/v2/pages`, {
      method: 'POST',
      headers: { Authorization: `Basic ${AUTH}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    result = await pub.json();
  }

  return result;
}

// === Sitemap-generering ===

function generateSitemap(publishedUrls) {
  const today = new Date().toISOString().split('T')[0];

  const urlEntries = publishedUrls.map(({ url, priority, changefreq }) => `
  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq || 'monthly'}</changefreq>
    <priority>${priority || '0.7'}</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

// === Ladda upp sitemap via WP Media API ===

async function uploadSitemap(xmlContent) {
  console.log('\nLaddar upp sitemap.xml till WordPress...');

  const blob = Buffer.from(xmlContent, 'utf8');

  const res = await fetch(`${WP_URL}/wp-json/wp/v2/media`, {
    method: 'POST',
    headers: {
      Authorization:               `Basic ${AUTH}`,
      'Content-Disposition':       'attachment; filename="sitemap-seo-skola.xml"',
      'Content-Type':              'application/xml',
    },
    body: blob,
  });

  if (!res.ok) {
    console.warn('  Media-upload misslyckades — sparar lokalt istället');
    return null;
  }

  const media = await res.json();
  return media.source_url;
}

// === Spara sitemap lokalt ===

function saveSitemapLocally(xmlContent) {
  const outPath = path.join(__dirname, '..', 'sitemap-seo-skola.xml');
  fs.writeFileSync(outPath, xmlContent, 'utf8');
  console.log(`  Sitemap sparad lokalt: ${outPath}`);
  return outPath;
}

// === llm.txt-generering ===
// Spec: https://llmstxt.org — kort Markdown-fil i WP-roten som AI-crawlers läser

function generateLlmTxt(publishedPages) {
  const today = new Date().toISOString().split('T')[0];

  const seoSkola    = publishedPages.filter(p => p.url.includes('/seo-skola/'));
  const tjanster    = publishedPages.filter(p => p.url.includes('/tjanster/'));
  const lokala      = publishedPages.filter(p => p.url.includes('/seo-byra-'));
  const caseStudies = publishedPages.filter(p => p.url.includes('/case-studies/'));
  const ovrigt      = publishedPages.filter(p =>
    !p.url.includes('/seo-skola/') &&
    !p.url.includes('/tjanster/') &&
    !p.url.includes('/seo-byra-') &&
    !p.url.includes('/case-studies/')
  );

  const formatLinks = (pages) =>
    pages.map(p => {
      const slug = p.url.replace(WP_URL, '').replace(/\/$/, '');
      const label = slug.split('/').pop().replace(/-/g, ' ');
      return `- [${label}](${p.url})`;
    }).join('\n');

  const content = `# Searchboost

> Sveriges SEO-byrå för småföretag. Vi hjälper lokala företag att synas på Google genom teknisk SEO, innehållsoptimering och länkbygge. Kontraktsbaserad tjänst från 3 500 kr/mån.

Searchboost grundades av Mikael Larsson och erbjuder helhetslösningar inom sökmotoroptimering. Vi kombinerar manuellt SEO-arbete med AI-driven automatisering för att leverera mätbara resultat.

Webbplats: ${WP_URL}
Kontakt: mikael@searchboost.se
Uppdaterad: ${today}

## Tjänster

${formatLinks(tjanster.length ? tjanster : [
  { url: `${WP_URL}/tjanster/seo-audit/` },
  { url: `${WP_URL}/tjanster/lokal-seo-tjanst/` },
  { url: `${WP_URL}/tjanster/e-handel-seo/` },
])}

## SEO-skola

Gratis utbildningsmaterial om sökmotoroptimering för företagare och marknadsförare.

${formatLinks(seoSkola)}

## Lokala SEO-byråer

${formatLinks(lokala)}

## Case studies

${formatLinks(caseStudies)}

## Övrigt

${formatLinks(ovrigt)}

## Optional

- [Vanliga frågor om SEO](${WP_URL}/vanliga-fragor-om-seo/)
- [SEO-ordlista](${WP_URL}/seo-ordlista/)
- [Om oss](${WP_URL}/om-oss/)
- [Kontakt](${WP_URL}/kontakt/)
`;

  const outPath = path.join(__dirname, '..', 'llm.txt');
  fs.writeFileSync(outPath, content, 'utf8');
  console.log(`  llm.txt sparad: ${outPath}`);
  console.log(`  Ladda upp till WP-roten via FTP så den når ${WP_URL}/llm.txt`);
  return outPath;
}

// === Main ===

async function main() {
  console.log(`\n=== Searchboost Publish-to-WP ===`);
  console.log(`Mål: ${WP_URL}`);
  console.log(`Sidor: ${PAGES.length}`);
  if (DRY_RUN) console.log('LÄGE: DRY RUN — ingenting publiceras\n');
  else console.log('');

  const published = [];
  const failed    = [];

  // Cache för parent-ID:n så vi inte slår upp samma flera gånger
  const parentCache = {};

  for (const page of PAGES) {
    try {
      // Hämta/skapa föräldra-ID
      if (!(page.parent in parentCache)) {
        parentCache[page.parent] = await getOrCreateParent(page.parent);
      }
      const parentId = parentCache[page.parent];

      const result = await publishPage(page, parentId);

      if (result) {
        const url = result.link || `${WP_URL}/${page.slug}/`;
        published.push({
          url,
          priority:   page.parent === 'seo-skola' ? '0.8' : page.parent === '' ? '0.9' : '0.7',
          changefreq: 'monthly',
        });
      }
    } catch (err) {
      console.error(`  FEL: ${page.slug} — ${err.message}`);
      failed.push(page.slug);
    }

    // Kort paus för att inte hammra WP-servern
    await new Promise(r => setTimeout(r, 300));
  }

  // Sammanfattning
  console.log(`\n=== Klar ===`);
  console.log(`Publicerade: ${published.length}/${PAGES.length}`);
  if (failed.length > 0) console.log(`Misslyckades: ${failed.join(', ')}`);

  // Lägg till extra viktiga sidor i sitemapen (startsida, kontakt etc)
  const allUrls = [
    { url: `${WP_URL}/`,                  priority: '1.0', changefreq: 'weekly'  },
    { url: `${WP_URL}/seo-tjanster/`,     priority: '0.9', changefreq: 'monthly' },
    { url: `${WP_URL}/om-oss/`,           priority: '0.8', changefreq: 'monthly' },
    { url: `${WP_URL}/kontakt/`,          priority: '0.8', changefreq: 'monthly' },
    { url: `${WP_URL}/seo-skola/`,        priority: '0.9', changefreq: 'weekly'  },
    { url: `${WP_URL}/case-studies/`,     priority: '0.8', changefreq: 'monthly' },
    { url: `${WP_URL}/tjanster/`,         priority: '0.9', changefreq: 'monthly' },
    ...published,
  ];

  // Generera sitemap
  const sitemapXml = generateSitemap(allUrls);

  // Spara alltid lokalt
  const localPath = saveSitemapLocally(sitemapXml);

  // Generera llm.txt
  generateLlmTxt(published);

  // Ladda upp till WP om inte dry run
  if (!DRY_RUN) {
    const mediaUrl = await uploadSitemap(sitemapXml);
    if (mediaUrl) {
      console.log(`  Sitemap live: ${mediaUrl}`);
    } else {
      console.log(`  Tips: Ladda upp ${localPath} manuellt till WP-roten via FTP`);
      console.log(`  Eller låt Rank Math/Yoast generera sin egen sitemap (rekommenderas)`);
    }
  }

  console.log(`\nKlart! ${published.length} sidor live på ${WP_URL}`);
}

main().catch(err => {
  console.error('Oväntat fel:', err);
  process.exit(1);
});
