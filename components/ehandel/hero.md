# Hero — E-handel

## Description

Conversion-optimized e-commerce hero featuring a prominent product or category. Urgency element (sale badge or limited stock) drives immediate action. Large, impactful image with CTA overlay. Optimized for WooCommerce shops with an active sales campaign or featured category.

Use this component when:
- Building an e-commerce homepage for a WooCommerce client
- A client is running a campaign and needs a dedicated landing page hero
- Replacing a bland default WooCommerce homepage
- Seasonal campaigns (summer sale, Black Friday, product launch)

---

## 21st.dev Prompt

```
Create an e-commerce hero section with a featured product and urgency elements for a Swedish online store. Requirements:

Layout:
- Full viewport width, min-height 75vh
- Split layout: left content column (50%), right product image (50%), on desktop
- On mobile: product image at top (height 280px), content below
- Background: deep charcoal #111111 overall, with the right image column being the product photo

Left column:
- Background: #111111
- Padding: 64px 48px on desktop, 32px 24px on mobile
- Top: Sale/campaign badge — pill shape, background #FF3B30 (urgent red), white text, font-size 0.7rem, font-weight 800, letter-spacing 0.1em, padding 6px 14px, border-radius 20px, text-transform uppercase. Badge text: "Rea · Upp till 40% rabatt"
- Headline: white (#FFFFFF), font-size clamp(2rem, 3.5vw, 3.25rem), font-weight 800, line-height 1.1, margin-top 16px
- Sub-headline: color #B0B8C1, font-size 1.0625rem, line-height 1.6, margin-top 12px, max-width 420px
- CTA button: "Shoppa nu" — solid white background, text #111111, font-weight 700, padding 14px 32px, border-radius 6px, font-size 1rem, hover: background #F0F0F0, transition 150ms, margin-top 32px, display inline-block
- Urgency text below button: "Erbjudandet gäller t.o.m. söndag" or "Begränsat lager" in #FF8C42 (warm orange), font-size 0.8125rem, font-weight 600, margin-top 12px
- Trust strip at bottom: flex row, 3 items, gap 24px, margin-top 36px. Each: small white SVG icon + short white text, font-size 0.75rem, opacity 0.7

Right column (product image):
- Full height of hero section
- Background: #1A1A1A with image overlay cover
- Object-fit: cover, object-position: center
- Subtle gradient overlay on left edge: linear-gradient(to right, #111111 0%, transparent 30%) to blend left column into image
- Price badge: absolute positioned bottom-left, white background, border-radius 10px, padding 12px 20px, box-shadow 0 4px 20px rgba(0,0,0,0.3)
  - Old price: line-through, #999, font-size 0.875rem
  - New price: #FF3B30, font-size 1.5rem, font-weight 800

No external fonts, no animations
Semantic HTML: <section>, <h1>, <p>, <a> for CTA (not button), <ul> for trust items
Include aria-label on CTA describing destination
```

---

## Swedish text suggestions

**Badge:**
> Rea · Upp till 40% rabatt

**Alternativa badges:**
> Nyhet · Begränsat lager · Kampanjpris · Black Friday · Fri frakt idag

**Rubrik — generisk rea:**
> Vårens bästa erbjudanden — just nu

**Rubrik — produktlansering:**
> Äntligen här — [Produktnamn] i ny design

**Rubrik — Nordic Snus:**
> Sveriges bredaste sortiment av snus och nikotinpåsar

**Rubrik — e-handel mode:**
> Shoppa säsongens kollektion — fri frakt från 500 kr

**Sub-rubrik:**
> Handplockat sortiment med snabb leverans. Vi skickar samma dag vid beställning före kl 15.

**CTA:** Shoppa nu / Se hela sortimentet / Utforska kollektionen

**Urgency-text:**
> Erbjudandet gäller t.o.m. söndag · Begränsat lager kvar · Fri frakt ut i dag

**Trust-strip:**
- Fri frakt från 499 kr
- Leverans 1–3 dagar
- 30 dagars öppet köp

**Prismärkning:**
- Ordinarie pris: 1 299 kr
- Kampanjpris: 799 kr

---

## Design notes

- Mörk bakgrund fungerar bäst för premium- och kampanjkänsla — byt mot vitt för mer lättsmält varumärkestoning
- Det röda salubadget (#FF3B30) aktiverar en automatisk "rea!"-respons — använd bara när det verkligen är rea
- Gradientövergången vänster→höger (mörk→transparent) gör att kolumnerna flödar ihop utan en hård linje
- Prismärket på bilden är ett starkt konverteringselement — gammal pris i genomstruken text + ny pris i rött
- Urgency-texten under CTA ska vara specifik ("till söndag") snarare än vag ("begränsat!")

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Utmärkt | Flatsome har inbyggt hero-stöd med UX Builder + overlay-filer |
| WooCommerce + Storefront | Bra | Custom HTML i homepage template, hero section |
| GeneratePress | Bra | Custom HTML block full-width |
| Plain HTML | Alltid | Perispa_add_html i page top-area |

**Rekommenderat konverteringsmål:** `/convert flatsome` för WooCommerce-shops med Flatsome. `/convert html` annars.
