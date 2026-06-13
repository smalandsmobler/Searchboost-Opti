const https = require('https');
const querystring = require('querystring');

const WP_BASE = 'www.mobelrondellen.se';
const WP_USER = 'info@searchboost.se';
const WP_PASS = '(2g*UCim0RLeywTx3z$mYuJ)';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
let cookies = {};

function parseCookies(h) { if(!h)return;(Array.isArray(h)?h:[h]).forEach(c=>{const[k,v]=c.split(';')[0].split('=');if(k)cookies[k.trim()]=v?.trim()||'';});}
function cStr() { return Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; '); }
function req(method,path,body,extra={}) {
  return new Promise((res,rej)=>{
    const opts={hostname:WP_BASE,port:443,path,method,headers:{'User-Agent':UA,'Accept':'text/html,*/*','Accept-Language':'sv-SE','Cookie':cStr(),...extra}};
    if(body)opts.headers['Content-Length']=Buffer.byteLength(body);
    const r=https.request(opts,resp=>{parseCookies(resp.headers['set-cookie']);const c=[];resp.on('data',d=>c.push(d));resp.on('end',()=>res({status:resp.statusCode,headers:resp.headers,body:Buffer.concat(c).toString()}));});
    r.on('error',rej);if(body)r.write(body);r.end();
  });
}
function dec(s){return s.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"');}

async function main() {
  await req('GET','/wp-login.php');
  cookies['wordpress_test_cookie']='WP+Cookie+check';
  const lr=await req('POST','/wp-login.php',querystring.stringify({log:WP_USER,pwd:WP_PASS,'wp-submit':'Logga in',redirect_to:'/wp-admin/',testcookie:'1'}),{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-login.php'});
  if(lr.status===302 && lr.headers.location?.includes('confirm_admin_email')) {
    const cr=await req('GET',lr.headers.location.replace('https://www.mobelrondellen.se',''));
    const n=cr.body.match(/name="_wpnonce"\s+value="([a-f0-9]+)"/)?.[1];
    await req('POST','/wp-login.php?action=confirm_admin_email',querystring.stringify({_wpnonce:n,action:'confirm_admin_email',redirect_to:'/wp-admin/'}),{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-login.php'});
  }

  // Get theme editor with nonce
  const ter=await req('GET','/wp-admin/theme-editor.php?file=functions.php',null,{'Referer':'https://www.mobelrondellen.se/wp-admin/'});
  const raw=ter.body.match(/<textarea[^>]+id="newcontent"[^>]*>([\s\S]*?)<\/textarea>/)?.[1]||'';
  const content=dec(raw);
  const nonce=ter.body.match(/name="_wpnonce"\s+value="([a-f0-9]+)"/)?.[1];
  const theme=ter.body.match(/name="theme"\s+value="([^"]+)"/)?.[1]||'';
  console.log('Nonce:', nonce, 'Theme:', theme, 'Content length:', content.length);

  // Try to append just a comment
  const newContent = content.replace(/\?>\s*$/, '') + '\n// test-marker-sb\n?>';
  const saveBody = querystring.stringify({
    _wpnonce: nonce,
    _wp_http_referer: '/wp-admin/theme-editor.php',
    newcontent: newContent,
    action: 'edit-theme-plugin-file',
    file: 'functions.php',
    theme: theme,
    scrollto: '0',
  });
  console.log('Save body length:', saveBody.length);

  const sr=await req('POST','/wp-admin/theme-editor.php',saveBody,{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-admin/theme-editor.php'});
  console.log('Save response status:', sr.status);
  // Look for success/error message
  const msg = sr.body.match(/class="[^"]*(?:updated|error)[^"]*"[^>]*>([\s\S]*?)<\/p>/)?.[1]?.replace(/<[^>]+>/g,'').trim();
  console.log('Save message:', msg || 'none found');
  console.log('Response excerpt:', sr.body.slice(0,500).replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim());

  // Verify by re-reading
  const ver=await req('GET','/wp-admin/theme-editor.php?file=functions.php');
  const verContent=dec(ver.body.match(/<textarea[^>]+id="newcontent"[^>]*>([\s\S]*?)<\/textarea>/)?.[1]||'');
  console.log('\nVerify - contains test-marker:', verContent.includes('test-marker-sb'));

  // Clean up if saved
  if(verContent.includes('test-marker-sb')) {
    const clean=verContent.replace('\n// test-marker-sb\n','');
    const n2=ver.body.match(/name="_wpnonce"\s+value="([a-f0-9]+)"/)?.[1];
    await req('POST','/wp-admin/theme-editor.php',querystring.stringify({_wpnonce:n2,_wp_http_referer:'/wp-admin/theme-editor.php',newcontent:clean,action:'edit-theme-plugin-file',file:'functions.php',theme,scrollto:'0'}),{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-admin/theme-editor.php'});
    console.log('Cleaned up test marker');
  }
}

main().catch(e=>console.error('Error:',e.message,e.stack?.split('\n')[1]));
