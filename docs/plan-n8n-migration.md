# Migreringsplan: AWS Lambda till n8n

> Searchboost Opti -- komplett plan for att flytta alla Lambda-funktioner till n8n Community Edition.
> Datum: 2026-02-14

---

## Innehall

1. [Sammanfattning](#sammanfattning)
2. [Nuvarande arkitektur](#nuvarande-arkitektur)
3. [Mal-arkitektur med n8n](#mal-arkitektur-med-n8n)
4. [Installation och infrastruktur](#installation-och-infrastruktur)
5. [Credential-hantering i n8n](#credential-hantering-i-n8n)
6. [Workflow 1: Weekly Audit](#workflow-1-weekly-audit)
7. [Workflow 2: Autonomous Optimizer](#workflow-2-autonomous-optimizer)
8. [Workflow 3: Weekly Report](#workflow-3-weekly-report)
9. [Workflow 4: Performance Monitor](#workflow-4-performance-monitor)
10. [Workflow 5: Prospect Analyzer](#workflow-5-prospect-analyzer)
11. [Workflow 6: Backlink Monitor](#workflow-6-backlink-monitor)
12. [Workflow 7: Keyword Researcher](#workflow-7-keyword-researcher)
13. [Workflow 8: Content Publisher](#workflow-8-content-publisher)
14. [Error handling och loggning](#error-handling-och-loggning)
15. [Kostnadsanalys](#kostnadsanalys)
16. [Tidplan](#tidplan)
17. [Risker och fallbackplan](#risker-och-fallbackplan)
18. [Migreringschecklista](#migreringschecklista)

---

## Sammanfattning

Vi migrerar 8 Lambda-funktioner till 8 n8n-workflows pa samma EC2 `t3.micro`-instans (51.21.116.7) dar Express-servern redan kor. n8n Community Edition ar gratis och kor som en sjalvstaende process bredvid PM2-processen `seo-mcp`.

**Fordelar:**
- Visuella workflows -- Mikael kan se och forsta varje steg utan att lasa kod
- Inbyggd error handling med retries, timeout-hantering och felnotiser
- Webhook-stod for realtidstriggers (t.ex. prospect-analyzer behover inte ga via Lambda)
- Enklare att lagga till nya integrationer (300+ inbyggda noder)
- Centraliserad loggning i n8n:s UI
- Ingen Lambda-kostnad, ingen EventBridge-kostnad
- Alla workflows pa samma maskin som Express-servern = enklare debugging

**Nackdelar att hantera:**
- EC2 `t3.micro` har bara 1 GB RAM -- n8n anvander ~200-300 MB, Express ~100 MB, det ar tajt
- Inga isolerade koerningar som Lambda -- ett krashande workflow kan paverka andra
- Ingen inbyggd BigQuery-nod i n8n Community -- maste anvanda HTTP Request eller Code-noder

---

## Nuvarande arkitektur

```
┌─────────────────────────┐     ┌──────────────────────────────────┐
│ AWS Lambda (6+2 st)     │     │ EC2 t3.micro (51.21.116.7)       │
│                         │     │                                  │
│ weekly-audit.js         │     │ Express.js (PM2: seo-mcp)        │
│ autonomous-optimizer.js │     │ ├── Dashboard (HTML/JS/CSS)      │
│ weekly-report.js        │     │ ├── 24 API-endpoints             │
│ performance-monitor.js  │     │ └── Nginx reverse proxy          │
│ prospect-analyzer.js    │     │                                  │
│ backlink-monitor.js     │     └──────────────────────────────────┘
│ keyword-researcher.js   │               │
│ content-publisher.js    │               │
└─────────┬───────────────┘               │
          │                               │
          ▼                               ▼
┌───────────────┐  ┌────────────┐  ┌──────────────┐
│ AWS SSM       │  │ BigQuery   │  │ Externa API  │
│ (credentials) │  │ (6 tables) │  │ WP, GSC,     │
│               │  │            │  │ Trello, SES  │
└───────────────┘  └────────────┘  │ Claude, PSI  │
                                   │ SE Ranking   │
                                   └──────────────┘
```

## Mal-arkitektur med n8n

```
┌─────────────────────────────────────────────────────────────┐
│ EC2 t3.micro (51.21.116.7)                                  │
│                                                             │
│ ┌─────────────────────────┐  ┌─────────────────────────┐   │
│ │ Express.js (PM2)        │  │ n8n (PM2 eller Docker)  │   │
│ │ Port 3000               │  │ Port 5678               │   │
│ │ Dashboard + API         │  │ 8 workflows             │   │
│ └────────────┬────────────┘  └────────────┬────────────┘   │
│              │                            │                 │
│ ┌────────────┴────────────────────────────┘                 │
│ │                                                           │
│ │  Nginx reverse proxy                                      │
│ │  ├── / → localhost:3000 (dashboard)                       │
│ │  └── /n8n/ → localhost:5678 (n8n UI)                      │
│ └───────────────────────────────────────────────────────────│
└─────────────────────────────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────┐
        │ Samma externa API:er       │
        │ BigQuery, WP, GSC, Trello, │
        │ Claude, SES, PSI,          │
        │ SE Ranking                 │
        └────────────────────────────┘
```

---

## Installation och infrastruktur

### Alternativ A: n8n via PM2 (rekommenderat)

Foerdelen med PM2 ar att det redan anvands for Express-servern. Enkel konfiguration, inget Docker-overhead pa den lilla instansen.

```bash
# SSH till EC2
ssh -i ~/.ssh/id_ed25519 ubuntu@51.21.116.7

# Installera n8n globalt
npm install -g n8n

# Skapa datakataloger
mkdir -p /home/ubuntu/.n8n

# Skapa miljofil for n8n
cat > /home/ubuntu/.n8n/.env << 'EOF'
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_EDITOR_BASE_URL=http://51.21.116.7/n8n/
N8N_PATH=/n8n/
WEBHOOK_URL=http://51.21.116.7/n8n/
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=searchboost
N8N_BASIC_AUTH_PASSWORD=Opti0195n8n
N8N_LOG_LEVEL=info
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
N8N_DIAGNOSTICS_ENABLED=false
GENERIC_TIMEZONE=Europe/Stockholm
EOF

# Starta med PM2
pm2 start n8n --name n8n -- start
pm2 save
```

### Alternativ B: n8n via Docker

Anvands om EC2-instansen uppgraderas till `t3.small` (2 GB RAM).

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v /home/ubuntu/.n8n:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=searchboost \
  -e N8N_BASIC_AUTH_PASSWORD=Opti0195n8n \
  -e GENERIC_TIMEZONE=Europe/Stockholm \
  --restart unless-stopped \
  n8nio/n8n
```

### Nginx-konfiguration

Lagg till n8n som en ny `location` i Nginx:

```nginx
# /etc/nginx/sites-available/default

server {
    listen 80;
    server_name 51.21.116.7;

    # Befintlig dashboard
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # n8n UI och webhooks
    location /n8n/ {
        proxy_pass http://localhost:5678/n8n/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_buffering off;
        chunked_transfer_encoding on;
        proxy_read_timeout 300s;
    }
}
```

### Minnesuppskattning pa t3.micro (1 GB RAM)

| Process | RAM-anvandning |
|---------|----------------|
| Ubuntu OS + systemd | ~150 MB |
| Nginx | ~10 MB |
| Express.js (PM2: seo-mcp) | ~80-120 MB |
| n8n (PM2) | ~200-350 MB |
| **Totalt** | **~440-630 MB** |
| **Kvar** | **~370-560 MB** |

Det gar, men tajt. Om workflows borjar kora samtidigt och anvander mycket minne (t.ex. prospect-analyzer med stor Claude-prompt) kan det bli swap. **Rekommendation:** Lagg till 1 GB swap-fil som buffer:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Langre sikt: Uppgradera till `t3.small` (2 GB RAM, ~$8/man extra).

---

## Credential-hantering i n8n

Alla credentials lagras i n8n:s inbyggda credential-store (krypterat). Lases in fran AWS SSM en gang vid setup.

| n8n Credential | Typ | Kalla (SSM-sokvag) |
|----------------|-----|---------------------|
| BigQuery Service Account | Google Service Account | `/seo-mcp/bigquery/credentials` |
| Anthropic Claude API | HTTP Header Auth | `/seo-mcp/anthropic/api-key` |
| Trello API | Header Auth (apiKey + token) | `/seo-mcp/trello/api-key`, `/seo-mcp/trello/token` |
| AWS SES | AWS credentials | IAM-roll pa EC2 |
| SE Ranking API | Query Parameter Auth | `/seo-mcp/seranking/api-key` |
| WordPress (per kund) | HTTP Basic Auth | `/seo-mcp/wordpress/{kund}/username` + `app-password` |

**Hur man lagrer BigQuery-credentials i n8n:**
n8n har ingen inbyggd BigQuery-nod i Community Edition. Anvand **HTTP Request**-noden med Google Service Account OAuth2 eller en **Code**-nod som initierar BigQuery-klienten direkt med JSON-credentials.

Basta losningen: Spara GCP service account JSON som en n8n-credential av typen "Header Auth" och anvand det i Code-noder.

---

## Workflow 1: Weekly Audit

**Nuvarande:** `weekly-audit.js` -- mandag 06:00 CET
**Syfte:** Crawlar alla kunders WordPress-sajter, hittar SEO-problem, skapar uppgifter i BigQuery `seo_work_queue`.

### n8n Workflow-design

```
[Cron Trigger] → [Code: Hamta WP-sajter] → [SplitInBatches] →
  ┌──────────────────────────────────────────────────────┐
  │ Per sajt:                                            │
  │ [HTTP: WP REST /posts] → [HTTP: WP REST /pages] →   │
  │ [Code: Analysera SEO-problem] →                      │
  │ [Code: Skapa queue items] →                          │
  │ [HTTP: BigQuery INSERT]                              │
  └──────────────────────────────────────────────────────┘
→ [Code: Sammanstall resultat] → [IF: Fel?] → [Email: Felrapport]
```

### Noder i detalj

| Nod | Typ | Konfiguration |
|-----|-----|---------------|
| **1. Cron Trigger** | Schedule Trigger | Mandag 06:00 CET (`0 6 * * 1`, timezone: Europe/Stockholm) |
| **2. Hamta WP-sajter** | Code | Laes in alla WordPress-credentials fran n8n:s credential store. Returnerar array av `{id, url, username, appPassword}`. Filtrera bort placeholder-konton. |
| **3. SplitInBatches** | SplitInBatches | Batch size: 1 (en sajt at gangen for att undvika minnesoverbelastning) |
| **4. WP REST: Hamta posts** | HTTP Request | `GET {{sajt.url}}/wp-json/wp/v2/posts?per_page=100&status=publish`, Basic Auth |
| **5. WP REST: Hamta pages** | HTTP Request | `GET {{sajt.url}}/wp-json/wp/v2/pages?per_page=100&status=publish`, Basic Auth |
| **6. Analysera SEO-problem** | Code | Exakt samma logik som `auditSite()`: kontrollera title-langd, H1, content-langd, alt-text, interna lankar, schema. Returnerar issues med prioritet. |
| **7. BigQuery INSERT** | HTTP Request | `POST https://bigquery.googleapis.com/bigquery/v2/projects/searchboost-485810/queries` med INSERT-query. Skickar Authorization: Bearer {token} (hamtas via GCP service account). |
| **8. Sammanfattning** | Code | Aggregera resultat fran alla sajter. |
| **9. Error branch** | IF + Send Email | Om nagot steg failar, skicka e-post till mikael@searchboost.se via SMTP/SES. |

### Code-nod: SEO-analys (nod 6)

Karnlogiken som kopieras fran Lambda:

```javascript
// n8n Code-nod — Analysera SEO-problem per sajt
const posts = $input.first().json.posts;
const pages = $input.first().json.pages;
const siteUrl = $input.first().json.siteUrl;
const siteId = $input.first().json.siteId;
const allContent = [...posts, ...pages];
const issues = [];

for (const item of allContent) {
  const problems = [];
  const title = item.title.rendered;
  const content = item.content.rendered;
  const text = content.replace(/<[^>]+>/g, '');

  if (!title || title.length < 20) problems.push({ type: 'short_title', severity: 'high' });
  if (title && title.length > 60) problems.push({ type: 'long_title', severity: 'medium' });
  if (text.length < 300) problems.push({ type: 'thin_content', severity: 'high' });
  if (!content.match(/<h1/i)) problems.push({ type: 'missing_h1', severity: 'medium' });

  const internalLinksRegex = new RegExp(
    `<a[^>]*href=["']${siteUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi'
  );
  if (!(content.match(internalLinksRegex) || []).length)
    problems.push({ type: 'no_internal_links', severity: 'medium' });

  const imgsNoAlt = (content.match(/<img(?![^>]*alt=["'][^"']+["'])[^>]*>/gi) || []).length;
  if (imgsNoAlt > 0) problems.push({ type: 'missing_alt_text', severity: 'low', count: imgsNoAlt });

  if (!content.includes('application/ld+json'))
    problems.push({ type: 'no_schema', severity: 'low' });

  if (problems.length > 0) {
    const priority = problems.reduce(
      (s, p) => s + (p.severity === 'high' ? 3 : p.severity === 'medium' ? 2 : 1), 0
    );
    issues.push({
      id: item.id, title, url: item.link, problems, priority
    });
  }
}

issues.sort((a, b) => b.priority - a.priority);
return issues.slice(0, 10).map(issue => ({
  json: {
    queue_id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    customer_id: siteId,
    site_url: siteUrl,
    task_type: issue.problems[0].type,
    page_url: issue.url,
    context_data: JSON.stringify(issue),
    priority: issue.priority,
    status: 'pending'
  }
}));
```

---

## Workflow 2: Autonomous Optimizer

**Nuvarande:** `autonomous-optimizer.js` -- var 6:e timme
**Syfte:** Tar uppgifter fran `seo_work_queue`, anvander Claude AI for att generera optimerade metadata, skriver tillbaka via WordPress REST API, loggar i BigQuery.

### n8n Workflow-design

```
[Cron Trigger: var 6h] → [HTTP: BigQuery SELECT pending tasks] →
[IF: tasks > 0?] →
  ┌───────────────────────────────────────────────────────────────────┐
  │ [SplitInBatches: max 5] →                                        │
  │   [Switch: task_type] →                                          │
  │     ┌── short_title/long_title/missing_h1 ──┐                    │
  │     │  [HTTP: WP GET post] →                 │                    │
  │     │  [HTTP: Claude API] →                  │                    │
  │     │  [Code: Parse JSON] →                  │                    │
  │     │  [HTTP: WP POST update meta] →         │                    │
  │     │  [HTTP: Trello skapa kort]             │                    │
  │     └────────────────────────────────────────┘                    │
  │     ┌── no_internal_links ──────────────────┐                     │
  │     │  [HTTP: WP GET post] →                 │                    │
  │     │  [HTTP: WP GET posts list] →           │                    │
  │     │  [HTTP: Claude API] →                  │                    │
  │     │  [Code: Infoga lankar] →               │                    │
  │     │  [HTTP: WP POST update content] →      │                    │
  │     │  [HTTP: Trello skapa kort]             │                    │
  │     └────────────────────────────────────────┘                    │
  │     ┌── thin_content/missing_alt/no_schema ─┐                     │
  │     │  [HTTP: Trello: Flagga for granskning] │                    │
  │     └────────────────────────────────────────┘                    │
  │   [HTTP: BigQuery UPDATE status=completed] →                      │
  │   [HTTP: BigQuery INSERT seo_optimization_log]                    │
  └───────────────────────────────────────────────────────────────────┘
→ [Code: Sammanfattning]
```

### Noder i detalj

| Nod | Typ | Konfiguration |
|-----|-----|---------------|
| **Cron Trigger** | Schedule Trigger | Var 6:e timme: `0 0,6,12,18 * * *` (CET) |
| **BigQuery: Hamta tasks** | HTTP Request | BigQuery REST API: `SELECT * FROM seo_work_queue WHERE status='pending' ORDER BY priority DESC LIMIT 5` |
| **BigQuery: Reset errors** | HTTP Request | `UPDATE seo_work_queue SET status='pending' WHERE status='error'` (kors fore SELECT) |
| **Switch** | Switch | Routar pa `task_type`: metadata-grenar vs internlanks-gren vs flagga-gren |
| **Claude API** | HTTP Request | `POST https://api.anthropic.com/v1/messages`, Header: `x-api-key`, `anthropic-version: 2023-06-01`. Body med model `claude-sonnet-4-5-20250929`, max_tokens 800. |
| **Parse Claude JSON** | Code | Samma `parseClaudeJSON()`-logik: strippa ```json``` wrapping, JSON.parse |
| **WP Update** | HTTP Request | `POST {{siteUrl}}/wp-json/wp/v2/posts/{{postId}}`, body: `{meta: {rank_math_title, rank_math_description}}` |
| **Trello** | HTTP Request | `POST https://api.trello.com/1/cards?key=...&token=...&idList=...&name=...&desc=...` |

### Viktig detalj: WordPress-sajt-mapping

Varje task i `seo_work_queue` har `customer_id`. For att anropa ratt WordPress-sajt behovs en mapping fran customer_id till credentials. Losning:

1. Skapa en **Static Data**-nod eller **Code**-nod som laeddar en lookup-tabell fran n8n credentials
2. Alternativt: Lagra WP-credentials i en n8n-tabell (inbyggd databaslagring)

---

## Workflow 3: Weekly Report

**Nuvarande:** `weekly-report.js` -- fredag 15:00 UTC (16:00 CET)
**Syfte:** Sammanstaller veckans optimeringar per kund, skickar kundmail + intern rapport till Mikael via SES.

### n8n Workflow-design

```
[Cron: Fredag 16:00 CET] →
[Parallel] ─┬─ [HTTP: BigQuery optimeringar senaste 7d]
             ├─ [HTTP: BigQuery koustatus]
             ├─ [HTTP: Trello DONE-kort senaste 7d]
             └─ [Code: Hamta aktiva kunder + kontaktinfo]
→ [Merge: Kombinera all data] →
[Code: Gruppera per kund] →
[SplitInBatches: per kund] →
  ┌──────────────────────────────────────────────┐
  │ [IF: Har kundmail + arbete gjort?] →          │
  │   [Code: Bygg kund-HTML] →                   │
  │   [Send Email: SES till kund (BCC Mikael)]   │
  │   [HTTP: BigQuery INSERT weekly_reports]      │
  └──────────────────────────────────────────────┘
→ [Code: Bygg intern rapport-HTML] →
[Send Email: SES intern till Mikael] →
[HTTP: BigQuery INSERT intern rapport]
```

### Noder i detalj

| Nod | Typ | Konfiguration |
|-----|-----|---------------|
| **Cron Trigger** | Schedule Trigger | Fredag 16:00 CET (`0 16 * * 5`) |
| **BigQuery: Optimeringar** | HTTP Request | `SELECT * FROM seo_optimization_log WHERE timestamp >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 7 DAY)` |
| **BigQuery: Koustatus** | HTTP Request | `SELECT status, COUNT(*) FROM seo_work_queue GROUP BY status` |
| **Trello: DONE-kort** | HTTP Request | GET `/1/lists/{doneListId}/cards?fields=name,desc,dateLastActivity`, filtrera pa dateLastActivity >= 7 dagar sedan |
| **Bygg kund-HTML** | Code | Exakt samma `buildCustomerReportHTML()`-funktion. Returnerar HTML-strang. |
| **Send Email** | Send Email (SMTP) eller AWS SES-nod | From: noreply@searchboost.se, To: kundens e-post, BCC: mikael@searchboost.se. Subject: "Veckologg SEO -- {foretagsnamn} -- Vecka X" |
| **Bygg intern HTML** | Code | Exakt samma `buildInternalReportHTML()`. Aggregerar alla kunders data. |

### E-post: SMTP vs SES

n8n har en inbyggd **Send Email**-nod som stodjer SMTP. For AWS SES: anvand SES SMTP-endpointen (`email-smtp.eu-north-1.amazonaws.com`, port 587, TLS). Skapa SMTP-credentials i SES-konsolen (IAM-anvandare med ses:SendRawEmail).

Alternativt: Anvand HTTP Request-noden direkt mot SES REST API med IAM-signering (mer komplext).

**Rekommendation:** SMTP-metoden. Enklare, fungerar med n8n:s inbyggda Send Email-nod.

---

## Workflow 4: Performance Monitor

**Nuvarande:** `performance-monitor.js` -- mandag 06:30 CET
**Syfte:** Kor PageSpeed Insights API pa alla kundsajter, sparar i BigQuery `performance_log`.

### n8n Workflow-design

```
[Cron: Mandag 06:30 CET] →
[Code: Hamta alla kundsajter med URL] →
[SplitInBatches: 1 at gangen] →
  ┌───────────────────────────────────────────────────────────┐
  │ [HTTP: PageSpeed Insights API (mobile)] →                 │
  │ [Code: Extrahera CWV + scores] →                          │
  │ [HTTP: BigQuery INSERT performance_log] →                  │
  │ [Wait: 2 sekunder (rate limit)]                           │
  └───────────────────────────────────────────────────────────┘
→ [Code: Sammanfattning + identifiera darliga sajter]
```

### Noder i detalj

| Nod | Typ | Konfiguration |
|-----|-----|---------------|
| **Cron Trigger** | Schedule Trigger | Mandag 06:30 CET (`30 6 * * 1`) |
| **Hamta sajter** | Code | Laedda alla WordPress-sajter fran credentials. Returnerar `[{id, url}]`. |
| **PageSpeed API** | HTTP Request | `GET https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url={{url}}&strategy=mobile&category=performance&category=seo&category=accessibility&category=best-practices&locale=sv`. Timeout: 60 sekunder. |
| **Extrahera data** | Code | Parsa `lighthouseResult.categories` och `lighthouseResult.audits` for LCP, INP, CLS, FCP, TTFB, scores, opportunities. Klassificera: excellent/good/needs_improvement/poor. |
| **BigQuery INSERT** | HTTP Request | INSERT i `performance_log`-tabellen med alla maetvarden. |
| **Wait** | Wait | 2 sekunder mellan varje sajt (Google rate limit). |

### Fordelar med n8n

PageSpeed Insights API returnerar stor JSON. I Lambda maste all parsning ske i kod. I n8n kan man anvanda **Set**-noder for att extrahera specifika falt visuellt, och **IF**-noder for att identifiera sajter med dalig prestanda och triggra alarms.

---

## Workflow 5: Prospect Analyzer

**Nuvarande:** `prospect-analyzer.js` -- manuell trigger via API
**Syfte:** Analyserar en prospects sajt (crawl + PageSpeed + GSC + Autocomplete + Claude AI) och genererar SEO-analys + presentation.

### n8n Workflow-design

```
[Webhook Trigger: POST /n8n/webhook/prospect-analyze] →
[Code: Validera input (url, companyName, industry)] →
[Parallel] ─┬─ [Sub-workflow: Crawla sajt (WP REST + HTML fallback)]
             ├─ [Sub-workflow: PageSpeed (mobil + desktop)]
             ├─ [HTTP: GSC Search Analytics (om property anges)]
             └─ [Sub-workflow: Google Autocomplete]
→ [Merge: Kombinera all data] →
[HTTP: Claude API (generera analys + presentation)] →
[Code: Parse Claude JSON] →
[HTTP: BigQuery INSERT prospect_analyses] →
[Respond to Webhook: Returnera resultat]
```

### Noder i detalj

| Nod | Typ | Konfiguration |
|-----|-----|---------------|
| **Webhook Trigger** | Webhook | `POST /n8n/webhook/prospect-analyze`. Body: `{url, companyName, industry, contactPerson, priceTier, gscProperty}` |
| **Crawla sajt** | Sub-workflow eller sekvens | Forsok WP REST API (pages + posts). Om 404/timeout: fallback till vanlig GET + HTML-parsning. Analysera title, description, H1, alt-text, interna lankar, schema. |
| **PageSpeed** | HTTP Request x2 | Kor mobil + desktop separat, extrahera scores + opportunities. |
| **GSC** | HTTP Request | `POST https://www.googleapis.com/webmasters/v3/sites/{property}/searchAnalytics/query` med OAuth2 token fran service account. |
| **Autocomplete** | Code + HTTP Request | Skicka 10 seed-keywords till `google.com/complete/search`, samla alla forslag. |
| **Claude AI** | HTTP Request | `POST https://api.anthropic.com/v1/messages` med den stora prompten (exakt samma som Lambda). Max 8000 tokens. |
| **Respond to Webhook** | Respond to Webhook | Returnerar `{id, companyName, analysis_md, presentation_md, scores, issues}` |

### Koppling till Dashboard

Express-servern kan anropa n8n-webhoken istallet for Lambda:

```javascript
// I mcp-server-code/index.js, byt ut Lambda-invoke mot:
app.post('/api/prospect-analysis', async (req, res) => {
  const result = await axios.post('http://localhost:5678/n8n/webhook/prospect-analyze', req.body);
  res.json(result.data);
});
```

---

## Workflow 6: Backlink Monitor

**Nuvarande:** `backlink-monitor.js` -- dagligen
**Syfte:** Hamtar backlink-data fran SE Ranking API (summary, refdomains, anchors) for alla domaner (kunder + konkurrenter + prospects), sparar i 3 BigQuery-tabeller.

### n8n Workflow-design

```
[Cron: Dagligen 07:00 CET] →
[HTTP: SE Ranking /account/subscription (kolla credits)] →
[IF: Credits < 100?] → [Stop + Notifiera]
[Code: Bygg domanlista (kunder + konkurrenter + prospects)] →
[SplitInBatches: 1 at gangen] →
  ┌────────────────────────────────────────────────────────────┐
  │ [HTTP: SE Ranking /backlinks/summary] →                    │
  │ [HTTP: SE Ranking /backlinks/refdomains?limit=500] →       │
  │ [HTTP: SE Ranking /backlinks/anchors?limit=500] →          │
  │ [HTTP: BigQuery INSERT backlink_snapshots] →               │
  │ [Code: Batcha refdomains (200 at gangen)] →                │
  │ [HTTP: BigQuery INSERT backlink_refdomains] →              │
  │ [Code: Batcha anchors (200 at gangen)] →                   │
  │ [HTTP: BigQuery INSERT backlink_anchors] →                 │
  │ [Wait: 500ms]                                              │
  └────────────────────────────────────────────────────────────┘
→ [HTTP: SE Ranking /account/subscription (credits after)] →
[Code: Sammanfattning]
```

### SE Ranking-specifikation

Alla SE Ranking-anrop anvander query parameter-autentisering:
```
GET https://api.seranking.com/v1/backlinks/summary?target=domain.se&mode=host&apikey=e474f1ab-...&output=json
```

I n8n konfigureras detta som en HTTP Request med URL-parametrar. Ingen header-auth behovs.

### Domanlista (haerdkodad i Code-nod)

Exakt samma lista som i Lambda: 10 kunder, 6 konkurrenter, 2 prospects = 18 domaner. ~54 API-anrop per korning (3 per doman).

---

## Workflow 7: Keyword Researcher

**Nuvarande:** `keyword-researcher.js` -- manuell trigger
**Syfte:** Hittar nya sokord for en kund via GSC + Google Autocomplete + Claude AI.

### n8n Workflow-design

```
[Webhook: POST /n8n/webhook/keyword-research] →
[Code: Hamta kundinfo fran BQ/credentials] →
[IF: Har GSC-property?] →
  [HTTP: GSC Search Analytics (500 keywords)] →
[Code: Samla seed-keywords (GSC + befintliga ABC)] →
[Code + HTTP loop: Google Autocomplete (20 seeds x 16 varianter)] →
[HTTP: Claude API (analysera + foreslaa + ABC-klassificera)] →
[Code: Parse Claude JSON] →
[HTTP: BigQuery INSERT keyword_research_log] →
[Respond to Webhook: Returnera resultat]
```

### Autocomplete-expansion

Den mest komplexa delen. I Lambda-koden gors 20 seeds x (1 bas + 10 bokstaver + 5 prefix) = potentiellt 320 HTTP-anrop. I n8n:

1. **Code-nod:** Generera alla URL:er (seed + varianter)
2. **SplitInBatches + HTTP Request:** Kor varje URL sekventiellt med 200ms delay
3. **Code-nod:** Aggregera alla unika forslag

Alternativt: Gor allt i en enda Code-nod med `axios` for att undvika hundratals noder i floedet.

---

## Workflow 8: Content Publisher

**Nuvarande:** `content-publisher.js` -- dagligen
**Syfte:** Genererar SEO-artiklar med Claude AI och publicerar till kunders WordPress-sajter med korsreferens-backlinks.

### n8n Workflow-design

```
[Cron: Dagligen 09:00 CET] →
[Code: Hamta alla WP-sajter med credentials] →
[HTTP: BigQuery SELECT senaste publicering per sajt] →
[Code: Filtrera sajter (minst 3 dagar sedan)] →
[Code: Valj max 3 sajter (rotation)] →
[SplitInBatches] →
  ┌──────────────────────────────────────────────────────────────────┐
  │ [Code: Valj artikeltyp + backlink-mal] →                         │
  │ [HTTP: Claude API (generera artikel, 4000 tokens)] →             │
  │ [Code: Parse Claude JSON] →                                      │
  │ [HTTP: WP REST skapa/hitta kategori "Blogg"] →                   │
  │ [HTTP: WP REST POST /posts (publicera)] →                        │
  │ [HTTP: BigQuery INSERT content_publishing_log]                    │
  └──────────────────────────────────────────────────────────────────┘
→ [Code: Sammanfattning (X/Y artiklar publicerade)]
```

### Backlink-natverksstyrning

I Code-noden "Valj backlink-mal": Slumpa 2-3 andra sajter fran nätverket att lanka till. Samma logik som `selectBacklinkTargets()` i Lambda.

---

## Error handling och loggning

### n8n-inbyggda mekanismer

| Mekanism | Konfiguration |
|----------|---------------|
| **Retry on fail** | Aktivera pa HTTP Request-noder: 3 retries, 5 sekunders delay, exponential backoff |
| **Error Trigger** | Skapa ett separat "Error Workflow" som skickar e-post vid misslyckade koerningar |
| **Execution log** | n8n sparar automatiskt alla koerningar med input/output for varje nod (pruning: 168h) |
| **Timeout** | Satt workflow timeout till 10 minuter for schemalagda, 5 minuter for webhook-triggade |

### Error Workflow (skapas som separat workflow)

```
[Error Trigger] →
[Code: Formatera felmeddelande] →
[Send Email: mikael@searchboost.se]
  Subject: "[n8n] Workflow misslyckades: {{workflow.name}}"
  Body: "Workflow: {{workflow.name}}
         Nod: {{$execution.error.node}}
         Fel: {{$execution.error.message}}
         Tidpunkt: {{$now.toISO()}}"
```

### Loggning till BigQuery

For att behalla samma loggningsbeteende som Lambda, lagg till en HTTP Request-nod i slutet av varje workflow som skriver en summerad rad till en ny BigQuery-tabell `workflow_executions`:

```sql
CREATE TABLE seo_data.workflow_executions (
  id STRING,
  workflow_name STRING,
  status STRING,          -- 'success' / 'error'
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  items_processed INT64,
  error_message STRING,
  details STRING          -- JSON med workflow-specifik data
);
```

---

## Kostnadsanalys

### Nuvarande kostnad (Lambda + EventBridge)

| Resurs | Manadskostnad | Kommentar |
|--------|---------------|-----------|
| Lambda (8 funktioner) | ~$0.50-2.00 | 128-256 MB, max 15 min timeout, fa koerningar |
| EventBridge (scheman) | ~$0.00 | Gratis upp till 14M invocations |
| CloudWatch Logs | ~$0.50-1.00 | Log ingestion + storage |
| **Lambda-totalt** | **~$1.00-3.00/man** | |

### Ny kostnad (n8n pa EC2)

| Resurs | Manadskostnad | Kommentar |
|--------|---------------|-----------|
| n8n Community Edition | $0 | Gratis, MIT-licens |
| Extra RAM for n8n | $0 | Ryms pa befintlig t3.micro (tajt) |
| Eventuell t3.small-uppgradering | +$8.00/man | Rekommenderat langre sikt |
| **n8n-totalt** | **$0-8/man** | |

### Kostnad som INTE andras

| Resurs | Manadskostnad | Kommentar |
|--------|---------------|-----------|
| EC2 t3.micro | ~$8.50 | Kors redan, oberoende av Lambda/n8n |
| BigQuery | ~$0.00-0.50 | Free tier, minimal data |
| Anthropic Claude API | ~$0.50-5.00 | Beror pa anvandning, oberoende av plattform |
| AWS SES | ~$0.00 | Gratis up to 62k emails/man fran EC2 |
| SE Ranking API | $0 | Credits, inte per-anrop-kostnad |
| PageSpeed Insights API | $0 | Gratis |

### Sammanfattning

| | Lambda | n8n |
|---|--------|-----|
| Plattformskostnad | ~$1-3/man | $0/man |
| EC2-uppgradering | Ej nodvandigt | $0-8/man (om t3.small) |
| **Totalt** | **~$1-3/man** | **$0-8/man** |

Kostnadsmaessigt ar skillnaden marginal. Den verkliga vinsten ar **utvecklingseffektivitet** och **synlighet** for Mikael -- inte pengar.

---

## Tidplan

### Fas 1: Forberedelse (1 dag)

| Uppgift | Tid |
|---------|-----|
| Installera n8n pa EC2 | 30 min |
| Konfigurera Nginx-proxy | 15 min |
| Skapa swap-fil | 5 min |
| Konfigurera n8n credentials (BigQuery, Claude, Trello, WP per kund, SES SMTP) | 1h |
| Skapa Error Workflow | 30 min |
| Testa att n8n UI ar atkomligt pa http://51.21.116.7/n8n/ | 15 min |

### Fas 2: Enklare workflows (2 dagar)

Borja med workflows som har faerre beroenden:

| Dag | Workflow | Tid | Svaarighetsgrad |
|-----|----------|-----|-----------------|
| Dag 1 | Performance Monitor (#4) | 2h | Lag -- bara PSI API + BigQuery |
| Dag 1 | Backlink Monitor (#6) | 2h | Lag -- bara SE Ranking + BigQuery |
| Dag 2 | Weekly Audit (#1) | 3h | Medel -- WP REST + analys-logik |
| Dag 2 | Weekly Report (#3) | 3h | Medel -- BQ + Trello + SES + HTML-templating |

### Fas 3: Komplexa workflows (2 dagar)

| Dag | Workflow | Tid | Svaarighetsgrad |
|-----|----------|-----|-----------------|
| Dag 3 | Autonomous Optimizer (#2) | 4h | Hoeg -- Switch-logik, Claude, WP skrivning |
| Dag 3 | Content Publisher (#8) | 3h | Hoeg -- Claude + WP publicering + rotation |
| Dag 4 | Prospect Analyzer (#5) | 3h | Hoeg -- Parallella datakallor, stor Claude-prompt |
| Dag 4 | Keyword Researcher (#7) | 3h | Medel -- GSC + Autocomplete (manga anrop) |

### Fas 4: Parallellkoerning och verifiering (3 dagar)

| Uppgift | Tid |
|---------|-----|
| Kor Lambda OCH n8n parallellt i 3 dagar | -- |
| Jamfor resultat (BigQuery-rader, antal mail, Trello-kort) | 1h/dag |
| Fixa eventuella buggar | 1-2h/dag |

### Fas 5: Avstaengning av Lambda (1 dag)

| Uppgift | Tid |
|---------|-----|
| Inaktivera EventBridge-scheman | 15 min |
| Uppdatera Express API-endpoints som anropar Lambda → n8n webhook | 1h |
| Dokumentera i CLAUDE.md | 30 min |
| Ta bort Lambda-funktioner (eller laat ligga som backup) | 15 min |

### Total tidplan

| Fas | Tid | Datum (start 2026-02-17) |
|-----|-----|--------------------------|
| Fas 1: Forberedelse | 1 dag | man 17 feb |
| Fas 2: Enklare workflows | 2 dagar | tis-ons 18-19 feb |
| Fas 3: Komplexa workflows | 2 dagar | tor-fre 20-21 feb |
| Fas 4: Parallellkoerning | 3 dagar | man-ons 24-26 feb |
| Fas 5: Avstaengning | 1 dag | tor 27 feb |
| **Totalt** | **~9 arbetsdagar** | **17-27 feb 2026** |

---

## Risker och fallbackplan

### Risk 1: Minne (t3.micro = 1 GB)

**Risk:** n8n + Express + OS overstiger 1 GB, systemet swappar och blir treegt.
**Sannolikhet:** Medel-hoeg vid tunga workflows (prospect-analyzer).
**Fallback:** Uppgradera till t3.small ($8/man extra). Kan goras pa 5 minuter via AWS Console (kräver omstart).

### Risk 2: BigQuery utan inbyggd nod

**Risk:** n8n Community Edition har ingen inbyggd Google BigQuery-nod. Alla BQ-anrop maste gaa via HTTP Request med manuell OAuth2-hantering.
**Sannolikhet:** 100% -- detta ar ett faktum.
**Losning:** Skapa en reusable "BigQuery Query"-sub-workflow som:
1. Haemtar access token via service account JWT (Code-nod)
2. Skickar query via HTTP Request till BQ REST API
3. Returnerar resultat

Alternativ: Anvand n8n:s Code-nod med `@google-cloud/bigquery` npm-paket direkt (kräver `npm install` i n8n-miljon).

### Risk 3: n8n-krasch paverkar Express

**Risk:** Om n8n kraschar eller tar for mycket minne, kan Express (dashboard) paverkas.
**Sannolikhet:** Laag (PM2 hanterar processer oberoende).
**Fallback:** PM2 startar om n8n automatiskt. Satt `max_memory_restart: 400M` i PM2-config.

### Risk 4: Webhook-sakerhet

**Risk:** n8n webhooks ar oppna -- vem som helst kan triggra prospect-analyzer.
**Losning:** Anvand n8n:s webhook auth (Header Auth med API-nyckel). Samma nyckel som dashboard-API:t (`sb-api-41bb...`).

### Risk 5: Databasmigration

**Risk:** n8n-korningar producerar data med annorlunda format an Lambda.
**Sannolikhet:** Laag om Code-noderna anvander exakt samma logik.
**Fallback:** Parallellkoerning i 3 dagar (Fas 4) fangar formatskillnader.

---

## Migreringschecklista

### Fore migrering

- [ ] Verifiera att EC2 har tillrackligt diskutrymme (minst 2 GB fritt)
- [ ] Skapa 1 GB swap-fil pa EC2
- [ ] Dokumentera alla SSM-parametervarden (for att mata in i n8n credentials)
- [ ] Skapa SES SMTP-credentials (IAM-anvandare for SMTP)
- [ ] Testa BigQuery REST API manuellt med curl (saekerstaell att service account JWT fungerar)

### Under migrering (per workflow)

- [ ] Skapa n8n-workflowet med alla noder
- [ ] Testa manuellt (tryck "Execute Workflow" i n8n UI)
- [ ] Jamfor output med Lambda-koerning (samma BigQuery-rader, samma mail, samma Trello-kort)
- [ ] Aktivera schemat i n8n
- [ ] Kor parallellt med Lambda i minst 2 dagar

### Efter migrering

- [ ] Inaktivera alla EventBridge-scheman i AWS
- [ ] Uppdatera Express-endpoints (`/api/prospect-analysis`, `/api/keyword-research`) att peka pa n8n webhooks
- [ ] Uppdatera CLAUDE.md med ny arkitektur
- [ ] Uppdatera deploy-dokumentation
- [ ] Overvaka n8n-koerningar i 2 veckor
- [ ] Oevervaeg att ta bort Lambda-funktionerna (eller behall som backup)

---

## Appendix: BigQuery via n8n HTTP Request

Eftersom n8n Community Edition saknar inbyggd BigQuery-nod, har aer en mall for hur man gor BQ-anrop via HTTP Request:

### Steg 1: Hamta access token (Code-nod)

```javascript
const crypto = require('crypto');

// Service account credentials (lagrad som n8n credential)
const serviceAccount = JSON.parse($credentials.bigqueryServiceAccount);

// Skapa JWT
const now = Math.floor(Date.now() / 1000);
const header = Buffer.from(JSON.stringify({
  alg: 'RS256', typ: 'JWT'
})).toString('base64url');

const payload = Buffer.from(JSON.stringify({
  iss: serviceAccount.client_email,
  scope: 'https://www.googleapis.com/auth/bigquery',
  aud: 'https://oauth2.googleapis.com/token',
  iat: now,
  exp: now + 3600
})).toString('base64url');

const sign = crypto.createSign('RSA-SHA256');
sign.update(`${header}.${payload}`);
const signature = sign.sign(serviceAccount.private_key, 'base64url');

const jwt = `${header}.${payload}.${signature}`;

// Byt JWT mot access token
const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`
});

const tokenData = await tokenRes.json();
return [{ json: { accessToken: tokenData.access_token } }];
```

### Steg 2: Kor query (HTTP Request-nod)

```
POST https://bigquery.googleapis.com/bigquery/v2/projects/searchboost-485810/queries
Authorization: Bearer {{$node['Hamta Token'].json.accessToken}}
Content-Type: application/json

{
  "query": "SELECT * FROM seo_data.seo_work_queue WHERE status = 'pending' LIMIT 5",
  "useLegacySql": false
}
```

### Alternativ: Enklare vaeg med npm-paket

Installera `@google-cloud/bigquery` i n8n:s miljoe:

```bash
cd /usr/local/lib/node_modules/n8n
npm install @google-cloud/bigquery
```

Da kan Code-noder anvanda:

```javascript
const { BigQuery } = require('@google-cloud/bigquery');
const bq = new BigQuery({
  projectId: 'searchboost-485810',
  credentials: JSON.parse($credentials.bigqueryServiceAccount)
});
const [rows] = await bq.query({ query: 'SELECT ...' });
return rows.map(r => ({ json: r }));
```

---

*Dokumentet skapat 2026-02-14 av Viktor/Claude Code. Granska med Mikael fore migrering.*
