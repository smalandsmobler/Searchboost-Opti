# E-handelskategori-research — Vilken nisch ska vi pusha?

> **Datum:** 2026-05-28
> **Frågeställning:** Vilken produktkategori är enklast att pusha när vi kan bygga e-handel på några timmar?
> **Kritiskt krav:** **INGET eget lager** — skickas direkt från tillverkare (dropship/3PL via tillverkaren själv)
> **Trigger:** SMK har halv pris mot konkurrenterna men kör inte Shopping → uppenbar arbitrage
> **Status:** Marknadsscan klar. Rekommendation + alternativ nedan.

---

## TL;DR — Rekommendation

**Bygg först: "SMK Shopping-feed" på smalandskontorsmobler.se** (samma sajt, inte ny butik).
SMK har redan lager + tillverkarrelation + halv pris vs konkurrenterna. Vi behöver bara:

1. WooCommerce-feed → Google Merchant Center → Shopping-kampanj
2. GTM + konvertering på plats (delvis gjort enligt CLAUDE.md)
3. 5–10 dagar test med 100–300 kr/dag budget

**Risk:** Låg (befintliga kunder, befintlig lagerhantering, "bara" trafik som saknas).

**Sen, om vi vill bygga från noll på dropship-modell:**
- **Prio 1:** *Akustikpaneler/ljudabsorbenter* (svenska tillverkare i Småland, hög marginal, växande hemmakontor-segment, svaga e-handelsaktörer)
- **Prio 2:** *Industri-/lager-möbler för småföretag* (pallställ, bockar, verkstadsbänkar — Gerdmans/Witre dominerar B2B men SMB är öppen flank)
- **Prio 3:** *Begagnade kontorsmöbler* (Rekomo-modellen — ingen produktion alls, höga marginaler)

---

## 1. Analys av SMK-möjligheten (kontorsmöbler)

### Vad vi vet
- SMK har eget lager + 2-3 dagars leverans + 2 års garanti
- Halv pris mot konkurrenter på samma produkter (enligt Mikael)
- **Kör INTE Google Shopping idag** ← uppenbar lucka
- Pågående Abicart-bugg gör att produktdata inte alltid visas → blockerare just nu
- WooCommerce-migrering planerad (CLAUDE.md)

### Konkurrenslandskap (kontorsmöbler online, Sverige)
| Aktör | Storlek | Shopping? | Pris-nivå | Lager |
|-------|---------|-----------|-----------|-------|
| AJ Produkter | ~1000 anställda, 20 marknader | Ja, aggressivt | Premium | Egna |
| DPJ Workspace | 36 000 artiklar (6 000 i lager), Stockholm | Ja | Premium | Eget + tillverkare |
| Senab | Stor (kontrakt med staten via SKL Kommentus) | Sparsamt | Premium | Eget |
| Kinnarps/EFG/Edsbyn | Tillverkare, säljer via återförsäljare | Nej (eller via partners) | Premium | N/A |
| Gerdmans | Storkonkurrent på industri/lager | Ja | Mid | Eget |
| **SMK** | Liten, familjeägd | **NEJ** | **HALV** | Eget |

### Slutsats
SMK är den enda aktören med (a) prisförsprång, (b) eget lager, (c) **utan Shopping**.
**Detta är "gratis pengar"-arbitrage** — bara köra Shopping-kampanj med samma produkter.

### Action: 5-dagars test
```
Dag 1: Fixa Abicart-buggen (eller acceptera och migrera till Woo redan nu)
Dag 2: Produktfeed → Merchant Center
Dag 3: Performance Max kampanj, budget 200 kr/dag
Dag 4-7: Mät CPA, ROAS
Beslut: Skala om ROAS > 3, döda annars
```

---

## 2. Marknads-scan — Andra dropship-möjligheter

### Princip för dropship utan eget lager
Vi behöver **svenska tillverkare** som:
- (a) Har egen leverans/3PL men ingen stark egen e-handel
- (b) Vill ha försäljningsvolym utan att bygga eget e-handelsteam
- (c) Kan skicka direkt till slutkund i SMK-stil

**Internationella dropship-portaler (BigBuy, SaleHoo, AppScenic)** är OUT för oss — vi vill bygga något varaktigt i Sverige med snabb leverans, inte AliExpress-arbitrage.

### Kategori-matris

