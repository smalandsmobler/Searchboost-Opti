# Skills att installera -- Searchboost Opti

> Senast uppdaterad: 2026-02-14
> Sokning gjord pa GitHub for Claude Code skills relevanta for vara arbetsomraden.

---

## Sammanfattning

Vi har identifierat **17 skills/repos** att installera, fordelade pa:
- **Google Ads / PPC**: 3 repos (hogsta prio -- nytt arbetsomrade)
- **WordPress / WooCommerce**: 4 repos
- **DevOps / AWS / Deployment**: 2 repos
- **Fullstack / Node.js / API**: 3 skills (fran jeffallan/claude-skills)
- **Marketing (komplettering)**: 2 skills vi saknar
- **Ovriga verktyg**: 3 repos

**Saknas pa marknaden** (inga skills hittades):
- Product feed / Google Merchant Center-optimering
- BigQuery-specifika skills
- Trello-projekthantering (utover Atlassian MCP)
- Kundrapportering / client reporting

---

## PRIO 1 -- Google Ads / PPC (nytt arbetsomrade)

### 1. AgriciDaniel/claude-ads
- **URL**: https://github.com/AgriciDaniel/claude-ads
- **Stjarnor**: 82
- **Vad det gor**: Komplett paid advertising audit & optimering. 190+ checks over 6 plattformar (Google Ads, Meta, LinkedIn, TikTok, Microsoft/Bing, YouTube). Health scoring 0-100, branschspecifika templates (e-commerce, SaaS, lokal), kvalitetsgrindar, auto-detection av foretagstyp.
- **Skills inkluderade**: audit-google, audit-meta, audit-creative, audit-tracking, audit-budget, audit-compliance + 6 parallella audit-agenter
- **Kommandon**: `/ads audit`, `/ads google`, `/ads meta`, `/ads linkedin`, `/ads budget`, `/ads creative`, `/ads competitor`, `/ads plan [business-type]`
- **Relevant for oss**: JA -- mycket relevant. Tacker alla vara annonsplattformar (Google Ads, Meta, LinkedIn, TikTok). E-commerce-template passar SMK och andra WooCommerce-kunder.
- **Install**:
```bash
curl -fsSL https://raw.githubusercontent.com/AgriciDaniel/claude-ads/main/install.sh | bash
```

### 2. labofideas/ads-skills
- **URL**: https://github.com/labofideas/ads-skills
- **Stjarnor**: 3
- **Vad det gor**: 17 specialiserade skills for Google Ads och Meta Ads. Inkluderar: Google Ads Audit, Negative Keywords, PMax Auditor, RSA Generator, Search Terms, Shopping Feed, Meta Ads Ad Copy, ASC Auditor, Audience Builder, Creative Analyzer, Hook Optimizer, Pixel Auditor, Ads Funnel Builder, Platform Selector, Report Generator, Landing Page Auditor, Video Ad Script Writer.
- **Relevant for oss**: JA -- Shopping Feed-skillen ar unik och relevant for produktflodesarbete. RSA Generator och PMax Auditor ar direkt anvandbart for Google Ads-hantering.
- **Install**:
```bash
git clone https://github.com/labofideas/ads-skills.git ~/.claude/skills/ads-skills
```

### 3. mhuang74/googleads-analyst-skill
- **URL**: https://github.com/mhuang74/googleads-analyst-skill
- **Stjarnor**: 3
- **Vad det gor**: Google Ads prestandaanalys med GAQL (Google Ads Query Language). Performance pattern recognition, feldetektering, derived metrics, multi-account support, PDF-rapportgenerering.
- **Relevant for oss**: JA -- GAQL-referensen ar vardefull da vi redan har google-ads.js integration. PDF-rapportgenerering kompletterar vart befintliga rapportsystem.
- **Install**:
```bash
git clone https://github.com/mhuang74/googleads-analyst-skill.git
cp -r googleads-analyst-skill/skills/* ~/.claude/skills/
```

---

## PRIO 2 -- WordPress / WooCommerce

