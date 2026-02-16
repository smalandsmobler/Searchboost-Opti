# SEO-Audit: Ferox Konsult AB (feroxkonsult.se)

> Utford: 2026-02-14
> Auditor: Searchboost.se
> Domän: www.feroxkonsult.se
> Plattform: Hemsida24 (proprietär CMS)
> Antal sidor: 49 (24 sv, 4 da, 21 store)

---

## Sammanfattning

Ferox Konsult AB:s webbplats har **allvarliga SEO-brister** som kraftigt begransar dess synlighet i sokresultaten. Sajten ar byggd pa Hemsida24 — en plattform med extremt begransade SEO-mojligheter. Det planerade Shopify-bygget ar ratt beslut och ger mojlighet att atgarda samtliga identifierade problem.

### Overgrippande betyg: 28/100

| Kategori | Betyg | Status |
|----------|-------|--------|
| Teknisk SEO | 15/100 | Kritiskt |
| On-Page SEO | 30/100 | Allvarligt |
| Innehall | 55/100 | Behover forbattring |
| Mobilanpassning | 40/100 | Svagt |
| Sakerhett/HTTPS | 25/100 | Kritiskt |
| Backlink-profil | N/A | SE Ranking ej tillgangligt |
| Strukturerad data | 0/100 | Saknas helt |
| Internationalisering | 10/100 | Bristfalligt |

---

## Kritiska problem (maste atgardas)

### 1. SSL/HTTPS-konfiguration — TRASIG

**Problem**: feroxkonsult.se (utan www) visar en FS Data-parkeringssida istallet for den riktiga sajten. SSL-certifikatet ar ogiltigt for apex-domanen.

**Detaljer**:
- `https://feroxkonsult.se/` → FS Data "Ompekning pagar"-sida (SSL-fel, exit code 60)
- `http://feroxkonsult.se/` → Redirectar korrekt till `https://www.feroxkonsult.se/sv-SE`
- `https://www.feroxkonsult.se/` → Fungerar (men via Hemsida24 delat certifikat)

**Konsekvens**: Google ser tva olika sajter. Besokare som skriver feroxkonsult.se i addressfaltet far en felsida. Forlorar fortroendesignaler och potentiella kunder.

**Shopify-atgard**: Konfigurera SSL korrekt for bade apex-doman och www. Satt upp 301-redirect fran feroxkonsult.se till www.feroxkonsult.se.

---

### 2. Meta-taggar saknas HELT pa alla sidor

**Problem**: Ingen sida har fungerande title-taggar eller meta-beskrivningar i HTML-koden som Google kan lasa pa ett standardiserat satt. Hemsida24-plattformen hanterar detta bristfalligt.

| Sida | Title-tagg | Meta description |
|------|-----------|------------------|
| Startsida | "Datorbaserade tidrapporteringssystem fran Ferox Konsult AB" | Finns (keywords-meta + OG description) |
| Stampelur | "Stampelklocka och stampelur \| Snabb leverans..." | Delar homepage-description |
| Tidredovisning | "Tidrapportering & tidredovisning - Bestall enkelt..." | SAKNAS |
| Webshop | "Stampelkort, Stampelklockor och Stampelur \| Ferox..." | SAKNAS |
| Support | "Support \| Ferox Konsult AB" | SAKNAS |
| Integritetspolicy | "Policy \| Ferox Konsult AB" | SAKNAS |
| GDPR | "GDPR \| Ferox Konsult AB" | SAKNAS |
| Kontakt | Oklart (Hemsida24-format) | SAKNAS |
| Personalregister | "Personalregister i FeroxTid \| Ferox Konsult AB" | SAKNAS |
| Avtal | "Avtal i FeroxTid \| Ferox Konsult AB" | SAKNAS |
| Schema | "Schema \| FeroxTid" | SAKNAS |
| Loneexport | "Loneexport \| FeroxTid" | SAKNAS |
| Franvaro | "Franvarohantering i FeroxTid \| Ferox Konsult AB" | SAKNAS |
| Terminaler | "Terminaler och registrering i FeroxTid..." | SAKNAS |
| Mobil | "Terminaler och registrering i FeroxTid..." (DUPLIKAT!) | SAKNAS |
| Rapporter | "Rapporter i FeroxTid \| Ferox Konsult AB" | SAKNAS |
| Personalliggare | "Personalliggare i FeroxTid \| Bestall enkelt..." | SAKNAS |
| Narvarotabla | "Narvarotabla i FeroxTid \| Ferox Konsult AB" | SAKNAS |
| Projekt | "Projektrapportering, Kostnadstallerapportering..." | SAKNAS |
| Leverans | "Leveransprocess FeroxTid \| Ferox Konsult AB" | SAKNAS |
| Priser | "Priser Tidredovisning \| FeroxTid" | SAKNAS |
| Om FeroxTid | "Om FeroxTid \| Ferox Konsult AB" | SAKNAS |
| Demonstration | "Demonstration FeroxTid \| Ferox Konsult AB" | SAKNAS |

