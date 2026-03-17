# Wedosigns — Komplett stegguide: Divi → GeneratePress
Skapad: 2026-03-16

## Nuläge
- **Tema**: Divi (shortcode-baserat, blockerar REST API-meta)
- **Sidor**: 16 publicerade (16 slug-sidor + blogg)
- **Inlägg**: 6 Inspiration-artiklar
- **Meny**: 11 poster (Hem, Produkter, Skyltar, Bildekor, Banderoller, Insynsskydd, Dekaler, Klistermärken, Event, Print, Offerter, Om oss)
- **Problem**: Rank Math meta registreras inte via REST API på Divi → autonomt optimering fungerar ej

## Varför GeneratePress?
- Fullständig REST API-kontroll → autonomt SEO-arbete fungerar direkt
- Rank Math meta sätts via API utan problem
- Extremt snabb (Core Web Vitals)
- Enkel att anpassa utan kod
- Gratis (Premium ~$59/år om du vill ha fler designalternativ)

---

## STEG 1 — Förberedelse (gör detta FÖRST)
**Tid**: 30 min | **Gör INNAN du byter tema**

### 1a. Exportera Divi Global Colors
- WP Admin → Divi → Theme Options → Importera & Exportera → Exportera
- Spara filen (du kan behöva accentfärgen senare)

**Wedosigns primärfärg**: Kolla på siten — sannolikt en stark färg (orange/röd/blå)

### 1b. Fotografera/screenshota alla sidor
Ta en skärmbild på varje sida som referens:
- /hem/
- /skyltar-goteborg/
- /bildekor-goteborg/
- /banderoller-goteborg/
- /insynsskydd-goteborg/
- /dekaler-goteborg/
- /klistermarken-goteborg/
- /event-exponering-goteborg/
- /print-goteborg/
- /offerter-wedosigns/
- /om-oss/
- /galleri/

### 1c. Notera alla bilder
Gå igenom sidorna och notera vilka hero-bilder och galleribilder som används — dessa finns kvar i Media Library.

### 1d. Säkerhetskopiera
- WP Admin → Verktyg → Exportera → Alla innehåll → Ladda ner XML

---

## STEG 2 — Installera GeneratePress
**Tid**: 5 min

1. WP Admin → Utseende → Teman → Lägg till nytt
2. Sök "GeneratePress" → Installera → Aktivera
3. **OBS**: Siten ser nu väldigt enkel ut — det är normalt

### Grundinställningar GeneratePress
WP Admin → Utseende → Anpassa:

**Typografi:**
- Brödtext: Inter eller Open Sans, 16px
- Rubriker: samma font, fetstil

**Färger** (fyll i Wedosigns faktiska färger):
- Primärfärg (knappar, accent): `#[wedosigns-primärfärg]`
- Länkfärg: samma som primär
- Bakgrund: `#ffffff`
- Text: `#1a1a1a`

**Layout:**
- Container-bredd: 1200px
- Header: Standard (logo vänster, meny höger)

---

## STEG 3 — Bygg om sidorna med Gutenberg
**Tid**: 2-4 timmar beroende på ambitionsnivå

### Mallstruktur per tjänstesida (gäller Skyltar, Bildekor, Banderoller osv.)

Varje tjänstesida ska ha:
```
[HERO-SEKTION]
- Stor bild bakgrund
- H1: "Skyltar i Göteborg" (eller respektive tjänst)
- Undertext: kort beskrivning
- Knapp: "Begär offert"

[INTRO-TEXT]
- 2-3 stycken om tjänsten
- Interna länkar till relaterade tjänster

[TJÄNSTE-GRID]
- 3 kort med underkategorier (t.ex. Fasadskyltar, LED-skyltar, Profilskyltar)
- Varje kort: ikon/bild + rubrik + 2 meningar + länk

[SEO-TEXT]
- H2: "Varför välja Wedo Signs för skyltar i Göteborg?"
- 3-4 stycken med nyckelord naturligt inbakade
- Läs mer/kollaps om texten är lång

[CTA-SEKTION]
- Mörk bakgrund
- "Redo att ta nästa steg?"
- Knapp: "Kontakta oss"
```

### Gutenberg-block att använda:
- **Cover** = hero med bakgrundsbild
- **Columns** = tjänste-grid (3 kolumner)
- **Group** = CTA-sektion med bakgrundsfärg
- **Buttons** = CTA-knappar
- **Image** = bilder i innehåll

---

## STEG 4 — Rank Math SEO på alla sidor
**Tid**: 30 min (eller Claude gör det automatiskt)

När GeneratePress är aktivt och sidorna är byggda — sätt meta på alla sidor via REST API.

**Jag kan göra detta automatiskt via API när temat är bytt.**

Förslag på titles + descriptions:

