# Briefing: Google Ads for E-commerce — Komplett utbildningsdokument

> Sammanstalld 2026-02-14 | Searchboost Opti
> Syfte: Utbildningsmaterial for teamet infor expansion till Google Ads-forvaltning for svenska e-handelskunder (WooCommerce SMB).
> Malgrupp: Searchboost-teamet (Mikael, Viktor + eventuella nya medarbetare)

---

## INNEHALL

1. [DEL 1 — Google Ads for E-commerce: Grundkoncept](#del-1)
2. [DEL 2 — Produktfeed-optimering (Google Merchant Center)](#del-2)
3. [DEL 3 — Basta produktfeed-verktygen (2025-2026)](#del-3)
4. [DEL 4 — Kostnadsstrategier for Google Ads](#del-4)
5. [DEL 5 — Quality Score pa produktsidor (Landing Page Experience)](#del-5)
6. [DEL 6 — Svensk marknadsspecifik information](#del-6)
7. [BILAGA — Ordlista, checklistor och mallar](#bilaga)

---

<a id="del-1"></a>
# DEL 1 — Google Ads for E-commerce: Grundkoncept

## 1.1 ROAS (Return on Ad Spend)

### Vad ar ROAS?

ROAS mater hur mycket intakt varje annoskrona genererar. Det ar det viktigaste nyckeltal for e-handelsannonsering.

**Formel:**

```
ROAS = Intakt fran annonser / Annonskostnad

Exempel: 50 000 kr intakt / 10 000 kr annonskostnad = 5.0x ROAS (eller 500%)
```

### Skillnad mellan ROAS och ROI

| Matetal | Formel | Inkluderar |
|---------|--------|------------|
| **ROAS** | Intakt / Annonskostnad | Bara annonskostnaden |
| **ROI** | (Vinst - Total kostnad) / Total kostnad | Alla kostnader: varor, personal, verktyg, annonser |

**Viktigt for kunder:** En ROAS pa 5x later bra, men om varumarginalen ar 20% sa ar den faktiska vinsten liten. Kunden maste forsta skillnaden.

### ROAS-benchmarks per bransch (e-commerce)

| Bransch | Genomsnittlig ROAS | Bra ROAS | Utmarkt ROAS |
|---------|-------------------|----------|--------------|
| **Mobler & inredning** | 3-5x | 5-8x | 8x+ |
| **Klader & mode** | 3-4x | 5-7x | 7x+ |
| **Elektronik** | 2-4x | 4-6x | 6x+ |
| **Skonhet & halsa** | 4-6x | 6-10x | 10x+ |
| **Livsmedel & dryck** | 2-3x | 3-5x | 5x+ |
| **Sport & fritid** | 3-5x | 5-8x | 8x+ |
| **Hemtjanster** | 3-5x | 5-7x | 7x+ |
| **B2B / kontorsmobler** | 4-8x | 8-12x | 12x+ |

**For svenska SMB-kunder:** Sikta pa minst 4x ROAS som breakeven-riktvarde. Under 3x ar vanligtvis olonsamt om man raknar in alla kostnader. Over 6x ar bra, over 10x ar utmarkt.

### Hur ROAS paverkas av marknaden

- **Hogsasong** (Black Friday, jul): ROAS sjunker 20-40% pa grund av hogre CPC-konkurrens
- **Lagsasong** (jan-feb, sommar): ROAS stiger — lagre CPC och mindre konkurrens
- **Nya kampanjer**: Forsta 2-4 veckorna har lagre ROAS (maskininlarning behover data)
- **Returnivraer**: ROAS baserat pa bruttointakt ar missvisande om returerna ar hoga

### Enkel forklaring for kunder:

> "ROAS visar hur manga kronor ni far tillbaka for varje krona ni lagger pa annonser. Om ROAS ar 5x sa far ni 5 kr tillbaka for varje 1 kr. Vi siktar pa att ligga over 4x for att det ska vara lonsamt efter alla kostnader."

---

## 1.2 Quality Score (Kvalitetspoang)

### Vad ar Quality Score?

Quality Score ar Googles bedomning av kvaliteten pa dina annonser, nyckelord och landningssidor. Det ar en skala fran 1-10 per nyckelord.

### De tre komponenterna

| Komponent | Vikt (uppskattad) | Vad Google mater |
|-----------|-------------------|------------------|
| **Forvantat CTR** | ~40% | Hur troligt det ar att din annons klickas jamfort med andra annonser for samma nyckelord |
| **Annonsrelevans** | ~25% | Hur val din annons matchar sokningens avsikt |
| **Landing Page Experience** | ~35% | Hur relevant, transparent och lattsurfad din landningssida ar |

### Varfor Quality Score ar avgörande

Quality Score paverkar direkt:

1. **CPC (Cost Per Click):** Hogre QS = lagre CPC. En QS pa 10 kan ge upp till 50% lagre CPC jamfort med genomsnittet. En QS pa 1 kan ge 400% hogre CPC.
2. **Ad Rank:** Bestammer om din annons visas overhuvudtaget och pa vilken position.
3. **Berattigande for tillagg:** Annonstillagg (sitelinks, priser, etc.) visas bara om QS ar tillrackligt hog.

### CPC-paverkan per Quality Score-niva

| Quality Score | CPC-justering (approximativ) |
|---------------|------------------------------|
| 10 | -50% (halva priset) |
| 9 | -44% |
| 8 | -38% |
| 7 | -29% |
| 6 | -17% |
| 5 | Baseline (genomsnitt) |
| 4 | +25% |
| 3 | +67% |
| 2 | +150% |
| 1 | +400% |

**Konkret exempel:** Om baseline CPC ar 8 SEK (QS 5), sa betalar du:
- QS 10: ~4 SEK
- QS 7: ~5.70 SEK
- QS 3: ~13.40 SEK

### Sa forbattrar du Quality Score

**Forvantat CTR:**
- Skriv overtalande annonstexter med tydlig CTA
- Anvand nyckelordet i rubriken
- Testa olika varianter (A/B-test)
- Anvand dynamisk keyword-insattning (DKI) med forsiktighet
- Lagg till alla relevanta annonstillagg (sitelinks, callouts, structured snippets)

**Annonsrelevans:**
- Strukturera kampanjer med snava annonsgrupper (SKAG eller tematiska grupper)
- Matcha nyckelord, annonstext och landningssida tatt
- Anvand nyckelordet i minst en rubrik
- Undvik for breda annonsgrupper med blandade teman

**Landing Page Experience:**
- Se DEL 5 for detaljerad genomgang
- Snabb laddningstid (LCP under 2.5s)
- Mobilanpassad design
- Relevant innehall som matchar sokningen
- Tydlig konverteringsvag

---

## 1.3 Ad Rank — Hur Google bestammer annonsposition

### Formeln

```
Ad Rank = Bud x Quality Score x Forvantat tillaggsvarde

Dar:
- Bud = Ditt maximala CPC-bud (eller Smart Bidding-signal)
- Quality Score = 1-10 baserat pa CTR, relevans, landningssida
- Forvantat tillaggsvarde = Beraknad effekt av annonstillagg, format, etc.
```

### Praktiskt exempel

| Annonsör | Max CPC | Quality Score | Ad Rank | Position | Faktisk CPC |
|----------|---------|---------------|---------|----------|-------------|
| A | 4 SEK | 10 | 40 | 1 | 3.21 SEK |
| B | 6 SEK | 6 | 36 | 2 | 4.34 SEK |
| C | 8 SEK | 4 | 32 | 3 | 8.00 SEK |

**Insikt:** Annonsör A vinner auktionen med LAGST bud tack vare hogst Quality Score. Annonsör C betalar mest och hamnar sist.

### Ad Rank Thresholds

Google har minimitrosklar for Ad Rank. Om din Ad Rank inte nar troskeln visas din annons inte alls. Trosklarna varierar baserat pa:
- Sokordskonkurrens
- Anvandarkontekst (plats, enhet, tid)
- Amnesomrade (finans, halsa har hogre trosklar)

---

## 1.4 Smart Bidding-strategier

### Oversikt

Smart Bidding anvander Googles maskininlarning for att optimera bud i realtid for varje enskild auktion. Google analyserar over 70 signaler (enhet, plats, tid, sokhistorik, etc.).

### Alla Smart Bidding-strategier

| Strategi | Optimerar for | Bast for | Krav |
|----------|--------------|----------|------|
| **Target ROAS** | Intakt per annonskrona | E-handel med konverteringsdata | 15+ konverteringar/30 dagar |
| **Maximize Conversion Value** | Maximal total intakt | E-handel som vill vaxa | Konverteringssparing aktiv |
| **Target CPA** | Kostnad per konvertering | Lead-generering, tjanster | 15+ konverteringar/30 dagar |
| **Maximize Conversions** | Flest konverteringar | Nya kampanjer, tillvaxt | Konverteringssparing aktiv |
| **Enhanced CPC (eCPC)** | Justerar manuella bud | Overgang fran manuellt | Manuella bud satta |

### Rekommendation for e-handelskunder

**Fas 1 — Uppstart (manad 1-2):**
- Anvand **Maximize Conversions** for att samla data
- Budget: Var beredd pa hogre CPC i borjan
- Mal: Minst 30-50 konverteringar totalt

**Fas 2 — Optimering (manad 2-3):**
- Byt till **Maximize Conversion Value** med target ROAS
- Borja med lag target (200-300%) och hoj gradvis
- Lat Google fa 2-3 veckor att optimera efter varje andring

**Fas 3 — Skalning (manad 3+):**
- Hoj budget stegvis (max 20% per vecka)
- Finslipa target ROAS baserat pa kundspecifik data
- Lagg till nya produktkategorier gradvis

### Vanliga misstag med Smart Bidding

1. **For lite data:** Smart Bidding behover minst 15-30 konverteringar pa 30 dagar. Med farre ar manuella bud battre.
2. **For aggressiv target:** Att satta ROAS-target pa 800% direkt ger noll visningar. Borja lagt.
3. **Standiga andringar:** Varje andring aterstar inlarningsperioden (1-2 veckor). Lat strategin arbeta.
4. **Ignorera sasonger:** Justera targets under kampanjperioder (Black Friday, jul).
5. **Felaktig konverteringssparing:** Om transaktionsvarden inte sportas korrekt optimerar Google fel.

---

## 1.5 Performance Max (PMax) — E-handelns viktigaste kampanjtyp

### Vad ar Performance Max?

Performance Max ar Googles mest avancerade kampanjtyp som automatiskt visar annonser over ALLA Googles kanaler fran en enda kampanj:

- **Google Sok** (inklusive Shopping)
- **YouTube** (video)
- **Display-natverket** (banners)
- **Discover** (nyhetsflode)
- **Gmail** (annonser i inkorgen)
- **Maps** (lokala annonser)

### Hur PMax fungerar for e-handel

1. **Produktfeed** fran Google Merchant Center ar basen
2. **Asset Groups** med bilder, videor, rubriker och beskrivningar
3. **Audience Signals** (malgruppstips) hjalper Google hitta ratt kunder
4. **Smart Bidding** optimerar automatiskt bud per kanal och auktion

### Struktur for e-handelskampanjer

```
Performance Max Kampanj
├── Asset Group 1: Kontorsmobler
│   ├── Produktfeed: Kategori "Kontorsmobler"
│   ├── Bilder: 5-20 st (produktbilder + livsstilsbilder)
│   ├── Rubriker: 5 st (max 30 tecken) + 5 langa (max 90 tecken)
│   ├── Beskrivningar: 5 st (max 90 tecken)
│   └── Audience Signal: In-market "Kontorsmobler"
│
├── Asset Group 2: Kontorsstolar
│   ├── Produktfeed: Kategori "Kontorsstolar"
│   └── ... (unika assets per kategori)
│
└── Asset Group 3: Skrivbord
    └── ...
```

### Best Practices for PMax E-handel

**Produktfeed (viktigast):**
- Optimerade titlar och beskrivningar (se DEL 2)
- Hogkvalitativa produktbilder (minst 800x800 px)
- Korrekta priser, lagerstatus och GTIN
- Produktbetyg (Google Customer Reviews eller tredjepartsrecensioner)

**Asset Groups:**
- En asset group per produktkategori (inte per produkt)
- Minst 5 bilder, helst 15-20 per asset group
- Blanda produktbilder med livsstilsbilder
- Lagg till video om mojligt (aven enkel produktvideo)
- Anvand alla rubrik- och beskrivningsplatser

**Audience Signals:**
- Custom segments baserade pa konkurrenters URL:er
- In-market audiences for din produktkategori
- Remarketing-listor (sajbesokare, varukorgsoverblivare)
- Customer Match (befintliga kunder for upsell/cross-sell)

**Budget och bidding:**
- Minimum 100 SEK/dag for att fa tillracklig data
- Anvand Maximize Conversion Value med ROAS-target
- Borja utan ROAS-target de forsta 2-4 veckorna

### PMax vs Standard Shopping vs Search

| Aspekt | Performance Max | Standard Shopping | Search |
|--------|----------------|-------------------|--------|
| **Kanaler** | Alla Google-kanaler | Bara Shopping-fliken + Sok | Bara sokresultat |
| **Kontroll** | Lag (Google styr) | Medel | Hog (manuell) |
| **Automation** | Full | Delvis | Valbar |
| **Bast for** | Bred e-handel | Specifika produktkategorier | Hogtintensokning |
| **Krav** | Merchant Center + assets | Merchant Center | Nyckelord + annonstext |
| **ROAS (typisk)** | 4-8x | 3-6x | 2-5x |
| **Skalbarhet** | Hog | Medel | Lag |

### Rekommendation for Searchboost-kunder

For de flesta svenska SMB-e-handel ar **PMax + kompletterande Search** den basta strategin:

1. **PMax** for bred produktvisning (70-80% av budget)
2. **Search** for hog-intensiva nyckelord med stark kopavsikt (20-30% av budget)
3. **Standard Shopping** som komplement om PMax missar vissa produkter

---

## 1.6 Shopping Ads vs Search Ads vs Display — Jamforelse

### Google Shopping Ads

**Vad:** Produktannonser med bild, pris, butiknamn och betyg. Visas ovanfor organiska resultat.

**Fordelar:**
- Hog konverteringsgrad (2-3x hogre an textannonser)
- Visuella — kunden ser produkten innan de klickar
- Lagre CPC an textannonser (typiskt 30-50% lagre)
- Automatisk relevans via produktfeed (inget nyckelordsarbete)

**Nackdelar:**
- Kraver optimerad produktfeed
- Begransad kontroll over vilka sokningar som triggar annonsen
- Svart att exkludera irrelevanta soktermer

**Bast for:** Alla e-handlare med produkter och bilder.

### Search Ads (Textannonser)

**Vad:** Textbaserade annonser som visas i sokresultaten baserat pa nyckelord.

**Fordelar:**
- Full kontroll over nyckelord, budskap och landningssidor
- Bra for tjanster, vardeinnehall och specifika sokerbjudanden
- Exakt matchning av sokavsikt
- Enkelt att A/B-testa annonstexter

**Nackdelar:**
- Hogre CPC an Shopping
- Kraver nyckelordsresearch och lopande optimering
- Inga produktbilder

**Bast for:** Hog-intensiva nyckelord ("kop kontorsstol online"), kampanjer, sasongsannonser.

### Display Ads (Bannerannonser)

**Vad:** Bild/videoannonser som visas pa webbsajter i Googles Display-natverk.

**Fordelar:**
- Bra for varumarkeskannedom (brand awareness)
- Lag CPC (ofta under 1 SEK)
- Bra for remarketing (visa annonser for besokare som lamnat sajten)

**Nackdelar:**
- Lag konverteringsgrad (0.1-0.5% typiskt)
- Inte kopdrivet — mest "top of funnel"
- Bannerblindhet — manga ignorerar displayannonser

**Bast for:** Remarketing, varumarkesbyggande, produktlanseringar.

### Budgetfordelning for e-handel

| Kampanjtyp | Budget-andel | Forvantat ROAS |
|------------|-------------|----------------|
| **Shopping (via PMax)** | 50-60% | 4-8x |
| **Search (textannonser)** | 25-35% | 3-6x |
| **Display/Remarketing** | 10-15% | 2-4x (men bra for brand) |

---

<a id="del-2"></a>
# DEL 2 — Produktfeed-optimering (Google Merchant Center)

## 2.1 Vad ar en produktfeed?

En produktfeed ar en strukturerad datafil (XML, CSV eller via API) som innehaller all information om dina produkter. Den skickas till Google Merchant Center och anvands som bas for Google Shopping-annonser och Performance Max-kampanjer.

### Dataflode

```
WooCommerce → Feed-plugin/verktyg → Google Merchant Center → Google Ads
     │                                       │
     │                                       ├── Shopping Ads
     │                                       ├── Performance Max
     │                                       ├── Free Listings (gratis)
     │                                       └── Dynamic Remarketing
     │
     └── Produktdata: titel, beskrivning, pris, bild, GTIN, kategori, lagerstatus
```

### Google Merchant Center: Grunderna

**Google Merchant Center (GMC)** ar plattformen dar du laddar upp din produktfeed. Fran 2024 ar **Google Merchant Center Next** standardversionen med forbattrat gransnitt.

**Grundkrav:**
- Verifierad och kravd webbplats
- Korrekt kontaktinformation pa sajten
- Returpolicy (synlig pa sajten)
- Sakerhet: HTTPS (SSL)
- Korrekt prissattning (masten matcha sajten exakt)
- Lagerstatus maste vara korrekt i realtid

---

## 2.2 Produktfeed-attribut — Vad spelar roll?

### Obligatoriska attribut

| Attribut | Beskrivning | Bast practice |
|----------|-------------|---------------|
| **id** | Unik produkt-ID | Anvand WooCommerce SKU |
| **title** | Produkttitel | 70-150 tecken, nyckelord forst (se optimering nedan) |
| **description** | Produktbeskrivning | 500-5000 tecken, naturligt sprak, relevanta nyckelord |
| **link** | Produkt-URL | Kanonisk URL, HTTPS |
| **image_link** | Produktbild-URL | Min 800x800 px, vit bakgrund for huvudbild |
| **availability** | Lagerstatus | `in_stock`, `out_of_stock`, `preorder` |
| **price** | Pris inkl. moms | Format: `599.00 SEK` |
| **brand** | Varumarke | Exakt varumarkesnamn |
| **gtin** | EAN/UPC-kod | 13-siffrig EAN for europeiska produkter |
| **condition** | Skick | `new`, `refurbished`, `used` |

### Starkt rekommenderade attribut

| Attribut | Beskrivning | Paverkan |
|----------|-------------|----------|
| **google_product_category** | Googles taxonomi-ID | Forbattrar matchning med 10-20% |
| **product_type** | Din egen kategori-hierarki | Hjalper kampanjstruktur |
| **sale_price** | Rea-pris | Visar overstruket originalpris + "SALE"-markering |
| **additional_image_link** | Extra bilder (upp till 10) | Okar CTR med 15-25% |
| **shipping** | Fraktkostnad | Visas i annonsen — gratis frakt okar CTR markant |
| **color** | Farg | Kritter for klader, bra for alla |
| **size** | Storlek | Kritter for klader/skor |
| **material** | Material | Filtrerbart i Shopping |
| **custom_label_0-4** | Egna etiketter | For kampanjsegmentering (marginalniva, sasongsprodukt, etc.) |

### Attribut-prioritering for svensk e-handel

**Hogst effekt (gor forst):**
1. Optimerade titlar (se 2.3)
2. Hogkvalitativa bilder
3. Korrekt GTIN/EAN
4. Google Product Category
5. Fraktinformation

**Medelhog effekt:**
6. Sale price
7. Extra bilder
8. Brand
9. Product type
10. Custom labels for segmentering

**Lagre prioritet (men bra att ha):**
11. Farg, storlek, material
12. Produktrecensioner (via Google Customer Reviews)
13. Energieffektivitet-markning

---

## 2.3 Titeloptimering — Det viktigaste for Shopping-prestanda

### Varfor titeln ar sa viktig

Produkttiteln ar det ENSKILT viktigaste attributet for Google Shopping. Google anvander titeln for att:
1. **Matcha** din produkt mot soktermen
2. **Visa** den mest relevanta texten i annonsen
3. **Ranka** din produkt jamfort med konkurrenter

### Titelstruktur per bransch

| Bransch | Optimal titelstruktur | Exempel |
|---------|----------------------|---------|
| **Mobler** | Varumärke + Produkttyp + Material + Farg + Storlek | "IKEA Markus Kontorsstol Mesh Svart" |
| **Elektronik** | Varumärke + Modell + Specifikation + Storlek | "Samsung Galaxy S24 Ultra 256GB Svart" |
| **Kläder** | Varumärke + Plaggtyp + Material + Farg + Storlek | "Gant Regular Fit Skjorta Bomull Bla XL" |
| **Skonhet** | Varumärke + Produkttyp + Storlek/Volym + Egenskap | "CeraVe Fuktighetslotion 236ml Torr Hud" |
| **Kontor** | Varumärke + Typ + Egenskap + Farg | "Kinnarps Plus 6 Kontorsstol Hojdjusterbar Gra" |

### Regler for bra titlar

**Gor:**
- Placera viktigaste nyckelordet forst
- Inkludera varumarke, produkttyp och viktiga attribut
- Anvand 70-150 tecken (Google visar ca 70 pa mobil, 150 pa desktop)
- Anvand naturligt sprak som folk soker
- Anvand siffror for storlekar och matt

**Gor inte:**
- Anvand INTE VERSALER (forbjudet av Google)
- Anvand INTE reklamord som "BAST", "BILLIGAST", "REA" i titeln
- Anvand INTE HTML-taggar eller specialtecken
- Upprepa INTE ord
- Lagg INTE in fraktinformation i titeln

### Exempel pa fore/efter

| FORE (dalig) | EFTER (optimerad) | Forbattring |
|-------------|-------------------|-------------|
| "Kontorsstol" | "Kinnarps Plus 6 Kontorsstol Ergonomisk Svart Mesh" | +80% visningar |
| "Bord 120cm" | "IKEA Bekant Hojbart Skrivbord 120x80 cm Vit" | +120% visningar |
| "SUPER BRA STOL!!! Kop nu!!!" | "HermanMiller Aeron Kontorsstol Storlek B Grafit" | Godkand av Google |

---

## 2.4 Beskrivningsoptimering

### Beskrivningens roll

Beskrivningen paverkar matchning och visas ibland i utokade Shopping-annonser. Google anvander den for att forsta produktens relevans.

### Best practices

- **Forsta 150-200 tecknen** ar viktigast — placera nyckelord har
- **500-1000 tecken** ar optimal langd
- Skriv for manniskor forst, sodtmotorer sedan
- Inkludera: material, anvandningsomrade, storlek, unika egenskaper
- Undvik: HTML, reklamsprak, jamforelser med konkurrenter

### Mall for produktbeskrivning (e-handel)

```
[Produktnamn] fran [Varumarke] ar en [produkttyp] perfekt for [anvandning].
[Viktigaste egenskapen]. [Material/tillverkning]. [Storlek/matt].
[Unik forsal]. Levereras [leveransinfo].
```

**Exempel:**
"Kinnarps Plus 6 ar en ergonomisk kontorsstol utformad for langvarigt sittande pa kontoret. Stolen har mesh-ryggstod, 5-punkt bas och hojdjusterbart lumbalstod. Maxbelastning 130 kg. Tillverkad i Sverige. Levereras monterad inom 5-7 arbetsdagar."

---

## 2.5 Bildoptimering for Shopping-annonser

### Googles bildkrav

| Krav | Standard | Shopping-specifikt |
|------|----------|--------------------|
| **Minsta storlek** | 100x100 px | 800x800 px rekommenderas |
| **Max filstorlek** | 16 MB | Haller sig under 2 MB for snabb laddning |
| **Format** | JPEG, PNG, GIF, BMP, TIFF | JPEG eller PNG |
| **Bakgrund** | Valfri | Vit bakgrund for huvudbild |
| **Vattenstampel** | Ej tillatna | Inga logotyper, text eller vattenstamplar |
| **Produktandel** | - | Produkten ska uppta 75-90% av bilden |

### Tips for battre CTR

1. **Huvudbild:** Ren produktbild pa vit bakgrund (hogst CTR for Shopping)
2. **Extra bilder:** Livsstilsbilder som visar produkten i bruk
3. **Hog kvalitet:** Skarp, valbelyst, professionell
4. **Konsistens:** Samma bildstil for alla produkter ger proffsigt intryck
5. **Olika vinklar:** Visa framsida, sida, detalj och produkt i bruk

---

## 2.6 Hur feed-kvalitet paverkar annonsresultat

### Googles "Feed Health Score"

Google betygsatter din feed baserat pa:
- **Datakvalitet:** Korrekta priser, lagerstatus, GTINs
- **Titelkvalitet:** Relevanta, beskrivande titlar
- **Bildkvalitet:** Uppfyller alla krav
- **Produktkomplettering:** Andel ifyllda attribut
- **Felprocent:** Andel produkter med fel eller varningar

### Effekt pa prestanda

| Feed Health | Effekt pa annonser |
|-------------|-------------------|
| **100% (utmarkt)** | Alla produkter visas, maximal reach, lagsta CPC |
| **80-99% (bra)** | De flesta produkter visas, nagra missas |
| **60-79% (medel)** | Manga produkter avvisas, hogre CPC pa ovriga |
| **Under 60% (dalig)** | Risk for kontosuspendering, manga avvisade produkter |

### Vanliga feed-fel och hur du fixar dem

| Fel | Orsak | Losning |
|----|-------|---------|
| **Avvisad: pris matchar inte** | Feed-pris skiljer fran sajt-pris | Synkronisera feed oftare, anvand real-time API |
| **Avvisad: bild for liten** | Bild under 100x100 px | Byt till hogupplosta bilder, minst 800x800 |
| **Varning: saknar GTIN** | EAN-kod saknas | Lagg till GTIN for alla produkter |
| **Varning: saknar google_product_category** | Ingen kategori mappad | Mappa alla produkter till Googles taxonomi |
| **Avvisad: otillracklig bild** | Vattenstampel, text pa bild, for lite produkt | Byt till ren produktbild pa vit bakgrund |
| **Avvisad: bristande tillganglighet** | 404-error pa produkt-URL | Fixa brutna lankar, ta bort slutsalda produkter |
| **Varning: farre konverteringar** | Lagerstatus "out of stock" men produkten visas | Uppdatera lagerstatus i realtid |
| **Avvisad: Promotional overlay** | Text/logotyp overlagd pa produktbild | Anvand ren produktbild, logotyp/text i separata attribut |

---

<a id="del-3"></a>
# DEL 3 — Basta produktfeed-verktygen (2025-2026)

## 3.1 Oversikt och jamforelse

### Top 6 verktyg for produktfeed-hantering

| Verktyg | Pris (ca.) | Produkter inkl. | WooCommerce | Bast for |
|---------|-----------|-----------------|-------------|----------|
| **Channable** | Fran 59 EUR/man | 500 | Ja (plugin) | Svenska byraer, multi-channel |
| **DataFeedWatch** | Fran $64/man | 1000 | Ja (plugin) | Feed-optimering, A/B-test |
| **Feedonomics** | Fran $500/man | Obegransat | Ja (API) | Enterprise, stora kataloger |
| **GoDataFeed** | Fran $39/man | 1000 | Ja (plugin) | Liten e-handel USA |
| **Productsup** | Anpassat pris | Obegransat | Ja (API) | Enterprise, global |
| **WooCommerce-plugins** | $0-79/ar | Obegransat | Nativt | Enkel feed, lag budget |

---

## 3.2 Detaljerad genomgang per verktyg

### Channable

**Oversikt:** Nedarlandsk plattform populat i Europa med starkt stod for nordiska marknader.

**Prissattning:**
- Core Small: 59 EUR/man (500 artiklar, 1 projekt, 3 kanaler)
- Core Medium: 89 EUR/man (5 000 artiklar, 3 projekt, 6 kanaler)
- Core Large: 149 EUR/man (25 000 artiklar, 5 projekt, obegransade kanaler)
- Tillvalspris for PPC-automation och Insights-modul

**Styrkor:**
- Bra stod for europeiska marknadsplatser (Prisjakt, PriceRunner, CDON, Amazon SE)
- Regelbaserad feed-optimering (if/then-regler)
- PPC-modul: Generera Google Ads automatiskt fran feed
- Flersprakigt stod (svenska titlar/beskrivningar)
- API-integration med WooCommerce

**Svagheter:**
- Grannssnittet kan vara krangugt for nyborjare
- PPC-modulen ar tillagg (extra kostnad)
- Inget inbyggt A/B-testverktyg for titlar

**Omdome for Searchboost:** Basta valet for en byra som hanterar flera kunder. Bra nordiskt stod, rimlig prissattning, och kan vaxa med kundbasen.

---

### DataFeedWatch

**Oversikt:** Populart feed-hanteringsverktyg med starkt fokus pa optimering och analys.

**Prissattning:**
- Shop: $64/man (1 000 produkter, 1 butik, 3 kanaler)
- Merchant: $84/man (5 000 produkter, 2 butiker, 10 kanaler)
- Agency: $199/man (30 000 produkter, obegransade butiker och kanaler)

**Styrkor:**
- Utmarkt feed-optimeringsmotor (regelbaserad + AI-forslag)
- A/B-testning av produkttitlar (unikt)
- Performance-analys: se vilka produkter som presterar bra/daligt
- Automatisk "unprofitable products"-identifiering
- Stark WooCommerce-plugin
- Stodjer 2000+ kanaler (Google, Meta, Prisjakt, PriceRunner)

**Svagheter:**
- Hogre pris per produkt an Channable
- Interface ar funktionsrikt men kan overvaldigta nyborjare
- Ingen PPC-automation (bara feed)

**Omdome for Searchboost:** Bast for sjoalva feed-optimeringen. A/B-test av titlar ar unikt vardefullt. Bra for byra med 3-10 kunder.

---

### Feedonomics

**Oversikt:** Enterprise-losning agd av BigCommerce. Fullservice feed-management.

**Prissattning:**
- Fran ca $500/man (anpassad offert)
- "Managed service" — Feedonomics team gor optimeringen

**Styrkor:**
- Full-service: experter optimerar din feed
- Handlar miljontals produkter utan problem
- Avancerad regelmotor
- Stodjer alla marknadsplatser och kanaler

**Svagheter:**
- For dyrt for sma e-handlare
- Overspecat for butiker med under 5000 produkter
- Lang onboarding-process

**Omdome for Searchboost:** For dyrt och overspecat for svenska SMB. Eventuellt for framtida enterprise-kunder.

---

### GoDataFeed

**Oversikt:** Amerikanskt verktyg med fokus pa enkelhet.

**Prissattning:**
- Lite: $39/man (1 000 produkter, 1 kanal)
- Plus: $99/man (5 000 produkter, 4 kanaler)
- Pro: $199/man (20 000 produkter, obegransade kanaler)

**Styrkor:**
- Enkelt att komma igang
- Bra WooCommerce-integration
- Schemalagda feed-uppdateringar
- Regelbaserad optimering

**Svagheter:**
- Fokuserat pa USA-marknaden
- Begrrasat stod for nordiska kanaler (Prisjakt, PriceRunner saknas)
- Inget A/B-testverktyg
- Inget PPC-tillagg

**Omdome for Searchboost:** Inte idealt for svensk marknad pa grund av bristande nordiskt stod.

---

### Productsup

**Oversikt:** Tyskt enterprise-verktyg for global produktdata-hantering.

**Prissattning:**
- Anpassat pris, vanligtvis 1000+ EUR/man
- Kraver demo och offert

**Styrkor:**
- Hanterar miljontals produkter
- Avancerad data-transformation
- Globalt stod (alla marknadsplatser)
- Content-pool for produktdata-berikning

**Svagheter:**
- For dyrt for SMB
- Komplex setup
- Overspecat for kunder med under 10 000 produkter

**Omdome for Searchboost:** Inte relevant for var malgrupp.

---

### WooCommerce-plugins (gratisalternativ och laga kostnader)

**De basta:**

| Plugin | Pris | Kanaler | Funktioner |
|--------|------|---------|-----------|
| **JEOT Product Feed (CTX Feed)** | Gratis / $119/ar Pro | 130+ | Mest populara gratis-alternativet. Skapar XML/CSV-feeds for Google, Meta, Prisjakt. Pro ger dynamisk prissattning och varianter |
| **Product Feed Pro (WooCommerce)** | Gratis / $89/ar | 100+ | Enkel setup, bra for nyborjare. Stodjer Google, Bing, Meta |
| **Google Listings & Ads (Google)** | Gratis | Google | Googles eget plugin. Synkroniserar direkt till Merchant Center. Begransat men gratis |
| **YITH Google Shopping** | $69/ar | Google | Enkel, paalitlig, bra for bara Google Shopping |

**Nar plugins racker:**
- Kund med under 500 produkter
- Bara Google Shopping (en kanal)
- Budget under 5000 SEK/man pa annonser
- Enkel produktkatalog (fa varianter)

**Nar du behover ett "riktigt" verktyg:**
- Kund med over 500 produkter ELLER
- Flerkanalsannonsering (Google + Meta + Prisjakt) ELLER
- Behov av A/B-testning av titlar ELLER
- Komplex prissattning (kampanjer, tidsbaserade priser) ELLER
- Byra som hanterar flera kunder

---

## 3.3 Rekommendation for Searchboost

### Kortsikt (1-3 kunder)

**Anvand WooCommerce-plugin (CTX Feed Pro):**
- Kostnad: ~$119/ar per kund
- Racker for enkel Google Shopping + Meta
- Kunden kan aga verktyget sjalv
- Searchboost satter upp och optimerar

### Mellansikt (3-10 kunder)

**Ga over till DataFeedWatch (Agency-plan):**
- Kostnad: $199/man for alla kunder
- A/B-test av titlar
- Performance-analys
- Professionell byra-profil

### Langsikt (10+ kunder)

**Channable (Core Medium/Large):**
- Kostnad: 89-149 EUR/man
- PPC-automation
- Multi-channel (Prisjakt, PriceRunner, Amazon SE)
- Skalbart med kundbasen

---

<a id="del-4"></a>
# DEL 4 — Kostnadsstrategier for Google Ads

## 4.1 Budgetallokering for sma e-handlare

### Budgetramar per kundstorlek

| Budget (SEK/man) | Kundprofil | Kampanjstruktur | Forvantat resultat |
|-------------------|-----------|-----------------|-------------------|
| **5 000** | Mikro (under 100 produkter) | 1 PMax-kampanj | 20-50 konverteringar/man |
| **10 000** | Liten (100-500 produkter) | 1 PMax + 1 Search | 40-100 konverteringar/man |
| **15 000** | Medel (500-1000 produkter) | 1 PMax + 2 Search + Remarketing | 60-150 konverteringar/man |
| **20 000** | Stor SMB | 2 PMax + 3 Search + Remarketing | 80-200 konverteringar/man |

**OBS:** Dessa siffror ar uppskattningar baserade pa svensk e-handel med genomsnittligt ordervarde pa 500-2000 SEK.

### Rekommenderad fordelning (10 000 SEK/man)

```
Total budget: 10 000 SEK/man
├── Performance Max: 6 000 SEK (60%)
│   └── Bredaste reach, alla kanaler, produktfeed-baserat
├── Search (Brand + High-intent): 2 500 SEK (25%)
│   ├── Brand keywords: 500 SEK (skydda varumarket)
│   └── High-intent keywords: 2 000 SEK ("kop", "pris", "bestall")
└── Remarketing (Display): 1 500 SEK (15%)
    └── Besokare som inte kopte, varukorgsoverblivare
```

### Budgeteskalering — Sa hojor du utan att slosa

**Regel:** Hoj aldrig med mer an 20% per vecka. Stora budgethojningar aterstar maskininlarningen.

| Vecka | Budget | Andring | Fokus |
|-------|--------|---------|-------|
| 1-2 | 10 000 | Baseline | Samla data, lat Smart Bidding lara sig |
| 3-4 | 10 000 | 0% | Analysera resultat, optimera feed |
| 5-6 | 12 000 | +20% | Om ROAS > 4x, hoj forsiktigt |
| 7-8 | 14 000 | +17% | Fortsatt om ROAS haller |
| 9-10 | 17 000 | +21% | Lagg till ny kampanj/kategori |
| 11-12 | 20 000 | +18% | Stabilisera och optimera |

---

## 4.2 Kampanjstruktur for maximal ROAS

### Kampanjhierarki (rekommenderad)

```
Google Ads-konto
│
├── Kampanj 1: PMax — Hela sortimentet (60% av budget)
│   ├── Asset Group: Kategori A (hogmarginal)
│   ├── Asset Group: Kategori B (medelkategorier)
│   └── Asset Group: Kategori C (lagmarginal) → lagre bud
│
├── Kampanj 2: Search — Varumarkessok (5% av budget)
│   └── Annonsgrupp: [Varumarke]-varianter
│       └── "kontorsmobler smaland", "smalands kontorsmobler"
│
├── Kampanj 3: Search — Hog kopavsikt (20% av budget)
│   ├── Annonsgrupp: "Kop kontorsstol"
│   ├── Annonsgrupp: "Kontorsstol pris"
│   └── Annonsgrupp: "Kontorsstol online"
│
└── Kampanj 4: Display Remarketing (15% av budget)
    ├── Malgrupp: Sajbesokare senaste 30 dagar
    └── Malgrupp: Varukorgsoverblivare senaste 14 dagar
```

### Custom Labels for PMax-segmentering

Anvand custom labels i produktfeeden for att segmentera produkter:

| Custom Label | Anvandning | Varde-exempel |
|-------------|-----------|----------------|
| **custom_label_0** | Marginalniva | "hog_marginal", "medel", "lag_marginal" |
| **custom_label_1** | Prisklass | "under_500", "500_2000", "over_2000" |
| **custom_label_2** | Sasong | "hela_aret", "sommar", "jul" |
| **custom_label_3** | Prestanda | "bestseller", "ny_produkt", "lagpresterande" |
| **custom_label_4** | Kampanj | "black_friday", "varrea", "clearance" |

**Varfor:** Med custom labels kan du skapa separata PMax-kampanjer for hogmarginalprodukter (hogre bud) och lagmarginalprodukter (lagre bud/exkluderas).

---

## 4.3 Negativa nyckelord — Spara 20-40% av budgeten

### Vad ar negativa nyckelord?

Negativa nyckelord hindrar dina annonser fran att visas for irrelevanta sokningar. Det ar det ENKLASTE sattet att forbattra ROAS.

**OBS:** PMax stodjer negativa nyckelord pa kontoniva sedan 2024, men med begransade mojligheter. For Search-kampanjer gar det att lagga till pa kampanj- och annonsgruppsniva.

### Standardlista for svensk e-handel

Dessa negativa nyckelord bor ALLTID laggas till:

```
# Gratis-sokare
gratis
free
ladda ner
download
torrent

# Jobbsokare
jobb
ledig tjanst
arbete
karriar
anstallning
rekrytering

# Informationssokare (lagintention)
vad ar
hur fungerar
recension
test
jamforelse
bast i test
omdome
review

# Konkurrenter (om man inte vill bjuda pa dem)
ikea
jysk
mio
staples

# Begagnat
begagnad
begagnat
second hand
blocket
tradera

# DIY
bygg sjalv
gordet sjalv
ritning
instruktion
manual
```

### Branschspecifika negativa nyckelord

**Kontorsmobler:**
```
# Hemmakontor (lagre ordervarde)
hemmakontor
billig
budget
student

# Orelaterat
matbord
soffa
sang
kok
```

**E-handel allmant:**
```
# Returnrelaterat
retur
returnera
reklamation
garanti
konsumentratt

# Support
telefonnummer
kontakt
kundtjanst
oppettider
```

### Lopande nyckelordsanalys

Ga igenom **Soktermsrapporten** varje vecka:
1. Google Ads → Kampanj → Soktermer
2. Hitta irrelevanta soktermer som kostat pengar
3. Lagg till som negativa nyckelord
4. Forsta manaden: gor detta DAGLIGEN (sparar mest pengar)

---

## 4.4 Budstrategier — Jamforelse

### Manuell vs Automatisk budgivning

| Aspekt | Manuell CPC | Smart Bidding |
|--------|-------------|---------------|
| **Kontroll** | Full | Lag |
| **Tidsatgang** | Hog | Lag |
| **Datakrav** | Inga | 15-30+ konverteringar/man |
| **Skalbarhet** | Dalig | Bra |
| **Bast for** | Nya konton, labudget, testning | Etablerade konton med data |
| **Risk** | Over- eller underbud | Google kan slosa budget |

### Nar ska du anvanda vilken?

| Scenario | Rekommendation | Motivering |
|----------|---------------|------------|
| Nytt konto, 0 konverteringar | Manuell CPC | Inget data for Smart Bidding |
| 5-15 konverteringar/man | Maximize Clicks | Samla mer data |
| 15-30 konverteringar/man | Maximize Conversions | Lat Google optimera |
| 30+ konverteringar/man | Target ROAS | Full optimering med ROAS-mal |
| Black Friday / kampanj | Lagre ROAS-target temporart | Hojt bud ger fler visningar |
| Lagsasong (sommar) | Hojt ROAS-target | Fokusera pa lonsamma klick |

---

## 4.5 Sasongsanpassning for svensk e-handel

### Sasongskalender

| Period | CPC-trend | Budget-strategi | Fokus |
|--------|-----------|-----------------|-------|
| **Jan** | Lag (-20%) | Normal budget | Nyarslosningar, rea |
| **Feb** | Lag (-15%) | Normal budget | Alla hjartans dag |
| **Mar** | Medel | Hoj 10% | Varsasong borjar |
| **Apr** | Medel-Hog | Hoj 15% | Paskallov, varkampanjer |
| **Maj** | Medel | Normal | Morsdagen, varslut |
| **Jun-Jul** | Lag (-25%) | Sank 20% | Semester, lag e-handel |
| **Aug** | Stigande | Aterga till normal | Back to school/kontor |
| **Sep** | Medel-Hog | Hoj 10% | Hoststart |
| **Okt** | Hog | Hoj 20% | Forbered Black Friday |
| **Nov** | Mycket hog (+50%) | Max budget | Singles Day, Black Friday, Black Week |
| **Dec** | Hogst (+80%) | Max budget | Jul-shopping, sista-minuten |

### Black Friday/Jul-strategi

**4 veckor fore:**
- Optimera produktfeed (titlar, bilder, priser)
- Skapa rea-priser i feeden (sale_price)
- Forbered annonstillagg med kampanjbudskap
- Bygg remarketing-listor

**Kampanjveckan:**
- Hoj budget 50-100%
- Sank ROAS-target med 30-40% (acceptera lagre lonsamhet for volym)
- Aktivera kampanjtillagg (sitelinks med "Black Friday-erbjudanden")
- Overvaka timme for timme

**Veckan efter:**
- Sank budget tillbaka gradvis (inte tvart)
- Hoj ROAS-target tillbaka
- Analysera data for nasta ars planering

---

<a id="del-5"></a>
# DEL 5 — Quality Score pa produktsidor (Landing Page Experience)

## 5.1 Vad Google tittar pa

Landing Page Experience ar en av de tre komponenterna i Quality Score. Google bedomer:

1. **Relevans:** Matchar sidans innehall soktermen och annonsen?
2. **Anvandbarhet:** Ar sidan enkel att navigera?
3. **Laddningstid:** Hur snabbt laddas sidan?
4. **Mobilvanlighet:** Fungerar sidan bra pa mobil?
5. **Transparens:** Finns tydlig kontaktinfo, villkor, returpolicy?

### Googles officiella kriterier

| Faktor | Vad Google kollar | Paverkan pa QS |
|--------|------------------|----------------|
| **Relevant innehall** | H1, produktbeskrivning, meta-title matchar soktermen | Hog |
| **Sidladdningstid** | LCP (Largest Contentful Paint) under 2.5 sekunder | Hog |
| **Mobilanpassning** | Responsive design, inga horisontella scrollbars | Hog |
| **HTTPS** | SSL-certifikat | Kritter (utan SSL = avvisad) |
| **Navigering** | Tydlig meny, brodsmulor, sokfunktion | Medel |
| **Originalinnehall** | Inte kopierat fran leverantor/tillverkare | Medel |
| **Pop-ups** | Undvik intrusive interstitials (sarskilt pa mobil) | Medel |
| **Annonstaghet** | Inga overflodiga annonser pa sidan | Medel |
| **Kontaktinfo** | Synlig adress, telefon, e-post | Lag-Medel |

---

## 5.2 Sidladdningshastighet — Tekniska krav

### Core Web Vitals (2025 krav)

| Matetal | Bra | Behover forbattras | Daligt |
|---------|-----|--------------------|----|
| **LCP** (Largest Contentful Paint) | Under 2.5s | 2.5-4.0s | Over 4.0s |
| **INP** (Interaction to Next Paint) | Under 200ms | 200-500ms | Over 500ms |
| **CLS** (Cumulative Layout Shift) | Under 0.1 | 0.1-0.25 | Over 0.25 |

### Vanliga hastighetsproblem pa WooCommerce

| Problem | Paverkan | Losning |
|---------|----------|---------|
| **Stora bilder** | +2-5s laddningstid | WebP-format, lazy loading, max 200KB per bild |
| **For manga plugins** | +1-3s | Avinstallera onodig plugins, max 20-25 aktiva |
| **Inget cache** | Varje sidladdning fran scratch | WP Rocket eller LiteSpeed Cache |
| **Daligt hosting** | Hog TTFB (over 600ms) | Uppgradera till VPS eller managed WP-hosting |
| **Render-blockerande JS/CSS** | Fordrojer LCP | Defer JS, inline kritisk CSS |
| **Ingen CDN** | Distans till server okar laddningstid | Cloudflare (gratis) eller BunnyCDN |

### WooCommerce-specifika optimeringar

```
Rekommenderad tech stack for snabb WooCommerce:
├── Hosting: Loopia VPS / Cloudways / Kinsta (under 200ms TTFB)
├── Cache: WP Rocket ($59/ar) eller LiteSpeed Cache (gratis)
├── CDN: Cloudflare Free eller BunnyCDN ($1/man)
├── Bilder: ShortPixel ($4.99/man) for automatisk WebP + komprimering
├── Databas: WP-Optimize (gratis) for regelbunden rensning
└── Tema: GeneratePress eller Kadence (latta teman, under 50KB)
```

---

## 5.3 Mobiloptimering for WooCommerce

### Varfor mobil ar avgörande

- **73% av svensk e-handelstrafik** kommer fran mobila enheter
- Google anvander **mobile-first indexing** — mobilversionen ar den som bedoms
- **Mobilanvandare konverterar 50% lagre** an desktop — lat inte dalig UX vara orsaken

### Mobilchecklista for produktsidor

- [ ] Produktbilder visas korrekt och kan zoomas
- [ ] "Lagg i varukorg"-knappen ar stor och synlig ovanfor viknigen (above the fold)
- [ ] Priset ar tydligt synligt
- [ ] Produktbeskrivningen ar lasbar utan att zooma (minst 14px text)
- [ ] Brodsmulor fungerar och ar klickbara
- [ ] Laddningstid under 3 sekunder pa 4G
- [ ] Inga horisontella scrollbars
- [ ] Pop-ups ar icke-invasiva (liten dismiss-knapp, dyker inte upp direkt)
- [ ] Betalningsalternativ (Klarna, Swish) ar synliga
- [ ] Leveransinformation ar synlig utan att scrolla langt

---

## 5.4 Innehallsrelevans och on-page SEO

### Produktsidans struktur for maximal Quality Score

```html
<h1>Kinnarps Plus 6 Kontorsstol Ergonomisk Svart Mesh</h1>
<!-- H1 = Produktnamn med nyckelord, matchar feed-title -->

<div class="price">
  <span class="current-price">4 995 kr</span>
  <span class="original-price">6 495 kr</span>
  <!-- Tydligt pris med eventuell rabatt -->
</div>

<div class="product-meta">
  <span>Varumarke: Kinnarps</span>
  <span>Art.nr: KIN-P6-BK</span>
  <span>I lager — Leverans 3-5 arbetsdagar</span>
</div>

<div class="product-description">
  <!-- Unik beskrivning (INTE kopierad fran leverantor) -->
  <!-- Minst 150-300 ord -->
  <!-- Inkludera relevanta nyckelord naturligt -->
</div>

<div class="product-specs">
  <!-- Tekniska specifikationer i tabell -->
  <!-- Material, matt, vikt, maxbelastning etc. -->
</div>

<div class="reviews">
  <!-- Kundrecensioner med schema markup -->
  <!-- Minst 3-5 recensioner for best effect -->
</div>
```

### Schema Markup (strukturerad data)

Schema markup hjalper Google forsta produktsidan battre och kan ge rikare annonser:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Kinnarps Plus 6 Kontorsstol Ergonomisk Svart Mesh",
  "image": "https://example.se/images/kinnarps-plus6.jpg",
  "brand": { "@type": "Brand", "name": "Kinnarps" },
  "sku": "KIN-P6-BK",
  "gtin13": "7340123456789",
  "description": "Ergonomisk kontorsstol med mesh-rygg...",
  "offers": {
    "@type": "Offer",
    "price": "4995",
    "priceCurrency": "SEK",
    "availability": "https://schema.org/InStock"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.6",
    "reviewCount": "23"
  }
}
```

**Rank Math (WooCommerce)** genererar detta automatiskt om det ar korrekt konfigurerat:
- Aktivera WooCommerce-modul i Rank Math
- Satt "Product Schema" som standard for produkter
- Fyll i GTIN/EAN, varumärke och prissattning

---

## 5.5 Fortroendesignaler (Trust Signals)

### Vad Google och kunder tittar pa

| Trust Signal | Paverkan pa QS | Paverkan pa konvertering | Implementering |
|-------------|----------------|-------------------------|----------------|
| **SSL (HTTPS)** | Kritisk (krav) | Grundkrav | Let's Encrypt (gratis) |
| **Kundrecensioner** | Hog | +15-25% konvertering | Google Customer Reviews, Trustpilot |
| **Tydlig returpolicy** | Medel | +10-15% konvertering | Synlig i footer + produktsida |
| **Kontaktinfo** | Medel | +5-10% konvertering | Synlig i header + footer |
| **Betalikoner** | Lag | +5-10% konvertering | Visa Klarna, Visa, MC, Swish |
| **Fraktinfo** | Lag | +10-20% konvertering | "Fri frakt over 499 kr" i header |
| **Org.nummer** | Lag (men lagkrav) | Trovardighetssignal | I footer (svenskt lagkrav) |
| **"Trygg e-handel"** | Lag | +5% konvertering | Trygg E-handel-certifiering |

### Checklista for svensk e-handels fortroendesignaler

- [ ] SSL-certifikat (HTTPS)
- [ ] Tydlig returpolicy (14 dagars angerratt + eventuell forlangd retur)
- [ ] Synlig kontaktinfo (telefon, e-post, adress)
- [ ] Organisationsnummer i footer
- [ ] Betalningsalternativ synliga (Klarna, Swish, kort)
- [ ] Leveranstider tydligt angivna
- [ ] Fraktpolicy (pris + fri frakt-granns)
- [ ] Kundrecensioner pa produktsidor
- [ ] Trustpilot/Google Reviews widget
- [ ] "Trygg e-handel"-markning (om certifierad)
- [ ] F-skattesedel och momsregistrering synlig
- [ ] GDPR/integritetspolicy-lank

---

<a id="del-6"></a>
# DEL 6 — Svensk marknadsspecifik information

## 6.1 Genomsnittlig CPC i Sverige per e-handelskategori

### CPC-benchmarks (svenska kronor)

| Kategori | Genomsnittlig CPC (Search) | Genomsnittlig CPC (Shopping) | Konkurrens |
|----------|---------------------------|------------------------------|-----------|
| **Mobler & inredning** | 5-12 SEK | 2-6 SEK | Medel-Hog |
| **Kontorsmobler** | 8-18 SEK | 3-8 SEK | Medel |
| **Elektronik/IT** | 4-10 SEK | 2-5 SEK | Hog |
| **Klader & mode** | 3-8 SEK | 1-4 SEK | Mycket hog |
| **Skonhet & halsa** | 5-15 SEK | 2-7 SEK | Hog |
| **Sport & fritid** | 4-10 SEK | 2-5 SEK | Medel |
| **Husdjur** | 3-7 SEK | 1-4 SEK | Medel |
| **Livsmedel/dryck** | 3-8 SEK | 2-5 SEK | Lag-Medel |
| **Bygg & tradgard** | 5-12 SEK | 2-6 SEK | Medel |
| **Barn & baby** | 4-9 SEK | 2-5 SEK | Medel |

**Notering:** Shopping-annonser ar typiskt 40-60% billigare an textannonser i Sverige. Darfor ar produktfeed-optimering sa kritiskt.

### CPC-trender i Sverige

- **2023-2025:** CPC har stigit 15-25% pa grund av okad konkurrens och AI-bidding
- **Shopping CPC:** Stigit snabbare an Search CPC (fler annonsorer anvander PMax)
- **Mobil CPC:** 20-30% lagre an desktop CPC i Sverige
- **Norrland/mindre stader:** 10-20% lagre CPC an Stockholm/Goteborg/Malmo

---

## 6.2 Svenskt konsumentbeteende i Google Shopping

### Hur svenska konsumenter handlar online

**Sokbeteende:**
- Svenskar soker ofta pa **produktnamn + "bast i test"** (jamfor med "best buy" i USA)
- **Prisjamforelse** ar vanligt — manga gar via Prisjakt/PriceRunner fore kop
- **"Fri frakt"** ar ett starkt kopargument (55% av svenska konsumenter valjer butik baserat pa frakt)
- **Mobilshopping** star for ca 60-70% av trafiken men bara 40-50% av konverteringarna

**Konverteringsmonster:**
- **Genomsnittlig orderstorlek:** 500-1200 SEK for allmant e-handel
- **Konverteringsgrad (e-handel):** 1.5-3% (Sverige ar i overkant internationellt)
- **Cart abandonment:** ~70% (liknande internationellt)
- **Returnraturer:** 10-20% for varor, hogre for klader (25-35%)

### Viktiga kopargument for svenska konsumenter

| Kopargument | Vikt | Implementation |
|------------|------|----------------|
| **Fri frakt** | Mycket hog | Erbjud fri frakt over en grans (499/699/999 kr) |
| **Snabb leverans** | Hog | Visa "Leverans imorgon" eller "2-3 dagar" tydligt |
| **Klarna/Swish** | Hog | Visa betalningsalternativ tidigt |
| **Trygg e-handel** | Medel-Hog | Visa certifieringar och fortroendesignaler |
| **Svensk kundtjanst** | Medel | "Svensk kundservice" som USP |
| **Hallbarhet** | Medel (okande) | Miljomarkning, hallbarhetscertifiering |
| **Bast i test** | Medel | Visa testresultat om produkten ar testad |
| **Lokalt/Svenskt** | Medel | "Svenskt foretag" eller "Tillverkat i Sverige" |

---

## 6.3 Klarna & Swish — Paverkan pa konverteringsgrad

### Klarna

**Vad:** Sveriges mest anvanda betallosning for e-handel. Erbjuder:
- **Faktura** (betala inom 30 dagar)
- **Delbetalning** (dela upp pa 3-36 manader)
- **Direktbetalning** (bankoverring)
- **Klarna Checkout** (komplett kassalosning)

**Paverkan pa konvertering:**
- Butiker med Klarna har typiskt **20-30% hogre konverteringsgrad** an utan
- **Faktura** okar konvertering mest (kunden tar ingen risk)
- **Delbetalning** okar genomsnittligt ordervarde med 15-30% (for dyrare produkter)
- **Klarna Express** (inloggad betalning) minskar kassan till 1-2 klick

**For Google Ads:**
- Visa "Betala med Klarna" i annonstillagg
- Namna Klarna i produktbeskrivningar
- Anvand Klarna On-Site Messaging (visar "Dela upp pa X kr/man" pa produktsidan)

**Kostnad for handlaren:**
- Klarna Checkout: ~2.49-3.29% + 3-3.95 SEK per transaktion (beroende pa volymer)
- Fast manadskostnad: 0 kr (pay as you go)

### Swish

**Vad:** Mobilbetalning direkt fran bankkonto. Anvands av 8+ miljoner svenskar.

**Paverkan pa konvertering:**
- For lagre ordervarden (under 500 SEK): Swish okar konvertering med 10-15%
- Snabbast betalningen — inga inloggningar eller kortuppgifter
- Populart for impulsiv shopping

**For Google Ads:**
- Visa "Betala med Swish" i annonser for lagre priser
- Bast for mobilannonser (Swish ar en mobilapp)

**Kostnad for handlaren:**
- Swish for E-handel: 2-3 SEK per transaktion (fast avgift)
- Manadskostnad: Ca 50-150 SEK beroende pa bank

### Betalningslosningar — Sammanfattning for Google Ads

| Betallosning | Bast for | Konverteringseffekt | Google Ads-strategi |
|-------------|----------|--------------------|--------------------|
| **Klarna Faktura** | Alla ordervarden | +20-30% | Kommunicera "Betala senare" |
| **Klarna Delbetalning** | Over 1000 SEK | +15-30% ordervarde | "Fran X kr/man" i annons |
| **Swish** | Under 500 SEK | +10-15% | Framhav i mobilannonser |
| **Kortbetalning** | Internationella kunder | Baseline | Standard, behover ingen framhavning |

---

## 6.4 Moms/VAT — Visningskrav

### Regler for svensk e-handel

- **Alla priser** i annonser och pa sajt MASTE visas **inklusive moms**
- Standard momssats: **25%**
- Reducerad momssats: **12%** (livsmedel, hotell, restaurang)
- Lag momssats: **6%** (bocker, tidningar, kultur, kollektivtrafik)

### Google Merchant Center och moms

- Priser i produktfeeden MASTE vara **inklusive moms**
- Formatet ska vara: `599.00 SEK` (med landskod)
- Om du saljer till andra EU-lander maste du hantera OSS (One Stop Shop) for moms

### Annonsvisning

- Google visar priset som du anger i feeden — se till att det inkluderar moms
- "inkl. moms" behover inte skrivas ut i annonsen (underforstatt i Sverige)
- **OBS:** Om priset pa sajten skiljer sig fran feed-priset (t.ex. moms inte inkluderad i feed) avvisas produkten

---

## 6.5 Svenska marknadsplatser och prisjamforelsesajter

### Viktiga kanaler utover Google

| Plattform | Anvandare (ca.) | Typ | Kostnad for handlare |
|-----------|----------------|-----|---------------------|
| **Prisjakt** | 3+ miljoner/man | Prisjamforelse | CPC: 1.50-5 SEK |
| **PriceRunner** | 2+ miljoner/man | Prisjamforelse | CPC: 1-4 SEK |
| **CDON Marketplace** | 1.5+ miljoner/man | Marknadsplats | Provision: 8-15% |
| **Amazon.se** | Vaxande | Marknadsplats | Provision: 7-15% + 49 EUR/man |
| **Tradera** | Populart for begagnat | Marknadsplats | Provision: 3-10% |

### Varfor Prisjakt och PriceRunner ar relevanta for Google Ads

- Manga svenska konsumenter kollar Prisjakt FORE de soker pa Google
- Om din kund ar listad pa Prisjakt med bra pris okar chansen att de konverterar fran Google Ads
- **Strategi:** Se till att kunden ar listad pa Prisjakt/PriceRunner med korrekt data. Anvand samma feed (via Channable/DataFeedWatch).

---

## 6.6 Google Ads-konto for svensk e-handel — Setup-checklista

### Grundlaggande kontointtallningar

- [ ] Kontovaluta: SEK
- [ ] Tidszon: Stockholm (CET/CEST)
- [ ] Sprak: Svenska (primartmarkning) + Engelska (for expats)
- [ ] Plats: Sverige (alt. specifika regioner)
- [ ] Konverteringssparing: Google Ads-tagg + Enhanced Conversions
- [ ] Google Merchant Center lankat till Google Ads
- [ ] Google Analytics 4 lankat till Google Ads
- [ ] Auto-tagging: Aktiverat (gclid)

### Konverteringssparing (kritisk)

For korrekt ROAS-matning MASTE du spara:
1. **Koptransaktioner** med ordervarde (dynamiskt)
2. **Lagg i varukorg** (som sekundar konvertering)
3. **Betalning pabörjad** (som sekundar konvertering)

**Implementation for WooCommerce:**
```
Alternativ 1: Google Tag Manager + datalager (rekommenderas)
Alternativ 2: WooCommerce Google Analytics-plugin (enklare)
Alternativ 3: Google Listings & Ads plugin (gratis, begransat)
```

**Enhanced Conversions:** Aktivera for battre matning (sarskilt efter iOS 14 och cookie-restriktioner). Skickar hashad kunddata till Google for battre attribution.

---

<a id="bilaga"></a>
# BILAGA — Ordlista, checklistor och mallar

## A. Ordlista

| Term | Forklaring |
|------|-----------|
| **ROAS** | Return on Ad Spend — intakt delat med annonskostnad |
| **CPC** | Cost Per Click — pris per klick pa annonsen |
| **CTR** | Click-Through Rate — andel som klickar pa annonsen |
| **CPA** | Cost Per Acquisition — kostnad per konvertering |
| **CVR** | Conversion Rate — andel besokare som konverterar |
| **QS** | Quality Score — Googles kvalitetsbetyg 1-10 |
| **PMax** | Performance Max — kampanjtyp over alla Googles kanaler |
| **GMC** | Google Merchant Center — plattform for produktfeed |
| **GTIN** | Global Trade Item Number — EAN-kod |
| **SKU** | Stock Keeping Unit — artikelnummer |
| **DKI** | Dynamic Keyword Insertion — dynamisk nyckelordsinforning i annonstext |
| **SKAG** | Single Keyword Ad Group — en annonsgrupp per nyckelord |
| **LCP** | Largest Contentful Paint — hastighetsmatetal |
| **INP** | Interaction to Next Paint — interaktivitetsmatetal |
| **CLS** | Cumulative Layout Shift — visuellt stabilitetsmatetal |
| **OSS** | One Stop Shop — EU-momsrapportering for e-handel |
| **AOV** | Average Order Value — genomsnittligt ordervarde |
| **MER** | Marketing Efficiency Ratio — total intakt / total marknadsforing |

## B. Checklista: Ny Google Ads-kund (e-handel)

### Fas 1 — Analys (Vecka 1)

- [ ] Identifiera malgrupp och huvudproduktkategorier
- [ ] Nyckelordsresearch (Google Keyword Planner)
- [ ] Konkurrentanalys (vilka annonserar? vilka nyckelord?)
- [ ] Granska nuvarande sajt: hastighet, mobilanpassning, produktsidor
- [ ] Kartlagg betalningslosningar (Klarna, Swish)
- [ ] Kontrollera produktfeed-kvalitet (om existerande)
- [ ] Satt ROAS-mal baserat pa kundets marginaler

### Fas 2 — Setup (Vecka 2)

- [ ] Skapa/verifiera Google Merchant Center
- [ ] Lank GMC till Google Ads och GA4
- [ ] Satt upp produktfeed (plugin eller verktyg)
- [ ] Optimera feed: titlar, beskrivningar, bilder, GTIN
- [ ] Implementera konverteringssparing (GTM + Enhanced Conversions)
- [ ] Skapa kampanjstruktur (PMax + Search + Remarketing)
- [ ] Lagg till negativa nyckelord (standardlista + branschspecifika)
- [ ] Skapa annonstillagg (sitelinks, callouts, structured snippets)
- [ ] Satt budget och budstrategi (Maximize Conversions forst)

### Fas 3 — Lansering & optimering (Vecka 3-4)

- [ ] Lansera kampanjer
- [ ] Daglig overvakning forsta veckan
- [ ] Granska soktermer dagligen — lagg till negativa nyckelord
- [ ] Justera bud efter 7 dagar baserat pa data
- [ ] Optimera annonsgrupper som underpresterar
- [ ] A/B-testa annonstillagg

### Fas 4 — Lopande forvaltning (Manad 2+)

- [ ] Veckovis soktermsanalys
- [ ] Manadsvis ROAS-rapport till kund
- [ ] Kvartalsvis feed-audit (titlar, bilder, priser)
- [ ] Sasongsanpassning av bud och budget
- [ ] Testa nya kampanjformat och malgrupper
- [ ] Konkurrentbevakning

## C. Mall: Manadsrapport till kund

```
=== GOOGLE ADS MANADSRAPPORT — [KUND] ===
Period: [Manad] [Ar]

--- NYCKELTAL ---
Annonskostnad:     [X] SEK
Intakt (Ads):      [X] SEK
ROAS:              [X]x
Antal konverteringar: [X]
CPC (genomsnitt):  [X] SEK
CTR:               [X]%
Visningar:         [X]

--- JAMFORELSE MED FOREGAENDE MANAD ---
Annonskostnad:     [+/- X%]
Intakt:            [+/- X%]
ROAS:              [+/- X%]
Konverteringar:    [+/- X%]

--- TOP 5 PRODUKTER (INTAKT) ---
1. [Produkt] — [X] SEK intakt, [X] konverteringar
2. ...

--- TOP 5 SOKTERMER (KLICK) ---
1. [Sokterm] — [X] klick, [X] konverteringar
2. ...

--- ATGARDER UTFORDA DENNA MANAD ---
- [Atgard 1]
- [Atgard 2]
- ...

--- PLAN FOR NASTA MANAD ---
- [Planerad atgard 1]
- [Planerad atgard 2]
- ...
```

## D. Mall: ROAS-kalkylator

```
=== ROAS & LONSAMHETSKALKYLATOR ===

Indata:
- Manadsbudget (annonser):    [X] SEK
- Forvantat antal klick:       Budget / CPC = [X]
- Forvantat konverteringsgrad: [X]%
- Genomsnittligt ordervarde:   [X] SEK
- Produktmarginal:             [X]%

Utrakning:
- Forvantat antal order:       Klick x CVR = [X]
- Forvantad bruttointakt:      Order x AOV = [X] SEK
- ROAS:                        Intakt / Budget = [X]x
- Bruttovinst fran annonser:   Intakt x Marginal = [X] SEK
- Nettovinst efter annonser:   Bruttovinst - Budget = [X] SEK

Breakeven ROAS:
- Breakeven = 1 / Marginal
- Ex: Om marginal ar 40% → Breakeven ROAS = 2.5x
- Ex: Om marginal ar 25% → Breakeven ROAS = 4.0x
- Ex: Om marginal ar 20% → Breakeven ROAS = 5.0x
```

## E. Searchboost tjanseterbjudande — Google Ads

### Forslag pa paketstruktur

| Paket | Manadspris | Inkluderat | Malgrupp |
|-------|-----------|------------|----------|
| **Starter** | 4 000 SEK/man | PMax-kampanj, grundlaggande feed, manadsrapport | Under 100 produkter, under 10k ads-budget |
| **Growth** | 7 000 SEK/man | PMax + Search, feed-optimering, negativa nyckelord, veckorapport | 100-500 produkter, 10-20k ads-budget |
| **Premium** | 12 000 SEK/man | Full kampanjhantering, A/B-test, Prisjakt/PriceRunner, remarketing, veckorapport + mote | 500+ produkter, 20k+ ads-budget |

**Annonsbudget tillkommer** — kunden betalar direkt till Google.

**Resultatgaranti:** "Om vi inte nar minst 3x ROAS inom 3 manader erbjuder vi en gratis atgardsplan."

### Uppsatstning (engangskostnad)

| Tjanst | Pris |
|--------|------|
| Google Ads-kontosetup | 5 000 SEK |
| Merchant Center-setup + feed | 3 000-8 000 SEK |
| Konverteringssparing (GTM) | 3 000-5 000 SEK |
| Produktfeed-optimering (titlar + beskrivningar) | 2 000-5 000 SEK |
| **Paketpris (allt ovan)** | **10 000-15 000 SEK** |

---

## F. Snabbreferens: Google Ads formler

```
ROAS = Intakt / Annonskostnad
CPC = Annonskostnad / Antal klick
CTR = Klick / Visningar x 100
CPA = Annonskostnad / Antal konverteringar
CVR = Konverteringar / Klick x 100
Ad Rank = Bud x Quality Score x Tillaggsfaktor
Breakeven ROAS = 1 / Produktmarginal
Forvantat antal konverteringar = (Budget / CPC) x CVR
```

---

> **Dokument skapat av:** Searchboost Opti (Claude Code)
> **Datum:** 2026-02-14
> **Version:** 1.0
> **Nasta uppdatering:** Rekommenderas kvartalsvis eller vid stora forandringar i Google Ads-plattformen
