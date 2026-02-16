# Kompetensutveckla.se -- Teknisk implementeringsguide Fas 2

## Amnesbaserad omstrukturering + kunskapshubbar

**Datum:** 2026-02-14
**Utarbetad av:** Searchboost.se (intern guide)
**For:** WordPress-utvecklare / tekniker som ska utfora arbetet
**Referensdokument:**
- `kompetensutveckla-strukturforslag.md` -- godkand struktur och kundpresentation
- `kompetensutveckla-seo-rapport-2026.md` -- SEO-analys, nyckelord och backlinkdata

---

## 1. Inledning

### Vad guiden tacker

Denna guide beskriver steg-for-steg hur man genomfor Fas 2 av SEO-arbetet for kompetensutveckla.se:

1. Satta upp staging-miljo
2. Lagga om kategoristrukturen fran formatbaserad till amnesbaserad
3. Skapa nya URL-monster
4. Bygga kunskapshubbar (checklistor, mallar, rutiner, AFS)
5. Integrera med EduAdmin-pluginet
6. Implementera 301-redirects
7. Lagga till format-filter (Webb/Lararledd/Fysisk) som taxonomi
8. QA och lansering

Guiden ar intern for Searchboost och ska kunna foljas av en WordPress-utvecklare utan ytterligare forklaringar.

### Forutsattningar

Innan arbetet paborjas maste foljande vara pa plats:

| Krav | Status | Ansvarig |
|------|--------|----------|
| EduAdmin API-nyckel | Kravs fran kunden | Mikael |
| WordPress admin-inlogg | mikael@kompetensutveckla.se / cPanel | Mikael |
| cPanel-access (Oderland/Hjaltebyran) | kompetens @ hjaltebyran-srv01.oderland.com | Mikael |
| Rank Math SEO PRO (eller gratisversion) | Installerat pa sajten | Utvecklare |
| SSH/SFTP-access till staging | Skapas i steg 2 | Utvecklare |
| Backup av live-sajten | Tas innan start | Utvecklare |

### Teknisk miljo

- **CMS:** WordPress (version 6.9+)
- **Sidbyggare:** Beaver Builder
- **Kurshantering:** EduAdmin-plugin (MultiNet Interactive AB)
- **SEO-plugin:** Rank Math SEO
- **Hosting:** Hjaltebyran AB (Oderland), cPanel, PHP 8.1+
- **Server:** hjaltebyran-srv01.oderland.com
- **cPanel-anvandare:** kompetens

---

## 2. Steg-for-steg: Staging-setup

### 2.1 Skapa subdomain i cPanel

1. Logga in pa cPanel: https://hjaltebyran-srv01.oderland.com:2083
   - Anvandare: `kompetens`
   - Losenord: se CLAUDE.md / Memory
2. Ga till **Domains** (eller **Subdomains** beroende pa cPanel-version)
3. Lagg till subdomain: `staging.kompetensutveckla.se`
   - Document root: `/home/kompetens/public_html/staging`
4. Vanta pa DNS-propagering (vanligtvis 5-15 min pa Oderland)

### 2.2 Klona WordPress-installationen

**Alternativ A: Via cPanel Softaculous (rekommenderat)**

1. Ga till **Softaculous Apps Installer** i cPanel
2. Valj **WordPress** > **All Installations**
3. Klicka **Clone** pa live-installationen (kompetensutveckla.se)
4. Maldoman: `staging.kompetensutveckla.se`
5. Katalog: `/home/kompetens/public_html/staging`
6. Klicka **Clone Installation**

**Alternativ B: Manuellt (om Softaculous ej finns)**

```bash
# SSH till servern
ssh kompetens@hjaltebyran-srv01.oderland.com

# Skapa staging-katalog
mkdir -p /home/kompetens/public_html/staging

# Kopiera alla filer
cp -R /home/kompetens/public_html/* /home/kompetens/public_html/staging/

# Exportera databasen
mysqldump -u kompetens -p live_db_name > /tmp/live-backup.sql

# Skapa ny databas via cPanel > MySQL Databases
# Namn: kompetens_staging
# Anvandare: kompetens_staging / genererat losenord

# Importera
mysql -u kompetens_staging -p kompetens_staging < /tmp/live-backup.sql

# Uppdatera wp-config.php
nano /home/kompetens/public_html/staging/wp-config.php
# Andra DB_NAME, DB_USER, DB_PASSWORD till staging-vardena
```

### 2.3 Uppdatera WordPress-URL:er i staging-databasen

```sql
-- Kor i phpMyAdmin eller via WP CLI
UPDATE wp_options SET option_value = 'https://staging.kompetensutveckla.se'
WHERE option_name IN ('siteurl', 'home');
```

Alternativt med WP CLI:

```bash
cd /home/kompetens/public_html/staging
wp search-replace 'https://kompetensutveckla.se' 'https://staging.kompetensutveckla.se' --all-tables
```

### 2.4 Forhindra indexering av staging

Lagg till i staging-sajtens `wp-config.php` eller via WP-admin > Settings > Reading:

```php
// wp-config.php
define('DISALLOW_FILE_EDIT', true);
```

I staging-sajtens `.htaccess`, lagg till langst upp:

```apache
# Blockera sokmotor-crawling pa staging
Header set X-Robots-Tag "noindex, nofollow"
```

Eller via Rank Math: SEO Settings > General > Noindex This Site.

### 2.5 Verifiera staging

- [ ] staging.kompetensutveckla.se laddar korrekt
- [ ] Inloggning fungerar
- [ ] Alla sidor visas
- [ ] EduAdmin-pluginet ar aktivt
- [ ] Rank Math ar aktivt

