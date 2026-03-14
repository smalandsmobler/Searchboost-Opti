#!/usr/bin/env node
'use strict';

/**
 * publish-to-wp.js — Publicerar alla searchboost.se sidor till WordPress
 *
 * ANVÄNDNING:
 *   node scripts/publish-to-wp.js                    # Dry run (förhandsgranskning)
 *   node scripts/publish-to-wp.js --publish          # Skapa sidor som utkast
 *   node scripts/publish-to-wp.js --publish --live   # Skapa sidor som publicerade
 *   node scripts/publish-to-wp.js --publish --update # Uppdatera befintliga sidor
 *   node scripts/publish-to-wp.js --slug=vad-ar-seo  # Bara en sida (kan kombineras)
 *
 * FÖRBEREDELSE:
 *   1. Gå till WP Admin → Användare → Redigera din profil → Application Passwords
 *   2. Skapa ett nytt Application Password, kopiera det
 *   3. Klistra in det som WP_APP_PASSWORD nedan (format: "xxxx xxxx xxxx xxxx xxxx xxxx")
 *   4. Kontrollera att searchboost.se svarar (lösa 403-problemet på Loopia)
 *
 * SIDSTRUKTUR I WORDPRESS:
 *   Varje HTML-sida innehåller sin egna nav + styles + footer.
 *   Använd ett "Blank" eller "Canvas" page template i WP för att stänga av
 *   temat egna header/footer. Annars dubblas navigationen.
 *
 * RANK MATH:
 *   SEO title, meta description och canonical sätts automatiskt via meta-fälten
 *   rank_math_title, rank_math_description, rank_math_canonical_url.
 *
 * INGA NPM-BEROENDEN — kör direkt med: node scripts/publish-to-wp.js
 */

const fs   = require('fs');
const path = require('path');
const https = require('https');
const http  = require('http');

// ============================================================
// KONFIGURATION — uppdatera innan du kör
// ============================================================

const CONFIG = {
  // WordPress-sajt
  wpUrl: 'https://searchboost.se',
  wpUser: 'mikael@searchboost.se',
  // Genererat 2026-03-05 — "Searchboost Opti" i WP Admin → Profil → Applikationslösenord
  wpAppPassword: 'wUC8 ZeLG ALOD KLMN S7Zc 7jMq',

  // Sökväg till HTML-filer (relativt detta script)
  contentDir: path.join(__dirname, '..', 'content-pages'),

  // WordPress page template för blank rendering (tema stänger av sin header/footer)
  // Divi blank template: 'page-template-blank.php' (döljer Divis header/footer)
  // Utan detta renderas sidan inuti Divi-wrappern → dubblad nav/footer
  pageTemplate: 'page-template-blank.php',

  // Fördröjning mellan API-anrop (ms) för att undvika rate limiting
  requestDelay: 400,

  // Sidor att skippa (kundprojekt / inte searchboost.se-sidor)
  skipFiles: [
    'smk-gdpr-cookie-jamforelse.html',
  ],

  // Föräldrasidor att skapa om de inte finns
  parentPageDefs: [
    { slug: 'tjanster',     title: 'Tjänster',  content: '<p>SEO-tjänster anpassade för ditt företag.</p>' },
    { slug: 'seo-skola',    title: 'SEO-skola', content: '<p>Gratis SEO-guider och kunskap från Searchboost.</p>' },
    { slug: 'case-studies', title: 'Resultat',  content: '<p>Case studies och kundresultat från Searchboost.</p>' },
  ],
};

// ============================================================
// CLI-FLAGGOR
// ============================================================

const args       = process.argv.slice(2);
const DRY_RUN    = !args.includes('--publish');
const GO_LIVE    = args.includes('--live');
const DO_UPDATE  = args.includes('--update');
const SLUG_FILTER = (args.find(a => a.startsWith('--slug=')) || '').replace('--slug=', '') || null;

// ============================================================
// HTML-PARSER (inga beroenden — ren regex)
// ============================================================

/**
 * Mappar lokala katalognamn till WP-föräldrasida slug (eller null = toppnivå).
 * Kataloger med null publiceras som toppnivåsidor (ingen WP parent).
 */
const DIR_TO_PARENT = {
  'tjanster':     'tjanster',
  'seo-skola':    'seo-skola',
  'case-studies': 'case-studies',
  'lokala':       null,   // seo-byra-*.html → toppnivå (/seo-byra-jonkoping/)
  'faq':          null,   // vanliga-fragor.html → toppnivå
  'ordlista':     null,   // seo-ordlista.html → toppnivå
};

