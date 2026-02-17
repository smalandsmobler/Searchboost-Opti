# Nattrapport 2026-02-17

## Utfört inatt

### 1. Pipeline-migrering (KLART)
Tre kunder saknades helt i pipeline-tabellen:
- **ferox** — migrerad till stage "aktiv"
- **ilmonte** — migrerad till stage "aktiv"
- **kompetensutveckla** — migrerad till stage "aktiv"

Nu finns alla 10 kunder i BigQuery customer_pipeline med contract_status="active".

### 2. AI-genererade atgardsplaner (5/9 klara)
Genererade 3-manaders atgardsplaner via POST /api/customers/:id/action-plan:

| Kund | Status | Uppgifter |
|------|--------|-----------|
| mobelrondellen | KLAR | 35 uppgifter |
| phvast | KLAR | 37 uppgifter |
| searchboost | KLAR | 30 uppgifter |
| smalandskontorsmobler | KLAR | 22 uppgifter |
| tobler | KLAR | 37 uppgifter |
| ilmonte | TIMEOUT | API-anropet tar for lang tid |
| kompetensutveckla | TIMEOUT | API-anropet tar for lang tid |
| traficator | TIMEOUT | API-anropet tar for lang tid |
| wedosigns | TIMEOUT | API-anropet tar for lang tid |
| ferox | HOPPAT | Ingen sajt (feroxkonsult.se nere) |

**Fix for timeout:** Oka timeout i API:t eller kor dem manuellt via dashboarden.

### 3. kundzon.searchboost.nu (KLART)
Komplett DNS + SSL-setup:
- Loopia: A-record kundzon.searchboost.nu -> 51.21.116.7
- Nginx: HTTPS server block med Let's Encrypt
- SSL-cert giltig till 2026-05-18 (auto-renewal via certbot)
- Root / redirectar till /portal.html
- **Live:** https://kundzon.searchboost.nu

### 4. Anthropic credits (KLART)
- **Saldo:** $43,73 USD
- **Februari-anvandning:** 34 423 tokens in, 77 023 tokens ut
- **Automatisk omladdning:** Inaktiverad
- **Racker till:** ~14 000 SEO-optimeringar (a ~$0.003)
- **Betalning:** Mastercard *5648

### 5. Keyword-status (alla har keywords utom ferox)

| Kund | Keywords | Atgardsplan |
|------|----------|-------------|
| searchboost | 13 | JA |
| mobelrondellen | 18 | JA |
| phvast | 20 | JA |
| smalandskontorsmobler | 20 | JA |
| kompetensutveckla | 40 | TIMEOUT |
| ilmonte | 60 | TIMEOUT |
| tobler | 20 | JA |
| traficator | 54 | TIMEOUT |
| wedosigns | 30 | TIMEOUT |
| ferox | 0 | HOPPAT |

---

## Research-rapporter (bakgrundsuppgifter)

### Google Ads — Komplett rapport
**Sammanfattning:** Systemet ar KOMPLETT och redo att anvandas. Det enda som saknas:
1. **OAuth2-credentials** (gors EN GANG): Skapa Client ID + Secret i Google Cloud Console, generera Refresh Token
2. **Developer Token:** Ansok i Google Ads Manager Account (1-2 dagars godkannande)
3. **Per kund:** Kundens Customer ID (10 siffror) — be dem skicka via mail

**SSM-parametrar som behover sattas:**
```
/seo-mcp/google-ads/client-id          (EN GANG)
/seo-mcp/google-ads/client-secret      (EN GANG)
/seo-mcp/google-ads/oauth-token        (EN GANG)
/seo-mcp/integrations/{id}/google-ads-customer-id  (PER KUND)
```

**Befintlig kod:** 391 rader i google-ads.js, 218 rader i integrations/index.js, 3 API-endpoints live.

### Prospektering — Rapport
**Sammanfattning:** prospect-analyzer.js redan byggd (764 rader, Lambda), EJ deployad.
- SE Ranking backlinks API fungerar (441k credits kvar, expiry 2026-02-20!)
- PageSpeed Insights API gratis och obegransat
- WordPress REST API kan crawla WP-sajter utan credentials
- **Scoring-formula:** (Antal sidor x 0.3) + (Saknad metadata % x 0.3) + ((100 - PageSpeed) x 0.2) + (Backlinks/10 x 0.2)
- Hog score = stor sajt + dalig SEO = idealisk prospect

**OBS:** SE Ranking credits gar ut 2026-02-20! Anvand dem nu eller forlora dem.

### Produktfeed — Komplett plan
**For SMK (Smalands Kontorsmobler):**
1. Installera CTX Feed Pro ($119/ar) pa ny.smalandskontorsmobler.se
2. Skapa Google Merchant Center-konto
3. Verifiera doman
4. AI-titeloptimering via Claude (~$2.70 for alla 896 produkter)
5. Google Product Category-mappning
6. Custom labels for PMax-segmentering

**For Mobelrondellen:** Product Feed PRO (gratis) racker.

