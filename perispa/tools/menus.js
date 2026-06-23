/**
 * perispa — Full menu management tools
 * CRUD for menus, menu items, locations
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerMenuTools(server, getSite, wpFetch) {

  // --- Menu CRUD ---
  server.tool('perispa_get_menu', 'Hamta en meny med alla detaljer', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      // Prova navigation (WP 5.9+) forst
      try {
        const res = await wpFetch(s, `wp/v2/navigation/${args.id}`, { params: { context: 'edit' } });
        return text(res.data);
      } catch {
        const res = await wpFetch(s, `wp/v2/menus/${args.id}`);
        return text(res.data);
      }
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_create_menu', 'Skapa en ny meny', {
    site: z.string().optional(),
    name: z.string().describe('Menynamn'),
    slug: z.string().optional(),
    description: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      // WP 5.9+ navigation
      try {
        const body = { title: args.name, status: 'publish', content: '' };
        if (args.slug) body.slug = args.slug;
        const res = await wpFetch(s, 'wp/v2/navigation', { method: 'POST', body });
        return text({ created: true, id: res.data.id, title: res.data.title?.rendered });
      } catch {
        const body = { name: args.name };
        if (args.slug) body.slug = args.slug;
        if (args.description) body.description = args.description;
        const res = await wpFetch(s, 'wp/v2/menus', { method: 'POST', body });
        return text({ created: true, id: res.data.id, name: res.data.name });
      }
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_menu', 'Uppdatera en meny', {
    site: z.string().optional(),
    id: z.number(),
    name: z.string().optional(),
    description: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.name) body.name = args.name;
      if (args.description) body.description = args.description;

      try {
        body.title = args.name;
        const res = await wpFetch(s, `wp/v2/navigation/${args.id}`, { method: 'POST', body });
        return text({ updated: true, id: res.data.id });
      } catch {
        const res = await wpFetch(s, `wp/v2/menus/${args.id}`, { method: 'POST', body });
        return text({ updated: true, id: res.data.id, name: res.data.name });
      }
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_menu', 'Ta bort en meny', {
    site: z.string().optional(),
    id: z.number(),
    force: z.boolean().optional().default(false),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {};
      if (args.force) params.force = true;
      try {
        await wpFetch(s, `wp/v2/navigation/${args.id}`, { method: 'DELETE', params });
      } catch {
        await wpFetch(s, `wp/v2/menus/${args.id}`, { method: 'DELETE', params });
      }
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });

  // --- Menu items ---
  server.tool('perispa_list_menu_items', 'Lista menyobjekt i en meny', {
    site: z.string().optional(),
    menu_id: z.number().describe('Meny-ID'),
    per_page: z.number().optional().default(100),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wp/v2/menu-items', {
        params: { menus: args.menu_id, per_page: args.per_page, context: 'edit' },
      });
      return text({
        total: res.total,
        items: res.data.map(i => ({
          id: i.id,
          title: i.title?.rendered || '',
          url: i.url,
          menu_order: i.menu_order,
          parent: i.parent,
          object: i.object,
          object_id: i.object_id,
          type: i.type,
        })),
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_menu_item', 'Hamta ett specifikt menyobjekt', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/menu-items/${args.id}`, { params: { context: 'edit' } });
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_create_menu_item', 'Skapa ett nytt menyobjekt', {
    site: z.string().optional(),
    title: z.string(),
    url: z.string().optional(),
    menus: z.number().describe('Meny-ID att lagga till i'),
    parent: z.number().optional().default(0),
    menu_order: z.number().optional().default(0),
    type: z.string().optional().default('custom').describe('custom, post_type, taxonomy'),
    object: z.string().optional().describe('Objekttyp (page, post, category)'),
    object_id: z.number().optional().describe('Objekt-ID (for page/post-lankar)'),
    target: z.string().optional().describe('_blank for ny flik'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {
        title: args.title,
        menus: args.menus,
        parent: args.parent,
        menu_order: args.menu_order,
        type: args.type,
        status: 'publish',
      };
      if (args.url) body.url = args.url;
      if (args.object) body.object = args.object;
      if (args.object_id) body.object_id = args.object_id;
      if (args.target) body.target = args.target;

      const res = await wpFetch(s, 'wp/v2/menu-items', { method: 'POST', body });
      return text({ created: true, id: res.data.id, title: res.data.title?.rendered });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_menu_item', 'Uppdatera ett menyobjekt', {
    site: z.string().optional(),
    id: z.number(),
    title: z.string().optional(),
    url: z.string().optional(),
    parent: z.number().optional(),
    menu_order: z.number().optional(),
    target: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.title !== undefined) body.title = args.title;
      if (args.url !== undefined) body.url = args.url;
      if (args.parent !== undefined) body.parent = args.parent;
      if (args.menu_order !== undefined) body.menu_order = args.menu_order;
      if (args.target !== undefined) body.target = args.target;

      const res = await wpFetch(s, `wp/v2/menu-items/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_menu_item', 'Ta bort ett menyobjekt', {
    site: z.string().optional(),
    id: z.number(),
    force: z.boolean().optional().default(true),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wp/v2/menu-items/${args.id}`, { method: 'DELETE', params: { force: args.force } });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });

  // --- Menu locations ---
  server.tool('perispa_list_menu_locations', 'Lista tillgangliga menyplatser i temat', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wp/v2/menu-locations');
      const locations = Object.entries(res.data).map(([slug, loc]) => ({
        slug,
        name: loc.name || slug,
        description: loc.description || '',
        menu: loc.menu || 0,
      }));
      return text({ total: locations.length, locations });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_assign_menu_location', 'Tilldela en meny till en menyplats', {
    site: z.string().optional(),
    location: z.string().describe('Menyplats-slug (t.ex. "primary", "footer")'),
    menu_id: z.number().describe('Meny-ID att tilldela'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      // Anvand theme_mods via settings
      const body = { [args.location]: args.menu_id };
      await wpFetch(s, `wp/v2/menu-locations/${args.location}`, { method: 'POST', body });
      return text({ assigned: true, location: args.location, menu_id: args.menu_id });
    } catch (e) { return err(e.message); }
  });
};