### 4. elvismdev/claude-wordpress-skills
- **URL**: https://github.com/elvismdev/claude-wordpress-skills
- **Stjarnor**: 77
- **Vad det gor**: Professionella WordPress-engineering skills. wp-performance-review ar klar (databasfraga-antimonster, hook-ineffektivitet, caching-gaps, AJAX-hantering, N+1-fragor, JS-bundle-optimering, Block Editor overhead). Planerade: wp-security-review, wp-gutenberg-blocks, wp-theme-development, wp-plugin-development.
- **Kommandon**: `/wp-perf-review [path]` (djup review), `/wp-perf [path]` (snabb triage)
- **Relevant for oss**: JA -- vi jobbar med WordPress dagligen (alla kunder). Performance review ar vardefull for kundaudit.
- **Install**:
```bash
# Via plugin marketplace (rekommenderat)
# I Claude Code: /plugin marketplace add elvismdev/claude-wordpress-skills

# Eller manuellt:
git clone https://github.com/elvismdev/claude-wordpress-skills.git ~/.claude/plugins/wordpress
```

### 5. xonack/wp-woocommerce-claude-skill
- **URL**: https://github.com/xonack/wp-woocommerce-claude-skill
- **Stjarnor**: 0 (nytt, jan 2026)
- **Vad det gor**: WooCommerce-specifik skill: custom product types, payment gateways, shipping methods, HPOS, REST API extensions, cart/checkout customization, Blocks integration.
- **Kommandon**: `/wp-woocommerce`
- **Relevant for oss**: JA -- direkt relevant for SMK WooCommerce-migrering och framtida e-handelskunder.
- **Install**:
```bash
# Via Claude Code:
# /plugin install https://github.com/xonack/wp-woocommerce-claude-skill

# Eller manuellt:
git clone https://github.com/xonack/wp-woocommerce-claude-skill.git
cp -r wp-woocommerce-claude-skill/skills/wp-woocommerce ~/.claude/skills/
```

### 6. CrazySwami/wordpress-dev-skills
- **URL**: https://github.com/CrazySwami/wordpress-dev-skills
- **Stjarnor**: 2
- **Vad det gor**: 11 skills: wp-orchestrator, wp-docker, wp-playground, white-label, wordpress-dev, wordpress-admin, seo-optimizer, visual-qa, brand-guide, gsap-animations, wp-performance.
- **Kommandon**: `/wp-setup` (provisionera site), `/wp-audit` (SEO + prestanda + visuell QA), `/wp-launch` (pre-launch checklist)
- **Relevant for oss**: DELVIS -- seo-optimizer, wp-performance och wp-audit ar relevanta. Docker/Playground ar overflodiga for oss. /wp-audit ar intressant for kundleveranser.
- **Install**:
```bash
git clone https://github.com/CrazySwami/wordpress-dev-skills.git ~/.claude/skills/wordpress-dev-skills
```

### 7. jeffallan/claude-skills -- wordpress-pro
- **URL**: https://github.com/jeffallan/claude-skills
- **Stjarnor**: 2,300
- **Vad det gor**: WordPress Pro-skill: teman, plugins, Gutenberg-block, WooCommerce. Del av 66-skills-paketet.
- **Relevant for oss**: JA -- hog kvalitet, beprovat repo. WordPress + WooCommerce i en skill.
- **Install**:
```bash
git clone https://github.com/jeffallan/claude-skills.git /tmp/jeffallan-skills
cp -r /tmp/jeffallan-skills/skills/wordpress-pro ~/.claude/skills/
```

---

## PRIO 3 -- DevOps / AWS / Deployment

### 8. akin-ozer/cc-devops-skills
- **URL**: https://github.com/akin-ozer/cc-devops-skills
- **Stjarnor**: Ej angivet
- **Vad det gor**: 31 DevOps-skills i generator+validator-par: Terraform, Ansible, Dockerfile, Kubernetes, Helm, GitHub Actions, GitLab CI, Jenkins, Azure Pipelines, PromQL, LogQL, Fluent Bit, Makefile, Bash-script.
- **Relevant for oss**: DELVIS -- github-actions-generator/validator, dockerfile-generator/validator, bash-script-generator/validator ar relevanta. Vi anvander inte Kubernetes/Terraform/Helm.
- **Install**:
```bash
git clone https://github.com/akin-ozer/cc-devops-skills.git ~/.claude/skills/cc-devops-skills
# Valj ut bara relevanta skills:
# github-actions-generator, github-actions-validator
# dockerfile-generator, dockerfile-validator
# bash-script-generator, bash-script-validator
```

