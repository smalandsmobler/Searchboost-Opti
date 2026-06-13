const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://ny.smalandskontorsmobler.se/product-category/skrivbord-for-kontoret/fallbord/', { waitUntil: 'networkidle', timeout: 30000 });

  // Get computed layout of key elements
  const info = await page.evaluate(() => {
    const results = {};

    // Check content-area
    const contentArea = document.querySelector('.content-area');
    if (contentArea) {
      const cs = getComputedStyle(contentArea);
      results.contentArea = { width: cs.width, float: cs.float, display: cs.display, position: cs.position };
    }

    // Check sidebar
    const sidebar = document.querySelector('#right-sidebar');
    if (sidebar) {
      const cs = getComputedStyle(sidebar);
      results.sidebar = { width: cs.width, display: cs.display, float: cs.float };
    }

    // Check products grid
    const products = document.querySelector('ul.products');
    if (products) {
      const cs = getComputedStyle(products);
      results.productsGrid = {
        display: cs.display,
        gridTemplateColumns: cs.gridTemplateColumns,
        width: cs.width,
        gap: cs.gap,
        margin: cs.margin,
        parentWidth: getComputedStyle(products.parentElement).width,
        parentClass: products.parentElement.className
      };
    }

    // Check first product card position
    const firstProduct = document.querySelector('ul.products li.product');
    if (firstProduct) {
      const rect = firstProduct.getBoundingClientRect();
      results.firstProduct = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
    }

    // Check all direct children of products wrapper
    const wrapper = products?.parentElement;
    if (wrapper) {
      results.wrapperChildren = [];
      for (const child of wrapper.children) {
        const rect = child.getBoundingClientRect();
        results.wrapperChildren.push({
          tag: child.tagName,
          class: child.className.substring(0, 80),
          left: rect.left,
          width: rect.width,
          display: getComputedStyle(child).display
        });
      }
    }

    // Check body classes
    results.bodyClass = document.body.className;

    // Check site-content wrapper chain
    const siteContent = document.querySelector('.site-content');
    if (siteContent) {
      results.siteContent = {
        width: getComputedStyle(siteContent).width,
        display: getComputedStyle(siteContent).display,
        children: Array.from(siteContent.children).map(c => ({
          tag: c.tagName,
          class: c.className.substring(0, 60),
          width: getComputedStyle(c).width,
          float: getComputedStyle(c).float,
          display: getComputedStyle(c).display
        }))
      };
    }

    return results;
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
