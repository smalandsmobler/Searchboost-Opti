import { tool } from '@openrouter/agent/tool';
import { z } from 'zod';

const SB_API = process.env.SEARCHBOOST_API_URL ?? 'https://51.21.116.7';
const SB_KEY = process.env.SEARCHBOOST_API_KEY ?? 'sb-api-41bbf2ec7d8a17973d7b7ebcac07aafab9aa777feb08ce78';
const WP_CREDS_FILE = process.env.WP_CREDS_FILE ?? `${process.env.HOME}/Downloads/Searchboost-Opti/memory/wp_credentials.md`;

// Parsar wp_credentials.md och returnerar credentials för en site
function readLocalCreds(site: string): { url: string; username: string; app_password: string } | null {
  try {
    const fs = require('fs');
    const content = fs.readFileSync(WP_CREDS_FILE, 'utf-8');
    for (const line of content.split('\n')) {
      const parts = line.split('|').map((s: string) => s.trim());
      if (parts.length >= 5 && parts[1] === site) {
        return { url: parts[2], username: parts[3], app_password: parts[4] };
      }
    }
    return null;
  } catch {
    return null;
  }
}

async function wpFetch(wpUrl: string, auth: string, path: string, method = 'GET', body?: object) {
  const res = await fetch(`${wpUrl}/wp-json${path}`, {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    // @ts-ignore – Bun stöder tls-override
    tls: { rejectUnauthorized: false },
  });
  const text = await res.text();
  try { return { ok: res.ok, status: res.status, data: JSON.parse(text) }; }
  catch { return { ok: res.ok, status: res.status, data: text }; }
}

// ── Hämta credentials från Searchboost API ───────────────────────────────────
export const wpGetCredsTool = tool({
  name: 'wp_get_credentials',
  description: 'Hämta WordPress-credentials (URL, användarnamn, app-password) för en Searchboost-kund via site-slug.',
  inputSchema: z.object({
    site: z.string().describe('Site-slug, t.ex. "mobelrondellen", "jelmtech"'),
  }),
  execute: async ({ site }) => {
    // Försök hämta från Searchboost API
    try {
      const res = await fetch(`${SB_API}/api/site/${site}/wp-credentials`, {
        headers: { 'X-Api-Key': SB_KEY },
        // @ts-ignore
        tls: { rejectUnauthorized: false },
      });
      if (res.ok) return await res.json();
    } catch { /* fallback nedan */ }

    // Fallback: läs från lokal wp_credentials.md
    const local = readLocalCreds(site);
    if (local) return local;

    return { error: `Hittade inte credentials för site "${site}" — kontrollera sluggen (t.ex. mobelrondellen, jelmtech, smalandskontorsmobler)` };
  },
});

// ── Hämta alla publicerade sidor ────────────────────────────────────────────
export const wpListPagesTool = tool({
  name: 'wp_list_pages',
  description: 'Hämta alla publicerade sidor från en WordPress-sajt.',
  inputSchema: z.object({
    wpUrl: z.string().describe('WordPress-URL, t.ex. https://mobelrondellen.se'),
    username: z.string(),
    appPassword: z.string(),
    perPage: z.number().optional().default(50),
  }),
  execute: async ({ wpUrl, username, appPassword, perPage = 50 }) => {
    const auth = btoa(`${username}:${appPassword}`);
    const result = await wpFetch(wpUrl, auth, `/wp/v2/pages?per_page=${perPage}&status=publish&_fields=id,title,link,slug`);
    if (!result.ok) return { error: `HTTP ${result.status}`, details: result.data };
    const pages = Array.isArray(result.data) ? result.data : [];
    return { count: pages.length, pages: pages.map((p: any) => ({ id: p.id, title: p.title?.rendered, url: p.link, slug: p.slug })) };
  },
});

