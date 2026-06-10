# mobelrondellen — Tasks & Status

> Kund: mobelrondellen.se | GSC: OK | WP-creds: OK
> Senast uppdaterad: 2026-06-10

## Regressionsvarningar

_Ingen data — Blockerad (2026-06-09, **19 körningar i rad** — 14/16/18/19/20/21/22/23/26/27/28/30 maj + 2/3/5/6/7/8/9 jun):_
- _EC2-API: Ej nåbar från remote environment (self-signed TLS / Envoy-proxy, `-k` fungerar ej — bekräftad 2026-06-09)_
- _Supermetrics GSC (ds\_id: GW): **FINNS** men NOT\_AUTHENTICATED — kräver engångsinloggning av Mikael_
- _AWS CLI saknas → kan ej hämta BigQuery-credentials från SSM_

**⚠️ KRITISK BLOCKERARE:** Se kund_searchboost_tasks.md — Supermetrics GSC-autentisering = snabbaste fix (2 min).

Senaste check: 2026-06-09

## Internlänk-optimering — 2026-05-22

**Analys:** 47 poster analyserade. Alla använde JSON-escaped hrefs (renderade via Python).

| Post | Slug | Interna (före) | Interna (efter) |
|------|------|---------------|----------------|
| 5292 | kopa-madrass-guide-2026-2 | 0 (ö!) | 2 |
| 5505 | basta-madrassen-guide-2026 | 1 (svag) | 2 |
| 5503 | kopa-soffa-guide-2026-2 | 2 | 3 |
| 5528 | nattduksbord-2026-... | 2 | 3 |
| 5529 | matta-till-vardagsrummet-... | 2 | 3 |
| 5538 | skank-sideboard-2026-... | 2 | 3 |
| 5539 | sanggavel-2026-... | 2 | 3 |
| 5540 | inreda-hall-2026-... | 1 (svag) | 2 |

**Tillagda länk (9 st) — körs via `node scripts/internlankar-mobelrondellen.js` på EC2:**

| Från-post | Ankartext | Till-post | Motivering |
|-----------|-----------|-----------|------------|
| 5292 kopa-madrass-guide-2026-2 | "sängen" | sang-guide-2026 | Ö → naturlig koppling sängen↔madrass |
| 5292 kopa-madrass-guide-2026-2 | "sovrum" | sovrum-inredning-guide | Ö → storlekssektion nämner sovrum |
| 5505 basta-madrassen | "sängen" | sang-guide-2026 | Svag → stärker madrass/säng-kluster |
| 5503 kopa-soffa | "fåtöljer" | fatolj-guide-2026 | "kombinera med fåtöljer" — naturlig |
| 5528 nattduksbord | "förvaring" | forvaring-sovrum-guide | "stil och förvaring" — naturlig |
| 5529 matta-till-vardagsrummet | "soffa" | kopa-soffa-guide-2026-2 | "åtminstone soffa och fåtöljer" |
| 5538 skank-sideboard | "förvaring" | forvaring-sovrum-guide | "kombinerar förvaring med stil" |
| 5539 sanggavel-2026 | "sängen" | sang-guide-2026 | "ramar in sängen" — naturlig |
| 5540 inreda-hall-2026 | "sideboard" | skank-sideboard-2026 | "Sideboard eller smal konsol" |

**Status:** Script klart (`scripts/internlankar-mobelrondellen.js`). Väntar på EC2-åtkomst för körning.
**OBS:** EC2-API gav 503 senast — verifiera PM2-status och öppna SSH innan körning.

## Publicerade artiklar

| Datum | Titel | URL |
|-------|-------|-----|
| 2026-04-29 | Fåtölj guide 2026 | https://mobelrondellen.se/blog/fatolj-guide-2026/ |
| 2026-05-08 | Bästa soffan 2026 — guide för dig som vill ha kvalitet och hållbarhet | ⏳ Kör `node scripts/publish-mobelrondellen-soffa-2026.js` från EC2 |
| 2026-05-29 | Utemöbler 2026 — guide till hållbara val för uteplats och altan | ⏳ Kör `node scripts/publish-mobelrondellen-utemobler-2026.js` från EC2 |

