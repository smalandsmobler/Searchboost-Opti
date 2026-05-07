/**
 * perispa — Bricks Builder Deep Tools
 *
 * Bricks lagrar siddata som JSON i postmeta: _bricks_data (array av element-objekt)
 * Struktur: platt array med parent/children-relationer
 * Varje element har: id, parent, type, settings, children[]
 *
 * Tools:
 *   perispa_bricks_extract  — Läs och parse:a _bricks_data
 *   perispa_bricks_inject   — Skriv JSON-träd tillbaka till _bricks_data
 *   perispa_bricks_find     — Hitta element via id, type, eller textinnehåll
 *   perispa_bricks_update   — Uppdatera ett elements settings via dess element-ID
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

async function fetchBricksData(s, postId, contentType, wpFetch) {
  const endpoint = contentType === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';
  const res = await wpFetch(s, `${endpoint}/${postId}`, { params: { context: 'edit' } });
  const post = res.data;

  let raw = post.meta?._bricks_data || '';

  // Bricks kan också använda _bricks_page_settings
  if (!raw) return { data: [], raw: '[]', endpoint, post, isEmpty: true };

  // Ibland serialiserat med PHP serialize — prova JSON direkt
  if (!raw.trim().startsWith('[') && !raw.trim().startsWith('{')) {
    try {
      raw = Buffer.from(raw, 'base64').toString('utf-8');
    } catch { /* inte base64 */ }
  }

  const parsed = JSON.parse(raw);
  return { data: Array.isArray(parsed) ? parsed : [], raw, endpoint, post, isEmpty: false };
}

/**
 * Bygger ett träd från den platta Bricks-arrayen
 */
function buildTree(elements) {
  const byId = {};
  for (const el of elements) byId[el.id] = { ...el, _children: [] };

  const roots = [];
  for (const el of elements) {
    if (!el.parent || !byId[el.parent]) {
      roots.push(byId[el.id]);
    } else {
      byId[el.parent]._children.push(byId[el.id]);
    }
  }
  return roots;
}

function summarizeBricksElement(el) {
  return {
    id: el.id,
    type: el.name || el.type || 'unknown',
    parent: el.parent || null,
    label: el.label || null,
    settings_keys: Object.keys(el.settings || {}).slice(0, 15),
    // Vanliga textfält
    text: el.settings?.text?.slice(0, 100)
      || el.settings?.content?.slice(0, 100)
      || el.settings?.heading?.slice(0, 100)
      || null,
    tag: el.settings?.tag || null,
    link: el.settings?.link?.url || null,
    image: el.settings?.image?.url || el.settings?.image?.id || null,
    children_count: el.children?.length || 0,
  };
}

