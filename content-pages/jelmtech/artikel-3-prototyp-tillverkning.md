---
title: "Prototyptillverkning — metoder, kostnader och vanliga misstag"
focus_keyword: "prototyptillverkning"
meta_description: "Guide till prototyptillverkning: 3D-print, CNC och vakuumgjutning. När du väljer vad, kostnader och misstag att undvika i produktutveckling."
suggested_slug: "prototyptillverkning-metoder"
---

# Prototyptillverkning — så väljer du rätt metod för rätt fas

En prototyp är inte en prototyp. Det finns visuella modeller som bara ska övertyga en styrelse, funktionsprototyper som ska testas i fält, och verifieringsprototyper som är nästintill seriemässiga. Att välja fel metod för rätt fas är ett av de vanligaste sätten att bränna pengar i produktutveckling. Den här guiden går igenom de viktigaste prototyptillverkningsmetoderna, när var och en passar, vad de kostar, och vilka misstag vi ofta ser hos företag som driver egen produktutveckling.

## Varför prototypmetoden måste matcha syftet

Innan en prototyp beställs bör en fråga besvaras: vad ska den bevisa? En visuell modell som ska visas på en mässa behöver inte vara mekaniskt korrekt. En funktionsprototyp som ska testas av pilotkunder måste tåla verklig last men behöver inte vara tillverkad i seriematerialet. En verifieringsprototyp som ska användas för CE-märkning eller certifiering måste däremot matcha serieprodukten så nära som möjligt — både i material och i tillverkningsprocess.

Syftet styr tre parametrar: material, tolerans och ytfinish. En snabb FDM-utskrift kostar 500 kr och kommer på bordet nästa morgon. En SLS-detalj i PA12 kostar 3000 kr och tar fyra dagar. En CNC-fräst ABS-detalj med samma geometri kan kosta 12 000 kr och ta en vecka. Alla tre kan vara "rätt" — beroende på vad som ska bevisas.

## De viktigaste metoderna och vad de är bra på

### FDM (Fused Deposition Modeling)

Den enklaste och billigaste 3D-printmetoden. Bygger upp detaljen lager för lager med extruderad plasttråd, vanligen PLA, PETG, ABS, ASA eller PC. Typisk upplösning 0,1–0,3 mm, synliga byggnadslager på ytan, måttlig mekanisk prestanda.

**Passar för**: tidiga konceptmodeller, passningskontroller, jiggar och fixturer, interna diskussionsunderlag. Kostnad 200–2000 kr per detalj, ledtid en till tre dagar. Inte lämpligt för visuella presentationer eller funktionsprover som ska tåla verklig last över tid.

### SLA och DLP (stereolitografi)

Härdar flytande fotopolymer med laser eller projektor. Ger mycket hög ytkvalitet, detaljrik geometri och fina skarpa kanter. Materialet är dock sprött och åldras av UV.

**Passar för**: visuella presentationsmodeller, formstudier, tandvårds- och smyckesapplikationer, gjutförlorade mönster. Kostnad 800–5000 kr per detalj. Inte lämpligt för funktionsprover som ska belastas mekaniskt eller utsättas för sol.

### SLS (Selektiv lasersintring) och MJF (Multi Jet Fusion)

Sintrar pulverbaserat polyamid (oftast PA12, ibland glasfyllt eller kolfiberförstärkt) med laser eller binder. Ger funktionsdugliga detaljer med isotropa egenskaper, inga stödstrukturer och bra detaljrikedom. MJF är något snabbare och ger lite bättre ytfinish än SLS.

**Passar för**: funktionsprototyper, small batch production, integrerade mekanismer med rörliga delar, detaljer som ska snäppas ihop. Kostnad 1000–8000 kr per detalj, ledtid tre till sju dagar. Det är ofta det bästa allround-valet för tekniska B2B-prototyper.

### CNC-fräsning i plast

Subtraktiv tillverkning där en fast bit plast — POM, PC, ABS, PA6, PEEK — fräses ner till färdig geometri. Ger material som är identiska med vad som skulle användas i en formsprutad detalj (med undantag för att det är extruderat/gjutet i stället för sprutat), hög måttriktighet och utmärkt ytfinish.

**Passar för**: verifieringsprototyper, detaljer som ska testas i riktigt drift, delar där materialegenskaperna är kritiska. Kostnad 3000–25 000 kr per detalj beroende på geometri. Ledtid en till tre veckor. Begränsningen är geometri: undersnitt och innerhålrum kan vara svåra eller omöjliga, och komplexa organiska former blir snabbt dyra.

### Vakuumgjutning (silikonform)

Ett original — oftast en SLA- eller CNC-fräst masterdetalj — används för att gjuta en silikonform, som sedan fylls med PU-harts som efterliknar ABS, PC, PP, gummi eller andra plaster. En silikonform klarar 20–30 gjutningar innan den slits ut.

