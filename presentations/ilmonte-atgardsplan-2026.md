# Atgardsplan: ilmonte.se — 3 Manader

> **Period:** Mars - Maj 2026
> **Kund:** AB Ilmonte (ilmonte.se)
> **Av:** Searchboost.se (Mikael Larsson)
> **Kontakt:** Peter Vikstrom (VD), peter.vikstrom@ilmonte.se
> **Baserad pa:** SEO-audit 2026-03-03

---

## Oversikt

| Manad | Fokus | Mal |
|-------|-------|-----|
| **Manad 1** (Mars) | Tekniska fixar + grundlaggning | Fixa alla kritiska problem, optimera metadata |
| **Manad 2** (April) | Innehallsoptimering + nya sidor | Publicera kopguider, optimera kategorisidor |
| **Manad 3** (Maj) | Tillvaxt + lankbygge + uppfoljning | Kontinuerlig content, lankstrategi, matning |

**ABC-nyckelord i systemet:** 30 st (9A + 14B + 7C)
**Mal efter 3 manader:** Forstasidesrankning pa 3-5 A-nyckelord, matbar trafikokning pa 50-100%

---

## MANAD 1: Tekniska fixar + Grundlaggning

### Vecka 1: Kritisk teknisk sanering

**Dag 1-2: Plugin-sanering och schema-fix**
- [ ] Avinstallera MonsterInsights-pluginet fran WordPress (dubblerar GA4-sporning)
- [ ] Byt startsidans schema fran Article till Organization + WebSite via Rank Math
- [ ] Andra startsidans H2 "Valkommen till AB Ilmonte" till H1
- [ ] Byt forfattare fran "Effektify" till "AB Ilmonte" i Rank Math -> Installningar

**Dag 3: Indexeringskontroll**
- [ ] Satt noindex pa `/varukorg/`, `/kassan/`, `/mitt-konto/` via Rank Math
- [ ] Kontrollera att dessa tre sidor tas bort fran sitemap automatiskt
- [ ] Verifiera att sitemap_index.xml fungerar korrekt (8 delsitemaps)

**Dag 4-5: Breadcrumbs + bildoptimering start**
- [ ] Aktivera Rank Math breadcrumbs (Rank Math -> Allmannat -> Breadcrumbs)
- [ ] Satt upp BreadcrumbList-schema (Rank Math gor detta automatiskt med breadcrumbs)
- [ ] Borja alt-text-granskning: Startsidan (28 bilder saknar alt-text)
- [ ] Optimera alt-texter med A-nyckelord dar det ar relevant (scenpodier, dansmattor, etc.)

### Vecka 2: Metadata-optimering av nyckellandningssidor

**Startsidan (/)**
- [ ] Ny title: "Scenpodier, Dansmattor & Scentextil | AB Ilmonte - Sveriges Scenproduktionsleverantor"
- [ ] Ny meta description: "AB Ilmonte levererar scenpodier, dansmattor, scentextil, ridakenor, laktare och teatermobler till teatrar, kulturhus och eventarenor i hela Sverige. 40+ ars erfarenhet."
- [ ] Uppdatera OG-bild fran logotyp till representativ produktbild

**Om oss (/om-oss/)**
- [ ] Ny title: "Om AB Ilmonte | 40 Ars Erfarenhet av Scenproduktion i Sverige"
- [ ] Ny meta description: "AB Ilmonte ar en del av A.S.O-gruppen och Sveriges ledande leverantor av scenpodier, dansmattor och scentextil. Over 40 ars erfarenhet av teater- och eventbranschen."
- [ ] Granska befintlig text — komplettera med historik, kompetensomraden, USP:ar

**Kontakt (/kontakt/)**
- [ ] Ny title: "Kontakta AB Ilmonte | Offert pa Scenpodier & Teaterutrustning"
- [ ] Ny meta description: "Kontakta AB Ilmonte for offert pa scenpodier, dansmattor, scentextil och teaterutrustning. Vi ger rad baserat pa 40+ ars erfarenhet. Ring 035-18 19 40."
- [ ] Fixa skrivfelet "har har" i befintlig meta description