module.exports = function registerBricksTools(server, getSite, wpFetch) {

  server.tool(
    'perispa_bricks_extract',
    'Läs och parse:a en Bricks Builder-sidas struktur. ' +
    'Returnerar elementlistan som renläsbar JSON med träd-hierarki. ' +
    'Krävs för att förstå sidans uppbyggnad innan du redigerar.',
    {
      site: z.string().optional(),
      id: z.number().describe('Post/Page ID'),
      content_type: z.string().optional().default('page').describe('"page" eller "post"'),
      summary_only: z.boolean().optional().default(true)
        .describe('true = kompakt vy, false = fullständigt JSON'),
      as_tree: z.boolean().optional().default(true)
        .describe('true = hierarkisk träd-vy, false = platt array (Bricks native format)'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const { data, isEmpty } = await fetchBricksData(s, args.id, args.content_type, wpFetch);

        if (isEmpty) {
          return text({
            id: args.id,
            bricks_active: false,
            message: 'Sidan har inget Bricks-innehåll. Kontrollera att Bricks Builder är aktiverat.',
          });
        }

        if (!args.summary_only) {
          return text({
            id: args.id,
            bricks_active: true,
            elements_total: data.length,
            data: args.as_tree ? buildTree(data) : data,
          });
        }

        return text({
          id: args.id,
          bricks_active: true,
          elements_total: data.length,
          elements: data.map(summarizeBricksElement),
          tree_roots: buildTree(data).map((r) => ({
            id: r.id,
            type: r.name || r.type,
            children: r._children?.length || 0,
          })),
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_bricks_inject',
    'Skriv en (redigerad) element-array tillbaka till en Bricks Builder-sida. ' +
    'OBS: felaktig data kan förstöra sidan — skapa snapshot med perispa_create_snapshot först.',
    {
      site: z.string().optional(),
      id: z.number().describe('Post/Page ID'),
      content_type: z.string().optional().default('page'),
      elements: z.array(z.any()).describe('Bricks element-array (platt format med parent-relationer)'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.content_type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';

        await wpFetch(s, `${endpoint}/${args.id}`, {
          method: 'POST',
          body: {
            meta: {
              _bricks_data: JSON.stringify(args.elements),
              _bricks_editor_mode: 'bricks',
            },
          },
        });

        return text({
          injected: true,
          id: args.id,
          elements_count: args.elements.length,
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_bricks_find',
    'Hitta Bricks Builder-element via ID, typ, eller textinnehåll.',
    {
      site: z.string().optional(),
      id: z.number().describe('Post/Page ID'),
      content_type: z.string().optional().default('page'),
      element_id: z.string().optional().describe('Elementets ID'),
      element_type: z.string().optional().describe('Element-typ (t.ex. "heading", "text", "image", "button", "section", "div")'),
      text_contains: z.string().optional().describe('Sök på textinnehåll i settings'),
      parent_id: z.string().optional().describe('Filtrera på parent-element ID'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const { data, isEmpty } = await fetchBricksData(s, args.id, args.content_type, wpFetch);

        if (isEmpty) return err('Sidan har inget Bricks-innehåll');

        const results = data.filter((el) => {
          if (args.element_id && el.id !== args.element_id) return false;
          if (args.element_type) {
            const name = el.name || el.type || '';
            if (!name.toLowerCase().includes(args.element_type.toLowerCase())) return false;
          }
          if (args.parent_id && el.parent !== args.parent_id) return false;
          if (args.text_contains) {
            const settingsStr = JSON.stringify(el.settings || '').toLowerCase();
            if (!settingsStr.includes(args.text_contains.toLowerCase())) return false;
          }
          return true;
        });

        return text({
          found: results.length,
          elements: results.map(summarizeBricksElement),
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_bricks_update',
    'Uppdatera ett specifikt Bricks Builder-elements inställningar via dess element-ID. ' +
    'Hämta element-ID med perispa_bricks_find. ' +
    'Skriver direkt till _bricks_data utan att röra övriga element.',
    {
      site: z.string().optional(),
      id: z.number().describe('Post/Page ID'),
      content_type: z.string().optional().default('page'),
      element_id: z.string().describe('Elementets ID (från perispa_bricks_find)'),
      settings: z.record(z.any()).describe(
        'Settings-nycklar att uppdatera. Mergas med befintliga settings. ' +
        'Exempel: { "text": "Ny text", "tag": "h2" }'
      ),
      new_label: z.string().optional().describe('Sätt ett nytt internt namn/label på elementet'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const { data, isEmpty, endpoint } = await fetchBricksData(s, args.id, args.content_type, wpFetch);

        if (isEmpty) return err('Sidan har inget Bricks-innehåll');

        const idx = data.findIndex((el) => el.id === args.element_id);
        if (idx === -1) {
          return err(
            `Element med ID "${args.element_id}" hittades inte. ` +
            `Använd perispa_bricks_find för att hitta rätt ID.`
          );
        }

        data[idx] = {
          ...data[idx],
          settings: { ...(data[idx].settings || {}), ...args.settings },
          ...(args.new_label ? { label: args.new_label } : {}),
        };

        await wpFetch(s, `${endpoint}/${args.id}`, {
          method: 'POST',
          body: {
            meta: {
              _bricks_data: JSON.stringify(data),
              _bricks_editor_mode: 'bricks',
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
