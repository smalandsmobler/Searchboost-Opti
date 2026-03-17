#!/usr/bin/env node
// Tar bort .smk-chat-wrap från sida 9311 via REST API

const PAGE_ID = 9311;
const BASE_URL = 'https://ny.smalandskontorsmobler.se';
const CREDS = Buffer.from('searchboost:ySlF 8pM4 AAS3 i8aB dK9g g51C').toString('base64');

async function run() {
  // Hämta nuvarande innehåll
  const getResp = await fetch(`${BASE_URL}/wp-json/wp/v2/pages/${PAGE_ID}?context=edit`, {
    headers: { Authorization: `Basic ${CREDS}` }
  });
  if (!getResp.ok) throw new Error(`GET ${getResp.status}: ${await getResp.text()}`);
  const page = await getResp.json();

  let content = page.content.raw;

  // Ta bort hela .smk-chat-wrap blocket
  const before = content.length;
  content = content.replace(
    /<div class="smk-chat-wrap">[\s\S]*?<\/div>\s*/g,
    ''
  );
  const after = content.length;
  console.log(`Removed ${before - after} chars (smk-chat-wrap)`);

  if (before === after) {
    console.log('Inget att ta bort — .smk-chat-wrap hittades inte');
    return;
  }

  // Spara tillbaka
  const putResp = await fetch(`${BASE_URL}/wp-json/wp/v2/pages/${PAGE_ID}`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${CREDS}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });
  if (!putResp.ok) throw new Error(`PUT ${putResp.status}: ${await putResp.text()}`);
  const updated = await putResp.json();
  console.log(`OK — Modified: ${updated.modified}`);
}

run().catch(e => { console.error(e.message); process.exit(1); });
