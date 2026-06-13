/**
 * perispa — SEO Analysis tools
 * analyze_seo, check_seo_issues, analyze_readability, analyze_images, check_structured_data
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

module.exports = function registerSeoTools(server, getSite, wpFetch) {

  // --- Analyze SEO ---
  server.tool('perispa_analyze_seo', 'Komplett SEO-analys av en sida — title, description, headings, images, links, content', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const p = res.data;
      const content = p.content?.raw || p.content?.rendered || '';
      const meta = p.meta || {};

      // Title
      const seoTitle = meta.rank_math_title || meta._yoast_wpseo_title || p.title?.raw || '';
      const seoDesc = meta.rank_math_description || meta._yoast_wpseo_metadesc || '';
      const focusKw = meta.rank_math_focus_keyword || meta._yoast_wpseo_focuskw || '';

      // Headings
      const headings = [];
      const hRegex = /<h([1-6])[^>]*>(.*?)<\/h\1>/gi;
      let hMatch;
      while ((hMatch = hRegex.exec(content)) !== null) {
        headings.push({ level: parseInt(hMatch[1]), text: stripTags(hMatch[2]) });
      }

      // Images
      const images = [];
      const imgRegex = /<img[^>]*>/gi;
      let imgMatch;
      while ((imgMatch = imgRegex.exec(content)) !== null) {
        const tag = imgMatch[0];
        const src = tag.match(/src="([^"]+)"/)?.[1] || '';
        const alt = tag.match(/alt="([^"]*?)"/)?.[1] || '';
        const width = tag.match(/width="([^"]+)"/)?.[1] || '';
        const height = tag.match(/height="([^"]+)"/)?.[1] || '';
        images.push({ src: src.slice(0, 100), alt, has_alt: alt.length > 0, width, height, has_dimensions: !!(width && height) });
      }

      // Links
      const links = { internal: 0, external: 0, nofollow: 0, broken_candidates: [] };
      const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/gi;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(content)) !== null) {
        const href = linkMatch[1];
        const tag = linkMatch[0];
        if (href.startsWith(s.url) || href.startsWith('/') || href.startsWith('#')) {
          links.internal++;
        } else if (href.startsWith('http')) {
          links.external++;
        }
        if (tag.includes('nofollow')) links.nofollow++;
      }

      // Content stats
      const textContent = stripTags(content);
      const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length;

      // Issues
      const issues = [];
      if (!seoTitle) issues.push({ severity: 'high', issue: 'Saknar SEO-titel' });
      if (seoTitle && seoTitle.length > 60) issues.push({ severity: 'medium', issue: `SEO-titel för lång (${seoTitle.length} tecken, max 60)` });
      if (!seoDesc) issues.push({ severity: 'high', issue: 'Saknar meta description' });
      if (seoDesc && seoDesc.length > 160) issues.push({ severity: 'medium', issue: `Meta description för lång (${seoDesc.length} tecken, max 160)` });
      if (seoDesc && seoDesc.length < 70) issues.push({ severity: 'low', issue: `Meta description kort (${seoDesc.length} tecken, rekommenderat 70-160)` });
      if (!focusKw) issues.push({ severity: 'medium', issue: 'Inget fokus-sökord satt' });
      if (headings.filter(h => h.level === 1).length === 0) issues.push({ severity: 'high', issue: 'Saknar H1-rubrik' });
      if (headings.filter(h => h.level === 1).length > 1) issues.push({ severity: 'medium', issue: `Flera H1-rubriker (${headings.filter(h => h.level === 1).length} st)` });
      if (wordCount < 300) issues.push({ severity: 'medium', issue: `Tunt innehåll (${wordCount} ord, rekommenderat 300+)` });
      const noAlt = images.filter(i => !i.has_alt);
      if (noAlt.length > 0) issues.push({ severity: 'medium', issue: `${noAlt.length} bilder saknar alt-text` });
      const noDims = images.filter(i => !i.has_dimensions);
      if (noDims.length > 0) issues.push({ severity: 'low', issue: `${noDims.length} bilder saknar width/height (CLS-risk)` });
      if (links.internal === 0) issues.push({ severity: 'low', issue: 'Inga interna länkar' });

      const score = Math.max(0, 100 - issues.filter(i => i.severity === 'high').length * 20
        - issues.filter(i => i.severity === 'medium').length * 10
        - issues.filter(i => i.severity === 'low').length * 5);

      return text({
        page_id: args.page_id,
        url: p.link,
        seo_score: score,
        seo_title: seoTitle,
        seo_title_length: seoTitle.length,
        seo_description: seoDesc,
        seo_description_length: seoDesc.length,
        focus_keyword: focusKw,
        word_count: wordCount,
        headings: { total: headings.length, h1: headings.filter(h => h.level === 1).length, list: headings },
        images: { total: images.length, missing_alt: noAlt.length, missing_dimensions: noDims.length },
        links,
        issues,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Check SEO issues (batch) ---
  server.tool('perispa_check_seo_issues', 'Snabbkoll av SEO-problem på flera sidor', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, endpoint, {
        params: { per_page: Math.min(args.per_page, 100), status: 'publish', context: 'edit' },
      });

      const results = res.data.map(p => {
        const meta = p.meta || {};
        const title = meta.rank_math_title || meta._yoast_wpseo_title || '';
        const desc = meta.rank_math_description || meta._yoast_wpseo_metadesc || '';
        const content = p.content?.raw || p.content?.rendered || '';
        const issues = [];

        if (!title) issues.push('no_seo_title');
        if (!desc) issues.push('no_meta_desc');
        if (title.length > 60) issues.push('title_too_long');
        if (desc.length > 160) issues.push('desc_too_long');
        if (!/<h1/i.test(content)) issues.push('no_h1');

        const imgCount = (content.match(/<img/gi) || []).length;
        const noAlt = (content.match(/<img(?![^>]*alt="[^"]+")[^>]*>/gi) || []).length;
        if (noAlt > 0) issues.push(`${noAlt}_imgs_no_alt`);

        return {
          id: p.id,
          title: p.title?.raw || p.title?.rendered || '',
          slug: p.slug,
          issues,
          issue_count: issues.length,
        };
      });

      results.sort((a, b) => b.issue_count - a.issue_count);

      return text({
        site: s.slug,
        total_pages: res.total,
        pages_checked: results.length,
        pages_with_issues: results.filter(r => r.issue_count > 0).length,
        results,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Analyze readability ---
  server.tool('perispa_analyze_readability', 'Analysera läsbarhet — meningslängd, ordlängd, stycken', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const content = res.data.content?.raw || res.data.content?.rendered || '';
      const text_ = stripTags(content);

      const sentences = text_.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = text_.split(/\s+/).filter(w => w.length > 0);
      const paragraphs = content.split(/<\/p>/gi).length - 1 || text_.split(/\n\n/).length;

      const avgSentenceLength = sentences.length > 0 ? Math.round(words.length / sentences.length) : 0;
      const avgWordLength = words.length > 0 ? (words.reduce((sum, w) => sum + w.length, 0) / words.length).toFixed(1) : 0;

      // LIX (Swedish readability index)
      const longWords = words.filter(w => w.length > 6).length;
      const lix = words.length > 0 && sentences.length > 0
        ? Math.round(words.length / sentences.length + (longWords / words.length) * 100)
        : 0;

      let lixLevel = 'okänd';
      if (lix < 25) lixLevel = 'Mycket lätt (barnbok)';
      else if (lix < 35) lixLevel = 'Lätt (skönlitteratur)';
      else if (lix < 45) lixLevel = 'Medel (dagstidning)';
      else if (lix < 55) lixLevel = 'Svår (facklitteratur)';
      else lixLevel = 'Mycket svår (akademisk)';

      const issues = [];
      if (avgSentenceLength > 20) issues.push('Långa meningar — försök korta ner till 15-20 ord');
      if (lix > 50) issues.push('Hög LIX — förenkla språket för webben');
      if (paragraphs > 0 && words.length / paragraphs > 100) issues.push('Långa stycken — dela upp i kortare stycken');
      const headingCount = (content.match(/<h[2-6]/gi) || []).length;
      if (words.length > 500 && headingCount < 2) issues.push('Få underrubriker — lägg till H2/H3 för att bryta upp texten');

      return text({
        page_id: args.page_id,
        word_count: words.length,
        sentence_count: sentences.length,
        paragraph_count: paragraphs,
        avg_sentence_length: avgSentenceLength,
        avg_word_length: parseFloat(avgWordLength),
        long_words_pct: words.length > 0 ? Math.round(longWords / words.length * 100) : 0,
        lix_score: lix,
        lix_level: lixLevel,
        subheading_count: headingCount,
        issues,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Analyze images ---
  server.tool('perispa_analyze_images', 'Analysera bildoptimering — alt-text, storlek, format, lazy loading', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const content = res.data.content?.raw || res.data.content?.rendered || '';

      const images = [];
      const imgRegex = /<img[^>]*>/gi;
      let match;
      while ((match = imgRegex.exec(content)) !== null) {
        const tag = match[0];
        const src = tag.match(/src="([^"]+)"/)?.[1] || '';
        const alt = tag.match(/alt="([^"]*?)"/)?.[1];
        const width = tag.match(/width="([^"]+)"/)?.[1];
        const height = tag.match(/height="([^"]+)"/)?.[1];
        const loading = tag.match(/loading="([^"]+)"/)?.[1];
        const srcset = tag.match(/srcset="([^"]+)"/)?.[1];
        const ext = src.split('.').pop()?.split('?')[0]?.toLowerCase() || '';

        const issues = [];
        if (alt === undefined || alt === '') issues.push('missing_alt');
        if (!width || !height) issues.push('missing_dimensions');
        if (!loading) issues.push('no_lazy_loading');
        if (!srcset) issues.push('no_srcset');
        if (['png', 'bmp', 'tiff'].includes(ext)) issues.push(`non_optimal_format_${ext}`);

        images.push({
          src: src.slice(0, 150),
          alt: alt || '',
          width: width || null,
          height: height || null,
          format: ext,
          lazy_loading: loading || null,
          has_srcset: !!srcset,
          issues,
        });
      }

      return text({
        page_id: args.page_id,
        total_images: images.length,
        issues_summary: {
          missing_alt: images.filter(i => i.issues.includes('missing_alt')).length,
          missing_dimensions: images.filter(i => i.issues.includes('missing_dimensions')).length,
          no_lazy_loading: images.filter(i => i.issues.includes('no_lazy_loading')).length,
          no_srcset: images.filter(i => i.issues.includes('no_srcset')).length,
        },
        images,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Check structured data ---
  server.tool('perispa_check_structured_data', 'Kontrollera schema.org structured data på en sida', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const p = res.data;
      const content = p.content?.raw || p.content?.rendered || '';
      const meta = p.meta || {};

      const schemas = [];

      // Yoast schema
      if (p.yoast_head_json?.schema) {
        schemas.push({ source: 'yoast', schema: p.yoast_head_json.schema });
      }

      // Rank Math schema
      if (meta.rank_math_schema) {
        try {
          schemas.push({ source: 'rank_math', schema: JSON.parse(meta.rank_math_schema) });
        } catch {
          schemas.push({ source: 'rank_math', schema: meta.rank_math_schema });
        }
      }

      // Inline JSON-LD
      const jsonLdRegex = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
      let jsonLdMatch;
      while ((jsonLdMatch = jsonLdRegex.exec(content)) !== null) {
        try {
          schemas.push({ source: 'inline_json_ld', schema: JSON.parse(jsonLdMatch[1]) });
        } catch { /* */ }
      }

      return text({
        page_id: args.page_id,
        url: p.link,
        schemas_found: schemas.length,
        schemas,
        has_yoast_schema: !!p.yoast_head_json?.schema,
        has_rank_math_schema: !!meta.rank_math_schema,
      });
    } catch (e) {
      return err(e.message);
    }
  });
};

function stripTags(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/gi, ' ').replace(/\s+/g, ' ').trim();
}
