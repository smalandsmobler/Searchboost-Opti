---
title: "Plastkonstruktion från idé till färdig komponent — komplett guide"
focus_keyword: "plastkonstruktion"
meta_description: "Guide till plastkonstruktion: materialval, formsprutning vs 3D-print, konstruktionsregler och kostnader. För produktchefer och ingenjörer."
suggested_slug: "plastkonstruktion-guide"
---

# Plastkonstruktion från idé till färdig komponent

Att lyckas med en plastkonstruktion handlar sällan om en enskild smart detalj — det handlar om att fatta rätt beslut tidigt. Materialval, tillverkningsmetod och konstruktionsregler hänger ihop, och ett misstag i början kan kosta hundratusentals kronor längre fram. I den här guiden går vi igenom hela kedjan från första skiss till serieproducerad komponent, så att du som produktchef eller teknisk inköpare vet vilka frågor som behöver ställas — och när.

## Från kravspec till koncept

Första steget är sällan att rita. Det är att definiera vad komponenten faktiskt ska tåla. En bra kravspecifikation för en plastdetalj innehåller mekanisk last (drag, tryck, slag), driftstemperatur, UV-exponering, kontakt med kemikalier, brandklass (UL 94), eventuella EMC-krav samt krav på reglerad marknad som RoHS, REACH eller livsmedelsgodkännande. Saknas något av dessa blir materialvalet en gissning.

Parallellt bör volymen diskuteras. En komponent som ska tillverkas i 500 exemplar per år har helt andra ekonomiska förutsättningar än en som ska i 200 000. Volymen avgör om formsprutning över huvud taget är aktuellt, eller om vakuumgjutning och 3D-print är mer rationellt.

Slutligen: monteringskontext. En detalj som snäpps fast ställer andra krav än en som skruvas. Vet du hur den ska monteras, demonteras och servas redan i konceptfasen undviker du kostsamma omkonstruktioner.

## Materialval — vad du faktiskt bör välja mellan

Plast är inte ett material, det är en familj med hundratals varianter. För industriella produkter är det några få tekniska plaster som dominerar:

- **ABS**: Seg, slagtålig, lätt att bearbeta. Standardval för höljen, inredning och konsumentprodukter. Tål cirka 80 °C kontinuerligt. Inte UV-stabil utan tillsatser.
- **PC (polykarbonat)**: Mycket hög slagtålighet och transparens. Används i skyddsglas, lysdiodslinser och hus där visuell inspektion krävs. Tål 120 °C men är känslig för vissa lösningsmedel.
- **PC/ABS-blend**: Kombinerar ABS bearbetbarhet med PC styrka. Vanlig i industriella höljen och elbilskomponenter.
- **POM (acetal)**: Styv, låg friktion, dimensionsstabil. Förstahandsvalet för kugghjul, glidlager och precisionsmekanik. Tål 100 °C och är kemiskt tålig.
- **PA6 och PA66 (nylon)**: Hög mekanisk styrka, särskilt glasfiberförstärkt (PA6-GF30). Används i lastbärande strukturer, fästen och under motorhuv. Absorberar fukt, vilket måste kompenseras i konstruktionen.
- **PP (polypropen)**: Billigt, kemiskt tåligt, flexibelt. Används i förpackningar, filmgångjärn och vätskeförande komponenter.
- **PEEK**: Högprestandaplast som tål över 250 °C och aggressiv kemi. Pris cirka 800–1500 kr/kg jämfört med 25–40 kr/kg för ABS, så används bara när det verkligen krävs.

Ett strukturerat materialval börjar med krav, matar in dessa i en databas (exempelvis CES EduPack eller Campus Plastics) och landar i två till tre kandidater. Därefter tar erfarenhet vid — hur beter sig materialet i verklig produktion, och vad säger leverantören om leveranstider och prisbild?

## Formsprutning eller 3D-print — ekonomin avgör

Valet av tillverkningsmetod kokas ofta ner till volym och ledtid. Formsprutning ger lägst styckepris vid serier men kräver ett verktyg som kostar 40 000 kr för en enkel prototypform i aluminium och lätt 300 000–800 000 kr för ett produktionsverktyg i härdat stål. Break-even mot 3D-print ligger ofta runt 500–2000 enheter beroende på detaljens storlek och komplexitet.

3D-print i SLS (selektiv lasersintring) med PA12 ger funktionsdugliga detaljer med styckepris på 150–800 kr beroende på volym, utan verktygskostnad. MJF (Multi Jet Fusion) är snabbare och ger något bättre ytfinish. FDM passar för enklare test och jiggar. SLA och DLP ger högsta upplösning för visuella prototyper men är sällan lämpade för funktionsdelar.

