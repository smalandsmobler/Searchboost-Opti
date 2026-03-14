# Atgardsplan: Ferox Konsult AB (feroxkonsult.se)

> Genererad: 2026-03-03
> Auditor: Searchboost.se
> Period: 3 manader (mars--maj 2026)
> Forutsattning: Shopify-migrationen genomfors parallellt / ar genomford
> Kontakt kund: Andreas Sternberg (Andreas.Sternberg@feroxkonsult.se)

---

## Overblick

Denna atgardsplan bygger pa SEO-auditen (28/100) och ABC-nyckelordslistan for Ferox Konsult AB. Planen ar strukturerad i tre faser:

- **Manad 1**: Teknisk SEO + On-Page-grund (Shopify-lansering)
- **Manad 2**: Innehallsoptimering + Backlinks
- **Manad 3**: Tillvaxt, blogg och lopande optimering

### Mal

| Mal | Nuvarande | 3 man | 6 man |
|-----|-----------|-------|-------|
| SEO-betyg | 28/100 | 70/100 | 85/100 |
| Organisk trafik/man | < 50 klick | 150+ klick | 400+ klick |
| Top 10-nyckelord | 0 | 5-8 | 15+ |
| Indexerade sidor | ~49 (Hemsida24) | 15-20 (Shopify) | 25-30 (med blogg) |
| Bloggartiklar | 0 | 3 | 8-10 |

---

## Manad 1: Teknisk SEO + On-Page (Shopify-lansering)

> Fokus: Saker migration, teknisk grund, ingen trafiktapp

### Vecka 1: SSL, Redirects, Grundlaggande SEO

| Dag | Uppgift | Ansvarig | Status |
|-----|---------|----------|--------|
| Man | Konfigurera SSL for bade apex (feroxkonsult.se) och www | Viktor/Andreas | |
| Man | Satt upp 301-redirect: apex -> www (eller tvartom) | Viktor | |
| Tis | Implementera ALLA ~45 st 301-redirects (gamla URL -> nya) | Viktor | |
| Tis | Testa varje redirect -- verifiera att inga ger 404 | Viktor | |
| Ons | Satt unika title-taggar pa alla 11 sidor (se SEO-metadata-dok) | Viktor | |
| Ons | Satt unika meta-beskrivningar pa alla 11 sidor | Viktor | |
| Tor | Kontrollera att varje sida har exakt 1 H1 med primara nyckelord | Viktor | |
| Tor | Satt alt-text pa ALLA bilder (produkter + hero + screenshots) | Viktor | |
| Fre | Product-schema -- verifiera att Shopify-tema genererar korrekt JSON-LD | Viktor | |
| Fre | Testa sajten i Google Rich Results Test | Viktor | |

**Leverabler vecka 1:**
- Alla redirects pa plats och verifierade
- Title + meta description pa alla sidor
- En H1 per sida
- Alt-text pa alla bilder
- Product-schema fungerar

### Vecka 2: Schema Markup, Analytics, GSC

| Dag | Uppgift | Ansvarig | Status |
|-----|---------|----------|--------|
| Man | Lagg till Organization JSON-LD schema pa alla sidor (via tema) | Viktor | |
| Man | Lagg till LocalBusiness schema pa startsida + kontakt | Viktor | |
| Tis | Lagg till SoftwareApplication schema pa tidredovisningssidan | Viktor | |
| Tis | Installera GA4 via Shopify Google-kanal eller GTM | Viktor | |
| Ons | Verifiera sajten i Google Search Console (DNS eller meta-tagg) | Viktor/Andreas | |
| Ons | Skicka ny sitemap.xml till GSC | Viktor | |
| Tor | Satt upp Google Business Profile -- uppdatera URL, adress, oppettider | Andreas | |
| Tor | Kontrollera att OG-taggar fungerar (Facebook Debugger) | Viktor | |
| Fre | Breadcrumb-navigering -- implementera med BreadcrumbList-schema | Viktor | |
| Fre | Intern lankning -- koppla relaterade sidor till varandra | Viktor | |

**Leverabler vecka 2:**
- Schema markup (Organization, LocalBusiness, SoftwareApplication)
- GA4 + GSC konfigurerade
- Google Business Profile uppdaterad
- Breadcrumbs fungerar

