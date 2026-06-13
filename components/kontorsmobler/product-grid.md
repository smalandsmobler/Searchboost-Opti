# Product Grid — Kontorsmöbler

## Description

Responsive product card grid for displaying office furniture. Three columns on desktop, two on tablet, one on mobile. Each card shows product image, name, short description, price and an add-to-cart button. Subtle hover effects keep the interaction polished without being distracting.

Use this component when:
- Building category pages (kontorsstolar, skrivbord, förvaring)
- Creating a "Populära produkter" featured section on the homepage
- Replacing an existing ugly WooCommerce default product loop

---

## 21st.dev Prompt

```
Create a responsive product card grid for a Scandinavian office furniture store. Requirements:

Grid layout:
- CSS Grid, 3 columns on desktop (min 1200px), 2 columns on tablet (768px–1199px), 1 column on mobile
- Gap: 24px between cards
- Section has white background, padding 80px 0 on desktop, 40px 0 on mobile
- Section headline above grid: "Populära produkter" — centered, dark charcoal, font-size 2rem, font-weight 700, margin-bottom 48px

Product card:
- White background (#FFFFFF), border-radius 8px
- Subtle border: 1px solid #EBEBEB
- Box shadow on hover: 0 8px 24px rgba(0,0,0,0.10), transition 200ms ease
- No shadow at rest (keeps it clean and flat)
- Card has no padding at top — image goes edge-to-edge at top of card

Card image area:
- Aspect ratio 4/3, background #F2EFE9 (warm placeholder)
- Object-fit: cover
- Overflow hidden with border-radius 8px 8px 0 0

Card body (below image):
- Padding: 20px
- Product name: font-weight 600, font-size 1rem, color #1A1A1A, margin-bottom 6px, display block
- Short description: font-size 0.875rem, color #777, margin-bottom 12px, line-height 1.5, max 2 lines with text overflow ellipsis
- Price row: flex between, align-items center
  - Price: font-size 1.25rem, font-weight 700, color #1A1A1A
  - "Lägg i varukorg" button: compact, background #4A7C59, white text, border-radius 4px, padding 8px 16px, font-size 0.875rem, font-weight 600, no border, cursor pointer, hover darken 8%

No JavaScript required — pure CSS hover effects
Semantic HTML: use <ul> for the grid, <li> for each card, <article> inside each <li>
Include alt="" on placeholder images
```

---

## Swedish text suggestions

**Sektionsrubrik:**
> Populära produkter

**Alternativa sektionsrubriker:**
> Bästsäljare · Nya produkter · Utvalda för hemmakontoret · Ergonomiska favoriter

**Exempelkort — Kontorsstol:**
- Namn: Ergonomisk kontorsstol Pro
- Beskrivning: Justerbar ryggstöd och armstöd. Designad för långa arbetsdagar.
- Pris: 3 295 kr

**Exempelkort — Skrivbord:**
- Namn: Höj- och sänkbart skrivbord 160×80
- Beskrivning: Elektrisk höjdjustering, minnesfunktion för 3 positioner.
- Pris: 6 990 kr

**Exempelkort — Skrivbordslampa:**
- Namn: LED-skrivbordslampa med USB-laddare
- Beskrivning: Justerbar ljusstyrka och färgtemperatur. Kompakt design.
- Pris: 695 kr

**Knapptext:** Lägg i varukorg

---

## Design notes

- Kortet ska aldrig ha skugga i viloläge — det är en vanlig nybörjarmiss som gör layouten tung
- Hover-skuggan ska vara mjuk och bred, inte hård och tight
- Priset ska vara tydligt och placerat nära köpknappen — konverteringspsykologi
- Undvik att visa "Slut i lager" i grått — ta hellre bort produkten från flödet
- Om klienten har WooCommerce: generera med `/convert woocommerce` för att få rätt PHP-loop istället
- Bildplatshållarna ska ha background-color i samma varma ton som sidans bakgrund

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Utmärkt | Flatsome har inbyggt product-grid UX-block — använd det istället om WooCommerce är aktivt |
| GeneratePress | Bra | Injicera som custom HTML block i Gutenberg |
| WooCommerce (default) | Sätt CSS | Overrida `.products` och `.product` med dessa stilar via Additional CSS |
| Plain HTML | Alltid | Bra för statiska showcase-sektioner utan cart-funktionalitet |

**Rekommenderat konverteringsmål:** `/convert flatsome` om Flatsome + WooCommerce. Annars `/convert html`.
