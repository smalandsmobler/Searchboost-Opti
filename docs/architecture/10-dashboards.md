# 10 — Dashboards (Opti + kundportal)

> Källa: `mcp-server-code/index.js` (7089 rader, monolit) + moduler. Live som PM2 `seo-mcp` på EC2. Verifierat 2026-05-30.

## Två dashboards, en server

- **Opti-dashboard** (internt, Mikael): statisk frontend i `../dashboard` (rad 67) + `/v2` i `dashboard-v2` (rad 68). Använder X-Api-Key (`/seo-mcp/dashboard/api-key`, rad 87).
- **Kundzon/portal** (kund): JWT-baserad. Login `/api/portal/login` (rad 102, ingen API-nyckel), token verifieras mot `/seo-mcp/portal/jwt-secret` (rad 112-116). Brute-force-skydd: rate limit 10 försök/15 min/IP + Slack-larm (rad 47-54).

## Auth-modell (rad 100-120)

```
/api/portal/login        → öppen (login)
/api/onboard             → egen auth (onboard/api-key)
Bearer JWT               → portalkund (req.portalCustomer)
X-Api-Key                → internt/dashboard
```

## Kontraktsnivåer — TIER_LIMITS (rad 713)

Styr hur mycket optimizern får göra per kund. Sätts av månadsbelopp (`getContractTier`):

| Tier | Månadsbelopp | Auto-tasks/mån | Manuella/mån | Content | Schema |
|------|--------------|----------------|--------------|---------|--------|
| basic | ≤ 5000 kr | 15 | 0 | nej | nej |
| standard | ≤ 10000 kr | 30 | 5 | nej | ja |
| premium | > 10000 kr | 50 | 10 | ja | ja |

> Detta är affärslogiken bakom hur många jobb action_plans får innehålla per kund (kopplar till optimizerns `LIMIT @maxTasks`).

## API-endpoints (urval, verifierade)

| Endpoint | Rad | Roll |
|----------|-----|------|
| `GET /api/customers` | 1018 | Kundlista |
| `GET /api/customers/onboarding-status` | 1032 | Onboarding-läge |
| `POST /api/customers/:id/credentials` | 1113 | Spara WP-creds + GSC från dashboard → SSM |
| `POST /api/customers/:id/test-wp-connection` | 1251 | Testa WP-koppling |
| `GET /api/optimizations` | 1293 | Logg-data |
| `GET /api/queue` | 1306 | Kanban-kö |
| `POST /api/queue/purge-junk` | 1319 | Rensa skräpjobb |
| `GET /api/pipeline` | 1357 | Pipeline-kanban |
| `POST /api/prospects` | 1380 | Nya prospekt |
| `POST /api/customers/:id/keywords` | 1543 | Sätt sökord |
| `POST /api/customers/:id/keywords/analyze` | 1615 | Kör sökordsanalys |
| `POST/GET /api/customers/:id/action-plan` | 1691/1848 | Åtgärdsplan (tier-begränsad) |
| `POST /api/customers/:id/action-plan/activate-month` | 1907 | Aktivera månadsplan |
| `POST /api/customers/:id/manual-audit` | 1951 | Manuell audit |
| `POST /api/customers/:id/manual-action-plan` | 2003 | Manuell plan |
| `POST /api/customers/:id/manual-work-log` | 2038 | **Logga manuellt arbete** |
| `GET /api/customers/:id/kanban` | 2217 | **Kanban per kund** |
| `POST /api/keyword-density/analyze` | 2160 | Sökordstäthet |

## Moduler i mcp-server-code

| Fil | Roll |
|-----|------|
| `portal-auth.js` | JWT-login/verifiering |
| `audit-endpoint.js` | Audit-API |
| `social-planner.js` | Social-planering |
| `social-poster.js` | (dubblett av Lambda — död?) |
| `supermetrics-connector.js` | Ads-data |
| `google-business-profile.js` | GBP |
| `presentation-generator.js` | Presentationer |
| `pdf-report-generator.js` / `report-exporter.js` | PDF/export |

## GÖR vs BORDE GÖRA

| Område | GÖR | BORDE |
|--------|-----|-------|
| Manuellt arbete | ✅ `/api/customers/:id/manual-work-log` finns | Säkerställ att detta skriver till `seo_work_queue` (kanban), inte bara logg |
| Kanban-vy | ✅ `/api/customers/:id/kanban` finns | Knyt ihop med optimizerns primärkälla [04](04-kanban-och-loggning.md) |
| Monolit | 7089 rader i en fil | Bryt ut routes till moduler (separat refaktorering, <800 rader/fil) |
| Hårdkodad X-Api-Key i CLAUDE.md/MemPalace | — | Flytta resonemang till SSM-only [14](14-sakerhet-och-ssm.md) |
