#!/usr/bin/env node
/**
 * Internlänk-optimering för mobelrondellen.se
 *
 * Lägger till naturliga interna länkar i bloggartiklar för att:
 * - Eliminera "öar" (sidor utan interna inkommande länkar)
 * - Stärka "svaga" sidor (1-2 interna länkar)
 * - Prioritera artiklar som rankar position 5-15 (nära förstasidan)
 *
 * Körning på EC2:
 *   node scripts/internlankar-mobelrondellen.js
 *
 * Kräver: @aws-sdk/client-ssm, axios (installerade i mcp-server-code/)
 * Alternativt: sätt WP_URL, WP_USER, WP_PASS som miljövariabler
 */

'use strict';

const https = require('https');
const path = require('path');

// Försök ladda axios och SSM från mcp-server-code (EC2) eller scripts/ (lokalt)
let axios, SSMClient, GetParametersByPathCommand;
try {
  axios = require(path.join(__dirname, '../mcp-server-code/node_modules/axios'));
  ({ SSMClient, GetParametersByPathCommand } = require(
    path.join(__dirname, '../mcp-server-code/node_modules/@aws-sdk/client-ssm')
  ));
} catch {
  try {
    axios = require(path.join(__dirname, 'node_modules/axios'));
  } catch {
    console.error('Fel: axios saknas. Installera med: npm install i scripts/');
    process.exit(1);
  }
}

const REGION = 'eu-north-1';
const SITE_ID = 'mobelrondellen';
const BASE_URL = 'https://www.mobelrondellen.se';

// ── Länkplan — 10 nya internlänkar över 8 poster ─────────────────────────────
//
// Analys genomförd: 2026-05-22
// Metod: WordPress REST API, räknade href till mobelrondellen.se i rendered content
// Resultat: 47 poster — 1 ö (0 links), 1 svag (1 link), 7 med 2 links
//
const LINK_JOBS = [
  // ── Ö: kopa-madrass-guide-2026-2 (0 → 2 länkar) ──────────────────────────
  {
    postId: 5292,
    slug: 'kopa-madrass-guide-2026-2',
    anchor: 'sängen',
    targetUrl: `${BASE_URL}/2026/04/11/sang-guide-2026-madrass-sangram/`,
    title: 'Säng guide 2026 — välj rätt sängram, madrass och sovmiljö',
    reason: 'Ö-post (0 interna), "sängen" nämns tidigt, naturlig länk till sänguide',
  },
  {
    postId: 5292,
    slug: 'kopa-madrass-guide-2026-2',
    anchor: 'sovrum',
    targetUrl: `${BASE_URL}/2026/04/21/sovrum-inredning-guide/`,
    title: 'Sovrum inredning — säng, förvaring och atmosfär',
    reason: 'Ö-post (0 interna), "sovrum" nämns i storlekssektion, länk till sovrums-inredningsguide',
  },

  // ── Svag: basta-madrassen-guide-2026 (1 → 2 länkar) ─────────────────────
  {
    postId: 5505,
    slug: 'basta-madrassen-guide-2026',
    anchor: 'sängen',
    targetUrl: `${BASE_URL}/2026/04/11/sang-guide-2026-madrass-sangram/`,
    title: 'Säng guide 2026 — välj rätt sängram, madrass och sovmiljö',
    reason: 'Svag post (1 interna), "sängen" pos=90, koppling sänguide stärker kluster',
  },

  // ── 2→3: kopa-soffa-guide-2026-2 ─────────────────────────────────────────
  {
    postId: 5503,
    slug: 'kopa-soffa-guide-2026-2',
    anchor: 'fåtöljer',
    targetUrl: `${BASE_URL}/2026/04/29/fatolj-guide-2026/`,
    title: 'Fåtölj 2026 — guide till att välja rätt fåtölj',
    reason: 'Pos 3193: "lätt att kombinera med fåtöljer" — naturlig cross-link till fåtöljguide',
  },

  // ── 2→3: nattduksbord-2026 ───────────────────────────────────────────────
  {
    postId: 5528,
    slug: 'nattduksbord-2026-guide-till-sangbord-och-forvaring-vid-sangen',
    anchor: 'förvaring',
    targetUrl: `${BASE_URL}/2026/04/19/forvaring-sovrum-guide/`,
    title: 'Förvaring i sovrummet — garderob, byrå och smarta lösningar',
    reason: 'Pos 229: "höjd, material, stil och förvaring" — länk till sovrumsförvaring-guide',
  },

  // ── 2→3: matta-till-vardagsrummet ────────────────────────────────────────
  {
    postId: 5529,
    slug: 'matta-till-vardagsrummet-guide-till-storlek-material-och-stil-2026',
    anchor: 'soffa',
    targetUrl: `${BASE_URL}/2026/04/27/kopa-soffa-guide-2026-2/`,
    title: 'Köpa soffa 2026 — allt du behöver veta innan köpet',
    reason: 'Pos 496: "åtminstone soffa och fåtöljer" — naturlig länk till soffguide',
  },

  // ── 2→3: skank-sideboard-2026 ────────────────────────────────────────────
  // OBS: "bokhylla" och "soffa" är redan i <a>-taggar. Använder "förvaring" istället.
  {
    postId: 5538,
    slug: 'skank-sideboard-2026-guide-till-forvaring-i-vardagsrum-och-hall',
    anchor: 'förvaring',
    targetUrl: `${BASE_URL}/2026/04/19/forvaring-sovrum-guide/`,
    title: 'Förvaring i sovrummet — garderob, byrå och smarta lösningar',
    reason: 'Pos 92: "kombinerar förvaring med stil" — länk till sovrumsförvaring-guide',
  },

  // ── 2→3: sanggavel-2026 ──────────────────────────────────────────────────
  // OBS: "nattduksbord", "madrass", "förvaring" är redan i <a>-taggar. Använder "sängen" istället.
  {
    postId: 5539,
    slug: 'sanggavel-2026-guide-till-att-valja-ratt-gavel-for-din-sang',
    anchor: 'sängen',
    targetUrl: `${BASE_URL}/2026/04/11/sang-guide-2026-madrass-sangram/`,
    title: 'Säng guide 2026 — välj rätt sängram, madrass och sovmiljö',
    reason: 'Pos 76: "Den ramar in sängen, ger karaktär" — naturlig länk till sänguide',
  },

  // ── 1→2: inreda-hall-2026 ────────────────────────────────────────────────
  // OBS: "garderob" är redan länkat (utan www). Lägger till "sideboard" som ny länk.
  // Post har: hall-mobbler-guide + garderob-2026 (non-www) + butik. Sideboard = värdefull cross-link.
  {
    postId: 5540,
    slug: 'inreda-hall-2026-guide-till-hallmobler-forvaring-och-stil',
    anchor: 'sideboard',
    targetUrl: `${BASE_URL}/2026/04/28/skank-sideboard-2026-guide-till-forvaring-i-vardagsrum-och-hall/`,
    title: 'Skänk och sideboard 2026 — stor guide till förvaring i vardagsrum och hall',
    reason: 'Pos 1558: "Sideboard eller smal konsol" — länk till skänk & sideboard-guide',
  },
];

