---
name: Nordic Snus Online tasks
description: Nordic Snus Online task-checklista
type: project
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
- [ ] Vecka 24 artiklar (3 st)

## Klart 2026-04-20 (vecka 23)
- [x] 3 artiklar publicerade vecka 23 (kat ID:307):
  - ID:23834 /sv/nikotinpasar-styrka-guide/ (focus: nikotinpåsar styrka)
  - ID:23835 /sv/zyn-nikotinpasar-guide/ (focus: zyn nikotinpåsar)
  - ID:23836 /sv/nikotinpasar-utan-tobak-guide/ (focus: nikotinpåsar utan tobak)
- [x] Rank Math-metadata via `/sv/wp-json/rankmath/v1/updateMeta` (WPML-path)
  *OBS: wp_credentials.md kan vara inaktuell — rätt app-password ligger i SSM `/seo-mcp/wordpress/nordicsnusonline/app-password`*

## Klart 2026-04-20 (vecka 22)
- [x] 3 artiklar publicerade vecka 22 (kat ID:307):
  - ID:23831 /sv/slim-nikotinpasar-guide/ (focus: slim nikotinpåsar)
  - ID:23832 /sv/snus-vs-nikotinpasar-skillnad/ (focus: snus vs nikotinpåsar)
  - ID:23833 /sv/kopa-nikotinpasar-online-sverige/ (focus: köpa nikotinpåsar online)
- [ ] GSC-data dyker upp imorgon 04:00 — kolla positioner
- [ ] Registrera i customer_pipeline

## Manuellt i WP admin (Mikael gör)
- [ ] Rank Math → Sitemap Settings → **Clear Cache** (11 artiklar saknas i sitemap)
- [ ] Sätt noindex på: varukorg, kassan, mitt-konto, sidan-under-uppbyggnad (Pages → Rank Math → Robots)
- [ ] Titlar på 5 guide-sidor: 23664, 23675, 23677, 23662, 23663 — korta till max 60 tecken
- [ ] Startsidans titel — ta bort emojis och CAPS, korta till 50-60 tecken
- [ ] WPML-inställningar → 301-redirect root `/` till `/sv/` (nu 307 + query-param)
- [ ] robots.txt → spara om i UTF-8 (nu ISO-8859-1, svenska tecken trasiga)
- [ ] Focus keyword på alla 11 SEO-artiklar i Rank Math-sidopanelen

## Klart 2026-04-16
- [x] App-password + URL sparad i SSM (`/seo-mcp/wordpress/nordicsnusonline/` — /sv-prefix)
- [x] wp_credentials.md uppdaterad med korrekt /sv-URL
- [x] SEO-sweep: 426 sidor OK, 0 fel
- [x] 4 arbetsloggar inlagda i veckorapporten
- [x] 3 artiklar vecka 21 publicerade:
  - ID:23766 /sv/white-fox-nikotinpasar-guide-2026/ (focus: white fox nikotinpåsar)
  - ID:23767 /sv/nikotinfritt-snus-guide-2026/ (focus: nikotinfritt snus)
  - ID:23768 /sv/snus-leverans-snabbast-2026/ (focus: snus leverans)

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
