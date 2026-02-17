# Kompetensutveckla.se — Migrerings-checklista & Arbetslogg

**Datum:** 2026-02-16
**Nuvarande hosting:** Hjältebyrån AB (mellanhand for Oderland), ~9 000 kr/ar
**Server (gammal):** hjaltebyran-srv01.oderland.com (cPanel-user: kompetens)
**Server (ny dev):** kompetensutveckla.hemsida.eu (Oderland direkt)
**WordPress:** 6.9.1 + EduAdmin (kurshantering)
**Disk (gammal):** ~12 GB anvant av 18 GB (efter rensning 2026-02-13)
**Domain:** Registrerad hos One.com (kundens konto)
**E-post:** @kompetensutveckla.se pa One.com

---

## Beslut: Oderland direkt (Alt 1 valt)

Kunden har bestamt sig. Alla tjanster samlas pa Oderland:
- **Hosting:** Ny Oderland-hosting med mockup-doman (kompetensutveckla.hemsida.eu)
- **Domain:** Flyttas fran One.com till Oderland (kraver EPP-kod fran kunden)
- **E-post:** Flyttas fran One.com till Oderland
- **Kostnad:** ~2 000-3 000 kr/ar (besparing ~6 000-7 000 kr/ar)

### Oderland-credentials (dev-miljo)
- **cPanel URL:** https://kompetensutveckla.hemsida.eu:2083/
- **Agarkonto:** kompete9 (full access)
- **Team-konto:** searchboost@kompetensutveckla.hemsida.eu / Alexander1982!
- **OBS:** Team-kontot har begransad access (ingen File Manager). Behover agarkontot for WordPress-installation.

---

## Arbetslogg — Vad vi gjort

### 2026-02-16 (idag)

**Meta Pixel-krasch (lost)**
- Kunden fick felmail: `E_ERROR` — Meta Pixel for WordPress krachade varje sidladdning
- Orsak: Utgangen Facebook access token (`AuthorizationException`)
- Kontrollerade plugins-mappen — pluginet redan borttaget (troligen av Hjaltebyran)
- Sajten laddar nu utan fel

**Hjaltebyran cPanel — forlorad access**
- Forsoku logga in pa cPanel (hjaltebyran-srv01.oderland.com:2083)
- Varken `mikael@kompetensutveckla.se` eller `kompetens` + kanda losenord funkade
- Hjaltebyrans kundpanel (hosting.hjaltebyran.se) — session expired, okant losenord
- Slutsats: cPanel-losenordet andrads nar Hjaltebyran skapade team-kontot, eller sa var det aldrig det losenord vi trodde

**Plan B — WP-admin + All-in-One WP Migration**
- Loggade in i kompetensutveckla.se/wp-admin (Chrome autofill)
- Installerade och aktiverade All-in-One WP Migration
- Startade export till FIL — 9 907 content-filer
- Export pagar (~27% klar)

**Viktor igangkord**
- Viktor installerade Claude Code pa sin Mac
- Auth-problem: bade token och API-nyckel satta → `claude /logout` + restart
- Viktor tillagd som Developer i Mikaels Anthropic-organisation
- Jobbar idag pa wedosigns + ferox (audits finns i docs/)

### Tidigare sessioner (sammanfattning)
- 2026-02-13: Raderade kompetens.hemsida.eu-installationen (sparade 950 MB backup), frigjorde ~5-8 GB disk
- 2026-02-14: SEO-rapport klar, 50 nyckelord inlagda, atgardsplan genererad, redirects kartlagda (142 st)
- 2026-02-16: Meta-optimerings-SQL forberedd (23 UPDATE + 1 INSERT), migreringschecklista skapad

---

## Utmaningar

### 1. Tappad cPanel-access till Hjaltebyran
Vi har inte langre cPanel-losenord till den gamla hostingen. Det innebar att:
- Vi inte kan hamta fil-backup via cPanel File Manager
- Vi inte kan kora SQL direkt i phpMyAdmin
- Vi maste forlita oss pa WP-admin (som funkar) + plugins for export
- **Workaround:** All-in-One WP Migration exporterar allt (DB + filer + plugins + teman) i en .wpress-fil

