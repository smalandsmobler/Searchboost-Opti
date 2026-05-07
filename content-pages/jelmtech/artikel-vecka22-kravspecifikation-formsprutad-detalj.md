# Kravspecifikation för formsprutad detalj — så skriver du den

**Focus keyword:** kravspecifikation formsprutad detalj
**Meta description:** Så skriver du en kravspecifikation för formsprutad detalj som ger färre iterationer och lägre verktygskostnad. Checklista med 9 avsnitt och exempel.
**Kategori:** Produktutveckling (ID 48)
**Slug:** kravspecifikation-formsprutad-detalj-checklista

---

## Varför en tydlig kravspecifikation sparar pengar

De flesta verktygsöverraskningar — försenade leveranser, kostsamma ändringar, reklamationer — går att spåra tillbaka till en sak: otillräcklig kravspecifikation i början av projektet. När kravlistan är vag får verktygsleverantören gissa, konstruktören gissar, testingenjören gissar — och alla gissar olika.

En ordentlig kravspec tar 4–8 timmar att skriva och sparar ofta 50 000–300 000 kr i uteblivna omtag. Den fungerar också som bevis vid reklamation, underlag för offert och referens för CE-dokumentation.

Här är checklistan vi använder på Jelmtech när vi hjälper kunder skriva kravspecifikationer för formsprutade detaljer — indelad i nio avsnitt som täcker allt från funktion till dokumentation.

## 1. Funktion och användning

Det här avsnittet beskriver **vad detaljen ska göra**, inte hur den ska se ut. Skriv i klartext:

- Vad är detaljens funktion i den större produkten?
- Vilka krafter och belastningar utsätts den för i drift?
- Hur många gånger ska den tåla användning (cykler, öppningar, tryck)?
- Vilka komponenter sitter den mot — hur ser gränssnitten ut?

**Exempel:** "Lockdetalj som ska öppnas/stängas 5 000 gånger under produktens 10-åriga livslängd. Ska hålla tätning mot IP54 även efter 2 000 cykler. Sitter ovanpå elektronikhölje av PC/ABS."

## 2. Miljökrav

Var och hur används produkten? Det styr materialval mer än något annat:

- **Temperaturspann:** både drift- och lagringstemperatur, inklusive kortvariga toppar.
- **Fuktighet:** inom- eller utomhusbruk, kondens, IP-klass.
- **Kemisk exponering:** rengöringsmedel, oljor, solkräm, bränsle.
- **UV-exponering:** måste plasten klara direkt solljus i 5, 10 eller 20 år?
- **Mekanisk miljö:** vibrationer, stötar, dammiga miljöer.

**Fälla att undvika:** Skriv "normalt kontorsbruk" och räkna med att solsken genom fönster ändå kräver UV-stabilisator. Var specifik.

## 3. Material

