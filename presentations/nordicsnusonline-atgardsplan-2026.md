# Nordic Snus Online — 3-manaders atgardsplan 2026

## Searchboost.se | Skapad 2026-03-03

---

## Oversikt

Denna atgardsplan ar uppdelad i tre manader med veckovisa uppgifter. Den bygger pa SEO-analysen, ABC-nyckelordslistan och innehallsstrategin.

**Kund:** nordicsnusonline.com (VATT AB, Lidkoping)
**Avtal:** SEO Premium 8 000 kr/man
**Startdatum:** Nar kunden signerar (beraknat mars 2026)
**Fokusomraden:** Teknisk SEO, kategorikonsolidering, varumarkestexter, innehallsstrategi

### Varfor organisk SEO ar affärskritiskt

Tobak/snus ar **totalforbjudet** i Google Ads, Meta Ads, Google Shopping och TikTok. Organisk sokning ar kundens **enda skalbara digitala kanal**. Varje forbattrad position i Google = direkta intakter som inte kan nas pa nagot annat satt.

### Identifierade huvudproblem (fran SEO-analysen)

| Problem | Allvarlighet | Antal sidor |
|---------|-------------|-------------|
| Keyword-kannibalisering (overlappande kategorier) | KRITISK | 6+ kategorier |
| 600+ sidor blockerade av noindex/nofollow | KRITISK | 600+ |
| Trasiga sidor och bilder (4XX) | KRITISK | 41+ bilder, manga sidor |
| For langa/trasiga sidtitlar (emojis, HTML-entiteter) | HOG | 242 sidor |
| Saknar H1-tagg | HOG | 41 sidor |
| Duplicerade/for langa meta descriptions | HOG | 82+ sidor |
| Varumarkessidor utan innehall | HOG | 48 sidor |
| Blogg med bara 5 artiklar pa 2 ar | MEDEL | 5 artiklar |
| Saknar guide-/kunskapssidor | MEDEL | 0 sidor |
| Canonical-problem (/ vs /sv/) | HOG | Startsidan + fler |

---

## MANAD 1: Teknisk sanering & Grundarbete

**Fokus:** Fixa de kritiska tekniska problemen som hindrar Google fran att se och forsta sajten. Ingen ny innehallsproduktion — rensning forst.

---

### Vecka 1: Indexeringsstrategi + Canonical-audit

**Mal:** Bestam exakt vilka sidor Google ska se — och vilka som ska blockeras.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Indexeringsaudit** | Ga igenom alla 600+ noindex-sidor. Kategorisera: (1) ska oppnas for Google, (2) ska forbli noindex, (3) ska tas bort helt | KRITISK | 4 timmar |
| **Canonical-sanering** | Fixa canonical-taggar pa startsidan (/ vs /sv/) och alla sidor med fel canonical | KRITISK | 2 timmar |
| **Filter-URL-strategi** | Definiera vilka filter-kombinationer (/sv/snus/?filter_format=...) som ska blockeras i robots.txt | KRITISK | 2 timmar |
| **robots.txt-uppdatering** | Implementera blockeringsregler for parameteriserade URL:er | KRITISK | 1 timme |
| **GSC-verifiering** | Satt upp Google Search Console for nordicsnusonline.com, lagg till Service Account | KRITISK | 30 min |

**Leverabel:** Indexeringsdokument med beslut per sid-typ + uppdaterad robots.txt

---

### Vecka 2: 4XX-sanering + Redirect-plan

**Mal:** Fixa alla trasiga sidor och bilder. Skapa 301-redirects for konsoliderade URL:er.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **4XX-sidor — identifiera** | Crawla hela sajten med Screaming Frog, lista alla sidor med 4XX-status | KRITISK | 2 timmar |
| **4XX-sidor — atgarda** | Fixa eller redirecta alla trasiga sidor | KRITISK | 4 timmar |
| **Trasiga bilder** | Identifiera och atgarda alla 41+ bilder med 4XX-status | KRITISK | 2 timmar |
| **Redirect-plan — kategorier** | Skapa 301-redirects: /kop-snus-online/ → /snus/, /snussorter/ → /snus/ | HOG | 2 timmar |
| **Redirect-plan — implementera** | Lagg in alla 301-redirects i WordPress (Rank Math eller .htaccess) | HOG | 2 timmar |

**Leverabel:** Komplett 301-redirect-lista + alla 4XX fixade + crawl-rapport

---

