# Mekanisk testning av plastkomponenter — vad, när och hur

**Focus keyword:** mekanisk testning plastkomponenter
**Meta description:** Mekanisk testning av plastkomponenter — dragprov, slagprov, utmattning, creep. Så väljer du rätt test för din detalj och undviker fältfel.
**Kategori:** Produktutveckling (ID 48)
**Slug:** mekanisk-testning-plastkomponenter

---

## Varför testa plastkomponenter mekaniskt?

Plast är ett lömskt material ur prestandasynpunkt. Datablad ger dig ofta fina värden för draghållfasthet och E-modul — men de är mätta på standardiserade provstavar vid 23 °C och 50 % relativ luftfuktighet, oftast efter 48 timmars konditionering. Din faktiska detalj sitter i ett fordonsinstrumentbräde som blir 80 °C i solen, eller i en poolpump som är nedsänkt i klorvatten, eller i en batteri-kapsling som får slag under transport.

Mekanisk testning av plastkomponenter är bron mellan teoretisk data och verklig prestanda. Den visar hur din faktiska detalj — med dess specifika geometri, verktygsfyllning, ingjut, weld-lines och efterbehandling — beter sig under de belastningar den kommer möta i drift.

Utan fysiska tester bygger du på förhoppningar. Med tester bygger du på fakta.

## De fem grundtesterna

För en normal plastdetalj i en konsument- eller industriprodukt är det fem mekaniska tester som täcker 90 % av fallen:

### 1. Dragprov (ISO 527)

Mäter draghållfasthet, brottförlängning och E-modul. Ger baseline för materialet i din faktiska process — inte leverantörens. Avvikelser på ±15 % mellan datablad och provstavar uttagna ur din produktion är vanliga och berättar mycket om processtabilitet.

Görs på standardprovstavar (typ 1A) eller utklippta från den verkliga detaljen om geometrin tillåter.

### 2. Slagprov (Charpy eller Izod, ISO 179 / ISO 180)

Mäter sprödhet och slagtålighet. Kör både vid +23 °C och vid −30 °C — många plaster (särskilt oförstärkta PP och HDPE) blir spröda under glastemperatur och bryts på ett helt annat sätt.

Essentiellt om produkten kan tappas, utsättas för stötar eller transporteras i kylkedja.

### 3. Böjprov (ISO 178)

Mäter böjhållfasthet och böjmodul. Viktigt för detaljer som lock, paneler och fästen där huvudbelastningen är böjande snarare än dragande.

Tänk på att glasfiberförstärkta plaster uppför sig annorlunda i drag kontra böj — böjmodulen ligger ofta 10–20 % högre.

### 4. Creep (krypbeteende, ISO 899)

Plast kryper — den deformeras kontinuerligt under konstant last. En snap-fit som håller vid montage kan vara permanent deformerad efter 6 månader. En skruvförband kan tappa förspänning.

Creep-test körs vid konstant last och temperatur över tid (typiskt 1000 timmar). Resultaten extrapoleras till produktens livslängd.

Detta är testet som oftast hoppas över — och oftast står bakom fältfel i långtidsapplikationer.

### 5. Utmattning (ISO 13003)

Cykliska laster ger utmattningsbrott långt under statisk brotthållfasthet. Detaljer som öppnas/stängs, fjädrar eller utsätts för vibrationer behöver utmattningstestas.

Räkna ut antal cykler under produktens livslängd (10 år × 5 öppningar/dag = ~18 000 cykler) och testa minst 3× marginal.

## När i utvecklingsprocessen ska man testa?