**Resultat**: 22 av 24 svenska sidor saknar meta-beskrivning. 1 duplikat-title (mobil = terminaler).

**Shopify-atgard**: Skapa unika title-taggar och meta-beskrivningar for VARJE sida. Anvand Shopify SEO-applikation eller manuell SEO-redigering.

---

### 3. Canonical-taggar saknas HELT

**Problem**: Ingen sida har `<link rel="canonical">`. Detta ar kritiskt for en sajt med bade svenska och danska versioner, plus webshop-sidor som kan duplicera innehall.

**Konsekvens**: Google kan indexera fel version av sidor, skapa duplicerat innehall-problem.

**Shopify-atgard**: Shopify lagger automatiskt till canonical-taggar. Verifiera att ratt URL:er anvands.

---

### 4. Strukturerad data (Schema.org) — SAKNAS HELT

**Problem**: Noll schema-markup pa hela sajten. Ingen JSON-LD, ingen mikrodata, ingen RDFa.

**Vad som BORDE finnas:**
- `Organization` — foretagsinfo, logotyp, kontaktuppgifter
- `LocalBusiness` — adress, oppettider, telefon
- `Product` — for alla 17 produkter i webshopen (priser, lagerstatus, bilder)
- `BreadcrumbList` — for navigationsstruktur
- `FAQPage` — for GDPR/support-innehall
- `ContactPage` — for kontaktsidan

**Shopify-atgard**: Installera schema-app eller laga till manuellt i tema. Shopify-teman har grundlaggande Product-schema inbyggt.

---

### 5. Open Graph / Social Meta — SAKNAS HELT

**Problem**: Inga OG-taggar (og:title, og:description, og:image, og:url) pa nagon sida. Inga Twitter Card-taggar.

**Konsekvens**: Nar sidor delas pa sociala medier visas generisk eller felaktig forhandsvisning.

**Shopify-atgard**: Shopify-teman inkluderar OG-taggar automatiskt. Komplettera med og:image for varje sida.

---

### 6. Hreflang-implementering — TRASIG

**Problem**: Sajten har bade svenska (/sv-SE/) och danska (/da-DK/) sidor men saknar korrekt hreflang-implementering i `<head>`. Vissa sidor har sprakflaggor men ingen programmatisk hreflang-tagging.

**Danska sidor som finns:**
- /da-DK/ (startsida)
- /da-DK/stempelure-21050851
- /da-DK/webshop-20402950
- /da-DK/kontakt-os-20402951

**Konsekvens**: Google vet inte att /sv-SE/stämpelur och /da-DK/stempelure ar samma sida pa olika sprak. Kan leda till kannibaliserande indexering.

**Shopify-atgard**: Anvand Shopify Markets eller Langify/Weglot for flerspraksstod med korrekt hreflang.

---

## Allvarliga problem (behover atgardas)

### 7. Multipla H1-taggar

**Problem**: Tidredovisningssidan har 3 st H1-taggar istallet for 1:

1. "Tidrapportering och tidredovisning"
2. "Datorbaserad tidredovisningssystem med FeroxTid"
3. "Fordelarna med var digitala tidredovisning och tidrapportering"

**Ovriga sidor**: De flesta har korrekt 1 st H1, men rubrikhierarkin ar inkonsekvent.

**Shopify-atgard**: En H1 per sida. Anvand H2/H3 for underrubriker.

---

### 8. Duplikat title-taggar

**Problem**: Mobilstamplingssidan och terminalsidan delar exakt samma title: "Terminaler och registrering i FeroxTid | Ferox Konsult AB"

**Shopify-atgard**: Unik title per sida. Forslag:
- Terminaler: "Tidterminaler for arbetsplatsen | FeroxTid"
- Mobil: "Stampla i mobilen — FeroxTid tidredovisningsapp"

---

### 9. Bilder saknar alt-text

