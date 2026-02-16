# Searchboost Opti — Komplett Briefing 2026-02-14

> Hela bilden. Alla projekt, all kod, alla kunder, allt som ar gjort, allt som aterstar.
> Uppdaterad: 14 februari 2026

---

## DEL 1: ALLA KUNDPROJEKT — STATUS

### 1. Smalands Kontorsmobler (SMK) — 42 000 kr (6 man x 7 000 kr)

**Status: AKTIV — WooCommerce-migrering i full gang**

| Delmoment | Status | Detaljer |
|-----------|--------|----------|
| WP-sajt (ny.smk.se) | LIVE | GeneratePress + WooCommerce, Loopia FTP |
| Produkter importerade | 896/896 | Alla importerade, ~3700 saknar bilder |
| Bilder | PAGAR | smk-img2.php kor batchar, 42 807 totalt |
| Kategoritexter SEO | 46/47 KLART | mu-plugin smk-seo-text.php |
| Bloggartiklar | 4/4 PUBLICERADE | ID 10861-10864, "Guider"-kategori |
| Logo + Header | KLART | Militar gron #566754, svart_alg.png |
| CSS | KLART | ~16KB i Customizer (unified v6) |
| Rank Math PRO | EJ AKTIVERAD | Behover Pro-licens for full funktionalitet |
| Betalning | VANTAR PA KUND | Swedbank Pay kraver kundatgard |
| BabyLoveGrowth | JUST KOPPLAT | Plugin installerat, webhook verified, forsta artikel vantas |
| llm.txt + robots.txt | LIVE | AI-crawlers tillatna |
| Domanbytet | PLANERAT | ny.smk.se -> smk.se, search-replace + 301 redirects |

**Nasta steg SMK:**
1. Fixa BLG CTA-lank (andras till ny.smk.se)
2. Verifiera att BLG-artiklar borjar publiceras
3. Bilder — fortsatt batch-korning
4. Swedbank Pay — vanta pa kund
5. Rank Math PRO — kop licens
6. Domanbytet — planera tidpunkt

---

### 2. Kompetensutveckla — 47 000 kr (arsvarde)

**Status: VANTAR PA KUND — webhotell-access + EduAdmin API**

| Delmoment | Status | Detaljer |
|-----------|--------|----------|
| SEO-rapport | KLAR | GSC: 52 klick/28d, 42/50 keywords top 10 |
| Redirects-lista | KLAR | 142 trasiga URLs kartlagda, .htaccess fix |
| Strukturforslag | KLAR | WooCommerce-kurshantering istallet for EduAdmin |
| Implementeringsguide | KLAR | 35 800 ord, komplett plan |
| cPanel-access | HAR | hjaltebyran-srv01.oderland.com |
| Disk | FRIGJORD | Raderade kompetens.hemsida.eu (950 MB), nu ~12 GB fritt |
| Nyckelord | 42/50 top 10 | Bra utgangslage |
| GSC | KOPPLAD | SA tillagd som "Fullstandig" |

**Nasta steg Kompetensutveckla:**
1. Vanta pa webhotell-access fran kund
2. Vanta pa EduAdmin API-nyckel
3. SEO-arbete kan goras NU (meta-titlar, redirects, kategorier)

---

### 3. Mobelrondellen — BETALANDE KUND

**Status: AKTIV — automatisk optimering igangsatt**

| Delmoment | Status | Detaljer |
|-----------|--------|----------|
| Plugin-cleanup | KLART | 325 -> 7 plugins |
| Kontaktsida CF7 | KLART | Honeypot borttagen |
| Varumarken-sida | KLART | HTML-grid av 18 varumarken |
| ABC-nyckelord | KLART | Via dashboard |
| Atgardsplan | KLART | 3 manader |
| Mail till kund | SKICKAT | Plugin-cleanup, spam-rensning |
| Sucuri WAF | OBS | HTTP 455 vid curl, renderar OK i browser |
| Automatisk optimering | AKTIVERAD | Lambda kor var 6:e timme |

**Nasta steg Mobelrondellen:**
1. Verifiera att auto-optimering fungerar
2. Leverera veckorapporter

---

### 4. Ilmonte — PROSPECT

**Status: ABC-nyckelord inlagda, vantar pa vidare arbete**