### Vecka 3: Produktsidor, Kollektioner, Mobiltest

| Dag | Uppgift | Ansvarig | Status |
|-----|---------|----------|--------|
| Man | Optimera SEO title + description pa alla 17 produkter | Viktor | |
| Man | Optimera SEO title + description pa alla 4 kollektioner | Viktor | |
| Tis | Verifiera produktschema -- pris, lagerstatus, SKU korrekt | Viktor | |
| Tis | Lagga till produktbeskrivningar med nyckelord (B-klass) | Viktor | |
| Ons | Mobiltest -- kontrollera alla sidor i Google Mobile-Friendly Test | Viktor | |
| Ons | PageSpeed Insights -- mal > 90 pa bade mobil och desktop | Viktor | |
| Tor | Korrigera eventuella pagespeed-problem (bilder, scripts, CSS) | Viktor | |
| Fre | Robots.txt -- verifiera att Shopify-default ar korrekt | Viktor | |

**Leverabler vecka 3:**
- Alla produkter och kollektioner SEO-optimerade
- Mobilvanlighet verifierad
- PageSpeed > 90

### Vecka 4: Kontroll, Korrigering, Forsta Blogg

| Dag | Uppgift | Ansvarig | Status |
|-----|---------|----------|--------|
| Man | Kontrollera indexeringsstatus i GSC (vilka sidor ar indexerade?) | Viktor | |
| Man | Identifiera och atgarda crawl-errors i GSC | Viktor | |
| Tis | Kontrollera att ALLA gamla URL:er redirectar korrekt (manuellt test) | Viktor | |
| Tis | Testa 5 viktiga sokord i Google -- noterar nuvarande position | Viktor | |
| Ons | Skriv + publicera blogg 1: "Personalliggare 2026 -- allt du behover veta" | Searchboost | |
| Tor | Skriv + publicera blogg 2: "Hur valjer man ratt stampelklocka?" | Searchboost | |
| Fre | Skriv + publicera blogg 3: "Tidredovisning for smaforetag" | Searchboost | |

**Leverabler vecka 4:**
- Indexeringskontroll genomford
- 3 bloggartiklar publicerade
- Baslinjepositioner noterade

---

## Manad 2: Innehallsoptimering + Backlinks

> Fokus: Bygga auktoritet, expandera innehall, forsta backlinks

### Vecka 5: Innehallsexpansion

| Uppgift | Beskrivning | Ansvarig |
|---------|-------------|----------|
| Expandera "Narvarotabla"-sidan | Fran ~100 till 300+ ord. Lagg till funktionsbeskrivning, screenshots, fordelar | Viktor |
| Expandera "Demonstration"-sidan | Lagg till case studies, FAQ, forvantningshantering, video | Viktor |
| Expandera "Personalregister"-sidan | Lagg till funktionsdetaljer, screenshots, GDPR-koppling | Viktor |
| Skriv blogg 4: "Personalliggare for restaurang" | Branschspecifik guide, Skatteverkets krav, losning med FeroxTid | Searchboost |
| Skriv blogg 5: "Basta tidredovisningssystem 2026" | Jamforelseartikel med FeroxTid, Flex HRM, Planday etc. | Searchboost |

### Vecka 6: Backlinks & Kataloger

| Uppgift | Beskrivning | Ansvarig |
|---------|-------------|----------|
| Registrera pa Eniro.se | Foretag + oppettider + lanking | Andreas |
| Registrera pa Hitta.se | Foretag + kontaktinfo | Andreas |
| Registrera pa Allabolag.se | Verifiera foretagsinfo | Andreas |
| Kontakta Seiko Nordic | Be om leverantorslankning till feroxkonsult.se | Andreas |
| Identifiera 5 branschkataloger | Tidredovisning, HRM, kontorsutrustning | Searchboost |
| Registrera pa 3-5 branschkataloger | Med konsekvent NAP-information | Andreas |

### Vecka 7: Intern Lankning & Anvandarsignaler

