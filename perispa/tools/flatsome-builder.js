/**
 * perispa — Flatsome UX Builder Intelligence
 * Reverse-engineered from Respira v6.0 patterns + Flatsome 3.20.x shortcode spec.
 *
 * Flatsome stores content as WordPress shortcodes in post_content.
 * Structure: [section] > [row] > [col] > elements
 *
 * Tools:
 *   perispa_extract_flatsome   — Parse page content to JSON tree
 *   perispa_inject_flatsome    — Write JSON tree back as shortcodes
 *   perispa_find_flatsome_el   — Find element(s) by text / type / attr
 *   perispa_update_flatsome_el — Update a single element's attrs or inner HTML
 *   perispa_add_flatsome_section — Append or insert a full section
 *   perispa_build_flatsome_page  — Build page from named pattern template
 *   perispa_flatsome_patterns    — List all available pattern templates
 */

'use strict';
const { z } = require('zod');

// ─────────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────────

function text(content) {
  return { content: [{ type: 'text', text: typeof content === 'string' ? content : JSON.stringify(content, null, 2) }] };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], isError: true };
}

// ─────────────────────────────────────────────────────────────────
// SHORTCODE PARSER  →  JSON tree
// ─────────────────────────────────────────────────────────────────

const SELF_CLOSING = new Set([
  'ux_image', 'ux_video', 'gap', 'divider', 'logo', 'follow', 'share',
  'search', 'sale_countdown', 'map', 'ux_products', 'product_categories',
  'ux_product_flip', 'blog_posts',
]);

/**
 * Tokenise a shortcode string into a flat list of tokens.
 * Each token: { type: 'open'|'close'|'self'|'html', tag?, attrs?, raw, html? }
 */
function tokenise(content) {
  const tokens = [];
  // Matches [tag attrs], [/tag], and raw HTML between
  const SC = /\[(\/?)([\w-]+)([^\]]*)\]/g;
  let last = 0;

  for (const m of content.matchAll(SC)) {
    const pre = content.slice(last, m.index);
    if (pre.trim()) tokens.push({ type: 'html', html: pre });

    const closing = m[1] === '/';
    const tag = m[2];
    const attrStr = m[3].trim();

    if (closing) {
      tokens.push({ type: 'close', tag, raw: m[0] });
    } else if (SELF_CLOSING.has(tag) || attrStr.endsWith('/')) {
      tokens.push({ type: 'self', tag, attrs: parseAttrs(attrStr.replace(/\/$/, '')), raw: m[0] });
    } else {
      tokens.push({ type: 'open', tag, attrs: parseAttrs(attrStr), raw: m[0] });
    }
    last = m.index + m[0].length;
  }

  const tail = content.slice(last);
  if (tail.trim()) tokens.push({ type: 'html', html: tail });

  return tokens;
}

/**
 * Parse shortcode attribute string → { key: value, ... }
 * Handles: key="value" key='value' key=value standalone_key
 */
