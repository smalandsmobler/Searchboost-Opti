# CONTENT BLUEPRINT: JELMTECH.SE

> **Kund:** Jelmtech Produktutveckling AB
> **Kontakt:** Camilla Lundström (camilla.lundstrom@jelmtech.se)
> **Period:** Mars — Maj 2026 (3 månader)
> **Budget:** 8 000 kr/mån (Standard)
> **Utfört av:** Searchboost.se
> **Datum:** 2026-03-07

---

## SAMMANFATTNING

Jelmtech är ett B2B-produktutvecklingsföretag i Skåne. Sajten har stark varumärkesranking (#1 "produktutveckling företag") men lider av tekniska SEO-problem, brist på content och föråldrade projektsidor. Denna blueprint täcker 12 veckors arbete: teknisk grund → content-produktion → scaling.

**Mål efter 3 månader:**
- 10-15 nyckelord på Googles förstasida (idag: 4)
- 300-500 organiska besökare/mån (idag: ~50)
- 3-5 kvalificerade B2B-leads/mån

---

## NYCKELORDSSTRATEGI — 30 ABC-nyckelord i 5 kluster

### Kluster 1: Industridesign & Formgivning
| Nyckelord | Tier | Volym/mån | Målsida |
|-----------|------|-----------|---------|
| industridesign sverige | A | 40 | /industridesign/ + Artikel 1 |
| industriell design | A | 50 | /industridesign/ + Artikel 1 |
| industriell formgivning | B | 12 | Artikel 1 |
| industridesign stockholm | C | 3 | Artikel 1 (geo) |

### Kluster 2: Produktutveckling & Prototyping
| Nyckelord | Tier | Volym/mån | Målsida |
|-----------|------|-----------|---------|
| produktutveckling | A | 60 | / (startsida) |
| produktdesign konsult | A | 20 | /tjanster/ |
| b2b produktutveckling | A | 15 | / + Artikel 4 |
| rapid prototyping sverige | A | 22 | /prototyper/ + Artikel 2 |
| prototyp utveckling | B | 20 | /prototyper/ + Artikel 2 |
| funktionsbaserad design | B | 6 | /produktoptimering/ |
| jelmtech produktutveckling | C | 1 | / (varumärke) |

### Kluster 3: Formsprutning & Tillverkning
| Nyckelord | Tier | Volym/mån | Målsida |
|-----------|------|-----------|---------|
| formsprutning | A | 35 | /konstruktion-.../ + Artikel 3 |
| tillverkningsmetoder | A | 30 | Artikel 6 |
| formsprutning plast | B | 14 | Artikel 3 |
| design tillverkning | B | 16 | /verktygsberedning/ |
| formsprutning komponenter | C | 5 | Artikel 3 |
| plastformsprutning sverige | C | 7 | Artikel 3 (geo) |

### Kluster 4: Mekanik & Konstruktion
| Nyckelord | Tier | Volym/mån | Målsida |
|-----------|------|-----------|---------|
| mekanikutveckling | A | 25 | Befintlig tjänstesida |
| 3d design konstruktion | A | 35 | /simulering-analys/ + Artikel 5 |
| konstruktionsritningar | B | 18 | Artikel 5 |
| maskindesign | B | 25 | Artikel 5 |
| teknisk design konsult | B | 10 | /tjanster/ |
| cad design tjänst | B | 22 | Artikel 5 |
| konstruktiv design | B | 8 | /produktoptimering/ |

### Kluster 5: Case Studies & Geo
| Nyckelord | Tier | Volym/mån | Målsida |
|-----------|------|-----------|---------|
| mech design tillverkning | C | 4 | Case study |
| mekanisk design utveckling | C | 5 | Case study |
| 3d modellering tillverkning | C | 8 | Case study |
| cnc bearbetning design | C | 6 | /verktygsberedning/ |
| design för tillverkning sverige | C | 4 | Artikel 7 (geo) |
| industriell problemlösning | C | 3 | /about/ + FAQ |

**Total målvolym:** ~486 sökningar/mån → 5-10% CTR = 24-49 besökare/mån bara från nyckelord

---

## MÅNAD 1: SETUP & TEKNISK SEO (Mars 2026)

### Vecka 1 — Onboarding & Grundläggande fixes

| Uppgift | Detalj | Prio |
|---------|--------|------|
| Installera Rank Math SEO PRO | Aktivera, importera Divi-metadata | KRITISK |
| Fixa language-attribut | `en-US` → `sv-SE` i Divi/WordPress | KRITISK |
| Meta-descriptions alla sidor | 48 sidor × unika meta-desc (155 tecken) | HÖG |
| H1-taggar | Verifiera + optimera på alla 19 sidor | HÖG |
| Robots.txt | Blockera /arbetssida/, /project/testsida/, /project/x/ | MEDEL |

**Meta-description-förslag (de viktigaste):**

| Sida | Meta-description |
|------|-----------------|
| / | "Jelmtech — er partner inom produktutveckling, industridesign och prototyper. Från idé till färdig produkt. Kontakta oss för en kostnadsfri konsultation." |
| /industridesign/ | "Professionell industridesign från koncept till tillverkning. Jelmtech hjälper er med formgivning, 3D-modellering och produktoptimering i Sverige." |
| /konstruktion-plastkonstruktion-platkonstruktion/ | "Expert på plastkonstruktion och plåtkonstruktion. Vi designar formsprutade komponenter, extruderad aluminium och formgods. Kontakta Jelmtech." |
| /prototyper/ | "Snabb prototypframtagning med 3D-print och CNC. Från digital modell till fysisk prototyp på dagar. Rapid prototyping i Sverige — Jelmtech." |
| /kontakt/ | "Kontakta Jelmtech för produktutveckling, industridesign eller prototyper. Vi sitter i Skåne och jobbar med företag i hela Sverige." |

### Vecka 2 — Schema Markup & Bildoptimering

| Uppgift | Detalj |
|---------|--------|
| LocalBusiness schema | Adress, telefon, öppettider, geo-koordinater |
| Service schema × 4 | Konstruktion, Industridesign, Prototyper, Projektledning |
| Person schema | Team/grundare med E-E-A-T-signaler |
| Bildoptimering | WebP-konvertering, lazy loading, alt-text på alla bilder |
| Cache-plugin | WP Rocket eller LiteSpeed Cache → PageSpeed 56→75+ |

### Vecka 3 — URL-sanering & Redirects

| Åtgärd | Antal | Detalj |
|--------|-------|--------|
| /uncategorized/ → /blogg/ | 15 st | 301-redirect alla blogginlägg |
| Siffror-URL:er → vettiga | 6 st | /uncategorized/4462/ → /blogg/[titel]/ |
| noindex testsidor | 3 st | /arbetssida/, /project/testsida/, /project/x/ |
| Author-URL:er → /blogg/ | 3 st | /av-carl-fredrik-emilsson/... → /blogg/... |

**Redirect-lista:**

```
/uncategorized/battre-sving-med-dewiz-golf/ → /blogg/dewiz-golf-samarbete/
/uncategorized/4462/ → /blogg/nyheter-2021/ (eller noindex)
/uncategorized/4445/ → /blogg/nyheter-2021-2/ (eller noindex)
/uncategorized/mekanikkonstruktor-sokes/ → /blogg/mekanikkonstruktor-sokes/
/uncategorized/glad-sommar/ → /blogg/glad-sommar/
/uncategorized/celsicom/ → /blogg/celsicom-samarbete/
/uncategorized/5592/ → noindex/ta bort
/uncategorized/5562/ → noindex/ta bort
/uncategorized/mekanikkonstruktor-sokes-2/ → 301 → /blogg/mekanikkonstruktor-sokes/
/uncategorized/tack-for-besoket/ → /blogg/tack-for-besoket/
/uncategorized/narproducerade-konsulttjanster/ → /blogg/narproducerade-konsulttjanster/
/uncategorized/besok-i-skolan-.../ → /blogg/besok-i-skolan/
/uncategorized/plast-problem-och-mojligheter-.../ → /blogg/plast-problem-och-mojligheter/
/uncategorized/samverkan/ → /blogg/samverkan/
/uncategorized/interna-spanningar-i-pc/ → /blogg/interna-spanningar-plast/
/uncategorized/6300/ → noindex/ta bort
/uncategorized/7003/ → noindex/ta bort
/av-carl-fredrik-emilsson/trend-att-ta-hem-.../ → /blogg/trend-ta-hem-produktion/
/av-marknadsavdelningen/fran-ide-till-fardig-produkt/ → /blogg/fran-ide-till-fardig-produkt/
/av-marknadsavdelningen/kreativt-samarbete-jelmtech-thule/ → /blogg/samarbete-jelmtech-thule/
```

### Vecka 4 — Intern länkstruktur & CTAs

| Uppgift | Detalj |
|---------|--------|
| Intern länkning | 20-30 strategiska länkar mellan tjänstesidor |
| CTAs på tjänstesidor | "Kontakta oss för en kostnadsfri konsultation" på varje sida |
| Footer-länkar | Snabblänkar till alla tjänster |
| Breadcrumbs | Aktivera via Rank Math (om ej redan aktiv via Divi) |

**Intern länkplan:**

| Från | Till | Ankartext |
|------|------|-----------|
| /industridesign/ | /prototyper/ | "snabb prototypframtagning" |
| /industridesign/ | /produktoptimering/ | "optimera er befintliga produkt" |
| /konstruktion-.../ | /verktygsberedning/ | "verktygsberedning för produktion" |
| /prototyper/ | /simulering-analys/ | "simulering innan produktion" |
| /projektledning/ | /kontakt/ | "boka ett möte" |
| /hallbar-produktutveckling/ | /konstruktion-.../ | "hållbara materialval" |
| / (startsida) | /projekt/ | "se våra referensprojekt" |
| /about/ | /tjanster/ | "våra tjänster" |

**Förväntad effekt månad 1:** Sajten crawlbar, teknisk score 62→80+, 2-3 nya nyckelord indexeras.

---

## MÅNAD 2: CONTENT-PRODUKTION (April 2026)

### Artikel 1: "Industridesign: Från Koncept till Färdig Produkt"
**Publicering:** Vecka 5

| Parameter | Värde |
|-----------|-------|
| **Primärt nyckelord** | industridesign sverige (40 sök/mån) |
| **Sekundära** | industriell design (50), industriell formgivning (12), industridesign stockholm (3) |
| **Meta-title** | Industridesign i Sverige: Från Koncept till Produkt | Jelmtech |
| **Meta-desc** | Komplett guide till industridesign — process, kostnader och fördelar. Lär dig hur professionell formgivning tar er produkt från skiss till marknad. |
| **Målsida** | /blogg/industridesign-guide/ |
| **Ordantal** | 1 800-2 000 ord |
| **Intern länkning** | → /industridesign/, /prototyper/, /produktoptimering/, /kontakt/ |

**Artikelstruktur:**
1. Intro: Vad är industridesign och varför behöver ert företag det?
2. Industridesign-processen steg för steg (H2)
   - Kravspecifikation & briefing
   - Konceptutveckling & skisser
   - 3D-modellering & rendering
   - Prototyp & testning
   - Produktionsanpassning
3. Skillnaden mellan industridesign och produktdesign (H2)
4. Vad kostar industridesign? Prisguide 2026 (H2)
5. Fördelar med att anlita en industridesignbyrå (H2)
6. Vanliga misstag vid produktutveckling (H2)
7. Checklista: Innan ni startar ert designprojekt (H2)
8. CTA: "Boka en kostnadsfri konsultation med Jelmtech"

---

### Artikel 2: "Rapid Prototyping: Fördelar, Kostnader & Process"
**Publicering:** Vecka 6

| Parameter | Värde |
|-----------|-------|
| **Primärt nyckelord** | rapid prototyping sverige (22 sök/mån) |
| **Sekundära** | produktutveckling (60), prototyp utveckling (20), produktdesign konsult (20) |
| **Meta-title** | Rapid Prototyping i Sverige: Guide till Snabb Prototypframtagning | Jelmtech |
| **Meta-desc** | Allt om rapid prototyping — 3D-print, CNC och vakuumgjutning. Från digital modell till fysisk prototyp på dagar. Jämför metoder och kostnader. |
| **Målsida** | /blogg/rapid-prototyping-guide/ |
| **Ordantal** | 1 500-1 800 ord |
| **Intern länkning** | → /prototyper/, /simulering-analys/, /konstruktion-.../, /kontakt/ |

**Artikelstruktur:**
1. Intro: Varför prototyper är avgörande för produktutveckling
2. Vad är rapid prototyping? Definition & historia (H2)
3. Metoder: 3D-print, CNC, vakuumgjutning, SLA/SLS (H2)
4. Jämförelse: Vilken metod passar ert projekt? (H2) — tabell
5. Kostnader: Vad kostar en prototyp i Sverige 2026? (H2)
6. Tidslinjer: Från CAD till fysisk produkt (H2)
7. Case: Så tog vi [Projekt X] från idé till prototyp på 2 veckor (H2)
8. CTA: "Skicka er CAD-fil — vi ger offert inom 24h"

---

### Artikel 3: "Formsprutning 101: Material, Process & Kostnader"
**Publicering:** Vecka 7

| Parameter | Värde |
|-----------|-------|
| **Primärt nyckelord** | formsprutning (35 sök/mån) |
| **Sekundära** | formsprutning plast (14), plastformsprutning sverige (7), formsprutning komponenter (5) |
| **Meta-title** | Formsprutning: Komplett Guide till Plastproduktion | Jelmtech |
| **Meta-desc** | Allt om formsprutning — material, process, verktyg och kostnader. Lär dig när formsprutning lönar sig och hur ni optimerar era plastkomponenter. |
| **Målsida** | /blogg/formsprutning-guide/ |
| **Ordantal** | 1 800-2 000 ord |
| **Intern länkning** | → /konstruktion-.../, /verktygsberedning/, /hallbar-produktutveckling/, /kontakt/ |

**Artikelstruktur:**
1. Intro: Formsprutning — den vanligaste tillverkningsmetoden för plast
2. Hur fungerar formsprutning? Steg-för-steg (H2) — med processdiagram
3. Vanliga material: PP, PE, ABS, PA, PC (H2) — egenskaper-tabell
4. Verktyg & formar: Kostnader och livslängd (H2)
5. När lönar sig formsprutning? Volymbrytpunkter (H2)
6. Konstruktion för formsprutning: DFM-principer (H2)
7. Vanliga problem & lösningar (H2)
8. Hållbar formsprutning: Återvunnen plast & biobaserade material (H2)
9. CTA: "Vi hjälper er med konstruktion anpassad för formsprutning"

---

### Artikel 4: "Case Study: Från Idé till Färdig Produkt — Jelmtech × [Kund]"
**Publicering:** Vecka 8

| Parameter | Värde |
|-----------|-------|
| **Primärt nyckelord** | b2b produktutveckling (15 sök/mån) |
| **Sekundära** | 3d design konstruktion (35), produktutveckling (60) |
| **Meta-title** | Case Study: B2B Produktutveckling | Jelmtech |
| **Meta-desc** | Se hur Jelmtech hjälpte [Kund] ta en produkt från koncept till serieproduktion. Industridesign, prototyper och produktionsanpassning. |
| **Målsida** | /blogg/case-study-produktutveckling/ |
| **Ordantal** | 1 200-1 500 ord |
| **Intern länkning** | → /projekt/, alla tjänstesidor, /kontakt/ |

**OBS:** Behöver input från Camilla — vilket projekt kan vi använda? Thule, GARO eller Swedish Match finns redan som gamla projektsidor.

**Artikelstruktur:**
1. Kund-intro: Vem är [Kund] och vad var utmaningen?
2. Uppdraget: Vad behövde de? (H2)
3. Vår process: Design → Prototyp → Test → Produktion (H2)
4. Resultat: Siffror, tidsbesparingar, kvalitetsförbättringar (H2)
5. Kundens ord (citat/testimonial) (H2)
6. Lärdomar & takeaways (H2)
7. CTA: "Har ni ett liknande projekt? Kontakta oss"

---

### FAQ-sida
**Publicering:** Vecka 6-7 (parallellt med artiklar)

| Parameter | Värde |
|-----------|-------|
| **Schema** | FAQPage (JSON-LD) |
| **Målsida** | /vanliga-fragor/ (ny sida) |
| **Nyckelord** | Long-tail + "industriell problemlösning" (C) |

**15 FAQ-frågor:**
1. Vad kostar produktutveckling?
2. Hur lång tid tar ett produktutvecklingsprojekt?
3. Vad är skillnaden mellan industridesign och produktutveckling?
4. Kan ni hjälpa med befintliga produkter?
5. Vilka material jobbar ni med?
6. Vad är rapid prototyping?
7. Hur fungerar formsprutning?
8. Behöver jag en färdig CAD-modell?
9. Jobbar ni med patent och IP?
10. Var sitter Jelmtech?
11. Kan ni ta ett projekt från idé till produktion?
12. Vad kostar en prototyp?
13. Hur väljer jag rätt tillverkningsmetod?
14. Kan ni hjälpa med hållbar produktutveckling?
15. Vad innebär DFM (Design for Manufacturing)?

---

### Projektsidor — Uppdatering (2017 → 2026)
**Vecka 5-8 (löpande)**

| Projektsida | Åtgärd |
|-------------|--------|
| /project/stol-embrace/ | Uppdatera text, lägg till resultat, ny bild |
| /project/mobilbox/ | Uppdatera, länka till /industridesign/ |
| /project/ls4-laddstolpe/ | GARO-case, länka till /konstruktion-.../ |
| /project/garo/ | Slå ihop med ls4-laddstolpe eller ta bort duplikat |
| /project/testsida/ | TA BORT (noindex redan vecka 1) |
| /project/x/ | TA BORT |

**Förväntad effekt månad 2:** 4 nya artiklar indexerade, 5-8 nyckelord sida 1-3, ~100-200 besökare/mån.

---

## MÅNAD 3: SCALING & LÄNKBYGGE (Maj 2026)

### Artikel 5: "Mekanikutveckling & CAD-konstruktion: Komplett Guide"
**Publicering:** Vecka 9

| Parameter | Värde |
|-----------|-------|
| **Primärt nyckelord** | mekanikutveckling (25 sök/mån) |
| **Sekundära** | maskindesign (25), cad design tjänst (22), konstruktionsritningar (18) |
| **Meta-title** | Mekanikutveckling & CAD-konstruktion i Sverige | Jelmtech |
| **Meta-desc** | Expert på mekanikutveckling och CAD-konstruktion. Vi tar er produkt från 3D-modell till produktionsklar ritning. Kontakta Jelmtech för offert. |
| **Målsida** | /blogg/mekanikutveckling-cad-guide/ |
| **Ordantal** | 1 500-1 800 ord |

### Artikel 6: "Hållbar Produktutveckling: Minska Miljöpåverkan Utan Att Kompromissa"
**Publicering:** Vecka 10

| Parameter | Värde |
|-----------|-------|
| **Primärt nyckelord** | hållbar produktutveckling (befintlig tjänstesida) |
| **Sekundära** | tillverkningsmetoder (30), design för tillverkning sverige (4) |
| **Meta-title** | Hållbar Produktutveckling: Guide för Tillverkande Företag | Jelmtech |
| **Målsida** | /blogg/hallbar-produktutveckling-guide/ |
| **Ordantal** | 1 500 ord |

### Artikel 7: "Produktutveckling i Skåne: Lokala Partners för Tillverkningsindustrin"
**Publicering:** Vecka 11

| Parameter | Värde |
|-----------|-------|
| **Primärt nyckelord** | produktutveckling skåne (GSC pos #7) |
| **Sekundära** | produktdesign konsult (20), industridesign stockholm (3) |
| **Meta-title** | Produktutveckling Skåne: Jelmtech — Er Lokala Partner | Jelmtech |
| **Målsida** | /blogg/produktutveckling-skane/ |
| **Ordantal** | 1 200 ord |
| **Fokus** | Geo-SEO, LocalBusiness, Skåne/Sydsverige-fokus |

### Länkbygge (Vecka 9-12)

**Strategi:** Kvalitet framför kvantitet. Mål: 5-10 kvalitetslänkar (inte skräpkataloger).

| Typ | Mål | Metod |
|-----|-----|-------|
| Branschföreningar | Teknikföretagen, Industridesignerorganisationen | Medlemsprofil + artikel |
| Partners/kunder | Thule, Swedish Match, GARO, Dewiz Golf | Be om länk från deras hemsida |
| Innovationsplattformar | Innovatum, RISE, Almi | Projektsamarbete → pressmeddelande |
| Lokala nätverk | Företagarna Skåne, Nätverk Sydost | Lokala event + sponsring |
| Gästartiklar | Ny Teknik, Elektroniktidningen, PlastForum | Expertartikel om formsprutning/hållbarhet |

### CRO — Kontaktsida (Vecka 12)

| Åtgärd | Detalj |
|--------|--------|
| Google Map | Embedded karta med Jelmtechs kontor |
| Telefonnummer | Click-to-call med GTM-tracking |
| Formulär-optimering | Färre fält, tydlig CTA-knapp |
| Sociala länkar | LinkedIn, eventuellt YouTube |
| Trust signals | Kundlogotyper (Thule, GARO etc.) |

**Förväntad effekt månad 3:** 10-15 nyckelord förstasida, 3-5 leads/mån, 300-500 besökare/mån.

---

## VECKOKALENDER — KOMPLETT ÖVERSIKT

| Vecka | Datum | Fokus | Leverabler |
|-------|-------|-------|------------|
| 1 | 10-14 mar | Onboarding | Rank Math, language fix, meta-desc (48 st) |
| 2 | 17-21 mar | Schema & bilder | LocalBusiness, Service × 4, bildoptimering |
| 3 | 24-28 mar | URL-sanering | 20+ redirects, noindex testsidor |
| 4 | 31 mar-4 apr | Intern länkning | 20-30 interna länkar, CTAs, breadcrumbs |
| 5 | 7-11 apr | Artikel 1 + projektsidor | Industridesign-guide (2000 ord) |
| 6 | 14-18 apr | Artikel 2 + FAQ | Rapid Prototyping-guide + FAQ-sida |
| 7 | 21-25 apr | Artikel 3 | Formsprutning 101 (2000 ord) |
| 8 | 28 apr-2 maj | Artikel 4 | Case Study + projektsidor klara |
| 9 | 5-9 maj | Artikel 5 + länkbygge | Mekanikutveckling-guide + outreach start |
| 10 | 12-16 maj | Artikel 6 | Hållbar produktutveckling |
| 11 | 19-23 maj | Artikel 7 | Geo-SEO Skåne-artikel |
| 12 | 26-30 maj | CRO + rapport | Kontaktsida-optimering, slutrapport |

---

## KPI:ER & MÄTNING

| KPI | Nuläge | Mål Mån 1 | Mål Mån 2 | Mål Mån 3 |
|-----|--------|-----------|-----------|-----------|
| Organisk trafik | ~50/mån | 60-80 | 100-200 | 300-500 |
| Nyckelord topp 10 | 4 | 6-8 | 10-12 | 15-20 |
| Nyckelord topp 3 | 2 | 2-3 | 4-5 | 6-8 |
| Indexerade sidor | 48 | 48 | 55+ | 60+ |
| PageSpeed (mobil) | 56 | 75+ | 80+ | 85+ |
| Backlinks (kvalitet) | 0 | 0 | 1-2 | 5-10 |
| Leads/mån | 0 | 0-1 | 1-2 | 3-5 |

---

## BEROENDEN & INPUT FRÅN KUND

| Behov | Från | Deadline |
|-------|------|----------|
| Rank Math PRO licens | Camilla (eller Searchboost betalar) | Vecka 1 |
| Godkänn redirect-lista | Camilla | Vecka 3 |
| Case study-material | Camilla (bilder, siffror, kundcitat) | Vecka 6 |
| Projektsidor: uppdaterade bilder | Camilla | Vecka 5 |
| Partnerföretag för länkbygge | Camilla (intros till Thule/GARO) | Vecka 9 |

---

## BUDGET & ROI

| Post | Kostnad |
|------|---------|
| 3 mån SEO-arbete | 24 000 kr |
| Rank Math PRO (årslicens) | ~600 kr |
| WP Rocket (årslicens) | ~500 kr |
| **Totalt** | **~25 100 kr** |

| Period | Förväntad trafik | Förväntade leads | Uppskattat värde* |
|--------|------------------|------------------|-------------------|
| Månad 1 | 60-80 | 0-1 | 0-15 000 kr |
| Månad 3 | 300-500 | 3-5 | 45 000-250 000 kr |
| Månad 6 | 800-1 200 | 6-10 | 90 000-500 000 kr |
| Månad 12 | 1 000-1 500 | 8-15 | 120 000-750 000 kr |

*B2B-lead i produktutveckling = 15 000-50 000 kr genomsnittligt ordervärde*

**ROI efter 3 månader:** 180-1 000% (vid 3-5 leads)

---

*Content Blueprint framtagen av Searchboost.se — Mars 2026*
*Nästa review: 2026-04-07*
