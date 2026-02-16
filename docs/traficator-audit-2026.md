# SEO-Audit: Traficator.se

> **Datum:** 2026-02-15
> **Utfört av:** Searchboost.se
> **Sajt:** https://traficator.se
> **CMS:** WordPress 6.9.1 med Flatsome-tema (child theme)
> **SEO-plugin:** Rank Math SEO Pro
> **Caching:** LiteSpeed Cache (LiteSpeed-server)
> **Flerspråkig:** Polylang (Svenska + Engelska)

---

## Sammanfattning

Traficator.se är en B2B-sajt för material sourcing av metallprodukter (gjutgods, bearbetning, stålkonstruktioner). Sajten har nyligen byggts om med kategorisidor och undersidor under /vara-tjanster/, men saknar kritisk strukturerad data, har flera meta-beskrivningsproblem, och en testsida som indexeras av Google. Tekniskt fungerar sajten bra tack vare LiteSpeed-cache och HTTP/2, men det finns inga LocalBusiness- eller Service-scheman, OG-bilderna pekar på en gammal "dummy"-bild, och FAQ-sidan saknar FAQPage-schema trots att den har frågor och svar. Backlinks-data kunde inte hämtas (SE Ranking API-kredit slut), men sajten har sannolikt en svag backlinksprofil givet att det är en liten nischsajt. Med rätt åtgärder kan sajten nå förstasidan för nyckelord som "material sourcing", "gjutgods leverantör" och "metallprodukter sourcing" inom 3-6 månader.

---

## 1. Teknisk SEO

### 1.1 Server & Prestanda

| Parameter | Status | Kommentar |
|-----------|--------|-----------|
| HTTPS | OK | SSL aktivt |
| HTTP/2 | OK | H2-protokoll via LiteSpeed |
| HTTP/3 (QUIC) | OK | alt-svc header med h3 |
| Server | LiteSpeed | Snabb, bra för WordPress |
| PHP-version | 8.1.34 | OK, men 8.2 eller 8.3 rekommenderas |
| LiteSpeed Cache | OK | Cache-hit bekräftat i headers |
| Gzip/Brotli | Sannolikt | LiteSpeed hanterar kompression |
| ETag | OK | Fungerar korrekt |
| CSS-optimering | OK | LiteSpeed optimerar (litespeed/css/) |
| JS-optimering | Delvis | Flatsome-JS prefetchas, men LiteSpeed deferred scripting |
| Lazy loading | OK | data-lazyloaded attribut på bilder |
| Fonter | Lokala | Lato + Dancing Script serveras lokalt (bra!) |
| Favicon | OK | 32x32, 192x192, 180x180 Apple, 270x270 MS |

### 1.2 Meta-taggar & Grundläggande SEO

| Sida | Title | Meta Description | Problem |
|------|-------|------------------|---------|
| **Startsidan** `/` | "Traficator -- Material sourcing av metallprodukter" | "Traficator erbjuder material sourcing och levererar gjutgods, metallprodukter och stålkonstruktioner..." | OK men kan optimeras |
| **Våra tjänster** `/vara-tjanster/` | "Våra tjänster - Traficator International AB" | **"PROCESSEN"** | KRITISKT: Beskrivningen är bara ordet "PROCESSEN" |
| **Gjutning** `/vara-tjanster/gjutning/` | "GJUTNING - Traficator International AB" | "Vi kan leverera maskinbearbetat gjutgods i hög kvalitet..." | Avklippt mitt i mening |
| **Bearbetning** `/vara-tjanster/bearbetning/` | "BEARBETNING - Traficator International AB" | "Våra leverantörer är utrustade med allt från enkla..." | Avklippt mitt i mening |
| **Processen** `/vara-tjanster/processen/` | "PROCESSEN - Traficator International AB" | "Processen startar alltid från ett behov hos kunden..." | Avklippt mitt i mening |
| **Övrigt** `/vara-tjanster/ovrigt/` | "ÖVRIGT - Traficator International AB" | "Vi har genom åren arbetat en hel del med plastprodukter..." | Avklippt mitt i mening |
| **FAQ** `/vara-tjanster/faq/` | "FAQ Frågor - Traficator International AB" | "Traficator fungerar som en förlängning av er inköpsavdelning..." | OK men kan förbättras |
| **Vi på Traficator** `/vi-pa-traficator/` | "Vi på Traficator - Traficator International AB" | "Vi är ett litet familjeföretag som har sitt kontor..." | Avklippt |
| **Kontakt** `/kontakt/` | "Kontakt - Traficator International AB" | "Öinge Lillegård 103 305 77 Getinge Telefon: 035-282 01 40..." | Bara kontaktinfo, inte optimerad |
| **Aktuellt** `/aktuellt/` | "Aktuellt inom metallbearbetning -- Nyheter & uppdateringar" | "Senaste nytt inom metallbearbetning, produktion och leveranser..." | OK, bra optimerad |
| **_TEST** `/_test-2/` | "_TEST - Traficator International AB" | SAKNAS | KRITISKT: Testsida indexeras! |
| **EN: Home** `/en/` | "Home - Traficator International AB" | "Our ultimate aim is to lower costs..." | OK men generisk |

