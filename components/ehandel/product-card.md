# Product Card — E-handel

## Description

Single product card component — the atomic building block of any e-commerce catalog. Includes image with hover zoom, product name, star rating, price (with optional sale price), add-to-cart button, and a wishlist icon. Designed to maximize click-through and add-to-cart rates within the card itself.

Use this component when:
- Generating a custom WooCommerce product card template
- Building a "featured products" section with hand-picked items
- Replacing the default WooCommerce `.product` card styling
- Any client using WooCommerce who wants a more polished product card

---

## 21st.dev Prompt

```
Create a single product card component for a Swedish e-commerce store using WooCommerce. Requirements:

Card dimensions:
- Width: 100% of its grid cell (component is placed inside a grid by the parent)
- Border-radius: 10px
- Background: white (#FFFFFF)
- Border: 1px solid #EBEBEB
- Overflow: hidden
- Hover on card: box-shadow 0 8px 28px rgba(0,0,0,0.10), transition 200ms

Image area:
- Aspect ratio: 1/1 (square) for most product categories, or 3/4 for fashion
- Background: #F5F5F5 (neutral gray placeholder)
- Object-fit: cover
- Overflow hidden, border-radius 10px 10px 0 0
- On card hover: transform scale(1.05) on the image only, transition 350ms ease
- Sale badge: absolute top-left, 12px margin. Pill: background #FF3B30, white text, font-size 0.6875rem, font-weight 700, padding 4px 10px, border-radius 20px. Text: "-25%". Hidden if no sale.
- Wishlist icon: absolute top-right, 12px margin. Circle button 34px, background white, box-shadow 0 2px 8px rgba(0,0,0,0.12), border-radius 50%, heart SVG icon 16px inside, color #CCC, hover color #FF4D6D, transition 150ms. Aria-label: "Spara till önskelista"

Card body (below image):
- Padding: 16px
- Product name: font-weight 600, font-size 0.9375rem, color #111111, display block, margin-bottom 6px, max 2 lines with text overflow ellipsis
- Star rating row: 5 stars, font-size 13px, color #F5A623 for filled, #DDD for empty. Followed by review count in #888, font-size 0.75rem, e.g. "(23)"
- Price row, margin-top 10px, flex row, align-items: baseline, gap 8px:
  - Regular price: font-size 1.125rem, font-weight 700, color #111111
  - Old price (if on sale): font-size 0.875rem, text-decoration line-through, color #AAA, margin-left 4px
  - Sale price: font-size 1.125rem, font-weight 700, color #FF3B30 (only when sale price exists)
- "Lägg i varukorg" button: full width, margin-top 14px, background #111111, white text, border-radius 6px, padding 10px, font-size 0.875rem, font-weight 600, hover background #333333, transition 150ms
  - If out of stock: button text "Slut i lager", background #E5E5E5, color #888, cursor: not-allowed, no hover effect

No JavaScript (wishlist hover is CSS only)
Semantic HTML: <article>, <figure> for image, <h3> for product name, <a> wrapping the image and name linking to product page, <button> for add-to-cart (real WC button will replace this), wishlist as <button>
```

---

## Swedish text suggestions

**Produktnamn (exempel):**
- Ergonomisk kontorsstol Pro 2000
- Nikotinpåsar Siberia Slim White Dry
- Löparskor Ultraboost 23
- Keramisk kaffemugg 350ml

**Knapptext:** Lägg i varukorg
**Utomstockstext:** Slut i lager
**Önskelista:** Spara till önskelista (aria-label)

**Betygsrad:**
> ★★★★★ (47) — visa alltid antalet recensioner inom parentes

**Prissättning:**
- Ordinarie: 1 295 kr
- Rea: 895 kr (gammalt: ~~1 295 kr~~)
- Utan rea: 1 295 kr (enkel visning)

**Salusbadge:** -25% / REA / NYHET / POPULÄR

---

## Design notes

- Bild-zoom vid hover (scale 1.05 på img, overflow hidden på container) är ett klassiskt e-commerce trick — subtilt men effektivt
- Hjärtikonen i hörnet ska INTE vara ett formulär utan en enkel CSS-hover — WordPress WooCommerce Wishlist plugin hanterar backenden
- Stjärnbetyget ska alltid visa antalet recensioner — "★★★★★ (0)" är sämre än att dölja stjärnorna när det inte finns reviews
- "Slut i lager"-tillståndet ska inte ta bort knappen — det är informativt och bygger efterfrågan
- Kortets shadow ska enbart synas vid hover, inte i viloläge

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Utmärkt | Flatsome products widget har liknande design — använd istället + override CSS om möjligt |
| WooCommerce (Storefront) | Utmärkt | Overrida `.products .product` med dessa stilar via Additional CSS |
| GeneratePress | Bra | Custom HTML för statisk showcase, WC loop kräver PHP template override |
| Plain HTML | Bra | Statisk showcase — bra för "Utvalda produkter"-sektion |

**WooCommerce-integration:** Generera komponenten med 21st Magic → konvertera till PHP med `/convert php` → lägg i `woocommerce/content-product.php` i barntemat. Alternativt: override med CSS via `perispa_update_option` (Additional CSS) för snabbaste vägen.
