# Hero — Kontorsmöbler

## Description

Full-width hero section for an office furniture store. Intended as the above-the-fold section on the homepage or a category landing page. Communicates quality, ergonomics and trust immediately. Works for both B2B (companies furnishing offices) and B2C (home office buyers).

Use this component when:
- Building or rebuilding the SMK or Arbetsro homepage
- Creating a campaign landing page for a specific product category
- Any furniture client that needs a strong first impression

---

## 21st.dev Prompt

```
Create a hero section for a Scandinavian office furniture store. Requirements:

Layout:
- Full viewport width, min-height 80vh
- Two-column layout on desktop: left column has text content (60%), right column has image (40%)
- On mobile: single column, image below text, image height 300px
- Clean white background (#FFFFFF) with a subtle warm gray section below (#F7F5F2)

Left column content:
- Small uppercase label above headline: "Kontorsmöbler av hög kvalitet" in muted gray, letter-spacing 0.1em, font-size 0.75rem
- Main headline: large, bold, dark charcoal (#1A1A1A), font-size clamp(2rem, 4vw, 3.5rem), line-height 1.15
- Subtext paragraph: 1-2 sentences about ergonomics and durability, font-size 1.125rem, color #555, max-width 480px
- Trust signals row: three small items in a horizontal flex row, each with a small icon (SVG inline), short label in bold and micro-text below. Items: free shipping, 30-day returns, Swedish quality. Icons: truck, arrow-return, star. Icon color: #4A7C59 (forest green)
- Primary CTA button: "Se sortimentet" — solid background #4A7C59, white text, border-radius 4px, padding 14px 32px, font-weight 600, hover: darken 8%
- Secondary link below button: "Läs mer om oss →" in #4A7C59, no underline, hover underline

Right column:
- Placeholder image area: background #E8E4DF, border-radius 8px, aspect-ratio 4/5 on desktop
- Absolutely positioned badge in top-right corner: "Fri frakt" in white on #4A7C59 background, small pill shape, font-size 0.75rem

Typography: system-ui or Inter, no external font imports
Semantic HTML: use <section>, <h1>, <p>, <a> tags correctly
Include aria-label on the CTA button
No animations — keep it static and fast-loading
```

---

## Swedish text suggestions

**Label (ovanför rubrik):**
> Kontorsmöbler av hög kvalitet

**Rubrik — SMK:**
> Möbler som håller — för kontoret och hemmet

**Rubrik — Arbetsro:**
> Skapa ditt perfekta hemmakontor

**Undertext — SMK:**
> Vi levererar ergonomiska och hållbara kontorsmöbler till företag och privatpersoner i hela Sverige. Fri frakt på ordrar över 1 000 kr.

**Undertext — Arbetsro:**
> Väldesignade möbler för dig som jobbar hemifrån. Ergonomiskt, stilrent och levererat direkt hem till dig.

**CTA:** Se sortimentet
**Sekundär länk:** Läs mer om oss →

**Trust signals:**
- Fri frakt / På ordrar över 1 000 kr
- 30 dagars retur / Öppet köp utan krångel
- Svensk kvalitet / Noggrant utvalda produkter

---

## Design notes

- Accentfärg grön (#4A7C59) för SMK — passar ihop med deras skogsgröna varumärke
- Accentfärg terrakotta (#C4704A) för Arbetsro — matchar deras sub-brand
- Bakgrundsfärg #F7F5F2 ger ett varmt, skandinaviskt intryck utan att vara kallt vitt
- Bilden ska vara ljus och luftig — helst ett foto med naturligt ljus, trädetaljer och neutral färgpalett
- Trust-signalerna är kritiska för konvertering — ta inte bort dem
- Rubrikstorlek med clamp() är viktig — ser bra ut på alla skärmstorlekar utan mediaquery-hacks

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Utmärkt | Konvertera till UX-block row/col-struktur. Bildplatshållaren → Flatsome image widget |
| GeneratePress | Bra | Injicera som custom HTML i ett full-width block |
| Kadence | Bra | Använd Kadence Row Layout med custom CSS för trust-signals |
| Plain HTML | Alltid | Säkraste alternativet om builder är okänd |

**Rekommenderat konverteringsmål:** `/convert flatsome` för SMK, `/convert html` för Arbetsro (under uppbyggnad)