### 1.3 H1-taggar

| Sida | H1-tagg | Problem |
|------|---------|---------|
| Startsidan | "Global sourcing av metallprodukter" | OK |
| Våra tjänster | "Vi har genom åren etablerat nära och goda kontakter med våra producenter." | FÖR LÅNG -- en H1 ska vara kort och nyckelordsfokuserad |
| Gjutning | "GJUTNING" | Kan inkludera nyckelord: "Gjutning av metallprodukter" |
| Bearbetning | "BEARBETNING" | Kan inkludera: "Bearbetning av metaller" |
| Processen | "PROCESSEN" | Kan inkludera: "Vår sourcingprocess" |
| Övrigt | "ÖVRIGT" | Dåligt -- generiskt, saknar relevans |
| FAQ | "FAQ" | Kan vara: "Vanliga frågor om material sourcing" |
| Vi på Traficator | "Vi brinner för att hitta leverantörslösningar för våra kunder." | FÖR LÅNG |
| Kontakt | "KONTAKTPERSONER" (via section-title) | OK men dubbla H1:or -- kontaktsidan har H1 i section-title + H2 |
| Aktuellt | "Aktuellt" | OK |

### 1.4 Robots.txt

```
User-agent: *
Disallow: /wp-admin/
Allow: /wp-admin/admin-ajax.php
Sitemap: https://traficator.se/sitemap_index.xml
```

**Status:** OK -- standardkonfiguration. Saknar dock regler för:
- Blockering av `/author/` (admin-dev och admin exponeras)
- Blockering av `/_test-2/` (testsida)
- Saknar `X-Robots-Tag` headers

### 1.5 Sitemap

**Sitemap-index:** `https://traficator.se/sitemap_index.xml` (Rank Math-genererad)
- `post-sitemap.xml` -- 3 URLs (aktuellt + 1 SV-inlägg + 1 EN-inlägg)
- `page-sitemap.xml` -- 20 URLs (alla sidor inkl. _test-2!)
- `category-sitemap.xml` -- 1 URL (kategori aktuellt-sv)
- `local-sitemap.xml` -- 1 URL (locations.kml)

**Problem:**
- Testsidan `/_test-2/` är med i sitemap -- ska tas bort
- Mycket få inlägg (bara 1 blogginlägg) -- dåligt för content marketing
- Engelska sidor blandas med svenska i samma sitemap (bör separeras med hreflang-sitemap)

### 1.6 Structured Data (Schema.org)

**Nuvarande schema (alla sidor):**
- `Organization` -- bara namn och URL (saknar logo, adress, telefon, kontaktpunkt)
- `WebSite` -- med SearchAction (OK)
- `WebPage` -- standard
- `Article` -- FEL: Startsidan och tjänstesidor ska INTE ha Article-schema
- `Person` -- "admin-dev" / "admin" (exponerar användarnamn!)

