---
name: Jelmtech tasks
description: Aktiv task-checklista for Jelmtech — SEO-audit + atgarder
type: project
originSessionId: 57a2558e-0219-419c-874f-907ca5c39abf
---
# Jelmtech — Tasks

**Status**: Aktiv (3 man x 8000 kr)
**Kontakt**: Camilla Lundstrom (camilla.lundstrom@jelmtech.se), VD: Carl-Fredrik Emilsson
**Site**: https://jelmtech.se (WordPress 6.9.4 + Divi 4.18.0 + Rank Math PRO + Code Snippets)
**Bransch**: B2B produktutveckling — plastkonstruktion, industridesign, prototyper
**Adress**: Fibulavagen 12, 262 74 Angelholm (Valhall Park)

## Nasta steg (kraver WP-admin)

### Hog prio — logga in pa jelmtech.se/wp-admin
- [ ] **Radera 6 inaktiva plugins**: Yoast SEO, Google XML Sitemaps, Polylang, Module Extender for Divi, ThemeTrust Shortcodes, XYZ WP Social Media Auto Publish
- [ ] **Avaktivera Google Analyticator** — aktiv men utrangerad, stoder inte GA4. Byt mot GA4-snippet via Code Snippets
- [ ] **Aktivera Rank Math Sitemap** — Rank Math > Dashboard > Modules > Sitemap (toggle on). Uppdatera robots.txt: /sitemap_index.xml
- [ ] **Aktivera Open Graph** — Rank Math > General Settings > Social. Ladda upp OG-default-bild
- [ ] **Konfigurera Organization schema** — Rank Math > Titles & Meta > Local SEO. Namn, adress, telefon, logo
- [ ] **Andra default_category** till Produktutveckling (48) — Settings > Writing
- [ ] **Andra default_post_format** till Standard — Settings > Writing

### Kraver hosting
- [ ] **KRITISKT: PHP 7.4 → 8.1+** — EOL sedan nov 2022, sakerhetsrisk
- [ ] **Viewport user-scalable=0** — Divi-override behover laggas in
- [ ] **Sakerhetsheaders** — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- [ ] **Dolj X-Powered-By** — php.ini: expose_php = Off

### Innehall (lopande)
- [ ] **Featured images pa 30 artiklar** — alla 2026-artiklar saknar bild (1200x630px, JPG, beskrivande alt)
- [ ] **Expandera tunna artiklar** — 7672 (198 ord), 7673 (170 ord), 7674 (191 ord)
- [ ] **Ta bort SEO-stuffad text** pa inlagg 4003 + 4462 (appenderade keyword-stycken)
- [ ] Ny batch artiklar vecka 21

## Pagaende

(inget)

## Pausad

(inget)

## Klart 2026-04-18 — Komplett SEO-audit + fixar via Perispa

- [x] Komplett SEO-audit: 19 sidor + 54 inlagg + teknisk audit (3 parallella agenter)
- [x] 8 sidor/inlagg → draft: arbetssida (6604), 3 stubs (7700/7699/7701), 3 dubbletter (5278/5592/7671), orphan Start (2)
- [x] Rank Math SEO pa alla 17 publicerade sidor (titel + beskrivning + fokusord — ALLA var tomma)
- [x] 27 artiklar: spammiga Rank Math-titlar omskrivna till lasbara
- [x] 5 sidor: SEO ifyllt pa 3901, 3907, 3915, 3969, 6238
- [x] 15 inlagg flyttade fran Uncategorized till ratt kategori
- [x] 5 slugs fixade: nyheter-3→nyheter, 4445→jelmtech-flyttar, 5562→thule-outway-platform, 6300→vi-soker-ingenjorer, 7003→langsamma-processer-vid-kris
- [x] 7 trasiga .html-lankar → riktiga URL:er (artiklar 7656 + 7657)
- [x] Markdown → HTML i 3 artiklar (7651, 7650, 7652): **bold** → strong, [text](url) → a-taggar
- [x] 5 redaktionella "Bildforslag"-sektioner borttagna
- [x] Tagline: "Din Utvecklingspartner" → "Produktutveckling, industridesign och plastkonstruktion i Jonkoping"

## Klart 2026-04-16
- [x] Meta-sweep: 40 sidor fick rank_math_title/description/focus_keyword via REST

## Klart 2026-04-13 (vecka 20)
- [x] 3 artiklar: overmoulding (7675), toleranser (7676), tidplan (7677)

## Klart 2026-04-12
- [x] 3 artiklar: formsprutning (7667), prototypframtagning (7668), CE-markning (7669)
- [x] 3 artiklar: plastprototyp (7672), sprututgjutning (7673), industridesign (7674)

## Klart 2026-04-10
- [x] 3 artiklar: platkonstruktion (7664), DFM (7665), materialval (7666)
- [x] 2 artiklar: hallbar plastkonstruktion (7660), verktygsberedning kostnad (7661)
- [x] Sprak en-US → sv_SE, kategori "Insikter" skapad (ID:49)

## Klart 2026-04-09
- [x] 5 artiklar publicerade (7650-7657)

## Bakgrund
- Onboardad 2026-03-07
- Audit score 62/100 (2026-02-17), ny audit 2026-04-18 via Perispa
- 30 ABC-keywords inlagda (26 A / 4 B / 0 C)
- Rank Math PRO + Code Snippets aktivt
- Plugin-API blockerat av Wordfence (all plugin-admin maste goras i WP-admin)
- PHP 7.4 EOL — kritiskt att uppgradera

## Referenser
- Kund-info: `kunder.md` (Jelmtech-sektion)
