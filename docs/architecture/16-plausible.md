# 16 — Plausible (self-hosted analytics)

> Verifierat live 2026-05-31. Ersätter beroendet av kundens GA4. Egen instans → vi äger datan, kunden behöver inte ge åtkomst, weekly/monthly-rapporten slutar blockeras av "analytics saknar data".

## Vad det är, kort

Plausible Community Edition (Elixir/Phoenix-stack) körs som Docker Compose med tre tjänster: Postgres (config/meta), ClickHouse (events) och Phoenix-appen (UI + ingestion). Vi serverar det bakom nginx + Let's Encrypt.

## Live-fakta

| Sak | Värde |
|-----|-------|
| URL | https://analytics.searchboost.se |
| Version | v3.2.1 (ghcr.io/plausible/community-edition:v3.2.1) |
| EC2 | `i-0ae6ac46c2d6adf28`, t3.large, eu-north-1b, 40 GB gp3 |
| Elastic IP | `13.63.66.148` (allokering `eipalloc-...`, association `eipassoc-02ad438cea3fe504c`) |
| Security Group | `sg-037d1bb607429ace7` ("searchboost-analytics-sg") — TCP 80, 443 öppna 0.0.0.0/0; 22 stängd, öppnas vid behov från min IP |
| Subnet | `subnet-07d0c4d6dfd3cbc75` |
| AMI | `ami-0eed6a7e3bd86ff98` (Ubuntu 22.04 LTS jammy, hvm-ssd) |
| SSL | Let's Encrypt via certbot-nginx, förnyas via systemd-timer |
| Docker | 29.5.2 |

## DNS

Loopia XML-RPC API satte A-record `analytics.searchboost.se → 13.63.66.148` (verifierat resolvas via dig @8.8.8.8 + @1.1.1.1).

## Filer på instansen

- `/opt/plausible/compose.yml` — uppströms från https://github.com/aaPanel/.. faktiskt https://github.com/plausible/community-edition.git
- `/opt/plausible/compose.override.yml` — vår override: binder `plausible`-containern till `127.0.0.1:8000:8000` så nginx kan proxa
- `/opt/plausible/.env` — hemligheter (`SECRET_KEY_BASE`, `TOTP_VAULT_KEY`, `BASE_URL=https://analytics.searchboost.se`, `DISABLE_REGISTRATION=invite_only`, `LISTEN_IP=0.0.0.0`, `TZ=Europe/Stockholm`)
- `/etc/nginx/sites-enabled/plausible` — proxy_pass `http://127.0.0.1:8000` + HTTPS + HTTP→HTTPS-redirect (managed by Certbot)

## SSM

| Path | Värde |
|------|-------|
| `/seo-mcp/plausible/url` | `https://analytics.searchboost.se` |
| `/seo-mcp/plausible/instance-id` | `i-0ae6ac46c2d6adf28` |
| `/seo-mcp/plausible/eip` | `13.63.66.148` |

(API-nyckel sparas i `/seo-mcp/plausible/api-key` när Mikael genererar den i UI.)

## GÖR vs BORDE GÖRA

| Område | GÖR idag | BORDE GÖRA (gap) |
|--------|----------|-------------------|
| Containers + SSL + DNS | ✅ Live, fungerar | — |
| Första admin-konto | ❌ Inte skapat (`DISABLE_REGISTRATION=invite_only` tillåter första signup som admin) | Mikael: registrera mikael@searchboost.se → blir admin |
| Site per kund | ❌ Tom Plausible-instans | Skapa en site per kund (smk, ilmonte, jelmtech, mobelrondellen, nordicsnusonline, traficator, humanpower, searchboost, tobler) |
| Tracker-snippet på kundsajter | ❌ | Lägg in `<script defer src="https://analytics.searchboost.se/js/script.js" data-domain="<kund-domän>"></script>` i `<head>` på respektive sajt (Rank Math + Perispa eller manuellt) |
| GA4-historik-import | ❌ | Plausible CE har inbyggd GA4-importer (Settings → Imports & Exports). Per kund: koppla deras GA4-property via OAuth. Property-ID:n finns redan i SSM `/seo-mcp/integrations/<kund>/ga4-property-id` |
| Looker Studio | ❌ Connector finns | Plausible har officiell Looker Studio Community Connector — datasource per site_id + API-key |
| Backup | ❌ | Snapshot EBS-volym dagligen, eller `pg_dump` + `clickhouse-backup` till S3 |
| Replacement-pipeline för weekly/monthly-rapporten | ❌ | Lambda `data-collector` ska få ny gren: läs Plausible Stats API → BQ `plausible_daily_metrics` (parallellt med GSC/GA4). Då lever rapporten utan GA4-beroende |

