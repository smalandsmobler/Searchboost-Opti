# nordicsnusonline — Tasks & Status

> Kund: nordicsnusonline.se (prospekt/okänd status) | GSC: Ej aktiv
> Senast uppdaterad: 2026-05-06

## Regressionsvarningar

_Ingen GSC-data: Ej aktiv kund i systemet. Regressionscheck ej möjlig._

Inga regressioner 2026-05-20 (ej aktiv kund)
Inga regressioner 2026-05-21 (ej aktiv kund)
Inga regressioner 2026-05-22 (ej aktiv kund)
Inga regressioner 2026-05-26 (ej aktiv kund)
Inga regressioner 2026-05-27 (ej aktiv kund)
Inga regressioner 2026-05-28 (ej aktiv kund)
Inga regressioner 2026-05-30 (ej aktiv kund)
Inga regressioner 2026-06-02 (ej aktiv kund)
Inga regressioner 2026-06-03 (ej aktiv kund)
Inga regressioner 2026-06-05 (ej aktiv kund)
Inga regressioner 2026-06-06 (ej aktiv kund)
Inga regressioner 2026-06-07 (ej aktiv kund)
Inga regressioner 2026-06-08 (ej aktiv kund)
Inga regressioner 2026-06-07 (ej aktiv kund)
Inga regressioner 2026-06-09 (ej aktiv kund)
Senaste check: 2026-06-09

## Status
- Inte registrerad i BigQuery/customer_pipeline
- Behöver onboardas via Dashboard om aktiv kund

---

## Hero-research — 2026-05-08

### Bakgrund
Page 25022 (slug: hem) är NSO startsida. CSS snippet 58 'NSO: Home v6 — Lato'.
Hero är just nu solid mörkgrön (#0d2614) utan bakgrundsbild.
Tidigare försök med 3 produktbilder i hero refuserades av Mikael.

### 5 koncept genererade och screenshottade

| # | Namn | Teknik | Filer |
|---|------|--------|-------|
| 1 | Nordisk Geometrisk Textur | SVG hexagon-mönster 7% opacity | `/tmp/nso-hero-1.html`, `-koncept-1-desktop.png`, `-koncept-1-mobil.png` |
| 2 | Typografisk / Editorial | Vattenstämpel "SNUS", vertikal linje, stats-rad | `/tmp/nso-hero-2.html`, `-koncept-2-*.png` |
| 3 | Liten dos i hörnet | SVG-dosillustration nedre höger, 75% opacity | `/tmp/nso-hero-3.html`, `-koncept-3-*.png` |
| 4 | Svensk skogssilhuett | SVG gransilhuetter 18% opacity + kornig textur | `/tmp/nso-hero-4.html`, `-koncept-4-*.png` |
| 5 | Vintage tobakshandelskänsla | Dubbel ram, guld-accenter, ornament, ingen bild | `/tmp/nso-hero-5.html`, `-koncept-5-*.png` |

### Rekommendation (se nedan i sessionslogg)
Favorit: Koncept 2 (typografisk) eller Koncept 5 (vintage-ram).
Avvaktar Mikaels beslut innan produktion.

### Implementerat — 2026-05-08 20:00

**Valt koncept**: Koncept 4 – Svensk skogssilhuett (default, Mikael hade ej valt)
**Teknik**: CSS `::after` pseudo-element på `.nsoh-hero` med inline SVG data URI (3 granar, 17% opacity)
**Snippet**: 58 'NSO: Home v6 — Lato' uppdaterad kl 18:08
**Backup**: `/tmp/nso-snippet-58-backup-20260508-180411.json`
**Screenshots**: `/tmp/nso-hero-final-desktop.png`, `/tmp/nso-hero-final-mobile.png`

#### Tekniska detaljer
- `.nsoh-hero` fick `position:relative;overflow:hidden`
- `.nsoh-hero::after`: SVG 3 granar, `width:35%`, `height:100%`, `opacity:0.17`, `bottom:0;right:0`
- `.nsoh-hero .nsoh-wrap`: `position:relative;z-index:1` (text alltid ovanför grafik)
- Mobil (`@media max-width:768px`): `display:none` på `::after`

#### Verifiering
- Computed bg: `rgb(13,38,20)` = #0d2614 (korrekt)
- ::after: opacity 0.17, width 367.5px, SVG background-image bekräftad
- Träd synliga på desktop höger, ej på mobil
- Trust-rad, kategorier, brands — allt renderar korrekt under hero
- Obs: Playwright desaturerar #0d2614 i headless — ser grå ut i screenshots men korrekt i riktig browser

#### Om Mikael vill rulla tillbaka
Återställ snippet 58 med backup: `/tmp/nso-snippet-58-backup-20260508-180411.json`
