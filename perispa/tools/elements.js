/**
 * perispa — Element/Builder tools
 * find_element, update_element, extract_builder_content, etc.
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerElementTools(server, getSite, wpFetch) {

  // --- Find element by text/class/type ---
  server.tool('perispa_find_element', 'Sök efter element på en sida via text, CSS-klass, widget-typ eller element-ID', {
    site: z.string().optional(),
    page_id: z.number().describe('Sidans/inläggets ID'),
    type: z.string().optional().default('page').describe('page eller post'),
    search_text: z.string().optional().describe('Text att söka efter i innehållet'),
    css_class: z.string().optional().describe('CSS-klass att söka efter'),
    element_type: z.string().optional().describe('Elementtyp (t.ex. heading, text, image)'),
    element_id: z.string().optional().describe('Specifikt element-ID'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const content = res.data.content?.raw || res.data.content?.rendered || '';
      const meta = res.data.meta || {};

      const results = [];

      // Sök i rå HTML-content
      if (args.search_text) {
        const regex = new RegExp(`[^<]*${escapeRegex(args.search_text)}[^<]*`, 'gi');
        const lines = content.split('\n');
        lines.forEach((line, i) => {
          if (line.toLowerCase().includes(args.search_text.toLowerCase())) {
            results.push({
              type: 'text_match',
              line: i + 1,
              content: line.trim().slice(0, 300),
            });
          }
        });
      }

      if (args.css_class) {
        const regex = new RegExp(`class="[^"]*${escapeRegex(args.css_class)}[^"]*"`, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          const start = Math.max(0, match.index - 50);
          results.push({
            type: 'class_match',
            position: match.index,
            context: content.slice(start, match.index + match[0].length + 50).trim(),
          });
        }
      }

      if (args.element_id) {
        const regex = new RegExp(`id="${escapeRegex(args.element_id)}"`, 'gi');
        let match;
        while ((match = regex.exec(content)) !== null) {
          const start = Math.max(0, match.index - 100);
          results.push({
            type: 'id_match',
            position: match.index,
            context: content.slice(start, match.index + 200).trim(),
          });
        }
      }

      // Kolla builder-specifik data
      const builderInfo = detectBuilder(meta, content);

      return text({
        page_id: args.page_id,
        builder: builderInfo,
        content_length: content.length,
        results_found: results.length,
        results: results.slice(0, 50),
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Extract builder content ---
  server.tool('perispa_extract_builder_content', 'Hämta hela sidans builder-struktur som JSON', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const meta = res.data.meta || {};
      const content = res.data.content?.raw || res.data.content?.rendered || '';

      const builderInfo = detectBuilder(meta, content);
      let builderContent = null;

      // Elementor
      if (meta._elementor_data) {
        try {
          builderContent = JSON.parse(meta._elementor_data);
        } catch {
          builderContent = meta._elementor_data;
        }
      }

      // Bricks
      if (meta._bricks_page_content_2) {
        try {
          builderContent = JSON.parse(meta._bricks_page_content_2);
        } catch {
          builderContent = meta._bricks_page_content_2;
        }
      }

      // Gutenberg (parse blocks from content)
      if (!builderContent && content.includes('<!-- wp:')) {
        builderContent = parseGutenbergBlocks(content);
      }

      return text({
        page_id: args.page_id,
        title: res.data.title?.raw || res.data.title?.rendered || '',
        builder: builderInfo,
        builder_content: builderContent,
        raw_content: builderContent ? null : content,
        meta_keys: Object.keys(meta),
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Update element ---
  server.tool('perispa_update_element', 'Uppdatera ett specifikt element på en sida (text, bild, inställningar)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    find_text: z.string().describe('Text att hitta och ersätta'),
    replace_text: z.string().describe('Ny text'),
    replace_all: z.boolean().optional().default(false).describe('Ersätt alla förekomster'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = res.data.content?.raw || res.data.content?.rendered || '';
      const meta = res.data.meta || {};

      let replaced = 0;
      const body = {};

      // Elementor
      if (meta._elementor_data) {
        let elData = meta._elementor_data;
        if (args.replace_all) {
          const count = (elData.match(new RegExp(escapeRegex(args.find_text), 'g')) || []).length;
          elData = elData.split(args.find_text).join(args.replace_text);
          replaced = count;
        } else {
          if (elData.includes(args.find_text)) {
            elData = elData.replace(args.find_text, args.replace_text);
            replaced = 1;
          }
        }
        body.meta = { _elementor_data: elData };
      }

      // Rå content
      if (args.replace_all) {
        const count = (content.match(new RegExp(escapeRegex(args.find_text), 'g')) || []).length;
        content = content.split(args.find_text).join(args.replace_text);
        replaced += count;
      } else if (replaced === 0) {
        if (content.includes(args.find_text)) {
          content = content.replace(args.find_text, args.replace_text);
          replaced = 1;
        }
      }

      body.content = content;

      if (replaced === 0) {
        return err(`Texten "${args.find_text}" hittades inte på sidan.`);
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body });
      return text({ updated: true, page_id: args.page_id, replacements: replaced });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Find builder targets ---
  server.tool('perispa_find_builder_targets', 'Lista alla redigerbara element/targets på en sida', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const content = res.data.content?.raw || res.data.content?.rendered || '';
      const meta = res.data.meta || {};

      const targets = [];

      // Gutenberg blocks
      if (content.includes('<!-- wp:')) {
        const blockRegex = /<!-- wp:(\S+?)(?:\s+({.*?}))?\s*-->/g;
        let match;
        while ((match = blockRegex.exec(content)) !== null) {
          targets.push({
            type: 'gutenberg_block',
            block_type: match[1],
            attrs: match[2] ? tryParse(match[2]) : {},
            position: match.index,
          });
        }
      }

      // Elementor widgets
      if (meta._elementor_data) {
        try {
          const elData = JSON.parse(meta._elementor_data);
          flattenElementor(elData, targets);
        } catch { /* */ }
      }

      // HTML elements med id/class
      const htmlRegex = /<(h[1-6]|p|div|section|img|a|button|span|ul|ol|li|form|input|textarea|select|table|video|iframe)\b[^>]*>/gi;
      let htmlMatch;
      let htmlCount = 0;
      while ((htmlMatch = htmlRegex.exec(content)) !== null && htmlCount < 100) {
        const tag = htmlMatch[1].toLowerCase();
        const attrs = htmlMatch[0];
        const idMatch = attrs.match(/id="([^"]+)"/);
        const classMatch = attrs.match(/class="([^"]+)"/);
        if (idMatch || classMatch) {
          targets.push({
            type: 'html_element',
            tag,
            id: idMatch ? idMatch[1] : null,
            classes: classMatch ? classMatch[1] : null,
            position: htmlMatch.index,
          });
          htmlCount++;
        }
      }

      return text({
        page_id: args.page_id,
        total_targets: targets.length,
        targets: targets.slice(0, 100),
      });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Move element ---
  server.tool('perispa_move_element', 'Flytta ett HTML-block till en ny position i innehållet', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    element_id: z.string().describe('ID på elementet att flytta'),
    target_id: z.string().describe('ID på elementet att flytta efter'),
    position: z.string().optional().default('after').describe('before eller after'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = res.data.content?.raw || res.data.content?.rendered || '';

      // Hitta element med id
      const elRegex = new RegExp(`(<[^>]+id="${escapeRegex(args.element_id)}"[^>]*>.*?</[^>]+>)`, 'is');
      const elMatch = content.match(elRegex);
      if (!elMatch) return err(`Element med id="${args.element_id}" hittades inte`);

      const element = elMatch[0];
      content = content.replace(element, '');

      // Hitta target
      const targetRegex = new RegExp(`(id="${escapeRegex(args.target_id)}"[^>]*>.*?</[^>]+>)`, 'is');
      const targetMatch = content.match(targetRegex);
      if (!targetMatch) return err(`Target med id="${args.target_id}" hittades inte`);

      if (args.position === 'before') {
        content = content.replace(targetMatch[0], element + '\n' + targetMatch[0]);
      } else {
        content = content.replace(targetMatch[0], targetMatch[0] + '\n' + element);
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body: { content } });
      return text({ moved: true, element_id: args.element_id, target_id: args.target_id, position: args.position });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- Remove element ---
  server.tool('perispa_remove_element', 'Ta bort ett element från sidans innehåll', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    element_id: z.string().optional().describe('Element-ID att ta bort'),
    css_class: z.string().optional().describe('CSS-klass på elementet att ta bort'),
    search_text: z.string().optional().describe('Text att söka efter och ta bort hela blocket'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = res.data.content?.raw || res.data.content?.rendered || '';
      let removed = false;

      if (args.element_id) {
        const regex = new RegExp(`<[^>]+id="${escapeRegex(args.element_id)}"[^>]*>.*?</[^>]+>`, 'is');
        if (regex.test(content)) {
          content = content.replace(regex, '');
          removed = true;
        }
      }

      if (args.css_class && !removed) {
        const regex = new RegExp(`<[^>]+class="[^"]*${escapeRegex(args.css_class)}[^"]*"[^>]*>.*?</[^>]+>`, 'is');
        if (regex.test(content)) {
          content = content.replace(regex, '');
          removed = true;
        }
      }

      if (args.search_text && !removed) {
        if (content.includes(args.search_text)) {
          content = content.replace(args.search_text, '');
          removed = true;
        }
      }

      if (!removed) return err('Elementet hittades inte');

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body: { content } });
      return text({ removed: true, page_id: args.page_id });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- perispa_add_sidebar ---

  server.tool('perispa_add_sidebar', 'Lägg till ett sidofältwidget-område (sidebar) på en sida via page builder.', {
    site: z.string().optional(),
    page_id: z.number().describe('Sid-ID'),
    sidebar_id: z.string().describe('Sidebar/widget area ID (t.ex. sidebar-1, footer-widgets)'),
    position: z.enum(['start', 'end']).optional().default('end').describe('Lägg till i början eller slutet av innehållet'),
    post_type: z.string().optional().default('pages'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.post_type === 'pages' ? 'wp/v2/pages' : 'wp/v2/posts';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = res.data?.content?.raw || '';

      // Generera sidebar-shortcode/widget baserat på builder
      const builder = (res.data?.meta?._elementor_edit_mode || res.data?.meta?._divi_builder_version)
        ? 'detected'
        : 'generic';

      // Standard WP sidebar widget via shortcode (fungerar i de flesta builders)
      const sidebarHtml = `\n[widget-sidebar id="${args.sidebar_id}"]`;

      if (args.position === 'start') {
        content = sidebarHtml + '\n' + content;
      } else {
        content = content + sidebarHtml;
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, {
        method: 'POST',
        body: { content },
      });

      return text({ added: true, page_id: args.page_id, sidebar_id: args.sidebar_id, position: args.position });
    } catch (e) {
      return err(e.message);
    }
  });

  // --- perispa_add_stock_image ---

  server.tool('perispa_add_stock_image', 'Sök, importera och lägg till en stockbild på en sida i ett steg.', {
    site: z.string().optional(),
    page_id: z.number().describe('Sid-ID'),
    query: z.string().describe('Sökterm för stockbild (t.ex. "office furniture", "dance floor")'),
    alt_text: z.string().optional().describe('Alt-text för bilden'),
    position: z.enum(['start', 'end']).optional().default('end'),
    post_type: z.string().optional().default('pages'),
  }, async (args) => {
    try {
      const s = getSite(args.site);

      // 1. Sök stockbilder via Openverse API
      const searchRes = await new Promise((resolve, reject) => {
        const https = require('https');
        const url = new URL('https://api.openverse.org/v1/images/');
        url.searchParams.set('q', args.query);
        url.searchParams.set('page_size', '5');
        url.searchParams.set('license_type', 'commercial');

        https.get(url, { headers: { 'User-Agent': 'perispa/1.0' } }, (res) => {
          let data = '';
          res.on('data', c => data += c);
          res.on('end', () => {
            try { resolve(JSON.parse(data)); } catch { reject(new Error('Openverse parse-fel')); }
          });
        }).on('error', reject);
      });

      const images = searchRes.results || [];
      if (images.length === 0) {
        return err(`Inga bilder hittades för "${args.query}"`);
      }

      const img = images[0];
      const imageUrl = img.url;
      const filename = `stock-${args.query.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.jpg`;
      const altText = args.alt_text || img.title || args.query;

      // 2. Importera till Media Library
      const mediaRes = await new Promise((resolve, reject) => {
        const https = require('https');
        const http = require('http');
        const imgMod = imageUrl.startsWith('https') ? https : http;

        imgMod.get(imageUrl, { rejectUnauthorized: false }, (imgStream) => {
          const chunks = [];
          imgStream.on('data', c => chunks.push(c));
          imgStream.on('end', async () => {
            const buffer = Buffer.concat(chunks);
            const contentType = imgStream.headers['content-type'] || 'image/jpeg';
            const baseUrl = s.url.replace(/\/$/, '');
            const uploadUrl = new URL(`${baseUrl}/wp-json/wp/v2/media`);
            const auth = Buffer.from(`${s.username}:${s.app_password}`).toString('base64');
            const mod = uploadUrl.protocol === 'https:' ? https : http;

            const req = mod.request(uploadUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': buffer.length,
                'User-Agent': 'perispa/1.0',
              },
              rejectUnauthorized: false,
            }, (res) => {
              let d = '';
              res.on('data', c => d += c);
              res.on('end', () => {
                try { resolve(JSON.parse(d)); } catch { reject(new Error(d.slice(0, 300))); }
              });
            });
            req.on('error', reject);
            req.write(buffer);
            req.end();
          });
          imgStream.on('error', reject);
        });
      });

      // Uppdatera alt-text
      if (mediaRes.id) {
        await wpFetch(s, `wp/v2/media/${mediaRes.id}`, {
          method: 'POST',
          body: { alt_text: altText, caption: img.attribution || `Foto: ${img.creator || 'Openverse'}` },
        }).catch(() => {});
      }

      // 3. Lägg till på sidan
      const endpoint = args.post_type === 'pages' ? 'wp/v2/pages' : 'wp/v2/posts';
      const pageRes = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = pageRes.data?.content?.raw || '';

      const imageTag = `\n<figure class="wp-block-image"><img src="${mediaRes.source_url || imageUrl}" alt="${altText}" class="wp-image-${mediaRes.id || ''}" /></figure>\n`;

      if (args.position === 'start') {
        content = imageTag + content;
      } else {
        content = content + imageTag;
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, {
        method: 'POST',
        body: { content },
      });

      return text({
        success: true,
        page_id: args.page_id,
        media_id: mediaRes.id,
        image_url: mediaRes.source_url || imageUrl,
        alt_text: altText,
        source: img.url,
        attribution: img.attribution || `${img.creator || 'Okänd'} via Openverse`,
        license: img.license,
      });
    } catch (e) {
      return err(e.message);
    }
  });

};

