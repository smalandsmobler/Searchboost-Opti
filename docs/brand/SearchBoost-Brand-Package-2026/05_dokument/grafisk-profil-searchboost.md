# Searchboost — Grafisk Profil

> **Status:** Version 1.0 (2026-05-31)
> **Ägare:** Searchboost, Mikael Larsson
> **Tillhörande filer:**
> - [`02_farger/brand.css`](../02_farger/brand.css) — CSS-tokens (färger, typografi, spacing, komponenter)
> - [`03_mallar/email-veckorapport.html`](../03_mallar/email-veckorapport.html) — Vecko-email-template
> - [`03_mallar/email-manadsrapport.html`](../03_mallar/email-manadsrapport.html) — Månadsrapport-template
> - [`03_mallar/looker-studio-template-spec.md`](../03_mallar/looker-studio-template-spec.md) — Spec för Looker Studio-rapport
> - [`04_guider/`](../04_guider/) — Social media + presentation-guider

---

## 1. Varumärkesplattform

### Mission
Semi-autonom SEO och marknadsföring för svenska företag. Vi flyttar SEO från manuell timdebitering till maskindriven precision — Mikael styr riktningen, AI gör tunga lyftet, kunden ser resultatet.

### Varumärkespersonlighet
- **Tech-luxe**, inte cyberpunk. Disciplinerad neon, ingen skrik-estetik.
- **Direkt och rakt** — vi gömmer inte data bakom konsult-snack.
- **Svenskt och jordnära under skalet** — Mikael är en person, inte ett varumärke.
- **AI-positiv men aldrig "AI-säljande"** — vi nämner aldrig AI i kundkommunikation.
- **Inga emojis i copy** om inte kunden inlett med en.

### Anti-värderingar
Det vi *inte* är: en SaaS-byrå med generiska Tailwind-sajter, "synergi"-prat, eller "vi tar din SEO till nästa nivå"-fraser.

### Tonalitet (copy-mallar)
- "Du fick 218 fler klick i maj. Det här tror vi gör skillnad i juni:"
- "Tre saker som drog upp ranken den här veckan."
- "Något knasade i tracking. Vi fixar det innan måndag."
- **Inte:** "Vi är glada att kunna presentera...", "I våra senaste analyser ser vi...", "Tillsammans skapar vi..."

---

## 2. Logotyp

### Primär logotyp
- **Filnamn:** `searchboost-logo.png` (mörk text på ljus bakgrund), `searchboost-logo-dark.png` / `logo-white.png` (ljus text på mörk bakgrund)
- **Användning:** Headers, footers, signaturer, presentationer
- **Default:** Vit logotyp på mörk bakgrund (vår signatur — vi ÄR ett dark mode-företag)

### Sekundära varianter

| Variant | Användning | Filnamn |
|---------|-----------|---------|
| Light (vit) | Mörka bakgrunder (default) | `logo-white.png`, `searchboost-logo-dark.png` |
| Dark (svart) | Ljusa bakgrunder (sällan — print) | `searchboost-logo.png`, `logo.png` |
| Liten (favicon-storlek) | Tab-favicon, små ytor | `searchboost-logo-sm.png` |

### Exklusionszon
- Minst halva logotypens höjd på alla sidor — inga andra element får överlappa.
- Logotypen ska aldrig sitta ovanpå bilder med högfrekvent textur.

### Förbjudet
- Stretcha eller skeva proportioner
- Lägga 3D-effekter, gradient-fyllningar eller skuggor inifrån varumärket
- Återanvända old logo (om sådan finns från före 2026)
- Ändra färgerna utanför godkänd palett

---

## 3. Färgpalett

### Primära färger

| Namn | Hex | RGB | CSS-variabel | Användning |
|------|-----|-----|--------------|------------|
| Searchboost Pink | `#e91e8c` | 233, 30, 140 | `--color-primary` | Primär CTA, badges, highlights, brand-signatur |
| Electric Purple | `#c026d3` | 192, 38, 211 | `--color-accent` | Gradient-partner till primary, accents |

**Signaturgradient:** `linear-gradient(135deg, #e91e8c 0%, #c026d3 100%)` (`--gradient-primary`)

### Bakgrundsfärger (dark mode = default)

| Namn | Hex | CSS-variabel | Användning |
|------|-----|--------------|------------|
| Deep Space | `#05050f` | `--color-bg-deep` | Hela appen, mail-bakgrund |
| Surface | `#080818` | `--color-bg-surface` | Cards, paneler |
| Elevated | `#0e0c19` | `--color-bg-elevated` | Modals, KPI-cards, highlight-sektioner |

