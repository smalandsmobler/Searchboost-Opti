/**
 * perispa — User management tools
 * Full CRUD for WordPress users
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerUserTools(server, getSite, wpFetch) {

  server.tool('perispa_get_user', 'Hamta en specifik anvandare', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/users/${args.id}`, { params: { context: 'edit' } });
      return text({
        id: res.data.id,
        username: res.data.username,
        name: res.data.name,
        first_name: res.data.first_name,
        last_name: res.data.last_name,
        email: res.data.email,
        roles: res.data.roles,
        registered_date: res.data.registered_date,
        url: res.data.url,
        description: res.data.description,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_create_user', 'Skapa en ny WordPress-anvandare', {
    site: z.string().optional(),
    username: z.string(),
    email: z.string(),
    password: z.string(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    roles: z.array(z.string()).optional().default(['subscriber']).describe('Roller: administrator, editor, author, contributor, subscriber'),
    url: z.string().optional(),
    description: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {
        username: args.username,
        email: args.email,
        password: args.password,
        roles: args.roles,
      };
      if (args.first_name) body.first_name = args.first_name;
      if (args.last_name) body.last_name = args.last_name;
      if (args.url) body.url = args.url;
      if (args.description) body.description = args.description;

      const res = await wpFetch(s, 'wp/v2/users', { method: 'POST', body });
      return text({ created: true, id: res.data.id, username: res.data.username, email: res.data.email, roles: res.data.roles });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_user', 'Uppdatera en anvandare', {
    site: z.string().optional(),
    id: z.number(),
    email: z.string().optional(),
    first_name: z.string().optional(),
    last_name: z.string().optional(),
    name: z.string().optional(),
    password: z.string().optional(),
    roles: z.array(z.string()).optional(),
    url: z.string().optional(),
    description: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      const fields = ['email', 'first_name', 'last_name', 'name', 'password', 'roles', 'url', 'description'];
      for (const f of fields) {
        if (args[f] !== undefined) body[f] = args[f];
      }

      const res = await wpFetch(s, `wp/v2/users/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, username: res.data.username, roles: res.data.roles });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_user', 'Ta bort en anvandare', {
    site: z.string().optional(),
    id: z.number(),
    reassign: z.number().describe('Anvandare att flytta innehall till (obligatoriskt)'),
    force: z.boolean().optional().default(true),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      await wpFetch(s, `wp/v2/users/${args.id}`, {
        method: 'DELETE',
        params: { force: args.force, reassign: args.reassign },
      });
      return text({ deleted: true, id: args.id, reassigned_to: args.reassign });
    } catch (e) { return err(e.message); }
  });
};
