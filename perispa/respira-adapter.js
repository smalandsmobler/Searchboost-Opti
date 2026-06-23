/**
 * Respira v7-adapter
 * --------------------
 * Auto-detekterar om en kund-sajt har nya Respira plugin v7.0.65
 * (respira/v1 + respira/v2) eller gamla perispa-plugin v3.0.0 (perispa/v1).
 *
 * Returnerar rätt namespace för REST-endpoints, så server.js kan kalla
 * "options" på gamla v3 = /wp-json/perispa/v1/options/<name>
 * och samma på nya v7 = /wp-json/respira/v1/options/<name>
 *
 * Routes-spec extraherade från reverskodade plugin-koden 2026-05-31:
 *   perispa/respira-routes-v7.json (156 routes över 4 namespaces)
 */

const fs = require('fs');
const path = require('path');

const ROUTES_PATH = path.join(__dirname, 'respira-routes-v7.json');
let routesCache = null;
function loadRoutes() {
  if (routesCache) return routesCache;
  if (!fs.existsSync(ROUTES_PATH)) {
    console.error('[respira-adapter] respira-routes-v7.json saknas');
    return { namespaces: {} };
  }
  routesCache = JSON.parse(fs.readFileSync(ROUTES_PATH, 'utf-8'));
  return routesCache;
}

// Cache per site: { 'smalandskontorsmobler': { detectedAt, version, namespace } }
const detectionCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

async function detectApiNamespace(site, wpFetch) {
  const slug = site.slug || site.id || site.url;
  const cached = detectionCache.get(slug);
  if (cached && (Date.now() - cached.detectedAt) < CACHE_TTL_MS) {
    return cached;
  }

  // Probe /wp-json/ för namespaces
  let apiVersion = 'perispa/v1'; // default — gamla
  let pluginVersion = null;

  try {
    const res = await wpFetch(site, '', { method: 'GET' });
    const namespaces = (res && res.namespaces) || [];
    if (namespaces.includes('respira/v1')) {
      apiVersion = 'respira/v1';
      pluginVersion = '7.x';
    } else if (namespaces.includes('perispa/v1')) {
      apiVersion = 'perispa/v1';
      pluginVersion = '3.x';
    } else {
      // Ingen plugin alls
      apiVersion = null;
      pluginVersion = null;
    }
  } catch (e) {
    console.error(`[respira-adapter] probe failed for ${slug}: ${e.message}`);
  }

  const entry = {
    detectedAt: Date.now(),
    apiVersion,
    pluginVersion,
    namespace: apiVersion,
    namespaceV2: apiVersion === 'respira/v1' ? 'respira/v2' : null,
  };
  detectionCache.set(slug, entry);
  return entry;
}

/**
 * Konverterar ett "logiskt" endpoint-namn till rätt URL för en specifik site.
 * Exempel:
 *   resolveEndpoint(site, 'options/sb_plausible_domain', detected)
 *     → 'perispa/v1/options/sb_plausible_domain'  (om v3)
 *     → 'respira/v1/options/sb_plausible_domain'  (om v7)
 */
function resolveEndpoint(logicalPath, detected) {
  if (!detected || !detected.namespace) {
    // Fallback: anta perispa
    return `perispa/v1/${logicalPath.replace(/^\/+/, '')}`;
  }
  const ns = detected.namespace;
  return `${ns}/${logicalPath.replace(/^\/+/, '')}`;
}

/**
 * V2-routes (builder etc) — bara tillgängliga på v7
 */
function resolveEndpointV2(logicalPath, detected) {
  if (!detected || detected.namespaceV2 !== 'respira/v2') {
    throw new Error('Detta endpoint kräver Respira v7.x — site har bara v3.x.');
  }
  return `${detected.namespaceV2}/${logicalPath.replace(/^\/+/, '')}`;
}

function clearCache(slug) {
  if (slug) detectionCache.delete(slug);
  else detectionCache.clear();
}

module.exports = {
  detectApiNamespace,
  resolveEndpoint,
  resolveEndpointV2,
  loadRoutes,
  clearCache,
};