**ilmofurniture (/ilmofurniture/)**
- [ ] Ny title: "ilmofurniture | Eventmobler & Designmobler for Event och Utstaallning"
- [ ] Ny meta description: "ilmofurniture erbjuder stilrena eventmobler, loungemobler och designmobler for event, utstallningar och offentliga miljoer. Fran AB Ilmonte."

### Vecka 3: Kategorisidor — SEO-texter

**Skriv SEO-beskrivningstexter (200-400 ord) for huvudkategorierna:**

| Kategori | URL | Fokus-nyckelord (A/B) | Ord |
|----------|-----|-----------------------|-----|
| Podier | /produkt-kategori/podier/ | scenpodier, scenpodium, ilmontepodier | 350 |
| Dansmattor | /produkt-kategori/dansmattor/ | dansmattor, dansmatta, scenmattor | 300 |
| Scentextil | /produkt-kategori/scentextil/ | scentextil, scentyg, sammet teater | 350 |
| Ridakenor | /produkt-kategori/ridakenor/ | ridakenor, scendraperi, ridaskenor | 300 |
| Laktare | /produkt-kategori/laktare/ | laktare, gradang, teleskoplaktare | 300 |
| Stolar & Fatoljer | /produkt-kategori/stolar-och-fatoljer/ | teatermobler, biostoler, horsalsstolar | 350 |
| Farg | /produkt-kategori/farg/ | scenfarg, scenmalning, Rosco farg | 250 |
| Ovrigt | /produkt-kategori/ovrigt/ | sceneffekter, akustiklosningar | 250 |

**Total content-produktion vecka 3:** ~2 450 ord

### Vecka 4: Alt-text + Intern lankning + GSC

**Bildoptimering**
- [ ] Slutfor alt-text-granskning pa Om oss (5 bilder), Kontakt (6 bilder)
- [ ] Skriv alt-texter med relevanta nyckelord: "Scenpodium Rapid fran ilmonte med hopfallbara ben"
- [ ] Kontrollera att alla produktbilder i huvudkategorierna har alt-text

**Intern lankning**
- [ ] Lagg till lankar mellan relaterade kategorisidor (ex: Podier -> Tillbehor -> Ridakenor)
- [ ] Konfigurera WooCommerce "Relaterade produkter" for cross-selling
- [ ] Lank fran startsidan till de 5 viktigaste kategorisidorna (med nyckelordstext)

**GSC-access**
- [ ] Kontakta Peter Vikstrom: be honom lagga till service account som "Fullstandig" i GSC
  - SA: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
  - Property: `https://ilmonte.se/`
- [ ] Nar GSC ar aktiverat: koppla property-URL i Searchboost-systemet
- [ ] Hamta forsta GSC-data for baslinjeanalys

---

## MANAD 2: Innehallsoptimering + Nya sidor

### Vecka 5: Kopguide 1 — Scenpodier

**Skapa ny sida: "Guide: Valj Ratt Scenpodium"**
- [ ] URL: `/guide-scenpodier/` (1500-2000 ord)
- [ ] Innehall:
  - Vad ar ett scenpodium? (definition + anvandningsomraden)
  - Typer av scenpodier (Rapid, hopfallbara, trumpodier, hojtillbankbart)
  - Materialval och hallbarhet
  - Storlekar och konfigurationer
  - Tilltbehor som behxovs (ramper, stag, railing)
  - Hur man valjer ratt podium for sin verksamhet
  - Checklista for inkop
  - CTA: "Kontakta oss for offert"
- [ ] Intern lankning: Lank till alla podium-produkter + tillbehor
- [ ] Optimera title: "Guide: Valj Ratt Scenpodium | Typer, Storlekar & Tips | AB Ilmonte"
- [ ] Schema: Article + FAQ (3-5 vanliga fragor inline)

### Vecka 6: Kopguide 2 — Dansmattor

