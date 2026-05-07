# Testimonials — Hälsa & Välfärd

## Description

Patient and client testimonials designed specifically for healthcare and wellness contexts. GDPR-aware by default — no last names shown unless explicitly provided. Includes treatment type label for credibility. Warmer and more personal in tone than the kontorsmobler version.

Use this component when:
- A clinic needs social proof that the treatment actually works
- A wellness provider wants to show real patient experiences
- Building trust before a booking CTA section
- The client has Google Reviews, Trustpilot or Bokadirekt reviews to showcase

---

## 21st.dev Prompt

```
Create a patient and client testimonials section for a Swedish healthcare or wellness provider. Requirements:

Section wrapper:
- White background (#FFFFFF), padding 80px 0 on desktop, 48px 0 on mobile
- Section headline: "Patientberättelser" — centered, dark (#1C2B2A), font-size 1.875rem, font-weight 700, margin-bottom 8px
- Subtext: centered, font-size 1rem, color #4A6462, margin-bottom 48px

Card grid:
- Three cards in a flex row on desktop (33.3% width), single column on mobile
- Gap: 20px
- Cards equal height via align-items: stretch

Each testimonial card:
- Background: #FAFDF9 (very light green-tinted white)
- Border: 1px solid #D9EDEA
- Border-radius: 12px
- Padding: 28px
- Subtle hover: box-shadow 0 6px 20px rgba(45,125,98,0.10), transition 180ms

Card internal layout:
- Treatment tag at top: small pill, background #E8F4F0, text color #2D7D62, font-size 0.6875rem, font-weight 700, letter-spacing 0.08em, padding 4px 12px, border-radius 20px, display inline-block, margin-bottom 16px, text-transform uppercase
- Star rating: five filled stars, color #F5A623, size 16px, gap 2px, margin-bottom 16px
- Quote text: <blockquote>, font-size 0.9375rem, color #2A3B39, line-height 1.7, font-style italic, no quotation marks in CSS — instead prepend an opening " character and end with " in the text
- Separator: 1px solid #D9EDEA, margin 20px 0
- Patient info row: flex, align-items center, gap 12px
  - Avatar: 40px circle, background #C5E0D8, border-radius 50%, initials in #2D7D62, font-weight 700, font-size 0.8125rem, text-align center, line-height 40px
  - Right column: first name only + treatment type in muted small text below
  - Name: font-weight 600, color #1C2B2A, font-size 0.875rem
  - Treatment: font-size 0.75rem, color #7A9490

GDPR note: add below the card grid in small gray text, centered: "Recensioner publicerade med samtycke. Efternamn utlämnade av integritetsskäl."

Semantic HTML: <section>, <ul> + <li> + <article>, <blockquote> with cite attribute, first name only
```

---

## Swedish text suggestions

**Sektionsrubrik:**
> Patientberättelser

**Alternativa rubriker:**
> Vad våra patienter säger · Kundrecensioner · Verkliga resultat, verkliga berättelser

**Undertext:**
> Läs vad andra har upplevt med vår vård.

**Omdöme 1 — fysioterapeut:**
- Behandlingstyp: Axelrehabilitering
- Stjärnor: 5/5
- Citat: "Jag hade haft ont i axeln i över ett år och gett upp hoppet om att bli bättre. Efter sex behandlingar var smärtan borta och jag är nu tillbaka på gymmet. Otroligt professionellt och omtänksamt bemötande."
- Förnamn: Karin
- Behandling under: Ortopedisk fysioterapi

**Omdöme 2 — nutritionist:**
- Behandlingstyp: Viktnedgångsprogram
- Stjärnor: 5/5
- Citat: "Äntligen en dietist som lyssnar. Programmet var anpassat efter mitt liv, inte tvärtom. Gick ner 9 kg på 3 månader utan att känna mig hungrig."
- Förnamn: Johan
- Behandling under: Kostcoaching

**Omdöme 3 — klinik:**
- Behandlingstyp: Hälsoundersökning
- Stjärnor: 5/5
- Citat: "Tog hand om hela familjen. Snabb bokning, kunnig personal och ett lugnt och tryggt bemötande från första sekunden. Rekommenderar varmt."
- Förnamn: Maria
- Behandling under: Hälsoscreening

**GDPR-text:** Recensioner publicerade med samtycke. Efternamn utlämnade av integritetsskäl.

---

## Design notes

- Behandlingstaggen (pill) är ett kraftfullt trovärdighetsverktyg — den visar att recensionen är specifik, inte generell
- Använd ALDRIG fulla namn utan skriftligt samtycke — förnamn är standard för hälsosektorn
- Avatarfärgen (#C5E0D8) ska matcha den gröna accentpaletten — konsistens i hela sektionen
- Stjärnfärgen (#F5A623) är avsiktligt annorlunda från accentfärgen — gul = betyg är en universell konvention
- Citattecknen ("...") ska vara typografiska, inte ASCII-raka — använd `"` och `"` i HTML

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| Kadence | Utmärkt | Testimonial block finns nativt med stjärnor + avatar |
| GeneratePress | Bra | Custom HTML block |
| Flatsome | Bra | Testimonials UX-widget + custom CSS för pill-taggar |
| Plain HTML | Alltid | Perispa_add_html, enkel att underhålla |

**Rekommenderat konverteringsmål:** `/convert html` för maximal kontroll och GDPR-anpassning.