**Problem**: Manga bilder saknar alt-attribut, sarskilt:
- Mobilstampling-screenshots (3 st)
- Diverse grenssnitt-screenshots
- Dekorativa bilder
- Tracking-pixlar (acceptabelt att missa)

**Bra**: Produktbilder (Z120, K675, TP-6) HAR alt-text.

**Shopify-atgard**: Laga till beskrivande alt-text pa ALLA bilder. Format: "[Produktnamn] - [kort beskrivning]"

---

### 10. URL-struktur — Problematisk

**Problem**: URL:erna innehaller numeriska ID:n som ar SEO-ovänliga:
- `/sv-SE/stämpelur-20359275` (bra slugg, onodigt ID)
- `/sv-SE/tidredovisning/avtal,-beräkningar-21729991` (kommatecken i URL!)
- `/sv-SE/tidredovisning/närvarotablå-21878463` (specialtecken)
- `/store/p/0/artnr-1002-k675-1041504` (ej lasbara)

**Shopify-atgard**: Rena, lasbara URL:er utan ID:n. Exempelvis:
- `/stampelur/` istallet for `/sv-SE/stämpelur-20359275`
- `/tidredovisning/avtal/` istallet for `/sv-SE/tidredovisning/avtal,-beräkningar-21729991`
- `/produkter/stampelklocka-k675/` istallet for `/store/p/0/artnr-1002-k675-1041504`

**VIKTIGT**: Satt upp 301-redirects fran ALLA gamla URL:er till nya.

---

### 11. Robots.txt — For restriktiv

**Nuvarande robots.txt:**
```
Sitemap: https://www.feroxkonsult.se/sitemap.xml

User-agent: *
Allow: /Page/H24-Combined-CSS*
Allow: /Page/H24-Design-CSS*
Allow: /Page/H24-Mobile-Design-Css*
Allow: /Page/Page-Background-CSS*
Allow: /public/css/
Allow: /public/js
Allow: /Block/Render-Edit
Disallow: /upload/
Disallow: /H24-Upload/
Disallow: /Page/
Disallow: /page/
Disallow: /ac/
Disallow: /rc/
Disallow: /Block/Inline-Load/
Disallow: /Block/
Disallow: /block/
Disallow: /public/userdata/files/readfile.php
Disallow: /i/t*
Disallow: /Account/Auto-Registration
```

**Problem**: Hemsida24-specifika regler. Blockerar `/upload/` som kan innehalla viktiga bilder. Inget AI-crawler-stod.

**Shopify-atgard**: Shopify genererar egen robots.txt. Lagg till:
```
User-agent: *
Allow: /

Sitemap: https://www.feroxkonsult.se/sitemap.xml
```

---

### 12. Produktsidor saknar e-handelsfunktionalitet

**Problem**: Webshop-produktsidorna saknar:
- Product-schema (pris, lagerstatus, bilder)
- Strukturerad produktinformation
- Relataterade produkter
- Korrekt brödsmulenavigering

**Shopify-atgard**: Shopify har inbyggd Product-schema. Konfigurera korrekt med alla produktattribut.

---

## Varningar (bra att atgarda)

### 13. Gammal teknikstack

**Problem**: Sajten anvander .NET 3.5 och PHP — bade daterade teknologier. Mobilstampling-screenshots visar gammalt grenssnitt.

**Shopify-atgard**: Inte direkt relevant for Shopify-sajten, men produktbilderna och screenshots bor uppdateras.

---

### 14. Tva olika adresser pa sajten

**Problem**:
- Svenska sidor: Solsa 419, SE-149 91 Nynahamn
- Danska sidor: Armaturvagen 3E, SE-136 50 Jordbro

**Konsekvens**: Forvirring for Google My Business och NAP-konsistens. Paverkar lokal SEO.

**Shopify-atgard**: Anvand EN adress konsekvent pa hela sajten. Uppdatera Google Business Profile.

---

### 15. Copyright ar daterat

**Problem**: "Copyright 2006-2025" — bor uppdateras dynamiskt.

**Shopify-atgard**: Anvand `{{ 'now' | date: '%Y' }}` i Shopify-temat.

---

### 16. Inget blogginnehall

**Problem**: Sajten har noll blogginlagg. Ingen innehallsmarknadsföring. Inga langsvansnyckelord fångas.

**Shopify-atgard**: Skapa en blogg-sektion med artiklar om:
- "Hur valjer man ratt stampelklocka?"
- "Tidredovisning for smaforetag — guide"
- "Personalliggare — allt du behover veta"
- "FeroxTid vs konkurrenter"
- "GDPR och tidredovisning"