### 9. jeffallan/claude-skills -- cloud-architect + devops-engineer
- **URL**: https://github.com/jeffallan/claude-skills
- **Stjarnor**: 2,300
- **Vad det gor**: cloud-architect (AWS/Azure/GCP arkitektur, multi-cloud), devops-engineer (CI/CD, deployment, infrastruktur, platform engineering).
- **Relevant for oss**: JA -- vi kor AWS EC2 + Lambda + SSM + SES. Cloud Architect tacker vara behov.
- **Install**:
```bash
# Om inte redan klonat:
git clone https://github.com/jeffallan/claude-skills.git /tmp/jeffallan-skills
cp -r /tmp/jeffallan-skills/skills/cloud-architect ~/.claude/skills/
cp -r /tmp/jeffallan-skills/skills/devops-engineer ~/.claude/skills/
```

---

## PRIO 4 -- Fullstack / Node.js / API

### 10-12. jeffallan/claude-skills -- javascript-pro, api-designer, sql-pro
- **URL**: https://github.com/jeffallan/claude-skills
- **Stjarnor**: 2,300
- **Vad det gor**:
  - **javascript-pro**: Modern JavaScript, async patterns, ES2024+
  - **api-designer**: RESTful API design, OpenAPI, API versioning
  - **sql-pro**: Advanced SQL, query optimization, window functions, CTEs
- **Relevant for oss**: JA -- vi kor Node.js/Express backend, REST API:er, och BigQuery SQL.
- **Install**:
```bash
cp -r /tmp/jeffallan-skills/skills/javascript-pro ~/.claude/skills/
cp -r /tmp/jeffallan-skills/skills/api-designer ~/.claude/skills/
cp -r /tmp/jeffallan-skills/skills/sql-pro ~/.claude/skills/
```

---

## PRIO 5 -- Marketing (komplettering av befintliga)

### 13. coreyhaines31/marketingskills -- paid-ads
- **URL**: https://github.com/coreyhaines31/marketingskills
- **Stjarnor**: 7,600
- **Vad det gor**: `paid-ads` skill -- skapa kampanjer pa Google, Meta, LinkedIn, Twitter/X.
- **Relevant for oss**: JA -- vi har redan 25 skills fran detta repo men dubbelkolla att `paid-ads` ar installerat. Det ar direkt relevant for Google Ads-arbetet.
- **Kontrollera**:
```bash
ls ~/.claude/skills/ | grep paid-ads
# Om den saknas:
# Hamta fran redan installerat repo eller installera om
```

### 14. alirezarezvani/claude-skills -- Marketing Demand & Acquisition
- **URL**: https://github.com/alirezarezvani/claude-skills
- **Stjarnor**: 1,800
- **Vad det gor**: CAC-berakning, full-funnel strategi, kanal-playbooks (LinkedIn, Google Ads, Meta, SEO), HubSpot-integration. Ocksa: Campaign Analytics (multi-touch attribution, funnel conversion), Social Media Analyzer (ROI-tracking over plattformar).
- **Relevant for oss**: JA -- komplement till vara befintliga marketing skills. Full-funnel strategi och kanal-playbooks ar direkt anvandbart for kundpresentationer.
- **Install**:
```bash
git clone https://github.com/alirezarezvani/claude-skills.git /tmp/alirezarezvani-skills
# Kopiera relevanta skills:
# Marketing Demand & Acquisition, Campaign Analytics, Social Media Analyzer
cp -r /tmp/alirezarezvani-skills/skills/marketing-demand-acquisition ~/.claude/skills/ 2>/dev/null
cp -r /tmp/alirezarezvani-skills/skills/campaign-analytics ~/.claude/skills/ 2>/dev/null
cp -r /tmp/alirezarezvani-skills/skills/social-media-analyzer ~/.claude/skills/ 2>/dev/null
# OBS: Verifiera exakta mappnamn i repot forst
```

