# Smålands Kontorsmöbler — Konkurrentanalys: UX, CTR & Merköp

> Forskningsunderlag för WooCommerce-bygget
> Datum: 2026-02-12
> Uppdragsgivare: Searchboost.se

---

## Sammanfattning

Denna analys undersöker 8 svenska kontorsmöbel-e-handlare och identifierar konkreta UX-mönster, konverteringsoptimeringar och merköpsstrategier som SMK kan implementera i sin WooCommerce-butik. Fokus ligger på snabba vinster som ökar konvertering utan komplex utveckling.

**Analyserade konkurrenter:**
1. DPJ Workspace (dpj.se)
2. AJ Produkter (ajprodukter.se)
3. Kontorsmöbler.se
4. Office Depot (officedepot.se)
5. Kinnarps (kinnarps.se)
6. IKEA Business (ikea.se/foretag)
7. Kontorsgiganten (kontorsgiganten.se)
8. Furniturebox (furniturebox.se)

---

## 1. PRODUKTKORT — Design & CTR-boostare

### Vad de bästa gör

| Element | DPJ | AJ Produkter | Kontorsgiganten | Furniturebox |
|---------|-----|-------------|-----------------|-------------|
| Produktbild (flera vinklar) | Ja (2 vyer) | Ja | Ja | Ja |
| Färgswatchar på kortet | Nej | Ja (visuella) | Nej | Ja |
| Badge "Nyhet" | Nej | Nej | Nej | Ja |
| Badge "Rea" / rabatt% | "Vårt bästa pris" | "-25%", "-15%" | Kampanjsektion | "-50%" med röd badge |
| Badge "Lagervara" | Ja (grön ikon) | "Tillgänglighet" | "Fler än X i lager" | "orderable" |
| Betyg/stjärnor | Trustpilot-stjärnor | Nej | Nej | Nej (visar 0) |
| Snabbköp på kortet | Nej — "Till produkt" | Ja — "Köp"-knapp | "Lägg i varukorg" | Nej |
| Pris ex/inkl moms | Båda visas | Ex moms (B2B-fokus) | Toggle | Inkl moms |
| Överkryssat ordinarie pris | Ja | Ja + "lägsta 30d" | Ja | Ja + "tidigare lägsta" |

### Rekommendationer för SMK (WooCommerce)

**PRIO 1 — Snabba vinster:**

1. **Produktbadges** — Implementera tre typer:
   - "Nyhet" (grön badge) — lägg på produkter tillagda senaste 30 dagarna
   - "Rea" med procent (röd badge) — visa rabattbelopp/procent tydligt
   - "Populär" (orange badge) — manuell taggning av bästsäljare
   - WooCommerce-plugin: "JENGA - Product Labels & Badges" (gratis) eller "WooCommerce Sale Badge" (premium)

2. **Lagerstatus direkt på kortet** — Visa "I lager" med grön prick, eller "Beställningsvara — leverans X dagar"
   - WooCommerce visar detta med inställningen: WooCommerce > Inställningar > Produkter > Lager > Visa lagerstatus

3. **Pris med överstruket ordinarie** — Alltid visa REA-pris bredvid överstruket ordinarie
   - WooCommerce hanterar detta nativt med "Ordinarie pris" + "Reapris"
   - Lägg till "Lägsta pris senaste 30 dagarna" (lagkrav i EU/Sverige sedan 2023)
   - Plugin: "Omnibus – EU legal" (gratis, visar lägsta 30-dagarspris)

4. **Företag/Privat moms-toggle** — Låt besökaren välja om priser visas ex eller inkl moms
   - Plugin: "B2BKing" eller "WooCommerce B2B" hanterar detta

**PRIO 2 — Medel ansträngning:**

5. **Färgswatchar på produktkort** — Som AJ Produkter visar (svart, grå, blå prickar)
   - Plugin: "Variation Swatches for WooCommerce" (gratis) — visar färger som cirklar
   - Kräver att produkter har variationer uppsatta (färg som attribut)

