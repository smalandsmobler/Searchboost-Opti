# SEO Gameplan — Smålands Kontorsmöbler
## www.smalandskontorsmobler.se

**Datum:** 2026-02-11
**Utarbetad av:** Searchboost.se
**Kontakt:** Mikael Larsson, mikael@searchboost.nu

---

## 1. Executive Summary

Smålands Kontorsmöbler har en webshop med ~500 produkter på Abicart-plattformen. Sajten syns på Google för 50 sökord men genererar nästan noll klick (7 klick/månad totalt). Domain Rating: 30. Sajten har potential men hålls tillbaka av tre grundproblem:

1. **Plattformsbegränsningar** — Abicart ger minimal SEO-kontroll (ingen Rank Math, begränsad schema, inga custom meta per sida)
2. **Noll innehåll** — Bara 1 bloggartikel. Inga kategoritexter. Inga guider.
3. **Svag backlinkprofil** — 78 referring domains, varav majoriteten är spam/lågkvalitet

**Rekommendation:** Migrera till WooCommerce (erbjuds gratis av Searchboost) för att få full SEO-kontroll, sedan bygga innehåll och länkar systematiskt.

---

## 2. Nulägesanalys

### 2.1 Trafik & Synlighet (GSC, senaste 30 dagarna)

| Metrik | Värde |
|--------|-------|
| Totala impressions | ~2,200 |
| Totala klick | **7** |
| Genomsnittlig CTR | **0.3%** |
| Sökord med impressions | 50 |
| Sökord i top 3 | 1 (smålandsmöbler, pos 2.3) |
| Sökord i top 10 | 7 |
| Sökord i top 30 | 32 |

**Diagnos:** Sajten syns men ingen klickar. Orsaker:
- Dåliga meta-titlar (generiska, ej optimerade)
- Inga meta-beskrivningar (Google genererar egna)
- Svag position på kommersiella sökord (kontorsmöbler pos 17, kontorsstolar pos 62)

### 2.2 Top-sökord — Nuvarande positioner

#### Nära toppen (Quick wins — pos 3-15)
| Sökord | Position | Impressions/mån | Klick |
|--------|----------|-----------------|-------|
| smålandsmöbler | 2.3 | 18 | 4 |
| pelarstativ bord | 3.9 | 19 | 1 |
| gåband skrivbord | 7.1 | 74 | 0 |
| gåband under skrivbord | 7.3 | 31 | 0 |
| kontorsstol utan armstöd | 8.1 | 38 | 1 |
| konferensbord med eluttag | 9.3 | 19 | 0 |
| gåband till skrivbord | 10.0 | 20 | 0 |
| bordsskiva 160x80 | 10.6 | 25 | 0 |
| fåtölj kontor | 13.0 | 41 | 0 |
| hurtsar | 14.2 | 99 | 1 |
| kontorsmöbler företag | 14.2 | 39 | 0 |
| kontor skrivbord | 14.3 | 53 | 0 |
| bordsskärm skrivbord | 15.0 | 41 | 0 |

#### Stora sökord (hög volym, svag position)
| Sökord | Position | Impressions/mån |
|--------|----------|-----------------|
| **kontorsmöbler** | 17.4 | 239 |
| **höj och sänkbart skrivbord** | 38.2 | 81 |
| **kontorsstolar** | 62.3 | 78 |
| **konferensbord** | 35.6 | 104 |
| **konferensstolar** | 64.0 | 43 |

### 2.3 Backlinkprofil (SE Ranking)

| Metrik | Värde |
|--------|-------|
| Domain Inlink Rank (DIR) | **30** |
| Totalt antal backlinks | 1,145 |
| Referring domains | 78 |
| Dofollow referring domains | 54 |
| Dofollow backlinks | 1,116 |
| Unika ankare | 43 |

**Ankardistribution:**
| Ankare | Backlinks | Ref.domains |
|--------|-----------|-------------|
| smalandskontorsmobler.se (naked URL) | 1,043 | 27 |
| Bountiful (?) | 16 | 16 |
| Smålands Kontorsmöbler (brand) | 10 | 7 |
| Pendelarmaturer | 8 | 5 |
| höj- och sänkbart skrivbord | 4 | 4 |
| kontorsmöbler | 4 | 4 |
| Konferensbord | 4 | 16 |

**Problem:**
- 91% av alla backlinks har naked URL som ankare — extremt onaturligt
- "Bountiful" (16 BL) — irrelevant ankartext, troligen spam
- Många links från .top, .icu, .xyz, .sbs-domäner = ren spam
- wikileaks.se med 8 dofollow-länkar = suspekt

