# 01 — Infrastruktur

> Verifierad live 2026-05-30. AWS-profil `mikael`, region `eu-north-1`, konto `176823989073`. EC2 `51.21.116.7` (instans `i-0c36714c9c343698d`, SG `sg-03cb7d131df0fbfb7`). BQ-projekt `seo-aouto`, dataset `seo_data`.

## EC2

En instans kör allt serverlojligt via PM2:

| PM2-process | id | Port | Path | Roll |
|-------------|----|----|------|------|
| `seo-mcp` | 0 | — | `/home/ubuntu/Searchboost-Opti/mcp-server-code` | API + Opti-dashboard + kundportal |
| `affarsboost-app` | 3 | 3002 | `/home/ubuntu/Searchboost-Opti/affarsboost-app` | Affärsboost-appen |

Deploy: se MemPalace-sökning "deploy" (port 22 öppnas per IP, SSH-nyckel pushas med 60s-fönster, scp + build + pm2 restart, port 22 stängs).

## Lambdas (28 live)

Verifierat via `aws lambda list-functions`. Lokala `.js`-filer som **saknar** live-motsvarighet = sannolikt döda (se nederst).

### SEO-kärna

| Lambda | Lokal fil | Cron (UTC) | Schema-namn |
|--------|-----------|------------|-------------|
| `seo-autonomous-optimizer` | autonomous-optimizer.js | `cron(0 */6 * * ? *)` var 6:e h | seo-optimizer-trigger |
| `seo-data-collector` | data-collector.js | `cron(0 */6 * * ? *)` var 6:e h | seo-data-collector-daily |
| `seo-ga4-collector` | ga4-collector.js | `cron(30 2 * * ? *)` 02:30 | seo-ga4-collector-daily |
| `seo-weekly-audit` | weekly-audit.js | `cron(0 4 * * ? *)` 04:00 | seo-weekly-audit-trigger |
| `seo-keyword-researcher` | keyword-researcher.js | `cron(0 6 ? * MON *)` mån 06:00 | seo-keyword-researcher-weekly |
| `seo-regression-watcher` | regression-watcher.js | `cron(0 4 * * ? *)` 04:00 | seo-regression-watcher-daily |
| `seo-algorithm-watcher` | algorithm-watcher.js | `cron(0 4 ? * MON *)` mån 04:00 | seo-algorithm-watcher-trigger |
| `seo-skill-watcher` | skill-watcher.js | `cron(30 4 ? * MON *)` mån 04:30 | seo-skill-watcher-trigger |
| `seo-bq-table-guard` | bq-table-guard.js | `cron(0 5 * * ? *)` 05:00 | seo-bq-table-guard-daily |
| `seo-cred-check` | cred-check.js | `cron(0 5 * * ? *)` 05:00 | seo-cred-check-daily |

### Content

| Lambda | Lokal fil | Cron (UTC) | Schema-namn |
|--------|-----------|------------|-------------|
| `seo-content-blueprint-generator` | content-blueprint-generator.js | `cron(0 6 1 * ? *)` 1:a kl 06:00 | seo-content-blueprint-monthly |
| `seo-content-gap-analyzer` | content-gap-analyzer.js | `cron(30 5 ? * MON *)` mån 05:30 | SearchboostOpti-content-gap-analyzer |
| `seo-auto-article-generator` | auto-article-generator.js | `cron(0 5 ? * WED *)` ons 05:00 | seo-auto-article-generator-schedule |
| `seo-schema-markup-optimizer` | schema-markup-optimizer.js | `cron(0 5 ? * TUE *)` tis 05:00 | SearchboostOpti-schema-markup-optimizer |
| `seo-llms-txt-generator` | llms-txt-generator.js | `cron(0 6 ? * MON *)` mån 06:00 | seo-llms-txt-generator-weekly |

### Ads / social / merch

| Lambda | Lokal fil | Cron (UTC) | Schema-namn |
|--------|-----------|------------|-------------|
| `seo-google-ads-optimizer` | google-ads-optimizer.js | `cron(0 7 ? * MON *)` mån 07:00 | SearchboostOpti-google-ads-optimizer |
| `seo-social-scheduler` | social-scheduler.js | `cron(0/15 * * * ? *)` var 15:e min | seo-social-scheduler-cron |
| `seo-adaptive-merchandiser` | adaptive-merchandiser.js | `cron(0 4 * * ? *)` 04:00 | seo-adaptive-merchandiser-daily |

### Rapporter / larm

| Lambda | Lokal fil | Cron (UTC) | Schema-namn |
|--------|-----------|------------|-------------|
| `seo-weekly-report` | weekly-report.js | `cron(0 13 ? * FRI *)` fre 13:00 = **15:00 CEST** | seo-weekly-report-trigger |
| `seo-monthly-client-report` | monthly-client-report.js | `cron(0 7 1 * ? *)` 1:a kl 07:00 | SearchboostOpti-monthly-client-report |
| `seo-report-preflight` | report-preflight.js | `cron(0 7 ? * THU *)` tor 09:00 CEST | seo-report-preflight-weekly |
| `seo-report-preflight` | report-preflight.js | `cron(0 7 L * ? *)` sista dagen i mån | seo-report-preflight-monthly |
| `seo-alert-dispatcher` | seo-alert-dispatcher.js | `cron(0 6 * * ? *)` 06:00 | SearchboostOpti-alert-dispatcher |
| `cost-tracker` | cost-tracker.js | `cron(0 19 ? * SUN *)` sön 19:00 | cost-tracker-weekly |

