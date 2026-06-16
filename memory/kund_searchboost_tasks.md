# searchboost — Tasks & Status

> Kund: searchboost.se | GSC: OK | WP-creds: OK
> Senast uppdaterad: 2026-06-09

## Prospektlista (Prospekt-scanner)
- 2026-06-16: [Bygg / Linköping — Tillägg v25](../content-pages/prospects/2026-06-16-bygg-linkoping-tillagg.md) — Top 3: BC Bygg (1977, inget title/schema/email 🚨), Stångebro Bygg (H1 utan keywords, WordPress), Skruvfund (WIX-plattform = tekniskt hinder). Nästa: **hälsa + Västerås** (v26)
- 2026-06-09: [Bygg / Linköping](../content-pages/prospects/2026-06-09-bygg-linkoping.md) — Top 3: Svenska Bygge (title=bara företagsnamn, 5 sociala kanaler), ByggOm Linköping (B2B/kommersiell, ren H1), Irebro Byggservice (bred portfölj, WordPress, 3×H1)
- 2026-06-02: [Hotell / Uppsala](../content-pages/prospects/2026-06-02-hotell-uppsala.md) — Top 3: Grand Hotell Hörnan (title="Startsida"!), Villa Anna (premium, ingen lokal SEO), Akademihotellet (ny svitavdelning ej synlig)
- 2026-05-26: [Restaurang / Malmö](../content-pages/prospects/2026-05-26-restaurang-malmo.md) — Top 3: Grand Malmö, Ruths Malmö, Malmborgen AB (Gränden+Sankt Markus)
- 2026-05-19: [Tandläkare / Stockholm](../content-pages/prospects/2026-05-19-tandläkare-stockholm.md)
- 2026-05-12: [Fastighetsmäklare / Lund](../content-pages/prospects/2026-05-12-fastighetsmäklare-lund.md)
- 2026-05-05: [Redovisning / Jönköping](../content-pages/prospects/2026-05-05-redovisning-jonkoping.md)

## Vecko-briefing-länk
- 2026-06-15: [content-pages/weekly-briefing/2026-06-15.md](../content-pages/weekly-briefing/2026-06-15.md)
- 2026-06-08: [content-pages/weekly-briefing/2026-06-08.md](../content-pages/weekly-briefing/2026-06-08.md)
- 2026-05-25: [content-pages/weekly-briefing/2026-05-25.md](../content-pages/weekly-briefing/2026-05-25.md)
- 2026-05-18: [content-pages/weekly-briefing/2026-05-18.md](../content-pages/weekly-briefing/2026-05-18.md)
- 2026-05-11: [content-pages/weekly-briefing/2026-05-11.md](../content-pages/weekly-briefing/2026-05-11.md)
- 2026-05-04: [content-pages/weekly-briefing/2026-05-04.md](../content-pages/weekly-briefing/2026-05-04.md)

## Regressionsvarningar

### Veckosammanfattning 2026-05-26 (måndag v22) — arkiverad
> **0 av 3 GSC-kunder checkbara — blockerare kvarstår 11 körningar i rad**
_Arkiveras — se v23-sammanfattning nedan._

---

### Regressionscheck 2026-06-16 (tisdag) — LIVE
> **Körning #23 i rad — fortfarande blockerad**

_Ingen data — EC2 TLS/`perispa_*`/BigQuery-credentials fortfarande ej tillgängliga._

---

### Veckosammanfattning 2026-06-15 (måndag v25) — arkiverad
> **0 av 3 GSC-kunder checkbara — blockerare kvarstår nu 22 körningar i rad (senaste: 2026-06-15)**
> **ESKALERING NÖDVÄNDIG — 7 VECKOR UTAN RANKINGDATA**

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

_Ingen data — Blockerad (2026-06-15, **22 körningar i rad** — 14/16/18/19/20/21/22/23/26/27/28/30 maj + 2/3/5/6/7/8/9/10/13/15 jun):_
- _EC2-API: Ej nåbar (self-signed TLS, `-k` flag fungerar ej i Envoy-miljön — bekräftad 2026-06-10, Node.js `rejectUnauthorized:false` ger HTTP 503)_
- _`perispa_switch_site` / `perispa_gsc_top_queries`: Finns inte i sessions-verktygsuppsättningen_
- _AWS CLI saknas → kan ej hämta SSM-credentials → kan ej nå BigQuery direkt_
- _Supermetrics GSC (ds\_id: GW): NOT\_AUTHENTICATED — kräver engångsinloggning_
- _GOOGLE\_APPLICATION\_CREDENTIALS\_JSON: Ej satt i environment_

