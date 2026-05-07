/**
 * perispa — Duplicate & bulk operations
 * Duplicate pages/posts, bulk operations
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerDuplicateTools(server, getSite, wpFetch) {

  server.tool('perispa_create_page_duplicate', 'Duplicera en sida (kopierar titel, innehall, meta)', {
    site: z.string().optional(),
    id: z.number().describe('Sidans ID att duplicera'),
    new_title: z.string().optional().describe('Ny titel (default: "Kopia av [original]")'),
    status: z.string().optional().default('draft'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/pages/${args.id}`, { params: { context: 'edit' } });
      const original = res.data;

      const body = {
        title: args.new_title || `Kopia av ${original.title?.raw || original.title?.rendered || ''}`,
        content: original.content?.raw || original.content?.rendered || '',
        excerpt: original.excerpt?.raw || original.excerpt?.rendered || '',
        status: args.status,
        parent: original.parent || 0,
        template: original.template || '',
      };
      if (original.meta) body.meta = original.meta;

      const newPage = await wpFetch(s, 'wp/v2/pages', { method: 'POST', body });
      return text({
        duplicated: true,
        original_id: args.id,
        new_id: newPage.data.id,
        title: newPage.data.title?.rendered,
        status: newPage.data.status,
        link: newPage.data.link,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_create_post_duplicate', 'Duplicera ett inlagg (kopierar titel, innehall, meta, kategorier)', {
    site: z.string().optional(),
    id: z.number().describe('Inlaggets ID att duplicera'),
    new_title: z.string().optional(),
    status: z.string().optional().default('draft'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/posts/${args.id}`, { params: { context: 'edit' } });
      const original = res.data;

      const body = {
        title: args.new_title || `Kopia av ${original.title?.raw || original.title?.rendered || ''}`,
        content: original.content?.raw || original.content?.rendered || '',
        excerpt: original.excerpt?.raw || original.excerpt?.rendered || '',
        status: args.status,
        categories: original.categories || [],
        tags: original.tags || [],
      };
      if (original.meta) body.meta = original.meta;
      if (original.featured_media) body.featured_media = original.featured_media;

      const newPost = await wpFetch(s, 'wp/v2/posts', { method: 'POST', body });
      return text({
        duplicated: true,
        original_id: args.id,
        new_id: newPost.data.id,
        title: newPost.data.title?.rendered,
        status: newPost.data.status,
        link: newPost.data.link,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_bulk_pages_operation', 'Koroperationer pa flera sidor (status, ta bort, flytta)', {
    site: z.string().optional(),
    page_ids: z.array(z.number()).describe('Lista med sid-ID:n'),
    operation: z.string().describe('Vad som ska goras: publish, draft, trash, delete, set_parent'),
    parent: z.number().optional().describe('Foraldra-ID (for set_parent)'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const results = [];

      for (const id of args.page_ids) {
        try {
          if (args.operation === 'delete') {
            await wpFetch(s, `wp/v2/pages/${id}`, { method: 'DELETE', params: { force: true } });
            results.push({ id, success: true, operation: 'deleted' });
          } else if (args.operation === 'trash') {
            await wpFetch(s, `wp/v2/pages/${id}`, { method: 'DELETE' });
            results.push({ id, success: true, operation: 'trashed' });
          } else if (args.operation === 'set_parent') {
            await wpFetch(s, `wp/v2/pages/${id}`, { method: 'POST', body: { parent: args.parent || 0 } });
            results.push({ id, success: true, operation: 'parent_set', parent: args.parent });
          } else {
            // publish, draft, private, pending
            await wpFetch(s, `wp/v2/pages/${id}`, { method: 'POST', body: { status: args.operation } });
            results.push({ id, success: true, operation: args.operation });
          }
        } catch (e) {
          results.push({ id, success: false, error: e.message });
        }
      }

      return text({
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        results,
      });
    } catch (e) { return err(e.message); }
  });
};
