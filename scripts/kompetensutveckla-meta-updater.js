#!/usr/bin/env node
/**
 * Kompetensutveckla.se — Batch Meta Title/Description Updater
 * Uses custom REST endpoint /searchboost/v1/bulk-meta
 *
 * Usage: node scripts/kompetensutveckla-meta-updater.js
 */

const https = require('https');

// === CONFIG ===
const WP_REST = 'https://kompetensutveckla.se/wp-json';
const WP_USER = 'Searchboost';
const WP_PASS = 'hd9z 0yZe A3y5 tZSu 2gXM GIhk';
const AUTH = 'Basic ' + Buffer.from(WP_USER + ':' + WP_PASS).toString('base64');
const BATCH_SIZE = 20; // pages per REST call
const DELAY_MS = 300;

// === CITY MAP ===
const cityMap = {
  'stockholm': 'Stockholm', 'goteborg': 'Göteborg', 'malmo': 'Malmö',
  'uppsala': 'Uppsala', 'linkoping': 'Linköping', 'vasteras': 'Västerås',
  'orebro': 'Örebro', 'norrkoping': 'Norrköping', 'helsingborg': 'Helsingborg',
  'jonkoping': 'Jönköping', 'umea': 'Umeå', 'lund': 'Lund',
  'boras': 'Borås', 'sundsvall': 'Sundsvall', 'gavle': 'Gävle',
  'vaxjo': 'Växjö', 'halmstad': 'Halmstad', 'karlstad': 'Karlstad',
  'lulea': 'Luleå', 'trollhattan': 'Trollhättan', 'kalmar': 'Kalmar',
  'falun': 'Falun', 'skelleftea': 'Skellefteå', 'karlskrona': 'Karlskrona',
  'kristianstad': 'Kristianstad', 'varberg': 'Varberg', 'ostersund': 'Östersund',
  'borlange': 'Borlänge', 'skara': 'Skara', 'nykoping': 'Nyköping',
  'visby': 'Visby', 'motala': 'Motala', 'hassleholm': 'Hässleholm',
  'katrineholm': 'Katrineholm', 'ornskoldsvik': 'Örnsköldsvik',
  'pitea': 'Piteå', 'lidkoping': 'Lidköping', 'landskrona': 'Landskrona',
  'enkoping': 'Enköping', 'norrtalje': 'Norrtälje', 'hudiksvall': 'Hudiksvall',
  'sandviken': 'Sandviken', 'soderhamn': 'Söderhamn', 'sala': 'Sala',
  'eskilstuna': 'Eskilstuna', 'gotland': 'Gotland', 'halland': 'Halland',
  'skane': 'Skåne', 'dalarna': 'Dalarna', 'blekinge': 'Blekinge',
  'jamtland': 'Jämtland', 'ostergotland': 'Östergötland',
  'vastergotland': 'Västergötland', 'smaland': 'Småland',
  'sodermanland': 'Södermanland', 'vastmanland': 'Västmanland',
  'vasterbotten': 'Västerbotten', 'norrbotten': 'Norrbotten',
  'varmland': 'Värmland', 'distans': 'Distans', 'online': 'Online',
};

// === REST HELPERS ===
function restCall(path, body) {
  const bodyStr = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const url = new URL(WP_REST + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': AUTH,
        'Content-Length': Buffer.byteLength(bodyStr, 'utf8'),
      },
      rejectUnauthorized: false,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ raw: data.substring(0, 500) }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.write(bodyStr);
    req.end();
  });
}

function restGet(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(WP_REST + path);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'Authorization': AUTH },
      rejectUnauthorized: false,
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ data: JSON.parse(data), total: parseInt(res.headers['x-wp-total'] || '0') }); }
        catch { resolve({ data: data.substring(0, 500), total: 0 }); }
      });
    });
    req.on('error', reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.end();
  });
}

