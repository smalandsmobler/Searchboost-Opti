# SEO-audit — Möbelrondellen.se
**Datum:** 2026-04-16
**Granskat av:** Searchboost / Claude
**Hälsa:** 🔴 **Kritiska brister — höga quick-wins finns**
**Omfattning:** 163 produkter · 39 kategorier · 14 inlägg · 12 sidor · 13 varumärken · 27 produkt-taggar

---

## Sammanfattning — topp-4 akuta problem

| # | Problem | SEO-påverkan | Svårighet |
|---|---------|--------------|-----------|
| 1 | **Rank Math genererar INGEN metadata** (title, description, OG, Twitter) på ALLA sidor. 0/20 produkter, 0/25 kategorier, 0/14 inlägg har manuella meta. | 🔴 Kritisk | Låg — 1 dags arbete |
| 2 | **Startsidan (SPA) saknar ALLT för crawlers**: ingen H1, H2, meta description, canonical, schema, text. Google ser en tom sida. | 🔴 Kritisk | Medium — kräver SSR eller pre-render |
| 3 | **Duplicate content på domännivå**: `http://`, `http://www.`, `https://` och `https://www.` returnerar alla 200 OK. Ingen 301 mot kanonisk URL. | 🔴 Hög | Låg — .htaccess-regel |
| 4 | **Artiklar har datum-URL:er** (`/2026/04/12/slug/`). Alla kortare URL-varianter är 301-redirect. Dåligt för SEO + delning. | 🟡 Medel | Medium — permalinkändring + redirectskydd |

---

## 1. Tekniska filer (robots.txt, sitemap, llms.txt)

### robots.txt ✅ Finns, men pekar fel
```
User-agent: *
Allow: /
Sitemap: https://www.mobelrondellen.se/sitemap.xml
```
- 🔴 `Sitemap:`-raden pekar på **legacy `/sitemap.xml`** med 8 URL:er — varav 4 `/kollektioner/*`-URL:er är **302-redirect** till andra sidor.
- ✅ WordPress core-sitemap fungerar: `/wp-sitemap.xml` (totalt 250 URL:er över 7 sub-sitemaps).
- 🟡 `Allow: /` är OK men ingen `Disallow` för typiska skräp-paths (`/?s=`, `/wp-admin/`, `/cart/`, `/checkout/`, `/my-account/`).
- 🟡 Ingen Rank Math-sitemap genereras (plugin aktivt, men sitemap oaktiverad).

**Åtgärd:**
1. Aktivera Rank Math Sitemap (Dashboard → Rank Math → Sitemap Settings).
2. Uppdatera robots.txt:
   ```
   User-agent: *
   Disallow: /wp-admin/
   Disallow: /cart/
   Disallow: /checkout/
   Disallow: /my-account/
   Disallow: /?s=
   Disallow: /?add-to-cart=
   Allow: /wp-admin/admin-ajax.php

   Sitemap: https://www.mobelrondellen.se/sitemap_index.xml
   ```
3. Radera legacy `/sitemap.xml` (statisk fil) ELLER redirecta den till Rank Math-sitemap.

### sitemap-innehåll
| Sub-sitemap | URL-antal |
|---|---|
| `wp-sitemap-posts-product-1.xml` | 158 |
| `wp-sitemap-posts-post-1.xml` | 14 |
| `wp-sitemap-posts-page-1.xml` | 12 |
| `wp-sitemap-taxonomies-product_cat-1.xml` | 25 |
| `wp-sitemap-taxonomies-product_tag-1.xml` | 27 |
| `wp-sitemap-taxonomies-pwb-brand-1.xml` | 13 |
| `wp-sitemap-taxonomies-category-1.xml` | 1 |

🟡 **Produkt-taggar (27 st)** indexeras — thin-content-risk. Varje tagg har få produkter (utegrupp, teak, aluminium etc.). Överväg att `noindex`:a `/produkt-tagg/*` via Rank Math.

### llms.txt ✅ OK
- Exists på `/llms.txt`, uppdaterad 2026-04-09.
- Bra innehåll, pekar fortfarande på legacy `/kollektioner/*`-URL:er som är 302-redirect — **uppdatera till `/produkt-kategori/*`** för rena länkar.

---

## 2. Titles & meta descriptions — 🔴 KATASTROFALT

