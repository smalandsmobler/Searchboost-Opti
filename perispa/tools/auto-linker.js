/**
 * perispa — Auto-linker tools
 * Analysera, foreslaa och lagg till internlankar automatiskt
 */

const { z } = require('zod');

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
 * Hamta alla publicerade sidor + inlagg fran en site (paginerat)
 */
async function fetchAllContent(wpFetch, site, types = ['pages', 'posts']) {
  const items = [];
  for (const type of types) {
    let page = 1;
    let totalPages = 1;
    while (page <= totalPages) {
      try {
        const res = await wpFetch(site, `wp/v2/${type}`, {
          params: { per_page: 100, page, status: 'publish', context: 'edit' },
        });
        if (Array.isArray(res.data)) {
          for (const p of res.data) {
            items.push({
              id: p.id,
              type: type === 'pages' ? 'page' : 'post',
              title: p.title?.raw || p.title?.rendered || '',
              slug: p.slug,
              link: p.link || '',
              content: p.content?.raw || p.content?.rendered || '',
            });
          }
        }
        totalPages = res.totalPages || 1;
        page++;
      } catch {
        break;
      }
    }
  }
  return items;
}

/**
 * Extrahera interna och externa lankar fran HTML-innehall
 */
function extractLinks(content, siteUrl) {
  const links = { internal: [], external: [] };
  const linkRegex = /<a[^>]*href="([^"]*)"[^>]*>/gi;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const href = match[1];
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    if (href.startsWith(siteUrl) || href.startsWith('/')) {
      links.internal.push(href);
    } else if (href.startsWith('http')) {
      links.external.push(href);
    }
  }
  return links;
}

/**
 * Extrahera ord som ar relevanta for matchning (gemener, inga stopord)
 */