**TLD-distribution:**
- .se: 44 domäner (56%) ✅
- .com: 9 domäner
- .top: 5 domäner ❌ (spam)
- Övrigt: .eu, .info, .no etc.

### 2.4 Sajtstruktur

```
Startsida (/)
├── Skrivbord (/skrivbord/) — 6 underkategorier
│   ├── Höj- och sänkbart skrivbord
│   ├── Konferensbord
│   ├── Hörnskrivbord
│   ├── Rakt skrivbord
│   ├── Bordsskivor
│   └── Tillbehör skrivbord
├── Sittmöbler (/stolar-fatoljer/) — 7 underkategorier
│   ├── Kontorsstolar
│   ├── Konferensstolar
│   ├── Fåtöljer
│   ├── Barstolar
│   ├── Soffor
│   ├── Tillbehör stolar
│   └── Bänkar
├── Förvaring (/forvaring/) — 8 underkategorier
├── Ljudabsorbenter (/ljudabsorbenter/) — 4 underkategorier
├── Utomhus möbler (/utomhus-mobler/)
├── Receptionsdiskar (/receptionsdiskar/)
├── Belysning (/belysning/)
├── Tillbehör (/tillbehor/)
├── Kundservice
├── Kontakt
└── Blog: 1 artikel (!) — "7 typer av kontorsmöbler..."
```

**~50 kategorisidor** | **~500 produktsidor** | **8 infosidor** | **1 bloggartikel**

### 2.5 Tekniska problem

| Problem | Allvar | Beskrivning |
|---------|--------|-------------|
| ❌ Plattform (Abicart) | KRITISKT | Ingen SEO-plugin, begränsad meta-kontroll, inga schema-markup-verktyg |
| ❌ Inga meta-descriptions | HÖGT | Google genererar egna snippets → låg CTR |
| ❌ Generiska titlar | HÖGT | Titlar typ "Kontorsstolar - Smålands Kontorsmöbler" utan mervärde |
| ❌ Ingen blogg/content | HÖGT | 1 artikel. Ingen topical authority. |
| ❌ Inga kategoritexter | MEDEL | Tomma kategorisidor = thin content |
| ❌ Produkt-data ej synlig | AKUT | "Error fetching data" — namn & priser visas ej (Abicart-bugg, supportärende inskickat) |
| ⚠️ Dubbletter i sitemap | LÅG | /url-sida, /hyllor-1 dubblerad |
| ⚠️ Redirect-script borttaget | INFO | ~60 redirects togs bort tillfälligt, bör återställas vid plattformsbyte |

---

## 3. Konkurrentanalys

### 3.1 Direkt konkurrens (kontorsmöbler online, Sverige)

| Domän | DIR | Backlinks | Ref.domains | Segment |
|-------|-----|-----------|-------------|---------|
| **smalandskontorsmobler.se** | **30** | **1,145** | **78** | **Småföretag** |
| kontorsmobler.se | 35 | 592 | 66 | Nisch-ehandel |
| ergoff.se | 45 | 2,739 | 252 | Ergonomi-fokus |
| witre.se | 44 | 38,705 | 569 | Kontorsinredning |
| ajprodukter.se | 64 | 17,409 | 761 | Stor B2B |
| kinnarps.se | 64 | 84,251 | 532 | Enterprise |
| staples.se | 48 | 8,806 | 625 | Storföretag |
| officedepot.se | 70 | 9,968 | 1,263 | Storföretag |

### 3.2 Realistiska mål

SMK kan INTE konkurrera med IKEA (DIR 75), Kinnarps (DIR 64) eller AJ Produkter (DIR 64) på bred front.

**Strategi: Dominera nischen.** Sikta på:
- kontorsmobler.se-nivå (DIR 35) inom 3 månader
- ergoff.se-nivå (DIR 45) inom 6 månader
- witre.se-nivå (DIR 44) inom 12 månader

### 3.3 Nisch-möjligheter

Dessa sökord har SÅ låg konkurrens att SMK redan syns — men behöver bättre positioner:

| Sökord | Nuvarande pos | Mål-pos | Typ |
|--------|---------------|---------|-----|
| gåband skrivbord | 7.1 | top 3 | Unik produkt |
| pelarstativ bord | 3.9 | top 1 | Nisch |
| konferensbord med eluttag | 9.3 | top 3 | Specifik B2B |
| kontorsstol utan armstöd | 8.1 | top 3 | Specifik |
| bordsskiva 160x80 | 10.6 | top 5 | Specifik storlek |
| jalusiskåp | 19.8 | top 5 | Nisch (118 imp!) |
| hurtsar | 14.2 | top 5 | 99 imp/mån |

