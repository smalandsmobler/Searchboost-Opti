# SEO-Audit: Traficator.se

> **Datum:** 2026-03-03
> **Utfort av:** Searchboost.se
> **Sajt:** https://traficator.se
> **CMS:** WordPress 6.9.1 med Flatsome-tema (child theme)
> **SEO-plugin:** Rank Math SEO Pro
> **Caching:** LiteSpeed Cache (LiteSpeed-server)
> **Flersprakig:** Polylang (Svenska + Engelska)

---

## Sammanfattning

Traficator.se ar en B2B-sajt for material sourcing av metallprodukter (gjutgods, bearbetning, stalkonstruktioner). Sajten har nyligen byggts om med kategorisidor under /vara-tjanster/, men lider av flera SEO-problem som haller tillbaka den organiska tillvaxten. De mest kritiska problemen ar: en testsida som indexeras av Google, felaktiga meta-beskrivningar pa majoriteten av sidorna, avsaknad av strukturerad data (LocalBusiness, Service, FAQPage), och tunt innehall pa tjanstesidorna. Tekniskt ar sajten snabb tack vare LiteSpeed-cache och HTTP/2, men det finns sakerhetsproblem (exponerade anvandarnamn, oppen xmlrpc.php, dubbla GTM-containrar). Med ratt atgarder kan sajten na forstasidan for nyckelord som "material sourcing", "gjutgods leverantor" och "CNC-bearbetning leverantor" inom 3-6 manader.

**Totalt SEO-betyg: 42/100**

---

## 1. Teknisk SEO (16/25 poang)

### 1.1 Server och Prestanda

| Parameter | Status | Poang |
|-----------|--------|-------|
| HTTPS/SSL | OK -- SSL aktivt | 2/2 |
| HTTP/2 + HTTP/3 (QUIC) | OK -- H2 + H3 via LiteSpeed | 2/2 |
| Server | LiteSpeed -- snabb och bra for WordPress | 2/2 |
| LiteSpeed Cache | OK -- Cache-hit bekraftat i headers | 2/2 |
| Gzip/Brotli-komprimering | OK -- LiteSpeed hanterar automatiskt | 1/1 |
| Lazy loading | OK -- data-lazyloaded pa bilder | 1/1 |
| Lokala fonter | OK -- Lato + Dancing Script serveras lokalt | 1/1 |
| Favicon | OK -- alla storlekar | 1/1 |
| PHP-version | 8.1.34 -- Fungerar men 8.2/8.3 rekommenderas | 1/2 |
| JS-optimering | Delvis -- Flatsome-JS prefetchas men kan forbattras | 1/2 |

**Server-betyg: 14/16** -- Bra grundprestanda tack vare LiteSpeed.

### 1.2 Indexering och Crawlbarhet

| Parameter | Status | Problem |
|-----------|--------|---------|
| robots.txt | Standard WP-config | Saknar block for /author/, /_test-2/ |
| Sitemap | Rank Math-genererad, 4 sub-sitemaps | Testsida i sitemap, EN/SV blandat |
| Canonical-taggar | Felaktigt pa /en/ | /en/ canonical pekar pa rotdomanen |
| Hreflang | Finns men ofullstandig | Saknar x-default, inte alla sidor har EN-version |
| Indexerade sidor | ~20 st | Testsida indexeras felaktigt |

**Indexerings-problem:**
- `/_test-2/` har `index, follow` och finns i sitemap -- KRITISKT
- Engelska startsidan `/en/` har felaktig canonical som pekar pa `https://traficator.se/` istallet for `/en/`
- Saknar `hreflang="x-default"` pa alla sidor
- Flera engelska undersidor saknas (bearbetning, ovrigt etc.)

### 1.3 Sakerhet

