#!/usr/bin/env node
/**
 * Generate output från scan-results.json — STEG 4-7
 *  - Per-domän HTML (dark Searchboost-brand, exakt Abelko-CSS)
 *  - Per-domän PDF via Playwright chromium
 *  - Ringlista .xlsx sorterad på lead-score desc
 *  - Sammanfattning .md
 */
'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = '/Users/weerayootandersson/Downloads/Searchboost-Opti';
const LEADS_DIR = path.join(ROOT, 'docs/leads/branscher-2026-04-16');
const ANALYSER_DIR = path.join(LEADS_DIR, 'analyser');
const SCAN_RESULTS = path.join(LEADS_DIR, 'scan-results.json');
const RINGLISTA_XLSX = path.join(LEADS_DIR, 'bransch-ringlista-2026-04-16.xlsx');
const SUMMARY_MD = path.join(LEADS_DIR, 'bransch-sammanfattning-2026-04-16.md');
const LOGO_PNG = path.join(ROOT, 'assets/brand/searchboost-logo.png');
const LOGO_SM_PNG = path.join(ROOT, 'assets/brand/searchboost-logo-sm.png');

const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) argMap[args[i].slice(2)] = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : true;
}
const ONLY = argMap.only ? String(argMap.only).split(',') : null;  // --only hilding.se,carpediem.se
const NO_PDF = !!argMap['no-pdf'];
const ONLY_PDF_FOR = argMap['pdf-only'] ? String(argMap['pdf-only']).split(',') : null;

// --- Utils ------------------------------------------------------------------

function fileToDataUrl(file) {
  const buf = fs.readFileSync(file);
  return 'data:image/png;base64,' + buf.toString('base64');
}