---

## 4. Keyword-strategi — ABC-prioritering

### A-nyckelord (Huvudfokus — högst volym & kommersiellt värde)
| Sökord | Est. sökvolym/mån | Nuv. pos | Mål 6 mån |
|--------|-------------------|----------|-----------|
| kontorsmöbler | 2,000-3,000 | 17.4 | top 10 |
| kontorsstolar | 3,000-5,000 | 62.3 | top 20 |
| höj och sänkbart skrivbord | 5,000-8,000 | 38.2 | top 15 |
| konferensbord | 1,000-2,000 | 35.6 | top 10 |
| kontorsmöbler online | 500-1,000 | ej rankad | top 20 |

### B-nyckelord (Sekundärt fokus — medium volym, lättare att ranka)
| Sökord | Est. sökvolym/mån | Nuv. pos | Mål 6 mån |
|--------|-------------------|----------|-----------|
| hurtsar | 500-800 | 14.2 | top 5 |
| jalusiskåp | 300-500 | 19.8 | top 5 |
| kontorsmöbler företag | 200-400 | 14.2 | top 5 |
| hörnskrivbord | 1,000-2,000 | 25.3 | top 10 |
| bordsskiva | 1,000-2,000 | 16.4 | top 10 |
| fåtölj kontor | 200-400 | 13.0 | top 5 |
| konferensstolar | 500-800 | 64.0 | top 20 |
| bordsskärm skrivbord | 200-400 | 15.0 | top 5 |

### C-nyckelord (Long-tail — låg volym men hög köpintention)
| Sökord | Est. sökvolym/mån | Nuv. pos | Mål 3 mån |
|--------|-------------------|----------|-----------|
| gåband skrivbord | 100-200 | 7.1 | top 3 |
| pelarstativ bord | 50-100 | 3.9 | top 1 |
| konferensbord med eluttag | 50-100 | 9.3 | top 3 |
| kontorsstol utan armstöd | 100-200 | 8.1 | top 3 |
| bordsskiva 160x80 | 50-100 | 10.6 | top 3 |
| gåband under skrivbord | 100-200 | 7.3 | top 3 |
| dekorativa pendelarmaturer | 50-100 | 28.9 | top 10 |
| bokhylla med dörrar | 200-500 | 22.2 | top 10 |
| höjbart skrivbord | 200-500 | 18.9 | top 10 |

### Outnyttjade keyword-möjligheter (ej rankad idag)
| Sökord | Est. sökvolym | Möjlighet |
|--------|---------------|-----------|
| ergonomisk kontorsstol | 2,000-3,000 | Skapa guide + kategori |
| kontorsmöbler billigt | 500-1,000 | Prisargument-sida |
| begagnade kontorsmöbler | 1,000-2,000 | Om relevant |
| kontorsinredning | 1,000-2,000 | Inspirations-content |
| arbetsmiljö kontor | 500-1,000 | Kunskapsartikel |
| hemmakontor möbler | 500-1,000 | Trendsida |
| kontorsmöbler Småland/Jönköping/Växjö | 100-300 | Lokal SEO |
| skrivbord 160x80 | 200-500 | Specifik produktsida |

---

## 5. Handlingsplan — 12 månader

### FAS 1: Akut / Månad 1-2 (Grund)

#### 1.1 Migrera till WooCommerce ⭐ REKOMMENDERAT
**Varför:** Abicart ger inte tillräcklig SEO-kontroll. Med WooCommerce + Rank Math får vi:
- Full meta-title & description per sida
- Schema markup (Product, FAQ, Organization, BreadcrumbList)
- XML sitemap-kontroll
- Redirect-hantering (301)
- Pagespeed-optimering
- Blogg med full WordPress-funktionalitet
- Automatisk optimering via Searchboost Opti

**Migrations-plan:**
1. Exportera alla produkter via Abicart Admin API (token redan aktiv)
2. Sätt upp WooCommerce på eget webbhotell (Loopia/one.com)
3. Importera produkter med bilder, kategorier, priser
4. Installera Rank Math SEO + nödvändiga plugins
5. Bygga 301-redirectmapping (vi har redan ~60 URL-mappningar)
6. Testperiod med staging-domän
7. DNS-switch → go live
8. Verifiera alla 301:s i GSC

