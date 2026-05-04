# searchboost — SEO Tasks & Regressionslogg

> Kund: searchboost.se | Status: Aktiv | GSC: OK | WP-creds: OK
> Senast uppdaterad: 2026-05-04

## Regressionsvarningar

### 2026-05-04 (måndag — v18)
**Status: Ej kontrollerad — EC2-servern otillgänglig (503)**

GSC-data ligger i BigQuery (`gsc_daily_metrics`). Reggressionskontrollen kräver antingen:
- EC2 API på `51.21.116.7` (returnerade 503 vid körning)
- Direktåtkomst till BigQuery via GCP-credentials

Ingen jämförelse möjlig denna körning.

### Veckosammanfattning 2026-05-04
- Kunder kontrollerade: 0/9 (server otillgänglig)
- Verktyg saknade: `perispa_switch_site`, `perispa_gsc_top_queries`
- Åtgärd: Kontrollera PM2-status på EC2 (`pm2 status seo-mcp`)

## Aktiva uppgifter
- Ingen specifik uppgiftslista ännu — lägg till vid behov
