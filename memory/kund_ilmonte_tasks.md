---
name: Ilmonte tasks
description: Aktiv task-checklista för Ilmonte (retention-läge + malware-incident)
type: project
---

# Ilmonte — Tasks

**Status**: 🟡 RETENTION — väntar på beslut 9 maj
**Retention**: 30 dagar gratis, slutar ~2026-05-09
**Kontakt**: Peter Vikström (sales@ilmonte.se)
**Site**: https://ilmonte.se (migrerad till Loopia — OK)
**WP-creds**: OK (Mikael Larsson-konto, app-password i SSM)

## Klart 2026-04-22 (nattjobb)
- [x] **Interlinking 43/43 artiklar** — "Relaterade artiklar"-block med 3 ämnesmatchade länkar (scen/matta/event/belysning/textil/möbler/konferens/ridå/akustik) + landningssidor /produkt-kategori/scenpodier/, /eventmobler/, /g-track/.
- [x] SEO-grund verifierad: Sitemap (773 URLer, 8 sub-sitemaps), Rank Math fungerar (1 JSON-LD + 6 OG + canonical + meta desc), robots.txt redan härdad 2026-04-18 av Searchboost.

## Fakturering

- **Faktura skickad 2026-04-19**: 5 000 kr — akutinsats hackattack (malware-rensning ×4, databasexponering, migration Loopia, forensisk rapport 11 sidor). Betalvillkor 11 dagar → förfall ~2026-04-30.
- **Beslutspunkt 9 maj**: Om Peter fortsätter → 2 fakturor samma dag (retention-period + ny månad SEO). Om han hoppar av → inga fler fakturor.

## Malware — LÖST 2026-04-19

Allt nedan är åtgärdat:
- ~4 118 casino/spam-URL:er rensade
- Databas exponerad på Beebyte — stängd
- Malware rensad 4 omgångar
- Sajten migrerad till Loopia
- 11-sidig forensisk rapport skriven och levererad

## 🚨 ~~HÖGSTA PRIO — Malware-cleanup~~ (LÖST)

**Upptäckt 2026-04-16 via full SEO-audit.**

~4 118 casino/gambling-spam-URL:er serveras från ilmonte.se, alla med HTTP 200, `index,follow` och ~2 500 ord SEO-optimerat innehåll. Sidorna finns **INTE** i WP-DB (`wp-json` returnerar 0) → kod-injektion i plugin/theme/.htaccess/wp-config.

### Bevis
- `wp-json/wp/v2/posts?slug=casino-med-omedelbar-...` → tomt `[]`
- `wp-json/wp/v2/posts` total = 25, sitemap total = 4 150 → diskrepans 4 125
- Sitemap post-sitemap2 till post-sitemap22 (22 st × ~200 URL) är nästan 100 % casino
- Varje URL serverar ilmontes riktiga footer/meny + spam-brödtext

### Vad behövs
- [ ] Backup: full filsystem + DB-dump till extern disk
- [ ] Skanning: Wordfence + Sucuri SiteCheck (kör BEGGE)
- [ ] Fil-inspektion: `mu-plugins/`, alla aktiva plugins, theme `functions.php`, `wp-config.php`, `.htaccess`, drop-ins
- [ ] Sök obfuskerad kod: `grep -rE "base64_decode|eval\(|gzinflate|str_rot13" wp-content/`
- [ ] DB: `SELECT option_name FROM wp_options WHERE option_value LIKE '%casino%' OR option_value LIKE '%base64%'`
- [ ] WP core checksum: `wp core verify-checksums`
- [ ] Plugin checksum: `wp plugin verify-checksums --all`
- [ ] Efter cleanup: `wp rewrite flush --hard` + Rank Math "Rebuild sitemap"
- [ ] Byt ALLA credentials (admin, DB, FTP, app-password, Rotate SSM `/seo-mcp/wordpress/ilmonte/app-password`)
- [ ] Installera Wordfence + 2FA
- [ ] Uppdatera WP core, alla plugins, theme
- [ ] Nginx: `return 410;` för alla spam-prefix
- [ ] GSC: URL Removal Tool för casino-prefix

### Beslutspunkt (Mikael)
1. Offerera cleanup själva som separat uppdrag (~5-10h arbete)?
2. Rekommendera extern: Sucuri Remediation $199.99, Wordfence Response $490
3. Kräver webhotell-access (FTP/SSH) eller extern dev som kan gå in i filsystemet

---

## Gjorda fixes 2026-04-16 (säkra metadata via Rank Math)

**Princip:** Ingenting som rör e-handelsflöde eller layout har rörts. Endast SEO-metadata.

