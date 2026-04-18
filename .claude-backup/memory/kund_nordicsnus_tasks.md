---
name: Nordic Snus Online tasks
description: Nordic Snus Online task-checklista
type: project
originSessionId: 63fdf8cc-30f5-498e-8229-aa4f52589808
---
# Nordic Snus Online — Tasks

**Status**: Premium (8000 kr/mån), AI-sök som enda kanal
**Site**: nordicsnusonline.com
**Nyckelvinkel**: Kan ej Google Ads/Meta → AI-sök-optimering är hela produkten
**Kontraktstart**: 2026-02-27
**Fakturering**:
- Feb 2026: 27-28 feb = 2 dagar (2/28 × 8000 = ~571 kr)
- Mars 2026: hel månad = 8 000 kr
- Apr 2026: löpande = 8 000 kr/mån
- **Skyldig per 2026-04-12**: ca 16 571 kr (feb delvis + mars + apr löpande)

## Nästa steg
- [ ] Lägg till SA `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com` som Fullständig i GSC → gå till https://search.google.com/search-console/users?resource_id=https%3A%2F%2Fnordicsnusonline.com%2F → Lägg till användare
- [ ] ABC-keywords
- [ ] Registrera i customer_pipeline
- [ ] Lägg in contact-email i SSM
- [ ] Nästa artikelbatch (vecka 22): Siberia guide, Odens, Velo, snus utan tobak, snus-tillbehör

## Klart 2026-04-16 (vecka 21)
- [x] Meta-sweep 21 svenska posts — alla hade redan manuellt satta Rank Math title+description (rört ej enligt SOP)
- [x] 2 nya artiklar publicerade (via /sv/ WPML):
  - ID:23723 /sv/snus-for-nyborjare-guide-2026/ (focus: snus för nybörjare) — TL;DR + 7 FAQ + 5 interna länkar
  - ID:23724 /sv/zyn-nikotinpasar-guide-smaker-styrkor/ (focus: zyn nikotinpåsar) — TL;DR + 7 FAQ + 5 interna länkar
- [x] Rank Math-meta satt via `/rankmath/v1/updateMeta` (standard `meta`-fältet i REST fungerar EJ för rank_math_* — krävs Rank Math-endpoint)
- [x] Arbete loggat i Opti (3 entries)

**VIKTIGT att komma ihåg**:
- REST API kräver `/sv/wp-json/` prefix för WPML sv-content (inte bara `?lang=sv`)
- X-WP-Total för `/wp-json/wp/v2/posts` = 0 (WPML filtrerar), men `/sv/wp-json/wp/v2/posts` = 21
- Rank Math-meta måste sättas via Rank Math:s egen REST endpoint (`/rankmath/v1/updateMeta`) — `wp/v2/posts` meta-fält registrerar dem inte

## Klart 2026-04-13 (vecka 20)
- [x] 3 artiklar publicerade vecka 20 (via /sv/ WPML):
  - ID:23716 /sv/general-snus-guide/ (focus: General snus guide)
  - ID:23717 /sv/los-snus-guide-2026/ (focus: lös snus)
  - ID:23718 /sv/kopa-snus-online-guide/ (focus: köpa snus online)

## Klart 2026-04-12
- [x] WP app-password sparat i SSM (`/seo-mcp/wordpress/nordicsnusonline/`)
- [x] GSC property skapad och verifierad: https://nordicsnusonline.com/
- [x] GSC property sparad i SSM
- [x] llms.txt live på https://nordicsnusonline.com/sv/llms.txt (via Rank Math PRO + page ID:23712)
- [x] Rank Math PRO bekräftat installerat
- [x] GSC HTML-verifieringstoken live: sz-i2X-zGUmH2B25Jso_kOgOABQoXmvgw7oBPknLzKk
- [x] Batch 1 artiklar publicerade (vecka 16):
  - ID:23713 /sv/nikotinpasar-guide-2026/ (focus: nikotinpåsar)
  - ID:23714 /sv/starkast-snus-guide-2026/ (focus: starkt snus)
  - ID:23715 /sv/portionssnus-vs-vitt-snus/ (focus: portionssnus vs vitt snus)

## Referenser
- Briefing: `docs/briefing-ai-search-produktfeed-2026.md`