Svaret är: oftare än de flesta tror. Vi rekommenderar följande testpunkter i [produktutvecklingsprocessen](https://jelmtech.se/produktutveckling/produktutveckling-tidplan-faser/):

**Fas 1 — Materialval och konceptverifiering**
- Dragprov + slagprov på kandidatmaterial i provstavar.
- Syftar till att välja material — inte godkänna slutprodukt.

**Fas 2 — [Prototypfas](https://jelmtech.se/produktutveckling/prototypframtagning-metoder/)**
- 3D-printade eller CNC-frästa prototyper — funktionell utvärdering, inte materialkvalificering.
- Undvik att basera materialbeslut på prototypers mekaniska prestanda (annorlunda process).

**Fas 3 — Verktygsprov / T0**
- Första detaljer från verktyget. Testa minst 5–10 st på de tester som är relevanta.
- Mät särskilt weld-line styrka (dragprov tvärs weld-line) — ofta 40–60 % av grundmaterialets.

**Fas 4 — Nollserie**
- Fullständig mekanisk testning med produktionsmaterial, produktionsverktyg, produktionsprocess.
- Detta är "sanningen" som ska godkännas mot kravspec.

**Fas 5 — Seriekontroll**
- Urvalsprov löpande, typiskt dragprov var 10 000:e detalj eller månadsvis.
- Fångar processdrift innan den blir reklamation.

## Vanliga misstag vid mekanisk testning

Efter att ha hjälpt kunder kvalificera tusentals detaljer ser vi samma fel om och om igen:

**Missa 1: Bara testa vid rumstemperatur.** Din produkt används sällan vid 23 °C konstant. Testa vid drifttemperaturens ytterpunkter.

**Missa 2: Bara testa torrkonditionerat material.** Polyamider (PA6, PA66) förlorar upp till 40 % E-modul och fördubblar brottförlängning vid jämvikt med luftfuktighet. Testa både torr och konditionerad.

**Missa 3: Glömma weld-lines.** Alla flervägsfyllda detaljer har weld-lines. Testa specifikt styrkan tvärs dessa — det är oftast där detaljen brister.

**Missa 4: För få provkroppar.** Fem är minimum, tio är bättre, trettio är statistiskt signifikant. En enda provstav är anekdot, inte data.

**Missa 5: Ignorera creep.** Om din detalj sitter under last i mer än några timmar — testa creep. Plast beter sig inte som metall.

## Hur vi jobbar med mekanisk testning på Jelmtech

Vi har eget labb för draghållfasthet, böjprov och slagprov. För creep, utmattning och specialtester använder vi certifierade externa labb (RISE, SP Swedish National, akkrediterade tyska partners).

En typisk testinsats för en kundprodukt ser ut så här:

1. **Testplan** — vi skriver en testplan kopplad till kravspecifikationen som definierar exakt vilka tester, antal provkroppar, villkor och godkännandekriterier.
2. **Provkroppar** — tas ut antingen som standardprovstavar eller utklippta från verkliga detaljer från T0 eller nollserie.
3. **Genomförande** — testerna körs med full dokumentation av villkor, instrument och operatör.
4. **Rapport** — vi levererar en testrapport som kan användas som bevisdokument mot kund eller myndighet.
5. **Åtgärder** — om tester inte klarar kravspec analyserar vi orsak (material, process, geometri) och föreslår åtgärd.

## Kostnadsbild

Som grov uppskattning för att planera budget:

| Test | Kostnad per insats (5–10 provkroppar) |
|---|---|
| Dragprov | 3 000 – 6 000 kr |
| Slagprov (Charpy/Izod) | 4 000 – 8 000 kr |
| Böjprov | 3 000 – 5 000 kr |
| Creep (1000 h) | 25 000 – 60 000 kr |
| Utmattning | 40 000 – 150 000 kr |

Det kan låta som mycket, men ställ det mot kostnaden för ett fältfel: tillbakadragen produkt, reklamationer, försäkringsärenden, varumärkesskada. En komplett testpaketering för 100 000 kr är försumbar mot 5 miljoner kr i återkallelse.

## Sammanfattning

Mekanisk testning av plastkomponenter är inte en lyx som görs om budget finns — det är ett obligatoriskt moment i all seriös produktutveckling. Skriv testplanen när kravspecen skrivs. Testa tidigt på material, igen på verktygsprov, och slutgiltigt på nollserien. Spara rapporterna — de är ditt bevismaterial vid reklamationer.

Behöver du hjälp att sätta en testplan för din produkt? [Hör av dig](https://jelmtech.se/kontakt/) — vi lägger upp ett paket som täcker kraven utan att bli dyrare än nödvändigt.
