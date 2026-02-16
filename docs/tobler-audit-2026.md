# SEO-Audit: tobler.se

> Utford: 2026-02-15
> Utford av: Searchboost Opti (automatisk audit)
> Bransch: Byggstallningar, formsystem, fallskydd, vaderskydd
> CMS: WordPress + Elementor + WooCommerce + Rank Math SEO
> Cachning: WP Rocket
> Betallosning: Svea
> Plats: Goteborg (telefon +46 31 928015)

---

## Sammanfattning

tobler.se ar en WooCommerce-sajt for stallningsprodukter, formsystem och fallskydd riktad mot den svenska byggmarknaden. Sajten har en solid teknisk grund med snabba laddtider, korrekt HTTPS-hantering och Rank Math SEO installerat. Dock finns flera allvarliga SEO-problem som begransar sajtens synlighet:

**Styrkor:**
- Snabb TTFB (~73ms) med WP Rocket-cachning
- Rank Math SEO med schema markup (Product, FAQPage) pa nyckelsidor
- Korrekt robots.txt och sitemap-konfiguration (4 sitemaps, 114 URL:er totalt)
- Bra H1-struktur pa de flesta sidor
- FAQ-sida med FAQPage-schema (11 fragor)
- GTM installerat (GTM-TVQD7F4K)
- Responsiv design (viewport-meta korrekt)
- 301-redirect fran HTTP till HTTPS och www till icke-www

**Kritiska problem:**
- Ingen blogg eller innehallsstrategi overhuvudtaget (0 blogginlagg)
- Flera produktsidor saknar bilder och har tomma alt-attribut
- Logotypen saknar alt-text pa ALLA sidor
- En produktbild ar 2800x17533 pixlar (extremt lang, troligen felaktigt uppladdad)
- Modulstallning-kategorin har 2 st H1-taggar
- Lokal SEO-data ar helt tom i KML/Rank Math Local
- Inga sakerhetsheaders (HSTS, X-Frame-Options, CSP)
- Inga WebP/AVIF-bilder (enbart JPG/PNG)
- Flera metabeskrivningar ar alltfor langa (300+ tecken, bor vara 150-160)
- Ingen intern lankstrategi (endast grundlaggande navigation)
- Inga backlinks analyserbara (SE Ranking API saknar credits)

**Helhetsbedoming:** 45/100 — Grunderna finns men sajten behover omfattande innehalls- och on-page-arbete for att kunna ranka pa konkurrenskraftiga sokord.

---

## Teknisk SEO

### Serverrespons och prestanda
| Matpunkt | Varde | Bedomning |
|----------|-------|-----------|
| TTFB (startsida) | 73ms | Utmarkt |
| Total laddtid (HTML) | 125ms | Utmarkt |
| HTML-storlek (startsida) | 278 KB | Acceptabelt (Elementor-bloat) |
| HTML-storlek (butik) | 297 KB | Acceptabelt |
| HTML-storlek (vaderskydd) | 253 KB | Bra |
| Cachning | WP Rocket | Bra |
| PHP-version | 8.2.30 | Aktuell |
| Webbserver | Nginx | Bra |

### HTTPS och redirects
| Kontroll | Status | Kommentar |
|----------|--------|-----------|
| HTTPS | OK | Korrekt SSL |
| HTTP -> HTTPS redirect | OK | 301-redirect |
| www -> icke-www | OK | Korrekt redirect |
| Canonical URL (startsida) | OK | `https://tobler.se/` |
| Robots meta | OK | `follow, index, max-snippet:-1` |

### Sakerhetsheaders
| Header | Status |
|--------|--------|
| Strict-Transport-Security (HSTS) | SAKNAS |
| X-Frame-Options | SAKNAS |
| X-Content-Type-Options | SAKNAS |
| Content-Security-Policy | SAKNAS |
| X-XSS-Protection | SAKNAS |

**Rekommendation:** Lagg till sakerhetsheaders i Nginx-konfigurationen. HSTS ar sarskilt viktigt for en e-handelssajt.

