# 18 — Månadsrapport-pipeline

> Verifierat 2026-05-31. Bygger på `lambda-functions/monthly-client-report.js` + ny BQ-view `monthly_kpi_summary_v1` + Looker Studio template.

## Två leveranser per kund

1. **Mail** — HTML från Lambda `seo-monthly-client-report`. Skickas första dagen i månaden för föregående kalendermånad. Renderar KPI-kort, top sökord, top sidor, åtgärds-breakdown, CTA till Looker Studio.
2. **Looker Studio dashboard** — interaktiv vy mot `seo-aouto.seo_data.monthly_kpi_summary_v1` filtrerad på `customer_id`. CTA-knappen i mailet öppnar kundens dashboard direkt.

## BQ-view `monthly_kpi_summary_v1`

Skapades 2026-05-31. Aggregerar per kund × månad från fem källor:

| Källa | Kolumner i view |
|-------|-----------------|
| `gsc_daily_metrics` | `gsc_clicks`, `gsc_impressions`, `gsc_avg_position`, `gsc_days`, `gsc_unique_queries` |
| `ga4_daily_metrics` | `ga4_sessions`, `ga4_users`, `ga4_conversions`, `ga4_engaged_sessions`, `ga4_revenue` |
| `ads_daily_metrics` | `ads_impressions`, `ads_clicks`, `ads_spend`, `ads_conversions`, `ads_conversion_value` |
| `seo_optimization_log` | `optimizations_count`, `meta_optimizations`, `schema_optimizations`, `content_optimizations` |
| `seo_work_queue` | `tasks_completed`, `tasks_error`, `tasks_skipped` |

`FULL OUTER JOIN ... USING (customer_id, month)` — så även kund utan GSC men med Ads/GA4 visas. Definition i `/tmp/monthly_kpi_view.sql` (kommitta till repo i separat pass).

## Email-layout

Bygger HTML med inline-styling (för mail-klient-kompabilitet):

- **Header**: gradient (`#0e0c19 → #1f1a3a`), "Searchboost · SEO-rapport", kundnamn, periodlabel
- **Intro**: hälsning till contact-person + 1 mening
- **KPI-grid (2x2)**: klick, visningar, snittposition, SEO-åtgärder + procentförändring vs förra månaden
- **Top sökord (8 rader)**: query, klick, visningar, snittposition
- **Top sidor (5 rader)**: sökväg, klick, visningar
- **Åtgärds-breakdown (3 kort)**: meta, schema, innehåll
- **CTA**: stor knapp "Öppna full dashboard" → Looker Studio
- **Footer**: kontakt-info + opti.searchboost.se-länk

Färdig generator: `/tmp/monthly_preview.js` (kommitta till `tools/preview/` i separat pass).

## Dry-run / preview-läge

`tools/preview/monthly_preview.js` (kommer kommittas) eller direkt-kör med:

```bash
cd lambda-functions
node /tmp/monthly_preview.js
```

Skriver `/tmp/monthly_previews/<customer>.html` + `index.html`. Skickar **inte** mail.

Senaste preview (maj 2026): https://opti.searchboost.se/preview/index.html

## Looker Studio template

| Steg | Status |
|------|--------|
| BQ-view klar | ✅ `seo-aouto.seo_data.monthly_kpi_summary_v1` |
| Master-template skapad | ❌ Mikael skapar manuellt + delar `reportId` |
| Linking API-URL per kund | ⚠️ Genereras i `buildLookerStudioUrl(customerId)` med placeholder `MASTER_TEMPLATE_ID` |
| Plausible Community Connector | ❌ Aktiveras när Plausible har data (se [16-plausible.md](16-plausible.md)) |

### Master-template specifikation

Mikael skapar i Looker Studio:
1. **Datasource**: BigQuery Custom Query, projekt `seo-aouto`, query:
   ```sql
   SELECT * FROM `seo-aouto.seo_data.monthly_kpi_summary_v1`
   WHERE month >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
   ```