---

## 3. Kategoristruktur-omlaggning

### 3.1 Nuvarande kategoristruktur (problem)

Sajten anvander idag leveransformat som kategorier:

```
/webbutbildningar/
/fysiska-utbildningar/
/lararledda-webbutbildningar/
/bam-utbildning/            (egen toppkategori)
/utbildning-bas-p-och-bas-u/ (egen toppkategori)
/skyddsombudsutbildning/     (egen toppkategori)
/sam-utbildning/             (egen toppkategori)
/ledarskapsutbildningar/     (egen toppkategori)
/krisutbildningar/           (egen toppkategori)
/engelska-utbildningar/      (egen toppkategori)
/vara-tjanster/arbetsmiljoarbete/kunskapsbanken/  (120+ artiklar)
/vara-tjanster/arbetsmiljoarbete/afs/             (AFS-foreskrifter)
/vara-tjanster/arbetsmiljoarbete/rutiner/         (70+ dokument)
```

### 3.2 Ny kategoristruktur (amnesbaserad)

Skapa foljande WordPress-kategorier. Anvand WP CLI eller WP Admin > Posts > Categories.

**WP CLI-kommandon (kor pa staging):**

```bash
cd /home/kompetens/public_html/staging

# Toppkategori
wp term create category "Utbildningar" --slug=utbildningar

# Amneskategorier under Utbildningar
wp term create category "Arbetsmiljo" --slug=arbetsmiljo --parent=$(wp term get category utbildningar --field=term_id)
wp term create category "Sakerhet" --slug=sakerhet --parent=$(wp term get category utbildningar --field=term_id)
wp term create category "Elsakerhet" --slug=elsakerhet --parent=$(wp term get category utbildningar --field=term_id)
wp term create category "Vag och transport" --slug=vag-och-transport --parent=$(wp term get category utbildningar --field=term_id)
wp term create category "Ledarskap" --slug=ledarskap --parent=$(wp term get category utbildningar --field=term_id)
wp term create category "Bygg och anlaggning" --slug=bygg-och-anlaggning --parent=$(wp term get category utbildningar --field=term_id)
wp term create category "Kris och beredskap" --slug=kris-och-beredskap --parent=$(wp term get category utbildningar --field=term_id)

# Kunskapsbank toppkategori
wp term create category "Kunskapsbank" --slug=kunskapsbank

# Underkategorier Kunskapsbank
wp term create category "Checklistor" --slug=checklistor --parent=$(wp term get category kunskapsbank --field=term_id)
wp term create category "Mallar" --slug=mallar --parent=$(wp term get category kunskapsbank --field=term_id)
wp term create category "Rutiner" --slug=rutiner --parent=$(wp term get category kunskapsbank --field=term_id)
wp term create category "Artiklar" --slug=artiklar --parent=$(wp term get category kunskapsbank --field=term_id)
wp term create category "Lagar och regler" --slug=lagar-och-regler --parent=$(wp term get category kunskapsbank --field=term_id)
wp term create category "AFS Foreskrifter" --slug=afs-foreskrifter --parent=$(wp term get category kunskapsbank --field=term_id)
```

### 3.3 Mappning: Nuvarande kategorier till nya

| Nuvarande kategori/URL | Ny kategori | Ny foralder |
|------------------------|-------------|-------------|
| /webbutbildningar/webbutbildningar-arbetsmiljo/ | Arbetsmiljo | Utbildningar |
| /fysiska-utbildningar/fysiska-arbetsmiljoutbildningar/ | Arbetsmiljo | Utbildningar |
| /bam-utbildning/ | Arbetsmiljo | Utbildningar |
| /sam-utbildning/ | Arbetsmiljo | Utbildningar |
| /skyddsombudsutbildning/ | Arbetsmiljo | Utbildningar |
| /webbutbildningar/webbutbildningar-sakerhet/ | Sakerhet | Utbildningar |
| /webbutbildningar/webbutbildningar-elsakerhet/ | Elsakerhet | Utbildningar |
| /webbutbildningar/webbutbildningar-vag-och-transport/ | Vag och transport | Utbildningar |
| /fysiska-utbildningar/utbildningar-for-tekniska-anordningar/ | Sakerhet | Utbildningar |
| /webbutbildningar/webbutbildningar-ledarskap/ | Ledarskap | Utbildningar |
| /fysiska-utbildningar/fysiska-ledarskapsutbildningar/ | Ledarskap | Utbildningar |
| /lararledda-webbutbildningar/ledarskapsutbildning-distans/ | Ledarskap | Utbildningar |
| /ledarskapsutbildningar/ | Ledarskap | Utbildningar |
| /utbildning-bas-p-och-bas-u/ | Bygg och anlaggning | Utbildningar |
| /krisutbildningar/ | Kris och beredskap | Utbildningar |
| /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ | Artiklar | Kunskapsbank |
| /vara-tjanster/arbetsmiljoarbete/afs/ | AFS Foreskrifter | Kunskapsbank |
| /vara-tjanster/arbetsmiljoarbete/rutiner/ | Rutiner / Mallar / Checklistor | Kunskapsbank |

### 3.4 Flytta posts mellan kategorier (SQL)

Forst: identifiera term_id for gamla och nya kategorier:

```sql
-- Hitta nuvarande kategori-IDn
SELECT t.term_id, t.name, t.slug, tt.count
FROM wp_terms t
JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
WHERE tt.taxonomy = 'category'
ORDER BY t.name;
```

Flytta alla posts fran gammal kategori till ny:

