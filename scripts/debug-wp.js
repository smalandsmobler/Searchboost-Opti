const https = require('https');
const querystring = require('querystring');

const WP_BASE = 'www.mobelrondellen.se';
const WP_USER = 'info@searchboost.se';
const WP_PASS = '(2g*UCim0RLeywTx3z$mYuJ)';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'sv-SE,sv;q=0.9',
};
let cookies = {};

function parseCookies(h) {
  if (!h) return;
  const arr = Array.isArray(h) ? h : [h];
  arr.forEach(c => { const [k,v] = c.split(';')[0].split('='); if(k)cookies[k.trim()]=v?.trim()||''; });
}
function cookieStr() { return Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; '); }

function req(method, path, body, extra={}) {
  return new Promise((res,rej)=>{
    const opts = { hostname:WP_BASE, port:443, path, method,
      headers:{...HEADERS,...extra,'Cookie':cookieStr()} };
    if(body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const r = https.request(opts, resp => {
      parseCookies(resp.headers['set-cookie']);
      const c=[]; resp.on('data',d=>c.push(d)); resp.on('end',()=>res({status:resp.statusCode,headers:resp.headers,body:Buffer.concat(c).toString()}));
    });
    r.on('error',rej); if(body)r.write(body); r.end();
  });
}

async function main() {
  // Login
  await req('GET', '/wp-login.php');
  cookies['wordpress_test_cookie'] = 'WP+Cookie+check';
  const lr = await req('POST', '/wp-login.php',
    querystring.stringify({log:WP_USER,pwd:WP_PASS,'wp-submit':'Logga in',redirect_to:'/wp-admin/',testcookie:'1'}),
    {'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-login.php'});
  console.log('Login:', lr.status, '->', lr.headers.location);

  // Get plugins page
  const pr = await req('GET', '/wp-admin/plugins.php', null, {'Referer':'https://www.mobelrondellen.se/wp-admin/'});
  console.log('\nPlugins page status:', pr.status);

  // Extract plugin list
  const pluginMatches = pr.body.matchAll(/data-plugin="([^"]+)"/g);
  console.log('\nInstalled plugins:');
  for (const m of pluginMatches) console.log(' -', m[1]);

  // Check for file manager specifically
  if (pr.body.includes('wp-file-manager')) console.log('\nWP File Manager: FOUND');
  else console.log('\nWP File Manager: NOT FOUND');

  // Check theme editor
  const ter = await req('GET', '/wp-admin/theme-editor.php');
  console.log('\nTheme editor status:', ter.status);
  if (ter.body.includes('newcontent')) console.log('Theme editor: ACCESSIBLE');
  else if (ter.body.includes('DISALLOW_FILE_EDIT')) console.log('Theme editor: BLOCKED (DISALLOW_FILE_EDIT)');
  else console.log('Theme editor: NOT ACCESSIBLE — excerpt:', ter.body.slice(0,300).replace(/<[^>]+>/g,' ').trim().slice(0,200));

  // Check plugin editor
  const per = await req('GET', '/wp-admin/plugin-editor.php');
  console.log('\nPlugin editor status:', per.status);
  if (per.body.includes('newcontent')) console.log('Plugin editor: ACCESSIBLE');
  else console.log('Plugin editor: NOT ACCESSIBLE');

  // Check if we can write via WP options
  const opr = await req('GET', '/wp-admin/options.php');
  console.log('\nOptions page status:', opr.status);
  const nonce = opr.body.match(/name="_wpnonce"\s+value="([a-f0-9]+)"/)?.[1];
  console.log('Options nonce:', nonce || 'not found');

  // Check media upload page
  const mur = await req('GET', '/wp-admin/upload.php');
  console.log('\nMedia page status:', mur.status);

  // Can we access async-upload.php?
  const aur = await req('GET', '/wp-admin/async-upload.php');
  console.log('Async upload status:', aur.status);
}

main().catch(e => console.error('Error:', e.message));
