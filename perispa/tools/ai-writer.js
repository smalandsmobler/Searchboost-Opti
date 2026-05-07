/**
 * perispa — AI Writer tools
 * Generera artiklar och SEO-metadata med Anthropic API
 */

const { z } = require('zod');
const https = require('https');
const fs = require('fs');
const path = require('path');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

/**
 * Hamta Anthropic API-nyckel fran flera kallor
 */
function getApiKey() {
  // 1. Miljovariabel
  if (process.env.ANTHROPIC_API_KEY) return process.env.ANTHROPIC_API_KEY;

  // 2. config.json
  try {
    const configPath = path.join(__dirname, '..', 'config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      if (config.anthropic_api_key) return config.anthropic_api_key;
    }
  } catch { /* */ }

  // 3. ~/.anthropic/api_key
  try {
    const homePath = process.env.HOME || process.env.USERPROFILE;
    const keyFile = path.join(homePath, '.anthropic', 'api_key');
    if (fs.existsSync(keyFile)) {
      return fs.readFileSync(keyFile, 'utf-8').trim();
    }
  } catch { /* */ }

  return null;
}

/**
 * Skicka meddelande till Anthropic API
 */
function callAnthropic(apiKey, prompt, maxTokens = 4096) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
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
      timeout: 120000,
    }, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`Anthropic API ${res.statusCode}: ${json.error?.message || data.slice(0, 500)}`));
          } else {
            const content = json.content?.[0]?.text || '';
            resolve(content);
          }
        } catch {
          reject(new Error(`Ogiltigt svar fran Anthropic API: ${data.slice(0, 500)}`));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Anthropic API timeout (120s)')); });
    req.write(body);
    req.end();
  });
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

