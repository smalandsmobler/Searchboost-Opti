# SEO-Audit: Ferox Konsult AB (feroxkonsult.se)

> Utford: 2026-03-03 (uppdaterad)
> Auditor: Searchboost.se
> Doman: www.feroxkonsult.se
> Plattform: Hemsida24 (proprietar CMS) -- planerad migration till Shopify
> Antal sidor: 49 (24 sv, 4 da, 21 store)

---

## Sammanfattning

Ferox Konsult AB:s webbplats har **allvarliga SEO-brister** som kraftigt begransar dess synlighet i sokresultaten. Sajten ar byggd pa Hemsida24 -- en plattform med extremt begransade SEO-mojligheter och proprietar teknikstack. Planerad Shopify-migration ger mojlighet att atgarda samtliga identifierade problem fran grunden.

Ferox Konsult AB ar ett Nynashamn-baserat foretag grundat 1997 som levererar Seiko stampelklockor (exklusiv aterforhandlare i Norden) och det egenutvecklade tidredovisningssystemet FeroxTid. Over 10 000 stampelklockor salda och 1 200+ FeroxTid-installationer.

### Overgrippande betyg: 28/100

| Kategori | Betyg | Status |
|----------|-------|--------|
| Teknisk SEO | 15/100 | KRITISKT |
| On-Page SEO | 30/100 | Allvarligt |
| Innehall & Struktur | 55/100 | Behover forbattring |
| Mobilanpassning | 40/100 | Svagt |
| Sakerhet/HTTPS | 25/100 | KRITISKT |
| Backlink-profil | N/A | Ej tillgangligt (SE Ranking nere) |
| Strukturerad data | 0/100 | Saknas helt |
| Internationalisering | 10/100 | Bristfalligt |

---

## 1. Teknisk SEO (15/100) -- KRITISKT

### 1.1 SSL/HTTPS-konfiguration -- TRASIG

**Problem**: Apex-domanen `feroxkonsult.se` (utan www) har ogiltigt SSL-certifikat (`ERR_TLS_CERT_ALTNAME_INVALID`). Visar en FS Data-parkeringssida istallet for den riktiga sajten.

**Detaljer**:
- `https://feroxkonsult.se/` -- FS Data "Ompekning pagar"-sida (SSL-fel)
- `http://feroxkonsult.se/` -- Redirectar korrekt till `https://www.feroxkonsult.se/sv-SE`
- `https://www.feroxkonsult.se/` -- Fungerar (via Hemsida24 delat certifikat)

**Konsekvens**: Google ser tva olika sajter. Besokare som skriver `feroxkonsult.se` i adressfaltet far en felsida. Forlorar fortroendesignaler och potentiella kunder.

**Atgard (Shopify)**: Konfigurera SSL korrekt for bade apex och www. Satt upp 301-redirect fran `feroxkonsult.se` till `www.feroxkonsult.se` (eller tvartom).

### 1.2 Canonical-taggar -- SAKNAS HELT

**Problem**: Ingen sida har `<link rel="canonical">`. Kritiskt for en sajt med bade svenska (/sv-SE/) och danska (/da-DK/) versioner, plus webshop-sidor med potentiellt duplicerat innehall.

**Konsekvens**: Google kan indexera fel version av sidor, skapar duplicate content-problem.

**Atgard (Shopify)**: Shopify lagger automatiskt till canonical-taggar. Verifiera att ratt URL:er anvands efter migration.

### 1.3 Robots.txt -- For restriktiv (Hemsida24-specifik)

**Nuvarande robots.txt** innehaller Hemsida24-specifika regler som blockerar `/upload/`, `/Page/`, `/Block/` med mera. Blockerar potentiellt viktiga bilder och resurser.

**Atgard (Shopify)**: Shopify genererar standard robots.txt. Lagg till sitemap-referens:
```
User-agent: *
Disallow: /checkout
Disallow: /cart
Sitemap: https://feroxkonsult.se/sitemap.xml
```

