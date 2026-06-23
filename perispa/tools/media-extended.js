/**
 * perispa — Extended media tools
 * get, update, delete, batch update, sideload, stock images
 */

const { z } = require('zod');
const https = require('https');
const http = require('http');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerMediaExtendedTools(server, getSite, wpFetch) {

  server.tool('perispa_get_media', 'Hamta detaljer om en specifik media-fil', {
    site: z.string().optional(),
    id: z.number(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const res = await wpFetch(s, `wp/v2/media/${args.id}`, { params: { context: 'edit' } });
      const m = res.data;
      return text({
        id: m.id,
        title: m.title?.raw || m.title?.rendered || '',
        alt_text: m.alt_text || '',
        caption: m.caption?.raw || '',
        description: m.description?.raw || '',
        url: m.source_url,
        mime_type: m.mime_type,
        media_details: {
          width: m.media_details?.width,
          height: m.media_details?.height,
          file: m.media_details?.file,
          filesize: m.media_details?.filesize,
          sizes: m.media_details?.sizes ? Object.keys(m.media_details.sizes) : [],
        },
        date: m.date,
        modified: m.modified,
        post: m.post,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_media', 'Uppdatera en media-fils metadata (alt, title, caption)', {
    site: z.string().optional(),
    id: z.number(),
    alt_text: z.string().optional(),
    title: z.string().optional(),
    caption: z.string().optional(),
    description: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const body = {};
      if (args.alt_text !== undefined) body.alt_text = args.alt_text;
      if (args.title !== undefined) body.title = args.title;
      if (args.caption !== undefined) body.caption = args.caption;
      if (args.description !== undefined) body.description = args.description;

      const res = await wpFetch(s, `wp/v2/media/${args.id}`, { method: 'POST', body });
      return text({ updated: true, id: res.data.id, title: res.data.title?.rendered, alt_text: res.data.alt_text });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_delete_media', 'Ta bort en media-fil', {
    site: z.string().optional(),
    id: z.number(),
    force: z.boolean().optional().default(false).describe('true = permanent borttagning'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const params = {};
      if (args.force) params.force = true;
      await wpFetch(s, `wp/v2/media/${args.id}`, { method: 'DELETE', params });
      return text({ deleted: true, id: args.id });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_update_media_batch', 'Batch-uppdatera metadata pa flera media-filer', {
    site: z.string().optional(),
    updates: z.array(z.object({
      id: z.number(),
      alt_text: z.string().optional(),
      title: z.string().optional(),
      caption: z.string().optional(),
    })).describe('Lista med media att uppdatera'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const results = [];

      for (const update of args.updates) {
        try {
          const body = {};
          if (update.alt_text !== undefined) body.alt_text = update.alt_text;
          if (update.title !== undefined) body.title = update.title;
          if (update.caption !== undefined) body.caption = update.caption;

          await wpFetch(s, `wp/v2/media/${update.id}`, { method: 'POST', body });
          results.push({ id: update.id, success: true });
        } catch (e) {
          results.push({ id: update.id, success: false, error: e.message });
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

  server.tool('perispa_sideload_image', 'Ladda ner en bild fran extern URL och lagg till i mediebiblioteket', {
    site: z.string().optional(),
    url: z.string().describe('Extern bild-URL'),
    filename: z.string().optional().describe('Filnamn (auto-genereras fran URL om ej angivet)'),
    alt_text: z.string().optional(),
    title: z.string().optional(),
    post_id: z.number().optional().describe('Koppla till post/page ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const filename = args.filename || args.url.split('/').pop().split('?')[0] || 'image.jpg';

      // Ladda ner bilden
      const buffer = await new Promise((resolve, reject) => {
        const mod = args.url.startsWith('https') ? https : http;
        mod.get(args.url, { rejectUnauthorized: false }, (res) => {
          const chunks = [];
          res.on('data', c => chunks.push(c));
          res.on('end', () => resolve({ buffer: Buffer.concat(chunks), contentType: res.headers['content-type'] }));
          res.on('error', reject);
        });
      });

      // Ladda upp till WP
      const baseUrl = s.url.replace(/\/$/, '');
      const uploadUrl = new URL(`${baseUrl}/wp-json/wp/v2/media`);
      const auth = Buffer.from(`${s.username}:${s.app_password}`).toString('base64');
      const uploadMod = uploadUrl.protocol === 'https:' ? https : http;

      const result = await new Promise((resolve, reject) => {
        const req = uploadMod.request(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': buffer.contentType || 'image/jpeg',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': buffer.buffer.length,
            'User-Agent': 'perispa/1.0',
          },
          rejectUnauthorized: false,
        }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch { reject(new Error(data.slice(0, 500))); }
          });
        });
        req.on('error', reject);
        req.write(buffer.buffer);
        req.end();
      });

      // Uppdatera metadata
      if (args.alt_text || args.title || args.post_id) {
        const body = {};
        if (args.alt_text) body.alt_text = args.alt_text;
        if (args.title) body.title = args.title;
        if (args.post_id) body.post = args.post_id;
        await wpFetch(s, `wp/v2/media/${result.id}`, { method: 'POST', body });
      }

      return text({
        sideloaded: true,
        id: result.id,
        url: result.source_url,
        title: result.title?.rendered,
        filename,
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_search_stock_images', 'Sok efter gratis stockbilder via Unsplash', {
    query: z.string().describe('Sokterm (pa engelska)'),
    per_page: z.number().optional().default(10),
  }, async (args) => {
    try {
      // Anvand Unsplash Source (ingen API-nyckel kravs for sokning)
      // Returnerar forslag baserat pa sokterm
      const results = [];
      for (let i = 1; i <= args.per_page; i++) {
        results.push({
          url: `https://source.unsplash.com/1200x800/?${encodeURIComponent(args.query)}&sig=${i}`,
          thumbnail: `https://source.unsplash.com/400x300/?${encodeURIComponent(args.query)}&sig=${i}`,
          source: 'unsplash',
          license: 'Unsplash License (free for commercial use)',
          query: args.query,
        });
      }

      return text({
        query: args.query,
        total: results.length,
        note: 'Anvand perispa_sideload_image for att ladda ner och lagga till i mediebiblioteket',
        images: results,
      });
    } catch (e) { return err(e.message); }
  });
};