### 2. Oderland team-konto ar begransat
Team-kontot (searchboost@) har inte File Manager, WordPress Manager eller Softaculous.
- **Losar:** Behover agarkontot (kompete9) for att installera WordPress pa dev-miljon
- **Alternativ:** Be Oderland-support installera WP, eller be Mikael/kunden ge agarkontots losenord

### 3. EduAdmin-plugin
- EduAdmin ar Kompetensutvecklas kurshanteringssystem (API-baserat)
- Kraver API-nyckel fran leverantoren — vi har den inte
- Maste funka pa nya hostingen annars gar inga kursbokningar
- **Atgard:** Inkludera i export → testa pa dev-miljon → be kunden verifiera

### 4. E-post pa One.com
- All e-post for @kompetensutveckla.se ligger pa One.com
- Om vi bara flyttar domanen utan att forbereda e-post → mailen slutar fungera
- **Atgard:** Satt upp e-post pa Oderland FORST, migrera brevlador, SEN byt DNS

### 5. Filstorlek
- Sajten ar ~12 GB. All-in-One WP Migration gratisversion har 512 MB-grans for IMPORT
- **Losar:** Anvand CLI-import (`ai1wm-import.php`), eller dela upp, eller kop premium ($69)
- Alternativt: Manuell import (ladda upp wp-content separat + SQL-dump)

---

## Mojligheter

### 1. Rensa och optimera vid flytt
Flytten ar det perfekta tillfallet att:
- **Ta bort onodiga plugins** (Meta Pixel redan borta, kolla fler)
- **Uppgradera PHP** till 8.2 eller 8.3 (battre prestanda)
- **Installera LiteSpeed Cache** (Oderland kor LiteSpeed)
- **Rensa databas** (old revisions, spam comments — 67 st vantar)
- **Optimera bilder** (ShortPixel/Imagify)

### 2. WooCommerce-ersattning for EduAdmin
- EduAdmin = gammal kursplattform, dyrt, begransat
- **Alternativ:** WooCommerce + kurshantering (Tutor LMS, LearnDash, WP Courseware)
- Ger battre SEO, battre konverteringsflode, billigare
- **Timing:** Planera EFTER flytten, implementera i fas 2

### 3. SEO-arbete redo att kora
Allt detta vantar pa att dev-miljon star klar:
- 23 meta-titel-optimeringar (SQL redo)
- 142 redirects (.htaccess redo)
- ABC-nyckelord inlagda (50+ st)
- 3-manaders atgardsplan genererad
- Strukturforslag med nya kategorisidor
- **Forvantad effekt:** +80-130 klick/manad

### 4. Kostnadsbesparing for kunden
- **Nu:** ~9 000 kr/ar (Hjaltebyran) + One.com (doman + mail)
- **Nytt:** ~2 500-3 500 kr/ar (allt pa Oderland)
- **Besparing:** 5 000-7 000 kr/ar
- Kunden sparar pengar OCH far battre prestanda (LiteSpeed, narmre servrar)

### 5. Dev-miljo for saker utveckling
- kompetensutveckla.hemsida.eu = sandlada for alla andringar
- Kan testa redirects, SQL, nya plugins utan risk for live-sajten
- Viktor kan lara sig WordPress-administration har

---

---

## Fore migrering

- [x] **Kunden tar backup** (Hjaltebyran gor regelbundna)
- [x] **Vi tar backup** via All-in-One WP Migration export (pagar, 27%)
- [ ] **Dokumentera alla DNS-poster** (A, CNAME, MX, TXT)
  - `dig kompetensutveckla.se ANY` — One.com nameservers
- [ ] **Dokumentera e-postkonton** — finns pa One.com, lista alla adresser
- [x] **Lista plugins** — Meta Pixel borttaget, EduAdmin kvar, Rank Math, Beaver Builder, WP Rocket m.fl.
- [ ] **Lista cronjobs** — gar inte utan cPanel-access
- [x] **PHP-version** — 8.x pa Hjaltebyran
- [ ] **SSL-certifikat** — troligen Let's Encrypt via cPanel
- [x] **.htaccess** — 142 redirects forberedda
- [x] **Cookiebot** — JS-snippet, foljer med automatiskt