| Parameter | Status | Allvarlighet |
|-----------|--------|-------------|
| xmlrpc.php | OPPEN | Medel -- sakerhetssarbarhhet, bor stangas |
| WP REST API | OPPEN | Lag -- /wp-json/ exponerad |
| Forfattararkiv | OPPNA | Medel -- /author/admin-dev/ exponerar anvandarnamn |
| WordPress-version | Exponerad | Lag -- meta generator visar WP 6.9.1 |
| GTM-containrar | 2 stycken! | Hog -- GTM-KRTLTBXM + GTM-TT4X9H5M skapar konflikter |
| Site Kit version | Exponerad | Lag -- meta generator visar version |

---

## 2. On-Page SEO (10/25 poang)

### 2.1 Meta-taggar -- Kritisk brist

| Sida | Title | Meta Description | Bedomning |
|------|-------|------------------|-----------|
| Startsidan `/` | "Traficator -- Material sourcing av metallprodukter" | "Traficator erbjuder material sourcing och levererar gjutgods..." | OK men kan optimeras |
| Vara tjanster `/vara-tjanster/` | "Vara tjanster - Traficator International AB" | **"PROCESSEN"** | KRITISKT -- helt felaktig |
| Gjutning `/vara-tjanster/gjutning/` | "GJUTNING - Traficator International AB" | Avklippt mitt i mening | Dalig -- VERSALER + avklippt |
| Bearbetning `/vara-tjanster/bearbetning/` | "BEARBETNING - Traficator International AB" | Avklippt + stavfel "maskinbearbeting" | Dalig -- fel + avklippt |
| Processen `/vara-tjanster/processen/` | "PROCESSEN - Traficator International AB" | Avklippt mitt i mening | Dalig -- icke-beskrivande |
| Ovrigt `/vara-tjanster/ovrigt/` | "OVRIGT - Traficator International AB" | Avklippt mitt i mening | Dalig -- noll SEO-varde |
| FAQ `/vara-tjanster/faq/` | "FAQ Fragor - Traficator International AB" | Hyfsad | OK men redundant titel |
| Vi pa Traficator `/vi-pa-traficator/` | "Vi pa Traficator - Traficator International AB" | Avklippt | Medel |
| Kontakt `/kontakt/` | "Kontakt - Traficator International AB" | Bara adress/telefon | Dalig -- inte optimerad |
| _TEST `/_test-2/` | "_TEST - Traficator International AB" | SAKNAS | KRITISKT -- ska inte indexeras |

**Resultat:** 7 av 10 sidor har felaktiga eller avklippta meta-beskrivningar. Bara 1 sida (startsidan) har en acceptabel meta-beskrivning.

### 2.2 H1-taggar

| Sida | Nuvarande H1 | Problem |
|------|--------------|---------|
| Startsidan | "Global sourcing av metallprodukter" | OK |
| Vara tjanster | "Vi har genom aren etablerat nara och goda kontakter med vara producenter." | FOR LANG -- en H1 ska vara kort |
| Gjutning | "GJUTNING" | For generisk, saknar nyckelord |
| Bearbetning | "BEARBETNING" | For generisk, saknar nyckelord |
| Processen | "PROCESSEN" | Icke-beskrivande |
| Ovrigt | "OVRIGT" | Noll SEO-varde |
| FAQ | "FAQ" | Kan vara battre |
| Vi pa Traficator | "Vi brinner for att hitta leverantorslosningar for vara kunder." | FOR LANG |
| Kontakt | "KONTAKTPERSONER" | OK men dubbla H1:or |

### 2.3 Innehallskvalitet

| Sida | Uppskattade ord | Bedomning |
|------|-----------------|-----------|
| Startsidan | ~200 | Tunt -- saknar mer textinnehall efter hero |
| Gjutning | ~800-1000 | Hyfsad -- men kan utvidgas |
| Bearbetning | ~800-900 | Hyfsad -- men kan utvidgas |
| Processen | ~300 | Tunt |
| Ovrigt | ~200 | Mycket tunt |
| FAQ | ~400 | Medel |
| Vi pa Traficator | ~300 | Tunt |
| Kontakt | ~150 | Minimalt |

