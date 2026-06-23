const https = require('https');
const querystring = require('querystring');
const WP_BASE = 'www.mobelrondellen.se';
const WP_USER = 'info@searchboost.se';
const WP_PASS = '(2g*UCim0RLeywTx3z$mYuJ)';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
let cookies = {};
function parseCookies(h){if(!h)return;(Array.isArray(h)?h:[h]).forEach(c=>{const[k,v]=c.split(';')[0].split('=');if(k)cookies[k.trim()]=v?.trim()||'';});}
function cStr(){return Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ');}
function req(method,path,body,extra={}){return new Promise((res,rej)=>{const opts={hostname:WP_BASE,port:443,path,method,headers:{'User-Agent':UA,'Accept':'text/html,*/*','Accept-Language':'sv-SE','Cookie':cStr(),...extra}};if(body)opts.headers['Content-Length']=Buffer.byteLength(body);const r=https.request(opts,resp=>{parseCookies(resp.headers['set-cookie']);const c=[];resp.on('data',d=>c.push(d));resp.on('end',()=>res({status:resp.statusCode,headers:resp.headers,body:Buffer.concat(c).toString()}));});r.on('error',rej);if(body)r.write(body);r.end();});}

async function main() {
  await req('GET','/wp-login.php');
  cookies['wordpress_test_cookie']='WP+Cookie+check';
  const lr=await req('POST','/wp-login.php',querystring.stringify({log:WP_USER,pwd:WP_PASS,'wp-submit':'Logga in',redirect_to:'/wp-admin/',testcookie:'1'}),{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-login.php'});
  
  // Follow all redirects
  let loc = lr.headers.location || '';
  console.log('Login status:', lr.status, '→', loc);
  
  if (loc.includes('confirm_admin_email')) {
    const cr=await req('GET',loc.replace('https://www.mobelrondellen.se',''));
    const n=cr.body.match(/name="_wpnonce"\s+value="([a-f0-9]+)"/)?.[1];
    const conf=await req('POST','/wp-login.php?action=confirm_admin_email',querystring.stringify({_wpnonce:n,action:'confirm_admin_email',redirect_to:'/wp-admin/'}),{'Content-Type':'application/x-www-form-urlencoded'});
    loc = conf.headers.location || '/wp-admin/';
  }
  
  // Follow the redirect to wp-admin
  const admin = await req('GET', '/wp-admin/', null, {'Referer':'https://www.mobelrondellen.se/wp-login.php'});
  console.log('Admin page status:', admin.status);
  console.log('Cookies after admin visit:', Object.keys(cookies).filter(k=>k.includes('wordpress')));
  
  // Now get theme editor
  const ter=await req('GET','/wp-admin/theme-editor.php?file=functions.php',null,{'Referer':'https://www.mobelrondellen.se/wp-admin/'});
  console.log('Theme editor status:', ter.status);
  
  // Extract the FULL form area
  const formMatch = ter.body.match(/<form[^>]*id="template"[^>]*>([\s\S]{0,2000})/);
  if (formMatch) {
    console.log('\nForm content:');
    console.log(formMatch[1].replace(/<textarea[\s\S]*?<\/textarea>/g,'[TEXTAREA]').slice(0,1500));
  }
  
  // Extract ALL <script> sections containing "nonce"
  const scripts = [...ter.body.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
  console.log('\nScript sections with "nonce":');
  for (const s of scripts) {
    if (s[1].toLowerCase().includes('nonce')) {
      console.log('---');
      console.log(s[1].slice(0, 500));
    }
  }
  
  // Try a simple save to see FULL error
  const nonce = ter.body.match(/name="nonce"\s+value="([^"]+)"/)?.[1] || 
                ter.body.match(/id="nonce"\s+name="nonce"\s+value="([^"]+)"/)?.[1];
  const theme = ter.body.match(/name="theme"\s+value="([^"]+)"/)?.[1] || 'siteorigin-corp-child';
  const raw = ter.body.match(/<textarea[^>]+id="newcontent"[^>]*>([\s\S]*?)<\/textarea>/)?.[1] || '';
  const content = raw.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&#039;/g,"'").replace(/&quot;/g,'"');
  
  console.log('\nForm nonce (name="nonce"):', nonce || 'NOT FOUND');
  console.log('Theme:', theme);
  
  if (nonce) {
    // Try AJAX with exact nonce from form
    const ajaxBody = querystring.stringify({action:'edit-theme-plugin-file',file:'functions.php',theme,newcontent:content+'// test\n',nonce,scrollto:'0'});
    const ar = await req('POST','/wp-admin/admin-ajax.php',ajaxBody,{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-admin/theme-editor.php','X-Requested-With':'XMLHttpRequest'});
    console.log('\nAJAX test (save comment):', ar.body.slice(0,200));
    
    // Try form POST too
    const formBody = querystring.stringify({nonce,_wpnonce:nonce,_wp_http_referer:'/wp-admin/theme-editor.php',newcontent:content+'// test\n',action:'update',file:'functions.php',theme,scrollto:'0'});
    const fr = await req('POST','/wp-admin/theme-editor.php',formBody,{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-admin/theme-editor.php'});
    // Full response
    const notices = fr.body.match(/(?:error|updated|notice)[^>]*>([\s\S]{10,300}?)<\/(?:p|div)>/gi) || [];
    console.log('\nForm response notices:');
    notices.slice(0,5).forEach(n=>console.log(' ', n.replace(/<[^>]+>/g,'').trim().slice(0,200)));
  }
}
main().catch(e=>console.error('Error:',e.message,e.stack));