**Tidsuppskattning:** 2-3 veckor
**Kostnad:** Gratis (Searchboost erbjuder det kostnadsfritt)

#### 1.2 Sätt ABC-nyckelord i systemet
- Lägg in alla A/B/C-nyckelord i Searchboost Opti
- Koppla till GSC-tracking
- Sätt upp veckorapporter

#### 1.3 Grundläggande on-page (efter WP-migrering)
- Optimera meta-titlar för ALLA 50 kategorisidor
- Skriv unika meta-descriptions (150-160 tecken)
- Sätt upp schema markup: Organization, BreadcrumbList, Product

### FAS 2: Innehåll / Månad 2-4

#### 2.1 Kategoritexter (SEO-copy)
Skriv unika texter (300-500 ord) för de 15 viktigaste kategorisidorna:

| Prioritet | Kategorisida | Mål-sökord |
|-----------|-------------|------------|
| 1 | /kontorsstolar/ | kontorsstolar, ergonomisk kontorsstol |
| 2 | /skrivbord/ | skrivbord kontor, kontorsskrivbord |
| 3 | /hoj-och-sankbart-skrivbord/ | höj och sänkbart skrivbord |
| 4 | /konferensbord/ | konferensbord, konferensbord med eluttag |
| 5 | /forvaring/ | förvaring kontor, kontorsförvaring |
| 6 | /jalusiskap/ | jalusiskåp, jalusiskåp kontor |
| 7 | /ljudabsorbenter/ | ljudabsorbenter kontor |
| 8 | /kontorsstolar/konferensstolar/ | konferensstolar |
| 9 | /stolar-fatoljer/fatoljer/ | fåtölj kontor |
| 10 | /hornskrivbord/ | hörnskrivbord |
| 11 | /bordsskivor/ | bordsskiva, bordsskiva 160x80 |
| 12 | /hurts/ | hurtsar, hurts kontor |
| 13 | /bordsskarmar/ | bordsskärm skrivbord |
| 14 | /receptionsdiskar/ | receptionsdisk |
| 15 | /belysning/ | kontorsbelysning |

#### 2.2 Bloggstrategi — 2 artiklar/månad
Systematisk content som bygger topical authority:

**Månad 2:**
1. "Hur väljer man rätt kontorsstol? — Komplett guide 2026" (2000 ord)
2. "Höj- och sänkbart skrivbord: Fördelar, tips & vad du ska tänka på" (1500 ord)

**Månad 3:**
3. "Kontorsmöbler för små företag — Så inreder du kontoret smart" (1500 ord)
4. "Ergonomi på kontoret: 10 tips för en bättre arbetsplats" (1500 ord)

**Månad 4:**
5. "Konferensmöbler: Guide till att välja rätt konferensbord och stolar" (1500 ord)
6. "Ljudabsorbenter på kontoret — Så minskar du buller" (1200 ord)

**Månad 5-6:**
7. "Gåband under skrivbordet: Fungerar det verkligen?" (1200 ord)
8. "Hemmakontor vs kontor: Vilka möbler behöver du?" (1200 ord)
9. "Jalusiskåp: Allt du behöver veta om förvaringsmöbler" (1000 ord)
10. "Kontorsinredning Småland — Lokala tips & leverantörer" (1000 ord)

#### 2.3 FAQ-sektioner
Lägg till FAQ (med schema markup) på de 10 viktigaste kategorisidorna:
- "Vilken kontorsstol är bäst för långa arbetsdagar?"
- "Hur hög ska ett höj- och sänkbart skrivbord vara?"
- "Vad kostar det att inreda ett kontor för 10 personer?"
- Etc.

### FAS 3: Länkbygge / Månad 3-6

#### 3.1 Backlink-sanering (Disavow)
1. Identifiera alla spam-domäner (.top, .icu, .xyz, .sbs)
2. Granska wikileaks.se-länkarna (8 dofollow)
3. Undersök "Bountiful"-ankarlänkarna (16 st)
4. Skapa disavow-fil och ladda upp i GSC
5. **Mål:** Rensa ~20-30 spam-domäner

#### 3.2 Aktiv länkbyggning
**Mål: +50 referring domains på 6 månader (78 → 128)**

