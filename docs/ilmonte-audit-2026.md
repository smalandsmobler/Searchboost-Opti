# SEO-audit: ilmonte.se

> Genomford: 2026-02-16
> Av: Searchboost Opti (automatiserad crawl + manuell analys)
> Status: EJ GSC-agare (kan ej gora automatisk optimering via API)

---

## 1. Oversikt

| Egenskap | Varde |
|----------|-------|
| Doman | ilmonte.se |
| CMS | WordPress 6.8.3 |
| Tema | Flatsome 3.20.5 (child theme) |
| E-handel | WooCommerce 10.0.4 |
| SEO-plugin | Rank Math PRO |
| SSL | Ja (HTTPS) |
| Sprak | sv-SE |
| Antal sidor i sitemap | ~13 sidor |
| Antal produkter (uppskattat) | 400-800+ (4 produkt-sitemaps) |
| Antal bloggposter | 2 (1 riktig artikel + index) |
| Lokal SEO | Rank Math Local (locations.kml) |

## 2. Verksamhetsbeskrivning

AB ilmonte ar en B2B-leverantor av scenproduktioner, teaterutrustning och offentlig miljo i Sverige. De saljer:
- Scenpodier (Rapid, Alu-Top, fallbara, trumpodier)
- Dansmattor (PVC, textil, utstallning)
- Scentextil (sammet, molton, blackout, chromakey, effekttyg)
- Ridaskenor (scen, offentlig miljo)
- Laktare (teleskop, gradang, utomhus)
- Stolar och fatoljer (teater, biograf, horsal, arena, orkester)
- Farg (Rosco, scengolvsfarg, brandimpregnering)
- Filmdukar och projektionsfolier
- Akustiklosningar
- Scenteknik (Kabuki, scenmekanik)
- Effekter (crashglas, spegelfolie, sno)
- Tillbehor

Submarke: ilmofurniture (event-mobler)

## 3. Teknisk SEO

### 3.1 Positiva fynd
- HTTPS aktiv med canonical-taggar korrekt satta
- Rank Math PRO installerad med Schema-stod
- Sitemap genereras korrekt via Rank Math (sitemap_index.xml)
- robots.txt korrekt konfigurerad (WooCommerce-kataloger blockerade)
- GTM (GTM-5R3XFSN) installerat
- GA4 (G-CM832CYYRS) konfigurerat via WooCommerce GA-integration
- CookieYes cookie-consent installerat (GDPR)
- Open Graph och Twitter Cards konfigurerade
- Lokalt SEO-schema (Organization med sameAs: Facebook, Instagram)
- SearchAction schema pa startsidan
- Fonter hostas lokalt (bra for GDPR + prestanda)

### 3.2 Problem

#### KRITISKT
1. **MonsterInsights installerad men EJ konfigurerad** -- HTML-kommentar i koden: "Observera: MonsterInsights ar for narvarande inte konfigurerat pa denna webbplats." Dubblerings-risk med WooCommerce GA-integration.

2. **Kontaktsidan saknar meta description** -- /kontakt/ har ingen `<meta name="description">`. OG description ar bara sociala lankar: "https://www.facebook.com/ilmonteab https://www.instagram.com/ilmonte_ab"

3. **Om oss saknar meta description** -- /om-oss/ har ingen `<meta name="description">` alls.

#### HOGT
4. **Startsidans title ar inte optimal** -- Nuvarande: "Scenpodier, dansmattor, scentextil - ilmonte.se". Borde inkludera foretags-USP och bredare nyckelord.

5. **Forfattare exponerad som "Effektify"** -- Startsidan visar "Skriven av: Effektify" (tidigare SEO-byra) i Twitter-metadata och schema. Detta ar ett foretroendeproblem.

6. **Article schema pa startsidan** -- Startsidan anvander Article-schema istallet for mer relevant WebSite/LocalBusiness-schema.

7. **WooCommerce-sidor i sitemap** -- /varukorg/, /kassan/, /mitt-konto/ ar indexerade i sitemap. Dessa bor noindexas.

#### MEDEL
8. **Extremt tunn blogg** -- Bara 1 verklig artikel (Mogaskolan) + nyhetssidan. Ingen regelbunden content-produktion.

9. **Produktkategorier saknar beskrivningstext** -- Kategorisidor (podier, dansmattor, scentextil) har ingen SEO-text som forklarar kategorin.

10. **Videobakgrund pa startsidan** -- Vimeo-video laddas direkt (progressive_redirect). Kan paverka sidladdningstid negativt.

11. **Bildoptimering oklart** -- Bilder serveras fran wp-content/uploads utan synlig lazy-loading attribut (utover Flatsome inbyggda).

