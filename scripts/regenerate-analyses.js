#!/usr/bin/env node
// Regenererar alla 28 lead-analyser med ny design:
// - Vit bakgrund
// - Searchboost-loggan (base64)
// - Rosa avdelare (#e91e8c)
// - Inga datum

const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../docs/leads/analysfiler');
const OUTPUT_DIR = path.join(__dirname, '../docs/leads/analysfiler-v2');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Läs loggan som base64
const logoPath = path.join(__dirname, '../assets/brand/searchboost-logo.png');
const logoBase64 = fs.readFileSync(logoPath).toString('base64');
const logoSrc = `data:image/png;base64,${logoBase64}`;

// Extrahera data från gammal HTML
function parseAnalysis(html) {
  const data = {};

  // Domän
  const domainMatch = html.match(/Analys & åtgärdsplan<\/h1>\s*<div[^>]*>([^<]+)<\/div>/);
  data.domain = domainMatch ? domainMatch[1].trim() : '';

  // Score
  const scoreMatch = html.match(/font-size:42px[^>]*>(\d+)<\/div>/);
  data.score = scoreMatch ? parseInt(scoreMatch[1]) : 0;

  // Sammanfattning
  const summaryMatch = html.match(/Vi har analyserat.*?identifierat.*?(\d+) SEO-problem[^<]*/);
  data.problemCount = summaryMatch ? parseInt(summaryMatch[1]) : 0;

  // Teknisk status — extrahera alla rader
  data.statusItems = [];
  const statusRegex = /<div style="color:#8b949e; font-size:12px;">([^<]+)<\/div>\s*<div[^>]*>([^<]+)<\/div>\s*<\/div>\s*<div style="color:(#[^"]+).*?>(✓|✗)<\/div>/g;
  let m;
  while ((m = statusRegex.exec(html)) !== null) {
    data.statusItems.push({
      label: m[1].trim(),
      value: m[2].trim(),
      ok: m[4] === '✓'
    });
  }

  // Problem
  data.problems = [];
  const probRegex = /<div style="color:#e6edf3; font-weight:bold; margin-bottom:6px;">([^<]+)<\/div>\s*<div style="color:#8b949e[^>]*>([^<]+)<\/div>[\s\S]*?<div[^>]*border:1px solid ([^;]+);[^>]*font-size:11px[^>]*>([^<]+)<\/div>/g;
  while ((m = probRegex.exec(html)) !== null) {
    data.problems.push({
      title: m[1].trim(),
      desc: m[2].trim(),
      priority: m[4].trim()
    });
  }

  // Åtgärdsplan månader
  data.months = [];
  const monthRegex = /<div style="color:[^;]+; font-weight:bold; font-size:14px; margin-bottom:8px;">(Månad \d+ \([^)]+\))<\/div>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g;
  while ((m = monthRegex.exec(html)) !== null) {
    const items = [];
    const liRegex = /<li[^>]*>([^<]+)<\/li>/g;
    let li;
    while ((li = liRegex.exec(m[2])) !== null) {
      items.push(li[1].trim());
    }
    data.months.push({ label: m[1].trim(), items });
  }

  return data;
}

// Färg per poäng
function scoreColor(score) {
  if (score >= 70) return '#c62828';
  if (score >= 55) return '#e65100';
  return '#2e7d32';
}

// Färg per prioritet
function priorityStyle(p) {
  const lp = p.toLowerCase();
  if (lp === 'hög') return { bg: '#fce4ec', border: '#c62828', text: '#c62828' };
  if (lp === 'medel') return { bg: '#e3f2fd', border: '#1565c0', text: '#1565c0' };
  return { bg: '#f1f8e9', border: '#558b2f', text: '#558b2f' };
}

function leftBorderColor(p) {
  const lp = p.toLowerCase();
  if (lp === 'hög') return '#c62828';
  if (lp === 'medel') return '#1565c0';
  return '#558b2f';
}