/** Avkodar HTML-entiteter till ren text (för WP-titlar) */
function decodeHtmlEntities(str) {
  return str
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&auml;/g, 'ä').replace(/&Auml;/g, 'Ä')
    .replace(/&ouml;/g, 'ö').replace(/&Ouml;/g, 'Ö')
    .replace(/&aring;/g, 'å').replace(/&Aring;/g, 'Å')
    .replace(/&eacute;/g, 'é').replace(/&#\d+;/g, ''); // rensa övriga numeriska entiteter
}

/**
 * Läser en HTML-fil och extraherar all info som behövs för WP.
 * Returnerar null om filen är en kundprojektsida (inte searchboost.se).
 */
function parseHtmlFile(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');

  // <title>
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const rawTitle   = titleMatch ? titleMatch[1].trim() : path.basename(filePath, '.html');
  const fullTitle  = decodeHtmlEntities(rawTitle);
  // Rensa bort " | Searchboost" suffixet för WP page title
  const pageTitle  = fullTitle.replace(/\s*\|\s*Searchboost\s*$/i, '').trim();

  // Kontrollera att det verkar vara en Searchboost-sida (inte kundprojekt)
  if (!pageTitle || !html.includes('searchboost')) return null;

  // <meta name="description">
  const descMatch       = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const metaDescription = descMatch ? decodeHtmlEntities(descMatch[1].trim()) : '';

  // <link rel="canonical"> (kan saknas i äldre filer)
  const canonMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  let canonicalUrl = canonMatch ? canonMatch[1].trim() : '';

  // Härleda slug + parentSlug
  // Försök 1: från canonical URL (exakt)
  // Försök 2: fallback från filsökväg + DIR_TO_PARENT-mappning
  let slug       = '';
  let parentSlug = null;

  if (canonicalUrl.startsWith('https://searchboost.se/')) {
    const urlPath = canonicalUrl
      .replace('https://searchboost.se', '')
      .replace(/^\/|\/$/g, '');
    const parts = urlPath.split('/').filter(Boolean);

    if (parts.length === 1) {
      slug = parts[0]; parentSlug = null;
    } else if (parts.length >= 2) {
      parentSlug = parts[0]; slug = parts[parts.length - 1];
    }
  }

  // Fallback: härleda från filsökväg
  if (!slug) {
    const dirName  = path.basename(path.dirname(filePath));
    const fileName = path.basename(filePath, '.html');
    slug = fileName;

    if (DIR_TO_PARENT.hasOwnProperty(dirName)) {
      parentSlug = DIR_TO_PARENT[dirName]; // null = toppnivå
    } else {
      parentSlug = dirName; // okänd katalog = används som förälder
    }

    // Bygg canonical URL från filsökväg
    const base = 'https://searchboost.se';
    canonicalUrl = parentSlug
      ? `${base}/${parentSlug}/${slug}/`
      : `${base}/${slug}/`;
  }

  if (!slug) return null; // Kan inte bestämma slug

  // Extrahera <style>-block från <head>
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  const styleBlock = styleMatch ? `<style>${styleMatch[1]}</style>\n\n` : '';

  // Extrahera <body>-innehåll
  const bodyMatch   = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyContent = bodyMatch ? bodyMatch[1].trim() : html;

  // WP-innehåll = styles + full body (inklusive nav och footer)
  const wpContent = styleBlock + bodyContent;

  return {
    filePath,
    fileName: path.basename(filePath),
    fullTitle,      // ex: "Vad är SEO? Komplett guide 2026 | Searchboost"
    pageTitle,      // ex: "Vad är SEO? Komplett guide 2026"
    metaDescription,
    canonicalUrl,
    slug,
    parentSlug,
    wpContent,
  };
}

// ============================================================
// FILUPPTÄCKT
// ============================================================

function discoverPages(contentDir) {
  const pages = [];

  function scanDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        if (CONFIG.skipFiles.includes(entry.name)) {
          console.log(`  ⏭  Skippar: ${entry.name}`);
          continue;
        }
        try {
          const page = parseHtmlFile(fullPath);
          if (page) {
            pages.push(page);
          } else {
            console.log(`  ⏭  Skippar: ${entry.name} (inte en searchboost.se-sida)`);
          }
        } catch (err) {
          console.error(`  ❌ Fel vid parsning av ${entry.name}: ${err.message}`);
        }
      }
    }
  }

  scanDir(contentDir);
  return pages;
}

// ============================================================
// WORDPRESS REST API-KLIENT
// ============================================================

