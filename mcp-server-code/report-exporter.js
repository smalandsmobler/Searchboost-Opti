/**
 * Report Exporter — Searchboost Opti
 *
 * Genererar PDF och PPTX fran Marp-markdown-templates.
 * Anvander @marp-team/marp-cli (redan installerad).
 *
 * Tva output-format:
 * 1. PDF — For kundrapporter (manadsrapport, SEO-rapport)
 * 2. PPTX — For saljpresentationer och kundmoeten
 *
 * Marp-syntax: Markdown med --- som slide-separator,
 * frontmatter for tema/storlek, och HTML for layout.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');
const execPromise = util.promisify(exec);

const OUTPUT_DIR = path.join(__dirname, '..', 'presentations', 'output');
const TEMPLATES_DIR = path.join(__dirname, '..', 'presentations', 'marp-templates');

// Searchboost Marp-tema (CSS)
const SEARCHBOOST_THEME = `
/* @theme searchboost */
@import 'default';

:root {
  --pink: #e91e8c;
  --cyan: #00d4ff;
  --green: #00e676;
  --purple: #7c4dff;
  --dark: #0a0a1a;
  --dark-card: #12121a;
  --text: #fafafa;
  --text-muted: #94a3b8;
}

section {
  background: linear-gradient(135deg, #0a0a1a 0%, #111128 50%, #0a0a1a 100%);
  color: var(--text);
  font-family: 'IBM Plex Sans', -apple-system, sans-serif;
  padding: 60px 80px;
}

section::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--pink), var(--cyan), var(--purple));
}

h1 {
  color: var(--pink);
  font-weight: 800;
  font-size: 2.4em;
  margin-bottom: 0.3em;
}

h2 {
  color: var(--cyan);
  font-weight: 700;
  font-size: 1.8em;
  margin-bottom: 0.4em;
}

h3 {
  color: var(--text);
  font-weight: 600;
  font-size: 1.3em;
}

strong { color: var(--pink); }
em { color: var(--cyan); font-style: normal; }

a { color: var(--cyan); text-decoration: none; }

ul, ol { color: var(--text-muted); line-height: 1.8; }
li { margin-bottom: 4px; }

table {
  border-collapse: collapse;
  width: 100%;
  font-size: 0.85em;
}

th {
  background: rgba(233, 30, 140, 0.15);
  color: var(--pink);
  padding: 10px 16px;
  text-align: left;
  border-bottom: 2px solid rgba(233, 30, 140, 0.3);
}

td {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
}

code {
  background: rgba(0, 212, 255, 0.1);
  color: var(--cyan);
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'IBM Plex Mono', monospace;
}

blockquote {
  border-left: 4px solid var(--pink);
  background: rgba(233, 30, 140, 0.05);
  padding: 16px 24px;
  margin: 16px 0;
  color: var(--text);
}