| Metod | Mål-domäner | Tidsram |
|-------|-------------|---------|
| Företagskataloger (eniro, hitta, allabolag) | 5-10 | Månad 3 |
| Branschkataloger (möbelindustrin) | 5-10 | Månad 3-4 |
| Lokala Smålands-sajter (tidningar, föreningar) | 5-10 | Månad 3-6 |
| Gästbloggande (inredning, arbetsmiljö) | 5-10 | Månad 4-6 |
| Leverantör-partnerlinks | 3-5 | Månad 3 |
| Digital PR (pressmeddelanden) | 2-3 | Månad 5-6 |
| Broken link building | 5-10 | Löpande |

#### 3.3 Intern länkstruktur
- Länka från blogginlägg → kategorisidor
- Länka mellan relaterade produktkategorier
- Breadcrumb-navigation med schema
- "Relaterade produkter" med relevanta ankare

### FAS 4: Lokal SEO / Månad 4-6

#### 4.1 Google Business Profile
- Verifiera/optimera GMB-profil
- Ladda upp produktbilder
- Svara på recensioner
- Regelbundna GMB-inlägg (1/vecka)

#### 4.2 Lokala landningssidor
Skapa specifika sidor för:
- "Kontorsmöbler Jönköping"
- "Kontorsmöbler Växjö"
- "Kontorsmöbler Småland"
- "Kontorsmöbler Kalmar"

#### 4.3 Lokala citeringar (NAP-konsistens)
- Eniro, Hitta.se, Gulasidorna
- Google Maps
- Bing Places
- Apple Maps

### FAS 5: Teknisk SEO & Pagespeed / Löpande

#### 5.1 Core Web Vitals
- LCP < 2.5s
- FID < 100ms
- CLS < 0.1
- Bildoptimering (WebP, lazy loading)
- Minifiering av CSS/JS

#### 5.2 Strukturerad data (Schema)
```json
- Organization (företagsinfo)
- Product (alla produkter med pris, tillgänglighet)
- BreadcrumbList (navigation)
- FAQPage (på kategorisidor)
- LocalBusiness (lokal sökning)
```

#### 5.3 Tekniska fixar
- Canonical-taggar på alla sidor
- hreflang (om relevant)
- robots.txt-optimering
- XML sitemap med korrekt prioritering
- 404-sida med sökfunktion
- Implementera 301-redirects (det borttagna redirect-scriptet)

---

## 6. WooCommerce-migrering — Detaljerad plan

### Varför migrera?

| Aspekt | Abicart (nu) | WooCommerce (efter) |
|--------|-------------|-------------------|
| Meta-titlar | Automatgenererade | Full kontroll per sida |
| Meta-descriptions | Saknas | Rank Math SEO |
| Schema markup | Minimal | Product, FAQ, Breadcrumb, Organization |
| Blogg | Rudimentär | Full WordPress-blogg |
| Pagespeed | Begränsad | Full kontroll (caching, CDN) |
| Redirects | JavaScript-hack | 301 via server |
| Analytics | Begränsat | GA4 + GTM full integration |
| Automatisk SEO | Ej möjligt | Searchboost Opti (automatiskt) |
| Kostnad | Abicart-avgift/mån | Hosting ~99-199 kr/mån |
| Plugins | Inga | 60,000+ WP-plugins |

### Migreringssteg

```
Vecka 1: Förberedelse
├── Exportera produktdata via Abicart API
├── Kartlägga alla URL:er (gamla → nya)
├── Välja hosting (Loopia/one.com/Binero)
└── Installera WordPress + WooCommerce

Vecka 2: Bygge
├── Importera produkter (namn, beskrivning, bilder, priser, kategorier)
├── Sätta upp tema (Storefront/Flatsome)
├── Installera Rank Math SEO
├── Konfigurera betalning (Klarna, Swish, kort)
└── Konfigurera frakt

Vecka 3: Optimering
├── SEO-optimera alla kategorisidor (titlar, descriptions, texter)
├── Schema markup (Product, Organization, FAQ)
├── Pagespeed-optimering
├── Testbeställningar
└── 301-redirect-lista (alla gamla URL:er → nya)

Vecka 4: Lansering
├── DNS-switch
├── Verifiera 301-redirects
├── Kontrollera i GSC att allt indexeras
├── Koppla Searchboost Opti (WP app-password)
└── Aktivera automatisk optimering
```

### Riskhantering

| Risk | Sannolikhet | Åtgärd |
|------|-------------|--------|
| Temporär trafikdipp | Medel | 301-redirects + GSC URL-inspektion |
| Brutna bilder | Låg | Migrera alla bilder till WP media library |
| Betalning slutar fungera | Låg | Testa alla betalsätt före DNS-switch |
| Kund missnöjd med design | Medel | Visa staging-sajt för godkännande först |

---

