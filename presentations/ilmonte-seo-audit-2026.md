# SEO-Audit: ilmonte.se

> **Genomford:** 2026-03-03
> **Av:** Searchboost.se (Mikael Larsson)
> **Kund:** AB Ilmonte, Aled
> **Kontakt:** Peter Vikstrom (VD), peter.vikstrom@ilmonte.se
> **Sajt:** https://ilmonte.se/
> **CMS:** WordPress 6.8.3 + WooCommerce 10.0.4 + Flatsome 3.20.5
> **SEO-plugin:** Rank Math PRO

---

## Sammanfattning

| Parameter | Varde |
|-----------|-------|
| **Totalbetyg** | **42/100** |
| Teknisk SEO | 55/100 |
| On-Page SEO | 35/100 |
| Innehall & Content | 25/100 |
| Lankar & Auktoritet | 40/100 |
| Lokal SEO | 50/100 |
| Anvandbarhet & UX | 55/100 |

**Bedomning:** ilmonte.se har en stabil teknisk grund med WordPress, WooCommerce och Rank Math PRO, men utnyttjar bara en brakdel av plattformens potential. Sajten lider av bristande metadata pa nyckellandningssidor, i princip obefintlig bloggstrategi, och saknar strukturerat innehall som kan ranka pa branschrelevanta soktermer. Med 630+ produkter och en nischad B2B-marknad finns det enorma mojligheter att dominera sokokorden inom scenproduktion, teaterutrustning och eventmobilier i Sverige.

---

## 1. Teknisk SEO (55/100)

### 1.1 Positiva fynd

| Omrade | Status | Kommentar |
|--------|--------|-----------|
| HTTPS/SSL | OK | Korrekt implementerat med canonical-taggar |
| Sitemap | OK | Rank Math genererar sitemap_index.xml med 8 delsitemaps |
| robots.txt | OK | Korrekt — WooCommerce-katalogsidor blockerade |
| Schema markup | Delvis | Organization, WebSite, SearchAction, WebPage finns |
| GTM | OK | GTM-5R3XFSN installerat |
| GA4 | OK | G-CM832CYYRS via WooCommerce-integration |
| GDPR/Cookies | OK | CookieYes installerat |
| Open Graph | OK | OG-taggar konfigurerade |
| Twitter Cards | OK | Konfigurerade via Rank Math |
| Fonter | OK | Hostas lokalt (Oswald + Lato) — bra for GDPR och prestanda |
| Lokalt SEO | OK | Rank Math Local installerat med locations.kml |

### 1.2 Tekniska problem

#### KRITISKT

**1. MonsterInsights installerad men EJ konfigurerad**
- HTML-kommentar i kallkoden bekraftar: pluginet ar aktivt men inte konfigurerat
- Risk for dubblerad GA4-sporning (WooCommerce GA-integration kor redan)
- **Atgard:** Avinstallera MonsterInsights helt — GA4 hanteras redan via GTM + WooCommerce-integration

**2. WooCommerce-sidor indexerade i sitemap**
- `/varukorg/`, `/kassan/`, `/mitt-konto/` finns i page-sitemap.xml
- Dessa sidor har inget sokvarde och slosa crawlbudget
- **Atgard:** Satt noindex via Rank Math pa dessa tre sidor

**3. Startsidan saknar H1-rubrik**
- Forsta synliga heading ar H2: "Valkommen till AB Ilmonte"
- Google foredrar en tydlig H1 som matchar sidans primara sokutrymme
- **Atgard:** Andra H2 till H1, eller lagg till en dold H1 med primara nyckelord

#### HOGT

**4. Forfattare visar "Effektify" i metadata**
- Twitter/OG-metadata och schema visar "Skriven av: Effektify" (tidigare SEO-byra)
- Signalerar att sajten inte underhalls aktivt av agaren
- **Atgard:** Andra forfattare i Rank Math -> Installningar -> Authors, alternativt uppdatera WordPress-anvandarprofilen

**5. Article-schema pa startsidan**
- Startsidan anvander Article-schema istallet for Organization/LocalBusiness
- Felaktig schema-typ forvirrar Google om sidans syfte
- **Atgard:** Byt till WebSite + Organization-schema for startsidan via Rank Math -> Schema

**6. Vimeo-videobakgrund pa startsidan**
- Progressiv redirect-video laddas direkt fran Vimeo
- Paverkar Largest Contentful Paint (LCP) och sidladdningstid
- **Atgard:** Konvertera till poster-image med lazy-load eller anvand YouTube med facade-pattern

#### MEDEL

**7. Bildoptimering bristfallig**
- 28 av 81 bilder pa startsidan saknar alt-text
- 5 av 7 bilder pa Om oss saknar alt-text
- 6 av 8 bilder pa Kontakt saknar alt-text
- Bilder serveras utan tydlig lazy-loading utover Flatsome-inbyggd
- **Atgard:** Systematisk alt-text-granskning med ABC-nyckelord som grund, aktivera WebP-konvertering

