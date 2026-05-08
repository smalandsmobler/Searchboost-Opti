# nordicsnusonline — Tasks & Status

> Kund: nordicsnusonline.se (prospekt/okänd status) | GSC: Ej aktiv
> Senast uppdaterad: 2026-05-06

## Regressionsvarningar

_Ingen GSC-data: Ej aktiv kund i systemet. Regressionscheck ej möjlig._

Senaste check: 2026-05-08

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

### Nästa steg
- Mikael väljer koncept
- Implementera i snippet 58 på NSO /sv/
- Inga gigantiska produktbilder (Mikaels nolltolerans)
