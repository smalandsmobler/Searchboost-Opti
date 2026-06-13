# Ilmonte SEO-audit 2026-04-18

**Datum**: 2026-04-18 (post-Loopia-migration, post-malware-cleanup)
**Miljö**: Loopia (nginx + PHP 8.2.30), Let's Encrypt SSL t.o.m. 2026-06-21
**Omfattning**: On-page, tekniskt, schema, crawl-direktiv, redirects (e-handel-varsam)

---

## TL;DR — prioriterade åtgärder

🔴 **Akut (blockar SEO idag)**
1. **H1 saknas på 5 av 6 toppsidor** (/, /butik/, /om-oss/, /kopvillkor/, /pdf-information/)
2. **Produktschema trasigt**: Rank Math skickar bara `ProductGroup`, saknar `Product`+`Offer`+`price`+`brand` → Googles "Säljaruppgifter"-alert
3. **llms.txt har 2 döda länkar**: `/ilmoshop/` + `/ljudklasser-for-textil/` → bryter förtroendet mot LLM-agenter

🟡 **Viktigt**
4. Title + meta desc på startsidan saknar svenska tecken (a, o istället för ä, ö)
5. Title inkonsistens mellan `<title>` och `og:title`
6. Duplicerad Organization-schema (Rank Math + manuell Code Snippets)
7. Säkerhetsheaders saknas (HSTS, X-Frame-Options, Referrer-Policy)
8. /kontakt/ H1 säger "Kontakta AB ilmonte" (gammalt namn)

🟢 **Observationer (positivt)**
- robots.txt korrekt uppbyggd, blockerar skräpbots och rätt URL-mönster
- Sitemap_index.xml fungerar (797 URLs totalt — 28 posts + 6 pages + 731 produkter + 1 local)
- llms.txt finns (sällsynt bra) — men innehåller döda länkar
- GSC-verifierad via meta-tag (`BgDe1kX6qRMxNEQUtj_godpmXB1gRakhDk4g-wEZEeE`)
- Wordcount på alla toppsidor > 900 ord
- SSL Let's Encrypt, nginx, PHP 8.2.30 (aktuellt)

---

## 1. Crawl-direktiv

### robots.txt — ✅ BRA
```
User-agent: Baiduspider, AhrefsBot, MJ12bot, BLEXBot, DotBot, SemrushBot, YandexBot → Disallow: /
User-agent: *
Allow: /
Disallow: /wp-admin/, /wp-login.php, /?s=, /varukorg/, /kassan/, /mitt-konto/, /?add-to-cart=
Sitemap: https://ilmonte.se/sitemap_index.xml
```
Inga ändringar behövs. Matchar SOPen från `feedback_kundnotiser.md`.

### sitemap_index.xml — ✅ BRA
| Sitemap | URLs | Senast uppdaterad |
|---------|------|-------------------|
| post-sitemap.xml | 28 | 2026-04-16 |
| page-sitemap.xml | 6 | 2026-04-16 |
| product-sitemap1.xml | 201 | 2026-04-05 |
| product-sitemap2.xml | 200 | 2026-02-26 |
| product-sitemap3.xml | 200 | 2026-02-24 |
| product-sitemap4.xml | 130 | 2026-01-22 |
| local-sitemap.xml | 1 | 2026-04-17 |
| blocks-sitemap.xml | 3 | 2025-01-23 |

**Totalt: 769 indexerbara URLs.** Rank Math-genererad.

### llms.txt — 🟡 Fungerar men har döda länkar
- ✅ Finns (sällsynt fördel)
- ⛔ `/ilmoshop/` → 404
- ⛔ `/ljudklasser-for-textil/` → 404
- ✅ Övriga 7 länkar OK

---

## 2. On-page SEO (toppsidor)

### H1-audit — 🔴 KRITISKT
| Sida | H1 | Wordcount |
|------|------|-----------|
| / | ⛔ **SAKNAS** | 1102 |
| /butik/ | ⛔ **SAKNAS** | 900 |
| /om-oss/ | ⛔ **SAKNAS** | 1243 |
| /kontakt/ | ⚠️ "Kontakta AB ilmonte" (gammalt namn) | 1142 |
| /kopvillkor/ | ⛔ **SAKNAS** | 1511 |
| /pdf-information/ | ⛔ **SAKNAS** | — |

