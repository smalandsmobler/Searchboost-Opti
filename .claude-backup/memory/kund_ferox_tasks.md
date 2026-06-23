---
name: Ferox tasks
description: Aktiv task-checklista för Ferox Shopify-migrering
type: project
---

# Ferox — Tasks

**Status**: 🟡 Shopify-migrering, lansering FLYTTAD (från 2026-04-09)
**Kontakt**: Andreas Sternberg (Andreas.Sternberg@feroxkonsult.se)
**Site**: feroxkonsult-se.myshopify.com → feroxkonsult.se (ej kopplad)

## KRITISKA FYND 2026-04-09 (via Hemsida24 sitemap)
- [ ] **K765 stämpelur SAKNAS i Shopify-importen** — ny produkt finns som dold sida på Hemsida24 (`/sv-SE/stämpelur/k765-46455435`, 3256 chars). Lägg till i butiken innan lansering. Andreas har inte nämnt detta.
- [ ] **Försäljningsvillkor** (6513 chars) finns på Hemsida24 (`/sv-SE/försäljningsvillkor-21728997`) — måste in på Shopify som separat sida innan lansering
- [ ] **11 news-sidor** finns som orphan pages FeroxTid pekar på: biopad, efter_nytt_ar, gdpr, halloween_2024, innan_nytt_ar, jul-nyar, mobil, oppettider, oppettider_stangt, varva_van, nyheter. Scraped till `content-pages/ferox-hemsida24-scrape/`. Besluta: migrera till Shopify blog posts ELLER sätt upp redirects till motsvarande nya URL:er.
- [ ] **Separat "tidsredovisning"-sida** (`/sv-SE/tidsredovisning-45625692`, 4748 chars) — dublett/alternativ av ordinarie tidredovisningen? Kolla med Andreas.
- [ ] **gömda-bilder + nedladdningsbara-filer** — små dolda arkivsidor. Kontrollera om de innehåller filer som måste migreras.

## Nästa steg (kan köras utan Andreas)
- [x] Fraktpriser i Shopify Settings → Shipping (5 zoner, viktbaserat) — KLAR 2026-04-10
- [x] Åland tax override 0% — KLAR (API-bekräftat: tax=0.0)
- [ ] VAT-fält DK/FI i checkout (collect tax number) — kräver Shopify Plus eller app
- [ ] Ladda upp ferox-logo.png till Theme Customizer → Header (måste göras manuellt i admin)
- [x] Theme grid 4 → 3 kolumner — KLAR (var redan 3)
- [x] Ta bort email/nyhetsbrev från Theme Footer — KLAR 2026-04-10 (newsletter_enable: false)
- [x] Theme Translations: "Tax included" → tom sträng — KLAR 2026-04-10 (en.default.json uppdaterad)
- [x] Support-sidan: Mall → `contact` — KLAR (template_suffix='contact' bekräftat)
- [x] TP-6: ta bort "Köp stämpelkort"-auto-rekommendation — KLAR 2026-04-10 (related-products borttaget)

## Väntar på Andreas
- [ ] Hemsida24-login (SMS-login funkar inte, Andreas mailar lösen)
- [ ] FeroxTid dolda nyhetssidor (kräver Hemsida24-admin för att lista alla)
- [ ] Domän-koppling feroxkonsult.se (Office 365 DNS, Andreas måste peka om)
- [ ] Tullavgift Norge/Åland — exakt belopp saknas
- [ ] GSC-ägarskap för feroxkonsult.se

## Klart 2026-04-07 → 2026-04-10
- [x] 17 produkter importerade via CSV (ex-moms, B2B)
- [x] Markets: SE + EU + Norge
- [x] Shopify Payments + PayPal + Manuell faktura aktiva
- [x] Shopify Tax aktiv för EU
- [x] Kontakt-sidan rensad från Liquid
- [x] Support-sidan texter OK, TW-knapp S3-länk
- [x] TeamViewerQS_Ferox.exe på S3 (för stor för Shopify Files)
- [x] Inloggning klar (mikael.searchboost@gmail.com, Google SSO + Passkey)
- [x] Collaborator code 0726
- [x] Fraktpriser hämtade från Andreas och sparade i `ferox_shopify.md`

## Pausad
- [ ] Söka dolda news_*-sidor via Wayback/Google — 3 hittade, resten kräver Hemsida24-admin
  - Nästa steg: logga in på Hemsida24 när Andreas mailar lösen

## Viktigt
**Mikaels bedömning**: Svara INTE med delsvar till Andreas. Ett samlat "allt klart + testorder OK"-mail när allt är fixat. Inte småplottra.

## Referenser
- Full info: `ferox_shopify.md`
- OAuth-app (framtida integration): `/Users/weerayootandersson/Downloads/Searchboost-Opti/shopify-app/`
