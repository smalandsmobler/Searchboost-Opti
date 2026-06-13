# Hero — Hälsa & Välfärd

## Description

Welcoming, empathetic hero section for healthcare and wellness clients — clinics, physiotherapists, nutritionists, wellness centers, dental practices. The design communicates trust, calm and care. Dual CTA gives visitors a choice between booking immediately and reading more.

Use this component when:
- Building a new site for any health or wellness client
- Replacing a cold or clinical-looking existing hero
- A healthcare client wants to stand out from generic template designs

---

## 21st.dev Prompt

```
Create a hero section for a Swedish healthcare or wellness clinic. Requirements:

Layout:
- Full viewport width, min-height 85vh
- Two-column layout on desktop: right column has image (55%), left column has text content (45%)
- Soft, airy feel — lots of white space
- Background: clean white (#FFFFFF) with a subtle decorative shape (large circle or soft blob) in #E8F4F0 (pale green) positioned behind the image, z-index -1

Left column (text):
- Small pill badge above headline: "Bokningsbar tid idag" or similar. Pill shape, background #E8F4F0, text color #2D7D62, font-size 0.75rem, font-weight 600, padding 6px 14px, border-radius 20px, inline-flex
- Main headline: large, bold, dark (#1C2B2A), font-size clamp(2rem, 3.5vw, 3rem), line-height 1.2, max-width 480px
- Supporting paragraph: 2 sentences, empathetic tone, font-size 1.0625rem, color #4A6462, line-height 1.7, max-width 420px, margin-top 16px
- Dual CTA row: flex, gap 16px, margin-top 32px
  - Primary button: "Boka tid" — solid #2D7D62 background, white text, border-radius 6px, padding 14px 28px, font-weight 600
  - Secondary button: "Läs mer" — white background, #2D7D62 border (2px solid), #2D7D62 text, same padding, hover: fill solid
- Trust row below CTAs: small flex row, gap 24px, margin-top 28px. Each item: small checkmark icon (#2D7D62) + short text in #4A6462, font-size 0.8125rem

Right column (image):
- Tall image area: aspect-ratio 3/4, border-radius 20px, overflow hidden, background #D0EAE4 (placeholder)
- Image shows smiling, approachable healthcare professional or happy patient in natural light setting
- Floating card overlay in bottom-left of image: white background, border-radius 10px, padding 16px 20px, box-shadow 0 4px 20px rgba(0,0,0,0.12)
  - Card content: green star icon + "4.9/5 stjärnor" in bold dark + "baserat på 200+ omdömen" in small muted text

Mobile (below 768px): single column, image above text, image height 320px, border-radius 12px

Typography: system-ui, no external fonts
Semantic HTML: <section>, <h1>, <p>, <a>, <ul> for trust items
Soft, rounded aesthetic throughout — no sharp corners
```

---

## Swedish text suggestions

**Badge:**
> Bokningsbar tid idag · Inga väntetider · Öppen för nya patienter

**Rubrik — klinik:**
> Din hälsa är vår prioritet

**Rubrik — fysioterapeut:**
> Kom tillbaka till ett liv utan smärta

**Rubrik — nutritionist:**
> Mat som tar hand om dig — inifrån och ut

**Rubrik — tandläkare:**
> Tandvård som du faktiskt ser fram emot

**Undertext — klinik:**
> Vi erbjuder personlig vård i en lugn och välkomnande miljö. Boka din tid online på under 2 minuter.

**Undertext — fysioterapeut:**
> Med evidensbaserad behandling och individuellt anpassad rehabilitering hjälper vi dig att återfå full rörlighet.

**Primär CTA:** Boka tid
**Sekundär CTA:** Läs mer om oss / Se våra behandlingar

**Trust-signaler:**
- Legitimerade terapeuter
- Diskret och tryggt
- Samma dag-tider tillgängliga

**Flytande kort:**
> 4.9/5 stjärnor — baserat på 200+ omdömen

---

## Design notes

- Färgpaletten ska vara mjuk och lugn: grönt (#2D7D62) som primär, aldrig skrikande
- Om klienten arbetar med blå profil (psykologi, vård): byt #2D7D62 → #2A6090, #E8F4F0 → #EAF0F8
- Det flytande kortet på bilden är ett starkt konverteringselement — behåll det alltid
- Dubbel CTA fungerar bäst: primär för de som är redo att boka, sekundär för de som behöver mer info
- Bilden ska vara varm och mänsklig — undvik kalla, sterila sjukhusmiljöer

---

## Theme compatibility

| Theme | Kompatibilitet | Noteringar |
|-------|---------------|-----------|
| GeneratePress | Utmärkt | Full-width section med custom HTML block |
| Kadence | Utmärkt | Kadence Sections + Kadence Blocks |
| Flatsome | Bra | UX Builder row med custom CSS för blob-bakgrunden |
| Plain HTML | Alltid | Perispa_add_html i page top-widget |

**Rekommenderat konverteringsmål:** `/convert html` — blob-bakgrunden och overlay-kortet är lättast att kontrollera i plain HTML.
