# nordicsnusonline — Tasks & Status

> Kund: nordicsnusonline.com (VÅTT AB) | GSC: OK | BQ: OK | Hosting: Loopia (vår server) | Status: LIVE på apex, kassa + bilder fixade 2026-06-03
> Senast uppdaterad: 2026-06-03

## Kassa + bilder fixat 2026-06-03 (köp fungerar desktop + mobil)

### Arkitektur (verifierad, korrigerar tidigare "EC2"-notering)
- **Frontend** = `nordicsnusonline.com` (apex) → `51.21.116.7` (vår server, nginx, statisk Next.js i `/var/www/nso/out/`). Även `nso.searchboost.nu` → samma.
- **WooCommerce/kassa/bilder** = kundens **one.com**, `www.nordicsnusonline.com` → `46.30.215.176`. WP multisite, `/sv/` = blog 2, prefix `www_2_`. Tema Flatsome. Betalning = **Qliro One**. Kassa-permalink = `/sv/kassan/`.
- one.com SSH: `nordicsnusonline.com@ssh.nordicsnusonline.com` (creds i nordicsnusonline-next/deploy.sh). wp-cli finns: `/usr/local/bin/wp`.
- **WP-admin login**: `nordicsnusonline.com/snus-admin` (wps-hide-login slug, network-aktiv; `whl_redirect_admin=404` döljer wp-admin för oinloggade). Admins: christian, magnus@omnicom.se, mikael, thomas2. WooCommerce-produkter ligger på blog 2: `/sv/wp-admin/` → Produkter → Variationer. Login-vägar proxas → one.com via `nso-onecom-admin.conf` (/snus-admin, /wp-admin, /wp-login.php, /wp-includes/). Backup: `nordicsnusonline.bak-20260603-login`.
- Frontend-server SSH: `ubuntu@51.21.116.7` (sudo utan lösen).

### Vad som var trasigt + fix
- nginx-cutover 09:07 la `location ^~ /sv/ { rewrite → / }` → ALLA WC-vägar dog. **Fix**: nginx proxar nu `/sv/kassa|varukorg|mitt-konto|wp-json/|wp-admin|wc-api` → one.com (https). Backup: `/etc/nginx/sites-available/nordicsnusonline.bak-20260603-1145`.
- WC kör **cookieless** (Cart-Token) → Store API delar inte cart med klassiska kassan. **Fix**: `wc-cart-sync.ts` använder server-side `/sv/varukorg/?add-to-cart=VARIATION_ID&quantity=N` (credentials:include) som sätter delad `wp_woocommerce_session`-cookie. Rensar via Store API DELETE + nonce först.
- WC REST-nyckel saknades i DB (raderad) → återskapad (user mikael=192, read). **Bör flyttas till SSM.**
- Paket speglar nu WC: `lib/data/packages.ts` (237 prod, variations-id + WC-priser), genereras av `lib/scripts/gen-packages.mjs`. Frontend-paket 1/3/5/10 ERSATTA av WC:s 1-dosa/5/10/30.

### Deploy frontend (VIKTIGT)
- `rsync -az --delete --exclude=.well-known out/ ubuntu@51.21.116.7:/var/www/nso/out/` — INTE deploy.sh (den pekar fel, mot one.com).

### Kvar / noteringar
- [ ] `deploy.sh`: fel target (one.com) + SSH-lösen i klartext committat → fixa target, flytta till SSM, rotera.
- [ ] **wp-json proxy trasig (2026-06-05)**: `https://nordicsnusonline.com/sv/wp-json/` returnerar nginx-404, även med Basic Auth. Hela `wp/v2/posts`, `wc/v3/products` ger 404. Autonomous-optimizer kan därför inte skriva till NSO via REST. **Åtgärd:** kolla nginx-config på 51.21.116.7 — proxy-blocket för `wp-json` saknas eller har felaktig location-precedence (`location ^~ /sv/ {}` matchar troligen före wp-json-blocket). Tills fixat är NSO:s action_plans markerade `blocked` och pending queue-tasks `skipped` i BQ (gjort 2026-06-05 00:55 CEST). Återaktivera när proxyn fungerar.
- [ ] WC-pris: 30-pack ibland dyrare/st än 10-pack (ZYN: 32 vs 31 kr/st) — se över i WC om oavsiktligt.
- [ ] WC read-nyckel → SSM.

## Next.js-redesign — staging LIVE 2026-06-02

- **Staging**: https://nso.searchboost.nu (EC2 51.21.116.7, statisk export i /var/www/nso/out/, nginx). 200 OK alla routes.
- **Arkitektur**: Headless Next.js-frontend, kassa kvar i WooCommerce (/sv/kassa/). lib/wc-cart-sync.ts synkar cart → WC Store API v1 innan checkout-redirect.
- **WC-mappning**: wcId tillagt på 237/257 produkter (zyn-cactus WC ID=23121, 400 prod i WC, 20 saknar WC-ID — KVAR ATT FIXA).
- **GA4**: G-Z9R3KK4V5Y i app/layout.tsx. AnnouncementBar: VÄLKOMMEN10 borttagen → "Diskret förpackning — alltid".
- **Juridiskt**: VÅTT AB, Strandgatan 28, 531 60 Lidköping.
- **Lärdom**: One.com-deploy (Next.js + WP via .htaccess) bröt WP /sv/ → rollback. Använd EC2-staging, inte One.com-koexistens. Se memory/skills/nextjs_deploy_skill.md.

