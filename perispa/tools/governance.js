/**
 * perispa — Tool Governance & Access Profiler
 *
 * Hanterar access-profiler som begränsar vilka tools som är tillgängliga
 * per kontext/roll. Profiler lagras i perispa-profiles.json bredvid config.json.
 *
 * Tools:
 *   perispa_list_tool_usage    — Lista alla registrerade tools + access-status
 *   perispa_set_access_profile — Skapa eller uppdatera en access-profil
 *   perispa_get_access_profile — Hämta en profil
 *   perispa_list_access_profiles — Lista alla profiler
 *   perispa_check_tool_access  — Kontrollera om ett tool är tillgängligt i profil
 */

'use strict';

const { z } = require('zod');
const fs = require('fs');
const path = require('path');

const PROFILES_PATH = path.join(__dirname, '..', 'perispa-profiles.json');

function loadProfiles() {
  if (!fs.existsSync(PROFILES_PATH)) return {};
  try { return JSON.parse(fs.readFileSync(PROFILES_PATH, 'utf-8')); } catch { return {}; }
}

function saveProfiles(profiles) {
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), 'utf-8');
}

function text(content) {
  const str = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
  const structured = typeof content === 'string' ? { message: content } : content;
  return { content: [{ type: 'text', text: str }], structuredContent: structured };
}
function err(msg) {
  return { content: [{ type: 'text', text: `FEL: ${msg}` }], structuredContent: { error: msg }, isError: true };
}

/**
 * Kontrollerar om ett toolnamn matchar ett mönster.
 * Stöder wildcard (*) i slutet: "perispa_woo_*" matchar alla woo-tools.
 */
function matchPattern(toolName, pattern) {
  if (pattern.endsWith('*')) {
    return toolName.startsWith(pattern.slice(0, -1));
  }
  return toolName === pattern;
}

/**
 * Kontrollerar om ett tool är tillåtet i en profil.
 * Profiler kan ha allowlist (whitelist) och/eller denylist (blacklist).
 * Denylist har prioritet över allowlist.
 */
function isToolAllowed(toolName, profile) {
  const { allowlist, denylist } = profile;

  // Denylist-match blockerar alltid
  if (denylist?.length) {
    const denied = denylist.some((p) => matchPattern(toolName, p));
    if (denied) return false;
  }

  // Om allowlist finns, måste toolen finnas med
  if (allowlist?.length) {
    return allowlist.some((p) => matchPattern(toolName, p));
  }

  // Ingen allowlist = allt tillåtet (utöver denylist ovan)
  return true;
}

module.exports = function registerGovernanceTools(server, getSite, wpFetch) {

  server.tool(
    'perispa_list_tool_usage',
    'Lista alla registrerade perispa-tools med möjlighet att filtrera på profil. ' +
    'Visar vilka tools som är aktiva/blockerade i en given access-profil.',
    {
      profile: z.string().optional().describe('Profilnamn att filtrera mot (t.ex. "viktor", "readonly")'),
      filter: z.enum(['all', 'allowed', 'denied']).optional().default('all'),
      search: z.string().optional().describe('Filtrera toolnamn som innehåller söktermen'),
    },
    async (args) => {
      try {
        // Hämta alla registrerade tool-namn från servern
        // McpServer exponerar inte tools direkt — vi läser från dess interna registry
        const registeredTools = [];
        if (server._registeredTools) {
          for (const name of Object.keys(server._registeredTools)) {
            registeredTools.push(name);
          }
        } else if (server.server?._requestHandlers) {
          // Fallback: lista kända perispa_* tools från tool-modulerna
          registeredTools.push('(tool-lista ej tillgänglig via denna SDK-version — använd perispa_check_tool_access)');
        }

        const profiles = loadProfiles();
        const profile = args.profile ? profiles[args.profile] : null;

        let tools = registeredTools;
        if (args.search) {
          tools = tools.filter((t) => t.includes(args.search));
        }

        const result = tools.map((name) => {
          const allowed = profile ? isToolAllowed(name, profile) : null;
          return { name, allowed_in_profile: allowed };
        });

        const filtered =
          args.filter === 'allowed' ? result.filter((t) => t.allowed_in_profile === true) :
          args.filter === 'denied'  ? result.filter((t) => t.allowed_in_profile === false) :
          result;

        return text({
          total: filtered.length,
          profile: args.profile || null,
          tools: filtered,
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_set_access_profile',
    'Skapa eller uppdatera en access-profil för tool governance. ' +
    'Profiler styr vilka tools som är tillgängliga (t.ex. för Viktor = readonly, ingen woo-delete). ' +
    'Stöder wildcard-mönster: "perispa_woo_*" matchar alla WooCommerce-tools.',
    {
      name: z.string().describe('Profilnamn (t.ex. "readonly", "viktor", "woo-only")'),
      description: z.string().optional().describe('Beskrivning av profilen'),
      allowlist: z.array(z.string()).optional().describe(
        'Mönster för TILLÅTNA tools. Tom = allt tillåtet. ' +
        'Exempel: ["perispa_list_*", "perispa_read_*", "perispa_get_*"]'
      ),
      denylist: z.array(z.string()).optional().describe(
        'Mönster för BLOCKERADE tools (prioritet över allowlist). ' +
        'Exempel: ["perispa_delete_*", "perispa_woo_delete_*"]'
      ),
    },
    async (args) => {
      try {
        const profiles = loadProfiles();
        profiles[args.name] = {
          name: args.name,
          description: args.description || '',
          allowlist: args.allowlist || [],
          denylist: args.denylist || [],
          updated: new Date().toISOString(),
        };
        saveProfiles(profiles);
        return text({
          saved: true,
          profile: args.name,
          allowlist_patterns: args.allowlist?.length || 0,
          denylist_patterns: args.denylist?.length || 0,
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_get_access_profile',
    'Hämta en specifik access-profil med alla dess regler.',
    {
      name: z.string().describe('Profilnamn'),
    },
    async (args) => {
      try {
        const profiles = loadProfiles();
        if (!profiles[args.name]) {
          return err(`Profilen "${args.name}" finns inte. Tillgängliga: ${Object.keys(profiles).join(', ') || 'inga'}`);
        }
        return text(profiles[args.name]);
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_list_access_profiles',
    'Lista alla sparade access-profiler.',
    {},
    async () => {
      try {
        const profiles = loadProfiles();
        return text({
          total: Object.keys(profiles).length,
          profiles: Object.values(profiles).map((p) => ({
            name: p.name,
            description: p.description,
            allowlist_count: p.allowlist?.length || 0,
            denylist_count: p.denylist?.length || 0,
            updated: p.updated,
          })),
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_check_tool_access',
    'Kontrollera om ett specifikt tool är tillåtet i en access-profil.',
    {
      tool_name: z.string().describe('Toolnamn att kontrollera (t.ex. "perispa_delete_post")'),
      profile: z.string().describe('Profilnamn att kontrollera mot'),
    },
    async (args) => {
      try {
        const profiles = loadProfiles();
        if (!profiles[args.profile]) {
          return err(`Profilen "${args.profile}" finns inte`);
        }
        const allowed = isToolAllowed(args.tool_name, profiles[args.profile]);
        return text({
          tool: args.tool_name,
          profile: args.profile,
          allowed,
          reason: allowed ? 'Tillåtet av profil-regler' : 'Blockerat av denylist eller ej i allowlist',
        });
      } catch (e) { return err(e.message); }
    }
  );
};
