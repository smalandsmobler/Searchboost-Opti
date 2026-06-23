---
title: "Bearbetning av gjutgods — toleranser, metoder och vanliga misstag"
focus_keyword: "bearbetning gjutgods"
meta_description: "Bearbetning av gjutgods — CNC-fräsning, svarvning, fixturering och verktygsval. Guide för svenska inköpare och produktionstekniker."
suggested_slug: "bearbetning-gjutgods-toleranser-metoder"
category: "Teknik"
---

# Bearbetning av gjutgods — toleranser, metoder och vanliga misstag

Gjutgods lämnar sällan gjuteriet i ett skick där det går direkt in i slutkundens montering. Någonstans mellan gjutningen och den färdiga produkten ska gods bearbetas till slutliga toleranser, funktionella ytor ska planas, hål ska borras och gängas, och kvalitetskontroll ska säkerställa att allt hamnar inom ritningskraven. Bearbetning av gjutgods är ett eget kunskapsområde — skiljt från bearbetning av smidda eller stångsvarvade detaljer — med sina egna utmaningar, vanliga misstag och optimeringsmöjligheter.

Den här artikeln går igenom hur man bearbetar gjutgods i praktiken: vilka toleranser man realistiskt kan hålla, vilka CNC-metoder som fungerar bäst för olika material, hur man hanterar vanliga problem som porositeter och ojämn hårdhet, och när bearbetningen ska ingå i leverantörens åtagande kontra hanteras separat. Målgruppen är svenska inköpare, produktionschefer och beredare som jobbar med gjutna komponenter i dagliga leveranser.

## Varför bearbetning av gjutgods är annorlunda

Gjutgods skiljer sig från valsad eller smidd metall på flera sätt som direkt påverkar bearbetningsprocessen:

- **Ytskiktet är hårdare än kärnan.** Gjutjärn har typiskt ett "cast skin" på 0,5–2 mm med högre kolhalt, karbider och ibland sandinklusioner. Aluminiumgjutgods har ett tunnare men liknande skikt med högre järnhalt och oxidinneslutningar.
- **Hårdheten kan variera inom en enskild detalj.** En pressgjuten aluminiumdetalj kan ha hårdhet på 80 HB i en godstjocklek och 95 HB i en annan, beroende på stelningshastigheten.
- **Porositet är osynlig tills skäret träffar den.** En pressgjuten detalj kan se perfekt ut utifrån men ha gasblåsor som först upptäcks när CNC-skäret exponerar dem.
- **Inneslutningar kan skada skär.** Sandinklusioner i sandgjutna komponenter och slaggbildningar i stålgods kan förstöra ett hårdmetallskär på någon sekund.
- **Spänningar i materialet.** Efter gjutning och eventuell värmebehandling finns residualspänningar som kan frigöras under bearbetning och ge måttavvikelser.

Av dessa anledningar kan man inte bara ta samma recept som för stångsvarvning och applicera på gjutgods. Verktygsgeometrin, skärhastigheten, matningshastigheten och fixtureringen behöver alla anpassas.

## Toleranser — vad kan man hålla vid bearbetning av gjutgods?

Från gjutningen kommer godset med toleranser enligt SS-EN ISO 8062-3 (DCTG-klasser 4–11 beroende på metod). Bearbetning används sedan för att nå slutliga mått och toleranser. Vad som är realistiskt beror på maskinparken, fixtureringen och kunnandet — men tumregler för välskött CNC-bearbetning av gjutgods:

