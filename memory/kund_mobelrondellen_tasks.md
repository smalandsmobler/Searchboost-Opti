---
name: Möbelrondellen tasks
description: Möbelrondellen task-checklista
type: project
---

# Möbelrondellen — Tasks

**Status**: Aktiv
**Kontakt**: Mattias (mattias@mobelrondellen.se)
**Site**: https://mobelrondellen.se (React SPA + WP/WooCommerce hybrid, Sucuri WAF)

## Nästa steg
- [ ] Mattias: ladda upp leverantörsbilder som kategori-thumbnails (matmöbler, sängar)
- [ ] Nästa batch artiklar vecka 21

## Klart 2026-04-16
- [x] **Info-box "Normalt lagervara"** tillagd på produktsidor via Code Snippet #55. Hakar in på `woocommerce_single_product_summary` priority 25.
- [x] **Komplett SEO-audit 2026-04-16** — `presentations/mobelrondellen-seo-audit-2026-04-16.md`.
- [x] **SEO-audit Sprint 1+2+3 deployat 2026-04-16**: 11 nya/uppdaterade Code Snippets (#55-70) + ny `/om-oss/` (ID 5340) + rewritten `.htaccess`, `robots.txt`, `llms.txt`, `index.html`. Se `presentations/mobelrondellen-seo-fixes-deployed-2026-04-16.md` för full lista.
  - **Custom meta output** (snippet #64, aktivt): title/desc/OG/Twitter/canonical för home/shop/product/product_cat/category/brand/post/page — ersätter Rank Math Frontend som inte laddas (plugin-bugg).
  - **LocalBusiness + WebSite schema** (snippet #58, aktivt): FurnitureStore på home/kontakt/hitta-hit/oppettider/leveranser/om-oss. WebSite+SearchAction på home.
  - **FAQ schema + synlig FAQ-sektion** (snippet #70, aktivt): på 3 toppartiklar (bokhylla 5294, tv-bänk 5293, köp madrass 5291) med 4 Q&A var.
  - **.htaccess omskriven** (snippet #66, one-shot): HTTPS+www 301, `/kollektioner/*` → `/produkt-kategori/*` 301, `/blogg/`+`/blog/`+`/news/` → `/category/blogg/` 301, `/produkt-kategori/` → `/butik/` 301. Backup sparad som `.htaccess.bak-YYYYMMDD-HHMMSS`.
  - **robots.txt** (snippet #68): nytt med Disallow för wp-admin/cart/checkout/mitt-konto/sök-params/filter/produkt-tagg. Pekar nu på `/wp-sitemap.xml` + `/sitemap_index.xml`. Legacy static `/sitemap.xml` raderad.
  - **llms.txt** (snippet #9+#67): alla `/kollektioner/*` URL:er ersatta med `/produkt-kategori/*`. Fler kategorier listade.
  - **index.html (home)** (snippet #69, one-shot): enriched med meta description, OG, Twitter, canonical, WebSite + FurnitureStore JSON-LD schema. Body har nu H1 "Möbelrondellen i Mora", H2, 4 kategori-kort, intro-text och kontaktinfo (synligt för bots innan React tar över). HTML lang satt till `sv-SE`.
  - **Rank Math templates + wizard** (snippet #56 #62, one-shot): konfig sparad i options (homepage/product/category/brand templates) + setup wizard markerad complete. OBS: Rank Math Frontend modulen laddas fortfarande inte (bug i Registration-gating). Mikael kan klicka igenom wp-admin för att slutföra aktivering senare — templates är då redo att användas.
  - **/om-oss/** (page ID 5340): ny sida med innehåll om företaget sedan 1990, kategorilänkar, CTA till butik/kontakt.
  - **Noindex för thin content**: produkt-tagg, post-tag, author, date, search, 404 — via Rank Math templates + min egen wp_head snippet för säkerhets skull.
  - **Shop (/butik/)**: custom title "Webbutik — alla möbler | Möbelrondellen i Mora" + description.
  - **Active snippets efter cleanup**: #55 (lagervara info-box), #58 (schema), #64 (meta output), #70 (FAQ). Alla one-shot:ar (#56, #57, #62, #66, #67, #68, #69) deactiverade men kvar.
- **Fortfarande kvar**: Alt-text audit på 163 produktbilder. Permalink-migration från `/YYYY/MM/DD/slug/` till `/%postname%/` (kräver Mikaels godkännande då det bryter befintliga länkar).

## Klart 2026-04-14 (kväll — avslut)
- [x] **Footer** 3-kolumns layout (Snippet #46 v3): Möbelrondellen | Kontakt | Öppettider
- [x] **Junk-sidor rensade**: under-bearbetning, quiz, 3 tomma blogginlägg → draft
- [x] **Header alignment CSS** tillagd i snippet #42 — logo + sökfält vertikalt centrerade
- [x] **Respira-beroenden verifierade**: Allt i Code Snippets + WP REST — Respira kan tas bort
- [x] Snippet #42 (design) active ✓ | Snippet #45 (brand) active ✓ | Snippet #46 (footer) active ✓

## Klart 2026-04-14 (WP-sidor ombyggda)
- [x] **6 statiska sidor ombyggda** med clean modern HTML via WP REST API:
  - Kontakt (ID:325): 2-kolumn CF7-form + adresskort
  - Öppettider (ID:16): 2 kort — normala tider + storhelger med tabeller
  - Hitta hit (ID:330): adresskort + Google Maps iframe + vägbeskrivning-länk
  - Leveranser (ID:20): 6 priskort per region (Mora, Älvdalen, Rättvik, Malung, Idre + gratis släplån)
  - Delbetalning (ID:18): krav-lista + 4 betalningsalternativskort + Ansök-knapp → apply.resurs.com/QP6F9
  - Varumärken (ID:1948): 18-varumärkesgrid med design system-styling
- [x] **Font fix**: `*{font-family:inherit!important}` tillagd i snippet #42 → Inter cascadar till ALLA element
- [x] **Banner full-width fix**: `.woocommerce-products-header` får `width:calc(100%+48px);margin-left:-24px` → bryter ut ur site-main padding
- [x] Sidebar fix: `body.mr-wc-page aside.widget-area{float:none;width:100%}` i snippet #42

## Klart 2026-04-14 (WP-design ombyggnad)
- [x] **CSS design system injekterat** via Code Snippets #42 (global scope)
  - Inter + Playfair Display fonts via Google Fonts
  - Primary color: #b5203c (burgundy) på priser, badges, knappar, breadcrumbs
  - Product grid: auto-fill minmax(260px, 1fr), gap 28px, rounded cards
  - Hover effects: bild zoom scale(1.06) + card lift translateY(-4px) + shadow
  - Button hover: darker #8f192f + glow box-shadow rgba(181,32,60,.40)
  - `.btn-product-read-more` (custom theme class) inkluderad i button-selectors
  - Footer: dark #1a1a1a, Inter text, burgundy link hover
  - Forms: border-radius, focus glow i burgundy
  - Responsive: 2-col grid på tablet, 1-col på mobil
- [x] **Lazy loading**: native WP wp_lazy_loading_enabled=true (Optimole CDN hanterar resten)

## Klart 2026-04-14
- [x] **"Utforska sortimentet"-fix**: Capture-fas click-interceptor tillagd i `assets/img-updater.js` — intercepts React Router-klick och tvingar riktig sidnavigering → snippet #7 PHP-redirect körs → `/butik/?product_cat=...`
- [x] **Bildcachning fix**: Snippet #19 uppdaterad med `rest_pre_serve_request` + PHP `header()` direkt → API returnerar nu `Cache-Control: no-store, no-cache, must-revalidate, max-age=0` (verifierat)
- [x] **index.html rekonstruerad**: Råkade tömmas under diagnostik, återställd med korrekt React-bundle-referens + img-updater.js

## Klart 2026-04-13 (internlänkar — kannibalisering)
- [x] Internlänkar tillagda i 3 artiklar → primary `/hitta-hit/` (möbelaffär i Mora):
  - ID:5294 /bokhylla-guide-2026/ — H2-rubrik + intro-stycke länkade med anchor "Möbelrondellen i Mora"
  - ID:5293 /tv-bank-guide-2026/ — H2-rubrik + intro-stycke länkade med anchor "Möbelrondellen i Mora"
  - ID:5291 /kopa-madrass-guide-2026/ — H2-rubrik + intro-stycke länkade med anchor "Möbelrondellen i Mora"
  - Strategi: secondary-artiklarna signalerar nu tydligt till Google att `/hitta-hit/` är primary för lokala sökord

## Klart 2026-04-13 (vecka 20)
- [x] 3 artiklar publicerade vecka 20 (kat ID:113 Blogg):
  - ID:5292 /kopa-madrass-guide-2026-2/ (focus: köpa madrass guide)
  - ID:5293 /tv-bank-guide-2026/ (focus: tv-bänk guide)
  - ID:5294 /bokhylla-guide-2026/ (focus: bokhylla välja)

## Klart 2026-04-12 (kväll)
- [x] 3 artiklar publicerade vecka 19 (kat ID:113 Blogg):
  - ID:5288 /baddsoffa-guide-2026/ (focus: bäddsoffa)
  - ID:5289 /fatol-vardagsrum-guide/ (focus: fåtölj vardagsrum)
  - ID:5290 /soffbord-guide-2026/ (focus: soffbord)

## Klart 2026-04-12
- [x] 3 artiklar publicerade vecka 18 (kat ID:113 Blogg):
  - ID:5285 /kopa-soffa-guide-2026/ (focus: köpa soffa)
  - ID:5286 /sang-guide-2026-madrass-sangram/ (focus: köpa säng)
  - ID:5287 /inreda-vardagsrum-tips/ (focus: inreda vardagsrum)

## Klart 2026-04-10
- [x] 3 artiklar publicerade (Blogg, kat ID:113):
  - ID:5282 /soffgrupper-2026-stor-guide-till-soffa-och-soffbord-for-vardagsrummet/
  - ID:5283 /kontorsstol-2026-vad-du-ska-tanka-pa-nar-du-koper-kontorsstol/
  - ID:5284 /matgrupp-guide-till-ratt-matbord-och-stolar-for-koket/

## Mail skickat 2026-04-10
- [x] Mail till Mattias: förklarat bilduppdatering (kategori-thumbnails i WP) + bekräftat att "Utforska sortimentet"-knappen är fixad med 301-redirects

## Arkitektur — klarlagt 2026-04-10
- React SPA fetchar redan LIVE från WP REST API (`/wp-json/wp/v2/product?product_cat=...`)
- Kategori-korten visar featured image på produkterna i respektive kategori (dynamiskt från WP)
- "F5 krävs" = browser cachade API-svaret → FIXAT: snippet #19 sätter `Cache-Control: no-store` på `/wp/v2/product` endpoints
- `/images/category-*.jpg` = React placeholder-bilder som visas under < 1 sek medan API:t laddar (ofarliga, behöver ej bytas)
- Sucuri WAF strippar inline `<script>` och `<script src>` som lagts till i index.html — script-injection-approach fungerar ej
- Snippet #18 (cat-images endpoint) och snippet #17 (writefile) kan ligga kvar som infrastruktur

## Klart 2026-04-10
- [x] "Utforska sortimentet"-knappen fixad — /kollektioner/* redirectar 301 → /butik/?product_cat= med slug-mappning (snippet 7)
- [x] Bilder-caching fixad — snippet #19 sätter no-cache headers på `/wp/v2/product` REST API så nya bilder syns direkt utan F5
- [x] Arkitektur kartlagd: bilder är redan dynamiska från WP REST API (inte hårdkodade i bundle)

## Klart tidigare
- [x] Kontakt-sidan CF7 honeypot borttaget
- [x] Varumärken-sidan grid av 18 varumärken via SiteOrigin PB
- [x] SPA restore + .htaccess hybrid routing
- [x] Hummingbird cache av (var cached stale content)

## Arkitekturproblem (dokumenterat)
SPA (React) = startsida + kollektions-vyer hårdkodade med bilder i JS-bundle.
WP/WooCommerce = produkter, kategorier, artiklar, kontakt.
Ny bild i WP → syns inte på startsidan förrän JS-bundlen byggs om.
Fix: konvertera SPA att fetch:a bilder från WP REST API vid runtime.

## Referenser
- `kunder.md`