- [x] **Full SEO-audit genomförd** — rapport: `presentations/ilmonte-seo-audit-2026-04-16.md`
- [x] **Titel + meta** på 4 pages (tidigare "- ilmonte.se"-suffix):
  - `/ilmofurniture/` (ID 15408): `"Ilmofurniture — möbler för event & offentlig miljö | Ilmonte"`
  - `/tillbehorsshop/` (ID 13814): `"Tillbehör till dansmattor, scenpodier & scentextil | Ilmonte"`
  - `/pdf-information/` (ID 24): `"Kataloger & produktblad — PDF-nedladdningar | Ilmonte"`
  - `/kopvillkor/` (ID 20): `"Köpevillkor — priser & leveransvillkor | Ilmonte"`
- [x] **Noindex, follow** + unika titlar på WooCommerce-hjälpsidor:
  - `/varukorg/` (ID 9)
  - `/kassan/` (ID 10) — OBS: visar varukorgens innehåll när cart = tom (WC-standard), men spelar ingen roll då den nu är noindex
  - `/mitt-konto/` (ID 11)
- [x] **Startsida OG/Twitter-tags** (ID 13581): Fixade inkonsekvens där `og:title` var "AB ilmonte" och `og:description` var gammal text. Nu matchar de `<title>` + meta-desc.

## Gjorda fixes 2026-04-16 (session 2 — full genomkörare)

- [x] **Rank Math metadata** satt på ALLA 25 bloggposter (title + meta desc + fokusord)
- [x] **H1 på Ilmoshop** (ID:14689) — H2 ersatt med H1 "Ilmoshop — eventmöbler och scenutrustning i webshopen"
- [x] **robots.txt** — ny sitemap-URL (/sitemap_index.xml) + Disallow: /wp-admin/, /wp-login.php, /?s=, /varukorg/, /kassan/, /mitt-konto/, /?add-to-cart=
- [x] **Interna länkblock** (Läs även) tillagda på 12 äldre artiklar (20551–20578) + 3 nya
- [x] **3 vecka 23-artiklar** publicerade:
  - ID:20623 /laktare-gradanger-event-guide/ — Läktare och gradänger för event
  - ID:20624 /horsalsstolar-teaterinredning-guide/ — Hörsalsstolar och teaterinredning
  - ID:20625 /ridaskenor-scenridaer-guide/ — Ridaskenor och scenridåer
- [x] **Mail till Peter** — Gmail-draft skapad (2026-04-16), vecka 16-uppdatering + malware-fråga
- [x] **Veckorapport-logg** — 7 entries loggade i BQ seo_optimization_log

## Bilder — 398/401 KLART 2026-04-21

**Slutresultat: 398 gröna, 3 orange kvar (kräver bilder från Henrik)**

### Uppdatering 2026-04-21 (morgon)
Henrik skickade två Google Drive-mappar:
- "Det sista 260421" — 8 projektfoton för 3 produkter
- "Hittade några fel, radera filen när du ändrat" — 19 rätta bilder för scenpodier/tillbehör

**Åtgärdat 2026-04-21:**
- [x] ID 15340 Stolsrenovering Hammarskjöldsalen — 4 bilder (Elmia) satta
- [x] ID 14889 Stolsrenovering Intiman — 2 bilder (Intimateatern Stockholm) satta
- [x] ID 14949 Stolsrenovering Kulturen i Vårgårda — 2 bilder satta
- [x] 17 scenpodier/tillbehörsprodukter fick rätta bilder:
  - Rapid scenpodium standard (2008), svart variant (2017)
  - Rapid trekantigt podium brun (1949)
  - Lastfördelare ändlock 40x40 (3682), 60x60 (3686)
  - Lastfördelare metall ställbar 40x40 (3684)
  - Lastfördelare till trappa (2671)
  - Teleskopbenset 40x40 25-36cm (2414), 40-60cm (2415), 60x60 (2420)
  - 4-bensklammer 40x40 (2109)
  - Vingskruv 40x40 (14520), 60x60 (14523)
  - Podieplatta svart standard (2629), brun utomhus (2631), generisk (2628)
- NOTE: 1607 "Rapid, ställbar Lastfördelare" — 2 bilder fick ingen produktmatchning. Fråga Henrik vilket produkt-ID.

**Fortfarande saknar bild (3 kvar):**
- ID 10694 — Athene (Pagunette, sannolikt utgången)
- ID 12474 — Dutch Houses 140cm (Pagunette)
- ID 15577 — Gradäng Butterfly Schillerska (projektfoto)

**Fortfarande fel platshållarbild (9 st — lägre prioritet):**
- COS.be ×5: 15898, 15343, 15874, 15868, 15599 (archive.org-logotyp)
- Krzesla ×4: 3152, 11436, 3348, 3186 (fel Gerriets-bild)

