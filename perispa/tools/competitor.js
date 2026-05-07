/**
 * perispa — Competitor analysis tools
 * Crawla och jamfor konkurrenters sajter (publikt tillganglig data)
 */

const { z } = require('zod');
const https = require('https');
const http = require('http');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}

/**
 * Hamta en webbsida via HTTPS/HTTP GET
 */
function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http;
    const req = mod.get(url, { rejectUnauthorized: false, timeout, headers: { 'User-Agent': 'perispa/1.0 SEO-analyzer' } }, (res) => {
      // Hantera redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : new URL(res.headers.location, url).href;
        return fetchUrl(redirectUrl, timeout).then(resolve).catch(reject);
      }
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve({ html: body, statusCode: res.statusCode, headers: res.headers }));
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

/**
 * Extrahera SEO-data fran en HTML-sida
 */
function extractSeoData(html, url) {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';
  const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)?.[1]
    || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i)?.[1]
    || '';
  const canonical = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([\s\S]*?)["'][^>]*>/i)?.[1] || '';

  // Headings
  const h1s = [];
  const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let h1Match;
  while ((h1Match = h1Regex.exec(html)) !== null) {
    h1s.push(stripTags(h1Match[1]));
  }

  const h2s = [];
  const h2Regex = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  let h2Match;
  while ((h2Match = h2Regex.exec(html)) !== null) {
    h2s.push(stripTags(h2Match[1]));
  }

  // OG-tags
  const ogTags = {};
  const ogRegex = /<meta[^>]*property=["']og:([^"']+)["'][^>]*content=["']([\s\S]*?)["'][^>]*>/gi;
  let ogMatch;
  while ((ogMatch = ogRegex.exec(html)) !== null) {
    ogTags[ogMatch[1]] = ogMatch[2];
  }

  // Schema markup
  const schemas = [];
  const schemaRegex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let schemaMatch;
  while ((schemaMatch = schemaRegex.exec(html)) !== null) {
    try {
      schemas.push(JSON.parse(schemaMatch[1]));
    } catch { /* ignorera ogiltig JSON */ }
  }

  // Images
  const images = [];
  const imgRegex = /<img[^>]*>/gi;
  let imgMatch;
  while ((imgMatch = imgRegex.exec(html)) !== null) {
    const tag = imgMatch[0];
    const src = tag.match(/src=["']([^"']+)["']/)?.[1] || '';
    const alt = tag.match(/alt=["']([^"']*?)["']/)?.[1];
    images.push({ src: src.slice(0, 100), has_alt: alt !== undefined && alt !== '' });
  }

  // Lankar
  const internalLinks = [];
  const externalLinks = [];
  const baseHost = new URL(url).hostname;
  const linkRegex = /<a[^>]*href=["']([^"'#]+)["'][^>]*>/gi;
  let linkMatch;
  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const href = linkMatch[1];
    if (href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    try {
      const linkHost = href.startsWith('/') ? baseHost : new URL(href).hostname;
      if (linkHost === baseHost || href.startsWith('/')) {
        internalLinks.push(href);
      } else {
        externalLinks.push(href);
      }
    } catch { /* ignorera ogiltiga URL:er */ }
  }

  // Ordantal
  const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  const plainText = stripTags(bodyContent);
  const wordCount = plainText.split(/\s+/).filter(w => w.length > 0).length;

  return {
    title,
    title_length: title.length,
    meta_description: metaDesc,
    meta_description_length: metaDesc.length,
    canonical,
    h1: h1s,
    h2: h2s,
    og_tags: ogTags,
    schema_markup: schemas,
    schema_count: schemas.length,
    word_count: wordCount,
    images_total: images.length,
    images_missing_alt: images.filter(i => !i.has_alt).length,
    internal_links: internalLinks.length,
    external_links: externalLinks.length,
  };
}

module.exports = function registerCompetitorTools(server, getSite, wpFetch) {

  // --- Competitor Scan ---
  server.tool('perispa_competitor_scan', 'Crawla en konkurrents sajt och hamta SEO-data (title, meta, headings, schema, lankar)', {
    url: z.string().describe('Konkurrentens URL (t.ex. https://example.com)'),
  }, async (args) => {
    try {
      const result = await fetchUrl(args.url);
      if (result.statusCode >= 400) {
        return err(`Fick HTTP ${result.statusCode} fran ${args.url}`);
      }

      const seoData = extractSeoData(result.html, args.url);

      return text({
        url: args.url,
        status_code: result.statusCode,
        ...seoData,
      });
    } catch (e) {
      return err(`Kunde inte hamta ${args.url}: ${e.message}`);
    }
  });

  // --- Competitor Compare ---
  server.tool('perispa_competitor_compare', 'Jamfor en kunds sida med en konkurrents sida', {
    site: z.string().optional(),
    page_id: z.number().describe('Kundens sida-ID'),
    competitor_url: z.string().describe('Konkurrentens sidans URL'),
  }, async (args) => {
    try {
      const s = getSite(args.site);

      // Hamta kundens sida
      const pageRes = await wpFetch(s, `wp/v2/pages/${args.page_id}`, { params: { context: 'edit' } }).catch(() =>
        wpFetch(s, `wp/v2/posts/${args.page_id}`, { params: { context: 'edit' } })
      );
      const page = pageRes.data;
      const content = page.content?.raw || page.content?.rendered || '';
      const meta = page.meta || {};

      // Kundens SEO-data
      const ourTitle = meta.rank_math_title || meta._yoast_wpseo_title || page.title?.raw || '';
      const ourDesc = meta.rank_math_description || meta._yoast_wpseo_metadesc || '';
      const ourText = stripTags(content);
      const ourWordCount = ourText.split(/\s+/).filter(w => w.length > 0).length;
      const ourH1s = [];
      const h1Regex = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
      let h1Match;
      while ((h1Match = h1Regex.exec(content)) !== null) {
        ourH1s.push(stripTags(h1Match[1]));
      }
      const ourH2Count = (content.match(/<h2/gi) || []).length;
      const ourImgCount = (content.match(/<img/gi) || []).length;
      const ourSchemaCount = (JSON.stringify(meta).match(/rank_math_schema/g) || []).length
        + (content.match(/application\/ld\+json/gi) || []).length;

      // Hamta konkurrentens sida
      const compResult = await fetchUrl(args.competitor_url);
      const compData = extractSeoData(compResult.html, args.competitor_url);

      // Jamforelse
      const comparison = [];

      function compare(metric, ours, theirs, higherBetter = true) {
        let winner = 'tie';
        if (typeof ours === 'number' && typeof theirs === 'number') {
          if (higherBetter) winner = ours > theirs ? 'oss' : ours < theirs ? 'konkurrent' : 'tie';
          else winner = ours < theirs ? 'oss' : ours > theirs ? 'konkurrent' : 'tie';
        } else if (ours && !theirs) {
          winner = 'oss';
        } else if (!ours && theirs) {
          winner = 'konkurrent';
        }
        comparison.push({ metric, ours, theirs, winner });
      }

      compare('SEO-titel langd', ourTitle.length, compData.title_length);
      compare('Har SEO-titel', !!ourTitle, !!compData.title);
      compare('Meta description langd', ourDesc.length, compData.meta_description_length);
      compare('Har meta description', !!ourDesc, !!compData.meta_description);
      compare('Ordantal', ourWordCount, compData.word_count, true);
      compare('H1-rubriker', ourH1s.length > 0 ? 1 : 0, compData.h1.length > 0 ? 1 : 0);
      compare('H2-rubriker', ourH2Count, compData.h2.length, true);
      compare('Bilder', ourImgCount, compData.images_total, true);
      compare('Schema markup', ourSchemaCount, compData.schema_count, true);

      const ourWins = comparison.filter(c => c.winner === 'oss').length;
      const theirWins = comparison.filter(c => c.winner === 'konkurrent').length;

      // Forbattringsforslag
      const improvements = [];
      if (ourWordCount < compData.word_count) {
        improvements.push(`Oka ordantal fran ${ourWordCount} till minst ${compData.word_count} ord`);
      }
      if (!ourTitle) improvements.push('Lagg till SEO-titel');
      if (!ourDesc) improvements.push('Lagg till meta description');
      if (ourH2Count < compData.h2.length) {
        improvements.push(`Lagg till fler H2-rubriker (du har ${ourH2Count}, konkurrenten har ${compData.h2.length})`);
      }
      if (ourImgCount < compData.images_total) {
        improvements.push(`Lagg till fler bilder (du har ${ourImgCount}, konkurrenten har ${compData.images_total})`);
      }
      if (ourSchemaCount < compData.schema_count) {
        improvements.push('Lagg till schema markup (JSON-LD)');
      }

      return text({
        our_page: { id: args.page_id, title: page.title?.raw || '' },
        competitor_url: args.competitor_url,
        comparison,
        score: { oss: ourWins, konkurrent: theirWins, oavgjort: comparison.length - ourWins - theirWins },
        improvements,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Competitor Keywords ---
  server.tool('perispa_competitor_keywords', 'Extrahera fokus-sokord fran en konkurrents meta tags och innehall', {
    url: z.string().describe('Konkurrentens URL'),
  }, async (args) => {
    try {
      const result = await fetchUrl(args.url);
      if (result.statusCode >= 400) {
        return err(`Fick HTTP ${result.statusCode} fran ${args.url}`);
      }

      const html = result.html;

      // Meta keywords (om de finns)
      const metaKeywords = html.match(/<meta[^>]*name=["']keywords["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)?.[1]
        || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']keywords["'][^>]*>/i)?.[1]
        || '';

      // Title
      const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() || '';

      // Meta description
      const metaDesc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["'][^>]*>/i)?.[1]
        || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["'][^>]*>/i)?.[1]
        || '';

      // H1 och H2
      const headings = [];
      const hRegex = /<h([1-2])[^>]*>([\s\S]*?)<\/h\1>/gi;
      let hMatch;
      while ((hMatch = hRegex.exec(html)) !== null) {
        headings.push(stripTags(hMatch[2]));
      }

      // Extrahera alla ord fran body
      const bodyContent = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
      // Ta bort script och style
      const cleanBody = bodyContent
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<header[\s\S]*?<\/header>/gi, '');
      const plainText = stripTags(cleanBody).toLowerCase();

      // Rakna ordfrekvens
      const stopwords = new Set([
        'och', 'i', 'att', 'det', 'som', 'en', 'pa', 'ar', 'av', 'for', 'med', 'till',
        'den', 'har', 'de', 'inte', 'ett', 'om', 'vi', 'var', 'kan', 'man', 'ska',
        'the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'on', 'with', 'at', 'by',
        'an', 'be', 'this', 'that', 'it', 'from', 'or', 'but', 'not', 'are', 'was',
        'din', 'ditt', 'dina', 'vara', 'vart', 'sa', 'da', 'nar', 'hur', 'vad',
        'der', 'die', 'das', 'und', 'les', 'des', 'une',
      ]);

      const words = plainText
        .replace(/[^a-zåäöü0-9\s]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 2 && !stopwords.has(w));

      const freq = {};
      for (const w of words) {
        freq[w] = (freq[w] || 0) + 1;
      }

      // Top-sokord (sorterade pa frekvens)
      const topKeywords = Object.entries(freq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 30)
        .map(([word, count]) => ({ word, count, density: ((count / words.length) * 100).toFixed(2) + '%' }));

      // 2-grams
      const bigrams = {};
      for (let i = 0; i < words.length - 1; i++) {
        const bi = words[i] + ' ' + words[i + 1];
        bigrams[bi] = (bigrams[bi] || 0) + 1;
      }

      const topBigrams = Object.entries(bigrams)
        .filter(([, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([phrase, count]) => ({ phrase, count }));

      return text({
        url: args.url,
        meta_keywords: metaKeywords ? metaKeywords.split(',').map(k => k.trim()) : [],
        title_keywords: title,
        meta_description: metaDesc,
        headings,
        top_single_keywords: topKeywords,
        top_phrases: topBigrams,
        total_words: words.length,
      });
    } catch (e) {
      return err(`Kunde inte analysera ${args.url}: ${e.message}`);
    }
  });

};