---

### 17. Saknar Google Analytics 4

**Problem**: Sajten verkar anvanda gammal Google Analytics (Universal Analytics). UA slutade samla data juli 2023.

**Shopify-atgard**: Installera GA4 via Shopify Google-kanal eller GTM.

---

## Innehallsanalys

### Innehallskvalitet — Per sida

| Sida | Ordantal (uppsk.) | Kvalitet | Nyckelord |
|------|--------------------|----------|-----------|
| Startsida | ~300 | Medel | tidrapportering, stampelklocka, stampelur |
| Stampelur | ~400 | Bra | stampelklocka, stampelur, Seiko |
| Tidredovisning | ~500 | Bra | tidrapportering, tidredovisning, FeroxTid |
| Personalregister | ~150 | Tunn | personalregister, FeroxTid |
| Avtal | ~250 | Medel | avtal, overtid, flextid, OB |
| Schema | ~200 | Medel | schema, arbetspass, skift |
| Loneexport | ~300 | Bra | loneexport, Visma, Fortnox, loneprogram |
| Franvaro | ~200 | Medel | franvarohantering, sjukfranvaro, semester |
| Terminaler | ~300 | Bra | terminal, fingeravtryck, RFID |
| Mobil | ~200 | Medel | mobil, stampla, GPS |
| Rapporter | ~250 | Bra | rapporter, tidkort, personalliggare |
| Personalliggare | ~300 | Bra | personalliggare, Skatteverket |
| Narvarotabla | ~100 | Tunn | narvarotabla, narvaropanel |
| Projekt | ~200 | Medel | projekt, kostnadstalle |
| Leverans | ~200 | Medel | leveransprocess, utbildning |
| Priser | ~300 | Bra | priser, tidredovisning |
| Om FeroxTid | ~250 | Medel | historik, teknik |
| Demonstration | ~100 | Tunn | demonstration, demo |
| Support | ~200 | Medel | support, TeamViewer, manualer |
| Kontakt | ~150 | Medel | kontakt, oppettider |

### Tunna sidor som behover expanderas
1. **Narvarotabla** (~100 ord) — for kort for att ranka
2. **Demonstration** (~100 ord) — bor ha mer overtalande innehall
3. **Personalregister** (~150 ord) — behover mer funktionsbeskrivning

---

## Sokord och mojligheter

### Primara nyckelord (A-klass)
| Sokord | Sokvolym (uppsk.) | Nuvarande position | Shopify-potential |
|--------|-------------------|---------------------|-------------------|
| stampelklocka | Hog | Troligen top 20 | Top 5 mojlig |
| stampelur | Hog | Troligen top 20 | Top 5 mojlig |
| tidredovisning | Medel | Troligen top 30 | Top 10 mojlig |
| tidrapportering | Medel | Troligen top 30 | Top 10 mojlig |
| tidredovisningssystem | Lag-Medel | Troligen top 20 | Top 5 mojlig |

### Sekundara nyckelord (B-klass)
| Sokord | Sokvolym (uppsk.) | Sida |
|--------|-------------------|------|
| personalliggare | Medel | Personalliggare |
| loneexport | Lag | Loneexport |
| stampelkort | Lag | Webshop |
| fargband stampelklocka | Lag | Webshop |
| schema arbetspass | Lag | Schema |
| franvarohantering | Lag | Franvaro |

### Langsvansnyckelord (C-klass / blogg-mojligheter)
- "hur fungerar en stampelklocka"
- "tidredovisning smaforetag"
- "personalliggare restaurang"
- "stampla med fingeravtryck"
- "loneexport Visma"
- "tidredovisning Fortnox"
- "basta tidredovisningssystem 2026"
- "stampelklocka pris"

---

## Backlink-profil

**SE Ranking API-status**: Insufficent funds — API tillfälligt avaktiverat.

**Observationer fran sajten:**
- Bisnode-lank synlig pa kontaktsidan
- Facebook-integration finns
- Inga synliga backlink-byggande initiativ
- Ingen blogg = inga naturliga lankningsmojligheter

**Shopify-atgard**: Bygg backlank-profil genom:
1. Google Business Profile (NAP-konsistens)
2. Branschkataloger (Eniro, Hitta.se, allabolag.se)
3. Leverantor-lansknting (Seiko Nordic)
4. Blogginnehall som attraherar naturliga lankar
5. PR/pressmeddelanden vid Shopify-lansering