| Toleranstyp | Realistiskt intervall | Kommentar |
|---|---|---|
| Lineära mått (<100 mm) | IT7 (±0,018 mm) | Standardkrav för passningar |
| Lineära mått (100–500 mm) | IT8 (±0,027 mm) | Vanligt på större detaljer |
| Platthet | 0,02–0,05 mm/100 mm | Kräver styv maskin och bra fixtur |
| Parallellitet | 0,02 mm/100 mm | Bättre vid en fastsättning |
| Rundhet (svarvning) | 0,005–0,015 mm | Bra CNC-svarv + jämn dragning |
| Cylindricitet | 0,01–0,02 mm | Känsligt för termisk expansion |
| Ytjämnhet, fräsning | Ra 0,8–3,2 µm | Finfräsning med rätt skär |
| Ytjämnhet, svarvning | Ra 0,4–1,6 µm | Finfinishsvarv |
| Gängning | 6H standardgänga | Inga problem vid rätt skärvätska |

Kräver applikationen snävare toleranser — till exempel H6/g5 glidlager, ytfinish Ra < 0,4 µm eller cylindricitet bättre än 0,005 mm — behövs slipning eller honing som ett extra steg efter CNC. Detta är vanligt för hydraulikcylindrar, rotormontagehylsor och precisionslagerhus.

## CNC-metoder för olika materialtyper

Gjutgods kommer i många material, och rätt bearbetningsstrategi beror på vad du jobbar med. De fyra vanligaste materialfamiljerna i svensk verkstadsmiljö:

### Grått gjutjärn (GJL-250, GJL-300)

Grått gjutjärn bearbetar sig förvånansvärt lätt tack vare grafitlamellerna som fungerar som inbyggd smörjning och brottanvisningar för spånan. Typiska skärdata för torr fräsning med belagd hårdmetall:

- Skärhastighet (Vc): 150–250 m/min
- Matning per tand (fz): 0,15–0,35 mm/tand
- Skärdjup (ap): 2–5 mm vid grovbearbetning, 0,3–1 mm vid finishning
- Skärvätska: torr eller minimal mängd smörjning (MQL)

**Varning**: Grått gjutjärn skapar fin grafitdamm som är hälsoskadligt och som kan sätta igen oljesystem. Torrbearbetning med kraftig utsug rekommenderas. Grafitdamm är också elektriskt ledande — håll styrelektronik ren.

### Segjärn (GJS-500-7, GJS-600-3)

Segjärn är segare än grått gjutjärn tack vare de sfäriska grafitnoduli — det ger bättre mekaniska egenskaper men är mer "klibbigt" i bearbetningen. Skärdata:

- Skärhastighet: 100–180 m/min
- Matning: 0,1–0,25 mm/tand
- Skärvätska: emulsion rekommenderas

Segjärnets seghet gör att skärkanter kan krossa snarare än skäras rent. Välj positiva geometrier och skarpare eggar än för grått gjutjärn.

### Gjutet aluminium (EN AC-46000, EN AC-43000 m.fl.)

Aluminiumgjutgods är snabbt att bearbeta men har sina egna utmaningar: mjuk baskropp kombinerat med hårda silicium-partiklar (upp till 11 % Si i AlSi9Cu3) som sliter skär aggressivt.

- Skärhastighet: 300–1 200 m/min (högre för finishning)
- Matning: 0,05–0,3 mm/tand
- Skärdjup: 1–8 mm vid grovfräsning
- Skärvätska: emulsion eller MQL, undvik torrbearbetning pga klistring

**Skärval**: PCD-skär (polykristallin diamant) är standard för höglegerat siliciumhaltigt aluminium i serieproduktion. Dyrare att köpa in men livslängden är 10–50 gånger längre än belagd hårdmetall på samma material.

### Gjutstål och legerat stål

Gjutstål varierar enormt i hårdhet — från 140 HB för kolstål upp till 500 HB för verktygsstål och slitgods. Grovgenomgång:

- Skärhastighet: 80–200 m/min beroende på hårdhet
- Matning: 0,1–0,3 mm/tand
- Skärvätska: alltid emulsion, hög tryckt spånavstöt

Ytskiktet på gjutstål innehåller ofta sand, oxider och slaggrester. Första skärpasset ska alltid vara grovt (3–6 mm skärdjup) så att skäret skär under ytskiktet och inte mot det — annars slits skäret ut på sekunder.

