# Before / After — Hälsa & Välfärd

## Description

Visual before-and-after comparison component showing the transformation a client can expect from treatment. Two-panel layout on desktop with brief text descriptions. On mobile, panels stack vertically with clear labels. Drives bookings by making the result tangible and real.

Use this component when:
- A wellness client can show visible results (physio, weight loss, skincare, dental)
- Building a landing page focused on a specific treatment or programme
- A client has real before/after patient photos (with consent)
- No real photos available: use illustrated or icon-based "before state" vs "after state"

---

## 21st.dev Prompt

```
Create a before/after transformation section for a Swedish wellness or healthcare provider. Requirements:

Section wrapper:
- Background: white (#FFFFFF), padding 80px 0 on desktop, 48px 0 on mobile
- Section headline centered: "Resultat som talar för sig självt" — dark (#1C2B2A), font-size 1.875rem, font-weight 700
- Subtext centered below: font-size 1rem, color #4A6462, margin-bottom 48px, max-width 560px, centered

Main comparison layout:
- Two panels side by side on desktop, stacked on mobile, max-width 960px, centered, border-radius 16px, overflow hidden, box-shadow 0 8px 32px rgba(0,0,0,0.10)

Left panel — "Innan" (Before):
- Background: #F5F0EB (warm beige, suggests the problem state)
- Height: 420px on desktop, 280px on mobile, width 50%
- Image area: full panel, object-fit cover, filter: grayscale(20%) to subtly desaturate
- Floating label top-left: pill shape, background rgba(255,255,255,0.9), text "Innan", font-size 0.75rem, font-weight 700, color #6B5B4E, padding 6px 14px, border-radius 20px, margin 16px

Right panel — "Efter" (After):
- Background: #E8F4F0 (soft green, suggests the positive state)
- Same height and width as left panel
- Image area: full panel, object-fit cover, no filter
- Floating label top-right: same pill style, text "Efter", color #2D7D62, background rgba(255,255,255,0.9)

Divider between panels: subtle 2px white line on desktop

Below panels (inside the card):
- Two-column text row matching panel widths, padding 24px
- Left text (before state): font-size 0.875rem, color #8A7B72, line-height 1.6
- Right text (after state): font-size 0.875rem, color #2D7D62, line-height 1.6, font-weight 500

CTA below the entire card:
- Centered, margin-top 40px
- "Boka din konsultation" button: solid #2D7D62, white text, border-radius 6px, padding 14px 32px, font-weight 600
- Micro-text below button: "Kostnadsfri rådgivning · Inga förpliktelser" — font-size 0.8rem, color #999, margin-top 8px, text-align center

Semantic HTML: <section>, <figure> for image areas, <figcaption> for labels
GDPR note: add a small text "Foton publicerade med patientens samtycke" below the panels in #AAA, font-size 0.75rem
```

---

## Swedish text suggestions

**Sektionsrubrik:**
> Resultat som talar för sig självt

**Alternativa rubriker:**
> Från smärta till rörelsefrihet · Före och efter behandling · Se vad vi åstadkommer tillsammans

**Undertext:**
> Varje behandling är individuell. Nedan ser du exempel på vad våra patienter har uppnått med rätt vård.

**Innan-text (fysioterapeut):**
> Kronisk skulder- och nacksmärta efter kontorsarbete. Sov dåligt, begränsad rörlighet.

**Efter-text (fysioterapeut):**
> Full rörlighet återhämtad efter 8 behandlingar. Sover bättre, smärtfri i det dagliga livet.

**Innan-text (viktminskning/nutrition):**
> Trötthet, oregelbundna matvanor, svårt att hålla vikten.

**Efter-text (viktminskning/nutrition):**
> Stabil energi, 12 kg lättare på 4 månader, hållbara matvanor inbyggda i rutinen.

**CTA:** Boka din konsultation
**Mikro-text:** Kostnadsfri rådgivning · Inga förpliktelser

**GDPR-text:** Foton publicerade med patientens samtycke.

---

## Design notes

- Innan-panelen ska alltid vara visuellt "tyngre" — varm beige, eventuellt något desaturerad bild
- Efter-panelen ska kännas ljusare och mer hopfull — svag grön nyans, klarare bild
- Om klienten saknar riktiga foton: använd illustrerade ikoner + textbeskrivning istället för bildpaneler
- GDPR-texten är obligatorisk om riktiga patientfoton används — lägg alltid till den
- Mobilvy: panelerna staplas, Innan överst och Efter nederst — behåll etiketterna (pill labels) tydliga

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| GeneratePress | Bra | Custom HTML block, håll CSS inline |
| Kadence | Bra | Kadence columns + custom CSS |
| Flatsome | Möjligt | UX Builder column layout, men bildfiltret kräver custom CSS |
| Plain HTML | Alltid | Mest kontroll, rekommenderas för detta komponent |

**Rekommenderat konverteringsmål:** `/convert html` — bildfilter, overflow:hidden och absolut positionerade etiketter fungerar bäst i plain HTML.
