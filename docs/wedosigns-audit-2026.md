# SEO-Audit: Wedo Signs (wedosigns.se)

> Utford: 2026-02-16
> Status: Sajten visar "Kommer strax" (Coming Soon-plugin) -- men bakom finns 23 publicerade sidor med innehall
> Kontakt: Danni Andersen, +46 793020787, info@wedosigns.se
> Adress: Datavagen 14B, 436 32 Askim (Goteborg)

---

## 1. Teknisk SEO

### 1.1 Serverinfrastruktur
| Parameter | Varde | Status |
|-----------|-------|--------|
| CMS | WordPress 6.9.1 | OK |
| Server | Apache | OK |
| PHP-version | 7.4.33 | KRITISK -- EOL sedan nov 2022, sakerhetsrisk + prestandaproblem |
| SSL | Let's Encrypt, TLSv1.3, giltig till 2026-04-29 | OK |
| HTTPS-redirect | HTTP 301 -> HTTPS | OK |
| Hosting | Troligen delat webbhotell (baserat pa Apache/PHP-setup) | OK |

### 1.2 Coming Soon-plugin
- **Plugin**: `coming-soon-page` (WordPress)
- **Problem**: Hela sajten blockeras av en Coming Soon-sida som visar minimal information
- **Paverkan**: Google kan INTE indexera nagra av de 23 sidorna som finns bakom login
- **robots meta**: `<meta name="robots" content="index, follow" />` -- satter "index, follow" pa Coming Soon-sidan, men inga riktiga sidor ar tillgangliga
- **Prioritet**: KRITISK -- maste inaktiveras sa fort sajten ar klar

### 1.3 SEO-plugins
| Plugin | Status |
|--------|--------|
| Yoast SEO | Installerad, aktiv (genererar sitemap + schema) |
| Jetpack | Installerad (kan ses i wp-json namespaces) |
| WooCommerce | Installerad (wp-json visar wc/v3 namespace) -- troligen ej aktivt anvand |
| Trustindex (Google Reviews) | Installerad, widget pa startsidan |
| WebP Converter | Installerad |
| Jetpack Boost | Installerad |

### 1.4 Sitemap
- **Sitemap-index**: `https://wedosigns.se/sitemap.xml` (Yoast-genererad)
- **page-sitemap.xml**: 23 URL:er (alla tjanstsidor, om oss, kontakt, galleri etc.)
- **post-sitemap.xml**: 1 URL ("Hello World" fran 2020 -- bor tas bort)
- **category-sitemap.xml**: 1 URL ("Uncategorized" -- bor tas bort)
- **Problem**: Sitemap-filerna genereras korrekt men sajten blockeras av Coming Soon = Google kan inte nyttja dem

### 1.5 Schema Markup (Yoast)
| Typ | Finns | Kommentar |
|-----|-------|-----------|
| WebPage | Ja | Pa alla sidor |
| BreadcrumbList | Ja | Pa alla sidor |
| WebSite | Ja | Pa startsidan |
| Organization | Ja | Pa startsidan |
| LocalBusiness | Nej | SAKNAS -- kritiskt for lokalt foretag i Goteborg |
| Service | Nej | SAKNAS -- bor finnas pa varje tjanstsida |
| FAQPage | Nej | SAKNAS -- mojlighet for rich snippets |

### 1.6 Sakerhetsheaders
| Header | Finns |
|--------|-------|
| Strict-Transport-Security (HSTS) | NEJ |
| X-Frame-Options | NEJ |
| X-Content-Type-Options | NEJ |
| Content-Security-Policy | NEJ |
| Referrer-Policy | NEJ |
| Permissions-Policy | JA (private-state-token) |

### 1.7 Ovrigt tekniskt
- **PHP 7.4**: Stor sakerhetsrisk. Maste uppgraderas till 8.1+ (helst 8.2/8.3)
- **Duplicate viewport meta tags**: Tva `<meta name="viewport">` taggar i Coming Soon-sidan
- **meta description**: Tom pa Coming Soon-sidan (`content=""`)
- **meta keywords**: Tom (`content=""`) -- foraldrad tagg, kan tas bort
- **OG locale**: Satt till `en_US` trots att sajten ar pa svenska -- bor vara `sv_SE`
- **Canonical**: Korrekt satt pa alla sidor via Yoast
- **"Hello World"-inlagg**: Standardinlagg fran WP-installation, publicerat 2020 -- bor raderas

