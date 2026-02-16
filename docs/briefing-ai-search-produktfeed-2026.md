# Briefing: AI Search (GEO), Nordic Snus Online & Produktfeed-optimering

> Sammanställd 2026-02-13 | Searchboost Opti
> Syfte: Ge Mikael underlag inför kundmöten och tjänsteutveckling.

---

## INNEHALL

1. [DEL 1 — AI Search / GEO (Generative Engine Optimization)](#del-1)
2. [DEL 2 — Nordic Snus Online: AI Search-möjlighet](#del-2)
3. [DEL 3 — Produktfeed-optimering (Google Ads + Meta Ads)](#del-3)

---

<a id="del-1"></a>
# DEL 1 — AI Search / GEO (Generative Engine Optimization)

## 1.1 Vad ar GEO?

**GEO (Generative Engine Optimization)** ar optimering av innehall sa att det citeras och rankas i AI-drivna svarsmotorer — inte bara i traditionella Google-sokresultat.

### Traditionell SEO vs. GEO

| Aspekt | Traditionell SEO | GEO |
|--------|-----------------|-----|
| **Mal** | Ranka pa sida 1 i Google SERP | Bli citerad i AI-genererade svar |
| **Sokmotor** | Google, Bing (lankar) | ChatGPT Search, Perplexity, Google AI Overviews, Bing Copilot |
| **Resultatformat** | 10 bla lankar | Ett sammanfattande svar med kallhanvisningar |
| **Ranking-signal** | Backlinks, PageRank, on-page SEO | Auktoritet, faktakvalitet, citering, strukturerad data |
| **Traffikmodell** | Anvandaren klickar till din sajt | Anvandaren far svaret direkt — kanske klickar pa din kalla |
| **Matning** | CTR, position, impressions | "Namndes du i svaret?", kalltrafik fran AI-motorer |

### Enkel forklaring for kunder:
> "Nar nagon fragar ChatGPT 'vilken kontorsstol ar bast for ryggproblem?' sa laser AI:n alla sajter och valjer de basta svaren att citera. GEO handlar om att SE TILL att det ar DIN sajt som AI:n valjer."

---

## 1.2 Hur hittar AI-sokmotorer innehall?

### ChatGPT Search (OpenAI)
- Anvander Bing-index som bas
- Crawlar webben i realtid vid sokning (via OAI-SearchBot user-agent)
- Prioriterar: auktoritativa kallor, faktarikhet, strukturerad information
- Visar inlineciteringar med lankar tillbaka till kallan
- **Crawlernamn**: `OAI-SearchBot`, `ChatGPT-User`

### Perplexity AI
- Crawlar webben aggressivt med egen bot (`PerplexityBot`)
- Visar ALLTID kallhanvisningar (numrerade)
- Foredrar: detaljerade artiklar, fakta med siffror, akademisk ton
- **Extremt bra for nischinnehall** — plockar ofta upp svenska sajter
- Vaxer snabbast av alla AI-sokmotorer

### Google AI Overviews (f.d. SGE)
- Rullas ut globalt 2024-2025, nu pa de flesta engelska sokningar, under utrullning pa svenska
- Visar ett AI-genererat sammanfattande svar OVANFOR de organiska resultaten
- Hamtar information fran sajter som redan rankar bra organiskt
- **Viktigaste signalen: traditionell SEO-ranking + E-E-A-T**
- Kan kannibalisera organisk trafik med upp till 20-60% pa informationssokningar

### Bing Copilot (Microsoft)
- Integrerat i Bing-sokning och Edge-browser
- Anvander Bing-index + GPT-4
- Visar svar med inlineciteringar
- **Crawlernamn**: `bingbot` (samma som vanliga Bing)

### Gemensamma ranking-faktorer for AI-svar:
1. **E-E-A-T** (Experience, Expertise, Authoritativeness, Trustworthiness) — annu viktigare an i vanlig SEO
2. **Faktarikhet** — statistik, siffror, studier far hogre sannolikhet att citeras
3. **Tydlig struktur** — H2/H3-rubriker, listor, tabeller lastt av AI-crawlers
4. **Aktuellt innehall** — nyare innehall foredras framfor aldret
5. **Unikt perspektiv** — original research, forstahandsinformation
6. **Schema markup** — hjalper AI forsta kontexten (FAQ, HowTo, Product, etc.)

---

## 1.3 Vad ar llm.txt?

### Bakgrund
`llm.txt` ar ett initiativ (foreslaget av Jeremy Howard / Answer.AI i slutet av 2024) for att skapa en standardiserad fil — liknande `robots.txt` — som hjalper LLM:er att forsta en sajts innehall.

### Hur det fungerar

Filen placeras pa `https://dindomän.se/llm.txt` och innehaller:
- En kort beskrivning av sajten/foretaget
- Struktur och navigation
- Viktig information som AI:n bor kanna till
- Lankar till de viktigaste sidorna

### Format-exempel

```
# Företagsnamn

> Kort beskrivning av företaget och vad sajten erbjuder.

## Huvudsidor

- [Startsida](https://example.se/): Översikt av våra tjänster
- [Produkter](https://example.se/produkter): Komplett produktkatalog
- [Om oss](https://example.se/om-oss): Företagshistoria och team

## Nyckelinformation

- Grundat: 2015
- Bransch: Kontorsmöbler
- Målgrupp: Företag i Sverige
- Antal produkter: 500+

## FAQ

- Vi levererar i hela Sverige med fri frakt över 2000 kr
- Alla stolar har 5 års garanti
```

### llm.txt vs robots.txt

| Fil | Syfte | Malgrupp |
|-----|-------|----------|
| `robots.txt` | Saga vad sokmotorer FÅR crawla | Traditionella crawlers (Googlebot) |
| `llm.txt` | Saga vad AI:n BOR veta om din sajt | LLM-crawlers (ChatGPT, Perplexity) |
| `sitemap.xml` | Lista alla URL:er | Alla crawlers |
| `llm.txt` | Sammanfattning + kontext | LLM-crawlers |

### Adoption och status
- **Inte en officiell standard annu** — men adoptionen vaxer snabbt
- Stora sajter som borjar anvanda det: Cloudflare, Anthropic, flera tech-foretag
- Perplexity och ChatGPT Search har bekraftat att de laser filen nar den finns
- **Kravs inte** for att bli citerad — men ger en fordel
- WordPress-plugin finns: "LLM.txt Generator" (gratis)

---

## 1.4 Best practices for att bli citerad i AI-svar

### Innehallsstrategi

1. **Skriv "citatvanligt" innehall**
   - Korta, precisa meningar med fakta
   - Exempel: "En ergonomisk kontorsstol bor ha lumbalstod, justerbara armstod och en sitthojd pa 42-52 cm" — detta ar exakt den typen av mening AI:n plockar upp

2. **Svara pa fragor direkt**
   - Anvand fraga-svar-format (FAQ-sektioner)
   - Borja stycken med svaret, inte bakgrunden
   - "Inverted pyramid" — viktigaste forst

3. **Inkludera statistik och siffror**
   - Studier visar att innehall med kvantifierbara fakta citeras 40% oftare i AI-svar
   - Ange kallor for statistik — AI:n foredrar verifierbara pastaenden

4. **Strukturera for maskinlasbarhet**
   - H2/H3-rubriker som ar fragor eller tydliga amnen
   - Punktlistor och tabeller
   - Schema.org markup (FAQ, HowTo, Product, Article)
   - Definition-listor ("Vad ar X? X ar...")

5. **Bygg topisk auktoritet**
   - Skriv djupgaende om ETT amne snarare an ytligt om manga
   - Interna lankar mellan relaterade artiklar
   - "Pillar + cluster" modellen ar annu viktigare for GEO

### Teknisk optimering

6. **Implementera llm.txt**
   - Skapa och underhall `/llm.txt` pa sajten
   - Uppdatera vid nya produkter/sidor

7. **Schema markup (JSON-LD)**
   - `FAQPage` — for fragor och svar
   - `HowTo` — for guider och instruktioner
   - `Product` — for produktsidor
   - `Article` + `author` — for blogginlagg
   - `Organization` — for foretaget
   - `LocalBusiness` — for lokala foretag

8. **Tillat AI-crawlers**
   - Kontrollera `robots.txt` — blockera INTE `OAI-SearchBot`, `PerplexityBot`, `ClaudeBot`, `Applebot-Extended`
   - Manga sajter blockerar oavsiktligt AI-crawlers
   - Optimal robots.txt-tillagg:
   ```
   User-agent: OAI-SearchBot
   Allow: /

   User-agent: PerplexityBot
   Allow: /

   User-agent: ChatGPT-User
   Allow: /
   ```

9. **Hog sidhastighetoch tillganglighet**
   - AI-crawlers har ofta kort timeout — snabb sida = battre crawlning
   - Tillgangligt innehall (inte bakom login/paywall) ar lattare att indexera

### Matning och uppfoljning

10. **Hur mater man GEO-resultat?**
    - **Manuellt**: Sok pa relevanta fragor i ChatGPT, Perplexity, Google — syns du?
    - **Verktyg**: Perplexity har inbyggd citering — kontrollera regelbundet
    - **Google Search Console**: Filtrera pa referrer-trafik fran AI-motorer
    - **Server-loggar**: Sok efter AI-crawlers (OAI-SearchBot, PerplexityBot) i access logs
    - **Verktyg som vaxer**: Profound (GEO-tracking), Otterly.ai, Goodie AI

---

## 1.5 Statistik om AI-sokning

### Tillvaxt (baserat pa data fram till tidigt 2025)
- **ChatGPT**: Over 200 miljoner aktiva anvandare per vecka (jan 2025)
- **Perplexity**: Ca 100 miljoner sokningar per manad (Q4 2024), tillvaxt ~30% per kvartal
- **Google AI Overviews**: Rullas ut pa ~85% av engelska sokningar i USA, under utrullning globalt
- **Bing Copilot**: Integrerat i alla Edge-browsers, ~140 miljoner dagliga anvandare

### Forandringar i sokbeteende
- **Zero-click-sokningar**: Uppskattningsvis 60-65% av alla Google-sokningar leder aldrig till ett klick pa en extern sajt (Sparktoro/Datos-studie). AI Overviews forvantas oka detta ytterligare
- **Yngre malgrupper**: 18-34-aringar anvander i allt hogre grad ChatGPT/Perplexity som forsta sokkanal, fore Google
- **Konverteringskvalitet**: Trafik fran AI-sokmotorer har ofta hogre konverteringsgrad — anvandaren ar langre i kopprocessen nar de soker via AI
- **B2B**: AI-sokningar anvands allt mer for research och inkop i foretag

### Prognos
- **Gartner (2025-prognos)**: Traditionella sokningar kan minska med 25% till 2026 pa grund av AI-chatbots
- AI-sokmarknaden forvantas ta 10-15% av total sokvolym inom 2-3 ar
- Google forsvarar sig med AI Overviews — men detta kanon paradoxalt minska klick till organiska resultat

---

## 1.6 Hur Searchboost kan erbjuda GEO som tjanst

### Tjänstepaket: "AI Search Optimization"

**Basic (ingår i Standard SEO-paket)**
- Kontroll och optimering av robots.txt for AI-crawlers
- Implementera llm.txt pa kundens sajt
- Grundlaggande Schema markup (Organization, LocalBusiness, FAQ)
- Manatlig kontroll: "Syns kunden i Perplexity/ChatGPT?"

**Standard (tillval, +2 000-3 000 kr/man)**
- Allt i Basic
- Malstyrd innehallsproduktion (2-4 artiklar/man optimerade for AI-citering)
- FAQ-sektioner pa alla viktiga sidor
- Avancerad Schema markup (Product, HowTo, Article)
- Manatlig rapport med GEO-matning (synlighet i AI-motorer)

**Premium (tillval, +5 000-8 000 kr/man)**
- Allt i Standard
- Topical authority-strategi (pillar pages + kluster)
- Original research / data-driven content (statistik, undersokningar)
- Proaktiv optimering mot specifika AI-fragor
- Konkurrentbevakning i AI-sokmotorer
- Kvartalsvis strategimoter om AI-soktrenden

### Saljargument
1. **"Forsta-mover advantage"** — nastan ingen svensk byra erbjuder detta annu
2. **Framtidsskydd** — kunder som inte syns i AI-svar tappar successivt trafik
3. **Hogre ROI** — trafik fran AI-sokmotorer konverterar battre
4. **Konkret och matbart** — "Vi gor sa att ChatGPT rekommenderar DIG"
5. **Tillagger, inte ersatter** — bygger PA befintlig SEO, inte istallet for

---

<a id="del-2"></a>
# DEL 2 — Nordic Snus Online: AI Search-mojlighet

## 2.1 Bakgrund

**Nordic Snus Online** saljer snus online (nordicsnus.online / nordicsnusonline.se). Mote imorgon (14 feb) kl 12:00. Behover talking points for hur AI Search kan bli en stark kanal.

---

## 2.2 Varfor AI Search ar speciellt intressant for snus

### Snusbranschen har unika utmaningar:
1. **Annonsrestriktioner**: Snus far INTE annonseras via Google Ads, Meta Ads eller de flesta traditionella annonsplattformar i Sverige (Tobakslagen + plattformsregler)
2. **Begransad SEO-konkurrens**: Eftersom stora aktorer inte kan kopa annonser, ar organisk sokning och content den primara traffikkanalenn
3. **Informationssokningar ar vanliga**: Folk soker "basta snus 2026", "nikotinfritt snus jamforelse", "vilken nikotinstyrka ska jag valja" etc.
4. **AI-sokning = perfekt matchning**: Nar Google-annonser inte ar ett alternativ, blir AI-svar den NYA "toppositionen"

### Mojligheten:
> "Om Nordic Snus Online ar den sajt som ChatGPT och Perplexity citerar nar nagon fragar 'vilken snus ar bast for nybörjare?' — da far ni trafiken som era konkurrenter INTE kan kopa sig till."

---

## 2.3 Talking points for motet

### 1. "AI Search ar den nya startpunkten for konsumenter"
- Allt fler, speciellt 18-35 (snusets huvudmalgrupp), borjar sina sokningar i ChatGPT/Perplexity
- For produkter med annonsrestriktioner ar detta annu viktigare — det finns inget annat satt att vara "forst"
- Visa live: Sok "best snus brands in Sweden" i Perplexity — vem citeras idag?

### 2. "Ni har en unik fordel — om ni agerar nu"
- Snusbranschen ar digital men inte speciellt sofistikerad med content
- Forsta-mover advantage: den som bygger bast innehall NU blir kalla for AI-svaren i manader/ar framat
- AI-motorer tenderar att "lasa in sig" pa kallor — nar du en gang etablerats som auktoritet ar det svarare for konkurrenter att ta over

### 3. "Traditionell SEO + GEO = dubbel effekt"
- Vi bygger inte tva separata strategier — GEO ar ett lager OVANPA SEO
- Innehall som rankar i Google har hog sannolikhet att aven citeras i AI-svar
- Men det kravs specifika justeringar: FAQ-format, citatvanliga meningar, Schema markup

### 4. "Vi kan mata det"
- Visa trafik fran AI-referrers i Google Analytics / server-loggar
- Manuell monitorering: "Rekommenderar ChatGPT er?" (veckovis kontroll)
- Content performance: vilka artiklar genererar trafik fran AI-motorer?

### 5. Specifik strategi for Nordic Snus Online

**Fas 1 — Grundarbete (manad 1-2)**
- SEO-audit och teknisk optimering av sajten
- Implementera llm.txt och optimera robots.txt
- Schema markup: Product, FAQ, Organization, Review
- Identifiera top 50 fragor som snuskopare staller

**Fas 2 — Innehallsproduktion (manad 2-4)**
- 10-20 djupdyknande artiklar:
  - "Guide: Hitta ratt snus for dig" (stilguide med rekommendationer)
  - "Nikotinfritt snus — komplett jamforelse 2026"
  - "Skillnaden mellan lossnus och portionssnus"
  - "Basta vitt snus (nicotine pouches) — test och recension"
  - "Snus for nyborjare — allt du behover veta"
  - Produktjamforelser (t.ex. "VELO vs ZYN vs LOOP")
  - Trender och nyheter i snusvarlden
- Varje artikel optimerad for bade Google OCH AI-citering

**Fas 3 — Dominans (manad 4-6)**
- Topical authority: Nordic Snus Online ska vara KALLAN for snusinformation
- Uppdatera innehall kvartalsvis (AI foredrar aktuellt)
- Bygga lankar och omnamnanden (PR, gaestinlagg, branschsamarbeten)
- Utoka till internationellt innehall (engelska) for globalexport-kunder

---

## 2.4 Regulatoriska aspekter for snusmarknadsforing i Sverige

### Tobakslagen (2018:2088) + Lag om tobaksfria nikotinprodukter
- **Forbud mot reklam** for tobaksprodukter riktad till konsumenter (med undantag)
- **Tillaten**: Information pa egen webbplats om produkterna, priser, sortiment
- **Tillaten**: Redaktionellt/informativt innehall (guider, jamforelser) sa lange det inte ar "marknadsforing"
- **Forbjudet**: Annonsering pa sociala medier, Google Ads, sponsring, influencer-marknadsforning
- **Nikotinpaser (tobacco-free)**: Regleras av Lag om tobaksfria nikotinprodukter — nagot mildare regler men fortfarande annonsforbud pa de flesta plattformar

### Vad detta innebar for AI Search-strategin:
- Informativt innehall (guider, jamforelser, fakta) ar **fullt tillatet**
- Fokus pa **utbildning och information**, inte uppmaningar att kopa
- AI-citering ar inte "annonsering" — det ar organisk synlighet baserad pa kvalitativt innehall
- **Graat omrade**: Om Perplexity citerar en produktsida med "kop har"-lank — ar det reklam? Troligtvis inte, da sajten inte kontrollerar AI:ns output. Men var forsiktig med formuleringen pa sajten

### Rekommendation:
- Hall innehallet informativt och faktabaserat — det ar anda det som citeras bast
- Undvik uppmaningar som "kop nu!" i artiklar — anvand neutralt sprak
- Lat produktsidor vara raka och informativa (pris, styrka, smak, format)
- Juridisk grazon — rekommendera att Nordic Snus radgor med jurist vid tveksamheter

---

## 2.5 Forslag pa tjanstepaket for Nordic Snus Online

### "AI Search Dominance" — 8 000-12 000 kr/man (6 man avtal)

**Inkluderat:**
- Komplett SEO-audit + teknisk optimering
- llm.txt-implementering + robots.txt-optimering
- Schema markup (Product, FAQ, Organization, Review)
- 4-6 djupdykande artiklar per manad (AI-optimerade)
- FAQ-sektioner pa alla produktkategorisidor
- Manatlig GEO-rapport (synlighet i ChatGPT, Perplexity, Google AI Overviews)
- Kvartalsvis strategimote
- Lopande optimering av befintligt innehall

**Totalt over 6 manader: 48 000-72 000 kr**

**ROI-argument:**
- Om 10% av deras organiska trafik (anta 5 000 besok/man) ersatts av AI-trafik med hogre konvertering
- Anta snittordervarde 300 kr, konverteringsgrad 3% fran AI-trafik vs 1.5% fran Google
- Det ar skillnaden mellan 22 500 kr och 45 000 kr i intakter per manad fran samma volym
- Paket betalar sig sjalv efter 2-3 manader

---

<a id="del-3"></a>
# DEL 3 — Produktfeed-optimering (Google Ads + Meta Ads)

## 3.1 Vad ar en WooCommerce-produktfeed?

En **produktfeed** (produktflode) ar en strukturerad datafil (XML, CSV eller JSON) som innehaller all information om en webbutiks produkter. Filen skickas till annonsplattformar sa att de automatiskt kan skapa annonser baserat pa produktdatan.

### Var anvands produktfeeds?
- **Google Shopping / Performance Max** — produktannonser i Google-sokning och Shopping-fliken
- **Meta (Facebook/Instagram) Catalog** — dynamiska produktannonser pa Facebook och Instagram
- **Pricerunner, Prisjakt** — prisjamforelsesajter
- **Microsoft Shopping (Bing)** — produktannonser i Bing
- **Pinterest Shopping** — produktpinnar
- **TikTok Shop** — produktkatalog for TikTok-annonser

### Dataflode:
```
WooCommerce-butik → Plugin genererar XML/CSV-feed → Google Merchant Center / Meta Catalog
                                                     ↓
                                              Annonsplattform skapar annonser automatiskt
```

---

## 3.2 Basta plugins for WooCommerce-produktfeed

### Toppval (rekommenderade)

| Plugin | Pris | Styrkor | Bast for |
|--------|------|---------|----------|
| **CTX Feed (WebAppick)** | Gratis + Pro fran $119/ar | 130+ templates, inkl. Google, Meta, Prisjakt. Stodjer custom attributes, filter, category mapping | Basta allround-valet |
| **Product Feed PRO for WooCommerce (AdTribes)** | Gratis + Elite fran $89/ar | Extremt populart (200k+ installationer), bra UI, stodjer alla plattformar | Popularast — stabil och pålitlig |
| **Google Listings & Ads (WooCommerce officiellt)** | Gratis | Officiell Google-integration, synkar direkt med Merchant Center, Free listings | Enkel Google-only setup |
| **YITH Google Product Feed** | $79/ar | Bra om kunden redan anvander YITH-plugins | YITH-ekosystemet |
| **Channable** | Fran $59/man | Kraftfullast for stora kataloger, regler-motor, multi-channel | Stora butiker (500+ produkter) |

### Rekommendation for Searchboost-kunder:
- **Smarre butiker (< 200 produkter)**: Product Feed PRO (gratis version) + Google Listings & Ads
- **Medelstora (200-1000 produkter)**: CTX Feed Pro ($119/ar)
- **Stora (1000+ produkter)**: Channable ($59+/man) eller CTX Feed Pro

---

## 3.3 Google Shopping / Performance Max — feedoptimering

### Vad ar Performance Max?
Performance Max (PMax) ar Googles AI-drivna kampanjtyp som visar annonser over ALLA Googles ytor: Sok, Shopping, YouTube, Display, Gmail, Maps, Discover. Feedkvalitet ar AVGORANDE for resultat.

### Nyckelfalt i en Google Shopping-feed

| Falt | Krav | Optimeringstips |
|------|------|-----------------|
| **title** | Obligatoriskt, max 150 tecken | Inkludera varumarke + produkttyp + nyckelattribut. Ex: "Ergonova Pro Kontorsstol - Svart Mesh med Lumbalstod" |
| **description** | Obligatoriskt, max 5000 tecken | Naturligt sprak med sokord, inte keyword-stuffing. Beskriv USP:ar |
| **image_link** | Obligatoriskt | Vit bakgrund, minst 800x800px, ingen text/vattenstampel pa bilden |
| **price** | Obligatoriskt | Maste matcha pris pa sajten exakt (inklusive valuta) |
| **availability** | Obligatoriskt | in_stock / out_of_stock — maste vara korrekt |
| **brand** | Rekommenderat | Exakt varumarke — Google matchar mot sokningar |
| **gtin** (EAN) | Starkt rekommenderat | 13-siffrig EAN-kod. ENORMT viktigt for matchning — prioritera att lagga till |
| **mpn** | Rekommenderat (om GTIN saknas) | Tillverkarens artikelnummer |
| **product_type** | Rekommenderat | Din egen kategori-taxonomi (ex: "Mobler > Stolar > Kontorsstolar") |
| **google_product_category** | Rekommenderat | Googles taxonomi-ID (ex: 2860 = Office Chairs) |
| **condition** | Rekommenderat | new / refurbished / used |
| **shipping** | Rekommenderat | Ange fraktkostnad for att visa i annonser |
| **custom_label_0-4** | Valfritt | Enormt viktigt for PMax — anvand for segmentering (marginal, sasongsprodukt, bestseller etc.) |

### Top 10 optimeringsstips for basta resultat

1. **Titlar ar ALLT** — Lagg varumarke forst, sedan produkttyp, sedan nyckelattribut (farg, storlek, material). Undvik generiska titlar som "Fin stol"
2. **GTIN/EAN pa ALLA produkter** — Google kan inte matcha din produkt korrekt utan GTIN. Resulterar i lagre synlighet och hogre CPC
3. **Hogkvalitativa bilder** — Forsta bilden bor vara produktfoto pa vit bakgrund. Lagg till livsstilsbilder som "additional_image_link"
4. **Custom labels for PMax-segmentering** — Tagga produkter med marginalgrupp (hog/medel/lag), prisintervall, eller sasong. Da kan PMax optimera budgeten smartare
5. **Daglig feeduppdatering** — Pris- och lagerstatus MASTE vara aktuella, annars kan kontot bli suspendat
6. **Uteslut olonsamma produkter** — Filtrera bort produkter med for lag marginal eller som aldrig konverterar
7. **Sale price** — Anvand `sale_price` + `sale_price_effective_date` for reor — visar "REA"-badge i Shopping
8. **Shipping-information** — Ange exakt fraktkostnad — "Fri frakt" kan visa i annonsen och oka CTR
9. **Product type** — Anvand din EGEN kategorihierarki (ej bara Googles) for battre PMax-gruppering
10. **Regelbunden feedhalsokontroll** — Kontrollera "Diagnostik"-fliken i Google Merchant Center veckovis for varningar

### Google Merchant Center-setup (steg for steg)
1. Skapa konto pa merchants.google.com
2. Verifiera och gor ansprak pa domanen (HTML-tagg eller DNS)
3. Lagg till produktfeed (URL till XML-filen som pluginet genererar)
4. Schema automatisk hamtning (dagligen)
5. Fixa eventuella avvisade produkter (90% av fallen: saknad GTIN eller bildproblem)
6. Lanka till Google Ads-konto
7. Skapa Performance Max-kampanj

---

## 3.4 Meta (Facebook/Instagram) Catalog — WooCommerce-integration

### Hur det fungerar
Meta Catalog (tidigare Facebook Product Catalog) anvands for:
- **Dynamiska produktannonser** (DPA) — visar produkter for folk som besokt butiken
- **Instagram Shopping** — tagga produkter i inlagg och Stories
- **Facebook Shops** — komplett butiksfronk pa Facebook
- **Advantage+ Shopping Campaigns** — Metas version av PMax

### Integrationssatt

| Metod | Forklaring | Bast for |
|--------|-----------|----------|
| **Meta Pixel + Catalog** | Pixel trackar besokare, Catalog matchar produkter for retargeting | Alla — obligatoriskt |
| **Facebook for WooCommerce (officiellt plugin)** | Automatisk synk av produkter till Meta Catalog | Enklast for sma butiker |
| **Feed-plugin (CTX/AdTribes)** | Genererar CSV/XML-feed for manuell upload till Meta | Full kontroll over data |
| **Channable/DataFeedWatch** | Professionell feedhantering med regler och optimering | Stora kataloger |

### Viktiga Meta-specifika krav
- **Bilder**: Minst 500x500px, rekommenderat 1080x1080. INGEN text pa bilden (Metas 20%-textregel paverkar distribution)
- **Pris med valuta**: Format "499.00 SEK"
- **Tillganglighet**: Maste matcha sajten exakt
- **Content ID**: Maste vara samma som pixel-ID pa sajten (annars fungerar inte retargeting)
- **UTM-parametrar**: Lagg till for sporbarhet (`utm_source=facebook&utm_medium=paid`)

### Setup-steg
1. Installera Meta Pixel pa WooCommerce-sajten (via plugin eller GTM)
2. Skapa Catalog i Meta Business Manager (Commerce Manager)
3. Lanka WooCommerce-feed eller anvand officiellt plugin
4. Skapa Produktset (segmentering)
5. Skapa Advantage+ Catalog Ads-kampanj
6. Implementera Conversions API (CAPI) for serverside-tracking (viktigare an nagonsin efter iOS 14+)

---

## 3.5 Hur Searchboost kan erbjuda produktfeed-optimering

### Tjanstepaket: "Feed & Shopping Optimization"

**Setup-paket (engangskostnad)**

| Tjanst | Pris | Inkluderar |
|--------|------|-----------|
| Google Shopping Setup | 5 000-8 000 kr | Plugin-installation, feed-konfigurering, Merchant Center-setup, verifiering, 50 produkt-optimeringskontroller |
| Meta Catalog Setup | 4 000-6 000 kr | Pixel-installation, Catalog-setup, produktsynk, testning |
| Kombo (Google + Meta) | 8 000-12 000 kr | Bada ovan + Conversions API setup |

**Lopande optimering (manatlig)**

| Paket | Pris/man | Inkluderar |
|-------|----------|-----------|
| Basic | 2 000 kr | Feedunderhall, felkorrigering, manatlig rapport, uppdaterade titlar/beskrivningar |
| Standard | 4 000-6 000 kr | Basic + titeloptimering, custom labels, produktexkludering, PMax-radjgivning |
| Premium | 8 000-12 000 kr | Standard + fullstandig PMax-kampanjhantering, A/B-test av titlar, ROI-rapportering |

### Marginalanalys for Searchboost

- **Tidsatgang setup**: 4-8 timmar (beroende pa katalogstorlek)
- **Tidsatgang lopande**: 2-4 timmar/manad
- **Verktyg**: Gratis plugins i de flesta fall — ingen extra licensskostnad for Searchboost
- **Marginal**: Ca 70-80% pa setup, 60-70% lopande
- **Skalbarhet**: Nar processer ar satta kan junior-resurs hantera underhall

### Saljargument mot kunder

1. **"Produktfeed ar grunden for ALL produktannonsering"** — Utan optimerad feed slosas annonsbudgeten
2. **"80% av PMax-resultatet sitter i feeden"** — Google kan inte visa ratt annons till ratt person om produktdatan ar dalig
3. **"Konkurrenterna med battre feed far lagre CPC"** — Google belonar hogkvalitativ data med battre placeringar till lagre kostnad
4. **"Gar ni fran 2% till 3% konverteringsgrad ar det 50% mer intakter"** — Feedoptimering ar en av de enklaste spakarena for att forbattra konvertering
5. **"Vi gor det som din webbutik inte gor automatiskt"** — Alla WooCommerce-teman exporterar grunddata, men det kravs manuell optimering for att na topp-performance

### Cross-sell med befintliga tjanster
- **SEO + Feed**: Kunder med WooCommerce far bade organisk OCH betald synlighet
- **GEO + Feed**: Produkter som citeras i AI-svar OCH syns i Shopping = dubbel exponering
- **Audit + Feed**: Identifiera produkter som rankar organiskt men saknas i Shopping

---

## SAMMANFATTNING — Tre nya intaktsstrommar

| Tjanst | Malgrupp | Uppskattad MRR per kund | Marknadsstorlek |
|--------|----------|------------------------|-----------------|
| **AI Search / GEO** | Alla foretagskunder | 2 000-8 000 kr/man | Ny marknad — nastan ingen konkurrens |
| **Snus AI Search** | Nordic Snus Online (specifikt) | 8 000-12 000 kr/man | Nisch med hoga barriarer — perfekt |
| **Produktfeed-opt.** | WooCommerce-butiker | 2 000-12 000 kr/man | Stor marknad — manga sma butiker saknar optimering |

### Nasta steg for Mikael

1. **GEO**: Lagg till "AI Search Optimization" i Searchboosts tjanstelista. Borja med att erbjuda llm.txt + robots.txt-optimering till alla befintliga kunder (gratis/inkluderat) som en "foot in the door"

2. **Nordic Snus Online-motet**: Kor strategin ovan. Fokusera pa:
   - Live-demo: Sok i Perplexity/ChatGPT efter snusrelaterade fragor — visa att de INTE syns idag
   - Annonsrestriktions-argumentet (de KAN inte kopa sig forbi)
   - 6-manaders avtal, 8 000-12 000 kr/man

3. **Produktfeed**: Identifiera vilka befintliga kunder som har WooCommerce-butiker och erbjud feed-optimering som tillval. Borja med Smalands Kontorsmobler (efter WooCommerce-migrering)

---

> **OBS**: Statistik och marknadssiffror i detta dokument ar baserade pa data tillganglig till och med tidigt 2025. AI-sokmarknaden utvecklas snabbt — verifiera aktuella siffror infor kundpresentationer. Priser ar riktlinjer och bor anpassas till Searchboosts prissattningsmodell.
