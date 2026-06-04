# Searchboost Opti — BRAIN

> Operativt nervsystem. Läses vid sessionsstart vid kundarbete/infra-arbete.
> Detaljer lever i MemPalace (wing: searchboost) + kund_{slug}_tasks.md.
> Senast byggd: 2026-06-05 (konvergens av infra-session + optimizer-session).

---

## 0. ÖVERORDNAT DIREKTIV (allt mäts mot detta)

**Hela verksamheten finns för EN sak: lösa kundens problem så de rör sig framåt i trafik och ranking.**

Varje åtgärd, Lambda-körning, artikel och rapport ska kunna besvara: *flyttar detta kundens trafik/ranking?* Om nej → det är sysselsättning, inte värde.

- **Mät utfall, inte aktivitet.** Antal optimeringar i loggen ≠ resultat. Trafik + ranking-rörelse = resultat.
- **Anti-mönster (verifierat 2026-06-05):** 90% av optimizerns skrivningar är kosmetiska Rank Math meta-titlar/descriptions. Det rör sällan ranking utan auktoritet/volym bakom. Sluta räkna sånt som "arbete".
- **Det som belagt flyttar:** answer-first innehåll, topical completeness, long-tail topic clusters, VOLYM (~8 artiklar/mån), teknisk hälsa, intern länkstruktur. Prioritera dessa.
- **Veckoanalysen ska fråga:** vilka åtgärder gav faktisk rörelse i GSC? Skala upp dem. Vilka gav inget? Sluta.

## 0b. STYRPRINCIP (agentic)

```
Kritiskt  → åtgärda direkt, logga i Kanban, notera i veckomail.
Oklart    → kontakta Mikael (mobil via Claude/WhatsApp/Slack). Vänta.
Rutin     → kör schema, logga slutsats i Kanban + MemPalace.
```
- Svenska alltid, ÅÄÖ alltid, inga emojis.
- Perispa för ALL WordPress. ALDRIG Code Snippets på kundsajter.
- SSM för config, BigQuery för data, inga hårdkodade secrets.
- AWS-profil: `mikael`. Deploy direkt utan att fråga.
- weekly-report Lambda: KÖR ALDRIG manuellt utan explicit "kör nu".
- Kanban (`seo_work_queue`) = sanningen för alla åtgärder/slutsatser.
- Commit: "why not what". Push bara när explicit begärt.

---

## 1. KUNDLIVSCYKELN (flödet)

```
PROSPEKT ─► ANALYS ─► KUND ─► ÅTGÄRDSPLAN+NYCKELORD ─► KOPPLING ─► EXEKVERING ─► RAPPORT ─► ANALYS ─► (loop)
```

### 1.1 Prospekt
- `prospect-scanner.py` / `lead-generator.js` → bransch+stad-scan.
- Resultat: `content-pages/prospects/YYYY-MM-DD-bransch-stad.md` + `customer_pipeline` (stage=prospect).
- Output: top-3 att kontakta med kontaktväg + SEO-score.

### 1.2 Analys
- Teknisk audit + konkurrentgap + keyword-möjligheter.
- `prospect-analyzer.js` (manuell) / `weekly-audit.js` (befintliga kunder, mån 06:00 UTC).
- → `seo_optimization_log`, `content_opportunities`.

### 1.3 Kund (onboarding)
- `POST /api/onboard` → SSM-parametrar + `customer_pipeline` (stage=active, budget_tier).
- KOPPLA: GSC (lägg `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com` som Fullständig) + GA4 + GTM.
- Status per kund i `gtm_ga4_status.md`.
- **2026-06-04/05: ALLA kunder har nu GSC+BQ-access.** (searchboost/traficator fixade efter 20:01-körningen, in fr.o.m. 02:01-körningen.)

### 1.4 Åtgärdsplan + nyckelord
- ABC(DEF)-nyckelord: `POST /api/customers/:id/keywords` → `customer_keywords`.
- `keyword-researcher.js` (mån 07:00) genererar clustering.
- ⚠️ LUCKA: clustering kopplas INTE auto till `action_plans` — manuell handoff. (Bör stängas.)
- Åtgärdsplan: `POST /api/customers/:id/action-plan` → `action_plans`, aktiveras månad-för-månad.

