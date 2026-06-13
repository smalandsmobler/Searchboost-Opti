export type GuideCategory =
  | "skatt"
  | "prissattning"
  | "juridik"
  | "marknadsforing"
  | "organisation"
  | "ekonomi";

export interface Guide {
  id: string;
  slug: string;
  title: string;
  intro: string;
  body: string;
  faqs: Array<{ q: string; a: string }>;
  updatedAt: string;
  readingTimeMinutes: number;
  category: GuideCategory;
  categoryLabel: string;
}

export const GUIDES: Guide[] = [
  {
    id: "guide-01",
    slug: "f-skatt-guide",
    title: "F-skatt i Sverige: Komplett guide för egenföretagare 2026",
    intro: "F-skatt är grundläggande för alla som fakturerar i Sverige. Den här guiden förklarar vad F-skatt innebär, hur du ansöker, vad egenavgifterna kostar, hur preliminärskatten fungerar — och de misstag som kostar soloföretagare mest.",
    body: `## Vad är F-skatt?

F-skatt är ett godkännande från Skatteverket som visar att du som företagare själv tar ansvar för din preliminärskatt och dina egenavgifter. När du fakturerar en kund med F-skattsedel behöver kunden inte dra av preliminärskatt — det sköter du själv.

Utan F-skattsedel är kunden skyldig att dra av 30 % preliminärskatt på utbetalningen. Det gör fakturering märkbart krångligare för alla inblandade och signalerar att du inte driver en professionell verksamhet.

**FA-skatt** är varianten för dig som kombinerar anställning med egenföretagande. Arbetsgivaren hanterar skatten på lönen, och du betalar egenavgifter på inkomsten från företaget.

## Hur du ansöker

1. Gå till skatteverket.se och logga in med BankID
2. Välj "Ansök om F-skatt"
3. Registrera ditt företag och välj företagsform
4. Fyll i branschkod (SNI-kod), beräknad omsättning och startdatum
5. Kryssa i F-skatt (och FA-skatt om relevant)
6. Skicka in

Handläggningstiden är normalt en till tre veckor. Ansökan är kostnadsfri.

**Tips:** Registrera dig för moms samtidigt om din beräknade omsättning överstiger 120 000 kronor per år. Det sparar ett steg.

## Egenavgifter

Egenavgifter är det du betalar istället för arbetsgivaravgifter. De finansierar sjukförsäkring, pension och andra socialförsäkringsförmåner.

- **Under 65 år:** ca 28,97 % av vinsten
- **65 år och äldre:** ca 10,21 %

Egenavgifterna beräknas på din nettoinkomst (vinst) minus halva egenavgiften (som är avdragsgill).

**Räkneexempel:**
Med 400 000 kr i vinst blir egenavgifterna ca 99 000 kr. Exakt belopp beror på din ålder och om du har justeringar i deklarationen.

Tumregel: sätt av **40–45 %** av varje inbetalning för skatter och avgifter. Det täcker egenavgifter, preliminärskatt och moms.

## Preliminärskatt

Skatteverket beräknar en preliminärskatt baserat på din förväntade inkomst. Den betalas månadsvis.

Om din faktiska inkomst avviker från beräkningen — justera din preliminärskatt löpande via Skatteverkets e-tjänster. Att underbetala med mer än 30 000 kr innebär ränta.

Det är bättre att betala lite för mycket (du får tillbaka det) än för lite (du betalar ränta och får en obehaglig skattesmäll).

## Vanliga misstag

**Väntar för länge med att ansöka.** Ansök innan du börjar fakturera — inte efter. Utan F-skatt behöver kunden dra preliminärskatt.

**Sätter inte av till skatten.** Det vanligaste och dyraste misstaget. Behandla 40–45 % av varje inbetalning som skattepotter du inte rör.

**Glömmer justera preliminärskatten.** Går det bättre eller sämre än beräknat — justera direkt. Skatteverket vill hellre ha rätt siffra löpande än att hantera stor avräkning.

**Blandar privat och företag.** Ha ett separat bankkonto från dag ett. Det förenklar bokföring och skattehantering avsevärt.

## Kan F-skatt återkallas?

Ja — Skatteverket kan återkalla F-skatt om du inte betalar skatter eller avgifter, har stora skatteskulder, eller lämnat felaktiga uppgifter. Du kan också frivilligt avregistrera dig.

Om du tappar F-skatt måste du informera dina kunder omedelbart — annars kan de bli ansvariga för att inte ha dragit preliminärskatt.`,
    faqs: [
      {
        q: "Vad är F-skatt?",
        a: "F-skatt är ett godkännande från Skatteverket som innebär att du som företagare själv ansvarar för att betala din preliminärskatt och egenavgifter. Med F-skatt kan du fakturera utan att kunden behöver dra av preliminärskatt.",
      },
      {
        q: "Hur ansöker jag om F-skatt?",
        a: "Du ansöker via Skatteverkets e-tjänster på skatteverket.se med BankID. Handläggningstiden är normalt en till tre veckor och ansökan är kostnadsfri.",
      },
      {
        q: "Vad kostar egenavgifterna?",
        a: "Egenavgifterna är ca 28,97 % för dig under 65 år, beräknat på din nettoinkomst. De finansierar din sjukförsäkring, pension och övriga socialförsäkringsförmåner.",
      },
      {
        q: "Vad är skillnaden mellan FA-skatt och F-skatt?",
        a: "FA-skatt gäller om du kombinerar anställning med egenföretagande. Arbetsgivaren hanterar skatten på lönen. Du betalar egenavgifter enbart på inkomsten från företaget.",
      },
      {
        q: "Kan F-skatt återkallas?",
        a: "Ja — Skatteverket kan återkalla F-skatt vid utebliven betalning av skatter, stora skulder eller felaktiga uppgifter. Frivillig avregistrering är också möjlig.",
      },
    ],
    updatedAt: "2026-06-05",
    readingTimeMinutes: 8,
    category: "skatt",
    categoryLabel: "Skatt",
  },

  {
    id: "guide-02",
    slug: "timpris-guide",
    title: "Rätt timpris som frilansare i Sverige 2026",
    intro: "De flesta frilansare sätter sitt timpris för lågt. Inte för att de inte vet bättre, utan för att de inte räknat på vad priset faktiskt behöver vara för att ge dem den inkomst de vill ha. Den här guiden ger dig formeln, branschsnitten och de vanligaste misstagen.",
    body: `## Formeln för ditt timpris

Timpriset du fakturerar är inte detsamma som din lön. Du betalar egenavgifter, skatt, semester, sjukdagar och driftkostnader — allt ur samma faktura.

**Grundformeln:** (Önskad nettolön × 1,6 + driftkostnader) ÷ faktureringsbara timmar per månad.

Faktorn **1,6** täcker egenavgifter (ca 29 %), inkomstskatt och marginal för semester och ohälsa. Om du har höga kostnader eller väljer ett högt sparande kan du justera upp till 1,7–2,0.

**Räkneexempel:**

- Önskad nettolön: 45 000 kr/mån
- Driftkostnader: 5 000 kr/mån (programvaror, telefon, kontorsmaterial)
- Faktureringsbara timmar: 120/mån

(45 000 × 1,6) + 5 000 = 77 000
77 000 ÷ 120 = 642 kr/tim

## Faktureringsbara timmar — en vanlig kalkylmiss

Du jobbar inte 8 timmar × 22 dagar = 176 fakturerbara timmar per månad. En stor del av din tid går till:

- Marknadsföring och kundanskaffning
- Administration, bokföring, mejl
- Kompetensutveckling
- Ohälsa och oplanerat bortfall

Realistisk maxnivå för heltidsfrilans: **120–140 fakturerbara timmar per månad**. Räknar du med 170 och fakturerar bara 120 — tjänar du 30 % mindre än du trodde.

## Branschsnitt Sverige 2026

| Kategori | Timprisspann |
|----------|-------------|
| IT & mjukvara | 900–1 800 kr |
| Juridik | 1 200–2 500 kr |
| Ekonomi & redovisning | 800–1 400 kr |
| Design & kommunikation | 650–1 100 kr |
| Marknadsföring & content | 600–1 000 kr |
| Management consulting | 1 200–2 500 kr |

Stockholm och Göteborg ligger normalt 15–25 % högre än riksgenomsnittet.

## Fem vanliga misstag

**1. Underskattar driftkostnaderna.** Programvaror, telefon, försäkringar, utbildning — det summerar snabbt.

**2. Räknar inte in semester.** Du har inga semesterpengar — de ingår i ditt timpris. Fem veckors semester = 42 dagar du inte fakturerar.

**3. Ger rabatt vid förhandling.** Rabattera aldrig utan att ta bort något ur leveransen. Sänker du priset utan att sänka scopet sänker du din lön.

**4. Höjer inte priset.** Kostnader ökar varje år. Priset borde göra det också.

**5. Jämför med anställdas lön.** En anställd med 40 000 kr i lön kostar arbetsgivaren ca 60 000 kr. Jämför alltid med totalkostnaden, inte bruttolönen.

## Ska du ha timpris eller projektpris?

Timpris ger flexibilitet men begränsar din intjäning till antal timmar. Projektpris ger möjlighet att tjäna mer per timme om du är effektiv — men kräver bra scope-definition.

Starta med timpris. Gå mot projektpris när du har erfarenhet nog att uppskatta scope pålitligt.`,
    faqs: [
      {
        q: "Hur räknar jag ut mitt timpris?",
        a: "Grundformeln: (önskad nettolön × 1,6 + driftkostnader) ÷ faktureringsbara timmar per månad. Faktorn 1,6 täcker egenavgifter, skatt och marginal. Räkna med max 120–140 faktureringsbara timmar per månad för heltidsfrilans.",
      },
      {
        q: "Vad är branschsnittet för IT-konsulter i Sverige?",
        a: "IT-konsulter fakturerar generellt 900–1 800 kr/tim beroende på specialisering och erfarenhet. Seniora profiler inom AI, säkerhet och arkitektur ligger i det övre spannet. Stockholm och Göteborg ligger 15–25 % högre än riksgenomsnittet.",
      },
      {
        q: "Ska jag ta moms på mitt timpris?",
        a: "Om din omsättning överstiger 120 000 kronor per år är du momspliktig och ska lägga 25 % moms på fakturan. Timpriset du kommunicerar ska vara exklusive moms — skriv alltid 'exkl. moms' i offert och faktura.",
      },
      {
        q: "Kan jag ha olika timpris för olika kunder?",
        a: "Ja, det är vanligt och affärsmässigt rimligt. Stora bolag kan bära ett högre pris än en liten organisation. Det viktiga är att du känner till ditt lägstpris och aldrig underskrider det.",
      },
      {
        q: "Hur ofta ska jag höja mitt timpris?",
        a: "En justering per år är rimligt. Koppla det till ett naturligt tillfälle — nytt år eller ny avtalsperiod. För nya kunder kan du justera när marknaden bär det, eller när din efterfrågan konsekvent överstiger din kapacitet.",
      },
    ],
    updatedAt: "2026-06-05",
    readingTimeMinutes: 7,
    category: "prissattning",
    categoryLabel: "Prissättning",
  },

  {
    id: "guide-03",
    slug: "ai-verktyg-egenforetagare",
    title: "AI-verktyg för svenska egenföretagare 2026",
    intro: "AI-verktyg kan spara tid och sänka kostnader för egenföretagare — om de används rätt. Den här guiden ger en konkret genomgång av de verktyg som faktiskt tillför värde i en svensk soloföretagares vardag, vad de kostar, vad de är bra på och var gränserna går.",
    body: `## Vad AI-verktyg faktiskt kan göra för dig

AI-verktyg är inte en universallösning. Men för ett antal avgränsade uppgifter är de genuint tidsbesparande — och den tidsbesparingen är värdefull för en soloföretagare som inte har en stab att delegera till.

De uppgifter där verktygen levererar mest värde:
- Skriva och redigera texter: offerttexter, mejl, webbtexter, rapporter
- Sammanfatta långa dokument, avtal och rapporter
- Strukturera information du har men inte hunnit organisera
- Generera första utkast av presentationer, agendor och FAQ
- Transkribera och sammanfatta mötesinspelningar

De uppgifter där de tillför begränsat värde:
- Strategiska råd om din specifika situation
- Kundrelationer och förhandling
- Kreativt arbete där ditt unika perspektiv är det som säljer
- Juridisk och skatterättslig rådgivning

## Verktygsöversikt

**Textgenerering och redigering**

*ChatGPT (OpenAI)* — det mest använda verktyget. Bra för att skriva och redigera alla typer av text. Plus-versionen (ca 200 kr/mån) ger tillgång till de kraftfullare modellerna och möjlighet att ladda upp dokument.

*Claude (Anthropic)* — stark konkurrent med bättre förmåga att hålla längre kontext och producera mer nyanserade texter. Jämförbar prissättning.

*Gemini (Google)* — integreras med Google Workspace vilket är värdefullt om du arbetar i Google Docs och Gmail.

**Mötestranskribering**

*Otter.ai* — spelar in och transkriberar möten i realtid, skapar sammanfattning och action points. Gratisversion finns, plus-version ca 130 kr/mån.

**Presentationer**

*Gamma* — genererar presentationsunderlag från text. Bra för att snabbt skapa ett visuellt utkast. Fungerar som startpunkt, inte slutprodukt.

**Bild och grafik**

*Canva med AI-funktioner* — AI-generering direkt i designplattformen. Kostnadseffektivt alternativ för den som behöver visuellt material utan att anlita en designer.

**Automatisering**

*Zapier / Make* — automatiserar repetitiva arbetsflöden mellan dina verktyg. Inga programmeringskunskaper krävs.

## Kostnad: vad du faktiskt behöver betala

En rimlig verktygsstapel för en soloföretagare:
- ChatGPT Plus eller Claude Pro: ca 200 kr/mån
- Otter.ai eller Fireflies: ca 130 kr/mån
- Canva Pro: ca 130 kr/mån
- Zapier Starter: ca 240 kr/mån (om du behöver automatisering)

**Total: 500–700 kr/mån.** Om du sparar fyra timmar i månaden och värderar din tid till 800 kr/tim — betalar verktygen sig tiofalt.

## Sekretess och GDPR-överväganden

Innan du klistrar in kunddata eller känslig affärsinformation i ett AI-verktyg — kontrollera leverantörens datahanteringsvillkor.

OpenAI, Anthropic och Google erbjuder möjlighet att stänga av träning på din data om du har ett betalt konto. Aktivera det.

Klistra aldrig in personnummer, betalningsinformation, lösenord eller konfidentiella kunduppgifter utan att kontrollera hur datan hanteras.

## Hur du implementerar verktygen effektivt

Det vanligaste misstaget är att prova för många verktyg för snabbt. Börja med ett enda verktyg för en enda uppgift du gör ofta. Lär dig det ordentligt under fyra veckor.

Skapa dina egna prompts och spara de som fungerar bra. Det är en tillgång som ökar i värde med tiden.`,
    faqs: [
      {
        q: "Vilket AI-verktyg ska jag börja med?",
        a: "Börja med ChatGPT eller Claude för generell texthjälp. Testa gratisversionen en till två veckor, och uppgradera till betald version om du märker att du använder det dagligen.",
      },
      {
        q: "Är det säkert att använda AI-verktyg för kundrelaterat arbete?",
        a: "Med försiktighet — ja. Stäng av träningsinställningar på betalkonton. Anonymisera kunddata. Dela aldrig personuppgifter, betalningsinformation eller sekretessbelagd information.",
      },
      {
        q: "Kan AI-verktyg ersätta en redovisningskonsult eller jurist?",
        a: "Nej. AI-verktyg kan hjälpa dig förstå begrepp och formulera frågor — men de kan inte ge rådgivning som är juridiskt bindande eller skatterättsligt säker. För beslut med ekonomiska eller juridiska konsekvenser behöver du alltid en licensierad rådgivare.",
      },
      {
        q: "Hur lång tid tar det att lära sig använda verktygen effektivt?",
        a: "För grundläggande användande: en till två veckor. För att dra full nytta och bygga egna effektiva arbetsflöden: en till tre månader. Ett välformulerat prompt ger dramatiskt bättre resultat än ett vagt.",
      },
      {
        q: "Märker kunderna om jag använder AI-verktyg?",
        a: "Inte om du redigerar resultaten ordentligt och lägger till ditt eget perspektiv. Behandla AI-output som ett utkast, inte en slutleverans.",
      },
    ],
    updatedAt: "2026-06-05",
    readingTimeMinutes: 8,
    category: "marknadsforing",
    categoryLabel: "Marknadsföring",
  },

  {
    id: "guide-04",
    slug: "offert-guide",
    title: "Hur du skriver en offert som vinner",
    intro: "En offert är din viktigaste säljhandling — men de flesta skrivs slentrianmässigt. Den här guiden ger dig en konkret struktur, formuleringar som fungerar och de vanligaste misstagen som kostar dig affärer.",
    body: `## Vad en offert faktiskt är

En offert är inte ett prisdokument. Det är ett förtroendebyggande dokument som råkar innehålla ett pris.

Kunden ställer sig tre frågor: förstår den här personen mitt problem, kan de leverera och är det värt priset? De svarar på frågorna i den ordningen. Priset utvärderas sist — och bara om de första två frågorna fått ett jakande svar.

## Offertens struktur

**1. Bakgrund och problemformulering**
Visa att du förstår kundens situation. Kunden ska läsa det och tänka: "Ja, det är precis det det handlar om."

Det kräver ett genuint samtal med kunden innan du skriver offerten. Om du inte vet tillräckligt — ha det samtalet först.

**2. Vad du föreslår**
Beskriv konkret vad du ska göra — resultatet, inte processen. "Du får en ny webbplats" är bättre än "vi bygger i WordPress med Elementor och..."

Specificera vad som ingår. Och vad som inte ingår.

**3. Tidsplan**
Startdatum, viktiga delleveranser, slutdatum. Det skapar tydlighet och trovärdighet.

**4. Pris**
Presentera priset tydligt. Fast pris eller löpande räkning. Ange alltid om priset är exklusive moms.

**5. Nästa steg**
Vad ska kunden göra för att säga ja? Gör det enkelt — en signatur eller ett svar på mejlet.

## Formuleringen som skapar förtroende

Undvik passiv, teknisk text. Skriv som du talar.

**Dåligt:** *"Projektet syftar till att genomföra en analys av befintlig digital kommunikationsstruktur i syfte att identifiera potentiella förbättringsområden."*

**Bättre:** *"Jag går igenom hur ni kommunicerar digitalt idag och berättar vad som fungerar, vad som inte gör det och vad jag rekommenderar att ni ändrar."*

## Timing och uppföljning

Skicka offerten inom 24 timmar efter mötet. Energin från samtalet är fortfarande levande.

Följ upp efter tre till fem dagar om du inte hört något: *"Hej, har du hunnit titta igenom? Finns det något du vill att jag förtydligar?"*

Det kan fördubbla din konverteringsgrad.

## Vanliga misstag

**För generisk.** Varje offert bör ha minst ett avsnitt specifikt skrivet för denna kund.

**Pris utan kontext.** Priset ska komma efter att du etablerat värdet.

**Inga tydliga nästa steg.** Offerten slutar och kunden gör ingenting.

**För lång.** För uppdrag på 50 000–150 000 kr räcker tre till fem sidor. Mer är inte bättre.`,
    faqs: [
      { q: "Hur lång ska en offert vara?", a: "Det beror på uppdragets komplexitet. För uppdrag under 50 000 kronor: en till två sidor. För projekt på 50 000–500 000 kronor: tre till fem sidor. Kvalitet och tydlighet väger alltid tyngre än längd." },
      { q: "Ska jag ha ett specifikt format?", a: "En mall är bra för effektivitet, men bakgrundsbeskrivningen och problemförståelsen måste vara unikt för varje kund. Det är det som signalerar att du faktiskt lyssnat." },
      { q: "Vad gör jag om kunden förhandlar om priset?", a: "Förstå vad de egentligen säger: budgetproblem eller värdeproblem? Sänk aldrig priset utan att ta bort något ur scopet." },
      { q: "Ska jag inkludera referenser i offerten?", a: "Ja, om det är relevant. Ett till två korta exempel på liknande uppdrag — vad uppdraget var och vad resultatet blev — bygger förtroende effektivt." },
      { q: "Hur hanterar jag uppföljning utan att verka desperat?", a: "Uppföljning är professionellt, inte desperat. En enkel mening efter tre till fem dagar räcker. Tre kontakter totalt är rimligt." },
    ],
    updatedAt: "2026-06-08",
    readingTimeMinutes: 7,
    category: "juridik",
    categoryLabel: "Juridik",
  },

  {
    id: "guide-05",
    slug: "kontrakt-guide",
    title: "Kundavtal för konsulter och frilansare",
    intro: "Ett kundavtal skyddar dig när något går fel — och det gör det till slut, för alla. Den här guiden förklarar vad ett bra kundavtal ska innehålla, vilka klausuler som är viktigast och hur du inför en avtalspraxis utan att det känns som juridik.",
    body: `## Varför du behöver ett avtal

Tvister uppstår nästan alltid på grund av otydliga förväntningar. Kunden trodde att det ingick. Du trodde att det inte ingick. Utan ett avtal är den verklighet ni hade i huvudet inte verifierbar.

Det behöver inte vara ett tjugo sidor långt juridiskt dokument. Tre till fem sidor med tydlig svenska räcker.

## Vad avtalet ska innehålla

**Parternas identitet** — namn, organisationsnummer, kontaktuppgifter.

**Uppdragets scope** — vad ska göras, konkret. "Skriva tre artiklar om X, Y och Z, vardera 800–1 000 ord, levererade i Google Docs" är tydligt. "Stöd med innehållsproduktion" är inte det.

**Vad som inte ingår** — lika viktigt som vad som ingår.

**Tidsplan och leveransdatum.**

**Pris och betalningsvillkor** — totalbelopp eller löpande taxa, när faktureras, betalningsvillkor (standard 30 dagar netto), dröjsmålsränta.

**Förskottsbetalning** — 25–50 % av totalbeloppet innan arbetet påbörjas är rimligt och vanligt.

**Ändringsprocess (change management)** — ändringsförfrågan skriftligen, du prissätter, kunden godkänner.

**Immateriella rättigheter** — standardlösningen: kunden äger materialet efter full betalning, du äger det dessförinnan.

**Sekretess** — om du har tillgång till kundkonfidentiell information.

**Uppsägning** — vilket varsel gäller, vad händer med pågående arbete.

**Ansvarsbegränsning** — begränsa ditt ekonomiska ansvar till ersättningen du fått för uppdraget.

## Hur du inför avtalspraxis

Om du inte haft avtal hittills — börja nu, med nästa kund. Det behöver inte göras dramatik av det:

*"Jag skickar ett kort avtal som sammanfattar vad vi pratat om, så att vi har allt på plats."*

De flesta kunder uppfattar det positivt. Det signalerar professionalism.

## Digitala signeringsverktyg

BankID-signeringsplattformar, DocuSign och Scrive gör det enkelt att skicka och signera digitalt. En digital signatur med e-legitimation är juridiskt bindande i Sverige.

Alternativt: en godkänd offert via mejl, kombinerat med ett klart scope-dokument, ger ofta tillräcklig dokumentation för de flesta tvister i praktiken.`,
    faqs: [
      { q: "Måste ett avtal vara juridiskt utformat för att gälla?", a: "Nej. Vad som krävs är offer, accept och pris. En mejlkonversation där kunden bekräftar din offert är i praktiken ett avtal. Skriftliga avtal med tydliga villkor är dock alltid att föredra." },
      { q: "Vad gör jag om kunden vägrar skriva på ett avtal?", a: "Det är ett varningstecken. En seriös kund har inget emot att bekräfta vad ni kommit överens om skriftligen." },
      { q: "Behöver jag anlita en jurist?", a: "För ett standardavtal för konsult- eller frilanstjänster behöver du oftast inte det. Det finns bra mallar att utgå från. Om du jobbar med hög riskexponering eller immateriella rättigheter av högt värde — konsultera en jurist för de delarna." },
      { q: "Hur lång betalningsvillkor ska jag ha?", a: "Standard är 30 dagar netto. Förskottsbetalning 25–50 % är rimligt för projektbaserat arbete. Undvik 60 dagar eller mer om du kan — det skapar onödiga likviditetsproblem." },
      { q: "Vad händer om kunden inte betalar?", a: "Skicka påminnelse med dröjsmålsränta. Om det inte hjälper kan du ansöka om betalningsföreläggande via Kronofogdemyndigheten. Har du ett tydligt avtal är processen enklare." },
    ],
    updatedAt: "2026-06-08",
    readingTimeMinutes: 7,
    category: "juridik",
    categoryLabel: "Juridik",
  },

  {
    id: "guide-06",
    slug: "moms-guide",
    title: "Moms och momsredovisning för egenföretagare",
    intro: "Moms är ett av de vanligaste frågorna från nya egenföretagare — och ett av de vanligaste misstagen. Den här guiden förklarar när du är momspliktig, hur du redovisar, vad du kan dra av, och de fallgropar som kostar soloföretagare mest.",
    body: `## Vad är moms?

Moms (mervärdesskatt) är en skatt som konsumenten i slutändan betalar, men som företag samlar in och betalar vidare till Skatteverket.

Som momsregistrerat företag lägger du på moms på dina fakturor (utgående moms) och drar av moms på dina inköp (ingående moms). Skillnaden betalar du till Skatteverket — eller får tillbaka.

Momsen är en genomgångspott, inte en kostnad för dig. Men den kräver ordning.

## När är du momspliktig?

Du är momspliktig när din beskattningsbara omsättning överstiger **120 000 kronor per år** (gränsen för 2026).

Under den gränsen är momsregistrering frivillig. Om du jobbar mot momsregistrerade företag som kunder — överväg att registrera dig ändå, eftersom dina kunder kan dra av momsen.

**Viktigt:** registrera dig *innan* du passerar gränsen.

## Momssatser

- **25 %** — standardsats, gäller de flesta tjänster
- **12 %** — livsmedel, restaurang, hotell
- **6 %** — böcker, tidningar, persontransport
- **0 %** — sjukvård, finansiella tjänster, utbildning (i många fall)

För de flesta konsulter och frilansare gäller 25 % på alla tjänster.

## Momsperioder

**Årsvis via inkomstdeklarationen** — om omsättningen understiger 1 miljon kronor. Det enklaste för de flesta soloföretagare.

**Kvartalsvis** — om omsättningen är 1–40 miljoner kronor per år.

**Månadsvis** — om omsättningen överstiger 40 miljoner kronor per år.

## Vad du kan dra av moms på

Du kan dra av ingående moms på inköp direkt kopplade till verksamheten:
- Programvaror och abonnemang
- Kontorsmaterial
- Utbildning och kurser
- Telefon och dator (om de primärt används i verksamheten)
- Marknadsföringsutgifter

Du *kan inte* dra av moms på privata kostnader.

## Vanliga misstag

**Försenad momsregistrering.** Om du passerar gränsen och inte är registrerad riskerar du retroaktiv skattskyldighet.

**Glömmer ingående moms.** Det är pengar du har rätt att dra av — men du måste registrera kvittona.

**Använder momspengarna löpande.** Momsen är inte din inkomst. Håll den åtskild.`,
    faqs: [
      { q: "Måste jag momsregistrera mig direkt när jag startar?", a: "Nej, inte om du inte förväntar dig att överstiga 120 000 kronor. Men om du jobbar mot momsregistrerade företag kan det vara fördelaktigt att registrera sig direkt." },
      { q: "Vad händer om jag glömmer lämna momsdeklarationen?", a: "Skatteverket skickar påminnelse. Lämnar du ändå inte kan du få skattetillägg. Lämna alltid deklarationen i tid, även om det är en nolldeklaration." },
      { q: "Hur bokför jag moms i praktiken?", a: "I de flesta bokföringsprogram hanteras momsen automatiskt när du registrerar fakturor och kvitton med rätt momskod. Programmet räknar ut vad du ska betala eller återfå." },
      { q: "Kan jag fakturera utan moms till utländska kunder?", a: "Om du säljer tjänster till ett momsregistrerat företag inom EU fakturerar du normalt utan moms och anger kundens VAT-nummer (omvänd skattskyldighet). Konsultera din redovisningskonsult för ditt specifika fall." },
      { q: "Hur vet jag vilken momssats min tjänst har?", a: "25 % är standardsatsen och gäller om inget annat anges. Om du är osäker — kontrollera på Skatteverket.se eller fråga din redovisningskonsult." },
    ],
    updatedAt: "2026-06-10",
    readingTimeMinutes: 7,
    category: "skatt",
    categoryLabel: "Skatt",
  },

  {
    id: "guide-07",
    slug: "forsakringar-guide",
    title: "Försäkringar du behöver som egenföretagare",
    intro: "Som anställd har du ett skyddsnät du kanske inte märker förrän det försvinner. Som egenföretagare bygger du det själv. Den här guiden ger en praktisk genomgång av vilka försäkringar som är nödvändiga, vilka som är starkt rekommenderade och vad de kostar.",
    body: `## Det skyddsnät du lämnar bakom dig

Som anställd ingår automatiskt: sjuklön de första 14 dagarna, sjukersättning via Försäkringskassan, kollektivavtalad tjänstepension, gruppliv- och olycksfallsförsäkring.

När du startar eget ansvarar du för allt detta själv. Nivåerna från Försäkringskassan är i genomsnitt lägre än vad en anställd får.

## Sjukförsäkring och inkomstskydd

Karensavdraget innebär att du inte får ersättning de första dagarna av sjukdom. Som egenföretagare kan du ta bort karensen (mot högre premie) eller behålla den.

Praktiskt råd: behåll karensen och skaffa en privat **inkomstskyddsförsäkring** som täcker längre sjukdomsperioder.

**Privat sjukvårdsförsäkring** ger kortare vårdköer. Kostar 2 000–5 000 kr/år. Inte nödvändig, men populär bland soloföretagare.

Se till att din **SGI (sjukpenninggrundande inkomst)** är korrekt registrerad hos Försäkringskassan — annars kan du få lägre ersättning vid sjukdom.

## Tjänstepension

Du har ingen arbetsgivare som avsätter pension åt dig. Du måste göra det själv.

**Tumregel:** avsätt 4,5 % av din inkomst upp till 8,07 inkomstbasbelopp, och 30 % av inkomsten däröver. Det är ungefär vad arbetsgivare gör via kollektivavtal.

Pensionssparande i bolaget (tjänstepension) ger skatteförmåner. Börja tidigt — ränta-på-ränta-effekten gör att varje år utan avsättning kostar oproportionerligt mycket.

## Ansvarsförsäkring

**Konsultansvarsförsäkring** täcker ekonomisk skada du kan orsaka kunder genom fel rådgivning eller misstag i leverans. Stora bolagskunder kan kräva den.

Kostar 2 000–8 000 kr/år beroende på verksamhet.

**Allmän ansvarsförsäkring** täcker skada på person eller egendom. Nödvändig om du arbetar fysiskt hos kunder.

## Egendomsförsäkring

Din hemförsäkring täcker ofta inte professionell utrustning. Kontrollera villkoren — om du har dyr dator eller specialutrustning, skaffa företagsförsäkring.

## Prioriteringsordning

1. Konsultansvarsförsäkring (om dina uppdrag medför ekonomisk risk för kunden)
2. Inkomstskydd vid långvarig sjukdom
3. Tjänstepension (börja med en liten avsättning — öka när ekonomin tillåter)
4. Egendomsförsäkring för viktig utrustning
5. Privat sjukvårdsförsäkring`,
    faqs: [
      { q: "Täcker min hemförsäkring min dator?", a: "Hemförsäkringen täcker ofta elektronik, men många försäkringsbolag begränsar täckning för utrustning som primärt används yrkesmässigt. Kontrollera ditt villkor." },
      { q: "Vad är SGI och varför spelar den roll?", a: "SGI (sjukpenninggrundande inkomst) är den inkomst Försäkringskassan beräknar din sjukpenning på. Se till att den är registrerad och stämmer — om den är fel kan du få för låg ersättning vid sjukdom." },
      { q: "Behöver jag konsultansvarsförsäkring?", a: "Om ditt arbete kan orsaka ekonomisk skada för kunden om det är fel eller försenat, kan du ha en exponering. Stora bolagskunder kräver ibland försäkringsbevis. Konsultera ett försäkringsbolag." },
      { q: "Kan jag dra av försäkringspremier i bolaget?", a: "Ja, försäkringar kopplade till verksamheten är avdragsgilla: konsultansvar, egendomsförsäkring, allmän ansvar. Tjänstepension via bolaget är avdragsgill upp till vissa tak." },
      { q: "Hur mycket tjänstepension bör jag avsätta?", a: "Riktlinje: 4,5 % av inkomst upp till ca 560 000 kr/år, och 30 % av inkomst däröver. Börja med vad du har råd med och öka successivt." },
    ],
    updatedAt: "2026-06-10",
    readingTimeMinutes: 7,
    category: "organisation",
    categoryLabel: "Organisation",
  },

  {
    id: "guide-08",
    slug: "bokforing-guide",
    title: "Bokföring för nybörjare — eget företag",
    intro: "Bokföring låter komplicerat men är i grunden ett system för att hålla koll på pengar in och ut. Den här guiden ger dig en praktisk introduktion: vad du måste göra, vad du kan göra själv och när det är värt att anlita hjälp.",
    body: `## Vad bokföring är

Bokföring är en systematisk registrering av alla ekonomiska händelser i din verksamhet. Varje inbetalning, varje utbetalning, varje faktura ska noteras och kategoriseras.

Det är inte frivilligt. Alla som driver ett företag i Sverige är bokföringsskyldiga enligt bokföringslagen.

## De grundläggande begreppen

**Verifikation** — ett underlag som dokumenterar en ekonomisk händelse: faktura, kvitto, bankutdrag. Varje bokföringspost ska ha en verifikation.

**Kontoplan** — det system av konton du bokför mot. I Sverige används BAS-kontoplanen. Bokföringsprogram har den inbyggd.

**Periodisering** — att matcha intäkter och kostnader mot rätt period. En faktura du skickar i december tillhör december, även om kunden betalar i januari.

## Vad du behöver göra löpande

**Spara alla kvitton och fakturor.** Digital kopia räcker. Ta en bild direkt med telefonen. Kvitton ska sparas i sju år.

**Bokför löpande, inte i bulk.** Bokföring varje vecka tar tio till tjugo minuter. Att göra ett halvår i ett svep tar dagar.

**Stäm av kontot regelbundet.** Jämför ditt bankkonto med dina bokföringsposter minst en gång i månaden.

## Bokföringsprogram för soloföretagare

Du behöver ett bokföringsprogram. Manuell bokföring i kalkylark är inte hållbart.

**Fortnox** — marknadsledande, många integrationer, bra support. Ca 250–500 kr/mån.

**Bokio** — enkelt och billigt, bra för nybörjare. Gratisalternativ finns.

**Visma eEkonomi** — robust, bra för de som vill ha mer kontroll. Ca 300–600 kr/mån.

## Vad du kan göra själv — och inte

**Kan göra själv:** löpande bokföring, fakturering, momsdeklaration, enklare inkomstdeklaration för enskild firma.

**Rekommenderat att anlita hjälp för:** årsredovisning för aktiebolag, komplexa skattefrågor, bokslut.

## Vanliga misstag

**Blandar privatekonomin med företaget.** Ha ett separat företagskonto från dag ett.

**Bokför inte kontantinköp.** Alla kostnader behöver underlag. Ta bild på kvittot direkt.

**Väntar till sista minuten med momsdeklarationen.** Sätt en påminnelse i god tid.`,
    faqs: [
      { q: "Måste jag anlita en redovisningskonsult?", a: "Nej. Enskilda firmor kan sköta bokföringen helt själva. Aktiebolag behöver årsredovisning, vilket är svårare att göra rätt på egen hand." },
      { q: "Hur länge måste jag spara kvitton?", a: "Räkenskapsmaterial ska bevaras i sju år efter räkenskapsårets slut. Digitala kopior är godkända." },
      { q: "Vad händer om jag gör fel i bokföringen?", a: "Mindre fel korrigeras med en rättelsebokföring. Allvarligare fel, som medveten felaktig bokföring för att undvika skatt, kan leda till skattebrott." },
      { q: "Kan jag byta bokföringsprogram mitt i räkenskapsåret?", a: "Tekniskt möjligt men administrativt krångligt. Byt helst vid ett nytt räkenskapsår och ta hjälp av en konsult för övergången." },
      { q: "Vilken bolagsform kräver mest bokföring?", a: "Aktiebolag har de striktaste kraven: formell årsredovisning till Bolagsverket och revisor om du uppfyller vissa storlekskrav." },
    ],
    updatedAt: "2026-06-12",
    readingTimeMinutes: 7,
    category: "ekonomi",
    categoryLabel: "Ekonomi",
  },

  {
    id: "guide-09",
    slug: "gdpr-guide",
    title: "GDPR för svenska soloföretagare",
    intro: "GDPR gäller alla som hanterar personuppgifter — och det gör nästan alla egenföretagare. Den här guiden förklarar vad du faktiskt behöver göra, vad som är nödvändigt kontra överkurs, och hur du uppfyller grundkraven utan att drunkna i juridik.",
    body: `## Vad GDPR innebär för dig

GDPR reglerar hur personuppgifter får samlas in, lagras och användas. Personuppgifter är all information som kan kopplas till en identifierbar person: namn, e-postadress, telefonnummer, IP-adress.

Som egenföretagare hanterar du förmodligen personuppgifter om kunder, leads och leverantörskontakter. Det gör dig till **personuppgiftsansvarig**.

## Laglig grund — varför du får behandla uppgifterna

Du behöver alltid kunna svara på varför du har rätt att lagra och använda uppgifterna.

**Avtal** — du behöver uppgifterna för att fullgöra ett avtal (kundkontaktuppgifter för leverans och fakturering).

**Berättigat intresse** — du har ett legitimt intresse (hålla kontakt med befintliga kunder).

**Samtycke** — personen har aktivt gett sitt samtycke (nyhetsbrevsprenumeranter).

Du behöver inte ha samtycke för allt — det är ett vanligt missförstånd.

## Vad du faktiskt måste göra

**Informera om din behandling.** Publicera en integritetspolicy på din webbplats. Den ska innehålla: vem du är, vilka uppgifter du behandlar, varför, hur länge och hur personen kan begära radering.

**Spara inte mer än du behöver.** Dataminimering är en grundprincip.

**Ha koll på var uppgifterna finns.** Vilka system lagrar personuppgifter? CRM, e-post, bokföring, Google Drive.

**Hantera begäranden från registrerade.** Om en person ber dig radera deras uppgifter har du en månad på dig att svara.

## Vad du troligen inte behöver göra

- Utse ett dataskyddsombud (DPO) — krävs bara för större organisationer
- Ha ett massivt dokumentationssystem — en enkel lista räcker
- Betala en GDPR-konsult — om du driver typisk konsult- eller frilansbusiness räcker denna guide och en enkel integritetspolicy

## Praktiska åtgärder

1. Skriv en integritetspolicy och publicera den på din webbplats
2. Gör en enkel inventering av vilka personuppgifter du har och var de finns
3. Kontrollera att dina leverantörer är GDPR-kompatibla
4. Ha ett svar redo om någon frågar om sina uppgifter`,
    faqs: [
      { q: "Gäller GDPR även mig om jag bara har tio kunder?", a: "Ja. GDPR gäller alla som behandlar personuppgifter professionellt. Men kraven är proportionerliga — en enkel integritetspolicy och grundläggande ordning räcker." },
      { q: "Behöver jag samtycke för att skicka nyhetsbrev?", a: "Ja, för marknadsföringsutskick till privatpersoner krävs samtycke. För B2B-kommunikation kan berättigat intresse räcka." },
      { q: "Vad händer om jag bryter mot GDPR?", a: "IMY kan utfärda reprimander och böter. För en soloföretagare som gjort ett oavsiktligt misstag och samarbetar är konsekvenserna vanligtvis mildare." },
      { q: "Får jag använda Google Drive?", a: "Ja, med rätt avtalsbas. Google har standardavtalsklausuler som uppfyller EU:s krav. Kontrollera att du accepterat dem via Google Workspace-inställningarna." },
      { q: "Hur länge får jag spara kunduppgifter?", a: "Uppgifter ska inte sparas längre än nödvändigt. Bokföringsregler kräver att du sparar underlag i sju år. Marknadsföringskontakter: radera när relationen är avslutad." },
    ],
    updatedAt: "2026-06-12",
    readingTimeMinutes: 7,
    category: "juridik",
    categoryLabel: "Juridik",
  },

  {
    id: "guide-10",
    slug: "anstalla-guide",
    title: "Första anställningen — allt du behöver veta",
    intro: "Att anställa för första gången är ett av de viktigaste stegen i ett litet bolags tillväxt — och ett av de mest komplexa administrativt. Den här guiden ger dig en konkret genomgång av allt från arbetsgivarregistrering till anställningsavtal och de vanligaste fallgroparna.",
    body: `## Innan du anställer

Ställ dig två frågor:

**Är det en anställning eller en konsultrelation?** Om du anlitar en person regelbundet, kontrollerar hur och när arbetet utförs, och personen saknar andra uppdragsgivare — kan det betraktas som anställning oavsett hur ni kallar det. Skatteverket granskar detta aktivt.

**Är det ekonomiskt hållbart?** En anställd kostar mer än bruttolönen. Arbetsgivaravgifter (31,42 %), semesterlön (ca 12 %), sjuklön dag 2–14. Räkna med att en anställd kostar ca **1,5 × bruttolönen** i totalkostnad.

## Registrering som arbetsgivare

Registrera dig via Skatteverkets e-tjänster eller blankett SKV 4620. Gratis, tar normalt en till två veckor.

## Anställningsavtalet

Du är skyldig att lämna skriftligt anställningsavtal senast en månad efter anställningens start. Det ska innehålla: parternas identitet, tjänstebeteckning, startdatum, lön, arbetstid, semester, uppsägningstid.

## Lön och AGI

Betala lön månadsvis. Senast den 12:e månaden efter utbetalningsmånaden lämnar du AGI (arbetsgivardeklaration) och betalar in arbetsgivaravgifter och preliminärskatt.

Använd ett löneprogram: Fortnox Lön, Visma Lön eller Hogia beräknar allt automatiskt.

## Semester

Alla anställda har rätt till 25 dagars betald semester per år. Semesterlönen är minst 12 % av bruttolönen.

## Sjuklön

Du betalar sjuklön dag 2–14 — minst 80 % av lönen. Från dag 15 tar Försäkringskassan över.

## Uppsägning och LAS

Provanställning (max 6 månader) kan avslutas utan sakliga skäl under prövotiden. Fast anställning kräver sakliga skäl. Felaktiga uppsägningar är kostsamma — konsultera en arbetsrättsjurist innan du agerar.`,
    faqs: [
      { q: "Vad kostar en anställd mig totalt?", a: "Ca 1,5 × bruttolönen. En person med 35 000 kr i bruttolön kostar ca 52 000 kr/mån inklusive arbetsgivaravgifter, semesterlön och sjuklöneansvar." },
      { q: "Måste jag ha kollektivavtal?", a: "Nej, det är frivilligt. Men att följa villkoren i det relevanta branschavtalet är god praxis." },
      { q: "Kan jag anställa på provanställning?", a: "Ja, max sex månader. Under provanställningen kan du avsluta utan sakliga skäl — men du måste underrätta den anställde två veckor i förväg." },
      { q: "Behöver jag ha ett löneprogram?", a: "Starkt rekommenderat. Det kostar 100–300 kr/mån och sparar dig mångfalt mer i tid och felkorrigering." },
      { q: "Vad händer om jag behöver säga upp en anställd?", a: "Uppsägning av fast anställning kräver sakliga skäl. Konsultera en arbetsrättsjurist tidigt i processen — felaktiga uppsägningar kan leda till skadestånd." },
    ],
    updatedAt: "2026-06-14",
    readingTimeMinutes: 8,
    category: "organisation",
    categoryLabel: "Organisation",
  },

  {
    id: "guide-11",
    slug: "digital-marknadsforing-guide",
    title: "Digital marknadsföring för soloföretagare",
    intro: "Du behöver inte ett stort marknadsföringsbudget för att nå rätt kunder digitalt. Den här guiden ger dig en konkret genomgång av de kanaler och metoder som faktiskt fungerar för soloföretagare med begränsad tid och budget.",
    body: `## Utgångspunkten: var finns dina kunder?

Innan du väljer kanal — förstå var dina idealkunder söker efter det du erbjuder.

En konsult mot stora bolag hittar sina kunder på LinkedIn. En grafisk designer mot startups hittar dem kanske på Instagram. En lokal hantverkare via Google Maps och sökmotorer.

Välj en till två kanaler baserat på var dina kunder faktiskt är — inte vad som är trendigast.

## SEO — kanalen som ger avkastning länge

En väloptimerad webbplats kan ge dig inkommande leads utan löpande kostnad i månader och år.

**Grunderna:**
- Tydlig titel och meta-beskrivning på varje sida
- En klar "Vad jag gör"-sida skriven i kundens språk
- Lokal SEO om du jobbar geografiskt (Google Business Profile)
- Artiklar och guider som svarar på frågor dina kunder ställer i sökmotorer

## LinkedIn — för B2B-tjänster

Om dina kunder är företag och du inte är aktiv på LinkedIn missar du den mest effektiva B2B-kanalen i Sverige.

Det kräver inte dagliga inlägg:
- En välformulerad profil med rubrik som beskriver vad du gör och för vem
- En till tre inlägg per vecka med kunskap och perspektiv
- Aktiv nätverksbyggnad — koppla med kunder och relevanta kontakter

## E-postmarknadsföring — undervärderat och effektivt

Ett nyhetsbrev till relevanta kontakter är en av de mest kostnadseffektiva kanalerna. Du kontrollerar listan. Algoritmer påverkar inte räckvidden.

Kom igång med Mailchimp eller Brevo — gratisversioner räcker initialt. Månadsvis är tillräcklig frekvens. Ge värde, sälj inte.

## Google Ads och Meta Ads

Betald annonsering ger snabb synlighet men kostar löpande. Värt det om du kan beräkna en lönsam kostnad per kund och har ett tydligt konverteringsmål.

Starta inte betald annonsering utan en månads testbudget och ett klart mål.

## Prioritering med begränsad tid

Välj en primär kanal och gör den ordentligt. Halvdan närvaro på fem kanaler är sämre än stark närvaro på en.

För de flesta soloföretagare i B2B: **LinkedIn + bra webbplats med grundläggande SEO** ger mest avkastning per investerad timme.`,
    faqs: [
      { q: "Behöver jag vara aktiv på sociala medier?", a: "Nej — men du behöver finnas. En välunderhållen LinkedIn-profil och bra webbplats räcker som minimumnivå." },
      { q: "Hur mycket bör jag lägga på marknadsföring?", a: "En vanlig riktlinje är 5–10 % av omsättningen. Viktigast är att kunna mäta vad du får tillbaka." },
      { q: "Behöver jag en webbplats eller räcker LinkedIn?", a: "Bägge fyller olika funktioner. En webbplats ger dig kontroll och synlighet i sökmotorer. LinkedIn ger synlighet i ett professionellt nätverk." },
      { q: "Hur lång tid tar det att se resultat från SEO?", a: "SEO-resultat syns vanligtvis efter tre till sex månader. Börja tidigt och var konsekvent." },
      { q: "Vad ska jag posta om?", a: "Svara på frågor du får ofta från kunder och potentiella kunder. Varje vanlig fråga är ett potentiellt inlägg eller en artikel." },
    ],
    updatedAt: "2026-06-14",
    readingTimeMinutes: 7,
    category: "marknadsforing",
    categoryLabel: "Marknadsföring",
  },

  {
    id: "guide-12",
    slug: "aktiebolag-guide",
    title: "Aktiebolag eller enskild firma — vad ska du välja?",
    intro: "Valet av bolagsform påverkar din skatt, ditt personliga ansvar och hur du kan ta ut pengar ur bolaget. Den här guiden jämför enskild firma och aktiebolag för soloföretagare och ger dig ett konkret ramverk för att välja rätt.",
    body: `## Enskild firma

**Vad det är:** Du och firman är samma juridiska person.

**Fördelar:**
- Enkelt och billigt att starta (gratis, inget aktiekapitalkrav)
- Enklare redovisning och lägre administrationskostnad
- Alla vinster beskattas direkt som inkomst

**Nackdelar:**
- Personligt ansvar för alla bolagets skulder — du betalar med privata tillgångar om firman inte kan betala
- Begränsade möjligheter att optimera skatten

**Passar för:** soloföretagare i tidigt skede, låg risk, omsättning under ca 300 000–500 000 kr/år.

## Aktiebolag

**Vad det är:** En separat juridisk person från dig som ägare.

**Fördelar:**
- Begränsat personligt ansvar
- Möjlighet att optimera skatten via 3:12-reglerna (lön + utdelning)
- Mer professionellt intryck mot större kunder
- Lättare att ta in delägare

**Nackdelar:**
- Kräver 25 000 kr i aktiekapital
- Mer administration: årsredovisning, bolagsstämma, mer komplex bokföring

**Passar för:** omsättning över 400 000–600 000 kr/år, verksamhet med risk för skulder, planer på anställda eller delägare.

## Skattejämförelsen

Det finns ingen universell punkt där aktiebolag alltid är skattemässigt bättre. Det beror på din totala inkomst, om du vill reinvestera vinster och din kommunalskatt.

**Grundregel:** under ca 500 000 kr i omsättning och om du tar ut all vinst som lön är enskild firma ofta enklare och inte skattemässigt sämre. Över den nivån börjar aktiebolagets fördelar väga tyngre.

Konsultera en redovisningskonsult för en beräkning baserad på dina faktiska siffror.

## 3:12-reglerna kortfattat

Aktiebolagsägare som arbetar i sitt bolag kan ta ut dels lön (beskattas som tjänsteinkomst), dels utdelning inom gränsbeloppet (beskattas med 20 % statlig skatt). Gränsbeloppet för 2026 via schablonmetoden är ca 209 000 kr.`,
    faqs: [
      { q: "Hur mycket aktiekapital krävs?", a: "Sedan 2020 är minimikravet 25 000 kronor. De flesta startar med exakt det beloppet." },
      { q: "Måste jag ha revisor?", a: "Nej, om du uppfyller minst två av tre kriterier för litet bolag: färre än 3 anställda, balansomslutning under 1,5 mkr, nettoomsättning under 3 mkr." },
      { q: "Vad innebär personligt ansvar i enskild firma?", a: "Om firman har skulder den inte kan betala ansvarar du med dina privata tillgångar. För konsulter och frilansare med låg skuldrisk är det sällan ett praktiskt problem." },
      { q: "Kan jag byta från enskild firma till aktiebolag?", a: "Ja, men det kräver planering — du startar ett nytt aktiebolag och överlåter verksamheten dit. Gör det vid rätt tidpunkt i räkenskapsåret med stöd av din redovisningskonsult." },
      { q: "Vilken bolagsform är mest professionell mot stora kunder?", a: "Aktiebolag uppfattas generellt som mer professionellt. Vissa upphandlingsregler kräver eller föredrar aktiebolag." },
    ],
    updatedAt: "2026-06-16",
    readingTimeMinutes: 7,
    category: "organisation",
    categoryLabel: "Organisation",
  },

  {
    id: "guide-13",
    slug: "foretagskonto-guide",
    title: "Bästa företagskontot 2026 — vad du ska titta på",
    intro: "Att ha ett separat företagskonto är grundläggande infrastruktur. Den här guiden ger dig en genomgång av vad du ska titta på när du väljer, skillnaderna mellan de stora alternativen och de vanligaste fällorna.",
    body: `## Varför du behöver ett separat konto

Det är inte ett krav för enskild firma — men det är starkt rekommenderat.

**Bokföring.** Att blanda privata och affärsmässiga transaktioner gör bokföringen avsevärt mer komplicerad.

**Trovärdighet.** Fakturering från ett konto med bolagsnamnet ser mer professionellt ut.

**Skatter.** Blandar du privat och företag riskerar du att Skatteverket ifrågasätter vilka transaktioner som är affärsmässiga.

För aktiebolag är det ett krav att ha ett separat konto i bolagets namn.

## Vad du ska titta på

- **Månadsavgift** — från gratis till 300+ kr/mån
- **Transaktionsavgifter** — viktigt om du har många fakturor
- **Integrationer mot bokföring** — kan kontot kopplas mot Fortnox eller Bokio?
- **Tillgång till kredit** — checkkredit som likviditetsbuffert
- **Kundservice** — hur snabbt kan du nå banken?

## Alternativkategorier

**Traditionella storbanker (SEB, Handelsbanken, Swedbank, Nordea)**
Höga månadsavgifter men bra personlig service och kreditfaciliteter. Passar bolag som behöver en bankrelation.

**Onlinebanker (Revolut Business, Qonto)**
Lägre avgifter, snabb onboarding, bra appar. Begränsad personlig service. Passar soloföretagare som prioriterar kostnad.

**Fintechkonton (Bokio Bank, Pleo)**
Designade för att integreras med bokföring. Bra för den som vill automatisera administrationen.

## Praktiska råd

Öppna kontot innan du börjar fakturera — bankprocessen kan ta en till tre veckor.

Ha ett separat sparkonto för skatter. Flytta 40–45 % av varje inbetalning dit direkt.

Koppla kontot mot ditt bokföringsprogram från dag ett.`,
    faqs: [
      { q: "Kan jag använda mitt privata konto för enskild firma?", a: "Det är tillåtet men starkt avrådd. Det gör bokföringen svårare och ser mindre professionellt ut." },
      { q: "Hur lång tid tar det att öppna ett företagskonto?", a: "Onlinebanker kan godkänna på en till tre dagar. Storbanker tar ofta en till tre veckor." },
      { q: "Behöver jag ett separat sparkonto för skatterna?", a: "Det krävs inte av lagen, men det är ett av de bästa ekonomiska vanorna du kan bygga. Flytta skattepengarna direkt när de kommer in." },
      { q: "Är Revolut Business ett bra alternativ?", a: "Populärt för låga avgifter och smidiga valutaväxlingar. Passar framför allt de som fakturerar internationellt. Begränsad kreditfacilitet." },
      { q: "Vilka banker integrerar bäst med Fortnox?", a: "Fortnox har officiella kopplingar mot SEB, Handelsbanken, Swedbank, Nordea och flera onlinealternativ. Kontrollera på Fortnox webbplats för aktuell lista." },
    ],
    updatedAt: "2026-06-18",
    readingTimeMinutes: 6,
    category: "ekonomi",
    categoryLabel: "Ekonomi",
  },

  {
    id: "guide-14",
    slug: "prissattning-strategi-guide",
    title: "Prissättningsstrategi — från timtaxa till värdebaserat pris",
    intro: "De flesta egenföretagare sätter sitt pris baserat på vad de tror marknaden accepterar. Det är ett strategiskt misstag. Den här guiden ger dig ett ramverk för att tänka kring prissättning på ett sätt som stärker din position och din lönsamhet.",
    body: `## De tre modellerna

**Timtaxa** — du tar betalt per nedlagd timme. Enkelt att kommunicera, men dina intäkter är direkt begränsade av dina tillgängliga timmar.

**Projektpris** — fast pris för ett definierat uppdrag. Ger möjlighet att tjäna mer per timme om du är effektiv, men kräver god förmåga att bedöma scope.

**Värdebaserat pris** — priset baseras på det värde du skapar för kunden, inte din nedlagda tid. Högst potential, men kräver djup förståelse för kundens situation.

De flesta rör sig naturligt från timtaxa via projektpris mot värdebaserat pris när erfarenhet och position stärks.

## Varför timtaxan har inbyggda begränsningar

Din timtaxa multiplicerar dina tillgängliga timmar. Det är ett tak.

Den skapar också ett perverst incitament: du tjänar mer om du jobbar ineffektivt. Det är inte en modell som premierar det du faktiskt vill att kunder ska uppleva.

## Projektprismodellen

Projektpris kräver att du kan:
- Bedöma scope noggrant
- Hantera scope-kryp (kunder som lägger till utan att betala extra)
- Uppskatta tidsåtgång pålitligt

Internt: estimera timmar, multiplicera med timtaxa, lägg på marginal. Det är ditt projektpris.

## Värdebaserat pris

Utgångspunkten: vad är det värt för kunden att ha det här problemet löst?

En konsult som hjälper ett bolag spara 500 000 kr/år kan ta 150 000–200 000 kr för uppdraget — även om tidsåtgången hade motsvarat 80 000 kr i timtaxa.

Det kräver:
- Förmåga att kvantifiera värdet du skapar
- Kunder som tänker i ROI, inte kronor per timme
- En tydlig position — om du uppfattas som utbytbar är det svårt att ta värdebaserat pris

## Att höja priset

Tecken på att du är underprissatt:
- Kunder accepterar utan att förhandla
- Du har fler förfrågningar än kapacitet
- Du levererar konsekvent mer än avtalat

Höj priset för nya kunder. Ge befintliga 60 dagars varsel. Förvänta dig att de flesta stannar.`,
    faqs: [
      { q: "Hur vet jag om jag är underprissatt?", a: "Om kunder accepterar utan att förhandla och du har mer efterfrågan än kapacitet — är det tecken på att marknaden bär ett högre pris. Test: höj med 20 % på nästa offert." },
      { q: "Ska jag visa pris på min webbplats?", a: "Det beror på modellen. För standardtjänster kan prisvisning kvalificera leads. För komplexa uppdrag kan det begränsa dig. Båda fungerar — välj medvetet." },
      { q: "Vad gör jag om en kund säger att min konkurrent är billigare?", a: "Fråga vad de jämför. Är det verkligen jämförbart? Svara med värdet. Om de ändå väljer på pris — det är inte din kund." },
      { q: "Kan jag ha olika priser för olika kunder?", a: "Ja, och det är normalt. Det viktiga är att du vet ditt lägstpris och aldrig underskrider det." },
      { q: "Hur kommunicerar jag en prishöjning?", a: "Direkt, i god tid, utan övertydlig ursäkt. Minst 60 dagars varsel för löpande uppdrag. Du behöver inte motivera varje krona." },
    ],
    updatedAt: "2026-06-20",
    readingTimeMinutes: 7,
    category: "prissattning",
    categoryLabel: "Prissättning",
  },

  {
    id: "guide-15",
    slug: "kundavtal-guide",
    title: "Kundavtal som skyddar dig — klausuler du inte får missa",
    intro: "Ett kundavtal är din viktigaste juridiska skyddsåtgärd. Den här guiden ger en djupgående genomgång av de klausuler som verkligen spelar roll — inte bara vad de heter, utan vad de gör för dig i praktiken.",
    body: `## Scope-klausulen — den viktigaste av alla

Scope-klausulen definierar vad du ska göra. Det är den klausul som förhindrar de flesta tvister — och som oftast är för vag.

**Vag scope:** "Kommunikationsstöd och rådgivning."

**Tydlig scope:** "Produktion av fyra LinkedIn-inlägg per månad (400–600 ord per inlägg), levererade i Google Docs senast den 20:e varje månad. Inklusive upp till två revideringsrundor per inlägg. Exklusive bildproduktion och publicering."

Specificera alltid vad som *inte* ingår.

## Betalningsklausulen

Ange tydligt:
- Betalningsvillkor: 30 dagar netto är standard
- Dröjsmålsränta: referensräntan plus åtta procentenheter (lagstadgad)
- Påminnelseavgift: 60 kr per påminnelse
- Om förskottsbetalning gäller: procent och tidpunkt

*"Vid utebliven betalning äger Leverantören rätt att hålla inne fortsatt arbete tills full betalning erlagts."*

## Immateriella rättigheter

*"Alla rättigheter till levererat material överlåts till Kunden vid full betalning. Till dess innehas alla rättigheter av Leverantören."*

Det ger dig ett reellt hävstång om betalning uteblir.

## Ansvarsbegränsningsklausulen

*"Leverantörens ansvar är begränsat till det belopp Kunden erlagt under de tre månader som föregår den skadeståndsgrundande händelsen. Leverantören ansvarar ej för indirekta skador, utebliven vinst eller följdskador."*

## Konfidentialitet

*"Parterna förbinder sig att inte röja konfidentiell information som erhållits i samband med detta avtal. Skyldigheten kvarstår i två år efter avtalets upphörande."*

## Uppsägningsklausulen

*"Avtalet kan sägas upp av endera parten med 30 dagars skriftlig varsel. Vid förtida uppsägning från Kundens sida är Kunden skyldig att ersätta Leverantören för utfört arbete fram till upphörandedatumet."*

## Tvistelösning

*"Tvister avgörs av allmän domstol med [din hemort] tingsrätt som första instans, med tillämpning av svensk lag."*`,
    faqs: [
      { q: "Hur juridiskt bindande är ett avtal via mejl?", a: "Juridiskt bindande om parterna tydligt accepterat villkoren. För uppdrag av högt värde — använd digital signering via BankID eller DocuSign." },
      { q: "Ska jag ha samma avtal för alla kunder?", a: "Ha en mall, men anpassa scope-delen för varje uppdrag. Vaga scope-formuleringar är den vanligaste källan till konflikter." },
      { q: "Vad gör jag om kunden vill ändra mina villkor?", a: "Diskutera konkret vad de vill ändra och varför. Var försiktig med ändringar som tar bort ansvarsbegränsning eller utökar scope utan priskompensation." },
      { q: "Behöver jag en separat NDA?", a: "Om din sekretessklausul i kundavtalet är tydlig räcker den vanligtvis. En separat NDA är vanlig när du delar känsliga idéer innan avtal är tecknat — exempelvis vid en pitchprocess." },
      { q: "Hur hanterar jag avtal med större bolag?", a: "Stora bolag presenterar ibland egna leverantörsavtal. Läs dem noga. Vanliga problempunkter: obegränsat ansvar och immateriella rättigheter utan betalningsvillkor. Du kan förhandla." },
    ],
    updatedAt: "2026-06-22",
    readingTimeMinutes: 8,
    category: "juridik",
    categoryLabel: "Juridik",
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function getGuidesByCategory(category: GuideCategory): Guide[] {
  return GUIDES.filter((g) => g.category === category);
}

export const CATEGORY_COLORS: Record<GuideCategory, string> = {
  skatt: "bg-amber-100 text-amber-800",
  prissattning: "bg-emerald-100 text-emerald-800",
  juridik: "bg-blue-100 text-blue-800",
  marknadsforing: "bg-purple-100 text-purple-800",
  organisation: "bg-rose-100 text-rose-800",
  ekonomi: "bg-sky-100 text-sky-800",
};
