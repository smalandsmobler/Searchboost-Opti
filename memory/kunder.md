# Kunder — Content-rotation

> Uppdateras varje körning av content-fabriken.
> Senast uppdaterad: 2026-05-06

## Senaste artikel per kund

| Kund            | Senaste artikel                        | Datum      | URL |
|-----------------|---------------------------------------|------------|-----|
| jelmtech        | ABS-plast guide                       | 2026-05-04 | Publiceras — kör scripts/publish-jelmtech-abs-artikel.js |
| ilmonte         | Hyra eller köpa scenpodium? (⚠ ej deployad) | 2026-05-06 | Kör scripts/publish-ilmonte-hyra-kopa-scenpodium.js från EC2 |
| mobelrondellen  | Fåtölj 2026                           | 2026-04-29 | https://mobelrondellen.se/blog/fatolj-guide-2026/ |
| tobler          | Modulställning                        | 2026-05-03 | https://tobler.se/produktutveckling/kopa-modulstallning-vad-du-behover-veta-om-system-pris-och-leverantorer/ |
| traficator      | (okänt — REST 500)                    | —          | — |
| searchboost     | SEO-skola artiklar                    | —          | https://searchboost.se/seo-skola/ |
| smalandskontorsmobler | Ergonomi-tips                   | 2026-02-11 | (lokal fil) |
| humanpower      | (ej registrerad)                      | —          | — |
| nordicsnusonline| (prospect, ej aktiv)                  | —          | — |

## Regressionscheck — Veckosammanfattning 2026-05-06

**Status: Blockerad — data ej tillgänglig**

| Kund | GSC-status | Check-status | Orsak |
|------|-----------|-------------|-------|
| searchboost | OK | ❌ Blockerad | EC2 ej nåbar + Supermetrics ej auth |
| mobelrondellen | OK | ❌ Blockerad | EC2 ej nåbar + Supermetrics ej auth |
| smalandskontorsmobler | OK | ❌ Blockerad | EC2 ej nåbar + Supermetrics ej auth |
| jelmtech | Ej kopplad | ⚪ N/A | Ingen GSC-åtkomst |
| ilmonte | Ej ägare | ⚪ N/A | SA ej tillagd i GSC |
| tobler | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| traficator | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| humanpower | Ej aktiv | ⚪ N/A | Ej onboardad |
| nordicsnusonline | Ej aktiv | ⚪ N/A | Ej onboardad |

**Keywords upp/ner:** Ej tillgänglig (ingen dataåtkomst)

**Åtgärd krävs:** Autentisera Supermetrics GSC via länken i `kund_searchboost_tasks.md` för att möjliggöra regressionscheck utan EC2-åtkomst.

---

## Nästa kund att prioritera
1. **ilmonte** — artikel skriven 2026-05-06, väntar på deploy (kör publish-script från EC2)
2. **traficator** — WP REST ger 500, undersök manuellt
3. **jelmtech** — ABS-artikel skriven men ej deployad (kör publish-script från EC2)
4. **smalandskontorsmobler** — WP-creds saknas, men ny WooCommerce-sajt byggs
