#!/usr/bin/env node
/**
 * Add internal links to all searchboost.se pages that lack them.
 * Groups: SEO-skola, Stadsidor, Tjanstesidor, Case studies, Ovriga
 */

const fs = require('fs');
const config = JSON.parse(fs.readFileSync(__dirname + '/config.json', 'utf8'));
const site = config.sites.searchboost;
const BASE = site.url + '/wp-json/wp/v2';
const AUTH = 'Basic ' + Buffer.from(site.username + ':' + site.app_password).toString('base64');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function wpGet(pageId) {
  const res = await fetch(`${BASE}/pages/${pageId}?context=edit`, {
    headers: { Authorization: AUTH }
  });
  if (!res.ok) throw new Error(`GET ${pageId} failed: ${res.status}`);
  return res.json();
}

async function wpUpdate(pageId, content) {
  const res = await fetch(`${BASE}/pages/${pageId}`, {
    method: 'POST',
    headers: {
      Authorization: AUTH,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`POST ${pageId} failed: ${res.status} - ${txt.substring(0, 200)}`);
  }
  return res.json();
}

// ============================================================
// PAGE CATALOG
// ============================================================

const seoSkola = {
  1901: { slug: 'vad-ar-seo', title: 'Vad ar SEO?', path: '/seo-skola/vad-ar-seo/' },
  1902: { slug: 'hur-fungerar-google', title: 'Hur fungerar Google?', path: '/seo-skola/hur-fungerar-google/' },
  1903: { slug: 'rankingfaktorer', title: 'Googles rankingfaktorer 2026', path: '/seo-skola/rankingfaktorer/' },
  1904: { slug: 'nyckelordsforskning', title: 'Nyckelordsforskning', path: '/seo-skola/nyckelordsforskning/' },
  1905: { slug: 'teknisk-seo', title: 'Teknisk SEO', path: '/seo-skola/teknisk-seo/' },
  1906: { slug: 'seo-texter', title: 'SEO-texter', path: '/seo-skola/seo-texter/' },
  1907: { slug: 'lankbygge', title: 'Lankbygge och backlinks', path: '/seo-skola/lankbygge/' },
  1908: { slug: 'lokal-seo', title: 'Lokal SEO', path: '/seo-skola/lokal-seo/' },
  1909: { slug: 'mobile-seo', title: 'Mobil SEO', path: '/seo-skola/mobile-seo/' },
  1910: { slug: 'page-speed', title: 'Page Speed och Core Web Vitals', path: '/seo-skola/page-speed-core-web-vitals/' },
  1911: { slug: 'schema-markup', title: 'Schema Markup', path: '/seo-skola/schema-markup/' },
  1912: { slug: 'interna-lankar', title: 'Internlankar', path: '/seo-skola/interna-lankar/' },
  1913: { slug: 'content-gaps', title: 'Content Gap-analys', path: '/seo-skola/content-gaps/' },
  1914: { slug: 'domain-authority', title: 'Domain Authority', path: '/seo-skola/domain-authority/' },
  1915: { slug: 'google-search-console', title: 'Google Search Console', path: '/seo-skola/google-search-console/' },
  1916: { slug: 'google-business-profile', title: 'Google Business Profile', path: '/seo-skola/google-business-profile/' },
  1917: { slug: 'lokala-citationer', title: 'Lokala citationer', path: '/seo-skola/lokala-citationer/' },
  1918: { slug: 'seo-vs-sem', title: 'SEO vs SEM', path: '/seo-skola/seo-vs-sem/' },
  1919: { slug: 'vad-kostar-seo', title: 'Vad kostar SEO?', path: '/seo-skola/vad-kostar-seo/' },
  1920: { slug: 'hur-lang-tid-tar-seo', title: 'Hur lang tid tar SEO?', path: '/seo-skola/hur-lang-tid-tar-seo/' },
  1921: { slug: 'seo-strategi-smaforetag', title: 'SEO-strategi for smaforetag', path: '/seo-skola/seo-strategi-smaforetag/' },
  1922: { slug: 'seo-rapportering', title: 'SEO-rapportering', path: '/seo-skola/seo-rapportering/' },
  1923: { slug: 'wordpress-seo', title: 'WordPress SEO', path: '/seo-skola/wordpress-seo/' },
  1924: { slug: 'varfor-seo-2026', title: 'Varfor SEO ar viktigt 2026', path: '/seo-skola/varfor-seo-2026/' },
  1925: { slug: 'title-meta-description', title: 'Title-taggar och Meta Descriptions', path: '/seo-skola/title-meta-description/' },
  2595: { slug: 'vad-ar-seo-audit', title: 'Vad ar en SEO-audit?', path: '/seo-skola/vad-ar-seo-audit/' },
  2596: { slug: 'seo-for-smaforetag', title: 'SEO for smaforetag', path: '/seo-skola/seo-for-smaforetag/' },
  2597: { slug: 'hur-bygger-man-backlinks', title: 'Hur bygger man backlinks?', path: '/seo-skola/hur-bygger-man-backlinks/' },
  2804: { slug: 'seo-optimeringar', title: 'SEO-optimeringar forklarade', path: '/seo-optimeringar/' },
};

const stadsidor = {
  2090: { city: 'Boras', path: '/seo-byra-boras/' },
  2091: { city: 'Goteborg', path: '/seo-byra-goteborg/' },
  2092: { city: 'Helsingborg', path: '/seo-byra-helsingborg/' },
  2093: { city: 'Karlstad', path: '/seo-byra-karlstad/' },
  2094: { city: 'Lund', path: '/seo-byra-lund/' },
  2095: { city: 'Malmo', path: '/seo-byra-malmo/' },
  2096: { city: 'Orebro', path: '/seo-byra-orebro/' },
  2097: { city: 'Stockholm', path: '/seo-byra-stockholm/' },
  2098: { city: 'Uppsala', path: '/seo-byra-uppsala/' },
  2099: { city: 'Vasteras', path: '/seo-byra-vasteras/' },
  1930: { city: 'Linkoping', path: '/seo-byra-linkoping/' },
  1931: { city: 'Norrkoping', path: '/seo-byra-norrkoping/' },
  1932: { city: 'Jonkoping', path: '/seo-byra-jonkoping/' },
  1933: { city: 'Vaxjo', path: '/seo-byra-vaxjo/' },
  1934: { city: 'Varnamo', path: '/seo-byra-varnamo/' },
  1935: { city: 'Halmstad', path: '/seo-byra-halmstad/' },
  1936: { city: 'Kalmar', path: '/seo-byra-kalmar/' },
};

// ============================================================
// LINK DEFINITIONS PER GROUP
// ============================================================

function getSeoSkolaLinks(excludeId) {
  // Topic clusters: group related pages
  const clusters = {
    basics: [1901, 1902, 1903, 1924],         // fundamentals
    keywords: [1904, 1913, 1906],              // keywords + content
    technical: [1905, 1910, 1911, 1909, 1925], // technical
    offpage: [1907, 1914, 2597, 1912],         // links + authority
    local: [1908, 1916, 1917],                 // local
    strategy: [1919, 1920, 1921, 1918, 1922],  // business/strategy
    tools: [1915, 1923, 2595],                 // tools + audit
    advanced: [2596, 2804],                    // additional
  };

  // Find which cluster the current page belongs to
  let ownCluster = null;
  for (const [name, ids] of Object.entries(clusters)) {
    if (ids.includes(excludeId)) { ownCluster = name; break; }
  }

  // Pick links: prefer same cluster first, then spread across others
  const selected = [];
  const allIds = Object.keys(seoSkola).map(Number);

  // Same cluster pages first (excluding self)
  if (ownCluster) {
    for (const id of clusters[ownCluster]) {
      if (id !== excludeId && selected.length < 3) selected.push(id);
    }
  }

  // Then add from other clusters to reach 6-7 total
  const shuffled = allIds.filter(id => id !== excludeId && !selected.includes(id));
  // Deterministic "shuffle" based on excludeId
  shuffled.sort((a, b) => ((a * excludeId) % 97) - ((b * excludeId) % 97));
  while (selected.length < 6 && shuffled.length > 0) {
    selected.push(shuffled.shift());
  }

  // Build link HTML
  let links = selected.map(id => {
    const p = seoSkola[id];
    return `<li><a href="${p.path}">${p.title}</a></li>`;
  });

  // Always add CTA link
  links.push('<li><a href="/tjanster/">Vara SEO-tjanster</a></li>');
  links.push('<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>');

  return links;
}

function getStadsLinks(excludeId) {
  const links = [
    '<li><a href="/tjanster/">Vara SEO-tjanster</a></li>',
    '<li><a href="/tjanster/seo-audit-tjanst/">SEO-audit</a></li>',
    '<li><a href="/tjanster/lokal-seo/">Lokal SEO</a></li>',
    '<li><a href="/case-studies/">Case studies</a></li>',
    '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
    '<li><a href="/vanliga-fragor/">Vanliga fragor om SEO</a></li>',
  ];

  // Add 2 nearby city links
  const cityIds = Object.keys(stadsidor).map(Number).filter(id => id !== excludeId);
  // Pick 2 deterministically
  cityIds.sort((a, b) => ((a * excludeId) % 53) - ((b * excludeId) % 53));
  for (let i = 0; i < 2 && i < cityIds.length; i++) {
    const c = stadsidor[cityIds[i]];
    links.push(`<li><a href="${c.path}">SEO-byra i ${c.city}</a></li>`);
  }

  return links;
}

// Tjanstesidor link map
const tjansteLinks = {
  1926: { // /tjanster/
    title: 'Utforska vara tjanster',
    links: [
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/seo-skola/nyckelordsforskning/">Nyckelordsforskning</a></li>',
      '<li><a href="/seo-skola/teknisk-seo/">Teknisk SEO</a></li>',
      '<li><a href="/seo-skola/lokal-seo/">Lokal SEO</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/case-studies/">Vara case studies</a></li>',
    ]
  },
  2043: { // /tjanster/lokal-seo/
    title: 'Las mer om lokal SEO',
    links: [
      '<li><a href="/seo-skola/lokal-seo/">Lokal SEO-guiden</a></li>',
      '<li><a href="/seo-skola/google-business-profile/">Google Business Profile</a></li>',
      '<li><a href="/seo-skola/lokala-citationer/">Lokala citationer</a></li>',
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/case-studies/">Vara case studies</a></li>',
    ]
  },
  2021: { // /tjanster/seo-audit-tjanst/
    title: 'Las mer om SEO-audit',
    links: [
      '<li><a href="/seo-skola/vad-ar-seo-audit/">Vad ar en SEO-audit?</a></li>',
      '<li><a href="/seo-skola/teknisk-seo/">Teknisk SEO</a></li>',
      '<li><a href="/seo-skola/page-speed-core-web-vitals/">Page Speed och Core Web Vitals</a></li>',
      '<li><a href="/seo-skola/google-search-console/">Google Search Console</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/case-studies/">Vara case studies</a></li>',
    ]
  },
  1929: { // /tjanster/e-handel-seo/
    title: 'Las mer om e-handel och SEO',
    links: [
      '<li><a href="/seo-skola/nyckelordsforskning/">Nyckelordsforskning</a></li>',
      '<li><a href="/seo-skola/teknisk-seo/">Teknisk SEO</a></li>',
      '<li><a href="/seo-skola/seo-texter/">SEO-texter</a></li>',
      '<li><a href="/seo-skola/schema-markup/">Schema Markup</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/case-studies/">Vara case studies</a></li>',
    ]
  },
  1570: { // /seo-optimering/
    title: 'Las mer om SEO-optimering',
    links: [
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/seo-skola/rankingfaktorer/">Googles rankingfaktorer</a></li>',
      '<li><a href="/seo-skola/seo-texter/">SEO-texter</a></li>',
      '<li><a href="/seo-skola/vad-kostar-seo/">Vad kostar SEO?</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/case-studies/">Vara case studies</a></li>',
    ]
  },
  1030: { // /google-ads-sem/
    title: 'Las mer om sokenmarknading',
    links: [
      '<li><a href="/seo-skola/seo-vs-sem/">SEO vs SEM</a></li>',
      '<li><a href="/seo-skola/nyckelordsforskning/">Nyckelordsforskning</a></li>',
      '<li><a href="/seo-skola/seo-rapportering/">SEO-rapportering</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/case-studies/">Vara case studies</a></li>',
      '<li><a href="/tjanster/">Alla vara tjanster</a></li>',
    ]
  },
  1037: { // /sociala-medier/
    title: 'Las mer om digital marknadsforing',
    links: [
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/seo-skola/content-gaps/">Content Gap-analys</a></li>',
      '<li><a href="/seo-skola/seo-strategi-smaforetag/">SEO-strategi for smaforetag</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/case-studies/">Vara case studies</a></li>',
      '<li><a href="/tjanster/">Alla vara tjanster</a></li>',
    ]
  },
  1020: { // /webbutveckling/
    title: 'Las mer om webbutveckling och SEO',
    links: [
      '<li><a href="/seo-skola/wordpress-seo/">WordPress SEO</a></li>',
      '<li><a href="/seo-skola/teknisk-seo/">Teknisk SEO</a></li>',
      '<li><a href="/seo-skola/page-speed-core-web-vitals/">Page Speed och Core Web Vitals</a></li>',
      '<li><a href="/seo-skola/mobile-seo/">Mobil SEO</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/case-studies/">Vara case studies</a></li>',
    ]
  },
};

// Case studies
const caseLinks = {
  1937: { // /case-studies/ (index)
    title: 'Las mer',
    links: [
      '<li><a href="/case-studies/mobelforetag-smaland/">Case: Mobelforetag i Smaland</a></li>',
      '<li><a href="/case-studies/konsultforetag-seo/">Case: Konsultforetag</a></li>',
      '<li><a href="/case-studies/ehandel-kontorsmobler/">Case: E-handel kontorsmobler</a></li>',
      '<li><a href="/tjanster/">Vara SEO-tjanster</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
    ]
  },
  1938: { // ehandel-kontorsmobler
    title: 'Las mer',
    links: [
      '<li><a href="/tjanster/e-handel-seo/">E-handel SEO</a></li>',
      '<li><a href="/tjanster/">Vara SEO-tjanster</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/seo-skola/nyckelordsforskning/">Nyckelordsforskning</a></li>',
      '<li><a href="/seo-skola/teknisk-seo/">Teknisk SEO</a></li>',
      '<li><a href="/seo-skola/seo-texter/">SEO-texter</a></li>',
    ]
  },
  1939: { // konsultforetag-seo
    title: 'Las mer',
    links: [
      '<li><a href="/tjanster/">Vara SEO-tjanster</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/seo-skola/seo-strategi-smaforetag/">SEO-strategi for smaforetag</a></li>',
      '<li><a href="/seo-skola/content-gaps/">Content Gap-analys</a></li>',
      '<li><a href="/seo-skola/lankbygge/">Lankbygge och backlinks</a></li>',
    ]
  },
  1940: { // mobelforetag-smaland
    title: 'Las mer',
    links: [
      '<li><a href="/tjanster/">Vara SEO-tjanster</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/seo-skola/lokal-seo/">Lokal SEO</a></li>',
      '<li><a href="/seo-skola/vad-kostar-seo/">Vad kostar SEO?</a></li>',
      '<li><a href="/seo-skola/hur-lang-tid-tar-seo/">Hur lang tid tar SEO?</a></li>',
    ]
  },
};

// Ovriga sidor
const ovrigaLinks = {
  2161: { // /gratis-seo-analys/
    title: 'Las mer om SEO',
    links: [
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/seo-skola/vad-ar-seo-audit/">Vad ar en SEO-audit?</a></li>',
      '<li><a href="/seo-skola/vad-kostar-seo/">Vad kostar SEO?</a></li>',
      '<li><a href="/tjanster/">Vara tjanster</a></li>',
      '<li><a href="/case-studies/">Case studies</a></li>',
      '<li><a href="/vanliga-fragor/">Vanliga fragor om SEO</a></li>',
    ]
  },
  2130: { // /om-oss/
    title: 'Utforska mer',
    links: [
      '<li><a href="/tjanster/">Vara tjanster</a></li>',
      '<li><a href="/case-studies/">Case studies</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/seo-skola/varfor-seo-2026/">Varfor SEO ar viktigt 2026</a></li>',
    ]
  },
  2020: { // /vanliga-fragor/
    title: 'Las mer i var SEO-skola',
    links: [
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/seo-skola/hur-lang-tid-tar-seo/">Hur lang tid tar SEO?</a></li>',
      '<li><a href="/seo-skola/vad-kostar-seo/">Vad kostar SEO?</a></li>',
      '<li><a href="/seo-skola/rankingfaktorer/">Googles rankingfaktorer</a></li>',
      '<li><a href="/tjanster/">Vara tjanster</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
    ]
  },
  1942: { // /seo-ordlista/
    title: 'Las mer i var SEO-skola',
    links: [
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/seo-skola/teknisk-seo/">Teknisk SEO</a></li>',
      '<li><a href="/seo-skola/nyckelordsforskning/">Nyckelordsforskning</a></li>',
      '<li><a href="/seo-skola/lankbygge/">Lankbygge och backlinks</a></li>',
      '<li><a href="/tjanster/">Vara tjanster</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
    ]
  },
  883: { // / (startsidan)
    title: 'Utforska mer',
    links: [
      '<li><a href="/tjanster/">Vara SEO-tjanster</a></li>',
      '<li><a href="/seo-skola/vad-ar-seo/">Vad ar SEO?</a></li>',
      '<li><a href="/seo-skola/varfor-seo-2026/">Varfor SEO ar viktigt 2026</a></li>',
      '<li><a href="/case-studies/">Case studies</a></li>',
      '<li><a href="/gratis-seo-analys/">Boka gratis SEO-analys</a></li>',
      '<li><a href="/vanliga-fragor/">Vanliga fragor om SEO</a></li>',
    ]
  },
};

// ============================================================
// BUILD LINK BLOCK HTML
// ============================================================

function buildLinkBlock(heading, linkItems) {
  return `\n\n<div class="related-links" style="margin-top:48px;padding:32px;background:#f8f9fa;border-radius:12px">\n<h3>${heading}</h3>\n<ul style="columns:2;column-gap:24px">\n${linkItems.join('\n')}\n</ul>\n</div>`;
}

// ============================================================
// MAIN
// ============================================================

async function processPage(pageId, heading, linkItems) {
  try {
    const page = await wpGet(pageId);
    const raw = page.content?.raw || '';

    // Skip if already has related-links
    if (raw.includes('class="related-links"')) {
      console.log(`  SKIP ${pageId} (${page.slug}) — already has related-links`);
      return { id: pageId, status: 'skipped' };
    }

    const block = buildLinkBlock(heading, linkItems);
    const newContent = raw + block;

    await sleep(300);
    await wpUpdate(pageId, newContent);
    console.log(`  OK   ${pageId} (${page.slug})`);
    return { id: pageId, status: 'updated' };
  } catch (err) {
    console.error(`  FAIL ${pageId}: ${err.message}`);
    return { id: pageId, status: 'failed', error: err.message };
  }
}

async function main() {
  const results = [];
  let total = 0;

  // GRUPP 1 — SEO-skola
  console.log('\n=== GRUPP 1: SEO-skola ===');
  for (const id of Object.keys(seoSkola).map(Number)) {
    const links = getSeoSkolaLinks(id);
    results.push(await processPage(id, 'Las mer om SEO', links));
    total++;
    await sleep(500);
  }

  // GRUPP 2 — Stadsidor
  console.log('\n=== GRUPP 2: Stadsidor ===');
  for (const [id, info] of Object.entries(stadsidor)) {
    const links = getStadsLinks(Number(id));
    results.push(await processPage(Number(id), `SEO-resurser for foretag i ${info.city}`, links));
    total++;
    await sleep(500);
  }

  // GRUPP 3 — Tjanstesidor
  console.log('\n=== GRUPP 3: Tjanstesidor ===');
  for (const [id, info] of Object.entries(tjansteLinks)) {
    results.push(await processPage(Number(id), info.title, info.links));
    total++;
    await sleep(500);
  }

  // GRUPP 4 — Case studies
  console.log('\n=== GRUPP 4: Case studies ===');
  for (const [id, info] of Object.entries(caseLinks)) {
    results.push(await processPage(Number(id), info.title, info.links));
    total++;
    await sleep(500);
  }

  // GRUPP 5 — Ovriga
  console.log('\n=== GRUPP 5: Ovriga ===');
  for (const [id, info] of Object.entries(ovrigaLinks)) {
    results.push(await processPage(Number(id), info.title, info.links));
    total++;
    await sleep(500);
  }

  // Summary
  const updated = results.filter(r => r.status === 'updated').length;
  const skipped = results.filter(r => r.status === 'skipped').length;
  const failed = results.filter(r => r.status === 'failed').length;

  console.log(`\n========== SAMMANFATTNING ==========`);
  console.log(`Totalt:     ${total} sidor`);
  console.log(`Uppdaterade: ${updated}`);
  console.log(`Skippade:   ${skipped} (redan har internlankar)`);
  console.log(`Misslyckade: ${failed}`);
  if (failed > 0) {
    console.log('\nMisslyckade sidor:');
    results.filter(r => r.status === 'failed').forEach(r => {
      console.log(`  ID ${r.id}: ${r.error}`);
    });
  }
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