module.exports = function registerAiWriterTools(server, getSite, wpFetch) {

  // --- Write Article ---
  server.tool('perispa_write_article', 'Skriv en SEO-optimerad artikel med AI och publicera till WordPress', {
    site: z.string().optional(),
    topic: z.string().describe('Amne for artikeln'),
    keyword: z.string().describe('Fokus-sokord'),
    word_count: z.number().optional().default(1500).describe('Onskat antal ord'),
    status: z.string().optional().default('draft').describe('draft, publish, private'),
    language: z.string().optional().default('sv').describe('Sprak (sv, en, etc.)'),
  }, async (args) => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) return err('Ingen Anthropic API-nyckel hittad. Satt ANTHROPIC_API_KEY, lagg till anthropic_api_key i config.json, eller skapa ~/.anthropic/api_key');

      const s = getSite(args.site);

      const langMap = {
        sv: 'svenska',
        en: 'English',
        no: 'norska',
        da: 'danska',
        fi: 'finska',
        de: 'tyska',
      };
      const langName = langMap[args.language] || args.language;

      const prompt = `Skriv en SEO-optimerad artikel pa ${langName} om "${args.topic}". Fokus-sokord: "${args.keyword}". Anvand H2 och H3-rubriker, punktlistor, och skriv ca ${args.word_count} ord. Inga emojis. Returnera BARA HTML-innehallet (borja med forsta <h2>, ingen <html>/<body>-wrapper). Inkludera fokus-sokordet naturligt i texten, i minst en H2 och i forsta stycket.`;

      const articleHtml = await callAnthropic(apiKey, prompt, Math.min(args.word_count * 3, 8192));

      // Rensa eventuell markdown code-block wrapping
      let cleanHtml = articleHtml.trim();
      if (cleanHtml.startsWith('```html')) cleanHtml = cleanHtml.slice(7);
      else if (cleanHtml.startsWith('```')) cleanHtml = cleanHtml.slice(3);
      if (cleanHtml.endsWith('```')) cleanHtml = cleanHtml.slice(0, -3);
      cleanHtml = cleanHtml.trim();

      // Generera SEO-titel fran amne
      const seoTitlePrompt = `Generera en SEO-optimerad titel (max 60 tecken) pa ${langName} for en artikel om "${args.topic}" med fokus-sokord "${args.keyword}". Returnera BARA titeln, inget annat.`;
      const seoTitle = (await callAnthropic(apiKey, seoTitlePrompt, 100)).trim().replace(/^["']|["']$/g, '');

      // Generera meta description
      const metaDescPrompt = `Skriv en meta description (max 155 tecken) pa ${langName} for en artikel om "${args.topic}" med fokus-sokord "${args.keyword}". Returnera BARA beskrivningen.`;
      const metaDesc = (await callAnthropic(apiKey, metaDescPrompt, 200)).trim().replace(/^["']|["']$/g, '');

      // Skapa inlagg i WordPress
      const postBody = {
        title: seoTitle,
        content: cleanHtml,
        status: args.status,
        meta: {
          rank_math_title: seoTitle,
          rank_math_description: metaDesc,
          rank_math_focus_keyword: args.keyword,
        },
      };

      const res = await wpFetch(s, 'wp/v2/posts', { method: 'POST', body: postBody });

      // Forsok satta Rank Math meta via dedikerat API
      try {
        await wpFetch(s, 'rankmath/v1/updateMeta', {
          method: 'POST',
          body: {
            objectID: res.data.id,
            objectType: 'post',
            meta: {
              rank_math_title: seoTitle,
              rank_math_description: metaDesc,
              rank_math_focus_keyword: args.keyword,
            },
          },
        });
      } catch { /* Rank Math API kanske inte ar tillgangligt */ }

      const wordCount = stripTags(cleanHtml).split(/\s+/).filter(w => w.length > 0).length;

      return text({
        created: true,
        post_id: res.data.id,
        title: seoTitle,
        link: res.data.link,
        status: args.status,
        word_count: wordCount,
        seo_title: seoTitle,
        seo_description: metaDesc,
        focus_keyword: args.keyword,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Write Meta ---
  server.tool('perispa_write_meta', 'Generera SEO-titel, description och fokus-sokord med AI for en befintlig sida', {
    site: z.string().optional(),
    page_id: z.number().describe('Sida/inlaggs-ID'),
    type: z.string().optional().default('page').describe('page eller post'),
    apply: z.boolean().optional().default(false).describe('true = spara till WordPress, false = visa bara forslag'),
  }, async (args) => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) return err('Ingen Anthropic API-nyckel hittad.');

      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';

      // Hamta sidans innehall
      const pageRes = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const page = pageRes.data;
      const content = page.content?.raw || page.content?.rendered || '';
      const title = page.title?.raw || page.title?.rendered || '';
      const plainText = stripTags(content).slice(0, 3000);

      const prompt = `Baserat pa detta WordPress-innehall, generera:
1) SEO-titel (max 60 tecken)
2) Meta description (max 155 tecken)
3) Fokus-sokord (1-3 ord)

Sidans titel: "${title}"
Innehall (forsta 3000 tecken): "${plainText}"

Returnera som JSON med exakt dessa nycklar: { "seo_title": "...", "meta_description": "...", "focus_keyword": "..." }
Returnera BARA JSON, inget annat.`;

      const response = await callAnthropic(apiKey, prompt, 500);

      // Parsa JSON fran svaret
      let parsed;
      try {
        let jsonStr = response.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
        else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
        parsed = JSON.parse(jsonStr.trim());
      } catch {
        return err('Kunde inte parsa AI-svar som JSON: ' + response.slice(0, 300));
      }

      const result = {
        page_id: args.page_id,
        current_title: title,
        suggested_seo_title: parsed.seo_title || '',
        suggested_meta_description: parsed.meta_description || '',
        suggested_focus_keyword: parsed.focus_keyword || '',
        applied: false,
      };

      if (args.apply) {
        const meta = {
          rank_math_title: parsed.seo_title,
          rank_math_description: parsed.meta_description,
          rank_math_focus_keyword: parsed.focus_keyword,
        };

        await wpFetch(s, `${endpoint}/${args.page_id}`, {
          method: 'POST',
          body: { meta },
        });

        // Forsok via Rank Math API
        try {
          await wpFetch(s, 'rankmath/v1/updateMeta', {
            method: 'POST',
            body: {
              objectID: args.page_id,
              objectType: args.type,
              meta,
            },
          });
        } catch { /* */ }

        result.applied = true;
      }

      return text(result);
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Batch Write Articles ---
  server.tool('perispa_write_batch_articles', 'Skriv flera artiklar baserat pa en lista av amnen', {
    site: z.string().optional(),
    articles: z.array(z.object({
      topic: z.string(),
      keyword: z.string(),
    })).describe('Lista med amnen och fokus-sokord'),
    status: z.string().optional().default('draft').describe('Status for alla artiklar'),
  }, async (args) => {
    try {
      const apiKey = getApiKey();
      if (!apiKey) return err('Ingen Anthropic API-nyckel hittad.');

      const s = getSite(args.site);
      const results = [];

      for (const article of args.articles) {
        try {
          const langName = 'svenska';

          const prompt = `Skriv en SEO-optimerad artikel pa ${langName} om "${article.topic}". Fokus-sokord: "${article.keyword}". Anvand H2 och H3-rubriker, punktlistor, och skriv ca 1500 ord. Inga emojis. Returnera BARA HTML-innehallet (borja med forsta <h2>, ingen <html>/<body>-wrapper). Inkludera fokus-sokordet naturligt i texten, i minst en H2 och i forsta stycket.`;

          const articleHtml = await callAnthropic(apiKey, prompt, 6000);

          let cleanHtml = articleHtml.trim();
          if (cleanHtml.startsWith('```html')) cleanHtml = cleanHtml.slice(7);
          else if (cleanHtml.startsWith('```')) cleanHtml = cleanHtml.slice(3);
          if (cleanHtml.endsWith('```')) cleanHtml = cleanHtml.slice(0, -3);
          cleanHtml = cleanHtml.trim();

          // Generera titel + meta
          const metaPrompt = `For en artikel om "${article.topic}" med fokus-sokord "${article.keyword}", generera:
1) SEO-titel (max 60 tecken, pa svenska)
2) Meta description (max 155 tecken, pa svenska)
Returnera som JSON: { "seo_title": "...", "meta_description": "..." }
Returnera BARA JSON.`;

          const metaResponse = await callAnthropic(apiKey, metaPrompt, 300);
          let meta;
          try {
            let jsonStr = metaResponse.trim();
            if (jsonStr.startsWith('```json')) jsonStr = jsonStr.slice(7);
            else if (jsonStr.startsWith('```')) jsonStr = jsonStr.slice(3);
            if (jsonStr.endsWith('```')) jsonStr = jsonStr.slice(0, -3);
            meta = JSON.parse(jsonStr.trim());
          } catch {
            meta = { seo_title: article.topic, meta_description: '' };
          }

          const postBody = {
            title: meta.seo_title || article.topic,
            content: cleanHtml,
            status: args.status,
            meta: {
              rank_math_title: meta.seo_title || article.topic,
              rank_math_description: meta.meta_description || '',
              rank_math_focus_keyword: article.keyword,
            },
          };

          const res = await wpFetch(s, 'wp/v2/posts', { method: 'POST', body: postBody });
          const wordCount = stripTags(cleanHtml).split(/\s+/).filter(w => w.length > 0).length;

          results.push({
            success: true,
            post_id: res.data.id,
            title: meta.seo_title || article.topic,
            link: res.data.link,
            word_count: wordCount,
            topic: article.topic,
            keyword: article.keyword,
          });
        } catch (e) {
          results.push({
            success: false,
            topic: article.topic,
            keyword: article.keyword,
            error: e.message,
          });
        }
      }

      return text({
        site: s.slug,
        total: args.articles.length,
        successful: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        status: args.status,
        results,
      });
    } catch (e) {
      return err(e.message);
    }
  });

};
