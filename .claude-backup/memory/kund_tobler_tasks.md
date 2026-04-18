---
name: Tobler tasks
description: Tobler task-checklista
type: project
originSessionId: 63fdf8cc-30f5-498e-8229-aa4f52589808
---
# Tobler — Tasks

**Status**: Aktiv
**Företag**: Tobler Ställningsprodukter AB
**Ort**: Torslanda, Göteborg
**Ägare**: Bröderna Viktor & Jakob Frostenäs
**Kontakt**: jakob@tobler.se
**Site**: https://tobler.se
**Bransch**: B2B — byggställningar (ramställning + modulställning), formsystem för betonggjutning, fallskydd/taksäkerhet, väderskyddstak, ställningstrailer, arbetskläder (Portwest, Blåkläder, Snickers, L.Brador)
**Målgrupp**: Ställningsentreprenörer + byggföretag + nya ställningsbolag (startpaket)

## Status 2026-04-11
**SUPERNÖJDA. Slog alla rekord i mars.** Möte tisdag (vecka 16).

## Nästa steg
- [ ] Sätt noindex på tobler.searchboost.se — WP-admin → Inställningar → Läsning → "Motverka indexering"
- [ ] Produkter med korta namn (U-ram Stål, H-ram Stål etc.) — SEO-agent kör i bakgrunden, verifiera att alla fick titlar
- [ ] Tobler.se produktion — när staging är godkänd av Mikael, deploya CSS-ändringar till tobler.se
- [ ] Sätt upp GSC URL-prefix property + SA (autonomt via wp_head meta-tag)
- [ ] ABC-keyword-kontroll (30-50 nyckelord baserat på branschen)
- [ ] Fortsätt 2-3 artiklar/vecka enligt standard
- [ ] Länkbygge från byggbranschmedia och ställningsföreningar
- [ ] Diskutera upsell: Google Ads på "startpaket ställning", "köpa ställning"

## Klart 2026-04-18 — TOBLER STAGING (tobler.searchboost.se)
- [x] CSS v4 pushat till post 1994 (41 426 bytes) — komplett design-system:
  - Blå hero (#32508E gradient) + gul rubrik (#F1E400) på alla kategorisidor
  - Produktkort: border #dce8f5, skugga, hover-lyft 5px + scale(1.012) + bildzoom
  - Produktsida IKEA/Zalando-standard: sticky galleri, stor titel, pris 1.8rem, gul köpknapp fullbredd + glow, trust-bar inbyggd, tabs Zalando-stil, spec-tabell ren
  - Dropdown-meny: fade-in från topp, z-index 99999, hover-states
  - Footer: 1×4 grid
  - Mobil: 960px=stapla kolumner, 768px=2-kol grid, 480px=1-kol, iOS font-zoom-fix 16px
  - Checkout: pill-formade fält, gul beställningsknapp fullbredd
- [x] SEO-audit komplett (9 sidor, 193 produkter, 42 kategorier, 24 artiklar):
  - 3 duplikatartiklar raderade (ID 1982, 1983, 1984)
  - 19 bloggartiklar — titles/descriptions/fokusord fixade
  - 9 produktkategorier — meta titles + descriptions
  - 4 sidor (Kontakt, Om oss, FAQ, Butik) — nya titles + descriptions
  - Rank Math globalt: titelmall, kategorimall, homepage description, Knowledge Graph
  - Sitemap OK, robots.txt OK, Product schema OK
- [x] Produkttitlar-agent körs (193 produkter med generiska namn får beskrivande Rank Math-titles)
- [x] Inlägg 1660 + 1948 (skräpinlägg) — raderas av agent som kör

## Klart 2026-04-16
- [x] Meta-sweep 20 posts — Rank Math title/description/focus_keyword uppdaterat (fixade alla generiska fk=byggställning till specifika keywords):
  - IDs: 1984, 1983, 1982, 1974, 1973, 1972, 1971, 1970, 1969, 1968, 1967, 1966, 1904, 1903, 1902, 1901, 1890, 1889, 1888, 1660
- [x] 2 nya artiklar publicerade (kat: Branschkunskap ID:249):
  - ID:1997 /besiktning-byggstallning-checklista-afs-2013-4/ — focus: besiktning byggställning (~1400 ord, SS-EN 12810/12811/13374 + AFS 2013:4)
  - ID:1998 /trappstallning-hantverkarstallning-skillnader/ — focus: trappställning hantverkarställning (~1200 ord, SS-EN 12810/12811/13374 + Eurokod 1 + AFS 2013:4)
- [x] Loggat i BigQuery (manual-work-log, 3 entries)

## Klart 2026-04-10
- [x] 3 artiklar publicerade vecka 17 (kat: Branschkunskap ID:249):
  - ID:1972 /stallningsplan-vad-ar-det-och-nar-kravs-en-stallningsplan/
  - ID:1973 /stallningsentreprenor-certifiering-utbildning-och-krav/
  - ID:1974 /startpaket-stallning-vad-ingar-och-hur-valjer-du-ratt/

## Klart 2026-04-09 natten
- [x] 4 pelarartiklar publicerade LIVE (#1968-1971):
  - artikel-1: Ramställning vs modulställning (focus: ramställning vs modulställning)
  - artikel-2: Fallskydd till tak — komplett guide (focus: fallskydd till tak)
  - artikel-3: Formsystem för betonggjutning (focus: formsystem betong)
  - artikel-4: Väderskyddstak för ställning (focus: väderskyddstak ställning)
- [x] 284 bilder auto-alt-text + 135 sidor meta description (bulk SEO sweep)
- [x] Code Snippets plugin installerat
- [x] llms.txt publicerad (302 bytes)
- [x] Standards refererade i artiklar: SS-EN 12810/12811/13374/13670, AFS 2013:4, Eurokod 1, DIN 18218

## Pausad
(inget)

## Referenser
- Artiklarna i `content-pages/tobler/`
- `kunder.md`
