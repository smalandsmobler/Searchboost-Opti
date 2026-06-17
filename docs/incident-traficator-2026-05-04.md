# Incidentrapport — traficator.se nere

**Datum:** 2026-05-04
**Utförd av:** Searchboost (Mikael + Claude)
**Sajt:** https://traficator.se
**Webbhotell:** Oderland (auth lagrad i AWS SSM)
**Status:** ❌ Sajten svarar HTTP 500 på alla WordPress-endpoints

---

## 1. Sammanfattning

Traficator.se ger **WordPress kritiskt fel** ("Det har uppstått ett kritiskt fel på webbplatsen") på samtliga PHP-rutter. Statiska filer (CSS/JS/readme.html) levereras normalt. Servern (LiteSpeed + PHP 8.1.34) är **uppe** — det är **WordPress runtime som faller** under bootstrap. Det här är typiskt en PHP-fatal i ett plugin/tema/ wp-config efter en auto-uppdatering, ej ett hosting-utfall.

**Slutsats:** Detta är **inte** Oderland-nedtid. Det är ett PHP-fel inuti WP-installationen som måste åtgärdas via filhanteraren/FTP/SSH på Oderland-kontot (auth i SSM `/seo-mcp/...`).

---

## 2. Externa observationer (taget 2026-05-04 ~09:33 UTC)

| Endpoint | HTTP | Typ | Tolkning |
|----------|------|-----|----------|
| `/` | 500 | PHP/WP | WP-fatal vid bootstrap |
| `/wp-login.php` | 500 | PHP/WP | Bootstrap dör innan login renderas |
| `/wp-admin/` | 500 | PHP/WP | Samma sak |
| `/wp-json/` | 500 | PHP/WP | REST-API nere |
| `/robots.txt` | 500 | PHP/WP | Genereras dynamiskt → faller |
| `/sitemap_index.xml` | 500 | PHP/WP | Rank Math sitemap → faller |
| `/vara-tjanster/`, `/kontakt/`, `/en/` | 500 | PHP/WP | Alla front-end-sidor nere |
| `/xmlrpc.php` | 500 | PHP/WP | Faller också (laddar wp-load) |
| `/wp-cron.php` | 200 | PHP/WP | Returnerar tidigt, säger inget om frisk WP |
| `/readme.html` | 200 | Statisk | Servern svarar |
| `/wp-includes/js/jquery/jquery.min.js` | 200 | Statisk | Filsystemet OK |
| `/wp-content/themes/flatsome/style.css` | 200 | Statisk | Tema-filer på plats |
| `/wp-content/debug.log` | 403 | Blockerad | (Filen kan finnas men nås inte externt) |
| `/wp-content/uploads/` | 404 | — | Directory listing av |
| `/favicon.ico` | 404 | — | Saknas (icke-relaterat) |

### Response-headers (utvalda)
```
HTTP/2 500
server: LiteSpeed
x-powered-by: PHP/8.1.34
x-litespeed-tag: 086_HTTP.500
content-type: text/html; charset=UTF-8
```

### Felets HTML-body
```html
<body id="error-page">
  <div class="wp-die-message">
    <p>Det har uppstått ett kritiskt fel på webbplatsen.</p>
    <p><a href="https://wordpress.org/documentation/article/faq-troubleshooting/">
      Läs mer om felsökning i WordPress.</a></p>
  </div>
</body>
```

Detta är WordPress generiska `wp_die()`-respons — visar **att WP själv kunde kasta felet** men **WP_DEBUG är av** så vi får inte felmeddelandet eller filen.

---

## 3. Diagnos

| Indikator | Vad det säger |
|-----------|---------------|
| Statiska filer 200, allt PHP 500 | Servern är uppe. PHP körs. WP startar. WP dör. |
| `/wp-login.php` också 500 | Felet sker tidigt i `wp-settings.php` (mu-plugins eller plugins) — innan login-routing |
| WP visar "kritiskt fel" (inte "Error establishing database connection") | DB-anslutning fungerar, men PHP-fatal eller uncaught exception |
| `x-powered-by: PHP/8.1.34` | Samma PHP-version som vid audit 2026-02-15 → ingen PHP-bump |
| LiteSpeed cache no-store på 500 | Cache är inte boven (no-cache headers vid fel) |

### Mest sannolika orsaker, i prio-ordning

1. **Plugin-auto-uppdatering har kraschat** — Rank Math Pro, LiteSpeed Cache, Polylang, Site Kit, Contact Form 7 eller Flatsome child-theme har dragit in en bugg som triggar PHP-fatal. Vanligaste orsaken statistiskt.
2. **Tema-uppdatering** — Flatsome eller dess child-theme har en `function_exists`-kollision eller saknad fil.
3. **`wp-config.php`-korruption** — t.ex. saltnycklar som klippts, eller ett tilllägg från säkerhetsplugin som blivit ogiltigt.
4. **Disk full / inode full på Oderland** — kan ge tomma filer vid skrivning, men oftast träffar det också statiska uploads.
5. **Fil-permissioner** — om något skript (cron) chmodat fel kan plugins inte läsas.
6. **PHP memory limit** — fatal vid hög minnesåtgång, mindre sannolikt att vara konstant 500 om det inte är en infinite-loop i en hook.

---

## 4. Återställningsplan

Allt nedanstående görs via Oderlands kontrollpanel + Filhanterare/FTP/SSH med credentials i SSM:

