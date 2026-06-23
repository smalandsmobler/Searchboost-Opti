# 03 — Datapipeline (data-collector + ga4-collector)

> Källor: `lambda-functions/data-collector.js` (1121 rader, `seo-data-collector`, var 6:e timme) och `ga4-collector.js` (236 rader, `seo-ga4-collector`, dagligen 02:30 UTC). Verifierat 2026-05-30.

## data-collector

Samlar in från flera källor och skriver till partitionerade dagstabeller.

| Källa | API | Auth | BQ-måltabell |
|-------|-----|------|--------------|
| Google Search Console | `webmasters/v3/.../searchAnalytics/query` (rad 369) | SA, scope `webmasters.readonly` (rad 269) | `gsc_daily_metrics` (rad 411) |
| Annonser (Google/Meta/LinkedIn/TikTok) | Supermetrics-connector (rad 445-448) | SSM per-kund account-id | `ads_daily_metrics` |

Annonskonton mappas via SSM:
```
supermetrics-gads-account-id      → google_ads
supermetrics-meta-account-id      → meta_ads
supermetrics-linkedin-account-id  → linkedin_ads
supermetrics-tiktok-account-id    → tiktok_ads
```

Mekanik:
- `ensureTables()` (rad 152) skapar tabeller vid behov.
- `dedupeAndInsert()` (rad 291) tar bort dubbletter, batchar 500 rader (rad 319).
- `logCollection()` (rad 325) loggar varje körning i `data_collection_log`.
- `shouldAbort()`/`timeRemaining()` (rad 54-58) skyddar mot Lambda-timeout.
- `withRetry()` (rad 103) — 3 försök med backoff.

## ga4-collector

Hämtar GA4 via Data API och skriver till `ga4_daily_metrics` (rad 83).

- **Krav (rad 7):** Service Account måste ha **Viewer**-roll på varje GA4-property (GA4 Admin → Property Access Management → Add user → SA-email → Viewer). Kunder utan property-id hoppas över (rad 182).
- Hämtar både sid-rapport (rad 96) och source-rapport (rad ~160).
- Kund-property-mappning ligger hårdkodad i filen (rad 25) — **gap:** borde ligga i SSM/BQ som övrig kundconfig.

## GÖR vs BORDE GÖRA

| Område | GÖR | BORDE |
|--------|-----|-------|
| GSC | ✅ Hämtar och skriver dagligen | — |
| Ads | ✅ Via Supermetrics | Verifiera att alla 4 plattformar faktiskt har konfigurerade account-id per kund |
| GA4 | ✅ Hämtar | Kund→property-mappning hårdkodad i `ga4-collector.js` rad 25 → flytta till SSM/BQ |
| Schema | MemPalace sa "dagligen 04:00" | Verkligt: data-collector var 6:e timme (se [01](01-infrastruktur.md)) |
| Social metrics | `social_daily_metrics` finns som tabell | Verifiera vilken Lambda som fyller den (ej data-collector) |