**Skapa ny sida: "Guide: Valj Ratt Dansmatta"**
- [ ] URL: `/guide-dansmattor/` (1500-2000 ord)
- [ ] Innehall:
  - Typer av dansmattor (PVC, textil, Vario-serien)
  - Anvandningsomraden (balett, modern dans, teater, event)
  - Material och ytskikt (halkskydd, reflektionsgrad)
  - Storlekar och montage
  - Underhall och livslangd
  - Prisnavaer och budgetplanering
  - CTA: "Bestall provbit eller begar offert"
- [ ] Intern lankning: Alla dansmatteprodukter
- [ ] Optimera for B-nyckelord inom dansmattor

### Vecka 7: Kopguide 3 — Scentextil + FAQ-sida

**Skapa ny sida: "Guide: Scentextil och Scentyg"**
- [ ] URL: `/guide-scentextil/` (1500-2000 ord)
- [ ] Innehall:
  - Typer av scentextil (sammet, molton, blackout, chromakey)
  - Brandklassning (euroklass, svensk lag, testmetoder)
  - Anvandningsomraden (scendraperier, bakgrunder, akustik)
  - Fargval och ljuspaverkan
  - Somi och mattsydd scentextil (ilmontes styrka)
  - Underhall och tvatt
- [ ] Fokus pa A/B-nyckelord: scentextil, scentyg, sammet teater, molton scen

**Skapa FAQ-sida**
- [ ] URL: `/vanliga-fragor/` (1500 ord)
- [ ] 20-25 fragor uppdelade i kategorier:
  - Produktfragor (material, storlekar, brandklass)
  - Bestallning och leverans
  - Installation och montage
  - Underhall och garanti
- [ ] FAQ-schema (FAQPage) via Rank Math for rich snippets i Google

### Vecka 8: Referensprojekt + Produktoptimering

**Skapa referensprojekt-samlingssida**
- [ ] URL: `/referensprojekt/` (1000 ord intro + projektlista)
- [ ] Flytta/kopiera befintliga referensprojekt fran produktkatalogen
- [ ] For varje projekt (200-400 ord):
  - Projektnamn och ort
  - Utmaning/uppdrag
  - Losning (vilka produkter)
  - Resultat/kundkommentar
  - Bilder med alt-text
  - Lankar till anvanda produkter
- [ ] Optimera for nyckelord: "referensprojekt scenutrustning", "sceninstallation Sverige"

**Produktoptimering — Batch 1 (topp 30 produkter)**
- [ ] Identifiera de 30 mest besokta/saldda produkterna
- [ ] For varje produkt:
  - Forbattra produktbeskrivning (minst 200 ord)
  - Lagg till specifikationer i strukturerat format
  - Optimera title och meta description
  - Satt alt-text pa alla produktbilder
  - Lagg till Product-schema via Rank Math
- [ ] Prioritera produkter kopplade till A-nyckelord

---

## MANAD 3: Tillvaxt + Lankbygge + Uppfoljning

### Vecka 9: Bloggstrategi — Forsta artiklarna

**Bloggpost 1: "Att bygga en scen — fran ide till invigning"**
- [ ] URL: `/blogg/bygga-scen-guide/` (1200-1500 ord)
- [ ] Innehall: Planering, dimensionering, produktval, installation, sakerhet
- [ ] Nyckelord: scenpodier, scenbygge, bygga scen
- [ ] Intern lankning: Podier-kategorin, tillbehor, referensprojekt

**Bloggpost 2: "Brandklassning av textil for offentliga miljoer"**
- [ ] URL: `/blogg/brandklassning-textil/` (1200-1500 ord)
- [ ] Innehall: Euroklasser, svenska krav, testmetoder, val av ratt textil
- [ ] Nyckelord: brandklassad textil, scentextil, euroklass
- [ ] Intern lankning: Scentextil-kategorin

**Bloggpost 3: "5 vanliga misstag vid val av dansmattor"**
- [ ] URL: `/blogg/vanliga-misstag-dansmattor/` (1000-1200 ord)
- [ ] Nyckelord: dansmattor, dansmatta val, dans golvbelaggning

