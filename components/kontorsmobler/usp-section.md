# USP Section — Kontorsmöbler

## Description

Four USP (Unique Selling Point) blocks displayed in a horizontal row. Each block has a small icon, a bold headline and one or two lines of supporting text. This section typically sits just below the hero or above the product grid. It communicates credibility and reassures visitors before they scroll deeper.

Use this component when:
- Any office furniture or e-commerce homepage needs trust signals below the hero
- Adding a quick credibility row to a category page
- Replacing the default WooCommerce "features" widget

---

## 21st.dev Prompt

```
Create a USP (unique selling points) section for a Scandinavian office furniture store. Requirements:

Layout:
- Full width section, background #F7F5F2 (warm light gray), padding 48px 0
- Inner container max-width 1200px, centered, horizontal padding 24px
- Four blocks in a flex row on desktop, 2x2 grid on tablet (768px), single column on mobile
- Equal width blocks, gap 32px between blocks

Each USP block:
- Centered alignment (icon + text centered)
- SVG icon at top: 40px × 40px, color #4A7C59 (forest green), stroke-based (not filled), stroke-width 1.5
- Icon 1 (free shipping): truck/delivery van outline
- Icon 2 (returns): circular arrow / return arrow outline
- Icon 3 (Swedish quality): shield with checkmark outline
- Icon 4 (ergonomic design): human figure sitting upright / chair outline
- Bold label below icon: font-size 1rem, font-weight 700, color #1A1A1A, margin-top 16px, margin-bottom 6px
- Supporting micro-text: font-size 0.875rem, color #666, line-height 1.5, max 2 lines

No hover effects — this is purely informational
No borders between blocks (clean, airy look)
Optional subtle divider: 1px solid #E0DDD8 between blocks on desktop only (use pseudo-elements)
Semantic HTML: <section> wrapping a <ul> list, each USP in an <li>
Include aria-hidden="true" on decorative SVG icons
```

---

## Swedish text suggestions

**USP 1 — Fri frakt**
- Rubrik: Fri frakt
- Text: På alla ordrar över 1 000 kr i Sverige.

**USP 2 — 30 dagars retur**
- Rubrik: 30 dagars retur
- Text: Öppet köp utan krångel. Returnera enkelt.

**USP 3 — Svensk kvalitet**
- Rubrik: Svensk kvalitet
- Text: Noggrant utvalda produkter med lång livslängd.

**USP 4 — Ergonomisk design**
- Rubrik: Ergonomisk design
- Text: Möbler som tar hand om din kropp under långa arbetsdagar.

**Alternativa texter för Arbetsro:**
- USP 1: Snabb leverans / Inom 3–5 vardagar direkt hem till dig.
- USP 4: Hemmakontor i fokus / Designat för dig som jobbar hemifrån.

---

## Design notes

- Bakgrundsfärgen #F7F5F2 skapar en tydlig sektion utan att det känns som en box — subtil men effektiv
- Ikonerna ska vara outline/stroke, inte filled — ger ett modernare och luftigare intryck
- Accentfärgen på ikonerna räcker som färgdetalj — lägg inte till fler färger i detta block
- Texten ska vara kort och konkret — undvik alltid meningar längre än 10 ord i supporting-text
- Mobilvy: ikon + rubrik + text ska vara vertikalt centrerade, inte vänsterjusterade

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Utmärkt | Bygg med Icon Box-widgeten, sätt flex row i UX Builder |
| GeneratePress | Bra | Custom HTML block + inline CSS för flexlayout |
| Elementor | Bra | Icon Box widget i kolumner — men undvik Elementor om möjligt (se CLAUDE.md) |
| Plain HTML | Alltid | Snabbaste vägen med perispa_add_html |

**Rekommenderat konverteringsmål:** `/convert flatsome` för SMK, `/convert html` annars.