| Uppgift | Beskrivning | Ansvarig |
|---------|-------------|----------|
| Intern lankningstrategi | Koppla bloggartiklar till produktsidor och tjanstsidor | Viktor |
| CTA-optimering | Kontrollera att varje sida har tydlig CTA (Ring, Boka demo, Kop) | Viktor |
| Kontaktformular-optimering | Forenkla formularet, lagg till amnesval | Viktor |
| FAQ-schema | Lagg till FAQPage-schema pa GDPR-sidan och support-sidan | Viktor |
| Skriv blogg 6: "Exportera tid till Fortnox" | Steg-for-steg-guide med screenshots | Searchboost |

### Vecka 8: Positionskontroll & Justering

| Uppgift | Beskrivning | Ansvarig |
|---------|-------------|----------|
| GSC-rapport | Exportera data -- klick, impressions, positioner for A-nyckelord | Searchboost |
| Positionsjamforelse | Jamfor med baslinjen fran vecka 4 | Searchboost |
| Identifiera quick wins | Nyckelord pa position 8-20 som kan pushas till top 5 | Searchboost |
| Justerad title-taggar | Uppdatera titlar pa sidor med potential (baserat pa GSC-data) | Viktor |
| Skriv blogg 7: "Personalliggare i byggbranschen" | Skatteverkets krav, FeroxTid som losning | Searchboost |

**Leverabler manad 2:**
- 3 tunna sidor expanderade
- 4 nya bloggartiklar (totalt 7)
- 6+ backlinks fran kataloger
- Leverantorslankning fran Seiko (om mojligt)
- FAQ-schema pa 2 sidor
- Intern lankning forstarkt
- Forsta positionsrapport

---

## Manad 3: Tillvaxt & Lopande Optimering

> Fokus: Skala innehall, finslipa positioner, bygga konverteringsfunnel

### Vecka 9: Avancerad Innehallsstrategi

| Uppgift | Beskrivning | Ansvarig |
|---------|-------------|----------|
| Skriv blogg 8: "Exportera tid till Visma Lon" | Integrationsguide | Searchboost |
| Skriv blogg 9: "GPS-stampling -- for foretag pa falt" | Funktion + fordelar + FeroxTid | Searchboost |
| Skriv blogg 10: "Elektronisk vs pappersbaserad personalliggare" | Jamforelse + FeroxTid | Searchboost |
| Skapa landningssida "Personalliggare" | Dedicerad sida som riktar sig mot A-nyckeln | Viktor |
| Video-innehall | Spelela in kort produktdemo av FeroxTid (for blogg + YouTube) | Andreas |

### Vecka 10: Teknisk Finslipning

| Uppgift | Beskrivning | Ansvarig |
|---------|-------------|----------|
| Core Web Vitals-check | LCP, FID, CLS -- alla < Google-trosklar | Viktor |
| Bildoptimering | Konvertera till WebP, lazy loading, ratt dimensioner | Viktor |
| Schema-validering | Testa alla schema-typer i Rich Results Test | Viktor |
| 404-kontroll | Identifiera och atgarda eventuella 404:or i GSC | Viktor |
| Duplikatinnehall-kontroll | Kontrollera att inga canonical-konflikter finns | Viktor |

### Vecka 11: Konverteringsoptimering

| Uppgift | Beskrivning | Ansvarig |
|---------|-------------|----------|
| Satt upp konverteringsmal i GA4 | Telefonklick, e-postklick, formularinsandning, kopklick | Viktor |
| A/B-test CTA-knappar | Testa "Boka demo" vs "Bestall nu" vs "Ring oss" | Searchboost |
| Exit-intent popup | Erbjud demo-bokning for besokare som lamnar | Viktor |
| Produktsides-optimering | Lagg till "Relaterade produkter", korsforsal jning | Viktor |
| Recensioner/Testimonials | Be befintliga kunder om recensioner (Google, sajten) | Andreas |

### Vecka 12: Rapport & Nasta Steg

| Uppgift | Beskrivning | Ansvarig |
|---------|-------------|----------|
| Fullstandig GSC-rapport | 3 manaders data -- klick, impressions, positioner | Searchboost |
| Trafikrapport | GA4 -- sessioner, anvandare, konverteringar | Searchboost |
| Positionsrapport | Alla A+B-nyckelord -- nuvarande vs startposition | Searchboost |
| ROI-berakning | Uppskattad vardet av organisk trafik i kr | Searchboost |
| Atgardsplan manad 4-6 | Planera nasta kvartal baserat pa resultat | Searchboost |
| Kundpresentation | Sammanstall resultat i presentation for Andreas | Searchboost |

