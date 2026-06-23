/**
 * perispa — Plugin management tools
 * activate, deactivate, install, delete, update
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerPluginTools(server, getSite, wpFetch) {

  server.tool('perispa_activate_plugin', 'Aktivera ett WordPress-plugin', {
    site: z.string().optional(),
    plugin: z.string().describe('Plugin-slug (t.ex. "akismet/akismet" eller "hello-dolly/hello")'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/plugins/${encodeURIComponent(args.plugin)}`, {
        method: 'POST',
        body: { status: 'active' },
      });
      return text({ activated: true, plugin: res.data.plugin, name: res.data.name, status: res.data.status });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_deactivate_plugin', 'Avaktivera ett WordPress-plugin', {
    site: z.string().optional(),
    plugin: z.string().describe('Plugin-slug'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/plugins/${encodeURIComponent(args.plugin)}`, {
        method: 'POST',
        body: { status: 'inactive' },
      });
      return text({ deactivated: true, plugin: res.data.plugin, name: res.data.name, status: res.data.status });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_install_plugin', 'Installera ett plugin fran WordPress-katalogen', {
    site: z.string().optional(),
    slug: z.string().describe('Plugin-slug fran wordpress.org (t.ex. "rank-math-seo")'),
    activate: z.boolean().optional().default(false),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { slug: args.slug, status: args.activate ? 'active' : 'inactive' };
      const res = await wpFetch(s, 'wp/v2/plugins', { method: 'POST', body });
      return text({ installed: true, plugin: res.data.plugin, name: res.data.name, status: res.data.status, version: res.data.version });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_plugin', 'Ta bort ett WordPress-plugin (maste vara avaktiverat forst)', {
    site: z.string().optional(),
    plugin: z.string().describe('Plugin-slug'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/plugins/${encodeURIComponent(args.plugin)}`, { method: 'DELETE' });
      return text({ deleted: true, plugin: args.plugin });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_plugin', 'Uppdatera ett plugin till senaste version', {
    site: z.string().optional(),
    plugin: z.string().describe('Plugin-slug'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      // WP REST API har inte direkt update-endpoint, men man kan anvanda autoupdates
      const res = await wpFetch(s, `wp/v2/plugins/${encodeURIComponent(args.plugin)}`, {
        method: 'POST',
        body: { auto_update: true },
      });
      return text({ plugin: res.data.plugin, name: res.data.name, version: res.data.version, auto_update: true });
    } catch (e) { return err(e.message); }
  });
};
