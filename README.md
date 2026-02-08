# Searchboost Opti

Semi-autonomt SEO-optimeringssystem for Searchboost.se.

Hanterar hela kundlivscykeln: prospektering → SEO-audit → offert → kontrakt → automatisk optimering → rapportering.

## Status

| Komponent | Status |
|-----------|--------|
| MCP-server (28 API-endpoints) | Aktiv |
| Dashboard (6 vyer + kunddetalj) | Aktiv |
| Lambda: weekly-audit | Aktiv (måndag 06:00) |
| Lambda: autonomous-optimizer | Aktiv (var 6:e timme) |
| Lambda: weekly-report | Aktiv (måndag 08:00) |
| WordPress onboarding-plugin | Aktiv |
| Google Search Console API | Aktiv (searchboost.se) |
| Trello API | Credentials behöver uppdateras (401) |
| SE Ranking API | Väntar på nytt API-nyckel (403) |

## Arkitektur

```
┌──────────────────────────────────────────────────────┐
│                    EC2 (Express.js)                    │
│                  51.21.116.7:3000                      │
│                                                        │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ 28 API      │  │ Dashboard │  │ Onboarding       │  │
│  │ Endpoints   │  │ (static) │  │ (WP plugin POST) │  │
│  └──────┬──────┘  └──────────┘  └──────────────────┘  │
└─────────┼──────────────────────────────────────────────┘
          │
    ┌─────┼──────────────────────────────────┐
    │     │         Integrationer             │
    │     ├── WordPress REST API (Rank Math)  │
    │     ├── Google Search Console API       │
    │     ├── Trello API                      │
    │     ├── SE Ranking API (väntar)         │
    │     └── Claude AI (Anthropic)           │
    └────────────────────────────────────────┘
          │
    ┌─────┴──────────────────────────────────┐
    │        BigQuery (6 tabeller)            │
    │  customer_pipeline  │ customer_keywords │
    │  action_plans       │ seo_work_queue    │
    │  seo_optimization_log │ weekly_reports  │
    └─────────────────────────────────────────┘
          ▲
    ┌─────┴──────────────────────────────────┐
    │     Lambda Functions (EventBridge)      │
    │  weekly-audit    (mån 06:00)           │
    │  autonomous-opt  (var 6h)              │
    │  weekly-report   (mån 08:00)           │
    └────────────────────────────────────────┘
```

## Mappstruktur

```
Searchboost-Opti/
├── README.md
├── mcp-server-code/
│   ├── index.js            Express-server, 28 endpoints, alla helpers
│   └── package.json
├── lambda-functions/
│   ├── weekly-audit.js      Veckovis site-audit
│   ├── autonomous-optimizer.js  Automatisk optimering var 6h
│   ├── weekly-report.js     Veckorapport via SES
│   ├── package.json
│   └── deploy-lambda-functions.sh
├── dashboard/
│   ├── index.html           Dashboard UI (6 vyer)
│   ├── app.js               Klientlogik + formulär
│   └── style.css            Styling
├── wordpress-plugin/
│   └── searchboost-onboarding/
│       └── searchboost-onboarding.php
└── docs/
    ├── kostnadsanalys.md    Driftskostnader + skalning
    ├── forutsattningar.md   Tekniska krav + checklista
    └── användarmanual.md    Komplett användarguide
```

## Funktioner

### Pipeline (Kundlivscykel)
- Kanban-board: Prospekt → Audit → Förslag → Kontrakt → Aktiv → Avslutad
- Automatisk tier-beräkning (Basic/Standard/Premium)
- 3-månaders kontraktshantering med budgetspårning

### Manuell inmatning
- **SEO-analys**: Klistra in från SE Ranking + sidspecifika problem
- **Nyckelord (ABC)**: Strukturerad A/B/C-klassificering med sökvolym
- **Åtgärdsplan**: Manuell 3-månaders plan eller auto-genererad med AI

### Automatisk optimering
- Veckovis audit av alla kunders WordPress-siter
- Autonom metadata-, länk- och schema-optimering var 6:e timme
- Budgetrespekt per kund (15/30/50 uppgifter per månad)
- Veckorapporter via e-post

### Dashboard
- Översikt med MRR, optimeringsstatistik, kundlista
- Pipeline-kanban med drag-and-drop-stadier
- Kunddetalj: kontrakt, budget, nyckelord, åtgärdsplan, positioner

## Infrastruktur

| Resurs | Detalj |
|--------|--------|
| EC2 | t3.micro, eu-north-1b, `i-0c36714c9c343698d` |
| IP | 51.21.116.7 |
| Security Group | `sg-03cb7d131df0fbfb7` |
| PM2 | Process `seo-mcp` på port 3000 |
| Nginx | Reverse proxy 80/443 → 3000 |
| BigQuery | Projekt `searchboost-485810`, dataset `seo_data` |
| GSC | SA: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com` |
| AWS-profil | `mickedanne@gmail.com`, account 176823989073 |

## Deploy

```bash
# 1. Push till GitHub
git add . && git commit -m "Beskrivning" && git push origin main

# 2. Öppna SSH-port + push key (60s fönster)
aws ec2 authorize-security-group-ingress --group-id sg-03cb7d131df0fbfb7 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 --region eu-north-1 --profile mickedanne@gmail.com

aws ec2-instance-connect send-ssh-public-key --instance-id i-0c36714c9c343698d \
  --availability-zone eu-north-1b --instance-os-user ubuntu \
  --ssh-public-key file://~/.ssh/id_ed25519.pub --region eu-north-1 --profile mickedanne@gmail.com

# 3. SSH + deploy
ssh -i ~/.ssh/id_ed25519 ubuntu@51.21.116.7 \
  'cd /home/ubuntu/Searchboost-Opti && git pull && cd mcp-server-code && pm2 restart seo-mcp'

# 4. Stäng SSH-port
aws ec2 revoke-security-group-ingress --group-id sg-03cb7d131df0fbfb7 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 --region eu-north-1 --profile mickedanne@gmail.com

# Lambda-deploy
./deploy-lambda-functions.sh
```

## Dokumentation

- **[Kostnadsanalys](docs/kostnadsanalys.md)** — Driftskostnader, skalning, kostnad per kund
- **[Förutsättningar](docs/forutsattningar.md)** — Tekniska krav, SSM-parametrar, checklista
- **[Användarmanual](docs/användarmanual.md)** — Komplett guide: säljprocess, formulär, felsökning
