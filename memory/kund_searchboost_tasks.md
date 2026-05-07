---
name: Searchboost tasks
description: Searchboost (eget) task-checklista
type: project
---

# Searchboost (eget) — Tasks

**Site**: https://searchboost.se
**Dashboard**: https://opti.searchboost.se (EC2 51.21.116.7)

## Klart 2026-04-20 (SEO gap-analys + meta batch)
- [x] **Konkurrentanalys klar** (agent aff6791d): Seoexperten.se, Ranktrail.se, Brightvision analyserade
- [x] **5 kritiska gap identifierade**: AggregateRating saknas (stjärnor i SERP), 89% sidor saknar meta, FAQPage ej på startsidan, för få H2:or, saknar PriceSpecification schema
- [x] **Meta batch 20 prioritetssidor** via Rank Math updateMeta:
  - 8 branschsidor: seo-halsa, seo-bygg, seo-hotell, seo-advokat, seo-tandlakare, seo-b2b, seo-restaurang, seo-ehandel
  - 4 tjänstesidor: priser, om-oss, tjanster, kontakt
  - 3 SEO-sidor: seo-optimeringar, seo-for-smaforetag, seo-optimering
  - 10 stadssidor: eskilstuna, uddevalla, trollhättan, luleå, sundsvall, gävle, umeå, västerås, uppsala, stockholm
  - Homepage (ID:883): ny title + description
- [x] **Startsidans meta**: "SEO-byrå Sverige — Fler kunder via Google | Searchboost" + 150-teckens description

### Kvar från gap-analys
- [ ] **AggregateRating schema** — kräver Google-recensioner. Mikael skickar mail till alla aktiva kunder
- [x] **LocalBusiness schema** — Code Snippet ID:16 (active, front-end). Adress Stockholm, geo 59.3293/18.0686
- [x] **FAQPage schema på startsidan** — Code Snippet ID:17 (active, front-end). 5 Q&A om SEO-kostnader, tid, garanti etc.
- [ ] **Utöka H2-rubriker** på startsidan (från 3 till 7-8) — lägg till sektioner: resultat, pris-preview, FAQ
- [ ] **Fyll meta på kvarvarande ~70 sidor** (kunskapssidor, blogg, övriga stadsidor)

## Klart 2026-04-19 (Nattjobb — konkurrentanalys + sidstruktur)
- [x] **Konkurrentkartlaggning**: 10 Google-sokningar, 15 byraer mappade — `content-pages/searchboost/NATTJOBB-rapport-2026-04-19.md`
- [x] **Djupanalys 10 konkurrenter**: Brath, Pineberry, Topdog, Bonzer, Doidea/Avidly, Expandtalk, Viseo, Topvisible, Profitmedia, Topdog
- [x] **Searchboost.se nulaesanalys**: 75 sidor + 30 artiklar kartlagda, gap-analys mot konkurrenter
- [x] **Gap-rapport**: 8 kritiska gap identifierade (prissida, branschsidor, testimonials, video, kundportal-marknadsfor, Google Reviews, certifieringar, interaktiva verktyg)
- [x] **Marknadsforingsstrategi for Opti**: Positionering, LinkedIn-strategi (5 inlagg redo), remarketing FB/IG (3 annonser)
- [x] **6 nya sidor strukturerade** (content-filer, ej publicerade):
  - `sida-priser.md` — 3 paket: Starter 5k, Growth 10k, Scale 15k+
  - `sida-hur-vi-jobbar.md` — 4-stegs process + Opti-presentation
  - `sida-kundportal.md` — Portal-demo-sida (unik i branschen)
  - `sida-seo-ehandel.md` — Branschsida e-handel
  - `sida-seo-restaurang.md` — Branschsida restaurang
  - `sida-seo-b2b.md` — Branschsida B2B
  - `sida-seo-tandlakare.md` — Branschsida tandlakare