**Saknas helt:**
- `LocalBusiness` -- kritiskt för lokal SEO (Getinge/Halmstad)
- `Service` -- för tjänstesidorna (gjutning, bearbetning etc.)
- `FAQPage` -- FAQ-sidan har frågor och svar men saknar schema
- `BreadcrumbList` -- ingen breadcrumb-markering
- `ContactPoint` -- kontaktsidan saknar strukturerade kontaktuppgifter
- Logo i Organization-schemat

### 1.7 Flerspråkighet (Polylang)

**Hreflang-taggar:** Finns på startsidan:
```html
<link rel="alternate" href="https://traficator.se/en/" hreflang="en" />
<link rel="alternate" href="https://traficator.se/" hreflang="sv" />
```

**Problem:**
- Saknar `hreflang="x-default"` -- bör peka på SV eller EN
- Engelska startsidan `/en/` har `canonical` som pekar på `https://traficator.se/` (rotdomänen) -- FELAKTIG canonical, ska peka på `/en/`
- Inte alla undersidor har engelska versioner (bearbetning, övrigt etc. saknar)

### 1.8 Open Graph & Sociala Medier

**Problem:**
- OG-bild på de flesta sidor: `dummy-1.jpg` (400x260px) -- en gammal platshållarbild kallad "Bakgrund"
- Bilden är för liten (Facebook rekommenderar 1200x630px)
- Gjutning, Bearbetning, Processen, Övrigt, FAQ -- har INGEN OG-bild alls
- Twitter-författare: "admin-dev" exponeras

### 1.9 Säkerhet & Tekniskt

| Parameter | Status | Kommentar |
|-----------|--------|-----------|
| xmlrpc.php | ÖPPEN | Säkerhetsrisk -- bör stängas av |
| WP REST API | ÖPPEN | /wp-json/ exponerad -- överväg begränsning |
| Författararkiv | ÖPPNA | /author/admin-dev/ och /author/admin/ exponerar användarnamn |
| WordPress-version | Exponerad | meta generator visar "WordPress 6.9.1" |
| Site Kit version | Exponerad | meta generator visar "Site Kit by Google 1.170.0" |
| GTM | 2 containers! | GTM-KRTLTBXM + GTM-TT4X9H5M -- kan skapa konflikter |
| Google Tag | GT-M6BR37D8 | Via Site Kit |

---

## 2. On-Page SEO -- Analys per sida

### 2.1 Startsidan (/)

**Bra:**
- Tydlig H1 med nyckelord ("Global sourcing av metallprodukter")
- CTA-knappar ("Våra tjänster" + "Begär offert")
- Tre icon-boxar med tjänsteöversikt
- Slider med bakgrundsbild

**Problem:**
- Meta-beskrivning avklippt (slutar med punkt men saknar lockelse)
- OG-bild är dummy-1.jpg
- Innehållet är tunnt efter hero-sektionen -- saknar mer textinnehåll för att ranka
- Inga interna länkar till specifika tjänster utöver navigationen
- Saknar kundlogotyper, certifieringar, trust-signaler på startsidan

### 2.2 Våra tjänster (/vara-tjanster/)

**Kritiska problem:**
- Meta-beskrivning är bara **"PROCESSEN"** -- totalt meningslös
- H1 är en hel mening -- bör vara kort och nyckelordsfokuserat
- Sidan fungerar som hub-sida men saknar tydlig SEO-text
- Inget fokus-nyckelord satt

### 2.3 Gjutning (/vara-tjanster/gjutning/)

**Bra:**
- Tydlig struktur med H2:or: Tillverkningsmetoder, Metaller, Efterbehandling, Kvalitetssäkring
- Relevant innehåll om sandgjutning, aluminiumlegeringar etc.

**Problem:**
- Title i VERSALER ("GJUTNING") -- bör vara "Gjutning av metallprodukter | Traficator"
- Meta-beskrivning avklippt mitt i mening
- Saknar mer djupgående textinnehåll (uppskattat ~150 ord -- bör vara 500+)
- Inget Service-schema

