# Cart Section / Cart CTA — E-handel

## Description

Mini-cart summary or a prominent cart call-to-action section. Can be used as a sticky header element showing cart item count and subtotal, or as a standalone section on checkout-adjacent pages that nudges visitors toward completing their purchase. Includes trust signals (secure payment, free returns) to reduce cart abandonment.

Use this component when:
- Adding a mini-cart dropdown to the header of a WooCommerce store
- Creating a "Nästa steg" CTA section on the cart or product page
- Building a post-add-to-cart confirmation area
- A client has high cart abandonment and needs a stronger push toward checkout

---

## 21st.dev Prompt

```
Create a cart call-to-action section and mini-cart header element for a Swedish WooCommerce e-commerce store. Build TWO components in one file:

---

COMPONENT A — Mini cart header widget (for sticky header):
- Container: flex row, align-items center, gap 8px, cursor pointer, position relative
- Shopping bag icon: SVG outline, 24px, color #111111
- Cart count badge: absolute, top -6px, right -8px, small circle (20px), background #FF3B30, white text, font-size 0.7rem, font-weight 700, border-radius 50%, line-height 20px, text-align center
- Cart total: font-size 0.875rem, font-weight 600, color #111111 (hidden on mobile)
- Hover: mini dropdown appears (see below)

Mini cart dropdown (appears on hover or click):
- Absolute position, top 100%, right 0, margin-top 8px
- Background white, border-radius 12px, box-shadow 0 8px 32px rgba(0,0,0,0.16), padding 20px
- Width: 320px
- Cart items list (max 3 visible, scrollable): each item flex row gap 12px:
  - Thumbnail: 56px × 56px, border-radius 6px, object-fit cover, background #F0F0F0
  - Item info: name in #111 font-size 0.875rem font-weight 600, quantity × price in #666 font-size 0.8125rem below
  - Remove link: small ✕ in #CCC, hover #FF3B30, position right side
- Subtotal row: border-top 1px solid #F0F0F0, margin-top 16px, padding-top 16px, flex between:
  - "Delsumma:" in #666 font-size 0.875rem
  - Amount in #111 font-size 1rem font-weight 700
- "Till kassan" button: full width, background #111111, white text, border-radius 6px, padding 12px, font-weight 600, margin-top 12px, hover background #333
- "Fortsätt handla" text link: centered, font-size 0.8125rem, color #666, margin-top 10px, hover underline

---

COMPONENT B — Cart CTA section (full-width page section):
- Background: #F8F9FA, full width, padding 64px 0 on desktop, 40px 0 on mobile
- Inner container: max-width 720px, centered

Layout top to bottom, centered:
- Heading: "Din varukorg väntar" — font-size 1.75rem, font-weight 700, color #111, text-align center
- Sub-text: font-size 1rem, color #666, text-align center, margin-top 8px
- Order summary box: white background, border-radius 10px, border 1px solid #E8E8E8, padding 24px, margin-top 32px
  - Three rows (product name + price), each flex between, border-bottom 1px solid #F5F5F5, padding 12px 0
  - Totalt row: font-weight 700, larger price, no border
- "Till kassan" button: full width, background #111111, white text, border-radius 6px, padding 16px, font-size 1.0625rem, font-weight 700, margin-top 24px
- Trust row below button: flex, centered, gap 32px, margin-top 20px. Three items, each: small SVG icon (20px, #22B573 green) + short text in #666, font-size 0.8125rem
- "Säkra betalningar med" row: logos for Visa, Mastercard, Swish, Klarna — represented as small gray rectangles (placeholder) with text labels, flex row, centered, gap 12px, margin-top 24px, opacity 0.5

Semantic HTML: component A uses <div>, <ul>, <button>. Component B uses <section>, <ul> for trust items, <a> for CTA (links to /checkout/)
```

---

## Swedish text suggestions

**Mini-cart:**
- Badge: "3" (antal produkter)
- Total i header: "1 295 kr"
- Delsumma: "Delsumma: 1 295 kr"
- Knapp: Till kassan
- Länk: Fortsätt handla

**Cart CTA-sektion:**

**Rubrik:** Din varukorg väntar
**Alternativa rubriker:** Klar att slutföra? · Du är nästan klar · Glöm inte din varukorg

**Undertext:**
> Du har 3 produkter i varukorgen. Slutför din beställning säkert och enkelt.

**Ordersummering (exempelrader):**
- Ergonomisk kontorsstol Pro · 3 295 kr
- Skrivbordslampa LED · 695 kr
- Frakt (fri frakt) · 0 kr
- **Totalt · 3 990 kr**

**CTA-knapp:** Till kassan

**Trust-signaler:**
- Säker betalning med SSL
- Fri retur inom 30 dagar
- Leverans 1–3 vardagar

**Betalmetoder:**
- Visa · Mastercard · Swish · Klarna

---

## Design notes

- Mini-cartet i headern ska ha en röd badge (antal) för att synas tydligt mot ljus header
- Dropdownens bredd (320px) är optimalt — smalare är svårläst, bredare tar för mycket plats
- Maxantal synliga produkter i mini-cart: 3. Fler = dropdown för lång. Rulla om fler.
- Cart CTA-sektionen används bäst som en "återkoppling"-sektion på produktsidan efter att användaren klickat "Lägg i varukorg"
- Betalmeddel-logorna behöver vara riktiga SVG-logotyper i produktionsmiljön — begär dem från klienten
- Trust-signaler under kassaknappen är ett bevisat sätt att minska abandon vid kassa

---

## WooCommerce-integration

WooCommerce genererar mini-cart via `woocommerce_mini_cart`-actionen. Dessa komponenter är designade att ersätta eller komplettera den native functionaliteten:

- **Mini-cart header**: Wrappa WC:s `wc_get_cart_url()` och `WC()->cart->get_cart_contents_count()` i komponentens HTML-struktur
- **Cart CTA**: Använd WC:s `WC()->cart->get_cart_total()` och `WC()->cart->get_cart()` för att fylla ordersummeringen dynamiskt
- **"Till kassan"-länk**: `wc_get_checkout_url()` som href

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Utmärkt | Flatsome har inbyggt mini-cart i headern — override CSS snarare än ersätt |
| WooCommerce (Storefront) | Bra | Overrida `woocommerce/cart/mini-cart.php` med komponentens HTML |
| GeneratePress | Bra | GP Commerce addon hanterar mini-cart — CSS override |
| Plain HTML | Bra | Cart CTA-sektionen fungerar utmärkt som plain HTML + perispa_add_html |

**Rekommenderat konverteringsmål:** 
- Mini-cart: `/convert woocommerce` om verktyget stöds, annars CSS override på befintlig WC mini-cart
- Cart CTA-sektion: `/convert html` — enklast och mest portabelt