/* Titelslide */
section.title {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

section.title h1 {
  font-size: 3em;
  background: linear-gradient(135deg, var(--pink), var(--purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* KPI/sifferkort */
section.kpi {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  margin-top: 24px;
}

.kpi-box {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 16px;
  padding: 24px;
  text-align: center;
}

.kpi-value {
  font-size: 2.2em;
  font-weight: 800;
  color: var(--pink);
}

.kpi-label {
  color: var(--text-muted);
  font-size: 0.85em;
  margin-top: 4px;
}

/* CTA-slide */
section.cta {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

section.cta h1 {
  margin-bottom: 0.5em;
}

/* Positiv/negativ markering */
.positive { color: var(--green); }
.negative { color: #ef4444; }
.neutral { color: var(--text-muted); }

/* Footer */
section footer {
  position: absolute;
  bottom: 20px;
  left: 80px;
  right: 80px;
  font-size: 0.7em;
  color: var(--text-muted);
  display: flex;
  justify-content: space-between;
}
`;

/**
 * Genererar SEO-rapport som Marp-markdown
 */
function generateSeoReportMarp(data) {
  const {
    companyName = 'Kund',
    domain = 'example.se',
    date = new Date().toISOString().split('T')[0],
    mobileScore = 0,
    desktopScore = 0,
    keywords = [],
    topKeywords = [],
    clicks28d = 0,
    impressions28d = 0,
    avgPosition = 0,
    top10Count = 0,
    totalKeywords = 0,
    optimizations30d = 0,
    issues = [],
    actionPlan = [],
    recommendations = [],
    costEstimate = null,
    contactName = 'Mikael',
    contactEmail = 'mikael@searchboost.se'
  } = data;

  const ctr = impressions28d > 0 ? ((clicks28d / impressions28d) * 100).toFixed(1) : '0.0';

  return `---
marp: true
theme: searchboost
paginate: true
size: 16:9
---

<!-- _class: title -->

# SEO & Prestandarapport
## ${companyName}
### ${date} | Searchboost

---

## Oversikt — Senaste 28 dagarna

<div class="kpi-grid">
<div class="kpi-box">
<div class="kpi-value">${clicks28d}</div>
<div class="kpi-label">Klick fran Google</div>
</div>
<div class="kpi-box">
<div class="kpi-value">${impressions28d.toLocaleString('sv-SE')}</div>
<div class="kpi-label">Visningar</div>
</div>
<div class="kpi-box">
<div class="kpi-value">${ctr}%</div>
<div class="kpi-label">CTR</div>
</div>
<div class="kpi-box">
<div class="kpi-value">${avgPosition.toFixed ? avgPosition.toFixed(1) : avgPosition}</div>
<div class="kpi-label">Snittposition</div>
</div>
</div>

<footer>${companyName} | ${domain} | ${date}</footer>

---

## Sokordpositioner

| Sokord | Position | Forandring | Klick | Visningar |
|--------|----------|------------|-------|-----------|
${topKeywords.slice(0, 12).map(k =>
    `| ${k.keyword} | **${k.position?.toFixed(1) || '—'}** | ${k.change > 0 ? '<span class="negative">+' + k.change.toFixed(1) + '</span>' : k.change < 0 ? '<span class="positive">' + k.change.toFixed(1) + '</span>' : '—'} | ${k.clicks || 0} | ${k.impressions || 0} |`
  ).join('\n')}

**${top10Count}** av **${totalKeywords}** sokord i topp 10

<footer>${companyName} | ${domain} | ${date}</footer>

---

## Webbplatsprestanda

<div class="kpi-grid">
<div class="kpi-box">
<div class="kpi-value" style="color: ${mobileScore >= 90 ? '#00e676' : mobileScore >= 50 ? '#eab308' : '#ef4444'}">${mobileScore}</div>
<div class="kpi-label">Mobil (PageSpeed)</div>
</div>
<div class="kpi-box">
<div class="kpi-value" style="color: ${desktopScore >= 90 ? '#00e676' : desktopScore >= 50 ? '#eab308' : '#ef4444'}">${desktopScore}</div>
<div class="kpi-label">Desktop (PageSpeed)</div>
</div>
<div class="kpi-box">
<div class="kpi-value">${optimizations30d}</div>
<div class="kpi-label">Optimeringar (30d)</div>
</div>
<div class="kpi-box">
<div class="kpi-value">${top10Count}</div>
<div class="kpi-label">Sokord i topp 10</div>
</div>
</div>

<footer>${companyName} | ${domain} | ${date}</footer>

---

## Utforda optimeringar

${issues.length > 0 ? issues.slice(0, 8).map(i =>
    `- **${i.type || 'SEO'}**: ${i.description || i.title || i.page_url || '—'}`
  ).join('\n') : '- Inga problem identifierade denna period'}

${optimizations30d > 0 ? `\n> Vi har genomfort **${optimizations30d} optimeringar** senaste 30 dagarna.` : ''}

<footer>${companyName} | ${domain} | ${date}</footer>

---

## Atgardsplan — Nasta steg

${actionPlan.length > 0 ? actionPlan.slice(0, 8).map((task, i) =>
    `${i + 1}. ${task.completed ? '~~' : ''}**${task.title || task.task || task}**${task.completed ? '~~' : ''} ${task.completed ? '(klart)' : ''}`
  ).join('\n') : recommendations.length > 0 ? recommendations.slice(0, 6).map((r, i) =>
    `${i + 1}. **${r}**`
  ).join('\n') : '1. Fortsatt optimering av metadata\n2. Intern lankning\n3. Innehallsoptimering'}

<footer>${companyName} | ${domain} | ${date}</footer>

---

<!-- _class: cta -->

# Fragor?

### ${contactName}
${contactEmail}

**Searchboost** — vi gor er synliga

`;
}

/**
 * Genererar saljpresentation som Marp-markdown
 */
function generateSalesPresentationMarp(data) {
  const {
    companyName = 'Kund',
    domain = 'example.se',
    score = 0,
    issues = [],
    costEstimate = null,
    summary = '',
    contactName = 'Mikael',
    contactEmail = 'mikael@searchboost.se',
    mobileScore = 0,
    desktopScore = 0,
    topKeywords = [],
    recommendations = []
  } = data;

  const criticalCount = issues.filter(i => i.severity === 'high' || i.severity === 'critical').length;
  const warningCount = issues.filter(i => i.severity === 'medium' || i.severity === 'warning').length;

  return `---
marp: true
theme: searchboost
paginate: true
size: 16:9
---

<!-- _class: title -->

# SEO-analys
## ${companyName}
### ${domain} | Searchboost

---

## Nuvarande prestanda

<div class="kpi-grid">
<div class="kpi-box">
<div class="kpi-value" style="color: ${score >= 70 ? '#00e676' : score >= 40 ? '#eab308' : '#ef4444'}">${score}/100</div>
<div class="kpi-label">SEO-betyg</div>
</div>
<div class="kpi-box">
<div class="kpi-value" style="color: #ef4444">${criticalCount}</div>
<div class="kpi-label">Kritiska problem</div>
</div>
<div class="kpi-box">
<div class="kpi-value" style="color: #eab308">${warningCount}</div>
<div class="kpi-label">Varningar</div>
</div>
<div class="kpi-box">
<div class="kpi-value">${mobileScore}</div>
<div class="kpi-label">Mobil hastighet</div>
</div>
</div>

---

## Identifierade problem

${issues.slice(0, 10).map(i => {
    const icon = i.severity === 'high' || i.severity === 'critical' ? '[KRITISK]' : i.severity === 'medium' ? '[VARNING]' : '[INFO]';
    return `- **${icon}** ${i.description || i.title}`;
  }).join('\n')}

${issues.length > 10 ? `\n> ...och **${issues.length - 10} ytterligare problem**` : ''}

---

## Konkurrentanalys — Sokord

| Sokord | Er position | Potential |
|--------|-------------|-----------|
${topKeywords.slice(0, 8).map(k =>
    `| ${k.keyword} | ${k.position ? k.position.toFixed(1) : 'Ej rankad'} | ${k.volume ? k.volume + ' sok/man' : '—'} |`
  ).join('\n')}

---

## Var losning

${recommendations.length > 0 ? recommendations.map((r, i) =>
    `${i + 1}. **${r}**`
  ).join('\n') : `1. **Teknisk SEO-audit** — Fixa alla ${criticalCount} kritiska problem
2. **On-page-optimering** — Meta-titlar, beskrivningar, schema markup
3. **Innehallsstrategi** — Optimera befintligt + skapa nytt rankande innehall
4. **Lokal SEO** — Google Business Profile, lokala sokord
5. **Lopande overvakning** — Veckorapporter, positionstracking, prestanda`}

---

${costEstimate ? `## Investering

| Paket | Pris |
|-------|------|
| **${costEstimate.tier || 'Standard'}** | **${costEstimate.monthly ? costEstimate.monthly.toLocaleString('sv-SE') + ' kr/man' : costEstimate.total ? costEstimate.total.toLocaleString('sv-SE') + ' kr' : '—'}** |
| Bindningstid | ${costEstimate.commitment || '6 manader'} |
| Uppsagning | ${costEstimate.notice || '1 manads uppsagningstid'} |

> ROI: Med ${costEstimate.monthly || 5000} kr/man i SEO-investering kan ni forvanta
> **${Math.round((costEstimate.monthly || 5000) * 3)} kr/man** i extra organisk trafik inom 6 manader.

---` : ''}

<!-- _class: cta -->

# Nasta steg?

### ${contactName}
${contactEmail}

**Searchboost** — vi gor er synliga

`;
}

/**
 * Sparar Marp-tema till en tempfil
 */
function saveTheme() {
  const themeDir = path.join(TEMPLATES_DIR, '..');
  const themePath = path.join(themeDir, 'searchboost-theme.css');
  if (!fs.existsSync(themeDir)) fs.mkdirSync(themeDir, { recursive: true });
  fs.writeFileSync(themePath, SEARCHBOOST_THEME);
  return themePath;
}

/**
 * Exporterar Marp-markdown till PDF eller PPTX
 * @param {string} markdown - Marp-formaterad markdown
 * @param {string} outputName - Filnamn utan extension (t.ex. "rapport-kompetensutveckla-2026-02")
 * @param {'pdf'|'pptx'} format - Output-format
 * @returns {Promise<string>} Sokvag till genererad fil
 */
async function exportPresentation(markdown, outputName, format = 'pdf') {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  if (!fs.existsSync(TEMPLATES_DIR)) fs.mkdirSync(TEMPLATES_DIR, { recursive: true });

  const themePath = saveTheme();
  const mdPath = path.join(OUTPUT_DIR, `${outputName}.md`);
  const outputPath = path.join(OUTPUT_DIR, `${outputName}.${format}`);

  // Skriv markdown-fil
  fs.writeFileSync(mdPath, markdown, 'utf-8');

  // Bygg Marp-kommando
  const marpBin = path.join(__dirname, 'node_modules', '.bin', 'marp');
  const cmd = `${marpBin} "${mdPath}" --output "${outputPath}" --theme "${themePath}" --allow-local-files`;

  if (format === 'pptx') {
    // PPTX kraver --pptx flagga
    const pptxCmd = `${marpBin} "${mdPath}" --pptx --output "${outputPath}" --theme "${themePath}" --allow-local-files`;
    await execPromise(pptxCmd, { timeout: 60000, cwd: __dirname });
  } else {
    // PDF ar default
    const pdfCmd = `${marpBin} "${mdPath}" --pdf --output "${outputPath}" --theme "${themePath}" --allow-local-files`;
    await execPromise(pdfCmd, { timeout: 60000, cwd: __dirname });
  }

  // Rensa temp markdown
  try { fs.unlinkSync(mdPath); } catch (e) { /* ok */ }

  return outputPath;
}

/**
 * Genererar komplett SEO-rapport (PDF eller PPTX)
 */
async function generateSeoReport(data, format = 'pdf') {
  const markdown = generateSeoReportMarp(data);
  const safeName = (data.companyName || 'kund').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const date = data.date || new Date().toISOString().split('T')[0];
  const outputName = `rapport-${safeName}-${date}`;
  return exportPresentation(markdown, outputName, format);
}

/**
 * Genererar saljpresentation (PDF eller PPTX)
 */
async function generateSalesPresentation(data, format = 'pptx') {
  const markdown = generateSalesPresentationMarp(data);
  const safeName = (data.companyName || 'kund').toLowerCase().replace(/[^a-z0-9]/g, '-');
  const date = new Date().toISOString().split('T')[0];
  const outputName = `presentation-${safeName}-${date}`;
  return exportPresentation(markdown, outputName, format);
}

/**
 * Genererar fran rå Marp-markdown (for custom templates)
 */
async function generateFromMarkdown(markdown, outputName, format = 'pdf') {
  return exportPresentation(markdown, outputName, format);
}

module.exports = {
  generateSeoReport,
  generateSalesPresentation,
  generateFromMarkdown,
  generateSeoReportMarp,
  generateSalesPresentationMarp,
  exportPresentation,
  SEARCHBOOST_THEME
};
