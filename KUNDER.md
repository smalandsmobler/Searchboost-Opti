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
| wedosigns | SAKNAS | — | SAKNAS | mail@wedosigns.se | Delvis |
| ferox | SAKNAS | — | SAKNAS | Andreas.Sternberg@feroxkonsult.se | Ej aktiv |

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

## Ferox Konsult

**Sajt**: feroxkonsult.se
**Saknas**: WP app-password + GSC + keywords
**Viktors uppgift**: Kontakta kunden — all onboarding saknas

---

## Nordic Snus Online (prospect)

**Avtal**: 8 000 kr/mån Premium (ej signerat)
**Nyckelvinkel**: Kan inte använda Google Ads/Meta → AI-sök är enda kanalen
