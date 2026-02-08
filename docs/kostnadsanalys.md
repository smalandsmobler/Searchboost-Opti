# Kostnadsanalys — Searchboost Opti

> Senast uppdaterad: 2026-02-08

## Sammanfattning

| Kategori | Kostnad/mån (SEK) | Kostnad/år (SEK) |
|----------|-------------------:|------------------:|
| AWS-infrastruktur (EC2, Lambda, SSM, SES) | 80–100 | 960–1 200 |
| Google Cloud (BigQuery, GSC API) | 0 | 0 |
| AI-tjänster (Claude/Anthropic) | 150–200 | 1 800–2 400 |
| Externa tjänster (Trello, SE Ranking) | 0–1 500 | 0–18 000 |
| Domän & DNS | ~15 | ~180 |
| **Total (löpande, 10 kunder)** | **~245–1 815** | **~2 940–21 780** |

**Kostnad per kund:** ~20–30 kr/mån (vid 10 kunder, exkl. SE Ranking)

---

## 1. AWS-infrastruktur

### EC2 Instance
| Parameter | Värde |
|-----------|-------|
| Instanstyp | t3.micro (2 vCPU, 1 GB RAM) |
| Region | eu-north-1 (Stockholm) |
| Instans-ID | i-0c36714c9c343698d |
| IP | 51.21.116.7 |
| Kostnad | ~$8–10/mån (~80–100 SEK) |
| Free Tier | Gratis första 12 månaderna (750h/mån t2/t3.micro) |

EC2 kör MCP-servern (Express.js) 24/7 via PM2 med Nginx som reverse proxy.

### Lambda Functions (3 st)
| Funktion | Trigger | Körningar/mån | Minne |
|----------|---------|:-------------:|------:|
| seo-weekly-audit | Måndag 06:00 UTC | ~4 | 512 MB |
| seo-autonomous-optimizer | Var 6:e timme | ~120 | 512 MB |
| seo-weekly-report | Måndag 08:00 UTC | ~4 | 512 MB |

- **Free Tier:** 1 miljon requests + 400 000 GB-sekunder/mån
- **Faktisk användning:** ~128 körningar/mån = 0 kr
- **Kostnad: 0 kr**

### SSM Parameter Store
- ~40 parametrar (credentials, config per kund)
- Standard parameters (ej advanced)
- **Kostnad: 0 kr** (standard parameters är gratis)

### SES (Simple Email Service)
- Användning: Veckorapporter (~4 emails/mån) + onboarding-bekräftelser
- **Kostnad:** $0.10 per 1 000 emails = **<1 kr/mån**

### CloudWatch Logs
- Lambda-loggar + EC2-loggar
- **Free Tier:** 5 GB ingest, 5 GB arkiv
- **Kostnad: 0 kr** (inom Free Tier)

---

## 2. Google Cloud Platform

### BigQuery
| Parameter | Värde |
|-----------|-------|
| Projekt | searchboost-485810 |
| Dataset | seo_data |
| Tabeller | 6 st |
| Uppskattad datamängd | <500 MB (10 kunder, 3 mån) |
| Free Tier | 10 GB lagring + 1 TB queries/mån |

Tabeller: `seo_optimization_log`, `seo_work_queue`, `weekly_reports`, `customer_pipeline`, `customer_keywords`, `action_plans`

- **Kostnad: 0 kr** (långt inom Free Tier)

### Google Search Console API
- Gratis API, ingen kostnad
- Kräver service account med tillgång per kund-property
- SA: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
- **Kostnad: 0 kr**

---

## 3. AI-tjänster

### Anthropic Claude AI
| Modell | Användning | Tokens/mån |
|--------|-----------|----------:|
| claude-sonnet-4-5-20250929 | Autonomous optimizer | ~2M input + 400K output |
| claude-sonnet-4-5-20250929 | Manuella optimeringar | ~500K input + 100K output |