| Delmoment | Status | Detaljer |
|-----------|--------|----------|
| ABC-nyckelord | KLART | 9A + 14B + 7C = 30 st |
| GSC | PROBLEM | searchboost.web inte agare, be ilmonte-agaren lagga till SA |
| WP-credentials | PLACEHOLDER | Inte aktiverad for auto-optimering |

---

### 5. PhVast — REGISTRERAD

| Delmoment | Status |
|-----------|--------|
| GSC | KOPPLAD |
| WP-credentials | PLACEHOLDER |
| Nyckelord | EJ INLAGDA |

---

### 6. Tobler — REGISTRERAD

| Delmoment | Status |
|-----------|--------|
| GSC | EJ I GSC |
| WP-credentials | PLACEHOLDER |
| Nyckelord | EJ INLAGDA |

---

### 7. Traficator — REGISTRERAD

| Delmoment | Status |
|-----------|--------|
| GSC | EJ I GSC |
| WP-credentials | PLACEHOLDER |

---

### 8. Wedosigns — REGISTRERAD

| Delmoment | Status |
|-----------|--------|
| GSC | EJ I GSC |
| WP-credentials | PLACEHOLDER |

---

### 9. Ferox Konsult — 20 000 kr (planerat)

**Status: EJ PABORJAD — Hemsida24 -> Shopify-migrering**

| Delmoment | Status |
|-----------|--------|
| GSC | EJ I GSC |
| WP-credentials | PLACEHOLDER |
| Plan | Hemsida24 -> Shopify, SEO-migrering |

---

### 10. Nordic Snus Online — 8 000 kr/man (Premium)

**Status: MOTE KLART — vantar pa beslut**

| Delmoment | Status | Detaljer |
|-----------|--------|----------|
| Meeting | KLART | 13 feb kl 12 |
| Briefing-doc | KLAR | docs/briefing-ai-search-produktfeed-2026.md |
| Rapport | KLAR | content-pages/nordicsnusonline-rapport-tobak-google.md |
| Offert | SKICKAD | 8-12k/man, 6-manaders kontrakt |
| Vinkel | AI Search Dominance | Snus kan inte anvanda Google Ads/Meta → AI search ar kanalen |

---

## DEL 2: SEARCHBOOST.NU — EGET VARUMARKE

### Hemsida-innehall (content-pages/)

| Kategori | Antal | Filer |
|----------|-------|-------|
| **SEO-skolan** | 25 artiklar | vad-ar-seo, lankbygge, wordpress-seo, teknisk-seo, etc. |
| **Lokala sidor** | 7 st | seo-byra-jonkoping, -vaxjo, -kalmar, -linkoping, -norrkoping, -varnamo, -halmstad |
| **Tjanstesidor** | 3 st | seo-audit-tjanst, e-handel-seo, lokal-seo |
| **Case studies** | 3 st | ehandel-kontorsmobler, konsultforetag-seo, mobelforetag-smaland |
| **FAQ** | 1 st | vanliga-fragor |
| **Ordlista** | 1 st | seo-ordlista |
| **Bloggar (SMK)** | 4 st | kontorsstol-guide, hoj-sankbart, smaforetag, ergonomi |
| **Mail-templates** | 4 st | veckologg, manadsrapport, introduktionsmail, kompetensutveckla-fasplan |
| **Totalt** | **50 HTML + 9 MD** | Redo for WordPress-publicering |

### Domanstrategi
- `searchboost.nu` — WordPress pa Loopia (Mikaels doman)
- `opti.searchboost.nu` — Dashboard pa EC2 (51.21.116.7)
- `searchboost.se` — Viktor ager, ghostar just nu
- 41 hardkodade .se-referenser i 17 filer — behover bli konfigurerbara

---

## DEL 3: KODBAS — SIFFROR

### Huvudfiler (12 959 rader)
| Fil | Rader | Beskrivning |
|-----|-------|-------------|
| `mcp-server-code/index.js` | 4 240 | Express-server, 30+ API-endpoints |
| `dashboard/app.js` | 2 594 | Dashboard frontend-logik |
| `dashboard/style.css` | 2 405 | Dashboard styling |
| `dashboard/portal.css` | 1 158 | Kundportal styling |
| `dashboard/index.html` | 644 | Dashboard HTML |
| `dashboard/portal.js` | 617 | Kundportal logik |
| `mcp-server-code/report-exporter.js` | 549 | PDF/PPTX-generator (Marp) |
| `mcp-server-code/portal-auth.js` | 360 | JWT-auth for kundportal |
| `mcp-server-code/presentation-generator.js` | 252 | Reveal.js-generator |
| `dashboard/portal.html` | 140 | Kundportal HTML |

