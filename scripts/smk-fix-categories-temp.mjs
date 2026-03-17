import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const WC_BASE = 'https://ny.smalandskontorsmobler.se';
const CREDS = Buffer.from('searchboost:ySlF 8pM4 AAS3 i8aB dK9g g51C').toString('base64');
const KEY = fs.readFileSync('/tmp/ak.txt', 'utf8').trim();
const client = new Anthropic({ apiKey: KEY });

function stripBackticks(html) {
  return html.replace(/^```html\s*/i, '').replace(/```\s*$/i, '').trim();
}

function wordCount(html) {
  return html.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
}

async function genDesc(name, count) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [{ role: 'user', content: `Du är SEO-skribent för Smålands Kontorsmöbler i Småland.

Skriv kategoribeskrivning för "${name}" (${count} produkter).
KRAV: 900-1100 ord, flytande svenska, nyckelordet 4-6 gånger, <h2>/<h3>/<p>-taggar, avsluta med CTA.
Returnera BARA ren HTML, inga backticks eller markdown.` }]
  });
  return msg.content[0].text.replace(/^```html\s*/i,'').replace(/```\s*$/i,'').trim();
}

async function genMeta(name) {
  const msg = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{ role: 'user', content: `SEO-titel och meta för produktkategori "${name}" på kontorsmöbelbutik i Småland.
JSON: {"title":"max 60 tecken","description":"140-155 tecken med CTA"}
Inga backticks, bara JSON.` }]
  });
  try { return JSON.parse(msg.content[0].text.replace(/```json|```/g,'').trim()); }
  catch { return null; }
}

async function updateCat(id, description, meta) {
  const body = { description };
  if (meta) body.meta_data = [
    { key: 'rank_math_title', value: meta.title },
    { key: 'rank_math_description', value: meta.description }
  ];
  const r = await fetch(`${WC_BASE}/wp-json/wc/v3/products/categories/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Basic ${CREDS}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return r.ok;
}

const cats = await fetch(`${WC_BASE}/wp-json/wc/v3/products/categories?per_page=100`, {
  headers: { Authorization: `Basic ${CREDS}` }
}).then(r => r.json());

const toProcess = cats.filter(c => c.slug !== 'uncategorized' && c.count > 0);
console.log(`${toProcess.length} kategorier att kontrollera\n`);

let fixed = 0, generated = 0, skipped = 0;

for (let i = 0; i < toProcess.length; i++) {
  const cat = toProcess[i];
  let desc = cat.description || '';
  const hasBT = desc.trimStart().startsWith('```');
  
  if (hasBT) {
    desc = stripBackticks(desc);
  }
  
  const wc = wordCount(desc);
  
  if (!hasBT && wc >= 300) {
    skipped++;
    continue;
  }
  
  if (hasBT && wc >= 300) {
    // Just fix backticks, no new generation needed
    console.log(`[${i+1}] ${cat.name} — fixar backticks (${wc} ord)...`);
    const ok = await updateCat(cat.id, desc, null);
    console.log(`  ${ok ? '✓ OK' : '✗ FEL'}`);
    fixed++;
  } else {
    // Short desc — generate new
    console.log(`[${i+1}] ${cat.name} (${cat.count} prod) — genererar (${wc} ord idag)...`);
    try {
      const [newDesc, meta] = await Promise.all([genDesc(cat.name, cat.count), genMeta(cat.name)]);
      const newWC = wordCount(newDesc);
      const ok = await updateCat(cat.id, newDesc, meta);
      console.log(`  ✓ ${newWC} ord | meta: ${meta ? meta.title.slice(0,40) : 'misslyckades'} | ${ok ? 'OK' : 'FEL'}`);
      generated++;
    } catch (e) {
      console.error(`  ✗ ${e.message}`);
    }
  }
  
  if (i < toProcess.length - 1) await new Promise(r => setTimeout(r, 600));
}

console.log(`\nKlart! Backticks fixade: ${fixed}, Genererade: ${generated}, Hoppade: ${skipped}`);