function wpRequest(method, wpPath, body = null) {
  return new Promise((resolve, reject) => {
    const credentials = `${CONFIG.wpUser}:${CONFIG.wpAppPassword}`;
    const auth = Buffer.from(credentials).toString('base64');
    const fullUrl = `${CONFIG.wpUrl}/wp-json/wp/v2${wpPath}`;
    const url = new URL(fullUrl);
    const lib = url.protocol === 'https:' ? https : http;
    const bodyStr = body ? JSON.stringify(body) : null;

    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + (url.search || ''),
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Searchboost-Publisher/1.0',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
      // Acceptera self-signed certifikat (Loopia/Nginx kan ha sådana)
      rejectUnauthorized: false,
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve({ status: res.statusCode, data: parsed });
          } else {
            const msg = parsed.message || parsed.code || data.slice(0, 300);
            reject(new Error(`HTTP ${res.statusCode}: ${msg}`));
          }
        } catch {
          reject(new Error(`HTTP ${res.statusCode} (ogiltigt JSON): ${data.slice(0, 200)}`));
        }
      });
    });

    req.on('error', err => reject(new Error(`Nätverksfel: ${err.message}`)));
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout efter 15s'));
    });

    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** Hitta sida via slug — returnerar WP-sidobjekt eller null */
async function findPageBySlug(slug) {
  try {
    const res = await wpRequest('GET', `/pages?slug=${encodeURIComponent(slug)}&per_page=1&_fields=id,slug,title,link`);
    return Array.isArray(res.data) && res.data.length > 0 ? res.data[0] : null;
  } catch {
    return null;
  }
}