### 1.5 Tillval (per budget_tier)
- **Social**: `social-scheduler.js` (var 15 min) → IG/FB/LinkedIn/TikTok. LinkedIn-schema sön/tis/tors. ÅÄÖ-guard i posting.
- **SEM**: `google-ads-optimizer.js` (mån 09:00) — optimerar bud/bidrag. ⚠️ skapar INTE kampanjer.
- **Webbutveckling**: Perispa (WP) / Next.js-deploy (mobelrondellen, tobler, nso → se nextjs_deploy_skill.md).
- **Manuella åtgärder**: loggas via `POST /api/customers/:id/manual-work-log`.

### 1.6 Content blueprint → artiklar
- `content-blueprint-generator.js` (1:a varje mån 07:00) → månadsplan (GSC + ABC + gap).
- `auto-article-generator.js` (ons 07:00) + `content-publisher.js` → publicerar på kundsajt.
- **Strategi (belagt, optimizer-session):** answer-first struktur, long-tail topic clusters, VOLYM (≈8 artiklar/mån för nya kunder). Topical completeness (0.77 korr) slår word count (0.04). AEO ≠ separat disciplin.
- **Ny handler `addAnswerFirstIntro`** (ej deployad): fristående svar ≤60 ord i `<p class="answer-first">`, primärnyckelord i mening 1.
- Publicerade artiklar landar i veckomailet.

### 1.7 Rapportering + analys-loop
```
VECKA:  weekly-audit (mån) ─► exekvering (var 6h) ─► weekly-report (FRE 15:00 CEST / 13:00 UTC)
         ─► veckoanalys: vad gav resultat? ─► uppdaterar action_plans
MÅNAD:  monthly-client-report (1:a 08:00) ─► månadsanalys ─► uppdaterar action_plans
```
- ⚠️ LUCKA: analys→auto-uppdatering av åtgärdsplan finns som DATA men ingen Lambda stänger loopen. (Bör byggas.)

---

## 2. INFRASTRUKTUR

```
EventBridge (cron) ─► Lambda (eu-north-1) ─► BigQuery (seo-aouto:seo_data, EU)
                                           ├► WordPress REST / Perispa MCP
                                           ├► SSM (alla creds)
                                           ├► SES (mail)
                                           └► OpenRouter/Anthropic (AI)
MCP-server (EC2 51.21.116.7) ─► Dashboard + Kundportal + /api/*
MemPalace (kunskap) + Obsidian (visuell vy) + Kanban (seo_work_queue)
```

### 2.1 Hårda prod-fakta
- Optimizer-Lambda: `seo-autonomous-optimizer` (INTE `autonomous-optimizer`), `SAFE_MODE_NO_CONTENT_WRITES=false` (skriver skarpt).
- BQ: projekt `seo-aouto`, dataset `seo_data`, location `EU`. Tabell `gsc_daily_metrics` fylls av `data-collector` (var 6h: 02/08/14/20).
- GSC massdataexport: ANVÄNDS EJ — vår egen `data-collector` via GSC API är källan. Strunta i massdataexport-wizarden.
- EC2: 51.21.116.7 (nso/tobler/arbetsro Next.js + nginx + MCP-server).

### 2.2 Lambda-register (~32 aktiva)
- **Data:** data-collector (6h), ga4-collector (dag, ⚠️ 6 kunder hårdkodade), ranking-tracker (dag), regression-watcher (dag).
- **Audit/analys:** weekly-audit (mån), content-gap-analyzer (mån), keyword-researcher (mån), performance-monitor (mån), ai-visibility-tracker (mån), algorithm-watcher (mån).
- **Exekvering:** seo-autonomous-optimizer (6h), schema-markup-optimizer (tis), llms-txt-generator (mån), adaptive-merchandiser (dag), auto-article-generator (ons), content-publisher.
- **Rapport:** weekly-report (fre 15:00), monthly-client-report (1:a), report-preflight (tor), sales-morning-briefing (morgon), seo-alert-dispatcher (dag).
- **Hälsa:** cred-check (dag), creds-health-watcher (dag), bq-table-guard (dag), cost-tracker (sön 21:00), security-monitor (6h), skill-watcher (mån), prompt-improver (mån).
- **Social/SEM:** social-scheduler (15min), google-ads-optimizer (mån).

