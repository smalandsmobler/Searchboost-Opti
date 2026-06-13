# Case Study — Ferox Konsult

**Bransch:** B2B industri (tidrapportering, stämpelur, mjukvara)
**Utmaning:** Flytta e-handel från Hemsida24 till Shopify utan att bryta installerade klienter
**Period:** 2026-04-07 till 2026-04-10 (3 dagar)

---

## Utgångsläget

Ferox Konsult AB sålde sitt tidrapporteringssystem FeroxTid + stämpelur och tillbehör via Hemsida24 sedan 2009. Sajten hade vuxit till:

- 17 produkter i webshopen
- Komplex fraktstruktur (Sverige, Danmark, Finland, Norge, Åland)
- 22 tjänstesidor för FeroxTid med hårdkodade URL:er
- En egen backend-server (infoline.feroxkonsult.se) som FeroxTid-klienterna frågar för uppdaterings-info
- Ett installerat FeroxTid-program hos hundratals kunder som har hårdkodade länkar till specifika URL:er som /sv-SE/support-20425284

## Utmaningen

När kunden ville flytta till Shopify fanns fem stora risker:

1. **De hårdkodade URL:erna** — om de slutar svara 200 OK kraschar supportfunktionen i alla installerade FeroxTid-klienter
2. **Fraktpriserna** — viktbaserade rates per land med olika tullhantering
3. **Momshantering** — EU-moms (25%), Åland-undantag (0%), VAT-fält för B2B-kunder
4. **Fakturabetalning** — kundens största betalsätt, behövde manual payment method med specifika villkor
5. **Domänpekning via Office 365 DNS** — kundens administratör var upptagen med andra projekt

## Vad vi gjorde

**Dag 1 (onsdag) — Förberedelse:**
- Shopify OAuth-app byggd och deployad på EC2 för programmatic admin-access
- Custom distribution konfigurerad av kunden (5 min)
- Access token sparad i AWS SSM
- `ferox_launch.py`-script skrivet med allt konfigurationsarbete

**Dag 2 (torsdag) — Autonom exekvering:**
- 7 fraktzoner konfigurerade via GraphQL Delivery Profile (30 weight-based rates totalt)
- 3 nya sidor skapade: Försäljningsvillkor, Support, Info efter nytt år
- 14 migration-redirects från gamla Hemsida24-URL:er
- Theme-customization: collection grid 4 → 3 kolumner
- 20 produktbilder normaliserade till enhetlig kvadrat
- Manuell faktura-betalning konfigurerad med specifika villkor
- Alla 22 tjänstesidors text återställd från WordPress revisions (upptäckt fel som legat sedan migration)

**Dag 3 (fredag) — Go-live:**
- Kunden uppdaterade DNS (A @ → Shopify-IP, CNAME www → shops.myshopify.com)
- `infoline`-subdomän fick egen A-post så FeroxTid-klienterna fortsätter funka
- SSL-cert utfärdat automatiskt av Shopify via Let's Encrypt
- Support-sidan täcks av 301-redirect så /sv-SE/support-20425284 → /pages/support
- Testorder genomförd, faktura-flödet verifierat

## Resultat

- ✓ Shopify live på feroxkonsult.se inom 3 dagar från kick-off
- ✓ Noll downtime för befintliga FeroxTid-klienter tack vare infoline-subdomän + migration-redirects
- ✓ Fraktpriser exakt som Hemsida24 hade det
- ✓ Kunden verifierar varje steg innan go-live
- ✓ All administrativ konfiguration gjord autonomt via API — kunden klickade inget

**Total tid hos oss:** cirka 6 timmar aktivt arbete (utspritt över 3 dagar)

## Insikter

1. **Shopify Admin API + GraphQL Delivery Profile räcker långt.** Det mesta som tidigare krävde manuella klick kan scriptas.

2. **WordPress revisions är guld värt.** När vi upptäckte att en tidigare webbutvecklare tagit bort texten på tjänstesidorna kunde vi återställa ~37 500 tecken text från revisionshistoriken.

3. **Hårdkodade URL:er i distribuerad mjukvara är migrations-risken.** Lösning: 301-redirects + behåll subdomäner som kritisk infrastruktur.

4. **Custom distribution i Shopify Partners-appen låter oss köra allt programmatiskt** — men domän-koppling och tax collection måste fortfarande göras i admin UI.

## Erbjudande till liknande kunder

Vi kan flytta en WooCommerce- eller Hemsida24-butik till Shopify på **3-5 dagar** med:

- Fullständig produktmigrering
- Fraktpriser konfigurerade via API
- SEO-migration med 301-redirects
- Theme-anpassning till kundens brand
- Testorder och verifiering innan go-live
