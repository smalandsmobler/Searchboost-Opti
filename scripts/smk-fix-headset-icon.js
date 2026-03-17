#!/usr/bin/env node
const PAGE_ID = 9311;
const BASE_URL = 'https://ny.smalandskontorsmobler.se';
const CREDS = Buffer.from('searchboost:ySlF 8pM4 AAS3 i8aB dK9g g51C').toString('base64');

const svgRaw = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#fff" flood-opacity="0.8"/></filter></defs><path fill="#B48C5A" filter="url(#s)" d="M12 2C6.48 2 2 6.48 2 12v5a3 3 0 003 3h1a1 1 0 001-1v-5a1 1 0 00-1-1H4.07C4.56 7.19 7.92 4 12 4s7.44 3.19 7.93 8H18a1 1 0 00-1 1v5a1 1 0 001 1h1a3 3 0 003-3v-5c0-5.52-4.48-10-10-10z"/></svg>`;
const HEADSET_SVG = 'url("data:image/svg+xml,' + encodeURIComponent(svgRaw) + '")';

const OVERRIDE = `
<style id="smk-headset-override">
#smk-chat-bubble svg { display:none !important; }
#smk-chat-bubble { background-image: ${HEADSET_SVG} !important; background-repeat:no-repeat !important; background-position:center !important; background-size:26px 26px !important; }
</style>`;

async function run() {
  const getResp = await fetch(`${BASE_URL}/wp-json/wp/v2/pages/${PAGE_ID}?context=edit`, {
    headers: { Authorization: `Basic ${CREDS}` }
  });
  if (!getResp.ok) throw new Error(`GET ${getResp.status}: ${await getResp.text()}`);
  const page = await getResp.json();
  let content = page.content.raw;
  content = content.replace(/<style id="smk-headset-override">[\s\S]*?<\/style>\s*/g, '');
  content = content.replace(/<!-- \/wp:html -->\s*$/, `${OVERRIDE}\n<!-- /wp:html -->`);
  const putResp = await fetch(`${BASE_URL}/wp-json/wp/v2/pages/${PAGE_ID}`, {
    method: 'PUT',
    headers: { Authorization: `Basic ${CREDS}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (!putResp.ok) throw new Error(`PUT ${putResp.status}: ${await putResp.text()}`);
  console.log(`OK — Modified: ${(await putResp.json()).modified}`);
}

run().catch(e => { console.error(e.message); process.exit(1); });