> **Rapportflöde (verifierat 2026-05-30):** `seo-weekly-report-trigger` (fre 15:00 CEST) och `SearchboostOpti-monthly-client-report` (1:a) är ENABLED och skickar **avsiktligt** automatiskt enligt Mikaels mandat. Skydd mot tomma mail: (1) tom-mail-gate i weekly-report (kund utan loggat arbete får inget mail), (2) `seo-report-preflight` larmar Mikael internt dagen innan (tor + sista dagen i mån). CLAUDE.md-regeln "kör aldrig weekly-report utan explicit kör nu" gäller fortfarande **manuell** invokation. Se [05-rapporter.md](05-rapporter.md).

### Fortnox / Affärsboost (sidospår)

| Lambda | Cron (UTC) | Schema-namn |
|--------|------------|-------------|
| `seo-fortnox-sync` | `cron(0 6 * * ? *)` 06:00 | seo-fortnox-sync-daily |
| `seo-fortnox-nl-command` | (event-driven) | — |
| `affarsboost-daily-report` | `cron(0 7 ? * MON-FRI *)` | affarsboost-daily-report-schedule |
| `affarsboost-social-publisher` | `cron(0 8 ? * MON,WED,FRI *)` | affarsboost-social-publisher-schedule |
| `affarsboost-uptime` | `rate(5 minutes)` | affarsboost-uptime-5min |

## Lokala Lambda-filer UTAN live-deployment (sannolikt döda)

Dessa `.js` finns i `lambda-functions/` men har ingen live-Lambda med matchande namn:

- `ai-visibility-tracker.js`
- `backlink-monitor.js`
- `content-publisher.js`
- `performance-monitor.js`
- `prompt-improver.js`
- `prospect-analyzer.js`
- `ranking-tracker.js`
- `sales-meet-processor.js`
- `sales-morning-briefing.js`
- `security-monitor.js`
- `social-poster.js` (finns även i `mcp-server-code/` — dubblett)
- `viktor-day-scheduler.js` (Viktor slutat 2026-03-09 — kandidat för radering)

**Åtgärd (separat pass):** verifiera var och en — antingen deploya (om avsedd), arkivera, eller radera. Markera inte som sanning i kunskapsbasen att de "körs".

## Diskrepanser mot tidigare dokumentation

| Påstående (MemPalace/CLAUDE.md) | Verifierat live |
|----------------------------------|-----------------|
| data-collector körs dagligen 04:00 | Körs **var 6:e timme** (`cron(0 */6 * * ? *)`) |
| weekly-report skickas bara manuellt | Cron `seo-weekly-report-trigger` är **ENABLED** fre 13:00 UTC — avsiktligt automatiskt, skyddat av tom-mail-gate + pre-flight (2026-05-30) |
| weekly-report läser Trello | Trello **borttaget** 2026-05-30; manuellt arbete kommer från `seo_optimization_log` |

## BigQuery — 45 tabeller i `seo-aouto.seo_data`

Grupperade efter funktion:

**Kanban / åtgärder / loggar:** `action_plans`, `seo_work_queue`, `seo_optimization_log`, `schema_optimization_log`, `llms_txt_log`, `seo_regression_log`, `performance_log`, `prompt_ab_log`, `ace_momentum_log`, `data_collection_log`, `tasks`, `customer_tasks`, `headless_pending_fixes`

**Kundregister:** `customer_keywords`, `customer_pipeline`, `customer_users`, `customer_cred_status`, `salespeople`

**Metrics (partitionerade på datum):** `gsc_daily_metrics`, `ga4_daily_metrics`, `ads_daily_metrics`, `social_daily_metrics`

**Social / content:** `social_posts`, `social_content_queue`, `content_opportunities`, `ads_optimization_suggestions`

**Backlinks:** `backlink_snapshots`, `backlink_anchors`, `backlink_refdomains`

**Rapporter:** `weekly_reports`, `monthly_report_log`

**Kostnad:** `cost_weekly_metrics`, `cost_time_log`, `cost_fixed_tools`

**Intel:** `seo_alerts`, `seo_algorithm_intel`, `seo_skill_inventory`

**Affärsboost:** `affarsboost_subscriptions`, `affarsboost_waitlist`

**Agentminne:** `ruflo_agent_memory`

**Testtabeller (kandidater för radering):** `gsc_backfill_test_1777150920768`, `gsc_bftest_1777150942161`

> Streaming inserts kräver **plain ISO-string** för timestamp, inte `{ value: '...' }`-objekt. Många tabeller har 60-dagars partition expiry (`expirationMs: 5184000000`).

## SSM — ~200 params under `/seo-mcp/`

Trädstruktur:

```
/seo-mcp/
  openrouter/api-key
  cursor/api-key
  portal/jwt-secret
  dashboard/api-key
  email/password
  bigquery/project-id            (= seo-aouto)
  xai/api-key
  integrations/{kund}/...         (GA4, GSC, Ads-kopplingar per kund)
  wordpress/{kund}/...            (WP-creds per kund)
  design/{kund}/...
  shopify/...
  loopia/...
  ssh/...
  (social-tokens per kund)
/affarsboost/*                    (separat rot)
/claude-sync/*                    (dotfiles-sync, separat rot)
```

> Vissa secrets ligger som **plain params** (några namngivna som lösenord). Hygien-genomgång + namnschema i [14-sakerhet-och-ssm.md](14-sakerhet-och-ssm.md).