```sql
-- Exempel: Flytta posts fran "webbutbildningar-arbetsmiljo" (term_id X) till "arbetsmiljo" (term_id Y)
-- Steg 1: Lagg till ny kategori pa alla posts som har den gamla
INSERT INTO wp_term_relationships (object_id, term_taxonomy_id)
SELECT tr.object_id, NEW_TERM_TAXONOMY_ID
FROM wp_term_relationships tr
WHERE tr.term_taxonomy_id = OLD_TERM_TAXONOMY_ID
AND tr.object_id NOT IN (
    SELECT object_id FROM wp_term_relationships WHERE term_taxonomy_id = NEW_TERM_TAXONOMY_ID
);

-- Steg 2: Ta bort gamla kategorikopplingen
DELETE FROM wp_term_relationships
WHERE term_taxonomy_id = OLD_TERM_TAXONOMY_ID;

-- Steg 3: Uppdatera raknare
UPDATE wp_term_taxonomy SET count = (
    SELECT COUNT(*) FROM wp_term_relationships WHERE term_taxonomy_id = NEW_TERM_TAXONOMY_ID
) WHERE term_taxonomy_id = NEW_TERM_TAXONOMY_ID;
```

Alternativt med WP CLI (sakrare):

```bash
# Lista alla posts i en kategori
wp post list --category=webbutbildningar-arbetsmiljo --format=ids

# Flytta varje post
wp post term set POST_ID category arbetsmiljo --by=slug
wp post term remove POST_ID category webbutbildningar-arbetsmiljo --by=slug
```

### 3.5 Slug-konventioner

| Typ | Monster | Exempel |
|-----|---------|---------|
| Amneskategori | Kortast mojliga, bindestreck | `arbetsmiljo`, `ledarskap` |
| Utbildningssida | `{amnets-slug}-{kurs}` | `bam-utbildning`, `sam-utbildning` |
| Kunskapsbankartikel | Beskrivande, max 4 ord | `riskbedomning-mall`, `skyddsrond-checklista` |
| Stadssida | `{kurs}-{stad}` | `bam-utbildning-stockholm` |

---

## 4. URL-struktur

### 4.1 Nya URL-monster

**Utbildningar:**
```
/utbildningar/                              -- Landningssida alla utbildningar
/utbildningar/{amne}/                       -- Amneskategori (t.ex. /utbildningar/arbetsmiljo/)
/utbildningar/{amne}/{kurs}/                -- Enskild kurs (t.ex. /utbildningar/arbetsmiljo/bam-utbildning/)
/utbildningar/{amne}/{kurs}/{stad}/         -- Stadssida (t.ex. /utbildningar/arbetsmiljo/bam-utbildning/stockholm/)
```

**Kunskapsbank:**
```
/kunskapsbank/                              -- Landningssida kunskapsbank
/kunskapsbank/{amne}/                       -- Amnesfilter (t.ex. /kunskapsbank/arbetsmiljo/)
/kunskapsbank/{typ}/                        -- Typfilter (t.ex. /kunskapsbank/checklistor/)
/kunskapsbank/{amne}/{artikel}/             -- Enskild artikel
```

### 4.2 WordPress permalink-installningar

Ga till **Settings > Permalinks** pa staging:

1. Valj **Custom Structure**: `/%category%/%postname%/`
2. Alternativt, om EduAdmin anvander custom post type: anvand `/%postname%/` och hantera strukturen via page hierarchy

### 4.3 Custom post type vs vanliga sidor/posts

**Rekommendation:** Anvand WordPress sidohierarki (pages) for den nya strukturen:

- `/utbildningar/` = WP Page (foraldasida)
- `/utbildningar/arbetsmiljo/` = WP Page (barnsida)
- `/utbildningar/arbetsmiljo/bam-utbildning/` = WP Page ELLER EduAdmin CPT

EduAdmin skapar egna post types for kurser. Kontrollera med:

```bash
wp post-type list
# Leta efter 'eduadmin_course' eller liknande
```

Om EduAdmin anvander CPT, registrera custom rewrite rules:

```php
// functions.php eller eget plugin
add_action('init', function() {
    // EduAdmin kurs-URL:er under /utbildningar/{amne}/
    add_rewrite_rule(
        '^utbildningar/([^/]+)/([^/]+)/?$',
        'index.php?post_type=eduadmin_course&name=$matches[2]',
        'top'
    );
});
```

### 4.4 Page hierarchy setup

Skapa foljande sidor i WordPress (Pages > Add New):

```
Utbildningar (slug: utbildningar)
  Arbetsmiljo (slug: arbetsmiljo, parent: Utbildningar)
  Sakerhet (slug: sakerhet, parent: Utbildningar)
  Elsakerhet (slug: elsakerhet, parent: Utbildningar)
  Vag och transport (slug: vag-och-transport, parent: Utbildningar)
  Ledarskap (slug: ledarskap, parent: Utbildningar)
  Bygg och anlaggning (slug: bygg-och-anlaggning, parent: Utbildningar)
  Kris och beredskap (slug: kris-och-beredskap, parent: Utbildningar)

Kunskapsbank (slug: kunskapsbank)
  Checklistor (slug: checklistor, parent: Kunskapsbank)
  Mallar (slug: mallar, parent: Kunskapsbank)
  Rutiner (slug: rutiner, parent: Kunskapsbank)
  Artiklar (slug: artiklar, parent: Kunskapsbank)
  Lagar och regler (slug: lagar-och-regler, parent: Kunskapsbank)
  AFS Foreskrifter (slug: afs-foreskrifter, parent: Kunskapsbank)
```

---

## 5. Kunskapshubbar

### 5.1 Syfte

