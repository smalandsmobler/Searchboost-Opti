#!/usr/bin/env node
/**
 * Internlänk-optimering för ilmonte.se
 *
 * Analys genomförd: 2026-05-29
 * Metod: WordPress REST API — räknade href till ilmonte.se i content.rendered
 *
 * Resultat (22 inlägg analyserade):
 *   Öar (0 inkommande): hyra-scen-pris-guide, podium-scen-foretagsevent-guide,
 *     scenbelysning-event-guide-2, scenpodier-skolor-guide, scenpodier-skolor-guide-2,
 *     laktare-gradanger-event-guide, horsalsstolar-teaterinredning-guide, ridaskenor-scenridaer-guide
 *   Svaga (1 inkommande): dansmatta-for-event-guide, uthyrning-eventmobler-guide,
 *     dansmatta-guide-2026, modular-scen-guide
 *   Hubb (10 inkommande): scenpodier-guide-event-konferens
 *
 * OBS: scenpodier-guide-event-konferens (20566) har 4 brutna utgående länkar — se kommentar nedan.
 *
 * Körning på EC2:
 *   node scripts/internlankar-ilmonte.js
 *
 * Kräver: @aws-sdk/client-ssm, axios (installerade i mcp-server-code/)
 * Alternativt: sätt WP_URL, WP_USER, WP_PASS som miljövariabler
 */

'use strict';

const https = require('https');
const path = require('path');

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
const SITE_ID = 'ilmonte';
const BASE_URL = 'https://ilmonte.se';

// ── Länkplan — 9 nya internlänkar över 4 inlägg ──────────────────────────────
//
// Prioritet: öar som rankar på A/B-nyckelord (hyra scen, podium) + svaga sidor
// Max 3 nya länkar per källsida
//
// OBS BRUTNA LÄNKAR i post 20566 (scenpodier-guide-event-konferens):
//   /eventmobler-for-event-och-konferens        → ska vara /eventmobler-foretagsmassor-guide-hyra-2026/
//   /konferensmobler-for-moten-och-utbildning   → ska vara /konferensmobler-checklista-inredaren-2026/
//   /ljudklasser-for-kontor-och-konferenslokaler → ska vara /ludklasser-event-konferens-textil-akustik/
//   /eventinredning-for-mass-och-konferens       → ska vara /eventinredning-2026-minnesvard-upplevelse/
//   Åtgärda separat via WP-admin eller ett dedikerat fix-skript.
//
const LINK_JOBS = [

  // ── SOURCE 1: scenpodier-guide-event-konferens (20566) — 2 nya länkar ────
  // Hubb med 10 inkommande. Nämner uthyrning och ljussättning naturligt.
  {
    postId: 20566,
    slug: 'scenpodier-guide-event-konferens',
    anchor: 'uthyrning',
    targetUrl: `${BASE_URL}/hyra-scen-pris-guide/`,
    title: 'Hyra scen — vad kostar det och vad ingår?',
    reason: 'Ö (0 incoming). "uthyrning alltid billigare för 1-5 event" — direkt match',
  },
  {
    postId: 20566,
    slug: 'scenpodier-guide-event-konferens',
    anchor: 'ljussättningen',
    targetUrl: `${BASE_URL}/scenbelysning-event-guide-2/`,
    title: 'Scenbelysning för event — guide till ljussättning och utrustning',
    reason: 'Ö (0 incoming). "modevisningar där ljussättningen är central" — naturlig länk',
  },

  // ── SOURCE 2: scenbygge-utomhus-guide (20595) — 3 nya länkar (0 body-outgoing) ─
  // Artikel om utomhusscener. Nämner scensystem, talarpodier och belysning.
  {
    postId: 20595,
    slug: 'scenbygge-utomhus-guide',
    anchor: 'scensystem',
    targetUrl: `${BASE_URL}/modular-scen-guide/`,
    title: 'Modulär scen — fördelar med flexibelt podiesystem för event och teater',
    reason: 'Svag (1 incoming). "Modulära scensystem är standard vid utomhusevent" — exakt förekomst',
  },
  {
    postId: 20595,
    slug: 'scenbygge-utomhus-guide',
    anchor: 'talarpodier',
    targetUrl: `${BASE_URL}/podium-scen-foretagsevent-guide/`,
    title: 'Podium och scen för företagsevent — det du behöver veta',
    reason: 'Ö (0 incoming). Artikeln nämner talarpodier som väderskyddat alternativ',
  },
  {
    postId: 20595,
    slug: 'scenbygge-utomhus-guide',
    anchor: 'scenbelysning',
    targetUrl: `${BASE_URL}/scenbelysning-event-guide-2/`,
    title: 'Scenbelysning för event — guide till ljussättning och utrustning',
    reason: 'Ö (0 incoming). Artikel nämner belysningsrigg i säkerhetsavsnittet',
  },

  // ── SOURCE 3: scen-foretagsevent-guide (20582) — 2 nya länkar ────────────
  // Har bara 2 body-outgoing (kategori + kontakt). Nämner talarpodium och Scenbelysning.
  {
    postId: 20582,
    slug: 'scen-foretagsevent-guide',
    anchor: 'talarpodium',
    targetUrl: `${BASE_URL}/podium-scen-foretagsevent-guide/`,
    title: 'Podium och scen för företagsevent — det du behöver veta',
    reason: 'Ö (0 incoming). "Ett podium (talarpodium) är den självklara kompletteringen" — exakt match',
  },
  {
    postId: 20582,
    slug: 'scen-foretagsevent-guide',
    anchor: 'Scenbelysning',
    targetUrl: `${BASE_URL}/scenbelysning-event-guide-2/`,
    title: 'Scenbelysning för event — guide till ljussättning och utrustning',
    reason: 'Ö (0 incoming). Checklistan: "Scenbelysning riggad och testad" — direkt match',
  },

  // ── SOURCE 4: eventmoblering-for-kontor (20608) — 2 nya länkar (0 body-outgoing) ─
  // Definierar eventmöblering. Nämner "hyrs in" och "konferensstolar".
  {
    postId: 20608,
    slug: 'eventmoblering-for-kontor-och-foretag-vad-du-behover-veta',
    anchor: 'hyrs in',
    targetUrl: `${BASE_URL}/uthyrning-eventmobler-guide/`,
    title: 'Uthyrning av eventmöbler — allt du behöver veta innan ditt nästa event',
    reason: 'Svag (1 incoming). "möbler som hyrs in specifikt för ett event" — direkt match',
  },
  {
    postId: 20608,
    slug: 'eventmoblering-for-kontor-och-foretag-vad-du-behover-veta',
    anchor: 'konferensstolar',
    targetUrl: `${BASE_URL}/konferensstolar-vad-skiljer-en-bra-fran-en-dalig-och-hur-du-valjer-ratt/`,
    title: 'Konferensstolar — vad skiljer en bra från en dålig och hur du väljer rätt',
    reason: '"klädda konferensstolar med armstöd" i styrelseformatsektion — naturlig cross-link',
  },
];