## Fixturering — den vanligaste felkällan

Ett gjutgodsämne är sällan "snällt" att spänna fast. Ytterkonturen är oregelbunden med gjutformens skiljelinje, utstötarmärken, gjutväglar och dragningsdefekter. Att spänna fast en sådan detalj rakt av i en maskinskruvstycke ger nästan alltid dåliga resultat — ojämn dragkraft, deformationer, måttavvikelser efter losstagning.

Praktiska regler för fixturering av gjutgods:

1. **Definiera referenspunkter tidigt i gjutningen.** Ritningen ska specificera tre fixturhål eller referensytor som gjuts in i detaljen och ska användas vid alla efterföljande operationer. Detta är en DFM-diskussion som bör föras innan verktyget till gjutningen byggs.
2. **Använd dedicerade fixturer för serieproduktion.** Engångsfixturering är bara acceptabelt för enstaka bitar. Så fort serien är 50+ detaljer ska det finnas en fixtur som replikerar läge och dragning exakt mellan detaljer.
3. **Spänn mjukt mot gjutna ytor.** Använd gummibelagda stödpunkter eller mjukbackar så att ojämnheter i gjutytan inte koncentrerar spänningen på en punkt.
4. **Första operationen bearbetar referensytorna.** Operation 10 (O10) ska skapa de maskinerade referenserna som alla efterföljande operationer spänner mot. Hela bearbetningsstrategin hänger på att O10 är korrekt.

En stor del av kvalitetsproblemen vid bearbetning av gjutgods spåras till dålig fixturering snarare än till dåliga skärdata eller maskinfel. Investera tid i fixturen — det ger direkt utdelning i kvalitet och cykeltid.

## Vanliga problem och hur man hanterar dem

### Porositet

Porositet uppstår i gjutgodset när gas eller krympning lämnar hålrum i materialet. Problemet upptäcks först när skäret exponerar poren — och då är det för sent att rädda just den detaljen. Två strategier:

- **Bearbetningstillägg på kritiska ytor**: lägg på 1–2 mm extra material på ytor där porositet är oacceptabel, så att det värsta skiktet bearbetas bort.
- **Ultraljudprovning (UT) innan bearbetning**: för dyra komponenter där skrotning av ett halvfärdigt gods kostar mer än själva provningen. Standard för stora stålgods och kritiska aluminiumkomponenter.

Ett välfungerande gjuteri redovisar porositetsgräns enligt ASTM E505 (aluminium) eller motsvarande standard och levererar dokumenterade provningsresultat när det begärs i beställningen.

### Hårdhetsvariationer

Variationer i hårdhet inom en detalj — typiskt från olika stelningshastigheter i olika godstjocklekar — gör att skäret slits ojämnt över bearbetningsytan. Resultat: mikroskopiska färger på ytfinishen, variationer i mått, kortare verktygslivslängd.

Lösning: planera bearbetningsordning så att mjuka områden bearbetas först, hårda sist. Använd slitstarkare skärgeometrier än vad som normalt behövs för baskroppen. För kritiska applikationer, kräv värmebehandling eller normalisering av gjutgodset innan bearbetning.

### Spänningsfrigörelse efter grovbearbetning

Stora gjutgods har ofta residualspänningar från ojämn stelning och eventuell värmebehandling. När du tar bort material (särskilt på ena sidan) frigörs spänningarna och detaljen rör sig. Detaljen du mätte perfekt efter grovfräsning kan vara 0,1–0,5 mm ur toleranser efter en natt i verkstaden.

Lösning: lägg in ett spänningsfrigörande steg mellan grovfräsning och finfräsning. Typiskt 4–8 timmar vid 550–650 °C för stålgods, 2–4 timmar vid 180–220 °C för aluminiumgjutgods. Alternativt vibrationsbehandling för kritiska detaljer där värmebehandling inte är möjlig. För stora skrymmande detaljer är detta standard — skippas det, förlorar du måttnoggrannhet.

