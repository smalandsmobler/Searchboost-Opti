# Kunder — Content-rotation

> Uppdateras varje körning av content-fabriken.
> Senast uppdaterad: 2026-05-13

## Senaste artikel per kund

| Kund            | Senaste artikel                        | Datum      | URL |
|-----------------|---------------------------------------|------------|-----|
| jelmtech        | ABS-plast guide                       | 2026-05-04 | Publiceras — kör scripts/publish-jelmtech-abs-artikel.js |
| ilmonte         | Hyra eller köpa scenpodium? (⚠ ej deployad) | 2026-05-06 | Kör scripts/publish-ilmonte-hyra-kopa-scenpodium.js från EC2 |
| mobelrondellen  | Bästa soffan 2026 (⚠ ej deployad)    | 2026-05-08 | Kör scripts/publish-mobelrondellen-soffa-2026.js från EC2 |
| tobler          | Ställningsnät — krav och typer (⚠ ej deployad) | 2026-05-11 | Kör scripts/publish-tobler-stallningsnät.js från EC2 |
| traficator      | (okänt — REST 500)                    | —          | — |
| searchboost     | AI Overviews och GEO 2026 (⚠ ej deployad) | 2026-05-13 | Kör scripts/publish-searchboost-ai-overviews.js från EC2 |
| smalandskontorsmobler | Ergonomi-tips                   | 2026-02-11 | (lokal fil) |
| humanpower      | (ej registrerad)                      | —          | — |
| nordicsnusonline| (prospect, ej aktiv)                  | —          | — |

## Regressionscheck — 2026-05-09

**Status: Blockerad — Supermetrics GSC ej autentiserad**

| Kund | GSC-status | Check-status | Orsak |
|------|-----------|-------------|---------|
| searchboost | OK | ❌ Blockerad | Supermetrics ej auth (ny länk i kund_searchboost_tasks.md) |
| mobelrondellen | OK | ❌ Blockerad | Supermetrics ej auth |
| smalandskontorsmobler | OK | ❌ Blockerad | Supermetrics ej auth |
| kompetensutveckla | OK | ❌ Blockerad | Supermetrics ej auth |
| phvast | OK | ❌ Blockerad | Supermetrics ej auth |
| ilmonte | Ej ägare | ⚪ N/A | SA ej tillagd i GSC |
| jelmtech | Ej kopplad | ⚪ N/A | Ingen GSC-åtkomst |
| tobler | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| traficator | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| humanpower | Ej aktiv | ⚪ N/A | Ej onboardad |
| nordicsnusonline | Ej aktiv | ⚪ N/A | Ej onboardad |

**Keywords upp/ner:** Ej tillgänglig (ingen dataåtkomst)

**Åtgärd krävs — EN åtgärd låser upp 5 kunder:**
Mikael loggar in Supermetrics GSC med denna länk (giltig tills den används):
`https://gcp1-api-default.supermetrics.com/v2/datasource/login/renew/Hdk28CzTe_WGjmliA0VwuhBs_lFjHg9rzqIgsD2_yZdSvwyPLc`

**Alternativ:** Kör `node scripts/regression-check.js` direkt på EC2 (SSH-session, IAM-roll → SSM → BigQuery).

---

## Nästa kund att prioritera
1. **mobelrondellen** — "Bästa soffan 2026" skriven 2026-05-08, väntar på deploy (kör publish-script från EC2)
2. **ilmonte** — artikel skriven 2026-05-06, väntar på deploy (kör publish-script från EC2)
3. **traficator** — WP REST ger 500, undersök manuellt
4. **jelmtech** — ABS-artikel skriven men ej deployad (kör publish-script från EC2)
5. **tobler** — "Ställningsnät"-artikel skriven 2026-05-11, väntar på deploy (kör scripts/publish-tobler-stallningsnät.js från EC2)
6. **searchboost** — AI Overviews-artikel skriven 2026-05-13, väntar på deploy
7. **smalandskontorsmobler** — WP-creds saknas, men ny WooCommerce-sajt byggs