### Integrationer (1 714 rader)
| Fil | Rader | Beskrivning |
|-----|-------|-------------|
| `integrations/meta-ads.js` | 403 | Meta Marketing API v21.0 |
| `integrations/google-ads.js` | 391 | Google Ads REST API v17 |
| `integrations/tiktok-ads.js` | 381 | TikTok Marketing API v1.3 |
| `integrations/linkedin-ads.js` | 321 | LinkedIn Marketing API v2 |
| `integrations/index.js` | 218 | Aggregator |

### Lambda-funktioner (3 310 rader)
| Fil | Rader | Status |
|-----|-------|--------|
| `prospect-analyzer.js` | 763 | Byggt, ej aktiverad |
| `weekly-report.js` | 552 | LIVE, kör mån 08:00 |
| `content-publisher.js` | 439 | Byggt, ej deployad |
| `keyword-researcher.js` | 392 | Byggt, ej deployad |
| `backlink-monitor.js` | 327 | Byggt, ej deployad |
| `autonomous-optimizer.js` | 318 | LIVE, kör var 6:e timme |
| `performance-monitor.js` | 309 | Byggt, ej deployad |
| `weekly-audit.js` | 210 | LIVE, kör mån 06:00 |

### Konfig + Docs
| Fil | Rader | Beskrivning |
|-----|-------|-------------|
| `config/gtm-template.json` | 350 | GTM container-mall |
| `docs/plan-n8n-migration.md` | 935 | Lambda -> n8n plan |
| `CLAUDE.md` | ~450 | Systemdokumentation |

### TOTALT KODBAS
- **Kod**: ~18 000 rader (server + dashboard + integrations + lambda)
- **Content**: ~50 HTML + 9 MD = ~25 000 ord
- **Docs**: ~6 filer, ~3 000 rader
- **Presentations**: ~10 filer + templates

---

## DEL 4: GIT STATUS — VAD AR COMMITTAT?

### Andrade (staged) — 10 filer
Dessa ar andrade jämfort med senaste commit:
- README.md, app.js, index.html, style.css, index.js, package.json
- anvandarmanual.md, forutsattningar.md
- 3 lambda-funktioner

### Nya (untracked) — ~30 filer
Dessa har ALDRIG committats:
- CLAUDE.md
- Hela config/ (gtm-template)
- Hela content-pages/ (50 filer)
- portal-filerna (portal.html/js/css)
- Alla integrationsfiler
- Alla nya lambda-filer (5 st)
- Alla nya docs (babylovegrowth, n8n-plan, viktor-guide)
- portal-auth.js, report-exporter.js, pdf-report-generator.js

**VIKTIGT: Behover committas + pushas fore nasta deploy!**

---

## DEL 5: INFRASTRUKTUR — VAD KOR VAR?

### EC2 (LIVE — 51.21.116.7)
- Express-server (PM2 `seo-mcp`)
- Dashboard + Portal
- Presentationssystem
- **INTE uppdaterad med**: portal-auth, integrations, report-exporter, touchpoints, ads-endpoints, nya portal-filer

### Lambda (LIVE — 3 av 8)
| Lambda | Status | Schema |
|--------|--------|--------|
| weekly-audit | LIVE | Mandag 06:00 |
| autonomous-optimizer | LIVE | Var 6:e timme |
| weekly-report | LIVE | Mandag 08:00 |
| prospect-analyzer | BYGGT | Ej schemalagd |
| content-publisher | BYGGT | Ej schemalagd |
| keyword-researcher | BYGGT | Ej schemalagd |
| backlink-monitor | BYGGT | Ej schemalagd |
| performance-monitor | BYGGT | Ej schemalagd |

### BigQuery (6 tabeller)
customer_pipeline, customer_keywords, action_plans, seo_work_queue, seo_optimization_log, weekly_reports
+ customer_users (ny, for portal)