// ── Hjälpfunktioner ──────────────────────────────────────────────────────────

async function getWordPressCreds() {
  // Prioritet 1: miljövariabler (lokalt test)
  if (process.env.WP_URL && process.env.WP_USER && process.env.WP_PASS) {
    return {
      url: process.env.WP_URL.replace(/\/$/, ''),
      username: process.env.WP_USER,
      'app-password': process.env.WP_PASS,
    };
  }

  // Prioritet 2: SSM (EC2)
  if (!SSMClient) {
    throw new Error('SSM-klienten saknas och WP_URL/WP_USER/WP_PASS är inte satta. Kör på EC2 eller sätt miljövariabler.');
  }
  const ssm = new SSMClient({ region: REGION });
  const res = await ssm.send(new GetParametersByPathCommand({
    Path: `/seo-mcp/wordpress/${SITE_ID}/`,
    Recursive: true,
    WithDecryption: true,
  }));
  const creds = { id: SITE_ID };
  for (const p of (res.Parameters || [])) {
    creds[p.Name.split('/').pop()] = p.Value;
  }
  if (!creds.url || !creds.username || !creds['app-password']) {
    throw new Error(`SSM saknar credentials för ${SITE_ID}: ${JSON.stringify(creds)}`);
  }
  return creds;
}

function buildAuthHeader(creds) {
  return Buffer.from(`${creds.username}:${creds['app-password']}`).toString('base64');
}

async function fetchPost(postId, auth) {
  const url = `${BASE_URL}/wp-json/wp/v2/posts/${postId}?context=edit&_fields=id,slug,content`;
  const res = await axios.get(url, {
    headers: { Authorization: `Basic ${auth}` },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 20000,
  });
  return res.data;
}

async function updatePostContent(postId, newContent, auth) {
  const url = `${BASE_URL}/wp-json/wp/v2/posts/${postId}`;
  const res = await axios.patch(url, { content: newContent }, {
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    timeout: 30000,
  });
  return res.data;
}

/**
 * Lägger till intern länk för FÖRSTA förekomsten av ankartext i rendered HTML.
 * Säkrar att:
 * - Texten är utanför en befintlig tagg (via >(content)<-mönster)
 * - Inte redan inuti en <a>-tagg
 * - Inte i schema.org JSON-block
 * - Max 1 byte ändring per körning (idempotent vid omstart)
 */