## Två oberoende MCP-vägar (gratis båda)

| Variant | Backend | API-key | Hastighet | När? |
|---------|---------|---------|-----------|------|
| `plausible` | Plausibles Stats API v2 | Krävs (gratis på CE, paid på cloud) | Standard | Default — produktionssäker, väldokumenterat shape |
| `plausible-ch` | ClickHouse direkt via SSH-tunnel | Ingen | Snabbare (direkt SQL) | Backup + custom-aggregat |

Båda exponerar samma 4 verktyg så Claude kan välja vilken som helst beroende på prompt.

### Verifierat: Stats API på CE = gratis

Plausibles prislista (https://plausible.io/#pricing) gäller `plausible.io`-cloud — där låser de Stats API bakom Business-planen ($69/mo). På **Community Edition** (det vi självhostar) ingår alla features inkl. Stats API utan extra kostnad. Källa: https://plausible.io/blog/community-edition + LICENSE i `tools/vendor/plausible-mcp/`. Test mot vår instans 2026-05-31:

```
$ curl -X POST https://analytics.searchboost.se/api/v2/query -H 'Content-Type: application/json' -d '{...}'
{"error":"Missing API key. Please use a valid Plausible API key as a Bearer Token."}
HTTP 401
```

= endpoint existerar, kräver bara Bearer-key som Mikael genererar i UI utan prenumeration.

## MCP-server (Claude kopplad mot Plausible)

`getsentry/plausible-mcp` klonad och byggd i `tools/vendor/plausible-mcp/dist/`. Inkopplad i `.mcp.json`:

```json
"plausible": {
  "command": "node",
  "args": ["/.../tools/vendor/plausible-mcp/dist/index.js"],
  "env": {
    "PLAUSIBLE_BASE_URL": "https://analytics.searchboost.se",
    "PLAUSIBLE_API_KEY": "<sätts via SSM /seo-mcp/plausible/api-key>"
  }
}
```

Alternativ launcher som hämtar key dynamiskt från SSM: `tools/plausible-mcp-launcher.sh`.

Verktyg som Claude får:
- `get_timeseries` — trafik och konv-metrics över tid
- `get_breakdown` — bryt ner per sida, källa, land, device, browser, OS, UTM
- `get_conversions` — målkonverteringar, valbart per sida
- `compare_periods` — sida-vid-sida-jämförelse av två tidsperioder

Aktiveras så fort Mikael genererar API-key och kör:
```bash
aws ssm put-parameter --name /seo-mcp/plausible/api-key --value '<key>' --type SecureString --overwrite --region eu-north-1 --profile mikael
```

### CH-direct MCP (`plausible-ch`)

`tools/plausible-ch-mcp/` — egen MCP-server som skippar Stats API helt. SSH-tunnel till EC2 → ClickHouse på port 18123 lokalt → SQL direkt mot `plausible_events_db.events_v2` + `sessions_v2`.

Launcher: `tools/plausible-ch-mcp-launcher.sh` (hanterar SSH-portöppning + key-push + tunnel-start). Inget API-key behövs — vi har root-access till databasen.

Stödda CH-tabeller:
- `events_v2` (raw events: pageview + custom goals, kolumner: timestamp, name, site_id, user_id, session_id, hostname, pathname, referrer, country_code, screen_size, browser, OS, UTM, meta.key/value)
- `sessions_v2` (aggregerade sessioner)
- `imported_*` (GA4-historik från Plausible-importer)

Aktiveras direkt utan API-key — fungerar så fort tracker börjat skicka data till Plausible (efter onboarding-snippeten är på kundsajten).

## Tracker-snippet i onboardingen

### WordPress-kunder (Rank Math + Perispa)

`wordpress-plugin/searchboost-onboarding/plausible-tracker.php` injekterar automatiskt i `<head>` på alla publika sidor när plugin är aktiv. Settings:
- `sb_plausible_enabled` (default `1`) — toggle
- `sb_plausible_domain` (default = host från `home_url()`) — visas som site_id i Plausible UI

Plugin version bumpad till 1.2.0. Aktiveras direkt vid plugin-aktivering, inget kund-handpåläggning krävs.

### Next.js / headless-sajter

`searchboost-react/src/lib/plausible.tsx` exporterar `<PlausibleScript domain="..." />` (App Router) + `trackEvent(name, props)`-helper. Användning i `app/layout.tsx`:

```tsx
import { PlausibleScript } from '@/lib/plausible';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <head>
        <PlausibleScript domain="arbetsro.se" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Custom events:
```tsx
import { trackEvent } from '@/lib/plausible';
<button onClick={() => trackEvent('Newsletter Signup', { source: 'footer' })}>Prenumerera</button>
```

### Tracker-script-build

Vi använder vår hostade `analytics.searchboost.se/js/script.outbound-links.tagged-events.file-downloads.js` — samma JS som `@plausible-analytics/tracker` (https://www.npmjs.com/package/@plausible-analytics/tracker) skulle bunta, men hostat hos oss för att slippa kund-CDN-cache och få full kontroll på versioner.

Features inkluderade i builden:
- `outbound-links` — spårar klick på externa länkar
- `tagged-events` — `window.plausible('Goal Name', { props: {...} })`
- `file-downloads` — pdf/mp3/zip-nedladdningar

## Stats API (sammandrag)

Plausible Stats API: `GET https://analytics.searchboost.se/api/v1/stats/aggregate?site_id=<domain>&period=30d&metrics=visitors,pageviews,bounce_rate,visit_duration`. Auth: `Authorization: Bearer <api-key>`.

Per-period-aggregat och timeseries finns. Inte lika rik som GA4 men täcker det vi behöver för månadsrapporten: visitors, pageviews, sessions, top sources, top pages, top countries, conversion goals.

## Driftkommandon

```bash
# SSH (öppna port 22 från min IP först)
aws ec2 authorize-security-group-ingress --group-id sg-037d1bb607429ace7 --protocol tcp --port 22 \
  --cidr "$(curl -s -4 ifconfig.me)/32" --region eu-north-1 --profile mikael
aws ec2-instance-connect send-ssh-public-key --instance-id i-0ae6ac46c2d6adf28 --instance-os-user ubuntu \
  --ssh-public-key file://~/.ssh/id_ed25519.pub --region eu-north-1 --profile mikael
ssh -i ~/.ssh/id_ed25519 ubuntu@13.63.66.148

# Status
sudo docker compose -f /opt/plausible/compose.yml -f /opt/plausible/compose.override.yml ps
sudo docker logs plausible-plausible-1 --tail 100

# Uppdatera Plausible
cd /opt/plausible && sudo git pull && sudo docker compose pull && sudo docker compose up -d
```

## Säkerhet

- `SECRET_KEY_BASE` + `TOTP_VAULT_KEY` slumpgenererade vid setup, lagrade i `/opt/plausible/.env` (root-owned).
- `DISABLE_REGISTRATION=invite_only` → bara första kontot kan skapas öppet, sedan kräver det invite från admin.
- Inkommande trafik: 80/443 öppet (krävs för tracker-pixel). 8000 endast på loopback.
- Backup: ej satt ännu (gap).

## Roadmap

1. Mikael skapar admin-konto + API-key.
2. Vi batch-skapar sites för alla aktiva kunder via Plausible API.
3. Vi rullar in tracker-snippet på alla WP-sajter via Perispa (Rank Math header-script-fält).
4. Vi triggar GA4-import per site (kräver att kunden auktoriserar OAuth — eller vi använder ett servicekonto med readonly på samtliga GA4-properties).
5. `data-collector` får en `plausible-gren`: pollar Stats API → skriver `plausible_daily_metrics` BQ-tabell.
6. `monthly-client-report` får en flagga "data_source: plausible|ga4" — börjar med plausible som primär, ga4 som fallback.
7. Looker Studio template kopplas mot Plausible-connector + BQ `monthly_kpi_summary_v1`.