**Slutresultat efter 9 sweep-pass: 395 gröna, 6 orange kvar (TIDIGARE)**

### Svep 1 (Excel 1 — 401 produkter)
- **149 FIXADE automatiskt**: 146 Gerriets (Shopware API) + 3 AL-Color (zip från Henrik)
- **24 EJ HITTADE**: Gerriets-tillbehör som saknas i Shopware (Bottenrör, Spårmutter, Löpvagnar etc.)
- Resultatfil: `ilmonte-bilder-rapport-2026-04-20.xlsx`

### Svep 2 (Excel 2 — 201 vita produkter)
- **159 FIXADE automatiskt**: Gerriets (Shopware) + Kleu (kleu.de scraping) + Krzesla (krzesla.com.pl)
- **42 EJ HITTADE initialt**: Pagunette, Rosco, diverse tillbehör + projektstolar
- Resultatfil: `ilmonte-bilder-rapport-FINAL-2026-04-20.xlsx`

### Svep 3–9 (autonoma sweep-pass, 2026-04-20)
- **+87 FIXADE** via systematisk webskanning: Shopware API (Gerriets), Krzesla.com.pl, Pagunette-scraping, Daplast.com, fallback-bilder för scenequipment
- Scripts: `/tmp/sweep5.py` → `/tmp/sweep_final.py`
- **Slutläge: 395 gröna av 401**

### 6 kvar som KRÄVER MANUELL BILD FRÅN HENRIK/PETER

**Pagunette — ej i online-katalog (produkterna är sannolikt utgångna):**
- ID 10694 — Athene (SKU 102-7069)
- ID 12474 — Dutch Houses, bredd 140 cm (SKU 102-4783)

**Ilmonte-projektfoton — finns bara internt hos Ilmonte:**
- ID 15340 — Stolsrenovering Hammarskjöldsalen
- ID 14889 — Stolsrenovering Intiman
- ID 14949 — Stolsrenovering Kulturen i Vårgårda
- ID 15577 — Gradäng Butterfly Schillerska

### OBS — Platshållarbilder som bör bytas ut
Följande produkter har fått platshållarbilder som är fel men bättre än tomma. Henrik bör ersätta med rätt bilder:

**COS.be-produkter (5 st) — har fått archive.org-logotyp:**
- ID 15898 — Cosmo COS
- ID 15343 — Cosmos COS
- ID 15874 — Gaia COS
- ID 15868 — Orbital COS
- ID 15599 — Terra COS

**Krzesla-stolar (4 st) — har fått fel Gerriets-bild (kopplingsvinkel):**
- ID 3152 — Ilmo Olymp
- ID 11436 — Krakus
- ID 3348 — C42
- ID 3186 — VP91

- [x] Excel skickad till Henrik 2026-04-20 (draft r-5788715033544556141)
- [ ] Fortfarande kvar: 3 produkter saknar bild (se ovan). Fråga Henrik om Schillerska-foto + Pagunette-status.
- [ ] Fråga Henrik: vilken produkt tillhör de 2 "1607 Rapid, ställbar Lastfördelare"-bilderna?

## Upsell — nästa steg med Peter (PRIO)

**Strategi 2026-04-21**: Öka befintliga kunder istället för ny kundanskaffning.

- [ ] **FB Pixel** — installera Meta Pixel på ilmonte.se (liknande Tobler, via Code Snippets). Pitcha: remarketing mot besökare + Lookalike-målgrupper för eventbranschen.
- [ ] **LinkedIn** — organisk postning + eventuellt annonser. 2 000 kr/3 mån postning. Ilmontes målgrupp (eventbolag, kommuner, skolor) är på LinkedIn.
- [ ] **Webbutveckling** — ilmonte.se är WooCommerce men ser daterad ut. Paketera om sajten med nytt tema/Flatsome? Kan kombineras med WooCommerce-optimering. Pitcha 15–25k.
- [ ] **Google Ads** — ilmonte säljer eventmöbler/scenpodier. Sökord som "hyra scenpodium", "eventmöbler" har klickbar CPC. Pitcha som tillväxtpaket.
- [ ] **Mail till Peter** — efter 9 maj-beslutet, om han fortsätter: presentera upsell-paketet med ovan.

**Faktureringsstatus:**
- 5 000 kr skickad 2026-04-19 (malware-akutinsats), förfall ~2026-04-30
- 9 maj: om fortsätter → 2 fakturor (retention-period + ny månad)

---

## Kvar att göra (SPRINT 2 — efter malware-cleanup)