### Vecka 3: Sidtitlar + H1-taggar

**Mal:** Professionella, SEO-optimerade sidtitlar och H1-taggar pa alla sidor.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Sidtitlar — rensning** | Ta bort emojis, HTML-entiteter, versaler fran alla 242 sidor med for langa titlar | HOG | 4 timmar |
| **Sidtitlar — optimering** | Skriv nya titlar med malnyckelord, ratt langd (50-60 tecken), varumarkesnamn | HOG | 4 timmar |
| **H1-taggar** | Skapa unika H1 pa alla 41 sidor som saknar | HOG | 2 timmar |
| **Startsidan** | Ny title: "Kop snus online — Stort sortiment, snabb leverans | Nordic Snus Online" | HOG | 30 min |
| **Startsidan H1** | Ny H1: "Kop snus online — Over 260 produkter fran 48 varumarken" | HOG | 30 min |

**Leverabel:** Alla sidtitlar och H1-taggar uppdaterade + fore/efter-rapport

**Titlar att skriva (prioriterade kategorier):**

| Sida | Nuvarande titel | Ny titel |
|------|----------------|----------|
| Startsidan | Kop BILLIGT snus online » Nordic Snus Online | Kop snus online — Stort sortiment, snabb leverans | Nordic Snus |
| Vitt snus | (generisk) | Vitt snus & nikotinpasar — Kop tobaksfritt snus online | Nordic Snus |
| Portionssnus | (generisk) | Portionssnus — Kop portion snus online | Nordic Snus Online |
| ZYN | (generisk) | ZYN snus — Alla smaker & styrkor | Kop ZYN online |
| VELO | (generisk) | VELO snus — Hela sortimentet | Kop VELO online |
| General | (generisk) | General snus — Klassikern sedan 1866 | Nordic Snus Online |
| Knox | (generisk) | Knox snus — Billigt snus med kvalitet | Nordic Snus Online |
| Snus med smak | (generisk) | Snus med smak — Mint, frukt, lakrits & mer | Nordic Snus Online |

---

### Vecka 4: Meta descriptions + Redirect-implementering

**Mal:** Optimera alla meta descriptions. Verifiera att alla redirects fungerar.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Meta descriptions — duplicerade** | Skriv unika meta descriptions for 12 sidor med dubbletter | HOG | 2 timmar |
| **Meta descriptions — for langa** | Korta ner 82 meta descriptions till max 155 tecken | HOG | 4 timmar |
| **Meta descriptions — saknas** | Skriv meta descriptions for 5 sidor som saknar | HOG | 1 timme |
| **Redirect-verifiering** | Testa alla 301-redirects — kontrollera att inga kedjor eller loopar finns | HOG | 1 timme |
| **GSC — ta bort gamla URL:er** | Anvand URL Inspection + Request Indexing for konsoliderade sidor | MEDEL | 1 timme |
| **Forsta manuella arbetsrapporten** | Sammanstall manad 1-arbete i dashboard | STANDARD | 1 timme |

**Leverabel:** Alla meta descriptions optimerade + verifierade redirects + manad 1-rapport

---

### Manad 1 — Sammanfattning

| Metrik | Fore | Efter |
|--------|------|-------|
| Sidor med noindex (som borde indexeras) | 600+ | <50 |
| Trasiga sidor (4XX) | Manga | 0 |
| Trasiga bilder | 41+ | 0 |
| Sidtitlar med problem | 242 | 0 |
| Sidor utan H1 | 41 | 0 |
| Duplicerade meta descriptions | 12 | 0 |
| Canonical-problem | Flertal | 0 |
| Overlappande kategorier | 6+ | Konsoliderade |

---

## MANAD 2: Kategorikonsolidering & Varumarkestexter

**Fokus:** Bygga innehall pa kategori- och varumarkessidor. Losa kannibaliserings-problemet. Starta automatisk optimering.

---

### Vecka 5: Kategorikonsolidering