```
/seo-mcp/wordpress/traficator/url
/seo-mcp/wordpress/traficator/username
/seo-mcp/wordpress/traficator/app-password
```

> Notering: Auditen 2026-02-15 angav `placeholder` för WP app-password. Om det fortfarande är fallet behövs Oderland cPanel/Direct Admin-creds (förvaras under nyckel `/seo-mcp/hosting/oderland/*` om sådan parameter satts — om inte: be Mikael lägga in dem). Den här diagnosen kräver ändå **filsystem**-access, inte WP-app-password — så Oderland-login är det som gäller.

### Steg 1 — Aktivera WP_DEBUG (få fram det riktiga felet)
I `wp-config.php`, byt:
```php
define( 'WP_DEBUG', false );
```
till:
```php
define( 'WP_DEBUG', true );
define( 'WP_DEBUG_LOG', true );
define( 'WP_DEBUG_DISPLAY', false );
@ini_set( 'display_errors', 0 );
```
Ladda om sajten en gång (HTTP 500 är OK). Hämta `/wp-content/debug.log` via FTP — där står exakt fil + radnummer.

### Steg 2 — Inaktivera alla plugins (om Steg 1 pekar på en plugin)
Via FTP/Filhanterare:
```
mv wp-content/plugins  wp-content/plugins.off
mkdir wp-content/plugins
```
Ladda om sajten:
- Om sajten kommer upp → boven är ett plugin. Flytta tillbaka plugins **en i taget** och ladda om mellan varje.
- Om sajten fortfarande är 500 → boven är temat eller wp-config.

### Steg 3 — Tema-fallback
```
mv wp-content/themes/flatsome-child  wp-content/themes/flatsome-child.off
mv wp-content/themes/flatsome        wp-content/themes/flatsome.off
```
WP byter automatiskt till `twentytwentyfour` om det finns. Om sajten kommer upp → boven är temat.

### Steg 4 — Kontrollera Oderland error-log
I Oderland cPanel/DirectAdmin → "Errors" eller `~/logs/` (LiteSpeed brukar logga `stderr.log` eller `error_log` i hemkatalogen). PHP-fatalt visar exakt fil och rad.

### Steg 5 — Kontrollera disk + inodes
```bash
df -h
df -i
```
Är någon av dem 100% → frigör utrymme (logger, gamla backups under `wp-content/updraft/`, `wp-content/cache/`, `wp-content/wpvividbackups/`).

### Steg 6 — Snabbtest av wp-config.php
Testa läsbarhet och syntax:
```bash
php -l wp-config.php
```
Returnerar `Parse error` om filen är trasig.

### Steg 7 — Senaste backup på Oderland
Oderland tar normalt dagliga backuper. Om Steg 1–6 inte är snabba, **rulla tillbaka** filsystemet 24h via Oderland Backup → välj datum före 2026-05-04. DB:n behöver normalt **inte** rullas tillbaka (felet är PHP, inte data).

---

## 5. Akut åtgärd om sajten måste upp NU

Skapa `wp-content/mu-plugins/0-emergency-disable.php` med:
```php
<?php
add_filter( 'option_active_plugins', '__return_empty_array' );
```
Detta tvingar fram zero plugins utan att röra `wp_options`-tabellen. Sajten kommer upp i naket tema. Bra som temporärlapp medan Steg 1-7 körs.

---

## 6. Förebyggande efter återställning

| Åtgärd | Varför |
|--------|--------|
| Stäng av plugin-auto-update i WP | Förhindrar att uppdatering bryter igen |
| Aktivera staging-miljö på Oderland | Testa uppdateringar utan att ta ner produktion |
| Lägg upp UptimeRobot/Better Uptime på `/` + `/wp-login.php` | Larm i sek, ej dagar |
| Skapa SSM-parameter `/seo-mcp/hosting/oderland/*` | Auth strukturerat enligt övriga kunder |
| Kör manuell SEO-audit-omkörning efter återställning | Verifiera att ingenting ändrats i metadata |

---

## 7. Påverkan

- **Ranking:** En kort 500-period (timmar) påverkar normalt inte ranking. Längre än 24h börjar Google avindexera sidor. Återställning idag = ingen permanent skada.
- **Trafik:** Vid ~20-50 besök/månad (audit 2026-02-15) är direkt trafikförlust marginell, men en pågående offert/lead som klickar nu får dålig upplevelse.
- **GSC:** "Sökrobotsfel" och "Serverfel (5xx)" kommer dyka upp i Search Console — normalt, försvinner efter återställning + recrawl.

---

## 8. Att göra härnäst (handlingslista för Mikael/Viktor)

1. **NU:** Logga in på Oderland (auth i SSM) och kör Steg 1 (WP_DEBUG på).
2. Hämta `wp-content/debug.log` → identifiera den exakta filen.
3. Kör Steg 2 eller 3 baserat på vad debug.log säger.
4. När sajten är uppe: stäng av WP_DEBUG igen, logga arbetet via dashboardens "Logga arbete"-flik (kund: traficator).
5. Mejla kunden kort statusrapport (vi upptäckte och åtgärdade ett WP-fel, sajten är uppe igen).
6. Lägg in Oderland-creds som strukturerad SSM-parameter om det inte redan är gjort.

---

*Genererad av Searchboost — 2026-05-04*
