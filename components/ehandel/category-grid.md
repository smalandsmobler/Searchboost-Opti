# Category Grid — E-handel

## Description

Category browsing grid for e-commerce homepages and navigation pages. Each category shows an image, name, product count and a hover overlay with a "Se produkter" link. Gives visitors a fast visual overview of the full catalog and helps them self-navigate to their area of interest.

Use this component when:
- Building a WooCommerce homepage that needs a category overview
- Creating a "Alla kategorier" browse page
- Replacing a plain WooCommerce category list with something visual
- A client has good category images to work with

---

## 21st.dev Prompt

```
Create a category browsing grid for a Swedish WooCommerce e-commerce store. Requirements:

Section wrapper:
- White background (#FFFFFF), padding 72px 0 on desktop, 40px 0 on mobile
- Section headline: "Utforska sortimentet" — centered, dark (#111111), font-size 1.875rem, font-weight 700, margin-bottom 8px
- Subtext: centered, font-size 1rem, color #666, margin-bottom 40px

Category grid:
- CSS Grid: 4 columns on desktop (1200px+), 3 columns on tablet (768px–1199px), 2 columns on mobile (below 768px)
- Gap: 20px
- Max-width: 1200px, centered

Each category card:
- Border-radius: 12px, overflow: hidden, position: relative
- Aspect ratio: 3/4 (portrait) for fashion/beauty, or 4/3 (landscape) for furniture/tools
- Cursor: pointer

Category image:
- Background: #E8E8E8 placeholder
- Object-fit: cover, width 100%, height 100%
- On card hover: transform scale(1.06), transition 400ms ease

Hover overlay:
- Absolute inset 0, background linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)
- Always visible at bottom: gradient is partially shown even without hover for readability of text
- On hover: overlay darkens slightly, opacity from 0.85 to 1

Category info (always visible, absolute bottom):
- Padding: 20px 16px
- Category name: white, font-weight 700, font-size 1rem
- Product count: white, font-size 0.8125rem, opacity 0.8, margin-top 4px

"Se produkter" CTA (appears on hover):
- Small pill: background white, text #111111, font-size 0.75rem, font-weight 700, padding 6px 14px, border-radius 20px
- Position: absolute bottom 56px left 16px (just above the category name)
- Opacity 0 at rest, opacity 1 on card hover, transform translateY(4px) → translateY(0), transition 200ms
- Also: entire card is wrapped in <a> link so clicking anywhere navigates

Semantic HTML: <section>, <ul> + <li> for grid, <a> wrapping each card, <figure> + <img> for image, <figcaption> hidden for accessibility
Include aria-label on each card link: "Utforska [kategorynamn], [antal] produkter"
```

---

## Swedish text suggestions

**Sektionsrubrik:** Utforska sortimentet
**Alternativa rubriker:** Våra kategorier · Shoppa efter kategori · Hitta det du söker

**Undertext:**
> Bläddra bland våra kategorier och hitta precis det du behöver.

**Kategorier — Nordic Snus:**
- Lössnus / 124 produkter
- Prillor / 87 produkter
- Nikotinpåsar / 206 produkter
- Tuggtobak / 34 produkter
- Snus-tillbehör / 18 produkter

**Kategorier — SMK/Arbetsro:**
- Kontorsstolar / 43 produkter
- Skrivbord / 61 produkter
- Förvaring / 29 produkter
- Belysning / 18 produkter
- Kontors-tillbehör / 55 produkter

**Kategorier — generisk e-handel:**
- Nyheter / 32 produkter
- Bästsäljare / 48 produkter
- Rea / 76 produkter
- Ekologiskt / 23 produkter

**CTA-knapp:** Se produkter

---

## Design notes

- Gradientöverlagret (svart → transparent) är avgörande — utan den är text oläslig mot ljusa bilder
- "Se produkter"-pillret som visar vid hover ökar engagemanget markant i A/B-tester
- Mobilvy med 2 kolumner är rätt — en kolumn är för brett för kategoribilder, tre kolumner är för smalt
- Om klienten saknar kategoribilder: använd bakgrundsfärger med textikonöverlägg tills bilder finns
- Produktantalet ("124 produkter") är ett subtilt trovärdighetslement — visar att sortimentet är brett

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Utmärkt | Flatsome "Category" UX-block har liknande funktion — jämför och välj |
| WooCommerce (native) | Bra | Overrida `woocommerce/taxonomy-product-cat.php` eller använd shortcode `[product_categories]` + custom CSS |
| GeneratePress | Bra | Custom HTML block |
| Plain HTML | Alltid | Bra för statisk kategoriseringssektion |

**WooCommerce-tips:** Använd WC-shortcoden `[product_categories number="8" columns="4"]` som bas och override CSS-klasser `.product-categories .cat-item` för att matcha detta utseende — snabbare än att skriva om allt.

**Rekommenderat konverteringsmål:** `/convert flatsome` för Flatsome-tema, `/convert html` för alla andra.