**8. Breadcrumbs ej aktiverade**
- Rank Math har breadcrumb-stod men det ar inte aktiverat
- Breadcrumbs forstarker hierarkin for Google och forbattrar UX
- **Atgard:** Aktivera Rank Math breadcrumbs + lagg till BreadcrumbList-schema

**9. Kontaktsidans meta description har skrivfel**
- Nuvarande: "Om du har har generella fragor..." (dubblerat "har har")
- **Atgard:** Skriv om till nyckelordsoptimerad meta description

---

## 2. On-Page SEO (35/100)

### 2.1 Sidoversikt — Meta-data

| Sida | Title | Meta Description | H1 | Bedomning |
|------|-------|-----------------|-----|-----------|
| `/` (Hem) | "Scenpodier, dansmattor, scentextil - ilmonte.se" | Finns (kort) | SAKNAS (H2 istallet) | Mangelfull |
| `/om-oss/` | "Om oss - ilmonte.se" | SAKNAS | Ej kontrollerad | Kritiskt |
| `/kontakt/` | "Kontakt - ilmonte.se" | Skrivfel ("har har") | Ej kontrollerad | Kritiskt |
| `/kopvillkor/` | Generiskt | Ej kontrollerad | Ej kontrollerad | Lag prio |
| `/ilmofurniture/` | Ej kontrollerad | Ej kontrollerad | Ej kontrollerad | Bor optimeras |

### 2.2 Produktkategorisidor — Det storsta problemet

ilmonte.se har **9 huvudkategorier** med totalt **~50 underkategorier** i navigationen. De flesta kategorisidor saknar:

- **SEO-beskrivningstext** — inga informativa textstycken som forklarar kategorin
- **Optimerade titles** — generiska WooCommerce-titlar
- **Intern lankning** — kategorier lankar inte till relaterade kategorier

**Undantag:** Podier-kategorin har en kort beskrivningstext om ilmontepodier, men den ar inte nyckelordsoptimerad.

### 2.3 Produktsidor

Med **630+ produkter** fordelat pa 4 sitemaps har ilmonte.se en massiv produktkatalog. Problem:

| Problem | Omfattning | Paverkan |
|---------|------------|----------|
| Tunna produktbeskrivningar | Uppskattat 70-80% | Hog — Google rankar inte tunna sidor |
| Saknar produktspecifik schema | Uppskattat 50%+ | Medel — missar rich snippets i sok |
| Foraldrade produkter (2014-2022 utan uppdatering) | ~220 produkter | Hog — signalerar inaktiv sajt |
| Bilder utan alt-text | Uppskattat 30-40% | Medel — missar bildsok-trafik |

### 2.4 ABC-nyckelord — Nuvarande status

ilmonte.se har **30 ABC-nyckelord** inlagda i Searchboost-systemet:
- **9 st A-nyckelord** (hog prioritet, hogst solvarde)
- **14 st B-nyckelord** (medelhog prioritet)
- **7 st C-nyckelord** (long-tail, lagre volym)

Baserat pa verksamheten ar de troliga A-nyckelorden:
- Scenpodier / scenpodium
- Dansmattor / dansmatta
- Scentextil / scentyg
- Teaterutrustning
- Laktare
- Ridakenor / scendraperi
- Teatermobler / biostoler
- Scenbelysning / scenutrustning
- Eventmobler

**Problem:** Dessa nyckelord ar inte systematiskt kopplade till specifika landningssidor. Det saknas en tydlig "ett nyckelord = en sida"-strategi.

---

## 3. Innehall & Content (25/100)

### 3.1 Nuvarande innehallssituation

| Innehallstyp | Antal | Kommentar |
|-------------|-------|-----------|
| Statiska sidor | 13 | Inklusive varukorg, kassa, mitt-konto (slasksidor) |
| Produkter | 630+ | Manga foraldrade, tunna beskrivningar |
| Bloggposter | 1 | "Mogaskolan i Svenljunga — Audyt IV horsalsstol" |
| Referensprojekt | ~20-30 | Finns som produkter under "Referenser" |
| Guider/FAQ | 0 | Ingen informativ content |
| Branschartiklar | 0 | Ingen thought leadership |

### 3.2 Innehallsgap — Saknade sidor som borde finnas

**Hog prioritet (kopplade till A-nyckelord):**
1. **Kopguide: Scenpodier** — "Hur valjer man ratt scenpodium?" (1500-2000 ord)
2. **Kopguide: Dansmattor** — "Komplett guide till dansmattor for teater och dans" (1500-2000 ord)
3. **Kopguide: Scentextil** — "Valj ratt scentyg: sammet, molton, blackout" (1500-2000 ord)
4. **FAQ-sida** — 20-30 vanliga fragor om scenutrustning, material, brandklassning
5. **Referensprojekt-samlingssida** — Bor vara en separat sida, inte produktkategori

