/**
 * perispa — ACF (Advanced Custom Fields) Tools
 * Implementerad via WP REST API + post meta
 *
 * Fungerar med:
 *  - ACF Free (läs/skriv via ?acf=true eller meta-fält)
 *  - ACF Pro (repeaters, flexible content via meta-serialisering)
 *  - ACF REST API om aktiverat (visar acf-nyckel i svar)
 *
 * @since perispa 2.0
 */

const { z } = require('zod');

module.exports = function registerAcfTools(server, getSite, wpFetch) {

  // --- Hjälpfunktioner ---

  /**
   * Hämta ACF-fältvärden från ett inlägg.
   * Returnerar antingen acf-nyckeln (om ACF REST är aktivt) eller meta.
   */
  async function getAcfFields(site, postId, postType = 'posts') {
    try {
      const res = await wpFetch(site, `wp/v2/${postType}/${postId}`, {
        params: { context: 'edit', acf: 'true' },
      });
      if (res.data?.acf && typeof res.data.acf === 'object') {
        return { source: 'acf_rest', fields: res.data.acf };
      }
      // Fallback: filtrera ut ACF-meta (börjar inte med _)
      const meta = res.data?.meta || {};
      const acfMeta = {};
      for (const [k, v] of Object.entries(meta)) {
        if (!k.startsWith('_') && !k.startsWith('rank_math') && !k.startsWith('_yoast')) {
          acfMeta[k] = v;
        }
      }
      return { source: 'meta', fields: acfMeta };
    } catch (e) {
      throw new Error(`Kunde inte hämta fält för post ${postId}: ${e.message}`);
    }
  }

  /**
   * Hämta rätt REST-endpoint för en post_type.
   */
  async function getEndpoint(site, postType) {
    // Standardisera vanliga post types
    const map = {
      post: 'posts',
      page: 'pages',
      posts: 'posts',
      pages: 'pages',
      product: 'products',
      products: 'products',
    };
    if (map[postType]) return map[postType];

    // Hämta från WP REST API om det är en custom post type
    try {
      const res = await wpFetch(site, 'wp/v2/types/' + postType);
      return res.data?.rest_base || postType;
    } catch {
      return postType;
    }
  }

  /**
   * Kontrollera om ACF är aktivt på siten.
   */
  async function checkAcf(site) {
    try {
      const res = await wpFetch(site, 'wp/v2/plugins', { params: { per_page: 100 } });
      const plugins = Array.isArray(res.data) ? res.data : [];
      const acf = plugins.find(p =>
        p.plugin?.includes('advanced-custom-fields') ||
        p.textdomain?.includes('acf') ||
        (p.name || '').toLowerCase().includes('advanced custom fields')
      );
      return acf ? { installed: true, version: acf.version, status: acf.status } : null;
    } catch {
      return null;
    }
  }

  // ===== FIELD OPERATIONS =====

  server.tool('perispa_acf_get_field', 'Läs ett enskilt ACF-fältvärde från ett inlägg.', {
    site: z.string().optional(),
    post_id: z.number().describe('Post- eller sid-ID'),
    field_key: z.string().describe('ACF-fältnamn eller field_key'),
    post_type: z.string().optional().default('posts').describe('Post type REST-bas (posts, pages, products, ...)'),
  }, async ({ site, post_id, field_key, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const { fields } = await getAcfFields(s, post_id, endpoint);
      const val = fields[field_key];
      return { content: [{ type: 'text', text: JSON.stringify({ field: field_key, value: val ?? null, found: field_key in fields }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_get_fields', 'Läs alla ACF-fältvärden på ett inlägg.', {
    site: z.string().optional(),
    post_id: z.number().describe('Post- eller sid-ID'),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_id, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const result = await getAcfFields(s, post_id, endpoint);
      return { content: [{ type: 'text', text: JSON.stringify({ post_id, source: result.source, fields: result.fields, count: Object.keys(result.fields).length }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_update_field', 'Uppdatera ett ACF-fältvärde på ett inlägg.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string().describe('ACF-fältnamn'),
    value: z.any().describe('Nytt värde (string, number, array, object)'),
    post_type: z.string().optional().default('posts'),
    dry_run: z.boolean().optional().default(false),
  }, async ({ site, post_id, field_key, value, post_type, dry_run }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);

      // Läs nuvarande värde
      const { fields } = await getAcfFields(s, post_id, endpoint);
      const oldVal = fields[field_key] ?? null;

      if (dry_run) {
        return { content: [{ type: 'text', text: JSON.stringify({ dry_run: true, post_id, field: field_key, old: oldVal, new: value }, null, 2) }] };
      }

      // Skriv via meta
      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: { [field_key]: value } },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, post_id, field: field_key, old: oldVal, new: value }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_update_fields', 'Bulk-uppdatera flera ACF-fält på ett inlägg.', {
    site: z.string().optional(),
    post_id: z.number(),
    fields: z.record(z.any()).describe('Objekt med { field_name: value, ... }'),
    post_type: z.string().optional().default('posts'),
    dry_run: z.boolean().optional().default(false),
  }, async ({ site, post_id, fields, post_type, dry_run }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);

      // Läs nuvarande
      const { fields: current } = await getAcfFields(s, post_id, endpoint);
      const diff = {};
      for (const [k, v] of Object.entries(fields)) {
        diff[k] = { old: current[k] ?? null, new: v };
      }

      if (dry_run) {
        return { content: [{ type: 'text', text: JSON.stringify({ dry_run: true, post_id, changes: diff }, null, 2) }] };
      }

      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: fields },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, post_id, updated: Object.keys(fields).length, changes: diff }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_delete_field', 'Ta bort ett ACF-fältvärde (sätter till tomt).', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    post_type: z.string().optional().default('posts'),
    dry_run: z.boolean().optional().default(false),
  }, async ({ site, post_id, field_key, post_type, dry_run }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);

      if (dry_run) {
        return { content: [{ type: 'text', text: JSON.stringify({ dry_run: true, post_id, field: field_key, action: 'delete' }, null, 2) }] };
      }

      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: { [field_key]: '' } },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, post_id, field: field_key, cleared: true }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_bulk_get_fields', 'Hämta samma ACF-fält från flera inlägg. Max 50 post-IDs.', {
    site: z.string().optional(),
    post_ids: z.array(z.number()).max(50),
    field_keys: z.array(z.string()),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_ids, field_keys, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const results = {};

      await Promise.all(post_ids.map(async (id) => {
        try {
          const { fields } = await getAcfFields(s, id, endpoint);
          results[id] = {};
          for (const k of field_keys) {
            results[id][k] = fields[k] ?? null;
          }
        } catch {
          results[id] = { error: 'Kunde inte hämta' };
        }
      }));

      return { content: [{ type: 'text', text: JSON.stringify({ post_ids, field_keys, results }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_compare_fields', 'Jämför ACF-fältvärden mellan två inlägg.', {
    site: z.string().optional(),
    post_id_a: z.number(),
    post_id_b: z.number(),
    field_keys: z.array(z.string()),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_id_a, post_id_b, field_keys, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const [a, b] = await Promise.all([
        getAcfFields(s, post_id_a, endpoint),
        getAcfFields(s, post_id_b, endpoint),
      ]);

      const diff = {};
      for (const k of field_keys) {
        diff[k] = {
          a: a.fields[k] ?? null,
          b: b.fields[k] ?? null,
          equal: JSON.stringify(a.fields[k]) === JSON.stringify(b.fields[k]),
        };
      }

      return { content: [{ type: 'text', text: JSON.stringify({ post_id_a, post_id_b, diff }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  // ===== FIELD GROUPS =====

  server.tool('perispa_acf_list_field_groups', 'Lista alla ACF-fältgrupper på siten.', {
    site: z.string().optional(),
    status: z.enum(['publish', 'any']).optional().default('publish'),
  }, async ({ site, status }) => {
    try {
      const s = getSite(site);
      const res = await wpFetch(s, 'wp/v2/acf-field-group', {
        params: { per_page: 100, status, context: 'edit' },
      });

      if (!Array.isArray(res.data)) {
        // ACF inte aktivt eller inga grupper
        return { content: [{ type: 'text', text: JSON.stringify({ groups: [], note: 'ACF REST API verkar ej vara aktivt. Kontrollera att ACF är installerat och show_in_rest är aktiverat.' }) }] };
      }

      const groups = res.data.map(g => ({
        id: g.id,
        key: g.slug,
        title: g.title?.rendered || g.title,
        status: g.status,
        modified: g.modified,
      }));

      return { content: [{ type: 'text', text: JSON.stringify({ count: groups.length, groups }, null, 2) }] };
    } catch (e) {
      // Försök via alternativ endpoint
      try {
        const s2 = getSite(site);
        const res2 = await wpFetch(s2, 'acf/v3/field-groups');
        return { content: [{ type: 'text', text: JSON.stringify({ source: 'acf/v3', data: res2.data }, null, 2) }] };
      } catch {
        return { content: [{ type: 'text', text: `FEL: ${e.message}. ACF kanske inte är installerat eller REST API inte aktiverat.` }], isError: true };
      }
    }
  });

  server.tool('perispa_acf_get_field_group', 'Hämta en ACF-fältgrupp med alla fältdefinitioner.', {
    site: z.string().optional(),
    group_key: z.string().describe('Fältgruppens slug/key (t.ex. group_abc123)'),
  }, async ({ site, group_key }) => {
    try {
      const s = getSite(site);
      // Prova ACF v3 REST API
      try {
        const res = await wpFetch(s, `acf/v3/field-groups?key=${group_key}`);
        return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
      } catch {
        // Fallback: sök i acf-field-group post type
        const res = await wpFetch(s, 'wp/v2/acf-field-group', {
          params: { slug: group_key, context: 'edit' },
        });
        return { content: [{ type: 'text', text: JSON.stringify(res.data, null, 2) }] };
      }
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_search_fields', 'Sök bland ACF-fältdefinitioner på siten.', {
    site: z.string().optional(),
    q: z.string().describe('Sökterm (fältnamn, label, instruktion)'),
  }, async ({ site, q }) => {
    try {
      const s = getSite(site);
      const res = await wpFetch(s, 'wp/v2/acf-field', {
        params: { search: q, per_page: 50, context: 'edit' },
      });

      if (!Array.isArray(res.data) || res.data.length === 0) {
        return { content: [{ type: 'text', text: JSON.stringify({ results: [], note: 'Inga fält hittades. Kontrollera att ACF REST API är aktivt.' }) }] };
      }

      const fields = res.data.map(f => ({
        id: f.id,
        key: f.slug,
        name: f.title?.rendered || f.title,
        type: f.meta?.type || 'unknown',
        parent_group: f.parent,
      }));

      return { content: [{ type: 'text', text: JSON.stringify({ query: q, count: fields.length, fields }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  // ===== OPTIONS PAGE =====

  server.tool('perispa_acf_get_option', 'Hämta ett ACF Options Page-fältvärde.', {
    site: z.string().optional(),
    field_key: z.string().describe('Fältnamn på Options Page'),
  }, async ({ site, field_key }) => {
    try {
      const s = getSite(site);
      // ACF Options sparas som WordPress-option med prefix
      const res = await wpFetch(s, 'wp/v2/settings', { params: { context: 'edit' } });
      const val = res.data?.[field_key] ?? null;

      // Försök även via options endpoint
      if (val === null) {
        const opt = await wpFetch(s, 'wp/v2/options', {
          params: { options: field_key },
        }).catch(() => null);
        if (opt?.data?.[field_key] !== undefined) {
          return { content: [{ type: 'text', text: JSON.stringify({ field: field_key, value: opt.data[field_key], source: 'options' }, null, 2) }] };
        }
      }

      return { content: [{ type: 'text', text: JSON.stringify({ field: field_key, value: val, source: 'settings' }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_get_options', 'Hämta alla ACF Options Page-fältvärden.', {
    site: z.string().optional(),
    option_prefix: z.string().optional().default('options_').describe('Prefix för options (default: options_)'),
  }, async ({ site, option_prefix }) => {
    try {
      const s = getSite(site);
      const res = await wpFetch(s, 'wp/v2/settings');
      const settings = res.data || {};
      const acfOptions = {};

      for (const [k, v] of Object.entries(settings)) {
        if (k.startsWith(option_prefix) || k.startsWith('_acf') || k.startsWith('acf')) {
          acfOptions[k] = v;
        }
      }

      return { content: [{ type: 'text', text: JSON.stringify({ count: Object.keys(acfOptions).length, options: acfOptions }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_update_option', 'Uppdatera ett ACF Options Page-fältvärde.', {
    site: z.string().optional(),
    field_key: z.string(),
    value: z.any(),
    dry_run: z.boolean().optional().default(false),
  }, async ({ site, field_key, value, dry_run }) => {
    try {
      const s = getSite(site);

      if (dry_run) {
        return { content: [{ type: 'text', text: JSON.stringify({ dry_run: true, field: field_key, new_value: value }) }] };
      }

      await wpFetch(s, 'wp/v2/settings', {
        method: 'POST',
        body: { [field_key]: value },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, field: field_key, value }) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  // ===== REPEATER (PRO) via serialized meta =====

  server.tool('perispa_acf_get_repeater', 'Hämta alla rader i ett ACF Repeater-fält. ACF Pro.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string().describe('Repeater-fältnamnet'),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_id, field_key, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const res = await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        params: { context: 'edit' },
      });

      const meta = res.data?.meta || {};
      const acfData = res.data?.acf || {};

      // Försök ACF REST API-nyckel
      if (acfData[field_key] !== undefined) {
        const rows = acfData[field_key];
        return { content: [{ type: 'text', text: JSON.stringify({ field: field_key, rows, count: Array.isArray(rows) ? rows.length : 0 }, null, 2) }] };
      }

      // Repeater i meta: field_name_count + field_name_0_sub, field_name_1_sub etc.
      const countKey = field_key;
      const count = parseInt(meta[countKey] || meta[`${field_key}_count`] || '0');
      const rows = [];

      for (let i = 0; i < count; i++) {
        const row = {};
        for (const [k, v] of Object.entries(meta)) {
          if (k.startsWith(`${field_key}_${i}_`)) {
            const subKey = k.replace(`${field_key}_${i}_`, '');
            if (!subKey.startsWith('_')) row[subKey] = v;
          }
        }
        if (Object.keys(row).length > 0) rows.push(row);
      }

      return { content: [{ type: 'text', text: JSON.stringify({ field: field_key, rows, count: rows.length, source: 'meta' }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_add_repeater_row', 'Lägg till en rad i ett ACF Repeater-fält.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    values: z.record(z.any()).describe('Sub-fältvärden för den nya raden'),
    post_type: z.string().optional().default('posts'),
    dry_run: z.boolean().optional().default(false),
  }, async ({ site, post_id, field_key, values, post_type, dry_run }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);

      // Läs befintliga rader
      const res = await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        params: { context: 'edit' },
      });
      const meta = res.data?.meta || {};
      const currentCount = parseInt(meta[field_key] || '0');
      const newIndex = currentCount;

      if (dry_run) {
        return { content: [{ type: 'text', text: JSON.stringify({ dry_run: true, field: field_key, new_row_index: newIndex, values }) }] };
      }

      // Bygg upp meta-uppdatering
      const metaUpdate = { [field_key]: currentCount + 1 };
      for (const [k, v] of Object.entries(values)) {
        metaUpdate[`${field_key}_${newIndex}_${k}`] = v;
      }

      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: metaUpdate },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, field: field_key, added_row_index: newIndex, new_count: currentCount + 1, values }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_update_repeater_row', 'Uppdatera en specifik rad i ett ACF Repeater-fält (nollbaserat index).', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    row_index: z.number().describe('Nollbaserat radindex'),
    values: z.record(z.any()),
    post_type: z.string().optional().default('posts'),
    dry_run: z.boolean().optional().default(false),
  }, async ({ site, post_id, field_key, row_index, values, post_type, dry_run }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);

      if (dry_run) {
        return { content: [{ type: 'text', text: JSON.stringify({ dry_run: true, field: field_key, row_index, values }) }] };
      }

      const metaUpdate = {};
      for (const [k, v] of Object.entries(values)) {
        metaUpdate[`${field_key}_${row_index}_${k}`] = v;
      }

      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: metaUpdate },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, field: field_key, row_index, updated_fields: Object.keys(values) }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_count_repeater_rows', 'Räkna rader i ett ACF Repeater-fält.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_id, field_key, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const res = await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        params: { context: 'edit' },
      });
      const meta = res.data?.meta || {};
      const acf = res.data?.acf || {};

      let count = 0;
      if (acf[field_key] && Array.isArray(acf[field_key])) {
        count = acf[field_key].length;
      } else {
        count = parseInt(meta[field_key] || '0');
      }

      return { content: [{ type: 'text', text: JSON.stringify({ field: field_key, row_count: count }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  // ===== GALLERY =====

  server.tool('perispa_acf_get_gallery', 'Hämta bilder i ett ACF Gallery-fält.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_id, field_key, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const { fields } = await getAcfFields(s, post_id, endpoint);
      const gallery = fields[field_key] || [];

      return { content: [{ type: 'text', text: JSON.stringify({ field: field_key, images: gallery, count: Array.isArray(gallery) ? gallery.length : 0 }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_update_gallery', 'Uppdatera bilderna i ett ACF Gallery-fält.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    image_ids: z.array(z.number()).describe('Lista av media-ID:n'),
    post_type: z.string().optional().default('posts'),
    dry_run: z.boolean().optional().default(false),
  }, async ({ site, post_id, field_key, image_ids, post_type, dry_run }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);

      if (dry_run) {
        return { content: [{ type: 'text', text: JSON.stringify({ dry_run: true, field: field_key, image_ids }) }] };
      }

      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: { [field_key]: image_ids } },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, field: field_key, image_ids, count: image_ids.length }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_add_to_gallery', 'Lägg till en bild i ett ACF Gallery-fält.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    image_id: z.number().describe('Media-ID att lägga till'),
    position: z.enum(['end', 'start']).optional().default('end'),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_id, field_key, image_id, position, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const { fields } = await getAcfFields(s, post_id, endpoint);
      const current = Array.isArray(fields[field_key]) ? fields[field_key] : [];

      const updated = position === 'start' ? [image_id, ...current] : [...current, image_id];

      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: { [field_key]: updated } },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, field: field_key, added: image_id, position, new_count: updated.length }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_remove_from_gallery', 'Ta bort en bild ur ett ACF Gallery-fält.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    image_id: z.number(),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_id, field_key, image_id, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const { fields } = await getAcfFields(s, post_id, endpoint);
      const current = Array.isArray(fields[field_key]) ? fields[field_key] : [];
      const updated = current.filter(id => id !== image_id);

      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: { [field_key]: updated } },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, field: field_key, removed: image_id, new_count: updated.length }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  // ===== RELATIONSHIP / POST OBJECT =====

  server.tool('perispa_acf_get_relationship', 'Hämta relaterade inlägg i ett ACF Relationship- eller Post Object-fält.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    post_type: z.string().optional().default('posts'),
  }, async ({ site, post_id, field_key, post_type }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);
      const { fields } = await getAcfFields(s, post_id, endpoint);
      const related = fields[field_key] || [];

      return { content: [{ type: 'text', text: JSON.stringify({ field: field_key, related_ids: Array.isArray(related) ? related : [related], count: Array.isArray(related) ? related.length : 1 }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_update_relationship', 'Uppdatera ett ACF Relationship-fält med en lista av post-ID:n.', {
    site: z.string().optional(),
    post_id: z.number(),
    field_key: z.string(),
    related_ids: z.array(z.number()),
    post_type: z.string().optional().default('posts'),
    dry_run: z.boolean().optional().default(false),
  }, async ({ site, post_id, field_key, related_ids, post_type, dry_run }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, post_type);

      if (dry_run) {
        return { content: [{ type: 'text', text: JSON.stringify({ dry_run: true, field: field_key, related_ids }) }] };
      }

      await wpFetch(s, `wp/v2/${endpoint}/${post_id}`, {
        method: 'POST',
        body: { meta: { [field_key]: related_ids } },
      });

      return { content: [{ type: 'text', text: JSON.stringify({ success: true, field: field_key, related_ids, count: related_ids.length }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_get_reverse_relationships', 'Hitta alla inlägg som pekar på ett givet inlägg via ett Relationship-fält.', {
    site: z.string().optional(),
    target_post_id: z.number(),
    field_key: z.string(),
    search_post_type: z.string().optional().default('posts'),
    per_page: z.number().optional().default(20),
  }, async ({ site, target_post_id, field_key, search_post_type, per_page }) => {
    try {
      const s = getSite(site);
      const endpoint = await getEndpoint(s, search_post_type);
      // Sök via meta_key filter
      const res = await wpFetch(s, `wp/v2/${endpoint}`, {
        params: {
          per_page: Math.min(per_page, 100),
          meta_key: field_key,
          meta_value: target_post_id,
          context: 'edit',
        },
      });

      const posts = Array.isArray(res.data) ? res.data.map(p => ({
        id: p.id,
        title: p.title?.rendered || p.title,
        slug: p.slug,
        link: p.link,
      })) : [];

      return { content: [{ type: 'text', text: JSON.stringify({ target_id: target_post_id, field: field_key, referencing_posts: posts, count: posts.length }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  // ===== TERM & USER FIELDS =====

  server.tool('perispa_acf_get_term_field', 'Hämta ett ACF-fältvärde från en term (kategori, tagg, etc.).', {
    site: z.string().optional(),
    term_id: z.number(),
    taxonomy: z.string().default('categories'),
    field_key: z.string(),
  }, async ({ site, term_id, taxonomy, field_key }) => {
    try {
      const s = getSite(site);
      const res = await wpFetch(s, `wp/v2/${taxonomy}/${term_id}`, {
        params: { context: 'edit' },
      });
      const meta = res.data?.meta || {};
      const acf = res.data?.acf || {};
      const value = acf[field_key] ?? meta[field_key] ?? null;

      return { content: [{ type: 'text', text: JSON.stringify({ term_id, taxonomy, field: field_key, value }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_update_term_field', 'Uppdatera ett ACF-fältvärde på en term.', {
    site: z.string().optional(),
    term_id: z.number(),
    taxonomy: z.string().default('categories'),
    field_key: z.string(),
    value: z.any(),
  }, async ({ site, term_id, taxonomy, field_key, value }) => {
    try {
      const s = getSite(site);
      await wpFetch(s, `wp/v2/${taxonomy}/${term_id}`, {
        method: 'POST',
        body: { meta: { [field_key]: value } },
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, term_id, taxonomy, field: field_key, value }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_get_user_field', 'Hämta ett ACF-fältvärde från en användare.', {
    site: z.string().optional(),
    user_id: z.number(),
    field_key: z.string(),
  }, async ({ site, user_id, field_key }) => {
    try {
      const s = getSite(site);
      const res = await wpFetch(s, `wp/v2/users/${user_id}`, {
        params: { context: 'edit' },
      });
      const meta = res.data?.meta || {};
      const acf = res.data?.acf || {};
      const value = acf[field_key] ?? meta[field_key] ?? null;

      return { content: [{ type: 'text', text: JSON.stringify({ user_id, field: field_key, value }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  server.tool('perispa_acf_update_user_field', 'Uppdatera ett ACF-fältvärde på en användare.', {
    site: z.string().optional(),
    user_id: z.number(),
    field_key: z.string(),
    value: z.any(),
  }, async ({ site, user_id, field_key, value }) => {
    try {
      const s = getSite(site);
      await wpFetch(s, `wp/v2/users/${user_id}`, {
        method: 'POST',
        body: { meta: { [field_key]: value } },
      });
      return { content: [{ type: 'text', text: JSON.stringify({ success: true, user_id, field: field_key, value }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

  // ===== ACF STATUS CHECK =====

  server.tool('perispa_acf_status', 'Kontrollera om ACF är installerat och vilket stöd som finns via REST API.', {
    site: z.string().optional(),
  }, async ({ site }) => {
    try {
      const s = getSite(site);
      const acfInfo = await checkAcf(s);

      // Testa ACF REST endpoints
      const endpoints = {};
      for (const ep of ['acf/v3/field-groups', 'wp/v2/acf-field-group', 'wp/v2/acf-field']) {
        try {
          await wpFetch(s, ep, { params: { per_page: 1 } });
          endpoints[ep] = 'OK';
        } catch (e) {
          endpoints[ep] = e.message.includes('404') ? '404 (ej registrerat)' : e.message.slice(0, 50);
        }
      }

      return { content: [{ type: 'text', text: JSON.stringify({
        acf_plugin: acfInfo || 'Hittades ej via plugin-lista',
        rest_endpoints: endpoints,
        recommendation: acfInfo?.status === 'active'
          ? 'ACF är aktivt. Aktivera "Show in REST API" på fältgrupper för full perispa_acf_* support.'
          : 'ACF verkar inte vara aktivt på denna site.',
      }, null, 2) }] };
    } catch (e) {
      return { content: [{ type: 'text', text: `FEL: ${e.message}` }], isError: true };
    }
  });

};
