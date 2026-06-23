# Djup SEO & Konkurrensanalys — mavis.se

**Datum:** 2026-05-03
**Utförd av:** Searchboost.se
**Kontakt:** mikael@searchboost.se

---

## 1. Sajtöversikt

| Parameter | Värde |
|-----------|-------|
| **Domän** | mavis.se (→ www.mavis.se) |
| **Plattform** | Umbraco CMS |
| **Språk** | Svenska (sv-SE) + Engelska (/en/) |
| **Grundat** | 1917 (Bröderna Johansson Sängfabrik AB, namnbyte 2008) |
| **HQ** | Värnamovägen 1, 333 31 Smålandsstenar |
| **Produktion** | Lettland/Litauen |
| **Kontakt** | info@mavis.se |
| **Antal indexerade sidor** | ~90 (baserat på sitemap-mapping) |

---

## 2. Teknisk SEO — Kritiska problem

### RÖTT (kritiskt)

| # | Problem | Påverkan |
|---|---------|----------|
| 1 | **Ingen robots.txt** (404) | Google har ingen crawl-guidance, kan indexera dubbletter |
| 2 | **Ingen sitemap.xml** (404) | Google upptäcker inte alla sidor effektivt |
| 3 | **Ingen schema markup** (0 schema-typer) | Inga rich snippets i SERP — förlorar CTR mot konkurrenter med Product/Organization schema |
| 4 | **8 av 12 bilder saknar alt-text** (67%) | Tillgänglighetsproblem + förlorad bild-SEO |
| 5 | **Canonical pekar fel** — startsidans canonical pekar till `/sv/om-osshistoria/` | Google kan ignorera startsidan som primär URL |
| 6 | **Ingen meta description i HTML** — title "Mavis - Made in Our World" utan riktig description | Google genererar snippets själv = inkonsekvent SERP-representation |

### GULT (förbättringar)

| # | Problem | Påverkan |
|---|---------|----------|
| 7 | **Duplicerat content** — svenska + engelska utan korrekt hreflang-implementation | Potentiell keyword-kannibalisering |
| 8 | **Flera H1-taggar** på startsidan (3 st "Made in Our World") | Förvirrar Google om sidans primära ämne |
| 9 | **Mycket tunn content** — startsidan har nästan bara bilder och produktlänkar | Google värderar texttungt content för ranking |
| 10 | **Ingen blogg/content hub** | Ingen organisk trafik-motor för informationssökningar |
| 11 | **Bara 12 interna länkar** på startsidan | Svag intern länkstruktur |
| 12 | **Produktsidorna saknar priser i synlig text** | Går miste om prissökningar |

---

## 3. Content-analys

### Styrkor
- Stark varumärkeshistoria (sedan 1917)
- Bra formgivar-sidor med korta bios
- Tydliga kollektionssidor med produktfamiljer
- Tvåspråkig sajt (sv/en)
- FSC-certifierat trä + miljöprofil

### Svagheter
- **0 blogginlägg / guider / artiklar** — ingen content-marketing
- **Ingen FAQ-sektion**
- **Inga kundrecensioner/testimonials** på sajten
- **Om oss-sidan** blandar historia + GDPR + cookies i samma sida (bör separeras)
- **Produkttexter** extremt korta — ofta bara 1-2 meningar
- **Inga sökord i URL-slugs** på kollektionssidor

---

## 4. Konkurrenslandskap

| Konkurrent | URL | Styrka vs Mavis |
|-----------|-----|-----------------|
| **Norrgavel** | norrgavel.se | E-handel direkt, starkare SEO-title, Google-verifierad sajt, tydlig meta description |
| **Karl Andersson & Söner** | karl-andersson.se | Handgjort i Huskvarna sedan 1898, liknande premiumpositionering |
| **Stolab** | stolab.se | Massivträmöbler, skandinavisk design, egen produktion i Sverige |
| **Swedese** | swedese.se | Bredare sortiment, starkare digital närvaro, e-handel |
| **Källemo** | kallemo.se | Konstnärlig design, starkare varumärkesidentitet online |
| **DUX** | dux.se | Dominerar "premium" sökord, stark content-strategi |

### Mavis vs Norrgavel (djupjämförelse)

| Faktor | Mavis | Norrgavel |
|--------|-------|-----------|
| Meta description | Saknas | "Upptäck funktionell och vacker design..." (optimerad) |
| Schema markup | Ingen | Ingen |
| Google Search Verification | Nej | Ja |
| E-handel | Nej (bara återförsäljare) | Ja (direkt köp) |
| Bloggsida | Nej | Nej |
| Pinterest-verifiering | Nej | Ja |
| Facebook-verifiering | Nej | Ja |

---

## 5. Keyword-möjligheter

Mavis borde ranka för dessa sökord men gör det troligen inte (pga content-brist):

