# Hero — Tjänsteföretag (B2B)

## Description

High-impact B2B hero section for service companies that sell results, not products. Strong value proposition in the headline, three key benefits as bullet points, and dual CTA. Dark, professional background with geometric visual interest. Designed for companies like Traficator (traffic safety), Humanpower (staffing/HR), and similar B2B service providers.

Use this component when:
- Building a new homepage for any B2B service company
- A client's existing hero is too generic or product-focused rather than benefit-focused
- The client's service needs to communicate ROI and measurable results

---

## 21st.dev Prompt

```
Create a high-impact B2B hero section for a Swedish professional services company. Requirements:

Layout:
- Full viewport width, min-height 90vh
- Dark background: deep navy #0D1B2A or dark charcoal #141414 (use a CSS variable for easy theming)
- Subtle geometric background: repeating diagonal grid lines (1px, rgba(255,255,255,0.04)) or a radial gradient glow in the top-right corner (rgba(0,162,255,0.08), 600px circle)
- Two-column layout on desktop: left text content (55%), right visual element (45%)
- On mobile: single column, visual below text, fully stacked

Left column (text):
- Small badge above headline: pill shape, border 1px solid rgba(0,162,255,0.4), background rgba(0,162,255,0.08), text color #60B8FF, font-size 0.75rem, font-weight 600, letter-spacing 0.1em, padding 6px 14px, border-radius 20px. Text: "Certifierad partner · Sverige"
- Main headline: large, bold, white (#F0F4F8), font-size clamp(2.25rem, 4vw, 3.75rem), line-height 1.1, margin-top 16px
- Accent word in headline: wrap key word in <span> with color #0AB3FF or linear-gradient from #0AB3FF to #00E5D4, -webkit-background-clip text
- Supporting paragraph: font-size 1.0625rem, color #8A9BAD, line-height 1.7, max-width 480px, margin-top 16px
- Three key benefits as a vertical list, margin-top 28px:
  - Each item: flex row, gap 12px
  - Icon: filled circle with checkmark, 22px, background #0AB3FF, icon white, flex-shrink 0
  - Text: font-size 0.9375rem, color #C8D6E3, line-height 1.4
- Dual CTA row, margin-top 36px, flex, gap 16px, flex-wrap wrap:
  - Primary button: "Kom igång" — solid #0AB3FF, text white (#0D1B2A actually for contrast), font-weight 700, padding 14px 32px, border-radius 6px, hover: lighten + scale(1.02), transition 150ms
  - Secondary button: "Se case studies →" — transparent background, border 2px solid rgba(255,255,255,0.2), text #C8D6E3, same padding, hover border-color #0AB3FF, hover text #FFF
- Below CTAs, small trust row: "Anlitad av 200+ företag" or similar. Logo strip placeholder: 4 small gray rectangles representing client logos, each 80px wide, 24px tall, background rgba(255,255,255,0.08), border-radius 4px

Right column (visual):
- Floating dashboard or data visualization mockup: dark card (#1A2740), border 1px solid rgba(255,255,255,0.08), border-radius 16px, padding 24px
- Inside card: simple bar chart or metric display using CSS bars (no JS), accented in #0AB3FF
- Chart shows an upward trend with labeled values, e.g. growth metrics
- One floating stat card positioned outside main card: small dark card, border-radius 10px, showing a key number (e.g. "+43% tillväxt") with small description

On mobile: visual card hidden, text column full width

Semantic HTML: <section>, <h1>, <ul> for benefits list, <a> for CTAs
All decorative elements aria-hidden="true"
```

---

## Swedish text suggestions

**Badge:**
> Certifierad partner · Sverige

**Rubrik — Traficator (trafiksäkerhet):**
> Säkrare arbetsplatser börjar med rätt skyltning

**Rubrik — Humanpower (bemanning/HR):**
> Hitta rätt person — snabbare än du tror

**Rubrik — generisk tjänst:**
> Vi löser det du inte hinner med

**Accentord i rubrik (markera med blå gradient):**
> "rätt skyltning" · "rätt person" · "det" (välj ett kraftfullt ord)

**Undertext — Traficator:**
> Traficator levererar kompletta trafiksäkerhetslösningar för byggarbetsplatser, industrier och kommuner. Certifierade produkter, snabb leverans, expertservice.

**Undertext — Humanpower:**
> Vi matchar rätt kandidat med rätt uppdragsgivare. Mer än 500 lyckade placeringar — och vi tar fullt ansvar för hela processen.

**Tre key benefits — Traficator:**
1. Certifierade produkter enligt EU-standard
2. Leverans inom 24 timmar i hela Sverige
3. Kostnadsfri besiktning på plats

**Tre key benefits — Humanpower:**
1. Genomsnittstid till placering: 6 dagar
2. 94% av kandidaterna stannar 12+ månader
3. Inga avgifter om kandidaten inte funkar

**Primär CTA:** Kom igång / Begär offert / Boka möte
**Sekundär CTA:** Se case studies → / Se hur det fungerar →

**Trust-rad:** Anlitad av 200+ företag i Sverige

**Flytande stat-kort:** +43% effektivitet / 6 dagars placeringstid / 0 dödsfall senaste 3 åren

---

## Design notes

- Den mörka bakgrunden kommunicerar seriositet och professionalism — undvik det för consumervarumärken
- Accentfärgen (#0AB3FF) kan bytas mot orange (#FF6B35) för mer energiska varumärken
- Det flytande dashboardkortet behöver inte vara interaktivt — ren CSS räcker och laddar snabbare
- Logotyp-strip med gråa platshållarfält räcker tills klienten levererar riktiga logotyper
- Mobilvy: ta bort dashboardkortet helt — text är tillräcklig på mobil

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| GeneratePress | Bra | Full-width section + custom HTML, dark background via section CSS |
| Kadence | Bra | Kadence row med dark background setting |
| Flatsome | Möjligt | UX Builder section, men geometric background kräver custom CSS |
| Plain HTML | Alltid | Rekommenderas — bäst kontroll över dark mode-effekter |

**Rekommenderat konverteringsmål:** `/convert html` — den mörka bakgrunden och geometric overlay är svåra att replikera korrekt i builder-format.
