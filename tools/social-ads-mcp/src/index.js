#!/usr/bin/env node
/**
 * Searchboost Social + Ads MCP-server (scaffold).
 *
 * En enda MCP-server som ger Claude verktyg för:
 *   - Schemalägga + posta inlägg på LinkedIn, Facebook Page, Instagram, X (Twitter)
 *   - Skapa, pausa, ändra budget för Google Ads-kampanjer
 *   - Samma för Meta Ads (FB + IG)
 *   - Läsa aktuell prestanda från alla kanaler (uniform shape)
 *
 * Just nu: verktygsdefinitioner finns, men de pekar mot kund-specifika
 * SSM-credentials som måste sättas innan respektive verktyg fungerar.
 * Full implementation per plattform skjuts till separat pass.
 *
 * Credentials hämtas från SSM:
 *   /seo-mcp/integrations/<customer_id>/linkedin-access-token
 *   /seo-mcp/integrations/<customer_id>/linkedin-company-id
 *   /seo-mcp/integrations/<customer_id>/facebook-page-token
 *   /seo-mcp/integrations/<customer_id>/facebook-page-id
 *   /seo-mcp/integrations/<customer_id>/instagram-business-id
 *   /seo-mcp/integrations/<customer_id>/twitter-bearer
 *   /seo-mcp/integrations/<customer_id>/google-ads-customer-id
 *   /seo-mcp/integrations/<customer_id>/google-ads-refresh-token
 *   /seo-mcp/integrations/<customer_id>/meta-access-token
 *   /seo-mcp/integrations/<customer_id>/meta-ad-account-id
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { BigQuery } from '@google-cloud/bigquery';
import axios from 'axios';

const REGION = process.env.AWS_REGION || 'eu-north-1';
const ssm = new SSMClient({ region: REGION });

async function getParam(name) {
  const res = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
  return res.Parameter.Value;
}

async function getCreds(customer_id, key) {
  try { return await getParam(`/seo-mcp/integrations/${customer_id}/${key}`); }
  catch { return null; }
}

// ── BQ-loggning (varje åtgärd loggas) ──

async function logAction({ customer_id, channel, action, status, payload, result }) {
  try {
    const bq = new BigQuery({ projectId: 'seo-aouto' });
    await bq.dataset('seo_data').table('social_ads_actions_log').insert([{
      timestamp: new Date().toISOString(),
      customer_id, channel, action, status,
      payload: JSON.stringify(payload || {}),
      result: JSON.stringify(result || {}),
    }]);
  } catch (e) { console.error('BQ log failed:', e.message); }
}

// ══════════════════════════════════════════
// VERKTYGSKATALOG — Posting
// ══════════════════════════════════════════

const POSTING_TOOLS = {
  schedule_linkedin_post: {
    description: 'Schemalägg ett LinkedIn-företagspost. Postas via Marketing API. Kontroll: max 3/vecka per kund (sön/tis/tors-regel).',
    inputSchema: {
      type: 'object',
      required: ['customer_id', 'content'],
      properties: {
        customer_id: { type: 'string' },
        content: { type: 'string', maxLength: 3000 },
        image_url: { type: 'string', description: 'Optional. 1200x627 rekommenderat.' },
        scheduled_at: { type: 'string', description: 'ISO 8601. Default: nästa sön/tis/tors 09:00.' },
      },
    },
    handler: async ({ customer_id, content, image_url, scheduled_at }) => {
      // STUB — full LinkedIn Marketing API impl i separat pass
      // Kontroll: max 3/vecka via BQ social_content_queue-query
      const token = await getCreds(customer_id, 'linkedin-access-token');
      const companyId = await getCreds(customer_id, 'linkedin-company-id');
      if (!token || !companyId) {
        return { error: `Saknar LinkedIn-credentials för ${customer_id}. Sätt /seo-mcp/integrations/${customer_id}/linkedin-access-token + linkedin-company-id i SSM.` };
      }
      // TODO: POST https://api.linkedin.com/v2/ugcPosts (eller via Marketing API om annonser)
      await logAction({ customer_id, channel: 'linkedin', action: 'schedule_post', status: 'scaffold',
        payload: { content_chars: content.length, scheduled_at }, result: { scaffolded: true }});
      return { customer_id, channel: 'linkedin', scheduled_at: scheduled_at || 'next-eligible', status: 'scaffold' };
    },
  },

  schedule_facebook_post: {
    description: 'Schemalägg ett Facebook Page-inlägg via Graph API.',
    inputSchema: {
      type: 'object',
      required: ['customer_id', 'content'],
      properties: {
        customer_id: { type: 'string' },
        content: { type: 'string' },
        image_url: { type: 'string' },
        scheduled_at: { type: 'string' },
      },
    },
    handler: async ({ customer_id, content, image_url, scheduled_at }) => {
      const token = await getCreds(customer_id, 'facebook-page-token');
      const pageId = await getCreds(customer_id, 'facebook-page-id');
      if (!token || !pageId) return { error: `Saknar FB-creds för ${customer_id}.` };
      await logAction({ customer_id, channel: 'facebook', action: 'schedule_post', status: 'scaffold', payload: { content_chars: content.length }, result: {} });
      return { customer_id, channel: 'facebook', status: 'scaffold' };
    },
  },

  schedule_instagram_post: {
    description: 'Schemalägg Instagram-feed-inlägg via Graph API (kräver Instagram Business-konto).',
    inputSchema: {
      type: 'object',
      required: ['customer_id', 'image_url', 'caption'],
      properties: {
        customer_id: { type: 'string' },
        image_url: { type: 'string' },
        caption: { type: 'string', maxLength: 2200 },
        scheduled_at: { type: 'string' },
      },
    },
    handler: async ({ customer_id, image_url, caption, scheduled_at }) => {
      const token = await getCreds(customer_id, 'facebook-page-token');
      const igId = await getCreds(customer_id, 'instagram-business-id');
      if (!token || !igId) return { error: `Saknar IG-creds för ${customer_id}.` };
      await logAction({ customer_id, channel: 'instagram', action: 'schedule_post', status: 'scaffold', payload: { caption_chars: caption.length }, result: {} });
      return { customer_id, channel: 'instagram', status: 'scaffold' };
    },
  },

  post_x: {
    description: 'Posta direkt till X (Twitter) — max 280 tecken.',
    inputSchema: {
      type: 'object',
      required: ['customer_id', 'content'],
      properties: {
        customer_id: { type: 'string' },
        content: { type: 'string', maxLength: 280 },
        reply_to: { type: 'string' },
      },
    },
    handler: async ({ customer_id, content, reply_to }) => {
      const bearer = await getCreds(customer_id, 'twitter-bearer');
      if (!bearer) return { error: `Saknar X-creds för ${customer_id}.` };
      await logAction({ customer_id, channel: 'x', action: 'post', status: 'scaffold', payload: { content_chars: content.length }, result: {} });
      return { customer_id, channel: 'x', status: 'scaffold' };
    },
  },
};

// ══════════════════════════════════════════
// VERKTYGSKATALOG — Ads-management
// ══════════════════════════════════════════

const ADS_TOOLS = {
  list_google_ads_campaigns: {
    description: 'Lista Google Ads-kampanjer för en kund med status, budget, klick, konv.',
    inputSchema: {
      type: 'object',
      required: ['customer_id'],
      properties: {
        customer_id: { type: 'string' },
        period: { type: 'string', default: '30d' },
      },
    },
    handler: async ({ customer_id, period = '30d' }) => {
      const gAdsCustomerId = await getCreds(customer_id, 'google-ads-customer-id');
      const refreshToken = await getCreds(customer_id, 'google-ads-refresh-token');
      if (!gAdsCustomerId || !refreshToken) return { error: `Saknar Google Ads-creds för ${customer_id}.` };
      // TODO: Google Ads API v17 search query
      return { customer_id, status: 'scaffold', campaigns: [] };
    },
  },

  pause_google_ads_campaign: {
    description: 'Pausa en specifik Google Ads-kampanj.',
    inputSchema: {
      type: 'object',
      required: ['customer_id', 'campaign_id'],
      properties: {
        customer_id: { type: 'string' },
        campaign_id: { type: 'string' },
        reason: { type: 'string' },
      },
    },
    handler: async ({ customer_id, campaign_id, reason }) => {
      await logAction({ customer_id, channel: 'google_ads', action: 'pause_campaign', status: 'scaffold',
        payload: { campaign_id, reason }, result: {} });
      return { customer_id, campaign_id, status: 'scaffold' };
    },
  },

  set_google_ads_budget: {
    description: 'Justera dagsbudget för en Google Ads-kampanj (i SEK).',
    inputSchema: {
      type: 'object',
      required: ['customer_id', 'campaign_id', 'daily_budget_sek'],
      properties: {
        customer_id: { type: 'string' },
        campaign_id: { type: 'string' },
        daily_budget_sek: { type: 'number' },
      },
    },
    handler: async (args) => {
      await logAction({ ...args, channel: 'google_ads', action: 'set_budget', status: 'scaffold', payload: args, result: {} });
      return { ...args, status: 'scaffold' };
    },
  },

  list_meta_ads_campaigns: {
    description: 'Lista Meta Ads-kampanjer (Facebook + Instagram) för en kund.',
    inputSchema: {
      type: 'object',
      required: ['customer_id'],
      properties: {
        customer_id: { type: 'string' },
        period: { type: 'string', default: '30d' },
      },
    },
    handler: async ({ customer_id, period = '30d' }) => {
      const token = await getCreds(customer_id, 'meta-access-token');
      const adAccount = await getCreds(customer_id, 'meta-ad-account-id');
      if (!token || !adAccount) return { error: `Saknar Meta Ads-creds för ${customer_id}.` };
      return { customer_id, status: 'scaffold', campaigns: [] };
    },
  },

  pause_meta_ads_campaign: {
    description: 'Pausa en specifik Meta Ads-kampanj.',
    inputSchema: {
      type: 'object',
      required: ['customer_id', 'campaign_id'],
      properties: {
        customer_id: { type: 'string' },
        campaign_id: { type: 'string' },
      },
    },
    handler: async (args) => {
      await logAction({ ...args, channel: 'meta_ads', action: 'pause_campaign', status: 'scaffold', payload: args, result: {} });
      return { ...args, status: 'scaffold' };
    },
  },
};

// ══════════════════════════════════════════
// VERKTYGSKATALOG — Uniform performance read
// ══════════════════════════════════════════

const PERFORMANCE_TOOLS = {
  get_channel_performance: {
    description: 'Hämta uniform prestanda per kund × kanal. Returnerar samma shape oavsett om det är SEO, LinkedIn, Google Ads, Meta Ads.',
    inputSchema: {
      type: 'object',
      required: ['customer_id'],
      properties: {
        customer_id: { type: 'string' },
        channels: {
          type: 'array',
          items: { type: 'string', enum: ['seo', 'linkedin', 'facebook', 'instagram', 'x', 'google_ads', 'meta_ads'] },
        },
        period: { type: 'string', default: '7d' },
      },
    },
    handler: async ({ customer_id, channels, period = '7d' }) => {
      const bq = new BigQuery({ projectId: 'seo-aouto' });
      const days = { '7d': 7, '30d': 30, '90d': 90 }[period] || 7;
      const requested = channels && channels.length ? channels : ['seo', 'linkedin', 'google_ads', 'meta_ads'];

      const results = {};
      for (const ch of requested) {
        try {
          let sql;
          if (ch === 'seo') {
            sql = `SELECT SUM(clicks) clicks, SUM(impressions) impressions FROM \`seo-aouto.seo_data.gsc_daily_metrics\` WHERE customer_id = @cid AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
          } else if (ch === 'google_ads' || ch === 'meta_ads' || ch === 'facebook' || ch === 'instagram') {
            const platform = ch === 'google_ads' ? 'google' : ch === 'meta_ads' ? 'meta' : ch;
            sql = `SELECT SUM(clicks) clicks, SUM(impressions) impressions, SUM(spend) spend, SUM(conversions) conversions FROM \`seo-aouto.seo_data.ads_daily_metrics\` WHERE customer_id = @cid AND platform = '${platform}' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
          } else if (ch === 'linkedin' || ch === 'x') {
            sql = `SELECT SUM(impressions) impressions, SUM(clicks) clicks, COUNT(*) posts FROM \`seo-aouto.seo_data.social_daily_metrics\` WHERE customer_id = @cid AND platform = '${ch}' AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL ${days} DAY)`;
          }
          if (sql) {
            const [rows] = await bq.query({ query: sql, params: { cid: customer_id } });
            results[ch] = rows[0] || {};
          }
        } catch (e) { results[ch] = { error: e.message }; }
      }
      return { customer_id, period, channels: results };
    },
  },
};

// ══════════════════════════════════════════
// MCP SERVER WIRING
// ══════════════════════════════════════════

const ALL_TOOLS = { ...POSTING_TOOLS, ...ADS_TOOLS, ...PERFORMANCE_TOOLS };

const server = new Server(
  { name: 'social-ads-mcp', version: '0.1.0-scaffold' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(ALL_TOOLS).map(([name, def]) => ({
    name, description: def.description, inputSchema: def.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const tool = ALL_TOOLS[name];
  if (!tool) throw new Error(`Unknown tool: ${name}`);
  try {
    const result = await tool.handler(args || {});
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('social-ads-mcp scaffold running on stdio (LinkedIn, FB, IG, X + Google Ads + Meta Ads)');
