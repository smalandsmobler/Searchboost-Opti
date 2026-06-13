# Contact — Tjänsteföretag (B2B)

## Description

Full contact section with a lead generation form, contact information column and a map embed placeholder. For B2B companies where the contact form is the primary conversion goal. Clean, professional layout that makes it easy to reach out without friction.

Use this component when:
- Building a contact page for any B2B service client
- Adding a contact section at the bottom of a landing page
- Replacing an ugly default WordPress contact form layout

---

## 21st.dev Prompt

```
Create a comprehensive contact section for a Swedish B2B professional services company. Requirements:

Section wrapper:
- Light background #F8F9FA, full width, padding 80px 0 on desktop, 48px 0 on mobile
- Section headline: "Kontakta oss" — centered, dark (#141414), font-size 1.875rem, font-weight 700, margin-bottom 8px
- Subtext: centered, color #666, font-size 1rem, margin-bottom 48px

Two-column layout on desktop (60/40 split), stacked single column on mobile. Gap: 48px. Max-width 1100px, centered.

Left column — Contact form:
- White background, border-radius 12px, padding 40px, box-shadow 0 4px 24px rgba(0,0,0,0.07)
- Form heading: "Skicka ett meddelande" — font-size 1.125rem, font-weight 700, color #141414, margin-bottom 24px
- Form fields (in order):
  1. Name field: full width, label "Ditt namn", input placeholder "Anna Svensson", required
  2. Email field: full width, label "E-postadress", input type email, placeholder "anna@foretaget.se", required
  3. Company field: full width, label "Företag", input placeholder "Företaget AB"
  4. Message textarea: full width, label "Meddelande", rows 5, placeholder "Berätta om ditt behov..."
  5. Submit button: full width, background #0AB3FF, white text, border-radius 6px, padding 14px, font-weight 700, hover darken, font-size 1rem
- Field styles: border 1px solid #DDE2E8, border-radius 6px, padding 12px 16px, font-size 0.9375rem, focus: border-color #0AB3FF, outline none, box-shadow 0 0 0 3px rgba(10,179,255,0.1)
- Label: font-size 0.8125rem, font-weight 600, color #374151, margin-bottom 6px, display block
- Below button: small text "Vi svarar inom 24 timmar på vardagar." in #999, font-size 0.8125rem, text-align center, margin-top 12px

Right column — Contact info:
- Background: white, border-radius 12px, padding 40px, box-shadow 0 4px 24px rgba(0,0,0,0.07), display flex flex-direction column gap 28px
- Three contact info blocks:
  Each block: flex row, gap 16px, align-items flex-start
  Icon: 44px circle, background #EBF8FF, icon inside in #0AB3FF stroke, 20px
  Text: label in #888 font-size 0.75rem uppercase letter-spacing 0.1em, value in #141414 font-size 0.9375rem font-weight 600 below it, <a> with tel: or mailto: where applicable
  - Phone block: phone icon, "Telefon", number as link
  - Email block: envelope icon, "E-post", email as link
  - Address block: location pin icon, "Adress", multi-line address text
- Map placeholder below blocks: height 200px, background #E8EEF4, border-radius 8px, centered text "Karta laddas..." in #999

Mobile: form column first, contact info below

Semantic HTML: <section>, <form>, <label>, <input>, <textarea>, <address> for contact info block
Form: method="post", action can be empty (will be wired up to CF7 or similar)
All inputs have id and name attributes matching their labels' for attribute
```

---

## Swedish text suggestions

**Sektionsrubrik:** Kontakta oss
**Alternativa rubriker:** Låt oss prata · Kom i kontakt · Boka ett möte

**Undertext:**
> Berätta om ditt behov så återkommer vi inom 24 timmar med ett förslag.

**Formulärrubrik:** Skicka ett meddelande

**Fältetiketter och platshållare:**
- Ditt namn / Anna Svensson
- E-postadress / anna@foretaget.se
- Företag / Företaget AB (valfritt)
- Meddelande / Berätta om ditt behov, din bransch och vad du hoppas uppnå.

**Knapptext:** Skicka meddelande

**Under knapp:** Vi svarar inom 24 timmar på vardagar.

**Kontaktinfo — Traficator:**
- Telefon: 010-123 45 67
- E-post: info@traficator.se
- Adress: Industrivägen 14, 553 02 Jönköping

**Kontaktinfo — Humanpower:**
- Telefon: 08-555 00 11
- E-post: kontakt@humanpower.se
- Adress: Birger Jarlsgatan 57, 113 56 Stockholm

---

## Design notes

- Det vita formulärkortet mot den ljusgrå sektionsbakgrunden ger fin kontrast utan att vara platt
- Focus-staten (blå outline + border) är viktig för tillgänglighet — ta aldrig bort den
- Kartplatshållaren ska bytas mot en riktig Google Maps embed eller en länk till Google Maps
- Om klienten inte vill ge ut sin adress: ta bort adressblocket och lägg in "Remote-first — jobbar i hela Sverige"
- Om CF7 (Contact Form 7) är installerat: generera formuläret med CF7-shortcode istället och injicera det i formulärsektionen

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| GeneratePress | Utmärkt | Custom HTML block för layout, Contact Form 7 shortcode inuti formulärkolumnen |
| Kadence | Utmärkt | Kadence Form block i vänsterkolumnen, custom HTML för högerkolumnen |
| Flatsome | Bra | UX Builder row/columns, men formuläret behöver CF7 eller Flatsomes eget formulär |
| Plain HTML | Bra | Fungerar som statisk layout, men kräver PHP-backend för att skicka formulär |

**Rekommenderat konverteringsmål:** `/convert html` för layouten + CF7 shortcode inuti formulärblocket. Alternativt `/convert kadence` om Kadence Forms är tillgängligt.

**Perispa-tips:** Installera Contact Form 7 via `perispa_install_plugin`, skapa ett formulär, och ersätt `<form>`-blocket med CF7-shortcoden `[contact-form-7 id="xxx"]`.