| Sökord | Sökvolym (uppskattad) | Svårighet | Nuvarande ranking |
|--------|----------------------|-----------|-------------------|
| "svenska designmöbler" | 500/mån | Medel | Saknas troligen |
| "matbord massivt trä" | 1000/mån | Hög | Förmodligen ej topp 20 |
| "skandinaviska byråer" | 300/mån | Medel | Okänt |
| "mavis möbler" (varumärke) | 200/mån | Låg | Bör ranka #1 |
| "hållbara möbler sverige" | 400/mån | Medel | Saknas troligen |
| "shakerstol design" | 150/mån | Låg | Möjlig via Rod-stolen |
| "möbel småland" | 100/mån | Låg | Bör vara lättvinst |

---

## 6. Prioriterad åtgärdslista

### P1 — Gör NU (vecka 1-2)

1. **Skapa robots.txt**
   ```
   User-agent: *
   Allow: /
   Sitemap: https://www.mavis.se/sitemap.xml
   ```

2. **Skapa sitemap.xml** — lista alla ~90 sidor (sv + en)

3. **Fixa canonical-taggen** på startsidan — ska peka till `https://www.mavis.se/` (inte om-oss)

4. **Skriv meta descriptions** på ALLA sidor — börja med startsidan:
   - Title: `Mavis Möbler — Svensk design sedan 1917 | Handgjorda trämöbler`
   - Description: `Mavis designar tidlösa möbler i massivt trä sedan 1917. Byråer, matbord, stolar och förvaring. Formgivet i Sverige, tillverkat i Nordeuropa med FSC-certifierat trä.`

5. **Lägg till alt-text** på alla bilder (67% saknar)

6. **Fixa H1-strukturen** — EN H1 per sida

### P2 — Denna månad (vecka 2-4)

7. **Product-schema (JSON-LD)** på alla produktsidor — namn, bild, beskrivning, varumärke
8. **Organization-schema** på startsidan — Mavis Möbler AB, adress, logo
9. **Separera GDPR/integritetspolicy** till egen sida (bort från Om oss)
10. **Hreflang-implementation** — verifiera att sv/en pekar rätt på alla sidor
11. **Intern länkningsstrategi** — footer med alla kategorier + korshenvisningar mellan kollektioner

### P3 — Nästa månad

12. **Starta blogg/inspirationssida** — 2 artiklar/månad:
    - "Så väljer du rätt matbord i massivt trä"
    - "Shakerstilen — tidlös skandinavisk design"
    - "Så sköter du dina oljade ekmöbler"
    - "Mavis historia — från sängfabrik till designmöbler"

13. **Skapa "Så köper du"-sida** — lista återförsäljare med karta + e-handelspartners med direktlänkar

14. **FAQ-schema** på Om oss och Material & skötsel

15. **Google Business Profile** — om de har showroom/kontor, optimera GBP

---

## 7. Snabb ROI-bedömning

| Åtgärd | Insats | Förväntad effekt |
|--------|--------|-----------------|
| robots.txt + sitemap | 1 timme | +20-30% indexering |
| Meta descriptions alla sidor | 4 timmar | +15-25% CTR från SERP |
| Schema markup | 3 timmar | Rich snippets = +30% CTR |
| Canonical-fix | 30 min | Stoppar ranking-läckage |
| Alt-text | 2 timmar | Bild-trafik + tillgänglighet |
| 4 bloggartiklar | 2 dagar | +500-1000 organiska besök/mån inom 3 mån |

---

## 8. Sammanfattning

**Mavis har ett fantastiskt varumärke och historia** men deras digitala närvaro är extremt underutvecklad för 2026. De saknar grundläggande SEO-hygien (robots.txt, sitemap, schema, meta descriptions) som alla konkurrenter borde ha.

**Största möjligheten**: Content-marketing. Det finns NOLL blogginlägg — varje artikel de publicerar om skandinavisk design, materialval, eller möbelvård blir en ny ingång från Google. Med sin historia sedan 1917 och FSC-certifiering har de starka E-E-A-T-signaler som Google premierar.

**Största risken**: Att återförsäljarna (RoyalDesign, Länna Möbler, Nilssons, etc.) rankar högre än mavis.se för deras egna produktnamn — redan idag syns återförsäljarna mer i sökresultaten.

---

## 9. Rekommenderat paket — Searchboost

| Paket | Innehåll | Pris/mån |
|-------|----------|----------|
| **Start** | Teknisk SEO-fix (P1 + P2), meta på alla sidor, schema markup | Engångskostnad |
| **Growth** | Start + 4 artiklar/mån + löpande optimering + veckorapport | Löpande |
| **Scale** | Growth + konkurrentbevakning + AEO-optimering + kvartalsgenomgång | Löpande |

---

*Rapporten är genererad av Searchboost.se med data från Firecrawl, Google SERP-analys och manuell granskning.*
