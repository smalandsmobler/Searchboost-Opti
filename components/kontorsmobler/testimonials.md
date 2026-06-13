# Testimonials — Kontorsmöbler

## Description

Three customer testimonial cards in a horizontal row. Each card shows a star rating, a quote from the customer, and their name and company. Used to build social proof and reduce hesitation before purchase. Especially effective for B2B clients purchasing furniture for entire offices.

Use this component when:
- SMK or Arbetsro needs social proof on the homepage or product pages
- A client has existing Google Reviews or Trustpilot quotes to showcase
- Building trust on a landing page without a full case study section

---

## 21st.dev Prompt

```
Create a customer testimonials section with three cards for a Scandinavian office furniture store. Requirements:

Section wrapper:
- White background (#FFFFFF), padding 80px 0 on desktop, 48px 0 on mobile
- Section headline: "Vad våra kunder säger" — centered, dark charcoal (#1A1A1A), font-size 2rem, font-weight 700, margin-bottom 12px
- Optional subtext below headline: centered, font-size 1rem, color #666, margin-bottom 48px

Card grid:
- Three cards in a flex row on desktop, single column on mobile (stack vertically)
- Gap: 24px
- Cards equal height (stretch)

Each testimonial card:
- Background: #FAFAF9 (off-white, slightly warm)
- Border: 1px solid #EBEBEB
- Border-radius: 10px
- Padding: 32px
- No box shadow at rest
- Subtle hover: box-shadow 0 4px 16px rgba(0,0,0,0.08), transition 150ms

Card internal layout (top to bottom):
- Star rating row: five filled stars SVG, color #F5A623 (amber), size 18px each, gap 3px, margin-bottom 20px
- Quote text: font-size 1rem, color #333, line-height 1.7, font-style italic, margin-bottom 24px. Wrap in <blockquote>
- Separator line: 1px solid #E8E4DF, margin-bottom 20px
- Customer info row: flex, align-items center, gap 12px
  - Avatar circle: 44px × 44px, background #D4E8DC (light green), border-radius 50%, initials centered in #4A7C59, font-weight 700, font-size 0.875rem
  - Name + company column: name in bold #1A1A1A font-size 0.9rem, company in #777 font-size 0.8rem below

Semantic HTML: <section>, <ul> for cards, <li> + <article> per card, <blockquote> for quote text
Include cite attribute on blockquote with customer name
No JavaScript needed
```

---

## Swedish text suggestions

**Sektionsrubrik:**
> Vad våra kunder säger

**Alternativa rubriker:**
> Kundrecensioner · Så här tycker våra kunder · Tusentals nöjda kunder

**Undertext:**
> Vi har hjälpt hundratals företag och privatpersoner att hitta rätt kontorsmöbler.

**Omdöme 1:**
- Stjärnor: 5/5
- Citat: "Fantastisk service och snabb leverans. Stolarna vi beställde till vårt kontor är ergonomiska och ser professionella ut. Kommer definitivt handla igen."
- Namn: Anna Svensson
- Företag: Innovate AB

**Omdöme 2:**
- Stjärnor: 5/5
- Citat: "Sökte länge efter ett bra höj- och sänkbart skrivbord i rätt pris. Fick personlig rådgivning och valde rätt direkt. Jättebra köp."
- Namn: Marcus Lindgren
- Företag: Privatperson, Göteborg

**Omdöme 3:**
- Stjärnor: 5/5
- Citat: "Vi utrustade hela vår nyanställningsvåg med möbler härifrån. Smidig beställningsprocess, bra priser på volymer och kvaliteten lever upp till löftena."
- Namn: Sofia Eriksson
- Företag: TechGroup Sverige

**Avatarintialer:** AS · ML · SE

---

## Design notes

- Avatarcirkeln med initialer är ett snyggt alternativ till riktig profilbild — GDPR-vänligt och konsekvent
- Stjärnfärgen #F5A623 är standardfärg för 21st.dev-stjärnor — byt inte till grön (grön = varumärke, gul = betyg)
- Citaten ska vara konkreta och trovärdiga — undvik generella fraser som "bra produkt"
- Om klienten har Trustpilot-reviews: hämta de tre bästa och använd direkt
- Mobilvy: korten staplas vertikalt, varje kort full bredd — kontrollera att padding skalas ner

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Utmärkt | Flatsome Testimonials widget + row layout, eller injicera custom HTML |
| GeneratePress | Bra | Custom HTML block |
| Kadence | Bra | Testimonial block finns inbyggt |
| Plain HTML | Alltid | Snabbast med perispa_add_html |

**Rekommenderat konverteringsmål:** `/convert html` — enklast och mest portabelt för detta komponent.
