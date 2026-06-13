# Optimizer-session — fynd och åtgärder

**Datum:** 2026-06-05 (natten 00:30–01:00 CEST)
**Trigger:** Mikaels observation att kunder inte gör större skutt i trafik/ranking trots optimizer-körningar.

## TL;DR

1. **Diamantes "distinkta" taktiker överlevde inte adversarial verification.** Av 25 påståenden från deep-research-harnessen (100 agenter, 17 källor): 9 bekräftade, 16 avlivade. De headline-grabbande tactikerna (expertcitat → AI Overview på 2h, utgående länkar n=10, "Undeniable Signal"-ramverket, $80 PR → AI Overviews) är pressrelease-mat utan rådata.
2. **Det belagda lyftet är generic SEO i bra förpackning:** answer-first struktur (peer-reviewed KDD 2024 GEO-paper, topical completeness korr. 0.77 vs word count 0.04), long-tail topic clusters, volym (8 artiklar/mån). Konvergenstes: AEO ≠ separat disciplin.
3. **SAFE_MODE_NO_CONTENT_WRITES=false i prod** (verifierat). Optimern skriver skarpt — det är inte roten till stillaståendet.
4. **Loggen ljög.** Av 2099 rader senaste 30 dagarna i `seo_optimization_log` blandar `batch-log-optimizations.cjs` (manuell stdin-loggare) in *rekommendationer* med verkliga skrivningar. Veckorapporten räknade allt.
5. **NSO produkt-handlers misslyckas konsekvent** (`product_not_found` × 7) — sajten migrerade till Next.js + nginx-proxy mot one.com, men optimern pekar på fel WP-endpoint.
6. **När vi väl skriver är 90% Rank Math meta-titles/descriptions/focus_keywords** — ren on-page-kosmetik. Inte vad som flyttar rankning utan auktoritet/volym bakom.

## Deep research-fynd (Matt Diamante)

**Bekräftat (3-0):**
- Answer-first / question-driven topic clusters, många long-tail-varianter av ett huvudnyckelord ("tier B/C/D/E/F")
- 8 blogginlägg/mån för nya kunder (eller 6 uppdaterade + 2 nya)
- Workflow: SEMrush + ChatGPT-utkast → manuell SEO-edit (40-60 min/artikel)
- Konvergenstes: SEO för LLMs är inte separat disciplin
- Struktur (tabeller, listor, direkt svar i första 100 orden) höjer AI-citeringssannolikhet — oberoende bekräftat av Princeton/Georgia Tech GEO-paper (KDD 2024)

**Avlivat (0-3):**
- "Expertcitat → AI Overview på ~2h" (pressrelease, fabricerat sökord, n=ingen rådata)
- "Utgående länkar 5/5 vinner" (samma usla evidens)
- "Undeniable Signal"-ramverket (Radical Persistence / 50/50 / Information Gain) — inget primärt källmaterial definierar mekaniken
- "$80 PR → bok in i AI Overviews"
- TLDR-efter-H1 som signaturtaktik (svagt stöd 1-2)

**Caveat:** Det mesta som är belagt är generic SEO, inte Diamantes uppfinning. Diamantes agens heter HeyTony (inte Hypefury).

## BigQuery-backfill

Lade till `status STRING`-kolumn i `seo_data.seo_optimization_log` och klassificerade 2099 rader (senaste 30 dagar) baserat på `after_state`-mönster:

| Status | Antal |
|---|---|
| applied | 1811 |
| unknown | 291 |
| skipped | 10 |
| failed | 7 |
| identified | 3 |

**Klassificeringsregler:**
- `applied`: `{"action":"applied|flagged_safe_mode"}`, "Rank Math%satt", "schema JSON-LD", "%tillagd%", "%kortad till%", "%borttaget%", "%FAQ-sektion%"
- `skipped`: `*_already_exists`, `enough_*`, `sufficient_*`, `skipped_*`, `no_keywords`, `too_short`
- `failed`: `*_not_found`, `no_valid_*`, `error`
- `identified`: "Identifierat:%", "AEO-issue%", "%rekommendation%"