### Textfärger på mörk bakgrund

| Namn | Hex | CSS-variabel | Användning |
|------|-----|--------------|------------|
| White | `#ffffff` | `--color-text-primary` | Rubriker, viktiga siffror |
| Lavender | `#c8b8e0` | `--color-text-secondary` | Brödtext, paragrafer |
| Muted | `#7a6e90` | `--color-text-muted` | Meta, labels, footer-text |

### Status-färger

| Namn | Hex | CSS-variabel | Användning |
|------|-----|--------------|------------|
| Success | `#4ade80` | `--color-success` | Positiv förändring, KPI upp |
| Warning | `#ffd075` | `--color-warning` | "Behöver åtgärd", milt larm |
| Error | `#f87171` | `--color-error` | Faktiskt fel, KPI ner |
| Info | `#60a5fa` | `--color-info` | Neutral information |

### Färgkombinationer (godkända)

✅ Pink CTA på Deep Space (signatur)
✅ White text på Deep Space
✅ Lavender brödtext på Surface
✅ Gradient-text (`--sb-text-gradient`) för stora rubriker
❌ Pink text på vit bakgrund — för låg kontrast (WCAG AA fail)
❌ Pink + Purple bredvid varandra utan gradient — för intensivt
❌ Status-färg som primär brand-färg — bryter hierarkin

### Kontrast-krav
Allt brödtext ska klara WCAG AA (4.5:1). Rubriker AAA (7:1).
- White på Deep Space: **18.9:1** ✓
- Lavender på Deep Space: **9.4:1** ✓
- Pink på Deep Space: **4.8:1** ✓ (gäller text ≥18px eller bold)

---

## 4. Typografi

### Typsnitt

**Heading:** Inter Tight (med fallback Plus Jakarta Sans, system-ui)
**Body:** Inter (med fallback system-ui)
**Mono:** JetBrains Mono (kod, statistik-siffror)

Hämtas från Google Fonts eller Adobe Fonts. För mail används system-fallbacks (Inter renderar inte alltid i Outlook).

### Skala

| Token | Storlek | Användning |
|-------|---------|------------|
| `--text-xs` | 11px | Labels, eyebrows, meta |
| `--text-sm` | 14px | Sekundär copy, tabell-text |
| `--text-base` | 16px | Brödtext (default) |
| `--text-md` | 18px | Lead-paragraf |
| `--text-lg` | 22px | Subheadings |
| `--text-xl` | 28px | H3 |
| `--text-2xl` | 32px | H2 |
| `--text-3xl` | 40px | H1 |
| `--text-4xl` | 48px | Hero |
| `--text-5xl` | 60px | Display (sällan) |

### Vikter

| Vikt | När |
|------|-----|
| 400 (Regular) | Brödtext |
| 500 (Medium) | Knappar, framhävd brödtext |
| 600 (Semibold) | Subheadings, eyebrows |
| 700 (Bold) | Rubriker, CTA-text, KPI-värden |

### Letter-spacing

- Brödtext: 0 (default)
- Rubriker: `-0.02em` (tight — bättre flyt i Inter Tight)
- Eyebrows / labels: `+0.18em` (widest — för att signalera struktur)

---

## 5. Spacing — 8px-grid

Allt spacing är multipler av 8px. Inga magic numbers.

| Token | Värde | Användning |
|-------|-------|------------|
| `--space-1` | 8px | Mellan label och värde |
| `--space-2` | 16px | Mellan KPI-card-innehåll |
| `--space-3` | 24px | Mellan paragrafer, padding i cards |
| `--space-4` | 32px | Padding i större cards |
| `--space-5` | 40px | Section-spacing i email |
| `--space-6` | 48px | Stor section-spacing |
| `--space-8` | 64px | Hero-padding |
| `--space-10` | 80px | Page-section-spacing |

---

## 6. Radius

| Token | Värde | Användning |
|-------|-------|------------|
| `--radius-sm` | 8px | Knappar, små badges |
| `--radius-md` | 12px | KPI-cards |
| `--radius-lg` | 16px | Större cards |
| `--radius-xl` | 24px | Hero-cards, modals |
| `--radius-pill` | 9999px | Pill-badges |

---

## 7. Shadows / Glows

Vi använder glow-baserade shadows (radial, mjuk pink) istället för standard box-shadow. Det är vad som ger Searchboost dess "neon-disciplin"-känsla.

