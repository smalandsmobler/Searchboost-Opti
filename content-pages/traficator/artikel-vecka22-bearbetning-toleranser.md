---
title: Bearbetningstoleranser — vad är rimligt och hur påverkar det kostnaden?
focus_keyword: bearbetningstoleranser gjutgods
meta_description: Vilka toleranser kan du kräva på bearbetat gjutgods? Vi förklarar IT-klasser, vad som är tekniskt rimligt och hur toleranskraven påverkar priset.
category: Blogg
status: publish
---

# Bearbetningstoleranser — vad är rimligt och hur påverkar det kostnaden?

En av de vanligaste orsakerna till onödigt höga tillverkningskostnader är överspecificerade toleranser. Konstruktörer anges ofta toleranser "på säkra sidan" utan att räkna på vad det faktiskt kostar. Den här guiden ger dig ett praktiskt ramverk för att sätta toleranser som är tekniskt motiverade — inte godtyckliga.

## Vad är en tolerans?

En tolerans anger hur mycket en dimension får avvika från det nominella måttet. Ett hål specificerat som Ø25 H7 innebär:

- Nominellt mått: 25 mm
- H7 = ISO-toleransläge H (grundavvikelse 0, går uppåt) med kvalitet 7
- Tillåten avvikelse: +0 till +0,021 mm (för Ø25)

Felaktigt: Ø25 ±0,01 mm utan anledning — det kräver finbearbetning och mätning på varje detalj.

## ISO-toleranssystemet — IT-klasser

ISO 286 delar in toleranser i kvalitetsgrader (IT = International Tolerance):

| IT-klass | Typisk process | Tillämpning |
|----------|---------------|-------------|
| IT5–IT6 | Slipning, honning | Lager, hydraulikkolvar, precisionsspindlar |
| IT7–IT8 | Fräsning, svarvning | Passningar, axlar, nav |
| IT9–IT10 | Grovsvarvning, borrning | Allmän maskintillverkning |
| IT11–IT12 | Gjutning, smide (bearbetat) | Lägre precisionskrav |
| IT13–IT16 | Gjutning direkt ur form | Strukturdelar utan passningskrav |

Gjutgods utan bearbetning hamnar vanligen i IT13–IT14. Med bearbetning når du IT7–IT9 beroende på process och material.

## Hur toleransen påverkar kostnaden

Tumregel: varje steg tightare i IT-klassen fördubblar ungefär bearbetningskostnaden för den ytan.

Exempel: En axeltapp som kräver IT6 istället för IT8 kan innebära:
- Extra slipoperation (1 timme maskin + setup)
- 100 % kontroll istället för stickprov
- Kalibrerat mätdon i toleransklassen

På en detalj med 10 kritiska ytor kan det innebära 40–60 % högre bearbetningskostnad — utan att produkten presterar märkbart bättre om IT8 hade räckt.

## Vad är rimligt att kräva?

### Gjutgods direkt ur form

| Dimension | Uppnåelig tolerans |
|-----------|-------------------|
| Aluminium pressgjutning | ±0,1–0,3 mm |
| Sandgjutning aluminium | ±0,5–1,5 mm |
| Precisionsgjutning (vax) | ±0,1–0,2 mm |
| Zinkpressgjutning | ±0,05–0,15 mm |

### Bearbetat gjutgods (fräsning/svarvning)

| Process | Uppnåelig tolerans |
|---------|-------------------|
| CNC-fräsning | ±0,02–0,05 mm |
| CNC-svarvning | ±0,01–0,03 mm |
| Slipning | ±0,003–0,010 mm |
| Honning | ±0,001–0,005 mm |

## Geometriska toleranser (GD&T)

Förutom dimensionstoleranser anger GD&T (Geometric Dimensioning and Tolerancing) krav på form, läge och rörelse:

- **Planhet** — hur plant en yta är (ISO 1101 symbol: ⏥)
- **Rundhet** — kretsavvikelse i tvärsnitt (⭕)
- **Cylindricitet** — kombination av rundhet och rakhet (⌭)
- **Parallellitet** — en ytas parallellitet mot referens (∥)
- **Vinkelrätt** — 90° mot referens (⊥)
- **Positionstolerans** — hål och features läge i 3D (⊕)

GD&T-toleranser är mer informativa än enkla plus/minus-toleranser och minskar risken för feltolkning.

## Vanliga misstag att undvika

**Symmetrisk tolerans på allt**: ±0,1 mm på varje mått signalerar att konstruktören inte analyserat vilka ytor som faktiskt är kritiska.

**Ange tolerans utan datum**: Utan angiven referensyta (datum) kan positionen mätas på olika sätt av olika leverantörer.

**Glömma ytjämnhet**: Tolerans och ytjämnhet (Ra) hänger ihop — IT6 och Ra 3,2 är inkonsekvent (slipning ger Ra 0,4–0,8).

**Tighta toleranser på gjutna ytor**: Om ytan inte bearbetas kan du inte kräva IT7. Ange bearbetningsmärke eller specificera att ytan bearbetas.

## Traficator och teknisk rådgivning

Traficator granskar kundernas ritningar och identifierar överspade toleranser som driver kostnad utan teknisk motivering. Vi samverkar med gjuterierna och bearbetningspartnerna för att hitta rätt specifikation från start.

Kontakta oss för en teknisk genomgång av ditt projekt.

---

*Traficator — material sourcing, gjutgods och teknisk rådgivning för tillverkande industri.*
