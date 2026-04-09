# Searchboost Shopify OAuth

Minimal OAuth-server som hanterar installation av Searchboost Opti på kunders Shopify-butiker. Sparar Admin API access-tokens i AWS SSM så de kan användas av optimizer-Lambdas.

## Setup

1. **Skapa Custom App i Shopify Dev Dashboard**
   - https://dev.shopify.com/dashboard → Apps → Skapa app
   - App-namn: `Searchboost Opti`
   - App-URL: `https://opti.searchboost.se`
   - Tillåtna redirect URLs: `https://opti.searchboost.se/shopify/callback`
   - Kopiera **Client ID** och **Client secret**

2. **Konfigurera miljövariabler**
   ```bash
   cp .env.example .env
   # Fyll i SHOPIFY_API_KEY och SHOPIFY_API_SECRET
   ```

3. **Installera beroenden**
   ```bash
   npm install
   ```

4. **Deploy till EC2**
   - Kör på samma EC2 som Opti (`51.21.116.7`)
   - Lägg till Nginx-route: `/shopify/* → localhost:3100`
   - PM2 process-namn: `shopify-oauth`

## Installation på en kunds butik

Skicka kunden länken:

```
https://opti.searchboost.se/shopify/install?shop=KUNDSTORE.myshopify.com
```

De godkänner → Shopify skickar tillbaka till `/shopify/callback` → vi sparar token i SSM.

## SSM-parametrar som skapas

- `/seo-mcp/shopify/{shop-slug}/access-token` (SecureString)
- `/seo-mcp/shopify/{shop-slug}/shop-domain` (String)
- `/seo-mcp/shopify/{shop-slug}/scopes` (String)

## Använda token från Lambda

```js
const shop = await getParam('/seo-mcp/shopify/feroxkonsult-se/shop-domain');
const token = await getParam('/seo-mcp/shopify/feroxkonsult-se/access-token');
const res = await fetch(`https://${shop}/admin/api/2024-10/products.json`, {
  headers: { 'X-Shopify-Access-Token': token }
});
```

## Debug: lista installerade butiker

```bash
curl -H "X-Api-Key: sb-api-..." https://opti.searchboost.se/shopify/stores
```
