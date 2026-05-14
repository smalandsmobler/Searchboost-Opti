# searchboost — Tasks & Status

> Kund: searchboost.se | GSC: OK | WP-creds: OK
> Senast uppdaterad: 2026-05-13

## Vecko-briefing-länk
- 2026-05-11: [content-pages/weekly-briefing/2026-05-11.md](../content-pages/weekly-briefing/2026-05-11.md)
- 2026-05-04: [content-pages/weekly-briefing/2026-05-04.md](../content-pages/weekly-briefing/2026-05-04.md)

## Regressionsvarningar

_Ingen data — Blockerad (2026-05-14):_
- _EC2-API returnerar 503 (server nere — PM2-process troligen kraschat)_
- _Supermetrics GSC ej autentiserad_

**Åtgärd (välj ett):**
1. Mikael loggar in på Supermetrics GSC (NY länk 2026-05-14): `https://gcp1-api-default.supermetrics.com/v2/datasource/login/renew/9rz1skKYA2wTReTbkw7Lskw9aJnb0KB38rd8c7McQFqTYWp0PK`
2. SSH in och kör: `pm2 restart seo-mcp` på EC2 (löser även 6 väntande deploy-scripts).

Senaste check: 2026-05-14

## Publicerade artiklar

- SEO-skola (https://searchboost.se/seo-skola/)
- AI Overviews och GEO — hur det påverkar din SEO 2026 (⚠ ej deployad) — 2026-05-13 | Kör scripts/publish-searchboost-ai-overviews.js från EC2

## LinkedIn-inlägg

| Datum | Ämne | Post-ID | URL |
|-------|------|---------|-----|
| 2026-05-05 (tisdag) | SEO-automation resultat — 7 kunder, AI-optimering var 6:e timme | urn:li:share:7457354911865831424 | https://www.linkedin.com/feed/update/urn:li:share:7457354911865831424/ |
| 2026-05-07 (torsdag) | Parallell content-publicering — 7 kunder samma vecka, SEO-content factory | urn:li:share:7458079749756702720 | https://www.linkedin.com/feed/update/urn:li:share:7458079749756702720/ |
| 2026-05-10 (söndag) | Rankingpositioner är inte ett mål — datadrivet SEO, egen datapipeline vs Supermetrics | urn:li:share:7459167542821965824 | https://www.linkedin.com/feed/update/urn:li:share:7459167542821965824/ |
| 2026-05-14 (onsdag) | E-E-A-T för småföretag — tre konkreta åtgärder för att bygga trovärdighet i Googles ögon | urn:li:share:7460616309081534464 | https://www.linkedin.com/feed/update/urn:li:share:7460616309081534464/ |

## Status
- WP-creds: OK
- GSC: OK (https://searchboost.se/)
- Rank Math: OK

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-13

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| ~~Skriv: "AI Overviews och GEO — hur påverkar det din SEO 2026?" → lägg i SEO-skolan under ny kategori "AI & Sökning"~~ | ✅ KLAR 2026-05-13 | content-pages/seo-skola/ai-overviews-geo-seo-2026.html — kör publish-script från EC2 |
| Skriv: "E-E-A-T: Så bygger du trovärdighet som litet företag" → SEO-skolan | **HÖG** | Ingen konkurrent har E-E-A-T anpassat för SME/småföretag |
| Lägg till FAQ-schema på de 6 mest besökta SEO-skola-artiklarna | Medel | Snabb teknisk win, konkurrenter saknar detta |

## Prospektering

| Datum | Bransch | Stad | Fil |
|-------|---------|------|-----|
| 2026-05-05 | Redovisning | Jönköping | [content-pages/prospects/2026-05-05-redovisning-jonkoping.md](../content-pages/prospects/2026-05-05-redovisning-jonkoping.md) |
| 2026-05-12 | Fastighetsmäklare | Lund | [content-pages/prospects/2026-05-12-fastighetsmäklare-lund.md](../content-pages/prospects/2026-05-12-fastighetsmäklare-lund.md) |

**Top 3 att kontakta (vecka 19):**
1. redorev.se — kontaktformulär (score 2/10, allra sämst SEO)
2. jrb.nu — 073-501 50 50 / info@jrb.nu (score 3/10)
3. braherevision.se — 036-16 93 30 (score 3/10)

**Top 3 att kontakta (vecka 20 — fastighetsmäklare Lund):**
1. magdeburg.se — verifiera kontaktinfo manuellt (score 3/10, 503-fel = akut tekniskt problem)
2. fernlundmaklare.se — 046-12 48 40 / ragnhild@fernlundmaklare.se (score 4/10)
3. bulowlind.se — 046-39 60 60 / info@bulowlind.se (score 4/10)