Ett konkret räkneexempel: en hölje-halva på 150 gram i ABS. Formsprutning ger styckepris runt 8–15 kr plus verktygskostnad. SLS i PA12 ger styckepris runt 350 kr utan verktyg. Vid 300 enheter är 3D-print billigare. Vid 5000 enheter är formsprutning klart billigare — och vid 50 000 enheter är det inte ens en diskussion.

För volymer mellan prototyp och full serie finns mellanlösningar: vakuumgjutning med silikonform ger 20–30 kopior till en bråkdel av verktygskostnaden, och mjuka aluminiumverktyg klarar 1000–10 000 skott.

## Konstruktionsregler som skiljer ett fungerande verktyg från ett dyrt misstag

Plast beter sig inte som metall. Goda konstruktionsregler för formsprutning är inte kosmetik — de avgör om detaljen över huvud taget går att tillverka:

- **Jämn godstjocklek**: Sträva efter 1,5–3 mm och variera inte mer än 25 procent över detaljen. Ojämn godstjocklek ger sjunkmärken, inre spänningar och skev geometri.
- **Släppvinklar**: Minst 0,5° på släta ytor, 1–2° på texturerade. Utan släppvinkel fastnar detaljen i verktyget.
- **Radier**: Inga skarpa innerhörn. En radie på minst 0,5 gånger godstjockleken eliminerar spänningskoncentrationer som annars ger sprickor i drift.
- **Ribbor**: Används för styvhet istället för att öka godstjockleken. Tjocklek max 60 procent av väggens tjocklek, annars uppstår sjunkmärken på motsatt sida.
- **Bossar** (för skruvar eller stift): Samma regel — håll dem slanka, med stödribbor om de behöver vara höga.
- **Inflödespunkter och svetslinjer**: Diskutera med verktygsmakaren tidigt. Fel placerad inflödespunkt ger synliga linjer på visuella ytor eller svaga svetslinjer där materialströmmar möts.

Ett vanligt misstag är att ta en metallkonstruktion och bara "plasta över" den. Resultatet blir ofta onödigt tungt, dyrt och svårtillverkat. En riktig plastkonstruktion utnyttjar materialets egenskaper: integrerade snäppfästen istället för skruvar, filmgångjärn istället för separata leder, och formoptimering för att få styvhet med minsta möjliga mängd material.

## Simulering och verifiering innan verktyget beställs

Innan du låser in en formsprutningsdetalj bör flödes- och kylsimulering köras (Moldflow, Moldex3D eller Autodesk Moldflow Adviser). Simuleringen visar var inflödet ska placeras, hur detaljen kyls, var svetslinjer hamnar och hur mycket den kommer att skeva. Ett verktyg som är optimerat i simulering sparar ofta 50 000–150 000 kr i verktygsjusteringar efter första provskott.

Komplettera med strukturberäkning (FEM) för lastbärande detaljer. För plastmaterial är det särskilt viktigt att använda icke-linjära modeller och ta hänsyn till krypbeteende vid långvarig last.

## Från T1 till serieproduktion

Efter att verktyget är byggt kommer T1 — första provskottet. Här kontrolleras måttriktighet, ytkvalitet, svetslinjer och funktion. Nästan alltid behövs justeringar: processparametrar, kylning, eventuellt verktygsändringar. Räkna med två till fyra iterationer innan serieproduktion kan starta.

När serien rullar är det löpande kvalitetskontroll som gäller: SPC på kritiska mått, visuell inspektion, och periodisk materialverifiering från leverantören. En välkonstruerad plastdetalj med rätt verktyg ska kunna köras i hundratusentals skott med minimal kassation.

## Sammanfattning

Plastkonstruktion är ett spel där besluten tidigt avgör utfallet. Rätt kravspec, rätt materialval, rätt tillverkningsmetod för volymen och disciplinerat följande av konstruktionsregler — det är skillnaden mellan en komponent som fungerar i tjugo år och en som havererar efter tre månader i fält. Ta in produktutvecklingspartnern tidigt, helst redan i konceptfasen, och investera i simulering innan verktyget beställs.

## Interna länkar (förslag)

- Våra tjänster inom [produktutveckling](https://jelmtech.se/tjanster/produktutveckling/)
- Läs mer om [prototyptillverkning](https://jelmtech.se/tjanster/prototyper/)
- [Industridesign och teknisk konstruktion](https://jelmtech.se/tjanster/industridesign/)
- [Case: plastkomponent för industriell applikation](https://jelmtech.se/case/)
- [Kontakta oss för en kostnadsfri teknisk genomgång](https://jelmtech.se/kontakt/)

## Bildförslag (alt-texter)

- "Teknisk ritning av plastkomponent med måttangivelser och släppvinklar i CAD-miljö"
- "Formsprutningsverktyg öppet med plastdetalj i kaviteten redo att stötas ut"
- "Materialprover av ABS, PC, POM och glasfiberförstärkt PA6 sida vid sida"
