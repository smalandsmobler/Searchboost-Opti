# 20 — Onboarding (detaljerat flöde)

> Verifierat 2026-05-31. Komplett kund-onboarding från första kontakt till "kundens kanaler dyker upp i opti.searchboost.se/customers-overview.html".

## Flöde i fyra steg

```mermaid
flowchart LR
  P[Prospekt fyller i form<br/>på sin egen WP-sajt] --> A[/api/onboard<br/>Express på EC2]
  A --> B[(BQ: customer_pipeline<br/>customer_channels<br/>customer_tasks)]
  B --> C[Lambda<br/>keyword-researcher]
  C --> D[(BQ: action_plans)]
  D --> E[autonomous-optimizer<br/>börjar plocka tasks]
  E --> F[Veckorapport fre 15:00<br/>+ Looker Studio-länk]
```

## Steg 1 — Formuläret på kundens sajt

WP-plugin `searchboost-onboarding` v1.2.0+ exponerar shortcode `[searchboost_uppstart]`.

### Sektioner i formuläret (efter detaljerings-uppdatering 2026-05-31)

| Sektion | Fält | Krav |
|---------|------|------|
| **Företagsinformation** | company_name, contact_person, contact_email | company_name + email = krav |
| **WordPress** | wordpress_url, wordpress_username, wordpress_app_password | alla = krav |
| **Google Search Console** | gsc_property | valfritt (men starkt rek) |
| **Google Analytics 4** | ga_property_id | valfritt |
| **Google Tag Manager** | gtm_id | valfritt |
| **Google Ads** | google_ads_id | valfritt |
| **Meta Pixel** | meta_pixel_id | valfritt |
| **Strategi & mål** *(nytt)* | industry, geographic_focus, primary_goal, competitors, brand_tone, target_audience | valfritt — men optimizern blir mer riktad om ifyllt |
| **Kanaler idag** *(nytt)* | linkedin_url, facebook_url, instagram_handle, twitter_handle, budget_google_ads_sek, budget_meta_ads_sek | valfritt — driver customer_channels-seedning |
| **Rapporter & uppföljning** *(nytt)* | weekly_recipients, preferred_channel, constraints | valfritt |

### Stilregler i formuläret
- Brand-färger via inline CSS (matchar Searchboost-pink + dark mode-känsla)
- Pluginens egen vita bakgrund (inte kundens sajt-tema) — vi äger upplevelsen
- Två-kolumns-grid på desktop, 1-kolumn på mobil
- Submit-knapp = pink gradient + lift-on-hover (matchar `--sb-btn-primary` i brand.css)

## Steg 2 — `/api/onboard` Express-handler

Tar emot POST med formulärdata. Validerar:
1. Required-fält finns
2. WordPress-URL svarar HTTP 200
3. App-password fungerar mot `/wp-json/wp/v2/users/me` → HTTP 200

Vid lyckad validering:
1. **SSM:** sparar `/seo-mcp/wordpress/<slug>/{url,username,app-password}` + `/seo-mcp/integrations/<slug>/{contact-email,contact-person,ga4-property-id,gsc-property,...}`
2. **BQ `customer_pipeline`:** insert med `stage='onboarding'` (eller `'aktiv'` om alla creds verifieras)
3. **BQ `customer_channels`:** seedar med `seo=active` + `content=planned` + ev. linkedin/google_ads om URL:er angivna
4. **Bekräftelsemail** till kontakt-email + Mikael
5. **Triggar Lambda `seo-keyword-researcher`** → börjar producera ABC-sökord

## Steg 3 — `seo-keyword-researcher` (Lambda)

Läser från `customer_pipeline` + scrapar kundens sajt + GSC-data (om GSC angivet). Producerar:
- ABC-sökord (tre tiers: A = high-intent, B = medium, C = long-tail) → BQ `customer_keywords`
- Förslag på top 20 åtgärder → BQ `action_plans` med `month=CURRENT_MONTH()`

## Steg 4 — `autonomous-optimizer` (Lambda)

Var 6:e timme. Läser `action_plans` för aktiv månad → kör optimering via OpenRouter → skriver meta/schema till WP via REST API → loggar `seo_optimization_log`.

Detalj i [02-optimizer.md](02-optimizer.md).

## Bekräftelse till kunden

Direkt efter inskick:
1. **Mail till kontakt-email**: "Tack, vi har fått era uppgifter. Här är vad som händer härnäst:" (förvänta-tabell + tidsplan)
2. **Mail till mikael@searchboost.se**: "Ny kund onboardad: <namn>, kreditcheck = OK, kanaler = SEO + LinkedIn"

## Anti-friktion: vad vi gör innan kunden frågar

| Friktion | Vår åtgärd |
|----------|------------|
| "Hur skapar jag app-password?" | Steg-för-steg-guide direkt i formuläret (utfälld) |
| "Vart hittar jag GA4-property-ID?" | Tooltip per fält + screenshot-länk |
| "Vad gör ni egentligen?" | Bekräftelsemailet förklarar vecko-rytmen |
| "Hur ser min rapport ut?" | Länk till exempel-Looker-Studio i bekräftelsemailet |
| "Får jag ändra något senare?" | Ja — kundzonen `kundzon.searchboost.se` har inställningar (kommer i nästa pass) |

## Opt-in: Plausible-tracker

Plugin-aktivering installerar automatiskt Plausible-trackern i `<head>` (`plausible-tracker.php`). Default på. Settings → SB Onboarding → "Plausible tracker" för att stänga av per sajt.

## Opt-in: AI-crawler-stöd

Plugin servar `/llms.txt` baserat på `searchboost_llms_txt`-option (uppdateras av `seo-llms-txt-generator` Lambda) — så ChatGPT/Perplexity kan crawla rätt content-summary.

## GÖR vs BORDE GÖRA

| Område | GÖR idag | BORDE GÖRA (gap) |
|--------|----------|-------------------|
| Formulär-fält | ✅ Detaljerat (10 sektioner efter 2026-05-31) | — |
| Validering server-side | ⚠️ Bara required-check + WP-ping | Validera GSC-property finns i kundens GSC-konto, validera GA4-property hör till samma org |
| customer_channels-seedning | ⚠️ Manuell nu | `/api/onboard` ska auto-skapa rader baserat på vilka URL:er/IDs kunden angav |
| Bekräftelsemail | ⚠️ Bara till kontakt-email | Lägg in Looker-Studio-länk + tidsplan + nästa-steg |
| Kundzon-edit | ❌ | Bygg redigeringsläge i `kundzon.searchboost.se` så kunden själv kan justera tonalitet, mål, konkurrenter |
| Prospect → kund-konvertering | ⚠️ Manuell | Auto-flytta från `prospect_seo_scores` → `customer_pipeline` vid första betalda månad |
| Slack-notis till Mikael | ❌ | Webhook när ny kund onboardas |