Första H2 på startsidan är "Välkommen till Eventinredning & eventmöbler för företag" — borde promoteras till H1.

### Title + meta (startsida) — 🟡 Behöver normaliseras
| Element | Innehåll |
|---------|----------|
| `<title>` | `Eventinredning och eventmobler for foretag \| Il Monte` ← **saknar ä/ö** |
| `og:title` | `Eventinredning & eventmöbler \| Ilmonte` ← **korrekt** |
| `<meta name="description">` | `Il Monte ar Sveriges ledande leverantor...` ← **saknar ä/ö** |
| `og:description` | `Komplett leverantör av eventinredning...` ← **korrekt** |
| Canonical | `https://ilmonte.se/` ✅ |

**Åtgärd**: `<title>` + `meta description` ska matcha og-varianterna (med korrekta svenska tecken och "Ilmonte" i ett ord).

### Rubrikstruktur — 🟡 Widget-cruft
Förekommer på många sidor som H2/H3 men ska inte vara i heading-hierarkin:
- "Logga in" (H2)
- "Registrera" (H2)
- "För alla tillfällen" (H3)
- "Läs mer" (H3)

Dessa ska flyttas till paragraph + CSS-class, eller stängas av i widget-inställningarna.

---

## 3. Schema markup

### Startsidan — 🟡 Duplikat
**Block 1 (Rank Math automatisk)**: Organization + WebSite + ImageObject + WebPage + Person + Article
**Block 2 (Code Snippets manuell)**: Organization + LocalBusiness

Resultat: duplicerad Organization-entitet. Code Snippets-varianten har dessutom fel Facebook-URL (enligt gammal audit).

**Åtgärd**: Radera manuell Code Snippets Organization, behåll LocalBusiness (eller lägg LocalBusiness via Rank Math).

### Produktsida (exempel: `/produkt/corfu-bomullsmatta-bredd-300-cm/`) — 🔴 TRASIGT
**Vad som faktiskt finns**: `Organization`, `WebSite`, `ImageObject`, `WebPage`, `ProductGroup`
**Vad som saknas för Merchant Listings**:
- `Product` (eller `Product`-variant med @id-koppling till ProductGroup)
- `Offer` med `price`, `priceCurrency`, `availability`
- `brand`
- `aggregateRating` (om recensioner finns)

Detta är EXAKT anledningen till Googles "Säljaruppgifter — strukturerad data"-alert som Dajana fick 2026-04-18 08:31.

**Åtgärd**: Rank Math → WooCommerce-schema-inställningar. Kontrollera att "Product" + "Offer" är aktiverade. Eller fixa manuellt via `rank_math_product_data`-filter.

---

## 4. Redirects (e-handel)

Testade kritiska URLs — alla redirect-kedjor är rena (max 2 hopp):

| URL | Status | Notering |
|-----|--------|----------|
| `/product/[slug]/` → `/produkt/[slug]/` | 301 → 200 | ✅ OK från tidigare permalink-fix |
| `/butik` → `/butik/` | 301 → 200 | ✅ trailing slash |
| `/kassan` → `/kassan/` → `/varukorg/` | 301 → 302 → 200 | ✅ WC-standard vid tom cart |
| `/kassa` → `/kassan/` → `/varukorg/` | 301 → 302 → 200 | ✅ svensk alias |
| `/ilmoshop/` | **404** | ⛔ var live före cleanup, page 14689 raderad |
| `/produkt/` (utan slug) | 404 | ⚠️ överväg 301 → /butik/ |
| `/produkt-kategori/mattor/` | 404 | Kategori finns som `/mattor-for-dans-och-event-2/` |

**Broken-link-risk**:
- `/ilmoshop/` existerar i llms.txt och sannolikt externa backlinks. Skapa 301 → `/butik/`.
- `/ljudklasser-for-textil/` i llms.txt. Skapa 301 → `/ljudklasser-event-konferens-textil-akustik/` (närmaste guide).

**Inga befintliga redirects får röras utan kontroll** — e-handel är känsligt.

---

## 5. Säkerhetsheaders — 🟡 Saknas