## Kodändringar (ej deployade)

**`lambda-functions/autonomous-optimizer.js`** (+125 rader)
- Ny handler `addAnswerFirstIntro` (rad 1081-1158): 2-3 meningar fristående svar i `<p class="answer-first">`, max 60 ord, primärnyckelord i mening 1, ÅÄÖ-korrekt. Använder `selectModel('content_fix')` (Haiku/tier2). Duplikatskydd via `class="answer-first"`-check.
- Registrerad i `SAFE_TASK_TYPES`, `TASK_HANDLERS`, `formatTaskType`.
- Ny helper `classifyStatus(result)` (rad 1535-1557): mappar `result.action` → applied|skipped|failed.
- Båda insert-platserna (rad 1864, rad 2271) skickar nu `status: classifyStatus(result)`.

**`lambda-functions/ai-visibility-tracker.js`** (+95 rader)
- `getTopPages(bq, dataset, customerId, 3)`: hämtar topp-3 sidor från `gsc_daily_metrics` (28 dagars impressioner).
- `queueAnswerFirstTasks(...)`: vid SoM < 60% eller konkurrent-gap, köa `answer_first_intro`-tasks mot topp-3 sidor. Topp-sida prio 80, sidor 2-3 prio 60. Dedup mot pending tasks i `seo_work_queue`.
- Trigger inkopplad i main-loop efter `saveMetrics`.

**`lambda-functions/weekly-report.js`** (+8 rader)
- Veckorapport-query filtrerar nu `WHERE (status = 'applied' OR status IS NULL)`. Exkluderar identified/skipped/failed.

**`batch-log-optimizations.cjs`** + **`log-optimization.cjs`**
- Tvingar `status='identified'` om anroparen inte explicit skickar status. Manuell batch-loggning är per definition rekommendationer, inte verkliga skrivningar.

Alla filer syntaxvaliderade med `node --check`.

## Det som INTE byggdes (medvetet)

- ❌ `injectExpertQuote` — premiss avlivad
- ❌ `addOutboundAuthorityLinks` som rankingtaktik — evidens avlivad
- ❌ "Undeniable Signal"-ramverk — finns inte definierat primärt

## Verifierade prod-fakta

- Lambda: `seo-autonomous-optimizer` (eu-north-1), inte `autonomous-optimizer`
- Env: `SAFE_MODE_NO_CONTENT_WRITES=false`
- BQ-dataset: `seo_data`, projekt `seo-aouto`
- AWS-profil: `mikael`

## Nästa steg (ej påbörjade)

1. **Deploy** — `seo-autonomous-optimizer`, `ai-visibility-tracker`, `weekly-report` Lambdas
2. **Granska `createArticle`-handlern** — når vi 8 artiklar/mån per kund? Vad publiceras egentligen?
3. **Fixa NSO produkt-endpoint** — pekar på fel host efter Next.js-migrationen, ger 7 `product_not_found` per körning
4. **Rensa de 291 kvarvarande "unknown"-raderna** — utöka klassificeringsmönster eller acceptera som default-applied

## Källor (deep-research)

- https://podcasts.apple.com/us/podcast/the-best-way-to-learn-seo-in-2024-w-matt-diamante/id1724999354
- https://brittanyherzberg.com/blog/best-way-to-learn-seo
- https://cxl.com/blog/aeo-geo-seo-reality-check/
- Aggarwal et al. (Princeton/Georgia Tech) GEO paper, KDD 2024
- https://www.searchenginejournal.com/googles-new-ai-search-guide-calls-aeo-and-geo-still-seo/

Full rapport: `/private/tmp/claude-501/-Users-weerayootandersson-Downloads-Searchboost-Opti/a357956d-b5bb-4611-9b26-5d3c7463ffc6/tasks/wh2ox78q4.output`