**Medelhog prioritet (kopplade till B-nyckelord):**
6. **Kopguide: Ridakenor** — Skillnader mellan skentyper, offentlig miljo vs scen
7. **Kopguide: Laktare** — Fasta vs mobila, inomhus vs utomhus
8. **Kopguide: Teater- och biomobler** — Materialval, ergonomi, brandklass
9. **Branschsida: Akustiklosningar** — Akustiktyg, absorbenter, installationsguide
10. **Branschsida: Sceneffekter** — Crashglas, spegelfolie, snoeffekter

**Long-tail (kopplade till C-nyckelord):**
11. **Artikel: Brandklassning av textil** — Svensk lag, euroklass, testmetoder
12. **Artikel: Scenbelysning och tyg** — Hur material paverkar ljussattning
13. **Artikel: Underhall av scenpodier** — Tips for langre livslangd

### 3.3 Referensprojekt — Oanvand guldgruva

ilmonte.se har **20-30 referensprojekt** listade som produkter (ex: Mogaskolan, kulturhus, teatrar). Dessa ar extremt vardefulle for SEO men ligger begravda i produktkatalogen.

**Rekommendation:** Skapa en dedikerad referenssida med:
- Projektbeskrivning (200-400 ord per projekt)
- Bilder fore/efter
- Anvanda produkter med lankar
- Kundcitat/testimonials
- Intern lankning till relevanta produktkategorier

---

## 4. Lankar & Auktoritet (40/100)

### 4.1 Intern lankning

| Problem | Beskrivning |
|---------|-------------|
| Platt hierarki | Produkter lankar inte till relaterade produkter |
| Saknar cross-selling | WooCommerce-relaterade produkter ej konfigurerat |
| Inga innehallskluster | Ingen blogg/guide-struktur som lankar till produkter |
| Referensprojekt isolerade | Referenscase lankar inte tillbaka till produktkategorier |

### 4.2 Extern lankning (uppskattning)

Utan GSC-access ar en exakt backlink-analys inte mojlig, men baserat pa domanaldern (registrerad sedan tidigt 2000-tal) och branschpositionen har ilmonte.se troligen:
- Moderat Domain Authority (DA 20-35)
- Framst lankar fran branschkataloger och leverantorslistor
- Fa redaktionella/content-lankar
- Potential for PR-lankar genom referensprojekt (teater, kulturhus, arenor)

### 4.3 Mojligheter for lankbygge

1. **Kulturhus och teatrar** — be om lank fran installationer/referensprojekt
2. **Branschorganisationer** — Svensk Scenkonst, Riksteatern, Sveriges Teatrar
3. **Utbildningsinstitutioner** — Scenografutbildningar, teaterutbildningar
4. **Leverantorslistor** — Eventbranschen.se, Scenservice-kataloger
5. **PR-artiklar** — Ny scen invigd, renovering av kulturhus, etc.

---

## 5. Lokal SEO (50/100)

### 5.1 Nuvarande status

| Element | Status |
|---------|--------|
| Google Business Profile | Ej verifierad (behover kontrollas) |
| Rank Math Local | Installerat |
| locations.kml | Finns i sitemap |
| NAP-konsekvens | Bra — adress, telefon, orgnr pa kontaktsidan |
| Lokala landsidor | Saknas |

### 5.2 Rekommendationer

- Verifiera Google Business Profile (om ej gjort)
- Lagg till foretaget pa Eniro, Hitta.se, Allabolag
- Skapa en "Var kunderna finns"-sida med karta over installationer i Sverige
- Optimera kontaktsidan med LocalBusiness-schema

---

## 6. Anvandbarhet & UX (55/100)

### 6.1 Styrkor
- Ren design med Flatsome-temat
- Tydlig produktkategorisering i navigationen
- Kontaktinformation lattillganglig
- Responsiv design (mobil-anpassad)

### 6.2 Svagheter
- Startsidans video kan gora sidan sag pa mobil
- Produktnavigering med 50+ underkategorier kan overvaldiga
- Ingen synlig sik-funktion pa produktsidor
- Saknar socialt bevis (kundrecensioner, testimonials, case studies framme)
- Ingen tydlig CTA (Call-to-Action) pa startsidan

---

## 7. Konkurrenslandskap

### 7.1 Direkta konkurrenter

