# Team — Tjänsteföretag (B2B)

## Description

Team presentation section with photos (or avatar initials), name, title, and LinkedIn link. For B2B service companies, showing the actual people behind the service is a powerful trust signal. Professional but approachable in tone — not stiff corporate headshots.

Use this component when:
- A B2B client wants to show who they are before asking for a meeting
- Building an "Om oss" or "Vårt team" page section
- A consulting or staffing company where personal credibility matters
- A client has professional headshots to use (or can get them)

---

## 21st.dev Prompt

```
Create a team section for a Swedish B2B professional services company. Requirements:

Section wrapper:
- White background (#FFFFFF), padding 80px 0 on desktop, 48px 0 on mobile
- Section headline: "Möt teamet" — centered, dark (#141414), font-size 1.875rem, font-weight 700, margin-bottom 8px
- Subtext: centered, color #666, font-size 1rem, margin-bottom 48px, max-width 560px, auto margins

Team grid:
- Four cards in a row on desktop (or three if only 3 people), two columns on tablet, one column on mobile
- Gap: 28px, max-width 1000px, centered

Each team card:
- White background, border-radius 12px
- Border: 1px solid #EBEBEB
- Padding: 28px
- Text-align: center
- Subtle hover: box-shadow 0 6px 20px rgba(0,0,0,0.08), transform translateY(-3px), transition 200ms

Card layout:
- Photo area: 88px × 88px circle, centered, margin-bottom 16px
  - If image available: <img> with object-fit cover, border-radius 50%
  - If no image: div with background #E8F0F8 (light blue-gray), initials centered in #3A6B9F, font-weight 700, font-size 1.125rem, line-height 88px
- Name: font-weight 700, font-size 1rem, color #141414, margin-bottom 4px
- Title/role: font-size 0.8125rem, color #777, margin-bottom 16px
- Thin separator: 1px solid #F0F0F0, margin-bottom 16px
- Bio snippet (optional): font-size 0.8125rem, color #555, line-height 1.6, max 2 lines, margin-bottom 16px
- LinkedIn link: small LinkedIn SVG icon (16px × 16px, brand color #0A66C2) + "LinkedIn" text, font-size 0.8125rem, color #0A66C2, hover underline, flex row centered, gap 6px

No JavaScript needed
Semantic HTML: <section>, <ul> + <li> + <article>, <a> with aria-label for LinkedIn
```

---

## Swedish text suggestions

**Sektionsrubrik:** Möt teamet
**Alternativa rubriker:** Personerna bakom servicen · Våra experter · Ditt team

**Undertext:**
> Vi är ett dedikerat team med lång erfarenhet från branschen. Du vet alltid vem du pratar med.

**Exempelpersoner — Traficator:**
1. Namn: Peter Andersson / Titel: VD & Grundare / Bio: 20 år i branschen, certifierad trafikplanerare.
2. Namn: Lisa Bergström / Titel: Projektledare / Bio: Ansvarig för stora kommunprojekt.
3. Namn: Erik Johansson / Titel: Certifieringsansvarig / Bio: EU-certifierad produktspecialist.
4. Namn: Sara Lindqvist / Titel: Kundansvarig / Bio: Din direkta kontakt för alla frågor.

**Exempelpersoner — Humanpower:**
1. Namn: Magnus Holm / Titel: VD / Bio: Rekrytering och bemanning sedan 2008.
2. Namn: Annika Strand / Titel: Senior Rekryterare / Bio: Specialist på IT och tech.
3. Namn: Daniel Gustafsson / Titel: Rekryterare / Bio: Fokus på tillverkningsindustrin.

**LinkedIn-text:** LinkedIn (länk öppnar i ny flik)

---

## Design notes

- Profilbilderna ska vara professionella men varma — undvik rena passfotoestetik
- Om inga bilder finns: initiaer-avataren fungerar utmärkt och håller ett konsekvent intryck
- LinkedIn-länken är viktig för B2B — köpare kontrollerar personers bakgrund innan möte
- hover translateY(-3px) ger ett fint "lyft"-intryck utan att vara överdrivet
- Mobilvy: ett kort per rad ser bäst ut för team-sektioner — personerna behöver plats

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| GeneratePress | Bra | Custom HTML block med column grid |
| Kadence | Utmärkt | Team Member block finns i Kadence Blocks Pro |
| Flatsome | Bra | UX Builder columns + Image box widget |
| Plain HTML | Alltid | Perispa_add_html, CSS grid hanterar layouten |

**Rekommenderat konverteringsmål:** `/convert html` eller `/convert kadence` om Kadence Blocks Pro är installerat.
