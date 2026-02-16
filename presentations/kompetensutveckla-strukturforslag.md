# Kompetensutveckla.se — Förslag på strukturförändring

## Searchboost | Möte 2026-02-10

---

## Sammanfattning

Er sajt har **enormt innehåll** — 600+ indexerade sidor, 120+ kunskapsbanksartiklar, 70+ nedladdningsbara dokument och utbildningar i 40+ städer. Men sajten är organiserad efter **leveransformat** istället för **ämnesområde**, och ert gratismaterial är i princip osynligt för Google.

Vi föreslår en ämnesbaserad omstrukturering + kunskapshubbar som fångar trafik och konverterar den till kursbokningar.

---

## Problem 1: 971 trasiga interna länkar

Vi har identifierat **142 unika URL:er** som inte längre fungerar — totalt **971 förekomster** av trasiga länkar på sajten.

**Orsak:** URL-strukturen ändrades från:
```
/arbetsmiljoarbete/kunskapsbanken/X
```
till:
```
/vara-tjanster/arbetsmiljoarbete/kunskapsbanken/X
```
— men utan 301-redirects. Google och besökare hamnar på 404-sidor.

**121 av 142 trasiga URL:er** = Kunskapsbanken. Resterande: kurser och AFS-regler.

---

## Problem 2: Kaotisk kategoristruktur

### Nuvarande struktur — vi hittade 12+ toppkategorier

```
/webbutbildningar/                         ← Format som kategori
    /webbutbildningar-arbetsmiljo/
    /webbutbildningar-sakerhet/
    /webbutbildningar-elsakerhet/
    /webbutbildningar-vag-och-transport/
    /webbutbildningar-ledarskap/
/fysiska-utbildningar/                     ← Samma ämnen, annan kategori
    /fysiska-arbetsmiljoutbildningar/
    /fysiska-ledarskapsutbildningar/
    /utbildningar-for-tekniska-anordningar/
/lararledda-webbutbildningar/              ← Tredje kategorin, samma ämnen
    /ledarskapsutbildning-distans/
    /ekonomiutbildning-distans/
/bam-utbildning/                           ← Egen toppkategori (varför?)
    /bam-utbildning-stockholm/
    /bam-utbildning-goteborg/
    ...44 städer
/utbildning-bas-p-och-bas-u/              ← Egen toppkategori
    /bas-p-och-bas-u-utbildning-stockholm/
    ...38 städer
/skyddsombudsutbildning/                   ← Egen toppkategori
/sam-utbildning/                           ← Egen toppkategori
/ledarskapsutbildningar/                   ← Både här OCH under webb/fysisk
/krisutbildningar/                         ← Egen toppkategori
/engelska-utbildningar/                    ← Egen toppkategori
/vara-tjanster/                            ← Arbetsmiljö + Kunskapsbanken
    /arbetsmiljoarbete/
        /kunskapsbanken/        (120+ artiklar)
        /afs/                   (alla AFS-föreskrifter)
        /rutiner/               (70+ dokument)
```

### Vad detta innebär konkret

| Problem | Exempel |
|---------|---------|
| **Samma ämne på 3 ställen** | BAM finns under /webbutbildningar/, /fysiska-utbildningar/ OCH /bam-utbildning/ |
| **Google vet inte vilken sida som är viktigast** | 3 BAM-sidor konkurrerar med varandra = kannibalisering |
| **Ledarskap på 4 ställen** | /webbutbildningar/ledarskap/, /fysiska-utbildningar/ledarskap/, /lararledda-webbutbildningar/ledarskap/, /ledarskapsutbildningar/ |
| **Inkonsekvent hierarki** | Vissa ämnen är toppkategorier (BAM, BAS P/U), andra ligger under format |
| **Besökaren vilseleds** | Söker "arbete på väg" — ska de kolla webb, fysisk eller lärarledd? |

---

## Problem 3: Kunskapsbanken & gratismaterial — osynligt för Google

### Vad ni har (som de flesta konkurrenter saknar)

| Resurs | Antal | Plats |
|--------|-------|-------|
| **Kunskapsbanksartiklar** | 120+ | /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ |
| **Rutiner** | 21 st | /vara-tjanster/arbetsmiljoarbete/rutiner/ |
| **Checklistor** | 8 st | (samma sida) |
| **Mallar** | 10+ st | (samma sida) |
| **Policyer** | 5 st | (samma sida) |
| **Skriftliga instruktioner** | 13 st | (samma sida) |
| **Undersökningar/tester** | 3 st | (samma sida) |
| **Engelska dokument** | 9 st | (samma sida) |
| **AFS-föreskrifter med PDF:er** | 15+ | /vara-tjanster/arbetsmiljoarbete/afs/ |