## Verktygsval — skär och hållare för gjutgods

Skärteknologin för gjutgods har utvecklats kraftigt de senaste tio åren. Grova rekommendationer:

| Material | Lämplig skärsort | Beläggning |
|---|---|---|
| Grått gjutjärn | Keramisk eller hårdmetall K10–K20 | Al₂O₃ eller TiN |
| Segjärn | Hårdmetall P20–P30 | TiAlN |
| Aluminium (låg Si) | Hårdmetall finkornig | Obehandlad eller DLC |
| Aluminium (hög Si, >9 %) | PCD | Obehandlad diamant |
| Kolstål gjutet | Hårdmetall P20–P40 | TiAlN eller TiCN |
| Legerat/härdat gjutgods | Hårdmetall M20 eller keramisk | AlTiN |

Fräshållare: för gjutgods med grov yta, använd fräsar med positiv skärgeometri och förhöjd spånränna för att undvika att skär krossas mot ytskiktet. Planfräsar med 45° eller 75° inträdesvinkel fungerar bättre än 90° för grovbearbetning av as-cast ytor.

## Kvalitetskontroll — vad du behöver mäta

Bearbetade gjutgodsdetaljer kräver systematisk kvalitetskontroll. Standardprogrammet inkluderar:

- **Dimensionskontroll**: mått enligt ritning, mätning på CMM eller med fast mätutrustning
- **Ytfinish**: Ra-mätning på specificerade funktionella ytor
- **Visuell kontroll**: porositet, ytfel, bearbetningsmärken, gratar
- **Hårdhetsprov**: särskilt för värmebehandlade detaljer, kontrollmått på definierade punkter
- **Oförstörande provning**: PT (penetrant) på kritiska ytor, UT på godstjocklekar, RT (röntgen) på säkerhetskritiska komponenter

För serieproduktion rekommenderas SPC-kontroll (Statistical Process Control) med mätvärden loggade per avrop. Detta gör att man upptäcker verktygs- och processdrifter i tid innan det hamnar ur toleranser.

## När ska bearbetning ingå i leverantörens åtagande?

Detta är en av de vanligaste kommersiella frågorna vi ser i svenska sourcing-projekt. Alternativen är:

1. **Leverantören levererar råämnen**, du bearbetar själv i egen CNC-maskinpark.
2. **Leverantören levererar färdigbearbetade detaljer** direkt klara för montering.
3. **Leverantören levererar halvbearbetat**, med grovbearbetning klar men finishning kvar att göra.

### Alternativ 1: Råämnen

Fungerar när du har egen CNC-kapacitet och vill hålla kontrollen över slutkvaliteten. Fördel: lägre inköpspris, flexibilitet att justera bearbetningen vid ritningsändringar. Nackdel: kräver att du sätter upp rutiner för inkommande kontroll av gjutämnen, hanterar kassationer av gods med porositet eller inneslutningar, och har kapacitet att bearbeta rätt material med rätt skärdata.

### Alternativ 2: Färdigbearbetat

Vanligaste modellen för svenska tillverkande företag som inte har egen bearbetningskapacitet eller inte vill bära kostnaden för att hantera gjutgodsspecifika problem. Fördel: en leverantör, ett ansvar, ett pris per färdig komponent. Leverantören bär risken för porositet, hårdhetsvariationer och skrot. Nackdel: högre styckepris, mindre flexibilitet vid konstruktionsändringar.

Detta är den modell Traficator normalt jobbar med — vi levererar färdigbearbetade komponenter till kundens rampport, med ett styckepris och ett ansvar för hela leveransen. Det förenklar både kostnadsuppföljning och kvalitetshantering för kunden.

### Alternativ 3: Halvbearbetat

