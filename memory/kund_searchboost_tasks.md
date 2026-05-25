# searchboost — Tasks & Status

> Kund: searchboost.se | GSC: OK | WP-creds: OK
> Senast uppdaterad: 2026-05-13

## Vecko-briefing-länk
- 2026-05-25: [content-pages/weekly-briefing/2026-05-25.md](../content-pages/weekly-briefing/2026-05-25.md)
- 2026-05-18: [content-pages/weekly-briefing/2026-05-18.md](../content-pages/weekly-briefing/2026-05-18.md)
- 2026-05-11: [content-pages/weekly-briefing/2026-05-11.md](../content-pages/weekly-briefing/2026-05-11.md)
- 2026-05-04: [content-pages/weekly-briefing/2026-05-04.md](../content-pages/weekly-briefing/2026-05-04.md)

## Regressionsvarningar

### Veckosammanfattning 2026-05-18 (måndag v20)
> **0 av 3 GSC-kunder checkbara — blockerare kvarstår 3 körningar i rad**

| Kund | GSC-status | Keywords topp 20 | Regressioner |
|------|-----------|-----------------|-------------|
| searchboost | ✅ Konfigurerad | Ej hämtbar (blockad) | Okänd |
| mobelrondellen | ✅ Konfigurerad | Ej hämtbar (blockad) | Okänd |
| smalandskontorsmobler | ✅ Konfigurerad | Ej hämtbar (blockad) | Okänd |
| jelmtech | ⛔ Ej kopplad | — | N/A |
| ilmonte | ⛔ Ej ägare | — | N/A |
| humanpower | ⛔ Ej aktiv | — | N/A |
| nordicsnusonline | ⛔ Ej aktiv | — | N/A |
| tobler | ⛔ Ej konfigurerad | — | N/A |
| traficator | ⛔ Ej konfigurerad | — | N/A |

_Ingen data — Blockerad (2026-05-23, **8 körningar i rad** — 14/16/18/19/20/21/22/23 maj):_
- _EC2-API: Ej nåbar från remote environment (self-signed TLS / Envoy-proxy)_
- _Supermetrics MCP: Enbart ad-kampanjverktyg tillgängliga (AW/FA/TIK/LIA) — inget GSC-datahämtningsverktyg (ds\_id: GW) i detta MCP-scope_
- _`perispa_switch_site` / `perispa_gsc_top_queries`: Finns inte i sessions-verktygsuppsättningen_
- _AWS CLI saknas → kan ej hämta SSM-credentials → kan ej nå BigQuery direkt_

**⚠️ KRITISK BLOCKERARE — ESKALERING KRÄVS (8 missade checks i rad):**
1. **Permanent fix EC2 SSL** (prioritet 1): `sudo certbot --nginx` på EC2 → Let's Encrypt-cert → löser nåbarheten från remote environment.
2. **Snabbaste fix — BigQuery env-var**: Lägg BigQuery service account JSON som `GOOGLE_APPLICATION_CREDENTIALS` env-variabel i Claude Code remote environment (Settings → Environment Variables) → ingen EC2-beroende, direkt BigQuery-åtkomst.
3. **Supermetrics GSC**: Kräver ds\_id GW + autentisering → ej konfigurerat i nuvarande MCP-scope.

_Senaste check: 2026-05-23 — 0 kunder checkbara (8 körningar i rad, åtgärd AKUT)_

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
| 2026-05-19 (tisdag) | Lokalt SEO — tre branscher, tre städer, ett mönster: vad som saknas på svenska SME-sajter | urn:li:share:7462428838594166784 | https://www.linkedin.com/feed/update/urn:li:share:7462428838594166784/ |

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
| 2026-05-19 | Tandläkare | Stockholm | [content-pages/prospects/2026-05-19-tandläkare-stockholm.md](../content-pages/prospects/2026-05-19-tandläkare-stockholm.md) |

**Top 3 att kontakta (vecka 21 — tandläkare Stockholm):**
1. jtingstam.se — 08-660 22 23 / info@jtingstam.se — Jenny Tingstam (solopraktiker, ej mobilanpassad, score 2/10)
2. gabriellastandvard.se — 08-660 51 56 / info@gabriellastandvard.se — Gabriella Engberg (ägare namngiven, saknar H1, score 2/10)
3. ostermalmtandvard.com — 08-414 001 09 / infotanden@gmail.com — Bryar (Gmail-adress = DIY-operatör, score 3/10)

**Top 3 att kontakta (vecka 19):**
1. redorev.se — kontaktformulär (score 2/10, allra sämst SEO)
2. jrb.nu — 073-501 50 50 / info@jrb.nu (score 3/10)
3. braherevision.se — 036-16 93 30 (score 3/10)

**Top 3 att kontakta (vecka 20 — fastighetsmäklare Lund):**
1. magdeburg.se — verifiera kontaktinfo manuellt (score 3/10, 503-fel = akut tekniskt problem)
2. fernlundmaklare.se — 046-12 48 40 / ragnhild@fernlundmaklare.se (score 4/10)
3. bulowlind.se — 046-39 60 60 / info@bulowlind.se (score 4/10)