// ── Hjälpfunktioner ──────────────────────────────────────────────────────────

async function getWordPressCreds() {
  if (process.env.WP_URL && process.env.WP_USER && process.env.WP_PASS) {
    return {
      url: process.env.WP_URL.replace(/\/$/, ''),
      username: process.env.WP_USER,
      'app-password': process.env.WP_PASS,
    };
  }

  if (!SSMClient) {
    throw new Error('SSM-klienten saknas och WP_URL/WP_USER/WP_PASS är inte satta. Kör på EC2.');
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
 * Lägger till intern länk för FÖRSTA förekomsten av ankartext i HTML.
 * Säkrar att texten är utanför befintliga <a>-taggar.
 */
function insertLink(html, anchor, href, title) {
  if (html.includes(`href="${href}"`)) {
    return { modified: false, html, reason: `Länk till ${href} finns redan` };
  }

  const escaped = anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(>[^<]*)\\b(${escaped})\\b`, 'i');

  if (!regex.test(html)) {
    return { modified: false, html, reason: `"${anchor}" hittades inte i textinnehåll` };
  }

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
  console.log('=== Internlänk-optimering: ilmonte.se ===');
  console.log(`Datum: ${new Date().toISOString().split('T')[0]}`);
  console.log(`Antal jobb: ${LINK_JOBS.length}`);
  console.log('');

  let creds;
  try {
    creds = await getWordPressCreds();
    console.log(`✓ Credentials: ${creds.username} @ ${creds.url || BASE_URL}`);
  } catch (err) {
    console.error(`✗ Kunde inte hämta credentials: ${err.message}`);
    process.exit(1);
  }

  const auth = buildAuthHeader(creds);

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
        for (const r of results.filter(r => r.postId === postId && r.status === 'TILLAGD')) {
          r.status = 'FEL';
          r.reason = err.message;
          totalAdded--;
        }
      }
    }
  }

  console.log('\n=== Sammanfattning ===');
  console.log(`  Tillagda länkar: ${totalAdded}`);
  console.log(`  Hoppade/redan finns: ${totalSkipped}`);
  console.log('');

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