| Header | Status | Rekommendation |
|--------|--------|----------------|
| Strict-Transport-Security (HSTS) | ⛔ Saknas | `max-age=31536000; includeSubDomains; preload` |
| X-Frame-Options | ⛔ Saknas | `SAMEORIGIN` |
| X-Content-Type-Options | ⛔ Saknas | `nosniff` |
| Referrer-Policy | ⛔ Saknas | `strict-origin-when-cross-origin` |
| Permissions-Policy | ⛔ Saknas | `camera=(), microphone=(), geolocation=()` |
| Content-Security-Policy | 🟡 Delvis | `upgrade-insecure-requests` finns, men ingen full CSP |
| x-powered-by: PHP/8.2.30 | ⚠️ Exponerad | Göm via nginx `fastcgi_hide_header` eller `expose_php = Off` |

Kräver nginx/server-access eller plugin (t.ex. Really Simple SSL Pro, eller add_header via WP-plugin).

---

## 6. Pages-status

### Publicerade pages (10 st):
- [13581] /hem-2/ — "Eventinredning & eventmöbler för företag | Ilmonte" (shown as /)
- [8] /butik/ — "Alla produkter"
- [9] /varukorg/
- [10] /kassan/ — "Till kassan"
- [11] /mitt-konto/
- [20] /kopvillkor/
- [22] /nyheter/ — saknas i page-sitemap (troligen noindex)
- [24] /pdf-information/
- [26] /om-oss/
- [28] /kontakt/

### Saknade pages (raderade eller bytt slug):
- `/ilmoshop/` (var page 14689) — ⛔ raderad, 404
- `/tillbehorsshop/` (var page 13814) — ⛔ raderad
- `/ljudklasser-for-textil/` — ⛔ 404 (ersatt av `/ljudklasser-event-konferens-textil-akustik/` som blog-post?)
- `/ilmofurniture/` (var page 15408) — ⛔ raderad
- Alla Flatsome demo-pages — ✅ raderade enligt plan

---

## 7. Åtgärdsplan — prioriterad

### Fas 1 (kan göras nu, låg risk)
1. Uppdatera `llms.txt` — ta bort döda länkar
2. Uppdatera `robots.txt` — lägg till explicit `Disallow: /wp-json/` (om ej publikt) och säkerställ sitemap-URL
3. Lägg till 301-redirects: `/ilmoshop/` → `/butik/`, `/ljudklasser-for-textil/` → `/ljudklasser-event-konferens-textil-akustik/`
4. Normalisera startsida title + meta description (lägg in svenska tecken)
5. GSC-verifiering: meta-tag finns redan, lägg till sitemap i Search Console

### Fas 2 (kräver content-edit, medium risk)
6. Lägg H1 på alla toppsidor (/, /butik/, /om-oss/, /kopvillkor/, /pdf-information/)
7. Uppdatera /kontakt/ H1 från "Kontakta AB ilmonte" till "Kontakta Ilmonte"
8. Ta bort duplicerad Organization-schema från Code Snippets
9. Flytta widget-rubriker ("Logga in", "Registrera") ur heading-struktur

### Fas 3 (kräver WC/plugin-access, high impact)
10. **Fixa produktschema** — aktivera Product+Offer i Rank Math WooCommerce-integration (löser GSCs Merchant Listings-alert)
11. Lägg BreadcrumbList-schema på alla sidor

### Fas 4 (kräver server-access)
12. Lägg till säkerhetsheaders (HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
13. Göm `x-powered-by`

---

## 8. GSC-uppföljning

Google Search Console är redan verifierad via meta-tag (`BgDe1kX6qRMxNEQUtj_godpmXB1gRakhDk4g-wEZEeE`).

**Nästa steg i Search Console**:
- Lägg till sitemap: `https://ilmonte.se/sitemap_index.xml`
- Ta bort Dajana Tolic som användare (se task-fil — akut)
- Kontrollera "Säljaruppgifter"-problemet efter produktschema-fix (Fas 3, #10)
- Månadsrapport 2026-05-05: ranking-rörelser för A-tier keywords

---

**Rapport skapad**: 2026-04-18
**Ansvarig**: Searchboost Opti
**Nästa review**: efter Fas 3 genomförd (produktschema-fix)
