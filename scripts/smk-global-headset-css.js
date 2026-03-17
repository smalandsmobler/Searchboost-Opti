#!/usr/bin/env node
// Injecteert global headset CSS via footer-bar widget (syns på alla sidor)

const BASE = 'https://ny.smalandskontorsmobler.se';
const CREDS = Buffer.from('searchboost:ySlF 8pM4 AAS3 i8aB dK9g g51C').toString('base64');

const svgRaw = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><defs><filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="0" stdDeviation="1.5" flood-color="#000" flood-opacity="0.7"/></filter></defs><path fill="#B48C5A" filter="url(#s)" d="M12 2C6.48 2 2 6.48 2 12v5a3 3 0 003 3h1a1 1 0 001-1v-5a1 1 0 00-1-1H4.07C4.56 7.19 7.92 4 12 4s7.44 3.19 7.93 8H18a1 1 0 00-1 1v5a1 1 0 001 1h1a3 3 0 003-3v-5c0-5.52-4.48-10-10-10z"/></svg>`;

const encodedSVG = encodeURIComponent(svgRaw);
const bgImage = `url("data:image/svg+xml,${encodedSVG}")`;

const CSS = `<style id="smk-headset-global">
#smk-chat-bubble svg { display:none !important; }
#smk-chat-bubble { background-image: ${bgImage} !important; background-repeat: no-repeat !important; background-position: center !important; background-size: 26px 26px !important; }
</style>`;

async function run() {
  // Ta bort eventuellt befintligt smk-headset-global widget
  const existing = await fetch(`${BASE}/wp-json/wp/v2/widgets?sidebar=footer-bar`, {
    headers: { Authorization: `Basic ${CREDS}` }
  }).then(r => r.json());

  for (const w of existing) {
    if (w.rendered?.includes('smk-headset-global') || w.content?.raw?.includes('smk-headset-global')) {
      console.log(`Tar bort gammalt widget: ${w.id}`);
      await fetch(`${BASE}/wp-json/wp/v2/widgets/${w.id}?force=true`, {
        method: 'DELETE',
        headers: { Authorization: `Basic ${CREDS}` }
      });
    }
  }

  // Skapa nytt custom_html widget i footer-bar
  const resp = await fetch(`${BASE}/wp-json/wp/v2/widgets`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${CREDS}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      id_base: 'custom_html',
      sidebar: 'footer-bar',
      instance: {
        raw: {
          title: '',
          content: CSS
        }
      }
    })
  });

  const data = await resp.json();
  if (resp.ok) {
    console.log(`OK — Widget ID: ${data.id} i sidebar: ${data.sidebar}`);
  } else {
    console.error('FEL:', JSON.stringify(data));
  }
}

run().catch(e => { console.error(e.message); process.exit(1); });