---

## PRIO 6 -- Ovriga verktyg

### 15. daymade/claude-code-skills -- ppt-creator + pdf-creator
- **URL**: https://github.com/daymade/claude-code-skills
- **Stjarnor**: 578
- **Vad det gor**: ppt-creator (professionella presentationer med diagram), pdf-creator (PDF-generering). Ocksa: competitors-analysis.
- **Relevant for oss**: DELVIS -- vi har redan reveal.js-presentationer och Marp PDF-export. Men ppt-creator kan vara bra for PowerPoint-format som kunder foredrar.
- **Install**:
```bash
git clone https://github.com/daymade/claude-code-skills.git /tmp/daymade-skills
cp -r /tmp/daymade-skills/skills/ppt-creator ~/.claude/skills/
cp -r /tmp/daymade-skills/skills/pdf-creator ~/.claude/skills/
cp -r /tmp/daymade-skills/skills/competitors-analysis ~/.claude/skills/
```

### 16. jeffallan/claude-skills -- shopify-expert
- **URL**: https://github.com/jeffallan/claude-skills
- **Stjarnor**: 2,300
- **Vad det gor**: Shopify Liquid-templating, Storefront API, Shopify-appar, checkout extensions.
- **Relevant for oss**: FRAMTIDA -- om vi far Shopify-kunder. Inte prio nu men bra att veta om.
- **Install vid behov**:
```bash
cp -r /tmp/jeffallan-skills/skills/shopify-expert ~/.claude/skills/
```

### 17. jeffallan/claude-skills -- playwright-expert
- **URL**: https://github.com/jeffallan/claude-skills
- **Stjarnor**: 2,300
- **Vad det gor**: Browser automation och E2E-testning med Playwright.
- **Relevant for oss**: JA -- vi anvander Playwright for screenshots och visual QA pa kundsajter.
- **Install**:
```bash
cp -r /tmp/jeffallan-skills/skills/playwright-expert ~/.claude/skills/
```

---

## Snabb-installationsscript (alla PRIO 1-4)

```bash
#!/bin/bash
# Installera alla rekommenderade skills for Searchboost Opti
# Kor fran valfri katalog

echo "=== PRIO 1: Google Ads / PPC ==="

# 1. claude-ads (komplett annonsaudit)
curl -fsSL https://raw.githubusercontent.com/AgriciDaniel/claude-ads/main/install.sh | bash

# 2. ads-skills (Google Ads + Meta Ads)
git clone https://github.com/labofideas/ads-skills.git ~/.claude/skills/ads-skills

# 3. googleads-analyst (GAQL + prestandaanalys)
git clone https://github.com/mhuang74/googleads-analyst-skill.git /tmp/googleads-analyst
cp -r /tmp/googleads-analyst/skills/* ~/.claude/skills/ 2>/dev/null || \
  cp -r /tmp/googleads-analyst ~/.claude/skills/googleads-analyst

echo "=== PRIO 2: WordPress / WooCommerce ==="

# 4. WordPress engineering skills
git clone https://github.com/elvismdev/claude-wordpress-skills.git ~/.claude/plugins/wordpress

# 5. WooCommerce skill
git clone https://github.com/xonack/wp-woocommerce-claude-skill.git /tmp/woo-skill
cp -r /tmp/woo-skill/skills/wp-woocommerce ~/.claude/skills/

# 6. WordPress dev skills (valda delar)
git clone https://github.com/CrazySwami/wordpress-dev-skills.git ~/.claude/skills/wordpress-dev-skills

# 7-12. jeffallan/claude-skills (6 skills)
git clone https://github.com/jeffallan/claude-skills.git /tmp/jeffallan-skills
for skill in wordpress-pro cloud-architect devops-engineer javascript-pro api-designer sql-pro playwright-expert; do
  cp -r /tmp/jeffallan-skills/skills/$skill ~/.claude/skills/
done

echo "=== PRIO 3: DevOps ==="

# Selektiv install fran cc-devops-skills
git clone https://github.com/akin-ozer/cc-devops-skills.git /tmp/devops-skills
for skill in github-actions-generator github-actions-validator bash-script-generator bash-script-validator; do
  cp -r /tmp/devops-skills/skills/$skill ~/.claude/skills/ 2>/dev/null
done

echo "=== PRIO 5: Marketing ==="

# Verifiera att paid-ads finns
ls ~/.claude/skills/ | grep paid-ads || echo "VARNING: paid-ads saknas, installera fran coreyhaines31/marketingskills"

# Alireeza marketing skills
git clone https://github.com/alirezarezvani/claude-skills.git /tmp/alirezarezvani-skills
ls /tmp/alirezarezvani-skills/skills/ 2>/dev/null

echo "=== Klar! ==="
echo "Totalt installerade: $(ls ~/.claude/skills/ | wc -l) skills"
```