### Mobilanpassning
- Viewport-meta: OK (`width=device-width, initial-scale=1`)
- Responsiv design: Ja (Elementor + Hello Elementor-tema)
- Fetchpriority-hints: 3 st (bra for LCP)
- Preconnect/preload/prefetch: 5/14/13 (bra resursoptimering)

### Sitemap och robots.txt
- **robots.txt**: Korrekt konfigurerad, blockerar WooCommerce-logg- och varukorgssidor
- **Sitemap index**: 4 sitemaps (page, product, product_cat, local)
- **Totalt antal URL:er**:
  - Sidor: 6
  - Produkter: 95
  - Produktkategorier: 13
  - Lokalt: 1 (tom KML-fil)
  - **Totalt: 115 indexerbara URL:er**

### Rank Math SEO
- Installerat och konfigurerat
- Genererar sitemap_index.xml
- Rank Math Local aktiverat (men KML-data ar tom)
- Schema markup genereras automatiskt (WebSite, WebPage, Product, FAQPage)

### Google Tag Manager
- GTM installerat: `GTM-TVQD7F4K`
- gtag-anrop finns (troligen GA4 via GTM)

### Plugins identifierade
- Elementor (page builder)
- WooCommerce (e-handel)
- Rank Math SEO
- WP Rocket (cachning)
- Mastodont Elementor Addons
- JetEngine (listings/dynamic content)
- Speculation Rules API (prefetch)

---

## On-page SEO

### Startsidan (/)
| Element | Innehall | Bedomning |
|---------|----------|-----------|
| Title | "Stallningsprodukter Baserat Efter Marknadens Behov - Tobler" | Bra langd, men "Baserat Efter Marknadens Behov" ar vagt |
| Meta description | "Vi har over 40 ars erfarenhet inom Stallningsprodukter och fallskydd! Med vara produkter kan du som kund lita pa forstklassig kvalitet." | Bra (152 tecken) |
| H1 | "Tobler Stallningsprodukter" | OK |
| H2 | "Populara kategorier", "Populara produkter", "Vaderskydd", "Om Tobler" | Bra struktur |
| H3 | "Ramstallning", "Modulstallning", "Formsystem", "Stallningstrailer", "Fallskydd till tak", "U-profilsplank & plattformar" | Bra |
| OG-taggar | Alla installda (locale, type, title, description, url, site_name) | Bra |
| Schema | WebSite + SearchAction + Article + Person | OK men saknar LocalBusiness |
| Bilder med alt="" | 3 av 10 | PROBLEM |
| Bilder utan alt | 2 st | PROBLEM |
| Intern lankning | 6 kategorier + 6 produkter + 4 sidor | Grundlaggande |

### Sidanalys (alla sidor)

| Sida | Title | Meta desc | H1 | Problem |
|------|-------|-----------|-----|---------|
| / | Stallningsprodukter Baserat Efter... | 152 tecken, bra | 1 st, OK | Vag title, bilder utan alt |
| /vaderskydd/ | Vaderskydd: Arbeta Skyddad I Alla... | 157 tecken, bra | 1 st (med inline-styles + br) | Rorig H1-markup med spans och br |
| /byggstallningar-och-fragor/ | 5 Vanliga Fragor Om Byggstallningar... | 100 tecken, kort | 1 st, OK | Title sager "5 fragor" men sidan har 11 |
| /butik/ | Upptack Tobler: Kvalitetsst... | 100 tecken, OK | 1 st "Butik" | Generisk H1, borde vara nyckelordsfokuserad |
| /om-oss/ | Om Oss - Tobler | 50 tecken, FOR KORT | 1 st, OK | Meta desc ar bara 50 tecken |
| /kontakt/ | Kontaktinformation For Tobler... | 106 tecken, OK | 1 st, OK | OK |

### Kategorisidor

