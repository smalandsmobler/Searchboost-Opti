#!/usr/bin/env node
/**
 * connect-smk-rest.js
 * Verifierar REST API-koppling mot smalandskontorsmobler.se.
 * Testar WP core, Rank Math och WooCommerce-namespaces, både publikt och autentiserat.
 *
 * Kör publikt (bara publika endpoints):
 *   node scripts/connect-smk-rest.js
 *
 * Kör med auth (Application Password — mellanslag OK):
 *   WP_USER=mikael WP_APP_PASSWORD="xxxx xxxx xxxx xxxx" node scripts/connect-smk-rest.js
 */

const WP_URL = process.env.WP_URL || 'https://smalandskontorsmobler.se';
const WP_USER = process.env.WP_USER || '';
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD || '';

const hasAuth = !!(WP_USER && WP_APP_PASSWORD);
const authHeader = hasAuth
  ? 'Basic ' + Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64')
  : null;

async function probe(label, path, { auth = false, method = 'GET' } = {}) {
  const url = `${WP_URL}${path}`;
  const headers = { 'Accept': 'application/json' };
  if (auth && authHeader) headers['Authorization'] = authHeader;
  const started = Date.now();
  try {
    const res = await fetch(url, { method, headers });
    const ms = Date.now() - started;
    const ct = res.headers.get('content-type') || '';
    let body = null;
    if (ct.includes('application/json')) {
      try { body = await res.json(); } catch { body = null; }
    }
    return { label, path, status: res.status, ok: res.ok, ms, body };
  } catch (err) {
    return { label, path, status: 0, ok: false, ms: Date.now() - started, error: err.message };
  }
}

function row(r) {
  const icon = r.ok ? 'OK ' : (r.status === 401 || r.status === 403 ? 'AUTH' : 'FAIL');
  const code = r.status === 0 ? 'NET' : r.status;
  return `  [${icon}] ${String(code).padEnd(4)} ${String(r.ms).padStart(5)}ms  ${r.label.padEnd(28)} ${r.path}`;
}

function summarise(results) {
  const total = results.length;
  const ok = results.filter(r => r.ok).length;
  const auth = results.filter(r => r.status === 401 || r.status === 403).length;
  const fail = results.filter(r => !r.ok && r.status !== 401 && r.status !== 403).length;
  return { total, ok, auth, fail };
}

(async () => {
  console.log(`\n=== SMK REST API connection test ===`);
  console.log(`URL:  ${WP_URL}`);
  console.log(`Auth: ${hasAuth ? `${WP_USER} (app-password satt)` : 'ingen — endast publika endpoints testas'}\n`);

  const publicProbes = [
    ['WP root',            '/wp-json/'],
    ['WP posts (1)',       '/wp-json/wp/v2/posts?per_page=1&_fields=id,title,link'],
    ['WP pages (1)',       '/wp-json/wp/v2/pages?per_page=1&_fields=id,title,link'],
    ['WP categories',      '/wp-json/wp/v2/categories?per_page=1'],
    ['WC store products',  '/wp-json/wc/store/v1/products?per_page=1'],
    ['Rank Math status',   '/wp-json/rankmath/v1/status'],
  ];

  const authProbes = [
    ['WP users/me',        '/wp-json/wp/v2/users/me'],
    ['WP settings',        '/wp-json/wp/v2/settings'],
    ['WC admin products',  '/wp-json/wc/v3/products?per_page=1'],
    ['WC admin orders',    '/wp-json/wc/v3/orders?per_page=1'],
  ];

  console.log('Publika endpoints:');
  const publicResults = [];
  for (const [label, path] of publicProbes) {
    const r = await probe(label, path);
    publicResults.push(r);
    console.log(row(r));
  }

  let authResults = [];
  if (hasAuth) {
    console.log('\nAutentiserade endpoints:');
    for (const [label, path] of authProbes) {
      const r = await probe(label, path, { auth: true });
      authResults.push(r);
      console.log(row(r));
    }
  } else {
    console.log('\n(Hoppar över autentiserade tester — sätt WP_USER och WP_APP_PASSWORD för full kontroll.)');
  }

  const pub = summarise(publicResults);
  const priv = summarise(authResults);
  console.log(`\nResultat: publika ${pub.ok}/${pub.total}, auth ${priv.ok}/${priv.total}` +
              (priv.auth ? `, ${priv.auth} auth-fel` : '') +
              (pub.fail + priv.fail ? `, ${pub.fail + priv.fail} övriga fel` : ''));

  const root = publicResults.find(r => r.path === '/wp-json/');
  if (root?.body?.namespaces) {
    const ns = root.body.namespaces;
    const has = n => ns.includes(n);
    console.log(`\nUpptäckta namespaces: ${ns.length} st`);
    console.log(`  wp/v2:         ${has('wp/v2') ? 'ja' : 'NEJ'}`);
    console.log(`  wc/v3:         ${has('wc/v3') ? 'ja' : 'NEJ'}`);
    console.log(`  rankmath/v1:   ${has('rankmath/v1') ? 'ja' : 'NEJ'}`);
    console.log(`  smk/v1:        ${has('smk/v1') ? 'ja' : 'NEJ'}`);
  }

  const me = authResults.find(r => r.path === '/wp-json/wp/v2/users/me');
  if (me?.ok && me.body) {
    console.log(`\nInloggad som: ${me.body.name} (ID ${me.body.id}, roles: ${(me.body.roles || []).join(',') || 'okänd'})`);
  } else if (hasAuth && me && !me.ok) {
    console.log(`\nAuth misslyckades (${me.status}). Kontrollera användarnamn och app-password.`);
  }

  const fatal = pub.fail > 0 || (hasAuth && priv.ok === 0);
  process.exit(fatal ? 1 : 0);
})();
