# 05 — Rapporter (vecko- + månadsmail + dag-före-kontroll)

> Källor: `lambda-functions/weekly-report.js` (1209 rader, `seo-weekly-report`, fre 13:00 UTC = 15:00 CEST), `monthly-client-report.js` (591 rader, `seo-monthly-client-report`, 1:a varje månad 07:00 UTC) och `report-preflight.js` (`seo-report-preflight`, dag-före-kontroll). Verifierat mot deployad källa 2026-05-30 18:15.

## Veckomail (weekly-report)

### Datakällor (handler rad 1074-1108)
- `seo_optimization_log` — alla optimeringar senaste 7 dagarna.
- `seo_work_queue` — köstatus (`GROUP BY status`).
- `getCustomerMetrics()` (rad 90) — GSC-klick/visningar/position per kund, topp-queries.
- Dubblettskydd: kollar `weekly_reports` om rapport redan körts (rad 1108).

### Sammanställning
- `getActiveCustomers()` (rad 297) → aktiva kunder (`customer_pipeline WHERE stage='aktiv'`).
- `groupByCustomer(optimizations, customers)` (rad 337) grupperar optimeringar per kund. **Ingen Trello-param längre.**
- `buildCustomerReportHTML(customer, optimizations, weekLabel, metrics, introMessage)` (rad 382) — kundens HTML-mail. `hasWork`-gren vid rad 534.
- `buildInternalReportHTML(groups, optimizations, queueStats, weekLabel, allMetrics, introMessage)` (rad 598) — internt sammanfattningsmail till Mikael (alla kunder, klick, visningar, köstatus). Stats-box = 4 celler (Opt / Kunder / Klick GSC / kr ads).
- `buildUpsellOpportunities()` (rad 770) — föreslår merförsäljning.

### Tom-mail-gate (kärnskydd, rad 1121-1126)
```js
const hasWork = group.optimizations.length > 0;
if (!hasWork) {
  console.log(`Skippar kundmail ${customerId}: inget loggat arbete denna vecka`);
  customerResults.push({ customer_id: customerId, sent: false, reason: 'no_work_logged' });
  continue;
}
```
Kund utan loggat arbete i fönstret får **inget** mail. Fallback-texten "Inget specifikt arbete loggat" i `buildCustomerReportHTML` är därmed onåbar i kundutskick.

### Sändning + loggning
- `nodemailer` (via `getTransporter` rad 27) via Loopia SMTP, host från SSM `/seo-mcp/email/smtp-host` (rad 29).
- Kundmail: `sendMail` rad 1143, sedan streaming insert till `weekly_reports` rad 1156 (`created_at`/`sent_at` = plain ISO-string).
- Internt mail: `sendMail` rad 1173, streaming insert med `customer_id: 'internal'` rad 1182.
- `emailStatus`-logik: `optimizations.length === 0 ? 'Inget mail (inget arbete)' : (contact_email ? 'Skickat' : 'Inget mail (saknar e-post)')`.

### Status — GÖR vs BORDE GÖRA

| Punkt | Status |
|-------|--------|
| Trello-beroende | ✅ **Borttaget** 2026-05-30. `getTrelloDoneCards`/`extractCustomerFromCard`/`axios` finns ej kvar. Manuellt arbete läses nu från `seo_optimization_log` (kanban → done-transition). |
| Tom-mail-gate | ✅ **Aktiv** (rad 1121). Inga tomma åtgärdsmail. |
| Cron `seo-weekly-report-trigger` | ✅ ENABLED fre 13:00 UTC = **15:00 CEST**. Avsiktligt automatiskt (Mikaels mandat). Skyddat av tom-mail-gate + dag-före pre-flight. **Manuell** invokation kräver fortfarande explicit "kör nu" (CLAUDE.md). |
| Sammanfattningsmail till Mikael | ✅ Finns (`buildInternalReportHTML`). Regel uppfylld. |
| Streaming insert | ✅ Per-kund + internt (ersatte tidigare DML INSERT). Plain ISO-string för timestamp. |