| Kategori | Title | Meta desc | H1 | Problem |
|----------|-------|-----------|-----|---------|
| /produkt-kategori/ramstallning/ | Ramstallning: Optimal Sakerhet... | 156 tecken | 1 st | OK |
| /produkt-kategori/modulstallning/ | Modulstallningar For Proffs... | 138 tecken | **2 st H1** | Dubblerad H1 — allvarligt |
| /produkt-kategori/formsystem/ | Formbyggnadssystem For Innovativa... | 118 tecken | 1 st | OK |
| /produkt-kategori/stallningstrailer/ | Stallningstrailer: Innovativ... | 155 tecken | 1 st | OK |
| /produkt-kategori/fallskydd-taksakerhet/ | Fallskydd Till Tak: Sakerstall... | 146 tecken | 1 st | OK |

### Produktsidor (stickprov)

| Produkt | Title | Meta desc | Schema | Problem |
|---------|-------|-----------|--------|---------|
| /produkt/modulstallningspaket-15x4m-60m2/ | Modulstallning Stal 15x4m - Tobler | 152 tecken | Product + Offer | OK |
| /produkt/ramstallning-stal-hela-villan348m2/ | Ramstallning Stal - Hela Villan 348m2 | **340+ tecken** (full materiallista!) | Product + Offer | Meta desc ALLDELES for lang |

### Bilder
- **Logotyp** (618x200px, PNG): `alt=""` pa ALLA sidor — saknar alt-text
- **Varukorgsikon**: Saknar alt-attribut helt
- **Produktbilder**: De flesta har beskrivande alt-text (bra)
- **En bild ar 2800x17533px** (stamp klass D/E) — extremt overstor, troligen felaktigt uppladdad
- **Inget WebP/AVIF**: Alla bilder ar JPG eller PNG — betydande optimeringsmojlighet
- **Responsiva bilder**: srcset anvands pa de flesta bilder (bra)

### Intern lankning
- Startsidan lankar till 6 produktkategorier och ~6 produkter
- Ingen breadcrumb-navigation synlig (borde finnas med Rank Math)
- Ingen "relaterade produkter"-sektion identifierad
- Saknar intern lanskyltning mellan innehallssidor och produkter
- Ingen blogg = ingen mojlighet att bygga content-baserad intern lankning

### Innehall
- **0 blogginlagg** — KRITISKT. Sajten har ingen innehallsstrategi
- **1 FAQ-sida** med 11 fragor (bra, med schema)
- **1 Vaderskydd-landningssida** med bra content (ca 400-600 ord)
- **6 sidor totalt** — mycket tunt
- **95 produkter** — bra produktkatalog
- **Inget kundcase/referens-sida**
- **Ingen "hur funkar det"-sida eller guide**

---

## Backlink-profil

> OBS: SE Ranking API ar tillfailligt otillgangligt (insufficient funds). Backlink-data nedan baseras pa sajtens aldersstruktur och branchanalys.

### Indikationer fran sajten
- Doman registrerad: tobler.se (Schweiziskt stallningsforetag med svensk filial)
- **Extern lankning fran startsidan**: Minimal (bara Google Tag Manager)
- **Sociala medier**: Inga sociala lankar hittade pa sajten
- **Pressreleaser/nyheter**: Inga identifierade
- **Branschkataloger**: Okant utan SE Ranking-data

### Uppskattad status
- Nyare sajt (uppladdningar fran 2024-02025 baserat pa wp-content-datumstamplar)
- Troligen svag backlinkprofil for en relativt ny .se-doman i en nischmarknad
- **Behover aktiv lankkampanj** for att bygga auktoritet

### Rekommendation
- Nar SE Ranking API ar tillgangligt igen, kor fullstandig backlinkanalys
- Fokusera pa branschspecifika kataloger: Byggportalen, Byggtjanst, Hallbar Stad, etc.
- Skapa PR-material om foretaget (Schweizisk kvalitet, 40 ars erfarenhet)

---

## ABC-nyckelord

> Notera: Sokvolymer ar uppskattade baserat pa branschkunskap for den svenska marknaden. Exakta volymer bor verifieras via Google Keyword Planner eller SE Ranking nar tillgangligt.

