#!/usr/bin/env node
/**
 * perispa HTTP MCP Server
 *
 * Kör perispa som en MCP Streamable HTTP-server på EC2 istället för stdio.
 * Båda datorer pekar på samma server — alltid i synk.
 *
 * Start:  node http-server.js
 * Port:   3001 (konfigurerbar via PORT-env)
 * Auth:   X-Api-Key header (samma nyckel som dashboard)
 *
 * Nginx-config (lägg i /etc/nginx/sites-available/perispa):
 *   location /perispa/ {
 *     proxy_pass http://127.0.0.1:3001/;
 *     proxy_http_version 1.1;
 *     proxy_set_header Upgrade $http_upgrade;
 *     proxy_set_header Connection "upgrade";
 *     proxy_set_header Host $host;
 *     proxy_read_timeout 300s;
 *     proxy_buffering off;
 *   }
 *
 * .mcp.json-entry (HTTP-transport):
 *   "perispa": {
 *     "type": "http",
 *     "url": "https://51.21.116.7/perispa/mcp",
 *     "headers": { "X-Api-Key": "sb-api-41bbf2ec7d8a17973d7b7ebcac07aafab9aa777feb08ce78" }
 *   }
 */

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { randomUUID } = require('node:crypto');
const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const PORT = parseInt(process.env.PORT || '3001', 10);
const API_KEY = process.env.PERISPA_API_KEY || 'sb-api-41bbf2ec7d8a17973d7b7ebcac07aafab9aa777feb08ce78';

// ─── Config ───────────────────────────────────────────────────
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) {
    throw new Error('Ingen config.json. Kör: node setup.js --from-ssm');
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
}

let config = loadConfig();
const defaultSite = Object.keys(config.sites)[0] || null;

function getSite(slug) {
  const s = slug || defaultSite;
  if (!s || !config.sites[s]) {
    throw new Error(`Site "${s}" finns inte. Kända: ${Object.keys(config.sites).join(', ')}`);
  }
  return config.sites[s];
}

// ─── WP REST API client (identisk med server.js) ─────────────
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
        'User-Agent': 'perispa/1.0',
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

// ─── Bygg MCP-server (factories skapar ny instans per request) ─
function buildMcpServer() {
  const server = new McpServer({
    name: 'perispa',
    version: '1.0.0',
  });

  // Alla tool-moduler
  const toolModules = [
    './tools/elements.js',
    './tools/seo.js',
    './tools/woocommerce.js',
    './tools/widgets.js',
    './tools/snapshots.js',
    './tools/accessibility.js',
    './tools/plugins.js',
    './tools/comments.js',
    './tools/custom-posts.js',
    './tools/menus.js',
    './tools/taxonomies.js',
    './tools/users.js',
    './tools/options.js',
    './tools/media-extended.js',
    './tools/duplicates.js',
    './tools/builder-extended.js',
    './tools/performance.js',
    './tools/auto-audit.js',
    './tools/batch-fixer.js',
    './tools/schema-generator.js',
    './tools/gsc.js',
    './tools/content-gap.js',
    './tools/pagespeed.js',
    './tools/auto-linker.js',
    './tools/competitor.js',
    './tools/ai-writer.js',
    './tools/report-generator.js',
    './tools/mobile.js',
    './tools/crud.js',
  ];

  for (const mod of toolModules) {
    try {
      require(mod)(server, getSite, wpFetch);
    } catch (e) {
      console.error(`Fel vid laddning av ${mod}: ${e.message}`);
    }
  }

  // Byt aktiv site
  const { z } = require('zod');
  server.tool('perispa_switch_site', 'Byt aktiv site', {
    site: z.string().describe('site-slug'),
  }, async (args) => {
    if (!config.sites[args.site]) {
      return { content: [{ type: 'text', text: `FEL: Site "${args.site}" finns inte. Kända: ${Object.keys(config.sites).join(', ')}` }], isError: true };
    }
    // I HTTP-läge är "aktiv site" per-request — switchen är mest informativ
    return { content: [{ type: 'text', text: `Site satt till: ${args.site}` }] };
  });

  server.tool('perispa_list_sites', 'Lista konfigurerade sites', {}, async () => {
    const sites = Object.entries(config.sites).map(([slug, s]) => ({
      slug,
      url: s.url,
      username: s.username,
      company: s.company_name || slug,
    }));
    return { content: [{ type: 'text', text: JSON.stringify(sites, null, 2) }] };
  });

  server.tool('perispa_get_active_site', 'Visa standard-site', {}, async () => {
    const s = config.sites[defaultSite];
    return { content: [{ type: 'text', text: JSON.stringify({ slug: defaultSite, url: s?.url, username: s?.username }) }] };
  });

  return server;
}

// ─── HTTP-server med enkel request-router ────────────────────
const httpServer = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Api-Key, mcp-session-id');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (req.url === '/health' || req.url === '/perispa/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', sites: Object.keys(config.sites).length, version: '1.0.0' }));
    return;
  }

  // Config reload
  if (req.url === '/reload' || req.url === '/perispa/reload') {
    const key = req.headers['x-api-key'];
    if (key !== API_KEY) { res.writeHead(401); res.end('Unauthorized'); return; }
    try {
      config = loadConfig();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, sites: Object.keys(config.sites).length }));
    } catch (e) {
      res.writeHead(500);
      res.end(e.message);
    }
    return;
  }

  // MCP endpoint
  const isMcp = req.url === '/mcp' || req.url === '/perispa/mcp' ||
                req.url?.startsWith('/mcp?') || req.url?.startsWith('/perispa/mcp?');
  if (!isMcp) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found', endpoints: ['/health', '/mcp', '/reload'] }));
    return;
  }

  // API-nyckel
  const key = req.headers['x-api-key'];
  if (key !== API_KEY) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized — X-Api-Key krävs' }));
    return;
  }

  // Skapa ny MCP-server + transport per request (stateless)
  const mcpServer = buildMcpServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
  });

  try {
    await mcpServer.connect(transport);
    await transport.handleRequest(req, res);
  } catch (e) {
    console.error('MCP request error:', e.message);
    if (!res.headersSent) {
      res.writeHead(500);
      res.end(JSON.stringify({ error: e.message }));
    }
  }
});

httpServer.listen(PORT, '127.0.0.1', () => {
  console.log(`perispa HTTP MCP server startad på port ${PORT}`);
  console.log(`Sites: ${Object.keys(config.sites).join(', ')}`);
  console.log(`Endpoint: http://127.0.0.1:${PORT}/mcp`);
  console.log(`Health:   http://127.0.0.1:${PORT}/health`);
});

httpServer.on('error', (e) => {
  console.error('Server error:', e.message);
  process.exit(1);
});