### Kvar att göra
- [ ] Mappa de 20 produkter som saknar wcId
- [ ] WP-sajten har plugin code-snippets — BRYTER Perispa-regel, migrera vid tillfälle
- [ ] Invänta Mikaels godkännande av staging → planera cutover till nordicsnusonline.com

---

### Tidigare (WordPress hero-arbete)

## Regressionsvarningar

_Ingen GSC-data: Ej aktiv kund i systemet. Regressionscheck ej möjlig._

Inga regressioner 2026-05-20 (ej aktiv kund)
Inga regressioner 2026-05-21 (ej aktiv kund)
Inga regressioner 2026-05-22 (ej aktiv kund)
Inga regressioner 2026-05-26 (ej aktiv kund)
Inga regressioner 2026-05-27 (ej aktiv kund)
Inga regressioner 2026-05-28 (ej aktiv kund)
Inga regressioner 2026-05-30 (ej aktiv kund)
Inga regressioner 2026-06-02 (ej aktiv kund)
Inga regressioner 2026-06-03 (ej aktiv kund)
Inga regressioner 2026-06-05 (ej aktiv kund)
Inga regressioner 2026-06-06 (ej aktiv kund)
Inga regressioner 2026-06-07 (ej aktiv kund)
Inga regressioner 2026-06-08 (ej aktiv kund)
Inga regressioner 2026-06-07 (ej aktiv kund)
Inga regressioner 2026-06-09 (ej aktiv kund)
Inga regressioner 2026-06-10 (ej aktiv kund)
Inga regressioner 2026-06-13 (ej aktiv kund)
Inga regressioner 2026-06-15 (ej aktiv kund)
Inga regressioner 2026-06-16 (ej aktiv kund)
Inga regressioner 2026-06-17 (ej aktiv kund)
Inga regressioner 2026-06-18 (ej aktiv kund)
Inga regressioner 2026-06-19 (ej aktiv kund)
Inga regressioner 2026-06-20 (ej aktiv kund)
Inga regressioner 2026-06-21 (ej aktiv kund)
Inga regressioner 2026-06-23 (ej aktiv kund)
Inga regressioner 2026-06-19 (ej aktiv kund)
Inga regressioner 2026-06-20 (ej aktiv kund)
Inga regressioner 2026-06-21 (ej aktiv kund)
Senaste check: 2026-06-21

## Status
- Inte registrerad i BigQuery/customer_pipeline
- Behöver onboardas via Dashboard om aktiv kund

---

## Hero-research — 2026-05-08

### Bakgrund
Page 25022 (slug: hem) är NSO startsida. CSS snippet 58 'NSO: Home v6 — Lato'.
Hero är just nu solid mörkgrön (#0d2614) utan bakgrundsbild.
Tidigare försök med 3 produktbilder i hero refuserades av Mikael.

### 5 koncept genererade och screenshottade

| # | Namn | Teknik | Filer |
|---|------|--------|-------|
| 1 | Nordisk Geometrisk Textur | SVG hexagon-mönster 7% opacity | `/tmp/nso-hero-1.html`, `-koncept-1-desktop.png`, `-koncept-1-mobil.png` |
| 2 | Typografisk / Editorial | Vattenstämpel "SNUS", vertikal linje, stats-rad | `/tmp/nso-hero-2.html`, `-koncept-2-*.png` |
| 3 | Liten dos i hörnet | SVG-dosillustration nedre höger, 75% opacity | `/tmp/nso-hero-3.html`, `-koncept-3-*.png` |
| 4 | Svensk skogssilhuett | SVG gransilhuetter 18% opacity + kornig textur | `/tmp/nso-hero-4.html`, `-koncept-4-*.png` |
| 5 | Vintage tobakshandelskänsla | Dubbel ram, guld-accenter, ornament, ingen bild | `/tmp/nso-hero-5.html`, `-koncept-5-*.png` |

### Rekommendation (se nedan i sessionslogg)
Favorit: Koncept 2 (typografisk) eller Koncept 5 (vintage-ram).
Avvaktar Mikaels beslut innan produktion.

### Implementerat — 2026-05-08 20:00

**Valt koncept**: Koncept 4 – Svensk skogssilhuett (default, Mikael hade ej valt)
**Teknik**: CSS `::after` pseudo-element på `.nsoh-hero` med inline SVG data URI (3 granar, 17% opacity)
**Snippet**: 58 'NSO: Home v6 — Lato' uppdaterad kl 18:08
**Backup**: `/tmp/nso-snippet-58-backup-20260508-180411.json`
**Screenshots**: `/tmp/nso-hero-final-desktop.png`, `/tmp/nso-hero-final-mobile.png`

#### Tekniska detaljer
- `.nsoh-hero` fick `position:relative;overflow:hidden`
- `.nsoh-hero::after`: SVG 3 granar, `width:35%`, `height:100%`, `opacity:0.17`, `bottom:0;right:0`
- `.nsoh-hero .nsoh-wrap`: `position:relative;z-index:1` (text alltid ovanför grafik)
- Mobil (`@media max-width:768px`): `display:none` på `::after`

#### Verifiering
- Computed bg: `rgb(13,38,20)` = #0d2614 (korrekt)
- ::after: opacity 0.17, width 367.5px, SVG background-image bekräftad
- Träd synliga på desktop höger, ej på mobil
- Trust-rad, kategorier, brands — allt renderar korrekt under hero
- Obs: Playwright desaturerar #0d2614 i headless — ser grå ut i screenshots men korrekt i riktig browser

#### Om Mikael vill rulla tillbaka
Återställ snippet 58 med backup: `/tmp/nso-snippet-58-backup-20260508-180411.json`
