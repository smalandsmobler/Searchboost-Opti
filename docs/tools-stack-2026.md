# Searchboost Tools Stack 2026

> Komplett lista over verktyg, skills och plattformar. Uppdaterad 2026-02-17.

---

## Claude Code Skills (installerade)

### SEO & GEO
| Skill | Kalla | Beskrivning |
|-------|-------|-------------|
| seo-audit | AgriciDaniel/claude-seo | Full SEO-audit med parallella subagents |
| seo-page | AgriciDaniel/claude-seo | Djup ensidesanalys |
| seo-plan | AgriciDaniel/claude-seo | Strategisk SEO-planering |
| seo-geo | AgriciDaniel/claude-seo + opc-skills | GEO — AI-sokningsoptimering (ChatGPT, Perplexity) |
| seo-sitemap | AgriciDaniel/claude-seo | Sitemap-analys och generering |
| seo-hreflang | AgriciDaniel/claude-seo | Internationell SEO |
| seo-competitor-pages | AgriciDaniel/claude-seo | Konkurrensjamforelsesidor |
| seo (universal) | AgriciDaniel/claude-seo | Komplett SEO-analys for alla sajttyper |
| schema-markup | coreyhaines31/marketingskills | Schema markup och strukturerad data |
| programmatic-seo | coreyhaines31/marketingskills | SEO-sidor i skala |

### SEO Subagents (6 st)
| Agent | Uppgift |
|-------|---------|
| seo-technical | Teknisk SEO-analys |
| seo-content | Innehallskvalitet + E-E-A-T |
| seo-schema | Schema markup-validering |
| seo-sitemap | Sitemap-analys |
| seo-performance | Core Web Vitals + hastighet |
| seo-visual | Visuell granskning |

### SEO Specialist Subagent
| Agent | Kalla |
|-------|-------|
| seo-specialist.md | VoltAgent/awesome-claude-code-subagents |

### Solopreneur Skills (opc-skills)
| Skill | Beskrivning |
|-------|-------------|
| domain-hunter | Sok domannamn, jamfor priser |
| requesthunt | Scrapa Reddit/X for produktvalidering |
| logo-creator | AI-logotypgenerering |
| twitter | Sok och hamta Twitter/X-innehall |
| reddit | Sok och hamta Reddit-innehall |
| producthunt | Sok Product Hunt |
| banner-creator | AI-bannergenerering |
| nanobanana | Bildgenerering med Gemini 3 |

### Marketing Skills (coreyhaines31)
| Skill | Beskrivning |
|-------|-------------|
| copywriting | Marknadskopior |
| content-strategy | Innehallsstrategi |
| pricing-strategy | Prismodeller |
| page-cro | Konverteringsoptimering |
| analytics-tracking | Analysuppsattning |
| paid-ads | Google Ads, Meta Ads |
| email-sequence | E-postsekvenser |
| ab-test-setup | A/B-testning |
| referral-program | Referralprogram |

---

## Prospektering & Forsaljning

| Verktyg | Typ | Pris | Anvandning |
|---------|-----|------|------------|
| [Apollo.io](https://www.apollo.io/) | Leads + outreach | Gratis/49+$/man | Hitta prospects, e-postsekvenser |
| [Outreach.io](https://www.outreach.io/) | Sales engagement | ~$100/user/man | Saljsekvenser, AI-agenter |
| [Crunchbase](https://www.crunchbase.com/) | Foretags-databas | Gratis/Pro $29+/man | Bolagsdata, omsattning, bransch |
| [G2](https://www.g2.com/) | Mjukvarurecensioner | Gratis | Konkurrentanalys, social proof |
| [Clearbit/Breeze](https://clearbit.com/) | Company enrichment | $45+/man (HubSpot) | Firmografisk data, berika CRM |

---

## SEO & Analys

| Verktyg | Typ | Pris | Anvandning |
|---------|-----|------|------------|
| [Rankability](https://www.rankability.com/) | AI SEO-plattform | ~$99+/man | NLP-optimering, AI-soknings-overvakning |
| [Supermetrics](https://supermetrics.com/) | Data pipeline | $37+/man | GSC+GA4+Ads till BigQuery/Looker Studio |
| SE Ranking | Backlinks + rank | Befintligt konto | Backlinkanalys (441k credits, exp 2026-02-20) |
| Google Search Console | Sokordsdata | Gratis | Positioner, klick, impressions |

---

## Produktfeed & E-handel

| Verktyg | Typ | Pris | Anvandning |
|---------|-----|------|------------|
| [FeedGen](https://github.com/google-marketing-solutions/feedgen) | AI feed-optimering | Gratis (Vertex AI) | Optimera titlar/beskrivningar med LLM |
| CTX Feed Pro | WP-plugin | $119/ar | Google Shopping XML-feed for SMK |
| Product Feed PRO | WP-plugin | Gratis/Elite $89/ar | Google Shopping for Mobelrondellen |
| Google Merchant Center | Feed-hantering | Gratis | Produktfeed-hosting |

---

## Claude Code Ekosystem

| Resurs | Beskrivning | URL |
|--------|-------------|-----|
| cc-marketplace | 116 Claude Code plugins | [ananddtyagi/cc-marketplace](https://github.com/ananddtyagi/cc-marketplace) |
| claude-code-pm-course | PM-kurs for Claude Code | [carlvellotti/claude-code-pm-course](https://github.com/carlvellotti/claude-code-pm-course) |
| awesome-claude-skills | 7.1k+ skills | [travisvn/awesome-claude-skills](https://github.com/travisvn/awesome-claude-skills) |
| awesome-agent-skills | 300+ agent skills | [VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills) |
| awesome-claude-code-subagents | 140 subagents | [VoltAgent/awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) |
| 610ClaudeSubagents | 610 specialiserade agenter | [ChrisRoyse/610ClaudeSubagents](https://github.com/ChrisRoyse/610ClaudeSubagents) |

---

## Befintlig infrastruktur (Searchboost Opti)

| Komponent | Status |
|-----------|--------|
| Google Ads API (REST v17) | Byggt, saknar OAuth2 credentials |
| Meta Ads API (v21.0) | Byggt, saknar credentials |
| LinkedIn Ads API (v2) | Byggt, saknar credentials |
| TikTok Ads API (v1.3) | Byggt, saknar credentials |
| GSC API | Aktivt, 5 kunder kopplade |
| BigQuery (6 tabeller) | Aktivt |
| Prospect Analyzer Lambda | Byggt, EJ deployat |
| Weekly Audit Lambda | Aktivt (mandag 06:00) |
| Autonomous Optimizer Lambda | Aktivt (var 6:e timme) |
| Weekly Report Lambda | Aktivt (mandag 08:00) |
| GTM Container Template | Klart (config/gtm-template.json) |
| Kundportal | Live pa kundzon.searchboost.nu |

---

## Installationsloggar

```
2026-02-17: claude-seo — 12 skills + 6 subagents
2026-02-17: opc-skills — 9 skills (seo-geo, domain-hunter, requesthunt, etc)
2026-02-17: seo-specialist subagent — VoltAgent
2026-02-17: FeedGen — kopierad till tools/feedgen
2026-02-13: marketingskills (25 st) — coreyhaines31
2026-02-13: AI Research skills (83 st) — Orchestra-Research
2026-02-13: n8n skills (7 st) — czlonkowski
2026-02-13: UI/UX Pro Max (1 st) — nextlevelbuilder
```
