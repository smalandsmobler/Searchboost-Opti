# Nordic Snus Online — SEO-Analys & Åtgärdsplan

## Searchboost | Möte 2026-02-11

---

## Sammanfattning

nordicsnusonline.com är en stor e-handelsplattform med **266 produkter**, **48 varumärken** och en tydlig kommersiell nisch. Sajten har bra grundförutsättningar — schema markup, sitemap, SSL och en fungerande produktstruktur.

Men sajten saboterar sin egen synlighet genom tre huvudproblem:

1. **Massiv keyword-kannibalisering** — samma produkter visas under 3–4 olika URL:er som konkurrerar med varandra
2. **600+ sidor blockerade** av noindex/nofollow — Google ser inte ert innehåll
3. **Hundratals trasiga sidor och bilder** (4XX-status) som urholkar Googles förtroende

Ni har allt innehåll som behövs. Det behöver bara organiseras rätt.

---

## SEO-poäng: 62/100

| Mätvärde | Resultat |
|----------|----------|
| **SEO-poäng** | 62 av 100 |
| **PageSpeed mobil** | 62 (behöver förbättras) |
| **PageSpeed desktop** | 83 (bra) |
| **Kritiska problem** | 6 st |
| **Varningar** | 8 st |
| **Totalt** | 14 problem identifierade |

---

## Problem 1: Kategorikaos — "Vit portion" vs "Vitt snus" vs "Portionssnus"

### Vad vi hittade

Er sajt har **minst tre parallella kategoristrukturer** som visar samma eller överlappande produkter:

```
/sv/snus/                          ← 266 produkter (ALLA)
/sv/portionssnus/                  ← Portionssnus (subset)
/sv/kop-snus-online/vitt-snus/     ← Vitt snus / nikotinpåsar
/sv/kop-snus-online/kop-vit-portion-snus-online.../  ← Vit portion
/sv/snussorter/                    ← Ännu en kategoriöversikt
/sv/mini-portion/                  ← Mini (subset av portion)
/sv/snus-med-smak/                 ← Smak (attribut, inte kategori)
```

### Varför detta är ett problem

| Problem | Konsekvens |
|---------|------------|
| **"Vit portion" och "Vitt snus" visar nästan samma produkter** | Google vet inte vilken sida som ska ranka |
| **"Portionssnus" och "Snus" överlappar** | Link equity sprids ut på 3–4 sidor istället för 1 |
| **Inkonsekvent URL-mönster** | Vissa kategorier: `/sv/portionssnus/`, andra: `/sv/kop-snus-online/vitt-snus/` |
| **Navigationen pekar på olika ställen** | Besökare (och Google) blir förvirrade |

### Konkret exempel: "Vit portion" vs "Vitt snus"

- **Vit portion** = tobaksbaserat snus med vit yta (t.ex. General White, Knox White)
- **Vitt snus** = tobaksfritt, växtfiberbaserat (t.ex. ZYN, VELO, on!)

Men på sajten blandas dessa ihop. Samma produkt kan dyka upp under båda. Google ser duplicerat innehåll och straffar båda sidorna.

**Resultat:** Ni rankar sämre på *alla* dessa sökord istället för att dominera *ett i taget*.

---

## Problem 2: Över 600 sidor blockerade av noindex/nofollow

Google kan inte se stora delar av er sajt. Över 600 sidor har `noindex` eller `nofollow` — de är i praktiken osynliga.

### Vad det innebär

- Sidor ni *vill* att Google ska visa dyker aldrig upp i sökresultaten
- Filter-URL:er skapar hundratals "skräpsidor" som späder ut ert SEO-värde
- Canonical-taggar pekar ibland fel (t.ex. startsidan pekar `/sv/` men besökaren landar på `/`)

### Varför detta händer

Filter och sortering (format, styrka, smak, varumärke) genererar nya URL:er för varje kombination:

```
/sv/snus/?filter_format=vit-portion
/sv/snus/?filter_format=vit-portion&filter_styrka=stark
/sv/snus/?filter_format=vit-portion&filter_styrka=stark&filter_smak=mint
/sv/snus/?filter_format=vit-portion&orderby=price
```

Varje kombination = ny URL. Med 48 varumärken, 6 format, 5 styrkor och 10+ smaker kan det bli **tusentals URL:er** — de allra flesta utan unikt innehåll.

---

## Problem 3: Trasiga sidor och bilder (4XX-fel)

| Typ | Antal |
|-----|-------|
| Sidor med 4XX-status | Stort antal |
| Bilder med 4XX-status | Minst 41 URL:er |
| Redirects utan tydlig struktur | Flera |

Trasiga sidor och bilder gör att:
- Besökare får felmeddelanden → dålig upplevelse → lämnar sajten
- Google tappar förtroende → sänker hela sajtens ranking
- Internlänkar pekar till sidor som inte finns → "länkkraft" försvinner

---

## Problem 4: Metadata-problem på hundratals sidor