**Mal:** En tydlig kategoristruktur utan overlappning.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Konsolidera "Vit portion" + "Vitt snus"** | Sla ihop till EN kategori /sv/snus/vitt-snus/ med tydlig underkategori-text | HOG | 3 timmar |
| **Konsolidera /snussorter/** | 301-redirect till /sv/snus/ | HOG | 30 min |
| **Konsolidera /kop-snus-online/** | 301-redirect alla undersidor till motsvarande /sv/snus/-sidor | HOG | 2 timmar |
| **Skriv kategoritext: /sv/snus/** | 500 ord, mal: "kopa snus online" (8 000 sok/man) | KRITISK | 2 timmar |
| **Skriv kategoritext: /sv/snus/vitt-snus/** | 400 ord, mal: "vitt snus" (3 500) + "nikotinpasar" (2 000) | KRITISK | 2 timmar |
| **Skriv kategoritext: /sv/snus-med-smak/** | 300 ord, mal: "snus med smak" (1 000) | HOG | 1 timme |

**Leverabel:** Konsoliderad kategoristruktur + 3 nya kategoritexter

---

### Vecka 6: Varumarkestexter Prio 1 (Topp-5)

**Mal:** SEO-optimerade varumarkestexter pa de 5 viktigaste varumarkessidorna.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **ZYN — varumarkestext** | 800 ord. Historia (Philip Morris), produktoversikt, smaker, styrkor, FAQ | HOG | 3 timmar |
| **VELO — varumarkestext** | 800 ord. BAT-agande, tidigare Lyft, alla 26 produkter, Sensations-serien | HOG | 3 timmar |
| **General — varumarkestext** | 600 ord. Swedish Match, 1866, GothiaTek, MRTP, familjen | HOG | 2 timmar |
| **Knox — varumarkestext** | 500 ord. Budgetprofil, kvalitet, sortiment | HOG | 2 timmar |
| **Siberia — varumarkestext** | 500 ord. Extrastark-nisch, -80°C-konceptet | HOG | 2 timmar |
| **Internlankning** | Lank kategori → varumarke → produkt pa alla 5 sidor | MEDEL | 1 timme |

**Leverabel:** 5 varumarkessidor med unikt innehall + internlankar

---

### Vecka 7: Varumarkestexter Prio 2 + Schema

**Mal:** Fler varumarkestexter + teknisk schema-implementering.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Lundgrens — varumarkestext** | 500 ord. Premium, svenska smaker (Fjallskog, Dunge etc.) | MEDEL | 2 timmar |
| **Skruf — varumarkestext** | 500 ord. Superwhite-serien, numrerade smaker | MEDEL | 2 timmar |
| **on! — varumarkestext** | 400 ord. Philip Morris, nikotinpasar, international | MEDEL | 1.5 timmar |
| **Goteborgs Rape — varumarkestext** | 500 ord. Klassiker, lavendel-tradition, XR-serien | MEDEL | 2 timmar |
| **Ettan — varumarkestext** | 400 ord. Sveriges aldsta, tradition sedan 1822 | MEDEL | 1.5 timmar |
| **Schema markup — genomgang** | Verifiera Product-schema pa alla produktsidor, lagg till BreadcrumbList | MEDEL | 2 timmar |

**Leverabel:** 5 ytterligare varumarkestexter + schema-audit

---

### Vecka 8: Automatisk optimering + Kategoritexter #2

**Mal:** Starta Searchboost automatisk veckooptimering. Skriv resterande kategoritexter.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Skriv kategoritext: /sv/snus/portionssnus/** | 400 ord, mal: "portionssnus" (800 sok/man) | HOG | 1.5 timmar |
| **Skriv kategoritext: /sv/snus/mini-portion/** | 300 ord, mal: "mini snus" (500) | HOG | 1 timme |
| **Skriv kategoritext: /sv/snus/lossnus/** | 300 ord, mal: "lossnus" (200) | MEDEL | 1 timme |
| **Skriv kategoritext: /sv/snus/nikotinfritt/** | 300 ord, mal: "snus utan tobak" (350) | MEDEL | 1 timme |
| **Starta automatisk veckooptimering** | Konfigurera autonomous-optimizer for nordicsnusonline | STANDARD | 2 timmar |
| **Forsta veckorapporten** | Leverera automatisk veckorapport till kunden | STANDARD | 30 min |
| **Manad 2-rapport** | Sammanstall allt arbete i dashboard + skicka till kund | STANDARD | 1 timme |

**Leverabel:** 4 nya kategoritexter + automatisk optimering aktiv + veckorapport

---

### Manad 2 — Sammanfattning

| Metrik | Fore | Efter |
|--------|------|-------|
| Kategorier med SEO-text | 0 | 7 |
| Varumarkessidor med text | 0 | 10 |
| Overlappande kategorier | Fortfarande en del | Konsoliderade |
| Automatisk optimering | Inaktiv | AKTIV |
| Veckorapporter | Inga | Levereras varje mandag |

---

## MANAD 3: Innehallsstrategi & Tillvaxt

**Fokus:** Starta bloggproduktion, bygga guide-hub, forbattra E-E-A-T-signaler. Borja generera ny organisk trafik.

---

### Vecka 9: Guide-hub + Forsta bloggartiklarna

**Mal:** Lansera /sv/guider/ som kunskapshub. Publicera de tva viktigaste artiklarna.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Skapa /sv/guider/ hub-sida** | Oversiktssida med lankgrid till alla guider, 200 ord intro | MEDEL | 2 timmar |
| **Artikel 1: "Basta snus for nyborjare"** | 2 500 ord, mal: "basta snus for nyborjare" (400/man) | MEDEL | 4 timmar |
| **Artikel 2: "Vitt snus vs portion"** | 2 000 ord, mal: "vitt snus vs portion" (350/man) | MEDEL | 3 timmar |
| **Internlankning** | Lank guider → produkter → kategorier (10+ kontextuella lankar per artikel) | MEDEL | 1 timme |
| **Schema markup** | Article-schema + FAQ-schema pa bada artiklarna | MEDEL | 1 timme |

**Leverabel:** Guide-hub live + 2 publicerade artiklar med schema

---

### Vecka 10: Nikotinstyrka-guide + ZYN-guide

**Mal:** Publicera tva hogvardesartiklar som fangar A-nyckelord.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Artikel 3: "Nikotinstyrka guide"** | 1 800 ord, mal: "nikotinstyrka snus" (200) + "starkaste snus" (300) | MEDEL | 3 timmar |
| **Artikel 4: "ZYN — Komplett guide"** | 2 500 ord, mal: "ZYN snus" (2 500/man!) | HOG | 4 timmar |
| **FAQ-utbyggnad** | Lagg till 15 fragor pa /sv/vanliga-fragor/, FAQ-schema | MEDEL | 3 timmar |
| **Internlankning ZYN** | Lank ZYN-guiden fran alla ZYN-produktsidor + varumarkessida | MEDEL | 1 timme |

**Leverabel:** 2 artiklar publicerade + utokad FAQ + ZYN-internlankning

---

### Vecka 11: VELO-guide + Lopande optimering

**Mal:** Publicera VELO-guide. Utvardera effekt av teknisk sanering (manad 1).

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Artikel 5: "VELO — Guide"** | 2 200 ord, mal: "VELO snus" (2 000/man) | HOG | 4 timmar |
| **Lopande metadata-optimering** | Automatisk optimering via Searchboost-systemet (vecko-audit + optimizer) | STANDARD | Automatiskt |
| **GSC-analys — effekt manad 1** | Jamfor indexering, impressions, klick fore/efter teknisk sanering | STANDARD | 2 timmar |
| **Om oss-sida** | Skriv/forbattra /sv/om-oss/ for E-E-A-T (400 ord, kontaktinfo, kvalitetslofte) | MEDEL | 2 timmar |

**Leverabel:** VELO-guide publicerad + GSC-effektrapport + forbattrad Om oss-sida

---

### Vecka 12: Kvartalsrapport + Strategijustering

**Mal:** Sammanstall 3 manaders arbete. Justera strategi baserat pa data.

| Uppgift | Detalj | Prio | Estimat |
|---------|--------|------|---------|
| **Kvartalsrapport** | Komplett rapport: tekniska fixar, innehall producerat, GSC-data, ranking-forandringar | STANDARD | 3 timmar |
| **Ranking-analys A-nyckelord** | Kontrollera positioner pa alla 9 A-nyckelord i GSC | STANDARD | 1 timme |
| **Strategijustering** | Baserat pa data: vilka nyckelord rorer sig? Vilka innehall rankar bast? | STANDARD | 2 timmar |
| **Planering manad 4-6** | Skapa atgardsplan for nasta kvartal baserat pa resultat | STANDARD | 2 timmar |
| **Paginering/facetterad navigation** | Utvardera om WooCommerce-filter behover andras for SEO | MEDEL | 2 timmar |

**Leverabel:** Kvartalsrapport + strategijustering + plan manad 4-6

---

### Manad 3 — Sammanfattning

| Metrik | Fore | Efter |
|--------|------|-------|
| Publicerade guider/bloggartiklar | 5 (fran 2024-2025) | 10 (5 gamla + 5 nya) |
| Guide-hub | Saknas | Live med 5+ guider |
| FAQ-fragor | ~5 | 20+ |
| Om oss-sida | Minimal | Komplett E-E-A-T-sida |
| GSC-data | Baslinjedata | 3 manaders trenddata |

---

## KPI:er att folja

### Manatliga KPI:er

| KPI | Basvardet (start) | Mal manad 1 | Mal manad 2 | Mal manad 3 |
|-----|-------------------|-------------|-------------|-------------|
| **Indexerade sidor (GSC)** | Mata vid start | +30% | +50% | +60% |
| **Organiska impressions/vecka** | Mata vid start | +15% | +40% | +70% |
| **Organiska klick/vecka** | Mata vid start | +10% | +30% | +50% |
| **Genomsnittlig position (A-nyckelord)** | Mata vid start | -2 positioner | -5 positioner | -8 positioner |
| **Sidor med SEO-problem** | 14 kritiska | <5 | <2 | 0 |
| **Publicerade innehallssidor** | 5 bloggar, 0 guider | 5 bloggar, 0 guider | 5 bloggar, 0 guider, 10 varumarken, 7 kategorier | 10 bloggar, 5 guider, 10 varumarken, 7 kategorier |

### Veckovisa KPI:er (i veckorapporten)

| KPI | Matmetod |
|-----|----------|
| Antal utforda optimeringar | Searchboost dashboard |
| Nya indexerade sidor | GSC Coverage Report |
| Ranking-rorelse A-nyckelord | GSC Search Analytics |
| Nya 4XX-fel | Automatisk crawl |
| Core Web Vitals | PageSpeed Insights |

### Kvartals-KPI:er

| KPI | Mal Q1 (3 man) | Mal Q2 (6 man) |
|-----|----------------|----------------|
| Organisk trafik (besok/man) | +50% vs start | +150% vs start |
| A-nyckelord i topp-10 | 2-3 av 9 | 5-6 av 9 |
| B-nyckelord i topp-20 | 4-5 av 10 | 7-8 av 10 |
| Varumarkestexter publicerade | 10 | 20+ |
| Guider/blogg publicerade | 5 | 12+ |
| Konverteringsrate organisk | Mata (baslinje) | +20% vs baslinje |

---

## Nyckelord att overvaka

### A-nyckelord (veckovis positionscheck)

| Nyckelord | Sokvolym | Malsida | Mal position (3 man) |
|-----------|---------|---------|---------------------|
| kopa snus online | 8 000 | /sv/snus/ | Topp 15 |
| billigt snus | 4 000 | /sv/snus/ (startsida) | Topp 20 |
| vitt snus | 3 500 | /sv/snus/vitt-snus/ | Topp 15 |
| ZYN snus | 2 500 | /sv/varumarken/zyn/ + /sv/guider/zyn-guide/ | Topp 10 |
| VELO snus | 2 000 | /sv/varumarken/velo/ + /sv/guider/velo-guide/ | Topp 10 |
| nikotinpasar | 2 000 | /sv/snus/vitt-snus/ | Topp 20 |
| General snus | 1 500 | /sv/varumarken/general/ | Topp 15 |
| snus online | 1 500 | /sv/snus/ | Topp 15 |
| bestalla snus | 1 200 | /sv/guider/bestalla-snus-online/ | Topp 20 |

### B-nyckelord (varannan vecka)

| Nyckelord | Sokvolym | Malsida |
|-----------|---------|---------|
| Knox snus | 1 200 | /sv/varumarken/knox/ |
| Lundgrens snus | 1 000 | /sv/varumarken/lundgrens/ |
| snus med smak | 1 000 | /sv/snus-med-smak/ + guide |
| Siberia snus | 900 | /sv/varumarken/siberia/ |
| portionssnus | 800 | /sv/snus/portionssnus/ |
| Goteborgs Rape | 800 | /sv/varumarken/goteborgs-rape/ |
| Skruf snus | 700 | /sv/varumarken/skruf/ |
| on! nikotinpasar | 600 | /sv/varumarken/on/ |
| mini snus | 500 | /sv/snus/mini-portion/ |
| Ettan snus | 500 | /sv/varumarken/ettan/ |

### C-nyckelord (manatligt)

| Nyckelord | Sokvolym | Malsida |
|-----------|---------|---------|
| basta snus for nyborjare | 400 | /sv/guider/basta-snus-for-nyborjare/ |
| vitt snus vs portion | 350 | /sv/guider/vitt-snus-vs-portion/ |
| snus utan tobak | 350 | /sv/snus/vitt-snus/ |
| starkaste snus | 300 | /sv/guider/starkaste-snuset/ |
| snus leverans Sverige | 300 | /sv/guider/bestalla-snus-online/ |
| hur lange haller snus | 250 | /sv/guider/hur-lange-haller-snus/ |
| nikotinstyrka snus | 200 | /sv/guider/nikotinstyrka-guide/ |
| snus nyborjare guide | 180 | /sv/guider/basta-snus-for-nyborjare/ |
| basta vita snus 2026 | 150 | /sv/guider/basta-vita-snuset/ |

---

## Riskhantering

| Risk | Sannolikhet | Atgard |
|------|------------|--------|
| Kunden levererar inte WP app-password i tid | MEDEL | Paborja teknisk audit manuellt via crawler, implementera sa fort access finns |
| WooCommerce-begransningar for URL-andring | MEDEL | Anvand Rank Math 301-redirect-manager istallet for manuella .htaccess-regler |
| Filter-URL:er aterinfodeseras | LAG | robots.txt + canonical-strategi som backup |
| Google YMYL-straff | LAG | Investera i E-E-A-T fran dag 1 (Om oss, kontaktinfo, kvalitetslofte) |
| Konkurrenter (Haypp, Snusbolaget) rankar battre | HOG | Langre sikt — innehallsproduktion + lankaggning (manad 4+) |
| Rank Math-plugin-problem | LAG | Testa alla andingar pa staging forst |

---

## Budget & Resurser

### Arbetsfordelning per manad

| Manad | Searchboost-timmar (est.) | Huvudfokus |
|-------|--------------------------|------------|
| 1 | 30-35 timmar | Teknisk sanering |
| 2 | 35-40 timmar | Innehallsproduktion (kategorier + varumarken) |
| 3 | 30-35 timmar | Blogg/guider + lopande optimering |

### Vad kunden behover leverera

| Leverans | Nar | Notering |
|----------|-----|---------|
| WordPress Application Password | Fore start | Kravs for automatisk optimering |
| GSC-access (Service Account) | Vecka 1 | Kravs for positionsdata |
| Godkannande av kategoristruktur | Vecka 5 | Fore konsolidering |
| Feedback pa varumarkestexter | Lopande | Inom 48 timmar |
| Godkannande av guider | Fore publicering | Innehallsgranskning |

---

## Tidslinje — Visuell oversikt

```
VECKA  1   2   3   4   5   6   7   8   9  10  11  12
       |---|---|---|---|---|---|---|---|---|---|---|---|
MAD 1  [=======TEKNISK SANERING========]
       Index Audit  4XX  Titlar  Meta
                         H1      Desc

MAD 2                      [=======INNEHALL========]
                           Kateg. Varu-  Varu-  Kateg.
                           Kons.  mark1  mark2  #2
                                                AutoOpt

MAD 3                                      [====TILLVAXT====]
                                           Guide  ZYN   VELO  Kvartals-
                                           Hub    Guide Guide rapport
                                           Art1,2 Art3,4 Art5
```

---

## Nasta steg efter manad 3

### Manad 4-6 (rekommenderat)

1. **7 fler bloggartiklar** (artikel 6-12 fran innehallsstrategin)
2. **Varumarkestexter Prio 3** (13+ varumarken)
3. **Lankaggning** — harm reduction-sajter, snusrecensenter, svensk media
4. **Internationell SEO** — optimera engelska versionen for US/UK-marknaden
5. **YouTube-strategi** — produktrecensioner med aldersgate
6. **E-postmarknadsforingsplan** — nyhetsbrev for aterkop

### Manad 7-12 (expansion)

7. **Reddit-narvaro** — r/snus, r/NicotinePouches
8. **Affiliate-program** — bjud in snusrecensenter
9. **Internationella marknader** — anpassat innehall for USA, Norge, Schweiz
10. **Community-byggande** — Discord, forum
11. **PR och mediasamarbeten** — pitch till svensk media om snusexport
12. **Lopande innehallsproduktion** — 2 artiklar/manad

---

*Atgardsplan framtagen av Searchboost.se — mars 2026*
*Baserad pa SEO-analys, ABC-nyckelordslista och innehallsstrategi for nordicsnusonline.com*
*Alla priser exkl. moms. Ingen bindningstid.*
