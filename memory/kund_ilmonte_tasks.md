---
name: Ilmonte tasks
description: Aktiv task-checklista för Ilmonte (retention-läge, live på Loopia)
type: project
---

# Ilmonte — Tasks

**Status**: 🟢 LIVE PÅ LOOPIA (DNS-cutover 2026-04-17 ~15:00) + 🔒 BEEBYTE SANERAD + 📨 FORENSISK RAPPORT SKICKAD TILL PETER 2026-04-18
**Retention**: 30 dagar gratis från 2026-04-08 till ~2026-05-08 (fakturerbar extra-insats för malware-räddning separat)
**Kontakt**: Peter Vikström (peter.vikstrom@ilmonte.se)
**Site**: https://ilmonte.se (nginx + PHP 8.2.30 på Loopia)
**WP-creds**: OK — nytt app-password efter migration i `wp_credentials.md` (Mikael Larsson: `jxgg jdbj IE3m 4ESB OSxt GOsp`)

## 🟢 KLART 2026-04-25 (vecka 25 — artiklar + schema + CSS + köpknappar)
- [x] 3 artiklar publicerade (A-tier keywords):
  - ID:21355 /scenproduktion-guide-scen-textil-utrustning/ (focus: scenproduktion)
  - ID:21356 /kopa-scen-guide-pris-matt-modulart-system/ (focus: köpa scen)
  - ID:21357 /scenpodium-guide-hojd-storlek-ratt-val/ (focus: scenpodium)