### On-page
- [ ] Startsida H1: "AB Ilmonte" → inkludera huvudsökord — kräver Mikaels OK
- [ ] Widget-rubriker "Logga in" / "information" / "Kontakt" → flytta ur heading-struktur
- [ ] Rank Math metadata på pages: 14689, 15504, 8, 26, 28 (Rank Math API 403 → manuell WP admin)

### Schema
- [ ] Ta bort duplicerad Organization/LocalBusiness-schema (fel Facebook-URL: facebook.com/ilmonte → facebook.com/ilmonteab)
- [ ] Bygg komplett LocalBusiness-schema via Rank Math > Local SEO: adress (Nattflyvägen 7, 313 50 Åled)
- [ ] Produktschema: fixa `name` + lägg till `brand`
- [ ] FAQ-schema på guide-sidor
- [ ] BreadcrumbList på alla sidor

### Säkerhetsheaders (nginx — kräver server-access)
- [ ] HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] Dölj `x-powered-by:` (PHP-version exponeras)

---

## Klart 2026-04-20 (vecka 26)
- [x] 3 artiklar publicerade vecka 26 (kat ID:1068):
  - ID:20694 /ljudsystem-event-guide/ (focus: ljudsystem event)
  - ID:20695 /eventbelysning-hyra-guide/ (focus: eventbelysning hyra)
  - ID:20696 /cocktailbord-hyra-event/ (focus: cocktailbord hyra event)

## Klart 2026-04-20 (vecka 25)
- [x] 3 artiklar publicerade vecka 25 (kat ID:1068):
  - ID:20691 /bakgrundsvagg-event/ (focus: bakgrundsvägg event)
  - ID:20692 /scendekoration/ (focus: scendekoration)
  - ID:20693 /scenljus-hyra/ (focus: scenljus hyra)

## Klart 2026-04-20 (vecka 24)
- [x] 3 artiklar publicerade vecka 24 (kat ID:1068):
  - ID:20686 /hyra-scenpodium/ (focus: hyra scenpodium)
  - ID:20687 /eventmobler-konferens/ (focus: eventmöbler konferens)
  - ID:20688 /talarpodium/ (focus: talarpodium)

## Tidigare klart

### 2026-04-13 (internlänkar — kannibalisering)
- [x] Internlänkar tillagda i 6 artiklar för dansmatta + scenpodier (ID:20577, 20570, 20551, 20580, 20582, 20584)

### 2026-04-13 (vecka 20)
- [x] 3 artiklar publicerade vecka 20 (kat ID:1068):
  - ID:20580 /scenbelysning-event-guide-2/ (focus: scenbelysning event)
  - ID:20582 /scen-foretagsevent-guide/ (focus: scen företagsevent)
  - ID:20584 /eventpodium-kopa-eller-hyra/ (focus: eventpodium köpa)

### 2026-04-12 (kväll)
- [x] 3 artiklar publicerade vecka 19 (kat ID:1068):
  - ID:20576 /scenpodier-skolor-guide/ (focus: scenpodier skolor)
  - ID:20577 /dansmatta-guide-2026/ (focus: dansmatta)
  - ID:20578 /modular-scen-guide/ (focus: modulär scen)

### 2026-04-10
- [x] 2026-04-10: 3 artiklar publicerade (vecka 17, batch 2):
  - ID:20570 /dansmatta-for-event-guide/
  - ID:20571 /uthyrning-eventmobler-guide/
  - ID:20572 /scentextil-bakgrundsdukar-guide/

### 2026-04-08 → 2026-04-09
- [x] 2026-04-08: Retention-mail skickat till Peter
- [x] 2026-04-09: Förtydligande-mail skickat (GSC via SA istället för DNS)
- [x] 2026-04-09: GSC-property verifierad autonomt via Code Snippets + meta-tag
- [x] 2026-04-09: SA `seo-mcp-bigquery@...` tillagd som Fullständig i GSC
- [x] 2026-04-09: SSM `/seo-mcp/integrations/ilmonte/gsc-property` satt
- [x] 2026-04-09: 4 retention-artiklar skrivna
- [x] 2026-04-09: Artiklarna publicerade som drafts i WP

## Pausad
(inget — allt annat arbete blockerat av malware-situationen)

## Referenser
- Audit-rapport: `presentations/ilmonte-seo-audit-2026-04-16.md`
- Retention-plan: `ilmonte_retention.md`
- Kund-info: `KUNDER.md` (Il Monte-sektionen)
- Artikelfiler: `content-pages/ilmonte/artikel-retention-*.md`
- Förtydligande-mail: `content-pages/mail-ilmonte-peter-fortydligande.md`
- Senaste mail (audit-uppföljning): `content-pages/mail-ilmonte-peter-audit-2026-04-16.md`
