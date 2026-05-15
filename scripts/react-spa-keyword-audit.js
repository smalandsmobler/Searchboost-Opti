#!/usr/bin/env node
/**
 * React SPA Keyword Density Audit
 *
 * Analyserar varje kategori- och subcategory-sida i en React SPA mot
 * sitt focus keyword. Eftersom innehållet är statiskt i siteData.ts
 * får vi exakt textmängd som faktiskt renderas till användaren och
 * Google (efter JS-rendering).
 *
 * Användning:
 *   node scripts/react-spa-keyword-audit.js <path-to-siteData.ts> [--json]
 *
 * Exempel:
 *   node scripts/react-spa-keyword-audit.js \
 *     /Users/weerayootandersson/Downloads/kimi-mobelrondellen/app/src/data/siteData.ts
 */

const fs = require('fs');
const path = require('path');
const { analyzeDensity } = require('../lambda-functions/lib/keyword-density');

function loadSiteData(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');

  // Extrahera kategorier via regex (snabb och säker — ingen TS-eval)
  // Vi letar efter category-objekt mellan slug: '...' och nästa slug: '...'
  const categories = [];
  const catRe = /\{\s*slug:\s*['"]([\w-]+)['"][\s\S]*?title:\s*['"]([^'"]+)['"][\s\S]*?subtitle:\s*['"]([^'"]+)['"][\s\S]*?intro:\s*['"]([^'"]+)['"][\s\S]*?tipTitle:\s*['"]([^'"]+)['"][\s\S]*?tipText:\s*['"]([^'"]+)['"][\s\S]*?subcategories:\s*\[([\s\S]*?)\n\s{4}\],/g;

  let m;
  while ((m = catRe.exec(src)) !== null) {
    const [, slug, title, subtitle, intro, tipTitle, tipText, subsBlock] = m;
    const subcategories = [];
    const subRe = /\{\s*id:\s*\d+,\s*name:\s*['"]([^'"]+)['"],\s*slug:\s*['"]([\w-]+)['"][\s\S]*?count:\s*(\d+)/g;
    let sm;
    while ((sm = subRe.exec(subsBlock)) !== null) {
      const [, name, sslug, count] = sm;
      subcategories.push({ name, slug: sslug, count: Number(count) });
    }
    categories.push({ slug, title, subtitle, intro, tipTitle, tipText, subcategories });
  }

  return categories;
}

/**
 * Bygg den faktiska texten som syns på en KategoriPage
 * (PageHero eyebrow + title + subtitle + intro + tip + subcategory-namn)
 */
function buildCategoryPageText(cat) {
  const parts = [
    cat.title,
    cat.subtitle,
    cat.title.toUpperCase(),
    `Välj kategori — vi har över ${cat.subcategories.reduce((s, x) => s + x.count, 0)} produkter`,
    cat.intro,
    cat.tipTitle,
    cat.tipText,
    ...cat.subcategories.map(s => s.name),
    ...cat.subcategories.map(s => `${s.count} produkter`),
    'Behöver du hjälp att välja?',
    `Våra möbelexperter hjälper dig hitta rätt ${cat.title.toLowerCase()} för ditt hem och din budget.`,
    'Kontakta oss',
    'Hitta butiken',
    'Möbelrondellen i Mora · Familjeföretag sedan 1990'
  ];
  return parts.join(' ');
}

/**
 * Bygg den faktiska texten som syns på en SubkategoriPage
 */
function buildSubcategoryPageText(cat, sub) {
  const parts = [
    cat.title.toUpperCase(),
    sub.name,
    `${sub.count} produkter — välj bland marknadens bästa`,
    cat.title,
    sub.name,
    `${sub.count} produkter visas — ${sub.count} finns i butiken`,
    `Se alla ${sub.count}`,
    'Behöver du hjälp?',
    `Fri rådgivning — vi hittar rätt ${sub.name.toLowerCase()} åt dig`,
    `Våra möbelexperter hjälper dig välja rätt storlek, material och stil för ditt hem.`,
    'Besök oss i Mora eller ring oss — helt utan kostnad.',
    'Kontakta oss',
    `Fler kategorier i ${cat.title}`,
    'Alla kategorier'
  ];
  return parts.join(' ');
}

/**
 * Härled focus keyword från sidnamn
 * (i ett riktigt system ska detta komma från en kund-konfig)
 */
function deriveKeyword(name) {
  return name.toLowerCase().trim();
}

function runAudit(siteDataPath, opts = {}) {
  const cats = loadSiteData(siteDataPath);
  if (cats.length === 0) {
    console.error('FEL: Inga kategorier hittades i', siteDataPath);
    process.exit(1);
  }

  const findings = [];

  for (const cat of cats) {
    // Kategori-sida
    const catText = buildCategoryPageText(cat);
    const catKw = deriveKeyword(cat.title);
    const catResult = analyzeDensity(catText, catKw);
    findings.push({
      page: `/kollektioner/${cat.slug}`,
      type: 'category',
      title: cat.title,
      focusKeyword: catKw,
      ...catResult
    });

    // Subkategori-sidor
    for (const sub of cat.subcategories) {
      const subText = buildSubcategoryPageText(cat, sub);
      const subKw = deriveKeyword(sub.name);
      const subResult = analyzeDensity(subText, subKw);
      findings.push({
        page: `/kollektioner/${cat.slug}/${sub.slug}`,
        type: 'subcategory',
        title: sub.name,
        focusKeyword: subKw,
        ...subResult
      });
    }
  }

  // Sortera: problem först
  const STATUS_ORDER = { missing: 0, thin_content: 1, high: 2, low: 3, borderline_high: 4, ok: 5 };
  findings.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  if (opts.json) {
    console.log(JSON.stringify(findings, null, 2));
    return findings;
  }

  // Human-readable summary
  const stats = {
    total: findings.length,
    missing: findings.filter(f => f.status === 'missing').length,
    thin_content: findings.filter(f => f.status === 'thin_content').length,
    low: findings.filter(f => f.status === 'low').length,
    ok: findings.filter(f => f.status === 'ok').length,
    high: findings.filter(f => f.status === 'high').length,
    borderline_high: findings.filter(f => f.status === 'borderline_high').length
  };

  console.log(`\n═══ KEYWORD DENSITY AUDIT ═══`);
  console.log(`Källa: ${siteDataPath}`);
  console.log(`Totalt: ${stats.total} sidor analyserade\n`);
  console.log(`Status:`);
  console.log(`  saknas:          ${stats.missing}`);
  console.log(`  thin content:    ${stats.thin_content}  (< 80 ord)`);
  console.log(`  låg (<0.5%):     ${stats.low}`);
  console.log(`  ok (0.5–2.5%):   ${stats.ok}`);
  console.log(`  borderline:      ${stats.borderline_high}`);
  console.log(`  hög (>3%):       ${stats.high}\n`);

  // Visa problem-sidor
  const problems = findings.filter(f => f.status !== 'ok');
  if (problems.length > 0) {
    console.log(`\n═══ ${problems.length} sidor kräver åtgärd ═══\n`);
    for (const f of problems) {
      const icon = f.status === 'missing' ? '⚠️ ' : f.status === 'high' ? '🔺' : f.status === 'low' ? '🔻' : '⚠️ ';
      console.log(`${icon} ${f.page}`);
      console.log(`   Focus keyword: "${f.focusKeyword}"`);
      console.log(`   Densitet: ${f.density}%   (${f.count}/${f.totalWords} ord)   Status: ${f.status}`);
      if (f.matchedVariants.length > 0) {
        console.log(`   Matchade varianter: ${f.matchedVariants.join(', ')}`);
      }
      if (f.recommendation) {
        console.log(`   → ${f.recommendation}`);
      }
      console.log('');
    }
  }

  // Visa OK-sidor i kort lista
  const ok = findings.filter(f => f.status === 'ok');
  if (ok.length > 0) {
    console.log(`\n═══ ${ok.length} sidor OK (referens) ═══`);
    for (const f of ok.slice(0, 10)) {
      console.log(`  ✅ ${f.page.padEnd(55)}  ${f.density.toFixed(2)}%  (${f.count}/${f.totalWords})`);
    }
    if (ok.length > 10) console.log(`  ... och ${ok.length - 10} till`);
  }

  return findings;
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const json = args.includes('--json');
  const filePath = args.find(a => !a.startsWith('--'));
  if (!filePath) {
    console.error('Användning: node react-spa-keyword-audit.js <path-to-siteData.ts> [--json]');
    process.exit(1);
  }
  runAudit(path.resolve(filePath), { json });
}

module.exports = { runAudit, loadSiteData, buildCategoryPageText, buildSubcategoryPageText };
