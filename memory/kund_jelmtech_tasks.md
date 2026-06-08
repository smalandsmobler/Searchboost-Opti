# Jelmtech — Content & SEO Tasks

> Kund sedan: 2026-02-18 | Deal: 24 000 SEK | Sajt: jelmtech.se
> Senast uppdaterad: 2026-05-20

## Regressionsvarningar

_Ingen GSC-data: Ej kopplad (inte ägare / ej konfigurerad). Regressionscheck ej möjlig._

Inga regressioner 2026-05-20 (GSC ej konfigurerad)
Inga regressioner 2026-05-21 (GSC ej konfigurerad)
Inga regressioner 2026-05-22 (GSC ej konfigurerad)
Inga regressioner 2026-05-26 (GSC ej konfigurerad)
Inga regressioner 2026-05-27 (GSC ej konfigurerad)
Inga regressioner 2026-05-28 (GSC ej konfigurerad)
Inga regressioner 2026-05-30 (GSC ej konfigurerad)
Inga regressioner 2026-06-02 (GSC ej konfigurerad)
Inga regressioner 2026-06-03 (GSC ej konfigurerad)
Inga regressioner 2026-06-05 (GSC ej konfigurerad)
Inga regressioner 2026-06-06 (GSC ej konfigurerad)
Inga regressioner 2026-06-07 (GSC ej konfigurerad)
Senaste check: 2026-06-06

## Publicerade artiklar

| Datum      | Titel | URL | Fokuskeyword |
|------------|-------|-----|-------------|
| 2026-04-19 | Konstruktionsplast — materialegenskaper och val | https://jelmtech.se/produktutveckling/konstruktionsplast-egenskaper-guide/ | konstruktionsplast |
| 2026-04-19 | Insert moulding — ingjutna infästningar | https://jelmtech.se/produktutveckling/insert-moulding-guide/ | insert moulding |
| 2026-04-19 | Polyamid formsprutning — PA6 och PA66 | https://jelmtech.se/produktutveckling/polyamid-formsprutning-guide/ | polyamid formsprutning |
| 2026-04-20 | Teknisk plast: Egenskaper, material | https://jelmtech.se/produktutveckling/teknisk-plast-egenskaper-material-och-industriella-tillampningar/ | teknisk plast |
| 2026-04-20 | Plastkomponenter: Komplett guide | https://jelmtech.se/produktutveckling/plastkomponenter-en-komplett-guide-for-industriella-tillverkare/ | plastkomponenter |
| 2026-04-20 | Formsprutad detalj: Från konstruktion till komponent | https://jelmtech.se/produktutveckling/formsprutad-detalj-fran-konstruktion-till-fardig-komponent/ | formsprutad detalj |
| 2026-04-21 | Glasfiberarmerad plast — egenskaper | https://jelmtech.se/produktutveckling/glasfiberarmerad-plast-guide/ | glasfiberarmerad plast |
| 2026-04-21 | Kostnad för formsprutningsverktyg | https://jelmtech.se/produktutveckling/kostnad-formsprutningsverktyg/ | formsprutningsverktyg kostnad |
| 2026-04-21 | Bioplast i produktutveckling | https://jelmtech.se/produktutveckling/bioplast-produktutveckling-guide/ | bioplast formsprutning |
| 2026-05-07 | ABS-plast — egenskaper, formsprutning och industriella tillämpningar | ✅ LIVE | ABS-plast formsprutning |
| 2026-05-15 | PP-plast formsprutning — komplett guide till polypropylen | ⏳ VÄNTAR — kör scripts/publish-jelmtech-pp-plast.js från EC2 | PP plast formsprutning |
| 2026-05-?? | Plastprototyp — komplett guide 2026 | ⚠️ Google-indexerad men 404! Kontrollera draft/scheduled i WP-admin | plastprototyp |
| 2026-06-08 | POM/acetal formsprutning — komplett guide till polyoximetyl​en | ⏳ VÄNTAR — kör scripts/publish-jelmtech-pom-acetal.js från EC2 | POM formsprutning |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-20

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| **FIXA plastprototyp-artikel**: Google indexerat men URL ger 404 — öppna WP-admin → Posts och kontrollera draft/scheduled-status. Om draft: publicera. Om borttagen: återpublicera. | **BRÅDSKANDE** | SEO-ranking-möjligheten finns men går förlorad på 404 |
| **DEPLOY PP-plast guide**: `node scripts/publish-jelmtech-pp-plast.js` — Elmia Polymer 2026 pågår (19–22 maj, Jönköping), söktrafiken på plastmaterial är på topp JUST NU | **HÖG** | Timing: Elmia Polymer-veckan = maximal sökintresse |
| **Skriv**: Kort branschkommentar "Elmia Polymer 2026 — trender och nyheter" (400–600 ord) — publicera senast 23 maj | **HÖG** | Timing-content ingen konkurrent kan replikera, Holmgrens/AMB/Plasthuset inaktiva |
| Skriv: "POM/acetal formsprutning — egenskaper och tillämpningar" | HÖG | Ingen konkurrent (Holmgrens, AMB, Plasthuset) har POM-guide |
| Skriv: "Toleranser vid formsprutning — vad är möjligt?" | Medel | Noll konkurrens på detta sökord |
| Skriv: "Ytbehandling av plastdetaljer — lackning, beläggning och IMD" | Medel | AMB nämner det inte, Holmgrens inte heller |

## Nästa artikelidéer (ej skrivna)

| Prioritet | Ämne | Fokuskeyword |
|-----------|------|-------------|
| Hög | Elmia Polymer 2026 — branschkommentar (timing!) | elmia polymer 2026 |
| ✅ KLAR | POM / acetal formsprutning | POM formsprutning — kör scripts/publish-jelmtech-pom-acetal.js |
| Medium | Toleranser vid formsprutning | formsprutning toleranser |
| Medium | Medicinteknisk produktutveckling | medicinteknisk produktutveckling |
| Låg | PC-plast (polykarbonat) egenskaper | polykarbonat formsprutning |
| Låg | Ytbehandling av plastdetaljer | ytbehandling plast |

## Publiceringsskript
```bash
cd /home/ubuntu/Searchboost-Opti
node scripts/publish-jelmtech-abs-artikel.js
node scripts/publish-jelmtech-pp-plast.js
```

## Status
- WP-creds: Troligen OK i SSM (artiklar publiceras autonomt sedan april)
- GSC: Ej kopplad (inte ägare / ej konfigurerad)
- Rank Math: Används (se befintliga artiklar)
- Kategori-ID: 48 (Produktutveckling)

## Vecka-briefing-länk
- 2026-05-04: content-pages/weekly-briefing/2026-05-04.md
