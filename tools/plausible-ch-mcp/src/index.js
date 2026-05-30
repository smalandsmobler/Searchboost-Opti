#!/usr/bin/env node
/**
 * Plausible ClickHouse-direct MCP-server.
 *
 * Backup mot getsentry/plausible-mcp: vi går runt Plausible Stats API och queryar
 * ClickHouse direkt. Ger samma verktygssurface (get_timeseries, get_breakdown,
 * get_conversions, compare_periods) men ingen API-key eller rate-limit.
 *
 * Förutsätter en SSH-tunnel till Plausible-EC2:
 *   ssh -fN -L 18123:127.0.0.1:8123 ubuntu@<plausible-eip>
 *
 * Env-variabler:
 *   CH_URL              Default: http://localhost:18123
 *   CH_DATABASE         Default: plausible_events_db
 *   CH_USER             Default: default
 *   CH_PASSWORD         (tom default)
 *
 * Sites identifieras via site_id (numeriskt internal ID i Plausible)
 * eller via 'domain' (vi mappar genom Postgres-tabellen sites — krävs en separat
 * mapping eller hårdkodning per kund). För enkelhetens skull använder vi 'domain'
 * som filter direkt mot events_v2.hostname.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { createClient } from '@clickhouse/client';
import { z } from 'zod';

const CH_URL = process.env.CH_URL || 'http://localhost:18123';
const CH_DATABASE = process.env.CH_DATABASE || 'plausible_events_db';

const ch = createClient({
  url: CH_URL,
  database: CH_DATABASE,
  username: process.env.CH_USER || 'default',
  password: process.env.CH_PASSWORD || '',
});

// ── Hjälpfunktioner ──

function parsePeriod(period) {
  const m = String(period || '7d').match(/^(\d+)([dwmy])$/);
  if (!m) return 7;
  const [, n, unit] = m;
  const days = { d: 1, w: 7, m: 30, y: 365 }[unit] || 1;
  return parseInt(n, 10) * days;
}

function dateRange(period) {
  const days = parsePeriod(period);
  return `timestamp >= now() - INTERVAL ${days} DAY`;
}

async function query(sql) {
  const result = await ch.query({ query: sql, format: 'JSONEachRow' });
  return await result.json();
}

// ── Tool implementations ──

const TOOLS = {
  get_timeseries: {
    description: 'Trafik och konv-metrics över tid (daily/weekly/monthly). Bypass Plausible Stats API — queryar ClickHouse direkt.',
    inputSchema: {
      type: 'object',
      required: ['domain'],
      properties: {
        domain: { type: 'string', description: 'Sajtens hostname (ex: arbetsro.se)' },
        period: { type: 'string', description: '7d / 30d / 90d / 1y', default: '7d' },
        interval: { type: 'string', enum: ['day', 'week', 'month'], default: 'day' },
        metrics: { type: 'array', items: { type: 'string' }, default: ['visitors', 'pageviews'] },
      },
    },
    handler: async ({ domain, period = '7d', interval = 'day', metrics = ['visitors', 'pageviews'] }) => {
      const bucket = { day: 'toDate(timestamp)', week: 'toStartOfWeek(timestamp)', month: 'toStartOfMonth(timestamp)' }[interval];
      const selects = [
        `${bucket} AS period`,
        metrics.includes('visitors') && 'uniqExact(user_id) AS visitors',
        metrics.includes('pageviews') && `countIf(name = 'pageview') AS pageviews`,
        metrics.includes('events') && 'count() AS events',
        metrics.includes('bounce_rate') && `100 * countIf(name = 'pageview' AND session_id = (SELECT min(session_id) FROM events_v2 WHERE user_id = e.user_id)) / nullif(uniqExact(session_id), 0) AS bounce_rate`,
      ].filter(Boolean).join(', ');
      const sql = `SELECT ${selects} FROM events_v2 e WHERE hostname = '${domain.replace(/'/g, "\\'")}' AND ${dateRange(period)} GROUP BY period ORDER BY period`;
      const rows = await query(sql);
      return { domain, period, interval, rows };
    },
  },

  get_breakdown: {
    description: 'Bryt ner per sida, källa, land, device, browser, OS, UTM. Bypass Stats API.',
    inputSchema: {
      type: 'object',
      required: ['domain', 'dimension'],
      properties: {
        domain: { type: 'string' },
        dimension: {
          type: 'string',
          enum: ['page', 'source', 'country', 'device', 'browser', 'os', 'utm_source', 'utm_campaign', 'utm_medium', 'referrer'],
        },
        period: { type: 'string', default: '7d' },
        limit: { type: 'integer', default: 20 },
      },
    },
    handler: async ({ domain, dimension, period = '7d', limit = 20 }) => {
      const dimMap = {
        page: 'pathname',
        source: 'referrer_source',
        country: 'country_code',
        device: 'screen_size',
        browser: 'browser',
        os: 'operating_system',
        utm_source: 'utm_source',
        utm_campaign: 'utm_campaign',
        utm_medium: 'utm_medium',
        referrer: 'referrer',
      };
      const col = dimMap[dimension];
      const sql = `
        SELECT ${col} AS ${dimension},
               uniqExact(user_id) AS visitors,
               countIf(name = 'pageview') AS pageviews
        FROM events_v2
        WHERE hostname = '${domain.replace(/'/g, "\\'")}' AND ${dateRange(period)}
              AND ${col} != ''
        GROUP BY ${dimension}
        ORDER BY visitors DESC
        LIMIT ${parseInt(limit, 10)}`;
      const rows = await query(sql);
      return { domain, dimension, period, rows };
    },
  },

  get_conversions: {
    description: 'Goal/event-konverteringar (custom events skickade via window.plausible(...)). Bypass Stats API.',
    inputSchema: {
      type: 'object',
      required: ['domain'],
      properties: {
        domain: { type: 'string' },
        period: { type: 'string', default: '30d' },
      },
    },
    handler: async ({ domain, period = '30d' }) => {
      const sql = `
        SELECT name AS goal,
               uniqExact(user_id) AS unique_conversions,
               count() AS total_conversions
        FROM events_v2
        WHERE hostname = '${domain.replace(/'/g, "\\'")}' AND ${dateRange(period)}
              AND name != 'pageview'
        GROUP BY name
        ORDER BY unique_conversions DESC`;
      const rows = await query(sql);
      return { domain, period, rows };
    },
  },

  compare_periods: {
    description: 'Jämför två tidsperioder sida vid sida (denna vs föregående). Bypass Stats API.',
    inputSchema: {
      type: 'object',
      required: ['domain'],
      properties: {
        domain: { type: 'string' },
        period: { type: 'string', default: '30d' },
      },
    },
    handler: async ({ domain, period = '30d' }) => {
      const days = parsePeriod(period);
      const sql = `
        SELECT
          countIf(timestamp >= now() - INTERVAL ${days} DAY AND name = 'pageview') AS pageviews_current,
          uniqExactIf(user_id, timestamp >= now() - INTERVAL ${days} DAY) AS visitors_current,
          countIf(timestamp >= now() - INTERVAL ${days * 2} DAY AND timestamp < now() - INTERVAL ${days} DAY AND name = 'pageview') AS pageviews_previous,
          uniqExactIf(user_id, timestamp >= now() - INTERVAL ${days * 2} DAY AND timestamp < now() - INTERVAL ${days} DAY) AS visitors_previous
        FROM events_v2
        WHERE hostname = '${domain.replace(/'/g, "\\'")}' AND timestamp >= now() - INTERVAL ${days * 2} DAY`;
      const rows = await query(sql);
      const r = rows[0] || {};
      const pct = (now, prev) => prev > 0 ? Math.round(((now - prev) / prev) * 100) : null;
      return {
        domain,
        period,
        visitors: { current: Number(r.visitors_current), previous: Number(r.visitors_previous), pct_change: pct(Number(r.visitors_current), Number(r.visitors_previous)) },
        pageviews: { current: Number(r.pageviews_current), previous: Number(r.pageviews_previous), pct_change: pct(Number(r.pageviews_current), Number(r.pageviews_previous)) },
      };
    },
  },
};

// ── MCP-server ──

const server = new Server(
  { name: 'plausible-ch-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: Object.entries(TOOLS).map(([name, def]) => ({
    name,
    description: def.description,
    inputSchema: def.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  const tool = TOOLS[name];
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
console.error('plausible-ch-mcp running on stdio (ClickHouse-direct, ingen Plausible API-key krävs)');