### Tredjepartstjanster
| Tjanst | Status | Kostnad |
|--------|--------|---------|
| AWS (EC2 + Lambda + SSM + SES) | LIVE | ~$15/man |
| Anthropic (Claude API) | LIVE | $20 credits (fylldes 11 feb) |
| GCP/BigQuery | LIVE | Gratis tier |
| SE Ranking | LIVE | ~441k credits kvar, expires 20 feb! |
| BabyLoveGrowth (SMK) | LIVE | $79.20/man, nasta 28 feb |
| Loopia (SMK) | LIVE | Ingår i SMK-deal |
| Trello | LIVE | Gratis |

---

## DEL 6: EKONOMI — OVERSIKT

### Kundintakter (manatlig)
| Kund | MRR | Status |
|------|-----|--------|
| SMK | 7 000 kr | Aktiv (6 man kontrakt) |
| Mobelrondellen | ? | Betalande |
| Kompetensutveckla | ~3 900 kr | Vantar pa start |
| Nordic Snus Online | 8 000 kr | Offert skickad |
| Ferox Konsult | 0 kr | Planerad |
| **Pipeline-varde** | **~18 900 kr+/man** | |

### Kostnader (manatlig)
| Post | Kostnad |
|------|---------|
| AWS | ~150 kr |
| Anthropic | ~200 kr |
| BabyLoveGrowth | ~820 kr |
| SE Ranking | ? (expires snart) |
| **Totalt** | **~1 200 kr** |

---

## DEL 7: PLAN FRAMAT — PRIORITERINGSORDNING

### DENNA VECKA (14-16 feb)
1. **Git commit + push** — Allt som ar byggt MASTE committas
2. **Deploy till EC2** — Portal, integrations, touchpoints, ads, report-exporter
3. **SE Ranking** — Expires 20 feb! Bestam: forlanga eller ersatt med GSC + crawlers
4. **BLG for SMK** — Verifiera att artiklar publiceras, fixa CTA-lank
5. **SMK bilder** — Fortsatt batch-korning

### NASTA VECKA (17-21 feb)
6. **n8n-migrering** — Byt ut Lambda -> n8n (gratis, battre UX)
7. **Aktivera fler kunder** — WP app-passwords for PhVast, Tobler, Traficator
8. **Google Ads-kompetens** — Studera briefing-dokumentet, ova pa testprojekt
9. **Produktfeed-strategi** — Bestam verktyg (Channable/DataFeedWatch/native)

### MANADEN UT (feb)
10. **SMK domanbytet** — ny.smk.se -> smk.se
11. **Searchboost.nu** — Publicera alla 50 content-pages pa WordPress
12. **Nordic Snus Online** — Foljuppmote, stanga deal
13. **Ferox Konsult** — Hemsida24 -> Shopify, paborja

### MARS
14. **Google Ads-erbjudande** — Lansera som tjanst for kunder
15. **Kundportal LIVE** — Portal for alla betalande kunder
16. **Automatisera allt** — n8n-workflows for hela kedjan

---

## DEL 8: VAD SOM AR BYGGT MEN INTE DEPLOYAT

Stor skillnad mellan vad som finns lokalt och vad som kör pa EC2:

### Lokalt men EJ pa EC2
| Komponent | Rader | Redo att deploya? |
|-----------|-------|-------------------|
| Kundportal (portal.html/js/css + auth) | 2 275 | JA |
| Touchpoints + AI Chat | ~200 | JA |
| Ads Dashboard | ~300 | JA (men saknar credentials for plattformarna) |
| Report Exporter (PDF/PPTX) | 549 | JA (behover npm install marp-core) |
| Integrations (4 ads-plattformar) | 1 714 | JA (men saknar OAuth tokens) |
| 5 nya Lambda-funktioner | ~2 230 | NEJ (behover mer testning) |
| GTM Container Template | 350 | N/A (config-fil, inte server-kod) |

---

## DEL 9: TEKNISKA SKULDER / KANDA PROBLEM

| Problem | Prioritet | Losning |
|---------|-----------|---------|
| 41 hardkodade .se-referenser | MEDEL | Byt till env-variabel DOMAIN |
| index.js ar 4240 rader | LAG | Splitta i moduler (routes/, services/) |
| API-nyckel hardkodad i app.js | LAG | Flytta till env/SSM |
| Portal saknar "glomt losenord"-flow | LAG | Implementera e-post-reset |
| SE Ranking expires 20 feb | HOG | Forlanga eller migrera |
| Ingen backup-strategi | MEDEL | Satt upp automatiska BigQuery-exports |
| Lambda-funktioner saknar error-alerting | MEDEL | SNS/Slack vid fel |
| Dashboard saknar loading states | LAG | UX-forbattring |
| Inga automatiska tester | LAG | Jest for API-endpoints |
| EC2 t3.micro kan bli for liten | LAG | Uppgradera vid behov |

