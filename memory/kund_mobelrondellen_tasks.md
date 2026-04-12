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