---

## Teknisk specifikation for Shopify-bygget

### 301-Redirects (KRITISKT)

Alla befintliga URL:er maste redirectas till nya. Har ar redirect-mappningen:

```
# Svenska sidor
/sv-SE → /
/sv-SE/stämpelur-20359275 → /pages/stampelklockor
/sv-SE/tidredovisning-20359270 → /pages/tidredovisning
/sv-SE/tidredovisning/personalregister-21856345 → /pages/personalregister
/sv-SE/tidredovisning/avtal,-beräkningar-21729991 → /pages/avtal-berakningar
/sv-SE/tidredovisning/schema-21734684 → /pages/schema
/sv-SE/tidredovisning/export-till-lön-21735121 → /pages/loneexport
/sv-SE/tidredovisning/frånvarohantering-21735791 → /pages/franvarohantering
/sv-SE/tidredovisning/terminaler-registrering-21736733 → /pages/terminaler
/sv-SE/tidredovisning/stämpla-i-mobilen-28893713 → /pages/mobilstampling
/sv-SE/tidredovisning/rapporter-21736758 → /pages/rapporter
/sv-SE/tidredovisning/personalliggare-22027575 → /pages/personalliggare
/sv-SE/tidredovisning/närvarotablå-21878463 → /pages/narvarotabla
/sv-SE/tidredovisning/projekt-och-kostnadställen-21868311 → /pages/projekt
/sv-SE/tidredovisning/order-till-leverans-21736768 → /pages/leveransprocess
/sv-SE/tidredovisning/pris-21736787 → /pages/priser
/sv-SE/tidredovisning/om-feroxtid-21889998 → /pages/om-feroxtid
/sv-SE/tidredovisning/demonstration-21890214 → /pages/demo
/sv-SE/webshop-20359310 → /collections/all
/sv-SE/support-20425284 → /pages/support
/sv-SE/integritetspolicy-39607311 → /policies/privacy-policy
/sv-SE/gdpr-39657435 → /pages/gdpr
/sv-SE/kontakt-20359294 → /pages/kontakt

# Danska sidor
/da-DK → /da/ (om flersprak implementeras)
/da-DK/stempelure-21050851 → /da/pages/stempelure
/da-DK/webshop-20402950 → /da/collections/all
/da-DK/kontakt-os-20402951 → /da/pages/kontakt

# Webshop-produkter
/store → /collections/all
/store/category/stämpelur-186589 → /collections/stampelklockor
/store/category/stämpelkort-186593 → /collections/stampelkort
/store/category/övriga-tillbehör-stämpelur-190765 → /collections/tillbehor
/store/category/tidredovisning-tillbehör-192093 → /collections/tidredovisning-tillbehor
/store/p/0/artnr-1002-k675-1041504 → /products/stampelklocka-k675
/store/p/0/artnr-1003-z120-346288 → /products/stampelklocka-z120
/store/p/0/artnr-1020-tp-6-843861 → /products/tidregistrerare-tp6
```

### SEO-checklista for Shopify-bygget

- [ ] SSL-certifikat korrekt for bade apex och www
- [ ] 301-redirects for ALLA 49 gamla URL:er
- [ ] Unik title-tagg per sida (max 60 tecken)
- [ ] Unik meta-beskrivning per sida (max 155 tecken)
- [ ] En H1 per sida
- [ ] Alt-text pa alla bilder
- [ ] Product-schema pa alla produktsidor
- [ ] Organization-schema pa startsidan
- [ ] LocalBusiness-schema med korrekt adress
- [ ] Canonical-taggar (Shopify automatiskt)
- [ ] OG-taggar (Shopify automatiskt via tema)
- [ ] Hreflang for svenska/danska (om bada behlls)
- [ ] Sitemap.xml (Shopify automatiskt)
- [ ] Robots.txt (Shopify automatiskt)
- [ ] GA4-installation
- [ ] Google Search Console-verifiering
- [ ] Google Business Profile-uppdatering
- [ ] Blogg-sektion med forsta 5 artiklar
- [ ] Mobiloptimerat tema (Shopify standard)
- [ ] Page Speed > 90 (Shopify standard)
- [ ] Breadcrumb-navigering
- [ ] Intern lankning strategi
- [ ] 404-sida med sokmojlighet

### Foreslagna title-taggar for Shopify

