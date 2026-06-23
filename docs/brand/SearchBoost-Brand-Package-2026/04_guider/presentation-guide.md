# Presentation-guide — Searchboost

> Hur man bygger deck som inte ser ut som default-PowerPoint. Verktyg: Kimi (för snabba decks), Canva (för polerade), Gamma (för pitch-decks).

## Master-spec

- **Format:** 16:9 (1920 × 1080 px)
- **Bakgrund:** Deep Space `#05050F`
- **Logo:** vit, 88px, top-left med 64px padding
- **Page-numbering:** bottom-right, `13 / 24`-format, Inter Tight 12px color `#7A6E90`

## Slide-typer

### Title slide
- H1 (Inter Tight Bold 80px) — gärna med gradient-text för rubrik
- Eyebrow ovanför H1 ("KUNDPRESENTATION · 2026")
- Subtitle (Inter 32px lavender)
- Centrerad horisontellt, vertikalt 60% från toppen

### Section divider
- Stor H1 (Inter Tight Bold 96px) eller eyebrow + H2
- Brand-gradient som horisontell linje under (4px hög, 200px bred)

### Content slide — max 5 punkter
- H2 (Inter Tight Semibold 48px) top
- Max 5 bullets — Inter Regular 24px
- Aldrig word-walls. Om mer text → dela på två slides

### KPI slide
- 3–4 stora siffror (Inter Tight Bold 120px)
- Label ovan (eyebrow-style)
- Delta-procent under (success/error-färg)

### Diagram slide
- Diagrammets bakgrund = `#0E0C19`
- Linje/bar-färger: pink primary, purple sekundär, lavender för "föregående period"
- Diagram-axel-labels: lavender `#C8B8E0` 16px
- **Aldrig** default Excel/PowerPoint-färger

### Avslutande slide ("Frågor?")
- Kontakt: namn + mail + telefon
- Stora kontaktuppgifter (Inter Tight 36px)
- Liten logo nederst

## Färgregler

- Bakgrund alltid Deep Space (dark mode)
- Vit text för rubriker, Lavender för brödtext
- Pink endast för accents (CTA, highlight-siffra, gradient-eyebrow)
- Status-färger (success/warning/error) endast för data-points

## Typografi (i decks)

PowerPoint stödjer inte alltid Inter Tight. Fallback-ordning:
1. **Inter Tight** (om installerad eller embedded)
2. **Plus Jakarta Sans**
3. **Inter**
4. **Segoe UI** (PowerPoint default-fallback)

Bara Inter (utan Tight) är OK för brödtext om Inter Tight saknas.

## Animation

- **Mjuk fade-in på text** (300ms ease) — aldrig "fly-in", "spin", "bounce"
- **Slide-transition:** "Push" eller "Fade", aldrig "Cube", "Vortex", etc.
- KPI-siffror får animera räkne-upp (om verktyget stödjer det)

## Verktyg + Mallar

### Kimi (för snabb deck)
- Använd "Build Dark Theme Presentation"-prompt
- Klistra in brand.css som referens
- Kimi-mall: separat fil `kimi-deck-template.json` (görs i nästa pass)

### Canva
- Skapa template-projekt "Searchboost Deck 2026"
- Importera färgpalett (Brand Kit) — pink/purple/Deep Space
- Embed Inter Tight via Brand Fonts

### Gamma
- Använd "Pitch Deck"-template som start
- Custom theme: dark mode, pink accent, Inter Tight

## Förbjudna mönster

- ❌ Stock-bilder av "team i kontor", "händer som pekar på laptop"
- ❌ Word-art
- ❌ Smiley/emoji på rubriker
- ❌ Default-clip-art
- ❌ Footer med phone+email+website på varje slide (visa bara på title + avslutning)
- ❌ Comic Sans (ja, någon gör fortfarande det)
- ❌ "Tack för uppmärksamheten"-slide — använd "Frågor?" istället

## Checklist innan du presenterar

- [ ] Alla slides använder Deep Space bakgrund
- [ ] Logo finns på title + avslut
- [ ] Brand-färgerna är de enda accenterna
- [ ] Typografi är Inter Tight / Inter
- [ ] Inga stock-bilder
- [ ] Max 5 punkter per slide
- [ ] Diagram följer färgschemat
- [ ] Page-numbering syns
- [ ] Mail/kontakt finns på sista slide