| Sidtyp | Title | Meta description | OG-tags | Rank Math aktivt? |
|---|---|---|---|---|
| Startsida | `Möbelrondellen` | ❌ SAKNAS | ❌ | ❌ |
| `/butik/` | `Webbutik` | ❌ SAKNAS | ❌ | ❌ |
| `/produkt-kategori/vardagsrum/soffor/` | `Soffor` | ❌ SAKNAS | ❌ | ❌ |
| Produkt `/produkt/havanna-2/` | `Havanna` | ❌ SAKNAS | ❌ | ❌ |
| Artikel | `Bokhylla — välj rätt storlek…` | ❌ SAKNAS | ❌ | ❌ |
| `/kontakt/` | `Kontakt` | ❌ SAKNAS | ❌ | ❌ |
| `/hitta-hit/` | `Hitta hit` | ❌ SAKNAS | ❌ | ❌ |

**Data via REST-API bekräftar:**
- 0/20 produkter har `rank_math_title`/`rank_math_description` ifyllt.
- 0/25 produktkategorier har Rank Math-data.
- 0/14 inlägg har Rank Math-data.

Det vill säga: **Rank Math PRO är aktivt men genererar ingenting.** Antingen är general settings inte slutförda, eller auto-templates är tomma.

### Åtgärd — PRIO 1 (1 dag):

1. **Kör Rank Math Setup Wizard** (Dashboard → Rank Math → Setup Wizard) om ej gjort.
2. **Sätt globala templates** i Rank Math → Titles & Meta:
   - **Produkter**: Title = `%title% — %categories% | %sitename%` · Desc = `%excerpt%`
   - **Produkt-kategorier**: Title = `%term% — köp online hos Möbelrondellen i Mora` · Desc = Auto eller manuell short description
   - **Artiklar**: Title = `%title% %sep% %sitename%` · Desc = `%excerpt%`
   - **Sidor**: Title = `%title% — Möbelrondellen i Mora` · Desc = `%excerpt%`
   - **Hem**: Title manuellt: `Möbelrondellen i Mora — kvalitetsmöbler sedan 1990` · Desc manuell.
3. **Sätt noindex på produkt-taggar** för att undvika thin content.
4. **Skriv manuell meta** på topp-10-kategorier och 20 toppsäljande produkter (1 timme per 10 st).

### Exempel på bra title/description-mallar:

| Produkttyp | Title | Description |
|---|---|---|
| Soffa "Havanna" | `Havanna soffa — hörnsoffa med öppet avslut | Möbelrondellen` | `Havanna är en svängd soffa 233×293 cm, vänster/höger, finns i flera tyger. Mycket soffa för pengarna. Fri frakt i Mora-området.` |
| Kategori "Soffor" | `Soffor — köp soffa online eller i butik i Mora` | `Stort urval av soffor för vardagsrummet. Hörnsoffor, 2-sits, 3-sits, tygklädda soffor. Se priser och boka visning i butik.` |
| Kategori "Sängar" | `Sängar — kontinentalsängar, ramsängar & madrasser` | `Kvalitetssängar från ledande varumärken. Se priser och bekväma finansieringsmöjligheter. Leverans i hela Sverige.` |

---

## 3. H1-H3 rubrikstruktur

| Sida | H1 | H2 | H3 | Status |
|---|---|---|---|---|
| Startsida | **0** | 0 | 0 | 🔴 SPA-renderar inget i statisk HTML |
| Artikel | 1 | 9 | 13 | ✅ Bra |
| Kategori `/soffor/` | 1 | 28 | 2 | ✅ OK (varje produkt är H2) |
| `/hitta-hit/` | 1 | 1 | 2 | 🟡 Kan utvidgas |
| `/kontakt/` | 1 | 2 | 2 | ✅ OK |
| Produkt | 1 | 3 | — | ✅ OK |

**Startsida** är React SPA — all text renderas klient-sida. Google kan ranka SPA men **zero static HTML = zero signal för topp-positioner**.

### Åtgärder:
- **Startsida**: Lägg till statiskt H1 + introtext i SPA-shellen (`index.html`) som overrides eller komplement till React.
- Alternativt: server-side render (Netlify/Next migration) — större projekt.
- Minsta fix: H1 + 150-ord SEO-text i `index.html` som React inte tar bort.

---

## 4. Schema markup (JSON-LD)

| Sida | Schema-typer funna | Saknas |
|---|---|---|
| Startsida | **INGET** | Organization, LocalBusiness, WebSite, SearchAction |
| `/butik/` | BreadcrumbList | WebPage, CollectionPage |
| `/produkt-kategori/*/` | BreadcrumbList | CollectionPage, FAQPage |
| `/produkt/havanna-2/` | Product, Brand, Offer, BreadcrumbList, Organization, UnitPriceSpecification | ✅ Fullständig |
| Artikel | **INGET** | Article, BreadcrumbList, FAQPage |
| `/hitta-hit/` | **INGET** | LocalBusiness med openingHours, address, geo |
| `/kontakt/` | **INGET** | ContactPage, LocalBusiness |