---

## 2. On-Page SEO

### 2.1 Oversikt av alla sidor (23 st)

| Sida | Yoast Title | Yoast Description | Innehall |
|------|-------------|-------------------|----------|
| Startsidan (/) | Bildekor & skyltar i Goteborg \| Wedo Signs | Professionell bildekor, fordonsdekor och skyltar... | 24 980 tecken (Google Reviews-widget, hero) |
| Skyltar (/skyltar-goteborg/) | Skyltar i Goteborg -- Fasadskyltar, Ljusskyltar & Mer \| Wedo Signs | Skyltar i Goteborg for foretag och fastigheter... | 8 561 tecken |
| Bildekor (/bildekor-goteborg/) | Bildekor & Fordonsdekor i Goteborg \| Wedo Signs | Professionell bildekor och fordonsdekor... | 8 479 tecken |
| Foliedekor (/folie-dekor-goteborg/) | Folie & Dekor i Goteborg \| Wedo Signs | Folie och dekor i Goteborg for butik, kontor... | 9 189 tecken |
| Frost film (/frost-film-goteborg/) | Frost Film i Goteborg \| Wedo Signs | Frost film i Goteborg for kontor, butik... | 8 306 tecken |
| Ljusskyltar (/ljusskyltar-goteborg/) | Ljusskyltar i Goteborg \| Wedo Signs | Ljusskyltar i Goteborg for butik, restaurang... | 8 598 tecken |
| Print (/print-goteborg/) | Print i Goteborg -- Storformat & Digitaltryck \| Wedo Signs | Print i Goteborg for foretag och event... | 8 626 tecken |
| Solfilm (/solfilm-goteborg/) | Solfilm i Goteborg \| Wedo Signs | Solfilm i Goteborg for fastighet, kontor... | 9 082 tecken |
| Banderoller (/banderoller-goteborg/) | Banderoller i Goteborg -- Reklamvepor & Stora Tryck \| Wedo Signs | Banderoller i Goteborg for foretag, event... | 7 850 tecken |
| Banderoller 2 (/banderoller-goteborg-2/) | (troligen duplicate) | -- | -- |
| Event (/event-exponering-goteborg/) | Event & Exponering i Goteborg \| Wedo Signs | Event och exponering i Goteborg... | 8 902 tecken |
| Flaggskyltar (/flaggskylt-fasad-goteborg/) | Flaggskyltar i Goteborg \| Wedo Signs | Fasadmonterad flaggskylt i Goteborg... | 7 191 tecken |
| Namnskyltar (/namnskyltar-goteborg/) | Namnskyltar i Goteborg \| Wedo Signs | Namnskyltar i Goteborg for kontor, fastighet... | 7 650 tecken |
| Platskyltar (/platskyltar-goteborg/) | Platskyltar i Goteborg \| Wedo Signs | Platskyltar i Goteborg for fastighet, foretag... | 9 476 tecken |
| Golvdekor (/golvdekor-goteborg/) | Golvdekor i Goteborg \| Wedo Signs | Golvdekor i Goteborg for butik, kontor... | 8 581 tecken |
| Insynsskydd (/insynsskydd-goteborg/) | Insynsskydd i Goteborg \| Wedo Signs | Insynsskydd i Goteborg for kontor, butik... | 8 347 tecken |
| Klistermarken (/klistermarken-goteborg/) | Klistermarken i Goteborg \| Wedo Signs | Klistermarken i Goteborg for foretag... | 8 693 tecken |
| Produkter (/produkter/) | Produkter \| Skyltar & Bildekor i Goteborg \| Wedo Signs | Upptack vara produkter inom skyltar... | 9 107 tecken |
| Om Oss (/om-oss/) | Om Wedo Signs i Goteborg \| Skyltar & Bildekor | Lar kanna Wedo Signs i Goteborg... | 6 605 tecken |
| Kontakt (/kontakt/) | Kontakt - Wedo Signs | SAKNAS | 1 208 tecken |
| Hem (/hem/) | -- | -- | Troligen alternativ startsida |
| Galleri (/galleri/) | -- | -- | Bildgalleri |
| Tack-sida (/tack-for-din-forfragan/) | -- | -- | Tack-sida efter formularinskick |