**Totalt:** De flesta tjanstesidorna har under 500 ord, vilket ar otillrackligt for att ranka pa konkurrenskraftiga B2B-sokord.

### 2.4 Bilder

- Flera bilder saknar alt-text (placeholder SVG:er pa gjutningssidan)
- OG-bild pa de flesta sidor: `dummy-1.jpg` (400x260px) -- en platshallarbild
- Tjuanstesidor saknar OG-bild helt
- Facebook rekommenderar 1200x630px -- nuvarande bild ar for liten

---

## 3. Strukturerad Data (2/15 poang)

### 3.1 Befintlig schema-markering

| Schema-typ | Status | Problem |
|------------|--------|---------|
| Organization | Finns men ofullstandig | Saknar logo, adress, telefon, kontaktpunkt |
| WebSite + SearchAction | OK | Fungerar korrekt |
| WebPage | OK | Standard |
| Article | FELAKTIG | Startsidan och tjanstesidor har Article-schema (ska vara WebPage) |
| Person | SAKERHETSPROBLEM | Exponerar "admin-dev" och "admin" |

### 3.2 Schema som SAKNAS helt

| Schema-typ | Var det behovs | Vikt |
|------------|---------------|------|
| LocalBusiness | Startsidan + kontaktsidan | KRITISK -- noddvandigt for lokal SEO |
| Service | Varje tjanstesida (gjutning, bearbetning, etc.) | HOG |
| FAQPage | FAQ-sidan | HOG -- har redan fragor/svar, saknar bara markering |
| BreadcrumbList | Alla undersidor | MEDEL |
| ContactPoint | Kontaktsidan | MEDEL |

**Strukturerad data-betyg: 2/15** -- Mycket bristfallig. Ingen LocalBusiness, inga Service-scheman, ingen FAQPage trots att innehallet finns.

---

## 4. Off-Page SEO (8/15 poang)

### 4.1 Backlinksprofil (uppskattning)

| Parameter | Uppskattning |
|-----------|-------------|
| Domain Authority | 5-15 |
| Refererande domaner | 10-30 |
| Totala backlinks | 20-80 |
| Backlink-kvalitet | Lag -- troligen mest kataloglankar |

### 4.2 Narvaro i kataloger

| Katalog | Status |
|---------|--------|
| Google Business Profile | Okant -- bor verifieras/optimeras |
| allabolag.se | Troligen registrerad (alla AB syns) |
| hitta.se | Bor kontrolleras |
| eniro.se | Bor kontrolleras |
| kompass.com | Listad (synlig i sokresultat) |
| LinkedIn foretagssida | Saknas eller inaktiv |

### 4.3 Sociala medier

| Plattform | Status |
|-----------|--------|
| Facebook | Finns -- minimal aktivitet |
| LinkedIn | Saknas/inaktiv |
| YouTube | Saknas |
| Instagram | Saknas |

**Off-page-betyg: 8/15** -- Svag backlinksprofil typisk for en liten B2B-nischsajt. Stor potential att forbattra med katalogregistreringar och branschlankar.

---

## 5. Innehall och Content Marketing (6/20 poang)

### 5.1 Bloggstrategi

- **Antal blogginlagg:** 1 (ett enda!)
- **Publiceringsfrekvens:** I princip ingen
- **Amneskoppling:** Det enda inlagget handlar om att hemsidan lanserats -- ej SEO-varde
- **Betyg:** 1/10

### 5.2 Tjanstesidornas innehall

- Gjutning och Bearbetning har hyfsad struktur (H2:or, listor)
- Men tunt textinnehall (500-1000 ord istallet for rekommenderade 1500+)
- "Ovrigt"-sidan ar forvirrande -- blandar plastprodukter och avfallskorgar
- Inga kundcase, inga referenser, inga testimonials
- Inga produktbilder eller processfoton (bara platshallare)

### 5.3 Trust-signaler

