# SEO-Audit: Wedo Signs (wedosigns.se)

> Utford: 2026-03-03
> Uppdaterad: Komplett revision med teknisk djupanalys, on-page-genomgang, lokal SEO och innehallsgranskning
> Kontakt: Danni Andersen, +46 793020787, info@wedosigns.se
> Adress: Datavagen 14B, 436 32 Askim (Goteborg)
> Utford av: Searchboost (Mikael Larsson)

---

## Sammanfattning

| Kategori | Poang | Max |
|----------|-------|-----|
| Teknisk SEO | 38 | 25 |
| On-Page SEO | 52 | 25 |
| Lokal SEO | 22 | 25 |
| Innehall & Strategi | 20 | 25 |
| **TOTALT** | **52** | **100** |

**Bedomning**: Wedosigns.se har en overraskande stark on-page-grund med 20 optimerade tjanstsidor, men allvarliga tekniska brister (PHP 7.4, avsaknad av sakerhetsheaders), svag lokal SEO (inget verifierat GBP, saknar LocalBusiness-schema live) och nastan inget innehallsmarknadsforingsarbete (ingen blogg, inga case studies). Sajten ar nu live (Coming Soon avaktiverad sedan feb 2026) och indexerbar, men har en kort historik i Google.

---

## 1. Teknisk SEO (38/100 i denna kategori → viktat 9,5/25)

### 1.1 Serverinfrastruktur

| Parameter | Varde | Status | Kommentar |
|-----------|-------|--------|-----------|
| CMS | WordPress 6.9.1 | OK | Senaste versionen |
| Tema | Divi 4.27.6 | OK | Populart tema, prestanda kan forbattras |
| Server | Apache | OK | Standard |
| PHP-version | 7.4.33 | KRITISK | End-of-life sedan november 2022 — ingen sakerhetssupport, prestandaforlust ~30% jamfort med PHP 8.2 |
| SSL | Let's Encrypt, TLSv1.3 | OK | Giltigt till 2026-04-29 |
| HTTPS-redirect | HTTP 301 → HTTPS | OK | Korrekt konfigurerat |
| Hosting | Delat webbhotell (troligen) | MEDEL | Begransade prestandamojligheter |

### 1.2 Indexeringsstatus

| Parameter | Status | Kommentar |
|-----------|--------|-----------|
| Coming Soon-plugin | AVAKTIVERAT | Var aktivt fram till ~feb 2026 — blockerade all indexering |
| robots.txt | OK | Standard WordPress-fil |
| Meta robots | index, follow | OK pa alla sidor |
| Canonical-taggar | OK | Yoast/Rank Math genererar korrekta canonicals |
| Indexeringshistorik | KORT | Sajten har bara varit tillganglig for Google i ca 3-4 veckor |

### 1.3 Sitemap

| Fil | Innehall | Status |
|-----|----------|--------|
| sitemap.xml | Sitemap-index med 3 sub-sitemaps | OK |
| page-sitemap.xml | 20 sidor | OK — alla tjanstesidor inkluderade |
| post-sitemap.xml | 1 URL (/hello-world/) | PROBLEM — default WP-inlagg, bor raderas |
| category-sitemap.xml | 1 URL (/category/uncategorized/) | PROBLEM — tom kategori, bor exkluderas |

### 1.4 SEO-plugin

| Plugin | Status | Kommentar |
|--------|--------|-----------|
| Rank Math | Aktiv | Genererar sitemap, schema, meta-taggar |
| Yoast SEO | EJ aktiv (historiskt anvand) | Nagra Yoast-strukturer kan finnas kvar — kontrollera for konflikter |

### 1.5 Schema Markup (nuvarande)

| Schema-typ | Finns | Kommentar |
|------------|-------|-----------|
| Organization | Ja | Via Rank Math pa startsidan |
| WebSite | Ja | Via Rank Math |
| WebPage | Ja | Pa alla sidor |
| BreadcrumbList | Ja | Pa alla sidor |
| Article | Ja (pa tjanstsidor) | PROBLEM — tjanstsidor bor inte ha Article-schema, bor vara Service |
| LocalBusiness | NEJ | KRITISKT — avgorrande for lokal SEO. mu-plugin ar forberedd men ej deployad |
| Service | NEJ | SAKNAS — bor finnas pa varje tjanstsida |
| FAQPage | NEJ | SAKNAS — mojlighet till rich snippets i SERP |

### 1.6 Sakerhetsheaders

