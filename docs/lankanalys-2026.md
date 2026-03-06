# Länkanalys — Searchboost-kunder + prospekt
**Datum:** 2026-02-20
**Källa:** SE Ranking Backlink Checker (manuell körning)
**Metriker:** DT = Domain Trust (0–100), RD = Referring Domains, BL = Backlinks totalt

---

## Sammanfattningstabell

| Domän | Typ | DT | RD | BL | Notering |
|---|---|---|---|---|---|
| searchboost.se | Intern | 10 | 22 | 25 | Ung domän, byggs aktivt |
| kompetensutveckla.se | Kund | 50 | 2,210 | 8,041 | Starkast i portföljen |
| feroxkonsult.se | Kund | 36 | 143 | 357 | Solid bas för konsultbolag |
| ilmonte.se | Kund | 33 | 169 | 1,173 | Bra RD, god spridning |
| phvast.se | Kund | 30 | 44 | 58 | Okej, kan förbättras |
| smalandskontorsmobler.se | Kund | 30 | 79 | 1,148 | Okej bas, aktiv tillväxt (+11 RD/mån) |
| tobler.se | Kund | 20 | 32 | 35 | Svag — se Våning 18-analys nedan |
| traficator.se | Kund | 18 | 60 | 141 | Under genomsnittet |
| mobelrondellen.se | Kund | 15 | 59 | 865 | Lågt DT trots många BL — kvalitetsproblem |
| vame.se | Prospekt | 12 | 51 | 156 | Ung, tillväxtpotential |
| wedosigns.se | Kund | 4 | 41 | 63 | Kritiskt svag — prioritet |
| **vaning18.se** | **Konkurrent** | **72** | **387** | **725,800** | **Se hotanalys nedan** |

---

## Analys per kund

### kompetensutveckla.se — DT:50, RD:2,210, BL:8,041
Den absolut starkaste domänen i portföljen. Etablerad utbildningsplattform med bred länkprofil. Nytt under senaste 30 dagarna: +86 RD, tappat 21. Aktiv tillväxt. Högt DT ger god auktoritet att bygga vidare på vid ny sitestruktur.
- **Åtgärd:** Bevara befintliga hänvisande domäner vid omdommning/redirect. Kritiskt att redirect-kartan är komplett.

### feroxkonsult.se — DT:36, RD:143, BL:357
Hyfsat stark profil för ett B2B-konsultbolag. Aktiv: +11 RD, -8 RD senaste månaden.
- **Åtgärd:** Identifiera vilka 8 RD som tappats och försök återvinna via uppdatering/kontakt.

### ilmonte.se — DT:33, RD:169, BL:1,173
God spridning med 169 unika domäner. Relativt hög BL/RD-ratio tyder på att några domäner länkar många gånger.
- **Åtgärd:** Kolla "Hänvisande domäner"-fliken för att se om det finns länk-farmar i profilen.

### phvast.se — DT:30, RD:44, BL:58
Liten men ren profil. Få backlinks totalt.
- **Åtgärd:** Aktiv länkbyggnad rekommenderas. Branschkataloger och samarbetspartners.

### smalandskontorsmobler.se — DT:30, RD:79, BL:1,148
Okej bas. Intressant att BL (1,148) är relativt högt i förhållande till RD (79) — troligen e-handel med produktsidor som länkas ofta. Aktiv: +11 RD, -8 RD senaste månaden.
- **Åtgärd:** Vid WooCommerce-migrering — säkerställ att produktsidors inkommande länkar redirectas korrekt.

### tobler.se — DT:20, RD:32, BL:35
Svag profil. Bara 32 unika hänvisande domäner.
- **Åtgärd:** Se Våning 18-analys nedan. Prioritera återvinning av tappade domäner.

### traficator.se — DT:18, RD:60, BL:141
Under genomsnittet. Nytt: +7 RD, tappat 2 senaste månaden — svag positiv trend.
- **Åtgärd:** Branschdirektiv och partnerskap för att accelerera länkbyggnad.

### mobelrondellen.se — DT:15, RD:59, BL:865
Intressant diskrepans: 865 backlinks från bara 59 domäner = ~14 BL/RD. Indikerar att en handfull domäner genererar bulk av länkarna — potentiellt länkspam eller gamla kataloglänkar.
- **Åtgärd:** Kör Toxicitetsanalys i SE Ranking. Identifiera och disavow eventuella skadliga masslänkar.

