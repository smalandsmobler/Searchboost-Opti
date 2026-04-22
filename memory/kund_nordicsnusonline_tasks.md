---
name: Nordic Snus Online tasks
description: Nordic Snus Online task-checklista
type: project
---

# Nordic Snus Online — Tasks

**Status**: Aktiv
**Site**: https://nordicsnusonline.com/sv (WordPress, svenska WP-instansen)
**Bransch**: Nikotinpåsar, snus, tobaksfritt nikotin

## Affärsmodell — VIKTIGT
- **Provision: 70 öre per såld dosa** — Searchboost intäkt baseras på försäljningsvolym
- **Båda properties genererar cash** — Sverige (349251449) + Global (354592902)
- Enda marknadsföringskanal: AI-sök + organisk SEO (inga Google Ads / Meta tillåtet)
- **GA4 tracking KRITISK** — enda beviset för provisioner
- Measurement ID: **G-Z9R3KK4V5Y** (redan installerat på nordicsnusonline.com/sv)
- GA4 property IDs: Sverige 349251449 / Global 354592902
- Behöver verifiera: purchase events + quantity (dosor) registreras korrekt

## Nästa steg
- [ ] Bygg Google Sheet: daglig/veckovis rapport med antal dosor + provision (qty × 0,70 kr) — hämtar data via GA4 Data API
- [ ] Verifiera att purchase events + quantity registreras i GA4 (kolla DebugView eller realtime)
- [ ] Kolla om Global-propertyn (354592902) har samma measurement ID eller en separat
- [ ] Ny batch artiklar vecka 25
- [ ] **FREDAG 25 APRIL — möte**: gå igenom strategi-doc `presentations/nordic-snus-mote-2026-04-25.md`. Föreslå sprint-paket A (programmatisk SEO 33k engång) + B (LinkedIn ghostwriter 2,5k/mån)

## Klart 2026-04-22 (nattjobb)
- [x] **Interlinking 44/44 artiklar** (alla SEO-artiklar) — "Relaterade artiklar"-block med 3 ämnesmatchade länkar (nikotin/vit/styrka/recension/guide/lag) + landningssidor /sv/snus/all-white/, /sv/snus/nicotine-free/, /sv/varumarken/
- [x] **Mötesunderlag fredag 25 april** — `presentations/nordic-snus-mote-2026-04-25.md`. 14 spår (programmatic SEO, jämförelsesidor, YouTube, LinkedIn, email, subscription, etc), pris/effort-matris, konkret sprint-paket att sälja in.
- [x] **SEO-grund verifierad OK**: Sitemap (434 URLer, 7 sub), robots.txt redan härdad, Rank Math emittar full schema + 13 OG-tags, llms.txt auto-genererad, multilingual Polylang SV/EN, CookieHub + Consent Mode v2, GA4 G-Z9R3KK4V5Y aktiv. Rank Math fungerar perfekt — ingen SEO-head-emitter behövs.

## Klart 2026-04-21 (vecka 24)
- [x] 3 artiklar publicerade vecka 24 (nordicsnusonline.com/sv):
  - ID:23846 /sv/g3-nikotinpasar-recension/ (focus: g3 nikotinpåsar)
  - ID:23847 /sv/nikotinpasar-styrka-komplett-guide/ (focus: nikotinpåsar styrka)
  - ID:23848 /sv/kopa-nikotinpasar-online-guide/ (focus: köpa nikotinpåsar online)
- [x] Rank Math SEO satt via `/sv/wp-json/rankmath/v1/updateMeta` (svar: slug: True)

## Pausad
(inget)

## Referenser
- `kunder.md`