| Header | Status | Prioritet |
|--------|--------|-----------|
| Strict-Transport-Security (HSTS) | SAKNAS | HOG |
| X-Frame-Options | SAKNAS | MEDEL |
| X-Content-Type-Options | SAKNAS | MEDEL |
| Content-Security-Policy | SAKNAS | MEDEL |
| Referrer-Policy | SAKNAS | LAG |
| Permissions-Policy | FINNS | OK (private-state-token) |

### 1.7 Prestandaindikatorer

| Parameter | Status | Kommentar |
|-----------|--------|-----------|
| Divi Builder | Laddar extra CSS/JS | Kan optimeras med Divi Performance-installningar |
| Jetpack Boost | Installerad | Kan hjalpa med CSS-optimering och lazy loading |
| WebP Converter | Installerad | Bra — konverterar bilder till WebP automatiskt |
| Bildoptimering | DELVIS | Bilder konverteras men alt-texter saknas pa manga |
| Core Web Vitals | EJ MATT | For kort indexeringshistorik for att ha data i GSC |

### 1.8 Ovriga tekniska problem

| Problem | Allvarlighetsgrad | Atgard |
|---------|-------------------|--------|
| PHP 7.4.33 (EOL) | KRITISK | Uppgradera till 8.2+ via hosting-panel |
| OG locale ar en_US | MEDEL | Andra till sv_SE (mu-plugin fixar detta) |
| Duplicate viewport meta-taggar | LAG | Ta bort en av de tva |
| /hello-world/ i sitemap | LAG | Radera inlagget |
| /category/uncategorized/ i sitemap | LAG | Exkludera eller radera |
| /print-goteborg-2/ felaktig slug | MEDEL | Byt slug till /print-goteborg/, skapa redirect |
| Copyright-text sager "Divi" | LAG | Andra till "Wedo Signs AB" |

---

## 2. On-Page SEO (52/100 i denna kategori → viktat 13/25)

### 2.1 Oversikt av alla sidor

Wedosigns.se har 20 publicerade sidor plus 1 default-inlagg. Varje tjanstsida ar optimerad med lokala sokord i URL, title-tag och meta description.

#### Tjanstsidor (17 st)

| # | URL-slug | Title-tag | Meta description | Innehallslangd | Status |
|---|----------|-----------|------------------|----------------|--------|
| 1 | /skyltar-goteborg/ | Skyltar i Goteborg -- Platskylt, Ljusskylt & Mer | Ja, 126 tecken | ~8 500 tecken | BRA |
| 2 | /bildekor-goteborg/ | Bildekor i Goteborg \| Fordonsfoliering & Reklamdekor | Ja, 155 tecken | ~8 500 tecken | BRA |
| 3 | /ljusskyltar-goteborg/ | Ljusskyltar i Goteborg | Ja | ~8 600 tecken | BRA |
| 4 | /platskyltar-goteborg/ | Platskyltar i Goteborg | Ja | ~9 500 tecken | BRA |
| 5 | /namnskyltar-goteborg/ | Namnskyltar i Goteborg | Ja | ~7 650 tecken | BRA |
| 6 | /flaggskylt-fasad-goteborg/ | Flaggskyltar i Goteborg | Ja | ~7 200 tecken | BRA |
| 7 | /klistermarken-goteborg/ | Klistermarken i Goteborg | Ja | ~8 700 tecken | BRA |
| 8 | /folie-dekor-goteborg/ | Folie & Dekor i Goteborg | Ja | ~9 200 tecken | BRA |
| 9 | /golvdekor-goteborg/ | Golvdekor i Goteborg | Ja | ~8 600 tecken | BRA |
| 10 | /frost-film-goteborg/ | Frost Film i Goteborg | Ja | ~8 300 tecken | BRA |
| 11 | /insynsskydd-goteborg/ | Insynsskydd i Goteborg | Ja | ~8 350 tecken | BRA |
| 12 | /solfilm-goteborg/ | Solfilm i Goteborg | Ja | ~9 100 tecken | BRA |
| 13 | /print-goteborg-2/ | Print i Goteborg -- Storformat & Digitaltryck | Ja | ~8 600 tecken | SLUG FELAKTIG |
| 14 | /event-exponering-goteborg/ | Event & Exponering i Goteborg | Ja | ~8 900 tecken | BRA |
| 15 | /banderoller-goteborg/ | Banderoller i Goteborg | Ja | ~7 850 tecken | BRA |
| 16 | /dekaler-goteborg/ | SIDA SAKNAS | — | — | NY SIDA BEHOVS |
| 17 | Startsidan (/) | Bildekor & skyltar i Goteborg | Ja | ~25 000 tecken | BRA (med Reviews) |