Kunskapshubbar ar landningssidor som:
1. Rankar pa informationella sokord (t.ex. "riskbedomning mall", "arbetsmiljo checklista")
2. Erbjuder gratis nedladdning av PDF/checklista/mall
3. Lankar vidare till relevanta utbildningar (konvertering)
4. Bygger topical authority for Google

### 5.2 Landningssidor att skapa

| Landningssida | URL | Malsokord | Sidor/dokument som lankas |
|---------------|-----|-----------|--------------------------|
| Checklistor och mallar | /kunskapsbank/checklistor/ | riskbedomning mall (1500), arbetsmiljo checklista (1200), skyddsrond checklista (900), arbetsmiljopolicy mall (500) | 8 checklistor + 10 mallar |
| AFS Foreskrifter | /kunskapsbank/afs-foreskrifter/ | afs foreskrifter (800), afs arbetsmiljoverket (300) | 15+ AFS-sidor |
| Rutiner | /kunskapsbank/rutiner/ | arbetsmiljorutiner | 21 rutindokument |
| Artiklar | /kunskapsbank/artiklar/ | kompetensutveckling, friskfaktorer | 120+ artiklar |

### 5.3 Sidstruktur for varje hub-landningssida

Varje landningssida (t.ex. /kunskapsbank/checklistor/) ska innehalla:

1. **H1:** Tydlig rubrik med malsokord (t.ex. "Checklistor och mallar for arbetsmiljo")
2. **Intro-text:** 100-200 ord som forklarar vad sidan erbjuder
3. **Resurslista:** Alla checklistor/mallar/rutiner med:
   - Titel (lank till resursen eller direkt PDF-nedladdning)
   - Kort beskrivning (1-2 meningar)
   - Kategori-tagg (t.ex. "Riskbedomning", "Skyddsrond", "Brand")
4. **CTA-sektion:** Lank till relevanta utbildningar
   - "Vill du lara dig gora riskbedomningar professionellt? Boka SAM-utbildning"
5. **FAQ-sektion:** 3-5 vanliga fragor (for FAQPage schema)

### 5.4 Taxonomi-setup (amne + dokumenttyp)

Skapa tva custom taxonomier for att filtrera kunskapsbanken:

```php
// functions.php eller eget plugin: kunskapsbank-taxonomier.php

add_action('init', function() {
    // Amne-taxonomi
    register_taxonomy('kb_amne', 'post', [
        'label' => 'Amne',
        'rewrite' => ['slug' => 'kunskapsbank/amne'],
        'hierarchical' => true,
        'show_in_rest' => true,
    ]);

    // Dokumenttyp-taxonomi
    register_taxonomy('kb_dokumenttyp', 'post', [
        'label' => 'Dokumenttyp',
        'rewrite' => ['slug' => 'kunskapsbank/typ'],
        'hierarchical' => true,
        'show_in_rest' => true,
    ]);
});
```

**Amne-termer:** Arbetsmiljo, Sakerhet, Elsakerhet, Ledarskap, Brand, Ergonomi, Stress, Buller
**Dokumenttyp-termer:** Checklista, Mall, Rutin, Artikel, Policy, Skriftlig instruktion, AFS

### 5.5 Intern lankningsstrategi

Varje kunskapshub-sida ska lanka till:
- **Horisontellt:** Andra hubbar (Checklistor lankar till Rutiner, Rutiner lankar till AFS)
- **Vertikalt:** Artiklar inom samma amne
- **Konvertering:** Relevanta utbildningssidor

Exempel for /kunskapsbank/checklistor/:
```
Interna lankar:
  -> /kunskapsbank/rutiner/           (relaterad hub)
  -> /kunskapsbank/afs-foreskrifter/  (relaterad hub)
  -> /utbildningar/arbetsmiljo/sam-utbildning/  (konvertering)
  -> /utbildningar/arbetsmiljo/bam-utbildning/  (konvertering)
```

---

## 6. EduAdmin-integration

### 6.1 API-konfiguration

EduAdmin-pluginet for WordPress kommunicerar med EduAdmin API for att synka kurser, tillfallen och bokningar.

1. Installera/uppdatera EduAdmin-pluginet till senaste version
2. Ga till **EduAdmin > Settings** i WP Admin
3. Ange API-nyckel (fas fran kunden Mikael N)
4. Verifiera att kurser synkar korrekt:
   - WP Admin > EduAdmin > Courses — ska visa alla kurser
   - Kontrollera att kursernas kategorier ar synliga

### 6.2 Kategorimappning EduAdmin till WordPress

EduAdmin har ett eget kategorisystem. Detta maste mappas till de nya WordPress-kategorierna:

| EduAdmin-kategori | Ny WP-kategori |
|-------------------|----------------|
| Webbutbildningar Arbetsmiljo | Utbildningar > Arbetsmiljo |
| Fysiska Arbetsmiljoutbildningar | Utbildningar > Arbetsmiljo |
| BAM | Utbildningar > Arbetsmiljo |
| SAM | Utbildningar > Arbetsmiljo |
| Skyddsombud | Utbildningar > Arbetsmiljo |
| Sakerhet | Utbildningar > Sakerhet |
| Elsakerhet | Utbildningar > Elsakerhet |
| Vag och transport | Utbildningar > Vag och transport |
| Ledarskap | Utbildningar > Ledarskap |
| BAS P/U | Utbildningar > Bygg och anlaggning |
| Krisutbildningar | Utbildningar > Kris och beredskap |

Mappningen gors i EduAdmin-pluginets installningar under "Category mapping" eller via filter-hook:

```php
// functions.php
add_filter('eduadmin_course_category', function($wp_category, $eduadmin_category) {
    $mapping = [
        'Webbutbildningar Arbetsmiljo' => 'arbetsmiljo',
        'BAM'                          => 'arbetsmiljo',
        'SAM'                          => 'arbetsmiljo',
        'Sakerhet'                     => 'sakerhet',
        'Elsakerhet'                   => 'elsakerhet',
        'Vag och transport'            => 'vag-och-transport',
        'Ledarskap'                    => 'ledarskap',
        'BAS P/U'                      => 'bygg-och-anlaggning',
        'Krisutbildningar'             => 'kris-och-beredskap',
    ];
    return $mapping[$eduadmin_category] ?? $wp_category;
}, 10, 2);
```

### 6.3 Breadcrumb-setup med Rank Math

Rank Math genererar automatiska breadcrumbs. Konfigurera:

1. Ga till **Rank Math > General Settings > Breadcrumbs**
2. Aktivera breadcrumbs
3. Stall in:
   - Separator: `>`
   - Show Homepage: Ja
   - Homepage label: "Hem"
   - Show Post Title: Ja
4. For kurssidor: se till att breadcrumb visar ratt hierarki:
   ```
   Hem > Utbildningar > Arbetsmiljo > BAM Utbildning
   ```

Om breadcrumbs inte visar ratt foralder-kategori, anvand Rank Math filter:

```php
add_filter('rank_math/frontend/breadcrumb/items', function($crumbs, $class) {
    // Om vi ar pa en utbildningssida under /utbildningar/
    if (is_singular() && has_term('', 'category')) {
        // Tvinga ratt hierarki
        // Anpassa baserat pa faktisk sidstruktur
    }
    return $crumbs;
}, 10, 2);
```

Breadcrumb-schema (BreadcrumbList) genereras automatiskt av Rank Math.

---

## 7. 301-Redirects (Fas 2)

### 7.1 Strategi: .htaccess for monster-redirects + Rank Math for enstaka

Majoriteten av redirectsen foljer ett monster och kan hanteras med en .htaccess-regel. Enstaka avvikande URL:er hanteras via Rank Math Redirections.

### 7.2 .htaccess-regler (monster-baserade)

Lagg till i `/home/kompetens/public_html/staging/.htaccess` OVANFOR WordPress-reglerna:

```apache
# =============================================================
# Fas 2 Redirects -- amnesbaserad omstrukturering
# Searchboost.se 2026-02
# =============================================================

# --- Kunskapsbanken (121 URL:er) ---
# Gammal: /arbetsmiljoarbete/kunskapsbanken/{artikel}
# Ny:     /kunskapsbank/artiklar/{artikel}
RedirectMatch 301 ^/arbetsmiljoarbete/kunskapsbanken/(.*)$ /kunskapsbank/artiklar/$1

# Fallback for den langre URL:en med /vara-tjanster/
RedirectMatch 301 ^/vara-tjanster/arbetsmiljoarbete/kunskapsbanken/(.*)$ /kunskapsbank/artiklar/$1

# --- AFS-sidor (12 URL:er) ---
RedirectMatch 301 ^/arbetsmiljoarbete/afs/(.*)$ /kunskapsbank/afs-foreskrifter/$1
RedirectMatch 301 ^/vara-tjanster/arbetsmiljoarbete/afs/(.*)$ /kunskapsbank/afs-foreskrifter/$1

# --- Rutiner (4 URL:er) ---
RedirectMatch 301 ^/arbetsmiljoarbete/rutiner/(.*)$ /kunskapsbank/rutiner/$1
RedirectMatch 301 ^/vara-tjanster/arbetsmiljoarbete/rutiner/(.*)$ /kunskapsbank/rutiner/$1

# --- Webbutbildningar -> /utbildningar/{amne}/ ---
RedirectMatch 301 ^/webbutbildningar/webbutbildningar-arbetsmiljo/(.*)$ /utbildningar/arbetsmiljo/$1
RedirectMatch 301 ^/webbutbildningar/webbutbildningar-sakerhet/(.*)$ /utbildningar/sakerhet/$1
RedirectMatch 301 ^/webbutbildningar/webbutbildningar-elsakerhet/(.*)$ /utbildningar/elsakerhet/$1
RedirectMatch 301 ^/webbutbildningar/webbutbildningar-vag-och-transport/(.*)$ /utbildningar/vag-och-transport/$1
RedirectMatch 301 ^/webbutbildningar/webbutbildningar-ledarskap/(.*)$ /utbildningar/ledarskap/$1

# --- Fysiska utbildningar -> /utbildningar/{amne}/ ---
RedirectMatch 301 ^/fysiska-utbildningar/fysiska-arbetsmiljoutbildningar/(.*)$ /utbildningar/arbetsmiljo/$1
RedirectMatch 301 ^/fysiska-utbildningar/fysiska-ledarskapsutbildningar/(.*)$ /utbildningar/ledarskap/$1
RedirectMatch 301 ^/fysiska-utbildningar/utbildningar-for-tekniska-anordningar/(.*)$ /utbildningar/sakerhet/$1

# --- Lararledda webbutbildningar -> /utbildningar/{amne}/ ---
RedirectMatch 301 ^/lararledda-webbutbildningar/ledarskapsutbildning-distans/(.*)$ /utbildningar/ledarskap/$1
RedirectMatch 301 ^/lararledda-webbutbildningar/ekonomiutbildning-distans/(.*)$ /utbildningar/ledarskap/$1

# --- Enstaka toppkategorier -> /utbildningar/{amne}/ ---
Redirect 301 /bam-utbildning/ /utbildningar/arbetsmiljo/bam-utbildning/
Redirect 301 /sam-utbildning/ /utbildningar/arbetsmiljo/sam-utbildning/
Redirect 301 /skyddsombudsutbildning/ /utbildningar/arbetsmiljo/skyddsombudsutbildning/
Redirect 301 /ledarskapsutbildningar/ /utbildningar/ledarskap/
Redirect 301 /krisutbildningar/ /utbildningar/kris-och-beredskap/
Redirect 301 /engelska-utbildningar/ /utbildningar/ledarskap/engelska-utbildningar/

# --- BAS P/U (38+ stadssidor) ---
RedirectMatch 301 ^/utbildning-bas-p-och-bas-u/(.*)$ /utbildningar/bygg-och-anlaggning/$1

# --- BAM stadssidor ---
RedirectMatch 301 ^/bam-utbildning/bam-utbildning-(.*)$ /utbildningar/arbetsmiljo/bam-utbildning/$1

# --- Formatsidor (arkivsidor) -> /utbildningar/ ---
Redirect 301 /webbutbildningar/ /utbildningar/
Redirect 301 /fysiska-utbildningar/ /utbildningar/
Redirect 301 /lararledda-webbutbildningar/ /utbildningar/
```