### 1.4 URL-struktur -- Problematisk

**Problem**: URL:erna innehaller numeriska ID:n och specialtecken:
- `/sv-SE/stampelur-20359275` (onodigt ID)
- `/sv-SE/tidredovisning/avtal,-berakningar-21729991` (kommatecken!)
- `/sv-SE/tidredovisning/narvarotabla-21878463` (specialtecken)
- `/store/p/0/artnr-1002-k675-1041504` (ej lasbara)

**Atgard (Shopify)**: Rena, lasbara URL:er. Exempelvis:
- `/pages/stampelklockor` istallet for `/sv-SE/stampelur-20359275`
- `/pages/tidredovisning` istallet for `/sv-SE/tidredovisning-20359270`
- `/products/stampelklocka-k675` istallet for `/store/p/0/artnr-1002-k675-1041504`

**KRITISKT**: 301-redirects fran ALLA ~45 gamla URL:er till nya maste sattas upp fore lansering.

### 1.5 Sitemap

**Nuvarande sitemap**: 49 URL:er i `/sitemap.xml`. Genereras av Hemsida24.

**Atgard (Shopify)**: Shopify genererar automatiskt sitemap. Skicka ny sitemap till Google Search Console efter lansering.

### 1.6 Sidladdningstid

**Problem**: Hemsida24:s proprietara CMS lagger till overhead med egna CSS/JS-filer (`H24-Combined-CSS`, `H24-Design-CSS`), CloudFront CDN-lager och PHP-backend.

**Atgard (Shopify)**: Shopify-teman ar optimerade for hastighet. Valj ett latt tema (Dawn eller liknande). Mal: PageSpeed > 90.

---

## 2. On-Page SEO (30/100) -- Allvarligt

### 2.1 Title-taggar -- Bristfalliga

**Problem**: De flesta title-taggar ar generiska eller saknar nyckelord. 1 duplikat (Mobil = Terminaler).

| Sida | Nuvarande title | Bedomning |
|------|----------------|-----------|
| Startsida | "Datorbaserade tidrapporteringssystem fran Ferox Konsult AB" | For lang, svagt nyckelord |
| Stampelur | "Stampelklocka och stampelur \| Snabb leverans..." | OK men kan forbattras |
| Tidredovisning | "Tidrapportering & tidredovisning - Bestall enkelt..." | Bra nyckelord |
| Mobil | "Terminaler och registrering i FeroxTid..." | DUPLIKAT med Terminaler-sidan! |
| Priser | "Priser Tidredovisning \| FeroxTid" | OK men saknar CTA |
| Support | "Support \| Ferox Konsult AB" | For generiskt |
| Kontakt | Oklart (Hemsida24-format) | Saknar telefonnummer |
| 16 undersidor | "[Funktionsnamn] \| Ferox Konsult AB" | For generiska |

**Atgard**: Unika, nyckelordsrika title-taggar pa varje sida (max 60 tecken). Se rekommendationer i separat SEO-metadata-dokument.

### 2.2 Meta-beskrivningar -- SAKNAS pa 22 av 24 sidor

**Problem**: Bara startsidan och stampelur-sidan har meta-beskrivningar. Alla ovriga 22 svenska sidor saknar helt.

**Konsekvens**: Google genererar egna snippets fran sidinnehallet -- ofta irrelevanta och icke-overtalande.

**Atgard**: Unika meta-beskrivningar (max 155 tecken) med nyckelord och CTA pa varje sida.

### 2.3 H1-taggar -- Inkonsekvent

**Problem**:
- Tidredovisningssidan har **3 st H1** istallet for 1
- Rubrikhierarkin ar inkonsekvent pa flera sidor
- Kontaktsidan har H1: "Kontakta mig!" (bor vara "Kontakta oss")

**Atgard**: En H1 per sida med primara nyckelord. H2/H3 for underrubriker.

### 2.4 Bilder -- Manga saknar alt-text