---

## Steg 1: Skapa konto hos ny hosting

- [x] Oderland-konto skapat (kompete9 = agare)
- [x] Mockup-doman: kompetensutveckla.hemsida.eu
- [x] Team-konto: searchboost@kompetensutveckla.hemsida.eu
- [ ] Verifiera diskstorlek (behover minst 20 GB)
- [ ] Notera nya serverns IP + nameservers

---

## Steg 2: Flytta WordPress

### Vald metod: All-in-One WP Migration (plugin)
- [x] Installera All-in-One WP Migration pa gammal hosting
- [ ] Exportera hela sajten till FIL (pagar — 9 907 filer, 27% klar)
- [ ] Ladda ner .wpress-filen till dator
- [ ] **Ny hosting:** Installera WordPress via Softaculous (kraver agarkonto kompete9)
- [ ] **Ny hosting:** Installera All-in-One WP Migration
- [ ] **Ny hosting:** Importera .wpress-filen
- [ ] **OBS:** Gratisversionen har 512 MB importgrans
  - Om filen ar for stor: anvand WP CLI import, eller kop Unlimited ($69)
  - Alternativ: manuell import (SQL-dump + wp-content separat)

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

## Steg 4: Byt DNS / Flytta doman

Domanen ar registrerad hos One.com (kundens konto). Tva alternativ:

### Alt A: Flytta domanen till Oderland (rekommenderat)
- [ ] Kunden hamtar EPP-kod fran One.com (Domaininst. → Flytta doman)
- [ ] Starta domanflytt pa Oderland (Lagg till doman → Flytta till oss → EPP-kod)
- [ ] Kunden bekraftar flytten via mail fran One.com
- [ ] Vanta 3-5 dagar pa att flytten genomfors
- [ ] Peka domanen till nya hostingen i Oderland

### Alt B: Behall domanen pa One.com, peka DNS
- [ ] Logga in pa One.com
- [ ] Andra A-record till Oderland-serverns IP
- [ ] Andra nameservers om nodvandigt
- [ ] **Vanta 1-24 timmar** pa DNS-propagering
- [ ] Verifiera med `dig kompetensutveckla.se`

---

## Steg 5: E-post-migrering (VIKTIGT — fore DNS-byte!)

- [ ] Dokumentera alla e-postkonton pa One.com (@kompetensutveckla.se)
- [ ] Skapa samma e-postkonton pa Oderland
- [ ] Migrera e-post (IMAP-sync eller manuell)
- [ ] Testa att e-post funkar pa Oderland
- [ ] FORST DA — byt DNS/flytta doman

---

## Steg 6: Efterarbete (pa nya hostingen)

- [ ] **SSL:** Aktivera Let's Encrypt
- [ ] **GSC:** Verifiera att Google Search Console fortfarande funkar
- [ ] **Redirects:** Implementera .htaccess-redirects (142 st, redan forberedda)
- [ ] **SQL-optimering:** Kor meta-titel-SQL:en (23 UPDATE + 1 INSERT)
- [ ] **WP app-password:** Generera for automatisk SEO-optimering
- [ ] **Cookiebot:** Behovs ingen andring (externt JS-snippet)
- [ ] **Cache:** Oderland kor LiteSpeed → aktivera LS Cache-plugin
- [ ] **Sakerhet:** Installera Wordfence eller Sucuri
- [ ] **Uptime-monitor:** Lagg till i UptimeRobot (gratis)

---

## Steg 7: Stang gammal hosting

- [ ] **Vanta minst 7 dagar** efter DNS-byte
- [ ] Verifiera att allt funkar pa nya hostingen (inkl. e-post!)
- [ ] Spara en sista backup fran gamla hostingen
- [ ] Sag upp Hjaltebyran-kontot
- [ ] Avsluta One.com (om domanen ar flyttad)
- [ ] Bekrafta att ingen faktura dras

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