### NASTA STEG (kvar efter nattjobbet)
- [ ] **Skapa 4 branschsidor till** — advokat, hotell, bygg, halsa
- [ ] **Posta LinkedIn-inlagg 1+2** (copy i nattjobbsrapporten)
- [ ] **Satt upp Meta Pixel** for remarketing (Code Snippet)
- [ ] **Google Reviews-kampanj** — be alla 9 kunder om review
- [ ] **Schema markup pa alla sidor** — Organization, LocalBusiness, FAQ etc. (Rank Math + Code Snippets)
- [ ] **Screenshots fran Opti** till /kundportal/ och /hur-vi-jobbar/ (Mikael tar)
- [ ] **Uppdatera huvudmenyn** — lagg till Priser, Hur vi jobbar, Kundportal
- [ ] **7 nya stadssidor** — Umea, Gavle, Sundsvall, Lulea, Trollhattan, Uddevalla, Eskilstuna

## Klart 2026-04-19 (Nattjobb — publicering)
- [x] **/gratis-seo-analys/ FIXAD** — 500-fel lost. Gammalt 14k inline CSS-content ersatt med rent HTML + formsubmit.co-formular
- [x] **/priser/ LIVE** (ID:2893) — 3 paket: Starter 5k, Growth 10k, Scale 15k+. Dark/pink design.
- [x] **/hur-vi-jobbar/ LIVE** (ID:2894) — 4-stegs process + resultat + "vad gor oss annorlunda"
- [x] **/kundportal/ LIVE** (ID:2895) — Portal-presentation, 5 features, "unik i branschen"
- [x] **/seo-ehandel/ LIVE** (ID:2897) — Branschsida e-handel (WooCommerce, Shopify)
- [x] **/seo-restaurang/ LIVE** (ID:2898) — Branschsida restaurang (lokal SEO-fokus)
- [x] **/seo-b2b/ LIVE** (ID:2899) — Branschsida B2B (gjuteri, plast, fallskydd-exempel)
- [x] **/seo-tandlakare/ LIVE** (ID:2901) — Branschsida tandlakare
- [x] **Dubbletter draftade**: /vanliga-fragor-om-seo/ (ID:1941), /seo-analys/ (ID:1579), /lokal-seo/ (ID:1908)
- [x] **Kontaktformular tillagt** pa /kontakt/ (formsubmit.co → info@searchboost.se)
- [x] **Homepage meta uppdaterad** — ny title + description + focus keyword

## Nästa steg

### PRIO 1 — Gratis leadgeneration (analys 2026-04-18)
- [ ] **Google Business Profile**: Verifiera att GBP är kravt och optimerat — logo, bilder, tjänster, FAQ, veckovisa inlägg
- [x] **Email-sekvens**: 3-mail nurture-sekvens skriven — `content-pages/searchboost/email-sekvens-gratis-analys.md`. **Kvar**: koppla WPForms till Mailchimp (Mailchimp-instruktioner finns i filen)
- [x] **Exit-intent popup**: Deployad som Code Snippet ID:13 (active, front-end scope) — triggas vid mouseleave desktop + 45s mobil, samlar email via formsubmit.co → info@searchboost.se
- [x] **Agency directories**: Profiler + beskrivningstext skapade för Bark.com, Sortlist.se, Clutch.co, Agency Vista, GoodFirms — `content-pages/searchboost/agency-directory-profiler.md`. **Kvar**: Mikael skapar konton manuellt (1-2h)
- [ ] **Lead magnet PDF**: Skapa faktisk "SEO-checklista 2026" PDF (73 checkpoints). Nyhetsbrev-sida skapad (ID:2891) och exit-intent popup live — PDF behövs som faktisk fil
- [ ] **LinkedIn**: Mikael postar 3-4 gånger/vecka — SEO-tips, before/after screenshots, case-studies. Repurposea bloggartiklar
- [ ] **Google Reviews-kampanj**: Skicka personliga mail till alla aktiva kunder, be om Google Review

