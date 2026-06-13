#!/usr/bin/env node
// Genererar 800-1200 ord per WC-kategori via Claude API och pushar live

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const WC_BASE = 'https://ny.smalandskontorsmobler.se';
const WC_CREDS = Buffer.from('searchboost:ySlF 8pM4 AAS3 i8aB dK9g g51C').toString('base64');
const ANTHROPIC_KEY = fs.readFileSync('/tmp/ak.txt', 'utf8').trim();

const client = new Anthropic({ apiKey: ANTHROPIC_KEY });

const SITE_CONTEXT = `
Smålandskontorsmöbler är en etablerad återförsäljare av kontorsmöbler i Småland med fysisk butik
och webbutik. Målgrupp: småföretagare, kontor, kommuner, skolor i södra Sverige.
Varumärken: Kinnarps, Martela, Svenheim m.fl. Styrkor: personlig service, snabb leverans,
montering, ergonomiexpertise. Tonläge: professionellt men tillgängligt, ej för formellt.
`;

async function generateDescription(catName, catSlug, productCount) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `Du är en erfaren SEO-skribent för ett svenskt möbelföretag.

Företagskontext: ${SITE_CONTEXT}

Skriv en kategoribeskrivning för produktkategorin "${catName}" (${productCount} produkter).

KRAV:
- 900-1100 ord
- Skriv på naturlig, flytande svenska
- Inkludera nyckelordet "${catName.toLowerCase()}" naturligt 4-6 gånger
- Inkludera relaterade termer och synonymer
- Strukturera med <h2> och <h3>-rubriker (2-3 stycken)
- Använd <p>-taggar för stycken
- Avsluta med ett kort CTA-stycke
- Inga listor med bullets (löpande text)
- Inkludera praktiska tips och köpguide-info
- Nämn Småland/södra Sverige 1-2 gånger naturligt
- Inga placeholder-texter, allt ska vara verkligt och användbart

Returnera BARA HTML (inga markdown-kodblockar, ingen förklaring).`
    }]
  });
  return msg.content[0].text;
}

async function generateMeta(catName) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `SEO-optimerad titel och metabeskrivning för produktkategori "${catName}" på en kontorsmöbelbutik i Småland.

Returnera JSON: {"title": "...", "description": "..."}
- title: max 60 tecken, inkludera nyckelordet, avsluta INTE med företagsnamn
- description: 140-155 tecken, inkludera CTA, nyckelord, geografisk koppling
- Inga citattecken i texterna`
    }]
  });
  try {
    const raw = msg.content[0].text.replace(/```json|```/g, '').trim();
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function updateCategory(id, description, meta) {
  const body = { description };
  if (meta) {
    body.meta_data = [
      { key: 'rank_math_title', value: meta.title },
      { key: 'rank_math_description', value: meta.description }
    ];
  }
  const r = await fetch(`${WC_BASE}/wp-json/wc/v3/products/categories/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Basic ${WC_CREDS}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  return r.ok;
}

async function run() {
  // Hämta alla kategorier
  const cats = await fetch(`${WC_BASE}/wp-json/wc/v3/products/categories?per_page=100`, {
    headers: { Authorization: `Basic ${WC_CREDS}` }
  }).then(r => r.json());

  const toProcess = cats.filter(c => c.slug !== 'uncategorized' && c.count > 0);
  console.log(`Bearbetar ${toProcess.length} kategorier...\n`);

  for (let i = 0; i < toProcess.length; i++) {
    const cat = toProcess[i];
    console.log(`[${i + 1}/${toProcess.length}] ${cat.name} (${cat.count} prod)...`);

    try {
      const [desc, meta] = await Promise.all([
        generateDescription(cat.name, cat.slug, cat.count),
        generateMeta(cat.name)
      ]);

      const wordCount = desc.replace(/<[^>]+>/g, '').split(/\s+/).filter(Boolean).length;
      const ok = await updateCategory(cat.id, desc, meta);

      console.log(`  ✓ ${wordCount} ord | meta: ${meta ? meta.title.slice(0, 40) + '...' : 'misslyckades'} | WC: ${ok ? 'OK' : 'FEL'}`);
    } catch (e) {
      console.error(`  ✗ FEL: ${e.message}`);
    }

    // Paus för att inte hammra API
    if (i < toProcess.length - 1) await new Promise(r => setTimeout(r, 800));
  }

  console.log('\nKlart!');
}

run().catch(e => { console.error(e.message); process.exit(1); });
