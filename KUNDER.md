# Kunder — Searchboost Opti

> Delad fil. Mikael + Viktor ser samma info. Uppdatera när något ändras.
> Senast uppdaterad: 2026-04-22 (stort tekniskt SEO-lyft på 8 kunder + Nordic Snus mötesunderlag)

## SEO-lyft 2026-04-22 (sammanfattning)

**353 artiklar** fick "Relaterade artiklar"-block. **2 kritiska SEO-head-fixar** (HP + JT — Rank Math emittade 0 schema). **1 sitemap-bug** fixad (JT /sitemap.xml dead-redirect). **robots.txt härdad** på alla 8 kunder. **llms.txt** expanderad där relevant. Se `content-pages/veckorapport-2026-04-22.md` för detaljer.

| Kund | Interlinks | Övriga fynd 2026-04-22 |
|------|-----------|------------------------|
| SMK | 71/71 | Köp-knappar (#174), SEO accordion (#175), CSS-skydd (#176), JS-läcka borttagen, slideshow fixad, leveranstid 2-3d på alla 25 produkter med avvikande värden |
| HP | 33/33 | **KRITISK**: SEO head emitter (#24) — Rank Math emittade 0 JSON-LD |
| JT | 64/64 | **KRITISK**: sitemap.xml-redirect bug fixad + SEO head emitter (#25) |
| TR | 53/53 | Allt OK, bara content+robots |
| NS | 44/44 | + Mötesunderlag fredag 25 april (`presentations/nordic-snus-mote-2026-04-25.md`) |
| TB | 13/13 | Allt OK, bara content+robots |
| IM | 43/43 | Retention-läge — beslut 9 maj |
| MR | 32/32 | Sucuri WAF kräver browser-UA för API |

---

## Automationsstatus

| Kund | WP-creds | GSC | Keywords | Portalkon to | Status |
|------|----------|-----|----------|--------------|--------|
| searchboost | OK | OK | OK | — | Aktiv |
| kompetensutveckla | OK | OK | OK | mikael.n@kompetensutveckla.se | Aktiv |
| ilmonte | OK | Ej ägare | OK | peter.vikstrom@ilmonte.se | Aktiv (ingen GSC-data) |
| mobelrondellen | OK | OK | OK | mattias@mobelrondellen.se | Aktiv |
| phvast | OK | OK | OK | arnman@phvast.se | Aktiv |
| tobler | OK | — | OK | jakob@tobler.se | Aktiv |
| traficator | OK | — | OK | patrik.carlsson@traficator.se | Aktiv |
| smalandskontorsmobler | SAKNAS | OK | OK | mikael@smalandskontorsmobler.se | Delvis |
| wedosigns | SAKNAS | 403 | OK | mail@wedosigns.se | Delvis |
| ferox | SAKNAS | — | SAKNAS | Andreas.Sternberg@feroxkonsult.se | Ej aktiv |
| jelmtech | OK | 403 | OK (30 st) | camilla.lundstrom@jelmtech.se | Aktiv |
| nordicsnusonline | placeholder | — | OK (29 st) | — | Uppstart |

**SAKNAS** = WordPress app-password inte inlagt. Kunden är registrerad men automatisk optimering är avstängd.

### Aktivera en kund fullt ut
1. Kunden genererar Application Password i WP-admin → Viktor lägger in via Dashboard
2. GSC: lägg till service account som "Fullständig" → Viktor lägger in property-URL via Dashboard
3. ABC-nyckelord: mata in via Dashboard
4. Åtgärdsplan: generera via AI eller manuellt

---

## Smålands Kontorsmöbler (SMK)

**Sajt (ny)**: ny.smalandskontorsmobler.se (GeneratePress + WooCommerce)
**Domän (live)**: smalandskontorsmobler.se (Abicart — gammalt, ska fasas ut)
**Deal**: 6 mån × 7 000 kr/mån = 42 000 kr (WooCommerce-migrering)

**Nuläge:**
- 896 produkter importerade
- ~3 700 produkter saknar bilder (pågår)
- 46/47 kategoritexter klara
- 4 blogginlägg publicerade
- Pending: Rank Math PRO, schema-markup, Swedbank Pay (kunden fixar själv)

**Viktors uppgifter:**
- Håll koll på bildimporteringen — fråga Claude om status
- Rank Math PRO: aktivera licens när den kommer via mail till mikael@searchboost.se
- Schema-markup: Claude kör detta när Rank Math PRO är aktivt

---

## Kompetensutveckla

**DEV-sajt**: kompetensutveckla.hemsida.eu (bygg här FÖRST)
**Live-sajt**: kompetensutveckla.se (RÖR INTE — fullt av redirects)

**Nuläge:**
- Hosting: Hjältebyrån AB (Oderland), 18 GB disk (frigjort plats feb 13)
- Plan: Ersätt EduAdmin med WooCommerce + kurshanteringsplugins
- Trafik: ~300 besökare/mån, mål förstasidan inom 12 mån
- 142 trasiga URL:er identifierade — wildcard .htaccess-fix planerad

**Viktors uppgifter:**
- Bygg ny struktur på DEV-sajten (kompetensutveckla.hemsida.eu)
- Claude granskar mot SOPs innan något publiceras

---

## Möbelrondellen

**Sajt**: mobelrondellen.se
**OBS**: Sucuri WAF — curl ger HTTP 455 men sidan fungerar i browser. Normalt.

**Utfört:**
- Kontaktsidan: CF7-formulär städat
- Varumärken-sidan: shortcode-bugg fixad, HTML-grid med 18 varumärken
- Slider Revolution: verifierad OK
- Plugin-cleanup: 325 → 7 plugins

---

## Phvast

**Sajt**: phvast.se
**Status**: Aktiv, automation kör

---

## Il Monte

**Sajt**: ilmonte.se
**Status**: 🔴 RETENTION (30 dagar gratis 2026-04-08 → 2026-05-08)
**Kontakt**: Peter Vikström (sales@ilmonte.se)
**GSC**: SA verifierad som Fullständig 2026-04-09 (via Code Snippets + meta-tag)
**Keywords**: 30 st inlagda (9A + 14B + 7C)
**WP-creds**: OK (`Mikael Larsson` + app-password i SSM)

### 🚨 KRITISKT (upptäckt 2026-04-16 via full audit)
**Sajten är hackad.** ~4 118 casino/gambling-spam-URL:er serveras dynamiskt och ligger i sitemap:en (`post-sitemap2-22.xml`). Sidorna har fullt SEO-innehåll + `index,follow` men finns **INTE** i WP-databasen (wp-json returnerar 0). Det är alltså kod-injektion — plugin/theme/wp-config eller .htaccess fångar okända URL:er och genererar spam on-the-fly.

**Bevis:**
- `wp-json/wp/v2/posts?slug=casino-...` → tomt resultat
- `wp-json/wp/v2/posts` → säger 25 posts totalt
- Sitemap säger 4 150 posts → diskrepans = 4 125 fake

**Blockerar** all ytterligare SEO-effekt — Google ser ilmonte som en casino-spamsajt.

### Gjorda fixes 2026-04-16 (säkra metadata via Rank Math, ingen risk för e-handel)
- [x] **Audit-rapport**: `presentations/ilmonte-seo-audit-2026-04-16.md`
- [x] Title + meta fix: `/ilmofurniture/` (ID 15408), `/tillbehorsshop/` (ID 13814), `/pdf-information/` (ID 24), `/kopvillkor/` (ID 20)
- [x] Noindex + unik title: `/varukorg/` (ID 9), `/kassan/` (ID 10), `/mitt-konto/` (ID 11)
- [x] Startsida OG/Twitter: Fixade inkonsekvens — `og:title` var "AB ilmonte", är nu "Eventinredning & eventmöbler | Ilmonte" och matchar `<title>` + meta-desc

### BLOCKERAT (kräver dev/server-access — inte Claude-arbete)
- [ ] **Malware-cleanup** — inspektion av plugins, theme, wp-config, .htaccess, DB
- [ ] Byta ALLA credentials efter cleanup (inkl. app-password i SSM)
- [ ] Nginx: 410 Gone för /casino, /kasino, /bonus, /spin, /spelautomat, /poker, /bingo, /slot, /gratissnurr, /jackpot, /baccarat, /craps, /keno, /megaways
- [ ] GSC: URL Removal (prefix-matchning) för alla spam-URL:er
- [ ] Säkerhetsheaders: HSTS, X-Frame-Options, X-Content-Type-Options, CSP
- [ ] Ta bort duplicerad Organization-schema (finns både via Rank Math + manuell injektion med fel Facebook-URL)

### Action
**Beslut krävs av Mikael:** Ska Searchboost offerera malware-cleanup som separat uppdrag, eller rekommendera extern dev (Sucuri Remediation ~$200, Wordfence Response ~$490)? Retention-perioden går ut 2026-05-08 — utan cleanup kommer organisk trafik inte komma tillbaka.

---

## Tobler

**Sajt (live)**: tobler.se
**Staging**: tobler.searchboost.se (Flatsome + WooCommerce, bygge pågår)
**Status**: Aktiv, GSC ej kopplat ännu
**Avtal**: 18k-paket + 15k skuld = 33 000 kr fakturerat (deal klar 2026-04-16)

**Pågående bygge på staging:**
- Flatsome-tema + WooCommerce, 4-toppkategorier (Byggställningar, Fallskydd, Byggverktyg, Arbetskläder)
- Header: logga vänster, nav bottom-alignat, tax-toggle (Privat/Företag) i CSS grid OVANför varukorgen, KONTAKT-knapp, AI-FAB bottom-right
- Footer: Tobler-blå, 4 widgets som staplas <900px, kontaktpersoner med egna rader
- LocalBusiness JSON-LD + FAQPage-schema (FAQ-sida 1436)
- 19 blogginlägg med Rank Math meta + featured images (4 bilder uppladdade från extract)
- Custom CSS lagras i post 1994 (`theme_mods.custom_css_post_id`) + `html_scripts_header` för tillägg

**Pending (se `kund_tobler_tasks.md`):**
- Fortnox API-nyckel + produktbilder (Jakob)
- 3 FB-annonser (FB Manager under granskning)
- Migrera till tobler.se när staging är godkänd

---

## Traficator

**Sajt**: traficator.se
**Status**: Aktiv, GSC ej kopplat ännu

---

## We Do Signs

**Sajt**: wedosigns.se
**Saknas**: WP app-password + keywords
**Viktors uppgift**: Be kunden generera Application Password + mata in nyckelord

---

## Jelmtech Produktutveckling AB

**Sajt**: jelmtech.se
**Kund-ID**: jelmtech
**Avtal**: 8 000 kr/mån SEO Premium — AKTIV
**WP**: mikael_searchboost / SSM (OK)
**GSC**: 403 — SA borttagen, lägg till igen: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
**Keywords**: 30 st inlagda (10A + 10B + 10C)
**Åtgärdsplan**: 3 månader, 24 uppgifter
**Kontakt**: Camilla Lundström — camilla.lundstrom@jelmtech.se
**Trello**: Jelmtech — 3 mån SEO (8000 kr/mån) Premium ✅ kommenterat 2026-03-24
**Onboardad**: 2026-03-24

**Månad 1-prio:**
1. Rank Math SEO PRO installera
2. Language sv-SE
3. Meta descriptions 48 sidor
4. H1-taggar 19 sidor
5. URL-sanering /uncategorized/ → /blogg/
6. Schema markup

---

## Ferox Konsult

**Sajt**: feroxkonsult.se
**Saknas**: WP app-password + GSC + keywords
**Viktors uppgift**: Kontakta kunden — all onboarding saknas

---

## Nordic Snus Online (uppstart)

**Sajt**: nordicsnusonline.com
**Kund-ID**: nordicsnusonline-com
**Avtal**: 8 000 kr/mån SEO Premium (ej signerat)
**Pipeline-stage**: uppstart
**Nyckelvinkel**: Kan inte använda Google Ads/Meta → AI-sök är enda kanalen
**ABC-nyckelord**: 29 st inlagda (~37 000 sök/mån) — 9 A, 10 B, 10 C
**Åtgärdsplan**: 3 månader, 24 uppgifter inlagda i systemet
**SSM**: URL + company-name + gsc-property skapade (WP-creds = placeholder)
**Saknas**: WP app-password, GSC SA-access, kontraktssignering
**Onboardad**: 2026-03-24
**SEO-fixar 2026-04-21**: Rank Math är aktivt. Startsida (ID:61) fick SEO-titel + meta description + fokusord via Rank Math updateMeta REST API. Veriferat i HTML-källkod.