#### Ovrigt (4 st)

| # | URL-slug | Beskrivning | Status |
|---|----------|-------------|--------|
| 18 | /produkter/ | Oversiktssida for alla tjanster | OK |
| 19 | /offerter-wedosigns/ | Offertformular/kontaktsida | META DESC SAKNAS |
| 20 | /galleri/ | Bildgalleri med utforda projekt | OK (men saknar SEO-text) |
| 21 | /om-oss/ | Om foretaget | SVAGT INNEHALL |

### 2.2 Styrkor

- **17 unika tjanstsidor** med lokalt fokus (alla har "goteborg" i slug)
- **Rank Math-konfigurerat** med unika title-taggar och meta descriptions pa de flesta sidor
- **Bra innehallslangd** — 7 000-9 500 tecken per tjanstsida (ca 800-1 200 ord)
- **SEO-vanliga URL:er** — korta, beskrivande slugs med nyckelord
- **Google Reviews-widget** pa startsidan (socialt bevis)
- **H1-taggar** anvands korrekt pa tjanstsidorna

### 2.3 Problem

| Problem | Allvarlighetsgrad | Paverkan |
|---------|-------------------|----------|
| Ingen FAQ-sektion pa nagra tjanstsidor | HOG | Missar FAQ-rich-snippets i SERP |
| Ingen intern lankstruktur mellan tjanstsidor | HOG | Google forstar inte relationen mellan sidor |
| Bilder saknar beskrivande alt-texter | HOG | Missar bildsokning + tillganglighet |
| /dekaler-goteborg/ saknas som sida | MEDEL | Missar sokordet "dekaler goteborg" |
| /offerter-wedosigns/ saknar meta description | MEDEL | Svag SERP-visning |
| /om-oss/ har svagt innehall | MEDEL | Svaga E-E-A-T-signaler |
| Ingen blogg eller artikelinnehall | HOG | Missar informationella sokningar helt |
| Inga prisindikatorer pa tjanstsidorna | MEDEL | Missar "pris"-relaterade sokningar |
| 3 bilder har alt-text "co-working-112 kopiera" | MEDEL | Icke-beskrivande, felaktig alt-text |
| /print-goteborg-2/ felaktig slug | LAG | Korrekt slug bor vara /print-goteborg/ |

### 2.4 Heading-struktur (bedomning)

| Element | Status |
|---------|--------|
| H1 per sida | OK — en unik H1 pa varje tjanstsida |
| H2-hierarki | TROLIGEN OK — baserat pa innehallslangd och sidstruktur i Divi |
| Nyckelord i rubriker | BRA — lokala sokord inkluderade |
| Rubrikdjup (H3, H4) | OKANT — kraver rendering i browser for full bedomning |

---

## 3. Lokal SEO (22/100 i denna kategori → viktat 5,5/25)

### 3.1 Google Business Profile (GBP)

| Parameter | Status | Kommentar |
|-----------|--------|-----------|
| GBP existerar | OKANT | Kan ej verifiera fran crawl. Ingen GBP-lank pa sajten |
| NAP-konsistens | DELVIS | Namn/adress/telefon finns pa sajten men inte konsekvent formaterat |
| Recensioner | TROLIGEN FA | Google Reviews-widget visar recensioner, men antal okant |
| GBP-kategorier | OKANT | "Skyltforetag" bor vara primar kategori |
| GBP-inlagg | TROLIGEN NEJ | Ingen indikation pa aktiv GBP-publicering |
| GBP-bilder | OKANT | Bor uppdateras regelbundet |

### 3.2 NAP-konsistens (Name, Address, Phone)

| Plats | Namn | Adress | Telefon |
|-------|------|--------|---------|
| Startsidan | Wedo Signs / WEDO SIGNS (inkonsekvent) | Datavagen 14B, Askim | 0793-020787 |
| Footer | Wedosigns (ihopskrivet) | Datavagen 14B, 436 32 Askim | 0793-020787 |
| Om Oss | WEDO SIGNS | — | — |
| Offert-sida | — | — | — |

**Problem**: Inkonsekvent namnanvandning (Wedo Signs, WEDO SIGNS, WeDo Signs, Wedosigns) paverkar lokal SEO negativt. Google foredrar exakt matchning overallt.

### 3.3 Schema for lokal SEO