2. **Filter på sidnivå**: `customer_id` (sätts via URL-parameter `params.ds0.customer_id`)
3. **Sidor**:
   - Översikt: 4 stora scorecards (klick, visningar, snittposition, SEO-åtgärder) + linjediagram över 12 månader
   - Sökord: tabell med GSC top queries (separat query mot `gsc_daily_metrics`)
   - Sidor: tabell med GSC top pages
   - Åtgärder: breakdown av optimeringstyper per månad
   - Ads: spend, klick, konv (endast om kunden har ads-data)
4. **Branding**: Searchboost dark navy (`#0e0c19`), Inter font, runda hörn 8px på cards.
5. Spara → "Make this report available as a template" → kopiera `reportId` (i URL:en) → uppdatera `MASTER_TEMPLATE_ID` i preview-scriptet.

### Per-kund-URL (Linking API)

```js
function buildLookerStudioUrl(customerId) {
  const params = new URLSearchParams({
    'params': JSON.stringify({ ds0: { customer_id: customerId } }),
  });
  return `https://lookerstudio.google.com/reporting/CREATE?c.reportId=MASTER_TEMPLATE_ID&${params}`;
}
```

Detta öppnar Looker Studio i "copy template"-läge med kundens filter förvalt. Alternativ: bädda in `/embed/`-URL i kundzonen.

## Säkerhet / data-läckage

- Kunder ser bara sin egen `customer_id` (URL-parameter sätter filter, men för riktig data-isolering krävs Row-Level Security i BQ — separat pass: skapa view `monthly_kpi_summary_secured` med `SESSION_USER()`-check).
- Mikael har full access (han äger projektet).

## GÖR vs BORDE GÖRA

| Område | GÖR idag | BORDE GÖRA (gap) |
|--------|----------|-------------------|
| HTML-rapport per kund | ✅ Preview live för maj 2026 | — |
| BQ-view | ✅ `monthly_kpi_summary_v1` | Bygg `_secured`-variant med RLS |
| dry_run-flagga i Lambda | ❌ Bara externt script | Lägg `event.dry_run` i `monthly-client-report.js` → skriver HTML till S3 istället för att maila |
| Looker Studio template | ❌ | Mikael skapar + delar `reportId` (~10 min) |
| AI-summary | ✅ Claude Haiku 4.5 via direkt Anthropic SDK (model-ID-fix krävs: `claude-haiku-4-5` korrekt för Anthropic SDK) | OK efter fix |
| Plausible-data | ❌ Plausible saknar data | Aktiveras enligt [16-plausible.md](16-plausible.md) roadmap |
| Schemalägging | ⚠️ EventBridge-cron finns men ej verifierat | Kör pre-flight via `seo-report-preflight` 30 min före faktiskt utskick |

## Avsändar-email + SMTP

Skickar via Loopia SMTP (samma som weekly-report):

| Param | Värde |
|-------|-------|
| `/seo-mcp/email/smtp-host` | `mailcluster.loopia.se` |
| `/seo-mcp/email/username` | `info@searchboost.se` |
| `/seo-mcp/email/password` | (SSM SecureString) |
| `/seo-mcp/email/from` | `noreply@searchboost.se` |
| `/seo-mcp/email/recipients` | `mikael@searchboost.se` (intern sammanfattning) |

På sikt: flytta till BillionMail (utskick.searchboost.se) när port 25 är öppen och deliverability verifierad — då slipper vi Loopias sändgränser och kan skala till 2000+ prospekt-utskick parallellt.

## Roadmap

1. ✅ View skapad
2. ✅ HTML-preview för maj 2026 live
3. ⏳ Mikael skapar Looker Studio master-template
4. ⏳ `MASTER_TEMPLATE_ID` injectas i `monthly-client-report.js` + preview-script
5. ⏳ `dry_run` event-flagga i Lambda
6. ⏳ EventBridge-cron verifieras: 1:a varje månad 08:00 UTC
7. ⏳ Pre-flight (`seo-report-preflight`) körs 30 min före och blockerar utskicket om data saknas eller billing trasig
