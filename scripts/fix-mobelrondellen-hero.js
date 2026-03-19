#!/usr/bin/env node
/**
 * Möbelrondellen Hero Image Fix
 *
 * Diagnoses the missing hero image on www.mobelrondellen.se
 * and provides fixes.
 *
 * The site is a React SPA (Vite + Tailwind) hosted on Simply.com.
 * HeroSection.tsx references /images/hero-soffa.jpg which is missing.
 *
 * Usage:
 *   node scripts/fix-mobelrondellen-hero.js
 *   node scripts/fix-mobelrondellen-hero.js --create-placeholder
 *
 * DIAGNOSIS RESULT (2026-03-19):
 * - /images/hero-soffa.jpg -> MISSING (returns SPA fallback HTML)
 * - /images/logo.png -> OK (13793 bytes)
 * - /images/about-store.jpg -> OK (156507 bytes)
 * - /images/category-*.jpg -> OK (all exist)
 * - /images/mora-landscape.jpg -> OK (196369 bytes)
 * - /images/blog/*.jpg -> ALL MISSING
 *
 * FIX: Upload the hero image as /images/hero-soffa.jpg on Simply.com hosting.
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://www.mobelrondellen.se';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { headers: { 'User-Agent': UA } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        status: res.statusCode,
        contentType: res.headers['content-type'],
        body: Buffer.concat(chunks)
      }));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('timeout')); });
  });
}

async function diagnose() {
  console.log('\n=== MÖBELRONDELLEN HERO IMAGE DIAGNOSTIK ===\n');

  const images = [
    'hero-soffa.jpg',
    'logo.png',
    'about-store.jpg',
    'category-sofas.jpg',
    'category-dining.jpg',
    'category-beds.jpg',
    'category-storage.jpg',
    'testimonial-couple.jpg',
    'mora-landscape.jpg',
    'blog/soffa-guide.jpg',
    'blog/sang-guide.jpg',
  ];

  const results = [];
  for (const img of images) {
    try {
      const res = await fetch(`${SITE_URL}/images/${img}`);
      const isImage = res.contentType?.startsWith('image/');
      const status = isImage ? '✅ OK' : '❌ SAKNAS';
      const size = isImage ? `${res.body.length} bytes` : 'SPA fallback';
      console.log(`  ${status}  /images/${img}  (${size})`);
      results.push({ img, ok: isImage, size: res.body.length });
    } catch (err) {
      console.log(`  ❌ FEL  /images/${img}  (${err.message})`);
      results.push({ img, ok: false, size: 0 });
    }
  }

  const missing = results.filter(r => !r.ok);
  const working = results.filter(r => r.ok);

  console.log(`\n=== SAMMANFATTNING ===`);
  console.log(`  Fungerande bilder: ${working.length}`);
  console.log(`  Saknade bilder: ${missing.length}`);

  if (missing.length > 0) {
    console.log(`\n  Saknade filer:`);
    for (const m of missing) {
      console.log(`    - /images/${m.img}`);
    }
  }

  console.log(`\n=== FIX ===`);
  console.log(`
  PROBLEMET:
  /images/hero-soffa.jpg saknas på servern (Simply.com).
  När herobilden byttes ut togs den gamla filen bort men den nya laddades
  inte upp med rätt filnamn.

  LÖSNING (välj ett alternativ):

  1. SNABBFIX — Ladda upp herobilden:
     a) Logga in på Simply.com kontrollpanelen
     b) Gå till Filhanteraren → public_html/images/
     c) Ladda upp herobilden som "hero-soffa.jpg"
     d) Bilden bör vara minst 1920×1080px, JPEG-format

  2. TEMPORÄR FIX — Använd befintlig bild:
     Kör: node scripts/fix-mobelrondellen-hero.js --create-placeholder
     (Laddar ner about-store.jpg som en temporär ersättning)

  3. KOD-FIX — Ändra i React-appen:
     I src/sections/HeroSection.tsx, rad 15:
       src="/images/hero-soffa.jpg"
     Byt till en befintlig bild, t.ex.:
       src="/images/about-store.jpg"
     Bygg om och deploya.

  OBS: Blog-bilderna (/images/blog/*.jpg) saknas också.
  Dessa behöver också laddas upp.
  `);
}

async function createPlaceholder() {
  console.log('\n=== SKAPAR PLACEHOLDER HERO-BILD ===\n');

  const outputDir = path.join(__dirname, '..', 'temp-mobelrondellen-images');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Download about-store.jpg as a temporary hero image
  console.log('  Laddar ner about-store.jpg som temporär ersättning...');
  try {
    const res = await fetch(`${SITE_URL}/images/about-store.jpg`);
    if (res.contentType?.startsWith('image/')) {
      const outputPath = path.join(outputDir, 'hero-soffa.jpg');
      fs.writeFileSync(outputPath, res.body);
      console.log(`  ✅ Sparad: ${outputPath} (${res.body.length} bytes)`);
      console.log(`\n  Ladda upp denna fil till Simply.com:`);
      console.log(`  Destination: public_html/images/hero-soffa.jpg`);
    } else {
      console.log('  ❌ Kunde inte ladda ner about-store.jpg');
    }
  } catch (err) {
    console.log(`  ❌ Fel: ${err.message}`);
  }

  // Also download mora-landscape.jpg as alternative
  console.log('\n  Laddar ner mora-landscape.jpg som alternativ...');
  try {
    const res = await fetch(`${SITE_URL}/images/mora-landscape.jpg`);
    if (res.contentType?.startsWith('image/')) {
      const outputPath = path.join(outputDir, 'hero-soffa-alt.jpg');
      fs.writeFileSync(outputPath, res.body);
      console.log(`  ✅ Sparad: ${outputPath} (${res.body.length} bytes)`);
    }
  } catch (err) {
    console.log(`  ❌ Fel: ${err.message}`);
  }

  console.log(`\n  Filer sparade i: ${outputDir}`);
  console.log(`  Ladda upp hero-soffa.jpg till Simply.com → public_html/images/`);
}

// ── Main ──
const mode = process.argv[2] || '--diagnose';

if (mode === '--create-placeholder') {
  createPlaceholder().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
} else {
  diagnose().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
}
