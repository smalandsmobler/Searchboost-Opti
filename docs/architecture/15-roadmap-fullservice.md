# 15 — Roadmap: full-service-byrå

> Verifierat nuläge 2026-05-30. Vägen från nuvarande SEO-automation till kontrollerad full-service-byrå (e-handel på en dag, radiospots, reklamfilm) med kostnadskontroll.

## Prioriterade fixar (separata pass — härledda ur kartläggningen)

Ordnade efter värde/risk. Inga utförs i detta kartläggningspass.

### P0 — Tysta fel & säkerhet (gör först)
1. **Saknade BQ-tabeller** som orsakar tysta fel: `content_blueprints`, `keyword_research_log`, `ace_decisions`. Skapa eller omdirigera ([07](07-produktfeeds.md), [08](08-content-blueprint.md)).
2. **Säkerhet:** rotera GitHub PAT + WP-creds i historik, flytta hårdkodade secrets till SSM ([14](14-sakerhet-och-ssm.md)).
3. ✅ ~~**weekly-report-cron:** besluta auto vs manuell sändning~~ — KLART 2026-05-30: avsiktligt automatiskt, skyddat av tom-mail-gate + dag-före pre-flight (`seo-report-preflight`) ([05](05-rapporter.md)).

### P1 — Kanban som spindel
4. Flytta optimizerns primärkälla `action_plans` → `seo_work_queue` ([04](04-kanban-och-loggning.md)).
5. Done-transition-loggning istället för direkt-skrivning.
6. ✅ ~~Riv ut Trello-koden ur weekly-report~~ (klart 2026-05-30) — kvar i content-blueprint-generator (`createTrelloCard`), ersätt med kanban-jobb.

### P2 — Optimizer-kapacitet
7. Bygg + testa säker content-write → slå av SAFE_MODE per task-typ ([02](02-optimizer.md)).
8. Lägg till CWV/hastighet/lazyload-spår (saknas helt).
9. Rensa legacy FREE_MODELS-config + döda Lambda-filer ([01](01-infrastruktur.md)).

### P3 — Kvalitet
10. Kvalitetstooling i searchboost-react (eslint/prettier/tsc/lighthouse/playwright) ([12](12-headless-webbygge.md)).
11. OpenRouter code-review-pipeline (pr-agent) ([13](13-kvalitet-och-codereview.md)).

## Full-service — nya capabilities

| Tjänst | Vad krävs | Bygg på |
|--------|-----------|---------|
| **E-handel på en dag** | Headless starter-template + Shopify/WooCommerce-provisionering + feed-optimizer | [12](12-headless-webbygge.md), [07](07-produktfeeds.md) |
| **Produktfeed-optimering** | Ny Lambda: Abicart/Woo → Merchant Center, GTIN/brand/titel ([07](07-produktfeeds.md)) | data-collector-mönstret |
| **Unified ads/social-MCP** | MCP som wrapar google-ads + social-scheduler så Mikael styr via Claude ([09](09-ads-och-social.md)) | befintliga Lambdas |
| **Radiospots** | Manus-generering (Claude) + TTS (ElevenLabs e.likn.) + leveransflöde | content-pipeline-mönstret |
| **Reklamfilm** | Storyboard + video-gen (Runway/Veo via API) + asset-hantering | xAI grok-image redan integrerad |
| **Multi-agent-team** | crewAI/langgraph-mönster: SEO-agent, ads-agent, content-agent, review-agent ([13](13-kvalitet-och-codereview.md)) | OpenRouter-routing finns |

## Kostnadskontroll

Befintligt: `cost-tracker` (sön 19:00) → `cost_weekly_metrics`, `cost_time_log`, `cost_fixed_tools`. Prompt-A/B i `prompt_ab_log`.

Att utöka:
- Logga OpenRouter-tokenkostnad per Lambda + per kund (tier-koppling, [10](10-dashboards.md)).
- Modell-routing redan kostnadsmedveten (tier1 Gemini Flash Lite för enkla tasks). Verifiera att inget kör Sonnet i onödan.
- Code-review-pipeline: två-stegs (billig scan → dyr djup) håller granskningskostnaden nere.
- Dashboard-vy: kostnad per kund vs intäkt (TIER_LIMITS-belopp) → marginalkoll.

## Reverse-engineering-lista (köp inte, bygg/integrera)

| Behov | Istället för | Approach |
|-------|--------------|----------|
| Code review | Cursor-prenumeration | pr-agent + OpenRouter |
| Feed-hantering | Betald feed-SaaS | Egen Lambda mot Merchant Content API |
| Multi-LLM | Flera prenumerationer | OpenRouter (en nyckel, alla modeller) |
| Observability | Betald APM | Langfuse + cost-tabeller i BQ |
| Presentationer | Canva/Gamma-abonnemang | presentation-generator finns redan + Gamma MCP vid behov |

## Milstolpar (förslag — Mikael prioriterar)

1. **Vecka 1–2:** P0 (tysta fel + säkerhet).
2. **Vecka 3–4:** P1 (kanban-spindeln klar).
3. **Månad 2:** P2 (content-write + CWV i optimizern) + P3 (tooling + review-pipeline).
4. **Månad 3+:** full-service capabilities, en i taget, med kostnadsmätning innan skalning.
