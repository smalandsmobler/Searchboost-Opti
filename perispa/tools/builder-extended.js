/**
 * perispa — Extended builder tools
 * build_page, batch_update, inject_content, convert_html, duplicate_element,
 * reorder_elements, get_builder_info, apply_builder_patch
 */

const { z } = require('zod');

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

module.exports = function registerBuilderExtendedTools(server, getSite, wpFetch) {

  server.tool('perispa_get_builder_info', 'Identifiera vilken page builder som anvands pa en site', {
    site: z.string().optional(),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const [plugins, themes] = await Promise.all([
        wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
        wpFetch(s, 'wp/v2/themes', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
      ]);

      const pluginList = Array.isArray(plugins.data) ? plugins.data : [];
      const activePlugins = pluginList.filter(p => p.status === 'active');

      const builders = [];
      const builderNames = {
        'elementor': 'Elementor',
        'elementor-pro': 'Elementor Pro',
        'bricks': 'Bricks Builder',
        'divi-builder': 'Divi Builder',
        'beaver-builder': 'Beaver Builder',
        'wpbakery': 'WPBakery',
        'oxygen': 'Oxygen Builder',
        'breakdance': 'Breakdance',
        'siteorigin-panels': 'SiteOrigin Page Builder',
        'generateblocks': 'GenerateBlocks',
        'kadence-blocks': 'Kadence Blocks',
        'spectra': 'Spectra',
      };

      for (const p of activePlugins) {
        const slug = p.plugin?.split('/')[0] || '';
        for (const [key, name] of Object.entries(builderNames)) {
          if (slug.includes(key)) {
            builders.push({ name, plugin: p.plugin, version: p.version });
          }
        }
      }

      // Kolla tema (Divi, Bricks, Avada)
      const activeTheme = Array.isArray(themes.data)
        ? themes.data.find(t => t.status === 'active')
        : Object.values(themes.data || {}).find(t => t.status === 'active');

      const themeName = activeTheme?.name?.rendered || activeTheme?.name || '';
      if (themeName.toLowerCase().includes('divi')) builders.push({ name: 'Divi (tema)', theme: true });
      if (themeName.toLowerCase().includes('bricks')) builders.push({ name: 'Bricks (tema)', theme: true });
      if (themeName.toLowerCase().includes('avada')) builders.push({ name: 'Avada', theme: true });

      // Alltid Gutenberg
      builders.push({ name: 'Gutenberg (inbyggd)', built_in: true });

      // Context-aware tool recommendations baserat på detekterad builder
      const primaryBuilder = builders.find((b) => !b.built_in)?.name?.toLowerCase() || 'gutenberg';

      const BUILDER_TOOLS = {
        elementor: [
          'perispa_elementor_extract   — Läs sidstruktur',
          'perispa_elementor_find      — Hitta element',
          'perispa_elementor_update    — Uppdatera element',
          'perispa_elementor_inject    — Skriv tillbaka trädet',
        ],
        bricks: [
          'perispa_bricks_extract      — Läs sidstruktur',
          'perispa_bricks_find         — Hitta element',
          'perispa_bricks_update       — Uppdatera element',
          'perispa_bricks_inject       — Skriv tillbaka data',
        ],
        flatsome: [
          'perispa_extract_flatsome    — Läs sidstruktur',
          'perispa_find_flatsome_el    — Hitta element',
          'perispa_update_flatsome_el  — Uppdatera element',
          'perispa_inject_flatsome     — Skriv tillbaka shortcodes',
          'perispa_update_module       — Uppdatera modul via ID',
        ],
        gutenberg: [
          'perispa_read_page           — Läs raw block-innehåll',
          'perispa_update_page         — Skriv block-innehåll',
          'perispa_update_module       — Hitta och uppdatera block via shortcode/ID',
        ],
      };

      // Matcha detekterad builder mot tool-lista
      let relevantTools = BUILDER_TOOLS.gutenberg;
      if (primaryBuilder.includes('elementor')) relevantTools = BUILDER_TOOLS.elementor;
      else if (primaryBuilder.includes('bricks')) relevantTools = BUILDER_TOOLS.bricks;
      else if (primaryBuilder.includes('flatsome') || themeName.toLowerCase().includes('flatsome')) {
        relevantTools = BUILDER_TOOLS.flatsome;
      }

      return text({
        site: s.slug,
        active_theme: themeName,
        builders_detected: builders,
        primary_builder: builders.find((b) => !b.built_in)?.name || 'Gutenberg',
        recommended_tools: relevantTools,
        note: 'Använd dessa tools för att redigera sidinnehåll på denna sajt.',
      });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_build_page', 'Bygg en hel sida med sektioner och element', {
    site: z.string().optional(),
    page_id: z.number().optional().describe('Befintlig sida att overskriva (skapar ny om ej angivet)'),
    title: z.string().describe('Sidtitel'),
    sections: z.array(z.object({
      type: z.string().optional().default('section').describe('section, hero, cta, faq, testimonials'),
      content: z.string().describe('HTML-innehall for sektionen'),
      css_class: z.string().optional(),
      id: z.string().optional(),
      style: z.string().optional(),
    })).describe('Lista med sektioner'),
    status: z.string().optional().default('draft'),
  }, async (args) => {
    try {
      const s = getSite(args.site);

      const html = args.sections.map(sec => {
        const attrs = [`class="${sec.css_class || sec.type}"`];
        if (sec.id) attrs.push(`id="${sec.id}"`);
        if (sec.style) attrs.push(`style="${sec.style}"`);
        return `<section ${attrs.join(' ')}>\n${sec.content}\n</section>`;
      }).join('\n\n');

      if (args.page_id) {
        await wpFetch(s, `wp/v2/pages/${args.page_id}`, {
          method: 'POST',
          body: { title: args.title, content: html, status: args.status },
        });
        return text({ built: true, page_id: args.page_id, sections: args.sections.length });
      } else {
        const res = await wpFetch(s, 'wp/v2/pages', {
          method: 'POST',
          body: { title: args.title, content: html, status: args.status },
        });
        return text({ built: true, page_id: res.data.id, link: res.data.link, sections: args.sections.length });
      }
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_batch_update', 'Uppdatera flera element pa en sida i en enda operation', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    replacements: z.array(z.object({
      find: z.string(),
      replace: z.string(),
    })).describe('Lista med sok-och-ersatt-par'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = res.data.content?.raw || res.data.content?.rendered || '';
      const meta = res.data.meta || {};

      let totalReplaced = 0;
      const details = [];

      for (const r of args.replacements) {
        const count = (content.match(new RegExp(escapeRegex(r.find), 'g')) || []).length;
        if (count > 0) {
          content = content.split(r.find).join(r.replace);
          totalReplaced += count;
          details.push({ find: r.find.slice(0, 50), replaced: count });
        }
      }

      // Elementor data
      let elReplaced = 0;
      if (meta._elementor_data) {
        let elData = meta._elementor_data;
        for (const r of args.replacements) {
          const count = (elData.match(new RegExp(escapeRegex(r.find), 'g')) || []).length;
          if (count > 0) {
            elData = elData.split(r.find).join(r.replace);
            elReplaced += count;
          }
        }
        if (elReplaced > 0) {
          await wpFetch(s, `${endpoint}/${args.page_id}`, {
            method: 'POST',
            body: { content, meta: { _elementor_data: elData } },
          });
          return text({ updated: true, page_id: args.page_id, content_replaced: totalReplaced, elementor_replaced: elReplaced, details });
        }
      }

      if (totalReplaced === 0) {
        return text({ updated: false, message: 'Inget att ersatta' });
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body: { content } });
      return text({ updated: true, page_id: args.page_id, total_replaced: totalReplaced, details });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_inject_builder_content', 'Injicera builder-innehall (Elementor JSON, Gutenberg blocks) i en sida', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    builder: z.string().describe('elementor, gutenberg, raw'),
    content: z.string().describe('Innehall att injicera (JSON for Elementor, HTML for Gutenberg/raw)'),
    position: z.string().optional().default('append').describe('append, prepend, replace'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let existing = res.data.content?.raw || res.data.content?.rendered || '';
      const body = {};

      if (args.builder === 'elementor') {
        const meta = res.data.meta || {};
        let elData = meta._elementor_data ? JSON.parse(meta._elementor_data) : [];
        const newData = JSON.parse(args.content);

        if (args.position === 'replace') {
          elData = newData;
        } else if (args.position === 'prepend') {
          elData = [...newData, ...elData];
        } else {
          elData = [...elData, ...newData];
        }

        body.meta = { _elementor_data: JSON.stringify(elData), _elementor_edit_mode: 'builder' };
      } else {
        if (args.position === 'replace') {
          existing = args.content;
        } else if (args.position === 'prepend') {
          existing = args.content + '\n' + existing;
        } else {
          existing = existing + '\n' + args.content;
        }
        body.content = existing;
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body });
      return text({ injected: true, page_id: args.page_id, builder: args.builder, position: args.position });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_convert_html_to_builder', 'Konvertera ra HTML till Gutenberg-blocks', {
    html: z.string().describe('HTML att konvertera'),
  }, async (args) => {
    try {
      // Konvertera vanliga HTML-element till Gutenberg-block-kommentarer
      let blocks = args.html;

      // Headings
      blocks = blocks.replace(/<h([1-6])([^>]*)>([\s\S]*?)<\/h\1>/gi, (_, level, attrs, content) => {
        return `<!-- wp:heading {"level":${level}} -->\n<h${level}${attrs}>${content}</h${level}>\n<!-- /wp:heading -->`;
      });

      // Paragraphs
      blocks = blocks.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (_, attrs, content) => {
        return `<!-- wp:paragraph -->\n<p${attrs}>${content}</p>\n<!-- /wp:paragraph -->`;
      });

      // Images
      blocks = blocks.replace(/<img([^>]*)\/?>/gi, (_, attrs) => {
        return `<!-- wp:image -->\n<figure class="wp-block-image"><img${attrs} /></figure>\n<!-- /wp:image -->`;
      });

      // Lists
      blocks = blocks.replace(/<ul([^>]*)>([\s\S]*?)<\/ul>/gi, (_, attrs, content) => {
        return `<!-- wp:list -->\n<ul${attrs}>${content}</ul>\n<!-- /wp:list -->`;
      });
      blocks = blocks.replace(/<ol([^>]*)>([\s\S]*?)<\/ol>/gi, (_, attrs, content) => {
        return `<!-- wp:list {"ordered":true} -->\n<ol${attrs}>${content}</ol>\n<!-- /wp:list -->`;
      });

      // Blockquotes
      blocks = blocks.replace(/<blockquote([^>]*)>([\s\S]*?)<\/blockquote>/gi, (_, attrs, content) => {
        return `<!-- wp:quote -->\n<blockquote${attrs}>${content}</blockquote>\n<!-- /wp:quote -->`;
      });

      return text({ converted: true, gutenberg_content: blocks });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_duplicate_element', 'Duplicera ett element pa en sida (via ID eller text)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    element_id: z.string().optional().describe('ID pa elementet att duplicera'),
    search_text: z.string().optional().describe('Text att hitta blocket med'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = res.data.content?.raw || res.data.content?.rendered || '';

      let element = null;

      if (args.element_id) {
        const regex = new RegExp(`(<[^>]+id="${escapeRegex(args.element_id)}"[^>]*>[\\s\\S]*?<\\/[^>]+>)`, 'i');
        const match = content.match(regex);
        if (match) element = match[0];
      }

      if (!element && args.search_text) {
        // Hitta narmaste block-element som innehaller texten
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(args.search_text)) {
            element = lines[i];
            break;
          }
        }
      }

      if (!element) return err('Elementet hittades inte');

      // Skapa kopia med nytt ID
      let copy = element;
      if (args.element_id) {
        copy = copy.replace(`id="${args.element_id}"`, `id="${args.element_id}-copy"`);
      }

      content = content.replace(element, element + '\n' + copy);
      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body: { content } });

      return text({ duplicated: true, page_id: args.page_id });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_reorder_elements', 'Andra ordning pa element pa en sida', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    element_ids: z.array(z.string()).describe('Element-IDn i onskaad ordning'),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let content = res.data.content?.raw || res.data.content?.rendered || '';

      // Extrahera alla element med ID
      const elements = {};
      for (const id of args.element_ids) {
        const regex = new RegExp(`(<[^>]+id="${escapeRegex(id)}"[^>]*>[\\s\\S]*?<\\/[^>]+>)`, 'i');
        const match = content.match(regex);
        if (match) {
          elements[id] = match[0];
          content = content.replace(match[0], `<!--PLACEHOLDER_${id}-->`);
        }
      }

      // Ersatt placeholders i ratt ordning
      let firstPlaceholder = true;
      for (const id of args.element_ids) {
        if (elements[id]) {
          if (firstPlaceholder) {
            // Ersatt forsta placeholder med alla element i ordning
            const ordered = args.element_ids
              .filter(i => elements[i])
              .map(i => elements[i])
              .join('\n');
            content = content.replace(`<!--PLACEHOLDER_${id}-->`, ordered);
            firstPlaceholder = false;
          } else {
            content = content.replace(`<!--PLACEHOLDER_${id}-->`, '');
          }
        }
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body: { content } });
      return text({ reordered: true, page_id: args.page_id, order: args.element_ids });
    } catch (e) { return err(e.message); }
  });

  server.tool('perispa_apply_builder_patch', 'Applicera en JSON-patch pa builder-data (Elementor/Bricks)', {
    site: z.string().optional(),
    page_id: z.number(),
    type: z.string().optional().default('page'),
    patches: z.array(z.object({
      path: z.string().describe('JSON-path (t.ex. "0.elements.0.settings.title")'),
      value: z.any().describe('Nytt varde'),
    })),
  }, async (args) => {
    try {
      const s = getSite(args.site);
      const endpoint = args.type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      const meta = res.data.meta || {};

      let data;
      let metaKey;

      if (meta._elementor_data) {
        data = JSON.parse(meta._elementor_data);
        metaKey = '_elementor_data';
      } else if (meta._bricks_page_content_2) {
        data = JSON.parse(meta._bricks_page_content_2);
        metaKey = '_bricks_page_content_2';
      } else {
        return err('Ingen builder-data hittad (Elementor/Bricks)');
      }

      // Applicera patches
      for (const patch of args.patches) {
        const parts = patch.path.split('.');
        let obj = data;
        for (let i = 0; i < parts.length - 1; i++) {
          const key = isNaN(parts[i]) ? parts[i] : parseInt(parts[i]);
          obj = obj[key];
          if (obj === undefined) return err(`Path "${patch.path}" ogiltigt vid "${parts[i]}"`);
        }
        const lastKey = isNaN(parts[parts.length - 1]) ? parts[parts.length - 1] : parseInt(parts[parts.length - 1]);
        obj[lastKey] = patch.value;
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, {
        method: 'POST',
        body: { meta: { [metaKey]: JSON.stringify(data) } },
      });

      return text({ patched: true, page_id: args.page_id, patches_applied: args.patches.length });
    } catch (e) { return err(e.message); }
  });
};

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
