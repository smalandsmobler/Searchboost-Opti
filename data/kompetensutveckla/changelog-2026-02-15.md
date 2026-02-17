# Kompetensutveckla.se — Ändringslogg 2026-02-15

## Sammanfattning

SEO-optimering utförd direkt i produktionsmiljön via WP-admin.
Alla ändringar gjorda med WPCode PHP-snippets (run-once och persistent).

---

## 1. Plugin-rensning (17 st raderade)

Raderade alla inaktiva plugins för att minska attackyta och förbättra prestanda:

- Akismet Anti-spam: Spam Protection
- Better Search Replace
- Classic Editor
- Duplicate Post
- EduAdmin Booking (+ GA/Tag Manager addon)
- Elementor
- GP Premium
- Hello Dolly
- Jetpack
- Ninja Forms (+ Addon Manager)
- Redirection
- SEOPress
- Widget Importer & Exporter
- Yoast SEO
- Yoast SEO Premium

**Kvarvarande aktiva (10 st):** Beaver Builder, Cookiebot, GP Premium, Ninja Forms, PowerPack for BB, Rank Math SEO, UpdraftPlus, WP Mail SMTP, WP Rocket, WPCode Lite

---

## 2. Meta-titlar och beskrivningar (18 sidor)

Via WPCode snippet ID 20228 (run-once, nu inaktiverad).
Uppdaterade `rank_math_title` och `rank_math_description` för:

| Sida | ID | Ny titel (trunkerad) |
|------|----|---------------------|
| Hem | 32 | Kompetensutveckla — Sveriges arbetsmiljöutbildningar... |
| AFS | 2349 | AFS — Arbetsmiljöverkets föreskrifter (komplett lista 2026)... |
| BAM | 12744 | BAM-utbildning — Bättre Arbetsmiljö 2, 3 eller 5 dagar... |
| AFS 2023 | 10323 | AFS 2023 — Nya föreskrifter... |
| Keds | 5478 | Keds — Vad det är, regler & tips... |
| Ecy | 16224 | Ecy — Vad det är, regler & tips... |
| SAM | 14784 | SAM-utbildning — Systematiskt arbetsmiljöarbete... |
| Arbete på väg (fysisk) | 181 | Arbete på väg — Utbildning nivå 1.1-1.4 & 2.2... |
| Arbetsmiljöplan | 8065 | Arbetsmiljöplan — Vad det är, regler & tips... |
| Arbetsglasögon | 8682 | Arbetsglasögon — Vad det är, regler & tips... |
| BAS P/U | 171 | BAS P/U-utbildning — Byggarbetsmiljösamordnare... |
| Arbetstidslag | 2336 | Arbetstidslag — Vad det är, regler & tips... |
| SAM (1 dag) | 183 | SAM-utbildning — Systematiskt arbetsmiljöarbete (1 dag)... |
| ELBAM | 8122 | BAM-utbildning — Bättre Arbetsmiljö... |
| Friskfaktorer | slug | Friskfaktorer — Vad det är, regler & tips... |
| Flexbert | slug | Flexbert — Vad det är, regler & tips... |
| Liftutbildning | slug | Liftutbildning — Skylift & mobila arbetsplattformar... |
| Arbete på väg (webb) | slug | Arbete på väg — Utbildning nivå 1.1-1.4 & 2.2... |

Fullständiga värden: se `optimized-meta.json`

---

## 3. Course Schema Markup (6 kurssidor)

Via WPCode snippet ID 20229 (aktiv, persistent).
Lägger till JSON-LD Course-schema på kurssidor:

| Sida | ID | Pris från | Kurslägen |
|------|----|-----------|-----------|
| BAM-utbildning | 12744 | 3 990 kr | Online, Onsite, Blended |
| SAM-utbildning | 14784 | 2 695 kr | Online, Onsite, Blended |
| SAM (1 dag) | 183 | 2 695 kr | Online, Onsite |
| BAS P/U | 171 | 1 195 kr | Online, Onsite |
| Arbete på väg | 181 | 295 kr | Online, Onsite |
| ELBAM | 8122 | 3 990 kr | Online, Onsite, Blended |

Schema inkluderar: name, description, provider (Organization), courseMode, offers (price, SEK), hasCourseInstance med courseWorkload.

FAQPage-schema hanteras av Rank Math (redan konfigurerat på dessa sidor).

---

## 4. CAPS LOCK-fix blogginlägg (269 st)

Via WPCode snippet ID 20230 (run-once, nu inaktiverad).
Konverterade 269 blogginlägg med ALLA STORA BOKSTÄVER i titeln till Title Case.

Exempel:
- "SAMMANFATTNING AV AFS 2023:2" → "Sammanfattning Av Afs 2023:2"
- "HUR FÖREBYGGER MAN STRESS PÅ ARBETSPLATSEN?" → "Hur Förebygger Man Stress På Arbetsplatsen?"

---

## 5. Rank Math SEO-titlar blogginlägg (281 st)

Via WPCode snippet ID 20512 (run-once, nu inaktiverad).
Satte `rank_math_title` på 281 blogginlägg som saknade SEO-titel.
Format: `%title% | Kompetensutveckla`

---

## 6. Redirects — Komplett implementation

### 6a. Rank Math Redirections (409 st totalt)
- 406 befintliga (importerade från Yoast/Redirection)
- 3 nya: keds, arbetstidslagen (flyttade sidor) + friskfaktorer/flexbert (raderade → parent)
- Regex-wildcard: `/arbetsmiljoarbete/(.*)` → `/vara-tjanster/arbetsmiljoarbete/$1` (5589 träffar)