### Akuta saknade schemas — PRIO 1:

**A) LocalBusiness på startsida OCH /hitta-hit/ OCH /kontakt/**
```json
{
  "@context": "https://schema.org",
  "@type": "FurnitureStore",
  "name": "Möbelrondellen",
  "description": "Kvalitetsmöbler för hem och kontor i Mora vid Siljan sedan 1990",
  "image": "https://www.mobelrondellen.se/logo.png",
  "telephone": "+46-250-10765",
  "email": "info@mobelrondellen.se",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Skålmyrsvägen 40",
    "postalCode": "792 50",
    "addressLocality": "Mora",
    "addressCountry": "SE"
  },
  "geo": {"@type":"GeoCoordinates","latitude":"61.0066","longitude":"14.5533"},
  "openingHoursSpecification": [
    {"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Wednesday","Thursday","Friday"],"opens":"10:00","closes":"18:00"},
    {"@type":"OpeningHoursSpecification","dayOfWeek":"Saturday","opens":"10:00","closes":"14:00"}
  ],
  "priceRange":"$$",
  "sameAs": ["https://www.facebook.com/mobelrondellen/"]
}
```
Lägg in via Code Snippet på `wp_head` för `is_front_page()`, page `hitta-hit`, page `kontakt`.

**B) Article-schema på blogg**
Rank Math kan generera detta automatiskt om plugin är aktiverat — verifiera att Rank Math Schema är satt till `Article` för Posts.

**C) FAQPage på SEO-texter**
De 10 artiklarna (bokhylla-guide, soffbord-guide, m.fl.) innehåller FAQ-struktur men ingen FAQPage-schema. Lägg till FAQ-block i slutet av varje guide med JSON-LD.

**D) WebSite + SearchAction på hemsida**
```json
{
  "@context":"https://schema.org",
  "@type":"WebSite",
  "url":"https://www.mobelrondellen.se/",
  "potentialAction":{"@type":"SearchAction","target":"https://www.mobelrondellen.se/butik/?s={search_term_string}","query-input":"required name=search_term_string"}
}
```

---

## 5. Canonical, HTTPS & WWW-kanonikalisering

### Duplicate content på domännivå 🔴
Alla 4 URL-varianter svarar 200 OK utan redirect:

| URL | Status |
|---|---|
| `http://mobelrondellen.se/` | 200 |
| `http://www.mobelrondellen.se/` | 200 |
| `https://mobelrondellen.se/` | 200 |
| `https://www.mobelrondellen.se/` | 200 |

Detta = **4 kopior av hela sajten** i Google-index.

**Åtgärd** — `.htaccess` i rotmappen:
```apache
RewriteEngine On
# Tvinga HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://www.mobelrondellen.se/$1 [R=301,L]
# Tvinga www
RewriteCond %{HTTP_HOST} ^mobelrondellen\.se [NC]
RewriteRule ^(.*)$ https://www.mobelrondellen.se/$1 [R=301,L]
```

### Canonical-tag på sidor
| Sida | Canonical |
|---|---|
| Startsida | 🔴 SAKNAS |
| `/butik/` | 🔴 SAKNAS |
| `/produkt-kategori/vardagsrum/soffor/` | 🔴 SAKNAS |
| `/produkt/havanna-2/` | ✅ Finns (WC-default) |
| Artikel | ✅ Finns (WP-default) |
| `/kontakt/` | ✅ Finns |
| `/hitta-hit/` | ✅ Finns |

Rank Math ska generera canonical på ALLA sidor — men gör det inte pga oaktiverat. När Rank Math Titles & Meta aktiveras fixas detta automatiskt.

### HTML lang-inkonsekvens
- Startsida: `<html lang="sv">`
- Övriga: `<html lang="sv-SE">`

Bör vara enhetligt `sv-SE` överallt.

---

## 6. Redirects och 404:or

### 404:or hittade (bör fixas med redirects)
| URL | Status | Borde → |
|---|---|---|
| `/blogg/` | 🔴 404 | 301 → `/category/blogg/` |
| `/blog/` | 🔴 404 | 301 → `/category/blogg/` |
| `/om-oss/` | 🔴 404 | Skapa sidan ELLER 301 → `/kontakt/` |
| `/produkt-kategori/` | 🔴 404 | 301 → `/butik/` |
| `/news/` | 🔴 404 | 301 → `/category/blogg/` |

### 302 → borde vara 301
| URL | Status | Mål |
|---|---|---|
| `/kollektioner/matrumsmobler/` | 🟡 **302** | `/butik/?product_cat=matrum` |
| `/kollektioner/sovrumsmobler/` | 🟡 **302** | `/butik/?product_cat=sovrum` |
| `/kollektioner/utemobler/` | 🟡 **302** | `/butik/?product_cat=utomhus` |

302 = tillfällig = Google överför **INTE** link equity. Ändra till 301 i snippet #7 ("SBS: SPA routes + kollektioner-redirect") genom att byta `Status: 302` → `Status: 301` eller motsvarande PHP-kod.

Dessutom: redirecten pekar på **query-parametrar** (`?product_cat=matrum`) istället för **kanoniska URL:er** (`/produkt-kategori/matrum/`). Bättre att redirecta till:
- `/kollektioner/vardagsrumsmobler/` → `/produkt-kategori/vardagsrum/` (301)
- `/kollektioner/matrumsmobler/` → `/produkt-kategori/matrum/` (301)
- `/kollektioner/sovrumsmobler/` → `/produkt-kategori/sovrum/` (301)
- `/kollektioner/utemobler/` → `/produkt-kategori/utemobler/` (301)

### Artikel-URL:er — datum-struktur är problematisk
Alla artiklar ligger under `/YYYY/MM/DD/slug/`. Alla kortare former (`/slug/`, `/blogg/slug/`) redirectas 301. Det **fungerar** men:
- Datum i URL:er ser daterat ut (t.ex. `/2026/04/12/soffbord-guide-2026/`)
- Sämre UX vid delning
- Föråldringskänsla när artikeln citeras 2027

**Rekommendation**: Ändra WP Permalinks till `/%postname%/` eller `/blogg/%postname%/`. OBS — ändring skapar 404:or för gamla länkar. Rank Math Redirections-modul kan automatskapa 301:or.

---

## 7. Interna & externa länkar

| Sida | Interna länkar (unika) | Externa | Kvalitet |
|---|---|---|---|
| Startsida | **1** | 0 | 🔴 SPA ger inga länksignaler |
| `/butik/` (ej checkat) | ~50 | — | — |
| Artikel | 28 | 3 | ✅ Bra internlänkning |
| `/produkt-kategori/.../soffor/` | 55 | 3 | ✅ Bra (produktgrid) |
| `/hitta-hit/` | 11 | 4 | ✅ OK |
| `/kontakt/` | 11 | 3 | ✅ OK |

**Externa länkar totalt**: Endast till Facebook + Google Maps. Inga spam-länkar, inget behov av `rel=nofollow/sponsored`.

### Internlänkning — brister
- **Startsida → 1 länk** betyder ingen länkdistribution till produkter/kategorier från sajtens starkaste sida.
- **Artikel ↔ kategori/produkt**: 3 artiklar länkar `/hitta-hit/` (bra — fixade 2026-04-13), men få länkar till **kategorisidor** eller **produkter**.
- Orphan-risk: Ingen kollade crawl har gjorts för att hitta sidor utan inkommande länkar, men produkter som inte ligger i populära kategorier kan vara orphans.

### Åtgärder:
1. Lägg kategori-länkar i startsidans shell (statisk HTML) så bots ser dem direkt.
2. I artiklar: Länka till **minst 1 produktkategori + 2 produkter** per artikel från kontextuella ord.
3. Lägg en "Relaterade artiklar"-sektion i artikelmallen.
4. Bygg en **internal linking map**: varje kategori ska länkas från minst 3 ställen (header-meny + startsida + minst 1 artikel).

---

## 8. Bildoptimering (alt-text, storlek)

- Produktsida: 8 bild-taggar, 0 saknade alt-texter ✅
- Startsida: 0 bild-taggar i HTML (SPA) 🔴
- Optimole är aktivt → automatisk WebP-konvertering ✅

**Åtgärd**:
- Verifiera alt-text på de 163 produkterna — WooCommerce-bilder tar alt från media-biblioteket, där många kan sakna alt.
- Script-kontroll: `for id in $(products): if !alt then set alt = product.name`.

---

## 9. Prioriterad åtgärdsplan

### Sprint 1 — 1 dag (maximal impact, låg svårighet)
1. ✅ **Konfigurera Rank Math Titles & Meta** (templates för alla post types)
2. ✅ **Skriv manuell meta på home + 20 toppkategorier/produkter**
3. ✅ **Fixa HTTPS + www 301-redirect** i `.htaccess`
4. ✅ **Uppdatera robots.txt** med disallows + rätt sitemap-URL
5. ✅ **Aktivera Rank Math Sitemap** och radera legacy `/sitemap.xml`
6. ✅ **Ändra 302 → 301** i snippet #7 för `/kollektioner/*`-redirects
7. ✅ **Uppdatera `llms.txt`** med `/produkt-kategori/*` istället för `/kollektioner/*`

### Sprint 2 — 2 dagar (schema + lokala signaler)
8. ✅ **Lägg till LocalBusiness + WebSite + SearchAction schema** på startsida (via Code Snippet)
9. ✅ **Lägg till LocalBusiness schema** på `/hitta-hit/` och `/kontakt/`
10. ✅ **Fixa 404:or**: `/blogg/`, `/om-oss/`, `/produkt-kategori/` (skapa sidor eller redirects)
11. ✅ **Lägg till FAQ-block + FAQPage-schema** i minst 5 toppartiklar
12. ✅ **Skapa /blogg/ blog-indexsida** med nyheter-feed
13. ✅ **Sätt noindex på produkt-taggar** via Rank Math (27 tunna sidor)

### Sprint 3 — 3-5 dagar (SPA-problem + content)
14. 🟡 **Startsida SSR eller statisk HTML-fallback**: H1 + 300-ord SEO-text + 8 kategori-länkar + 6 utvalda produkter som syns för crawlers innan JS kör
15. 🟡 **Permalink-migration** till `/%postname%/` med auto-redirect av gamla datum-URL:er
16. 🟡 **Utöka `/hitta-hit/`** med mer lokal SEO-text (Dalarna, Siljan, besöksregion, leveransområde)
17. 🟡 **Bygg /om-oss/ sida** med företagshistorik sedan 1990
18. 🟡 **Enhetlig `<html lang="sv-SE">`** på alla mallar

### Sprint 4 — löpande
19. 🟢 **Alt-text-audit** på alla 163 produktbilder
20. 🟢 **Internlänkningsplan**: mål = varje produktkategori har 5+ interna länkar
21. 🟢 **Content-strategi**: 2-3 artiklar/vecka (redan etablerat flöde)
22. 🟢 **Backlink-prospektering**: lokala Dalarna-sajter, möbelbloggar, hemsidor inom inredning

---

## 10. Förväntad SEO-effekt

| Åtgärd | Förväntad effekt | Tidshorisont |
|---|---|---|
| Rank Math metadata (titlar + desc) | +20-40% CTR från SERP | 2-4 veckor |
| HTTPS/www 301 | Slå ihop 4 domän-varianter i Google-index, Page Authority konsolideras | 4-8 veckor |
| LocalBusiness schema | Rich snippets + Google Maps synlighet för "möbelaffär Mora", "möbler Mora" | 4-12 veckor |
| FAQ-schema på artiklar | FAQ-rich results i SERP → +5-15% CTR | 2-6 veckor |
| Startsida SSR + H1 + text | Möjliggör ranking på "möbelaffär i Mora", "möbler Dalarna" | 8-16 veckor |
| 404-fix + 301:or till 301 | Linkequity-bevaring, färre crawl-fel i GSC | Omedelbar |

---

## 11. Klarlagda fel som **INTE** är SEO-problem
- ✅ HTTPS fungerar (certifikat giltigt)
- ✅ Mobiloptimering (Kadence/custom tema är responsivt)
- ✅ WCAG-basics (alt-texter på produkter, rubrikhierarki)
- ✅ BreadcrumbList-schema på produkter + kategorier
- ✅ Produkt-schema med alla fält (Offer, Brand, Organization, etc.)
- ✅ Optimole automatisk bildoptimering (WebP, srcset)
- ✅ Ingen uppenbar thin content på produkter (bra beskrivningar)
- ✅ Ingen keyword-cannibalization upptäckt (interlinking-fixen 2026-04-13 löste `/hitta-hit/` vs artiklar)

---

## Nästa steg — vad kör vi först?

**Rekommendation**: Starta med Sprint 1 redan imorgon. Rank Math-fixen + robots/sitemap + 301:er tar ~4 timmar och ger omedelbara resultat i GSC. Schema + LocalBusiness kan köras nästa dag.

**Beslutpunkter att ta med Mattias:**
1. OK att ändra permalink-struktur till `/%postname%/`? (kräver 301-mapping för äldre länkar)
2. Ska vi bygga ny `/om-oss/`-sida eller 301:a till `/kontakt/`?
3. Ska SPA-startsidan få en riktig HTML-fallback, eller behåller vi React-only?