**⚠️ KRITISK BLOCKERARE — 22 MISSADE CHECKS (7 VECKOR UTAN RANKINGDATA)**

_Arkiveras — se check 2026-06-16 ovan._

**🔓 LÖSNING 1 — BigQuery direkt (rekommenderas, 5 min):**
Lägg service account JSON i Claude Code Settings → Environment Variables:
```
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"searchboost-485810",...}
```
→ Claude kan då direkt fråga `gsc_daily_metrics`-tabellen i BigQuery utan EC2.

**🔓 LÖSNING 2 — EC2 SSL (löser allt, 10 min):**
SSH till EC2, kör: `sudo certbot --nginx -d din-domän.se`
→ Let's Encrypt-cert → EC2-API nåbar från remote environment.

**🔓 LÖSNING 3 — Supermetrics GSC (2 min, osäker):**
Autentisera Supermetrics mot GSC via länk i föregående sessions-log.

_Senaste check: 2026-06-15 — 0 kunder checkbara (**22 körningar i rad**)_

---

### Veckosammanfattning 2026-06-09 (måndag v24) — arkiverad
> **0 av 3 GSC-kunder checkbara — blockerare kvarstår 21 körningar i rad**
_Arkiveras — se v25-sammanfattning ovan._

---

### Veckosammanfattning 2026-06-02 (måndag v23) — arkiverad
> **0 av 3 GSC-kunder checkbara — blockerare kvarstår 19 körningar i rad**
_Arkiveras — se v24-sammanfattning ovan._

### Veckosammanfattning 2026-05-18 (måndag v20) — arkiverad
> **0 av 3 GSC-kunder checkbara — blockerare kvarstår 3 körningar i rad**
_Arkiverad: se v22-sammanfattning ovan._

## Publicerade artiklar

