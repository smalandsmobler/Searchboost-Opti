/**
 * PDF Report Generator — Searchboost Opti
 *
 * Genererar "SEO & Prestandarapport" PDF (åtgärdsrapport)
 * Samma format som de manuella ChatGPT-rapporterna i Trello.
 *
 * Struktur:
 * 1. Searchboost-logotyp
 * 2. Titel + datum
 * 3. Prestandaöversikt (PageSpeed mobil + desktop)
 * 4. Identifierade huvudproblem (punktlista)
 * 5. Sammanfattning (nyckeltal)
 * 6. Analys (fritext)
 * 7. Åtgärdsplan (hög/medel/låg prioritet)
 * 8. Kontaktinfo
 * 9. Searchboost-footer
 */

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

// Searchboost brand colors
const COLORS = {
  pink: '#e91e8c',
  darkBg: '#1a1a2e',
  white: '#ffffff',
  textDark: '#333333',
  textGray: '#666666',
  errorRed: '#dc3545',
  warningYellow: '#f59e0b',
  successGreen: '#10b981',
  infoCyan: '#00d4ff',
  lightBg: '#f8f9fa'
};

/**
 * Generate the action report HTML
 */
function generateReportHTML(data) {
  const {
    companyName,
    domain,
    date,
    score,
    issues = [],
    seoData = {},
    additionalPages = [],
    summary,
    costEstimate,
    pageSpeed = null
  } = data;

  const criticalIssues = issues.filter(i => i.severity === 'high');
  const warningIssues = issues.filter(i => i.severity === 'medium');
  const infoIssues = issues.filter(i => i.severity === 'low' || i.severity === 'info');

  // PageSpeed values (use real data if available, else estimate from score)
  const mobileScore = pageSpeed?.mobile?.score || Math.max(20, score - 15);
  const desktopScore = pageSpeed?.desktop?.score || Math.min(99, score + 20);

  // Score color helper
  const scoreColor = (s) => s >= 90 ? COLORS.successGreen : s >= 50 ? COLORS.warningYellow : COLORS.errorRed;
  const scoreLabel = (s) => s >= 90 ? 'Bra' : s >= 50 ? 'Behöver förbättring' : 'Dåligt';

  // Format date
  const reportDate = date || new Date().toLocaleDateString('sv-SE', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  // Count total pages
  const totalPages = (additionalPages.length || 0) + 1;

  // Build issue descriptions for the summary section
  const issueDescriptions = issues.map(i => {
    const icon = i.severity === 'high' ? '🔴' : i.severity === 'medium' ? '🟡' : 'ℹ️';
    return `<li>${icon} ${escapeHtml(i.description)}</li>`;
  }).join('\n');

  // Build high priority actions
  const highPriorityActions = criticalIssues.map(i =>
    `<li>${escapeHtml(i.recommendation || i.description)}</li>`
  ).join('\n');

  // Build medium priority actions
  const mediumPriorityActions = warningIssues.map(i =>
    `<li>${escapeHtml(i.recommendation || i.description)}</li>`
  ).join('\n');

  // Build low priority / long-term actions
  const longTermActions = infoIssues.map(i =>
    `<li>${escapeHtml(i.recommendation || i.description)}</li>`
  ).join('\n');

  // Additional standard recommendations
  const standardLongTerm = `
    <li>Arbeta med att bygga kvalitetslänkar från svenska branschportaler.</li>
    <li>Förbättra Domain Trust genom innehåll, PR och partnerskap.</li>
    <li>Övervaka Core Web Vitals i PageSpeed Insights kontinuerligt.</li>
    <li>Optimera intern länkstruktur för att stärka viktiga sidor.</li>
  `;

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    color: ${COLORS.textDark};
    line-height: 1.6;
    background: white;
  }

  .page {
    padding: 50px 60px;
    min-height: 100vh;
    page-break-after: always;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 3px solid ${COLORS.pink};
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, ${COLORS.pink}, #ff6b9d);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 24px;
  }

  .logo-text {
    font-size: 22px;
    font-weight: 700;
    color: ${COLORS.pink};
    letter-spacing: -0.5px;
  }

  .logo-sub {
    font-size: 11px;
    color: ${COLORS.textGray};
    font-weight: 400;
  }

  /* Title section */
  .report-title {
    margin-bottom: 40px;
  }

  .report-title h1 {
    font-size: 28px;
    font-weight: 700;
    color: ${COLORS.textDark};
    margin-bottom: 8px;
  }

  .report-title .date {
    font-size: 14px;
    color: ${COLORS.textGray};
  }

  /* Score circles */
  .performance-section {
    margin-bottom: 40px;
  }

  .performance-section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .performance-section .subtitle {
    font-size: 13px;
    color: ${COLORS.textGray};
    margin-bottom: 24px;
  }

  .score-row {
    display: flex;
    gap: 60px;
    justify-content: center;
    margin-bottom: 16px;
  }

  .score-item {
    text-align: center;
  }

  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    position: relative;
  }

  .score-circle::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 8px solid #e5e7eb;
  }

  .score-circle::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 8px solid transparent;
  }

  .score-circle .number {
    font-size: 36px;
    font-weight: 700;
    line-height: 1;
  }

  .score-circle .label-text {
    font-size: 10px;
    color: ${COLORS.textGray};
    margin-top: 4px;
  }

  .score-item .type-label {
    font-size: 14px;
    font-weight: 600;
    color: ${COLORS.textDark};
  }

  .score-legend {
    display: flex;
    justify-content: center;
    gap: 24px;
    margin-top: 20px;
    font-size: 12px;
    color: ${COLORS.textGray};
  }

  .score-legend span {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .legend-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;
  }

  /* Issues section */
  .issues-section {
    margin-bottom: 40px;
  }

  .issues-section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .issues-list {
    list-style: none;
    padding: 0;
  }

  .issues-list li {
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 14px;
    line-height: 1.5;
  }

  .issues-list li:last-child {
    border-bottom: none;
  }

  /* Summary section */
  .summary-section {
    background: ${COLORS.lightBg};
    border-radius: 12px;
    padding: 30px;
    margin-bottom: 40px;
  }

  .summary-section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 16px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-bottom: 20px;
  }

  .summary-item {
    font-size: 13px;
    padding: 4px 0;
  }

  .summary-item .label {
    color: ${COLORS.textGray};
  }

  .summary-item .value {
    font-weight: 600;
  }

  /* Analysis text */
  .analysis-section {
    margin-bottom: 40px;
  }

  .analysis-section h2 {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .analysis-section p {
    font-size: 14px;
    line-height: 1.8;
    color: ${COLORS.textDark};
  }

  /* Action plan */
  .action-plan {
    margin-bottom: 40px;
  }

  .action-plan h2 {
    font-size: 22px;
    font-weight: 700;
    margin-bottom: 24px;
  }

  .priority-section {
    margin-bottom: 24px;
  }

  .priority-label {
    font-size: 16px;
    font-weight: 600;
    margin-bottom: 12px;
    padding: 6px 14px;
    border-radius: 6px;
    display: inline-block;
  }

  .priority-high .priority-label {
    background: #fee2e2;
    color: ${COLORS.errorRed};
  }

  .priority-medium .priority-label {
    background: #fef3c7;
    color: #b45309;
  }

  .priority-low .priority-label {
    background: #d1fae5;
    color: #065f46;
  }

  .priority-section ul {
    list-style: disc;
    padding-left: 24px;
  }

  .priority-section li {
    font-size: 14px;
    padding: 4px 0;
    line-height: 1.6;
  }

  /* Cost section */
  .cost-section {
    background: linear-gradient(135deg, #fdf2f8, #f5f3ff);
    border: 2px solid ${COLORS.pink};
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 40px;
    text-align: center;
  }

  .cost-section h3 {
    font-size: 16px;
    color: ${COLORS.textGray};
    margin-bottom: 8px;
  }

  .cost-amount {
    font-size: 36px;
    font-weight: 700;
    color: ${COLORS.pink};
  }

  .cost-period {
    font-size: 14px;
    color: ${COLORS.textGray};
  }

  .cost-tier {
    display: inline-block;
    margin-top: 8px;
    padding: 4px 12px;
    background: ${COLORS.pink};
    color: white;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }

  /* Contact */
  .contact-section {
    margin-bottom: 40px;
    padding: 30px;
    background: ${COLORS.lightBg};
    border-radius: 12px;
  }

  .contact-section .logo-text {
    margin-bottom: 16px;
  }

  .contact-info {
    font-size: 14px;
    line-height: 2;
    color: ${COLORS.textDark};
  }

  .contact-info .role {
    color: ${COLORS.textGray};
    font-weight: 500;
  }

  /* Footer */
  .footer {
    background: ${COLORS.pink};
    color: white;
    text-align: center;
    padding: 24px;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 2px;
    border-radius: 8px;
    margin-top: 40px;
  }

  /* Page break utility */
  .page-break {
    page-break-before: always;
    margin-top: 0;
    padding-top: 40px;
  }
</style>
</head>
<body>

<!-- PAGE 1: Header + Performance + Issues -->
<div class="page">
  <div class="header">
    <div class="logo">
      <div class="logo-icon">🚀</div>
      <div>
        <div class="logo-text">SEARCHBOOST</div>
        <div class="logo-sub">Sökmotoroptimering & Digital Tillväxt</div>
      </div>
    </div>
  </div>

  <div class="report-title">
    <h1>SEO & Prestandarapport – ${escapeHtml(domain)}</h1>
    <div class="date">Datum: ${reportDate}</div>
  </div>

  <div class="performance-section">
    <h2>Prestandaöversikt</h2>
    <p class="subtitle">Nedan visas prestandapoängen från Google PageSpeed Insights för både mobil och desktop.</p>

    <div class="score-row">
      <div class="score-item">
        <div class="score-circle" style="border: 8px solid ${scoreColor(mobileScore)}">
          <span class="number" style="color: ${scoreColor(mobileScore)}">${mobileScore}</span>
          <span class="label-text">poäng</span>
        </div>
        <div class="type-label">Mobil-Prestanda</div>
      </div>
      <div class="score-item">
        <div class="score-circle" style="border: 8px solid ${scoreColor(desktopScore)}">
          <span class="number" style="color: ${scoreColor(desktopScore)}">${desktopScore}</span>
          <span class="label-text">poäng</span>
        </div>
        <div class="type-label">Desktop-Prestanda</div>
      </div>
    </div>

    <div class="score-legend">
      <span><span class="legend-dot" style="background:${COLORS.successGreen}"></span> Bra (90–100)</span>
      <span><span class="legend-dot" style="background:${COLORS.warningYellow}"></span> Behöver förbättring (50–89)</span>
      <span><span class="legend-dot" style="background:${COLORS.errorRed}"></span> Dåligt (0–49)</span>
    </div>
  </div>

  <div class="issues-section">
    <h2>Identifierade huvudproblem</h2>
    <ul class="issues-list">
      ${issueDescriptions || '<li>Inga problem identifierade.</li>'}
    </ul>
  </div>
</div>

<!-- PAGE 2: Summary + Analysis + Action Plan -->
<div class="page page-break">
  <div class="header">
    <div class="logo">
      <div class="logo-icon">🚀</div>
      <div>
        <div class="logo-text">SEARCHBOOST</div>
      </div>
    </div>
  </div>

  <div class="summary-section">
    <h2>Sammanfattning</h2>
    <div class="summary-grid">
      <div class="summary-item"><span class="label">Datum:</span> <span class="value">${reportDate}</span></div>
      <div class="summary-item"><span class="label">Health Score:</span> <span class="value">${score} / 100</span></div>
      <div class="summary-item"><span class="label">Totalt antal sidor granskade:</span> <span class="value">${totalPages}</span></div>
      <div class="summary-item"><span class="label">Totalt antal problem:</span> <span class="value">${issues.length} (${criticalIssues.length} fel, ${warningIssues.length} varningar, ${infoIssues.length} notiser)</span></div>
      <div class="summary-item"><span class="label">Title-tagg:</span> <span class="value">${seoData.title ? '✅ Finns' : '❌ Saknas'}</span></div>
      <div class="summary-item"><span class="label">Meta description:</span> <span class="value">${seoData.description ? '✅ Finns' : '❌ Saknas'}</span></div>
      <div class="summary-item"><span class="label">Schema markup:</span> <span class="value">${seoData.hasSchema ? '✅ Ja' : '❌ Nej'}</span></div>
      <div class="summary-item"><span class="label">Sitemap:</span> <span class="value">${seoData.hasSitemap ? '✅ Ja' : '❌ Nej'}</span></div>
    </div>
  </div>

  <div class="analysis-section">
    <h2>Analys</h2>
    <p>${escapeHtml(summary || 'Ingen sammanfattning tillgänglig.')}</p>
  </div>

  <div class="action-plan">
    <h2>Åtgärdsplan</h2>

    ${criticalIssues.length > 0 ? `
    <div class="priority-section priority-high">
      <div class="priority-label">Hög prioritet</div>
      <ul>
        ${highPriorityActions}
      </ul>
    </div>
    ` : ''}

    ${warningIssues.length > 0 ? `
    <div class="priority-section priority-medium">
      <div class="priority-label">Medelhög prioritet</div>
      <ul>
        ${mediumPriorityActions}
      </ul>
    </div>
    ` : ''}

    <div class="priority-section priority-low">
      <div class="priority-label">Långsiktig förbättring</div>
      <ul>
        ${longTermActions}
        ${standardLongTerm}
      </ul>
    </div>
  </div>

  ${costEstimate ? `
  <div class="cost-section">
    <h3>Rekommenderad månadsinsats</h3>
    <div class="cost-amount">${Number(costEstimate.amount || costEstimate).toLocaleString('sv-SE')} kr</div>
    <div class="cost-period">/månad exkl. moms</div>
    ${costEstimate.tier ? `<div class="cost-tier">${costEstimate.tier}</div>` : ''}
  </div>
  ` : ''}

  <div class="contact-section">
    <div class="logo-text" style="color: ${COLORS.pink}; font-size: 20px;">SEARCHBOOST</div>
    <div class="contact-info">
      <div class="role">Medierådgivare:</div>
      <div><strong>Mikael Larsson</strong></div>
      <div>0760-19 49 05</div>
      <div>mikael@searchboost.nu</div>
      <div>www.searchboost.nu</div>
    </div>
  </div>

  <div class="footer">SEARCHBOOST</div>
</div>

</body>
</html>`;
}


/**
 * Fetch PageSpeed Insights scores
 */
async function fetchPageSpeed(url) {
  const axios = require('axios');
  const result = { mobile: null, desktop: null };

  try {
    // Mobile
    const mobileResp = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
      params: { url, strategy: 'mobile', category: 'performance' },
      timeout: 30000
    });
    const mobileData = mobileResp.data?.lighthouseResult;
    if (mobileData) {
      result.mobile = {
        score: Math.round((mobileData.categories?.performance?.score || 0) * 100),
        fcp: mobileData.audits?.['first-contentful-paint']?.displayValue || null,
        lcp: mobileData.audits?.['largest-contentful-paint']?.displayValue || null,
        cls: mobileData.audits?.['cumulative-layout-shift']?.displayValue || null,
        tbt: mobileData.audits?.['total-blocking-time']?.displayValue || null
      };
    }
  } catch (e) {
    console.error('PageSpeed mobile error:', e.message);
  }

  try {
    // Desktop
    const desktopResp = await axios.get('https://www.googleapis.com/pagespeedonline/v5/runPagespeed', {
      params: { url, strategy: 'desktop', category: 'performance' },
      timeout: 30000
    });
    const desktopData = desktopResp.data?.lighthouseResult;
    if (desktopData) {
      result.desktop = {
        score: Math.round((desktopData.categories?.performance?.score || 0) * 100),
        fcp: desktopData.audits?.['first-contentful-paint']?.displayValue || null,
        lcp: desktopData.audits?.['largest-contentful-paint']?.displayValue || null,
        cls: desktopData.audits?.['cumulative-layout-shift']?.displayValue || null,
        tbt: desktopData.audits?.['total-blocking-time']?.displayValue || null
      };
    }
  } catch (e) {
    console.error('PageSpeed desktop error:', e.message);
  }

  return result;
}


/**
 * Generate PDF from analysis data
 * @param {Object} data - Analysis data from domain-analysis endpoint
 * @param {string} outputDir - Directory to save PDF
 * @returns {string} Path to generated PDF
 */
async function generateReportPDF(data, outputDir) {
  const html = generateReportHTML(data);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filename = `atgardsrapport-${data.domain.replace(/[^a-zA-Z0-9.-]/g, '_')}.pdf`;
  const outputPath = path.join(outputDir, filename);

  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.pdf({
      path: outputPath,
      format: 'A4',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
      preferCSSPageSize: false
    });

    console.log(`PDF generated: ${outputPath}`);
    return { path: outputPath, filename };
  } finally {
    if (browser) await browser.close();
  }
}


/**
 * Helper: escape HTML
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}


module.exports = {
  generateReportHTML,
  generateReportPDF,
  fetchPageSpeed
};