### 2.4 Bearbetning (/vara-tjanster/bearbetning/)

**Bra:**
- H2:or: Processmöjligheter, Tilläggsarbeten, Material
- 3/4/5-axliga maskiner nämns

**Problem:**
- Samma som Gjutning: VERSALER-title, avklippt meta, tunt innehåll
- Stavfel i meta: "maskinbearbeting" (ska vara "maskinbearbetning")
- Saknar Service-schema

### 2.5 Processen (/vara-tjanster/processen/)

**Problem:**
- Title "PROCESSEN" är icke-beskrivande
- Bör vara: "Vår sourcingprocess -- Från behov till leverans | Traficator"
- Meta avklippt

### 2.6 Övrigt (/vara-tjanster/ovrigt/)

**Problem:**
- "ÖVRIGT" som sidnamn har noll SEO-värde
- Sidan handlar om plastprodukter och avfallskorgar -- bör omarbetas
- H2:or: "Avfallskorg / hundlatrin", "Många möjligheter"

### 2.7 FAQ (/vara-tjanster/faq/)

**Problem:**
- SAKNAR FAQPage-schema trots att det är en FAQ-sida
- Title "FAQ Frågor" är redundant (FAQ = Frequently Asked Questions)
- Bör vara: "Vanliga frågor om material sourcing | Traficator"

### 2.8 Vi på Traficator (/vi-pa-traficator/)

**Bra:**
- Personliga profiler med bilder (Patrik Carlsson, Eva-Lotta Carlsson)
- Bygger förtroende

**Problem:**
- H1 är en hel mening -- bör vara "Om oss" eller "Vi på Traficator"
- Meta avklippt
- E-postadresser i klartext (spamrisk)

### 2.9 Kontakt (/kontakt/)

**Bra:**
- Google Maps-inbäddning
- Kontaktformulär (Contact Form 7 med Altcha anti-spam)
- Öppettider angivna

**Problem:**
- Meta-beskrivning är bara adress + telefonnummer -- inte optimerad
- Saknar LocalBusiness-schema med adress, telefon, öppettider
- H1/H2-hierarki oklar (H1 = "KONTAKTPERSONER" via section-title, H2 = "KONTAKT / BEGÄR OFFERT")
- CF7 locale satt till `en_US` trots att det är en svensk sida

### 2.10 Testsidan (/_test-2/) -- KRITISKT

- **Indexeras av Google** (meta robots = "follow, index")
- Finns med i sitemap
- Title: "_TEST - Traficator International AB"
- Innehåller ISO 9001-certifikatbild -- bör flyttas till rätt sida
- **ÅTGÄRD:** Sätt noindex + ta bort från sitemap, eller radera helt

---

## 3. Backlinks

**SE Ranking API-status:** Otillgänglig (API-kredit slut -- "Insufficient funds, API key is temporarily disabled")

**Uppskattning baserat på sajtens karaktär:**
- Traficator.se är en liten B2B-nischsajt i Getinge/Halmstad
- Sannolikt låg Domain Authority (uppskattningsvis DA 5-15)
- Troligen få refererande domäner (uppskattningsvis 10-30)
- Facebook-sida finns men med minimal aktivitet
- Inga LinkedIn- eller YouTube-profiler länkade

**Backlink-möjligheter:**
- Branschkataloger (allabolag.se, hitta.se, eniro.se)
- Lokala företagsregister (Halmstad kommun, Laholms kommun)
- Branschorganisationer (Svenskt Näringsliv, lokala handelskammare)
- Leverantörs- och kundwebbplatser
- Bloggartiklar om sourcing, import, metallbearbetning

---

## 4. Problem-lista (Prioriterad)

### KRITISKT (Måste åtgärdas omedelbart)