| Schema-typ | Status | Paverkan |
|------------|--------|----------|
| LocalBusiness | SAKNAS (mu-plugin ej deployad) | KRITISK — Google forstar inte att det ar ett lokalt foretag |
| GeoCoordinates | SAKNAS | MEDEL — hjalper med lokal kartplacering |
| OpeningHours | SAKNAS | MEDEL — hjalper med "oppettider"-sokningar |
| areaServed | SAKNAS | HOG — definiera tjansteomrade (Goteborg + kringliggande) |

### 3.4 Lokala kataloger och lankprofil

| Katalog | Status | Kommentar |
|---------|--------|-----------|
| Google Business Profile | OKANT | Maste verifieras/skapas |
| Eniro | OKANT | Registrera foretaget |
| Hitta.se | OKANT | Registrera foretaget |
| Allabolag.se | TROLIGEN | Wedo Signs AB bor finnas (AB-registrering) |
| Branschkataloger (skylt) | OKANT | Skylttillverkare.se, Skyltforbundet etc. |
| Lokala foretagsnatverk | OKANT | Goteborgs Handelsforening, BNI, etc. |

### 3.5 Omradesstrategi

| Omrade | Status | Kommentar |
|--------|--------|-----------|
| Goteborg (stad) | BRA | Alla tjanstsidor fokuserar pa Goteborg |
| Askim (adress) | NAMNS | Adress i Askim men ingen dedikerad optimering |
| Molndal | SAKNAS | Narliggande kommun — mojlig landningssida |
| Partille | SAKNAS | Narliggande kommun — mojlig landningssida |
| Kungsbacka | SAKNAS | Narliggande kommun — mojlig landningssida |
| Vastra Gotaland | SAKNAS | Regional nivahjalper med bredare tjansteomrade |

---

## 4. Innehall & Strategi (20/100 i denna kategori → viktat 5/25)

### 4.1 Befintligt innehall

| Typ | Antal | Status |
|-----|-------|--------|
| Tjanstsidor | 17 (15 publicerade + dekaler planerad + print slug-fix) | BRA grund |
| Bloggartiklar | 0 (bara "Hello World" fran 2020) | KRITISK BRIST |
| Case studies / Referensprojekt | 0 (galleri finns men utan text) | HOG BRIST |
| FAQ-sektioner | 0 (innehall forberett men ej deployat) | HOG BRIST |
| Guider | 0 | MEDEL BRIST |
| Videor | 0 | LAG (men stark signal) |

### 4.2 Foretaget — E-E-A-T-analys

| Signal | Status | Kommentar |
|--------|--------|-----------|
| Erfarenhet (Experience) | NAMNS i CLAUDE.md men EJ PA SAJTEN | Danni har 12+ ars erfarenhet som skyltmakare fran Danmark |
| Expertis (Expertise) | SVAG PA SAJTEN | Utbildningsbakgrund (3-arig yrkesutbildning) namns ej synligt |
| Auktoritet (Authoritativeness) | SVAG | Inga recensioner pa sajten (utom widget), inga branschmedlemskap |
| Trowardighet (Trustworthiness) | MEDEL | Google Reviews finns, SSL OK, men varumårket ar nytt |

### 4.3 Innehallsbrister — prioriterade

1. **Ingen blogg** — Informationella sokningar ("hur valjer man skylt", "bildekor pris", "skillnad ljusskylt neonskyltar") drivs inte till sajten
2. **Inga case studies** — Potentiella kunder vill se referensprojekt med beskrivningar
3. **Saknar prisindikationer** — "pris"-sokningar ar bland de vanligaste for lokala tjanster
4. **Om Oss-sidan ar tunn** — Dannis 12-ariga erfarenhet fran Danmark, yrkesutbildning och bakgrund nyttjas ej for E-E-A-T
5. **Inget videoinnehall** — Video ar en stark rankningssignal for Google
6. **Saknar kundcitat/testimonials pa tjanstsidorna** — Bara pa startsidan via widget

### 4.4 Konkurrenslandskap (Goteborg)

| Konkurrent | Styrkor | Svagheter |
|------------|---------|-----------|
| Grafiska Skyltar | Stark lokal narvaro, manga recensioner | Aldre design |
| Skyltgruppen | Brett sortiment, bra SEO | Stor konkurrent med resurser |
| Skylt & Reklam i Goteborg | Lokal etablering | Svag digital narvaro |
| Dekal & Reklam | Stark pa fordonsdekor | Begransat skyltutbud |