// --- Helpers ---

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function tryParse(s) {
  try { return JSON.parse(s); } catch { return s; }
}

function detectBuilder(meta, content) {
  if (meta._elementor_data || meta._elementor_edit_mode) return { name: 'Elementor', detected: true };
  if (meta._bricks_page_content_2) return { name: 'Bricks', detected: true };
  if (meta._et_pb_use_builder) return { name: 'Divi', detected: true };
  if (content.includes('<!-- wp:')) return { name: 'Gutenberg', detected: true };
  if (meta.panels_data) return { name: 'SiteOrigin', detected: true };
  return { name: 'classic', detected: false };
}

function flattenElementor(elements, targets, depth = 0) {
  if (!Array.isArray(elements)) return;
  for (const el of elements) {
    targets.push({
      type: 'elementor_widget',
      widget_type: el.widgetType || el.elType,
      id: el.id,
      depth,
      settings_keys: el.settings ? Object.keys(el.settings).slice(0, 20) : [],
    });
    if (el.elements) flattenElementor(el.elements, targets, depth + 1);
  }
}

function parseGutenbergBlocks(content) {
  const blocks = [];
  const regex = /<!-- wp:(\S+?)(?:\s+({.*?}))?\s*(\/)?-->([\s\S]*?)(?:<!-- \/wp:\1\s*-->)?/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    blocks.push({
      blockName: match[1],
      attrs: match[2] ? tryParse(match[2]) : {},
      selfClosing: !!match[3],
      innerHTML: match[4]?.trim().slice(0, 200) || '',
    });
  }
  return blocks;
}
