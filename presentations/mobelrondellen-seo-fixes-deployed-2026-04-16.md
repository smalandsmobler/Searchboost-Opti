# Möbelrondellen — SEO-fixar deployade
**Datum:** 2026-04-16
**Referens:** `presentations/mobelrondellen-seo-audit-2026-04-16.md`

## Hälsa — före vs efter

| Område | Före | Efter |
|---|---|---|
| Startsida title | `Möbelrondellen` | `Möbelrondellen i Mora — kvalitetsmöbler sedan 1990` |
| Startsida meta description | ❌ saknas | ✅ 170 tecken |
| Startsida H1 för bots | ❌ saknas | ✅ "Möbelrondellen i Mora" |
| Startsida schema | ❌ inget | ✅ WebSite + FurnitureStore + SearchAction |
| Produkt title | `Havanna` | `Havanna — Soffor, Vardagsrum \| Möbelrondellen` |
| Produkt meta description | ❌ saknas | ✅ från short_description + boilerplate |
| Kategori title | `Soffor` | `Soffor — köp online eller i butik \| Möbelrondellen i Mora` |
| Shop title | `Webbutik` | `Webbutik — alla möbler \| Möbelrondellen i Mora` |
| OG + Twitter tags | ❌ saknas | ✅ alla page types |
| HTTPS/www 301 | ❌ 4 varianter 200 OK | ✅ alla varianter 301 till `https://www.mobelrondellen.se/` |
| `/blogg/` `/blog/` `/news/` | 🔴 404 | ✅ 301 → `/category/blogg/` |
| `/om-oss/` | 🔴 404 | ✅ 200 (ny sida) |
| `/produkt-kategori/` | 🔴 404 | ✅ 301 → `/butik/` |
| `/kollektioner/*` | 🟡 302 → `?product_cat=X` | ✅ 301 → `/produkt-kategori/X/` |
| LocalBusiness schema | ❌ | ✅ på home/kontakt/hitta-hit/oppettider/leveranser/om-oss |
| FAQ schema | ❌ 0 artiklar | ✅ 3 artiklar (bokhylla, tv-bänk, madrass) |
| robots.txt | pekade på legacy sitemap | ✅ disallow cart/checkout/tags + rätt sitemap |
| llms.txt | `/kollektioner/*` redirecting URL:er | ✅ `/produkt-kategori/*` + fler kategorier |

---

## Ändringsdetaljer — per snippet

### Code Snippets (Möbelrondellen WP)

| # | Namn | Status | Funktion |
|---|---|---|---|
| 55 | MR: Normalt lagervara info-box | aktiv | Info-box under pris på produktsidor |
| 56 | MR SEO: Rank Math templates config | **inaktiv** (one-shot klar) | Sparade titlar/desc/noindex i `rank_math_titles` option |
| 57 | MR SEO: Force HTTPS + www 301 | **inaktiv** (ersatt av .htaccess) | PHP-baserad 301 — redundant nu |
| 58 | MR SEO: LocalBusiness + WebSite schema | aktiv | JSON-LD schema output på home/kontakt/hitta-hit/oppettider/leveranser/om-oss |
| 62 | MR SEO: Rank Math wizard complete | **inaktiv** (one-shot klar) | Markerade wizard_completed=1 + satte general-options |
| 64 | MR SEO: Custom meta output | aktiv | Genererar title/desc/OG/Twitter/canonical för alla WP-page types (home, shop, product, product_cat, category, brand, post, page) + noindex för tag/search/404/author/date |
| 66 | MR SEO: Update .htaccess rewrites | **inaktiv** (one-shot klar) | Skrev ny .htaccess med HTTPS/www 301, /kollektioner/→/produkt-kategori/ 301, 404-fixar |
| 67 | MR SEO: Rewrite llms.txt file | **inaktiv** (one-shot klar) | Uppdaterade fysiska `/llms.txt` med nya URL:er |
| 68 | MR SEO: Write new robots.txt | **inaktiv** (one-shot klar) | Skrev ny `/robots.txt` med disallows + rätt sitemap |
| 69 | MR SEO: Enrich index.html for bots | **inaktiv** (one-shot klar) | Skrev ny `/index.html` med rich meta + JSON-LD + H1/H2/content för bots |
| 70 | MR SEO: FAQPage schema on top articles | aktiv | JSON-LD FAQPage + synlig FAQ-sektion på artiklar 5294, 5293, 5291 |

**Backup av .htaccess**: `/.htaccess.bak-20260416-HHMMSS` (sparat automatiskt innan skrivning)

---

## Kvar enligt auditrapporten — ej klart ännu

- [ ] **Alt-text audit** på alla 163 produktbilder (kräver stickprov → scripta bulk-fix)
- [ ] **Permalink-migration** `/YYYY/MM/DD/slug/` → `/%postname%/` (kräver Mikaels OK, potentiellt störande)
- [ ] **Rank Math Frontend aktivering** — Mikael kan klicka igenom wp-admin/Rank Math för att aktivera dess frontend. Templates är redan konfigurerade; när Rank Math tar över kan min snippet #64 inaktiveras.
- [ ] **FAQ schema på fler artiklar** — Börjat med 3, resterande ~11 artiklar kan ta samma mönster.
- [ ] **Backlink-prospektering** — Dalarna-lokala sajter, möbelbloggar (löpande arbete)

---

## Förväntad SEO-effekt — tidslinje

| Åtgärd | Förväntad effekt | Tidshorisont |
|---|---|---|
| Rich meta + OG | +20-40% CTR i SERP | 2-4 veckor |
| HTTPS/www 301 | Konsoliderar 4 varianter → 1 kanonisk URL, Page Authority överförs | 4-8 veckor |
| LocalBusiness schema | Rich snippets + Maps synlighet för "möbelaffär Mora", "möbler Dalarna" | 4-12 veckor |
| FAQ-schema på 3 guider | FAQ-rich results, +5-15% CTR på de sidorna | 2-6 veckor |
| Home H1+H2+text+schema | Ranking på "möbelaffär i Mora", "möbler Mora" | 8-16 veckor |
| 404-fixar + /blogg/-redirect | Link equity från gamla länkar | Omedelbart |
| /kollektioner/→/produkt-kategori/ 301 | Flyttar ranking från gamla URL:er till kanoniska | 4-12 veckor |
| noindex på product-tagg | Minskar thin content, Google-budget flyttas till produkter | 2-4 veckor |

---

## Verifieringskommandon

```bash
# Kolla title+desc på alla viktiga URL:er
for url in "/" "/butik/" "/produkt-kategori/vardagsrum/soffor/" "/produkt/havanna-2/" "/kontakt/" "/om-oss/"; do
  curl -sL "https://www.mobelrondellen.se${url}" | grep -oE '<title>[^<]+|<meta name="description"[^>]+' | head -2
  echo ""
done

# Kolla att alla redirects är 301
for url in "http://mobelrondellen.se/" "https://www.mobelrondellen.se/kollektioner/matrumsmobler/" "https://www.mobelrondellen.se/blogg/"; do
  curl -sI -o /dev/null -w "%{http_code}\t$url\n" "$url"
done

# Kolla schema
curl -sL "https://www.mobelrondellen.se/" | grep -oE '"@type":"[A-Za-z]+"' | sort -u
```
