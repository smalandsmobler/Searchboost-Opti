// ============================================================
// Searchboost Site Generator
// Genererar kompletta hemsidor via AI → deploy till Loopia FTP
// ============================================================

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const OUTPUT_DIR = path.join(__dirname, '..', 'sites');

// Skapa output-mapp
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// ── Design System Prompt ──
const DESIGN_SYSTEM = `Du är en elitwebbdesigner. Du bygger ALLTID hemsidor som ser ut som 2026 — inte 2015.

TEKNIK:
- Tailwind CSS via CDN (https://cdn.tailwindcss.com)
- Vanilla JavaScript (inga ramverk)
- Google Fonts: Inter (brödtext), Instrument Sans eller Sora (rubriker)
- Lucide Icons via CDN (https://unpkg.com/lucide@latest)
- Smooth scroll, IntersectionObserver fade-in animationer
- Komplett responsiv (mobil-first)
- All kod i EN HTML-fil

DESIGN-REGLER:
1. WHITESPACE — Generöst. min-h-screen sektioner. py-24 lg:py-32 mellan sektioner.
2. TYPOGRAFI — Stora rubriker (text-5xl lg:text-7xl), tunn font-weight på brödtext.
3. FÄRGER — Max 2-3 färger. Mörka teman: bg-gray-950/bg-slate-950. Ljusa: bg-white med accent.
4. GRADIENTER — Subtila. from-purple-600 to-blue-500 på knappar/accenter. Aldrig på bakgrund.
5. KNAPPAR — Rundade (rounded-full), stora (px-8 py-4), hover:scale-105 transition.
6. BILDER — Använd picsum.photos eller placehold.co. Rundade hörn (rounded-2xl). object-cover.
7. KORT — bg-white/5 backdrop-blur-sm border border-white/10 (dark) eller shadow-xl (light).
8. HERO — Stor headline + subtext + CTA-knapp + bild/illustration. Centerat eller split.
9. ANIMATIONER — fade-in-up på scroll (IntersectionObserver). Subtilt, 0.6s ease-out.
10. NAVIGERING — Sticky, backdrop-blur, border-b border-white/10. Hamburgermeny på mobil.
11. FOOTER — Mörk, 3-4 kolumner, sociala ikoner, copyright.
12. SPACING — Konsekvent. gap-6 i grids, space-y-4 i listor.

FÖRBJUDET:
- Inga emojis i design (om inte begärt)
- Inga generiska stockfoton-beskrivningar
- Ingen Comic Sans, Papyrus, eller pre-2020 fonter
- Inga regnbågsfärger
- Ingen parallax (sällan bra)
- Inga placeholder-texter som "Lorem ipsum"

STRUKTUR (anpassa efter brief):
1. Nav (sticky, blur)
2. Hero (stor, impact)
3. Features/Tjänster (3-4 kort i grid)
4. Om oss / Social proof
5. Testimonials / Case studies
6. Prissättning (om relevant)
7. CTA-sektion
8. Footer

OUTPUT: Komplett HTML-fil. Ingen förklaring, bara koden. Börja med <!DOCTYPE html>.`;

// ── Generera hemsida ──
async function generateSite(brief, options = {}) {
  const {
    openRouterKey,
    model = 'anthropic/claude-sonnet-4-20250514',
    theme = 'dark',
    language = 'sv',
    customColors = null,
    customFonts = null
  } = options;

  if (!openRouterKey) throw new Error('OpenRouter API-nyckel saknas');

  // Bygg prompt
  let prompt = `Bygg en komplett hemsida baserat på denna brief:\n\n${brief}\n\n`;
  prompt += `Tema: ${theme}\n`;
  prompt += `Språk: ${language === 'sv' ? 'Svenska' : 'Engelska'}\n`;
  if (customColors) prompt += `Varumärkesfärger: ${customColors}\n`;
  if (customFonts) prompt += `Fonter: ${customFonts}\n`;
  prompt += `\nLeverera ENBART komplett HTML. Ingen förklaring.`;

  const resp = await axios.post(OPENROUTER_URL, {
    model,
    messages: [
      { role: 'system', content: DESIGN_SYSTEM },
      { role: 'user', content: prompt }
    ],
    max_tokens: 16000,
    temperature: 0.4
  }, {
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://searchboost.se',
      'X-Title': 'Searchboost Site Generator'
    },
    timeout: 120000
  });

  let html = resp.data?.choices?.[0]?.message?.content || '';

  // Rensa eventuell markdown-wrapping
  html = html.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();

  // Validera
  if (!html.includes('<!DOCTYPE') && !html.includes('<html')) {
    throw new Error('AI genererade inte giltig HTML');
  }

  return {
    html,
    model: resp.data?.model || model,
    tokens: {
      input: resp.data?.usage?.prompt_tokens || 0,
      output: resp.data?.usage?.completion_tokens || 0
    }
  };
}