### Vecka 10: Lankbygge — Fas 1

**Referenslankbygge**
- [ ] Identifiera 10-15 kulturhus/teatrar dar ilmonte gjort installationer
- [ ] Kontakta varje verksamhet: be om lank fran deras "leverantorer"-sida
- [ ] Forvanta resultat: 3-5 lankar fran hogt relevanta sajter

**Branschkataloger**
- [ ] Registrera/uppdatera profil pa:
  - Eniro.se (foretag)
  - Hitta.se (foretag)
  - Allabolag.se (automatisk, kontrollera)
  - Eventbranschen.se (om sadan katalog finns)
  - Svenskscenkonst.se (om leverantorslista finns)
- [ ] Saker NAP-konsekvens (namn, adress, telefon identiskt overallt)

**PR-lankbygge**
- [ ] Identifiera nyhetskanaler i eventbranschen
- [ ] Skriv pressmeddelande om nytt referensprojekt eller produktlansering
- [ ] Distribuera till lokaltidningar i Halland + branschmedier

### Vecka 11: Produktoptimering — Batch 2 + Underkategorier

**Produktoptimering — Batch 2 (ytterligare 30 produkter)**
- [ ] Fokusera pa B-nyckelords-produkter (ridakenor, laktare, teatermobler)
- [ ] Samma process som Batch 1: beskrivningar, schema, alt-text, meta

**Underkategoritexter**
- [ ] Skriv SEO-texter (150-250 ord) for de viktigaste underkategorierna:
  - Scenpodier, Rapid (fokus: rapid scenpodium)
  - Rapid tillbehor (fokus: scenpodietillbehor)
  - Sammet (fokus: scensammet, teatersammet)
  - Molton (fokus: scenmolton, moltontyg)
  - Blackout (fokus: blackouttyg, morklaggningstyg)
  - Teater (stolar) (fokus: teaterstolar, biostoler)
  - Horsal (stolar) (fokus: horsalsstolar, konferensstolar)

### Vecka 12: Matning, rapportering & nasta steg

**Matning och analys**
- [ ] GSC-rapport: Jamnfor positioner pa A-nyckelord (fore vs efter)
- [ ] GA4-rapport: Trafik, sidvisningar, bounce rate pa optimerade sidor
- [ ] Rankningskontroll: Manuell sokning pa 9 A-nyckelord
- [ ] Rapport till kund: Sammanstallning av alla atgarder + resultat

**Uppfoljning och forbattring**
- [ ] Identifiera vilka kategorisidor som borjat ranka — dubblera innehallet
- [ ] Granska vilka kopguider som genererar mest trafik — skriv fler
- [ ] Planera manad 4-6: Fordjupad content-strategi, avancerad lankbyggning

**Innehallskalender for framtiden (2 artiklar/manad)**
| Manad | Artikel 1 | Artikel 2 |
|-------|-----------|-----------|
| Juni | "Guide: Ridakenor for scen och offentlig miljo" | "Referens: [Nytt projekt]" |
| Juli | "Horsalsstolar vs teatermobler — skillnaderna" | "Sommarunderhall av scenpodier" |
| Aug | "Guide: Akustiklosningar med textil" | "Referens: [Nytt projekt]" |
| Sep | "Eventmobler for mässor och utställningar" | "Trender inom scendesign 2026" |

---

## Leverabler per manad

### Manad 1 — Leverabler
| Leverabel | Antal | Beskrivning |
|-----------|-------|-------------|
| Tekniska fixar | 7 st | MonsterInsights, noindex, H1, schema, breadcrumbs, forfattare, metafix |
| Metadata-optimering | 4 sidor | Startsida, Om oss, Kontakt, ilmofurniture |
| Kategoritexter | 8 st | Huvudkategorier, 200-400 ord vardera (~2 450 ord totalt) |
| Alt-text-granskning | ~50 bilder | Startsida + Om oss + Kontakt |
| Intern lankning | 15-20 lankar | Mellan kategorier, produkter, startsida |
| GSC-aktivering | 1 st | Service account tillagd av kunden |

