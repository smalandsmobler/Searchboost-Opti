# SEO-Audit: phvast.se (Psykologhalsan Vast AB)

> Utford: 2026-02-15
> Utford av: Searchboost.se (autonom bakgrundsagent)
> Rapportversion: 1.0

---

## Sammanfattning

Psykologhalsan Vast AB (phvast.se) ar en psykologmottagning som erbjuder neuropsykiatriska utredningar (ADHD, autism m.fl.) for barn, ungdomar och vuxna. Sajten ar byggd pa WordPress med Elementor och Hello Elementor-tema, och anvander Rank Math PRO for SEO. Sajten har en stark lokal SEO-strategi med 76 stadsspecifika ADHD-utredningssidor, men lider av flera tekniska och innehallsrelaterade problem som begrransar dess synlighet.

### Huvudsakliga fynd

- **Styrkor**: HTTPS, Rank Math PRO installerat, sitemap korrekt, 99 indexerade sidor, stark lokal sidstrategi, WP Rocket for prestanda, cookie-hantering (GDPR)
- **Svagheter**: PHP 7.4 (utdaterad och sakerhetskritisk), trasig meta description pa startsidan, tomma Local SEO-data i KML, manga stadssidor med tunn/duplicerat innehall, saknar OG-bild pa startsidan, inga hreflang-taggar, "dold-test" och "wp-booking-calendar" indexerade i sitemap, Author-slug exponerar "stom_admin"
- **Mojligheter**: Forbattra lokalt schema (LocalBusiness), bygga backlanksstrategi, utoka kunskapsbanken med fler artiklar, optimera stadssidornas unika innehall

### SEO-poang (uppskattning): 45/100

---

## Teknisk SEO

### Server och infrastruktur

| Parameter | Varde | Status |
|-----------|-------|--------|
| HTTPS | Ja (SSL giltig) | OK |
| HTTP/2 | Ja | OK |
| Server | LiteSpeed | OK |
| PHP-version | **7.4.33** | KRITISKT — End of life sedan nov 2022 |
| CMS | WordPress | OK |
| Tema | Hello Elementor Child (3.0.1) | OK |
| Sidbyggare | Elementor | OK |
| SEO-plugin | Rank Math PRO | OK |
| Cache-plugin | WP Rocket (v2.0.4 LazyLoad) | OK |
| Cookie-hantering | cookiemanager.dk | OK (GDPR) |
| Laddningstid (TTFB) | ~0.20s | BRA |
| Sidstorlek (startsida) | ~103 KB (HTML) | OK |

### Kritiska tekniska problem

1. **PHP 7.4 ar End of Life** — Ingen sakerhetssupport sedan november 2022. Krav: uppgradera till minst PHP 8.1, helst 8.2+. Detta ar en sakerhetsbrist som aven paverkar prestanda.

2. **Trasig meta description pa startsidan** — Nuvarande: `"Psykologhalsan VastPsykologhalsan Vast utfor vetenskapligt baserade..."` — texten "Psykologhalsan Vast" upprepas utan mellanslag/punkt. Ser ut som en copy-paste-bugg.

3. **Startsidans title-tag ar generisk** — `"Hem - Psykologhalsan Vast AB"` borde inkludera nyckelord som "Neuropsykiatriska utredningar" eller "ADHD-utredning".

4. **Tomma Local SEO-data** — `locations.kml` saknar adress, telefonnummer, koordinater. Rank Math Local SEO ar aktiverat men inte konfigurerat.

5. **Sidor som borde vara noindex** men ar i sitemap:
   - `/dold-test/` — testsida med title "dold test"
   - `/wp-booking-calendar/` — bokningsformular (title pa engelska: "Booking Form")
   - `/wpbc-booking-received/` — bokningsbekraftelse pa engelska ("Thank you for your booking")

6. **Author-slug exponerar adminnamn** — Schema visar `"stom_admin"` som forfattare. Sakerhetsproblem + daligt for E-E-A-T.