### 2.3 Datalager (BigQuery `seo_data`)
customer_pipeline · customer_keywords · action_plans · **seo_work_queue (Kanban)** · seo_optimization_log · weekly_reports · gsc_daily_metrics · ads_daily_metrics · social_daily_metrics · ga4_daily_metrics · content_opportunities · credential_checks · cost_tracking · ai_visibility_metrics · performance_metrics · customer_users · ace_decisions.

### 2.4 Kunskapssystem
- **Kanban (`seo_work_queue`):** alla åtgärder, optimeringar OCH slutsatser. Source of truth. Spindeln i nätet.
- **MemPalace (wing: searchboost):** on-demand kunskap. Rum: infrastruktur/deploy/api/kunder/system/lambda/decisions. Sök, ladda inte i context.
- **Obsidian (`memory/`):** lokala md-filer, kund_{slug}_tasks.md, visuell graf.
- **SSM:** `/seo-mcp/...` — WP app-passwords, GSC-property, API-nycklar per kund.

---

## 3. KÄNDA LUCKOR & SKULD (båda sessionerna)

### Kritiskt
1. **"Placeholder-creds" blockerar artikel/content-Lambdas för ~8 kunder** — verifiera mot faktiskt SSM-innehåll (creds finns nu, koden kan vara föråldrad).
2. **NSO wp-json-proxy trasig** (diagnos 2026-06-05): `nordicsnusonline.com/sv/wp-json/` ger nginx-404 (även med Basic Auth) → optimizern kan EJ skriva till NSO via REST. Orsak: `location ^~ /sv/ {}` matchar före wp-json-blocket på 51.21.116.7. NSO:s action_plans satta `blocked`, queue-tasks `skipped`. Åtgärd: fixa location-precedence i nginx, återaktivera sen.
3. **Loggen blandar rekommendationer med skrivningar** — FIXAT i kod (status-kolumn + `classifyStatus` + weekly-report-filter), EJ deployad.
4. **Social dubbel:** `social-poster.js` + `social-scheduler.js` gör samma → spamrisk. Slå ihop.
5. **Analys→åtgärdsplan-loop ej automatiserad** — bygg Lambda som stänger den.
6. **keyword-researcher → action_plans** ej auto-kopplad.

### Medel
- ga4-collector hårdkodar 6 kunder → gör dynamisk.
- backlink-monitor död (SE Ranking API blockerad) → alt. källa eller addon.
- google-ads-optimizer skapar ej kampanjer.
- MCP-server 7119 rader monolit → modularisera.
- session_log.md >100KB → arkivera per månad.
- 291 "unknown"-rader i optimization_log → utöka klassificering.

### Strategi (optimizer-session, avlivat — bygg INTE)
- ❌ "Expertcitat → AI Overview 2h", utgående länkar n=10, "Undeniable Signal"-ramverk, "$80 PR → AI Overviews". Pressrelease-mat utan rådata. Det belagda lyftet = generic SEO + volym + struktur.

---

## 4. EJ DEPLOYADE KODÄNDRINGAR (optimizer-session)
1. `seo-autonomous-optimizer` — `addAnswerFirstIntro` + `classifyStatus` + status på inserts.
2. `ai-visibility-tracker` — `getTopPages` + `queueAnswerFirstTasks` (SoM<60% → köa answer-first mot topp-3).
3. `weekly-report` — filtrerar `status='applied' OR NULL`.
4. `batch-log-optimizations.cjs` / `log-optimization.cjs` — tvingar `status='identified'`.
> Alla `node --check`-validerade. **Nästa: deploy de tre Lambdorna.**

---

## 5. NÄSTA STEG (prioriterat)
1. Deploy de tre Lambdorna (§4).
2. Verifiera placeholder-creds-blockeringen (§3.1) — är den ett verkligt problem idag?
3. Fixa NSO produkt-endpoint (§3.2).
4. Granska `createArticle` — når vi 8 artiklar/mån/kund?
5. Bygg analys→åtgärdsplan-loopen (§3.5) + keyword→plan-koppling (§3.6).
6. Slå ihop social-poster/scheduler (§3.4).
