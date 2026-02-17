# Supermetrics Integrationsplan for Searchboost.se

> Strategiskt beslutsunderlag for Supermetrics-integration i Searchboost Opti-plattformen.
> Datum: 2026-02-17 | Forfattare: Claude Code (Mikael Larssons uppdrag)

---

## Innehallsforteckning

1. [Sammanfattning](#sammanfattning)
2. [Nuvarande arkitektur](#nuvarande-arkitektur)
3. [Supermetrics — Produktoversikt och prissattning](#supermetrics-produktoversikt)
4. [Anvandningsfall 1: Kunddashboard](#anvandningsfall-1-kunddashboard)
5. [Anvandningsfall 2: Manadsrapport](#anvandningsfall-2-manadsrapport)
6. [Anvandningsfall 3: Marketing/annonsering](#anvandningsfall-3-marketingannonsering)
7. [Total kostnadsjamforelse](#total-kostnadsjamforelse)
8. [Beslutsmatris: Supermetrics vs egenutvecklad kod](#beslutsmatris)
9. [Rekommenderad plan](#rekommenderad-plan)
10. [Steg-for-steg setup-guide](#steg-for-steg-setup-guide)
11. [Risker och begransningar](#risker-och-begransningar)
12. [Slutsats och rekommendation](#slutsats)

---

## Sammanfattning

Searchboost Opti har idag en fullt fungerande plattform med egenutvecklade API-integrationer (GSC, Google Ads, Meta Ads, LinkedIn Ads, GA4) som kor pa AWS Lambda + EC2 och lagrar data i BigQuery. Plattformen hanterar 10 kunder.

**Karnfragan**: Ar Supermetrics vart investeringen for en byra med 10 kunder, givet att vi redan byggt merparten av integrationerna sjalva?

**Kort svar**: For Searchboosts nuvarande storlek (10 kunder) ar Supermetrics **svart att motivera ekonomiskt**. Det kostar 3-8x mer an den befintliga losningen och erbjuder marginella fordelar. **Supermetrics blir ekonomiskt fordelaktigt forst vid ~25-30 kunder** eller om byran borjar erbjuda annonshantering till fler kunder med komplex kanalrapportering.

**Undantag**: Om ni planerar snabb tillvaxt till 25+ kunder inom 6 manader, eller om utvecklartiden for underhall av custom-kod overstiger 8-10 timmar/manad, sa kan Supermetrics vara ratt val nu.

---

## Nuvarande arkitektur

```
┌──────────────────────────────────────────────────────────────┐
│                    BEFINTLIG DATAFLODE                        │
│                                                              │
│  GSC API ─────────┐                                         │
│  GA4 Data API ────┤                                         │
│  Google Ads API ──┼──► EC2 (Express.js) ──► BigQuery        │
│  Meta Ads API ────┤       │                    │            │
│  LinkedIn Ads API ┘       │                    │            │
│                           │                    │            │
│                    ┌──────┘                    │            │
│                    │                           │            │
│              Dashboard              Lambda: weekly-report    │
│              (admin)                     │                   │
│                                         ▼                   │
│              Kundportal             AWS SES                  │
│              (kunder)               (e-post)                │
│                                                              │
│  Kostnad: ~$5-15/man (Lambda + EC2 + BigQuery)              │
│  Utvecklartid: ~200 timmar investerat                       │
│  Underhall: ~2-4 timmar/manad                               │
└──────────────────────────────────────────────────────────────┘
```

### Befintliga integrationer (kod i reposet)

| Integration | Fil | Status | Rader |
|-------------|-----|--------|-------|
| Google Search Console | `mcp-server-code/index.js` (GSC-endpoints) | LIVE, fungerar | ~150 |
| Google Ads REST API v17 | `mcp-server-code/integrations/google-ads.js` | Byggt, ej kopplat | 391 |
| Meta Marketing API v21.0 | `mcp-server-code/integrations/meta-ads.js` | Byggt, ej kopplat | 403 |
| LinkedIn Marketing API v2 | `mcp-server-code/integrations/linkedin-ads.js` | Byggt, ej kopplat | 321 |
| TikTok Marketing API v1.3 | `mcp-server-code/integrations/tiktok-ads.js` | Byggt, ej kopplat | 381 |
| GA4 Data API (touchpoints) | `mcp-server-code/index.js` (touchpoints-endpoint) | Byggt, ej kopplat | ~80 |
| Aggregator | `mcp-server-code/integrations/index.js` | Byggt | 218 |
| Veckorapport | `lambda-functions/weekly-report.js` | LIVE, kor varje fredag | ~300 |
| PDF/PPTX-export | `mcp-server-code/report-exporter.js` | Byggt, deployat | 549 |

**Total investering i egen kod**: ~2500 rader specialbyggd integrationskod.

---

## Supermetrics — Produktoversikt

### Vad ar Supermetrics?

Supermetrics ar en ETL-plattform (Extract, Transform, Load) som hamtar data fran 100+ marknadsforingskallor och skickar till destinationer som BigQuery, Google Sheets, Looker Studio, Excel, eller data warehouses.

### Prissattning (per februari 2026)

Supermetrics har tva huvudprodukter relevanta for Searchboost:

#### 1. Supermetrics for BigQuery

| Plan | Pris (manad) | Pris (ar) | Datakallor | Konton | Uppdatering |
|------|-------------|-----------|------------|--------|-------------|
| Essential | ~$99/man | ~$79/man (arlig) | 1 connector | 10 konton | Daglig |
| Core | ~$199/man | ~$159/man (arlig) | 5 connectors | 50 konton | 6h |
| Super (team) | ~$399/man | ~$319/man (arlig) | Alla connectors | Obegransat | 1h |

**OBS**: Varje "connector" = en datakalla (GSC ar en connector, GA4 ar en annan, osv). For Searchboosts behov kravs minst 3-5 connectors, vilket landar pa **Core** ($199/man) eller **Super** ($399/man).

#### 2. Supermetrics for Looker Studio

| Plan | Pris (manad) | Connectors | Konton |
|------|-------------|------------|--------|
| Essential | ~$59/man | 1 connector | Obegransat |
| Core | ~$119/man | 5 connectors | Obegransat |
| Super | ~$239/man | Alla | Obegransat |

#### Relevanta connectors

| Connector | Behovs for | Kategori |
|-----------|-----------|----------|
| Google Search Console | Kunddashboard + Manadsrapport | SEO |
| Google Analytics 4 | Kunddashboard + Manadsrapport | Web Analytics |
| Google Ads | Annonsrapportering | Ads |
| Meta Ads (Facebook/Instagram) | Annonsrapportering | Ads |
| LinkedIn Ads | Annonsrapportering | Ads |
| TikTok Ads | Annonsrapportering (framtid) | Ads |

**Minimum behov**: 5-6 connectors = **Core-plan minst**.

---

## Anvandningsfall 1: Kunddashboard

### Syfte

Visa realtidsnara SEO- och trafikdata i kundportalen (kundzon.searchboost.nu) sa att kunder kan se sina positioner, klick, konverteringar och optimeringshistorik.

### Nuvarande losning (egenutvecklad)

```
┌─────────────────────────────────────────────────────────────┐
│  NUVARANDE: Direkt API → Dashboard                          │
│                                                             │
│  Kund loggar in pa portal.html                              │
│       │                                                     │
│       ▼                                                     │
│  portal.js anropar EC2-endpoints:                           │
│  ├─ GET /api/customers/:id/rankings     (GSC, live)        │
│  ├─ GET /api/customers/:id/stats        (BigQuery)         │
│  ├─ GET /api/customers/:id/touchpoints  (GA4, live)        │
│  ├─ GET /api/optimizations              (BigQuery)         │
│  └─ GET /api/customers/:id/action-plan  (BigQuery)         │
│       │                                                     │
│       ▼                                                     │
│  EC2/Express anropar GSC/GA4 API direkt → returnerar JSON   │
│  (Cachad i minne, ~5 min TTL)                               │
│                                                             │
│  Latency: 1-3 sekunder (forsta anrop), <200ms (cachat)     │
│  Kostnad: $0 (GSC/GA4 API ar gratis)                       │
│  Uppdatering: Realtid vid sidladdning                       │
└─────────────────────────────────────────────────────────────┘
```

### Supermetrics-alternativet

```
┌─────────────────────────────────────────────────────────────┐
│  SUPERMETRICS: Scheduled ETL → BigQuery → Dashboard         │
│                                                             │
│  Supermetrics (schema: var 6h / dagligen)                   │
│  ├─ GSC connector → BigQuery: sm_gsc_queries               │
│  ├─ GA4 connector → BigQuery: sm_ga4_sessions              │
│  └─ GA4 connector → BigQuery: sm_ga4_events                │
│       │                                                     │
│       ▼                                                     │
│  BigQuery (tabeller per connector)                          │
│       │                                                     │
│       ▼                                                     │
│  EC2/Express laser fran BigQuery → returnerar JSON          │
│       │                                                     │
│       ▼                                                     │
│  Kundportal visar data                                      │
│                                                             │
│  Latency: <500ms (BigQuery-query)                           │
│  Kostnad: ~$160-320/man (Core/Super for BigQuery)           │
│  Uppdatering: Var 6h-24h (beroende pa plan)                │
│  Data-frakness: 6-24 timmar gammal                          │
└─────────────────────────────────────────────────────────────┘
```

### BigQuery-tabelldesign (Supermetrics)

Om Supermetrics anvands skapar det automatiskt tabeller. Typisk struktur:

```sql
-- Tabell: sm_gsc_queries (skapas automatiskt av Supermetrics)
CREATE TABLE seo_data.sm_gsc_queries (
  date DATE,
  account STRING,                -- Kundens GSC-property
  query STRING,                  -- Sokord
  page STRING,                   -- URL
  country STRING,
  device STRING,
  clicks INT64,
  impressions INT64,
  ctr FLOAT64,
  position FLOAT64,
  _sm_extracted_at TIMESTAMP,    -- Supermetrics metadata
  _sm_account_id STRING
);

-- Tabell: sm_ga4_sessions
CREATE TABLE seo_data.sm_ga4_sessions (
  date DATE,
  account STRING,                -- GA4 property
  session_default_channel STRING,
  sessions INT64,
  engaged_sessions INT64,
  engagement_rate FLOAT64,
  average_session_duration FLOAT64,
  bounce_rate FLOAT64,
  new_users INT64,
  total_users INT64,
  conversions INT64,
  _sm_extracted_at TIMESTAMP
);

-- Tabell: sm_ga4_events
CREATE TABLE seo_data.sm_ga4_events (
  date DATE,
  account STRING,
  event_name STRING,
  event_count INT64,
  total_users INT64,
  _sm_extracted_at TIMESTAMP
);
```

### Jamforelse

| Aspekt | Nuvarande (egenutvecklad) | Supermetrics |
|--------|--------------------------|--------------|
| **Kostnad/man** | $0 (API-anrop gratis) | $160-320 |
| **Data-frakness** | Realtid (live API-anrop) | 6-24 timmar |
| **Latency** | 1-3s (forsta), <200ms (cache) | <500ms (BigQuery) |
| **Underhall** | 1-2 tim/man (vid API-andringar) | ~0 (Supermetrics underhaller connectors) |
| **Flexibilitet** | Total kontroll over querys | Begransad till Supermetrics schema |
| **Setup-tid** | Redan byggt (0 timmar) | 4-8 timmar initial setup |
| **Historisk data** | Begransad (cachat) | 12-24 manader (beroende pa plan) |
| **Skalbarhet** | Lineart med antal kunder | Bra skalning (bulk ETL) |
| **Risk** | API-andringar kan bryta kod | Supermetrics hanterar det |

### Fordelar Supermetrics for kunddashboard

1. **Historisk data**: Supermetrics lagrar trenddata i BigQuery — mojliggor sparklines med riktig historik istallet for placeholders
2. **Underhallsfritt**: Inga API-andringar att hantera
3. **Datakonsistens**: Samma data i BigQuery for dashboard OCH rapporter

### Nackdelar Supermetrics for kunddashboard

1. **Kostnad**: $160-320/man for data som idag ar gratis
2. **Forlorad realtid**: Kunder ser 6-24h gammal data istallet for live
3. **Redundant**: Befintlig losning fungerar och ar live
4. **Vendor lock-in**: Beroende av Supermetrics prismodell och tillganglighet
5. **Overflodig komplexitet**: ETL-lager som inte behovs nar API-anrop ar snabba

### Rekommendation for anvandningsfall 1

**BEHALL EGENUTVECKLAD LOSNING**. Kostnaden motiveras inte nar API-anropen ar gratis och redan implementerade. Den enda potentiella vinsten (historisk data for trendgrafer) kan losas genom att lata Lambda-funktionen spara daglig data till BigQuery for ~$0 extra.

---

## Anvandningsfall 2: Manadsrapport

### Syfte

Generera professionella manads-/veckorapporter per kund med GSC-positioner, trafikdata, utforda optimeringar och KPI:er. Idag skickas veckorapporter via e-post (HTML) och kan exporteras som PDF/PPTX.

### Nuvarande losning

```
┌─────────────────────────────────────────────────────────────┐
│  NUVARANDE: Lambda + SES + Marp PDF                         │
│                                                             │
│  Lambda: weekly-report.js (fredag 16:00 CET)                │
│  ├─ Hamtar aktiva kunder fran SSM                           │
│  ├─ Queryr BigQuery: seo_optimization_log (7 dagar)         │
│  ├─ Queryr BigQuery: seo_work_queue                         │
│  ├─ Hamtar Trello DONE-kort (7 dagar)                       │
│  ├─ Genererar HTML-rapport per kund                         │
│  └─ Skickar via AWS SES                                     │
│       │                                                     │
│       ▼                                                     │
│  API: POST /api/customers/:id/report/export                 │
│  └─ Marp-markdown → PDF/PPTX (Searchboost-tema)            │
│                                                             │
│  Kostnad: ~$0.50/man (Lambda + SES)                         │
│  Kvalitet: Anpassad design, kontrollerad ton, SEK-format    │
│  Flexibilitet: Full kontroll over layout, innehall, timing  │
└─────────────────────────────────────────────────────────────┘
```

### Supermetrics-alternativet (via Looker Studio)

```
┌─────────────────────────────────────────────────────────────┐
│  SUPERMETRICS: ETL → BigQuery → Looker Studio template      │
│                                                             │
│  Supermetrics (daglig sync)                                 │
│  ├─ GSC → BigQuery                                          │
│  ├─ GA4 → BigQuery                                          │
│  └─ Ads → BigQuery                                          │
│       │                                                     │
│       ▼                                                     │
│  BigQuery (unified schema)                                  │
│       │                                                     │
│       ▼                                                     │
│  Looker Studio rapport-template                             │
│  ├─ Parameteriserad per kund (data source filter)           │
│  ├─ Searchboost-tema (custom CSS)                           │
│  └─ Schemalagd e-post (Looker Studio Pro, +$9/anvandare)   │
│       │                                                     │
│       ▼                                                     │
│  PDF skickas via mail ELLER                                 │
│  Kunden far link till live Looker-rapport                   │
│                                                             │
│  Kostnad: $120-240/man (Supermetrics) + $0-9/man (Looker)  │
│  Kvalitet: Standard Looker-design (anpassningsbar)          │
│  Flexibilitet: Looker-templates ar kraftfulla men annorlunda│
└─────────────────────────────────────────────────────────────┘
```

### BigQuery-tabelldesign for rapportering

```sql
-- Komplettera befintliga tabeller med Supermetrics-data

-- Ny: sm_gsc_daily (daglig GSC-data per kund)
CREATE TABLE seo_data.sm_gsc_daily (
  date DATE,
  customer_id STRING,           -- Mappad via account → customer_id
  total_clicks INT64,
  total_impressions INT64,
  avg_ctr FLOAT64,
  avg_position FLOAT64,
  top10_keywords INT64,         -- Beraknad kolumn
  _sm_extracted_at TIMESTAMP
);

-- Ny: sm_ga4_daily (daglig trafik per kund)
CREATE TABLE seo_data.sm_ga4_daily (
  date DATE,
  customer_id STRING,
  sessions INT64,
  users INT64,
  new_users INT64,
  engaged_sessions INT64,
  conversions INT64,
  bounce_rate FLOAT64,
  avg_session_duration FLOAT64,
  organic_sessions INT64,
  _sm_extracted_at TIMESTAMP
);

-- Vy for manadsrapport
CREATE VIEW seo_data.v_monthly_report AS
SELECT
  customer_id,
  DATE_TRUNC(date, MONTH) AS month,
  SUM(total_clicks) AS clicks,
  SUM(total_impressions) AS impressions,
  AVG(avg_position) AS avg_position,
  MAX(top10_keywords) AS top10_keywords
FROM seo_data.sm_gsc_daily
GROUP BY customer_id, month
ORDER BY month DESC;
```

### Jamforelse

| Aspekt | Nuvarande (Lambda + SES + Marp) | Supermetrics + Looker Studio |
|--------|-------------------------------|------------------------------|
| **Kostnad/man** | ~$0.50 | $130-250 |
| **Design** | Full kontroll (Marp dark theme) | Looker Studio templates |
| **Automation** | Fredag 16:00, helt automatiskt | Looker schemalagd PDF |
| **Kundupplevelse** | PDF/PPTX i e-post | Link till live rapport ELLER PDF |
| **Interaktivitet** | Statisk rapport | Interaktiv (filter, drill-down) |
| **Data** | BigQuery + Trello DONE-kort | Supermetrics-data + BigQuery |
| **Underhall** | 1 tim/man | ~0 |
| **Setup** | Redan byggt | 8-16 timmar (design Looker-template) |
| **Anpassning** | Komplett (ton, formateringar, SEK) | God (Looker ar flexibelt) |
| **Skalbarhet** | God (Lambda skalar automatiskt) | Utmarkt (nya kunder = nytt filter) |

### Fordelar Supermetrics for manadsrapport

1. **Interaktivitet**: Kunder kan filtrera, drill-down i Looker Studio
2. **Live-data**: Rapporten ar alltid uppdaterad (inte bara varje fredag)
3. **Professionellt utseende**: Looker Studio-rapporter ser polerade ut
4. **Skalbarhet**: Nya kunder ar en enkel filtrandrande, inte ny kod
5. **Historiska trender**: Automatiskt med langre dataserier

### Nackdelar Supermetrics for manadsrapport

1. **Kostnad**: 260-500x dyrare an nuvarande losning ($130+ vs $0.50)
2. **Forlorad kontroll**: Kunden ser Looker-UI istallet for Searchboost-varumärkt portal
3. **Manuell mapping**: Supermetrics-tabeller maste mappas till kund-ID:er
4. **Beroende**: Tva nya verktyg (Supermetrics + Looker Studio) att hantera
5. **Ton och copy**: Lambda-rapporten har Searchboost-ton — Looker ar mer "ra data"

### Hybridmojlighet

Det mest intressanta alternativet ar att anvanda Supermetrics **enbart for datalagringen** i BigQuery, men behalla den befintliga Lambda + Marp-pipelinen for rapportgenerering:

```
Supermetrics → BigQuery (rikare data)
                    │
                    ▼
         Lambda: weekly-report.js (befintlig)
         ├─ Queryr Supermetrics-tabeller istallet for live API
         ├─ Genererar samma HTML/PDF som idag
         └─ Skickar via SES
```

Detta ger historisk data utan att forlora Searchboost-varumärkning.

### Rekommendation for anvandningsfall 2

**HYBRID: Behall egna rapporter, overväg Looker Studio som tillval for premium-kunder**. Bygg en enkel historik-tabell i BigQuery (Lambda sparar daglig data) for trendgrafer. Erbjud Looker Studio-rapport som premium-tillagg (3000 kr/man paketering) for kunder som vill ha interaktiva rapporter.

---

## Anvandningsfall 3: Marketing/annonsering

### Syfte

Samla Google Ads, Meta Ads, LinkedIn Ads (och framtida TikTok Ads) data i BigQuery for cross-channel-rapportering. Visa aggregerad spend, ROAS, konverteringar per kanal i dashboard och rapporter.

### Nuvarande losning

```
┌─────────────────────────────────────────────────────────────┐
│  NUVARANDE: Custom API-integration per plattform            │
│                                                             │
│  EC2: GET /api/customers/:id/ads                            │
│  ├─ integrations/google-ads.js (GAQL, OAuth2)  ← EJ LIVE  │
│  ├─ integrations/meta-ads.js (Marketing API)   ← EJ LIVE  │
│  ├─ integrations/linkedin-ads.js (REST)        ← EJ LIVE  │
│  ├─ integrations/tiktok-ads.js (REST)          ← EJ LIVE  │
│  └─ integrations/index.js (aggregator)         ← EJ LIVE  │
│       │                                                     │
│       ▼                                                     │
│  Live API-anrop per plattform → aggregerat JSON             │
│                                                             │
│  Status: BYGGT men INTE KOPPLAT (inga credentials i SSM)   │
│  Kostnad: $0 (API-anrop ar gratis)                          │
│  Underhall: ~4 tim/man (4 plattformars API-andringar)      │
│  Komplexitet: HoG — 4 olika autentiseringsmodeller          │
│              (OAuth2/refresh, long-lived token, etc)        │
└─────────────────────────────────────────────────────────────┘
```

### Supermetrics-alternativet

```
┌─────────────────────────────────────────────────────────────┐
│  SUPERMETRICS: Unified ETL for alla annonsplattformar       │
│                                                             │
│  Supermetrics (var 6h)                                      │
│  ├─ Google Ads connector → BigQuery: sm_google_ads          │
│  ├─ Meta Ads connector  → BigQuery: sm_meta_ads             │
│  ├─ LinkedIn Ads connector → BigQuery: sm_linkedin_ads      │
│  └─ (TikTok Ads connector → BigQuery: sm_tiktok_ads)       │
│       │                                                     │
│       ▼                                                     │
│  BigQuery (normaliserat schema per plattform)               │
│       │                                                     │
│       ▼                                                     │
│  EC2/Express laser fran BigQuery                            │
│  ├─ Inga live API-anrop behövs                              │
│  ├─ Ingen OAuth2-hantering                                  │
│  └─ Enklare kod (SQL istallet for 4 olika API:er)           │
│       │                                                     │
│       ▼                                                     │
│  Dashboard + Kundportal + Rapporter                         │
│                                                             │
│  Kostnad: $200-400/man (Core/Super for BigQuery)            │
│  Underhall: ~0 (Supermetrics hanterar API-andringar)        │
│  Setup: 4-6 timmar                                          │
│  Data-frakness: 6 timmar                                    │
└─────────────────────────────────────────────────────────────┘
```

### BigQuery-tabelldesign for annonsdata

```sql
-- Google Ads (Supermetrics skapar automatiskt)
CREATE TABLE seo_data.sm_google_ads (
  date DATE,
  account STRING,                -- Google Ads customer ID
  campaign_name STRING,
  campaign_status STRING,
  ad_group_name STRING,
  keyword STRING,
  match_type STRING,
  impressions INT64,
  clicks INT64,
  cost FLOAT64,                  -- I kontots valuta (SEK)
  conversions FLOAT64,
  conversion_value FLOAT64,
  ctr FLOAT64,
  avg_cpc FLOAT64,
  impression_share FLOAT64,
  _sm_extracted_at TIMESTAMP,
  _sm_account_id STRING
);

-- Meta Ads
CREATE TABLE seo_data.sm_meta_ads (
  date DATE,
  account STRING,                -- Meta ad account ID
  campaign_name STRING,
  campaign_status STRING,
  adset_name STRING,
  ad_name STRING,
  objective STRING,
  impressions INT64,
  reach INT64,
  clicks INT64,
  spend FLOAT64,
  ctr FLOAT64,
  cpc FLOAT64,
  cpm FLOAT64,
  conversions INT64,             -- Summa av alla konverteringshandelser
  purchase_value FLOAT64,
  leads INT64,
  _sm_extracted_at TIMESTAMP
);

-- LinkedIn Ads
CREATE TABLE seo_data.sm_linkedin_ads (
  date DATE,
  account STRING,
  campaign_group_name STRING,
  campaign_name STRING,
  campaign_status STRING,
  impressions INT64,
  clicks INT64,
  cost FLOAT64,
  conversions INT64,
  engagement INT64,
  likes INT64,
  comments INT64,
  shares INT64,
  video_views INT64,
  _sm_extracted_at TIMESTAMP
);

-- Cross-channel vy (aggregerad)
CREATE VIEW seo_data.v_cross_channel_ads AS
SELECT
  date,
  customer_id,
  'google_ads' AS platform,
  campaign_name,
  impressions,
  clicks,
  cost AS spend,
  conversions,
  conversion_value
FROM seo_data.sm_google_ads g
JOIN seo_data.customer_pipeline c ON g.account = c.google_ads_id

UNION ALL

SELECT
  date,
  customer_id,
  'meta_ads' AS platform,
  campaign_name,
  impressions,
  clicks,
  spend,
  conversions,
  purchase_value AS conversion_value
FROM seo_data.sm_meta_ads m
JOIN seo_data.customer_pipeline c ON m.account = c.meta_ad_account_id

UNION ALL

SELECT
  date,
  customer_id,
  'linkedin_ads' AS platform,
  campaign_name,
  impressions,
  clicks,
  cost AS spend,
  conversions,
  0 AS conversion_value
FROM seo_data.sm_linkedin_ads l
JOIN seo_data.customer_pipeline c ON l.account = c.linkedin_ad_account_id;

-- Mangadssammanfattning per kund och kanal
CREATE VIEW seo_data.v_monthly_ads_summary AS
SELECT
  customer_id,
  platform,
  DATE_TRUNC(date, MONTH) AS month,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  SUM(spend) AS spend,
  SUM(conversions) AS conversions,
  SUM(conversion_value) AS conversion_value,
  SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100 AS ctr,
  SAFE_DIVIDE(SUM(spend), SUM(clicks)) AS cpc,
  SAFE_DIVIDE(SUM(conversion_value), SUM(spend)) AS roas
FROM seo_data.v_cross_channel_ads
GROUP BY customer_id, platform, month
ORDER BY month DESC, customer_id, platform;
```

### Jamforelse

| Aspekt | Nuvarande (custom API-kod) | Supermetrics |
|--------|--------------------------|--------------|
| **Kostnad/man** | $0 (APIs gratis) | $200-400 |
| **Status** | Byggt men ej live | Behover setup |
| **Underhall** | 4-6 tim/man (4 API:er) | ~0 |
| **OAuth-hantering** | Manuell (refresh tokens, expiry) | Automatisk |
| **Token-fornyelse** | Kodad (Google), manuell (Meta 60d) | Automatisk |
| **Data-frakness** | Realtid | 6 timmar |
| **Cross-channel** | Aggregator i JavaScript | SQL-vy i BigQuery |
| **Nya plattformar** | Bygga ny integration (40-80 tim) | Aktivera connector (~1 tim) |
| **Setup** | 0 (redan byggt) | 4-6 timmar |
| **Historisk data** | Ingen (live-anrop) | 12-24 manader |

### Fordelar Supermetrics for annonsering

1. **OAuth/token-hantering**: Storsta vinsten — Meta tokens expires var 60:e dag, Google Ads OAuth kraver refresh. Supermetrics skoter detta helt
2. **Historisk data**: Automatisk lagraring i BigQuery — mojliggor trendanalys
3. **Skalbarhet**: Nya annonsplattformar (Pinterest, Snapchat, etc) tar minuter att lagga till
4. **Tillforlitlighet**: Supermetrics gor tusentals API-anrop dagligen — de hanterar rate limits, retries, paginering
5. **Cross-channel**: BigQuery-vyer ger enkel cross-channel-rapportering

### Nackdelar Supermetrics for annonsering

1. **Kostnad**: $200-400/man for 10 kunder ar dyrt nar ingen annu har annonsering aktiv
2. **Forlorad realtid**: Dashboard visar 6h gammal data
3. **Kodslöseri**: 1500+ rader specialbyggd kod blir overflödig
4. **Prematur investering**: Noll kunder har annonsintegrationer konfigurerade idag

### Rekommendation for anvandningsfall 3

**DETTA AR DET STARKASTE FALLET FOR SUPERMETRICS** — men inte forran kunder faktiskt har annonsering igång. Annons-API:er ar de mest komplexa att underhalla (OAuth, token-fornyelse, API-versioner som andras). **Nar forsta kunden med Google Ads + Meta Ads aktiv annonsering onboardas**, evaluera Supermetrics. Innan dess ar det prematur investering.

**Overgangsstrategi**: Nar 3+ kunder har aktiv annonsering, aktivera Supermetrics Core for BigQuery ($199/man) och migrera bort fran custom ads-koden.

---

## Total kostnadsjamforelse

### Arlig kostnad

| Komponent | Nuvarande losning | Supermetrics Essential | Supermetrics Core | Supermetrics Super |
|-----------|-------------------|----------------------|-------------------|-------------------|
| **Supermetrics-licens** | $0 | $948/ar ($79/man) | $1,908/ar ($159/man) | $3,828/ar ($319/man) |
| **Connectors** | — | 1 (otillrackligt) | 5 (minimum behov) | Alla |
| **Lambda/EC2** | $60-180/ar | $60-180/ar | $60-180/ar | $60-180/ar |
| **BigQuery** | $12-60/ar | $12-60/ar | $24-120/ar (mer data) | $36-180/ar |
| **Utvecklartid (underhall)** | $600-1200/ar (4-8h/man a $150/h) | $300-600/ar | $0-300/ar | $0-300/ar |
| **TOTAL** | **$672-1,440/ar** | **$1,320-1,788/ar** | **$1,992-2,508/ar** | **$3,924-4,488/ar** |
| **TOTAL SEK (1 USD = 10.5 SEK)** | **7,056-15,120 kr/ar** | **13,860-18,774 kr/ar** | **20,916-26,334 kr/ar** | **41,202-47,124 kr/ar** |

### Kostnad per kund per manad

| | Nuvarande | SM Core | SM Super |
|--|-----------|---------|----------|
| **10 kunder** | 59-126 kr | 174-219 kr | 344-393 kr |
| **25 kunder** | 24-50 kr | 70-88 kr | 137-157 kr |
| **50 kunder** | 12-25 kr | 35-44 kr | 69-79 kr |

**Slutsats**: Supermetrics ar 2-3x dyrare vid 10 kunder. Vid 25+ kunder borjar utvecklartids-besparingen gora skillnad, men Core ar fortfarande dyrare i absoluta tal.

### Nar Supermetrics lonar sig ekonomiskt

Supermetrics lonar sig nar **sparad utvecklartid** overstiger **licenskostnaden**:

```
Break-even = Supermetrics-kostnad / timkostnad for utvecklare

Core ($159/man): $159 / $150/h = 1.06 timmar/manad sparad utvecklartid
Super ($319/man): $319 / $150/h = 2.13 timmar/manad

Nuvarande underhall: ~4-8 timmar/manad → sparar 2-6 timmar
→ Core lonar sig OM underhallet ar >1 timme/manad (troligt)
→ MEN nuvarande underhall ar ~2-4h/man, varav 1-2h ar ads-API:er som EJ ar live
→ Faktiskt underhall idag: ~1-2h/man (bara GSC + Lambda)
→ Break-even nas inte forran ads-integrationerna ar live
```

---

## Beslutsmatris

### Nar ska Supermetrics anvandas vs egenutvecklad kod?

| Kriterium | Favoriserar Supermetrics | Favoriserar egenutvecklad |
|-----------|------------------------|--------------------------|
| **Antal datakallor** | 4+ plattformar | 1-2 plattformar |
| **OAuth-komplexitet** | Hog (tokens som expires) | Lag (API-nycklar/SA) |
| **Historisk data** | Viktig for trender | Live-data racker |
| **Antal kunder** | 25+ | <25 |
| **Utvecklar-resurser** | Begransade | Tillgangliga (Claude Code) |
| **Budget** | >2000 kr/man i verktyg | <1000 kr/man |
| **API-stabilltet** | Instabila API:er (Meta) | Stabila (GSC, GA4) |
| **Krav pa realtid** | Inte kritiskt | Kunder forvantar realtid |
| **Nya plattformar** | Ofta nya kanaler | Fasta kanaler |

### Scoreboard for Searchboost (feb 2026)

| Kriterium | Score Supermetrics (1-5) | Score Egenutvecklad (1-5) | Vikt |
|-----------|------------------------|--------------------------|------|
| Kostnad | 2 | 5 | 30% |
| Underhall | 4 | 3 | 20% |
| Funktionalitet | 4 | 4 | 15% |
| Realtid | 2 | 5 | 10% |
| Skalbarhet | 5 | 3 | 10% |
| Flexibilitet | 3 | 5 | 10% |
| Tidsbesparning | 4 | 2 | 5% |
| **VIKTAT SNITT** | **3.05** | **3.95** | 100% |

**Egenutvecklad kod vinner for nuvarande storlek.**

---

## Rekommenderad plan

### Fas 0: NU (feb 2026) — Optimera befintlig losning

**Kostnad**: $0 | **Tid**: 4-8 timmar

1. **Bygg historik-tabeller i BigQuery** (sparar daglig GSC/GA4-data via Lambda)
2. **Aktivera befintliga ads-integrationer** for forsta kunden med annonsering
3. **Lata Lambda: daily-snapshot spara data** till BigQuery for trendgrafer i kundportalen

```sql
-- Ny tabell: daily_kpi_snapshot (fylls av Lambda)
CREATE TABLE seo_data.daily_kpi_snapshot (
  snapshot_date DATE,
  customer_id STRING,
  source STRING,          -- 'gsc', 'ga4', 'google_ads', 'meta_ads'
  clicks INT64,
  impressions INT64,
  avg_position FLOAT64,
  sessions INT64,
  conversions INT64,
  spend FLOAT64,
  top10_keywords INT64,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);
```

### Fas 1: Nar 3+ kunder har aktiv annonsering — Evaluera Supermetrics

**Kostnad**: $199/man (Core) | **Tid**: 8-12 timmar setup

1. **Registrera Supermetrics-konto** (Core for BigQuery)
2. **Koppla Google Ads + Meta Ads connectors** for alla annonserande kunder
3. **Behall GSC/GA4 som egenutvecklad** (stabil, gratis, realtid)
4. **Migrera ads-endpointsen** att lasa fran BigQuery istallet for live API

### Fas 2: Nar 25+ kunder — Full Supermetrics

**Kostnad**: $319/man (Super) | **Tid**: 16-24 timmar migration

1. **Uppgradera till Super** (alla connectors)
2. **Migrera GSC + GA4** till Supermetrics (underhallsbesparing motiverar kostnaden)
3. **Bygg Looker Studio templates** for premium-kunder
4. **Avveckla custom API-kod** for ads-plattformar

### Tidslinje

```
2026 Q1 (nu)     │ Fas 0: Optimera befintlig losning
                  │ • Historik-tabeller i BigQuery
                  │ • Daglig snapshot Lambda
                  │
2026 Q2-Q3       │ Vanta: Bygg kundbas, aktivera annonsering
                  │ • Onboarda fler annonseringskunder
                  │ • Tracka underhallstid for custom-kod
                  │
2026 Q3-Q4       │ Fas 1: Supermetrics Core (nar 3+ ads-kunder)
(om relevant)    │ • Google Ads + Meta Ads connectors
                  │ • Behall GSC/GA4 som custom
                  │
2027 Q1+          │ Fas 2: Full Supermetrics (nar 25+ kunder)
(om relevant)    │ • Alla connectors
                  │ • Looker Studio premium-rapporter
```

---

## Steg-for-steg setup-guide

### Nar ni bestammer er for Supermetrics (Fas 1)

#### Steg 1: Registrering och plan

1. Ga till supermetrics.com/start-trial
2. Valj "BigQuery" som destination
3. Valj "Core" plan ($199/man)
4. Registrera med `mikael@searchboost.se`

#### Steg 2: BigQuery-anslutning

1. I Supermetrics-dashboarden, ga till Settings → Destinations
2. Lagg till BigQuery-destination:
   - GCP Project: `searchboost-485810`
   - Dataset: `seo_data` (samma som befintlig)
   - Autentisering: Service Account JSON (samma som Lambda anvander)
   - Hämta SA-nyckeln: `aws ssm get-parameter --name /seo-mcp/bigquery/credentials --with-decryption --region eu-north-1 --profile "mickedanne@gmail.com"`

#### Steg 3: Konfigurera connectors

**Google Ads connector:**
1. Lagg till Google Ads som datakalla
2. OAuth-login med Mikaels Google-konto
3. Valj alla kundernas Google Ads-konton
4. Konfiguration:
   - Schema: Campaign Performance
   - Granularitet: Daglig
   - Metrics: Clicks, Impressions, Cost, Conversions, CPC, CTR
   - Dimensions: Campaign, Ad Group, Keyword, Date
   - BigQuery-tabell: `sm_google_ads`
   - Uppdatering: Var 6:e timme
   - Historik: 90 dagar bakåt

**Meta Ads connector:**
1. Lagg till Meta Ads (Facebook) som datakalla
2. Login med Facebook Business Manager-konto
3. Valj alla kundernas ad-konton
4. Konfiguration:
   - Schema: Campaign Insights
   - Granularitet: Daglig
   - Metrics: Impressions, Reach, Clicks, Spend, CTR, CPC, CPM, Conversions
   - Dimensions: Campaign, Ad Set, Ad, Date
   - BigQuery-tabell: `sm_meta_ads`
   - Uppdatering: Var 6:e timme

**LinkedIn Ads connector (om relevant):**
1. Lagg till LinkedIn Ads som datakalla
2. OAuth-login med LinkedIn-konto
3. Konfiguration liknande ovan

#### Steg 4: Kund-ID-mapping

Supermetrics lagrar data med plattformens egna konto-ID:er. For att koppla till Searchboost-kunder behovs en mapping-tabell:

```sql
-- Skapa manuellt eller via API
CREATE TABLE seo_data.customer_platform_mapping (
  customer_id STRING,           -- Searchboost kund-ID
  platform STRING,              -- 'google_ads', 'meta_ads', etc
  platform_account_id STRING,   -- Plattformens konto-ID
  display_name STRING,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP()
);

-- Fyll i:
INSERT INTO seo_data.customer_platform_mapping VALUES
('mobelrondellen', 'google_ads', '123-456-7890', 'Mobelrondellen AB', CURRENT_TIMESTAMP()),
('mobelrondellen', 'meta_ads', 'act_1234567890', 'Mobelrondellen AB', CURRENT_TIMESTAMP());
```

#### Steg 5: Uppdatera Express.js-endpoints

Andra ads-endpointsen att lasa fran BigQuery istallet for live API:

```javascript
// I mcp-server-code/index.js, ersatt live API-anrop med BigQuery-query

app.get('/api/customers/:id/ads', async (req, res) => {
  const customerId = req.params.id;

  // Hamta fran Supermetrics-tabeller i BigQuery
  const [googleAds] = await bq.query({
    query: `
      SELECT date, campaign_name, impressions, clicks, cost, conversions
      FROM \`${dataset}.sm_google_ads\` g
      JOIN \`${dataset}.customer_platform_mapping\` m
        ON g.account = m.platform_account_id
        AND m.platform = 'google_ads'
      WHERE m.customer_id = @customerId
        AND date >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
      ORDER BY date DESC, cost DESC
    `,
    params: { customerId }
  });

  // ... liknande for meta_ads, linkedin_ads

  res.json({ google_ads: googleAds, /* ... */ });
});
```

#### Steg 6: Verifiera

1. Vanta pa forsta Supermetrics-synken (~15 min for initialt pull)
2. Kontrollera BigQuery-tabellerna via GCP Console
3. Testa dashboard-endpointsen
4. Jamfor data med plattformarnas egna dashboards

---

## Risker och begransningar

### Supermetrics-specifika risker

| Risk | Sannolikhet | Konsekvens | Mitigation |
|------|------------|-----------|------------|
| Prishoining | Medel | Budgetoverskridande | Arlig betalning lasar pris |
| Connector-avbrott | Lag | Data-gap i rapporter | Fallback till custom kod |
| Schema-andringar | Lag | Trasiga BigQuery-querys | Versionera SQL-vyer |
| Rate limit | Lag | Forsenad data | Supermetrics hanterar |
| GDPR-komplikation | Lag | Data lagras hos Supermetrics (EU) | Supermetrics ar EU-baserat (Finland) |

### Befintlig losning — risker

| Risk | Sannolikhet | Konsekvens | Mitigation |
|------|------------|-----------|------------|
| Meta API deprecation | Medel | Ads-integration slutar fungera | Snabb uppdatering |
| OAuth token expiry | Hog (var 60d Meta) | Ingen data tills fornyat | Automatisk refresh-flow |
| Google Ads API version | Medel (arlig) | Behover uppdatera GAQL | Claude kan uppdatera |
| Utvecklarberoende | Medel | Bara Claude/Mikael kan fixa | Dokumenterad kod |

---

## Slutsats

### Huvudrekommendation

**For Searchboost med 10 kunder i februari 2026: Behall den egenutvecklade losningen.**

Supermetrics ar en utmarkt produkt for byraer med 25+ kunder och komplex multi-channel-rapportering. For Searchboosts nuvarande storlek ar det:

1. **2-3x dyrare** an befintlig losning ($200-400/man vs $60-120/man)
2. **Redundant** for SEO-data (GSC/GA4 ar gratis och redan implementerat)
3. **Prematurt** for annonsdata (inga kunder har aktiv annonsering konfigurerad)

### Nar ska ni omprovera?

Trigga en ny evaluering nar **nagot av foljande intraffar**:

- 3+ kunder har aktiv Google Ads ELLER Meta Ads (Supermetrics for ads-data)
- Underhall av custom API-kod overstiger 8 timmar/manad
- Kundbas vaxer till 25+ aktiva kunder
- Ny plattform (Pinterest, Snapchat, Amazon Ads) behovs for en kund
- Meta/LinkedIn andrar API sa att token-hantering blir ohanterlig

### Alternativ investering

Istallet for $200-400/man pa Supermetrics, investera i:

1. **Daglig snapshot Lambda** ($0) — Sparar historisk data for trendgrafer
2. **Looker Studio-template** ($0 for Looker Studio, gratisversion) — Premium-rapport till kunder
3. **n8n-migrering** ($0 self-hosted) — Ersatt Lambda med visuella workflows
4. **Fler Anthropic credits** ($20/man) — Battre AI-genererade rapporter och innehall

**Total alternativ investering: ~$20/man** istallet for $200-400/man — med battre resultat for nuvarande kundbas.

---

## Appendix A: Supermetrics connector-lista (relevanta)

| Connector | Typ | Nodvandig for Searchboost | Prioritet |
|-----------|-----|--------------------------|-----------|
| Google Search Console | SEO | Ja (men redan byggt) | Lag |
| Google Analytics 4 | Web Analytics | Ja (men redan byggt) | Lag |
| Google Ads | PPC | Ja (nar kunder annonserar) | Medel |
| Facebook Ads | Social Ads | Ja (nar kunder annonserar) | Medel |
| LinkedIn Ads | B2B Ads | Kanske (nischkunder) | Lag |
| TikTok Ads | Social Ads | Kanske (framtid) | Lag |
| Google Business Profile | Lokal SEO | Intressant tillagg | Medel |
| Ahrefs/SEMrush | SEO Tools | Ersatter SE Ranking | Hog |
| HubSpot/Pipedrive | CRM | Pipeline-data | Lag |

## Appendix B: Supermetrics prisreferens

Priser baserade pa offentlig prissattning per maj 2025. Verifiera aktuella priser pa supermetrics.com/pricing innan kop.

- Essential (BigQuery): ~$79/man (arlig)
- Core (BigQuery): ~$159/man (arlig), ~$199/man (manatlig)
- Super (BigQuery): ~$319/man (arlig), ~$399/man (manatlig)
- Looker Studio Essential: ~$59/man
- Looker Studio Core: ~$119/man

---

*Denna plan ar ett levande dokument. Uppdatera nar forutsattningarna andras.*
