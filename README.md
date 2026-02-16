# Searchboost Opti

Semi-autonomt SEO-optimeringssystem for Searchboost.se.

Hanterar hela kundlivscykeln: prospektering → SEO-audit → offert → kontrakt → automatisk optimering → rapportering.

## Status

| Komponent | Status |
|-----------|--------|
| MCP-server (24 API-endpoints) | Aktiv |
| Dashboard (6 vyer + kunddetalj) | Aktiv |
| Lambda: weekly-audit | Aktiv (måndag 06:00) |
| Lambda: autonomous-optimizer | Aktiv (var 6:e timme) |
| Lambda: weekly-report | Aktiv (måndag 08:00) |
| WordPress onboarding-plugin | Aktiv |
| Google Search Console API | Aktiv (5 kunder) |
| Trello API | Aktiv |
| SE Ranking API | Inaktiv (saknar API-addon) |
| GA4 integration | Ej implementerad |

## Arkitektur

```
┌──────────────────────────────────────────────────────────────┐
│                    EC2 (Express.js)                           │
│                  51.21.116.7:3000                             │
│                                                              │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────────────┐    │
│  │ 24 API      │  │ Dashboard │  │ Onboarding           │    │
│  │ Endpoints   │  │ (static) │  │ (WP plugin → POST)   │    │
│  └──────┬──────┘  └──────────┘  └──────────────────────┘    │
└─────────┼────────────────────────────────────────────────────┘
          │
    ┌─────┼──────────────────────────────────┐
    │     │         Integrationer             │
    │     ├── WordPress REST API (Rank Math)  │
    │     ├── Google Search Console API       │
    │     ├── Trello API                      │
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
├── CLAUDE.md                  Komplett systembeskrivning (läses av Claude)
├── README.md                  Denna fil
├── mcp-server-code/
│   ├── index.js               Express-server, 24 endpoints, alla helpers
│   └── package.json
├── lambda-functions/
│   ├── weekly-audit.js        Veckovis site-audit
│   ├── autonomous-optimizer.js  Automatisk optimering var 6h
│   ├── weekly-report.js       Veckorapport via SES
│   ├── package.json
│   └── deploy-lambda-functions.sh
├── dashboard/
│   ├── index.html             Dashboard UI (6 vyer)
│   ├── app.js                 Klientlogik + formulär
│   └── style.css              Styling
├── wordpress-plugin/
│   └── searchboost-onboarding/
│       └── searchboost-onboarding.php
└── docs/
    ├── kostnadsanalys.md      Driftskostnader + skalning
    ├── forutsattningar.md     Tekniska krav + checklista
    └── användarmanual.md      Komplett användarguide
```

## Snabbstart

Se [CLAUDE.md](CLAUDE.md) för komplett systembeskrivning med flödesschema, API-dokumentation, kundstatus, deploy-process och utvecklingsplan.

## Dokumentation

- **[CLAUDE.md](CLAUDE.md)** — Komplett systembeskrivning (läses automatiskt av Claude)
- **[Kostnadsanalys](docs/kostnadsanalys.md)** — Driftskostnader, skalning, kostnad per kund
- **[Förutsättningar](docs/forutsattningar.md)** — Tekniska krav, SSM-parametrar, checklista
- **[Användarmanual](docs/användarmanual.md)** — Komplett guide: säljprocess, formulär, felsökning
