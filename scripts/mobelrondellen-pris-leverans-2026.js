#!/usr/bin/env node
/**
 * Möbelrondellen — Pris- & lagerstatusuppdatering (juni 2026)
 *
 * Underlag: mailsvar från Mattias Andersson (tråden "Re: Hemsidan").
 * Se memory/kund_mobelrondellen_andringar_juni2026.md för full kontext.
 *
 * Uppdaterar BEFINTLIGA produkter via WooCommerce REST API (wc/v3):
 *   - regular_price / sale_price
 *   - stock_status (instock / onbackorder / outofstock)
 *   - leveransinfo (meta _leveransinfo) för beställningsvaror
 *
 * Produkter matchas på namn via ?search=. Granska ALLTID dry-run-utskriften
 * innan --execute, eftersom namnsökning kan ge flera/fel träffar.
 *
 * Hanterar INTE (väntar på kundsvar — se "GATED" i memory-filen):
 *   - Borttagning/utgående produkter (radera vs markera) — Pan, Monza, Lotus,
 *     Dessie, Aspen, Roomers vitrinskåp, Ekeberg-gruppen, Ekeberg matbord
 *   - Norris demoex (reducerat pris — belopp saknas)
 *   - Cathrine/Genova + Borgholm + Skanör + söndagsöppettider
 *   - Nya produkter (Bröderna Andersson) — se scripts/mobelrondellen-nya-produkter-juni2026.csv
 *
 * Credentials läses från env (INGA hårdkodade secrets):
 *   export WP_USER="info@searchboost.se"
 *   export WP_APP_PASSWORD="xxxx xxxx xxxx xxxx xxxx xxxx"
 *
 * Körs från en miljö som når mobelrondellen.se (laptop/EC2 — ej remote-sandboxen).
 *
 * Usage:
 *   node scripts/mobelrondellen-pris-leverans-2026.js            # dry-run (default)
 *   node scripts/mobelrondellen-pris-leverans-2026.js --execute  # genomför
 */

const https = require('https');

const WP_HOST = 'mobelrondellen.se';
const WP_USER = process.env.WP_USER;
const WP_APP_PASSWORD = process.env.WP_APP_PASSWORD;
const EXECUTE = process.argv.includes('--execute');

if (!WP_USER || !WP_APP_PASSWORD) {
  console.error('❌ Saknar WP_USER / WP_APP_PASSWORD i miljön. Se header för instruktion.');
  process.exit(1);
}
const AUTH = Buffer.from(`${WP_USER}:${WP_APP_PASSWORD}`).toString('base64');