// ── Hämta Rank Math SEO-data för en sida ────────────────────────────────────
export const wpGetSeoTool = tool({
  name: 'wp_get_seo',
  description: 'Hämta nuvarande Rank Math SEO-metadata (title, description, focus keyword) för en specifik sida.',
  inputSchema: z.object({
    wpUrl: z.string(),
    username: z.string(),
    appPassword: z.string(),
    pageUrl: z.string().describe('Den fullständiga URL:en för sidan'),
  }),
  execute: async ({ wpUrl, username, appPassword, pageUrl }) => {
    const auth = btoa(`${username}:${appPassword}`);
    // Försök Rank Math REST API
    const rmResult = await wpFetch(wpUrl, auth, `/rankmath/v1/getHead?url=${encodeURIComponent(pageUrl)}`);
    if (rmResult.ok) return rmResult;

    // Fallback: hämta SEO-meta via wp/v2/pages (Rank Math sparar meta i post-meta)
    // Hitta post-ID via slug
    const slug = pageUrl.replace(/\/$/, '').split('/').pop() ?? '';
    const searchResult = await wpFetch(wpUrl, auth, `/wp/v2/pages?slug=${encodeURIComponent(slug)}&_fields=id,title,meta,yoast_head_json`);
    if (searchResult.ok && Array.isArray(searchResult.data) && searchResult.data.length > 0) {
      const page = searchResult.data[0];
      return {
        ok: true,
        source: 'wp_meta_fallback',
        id: page.id,
        title: page.title?.rendered,
        meta: page.meta,
        yoast: page.yoast_head_json,
        note: 'Rank Math REST API ej tillgänglig — använd wp/v2/pages meta-fält',
      };
    }

    return { ok: false, status: rmResult.status, note: 'Rank Math REST ej aktiverat och slug-sökning misslyckades. Fortsätt utan SEO-metadata.' };
  },
});

// ── Uppdatera Rank Math SEO-meta ────────────────────────────────────────────
export const wpUpdateSeoTool = tool({
  name: 'wp_update_seo',
  description: 'Uppdatera Rank Math SEO-metadata för en WordPress-sida (title, description, focus_keyword, robots).',
  inputSchema: z.object({
    wpUrl: z.string(),
    username: z.string(),
    appPassword: z.string(),
    postId: z.number().describe('WordPress post/page ID'),
    meta: z.object({
      rank_math_title: z.string().optional().describe('SEO-titel (55-60 tecken)'),
      rank_math_description: z.string().optional().describe('Meta-beskrivning (150-160 tecken)'),
      rank_math_focus_keyword: z.string().optional().describe('Primärt fokus-nyckelord'),
      rank_math_robots: z.string().optional().describe('t.ex. "index,follow"'),
    }),
  }),
  execute: async ({ wpUrl, username, appPassword, postId, meta }) => {
    const auth = btoa(`${username}:${appPassword}`);
    // Rank Math REST endpoint
    const result = await wpFetch(wpUrl, auth, `/rankmath/v1/updateMeta`, 'POST', { objectID: postId, objectType: 'post', ...meta });
    if (!result.ok) {
      // Fallback: uppdatera via wp/v2/pages custom fields
      const fallback = await wpFetch(wpUrl, auth, `/wp/v2/pages/${postId}`, 'POST', { meta: meta });
      return { method: 'wp_meta_fallback', ...fallback };
    }
    return { method: 'rankmath', ...result };
  },
});

// ── Hämta bilder utan alt-text ───────────────────────────────────────────────
export const wpGetImagesNoAltTool = tool({
  name: 'wp_get_images_no_alt',
  description: 'Hämta alla bilder i WordPress-mediebiblioteket som saknar alt-text.',
  inputSchema: z.object({
    wpUrl: z.string(),
    username: z.string(),
    appPassword: z.string(),
    perPage: z.number().optional().default(50),
  }),
  execute: async ({ wpUrl, username, appPassword, perPage = 50 }) => {
    const auth = btoa(`${username}:${appPassword}`);
    const result = await wpFetch(wpUrl, auth, `/wp/v2/media?per_page=${perPage}&media_type=image&_fields=id,title,alt_text,source_url`);
    if (!result.ok) return { error: `HTTP ${result.status}` };
    const all = Array.isArray(result.data) ? result.data : [];
    const missing = all.filter((img: any) => !img.alt_text?.trim());
    return { total: all.length, missing_alt: missing.length, images: missing.map((img: any) => ({ id: img.id, url: img.source_url, title: img.title?.rendered })) };
  },
});

// ── Uppdatera alt-text på bild ───────────────────────────────────────────────
export const wpUpdateAltTool = tool({
  name: 'wp_update_alt_text',
  description: 'Uppdatera alt-text på en bild i WordPress-mediebiblioteket.',
  inputSchema: z.object({
    wpUrl: z.string(),
    username: z.string(),
    appPassword: z.string(),
    mediaId: z.number(),
    altText: z.string().describe('Beskrivande alt-text på svenska'),
  }),
  execute: async ({ wpUrl, username, appPassword, mediaId, altText }) => {
    const auth = btoa(`${username}:${appPassword}`);
    const result = await wpFetch(wpUrl, auth, `/wp/v2/media/${mediaId}`, 'POST', { alt_text: altText });
    return { id: mediaId, ok: result.ok, status: result.status };
  },
});