### 7.3 Rank Math Redirections (enstaka URL:er)

For URL:er som inte matchar nagot monster, anvand Rank Math > Redirections:

1. Ga till **Rank Math > Redirections > Add New**
2. For varje avvikande URL:
   - Source URL: den gamla sidan
   - Destination URL: nya sidan
   - Redirect Type: 301 Permanent
3. Kurssidor som andrat slug:

| Gammal URL | Ny URL |
|-----------|--------|
| /kurser-2/bam-battre-arbetsmiljo-2-dagar/ | /utbildningar/arbetsmiljo/bam-utbildning/ |
| /kurser-2/sam-systematiskt-arbetsmiljoarbete/ | /utbildningar/arbetsmiljo/sam-utbildning/ |
| /kurser-2/arbete-pa-vag/ | /utbildningar/vag-och-transport/arbete-pa-vag/ |
| /kurser-2/ny-som-chef/ | /utbildningar/ledarskap/ny-som-chef/ |
| /kurser-2/esa-instruerad-person/ | /utbildningar/elsakerhet/esa-instruerad-person/ |

### 7.4 Testprocedur for redirects

Testa ALLA redirects pa staging innan go-live:

```bash
# Testa monster-redirects (bor ge 301 -> ny URL)
curl -sI https://staging.kompetensutveckla.se/arbetsmiljoarbete/kunskapsbanken/riskbedomning/ | grep -i "location\|http/"
# Forvanta: HTTP/1.1 301 Moved Permanently
# Location: /kunskapsbank/artiklar/riskbedomning/

# Testa enstaka redirects
curl -sI https://staging.kompetensutveckla.se/bam-utbildning/ | grep -i "location\|http/"
# Forvanta: HTTP/1.1 301
# Location: /utbildningar/arbetsmiljo/bam-utbildning/

# Bulk-test alla 142 URL:er
# Skapa en fil med alla gamla URL:er (en per rad)
while read url; do
    status=$(curl -sI "https://staging.kompetensutveckla.se${url}" -o /dev/null -w "%{http_code}")
    redirect=$(curl -sI "https://staging.kompetensutveckla.se${url}" | grep -i "location:" | awk '{print $2}')
    echo "${status} | ${url} -> ${redirect}"
done < gamla-urls.txt > redirect-testresultat.txt
```

Se till att:
- [ ] Alla 142 gamla URL:er ger 301 (inte 302, 404 eller 200)
- [ ] Inga redirect-loopar (A -> B -> A)
- [ ] Slutdestinationen ger 200 OK
- [ ] Inga kedjade redirects (A -> B -> C; max 1 hopp)

---

## 8. Format-filter

### 8.1 Leveransformat som taxonomi

Leveransformaten Webb, Lararledd och Fysisk ska INTE vara kategorier, utan en filtrerbar taxonomi:

```php
// functions.php eller eget plugin: utbildning-format-taxonomi.php

add_action('init', function() {
    register_taxonomy('utbildning_format', ['page', 'post', 'eduadmin_course'], [
        'label'        => 'Leveransformat',
        'labels'       => [
            'name'          => 'Leveransformat',
            'singular_name' => 'Format',
            'all_items'     => 'Alla format',
        ],
        'rewrite'      => ['slug' => 'format'],
        'hierarchical' => true,
        'show_in_rest' => true,
        'show_admin_column' => true,
    ]);

    // Forifyll med de tre formaten
    if (!term_exists('Webb', 'utbildning_format')) {
        wp_insert_term('Webb', 'utbildning_format', ['slug' => 'webb']);
    }
    if (!term_exists('Lararledd', 'utbildning_format')) {
        wp_insert_term('Lararledd', 'utbildning_format', ['slug' => lararledd']);
    }
    if (!term_exists('Fysisk', 'utbildning_format')) {
        wp_insert_term('Fysisk', 'utbildning_format', ['slug' => 'fysisk']);
    }
});
```

### 8.2 Tilldela format till utbildningar

Varje utbildningssida/kurs ska taggas med ett eller flera format:

```bash
# WP CLI
wp post term set POST_ID utbildning_format webb lararledd --by=slug
```

Exempel:
| Utbildning | Format |
|------------|--------|
| BAM Utbildning | Webb, Lararledd, Fysisk |
| SAM Utbildning | Webb, Lararledd |
| Arbete pa vag | Webb, Lararledd, Fysisk |
| ESA Instruerad person | Webb |
| Ny som chef | Webb, Lararledd |

### 8.3 Filter pa arkivsidor

