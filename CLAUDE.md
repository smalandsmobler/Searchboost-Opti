# CLAUDE.md

## Projektöversikt

Searchboost Opti — semi-autonomt SEO-optimeringssystem för Searchboost.se. Hanterar hela kundlivscykeln: prospektering, audit, offert, kontrakt, automatisk optimering och rapportering. Systemet hanterar flera WordPress-kundsajter med autonom SEO-optimering.

## Tech stack

- **Backend:** Node.js 20, Express.js, ren JavaScript (ingen TypeScript)
- **Infrastruktur:** AWS EC2 (eu-north-1), Lambda, SSM Parameter Store, SES, EventBridge
- **Data:** Google BigQuery (6 tabeller), Google Cloud Storage (WIF-autentisering)
- **Frontend:** Vanilla JavaScript, HTML5, CSS3, ApexCharts
- **AI:** Anthropic Claude API
- **Integrationer:** WordPress REST API (Rank Math), Google Search Console, Trello, Google Ads, Meta Ads, LinkedIn Ads, TikTok Ads, EduAdmin

## Kommandon

```bash
# MCP-server (huvudapplikation)
cd mcp-server-code && npm install
npm start            # Startar på port 3000
npm run dev          # Startar med --watch (auto-reload)

# Lambda-funktioner (lokalt test)
cd lambda-functions && npm install
node weekly-audit.js
node autonomous-optimizer.js
node weekly-report.js

# Deploy Lambda till AWS
./deploy-lambda-functions.sh
```

## Projektstruktur

```
mcp-server-code/           # Express-server (huvudapplikation)
  index.js                 # 24 API-endpoints, alla helpers (~4400 rader)
  portal-auth.js           # Kundportal-autentisering (JWT, bcrypt)
  presentation-generator.js # Rapportgenerering (Marp)
  report-exporter.js       # PDF-export (Puppeteer)
  integrations/            # Annonsplattformsintegrationer
    google-ads.js
    meta-ads.js
    linkedin-ads.js
    tiktok-ads.js
    eduadmin.js

lambda-functions/          # Schemalagda AWS Lambda-funktioner
  weekly-audit.js          # Veckovis SEO-audit (måndag 06:00 UTC)
  autonomous-optimizer.js  # Automatisk optimering (var 6:e timme)
  weekly-report.js         # Veckorapport via SES (måndag 08:00 UTC)

dashboard/                 # Webbgränssnitt
  index.html               # Dashboard (6 vyer + login)
  portal.html              # Kundportal
  app.js                   # Dashboard-logik (~2850 rader)
  portal.js                # Portalfunktionalitet
  style.css                # Huvudstil
  portal.css               # Portalstil

wordpress-plugin/          # WordPress-plugins
  searchboost-onboarding/  # Onboarding-formulär
  smk-ai-chat.php          # AI-chattwidget
  smk-img-batch.php        # Batch-bildprocessor
  smk-product-schema.php   # Produktschema-generator

docs/                      # Dokumentation (svenska)
presentations/             # Kundpresentationer och mallar
config/                    # Domänkonfiguration, GTM-mall
```

## Kodkonventioner

- Allt i ren JavaScript (ES modules ej använda — CommonJS/script)
- Kommentarer och variabelnamn på svenska
- Ingen ESLint, Prettier eller TypeScript konfigurerad
- Inga enhetstester — manuell testning via API-endpoints och dashboard
- Inga pre-commit hooks
- Express-servern (`mcp-server-code/index.js`) är en enda stor fil med alla endpoints och helpers

## BigQuery-tabeller

| Tabell | Syfte |
|--------|-------|
| customer_pipeline | Kunddata och status |
| customer_keywords | Målsökord per kund |
| action_plans | SEO-handlingsplaner |
| seo_optimization_log | Logg över automatiska optimeringar |
| weekly_reports | Veckorapporter |
| seo_work_queue | Kö för SEO-arbete |

## Viktiga noteringar

- Hemligheter/credentials lagras i AWS SSM Parameter Store under `/seo-mcp/`
- EC2-servern körs på `51.21.116.7:3000` med Nginx som reverse proxy
- Tre hårdkodade användare för dashboard-login
- WordPress-sajter nås via REST API med credentials från SSM
- Google Cloud-autentisering sker via Workload Identity Federation (WIF)