### PRIO 2 — Bygg infrastruktur
- [x] **Skapa /partner/**: ID:2890 https://searchboost.se/partner/ — live med 10% provision, 6 partnerkategorier, FAQ, formsubmit.co-formulär
- [x] **Skapa /nyhetsbrev/**: ID:2891 https://searchboost.se/nyhetsbrev/ — live med opt-in + 3 lead magnets beskrivna
- [x] **/gratis-seo-analys/ uppgraderad**: ID:2161 — lagt till "Vad händer sen?"-sektion (3-mail preview), lead magnet-grid (PDF + meta-mall + nyckelordsguide), testimonial från Möbelrondellen
- [ ] **Cold email-sekvens**: Scrapa kontakter från LinkedIn + Google Maps, 3-mail sekvens med gratis audit-erbjudande
- [ ] **Community-närvaro**: Gå med i Facebook-grupper "Företagare i Sverige" (157k), "WordPress Sverige", "E-handel Sverige" — svara på SEO-frågor

### PRIO 3 — Content och PR
- [ ] **YouTube Shorts**: 60-90 sek SEO-tips på svenska, repurposa bloggar. Embedda på sajten.
- [ ] **Mynewsdesk/Pressat.se**: Gratis pressrelease-distribution vid nyheter
- [ ] **HARO**: Registrera på helpareporter.com, svara på journalisters SEO-frågor → gratis backlinks + PR

### Kvarstår från MASTERPLAN
- [ ] Rank Math-inställningar: Ändra entitetstyp till Organization, aktivera breadcrumbs
- [ ] Uppdatera tjänstesidor med ny copy: SEO-optimering, Lokal SEO, SEO-audit, E-handel SEO (filerna finns)
- [ ] Skapa NY sida: /priser/ (copy i `sida-priser.md`)
- [ ] Footer-redesign: 4 kolumner
- [ ] Blogkategorier: Skapa 8 nya, flytta inlägg
- [ ] Skapa 7+ nya stadssidor: Umeå, Gävle, Sundsvall, Luleå, Trollhättan, Uddevalla, Eskilstuna
- [ ] Skapa /tjanster/lankbygge/ och /tjanster/innehallsmarknadsforing/
- [ ] Bygg ut /kontakt/ med formulär + Google Maps
- [ ] Bygg ut /om-oss/ till 800+ ord med teamfoto
- [ ] Skapa branschsidor: restaurang, tandläkare, advokat, B2B, SaaS, e-handel, hotell
- [ ] Skapa plattformssidor: WordPress, Shopify, WooCommerce

### Löpande
- [ ] Artikelproduktion 2-3/vecka
- [ ] Dashboard: Kanban-vy (lägre prio)