6. **Snabbköp-knapp** — "Lägg i varukorg" direkt på kategori-sidan (som Kontorsgiganten)
   - WooCommerce stödjer detta nativt för "enkla produkter"
   - För variabla produkter: Plugin "Quick View WooCommerce" (gratis)

7. **Trustpilot/Google-betyg på kort** — Som DPJ visar stjärnor direkt på produktkortet
   - Kräver Trustpilot Business-konto ELLER Google Reviews-widget
   - Alternativ: WooCommerce produktrecensioner (inbyggt) med stjärnor synliga i grid

---

## 2. KATEGORISIDOR — Filter, Sortering & Layout

### Vad de bästa gör

| Element | DPJ | AJ Produkter | Kontorsgiganten | Kontorsmöbler.se |
|---------|-----|-------------|-----------------|-----------------|
| Filterbar (sidebar) | Ja | Ja (utfällbar) | Ja | Ja (YITH) |
| Filter: Varumärke | Ja (14 st) | Ja | Ja | Ja |
| Filter: Pris (slider) | Ja (min-max) | Ja (min-max input) | Ja | Okänt |
| Filter: Färg | Nej | Ja (swatchar) | Ja | Ja (pa_color) |
| Filter: Lager/leverans | Ja | Ja | Ja | Nej |
| Filter: Kampanj/Rea | Ja (Ja/Nej toggle) | Ja | Ja | Nej |
| Filter: Eco-label | Nej | Nej | Ja | Nej |
| Sortering | Pris, Nyast | Standard + pris | A-Ö, pris, pop. | Standard WC |
| Antal produkter visas | Nej | "Visar X av Y" | Ja | Nej |
| Grid/List-toggle | Nej | Nej | Nej | Nej |
| Produkter per sida | Standard | Standard | Standard | Standard |

### Rekommendationer för SMK (WooCommerce)

**PRIO 1 — Kritiskt:**

1. **Filterpanel med relevanta attribut:**
   - Varumärke/Tillverkare
   - Prisintervall (slider)
   - Färg (visuella swatchar)
   - Material (trä, stål, tyg)
   - I lager / Beställningsvara
   - Kampanj/Rea-filter
   - Plugin: "JENGA - WooCommerce Product Filter" eller "YITH WooCommerce Ajax Product Filter" (som kontorsmobler.se använder)

2. **"Visar X av Y produkter"** — Feedback till användaren om hur många produkter som matchar
   - De flesta filter-plugins inkluderar detta

3. **Sortering utöver standard:**
   - Populärast (bestseller)
   - Lägsta/Högsta pris
   - Nyast
   - Bäst betyg
   - Namn A-Ö
   - WooCommerce stödjer detta nativt med "Standardsortering"-dropdown

**PRIO 2 — Nice to have:**

4. **Breadcrumbs** — Alla konkurrenter har det. Visa "Hem > Kontorsmöbler > Skrivbord > Höj-sänkbara"
   - Plugin: "Yoast SEO" (inbyggd breadcrumb) eller "Rank Math" (redan installerat på SMK)

5. **Sticky filter på mobil** — Filterknapp som följer med vid scroll på telefon
   - De flesta premium filter-plugins har detta inbyggt

6. **Tomma-resultat-hantering** — Om filter ger 0 resultat, visa "Inga produkter matchar — prova att ändra filter" + föreslå liknande
   - Minskar "dead ends" dramatiskt

---

## 3. TRUST SIGNALS — Förtroende som konverterar

### Branschstandard i Sverige (vad alla har)

