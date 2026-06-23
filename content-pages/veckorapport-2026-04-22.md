# Veckorapport — vecka 17 (2026-04-22)

**Period:** måndag 14 april → onsdag 22 april 2026
**Sammanfattning:** Stort tekniskt SEO-lyft på 6 kunder + leverans av strategiunderlag för Nordic Snus-mötet på fredag.

---

## Sammanfattning per kund

| Kund | Interlinks | SEO-head | llms.txt | robots.txt | Sitemap | Schema | Övrigt |
|------|-----------|----------|----------|------------|---------|--------|--------|
| **SMK** | 71/71 ✅ | OK | 5474B (10x) | Härdad | 1093 URLer | OK | + ContactPage/AboutPage, +Köp-knapp olivgrön, +SEO accordion, +produktbild-CSS, leveranstid 2-3d på alla 25 produkter med avvikande värden, JS-läcka borttagen, slideshow-fix, CSS skyddat (snippet #176) |
| **HP** | 33/33 ✅ | **FIX** (0→4 JSON-LD) | 3334B (10x) | Härdad | wp-core OK | + Org/WebSite/Article/Breadcrumb | Rank Math var trasig — snippet #24 emittar nu allt |
| **JT** | 64/64 ✅ | **FIX** (0→4 JSON-LD) | 3162B | Omskriven | **FIX** (/sitemap.xml dead-redirect→/sitemap_index.xml) | + Org/WebSite/Article/Breadcrumb | GSC-boven hittad: /sitemap.xml gick till död URL |
| **TR** | 53/53 ✅ | OK | 3118B | Härdad | OK (99 URL) | OK | Inget kritiskt — bara content+styling-uppfräschning |
| **NS** | 44/44 ✅ | OK | RM-auto | Redan härdad | OK (434 URL) | OK | **+ Mötesunderlag fredag** (programmatic SEO + jämförelsesidor + LinkedIn-strategi) |
| **TB** | 13/13 ✅ | OK | 1671B | Härdad | OK (213 URL) | OK | Allt rent — inga större fynd |
| **IM** | 43/43 ✅ | OK | OK | OK (härdad 2026-04-18) | OK (773 URL) | OK | Retention-läge — beslut 9 maj |
| **MR** | 32/32 ✅ | OK | 2872B | OK | wp-core OK | OK | Sucuri WAF kräver browser-UA |

**Totalt: 353 artiklar med internlänkar tillagda. 2 kritiska SEO-head-fixar. 1 sitemap-bug fixad. 1 strategi-doc levererad.**

---

## Kritiska upptäckter

### 1. Humanpower — Rank Math emittade INGENTING
- Site-wide problem: 0 JSON-LD, 0 OG, 0 Twitter cards, 0 meta description
- post-meta sparat (rank_math_title/description/focus_keyword) men ALDRIG renderat på frontend
- Setup-wizard troligen oavslutad, eller filter blockerar wp_head-output
- **Lösning:** SBS SEO head emitter (snippet #24) läser meta direkt från DB, emittar 4 JSON-LD blocks (Organization + WebSite + Article + BreadcrumbList) + 7 OG + 4 Twitter + meta description + canonical
- HP är nu från SEO-osynlig till fullt indexerbar

### 2. Jelmtech — sitemap.xml redirected till död URL
- /sitemap.xml gjorde 301 → /wp-sitemap.xml (404)
- Det här var BOVEN i GSC: "couldn't fetch sitemap"-felen
- **Lösning:** snippet #26 omdirigerar /sitemap.xml → /sitemap_index.xml (200 OK Rank Math)
- 81 URLer (17 sidor + 64 inlägg) återindexerades direkt

### 3. Jelmtech — samma Rank Math head-problem som HP
- 0 JSON-LD, ofullständiga OG (1 tag), ingen canonical, ingen twitter:card
- Meta description fanns dock (Divi-tema fyllde i)
- **Lösning:** SBS SEO head emitter (snippet #25) — full output

### 4. SMK — JS-kod synlig som plain text på startsidan
- 2 671 chars JS-kod i `<p>`-tagg på home (ID 9311) p.g.a. att apostrofer konverterats till HTML-entiteter
- Bröt DOM-parsing → slideshow funkade inte
- **Lösning:** rensad ur content + slideshow-JS körs nu en gång (snippet #168)

### 5. SMK — dubbletter av Köp-knappar borttagna
- Snippet #154 dolde `.button-add-to-cart.is-small`
- Force-aktiverat via snippet #174 + olivgrön pill-styling med bronsskugga

### 6. SMK — sitemap submit till GSC fungerade ✅
- Property: https://www.smalandskontorsmobler.se/
- 1 093 URLer upptäckta

---

## Nordic Snus-mötet (fredag 25 april) — KRITISKT

**Underlag klart:** `presentations/nordic-snus-mote-2026-04-25.md`

**Kärnpunkter att ta upp:**
1. **Vad vi har gjort** — 14 punkters teknisk SEO-checklista (allt klart)
2. **Varför vanliga annonser inte fungerar** — Google/Meta/TikTok/Spotify alla förbjuder nikotin
3. **Vad vi kan göra mer** — 14 spår indelade i fyra kategorier:
   - SEO på steroider (programmatic, jämförelser, lokala pages, AEO)
   - Content marketing (YouTube, Reddit, affiliate-outreach, PR)
   - LinkedIn (CEO-personal-brand, B2B-distributörer, hiring)
   - Email + Loyalty (subscription-modell, lojalitetsprogram, opt-in email)
4. **Pris/effort-matris** — vad ger mest ROI per investerad timme
5. **Konkret upsell:** Sprint A (programmatisk SEO 33k engång) + Sprint B (LinkedIn ghostwriter 2,5k/mån)

**Ta med på mötet:**
- GA4-export (senaste 30d trafik + sökord)
- Search Console-export (top 50 keywords + position-utveckling)
- Konkurrentanalys snippets (snusbutik.se, snuscompany.se)
- Demo av programmatisk SEO-sida

---

## Pågående bakgrundsjobb

### SMK bildbatch (AI bg-removal med rembg/u2net)
- Status (kl 11:46): 450/895 (50%), 183 ok, 267 errors
- Errors mestadels 502 Bad Gateway från WP-uploads (server-throttling)
- ETA: ~30 min ytterligare (totalt ~80 min)
- **Plan:** retry-pass på de 267 felen efter att första vandrar är klar

---

## Snippets skapade denna vecka

| ID | Kund | Namn | Syfte |
|----|------|------|-------|
| #15 (uppd) | SMK | SBS: llms.txt | Expanderad med 71 artiklar + alla kategorier |
| #150 (renamed) | SMK | SBS: Rank Math taxonomy meta REST | Tidigare namnlös |
| #171 | SMK | SBS: robots.txt härdning | Crawl budget |
| #173 | SMK | SBS: ContactPage + AboutPage schema | JSON-LD på /kontakt/ och /om-oss/ |
| #174 | SMK | SBS: Köp-knapp olivgrön + premium bildkort | UX-uppfräschning kategorisidor |
| #175 | SMK | SBS: Läs mer-accordion på kategorisidor | SEO-text dolt under läs mer |
| #176 | SMK | SBS: Page CSS skydd | Flyttat 7 sidors CSS från content till wp_head |
| #24 | HP | SBS: SEO head emitter | Kritisk fix — emittar JSON-LD/OG/Twitter |
| #25 | HP | SBS: robots.txt härdning | Crawl budget |
| #25 | JT | SBS: SEO head emitter | Kritisk fix |
| #26 | JT | SBS: sitemap.xml alias + robots härdning | Sitemap-fix |
| #27 | JT | SBS: write robots.txt endpoint | Skriver fysisk robots.txt |
| #34 | TR | SBS: robots.txt härdning | Crawl budget |
| #52 | TB | SBS: robots.txt härdning | Crawl budget |

---

## Att göra härnäst

1. **Slutför SMK bildbatch** — vänta på första pass + kör retry på 267 felen
2. **Nordic Snus-möte fredag** — förbered demo + exporter
3. **Vecka 25 artiklar** — 3 per kund × 8 kunder = 24 artiklar (mån/tis)
4. **Tobler 18k-faktura** — förfaller 2026-05-11
5. **Möbelrondellen 8 750 kr** — förfaller 2026-04-29
6. **Ilmonte beslut** — Peter svar väntas 9 maj

---

## Hash av commits denna nattjobb-runda

| Commit | Kund | Vad |
|--------|------|-----|
| 9e5eb93 | SMK | SEO-audit komplett (interlinks + llms + robots + schema) |
| 82031d7 | HP | Kritisk SEO-fix + audit |
| 6cdcef8 | JT | Sitemap-fix + SEO head emitter |
| 071f8af | TR | Interlinks + llms + robots |
| 88412a8 | NS | Interlinks + mötesunderlag fredag |
| 2e66261 | TB | Interlinks + robots |
| e32c4e4 | IM | Interlinks |
| 42c099e | MR | Interlinks + SEO verifierad |

Branch: `feat/march-2026-updates` — 8 commits pushade