function esc(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeDomain(domain) {
  return String(domain).toLowerCase().replace(/[^a-z0-9.-]/g, '-');
}

// --- Status-rows & problems derivation --------------------------------------

function buildStatusRows(scan) {
  const p = scan.page || {};
  const rows = [];

  // Title
  rows.push({
    label: 'Page title',
    value: !p.title ? 'Saknas' : (p.titleLen > 65 ? `${p.titleLen} tecken (för lång)` : `${p.title.slice(0, 50)}${p.title.length > 50 ? '…' : ''}`),
    ok: !!p.title && p.titleLen <= 65 && p.titleLen >= 20,
  });

  // Meta description
  rows.push({
    label: 'Meta description',
    value: !p.description ? 'Saknas' : (p.descLen < 50 ? `${p.descLen} tecken (för kort)` : p.descLen > 170 ? `${p.descLen} tecken (för lång)` : `${p.descLen} tecken`),
    ok: !!p.description && p.descLen >= 50 && p.descLen <= 170,
  });

  // H1
  rows.push({
    label: 'H1-rubrik',
    value: p.h1Count === 0 ? 'Saknas' : p.h1Count === 1 ? '1 st' : `${p.h1Count} st (bör vara 1)`,
    ok: p.h1Count === 1,
  });

  // H2
  rows.push({
    label: 'H2-rubriker',
    value: `${p.h2Count || 0} st`,
    ok: (p.h2Count || 0) >= 2,
  });

  // Schema
  rows.push({
    label: 'Schema-markup',
    value: p.hasSchema ? 'Finns' : 'Saknas',
    ok: !!p.hasSchema,
  });

  // Mobile
  rows.push({
    label: 'Mobilanpassning',
    value: p.viewport ? 'OK' : 'Ingen viewport-tagg',
    ok: !!p.viewport,
  });

  // Alt-text
  const altMiss = p.imgWithoutAlt || 0;
  const altTotal = p.imgTotal || 0;
  rows.push({
    label: 'Alt-text bilder',
    value: altTotal === 0 ? '0 bilder hittade' : altMiss === 0 ? `${altTotal} bilder, alla har alt` : `${altMiss} av ${altTotal} saknar alt`,
    ok: altTotal === 0 ? true : (altMiss / altTotal) <= 0.1,
  });

  // Canonical
  rows.push({
    label: 'Canonical-tagg',
    value: p.canonical ? 'Finns' : 'Saknas',
    ok: !!p.canonical,
  });

  // HTTPS
  rows.push({
    label: 'HTTPS',
    value: p.isHttps ? 'Aktiv' : 'Saknas',
    ok: !!p.isHttps,
  });

  // Sitemap
  rows.push({
    label: 'Sitemap.xml',
    value: scan.sitemap?.exists ? (scan.sitemap.urls?.length ? `Finns (${scan.sitemap.urls.length} URL:er)` : 'Finns') : 'Saknas',
    ok: !!scan.sitemap?.exists,
  });

  // PageSpeed
  if (scan.pagespeed && typeof scan.pagespeed.score === 'number') {
    rows.push({
      label: 'PageSpeed (mobil)',
      value: `${scan.pagespeed.score}/100`,
      ok: scan.pagespeed.score >= 50,
    });
  }

  // CMS
  rows.push({
    label: 'Plattform',
    value: scan.cms || 'Okänt',
    ok: scan.cms && scan.cms !== 'Okänt/Custom',
  });

  // Word count
  if (typeof p.wordCount === 'number') {
    rows.push({
      label: 'Ordantal startsida',
      value: `${p.wordCount} ord`,
      ok: p.wordCount >= 200,
    });
  }

  return rows;
}

function buildProblems(scan) {
  const problems = [];
  const p = scan.page || {};

  // Severity: Hög / Medel / Låg
  function add(priority, title, desc) { problems.push({ priority, title, desc }); }

  // HTTPS missing — critical
  if (p && !p.isHttps) add('Hög', 'Ingen HTTPS', 'Sajten serveras över osäker HTTP. Google varnar besökare och rankar HTTPS-sajter högre. Behöver TLS-certifikat + 301-redirect från http → https.');

  // Mobile
  if (p && !p.viewport) add('Hög', 'Inte mobilanpassad (saknar viewport-tagg)', '60% av Googles trafik är mobil. Utan responsiv design rankas sidan lägre och användare studsar direkt.');

  // Title
  if (p && !p.title) add('Hög', 'Saknar page title', 'Page title är det viktigaste SEO-elementet. Utan title får Google välja själv — och det blir sällan bra.');
  else if (p && p.titleLen > 65) add('Medel', `Page title för lång (${p.titleLen} tecken, max 65)`, 'Titeln klipps av i sökresultaten. Bör kortas till max 65 tecken.');
  else if (p && p.titleLen > 0 && p.titleLen < 20) add('Medel', `Page title för kort (${p.titleLen} tecken)`, 'En för kort title utnyttjar inte hela utrymmet i Googles SERP. Minst 30 tecken rekommenderas.');

  // Description
  if (p && !p.description) add('Hög', 'Saknar meta description', 'Meta description är det Google visar som text-snippet. Utan den skriver Google något slumpmässigt — klickfrekvensen blir lidande.');
  else if (p && p.descLen < 50) add('Medel', `Meta description för kort (${p.descLen} tecken)`, 'Minst 120-150 tecken rekommenderas för att utnyttja utrymmet i sökresultaten.');
  else if (p && p.descLen > 170) add('Låg', `Meta description för lång (${p.descLen} tecken)`, 'Klipps av efter ~160 tecken i Googles SERP.');

  // H1
  if (p && p.h1Count === 0) add('Hög', 'Saknar H1-rubrik', 'H1 är sidans viktigaste rubrik enligt Google. Utan H1 har Google svårt att förstå sidans ämne.');
  else if (p && p.h1Count > 1) add('Medel', `Flera H1-rubriker (${p.h1Count} st) — bör bara ha en`, 'Bara en H1-rubrik per sida. Flera H1 förvirrar sökmotorerna.');

  // Schema
  if (p && !p.hasSchema) add('Medel', 'Saknar schema-markup (structured data)', 'Schema.org-markup hjälper Google förstå innehållet och aktiverar rich snippets (rating-stjärnor, priser, etc.) i sökresultaten.');

  // Alt-text
  if (p && p.imgTotal > 0) {
    const ratio = p.imgWithoutAlt / p.imgTotal;
    if (p.imgWithoutAlt >= 5 && ratio > 0.3) {
      add('Hög', `${p.imgWithoutAlt} bilder saknar alt-text (av ${p.imgTotal} totalt)`, 'Alt-text på bilder är viktig för bildsök och tillgänglighet. Google indexerar alt-text som sidinnehåll.');
    } else if (p.imgWithoutAlt > 0 && ratio > 0.1) {
      add('Medel', `${p.imgWithoutAlt} bilder saknar alt-text (av ${p.imgTotal} totalt)`, 'Några bilder saknar alt. Ska åtgärdas för fullständig tillgänglighet och SEO.');
    }
  }

  // Canonical
  if (p && !p.canonical) add('Låg', 'Saknar canonical-tagg', 'Canonical-taggen förhindrar duplicate-content-problem när samma sida kan nås via flera URL:er.');

  // Word count
  if (p && p.wordCount < 200) add('Hög', `Thin content på startsidan (${p.wordCount} ord)`, 'Google rankar sidor med substantiellt innehåll. Under 200 ord räknas som thin content och rankas lågt.');

  // Sitemap
  if (scan.sitemap && !scan.sitemap.exists) add('Medel', 'Ingen sitemap.xml', 'Sitemap.xml hjälper Google hitta och indexera alla sidor. Utan den kan nya sidor ta veckor att komma in i sökresultaten.');

  // Broken sitemap URLs
  if (scan.sitemapSample && scan.sitemapSample.sampled > 0) {
    const broken = scan.sitemapSample.notFound;
    if (broken > 0) add(broken >= 3 ? 'Hög' : 'Medel', `${broken} trasiga URL:er (404) i sitemap-sample`, 'Trasiga URL:er i sitemap skadar Googles förtroende och slösar crawl-budget.');
  }

  // PageSpeed
  if (scan.pagespeed && typeof scan.pagespeed.score === 'number') {
    if (scan.pagespeed.score < 30) add('Hög', `Mycket låg laddningshastighet (PageSpeed ${scan.pagespeed.score}/100)`, 'Google använder Core Web Vitals som rankingfaktor. Under 30/100 är en allvarlig ranking-nackdel.');
    else if (scan.pagespeed.score < 50) add('Medel', `Låg laddningshastighet (PageSpeed ${scan.pagespeed.score}/100)`, 'Långsamma sidor rankas lägre och har högre bounce-rate. Google mäter LCP, FCP och CLS.');
  }

  // Redirect chain
  if (scan.redirectCount > 3) add('Låg', `${scan.redirectCount} redirects i kedjan till startsidan`, 'Onödiga redirects saktar ner laddning och spiller link equity.');

  return problems;
}

function priorityStyle(priority) {
  if (priority === 'Hög') return { color: '#c62828', bg: '#fce4ec', border: '#c62828' };
  if (priority === 'Medel') return { color: '#1565c0', bg: '#e3f2fd', border: '#1565c0' };
  return { color: '#6a1b9a', bg: '#f3e5f5', border: '#6a1b9a' };
}

function buildActionPlan(problems) {
  // Month 1 = all "Hög" priority (up to 4)
  // Month 2 = all other problems
  const hog = problems.filter(p => p.priority === 'Hög');
  const rest = problems.filter(p => p.priority !== 'Hög');
  const month1 = hog.length > 0 ? hog.slice(0, 4) : problems.slice(0, 1);
  const month2 = hog.length > 0 ? hog.slice(4).concat(rest) : problems.slice(1);
  return { month1, month2 };
}

// --- HTML template ----------------------------------------------------------

const CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    background: #f7f7f7;
    color: #1a1a1a;
    padding: 40px 20px;
  }
  .page {
    max-width: 820px;
    margin: 0 auto;
    background: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 20px rgba(0,0,0,0.08);
    overflow: hidden;
  }

  /* HEADER */
  .header {
    padding: 32px 40px 24px;
    border-bottom: 3px solid #e91e8c;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-left {}
  .logo { height: 44px; display: block; margin-bottom: 16px; }
  .doc-title { font-size: 22px; font-weight: 700; color: #1a1a1a; margin-bottom: 4px; }
  .doc-domain { font-size: 16px; color: #666; }
  .score-box {
    text-align: center;
    border: 3px solid #e65100;
    border-radius: 12px;
    padding: 14px 24px;
    min-width: 100px;
  }
  .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
  .score-num { font-size: 48px; font-weight: 800; color: #e65100; line-height: 1; }
  .score-max { font-size: 12px; color: #aaa; }

  /* DIVIDER */
  .divider { height: 3px; background: #e91e8c; margin: 0; }
  .divider-thin { height: 1px; background: #f0d0e0; margin: 24px 40px; }

  /* SECTION */
  .section { padding: 28px 40px; }
  .section-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #e91e8c;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 2px solid #fce4ec;
  }

  /* SAMMANFATTNING */
  .summary-text {
    font-size: 15px;
    line-height: 1.7;
    color: #333;
    background: #fdf5f8;
    border-left: 4px solid #e91e8c;
    padding: 16px 20px;
    border-radius: 0 8px 8px 0;
  }

  /* STATUS GRID */
  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .status-row {
    background: #fafafa;
    border: 1px solid #eee;
    border-radius: 8px;
    padding: 12px 14px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .status-label { font-size: 12px; color: #888; flex: 0 0 auto; min-width: 110px; }
  .status-value { font-size: 13px; color: #333; flex: 1; }
  .status-icon { font-size: 18px; font-weight: 700; flex: 0 0 auto; }
  .status-icon.ok { color: #2e7d32; }
  .status-icon.fail { color: #c62828; }

  /* PROBLEM CARDS */
  .problem-card {
    border: 1px solid #eee;
    border-left: 4px solid #ccc;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;
    background: #fafafa;
  }
  .problem-body { flex: 1; }
  .problem-title { font-size: 14px; font-weight: 700; color: #1a1a1a; margin-bottom: 6px; }
  .problem-desc { font-size: 13px; color: #666; line-height: 1.5; }
  .priority-badge {
    font-size: 11px;
    font-weight: 700;
    padding: 4px 12px;
    border-radius: 20px;
    border: 1px solid;
    white-space: nowrap;
    flex: 0 0 auto;
  }

  /* ÅTGÄRDSPLAN */
  .month-block { margin-bottom: 16px; }
  .month-label {
    font-size: 13px;
    font-weight: 700;
    border-left: 4px solid;
    padding-left: 10px;
    margin-bottom: 8px;
  }
  .month-list {
    padding-left: 28px;
    color: #333;
    font-size: 14px;
    line-height: 1.8;
  }

  /* ROI */
  .roi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
    text-align: center;
  }
  .roi-box {
    background: #fdf5f8;
    border: 1px solid #f0d0e0;
    border-radius: 10px;
    padding: 20px 10px;
  }
  .roi-num { font-size: 26px; font-weight: 800; color: #e91e8c; margin-bottom: 6px; }
  .roi-label { font-size: 12px; color: #888; }

  /* FOOTER */
  .footer {
    padding: 24px 40px;
    border-top: 3px solid #e91e8c;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fdf5f8;
  }
  .footer-logo { height: 28px; }
  .footer-contact { font-size: 13px; color: #666; line-height: 1.6; }
  .footer-contact a { color: #e91e8c; text-decoration: none; }
  .footer-right { font-size: 12px; color: #aaa; text-align: right; }

  @media print {
    body { background: #fff; padding: 0; }
    .page { box-shadow: none; border-radius: 0; }
  }
`;

function renderHTML(scan, { logoDataUrl, logoSmDataUrl }) {
  const p = scan.page || {};
  const statusRows = buildStatusRows(scan);
  const problems = buildProblems(scan);
  const plan = buildActionPlan(problems);
  const domain = scan.domain;
  const company = scan.company || domain;
  const nProblems = problems.length;
  const seoScore = scan.seoScore;

  const summaryText = nProblems === 0
    ? `Vi har analyserat <strong>${esc(domain)}</strong> och sajten är i grunden solid. Det finns dock alltid optimeringspotential — med rätt arbete kan ni förbättra rankningar och öka den organiska trafiken.`
    : `Vi har analyserat <strong>${esc(domain)}</strong> och identifierat <strong>${nProblems} SEO-problem</strong> som påverkar er synlighet på Google negativt. Med rätt åtgärder kan ni öka er organiska trafik och nå fler potentiella kunder utan att betala för annonsering.`;

  const statusHtml = statusRows.map(r => `
    <div class="status-row">
      <div class="status-label">${esc(r.label)}</div>
      <div class="status-value">${esc(r.value)}</div>
      <div class="status-icon ${r.ok ? 'ok' : 'fail'}">${r.ok ? '✓' : '✗'}</div>
    </div>`).join('');

  const problemsHtml = problems.length === 0
    ? '<div style="color:#666;font-size:14px;padding:8px 0;">Inga allvarliga SEO-problem identifierade vid startsidans analys.</div>'
    : problems.map((pr, i) => {
        const st = priorityStyle(pr.priority);
        return `
    <div class="problem-card" style="border-left-color:${st.border}">
      <div class="problem-body">
        <div class="problem-title">${i + 1}. ${esc(pr.title)}</div>
        <div class="problem-desc">${esc(pr.desc)}</div>
      </div>
      <div class="priority-badge" style="background:${st.bg}; border-color:${st.border}; color:${st.color}">${esc(pr.priority)}</div>
    </div>`;
      }).join('');

  const month1Html = plan.month1.length > 0
    ? `<ul class="month-list">${plan.month1.map(pr => `<li>${esc(pr.title)}</li>`).join('')}</ul>`
    : '<ul class="month-list"><li>Ingen akut åtgärd krävs</li></ul>';

  const month2Html = plan.month2.length > 0
    ? `<ul class="month-list">${plan.month2.map(pr => `<li>${esc(pr.title)}</li>`).join('')}</ul>`
    : '<ul class="month-list"><li>Löpande optimering och bevakning av rankningar</li></ul>';

  // Action plan section
  const planHtml = `
    <div class="month-block">
      <div class="month-label" style="color:#c62828; border-left-color:#c62828">Månad 1 (Akut)</div>
      ${month1Html}
    </div>
    <div class="month-block">
      <div class="month-label" style="color:#1565c0; border-left-color:#1565c0">Månad 2 (Optimering)</div>
      ${month2Html}
    </div>`;

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Analys &amp; åtgärdsplan — ${esc(domain)}</title>
<style>${CSS}</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <img src="${logoDataUrl}" class="logo" alt="Searchboost">
      <div class="doc-title">Analys &amp; åtgärdsplan</div>
      <div class="doc-domain">${esc(domain)}</div>
    </div>
    <div class="score-box">
      <div class="score-label">SEO-poäng</div>
      <div class="score-num">${seoScore}</div>
      <div class="score-max">/100</div>
    </div>
  </div>

  <!-- SAMMANFATTNING -->
  <div class="section">
    <div class="section-title">Sammanfattning</div>
    <div class="summary-text">
      ${summaryText}
    </div>
  </div>

  <div class="divider-thin"></div>

  <!-- TEKNISK STATUS -->
  <div class="section">
    <div class="section-title">Aktuell teknisk status</div>
    <div class="status-grid">
      ${statusHtml}
    </div>
  </div>

  <div class="divider-thin"></div>

  <!-- PROBLEM -->
  <div class="section">
    <div class="section-title">Identifierade problem (${problems.length} st)</div>
    ${problemsHtml}
  </div>

  <div class="divider-thin"></div>

  <!-- ÅTGÄRDSPLAN -->
  <div class="section">
    <div class="section-title">Rekommenderad åtgärdsplan</div>
    ${planHtml}
  </div>

  <div class="divider-thin"></div>

  <!-- ROI -->
  <div class="section">
    <div class="section-title">Vad kan ni förvänta er?</div>
    <div class="roi-grid">
      <div class="roi-box">
        <div class="roi-num">+30–60%</div>
        <div class="roi-label">Organisk trafik (6 mån)</div>
      </div>
      <div class="roi-box">
        <div class="roi-num">Top 10</div>
        <div class="roi-label">Google för era nyckelord</div>
      </div>
      <div class="roi-box">
        <div class="roi-num">Automatiskt</div>
        <div class="roi-label">Inga manuella insatser</div>
      </div>
    </div>
  </div>

  <!-- FOOTER -->
  <div class="footer">
    <img src="${logoSmDataUrl}" class="footer-logo" alt="Searchboost">
    <div class="footer-contact">
      Mikael Larsson &nbsp;|&nbsp; 0760-19 49 05 &nbsp;|&nbsp; <a href="mailto:mikael@searchboost.se">mikael@searchboost.se</a>
    </div>
    <div class="footer-right">Konfidentiell<br>Framtagen för ${esc(domain)}</div>
  </div>

</div>
</body>
</html>`;
}

// --- Main -------------------------------------------------------------------

async function main() {
  const data = JSON.parse(fs.readFileSync(SCAN_RESULTS, 'utf8'));
  let results = data.results;
  if (ONLY) results = results.filter(r => ONLY.includes(r.domain));

  console.log(`Loaded ${results.length} scan-results.`);

  const logoDataUrl = fileToDataUrl(LOGO_PNG);
  const logoSmDataUrl = fileToDataUrl(LOGO_SM_PNG);

  // Generate HTML for live (non-dead) domains
  const live = results.filter(r => !r.dead);
  console.log(`Generating HTML for ${live.length} live domains...`);
  for (const r of live) {
    const safe = safeDomain(r.domain);
    const html = renderHTML(r, { logoDataUrl, logoSmDataUrl });
    fs.writeFileSync(path.join(ANALYSER_DIR, `${safe}.html`), html, 'utf8');
    r._htmlFile = `analyser/${safe}.html`;
    r._pdfFile = `analyser/${safe}.pdf`;
  }

  // PDF generation
  if (!NO_PDF) {
    const pdfTargets = ONLY_PDF_FOR
      ? live.filter(r => ONLY_PDF_FOR.includes(r.domain))
      : live;
    console.log(`Generating ${pdfTargets.length} PDFs via Playwright chromium...`);
    const { chromium } = require(path.join(ROOT, 'node_modules/playwright'));
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    let done = 0;
    for (const r of pdfTargets) {
      const safe = safeDomain(r.domain);
      const htmlPath = path.join(ANALYSER_DIR, `${safe}.html`);
      const pdfPath = path.join(ANALYSER_DIR, `${safe}.pdf`);
      try {
        await page.goto(`file://${htmlPath}`, { waitUntil: 'load', timeout: 30000 });
        await page.pdf({
          path: pdfPath,
          format: 'A4',
          printBackground: true,
          margin: { top: '10mm', bottom: '10mm', left: '10mm', right: '10mm' },
        });
        done++;
        if (done % 10 === 0) console.log(`  PDF ${done}/${pdfTargets.length}`);
      } catch (err) {
        console.error(`PDF fail ${r.domain}: ${err.message}`);
      }
    }
    await browser.close();
    console.log(`PDFs done: ${done}`);
  }

  // Excel ringlista
  if (!ONLY) {
    console.log('Building Excel ringlista...');
    const XLSX = require(path.join(ROOT, 'node_modules/xlsx'));
    const rows = results.slice().sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0));
    const headers = ['Domän', 'Företag', 'Kategori', 'Ort', 'Lead-score', 'SEO-score', 'Prioritet', 'CMS', 'Topp 3 flaggor', 'HTML-fil', 'PDF-fil', 'Status'];
    const sheetData = [headers];
    for (const r of rows) {
      sheetData.push([
        r.domain,
        r.company || '',
        r.category || '',
        r.city || '',
        r.leadScore || 0,
        r.seoScore || 0,
        r.action || '',
        r.cms || '',
        (r.flags || []).slice(0, 3).join(' | '),
        r._htmlFile || (r.dead ? '' : `analyser/${safeDomain(r.domain)}.html`),
        r._pdfFile || (r.dead ? '' : `analyser/${safeDomain(r.domain)}.pdf`),
        'Ej kontaktad',
      ]);
    }
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    // Column widths
    ws['!cols'] = [
      { wch: 26 }, { wch: 28 }, { wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 60 }, { wch: 38 }, { wch: 38 }, { wch: 14 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ringlista');
    XLSX.writeFile(wb, RINGLISTA_XLSX);
    console.log(`Wrote: ${RINGLISTA_XLSX}`);
  }

  // Summary markdown
  if (!ONLY) {
    console.log('Building summary markdown...');
    const all = results;
    const counts = { RING: 0, MEJLA: 0, SKIPPA: 0, DEAD: 0 };
    for (const r of all) counts[r.action] = (counts[r.action] || 0) + 1;

    const top = all.filter(r => !r.dead).slice().sort((a, b) => (b.leadScore || 0) - (a.leadScore || 0)).slice(0, 10);

    const cmsStats = {};
    for (const r of all) if (!r.dead) cmsStats[r.cms || 'Okänt'] = (cmsStats[r.cms || 'Okänt'] || 0) + 1;

    const catByPrio = {};
    for (const r of all) {
      const c = r.category || 'Okänt';
      const a = r.action || 'DEAD';
      catByPrio[c] = catByPrio[c] || { RING: 0, MEJLA: 0, SKIPPA: 0, DEAD: 0 };
      catByPrio[c][a]++;
    }

    const dead = all.filter(r => r.dead);

    let md = `# Prospect-scan — 90 möbelföretag\n\n`;
    md += `**Datum:** 2026-04-16\n`;
    md += `**Input:** prospects-filtered.json (90 prospects, storkedjor bortfiltrerade)\n`;
    md += `**Output-mapp:** docs/leads/branscher-2026-04-16/\n\n`;

    md += `## Totalt\n\n`;
    md += `- **${all.length}** domäner analyserade\n`;
    md += `- **${all.length - dead.length}** levande, **${dead.length}** döda/otillgängliga\n\n`;

    md += `## Fördelning per prioritet\n\n`;
    md += `| Prioritet | Antal | Andel |\n|-----------|-------|-------|\n`;
    for (const k of ['RING', 'MEJLA', 'SKIPPA', 'DEAD']) {
      const n = counts[k] || 0;
      md += `| ${k} | ${n} | ${((n / all.length) * 100).toFixed(0)}% |\n`;
    }
    md += `\n`;

    md += `## Topp 10 hottest prospects\n\n`;
    md += `| # | Domän | Företag | Lead-score | SEO-score | CMS | Top flaggor |\n|---|-------|---------|-----------:|----------:|-----|-------------|\n`;
    top.forEach((r, i) => {
      md += `| ${i + 1} | ${r.domain} | ${r.company || ''} | ${r.leadScore} | ${r.seoScore} | ${r.cms || ''} | ${(r.flags || []).slice(0, 2).join('; ')} |\n`;
    });
    md += `\n`;

    md += `## CMS-fördelning (levande)\n\n`;
    md += `| CMS | Antal |\n|-----|------:|\n`;
    const cmsEntries = Object.entries(cmsStats).sort((a, b) => b[1] - a[1]);
    for (const [k, v] of cmsEntries) md += `| ${k} | ${v} |\n`;
    md += `\n`;

    md += `## Kategori per prioritet\n\n`;
    md += `| Kategori | RING | MEJLA | SKIPPA | DEAD | Total |\n|----------|-----:|------:|-------:|-----:|------:|\n`;
    const catKeys = Object.keys(catByPrio).sort();
    for (const c of catKeys) {
      const b = catByPrio[c];
      const t = b.RING + b.MEJLA + b.SKIPPA + b.DEAD;
      md += `| ${c} | ${b.RING} | ${b.MEJLA} | ${b.SKIPPA} | ${b.DEAD} | ${t} |\n`;
    }
    md += `\n`;

    if (dead.length > 0) {
      md += `## Döda / otillgängliga domäner\n\n`;
      md += `| Domän | Företag | Orsak |\n|-------|---------|-------|\n`;
      for (const r of dead) md += `| ${r.domain} | ${r.company || ''} | ${r.error || 'okänd'} |\n`;
      md += `\n`;
    }

    md += `## Filer\n\n`;
    md += `- \`scan-results.json\` — rå scan-data per domän\n`;
    md += `- \`analyser/{domän}.html\` + \`{domän}.pdf\` — analyser per företag\n`;
    md += `- \`bransch-ringlista-2026-04-16.xlsx\` — sorterad ringlista (lead-score desc)\n`;
    md += `- \`scan-log.txt\` — scan-loggen\n\n`;

    md += `## Nästa steg\n\n`;
    md += `1. **Ring RING-prospects först** — hot-lista med ${counts.RING} företag.\n`;
    md += `2. **Mejla MEJLA-prospects** — warm-lista med ${counts.MEJLA} företag (PDF-bifoga).\n`;
    md += `3. **SKIPPA-listan** (${counts.SKIPPA}) kan eventuellt bevakas men är inte prio.\n`;

    fs.writeFileSync(SUMMARY_MD, md, 'utf8');
    console.log(`Wrote: ${SUMMARY_MD}`);
  }

  console.log('DONE.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
