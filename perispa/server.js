#!/usr/bin/env node
/**
 * perispa — Self-hosted WordPress MCP Server
 * Reverse-engineered Respira-klon för Searchboost Opti
 *
 * Verktyg:
 *   perispa_list_sites        — Lista konfigurerade siter
 *   perispa_switch_site       — Byt aktiv site
 *   perispa_get_site_context  — WP version, tema, plugins
 *   perispa_list_pages        — Lista sidor
 *   perispa_read_page         — Läs en sida (content + meta)
 *   perispa_update_page       — Uppdatera en sida
 *   perispa_create_page       — Skapa ny sida
 *   perispa_list_posts        — Lista inlägg
 *   perispa_read_post         — Läs ett inlägg
 *   perispa_update_post       — Uppdatera ett inlägg
 *   perispa_create_post       — Skapa nytt inlägg
 *   perispa_list_media        — Lista media
 *   perispa_upload_media      — Ladda upp media från URL
 *   perispa_list_plugins      — Lista plugins
 *   perispa_list_menus        — Lista menyer
 *   perispa_list_users        — Lista användare
 *   perispa_list_categories   — Lista kategorier
 *   perispa_list_tags         — Lista taggar
 *   perispa_search            — Sök i allt innehåll
 *   perispa_get_rankmath      — Hämta Rank Math SEO-data
 *   perispa_update_rankmath   — Uppdatera Rank Math SEO-data
 *   perispa_raw_api           — Rå WP REST API-anrop
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { validateContent } = require('./tools/content-validator');

// SAFE-WRITE flag: när PERISPA_VALIDATE_WRITES=true (default) körs validator före
// alla content-writes. Sätt till 'false' bara om du vet vad du gör.
const VALIDATE_WRITES = process.env.PERISPA_VALIDATE_WRITES !== 'false';

// --- Config ---
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error('Ingen config.json. Kör: node setup.js --from-ssm');
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

let config = loadConfig();
let activeSite = Object.keys(config.sites)[0] || null;

function getSite(slug) {
  const s = slug || activeSite;
  if (!s || !config.sites[s]) {
    throw new Error(`Site "${s}" finns inte. Kända: ${Object.keys(config.sites).join(', ')}`);
  }
  return config.sites[s];
}

// --- WP REST API client ---
function wpFetch(site, endpoint, options = {}) {
  return new Promise((resolve, reject) => {
    const baseUrl = site.url.replace(/\/$/, '');
    const url = new URL(`${baseUrl}/wp-json/${endpoint}`);

    if (options.params) {
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
      }
    }

    const auth = Buffer.from(`${site.username}:${site.app_password}`).toString('base64');
    const mod = url.protocol === 'https:' ? https : http;

    const reqOptions = {
      method: options.method || 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'perispa/3.1.0 (Searchboost-Opti; +https://searchboost.se)',
        'X-Perispa-Agent': 'perispa',
        'X-Perispa-Version': '3.1.0',
        'X-Perispa-Site': site?.slug || 'unknown',
        ...options.headers,
      },
      rejectUnauthorized: false,
      timeout: 30000,
    };

    if (options.body) {
      const bodyStr = JSON.stringify(options.body);
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(bodyStr);
    }

    const req = mod.request(url, reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        // Hämta total-antal från headers
        const total = res.headers['x-wp-total'];
        const totalPages = res.headers['x-wp-totalpages'];

        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(`WP API ${res.statusCode}: ${json.message || data}`));
          } else {
            resolve({ data: json, total: total ? parseInt(total) : null, totalPages: totalPages ? parseInt(totalPages) : null });
          }
        } catch {
          if (res.statusCode >= 400) {
            reject(new Error(`WP API ${res.statusCode}: ${data.slice(0, 500)}`));
          } else {
            resolve({ data, total: null, totalPages: null });
          }
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

// Ladda upp en buffer direkt till WP media library
function wpUploadBuffer(site, buffer, filename, contentType) {
  return new Promise((resolve, reject) => {
    const baseUrl = site.url.replace(/\/$/, '');
    const url = new URL(`${baseUrl}/wp-json/wp/v2/media`);
    const auth = Buffer.from(`${site.username}:${site.app_password}`).toString('base64');
    const uploadMod = url.protocol === 'https:' ? https : http;

    const req = uploadMod.request(url, {
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
      let data = '';
      res.on('data', (c) => data += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode >= 400) reject(new Error(json.message || data.slice(0, 500)));
          else resolve(json);
        } catch {
          reject(new Error(data.slice(0, 500)));
        }
      });
    });

    req.on('error', reject);
    req.write(buffer);
    req.end();
  });
}

// Hämta media via URL och ladda upp
function wpUploadFromUrl(site, imageUrl, filename) {
  return new Promise((resolve, reject) => {
    const mod = imageUrl.startsWith('https') ? https : http;
    mod.get(imageUrl, { rejectUnauthorized: false }, (imgRes) => {
      const chunks = [];
      imgRes.on('data', (c) => chunks.push(c));
      imgRes.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        // Normalisera SVG-typ (servrar skickar ibland fel content-type)
        let contentType = imgRes.headers['content-type'] || 'image/jpeg';
        if (filename.toLowerCase().endsWith('.svg')) contentType = 'image/svg+xml';
        try {
          resolve(await wpUploadBuffer(site, buffer, filename, contentType));
        } catch (e) { reject(e); }
      });
      imgRes.on('error', reject);
    });
  });
}

// --- Hjälpare ---
function formatPage(p) {
  return {
    id: p.id,
    title: p.title?.rendered || '',
    slug: p.slug,
    status: p.status,
    link: p.link,
    modified: p.modified,
    parent: p.parent || 0,
    template: p.template || '',
    excerpt: p.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim().slice(0, 200) || '',
    content_length: (p.content?.rendered || '').length,
  };
}

function formatPost(p) {
  return {
    id: p.id,
    title: p.title?.rendered || '',
    slug: p.slug,
    status: p.status,
    link: p.link,
    date: p.date,
    modified: p.modified,
    categories: p.categories || [],
    tags: p.tags || [],
    excerpt: p.excerpt?.rendered?.replace(/<[^>]+>/g, '').trim().slice(0, 200) || '',
    content_length: (p.content?.rendered || '').length,
  };
}

function text(content) {
  const str = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  let structured = typeof content === 'string' ? { message: content } : content;
  // MCP kräver object (record), inte array — wrap vid behov
  if (Array.isArray(structured)) structured = { items: structured };
  return {
    content: [{ type: 'text', text: str }],
    structuredContent: structured,
  };
}

function err(msg) {
  return {
    content: [{ type: 'text', text: `FEL: ${msg}` }],
    structuredContent: { error: msg },
    isError: true,
  };
}

// --- MCP Server ---
const server = new McpServer({
  name: 'perispa',
  version: '3.1.0',
});

// ===== PER-CALL WATCHDOG + SOFT ERRORS + structuredContent =====
// Wraps ALLA tools (inkl. de i tool-moduler) automatiskt.
// 1. 120s timeout per tool-anrop
// 2. Uncaught exceptions → soft error (aldrig crash)
// 3. structuredContent läggs till i alla text-svar (MCP 2025-06-18 spec)
const WATCHDOG_MS = 120_000;
const _serverTool = server.tool.bind(server);
server.tool = function (name, desc, schema, handler) {
  return _serverTool(name, desc, schema, async (args, extra) => {
    let result;
    try {
      result = await Promise.race([
        handler(args, extra),
        new Promise((_, rej) =>
          setTimeout(
            () => rej(new Error(`perispa: verktyget "${name}" timeout efter 120s`)),
            WATCHDOG_MS
          )
        ),
      ]);
    } catch (e) {
      const msg = e?.message || String(e);
      return {
        content: [{ type: 'text', text: `FEL: ${msg}` }],
        structuredContent: { error: msg, tool: name },
        isError: true,
      };
    }

    // Lägg till structuredContent om det saknas (MCP 2025-06-18 spec)
    if (result && result.content && !result.structuredContent) {
      const textPart = result.content.find((c) => c.type === 'text');
      if (textPart) {
        try {
          const parsed = JSON.parse(textPart.text);
          // MCP kräver object (record), inte array — wrap vid behov
          result.structuredContent = Array.isArray(parsed) ? { items: parsed } : parsed;
        } catch {
          result.structuredContent = { text: textPart.text };
        }
      }
    }

    return result;
  });
};

// ===== SITE MANAGEMENT =====

server.tool('perispa_list_sites', 'Lista alla konfigurerade WordPress-siter', {}, async () => {
  const sites = Object.values(config.sites).map(s => ({
    slug: s.slug,
    url: s.url,
    username: s.username,
    company: s.company_name,
    active: s.slug === activeSite,
  }));
  return text({ active_site: activeSite, sites });
});

server.tool('perispa_switch_site', 'Byt aktiv WordPress-site', {
  site: z.string().describe('Site-slug (t.ex. jelmtech, humanpower)'),
}, async ({ site }) => {
  if (!config.sites[site]) {
    return err(`Okänd site: ${site}. Kända: ${Object.keys(config.sites).join(', ')}`);
  }
  activeSite = site;
  return text(`Aktiv site: ${site} (${config.sites[site].url})`);
});

server.tool('perispa_get_site_context', 'Hämta WordPress-version, tema, plugins, och allmän siteinfo', {
  site: z.string().optional().describe('Site-slug (default: aktiv site)'),
}, async ({ site }) => {
  try {
    const s = getSite(site);
    const [root, plugins, themes, users] = await Promise.all([
      wpFetch(s, '').catch(() => ({ data: {} })),
      wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
      wpFetch(s, 'wp/v2/themes', { params: { per_page: 100 } }).catch(() => ({ data: [] })),
      wpFetch(s, 'wp/v2/users', { params: { per_page: 5 } }).catch(() => ({ data: [] })),
    ]);

    const activeTheme = Array.isArray(themes.data)
      ? themes.data.find(t => t.status === 'active')
      : Object.values(themes.data || {}).find(t => t.status === 'active');

    return text({
      site: s.slug,
      url: s.url,
      name: root.data?.name || '',
      description: root.data?.description || '',
      wp_version: root.data?.wp_version || 'okänd',
      active_theme: activeTheme ? { name: activeTheme.name?.rendered || activeTheme.name, version: activeTheme.version } : null,
      plugins: Array.isArray(plugins.data) ? plugins.data.map(p => ({
        name: p.name,
        status: p.status,
        version: p.version,
      })) : [],
      users: Array.isArray(users.data) ? users.data.map(u => ({ id: u.id, name: u.name, slug: u.slug })) : [],
    });
  } catch (e) {
    return err(e.message);
  }
});

// ===== PAGES =====

server.tool('perispa_list_pages', 'Lista WordPress-sidor', {
  site: z.string().optional(),
  per_page: z.number().optional().default(20).describe('Antal per sida (max 100)'),
  page: z.number().optional().default(1),
  status: z.string().optional().default('publish').describe('publish, draft, private, any'),
  search: z.string().optional().describe('Sökterm'),
  orderby: z.string().optional().default('menu_order').describe('title, date, modified, menu_order'),
  parent: z.number().optional().describe('Föräldra-sida ID'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const params = {
      per_page: Math.min(args.per_page, 100),
      page: args.page,
      status: args.status === 'any' ? 'publish,draft,private,pending' : args.status,
      orderby: args.orderby,
      order: 'asc',
    };
    if (args.search) params.search = args.search;
    if (args.parent !== undefined) params.parent = args.parent;

    const res = await wpFetch(s, 'wp/v2/pages', { params });
    return text({
      site: s.slug,
      total: res.total,
      total_pages: res.totalPages,
      page: args.page,
      pages: res.data.map(formatPage),
    });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_read_page', 'Läs en WordPress-sida med allt innehåll', {
  site: z.string().optional(),
  id: z.number().describe('Sidans ID'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const res = await wpFetch(s, `wp/v2/pages/${args.id}`, { params: { context: 'edit' } });
    const p = res.data;
    return text({
      id: p.id,
      title: p.title?.raw || p.title?.rendered || '',
      slug: p.slug,
      status: p.status,
      link: p.link,
      parent: p.parent,
      template: p.template,
      date: p.date,
      modified: p.modified,
      content: p.content?.raw || p.content?.rendered || '',
      excerpt: p.excerpt?.raw || p.excerpt?.rendered || '',
      meta: p.meta || {},
      yoast_head_json: p.yoast_head_json || null,
      rank_math: p.rank_math || null,
    });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_update_page', 'Uppdatera en WordPress-sida (kör validator före content-write)', {
  site: z.string().optional(),
  id: z.number().describe('Sidans ID'),
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  status: z.string().optional().describe('publish, draft, private, pending'),
  slug: z.string().optional(),
  meta: z.record(z.any()).optional().describe('Meta-fält att uppdatera'),
  skip_validation: z.boolean().optional().describe('Endast om absolut nödvändigt — defaultar till false'),
}, async (args) => {
  try {
    const s = getSite(args.site);

    // SAFE-WRITE: validera content mot befintlig version innan vi skriver
    if (args.content !== undefined && VALIDATE_WRITES && !args.skip_validation) {
      try {
        const existing = await wpFetch(s, `wp/v2/pages/${args.id}`, { params: { context: 'edit' } });
        const oldContent = existing.data?.content?.raw || existing.data?.content?.rendered || '';
        const v = validateContent(oldContent, args.content);
        if (!v.ok) {
          return err(`VALIDATOR BLOCKERADE: ${v.errors.join(' | ')}\n\nStats: ${JSON.stringify(v.stats)}\n\nÖverstyr med skip_validation:true om du vet att detta är OK.`);
        }
      } catch (validateErr) {
        return err(`Validator-fel (kunde inte hämta befintlig sida): ${validateErr.message}`);
      }
    }

    const body = {};
    if (args.title !== undefined) body.title = args.title;
    if (args.content !== undefined) body.content = args.content;
    if (args.excerpt !== undefined) body.excerpt = args.excerpt;
    if (args.status !== undefined) body.status = args.status;
    if (args.slug !== undefined) body.slug = args.slug;
    if (args.meta !== undefined) body.meta = args.meta;

    const res = await wpFetch(s, `wp/v2/pages/${args.id}`, { method: 'POST', body });
    return text({ updated: true, id: res.data.id, title: res.data.title?.rendered, link: res.data.link, validated: args.content !== undefined && VALIDATE_WRITES && !args.skip_validation });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_create_page', 'Skapa en ny WordPress-sida', {
  site: z.string().optional(),
  title: z.string(),
  content: z.string().optional().default(''),
  status: z.string().optional().default('draft'),
  parent: z.number().optional().default(0),
  slug: z.string().optional(),
  template: z.string().optional(),
  meta: z.record(z.any()).optional(),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const body = {
      title: args.title,
      content: args.content,
      status: args.status,
      parent: args.parent,
    };
    if (args.slug) body.slug = args.slug;
    if (args.template) body.template = args.template;
    if (args.meta) body.meta = args.meta;

    const res = await wpFetch(s, 'wp/v2/pages', { method: 'POST', body });
    return text({ created: true, id: res.data.id, title: res.data.title?.rendered, link: res.data.link, status: res.data.status });
  } catch (e) {
    return err(e.message);
  }
});

// ===== POSTS =====

server.tool('perispa_list_posts', 'Lista WordPress-inlägg', {
  site: z.string().optional(),
  per_page: z.number().optional().default(20),
  page: z.number().optional().default(1),
  status: z.string().optional().default('publish'),
  search: z.string().optional(),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  orderby: z.string().optional().default('date'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const params = {
      per_page: Math.min(args.per_page, 100),
      page: args.page,
      status: args.status === 'any' ? 'publish,draft,private,pending' : args.status,
      orderby: args.orderby,
      order: 'desc',
    };
    if (args.search) params.search = args.search;
    if (args.categories?.length) params.categories = args.categories.join(',');
    if (args.tags?.length) params.tags = args.tags.join(',');

    const res = await wpFetch(s, 'wp/v2/posts', { params });
    return text({
      site: s.slug,
      total: res.total,
      total_pages: res.totalPages,
      posts: res.data.map(formatPost),
    });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_read_post', 'Läs ett WordPress-inlägg med allt innehåll', {
  site: z.string().optional(),
  id: z.number().describe('Inläggets ID'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const res = await wpFetch(s, `wp/v2/posts/${args.id}`, { params: { context: 'edit' } });
    const p = res.data;
    return text({
      id: p.id,
      title: p.title?.raw || p.title?.rendered || '',
      slug: p.slug,
      status: p.status,
      link: p.link,
      date: p.date,
      modified: p.modified,
      categories: p.categories,
      tags: p.tags,
      content: p.content?.raw || p.content?.rendered || '',
      excerpt: p.excerpt?.raw || p.excerpt?.rendered || '',
      meta: p.meta || {},
      featured_media: p.featured_media || 0,
    });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_update_post', 'Uppdatera ett WordPress-inlägg (kör validator före content-write)', {
  site: z.string().optional(),
  id: z.number(),
  title: z.string().optional(),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  status: z.string().optional().describe('publish, draft, private, pending'),
  slug: z.string().optional(),
  author: z.number().optional().describe('Author user ID'),
  categories: z.array(z.number()).optional().describe('Kategori-IDs'),
  tags: z.array(z.number()).optional().describe('Tagg-IDs'),
  featured_media: z.number().optional().describe('Featured image media ID'),
  meta: z.record(z.any()).optional(),
  skip_validation: z.boolean().optional(),
}, async (args) => {
  try {
    const s = getSite(args.site);

    // SAFE-WRITE: validera content innan
    if (args.content !== undefined && VALIDATE_WRITES && !args.skip_validation) {
      try {
        const existing = await wpFetch(s, `wp/v2/posts/${args.id}`, { params: { context: 'edit' } });
        const oldContent = existing.data?.content?.raw || existing.data?.content?.rendered || '';
        const v = validateContent(oldContent, args.content);
        if (!v.ok) {
          return err(`VALIDATOR BLOCKERADE: ${v.errors.join(' | ')}\n\nStats: ${JSON.stringify(v.stats)}\n\nÖverstyr med skip_validation:true om du vet att detta är OK.`);
        }
      } catch (validateErr) {
        return err(`Validator-fel (kunde inte hämta befintligt inlägg): ${validateErr.message}`);
      }
    }

    const body = {};
    if (args.title !== undefined) body.title = args.title;
    if (args.content !== undefined) body.content = args.content;
    if (args.excerpt !== undefined) body.excerpt = args.excerpt;
    if (args.status !== undefined) body.status = args.status;
    if (args.slug !== undefined) body.slug = args.slug;
    if (args.author !== undefined) body.author = args.author;
    if (args.categories !== undefined) body.categories = args.categories;
    if (args.tags !== undefined) body.tags = args.tags;
    if (args.featured_media !== undefined) body.featured_media = args.featured_media;
    if (args.meta !== undefined) body.meta = args.meta;

    const res = await wpFetch(s, `wp/v2/posts/${args.id}`, { method: 'POST', body });
    return text({ updated: true, id: res.data.id, title: res.data.title?.rendered, link: res.data.link });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_create_post', 'Skapa ett nytt WordPress-inlägg', {
  site: z.string().optional(),
  title: z.string(),
  content: z.string().optional().default(''),
  status: z.string().optional().default('draft'),
  author: z.number().optional().describe('Author user ID'),
  categories: z.array(z.number()).optional(),
  tags: z.array(z.number()).optional(),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  featured_media: z.number().optional().describe('Featured image media ID'),
  meta: z.record(z.any()).optional(),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const body = { title: args.title, content: args.content, status: args.status };
    if (args.author) body.author = args.author;
    if (args.categories) body.categories = args.categories;
    if (args.tags) body.tags = args.tags;
    if (args.slug) body.slug = args.slug;
    if (args.excerpt) body.excerpt = args.excerpt;
    if (args.featured_media) body.featured_media = args.featured_media;
    if (args.meta) body.meta = args.meta;

    const res = await wpFetch(s, 'wp/v2/posts', { method: 'POST', body });
    return text({ created: true, id: res.data.id, title: res.data.title?.rendered, link: res.data.link, status: res.data.status });
  } catch (e) {
    return err(e.message);
  }
});

// ===== MEDIA =====

server.tool('perispa_list_media', 'Lista media-filer', {
  site: z.string().optional(),
  per_page: z.number().optional().default(20),
  page: z.number().optional().default(1),
  search: z.string().optional(),
  mime_type: z.string().optional().describe('t.ex. image/jpeg, image, application/pdf'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const params = { per_page: Math.min(args.per_page, 100), page: args.page };
    if (args.search) params.search = args.search;
    if (args.mime_type) params.mime_type = args.mime_type;

    const res = await wpFetch(s, 'wp/v2/media', { params });
    return text({
      total: res.total,
      media: res.data.map(m => ({
        id: m.id,
        title: m.title?.rendered || '',
        url: m.source_url,
        mime_type: m.mime_type,
        alt: m.alt_text || '',
        width: m.media_details?.width,
        height: m.media_details?.height,
        file_size: m.media_details?.filesize,
      })),
    });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_upload_media',
  'Ladda upp en bild/fil till WordPress media library. Stöder URL-hämtning, base64-data och SVG-filer.',
  {
    site: z.string().optional(),
    url: z.string().optional().describe('URL till bilden/filen (används om base64_data saknas)'),
    base64_data: z.string().optional().describe('Base64-kodad fildata (alternativ till url)'),
    mime_type: z.string().optional().describe('MIME-typ för base64-uppladdning (t.ex. image/svg+xml, image/png)'),
    filename: z.string().describe('Filnamn inklusive extension (t.ex. hero-image.jpg, icon.svg)'),
    alt_text: z.string().optional(),
    title: z.string().optional(),
  },
  async (args) => {
    try {
      if (!args.url && !args.base64_data) {
        return err('Ange url eller base64_data');
      }
      const s = getSite(args.site);

      let result;
      if (args.base64_data) {
        // Base64-uppladdning
        const buffer = Buffer.from(args.base64_data, 'base64');
        let mime = args.mime_type || 'application/octet-stream';
        // Auto-detektera SVG
        if (!args.mime_type && args.filename.toLowerCase().endsWith('.svg')) {
          mime = 'image/svg+xml';
        }
        result = await wpUploadBuffer(s, buffer, args.filename, mime);
      } else {
        result = await wpUploadFromUrl(s, args.url, args.filename);
      }

      // Uppdatera alt och title om angivet
      if (args.alt_text || args.title) {
        const updateBody = {};
        if (args.alt_text) updateBody.alt_text = args.alt_text;
        if (args.title) updateBody.title = args.title;
        await wpFetch(s, `wp/v2/media/${result.id}`, { method: 'POST', body: updateBody });
      }

      return text({
        uploaded: true,
        id: result.id,
        url: result.source_url,
        mime_type: result.mime_type,
        title: result.title?.rendered,
        width: result.media_details?.width,
        height: result.media_details?.height,
      });
    } catch (e) {
      return err(e.message);
    }
  }
);

// ===== PLUGINS =====

server.tool('perispa_list_plugins', 'Lista installerade WordPress-plugins', {
  site: z.string().optional(),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const res = await wpFetch(s, 'wp/v2/plugins', { params: { per_page: 100 } });
    return text(res.data.map(p => ({
      plugin: p.plugin,
      name: p.name,
      status: p.status,
      version: p.version,
      author: p.author,
    })));
  } catch (e) {
    return err(e.message);
  }
});

// ===== MENUS =====

server.tool('perispa_list_menus', 'Lista WordPress-menyer (kräver WP REST API Menus plugin eller WP 5.9+)', {
  site: z.string().optional(),
}, async (args) => {
  try {
    const s = getSite(args.site);
    // Prova navigation endpoint (WP 5.9+)
    try {
      const res = await wpFetch(s, 'wp/v2/navigation', { params: { per_page: 100 } });
      return text(res.data.map(m => ({ id: m.id, title: m.title?.rendered, slug: m.slug, status: m.status })));
    } catch {
      // Fallback: prova menus endpoint
      const res = await wpFetch(s, 'wp/v2/menus', { params: { per_page: 100 } });
      return text(res.data.map(m => ({ id: m.id, name: m.name, slug: m.slug, locations: m.locations })));
    }
  } catch (e) {
    return err(e.message);
  }
});

// ===== USERS =====

server.tool('perispa_list_users', 'Lista WordPress-användare', {
  site: z.string().optional(),
  per_page: z.number().optional().default(20),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const res = await wpFetch(s, 'wp/v2/users', { params: { per_page: args.per_page, context: 'edit' } });
    return text(res.data.map(u => ({
      id: u.id,
      username: u.username || u.slug,
      name: u.name,
      email: u.email || '',
      roles: u.roles || [],
    })));
  } catch (e) {
    return err(e.message);
  }
});

// ===== TAXONOMIES =====

server.tool('perispa_list_categories', 'Lista kategorier', {
  site: z.string().optional(),
  per_page: z.number().optional().default(100),
  search: z.string().optional(),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const params = { per_page: args.per_page, hide_empty: false };
    if (args.search) params.search = args.search;
    const res = await wpFetch(s, 'wp/v2/categories', { params });
    return text(res.data.map(c => ({ id: c.id, name: c.name, slug: c.slug, count: c.count, parent: c.parent })));
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_list_tags', 'Lista taggar', {
  site: z.string().optional(),
  per_page: z.number().optional().default(100),
  search: z.string().optional(),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const params = { per_page: args.per_page, hide_empty: false };
    if (args.search) params.search = args.search;
    const res = await wpFetch(s, 'wp/v2/tags', { params });
    return text(res.data.map(t => ({ id: t.id, name: t.name, slug: t.slug, count: t.count })));
  } catch (e) {
    return err(e.message);
  }
});

// ===== SEARCH =====

server.tool('perispa_search', 'Sök i allt WordPress-innehåll', {
  site: z.string().optional(),
  query: z.string().describe('Sökterm'),
  type: z.string().optional().default('post').describe('post, page, any'),
  per_page: z.number().optional().default(10),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const params = { search: args.query, per_page: args.per_page };
    if (args.type !== 'any') params.type = args.type;

    const res = await wpFetch(s, 'wp/v2/search', { params });
    return text(res.data.map(r => ({
      id: r.id,
      title: r.title,
      url: r.url,
      type: r.type,
      subtype: r.subtype,
    })));
  } catch (e) {
    return err(e.message);
  }
});

// ===== RANK MATH SEO =====

server.tool('perispa_get_rankmath', 'Hämta Rank Math SEO-metadata för en sida/inlägg', {
  site: z.string().optional(),
  id: z.number().describe('Post/Page ID'),
  type: z.string().optional().default('post').describe('post eller page'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const endpoint = args.type === 'page' ? 'wp/v2/pages' : 'wp/v2/posts';
    const res = await wpFetch(s, `${endpoint}/${args.id}`, { params: { context: 'edit' } });
    const meta = res.data.meta || {};

    // Rank Math meta-keys
    const rmKeys = Object.keys(meta).filter(k => k.startsWith('rank_math_'));
    const rankMathMeta = {};
    for (const k of rmKeys) {
      rankMathMeta[k.replace('rank_math_', '')] = meta[k];
    }

    // Yoast fallback
    const yoastKeys = Object.keys(meta).filter(k => k.startsWith('_yoast_'));
    const yoastMeta = {};
    for (const k of yoastKeys) {
      yoastMeta[k] = meta[k];
    }

    return text({
      id: res.data.id,
      title: res.data.title?.raw || res.data.title?.rendered || '',
      rank_math: Object.keys(rankMathMeta).length > 0 ? rankMathMeta : null,
      yoast: Object.keys(yoastMeta).length > 0 ? yoastMeta : null,
      yoast_head_json: res.data.yoast_head_json || null,
      all_meta_keys: Object.keys(meta),
    });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_update_rankmath', 'Uppdatera Rank Math SEO-metadata', {
  site: z.string().optional(),
  id: z.number().describe('Post/Page ID'),
  type: z.string().optional().default('post'),
  title: z.string().optional().describe('SEO Title (rank_math_title)'),
  description: z.string().optional().describe('SEO Description (rank_math_description)'),
  focus_keyword: z.string().optional().describe('Focus keyword (rank_math_focus_keyword)'),
  canonical_url: z.string().optional(),
  robots: z.array(z.string()).optional().describe('Robot meta (index, noindex, follow, nofollow)'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const endpoint = args.type === 'page' ? 'wp/v2/pages' : 'wp/v2/posts';
    const meta = {};

    if (args.title !== undefined) meta.rank_math_title = args.title;
    if (args.description !== undefined) meta.rank_math_description = args.description;
    if (args.focus_keyword !== undefined) meta.rank_math_focus_keyword = args.focus_keyword;
    if (args.canonical_url !== undefined) meta.rank_math_canonical_url = args.canonical_url;
    if (args.robots !== undefined) meta.rank_math_robots = args.robots;

    const res = await wpFetch(s, `${endpoint}/${args.id}`, { method: 'POST', body: { meta } });
    return text({ updated: true, id: res.data.id, title: res.data.title?.rendered });
  } catch (e) {
    return err(e.message);
  }
});

// ===== RAW API =====

server.tool('perispa_raw_api', 'Gör ett rått WP REST API-anrop', {
  site: z.string().optional(),
  endpoint: z.string().describe('API-endpoint (t.ex. wp/v2/posts, rankmath/v1/getHead)'),
  method: z.string().optional().default('GET'),
  params: z.record(z.string()).optional().describe('Query-parametrar'),
  body: z.record(z.any()).optional().describe('Request body (för POST/PUT)'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const res = await wpFetch(s, args.endpoint, {
      method: args.method,
      params: args.params,
      body: args.body,
    });
    return text(res.data);
  } catch (e) {
    return err(e.message);
  }
});

// ===== DELETE =====

server.tool('perispa_delete_page', 'Ta bort en WordPress-sida (flyttar till papperskorg)', {
  site: z.string().optional(),
  id: z.number(),
  force: z.boolean().optional().default(false).describe('true = permanent borttagning'),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const params = {};
    if (args.force) params.force = true;
    const res = await wpFetch(s, `wp/v2/pages/${args.id}`, { method: 'DELETE', params });
    return text({ deleted: true, id: args.id, status: res.data.status });
  } catch (e) {
    return err(e.message);
  }
});

server.tool('perispa_delete_post', 'Ta bort ett WordPress-inlägg (flyttar till papperskorg)', {
  site: z.string().optional(),
  id: z.number(),
  force: z.boolean().optional().default(false),
}, async (args) => {
  try {
    const s = getSite(args.site);
    const params = {};
    if (args.force) params.force = true;
    const res = await wpFetch(s, `wp/v2/posts/${args.id}`, { method: 'DELETE', params });
    return text({ deleted: true, id: args.id, status: res.data.status });
  } catch (e) {
    return err(e.message);
  }
});

// ===== GET ACTIVE SITE =====

server.tool('perispa_get_active_site', 'Visa vilken site som ar aktiv just nu', {}, async () => {
  if (!activeSite) return err('Ingen aktiv site. Kor perispa_switch_site forst.');
  const s = config.sites[activeSite];
  return text({ slug: s.slug, url: s.url, username: s.username, company: s.company_name });
});

// ===== UPDATE MODULE =====

server.tool(
  'perispa_update_module',
  'Uppdatera en specifik builder-modul (shortcode/block) i en sida eller inlägg. ' +
  'Hittar modulen via id-attribut eller shortcode-typ och uppdaterar attribut och/eller innehåll. ' +
  'Fungerar med Flatsome UX Builder, classic editor och alla shortcode-baserade builders.',
  {
    site: z.string().optional(),
    page_id: z.number().describe('Sidan/inläggets ID'),
    content_type: z.string().optional().default('page').describe('"page", "post", eller custom post type REST-bas'),
    module_id: z.string().optional().describe('Modulens id-attribut i shortcoden (t.ex. "a3f2c1")'),
    module_type: z.string().optional().describe('Shortcode-typ att söka efter om module_id saknas (t.ex. "ux_html", "ux_section")'),
    new_content: z.string().optional().describe('Nytt innehåll inuti modulen'),
    attributes: z.record(z.string()).optional().describe('Attribut att uppdatera eller lägga till (key: value-par)'),
  },
  async (args) => {
    try {
      if (!args.module_id && !args.module_type) {
        return err('Ange minst module_id eller module_type');
      }
      const s = getSite(args.site);
      const ct = args.content_type || 'page';
      const endpoint =
        ct === 'page' ? 'wp/v2/pages' :
        ct === 'post' ? 'wp/v2/posts' :
        `wp/v2/${ct}`;

      const res = await wpFetch(s, `${endpoint}/${args.page_id}`, { params: { context: 'edit' } });
      let pageContent = res.data.content?.raw || res.data.content?.rendered || '';

      const updateAttrs = (tag, newAttrs) => {
        if (!newAttrs) return tag;
        let updated = tag;
        for (const [k, v] of Object.entries(newAttrs)) {
          const re = new RegExp(`(\\s${k}=")[^"]*(")`);
          if (re.test(updated)) {
            updated = updated.replace(re, `$1${v}$2`);
          } else {
            updated = updated.replace(/(\s*\/?\])$/, ` ${k}="${v}"$1`);
          }
        }
        return updated;
      };

      let found = false;
      let newPageContent = pageContent;

      if (args.module_id) {
        // Matcha shortcode med id-attribut — stöder självstängande och block-shortcodes
        const idRe = new RegExp(
          `(\\[\\w[\\w-]*(?:\\s[^\\]]*?)?\\sid="${args.module_id}"[^\\]]*?)(/)?(\\])` +
          `((?:[\\s\\S]*?)(\\[/\\w[\\w-]*\\]))?`,
          'g'
        );
        newPageContent = pageContent.replace(idRe, (match, open, slash, bracket, innerAndClose) => {
          found = true;
          const updatedOpen = updateAttrs(open, args.attributes);
          if (slash) {
            // Självstängande: [shortcode ... /]
            return updatedOpen + '/' + bracket;
          }
          if (innerAndClose) {
            // Block: [shortcode]...[/shortcode]
            const closeMatch = innerAndClose.match(/(\[\/\w[\w-]*\])$/);
            const closeTag = closeMatch ? closeMatch[1] : '';
            const innerContent = closeTag
              ? innerAndClose.slice(0, innerAndClose.length - closeTag.length)
              : innerAndClose;
            const newInner = args.new_content !== undefined ? args.new_content : innerContent;
            return updatedOpen + bracket + newInner + closeTag;
          }
          return updatedOpen + bracket;
        });
      } else if (args.module_type) {
        // Matcha första förekomst av shortcode-typen
        const typeRe = new RegExp(
          `(\\[${args.module_type}(?:\\s[^\\]]*)?)(/)?(\\])((?:[\\s\\S]*?)(\\[/${args.module_type}\\]))?`
        );
        newPageContent = pageContent.replace(typeRe, (match, open, slash, bracket, innerAndClose) => {
          found = true;
          const updatedOpen = updateAttrs(open, args.attributes);
          if (slash) return updatedOpen + '/' + bracket;
          if (innerAndClose) {
            const closeTag = `[/${args.module_type}]`;
            const innerContent = innerAndClose.endsWith(closeTag)
              ? innerAndClose.slice(0, -closeTag.length)
              : innerAndClose;
            const newInner = args.new_content !== undefined ? args.new_content : innerContent;
            return updatedOpen + bracket + newInner + closeTag;
          }
          return updatedOpen + bracket;
        });
      }

      if (!found) {
        const identifier = args.module_id ? `id="${args.module_id}"` : `[${args.module_type}]`;
        return err(
          `Modulen med ${identifier} hittades inte på sidan ${args.page_id}. ` +
          `Använd perispa_extract_flatsome eller perispa_find_flatsome_el för att se sidans struktur.`
        );
      }

      await wpFetch(s, `${endpoint}/${args.page_id}`, { method: 'POST', body: { content: newPageContent } });
      return text({
        updated: true,
        page_id: args.page_id,
        module_id: args.module_id || null,
        module_type: args.module_type || null,
      });
    } catch (e) { return err(e.message); }
  }
);

// ===== TOOL MODULES =====

// Ladda alla tool-moduler
require('./tools/elements.js')(server, getSite, wpFetch);
require('./tools/seo.js')(server, getSite, wpFetch);
require('./tools/woocommerce.js')(server, getSite, wpFetch);
require('./tools/widgets.js')(server, getSite, wpFetch);
require('./tools/snapshots.js')(server, getSite, wpFetch);
require('./tools/accessibility.js')(server, getSite, wpFetch);
require('./tools/plugins.js')(server, getSite, wpFetch);
require('./tools/comments.js')(server, getSite, wpFetch);
require('./tools/custom-posts.js')(server, getSite, wpFetch);
require('./tools/menus.js')(server, getSite, wpFetch);
require('./tools/taxonomies.js')(server, getSite, wpFetch);
require('./tools/users.js')(server, getSite, wpFetch);
require('./tools/options.js')(server, getSite, wpFetch);
require('./tools/media-extended.js')(server, getSite, wpFetch);
require('./tools/duplicates.js')(server, getSite, wpFetch);
require('./tools/builder-extended.js')(server, getSite, wpFetch);
require('./tools/performance.js')(server, getSite, wpFetch);
require('./tools/auto-audit.js')(server, getSite, wpFetch);
require('./tools/batch-fixer.js')(server, getSite, wpFetch);
require('./tools/schema-generator.js')(server, getSite, wpFetch);
require('./tools/gsc.js')(server, getSite, wpFetch);
require('./tools/content-gap.js')(server, getSite, wpFetch);
require('./tools/pagespeed.js')(server, getSite, wpFetch);
require('./tools/auto-linker.js')(server, getSite, wpFetch);
require('./tools/competitor.js')(server, getSite, wpFetch);
require('./tools/ai-writer.js')(server, getSite, wpFetch);
require('./tools/report-generator.js')(server, getSite, wpFetch);
require('./tools/mobile.js')(server, getSite, wpFetch);
require('./tools/flatsome-builder.js')(server, getSite, wpFetch);
require('./tools/acf.js')(server, getSite, wpFetch);
require('./tools/governance.js')(server, getSite, wpFetch);
require('./tools/edit-target.js')(server, getSite, wpFetch);
require('./tools/elementor.js')(server, getSite, wpFetch);
require('./tools/bricks.js')(server, getSite, wpFetch);

// ===== START =====

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`perispa MCP server started — ${Object.keys(config.sites).length} siter laddade, aktiv: ${activeSite}`);
}

main().catch((e) => {
  console.error('perispa startup error:', e);
  process.exit(1);
});
