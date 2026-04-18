---
name: Rapport-branding — vit bakgrund + searchboost-logo
description: Alla rapporter, briefer, presentationer och offerter ska ha vit bakgrund och searchboost-logotyp som veckomailet
type: feedback
---

## Regel

**Alla rapporter, presentationer, briefer, offerter och kund-dokument ska ha vit bakgrund och Searchboost-logotyp — identiskt med veckomailet.**

**Why:** Mikael 2026-04-09: "Tänk att du lägger undan en bra searchboost-logga. Alla rapporter skall vara vit bakgrund och searchboost-logga. Som veckomailet." Konsekvent branding är kritiskt för intryck mot kund — mörk bakgrund eller saknad logga ser oprofessionellt ut.

## Standard-logofiler

Centralt lagrade i `/Users/weerayootandersson/Downloads/Searchboost-Opti/assets/brand/`:

- `searchboost-logo.png` — **standard för rapporter på vit bakgrund** (2250×750, RGB, 125 KB). Samma som används i veckomailet (`opti.searchboost.se/assets/searchboost-logo.png`).
- `searchboost-logo-dark.png` — för mörk bakgrund (2250×750, RGBA, 135 KB)
- `searchboost-logo-sm.png` — 300×100 thumbnail för footers (RGBA)

## Användning

**HTML/PDF-rapporter:**
```html
<div style="background:#ffffff;padding:40px;">
  <img src="https://opti.searchboost.se/assets/searchboost-logo.png"
       alt="Searchboost" width="160"
       style="display:block;margin:0 auto 24px;max-width:160px">
  <!-- innehåll -->
</div>
```

**PPTX-presentationer:**
- Bakgrundsfärg: `#FFFFFF`
- Logga uppe till vänster, storlek ~120×40 px
- Använd `searchboost-logo.png` från `assets/brand/`

**Markdown-briefer:**
- Embedda logga med markdown: `![Searchboost](https://opti.searchboost.se/assets/searchboost-logo.png)`
- Kör mot vit PDF-export

**Reveal.js-presentationer:**
- Sätt `background-color: #ffffff` på alla slides
- Lägg logga via `.reveal .slide-background::before`

## Undantag

- Interna memory-filer och technical notes behöver ingen branding
- Screenshots och debug-output kan ha svart bakgrund
- Dashboardet (opti.searchboost.se) har mörk bakgrund — det är en app, inte en rapport

## Kontrollera innan leverans

Innan jag ger Mikael en fil för vidare till kund:
1. Är bakgrunden vit?
2. Finns searchboost-logga (inte anthropic, inte claude, inte generic)?
3. Är loggan från `assets/brand/searchboost-logo.png`?

Om någon av dessa är nej → fixa innan leverans.