| Signal | Status |
|--------|--------|
| ISO 9001-certifiering | Namns men bild pa testsida |
| Kundlogotyper | Saknas helt |
| Kundrecensioner/citat | Saknas helt |
| Referensprojekt | Saknas helt |
| Branschcertifieringar | Namns i text men inte visuellt framtradande |

**Innehalls-betyg: 6/20** -- Stor brist pa content marketing. Saknar blogg, kundcase och trust-signaler.

---

## 6. Problem-lista (Prioriterad)

### KRITISKT (Atgarda omedelbart)

1. **Testsida indexeras** -- `/_test-2/` har `index, follow` och finns i sitemap
2. **"Vara tjanster" meta-beskrivning = "PROCESSEN"** -- helt felaktig
3. **Felaktig canonical pa /en/** -- pekar pa rotdomanen istallet for `/en/`
4. **Saknar LocalBusiness-schema** -- kritiskt for lokal synlighet i Getinge/Halmstad
5. **Dubbla GTM-containrar** -- GTM-KRTLTBXM + GTM-TT4X9H5M skapar dataproblem

### HOGT (Inom 2 veckor)

6. **7 av 10 meta-beskrivningar felaktiga** -- avklippta eller meningslosa
7. **Saknar FAQPage-schema** -- FAQ-sidan har content, saknar bara markering
8. **Saknar Service-schema** -- pa alla tjanstesidor
9. **OG-bilder = dummy-1.jpg** -- 400x260 platshallarbild
10. **Titlar i VERSALER** -- GJUTNING, BEARBETNING, PROCESSEN etc.
11. **Forfattarnamn "admin-dev"** -- exponeras i schema och Twitter-taggar
12. **Stavfel i meta** -- "maskinbearbeting" pa bearbetningssidan

### MEDEL (Inom 1 manad)

13. **Tunt innehall** -- tjanstesidorna har 200-1000 ord, bor ha 1500+
14. **Saknar breadcrumbs** -- varken visuellt eller i schema
15. **Bara 1 blogginlagg** -- behover content marketing
16. **Forfattararkiv oppna** -- /author/admin-dev/ exponerar anvandarnamn
17. **WordPress-version exponerad** -- ta bort generator-meta
18. **xmlrpc.php oppen** -- sakerhetssarbarhhet
19. **Saknar hreflang x-default**

### LAGT (Inom 3 manader)

20. **PHP 8.1** -- uppgradera till 8.2 eller 8.3
21. **Engelska sidor ofullstandiga** -- flera undersidor saknar EN-version
22. **Organization-schema saknar logo, adress, telefon**
23. **Kontaktformular locale = en_US** -- bor vara sv_SE

---

## 7. Betygssammanstallning

| Kategori | Poang | Max | Procent |
|----------|-------|-----|---------|
| Teknisk SEO | 16 | 25 | 64% |
| On-Page SEO | 10 | 25 | 40% |
| Strukturerad Data | 2 | 15 | 13% |
| Off-Page SEO | 8 | 15 | 53% |
| Innehall & Content | 6 | 20 | 30% |
| **TOTALT** | **42** | **100** | **42%** |

### Tolkning

- **0-30:** Kritiskt -- sajten har allvarliga SEO-problem
- **31-50:** Svagt -- grundlaggande saker saknas <-- **Traficator ar har**
- **51-70:** Medel -- bra grund men behover forbattring
- **71-85:** Bra -- de flesta saker pa plats
- **86-100:** Utmarkt -- fullt optimerad

---

## 8. Forvantad effekt av atgarder

### Nulage (uppskattning)

| Matpunkt | Nulage |
|----------|--------|
| Organisk trafik | ~20-50 besok/manad |
| Indexerade sidor | ~20 (inkl. testsida och engelska) |
| Nyckelord i top 10 | ~0-3 |
| Domain Authority | ~5-15 |

### Mal efter 3 manaders atgarder

| Matpunkt | Mal |
|----------|-----|
| Organisk trafik | 100-200 besok/manad (+200-300%) |
| Indexerade sidor | 25-30 (rensat + nya blogginlagg) |
| Nyckelord i top 10 | 5-10 |
| Nyckelord i top 50 | 20-40 |
| Domain Authority | 10-20 |
| Tekniskt SEO-betyg | 85+/100 |

### Beraknad ROI

B2B-ledet innebar att varje konvertering (offertforfragan) har mycket hogt varde:
- 100-200 besok/man med 1-3% konverteringsgrad = 1-6 offertforfragningar/man
- Genomsnittligt ordervarde B2B gjutgods: 50 000 - 500 000 kr
- **En enda ny kund per kvartal motiverar hela SEO-investeringen**

---

## 9. Foreslagen meta-beskrivning per sida

| Sida | Foreslagen meta-beskrivning |
|------|-----------------------------|
| **Startsidan** | Traficator erbjuder kostnadseffektiv material sourcing av gjutgods, metallprodukter och stalkonstruktioner. Sank era inkopskostnader med minst 25%. Begar offert! |
| **Vara tjanster** | Traficator levererar gjutning, CNC-bearbetning och stalkonstruktioner via kvalitetsakrade producenter i Europa och Asien. Se vara tjanster. |
| **Gjutning** | Maskinbearbetat gjutgods i hog kvalitet -- sandgjutning, kokillgjutning och pressgjutning i alla typer av metaller. ISO 9001-certifierat. |
| **Bearbetning** | CNC-bearbetning med 3-, 4- och 5-axliga maskiner. Svarvning, frasning, slipning och ytbehandling i stal, aluminium och massing. |
| **Processen** | Fran behov till leverans -- sa fungerar var sourcingprocess. Vi identifierar ratt leverantor, kvalitetsakrar och hanterar hela logistikkedjan. |
| **Ovrigt** | Utover gjutgods och metallbearbetning erbjuder Traficator specialprodukter och losningar via vart breda internationella leverantorsnatverk. |
| **FAQ** | Vanliga fragor om material sourcing, gjutgods och metallprodukter. Hur fungerar Traficator? Vad kostar det? Vilka leveranstider galler? |
| **Vi pa Traficator** | Traficator International AB ar ett familjeforetag i Getinge med lang erfarenhet av global sourcing. Mot teamet bakom leverantorslosningarna. |
| **Kontakt** | Kontakta Traficator for offert eller fragor om material sourcing. Besok oss i Getinge eller ring 035-282 01 40. |

---

## 10. Foreslagen strukturerad data

### LocalBusiness-schema (startsidan + kontaktsidan)

```json
{
  "@type": "LocalBusiness",
  "@id": "https://traficator.se/#localbusiness",
  "name": "Traficator International AB",
  "description": "Material sourcing av metallprodukter -- gjutgods, bearbetning och stalkonstruktioner",
  "url": "https://traficator.se",
  "telephone": "+46-35-282-01-40",
  "email": "traficator@traficator.se",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Oinge Lillegard 103",
    "postalCode": "305 77",
    "addressLocality": "Getinge",
    "addressCountry": "SE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 56.859190,
    "longitude": 12.762401
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "08:00",
    "closes": "17:00"
  }
}
```

### Service-schema (per tjanstesida)

```json
{
  "@type": "Service",
  "name": "Gjutning av metallprodukter",
  "serviceType": "Metal Casting",
  "provider": {"@id": "https://traficator.se/#localbusiness"},
  "areaServed": ["SE", "EU"],
  "description": "Sandgjutning, kokillgjutning och pressgjutning i alla typer av metaller med ISO 9001-certifiering."
}
```

### FAQPage-schema (FAQ-sidan)

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Hur fungerar Traficators sourcingprocess?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vi fungerar som en forlangning av er inkopsavdelning..."
      }
    }
  ]
}
```

---

*Rapport genererad av Searchboost.se -- 2026-03-03*
