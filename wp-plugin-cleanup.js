const { chromium } = require('playwright');

const WP_URL = 'https://kompetensutveckla.se';
const WP_USER = 'Searchboost';
const WP_PASS = 'EF9VlylXI*nW9sUh%^bNp9wQ';

const SLUGS_TO_DELETE = [
    'wordpress-seo',
    'yoast-seo-premium',
    'redirection',
    'eduadmin-analytics',
    'ninja-forms-addon-manager',
];

(async () => {
    let browser;
    try {
        browser = await chromium.launch({ headless: false, channel: 'chrome' });
        console.log('Using system Chrome');
    } catch (e) {
        browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
    }

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
        viewport: { width: 1280, height: 720 },
        locale: 'sv-SE',
    });

    await context.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });

    const page = await context.newPage();

    try {
        // Login
        console.log('=== Logging in ===');
        await page.goto(`${WP_URL}/wp-login.php`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#user_login', { timeout: 15000 });
        await page.fill('#user_login', WP_USER);
        await page.fill('#user_pass', WP_PASS);
        await page.click('#wp-submit');
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        console.log('Logged in! URL:', page.url());

        // Navigate to inactive plugins
        console.log('\n=== Going to inactive plugins ===');
        await page.goto(`${WP_URL}/wp-admin/plugins.php?plugin_status=inactive`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#the-list', { timeout: 15000 });

        // List inactive plugins
        const inactivePlugins = await page.$$eval('#the-list tr', rows => {
            return rows.map(row => {
                const nameEl = row.querySelector('.plugin-title strong');
                const slug = row.getAttribute('data-slug') || '';
                const file = row.getAttribute('data-plugin') || '';
                const checkbox = row.querySelector('input[type="checkbox"]');
                return {
                    name: nameEl ? nameEl.textContent.trim() : '',
                    slug,
                    file,
                    checkboxName: checkbox ? checkbox.getAttribute('name') : null,
                    checkboxValue: checkbox ? checkbox.getAttribute('value') : null,
                };
            }).filter(p => p.name);
        });

        console.log('Inactive plugins:');
        inactivePlugins.forEach(p => console.log(`  ${p.name} (slug: ${p.slug}, file: ${p.file}, cb: ${p.checkboxValue})`));

        // Check which target plugins are in the list
        const targets = inactivePlugins.filter(p => SLUGS_TO_DELETE.includes(p.slug));
        console.log('\nTargets found:', targets.length);
        targets.forEach(p => console.log(`  ${p.name} (${p.slug})`));

        if (targets.length === 0) {
            console.log('No target plugins to delete!');
            await browser.close();
            process.exit(0);
        }

        // Select checkboxes for target plugins
        console.log('\n=== Selecting plugins for bulk delete ===');
        for (const target of targets) {
            const checkbox = await page.$(`tr[data-slug="${target.slug}"] input[type="checkbox"]`);
            if (checkbox) {
                await checkbox.check();
                console.log(`  Checked: ${target.name}`);
            } else {
                console.log(`  WARN: No checkbox for ${target.name}`);
            }
        }

        // Select "Delete" from bulk actions dropdown
        console.log('\n=== Performing bulk delete ===');
        const bulkSelect = await page.$('#bulk-action-selector-top');
        if (bulkSelect) {
            await bulkSelect.selectOption('delete-selected');
            console.log('  Selected "delete-selected" from dropdown');
        } else {
            console.log('  ERROR: Bulk action dropdown not found!');
            await page.screenshot({ path: '/tmp/wp-no-bulk.png' });
            await browser.close();
            process.exit(1);
        }

        // Click "Apply" button
        const applyBtn = await page.$('#doaction');
        if (applyBtn) {
            console.log('  Clicking Apply...');
            await applyBtn.click();
            await page.waitForLoadState('networkidle', { timeout: 30000 });
        } else {
            console.log('  ERROR: Apply button not found!');
            await browser.close();
            process.exit(1);
        }

        // Now we should be on the confirmation page
        console.log('\n=== Confirming deletion ===');
        const currentUrl = page.url();
        console.log('  Current URL:', currentUrl);

        // Take screenshot of confirmation page
        await page.screenshot({ path: '/tmp/wp-delete-confirm.png' });
        console.log('  Screenshot: /tmp/wp-delete-confirm.png');

        // Check page content
        const pageText = await page.textContent('body').catch(() => '');
        console.log('  Page text (first 500 chars):', pageText.substring(0, 500).replace(/\s+/g, ' ').trim());

        // Look for "Yes, delete these files" / "Ja, ta bort dessa filer" button
        const submitBtn = await page.$('input#submit');
        if (submitBtn) {
            const btnVal = await submitBtn.getAttribute('value');
            console.log('  Found submit button: "' + btnVal + '"');
            await submitBtn.click();
            console.log('  Clicked confirm delete!');
            await page.waitForLoadState('networkidle', { timeout: 60000 });

            // Check result
            const resultText = await page.textContent('body').catch(() => '');
            console.log('  Result (first 300 chars):', resultText.substring(0, 300).replace(/\s+/g, ' ').trim());
            await page.screenshot({ path: '/tmp/wp-delete-result.png' });
        } else {
            console.log('  No submit button found. Looking for other buttons...');
            const allButtons = await page.$$eval('input[type="submit"], button[type="submit"]', buttons =>
                buttons.map(b => ({ tag: b.tagName, name: b.name, value: b.value, id: b.id, text: b.textContent }))
            );
            console.log('  Available buttons:', JSON.stringify(allButtons));
            await page.screenshot({ path: '/tmp/wp-delete-nobutton.png' });
        }

        // Final verification
        console.log('\n=== Final verification ===');
        await page.goto(`${WP_URL}/wp-admin/plugins.php`, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForSelector('#the-list', { timeout: 15000 });

        await page.screenshot({ path: '/tmp/wp-plugins-final.png', fullPage: true });

        const remaining = await page.$$eval('#the-list tr', rows => {
            return rows.map(row => {
                const nameEl = row.querySelector('.plugin-title strong');
                const isActive = row.classList.contains('active');
                const slug = row.getAttribute('data-slug') || '';
                return { name: nameEl ? nameEl.textContent.trim() : '', slug, active: isActive };
            }).filter(p => p.name);
        });

        console.log('\nRemaining plugins (' + remaining.length + '):');
        remaining.forEach(p => console.log(`  [${p.active ? 'ACTIVE' : 'INACTIVE'}] ${p.name} (${p.slug})`));

        const stillPresent = remaining.filter(p => SLUGS_TO_DELETE.includes(p.slug));
        if (stillPresent.length === 0) {
            console.log('\nSUCCESS: All target plugins removed!');
        } else {
            console.log('\nWARNING: Still present:');
            stillPresent.forEach(p => console.log(`  - ${p.name} (${p.slug})`));
        }

    } catch (err) {
        console.error('ERROR:', err.message);
        await page.screenshot({ path: '/tmp/wp-plugin-error.png' });
        console.log('Screenshot saved to /tmp/wp-plugin-error.png');
    } finally {
        await browser.close();
    }
})();