- SEO-skola (https://searchboost.se/seo-skola/)
- AI Overviews och GEO — hur det påverkar din SEO 2026 (⚠ ej deployad) — 2026-05-13 | Kör scripts/publish-searchboost-ai-overviews.js från EC2
- E-E-A-T: Så bygger du trovärdighet som litet företag (⚠ ej deployad) — 2026-06-05 | Kör scripts/publish-searchboost-eeat.js från EC2

## LinkedIn-inlägg

| Datum | Ämne | Post-ID | URL |
|-------|------|---------|-----|
| 2026-05-05 (tisdag) | SEO-automation resultat — 7 kunder, AI-optimering var 6:e timme | urn:li:share:7457354911865831424 | https://www.linkedin.com/feed/update/urn:li:share:7457354911865831424/ |
| 2026-05-07 (torsdag) | Parallell content-publicering — 7 kunder samma vecka, SEO-content factory | urn:li:share:7458079749756702720 | https://www.linkedin.com/feed/update/urn:li:share:7458079749756702720/ |
| 2026-05-10 (söndag) | Rankingpositioner är inte ett mål — datadrivet SEO, egen datapipeline vs Supermetrics | urn:li:share:7459167542821965824 | https://www.linkedin.com/feed/update/urn:li:share:7459167542821965824/ |
| 2026-05-14 (onsdag) | E-E-A-T för småföretag — tre konkreta åtgärder för att bygga trovärdighet i Googles ögon | urn:li:share:7460616309081534464 | https://www.linkedin.com/feed/update/urn:li:share:7460616309081534464/ |
| 2026-05-19 (tisdag) | Lokalt SEO — tre branscher, tre städer, ett mönster: vad som saknas på svenska SME-sajter | urn:li:share:7462428838594166784 | https://www.linkedin.com/feed/update/urn:li:share:7462428838594166784/ |
| 2026-05-26 (måndag) | Schema markup — strukturerad data, rich results, +20-30% CTR, tre minimum-insatser per kund | urn:li:share:7464964904886751233 | https://www.linkedin.com/feed/update/urn:li:share:7464964904886751233/ |
| 2026-06-16 (måndag) ⏳ | AI Overviews förändrar spelreglerna — GEO-anpassning, FAQ-schema, E-E-A-T-signaler | ⛔ EJ POSTAD — Zapier OAuth krävs | `content-pages/searchboost/linkedin/2026-06-04-ai-overviews-geo-seo.md` |

### ⛔ BLOCKERARE LinkedIn-agent 2026-06-16
Zapier MCP kräver OAuth-autentisering. Artikel redo men kan ej postas autonomt.
**Åtgärd**: Mikael öppnar autentiserings-URL i webbläsaren och klistrar in callback-URL i chatten.
Auth-URL: `https://api.anthropic.com/authorize?response_type=code&client_id=f45cf20a-aa23-4f9e-8b1e-7553508184a2&code_challenge=qJkrJrU82OSOxGcZmlZyP9GOC00tUT2P-fWWjINvZXA&code_challenge_method=S256&redirect_uri=http%3A%2F%2Flocalhost%3A3118%2Fcallback&state=f5WqxrjJ4OvEamkBCxVrKF6JD20HWfnf66Ba9-AH2bU`

## Status
- WP-creds: OK
- GSC: OK (https://searchboost.se/)
- Rank Math: OK

## Prioriterade uppgifter — Konkurrentbevakning 2026-06-10

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| **DEPLOY**: "AI Overviews och GEO" (klar sedan 13/05 — **28 dagar!**): `node scripts/publish-searchboost-ai-overviews.js` från EC2 | **BRÅDSKANDE** | Bonzer "Google AI Mode i Sverige" + Jajja "7 månader med AI-mode" täcker ämnet aktivt — vi är 4 veckor försenade |
| **DEPLOY**: "E-E-A-T trovärdighet" (skriven 2026-06-05 — **5 dagar**): `node scripts/publish-searchboost-eeat.js` från EC2 | **BRÅDSKANDE** | Bonzer har "E-E-A-T: Det viktigaste begreppet inom SEO" — vi kan fortfarande vinna med SME-vinkel |
| LinkedIn-inlägg: "Varför Google AI Mode ändrar allt för svenska småföretag" | **HÖG** | Bonzer + Jajja signalerar till samma publik — vi behöver LinkedIn-närvaro nu |
| FAQ-schema på de 3 mest besökta SEO-skola-artiklarna | **HÖG** | Bonzer/Jajja saknar FAQ-schema på guider — direkt CTR-win |
| Skriv: "Lokal SEO 2026 — komplett guide för svenska orter" | Medel | Bonzer = enterprise-fokus, Jajja = Google Ads, ingen äger lokal SME-guide |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-27 (arkiverade)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| ~~DEPLOY "AI Overviews och GEO"~~ | ~~BRÅDSKANDE~~ | Kvar — EC2-blockerare |
| ~~DEPLOY "E-E-A-T trovärdighet"~~ | ~~BRÅDSKANDE~~ | Kvar — EC2-blockerare |
| FAQ-schema på SEO-skola-artiklarna | **HÖG** | Kvar — uppgraderad till 3 artiklar |
| Lokal SEO-guide | Medel | Kvar |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-13 (arkiverade)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| ~~Skriv: "AI Overviews och GEO — hur påverkar det din SEO 2026?" → lägg i SEO-skolan under ny kategori "AI & Sökning"~~ | ✅ KLAR 2026-05-13 | content-pages/seo-skola/ai-overviews-geo-seo-2026.html — kör publish-script från EC2 |
| Skriv: "E-E-A-T: Så bygger du trovärdighet som litet företag" → SEO-skolan | **HÖG** | Kvar — bekräftad 27/05 |
| Lägg till FAQ-schema på de 6 mest besökta SEO-skola-artiklarna | Medel | Kvar — uppgraderad till HÖG 27/05 |

## Prospektering

| Datum | Bransch | Stad | Fil |
|-------|---------|------|-----|
| 2026-06-09 | Bygg | Linköping | [content-pages/prospects/2026-06-09-bygg-linkoping.md](../content-pages/prospects/2026-06-09-bygg-linkoping.md) |
| 2026-06-02 | Hotell | Uppsala | [content-pages/prospects/2026-06-02-hotell-uppsala.md](../content-pages/prospects/2026-06-02-hotell-uppsala.md) |
| 2026-05-26 | Restaurang | Malmö | [content-pages/prospects/2026-05-26-restaurang-malmo.md](../content-pages/prospects/2026-05-26-restaurang-malmo.md) |
| 2026-05-19 | Tandläkare | Stockholm | [content-pages/prospects/2026-05-19-tandläkare-stockholm.md](../content-pages/prospects/2026-05-19-tandläkare-stockholm.md) |
| 2026-05-12 | Fastighetsmäklare | Lund | [content-pages/prospects/2026-05-12-fastighetsmäklare-lund.md](../content-pages/prospects/2026-05-12-fastighetsmäklare-lund.md) |
| 2026-05-05 | Redovisning | Jönköping | [content-pages/prospects/2026-05-05-redovisning-jonkoping.md](../content-pages/prospects/2026-05-05-redovisning-jonkoping.md) |

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