| Sida | Title | Description |
|------|-------|-------------|
| /hem/ | Skyltar & Reklam i Göteborg \| Wedo Signs | Vi tillverkar professionella skyltar, bildekor och reklam i Göteborg. Snabb leverans, hög kvalitet. Begär offert idag. |
| /skyltar-goteborg/ | Skyltar i Göteborg – fasadskyltar, LED & mer \| Wedo Signs | Professionella skyltar till företag i Göteborg. Fasadskyltar, ljusskyltar, hängskyltar och mer. Kontakta oss för offert. |
| /bildekor-goteborg/ | Bildekor i Göteborg – fordonsreklam \| Wedo Signs | Professionell bildekor och fordonsreklam i Göteborg. Vi dekorerar personbilar, lastbilar och fordon med tryck och folie. |
| /banderoller-goteborg/ | Banderoller i Göteborg – tryck & leverans \| Wedo Signs | Beställ banderoller i Göteborg. Vi trycker och levererar banderoller i alla storlekar för event, butiker och mässor. |
| /insynsskydd-goteborg/ | Insynsskydd & fönsterfolie Göteborg \| Wedo Signs | Insynsskydd för kontor, butiker och fastigheter i Göteborg. Vi monterar fönsterfolie, frostad folie och dekorfolie. |
| /dekaler-goteborg/ | Dekaler i Göteborg – tryck & montering \| Wedo Signs | Professionella dekaler för butiker, fordon och reklam i Göteborg. Hög kvalitet, snabb leverans. |
| /klistermarken-goteborg/ | Klistermärken i Göteborg – anpassade \| Wedo Signs | Beställ anpassade klistermärken i Göteborg. Vi producerar klistermärken för företag, event och produktmärkning. |
| /event-exponering-goteborg/ | Eventreklam & exponering Göteborg \| Wedo Signs | Profilprodukter och exponering för event i Göteborg. Roll-ups, mässväggar, banderoller och mer. |
| /print-goteborg/ | Print & trycksaker Göteborg \| Wedo Signs | Professionell printing i Göteborg. Vi trycksaker, affischer, flyers och profilmaterial för företag. |
| /offerter-wedosigns/ | Begär offert – Wedo Signs Göteborg | Begär en offert på skyltar, bildekor, banderoller eller annan reklam från Wedo Signs i Göteborg. Snabbt svar. |
| /om-oss/ | Om Wedo Signs – skyltar & reklam Göteborg | Lär känna Wedo Signs – ett Göteborg-baserat företag specialiserat på skyltar, reklam och profilprodukter. |

---

## STEG 5 — Interna länkar
**Tid**: 15 min | **Claude kan göra detta automatiskt**

Varje tjänstesida ska länka till minst 3 relaterade sidor:
- Skyltar → Bildekor, Banderoller, Offerter
- Bildekor → Dekaler, Klistermärken, Skyltar
- Banderoller → Event och exponering, Print, Offerter
- Insynsskydd → Foliedekor, Skyltar, Offerter
- Dekaler → Klistermärken, Bildekor, Offerter

---

## STEG 6 — Google Business Profile
**Tid**: 10 min (kräver telefon för verifiering)

1. Gå till: https://business.google.com/create
2. Företagsnamn: **Wedo Signs**
3. Kategori: **Sign maker** (skylttillverkare)
4. Adress: Ange Göteborg-adress (eller välj serviceområde om ej fysisk butik)
5. Telefon: Wedosigns telefonnummer
6. Webbplats: https://wedosigns.se
7. Verifiera via telefon/postkort

**GBP-beskrivning** (kopiera):
> Wedo Signs är ett reklamföretag i Göteborg som specialiserar sig på skyltar, bildekor, banderoller, insynsskydd och profilprodukter. Vi levererar professionell skyltning och reklam till företag i Göteborg och Västra Götaland. Snabb leverans, hög kvalitet och personlig service.

---

## STEG 7 — Aktivera automatisk SEO-optimering
**Tid**: 5 min | **Claude gör detta**

När GeneratePress är aktivt:
1. Generera nytt WP Application Password (redan gjort: `mARZ Z5yB zjuP d8bw 9FPh 36BT`)
2. Konfigurera Rank Math för REST API-access
3. Aktivera i Searchboost Opti Dashboard → Wedosigns → Aktivera automatisering

---

## Prioriterad ordning

```
DAG 1 (Mikael + Claude, 4h):
  ✓ Screenshot alla sidor
  ✓ Installera GeneratePress
  ✓ Konfigurera färger + typografi
  ✓ Bygg hem-sidan i Gutenberg
  ✓ Bygg 2-3 viktigaste tjänstesidor (Skyltar, Bildekor, Banderoller)

DAG 2 (Claude, 2h):
  ✓ Bygg resterande 8 tjänstesidor
  ✓ Sätt Rank Math meta på alla sidor via API
  ✓ Lägg in interna länkar via API
  ✓ Aktivera automatisk optimering

DAG 3 (Mikael, 1h):
  ✓ Google Business Profile
  ✓ Hitta.se + Eniro.se verifiering
  ✓ Granska resultatet
```

---

## Filer att bevara (ändras ej vid temabyte)
- Alla bilder i Media Library (påverkas ej)
- Alla inlägg/artiklar (påverkas ej)
- Rank Math SEO-inställningar (påverkas ej)
- Alla sidor med innehåll (Divi shortcodes syns som text — byggs om)
- Permalink-struktur (ändras ej → inga 404:or)

---

## Rollback-plan
Om något går fel:
1. WP Admin → Utseende → Teman → Aktivera Divi igen
2. Allt innehåll finns kvar (Divi shortcodes orörda)
3. Max 30 sekunders downtime