- [x] Rank Math meta (title, description, focus keyword) satt via ONE-SHOT snippet 55
- [x] Internlänkar: alla 4 föräldralösa artiklar (20685, 20684, 20675, 20673) har nu inkommande länkar från 20703 + 21355 + 21357
- [x] Schema: BlogPosting (Rank Math auto) + BreadcrumbList (snippet 35) verifierat på nya artiklar
- [x] Guld/bronsskugga på bruna header-bars (snippet #54 head-content)
- [x] Kommentarer globalt avstängda (4 WP-options uppdaterade)
- [x] Alla bilder på startsidan alt-text fixade (39 bilder, sida ID:13581)
- [x] Köpknappar ("Lägg i varukorgen"/"Välj varianter") i produktkort — snippet #57 (front-end, active, brun bakgrund #5c3629, 175px min-height box-text)
- [x] Trasiga artikellänkar fixade: /textil-3/ → /flamskyddade-textilier/, /ridaaskenor/ → /skenor-2/, /dansmattor/ → /mattor-for-dans-och-event-2/ (artiklarna 21355 + 21356)
- [x] Mail skickat till peter.vikstrom@ilmonte.se + dajana.tolic@ilmonte.se (vecka 25 månadsrapport)

## 🟢 KLART 2026-04-20 (vecka 24)
- [x] 3 artiklar publicerade vecka 24 (kat ID:1068):
  - ID:20702 /eventmobler-hyra-komplett-guide-for-ditt-event/ (focus: eventmöbler hyra)
  - ID:20703 /scenutrustning-for-event-din-guide-till-ratt-val/ (focus: scenutrustning)
  - ID:20704 /konferensmobler-som-hojer-moteskvaliteten/ (focus: konferensmöbler)

## Nästa steg
- [ ] Interna länkar mellan produktkategorisidor (saknas nästan helt)
- [ ] Skicka mail till henrik.gustafsson@ilmonte.se om 401 saknade bilder (utkast: `content-pages/mail-henrik-ilmonte-saknade-bilder-2026-04-20.md`, bilaga: `~/Downloads/ilmonte-saknade-bilder-2026-04-20.xlsx`)

## 🟢 KLART 2026-04-21 (bulk meta + schema)
- [x] **730/730 produkter** — meta descriptions uppdaterade via Rank Math API (0 fel)
- [x] **100/100 produktkategorier** — meta descriptions uppdaterade via Rank Math API (0 fel)
- [x] **Startsidan schema Article → WebPage** — Code Snippet #33 (active, front-end)

## 🟢 KLART 2026-04-20 (SEO-audit)
- [x] Teknisk SEO-audit genomförd (agent afe4cb30): GA4 OK, GTM OK, sitemap OK, canonical OK, HTTPS OK
- [x] Kritiska fynd: 730/730 produkter utan meta desc, 50/50 kategorier utan meta, Article schema på startsida (borde vara WebPage)
- [x] Positivt: Svarstid 0.70s (excellent), Rank Math PRO aktivt, robots.txt OK

## 🟢 KLART 2026-04-17 — LOOPIA-MIGRATION LIVE
- [x] DB importerad till Loopia (`ilmonte_se`) från `ilmonte-loopia-final-2026-04-17.sql.gz`
- [x] wp-content uppladdat via FTP (`ilmonte-wpcontent-2026-04-17.tar.gz`, 1.1 GB)
- [x] wp-config.php konfigurerad (DB_USER=SBadmin)
- [x] DNS-cutover ~15:00 — A-post från Beebyte-IP till Loopia-IP
- [x] Let's Encrypt SSL-cert installerat på Loopia — verifierat live 2026-04-18 (issuer R12, giltigt till 21 juni 2026, auto-renew av Loopia)
- [x] Sajten verifierad live 2026-04-18: 200 OK, `/wp-admin/` 302, site-name "Ilmonte"
- [x] Nytt WP app-password genererat (Mikael Larsson-konto)

## ✅ KLART 2026-04-17 — FULLSTÄNDIG BEEBYTE-SANERING

### Kritiska fynd åtgärdade:
- [x] **MySQL TRIGGER-backdoor** `after_insert_comment` raderad från live DB + exkluderad ur dump
- [x] **Admin-konto** `notesprofile` (skapades av backdoor-triggern) — EJ i DB (aldrig trigg:ats av oss)
- [x] **Matti-konto** (matti@asosweden.se) — raderat som WP-admin
- [x] **Alla URL:er fixade**: 4 186 + 1 731 gamla preview-URL:er (`preview.beeweb.se`) ersatta med `https://ilmonte.se/wp-content/`
- [x] **Admin-email** ändrat → `peter.vikstrom@ilmonte.se`
- [x] **Site-titel** → "Ilmonte"
- [x] **Ny order-notiser** → `matti@asosweden.se` borttagen, nu bara `order@ilmonte.se`
- [x] **PayPal gateway** email → `sales@ilmonte.se`
- [x] **WooCommerce.com** konto (kopplat till `matti@asosweden.se`) — frånkopplat
- [x] **CookieYes** konto (kopplat till `matti@asosweden.se`) — frånkopplat
- [x] **WooCommerce-inställningar**: kundregistrering, auto-login, SEK 0 decimaler, popularitetssortering
- [x] **WP Mail SMTP** from_name → "Ilmonte"
- [x] **FORCE_SSL_ADMIN** tillagd i wp-config.php
- [x] **Wordfence** alerts → Mikael + Peter, extra alerts påslagna
- [x] **WP core integrity** verifierat ✅
- [x] **Uploads** — ingen PHP-malware hittad ✅
- [x] Beebyte Mastodont Media/Thomas/Henrik-access — borttagen (bekräftat av Mikael)

### Ny ren dump skapad:
- **Fil**: `~/Downloads/ilmonte-loopia-final-2026-04-17.sql.gz` (4.0 MB)
- Innehåller alla säkerhetsfixar ovan
- Inga DROP TABLE, inga TRIGGERs, inga wp_wf*-tabeller
- siteurl/home = `https://ilmonte.se`

---

## Nästa steg (post-migration follow-up)

### 🔴 Akut (Peter väntar på svar — mail 2026-04-18 11:54)
- [x] **GSC-behörighet**: Dajana Tolic (`dajana.tolic@ilmonte.se`) borttagen från GSC 2026-04-18 av Mikael (hon får inga fler alerts)
- [x] **🚨 GSC oanvända äganderättstoken** — 2 token upptäckta + borttagna 2026-04-18: `googlefb2c296079799530.html` (matti@asosweden.se, Beebyte-ASOS-access) + `google910f0e14e0fbaffc.html` (**egaqufih63@gmail.com** — HACKAREN från 2026-03-31-intrånget). Filerna redan 404 på servern (raderade med Loopia-migration). Token nu också borttagna ur GSC av Mikael.
- [x] **Merchant Listings schema** FIXAT 2026-04-18: Code Snippet ID 21 "Ilmonte — Product schema: brand (Merchant Listings fix v2)" aktiverad. Använder `rank_math/json_ld`-filter för att lägga `brand: Ilmonte` på ProductGroup + alla varianter. Verifierat live på /produkt/corfu-bomullsmatta-bredd-300-cm/. Google re-crawlar inom 1-2 veckor.
- [x] **Full notis-sanering** KLAR 2026-04-18 via ONE-SHOT snippet ID 22: admin_email → mikael.searchboost@gmail.com, Wordfence alertEmails → searchboost (skräp-alerts login/lockout/pwd avstängda), Rank Math weekly email → off, WP Mail SMTP alert → searchboost. WC order-mail orört (order@ilmonte.se behövs av kund).
- [x] **Svara Peter** — MAIL + FORENSISK RAPPORT (PDF 11 sidor) SKICKADE 2026-04-18. Leveransmapp: `leveranser/ilmonte/` (md + pdf + mail).
- [x] llms.txt: döda länkar borttagna + 30 live länkar, alla 200 OK (2026-04-18)
- [x] **Optimerad robots.txt** live 2026-04-18: 2166 bytes (från 450), 22 user-agents, 42 Disallow, 13 Allow. Skrevs direkt till `/var/www/vhosts/ilmonte.se/httpdocs/robots.txt` via temp write-endpoint. Täcker: WC-parametrar (duplicate content), WP-security, Ahrefs/Semrush blockade (Perispa-verktyg ersätter), AI-bots explicit Allow för GEO-SEO, Baidu/Yandex/CCBot/Bytespider blockerade.
- [x] Product schema brand-fix: Snippet ID 21 aktiverad (2026-04-18)
- [x] **Forensisk rapport till Peter** — polisrapport-stil: `presentations/ilmonte-forensisk-rapport-peter-2026-04-18.md`. Diarienr SBS-2026-04-18-ILM-001. Täcker okero.asosweden.se-städningen, VD-städningsuppdragets kontext, bildfrågan (401 obilderade produkter verifierat aldrig haft bilder via Beebyte-backupper), placeholder-åtgärd, Google-reindexbegäran, alla SEO-åtgärder.
- [x] **Mail-utkast till Peter** — `content-pages/mail-ilmonte-peter-2026-04-18.md` — team-approach narrativ ("som du bad om städa", Peter som ny VD, Mikael + Peter = team).
- [x] **Startsida title + meta** fixat via Rank Math: "Eventinredning & eventmöbler för företag | Ilmonte" + "Ilmonte är Sveriges ledande leverantör..." (svenska tecken, Ilmonte ett ord).
- [x] **Duplicerad Organization-schema** borttagen: Snippet ID 13 avaktiverad 2026-04-18. Startsidan har nu 1 Organization (Rank Math) istället för 2.
- [x] **/butik/ H1** fixat: Snippet ID 29 — `woocommerce_before_shop_loop`-hook renderar "Alla produkter — event, scen och teater".
- [x] **H1-fix på 5 toppsidor + /kontakt/**: Content-patchar via REST + asosweden-länken rensad från startsidan. 19x "AB ilmonte" → "Ilmonte".
- [x] **401 obildade produkter** fick `_thumbnail_id = 20642` (WC placeholder). Schema nu komplett med Product + brand + image.
- [x] **Notis-sanering** KLAR 2026-04-18 via ONE-SHOT snippet ID 22.

## Klart 2026-04-18 (vecka 23)
- [x] 3 artiklar publicerade vecka 23 (kat ID:1068):
  - ID:20683 /eventbelysning-mass-scen-foretag-guide/ (focus: eventbelysning)
  - ID:20684 /akustikabsorbenter-event-konferens-guide/ (focus: akustikabsorbenter event)
  - ID:20685 /projektionsdukar-backdrops-event-guide/ (focus: projektionsdukar event)

### SEO-audit + atgardsplan (2026-04-18)
- [x] Keywords kontrollerade: 11 st (4A, 4B, 3C) — scenproduktion, eventmobler hyra, scenpodium, kopa scen, etc. Tillrackligt.
- [x] Gammal atgardsplan (2026-04-15) hade 14/15 tasks i error-status (h2_optimization). Ersatt.
- [x] Ny 3-manaders atgardsplan skapad (16 tasks): teknisk sanering, H1-fixar, schema, artiklar, internlankar, metadata, re-audit + rapport.

### Post-migration (ej brådskande)
- [x] Lösenordsreset Diana + Sales_ilmonte i WP-admin (klart 2026-04-17)
- [x] ~~Wordfence 2FA — aktivera för Diana, Peter, Mikael Larsson~~ **⛔ FÅR ALDRIG AKTIVERAS** — blockerar app-password-auth. Vi var utelåsta en månad på grund av detta tidigare, förlorade nästan kunden. Se regel i `feedback_wordfence_2fa.md`.
- [x] ~~Ring Beebyte support (031-381 00 50) → ta bort Plesk-user bb-q3p9 (Henrik)~~ **Löst 2026-04-17**: Mikael ringde. Beebyte-support oresponsive på dataintrånget, kunde inte hitta bb-q3p9 i deras system (troligen redan raderad av oss). Beebyte brydde sig inte om incidenten. Ärendet stängt utan ytterligare åtgärd — sajten är ändå bortmigrerad från Beebyte.
- [x] GSC Sitemaps → lägg till `https://ilmonte.se/sitemap_index.xml` (klart 2026-04-18 av Mikael)
- [ ] Malware-cleanup verifiering: bekräfta att WPCode Lite raderat + option `1a988d81b890872713c0b28c11c60176` + transient `_transient_update_plugins_1618_...` är borta
- [ ] Diag-snippet ID 17 "SBS Malware Diag (tmp)" — radera när cleanup är verifierad
- [ ] Mail till Peter: rapport om migration + cleanup genomförd
- [ ] Följ upp om Peter läst förtydligande-mailet (skickat 2026-04-09)
- [ ] Månadsrapport till Peter måndag 2026-05-05 (före/efter GSC-data)
- [ ] Vecka 22-artiklar (nästa batch planerad) — ej påbörjad

---

## 🔒 MALWARE-CLEANUP — KLAR 2026-04-17 (iterativ DB-sanering)

**Upptäckt 2026-04-16. Källa lokaliserad 2026-04-17. DB-sanering körd i omgångar samma dygn.**

**Faktisk skala**: ~20 000 bakdörrar/spam-entries hittade och raderade (mycket större än första uppskattning på 4 118 casino-URL:er). Sanering körd i flera iterationer mot DB-dumpen innan final import till Loopia.

**Verifierat post-migration 2026-04-18**: `/casino/` → 404, sitemap ren (Rank Math standard), inga spam-URL:er indexerade.

### Dump-versioner (iterativ cleanup — i Downloads)
1. `ilmonte-clean-2026-04-17.sql.gz` (7.5 MB) — första cleanup
2. `ilmonte-import-loopia.sql.gz` (7.5 MB)
3. `ilmonte-notrigger-2026-04-17.sql.gz` (7.25 MB) — triggers borttagna
4. `ilmonte-nodrop-2026-04-17.sql.gz` (7.25 MB) — DROP-statements borttagna
5. `ilmonte-final-2026-04-17.sql.gz` (7.25 MB)
6. `ilmonte-full-postfixes-2026-04-17.sql.gz` (7.35 MB)
7. `ilmonte-loopia-final-2026-04-17.sql.gz` (4.0 MB) — **FINAL, använd för import**
8. `ilmonte-loopia-v2-2026-04-17.sql.gz` (4.17 MB) — efterjustering

**Forensisk evidens**: `forensics/ilmonte-2026-04-17/attack-day-2026-03-31.log` (13 MB)

---

## 🚨 URSPRUNGLIG MALWARE-INCIDENT (HISTORIK)

**Upptäckt 2026-04-16. Källa lokaliserad 2026-04-17.**

~4 118 casino/gambling-spam-URL:er serveras från ilmonte.se. Malwaren sitter **i databasen** (option med MD5-hashnamn), inte i filsystemet. Körs sannolikt via WPCode Lite-plugin.

### 🔒 Bevis-dokument (2026-04-17)
- **Forensisk rapport (POST-SSH, full)**: `presentations/ilmonte-forensisk-rapport-2026-04-17.md` — KÄLLA HITTAD: bulk-insert 4 339 posts av user ID 1618 (raderad efter attack)
- **Ursprunglig bevisrapport (pre-SSH)**: `presentations/ilmonte-malware-bevis-2026-04-17.md`
- **Mail-utkast till Peter**: `content-pages/mail-ilmonte-peter-audit-2026-04-17.md` (ska uppdateras med ny info från forensiska rapporten)

### 🚨 Kritiska fynd från forensisk scan (2026-04-17)
- **Attack-tidpunkt**: 2026-03-31 19:08:38 (bulk-insert via SQL, alla 4 339 posts identisk timestamp)
- **Malware-user**: ID 1618 (raderad från wp_users men `post_author=1618` finns kvar som bevis)
- **Skala**: 4 339 publicerade posts + 4 339 meta-rader + 3 options
- **Real posts**: 724 legit + 4 339 spam = 86% av DB är spam
- **Varför REST API missade dem**: 0 term_relationships (okategoriserade), så /wp/v2/posts skipar dem
- **Inga filer infekterade** — all malware är DB-baserad
- **SSH-access**: bb-xjr6@shwl-0123.s.beebyte.se via `~/.ssh/ilmonte_beebyte` (ed25519)
- **DB-creds**: db-w5r8 / dbu-w5r8 / byO1cVzDQTuZ (sparade lokalt, inte SSM än)

### Bevis-sammanfattning
- Option `1a988d81b890872713c0b28c11c60176` (MD5-namn) innehåller serialiserad config:
  - Key `1618`, `type=CASINO`, `language=SE`, `100DifferentTextBlocks`
  - Sitemap-pattern `sitemap1618\.xml$` → `index.php?feed=xmlsitemap1618`
  - JS-payload (dubbel-obfuskerad): raderar `<body>`, laddar `//gamblersrules.com/csnse.js`, trackar via `//counter.yadro.ru`
- `.htaccess`, `wp-config.php`, mu-plugins, drop-ins **rena**
- WPCode Lite senast modifierad 2026-04-11 (matchar tidslinje) → primär misstanke
- `_transient_update_plugins_1618_a699388635fd7db352ff7dd1eb6dad9f` (cache för malware-"plugin" ID 1618)

### 🆕 2026-04-18: GSC-äganderätt hackad
- **Hackaren hade Google Search Console-ägarskap** via HTML-fil-verifiering
  - Token 1: `googlefb2c296079799530.html` — matti@asosweden.se (Beebyte/ASOS Sweden-access)
  - Token 2: `google910f0e14e0fbaffc.html` — **egaqufih63@gmail.com** (slumpmässigt Gmail-alias = hackarens signatur)
- Innebörd: hackaren kunde skicka sitemaps, URL removals, se all GSC-data, få alerts om indexeringsstatus på sina egna casino-URL:er
- Filerna själva raderades med Loopia-migrationen (404 på servern 2026-04-18)
- Token kvar i Googles "Oanvända äganderättstoken" — ska rensas bort i GSC
- **KOLL FÖR ANDRA KUNDER**: Sök efter liknande `googleXXXXX.html`-filer + oanvända token på alla kunder vi migrerar in

### Diag-snippet lämnad på sajten
- Snippet ID 17 "SBS Malware Diag (tmp)" — avaktiverad men kvar. Aktivera vid cleanup för att köra endpoints:
  - `GET /wp-json/sbs-diag/v1/scan?what=[muplugins|dropins|htaccess|obfus|sitemap|options|wpconfig]`
  - `GET /wp-json/sbs-diag/v1/opt?name=X`
  - `GET /wp-json/sbs-diag/v1/plugins-all`
  - `GET /wp-json/sbs-diag/v1/sitemap-source`

### Cleanup-plan (när Peter godkänt)
1. Backup filsystem + DB (extern disk)
2. Inaktivera + radera WPCode Lite (insert-headers-and-footers)
3. Radera option `1a988d81b890872713c0b28c11c60176`
4. Radera transient `_transient_update_plugins_1618_...`
5. `wp rewrite flush --hard` + Rank Math "Rebuild sitemap"
6. Byt ALLA admin-lösenord + app-passwords (Rotate SSM `/seo-mcp/wordpress/ilmonte/app-password`)
7. Aktivera Wordfence (installerat men inaktivt)
8. `wp core verify-checksums` + `wp plugin verify-checksums --all`
9. GSC URL Removal Tool för casino-prefix
10. Nginx `return 410;` för alla spam-prefix
11. Radera diag-snippet (ID 17)

### Beslutspunkt (Mikael → Peter)
- Spår A: Vi gör cleanup själva (5 500 kr, 3-5 h, kräver FTP/SSH) — **DETTA ÄR VALT**
- Spår B: Sucuri/Wordfence (2 500-5 000 kr)
- Spår C: Ilmontes egna utvecklare

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

## Kvar att göra (SPRINT 2 — efter malware-cleanup)

### On-page
- [ ] Ilmoshop (ID 14689): Lägg till H1 (saknas helt idag)
- [ ] Produktkategori-sidor: Lägg till H1 (idag visas bara H2) — systematisk genomgång
- [ ] Startsida H1: "AB Ilmonte" → inkludera huvudsökord — OBS kräver content-edit
- [ ] Widget-rubriker "Logga in" / "information" / "Kontakt" ligger som H2/H3 → flytta ur heading-struktur

### Schema (delvis klart 2026-04-18)
- [x] LocalBusiness-schema på startsidan via Rank Math API (ID:13581)
- [x] Article-schema på alla 25 bloggartiklar via Rank Math API
- [x] OfferCatalog-schema på butikssidan (ID:14689)
- [ ] Ta bort duplicerad manuell Organization-schema (Code Snippets — har fel FB-URL)
- [ ] Produktschema: fixa `name` + lägg till `brand`
- [ ] Service-schema för 4 huvudtjänster
- [ ] BreadcrumbList på alla sidor

### Robots.txt
- [ ] Disallow: `/wp-admin/`, `/wp-login.php`, `/?s=`, `/varukorg/`, `/kassan/`, `/mitt-konto/`
- [ ] Byt sitemap-URL till `/sitemap_index.xml`

### Internlänkar (delvis klart 2026-04-18)
- [x] Internlänkar tillagda på alla 25 artiklar + 5 sidor via Perispa (30 totalt)
- [x] 3 nya artiklar (2026-04-18) internlänkade vid publicering:
  - ID:20673 https://ilmonte.se/eventinredning-foretagsgala-guide/
  - ID:20674 https://ilmonte.se/konferensinredning-checklista-mobler/
  - ID:20675 https://ilmonte.se/scenpodier-kyrkor-kulturhus-guide/
- [ ] Internlänka kategori-sidor till relevanta guide-artiklar

### Säkerhetsheaders (nginx — kräver server-access)
- [ ] HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] Dölj `x-powered-by:` (PHP-version exponeras)

---

## Klart 2026-04-18 (Total SEO-audit + fix via Perispa)
- [x] **SEO-metadata** på 32/32 sidor och inlägg — titel, description, fokus-sökord via Rank Math API
- [x] **Schema markup**: LocalBusiness (startsida), OfferCatalog (butik), Article (25 artiklar)
- [x] **Internlänkar** på alla artiklar + 5 sidor — relaterade länkar-sektion
- [x] **Plugin-cleanup**: Yoast (inaktivt) borttaget, Login Lockdown borttaget, Empty Cart borttaget, CookieYes aktiverat (GDPR)
- [x] **3 nya artiklar publicerade**:
  - ID:20673 https://ilmonte.se/eventinredning-foretagsgala-guide/ (fokus: eventinredning företagsgala)
  - ID:20674 https://ilmonte.se/konferensinredning-checklista-mobler/ (fokus: konferensinredning checklista)
  - ID:20675 https://ilmonte.se/scenpodier-kyrkor-kulturhus-guide/ (fokus: scenpodier kyrkor kulturhus)

## Klart 2026-04-16 (6 artiklar — tidigare odokumenterade)
- [x] ID:20607 /hyra-konferensbord-guide/ — Hyra konferensbord — guide till val, storlek och leverans
- [x] ID:20608 /eventmoblering-kontor-foretag/ — Eventmöblering för kontor och företag
- [x] ID:20609 /konferensstolar-guide/ — Konferensstolar — vad skiljer bra från dålig
- [x] ID:20623 /laktare-gradanger-event-guide/ — Läktare och gradänger för event (publicerat via `publish-vecka23-artiklar.py`)
- [x] ID:20624 /horsalsstolar-teaterinredning-guide/ — Hörsalsstolar och teaterinredning (vecka23-scriptet)
- [x] ID:20625 /ridaskenor-scenridaer-guide/ — Ridaskenor och scenridåer (vecka23-scriptet)

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
