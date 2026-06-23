/**
 * perispa — Core CRUD tools
 * list/read/update/delete for pages, posts, media, plugins, users
 *
 * Komplement till befintliga tool-filer som saknar list-funktioner.
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerCrudTools(server, getSite, wpFetch) {

  // ─── PAGES ───────────────────────────────────────────────────

  server.tool('perispa_list_pages', 'Lista WordPress-sidor med pagination och filtrering', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20).describe('Antal per sida (max 100)'),
    page: z.number().optional().default(1),
    search: z.string().optional().describe('Fritext-sok i titel och innehall'),
    status: z.string().optional().default('publish').describe('publish, draft, private, trash, any'),
    orderby: z.string().optional().default('date').describe('date, title, modified, menu_order'),
    order: z.string().optional().default('desc').describe('asc eller desc'),
    parent: z.number().optional().describe('Filtrera pa foraldrasida ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {
        per_page: Math.min(args.per_page || 20, 100),
        page: args.page || 1,
        status: args.status || 'publish',
        orderby: args.orderby || 'date',
        order: args.order || 'desc',
        context: 'edit',
      };
      if (args.search) params.search = args.search;
      if (args.parent !== undefined) params.parent = args.parent;

      const res = await wpFetch(s, 'wp/v2/pages', { params });
      const pages = res.data.map(p => ({
        id: p.id,
        title: p.title?.rendered || p.title?.raw || '',
        slug: p.slug,
        status: p.status,
        link: p.link,
        modified: p.modified,
        parent: p.parent,
        menu_order: p.menu_order,
      }));
      return text({ total: res.total, total_pages: res.totalPages, page: params.page, pages });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_read_page', 'Las en WordPress-sida med allt innehall och meta', {
    site: z.string().optional(),
    id: z.number().describe('Sida-ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/pages/${args.id}`, { params: { context: 'edit' } });
      const p = res.data;
      return text({
        id: p.id,
        title: p.title?.raw || '',
        content: p.content?.raw || '',
        excerpt: p.excerpt?.raw || '',
        slug: p.slug,
        status: p.status,
        link: p.link,
        template: p.template,
        parent: p.parent,
        menu_order: p.menu_order,
        featured_media: p.featured_media,
        date: p.date,
        modified: p.modified,
        meta: p.meta || {},
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_page', 'Uppdatera en WordPress-sida (titel, innehall, status, meta m.m.)', {
    site: z.string().optional(),
    id: z.number().describe('Sida-ID'),
    title: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    slug: z.string().optional(),
    status: z.string().optional().describe('publish, draft, private'),
    template: z.string().optional(),
    parent: z.number().optional(),
    menu_order: z.number().optional(),
    featured_media: z.number().optional(),
    meta: z.record(z.any()).optional().describe('Meta-faltvarden att uppdatera'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      const fields = ['title', 'content', 'excerpt', 'slug', 'status', 'template', 'parent', 'menu_order', 'featured_media', 'meta'];
      for (const f of fields) {
        if (args[f] !== undefined) body[f] = args[f];
      }
      const res = await wpFetch(s, `wp/v2/pages/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, title: res.data.title?.rendered, slug: res.data.slug, status: res.data.status, link: res.data.link });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_page', 'Ta bort en WordPress-sida', {
    site: z.string().optional(),
    id: z.number().describe('Sida-ID'),
    force: z.boolean().optional().default(false).describe('true = permanent, false = flytta till papperskorg'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wp/v2/pages/${args.id}`, { method: 'DELETE', params: { force: args.force ?? false } });
      return text({ deleted: true, id: args.id, permanent: args.force ?? false });
    } catch (e) { return err(e.message); }
  });

  // ─── POSTS ───────────────────────────────────────────────────

  server.tool('perispa_list_posts', 'Lista WordPress-inlagg med pagination och filtrering', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20).describe('Antal per sida (max 100)'),
    page: z.number().optional().default(1),
    search: z.string().optional().describe('Fritext-sok i titel och innehall'),
    status: z.string().optional().default('publish').describe('publish, draft, private, trash, any'),
    categories: z.array(z.number()).optional().describe('Filtrera pa kategori-ID:n'),
    tags: z.array(z.number()).optional().describe('Filtrera pa tagg-ID:n'),
    author: z.number().optional().describe('Filtrera pa forfatter-ID'),
    orderby: z.string().optional().default('date').describe('date, title, modified, relevance'),
    order: z.string().optional().default('desc').describe('asc eller desc'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {
        per_page: Math.min(args.per_page || 20, 100),
        page: args.page || 1,
        status: args.status || 'publish',
        orderby: args.orderby || 'date',
        order: args.order || 'desc',
        context: 'edit',
      };
      if (args.search) params.search = args.search;
      if (args.categories?.length) params.categories = args.categories.join(',');
      if (args.tags?.length) params.tags = args.tags.join(',');
      if (args.author) params.author = args.author;

      const res = await wpFetch(s, 'wp/v2/posts', { params });
      const posts = res.data.map(p => ({
        id: p.id,
        title: p.title?.rendered || p.title?.raw || '',
        slug: p.slug,
        status: p.status,
        date: p.date,
        modified: p.modified,
        link: p.link,
        author: p.author,
        categories: p.categories,
        tags: p.tags,
      }));
      return text({ total: res.total, total_pages: res.totalPages, page: params.page, posts });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_read_post', 'Las ett WordPress-inlagg med allt innehall och meta', {
    site: z.string().optional(),
    id: z.number().describe('Inlagg-ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/posts/${args.id}`, { params: { context: 'edit' } });
      const p = res.data;
      return text({
        id: p.id,
        title: p.title?.raw || '',
        content: p.content?.raw || '',
        excerpt: p.excerpt?.raw || '',
        slug: p.slug,
        status: p.status,
        link: p.link,
        date: p.date,
        modified: p.modified,
        author: p.author,
        featured_media: p.featured_media,
        categories: p.categories,
        tags: p.tags,
        template: p.template,
        format: p.format,
        meta: p.meta || {},
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_post', 'Uppdatera ett WordPress-inlagg (titel, innehall, status, meta m.m.)', {
    site: z.string().optional(),
    id: z.number().describe('Inlagg-ID'),
    title: z.string().optional(),
    content: z.string().optional(),
    excerpt: z.string().optional(),
    slug: z.string().optional(),
    status: z.string().optional().describe('publish, draft, private, pending'),
    categories: z.array(z.number()).optional(),
    tags: z.array(z.number()).optional(),
    featured_media: z.number().optional(),
    author: z.number().optional(),
    date: z.string().optional().describe('ISO 8601-datum for publicering'),
    meta: z.record(z.any()).optional().describe('Meta-faltvarden att uppdatera'),
    format: z.string().optional().describe('standard, aside, chat, gallery, link, image, quote, status, video, audio'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      const fields = ['title', 'content', 'excerpt', 'slug', 'status', 'categories', 'tags', 'featured_media', 'author', 'date', 'meta', 'format'];
      for (const f of fields) {
        if (args[f] !== undefined) body[f] = args[f];
      }
      const res = await wpFetch(s, `wp/v2/posts/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, title: res.data.title?.rendered, slug: res.data.slug, status: res.data.status, link: res.data.link });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_post', 'Ta bort ett WordPress-inlagg', {
    site: z.string().optional(),
    id: z.number().describe('Inlagg-ID'),
    force: z.boolean().optional().default(false).describe('true = permanent, false = flytta till papperskorg'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wp/v2/posts/${args.id}`, { method: 'DELETE', params: { force: args.force ?? false } });
      return text({ deleted: true, id: args.id, permanent: args.force ?? false });
    } catch (e) { return err(e.message); }
  });

  // ─── MEDIA ───────────────────────────────────────────────────

  server.tool('perispa_list_media', 'Lista media-biblioteket med filtrering', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20).describe('Antal per sida (max 100)'),
    page: z.number().optional().default(1),
    search: z.string().optional().describe('Fritext-sok i titel och beskrivning'),
    media_type: z.string().optional().describe('image, video, audio, application, text'),
    mime_type: z.string().optional().describe('t.ex. image/jpeg, image/png, video/mp4'),
    parent: z.number().optional().describe('Filtrera pa foralder-post ID'),
    orderby: z.string().optional().default('date').describe('date, title, modified'),
    order: z.string().optional().default('desc'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {
        per_page: Math.min(args.per_page || 20, 100),
        page: args.page || 1,
        orderby: args.orderby || 'date',
        order: args.order || 'desc',
        context: 'edit',
      };
      if (args.search) params.search = args.search;
      if (args.media_type) params.media_type = args.media_type;
      if (args.mime_type) params.mime_type = args.mime_type;
      if (args.parent !== undefined) params.parent = args.parent;

      const res = await wpFetch(s, 'wp/v2/media', { params });
      const items = res.data.map(m => ({
        id: m.id,
        title: m.title?.rendered || '',
        alt_text: m.alt_text || '',
        url: m.source_url,
        mime_type: m.mime_type,
        width: m.media_details?.width,
        height: m.media_details?.height,
        filesize: m.media_details?.filesize,
        date: m.date,
        post: m.post,
      }));
      return text({ total: res.total, total_pages: res.totalPages, page: params.page, items });
    } catch (e) { return err(e.message); }
  });

  // ─── PLUGINS (list) ──────────────────────────────────────────

  server.tool('perispa_list_plugins', 'Lista alla installerade WordPress-plugins', {
    site: z.string().optional(),
    status: z.string().optional().describe('active, inactive (utelatt = alla)'),
    search: z.string().optional().describe('Fritext-sok i pluginnamn'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = { context: 'edit' };
      if (args.status) params.status = args.status;
      if (args.search) params.search = args.search;

      const res = await wpFetch(s, 'wp/v2/plugins', { params });
      const plugins = res.data.map(p => ({
        plugin: p.plugin,
        name: p.name,
        status: p.status,
        version: p.version,
        author: p.author_header || p.author,
        description: (p.description?.raw || '').slice(0, 120),
        network_only: p.network_only,
        requires_wp: p.requires_wp,
        requires_php: p.requires_php,
        auto_update: p.auto_update,
      }));
      return text({ count: plugins.length, plugins });
    } catch (e) { return err(e.message); }
  });

  // ─── USERS (list) ────────────────────────────────────────────

  server.tool('perispa_list_users', 'Lista WordPress-anvandare', {
    site: z.string().optional(),
    per_page: z.number().optional().default(20).describe('Antal per sida (max 100)'),
    page: z.number().optional().default(1),
    search: z.string().optional().describe('Fritext-sok i namn och e-post'),
    roles: z.array(z.string()).optional().describe('Filtrera pa roller: administrator, editor, author, contributor, subscriber'),
    orderby: z.string().optional().default('registered_date').describe('registered_date, name, email, id'),
    order: z.string().optional().default('desc'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {
        per_page: Math.min(args.per_page || 20, 100),
        page: args.page || 1,
        orderby: args.orderby || 'registered_date',
        order: args.order || 'desc',
        context: 'edit',
      };
      if (args.search) params.search = args.search;
      if (args.roles?.length) params.roles = args.roles.join(',');

      const res = await wpFetch(s, 'wp/v2/users', { params });
      const users = res.data.map(u => ({
        id: u.id,
        username: u.username,
        name: u.name,
        email: u.email,
        roles: u.roles,
        registered_date: u.registered_date,
        url: u.url,
      }));
      return text({ total: res.total, total_pages: res.totalPages, page: params.page, users });
    } catch (e) { return err(e.message); }
  });
};