| Token | Användning |
|-------|------------|
| `--shadow-card` | Standard card-skugga |
| `--shadow-card-hover` | Vid hover på card |
| `--shadow-cta` | Pink-glow under primary buttons |
| `--shadow-glow-primary` | Stor glow runt hero-element |

---

## 8. E-postmallar

Tre olika varianter — använd rätt för rätt ändamål:

| Mall | Användning | Mottagare |
|------|------------|-----------|
| `email-veckorapport.html` | Veckorapport, fredag 15:00 | Kund (per kund) |
| `email-manadsrapport.html` | Månadsrapport, 1:a varje månad | Kund (per kund) |
| `email-intern-sammanfattning.html` | Sammanfattning till Mikael | Mikael (en per vecka/månad) |

Alla mallar:
- Mörk bakgrund (`#05050f`)
- Centrerad container 640px
- Logo i header (white-variant)
- KPI-grid 2x2 i toppen
- CTA-knapp till Looker Studio + portal
- Footer med kontakt + opti.searchboost.se-länk

---

## 9. Looker Studio-stil

Rapporten konfigureras i Looker Studio men följer brand-paletten:

- **Bakgrund:** `#05050f`
- **Section-bakgrunder:** `#0e0c19` med 1px border `rgba(233, 30, 140, 0.15)`
- **Chart-färger:** Pink primary för aktuell period, Lavender för föregående period jämförelse
- **Tabell:** Header på `#080818`, alternerande rader på `#0e0c19`
- **Typografi:** Inter (bara Inter i Looker Studio, inte Inter Tight)

Se [`03_mallar/looker-studio-template-spec.md`](../03_mallar/looker-studio-template-spec.md) för exakt spec.

---

## 10. Sociala medier

| Plattform | Storlek (px) | Mall | Notering |
|-----------|--------------|------|----------|
| LinkedIn — feed post | 1200 × 627 | `04_guider/linkedin-mall.md` | Vit text på Deep Space + brand-gradient i hörnet |
| LinkedIn — banner (företagssida) | 1128 × 191 | — | Logo + tagline + gradient |
| LinkedIn — profilbild | 400 × 400 | — | Logo-symbol bara, inte hela ordmärket |
| X / Twitter — post | 1200 × 675 | `04_guider/twitter-x-mall.md` | Samma stil som LinkedIn |
| Open Graph (alla länkar från searchboost.se) | 1200 × 630 | — | Auto-genererad via Next.js `opengraph-image.tsx` |

Tonalitet i social media: rak, datadriven, ofta med konkret siffra ("Den här klienten ökade med 218 klick i maj") — aldrig "branschtips"-floskler.

---

## 11. Presentationer

Default 16:9, mörk bakgrund. Se [`04_guider/presentation-guide.md`](../04_guider/presentation-guide.md).

- Title slide: gradient-text H1 på Deep Space, logo-vit, kund-namn som eyebrow
- Innehåll: max 5 nyckelpunkter per slide
- Diagram: använd brand-färger (pink/purple), aldrig default-Excel/PowerPoint-färger
- Slide-master sätts upp i Kimi/Canva/Gamma med dessa tokens

---

## 12. Anti-slop-checklista

Innan du publicerar något:

- [ ] Använder dark mode som default
- [ ] Logo är white-variant på mörk bg, inte ljus med oönskad halo
- [ ] Pink är **accent**, inte dominant — finns på ≤30% av ytan
- [ ] Brand-gradient finns på minst ett ställe (CTA, eyebrow, eller hero-glow)
- [ ] Heading är Inter Tight, inte default-font
- [ ] Spacing följer 8px-grid — inga 13px eller 27px padding
- [ ] Radier är från token-listan, inte godtyckliga
- [ ] Inga emojis i copy (om kund inte börjat med en först)
- [ ] Inga "synergi", "next level", "ta er SEO till nya höjder"-fraser
- [ ] Tonalitet: kort, konkret, en faktisk siffra eller insikt

Om något stämmer inte: revidera tills det stämmer. Slop är förbjudet.

---

## 13. Referenser

- SMK-Brand-Package-2026 — kvalitetsbar och struktur (vi mirror:ar samma format)
- searchboost.se live — designspråk-referens (existerande Plus Jakarta + pink)
- opti.searchboost.se — vår dashboard-känsla
- Vercel, Linear, Anthropic — externa referenser för "tech-luxe dark"-känslan

---

## 14. Uppdateringslogg

| Datum | Version | Ändring |
|-------|---------|---------|
| 2026-05-31 | 1.0 | Initial release. Baserat på SMK-paketet struktur + existerande searchboost.se-stil. |
