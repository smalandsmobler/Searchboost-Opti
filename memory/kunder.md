# Kunder — Content-rotation

> Uppdateras varje körning av content-fabriken.
> Senast uppdaterad: 2026-06-05

## Regressionscheck — 2026-06-08 (söndag)

**Status: Blockerad — 18:e körningen i rad (5 veckor utan rankingdata)**

| Kund | GSC-status | Check-status | Orsak |
|------|-----------|-------------|-------|
| searchboost | ✅ Konfigurerad | ❌ Blockerad | EC2 TLS + Supermetrics ej auth |
| mobelrondellen | ✅ Konfigurerad | ❌ Blockerad | EC2 TLS + Supermetrics ej auth |
| smalandskontorsmobler | ✅ Konfigurerad | ❌ Blockerad | EC2 TLS + Supermetrics ej auth |
| ilmonte | Ej ägare | ⚪ N/A | SA ej tillagd i GSC |
| jelmtech | Ej kopplad | ⚪ N/A | Ingen GSC-åtkomst |
| tobler | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| traficator | Ej konfigurerad | ⚪ N/A | Ingen GSC-åtkomst |
| humanpower | Ej aktiv | ⚪ N/A | Ej onboardad |
| nordicsnusonline | Ej aktiv | ⚪ N/A | Ej onboardad |

**Keywords upp/ner:** ❌ Ej tillgänglig — blockerare kvarstår
_Bekräftade blockerare 2026-06-08: EC2→TLS-fel (Envoy HTTPS-uppgradering), perispa_* ej tillgängliga, gcloud saknas, AWS CLI saknas, GOOGLE_APPLICATION_CREDENTIALS_JSON ej satt_

**⚠️ ESKALERING — LÖSNING KRÄVS OMEDELBART (3 alternativ, snabbast först):**

**Alternativ A — BigQuery-credentials i Claude Code Settings (5 min):**
Gå till Claude Code Settings → Environment Variables, lägg till:
```
GOOGLE_APPLICATION_CREDENTIALS_JSON=<service account JSON från SSM /seo-mcp/bigquery/credentials>
```
→ Nästa regressionscheck kan direkt fråga BigQuery utan EC2.

**Alternativ B — EC2 Let's Encrypt-cert (10 min):**
SSH in via Instance Connect → `sudo certbot --nginx -d searchboost.se`
→ EC2 API nåbar från remote environment.

**Alternativ C — Kör regression-check manuellt på EC2 (2 min):**
SSH in → `node /home/ubuntu/Searchboost-Opti/scripts/regression-check.js`

---

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
| searchboost     | E-E-A-T: Så bygger du trovärdighet som litet företag (⚠ ej deployad) | 2026-06-05 | Kör scripts/publish-searchboost-eeat.js från EC2 |
| tobler          | Skyddsräcke på byggställning (⚠ ej deployad)   | 2026-06-03 | Kör scripts/publish-tobler-skyddsracke.js från EC2 |
| mobelrondellen  | Utemöbler 2026 — guide till hållbara val (⚠ ej deployad) | 2026-05-29 | Kör scripts/publish-mobelrondellen-utemobler-2026.js från EC2 |
| ilmonte         | Scenpodium för utomhusevenemang — checklista inför sommaren 2026 (⚠ ej deployad) | 2026-06-12 | Kör scripts/publish-ilmonte-utomhusevenemang.js från EC2 |
| jelmtech        | POM/acetal formsprutning (⚠ ej deployad) | 2026-06-08 | Kör scripts/publish-jelmtech-pom-acetal.js från EC2 |
| traficator      | (okänt — REST 500)                    | —          | — |
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

## Content-fabrik körning 2026-06-12

- **Kund**: ilmonte (äldst med aktiva WP-creds sedan 2026-05-27, 16 dagar)
- **Artikel**: "Scenpodium för utomhusevenemang — komplett checklista inför sommaren 2026"
- **Fokuskeyword**: scenpodium utomhus
- **Fil**: content-pages/ilmonte-scenpodium-utomhusevenemang-checklista.html
- **Script**: scripts/publish-ilmonte-utomhusevenemang.js
- **Ordantal**: 875 ord, ÅÄÖ ok (234 tecken), 3 interna länkar, FAQ-sektion (3 frågor)
- **Struktur**: 5 H2:or + FAQ H2, lead-paragraf 46 ord, ol-lista med säkerhetsregler, ul-checklistor
- **Status**: Skriven — väntar på deploy från EC2
- **Timing**: Midsommar 2026-06-20 — 8 dagar bort, maximal säsongsrelevans
- **OBS**: perispa_* MCP-verktyg ej tillgängliga — använder WP REST API via Node-script

## Content-fabrik körning 2026-06-08

- **Kund**: jelmtech (äldst med aktiva WP-creds sedan 2026-05-15, 24 dagar)
- **Artikel**: "POM/acetal formsprutning — komplett guide till polyoximetyl​en"
- **Fokuskeyword**: POM formsprutning
- **Fil**: content-pages/jelmtech-pom-acetal-formsprutning.html
- **Script**: scripts/publish-jelmtech-pom-acetal.js
- **Ordantal**: ~1 050 ord, ÅÄÖ ok (506 tecken), 3 interna länkar, FAQ-schema (3 frågor)
- **Struktur**: 6 H2:or + FAQ H2, lead-paragraf ~55 ord, 2 tabeller, jämförelsetabell POM/PA/PP
- **Status**: Skriven — väntar på deploy från EC2
- **OBS**: perispa_* MCP-verktyg ej tillgängliga — använder WP REST API via Node-script

## Content-fabrik körning 2026-06-05

- **Kund**: searchboost (äldst i rotationen sedan 2026-05-13, 23 dagar)
- **Artikel**: "E-E-A-T: Så bygger du trovärdighet som litet företag i Googles ögon"
- **Fokuskeyword**: e-e-a-t
- **Fil**: content-pages/seo-skola/eeat-trovardighet-smaforetag.html
- **Script**: scripts/publish-searchboost-eeat.js
- **Ordantal**: ~960 ord, ÅÄÖ ok (71 tecken), 3 interna länkar, FAQ-schema
- **Struktur**: 5 H2:or + FAQ (3 frågor), lead-paragraf 57 ord, eeat-grid, 3 action-cards
- **Status**: Skriven — väntar på deploy från EC2
- **OBS**: perispa_* MCP-verktyg ej tillgängliga — använder WP REST API via Node-script

## Content-fabrik körning 2026-06-03

- **Kund**: tobler (äldst med WP-creds OK sedan 2026-05-11)
- **Artikel**: "Skyddsräcke på byggställning — regler, typer och rätt montering"
- **Fokuskeyword**: skyddsräcke byggställning
- **Fil**: content-pages/tobler-skyddsracke-byggstallning.html
- **Script**: scripts/publish-tobler-skyddsracke.js
- **Ordantal**: 943 ord, ÅÄÖ ok (320 tecken), 3 interna länkar
- **Status**: Skriven — väntar på deploy från EC2
- **OBS**: perispa_* MCP-verktyg ej tillgängliga i denna session — använder WP REST API via Node-script istället

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
