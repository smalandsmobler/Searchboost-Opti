# Utvecklingsstrategi 2026-04-22 — Mer trafik + bättre CTR per kund

**Skapad:** 2026-04-22 efter stort tekniskt SEO-lyft + backlinks-audit på alla 8 kunder.
**Mål:** Identifiera de 3-5 högsta-impact dev-möjligheterna per kund för att öka trafik och click-through-rate (CTR) i SERP.

---

## Backlinks-status (audit 2026-04-22)

| Kund | Backlinks | Refdomains | Domain Rank | Spam-domäner | Disavow behövs? |
|------|-----------|------------|-------------|--------------|-----------------|
| Ilmonte | 1 223 | 174 | 34 | 0 | NEJ |
| SMK | 1 177 | 81 | 33 | 0 | NEJ |
| Möbelrondellen | 922 | 59 | 15 | 0 | NEJ |
| Jelmtech | 314 | 201 | 21 | 0 | NEJ |
| Traficator | 144 | 64 | 18 | 0 | NEJ |
| HP | 61 | 42 | 17 | 0 | NEJ |
| NS | 48 | 33 | 9 | 0 | NEJ |
| Tobler | 33 | 28 | 19 | 0 | NEJ |

**Slutsats:** Inga disavow-filer behövs. Alla sajter har rena backlink-profiler enligt rule-based detection (casino/pharma/adult/spam-TLDs + lågkvalitets-DR). Disavow-mallar sparade i `/tmp/disavow/` om Mikael vill granska manuellt.

**Trafikpotential från backlinks:** Tobler + NS har lågt antal refdomains — länkbygge bör prioriteras hos dem.

---

## Per-kund dev-möjligheter

### 1. SMK (Smålands Kontorsmöbler) — 1 177 backlinks, DR 33

**CSS-status:** 170 snippets totalt, ~40 aktiva. Snippets-zoo behöver konsolideras (många ONE-SHOT som körts klart). Snippet #176 skyddar 7 sidors CSS från optimerare.

**Trafik (löpande):**
1. **Programmatisk SEO för möbelvarumärken** — SMK säljer 50+ varumärken (Materia, Smålands, HÅG, EFG, IKEA, etc). Skapa landningssida per varumärke × kategori (50 × 9 = 450 nya sidor). Effort: 1 vecka utveckling.
2. **Lokala landningssidor** — "Kontorsmöbler Halmstad", "Kontorsmöbler Stockholm" etc för 30 städer. Effort: 30 sidor × 2h = 60h.
3. **Programmatisk produkt-jämförelser** — "Kontorsstol vs konferensstol", "Höj-sänk vs fasta skrivbord" osv. 20 sidor.

**CTR (snabba vinster):**
1. **Title tag-optimering** — lägg in årtal "2026", parenteser "(B2B)", numeriska modifierare ("Top 10", "Från 2 449 kr"). Genomsnittlig CTR-förbättring: +15-25%.
2. **FAQPage schema på top 50 produkter** — Rank Math kan auto-generera. Ger rich snippet i SERP.
3. **Product review schema** — när reviews kommer in, exponera dem (★★★★★).
4. **Bättre OG-bilder** — när bildbatchen är klar (~13:00), produktbilder ser uniformt premium ut → bättre social CTR.

**Status:** Bildbatch (rembg) pågår — 700/895 klart. ETA ~25 min.

---

### 2. Humanpower — 61 backlinks, DR 17

**CSS-status:** 25 snippets, 10 aktiva. Snippet #24 (SEO head emitter) hanterar nu allt SEO-output. Rank Math behöver fixas på sikt.

**Trafik:**
1. **Mer artiklar** — bara 33 artiklar. Reboot/utvecklande samtal/kosttillskott är högvolyms-niche. Mål: 100 artiklar inom 6 mån.
2. **YouTube-kanal med Anette Brink** — terapi/återhämtnings-content. Ingen reklam-restriktion. Hög CTR i SERP via video-rich-snippets.
3. **Lokala pages** — "Samtalspedagog Stockholm", "Reboot retreat Litauen" finns. Komplettera med 10 städer.
4. **Backlink-outreach** — DR 17 är lågt. Kontakta hälsobloggar, terapi-magasin, retreat-recensionssajter.

**CTR:**
1. **HowTo schema** på övningar ("Andningsövningar mot ångest", "Mindfulness-övningar hemma") — ger rich snippet med steg.
2. **Recension/Aggregate Rating** på Reboot — om Anette samlar in betyg, exponera dem.
3. **Bättre titles** — "Holistisk återhämtning — 7 metoder från samtalspedagog (2026)". Specifika nummer + auktoritet.

**Möjlig MRR-ökning:** Nuvarande paketet är minimalt — föreslå utökning till 2-3 artiklar/v + LinkedIn för Anette (~5k/mån).

---

### 3. Jelmtech — 314 backlinks, DR 21

**CSS-status:** 27 snippets, 15 aktiva. Snippet #25 (SEO head emitter) hanterar nu schema. Snippet #26 fixade sitemap-bug.