### A-nyckelord (hogst prioritet, karnverksamhet)

| Sokord | Uppskattad sokvolym/man | Konkurrens | Kommentar |
|--------|-------------------------|------------|-----------|
| byggstallning | 3 600 | Hog | Huvudnyckelord |
| byggstallning kopa | 1 300 | Hog | Hog kopintention |
| ramstallning | 590 | Medel | Produktkategori |
| modulstallning | 390 | Medel | Produktkategori |
| vaderskydd bygg | 320 | Lag-Medel | Stark landningssida finns |
| fallskydd tak | 480 | Medel | Produktkategori |
| stallning kopa | 720 | Hog | Bred kopintention |
| byggstallning pris | 880 | Medel | Prisjamforelse-sokare |
| stallningspaket | 260 | Lag | Produkttyp |

### B-nyckelord (sekundar prioritet, langsvanssokord)

| Sokord | Uppskattad sokvolym/man | Konkurrens | Kommentar |
|--------|-------------------------|------------|-----------|
| ramstallning kopa | 170 | Lag | Specifik kopavsikt |
| modulstallning stal | 140 | Lag | Materialsokare |
| stallning villa | 210 | Lag | Bostadsprojekt |
| byggstallning hyra | 1 600 | Hog | Hyra vs kopa — content-mojlighet |
| formsystem betong | 170 | Lag | Nischprodukt |
| stallningstrailer | 110 | Lag | Unik produkt |
| vaderskyddstak | 170 | Lag | Synonym |
| skyddsnat stallning | 110 | Lag | Tillbehor |
| taksakerhet fallskydd | 210 | Medel | B2B-nisch |
| stalplank stallning | 90 | Lag | Komponent |
| aluminiumplank stallning | 90 | Lag | Material + komponent |
| stallning gaveltopp | 70 | Lag | Produktspecifik |
| motviktssystem | 50 | Lag | Specialprodukt |
| stampstod | 50 | Lag | Specialprodukt |

### C-nyckelord (information/longtail, content-driven)

| Sokord | Uppskattad sokvolym/man | Konkurrens | Kommentar |
|--------|-------------------------|------------|-----------|
| hur manga meter stallning behover jag | 70 | Lag | Blogg/guide |
| regler byggstallning Sverige | 260 | Lag | FAQ/guide |
| stallning kontroll intervall | 50 | Lag | FAQ-sida har detta |
| begagnad byggstallning | 390 | Medel | FAQ nammer detta |
| kopa eller hyra stallning | 140 | Lag | Jamforelseinnehall |
| byggstallning sakerhet | 110 | Lag | Guide/blogg |
| stallning fasadarbete | 70 | Lag | Anvandningsfall |
| vaderskydd konstruktion | 50 | Lag | Tekniskt innehall |
| stamp betong | 90 | Lag | Produktguide |

---

## Prioriterade problem (numrerad lista)

### Kritiskt (gor genast)

1. **Ingen blogg eller innehallsstrategi** — 0 blogginlagg, 0 guider, 0 kundcase. Detta ar det storsta hindret for organisk tillvaxt. Sajten kan inte ranka pa informationssokord och missar hela "kunskapsresan" for potentiella kunder.

2. **Felaktigt uppladdad bild (2800x17533px)** — Stamp-produktbilden ar extremt overstor. Detta forstanger sidladdning och anvandaupplevelse. Behover beskjaras och optimeras omedelbart.

3. **Logotypen saknar alt-text pa alla sidor** — `alt=""` pa logotypen ar en genomgaende on-page-brist. Borde vara `alt="Tobler Stallningsprodukter"`.

4. **Produktbeskrivningar som metabeskrivning** — Minst en produktsida (Ramstallning Hela Villan) har en metabeskrivning pa 340+ tecken som ar en ren materiallista. Google klipper vid ~155 tecken.

5. **Dubbel H1 pa modulstallning-kategorin** — Tva st H1-taggar skapar forvirring for sokmotorer om sidans huvudamne.

