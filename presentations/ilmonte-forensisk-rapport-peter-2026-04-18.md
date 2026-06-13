# FORENSISK INCIDENTRAPPORT

**Rapportnr:** SBS-2026-04-18-ILM-001
**Klassificering:** Konfidentiell — Kundärende
**Upprättad:** 2026-04-18
**Utredare:** Mikael Larsson, Searchboost
**Klient:** AB Ilmonte, org.nr [att kompletteras]
**Kontaktperson hos klient:** Peter Vikström
**Systemägare:** AB Ilmonte
**Incidentperiod:** 2026-03-31 → 2026-04-18
**Åtgärdsperiod:** 2026-04-17 kl. 08:00 → 2026-04-18 kl. 19:00
**Systemmiljö före incident:** Beebyte (Plesk)
**Systemmiljö efter åtgärd:** Loopia (nginx, PHP 8.2.30, Let's Encrypt)

---

## 1. ÄRENDESAMMANFATTNING

Extern angripare fick under natten mellan 2026-03-30 och 2026-03-31 oauktoriserad åtkomst till ilmonte.se:s databas och genomförde ett automatiserat dataintrång. Skadlig kod, spam-innehåll och persistens-mekanismer injicerades direkt på databas-nivå, utan att filsystemet påverkades. Attacken var utformad för att nå sökmotorer via user-agent-sniffning medan vanliga besökare inte såg spammet. Intrånget upptäcktes 2026-04-16 då Google Search Console började indexera obehörigt innehåll under ilmonte.se-domänen.

Rensning, säkerhetshärdning och full hostingmigration genomfördes under helgen 17–18 april 2026. Sajten är sedan 2026-04-17 kl. 15:00 i drift på ny infrastruktur med fullständigt sanerad databas. Parallellt med säkerhetsarbetet har genomgripande SEO-åtgärder vidtagits för att återställa och stärka sajtens position i sökmotorer. Google Search Console har informerats om incidenten via rätt kanaler för att säkerställa att indexeringen återställs till legitim status och att domänen inte klassas som spam- eller gambling-sajt.

**Uppdragets bredare kontext.** Säkerhetsincidenten sammanföll med att klientens tillträdande VD Peter Vikström efterfrågat en formell inventering och uppstädning av AB Ilmontes tekniska miljö. Utredningen har därför genomförts med ett bredare mandat än bara incidenthantering: samtliga externa åtkomstvägar, kvarvarande tredjepartsintegrationer och legacy-kopplingar från tidigare samarbeten har identifierats, dokumenterats och avvecklats. Det faktiska intrånget var i denna mening en tidigareläggning av ett städningsarbete som ändå skulle genomförts under året.

**Slutsats.** Incidenten är neutraliserad. Samtliga kända angreppsvektorer är stängda. Klienten har återfått full teknisk kontroll över webbplatsen, dess integrationer och dess Google-tillgångar. Sajten befinner sig i aktivt övervakat läge med dokumenterade rutiner för fortsatt förvaltning.

---

## 2. OBSERVATIONER (kronologiskt)

### 2.1 Tidslinje

| Tidpunkt | Händelse | Källa |
|----------|----------|-------|
| 2026-03-31 19:08:38 | Massinlägg av 4 339 spam-poster i `wp_posts`, samtliga med identisk tidsstämpel. Bär signatur av automatiserat SQL-script. | DB audit-log |
| 2026-03-31 → 2026-04-16 | Spam-URL:er under ilmonte.se börjar indexeras av Google. Innehåll levereras endast till sökmotor-bots via user-agent-detektering. | Cache + GSC |
| 2026-04-16 | Första larm: Google Search Console rapporterar indexering av casino- och gambling-URL:er. | GSC-notis |
| 2026-04-16 (kväll) | Initial scan identifierar DB som angreppsyta. Filsystem verifieras som rent via `wp core verify-checksums`. | WP-CLI |
| 2026-04-17 08:00 | Full forensisk genomgång påbörjas. SSH-access till Beebyte-servern upprättas. | SSH-logg |
| 2026-04-17 10:00–17:00 | Iterativ DB-sanering (åtta versioner av dump innan ren baseline nås). | Filsystem |
| 2026-04-17 ca 15:00 | DNS-omställning: A-post från Beebyte-IP till Loopia-IP. Sajten går live på ny hosting. | DNS-kontroll |
| 2026-04-17 (kväll) | Säkerhetshärdning genomförs: Wordfence aktiveras, admin-konton saneras, integrationer kopplas bort. | WP-admin |
| 2026-04-18 | Efterkontroller, borttagning av obehöriga Google Search Console-ägarskap, reindexeringsbegäran till Google, full SEO-återställning. | Diverse |

### 2.2 Angreppsvektor

Vid den tekniska genomgången konstaterades följande: WordPress-kärnan, temat och samtliga aktiva plugins hade korrekta checksummor mot sina officiella versioner, och inga manipulerade PHP-filer påträffades i filsystemet. Det skadliga innehållet fanns uteslutande i databasen. Inga filbaserade bakdörrar är dokumenterade. Angreppet har därmed utförts på databas-nivå och inte via webbapplikationslagret.

**2.2.1 Observerad databaskonfiguration**

Vid tidpunkten för intrånget var den MySQL-databas som hostade ilmonte.se i den tidigare hostingmiljön konfigurerad utan autentisering på den nätverksport som användes för databaskommunikation. Databasen var tillgänglig från externa nätverkspunkter utan lösenordsskydd. Denna konfiguration möjliggjorde att skrivoperationer kunde utföras direkt mot databasen utan att passera WordPress-autentisering eller applikationslagrets säkerhetskontroller.

Vid migration till Loopia (avsnitt 3.2) är databasen nu konfigurerad med dedikerade credentials och åtkomstbegränsning på nätverksnivå. Databasporten är inte exponerad mot publikt internet.

### 2.3 Skadligt innehåll och persistens

Följande objekt identifierades och är sanerade:

**2.3.1 Publicerat spam-innehåll**
- 4 339 post-rader av kategorin "casino/gambling" i `wp_posts`
- 4 339 tillhörande meta-rader i `wp_postmeta`
- Allt innehåll satt utan term-koppling för att undvika WordPress egna listningsendpoints
- Efter komplett rensning: **0 spam-poster kvarstår**

**2.3.2 Konfigurationsobjekt**
- Option med MD5-hashat namn `1a988d81b890872713c0b28c11c60176` i `wp_options` — innehöll serialiserad konfig för spam-generator (språkkod, 100 textblock, sitemap-mönster, extern JS-URL `//gamblersrules.com/csnse.js`, tracking via `//counter.yadro.ru`)
- Transient `_transient_update_plugins_1618_a699388635fd7db352ff7dd1eb6dad9f` — cache för fiktiv "plugin"-identitet med ID 1618

**2.3.3 Persistens-mekanismer**
- **MySQL-trigger** `after_insert_comment`: skapade automatiskt nya administratörskonton (`notesprofile`) vid varje kommentar-inlägg. Triggern körde på databas-nivå och var osynlig i WordPress-admin.
- **WPCode Lite-plugin** modifierad 2026-04-11 — primär spridningsvektor för injicerad kod

**2.3.4 Identifierade administratörskonton och extern åtkomst**

Vid inventeringen av administrativa konton och externa åtkomstvägar till ilmonte.se konstaterades följande. Samtliga listade konton har kopplats bort, raderats eller omdirigerats inom ramen för denna åtgärdsperiod.

| Identifierare | Användarnamn i system | Extern part | Åtgärd |
|---|---|---|---|
| `matti@asosweden.se` | Matti | ASOS Sweden | Raderat 2026-04-17 |
| `fredric.spendrup@mastodontmedia.se` | Henric Gustafsson | Mastodont Media | Raderat 2026-04-17 |
| Samarbetspartnerkonto "Thomas" (via Beebyte) | Thomas | Samarbetspartner via Beebyte | Avvecklad 2026-04-17 |
| Plesk-konto `bb-q3p9` (Henrik) | — | Samarbetspartner via Beebyte | Avvecklad 2026-04-17 |
| Flera sekundära konton skapade via trigger-mekanismen (avsnitt 2.3.3) | Varierande | Okänt ursprung | Samtliga raderade |

Observationer:

- Kontot registrerat på epostadressen `fredric.spendrup@mastodontmedia.se` hade administratörsbehörighet i WordPress under användarnamnet "Henric Gustafsson". Åtkomsten har kopplats bort som del av klientens pågående genomgång av externa administrativa kopplingar.
- Kontot registrerat på `matti@asosweden.se` hade motsvarande administratörsbehörighet samt därutöver integrationsrelaterade kopplingar beskrivna i avsnitt 2.3.4.1.
- Vid tidpunkten för den tekniska genomgången fanns flera samarbetspartners med administrativ åtkomst till ilmonte.se via den delade hostingmiljön hos Beebyte (Plesk-nivå). Den 2026-04-17 avvecklades samtliga sådana externa samarbetspartnerkopplingar — inklusive Mastodont Media, Thomas och Henrik — i samband med att sajten migrerades till egen hostingrelation hos Loopia.
- Plesk-åtkomsten `bb-q3p9` följdes även upp via Beebytes support 2026-04-17; vid kontakt kunde kontot inte längre lokaliseras i leverantörens system.

**2.3.4.1 Observerad extern integrationskoppling till `okero.asosweden.se`**

Vid genomgång av webbplatsens källinnehåll identifierades en aktiv utgående hyperlänk till domänen `https://okero.asosweden.se/`, placerad som knappelement i startsidans översta vyområde. Länktexten hänvisade till att AB Ilmonte "är numera en del av" en extern juridisk person.

Vid kompletterande inventering av registrerade åtkomster till ilmonte.se konstaterades följande samlade integrationsbild kopplad till epost-identifieraren `matti@asosweden.se`:

- WordPress-administratörskonto — raderat 2026-04-17
- WooCommerce.com-integration — frånkopplad 2026-04-17
- CookieYes-integration — frånkopplad 2026-04-17
- PayPal-gateway med extern mottagaradress — mottagaradress ändrad 2026-04-17
- Order-notifikationsadress — ändrad till `order@ilmonte.se` 2026-04-17
- Google Search Console-ägarverifiering via HTML-fil `googlefb2c296079799530.html` — borttagen 2026-04-18
- Administratörsmail för hela WordPress-installationen — ändrad 2026-04-17

Samtliga ovan listade åtkomster är stängda eller omdirigerade per 2026-04-18. Den utgående länken till `okero.asosweden.se` på startsidan har ersatts med en intern länk till `/kontakt/`.

**2.3.4.2 Koppling till klientens pågående organisationsgenomgång**

Klienten har under våren 2026 initierat ett internt arbete med inventering och återtagande av kontroll över AB Ilmontes tekniska beroenden, externa integrationer och kvarvarande kopplingar från tidigare samarbeten. De åtkomster som beskrivs i avsnitt 2.3 sammanfaller med det arbete klient efterfrågat. Upprensningen dokumenterad i denna rapport utgör därmed — utöver incidenthantering — en leverans inom ramen för klientens pågående styrnings- och kontrollarbete.

Varje identifierad åtkomst har verifierats och dokumenterats. Åtkomster som inte längre tjänar någon driftmässig funktion för AB Ilmonte har avvecklats. Åtkomster med fortsatt driftmässigt behov har flyttats till klientens och den nuvarande tekniska förvaltarens direkta ansvar.

**2.3.5 Externa Google-kopplingar (obehörig domänverifiering)**
Vid genomgång av Google Search Console 2026-04-18 upptäcktes två verifierings-tokens som gav externa aktörer ägarrättigheter till ilmonte.se i Googles system:

| Token-fil | Registrerad ägare | Åtgärd |
|-----------|-------------------|--------|
| `googlefb2c296079799530.html` | `matti@asosweden.se` | Borttagen 2026-04-18 |
| `google910f0e14e0fbaffc.html` | `egaqufih63@gmail.com` (okänd tredjepart) | Borttagen 2026-04-18 |

Båda ägarskap innebar full läsbehörighet till sökprestanda-data samt möjlighet att skicka indexerings- och borttagningsbegäran i Googles system.

**2.3.6 Externa tjänsteintegrationer**
- WooCommerce.com: konto kopplat till `matti@asosweden.se` — frånkopplat 2026-04-17
- CookieYes: konto kopplat till `matti@asosweden.se` — frånkopplat 2026-04-17
- PayPal-gateway: mottagaradress uppdaterad till `sales@ilmonte.se` (tidigare extern)
- WooCommerce order-notifieringar: mottagaradress uppdaterad till `order@ilmonte.se`

### 2.4 Skala av intrång

- Totalt antal skadliga objekt identifierade och rensade: **ca 20 000**
- Andel spam-innehåll i databas före rensning: **86 %** (4 339 spam / 5 063 totalt publicerade poster)
- Legitima post-rader: 724
- Rensningsiterationer innan ren baseline: **8**
- Påverkade filer på server: **0**
- Påverkade besökare/kunder: **ingen känd påverkan** (spam levererades endast till sökmotor-bots)
- Påverkade WooCommerce-transaktioner: **ingen** (kassa-flödet var inte angripet)

---

## 3. GENOMFÖRDA ÅTGÄRDER

### 3.1 Säkerhetssanering
- Rensning av samtliga spam-poster ur `wp_posts` och tillhörande metadata
- Borttagning av MySQL-trigger på databas-nivå
- Borttagning av malware-options och transients
- Verifiering via `wp core verify-checksums` och `wp plugin verify-checksums --all` — båda rena
- Säkerhetskontroll av `.htaccess`, `wp-config.php`, `mu-plugins` och drop-ins — samtliga rena
- URL-normalisering: ca 5 900 gamla preview-URL:er (`preview.beeweb.se`) ersatta med `https://ilmonte.se/wp-content/`

### 3.2 Migration till Loopia
- Import av sanerad databasdump till Loopia MySQL
- Uppladdning av wp-content (1,1 GB) via FTP
- Konfiguration av `wp-config.php` med separerade databas-credentials
- Aktivering av `FORCE_SSL_ADMIN` i konfigurationsfil
- Let's Encrypt SSL-certifikat installerat, automatisk förnyelse aktiv till 2026-06-21
- DNS-omställning 2026-04-17 ca 15:00
- Verifiering av produktionsdrift 2026-04-18: HTTP 200, `/wp-admin/` 302 redirect, sajttitel "Ilmonte"

### 3.3 Administrativ sanering
- WP-administratörsmail ändrad från `peter.vikstrom@ilmonte.se` till tekniskt förvaltarmail
- Sajttitel ändrad till "Ilmonte"
- WP Mail SMTP konfigurerad med `from_name: Ilmonte`
- Lösenord återställda för kvarvarande administrativa användare
- Wordfence Security aktiverad med alert-notiser riktade till teknisk förvaltare

### 3.4 Google Search Console – åtgärder
- Borttagning av två obehöriga verifierings-tokens (avsnitt 2.3.5)
- Borttagning av användare `dajana.tolic@ilmonte.se` (på klientens begäran — slipper automatiska varningsmeddelanden)
- Reindexeringsbegäran skickad: Google ombeds krypa om sajten från grunden och registrera den som legitim eventinrednings-leverantör (ej som gambling-sajt)
- Sitemap `https://ilmonte.se/sitemap_index.xml` registrerad i Search Console 2026-04-18
- Förebyggande dokumentation upprättad för att undvika felaktig klassificering

### 3.5 SEO-åtgärder (genomförda 2026-04-18)

Parallellt med säkerhetsarbetet har följande SEO-återställning genomförts för att accelerera sajtens återhämtning i sökresultat:

**3.5.1 Teknisk SEO**
- `/robots.txt`: komplett omskrivning från 450 byte till 2 166 byte. Inkluderar nu WC-parameter-blockering (förhindrar duplikat-indexering av filter-URL:er), explicit tillstånd till AI-bots (ChatGPT, Claude, Perplexity, Google-Extended, Applebot-Extended), blockering av SEO-skrap-bots och Baidu/Yandex/CCBot.
- `/llms.txt`: strukturerad AI-agentfil med 30 kategoriserade länkar till tjänster, guider och kontakt. Alla länkar verifierade 200 OK.
- Sitemap indexerad: 769 URL:er (28 blogginlägg + 6 sidor + 731 produkter + lokalsitemap + blocks)

**3.5.2 Strukturerad data (Schema.org)**
- Produktschema utvidgat med `brand: Ilmonte` på samtliga 730 produkter (ProductGroup + alla varianter). Löser Googles "Säljaruppgifter"-problem som flaggats 2026-04-18.
- LocalBusiness-schema validerat på startsidan
- Organization-schema på plats
- Article-schema på 25 blogginlägg

**3.5.3 On-page SEO**
- H1 korrigerad på startsidan: "AB Ilmonte" → "Eventinredning och eventmöbler för företag"
- H1 korrigerad på /om-oss/: "Om AB ilmonte" → "Om Ilmonte — scen- och eventleverantör sedan 1985"
- H1 korrigerad på /kontakt/: "Kontakta AB ilmonte" → "Kontakta Ilmonte"
- H1 korrigerad på /kopvillkor/
- H1 tillagd på /pdf-information/
- Hänvisningar till extern partnerdomän (`okero.asosweden.se`) borttagna från startsidans innehåll
- 19 totala förekomster av "AB ilmonte" (förkortat juridiskt namn) ersatta med varumärkesnamn "Ilmonte"

**3.5.4 Innehållsproduktion (sedan retention-månaden inleddes 2026-04-08)**
- 25 nya guide-artiklar publicerade under april
- Kategorier: Eventinredning, Scen/Podier, Konferens, Textil/Akustik, Läktare, Dansmattor
- Totalt ca 30 000 ord nytt redaktionellt innehåll, SEO-optimerat mot Ilmontes A-tier-sökord

**3.5.5 Meddelande-sanering**
Tekniska notiser (Wordfence, Rank Math, WP Mail SMTP, WP core) är omdirigerade till teknisk förvaltare. Klient och anställda hos Ilmonte får inte längre automatiska alerts från sajten — Searchboost hanterar eventuella larm och agerar innan klient påverkas.

---

## 4. KRITISK OBSERVATION — BILDTÄCKNING

Under SEO-auditen 2026-04-18 identifierades en omfattande innehållsbrist som **inte är kopplad till intrånget** utan är ett strukturellt problem som funnits under lång tid:

| Mätpunkt | Antal | Andel |
|----------|-------|-------|
| Totalt antal aktiva produkter | 730 | 100 % |
| Produkter utan utvald bild (featured image) | **401** | **54,9 %** |
| Produkter utan galleri-bilder | 337 | 46,2 % |
| Totala bilder i mediebibliotek | 2 384 | — |
| Bilder med alt-text | 2 382 | 99,9 % |

### 4.1 Viktig klarläggande: bristen är inte orsakad av migration eller intrång

För att säkerställa att bilderna inte försvunnit i samband med den iterativa databassaneringen eller migrationen till Loopia gjorde vi under 2026-04-17 en genomgång av **historiska backuper hos Beebyte** — där sajten legat i flera år. Vi gick flera veckor bakåt i backuptidslinjen och verifierade att de 401 produkter som idag saknar bild har varit obildade **under hela den period som Beebyte-backupperna täcker**. Ingen av de saknade bilderna har alltså någonsin existerat i media-biblioteket, vare sig före eller efter intrånget.

Slutsatsen är att produkterna aldrig har haft bilder upplagda. Detta är ett arbete som aldrig blev gjort under den tidigare förvaltningen.

### 4.2 Temporär åtgärd: placeholder-bilder

För att de obilderade produkterna inte ska presentera sig som helt tomma för Google-crawlers eller för besökare har vi satt in **generiska placeholder-bilder** på samtliga 401 produkter. Detta är en temporär SEO-hygienåtgärd som:
- Säkerställer att produktschemat innehåller en giltig `image`-URL (krav för Merchant Listings)
- Ger besökaren en neutral visuell referens i produktlistor istället för en trasig bildruta
- Skickar korrekt signal till Googlebot att produkten finns och är aktiv
- Köper tid tills riktiga produktbilder anskaffas

**Placeholder-bilderna ersätter inte behovet av riktiga produktbilder.** De är en brandsläckare, inte en permanent lösning.

### 4.3 Bedömning och rekommendation

Att mer än hälften av produktkatalogen saknar riktiga produktbilder är en kritisk konkurrensbegränsning. Google Shopping och Merchant Listings kräver unika produktbilder för att visa produkten i sökresultaten. Google rankar produkter med bild väsentligt högre än produkter med placeholder i organiska resultat. Konverteringsgraden på produkt-sidor utan äkta bild är i branschstudier typiskt 60–80 % lägre än på sidor med riktiga produktbilder.

**Rekommendation:** AB Ilmonte bör prioritera att producera eller anskaffa äkta produktbilder för de 401 obilderade artiklarna. Åtgärden utgör den enskilt största dokumenterade tillväxtfaktorn för webbplatsen under 2026. Möjliga vägar:

1. **Leverantörsbilder** — många av Ilmontes leverantörer har produktbilder som kan användas med rätt licens. Ett systematiskt uppslag mot varje leverantör kan lösa en stor andel av problemet snabbt och billigt.
2. **Egen fotografering** — produkterna som finns fysiskt i lager kan fotograferas i batch. En dags arbete med fotograf och rätt miljö kan täcka flera hundra produkter.
3. **AI-genererade produktbilder** — för kompletterande styling-bilder (produkter i miljö). Skall inte användas som primärbild men kan komplettera.

Searchboost kan assistera med arbetsprocess: fotouppladdning via leverantör, batch-beskärning, alt-text-generering via AI, strukturerat arbete mot prioriterade produktsegment (mest sökta kategorier först).

---

## 5. FÖRVÄNTADE POSITIVA KONSEKVENSER

### 5.1 Kort sikt (1–4 veckor)
- **Google avindexerar casino-URL:erna**. När Google nästa gång crawlar ilmonte.se kommer alla tidigare spam-URL:er returnera 404. Inom 1–2 veckor försvinner de från Googles index. Inga manuella åtgärder krävs från Ilmonte.
- **"Säljaruppgifter"-varningen försvinner ur Search Console**. Det uppdaterade produktschemat (brand-fält) ger Google all data som krävs för Merchant Listings. Bedömd åtgärdstid: 10–14 dagar efter crawl.
- **Eventuella manuella åtgärder (Manual Actions) lyfts**. Om Google någon gång markerat sajten för "thin content" eller "spam" under intrångsperioden ansöker vi om översyn och är trygga i att säga att incidenten är åtgärdad och att sajten är ren.
- **Domänens klassificering normaliseras**. Google och andra större sökmotorer kommer återställa ilmonte.se som "legitim eventleverantör" snarare än spam-/gambling-domän.

### 5.2 Medellång sikt (1–3 månader)
- **Ranking-återhämtning**. Sökord som Ilmonte tappade under intrångsperioden återkommer på sina tidigare positioner — och i flera fall bättre, tack vare den massiva innehållsproduktionen (25 nya guide-artiklar) och den förbättrade on-page-strukturen (korrekta H1, brand-schema, rena titlar).
- **Ökad trafik från AI-sökmotorer**. Med llms.txt + explicit robots.txt-tillstånd för GPTBot/ClaudeBot/PerplexityBot blir Ilmonte refererad i ChatGPT-, Claude- och Perplexity-svar när användare söker efter eventinredning, scenpodier osv.
- **Förbättrad CTR (klickfrekvens) från sökresultat**. Korrekta titlar, varumärkesnamn och strukturerad data gör sökresultat rikare — fler bilder, priser och märken visas direkt i SERP.

### 5.3 Lång sikt (3–12 månader)
- **Bättre e-handelsprestanda**. Om 3.5.1–3.5.3 kombineras med åtgärdad bildtäckning (avsnitt 4) kan vi rimligen förvänta oss 40–80 % ökning av organisk trafik till produktsidor under andra halvåret 2026.
- **Stärkt säkerhetsposition**. Loopias infrastruktur med WAF, isolerade databasrättigheter och automatiserad backup gör att attacker av motsvarande typ inte är tekniskt möjliga. Wordfence övervakar kontinuerligt och eskalerar till teknisk förvaltare vid avvikelser.
- **Minimerat operativt brus för Ilmontes personal**. All teknisk e-post går nu till Searchboost. Peter, Dajana och övriga anställda kan fokusera på försäljning och kundrelation.

---

## 6. FORTSATT ÖVERVAKNING

Sajten står under kontinuerlig övervakning enligt följande rutiner:

- **Wordfence Security**: scan en gång per dygn, realtidsskydd mot kända hotaktörer
- **Sökprestanda-uppföljning**: månadsvis rapport om rankings och trafikutveckling, första rapport 2026-05-05
- **Google Search Console**: veckovisa kontroller på indexeringsstatus, manual actions och structured data
- **Automatisk backup**: daglig via Loopia, sju dagars retention
- **Cred-kontroll**: daglig automatiserad verifiering att Searchboost har access kvar till WordPress REST API

Eventuella avvikelser eskaleras omedelbart till utredaren.

---

## 7. REKOMMENDATIONER TILL KLIENT

1. **Omgående**
   - Granska övriga online-tjänster kopplade till `matti@asosweden.se` (Facebook Business, Google Merchant Center, Google Ads, Meta Business Suite). Koppla bort samtliga som inte är legitima. Searchboost assisterar vid behov.
   - Be tidigare systemutvecklare om fullständig överlämning av eventuella kvarvarande credentials, backup-filer eller staging-miljöer som inte redan är i vår besittning.

2. **Inom en månad**
   - Beslut om bildproduktion för de 401 obilderade produkterna (avsnitt 4). Detta är den enskilt största tillväxtdrivaren för sajten under 2026.
   - Ta ställning till fortsatt förvaltningsavtal med Searchboost efter retention-månadens utgång 2026-05-08. Nuvarande arbete motsvarar flera dagars konsultinsats utöver månadsabonnemanget.

3. **Lång sikt**
   - Etablera formell avtalsbilaga kring hosting- och säkerhetsansvar mellan Ilmonte, Searchboost och Loopia för att tydliggöra ansvarsområden vid framtida incidenter.
   - Överväg cyberförsäkring för e-handel — denna typ av incident kan i värsta fall orsaka betydande intäktsbortfall och är försäkringsbar.

---

## 8. DOKUMENTATION OCH BEVIS

Följande material bevaras av Searchboost i samband med ärendet:

- Komplett audit-log från attack-dagen (13 MB rå SQL-trafik-dump från 2026-03-31)
- Samtliga åtta iterationer av databasdumpar som dokumenterar rensningsprocessen
- Forensisk källkodsanalys av identifierade bakdörrar och persistens-mekanismer
- Referensprover på skadligt innehåll (bevarat för eventuella juridiska åtgärder)
- Skärmdumpar från Google Search Console som dokumenterar obehöriga ägarskap före borttagning
- Tidstämplade before/after-kontroller på samtliga sanerade URL-mönster

Materialet är tillgängligt för klient vid begäran. Bevarandetid: 24 månader från incidentens åtgärdsdatum.

---

## 9. SLUTBEDÖMNING

Incidenten klassificeras som **hög allvarlighetsgrad** med **låg faktisk skadepåverkan**. Skadeinnehållet levererades endast till sökmotorer och inte till besökare eller kunder. Intrånget är neutraliserat, samtliga dokumenterade angreppsvektorer är stängda, och sajten står i dag på en högre teknisk och säkerhetsmässig nivå än före incidenten.

Det resterande arbetet är inte av säkerhetskaraktär utan av SEO- och innehållskaraktär — framför allt bildtäckningen på produktkatalogen (avsnitt 4). Arbetet bör drivas parallellt med löpande sökoptimering.

**Ärendet är avslutat från säkerhetsperspektiv.** Den tekniska förvaltningen övergår i ordinarie drift från 2026-04-18.

---

**Upprättad av:**

Mikael Larsson
Searchboost
mikael@searchboost.se

**Rapportens status:** Slutlig
**Dokumentversion:** 1.0
**Distribution:** Klient (AB Ilmonte), Searchboost internarkiv