**Bedomning**: Konkurrensen inom "skyltar goteborg" ar mattlig. De flesta konkurrenter har svag SEO med fa bloggartiklar och bristfallig schemamarkering. Wedosigns.se har mojlighet att ranka topp 5 inom 6-12 manader med ratt atgarder.

---

## 5. Kritiska atgarder — Prioritetsordning

### PRIO 1 (Gorra NU — vecka 1)

| # | Atgard | Paverkan | Tid |
|---|--------|----------|-----|
| 1 | Uppgradera PHP 7.4 → 8.2+ | Sakerhet + prestanda +30% | 15 min |
| 2 | Deploya schema mu-plugin (LocalBusiness + Service + FAQ) | Lokal SEO + rich snippets | 15 min |
| 3 | Fixa NAP-konsistens ("Wedo Signs" overallt) | Lokal SEO-signal | 15 min |
| 4 | Skicka in sitemap till Google Search Console | Snabbare indexering | 10 min |
| 5 | Skapa/verifiera Google Business Profile | Kritiskt for lokala sokningar | 30 min |
| 6 | Radera /hello-world/ + rensa /category/uncategorized/ | Ren sitemap | 5 min |

### PRIO 2 (Vecka 2-3)

| # | Atgard | Paverkan | Tid |
|---|--------|----------|-----|
| 7 | Lagg in FAQ-sektioner pa 5 huvudsidor + deploy schema | FAQ-rich-snippets | 60 min |
| 8 | Skapa Dekaler-sida (/dekaler-goteborg/) | Ny sida for hogt sokord | 60 min |
| 9 | Skriv meta descriptions for alla 20 sidor | Battre SERP-klickfrekvens | 45 min |
| 10 | Bygg intern lankstruktur mellan alla tjanstsidor | Battre crawlning + lankstyrka | 45 min |
| 11 | Fixa alt-texter pa alla bilder | Bildsokning + tillganglighet | 30 min |
| 12 | Fixa /print-goteborg-2/ slug | Ren URL-struktur | 10 min |

### PRIO 3 (Manad 2)

| # | Atgard | Paverkan | Tid |
|---|--------|----------|-----|
| 13 | Skriv 2 bloggartiklar (guide + prisinformation) | Informationella sokningar | 3 tim |
| 14 | Skapa referensprojekt-sida med 5-10 case studies | E-E-A-T + konvertering | 2 tim |
| 15 | Forstark Om Oss-sidan (Dannis bakgrund, utbildning, erfarenhet) | E-E-A-T | 30 min |
| 16 | Lagg till prisindikatorer pa tjanstsidorna | "Pris"-sokningar | 45 min |
| 17 | Registrera i lokala kataloger (Eniro, Hitta.se) | Lokal SEO + lankar | 60 min |
| 18 | Implementera GA4 + GTM | Sporning av konverteringar | 30 min |

### PRIO 4 (Manad 3)

| # | Atgard | Paverkan | Tid |
|---|--------|----------|-----|
| 19 | Skriv 2 ytterligare bloggartiklar | Utoka organisk rackvidd | 3 tim |
| 20 | Skapa omradessidor (Molndal, Partille, Kungsbacka) | Bredda lokal rackvidd | 3 tim |
| 21 | Lagg till sakerhetsheaders (HSTS, X-Frame-Options) | Sakerhetspoang | 15 min |
| 22 | Lankkampanj — lokala foretag, branschkataloger | Domanauktoritet | Lopande |
| 23 | Optimera Core Web Vitals (Divi-prestanda) | Prestandasignal | 2 tim |

---

## 6. Forvantade resultat

| Tidsram | Forvantat resultat |
|---------|-------------------|
| 1-2 manader | Google borjar indexera alla 20 sidor. Lokala sokningar borjar visa wedosigns.se |
| 3-4 manader | Topp 20 for "skyltar goteborg", "bildekor goteborg". GBP-listning aktiv |
| 6 manader | Topp 10 for A-nyckelord. FAQ-snippets i SERP. Okad organisk trafik +200-400% |
| 12 manader | Topp 5 for huvudsokord. Stark lokal narvaro. 100+ organiska besokare/manad |

---

## 7. Poangbedomning — Detaljerad

### Teknisk SEO (viktat 25 poang)