// ── Tweaka befintlig sida ──
async function tweakSite(currentHtml, instruction, options = {}) {
  const {
    openRouterKey,
    model = 'anthropic/claude-sonnet-4-20250514'
  } = options;

  if (!openRouterKey) throw new Error('OpenRouter API-nyckel saknas');

  const resp = await axios.post(OPENROUTER_URL, {
    model,
    messages: [
      { role: 'system', content: DESIGN_SYSTEM },
      { role: 'user', content: `Här är en befintlig hemsida:\n\n${currentHtml}\n\nGör denna ändring: ${instruction}\n\nReturnera HELA den uppdaterade HTML-filen. Ingen förklaring.` }
    ],
    max_tokens: 16000,
    temperature: 0.3
  }, {
    headers: {
      'Authorization': `Bearer ${openRouterKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://searchboost.se',
      'X-Title': 'Searchboost Site Generator'
    },
    timeout: 120000
  });

  let html = resp.data?.choices?.[0]?.message?.content || '';
  html = html.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();

  return { html, model: resp.data?.model || model };
}

// ── Spara till disk ──
function saveSite(name, html) {
  const slug = name.toLowerCase().replace(/[^a-z0-9åäö-]/g, '-').replace(/-+/g, '-');
  const filename = `${slug}-${Date.now()}.html`;
  const filepath = path.join(OUTPUT_DIR, filename);
  fs.writeFileSync(filepath, html, 'utf8');
  return { filename, filepath, slug };
}

// ── Deploy till Loopia via FTP ──
async function deployToLoopia(html, domain, ftpCredentials) {
  const { host, user, password, remotePath = '/public_html' } = ftpCredentials;

  // Dynamisk import av basic-ftp
  let ftp;
  try {
    const { Client } = require('basic-ftp');
    ftp = new Client();
    ftp.foos = 10000;

    await ftp.access({
      host,
      user,
      password,
      secure: true,
      secureOptions: { rejectUnauthorized: false }
    });

    // Skriv HTML till temp-fil
    const tmpFile = `/tmp/deploy-${Date.now()}.html`;
    fs.writeFileSync(tmpFile, html, 'utf8');

    // Ladda upp
    await ftp.ensureDir(remotePath);
    await ftp.uploadFrom(tmpFile, `${remotePath}/index.html`);

    // Rensa temp
    fs.unlinkSync(tmpFile);

    return {
      success: true,
      url: `https://${domain}`,
      deployed_at: new Date().toISOString()
    };
  } catch (err) {
    throw new Error(`FTP-deploy misslyckades: ${err.message}`);
  } finally {
    if (ftp) ftp.close();
  }
}

// ── Lista sparade sidor ──
function listSites() {
  if (!fs.existsSync(OUTPUT_DIR)) return [];
  return fs.readdirSync(OUTPUT_DIR)
    .filter(f => f.endsWith('.html'))
    .map(f => {
      const stat = fs.statSync(path.join(OUTPUT_DIR, f));
      return {
        filename: f,
        size_kb: Math.round(stat.size / 1024),
        created: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));
}

module.exports = {
  generateSite,
  tweakSite,
  saveSite,
  deployToLoopia,
  listSites,
  OUTPUT_DIR
};
