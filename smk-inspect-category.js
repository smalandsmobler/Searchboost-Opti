const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://ny.smalandskontorsmobler.se/product-category/skrivbord-for-kontoret/fallbord/', { waitUntil: 'networkidle', timeout: 30000 });

  const info = await page.evaluate(() => {
    const desc = document.querySelector('.term-description') || document.querySelector('.woocommerce-products-header__description');
    const pageTitle = document.querySelector('.woocommerce-products-header__title, .page-title, h1');
    const productGrid = document.querySelector('ul.products');
    const main = document.querySelector('.site-main, main');

    return {
      title: pageTitle ? pageTitle.outerHTML : 'no title',
      descExists: desc ? true : false,
      descHTML: desc ? desc.outerHTML.substring(0, 500) : 'none',
      bodyClasses: document.body.className.substring(0, 300),
      mainHTML: main ? main.innerHTML.substring(0, 2000) : 'none'
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