### Manad 2 — Leverabler
| Leverabel | Antal | Beskrivning |
|-----------|-------|-------------|
| Kopguider | 3 st | Scenpodier, Dansmattor, Scentextil (~5 000 ord totalt) |
| FAQ-sida | 1 st | 20-25 fragor med FAQ-schema (~1 500 ord) |
| Referensprojektsida | 1 st | Samlingssida + 5-10 projektbeskrivningar |
| Produktoptimering | 30 st | Topp-produkter: beskrivningar, schema, alt-text |

### Manad 3 — Leverabler
| Leverabel | Antal | Beskrivning |
|-----------|-------|-------------|
| Bloggposter | 3 st | Scenbygge, brandklassning, dansmattor (~3 700 ord) |
| Lankbygge | 10-15 kontakter | Referenslank, kataloger, PR |
| Produktoptimering | 30 st | B-nyckelords-produkter |
| Underkategoritexter | 7 st | Viktigaste underkategorierna (~1 400 ord) |
| Matning/rapport | 1 st | 3-manaders sammanstallning |

---

## Totalt innehallsproduktion

| Typ | Antal | Uppskattade ord |
|-----|-------|-----------------|
| Kategoritexter (huvud) | 8 | ~2 450 |
| Kopguider | 3 | ~5 000 |
| FAQ-sida | 1 | ~1 500 |
| Referensprojektsida | 1 | ~3 000 |
| Bloggposter | 3 | ~3 700 |
| Underkategoritexter | 7 | ~1 400 |
| Metadata (titles + descriptions) | 15+ | ~500 |
| Alt-texter | 80+ | ~800 |
| **TOTALT** | **~40+ leverabler** | **~18 350 ord** |

---

## Forutsattningar

For att atgardsplanen ska kunna genomforas behovs:

1. **WordPress admin-access** — WP-inloggning eller Application Password (status: OK enligt KUNDER.md)
2. **GSC-access** — Peter Vikstrom behover lagga till Searchboosts service account
3. **Rank Math PRO-inloggning** — For avancerade schema-installningar
4. **Produktinformation** — ilmonte behover tillhandahalla tekniska specifikationer for produkttexter
5. **Referensprojekt-material** — Bilder och projektbeskrivningar fran ilmonte
6. **Godkannande av texter** — ilmonte bor granska SEO-texter innan publicering (B2B-krav pa precision)

---

## Risker och beroenden

| Risk | Sannolikhet | Paverkan | Atgard |
|------|-------------|----------|--------|
| GSC-access ej beviljad | Medel | Hog — ingen matning | Panga kunden, erbjud hjalp med installningen |
| Kunden hinner inte granska texter | Hog | Medel — forseningar | Satt tvaveckors deadline, borja med mindre viktiga sidor |
| Flatsome-tema begransar SEO | Lag | Lag | Rank Math overskriver temats standarder |
| Konkurrenter reagerar | Lag | Lag | Nimark — fa aktiva konkurrenter online |
| Algoritmuppdatering | Lag | Variabel | Fokus pa kvalitetsinnehall, inga genvägar |

---

## Malsattning efter 3 manader

| KPI | Nuvarande (uppsk.) | Mal efter 3 man |
|-----|---------------------|-----------------|
| Organisk trafik/man | ~200-400 | 400-800 (+100%) |
| A-nyckelord pa sida 1 | 0-1 | 3-5 |
| B-nyckelord pa sida 1 | 1-3 | 6-8 |
| Indexerade sidor | ~650 | ~665 (15 nya kvalitetssidor) |
| Bloggposter | 1 | 4 |
| Sidor med meta description | ~60% | 95%+ |
| Produkter med optimerad schema | ~30% | 40-50% |
| Backlinks (nya) | 0 | 5-10 |

---

*Atgardsplan framtagen av Searchboost.se*
*Kontakt: Mikael Larsson, mikael@searchboost.se*
*Nasta uppfoljning: Vecka 14 (slutet av manad 1)*
