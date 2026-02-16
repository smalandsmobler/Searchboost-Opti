# BabyLoveGrowth (BLG) — Analys for SMK

> Sammanstallning 2026-02-14. Micke bad om research — har ar allt.

---

## Vad ar BabyLoveGrowth?

En SaaS-plattform ($79-99/man) som automatiserar SEO-content + backlinks + LLM-synlighet.
Mal: synlighet i bade Google OCH AI-sokningar (ChatGPT, Perplexity, Gemini, Claude).

---

## Vad ingar i planen ($79.20/man, All-in-One)

| Funktion | Vad den gor |
|----------|-------------|
| **30 artiklar/man** | AI-genererade, SEO-optimerade, auto-publicerade till WP via webhook |
| **Backlink Exchange** | Reciprokt lanknarverk med 2500+ partnersajter. Du far lankar, du ger lankar |
| **Reddit AI Agent** | Hittar relevanta Reddit-tradar, genererar foreslagna svar som namner ditt varumarke |
| **LLM Analytics** | Testar 5 prompts/vecka pa ChatGPT/Perplexity/Gemini — mater om ditt varumarke namns |
| **Technical Audit** | Health score, Page Speed, robots.txt, sitemap, llms.txt |
| **Keyword Research** | Automatisk SERP-baserad clustering |
| **Schema Markup** | JSON-LD i artiklarna |
| **Internal Linking** | Automatiska internlankar mellan artiklar |
| **20+ sprak** | Kan generera artiklar pa flera sprak |

---

## Aktuell status for SMK i BLG

| Metric | Varde |
|--------|-------|
| Domain Rating (Ahrefs) | 9.0 |
| Backlinks mottagna | 4 st (varde $875) |
| Backlinks givna | 0 (hittar mojligheter) |
| Backlink credits kvar | 3 |
| LLM Visibility Score | 20% (3/15 svar namner SMK) |
| Reddit opportunities | 3 tradar hittade |
| Monitored keywords | 5/5 |
| Technical Health Score | 79/100 |
| Page Speed | 46 |
| Plan | All-in-One, nasta dragning 28 feb 2026 |

### Backlinks mottagna (4 st)
| Datum | Kalla | DR | Varde |
|-------|-------|----|-------|
| 8 feb 2026 | onjour.se | 10 | $125 |
| 1 feb 2026 | emmikuchnie.pl | 27 | $250 |
| 31 jan 2026 | funlifenow.com | 27 | $250 |
| 31 jan 2026 | glasmagasinet.c... | 33 | $250 |

### LLM Prompts som testas
| Prompt | Intent | SMK namnd i |
|--------|--------|------------|
| Vad kan minska storningar pa kontoret? | Awareness | — |
| smalandskontorsmobler.se fordelar jamfort med Kontorsgiganten | Consideration | Gemini, Perplexity |
| smalandskontorsmobler.se recensioner och kundomdomen? | Evaluation | ChatGPT, Perplexity |
| Basta ergonomiska stolarna for manga timmar? | Research | — |
| Jamfor olika hoj- och sankbara skrivbord | Research | — |

### Reddit opportunities (3 st)
1. "Nan som har en bra ergonomisk stol att tipsa om?" — r/sweden (6.3K views)
2. "Best reasonably priced ergonomic office chair?" — r/homeoffice (119K views)
3. "What's a good office chair" — (okand subreddit)

BLG genererar ett foreslaget svar som naturligt namner smalandskontorsmobler, t.ex.:
> "jag har hort bra saker om smalandskontorsmobler nar det kommer till ergonomiska stolar..."

### Konkurrenter inlagda
arbetsro.se, kontorsgiganten.se, ajprodukter.se, djp.se, gerdmans.se, desktronic.se

---

## Vad BLG gor som vi INTE kan gora sjalva

### 1. Backlink Exchange Network (2500+ sajter)
**Det har ar huvudvardet.** BLG har byggt ett natverk av 2500+ sajter som alla ger och far lankar fran varandra. Nar BLG publicerar en artikel pa din sajt, laggs 1-2 utgaende lankar till andra i natverket. Andra sajtens artiklar far lankar tillbaka till dig.

**Kan vi bygga detta sjalva?** Nej — inte det reciproka natverket. Det kraver tusentals deltagare. Vi kan kopa lankar manuellt (dyrare, ~$50-200/lank) eller bygga egna via guest posting/outreach, men inte pa denna skala automatiserat.