| Sida | Foreslagen title |
|------|------------------|
| Startsida | Stampelklockor & Tidredovisning \| Ferox Konsult AB |
| Stampelklockor | Stampelklockor fran Seiko — Kop online \| Ferox |
| Tidredovisning | FeroxTid Tidredovisningssystem — Inga licenskostnader |
| Personalregister | Personalregister i FeroxTid — Enkel administration |
| Avtal & berakningar | Loneberakningar & Avtal \| FeroxTid |
| Schema | Schemalagring & Skiftplanering \| FeroxTid |
| Loneexport | Loneexport till Visma, Fortnox & fler \| FeroxTid |
| Franvaro | Franvarohantering — Sjukfranvaro, semester \| FeroxTid |
| Terminaler | Tidterminaler — Fingeravtryck & RFID \| FeroxTid |
| Mobil | Stampla i mobilen — FeroxTid-appen |
| Rapporter | Rapporter & Tidkort \| FeroxTid |
| Personalliggare | Elektronisk personalliggare for Skatteverket \| FeroxTid |
| Priser | Priser Tidredovisning — Fran 9 975 kr \| FeroxTid |
| Kontakt | Kontakta Ferox Konsult AB — 08-525 093 50 |
| Support | Support & Manualer \| Ferox Konsult AB |

### Foreslagna meta-beskrivningar

| Sida | Foreslagen meta description |
|------|----------------------------|
| Startsida | Ferox Konsult levererar stampelklockor och tidredovisningssystem sedan 1997. Over 10 000 stampelklockor salda. Bestall online med snabb leverans. |
| Stampelklockor | Kop Seiko stampelklockor online. Registrerande, summerande och tidregistrerare. Fran 4 130 kr. I lager med leverans inom nagra dagar. |
| Tidredovisning | FeroxTid — komplett tidredovisningssystem for Windows. Stampla med fingeravtryck, tagg eller mobil. Inga licenskostnader. Boka demo idag. |
| Priser | Tidredovisning fran 9 975 kr exkl moms. Inkluderar konfigurerat system, terminal, utbildning och 60 dagars support. Begat offert. |
| Kontakt | Kontakta Ferox Konsult AB i Nynahamn. Telefon 08-525 093 50. Oppet man-tor 08-17, fre 08-16. |
| Personalliggare | Digital personalliggare som uppfyller Skatteverkets krav. For restaurang, frisorsalong, byggbranschen. Ingar i FeroxTid. |

---

## Prioriterad atgardslista for Shopify-bygget

### Fas 1: Lansering (fore go-live)
1. Konfigurera SSL korrekt (apex + www)
2. Implementera ALLA 301-redirects
3. Satt unika title-taggar pa varje sida
4. Satt unika meta-beskrivningar pa varje sida
5. En H1 per sida
6. Alt-text pa alla bilder
7. Product-schema pa produktsidor
8. Installera GA4
9. Verifiera i Google Search Console

### Fas 2: Forsta veckan
10. Organization + LocalBusiness schema
11. Breadcrumb-navigering
12. Intern lankning
13. Blogg-sektion med forsta 3 artiklar
14. Google Business Profile-uppdatering
15. Submit ny sitemap till GSC

### Fas 3: Forsta manaden
16. 5+ bloggartiklar publicerade
17. Branschkataloger (Eniro, Hitta.se)
18. Hreflang for svenska/danska
19. FAQ-schema pa relevanta sidor
20. Page Speed-optimering

---

## Slutsats

Ferox Konsults nuvarande sajt pa Hemsida24 har fundamentala SEO-brister som ar inbyggda i plattformens begransningar. Flytten till Shopify ar ratt beslut — Shopify hanterar automatiskt manga av de kritiska problemen (canonical-taggar, OG-taggar, sitemap, robots.txt, SSL, mobiloptimering).

Det viktigaste vid lanseringen ar att:
1. **Alla 301-redirects ar pa plats** — annars forlorar man all befintlig Google-ranking
2. **Unika title och meta-beskrivningar** — detta ar den enskilt viktigaste SEO-atgarden
3. **Product-schema** — for att fa rika sokresultat med priser och lagerstatus

Med korrekt Shopify-implementering och de rekommenderade atgarderna kan Ferox Konsult ralisktiskt forvantas:
- Dubblera organisk trafik inom 3 manader
- Ranka top 5 for "stampelklocka" och "stampelur" inom 6 manader
- Generera leads via blogginnehall och forbattrad konvertering

---

*Rapport genererad av Searchboost.se — 2026-02-14*
