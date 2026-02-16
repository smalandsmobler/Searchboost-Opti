# Diagnostik: Försvunnen Plugins-meny på phvast.se

> **Datum:** 2026-02-16
> **Problem:** Plugins-knappen och alla plugins syns inte i WordPress admin-menyn
> **Sajt:** phvast.se (WordPress, Elementor, Rank Math PRO, WP Rocket, LiteSpeed, PHP 7.4)

---

## Observationer

### 1. Sajten blockerar alla icke-browser-förfrågningar (HTTP 403)
- `https://phvast.se/` → 403
- `https://www.phvast.se/` → 403
- `https://phvast.se/wp-json/` → 403
- `https://phvast.se/robots.txt` → 403

Detta tyder på att **LiteSpeed WAF** eller en **säkerhetsplugin** blockerar bot-trafik aggressivt. Om detta är nytt beteende kan det vara samma orsak till att plugins-menyn försvunnit.

### 2. Känd riskfaktor: PHP 7.4 (End of Life)
phvast.se kör PHP 7.4.33 som slutade få säkerhetssupport i november 2022. En plugin-uppdatering (t.ex. Elementor, Rank Math, WP Rocket) kan ha infört PHP 8.0+-syntax som kraschar tyst.

---

## Diagnostikskript

Ett komplett diagnostikskript finns i:
```
mcp-server-code/diagnose-phvast.js
```

### Kör på MCP-servern (med AWS credentials):
```bash
cd /path/to/Searchboost-Opti/mcp-server-code
node diagnose-phvast.js
```

### Kör med manuella credentials:
```bash
node diagnose-phvast.js https://phvast.se <användarnamn> <app-lösenord>
```

Skriptet kontrollerar:
1. REST API-anslutning och multisite-status
2. Användarroll och capabilities (activate_plugins, install_plugins, etc.)
3. Plugin-lista (söker efter menydöljande plugins)
4. Settings-endpoint (manage_options)
5. Aktivt tema

---

## Manuella diagnostiksteg (kräver FTP/SSH-åtkomst)

### Steg 1: Kontrollera wp-config.php
```bash
grep -n "DISALLOW_FILE_MODS\|DISALLOW_FILE_EDIT\|MULTISITE\|WP_ALLOW_MULTISITE" wp-config.php
```

**Om `DISALLOW_FILE_MODS` är `true`** — detta döljer hela Plugins-menyn i WordPress. Ta bort eller ändra till `false`.

### Steg 2: Kontrollera mu-plugins
```bash
ls -la wp-content/mu-plugins/
grep -r "remove_menu_page\|plugins.php" wp-content/mu-plugins/
```

Filer i `mu-plugins/` körs automatiskt och kan inte avaktiveras via admin.

### Steg 3: Kontrollera tema
```bash
grep -r "remove_menu_page\|plugins.php" wp-content/themes/hello-elementor-child/
```

### Steg 4: Aktivera debug-loggning
Lägg till i wp-config.php (före `/* That's all, stop editing! */`):
```php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

Ladda sedan om WordPress admin och kolla:
```bash
tail -100 wp-content/debug.log
```

### Steg 5: Kontrollera användarroll i databasen
```sql
SELECT meta_value FROM wp_usermeta
WHERE meta_key = 'wp_capabilities'
AND user_id = (SELECT ID FROM wp_users WHERE user_login = 'stom_admin');
```

Förväntat resultat: `a:1:{s:13:"administrator";b:1;}`

---

## Troligaste orsaker (rangordnade)

| # | Orsak | Sannolikhet | Diagnos |
|---|-------|-------------|---------|
| 1 | `DISALLOW_FILE_MODS` i wp-config.php | HÖG | Vanligt på LiteSpeed/shared hosting |
| 2 | Säkerhetsplugin döljer menyn | HÖG | 403-blockeringen tyder på aggressiv säkerhet |
| 3 | PHP 7.4-kompatibilitetskrasch | MEDEL | Plugin uppdaterad med PHP 8.0+-syntax |
| 4 | Användarroll ändrad | MEDEL | stom_admin kanske inte längre är admin |
| 5 | mu-plugin från hosting | MEDEL | LiteSpeed-hosting injicerar ibland mu-plugins |
| 6 | WordPress Multisite | LÅG | Osannolikt men bör uteslutas |

---

## Snabbaste åtgärd

1. Logga in via FTP/filhanterare
2. Öppna `wp-config.php`
3. Sök efter `DISALLOW_FILE_MODS` — om den finns, ändra till `false` eller ta bort raden
4. Om den inte finns, kolla `wp-content/mu-plugins/` för hosting-injicerade filer
5. Om det inte hjälper, kör diagnostikskriptet på servern

---

*Genererad av Searchboost.se — 2026-02-16*
