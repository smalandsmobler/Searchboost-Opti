# Booking CTA — Hälsa & Välfärd

## Description

Prominent call-to-action section designed specifically for booking-driven healthcare and wellness businesses. Single-purpose: get the visitor to click "Boka tid". Soft background color makes it stand out from surrounding white sections. Calendar icon adds visual clarity to the action.

Use this component when:
- A clinic or wellness provider needs a strong mid-page booking prompt
- Placed between the hero and testimonials, or between services and footer
- Adding a conversion section to an existing page that lacks a clear call to action
- The client uses an external booking system (Bokadirekt, Timma, Clinicminds, custom)

---

## 21st.dev Prompt

```
Create a prominent booking call-to-action section for a Swedish healthcare or wellness provider. Requirements:

Section wrapper:
- Background: #E8F4F0 (soft mint green)
- Full width, padding 72px 0 on desktop, 48px 0 on mobile
- Inner container: max-width 800px, centered, horizontal padding 24px
- Centered layout throughout

Content (top to bottom, all centered):
- Calendar SVG icon: 52px × 52px, stroke-based, color #2D7D62, stroke-width 1.5, margin-bottom 24px. Icon shows a calendar with a checkmark or highlighted date square.
- Main headline: font-size clamp(1.75rem, 3vw, 2.25rem), font-weight 700, color #1C2B2A, line-height 1.2, max-width 600px, centered
- Supporting text: font-size 1rem, color #4A6462, line-height 1.7, max-width 520px, centered, margin-top 12px
- Primary CTA button: "Boka din tid" — solid background #2D7D62, white text, font-size 1.0625rem, font-weight 600, padding 16px 40px, border-radius 6px, hover background #256856, transition 150ms, margin-top 32px
- Below button: small flex row, centered, gap 24px, margin-top 20px. Three items, each: small green checkmark SVG (14px) + short reassurance text in #4A6462, font-size 0.8125rem

Optional phone CTA row below:
- "Föredrar du att ringa?" in #7A9490, font-size 0.875rem
- Phone number link: bold, color #2D7D62, font-size 0.9375rem, hover underline, tel: href
- Layout: inline, centered, gap 8px

Section has no borders, no box-shadow — the background color alone creates separation

Mobile: same layout, button full width (width: 100%, max-width 360px)
Semantic HTML: <section>, <a> for CTA (not <button> — it links to booking page), <ul> for reassurance items
Include aria-label on the CTA link describing the action
```

---

## Swedish text suggestions

**Rubrik:**
> Redo att ta nästa steg?

**Alternativa rubriker:**
> Boka din tid idag — enklare än du tror · Din förändring börjar med ett samtal · Kom igång redan i veckan

**Undertext:**
> Välj en tid som passar dig. Vår bokningskalender är öppen dygnet runt och det tar under 2 minuter.

**CTA-knapp:** Boka din tid

**Reassurance-items:**
- Inga förpliktelser
- Svar inom 24 timmar
- Kostnadsfri första kontakt

**Alternativa reassurance-items:**
- Ingen väntelista
- Diskret och säkert
- Legitimerad personal

**Telefon-rad:**
> Föredrar du att ringa? 08-123 45 67

---

## Design notes

- Bakgrundsfärgen (#E8F4F0) ska vara lätt nog att inte störa ögat men tydlig nog att skapa en sektion
- Knappen ska vara stor och luftig — detta är sektionens enda syfte, tveka inte med padding
- Tre reassurance-items är optimalt — fler än tre börjar se desperat ut
- Telefonalternativet är viktigt för äldre målgrupper och klienter som inte litar på digitala bokningar
- Mobilvy: knapp på full bredd ser mer trygg och tryckbar ut

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Kadence | Utmärkt | Kadence Section + Kadence Button block med custom colors |
| GeneratePress | Bra | Custom HTML i full-width section |
| Flatsome | Bra | UX Builder section med background color och center alignment |
| Plain HTML | Alltid | Injicera med perispa_add_html |

**Rekommenderat konverteringsmål:** `/convert html` — enkel sektion som fungerar perfekt som plain HTML utan builder-beroenden.

**Perispa-tips:** För klienter med Bokadirekt eller Timma — länka CTA-knappen direkt till deras bokningssida med target="_blank" rel="noopener". Lägg till UTM-parametrar för spårning.