function extractKeywords(text_) {
  const stopwords = new Set([
    'och', 'i', 'att', 'det', 'som', 'en', 'pa', 'ar', 'av', 'for', 'med', 'till',
    'den', 'har', 'de', 'inte', 'ett', 'om', 'vi', 'var', 'kan', 'man', 'ska',
    'the', 'and', 'is', 'in', 'to', 'of', 'a', 'for', 'on', 'with', 'at', 'by',
    'an', 'be', 'this', 'that', 'it', 'from', 'or', 'but', 'not', 'are', 'was',
    'din', 'ditt', 'dina', 'vara', 'vart', 'sa', 'da', 'nar', 'hur', 'vad',
  ]);
  return text_.toLowerCase()
    .replace(/[^a-zåäö0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopwords.has(w));
}

/**
 * Rakna gemensamma ord mellan tva ordlistor
 */
function overlapScore(wordsA, wordsB) {
  const setB = new Set(wordsB);
  let score = 0;
  for (const w of wordsA) {
    if (setB.has(w)) score++;
  }
  return score;
}

module.exports = function registerAutoLinkerTools(server, getSite, wpFetch) {

  // --- Analyze Links ---
  server.tool('perispa_analyze_links', 'Analysera internlanksstrukturen pa en site — hitta orphan pages, mest/minst lankade', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const items = await fetchAllContent(wpFetch, s);
      const siteUrl = s.url.replace(/\/$/, '');

      // Bygg lankmatris
      const incomingLinks = {}; // page link -> antal inkommande
      const outgoingLinks = {}; // page id -> { internal, external }

      // Normalisera alla kanda lankar
      const knownUrls = new Map(); // normalized url -> item
      for (const item of items) {
        const normalized = (item.link || '').replace(/\/$/, '').toLowerCase();
        knownUrls.set(normalized, item);
        incomingLinks[normalized] = 0;
      }

      for (const item of items) {
        const links = extractLinks(item.content, siteUrl);
        outgoingLinks[item.id] = {
          internal: links.internal.length,
          external: links.external.length,
        };

        // Rakna inkommande
        for (const href of links.internal) {
          let normalized;
          if (href.startsWith('/')) {
            normalized = (siteUrl + href).replace(/\/$/, '').toLowerCase();
          } else {
            normalized = href.replace(/\/$/, '').toLowerCase();
          }
          if (incomingLinks[normalized] !== undefined) {
            incomingLinks[normalized]++;
          }
        }
      }

      // Identifiera orphan pages (0 inkommande interna lankar)
      const orphans = [];
      const leastLinked = [];
      const mostLinked = [];
      const noOutgoing = [];

      for (const item of items) {
        const normalized = (item.link || '').replace(/\/$/, '').toLowerCase();
        const incoming = incomingLinks[normalized] || 0;
        const outgoing = outgoingLinks[item.id] || { internal: 0, external: 0 };

        const entry = {
          id: item.id,
          type: item.type,
          title: item.title,
          slug: item.slug,
          incoming_internal_links: incoming,
          outgoing_internal_links: outgoing.internal,
          outgoing_external_links: outgoing.external,
        };

        if (incoming === 0) orphans.push(entry);
        if (outgoing.internal === 0) noOutgoing.push(entry);
        leastLinked.push(entry);
        mostLinked.push(entry);
      }

      leastLinked.sort((a, b) => a.incoming_internal_links - b.incoming_internal_links);
      mostLinked.sort((a, b) => b.incoming_internal_links - a.incoming_internal_links);

      return text({
        site: s.slug,
        total_content: items.length,
        orphan_pages: orphans.length,
        pages_without_outgoing_links: noOutgoing.length,
        orphans: orphans.slice(0, 20),
        no_outgoing_links: noOutgoing.slice(0, 20),
        most_linked: mostLinked.slice(0, 10),
        least_linked: leastLinked.slice(0, 10),
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Suggest Links ---
  server.tool('perispa_suggest_links', 'Foreslaa internlankar baserat pa innehallsrelevans', {
    site: z.string().optional(),
    page_id: z.number().optional().describe('Specifik sida att foreslaa lankar for (annars alla)'),
    max_suggestions: z.number().optional().default(5).describe('Max antal forslag per sida'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const items = await fetchAllContent(wpFetch, s);

      // Forebered data per sida
      const prepared = items.map(item => {
        const plainText = stripTags(item.content);
        const first200 = plainText.split(/\s+/).slice(0, 200).join(' ');
        const keywords = extractKeywords(item.title + ' ' + first200);
        return { ...item, keywords, plainText: first200 };
      });

      const targets = args.page_id
        ? prepared.filter(p => p.id === args.page_id)
        : prepared;

      if (targets.length === 0) {
        return err(`Sida ${args.page_id} hittades inte`);
      }

      const suggestions = [];

      for (const target of targets) {
        // Hitta redan existerande interna lankar
        const existingLinks = extractLinks(target.content, s.url.replace(/\/$/, ''));
        const existingSet = new Set(existingLinks.internal.map(l => l.replace(/\/$/, '').toLowerCase()));

        // Rakna relevans mot alla andra sidor
        const scored = prepared
          .filter(p => p.id !== target.id)
          .map(candidate => {
            const score = overlapScore(target.keywords, candidate.keywords);
            const candidateUrl = (candidate.link || '').replace(/\/$/, '').toLowerCase();
            const alreadyLinked = existingSet.has(candidateUrl);
            return { candidate, score, alreadyLinked };
          })
          .filter(s => s.score > 0 && !s.alreadyLinked)
          .sort((a, b) => b.score - a.score)
          .slice(0, args.max_suggestions);

        if (scored.length > 0) {
          suggestions.push({
            page_id: target.id,
            title: target.title,
            slug: target.slug,
            suggestions: scored.map(s => ({
              target_id: s.candidate.id,
              target_title: s.candidate.title,
              target_url: s.candidate.link,
              relevance_score: s.score,
              suggested_anchor_text: s.candidate.title,
            })),
          });
        }
      }

      return text({
        site: s.slug,
        pages_analyzed: targets.length,
        pages_with_suggestions: suggestions.length,
        suggestions,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Auto Link ---
  server.tool('perispa_auto_link', 'Lagg till internlankar automatiskt i en sidas innehall', {
    site: z.string().optional(),
    page_id: z.number().describe('ID pa sidan att lanka fran'),
    type: z.string().optional().default('page').describe('page eller post'),
    dry_run: z.boolean().optional().default(true).describe('true = visa bara andringar, false = spara'),
    max_links: z.number().optional().default(5).describe('Max antal lankar att lagga till'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';

      // Hamta sidan
      const pageRes = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const page = pageRes.data;
      let content = page.content?.raw || page.content?.rendered || '';

      // Hamta alla andra sidor/inlagg
      const allItems = await fetchAllContent(wpFetch, s);
      const otherItems = allItems.filter(item => item.id !== args.page_id);

      // Sortera efter titellangd (langre titlar forst for battre matchning)
      otherItems.sort((a, b) => b.title.length - a.title.length);

      const addedLinks = [];
      let linksAdded = 0;

      for (const item of otherItems) {
        if (linksAdded >= args.max_links) break;
        if (!item.title || item.title.length < 3) continue;

        // Kontrollera att denna URL inte redan ar lankad i innehallet
        const itemUrl = (item.link || '').replace(/\/$/, '');
        if (content.toLowerCase().includes(itemUrl.toLowerCase())) continue;

        // Sok efter titeln i texten (case-insensitive, hela ord)
        const escapedTitle = item.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(?<![<][^>]*)(\\b${escapedTitle}\\b)(?![^<]*[>])`, 'i');
        const match = regex.exec(content);

        if (match) {
          const originalText = match[1];
          const link = `<a href="${item.link}" title="${item.title}">${originalText}</a>`;
          content = content.slice(0, match.index) + link + content.slice(match.index + originalText.length);

          addedLinks.push({
            anchor_text: originalText,
            target_url: item.link,
            target_title: item.title,
            target_id: item.id,
          });
          linksAdded++;
        }
      }

      if (addedLinks.length === 0) {
        return text({
          page_id: args.page_id,
          links_added: 0,
          message: 'Inga matchande omnamnanden hittades i texten',
        });
      }

      if (!args.dry_run) {
        await wpFetch(s, `${endpoint}/${args.page_id}`, {
          method: 'POST',
          body: { content },
        });
      }

      return text({
        page_id: args.page_id,
        dry_run: args.dry_run,
        links_added: addedLinks.length,
        added_links: addedLinks,
        message: args.dry_run
          ? 'Dry run — inga andringar sparade. Kor med dry_run=false for att spara.'
          : `${addedLinks.length} internlankar tillagda och sparade.`,
      });
    } catch (e) {
      return err(e.message);
    }
  });

};
