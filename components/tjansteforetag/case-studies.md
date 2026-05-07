# Case Studies — Tjänsteföretag (B2B)

## Description

Three case study cards showcasing client results with specific numbers. Aimed at convincing B2B buyers who want proof of results before committing. Dark cards with an electric blue or orange accent border communicate professionalism. Each card tells a mini-story: industry, problem, measurable outcome.

Use this component when:
- A B2B client has real documented results from their work
- Building a "Resultat" or "Kunder" page
- Adding a mid-page credibility section between the hero and the contact form
- The client can share at least one specific number (%, kronor, days, units)

---

## 21st.dev Prompt

```
Create a case studies section with three cards for a Swedish B2B service company. Requirements:

Section wrapper:
- Background: #0D1B2A (dark navy), full width, padding 80px 0 on desktop, 48px 0 on mobile
- Section headline: "Bevisade resultat" — centered, white (#F0F4F8), font-size 1.875rem, font-weight 700, margin-bottom 8px
- Subtext: centered, color #7A8FA0, font-size 1rem, margin-bottom 48px

Card grid:
- Three cards in a flex row on desktop, single column on mobile, gap 24px, max-width 1100px, centered

Each case study card:
- Background: #1A2740 (slightly lighter than section bg)
- Border-radius: 12px
- Border: 1px solid rgba(255,255,255,0.06)
- Left accent border: 4px solid #0AB3FF (left edge of card), border-radius fix with border-left override
- Padding: 32px
- Hover: box-shadow 0 8px 32px rgba(10,179,255,0.15), border-color rgba(10,179,255,0.3), transition 200ms

Card layout (top to bottom):
- Industry tag: pill, background rgba(10,179,255,0.1), text #0AB3FF, font-size 0.6875rem, font-weight 700, letter-spacing 0.1em, padding 4px 12px, border-radius 20px, text-transform uppercase, margin-bottom 20px
- Challenge headline: "Utmaningen" — font-size 0.6875rem, text-transform uppercase, letter-spacing 0.1em, color #4A6477, margin-bottom 8px
- Challenge text: font-size 0.9375rem, color #C0CDD8, line-height 1.6, margin-bottom 20px
- Result highlight box: background rgba(10,179,255,0.06), border 1px solid rgba(10,179,255,0.15), border-radius 8px, padding 16px 20px, margin-bottom 20px
  - Large result number: font-size 2rem, font-weight 800, color #0AB3FF, display block, line-height 1
  - Result description: font-size 0.8125rem, color #7A8FA0, margin-top 6px
- "Läs mer" link: color #0AB3FF, font-size 0.875rem, font-weight 600, hover underline, arrow → inline, no button styling

Semantic HTML: <section>, <ul> + <li> + <article>, <a> for "Läs mer"
All icon elements aria-hidden="true"
```

---

## Swedish text suggestions

**Sektionsrubrik:** Bevisade resultat
**Alternativa rubriker:** Kundcase · Vad vi åstadkommer · Resultat vi är stolta över

**Undertext:**
> Siffror ljuger inte. Här är tre exempel på vad vi faktiskt levererat.

**Case 1 — Traficator (trafiksäkerhet):**
- Bransch: Byggbranschen
- Utmaning: Kommunen sökte lösning för trafiksäkerhet vid tre parallella vägarbeten utan att bromsa trafiken.
- Resultat: -67% trafikincidenter
- Resultatbeskrivning: Under 8 månaders vägarbete utan ett enda allvarligt tillbud.
- Länktext: Läs hela caset →

**Case 2 — Humanpower (bemanning):**
- Bransch: IT & Tech
- Utmaning: Snabbväxande SaaS-bolag behövde 12 seniora utvecklare på 30 dagar utan att kompromissa med kulturell matchning.
- Resultat: 11 av 12 kvar efter 12 månader
- Resultatbeskrivning: Placerade i tid, rätt kompetens, noll omplaceringar på ett år.
- Länktext: Läs hela caset →

**Case 3 — generisk tjänst:**
- Bransch: Tillverkning
- Utmaning: Produktionsanläggning med återkommande produktionsstopp som kostade 200 000 kr per händelse.
- Resultat: 0 oplanerade stopp
- Resultatbeskrivning: Nio månader utan produktionsstörning efter implementering av vår lösning.
- Länktext: Läs hela caset →

---

## Design notes

- Det stora resultattalet ska vara omöjligt att missa — font-size 2rem i accentfärgen är rätt
- Accentborderleft (4px solid) ger en visuell signal om "markerat, viktigt" utan att överlasta kortet
- Hover-effekten ska vara i accentfärgen (blå glow) — stärker det elektriska B2B-intrycket
- Om klienten saknar case studies: börja med ett (det bästa) och fyll på senare
- Branschtaggen gör caset mer trovärdigt för potentiella kunder i samma bransch

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| GeneratePress | Bra | Custom HTML block, mörk section via custom CSS på wrapper |
| Kadence | Bra | Kadence columns + dark background section |
| Flatsome | Möjligt | UX Builder + custom CSS, men darkmode-effekter är klumpiga |
| Plain HTML | Alltid | Bäst för mörkt tema — full kontroll med perispa_add_html |

**Rekommenderat konverteringsmål:** `/convert html` — mörk bakgrund + accent glow hover passar sämst i builder-format.
