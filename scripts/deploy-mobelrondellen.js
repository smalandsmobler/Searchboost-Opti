/**
 * Deploy Möbelrondellen React SPA via WP Theme Editor AJAX
 */

const https = require('https');
const querystring = require('querystring');
const fs = require('fs');

const DIST_DIR = '/Users/weerayootandersson/Downloads/Möbelrondellen ny/app/dist';
const WP_BASE = 'www.mobelrondellen.se';
const WP_USER = 'info@searchboost.se';
const WP_PASS = '(2g*UCim0RLeywTx3z$mYuJ)';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

let cookies = {};
function parseCookies(h){if(!h)return;(Array.isArray(h)?h:[h]).forEach(c=>{const[k,v]=c.split(';')[0].split('=');if(k)cookies[k.trim()]=v?.trim()||'';});}
function cStr(){return Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ');}
function req(method,path,body,extra={}){return new Promise((res,rej)=>{const opts={hostname:WP_BASE,port:443,path,method,headers:{'User-Agent':UA,'Accept':'text/html,*/*','Accept-Language':'sv-SE','Cookie':cStr(),...extra}};if(body)opts.headers['Content-Length']=Buffer.byteLength(body);const r=https.request(opts,resp=>{parseCookies(resp.headers['set-cookie']);const c=[];resp.on('data',d=>c.push(d));resp.on('end',()=>res({status:resp.statusCode,headers:resp.headers,body:Buffer.concat(c).toString()}));});r.on('error',rej);if(body)r.write(body);r.end();});}
function dec(s){return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"');}

async function login() {
  await req('GET', '/wp-login.php');
  cookies['wordpress_test_cookie'] = 'WP+Cookie+check';
  const lr = await req('POST', '/wp-login.php',
    querystring.stringify({ log: WP_USER, pwd: WP_PASS, 'wp-submit': 'Logga in', redirect_to: '/wp-admin/', testcookie: '1' }),
    { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': 'https://www.mobelrondellen.se/wp-login.php' }
  );
  if (lr.status !== 302) throw new Error('Login failed: ' + lr.status);
  const loc = lr.headers.location || '';
  if (loc.includes('confirm_admin_email')) {
    const cr = await req('GET', loc.replace('https://www.mobelrondellen.se', ''));
    const n = cr.body.match(/name="_wpnonce"\s+value="([a-f0-9]+)"/)?.[1];
    await req('POST', '/wp-login.php?action=confirm_admin_email',
      querystring.stringify({ _wpnonce: n, action: 'confirm_admin_email', redirect_to: '/wp-admin/' }),
      { 'Content-Type': 'application/x-www-form-urlencoded', 'Referer': 'https://www.mobelrondellen.se/wp-login.php' }
    );
  }
}

async function getThemeEditor() {
  const r = await req('GET', '/wp-admin/theme-editor.php?file=functions.php',
    null, { 'Referer': 'https://www.mobelrondellen.se/wp-admin/' });

  const raw = r.body.match(/<textarea[^>]+id="newcontent"[^>]*>([\s\S]*?)<\/textarea>/)?.[1] || '';
  const content = dec(raw);
  const theme = r.body.match(/name="theme"\s+value="([^"]+)"/)?.[1] || 'siteorigin-corp-child';

  // Find editor nonce (the one in JS code editor vars)
  const nonce =
    r.body.match(/"code_editor_nonce"\s*:\s*"([a-f0-9]+)"/)?.[1] ||
    r.body.match(/CodeMirror[^{]*\{[^}]*"nonce"\s*:\s*"([a-f0-9]+)"/)?.[1] ||
    // Look for the specific theme-editor save nonce
    r.body.match(/wp_code_editor_settings[^}]*"nonce"\s*:\s*"([a-f0-9]+)"/)?.[1] ||
    // The nonce that appears 6 times as attribute
    r.body.match(/nonce="([a-f0-9]+)"/)?.[1];

  console.log('   Theme:', theme, 'Content:', content.length, 'chars, Nonce:', nonce);
  return { content, theme, nonce, pageNonces: [...r.body.matchAll(/nonce[^a-z0-9_'"]*["':]+\s*["']?([a-f0-9]{10})/gi)].map(m=>m[1]) };
}

async function saveThemeFile(content, theme, nonce) {
  // Method 1: Standard WP AJAX edit-theme-plugin-file
  const body = querystring.stringify({
    action: 'edit-theme-plugin-file',
    file: 'functions.php',
    theme: theme,
    newcontent: content,
    nonce: nonce,
    scrollto: '0',
  });

  const r = await req('POST', '/wp-admin/admin-ajax.php', body, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': 'https://www.mobelrondellen.se/wp-admin/theme-editor.php',
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json, text/javascript, */*; q=0.01',
  });
  return r;
}

async function saveThemeFileForm(content, theme, nonce) {
  // Method 2: POST form to theme-editor.php
  // WP uses name="nonce" (not _wpnonce) in this installation
  const body = querystring.stringify({
    nonce: nonce,
    _wpnonce: nonce,
    _wp_http_referer: '/wp-admin/theme-editor.php',
    newcontent: content,
    action: 'update',
    file: 'functions.php',
    theme: theme,
    scrollto: '0',
  });

  const r = await req('POST', '/wp-admin/theme-editor.php', body, {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Referer': 'https://www.mobelrondellen.se/wp-admin/theme-editor.php',
  });
  return r;
}

const HANDLER_MARKER = 'sb_deploy_handler_v2';
const PHP_HANDLER = `
// ${HANDLER_MARKER}
add_action('wp_ajax_sb_deploy_write', function() {
    if (!current_user_can('manage_options')) { echo json_encode(['ok'=>false,'e'=>'perm']); exit; }
    $f = ltrim(wp_unslash($_POST['file']), '/');
    $ok = ['index.html','assets/index-mtO_aoaE.js','assets/index-C5jqeeHv.css'];
    if (!in_array($f, $ok)) { echo json_encode(['ok'=>false,'e'=>'denied:'.$f]); exit; }
    $dest = ABSPATH . $f;
    if (!is_dir(dirname($dest))) mkdir(dirname($dest), 0755, true);
    $bytes = file_put_contents($dest, base64_decode($_POST['data']));
    echo json_encode(['ok' => $bytes !== false, 'b' => $bytes, 'p' => $dest]);
    exit;
});
`;

async function main() {
  console.log('=== Möbelrondellen Deploy ===\n');

  console.log('1. Login...');
  await login();
  console.log('   ✓');

  console.log('2. Reading functions.php...');
  const { content: original, theme, nonce, pageNonces } = await getThemeEditor();
  console.log('   Available nonces:', [...new Set(pageNonces)].slice(0, 8).join(', '));

  // Try each nonce to find the right one for saving
  const uniqueNonces = [...new Set(pageNonces)];

  console.log('3. Injecting AJAX handler...');
  if (original.includes(HANDLER_MARKER)) {
    console.log('   Already present');
  } else {
    const newContent = original.replace(/\?>\s*$/, '') + PHP_HANDLER;

    let saved = false;
    for (const tryNonce of uniqueNonces) {
      // Try AJAX method
      const r1 = await saveThemeFile(newContent, theme, tryNonce);
      console.log(`   AJAX (nonce=${tryNonce}): ${r1.status} → ${r1.body.slice(0,120)}`);
      if (r1.body.includes('"success":true')) { saved = true; break; }

      // Try form method
      const r2 = await saveThemeFileForm(newContent, theme, tryNonce);
      const msg = r2.body.match(/class="[^"]*(?:updated|notice-success)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/)?.[1]?.replace(/<[^>]+>/g,'').trim();
      const errMsg = r2.body.match(/class="[^"]*(?:error|notice-error)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/)?.[1]?.replace(/<[^>]+>/g,'').trim();
      if (msg) console.log(`   Form OK (nonce=${tryNonce}): ${msg}`);
      if (errMsg) console.log(`   Form ERR (nonce=${tryNonce}): ${errMsg.slice(0,120)}`);
      if (msg?.includes('uppdaterades') || msg?.includes('updated')) { saved = true; break; }
    }

    // Verify
    const { content: verify } = await getThemeEditor();
    if (verify.includes(HANDLER_MARKER)) {
      console.log('   ✓ Handler saved!');
    } else {
      console.log('   ✗ Save failed — trying upload fallback...');
      await fallbackUpload();
      return;
    }
  }

  // Wait a moment
  await new Promise(r => setTimeout(r, 500));

  console.log('4. Uploading files via AJAX...');
  const files = [
    { local: `${DIST_DIR}/index.html`, remote: 'index.html' },
    { local: `${DIST_DIR}/assets/index-mtO_aoaE.js`, remote: 'assets/index-mtO_aoaE.js' },
    { local: `${DIST_DIR}/assets/index-C5jqeeHv.css`, remote: 'assets/index-C5jqeeHv.css' },
  ];

  for (const f of files) {
    const data = fs.readFileSync(f.local).toString('base64');
    const kb = Math.round(fs.statSync(f.local).size / 1024);
    process.stdout.write(`   ${f.remote} (${kb}KB)... `);

    const body = querystring.stringify({ action: 'sb_deploy_write', file: f.remote, data });
    const r = await req('POST', '/wp-admin/admin-ajax.php', body, {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Referer': 'https://www.mobelrondellen.se/wp-admin/',
      'X-Requested-With': 'XMLHttpRequest',
    });

    try {
      const json = JSON.parse(r.body);
      if (json.ok) console.log(`✓ (${json.b} bytes, path: ${json.p})`);
      else console.log(`✗ ${json.e || JSON.stringify(json)}`);
    } catch {
      console.log(`raw: ${r.body.slice(0, 150)}`);
    }
  }

  console.log('\n5. Cleaning up...');
  const { content: cur, theme: t2, nonce: n2, pageNonces: pn2 } = await getThemeEditor();
  const cleaned = cur.replace(/\n\/\/ sb_deploy_handler_v2[\s\S]*?exit;\s*\}\);\n?/g, '');
  const un2 = [...new Set(pn2)];
  for (const n of un2) {
    const r = await saveThemeFile(cleaned, t2, n);
    if (r.body.includes('"success":true')) break;
    const r2 = await saveThemeFileForm(cleaned, t2, n);
    if (r2.body.includes('uppdaterades') || r2.body.includes('updated')) break;
  }
  const { content: fin } = await getThemeEditor();
  console.log('   Handler removed:', !fin.includes(HANDLER_MARKER));

  console.log('\n✓ Done! https://www.mobelrondellen.se/oppettider/');
}

async function fallbackUpload() {
  console.log('\nFallback: All-in-One WP Migration (aio-wp-migration) to overwrite static files...');
  console.log('Cannot auto-deploy. Manual steps needed:');
  console.log('  1. Open https://www.mobelrondellen.se/wp-admin/theme-editor.php');
  console.log('  2. Add the handler PHP to functions.php manually');
  console.log('  3. Re-run this script');
}

main().catch(e => { console.error('\nFatal:', e.message); process.exit(1); });
