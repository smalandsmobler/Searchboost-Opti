# Veckosammanfattning — Regressionsbevakning v18 (2026-05-04)

> Kördes: 2026-05-04 (måndag)
> Kördes av: Claude Code (Regression-vakten)

## Resultat per kund

| Kund | GSC tillgänglig | Kontrollerad | Regressioner |
|------|----------------|-------------|-------------|
| searchboost | Ja (BigQuery) | NEJ — EC2 otillgänglig | Okänt |
| mobelrondellen | Ja (BigQuery) | NEJ — EC2 otillgänglig | Okänt |
| jelmtech | NEJ (ej ägare) | Ej möjlig | — |
| humanpower | Okänd (ej registrerad kund) | Ej möjlig | — |
| nordicsnusonline | NEJ (prospect) | Ej möjlig | — |
| ilmonte | NEJ (ej ägare i GSC) | Ej möjlig | — |
| tobler | NEJ (ej konfigurerad) | Ej möjlig | — |
| traficator | NEJ (ej konfigurerad) | Ej möjlig | — |
| smalandskontorsmobler | Ja (BigQuery) | NEJ — EC2 otillgänglig | Okänt |

## Hinder denna vecka

1. **EC2-servern otillgänglig (503)**: API på `51.21.116.7` svarade inte.
   - Kontrollera: `pm2 status seo-mcp` på EC2
   - Deploy-steg krävs (SSH → EC2 via Instance Connect)

2. **Verktyg saknas**: `perispa_switch_site` och `perispa_gsc_top_queries` finns inte
   i denna Claude Code-session. De verkar vara anpassade verktyg som behöver
   konfigureras separat.

3. **5 av 9 kunder saknar GSC-koppling**: jelmtech, humanpower*, nordicsnusonline*,
   tobler, traficator har ingen GSC-data att analysera.
   (*humanpower och nordicsnusonline är inte ens registrerade som aktiva kunder)

## Kunder med aktiva GSC + nåbara via API (när server är uppe)
- searchboost, mobelrondellen, phvast, kompetensutveckla, smalandskontorsmobler

## Åtgärder att ta innan nästa körning
- [ ] Kontrollera PM2 på EC2 (`pm2 status seo-mcp`, `pm2 logs seo-mcp --lines 50`)
- [ ] Verifiera att humanpower och nordicsnusonline ska vara med i reggressionslistan
- [ ] Koppla GSC för tobler och traficator
- [ ] Be ilmonte-ägaren lägga till service account i GSC

## Totalt keywords upp/ner denna vecka
**Ej mätbart** — data otillgänglig pga. ovan nämnda hinder.