---

## DEL 10: TEAM OCH ARBETSFORDELNING

### Mikael Larsson (Saljare)
- Kundemoten, offertskrivning, pipeline-hantering
- Anvander dashboarden dagligen
- Gor INTE deploy eller kodandringar
- Behover lara sig: Google Ads, ROAS, produktfeed

### Viktor Duner (Tekniker)
- All utveckling, deploy, infrastruktur, debugging
- Ansvarig for alla kodandringar
- Deployer till EC2 och Lambda

### Claude Code
- Primart arbetsverktyg for bada
- Varje session laser CLAUDE.md for full kontext
- Skills + hooks installerade for optimalt workflow

---

## DEL 11: INSTALLERADE VERKTYG OCH SKILLS

### Claude Code Skills (117 st)
- **Marketing (25)**: seo-audit, copywriting, page-cro, pricing-strategy, etc.
- **AI Research (83)**: RAG, fine-tuning, inference, agents
- **n8n (7)**: workflow-patterns, expression-syntax, validation
- **UI/UX (1)**: 50+ designstilar, 97 fargpaletter
- **Session Restore (1)**: Aterstall kontext

### Hooks
- **notify.py** — macOS-notis + ljud vid klar/behover input
- **php-lint.sh** — Blockerar felaktig PHP-kod

### Slash Commands (20 st)
- /analyze_code, /codebase_xray, /sprint_management, etc.

### Skills som SAKNAS (att undersoka)
- Google Ads / PPC management
- WooCommerce development
- Product feed optimization
- AWS deployment automation
- WordPress plugin development

(Separat agent researchar detta — resultat kommer i `docs/skills-att-installera.md`)

---

## BILAGA: FILSTRUKTUR

```
Searchboost-Opti/
├── CLAUDE.md                          # Systembeskrivning (450 rader)
├── README.md                          # Projekt-readme
├── config/
│   └── gtm-template.json             # GTM container-mall
├── content-pages/                     # Searchboost.nu-innehall
│   ├── case-studies/ (3 st)
│   ├── faq/ (1 st)
│   ├── lokala/ (7 st)
│   ├── ordlista/ (1 st)
│   ├── seo-skola/ (25 st)
│   ├── tjanster/ (3 st)
│   └── *.md (9 st — bloggar, mail, rapporter)
├── dashboard/
│   ├── index.html (644)
│   ├── app.js (2594)
│   ├── style.css (2405)
│   ├── portal.html (140)
│   ├── portal.js (617)
│   ├── portal.css (1158)
│   └── assets/ (ikoner, bilder)
├── docs/
│   ├── briefing-komplett-2026-02-14.md  # DENNA FIL
│   ├── briefing-google-ads-produktfeed-2026.md
│   ├── babylovegrowth-analys-smk.md
│   ├── plan-n8n-migration.md (935)
│   ├── anvandarmanual.md
│   ├── forutsattningar.md
│   ├── kostnadsanalys.md
│   └── viktor-setup-guide.md
├── lambda-functions/
│   ├── autonomous-optimizer.js (318) — LIVE
│   ├── weekly-audit.js (210) — LIVE
│   ├── weekly-report.js (552) — LIVE
│   ├── prospect-analyzer.js (763)
│   ├── content-publisher.js (439)
│   ├── keyword-researcher.js (392)
│   ├── backlink-monitor.js (327)
│   └── performance-monitor.js (309)
├── mail-templates/ (4 st)
├── mcp-server-code/
│   ├── index.js (4240) — HJARTAT
│   ├── portal-auth.js (360)
│   ├── report-exporter.js (549)
│   ├── presentation-generator.js (252)
│   └── integrations/ (5 filer, 1714 rader)
├── presentations/
│   ├── templates/seo-audit.html
│   ├── output/ (4 genererade)
│   └── *.md (10 rapporter/analyser)
└── wordpress-plugin/
    └── searchboost-onboarding/
```