**Passar för**: små serier (10–50 st), förserier för pilotprojekt, detaljer som behöver visuellt och funktionellt motsvara serieprodukten innan ett formsprutningsverktyg beställs. Kostnad cirka 4000–10 000 kr för formen plus 400–1500 kr per detalj. Ledtid två till tre veckor.

### Formsprutning i aluminiumverktyg ("mjukverktyg")

När du behöver 500–10 000 detaljer i rätt material, eller ska verifiera formsprutningsprocessen innan det stora verktyget byggs, är mjukverktyg lösningen. Ett aluminium- eller förhärdat stålverktyg kostar 40 000–120 000 kr och ger formsprutade detaljer i rätt material till styckepris på 10–50 kr.

**Passar för**: förseriebatcher, certifiering, fälttest med pilotkunder, lågvolymprodukter där ett fullt produktionsverktyg aldrig blir lönsamt.

## När man väljer vad — en praktisk beslutsmodell

I ett typiskt produktutvecklingsprojekt ser prototypkedjan ut ungefär så här:

1. **Konceptfas**: Snabba FDM-utskrifter för att diskutera formen internt. Kostnad under 5000 kr totalt.
2. **Designverifiering**: SLA eller MJF för presentationsmodell till kunden. Kostnad 10 000–30 000 kr.
3. **Funktionsprototyp**: SLS eller CNC-frästa detaljer för mekanisk och elektrisk integration. Kostnad 20 000–80 000 kr per iteration.
4. **Förserieverifiering**: Vakuumgjutning eller mjukverktyg för 20–200 enheter till pilotkunder eller certifiering. Kostnad 50 000–200 000 kr.
5. **Serieproduktion**: Fullt produktionsverktyg för formsprutning i rätt material.

Alla projekt går inte igenom alla steg. En enklare mekanisk detalj kan hoppa direkt från SLS till mjukverktyg. En komplex produkt med elektronik, certifiering och användartester behöver ofta alla fem. Regeln är att inte överinvestera tidigt — men heller inte underinvestera när certifiering och fälttest står för dörren.

## Vanliga misstag vi ser

**Fel material i fel fas.** Att 3D-printa en klämma i PLA och förvänta sig att den ska hålla i flera månaders drift. PLA blir mjukt redan vid 50–60 °C och kryper under last. Välj PA12 i SLS eller ABS/PC i CNC när funktion ska valideras.

**Att hoppa över förserien.** Företag som går direkt från SLS-prototyp till ett produktionsverktyg på 600 000 kr upptäcker ofta fel som hade fångats i en mjukverktygsserie på 20 enheter. Kostnaden för att åtgärda verktyget efter första skott är nästan alltid högre än kostnaden för förserien.

**Underskattning av ledtid.** Prototypleverantörer har jämna flöden och ovanliga geometrier, specialmaterial eller certifieringskrav kan lätt dubbla den förväntade ledtiden. Planera med marginal, särskilt om kedjan innehåller efterbearbetning som lackering, tampotryck eller metallbeläggning.

**Glömd efterbehandling.** En 3D-printad detalj måste ofta slipas, grundlackas och lackeras för att fungera som presentationsmodell. Det dubblar ofta både kostnad och ledtid. Lägg in det i projektplanen från början.

**Otillräcklig teknisk dokumentation till leverantören.** En STEP-fil utan tolerans-, yt- eller materialkrav leder till återfrågor, gissningar och omprint. En ordentlig tillverkningsritning med tydliga krav sparar tid och pengar redan vid första beställningen.

**Att underskatta värdet av att jobba med en partner som behärskar flera metoder.** Leverantörer som enbart gör en enda teknik tenderar att rekommendera just den tekniken, även när en annan skulle passa bättre. En metodoberoende prototyppartner kan matcha metod mot syfte på ett helt annat sätt.

## Sammanfattning

Prototyptillverkning handlar om att välja minsta möjliga insats som ger tillräckligt svar på nästa frågeställning i projektet. Det betyder att ha flera metoder i verktygslådan, att förstå var och ens styrkor och svagheter, och att inte förväxla en visuell modell med en funktionsprototyp. Gör man detta rätt håller man hastigheten uppe, pengarna i kassan och risken nere — och står redo för serieproduktion när det är dags.

## Interna länkar (förslag)

- Våra tjänster inom [prototyptillverkning](https://jelmtech.se/tjanster/prototyper/)
- [3D-print och additiv tillverkning](https://jelmtech.se/tjanster/3d-print/)
- [Plastkonstruktion och formsprutning](https://jelmtech.se/tjanster/plastkonstruktion/)
- [Produktutveckling från idé till produktion](https://jelmtech.se/tjanster/produktutveckling/)
- [Kontakta oss för offert på prototypprojekt](https://jelmtech.se/kontakt/)

## Bildförslag (alt-texter)

- "SLS-tillverkade prototypdetaljer i PA12 nyss uttagna ur pulverbädden"
- "CNC-fräst prototyp i POM med skarpa kanter och precisa mått i fixturen"
- "Silikonform för vakuumgjutning med färdiggjuten PU-prototyp i förgrunden"
