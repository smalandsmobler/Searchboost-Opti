/**
 * perispa — Mobile Fix tools
 *
 * perispa_mobile_audit   — Analysera mobilproblem (PageSpeed + builder-struktur + CSS)
 * perispa_mobile_fix     — Generera + injicera mobilfixar via Anthropic AI (ett klick)
 * perispa_mobile_preview — Visa vad senaste mobilfixen ändrade
 * perispa_mobile_reset   — Ta bort injicerat mobilCSS för en sida
 *
 * Strategi: Rör ALDRIG desktop-innehållet.
 * All mobilfix sker via ett injicerat <style>-block med @media (max-width: 768px).
 * Sparas i WP som custom option "perispa_mobile_css_{post_id}" så det kan återkallas.
 */

const { z } = require('zod');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

const BREAKPOINT = 768;

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

// ── PageSpeed API (utan nyckel — public endpoint) ──
function fetchPageSpeed(url, strategy) {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&category=accessibility&category=best-practices&category=seo`;
    https.get(apiUrl, { timeout: 60000, rejectUnauthorized: false }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        try { resolve(JSON.parse(body)); }
        catch { reject(new Error('PageSpeed API: ogiltigt JSON-svar')); }
      });
    }).on('error', reject).on('timeout', function () { this.destroy(); reject(new Error('PageSpeed timeout (60s)')); });
  });
}

function extractMobileIssues(psData) {
  const lhr = psData?.lighthouseResult;
  if (!lhr) return { score: null, issues: [] };

  const audits = lhr.audits || {};
  const score = Math.round((lhr.categories?.performance?.score || 0) * 100);

  const mobileAuditKeys = [
    'viewport',
    'font-size',
    'tap-targets',
    'content-width',
    'uses-responsive-images',
    'image-aspect-ratio',
    'cumulative-layout-shift',
    'largest-contentful-paint',
    'total-blocking-time',
    'unused-css-rules',
    'render-blocking-resources',
    'uses-text-compression',
    'efficiently-encode-images',
  ];

  const issues = mobileAuditKeys
    .map(key => {
      const a = audits[key];
      if (!a) return null;
      const score = a.score === null ? null : Math.round((a.score || 0) * 100);
      if (score === null || score >= 90) return null;
      return {
        key,
        title: a.title,
        description: a.description,
        score,
        display: a.displayValue || '',
        severity: score < 50 ? 'kritisk' : score < 75 ? 'varning' : 'info',
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score);

  return { score, issues };
}

// ── Hämta HTML för sidan (för CSS-analys) ──
function fetchHtml(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http;
    mod.get(url, { timeout: 15000, rejectUnauthorized: false,
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15' }
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(body.substring(0, 30000)));
    }).on('error', () => resolve('')).on('timeout', function () { this.destroy(); resolve(''); });
  });
}

// ── Anthropic API — generera mobilfix-CSS ──
function callAnthropic(apiKey, prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });
    const req = https.request({
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(body),
      },
      timeout: 60000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) reject(new Error(j.error.message));
          else resolve(j.content[0].text);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Anthropic timeout')); });
    req.write(body);
    req.end();
  });
}

// ── Hämta Anthropic API-nyckel (samma prioritetsordning som ai-writer.js) ──
function getAnthropicKey() {
  // 1) Miljövariabel
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  // 2) config.json
  try {
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.anthropic_api_key) return config.anthropic_api_key;
    }
  } catch { /* */ }

  // 3) ~/.anthropic/api_key
  try {
    const homePath = process.env.HOME || process.env.USERPROFILE;
    const keyFile = path.join(homePath, '.anthropic', 'api_key');
    if (fs.existsSync(keyFile)) return fs.readFileSync(keyFile, 'utf-8').trim();
  } catch { /* */ }

  throw new Error('Ingen Anthropic API-nyckel hittad. Lägg till anthropic_api_key i perispa/config.json eller sätt ANTHROPIC_API_KEY i miljön.');
}

// ── Rensa bort gamla perispa-mobilfix-block från content ──
function stripOldMobileBlock(content) {
  return content.replace(/<!-- perispa-mobile-fix-start -->[\s\S]*?<!-- perispa-mobile-fix-end -->\n?/g, '');
}

// ── Bygg HTML-blocket som injiceras i WordPress content ──
function buildCssBlock(css, postId) {
  return `<!-- perispa-mobile-fix-start -->\n<style id="perispa-mobile-${postId}" type="text/css">/* perispa mobilfix — genererad ${new Date().toISOString().slice(0, 10)} */\n${css}\n</style>\n<!-- perispa-mobile-fix-end -->`;
}

module.exports = function registerMobileTools(server, getSite, wpFetch) {

  // ════════════════════════════════════════════════════
  // 1. perispa_mobile_audit — analysera utan att ändra
  // ════════════════════════════════════════════════════
  server.tool('perispa_mobile_audit',
    'Analysera mobilproblem för en sida: PageSpeed-score, specifika fel, CSS-issues. Ändrar ingenting.',
    {
      site: z.string().optional(),
      url: z.string().describe('URL till sidan att analysera'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);

        // Kör PageSpeed mobil + desktop parallellt
        const [mobileData, desktopData] = await Promise.all([
          fetchPageSpeed(args.url, 'mobile'),
          fetchPageSpeed(args.url, 'desktop'),
        ]);

        const mobile = extractMobileIssues(mobileData);
        const desktop = extractMobileIssues(desktopData);

        // Hämta HTML för att kolla viewport + CSS-mönster
        const html = await fetchHtml(args.url);
        const hasViewport = /viewport/.test(html);
        const hasMobileMenu = /hamburger|mobile-menu|nav-toggle|menu-toggle/i.test(html);
        const usesFlexGrid = /display\s*:\s*flex|display\s*:\s*grid/i.test(html);

        // Hitta <style>-block + inline CSS-klasser som nämns
        const inlineStyles = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
          .join('\n')
          .replace(/<\/?style[^>]*>/gi, '')
          .substring(0, 8000);

        const fixAlreadyApplied = /perispa-mobile-fix-start/.test(html);

        return text({
          url: args.url,
          analyserad: new Date().toISOString(),
          mobilScore: mobile.score,
          desktopScore: desktop.score,
          scoreDiff: (desktop.score || 0) - (mobile.score || 0),
          viewport: hasViewport ? 'OK' : 'SAKNAS — kritiskt fel',
          mobileMenu: hasMobileMenu ? 'Hittad' : 'Ej hittad',
          flexGrid: usesFlexGrid ? 'Används' : 'Inte detekterat',
          perispaFixApplicerad: fixAlreadyApplied,
          mobilProblem: mobile.issues,
          sammanfattning: mobile.issues.length === 0
            ? 'Inga kritiska mobilproblem hittade.'
            : `${mobile.issues.filter(i => i.severity === 'kritisk').length} kritiska, ${mobile.issues.filter(i => i.severity === 'varning').length} varningar`,
        });
      } catch (e) { return err(e.message); }
    }
  );

  // ════════════════════════════════════════════════════
  // 2. perispa_mobile_fix — HUVUDVERKTYGET
  // Analysera + generera + injicera i ett steg
  // ════════════════════════════════════════════════════
  server.tool('perispa_mobile_fix',
    'Analyserar desktop-sidan, genererar ett fullständigt mobilfix-CSS med AI och injicerar det utan att röra desktop-layouten. Ett klick — komplett mobilversion.',
    {
      site: z.string().optional(),
      page_id: z.number().optional().describe('WP-sid-ID (om känt)'),
      url: z.string().optional().describe('Sidans URL (används om page_id saknas)'),
      post_type: z.string().optional().default('pages').describe('pages eller posts'),
      breakpoint: z.number().optional().default(768).describe('Mobilbrytpunkt i px (default 768)'),
      extra_instructions: z.string().optional().describe('Extra instruktioner till AI:n, t.ex. "gör headern sticky" eller "dölj sidofältet på mobil"'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const bp = args.breakpoint || BREAKPOINT;

        // ── Steg 1: Hämta WP-post ──
        let post, postId, postUrl, wpType;
        wpType = args.post_type === 'posts' ? 'posts' : 'pages';

        if (args.page_id) {
          postId = args.page_id;
          const res = await wpFetch(s, `wp/v2/${wpType}/${postId}`).catch(async () => {
            const r2 = await wpFetch(s, `wp/v2/posts/${postId}`);
            wpType = 'posts';
            return r2;
          });
          post = res.data;
        } else if (args.url) {
          const slug = args.url.replace(/\/$/, '').split('/').pop();
          const pagesRes = await wpFetch(s, 'wp/v2/pages', { params: { slug, status: 'publish', per_page: 1 } });
          if (pagesRes.data && pagesRes.data.length > 0) {
            post = pagesRes.data[0];
            wpType = 'pages';
          } else {
            const postsRes = await wpFetch(s, 'wp/v2/posts', { params: { slug, status: 'publish', per_page: 1 } });
            if (postsRes.data && postsRes.data.length > 0) {
              post = postsRes.data[0];
              wpType = 'posts';
            }
          }
          if (!post) return err(`Hittade ingen sida/post med slug "${slug}"`);
          postId = post.id;
        } else {
          return err('Ange antingen page_id eller url.');
        }

        postUrl = post.link || args.url;

        // ── Steg 2: PageSpeed mobil ──
        let mobileIssues = { score: null, issues: [] };
        try {
          const psData = await fetchPageSpeed(postUrl, 'mobile');
          mobileIssues = extractMobileIssues(psData);
        } catch (e) {
          // PageSpeed ej tillgänglig — kör ändå med HTML-analys
        }

        // ── Steg 3: Hämta HTML + befintlig CSS ──
        const html = await fetchHtml(postUrl);

        // Extrahera befintliga <style>-block
        const existingCss = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
          .join('\n')
          .replace(/<\/?style[^>]*>/gi, '')
          .substring(0, 6000);

        // Extrahera CSS-klasser som används på sidan
        const classMatches = [...new Set((html.match(/class="([^"]+)"/gi) || [])
          .map(m => m.replace(/class="([^"]+)"/, '$1').split(/\s+/))
          .flat()
          .filter(c => c.length > 2 && c.length < 50)
        )].slice(0, 200);

        // Extrahera HTML-struktur (body-innehåll, förkortat)
        const bodyHtml = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || ['', html])[1]
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/\s+/g, ' ')
          .substring(0, 8000);

        // ── Steg 4: Bygg prompt ──
        const issuesSummary = mobileIssues.issues.length > 0
          ? mobileIssues.issues.map(i => `- [${i.severity.toUpperCase()}] ${i.title}: ${i.display}`).join('\n')
          : 'Inga PageSpeed-data tillgängliga — basera fix på HTML-struktur.';

        const extraInstr = args.extra_instructions
          ? `\n\nExtra instruktioner från användaren:\n${args.extra_instructions}`
          : '';

        const prompt = `Du är en expert på mobilresponsiv CSS för WordPress-sajter.

Analysera denna sidas HTML-struktur och befintliga CSS, och generera ett KOMPLETT mobilfix-stylesheet.

## Sidinfo
URL: ${postUrl}
Mobilbrytpunkt: ${bp}px
PageSpeed mobil-score: ${mobileIssues.score !== null ? mobileIssues.score + '/100' : 'ej tillgänglig'}

## PageSpeed-problem
${issuesSummary}

## Befintliga CSS-klasser på sidan (urval)
${classMatches.join(', ')}

## Befintlig CSS (urval)
\`\`\`css
${existingCss}
\`\`\`

## HTML-struktur (förkortat body-innehåll)
\`\`\`html
${bodyHtml}
\`\`\`
${extraInstr}

## Uppgift
Generera ENBART ett CSS-block med @media (max-width: ${bp}px) { ... } som:

1. **Fixar layout-brytningar** — kolumner som staplas fel, element som flödar utanför skärmen
2. **Skapar korrekt typografi** — fontstorlekar läsbara på mobil (minimum 16px för brödtext)
3. **Optimerar mellanrum** — padding/margin som är för stora på desktop halveras på mobil
4. **Fixar navigationen** — hamburgermeny om saknas, horisontell meny → vertikal
5. **Bilder** — max-width: 100%, height: auto på alla bilder
6. **Touch targets** — knappar/länkar minimum 44x44px
7. **Döljer desktop-only element** — sidofält, dekorativa element om de stör mobil
8. **Fixar overflow** — inget horisontellt scroll
9. **Viewport** — om saknas: injicera via CSS-reset (body overflow-x: hidden)

## Krav på svaret
- Svara BARA med ren CSS, inga förklaringar, ingen markdown
- Alla regler inom @media (max-width: ${bp}px) { }
- Kommentera varje sektion kort (/* Navigation */, /* Hero */, etc.)
- Täckande men inte överdrivet — max ~150 regler
- ÄNDRA ALDRIG desktop-beteendet (inga regler utanför @media-blocket)`;

        // ── Steg 5: Hämta API-nyckel + anropa Claude ──
        let anthropicKey;
        try {
          anthropicKey = getAnthropicKey();
        } catch (e) {
          return err(e.message);
        }

        let generatedCss;
        try {
          generatedCss = await callAnthropic(anthropicKey, prompt);
          // Rensa om Claude ändå lade till markdown
          generatedCss = generatedCss
            .replace(/^```(?:css)?\s*/m, '')
            .replace(/\s*```\s*$/m, '')
            .trim();
        } catch (e) {
          return err(`AI-generering misslyckades: ${e.message}`);
        }

        // Validera att vi fick CSS och inte prosa
        if (!generatedCss.includes('@media') && !generatedCss.includes('{')) {
          return err('AI returnerade ogiltig CSS. Försök igen eller lägg till mer specifika instruktioner.');
        }

        // ── Steg 6: Injicera i WordPress ──
        // Ta bort eventuell gammal fix + lägg till ny
        const currentContent = post.content?.raw || post.content?.rendered || '';
        const cleanContent = stripOldMobileBlock(currentContent);
        const cssBlock = buildCssBlock(generatedCss, postId);
        const newContent = cleanContent + '\n' + cssBlock;

        await wpFetch(s, `wp/v2/${wpType}/${postId}`, {
          method: 'POST',
          body: { content: newContent },
        });

        // Spara CSS som WP-option för enkel återkallning
        await wpFetch(s, 'wp/v2/settings', {
          method: 'POST',
          body: { [`perispa_mobile_css_${postId}`]: generatedCss },
        }).catch(() => { /* settings-endpoint registrerar ej custom keys utan plugin — ignorera */ });

        // ── Steg 7: Sammanfatta ──
        const cssLines = generatedCss.split('\n').filter(l => l.trim()).length;
        const cssRules = (generatedCss.match(/\{[^}]*\}/g) || []).length;

        return text({
          status: 'injicerad',
          sida: postUrl,
          mobilScore_fore: mobileIssues.score,
          css_rader: cssLines,
          css_regler: cssRules,
          brytpunkt: `${bp}px`,
          problem_adresserade: mobileIssues.issues.length,
          instruktion: 'Ladda om sidan i mobil-vy för att se resultatet. Kör perispa_mobile_audit igen för att mäta förbättring.',
          aterkalla: `Kör perispa_mobile_reset med page_id: ${postId} om du vill ta bort fixarna.`,
          css_forhandsgranskning: generatedCss.substring(0, 500) + (generatedCss.length > 500 ? '...' : ''),
        });

      } catch (e) { return err(e.message); }
    }
  );

  // ════════════════════════════════════════════════════
  // 3. perispa_mobile_preview — visa vad som injicerats
  // ════════════════════════════════════════════════════
  server.tool('perispa_mobile_preview',
    'Visa det injicerade mobilfix-CSS:et för en sida utan att ändra något.',
    {
      site: z.string().optional(),
      page_id: z.number(),
      post_type: z.string().optional().default('pages'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const wpType = args.post_type === 'posts' ? 'posts' : 'pages';
        const res = await wpFetch(s, `wp/v2/${wpType}/${args.page_id}`).catch(async () =>
          wpFetch(s, `wp/v2/posts/${args.page_id}`)
        );
        const content = res.data?.content?.raw || res.data?.content?.rendered || '';
        const match = content.match(/<!-- perispa-mobile-fix-start -->([\s\S]*?)<!-- perispa-mobile-fix-end -->/);
        if (!match) return text({ status: 'Ingen perispa mobilfix hittad på denna sida.' });

        const styleContent = match[1].replace(/<\/?style[^>]*>/gi, '').trim();
        return text({
          page_id: args.page_id,
          fix_applicerad: true,
          css: styleContent,
          rader: styleContent.split('\n').filter(l => l.trim()).length,
        });
      } catch (e) { return err(e.message); }
    }
  );

  // ════════════════════════════════════════════════════
  // 4. perispa_mobile_reset — ta bort injicerad fix
  // ════════════════════════════════════════════════════
  server.tool('perispa_mobile_reset',
    'Ta bort det injicerade mobilfix-CSS:et från en sida och återställ till original.',
    {
      site: z.string().optional(),
      page_id: z.number(),
      post_type: z.string().optional().default('pages'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const wpType = args.post_type === 'posts' ? 'posts' : 'pages';
        const res = await wpFetch(s, `wp/v2/${wpType}/${args.page_id}`).catch(async () =>
          wpFetch(s, `wp/v2/posts/${args.page_id}`)
        );
        const content = res.data?.content?.raw || res.data?.content?.rendered || '';
        if (!/perispa-mobile-fix-start/.test(content)) {
          return text({ status: 'Ingen perispa mobilfix hittad — ingenting att ta bort.' });
        }
        const cleanContent = stripOldMobileBlock(content);
        await wpFetch(s, `wp/v2/${wpType}/${args.page_id}`, {
          method: 'POST',
          body: { content: cleanContent },
        });
        return text({ status: 'Mobilfix borttagen', page_id: args.page_id });
      } catch (e) { return err(e.message); }
    }
  );

  // ════════════════════════════════════════════════════
  // 5. perispa_mobile_fix_all — kör mobilfix på ALLA sidor
  // ════════════════════════════════════════════════════
  server.tool('perispa_mobile_fix_all',
    'Kör perispa_mobile_fix på ALLA publicerade sidor för en site (max 10 åt gången). Bra för nyonboardade kunder.',
    {
      site: z.string().optional(),
      max_pages: z.number().optional().default(5).describe('Max antal sidor (default 5, max 10)'),
      min_score: z.number().optional().default(0).describe('Kör bara fix på sidor med mobilscore under detta värde (0 = alla)'),
      skip_already_fixed: z.boolean().default(true).describe('Hoppa över sidor som redan har perispa-fix'),
      breakpoint: z.number().optional().default(768),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const maxPages = Math.min(args.max_pages || 5, 10);
        const bp = args.breakpoint || BREAKPOINT;

        const pagesRes = await wpFetch(s, 'wp/v2/pages', {
          params: { per_page: maxPages * 2, status: 'publish', _fields: 'id,title,link,content', orderby: 'menu_order', order: 'asc' },
        });
        const pages = Array.isArray(pagesRes.data) ? pagesRes.data : [];

        let processed = 0, skipped = 0;
        const results = [];

        for (const page of pages) {
          if (processed >= maxPages) break;

          // Kolla om redan fixad
          if (args.skip_already_fixed) {
            const content = page.content?.raw || page.content?.rendered || '';
            if (/perispa-mobile-fix-start/.test(content)) {
              skipped++;
              continue;
            }
          }

          // Kolla PageSpeed-score om min_score satt
          if (args.min_score > 0) {
            try {
              const psData = await fetchPageSpeed(page.link, 'mobile');
              const { score } = extractMobileIssues(psData);
              if (score !== null && score >= args.min_score) {
                skipped++;
                continue;
              }
            } catch (_) { /* kör ändå */ }
          }

          // Hämta API-nyckel en gång
          let anthropicKey;
          try {
            anthropicKey = getAnthropicKey();
          } catch (e) {
            return err(e.message);
          }

          // Kör fix via intern logik (replikera steg 2-6 från perispa_mobile_fix)
          try {
            const html = await fetchHtml(page.link);
            const existingCss = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
              .join('\n').replace(/<\/?style[^>]*>/gi, '').substring(0, 4000);
            const bodyHtml = (html.match(/<body[^>]*>([\s\S]*?)<\/body>/i) || ['', html])[1]
              .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/\s+/g, ' ').substring(0, 5000);

            const prompt = `Generera ett mobilfix-CSS för denna WordPress-sida. Svara ENBART med ren CSS inom @media (max-width: ${bp}px) { }.

Sida: ${page.link}
Befintlig CSS (urval): ${existingCss.substring(0, 2000)}
HTML-struktur: ${bodyHtml.substring(0, 3000)}

Fixar: kolumner, typografi, padding, navigation, bilder (max-width:100%), touch targets (44px), overflow-x:hidden.`;

            let css = await callAnthropic(anthropicKey, prompt);
            css = css.replace(/^```(?:css)?\s*/m, '').replace(/\s*```\s*$/m, '').trim();
            if (!css.includes('{')) throw new Error('Ogiltig CSS');

            const currentContent = page.content?.raw || page.content?.rendered || '';
            const newContent = stripOldMobileBlock(currentContent) + '\n' + buildCssBlock(css, page.id);
            await wpFetch(s, `wp/v2/pages/${page.id}`, { method: 'POST', body: { content: newContent } });

            results.push({ id: page.id, title: page.title?.rendered, url: page.link, status: 'fixad' });
            processed++;
          } catch (e) {
            results.push({ id: page.id, title: page.title?.rendered, url: page.link, status: 'fel', error: e.message });
          }

          // Kort paus mellan sidor
          await new Promise(r => setTimeout(r, 1500));
        }

        return text({
          site: s.url,
          fixade: processed,
          hoppade_over: skipped,
          resultat: results,
        });
      } catch (e) { return err(e.message); }
    }
  );

};
