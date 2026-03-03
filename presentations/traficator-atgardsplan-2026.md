# Atgardsplan 3 Manader: Traficator.se

> **Datum:** 2026-03-03
> **Utfort av:** Searchboost.se
> **Sajt:** https://traficator.se
> **Period:** Mars - Maj 2026
> **Mal:** Oka organisk trafik med 200-300%, na 5-10 nyckelord i top 10

---

## Oversikt

| Manad | Tema | Fokus |
|-------|------|-------|
| **Manad 1 (Mars)** | Teknisk grund + akuta fixar | Fixa kritiska problem, meta-taggar, schema, sakerhet |
| **Manad 2 (April)** | Innehallsoptimering + nya sidor | Utoka tjanstesidor, starta blogg, intern lankning |
| **Manad 3 (Maj)** | Tillvaxt + off-page | Lankbyggande, lokalt SEO, matning, forfinering |

---

## MANAD 1: Teknisk Grund och Akuta Fixar (Mars 2026)

### Vecka 1: Kritiska fixar (PRIO 1)

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 1.1 | **Ta bort testsida** | Satt noindex pa `/_test-2/` via Rank Math ELLER radera sidan helt. Ta bort fran sitemap. Flytta ISO 9001-certifikatbild till "Vi pa Traficator" eller startsidan. | 30 min | |
| 1.2 | **Fixa "Vara tjanster" meta** | Andra meta-beskrivningen fran "PROCESSEN" till: "Traficator levererar gjutning, CNC-bearbetning och stalkonstruktioner via kvalitetsakrade producenter i Europa och Asien." | 15 min | |
| 1.3 | **Fixa canonical pa /en/** | I Rank Math, satt canonical for `/en/` till `https://traficator.se/en/` (inte rotdomanen). | 15 min | |
| 1.4 | **Fixa alla meta-beskrivningar** | Skriv unika, lockande beskrivningar (150-160 tecken) for alla 10 svenska sidor. Se foreslagna texter i SEO-auditen. | 2 tim | |
| 1.5 | **Fixa alla title-taggar** | Byt fran VERSALER till Normal Case. Inkludera nyckelord. Format: "Tjanst -- Kategoribeskrivning \| Traficator". Exempel: "Gjutning av metallprodukter -- Sandgjutning & pressgjutning \| Traficator" | 1 tim | |
| 1.6 | **Fixa stavfel** | Ratta "maskinbearbeting" till "maskinbearbetning" pa bearbetningssidan. | 5 min | |
| 1.7 | **Ta bort duplett GTM** | Identifiera vilken GTM-container som ar aktiv (troligen GTM-TT4X9H5M via Site Kit). Ta bort den andra (GTM-KRTLTBXM) fran temat/plugin. | 30 min | |

**Vecka 1 total tid: ~5 timmar**

### Vecka 2: On-page-optimering

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 2.1 | **Optimera alla H1-taggar** | Varje sida ska ha EN kort, nyckelordsfokuserad H1. Se tabell nedan. | 1 tim | |
| 2.2 | **Byt OG-bild** | Skapa professionell OG-bild (1200x630px) med Traficator-logga + metallproduktbild. Satt som standard i Rank Math. | 1 tim | |
| 2.3 | **Andra forfattarnamn** | Byt "admin-dev" och "admin" till "Traficator International AB" eller "Patrik Carlsson". Uppdatera i WordPress Anvandare > Profil. | 15 min | |
| 2.4 | **Lagg till hreflang x-default** | Installning i Polylang -- satt x-default till svenska versionen. | 15 min | |
| 2.5 | **Fixa bildernas alt-text** | Ga igenom alla bilder i Mediabiblioteket. Skriv beskrivande alt-texter med nyckelord. Exempel: "Sandgjutning av aluminiumprodukt -- Traficator" | 1 tim | |
| 2.6 | **Aktivera breadcrumbs** | Aktivera Rank Math breadcrumbs (Rank Math > Allmanna installningar > Breadcrumbs). Lagg till i temat via Flatsome > Theme Options. | 30 min | |

**Forandringsforslag H1-taggar:**

| Sida | Nuvarande H1 | Ny H1 |
|------|--------------|-------|
| Startsidan | "Global sourcing av metallprodukter" | OK -- behall |
| Vara tjanster | "Vi har genom aren etablerat..." (for lang) | "Vara tjanster inom material sourcing" |
| Gjutning | "GJUTNING" | "Gjutning av metallprodukter" |
| Bearbetning | "BEARBETNING" | "CNC-bearbetning och platbearbetning" |
| Processen | "PROCESSEN" | "Var sourcingprocess -- fran behov till leverans" |
| Ovrigt | "OVRIGT" | "Stalkonstruktioner och specialprodukter" |
| FAQ | "FAQ" | "Vanliga fragor om material sourcing" |
| Vi pa Traficator | "Vi brinner for att hitta..." (for lang) | "Om Traficator International AB" |
| Kontakt | "KONTAKTPERSONER" | "Kontakta oss -- begar offert" |

**Vecka 2 total tid: ~4 timmar**

### Vecka 3: Strukturerad data (Schema.org)

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 3.1 | **LocalBusiness-schema** | Lagg till pa startsidan och kontaktsidan via Rank Math > Schema Generator. Inkludera: namn, adress (Oinge Lillegard 103, 305 77 Getinge), telefon (+46-35-282-01-40), e-post, oppettider (man-fre 08-17), geo-koordinater, logo. | 1 tim | |
| 3.2 | **Service-schema pa Gjutning** | Lagg till Service-schema: serviceType "Gjutning av metallprodukter", provider, areaServed (SE, EU), description. | 30 min | |
| 3.3 | **Service-schema pa Bearbetning** | Samma som ovan: serviceType "CNC-bearbetning och metallbearbetning". | 30 min | |
| 3.4 | **Service-schema pa Ovrigt** | serviceType "Stalkonstruktioner och specialprodukter". | 30 min | |
| 3.5 | **FAQPage-schema** | Lagg till pa FAQ-sidan med alla befintliga fragor och svar. Rank Math har inbyggt FAQ-block -- anvand det. | 1 tim | |
| 3.6 | **Fixa Organization-schema** | Lagg till logo-URL, address, telephone, contactPoint, sameAs (Facebook). | 30 min | |
| 3.7 | **Ta bort felaktigt Article-schema** | Startsidan och tjanstesidor ska ha WebPage, inte Article. Andra i Rank Math > Schema for varje sida. | 30 min | |

**Vecka 3 total tid: ~4.5 timmar**

### Vecka 4: Sakerhet och teknisk forfinering

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 4.1 | **Stang xmlrpc.php** | Lagg till i .htaccess: `<Files xmlrpc.php> order deny,allow deny from all </Files>`. Eller anvand plugin som "Disable XML-RPC". | 15 min | |
| 4.2 | **Dolj WordPress-version** | Lagg till i functions.php: `remove_action('wp_head', 'wp_generator');` | 15 min | |
| 4.3 | **Stang forfattararkiv** | I Rank Math > Titlar & Meta > Forfattare: satt "Author Archives" till "Disabled/Noindex". | 15 min | |
| 4.4 | **Uppdatera robots.txt** | Lagg till: `Disallow: /author/` och `Disallow: /_test-2/` | 15 min | |
| 4.5 | **Kontaktformular locale** | Andra CF7 locale fran `en_US` till `sv_SE`. | 10 min | |
| 4.6 | **Verifiera Google Search Console** | Kontrollera att sajten ar verifierad i GSC. Skicka in uppdaterad sitemap. Kontrollera crawl-fel. | 30 min | |
| 4.7 | **Installera Google Search Console pa GSC** | Lagg till Searchboost SA (seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com) som "Fullstandig" anvandare i GSC. | 15 min | |

**Vecka 4 total tid: ~2 timmar**

### Manad 1 -- Sammanfattning

| Vecka | Fokus | Total tid |
|-------|-------|-----------|
| Vecka 1 | Kritiska fixar | ~5 tim |
| Vecka 2 | On-page-optimering | ~4 tim |
| Vecka 3 | Strukturerad data | ~4.5 tim |
| Vecka 4 | Sakerhet + teknik | ~2 tim |
| **Totalt Manad 1** | | **~15.5 tim** |

**Forvantat resultat efter Manad 1:**
- Alla kritiska problem atgardade
- Meta-taggar optimerade pa alla sidor
- Schema-markering pa plats (LocalBusiness, Service, FAQ)
- Sakerhetshal stangda
- Tekniskt SEO-betyg: 55/100 --> 80+/100

---

## MANAD 2: Innehallsoptimering och Nya Sidor (April 2026)

### Vecka 5: Utoka tjanstesidor

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 5.1 | **Utoka Gjutning-sidan till 1500+ ord** | Skriv djupgaende om: tillverkningsmetoder (sandgjutning, pressgjutning, precisionsgjutning med detaljerade beskrivningar), materialval (aluminium, jarn, stal, massing -- egenskaper och anvandningsomraden), kvalitetskontroll (ISO 9001-processen), typiska projekt/branschexempel. | 4 tim | |
| 5.2 | **Utoka Bearbetning-sidan till 1500+ ord** | Skriv djupgaende om: CNC-processer (3/4/5-axlig frasning, svarvning, borrning), material som bearbetas, toleranser och kvalitet, fordelar med outsourcing av bearbetning, maskintypeer. | 4 tim | |
| 5.3 | **Omarbeta "Ovrigt"-sidan** | Byt namn till "Stalkonstruktioner och specialprodukter". Omskriv innehallet -- fokusera pa svetsade stalkonstruktioner, stampade platdetaljer, speciallosningar. Ta bort/flytta det som handlar om plastprodukter och avfallskorgar om det inte ar relevant. 1000+ ord. | 3 tim | |

**Vecka 5 total tid: ~11 timmar**

### Vecka 6: Startsida + Om oss + Processen

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 6.1 | **Utoka startsidan** | Lagg till sektioner: "Vara tjanster" (kort oversikt med lankar), "Varfor Traficator?" (3-4 USP:ar), "Certifieringar" (ISO 9001-badge), "Kontakta oss" (CTA med offertformular). Mal: 800+ ord synligt innehall. | 3 tim | |
| 6.2 | **Utoka "Vi pa Traficator"** | Lagg till: foretagshistorik (nar grundades, milstolpar), varderingar, kompetensomraden, certifieringar (ISO 9001 med bild). Lagg till kundcitat om mojligt. 800+ ord. | 2 tim | |
| 6.3 | **Utoka Processen-sidan** | Beskriv varje steg i detalj: 1) Behovsanalys, 2) Leverantorsval, 3) Prototyp/provning, 4) Kvalitetsgodkannande, 5) Serieproduktion, 6) Logistik/leverans. Infografik om mojligt. 1000+ ord. | 3 tim | |
| 6.4 | **Optimera kontaktsidan** | Skriv ny introduktionstext om varfor man ska kontakta Traficator. Lagg till: offertformular-text, leveranstider, svarsgaranti. 400+ ord. | 1 tim | |

**Vecka 6 total tid: ~9 timmar**

### Vecka 7: Content Marketing -- Blogginlagg 1-2

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 7.1 | **Blogginlagg 1: "Vad ar material sourcing? Komplett guide for tillverkare"** | Informativt inlagg som forklarar material sourcing, fordelar, process, och nar det lonar sig. Inkludera intern lank till Processen-sidan och kontaktsidan. Mal-nyckelord: "vad ar material sourcing". 1500+ ord. | 4 tim | |
| 7.2 | **Blogginlagg 2: "Sandgjutning vs pressgjutning -- vilken metod passar dig?"** | Teknisk jamforelse med for-/nackdelar, anvandningsomraden, kostnadsaspekter. Inkludera intern lank till Gjutning-sidan. Mal-nyckelord: "skillnad sandgjutning pressgjutning". 1200+ ord. | 3 tim | |
| 7.3 | **Intern lankning -- Blogg till tjanstesidor** | Ga igenom bada blogginlaggen och satt 2-3 interna lankar till relevanta tjanstesidor. Ga sedan igenom tjanstesidorna och lank tillbaka till bloggen dar det ar naturligt. | 30 min | |

**Vecka 7 total tid: ~7.5 timmar**

### Vecka 8: Content Marketing -- Blogginlagg 3-4

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 8.1 | **Blogginlagg 3: "ISO 9001 och gjutgods -- varfor certifiering ar avgorande vid sourcing"** | Forklara varfor ISO 9001 ar viktigt vid internationell sourcing, hur Traficator arbetar med kvalitetsakring, vad det innebar for kunden. Mal-nyckelord: "ISO 9001 gjutgods". 1000+ ord. | 3 tim | |
| 8.2 | **Blogginlagg 4: "5 fordelar med att outsourca din metallproduktion"** | Kostnadsbesparingar, tillgang till specialkompetens, flexibilitet, skalbarhet, kvalitet. Case-baserat om mojligt. Mal-nyckelord: "fordelar outsourcing produktion". 1000+ ord. | 3 tim | |
| 8.3 | **Intern lankning -- Ny omgang** | Lank blogginlagg 3-4 till relevanta tjanstesidor. Uppdatera Gjutning- och Bearbetning-sidorna med lankar till bloggartiklar. | 30 min | |
| 8.4 | **Skapa "Artiklar/Guider"-sida** | Skapa en ny sida under /aktuellt/ eller /guider/ som listar alla bloggartiklar med korta intro-texter. Fungerar som innehallsnav. | 1 tim | |

**Vecka 8 total tid: ~7.5 timmar**

### Manad 2 -- Sammanfattning

| Vecka | Fokus | Total tid |
|-------|-------|-----------|
| Vecka 5 | Utoka tjanstesidor | ~11 tim |
| Vecka 6 | Startsida + Om oss + Process | ~9 tim |
| Vecka 7 | Blogginlagg 1-2 | ~7.5 tim |
| Vecka 8 | Blogginlagg 3-4 + intern lankning | ~7.5 tim |
| **Totalt Manad 2** | | **~35 tim** |

**Forvantat resultat efter Manad 2:**
- Alla tjanstesidor har 1000-1500+ ord med nyckelordsoptimerat innehall
- 4 nya bloggartiklar publicerade (5000+ ord nytt innehall totalt)
- Stark intern lankstruktur mellan tjanstesidor och blogg
- Borjar ranka for informationella nyckelord (C-listan)
- Organisk trafik borjar oka

---

## MANAD 3: Tillvaxt, Lankbyggande och Matning (Maj 2026)

### Vecka 9: Lokal SEO

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 9.1 | **Google Business Profile** | Verifiera/skapa GBP-listning. Fyll i alla uppgifter: namn, adress, telefon, webbplats, oppettider, kategorier (Material Sourcing, Metallgjuteri, Mekanisk verkstad), foretags-beskrivning, bilder (kontor, produkter, team). | 2 tim | |
| 9.2 | **GBP-inlagg** | Publicera 2-3 inlagg pa GBP: nyheter, tjanster, erbjudanden. Lank till sajten. | 1 tim | |
| 9.3 | **GBP-bilder** | Ladda upp 10-15 bilder: kontorsbyggnad, team-bilder, produktbilder, certifierings-badges, logga. | 1 tim | |
| 9.4 | **NAP-konsistens** | Sakerstall att Namn, Adress, Telefon ar identiskt pa sajten, GBP, och alla kataloger. | 30 min | |

**Vecka 9 total tid: ~4.5 timmar**

### Vecka 10: Katalog- och lankbyggande

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 10.1 | **Branschkataloger** | Registrera/uppdatera pa: allabolag.se, hitta.se, eniro.se, 118100.se, merinfo.se, kompass.com, industritorget.se. Sakerstall korrekt NAP och lank till traficator.se. | 2 tim | |
| 10.2 | **Lokala kataloger** | Registrera i: Halmstad narliv, Hallands handelskammare, lokala foretagsregister. | 1 tim | |
| 10.3 | **LinkedIn foretagssida** | Skapa/optimera LinkedIn Company Page. Fyll i: foretagsbeskrivning med nyckelord, webbplatslank, kontaktuppgifter, logga, omslag-bild. Publicera 2-3 inlagg med lankar till bloggartiklar. | 2 tim | |
| 10.4 | **Leverantor-/partnerlanka** | Kontakta 3-5 befintliga leverantorer eller partners och fraga om de kan lank till traficator.se fran sin webbplats (leverantor-sida, partner-sida, etc.). | 2 tim | |
| 10.5 | **Branschforum/grupper** | Ga med i relevanta LinkedIn-grupper for tillverkning/sourcing i Sverige. Delta i diskussioner med lank till relevanta bloggartiklar. | 1 tim | |

**Vecka 10 total tid: ~8 timmar**

### Vecka 11: Content Marketing -- Blogginlagg 5-6

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 11.1 | **Blogginlagg 5: "CNC-bearbetning: Processer, material och fordelar"** | Djupgaende guide om CNC-bearbetning, materialval, toleranser, nar det lonar sig att outsourca. Mal-nyckelord: "CNC-bearbetning fordelar". 1500+ ord. | 4 tim | |
| 11.2 | **Blogginlagg 6: "Sourcing fran Asien -- sa sakrar du kvaliteten"** | Praktisk guide om kvalitetsakring vid asiatisk sourcing, inspektioner, certifieringar, case studies. Mal-nyckelord: "sourcing fran kina kvalitet". 1500+ ord. | 4 tim | |
| 11.3 | **Intern lankning -- Tredje omgangen** | Lank nya artiklar till tjanstesidor. Uppdatera artiklsida/guider. | 30 min | |

**Vecka 11 total tid: ~8.5 timmar**

### Vecka 12: Matning, uppfoljning och framtidsplan

| # | Uppgift | Detalj | Tid | Status |
|---|---------|--------|-----|--------|
| 12.1 | **GSC-granskning** | Ga igenom Google Search Console: indexeringsstatus, crawl-fel, sokprestanda. Bekrafta att testsidan ar borttagen fran index. Verifiera att alla sidor indexeras korrekt. | 1 tim | |
| 12.2 | **Positionsrapport** | Sammanstall positioner for alla A- och B-nyckelord via GSC. Dokumentera baseline vs nuvarande position. | 1 tim | |
| 12.3 | **Trafikrapport** | Jamfor organisk trafik fore (mars) och efter (maj) optimeringsarbetet. Dokumentera okning i besok, impressions, klick. | 1 tim | |
| 12.4 | **Teknisk foruppfoljning** | Kor ny technisk audit for att verifiera att alla problem fran Manad 1 ar atgardade. Kontrollera sidhastighetid med PageSpeed Insights. | 1 tim | |
| 12.5 | **Engelska sidor** | Besluta om engelska versioner ska finnas. Om ja: komplettera saknade undersidor (bearbetning, ovrigt, om oss). Om nej: satt noindex pa EN-sidor och ta bort fran sitemap. | 2 tim | |
| 12.6 | **3-manadersrapport till kund** | Sammanstall: utforda atgarder, positionsforandringar, trafikforandringar, nasta steg. Presentera i Searchboost-format. | 2 tim | |

**Vecka 12 total tid: ~8 timmar**

### Manad 3 -- Sammanfattning

| Vecka | Fokus | Total tid |
|-------|-------|-----------|
| Vecka 9 | Lokal SEO (GBP) | ~4.5 tim |
| Vecka 10 | Katalog- och lankbyggande | ~8 tim |
| Vecka 11 | Blogginlagg 5-6 | ~8.5 tim |
| Vecka 12 | Matning och uppfoljning | ~8 tim |
| **Totalt Manad 3** | | **~29 tim** |

**Forvantat resultat efter Manad 3:**
- Google Business Profile optimerad och aktiv
- 15-20 nya backlinks fran kataloger och partners
- 6 bloggartiklar publicerade totalt (8000+ ord nytt innehall)
- Forsta positionsforandringar synliga i GSC
- Lokal synlighet i Getinge/Halmstad-omradet forbattrad

---

## Total tidsbudget

| Manad | Tema | Timmar |
|-------|------|--------|
| Manad 1 | Teknisk grund + akuta fixar | ~15.5 tim |
| Manad 2 | Innehallsoptimering + content | ~35 tim |
| Manad 3 | Tillvaxt + off-page + matning | ~29 tim |
| **TOTALT 3 MANADER** | | **~79.5 tim** |

---

## KPI:er och Milstolpar

### Manad 1 -- Milstolpar
- [ ] Alla kritiska problem atgardade (testsida, meta, canonical)
- [ ] Schema-markering implementerad (LocalBusiness, Service, FAQ)
- [ ] Sakerhetsproblem stangda (xmlrpc, forfattararkiv, WP-version)
- [ ] GSC verifierad och sitemap inskickad

### Manad 2 -- Milstolpar
- [ ] Alla tjanstesidor har 1000+ ord optimerat innehall
- [ ] 4 bloggartiklar publicerade
- [ ] Intern lankstruktur uppbyggd
- [ ] Startsidan utokad med trust-signaler

### Manad 3 -- Milstolpar
- [ ] Google Business Profile optimerad
- [ ] 15+ nya katalogslankar
- [ ] LinkedIn foretagssida aktiv
- [ ] 6 bloggartiklar publicerade totalt
- [ ] Uppfoljningsrapport levererad

### KPI-mal efter 3 manader

| KPI | Nulage (uppsk.) | Mal |
|-----|----------------|-----|
| Organisk trafik/man | 20-50 | 100-200 |
| Nyckelord i top 10 | 0-3 | 5-10 |
| Nyckelord i top 50 | 5-10 | 20-40 |
| Indexerade sidor | 20 | 25-30 |
| Backlinks (ref. domaner) | 10-30 | 40-60 |
| Tekniskt SEO-betyg | 42/100 | 85+/100 |
| Blogginlagg | 1 | 7 |
| Offertforfragningar/man | 0-1 | 2-4 |

---

## Nasta steg efter 3 manader

1. **Lopande content marketing:** 2 bloggartiklar/manad
2. **Utokad lankbyggnad:** Gastbloggande, PR-artiklar, branschsamarbeten
3. **Kundcase/referensprojekt:** Publicera 3-5 projekt med bilder och resultat
4. **Video-innehall:** Korta filmer om sourcing-processen for YouTube/LinkedIn
5. **Nyhetsbrev:** Manatligt utskick till prospects och kunder
6. **GA4-integration:** Installera analytics for att mata konverteringar (offertformular)
7. **Konkurrentbevakning:** Lopande analys av konkurrenters positioner
8. **Engelska versionen:** Fullstandig internationell SEO om marknaden motiverar

---

*Atgardsplan genererad av Searchboost.se -- 2026-03-03*