**Trafik:**
1. **B2B-fokuserade case studies** — Jelmtech har gjort projekt åt Swedish Match m.fl. Konvertera till SEO-rich case studies med teknisk djup-analys.
2. **Programmatisk SEO för material × tillverkningsteknik** — t.ex. "PA6 + formsprutning", "PC + vakuumgjutning" etc. ~40 nya sidor med teknisk vikt.
3. **Industri-rapporter** — gratis nedladdningsbara PDF:er ("Plastkonstruktion 2026: trender") — bygger backlinks + leads.
4. **YouTube-tour av ingenjörs-arbetet** — visuella process-videor får hög delningsgrad i tekniska forum.

**CTR:**
1. **Tekniska specifikationer i title** — "Formsprutad PA6 — toleranser, kostnader, exempel (DFM-guide)" — träffsäker för B2B-sökare.
2. **Article schema med technicalArticle-subtyp** — Rank Math stödjer.
3. **Author markup** — Carl-Fredrik Emilsson (VD, expert på industridesign) → E-A-T-boost.

---

### 4. Traficator — 144 backlinks, DR 18

**CSS-status:** 35 snippets, 14 aktiva. Inkluderar hreflang SV/EN (snippet #33), schema (#8/#14). Polylang installerat.

**Trafik:**
1. **Traficator Plast spin-off-sajt** — diskuterat i pitch (pitch-2026-04-24). En egen domän för avfallskorgar/hundlatriner = blå hav-keywords.
2. **Engelska sidor** — Polylang finns, men engelska content kan utökas. Internationella sourcing-kunder.
3. **Material × användning-matris** — "Mässing + vägg-applikationer", "Aluminium + lättvikts-detaljer" etc.
4. **Branschsidor per industri** — fordon, vitvaror, möbler, marin osv.

**CTR:**
1. **Service-page schema** för varje gjuttjänst — gör att tjänsten kan visas som rich result.
2. **Title med konkreta exempel** — "Pressgjutning i koppar — från ritning till 100 000 enheter".
3. **FAQ schema** på de 5 toptjänsterna.

---

### 5. Nordic Snus Online — 48 backlinks, DR 9 (NYTT KONTO)

**CSS-status:** Polylang multilingual. Code Snippets-perms broken (`mikael` har customer-roll, inte admin). KRÄVER manuell fix från Mikael.

**Trafik (från mötesunderlag fredag):**
- Se `presentations/nordic-snus-mote-2026-04-25.md` för full strategi.
- Sammanfattning: programmatisk SEO för varumärken × styrkor (200 sidor), jämförelsesidor, AEO för LLM-sök, YouTube, Reddit/Snusforumet, email-marketing, subscription-modell.

**CTR-prio:**
1. **Brand-specifika titles** — "Zyn 6mg — köp online, fri frakt över XXX kr (2026)".
2. **Product schema med pris** — visas i SERP.
3. **Aggregate Rating** — när reviews kommer in.

**KRITISKT 2026-04-25:** Möte med kund — visa siffror, sälj sprint-paket A+B (33k engång + 5,5k/mån).

---

### 6. Tobler — 33 backlinks, DR 19

**CSS-status:** 53 snippets, 9 aktiva. Allt clean.

**Trafik (LÅGT antal backlinks — fokus där):**
1. **Branschmedia-outreach** — Byggvärlden, Building Sweden. 5-10 backlinks från auktoritativa byggmagasin = enormt lyft för DR.
2. **AFS 2013:4 + säkerhetsguider** — Tobler har redan content om detta. Push hårdare med SEO + outreach till säkerhetsblogger.
3. **YouTube** — montagevideor av byggställningar = visuell SEO för byggsökare.
4. **Lokala landningssidor** — "Byggställning Göteborg" (de finns där), "Byggställning Halmstad", "Stockholm" osv.

**CTR:**
1. **Product schema** med konkreta priser på MATO 1-system.
2. **Säkerhetsstandard-marker** (ISO/AFS) i title — fångar professionella sökare.
3. **Author markup** — Frostenäs-bröderna (40 års erfarenhet) → E-A-T.

**Möjlig MRR:** SEO-paketet är klart (3 art/v). Föreslå Google Ads-tillägg när budget tillåter.

---

### 7. Ilmonte — 1 223 backlinks, DR 34 (HÖGST!)

**Status:** 🔴 RETENTION (beslut 9 maj). Försäljning-prio just nu.

**CSS-status:** 35 snippets, 14 aktiva. Bra setup.

**Trafik:**
1. **Hacking-incident efterspel** — om ~4 118 casino spam-URLs är cleanade och GSC inte längre flaggar, lyfter trafik dramatiskt.
2. **Event-marknaden** — push hårt på "scenpodier", "eventpodium", "ridåskenor" via PR till eventbloggar.
3. **B2B-katalog** — gör en nedladdningsbar PDF med hela sortimentet → backlinks från arrangörer.
4. **Konkurrent-analys** — vilka eventuthyrare rankar för deras nyckelord? Hitta deras backlink-källor.

**CTR:**
1. **LocalBusiness schema** med fysisk adress.
2. **Branded SERP-bevakning** — säkerställ att Ilmonte rankar #1 på "ilmonte" + sökresultaten ser professionella ut.
3. **Image SEO** — eventbilder ranks bra i Google Images.

**KRITISKT:** Beslut 9 maj. Underlag för retention-pitch behöver byggas senast 5 maj.

---

### 8. Möbelrondellen — 922 backlinks, DR 15

**CSS-status:** 100+ snippets, 38 aktiva. **Rank Math hanterar nu schema** efter Yoast-migration (snippet #125 + #126). Snippet #64 kanske kan deaktiveras nu när RM fungerar.

**Trafik:**
1. **Lokala SEO-pages** — "Möbler Mora", "Möbler Rättvik", "Älvdalen" osv. MR är familjeägd 1990 = stark lokal-story.
2. **Inredningsguider per rum × stil** — "Skandinavisk vardagsrum", "Industriell sovrum", etc. Långa-tail keywords med köp-intention.
3. **Varumärkes-sidor** — Perfect Brands plugin är installerad men kan utnyttjas mer.
4. **YouTube room-tours** — visa hur möblerna ser ut i hem-miljö.

**CTR:**
1. **LocalBusiness schema** är aktivt (FurnitureStore + GeoCoordinates) — bra!
2. **Bättre OG-bilder** — många produkter har leverantörsbilder. Konsolidera till en enhetlig stil.
3. **Aggregate Rating** — om kunder lämnar betyg, exponera.
4. **Product schema med pris i SERP** — borde vara på, verifiera.

**Tekniskt nästa steg:** Permalink-migration från `/YYYY/MM/DD/slug/` till `/%postname%/` — Mattias måste godkänna (bryter befintliga länkar utan 301).

---

## Snippets-konsolideringspotential (CSS-cleanup)

| Kund | Total | Aktiva | Föreslag |
|------|-------|--------|----------|
| SMK | 170 | ~40 | Radera 130+ inaktiva ONE-SHOT-snippets (körda + obsoleta) |
| HP | 25 | 10 | Konsolidera robots-snippets (#7, #14, #17) |
| JT | 27 | 15 | Inaktiva sitemap-experiments (#10, #11, #13, #16) kan raderas |
| TR | 35 | 14 | Bra struktur, ingen större action |
| NS | ? | ? | Kräver admin-perms innan vi vet |
| TB | 53 | 9 | Många inaktiva — kan raderas |
| IM | 35 | 14 | Bra struktur |
| MR | 100+ | 38 | Snippet #64 kan deaktiveras nu (RM fungerar) — testa försiktigt |

---

## Prioritering för nästa 30 dagar

### Vecka 17 (denna vecka — 22-26 april)
- ✅ **SEO-grund klar på alla 8** (interlinks, schema, llms.txt, robots, sitemap-fix)
- ✅ **Backlinks-audit klar** — inget spam, ingen disavow
- 🔴 **NS möte fredag 25 april** — sälj sprint-paket
- 🔄 **SMK bildbatch** klar ca 13:00 (pågår)

### Vecka 18 (28 april - 2 maj)
- **Lokala SEO-pages**: SMK + MR + Tobler + IM (10 städer var = 40 sidor)
- **Snippets-cleanup**: SMK (radera 130+ obsoleta), TB, JT
- **HP YouTube-strategi** med Anette Brink
- **Vecka 25 artiklar** för alla 8 kunder

### Vecka 19 (5-9 maj)
- **IM beslut 9 maj** — retention-pitch klar
- **Programmatisk SEO** sprint 1: SMK varumärken (50 sidor)
- **NS Sprint A** start: programmatiska brand × styrka-sidor

### Vecka 20 (12-16 maj)
- **TB Google Ads + LinkedIn-lansering**
- **MR permalink-migration** (om Mattias OK)
- **Tobler 18k betalning** förfaller 11 maj — uppföljning

---

## Total uppskattad tillväxtpotential per kund (12 mån)

| Kund | Nuvarande trafik | Mål 12 mån | Tillväxt | Värde |
|------|------------------|-----------|----------|-------|
| SMK | ~5k besök/mån | 25k | 5x | E-handel: stor |
| HP | ~500 besök/mån | 3k | 6x | Lead-gen: medel |
| JT | ~1k besök/mån | 4k | 4x | B2B-leads: hög per lead |
| TR | ~1.5k besök/mån | 6k | 4x | B2B sourcing: hög |
| NS | ~15k besök/mån | 50k | 3.3x | Provision-baserad: linjär |
| TB | ~500 besök/mån | 3k | 6x | B2B: hög per kund |
| IM | ~3k besök/mån | 10k | 3.3x | Event-uthyrning: hög |
| MR | ~2k besök/mån | 8k | 4x | E-handel: medel |

(Siffrorna är estimat baserat på branschstandard + dev-möjligheter ovan. Exakta GSC/GA4-siffror behöver hämtas per kund för exakt baseline.)

---

**Nästa steg:** Förbered säljpresentationer per kund med trafik-mål + erforderlig investering. Använd denna doc som mall.

**Genererad:** 2026-04-22, autonomt nattjobb-pass.