function parseAttrs(str) {
  const attrs = {};
  if (!str) return attrs;
  // Matches: key="val", key='val', key=word, bare_key
  const RE = /(\w[\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
  for (const m of str.matchAll(RE)) {
    const key = m[1];
    const val = m[2] !== undefined ? m[2]
              : m[3] !== undefined ? m[3]
              : m[4] !== undefined ? m[4]
              : true; // bare attribute = true
    attrs[key] = val;
  }
  return attrs;
}

/**
 * Build a JSON node tree from a flat token list.
 * Returns array of root-level nodes.
 */
function buildTree(tokens) {
  const stack = [{ children: [] }];

  for (const tok of tokens) {
    const parent = stack[stack.length - 1];

    if (tok.type === 'html') {
      parent.children.push({ type: 'html', html: tok.html });

    } else if (tok.type === 'self') {
      parent.children.push({ type: 'element', tag: tok.tag, attrs: tok.attrs, children: [], selfClosing: true });

    } else if (tok.type === 'open') {
      const node = { type: 'element', tag: tok.tag, attrs: tok.attrs, children: [], selfClosing: false };
      parent.children.push(node);
      stack.push(node);

    } else if (tok.type === 'close') {
      // Pop until we find matching tag (handles malformed nesting gracefully)
      while (stack.length > 1 && stack[stack.length - 1].tag !== tok.tag) {
        stack.pop();
      }
      if (stack.length > 1) stack.pop();
    }
  }

  return stack[0].children;
}

function parseFlatsomeContent(raw) {
  return buildTree(tokenise(raw || ''));
}

// ─────────────────────────────────────────────────────────────────
// SERIALISER  →  shortcode string
// ─────────────────────────────────────────────────────────────────

function attrsToString(attrs) {
  return Object.entries(attrs || {})
    .map(([k, v]) => v === true ? k : `${k}="${v}"`)
    .join(' ');
}

function serialiseNode(node) {
  if (node.type === 'html') return node.html;
  if (node.type !== 'element') return '';

  const attrStr = attrsToString(node.attrs);
  const open = attrStr ? `[${node.tag} ${attrStr}]` : `[${node.tag}]`;

  if (node.selfClosing || SELF_CLOSING.has(node.tag)) {
    return open;
  }

  const inner = (node.children || []).map(serialiseNode).join('');
  return `${open}${inner}[/${node.tag}]`;
}

function serialiseTree(nodes) {
  return (nodes || []).map(serialiseNode).join('\n');
}

// ─────────────────────────────────────────────────────────────────
// TREE HELPERS
// ─────────────────────────────────────────────────────────────────

let _idCounter = 1;
function nodeId(node) {
  if (!node._id) node._id = `n${_idCounter++}`;
  return node._id;
}

function walkNodes(nodes, cb) {
  for (const n of nodes || []) {
    cb(n);
    if (n.children) walkNodes(n.children, cb);
  }
}

function findNodes(nodes, predicate) {
  const results = [];
  walkNodes(nodes, n => { if (predicate(n)) results.push(n); });
  return results;
}

function findById(nodes, id) {
  let found = null;
  walkNodes(nodes, n => { if (nodeId(n) === id) found = n; });
  return found;
}

function nodeText(node) {
  if (node.type === 'html') return node.html;
  return (node.children || []).map(nodeText).join(' ');
}

// ─────────────────────────────────────────────────────────────────
// PATTERN TEMPLATES
// ─────────────────────────────────────────────────────────────────

const PATTERNS = {

  hero_banner: {
    label: 'Hero Banner (full-width bild + text)',
    description: 'Stor hero-sektion med bakgrundsbild, rubrik och CTA-knapp',
    shortcode: (p = {}) => `[section bg="${p.bg || ''}" bg_overlay="${p.overlay || '0.4'}" bg_color="${p.bg_color || '#1a1a2e'}" bg_pos="center" padding="${p.padding || '200px'}"]
[row]
[col span="8" span__sm="12" align="center" margin="0 auto"]
[title style="bold" align="center" color="${p.text_color || '#ffffff'}"]${p.title || 'Din rubrik här'}[/title]
[text_box text_color="light"]
<p style="font-size:1.2em;opacity:0.9">${p.subtitle || 'Din undertext här'}</p>
[/text_box]
[button text="${p.cta_text || 'Kontakta oss'}" link="${p.cta_link || '#'}" style="outline" color="white" size="large" margin="20px 0 0"]
[/col]
[/row]
[/section]`,
  },

  three_column_features: {
    label: '3-kolumner med ikoner/features',
    description: 'Tre kolumner med ikon, rubrik och text per kolumn',
    shortcode: (p = {}) => `[section padding="60px"]
[row col_style="divide"]
[col span="4" span__sm="12"]
[featured_box img="${p.icon1 || ''}" pos="left" title="${p.title1 || 'Feature 1'}"]${p.text1 || 'Beskriv din tjänst eller produkt här.'}[/featured_box]
[/col]
[col span="4" span__sm="12"]
[featured_box img="${p.icon2 || ''}" pos="left" title="${p.title2 || 'Feature 2'}"]${p.text2 || 'Beskriv din tjänst eller produkt här.'}[/featured_box]
[/col]
[col span="4" span__sm="12"]
[featured_box img="${p.icon3 || ''}" pos="left" title="${p.title3 || 'Feature 3'}"]${p.text3 || 'Beskriv din tjänst eller produkt här.'}[/featured_box]
[/col]
[/row]
[/section]`,
  },

  product_grid: {
    label: 'WooCommerce produktgrid',
    description: 'Sektion med produktgrid, valfritt kategorifilter',
    shortcode: (p = {}) => `[section padding="60px" bg_color="${p.bg_color || '#f8f8f8'}"]
[row]
[col span="12"]
[title style="bold" align="center"]${p.title || 'Våra produkter'}[/title]
[text_box text_color="dark" padding="0 0 30px" align="center"]
<p>${p.subtitle || ''}</p>
[/text_box]
[ux_products columns="${p.columns || '4'}" cat="${p.cat || ''}" orderby="${p.orderby || 'date'}" count="${p.count || '8'}"]
[/col]
[/row]
[/section]`,
  },

  testimonial_section: {
    label: 'Kundrecensioner / testimonials',
    description: 'Sektion med en eller flera kundcitat',
    shortcode: (p = {}) => `[section bg_color="${p.bg_color || '#1a1a2e'}" padding="80px"]
[row]
[col span="8" span__sm="12" align="center" margin="0 auto"]
[title style="bold" align="center" color="${p.title_color || '#ffffff'}"]${p.title || 'Vad våra kunder säger'}[/title]
[gap height="30px"]
[testimonial name="${p.name1 || 'Kund 1'}" company="${p.company1 || ''}" image="${p.image1 || ''}" img_border="round"]${p.quote1 || 'Kundcitat här.'}[/testimonial]
[/col]
[/row]
[/section]`,
  },

  cta_section: {
    label: 'Call to Action — enkel sektion',
    description: 'CTA-band med rubrik och knapp',
    shortcode: (p = {}) => `[section bg_color="${p.bg_color || '#4a90d9'}" padding="60px"]
[row]
[col span="12" align="center"]
[title style="bold" align="center" color="${p.title_color || '#ffffff'}"]${p.title || 'Redo att ta nästa steg?'}[/title]
[text_box text_color="light" align="center" padding="0 0 20px"]
<p>${p.subtitle || 'Kontakta oss idag.'}</p>
[/text_box]
[button text="${p.cta_text || 'Kom igång'}" link="${p.cta_link || '/kontakt/'}" style="outline" color="white" size="large"]
[/col]
[/row]
[/section]`,
  },

  two_col_image_text: {
    label: '2-kolumn: bild + text (eller omvänt)',
    description: 'Klassisk bild-till-vänster-text-till-höger sektion',
    shortcode: (p = {}) => `[section padding="80px"]
[row]
[col span="6" span__sm="12"]
[ux_image id="${p.image_id || ''}" height="${p.image_height || '450px'}"]
[/col]
[col span="6" span__sm="12" align="left" padding="40px 0 0"]
[title style="bold"]${p.title || 'Om oss'}[/title]
[text_box]
<p>${p.text || 'Beskriv er verksamhet här.'}</p>
[/text_box]
${p.cta_text ? `[button text="${p.cta_text}" link="${p.cta_link || '#'}"]` : ''}
[/col]
[/row]
[/section]`,
  },

  category_grid: {
    label: 'Produktkategorier i grid',
    description: 'Visar WooCommerce produktkategorier som bildkort',
    shortcode: (p = {}) => `[section padding="60px" bg_color="${p.bg_color || '#fff'}"]
[row]
[col span="12"]
[title style="bold" align="center"]${p.title || 'Produktkategorier'}[/title]
[gap height="20px"]
[product_categories columns="${p.columns || '3'}" parent="${p.parent || '0'}" ids="${p.ids || ''}"]
[/col]
[/row]
[/section]`,
  },

  icon_list: {
    label: 'Ikonlista med 4 punkter',
    description: 'Fyra punkter med ikon och text, t.ex. fördelar/USPs',
    shortcode: (p = {}) => `[section padding="60px"]
[row]
[col span="12" align="center"]
[title style="bold" align="center"]${p.title || 'Varför välja oss?'}[/title]
[gap height="30px"]
[/col]
[/row]
[row col_style="small-divide"]
[col span="3" span__sm="12"]
[icon_box icon="${p.icon1 || 'icon-check'}" title="${p.title1 || 'Kvalitet'}"]${p.text1 || ''}[/icon_box]
[/col]
[col span="3" span__sm="12"]
[icon_box icon="${p.icon2 || 'icon-lightning'}" title="${p.title2 || 'Snabbhet'}"]${p.text2 || ''}[/icon_box]
[/col]
[col span="3" span__sm="12"]
[icon_box icon="${p.icon3 || 'icon-shield'}" title="${p.title3 || 'Trygghet'}"]${p.text3 || ''}[/icon_box]
[/col]
[col span="3" span__sm="12"]
[icon_box icon="${p.icon4 || 'icon-heart'}" title="${p.title4 || 'Support'}"]${p.text4 || ''}[/icon_box]
[/col]
[/row]
[/section]`,
  },

  accordion_faq: {
    label: 'FAQ-accordion',
    description: 'Vanliga frågor och svar i accordion-format',
    shortcode: (p = {}) => `[section padding="60px" bg_color="${p.bg_color || '#f8f8f8'}"]
[row]
[col span="8" span__sm="12" align="center" margin="0 auto"]
[title style="bold" align="center"]${p.title || 'Vanliga frågor'}[/title]
[gap height="30px"]
[accordion]
[accordion-item title="${p.q1 || 'Fråga 1'}"]${p.a1 || 'Svar 1'}[/accordion-item]
[accordion-item title="${p.q2 || 'Fråga 2'}"]${p.a2 || 'Svar 2'}[/accordion-item]
[accordion-item title="${p.q3 || 'Fråga 3'}"]${p.a3 || 'Svar 3'}[/accordion-item]
[/accordion]
[/col]
[/row]
[/section]`,
  },

  blank_section: {
    label: 'Tom sektion (custom innehåll)',
    description: 'Grundstruktur section > row > col, fyll i själv',
    shortcode: (p = {}) => `[section padding="${p.padding || '60px'}" bg_color="${p.bg_color || ''}"]
[row]
[col span="${p.span || '12'}" span__sm="12"]
[text_box]
<p>${p.content || 'Lägg in innehåll här.'}</p>
[/text_box]
[/col]
[/row]
[/section]`,
  },
};

// ─────────────────────────────────────────────────────────────────
// TOOL REGISTRATION
// ─────────────────────────────────────────────────────────────────

module.exports = function registerFlatsomeTools(server, getSite, wpFetch) {

  // ── 1. EXTRACT ──────────────────────────────────────────────────
  server.tool(
    'perispa_extract_flatsome',
    'Parsa en Flatsome UX Builder-sidas innehall till ett JSON-nodtrad. Returnerar tag, attrs och children for varje element.',
    {
      page_id: z.number().describe('Post/page ID'),
      type:    z.enum(['page', 'post', 'product']).default('page'),
      site:    z.string().optional(),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.type === 'post' ? 'wp/v2/posts' : args.type === 'product' ? 'wc/v3/products' : 'wp/v2/pages';
        const r = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
        const raw = r.data?.content?.raw || r.data?.description || '';
        if (!raw) return err(`Inget innehall hittades for ID ${args.page_id}`);

        const tree = parseFlatsomeContent(raw);
        // Stamp IDs
        walkNodes(tree, nodeId);

        const sections = tree.filter(n => n.type === 'element' && n.tag === 'section');
        const summary = {
          page_id: args.page_id,
          total_nodes: 0,
          sections: sections.length,
          raw_length: raw.length,
        };
        walkNodes(tree, () => summary.total_nodes++);

        return text({ summary, tree });
      } catch (e) {
        return err(e.message);
      }
    }
  );

  // ── 2. INJECT ───────────────────────────────────────────────────
  server.tool(
    'perispa_inject_flatsome',
    'Skriv tillbaka ett JSON-nodtrad som Flatsome-shortcodes pa en sida. Tar emot tree fran perispa_extract_flatsome (eventuellt modifierat).',
    {
      page_id: z.number(),
      tree:    z.array(z.any()).describe('Nodtrad fran extract, eventuellt modifierat'),
      type:    z.enum(['page', 'post', 'product']).default('page'),
      site:    z.string().optional(),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const shortcode = serialiseTree(args.tree);
        const endpoint = args.type === 'post' ? 'wp/v2/posts' : args.type === 'product' ? 'wc/v3/products' : 'wp/v2/pages';
        await wpFetch(s, `${endpoint}/${args.page_id}`, {
          method: 'POST',
          body: { content: shortcode },
        });
        return text({ ok: true, page_id: args.page_id, shortcode_length: shortcode.length });
      } catch (e) {
        return err(e.message);
      }
    }
  );

  // ── 3. FIND ELEMENT ─────────────────────────────────────────────
  server.tool(
    'perispa_find_flatsome_el',
    'Hitta element i ett Flatsome-nodtrad via tag-typ, textinnehall eller attributvarde.',
    {
      page_id:     z.number(),
      type:        z.enum(['page', 'post', 'product']).default('page'),
      tag:         z.string().optional().describe('T.ex. "ux_banner", "title", "text_box"'),
      search_text: z.string().optional().describe('Text att soka efter i elementets innehall'),
      attr_key:    z.string().optional().describe('Attributnamn att matcha'),
      attr_value:  z.string().optional().describe('Attributvarde att matcha'),
      site:        z.string().optional(),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.type === 'post' ? 'wp/v2/posts' : args.type === 'product' ? 'wc/v3/products' : 'wp/v2/pages';
        const r = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
        const raw = r.data?.content?.raw || '';
        const tree = parseFlatsomeContent(raw);
        walkNodes(tree, nodeId);

        const matches = findNodes(tree, n => {
          if (n.type !== 'element') return false;
          if (args.tag && n.tag !== args.tag) return false;
          if (args.search_text) {
            const t = nodeText(n).toLowerCase();
            if (!t.includes(args.search_text.toLowerCase())) return false;
          }
          if (args.attr_key) {
            if (args.attr_value !== undefined) {
              if (n.attrs?.[args.attr_key] !== args.attr_value) return false;
            } else {
              if (!(args.attr_key in (n.attrs || {}))) return false;
            }
          }
          return true;
        });

        return text({ found: matches.length, elements: matches.map(m => ({
          _id: m._id, tag: m.tag, attrs: m.attrs,
          preview: nodeText(m).slice(0, 120),
        })) });
      } catch (e) {
        return err(e.message);
      }
    }
  );

  // ── 4. UPDATE ELEMENT ───────────────────────────────────────────
  server.tool(
    'perispa_update_flatsome_el',
    'Uppdatera ett specifikt element i Flatsome-innehallet — byt attribut eller inner-HTML. Krav: kora extract forst, sedan update, sedan inject.',
    {
      page_id:   z.number(),
      type:      z.enum(['page', 'post', 'product']).default('page'),
      element_id: z.string().optional().describe('_id fran find_flatsome_el'),
      tag:        z.string().optional().describe('Om element_id saknas: matcha forsta elementet med denna tag'),
      search_text:z.string().optional().describe('Om element_id saknas: matcha element med denna text'),
      new_attrs:  z.record(z.string()).optional().describe('Nya/uppdaterade attribut (mergas)'),
      new_html:   z.string().optional().describe('Ersatt children med denna HTML-strang'),
      site:       z.string().optional(),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.type === 'post' ? 'wp/v2/posts' : args.type === 'product' ? 'wc/v3/products' : 'wp/v2/pages';
        const r = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
        const raw = r.data?.content?.raw || '';
        const tree = parseFlatsomeContent(raw);
        walkNodes(tree, nodeId);

        // Find target
        let target = null;
        if (args.element_id) {
          target = findById(tree, args.element_id);
        } else {
          const matches = findNodes(tree, n => {
            if (n.type !== 'element') return false;
            if (args.tag && n.tag !== args.tag) return false;
            if (args.search_text) {
              if (!nodeText(n).toLowerCase().includes(args.search_text.toLowerCase())) return false;
            }
            return true;
          });
          target = matches[0] || null;
        }

        if (!target) return err('Element hittades inte — kor perispa_find_flatsome_el forst');

        // Apply changes
        if (args.new_attrs) Object.assign(target.attrs, args.new_attrs);
        if (args.new_html !== undefined) {
          target.children = [{ type: 'html', html: args.new_html }];
        }

        // Write back
        const shortcode = serialiseTree(tree);
        await wpFetch(s, `${endpoint}/${args.page_id}`, {
          method: 'POST',
          body: { content: shortcode },
        });

        return text({ ok: true, updated: { _id: target._id, tag: target.tag, attrs: target.attrs } });
      } catch (e) {
        return err(e.message);
      }
    }
  );

  // ── 5. ADD SECTION ──────────────────────────────────────────────
  server.tool(
    'perispa_add_flatsome_section',
    'Lagg till en ny sektion pa en Flatsome-sida. Kan infoga i borjan, slutet eller fore/efter en annan sektion (via index).',
    {
      page_id:   z.number(),
      type:      z.enum(['page', 'post', 'product']).default('page'),
      shortcode: z.string().describe('Komplett shortcode-strang for sektionen, t.ex. fran perispa_build_flatsome_page'),
      position:  z.enum(['first', 'last', 'before_index', 'after_index']).default('last'),
      index:     z.number().optional().describe('Sektionsindex (0-baserat) for before/after'),
      site:      z.string().optional(),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.type === 'post' ? 'wp/v2/posts' : args.type === 'product' ? 'wc/v3/products' : 'wp/v2/pages';
        const r = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
        const raw = r.data?.content?.raw || '';
        const tree = parseFlatsomeContent(raw);

        const newNodes = parseFlatsomeContent(args.shortcode);
        const sectionIdxs = tree.reduce((acc, n, i) => { if (n.type === 'element' && n.tag === 'section') acc.push(i); return acc; }, []);

        if (args.position === 'first') {
          tree.unshift(...newNodes);
        } else if (args.position === 'before_index' && args.index !== undefined) {
          const targetIdx = sectionIdxs[args.index] ?? 0;
          tree.splice(targetIdx, 0, ...newNodes);
        } else if (args.position === 'after_index' && args.index !== undefined) {
          const targetIdx = (sectionIdxs[args.index] ?? tree.length - 1) + 1;
          tree.splice(targetIdx, 0, ...newNodes);
        } else {
          tree.push(...newNodes);
        }

        const shortcode = serialiseTree(tree);
        await wpFetch(s, `${endpoint}/${args.page_id}`, {
          method: 'POST',
          body: { content: shortcode },
        });

        return text({ ok: true, page_id: args.page_id, total_sections: sectionIdxs.length + newNodes.length });
      } catch (e) {
        return err(e.message);
      }
    }
  );

  // ── 6. BUILD FROM PATTERN ───────────────────────────────────────
  server.tool(
    'perispa_build_flatsome_page',
    'Bygg en komplett Flatsome-sida fran namngivna pattern-templates. Kan kombinera flera patterns och skriva direkt till en sida.',
    {
      page_id:   z.number().optional().describe('Om angivet skrivs sidan direkt. Om utelämnat returneras bara shortcode-strängen.'),
      type:      z.enum(['page', 'post', 'product']).default('page'),
      sections:  z.array(z.object({
        pattern: z.string().describe('Pattern-namn, t.ex. hero_banner, product_grid, cta_section'),
        params:  z.record(z.any()).optional().describe('Parametrar for patternen, t.ex. { title: "Min rubrik", bg: "123" }'),
      })).describe('Lista av sektioner att bygga'),
      site:      z.string().optional(),
    },
    async (args) => {
      try {
        const parts = [];
        for (const sec of args.sections) {
          const p = PATTERNS[sec.pattern];
          if (!p) return err(`Okant pattern: "${sec.pattern}". Tillgangliga: ${Object.keys(PATTERNS).join(', ')}`);
          parts.push(p.shortcode(sec.params || {}));
        }
        const fullShortcode = parts.join('\n\n');

        if (args.page_id) {
          const s = getSite(args.site);
          const endpoint = args.type === 'post' ? 'wp/v2/posts' : args.type === 'product' ? 'wc/v3/products' : 'wp/v2/pages';
          await wpFetch(s, `${endpoint}/${args.page_id}`, {
            method: 'POST',
            body: { content: fullShortcode },
          });
          return text({ ok: true, page_id: args.page_id, sections_built: parts.length, shortcode_length: fullShortcode.length });
        }

        return text({ shortcode: fullShortcode, sections_built: parts.length });
      } catch (e) {
        return err(e.message);
      }
    }
  );

  // ── 7. LIST PATTERNS ────────────────────────────────────────────
  server.tool(
    'perispa_flatsome_patterns',
    'Lista alla tillgangliga Flatsome section-templates med namn och beskrivning.',
    { site: z.string().optional() },
    async () => {
      const list = Object.entries(PATTERNS).map(([key, p]) => ({
        pattern: key,
        label: p.label,
        description: p.description,
      }));
      return text({ patterns: list, total: list.length });
    }
  );

  // ── 8. DELETE SECTION ───────────────────────────────────────────
  server.tool(
    'perispa_delete_flatsome_section',
    'Ta bort en hel section fran en Flatsome-sida via sektionsindex (0-baserat).',
    {
      page_id:       z.number(),
      section_index: z.number().describe('Index for sektionen att ta bort (0 = forsta)'),
      type:          z.enum(['page', 'post', 'product']).default('page'),
      site:          z.string().optional(),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.type === 'post' ? 'wp/v2/posts' : args.type === 'product' ? 'wc/v3/products' : 'wp/v2/pages';
        const r = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
        const raw = r.data?.content?.raw || '';
        const tree = parseFlatsomeContent(raw);

        let sectionCount = -1;
        const newTree = tree.filter(n => {
          if (n.type === 'element' && n.tag === 'section') {
            sectionCount++;
            return sectionCount !== args.section_index;
          }
          return true;
        });

        if (sectionCount < args.section_index) return err(`Sektionsindex ${args.section_index} finns inte (${sectionCount + 1} sektioner totalt)`);

        const shortcode = serialiseTree(newTree);
        await wpFetch(s, `${endpoint}/${args.page_id}`, {
          method: 'POST',
          body: { content: shortcode },
        });
        return text({ ok: true, deleted_index: args.section_index, remaining_sections: sectionCount });
      } catch (e) {
        return err(e.message);
      }
    }
  );

};