### 2.2 Bedomning av on-page SEO

**Bra:**
- Varje tjanstsida har unik Yoast-title och meta description
- Titles ar optimerade med platsnamn "Goteborg" + tjanstnamn + "Wedo Signs"
- Descriptions ar 120-160 tecken, innehaller relevanta sokord
- Innehallet pa tjanstsidorna ar 7 000-9 500 tecken (bra langd, ca 800-1200 ord)
- Sidorna har H2/H3-struktur med relevanta underrubriker
- URL-slugs ar SEO-vanliga: `/skyltar-goteborg/`, `/bildekor-goteborg/` etc.
- Google Reviews-widget integrerad pa startsidan (socialt bevis)

**Problem:**
- **Kontakt-sidan saknar meta description** -- maste atgardas
- **Duplicate Banderoller-sida**: `/banderoller-goteborg/` och `/banderoller-goteborg-2/` -- en maste redirectas
- **"Hello World"-inlagg** fran 2020 -- default WP-post, maste raderas
- **"Uncategorized"-kategori** i sitemap -- bor rensas
- **OG locale ar `en_US`** -- bor vara `sv_SE` for svenska sajten
- **Inga interna lankar mellan tjanstsidorna** (svart att bedoma fullt utan att se rendered sida, men typiskt problem)
- **Inga alt-texter pa bilder** synliga i sitemap image tags (bilder har generiska filnamn)
- **Inget blogginnehall** -- bara "Hello World" fran 2020
- **Startsidans slug**: `/skyltar-foretagsskyltar-fasadskyltar-reklamskyltar` -- onodigt lang, men canonical pekar pa `/`

---

## 3. Innehallsanalys

### 3.1 Foretaget
Wedo Signs AB ar ett skyltforetag i Askim (Goteborg) grundat 2018 av Danni Andersen. Danni ar dansk med treaarig yrkesutbildning som skyltmakare ("skiltemaler") och bakgrund i grafisk design. Over 12 aars erfarenhet fran samma skyltforetag i Danmark.

### 3.2 Tjanster (baserat pa sidstruktur)
1. **Skyltar** (fasadskyltar, ljusskyltar, namnskyltar, platskyltar, flaggskyltar)
2. **Bildekor / Fordonsdekor** (firmabilar, flottor)
3. **Foliedekor** (fonster, fasader, inomhus)
4. **Frost film / Insynsskydd** (frostad fonsterfil for kontor/butik)
5. **Solfilm** (varme- och UV-skydd)
6. **Print / Storformat** (digitaltryck, banderoller, vepor)
7. **Klistermarken / Dekaler** (vinyl, profilering)
8. **Golvdekor** (halksakra golvdekaler)
9. **Event & Exponering** (massmaterial, kampanjgrafik)
10. **Banderoller** (reklam, bygg, event)

### 3.3 Styrkor i innehallet
- Varje tjanst har en dedikerad landningssida med Goteborg-fokus
- Bra anvandning av lokala sokord i titles och URLs
- Tydlig kontaktinfo (telefon, e-post, adress, oppettider)
- Google Reviews-widget ger socialt bevis
- "Om Oss"-sida med personlig historia och E-E-A-T-signaler

### 3.4 Svagheter i innehallet
- **Ingen blogg** -- inga informationsartiklar som kan driva organisk trafik
- **Saknar case studies / referensprojekt** med beskriven text (galleri finns men utan SEO-text)
- **Saknar FAQ-sektioner** pa tjanstsidorna
- **Saknar prisinformation** -- aven ungefirliga prisintervall hjalper for sokning
- **Saknar video** -- stark signal for Google
- **Saknar Google My Business-optimering** (kan ej verifiera fran crawl, men saknar GMB-lank pa sajten)