Pa amneskategorisidorna (t.ex. /utbildningar/arbetsmiljo/) ska besokaren kunna filtrera pa format. Implementera med AJAX eller URL-parametrar:

```php
// I category template (archive-utbildningar.php eller liknande)

// Hamta alla format
$formats = get_terms(['taxonomy' => 'utbildning_format', 'hide_empty' => true]);

// Visa filter-knappar
echo '<div class="format-filter">';
echo '<a href="?" class="active">Alla</a>';
foreach ($formats as $format) {
    $active = (isset($_GET['format']) && $_GET['format'] === $format->slug) ? 'active' : '';
    echo '<a href="?format=' . $format->slug . '" class="' . $active . '">' . $format->name . '</a>';
}
echo '</div>';

// Modifiera query baserat pa filter
if (isset($_GET['format'])) {
    $args['tax_query'][] = [
        'taxonomy' => 'utbildning_format',
        'field'    => 'slug',
        'terms'    => sanitize_text_field($_GET['format']),
    ];
}
```

CSS for filter-knapparna:

```css
.format-filter {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
}
.format-filter a {
    padding: 8px 20px;
    border: 2px solid #0073aa;
    border-radius: 4px;
    text-decoration: none;
    color: #0073aa;
    font-weight: 600;
}
.format-filter a.active,
.format-filter a:hover {
    background: #0073aa;
    color: #fff;
}
```

---

## 9. QA-checklista

### 9.1 Pre-launch checklista (pa staging)

**Struktur och innehall:**
- [ ] Alla nya kategorisidor finns och visar ratt innehall
- [ ] /utbildningar/ landningssida visar alla amneskategorier
- [ ] /kunskapsbank/ landningssida visar alla hubbar
- [ ] Varje kunskapshub har intro-text, resurslista och CTA
- [ ] Breadcrumbs visar korrekt hierarki pa alla sidtyper
- [ ] Format-filter fungerar pa alla arkivsidor
- [ ] Inget innehall saknas efter flytten (jamfor antal sidor: staging vs live)

**301-Redirects:**
- [ ] Alla 142 trasiga URL:er ger 301
- [ ] Inga redirect-loopar
- [ ] Inga kedjade redirects (max 1 hopp)
- [ ] Slutdestinationen ger 200 OK
- [ ] BAM stadssidor redirectar korrekt (44 stader)
- [ ] BAS P/U stadssidor redirectar korrekt (38 stader)
- [ ] Kunskapsbanksartiklar (121 st) redirectar korrekt

**SEO:**
- [ ] Rank Math ar aktivt pa alla nya sidor
- [ ] Meta-titlar ar satta (CTR-optimerade) pa alla A-nyckelordssidor
- [ ] Meta-descriptions ar satta pa alla kurssidor
- [ ] Course schema markup pa minst 10 kurssidor
- [ ] FAQPage schema pa minst 5 sidor
- [ ] BreadcrumbList schema genereras automatiskt
- [ ] Canonical URL:er pekar pa ratt sidor (inga duplicat)
- [ ] XML-sitemap ar uppdaterad (Rank Math > Sitemap Settings)
- [ ] robots.txt blockerar inte nya URL:er

**EduAdmin:**
- [ ] Alla kurser synkar fran EduAdmin API
- [ ] Kurskategorier ar korrekt mappade till nya WP-kategorier
- [ ] Bokningsfunktionen fungerar pa alla kurssidor
- [ ] Kurstillfallen (datum, plats, pris) visas korrekt

**Tekniskt:**
- [ ] Inga brutna bilder
- [ ] Inga 404-sidor (kor Screaming Frog eller liknande)
- [ ] Sidladdningstid < 3 sekunder (LCP)
- [ ] Mobilvy fungerar korrekt
- [ ] SSL-certifikat fungerar pa staging

### 9.2 Post-launch verifiering (efter go-live)

**Dag 1:**
- [ ] Alla redirects fungerar pa produktionssajten
- [ ] Inga 404-fel i Google Search Console (Indexing > Pages)
- [ ] Sajten ar tillganglig pa alla URL-monster
- [ ] EduAdmin-bokning fungerar
- [ ] Google Search Console: Skicka in uppdaterad sitemap

**Dag 2-3:**
- [ ] Kontrollera GSC > URL Inspection for 10 viktiga sidor
- [ ] Kontrollera att gamla sidor inte langre indexeras (302 vs 301)
- [ ] Google Search Console: Kontrollera Coverage-rapporten
- [ ] Kontrollera att sidorna borjar dyka upp i nya URL:er i Google

**Vecka 1:**
- [ ] Inga nya 404-fel i GSC
- [ ] CTR borjar forandra sig (bevakningsmatt)
- [ ] Inga klagoma fran kunden om trasiga funktioner
- [ ] Redirects fortfarande aktiva (spot-check 10 st)

### 9.3 Google Search Console-hantering

1. **Skicka in ny sitemap:**
   - GSC > Sitemaps > Lagg till `https://kompetensutveckla.se/sitemap_index.xml`
   - Ta bort gammal sitemap om den pekar pa gamla URL:er

2. **Begara indexering av viktiga sidor:**
   - GSC > URL Inspection > Ange ny URL > "Request Indexing"
   - Gor detta for de 10-15 viktigaste nya sidorna

3. **Bevakning:**
   - GSC > Performance: Filtrera pa nya URL:er, se till att impressions borjar visa sig
   - GSC > Indexing > Pages: Bevaka att "Crawled - currently not indexed" inte okar

---

## 10. Tidplan

### Vecka 1: Staging och grundstruktur

