const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://ny.smalandskontorsmobler.se/product-category/skrivbord-for-kontoret/fallbord/', { waitUntil: 'networkidle', timeout: 30000 });

  const info = await page.evaluate(() => {
    const ul = document.querySelector('ul.products');
    const items = [];
    // Check ALL direct children of ul.products
    for (let i = 0; i < Math.min(ul.children.length, 20); i++) {
      const child = ul.children[i];
      const rect = child.getBoundingClientRect();
      const cs = getComputedStyle(child);
      items.push({
        index: i,
        tag: child.tagName,
        class: child.className.substring(0, 100),
        display: cs.display,
        visibility: cs.visibility,
        width: rect.width,
        height: rect.height,
        left: rect.left,
        top: rect.top,
        hasContent: child.innerHTML.substring(0, 80)
      });
    }
    return { totalChildren: ul.children.length, items };
  });

  console.log('Total children in ul.products:', info.totalChildren);
  info.items.forEach(item => {
    console.log(`[${item.index}] <${item.tag}> class="${item.class}" display=${item.display} vis=${item.visibility} left=${item.left} top=${item.top} w=${item.width} h=${item.height}`);
    if (item.width === 0 || item.height === 0 || item.display === 'none') {
      console.log('  ^^^ HIDDEN/EMPTY');
    }
    console.log('  content: ' + item.hasContent.substring(0, 100));
  });
  await browser.close();
})();