| Problem | Antal sidor |
|---------|-------------|
| **För långa sidtitlar** | 242 sidor |
| **Duplicerade titlar** | 8 sidor |
| **Saknar meta description** | 5 sidor |
| **Duplicerade meta descriptions** | 12 sidor |
| **För långa meta descriptions** | 82 sidor |
| **Saknar H1-tagg** | 41 sidor |
| **Kategorier utan tydlig H1** | Flera |

### Exempel: Startsidan

**Nuvarande title:**
```
Köp ✅BILLIGT snus online » Nordic Snus Online 🚀
```

**Problem:**
- Emojis (✅🚀) kan se oprofessionella ut i Google-resultaten
- "BILLIGT" i versaler uppfattas som skrikigt/spam
- HTML-entiteten `»` renderar ibland fel

**Nuvarande H1:**
```
KÖP BILLIGT SNUS ONLINE &#8211; STORT UTBUD &amp; SNABBA LEVERANSER
```

**Problem:**
- HTML-entiteter (`&#8211;` och `&amp;`) visas som ren kod istället för streck och &-tecken
- VERSALER hela vägen = skrikigt, oprofessionellt
- Google kan tolka det som spam-signal

### Canonical-problem startsidan

Canonical pekar på `/sv/` men besökaren kan landa på `/` (utan /sv/). Google ser två versioner av samma sida → duplicerat innehåll.

---

## Problem 5: Varumärkessidor utan innehåll

Ni har **48 varumärkessidor** — en för varje snusmärke. Men de flesta saknar:

- ❌ Varumärkesbeskrivning (historia, filosofi, vad som gör dem unika)
- ❌ FAQ om varumärket
- ❌ Jämförelser mellan produktvarianter
- ❌ Tydlig H1 med varumärkesnamnet