1. **Testsida indexeras** -- `/_test-2/` har `index, follow` och finns i sitemap
2. **"Våra tjänster" meta-beskrivning = "PROCESSEN"** -- helt felaktig
3. **Felaktig canonical på /en/** -- pekar på rotdomänen istället för `/en/`
4. **Saknar LocalBusiness-schema** -- kritiskt för lokal synlighet
5. **Duplett GTM-containrar** -- GTM-KRTLTBXM + GTM-TT4X9H5M kan skapa dataproblem

### HÖGT (Inom 2 veckor)

6. **Alla meta-beskrivningar avklippta** -- 7 av 10 sidor har avklippta eller felaktiga beskrivningar
7. **Saknar FAQPage-schema** -- FAQ-sidan har redan content, behöver bara markering
8. **Saknar Service-schema** -- tjänstesidorna (gjutning, bearbetning, övrigt)
9. **OG-bilder = dummy-1.jpg** -- 400x260 platshållarbild på de flesta sidor
10. **Titlar i VERSALER** -- GJUTNING, BEARBETNING, PROCESSEN etc.
11. **Författarnamn "admin-dev"** -- exponeras i schema och Twitter-taggar
12. **Stavfel i meta** -- "maskinbearbeting" på bearbetningssidan
13. **Saknar hreflang x-default**

### MEDEL (Inom 1 månad)

14. **Tunt innehåll** -- tjänstesidorna har uppskattningsvis 100-200 ord, bör ha 500+
15. **Saknar breadcrumbs** -- varken visuellt eller i schema
16. **Kontaktsidans meta-beskrivning** -- bara adress/telefon
17. **Bara 1 blogginlägg** -- behöver content marketing
18. **Författararkiv öppna** -- /author/admin-dev/ och /author/admin/
19. **WordPress-version exponerad** -- ta bort generator-meta
20. **xmlrpc.php öppen** -- säkerhetsrisk

### LÅGT (Inom 3 månader)

21. **PHP 8.1** -- uppgradera till 8.2 eller 8.3
22. **Engelska sidor inte kompletta** -- flera sidor saknar engelsk version
23. **Organization-schema saknar logo, adress, telefon**
24. **Saknar robots.txt-regler** för /author/, /_test-2/
25. **Kontaktformulär locale = en_US** -- bör vara sv_SE

---

## 5. Åtgärdsplan -- 3 månader

### Månad 1: Grundarbete (Teknisk SEO + On-Page Fix)

**Vecka 1-2: Akuta fixar**

| # | Uppgift | Detalj | Tid |
|---|---------|--------|-----|
| 1 | Ta bort testsida | Sätt noindex på `/_test-2/` ELLER radera helt. Ta bort från sitemap. Flytta ISO 9001-certifikat till rätt sida. | 30 min |
| 2 | Fixa alla meta-beskrivningar | Skriv unika, lockande beskrivningar (150-160 tecken) för alla 10 svenska sidor. | 2 tim |
| 3 | Fixa alla title-taggar | Byt från VERSALER till Normal Case. Inkludera nyckelord. Format: "Tjänst -- Kategori \| Traficator" | 1 tim |
| 4 | Fixa canonical på /en/ | Canonical ska peka på `https://traficator.se/en/` (inte rotdomänen) | 15 min |
| 5 | Lägg till hreflang x-default | Peka x-default på SV-versionen | 15 min |
| 6 | Ta bort duplett GTM | Behåll EN container (troligen GTM-TT4X9H5M via Site Kit), ta bort den andra | 30 min |
| 7 | Byt OG-bild | Skapa professionell OG-bild (1200x630px) med Traficator-logga + metallproduktbild | 1 tim |
| 8 | Ändra författarnamn | Byt "admin-dev" / "admin" till "Traficator International AB" eller riktiga namn | 15 min |

**Vecka 3-4: Strukturerad data**

| # | Uppgift | Detalj | Tid |
|---|---------|--------|-----|
| 9 | LocalBusiness-schema | Lägg till på startsidan och kontaktsidan: namn, adress (Öinge Lillegård 103, 305 77 Getinge), telefon, e-post, öppettider, geo-koordinater, logo | 1 tim |
| 10 | Service-schema | Lägg till på varje tjänstesida: serviceType, provider, areaServed, description | 2 tim |
| 11 | FAQPage-schema | Lägg till på FAQ-sidan med alla befintliga frågor och svar | 1 tim |
| 12 | BreadcrumbList-schema | Implementera breadcrumbs via Rank Math (Hem > Våra tjänster > Gjutning) | 1 tim |
| 13 | Fixa Organization-schema | Lägg till logo, address, telephone, contactPoint, sameAs (Facebook) | 30 min |
| 14 | Ta bort Article-schema från statiska sidor | Startsidan och tjänstesidor ska ha WebPage, inte Article | 30 min |

### Månad 2: Tillväxt (Innehåll + On-Page Optimering)

**Vecka 5-6: Innehållsutbyggnad**

| # | Uppgift | Detalj | Tid |
|---|---------|--------|-----|
| 15 | Utöka tjänstesidor till 500+ ord | Gjutning: skriv om tillverkningsmetoder, materialval, kvalitetskontroll. Bearbetning: CNC-processer, toleranser, material. | 4 tim |
| 16 | Omarbeta "Övrigt"-sidan | Byt namn till t.ex. "Övriga tjänster & specialprodukter". Skriv mer relevant text. | 2 tim |
| 17 | Skapa SEO-optimerad "Om oss"-text | Utöka med företagshistorik, certifieringar (ISO 9001), kundcitat, kompetensområden | 2 tim |
| 18 | Optimera kontaktsidans meta + H-taggar | Ny meta-beskrivning, tydlig H1, H2-hierarki | 30 min |
| 19 | Skapa H1-hierarki | Alla sidor ska ha en kort, nyckelordsfokuserad H1 | 1 tim |

**Vecka 7-8: Content Marketing -- Blogginlägg**

| # | Uppgift | Detalj | Tid |
|---|---------|--------|-----|
| 20 | Blogginlägg 1 | "Fördelar med material sourcing från Asien och Europa" (800+ ord) | 3 tim |
| 21 | Blogginlägg 2 | "Guide: Så väljer du rätt gjutningsmetod för din produkt" (800+ ord) | 3 tim |
| 22 | Blogginlägg 3 | "Kvalitetssäkring vid internationell sourcing -- ISO 9001" (800+ ord) | 3 tim |
| 23 | Blogginlägg 4 | "CNC-bearbetning vs traditionell bearbetning -- vad passar dig?" (800+ ord) | 3 tim |
| 24 | Intern länkning | Länka bloggartiklar till relevanta tjänstesidor och vice versa | 1 tim |

### Månad 3: Förfining (Off-Page + Lokal SEO + Mätning)

**Vecka 9-10: Lokal SEO & Off-Page**

| # | Uppgift | Detalj | Tid |
|---|---------|--------|-----|
| 25 | Google Business Profile | Verifiera/optimera GBP med alla uppgifter, bilder, inlägg | 2 tim |
| 26 | Branschkataloger | Registrera/uppdatera på: allabolag.se, hitta.se, eniro.se, 118100.se, merinfo.se | 2 tim |
| 27 | Halmstad-kataloger | Lokala företagskataloger, handelskammaren | 1 tim |
| 28 | LinkedIn-profil | Skapa/optimera företagssida med länk till sajten | 1 tim |
| 29 | Leverantörslänkar | Be befintliga leverantörer/partners länka till traficator.se | 2 tim |

**Vecka 11-12: Teknisk förfining & Mätning**

| # | Uppgift | Detalj | Tid |
|---|---------|--------|-----|
| 30 | Säkerhetsåtgärder | Stäng av xmlrpc.php, dölj WP-version, stäng författararkiv | 1 tim |
| 31 | robots.txt uppdatering | Lägg till Disallow för /author/, /_test-2/, /wp-json/ (selektivt) | 30 min |
| 32 | Engelska sidor | Komplettera saknade engelska versioner eller besluta om de ska finnas | 2 tim |
| 33 | Google Search Console-granskning | Verifiera indexering, kolla crawl-fel, sitemapstatus | 1 tim |
| 34 | Kontaktformulär locale | Byt CF7 till sv_SE | 15 min |
| 35 | Uppföljningsrapport | Mät förändringar i positioner, klick, impressions via GSC | 2 tim |

---

## 6. Nyckelordsstrategi (Förslag)

### A-nyckelord (Primära -- högt kommersiellt värde)

| Nyckelord | Uppskattad sv. | Målsida |
|-----------|----------------|---------|
| material sourcing | Låg (B2B-nisch) | Startsidan |
| gjutgods leverantör | Låg-Medel | /vara-tjanster/gjutning/ |
| sourcing metallprodukter | Låg | Startsidan |
| CNC-bearbetning leverantör | Medel | /vara-tjanster/bearbetning/ |
| gjutgods sverige | Låg | /vara-tjanster/gjutning/ |

### B-nyckelord (Sekundära)

| Nyckelord | Uppskattad sv. | Målsida |
|-----------|----------------|---------|
| sandgjutning leverantör | Mycket låg | /vara-tjanster/gjutning/ |
| metallbearbetning offert | Låg | /kontakt/ |
| sourcing asien | Medel | Startsidan / blogg |
| importera gjutgods | Låg | Blogg |
| kvalitetssäkring sourcing | Mycket låg | /vara-tjanster/processen/ |

### C-nyckelord (Informationella -- bloggtrafik)

| Nyckelord | Uppskattad sv. | Målsida |
|-----------|----------------|---------|
| vad är material sourcing | Medel | Blogg |
| gjutningsmetoder | Medel | Blogg |
| ISO 9001 gjutgods | Låg | Blogg |
| skillnad sandgjutning pressgjutning | Låg | Blogg |
| CNC-bearbetning fördelar | Medel | Blogg |

---

## 7. Meta-beskrivningar -- Förslag

| Sida | Föreslagen meta-beskrivning |
|------|-----------------------------|
| **Startsidan** | Traficator erbjuder kostnadseffektiv material sourcing av gjutgods, metallprodukter och stålkonstruktioner. Sänk era inköpskostnader med minst 25%. Begär offert! |
| **Våra tjänster** | Traficator levererar gjutning, CNC-bearbetning och stålkonstruktioner via kvalitetssäkrade producenter i Europa och Asien. Se våra tjänster. |
| **Gjutning** | Vi levererar maskinbearbetat gjutgods i hög kvalitet -- sandgjutning, kokillgjutning och pressgjutning i alla typer av metaller. ISO 9001-certifierat. |
| **Bearbetning** | CNC-bearbetning med 3-, 4- och 5-axliga maskiner. Vi erbjuder svarvning, fräsning, slipning och ytbehandling i stål, aluminium och mässing. |
| **Processen** | Från behov till leverans -- så fungerar vår sourcingprocess. Vi identifierar rätt leverantör, kvalitetssäkrar och hanterar hela logistikkedjan. |
| **Övrigt** | Utöver gjutgods och metallbearbetning erbjuder Traficator specialprodukter och lösningar via vårt breda internationella leverantörsnätverk. |
| **FAQ** | Vanliga frågor om material sourcing, gjutgods och metallprodukter. Hur fungerar Traficator? Vad kostar det? Vilka leveranstider gäller? |
| **Vi på Traficator** | Traficator International AB är ett familjeföretag i Getinge med lång erfarenhet av global sourcing. Möt teamet bakom leverantörslösningarna. |
| **Kontakt** | Kontakta Traficator för offert eller frågor om material sourcing. Besök oss på Öinge Lillegård i Getinge eller ring 035-282 01 40. |

---

## 8. Strukturerad data -- Föreslagna scheman

### LocalBusiness (startsidan + kontaktsidan)

```json
{
  "@type": "LocalBusiness",
  "@id": "https://traficator.se/#localbusiness",
  "name": "Traficator International AB",
  "description": "Material sourcing av metallprodukter -- gjutgods, bearbetning och stålkonstruktioner",
  "url": "https://traficator.se",
  "telephone": "+46-35-282-01-40",
  "email": "traficator@traficator.se",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "Öinge Lillegård 103",
    "postalCode": "305 77",
    "addressLocality": "Getinge",
    "addressCountry": "SE"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 56.859190,
    "longitude": 12.762401
  },
  "openingHoursSpecification": {
    "@type": "OpeningHoursSpecification",
    "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    "opens": "08:00",
    "closes": "17:00"
  },
  "sameAs": ["https://www.facebook.com/p/Traficator-International-AB-100063483596948/"]
}
```

### Service (per tjänstesida)

```json
{
  "@type": "Service",
  "name": "Gjutning av metallprodukter",
  "serviceType": "Metal Casting",
  "provider": {"@id": "https://traficator.se/#localbusiness"},
  "areaServed": ["SE", "EU"],
  "description": "Sandgjutning, kokillgjutning och pressgjutning i alla typer av metaller med ISO 9001-certifiering."
}
```

### FAQPage (FAQ-sidan)

```json
{
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Hur fungerar Traficators sourcingprocess?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Vi fungerar som en förlängning av er inköpsavdelning..."
      }
    }
  ]
}
```

---

## 9. Beräknad effekt

### Nuläge (uppskattning)

| Mätpunkt | Nuläge |
|----------|--------|
| Organisk trafik | ~20-50 besök/månad |
| Indexerade sidor | ~20 (inkl. testsida och engelska) |
| Nyckelord i top 10 | ~0-3 |
| Domain Authority | ~5-15 (uppskattning) |
| Tekniskt SEO-betyg | ~55/100 |

### Mål efter 3 månader

| Mätpunkt | Mål |
|----------|-----|
| Organisk trafik | 100-200 besök/månad (+200-300%) |
| Indexerade sidor | 25-30 (rensat + nya blogginlägg) |
| Nyckelord i top 10 | 5-10 |
| Nyckelord i top 50 | 20-40 |
| Domain Authority | 10-20 |
| Tekniskt SEO-betyg | 85+/100 |

### Förväntad tidslinje

| Period | Förväntad förändring |
|--------|---------------------|
| Vecka 1-4 | Tekniska fixar indexeras. Testsida försvinner. Schema-rich results kan dyka upp. |
| Vecka 5-8 | Förbättrade positioner för befintliga nyckelord. Nya blogginlägg börjar indexeras. |
| Vecka 9-12 | Backlinks börjar ge effekt. Lokal synlighet ökar. Bloggtrafik tillkommer. |
| 6 månader | "Material sourcing" och "gjutgods leverantör" på förstasidan (position 1-10) |

### Beräknad ROI

B2B-ledet innebär att varje konvertering (offertförfrågan) har högt värde. Med uppskattningsvis 1-3% konverteringsgrad:
- 100-200 besök/mån -> 1-6 offertförfrågningar/mån
- Genomsnittligt ordervärde B2B gjutgods: 50 000 - 500 000 kr
- En enda ny kund per kvartal motiverar hela SEO-investeringen

---

## 10. Sammanfattning av prioriterade åtgärder

```
VECKA 1:   Ta bort testsida + fixa meta + fixa canonical + ta bort duplett GTM
VECKA 2:   Fixa OG-bilder + ändra författarnamn + H1-optimering
VECKA 3-4: LocalBusiness + Service + FAQPage + BreadcrumbList schema
VECKA 5-6: Utöka tjänstesidors innehåll till 500+ ord
VECKA 7-8: 4 blogginlägg + intern länkning
VECKA 9-10: GBP + branschkataloger + LinkedIn + leverantörslänkar
VECKA 11-12: Säkerhet + uppföljning + GSC-granskning
```

---

*Rapport genererad av Searchboost.se -- 2026-02-15*