**Leverabler manad 3:**
- 3 nya bloggartiklar (totalt 10)
- Dedicerad personalliggare-landningssida
- Core Web Vitals optimerade
- Konverteringsmal i GA4
- Fullstandig 3-manadersrapport
- Plan for manad 4-6

---

## Budgetrekommendation

### Alternativ 1: Basic (5 000 kr/man)
- Teknisk SEO-genomgang och fixar
- 2 bloggartiklar/man
- Manadsrapport
- Telefonuppfoljning

### Alternativ 2: Standard (7 500 kr/man) -- REKOMMENDERAS
- Allt i Basic
- 4 bloggartiklar/man
- Backlank-byggande (kataloger + outreach)
- Positionsovervakning (A+B nyckelord)
- Konverteringsoptimering
- Veckorapport

### Alternativ 3: Premium (12 000 kr/man)
- Allt i Standard
- 6+ bloggartiklar/man
- Avancerad backlank-strategi
- Teknisk SEO-lopande (schema, pagespeed)
- Konkurrentbevakning
- GA4-analys och insikter
- Prioriterad support

### Engangskostnader (utover manadsavtal)
| Post | Kostnad |
|------|---------|
| Shopify-migration (teknisk SEO-del) | Ingår i Shopify-bygget |
| 301-redirect-setup (~45 st) | Ingår i Shopify-bygget |
| Schema markup (Organization, LocalBusiness, Software) | 2 000 kr |
| GA4 + GSC-setup | 1 500 kr |
| Google Business Profile-optimering | 500 kr |

---

## Risker och Beroenden

| Risk | Konsekvens | Mitigation |
|------|-----------|------------|
| Shopify-migration forsenad | Hela planen forskjuts | Forbered SEO-material parallellt |
| Forlorade redirects vid lansering | Trafiktapp 30-50% | Dubbeltesta ALLA redirects |
| Google sand-box (ny doman/CMS) | Tillfalling positionsforlust | Forvanta 2-4 veckors stabilisering |
| Kunden gar inte att na (Andreas) | Backlink-arbete stannar | Satt forvantan pa regelbunden kontakt |
| SE Ranking API nere | Ingen positionstracking | Anvand GSC som alternativ |
| SSL-problem persisterar | Google indexerar inte sajten | Prioritera SSL-fix dag 1 |

---

## KPI:er och Uppfoljning

### Veckovis (rapporteras till kund)
- Antal indexerade sidor i GSC
- Totala klick + impressions fran GSC
- Publicerade bloggartiklar

### Manadsvis (rapporteras till kund)
- Positioner for alla A-nyckelord
- Total organisk trafik (GA4)
- Konverteringar (telefonklick, formular, kopklick)
- Nya backlinks
- SEO-betyg (Searchboost intern bedomning)

### Kvartalsvis (strategisk review)
- ROI-berakning (trafikvarde i kr)
- Konkurrentjamforelse
- Nyckelordsutveckling (nya mojligheter)
- Uppdaterad ABC-lista
- Plan for nasta kvartal

---

## Sammanfattning

| Manad | Fokus | Leverabler |
|-------|-------|------------|
| 1 | Teknisk SEO + On-Page | SSL, redirects, title/meta, schema, GA4, GSC, 3 bloggar |
| 2 | Innehall + Backlinks | Expandera tunna sidor, 4 bloggar, 6+ kataloganmalningar, FAQ-schema |
| 3 | Tillvaxt + Konvertering | 3 bloggar, CWV-optimering, konverteringsmal, 3-manadersrapport |

**Total uppskattad investering (Standard-paket):**
- Engangskostnad: ~4 000 kr (schema, GA4, GBP)
- Manadsavtal: 7 500 kr/man x 3 = 22 500 kr
- **Totalt 3 manader: ~26 500 kr**

**Forvantad avkastning:**
- Fran < 50 till 400+ organiska klick/man inom 6 manader
- Top 10-positioner for 5-8 A/B-nyckelord
- Forstarkt varumarkessynlighet i Google
- Lopande leads via blogg och forbattrade positioner

---

*Atgardsplan genererad av Searchboost.se -- 2026-03-03*