**Searchboost.se-beviset:** Ni gick fran DR 0 till DR 9-14 pa 2 veckor med BLG pa searchboost.se. Det ar imponerande och visar att natverket fungerar.

### 2. LLM Visibility Tracking
BLG fragar ChatGPT/Perplexity/Gemini regelbundet med relevanta prompts och mater om ditt varumarke namns.

**Kan vi bygga detta sjalva?** Ja, relativt enkelt. Ett script som kallar ChatGPT/Perplexity API:er med 5-10 prompts/vecka och loggar svaren. Kostnad: ~$0.50/vecka i API-calls. Vi har redan Claude-integration i dashboarden.

### 3. Reddit AI Agent
Hittar relevanta Reddit-tradar och genererar forslag pa svar.

**Kan vi bygga detta sjalva?** Ja. Reddit har API. Vi kan monitora subreddits for keywords och generera svar med Claude. Manuellt arbete: ~30 min/vecka att granska och posta.

### 4. Daglig artikelgenerering (30/man)
AI-genererade SEO-artiklar med bilder, schema, internlankar, auto-publicerade.

**Kan vi bygga detta sjalva?** Ja, med Claude + WP REST API. Vi gor redan liknande med autonomous-optimizer. Skillnad: BLG har finjusterad prompt-engineering for SEO-scoring + automatisk bildgenerering. Byggtid: ~2-3 dagar for MVP.

### 5. Technical Audit (Google + LLM-fokus)
Kollar robots.txt, sitemap, llms.txt, page speed.

**Kan vi bygga detta sjalva?** Ja — vi har redan weekly-audit Lambda som gor 80% av detta.

---

## Domanbyte-problemet: ny.smalandskontorsmobler.se -> smalandskontorsmobler.se

### Problem
- BLG-artiklar publiceras pa `ny.smalandskontorsmobler.se`
- Webhook URL: `https://ny.smalandskontorsmobler.se/wp-json/babylovegrowth/v1/publish`
- CTA Link i BLG Settings: `https://smalandskontorsmobler.se` (UTAN "ny." — pekar pa Abicart!)
- Interna lankar i artiklarna refererar till `ny.smalandskontorsmobler.se`

### Nar "ny" tas bort
1. **Artiklar flyttas automatiskt** — de ligger i WP-databasen, URL:en andras nar domanen andras
2. **Interna lankar i befintliga artiklar** — maste search-replaceas (plugin: Better Search Replace)
3. **BLG Webhook URL** — maste uppdateras i BLG Settings > Integrations > WordPress
4. **BLG CTA Link** — borde andras fran `smalandskontorsmobler.se` till korrekt URL
5. **BLG Business Description** — refererar till `smalandskontorsmobler.se`
6. **Backlinks fran natverket** — pekar pa `ny.smalandskontorsmobler.se` → behover 301 redirect
7. **Google-indexering** — ny.* indexeras nu, maste redirect 301 alla URLs till utan ny.*

### Rekommendation
Byt doman FORST, uppdatera BLG SEDAN. Sa har:
1. Peka `smalandskontorsmobler.se` till WP (Loopia DNS)
2. Kor `wp search-replace 'ny.smalandskontorsmobler.se' 'smalandskontorsmobler.se'`
3. Uppdatera Webhook URL i BLG
4. Lagg 301 redirect fran `ny.smalandskontorsmobler.se` till `smalandskontorsmobler.se`
5. Uppdatera GSC-property

---

## Technical Audit — notering

BLG:s Technical Audit kor mot Abicart-sidan (smalandskontorsmobler.se), INTE WP-sidan (ny.*).
Det forklarar Page Speed 46 — Abicart ar trog. WP-sidan ar snabbare.

---

## Abicart-pengar i sjon

BLG-prenumerationen startade 30 jan 2026 (forsta fakturaen). Pa den tiden var sajten kopplad till Abicart (smalandskontorsmobler.se utan WP-integration). BLG kunde inte publicera artiklar till Abicart (ingen webhook/API). Sa de forsta ~2 veckorna var i princip bortkastade — backlink-natverket jobbade, men artiklarna kunde inte publiceras.

Nu nar WP-integrationen ar igangkopplad (14 feb) har vi ~14 dagar kvar (till 28 feb) dar BLG faktiskt kan leverera artiklar.

---