| Trust Signal | DPJ | AJ | Kontorsg. | Office Depot | Furniturebox |
|-------------|-----|----|-----------|--------------|----|
| Garanti (år) | 10 år | 7 år | — | — | — |
| Öppet köp (dagar) | 30 d | 14 d | Fri retur | — | 365 d |
| Leveranstid | "Inom 24h" | Estimerad | "1-2 dagar" | — | "11-15 dagar" |
| Nöjda kunder (antal) | 300 000 | — | 700 000 | — | 400 000 |
| Betyg | 4.5/5 | — | — | — | — |
| ISO/certifieringar | 9001, 14001 | — | Ja | Ja | — |
| Betalmetoder synliga | — | — | Klarna, Visa, Swish | Visa, MC | Swish, kort |
| Företag/Privat-toggle | Ja | Ja | Ja | Ja | — |

### Rekommendationer för SMK (WooCommerce)

**PRIO 1 — Implementera dag 1:**

1. **USP-bar under headern** (alla stora har detta) — Horisontell rad med 3-4 ikoner:
   - "Fri frakt över X kr" (lastbilsikon)
   - "30 dagars öppet köp" (returpil-ikon)
   - "Snabb leverans 1-3 dagar" (klocka-ikon)
   - "Trygg betalning — Klarna, Swish" (lås-ikon)
   - Implementering: Enkel HTML/CSS i temat header, eller plugin "USP Bar" (gratis)

2. **Betalmetod-ikoner i footer** — Visa Klarna, Swish, Visa, Mastercard-loggor
   - Ökar förtroende omedelbart
   - Klarna/Swish erbjuder officiella badges

3. **Leveranstid på produktsidan** — "Beräknad leverans: tisdag 18 feb" (beräkna dynamiskt)
   - Plugin: "WooCommerce Estimated Delivery Date" (premium, ~$49)
   - Enklare: Statisk text "Leverans inom 3-5 arbetsdagar" som custom field

4. **"X nöjda kunder" / socialt bevis** — Visa kundantal eller Trustpilot-widget
   - Trustpilot TrustBox: Gratis widget som visar betyg i footer
   - Alternativ: Google Reviews-widget

**PRIO 2 — Inom första månaden:**

5. **Produktrecensioner** — Aktivera WooCommerce Reviews + visa stjärnor
   - Be tidiga kunder om recensioner via mejl (WooCommerce Follow-up Emails)
   - Visa "Var först med att recensera" om inga finns (bättre än att dölja)

6. **Garanti-badge på produktsidan** — "5 års garanti" bredvid pris (anpassat per tillverkare)

---

## 4. CROSS-SELL & UPSELL — Merköpsstrategier

### Vad konkurrenterna gör

| Strategi | DPJ | AJ Produkter | Kontorsgiganten | IKEA |
|----------|-----|-------------|-----------------|------|
| "Komplettera med" / tillbehör | — | "Vi rekommenderar dessa tillbehör" | "Komplementära produkter" | — |
| "Kunder köpte också" | — | "Du kanske också behöver?" | "Andra som köpte tittade på" | — |
| "Andra i serien" | — | "Andra produkter i serien {0}" | — | — |
| Paketlösningar/bundles | Konferensgrupper | "Produkter som ingår i paketet" | — | "Skrivbord och stol set" |
| "Liknande produkter" | I navigation | "Du kanske också är intresserad av" | "Rekommenderade produkter" | "Upptäck mer" |
| Volymrabatt | Ej synligt | Offertförfrågan | Låsta priser 6 mån | — |
| Abonnemang/Repeat | — | — | Automatisk ombeställning | — |

### Rekommendationer för SMK (WooCommerce)

**PRIO 1 — Största intäktspåverkan:**

1. **"Komplettera din arbetsplats"** — Tillbehörssektion på varje produktsida
   - Skrivbord → Visa: kabelhantering, skärmfäste, skrivbordslampa, kontorsmatta
   - Kontorsstol → Visa: armstöd, nackstöd, sittkudde, fotstöd
   - WooCommerce har inbyggd "Cross-sells" per produkt (redigera produkt > Länkade produkter)
   - VIKTIGT: Manuellt kurrera dessa, inte bara "relaterade via kategori"

