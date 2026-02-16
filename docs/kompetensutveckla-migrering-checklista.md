# Kompetensutveckla.se — Migrerings-checklista

**Datum:** 2026-02-16
**Nuvarande hosting:** Hjältebyrån AB (mellanhand för Oderland), ~9 000 kr/år
**Server:** hjaltebyran-srv01.oderland.com
**cPanel-user:** kompetens
**WordPress:** 6.9.1 + EduAdmin (kurshantering)
**Disk:** ~12 GB använt av 18 GB (efter rensning 2026-02-13)

---

## Alternativ: Flytta eller stanna?

### Alt 1: Byta till egen Oderland-hosting (rekommenderat)
- **Kostnad:** ~2 000-3 000 kr/år direkt hos Oderland
- **Besparing:** ~6 000-7 000 kr/år
- **Nackdel:** Kunden ansvarar själv (men vi hjälper)

### Alt 2: Byta till Loopia
- **Kostnad:** ~1 500-2 500 kr/år
- **Bra för:** Enkel cPanel, bra support på svenska
- **Nackdel:** FTP har 10KB-begränsning (workaround med base64+PHP)

### Alt 3: Stanna hos Hjältebyrån
- **Kostnad:** ~9 000 kr/år (ingen förändring)
- **Fördel:** Inget arbete krävs
- **Nackdel:** Betalar ~3x marknadspris

---

## Före migrering

- [ ] **Kunden tar fullständig backup** (han gör regelbundna backupper)
- [ ] **Vi tar egen backup** via cPanel → Full Backup (sparas lokalt)
- [ ] **Dokumentera alla DNS-poster** (A, CNAME, MX, TXT)
  - cPanel → Zone Editor, eller kontrollera via `dig kompetensutveckla.se ANY`
- [ ] **Dokumentera e-postkontonn** — finns det e-post på domänen?
- [ ] **Lista alla plugins** med version + licenser (speciellt EduAdmin)
- [ ] **Lista alla cronjobs** (cPanel → Cron Jobs)
- [ ] **Notera PHP-version** (troligen 8.x)
- [ ] **Notera SSL-certifikat** (Let's Encrypt via cPanel? Eller Hjältebyrån?)
- [ ] **Kontrollera .htaccess** — finns custom redirects?
- [ ] **Kolla Cookiebot** — bara ett JS-snippet, följer med automatiskt

---

## Steg 1: Skapa konto hos ny hosting

- [ ] Kunden registrerar sig hos Oderland (eller Loopia)
- [ ] Välj paket med minst 20 GB disk + PHP 8.2+
- [ ] Skapa cPanel-konto + FTP-åtkomst
- [ ] Notera nya serverns IP + nameservers

---

## Steg 2: Flytta WordPress

### Via cPanel (enklast)
- [ ] **Ny hosting:** Installera WordPress via Softaculous
- [ ] **Gammal hosting:** Exportera databas via phpMyAdmin (SQL-dump)
- [ ] **Gammal hosting:** Ladda ner wp-content/ via FTP eller File Manager (ZIP)
- [ ] **Ny hosting:** Importera databas i phpMyAdmin
- [ ] **Ny hosting:** Ladda upp wp-content/ (plugins, themes, uploads)
- [ ] **Ny hosting:** Uppdatera wp-config.php med nya DB-credentials

### Via plugin (alternativ)
- [ ] Installera All-in-One WP Migration (eller Duplicator)
- [ ] Exportera hela sajten (max filstorlek ~512MB på gratis)
- [ ] Importera på nya hostingen
- [ ] Om filen är för stor: använd UpdraftPlus (backuppar till Google Drive)

---

## Steg 3: Verifiera innan DNS-byte

- [ ] Testa sajten via hosts-fil (peka kompetensutveckla.se → ny IP lokalt)
- [ ] Kolla att alla sidor laddar korrekt
- [ ] Kolla att EduAdmin/kursbokning fungerar
- [ ] Kolla att kontaktformulär fungerar
- [ ] Kolla att SSL funkar (ny hosting → Let's Encrypt)
- [ ] Kolla att Cookiebot-bannern visas
- [ ] Kolla att wp-admin funkar

---

## Steg 4: Byt DNS

- [ ] Logga in hos domänregistratorn (var är kompetensutveckla.se registrerad?)
- [ ] Ändra A-record till nya serverns IP
- [ ] Ändra nameservers om ny hosting kräver det
- [ ] **Vänta 1-24 timmar** på DNS-propagering
- [ ] Verifiera med `dig kompetensutveckla.se` att nya IP:n svara

---

## Steg 5: Efterarbete

- [ ] **SSL:** Aktivera Let's Encrypt på nya hostingen
- [ ] **E-post:** Om e-post finns på domänen — flytta MX-poster
- [ ] **GSC:** Verifiera att Google Search Console fortfarande funkar
- [ ] **Redirects:** Implementera .htaccess-redirects (142 st, redan förberedda)
- [ ] **SQL-optimering:** Kör meta-titel-SQL:en (23 UPDATE + 1 INSERT)
- [ ] **WP app-password:** Generera för automatisk SEO-optimering
- [ ] **Cookiebot:** Behöver ingen ändring (externt JS-snippet)
- [ ] **Cache:** Installera WP Super Cache eller LiteSpeed Cache
- [ ] **Säkerhet:** Installera Wordfence eller Sucuri
- [ ] **Uptime-monitor:** Lägg till i UptimeRobot (gratis)

---

## Steg 6: Stäng gammal hosting

- [ ] **Vänta minst 7 dagar** efter DNS-byte
- [ ] Verifiera att allt funkar på nya hostingen
- [ ] Spara en sista backup från gamla hostingen
- [ ] Säg upp Hjältebyrån-kontot
- [ ] Bekräfta att ingen faktura dras

---

## Saker vi redan förberett (redo att köra efter flytt)

| Uppgift | Fil | Status |
|---------|-----|--------|
| Meta-titel SQL (23 sidor) | `docs/kompetensutveckla-meta-optimering.sql` | Redo |
| 142 redirects | I SEO-rapporten | Redo |
| Strukturförslag | `presentations/kompetensutveckla-strukturforslag.md` | Redo |
| Implementeringsguide | `presentations/kompetensutveckla-implementeringsguide.md` | Redo |
| ABC-nyckelord (50+) | I BigQuery | Klart |
| Åtgärdsplan (3 mån) | I BigQuery | Klart |

---

## Tidsuppskattning

| Steg | Tid |
|------|-----|
| Backup + förberedelse | 30 min |
| Flytta WordPress | 1-2 timmar |
| Verifiera + testa | 30 min |
| DNS-byte + vänta | 1-24 timmar |
| Efterarbete (redirects, SQL, cache) | 1-2 timmar |
| **Totalt aktivt arbete** | **3-5 timmar** |

---

*Checklista skapad 2026-02-16 av Searchboost*
