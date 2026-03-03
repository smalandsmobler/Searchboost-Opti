# Searchboost Prospect Scanner — Teknisk spec

**Kodnamn:** "Maskinen"
**Syfte:** Mata in 100 domäner → få ut kvalificerade leads med kontaktinfo + SEO-problem → auto-mejl → Mikael ringer

---

## Flöde

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STEG 1: INPUT                                                │
│   ─────────────                                                │
│   A) Klistra in 100 domäner manuellt                           │
│   B) Skrapa bransch från allabolag.se/proff.se                 │
│      → filtrera: har hemsida, omsättning >1M, <50 anställda   │
│                                                                 │
│   Output: Lista med domäner                                    │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STEG 2: KONTAKTSKRAPA                                        │
│   ─────────────────────                                        │
│   Per domän, hämta:                                            │
│   • Företagsnamn (från allabolag via orgnr eller domän)        │
│   • VD / firmatecknare                                         │
│   • E-post (från sajten: kontakt-sida, footer, /about)        │
│   • Telefon                                                    │
│   • Adress + ort                                               │
│   • Omsättning + antal anställda                               │
│   • CMS (WordPress? Shopify? Squarespace? Custom?)             │
│                                                                 │
│   Output: JSON med kontaktdata per domän                       │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STEG 3: SEO-SCANNER (den tunga delen)                        │
│   ─────────────────────────────────────                        │
│   Per domän, kontrollera:                                      │
│                                                                 │
│   A) SIDANTAL                                                  │
│      • Crawla sitemap.xml → räkna URL:er                       │
│      • Om ingen sitemap: Google "site:domän.se" → räkna        │
│      • Flagga: <10 sidor ELLER >1000 sidor                    │
│                                                                 │
│   B) ORDANTAL (thin content)                                   │
│      • Hämta startsida + 5 slumpmässiga undersidor             │
│      • Strippa HTML → räkna ord                                │
│      • Flagga: sidor med <200 ord = "thin content"             │
│      • Räkna: X av Y testade sidor har thin content            │
│                                                                 │
│   C) LADDTID                                                   │
│      • Google PageSpeed Insights API (gratis, 25k req/dag)     │
│      • Hämta: Performance score, LCP, FCP, CLS, TBT           │
│      • Flagga: Performance <50 = "superslö"                    │
│      • Flagga: LCP >4s = "kritiskt långsam"                   │
│                                                                 │
│   D) SITEMAP                                                   │
│      • Kolla /sitemap.xml, /sitemap_index.xml                  │
│      • Kolla robots.txt för Sitemap:-rad                       │
│      • Flagga: ingen sitemap = "Google hittar inte era sidor"  │
│      • Om sitemap finns: räkna URL:er, kolla status (200/404)  │
│      • Flagga: >10% trasiga URL:er i sitemap = "trasig sitemap"│
│                                                                 │
│   E) REDIRECTS & TRASIGA LÄNKAR                                │
│      • Crawla 50 interna länkar                                │
│      • Räkna: 301/302 redirects, 404:or, redirect chains      │
│      • Flagga: >5 redirects = "redirect-röra"                  │
│      • Flagga: >3 404:or = "trasiga sidor"                     │
│                                                                 │
│   F) META & SEO-BASICS                                         │
│      • Startsida: title, description, H1                       │
│      • Flagga: saknad title (<65 tecken), saknad description   │
│      • Flagga: title = "Home" eller domännamn                  │
│      • Kolla: robots.txt (finns?), canonical-taggar            │
│      • Kolla: HTTPS (eller bara HTTP?)                         │
│      • Kolla: mobilanpassad (viewport meta)                    │
│                                                                 │
│   G) TRAFIK-TREND (bonus, om möjligt)                          │
│      • SimilarWeb API / SEMrush API / SE Ranking backlinks     │
│      • Alternativ: Wayback Machine → kolla om sajten krympt    │
│      • Flagga: nedåtgående trend = "tappar trafik"             │
│                                                                 │
│   H) WORDPRESS-DETECTION                                       │
│      • Kolla: <meta name="generator" content="WordPress">      │
│      • Kolla: /wp-content/, /wp-includes/ i källkoden          │
│      • Kolla: /wp-json/ returnerar JSON                        │
│      • Kolla: Link-header med wp-json                          │
│      • Tagga: "WordPress" / "Shopify" / "Wix" / "Annat"       │
│                                                                 │
│   Output: SEO-rapport per domän med poäng 0-100                │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STEG 4: SCORING & FILTRERING                                 │
│   ───────────────────────────                                  │
│                                                                 │
│   Poängsystem (ju SÄMRE sajt = ju BÄTTRE lead):                │
│                                                                 │
│   +20 poäng: WordPress-sajt (vi kan fixa direkt)               │
│   +15 poäng: Thin content (>50% av sidor <200 ord)            │
│   +15 poäng: Superslö (PageSpeed <50)                          │
│   +15 poäng: Ingen sitemap                                     │
│   +10 poäng: Trasig sitemap (>10% döda URL:er)                │
│   +10 poäng: Massa redirects (>5 st)                           │
│   +10 poäng: Trasiga sidor (>3 st 404)                         │
│   +10 poäng: Saknar meta title/description                     │
│   +10 poäng: Bara HTTP (ingen HTTPS)                           │
│   +10 poäng: Inte mobilanpassad                                │
│   +5 poäng:  Nedåtgående trafik-trend                          │
│   ────────                                                     │
│   Max: 130 poäng                                               │
│                                                                 │
│   FILTER:                                                      │
│   • Score ≥40 = "Skicka mejl" (tillräckligt dålig)            │
│   • Score ≥70 = "Ring direkt" (akut behov)                    │
│   • Score <40 = "Skippa" (sajten funkar OK)                   │
│   • WordPress = prioritera (vi levererar snabbast)             │
│                                                                 │
│   Output: Sorterad lista, värst först                          │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STEG 5: AUTO-MEJL                                            │
│   ────────────────                                             │
│                                                                 │
│   Claude genererar personligt mejl per lead:                   │
│                                                                 │
│   ─── MALL ───                                                 │
│                                                                 │
│   Ämne: {Företagsnamn} — jag hittade {X} saker på er sajt     │
│                                                                 │
│   Hej {VD-förnamn},                                            │
│                                                                 │
│   Jag heter Mikael och driver Searchboost. Jag var inne        │
│   på {domän} och reagerade på ett par saker:                   │
│                                                                 │
│   {problem_1 — specifikt, t.ex. "Er startsida har bara        │
│    89 ord — Google ser det som 'thin content' och              │
│    rankar ner er"}                                             │
│                                                                 │
│   {problem_2 — specifikt, t.ex. "Sajten laddar på 6.2         │
│    sekunder — besökare lämnar efter 3"}                        │
│                                                                 │
│   {problem_3 — specifikt, t.ex. "Ni saknar sitemap.xml        │
│    — Google vet inte vilka sidor ni har"}                      │
│                                                                 │
│   Jag har gjort en kort analys och skulle gärna visa er        │
│   vad som kan göras. Har ni 15 minuter denna vecka?           │
│                                                                 │
│   /Mikael Larsson                                              │
│   Searchboost — SEO för svenska företag                        │
│   mikael@searchboost.se | 07X-XXX XX XX                       │
│                                                                 │
│   ─── SLUT MALL ───                                            │
│                                                                 │
│   Skickas via: SES från sekundär domän                         │
│   Rate: Max 50/dag (uppvärmning 3 veckor)                     │
│   Follow-up: Dag 3 + Dag 7 (automatiskt)                      │
│                                                                 │
│   Output: Mejl skickat, lead sparad i pipeline                 │
│                                                                 │
└───────────────────────┬─────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   STEG 6: PIPELINE & UPPFÖLJNING                               │
│   ──────────────────────────────                               │
│                                                                 │
│   Lead sparas i:                                               │
│   • BigQuery: customer_pipeline (stage="prospect-scanned")     │
│   • Trello: "Analys"-listan med all data                      │
│   • Dashboard: Synlig i Pipeline-vyn                           │
│                                                                 │
│   Mikael ringer:                                               │
│   "Hej {Namn}, det är Mikael från Searchboost. Jag har        │
│    verkligen försökt nå dig men har inte lyckats. Jag          │
│    tog mig friheten att göra en analys av er sajt              │
│    eftersom jag märkte att det var några saker som             │
│    inte stämmer..."                                            │
│                                                                 │
│   Mikaels pitch:                                               │
│   → Referera till specifika problem från scannern              │
│   → "Jag skickade er ett mejl med detaljerna"                  │
│   → "Vill ni att jag skickar hela rapporten?"                  │
│   → Boka 15-min genomgång → offert                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Teknisk implementation

### Filstruktur

```
scripts/
├── prospect-scanner/
│   ├── index.js              # Huvudscript — orkestrerar hela flödet
│   ├── contact-scraper.js    # Steg 2: Hämtar kontaktdata
│   ├── seo-scanner.js        # Steg 3: SEO-analys per domän
│   ├── scorer.js             # Steg 4: Poängsättning & filtrering
│   ├── email-generator.js    # Steg 5: Claude genererar mejl
│   ├── email-sender.js       # Steg 5: SES-utskick + follow-ups
│   └── config.js             # Konfiguration & tröskelvärden
```

### Beroenden

```json
{
  "dependencies": {
    "@google-cloud/bigquery": "redan installerad",
    "axios": "HTTP-requests",
    "cheerio": "HTML-parsing (lättviktig)",
    "node-fetch": "fetch API",
    "@anthropic-ai/sdk": "Claude för mejlgenerering",
    "@aws-sdk/client-ses": "e-postutskick",
    "@aws-sdk/client-ssm": "credentials"
  }
}
```

### SEO-scanner — Vad vi kollar och hur

| Check | Metod | API/Verktyg | Kostnad |
|-------|-------|-------------|---------|
| Sidantal | Hämta /sitemap.xml, parse XML | axios + cheerio | 0 kr |
| Ordantal | Hämta HTML, strippa taggar, räkna ord | cheerio | 0 kr |
| Laddtid | PageSpeed Insights API | Google PSI API (gratis) | 0 kr |
| Sitemap | HEAD /sitemap.xml + /robots.txt | axios | 0 kr |
| Redirects | Följa länkar, räkna 301/302/404 | axios (maxRedirects) | 0 kr |
| Meta-taggar | Parse <head> | cheerio | 0 kr |
| HTTPS | Testa http:// vs https:// | axios | 0 kr |
| Mobil | Kolla viewport meta-tag | cheerio | 0 kr |
| WordPress | Kolla generator, /wp-json/, /wp-content/ | axios + cheerio | 0 kr |
| Trafik-trend | SE Ranking backlinks (vi har API) | SE Ranking | ~1 credit/domän |

**Total kostnad per 100 domäner: ~50 kr** (Claude API för mejlgenerering)

### CMS-detection logic (pseudo)

```javascript
async function detectCMS(domain) {
  const html = await fetch(`https://${domain}`);
  const headers = html.headers;

  // WordPress
  if (html.includes('wp-content') || html.includes('wp-includes'))
    return 'WordPress';
  if (html.includes('<meta name="generator" content="WordPress'))
    return 'WordPress';
  if (headers['link']?.includes('wp-json'))
    return 'WordPress';

  // Shopify
  if (html.includes('cdn.shopify.com') || html.includes('Shopify.theme'))
    return 'Shopify';

  // Wix
  if (html.includes('wix.com') || html.includes('X-Wix-'))
    return 'Wix';

  // Squarespace
  if (html.includes('squarespace.com') || html.includes('sqsp'))
    return 'Squarespace';

  return 'Okänt/Custom';
}
```

### Scoring logic (pseudo)

```javascript
function scoreProspect(scan) {
  let score = 0;
  const flags = [];

  if (scan.cms === 'WordPress') {
    score += 20;
    flags.push('WordPress — vi kan optimera direkt');
  }

  if (scan.thinContentPercent > 50) {
    score += 15;
    flags.push(`${scan.thinContentPercent}% av sidorna har under 200 ord`);
  }

  if (scan.pagespeedScore < 50) {
    score += 15;
    flags.push(`PageSpeed ${scan.pagespeedScore}/100 — superslö`);
  }

  if (!scan.hasSitemap) {
    score += 15;
    flags.push('Saknar sitemap — Google hittar inte alla sidor');
  }

  if (scan.brokenSitemapPercent > 10) {
    score += 10;
    flags.push(`${scan.brokenSitemapPercent}% trasiga URL:er i sitemap`);
  }

  if (scan.redirectCount > 5) {
    score += 10;
    flags.push(`${scan.redirectCount} redirects — redirect-röra`);
  }

  if (scan.notFoundCount > 3) {
    score += 10;
    flags.push(`${scan.notFoundCount} trasiga sidor (404)`);
  }

  if (!scan.hasMetaTitle || !scan.hasMetaDesc) {
    score += 10;
    flags.push('Saknar meta title/description på startsidan');
  }

  if (!scan.isHttps) {
    score += 10;
    flags.push('Ingen HTTPS — Google varnar besökare');
  }

  if (!scan.isMobileOptimized) {
    score += 10;
    flags.push('Inte mobilanpassad — 60% av trafiken är mobil');
  }

  if (scan.trafficTrend === 'declining') {
    score += 5;
    flags.push('Nedåtgående trafiktrend');
  }

  return {
    score,
    flags,
    action: score >= 70 ? 'RING' : score >= 40 ? 'MEJLA' : 'SKIPPA'
  };
}
```

---

## Användning — Så kör Mikael maskinen

### Alternativ A: Manuell input (100 domäner)
```bash
# Kör med en textfil med domäner (en per rad)
node scripts/prospect-scanner/index.js --input domains.txt

# Eller med branschfilter från allabolag
node scripts/prospect-scanner/index.js --branch "restaurang" --lan "kronoberg" --max 100
```

### Alternativ B: Via Dashboard
Ny sektion i Dashboard: "Prospect Scanner"
- Textarea: Klistra in domäner (en per rad)
- Dropdown: Välj bransch (skrapar allabolag)
- Knapp: "Scanna" → progress bar → resultat
- Tabell: Domän | Score | Flaggor | Kontakt | Status
- Knappar per rad: "Skicka mejl" | "Lägg i pipeline" | "Skippa"

### Output-format (CSV + JSON)

```csv
domän,företag,vd,email,telefon,cms,score,action,flaggor
byggab.se,Bygg AB,Erik Svensson,erik@byggab.se,070-1234567,WordPress,85,RING,"Superslö (32/100), Thin content 67%, Saknar sitemap"
foretaget.se,Företaget AB,Anna Karlsson,info@foretaget.se,08-5551234,Wix,45,MEJLA,"Ingen HTTPS, Saknar meta desc"
```

---

## Kontaktskrapning — Källor

| Källa | Data | Metod |
|-------|------|-------|
| **Allabolag.se** | Företagsnamn, orgnr, VD, adress, omsättning | Apify scraper eller Chrome Extension |
| **Proff.se** | E-post, telefon, mobil, omsättning | Proff Extractor (Chrome) |
| **Sajten själv** | E-post, telefon (kontaktsida, footer) | Crawla /kontakt, /om-oss, /contact |
| **Merinfo.se** | VD, styrelse, adress | Selenium-scraper (GitHub) |
| **Google Maps** | Telefon, adress, öppettider | Google Places API (gratis 300 req/mån) |

### Prioriteringsordning
1. Proff.se (snabbast, mest komplett)
2. Allabolag.se (backup, mer finansdata)
3. Sajten själv (crawla kontaktsida)
4. Merinfo.se (styrelseinfo)

---

## E-post-infrastruktur

### Domän-setup
- **Primär:** searchboost.se / searchboost.se → ALDRIG för cold outreach
- **Sekundär:** searchboost-analys.se (köp på Loopia, ~99 kr/år)
- **DNS:** SPF + DKIM + DMARC → maximera leveransbarhet
- **Avsändare:** mikael@searchboost-analys.se

### Uppvärmning
| Vecka | Volym/dag | Totalt |
|-------|-----------|--------|
| 1 | 5 mejl | 35 |
| 2 | 15 mejl | 105 |
| 3 | 30 mejl | 210 |
| 4+ | 50 mejl | 350/vecka |

### Follow-up-sekvens
- **Dag 0:** Initialt mejl (personaliserat med SEO-problem)
- **Dag 3:** "Hej igen — kort sammanfattning av vad jag hittade"
- **Dag 7:** "Sista meddelandet — erbjuder 15 min gratis genomgång"
- **Dag 14:** Arkivera om ingen respons

### GDPR-compliance
- B2B-utskick under "berättigat intresse" (GDPR Art. 6.1.f)
- Tydlig avsändare + företagsinfo i varje mejl
- Opt-out-länk i varje mejl
- Spara samtycke/opt-out i BigQuery
- Radera kontaktdata vid begäran

---

## KPI:er att tracka

| Metrik | Mål |
|--------|-----|
| Domäner scannade/vecka | 200+ |
| Mejl skickade/vecka | 100-200 |
| Öppningsfrekvens | >40% |
| Svarsfrekvens | >3% |
| Samtal bokade/vecka | 5-10 |
| Kunder stängda/mån | 3-5 |
| MRR tillväxt/mån | +21 000 – 35 000 kr |

---

## Tidplan

| Dag | Aktivitet |
|-----|-----------|
| 1-2 | Bygga seo-scanner.js (core: sitemap, laddtid, ordantal, meta, WP-detect) |
| 3 | Bygga contact-scraper.js (allabolag + sajt-crawl) |
| 4 | Bygga scorer.js + email-generator.js (Claude-integration) |
| 5 | Bygga email-sender.js (SES + follow-up-logik) |
| 6 | Bygga Dashboard-UI ("Prospect Scanner"-sektion) |
| 7 | Köpa sekundär domän + DNS-setup + uppvärmning startar |
| 8-10 | Testa med 20 domäner, justera tröskelvärden |
| 11+ | Full produktion: 50-100 domäner/dag |

---

## Mikaels pitchmanus (efter mejl + scan)

```
"Hej {Förnamn}, det är Mikael från Searchboost.

Jag har verkligen försökt nå dig men har inte lyckats.
Jag tog mig friheten att göra en analys av er sajt
eftersom jag var inne på {domän} och märkte att det
var några saker som inte stämmer.

[Referera till TOP 1 problemet från scannern]

Jag skickade dig ett mejl med detaljerna — har du
sett det? Jag kan skicka hela rapporten om ni vill.

Det tar 15 minuter att gå igenom, och det kostar
ingenting. Har ni tid denna vecka?"
```
