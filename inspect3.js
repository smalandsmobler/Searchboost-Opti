const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://ny.smalandskontorsmobler.se/product-category/skrivbord-for-kontoret/fallbord/', { waitUntil: 'networkidle', timeout: 30000 });

  const info = await page.evaluate(() => {
    const ul = document.querySelector('ul.products');
    const cs = getComputedStyle(ul);
    const before = getComputedStyle(ul, '::before');
    const after = getComputedStyle(ul, '::after');

    return {
      ulDisplay: cs.display,
      ulGridCols: cs.gridTemplateColumns,
      beforeContent: before.content,
      beforeDisplay: before.display,
      beforeWidth: before.width,
      afterContent: after.content,
      afterDisplay: after.display,
      afterWidth: after.width,
      // Check li::before too
      firstLi: {
        beforeContent: getComputedStyle(ul.children[0], '::before').content,
        beforeDisplay: getComputedStyle(ul.children[0], '::before').display,
      },
      // Check if there are text nodes
      childNodes: Array.from(ul.childNodes).map(n => ({
        type: n.nodeType,
        name: n.nodeName,
        text: n.textContent?.substring(0, 50)
      })).slice(0, 5)
    };
  });

  console.log(JSON.stringify(info, null, 2));
  await browser.close();
})();
