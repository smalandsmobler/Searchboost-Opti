# Sociala medier — Searchboost-mallar

> Format-specifikationer + tonalitets-guide. Per plattform: storlek, palettregler, copy-mönster.

## Tonalitet i alla kanaler

- **Rak och datadriven** — börja ofta med en faktisk siffra
- **Konkret kund-exempel** (anonymiserat när det krävs) — visa, säg inte
- **Aldrig "SEO-tips för 2026"** eller liknande SEO-byrå-floskler
- **Aldrig nämna AI** i kund-facing copy — vi är "semi-autonomt" tekniskt men säljer "resultat"
- **ÅÄÖ alltid** — aldrig "a" eller "o" som ersättning
- **Inga emojis** om inte tråden börjat med en
- Avsluta med konkret nästa-steg eller en fråga som bjuder in dialog

### Bra exempel

> *"En kund ökade organiska klick med 218% i maj. Det märkliga: de gjorde ingenting nytt. Vi flyttade bara fokus från breda nyckelord till long-tail-frågor som redan rankade på sida 2."*

### Dåligt exempel (förbjudet)

> *"🚀 Vill du ta din SEO till nya höjder 2026? Tre tips som kommer att förändra ditt företag för alltid! 💪"*

## LinkedIn — Feed Post

### Format-spec
- **Bild:** 1200 × 627 px (1.91:1)
- **Filformat:** PNG eller JPG
- **Bakgrund:** Deep Space `#05050F`
- **Logo:** Vit, 88px, övre vänster hörn med 32px padding
- **Headline:** Inter Tight Bold 48px, vit eller gradient-text
- **Brand-gradient i nedre höger hörn** som accent (radial 200px diameter, opacitet 0.4)

### Copy-mönster
1. Hook (en mening, gärna med siffra)
2. Vad som faktiskt hände (2–3 meningar)
3. Vad det betyder för läsaren (en mening)
4. Konkret nästa steg eller fråga

### Schemaläggning
- **Sön / tis / tors** — max 3 inlägg/vecka per kund
- Schemaläggs via Lambda `social-scheduler` (BQ `social_content_queue`)

## LinkedIn — Företagssidans banner

- **Storlek:** 1128 × 191 px
- **Innehåll:** Logo + tagline ("Semi-autonom SEO för svenska företag")
- **Bakgrund:** Deep Space med subtil pink-glow vänster

## LinkedIn — Profilbild

- **Storlek:** 400 × 400 px (visas som cirkel)
- **Innehåll:** Bara logo-symbol (om vi har) eller "S"-monogram i pink-gradient
- **Aldrig** hela ordmärket — det syns inte i cirkel-cropp

## X / Twitter

### Format-spec
- **Bild:** 1200 × 675 px (16:9)
- Samma stil som LinkedIn-post
- Copy: max 280 tecken; om längre — använd thread (1/n)

### Schemaläggning
- 2–3 inlägg/vecka. Inte samma copy som LinkedIn — anpassa för X-tonalitet (kortare, mer hot take)

## Instagram (om vi gör det)

### Format-spec
- **Feed:** 1080 × 1080 px (square) eller 1080 × 1350 (portrait)
- **Story:** 1080 × 1920 px (9:16)
- **Reels-cover:** 1080 × 1920

### Tonalitet
- Mer visuell — inga textwalls.
- Statistik visualiserad som chart-bilder (genereras från BQ via Plotly/Chart.js)

## Facebook (sällan — bara om kund explicit kör FB)

- **Feed:** 1200 × 630 px
- **Cover (page):** 820 × 312 px

## Open Graph (länkar från searchboost.se)

- **Storlek:** 1200 × 630 px
- **Auto-genereras** via Next.js `app/opengraph-image.tsx` i searchboost-react
- Default: Deep Space bg + logo + sidans H1

## Bild-template i Figma/Canva

Skapas separat, men ska följa:
1. **Bakgrund:** `#05050F`
2. **Logo top-left:** vit, 88px
3. **H1:** Inter Tight Bold, vit eller `--gradient-primary`
4. **Eyebrow:** Inter Tight Semibold 14px uppercase letter-spacing 0.18em, color `#7A6E90`
5. **Accent:** Radial gradient-glow i ett hörn (`rgba(233, 30, 140, 0.18)` radial 400px)
6. **Inga stock-bilder av "team i kontor"** — det är slop

## Hashtags

Standardiserat fotsteg:
`#SEO #DigitalMarknadsföring #Sverige #SearchBoost`

Plus 1–2 ämnesspecifika tags per inlägg.
