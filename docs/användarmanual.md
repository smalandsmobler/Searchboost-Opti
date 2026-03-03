# Användarmanual — Searchboost Opti

> Komplett guide till SEO-plattformen. Senast uppdaterad: 2026-02-08

---

## Innehåll

1. [Inloggning](#1-inloggning)
2. [Dashboard-översikt](#2-dashboard-översikt)
3. [Säljprocessen steg för steg](#3-säljprocessen-steg-för-steg)
4. [Manuell inmatning](#4-manuell-inmatning)
5. [Budget och paketnivåer](#5-budget-och-paketnivåer)
6. [Automatiskt arbete](#6-automatiskt-arbete)
7. [Onboarding av ny kund](#7-onboarding-av-ny-kund)
8. [API-referens (de viktigaste)](#8-api-referens)
9. [Felsökning](#9-felsökning)
10. [Deploy-guide](#10-deploy-guide)

---

## 1. Inloggning

**URL:** http://51.21.116.7 eller https://opti.searchboost.se

**Inloggningsuppgifter:**
- `mikael.searchboost@gmail.com` / Opti0195
- `web.searchboost@gmail.com` / Opti0195

Sessionen sparas i webbläsarens sessionStorage — du förblir inloggad tills du stänger fliken eller klickar "Logga ut".

---

## 2. Dashboard-översikt

### Vyer (flikar i toppmenyn)

| Vy | Visar |
|----|-------|
| **Dashboard** | Totalt antal kunder, optimeringar senaste 7d, uppgifter i kö, MRR. Kundlista med klickbara kort. |
| **Pipeline** | Kanban-board med kundlivscykelns stadier. Statistik: prospekt, aktiva avtal, MRR, totalt. |
| **Optimeringar** | Alla SEO-optimeringar (senaste 50). Typ, sida, tidpunkt, status. |
| **Kö** | Arbetsköns uppgifter: pending, in_progress, completed, failed. |
| **Rapporter** | Veckorapporter som skickats via e-post. |

### Kunddetalj (klicka på en kund)

Visar allt om en kund:
- **Kontraktsinfo** — Tjänst, belopp, period, dagar kvar
- **Budgetmätare** — Hur mycket av månadens auto-budget som förbrukats
- **Manuell inmatning** — 3 flikar: SEO-analys, Nyckelord, Åtgärdsplan
- **Sökordspositioner** — Tabell med GSC-data + ABC-klassificering
- **Åtgärdsplan** — 3-månaders plan med progress per månad
- **Optimeringar** — Senaste 30 dagarna
- **Arbetskö** — Pågående uppgifter

---

## 3. Säljprocessen steg för steg

### Steg 1: Identifiera prospekt
Identifiera kunder med fallande trafik (via SE Ranking eller egen analys).

### Steg 2: Lägg till prospekt i systemet
- Gå till **Pipeline** i dashboarden
- Kunden dyker automatiskt upp som "Prospekt" när den onboardas, ELLER
- Använd API:et: `POST /api/prospects` med företagsnamn, webbplats, kontaktinfo

### Steg 3: Genomför SEO-audit
1. Kör audit i SE Ranking (eller manuellt)
2. Öppna kunden i dashboarden → **Manuell inmatning** → **SEO-analys**
3. Klistra in analysen + lägg till sidspecifika problem
4. Klicka **Spara analys**
5. Flytta kunden till stadiet "Audit" i pipeline

### Steg 4: Skapa åtgärdsplan
1. I dashboarden → **Manuell inmatning** → **Åtgärdsplan**
2. Fyll i åtgärder per månad (1–3), ELLER
3. Klicka **Auto-generera från audit + nyckelord** för AI-baserad plan
4. Klicka **Spara åtgärdsplan**

### Steg 5: Skicka analys + plan till kund
Skicka SEO-analysen och åtgärdsplanen till kunden **innan** säljmötet — det är säljhooken.

### Steg 6: Säljmöte och offert
1. Genomför säljmötet
2. Flytta kunden till "Förslag/Proposal" i pipeline
3. Välj paketnivå (Basic / Standard / Premium)

### Steg 7: Avtal tecknat
När kunden signerar:
1. Flytta till "Kontrakt" i pipeline
2. Fyll i: tjänst, månadsbelopp (SEK), startdatum
3. Systemet beräknar automatiskt slutdatum (3 månader) och tier

### Steg 8: Onboarding
Skicka kunden till onboarding-formuläret på searchboost.se/uppstart:
- WordPress-uppgifter (URL, username, app-password)
- Google Search Console property
- Google Analytics (valfritt)
- Google Ads (valfritt)
- Meta Pixel (valfritt)

### Steg 9: ABC-nyckelord
1. Be kunden om sina viktigaste sökord
2. I dashboarden → **Manuell inmatning** → **Nyckelord (ABC)**
3. Fyll i:
   - **A-ord (5 st):** Huvudnyckelord, högsta prioritet
   - **B-ord (5 st):** Sekundära nyckelord
   - **C-ord (10 st):** Långsvans / nischade
4. Ange fas: **Initial** (från kund) eller **Final** (efter uppstartsmöte)
5. Klicka **Spara nyckelord**

### Steg 10: Uppstartsmöte
1. Gå igenom åtgärdsplan och nyckelord med kunden
2. Justera nyckelorden → uppdatera fas till "Final"
3. Flytta kunden till "Aktiv" i pipeline

### Steg 11: Aktivera åtgärdsplan
1. Öppna kundens åtgärdsplan i dashboarden
2. Klicka **Aktivera Månad 1**
3. Systemets automatiska optimizer börjar utföra uppgifterna
4. Upprepa för månad 2 och 3

### Steg 12: Uppföljning
- Veckorapporter skickas automatiskt varje måndag
- Dashboard visar progress i realtid
- Budget-mätaren visar hur mycket som utförts vs plan

---

## 4. Manuell inmatning

De tre flikarna i kunddetaljen för manuell data:

### Flik 1: SEO-analys

**Vad:** Klistra in SEO-audit från SE Ranking eller skriv egen analys.

| Fält | Beskrivning |
|------|-------------|
| Analys-sammanfattning | Fritext — klistra hela SE Ranking-exporten |
| Sidspecifika problem | Tabellrader: URL, problemtyp, allvarlighetsgrad, prioritet, beskrivning |

**Problemtyper:**
- Tunt innehåll
- Titel saknas/dålig
- Meta saknas
- H1 saknas
- Alt-text saknas
- Långsam laddning
- Schema saknas
- Trasiga länkar
- Duplicerat innehåll
- Övrigt

### Flik 2: Nyckelord (ABC)

**Vad:** Strukturerad inmatning av kundens ABC-nyckelord.

| Fält | Antal | Beskrivning |
|------|------:|-------------|
| A-ord | 5 | Huvudnyckelord, högsta prioritet |
| B-ord | 5 | Sekundära nyckelord |
| C-ord | 10 | Långsvans / nischade sökord |

Per nyckelord kan du ange:
- Sökord (text)
- Sökvolym (valfritt)
- Svårighetsgrad 0–100 (valfritt)

**Fas:** Välj "Initial" (kundens förslag) eller "Final" (efter uppstartsmöte).

### Flik 3: Åtgärdsplan

**Vad:** Manuellt skapad 3-månaders plan — eller auto-genererad från audit + nyckelord.

Per åtgärd:
| Fält | Beskrivning |
|------|-------------|
| Åtgärd | Fri beskrivning |
| Typ | Innehåll, Meta, Teknisk fix, Länkbygge, Schema, Hastighet, Nyckelord, Övrigt |
| Nyckelord | Kopplat sökord (valfritt) |
| Sida | Mål-URL (valfritt) |
| Utförande | Manuell / Auto |

**Auto-generera:** Klicka "Auto-generera från audit + nyckelord" — Claude AI skapar planen baserat på audit-problem och ABC-nyckelord. Befintliga manuella tasks ersätts inte.

---

## 5. Budget och paketnivåer

### Tre nivåer

| Nivå | Pris | Auto-uppgifter/mån | Manuella uppgifter/mån | Content creation | Schema markup |
|------|-----:|:-------------------:|:----------------------:|:----------------:|:-------------:|
| **Basic** | ≤5 000 kr | 15 | 0 | Nej | Nej |
| **Standard** | ≤10 000 kr | 30 | 5 | Nej | Ja |
| **Premium** | >10 000 kr | 50 | 10 | Ja | Ja |

Systemet beräknar automatiskt tier baserat på kontraktets månadsbelopp.

**Budget-mätaren** i dashboarden visar:
- Antal utförda uppgifter denna månad
- Max antal per tier
- Procentuell förbrukning

---

## 6. Automatiskt arbete

### Veckoaudit (Måndag 06:00)
Lambda-funktionen `seo-weekly-audit` kör varje måndag:
1. Hämtar alla aktiva WordPress-siter
2. Scannar alla sidor och inlägg per site
3. Identifierar SEO-problem:
   - Kort/lång titel
   - Tunt innehåll (<300 tecken)
   - Saknad H1
   - Inga interna länkar
   - Saknade alt-texter
   - Saknat schema
4. Prioriterar och lägger topp-10 problem per site i arbetskön

### Autonomous Optimizer (Var 6:e timme)
Lambda-funktionen `seo-autonomous-optimizer`:
1. Plockar max 5 pending-uppgifter från kön
2. Respekterar budget-tier (stoppar om månadens gräns nåtts)
3. Utför optimeringar via Claude AI:
   - **Metadata:** Skriver om titlar + meta descriptions
   - **Interna länkar:** Föreslår och lägger till relevanta internlänkar
   - **FAQ Schema:** Genererar schema markup
4. Loggar resultat i BigQuery
5. Skapar Trello-kort (när credentials fungerar)

### Veckorapport (Måndag 08:00)
Lambda-funktionen `seo-weekly-report`:
1. Sammanställer veckans alla optimeringar
2. Genererar HTML-rapport
3. Skickar via e-post (AWS SES)
4. Sparar i BigQuery

---

## 7. Onboarding av ny kund

### WordPress-plugin
En custom WP-plugin (`Searchboost Onboarding`) installeras på searchboost.se.

**Shortcode:** `[searchboost_uppstart]`

**Formuläret samlar in:**
1. Företagsnamn, kontaktperson, e-post
2. WordPress URL, admin-username, app-password
3. Google Search Console property (valfritt)
4. Google Analytics property ID (valfritt)
5. Google Ads ID (valfritt)
6. Meta Pixel ID (valfritt)

**Vad som händer automatiskt:**
1. Credentials sparas i SSM Parameter Store (krypterat)
2. WordPress-anslutning testas
3. Trello-kort skapas för kunden
4. Kunden registreras i BigQuery (customer_pipeline)
5. Bekräftelse visas

---

## 8. API-referens

### Health check
```bash
curl http://51.21.116.7/health
# → {"status": "ok"}
```

### Hämta alla kunder
```bash
curl http://51.21.116.7/api/customers
```

### Hämta pipeline
```bash
curl http://51.21.116.7/api/pipeline
```

### Lägg till prospekt
```bash
curl -X POST http://51.21.116.7/api/prospects \
  -H "Content-Type: application/json" \
  -d '{
    "company_name": "Exempel AB",
    "website_url": "https://exempel.se",
    "contact_person": "Anna Svensson",
    "contact_email": "anna@exempel.se"
  }'
```

### Flytta kund i pipeline
```bash
curl -X PATCH http://51.21.116.7/api/customers/kund-id/stage \
  -H "Content-Type: application/json" \
  -d '{
    "stage": "contract",
    "service_type": "Standard SEO",
    "monthly_amount_sek": 8000,
    "contract_start_date": "2026-03-01"
  }'
```

### Spara manuell audit
```bash
curl -X POST http://51.21.116.7/api/customers/kund-id/manual-audit \
  -H "Content-Type: application/json" \
  -d '{
    "summary": "Site audit visar 15 kritiska problem...",
    "issues": [
      {"url": "https://exempel.se/", "problem_type": "thin_content", "severity": "high", "priority": 8}
    ]
  }'
```

### Spara manuell åtgärdsplan
```bash
curl -X POST http://51.21.116.7/api/customers/kund-id/manual-action-plan \
  -H "Content-Type: application/json" \
  -d '{
    "tasks": [
      {"month": 1, "description": "Skriv om startsidan", "task_type": "content_creation", "effort": "manual"}
    ]
  }'
```

### Spara ABC-nyckelord
```bash
curl -X POST http://51.21.116.7/api/customers/kund-id/keywords \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": [
      {"keyword": "seo konsult", "tier": "A", "phase": "initial", "monthly_search_volume": 1200}
    ]
  }'
```

### Alla endpoints

| Method | Endpoint | Beskrivning |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/customers` | Lista alla kunder |
| GET | `/api/customers/:id/stats` | Kundstatistik (30d) |
| GET | `/api/customers/:id/rankings` | GSC-positioner + ABC |
| GET | `/api/customers/:id/keywords` | ABC-nyckelord |
| GET | `/api/customers/:id/action-plan` | Åtgärdsplan + progress |
| GET | `/api/customers/:id/audit` | Sparad audit |
| GET | `/api/pipeline` | Pipeline per stadie |
| GET | `/api/optimizations` | Senaste optimeringar |
| GET | `/api/queue` | Arbetskö |
| GET | `/api/reports` | Veckorapporter |
| POST | `/api/prospects` | Lägg till prospekt |
| POST | `/api/customers/:id/keywords` | Spara nyckelord |
| POST | `/api/customers/:id/keywords/analyze` | GSC-analys |
| POST | `/api/customers/:id/action-plan` | Generera AI-plan |
| POST | `/api/customers/:id/action-plan/activate-month` | Aktivera månad |
| POST | `/api/customers/:id/manual-audit` | Spara manuell audit |
| POST | `/api/customers/:id/manual-action-plan` | Spara manuell plan |
| POST | `/api/customers/:id/migrate-to-pipeline` | Migrera befintlig kund |
| POST | `/api/onboard` | Onboarding (WP-plugin) |
| POST | `/api/analyze` | Analysera site SEO |
| POST | `/api/optimize-metadata` | Optimera metadata |
| POST | `/api/audit` | Fullständig site-audit |
| PATCH | `/api/customers/:id/stage` | Flytta pipeline-stadie |

---

## 9. Felsökning

### Dashboard visar "Offline" / kan inte logga in
```bash
# SSH till EC2 och kontrollera PM2
ssh -i ~/.ssh/id_ed25519 ubuntu@51.21.116.7
pm2 status
pm2 logs seo-mcp --lines 50
pm2 restart seo-mcp
```

### BigQuery-fel
```bash
# Kontrollera credentials
aws ssm get-parameter --name /seo-mcp/bigquery/credentials \
  --with-decryption --region eu-north-1 --profile mickedanne@gmail.com

# OBS: Efter IAM-ändringar, starta om PM2 (credentials cachas)
pm2 restart seo-mcp
```

### GSC visar inga positioner
1. Kontrollera att SA är tillagd i kundens GSC-property
2. Gå till search.google.com/search-console
3. Välj kundens property → Inställningar → Användare
4. Lägg till: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
5. Roll: Fullständig

### Trello API 401
```bash
# 1. Gå till https://trello.com/app-key
# 2. Kopiera API Key + generera ny Token
# 3. Uppdatera SSM:
aws ssm put-parameter --name /seo-mcp/trello/api-key \
  --value "NY_KEY" --type SecureString --overwrite \
  --region eu-north-1 --profile mickedanne@gmail.com

aws ssm put-parameter --name /seo-mcp/trello/token \
  --value "NY_TOKEN" --type SecureString --overwrite \
  --region eu-north-1 --profile mickedanne@gmail.com

# 4. Starta om PM2
pm2 restart seo-mcp
```

### SE Ranking API 403
- API-addon saknas på SE Ranking-kontot, eller nyckeln är ogiltig
- Systemet använder GSC som fallback (fungerar)
- Åtgärd: Kontakta SE Ranking, verifiera API-addon, generera ny nyckel

### Lambda-funktioner misslyckas
```bash
# Visa loggar
aws logs tail /aws/lambda/seo-weekly-audit \
  --follow --region eu-north-1 --profile mickedanne@gmail.com

# Manuell körning
aws lambda invoke --function-name seo-weekly-audit \
  --region eu-north-1 --profile mickedanne@gmail.com response.json
cat response.json
```

### WordPress-anslutning misslyckas
1. Testa REST API: `curl https://kund.se/wp-json/wp/v2/posts?per_page=1`
2. Verifiera Application Password i WP Admin → Användare → Application Passwords
3. Uppdatera SSM-parameter: `/seo-mcp/wordpress/{site-id}/app-password`

---

## 10. Deploy-guide

### Deploysteg (MCP-server)

```bash
# 1. Commit och push lokalt
git add . && git commit -m "Beskrivning" && git push origin main

# 2. Öppna port 22
aws ec2 authorize-security-group-ingress \
  --group-id sg-03cb7d131df0fbfb7 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region eu-north-1 --profile mickedanne@gmail.com

# 3. Push SSH-nyckel (60s fönster)
aws ec2-instance-connect send-ssh-public-key \
  --instance-id i-0c36714c9c343698d \
  --availability-zone eu-north-1b \
  --instance-os-user ubuntu \
  --ssh-public-key file://~/.ssh/id_ed25519.pub \
  --region eu-north-1 --profile mickedanne@gmail.com

# 4. SSH + deploy (inom 60s)
ssh -i ~/.ssh/id_ed25519 ubuntu@51.21.116.7 \
  'cd /home/ubuntu/Searchboost-Opti && git pull origin main && \
   cd mcp-server-code && pm2 restart seo-mcp && \
   pm2 logs seo-mcp --lines 15 --nostream'

# 5. Stäng port 22
aws ec2 revoke-security-group-ingress \
  --group-id sg-03cb7d131df0fbfb7 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region eu-north-1 --profile mickedanne@gmail.com
```

### Deploy Lambda-funktioner
```bash
./deploy-lambda-functions.sh
```