### 6b. .htaccess-regler (8 nya)
Rank Math-redirects kunde inte fånga `/vara-tjanster/arbetsmiljoarbete/kunskapsbanken/...` URLs
(WordPress hanterade 404 innan Rank Math körde). Löst med .htaccess-regler som körs före WP:

```apache
# Specifika redirects: keds och arbetstidslagen flyttades ut ur kunskapsbanken/
RewriteRule ^arbetsmiljoarbete/kunskapsbanken/keds/?$ /vara-tjanster/arbetsmiljoarbete/keds/ [R=301,L]
RewriteRule ^arbetsmiljoarbete/kunskapsbanken/arbetstidslagen/?$ /vara-tjanster/arbetsmiljoarbete/arbetstidslagen/ [R=301,L]
# friskfaktorer och flexbert raderade → peka till parent
RewriteRule ^arbetsmiljoarbete/kunskapsbanken/friskfaktorer/?$ /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ [R=301,L]
RewriteRule ^arbetsmiljoarbete/kunskapsbanken/flexbert/?$ /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ [R=301,L]
# Samma fast med vara-tjanster-prefix (fran wildcard-redirect eller externa lankar)
RewriteRule ^vara-tjanster/arbetsmiljoarbete/kunskapsbanken/keds/?$ /vara-tjanster/arbetsmiljoarbete/keds/ [R=301,L]
RewriteRule ^vara-tjanster/arbetsmiljoarbete/kunskapsbanken/arbetstidslagen/?$ /vara-tjanster/arbetsmiljoarbete/arbetstidslagen/ [R=301,L]
RewriteRule ^vara-tjanster/arbetsmiljoarbete/kunskapsbanken/friskfaktorer/?$ /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ [R=301,L]
RewriteRule ^vara-tjanster/arbetsmiljoarbete/kunskapsbanken/flexbert/?$ /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ [R=301,L]
```

### 6c. Verifiering — alla 14 test-URLs ger 200

| URL | Status | Slutdestination |
|-----|--------|-----------------|
| /kurser-2/sakra-lyft/ | 200 | /webbutbildningar/.../sakra-lyft/ |
| /kurser-2/bam-battre-arbetsmiljo-2-dagar/ | 200 | /bam-utbildning/... |
| /kurser-2/osa-online/ | 200 | /lararledda-webbutbildningar/osa-online/ |
| /kurser-2/ | 200 | /fysiska-utbildningar/ |
| /arbetsmiljoarbete/kunskapsbanken/keds/ | 200 | /vara-tjanster/arbetsmiljoarbete/keds/ |
| /arbetsmiljoarbete/kunskapsbanken/arbetstidslagen/ | 200 | /vara-tjanster/arbetsmiljoarbete/arbetstidslagen/ |
| /arbetsmiljoarbete/kunskapsbanken/friskfaktorer/ | 200 | /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ |
| /arbetsmiljoarbete/kunskapsbanken/flexbert/ | 200 | /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ |
| /arbetsmiljoarbete/kunskapsbanken/ecy/ | 200 | /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/ecy/ |
| /arbetsmiljoarbete/kunskapsbanken/arbetsmiljoplan/ | 200 | /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/arbetsmiljoplan/ |
| /arbetsmiljoarbete/kunskapsbanken/arbetsglasogon/ | 200 | /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/arbetsglasogon/ |
| /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/keds/ | 200 | /vara-tjanster/arbetsmiljoarbete/keds/ |
| /vara-tjanster/arbetsmiljoarbete/kunskapsbanken/arbetstidslagen/ | 200 | /vara-tjanster/arbetsmiljoarbete/arbetstidslagen/ |
| / (hemsidan) | 200 | / |

---

## 7. WP Rocket Cache

Rensad 3 gånger under sessionen:
1. Efter meta-update
2. Efter schema-update
3. Slutgiltig rensning efter alla redirects (02:05)

---

## WPCode-snippets status

| ID | Namn | Status |
|----|------|--------|
| 20228 | Searchboost - Bulk Meta Update (run once) | Inaktiv |
| 20229 | Searchboost - Course Schema Markup | Aktiv (persistent) |
| 20230 | CAPS Lock Fix (run once) | Inaktiv |
| 20512 | Set Rank Math Blog Titles (run once) | Inaktiv |

---

## Sammanfattning av alla ändringar

| Kategori | Antal | Metod |
|----------|-------|-------|
| Plugins raderade | 17 | WP-admin |
| Meta-titlar (sidor) | 18 | WPCode run-once |
| Course Schema | 6 | WPCode persistent |
| CAPS Lock-fix (blogg) | 269 | WPCode run-once |
| Rank Math SEO-titlar (blogg) | 281 | WPCode run-once |
| Rank Math redirects | 409 (3 nya) | WP-admin |
| .htaccess-regler | 8 nya | cPanel File Manager |
| WP Rocket cache-rensningar | 3 | WP-admin |

---

## Nästa steg

1. Radera Redirection-plugin (varning visas, kanske kvar som inaktiv)
2. Sätta upp staging-miljö via cPanel
3. Ny kategoristruktur (staging-setup.sh finns förberedd)
4. GTM + GA4 (config/gtm-template.json finns förberedd)
5. Optimera bilder (lazy load, WebP)