12. **Breadcrumbs ej synliga** -- Inga breadcrumbs i navigationen (Rank Math har stod, troligen ej aktiverat).

### 3.3 Plugin-inventering (fran HTML)
- Rank Math PRO
- WooCommerce 10.0.4
- Contact Form 7 6.1.1
- MonsterInsights 9.6.1 (EJ konfigurerad)
- GTM4WP (Google Tag Manager for WordPress)
- WooCommerce Google Analytics Integration
- WPC Grouped Product Premium 5.2.1
- WooSmart Quick View 4.2.1
- CookieYes

## 4. On-Page SEO

### 4.1 Startsidan (/)
| Element | Varde | Bedomning |
|---------|-------|-----------|
| Title | "Scenpodier, dansmattor, scentextil - ilmonte.se" | OK men kan forbattras |
| Meta description | "AB ilmonte - den kompletta leverantoren for event, teater och offentlig miljo i Sverige. Vi star for kunskap, kreativitet och kompetens." | Bra men kort |
| H1 | Saknas i HTML (H2 "Valkommen till AB Ilmonte" ar forsta heading) | PROBLEM - saknar H1 |
| H2 | "Valkommen till AB Ilmonte" | OK |
| Schema | Organization + WebSite + WebPage + Article | Overflodigt Article-schema |
| Canonical | https://ilmonte.se/ | OK |
| OG Image | ilmonte-logo-1-1.jpg (850x850) | Bor vara mer representativ bild |

### 4.2 Kontaktsidan (/kontakt/)
| Element | Varde | Bedomning |
|---------|-------|-----------|
| Title | "Kontakt - ilmonte.se" | Generiskt, bor inkludera stikordsinnehall |
| Meta description | SAKNAS | KRITISKT |
| OG description | Bara URL:er till sociala medier | KRITISKT |
| Schema | Organization + WebPage + Article | OK |

### 4.3 Om oss (/om-oss/)
| Element | Varde | Bedomning |
|---------|-------|-----------|
| Title | "Om oss - ilmonte.se" | Generiskt |
| Meta description | SAKNAS | KRITISKT |
| Schema | Organization + WebPage + Article | OK |

## 5. Sitoversikt och navigering

### Huvudmeny (bottom nav)
1. Hem
2. Podier (7 underkategorier)
3. Dansmattor (4 underkategorier)
4. Scentextil (15 underkategorier)
5. Farg (5 underkategorier)
6. Ridakenor (7 underkategorier, 2 nivaer)
7. Laktare (5 underkategorier)
8. Stolar och Fatoljer (6 underkategorier)
9. Ovrigt (Folier, Effekter, Akustik, Teknik, Tillbehor, ilmofurniture, REA)

### Toppbar
- Om oss
- Aktuellt (kategori)
- Referenser (produkt-kategori)
- Kopvillkor
- Kontakt

## 6. Konkurrenslandskap

ilmonte verkar i en nischad B2B-marknad (scenproduktion/teaterutrustning). Huvudkonkurrenter inkluderar troligen:
- Draperi.se
- Scenbutiken.se
- Akademi Ljud & Ljus
- Nordisk Scenservice

Nyckelorden som redan finns inlagda (30 st, A/B/C) tackter troligen scenpodier, dansmattor, scentextil, laktare, ridakenor, etc.

## 7. Sammanfattning

**Styrkor:**
- Rank Math PRO installerat med bra grundkonfiguration
- Bra sitemap-struktur
- GTM + GA4 + CookieYes pa plats
- Schema markup (Organization, WebSite, SearchAction)
- Stabil teknisk grund (WordPress + Flatsome + WooCommerce)
- Brett produktsortiment med bra kategorisering

**Svagheter:**
- Flera sidor saknar meta description
- Startsidan saknar H1
- Extremt tunn blogginnehall
- Produktkategorier utan SEO-text
- MonsterInsights installerad men ej konfigurerad (ska avinstalleras eller konfigureras)
- Forfattare visar "Effektify" (gammal byrå)
- WooCommerce-sidor indexerade i sitemap
- Ingen aktiv content-strategi

**Mojligheter:**
- Stor potential i nischat B2B-innehall (guider, referensprojekt, FAQ)
- Lokal SEO kan starkas (Rank Math Local redan installerat)
- Produktsidor kan optimeras med battre metadata via Rank Math
- Kategorisidor kan fa SEO-text for att ranka pa breda termer
- Blogg kan byggas ut med branschrelevant innehall

---

*Notering: ilmonte ar EJ agare av GSC-propertyn, sa automatisk optimering via Searchboost-plattformen ar ej mojlig. Allt arbete maste goras manuellt i WP-admin.*
