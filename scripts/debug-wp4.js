const https = require('https');
const querystring = require('querystring');
const WP_BASE = 'www.mobelrondellen.se';
const WP_USER = 'info@searchboost.se';
const WP_PASS = '(2g*UCim0RLeywTx3z$mYuJ)';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36';
let cookies = {};
function parseCookies(h){if(!h)return;(Array.isArray(h)?h:[h]).forEach(c=>{const[k,v]=c.split(';')[0].split('=');if(k)cookies[k.trim()]=v?.trim()||'';});}
function cStr(){return Object.entries(cookies).map(([k,v])=>`${k}=${v}`).join('; ');}
function req(method,path,body,extra={}){return new Promise((res,rej)=>{const opts={hostname:WP_BASE,port:443,path,method,headers:{'User-Agent':UA,'Accept':'text/html,*/*','Accept-Language':'sv-SE','Cookie':cStr(),...extra}};if(body)opts.headers['Content-Length']=Buffer.byteLength(body);const r=https.request(opts,resp=>{parseCookies(resp.headers['set-cookie']);const c=[];resp.on('data',d=>c.push(d));resp.on('end',()=>res({status:resp.statusCode,headers:resp.headers,body:Buffer.concat(c).toString()}));});r.on('error',rej);if(body)r.write(body);r.end();});}

async function main() {
  await req('GET','/wp-login.php');
  cookies['wordpress_test_cookie']='WP+Cookie+check';
  const lr=await req('POST','/wp-login.php',querystring.stringify({log:WP_USER,pwd:WP_PASS,'wp-submit':'Logga in',redirect_to:'/wp-admin/',testcookie:'1'}),{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-login.php'});
  if(lr.status===302&&lr.headers.location?.includes('confirm_admin_email')){const cr=await req('GET',lr.headers.location.replace('https://www.mobelrondellen.se',''));const n=cr.body.match(/name="_wpnonce"\s+value="([a-f0-9]+)"/)?.[1];await req('POST','/wp-login.php?action=confirm_admin_email',querystring.stringify({_wpnonce:n,action:'confirm_admin_email',redirect_to:'/wp-admin/'}),{'Content-Type':'application/x-www-form-urlencoded','Referer':'https://www.mobelrondellen.se/wp-login.php'});}

  const ter=await req('GET','/wp-admin/theme-editor.php?file=functions.php',null,{'Referer':'https://www.mobelrondellen.se/wp-admin/'});

  // Find ALL nonce-like values
  const nonceMatches = [...ter.body.matchAll(/nonce[^"':]*['":\s]+([a-f0-9]{10})/gi)];
  console.log('All nonces found:');
  nonceMatches.forEach(m => console.log(' ', m[0].slice(0,80)));

  // Find _wpnonce fields
  const wpNonces = [...ter.body.matchAll(/name="_wpnonce[^"]*"\s+value="([^"]+)"/g)];
  console.log('\n_wpnonce fields:');
  wpNonces.forEach(m => console.log(' ', m[0]));

  // Find hidden inputs
  const hiddenInputs = [...ter.body.matchAll(/type="hidden"[^>]*>/g)];
  console.log('\nHidden inputs:');
  hiddenInputs.forEach(m => console.log(' ', m[0]));

  // Check for DISALLOW_FILE_MODS
  console.log('\nDISALLOW_FILE_MODS in page:', ter.body.includes('DISALLOW_FILE_MODS'));
  console.log('DISALLOW_FILE_EDIT in page:', ter.body.includes('DISALLOW_FILE_EDIT'));

  // Check error/notice
  const notices = [...ter.body.matchAll(/class="[^"]*(?:error|notice|warning)[^"]*"[^>]*>([\s\S]*?)<\/(?:p|div)>/g)];
  console.log('\nNotices/errors:');
  notices.slice(0,5).forEach(m => console.log(' ', m[1].replace(/<[^>]+>/g,'').trim().slice(0,200)));

  // Print form action
  const formAction = ter.body.match(/<form[^>]*action="([^"]*)"[^>]*id="template"[^>]*>/)?.[1] ||
                    ter.body.match(/<form[^>]*id="template"[^>]*action="([^"]*)"[^>]*>/)?.[1];
  console.log('\nForm action:', formAction || 'not found');

  // Find script with nonce
  const scriptNonces = [...ter.body.matchAll(/"(?:save_nonce|templateNonce|editedPostNonce|nonce)"\s*[:=]\s*"([a-f0-9]+)"/g)];
  console.log('\nScript nonces:');
  scriptNonces.forEach(m => console.log(' ', m[0]));
}
main().catch(e=>console.error('Error:',e.message));