2. **"Köp ihop och spara"** — Paketpriser
   - Skrivbord + Stol = Spara 500 kr
   - Komplett arbetsplats (bord + stol + skärmarm + lampa) = Spara 15%
   - Plugin: "WooCommerce Product Bundles" ($49, officiellt WC-tillägg) — bäst i klassen
   - Alternativ: "YITH WooCommerce Product Bundles" (gratis version tillgänglig)
   - Visa sparad summa tydligt: "Ordinarie 12 990 kr — Paketpris 10 990 kr (spara 2 000 kr)"

3. **"Andra köpte även"** — Automatisk rekommendation under produktbeskrivning
   - WooCommerce inbyggt: "Upsells" (dyrare alternativ) visas på produktsidan
   - WooCommerce inbyggt: "Cross-sells" visas i varukorgen
   - Plugin för smartare rekommendationer: "WooCommerce Product Recommendations" (officiellt, $79)

4. **"Populärast i kategorin"** — Visa bästsäljare överst i kategori-vy
   - WooCommerce sortering "Populärast" baseras på försäljningsdata
   - Lägg till "Bästsäljare"-badge (se produktkort-sektion ovan)
   - Skapa en dedikerad "Bästsäljare"-sida/kategori

**PRIO 2 — Medellång sikt:**

5. **Konferensrumspaket / Rum-baserade bundles**
   - "Inred konferensrummet" — bord + 6 stolar + whiteboard-vägg + belysning
   - "Hemmakontoret" — höj-sänkbart bord + ergonomisk stol + skärmarm
   - Skapa som WooCommerce "Grouped Products" eller med Product Bundles-plugin
   - Inspirationssida med foto av färdigt rum + "Köp hela looken"

6. **"Tillbehör"-flik på produktsidan** — Separat tab bredvid "Beskrivning" och "Specifikationer"
   - Plugin: "WooCommerce Tab Manager" eller custom code i temat
   - Visa 4-6 relevanta tillbehör med bild + pris + "Lägg till"-kryssruta

7. **Offertknapp för stora beställningar** — "Beställ 10+ stycken? Begär offert"
   - Plugin: "YITH WooCommerce Request a Quote" (premium, $99)
   - Visa tydligt på produktsidan vid högre kvantiteter
   - AJ Produkter har detta som central funktion — "Begär offert"-knapp

---

## 5. KONVERTERINGSOPTIMERING — CTA, Urgency & Checkout

### CTA-knappar (Call-to-Action)

| Element | Bästa praxis (från konkurrenterna) |
|---------|----------------------------------|
| Primär CTA | "Lägg i varukorg" — stor, tydlig, kontrastfärg |
| Sekundär CTA | "Begär offert" — för B2B, kantlinje-style |
| Färg | Grönt (DPJ), Blått (AJ), Orange (Kontorsgiganten) — alltid kontrast mot bakgrund |
| Position | Ovanför "the fold" på produktsidan, sticky på mobil |
| Varukorgsbekräftelse | Slide-in varukorgspanel (inte redirect till varukorgssida) |

### Rekommendationer för SMK:

**PRIO 1:**

