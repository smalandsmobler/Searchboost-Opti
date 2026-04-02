#!/usr/bin/env node
/**
 * Möbelrondellen — Fixar för Mattias (2026-04-02)
 *
 * 1. "Utforska sortimentet"-länken på startsidan fungerar inte
 * 2. "Slut för säsongen" på Rio hörnsoffa ska bort (finns i lager)
 */

const WP_URL = 'https://mobelrondellen.se';
const WP_USER = 'info@searchboost.se';
const WP_APP_PASSWORD = 'hYIn gxgU ZkNJ mlNp VELN cYrY';
const AUTH = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');

async function wp(method, endpoint, data = null) {
  const url = `${WP_URL}/wp-json/wp/v2/${endpoint}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Basic ${AUTH}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Searchboost-SEO-Fix/1.0'
    }
  };
  if (data) opts.body = JSON.stringify(data);
  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      console.error(`  ❌ ${method} ${endpoint}: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('  ', text.substring(0, 300));
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`  ❌ ${method} ${endpoint}: ${err.message}`);
    return null;
  }
}

async function woo(method, endpoint, data = null) {
  const url = `${WP_URL}/wp-json/wc/v3/${endpoint}`;
  const opts = {
    method,
    headers: {
      'Authorization': `Basic ${AUTH}`,
      'Content-Type': 'application/json',
      'User-Agent': 'Searchboost-SEO-Fix/1.0'
    }
  };
  if (data) opts.body = JSON.stringify(data);
  try {
    const res = await fetch(url, opts);
    if (!res.ok) {
      console.error(`  ❌ WOO ${method} ${endpoint}: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.error('  ', text.substring(0, 300));
      return null;
    }
    return await res.json();
  } catch (err) {
    console.error(`  ❌ WOO ${method} ${endpoint}: ${err.message}`);
    return null;
  }
}

async function investigateHomepage() {
  console.log('\n═══ 1. STARTSIDAN — "Utforska sortimentet" ═══\n');

  // Homepage ID is 2093
  const page = await wp('GET', 'pages/2093?context=edit');
  if (!page) {
    console.log('  Kunde inte hämta startsidan med ID 2093');
    return;
  }

  console.log(`  Startsida: ID ${page.id}, title: "${page.title?.raw || page.title?.rendered}"`);

  const raw = page.content?.raw || '';
  const rendered = page.content?.rendered || '';

  // Search for "utforska" in content
  const searchIn = raw || rendered;
  const utforskaIdx = searchIn.toLowerCase().indexOf('utforska');
  if (utforskaIdx >= 0) {
    const start = Math.max(0, utforskaIdx - 300);
    const end = Math.min(searchIn.length, utforskaIdx + 300);
    console.log(`  ✅ Hittade "utforska" i innehållet (pos ${utforskaIdx}):`);
    console.log(`  ---`);
    console.log(`  ${searchIn.substring(start, end)}`);
    console.log(`  ---`);
  } else {
    console.log('  ⚠️ "utforska" INTE hittat i sidinnehållet');
    console.log(`  Content length: raw=${raw.length}, rendered=${rendered.length}`);
  }

  // Find all links in content
  const linkRegex = /href=["']([^"']*?)["']/gi;
  const allLinks = [...searchIn.matchAll(linkRegex)];
  if (allLinks.length > 0) {
    console.log(`\n  Alla länkar (${allLinks.length}):`);
    allLinks.forEach(l => console.log(`    → ${l[1]}`));
  } else {
    console.log('\n  Inga länkar hittade i raw content');
    console.log('  Innehållet kan vara i Elementor/Divi/SiteOrigin page builder data...');
  }

  // Check meta for page builder content
  if (page.meta) {
    const metaKeys = Object.keys(page.meta);
    console.log(`\n  Meta-fält (${metaKeys.length}): ${metaKeys.join(', ')}`);

    // Check Elementor data
    for (const key of metaKeys) {
      const val = String(page.meta[key] || '');
      if (val.toLowerCase().includes('utforska')) {
        console.log(`  🎯 Hittade "utforska" i meta.${key}:`);
        const idx = val.toLowerCase().indexOf('utforska');
        console.log(`    ${val.substring(Math.max(0, idx - 200), idx + 200)}`);
      }
    }
  }

  // Print first 2000 chars of raw content for analysis
  console.log('\n  Första 2000 tecken av raw content:');
  console.log('  ---');
  console.log(`  ${raw.substring(0, 2000)}`);
  console.log('  ---');
}

async function investigateRioSofa() {
  console.log('\n═══ 2. RIO HÖRNSOFFA — "Slut för säsongen" ═══\n');

  // Search via WooCommerce API
  const products = await woo('GET', 'products?search=rio&per_page=20');
  if (products && products.length > 0) {
    console.log(`  Hittade ${products.length} produkter med "rio":\n`);
    for (const p of products) {
      console.log(`  🎯 ID ${p.id}: "${p.name}"`);
      console.log(`    Slug: ${p.slug}`);
      console.log(`    Status: ${p.status}`);
      console.log(`    Stock status: ${p.stock_status}`);
      console.log(`    Catalog visibility: ${p.catalog_visibility}`);
      console.log(`    Tags: ${(p.tags || []).map(t => `${t.name}(ID:${t.id})`).join(', ')}`);
      console.log(`    Categories: ${(p.categories || []).map(c => c.name).join(', ')}`);
      if (p.short_description) console.log(`    Short desc: ${p.short_description.substring(0, 300)}`);
      if (p.description) {
        const desc = p.description.replace(/<[^>]*>/g, '');
        console.log(`    Description: ${desc.substring(0, 300)}`);
      }

      // Check for "slut" anywhere
      const allText = JSON.stringify(p).toLowerCase();
      if (allText.includes('slut') || allText.includes('säsong')) {
        console.log(`    ⚠️ INNEHÅLLER "slut"/"säsong"!`);
        if (p.short_description?.toLowerCase().includes('slut')) console.log('      → I short_description');
        if (p.description?.toLowerCase().includes('slut')) console.log('      → I description');
        if ((p.tags || []).some(t => t.name.toLowerCase().includes('slut'))) console.log('      → I tags');
        if (p.stock_status === 'outofstock') console.log('      → stock_status = outofstock');
        if (p.attributes) {
          p.attributes.forEach(a => {
            if (JSON.stringify(a).toLowerCase().includes('slut')) {
              console.log(`      → I attribute: ${a.name} = ${JSON.stringify(a.options)}`);
            }
          });
        }
        if (p.meta_data) {
          p.meta_data.forEach(m => {
            const val = String(m.value).toLowerCase();
            if (val.includes('slut') || val.includes('säsong')) {
              console.log(`      → I meta: ${m.key} = ${String(m.value).substring(0, 100)}`);
            }
          });
        }
      }
      console.log('');
    }
  } else {
    console.log('  Inga produkter hittade via WooCommerce API med "rio"');
  }

  // Also search for hörnsoffa
  console.log('  Söker "hörnsoffa"...');
  const soffor = await woo('GET', 'products?search=hörnsoffa&per_page=30');
  if (soffor && soffor.length > 0) {
    console.log(`  Hittade ${soffor.length} hörnsoffor:`);
    soffor.forEach(p => {
      const isRio = p.name.toLowerCase().includes('rio');
      const hasSlut = JSON.stringify(p).toLowerCase().includes('slut');
      console.log(`  ${isRio ? '🎯' : '  '} ID ${p.id}: "${p.name}" — stock: ${p.stock_status}${hasSlut ? ' ⚠️ HAR "slut"' : ''}`);
    });
  }

  // Check for tags with "slut"
  console.log('\n  Söker taggar med "slut"...');
  const tags = await woo('GET', 'products/tags?per_page=100');
  if (tags) {
    const slutTags = tags.filter(t =>
      t.name.toLowerCase().includes('slut') || t.name.toLowerCase().includes('säsong')
    );
    if (slutTags.length > 0) {
      console.log(`  Taggar med "slut"/"säsong":`);
      slutTags.forEach(t => console.log(`    Tag ID ${t.id}: "${t.name}" (${t.count} produkter)`));
    } else {
      console.log('  Inga taggar med "slut"/"säsong"');
    }
  }

  // Check product categories for "slut"
  console.log('\n  Söker kategorier med "slut"...');
  const cats = await woo('GET', 'products/categories?per_page=100');
  if (cats) {
    const slutCats = cats.filter(c =>
      c.name.toLowerCase().includes('slut') || c.name.toLowerCase().includes('säsong')
    );
    if (slutCats.length > 0) {
      console.log(`  Kategorier med "slut"/"säsong":`);
      slutCats.forEach(c => console.log(`    Cat ID ${c.id}: "${c.name}" (${c.count} produkter)`));
    } else {
      console.log('  Inga kategorier med "slut"/"säsong"');
    }
  }
}

async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║  Möbelrondellen — Undersöker problem (Mattias)      ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  await investigateHomepage();
  await investigateRioSofa();

  console.log('\n═══ UNDERSÖKNING KLAR ═══\n');
}

main().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
