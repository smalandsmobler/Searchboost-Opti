/**
 * perispa — Custom Post Type tools
 * list types, CRUD for custom posts
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerCustomPostTools(server, getSite, wpFetch) {

  server.tool('perispa_list_post_types', 'Lista alla registrerade post-typer (pages, posts, custom)', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wp/v2/types');
      const types = Object.values(res.data).map(t => ({
        slug: t.slug,
        name: t.name,
        description: t.description || '',
        rest_base: t.rest_base,
        hierarchical: t.hierarchical,
        has_archive: t.has_archive,
      }));
      return text({ total: types.length, types });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_post_type', 'Hamta detaljer om en specifik post-typ', {
    site: z.string().optional(),
    type: z.string().describe('Post-typ slug (t.ex. "product", "portfolio")'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/types/${args.type}`);
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_list_custom_posts', 'Lista custom posts av en viss typ', {
    site: z.string().optional(),
    post_type: z.string().describe('REST base for post-typen (t.ex. "portfolio", "testimonials")'),
    per_page: z.number().optional().default(20),
    page: z.number().optional().default(1),
    status: z.string().optional().default('publish'),
    search: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {
        per_page: Math.min(args.per_page, 100),
        page: args.page,
        status: args.status,
      };
      if (args.search) params.search = args.search;

      const res = await wpFetch(s, `wp/v2/${args.post_type}`, { params });
      return text({
        total: res.total,
        posts: res.data.map(p => ({
          id: p.id,
          title: p.title?.rendered || '',
          slug: p.slug,
          status: p.status,
          link: p.link,
          date: p.date,
          modified: p.modified,
        })),
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_custom_post', 'Hamta en custom post med allt innehall', {
    site: z.string().optional(),
    post_type: z.string().describe('REST base'),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/${args.post_type}/${args.id}`, { params: { context: 'edit' } });
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_create_custom_post', 'Skapa en ny custom post', {
    site: z.string().optional(),
    post_type: z.string().describe('REST base for post-typen (t.ex. "portfolio", "testimonials")'),
    title: z.string(),
    content: z.string().optional().default(''),
    status: z.string().optional().default('draft').describe('publish, draft, private, pending'),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    author: z.number().optional().describe('Author user ID'),
    featured_media: z.number().optional().describe('Featured image media ID'),
    categories: z.array(z.number()).optional().describe('Kategori-IDs (om post-typen stöder det)'),
    tags: z.array(z.number()).optional().describe('Tagg-IDs (om post-typen stöder det)'),
    meta: z.record(z.string(), z.any()).optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { title: args.title, content: args.content, status: args.status };
      if (args.slug) body.slug = args.slug;
      if (args.excerpt) body.excerpt = args.excerpt;
      if (args.author) body.author = args.author;
      if (args.featured_media) body.featured_media = args.featured_media;
      if (args.categories?.length) body.categories = args.categories;
      if (args.tags?.length) body.tags = args.tags;
      if (args.meta) body.meta = args.meta;

      const res = await wpFetch(s, `wp/v2/${args.post_type}`, { method: 'POST', body });
      return text({ created: true, id: res.data.id, title: res.data.title?.rendered, link: res.data.link });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_custom_post', 'Uppdatera en custom post', {
    site: z.string().optional(),
    post_type: z.string().describe('REST base for post-typen (t.ex. "portfolio", "testimonials")'),
    id: z.number(),
    title: z.string().optional(),
    content: z.string().optional(),
    status: z.string().optional().describe('publish, draft, private, pending'),
    slug: z.string().optional(),
    excerpt: z.string().optional(),
    author: z.number().optional().describe('Author user ID'),
    featured_media: z.number().optional().describe('Featured image media ID'),
    categories: z.array(z.number()).optional().describe('Kategori-IDs (om post-typen stöder det)'),
    tags: z.array(z.number()).optional().describe('Tagg-IDs (om post-typen stöder det)'),
    meta: z.record(z.string(), z.any()).optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.title !== undefined) body.title = args.title;
      if (args.content !== undefined) body.content = args.content;
      if (args.status !== undefined) body.status = args.status;
      if (args.slug !== undefined) body.slug = args.slug;
      if (args.excerpt !== undefined) body.excerpt = args.excerpt;
      if (args.author !== undefined) body.author = args.author;
      if (args.featured_media !== undefined) body.featured_media = args.featured_media;
      if (args.categories !== undefined) body.categories = args.categories;
      if (args.tags !== undefined) body.tags = args.tags;
      if (args.meta !== undefined) body.meta = args.meta;

      const res = await wpFetch(s, `wp/v2/${args.post_type}/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, title: res.data.title?.rendered });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_custom_post', 'Ta bort en custom post', {
    site: z.string().optional(),
    post_type: z.string().describe('REST base'),
    id: z.number(),
    force: z.boolean().optional().default(false),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {};
      if (args.force) params.force = true;
      await wpFetch(s, `wp/v2/${args.post_type}/${args.id}`, { method: 'DELETE', params });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });
};