Antingen specificerar du material eller så överlåter du det till konstruktören/verktygsleverantören — men då måste kraven i avsnitt 1 och 2 vara tillräckliga för att de ska kunna [välja rätt material](https://jelmtech.se/produktutveckling/materialval-produktutveckling/).

Vanliga fält:

- Föreslaget material + alternativa (t.ex. "PA6-GF30 primärt, PBT-GF30 godkänt alternativ").
- Färgkrav: pantone, RAL, NCS eller masterbatch-referens.
- Återvunnet innehåll: krav på minst X% PCR?
- Ytfinish: matt, blank, strukturerad (referens MT-11010, VDI 3400, Mold-Tech).
- Livsmedelsgodkännande (FDA, EU 10/2011), biokompatibilitet (ISO 10993).

## 4. Mått och toleranser

Rita detaljen med måttsatta toleranser på funktionsytor. Använd [standardtoleranser för plastdetaljer](https://jelmtech.se/produktutveckling/toleranser-plastdetaljer-guide/) (DIN 16742 eller ISO 20457) där det går — skärp bara där funktionen kräver det.

Minimikrav:

- Kritiska mått med toleranser (GD&T om möjligt).
- Referenspunkter / datum features.
- Passningsytor mot intilliggande komponenter.
- Ytjämnhet (Ra) där det har betydelse.

Skarpare toleranser än +/- 0,05 mm på plastdetaljer kostar — både i verktyg och i kassation. Släpp allt du kan.

## 5. Kvalitetskrav

Här definieras vad som är en godkänd detalj. Utan detta blir subjektiva diskussioner med verktygsleverantören oundvikliga.

- **Visuella krav:** A-yta (synlig, strikt), B-yta (delvis synlig), C-yta (dold, toleranta).
- **Tillåtna avvikelser:** intryck, flammor, flow-lines, weld-lines — var och hur stora?
- **Färgavvikelse:** ΔE max 1,5 jämfört med masterbatch-referens?
- **Glansgrad:** ±5 enheter vid 60° vinkel?
- **AQL-nivå:** vanligen AQL 1,0 för synliga ytor, AQL 2,5 för B-ytor, AQL 4,0 för C-ytor.

## 6. Mekaniska och fysiska prestanda

Det här är avsnittet där produktens livslängd avgörs. Lista:

- Bärförmåga (statisk belastning).
- Slagtålighet (Izod eller Charpy, vid rumstemp och vid låg temp).
- Utmattningshållfasthet vid cykliska laster.
- Krypbeteende (creep) under konstant last.
- [Mekanisk testning](https://jelmtech.se/produktutveckling/mekanisk-testning-plastkomponenter/) som verifierar alla ovanstående.

Om produkten är säkerhetskritisk — bromslock, medicinteknik, elektrisk isolation — bör minst 20 detaljer ur nollserien testas destruktivt.

## 7. Tillverkningskrav

Ge verktygsleverantören förutsättningar att räkna offert:

- **Förväntad årsvolym** — det avgör verktygsstål, antal uttag och maskinstorlek.
- **Serielängd per order** — påverkar lagerstrategi.
- **Förpackning** — bulk, tray, individuell? Antiförpackning mot ESD?
- **Leveransform** — ingöt borttagen, gradad, ultraljudsrengjord?
- **Verktygsägande** — kund eller leverantör?
- **Livscykel** — hur många år ska verktyget hålla?

## 8. Regulatoriska krav

Beroende på marknad och användning:

- CE-märkning (EU).
- REACH / RoHS-konformitet.
- Livsmedelskontakt (FDA, EU 10/2011).
- Medicinteknik (MDR, ISO 13485).
- Fordon (IMDS, PPAP).
- Elektriska produkter (UL 94 flamskyddsklass).

Skriv explicit vilka direktiv och standarder som gäller — inte bara "CE-märkt". [CE-märkning](https://jelmtech.se/produktutveckling/ce-markning-plastprodukter/) består av flera olika direktiv beroende på produkt.

## 9. Dokumentation och godkännande

Avsluta kravspecen med vad som ska levereras utöver själva detaljerna:

- Materialcertifikat (2.1 eller 3.1).
- Mätprotokoll av nollserie (CMM-rapport).
- FAI (First Article Inspection) enligt AS9102 eller likvärdigt.
- ISIR / PPAP vid fordon / aerospace.
- Processvalideringsrapport (IQ/OQ/PQ) vid medicinteknik.
- Declarations of Conformity (DoC).

Glöm inte signaturrutan: vem godkänner kravspec, vem godkänner nollserie, vem godkänner massproduktion.

## En bra kravspec är kort men fullständig

En välskriven kravspecifikation för en formsprutad detalj är sällan över 10 sidor. Vi ser oftare problem med 3-sidiga kravspecar som saknar hälften av det som behövs, än med 30-sidiga som drunknar i irrelevanta detaljer.

Ta fram en mall. Fyll i alla nio avsnitt. Stryk det som inte gäller. Skicka till verktygsleverantören — och be dem kommentera innan du beställer.

## Mall och genomgång

Vi hjälper regelbundet kunder att sätta ihop kravspecifikationer för formsprutade detaljer — både som del av [produktutvecklingsuppdrag](https://jelmtech.se/produktutveckling/) och som fristående konsultinsats innan upphandling. Vill du ha vår kravspec-mall och en halvtimmes genomgång med en av våra konstruktörer? [Hör av dig](https://jelmtech.se/kontakt/) så skickar vi den.

En timmas investering kan spara 50 000 kr i verktygsjusteringar. Det är den enklaste ROI-kalkylen i hela produktutvecklingen.