1. **CTA "Lägg i varukorg"** — Stor knapp, kontrastfärg (föreslår #e91e8c / Searchboost-rosa eller en stark grön)
   - Minst 48px hög på desktop, 56px på mobil
   - Sticky "Lägg i varukorg"-bar som följer med vid scroll på mobil
   - Plugin: "Starter Templates" eller custom CSS i temat

2. **Varukorgsprogress-bar — "Fri frakt om X kr till!"**
   - AJ Produkter visar: "Du har 3 200 kr kvar till fri frakt" med progress-bar
   - Kontorsgiganten: "Fraktfritt hela landet över 995 kr"
   - Plugin: "Free Shipping Progress Bar for WooCommerce" (gratis)
   - VIKTIG konverteringsfaktor — ökar genomsnittligt ordervärde med 15-25%

3. **Betalningsalternativ synliga på produktsidan**
   - Visa Klarna-badge: "Betala om 30 dagar" eller "Dela upp i 3 delar"
   - Visa Swish-logo
   - Placera under "Lägg i varukorg"-knappen
   - Klarna erbjuder gratis "On-Site Messaging" widget

**PRIO 2:**

4. **Urgency-signaler (varsamt — inte spammigt):**
   - Lagerstatus: "Bara 3 kvar i lager" (röd text under 5 st)
   - Leveransdeadline: "Beställ inom 2h 15min för leverans imorgon"
   - WooCommerce inställning: Visa "lågt lager"-tröskel
   - Plugin: "Sales Countdown Timer" för rea-kampanjer
   - OBS: Använd sparsamt. Office Depot har countdown-timer men DPJ/AJ är mer subtila.

5. **Förenklad checkout:**
   - Aktivera WooCommerce "Express checkout" (Shop Pay / Apple Pay / Google Pay)
   - Minimera formulärfält: Namn, E-post, Adress, Betalsätt (det räcker)
   - Gästcheckout = obligatoriskt (inget tvång att skapa konto)
   - Plugin: "Fluid Checkout for WooCommerce" (gratis) — moderniserar checkout-flödet

---

## 6. B2B-FUNKTIONER — Företagskunder

### Vad konkurrenterna erbjuder

| B2B-funktion | DPJ | AJ | Kontorsgiganten | Office Depot |
|-------------|-----|----|-----------|----|
| Företag/Privat-toggle | Ja | Ja | Ja | Ja |
| Faktura-betalning | Ja | Ja | E-faktura (GLN/PEPPOL) | Ja |
| Offertförfrågan | "Projekt & Offert" | "Begär offert" + "Delad offert" | Specialbeställning | Ny företagskund-formulär |
| Volymrabatt | Via offert | Via offert | Låsta priser 6 mån | Via offert |
| Multi-konto | — | Ja (Multikonto) | — | — |
| Fri projektledning | Ja | — | — | — |

### Rekommendationer för SMK:

**PRIO 1:**

1. **Företag/Privat-toggle i header** — Byt mellan priser ex/inkl moms
   - AJ Produkter, DPJ, Kontorsgiganten — alla har detta
   - Plugin: "B2BKing" (freemium) — enklaste lösningen

2. **"Begär offert"-knapp på produktsida** — Bredvid "Lägg i varukorg"
   - Enda kontaktpunkten för stora B2B-ordrar
   - Plugin: "YITH WooCommerce Request a Quote" — kund markerar produkter, skickar offertförfrågan
   - Formulär: Företagsnamn, org.nr, kontaktperson, önskat antal, kommentar

3. **Faktura som betalmetod** — B2B-standard i Sverige
   - Klarna Faktura (30 dagar) — enklast att aktivera via Klarna Checkout
   - Alternativ: Svea Ekonomi, Billogram

**PRIO 2:**

4. **"Inredningshjälp" / Projektledning** — Som DPJ erbjuder gratis
   - Dedikerad sida: "Behöver du hjälp att inreda kontoret? Boka gratis konsultation"
   - CTA i sidebaren på kategorisidor
   - Positionerar SMK som expert, inte bara webshop

---

## 7. SÖK & NAVIGATION

### Vad konkurrenterna gör

| Element | DPJ | AJ | Kontorsgiganten |
|---------|-----|----|----|
| Sökfält i header | Ja | "Sök bland 15 000 produkter" | Ja |
| Autocomplete | Ej verifierat | Ja (med produktantal) | Ja + "Menade du?" |
| Artikelnummer-sök | — | Ja (Snabborder) | — |
| Sökhistorik | — | — | — |

### Rekommendationer för SMK:

1. **Smart sök med autocomplete** — Visa produktbilder + priser direkt i sökresultaten
   - Plugin: "FiboSearch – Ajax Search for WooCommerce" (gratis + premium)
   - Visar produktbild, namn, pris i dropdown medan man skriver
   - Premium-version ($49/år): fuzzy search, synonymer, "menade du?"
   - VIKTIGT: Sök konverterar 4-5x bättre än browsning

2. **Breadcrumbs på alla sidor** — Rank Math har detta inbyggt (redan installerat på SMK)

3. **Mega-meny med bilder** — Visa kategoriikoner i navigationen
   - Gör det enkelt att nå "Skrivbord > Höj-sänkbara" utan att gå via mellansidor

---

## 8. MOBIL UX

### Branschinsikter
- 60%+ av e-handelstrafiken i Sverige kommer från mobil
- Furniture e-commerce har 89% cart abandonment rate — mobil UX är nyckeln
- AJ Produkter, DPJ, alla konkurrenter har responsiv design

### Rekommendationer för SMK:

1. **Sticky "Lägg i varukorg" på mobil** — Knapp längst ner som alltid syns
2. **Stor "Sök"-ikon i mobil header** — Mobila besökare söker mer
3. **Collapsible filter** — Filterknapp som öppnar overlay (inte sidebar)
4. **Swipe-bild-galleri** — Produktbilder som swipas horisontellt
5. **Click-to-call telefonnummer** — "Ring oss: 0123-456 789" som knapp
6. **Snabb checkout** — Apple Pay / Google Pay / Swish direkt

---

## 9. SPECIFIKA PAKETFÖRSLAG FÖR SMK

Baserat på SMK:s produktkatalog (897 produkter, 8 kategorier) — föreslagna bundles:

### Arbetsplatspaket

| Paket | Innehåll | Prislogik |
|-------|---------|-----------|
| Starter-arbetsplatsen | Höj-sänkbart bord + Kontorsstol + Skrivbordslampa | Spara 10% |
| Premium-arbetsplatsen | Höj-sänkbart bord + Ergonomisk stol + Skärmarm + Lampa + Kabelkanal | Spara 15% |
| Hemmakontoret | Kompakt skrivbord + Stol + Bokhylla | Spara 10% |
| Konferensrummet | Konferensbord + 6 stolar | Spara 12% |
| Receptionspaketet | Receptionsdisk + Besöksstol x2 + Soffbord | Spara 10% |

### Tillbehörsmatris (cross-sell)

| Om kunden köper... | Visa dessa tillbehör |
|--------------------|---------------------|
| Skrivbord (höj-sänk) | Kabelkanal, Skärmarm, Skrivbordslampa, Kontorsmatta, Golvskydd |
| Kontorsstol | Armstöd, Nackstöd, Sittkudde, Fotstöd, Stolsunderlägg |
| Bokhylla/Förvaring | Förvaringslådor, Etiketter, Dörrsats |
| Konferensbord | Stolar (matchande), Whiteboard, Kabellucka |
| Ståmatta | Fotstöd, Skoskydd, Balansbräda |

---

## 10. IMPLEMENTATION — Prioriterad handlingsplan

### Sprint 1 (Vecka 1-2): Grundläggande förtroende & konvertering

| # | Åtgärd | Verktyg/Plugin | Kostnad | Effekt |
|---|--------|---------------|---------|--------|
| 1 | USP-bar (frakt, retur, leverans, trygg betalning) | HTML/CSS i tema | Gratis | Hög |
| 2 | Betalmetod-ikoner i footer | Klarna/Swish badges | Gratis | Hög |
| 3 | Fri-frakt-progress-bar i varukorgen | Free Shipping Progress Bar | Gratis | Hög |
| 4 | Aktivera produktrecensioner + stjärnor | WooCommerce inbyggt | Gratis | Medel |
| 5 | Breadcrumbs (Rank Math) | Redan installerat | Gratis | Medel |
| 6 | Gästcheckout aktiverat | WooCommerce-inställning | Gratis | Hög |

### Sprint 2 (Vecka 3-4): Produktpresentation & filter

| # | Åtgärd | Verktyg/Plugin | Kostnad | Effekt |
|---|--------|---------------|---------|--------|
| 7 | Produktbadges (Nyhet, Rea, Populär) | Product Labels plugin | Gratis/~$39 | Hög |
| 8 | Lagerstatus synlig på kort + produktsida | WooCommerce-inställning | Gratis | Hög |
| 9 | Filterpanel (pris, färg, varumärke) | YITH Ajax Filter (gratis) | Gratis | Hög |
| 10 | Smart sök med autocomplete | FiboSearch (gratis) | Gratis | Hög |
| 11 | Klarna On-Site Messaging | Klarna widget | Gratis | Medel |
| 12 | Leveranstid på produktsida | Custom field eller plugin | Gratis/~$49 | Medel |

### Sprint 3 (Vecka 5-6): Cross-sell & merköp

| # | Åtgärd | Verktyg/Plugin | Kostnad | Effekt |
|---|--------|---------------|---------|--------|
| 13 | Cross-sells per produkt (manuellt kurera) | WooCommerce inbyggt | Gratis | Hög |
| 14 | Upsells per produkt (dyrare alternativ) | WooCommerce inbyggt | Gratis | Hög |
| 15 | 5 paketlösningar (arbetsplats-bundles) | Product Bundles ($49) | $49 | Hög |
| 16 | "Komplettera med" tillbehörssektion | WC inbyggt + template | Gratis | Hög |
| 17 | "Populärast i kategorin"-sortering | WooCommerce inbyggt | Gratis | Medel |

### Sprint 4 (Vecka 7-8): B2B & avancerat

| # | Åtgärd | Verktyg/Plugin | Kostnad | Effekt |
|---|--------|---------------|---------|--------|
| 18 | Företag/Privat moms-toggle | B2BKing (gratis) | Gratis | Hög |
| 19 | "Begär offert"-funktion | YITH Request a Quote | ~$99 | Hög |
| 20 | Inredningshjälp-sida (CTA i sidebar) | Sida + formulär | Gratis | Medel |
| 21 | Färgswatchar på produktkort | Variation Swatches | Gratis | Medel |
| 22 | Fluid Checkout | Fluid Checkout plugin | Gratis | Medel |

### Totalkostnad plugins: ~$240 (engångskostnad, de flesta har gratis alternativ)

---

## 11. KPI:er att följa

| KPI | Mål (efter 3 mån) | Verktyg |
|-----|-------------------|---------|
| Konverteringsgrad | 2.0%+ (bransch: 1-2%) | GA4 |
| Genomsnittligt ordervärde | +15% vs baseline | WooCommerce Analytics |
| Sidor per session | 4+ | GA4 |
| Cart abandonment rate | <75% (bransch: 89%) | GA4 + WC |
| Sökkonvertering | 5%+ (sökanvändare) | FiboSearch analytics |
| Bundle attach-rate | 20%+ (köper bundle vs enskilt) | WC Reports |
| Mobil konvertering | 1.5%+ | GA4 |

---

## 12. Konkurrenternas svagheter (SMK:s möjligheter)

1. **Kontorsmobler.se** — Minimal UX, inga recensioner, inga badges, svag filtrering. Deras WooCommerce-implementation är grundläggande. SMK kan enkelt överträffa med basoptimering.

2. **DPJ** — Bra trust signals men inget snabbköp på kategori-sida. Långsam path-to-purchase.

3. **AJ Produkter** — Starkt B2B men priserna är ex moms som default, förvirrande för privatkunder. SMK kan vara mer tillgänglig för båda segmenten.

4. **Kinnarps** — Primärt inspirationssajt, inte e-handel. Ingen prisinfo synlig. SMK vinner på transparens och direkt köpmöjlighet.

5. **Kontorsgiganten** — Bäst-i-klass på B2B-funktioner men bred sortiment (inte kontorsmöbler-specialist). SMK kan positionera sig som specialisten.

6. **IKEA** — Massmarknad, ingen personlig service. SMK vinner på rådgivning, specialistkunskap, och B2B-anpassning.

---

## Källor

Analysen baseras på direkt granskning av konkurrenternas webbplatser (2026-02-12) samt branschrapporter om furniture e-commerce UX best practices.