**Problem**: Manga bilder saknar alt-attribut:
- Mobilstampling-screenshots (3 st) -- SAKNAR alt-text
- Diverse interface-screenshots -- SAKNAR alt-text
- Dekorativa bilder -- SAKNAR alt-text
- Tracking-pixlar -- acceptabelt

**Bra**: Produktbilder (Z120, K675, TP-6) HAR alt-text.

**Atgard**: Beskrivande alt-text pa ALLA bilder. Format: `[Produktnamn] - [kort beskrivning] | Ferox Konsult`

---

## 3. Strukturerad data (0/100) -- SAKNAS HELT

**Problem**: Noll schema-markup pa hela sajten. Ingen JSON-LD, ingen mikrodata, ingen RDFa.

**Vad som borde finnas:**
- `Organization` -- foretagsinfo, logotyp, kontaktuppgifter
- `LocalBusiness` -- adress, oppettider, telefon
- `Product` -- for alla 17 produkter (priser, lagerstatus)
- `SoftwareApplication` -- for FeroxTid
- `BreadcrumbList` -- navigationsstruktur
- `FAQPage` -- for GDPR/support-innehall
- `ContactPage` -- kontaktsidan

**Atgard (Shopify)**: Installera schema-app eller lagg till JSON-LD manuellt i tema. Shopify-teman har grundlaggande Product-schema inbyggt.

---

## 4. Innehall & Struktur (55/100)

### 4.1 Innehallskvalitet per sida

| Sida | Ordantal (uppsk.) | Kvalitet | Status |
|------|--------------------|----------|--------|
| Startsida | ~300 | Medel | Behover utbyggnad |
| Stampelur | ~400 | Bra | OK |
| Tidredovisning | ~500 | Bra | OK (fixa H1) |
| Personalregister | ~150 | Tunn | BEHOVER UTBYGGNAD |
| Avtal & berakningar | ~250 | Medel | OK |
| Schema | ~200 | Medel | OK |
| Loneexport | ~300 | Bra | Bra loneprogramlista |
| Franvaro | ~200 | Medel | OK |
| Terminaler | ~300 | Bra | OK |
| Mobil | ~200 | Medel | OK |
| Rapporter | ~250 | Bra | OK |
| Personalliggare | ~300 | Bra | Bra branschriktning |
| Narvarotabla | ~100 | TUNN | BEHOVER UTBYGGNAD |
| Projekt | ~200 | Medel | OK |
| Leveransprocess | ~200 | Medel | OK |
| Priser | ~300 | Bra | OK |
| Om FeroxTid | ~250 | Medel | OK |
| Demonstration | ~100 | TUNN | BEHOVER UTBYGGNAD |
| Support | ~200 | Medel | OK |
| Kontakt | ~150 | Medel | OK |

### 4.2 Tunna sidor som maste expanderas

1. **Narvarotabla** (~100 ord) -- for kort for att ranka. Behover 300+ ord.
2. **Demonstration** (~100 ord) -- bor ha mer overtalande innehall, case studies, FAQ.
3. **Personalregister** (~150 ord) -- behover funktionsbeskrivning, screenshots.

### 4.3 Blogg -- SAKNAS HELT

**Problem**: Noll blogginlagg. Ingen innehallsmarknadsforinge. Inga langsvansnyckelord fangas.

**Atgard**: Skapa blogg-sektion med artiklar som riktar sig mot informationssokningar:
- "Hur valjer man ratt stampelklocka?"
- "Tidredovisning for smaforetag -- guide"
- "Personalliggare -- allt du behover veta"
- "GDPR och tidredovisning"
- "Exportera tid till Visma, Fortnox & fler loneprogram"

---

## 5. Mobilanpassning (40/100) -- Svagt

**Problem**: Hemsida24-sajten anvander responsiv design men implementationen ar svag:
- Mobilstampling-screenshots visar gammalt grenssnitt
- Ingen dedikerad mobiloptimering
- Hemsida24:s mobilhantering ar generisk