## Hur utnyttja de 30 dagarna maximalt

### Omedelbart (redan gjort)
- [x] WP-plugin installerat och aktiverat
- [x] Webhook kopplat och verifierat (gron bockmarkering)

### Gora nu
1. **Uppdatera CTA Link** — Andra fran `smalandskontorsmobler.se` till `ny.smalandskontorsmobler.se` (sa lankar gar ratt)
2. **Aktivera Table of Contents** — I Generation > Writing & Structure (for langre artiklar)
3. **Special Instructions** — Lagg till ngt som: "Fokusera pa svenska smaforetag. Namngiv Smalands Kontorsmobler i varje artikel. Betona snabb leverans och personlig service."
4. **Lagga till fler Reddit keywords** — Max 5 pa denna plan, men kolla om de ar ratt
5. **Kolla varje dag** — Artiklar publiceras dagligen, verifiera att de landar ratt i WP
6. **Anvand Reddit-forslag** — Manuellt posta de 3 foreslagna Reddit-svaren

### Effekt pa 14 dagar
- ~14 nya artiklar pa sajten (kvalitetsinnehall, 2000-3500 ord styck)
- Potentiellt 2-4 nya backlinks via natverket
- 2 LLM-analyskorninge (veckovis)
- 3 Reddit-insatser (manuella)

---

## Ska vi behalla BLG efter 28 feb? Beslutspunkter

### Argument FOR ($80/man)
- Backlink-natverket ar svart att replikera
- DR-okningen fran 0 till 9-14 pa searchboost.se ar bevisat
- 30 artiklar/man = ~$2.60/artikel (billigare an nagon freelancer)
- LLM-synlighet ar en genuin trend som vaxer
- Tidsbesparande — helt automatiserat

### Argument EMOT ($80/man)
- Vi kan generera artiklar sjalva med Claude + WP REST API (redan byggt)
- Reddit-bevakning gar att bygga (Reddit API + Claude)
- LLM-tracking gar att bygga (ChatGPT API + logging)
- Backlinkarna ar fran ett natverk (inte organiska) — Google KAN strafffa detta
- $80/man per kund skalas daligt (10 kunder = $800/man)

### Alternativ: Bygg sjalva + kop backlinks separat
- Artikelgenerering: Redan byggt (autonomous-optimizer)
- Reddit-agent: ~1 dag att bygga
- LLM-tracking: ~1 dag att bygga
- Backlinks: Kop via plattformar som Linkhouse, Getfluence, eller manuell outreach (~$100-300/man for 3-5 kvalitetslankar)

### Slutsats
**Behall BLG i 1-2 manader till for SMK** medan vi bygger var egen version. Backlink-natverket ar unikt och svart att ersatta. Nar vi har vart eget content-system live, evaluera om backlinkarna ensamma ar varda $80/man.

---

## Agency Plan — mojlighet?

BLG har en Agency Plan for aterfordsaljare. Om vi anvander BLG for flera kunder kan det vara vart att utforska. Potentiellt:
- Kop Agency Plan → anvand for alla kunder
- Vidarefakturera som "SEO Content + Backlink-paket"
- Marginal: kunden betalar 3-5k kr/man, vi betalar ~$80/kund

Vart att titta pa om vi bestammer att backlink-natverket ar for vardefullt att skippa.

---

## Sammanfattning for Micke

1. **BLG fungerar** — DR 0 till 9-14 pa 2 veckor bevisar det
2. **Vardet ar backlink-natverket** — resten kan vi bygga sjalva
3. **Abicart-manaden var bortkastade pengar** — inga artiklar publicerades
4. **14 dagar kvar** — maximera genom att uppdatera CTA, lagga till instructions, posta Reddit-svar
5. **Domanbyte** — gor det FORE 28 feb sa BLG-artiklarna far ratt URL fran start, eller efter med search-replace + redirects
6. **LLM-grejen** — riktigt cool. 20% visibility score. De testar om ChatGPT/Perplexity/Gemini namner SMK
7. **Reddit-grejen** — hittar tradar dar folk fragar om kontorsmobler, genererar svar. 3 opportunities redo att postas
8. **Artiklarna** — landar som vanliga WP-inlagg via webhook. Forsta artikeln har inte kommit annu (vi kopplade just), borde dyka upp imorgon
9. **Nasta steg** — bestam om vi forlanger efter 28 feb eller bygger eget