| Dag | Uppgift | Beraknad tid |
|-----|---------|--------------|
| Man | Satta upp staging-miljo (subdomain, klona WP, verifiera) | 3 timmar |
| Man | Installera/uppdatera Rank Math, verifiera EduAdmin | 1 timme |
| Tis | Skapa nya kategorier i WP (alla amnes- och kunskapskategorier) | 2 timmar |
| Tis | Skapa page hierarchy (alla landningssidor for /utbildningar/ och /kunskapsbank/) | 3 timmar |
| Ons | Flytta befintliga posts/sidor till nya kategorier (SQL + WP CLI) | 4 timmar |
| Ons | Registrera custom taxonomi for leveransformat + tilldela format | 2 timmar |
| Tor | Konfigurera permalink-struktur + testa URL:er | 2 timmar |
| Tor | Registrera kunskapsbank-taxonomier (amne + dokumenttyp) | 2 timmar |
| Fre | Oversyn och dokumentation av vad som gjorts | 1 timme |

**Leverabler vecka 1:** Staging med ny kategoristruktur, alla landningssidor skapade, posts flyttade.

### Vecka 2: Innehall, EduAdmin och redirects

| Dag | Uppgift | Beraknad tid |
|-----|---------|--------------|
| Man | Bygga kunskapshub-landningssidor (intro-text, resurslista, CTA for varje hub) | 4 timmar |
| Tis | EduAdmin-kategorimappning + verifiera kurssynk | 3 timmar |
| Tis | Breadcrumb-konfiguration med Rank Math | 1 timme |
| Ons | Implementera .htaccess redirect-regler (alla monster) | 2 timmar |
| Ons | Lagga till enstaka redirects via Rank Math Redirections | 2 timmar |
| Tor | Testa ALLA 142 redirects (bulk-test med curl-script) | 3 timmar |
| Tor | Fixa eventuella redirect-problem | 2 timmar |
| Fre | Intern lankningsstrategi: koppla hubbar till utbildningar | 2 timmar |

**Leverabler vecka 2:** Kunskapshubbar live pa staging, alla redirects pa plats och testade, EduAdmin integrerat.

### Vecka 3: SEO, QA och lansering

| Dag | Uppgift | Beraknad tid |
|-----|---------|--------------|
| Man | Meta-titlar for alla A-nyckelordssidor (CTR-optimerade) | 2 timmar |
| Man | Meta-descriptions for alla kurssidor (~30 st) | 3 timmar |
| Tis | Course schema markup pa 10 kurssidor | 2 timmar |
| Tis | FAQPage schema pa 5 sidor | 1 timme |
| Ons | Format-filter implementation pa arkivsidor | 3 timmar |
| Ons | Full QA-genomgang: pre-launch checklista | 3 timmar |
| Tor | Kunden granskar och godkanner staging | -- (vanta) |
| Fre | Go-live: Kora .htaccess-reglerna pa produktion | 2 timmar |
| Fre | Post-launch: Skicka in sitemap, begara indexering, spot-check redirects | 2 timmar |

**Leverabler vecka 3:** Sajten live med ny struktur, alla redirects aktiva, SEO optimerat, GSC uppdaterat.

### Sammanfattning tidsatgang

| Fas | Beraknad tid |
|-----|--------------|
| Vecka 1: Staging + grundstruktur | ~20 timmar |
| Vecka 2: Innehall, EduAdmin, redirects | ~19 timmar |
| Vecka 3: SEO, QA, lansering | ~18 timmar |
| **Totalt** | **~57 timmar** |

---

## Appendix A: Verktyg som behovs

| Verktyg | Anvandning |
|---------|-----------|
| WP CLI | Skapa kategorier, flytta posts, search-replace |
| Rank Math SEO | Redirects, meta-data, schema, breadcrumbs, sitemap |
| Screaming Frog (eller Sitebulb) | Crawla staging for att hitta 404:or och brutna lankar |
| Google Search Console | Bevakning, indexering, sitemap |
| curl / wget | Testa redirects |
| phpMyAdmin | SQL-fragor vid behov |

## Appendix B: Risker och fallgropar

| Risk | Konsekvens | Atgard |
|------|-----------|--------|
| EduAdmin-pluginet stoder inte custom rewrite rules | Kurssidor hamnar pa fel URL | Testa i staging forst, anvand manuella page-sidor som fallback |
| Beaver Builder-sidor tappar layout vid sidflyttning | Designen gar sonder | Exportera/importera Beaver Builder-templates, inte bara sidinnehall |
| Redirect-loopar | Sidan laddar aldrig | Testa varje redirect individuellt med curl -L |
| Kunden andrar i EduAdmin efter go-live | Nya kurser hamnar i fel kategori | Dokumentera mappningen tydligt, instruera kunden |
| Hosting-prestanda (Oderland delade servrar) | Langsammare sidor | Aktivera WP caching (WP Super Cache eller liknande) |
| Rank Math gratisversion saknar features | Redirect-import ej tillganglig | Uppgradera till Rank Math PRO eller anvand Redirection-plugin som komplement |

## Appendix C: Kontaktinfo och credentials

| Resurs | Detalj |
|--------|--------|
| cPanel | kompetens @ hjaltebyran-srv01.oderland.com |
| WP Admin | mikael@kompetensutveckla.se (losenord: se CLAUDE.md Memory) |
| GSC Property | https://kompetensutveckla.se/ |
| GA4 Property | 60216008 |
| EduAdmin API | Credentials behovs fran kunden (Mikael N) |
| Searchboost kontakt | Mikael Larsson, mikael@searchboost.nu |

---

*Dokumentet ar en intern Searchboost-guide. Uppdateras vid behov.*
*Senast uppdaterad: 2026-02-14*
