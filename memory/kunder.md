# Kunder — Content-rotation

> Uppdateras varje körning av content-fabriken.
> Senast uppdaterad: 2026-05-15

## Regressionscheck — 2026-05-14 (MÅNDAG — Veckosammanfattning)

**Status: Blockerad — EC2 503 + Supermetrics ej autentiserad.**

| Kund | GSC-status | Check-status | Orsak |
|------|-----------|-------------|-------|
| searchboost | OK | ❌ Blockerad | EC2 503 + Supermetrics ej auth |
| mobelrondellen | OK | ❌ Blockerad | EC2 503 + Supermetrics ej auth |
| smalandskontorsmobler | OK | ❌ Blockerad | EC2 503 + Supermetrics ej auth |
| kompetensutveckla | OK | ❌ Blockerad | EC2 503 + Supermetrics ej auth |
| phvast | OK | ❌ Blockerad | EC2 503 + Supermetrics ej auth |
| ilmonte | Ej ägare | ⚪ N/A | SA ej tillagd i GSC |
| jelmtech | Ej kopplad | ⚪ N/A | Ingen GSC-åtkomst |
| tobler | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| traficator | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| humanpower | Ej aktiv | ⚪ N/A | Ej onboardad |
| nordicsnusonline | Ej aktiv | ⚪ N/A | Ej onboardad |

**Keywords upp/ner:** ❌ Ej tillgänglig

### Blockerare — kräver manuell åtgärd av Mikael

**Blockerare 1 — EC2-server nere (HTTP 503):**
```bash
# SSH in via Instance Connect (se CLAUDE.md), sedan:
pm2 restart seo-mcp && pm2 status
# Löser även 6 väntande deploy-scripts (ilmonte, mobelrondellen, jelmtech, tobler, searchboost, traficator)
```

**Blockerare 2 — Supermetrics GSC ej autentiserad (giltig ~24h, ny 2026-05-14):**
```
https://gcp1-api-default.supermetrics.com/v2/datasource/login/renew/9rz1skKYA2wTReTbkw7Lskw9aJnb0KB38rd8c7McQFqTYWp0PK
```

---

## Senaste artikel per kund

| Kund            | Senaste artikel                        | Datum      | URL |
|-----------------|---------------------------------------|------------|-----|
| jelmtech        | PP-plast formsprutning (⚠ ej deployad) | 2026-05-15 | Kör scripts/publish-jelmtech-pp-plast.js från EC2 |
| ilmonte         | Köpa scenpodium 2026 — storlekar, material och priser (⚠ ej deployad) | 2026-05-27 | Kör scripts/publish-ilmonte-kopa-scenpodium-2026.js från EC2 |
| mobelrondellen  | Utemöbler 2026 — guide till hållbara val (⚠ ej deployad) | 2026-05-29 | Kör scripts/publish-mobelrondellen-utemobler-2026.js från EC2 |
| tobler          | Ställningsnät — krav och typer (⚠ ej deployad) | 2026-05-11 | Kör scripts/publish-tobler-stallningsnät.js från EC2 |
| traficator      | (okänt — REST 500)                    | —          | — |
| searchboost     | AI Overviews och GEO 2026 (⚠ ej deployad) | 2026-05-13 | Kör scripts/publish-searchboost-ai-overviews.js från EC2 |
| smalandskontorsmobler | Ergonomi-tips                   | 2026-02-11 | (lokal fil) |
| humanpower      | (ej registrerad)                      | —          | — |
| nordicsnusonline| (prospect, ej aktiv)                  | —          | — |

## Regressionscheck — 2026-05-13

**Status: Blockerad — Supermetrics GSC ej autentiserad (3:e gången i rad)**

| Kund | GSC-status | Check-status | Orsak |
|------|-----------|-------------|-------|
| searchboost | OK | ❌ Blockerad | Supermetrics ej auth — ny länk nedan |
| mobelrondellen | OK | ❌ Blockerad | Supermetrics ej auth — ny länk nedan |
| smalandskontorsmobler | OK | ❌ Blockerad | Supermetrics ej auth — ny länk nedan |
| kompetensutveckla | OK | ❌ Blockerad | Supermetrics ej auth — ny länk nedan |
| phvast | OK | ❌ Blockerad | Supermetrics ej auth — ny länk nedan |
| ilmonte | Ej ägare | ⚪ N/A | SA ej tillagd i GSC |
| jelmtech | Ej kopplad | ⚪ N/A | Ingen GSC-åtkomst |
| tobler | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| traficator | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| humanpower | Ej aktiv | ⚪ N/A | Ej onboardad |
| nordicsnusonline | Ej aktiv | ⚪ N/A | Ej onboardad |

**Keywords upp/ner:** Ej tillgänglig (ingen dataåtkomst)

**Åtgärd krävs — EN åtgärd låser upp 5 kunder:**
Mikael loggar in Supermetrics GSC med denna länk (ny, 2026-05-13):
`https://gcp1-api-default.supermetrics.com/v2/datasource/login/renew/SIk_o9BSrg7B0y36AgXNNSmfVHgwdFSuubbZ0sz9GFznFNStxF`

**Alternativ:** Kör `node scripts/regression-check.js` direkt på EC2 (SSH-session, IAM-roll → SSM → BigQuery).

---

## Nästa kund att prioritera
1. **mobelrondellen** — "Bästa soffan 2026" skriven 2026-05-08, väntar på deploy + ny artikel behövs
2. **ilmonte** — 2 artiklar väntar på deploy (kör publish-scripts från EC2)
3. **traficator** — WP REST ger 500, undersök manuellt
4. **jelmtech** — PP-plast ej deployad (kör publish-script från EC2)
5. **tobler** — "Ställningsnät"-artikel skriven 2026-05-11, väntar på deploy
6. **searchboost** — AI Overviews-artikel skriven 2026-05-13, väntar på deploy
7. **smalandskontorsmobler** — WP-creds saknas, men ny WooCommerce-sajt byggs

## Content-fabrik körning 2026-05-29

- **Kund**: mobelrondellen (äldst sedan 2026-05-08, 21 dagar)
- **Artikel**: "Utemöbler 2026 — guide till hållbara val för uteplats och altan"
- **Fokuskeyword**: utemöbler 2026
- **Fil**: content-pages/mobelrondellen-utemobler-2026.html
- **Script**: scripts/publish-mobelrondellen-utemobler-2026.js
- **Ordantal**: 876 ord, ÅÄÖ ok (42 rader), 3 interna länkar
- **Status**: Skriven — väntar på deploy från EC2
- **OBS**: perispa_* MCP-verktyg ej tillgängliga i denna session — använder WP REST API via Node-script istället

## Content-fabrik körning 2026-05-27

- **Kund**: ilmonte (äldst med WP-creds OK)
- **Artikel**: "Köpa scenpodium 2026 — komplett guide till storlekar, material och priser"
- **Fil**: content-pages/ilmonte-kopa-scenpodium-2026.html
- **Script**: scripts/publish-ilmonte-kopa-scenpodium-2026.js
- **Status**: Skriven (988 ord, ÅÄÖ ok) — väntar på deploy från EC2
- **OBS**: perispa_* MCP-verktyg ej tillgängliga i denna session — använder WP REST API via Node-script istället
