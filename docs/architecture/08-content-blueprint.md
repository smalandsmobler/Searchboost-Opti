# 08 — Content blueprint

> Källa: `lambda-functions/content-blueprint-generator.js` (320 rader, `seo-content-blueprint-generator`, 1:a varje månad 06:00 UTC). Verifierat 2026-05-30.

## Vad det är

Genererar en månatlig content-plan (blueprint) per kund baserat på sökord + GSC-möjligheter + befintligt innehåll.

Flöde:
1. `getCustomers()` (rad 37) — kunder med sökord i `customer_keywords`.
2. `getCustomerKeywords()` (rad 44) — keyword + tier.
3. `getGSCOpportunities()` (rad 57) — queries med potential (position-baserat).
4. `getExistingContent()` (rad 84) — befintliga URL:er från `seo_optimization_log` (undvik dubbletter).
5. `generateBlueprint()` (rad 102) — AI genererar planen (modell `claude-haiku-4-5-20251001`, hårdkodad rad 277).
6. `saveBlueprint()` (rad 175) — INSERT till `content_blueprints` (rad 204).
7. `createTrelloCard()` (rad 226) — skapar Trello-kort.

## ⚠️ GÖR vs BORDE GÖRA — två allvarliga gap

| Problem | Detalj |
|---------|--------|
| **`content_blueprints`-tabellen finns INTE i BQ** | INSERT rad 204 misslyckas tyst → blueprints persisteras aldrig. Detta är sannolikt varför content-planen "inte syns". **Borde:** skapa tabellen, eller skriv blueprint som jobb direkt i `seo_work_queue`/`action_plans`. |
| **Trello-kort skapas** (rad 226) | Trello är avvecklat → död integration. **Borde:** skapa kanban-jobb istället. |
| AI-modell hårdkodad | rad 277 `claude-haiku-4-5-20251001` → central routing |

## Koppling till andra Lambdas

```mermaid
flowchart LR
    CK[customer_keywords] --> CBG[content-blueprint-generator<br/>månadsvis]
    GSC[gsc_daily_metrics] --> CBG
    CBG -.->|BÖR| WQ[seo_work_queue]
    CBG -.x|content_blueprints SAKNAS| X[(tyst fel)]
    CGA[content-gap-analyzer<br/>mån 05:30] --> CO[content_opportunities]
    AAG[auto-article-generator<br/>ons 05:00] --> WP[WordPress-artiklar]
    CO --> AAG
```

- `content-gap-analyzer` (mån 05:30) → fyller `content_opportunities`.
- `auto-article-generator` (ons 05:00) → genererar artiklar.
- Blueprint borde vara navet som kopplar gap-analys → artiklar, men dess output försvinner pga saknad tabell.

## Åtgärdslista (separat pass)
1. Skapa `content_blueprints`-tabellen ELLER skriv blueprint som kanban-jobb.
2. Ersätt Trello-kort med kanban.
3. Verifiera kedjan gap-analyzer → blueprint → auto-article-generator faktiskt hänger ihop.