### Robots.txt

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Sitemap: https://phvast.se/sitemap_index.xml
```

**Status**: OK — grundlaggande men funktionell.

### Sitemap

| Sitemap | Antal URL:er | Senast uppdaterad |
|---------|-------------|-------------------|
| page-sitemap.xml | 99 | 2026-02-12 |
| post-sitemap.xml | 4 | 2026-01-06 |
| category-sitemap.xml | 5 | 2026-01-06 |
| local-sitemap.xml | 1 (KML) | 2026-02-13 |
| **Totalt** | **109** | |

**Problem**: 99 sidor men bara 4 blogginlagg visar att sajten ar starkt sidtung med lite content marketing.

### Canonical-taggar

- Startsidan: `<link rel="canonical" href="https://phvast.se/" />` — OK
- Undersidor: Verkar korrekt konfigurerat via Rank Math

### Hreflang

- **Saknas helt** — Sajten ar enbart pa svenska (sv-SE), sa hreflang ar inte nodvandigt, men kan vara vardefullt om man vill signalera sprak till Google.

### Schema Markup (JSON-LD)

Startsidan har ett JSON-LD-block med:
- `Organization` — namn, URL, logotyp (OK)
- `WebSite` — med SearchAction (OK)
- `WebPage` — (OK)
- `Person` (author) — "stom_admin" (DALIGT — borde vara riktigt namn)
- `Article` — felaktigt pa startsidan (borde vara WebPage, inte Article)

**Saknas**:
- `LocalBusiness` eller `MedicalBusiness` schema — KRITISKT for en lokal psykologmottagning
- `Service` schema for utredningar
- `FAQPage` schema (borde finnas pa informationssidor)
- `BreadcrumbList` schema
- `MedicalOrganization` schema

---

## On-page SEO

### Startsidan (/)

| Element | Innehall | Bedomning |
|---------|----------|-----------|
| Title | "Hem - Psykologhalsan Vast AB" | DALIGT — generisk, saknar nyckelord |
| Meta description | "Psykologhalsan VastPsykologhalsan Vast utfor..." | TRASIG — dubblering utan mellanslag |
| H1 | "Neuropsykiatriska utredningar av barn, ungdomar och vuxna" | BRA |
| H2:or | 5 st (Vilka ar vi, Alla Manniskor ar olika, Nagra omraden..., Utredningar och vard..., Vad ar psykisk halsa?) | OK |
| OG:image | **SAKNAS** | Problem — inget bild visas vid delning |
| Canonical | https://phvast.se/ | OK |
| Google Site Verification | Ja (afKSSLROOdE1ISufpfD2X2wwFzsGxpyCayrRRQWMlRA) | OK — GSC verifierat |

### Huvudsidor — Title/Description-analys

| Sida | Title | Bedomning |
|------|-------|-----------|
| / | "Hem - Psykologhalsan Vast AB" | DALIGT — "Hem" ger inget seovarode |
| /adhd-utredning/ | "ADHD utredning - Psykologhalsan Vast AB" | OK men saknar "boka", "pris" |
| /autism-utredning/ | "Autism utredning - Psykologhalsan Vast AB" | OK |
| /adhd-test/ | "ADHD test - Psykologhalsan Vast AB" | OK |
| /autismtest/ | (ej kontrollerad) | — |
| /om-oss/ | "Om oss - Psykologhalsan Vast AB" | OK |
| /kunskapsbank/ | "Kunskapsbank - Psykologhalsan Vast AB" | OK |
| /depression/ | (ej kontrollerad) | — |
| /angest/ | (ej kontrollerad) | — |
| /gratis-bedomningssamtal/ | "Gratis bedomningssamtal - Psykologhalsan Vast AB" | BRA |

### Stadssidor (76 st) — ADHD utredning + stad

| Stad | Title | Problem |
|------|-------|---------|
| Goteborg | "Adhd utredning Goteborg \| 20 000 kr \| Psykologhalsan vast" | BRA — inkluderar pris |
| Stockholm | "ADHD utredning Stockholm - Psykologhalsan Vast AB" | OK |
| Malmo | "ADHD utredning Malmo - Psykologhalsan Vast AB" | OK |
| Umea | "ADHD utredning Umea - Psykologhalsan Vast AB" | Trasig desc: "kopplade tillADHD" (saknar mellanslag) |

**Risk for tunn/duplicerat innehall**: 76 stadssidor med liknande uppbyggnad och delvis identiska texter. Google kan valja att inte indexera alla.

### Blogginlagg (Kunskapsbank)

Bara **4 blogginlagg** — for lite for att bygga topical authority:
1. "Nervsystemet grunden till allt vi gor" (2026-01-06)
2. "ADHD medicin" (2025-07-02)
3. "ADHD och somnstorningar" (2025-07-02)
4. "ADHD och hjarnans kemi" (2025-06-02)

**Rekommendation**: Ojamforligt for lite content. Behover minst 20-30 artiklar for att bygga topical authority inom neuropsykiatri/ADHD.

### Bilder

- Manga bilder anvander Adobe Stock-bilder (AdobeStock_XXX.webp) — inga unika bilder
- Samma bilder ateranvands pa manga stadssidor (AdobeStock_632553572.webp forekommer pa ~60+ sidor)
- WebP-format anvands — BRA for prestanda
- Alt-text-kontroll kravs for varje sida (inte mojligt att gora exakt rakning fran startsidans HTML pa grund av lazy loading)

---

## Backlink-profil

**OBS**: SE Ranking API ar for tillfallet otillganglig (insufficient funds). Datan nedan baseras pa tillgangliga signaler fran crawlen.

### Kanda signaler

- **Google Site Verification**: Aktiv (GSC konfigurerat)
- **WP REST API**: Tillganglig (svarar pa /wp-json/)
- **RSS-floden**: Aktiv (/feed/ och /comments/feed/)
- **Extern lankstrategi**: Inga synliga utgaende lankar fran startsidan till kataloglistningar eller branschsajter

### Uppskattad profil (baserat pa sajtens storlek och nisch)

- **Domain Rating**: Uppskattat 10-25 (ny nisch-sajt utan stark lanktyngd)
- **Referring Domains**: Uppskattat 10-50
- **Saknar troligen**: Branschlankarbeten, kataloglistningar, Google Business Profile-koppling
- **Rekommendation**: Bygg lankar fran halso/psykologkataloger, lokala foretagslistor, branschorganisationer

---

## ABC-nyckelord

### A-nyckelord (primara, hog relevans + hog sokvolym)

| Nyckelord | Uppskattad sokvolym/man | Konkurrens |
|-----------|------------------------|------------|
| adhd utredning | 12 000-18 000 | Hog |
| adhd test | 8 000-12 000 | Hog |
| adhd utredning vuxen | 4 000-8 000 | Medel-Hog |
| autism utredning | 5 000-8 000 | Medel-Hog |
| neuropsykiatrisk utredning | 2 000-4 000 | Medel |
| adhd utredning pris | 2 000-4 000 | Medel |
| adhd utredning privat | 2 000-4 000 | Medel |

### B-nyckelord (sekundara, medel sokvolym)

| Nyckelord | Uppskattad sokvolym/man | Konkurrens |
|-----------|------------------------|------------|
| adhd utredning goteborg | 800-1 500 | Medel |
| adhd utredning stockholm | 1 000-2 000 | Hog |
| adhd utredning malmo | 500-1 000 | Medel |
| autism utredning vuxen | 1 000-2 000 | Medel |
| adhd symtom vuxen | 3 000-5 000 | Medel |
| adhd medicin | 2 000-4 000 | Medel |
| add utredning | 1 000-2 000 | Lag-Medel |
| adhd test online | 2 000-4 000 | Medel |
| psykolog utredning | 500-1 000 | Medel |
| boka adhd utredning | 200-500 | Lag |

### C-nyckelord (long-tail, specifika)

| Nyckelord | Uppskattad sokvolym/man | Konkurrens |
|-----------|------------------------|------------|
| adhd utredning barn kostnad | 100-300 | Lag |
| hur lang tid tar en adhd utredning | 200-500 | Lag |
| skillnad adhd och add | 500-1 000 | Lag |
| autism utredning barn | 500-1 000 | Lag-Medel |
| neuropsykiatrisk utredning goteborg | 100-300 | Lag |
| vad ingar i en adhd utredning | 200-500 | Lag |
| adhd utredning online | 200-500 | Lag |
| tourettes syndrom utredning | 100-300 | Lag |
| odd diagnos barn | 100-300 | Lag |
| adhd utredning vantetid | 200-500 | Lag |
| adhd och somnproblem | 500-1 000 | Lag |
| gratis adhd test | 500-1 000 | Lag |
| depression och adhd | 200-500 | Lag |
| angest och adhd | 200-500 | Lag |

---

## Prioriterade problem (numrerad lista)

### Kritiska (atgarda omedelbart)

1. **PHP 7.4 — uppgradera till PHP 8.1+** — Sakerhetskritiskt, prestanda-paverkan, WordPress 6.x stodjer inte PHP 7.4 fullt ut
2. **Trasig meta description pa startsidan** — "Psykologhalsan VastPsykologhalsan Vast" — dubblering utan mellanslag
3. **Tomma Local SEO-data (KML)** — Rank Math Local SEO ar aktiverat men saknar adress, telefon, koordinater. Kritiskt for lokal synlighet
4. **Noindex testsidor** — `/dold-test/`, `/wp-booking-calendar/`, `/wpbc-booking-received/` ska inte vara i sitemap och ska ha noindex

### Hoga prioritet

5. **Startsidans title-tag** — Andra fran "Hem - Psykologhalsan Vast AB" till nyckelordsrikt alternativ, t.ex. "ADHD & Autism Utredning | Psykologhalsan Vast AB"
6. **Saknar LocalBusiness/MedicalBusiness schema** — Lagg till komplett schema med adress, telefon, oppettider, tjanster, priser
7. **OG:image saknas pa startsidan** — Inget bild visas vid delning pa sociala medier
8. **Author-slug "stom_admin"** — Byt till riktigt namn for E-E-A-T och sakerhet
9. **Schema-typ pa startsidan** — Andras fran "Article" till "WebPage" eller "MedicalBusiness"

### Medel prioritet

10. **76 stadssidor riskerar tunn/duplicerat innehall** — Varje stadssida behover unikt innehall pa minst 500-800 ord med lokal information
11. **Bara 4 blogginlagg** — Behover minst 20-30 artiklar for topical authority
12. **Saknar BreadcrumbList schema** — For battre SERP-visning
13. **Saknar FAQ-schema** pa informationssidor — Mojlighet att fa featured snippets
14. **Meta descriptions pa stadssidor** — Nagra har stavfel ("kopplade tillADHD" pa Umea-sidan)
15. **Booking-sidor pa engelska** — "Thank you for your booking" pa en svensk sajt

### Lagre prioritet

16. **Saknar hreflang** — Inte kritiskt for en ensprakig sajt men bra praxis
17. **Adobe Stock-bilder** — Manga sidor anvander samma stockbild, saknar originalbilder
18. **RSS-flode** exponerar kommentarsflode — onodig indexeringsbelastning
19. **WP REST API oppet** — Sakerhetsproblem om inte behovs for frontend

---

## 3-manaders atgardsplan

### Manad 1: Teknisk grund och kritiska fixar

| Vecka | Uppgift | Prioritet |
|-------|---------|-----------|
| 1 | Uppgradera PHP till 8.1+ (kontakta hosting) | KRITISK |
| 1 | Fixa meta description pa startsidan (ta bort dubblering) | KRITISK |
| 1 | Noindex /dold-test/, /wp-booking-calendar/, /wpbc-booking-received/ | KRITISK |
| 1 | Ta bort dessa sidor fran sitemap | KRITISK |
| 2 | Optimera startsidans title-tag med nyckelord | HOG |
| 2 | Lagg till OG:image pa startsidan | HOG |
| 2 | Byt author-slug fran "stom_admin" till riktigt namn | HOG |
| 2 | Fixa schema-typ pa startsidan (Article -> WebPage) | HOG |
| 3 | Konfigurrera Rank Math Local SEO komplett (adress, telefon, oppettider, koordinater) | KRITISK |
| 3 | Implementera LocalBusiness / MedicalBusiness schema pa alla sidor | HOG |
| 3 | Lagg till Service schema for varje utredningstyp | MEDEL |
| 4 | Lagg till BreadcrumbList schema | MEDEL |
| 4 | Granska och fixa meta descriptions pa alla stadssidor (stavfel, trunkeringar) | MEDEL |
| 4 | Oversatt bokningsbekraftelse-sida till svenska | LAG |

### Manad 2: Innehallsoptimering och lokal SEO

| Vecka | Uppgift | Prioritet |
|-------|---------|-----------|
| 5 | Skriva unikt innehall for top-10 stadssidor (Stockholm, Goteborg, Malmo, Uppsala, Linkoping, Jonkoping, Vasteras, Norrkoping, Helsingborg, Lund) — minst 500 ord/stad med lokal info | HOG |
| 6 | Skriva 4 nya kunskapsbank-artiklar: "Hur gar en ADHD-utredning till?", "ADHD hos kvinnor", "Skillnad mellan ADHD och ADD", "Vantetider ADHD-utredning" | HOG |
| 7 | Skriva ytterligare 4 artiklar: "Autism hos vuxna", "ADHD och angest", "Neuropsykiatrisk utredning — vad ingar?", "ADHD utredning barn — foraldraguide" | HOG |
| 7 | Implementera FAQ-schema pa informationssidor | MEDEL |
| 8 | Optimera intern lankning — varje blogginlagg ska lanka till relevanta tjanstesidor | MEDEL |
| 8 | Sakerstalla att Google Business Profile ar komplett och kopplat till sajten | HOG |

### Manad 3: Backlank-strategi och tillvaxt

| Vecka | Uppgift | Prioritet |
|-------|---------|-----------|
| 9 | Registrera sajten i relevanta kataloger: 1177 Vardguiden, Kry-listningar, Psykologiguiden.se, Eniro, Hitta.se, Google Maps | HOG |
| 9 | Kontakta branschorganisationer (Sveriges Psykologforbund, Svenska Psykiatriska Foreningen) for lankmojligheter | MEDEL |
| 10 | Skriva gastinlagg pa halsosajter / bloggar om ADHD | MEDEL |
| 10 | Skriva 4 nya artiklar for kunskapsbanken (totalt 12 artiklar vid manad 3) | HOG |
| 11 | Revidera och utoka stadssidor batch 2 (ytterligare 10 stader med unikt innehall) | MEDEL |
| 11 | Implementera strukturerade data for recensioner (om sadan finns) | MEDEL |
| 12 | Uppfoljning: GSC-analys av indexeringsstatus, klick, impressions, positioner | HOG |
| 12 | Justera strategi baserat pa data fran GSC | HOG |

### Forvantat resultat efter 3 manader

- Alla kritiska tekniska problem atgardade
- Minst 12 kunskapsbank-artiklar publicerade (fran 4)
- 20+ stadssidor med unikt lokalt innehall (fran troligen tunn kopierad text)
- LocalBusiness schema komplett
- Sakrare sajt (PHP 8.1+, admin-slug fixad)
- Uppskattad traffikokning: 30-60% organisk traffik inom 3-6 manader

---

## Teknisk sammanfattning

| Kategori | Poang | Max |
|----------|-------|-----|
| Teknisk grund (HTTPS, hastighet, mobil) | 7/10 | 10 |
| Indexering (sitemap, robots, canonical) | 6/10 | 10 |
| Schema markup | 3/10 | 10 |
| On-page SEO (titles, descriptions, H-taggar) | 4/10 | 10 |
| Innehallskvalitet | 4/10 | 10 |
| Lokal SEO | 2/10 | 10 |
| Backlankprofil | 3/10 | 10 |
| Teknisk sakerhet (PHP, API) | 2/10 | 10 |
| E-E-A-T-signaler | 3/10 | 10 |
| Mobilanpassning | 8/10 | 10 |
| **Totalt** | **42/100** | **100** |

---

## Appendix: Fullstandig sidlista (sitemap)

### Huvudsidor
- / (Hem)
- /adhd-utredning/
- /autism-utredning/
- /adhd-test/
- /autismtest/
- /utredningar/
- /om-oss/
- /kunskapsbank/
- /gratis-bedomningssamtal/
- /depression/
- /angest/
- /tourettes-syndrom/
- /odd/

### Stadssidor (ADHD-utredning) — 76 st
Akersberga, Alingsas, Angelholm, Borlange, Boras, Enkoping, Eskilstuna, Eslov, Falkenberg, Falkoping, Falun, Gavle, Goteborg, Gustavsberg, Halmstad, Harnosand, Hassleholm, Helsingborg, Jonkoping, Kalmar, Karlshamn, Karlskoga, Karlskrona, Karlstad, Katrineholm, Kiruna, Koping, Kristianstad, Kristinehamn, Kumla, Kungalv, Kungsbacka, Landskrona, Lerum, Lidingo, Lidkoping, Linkoping, Lulea, Lund, Malmo, Marsta, Molnlycke, Motala, Nassjo, Ornskoldsvik, Ostersund, Skovde, Sollentuna, Stockholm, Sundsvall, Trollhattan, Tumba, Umea, Uppsala, Vallentuna, Varberg, Vasterhaninge, Vasteras, Vaxjo, Ystad (m.fl.)

### Blogginlagg — 4 st
- /nervsystemet-grunden-till-allt-vi-gor/
- /adhd-medicin/
- /adhd-och-somnstorningar/
- /adhd-och-hjarnans-kemi/

### Kategorier — 5 st
- /category/artiklar/
- /category/artiklar/grundlaggande-neurovetenskap/
- /category/artiklar/hjarnans-regleringssystem-och-funktionella-natverk/
- /category/artiklar/adhd-och-somn/
- /category/artiklar/medicinsk-behandling/

### Sidor att noindex-a
- /dold-test/
- /wp-booking-calendar/
- /wpbc-booking-received/

---

*Rapport genererad av Searchboost.se SEO-automationssystem*
*Nasta uppfoljning rekommenderas: 2026-03-15*
