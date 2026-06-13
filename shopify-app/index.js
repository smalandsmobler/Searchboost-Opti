/**
 * Searchboost Shopify OAuth Callback
 *
 * Minimal Express-server som hanterar OAuth-flödet för att installera
 * Searchboost Opti på kundens Shopify-butik och spara Admin API
 * access-token i SSM Parameter Store.
 *
 * Flöde:
 *   1. Kund går till https://opti.searchboost.se/shopify/install?shop=xyz.myshopify.com
 *   2. Redirect till Shopify OAuth consent
 *   3. Shopify redirectar tillbaka till /shopify/callback med code
 *   4. Vi byter code mot access_token
 *   5. Sparar token i SSM: /seo-mcp/shopify/{shop}/access-token
 *   6. Visar success-sida
 *
 * Miljövariabler:
 *   SHOPIFY_API_KEY        — från Shopify Dev Dashboard Custom App
 *   SHOPIFY_API_SECRET     — från samma
 *   SHOPIFY_SCOPES         — t.ex. "read_products,write_products,read_orders,write_orders,read_content,write_content"
 *   SHOPIFY_APP_URL        — public URL till denna server, t.ex. https://opti.searchboost.se
 *   PORT                   — default 3100
 *   AWS_REGION             — default eu-north-1
 */
const express = require('express');
const crypto = require('crypto');
const { SSMClient, PutParameterCommand, GetParameterCommand } = require('@aws-sdk/client-ssm');

require('dotenv').config();

const {
  SHOPIFY_API_KEY,
  SHOPIFY_API_SECRET,
  SHOPIFY_SCOPES = 'read_products,write_products,read_orders,write_orders,read_content,write_content,read_themes,write_themes,read_customers',
  SHOPIFY_APP_URL = 'https://opti.searchboost.se',
  PORT = 3100,
  AWS_REGION = 'eu-north-1',
} = process.env;

if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
  console.warn('⚠️  SHOPIFY_API_KEY och SHOPIFY_API_SECRET måste sättas i .env');
}

const ssm = new SSMClient({ region: AWS_REGION });
const app = express();
app.use(express.json());

// In-memory state store (OK för single-instance; flytta till Redis vid scale)
const stateStore = new Map();

function verifyHmac(query, secret) {
  const { hmac, ...rest } = query;
  const sorted = Object.keys(rest).sort().map(k => `${k}=${rest[k]}`).join('&');
  const calculated = crypto.createHmac('sha256', secret).update(sorted).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(calculated));
}

// Steg 1: Installation — användaren öppnar denna URL med ?shop=xyz.myshopify.com
app.get('/shopify/install', (req, res) => {
  const shop = req.query.shop;
  if (!shop || !/^[a-z0-9-]+\.myshopify\.com$/.test(shop)) {
    return res.status(400).send('Invalid shop parameter. Expected format: xyz.myshopify.com');
  }
  const state = crypto.randomBytes(16).toString('hex');
  stateStore.set(state, { shop, createdAt: Date.now() });
  // Clean up old states (>10 min)
  for (const [k, v] of stateStore) {
    if (Date.now() - v.createdAt > 600000) stateStore.delete(k);
  }
  const redirectUri = `${SHOPIFY_APP_URL}/shopify/callback`;
  const installUrl =
    `https://${shop}/admin/oauth/authorize` +
    `?client_id=${SHOPIFY_API_KEY}` +
    `&scope=${encodeURIComponent(SHOPIFY_SCOPES)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&grant_options[]=`;
  res.redirect(installUrl);
});

