/**
 * perispa — Taxonomy & term management tools
 * Full CRUD for taxonomies and terms
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerTaxonomyTools(server, getSite, wpFetch) {

  server.tool('perispa_list_taxonomies', 'Lista alla registrerade taxonomier', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wp/v2/taxonomies');
      const taxonomies = Object.values(res.data).map(t => ({
        slug: t.slug,
        name: t.name,
        description: t.description || '',
        rest_base: t.rest_base,
        hierarchical: t.hierarchical,
        types: t.types || [],
      }));
      return text({ total: taxonomies.length, taxonomies });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_taxonomy', 'Hamta detaljer om en taxonomi', {
    site: z.string().optional(),
    taxonomy: z.string().describe('Taxonomi-slug (t.ex. "category", "post_tag", "product_cat")'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/taxonomies/${args.taxonomy}`);
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_list_terms', 'Lista termer i en taxonomi', {
    site: z.string().optional(),
    taxonomy: z.string().describe('REST base (t.ex. "categories", "tags", "product_cat")'),
    per_page: z.number().optional().default(100),
    page: z.number().optional().default(1),
    search: z.string().optional(),
    parent: z.number().optional(),
    hide_empty: z.boolean().optional().default(false),
    orderby: z.string().optional().default('name'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {
        per_page: Math.min(args.per_page, 100),
        page: args.page,
        hide_empty: args.hide_empty,
        orderby: args.orderby,
      };
      if (args.search) params.search = args.search;
      if (args.parent !== undefined) params.parent = args.parent;

      const res = await wpFetch(s, `wp/v2/${args.taxonomy}`, { params });
      return text({
        total: res.total,
        terms: res.data.map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description || '',
          count: t.count,
          parent: t.parent || 0,
        })),
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_term', 'Hamta en specifik term', {
    site: z.string().optional(),
    taxonomy: z.string().describe('REST base'),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/${args.taxonomy}/${args.id}`, { params: { context: 'edit' } });
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_create_term', 'Skapa en ny term i en taxonomi', {
    site: z.string().optional(),
    taxonomy: z.string().describe('REST base (t.ex. "categories", "tags")'),
    name: z.string(),
    slug: z.string().optional(),
    description: z.string().optional(),
    parent: z.number().optional().default(0),
    meta: z.record(z.string(), z.any()).optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { name: args.name };
      if (args.slug) body.slug = args.slug;
      if (args.description) body.description = args.description;
      if (args.parent) body.parent = args.parent;
      if (args.meta) body.meta = args.meta;

      const res = await wpFetch(s, `wp/v2/${args.taxonomy}`, { method: 'POST', body });
      return text({ created: true, id: res.data.id, name: res.data.name, slug: res.data.slug });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_term', 'Uppdatera en term', {
    site: z.string().optional(),
    taxonomy: z.string().describe('REST base'),
    id: z.number(),
    name: z.string().optional(),
    slug: z.string().optional(),
    description: z.string().optional(),
    parent: z.number().optional(),
    meta: z.record(z.string(), z.any()).optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.name !== undefined) body.name = args.name;
      if (args.slug !== undefined) body.slug = args.slug;
      if (args.description !== undefined) body.description = args.description;
      if (args.parent !== undefined) body.parent = args.parent;
      if (args.meta !== undefined) body.meta = args.meta;

      const res = await wpFetch(s, `wp/v2/${args.taxonomy}/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, name: res.data.name });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_term', 'Ta bort en term', {
    site: z.string().optional(),
    taxonomy: z.string().describe('REST base'),
    id: z.number(),
    force: z.boolean().optional().default(true),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wp/v2/${args.taxonomy}/${args.id}`, { method: 'DELETE', params: { force: args.force } });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });
};
