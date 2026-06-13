/**
 * perispa — Comment management tools
 * list, get, create, update, delete comments
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerCommentTools(server, getSite, wpFetch) {

  server.tool('perispa_list_comments', 'Lista WordPress-kommentarer', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20),
    page: z.number().optional().default(1),
    post: z.number().optional().describe('Filtrera pa post/page ID'),
    status: z.string().optional().default('approve').describe('approve, hold, spam, trash'),
    search: z.string().optional(),
    orderby: z.string().optional().default('date_gmt'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { per_page: Math.min(args.per_page, 100), page: args.page, orderby: args.orderby, order: 'desc' };
      if (args.post) params.post = args.post;
      if (args.status) params.status = args.status;
      if (args.search) params.search = args.search;

      const res = await wpFetch(s, 'wp/v2/comments', { params });
      return text({
        total: res.total,
        comments: res.data.map(c => ({
          id: c.id,
          post: c.post,
          parent: c.parent,
          author_name: c.author_name,
          author_email: c.author_email || '',
          date: c.date,
          status: c.status,
          content: (c.content?.rendered || '').replace(/<[^>]+>/g, '').slice(0, 300),
        })),
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_comment', 'Hamta en specifik kommentar', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/comments/${args.id}`, { params: { context: 'edit' } });
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_create_comment', 'Skapa en ny kommentar', {
    site: z.string().optional(),
    post: z.number().describe('Post/Page ID'),
    content: z.string().describe('Kommentarens innehall'),
    author_name: z.string().optional(),
    author_email: z.string().optional(),
    parent: z.number().optional().default(0).describe('Foraldra-kommentar ID (for svar)'),
    status: z.string().optional().default('approve'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { post: args.post, content: args.content, status: args.status };
      if (args.author_name) body.author_name = args.author_name;
      if (args.author_email) body.author_email = args.author_email;
      if (args.parent) body.parent = args.parent;

      const res = await wpFetch(s, 'wp/v2/comments', { method: 'POST', body });
      return text({ created: true, id: res.data.id, status: res.data.status });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_comment', 'Uppdatera en kommentar', {
    site: z.string().optional(),
    id: z.number(),
    content: z.string().optional(),
    status: z.string().optional().describe('approve, hold, spam, trash'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.content !== undefined) body.content = args.content;
      if (args.status !== undefined) body.status = args.status;

      const res = await wpFetch(s, `wp/v2/comments/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, status: res.data.status });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_comment', 'Ta bort en kommentar', {
    site: z.string().optional(),
    id: z.number(),
    force: z.boolean().optional().default(false),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {};
      if (args.force) params.force = true;
      const res = await wpFetch(s, `wp/v2/comments/${args.id}`, { method: 'DELETE', params });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });
};
