# Kostnadsanalys — seo-mcp-server

## Sammanfattning

| Kategori | Månadskostnad (SEK) | Årskostnad (SEK) |
|----------|--------------------:|------------------:|
| Hosting & infrastruktur | 500–2 000 | 6 000–24 000 |
| API-tjänster & datakällor | 0–3 000 | 0–36 000 |
| Utveckling (initial) | — | 60 000–100 000 |
| Utveckling (löpande underhåll) | 5 000–15 000 | 60 000–180 000 |
| Domän & SSL | ~15 | ~180 |
| **Totalt (löpande)** | **5 515–20 015** | **66 180–240 180** |

---

## 1. Hosting & infrastruktur

| Alternativ | Beskrivning | Kostnad/mån |
|------------|-------------|------------:|
| VPS (t.ex. Hetzner, DigitalOcean) | Liten instans för MCP-server | 50–200 SEK |
| Molntjänst (AWS/GCP/Azure) | Serverless eller container | 200–2 000 SEK |
| Egenhostad (lokal maskin) | Ingen extern kostnad, men drift/el | ~0 SEK |

**Rekommendation:** Starta med en liten VPS (~100 SEK/mån) och skala vid behov.

## 2. API-tjänster & externa datakällor

| Tjänst | Användning | Kostnad/mån |
|--------|-----------|------------:|
| Web scraping/crawling | Hämta sidor för SEO-analys | 0 SEK (eget) |
| Google Search Console API | Sökdata (gratis med konto) | 0 SEK |
| Google PageSpeed Insights API | Prestationsdata | 0 SEK (gratisnivå) |
| Tredjepartsdata (Ahrefs/SEMrush API) | Valfritt, avancerad analys | 1 000–3 000 SEK |

**Notering:** Grundfunktionaliteten kräver inga betalda API:er. Tredjepartsverktyg är valfria tillägg.

## 3. Utvecklingskostnad

### Initial utveckling (engångskostnad)

| Fas | Uppskattad tid | Kostnad (800 SEK/h) |
|-----|---------------:|--------------------:|
| Arkitektur & design | 8–12 h | 6 400–9 600 SEK |
| Kärnverktyg (6 st) | 30–45 h | 24 000–36 000 SEK |
| Testning & QA | 10–18 h | 8 000–14 400 SEK |
| Dokumentation | 5–8 h | 4 000–6 400 SEK |
| Deployment & CI/CD | 8–12 h | 6 400–9 600 SEK |
| **Totalt** | **61–95 h** | **60 000–100 000 SEK** |

### Löpande underhåll

| Aktivitet | Tid/mån | Kostnad/mån |
|-----------|--------:|------------:|
| Buggfixar & uppdateringar | 3–8 h | 2 400–6 400 SEK |
| Nya funktioner | 5–15 h | 4 000–12 000 SEK |
| Övervakning & drift | 1–2 h | 800–1 600 SEK |

## 4. Övriga kostnader

| Post | Kostnad |
|------|--------:|
| Domännamn (.se/.com) | ~150 SEK/år |
| SSL-certifikat (Let's Encrypt) | 0 SEK |
| E-post/notifieringar | 0–100 SEK/mån |

---

## Risker & kostnadsbesparingar

### Risker
- **Skalning:** Om antalet förfrågningar ökar kraftigt kan hosting-kostnader stiga
- **API-begränsningar:** Gratistjänster har rate limits som kan kräva uppgradering
- **Beroende av tredjepartstjänster:** Prisändringar hos externa API-leverantörer

### Besparingsmöjligheter
- Använda open source-verktyg istället för betalda API:er
- Caching av resultat för att minska antalet API-anrop
- Serverless-arkitektur (betala per anrop istället för fast server)
- Bidrag från open source-community minskar utvecklingskostnad

---

## Slutsats

Projektet kan startas med **minimal kostnad** (~100 SEK/mån) genom att köra lokalt eller på en billig VPS, och använda gratis API:er. Den största kostnaden är **utvecklingstid**. Med en MVP-approach kan en fungerande version levereras inom ca 60–95 timmar.