**Estimerad ROI for SMK:** 10 000 kr/man budget -> 40-80k intakt/man (ROAS 4-8x)

---

## Onboarding-mail (klar att anvanda)

### Version 1 — Bade WordPress + GSC

**Amne:** Aktivera din SEO-optimering — 2 enkla steg

Hej [Fornamn],

Valkomna som kund hos Searchboost! Vi ar redo att satta igang med den automatiska SEO-optimeringen som ingar i din plan.

For att vi ska kunna borja behover vi tillgang till tva saker: din WordPress-sajt och Google Search Console. Det tar totalt 5-10 minuter och nar det ar klart skoter systemet optimeringen automatiskt.

Du far dessutom tillgang till var kundportal pa kundzon.searchboost.nu dar du kan folja dina sokord, optimeringsloggen och trafik i realtid.

---

**STEG 1 — WordPress: Skapa Application Password**

1. Logga in pa din WordPress-admin (dindomann.se/wp-admin)
2. Klicka pa ditt namn uppe till hoger -> "Profil"
3. Scrolla langst ner till "Application Passwords"
4. Skriv "Searchboost SEO" som namn
5. Klicka "Lagg till nytt programlosenord"
6. Kopiera losenordet (format: XXXX XXXX XXXX XXXX) — visas bara en gang
7. Skicka det till mig via svar pa detta mail

**STEG 2 — Google Search Console: Lagg till anvandare**

1. Ga till search.google.com/search-console
2. Valj din sajt i listan
3. Klicka "Installningar" -> "Anvandare och behorigheter"
4. Klicka "Lagg till anvandare"
5. Ange: seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com
6. Behorighet: "Fullstandig"
7. Klicka "Lagg till"

---

Nar bada stegen ar klara aktiverar vi din kund inom 48 timmar.

Hors av dig om du stuter pa nagot!

Med vanliga halsningar,
Mikael Larsson
Searchboost.se
mikael@searchboost.se

---

### Version 2 — Bara WordPress (GSC redan konfigurerat)

**Amne:** Aktivera din SEO-optimering — 1 snabbt steg

Hej [Fornamn],

Vi ar nastan redo att kora igang med den automatiska SEO-optimeringen. Det enda som fattas ar ett WordPress Application Password — tar ungefar 2 minuter.

1. Logga in pa din WordPress-admin (dindomann.se/wp-admin)
2. Ga till din Profil (klicka ditt namn uppe till hoger)
3. Scrolla ner till "Application Passwords"
4. Skriv "Searchboost SEO" som namn -> klicka "Lagg till"
5. Kopiera losenordet (XXXX XXXX XXXX XXXX) och skicka det till mig

Nar jag har losenordet aktiverar vi allt inom 48 timmar.

Du far aven inloggning till kundzon.searchboost.nu dar du kan se dina sokord och optimeringsloggen i realtid.

Med vanliga halsningar,
Mikael Larsson
Searchboost.se
mikael@searchboost.se

---

## Blockerare

### Kompetensutveckla
- cPanel-login fungerar inte (losen: skitlosenord123& — nekades forra sessionen)
- Atgardsplan timeout (API)
- Behover: Korrekt cPanel-losen fran Hjaltebyran/agaren

### Ferox
- feroxkonsult.se ar nere — ingen sajt att optimera
- Saknar keywords, atgardsplan, WP-creds, GSC
- Behover: Kunden maste fixa sin sajt forst

### 4 kunder: Atgardsplan-timeout
- ilmonte, kompetensutveckla, traficator, wedosigns
- Fix: Kor manuellt via dashboarden (Kunddetalj -> Atgardsplan -> "Generera med AI")

### Alla kunder utom searchboost: WP app-password saknas
- Maste genereras av varje kund i sin WP-admin
- Skicka onboarding-mail (ovan) till alla 9 kunder

---

## Nastastegsplan (prioritetsordning)

### Imorgon (hog prio)
1. Skicka onboarding-mail till alla kunder
2. Kor atgardsplaner manuellt for de 4 som timeouta
3. SE Ranking: Kor backlink-monitor INNAN credits gar ut (2026-02-20!)

### Denna vecka
4. Google Ads: Skapa OAuth2-credentials + ansok Developer Token
5. SMK: Installera CTX Feed Pro + Google Merchant Center
6. Prospektering: Kor prospect-analyzer pa 20 Svenska sajter

### Nasta vecka
7. Aktivera automatisk optimering for alla kunder med WP-creds
8. Bygga feed-optimizer Lambda (AI-titeloptimering)
9. Looker Studio manadsrapport-design

---

## Saker Mikael noterade under natten
- "loggan ar sne pa SMK" — ny.smalandskontorsmobler.se logga behover fixas
- "borja forbereda for Google Ads" — research klar, OAuth2 setup nasta steg
- "optimera produktfeed" — research klar, CTX Feed Pro installation nasta steg
- "prospekter med lag organisk data vs sajtstorlek" — research klar, prospect-analyzer redo
- "kopplade pa massa verktyg" — inga nya MCP-connectors hittades i registret