### Allvarligt (gor inom 2 veckor)

6. **Lokal SEO-data helt tom** — Rank Math Local ar aktiverat men KML-filen saknar adress, telefon, koordinater. Ingen LocalBusiness-schema pa sajten.

7. **Sakerhetsheaders saknas** — HSTS, X-Frame-Options, X-Content-Type-Options, CSP saknas alla. Viktigt for en e-handelssajt.

8. **Inga WebP/AVIF-bilder** — Alla bilder serveras som JPG/PNG. WebP kan minska filstorlek med 30-50%.

9. **FAQ-sidans title ar felaktig** — Title sager "5 Vanliga Fragor" men sidan har 11 fragor.

10. **Om oss-sidans metabeskrivning ar for kort** — Bara 50 tecken, borde vara 150-160.

### Forbattringsomraden (gor inom 1 manad)

11. **Saknar breadcrumbs** — Rank Math stodjer breadcrumbs men de verkar inte vara aktiverade/synliga.

12. **Butik-sidans H1 ar generisk** — "Butik" ar inte sokordsfokuserat. Borde vara "Byggstallningar & Stallningsprodukter" eller liknande.

13. **Inga sociala medier-lankar** — Sajten har ingen koppling till sociala medier.

14. **Vaderskyddssidans H1-markup ar rorig** — Inline-styles, spans och br-taggar inuti H1. Borde vara ren markup.

15. **Inga relaterade produkter/korsforsal jning synlig** — Missad mojlighet att oka engagement och sidvisningar.

16. **Ingen kundrecension/betyg-funktionalitet** — WooCommerce stodjer reviews men inga review-schema hittades.

---

## 3-manaders atgardsplan

### Manad 1: Grundlaggande on-page-fixar + innehallsstrategi

**Vecka 1-2: Tekniska fixar**
- [ ] Fixa logotypens alt-text pa alla sidor (`alt="Tobler Stallningsprodukter"`)
- [ ] Beskjar och optimera den 2800x17533px stora stampbilden
- [ ] Fixa dubbel H1 pa modulstallning-kategorin (ta bort en)
- [ ] Uppdatera FAQ-sidans title till "11 Vanliga Fragor Om Byggstallningar och Sakerhet"
- [ ] Forlang Om oss-sidans metabeskrivning till 150-160 tecken
- [ ] Korta ner alla for langa metabeskrivningar (max 160 tecken)
- [ ] Aktivera breadcrumbs i Rank Math
- [ ] Rensa vaderskyddssidans H1 fran inline-styles

**Vecka 3-4: Lokal SEO + sakerhet**
- [ ] Fyll i Rank Math Local-data: fullstandig adress, telefon, oppettider, koordinater
- [ ] Konfigurera LocalBusiness-schema (Organization → LocalBusiness)
- [ ] Lagg till sakerhetsheaders i Nginx (HSTS, X-Frame-Options, X-Content-Type-Options)
- [ ] Installera/aktivera WebP-konvertering (via WP Rocket eller Imagify)
- [ ] Skapa Google Business Profile (om ej finns)
- [ ] Registrera sajten i Google Search Console (om ej gjort)

### Manad 2: Innehallsproduktion + kategorioptimering

**Vecka 5-6: Blogginnehall (4 artiklar)**
- [ ] Artikel 1: "Komplett guide: Hur du valjer ratt byggstallning" (~1500 ord, malord: byggstallning, ramstallning, modulstallning)
- [ ] Artikel 2: "Kopa eller hyra byggstallning? Fordelar och nackdelar" (~1200 ord, malord: byggstallning kopa, hyra byggstallning)
- [ ] Artikel 3: "Regler for byggstallningar i Sverige — allt du behover veta" (~1500 ord, malord: regler byggstallning, stallning sakerhet)
- [ ] Artikel 4: "Vaderskydd for byggprojekt: sa skyddar du ditt arbete" (~1000 ord, malord: vaderskydd bygg)