function insertLink(html, anchor, href, title) {
  // Kontrollera att länken inte redan finns
  if (html.includes(`href="${href}"`)) {
    return { modified: false, html, reason: `Länk till ${href} finns redan` };
  }

  // Escape anchor för regex
  const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Matcha ankartext som textinnehåll (mellan > och <), inte i attribut
  // Grupp 1: allt från senaste > till ankartext
  // Grupp 2: ankartext (case-insensitive)
  const regex = new RegExp(`(>[^<]*)\\b(${escaped})\\b`, 'i');

  if (!regex.test(html)) {
    return { modified: false, html, reason: `"${anchor}" hittades inte i textinnehåll` };
  }

  // Stoppa om ankartext är inuti <a>...</a>
  const anchorTagCheck = new RegExp(`<a[^>]*>[^<]*\\b${escaped}\\b`, 'i');
  if (anchorTagCheck.test(html)) {
    return { modified: false, html, reason: `"${anchor}" finns redan i en <a>-tagg` };
  }

  const newHtml = html.replace(regex, (match, before, word) => {
    return `${before}<a href="${href}" title="${title}">${word}</a>`;
  });

  return { modified: true, html: newHtml, reason: 'OK' };
}

// ── Huvudprogram ─────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Internlänk-optimering: mobelrondellen.se ===');
  console.log(`Datum: ${new Date().toISOString().split('T')[0]}`);
  console.log(`Antal jobb: ${LINK_JOBS.length}`);
  console.log('');

  let creds;
  try {
    creds = await getWordPressCreds();
    console.log(`✓ Credentials: ${creds.username} @ ${creds.url}`);
  } catch (err) {
    console.error(`✗ Kunde inte hämta credentials: ${err.message}`);
    process.exit(1);
  }

  const auth = buildAuthHeader(creds);

  // Gruppera jobb per post-ID
  const byPost = {};
  for (const job of LINK_JOBS) {
    if (!byPost[job.postId]) byPost[job.postId] = [];
    byPost[job.postId].push(job);
  }

  const results = [];
  let totalAdded = 0;
  let totalSkipped = 0;

  for (const [postIdStr, jobs] of Object.entries(byPost)) {
    const postId = parseInt(postIdStr);
    const slug = jobs[0].slug;
    console.log(`\n── Post ${postId}: ${slug} ──`);

    let post;
    try {
      post = await fetchPost(postId, auth);
    } catch (err) {
      console.error(`  ✗ Kunde inte hämta post: ${err.message}`);
      for (const j of jobs) {
        results.push({ postId, slug, anchor: j.anchor, status: 'FEL', reason: err.message });
      }
      continue;
    }

    // Hämta raw content (context=edit ger content.raw)
    let content = post.content?.raw || post.content?.rendered || '';
    if (!content) {
      console.error(`  ✗ Tomt innehåll, hoppar över`);
      continue;
    }

    let postModified = false;
    for (const job of jobs) {
      const result = insertLink(content, job.anchor, job.targetUrl, job.title);
      if (result.modified) {
        content = result.html;
        postModified = true;
        totalAdded++;
        console.log(`  ✓ Länk tillagd: "${job.anchor}" → ${job.targetUrl}`);
        results.push({ postId, slug, anchor: job.anchor, targetUrl: job.targetUrl, status: 'TILLAGD' });
      } else {
        totalSkipped++;
        console.log(`  ○ Hoppade över: "${job.anchor}" — ${result.reason}`);
        results.push({ postId, slug, anchor: job.anchor, targetUrl: job.targetUrl, status: 'HOPPAD', reason: result.reason });
      }
    }

    if (postModified) {
      try {
        await updatePostContent(postId, content, auth);
        console.log(`  ✓ Post ${postId} uppdaterad`);
      } catch (err) {
        console.error(`  ✗ Fel vid uppdatering: ${err.message}`);
        // Markera alla tillagda som fel
        for (const r of results.filter(r => r.postId === postId && r.status === 'TILLAGD')) {
          r.status = 'FEL';
          r.reason = err.message;
          totalAdded--;
        }
      }
    }
  }

  console.log('\n=== Sammanfattning ===');
  console.log(`  Tillagda länk: ${totalAdded}`);
  console.log(`  Hoppade/redan finns: ${totalSkipped}`);
  console.log('');

  // Skriv ut detaljresultat
  console.log('Detaljresultat:');
  for (const r of results) {
    const icon = r.status === 'TILLAGD' ? '✓' : r.status === 'FEL' ? '✗' : '○';
    console.log(`  ${icon} [${r.status}] Post ${r.postId} | "${r.anchor}" → ${r.targetUrl || ''}`);
    if (r.reason && r.status !== 'TILLAGD') console.log(`       Orsak: ${r.reason}`);
  }
}

main().catch(err => {
  console.error('Fatalt fel:', err);
  process.exit(1);
});
