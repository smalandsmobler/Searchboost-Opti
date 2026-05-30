# 02 — Optimizern (autonomous-optimizer)

> Källa: `lambda-functions/autonomous-optimizer.js` (2266 rader), live som `seo-autonomous-optimizer`, cron `cron(0 */6 * * ? *)` (var 6:e timme). Radnummer verifierade 2026-05-30.

## Sammanfattning: GÖR vs BORDE GÖRA

| Område | GÖR idag | BORDE GÖRA (gap) |
|--------|----------|-------------------|
| Meta-titel/beskrivning | ✅ Skriver Rank Math-meta på alla bearbetade URL:er | — |
| Schema/structured data | ✅ Skriver `rank_math_schema_data` + rich snippet type | — |
| Hela artiklar | ✅ Genererar och publicerar (tier3-modell) | — |
| Content-fixar (thin content, H2/H3, synonymer, intern länkning, FAQ/AEO, alt-text i brödtext) | ⚠️ **Flaggar för manuell review** (SAFE_MODE), skriver INTE | Säker content-write-väg saknas → allt content fastnar i manuell kö |
| Hastighet / lazyload / CWV | ❌ **Ingenting** | Hela CWV-spåret saknas helt i optimizern |
| Källa för uppgifter | Läser primärt `action_plans` | Borde läsa `seo_work_queue` (kanban) enligt arkitekturbeslutet |
| Modell-routing | Två parallella config (legacy FREE_MODELS + MODEL_TIERS) | Rensa legacy, en sanning |

## SAFE_MODE — det centrala

Rad 178:
```js
const SAFE_MODE_NO_CONTENT_WRITES = process.env.SAFE_MODE_NO_CONTENT_WRITES !== 'false';
```

Default **TRUE**. Innebär: optimizern skriver aldrig till WP `content`-fältet. Konsekvens:

- **Skrivs alltid (är meta, inte content):** `rank_math_title`, `rank_math_description` (rad 464, 1113), `rank_math_schema_data` (rad 705, 1282).
- **Flaggas för manuell review istället för att skrivas** (`flagForManualReview`, rad 180), när SAFE_MODE är på:
  - intern länkning (rad 514)
  - thin content (rad 580)
  - alt-text i brödtext (rad 646)
  - schema-sektion i body (rad 711)
  - FAQ/AEO-sektion (rad 788)
  - H2/H3-optimering (rad 961)
  - synonym-gap (rad 1019)

Detta är den viktigaste GÖR-vs-BORDE-insikten: **Mikaels önskemål "fyll i ALL metadata på ALLA URL" uppfylls för meta+schema, men content-relaterade fixar (och hastighet/lazyload) görs INTE — de hamnar i manuell kö.** Att slå på `SAFE_MODE_NO_CONTENT_WRITES=false` kräver att en säker content-write-väg byggs och testas först (separat pass).

## Modell-routing

### Aktiv: MODEL_TIERS + selectModel (rad 1933-1943)

```js
const MODEL_TIERS = {
  tier1: 'google/gemini-2.0-flash-lite-001',  // billigast
  tier2: 'anthropic/claude-haiku-4.5',        // standard (fix 2026-05-30: id utan suffix krävs av OpenRouter)
  tier3: 'anthropic/claude-sonnet-4.6',       // tyngst
};
function selectModel(taskType) {
  const tier1Tasks = ['meta_title','meta_description','alt_text','focus_keyword','classify','validate'];
  const tier3Tasks = ['customer_report','strategy','full_article','competitor_analysis'];
  if (tier1Tasks.includes(taskType)) return MODEL_TIERS.tier1;
  if (tier3Tasks.includes(taskType)) return MODEL_TIERS.tier3;
  return MODEL_TIERS.tier2; // schema, content_fix, internal_links, faq
}
```

`selectModel(...)` anropas per uppgift (rad 442, 490, 556, 621, 671, 757, 823, 878, 996, 1079, 1152, 1216, 1414). Allt går via OpenRouter (`createOpenRouterClient`, härmar Anthropics `messages.create()`).

### Legacy: FREE_MODELS (rad 17-25) — DÖD-KANDIDAT

```js
const FREE_MODELS = ['qwen/qwen3-235b-a22b:free', 'meta-llama/llama-4-maverick:free',
  'deepseek/deepseek-r1-0528:free', 'google/gemini-2.0-flash-exp:free'];
let AI_MODEL = FREE_MODELS[0];
```

`AI_MODEL` sätts men `selectModel` styr de faktiska anropen. Detta är förvirrande dubbel-config → städa i separat pass (verifiera att inget anrop fortfarande läser `AI_MODEL`).

## Uppgiftskälla

Rad 1653-1722:
1. Hämtar uppgifter från `action_plans` för kund + aktuell månad (`ORDER BY priority DESC LIMIT @maxTasks`, rad 1668).
2. Sätter `status='skipped'` (rad 1706) eller uppdaterar status (rad 1716) efter bearbetning.
3. `seo_work_queue` används som fallback/sekundär (rad 1336, 1346).

**Gap mot arkitekturbeslutet:** kanban (`seo_work_queue`) ska vara spindeln. Idag är `action_plans` primär. Se [04-kanban-och-loggning.md](04-kanban-och-loggning.md).

## Loggning

- `seo_optimization_log` via streaming `.insert()` (rad 1723) — DML ej tillgängligt i Lambda-kontexten, därför streaming.
- A/B-prompt-loggning till `prompt_ab_log` (rad 1858-1883), skapar tabellen on-the-fly om den saknas.

## WP-skrivning (Rank Math)

Skrivs via WP REST API som post-`meta`:
```js
meta: { rank_math_title: ..., rank_math_description: ... }   // rad 464, 1113
meta: { rank_math_schema_data: JSON.stringify(schemaJson) }  // rad 705, 1282
meta: { rank_math_schema_Article: JSON.stringify(schema) }   // rad 1601 (artiklar)
```

Aldrig Code Snippets (förbjudet — kraschar sajter). Endast Rank Math-meta + content via REST.

## Åtgärdslista (separata pass — inte nu)

1. Bygg + testa säker content-write → slå av SAFE_MODE kontrollerat per task-typ.
2. Lägg till CWV/hastighet/lazyload-spår (saknas helt).
3. Flytta primärkälla från `action_plans` → `seo_work_queue`.
4. Ta bort legacy FREE_MODELS/AI_MODEL-config.
