/**
 * perispa — editTarget: Safe Draft-and-Approve Workflow
 *
 * Skapar en säker redigeringsprocess:
 *   1. perispa_stage_for_edit   — Duplicerar en publicerad sida som draft
 *   2. perispa_approve_staged   — Publicerar draften och arkiverar originalet (eller byter)
 *   3. perispa_discard_staged   — Kastar draften och behåller originalet oförändrat
 *   4. perispa_list_staged      — Visar alla aktiva staging-drafts
 *
 * Metadata: staging-info lagras i page/post meta:
 *   _perispa_staged_from  — original-sidas ID
 *   _perispa_staged_at    — timestamp
 *   _perispa_staged_type  — 'page' | 'post'
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

module.exports = function registerEditTargetTools(server, getSite, wpFetch) {

  server.tool(
    'perispa_stage_for_edit',
    'Skapar en säker redigeringskopia (draft) av en publicerad sida eller inlägg. ' +
    'Originalet rörs inte. Redigera draften och godkänn med perispa_approve_staged när du är klar. ' +
    'Perfekt för att göra ändringar utan att riskera den live-sida som besökare ser.',
    {
      site: z.string().optional(),
      id: z.number().describe('Originalsidans/inläggets ID'),
      content_type: z.string().optional().default('page').describe('"page" eller "post"'),
      draft_title_suffix: z.string().optional().default(' [STAGING]').describe('Suffix som läggs till drafttiteln för igenkänning'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.content_type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';

        // Hämta originalet
        const orig = (await wpFetch(s, `${endpoint}/${args.id}`, { params: { context: 'edit' } })).data;

        // Bygg draft-body med all relevant data
        const draftBody = {
          title: (orig.title?.raw || orig.title?.rendered || '') + args.draft_title_suffix,
          content: orig.content?.raw || orig.content?.rendered || '',
          excerpt: orig.excerpt?.raw || orig.excerpt?.rendered || '',
          status: 'draft',
          slug: `${orig.slug}-staging-${Date.now()}`,
          meta: {
            ...(orig.meta || {}),
            _perispa_staged_from: String(orig.id),
            _perispa_staged_at: new Date().toISOString(),
            _perispa_staged_type: args.content_type,
          },
        };

        // Kopiera kategorier, taggar, featured image för posts
        if (args.content_type === 'post') {
          if (orig.categories?.length) draftBody.categories = orig.categories;
          if (orig.tags?.length) draftBody.tags = orig.tags;
          if (orig.featured_media) draftBody.featured_media = orig.featured_media;
          if (orig.author) draftBody.author = orig.author;
        } else {
          // Page-specifikt
          if (orig.parent) draftBody.parent = orig.parent;
          if (orig.template) draftBody.template = orig.template;
          if (orig.featured_media) draftBody.featured_media = orig.featured_media;
        }

        const draft = (await wpFetch(s, endpoint, { method: 'POST', body: draftBody })).data;

        return text({
          staged: true,
          draft_id: draft.id,
          draft_link: draft.link,
          draft_edit_url: `${s.url}/wp-admin/post.php?post=${draft.id}&action=edit`,
          original_id: orig.id,
          original_link: orig.link,
          original_status: orig.status,
          message: `Draft skapad (ID: ${draft.id}). Redigera och godkänn med perispa_approve_staged.`,
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_approve_staged',
    'Godkänner och publicerar en staging-draft. ' +
    'Draften publiceras med originalets slug och originalets status sätts till "private" (eller draft). ' +
    'Staging-suffix tas bort från titeln automatiskt.',
    {
      site: z.string().optional(),
      draft_id: z.number().describe('Draftens ID (från perispa_stage_for_edit)'),
      action: z.enum(['publish_and_archive', 'publish_only']).optional().default('publish_and_archive')
        .describe(
          '"publish_and_archive" (default): publicera draften och sätt originalet till "private". ' +
          '"publish_only": publicera draften men rör inte originalet.'
        ),
      remove_suffix: z.boolean().optional().default(true)
        .describe('Ta bort [STAGING]-suffix från titeln vid publicering'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);

        // Hämta draften
        let draft;
        let endpoint;
        try {
          draft = (await wpFetch(s, `wp/v2/pages/${args.draft_id}`, { params: { context: 'edit' } })).data;
          endpoint = 'wp/v2/pages';
        } catch {
          draft = (await wpFetch(s, `wp/v2/posts/${args.draft_id}`, { params: { context: 'edit' } })).data;
          endpoint = 'wp/v2/posts';
        }

        const originalId = draft.meta?._perispa_staged_from
          ? parseInt(draft.meta._perispa_staged_from)
          : null;

        // Hämta originalet för att ta over slug
        let original = null;
        if (originalId) {
          try {
            original = (await wpFetch(s, `${endpoint}/${originalId}`, { params: { context: 'edit' } })).data;
          } catch { /* original kan vara borttaget */ }
        }

        // Rensa titel från staging-suffix
        let newTitle = draft.title?.raw || draft.title?.rendered || '';
        if (args.remove_suffix) {
          newTitle = newTitle.replace(/\s*\[STAGING\]$/i, '').trim();
        }

        // Publicera draften med originalets slug (om tillgängligt)
        const publishBody = {
          status: 'publish',
          title: newTitle,
        };
        if (original?.slug) {
          publishBody.slug = original.slug;
        }

        const published = (await wpFetch(s, `${endpoint}/${args.draft_id}`, {
          method: 'POST',
          body: publishBody,
        })).data;

        // Arkivera originalet om önskat
        let archiveResult = null;
        if (args.action === 'publish_and_archive' && original) {
          await wpFetch(s, `${endpoint}/${originalId}`, {
            method: 'POST',
            body: { status: 'private', slug: `${original.slug}-archived-${Date.now()}` },
          });
          archiveResult = { archived: true, original_id: originalId, new_status: 'private' };
        }

        return text({
          approved: true,
          published_id: published.id,
          published_link: published.link,
          title: published.title?.rendered,
          original_archived: archiveResult,
          message: 'Staging-draft publicerad' + (archiveResult ? ', originalet arkiverat (private).' : '.'),
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_discard_staged',
    'Kastar en staging-draft och behåller originalet oförändrat. Draften tas bort.',
    {
      site: z.string().optional(),
      draft_id: z.number().describe('Draftens ID att kasta'),
      force: z.boolean().optional().default(false).describe('true = permanent borttagning, false = papperskorg'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const params = { force: args.force ? 'true' : 'false' };

        // Prova page först, sedan post
        try {
          await wpFetch(s, `wp/v2/pages/${args.draft_id}`, { method: 'DELETE', params });
        } catch {
          await wpFetch(s, `wp/v2/posts/${args.draft_id}`, { method: 'DELETE', params });
        }

        return text({
          discarded: true,
          draft_id: args.draft_id,
          permanent: args.force,
          message: `Draft ${args.draft_id} ${args.force ? 'permanent borttagen' : 'flyttad till papperskorg'}.`,
        });
      } catch (e) { return err(e.message); }
    }
  );

  server.tool(
    'perispa_list_staged',
    'Lista alla aktiva staging-drafts som skapats med perispa_stage_for_edit.',
    {
      site: z.string().optional(),
      content_type: z.string().optional().default('page').describe('"page" eller "post"'),
    },
    async (args) => {
      try {
        const s = getSite(args.site);
        const endpoint = args.content_type === 'post' ? 'wp/v2/posts' : 'wp/v2/pages';

        // Sök efter drafts med [STAGING] i titeln
        const res = await wpFetch(s, endpoint, {
          params: { status: 'draft', search: 'STAGING', per_page: 50, context: 'edit' },
        });

        const staged = res.data
          .filter((p) => {
            const title = p.title?.raw || p.title?.rendered || '';
            return title.includes('[STAGING]') || p.meta?._perispa_staged_from;
          })
          .map((p) => ({
            draft_id: p.id,
            title: p.title?.rendered || p.title?.raw || '',
            draft_edit_url: `${s.url}/wp-admin/post.php?post=${p.id}&action=edit`,
            original_id: p.meta?._perispa_staged_from || null,
            staged_at: p.meta?._perispa_staged_at || p.date,
            modified: p.modified,
          }));

        return text({ total: staged.length, staged });
      } catch (e) { return err(e.message); }
    }
  );
};
