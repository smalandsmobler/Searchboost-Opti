const https = require('https');
const querystring = require('querystring');

const WP_BASE = 'www.mobelrondellen.se';
const WP_USER = 'info@searchboost.se';
const WP_PASS = '(2g*UCim0RLeywTx3z$mYuJ)';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
let cookies = {};

function parseCookies(h) {
  if (!h) return;
  (Array.isArray(h)?h:[h]).forEach(c=>{const[k,v]=c.split(';')[0].split('=');if(k)cookies[k.trim()]=v?.trim()||'';});
}
function cStr() { return Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; '); }
function req(method, path, body, extra={}) {
  return new Promise((res,rej)=>{
    const opts={hostname:WP_BASE,port:443,path,method,headers:{'User-Agent':UA,'Accept':'text/html,*/*','Accept-Language':'sv-SE','Cookie':cStr(),...extra}};
    if(body)opts.headers['Content-Length']=Buffer.byteLength(body);
    const r=https.request(opts,resp=>{parseCookies(resp.headers['set-cookie']);const c=[];resp.on('data',d=>c.push(d));resp.on('end',()=>res({status:resp.statusCode,headers:resp.headers,body:Buffer.concat(c).toString()}));});
    r.on('error',rej);if(body)r.write(body);r.end();
  });
}
function dec(s){return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"');}

async function main() {
  // Login
  await req('GET','/wp-login.php');
  cookies['wordpress_test_cookie']='WP+Cookie+check';
  const lr=await req('POST','/wp-login.php',querystring.stringify({log:WP_USER,pwd:WP_PASS,'wp-submit':'Logga in',redirect_to:'/wp-admin/',testcookie:'1'}),{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-login.php'});
  if(lr.status===302 && lr.headers.location?.includes('confirm_admin_email')) {
    const cr=await req('GET',lr.headers.location.replace('https://www.mobelrondellen.se',''));
    const n=cr.body.match(/name="_wpnonce"\s+value="([a-f0-9]+)"/)?.[1];
    await req('POST','/wp-login.php?action=confirm_admin_email',querystring.stringify({_wpnonce:n,action:'confirm_admin_email',redirect_to:'/wp-admin/'}),{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-login.php'});
  }
  console.log('Logged in, cookies:', Object.keys(cookies).filter(k=>k.includes('logged')));

  // Check current functions.php content
  const ter=await req('GET','/wp-admin/theme-editor.php?file=functions.php',null,{'Referer':'https://www.mobelrondellen.se/wp-admin/'});
  const raw=ter.body.match(/<textarea[^>]+id="newcontent"[^>]*>([\s\S]*?)<\/textarea>/)?.[1]||'';
  const content=dec(raw);
  console.log('\nfunctions.php contains sb_deploy_handler_v1:', content.includes('sb_deploy_handler_v1'));
  console.log('functions.php length:', content.length);
  console.log('Last 500 chars:', content.slice(-500));

  // Test AJAX with a simple action
  const testBody = querystring.stringify({ action: 'sb_deploy_write', file: 'index.html', data: btoa('<test>') });
  const ar = await req('POST','/wp-admin/admin-ajax.php',testBody,{
    'Content-Type':'application/x-www-form-urlencoded',
    'Referer':'https://www.mobelrondellen.se/wp-admin/',
    'X-Requested-With':'XMLHttpRequest'
  });
  console.log('\nAJAX test response:', ar.status, ar.body.slice(0,300));

  // Check if writing to wp-content works
  const testWriteBody = querystring.stringify({ action: 'sb_deploy_write', file: 'wp-content/sb-test.txt', data: Buffer.from('hello').toString('base64') });
  // First modify the handler to allow wp-content/sb-test.txt
}

main().catch(e=>console.error('Error:',e.message));