// ── Ändringar per produkt ──
// match = sökterm (namn). changes = WooCommerce-fält att sätta.
// note  = info som loggas (t.ex. leveranstid eller saker att kolla manuellt).
const UPDATES = [
  // I lager (normalt lagervara)
  { match: 'Havanna',        changes: { regular_price: '6800', stock_status: 'instock' }, note: 'Soffbord, i svart/rökt ek/ek' },
  { match: 'Pocketresår',    changes: { stock_status: 'instock' }, note: '80 cm / 120 cm' },
  { match: 'Bäddmadrass Roma', changes: { stock_status: 'instock' }, note: '80/90/120/140/160/180 cm' },
  { match: 'Como',           changes: { stock_status: 'instock' }, note: 'Atleve, säsongsvara = begränsat antal' },
  { match: 'Roomers',        changes: { stock_status: 'instock' }, note: 'TV-bänk = lagervara (vitrinskåp utgått = GATED)' },
  { match: 'Stockholm vitrin', changes: { stock_status: 'instock' }, note: 'Englesson vitrinskåp = lagervara' },

  // Beställningsvara (leveranstid) → onbackorder + leveransinfo
  { match: 'Tuva X-Deep',    changes: { stock_status: 'onbackorder' }, leveransinfo: '6–8 veckor', note: 'Buhréns. PRIS: utan dun 14990 / med dun 15990 → kräver två varianter, sätt manuellt' },
  { match: 'Oxford',         changes: { stock_status: 'onbackorder' }, leveransinfo: '6–8 veckor', note: 'Buhréns' },
  { match: 'Hartford',       changes: { stock_status: 'onbackorder' }, leveransinfo: '8–10 veckor' },
  { match: 'Madrid',         changes: { stock_status: 'onbackorder' }, leveransinfo: '2–4 veckor', note: 'Soffbord' },
  { match: 'Öland',          changes: { stock_status: 'onbackorder' }, leveransinfo: '4–6 veckor', note: 'Möbelform, ej i butik' },
  { match: 'Toulouse',       changes: { stock_status: 'onbackorder' }, leveransinfo: '4–5 veckor', note: 'Matbord. 140cm + bredder 200x95/240x95/300x100, rökfärgad ek el. natur ek' },
  { match: 'Stockholm skänk', changes: { stock_status: 'onbackorder' }, leveransinfo: '4–6 veckor', note: 'Englesson skänkvitrin' },
  { match: 'Möbelskydd',     changes: { stock_status: 'onbackorder' }, leveransinfo: 'Vissa storlekar i lager, annars beställningsvara' },

  // Slut för säsongen men behåll synlig
  { match: 'Rio',            changes: { stock_status: 'outofstock' }, note: 'Fåtöljset Atleve — slut för säsongen, BEHÅLL publicerad' },
  { match: 'Hastings',       changes: { stock_status: 'outofstock' }, note: 'Utegrupp — slut för säsongen, BEHÅLL synlig' },

  // Reapris (visningsex)
  { match: 'Chic',           changes: { regular_price: '19980', sale_price: '13986', stock_status: 'instock' }, note: 'Bröderna Andersson — visningsex, 19980 − 30% = 13986' },
];

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request({
      host: WP_HOST, path, method,
      headers: {
        Authorization: `Basic ${AUTH}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Searchboost-PrisLeverans/1.0',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
      timeout: 20000,
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: d ? JSON.parse(d) : null }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    r.on('timeout', () => { r.destroy(); reject(new Error('timeout')); });
    if (data) r.write(data);
    r.end();
  });
}

async function findProduct(term) {
  const { status, body } = await req('GET', `/wp-json/wc/v3/products?search=${encodeURIComponent(term)}&per_page=10`);
  if (status !== 200 || !Array.isArray(body)) return { error: `sök ${status}` };
  return { matches: body.map(p => ({ id: p.id, name: p.name, price: p.regular_price, stock: p.stock_status })) };
}

(async () => {
  console.log(`\n=== Möbelrondellen pris/leverans — ${EXECUTE ? 'EXECUTE' : 'DRY-RUN'} ===\n`);
  let ok = 0, warn = 0, fail = 0;

  for (const u of UPDATES) {
    const res = await findProduct(u.match);
    if (res.error) { console.log(`❌ "${u.match}" — kunde ej söka (${res.error})`); fail++; continue; }
    if (res.matches.length === 0) { console.log(`⚠️  "${u.match}" — ingen träff (kolla namn manuellt)`); warn++; continue; }
    if (res.matches.length > 1) {
      console.log(`⚠️  "${u.match}" — ${res.matches.length} träffar, väljer #1. Verifiera!`);
      res.matches.forEach(m => console.log(`      • [${m.id}] ${m.name}`));
      warn++;
    }
    const p = res.matches[0];
    const payload = { ...u.changes };
    if (u.leveransinfo) payload.meta_data = [{ key: '_leveransinfo', value: u.leveransinfo }];

    console.log(`→ [${p.id}] ${p.name}`);
    console.log(`     ${JSON.stringify(payload)}${u.note ? `  // ${u.note}` : ''}`);

    if (EXECUTE) {
      const upd = await req('PUT', `/wp-json/wc/v3/products/${p.id}`, payload);
      if (upd.status >= 200 && upd.status < 300) { console.log('     ✅ uppdaterad'); ok++; }
      else { console.log(`     ❌ misslyckades (${upd.status})`); fail++; }
    }
  }

  console.log(`\n=== Klart: ${EXECUTE ? `${ok} ok, ` : ''}${warn} varningar, ${fail} fel ===`);
  if (!EXECUTE) console.log('Detta var en dry-run. Kör med --execute när utskriften ser rätt ut.\n');
})();
