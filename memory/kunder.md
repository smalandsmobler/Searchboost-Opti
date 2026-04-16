# Kundöversikt — Searchboost Opti

Uppdaterad: 2026-04-16 (Mobelrondellen full SEO-audit + Sprint 1-3 deployat; Humanpower Utvecklande samtal + Kosttillskott ombyggda)

## Aktiva kunder

| Kund | WP-creds | GSC | Keywords | Status |
|------|----------|-----|----------|--------|
| searchboost | OK | OK | OK | Aktiv |
| ilmonte | OK | EJ ägare | OK | **RETENTION** — 30 dagars gratis från 2026-04-08. Handpåläggning + 2–3 artiklar/vecka. Se `ilmonte_retention.md` |
| mobelrondellen | OK | OK | OK | Aktiv — **full SEO-audit + Sprint 1-3 deployat 2026-04-16**: titles/desc/OG/canonical på alla page-types, LocalBusiness + WebSite + FAQ schema, HTTPS+www 301 via .htaccess, /kollektioner/→/produkt-kategori/ 301, /blogg//blog//news/ 301 till /category/blogg/, ny /om-oss/, enriched index.html med H1/H2/schema för bots, robots.txt + llms.txt uppdaterade, noindex på thin content. Se `presentations/mobelrondellen-seo-audit-2026-04-16.md` + `-fixes-deployed-2026-04-16.md`. Active snippets: #55 #58 #64 #70 |
| humanpower-se | OK | — | OK | Aktiv — **2026-04-16**: Utvecklande samtal hero nu full-width (Kadence fullwidth-meta + CSS override), Kosttillskott-sidan ombyggd i SagaPro-stil med clean 2x2 produktgrid, burk-bilder i fokus, 4 produkter à 399 kr/burk (SagaPRO, Astaxanthin, AstaEye, AstaSkin) med tagline+quote+benefits+CTA per produkt |
| tobler | OK | — | OK | Aktiv — Tobler Ställningsprodukter AB, Torslanda. Bröderna Viktor & Jakob Frostenäs. B2B-leverantör av byggställningar + fallskydd + formsystem + arbetskläder |
| traficator | OK | — | OK | Aktiv — `mikael`-konto full admin access (verifierat 2026-04-09 via cred_check.py) |
| jelmtech | OK | OK | OK | Aktiv — 30 ABC-keywords + audit klar. Saknar artiklar |
| smalandskontorsmobler | OK | OK | OK | Aktiv — SSM-URL fixad 2026-04-08 (ny.→huvuddomän). Optimizer kör nu |
| ferox | OK | — | — | Aktiv — Shopify-migrering pågår, lansering **FLYTTAD** från 2026-04-09 |
| nordicsnusonline | — | — | — | Prospect/ny — 8 000 kr/mån Premium, AI-sök som enda kanal |

## Avslutade kunder (SSM-creds raderade)

- **Kompetensutveckla** — AVSLUTAD 2026-03-13 (SSM redan tomt vid check 2026-04-08)
- **Wedosigns** — AVSLUTAD 2026-04-03, SSM raderat 2026-04-08 kväll (faktura bestrids)
- **Phvast** — AVSLUTAD 2026-04-07, SSM raderat 2026-04-07

## SSM-sökvägar (credentials)
- WP: `/seo-mcp/wordpress/{id}/` OCH `/seo-mcp/integrations/{id}/` — kolla BÅDA
- GSC: `/seo-mcp/integrations/{id}/gsc-property`
- Email: `/seo-mcp/integrations/{id}/contact-email`
- Shopify: `/seo-mcp/shopify/{shop-slug}/access-token` (efter OAuth-flow deployat)

## Portalanvändare (skapade 2026-02-20)
Alla aktiva kunder har konton i portalen. Email = användarnamn.
Lösenord finns i `/tmp/portal_credentials.json` (lokal maskin).

---

## Smålands Kontorsmöbler (SMK)

**WooCommerce-sajt**: https://smalandskontorsmobler.se (INTE ny. — 2026-04-08 fix)
**WP-login**: searchboost / SmkWoo2026!Sb
**WP App Password**: ySlF 8pM4 AAS3 i8aB dK9g g51C (genererat 2026-03-12)
**WP App Password (sbadmin)**: RX0e iWOT 1w4A aWC5 Yiel nxj7 (genererat 2026-03-31)
**FTP**: smkadmin / SmkFtp2026Sb @ ftpcluster.loopia.se (451-fel >10KB → använd base64+PHP)
**Loopia**: smalandsmobler.se / zzEM3CEkD6jq (kundnr FA47-72-74-1576)
**Kontakt**: Mikael Nilsson, mikael@smalandskontorsmobler.se
**Deal**: 6 mån × 7 000 kr = 42 000 kr (WooCommerce-migrering från Abicart)
**GSC**: https://www.smalandskontorsmobler.se/
**GA4**: 395555935
**Swedbank Pay**: payee-id + token i SSM