## Månadsmail (monthly-client-report)

> OBS: deployas som `index.js` (handler `index.handler`), inte `monthly-client-report.handler`.

### Datakällor (rad 119-192)
- `getCustomerMetrics()` — GSC-klick, topp-queries (`SUM(clicks)`, `AVG(position)`), antal optimeringar. Fönster: `timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 30 DAY)` (rad 192 — fixat från `created_at`).
- Kundlista: `customer_pipeline WHERE stage = 'aktiv'` (rad 448 — fixat från `status='active'`).

### Sammanställning
- `generateAISummary()` (rad 206) — AI-genererad sammanfattning per kund.
- `buildEmailHtml()` (rad 246) — kundmail.
- `buildInternalSummaryHtml()` (rad 404) — internt sammandrag.
- Loggar till `monthly_report_log` (rad 396).

### Sändning
- `nodemailer` via SMTP (rad 100-119), `sendMail` rad 513 (kund) / 569 (internt). Faller tillbaka med "SMTP ej konfigurerat" (rad 522) om host saknas.

## Dag-före-kontroll (report-preflight) — NY 2026-05-30

> `lambda-functions/report-preflight.js` (~250 rader), `seo-report-preflight`, handler `report-preflight.handler`, nodejs20.x, timeout 180, mem 512.

### Syfte
Körs dagen innan utskick och kontrollerar per aktiv kund att (1) det finns loggat arbete i fönstret och (2) öppna `action_plans` listas så Mikael hinner slutföra + logga innan utskicket. **Mailar ENDAST Mikael internt — aldrig kundmail.**

### Event-parametrar
- `report_type`: `'weekly'` (default, 7-dagarsfönster) | `'monthly'` (30 dagar).
- `dry_run: true` → bygger HTML, skickar inget, returnerar HTML i body.

### Logik
- Aktiva kunder: `customer_pipeline WHERE stage='aktiv'`.
- Per kund: `COUNT(*)` i `seo_optimization_log` inom fönstret (parameteriserad `INTERVAL @days DAY`).
- Öppna åtgärder: `action_plans WHERE status IN UNNEST(@statuses)`, `OPEN_PLAN_STATUSES = ['planned','queued','pending']`, LIMIT 10.
- Blockerare = `work_count === 0` → rödflaggas i HTML. Mailar `/seo-mcp/email/recipients`.

### Cron
| Regel | Schema (UTC) | Innebörd |
|-------|--------------|----------|
| `seo-report-preflight-weekly` | `cron(0 7 ? * THU *)` | Torsdag 09:00 CEST, dagen före fredagsrapporten. Input `{"report_type":"weekly"}` |
| `seo-report-preflight-monthly` | `cron(0 7 L * ? *)` | Sista dagen i månaden, dagen före den 1:a. Input `{"report_type":"monthly"}` |

### Dry-run-resultat 2026-05-30
8 aktiva kunder, 7 blockerare (endast Smålands Kontorsmöbler hade loggat arbete senaste 7 dagarna). Bekräftar att pre-flight fångar tomma mail innan utskick.

## Kvarvarande åtgärdslista (separata pass)
1. ✅ ~~Riv ut Trello-koden~~ — klart 2026-05-30.
2. ✅ ~~Tom-mail-gate~~ — klart 2026-05-30.
3. ✅ ~~Pre-flight + cron~~ — klart 2026-05-30.
4. Verifiera att `generateAISummary` (månadsmail) använder rätt modell-routing (inte hårdkodad gammal modell).
5. Säkra logg-enforcement: allt manuellt + auto-arbete ska landa i `seo_work_queue` → `seo_optimization_log` så pre-flight aldrig flaggar falskt (se [04-kanban-och-loggning.md](04-kanban-och-loggning.md)).