**Atgard (Shopify)**: Shopify-teman ar mobil-forst-designade. Valj ett modernt tema.

---

## 6. Sakerhet/HTTPS (25/100) -- KRITISKT

**Problem**:
- SSL-certifikat ogiltigt for apex-doman (se 1.1)
- Hemsida24 anvander delat certifikat
- Gammal teknikstack (.NET 3.5, PHP)
- reCAPTCHA och Google Analytics-pixlar aktiva

**Atgard (Shopify)**: Shopify inkluderar gratis SSL. Konfigurera korrekt for bade apex och www.

---

## 7. Internationalisering (10/100) -- Bristfalligt

### 7.1 Hreflang -- TRASIG

**Problem**: Sajten har svenska (/sv-SE/) och danska (/da-DK/) sidor men saknar korrekt hreflang-implementering i `<head>`.

**Danska sidor (4 st):**
- /da-DK/ (startsida)
- /da-DK/stempelure-21050851
- /da-DK/webshop-20402950
- /da-DK/kontakt-os-20402951

**Konsekvens**: Google vet inte att /sv-SE/stampelur och /da-DK/stempelure ar samma sida pa olika sprak.

### 7.2 Tva olika adresser

**Problem**: Svenska sidor visar Solsa 419, Nynahamn. Danska sidor visar Armaturvagen 3E, Jordbro (gammal adress).

**Konsekvens**: Forvirring for Google Business Profile och NAP-konsistens. Paverkar lokal SEO.

**Atgard (Shopify)**: I Shopify-bygget ar beslut taget att INTE bygga danska sidor. Danska URL:er redirectas till startsidan. Konsekvent adress (Solsa 419, Nynahamn) pa hela sajten.

---

## 8. Open Graph / Social Meta -- SAKNAS HELT

**Problem**: Inga OG-taggar (og:title, og:description, og:image, og:url) pa nagon sida. Inga Twitter Card-taggar.

**Konsekvens**: Delade lankar pa sociala medier visar generisk eller felaktig forhandsvisning.

**Atgard (Shopify)**: Shopify-teman inkluderar OG-taggar automatiskt. Satt og:image for varje sida.

---

## 9. Backlink-profil (N/A)

**Status**: SE Ranking API otillganglig (insufficient funds). Ingen fullstandig backlank-analys mojlig.

**Observationer fran sajten:**
- Bisnode-lank synlig pa kontaktsidan
- Facebook-integration finns
- Inga synliga backlink-byggande initiativ
- Ingen blogg = inga naturliga lankningsmojligheter

**Atgard**: Bygg backlink-profil genom:
1. Google Business Profile (NAP-konsistens)
2. Branschkataloger (Eniro, Hitta.se, Allabolag.se)
3. Leverantorlankning (Seiko Nordic)
4. Innehallsmarknadsforinge via blogg
5. PR/pressmeddelanden vid Shopify-lansering

---

## 10. E-handel & Produktsidor

### 10.1 Produktschema -- SAKNAS

**Problem**: Webshop-produktsidorna saknar Product-schema (pris, lagerstatus, SKU, bilder). Inga rika sokresultat mojliga.

### 10.2 Produktdata

**17 produkter** totalt:
- 3 stampelklockor (Z120, K675, TP-6)
- 3 stampelkort (100 st forpackningar)
- 7 tillbehor (fargband, nycklar, kortfack)
- 4 tidredovisning (RFID-tagg, extra anstallda, utbildning, support)

**Lagerstatusar**: 15 av 17 i lager. 2 ej i lager (Fargband K675, RFID-tagg).

**Priser**: B2B (exkl moms). Fran 32 kr (RFID-tagg) till 4 655 kr (K675).

### 10.3 Breadcrumbs -- SAKNAS

Ingen brodsmulenavigering pa nagon sida.

**Atgard (Shopify)**: Implementera breadcrumbs med BreadcrumbList-schema.

---

## 11. Konkurrenslandskap