| Kriterium | Poang | Max | Kommentar |
|-----------|-------|-----|-----------|
| SSL/HTTPS | 3 | 3 | Korrekt konfigurerat |
| PHP-version | 0 | 3 | EOL sedan 2022 |
| Sitemap | 2 | 3 | Finns men innehaller skrap |
| Schema markup | 1 | 4 | Grundlaggande finns, LocalBusiness/Service/FAQ saknas |
| Sakerhetsheaders | 0 | 3 | 5 av 6 saknas |
| Mobilanpassning | 3 | 3 | Divi ar responsivt |
| Prestanda | 2 | 3 | WebP + Jetpack Boost, men PHP 7.4 + Divi-overhead |
| Canonical/redirects | 2 | 3 | Canonicals OK, men felaktig slug pa print-sidan |
| **Summa** | **13** | **25** | |

### On-Page SEO (viktat 25 poang)

| Kriterium | Poang | Max | Kommentar |
|-----------|-------|-----|-----------|
| Title-taggar | 4 | 4 | Unika, optimerade pa alla tjanstsidor |
| Meta descriptions | 3 | 4 | Bra pa de flesta, saknas pa nagon |
| H1-struktur | 4 | 4 | Korrekt anvandning |
| URL-struktur | 4 | 4 | SEO-vanliga med lokala sokord |
| Intern lankstruktur | 0 | 3 | Saknas helt |
| Alt-texter | 1 | 3 | Delvis, manga saknas eller ar generiska |
| Innehallslangd | 3 | 3 | 800-1200 ord per tjanstsida |
| **Summa** | **19** | **25** | |

### Lokal SEO (viktat 25 poang)

| Kriterium | Poang | Max | Kommentar |
|-----------|-------|-----|-----------|
| Google Business Profile | 0 | 6 | Okant/ej verifierat |
| LocalBusiness-schema | 0 | 4 | Saknas (mu-plugin redo men ej deployad) |
| NAP-konsistens | 1 | 4 | Inkonsekvent namnformat |
| Lokala kataloger | 0 | 4 | Inga kanda registreringar |
| Recensioner | 2 | 4 | Google Reviews-widget finns pa sajten |
| Omradesstrategi | 1 | 3 | Goteborg-fokus finns, men inga omradessidor |
| **Summa** | **4** | **25** | |

### Innehall & Strategi (viktat 25 poang)

| Kriterium | Poang | Max | Kommentar |
|-----------|-------|-----|-----------|
| Bloggartiklar | 0 | 5 | Inga artiklar |
| FAQ-sektioner | 0 | 4 | Innehall forberett men ej publicerat |
| Case studies | 1 | 4 | Galleri finns men utan SEO-text |
| E-E-A-T-signaler | 1 | 4 | Svag Om Oss, saknar certifikat/bakgrund |
| Prisindikationer | 0 | 3 | Saknas helt |
| Videor | 0 | 2 | Saknas |
| Content-diversitet | 1 | 3 | Bara tjanstsidor, inga guider/artiklar/testimonials |
| **Summa** | **3** | **25** | |

### TOTAL POANG: **39/100**

> Obs: Poangen ar lag pa grund av att sajten nyligen lanserats och manga forberedda atgarder (schema, FAQ, meta descriptions) annu ej ar deployade. Med PRIO 1-2 atgarder kan poangen stiga till ~65/100 inom 2-4 veckor.

---

## 8. Forberedda tillgangar (redo att deploya)

Foljande filer ar redan framtagna och väntar pa WP-admin access:

| Fil | Beskrivning | Status |
|-----|-------------|--------|
| `content-pages/wedosigns-schema-muplugin.php` | mu-plugin v1.1 (LocalBusiness + Service 17 sidor + FAQ + OG) | KLAR |
| `content-pages/wedosigns-faq-content.md` | FAQ-innehall for 5 tjanstsidor (25 fragor totalt) | KLAR |
| `content-pages/wedosigns-dekaler-goteborg.md` | Ny sida /dekaler-goteborg/ komplett med SEO | KLAR |
| `docs/wedosigns-fixplan-2026.md` | Komplett fixplan med 13 atgardspunkter + meta descriptions | KLAR |
| `docs/wedosigns-atgardsplan-danni-2026.md` | Kundåtgardsplan baserad pa Dannis feedback | KLAR |

---

## 9. Blockerande forutsattningar

| Behovs | Status | Ansvarig |
|--------|--------|----------|
| WP-admin access | SAKNAS | Danni |
| WP Application Password (for API) | SAKNAS | Danni |
| Hosting-panel (PHP-uppgradering) | SAKNAS | Danni |
| GSC-access (agare/full behorighet) | SAKNAS | Danni → Mikael |
| Google Business Profile (login) | OKANT | Danni |
| Facebook/Instagram/LinkedIn URL:er | SAKNAS | Danni |
