# 06 — Onboarding, sökord & åtgärdsplaner

> Källor: `wordpress-plugin/searchboost-onboarding/`, `lambda-functions/keyword-researcher.js` (477 rader, `seo-keyword-researcher`, mån 06:00), `weekly-audit.js` (531 rader, `seo-weekly-audit`, dagligen 04:00). Verifierat 2026-05-30.

## Onboarding

WP-plugin `searchboost-onboarding` + `/api/onboard`-endpoint på EC2-servern fångar nya kunder. (Detaljerad plugin-genomgång: se [11-wordpress-build.md](11-wordpress-build.md).)

## Sökord — ABC-tiers (keyword-researcher)

Veckovis flöde (mån 06:00):
1. `getGSCKeywords()` (rad 95) — 90 dagars GSC-queries via Search Console API.
2. `getAutocompleteKeywords()` (rad 142) — Google autocomplete-expansion (locale `sv`).
3. `getAIKeywordSuggestions()` (rad 208) — AI-förslag (modell `claude-haiku-4-5-20251001`, hårdkodad rad 307 → bör gå via central routing).
4. Uppdaterar `customer_keywords` med nya ABC-förslag (rad 363). Tier-fältet = A/B/C-prioritet.
5. **Skapar `new_content`-jobb i `action_plans`** för sökordsluckor (rad 372-449) — kollar att target_keyword inte redan finns (rad 381), INSERT (rad 429).

### ⚠️ Gap
- `keyword_research_log` (INSERT rad 351) — **tabellen finns INTE i BQ**. Den loggningen misslyckas tyst. `customer_keywords` + `action_plans`-jobben fungerar dock.
- AI-modell hårdkodad (rad 307) istället för central routing.

## Åtgärdsplaner — action_plans

`action_plans` är optimizerns **primära** uppgiftskälla (se [02-optimizer.md](02-optimizer.md)). Jobb skapas av:
- `keyword-researcher` → `new_content`-jobb (sökordsluckor).
- `weekly-audit` → kö-jobb i `seo_work_queue` (rad 484, 494) för upptäckta brister (saknad meta, schema osv).

## Audit — weekly-audit (kanban-feeder)

Dagligen 04:00:
1. `getWordPressSites()` (rad 26) — alla WP-kunder.
2. `getGscSignals()` (rad 122) — GSC-signaler per kund.
3. `auditSite()` (rad 277) — genomsöker varje sajt, `shouldSkipUrl()` (rad 266) filtrerar.
4. Dedupe mot befintliga jobb: `seo_work_queue` + `seo_optimization_log` (rad 425-428) så samma URL/task inte köas dubbelt.
5. Skriver nya jobb till `seo_work_queue` (rad 484, 494).

**Detta är den korrekta kanban-matande vägen** — weekly-audit fyller kanban, vilket är arkitekturbeslutet. Gapet är att optimizern sedan läser `action_plans` primärt, inte kanban. Se [04-kanban-och-loggning.md](04-kanban-och-loggning.md).

## GÖR vs BORDE GÖRA

| Område | GÖR | BORDE |
|--------|-----|-------|
| ABC-sökord | ✅ GSC + autocomplete + AI → customer_keywords | — |
| Content-jobb från luckor | ✅ Skapas i action_plans | — |
| keyword_research_log | ❌ Tabell saknas → tyst fel | Skapa tabellen eller ta bort loggningen |
| Audit→kanban | ✅ weekly-audit fyller seo_work_queue | — |
| Optimizer-källa | Läser action_plans | Borde läsa seo_work_queue (kanban som spindel) |
| Genomförandesäkring | Delvis (SAFE_MODE flaggar content) | Stäng loopen: flaggat content → manuell kö → done-transition i kanban |