**Vecka 7-8: Kategori- och produktsidoptimering**
- [ ] Optimera Butik-sidans H1 till nyckelordsfokuserat ("Byggstallningar & Stallningsprodukter - Kop Online")
- [ ] Skriv unika kategori-texter for alla 13 underkategorier (~200-300 ord var)
- [ ] Granska och optimera metabeskrivningar pa alla 95 produkter
- [ ] Lagg till produktrecensioner/betyg-funktionalitet
- [ ] Implementera relaterade produkter pa alla produktsidor
- [ ] Lagg till sociala medier-lankar i footer

### Manad 3: Lanktillvaxt + avancerad optimering

**Vecka 9-10: Backlinks och extern synlighet**
- [ ] Registrera i branschkataloger: Byggportalen, Byggtjanst, byggahus.se
- [ ] Skapa foretagsprofil pa relevanta plattformar (LinkedIn, YouTube)
- [ ] Skriva en PR-artikel om Toblers verksamhet i Sverige
- [ ] Kontakta branschmedier for mojliga omnamnanden
- [ ] Kor fullstandig backlinkanalys (SE Ranking/Ahrefs)

**Vecka 11-12: Avancerat och uppfoljning**
- [ ] Analysera Google Search Console-data (efter 2 manaders indexering)
- [ ] Artikel 5: "Fallskydd pa tak — sa uppfyller du kraven" (~1200 ord)
- [ ] Artikel 6: "Modulstallning vs ramstallning — vilken passar ditt projekt?" (~1000 ord)
- [ ] Optimera baserat pa faktisk GSC-data (klick, impressions, positioner)
- [ ] Implementera FAQ-schema pa relevanta bloggartiklar
- [ ] Satt upp manatlig rapportering via Searchboost Opti-plattformen

---

## Teknisk information

### WordPress-konfiguration
- **CMS**: WordPress med Elementor
- **Tema**: Hello Elementor (child theme)
- **E-handel**: WooCommerce
- **SEO**: Rank Math SEO (med Local SEO + schema)
- **Cachning**: WP Rocket
- **Page builder addons**: Mastodont Elementor Addons, JetEngine
- **Betalning**: Svea
- **Spekulation/prefetch**: Speculation Rules API aktiverad

### Sajtstruktur
```
tobler.se/
  ├── / (startsida)
  ├── /vaderskydd/ (landningssida)
  ├── /byggstallningar-och-fragor/ (FAQ, 11 fragor)
  ├── /butik/ (WooCommerce-butik)
  ├── /om-oss/
  ├── /kontakt/
  ├── /mitt-konto/
  ├── /kassan/
  ├── /varukorg/
  ├── /produkt-kategori/
  │   ├── /ramstallning/ (3 underkategorier)
  │   ├── /modulstallning/ (2 underkategorier)
  │   ├── /formsystem/ (2 underkategorier)
  │   ├── /stallningstrailer/
  │   ├── /fallskydd-taksakerhet/ (3 underkategorier)
  │   └── /u-profilsplank-plattformar/
  └── /produkt/ (95 produkter)
```

### Kontaktuppgifter (fran sajten)
- **Telefon**: +46 31 928015
- **E-post**: kontakt@tobler.se, jakob@tobler.se, viktor@tobler.se
- **Plats**: Goteborg (baserat pa riktnummer 031)

---

## Noteringar

- SE Ranking API var otillgangligt vid audit-tillfallet (insufficient funds). Backlink-data bor kompletteras nar API:t ar tillgangligt igen.
- Sokvolymer for ABC-nyckelord ar uppskattade och bor verifieras mot Google Keyword Planner.
- Sajten anvander Svea som betallosning, vilket tyder pa B2B-fokus (faktura/delbetalning).
- Tobler ar ett Schweiziskt foretag med svensk marknad — det finns potential att bygga content kring "Schweizisk kvalitet" och "40 ars erfarenhet".
- WP REST API ar oppen (`/wp-json/`) — borde begransas for sakerhet om det inte anvands externt.
