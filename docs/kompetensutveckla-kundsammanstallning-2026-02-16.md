# Kompetensutveckla.se — Kundsammanstallning

**Datum:** 2026-02-16
**Kund:** Kompetensutveckla.se (arbetsmiljoutbildningar online + klassrum)
**Kontakt:** (via cPanel mikael@kompetensutveckla.se)
**Hosting:** Hjaltebyran AB / Oderland, ~9000 kr/ar, 18 GB disk
**CMS:** WordPress 6.9.1 + EduAdmin (kurshantering)

---

## Utfort arbete — Sammanfattning

### 1. SEO-audit & rapport (2026-02-12)
- **Fil:** `presentations/kompetensutveckla-seo-rapport-2026.md`
- **Resultat:**
  - DIR 50, 2 199 referring domains, 7 907 backlinks — stark langprofil
  - 36 av 50 sokord i top 10 — men bara 37 klick/man (CTR 0.4%)
  - Huvudproblem: Daliga meta-titlar, 142 trasiga URL:er, kaotisk kategoristruktur
  - Potential: Fran 37 till 500+ klick/man inom 3 manader

### 2. Meta-titel & beskrivningsoptimering (2026-02-15)
- **Fil:** `docs/kompetensutveckla-meta-optimering.sql`
- **Omfattning:** 11 sidor, 23 UPDATE + 1 INSERT i Rank Math-meta
- **Sidor som optimerats:**
  | Sida | Post ID | Sokord | Position |
  |------|---------|--------|----------|
  | AFS | 2349 | "afs" | 2.9 |
  | BAM (huvudsida) | 8370 | "bam" | 3.5 |
  | BAM 2 dagar | 320 | "bam utbildning" | ~5 |
  | Sakra Lyft | 5762 | "sakra lyft utbildning" | 3.3 |
  | KEDS | 5478 | "keds tolkning" | 1.2 |
  | KEDS-test | 13040 | "keds test" | — |
  | Friskfaktorer | 565 | "friskfaktorer" | 3.3 |
  | SAM (utbildning) | 183 | "sam utbildning" | — |
  | SAM (huvudsida) | 8115 | "sam" | — |
  | OSA (huvudsida) | 9903 | "osa utbildning" | — |
  | OSA Online | 5066 | "osa online" | — |
  | Kompetensutveckling | 9003 | "kompetensutveckling" | — |
- **Forvantat resultat:** +80-130 extra klick/manad fran forbattrad CTR
- **Status:** SQL redo att koras i phpMyAdmin (ej exekverad annu — kunden behover gora backup forst)

### 3. Redirect-lista (2026-02-12)
- **Fil:** Dokumenterad i SEO-rapporten
- **Omfattning:** 142 trasiga URL:er med 971 forekomster av brutna lankar
- **Losning:** .htaccess wildcard-redirects
- **Status:** Redo att implementeras via cPanel File Manager

### 4. Strukturforslag (2026-02-12)
- **Fil:** `presentations/kompetensutveckla-strukturforslag.md`
- **Sammanfattning:** Ny kategoristruktur, kurssidor, kunskapsbas-uppbyggnad

### 5. Implementeringsguide (2026-02-12)
- **Fil:** `presentations/kompetensutveckla-implementeringsguide.md`

### 6. Hosting-optimering (2026-02-13)
- Raderade kompetens.hemsida.eu (gammal WP-installation, 950 MB)
- Frigjorde ~5-8 GB diskutrymme (fran 96% till ~65% fullt)
- Backup sparad: `wordpress-backups/kompetens.hemsida.eu__2026-02-13T19_41_41+0100.tar.gz`

---

## Nasta steg — Vad som aterkstar

### Prioritet 1: Kora SQL-optimeringar
1. **Kunden tar backup** av databasen via cPanel/phpMyAdmin
2. **Kor SQL:en** i phpMyAdmin (kompetens_wp168.www_postmeta)
3. **Verifiera** att nya titlar syns pa sajten (view-source)
4. Forvantat: +80-130 klick/man inom 2-4 veckor

### Prioritet 2: Fixa redirects
1. Lagg till .htaccess-regler via cPanel File Manager
2. Testar med curl att redirects fungerar
3. Forvantat: Battre UX, minskad bounce rate, forbattrad crawl-effektivitet

### Prioritet 3: EduAdmin → WooCommerce-migrering
- EduAdmin ar dyrt och begransande
- Plan: Ersatt med WooCommerce + kurshanteringsplugins
- Kravspecifikation finns i implementeringsguiden
- **Kunden maste fatta beslut** om detta

### Prioritet 4: Kunskapsbas-uppbyggnad
- 200+ gratisresurser (checklistor, mallar) bor synliggoras
- Egna landningssidor per resurs
- Intern lankning fran kursidor till kunskapssidor

---

## Ekonomi

| Post | Belopp |
|------|--------|
| Manadsavgift | (att bestamma) |
| Utfort arbete hittills | SEO-audit, meta-optimering, redirect-lista, strukturforslag |
| Forvantat resultat | +80-130 klick/man (konservativt), potential 500+ klick/man |
| ROI-berakning | Varje klick till utbildning = ca 50-200 kr varde → 4000-26000 kr/man i trafikvarde |

---

## Filer relaterade till kunden

| Fil | Beskrivning |
|-----|-------------|
| `presentations/kompetensutveckla-seo-rapport-2026.md` | Komplett SEO-rapport |
| `presentations/kompetensutveckla-strukturforslag.md` | Ny kategoristruktur |
| `presentations/kompetensutveckla-implementeringsguide.md` | Steg-for-steg-guide |
| `docs/kompetensutveckla-meta-optimering.sql` | 23 UPDATE + 1 INSERT |
| `docs/kompetensutveckla-kundsammanstallning-2026-02-16.md` | Denna fil |

---

## Systemstatus

| Parameter | Varde |
|-----------|-------|
| BigQuery customer_id | kompetensutveckla |
| Pipeline-stadium | active |
| GSC SA tillagd | Ja |
| GSC Property | https://kompetensutveckla.se/ |
| WP credentials | placeholder (behover app-password) |
| ABC-nyckelord | Ja (50+ via GSC-data) |
| Atgardsplan | Ja (3 manader) |
| Automatisk optimering | Nej (saknar WP app-password) |