## Utfört arbete (historik)
- Plugin-cleanup: 325 → 7 plugins
- Kontaktsida: CF7-formulär städat
- Varumärken-sida: HTML-grid med 18 varumärken
- Slider Revolution: verifierad OK

## Prioriterade uppgifter — Konkurrentbevakning 2026-06-10 (MIDSOMMAR OM 12 DAGAR)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| **DEPLOY utemöbler-guide** (klar 2026-05-29 — **12 dagar**): `node scripts/publish-mobelrondellen-utemobler-2026.js` från EC2 | **BRÅDSKANDE** | Royal Design kör SOMMARREA 50%, Trademax lovar "leverans före midsommar" — vi behöver content-svar med lokal vinkel NU |
| **DEPLOY soffa-guide** (klar sedan 08/05 — **33 dagar!**): `node scripts/publish-mobelrondellen-soffa-2026.js` från EC2 | **BRÅDSKANDE** | Ingen konkurrent har soffa-köpguide — men försenat 33 dagar |
| Mikael: Skriv midsommar-utemöbler-checklista (~400 ord) direkt i WP-admin (ingen EC2 behövs) | **HÖG** | Royal Design/Trademax = priskrig, Furniturebox = rabatter — ingen lokal midsommar-guide finns |
| Viktor: Implementera 9 internlänkar via WP-admin (EC2 behövs EJ — guide finns nedan) | **HÖG** | Direkt SEO-win, 30 min insats |
| FAQ-schema på soffa-guiden + utemöbel-guiden | Medel | Ingen konkurrent har FAQ schema på köpguider |

## Prioriterade uppgifter — 2026-05-29 (arkiverade)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| ~~DEPLOY soffa-guide~~ | ~~BRÅDSKANDE~~ | Kvar — EC2-blockerare |
| ~~DEPLOY utemöbler-guide~~ | ~~BRÅDSKANDE~~ | Kvar — EC2-blockerare |
| Viktor: 9 internlänkar via WP-admin | **HÖG** | Kvar |
| FAQ-schema | Medel | Kvar |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-20

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| **DEPLOY soffa-guide** (klar sedan 08/05 — 12 dagar!): `node scripts/publish-mobelrondellen-soffa-2026.js`. OBS: EC2-API ger 503 — kontrollera PM2-status och öppna SSH om nödvändigt | **BRÅDSKANDE** | Trademax kör "Prispressade utemöbler fr 799 kr", Furniturebox har 3200+ outdoor-produkter med schema — vi behöver rådgivande content live NU |
| Skriv: "Utemöbler 2026 — vad håller i Dalarnas klimat?" (lokal säsongsguide) | **HÖG** | Royal Design publicerat nationell trendguide, Trademax = priskrig, Furniturebox = volym — ingen lokal vinkel finns |
| Implementera 9 internlänkar via WP-admin (Viktor kan göra — guide nedan) | **HÖG** | Ingen konkurrent har internlänkstruktur, direkt SEO-win |
| FAQ-schema på soffa-guiden + fåtölj-guiden | Medel | Furniturebox har product schema på produktsidor men inga guider har FAQ schema |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-13 (arkiverade)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| ~~DEPLOY soffa-guide~~ | ~~BRÅDSKANDE~~ | Kvar — EC2-503 blockerar |
| Implementera 9 internlänkar via WP-admin | **HÖG** | Kvar |
| ~~Skriv: "Utemöbler 2026: Vad håller i Dalarnas klimat?"~~ | ~~HÖG~~ | Kvar — ännu viktigare nu (Royal Design publicerat) |
| Komplettera fåtölj-guiden + soffa-guiden med FAQ-schema | Medel | Kvar |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-06 (arkiverade)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| ~~Skriv köpguide: "Bästa soffan 2026"~~ | ~~HÖG~~ | ✅ Klar — väntar på deploy |
| Lokalt SEO-inlägg: "Möbler Mora — vad du bör tänka på" | **HÖG** | Ersatt av Dalarna utemöbler-guide ovan |
| Komplettera fåtölj-guiden med Product + FAQ schema | Medel | Kvar |

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
