# 09 — Ads & social

> Källor: `lambda-functions/google-ads-optimizer.js` (380 rader, `seo-google-ads-optimizer`, mån 07:00 UTC), `social-scheduler.js` (501 rader, `seo-social-scheduler`, var 15:e min). Verifierat 2026-05-30.

## Är det en MCP eller bara Lambdas?

**Bara Lambdas.** `.mcp.json` har endast web-to-mcp, perispa, sequential-thinking. Det finns **ingen ads/social-MCP** wired. Ads och social körs schemalagt via EventBridge, inte konversationsstyrt via Claude. Detta svarar direkt på Mikaels fråga: nej, ingen MCP för att styra inlägg/annonser — de är autonoma Lambdas.

## google-ads-optimizer

Veckovis (mån 07:00), **förslag — applicerar inte automatiskt**:
1. `getAllCustomerIds()` (rad 42) — kunder med `google-ads-customer-id` i SSM.
2. `getAdsData()` (rad 100) + `getAdsKeywordData()` (rad 134) — 14 dagars kampanj/sökordsdata från `ads_daily_metrics`.
3. `generateOptimizationSuggestions()` (rad 160) — AI-genererade förslag.
4. Skriver till `ads_optimization_suggestions` (rad 339).
5. `buildEmailHtml()` (rad 208) — mailar förslagen.

**GÖR:** analyserar + föreslår + mailar. **GÖR INTE:** ändrar inget i Google Ads-kontot automatiskt (ingen write-back till Ads API).

## social-scheduler

Var 15:e minut — publicerar köade inlägg.

| Plattform | Funktion | Auth |
|-----------|----------|------|
| LinkedIn | `postToLinkedIn` (rad 149) + bilduppladdning (rad 112) | SSM per-kund token |
| Instagram | `postToInstagram` (rad 216) | SSM |
| Facebook | `postToFacebook` (rad 234) | SSM |

Mekanik:
- `getPendingPosts()` (rad 447) läser `social_content_queue` (status pending, schemalagd tid passerad).
- `publishPost()` (rad 245) → `markPosted()` (rad 256) / `markFailed()` (rad 269).
- `assertSwedishEncoding()` (rad 91) — ÅÄÖ-guard (encoding-skydd, CLAUDE.md-regel).
- `ensureUpcomingPosts()` (rad 344) — fyller på kö så det alltid finns kommande inlägg. `getNextPostDates()` (rad 323) följer schemat.

> LinkedIn-schema (CLAUDE.md): sön/tis/tors, max 3 inlägg/vecka per kund. Verifiera att `getNextPostDates` respekterar detta.

## social-poster.js — DUBBLETT

`social-poster.js` finns både i `lambda-functions/` och `mcp-server-code/` men har **ingen live-Lambda**. Sannolikt död/ersatt av social-scheduler. Verifiera + radera (separat pass).

## GÖR vs BORDE GÖRA

| Område | GÖR | BORDE (önskemål) |
|--------|-----|-------------------|
| Google Ads | ✅ Förslag + mail | Ev. auto-apply av säkra förslag (kräver Ads API write + guard) |
| Social publicering | ✅ LinkedIn/IG/FB via kö | — |
| Konversationsstyrning | ❌ Ingen MCP | **Unified ads/social-MCP** så Mikael kan styra annonser+inlägg via Claude (se [15](15-roadmap-fullservice.md)) |
| Meta/TikTok ads-optimering | data samlas in, ingen optimizer | Utöka optimizer till fler plattformar |
| social_daily_metrics | tabell finns | Verifiera vilken Lambda fyller den |
| Dubblett social-poster.js | — | Radera död fil |