// Steg 2: OAuth callback — Shopify skickar tillbaka code + state efter godkännande
app.get('/shopify/callback', async (req, res) => {
  const { shop, code, state, hmac } = req.query;

  if (!shop || !code || !state || !hmac) {
    return res.status(400).send('Saknar parametrar');
  }

  // Verifiera HMAC
  try {
    if (!verifyHmac(req.query, SHOPIFY_API_SECRET)) {
      return res.status(401).send('HMAC-verifiering misslyckades');
    }
  } catch (e) {
    return res.status(401).send('HMAC-verifiering misslyckades: ' + e.message);
  }

  // Verifiera state
  if (!stateStore.has(state)) {
    return res.status(401).send('Ogiltig state (kan ha gått ut)');
  }
  stateStore.delete(state);

  // Byt code mot access_token
  try {
    const tokenRes = await fetch(`https://${shop}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: SHOPIFY_API_KEY,
        client_secret: SHOPIFY_API_SECRET,
        code,
      }),
    });
    const data = await tokenRes.json();
    if (!data.access_token) {
      return res.status(500).send('Inget access_token i svaret: ' + JSON.stringify(data));
    }

    // Normalisera shop-id (xyz.myshopify.com -> xyz)
    const shopSlug = shop.replace('.myshopify.com', '').replace(/[^a-z0-9-]/g, '-');

    // Spara i SSM
    const paramName = `/seo-mcp/shopify/${shopSlug}/access-token`;
    await ssm.send(new PutParameterCommand({
      Name: paramName,
      Value: data.access_token,
      Type: 'SecureString',
      Overwrite: true,
      Description: `Shopify Admin API access token for ${shop}`,
    }));

    await ssm.send(new PutParameterCommand({
      Name: `/seo-mcp/shopify/${shopSlug}/shop-domain`,
      Value: shop,
      Type: 'String',
      Overwrite: true,
    }));

    await ssm.send(new PutParameterCommand({
      Name: `/seo-mcp/shopify/${shopSlug}/scopes`,
      Value: data.scope || SHOPIFY_SCOPES,
      Type: 'String',
      Overwrite: true,
    }));

    console.log(`✅ Token sparad för ${shop} i ${paramName}`);

    res.send(`
      <!doctype html>
      <html lang="sv"><head><meta charset="utf-8"><title>Searchboost Opti — Installerad</title>
      <style>body{font-family:-apple-system,sans-serif;max-width:600px;margin:80px auto;padding:20px;background:#1a1a1a;color:#fff}h1{color:#00d4ff}a{color:#e91e8c}</style>
      </head><body>
      <h1>✅ Searchboost Opti är installerad</h1>
      <p><strong>Butik:</strong> ${shop}</p>
      <p><strong>Scopes:</strong> ${data.scope}</p>
      <p>Access-token är sparad i AWS SSM Parameter Store:<br><code>${paramName}</code></p>
      <p>Du kan nu stänga det här fönstret. Opti-systemet kommer börja optimera butiken inom kort.</p>
      <p><a href="https://opti.searchboost.se/">→ Till Opti-dashboarden</a></p>
      </body></html>
    `);
  } catch (err) {
    console.error('OAuth-fel:', err);
    res.status(500).send('Fel vid token-utbyte: ' + err.message);
  }
});

// Healthcheck
app.get('/shopify/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Lista alla installerade butiker (debug)
app.get('/shopify/stores', async (req, res) => {
  // Enkel skydd via API-key
  const key = req.headers['x-api-key'];
  if (!key || key !== process.env.DASHBOARD_API_KEY) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const { GetParametersByPathCommand } = require('@aws-sdk/client-ssm');
    const out = await ssm.send(new GetParametersByPathCommand({
      Path: '/seo-mcp/shopify/',
      Recursive: true,
    }));
    const stores = {};
    for (const p of out.Parameters || []) {
      const parts = p.Name.split('/');
      const slug = parts[3];
      const key = parts[4];
      if (!stores[slug]) stores[slug] = { slug };
      stores[slug][key] = key === 'access-token' ? '***' : p.Value;
    }
    res.json(Object.values(stores));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Searchboost Shopify OAuth lyssnar på port ${PORT}`);
  console.log(`Install-URL: ${SHOPIFY_APP_URL}/shopify/install?shop=feroxkonsult-se.myshopify.com`);
});