## 7. KPI:er & Milstolpar

### 3 månader (Maj 2026)
| KPI | Nuläge | Mål |
|-----|--------|-----|
| Organiska klick/mån | 7 | 100+ |
| Sökord i top 10 | 7 | 20 |
| Sökord i top 30 | 32 | 60 |
| Referring domains | 78 | 95 |
| DIR | 30 | 33 |
| Bloggartiklar | 1 | 5 |
| CTR | 0.3% | 2% |

### 6 månader (Augusti 2026)
| KPI | Nuläge | Mål |
|-----|--------|-----|
| Organiska klick/mån | 7 | 500+ |
| Sökord i top 10 | 7 | 35 |
| Sökord i top 30 | 32 | 80 |
| Referring domains | 78 | 130 |
| DIR | 30 | 40 |
| Bloggartiklar | 1 | 13 |
| "kontorsmöbler" position | 17.4 | top 10 |

### 12 månader (Februari 2027)
| KPI | Nuläge | Mål |
|-----|--------|-----|
| Organiska klick/mån | 7 | 2,000+ |
| Sökord i top 10 | 7 | 50+ |
| Referring domains | 78 | 200+ |
| DIR | 30 | 45+ |
| Bloggartiklar | 1 | 25 |
| Organisk trafik (sessions/mån) | ~50 | 3,000+ |

---

## 8. Budget & Investering

### Alternativ A: SEO-paket Standard (5,000 kr/mån)
| Ingår | Per månad |
|-------|-----------|
| Teknisk SEO & on-page | Löpande |
| 2 bloggartiklar | 2 st |
| Kategoritexter | 2-3 st |
| Backlinkbuilding | 5-8 nya |
| Veckorapport | Varje måndag |
| GSC-övervakning | Daglig |

### Alternativ B: SEO-paket Premium (8,000 kr/mån)
| Ingår | Per månad |
|-------|-----------|
| Allt i Standard | ✓ |
| WooCommerce-migrering (engång) | Inkluderat |
| 4 bloggartiklar | 4 st |
| Lokal SEO (GMB + lokala sidor) | ✓ |
| Konkurrentbevakning | Månatlig |
| Avancerad schema markup | ✓ |
| Dedikerat Slack-kanal | ✓ |

### WooCommerce-migrering (om separat)
- **Pris:** Gratis (Searchboost-erbjudande)
- **Tidsram:** 3-4 veckor
- **Krav från kund:** Godkänna design, testa beställningar

---

## 9. Sammanfattning — Prioriterade åtgärder

```
AKUT (vecka 1-2):
  ✅ Abicart-support kontaktad (produktdata-bugg)
  ✅ Redirect-script borttaget tillfälligt
  ✅ "Kunskap" & "Artiklar" borttagna från meny
  □ Presentera WooCommerce-erbjudande för Mikael N
  □ Lägg in ABC-nyckelord i Searchboost Opti

MÅNAD 1-2 (Grund):
  □ Påbörja WooCommerce-migrering
  □ Optimera meta-titlar (alla kategorisidor)
  □ Skriv meta-descriptions
  □ Sätt upp schema markup
  □ Första 2 bloggartiklarna

MÅNAD 3-4 (Momentum):
  □ Disavow spam-backlinks
  □ Starta aktiv länkbyggning
  □ Kategoritexter på 15 sidor
  □ Lokal SEO (GMB, lokala sidor)
  □ 4 till bloggartiklar

MÅNAD 5-6 (Acceleration):
  □ Fortsatt content-produktion
  □ Intensifiera länkbyggning
  □ Teknisk optimering (Core Web Vitals)
  □ Utvärdera ROI & justera strategi

LÖPANDE:
  □ Automatisk SEO-optimering via Searchboost Opti
  □ Veckorapporter
  □ GSC-övervakning
  □ Konkurrentbevakning
```

---

## 10. Appendix

### A. Fullständig lista — Alla 50 GSC-sökord
Se separat GSC-data (exporterad 2026-02-11).

### B. Backlink-data
Fullständig backlinkrapport från SE Ranking (exporterad 2026-02-11).

### C. Redirect-mappning
~60 URL-omdirigeringar sparade från det borttagna redirect-scriptet. Ska implementeras som 301-redirects vid WooCommerce-migrering.

### D. Konkurrenters backlink-jämförelse
Se avsnitt 3.1 för fullständig tabell.

---

*Dokumentet uppdateras löpande. Senast uppdaterad: 2026-02-11*
*© Searchboost.se — Mikael Larsson*