/** Skapa eller uppdatera en WP-sida */
async function upsertPage(pageData, doUpdate) {
  const existing = await findPageBySlug(pageData.slug);

  if (existing && !doUpdate) {
    return { action: 'skipped', id: existing.id };
  }

  const payload = {
    title:    pageData.pageTitle,
    slug:     pageData.slug,
    content:  pageData.wpContent,
    status:   pageData.status,
    template: CONFIG.pageTemplate,
    meta: {
      rank_math_title:         pageData.fullTitle,
      rank_math_description:   pageData.metaDescription,
      rank_math_canonical_url: pageData.canonicalUrl,
    },
    ...(pageData.parentId ? { parent: pageData.parentId } : {}),
  };

  if (existing && doUpdate) {
    const res = await wpRequest('POST', `/pages/${existing.id}`, payload);
    return { action: 'updated', id: res.data.id };
  } else {
    const res = await wpRequest('POST', '/pages', payload);
    return { action: 'created', id: res.data.id };
  }
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  const divider = '═'.repeat(52);
  console.log(`\n🚀 Searchboost WordPress Publisher`);
  console.log(divider);
  console.log(`Läge:     ${DRY_RUN ? '🔍 DRY RUN — kör --publish för att publicera' : '✍️  PUBLICERAR'}`);
  console.log(`Status:   ${GO_LIVE ? 'published (live)' : 'draft (utkast)'}`);
  console.log(`Uppdatera: ${DO_UPDATE ? 'Ja (skriver över befintliga)' : 'Nej (skippar befintliga)'}`);
  console.log(`Filter:   ${SLUG_FILTER || 'alla sidor'}`);
  console.log(`WP:       ${CONFIG.wpUrl}`);
  console.log(divider + '\n');

  // Verifiera att app-password är satt
  if (!DRY_RUN && CONFIG.wpAppPassword === 'ANGE_APP_PASSWORD_HÄR') {
    console.error('❌ Sätt WP_APP_PASSWORD i scriptet innan du kör!');
    console.error('   WP Admin → Användare → Redigera → Application Passwords');
    process.exit(1);
  }

  // Upptäck sidor
  console.log('📂 Hittar HTML-sidor...');
  let pages = discoverPages(CONFIG.contentDir);

  if (SLUG_FILTER) {
    pages = pages.filter(p => p.slug === SLUG_FILTER);
    if (pages.length === 0) {
      console.error(`❌ Hittade ingen sida med slug: ${SLUG_FILTER}`);
      process.exit(1);
    }
  }

  // Sortera: föräldralösa sidor (toppnivå) kommer sist — föräldrasidor skapas via parentPageDefs
  pages.sort((a, b) => {
    const aHasParent = a.parentSlug ? 1 : 0;
    const bHasParent = b.parentSlug ? 1 : 0;
    if (aHasParent !== bHasParent) return aHasParent - bHasParent;
    return a.slug.localeCompare(b.slug);
  });

  console.log(`\n✅ Hittade ${pages.length} sidor:\n`);

  // Visa manifest
  const byParent = {};
  for (const p of pages) {
    const key = p.parentSlug || '(toppnivå)';
    if (!byParent[key]) byParent[key] = [];
    byParent[key].push(p);
  }
  for (const [parent, pgs] of Object.entries(byParent)) {
    console.log(`  📁 ${parent}`);
    for (const p of pgs) {
      console.log(`     ↳ ${p.slug}  —  "${p.pageTitle}"`);
    }
  }

  if (DRY_RUN) {
    console.log('\n' + divider);
    console.log('📊 STATISTIK');
    console.log(divider);
    console.log(`Totalt antal sidor:   ${pages.length}`);
    console.log(`Toppnivå:             ${pages.filter(p => !p.parentSlug).length}`);
    for (const pd of CONFIG.parentPageDefs) {
      const n = pages.filter(p => p.parentSlug === pd.slug).length;
      if (n > 0) console.log(`Under /${pd.slug}/:     ${n}`);
    }
    console.log('\n🔍 DRY RUN klar. Kör med --publish för att skapa WP-sidor.');
    return;
  }

  // Testa WP-anslutning
  console.log('\n🔌 Testar WordPress-anslutning...');
  try {
    await wpRequest('GET', '/pages?per_page=1&_fields=id');
    console.log('✅ WordPress svarar OK\n');
  } catch (err) {
    console.error(`❌ Kan inte nå WordPress: ${err.message}`);
    console.error('   Kontrollera: Är searchboost.se tillgänglig? Är app-password rätt?');
    process.exit(1);
  }

  const status = GO_LIVE ? 'publish' : 'draft';

  // Steg 1: Säkerställ föräldrasidor
  console.log('📁 Skapar/hittar föräldrasidor...');
  const parentIds = {};

  const neededParents = CONFIG.parentPageDefs.filter(
    pd => pages.some(p => p.parentSlug === pd.slug)
  );

  for (const pd of neededParents) {
    process.stdout.write(`   ${pd.slug}: `);
    try {
      const existing = await findPageBySlug(pd.slug);
      if (existing) {
        parentIds[pd.slug] = existing.id;
        console.log(`hittad (ID: ${existing.id})`);
      } else {
        const res = await wpRequest('POST', '/pages', {
          title:   pd.title,
          slug:    pd.slug,
          content: pd.content,
          status,
        });
        parentIds[pd.slug] = res.data.id;
        console.log(`skapad (ID: ${res.data.id})`);
      }
    } catch (err) {
      console.error(`FEL: ${err.message}`);
      parentIds[pd.slug] = null;
    }
    await sleep(CONFIG.requestDelay);
  }

  // Steg 2: Publicera alla sidor
  console.log('\n📝 Publicerar sidor...');
  const results = { created: [], updated: [], skipped: [], failed: [] };

  for (const page of pages) {
    const indicator = page.parentSlug ? `${page.parentSlug}/` : '';
    process.stdout.write(`   ${indicator}${page.slug}: `);

    try {
      const result = await upsertPage({
        pageTitle:       page.pageTitle,
        fullTitle:       page.fullTitle,
        slug:            page.slug,
        wpContent:       page.wpContent,
        status,
        metaDescription: page.metaDescription,
        canonicalUrl:    page.canonicalUrl,
        parentId:        page.parentSlug ? (parentIds[page.parentSlug] || null) : null,
      }, DO_UPDATE);

      const emoji = { created: '✅', updated: '🔄', skipped: '⏭' }[result.action] || '?';
      console.log(`${emoji} ${result.action} (ID: ${result.id})`);
      results[result.action].push(page.slug);
    } catch (err) {
      console.error(`❌ FEL: ${err.message}`);
      results.failed.push({ slug: page.slug, error: err.message });
    }

    await sleep(CONFIG.requestDelay);
  }

  // Sammanfattning
  console.log('\n' + divider);
  console.log('📊 SAMMANFATTNING');
  console.log(divider);
  console.log(`✅ Skapade:   ${results.created.length}`);
  console.log(`🔄 Uppdaterade: ${results.updated.length}`);
  console.log(`⏭  Skippade:  ${results.skipped.length}${results.skipped.length > 0 ? ' (använd --update för att skriva över)' : ''}`);
  console.log(`❌ Misslyckade: ${results.failed.length}`);

  if (results.failed.length > 0) {
    console.log('\nMisslyckade sidor:');
    for (const f of results.failed) {
      console.log(`   ${f.slug}: ${f.error}`);
    }
  }

  if (results.created.length + results.updated.length > 0) {
    const adminUrl = `${CONFIG.wpUrl}/wp-admin/edit.php?post_type=page`;
    console.log(`\n🎉 Klart! Se sidorna: ${adminUrl}`);
    if (status === 'draft') {
      console.log('📌 Sidor sparades som UTKAST. Kör med --live för att publicera direkt.');
    }
    console.log('\n💡 Tips: Sätt page template till "Blank" eller "Canvas" i WP Admin');
    console.log('   så att temat inte dubblar nav/footer ovanpå sidornas egna design.');
  }
}

main().catch(err => {
  console.error('\n💥 Oväntat fel:', err.message);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
