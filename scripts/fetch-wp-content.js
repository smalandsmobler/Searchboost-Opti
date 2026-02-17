/**
 * Fetch ALL WordPress content from Kompetensutveckla.se
 * Saves JSON files to data/kompetensutveckla/
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://kompetensutveckla.se';
const AUTH = 'Basic ' + Buffer.from('Searchboost:EF9VlylXI*nW9sUh%^bNp9wQ').toString('base64');
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'kompetensutveckla');

function fetchJSON(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': AUTH,
        'Accept': 'application/json',
        'User-Agent': 'Searchboost-Opti/1.0'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const totalPages = parseInt(res.headers['x-wp-totalpages'] || '1', 10);
        const totalItems = parseInt(res.headers['x-wp-total'] || '0', 10);

        if (res.statusCode >= 400) {
          resolve({ error: true, status: res.statusCode, body: data.substring(0, 300), totalPages: 0, totalItems: 0 });
          return;
        }

        // Handle redirects
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          resolve({ error: true, status: res.statusCode, redirect: res.headers.location, totalPages: 0, totalItems: 0 });
          return;
        }

        try {
          const parsed = JSON.parse(data);
          resolve({ data: parsed, totalPages, totalItems, status: res.statusCode });
        } catch (e) {
          resolve({ error: true, parseError: e.message, body: data.substring(0, 500), totalPages: 0, totalItems: 0 });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function fetchAllPaginated(endpoint, fields, maxPages = Infinity) {
  const allItems = [];
  let page = 1;

  while (page <= maxPages) {
    const sep = endpoint.includes('?') ? '&' : '?';
    const fieldsParam = fields ? `&_fields=${fields}` : '';
    const url = `${endpoint}${sep}per_page=100&page=${page}${fieldsParam}`;

    process.stdout.write(`  Fetching page ${page}... `);
    const result = await fetchJSON(url);

    if (result.error) {
      if (result.status === 400 && page > 1) {
        console.log('no more pages.');
        break;
      }
      console.log(`error ${result.status}: ${result.body || result.redirect || ''}`);
      if (page === 1) return { items: [], error: result };
      break;
    }

    const items = Array.isArray(result.data) ? result.data : [];
    allItems.push(...items);
    console.log(`${items.length} items (total so far: ${allItems.length}/${result.totalItems})`);

    if (page >= result.totalPages || items.length < 100) {
      break;
    }
    page++;
  }

  return { items: allItems };
}

function saveJSON(filename, data) {
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
  const size = (fs.statSync(filepath).size / 1024).toFixed(1);
  console.log(`  Saved: ${filename} (${size} KB)\n`);
}

async function main() {
  console.log('=== Fetching WordPress content from kompetensutveckla.se ===\n');

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const summary = {};

  // 1. Pages
  console.log('[1/6] Pages');
  const pages = await fetchAllPaginated(
    '/wp-json/wp/v2/pages',
    'id,title,slug,link,status,parent,content,excerpt,menu_order,template,modified'
  );
  saveJSON('wp-pages.json', pages.items);
  summary.pages = pages.items.length;

  // 2. Posts
  console.log('[2/6] Posts');
  const posts = await fetchAllPaginated(
    '/wp-json/wp/v2/posts',
    'id,title,slug,link,status,content,excerpt,categories,tags,modified'
  );
  saveJSON('wp-posts.json', posts.items);
  summary.posts = posts.items.length;

  // 3. Categories
  console.log('[3/6] Categories');
  const categories = await fetchAllPaginated(
    '/wp-json/wp/v2/categories',
    'id,name,slug,parent,count,description'
  );
  saveJSON('wp-categories.json', categories.items);
  summary.categories = categories.items.length;

  // 4. Tags
  console.log('[4/6] Tags');
  const tags = await fetchAllPaginated(
    '/wp-json/wp/v2/tags',
    'id,name,slug,count'
  );
  saveJSON('wp-tags.json', tags.items);
  summary.tags = tags.items.length;

  // 5. Media (first 3 pages only)
  console.log('[5/6] Media (max 3 pages)');
  const media = await fetchAllPaginated(
    '/wp-json/wp/v2/media',
    'id,title,slug,source_url,alt_text,media_type,mime_type',
    3
  );
  saveJSON('wp-media.json', media.items);
  summary.media = media.items.length;

  // 6. Menus - try multiple endpoints
  console.log('[6/6] Menus');
  let menus = null;

  // Try WP 5.9+ navigation endpoint
  process.stdout.write('  Trying /wp-json/wp/v2/navigation... ');
  const nav = await fetchJSON('/wp-json/wp/v2/navigation?per_page=100');
  if (!nav.error && Array.isArray(nav.data)) {
    console.log(`${nav.data.length} items`);
    menus = { source: 'wp/v2/navigation', items: nav.data };
  } else {
    console.log(`not available (${nav.status || 'error'})`);
  }

  // Try /wp-json/wp/v2/menus
  if (!menus) {
    process.stdout.write('  Trying /wp-json/wp/v2/menus... ');
    const m1 = await fetchJSON('/wp-json/wp/v2/menus?per_page=100');
    if (!m1.error && Array.isArray(m1.data)) {
      console.log(`${m1.data.length} items`);
      menus = { source: 'wp/v2/menus', items: m1.data };
    } else {
      console.log(`not available (${m1.status || 'error'})`);
    }
  }

  // Try /wp-json/menus/v1/menus (WP REST API Menus plugin)
  if (!menus) {
    process.stdout.write('  Trying /wp-json/menus/v1/menus... ');
    const m2 = await fetchJSON('/wp-json/menus/v1/menus');
    if (!m2.error) {
      console.log('found');
      menus = { source: 'menus/v1/menus', items: Array.isArray(m2.data) ? m2.data : [m2.data] };
    } else {
      console.log(`not available (${m2.status || 'error'})`);
    }
  }

  // Try /wp-json/wp/v2/menu-items
  if (!menus) {
    process.stdout.write('  Trying /wp-json/wp/v2/menu-items... ');
    const m3 = await fetchJSON('/wp-json/wp/v2/menu-items?per_page=100&menus=0');
    if (!m3.error && Array.isArray(m3.data)) {
      console.log(`${m3.data.length} items`);
      menus = { source: 'wp/v2/menu-items', items: m3.data };
    } else {
      console.log(`not available (${m3.status || 'error'})`);
    }
  }

  if (!menus) {
    menus = { source: 'none', items: [], note: 'No menu endpoint available. May require a plugin like WP REST API Menus.' };
    console.log('  No menu endpoints found.');
  }

  saveJSON('wp-menus.json', menus);
  summary.menus = menus.items ? menus.items.length : 0;

  // Print summary
  console.log('=============================');
  console.log('         SUMMARY');
  console.log('=============================');
  console.log(`  Pages:       ${summary.pages}`);
  console.log(`  Posts:        ${summary.posts}`);
  console.log(`  Categories:   ${summary.categories}`);
  console.log(`  Tags:         ${summary.tags}`);
  console.log(`  Media:        ${summary.media} (max 3 pages)`);
  console.log(`  Menus:        ${summary.menus} (source: ${menus.source})`);
  console.log(`\nAll files saved to: ${OUTPUT_DIR}`);
  console.log('Done.');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
