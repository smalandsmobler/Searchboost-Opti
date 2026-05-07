# Footer — Kontorsmöbler

## Description

Clean four-column footer with logo, tagline, two link columns (Kundservice and Produktkategorier), and a contact column. Copyright row at the bottom. Works as the global footer for the full site — set once and inherit everywhere.

Use this component when:
- Building a new site from scratch for SMK or Arbetsro
- Replacing an existing ugly or broken footer
- Standardizing footer across a multi-page site

---

## 21st.dev Prompt

```
Create a clean four-column footer for a Scandinavian office furniture store. Requirements:

Outer footer:
- Background: #1A1A1A (dark charcoal), full width
- Top padding: 64px, bottom padding: 32px
- Inner container: max-width 1200px, centered, horizontal padding 24px

Four columns in a flex row on desktop, 2x2 grid on tablet, single column on mobile. Gap: 48px between columns.

Column 1 — Logo + tagline:
- Logo placeholder: text "SMK" or "Arbetsro" in white, font-size 1.5rem, font-weight 700, letter-spacing 0.05em
- Tagline below logo: font-size 0.875rem, color #999, line-height 1.6, max-width 240px, margin-top 12px
- Social icons row below tagline: small SVG icons for Facebook, Instagram, LinkedIn. Color #777, hover color #FFFFFF, transition 150ms. Icons 20px, gap 16px, margin-top 20px

Column 2 — Kundservice (links):
- Column heading: "Kundservice" — uppercase, font-size 0.75rem, letter-spacing 0.12em, color #777, margin-bottom 20px
- Links list: <ul> with <li> + <a> tags. Each link: color #BBB, font-size 0.875rem, line-height 2, hover color #FFFFFF, no underline at rest, underline on hover

Column 3 — Produktkategorier (links):
- Same structure as column 2, heading "Produktkategorier"

Column 4 — Kontakt:
- Column heading: "Kontakt" — same style as other headings
- Address block: font-size 0.875rem, color #BBB, line-height 2, not a link
- Phone: link with tel: href, color #BBB, hover #FFF
- Email: link with mailto: href, color #BBB, hover #FFF
- Optional: "Öppettider" small block in muted color

Copyright row:
- Divider: 1px solid #2E2E2E, margin-top 48px, margin-bottom 24px
- Two-column flex row: left = copyright text in #666, font-size 0.75rem. Right = "Integritetspolicy" and "Villkor" links in #666, font-size 0.75rem, hover #FFF
- On mobile: stack vertically, center aligned

Semantic HTML: <footer>, <nav> for link columns, <address> for contact info
No hover animations — only color transitions
```

---

## Swedish text suggestions

**Tagline — SMK:**
> Kontorsmöbler för moderna arbetsplatser. Kvalitet du kan räkna med sedan 2005.

**Tagline — Arbetsro:**
> Hemmakontor som fungerar — och ser bra ut. En del av Smålands Kontorsmöbler.

**Kundservice-länkar:**
- Kundtjänst
- Frakt och leverans
- Returer och byten
- Betalningsalternativ
- Vanliga frågor
- Kontakta oss

**Produktkategorier-länkar — SMK:**
- Kontorsstolar
- Skrivbord
- Höj- och sänkbara skrivbord
- Förvaring och hyllor
- Mötesbord och konferensmöbler
- Loungemöbler

**Produktkategorier-länkar — Arbetsro:**
- Hemmakontorstolar
- Skrivbord för hemmabruk
- Belysning
- Tillbehör
- Paketerbjudanden

**Kontakt — SMK:**
- Adress: Eksättersgatan 2, 553 02 Jönköping
- Telefon: 036-12 34 56
- E-post: info@smalandskontorsmobler.se

**Kontakt — Arbetsro:**
- E-post: info@smalandskontorsmobler.se
- Webbplats: arbetsro.se (under uppbyggnad)

**Copyright:**
> © 2026 Smålands Kontorsmöbler. Alla rättigheter förbehållna.

---

## Design notes

- Mörk footer (#1A1A1A) kontrasterar starkt mot den ljusa resten av sidan — tydlig avdelning
- Länkfärgerna ska vara dämpad vit (#BBB) i viloläge, ren vit (#FFF) vid hover — inte accentfärgen grön
- Accentfärgen (grön eller terrakotta) ska INTE förekomma i footern — håller den neutral
- Social-ikonerna ska vara SVG inline, inte Font Awesome (undviker extra HTTP-request)
- Mobilvy: kontrollera alltid att contact-adressen radbrytss korrekt med `white-space: pre-line` eller `<br>`

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Flatsome | Möjligt men krångligt | Flatsomes footer är svår att overrida — bättre att injicera custom HTML i footer-widgeten |
| GeneratePress | Utmärkt | GeneratePress footer hooks + custom HTML fungerar fint |
| Kadence | Bra | Kadence footer builder stödjer kolumner nativt |
| Plain HTML | Alltid | Enklaste och säkraste — injicera via perispa_add_html i footer-area |

**Rekommenderat konverteringsmål:** `/convert html` — footern har så komplex struktur att manuell injektion är bättre än automatisk konvertering till builder-format.

**Perispa-tips:** Använd `perispa_get_option` för att hitta rätt widget-area (t.ex. `sidebar-footer-1`) och `perispa_update_option` med widget custom_html-widgeten för att sätta footern.