| Kategori | Tillverkare | Konkurrens | Marginal | Shopping-konkurrens | Dropship-lätthet | Score |
|----------|-------------|------------|----------|---------------------|------------------|-------|
| **Akustikpaneler** | Lundbergs (Småland), Träullit (Ydre), WoodUpp | Medel (Bauhaus, Byggmax, jem&fix dominerar generella, men nisch-aktörer som Kamak och Bullerbekämparen är små) | Hög (premium-produkt) | **Låg** | Hög (svenska tillverkare, B2B-vänliga) | **8/10** |
| **Industri-/lagermöbler SMB** | EAB, Constructor, lokala tillverkare | Hög för B2B-pro (Gerdmans, Witre, AJ), **låg för SMB** | Medel | Medel | Hög | **7/10** |
| **Begagnade kontorsmöbler** | Företag som rensar kontor (manuellt insamlat lager) | Låg (Rekomo i princip ensam) | **Mycket hög** (60–80%) | **Mycket låg** | N/A (ingen tillverkare) | **8/10** |
| **Höj/sänk-skrivbord** | Linak (DK), Jiecang, Logicdata | **Mycket hög** | Låg-medel | **Mycket hög** | Medel | **3/10** |
| **Kontorsstolar** | RH/Flokk, HÅG, Kinnarps | **Mycket hög** | Låg-medel | **Mycket hög** | Medel | **3/10** |
| **Trädgårdsmöbler** | Hillerstorp (Småland), Brafab, &Tradition | Hög (Trademax, Bygghemma, Stalands) | Medel | Hög | Medel | **4/10** |
| **LED-belysning för kontor** | Zalvo, ArmaturExpo, Ledgrossisten, H Nordic | Hög | Medel | Hög | Medel | **4/10** |
| **Verktyg (Bahco, Makita)** | Stora återförsäljare avtal | **Mycket hög** | Låg | **Mycket hög** | Låg (skyddade kanaler) | **2/10** |
| **Ljudabsorbenter för restauranger** | Samma tillverkare som ovan | **Mycket låg** (B2B-nisch) | Hög | **Låg** | Hög | **8/10** |
| **Reception & väntrum** | Edsbyn, Kinnarps, mindre tillverkare | Låg-medel | Hög | **Låg** | Medel | **7/10** |

### Topp-3 alternativ förklarade

#### A) Akustikpaneler & ljudabsorbenter
- **Varför nu:** Hemmakontor-trenden permanent, "tysta zoner" i nya kontor, restauranger fixar buller
- **Tillverkare i Sverige:** Lundbergs Trä (Småland), Träullit (Ydre), Decibel Akustik
- **Konkurrenter med Shopping:** Bauhaus, Byggmax kör generellt, men inte djup nisch
- **Marginal:** 40–60% på premium-paneler (designer-trä, mossvägg, filt)
- **Snitt-order:** 2 000–8 000 kr (bra för Shopping-CPA)
- **Risk:** Logistik (stora skrymmande paket) — men det är tillverkarens problem i dropship

#### B) Industri-/lagermöbler för SMB (småföretag)
- **Varför:** Gerdmans/Witre/AJ siktar på stora B2B, små företag (1–20 anställda) får dåligt bemötande
- **Nisch:** Verkstadsbänkar, ESD-stolar, lagerhyllor för småföretag/garage-pro
- **Tillverkare:** Cowab, EAB, lokala leverantörer på Grossist.se
- **Marginal:** 30–45%
- **Snitt-order:** 3 000–15 000 kr
- **Risk:** Lågt sökvolymsegment kräver content-SEO + Shopping

#### C) Begagnade kontorsmöbler (Rekomo-modellen)
- **Varför:** Hållbarhets-trend + företag som flyttar/rensar = gratis lager
- **Tillverkare:** Inga — vi köper begagnat från flyttar och säljer vidare
- **Marginal:** 60–80% (köp för småpeng, sälj till halv nypris)
- **Konkurrens:** Rekomo i princip ensam på proffsig nivå, Blocket Företag är amatörmässig
- **Risk:** Kräver inspektion + lokalt lager (ej dropship) → **DETTA BRYTER MOT KRAVET**
- **Workaround:** Köp från företag som har eget lager → vi marknadsför, de skickar
- **Komplement till SMK:** Kan vara underkategori på SMK ("Begagnat-fynd")

---

## 3. Strategiska iakttagelser

### Vad svenska e-handelsdata säger (2026 Q1)
- Svensk e-handel växer 7% Q1 2026, alla 8 PostNord-branscher positiva
- Stark krona = bättre marginal på import (men vi importerar inte i dropship-fall)
- **Egna varumärken pekas ut som vinnarstrategin** → "SMK Premium" på lång sikt
- 75% av Prisjakt-produkter saknar fullständiga specifikationer → SEO-möjlighet med bättre produktdata

### Modellen "tillverkar-partner" (smartast för oss)
Istället för internationell dropship-portal: identifiera **5–10 svenska små/mellanstora tillverkare** som
- har egen produktion + lager
- har dålig egen e-handel (eller ingen alls)
- kan erbjuda 25–35% rabatt vid återförsäljning
- skickar direkt till slutkund (white-label etikett)

**Vi blir deras e-handelsavdelning.** Detta är exakt vad SMK gör mot t.ex. Kinnarps/EFG på begagnatsidan.

