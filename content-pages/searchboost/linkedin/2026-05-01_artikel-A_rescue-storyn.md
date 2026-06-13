# LinkedIn-artikel A — Räddningsstoryn

**Skapad:** 2026-05-01
**Plattform:** LinkedIn (Searchboost Company Page)
**Format:** Long-form artikel (~700 ord)
**Vinkel:** Case study som bygger trovärdighet + visar teknisk djup

---

## Titel
36 timmar i kontrollrummet — så räddade vi en svensk e-handel från en casino-malware-attack

## Body

Klockan var fredag eftermiddag när larmet kom. En e-handelssajt vi förvaltar hade fått in ett intrång genom en öppen MySQL-port hos den gamla webbhotellet. Sajten började på tio minuter producera URL:er om casinospel, online-poker och sportsbook — på en sajt som säljer scenpodier till eventbolag.

Det här är en berättelse om hur 2026 års intrång ser ut, och varför vi inte tittade på Wordfence när larmet kom.

**Vad attacken gjorde**

På sex timmar genererade angriparen drygt tjugotusen skadliga objekt i databasen. Varje objekt var en helt valid WordPress-post med casino-content, intern länk-struktur och egen meta-beskrivning. För Google såg det ut som att sajten bytte affärsidé. Position på relevanta sökord började droppa med flera placeringar i timmen — inte för att rankings ändrades, utan för att domänklassificeringen ändrades.

När en sajt har casino-relaterade URL:er som utgör nittio procent av indexerade sidor händer två saker varje dag: Google börjar omklassificera domänen som spam- eller gambling-relaterad, och relevanta sökord tappar position med 1-3 placeringar per dygn. Tio dagars intrång hade kostat fyra månader av återuppbyggnadsarbete.

**Det vi inte gjorde**

Vi installerade inte ett extra säkerhetsplugin. Vi körde inte en virusscan. Vi öppnade inte ett ärende hos webbhotellet och väntade.

**Det vi gjorde**

Tre paralella spår på 36 timmar:

Spår 1 — Migration. Hela sajten flyttades från det gamla webbhotellet till Loopia under en natt. DNS-cutover klar 15:00 lördag.

Spår 2 — Iterativ databassanering. Åtta dump-cykler. Varje cykel: dump → sanering → restore → ny scan. Totalt 20 000 skadliga objekt borttagna. Det här är inte ett SQL-statement man kör en gång — det är en operation där varje sanering avslöjar nya skadliga relationer.

Spår 3 — Konto-arkeologi. Vi gick igenom samtliga åtkomstlager: WordPress-admins, WooCommerce.com-integrationer, PayPal-gateway, Google Search Console-ägare, hårdkodade HTML-verifieringar, plugin-kopplingar. Hittade fyra obehöriga kollaboratörskonton från en gammal partnerstruktur som aldrig städats bort. Det var DEN angreppsytan som räknades — inte den synliga.

**Vad det visar**

Två saker.

Det första: moderna intrång är affärsmodellsattacker, inte sajtintrång. Angriparen ville inte bryta sajten. Hen ville använda dess auktoritet för att indexera in casino-länkar. Tekniskt enkelt, ekonomiskt brutalt.

Det andra: en SEO-byrå 2026 måste kunna hantera detta. Inte bara skriva blogposter och optimera meta. Den dag du flyttar en kund från en kompromissad miljö under tidspress är de detaljer som spelar roll: kan du köra åtta databasdumpar i rad utan att tappa data, kan du uppdatera DNS utan downtime, kan du svara Google snabbt nog att de inte hinner omklassificera domänen.

**Resultatet**

Sajten är ren, migrerad, indexeringsbegärd. Casino-URL:erna returnerar 404 och försvinner ur Googles index. De fyra obehöriga partnerkontona är avvecklade. Sajten har för första gången på flera år en helt egen teknisk stack.

Kunden fick en 11-sidig forensisk rapport på söndag kväll. Den dokumenterar varje åtgärd, varje fynd, varje åtkomst som stängdes. Sånt skriver man inte med ett säkerhetsplugin.

Det här är vad SEO-arbete har blivit. Och varför vi sover dåligt om en kund frågar om vi har 24/7-jour.

#SEO #WordPress #informationsäkerhet #digitalstrategi
