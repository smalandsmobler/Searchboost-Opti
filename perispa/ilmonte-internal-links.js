#!/usr/bin/env node
/**
 * Ilmonte.se — Append internal link sections to pages and articles.
 * Uses WP REST API with Basic Auth.
 */

const SITE = 'https://ilmonte.se';
const USERNAME = 'Mikael Larsson';
const APP_PASSWORD = 'jxgg jdbj IE3m 4ESB OSxt GOsp';
const AUTH = 'Basic ' + Buffer.from(`${USERNAME}:${APP_PASSWORD}`).toString('base64');
const THROTTLE_MS = 500;

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── Article metadata ──
const articles = {
  20551: { url: '/eventinredning-2026-minnesvard-upplevelse/', title: 'Eventinredning 2026 — så bygger du en minnesvärd upplevelse' },
  20552: { url: '/eventmobler-foretagsmassor-guide-hyra-2026/', title: 'Eventmöbler för företagsmässor — komplett guide till hyra 2026' },
  20553: { url: '/konferensmobler-checklista-inredaren-2026/', title: 'Konferensmöbler — checklista för inredaren 2026' },
  20554: { url: '/ljudklasser-event-konferens-textil-akustik/', title: 'Ljudklasser för event och konferens — textilens roll i akustiken' },
  20566: { url: '/scenpodier-guide-event-konferens/', title: 'Scenpodier för event och konferens — guide till val, mått och säkerhet' },
  20570: { url: '/dansmatta-for-event-guide/', title: 'Dansmatta för event och uppträdanden — guide till val, storlek och material' },
  20571: { url: '/uthyrning-eventmobler-guide/', title: 'Uthyrning av eventmöbler — allt du behöver veta' },
  20572: { url: '/scentextil-bakgrundsdukar-guide/', title: 'Scentextil och bakgrundsdukar — så förvandlar textil din scen' },
  20574: { url: '/scenpodier-skolor-guide/', title: 'Scenpodier för skolor — komplett guide till rätt scenval' },
  20576: { url: '/scenpodier-skolor-guide-2/', title: 'Scenpodier för skolor — vad ska du tänka på?' },
  20577: { url: '/dansmatta-guide-2026/', title: 'Dansmatta vs dansparkett — guide till rätt golv för dans' },
  20578: { url: '/modular-scen-guide/', title: 'Modulär scen — fördelar med flexibelt podiesystem' },
  20579: { url: '/scenbelysning-event-guide/', title: 'Scenbelysning för event — guide till ljussättning' },
  20580: { url: '/scenbelysning-event-guide-2/', title: 'Scenbelysning för event — ljussättning och utrustning' },
  20582: { url: '/scen-foretagsevent-guide/', title: 'Scen för företagsevent — vad du behöver tänka på' },
  20584: { url: '/eventpodium-kopa-eller-hyra/', title: 'Eventpodium — köpa eller hyra och vad kostar det?' },
  20595: { url: '/scenbygge-utomhus-guide/', title: 'Scenbygge utomhus — guide till val av scen och väderskydd' },
  20596: { url: '/hyra-scen-pris-guide/', title: 'Hyra scen — vad kostar det och vad ingår?' },
  20597: { url: '/podium-scen-foretagsevent-guide/', title: 'Podium och scen för företagsevent' },
  20607: { url: '/hyra-konferensbord-guide-till-val-storlek-och-leverans/', title: 'Hyra konferensbord — guide till val, storlek och leverans' },
  20608: { url: '/eventmoblering-for-kontor-och-foretag-vad-du-behover-veta/', title: 'Eventmöblering för kontor och företag' },
  20609: { url: '/konferensstolar-vad-skiljer-en-bra-fran-en-dalig-och-hur-du-valjer-ratt/', title: 'Konferensstolar — hur du väljer rätt' },
  20623: { url: '/laktare-gradanger-event-guide/', title: 'Läktare och gradänger för event' },
  20624: { url: '/horsalsstolar-teaterinredning-guide/', title: 'Hörsalsstolar och teaterinredning — guide till val 2026' },
  20625: { url: '/ridaskenor-scenridaer-guide/', title: 'Ridaskenor och scenridåer — guide till installation' },
};

// ── Groupings ──
const scen = [20566, 20574, 20576, 20578, 20582, 20584, 20595, 20596, 20597];
const mobler = [20551, 20552, 20553, 20607, 20608, 20609, 20571, 20623, 20624];
const textil = [20554, 20572, 20579, 20580, 20625];
const dans = [20570, 20577];

// Adjacent groups for cross-linking
const adjacent = {
  scen: [...textil.slice(0, 2), ...mobler.slice(0, 1)],
  mobler: [...scen.slice(0, 2), ...textil.slice(0, 1)],
  textil: [...scen.slice(0, 2), ...mobler.slice(0, 1)],
  dans: [...scen.slice(0, 2), ...textil.slice(0, 1)],
};

function getGroup(id) {
  if (scen.includes(id)) return 'scen';
  if (mobler.includes(id)) return 'mobler';
  if (textil.includes(id)) return 'textil';
  if (dans.includes(id)) return 'dans';
  return null;
}

function getGroupMembers(group) {
  if (group === 'scen') return scen;
  if (group === 'mobler') return mobler;
  if (group === 'textil') return textil;
  if (group === 'dans') return dans;
  return [];
}

