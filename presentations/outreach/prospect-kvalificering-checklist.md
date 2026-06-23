# Prospect-kvalificering — 5-minuters check

**Gör detta innan du skickar cold email eller bokar samtal.**
Eliminerar tidsspill på dåliga leads innan du investerar dem.

---

## Steg 1 — Domän + teknisk bas (1 min)

Kör detta i terminalen:

```bash
DOMAIN="exempel.se"
# Grundläggande check
curl -sIL -A "Mozilla/5.0" -o /dev/null -w "status: %{http_code}\ntime: %{time_total}s\nsize: %{size_download}\n" "https://$DOMAIN/"

# CMS-detektering
curl -sL -A "Mozilla/5.0" "https://$DOMAIN/" | grep -oE 'wp-content|shopify|wix|squarespace|magento|webflow' | sort -u

# Mobile-viewport
curl -sL -A "Mozilla/5.0 (iPhone)" "https://$DOMAIN/" | grep -c "viewport"

# HTTPS-cert
curl -sv "https://$DOMAIN/" 2>&1 | grep -E "SSL certificate|CN ="
```

**Green flags:**
- WordPress, Shopify, Magento (vi kan nå via REST)
- HTTPS med giltigt cert
- Viewport-meta finns
- Laddningstid under 3 sekunder

**Red flags:**
- Custom PHP utan API (Joomla, Drupal osv)
- Wix, Squarespace (begränsad kontroll)
- HTTP utan TLS
- Sajten ligger nere eller långsam (> 5 s)

---

## Steg 2 — Ranking-potential (2 min)

Kör Playwright+Lighthouse eller manuellt:

```bash
# Mobile screenshot + problem-scan
python3 /tmp/playwright_check.py "$DOMAIN"
```

**Eller manuellt via PSI:**
https://pagespeed.web.dev/analysis?url=https://DOMAIN

**Vad du letar efter:**

| Metric | Green | Gul | Röd |
|---|---|---|---|
| Performance (mobile) | 70+ | 40-70 | < 40 |
| LCP | < 2.5s | 2.5-4s | > 4s |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| Accessibility | 90+ | 70-90 | < 70 |
| SEO score | 90+ | 70-90 | < 70 |

**Röda siffror = bra prospect.** Det betyder att det finns mycket
att fixa och de har troligen märkt problemet.

---

## Steg 3 — SEO-nuläge (1 min)

Öppna SEMrush/Ubersuggest/Ahrefs (eller gratis: neilpatel.com):

```
DOMAIN-traffic estimate: ___
DOMAIN-keywords: ___
DOMAIN-backlinks: ___
DOMAIN-domain authority: ___
```

**Sweet spot-prospects:**
- Traffic 500-5000 visits/mån (nog data att mäta, potential att växa)
- 50-500 keywords (grunden finns)
- DA 15-40 (inte noll, inte dominerande)

**Varning:**
- Traffic 0 = inget att optimera från
- Traffic 50 000+ = troligen har egen SEO-avdelning

---

## Steg 4 — Företagskvalificering (1 min)

Google företaget:

```
{företag} org.nummer
{företag} omsättning
{företag} anställda
{företag} + linkedin
```

**Minimum för Starter (9 900 kr/mån):**
- Omsättning 2+ MSEK
- 3+ anställda
- Aktivt bolag (senaste årsredovisningen ej äldre än 2 år)

**Pro (18 900 kr/mån):**
- Omsättning 10+ MSEK
- 10+ anställda
- Aktiv marknadsföring (synlig i Google Ads eller LinkedIn)

**Enterprise (34 900 kr/mån):**
- Omsättning 50+ MSEK
- Egen marknadsavdelning eller hard-pressed att skala

---

## Steg 5 — Kontaktperson (30 sek)

Leta upp rätt person på LinkedIn:
- **Prio 1:** Marknadschef / CMO / Marknadsansvarig
- **Prio 2:** VD (om företaget < 20 anställda)
- **Prio 3:** E-handelschef / Webmaster
- **INTE:** Reception / sales@ / info@

Hämta deras företagsmail (LinkedIn + hunter.io + clearbit).

---

## Scorecard

Ge prospectens poäng 1-5 på varje punkt:

| Kategori | 1 (dåligt) | 5 (utmärkt) | Poäng |
|---|---|---|---|
| Teknisk reachability | Wix/custom | WP/Shopify + REST | ___/5 |
| Ranking-potential | Traffic > 50k ELLER 0 | 500-5000 med luckor | ___/5 |
| SEO-luckor | Redan perfekt | Många quick wins | ___/5 |
| Företagsstorlek | Fel-sized | Exakt matchar paket | ___/5 |
| Kontaktperson | Sales@ | Direkt CMO på LinkedIn | ___/5 |

**Totalt:**

- **20-25:** A-lead. Skicka cold email inom 24h, följ upp aktivt.
- **15-19:** B-lead. Skicka cold email, en uppföljning, låt bli om inget svar.
- **10-14:** C-lead. Inkludera i nyhetsbrev men jaga inte.
- **< 10:** Skippa. Tidsspill.

---

## Spårningsformulär

Logga varje kvalificerad prospect i BQ `customer_pipeline`:

```sql
INSERT INTO customer_pipeline (
  customer_id, company_name, contact_person, contact_email,
  website_url, stage, initial_traffic_trend, service_type,
  analysis_score, analysis_summary
) VALUES (
  'xyz',
  '{Företag AB}',
  '{Förnamn Efternamn}',
  '{email}',
  'https://{domän}',
  'prospect',
  '{upp/ner/platt}',
  'seo',
  {1-25 scorecard},
  '{3 quick-wins}'
);
```
