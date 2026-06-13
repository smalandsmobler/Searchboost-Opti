const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const url = process.argv[2] || 'https://ny.smalandskontorsmobler.se/product-category/skrivbord-for-kontoret/fallbord/';
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Dismiss cookie banners aggressively
  try {
    // Try various common cookie button selectors
    const selectors = [
      'text="Hantera cookies"',
      'text="Acceptera"',
      'text="Accept"',
      'text="Accept All"',
      'text="Godkänn"',
      '.cookie-close',
      '#cookie-accept',
      '[data-action="accept-cookies"]',
      '.cc-dismiss',
      '#onetrust-accept-btn-handler'
    ];
    for (const sel of selectors) {
      const btn = await page.$(sel);
      if (btn) { await btn.click(); break; }
    }
    await page.waitForTimeout(1000);
  } catch(e) {}

  // Also try hiding cookie overlays via JS
  await page.evaluate(() => {
    document.querySelectorAll('[class*="cookie"], [id*="cookie"], [class*="consent"], [id*="consent"], [class*="gdpr"]').forEach(el => el.remove());
    document.querySelectorAll('.modal-backdrop, .overlay').forEach(el => el.remove());
    document.body.style.overflow = 'auto';
  }).catch(() => {});

  const output = process.argv[3] || '/tmp/smk-screenshot.png';
  const fullPage = process.argv[4] === 'full';
  await page.screenshot({ path: output, fullPage: fullPage });
  console.log('Screenshot: ' + output);
  await browser.close();
})();
