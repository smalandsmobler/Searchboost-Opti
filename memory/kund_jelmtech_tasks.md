---
name: Jelmtech tasks
description: Aktiv task-checklista för Jelmtech
type: project
---

# Jelmtech — Tasks

**Status**: Aktiv (3 mån × 8000 kr)
**Kontakt**: Camilla Lundström (camilla.lundstrom@jelmtech.se)
**Site**: https://jelmtech.se (WordPress + Divi + Rank Math + Code Snippets)
**Bransch**: B2B produktutveckling — plastkonstruktion, industridesign, prototyper

## Nästa steg
- [x] Interna länkar mellan tjänstesidorna — 5 sidor uppdaterade 2026-04-20 med "Relaterade tjänster"-block (simulering↔produktoptimering↔verktygsberedning↔uppmätning↔montage)
- [x] Sitemap fixad 2026-04-20 — se nedan
- [x] Startsidans SEO-meta uppdaterad 2026-04-21 (titel + description + fokusord)
- [x] Google Analyticator (döt plugin v6.5.4) deaktiverat 2026-04-21
- [x] Ny batch artiklar vecka 24 — publicerade 2026-04-21
- [ ] Utred varför Rank Math inte emittar head — setup wizard kanske oavslutad. SEO-head-emitter (snippet #25) täcker nu allt tills RM fixas.

## Klart 2026-04-22 (nattjobb) — stor SEO-fix
- [x] **Kritisk upptäckt**: Rank Math emittade 0 JSON-LD blocks, ofullständiga OG (bara 1 tag), ingen canonical, ingen twitter:card. Meta description emitterades dock (av Divi eller snippet). 
- [x] **SBS SEO head emitter** (snippet #25) — full head-output: OG (7 tags), Twitter cards (4 tags), canonical, JSON-LD (4 blocks: Organization + WebSite + Article/WebPage + BreadcrumbList).
- [x] **Sitemap-fix**: /sitemap.xml **301 → /wp-sitemap.xml (som 404:ar!)** — troliga orsaken Mikael sett i GSC. Ny snippet #26 ändrar redirect till /sitemap_index.xml. **/sitemap.xml** nu 301 → /sitemap_index.xml (200 OK).
- [x] **robots.txt omskriven** via snippet #27 + `sbs/v1/write-robots`-endpoint. Nu innehåller: Disallow wp-admin/wp-includes/wp-login.php/?s=/search/feed/xmlrpc.php, Allow admin-ajax.php, Googlebot-Image allow uploads, sitemap_index.xml.
- [x] **Interlinking 64/64 artiklar** — "Relaterade artiklar"-block med 3 ämnes-matchade länkar + landningssidor (/plastkonstruktion/, /industridesign/, /prototyptillverkning/). Ämnesmatchning: plast/prototyp/formsprut/design/material/mekanisk/kvalitet/hållbar/overmould/cert.
- [x] **llms.txt expanderad** (ca 700 → 3 162 bytes, snippet #7) — produktutveckling-tjänster, 15 top artiklar, kontaktinfo (Ängelholm/Valhall Park).
- [x] **Sanity-check**: Startsida + /kontakt/, /nyheter/, /hallbar-produktutveckling/, /jobba-hos-oss/, artikel — alla 200 OK, 0 fatal, 4 JSON-LD blocks. Artikel visar Relaterade artiklar.
- Anm: `/om-oss/` saknas på JT (använd `/tjanster/` + `/kontakt/` istället). `/produktutveckling/` är blog-kategori utan H1 — behöver Rank Math category-intro text.



## Klart 2026-04-20 (sitemap-fix)
- [x] **sitemap_index.xml** fungerar nu — HTTP 200, korrekt XML
  - Root cause: Rank Math's sitemap-modul initierades aldrig (hooks saknades i template_redirect)
  - Fix: Code Snippet #23 (persistent) — custom sitemap-generator via `template_redirect` pri 0
  - Fix: WP core sitemaps avaktiverade via `wp_sitemaps_enabled` → `false`
  - **post-sitemap.xml**: 57 URLs (alla publicerade inlägg)
  - **page-sitemap.xml**: 17 URLs (alla publicerade sidor)
- [x] **robots.txt** uppdaterad: `Sitemap: https://jelmtech.se/sitemap_index.xml`
- Aktiva snippets som hanterar sitemap: #14 (robots_txt filter), #17 (fysisk robots.txt), #23 (sitemap generator)

## Klart 2026-04-21 (vecka 24)
- [x] 3 artiklar publicerade vecka 24 (kat ID:48 Produktutveckling):
  - ID:7739 /produktutveckling/glasfiberarmerad-plast-guide-2/ (focus: glasfiberarmerad plast)
  - ID:7741 /produktutveckling/kostnad-formsprutningsverktyg/ (focus: kostnad formsprutningsverktyg)
  - ID:7742 /produktutveckling/bioplast-produktutveckling-guide/ (focus: bioplast produktutveckling)
- [x] Rank Math metadata satt på samtliga (SEO-titel, description, fokusord)

## Klart 2026-04-20 (vecka 23)
- [x] 3 artiklar publicerade vecka 23 (kat ID:48 Produktutveckling):
  - ID:7730 /produktutveckling/polyamid-formsprutning-guide/ (focus: polyamid formsprutning)
  - ID:7731 /produktutveckling/insert-moulding-guide/ (focus: insert moulding plast)
  - ID:7732 /produktutveckling/konstruktionsplast-egenskaper-guide/ (focus: konstruktionsplast egenskaper)
- [x] Rank Math metadata verifierad korrekt (Code Snippet ID:18 fungerande)

## Klart 2026-04-20 (vecka 22)
- [x] 3 artiklar publicerade vecka 22 (kat ID:48 Produktutveckling):
  - ID:7719 /produktutveckling/2k-formsprutning-guide/ (focus: 2K formsprutning)
  - ID:7725 /produktutveckling/ytbehandling-plast/ (focus: ytbehandling plast)
  - ID:7726 /produktutveckling/teknisk-dokumentation-produktutveckling/ (focus: teknisk dokumentation produktutveckling)
- [x] Rank Math metadata satt på ovanstående (fokusord, SEO-titel, metabeskrivning)

## Klart 2026-04-15 (vecka 21)
- [x] Meta descriptions + focus keywords satta på 5 tjänstesidor via REST API:
  - 3893 simulering-analys (157 tecken | kw: simulering plastkonstruktion)
  - 3901 uppmatning-verifiering (155 tecken | kw: uppmätning verifiering plastdetaljer)
  - 3915 montage-beskrivningar (159 tecken | kw: montageanvisningar plastkomponenter)
  - 3699 produktoptimering (155 tecken | kw: produktoptimering formsprutning)
  - 233 verktygsberedning (156 tecken | kw: verktygsberedning formsprutning)
- [x] 3 artiklar publicerade vecka 21 (kat ID:48):
  - ID:7699 /produktutveckling/rostfritt-stal-vs-plast-materialval-produktutveckling/ (focus: materialval produktutveckling)
  - ID:7700 /produktutveckling/verktygsunderhall-livslangd-formsprutningsverktyg/ (focus: verktygsunderhåll formsprutning)
  - ID:7701 /produktutveckling/batch-storlek-ekonomi-smaserie-massproduktion/ (focus: småserie formsprutning kostnad)

## Klart 2026-04-13 (vecka 20)
- [x] 3 artiklar publicerade vecka 20 (kat ID:48):
  - ID:7675 /produktutveckling/overmoulding-plastdetaljer-guide/ (focus: overmoulding)
  - ID:7676 /produktutveckling/toleranser-plastdetaljer-guide/ (focus: toleranser plastdetaljer)
  - ID:7677 /produktutveckling/produktutveckling-tidplan-faser/ (focus: produktutveckling tidplan)
- [x] Focus keyword + meta description satt på 5 tjänstesidor (ID: 6238, 3969, 2, 3907, 3901)
- [x] Rank Math REST API fält registrerade via Code Snippet ID:18

## Klart 2026-04-12 (kväll)
- [x] 3 artiklar publicerade vecka 19 (kat ID:48):
  - ID:7672 /plastprototyp-guide-2026/ (focus: plastprototyp)
  - ID:7673 /sprututgjutning-plast-guide/ (focus: sprututgjutning plast)
  - ID:7674 /industridesign-produktutveckling-guide/ (focus: industridesign)

## Klart 2026-04-12
- [x] 3 artiklar publicerade vecka 18:
  - ID:7667 /produktutveckling/formsprutning-av-plast-guide/ (focus: formsprutning plast)
  - ID:7668 /produktutveckling/prototypframtagning-metoder/ (focus: prototypframtagning)
  - ID:7669 /produktutveckling/ce-markning-plastprodukter/ (focus: CE-märkning produkt)

## Klart 2026-04-10
- [x] 2026-04-10: 3 artiklar publicerade vecka 17 (kat ID:48 Produktutveckling):
  - ID:7664 /produktutveckling/platkonstruktion-och-tunnplat-komplett-guide-for-produktutvecklare/
  - ID:7665 /produktutveckling/dfm-design-for-manufacturability-sa-sanker-du-produktionskostnaden-redan-i-konstruktionsfasen/
  - ID:7666 /produktutveckling/materialval-i-produktutveckling-hur-du-valjer-ratt-material-for-ratt-funktion/
- [x] 2026-04-10: Språk ändrat en-US → sv_SE
- [x] 2026-04-10: Meta descriptions satta på 9 nyckelssidor (via Code Snippet #8 → deaktiverat)
- [x] 2026-04-10: 2 nya artiklar publicerade vecka 16:
  - Hållbar plastkonstruktion (ID:7660) /insikter/hallbar-plastkonstruktion-design-for-atervinning/
  - Verktygsberedning kostnad (ID:7661) /insikter/verktygsberedning-kostnad-formsprutning/
- [x] 2026-04-10: Kategori "Insikter" skapad (ID:49) — artiklar tilldelade

## Klart 2026-04-09
- [x] 5 artiklar publicerade (ID:7650-7657 span)

## Bakgrund
- Onboardad 2026-03-07
- Audit score 62/100 (2026-02-17)
- 30 ABC-keywords inlagda (26 A / 4 B / 0 C)
- Rank Math PRO aktivt
- Code Snippets aktivt

## Pausad
(inget)

## Referenser
- Kund-info: `kunder.md` (Jelmtech-sektion)
