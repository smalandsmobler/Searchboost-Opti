# Searchboost — Viktors arbetsyta
> Läs denna fil innan du börjar jobba i varje ny session.

---

## Din roll
Du är SEO-specialist och webbbyggare på Searchboost. Du hjälper kunder med SEO, webbdesign och innehåll — alltid med Mikaels SOPs som kvalitetsstandard.

Aktiva projekt:
- **Ferox Konsult AB** — Shopify-migrering från Hemsida24. Arbetsunderlag: `docs/ferox-shopify-brief.md`

---

## Skills du ska använda

Skills är förinstallerade i `~/.claude/skills/`. Aktivera dem med `/skillnamn` i chatten.

### Design & UI
```
/ui-ux-pro-max
```
Använd när du bygger eller designar något — kundsidor, landningssidor, CSS-justeringar.
Ger dig: 67 UI-stilar, 96 färgpaletter, 57 fontpar, 99 UX-riktlinjer.

**Så använder du den:**
1. Skriv `/ui-ux-pro-max` — Claude aktiverar guiden
2. Beskriv vad du bygger: "En landningssida för ett advokatbyrå, professionell stil"
3. Claude kör design-system-analysen och ger dig: stil, färger, typsnitt, UX-regler
4. Bygger du i WordPress: be Claude generera CSS/HTML direkt
5. Bygger du i Shopify: be Claude generera Liquid-sektioner eller CSS direkt

### SEO
```
/seo-audit        — fullständig SEO-audit av en sajt
/seo-page         — djupanalys av en enskild sida
/seo-plan         — strategisk SEO-plan för ny/befintlig sajt
/schema-markup    — lägg till schema.org-markup
/seo-geo          — GEO (Generative Engine Optimization, AI-sökmotorer)
```

### Copywriting & Innehåll
```
/copywriting      — skriv eller förbättra marknadsföringstexter
/copy-editing     — granska och förbättra befintliga texter
/content-strategy — planera innehållsstrategi
```

### Marknadsföring
```
/page-cro         — optimera konverteringsgrad på en sida
/social-content   — skapa inlägg för sociala medier
/email-sequence   — bygga mail-sekvenser
```

---

## Arbetsflöde — innan du publicerar

**Alltid:**
1. Kör relevant skill för uppgiften
2. Granska mot SOPs (fråga Claude: "Kör SOP-checklistan för [uppgift]")
3. Visa för kunden eller Mikael om du är osäker
4. Publicera

SOPs-filen ligger i repot: `docs/` eller fråga Claude om rätt fas.

---

## Du hjälper med

- SEO-analyser, nyckelordsresearch, meta-texter, H1-H3, schema
- WordPress (teman, plugins, CSS, HTML, enkel PHP)
- Shopify (tema-anpassning, Liquid, sections, CSS, produkter, collections, pages, redirects, SEO-inställningar)
- Copywriting (bloggar, kategoritexter, produktbeskrivningar)
- Design (sidlayouter, färgval, typsnitt) — använd `/ui-ux-pro-max`
- SOP-frågor och kvalitetskontroll
- Dashboard (logga arbete, pipeline, formulär)
- Trello (flytta kort, uppdatera status)
- Kunders WP-admin, GSC, GA4, GTM
- Menystrukturer på kundsajter
- Publicera innehåll på kundsajter (efter SOP-granskning)

### Shopify specifikt
- **Liquid**: Redigera theme.liquid, section-filer, snippet-filer
- **Sections**: Skapa custom sections med schema (JSON i Liquid)
- **CSS**: Redigera theme.css eller custom CSS i temainställningar
- **Produkter**: Skriva produktbeskrivningar, title, meta description, alt-text
- **Collections**: Sätta upp kategorier med rätt SEO-text
- **Pages**: Skapa och fylla informationssidor med SEO-optimerat innehåll
- **Redirects**: Skriva redirects.csv för import (50+ ompekning från Hemsida24)
- **Schema.org**: Lägga in JSON-LD (Organisation, LocalBusiness, Product, BreadcrumbList) i theme.liquid
- **Navigation**: Bygga huvudmeny och footer-meny
- **SEO-inställningar**: Title, meta description, Google Analytics, Facebook Pixel via Shopify Admin
- **Shopify Apps**: Rekommendationer för SEO-appar (ersättare för Rank Math — se nedan)

### OBS: Rank Math finns inte på Shopify
Rank Math är ett WordPress-plugin. På Shopify hanteras SEO på annat sätt:
- **Inbyggt i Shopify**: Title, meta description, URL-slug per produkt/page/collection (räcker långt)
- **Vanliga SEO-appar**: Plug In SEO (gratis), SEO Manager (~$20/mån), Yoast SEO for Shopify (~$19/mån)
- **Schema**: Läggs in manuellt som JSON-LD i theme.liquid (Claude kan skriva koden)
- **Sitemap**: Genereras automatiskt av Shopify på /sitemap.xml
- **Canonical**: Shopify sätter canonical automatiskt

---

## Du hjälper INTE med

- Deploy, servrar, AWS, Lambda, SSH, EC2
- Ändra systemfiler (index.js, app.js, style.css i dashboard/)
- Ändra infrastruktur eller credentials
- GitHub push till main
- Databasändringar (BigQuery)
- Utveckla searchboost.se

Om du frågar om något i listan ovan svarar Claude:
*"Det hanteras av Mikael."*

---

## Kunder

Se `CLAUDE.md` för komplett kundlista med credentials och status.

### Ferox Konsult AB — Shopify-migrering (Viktors projekt)
- **Arbetsunderlag**: `docs/ferox-shopify-brief.md` — läs denna FÖR du börjar jobba
- **SEO-audit**: `docs/feroxkonsult-audit-2026.md` — komplett inventering av gamla sajten
- **Innehåll**: `content-pages/ferox-scraped-content.md` — allt text från gamla Hemsida24-sajten
- **Domän**: feroxkonsult.se
- **Produkt**: Stämpelur (Seiko) + FeroxTid (datorbaserat tidredovisningssystem)
- **Plattform**: Hemsida24 → Shopify
- **Checklista**: Se `docs/ferox-shopify-brief.md` för vad som är klart och vad som återstår

---

## Git

```bash
git pull                          # alltid först
git checkout -b viktor/kund-uppgift  # din branch
git add [specifika filer]
git commit -m "kort beskrivning"
# pusha ALDRIG till main utan Mikaels OK
```

---

## Verifiering

Varje ny session: Claude frågar om verifieringskod. Koden får du av Mikael.
