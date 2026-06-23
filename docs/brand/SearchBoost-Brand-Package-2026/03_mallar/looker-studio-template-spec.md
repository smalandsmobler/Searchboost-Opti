# Looker Studio Template — Searchboost Månadsrapport

> Mikael bygger denna template **en** gång → kopierar `reportId` → vi använder Linking API för att öppna per-kund-versioner. Spec nedan är så detaljerad att designen inte kan glida.

## Datakälla

**BigQuery Custom Query** — projektet `seo-aouto`:

```sql
SELECT * FROM `seo-aouto.seo_data.monthly_kpi_summary_v1`
WHERE month >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
```

Lägg till en **report-level filter control** på `customer_id` (Dropdown). URL-parameter `params.ds0.customer_id` sätter detta automatiskt per kund-länk.

För GSC-detaljer (top queries + top pages) lägg till en andra datakälla:

```sql
SELECT customer_id, date, query, page, SUM(clicks) clicks, SUM(impressions) impressions, AVG(position) avg_pos
FROM `seo-aouto.seo_data.gsc_daily_metrics`
WHERE date >= DATE_SUB(CURRENT_DATE(), INTERVAL 12 MONTH)
GROUP BY customer_id, date, query, page
```

## Layout

Tre sidor (sektioner):

### Sida 1 — Översikt
- **4 stora scorecards** (motsvarar email-KPI-grid):
  - Klick (`SUM(gsc_clicks)`)
  - Visningar (`SUM(gsc_impressions)`)
  - Snittposition (`AVG(gsc_avg_position)`)
  - SEO-åtgärder (`SUM(optimizations_count)`)
- **Linjediagram över 12 månader** — `month` på x, `gsc_clicks` på y (primary), `gsc_impressions` på sekundär y-axel (gråare)
- **Procentförändring vs föregående månad** — beräknat fält per scorecard
- Page-bakgrund: `#05050f`

### Sida 2 — Sökord & Sidor
- **Tabell top queries (vänster)**: query, klick, visningar, snittposition. Sortera på klick DESC.
- **Tabell top pages (höger)**: pathname, klick, visningar. Sortera på klick DESC.
- Page-storlek: 1200 × 900px för att passa båda

### Sida 3 — Åtgärder & utveckling
- **Stacked bar chart per månad**: `meta_optimizations`, `schema_optimizations`, `content_optimizations` stacked. X = month.
- **Tabell med error-tasks**: lista kvarliggande fel från work_queue.
- Visar tydligt vad Searchboost gjort över tid.

## Branding

### Färger (lägg in i Theme/Style)
- Background: `#05050F`
- Section/card background: `#0E0C19`
- Border: `rgba(233, 30, 140, 0.15)` (eller `#241128` solid)
- Primary chart color: `#E91E8C` (Searchboost Pink)
- Secondary chart color: `#C026D3` (Electric Purple)
- Tertiary (för stacked): `#7C5CFF`
- Comparison line color: `#C8B8E0` (Lavender, för "förra perioden")
- Text primary: `#FFFFFF`
- Text secondary: `#C8B8E0`
- Text muted (labels): `#7A6E90`

### Typografi
Looker Studio stödjer bara begränsad set. Använd:
- Headings: **"Roboto"** (Looker default) — Bold, letter-spacing 0
- Body: **"Roboto"** — Regular
- Helst sätt även "Inter" via custom CSS om embedded; default Roboto för säkerhet.
- Number-formatting: använd EU-format (`1 234` mellanslag som tusentalsavgränsare)

### Komponentmått
- Scorecard padding: 24px allsidors
- Scorecard radius: 12px (sätts via "Border radius" om tillgängligt; annars använd inramning)
- Chart titles: 14px semibold uppercase letter-spacing 0.1em
- Chart values: 32px bold
- Tabell-rader: 36px höjd, alternerande `#0E0C19` / `#080818`

### Logo
Hämta vit logotyp från `https://opti.searchboost.se/logo-white.png` (eller ladda upp via Looker Studio Image-komponent). Placera överst vänster på sida 1, 88px bred.

## Linking API per kund

```js
function buildLookerStudioUrl(customerId) {
  const params = new URLSearchParams({
    params: JSON.stringify({ ds0: { customer_id: customerId } }),
  });
  return `https://lookerstudio.google.com/reporting/MASTER_TEMPLATE_ID?${params}`;
}
```

`MASTER_TEMPLATE_ID` ersätts med det riktiga report-ID Mikael får när han sparar template-rapporten.

## Säkerhet / data-isolering

För nu: URL-parametern filtrerar, men en kund kan teoretiskt ändra parametern och se annans data. För riktig RLS — bygg en `monthly_kpi_summary_secured`-view med BQ row-level security baserat på `SESSION_USER()`. Görs i separat pass.

## Steg för Mikael

1. https://lookerstudio.google.com → **+ Create** → **Report**
2. Välj datakälla: BigQuery → Custom Query (kopiera SQL ovan) → projekt `seo-aouto`
3. Bygg sida 1 enligt spec ovan, applicera färgerna
4. Kopiera sida 1 → sida 2 (sökord/sidor) → sida 3 (åtgärder)
5. Lägg till filter-control på `customer_id` (Report-level)
6. **File → Share → Manage access → "Allow anyone with the link"** (eller riktad delning per kund)
7. **Resource → Manage added data sources → ✓ Owner credentials** (så kunderna ser sin data)
8. **File → Make a copy → "Make this report available as a template"**
9. Kopiera report-ID från URL:en (`reporting/<ID>/page/...`)
10. Skicka ID till mig — jag uppdaterar `MASTER_TEMPLATE_ID` i email-templaterna + i Lambda