Användbart när bearbetningen kräver specialutrustning som bara kunden har, eller när slutlig passning måste göras vid montering. Sällsynt men förekommer i branscher med extrema toleranskrav.

## Räkna totalkostnad — inte bara styckepris

En vanlig miss är att jämföra offerter på råämnen och på färdigbearbetade detaljer sida vid sida utan att räkna in hela totalkostnaden. En rättvisande jämförelse inkluderar:

- Styckepris på gjutämnet
- Inkommande kontroll och hantering (tid + maskintid)
- Bearbetningskostnad internt (maskintid × timpris + verktygsslitage)
- Skrotfrekvens på grund av porositet eller inneslutningar
- Lagerhållning av halvfabrikat
- Administrativ overhead för att hantera två leverantörer i stället för en

För många svenska tillverkande företag är totalkostnaden för modell 2 (färdigbearbetat från en leverantör) 5–15 % lägre än modell 1 (råämnen + egen bearbetning), även om styckepriset vid första anblick ser högre ut. Räkna innan du väljer.

## Checklista inför RFQ — bearbetning av gjutgods

- Ritning med både gjutmått och färdiga mått tydligt markerade
- Toleranser enligt ISO 2768-m eller strängare vid kritiska mått
- Ytfinish-krav (Ra-värde på funktionella ytor)
- Krav på värmebehandling eller spänningsfrigöring
- Krav på oförstörande provning (PT, UT, RT)
- Leveransomfattning: råämne, halvbearbetat eller färdigbearbetat?
- Kvalitetskontrollkrav per charge eller per enskild detalj?
- Förpackning och skyddsbehandling vid leverans
- Årsvolym och leveranstakt
- Materialcertifikat enligt EN 10204 3.1 eller 3.2?

## Sammanfattning och nästa steg

Bearbetning av gjutgods är en egen disciplin med egna utmaningar — ytskiktshårdhet, porositet, residualspänningar och fixtureringssvårigheter ger en helt annan uppsättning problem än bearbetning av stångsvarvat material. Att välja rätt verktyg, rätt bearbetningsstrategi och rätt leverantörsmodell kan betyda skillnaden mellan en lönsam produkt och en som konstant ger reklamationer och skrot.

Traficator levererar färdigbearbetade gjutgodskomponenter till svenska tillverkande företag — från pressgjutet aluminium och [centrifugalgjutet stål](/centrifugalgjutning-sverige-nar-lonar/) till komplexa [aluminiumkomponenter](/aluminiumgjutning-vs-pressgjutning-skillnader/) i både låg och hög volym. Vi hanterar hela kedjan från gjutning via bearbetning till leverans, och du har en svensk avtalspart som ansvarar för kvaliteten hela vägen.

**Har du en gjuten komponent där bearbetningen är en smärtpunkt?** Skicka oss ritning och nuvarande kostnadsbild på [traficator.se/kontakt](/kontakt/), så tittar vi på om vi kan leverera detaljen färdigbearbetad till ett konkurrenskraftigt pris — utan att du behöver belasta din egen CNC-park. Första genomgången är kostnadsfri och du får ett indikativt pris inom en vecka.

![CNC-bearbetning av pressgjutet aluminiumhus](cnc-bearbetning-gjutgods-aluminium.jpg "CNC-fräsning av gjutet aluminiumhus")
*Alt-text: CNC-fräsning av pressgjutet aluminiumhus med PCD-skär i svensk maskinverkstad*

![Svarvning av centrifugalgjutet bronsämne](svarvning-centrifugalgjuten-brons.jpg "Finsvarvning av brongods")
*Alt-text: Finsvarvning av centrifugalgjuten bronsbussning till H7-tolerans på CNC-svarv*

![Porositet i pressgjutet aluminium upptäckt vid bearbetning](porositet-gjutgods-bearbetning.jpg "Porositet i gjutgods")
*Alt-text: Mikroporositet i pressgjutet aluminium exponerad efter CNC-fräsning av funktionell yta*
