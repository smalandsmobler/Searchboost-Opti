/**
 * perispa — Elementor Deep Tools
 *
 * Elementor lagrar siddata som JSON i postmeta: _elementor_data
 * Struktur: array av sections → columns → widgets
 * Varje element har: id, elType (section/column/widget), widgetType, settings, elements[]
 *
 * Tools:
 *   perispa_elementor_extract  — Läs och parse:a _elementor_data
 *   perispa_elementor_inject   — Skriv JSON-träd tillbaka till _elementor_data
 *   perispa_elementor_find     — Hitta element via id, widgetType, eller textinnehåll
 *   perispa_elementor_update   — Uppdatera ett elements settings via dess element-ID
 */

'use strict';

const { z } = require('zod');

function text(content) {
  const str = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const structured = typeof content === 'string' ? { message: content } : content;
  return { content: [{ type: 'text', text: str }], structuredContent: structured };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], structuredContent: { error: msg }, isError: true };
}

/**
 * Hämtar och avkodar _elementor_data från en post/page.
 * Returnerar [parsed_array, raw_string, endpoint, post_id]
 */
async function fetchElementorData(s, postId, contentType, wpFetch) {
  const endpoint = contentType === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
  const res = await wpFetch(s, `${endpoint}/${postId}`, { params: { context: 'edit' } });
  const post = res.data;

  // _elementor_data kan finnas i meta eller i content (vissa inställningar)
  let raw = post.meta?._elementor_data || '';

  // Elementor kan base64-koda data vid stora sidor
  if (raw && !raw.trim().startsWith('[') && !raw.trim().startsWith('{')) {
    try {
      raw = Buffer.from(raw, 'base64').toString('utf-8');
    } catch { /* inte base64 */ }
  }

  if (!raw) {
    return { data: [], raw: '[]', endpoint, post, isEmpty: true };
  }

  const parsed = JSON.parse(raw);
  return { data: parsed, raw, endpoint, post, isEmpty: false };
}

/**
 * Rekursiv sökning i Elementor-trädet
 */
function findInTree(elements, predicate, results = []) {
  for (const el of elements) {
    if (predicate(el)) results.push(el);
    if (el.elements?.length) findInTree(el.elements, predicate, results);
  }
  return results;
}

/**
 * Rekursiv uppdatering av ett element i trädet via ID
 */
function updateInTree(elements, targetId, updater) {
  for (let i = 0; i < elements.length; i++) {
    if (elements[i].id === targetId) {
      elements[i] = updater(elements[i]);
      return true;
    }
    if (elements[i].elements?.length) {
      if (updateInTree(elements[i].elements, targetId, updater)) return true;
    }
  }
  return false;
}

/**
 * Summering av ett element (utan children) för list-output
 */
function summarizeElement(el) {
  return {
    id: el.id,
    elType: el.elType,
    widgetType: el.widgetType || null,
    children: el.elements?.length || 0,
    settings_keys: Object.keys(el.settings || {}).slice(0, 15),
    // Vanliga textfält
    title: el.settings?.title || el.settings?.heading_title || null,
    text: el.settings?.editor?.slice(0, 100) || el.settings?.text?.slice(0, 100) || null,
    url: el.settings?.url?.url || el.settings?.link?.url || null,
    image: el.settings?.image?.url || null,
  };
}