| Prismodell | Kostnad |
|-----------|--------:|
| Input tokens ($3/1M) | ~$7.50/mån |
| Output tokens ($15/1M) | ~$7.50/mån |
| **Total** | **~$15/mån (~150–200 SEK)** |

**Optimeringsmöjligheter:**
- Prompt caching: 50% rabatt på cachade tokens
- Claude Haiku för enklare uppgifter: ~90% billigare
- Batch-körning av liknande optimeringar

---

## 4. Externa tjänster

### Trello
- Free tier (obegränsade boards, 10 boards per workspace)
- **Kostnad: 0 kr**
- **Status:** Credentials behöver uppdateras (401-fel)

### SE Ranking
- Separat prenumeration (ej inkluderat i plattformskostnaden)
- API-addon krävs för programmatisk åtkomst
- **Kostnad:** Enligt SE Ranking-abonnemang (~500–1 500 kr/mån)
- **Status:** API-nyckel ogiltig (403-fel). Systemet använder GSC istället tills vidare.

---

## 5. Övriga kostnader

| Post | Kostnad |
|------|--------:|
| Domännamn (.se) | ~150 SEK/år |
| SSL-certifikat | 0 SEK (self-signed / Let's Encrypt) |
| GitHub repo (private) | 0 SEK (Free tier) |

---

## Skalningsanalys

### Vid 50 kunder (5x nuvarande)

| Tjänst | Kostnad/mån |
|--------|------------:|
| EC2 t3.micro | 80–100 kr (räcker fortfarande) |
| Lambda | 0 kr (fortfarande Free Tier) |
| BigQuery | 0 kr (~2 GB, fortfarande Free Tier) |
| Claude AI | ~750–1 000 kr (5x tokens) |
| **Total** | **~830–1 100 kr/mån** |
| **Per kund** | **~17–22 kr/mån** |

### Vid 100 kunder (10x nuvarande)

| Tjänst | Kostnad/mån |
|--------|------------:|
| EC2 t3.small (uppgradering) | ~160 kr |
| Lambda | 0 kr |
| BigQuery | 0 kr (~5 GB) |
| Claude AI | ~1 500–2 000 kr (10x tokens) |
| **Total** | **~1 660–2 160 kr/mån** |
| **Per kund** | **~17–22 kr/mån** |

### Vid 500 kunder

| Tjänst | Kostnad/mån |
|--------|------------:|
| EC2 t3.medium | ~320 kr |
| Lambda | ~50 kr (6 000 körningar/mån) |
| BigQuery | ~100 kr (~25 GB) |
| Claude AI | ~7 500–10 000 kr |
| **Total** | **~8 000–10 500 kr/mån** |
| **Per kund** | **~16–21 kr/mån** |

---

## Jämförelse: Plattformskostnad vs manuellt SEO

| | Manuellt | Searchboost Opti |
|--|---------|-----------------|
| SEO-konsulttimme | 800–1 200 kr/h | — |
| Tid per kund/månad | ~8–15h | ~1–2h (övervakning) |
| Kostnad per kund/mån | 6 400–18 000 kr | ~20–30 kr |
| **Besparingsfaktor** | — | **~300–600x** |

Systemkostnaden (~20 kr/kund/mån) är försumbar jämfört med intäkten per kund (5 000–15 000+ kr/mån).

---

## Kostnadsbesparingstips

1. **EC2 Reserved Instance:** 33% rabatt vid 1-års commitment
2. **EC2 Savings Plan:** Ytterligare 10–15% rabatt
3. **Claude Prompt Caching:** 50% rabatt på upprepade prompts
4. **Claude Haiku:** Använd för enklare uppgifter (metadata-analys) — 90% billigare
5. **BigQuery:** Partitionera tabeller per datum för billigare queries vid stor datamängd
6. **Lambda:** Inga optimeringar behövs (väl inom Free Tier)
