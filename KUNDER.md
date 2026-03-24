# Kunder — Searchboost Opti

> Delad fil. Mikael + Viktor ser samma info. Uppdatera när något ändras.
> Senast uppdaterad: 2026-02-20

---

## Automationsstatus

| Kund | WP-creds | GSC | Keywords | Portalkon to | Status |
|------|----------|-----|----------|--------------|--------|
| searchboost | OK | OK | OK | — | Aktiv |
| kompetensutveckla | OK | OK | OK | mikael.n@kompetensutveckla.se | Aktiv |
| ilmonte | OK | Ej ägare | OK | peter.vikstrom@ilmonte.se | Aktiv (ingen GSC-data) |
| mobelrondellen | OK | OK | OK | mattias@mobelrondellen.se | Aktiv |
| phvast | OK | OK | OK | arnman@phvast.se | Aktiv |
| tobler | OK | — | OK | jakob@tobler.se | Aktiv |
| traficator | OK | — | OK | patrik.carlsson@traficator.se | Aktiv |
| smalandskontorsmobler | SAKNAS | OK | OK | mikael@smalandskontorsmobler.se | Delvis |
| wedosigns | SAKNAS | 403 | OK | mail@wedosigns.se | Delvis |
| ferox | SAKNAS | — | SAKNAS | Andreas.Sternberg@feroxkonsult.se | Ej aktiv |
| jelmtech | OK | 403 | OK (30 st) | camilla.lundstrom@jelmtech.se | Aktiv |
| nordicsnusonline | placeholder | — | OK (29 st) | — | Uppstart |

**SAKNAS** = WordPress app-password inte inlagt. Kunden är registrerad men automatisk optimering är avstängd.

### Aktivera en kund fullt ut
1. Kunden genererar Application Password i WP-admin → Viktor lägger in via Dashboard
2. GSC: lägg till service account som "Fullständig" → Viktor lägger in property-URL via Dashboard
3. ABC-nyckelord: mata in via Dashboard
4. Åtgärdsplan: generera via AI eller manuellt

---

## Smålands Kontorsmöbler (SMK)

**Sajt (ny)**: ny.smalandskontorsmobler.se (GeneratePress + WooCommerce)
**Domän (live)**: smalandskontorsmobler.se (Abicart — gammalt, ska fasas ut)
**Deal**: 6 mån × 7 000 kr/mån = 42 000 kr (WooCommerce-migrering)

**Nuläge:**
- 896 produkter importerade
- ~3 700 produkter saknar bilder (pågår)
- 46/47 kategoritexter klara
- 4 blogginlägg publicerade
- Pending: Rank Math PRO, schema-markup, Swedbank Pay (kunden fixar själv)

**Viktors uppgifter:**
- Håll koll på bildimporteringen — fråga Claude om status
- Rank Math PRO: aktivera licens när den kommer via mail till mikael@searchboost.se
- Schema-markup: Claude kör detta när Rank Math PRO är aktivt

---

## Kompetensutveckla

**DEV-sajt**: kompetensutveckla.hemsida.eu (bygg här FÖRST)
**Live-sajt**: kompetensutveckla.se (RÖR INTE — fullt av redirects)

**Nuläge:**
- Hosting: Hjältebyrån AB (Oderland), 18 GB disk (frigjort plats feb 13)
- Plan: Ersätt EduAdmin med WooCommerce + kurshanteringsplugins
- Trafik: ~300 besökare/mån, mål förstasidan inom 12 mån
- 142 trasiga URL:er identifierade — wildcard .htaccess-fix planerad

**Viktors uppgifter:**
- Bygg ny struktur på DEV-sajten (kompetensutveckla.hemsida.eu)
- Claude granskar mot SOPs innan något publiceras

---

## Möbelrondellen

**Sajt**: mobelrondellen.se
**OBS**: Sucuri WAF — curl ger HTTP 455 men sidan fungerar i browser. Normalt.

**Utfört:**
- Kontaktsidan: CF7-formulär städat
- Varumärken-sidan: shortcode-bugg fixad, HTML-grid med 18 varumärken
- Slider Revolution: verifierad OK
- Plugin-cleanup: 325 → 7 plugins

---

## Phvast

**Sajt**: phvast.se
**Status**: Aktiv, automation kör

---

## Il Monte

**Sajt**: ilmonte.se
**GSC**: Searchboost är inte ägare → be ilmonte-ägaren lägga till service account
**Keywords**: 30 st inlagda (9A + 14B + 7C)

---

## Tobler

**Sajt**: tobler.se
**Status**: Aktiv, GSC ej kopplat ännu

---

## Traficator

**Sajt**: traficator.se
**Status**: Aktiv, GSC ej kopplat ännu

---

## We Do Signs

**Sajt**: wedosigns.se
**Saknas**: WP app-password + keywords
**Viktors uppgift**: Be kunden generera Application Password + mata in nyckelord

---

## Jelmtech Produktutveckling AB

**Sajt**: jelmtech.se
**Kund-ID**: jelmtech
**Avtal**: 8 000 kr/mån SEO Premium — AKTIV
**WP**: mikael_searchboost / SSM (OK)
**GSC**: 403 — SA borttagen, lägg till igen: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
**Keywords**: 30 st inlagda (10A + 10B + 10C)
**Åtgärdsplan**: 3 månader, 24 uppgifter
**Kontakt**: Camilla Lundström — camilla.lundstrom@jelmtech.se
**Trello**: Jelmtech — 3 mån SEO (8000 kr/mån) Premium ✅ kommenterat 2026-03-24
**Onboardad**: 2026-03-24

**Månad 1-prio:**
1. Rank Math SEO PRO installera
2. Language sv-SE
3. Meta descriptions 48 sidor
4. H1-taggar 19 sidor
5. URL-sanering /uncategorized/ → /blogg/
6. Schema markup

---

## Ferox Konsult

**Sajt**: feroxkonsult.se
**Saknas**: WP app-password + GSC + keywords
**Viktors uppgift**: Kontakta kunden — all onboarding saknas

---

## Nordic Snus Online (uppstart)

**Sajt**: nordicsnusonline.com
**Kund-ID**: nordicsnusonline-com
**Avtal**: 8 000 kr/mån SEO Premium (ej signerat)
**Pipeline-stage**: uppstart
**Nyckelvinkel**: Kan inte använda Google Ads/Meta → AI-sök är enda kanalen
**ABC-nyckelord**: 29 st inlagda (~37 000 sök/mån) — 9 A, 10 B, 10 C
**Åtgärdsplan**: 3 månader, 24 uppgifter inlagda i systemet
**SSM**: URL + company-name + gsc-property skapade (WP-creds = placeholder)
**Saknas**: WP app-password, GSC SA-access, kontraktssignering
**Onboardad**: 2026-03-24