module.exports = function registerElementorTools(server, getSite, wpFetch) {

  server.tool(
    'perispa_elementor_extract',
    'Läs och parse:a en Elementor-sidas struktur (sections, columns, widgets). ' +
    'Returnerar trädet som renläsbar JSON. Krävs för att förstå sidans uppbyggnad ' +
    'innan du redigerar med perispa_elementor_update.',
    {
      site: z.string().optional(),
      id: z.number().describe('Post/Page ID'),
      content_type: z.string().optional().default('page').describe('"page" eller "post"'),
      depth: z.number().optional().default(3).describe('Hur många nivåer att inkludera (1=bara sections, 3=full)'),
      summary_only: z.boolean().optional().default(true)
        .describe('true = kompakt läsbar vy, false = fullständigt JSON (kan bli stort)'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const { data, isEmpty, post } = await fetchElementorData(s, args.id, args.content_type, wpFetch);

        if (isEmpty) {
          return text({
            id: args.id,
            elementor_active: false,
            message: 'Sidan har inget Elementor-innehåll. Kontrollera att Elementor är aktiverat och sidan är byggd med Elementor.',
            wp_content_length: (post.content?.raw || post.content?.rendered || '').length,
          });
        }

        if (!args.summary_only) {
          return text({ id: args.id, sections: data.length, tree: data });
        }

        // Summering per sektion → kolumn → widget
        const summary = data.map((section) => ({
          id: section.id,
          type: 'section',
          settings_keys: Object.keys(section.settings || {}).slice(0, 10),
          columns: (section.elements || []).map((col) => ({
            id: col.id,
            type: 'column',
            width: col.settings?._column_size || col.settings?.width?.size || null,
            widgets: (col.elements || []).map(summarizeElement),
          })),
        }));

        return text({
          id: args.id,
          elementor_active: true,
          sections: data.length,
          total_elements: findInTree(data, () => true).length,
          structure: summary,
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_elementor_inject',
    'Skriv ett (redigerat) JSON-träd tillbaka till en Elementor-sida. ' +
    'Används efter att du modifierat strukturen från perispa_elementor_extract. ' +
    'OBS: felaktig JSON kan förstöra sidan — skapa snapshot med perispa_create_snapshot först.',
    {
      site: z.string().optional(),
      id: z.number().describe('Post/Page ID'),
      content_type: z.string().optional().default('page'),
      tree: z.array(z.any()).describe('Elementor JSON-träd (sections-array)'),
      clear_elementor_css: z.boolean().optional().default(true)
        .describe('Rensa Elementors CSS-cache via meta (rekommenderas)'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.content_type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';

        const meta = {
          _elementor_data: JSON.stringify(args.tree),
          _elementor_edit_mode: 'builder',
        };

        if (args.clear_elementor_css) {
          // Sätt version-timestamp för att trigga CSS-regenerering
          meta._elementor_version = '3.0.0';
          meta._elementor_css = '';
        }

        await wpFetch(s, `${endpoint}/${args.id}`, {
          method: 'POST',
          body: { meta },
        });

        return text({
          injected: true,
          id: args.id,
          sections: args.tree.length,
          elements_total: findInTree(args.tree, () => true).length,
          cache_cleared: args.clear_elementor_css,
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_elementor_find',
    'Hitta Elementor-element via ID, widgetType, eller textinnehåll. ' +
    'Användbart för att lokalisera ett specifikt element innan du redigerar det.',
    {
      site: z.string().optional(),
      id: z.number().describe('Post/Page ID'),
      content_type: z.string().optional().default('page'),
      element_id: z.string().optional().describe('Elementets unika ID (hexsträng, t.ex. "3a2f1c")'),
      widget_type: z.string().optional().describe('widgetType att söka (t.ex. "heading", "text-editor", "image", "button")'),
      el_type: z.string().optional().describe('elType att söka: "section", "column", "widget"'),
      text_contains: z.string().optional().describe('Sök efter element vars inställningar innehåller denna text'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const { data, isEmpty } = await fetchElementorData(s, args.id, args.content_type, wpFetch);

        if (isEmpty) return err('Sidan har inget Elementor-innehåll');

        const results = findInTree(data, (el) => {
          if (args.element_id && el.id !== args.element_id) return false;
          if (args.widget_type && el.widgetType !== args.widget_type) return false;
          if (args.el_type && el.elType !== args.el_type) return false;
          if (args.text_contains) {
            const settingsStr = JSON.stringify(el.settings || '').toLowerCase();
            if (!settingsStr.includes(args.text_contains.toLowerCase())) return false;
          }
          return true;
        });

        return text({
          found: results.length,
          elements: results.map(summarizeElement),
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_elementor_update',
    'Uppdatera ett specifikt Elementor-elements inställningar via dess element-ID. ' +
    'Hämta element-ID med perispa_elementor_find. ' +
    'Skriver direkt till _elementor_data utan att röra övriga element.',
    {
      site: z.string().optional(),
      id: z.number().describe('Post/Page ID'),
      content_type: z.string().optional().default('page'),
      element_id: z.string().describe('Elementets unika ID (från perispa_elementor_find)'),
      settings: z.record(z.any()).describe(
        'Settings-nycklar att uppdatera. Exempel: { "title": "Ny rubrik", "header_size": "h2" }. ' +
        'Mergas med befintliga settings — befintliga nycklar som ej anges behålls.'
      ),
      replace_content: z.string().optional().describe('Ersätt elementets hela content (för text-editor widgets)'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const { data, isEmpty, endpoint } = await fetchElementorData(s, args.id, args.content_type, wpFetch);

        if (isEmpty) return err('Sidan har inget Elementor-innehåll');

        const found = updateInTree(data, args.element_id, (el) => {
          const updated = { ...el, settings: { ...(el.settings || {}), ...args.settings } };
          if (args.replace_content !== undefined && el.widgetType === 'text-editor') {
            updated.settings.editor = args.replace_content;
          }
          return updated;
        });

        if (!found) {
          return err(
            `Element med ID "${args.element_id}" hittades inte. ` +
            `Använd perispa_elementor_find för att hitta rätt ID.`
          );
        }

        // Skriv tillbaka
        await wpFetch(s, `${endpoint}/${args.id}`, {
          method: 'POST',
          body: {
            meta: {
              _elementor_data: JSON.stringify(data),
              _elementor_edit_mode: 'builder',
              _elementor_css: '', // rensa cache
            },
          },
        });

        return text({
          updated: true,
          element_id: args.element_id,
          settings_updated: Object.keys(args.settings),
          page_id: args.id,
        });
      } catch (e) { return err(e.message); }
    }
  );
};
