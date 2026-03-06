# Nordic Snus Online — Onboarding Data
## Redo att matas in i Searchboost Dashboard

**Datum**: 2026-03-03
**Kund-ID**: nordicsnusonline
**Domän**: nordicsnusonline.com
**Status**: Prospect → Onboarding
**Avtal**: 8 000 kr/mån SEO Premium (ej signerat)

---

## ABC-Nyckelord (29 st, ~37 000 sök/mån)

### A-nyckelord (9 st — Högsta prioritet, primära konverteringsord)

| Nyckelord | Sökvolym/mån | Notering |
|-----------|-------------|----------|
| köpa snus online | 8 000 | Huvudord, startsida + /sv/snus/ |
| billigt snus | 4 000 | Prisdriven, startsida |
| vitt snus | 3 500 | Tobaksfritt segment, växer snabbt |
| ZYN snus | 2 500 | Största nikotinpåse-märket |
| VELO snus | 2 000 | BAT:s nikotinpåse |
| nikotinpåsar | 2 000 | Generisk kategori, tobaksfritt |
| General snus | 1 500 | Sveriges mest sökta snusmärke |
| snus online | 1 500 | Bred kommersiell intent |
| beställa snus | 1 200 | Transaktionellt |

### B-nyckelord (10 st — Varumärken + Kategorier)

| Nyckelord | Sökvolym/mån | Notering |
|-----------|-------------|----------|
| Knox snus | 1 200 | Populärt budgetmärke |
| Lundgrens snus | 1 000 | Premium segment |
| snus med smak | 1 000 | Kategori-sökord |
| Siberia snus | 900 | Extrastark nisch |
| portionssnus | 800 | Typ-kategori |
| Göteborgs Rapé | 800 | Klassiskt premium |
| Skruf snus | 700 | Växande varumärke |
| on! nikotinpåsar | 600 | Philip Morris nikotinpåse |
| mini snus | 500 | Format-kategori |
| Ettan snus | 500 | Traditionellt varumärke |

### C-nyckelord (10 st — Long tail / Informationella)

| Nyckelord | Sökvolym/mån | Notering |
|-----------|-------------|----------|
| bästa snus för nybörjare | 400 | Guide-innehåll |
| vitt snus vs portion | 350 | Jämförelse-guide |
| snus utan tobak | 350 | Nikotinpåsar alt. sökterm |
| starkaste snus | 300 | Nischsökning, Siberia etc. |
| snus leverans Sverige | 300 | Logistik-fråga |
| hur länge håller snus | 250 | FAQ-innehåll |
| nikotinstyrka snus | 200 | Guide-innehåll |
| snus tillägg Systembolaget | 200 | Informationellt |
| snus nybörjare guide | 180 | Guide-innehåll |
| bästa vita snus 2026 | 150 | Årsspecifik, uppdateras |

**Totalt**: ~37 280 sökningar/mån

---

## Åtgärdsplan — 3 månader

### Månad 1: Teknisk sanering & Grundarbete

| Vecka | Uppgift | Prio |
|-------|---------|------|
| 1 | Indexeringsstrategi — bestäm vilka av 600+ noindex-sidor som ska öppnas | Kritisk |
| 1 | Canonical-audit — fixa /sv/ vs / och alla dubbletter | Kritisk |
| 2 | 4XX-sanering — fixa alla trasiga sidor och bilder | Kritisk |
| 2 | Filter-URL strategi — blockera parameteriserade URL:er i robots.txt | Kritisk |
| 3 | Sidtitlar — rensa emojis, HTML-entiteter, rätt längd (242 sidor) | Hög |
| 3 | H1-taggar — unika H1 på alla 41 sidor som saknar | Hög |
| 4 | Meta descriptions — ta bort duplicerade, optimera längd (82 sidor) | Hög |
| 4 | Redirect-plan — 301:or för /kop-snus-online/ → /snus/ | Hög |

### Månad 2: Kategorikonsolidering & Varumärkestexter

| Vecka | Uppgift | Prio |
|-------|---------|------|
| 5 | Konsolidera "Vit portion" + "Vitt snus" → en tydlig kategori | Hög |
| 5 | Konsolidera /snussorter/ → redirect till /snus/ | Hög |
| 6 | Varumärkestexter topp-5: General, ZYN, VELO, Knox, Siberia | Hög |
| 6 | Internlänkning kategori → produkt förbättras | Medel |
| 7 | Varumärkestexter #6-10: Lundgrens, Skruf, on!, Göteborgs Rapé, Ettan | Medel |
| 7 | Schema markup genomgång — Product, BreadcrumbList | Medel |
| 8 | Automatisk veckooptimering startas | Standard |
| 8 | Första veckorapporten levereras | Standard |

### Månad 3: Innehållsstrategi & Tillväxt

| Vecka | Uppgift | Prio |
|-------|---------|------|
| 9 | Guider-hub: "Bästa snus för nybörjare" | Medel |
| 9 | Guide: "Vitt snus vs portion — skillnaden" | Medel |
| 10 | Guide: "Nikotinstyrka — så väljer du rätt" | Medel |
| 10 | Blogginlägg: Produktnyheter + trender 2026 | Medel |
| 11 | Löpande metadata-optimering (automatisk) | Standard |
| 11 | Uppföljning GSC-positioner på A-nyckelord | Standard |
| 12 | Kvartalsrapport + strategijustering | Standard |
| 12 | Utvärdering paginering/facetterad navigation | Medel |

---

## Onboarding-krav

### Vad Searchboost behöver från kunden:

1. **WordPress Application Password**
   - Kunden skapar i WP-admin → Användare → Application Passwords
   - Skicka till oss: användarnamn + app-password

2. **Google Search Console access**
   - Lägg till: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
   - Roll: "Fullständig"
   - Property: `https://nordicsnusonline.com/`

3. **Shopify/WooCommerce access** (om relevant)
   - Admin-access eller Custom App med API-nyckel

### Vad Searchboost gör:

1. Lägga in credentials i SSM Parameter Store
2. Skapa BigQuery-poster (customer_pipeline, customer_keywords)
3. Skapa Trello-kort i "Kund"-listan
4. Starta automatisk veckoaudit
5. Aktivera autonomous-optimizer
6. Leverera första veckorapport

---

## SSM-parametrar att skapa

```
/seo-mcp/wordpress/nordicsnusonline/url = https://nordicsnusonline.com
/seo-mcp/wordpress/nordicsnusonline/username = [VÄNTAR]
/seo-mcp/wordpress/nordicsnusonline/app-password = [VÄNTAR]
/seo-mcp/integrations/nordicsnusonline/gsc-property = https://nordicsnusonline.com/
/seo-mcp/integrations/nordicsnusonline/company-name = Nordic Snus Online
/seo-mcp/integrations/nordicsnusonline/contact-email = [VÄNTAR]
/seo-mcp/integrations/nordicsnusonline/contact-person = [VÄNTAR]
```

---

## Unik nyckelvinkel

**Nordic Snus kan INTE använda Google Ads eller Meta-annonser** (tobak är totalförbjudet).
Det gör organisk SEO och AI-sök (ChatGPT, Perplexity, Gemini) till **enda kanalerna** för digital kundanskaffning.

Searchboost erbjuder det enda sättet att systematiskt driva trafik till sajten.
