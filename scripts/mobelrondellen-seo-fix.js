#!/usr/bin/env node
/**
 * Möbelrondellen SEO Fix Script
 *
 * Fixar alla SEO-problem via WordPress REST API.
 * Kör med --dry-run för att se vad som ändras utan att göra något.
 * Kör med --execute för att genomföra ändringarna.
 * Kör med --rollback för att återställa från backup.
 *
 * Usage:
 *   node scripts/mobelrondellen-seo-fix.js --dry-run
 *   node scripts/mobelrondellen-seo-fix.js --execute
 *   node scripts/mobelrondellen-seo-fix.js --rollback
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ── Config ──
const WP_URL = 'https://mobelrondellen.se';
const WP_USER = 'info@searchboost.nu';
const WP_APP_PASSWORD = 'hYIn gxgU ZkNJ mlNp VELN cYrY';
const SITE_NAME = 'Möbelrondellen Mora';
const BACKUP_FILE = path.join(__dirname, 'mobelrondellen-backup.json');

const AUTH = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');
const HEADERS = {
  'Authorization': `Basic ${AUTH}`,
  'Content-Type': 'application/json',
  'User-Agent': 'Searchboost-SEO-Fix/1.0'
};

const MODE = process.argv[2] || '--dry-run';
const DRY_RUN = MODE !== '--execute';
const ROLLBACK = MODE === '--rollback';

// ── Optimerade metadata per sida ──

const PAGE_SEO = {
  // ID: { title, description, slug_change, action }
  2093: {
    title: `Möbelrondellen Mora — Möbler, soffor & inredning`,
    description: 'Möbelrondellen i Mora erbjuder kvalitetsmöbler för vardagsrum, sovrum och matrum. Besök vår butik eller handla online. Fri leverans i Mora med omnejd.',
  },
  1948: {
    title: `Våra varumärken — ${SITE_NAME}`,
    description: 'Vi säljer möbler från välkända varumärken. Se hela vårt sortiment av kvalitetsmöbler för vardagsrum, sovrum och matrum.',
  },
  330: {
    title: `Hitta till oss i Mora — ${SITE_NAME}`,
    description: 'Hitta till Möbelrondellen i Mora. Adress, vägbeskrivning och karta. Välkommen att besöka vår möbelbutik.',
  },
  325: {
    title: `Kontakt — ${SITE_NAME}`,
    description: 'Kontakta Möbelrondellen i Mora. Ring, mejla eller besök oss. Vi hjälper dig med möbler och inredning.',
  },
  127: {
    title: `Webbutik — Handla möbler online — ${SITE_NAME}`,
    description: 'Handla möbler och inredning online från Möbelrondellen. Soffor, sängar, matbord och utemöbler med leverans i hela Sverige.',
  },
  104: {
    title: `Alla produkter — ${SITE_NAME}`,
    description: 'Se hela vårt sortiment av möbler och inredning. Soffor, sängar, matbord, soffbord, fåtöljer och utemöbler.',
  },
  20: {
    title: `Leveransinformation — ${SITE_NAME}`,
    description: 'Information om leverans från Möbelrondellen. Fri leverans i Mora med omnejd. Hemleverans i hela Sverige.',
  },
  18: {
    title: `Delbetalning med Resurs Bank — ${SITE_NAME}`,
    description: 'Delbetala dina möbler med Resurs Bank. Flexibel delbetalning på alla köp hos Möbelrondellen i Mora.',
  },
  16: {
    title: `Öppettider — ${SITE_NAME}`,
    description: 'Möbelrondellens öppettider i Mora. Se när butiken har öppet och planera ditt besök.',
  },
  // Sidor att noindex/ta bort
  1677: { action: 'noindex', reason: 'Gammal under-bearbetning-sida' },
  1575: { action: 'noindex', reason: 'Gammal quiz-sida' },
  130: { action: 'noindex', reason: 'WooCommerce mitt-konto (login) — ingen SEO-nytta' },
  129: { action: 'noindex', reason: 'WooCommerce kassa — ingen SEO-nytta' },
  128: { action: 'noindex', reason: 'WooCommerce varukorg — ingen SEO-nytta' },
  // Duplicate kontakt-sida (behåll /kontakt/, noindex /kontakt-hitta-hit/)
  12: { action: 'noindex', reason: 'Duplicate av /kontakt/ — bör redirectas' },
};

// ── WooCommerce kategori-SEO ──

const CATEGORY_SEO = {
  'vardagsrum': {
    description: 'Möbler för vardagsrummet — soffor, soffbord, fåtöljer och bäddsoffor. Kvalitetsmöbler hos Möbelrondellen i Mora.',
  },
  'sovrum': {
    description: 'Sovrumsmöbler — sängar, huvudgavlar och sängbord. Hitta din nya säng hos Möbelrondellen i Mora.',
  },
  'soffor': {
    description: 'Stort urval av soffor — djupa soffor, hörnsoffor och 2-sits. Provsitta i vår butik i Mora eller beställ online.',
  },
  'sangar': {
    description: 'Kvalitetssängar med snabb leverans. Continental-, ramsängar och bäddsoffor. Möbelrondellen i Mora.',
  },
  'matrum': {
    description: 'Matsalsmöbler — matbord, stolar och vitrinskåp. Komplettera din matplats hos Möbelrondellen.',
  },
  'soffbord': {
    description: 'Soffbord i olika stilar och storlekar. Hitta ditt nästa soffbord hos Möbelrondellen i Mora.',
  },
  'utomhus': {
    description: 'Utemöbler för balkong, trädgård och uteplats. Trädgårdsmöbler hos Möbelrondellen i Mora.',
  },
  'utemobler': {
    description: 'Utemöbler av hög kvalitet — loungemöbler, trädgårdsset och utesoffor. Möbelrondellen i Mora.',
  },
  'fatoljer': {
    description: 'Fåtöljer för alla rum — vilstolar, öronlappssfåtöljer och moderna fåtöljer. Möbelrondellen i Mora.',
  },
  'matbord': {
    description: 'Matbord i olika storlekar och material. Runda, fyrkantiga och utdragbara matbord. Möbelrondellen.',
  },
  'koksstol': {
    description: 'Köksstolar och matstolar i olika stilar. Hitta rätt stol till din matplats hos Möbelrondellen.',
  },
  'baddsoffor': {
    description: 'Bäddsoffor som gästsäng eller vardagssoffa. Smarta möbler hos Möbelrondellen i Mora.',
  },
  'vitrinskap': {
    description: 'Vitrinskåp för matrum och vardagsrum. Förvaring med stil hos Möbelrondellen i Mora.',
  },
  'inredning': {
    description: 'Inredning och heminredningsdetaljer. Komplettera ditt hem hos Möbelrondellen i Mora.',
  },
};

// ── Blog post att ta bort (duplicate) ──
const DUPLICATE_POST_ID = null; // Vi hittar den dynamiskt

// ── Helpers ──

async function wpGet(endpoint) {
  const res = await axios.get(`${WP_URL}/wp-json/wp/v2${endpoint}`, {
    headers: HEADERS, timeout: 15000
  });
  return res.data;
}

async function wpUpdate(endpoint, data) {
  if (DRY_RUN) return { dry_run: true };
  const res = await axios.post(`${WP_URL}/wp-json/wp/v2${endpoint}`, data, {
    headers: HEADERS, timeout: 15000
  });
  return res.data;
}

async function wpDelete(endpoint) {
  if (DRY_RUN) return { dry_run: true };
  const res = await axios.delete(`${WP_URL}/wp-json/wp/v2${endpoint}`, {
    headers: HEADERS, timeout: 15000
  });
  return res.data;
}

function log(emoji, msg) {
  console.log(`  ${emoji} ${msg}`);
}

// ── Main ──

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  MÖBELRONDELLEN SEO FIX`);
  console.log(`  Mode: ${DRY_RUN ? '🔍 DRY RUN (ingen ändring)' : '🔧 EXECUTE (skarpt!)'}`);
  console.log(`${'='.repeat(60)}\n`);

  if (ROLLBACK) {
    return await rollback();
  }

  // ── STEG 0: Testa anslutning ──
  console.log('STEG 0: Testar WP API-anslutning...');
  try {
    const me = await axios.get(`${WP_URL}/wp-json/wp/v2/users/me`, {
      headers: HEADERS, timeout: 10000
    });
    log('✅', `Inloggad som: ${me.data.name} (${me.data.slug})`);
    log('✅', `Roller: ${me.data.roles?.join(', ') || 'okänd'}`);
  } catch (err) {
    log('❌', `Kan inte ansluta: ${err.response?.status} ${err.response?.data?.message || err.message}`);
    process.exit(1);
  }

  // ── STEG 1: Backup ──
  console.log('\nSTEG 1: Skapar backup av nuvarande data...');
  const pages = await wpGet('/pages?per_page=100&status=publish');
  const posts = await wpGet('/posts?per_page=100&status=publish');

  const backup = {
    timestamp: new Date().toISOString(),
    pages: pages.map(p => ({
      id: p.id,
      title: p.title.rendered,
      slug: p.slug,
      status: p.status,
      link: p.link,
      meta: p.meta || {},
      yoast: p.yoast_head_json || {}
    })),
    posts: posts.map(p => ({
      id: p.id,
      title: p.title.rendered,
      slug: p.slug,
      status: p.status,
      link: p.link,
      date: p.date,
      meta: p.meta || {},
      yoast: p.yoast_head_json || {}
    }))
  };

  // Hämta produktkategorier (via WC Store API — publik)
  try {
    const catRes = await axios.get(`${WP_URL}/wp-json/wc/store/v1/products/categories?per_page=100`, { timeout: 15000 });
    backup.categories = catRes.data.map(c => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      count: c.count
    }));
    log('✅', `Backup: ${backup.pages.length} sidor, ${backup.posts.length} inlägg, ${backup.categories.length} kategorier`);
  } catch (e) {
    backup.categories = [];
    log('⚠️', `Kunde inte hämta kategorier: ${e.message}`);
  }

  fs.writeFileSync(BACKUP_FILE, JSON.stringify(backup, null, 2));
  log('💾', `Backup sparad: ${BACKUP_FILE}`);

  // ── STEG 2: Fixa sidtitlar + meta descriptions ──
  console.log('\nSTEG 2: Fixar sidtitlar och meta descriptions...');
  let fixedPages = 0;
  let noindexPages = 0;

  for (const page of pages) {
    const seo = PAGE_SEO[page.id];
    if (!seo) {
      log('⏭️', `[${page.id}] ${page.title.rendered} — ingen ändring planerad`);
      continue;
    }

    if (seo.action === 'noindex') {
      log('🚫', `[${page.id}] ${page.title.rendered} → noindex (${seo.reason})`);

      // Sätt noindex via Yoast meta-field
      try {
        await wpUpdate(`/pages/${page.id}`, {
          meta: {
            _yoast_wpseo_meta_robots_noindex: '1'
          }
        });
        noindexPages++;
      } catch (e) {
        // Om Yoast-meta inte går att skriva, logga det
        log('⚠️', `  Kunde inte sätta noindex via meta: ${e.response?.data?.message || e.message}`);
        log('💡', `  Alternativ: Sätt manuellt i Yoast-boxen i wp-admin`);
      }
      continue;
    }

    const changes = [];
    const updateData = {};

    // Title
    if (seo.title && seo.title !== page.title.rendered) {
      changes.push(`title: "${page.title.rendered}" → "${seo.title}"`);
      // Yoast SEO title
      updateData.meta = updateData.meta || {};
      updateData.meta._yoast_wpseo_title = seo.title;
    }

    // Meta description
    if (seo.description) {
      const currentDesc = page.yoast_head_json?.description || '';
      if (currentDesc !== seo.description) {
        changes.push(`description: "${currentDesc.slice(0, 40)}..." → "${seo.description.slice(0, 40)}..."`);
        updateData.meta = updateData.meta || {};
        updateData.meta._yoast_wpseo_metadesc = seo.description;
      }
    }

    if (changes.length > 0) {
      log('📝', `[${page.id}] ${page.title.rendered}`);
      for (const c of changes) {
        log('  ', `→ ${c}`);
      }

      try {
        await wpUpdate(`/pages/${page.id}`, updateData);
        fixedPages++;
      } catch (e) {
        log('❌', `  Fel: ${e.response?.data?.message || e.message}`);
      }
    }
  }

  log('📊', `Sidor fixade: ${fixedPages}, noindex: ${noindexPages}`);

  // ── STEG 3: Fixa blog posts ──
  console.log('\nSTEG 3: Fixar blogginlägg...');

  // Hitta duplicate post (2020-versionen)
  const oldPost = posts.find(p => p.slug === 'standard-bildvisning-1');
  if (oldPost) {
    log('🗑️', `[${oldPost.id}] Duplicate post: "${oldPost.title.rendered}" (${oldPost.date.split('T')[0]})`);
    log('  ', `→ Sätter till draft (inte delete — säkrare)`);
    try {
      await wpUpdate(`/posts/${oldPost.id}`, { status: 'draft' });
    } catch (e) {
      log('❌', `  Fel: ${e.response?.data?.message || e.message}`);
    }
  }

  // Optimera den nya posten
  const newPost = posts.find(p => p.slug !== 'standard-bildvisning-1');
  if (newPost) {
    log('📝', `[${newPost.id}] Optimerar: "${newPost.title.rendered}"`);
    try {
      await wpUpdate(`/posts/${newPost.id}`, {
        meta: {
          _yoast_wpseo_title: `Sängar med 1 dags leverans — ${SITE_NAME}`,
          _yoast_wpseo_metadesc: 'Vi har flera sängmodeller som lagervara med 1 dags leveranstid. Besök Möbelrondellen i Mora eller beställ online.'
        }
      });
    } catch (e) {
      log('❌', `  Fel: ${e.response?.data?.message || e.message}`);
    }
  }

  // ── STEG 4: WooCommerce kategori-descriptions ──
  console.log('\nSTEG 4: Optimerar produktkategorier...');

  // WooCommerce kategorier kräver WC REST API med auth
  // Försök via wp/v2/product_cat taxonomy
  let catFixCount = 0;
  try {
    // Hämta alla kategorier via WP REST API (om WooCommerce exponerar dem)
    const wcCats = await axios.get(`${WP_URL}/wp-json/wp/v2/product_cat?per_page=100`, {
      headers: HEADERS, timeout: 15000
    });

    for (const cat of wcCats.data) {
      const seo = CATEGORY_SEO[cat.slug];
      if (!seo) continue;

      const currentDesc = cat.description || '';
      if (currentDesc === seo.description) continue;

      log('📝', `[${cat.id}] Kategori: ${cat.name} (${cat.slug})`);
      log('  ', `→ description: "${seo.description.slice(0, 50)}..."`);

      try {
        await wpUpdate(`/product_cat/${cat.id}`, {
          description: seo.description
        });
        catFixCount++;
      } catch (e) {
        log('⚠️', `  Kunde inte uppdatera: ${e.response?.data?.message || e.message}`);
      }
    }
  } catch (e) {
    log('⚠️', `Kategorier ej tillgängliga via WP REST API: ${e.response?.status || e.message}`);
    log('💡', 'Alternativ: Använd WooCommerce REST API med consumer key/secret');
  }

  log('📊', `Kategorier fixade: ${catFixCount}`);

  // ── STEG 5: Sammanfattning ──
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  SAMMANFATTNING`);
  console.log(`${'='.repeat(60)}`);
  console.log(`  Sidor med ny title/description: ${fixedPages}`);
  console.log(`  Sidor satta till noindex: ${noindexPages}`);
  console.log(`  Blogginlägg fixade: ${oldPost || newPost ? 'Ja' : 'Nej'}`);
  console.log(`  Kategorier optimerade: ${catFixCount}`);

  if (DRY_RUN) {
    console.log(`\n  ℹ️  DRY RUN — inga ändringar gjordes.`);
    console.log(`  Kör med --execute för att genomföra ändringarna.`);
    console.log(`  Backup finns på: ${BACKUP_FILE}`);
  } else {
    console.log(`\n  ✅ Alla ändringar genomförda!`);
    console.log(`  Backup finns på: ${BACKUP_FILE}`);
    console.log(`  Kör med --rollback för att ångra.`);
  }

  // ── Plugin-uppstädning (manuell guide) ──
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  MANUELLT (kräver wp-admin inlogg)`);
  console.log(`${'='.repeat(60)}`);
  console.log(`
  Logga in: ${WP_URL}/wp-admin

  1. UPPDATERA WordPress + tema + WooCommerce
     Dashboard → Updates → Update All

  2. TA BORT dessa plugins:
     ☐ MonsterInsights (redundant med Site Kit)
     ☐ Jetpack (redundant med Hummingbird)
     ☐ Quiz and Survey Master (oanvänt)
     ☐ Facebook Page Like Widget (tung, ingen nytta)
     ☐ Molongui Authorship (onödig)
     ☐ OptinMonster (tungt JS)
     ☐ Smart Logo Showcase Lite (ersätt med bild)
     ☐ Font Awesome (laddar hela biblioteket)
     ☐ AIOSEO Broken Link Checker (vi gör detta)
     ☐ CF7 Apps (onödig CF7-tillägg)

  3. INSTALLERA Rank Math Pro
     ☐ Ladda upp rank-math-pro.zip
     ☐ Aktivera → Kör Setup Wizard
     ☐ Importera Yoast-data (Rank Math frågar automatiskt)
     ☐ Avinstallera Yoast SEO

  4. TA BORT sidor i wp-admin:
     ☐ /under-bearbetning/ → Flytta till papperskorgen
     ☐ /quiz-1721926711/ → Flytta till papperskorgen
     ☐ /kontakt-hitta-hit/ → Skapa redirect till /kontakt/

  5. SIMPLY.COM — Fixa WAF
     ☐ Logga in på Simply.com kontrollpanel
     ☐ WAF blockerar sitemap_index.xml (HTTP 455)
     ☐ Lägg till undantag för /sitemap*.xml
  `);
}

// ── Rollback ──

async function rollback() {
  console.log('ROLLBACK: Återställer från backup...');

  if (!fs.existsSync(BACKUP_FILE)) {
    log('❌', `Ingen backup hittad: ${BACKUP_FILE}`);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
  log('📁', `Backup från: ${backup.timestamp}`);

  for (const page of backup.pages) {
    const yoastTitle = page.yoast?.title || '';
    const yoastDesc = page.yoast?.description || '';

    log('↩️', `[${page.id}] ${page.title} — återställer`);

    try {
      await wpUpdate(`/pages/${page.id}`, {
        meta: {
          _yoast_wpseo_title: yoastTitle,
          _yoast_wpseo_metadesc: yoastDesc,
          _yoast_wpseo_meta_robots_noindex: '0'
        }
      });
    } catch (e) {
      log('❌', `  Fel: ${e.response?.data?.message || e.message}`);
    }
  }

  // Återställ draft-post
  for (const post of backup.posts) {
    if (post.status === 'publish') {
      try {
        await wpUpdate(`/posts/${post.id}`, { status: 'publish' });
      } catch (e) { /* ignorera */ }
    }
  }

  log('✅', 'Rollback klar!');
}

// ── Run ──
main().catch(err => {
  console.error('\nFATAL:', err.message);
  process.exit(1);
});