**Exempel: /sv/varumärke/general/**
- Visar bara ett produktgrid med 12 produkter
- Ingen text om General som varumärke
- Ingen information som hjälper Google (eller kunden) förstå sidan

**Vad ni går miste om:** Tusentals söker varje månad på "General snus", "ZYN snus", "VELO snus" etc. Med riktig varumärkestext rankar dessa sidor — utan det gör de inte.

---

## Problem 6: Bloggen — 9 artiklar på 2 år

Ni har en blogg ("Snusnyheter") med **9 artiklar** publicerade mellan januari 2024 och november 2025. Det är ungefär en artikel var tredje månad.

**Jämförelse med framgångsrika snusbutiker online:**
- De publicerar 2–4 artiklar per månad
- Ämnen: nyheter, tester, guider ("bästa snus för nybörjare", "vitt snus vs portion")
- Varje artikel = en ny möjlighet att ranka i Google

**Era 9 artiklar saknar dessutom:**
- Intern länkning till produktsidor
- Schema markup (Article)
- Uppdaterade datum

---

## Vår bedömning

nordicsnusonline.com har mycket stark affärspotential tack vare sitt breda sortiment (266 produkter, 48 varumärken), tydlig nisch och kommersiell intention. Grundtekniken är på plats — schema markup, SSL, responsiv design.

Men sajten motarbetar sig själv. Den omfattande användningen av filter, parallella kategorier och inkonsekvent URL-struktur skapar ett enormt antal URL:er som konkurrerar med varandra. Kombinerat med 600+ blockerade sidor, hundratals metadata-problem och trasiga länkar betyder det att Google bara ser en bråkdel av ert innehåll — och det den ser är förvirrande.

**Den goda nyheten:** Allt innehåll finns redan. Det behöver inte skapas nytt — det behöver organiseras, saneras och optimeras.

---

## Åtgärdsplan — Hög prioritet (Måste göras)

| # | Åtgärd | Effekt |
|---|--------|--------|
| 1 | **Definiera en tydlig indexeringsstrategi** — bestäm exakt vilka sidor Google ska se | Stoppar kannibalisering |
| 2 | **Bestäm vilka filter-URL:er som ska indexeras** och blockera resten | Tar bort tusentals skräpsidor |
| 3 | **Rensa noindex/nofollow** på sidor som faktiskt ska synas | 600+ sidor blir synliga igen |
| 4 | **Åtgärda alla 4XX-sidor och trasiga bilder** | Bättre förtroende hos Google |
| 5 | **Fixa canonical-taggar** så de pekar på rätt huvudversion | En stark sida istället för tre svaga |
| 6 | **Städa upp sidtitlar** — ta bort emojis, fixa HTML-entiteter, rätt längd | Professionella sökresultat |

---

## Åtgärdsplan — Medel prioritet (Bör göras)

| # | Åtgärd | Effekt |
|---|--------|--------|
| 1 | **Skapa unika H1-taggar** för alla kategorier och varumärken | Google förstår sidans syfte |
| 2 | **Optimera meta descriptions** — ta bort duplicering, anpassa längd | Fler klickar från sökresultaten |
| 3 | **Konsolidera överlappande kategorisidor** ("Vit portion" vs "Vitt snus") | Fokuserad SEO-kraft |
| 4 | **Förbättra internlänkning** mellan kategorier och produkter | Google hittar rätt sidor |
| 5 | **Skriv varumärkestexter** för de 10 största varumärkena | Rankar på varumärkessökningar |
| 6 | **Se till att viktiga sidor inte gömms** bakom filter-parametrar | Fler produkter synliga |

---

## Åtgärdsplan — Långsiktigt (Strategiskt)

| # | Åtgärd | Effekt |
|---|--------|--------|
| 1 | **Skapa innehållsdrivna landningssidor** för viktiga kategorier | Topical authority |
| 2 | **Bygg redaktionellt innehåll** — guider, tester, jämförelser | Organisk trafik |
| 3 | **Inför löpande teknisk SEO-uppföljning** | Förhindra nya problem |
| 4 | **Utvärdera paginering och facetterad navigation** ur SEO-perspektiv | Renare indexering |

---

## Vad kunden tjänar på det — sökvolym som ni missar

Tusentals svenskar söker varje månad efter exakt det ni säljer:

| Sökterm | Uppskattad volym/mån |
|---------|---------------------|
| "köpa snus online" | ~8 000 |
| "billigt snus" | ~4 000 |
| "vitt snus" | ~3 500 |
| "ZYN snus" | ~2 500 |
| "VELO snus" | ~2 000 |
| "nikotinpåsar" | ~2 000 |
| "General snus" | ~1 500 |
| "Knox snus" | ~1 200 |
| "snus med smak" | ~1 000 |
| "portionssnus" | ~800 |
| **Totalt** | **~26 500+/mån** |

Ni har produkterna. Ni har varumärkena. Ni har infrastrukturen. Men Google visar era konkurrenter istället — för att deras sajter är renare och tydligare.

---

## Föreslagen ny kategoristruktur

```
/sv/snus/                              ← HUVUDKATEGORI (alla 266 produkter)
    /sv/snus/portionssnus/             ← Underkategori
    /sv/snus/vitt-snus/                ← Underkategori (tobaksfritt/nikotinpåsar)
    /sv/snus/lossnus/                  ← Underkategori
    /sv/snus/mini-portion/             ← Underkategori
    /sv/snus/nikotinfritt/             ← Underkategori

/sv/varumarken/                        ← VARUMÄRKEN (48 st med unik text)
    /sv/varumarken/general/
    /sv/varumarken/zyn/
    /sv/varumarken/velo/
    ...

/sv/produkt/[produktnamn]/             ← PRODUKTSIDOR (befintliga, behåll)

/sv/guider/                            ← NYTT — Kunskapshub
    /sv/guider/vitt-snus-vs-portion/
    /sv/guider/basta-snus-for-nyborjare/
    /sv/guider/nikotinstyrka-guide/
```

### Vad som ska tas bort / redirectas

```
/sv/kop-snus-online/...               → 301 till /sv/snus/...
/sv/snussorter/...                     → 301 till /sv/snus/...
/sv/portionssnus/                      → 301 till /sv/snus/portionssnus/
/sv/snus-med-smak/                     → 301 till /sv/snus/ (med smak-filter)
/sv/mini-portion/                      → 301 till /sv/snus/mini-portion/
```

### Format och styrka = filter, inte kategorier

Istället för separata URL:er för varje format/styrka-kombination:

```
/sv/snus/portionssnus/
    [Filter: Styrka] [Filter: Smak] [Filter: Varumärke]
    → Filtrering via JavaScript, INTE nya URL:er
```

---

## Vad ingår i vårt arbete

| Tjänst | Beskrivning |
|--------|-------------|
| **Indexeringsstrategi** | Genomgång av alla sidor — vilka ska indexeras, vilka ska blockeras |
| **Canonical-sanering** | Rätt canonical på alla sidor |
| **Metadata-optimering** | Titlar, beskrivningar, H1 på 242+ sidor |
| **4XX-sanering** | Alla trasiga sidor och bilder åtgärdade |
| **Redirect-plan** | 301-redirects för alla konsoliderade URL:er |
| **Varumärkestexter** | SEO-optimerade texter för topp-10 varumärken |
| **Automatisk veckooptimering** | Löpande metadata-förbättringar via AI |
| **Veckorapporter** | Resultat & framsteg varje vecka |
| **Personlig kontakt** | Löpande rådgivning och stöd |

---

## Vad händer om ni inte gör något?

- **Kannibalisering fortsätter** — era egna sidor slåss mot varandra i Google
- **600+ osynliga sidor** förblir osynliga
- **Trasiga sidor** urholkar Googles förtroende för hela domänen
- **Konkurrenter med renare struktur** tar era positioner
- **26 000+ sökningar/mån** går till andra snusbutiker
- Problemet **växer** för varje ny produkt och varumärke ni lägger till

---

## Prissättning

| Paket | Pris |
|-------|------|
| **SEO Premium** | **8 000 kr/mån** |

Inkluderar allt ovan: indexeringsstrategi, metadata-optimering, teknisk sanering, veckorapporter och löpande optimering.

*Exkl. moms. Ingen bindningstid.*

---

## Nästa steg

1. Ni godkänner åtgärdsplanen
2. Vi påbörjar indexeringsgenomgång och canonical-sanering (vecka 1)
3. Metadata-optimering och 4XX-fix (vecka 2–3)
4. Löpande automatisk optimering startar (vecka 4)
5. Första veckorapporten levereras

---

*Searchboost — vi gör er synliga.*