### Primara konkurrenter (stampelklockor)
| Konkurrent | Domaan | Styrkor |
|------------|--------|---------|
| stempelur.se | stempelur.se | Nischad, starkt domannamn |
| Tidregistrering.se | tidregistrering.se | Bred produktportfolj |
| Gunnebo/Byggteknik | - | Stort varumårke, B2B |

### Primara konkurrenter (tidredovisning)
| Konkurrent | Domaan | Styrkor |
|------------|--------|---------|
| Flex HRM | flexhrm.se | Stort, modernt, cloud-baserat |
| Planday | planday.com/se | Internationellt, SaaS |
| Timeplan | timeplan.se | Svenskt, etablerat |
| TimeCare | timecare.se | Sjukvardsfokus |

### Ferox Konsults styrkor (USP:ar)
1. **Inga licenskostnader** -- betala en gang, aga for alltid
2. **10 000+ stampelklockor salda** -- etablerat foretag sedan 1997
3. **Exklusiv Seiko-aterforhandlare** i Norden
4. **18+ loneintegrationer** (Visma, Fortnox, AGDA, Hogia m.fl.)
5. **Komplett losning** -- bade hardware (stampelklockor, terminaler) och mjukvara (FeroxTid)

---

## 12. Google Search Console & Analytics

### GSC-status
- **SA**: Ej tillagd i GSC (ferox-kunden ar "Ej aktiv" i Searchboost-systemet)
- **Atgard**: Lagg till SA efter Shopify-lansering

### Google Analytics
- **Nuvarande**: Gammal Universal Analytics (slutade samla data juli 2023)
- **Atgard**: Installera GA4 via Shopify Google-kanal eller GTM

---

## 13. Prioriterad atgardslista for Shopify-migrationen

### Fas 1: Fore lansering (KRITISKT)
1. Konfigurera SSL korrekt (apex + www)
2. Implementera ALLA ~45 st 301-redirects
3. Satt unika title-taggar pa varje sida (max 60 tecken)
4. Satt unika meta-beskrivningar pa varje sida (max 155 tecken)
5. En H1 per sida med primara nyckelord
6. Alt-text pa alla bilder
7. Product-schema pa produktsidor (Shopify-tema)
8. Installera GA4
9. Verifiera i Google Search Console
10. Skicka ny sitemap

### Fas 2: Forsta veckan efter lansering
11. Organization + LocalBusiness JSON-LD schema
12. SoftwareApplication schema for FeroxTid
13. Breadcrumb-navigering
14. Intern lankning strategi
15. Google Business Profile -- uppdatera URL och adress
16. Branschkataloger (Eniro, Hitta.se)

### Fas 3: Forsta manaden
17. Publicera 3-5 bloggartiklar
18. FAQ-schema pa relevanta sidor
19. PageSpeed-optimering (mal > 90)
20. Kontrollera indexeringsstatus i GSC
21. Korrigera eventuella crawl-errors
22. Satt upp Searchboost automatisk optimering

---

## Slutsats

Ferox Konsults nuvarande sajt pa Hemsida24 har fundamentala SEO-brister som ar inbyggda i plattformens begransningar. De mest kritiska problemen:

1. **Trasigt SSL** pa apex-doman -- besokare far felsida
2. **22 av 24 sidor saknar meta-beskrivning** -- Google genererar daliga snippets
3. **Noll strukturerad data** -- inga rika sokresultat
4. **Trasig hreflang** -- forvirrar Google med sprakversioner
5. **Ingen blogg** -- missar langsvansnyckelord och naturliga lankar

Shopify-migrationen ar ratt beslut. Med korrekt implementering (301-redirects, SEO-metadata, schema-markup, blogg) kan Ferox Konsult realistiskt forvanta sig:
- **Dubblad organisk trafik** inom 3 manader
- **Top 5-positioner** for "stampelklocka" och "stampelur" inom 6 manader
- **Leads via blogginnehall** och forbattrad konverteringsoptimering

---

*Rapport genererad av Searchboost.se -- 2026-03-03*
