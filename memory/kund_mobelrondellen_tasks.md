# mobelrondellen — Tasks & Status

> Kund: mobelrondellen.se | GSC: OK | WP-creds: OK
> Senast uppdaterad: 2026-05-08

## Regressionsvarningar

_Ingen data — Blockerad (2026-05-09):_
- _EC2-API ej nåbar från sandbox (TLS-proxy-block)_
- _Supermetrics GSC ej autentiserad — se kund_searchboost_tasks.md för ny inloggningslänk (2026-05-09)_

**Åtgärd:** Logga in Supermetrics (länk i kund_searchboost_tasks.md) eller kör `node scripts/regression-check.js` på EC2.

Senaste check: 2026-05-09

## Publicerade artiklar

| Datum | Titel | URL |
|-------|-------|-----|
| 2026-04-29 | Fåtölj guide 2026 | https://mobelrondellen.se/blog/fatolj-guide-2026/ |
| 2026-05-08 | Bästa soffan 2026 — guide för dig som vill ha kvalitet och hållbarhet | ⏳ Kör `node scripts/publish-mobelrondellen-soffa-2026.js` från EC2 |

## Utfört arbete (historik)
- Plugin-cleanup: 325 → 7 plugins
- Kontaktsida: CF7-formulär städat
- Varumärken-sida: HTML-grid med 18 varumärken
- Slider Revolution: verifierad OK

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-06

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| Skriv köpguide: "Bästa soffan 2026 — guide för dig som vill ha kvalitet" | **HÖG** | Furniturebox/Trademax saknar rådgivande innehåll — gap att fylla |
| Lokalt SEO-inlägg: "Möbler Mora — vad du bör tänka på" | **HÖG** | Inga konkurrenter har lokalt innehåll för Mora/Dalarna |
| Komplettera fåtölj-guiden med Product + FAQ schema | Medel | Ingen konkurrent har schema på köpguider |

## Internlänkanalys — 2026-05-08

> Analysmetod: Crawlat live-sidan med Mozilla-useragent (kringgår Sucuri WAF).
> Perispa saknas — implementera manuellt i WP-admin via Blockeditor.

### Fynd: Öar & svaga sidor

| Sida | Inkommande interna | Problem |
|------|--------------------|--------|
| `/inspiration/` | Noll från innehållssidor | **Ö** — bara footerlänk från andra sidor |
| `/varumarken-englesson/` | Bara leverantorer + buhrens (trasig URL) | Svag — guide-poster länkar ej hit |
| `/varumarken-rowico/` | Bara leverantorer | Svag — soffa-guiden länkar ej hit |
| `/2026/04/29/fatolj-guide-2026/` | 0 inkommande (utom kategorilista) | Svag — inspiration länkar ej dit |
| Lokalitetssidor (9 st) | Bara 3-4 grannstäder | Svag klustring, ej länkade till content |

### Länkmöjligheter identifierade (9 st, max 3/sida)

| Från-sida | Till-sida | Ankartext | Prioritet |
|-----------|-----------|-----------|----------|
| `/inspiration/` | `/2026/04/27/kopa-soffa-guide-2026-2/` | välj rätt soffa för hemmet | HÖG |
| `/inspiration/` | `/2026/04/29/fatolj-guide-2026/` | guide till att välja fåtölj | HÖG |
| `/inspiration/` | `/2026/04/29/matbord-guide-2026/` | hitta rätt matbord | HÖG |
| `/2026/04/29/fatolj-guide-2026/` | `/varumarken-buhrens/` | Buhrens fåtöljer hos Möbelrondellen | HÖG |
| `/2026/04/29/fatolj-guide-2026/` | `/inspiration/` | möbelinspiration för hemmet | Medel |
| `/2026/04/29/matbord-guide-2026/` | `/varumarken-englesson/` | Englesson matbord | HÖG |
| `/2026/04/29/matbord-guide-2026/` | `/2026/04/27/matgrupp-guide-matbord-stolar/` | matgrupp med bord och stolar | Medel |
| `/mobler-mora/` | `/2026/04/27/kopa-soffa-guide-2026-2/` | guide till att köpa soffa | Medel |
| `/2026/04/27/kopa-soffa-guide-2026-2/` | `/varumarken-rowico/` | Rowico soffor i skandinavisk design | HÖG |

### Implementeringsstatus

| # | Länk | Status | Datum |
|---|------|--------|-------|
| 1 | inspiration → soffa-guide | ⏳ Väntar (perispa saknas) | — |
| 2 | inspiration → fåtölj-guide | ⏳ Väntar | — |
| 3 | inspiration → matbord-guide | ⏳ Väntar | — |
| 4 | fåtölj-guide → varumarken-buhrens | ⏳ Väntar | — |
| 5 | fåtölj-guide → inspiration | ⏳ Väntar | — |
| 6 | matbord-guide → varumarken-englesson | ⏳ Väntar | — |
| 7 | matbord-guide → matgrupp-guide | ⏳ Väntar | — |
| 8 | mobler-mora → soffa-guide | ⏳ Väntar | — |
| 9 | soffa-guide → varumarken-rowico | ⏳ Väntar | — |

**Blocker**: perispa_* MCP-verktyg ej konfigurerade. Alternativ: manuellt i WP-admin Blockeditor.

### Manuell implementeringsguide (WP-admin)
1. Gå till mobelrondellen.se/wp-admin → Sidor → Inspiration (ID 5537)
2. Hitta avsnittet med kategoriknappar/guider → lägg till textblock: "Läs våra guider: [välj rätt soffa för hemmet], [guide till att välja fåtölj], [hitta rätt matbord]"
3. Inlägg → Fåtölj 2026 (ID 5614) → lägg till i slutsektionen: "... hos [Buhrens fåtöljer hos Möbelrondellen] hittar du..." + "Se mer [möbelinspiration för hemmet]"
4. Inlägg → Matbord 2026 (ID 5611) → lägg till: "[Englesson matbord] är ett populärt val..." + länk till matgrupp-guide
5. Sidor → Möbler Mora (ID 5413) → lägg till i bodytexten: "Läs vår [guide till att köpa soffa]"
6. Inlägg → Köpa soffa (ID 5503) → lägg till: "Vi säljer bl.a. [Rowico soffor i skandinavisk design]..."

## Status
- WP-creds: OK
- GSC: OK (https://www.mobelrondellen.se/)
- OBS: Sucuri WAF — curl ger HTTP 455 men sidan fungerar i browser
