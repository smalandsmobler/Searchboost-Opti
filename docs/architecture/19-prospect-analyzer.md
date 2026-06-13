# 19 — Prospekt-SEO-analys (2000+ domäner)

> Verifierat live 2026-05-31. Lättviktig scanner som kör 2000+ prospekt-domäner, skattar SEO-status från publik HTML utan kundåtkomst, segmenterar för BillionMail-utskick.

## Vad det är

Två-lagrad analyserare:

### Lager 1 — `lambda-functions/prospect-analyzer.js` (tung)
Full analys per prospect: WP REST API-crawl, GSC OAuth om kunden gett access, full Lighthouse via PSI, AI-presentation via Claude (tier3 Sonnet 4.6). Används när Mikael bestämmer sig för att gå djupt på en enskild prospect — t.ex. inför säljmöte.

### Lager 2 — `tools/prospect-analyzer/lightweight-scanner.cjs` (volym)
Bara `GET /`, `GET /robots.txt`, `GET /sitemap.xml`. Parsar `<title>`, `<meta name="description">`, H1, JSON-LD, OG-tags, viewport, bilder utan alt. Valfri PageSpeed (om `PSI_API_KEY` env satt). Concurrency 10, timeout 15s/domän. **2000 domäner ≈ 30-40 min med PSI, 10 min utan.**

Skriver per skannad domän till `seo-aouto.seo_data.prospect_seo_scores`.

## BQ-tabell `prospect_seo_scores`

Skapad 2026-05-31. Partitionerad per `DATE(scanned_at)`, klustrad på `segment, domain`. Kolumner:

| Grupp | Kolumner |
|-------|----------|
| Identitet | `domain`, `scanned_at` |
| HTTP | `http_status`, `is_https`, `is_mobile_responsive` |
| Meta | `has_meta_title`, `meta_title`, `has_meta_description`, `meta_description`, `has_h1`, `h1_count` |
| Tekniskt | `has_robots_txt`, `has_sitemap`, `has_schema`, `has_open_graph` |
| Lighthouse | `pagespeed_performance`, `pagespeed_seo`, `pagespeed_accessibility` |
| Innehåll | `word_count`, `image_count`, `images_missing_alt`, `internal_link_count`, `external_link_count` |
| Sammansatt | `overall_score` (0-100), `segment` ('bad' \| 'medium' \| 'good'), `problems[]`, `recommendations[]` |
| Uppföljning | `email_sent`, `email_sent_at` |

## Score-modell

Startar på 100, drar av per problem:

| Problem | Avdrag |
|---------|--------|
| Saknar meta-titel | −15 |
| Saknar meta-beskrivning | −10 |
| Saknar H1 | −10 |
| Flera H1 | −5 |
| Saknar robots.txt | −5 |
| Saknar sitemap.xml | −5 |
| Saknar structured data | −10 |
| Saknar Open Graph | −5 |
| Ej HTTPS | −15 |
| Lighthouse Perf <50 | −15 |
| Lighthouse Perf 50-74 | −5 |
| Bilder utan alt | upp till −10 |
| Tunt innehåll <200 ord | −10 |

Segment:
- `bad` (<50) → **prospect-utskick "Vi har sett er sajt och här är 3 saker att fixa"**
- `medium` (50-74) → **prospect-utskick "Bra grund, men 2 snabba förbättringar"**
- `good` (≥75) → ej utskick (sajten är redan ok; försök ej onödigt)

## Användning

```bash
# CSV-fil: en kolumn "domain" (header) eller bara en kolumn med domäner
# Värden får vara "example.se" eller "https://example.se"

cd /Users/weerayootandersson/Downloads/Searchboost-Opti

# Utan PageSpeed (snabbt)
node tools/prospect-analyzer/lightweight-scanner.cjs ~/Downloads/prospekt-2000.csv

# Med PageSpeed (full analys, längre tid)
PSI_API_KEY=AIza... node tools/prospect-analyzer/lightweight-scanner.cjs ~/Downloads/prospekt-2000.csv
```

Scriptet använder `lambda-functions/node_modules/` (axios + @google-cloud/bigquery) så det krävs ingen separat `npm install`.

## Test-körning 2026-05-31

```
arbetsro.se                70/100 medium  886ms
tobler.se                  99/100 good   1333ms
smalandskontorsmobler.se   99/100 good   4306ms
ilmonte.se                100/100 good   5995ms
```

Alla 4 skrev till BQ utan fel. Streaming insert fungerar mot `prospect_seo_scores`.

## Koppling till BillionMail

Nästa steg (separat Lambda `prospect-sequence-engine.js`, se [17-billionmail.md](17-billionmail.md)):

```sql
SELECT domain, meta_title, problems, recommendations
FROM `seo-aouto.seo_data.prospect_seo_scores`
WHERE segment = 'bad'
  AND email_sent = FALSE
  AND DATE(scanned_at) = CURRENT_DATE()
LIMIT 100
```

→ Per rad: rendera personaliserad email-HTML (samma stil som [18-manadsrapport](18-manadsrapport-pipeline.md), men "vi har sett er sajt"-format), skicka via BillionMail SMTP, `UPDATE prospect_seo_scores SET email_sent=TRUE, email_sent_at=CURRENT_TIMESTAMP()`.

IP-warmup-kontrakt: max 50 utskick/dag första veckan, 200/dag andra veckan, full 2000/dag tredje veckan. Hård-kodas som `MAX_SEND_PER_DAY` i sequence-engine.

## GÖR vs BORDE GÖRA

| Område | GÖR idag | BORDE GÖRA (gap) |
|--------|----------|-------------------|
| Lättviktsscanner | ✅ Skapad + verifierad mot 4 domäner | — |
| BQ-tabell prospect_seo_scores | ✅ Partitionerad + klustrad | — |
| Score-modell + segmentering | ✅ | Kalibrera trösklar efter ~200 verkliga skanningar |
| Tung analyzer (Lambda) | ✅ Finns sedan tidigare | Inget akut |
| 2000-domän-lista | ❌ | Mikael laddar upp `prospekt-2000.csv` |
| prospect-sequence-engine Lambda | ❌ | Bygg när AWS port 25 är öppen + IP-warmup-schema klart |
| Email-template för "bad SEO" | ❌ | Skriv 2-3 varianter (kort intro, med screenshot av sajten, med top-3-fix) |
| A/B-test av rubriker | ❌ | Kör segment-uppdelning på olika subject lines, mät open-rate via Rspamd webhook |

## Säkerhet / etik

- Bara publika HTTP-requests mot startsidan + robots.txt + sitemap.xml. Inga inloggningar. User-Agent `SearchBoost-Prospect-Scanner/1.0 (+https://searchboost.se)` så ägaren kan identifiera oss.
- Inga djup-crawl: maxar 3 requests per domän (start, robots, sitemap). Snäller mot mottagaren.
- Resultat lagras i vår BQ — kunden får aldrig se Searchboost-betyget om de inte uttryckligen blir kunder.