function pickArticleLinks(articleId) {
  const group = getGroup(articleId);
  const sameGroup = getGroupMembers(group).filter(id => id !== articleId);
  const adj = adjacent[group] || [];

  // Pick up to 4 from same group, then fill from adjacent to get 4-6 total
  const fromSame = sameGroup.slice(0, 4);
  const needed = Math.max(0, 4 - fromSame.length);
  const fromAdj = adj.filter(id => !fromSame.includes(id)).slice(0, needed + 2);

  const picked = [...fromSame, ...fromAdj].slice(0, 6);
  return picked;
}

function buildLinksHtml(links) {
  const lis = links.map(l => `<li><a href="${l.url}">${l.title}</a></li>`).join('\n');
  return `\n\n<div class="related-links" style="margin-top:48px;padding:32px;background:#f8f9fa;border-radius:12px">\n<h3>Läs mer</h3>\n<ul style="columns:2;column-gap:24px">\n${lis}\n</ul>\n</div>`;
}

// ── Page definitions ──
const pageConfigs = [
  {
    id: 13581, type: 'pages', name: 'Startsidan',
    links: [
      { url: '/butik/', title: 'Alla produkter' },
      { url: '/om-oss/', title: 'Om oss' },
      { url: '/kontakt/', title: 'Kontakt' },
      { url: articles[20551].url, title: articles[20551].title },
      { url: articles[20566].url, title: articles[20566].title },
      { url: articles[20572].url, title: articles[20572].title },
    ],
  },
  {
    id: 26, type: 'pages', name: 'Om oss',
    links: [
      { url: '/butik/', title: 'Alla produkter' },
      { url: '/kontakt/', title: 'Kontakt' },
      { url: articles[20551].url, title: articles[20551].title },
      { url: articles[20553].url, title: articles[20553].title },
      { url: articles[20566].url, title: articles[20566].title },
    ],
  },
  {
    id: 28, type: 'pages', name: 'Kontakt',
    links: [
      { url: '/butik/', title: 'Alla produkter' },
      { url: '/om-oss/', title: 'Om oss' },
      { url: articles[20552].url, title: articles[20552].title },
      { url: articles[20571].url, title: articles[20571].title },
    ],
  },
  {
    id: 8, type: 'pages', name: 'Butik',
    links: [
      { url: '/kontakt/', title: 'Kontakt' },
      { url: articles[20551].url, title: articles[20551].title },
      { url: articles[20552].url, title: articles[20552].title },
      { url: articles[20553].url, title: articles[20553].title },
      { url: articles[20571].url, title: articles[20571].title },
    ],
  },
  {
    id: 22, type: 'pages', name: 'Nyheter',
    links: [
      { url: '/butik/', title: 'Alla produkter' },
      { url: '/om-oss/', title: 'Om oss' },
      { url: '/kontakt/', title: 'Kontakt' },
    ],
  },
];

async function fetchContent(type, id) {
  const url = `${SITE}/wp-json/wp/v2/${type}/${id}?context=edit`;
  const res = await fetch(url, { headers: { 'Authorization': AUTH } });
  if (!res.ok) throw new Error(`GET ${type}/${id} failed: ${res.status} ${res.statusText}`);
  const data = await res.json();
  return data.content.rendered || data.content.raw || '';
}

async function updateContent(type, id, content) {
  const url = `${SITE}/wp-json/wp/v2/${type}/${id}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': AUTH,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST ${type}/${id} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return true;
}

async function processItem(type, id, name, links) {
  const content = await fetchContent(type, id);

  if (content.includes('class="related-links"') || content.includes("class='related-links'")) {
    console.log(`  SKIP ${name} (ID:${id}) — already has related-links`);
    return false;
  }

  const appendHtml = buildLinksHtml(links);
  const newContent = content + appendHtml;

  await updateContent(type, id, newContent);
  console.log(`  OK   ${name} (ID:${id}) — ${links.length} links added`);
  return true;
}

async function main() {
  let updated = 0;
  let skipped = 0;
  let errors = 0;

  // 1. Process pages
  console.log('=== PAGES ===');
  for (const page of pageConfigs) {
    try {
      const did = await processItem(page.type, page.id, page.name, page.links);
      if (did) updated++; else skipped++;
    } catch (e) {
      console.error(`  ERR  ${page.name} (ID:${page.id}) — ${e.message}`);
      errors++;
    }
    await sleep(THROTTLE_MS);
  }

  // 2. Process articles
  console.log('\n=== ARTICLES ===');
  const articleIds = Object.keys(articles).map(Number);

  for (const id of articleIds) {
    const art = articles[id];
    const relatedIds = pickArticleLinks(id);
    const links = [
      ...relatedIds.map(rid => ({ url: articles[rid].url, title: articles[rid].title })),
      { url: '/butik/', title: 'Se alla produkter' },
      { url: '/kontakt/', title: 'Kontakta oss' },
    ];

    try {
      const did = await processItem('posts', id, art.title.slice(0, 50), links);
      if (did) updated++; else skipped++;
    } catch (e) {
      console.error(`  ERR  ${art.title.slice(0, 50)} (ID:${id}) — ${e.message}`);
      errors++;
    }
    await sleep(THROTTLE_MS);
  }

  console.log(`\n=== DONE === Updated: ${updated}, Skipped: ${skipped}, Errors: ${errors}`);
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