### vame.se — DT:12, RD:51, BL:156
Ung magasin-domän med rimlig start. Aktiv: +7 RD senaste månaden. Organisk tillväxt pågår.
- **Potential:** Som magasin är länkpotentialen hög om rätt content-strategi används. Redaktionella länkar från andra medier är lättare att attrahera än för e-handel.
- **Åtgärd för Searchboost:** Erbjud länkbuilding-paket via content-strategi och pressutskick.

### wedosigns.se — DT:4, RD:41, BL:63
Kritiskt svag profil. DT:4 innebär nästintill ingen auktoritet. Google ger minimal kredit.
- **Åtgärd (PRIO 1):** Omedelbar länkbuilding. Börja med branschkataloger (Eniro, Hitta, Reco), sedan partnersamarbeten och ev. en pressrelease.

---

## Hotanalys — Våning 18 vs Tobler

### Bakgrund
Mikael identifierade att Våning 18 sannolikt har plockat Toblers bakåtlänkar.

### Data
| Domän | DT | RD | BL |
|---|---|---|---|
| tobler.se | 20 | 32 | 35 |
| vaning18.se | 72 | 387 | 725,800 |

### Analys
Skillnaden är extrem. Våning 18 har **12× fler hänvisande domäner** och ett DT som är 3,6× högre. Med 725K backlinks är det uppenbart att Våning 18 aktivt investerar i länkbyggnad i stor skala — troligen en kombination av:

1. **Länkköp / länkfarmar** — 725K BL från 387 RD = ~1,875 BL/RD. Extremt högt ratio, starkt indicium på masslänkar.
2. **Konkurrensövervakning** — De kan ha identifierat Toblers hänvisande domäner och aktivt kontaktat samma sajter för att ersätta eller komplettera länkarna.
3. **Branschkataloger** — Har troligen registrerat sig i alla möjliga kataloger som Tobler ännu inte finns i.

### Toblers 30-dagarsdata (SE Ranking)
- Nya RD senaste månaden: **ej synligt i overview** (för lågt antal)
- Tappade RD: **ej synligt**

### Rekommenderade åtgärder för Tobler
1. **Exportera Toblers 32 RD** från "Hänvisande domäner"-fliken
2. **Kolla vilka av dessa 32 domäner Våning 18 också har** — dessa är de stulna/överskrivna länkarna
3. **Kontakta sajterna** som valt Våning 18 och erbjud alternativt samarbete
4. **Bygg nytt**: Hitta domäner som länkar till Våning 18 men INTE Tobler — kontakta dessa med ett erbjudande
5. **Toxicitetsvarning**: Vaning18.se-profilen är sannolikt kraftigt manipulerad. Deras DT:72 kan vara artificiellt uppblåst. Googles algoritmer flaggar ibland denna typ av profil negativt.

---

## Rankingpotential per kund (sammantagen bedömning)

| Kund | Länkstyrka | SEO-potential | Prioritet |
|---|---|---|---|
| kompetensutveckla.se | Hög | Hög (vid korrekt omdommning) | 1 |
| feroxkonsult.se | Medel-Hög | Medel | 3 |
| ilmonte.se | Medel-Hög | Medel-Hög | 3 |
| smalandskontorsmobler.se | Medel | Hög (WooCommerce-migration) | 2 |
| phvast.se | Medel-Låg | Medel | 4 |
| traficator.se | Låg-Medel | Medel | 4 |
| mobelrondellen.se | Låg (spam-risk) | Medel (efter cleanup) | 2 |
| tobler.se | Låg | Medel (med aktiv länkbuilding) | 2 |
| vame.se | Låg (ung) | Hög (magasin-format) | 3 |
| wedosigns.se | Kritiskt låg | Låg utan åtgärd | 1 |

---

## Nästa steg

1. **wedosigns.se** — Starta länkbuilding omedelbart. DT:4 är ett kritiskt hinder.
2. **mobelrondellen.se** — Kör toxicitetsanalys, disavow skadliga masslänkar.
3. **tobler.se** — Exportera RD-lista, korsanalys mot vaning18.se.
4. **kompetensutveckla.se** — Säkerställ redirect-karta innan DNS-byte.
5. **vame.se** — Content-strategi för redaktionella länkar (pressutskick, gästinlägg).
