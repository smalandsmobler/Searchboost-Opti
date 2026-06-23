/**
 * perispa — Batch Fixer tools
 * fix_missing_meta, fix_missing_alt, fix_all_seo
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

function generateTitle(wpTitle, companyName) {
  const base = stripTags(wpTitle || '').trim();
  if (!base) return '';
  const full = `${base} | ${companyName}`;
  if (full.length <= 60) return full;
  // Korta ner basen
  const maxBase = 60 - ` | ${companyName}`.length;
  if (maxBase > 10) return base.slice(0, maxBase).trim() + ` | ${companyName}`;
  return base.slice(0, 57).trim() + '...';
}

function generateDescription(content) {
  const plain = stripTags(content || '').trim();
  if (!plain) return '';
  // Ta forsta meningen
  const sentenceMatch = plain.match(/^[^.!?]+[.!?]/);
  let desc = sentenceMatch ? sentenceMatch[0].trim() : plain;
  if (desc.length > 155) {
    desc = desc.slice(0, 152).trim() + '...';
  }
  return desc;
}

function generateFocusKeyword(title) {
  const plain = stripTags(title || '').trim();
  if (!plain) return '';
  const words = plain.split(/\s+/).filter(w => w.length > 2);
  return words.slice(0, 3).join(' ').toLowerCase();
}

function filenameToAlt(src) {
  if (!src) return '';
  // Extrahera filnamn utan extension
  const filename = src.split('/').pop().split('?')[0];
  const name = filename.replace(/\.[^.]+$/, '');
  // Ersatt bindestreck/understreck med mellanrum, capitalize forsta
  const cleaned = name.replace(/[-_]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

async function fetchAllItems(wpFetch, site, endpoint) {
  const items = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const res = await wpFetch(site, endpoint, {
      params: { per_page: 100, page, context: 'edit', status: 'publish' },
    });
    if (res.data && Array.isArray(res.data)) {
      items.push(...res.data);
    }
    if (page === 1 && res.totalPages) {
      totalPages = res.totalPages;
    } else if (page === 1 && res.headers && res.headers['x-wp-totalpages']) {
      totalPages = parseInt(res.headers['x-wp-totalpages'], 10);
    }
    if (!res.data || res.data.length < 100) break;
    page++;
  }

  return items;
}

module.exports = function registerBatchFixerTools(server, getSite, wpFetch) {

  // --- Fix missing meta ---
  server.tool('perispa_fix_missing_meta', 'Hitta sidor utan SEO-titel/description och generera + skriv optimerade metadata via Rank Math', {
    site: z.string().optional(),
    dry_run: z.boolean().optional().default(true).describe('true = visa vad som andras utan att skriva'),
    max_pages: z.number().optional().default(20).describe('Max antal sidor att fixa'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const companyName = s.company_name || s.slug;

      // Hamta bade pages och posts
      let allItems = [];
      try {
        const pages = await fetchAllItems(wpFetch, s, 'wp/v2/pages');
        allItems.push(...pages.map(p => ({ ...p, _type: 'page' })));
      } catch { /* skip */ }
      try {
        const posts = await fetchAllItems(wpFetch, s, 'wp/v2/posts');
        allItems.push(...posts.map(p => ({ ...p, _type: 'post' })));
      } catch { /* skip */ }

      // Filtrera: saknar titel ELLER description
      const needsFix = allItems.filter(p => {
        const meta = p.meta || {};
        const hasTitle = !!(meta.rank_math_title && meta.rank_math_title.trim());
        const hasDesc = !!(meta.rank_math_description && meta.rank_math_description.trim());
        return !hasTitle || !hasDesc;
      });

      const toFix = needsFix.slice(0, args.max_pages);
      const changes = [];
      const errors = [];

      for (const p of toFix) {
        const meta = p.meta || {};
        const hasTitle = !!(meta.rank_math_title && meta.rank_math_title.trim());
        const hasDesc = !!(meta.rank_math_description && meta.rank_math_description.trim());
        const hasKw = !!(meta.rank_math_focus_keyword && meta.rank_math_focus_keyword.trim());

        const wpTitle = p.title?.raw || p.title?.rendered || '';
        const content = p.content?.raw || p.content?.rendered || '';

        const newMeta = {};
        const changeDetail = { id: p.id, slug: p.slug, title: stripTags(wpTitle), changes: [] };

        if (!hasTitle) {
          const generated = generateTitle(wpTitle, companyName);
          if (generated) {
            newMeta.rank_math_title = generated;
            changeDetail.changes.push({ field: 'rank_math_title', from: '', to: generated });
          }
        }

        if (!hasDesc) {
          const generated = generateDescription(content);
          if (generated) {
            newMeta.rank_math_description = generated;
            changeDetail.changes.push({ field: 'rank_math_description', from: '', to: generated });
          }
        }

        if (!hasKw) {
          const generated = generateFocusKeyword(wpTitle);
          if (generated) {
            newMeta.rank_math_focus_keyword = generated;
            changeDetail.changes.push({ field: 'rank_math_focus_keyword', from: '', to: generated });
          }
        }

        if (changeDetail.changes.length === 0) continue;

        if (!args.dry_run) {
          try {
            await wpFetch(s, 'rankmath/v1/updateMeta', {
              method: 'POST',
              body: {
                objectID: p.id,
                objectType: 'post',
                meta: newMeta,
              },
            });
            changeDetail.status = 'applied';
          } catch (e) {
            changeDetail.status = 'error';
            changeDetail.error = e.message;
            errors.push({ id: p.id, slug: p.slug, error: e.message });
          }
        } else {
          changeDetail.status = 'dry_run';
        }

        changes.push(changeDetail);
      }

      return text({
        site: s.slug,
        dry_run: args.dry_run,
        total_pages_scanned: allItems.length,
        pages_needing_fix: needsFix.length,
        pages_processed: changes.length,
        changes,
        errors: errors.length > 0 ? errors : undefined,
        note: args.dry_run ? 'Kor med dry_run=false for att applicera andringarna' : undefined,
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Fix missing alt ---
  server.tool('perispa_fix_missing_alt', 'Hitta bilder utan alt-text pa en sida och satt alt baserat pa filnamn', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page').describe('page eller post'),
    dry_run: z.boolean().optional().default(true),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const p = res.data;
      let content = p.content?.raw || p.content?.rendered || '';

      const imgRegex = /<img[^>]*>/gi;
      const fixes = [];
      let match;
      let newContent = content;

      while ((match = imgRegex.exec(content)) !== null) {
        const tag = match[0];
        const alt = tag.match(/alt="([^"]*?)"/i);
        const src = tag.match(/src="([^"]+)"/i)?.[1] || '';

        // Saknar alt helt, eller har tom alt
        if (!alt || alt[1] === '') {
          const generatedAlt = filenameToAlt(src);
          if (!generatedAlt) continue;

          let newTag;
          if (alt) {
            // Har alt="" — ersatt varden
            newTag = tag.replace(/alt=""/i, `alt="${generatedAlt}"`);
          } else {
            // Saknar alt helt — lagg till
            newTag = tag.replace(/<img/i, `<img alt="${generatedAlt}"`);
          }

          fixes.push({
            src: src.slice(0, 150),
            old_alt: '',
            new_alt: generatedAlt,
          });

          newContent = newContent.replace(tag, newTag);
        }
      }

      if (fixes.length === 0) {
        return text({
          site: s.slug,
          page_id: args.page_id,
          message: 'Alla bilder har redan alt-text',
          fixes_needed: 0,
        });
      }

      if (!args.dry_run && newContent !== content) {
        try {
          await wpFetch(s, `${endpoint}/${args.page_id}`, {
            method: 'POST',
            body: { content: newContent },
          });
        } catch (e) {
          return err(`Kunde inte uppdatera sidan: ${e.message}`);
        }
      }

      return text({
        site: s.slug,
        page_id: args.page_id,
        dry_run: args.dry_run,
        fixes_needed: fixes.length,
        fixes,
        note: args.dry_run ? 'Kor med dry_run=false for att applicera andringarna' : 'Andringar applicerade',
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Fix all SEO (kombination) ---
  server.tool('perispa_fix_all_seo', 'Korkombination: fix_missing_meta + fix_missing_alt pa hela siten', {
    site: z.string().optional(),
    dry_run: z.boolean().optional().default(true),
    max_pages: z.number().optional().default(20),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const companyName = s.company_name || s.slug;

      // Hamta alla items
      let allItems = [];
      try {
        const pages = await fetchAllItems(wpFetch, s, 'wp/v2/pages');
        allItems.push(...pages.map(p => ({ ...p, _type: 'page' })));
      } catch { /* skip */ }
      try {
        const posts = await fetchAllItems(wpFetch, s, 'wp/v2/posts');
        allItems.push(...posts.map(p => ({ ...p, _type: 'post' })));
      } catch { /* skip */ }

      const metaFixes = [];
      const altFixes = [];
      const errors = [];
      let processed = 0;

      for (const p of allItems) {
        if (processed >= args.max_pages) break;

        const meta = p.meta || {};
        const wpTitle = p.title?.raw || p.title?.rendered || '';
        const content = p.content?.raw || p.content?.rendered || '';
        let hasChanges = false;

        // --- Meta-fix ---
        const hasTitle = !!(meta.rank_math_title && meta.rank_math_title.trim());
        const hasDesc = !!(meta.rank_math_description && meta.rank_math_description.trim());
        const hasKw = !!(meta.rank_math_focus_keyword && meta.rank_math_focus_keyword.trim());

        if (!hasTitle || !hasDesc || !hasKw) {
          const newMeta = {};
          const changes = [];

          if (!hasTitle) {
            const gen = generateTitle(wpTitle, companyName);
            if (gen) { newMeta.rank_math_title = gen; changes.push({ field: 'title', to: gen }); }
          }
          if (!hasDesc) {
            const gen = generateDescription(content);
            if (gen) { newMeta.rank_math_description = gen; changes.push({ field: 'description', to: gen }); }
          }
          if (!hasKw) {
            const gen = generateFocusKeyword(wpTitle);
            if (gen) { newMeta.rank_math_focus_keyword = gen; changes.push({ field: 'focus_keyword', to: gen }); }
          }

          if (changes.length > 0) {
            const fix = { id: p.id, slug: p.slug, changes, status: args.dry_run ? 'dry_run' : 'pending' };

            if (!args.dry_run) {
              try {
                await wpFetch(s, 'rankmath/v1/updateMeta', {
                  method: 'POST',
                  body: { objectID: p.id, objectType: 'post', meta: newMeta },
                });
                fix.status = 'applied';
              } catch (e) {
                fix.status = 'error';
                fix.error = e.message;
                errors.push({ id: p.id, type: 'meta', error: e.message });
              }
            }

            metaFixes.push(fix);
            hasChanges = true;
          }
        }

        // --- Alt-fix ---
        const imgRegex = /<img[^>]*>/gi;
        let match;
        const pageAltFixes = [];
        let newContent = content;

        while ((match = imgRegex.exec(content)) !== null) {
          const tag = match[0];
          const alt = tag.match(/alt="([^"]*?)"/i);
          const src = tag.match(/src="([^"]+)"/i)?.[1] || '';

          if (!alt || alt[1] === '') {
            const generatedAlt = filenameToAlt(src);
            if (!generatedAlt) continue;

            let newTag;
            if (alt) {
              newTag = tag.replace(/alt=""/i, `alt="${generatedAlt}"`);
            } else {
              newTag = tag.replace(/<img/i, `<img alt="${generatedAlt}"`);
            }

            pageAltFixes.push({ src: src.slice(0, 100), new_alt: generatedAlt });
            newContent = newContent.replace(tag, newTag);
          }
        }

        if (pageAltFixes.length > 0) {
          const fix = { id: p.id, slug: p.slug, images_fixed: pageAltFixes.length, fixes: pageAltFixes, status: args.dry_run ? 'dry_run' : 'pending' };

          if (!args.dry_run && newContent !== content) {
            const endpoint = p._type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
            try {
              await wpFetch(s, `${endpoint}/${p.id}`, {
                method: 'POST',
                body: { content: newContent },
              });
              fix.status = 'applied';
            } catch (e) {
              fix.status = 'error';
              fix.error = e.message;
              errors.push({ id: p.id, type: 'alt', error: e.message });
            }
          }

          altFixes.push(fix);
          hasChanges = true;
        }

        if (hasChanges) processed++;
      }

      return text({
        site: s.slug,
        dry_run: args.dry_run,
        total_pages_scanned: allItems.length,
        pages_with_changes: processed,
        meta_fixes: { count: metaFixes.length, details: metaFixes },
        alt_fixes: { count: altFixes.length, details: altFixes },
        errors: errors.length > 0 ? errors : undefined,
        note: args.dry_run ? 'Kor med dry_run=false for att applicera andringarna' : undefined,
      });
    } catch (e) {
      return err(e.message);
    }
  });
};
