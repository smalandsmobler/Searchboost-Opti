---
name: Ilmonte tasks
description: Aktiv task-checklista för Ilmonte (retention-läge + malware-incident)
type: project
---

# Ilmonte — Tasks

**Status**: 🔴 RETENTION + 🚨 MALWARE INCIDENT
**Retention**: 30 dagar gratis från 2026-04-08 till ~2026-05-08
**Kontakt**: Peter Vikström (sales@ilmonte.se)
**Site**: https://ilmonte.se
**WP-creds**: OK (Mikael Larsson-konto, app-password i SSM)

## 🚨 HÖGSTA PRIO — Malware-cleanup (BLOCKERAR ALLT ANNAT)

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