---

## 4. ABC-Nyckelord

### A-nyckelord (Hog prioritet -- karnverksamhet, hog kommersiell avsikt)

| Nyckelord | Uppskattad sokvolym/man | Nuvarande position |
|-----------|------------------------|--------------------|
| skyltar goteborg | 320 | okand |
| bildekor goteborg | 210 | okand |
| skyltforetag goteborg | 110 | okand |
| ljusskyltar goteborg | 90 | okand |
| fasadskyltar goteborg | 70 | okand |
| fordonsdekor goteborg | 50 | okand |
| skyltmakare goteborg | 90 | okand |
| foliedekor goteborg | 40 | okand |
| foliering bil goteborg | 60 | okand |
| reklamskyltar goteborg | 50 | okand |

### B-nyckelord (Medel prioritet -- stodande tjanster, lokala varianter)

| Nyckelord | Uppskattad sokvolym/man | Nuvarande position |
|-----------|------------------------|--------------------|
| banderoller goteborg | 50 | okand |
| fonsterfol goteborg | 40 | okand |
| solfilm goteborg | 70 | okand |
| insynsskydd fonster goteborg | 30 | okand |
| frost film goteborg | 30 | okand |
| klistermarken goteborg | 40 | okand |
| namnskyltar goteborg | 30 | okand |
| golvdekor goteborg | 20 | okand |
| massmaterial goteborg | 30 | okand |
| neonskyltar goteborg | 40 | okand |

### C-nyckelord (Lag prioritet -- long-tail, informationellt)

| Nyckelord | Uppskattad sokvolym/man | Nuvarande position |
|-----------|------------------------|--------------------|
| bildekor pris | 110 | okand |
| skyltar pris | 90 | okand |
| bildekor firmabil | 50 | okand |
| fasadskylt pris | 30 | okand |
| ljusskylt bestalla | 20 | okand |
| fordonsfoliering kostnad | 30 | okand |
| platskyltar goteborg | 20 | okand |
| flaggskylt fasad | 20 | okand |
| skylt belysning led | 30 | okand |
| dekaler foretag | 40 | okand |

---

## 5. Atgardsplan (3 manader)

### Manad 1: Grund och lansering

| # | Uppgift | Prioritet | Detaljer |
|---|---------|-----------|----------|
| 1 | Inaktivera Coming Soon-plugin | KRITISK | Sajten maste bli tillganglig for Google. Alla 23 sidor finns och har innehall. |
| 2 | Uppgradera PHP till 8.2+ | KRITISK | PHP 7.4 ar end-of-life. Paverkar sakerhet och prestanda. Kontakta hosting. |
| 3 | Fixa Kontakt-sidans meta description | HOG | Skriv unik meta description for kontaktsidan i Yoast. |
| 4 | Andra OG locale fran en_US till sv_SE | HOG | I Yoast SEO > Installningar > Webbplatsinfo. |
| 5 | Radera "Hello World"-inlagget | MEDEL | Ta bort standard-posten fran WP-installationen. |
| 6 | Radera/merge Banderoller-duplikat | HOG | Redirect /banderoller-goteborg/ till /banderoller-goteborg-2/ eller tvartom. |
| 7 | Rensa "Uncategorized"-kategori | LAG | Byt namn eller ta bort fran sitemap. |
| 8 | Skapa Google Business Profile | KRITISK | Verifiera adress Datavagen 14B, Askim. Lagg till alla tjanster, bilder, oppettider. |
| 9 | Skicka in sitemap till Google Search Console | KRITISK | Lagg till wedosigns.se i GSC (om ej gjort). Skicka sitemap.xml. |
| 10 | Implementera LocalBusiness schema | HOG | Lagg till LocalBusiness JSON-LD med adress, telefon, oppettider, omrade. |

### Manad 2: Innehall och optimering

