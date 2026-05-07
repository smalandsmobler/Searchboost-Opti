/**
 * perispa — WordPress options management
 * get, update, delete, list options
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerOptionTools(server, getSite, wpFetch) {

  server.tool('perispa_list_options', 'Lista WordPress-installningar (via settings endpoint)', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wp/v2/settings');
      return text(res.data);
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_get_option', 'Hamta ett specifikt WordPress-alternativ via settings', {
    site: z.string().optional(),
    option: z.string().describe('Option-nyckel (t.ex. "title", "description", "timezone_string", "date_format")'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, 'wp/v2/settings');
      const value = res.data[args.option];
      if (value === undefined) {
        return text({ option: args.option, value: null, note: 'Nyckeln finns inte i settings. Tillgangliga: ' + Object.keys(res.data).join(', ') });
      }
      return text({ option: args.option, value });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_option', 'Uppdatera ett WordPress-alternativ via settings', {
    site: z.string().optional(),
    option: z.string().describe('Option-nyckel'),
    value: z.any().describe('Nytt varde'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { [args.option]: args.value };
      const res = await wpFetch(s, 'wp/v2/settings', { method: 'POST', body });
      return text({ updated: true, option: args.option, value: res.data[args.option] });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_option', 'Aterstall ett WordPress-alternativ till default', {
    site: z.string().optional(),
    option: z.string().describe('Option-nyckel att aterstalla'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = { [args.option]: '' };
      const res = await wpFetch(s, 'wp/v2/settings', { method: 'POST', body });
      return text({ reset: true, option: args.option, value: res.data[args.option] });
    } catch (e) { return err(e.message); }
  });
};