**Totalt: 200+ gratisresurser** — checklistor, mallar, rutiner, AFS-dokument.

### Problemet

- Allt ligger **begravt** under `/vara-tjanster/arbetsmiljoarbete/...` — 3–4 nivåer djupt
- Det finns **ingen tydlig navigering** till dessa resurser från huvudmenyn
- Google-sökning på `"kompetensutveckla.se" filetype:pdf` ger **noll resultat** — era PDF:er är osynliga
- Kunskapsbanken har 120+ artiklar men de syns inte i sökresultaten pga. trasiga URL:er och dålig intern länkning
- Sidan `/rutiner-checklistor-och-mallar/` har 70+ dokument men ingen SEO-optimering

### Varför detta är pengar ni tappar

Tusentals svenskar söker varje månad efter exakt det ni redan har:

| Sökterm | Sökvolym/månad |
|---------|---------------|
| "riskbedömning mall" | ~1 500 |
| "BAM utbildning" | ~2 400 |
| "arbetsmiljö checklista" | ~1 200 |
| "skyddsrond checklista" | ~900 |
| "AFS föreskrifter" | ~800 |
| "SAM utbildning" | ~600 |
| "arbetsmiljöpolicy mall" | ~500 |
| "arbetsmiljöplan mall" | ~400 |
| **Totalt potentiellt** | **~8 300+/mån** |

Ni har redan innehållet — det behöver bara bli synligt.

---

## Vår lösning — ämnesbaserad struktur + kunskapshubbar

### Ny föreslagen struktur

```
/utbildningar/                              ← EN toppkategori för alla utbildningar
    /arbetsmiljo/
        /bam-utbildning/                    (med stad-sidor under sig)
        /sam-utbildning/
        /skyddsombudsutbildning/
    /sakerhet/
        /sakra-lyft/
        /slutna-utrymmen/
        /arbete-pa-hojd/
    /elsakerhet/
        /esa-instruerad-person/
        /esa-fackkunnig/
    /vag-och-transport/
        /arbete-pa-vag/
        /adr-utbildning/
    /ledarskap/
        /ny-som-chef/
        /leda-utan-att-vara-chef/
    /bygg-och-anlaggning/
        /bas-p-och-bas-u/
        /stallningsbyggare/
    /kris-och-beredskap/

/kunskapsbank/                              ← KUNSKAPSHUB — egen toppkategori!
    /arbetsmiljo/
        /checklistor/
        /mallar/
        /rutiner/
        /artiklar/
    /lagar-och-regler/
        /afs-foreskrifter/
        /arbetsmiljolagen/
    /roller/
        /skyddsombud/
        /arbetsgivare/
        /bas-p-bas-u/
    /amnen/
        /stress/
        /buller/
        /ergonomi/
        /brand/
```

### Format som filter — inte kategori

Leveransformatet (Webb, Lärarledd, Fysisk) blir en **filterfunktion/tagg** på varje utbildningssida:

```
/utbildningar/arbetsmiljo/bam-utbildning/
    [Webb] [Lärarledd] [Fysisk — 44 städer]
```

Kunden väljer ämne först → sedan format. Precis som de söker på Google.

### Kunskapshubbar — lead-maskiner

Varje kunskapshub blir en **landningssida** som:
1. Rankar på informationella sökord ("riskbedömning mall", "arbetsmiljö checklista")
2. Erbjuder **gratis nedladdning** (PDF/checklista/mall)
3. Samlar leads (e-post vid nedladdning — valfritt)
4. Länkar vidare till **relevanta utbildningar** = konvertering

**Exempel: Hub "Checklistor & Mallar"**
- Besökare söker "riskbedömning mall" → hittar er sida
- Laddar ner mallen gratis
- Ser: "Vill du lära dig göra riskbedömningar professionellt? → SAM-utbildning"
- Bokar utbildning

---

## Vad kunden tjänar på det — ROI-analys

### Konservativ beräkning

| Parameter | Värde |
|-----------|-------|
| Extra organisk trafik/mån (via kunskapshubbar + bättre struktur) | +2 000 besökare |
| Konverteringsgrad till kursbokning | 1% |
| Extra bokningar/mån | 20 st |
| Snittordervärde per kursbokning | ~2 000 kr |
| **Extra intäkt per månad** | **~40 000 kr** |
| **Extra intäkt per år** | **~480 000 kr** |

### Vad ni får utöver intäkter

- **971 trasiga länkar fixade** → bättre användarupplevelse direkt
- **Topical authority** i Google → ni äger "arbetsmiljö utbildning"-nischen
- **Skalbar struktur** → nya utbildningar och ämnen läggs enkelt till
- **Kunskapshubbar som lead-generatorer** → gratis innehåll driver betald kursbokning
- **Bättre EduAdmin-integration** → kurskatalog synkar med SEO-optimerad struktur