| # | Uppgift | Prioritet | Detaljer |
|---|---------|-----------|----------|
| 1 | Lagg till Service-schema pa alla tjanstsidor | HOG | JSON-LD med serviceType, areaServed, provider. |
| 2 | Lagg till FAQ-sektioner pa 5 huvudsidor | HOG | Skyltar, Bildekor, Foliedekor, Solfilm, Ljusskyltar -- 3-5 fragor per sida med FAQPage schema. |
| 3 | Skriv 2 bloggartiklar | MEDEL | T.ex. "Guide: Valja ratt skyltar for ditt foretag" och "Bildekor -- sa fungerar det". |
| 4 | Optimera bildernas alt-texter | HOG | Alla produktbilder behover beskrivande alt-texter med nyckelord. |
| 5 | Skapa intern lankstruktur | HOG | Lank mellan relaterade tjanstsidor (t.ex. Skyltar -> Ljusskyltar, Bildekor -> Foliedekor). |
| 6 | Lagg till sakerhetsheaders | MEDEL | HSTS, X-Frame-Options, X-Content-Type-Options via .htaccess. |
| 7 | Optimera sidladdningstid | MEDEL | Kontrollera bildstorlekar, aktivera caching, minimera CSS/JS. Jetpack Boost hjalper. |
| 8 | Skapa referensprojekt-sida | MEDEL | 5-10 case studies med bild + text om utfort arbete. |

### Manad 3: Tillvaxt och lokal SEO

| # | Uppgift | Prioritet | Detaljer |
|---|---------|-----------|----------|
| 1 | Skriv 2 till bloggartiklar | MEDEL | T.ex. "Solfilm -- minska varme och spara energi" och "Forstaintrycket -- varfor fasadskyltar ar avgorrande". |
| 2 | Bygga lokala lankar | HOG | Registrera i Eniro, Hitta.se, Google Maps, branschkataloger, lokala foretagsnatverkn. |
| 3 | Lagg till prisindikationer | MEDEL | "Bildekor fran X kr" eller prisintervall pa tjanstsidorna -- driver "pris"-sokningar. |
| 4 | Implementera Google Analytics 4 + GTM | HOG | Sporning av kontaktformular, telefonklick, sidvisningar. |
| 5 | Skapa omradessidor | MEDEL | Molndal, Partille, Kungsbacka -- separata landningssidor for nargransande omraden. |
| 6 | Optimera Google Business Profile | MEDEL | Ladda upp nya bilder veckovis, svara pa recensioner, publicera inlagg. |
| 7 | Starta lankkampanj | LAG | Kontakta lokala foretag for omsesidiga lankar, sponsra lokala evenemang. |
| 8 | Utvardera och justera keywords | MEDEL | Analysera GSC-data efter 2 manaders indexering, justera strategi. |

---

## 6. Sammanfattning och prioritering

### Kritiska atgarder (gorra NU)
1. **Inaktivera Coming Soon-plugin** -- sajten ar redo, 23 sidor med bra innehall och Yoast-optimering finns
2. **Uppgradera PHP 7.4 -> 8.2+** -- sakerhets- och prestandarisk
3. **Skapa/verifiera Google Business Profile** -- avgorrande for lokala sokningar
4. **Skicka in sitemap till GSC** -- sa Google kan borja indexera

### Bedomning
Wedosigns.se har en **overraskande bra grund** for att inte vara lancerad:
- 17 tjanstsidor med unikt, valskrivet innehall (7-10k tecken per sida)
- Yoast SEO ar konfigurerat med unika titles och descriptions pa de flesta sidor
- URL-struktur ar SEO-vanlig med lokala sokord
- Grundlaggande schema markup (WebPage, Organization) ar pa plats
- Google Reviews-widget ger socialt bevis

**Storsta blockerare**: Coming Soon-pluginet -- nar det inaktiveras har sajten en solid bas att borja ranka fran. Forvantad tid till forstas resultaten i GSC: 4-8 veckor efter lansering.

### Potential
Med lokal SEO (GMB, kataloglankar) och innehallsexpansion (blogg, FAQ, case studies) bor wedosigns.se kunna ranka top 5 i Goteborg for huvudsokorden inom 6-12 manader. Konkurrensen inom "skyltar goteborg" och "bildekor goteborg" ar mattlig -- de flesta konkurrenter har svag SEO.