// Generera ny HTML
function generateHTML(data) {
  const sc = scoreColor(data.score);

  const statusRows = data.statusItems.map(item => `
    <div class="status-row">
      <div class="status-label">${item.label}</div>
      <div class="status-value">${item.value}</div>
      <div class="status-icon ${item.ok ? 'ok' : 'fail'}">${item.ok ? '✓' : '✗'}</div>
    </div>`).join('');

  const problemCards = data.problems.map((p, i) => {
    const ps = priorityStyle(p.priority);
    const lbc = leftBorderColor(p.priority);
    return `
    <div class="problem-card" style="border-left-color:${lbc}">
      <div class="problem-body">
        <div class="problem-title">${i + 1}. ${p.title}</div>
        <div class="problem-desc">${p.desc}</div>
      </div>
      <div class="priority-badge" style="background:${ps.bg}; border-color:${ps.border}; color:${ps.text}">${p.priority}</div>
    </div>`;
  }).join('');

  const monthColors = ['#c62828', '#1565c0', '#558b2f', '#6a1b9a'];
  const monthCards = data.months.map((m, i) => {
    const c = monthColors[i] || '#555';
    const items = m.items.map(it => `<li>${it}</li>`).join('');
    return `
    <div class="month-block">
      <div class="month-label" style="color:${c}; border-left-color:${c}">${m.label}</div>
      <ul class="month-list">${items}</ul>
    </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Analys & åtgärdsplan — ${data.domain}</title>
<style>
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
    border: 3px solid ${sc};
    border-radius: 12px;
    padding: 14px 24px;
    min-width: 100px;
  }
  .score-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 4px; }
  .score-num { font-size: 48px; font-weight: 800; color: ${sc}; line-height: 1; }
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
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <img src="${logoSrc}" class="logo" alt="Searchboost">
      <div class="doc-title">Analys &amp; åtgärdsplan</div>
      <div class="doc-domain">${data.domain}</div>
    </div>
    <div class="score-box">
      <div class="score-label">SEO-poäng</div>
      <div class="score-num">${data.score}</div>
      <div class="score-max">/100</div>
    </div>
  </div>

  <!-- SAMMANFATTNING -->
  <div class="section">
    <div class="section-title">Sammanfattning</div>
    <div class="summary-text">
      Vi har analyserat <strong>${data.domain}</strong> och identifierat <strong>${data.problemCount} SEO-problem</strong> som påverkar er synlighet på Google negativt. Med rätt åtgärder kan ni öka er organiska trafik och nå fler potentiella kunder utan att betala för annonsering.
    </div>
  </div>

  <div class="divider-thin"></div>

  <!-- TEKNISK STATUS -->
  <div class="section">
    <div class="section-title">Aktuell teknisk status</div>
    <div class="status-grid">
      ${statusRows}
    </div>
  </div>

  <div class="divider-thin"></div>

  <!-- PROBLEM -->
  <div class="section">
    <div class="section-title">Identifierade problem (${data.problemCount} st)</div>
    ${problemCards}
  </div>

  <div class="divider-thin"></div>

  <!-- ÅTGÄRDSPLAN -->
  <div class="section">
    <div class="section-title">Rekommenderad åtgärdsplan</div>
    ${monthCards}
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
    <img src="${logoSrc}" class="footer-logo" alt="Searchboost">
    <div class="footer-contact">
      Mikael Larsson &nbsp;|&nbsp; 0760-19 49 05 &nbsp;|&nbsp; <a href="mailto:mikael@searchboost.se">mikael@searchboost.se</a>
    </div>
    <div class="footer-right">Konfidentiell<br>Framtagen för ${data.domain}</div>
  </div>

</div>
</body>
</html>`;
}

// Processa alla MD-filer
const files = fs.readdirSync(INPUT_DIR).filter(f => f.endsWith('.md'));
let count = 0;

for (const file of files) {
  const inputPath = path.join(INPUT_DIR, file);
  const html = fs.readFileSync(inputPath, 'utf8');
  const data = parseAnalysis(html);

  if (!data.domain) {
    console.log(`SKIP (ingen domän): ${file}`);
    continue;
  }

  const outName = file.replace('.md', '.html');
  const outPath = path.join(OUTPUT_DIR, outName);
  const newHtml = generateHTML(data);
  fs.writeFileSync(outPath, newHtml, 'utf8');
  console.log(`✓ ${data.domain} (score: ${data.score}, problem: ${data.problemCount}) → ${outName}`);
  count++;
}

console.log(`\nKlart! ${count} analyser genererade i ${OUTPUT_DIR}`);