---

## Repos vi INTE rekommenderar

| Repo | Anledning |
|------|-----------|
| sickn33/antigravity-awesome-skills (856 skills) | For stort, generiskt, overlappar med det vi redan har |
| jeremylongshore/claude-code-plugins-plus-skills (270 plugins) | For brett, svart att valja ratt, overlappar |
| affaan-m/everything-claude-code (45k stjarnor) | Mest konfigurationsexempel, inte skills |
| kubachour/claude-skills-for-growth | Minimalt repo, bara HTML5 playables |
| RananjayRaj/Claude-Cowork-Paid-Advertising-Plugin | 0 stjarnor, innehall i ZIP (svart att granska) |

---

## Saknas pa marknaden -- bor vi bygga sjalva?

Foljande arbetsomraden har **inga befintliga Claude Code skills**:

1. **Google Merchant Center / Product Feed-optimering**
   - Ingen skill finns. labofideas/ads-skills har "Shopping Feed" men det ar okant vad den tacker.
   - **Rekommendation**: Bygg en egen skill baserad pa Googles produktfeed-specifikation.

2. **BigQuery-utveckling**
   - sql-pro fran jeffallan tacker generell SQL men inte BigQuery-specifikt (partitionering, STRUCT/ARRAY, federated queries, costs).
   - **Rekommendation**: Kan klara oss med sql-pro + manuell kunskap.

3. **Client Reporting / SEO-rapporter**
   - Ingen skill for att generera kundrapporter fran SEO-data.
   - **Rekommendation**: Vi har redan report-exporter.js -- kan eventuellt wrappa det som en skill.

4. **Trello Project Management**
   - jeffallan har atlassian-mcp (Jira/Confluence) men inget for Trello.
   - **Rekommendation**: Vi har redan Trello-integration i index.js.

5. **Google Search Console-analys**
   - Ingen specifik skill. Vara befintliga GSC-integrationer racker.

---

## Redan installerade skills (for referens)

### Marketing (25 st, coreyhaines31/marketingskills)
ab-test-setup, analytics-tracking, competitor-alternatives, content-strategy, copy-editing, copywriting, email-sequence, form-cro, free-tool-strategy, launch-strategy, marketing-ideas, marketing-psychology, onboarding-cro, page-cro, paid-ads, paywall-upgrade-cro, popup-cro, pricing-strategy, product-marketing-context, programmatic-seo, referral-program, schema-markup, seo-audit, signup-flow-cro, social-content

### AI Research (83 st, Orchestra-Research)
RAG, fine-tuning, inference, agents, multimodal -- prefix `air-`

### n8n Automation (7 st, czlonkowski/n8n-skills)
workflow-patterns, expression-syntax, validation-expert, mcp-tools-expert m.fl.

### UI/UX Pro Max (1 st, nextlevelbuilder)
50+ designstilar, 97 fargpaletter, 57 fontpar, 99 UX-riktlinjer

### Session Restore (1 st, egenbyggd)
