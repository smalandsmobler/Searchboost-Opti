#!/usr/bin/env node
/**
 * smk-fix-wpautop.js
 * Fixar WordPress wpautop-korruption på SMK startsida (ID: 9311).
 * Hämtar rendered content, rensar <p>/<\/p> inuti <style> och runt block-element,
 * wrappar allt i <!-- wp:html --> så det inte händer igen.
 */
'use strict';

const https = require('https');

const WP_URL  = 'ny.smalandskontorsmobler.se';
const PAGE_ID = 9311;
const CREDS   = Buffer.from('searchboost:ySlF 8pM4 AAS3 i8aB dK9g g51C').toString('base64');

function wpRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: WP_URL,
      path: `/wp-json/wp/v2${path}`,
      method,
      headers: {
        'Authorization': 'Basic ' + CREDS,
        'Content-Type': 'application/json',
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      },
      rejectUnauthorized: false,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { reject(new Error(`HTTP ${res.statusCode}: ${d.slice(0,300)}`)); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

/**
 * Rensar wpautop-korruption från HTML-innehåll.
 * 1. Tar bort <p> och </p> inuti <style>-block
 * 2. Tar bort falska <p><!-- kommentar --></p>
 * 3. Tar bort ensamma </p> direkt efter block-element (div, img, h1-h6 etc)
 * 4. Tar bort ensamma <p> direkt före block-element
 */
function cleanWpAutop(html) {
  // 1. Rensa inuti <style>-block
  html = html.replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/gi, (match, open, css, close) => {
    const cleanCss = css
      .replace(/<\/p>\s*\n?\s*<p>/g, '\n')
      .replace(/<\/p>/g, '')
      .replace(/<p>/g, '');
    return open + cleanCss + close;
  });

  // 2. Rensa inuti <script>-block
  html = html.replace(/(<script[^>]*>)([\s\S]*?)(<\/script>)/gi, (match, open, js, close) => {
    const cleanJs = js.replace(/<\/p>\s*<p>/g, '').replace(/<\/p>/g,'').replace(/<p>/g,'');
    return open + cleanJs + close;
  });

  // 3. Ta bort <p><!-- kommentar --></p> → <!-- kommentar -->
  html = html.replace(/<p>(<!--[\s\S]*?-->)<\/p>/g, '$1');

  // 4. Ta bort ensamma </p> direkt efter stängande block-taggar
  html = html.replace(/(<\/(?:div|section|header|footer|nav|article|aside|figure|ul|ol|li|table|thead|tbody|tr|th|td|form|fieldset|h[1-6])[^>]*>)\s*<\/p>/gi, '$1');

  // 5. Ta bort ensamma <p> direkt före öppnande block-taggar
  html = html.replace(/<p>\s*(<(?:div|section|header|footer|nav|article|aside|figure|ul|ol|li|table|thead|tbody|tr|th|td|form|fieldset|h[1-6])[^>]*>)/gi, '$1');

  // 6. Ta bort ensamma </p> direkt efter <img...>
  html = html.replace(/(<img[^>]*>)\s*<\/p>/gi, '$1');

  return html;
}

async function main() {
  console.log('Hämtar sida ID', PAGE_ID, '...');
  const res = await wpRequest('GET', `/pages/${PAGE_ID}`);
  const rendered = res.data.content?.rendered || '';
  console.log('Hämtat', rendered.length, 'chars rendered content');

  const pCount = (rendered.match(/<p>|<\/p>/g) || []).length;
  console.log('Antal <p>/<\\/p> i original:', pCount);

  // Rensa
  const cleaned = cleanWpAutop(rendered);
  const pCountAfter = (cleaned.match(/<p>|<\/p>/g) || []).length;
  console.log('Antal <p>/<\\/p> efter rensning:', pCountAfter);

  // Wrappa i Gutenberg HTML-block (bypasser wpautop permanent)
  const wpBlock = `<!-- wp:html -->\n${cleaned}\n<!-- /wp:html -->`;

  console.log('\nFörhandsgranskning (500 chars):');
  console.log(wpBlock.substring(0, 500));

  // Kolla dry-run
  if (!process.argv.includes('--publish')) {
    console.log('\n🔍 DRY RUN — kör med --publish för att uppdatera WP');
    return;
  }

  console.log('\nUppdaterar WP-sida...');
  const update = await wpRequest('POST', `/pages/${PAGE_ID}`, {
    content: wpBlock,
  });
  console.log('Status:', update.status, '| ID:', update.data.id, '| Modified:', update.data.modified);
  console.log('\n✅ Klart! Refresha ny.smalandskontorsmobler.se/hem/ i Chrome.');
}

main().catch(err => {
  console.error('FEL:', err.message);
  process.exit(1);
});