## Klart 2026-04-18 (Leadgen-infrastruktur)
- [x] **/partner/** (ID:2890) — Referral-sida med 10% provision, 6 partnerkategorier, FAQ, formulär
- [x] **/nyhetsbrev/** (ID:2891) — Opt-in sida med 3 lead magnets
- [x] **/gratis-seo-analys/** uppgraderad — "Vad händer sen?"-sektion, 3-mail preview, lead magnets, testimonial
- [x] **Exit-intent popup** — Code Snippet ID:13 (front-end, active) — mouseleave + 45s mobil
- [x] **3-mail email-sekvens skriven** — `content-pages/searchboost/email-sekvens-gratis-analys.md` (Mail 1 direkt, Mail 2 dag 3, Mail 3 dag 7 + Mailchimp-inställningar)
- [x] **Agency directory-profiler** — `content-pages/searchboost/agency-directory-profiler.md` (Bark, Sortlist, Clutch, Agency Vista, GoodFirms)

## Klart 2026-04-18 (Perispa v3.0 — 172 verktyg, deployat till EC2)
- [x] **Perispa v3.0 byggt** — 27 tool-moduler, 172 verktyg totalt
- [x] **10 nya system-moduler byggda och deployade**:
  1. auto-audit.js — perispa_audit_site, perispa_audit_all_sites
  2. batch-fixer.js — perispa_fix_missing_meta, perispa_fix_missing_alt, perispa_fix_all_seo
  3. schema-generator.js — perispa_generate_schema, perispa_apply_schema, perispa_schema_audit
  4. gsc.js — perispa_gsc_top_queries, perispa_gsc_top_pages, perispa_gsc_query_trend
  5. content-gap.js — perispa_content_gaps, perispa_suggest_articles, perispa_keyword_cannibalization
  6. pagespeed.js — perispa_pagespeed_test, perispa_pagespeed_all, perispa_pagespeed_monitor
  7. auto-linker.js — perispa_analyze_links, perispa_suggest_links, perispa_auto_link
  8. competitor.js — perispa_competitor_scan, perispa_competitor_compare, perispa_competitor_keywords
  9. ai-writer.js — perispa_write_article, perispa_write_meta, perispa_write_batch_articles
  10. report-generator.js — perispa_site_report, perispa_all_sites_report, perispa_weekly_summary, perispa_export_report
- [x] **Deployat till EC2** — alla 27 moduler verifierade (27/27 OK), npm install klar

## Klart 2026-04-18 (Total SEO-audit + fix via Perispa)
- [x] **SEO-metadata** på 100/101 sidor — titel, description, fokus-sökord via Rank Math API
- [x] **Schema markup** på 24 sidor: ProfessionalService (startsida + 17 stadsidor), Service (5 tjänstesidor), FAQPage (FAQ-sida)
- [x] **Internlänkar** på 63 sidor — relaterade länkar-sektion appendad
- [x] **301 redirects**: /vanliga-fragor-om-seo/ → /vanliga-fragor/, /seo-analys/ → /gratis-seo-analys/
- [x] **Duplicate content** borttaget: tomt inlägg ID:1880, tom draft ID:1878
- [x] **Plugin-cleanup**: 7 inaktiva plugins borttagna (Hello Dolly, BabyLoveGrowth, DD Maintenance, Extendify, Meow, OG Tags, Site Assistant)
- [x] **3 nya artiklar publicerade**:
  - ID:2824 /valja-ratt-seo-byra-guide/ (fokus: välja SEO-byrå)
  - ID:2854 /teknisk-seo-checklista-2026/ (fokus: teknisk SEO checklista)
  - ID:2889 /seo-trender-2026-strategier/ (fokus: SEO trender 2026)
- [x] **Perispa v2.0 byggt**: 142 verktyg, registrerad som MCP-server i .mcp.json

## Klart 2026-04-17 (SEO-batch kvällsoptimering)
- [x] Meta description-scan: 101 sidor/posts granskade, 100/101 hade redan descriptions
- [x] ID:2161 /gratis-seo-analys/ — fick ny meta description (150 tecken)
- [x] OBS: Intermittent HTTP 500 på /gratis-seo-analys/ — behöver undersökas

## Klart 2026-04-17
- [x] MASTERPLAN skapad: `content-pages/searchboost/MASTERPLAN-searchboost-se.md`
- [x] Konkurrentanalys: 10 svenska SEO-byråer genomgångna (Brath, Pineberry, Topdog, Bonzer, Viseo, ExpandTalk, Topvisible, SEO Inc, Profitmedia)
- [x] Komplett SEO-audit av searchboost.se (82 URL:er crawlade)
- [x] Schema markup genererad: `searchboost-schema-deploy.html` (24 JSON-LD block)
- [x] Sidinnehåll skrivet: SEO-optimering (1250 ord), Lokal SEO (1250 ord), SEO-audit (1250 ord), E-handel SEO (1250 ord), Priser (1200 ord), SEO byrå Malmö (1050 ord)
- [x] Meta descriptions för alla 70+ sidor: `meta-descriptions-alla-sidor.md`
- [x] Redirects + cleanup-plan: `redirects-och-cleanup.md`
- [x] Silostruktur + internlänkningsstrategi i masterplanen

## Klart 2026-04-13
- [x] Artikel skriven: /content-pages/searchboost-artikel-seo-byraa-goteborg.md (focus: seo byrå göteborg)

## Klart tidigare
- [x] Infra-sweep 2026-04-09 (BQ-backup, larm, korrelationsvyer)
- [x] API-nycklar skyddade
- [x] Chat-widget deployad

## Pausad
(inget)