---

## EduAdmin-integration — så gör vi det

Er kursbokning drivs av **EduAdmin** (MultiNet Interactive AB) — ett WordPress-plugin som automatiskt skapar kurssidor och bokningsfunktionalitet.

### Vad vi behöver från er

| Behov | Varför |
|-------|--------|
| **EduAdmin API-nyckel** | För att synka kurskategorier med den nya strukturen |
| **WordPress admin-inlogg** | För att göra tekniska ändringar i staging-miljö |
| **Tillgång till staging/dev-miljö** | Allt testas innan det går live |

### 9-stegs process — allt i testmiljö först

| Steg | Aktivitet |
|------|-----------|
| 1 | Sätta upp staging-kopia av sajten |
| 2 | Koppla EduAdmin API till staging |
| 3 | Strukturera om kategorier i EduAdmin |
| 4 | Konfigurera WP-pluginet med nya kategorier |
| 5 | Bygga & implementera 301-redirects (gamla → nya URL:er) |
| 6 | Fixa breadcrumbs & intern länkning |
| 7 | Testa att alla kurser synkar korrekt |
| 8 | **Kund godkänner staging** |
| 9 | Push till produktion |

**Ni godkänner innan något går live.** Noll risk.

---

## Vad ingår i omläggningen

| Tjänst | Beskrivning |
|--------|-------------|
| **Kategoristruktur-omläggning** | Komplett omstrukturering från leveransformat till ämnesbaserad |
| **URL-struktur optimering** | Nya SEO-vänliga URL:er för alla 600+ sidor |
| **301-redirects** | Alla gamla URL:er pekas om till nya (inga 404:or) |
| **Taxonomi & tagg-optimering** | Format (Webb/Fysisk/Lärarledd) som filter istället för kategori |
| **Kunskapshub-uppsättning** | Ny toppkategori med landningssidor för checklistor, mallar, AFS mm |
| **Breadcrumb-struktur** | Uppdaterade breadcrumbs som visar rätt hierarki |
| **EduAdmin-konfiguration** | Synka kurskategorier med nya strukturen |

---

## Vad händer om ni inte gör något?

- **971 trasiga länkar** fortsätter ge dålig användarupplevelse
- **200+ gratisresurser förblir osynliga** för Google → ingen gratis trafik
- Google tappar förtroende för sajten → **sjunkande ranking**
- Kunder hittar inte era utbildningar via sök
- Konkurrenter med bättre struktur tar era positioner
- **~480 000 kr/år i potentiell extraintäkt** uteblir
- Problemet växer för varje ny utbildning ni lägger till

---

## Prissättning

| Paket | Pris |
|-------|------|
| **Kategoristruktur-omläggning** | 7 500 kr |
| URL-struktur optimering | 4 500 kr |
| 301-redirects (alla 142+ URL:er) | 2 250 kr |
| Taxonomi & tagg-optimering | 5 250 kr |
| Breadcrumb-struktur | 3 750 kr |
| | |
| **Totalpaket (allt inkluderat)** | **23 250 kr** |

*Alla priser exkl. moms.*

*Kunskapshub-uppsättning och EduAdmin-konfiguration ingår i totalpaketet.*

---

## Tidplan — 3 veckor

| Vecka | Aktivitet |
|-------|-----------|
| 1 | SEO-audit, nyckelordsanalys, kartlägga alla kurser → nya kategorier, bygga redirect-lista |
| 2 | Staging: Ny kategoristruktur, EduAdmin-konfiguration, URL-flytt, kunskapshub-setup |
| 3 | 301-redirects, breadcrumbs, intern länkning, QA & testning, kund-godkännande, lansering |

**Leverans: 3 veckor från godkännande.**

---

## Vad vi kan starta UTAN EduAdmin-access

Om ni inte har EduAdmin API-nyckeln direkt kan vi redan börja med:

- SEO-audit av hela sajten
- Komplett nyckelordsanalys
- Kartlägga alla kurser och planera nya kategorier
- Meta-titlar & beskrivningar via Rank Math
- Bygga hela redirect-listan (142+ URL:er)
- Teknisk SEO-genomgång

**Det som kräver EduAdmin:** Kategoriomstrukturering, kurssynk, staging-test.

---

## Nästa steg

1. Ni godkänner förslaget
2. Vi behöver: **EduAdmin API-nyckel** + **WP admin-inlogg** + **staging-miljö**
3. Vi sätter igång med audit och nyckelordsmappning (kan starta direkt)
4. Ni får en detaljerad plan innan vi bygger
5. Allt testas i staging — ni godkänner innan det går live
6. Lansering stegvis med löpande avstämning

---

*Searchboost — vi gör er synliga.*