// === FETCH ALL PAGES VIA REST API ===
async function fetchAllPages() {
  console.log('Hämtar alla publicerade sidor via REST API...');
  const allPages = [];
  let page = 1;

  // First call to get total
  const first = await restGet(`/wp/v2/pages?per_page=100&page=1&_fields=id,title,slug&status=publish`);
  const total = first.total;
  console.log(`  Totalt antal sidor: ${total}`);

  for (const p of first.data) {
    allPages.push({ id: p.id, title: p.title.rendered, slug: p.slug });
  }
  console.log(`  Hämtade sida 1: ${first.data.length} st`);

  const totalPages = Math.ceil(total / 100);
  for (let pg = 2; pg <= totalPages; pg++) {
    const res = await restGet(`/wp/v2/pages?per_page=100&page=${pg}&_fields=id,title,slug&status=publish`);
    for (const p of res.data) {
      allPages.push({ id: p.id, title: p.title.rendered, slug: p.slug });
    }
    console.log(`  Hämtade sida ${pg}: ${res.data.length} st`);
  }

  console.log(`Totalt hämtat: ${allPages.length} sidor\n`);
  return allPages;
}

// === META GENERATOR ===
function generateMeta(page) {
  const { slug, title } = page;
  let mt = '', md = '';

  // Helper to decode HTML entities
  const raw = (title || '').replace(/&#8211;/g, '–').replace(/&#8212;/g, '—')
    .replace(/&#8217;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>').replace(/&#038;/g, '&');

  // --- BAM stadssidor ---
  const bamStadMatch = slug.match(/^bam-utbildning-(.+)$/);
  if (bamStadMatch) {
    const city = cityMap[bamStadMatch[1]] || cap(bamStadMatch[1]);
    mt = `BAM-utbildning ${city} — Bättre Arbetsmiljö | Kompetensutveckla`;
    md = `BAM-utbildning i ${city}. 3 dagars grundkurs i arbetsmiljö för chefer och skyddsombud. Boka plats hos Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- BAS P stadssidor ---
  const basPMatch = slug.match(/^bas-p-utbildning-(.+)$/);
  if (basPMatch) {
    const city = cityMap[basPMatch[1]] || cap(basPMatch[1]);
    mt = `BAS P-utbildning ${city} — Byggarbetsmiljö | Kompetensutveckla`;
    md = `BAS P-utbildning i ${city}. Bli certifierad byggarbetsmiljösamordnare för planering. Boka kurs hos Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- BAS U stadssidor ---
  const basUMatch = slug.match(/^bas-u-utbildning-(.+)$/);
  if (basUMatch) {
    const city = cityMap[basUMatch[1]] || cap(basUMatch[1]);
    mt = `BAS U-utbildning ${city} — Byggarbetsmiljö | Kompetensutveckla`;
    md = `BAS U-utbildning i ${city}. Certifiering som byggarbetsmiljösamordnare för utförande. Boka hos Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- BAS P+U stadssidor ---
  const basPUMatch = slug.match(/^bas-p-och-bas-u-utbildning-(.+)$/);
  if (basPUMatch) {
    const city = cityMap[basPUMatch[1]] || cap(basPUMatch[1]);
    mt = `BAS P+U ${city} — Byggarbetsmiljösamordnare | Kompetensutveckla`;
    md = `Kombinerad BAS P och BAS U-utbildning i ${city}. Bli certifierad byggarbetsmiljösamordnare. Boka hos Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- BAM kurser (ej stad) ---
  if (slug.includes('bam-battre-arbetsmiljo') || slug === 'bam-livsmedel-distans' || slug === 'bam-livs' || slug === 'bam-kurs') {
    if (slug === 'bam-battre-arbetsmiljo-3-dagar') {
      mt = 'BAM-utbildning — Bättre Arbetsmiljö 3 Dagar | Kompetensutveckla';
      md = 'BAM-utbildning (Bättre Arbetsmiljö) – 3 dagars grundkurs för chefer, arbetsledare och skyddsombud. Boka idag hos Kompetensutveckla.';
    } else if (slug === 'bam-battre-arbetsmiljo-1-dag') {
      mt = 'BAM 1 Dag — Kort Arbetsmiljöutbildning | Kompetensutveckla';
      md = 'BAM-utbildning på 1 dag. Komprimerad arbetsmiljökurs för dig med begränsad tid. Grunderna i systematiskt arbetsmiljöarbete.';
    } else if (slug === 'bam-livsmedel-distans') {
      mt = 'BAM Livsmedel Distans — Arbetsmiljö | Kompetensutveckla';
      md = 'BAM-utbildning anpassad för livsmedelsbranschen. Distansutbildning i arbetsmiljö med branschspecifikt fokus. Boka online.';
    } else if (slug === 'bam-livs') {
      mt = 'BAM Livs — Arbetsmiljö Livsmedel | Kompetensutveckla';
      md = 'BAM Livs – arbetsmiljöutbildning för livsmedelsbranschen. Lär dig hantera risker och skapa en säker arbetsplats.';
    } else {
      mt = `${clean(raw)} | Kompetensutveckla`;
      md = `${clean(raw)} — arbetsmiljöutbildning hos Kompetensutveckla. Vi utbildar chefer och skyddsombud i hela Sverige.`;
    }
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- BAS kurser (ej stad) ---
  if (slug.includes('byggarbetsmiljosamordnare') || slug === 'bas-p-och-bas-u') {
    mt = 'BAS P + BAS U — Byggarbetsmiljösamordnare | Kompetensutveckla';
    md = 'Utbildning för byggarbetsmiljösamordnare (BAS P och BAS U). Bli certifierad enligt AFS 2023:3. Boka kurs.';
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- SAM ---
  if (slug.includes('systematiskt-arbetsmiljoarbete') || slug === 'sam-utbildning' || slug.startsWith('sam-')) {
    if (slug === 'sam-systematiskt-arbetsmiljoarbete') {
      mt = 'SAM-utbildning — Systematiskt Arbetsmiljöarbete | Kompetensutveckla';
      md = 'Utbildning i SAM (Systematiskt Arbetsmiljöarbete). Bygg ett fungerande arbetsmiljösystem enligt AFS 2001:1. Boka hos Kompetensutveckla.';
    } else {
      mt = `${clean(raw)} | SAM | Kompetensutveckla`;
      md = `${clean(raw)} — systematiskt arbetsmiljöarbete. Utbildning hos Kompetensutveckla.`;
    }
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Webbutbildningar ---
  if (slug.startsWith('webbutbildning')) {
    if (slug === 'webbutbildningar') {
      mt = 'Webbutbildningar — Arbetsmiljö Online | Kompetensutveckla';
      md = 'Webbutbildningar inom arbetsmiljö, säkerhet och ledarskap. Gå kursen online i din egen takt. Certifikat ingår.';
    } else {
      mt = `${clean(raw)} | Online | Kompetensutveckla`;
      md = `${clean(raw)} — webbutbildning hos Kompetensutveckla. Gå kursen online, certifikat ingår.`;
    }
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Engelska kurser ---
  if (slug.startsWith('engelska-') || slug.includes('-english') || slug.includes('english')) {
    mt = `${clean(raw)} | In English | Kompetensutveckla`;
    md = `${clean(raw)} — online training course in English. Certificate included. Book at Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Fysiska utbildningar ---
  if (slug.startsWith('fysiska-')) {
    if (slug === 'fysiska-utbildningar') {
      mt = 'Fysiska Utbildningar — Klassrum | Kompetensutveckla';
      md = 'Fysiska utbildningar i klassrum. Arbetsmiljö, ledarskap och säkerhet med erfarna utbildare. Boka via Kompetensutveckla.';
    } else {
      mt = `${clean(raw)} | Kompetensutveckla`;
      md = `${clean(raw)} — fysisk utbildning med erfarna utbildare. Boka plats hos Kompetensutveckla.`;
    }
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Ledarskap ---
  if (slug.includes('leda-andra') || slug.includes('ny-som-chef') || slug.includes('ledarskap')) {
    if (slug === 'att-leda-andra') {
      mt = 'Att Leda Andra — Ledarskapsutbildning | Kompetensutveckla';
      md = 'Ledarskapsutbildning "Att leda andra". Utveckla ditt ledarskap med praktiska verktyg. Boka kurs.';
    } else if (slug === 'ny-som-chef') {
      mt = 'Ny som Chef — Ledarskapsutbildning | Kompetensutveckla';
      md = 'Utbildning för dig som är ny som chef. Grunderna i ledarskap, kommunikation och arbetsmiljöansvar.';
    } else {
      mt = `${clean(raw)} | Ledarskap | Kompetensutveckla`;
      md = `${clean(raw)} — ledarskapsutbildning hos Kompetensutveckla. Utveckla ditt ledarskap.`;
    }
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- HLR ---
  if (slug.includes('hlr') || slug.includes('hjart-lung')) {
    mt = 'HLR — Hjärt-lungräddning | Kompetensutveckla';
    md = 'HLR-utbildning (hjärt-lungräddning). Lär dig livräddande första hjälpen. Certifikat ingår.';
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Elsäkerhet / Elbam ---
  if (slug.includes('elsakerhet') || slug.includes('elbam') || slug.includes('el-bam')) {
    if (slug === 'elbam') {
      mt = 'Elbam — Elsäkerhetsutbildning | Kompetensutveckla';
      md = 'Elbam – elsäkerhetsutbildning för arbete med el. Regler, risker och säkra rutiner. Boka kurs.';
    } else {
      mt = `${clean(raw)} | Elsäkerhet | Kompetensutveckla`;
      md = `${clean(raw)} — elsäkerhetsutbildning. Arbeta säkert med el. Boka hos Kompetensutveckla.`;
    }
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Skyddsombud ---
  if (slug.includes('skyddsombud')) {
    mt = `${clean(raw)} | Kompetensutveckla`;
    md = `${clean(raw)} — skyddsombudsutbildning. Lär dig rättigheter och skyldigheter. Boka hos Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- OSA ---
  if (slug.includes('osa') || slug.includes('organisatorisk')) {
    mt = `${clean(raw)} | OSA | Kompetensutveckla`;
    md = `${clean(raw)} — utbildning i organisatorisk och social arbetsmiljö. Boka hos Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Ställning / fallskydd ---
  if (slug.includes('stallning') || slug.includes('fallskydd')) {
    mt = `${clean(raw)} | Kompetensutveckla`;
    md = `${clean(raw)} — utbildning i arbete på höjd och säkerhet. Certifikat ingår. Boka hos Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Kris / brand ---
  if (slug.includes('kris') || slug.includes('brand') || slug.includes('utrymning')) {
    mt = `${clean(raw)} | Kompetensutveckla`;
    md = `${clean(raw)} — kris- och säkerhetsutbildning. Förbered dig för nödsituationer. Boka kurs.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Nattarbete ---
  if (slug.includes('nattarbete') || slug.includes('skiftarbete')) {
    mt = `${clean(raw)} | Kompetensutveckla`;
    md = `${clean(raw)} — arbetsmiljö vid natt- och skiftarbete. Utbildning hos Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Kunskapsbanken ---
  if (slug.includes('kunskapsbank')) {
    mt = `${clean(raw)} | Kunskapsbanken | Kompetensutveckla`;
    md = `${clean(raw)} — läs mer i Kompetensutvecklas kunskapsbank om arbetsmiljö och säkerhet.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Informationssidor ---
  if (slug === 'vara-tjanster') {
    return { mt: 'Våra Tjänster — Arbetsmiljöutbildning | Kompetensutveckla', md: 'Kompetensutveckla erbjuder utbildningar inom arbetsmiljö, säkerhet och ledarskap. Se vårt kompletta utbud.' };
  }
  if (slug === 'om-oss') {
    return { mt: 'Om Oss — Kompetensutveckla | Arbetsmiljöutbildning', md: 'Kompetensutveckla utbildar chefer, arbetsledare och skyddsombud i hela Sverige. Läs mer om oss.' };
  }
  if (slug === 'kontakta-oss' || slug === 'kontakt') {
    return { mt: 'Kontakta Oss — Kompetensutveckla', md: 'Kontakta Kompetensutveckla för frågor om utbildningar. Vi hjälper dig hitta rätt kurs inom arbetsmiljö.' };
  }
  if (slug === 'vara-utbildningar') {
    return { mt: 'Alla Utbildningar — Arbetsmiljö & Säkerhet | Kompetensutveckla', md: 'Se alla utbildningar hos Kompetensutveckla. BAM, BAS P/U, SAM, ledarskap, elsäkerhet och mer. Boka idag.' };
  }

  // --- Startsida ---
  if (!slug || slug === 'hem' || slug === 'startsida') {
    return { mt: 'Kompetensutveckla — Arbetsmiljöutbildning för Hela Sverige', md: 'Kompetensutveckla erbjuder BAM, BAS P/U, SAM och fler arbetsmiljöutbildningar. Webb och klassrum. Certifikat ingår.' };
  }

  // --- Kontroll/besiktning ---
  if (slug.includes('kontroll') || slug.includes('besiktning')) {
    mt = `${clean(raw)} | Kompetensutveckla`;
    md = `${clean(raw)} — utbildning i kontroll och besiktning. Certifiering via Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // --- Rutiner ---
  if (slug.includes('rutin') || slug.includes('checklista')) {
    mt = `${clean(raw)} | Kompetensutveckla`;
    md = `${clean(raw)} — praktiska verktyg för arbetsmiljöarbete. Kompetensutveckla.`;
    return { mt: trim60(mt), md: trim160(md) };
  }

  // === FALLBACK ===
  mt = `${clean(raw)} | Kompetensutveckla`;
  md = `${clean(raw)} — utbildning och information hos Kompetensutveckla. Kurser inom arbetsmiljö, säkerhet och ledarskap.`;
  return { mt: trim60(mt), md: trim160(md) };
}

function clean(t) {
  if (!t) return '';
  return t.replace(/\s*[-–—|]\s*Kompetensutveckla.*$/i, '').replace(/\s+/g, ' ').trim();
}

function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function trim60(t) {
  if (t.length <= 60) return t;
  // Try removing " | Kompetensutveckla"
  const shorter = t.replace(/\s*\|\s*Kompetensutveckla$/, '');
  if (shorter.length <= 60) return shorter;
  return t.substring(0, 57) + '...';
}

function trim160(d) {
  if (d.length <= 160) return d;
  return d.substring(0, 157) + '...';
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// === MAIN ===
async function main() {
  console.log('=== Kompetensutveckla.se Meta Updater (REST API) ===\n');

  // 1. Fetch all pages
  const allPages = await fetchAllPages();

  // Filter internal pages
  const skipSlugs = ['kursmaterial', 'personalportal', 'statkraft', 'fortum', 'min-sida', 'cart', 'checkout', 'kassa', 'varukorg'];
  const pages = allPages.filter(p => {
    if (!p.slug) return false;
    if (skipSlugs.some(s => p.slug.toLowerCase().includes(s))) return false;
    return true;
  });

  console.log(`Sidor att uppdatera: ${pages.length} (hoppade över ${allPages.length - pages.length})\n`);

  // 2. Generate meta for all pages
  const updates = pages.map(p => {
    const { mt, md } = generateMeta(p);
    return { id: p.id, slug: p.slug, title: mt, desc: md };
  });

  // Stats
  const avgTitle = Math.round(updates.reduce((s, u) => s + u.title.length, 0) / updates.length);
  const avgDesc = Math.round(updates.reduce((s, u) => s + u.desc.length, 0) / updates.length);
  console.log(`Genererade meta: avg title ${avgTitle} tecken, avg desc ${avgDesc} tecken\n`);

  // 3. Batch update via REST
  let ok = 0, fail = 0;
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    const payload = batch.map(u => ({ id: u.id, title: u.title, desc: u.desc }));

    try {
      const results = await restCall('/searchboost/v1/bulk-meta', payload);
      if (Array.isArray(results)) {
        const batchOk = results.filter(r => r.ok).length;
        ok += batchOk;
        fail += results.length - batchOk;
      } else {
        console.log(`  UNEXPECTED: ${JSON.stringify(results).substring(0, 200)}`);
        fail += batch.length;
      }
    } catch (err) {
      console.log(`  ERROR batch ${Math.floor(i/BATCH_SIZE)+1}: ${err.message}`);
      fail += batch.length;
    }

    const done = Math.min(i + BATCH_SIZE, updates.length);
    const pct = Math.round((done / updates.length) * 100);
    process.stdout.write(`\r  Progress: ${done}/${updates.length} (${pct}%) — ${ok} OK, ${fail} FAIL`);

    if (i + BATCH_SIZE < updates.length) await sleep(DELAY_MS);
  }

  console.log('\n\n=== KLART ===');
  console.log(`Uppdaterade: ${ok}`);
  console.log(`Misslyckade: ${fail}`);
  console.log(`Totalt: ${updates.length}`);

  // 4. Show sample
  console.log('\n--- Exempel (5 slumpade) ---');
  for (let j = 0; j < 5; j++) {
    const idx = Math.floor(Math.random() * updates.length);
    const u = updates[idx];
    console.log(`  /${u.slug}/ → "${u.title}" (${u.title.length}c)`);
    console.log(`    ${u.desc} (${u.desc.length}c)`);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