Nuläge (2026-04-08):
- 898 produkter, alla med bilder/priser/beskrivningar
- Kassa fungerar (fix 2026-04-07: shortcode tillbaka, billing_company optional, FCF avaktiverad)
- DNS: SPF + DMARC fixade 2026-04-07 (via Loopia API, user `searchboost@loopiaapi`)
- SMTP: wp-mail-smtp aktiv, Micke fick Loopia-lösen via kundzon (ej bekräftat)
- Optimizer: SSM-URL fixad 2026-04-08 kväll, första körning pågår
- Bloggartiklar: 5+ i mars 2026 (bra takt)
- Senaste riktiga order: 2026-03-28 (10 dagar sen — ovanligt)

Kvar att göra: se `smk_status_2026-04-08.md`.

---

## Ilmonte — RETENTION-LÄGE

**Sajt**: ilmonte.se
**WP-login**: Mikael Larsson (id 1097, administrator) — app-password i SSM
**Kontakt**: Peter Vikström, sales@ilmonte.se
**Bransch**: scenpodier, dansmattor, scentextil, eventinredning
**GA4**: 331290031
**GSC**: ej ägare (kräver åtgärd från Peter)
**Beebyte API key**: i SSM

**Status 2026-04-08**: Risk att förlora kunden. Mikael har erbjudit 30 dagars gratis från ikväll. Plan: handpåläggning + 2–3 artiklar/vecka + tekniska fixar. Se fullständig plan i `ilmonte_retention.md`.

---

## Jelmtech

**Sajt**: jelmtech.se
**WP-login**: mikael_searchboost / A@JzJb6GSJJsDkMRWtzbmk$O
**WP-admin (gammal)**: web@searchboost.se / G53(k06yd(0N55H85agcbu@V (ej verifierat)
**App-password**: searchboost / 5vLsLvE&TBG4qDVf0ZTxNyYE (var ogiltig — behöver verifieras/förnyas)
**CMS**: WordPress + Divi-tema
**Kontakt**: Camilla Lundström, camilla.lundstrom@jelmtech.se
**Deal**: 3 mån × 8 000 kr = 24 000 kr (Standard)
**GSC**: https://jelmtech.se/
**Customer ID**: jelmtech-se
**Portal**: camilla.lundstrom@jelmtech.se / 634T7jIrKUZS
**Onboardad**: 2026-03-07

**Status**:
- Audit klar 2026-02-17 (score 62/100)
- 30 ABC-nyckelord inlagda
- B2B produktutveckling — plastkonstruktioner, industridesign, prototyper
- Kritiska fixar: language en-US→sv-SE, ingen SEO-plugin, tunna meta-desc
- **HAR redan fått artiklar** (Mikael korrigerade 2026-04-09 — tidigare notering var fel)
- **NYA artiklar behövs nu** — dags för nästa batch

---

## Traficator

**Sajt**: traficator.se
**WP-login**: searchboost (begränsat) / `mikael` (administrator — full access)
**SSM-creds**: `/seo-mcp/wordpress/traficator/{url,username,app-password}` → `mikael`-kontot har full admin via REST (verifierat 2026-04-09)
**CMS**: WordPress 6.9.1 + Flatsome-tema + Rank Math SEO Pro
**Kontakt**: patrik.carlsson@traficator.se
**Status**: Aktiv, GSC ej kopplat
**Not**: GAMMAL felinfo "rest_cannot_create" gällde searchboost-user, inte `mikael`. Cred-check 2026-04-09 bekräftar: `mikael` kan skapa posts, publicera, manage options.

---

## Nordic Snus Online (prospect/ny)

**Avtal**: 8 000 kr/mån Premium
**Nyckelvinkel**: Kan inte använda Google Ads/Meta → AI-sök är enda kanalen
**Briefing**: `docs/briefing-ai-search-produktfeed-2026.md`

---

## Ferox Konsult AB

Se fullständig info i `ferox_shopify.md`.

**Kort**: Shopify-migrering från gamla feroxkonsult.se. 17 produkter redan importerade. Markets + betalning + moms klara. Väntar på Andreas fraktpriser + GSC-ägarskap + domän-koppling. **Lansering flyttad från 2026-04-09** — vi jobbar vidare med hans input.
