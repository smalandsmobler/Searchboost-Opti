---
name: Shopify app — begär ALLTID breda scopes
description: Vid setup av Shopify custom/Partners-app, begär breda scopes från start — aldrig minimal-lista
type: feedback
---

## Regel

**När jag sätter upp en Shopify Admin API-app (OAuth eller custom distribution), begär ALLTID så omfattande scopes som möjligt direkt. Aldrig "minimal uppsättning för just den här uppgiften".**

**Why:** Kunden måste re-installera appen varje gång scopes ändras. För Andreas (Ferox) 2026-04-09 missade jag write_markets, read_markets, write_locations osv och fick köra arbets-arounds. Andreas är chill och accepterade, men hade det varit Ilmonte eller någon annan kund hade jag "krånglat" från deras perspektiv varje gång jag behövde fråga efter fler rättigheter. En re-install kostar kundens tid och förtroende.

**How to apply — standard Shopify-app scope-lista:**

```
write_content, read_content
write_files, read_files
write_products, read_products
write_product_listings, read_product_listings
write_themes, read_themes
write_shipping, read_shipping
write_locations, read_locations
write_markets, read_markets
write_publications, read_publications
write_inventory, read_inventory
write_orders, read_orders
write_draft_orders, read_draft_orders
write_fulfillments, read_fulfillments
write_checkouts, read_checkouts
write_discounts, read_discounts
write_price_rules, read_price_rules
write_translations, read_translations
write_locales, read_locales
write_customers, read_customers
write_payment_terms, read_payment_terms
write_returns, read_returns
write_reports, read_reports
read_analytics
```

Undantag: Om det är en **publikt listad app** (App Store) kräver Shopify motivering för varje scope → då minimerar vi. Men för **custom / unlisted apps** som körs för en specifik kund — ta allt.

**Kontrollera innan OAuth-install:** Matcha scope-listan i `.env` (`SHOPIFY_SCOPES=...`) mot denna lista. Saknas nåt → lägg till, restart server, kunden gör re-install.