### Vad detta betyder operativt
| Steg | Tid | Verktyg |
|------|-----|---------|
| Förhandla med 1 tillverkare | 1 vecka | E-post + 1 möte |
| Bygga e-handel (Shopify/Woo) | 2–4 timmar | Befintlig stack |
| Produktfeed + Shopping | 1 dag | Merchant Center |
| Första kampanj live | 1 vecka | Google Ads |
| Break-even | 30–60 dagar | Beror på CPA/ROAS |

---

## 4. Rangordnad action-lista

### Vecka 1 (denna vecka)
1. **SMK Shopping-test** — fixa feed, kör 200 kr/dag i 5 dagar
2. **Kontakta 3 akustikpanel-tillverkare** (Lundbergs, Träullit, Decibel) för dropship-avtal
3. **Audit konkurrentdata** — kör Prisjakt-skrap på de 50 mest sökta SEO-termerna i kontorsmöbler

### Vecka 2–3
4. Bygg pilot-butik för akustikpaneler (om tillverkaravtal landar) — Shopify, 4 timmars uppsättning
5. Migrera SMK till WooCommerce (om Abicart-buggen kvarstår)
6. Sätta Performance Max på SMK med riktiga produktdata

### Månad 2
7. Lansera Rekomo-konkurrent som **kategori under SMK** (samma sajt, befintlig auktoritet)
8. Utvärdera om akustik-piloten skalar → 2 nya tillverkare

---

## 5. Vad jag ÄR osäker på (verifiera innan beslut)

- **SMK:s exakta marginal idag** — om de redan har låg marginal pga "halv pris" är Shopping-CPA känsligt
- **Tillverkares dropship-villkor** — ingen svensk tillverkare har en öppen "dropship-portal" som BigBuy, vi behöver förhandla 1-mot-1
- **Konkurrenters faktiska Shopping-aktivitet** — jag har antagit att SMK inte kör Shopping, men en grundlig Merchant Center-konkurrentanalys behövs (kan göras via Auction Insights när Shopping är igång)
- **CPA-benchmark för kontorsmöbler i SE** — jag har inga riktiga siffror, behöver första veckans data

---

## 6. Slutsats — Mitt mest direkta svar

**Lättast** = Slå på Shopping på SMK. Sajten finns, lagret finns, prisförsprånget finns. Detta är inte en ny e-handel — det är ett kanaltest. Kostar oss 1 dag arbete + 1–2k i annonsbudget.

**Näst lättast (om vi vill bygga nytt)** = Akustikpaneler. Svenska tillverkare i Småland (lokalt nätverk via SMK-relation), hög marginal, designat segment, växande, **ingen som dominerar Shopping**.

**Undvik:** Skrivbord, kontorsstolar, generella verktyg, generella möbler — där är Shopping ett blodbad med 0,5–1,5 ROAS för nya aktörer.

---

## Källor

- [Dropshipping leverantörer för Sverige och EU — Nordboost](https://nordboost.se/starta-e-handel/dropshipping-leverantorer-och-grossister/)
- [Dropshipping av möbler 2026 — Shopify](https://www.shopify.com/se/blog/dropshipping-av-mobler)
- [E-handelsindikatorn januari 2026 — Svensk Handel](https://www.svenskhandel.se/rapporter/e-handelsindikatorn/e-handelsindikatorn-januari-2026/)
- [Svensk e-handel 2026 trender — Viskan](https://www.viskan.com/sv-se/kunskap/svensk-e-handel-2026-5-viktiga-trender-att-halla-koll-pa/)
- [E-handel stark start 2026 — Tradevenue](https://tradevenue.se/artiklar/e-handel-stark-start-pa-2026-trots-fortsatt-avvaktande-konsument-100019)
- [Produkter med hög efterfrågan och låg konkurrens 2026 — Shopify](https://www.shopify.com/se/blog/produkter-med-hog-efterfragan-och-lag-konkurrens)
- [AJ Produkter förvärvar DPJ Workspace — Mainsights](https://www.mainsights.io/ma-news/swedish-family-owned-furnishing-company-aj-produkter-acquires-swedish-competitor-dpj-workspace)
- [B2B e-handel för tillverkare 2026 — Shopify](https://www.shopify.com/se/blog/b2b-e-handel-for-tillverkare)
- [B2B e-handel trender 2026 — Gung](https://gung.se/artiklar/trender-inom-b2b-e-handel-2026)
- [Lundbergs akustikpaneler](https://www.lundbergs.com/interior/akustikpanel/)
- [Träullit Akustik](https://traullit.se/produkt/akustik/)
- [Rekomo begagnade kontorsmöbler](https://www.rekomo.se/brands/kinnarps/)
- [Hillerstorp utemöbler](https://www.bramobler.se/hillerstorp)
- [Smålands Kontorsmöbler](https://smalandskontorsmobler.se/)