| Konkurrent | Sajt | Styrkor | Svagheter |
|------------|------|---------|-----------|
| Draperi.se | draperi.se | Specialiserade pa textil, bra content | Smalare sortiment |
| Scenbutiken.se | scenbutiken.se | E-handel med priser synliga | Mindre etablerat varumarke |
| Akademi Ljud & Ljus | akademi.se | Bred event-leverantor, stark online | Fokus ljud/ljus, inte scenmobilier |
| Nordisk Scenservice | nordiskscenservice.se | Installationer + service | Begransad webbnarvaro |

### 7.2 ilmontes position

ilmonte.se har en unik position som **Sveriges mest kompletta leverantor av scenproduktion**:
- Bredaste sortimentet (podier + textil + stoler + ridakenor + farg + effekter)
- 40+ ars erfarenhet
- Del av A.S.O-gruppen (trovarighet)
- Eget varumarke: "ilmontepodier"

**Problem:** Denna position kommuniceras inte via soken. Det saknas innehall som visar dominansen.

---

## 8. Prioriterad atgardslista

### Omedelbart (Vecka 1-2)
1. Ta bort MonsterInsights-pluginet
2. Noindex pa varukorg/kassa/mitt-konto
3. Fixa H1 pa startsidan
4. Skriv meta descriptions for Om oss och Kontakt (fixa "har har")
5. Byt forfattare fran "Effektify" till "AB Ilmonte"
6. Fixa Article-schema till Organization/WebSite pa startsidan
7. Aktivera breadcrumbs i Rank Math

### Kort sikt (Manad 1)
8. Skriv SEO-texter for alla 9 huvudkategorier (200-400 ord vardera)
9. Optimera titles for alla huvudkategorier med A/B-nyckelord
10. Borja alt-text-granskning (startsidan + kontakt + om oss forst)
11. Skapa FAQ-sida med 20 vanliga fragor

### Medellang sikt (Manad 2-3)
12. Publicera 3 kopguider (podier, dansmattor, scentextil)
13. Skapa referensprojekt-samlingssida
14. Borja regelbunden bloggning (2 artiklar/manad)
15. Intern lankningsaudit — koppla ihop innehall med produkter
16. Lankbygge mot kulturhus och branschorganisationer

---

## 9. ROI-uppskattning

### Nuvarande (uppskattat)
- Organisk trafik: ~200-400 besok/manad (B2B-nisch)
- Synlighet pa A-nyckelord: Lag (position 20-50+ pa de flesta)
- Konkurrens: Lag-medel (nischad B2B-marknad)

### Potential efter 6 manaders SEO-arbete
- Organisk trafik: ~800-1500 besok/manad (+200-375%)
- Forstasidesrankningar pa 5-7 A-nyckelord
- Top-3 pa 3-4 B-nyckelord
- ~10-15 forfragninar/manad fran organisk sok (B2B, hogt varde per lead)

### Vad ar en lead vard for ilmonte?
- Genomsnittlig ordervarde B2B: 20 000-200 000 kr
- 10 extra leads/manad = potentiellt 200 000-2 000 000 kr/manad i extra forsaljning
- SEO-investering betalar sig inom 2-3 manader

---

## 10. Teknisk data

### Plugin-inventering
| Plugin | Version | Status |
|--------|---------|--------|
| Rank Math PRO | Senaste | Aktivt, grundkonfigurerat |
| WooCommerce | 10.0.4 | Aktivt |
| Contact Form 7 | 6.1.1 | Aktivt |
| MonsterInsights | 9.6.1 | **AVINSTALLERA** |
| GTM4WP | Senaste | Aktivt |
| WooCommerce GA | Senaste | Aktivt |
| WPC Grouped Product Premium | 5.2.1 | Aktivt |
| WooSmart Quick View | 4.2.1 | Aktivt |
| CookieYes | Senaste | Aktivt |

### Sidstruktur
| Innehallstyp | Antal |
|--------------|-------|
| Statiska sidor (page-sitemap) | 13 |
| Produkter (product-sitemap 1-4) | ~630 |
| Bloggposter (post-sitemap) | 1 |
| Blocks (blocks-sitemap) | Okant antal |
| Lokalt (local-sitemap) | 1+ |

### Kontaktpersoner
| Namn | Roll | E-post |
|------|------|--------|
| Peter Vikstrom | VD, Forsaljning/Teknik | peter.vikstrom@ilmonte.se |
| Hakan Berg | Forsaljningschef, Stoler | hakan.berg@ilmonte.se |
| Dajana Tolic | Driftchef | dajana.tolic@ilmonte.se |
| Sanna Tolic | Textil/Somi/Forsaljning | sanna.tolic@ilmonte.se |
| Henrik Gustafsson | Forsaljning/Teknik | henrik.gustafsson@ilmonte.se |
| Mia Wikstrom | Ekonomichef | mia.wikstrom@ilmonte.se |

---

*Rapport genererad av Searchboost.se — Sveriges SEO-partner for B2B-foretag.*
*Kontakt: Mikael Larsson, mikael@searchboost.se*
