# Ferox Konsult AB — Shopify-migrering: Viktors arbetsunderlag

> Senast uppdaterad: 2026-02-24
> Viktor bygger om feroxkonsult.se från Hemsida24 till Shopify.
> Fullständig SEO-audit: `docs/feroxkonsult-audit-2026.md`
> Skrapat innehåll (alla sidor): `content-pages/ferox-scraped-content.md`

---

## Företagsfakta

| Fält | Värde |
|------|-------|
| Företag | Ferox Konsult AB |
| Adress | Solsa 419, SE-149 91 NYNÄSHAMN |
| Telefon | +46 (0)8-525 093 50 |
| Org.nr | 556454-8294 |
| VAT-nr | SE556454829401 |
| Domän | feroxkonsult.se (www.feroxkonsult.se) |
| Grundat | 1997 |
| Säljer | Stämpelur (Seiko) + datorbaserat tidredovisningssystem (FeroxTid) |
| Statistik | 10 000+ sålda stämpelur, 1 200+ datorbaserade system |

---

## Migreringsöversikt

| Från | Till |
|------|------|
| Hemsida24 (FS Data / Apache) | Shopify |
| IP: 89.221.250.3 | Shopify-hosting |
| Planerat start | 2026-02-17 |

### Vad som finns på gamla sajten
- **23 svenska sidor** (23 st, se lista nedan)
- **4 danska sidor** (da-DK — beslut behövs om de ska behållas)
- **4 webshop-kategorier**
- **17 produkter** med priser

---

## Sidstruktur — gammal → ny URL

### Huvudsidor (svenska)

| # | Sidnamn | Gammal URL (Hemsida24) | Ny URL (Shopify) |
|---|---------|------------------------|------------------|
| 1 | Startsida | `/sv-SE` | `/` |
| 2 | Stämpelur | `/sv-SE/stämpelur-20359275` | `/pages/stampelur` |
| 3 | Tidredovisning | `/sv-SE/tidredovisning-20359270` | `/pages/tidredovisning` |
| 4 | Webshop | `/sv-SE/webshop-20359310` | `/collections/all` |
| 5 | Support | `/sv-SE/support-20425284` | `/pages/support` |
| 6 | Integritetspolicy | `/sv-SE/integritetspolicy-39607311` | `/policies/privacy-policy` |
| 7 | GDPR | `/sv-SE/gdpr-39657435` | `/pages/gdpr` |
| 8 | Kontakt | `/sv-SE/kontakt-20359294` | `/pages/kontakt` |
| 9 | Personalregister | `/sv-SE/tidredovisning/personalregister-21856345` | `/pages/personalregister` |
| 10 | Avtal, beräkningar | `/sv-SE/tidredovisning/avtal,-beräkningar-21729991` | `/pages/avtal-berakningar` |
| 11 | Schema | `/sv-SE/tidredovisning/schema-21734684` | `/pages/schema` |
| 12 | Export till lön | `/sv-SE/tidredovisning/export-till-lön-21735121` | `/pages/export-till-lon` |
| 13 | Frånvarohantering | `/sv-SE/tidredovisning/frånvarohantering-21735791` | `/pages/franvarohantering` |
| 14 | Terminaler | `/sv-SE/tidredovisning/terminaler-registrering-21736733` | `/pages/terminaler` |
| 15 | Stämpla i mobilen | `/sv-SE/tidredovisning/stämpla-i-mobilen-28893713` | `/pages/stampla-i-mobilen` |
| 16 | Rapporter | `/sv-SE/tidredovisning/rapporter-21736758` | `/pages/rapporter` |
| 17 | Personalliggare | `/sv-SE/tidredovisning/personalliggare-22027575` | `/pages/personalliggare` |
| 18 | Närvarotablå | `/sv-SE/tidredovisning/närvarotablå-21878463` | `/pages/narvarotabla` |
| 19 | Projekt & Kostnadsställen | `/sv-SE/tidredovisning/projekt-och-kostnadsställen-21868311` | `/pages/projekt-kostnadsstallen` |
| 20 | Order till leverans | `/sv-SE/tidredovisning/order-till-leverans-21736768` | `/pages/leveransprocess` |
| 21 | Pris | `/sv-SE/tidredovisning/pris-21736787` | `/pages/priser` |
| 22 | Om FeroxTid | `/sv-SE/tidredovisning/om-feroxtid-21889998` | `/pages/om-feroxtid` |
| 23 | Demonstration | `/sv-SE/tidredovisning/demonstration-21890214` | `/pages/demonstration` |

### Danska sidor (beslut behövs)

| # | Sidnamn | Gammal URL | Ny URL |
|---|---------|------------|--------|
| 1 | DK Startsida | `/da-DK` | `/pages/dk` eller eget subdomain |
| 2 | DK Stempelure | `/da-DK/stempelure-21050851` | `/pages/dk-stempelure` |
| 3 | DK Webshop | `/da-DK/webshop-20402950` | `/pages/dk-webshop` |
| 4 | DK Kontakt | `/da-DK/kontakt-os-20402951` | `/pages/dk-kontakt` |

### Webshop-kategorier (collections i Shopify)

| Kategori | Gammal URL | Ny URL (Shopify) |
|----------|------------|------------------|
| Alla produkter | `/store` | `/collections/all` |
| Stämpelur | `/store/category/stämpelur-186589` | `/collections/stampelur` |
| Stämpelkort | `/store/category/stämpelkort-186593` | `/collections/stampelkort` |
| Övriga tillbehör stämpelur | `/store/category/övriga-tillbehör-stämpelur-190765` | `/collections/tillbehor-stampelur` |
| Tidredovisning tillbehör | `/store/category/tidredovisning-tillbehör-192093` | `/collections/tillbehor-tidredovisning` |

---

## Alla 17 produkter

| Artnr | Produktnamn | Pris (SEK) | Kategori | Shopify-slug |
|-------|-------------|------------|----------|--------------|
| 1002 | K675 (stämpelklocka) | 4 655 | Stämpelur | `stampelklocka-k675` |
| 1003 | Z120 (stämpelklocka) | 4 130 | Stämpelur | `stampelklocka-z120` |
| 1020 | TP-6 (Seiko Kalkylur) | 4 180 | Stämpelur | `kalkylur-tp6` |
| 1070 | Kortfack/Cardrack QR395/QR7550/Z120/K675 | 422 | Tillbehör | `kortfack-cardrack` |
| 1203 | Stämpelkort Z120 (100 st) | 224 | Stämpelkort | `stampelkort-z120-100` |
| 1204 | Stämpelkort QR350/QR550/QR395 (100 st) | 207 | Stämpelkort | `stampelkort-qr350-100` |
| 1232 | Stämpelkort QR375/QR395/QR475/QR7550/K675 (100 st) | 288 | Stämpelkort | `stampelkort-qr375-100` |
| 1250 | Färgband QR375/QR395/TP20/Z120 | 285 | Tillbehör | `fargband-qr375` |
| 1251 | Färgband K600/K675 | 480 | Tillbehör | `fargband-k600` |
| 1255 | Färgband QR120/QR475/QR550/QR6560 | 409 | Tillbehör | `fargband-qr120` |
| 1260 | Färgband QR7550 & ZWS500 | 584 | Tillbehör | `fargband-qr7550` |
| 1280 | Nyckel Seiko | 123 | Tillbehör | `nyckel-seiko` |
| 1287 | Nyckel K675 | 104 | Tillbehör | `nyckel-k675` |
| 2355 | RFID Tagg | 32 | Tidredovisning tillbehör | `rfid-tagg` |
| 2402 | Extra anställda FeroxTid | 170 | Tidredovisning tillbehör | `extra-anstallda-feroxtid` |
| 2700 | Extra Utbildning FeroxTid/TimeLOG | 900 | Tidredovisning tillbehör | `utbildning-feroxtid` |
| 4100 | Support FeroxTid/TimeLOG | 1 400 | Tidredovisning tillbehör | `support-feroxtid` |

---

## Redirects.csv — redo att importera i Shopify

Shopify Admin > Online Store > Navigation > URL Redirects > Import

```csv
Redirect from,Redirect to
/sv-SE,/
/sv-SE/stämpelur-20359275,/pages/stampelur
/sv-SE/tidredovisning-20359270,/pages/tidredovisning
/sv-SE/webshop-20359310,/collections/all
/sv-SE/support-20425284,/pages/support
/sv-SE/integritetspolicy-39607311,/policies/privacy-policy
/sv-SE/gdpr-39657435,/pages/gdpr
/sv-SE/kontakt-20359294,/pages/kontakt
/sv-SE/tidredovisning/personalregister-21856345,/pages/personalregister
/sv-SE/tidredovisning/avtal%2C-ber%C3%A4kningar-21729991,/pages/avtal-berakningar
/sv-SE/tidredovisning/schema-21734684,/pages/schema
/sv-SE/tidredovisning/export-till-l%C3%B6n-21735121,/pages/export-till-lon
/sv-SE/tidredovisning/fr%C3%A5nvarohantering-21735791,/pages/franvarohantering
/sv-SE/tidredovisning/terminaler-registrering-21736733,/pages/terminaler
/sv-SE/tidredovisning/st%C3%A4mpla-i-mobilen-28893713,/pages/stampla-i-mobilen
/sv-SE/tidredovisning/rapporter-21736758,/pages/rapporter
/sv-SE/tidredovisning/personalliggare-22027575,/pages/personalliggare
/sv-SE/tidredovisning/n%C3%A4rvarotabl%C3%A5-21878463,/pages/narvarotabla
/sv-SE/tidredovisning/projekt-och-kostnadsst%C3%A4llen-21868311,/pages/projekt-kostnadsstallen
/sv-SE/tidredovisning/order-till-leverans-21736768,/pages/leveransprocess
/sv-SE/tidredovisning/pris-21736787,/pages/priser
/sv-SE/tidredovisning/om-feroxtid-21889998,/pages/om-feroxtid
/sv-SE/tidredovisning/demonstration-21890214,/pages/demonstration
/da-DK,/pages/dk
/da-DK/stempelure-21050851,/pages/dk-stempelure
/da-DK/webshop-20402950,/pages/dk-webshop
/da-DK/kontakt-os-20402951,/pages/dk-kontakt
/store,/collections/all
/store/category/st%C3%A4mpelur-186589,/collections/stampelur
/store/category/st%C3%A4mpelkort-186593,/collections/stampelkort
/store/category/%C3%B6vriga-tillbeh%C3%B6r-st%C3%A4mpelur-190765,/collections/tillbehor-stampelur
/store/category/tidredovisning-tillbeh%C3%B6r-192093,/collections/tillbehor-tidredovisning
/store/p/0/artnr-1002-k675-1041504,/products/stampelklocka-k675
/store/p/0/artnr-1003-z120-1041505,/products/stampelklocka-z120
/store/p/0/artnr-1020-tp6-1041506,/products/kalkylur-tp6
```

---

## SEO-krav vid migrering

### Kritiskt (utan dessa tappar sajten ranking)
- [ ] DNS: feroxkonsult.se (apex) redirectar till www.feroxkonsult.se
- [ ] SSL: Shopify hanterar automatiskt — verifiera att det funkar
- [ ] Alla 50+ redirects inlagda (via redirects.csv ovan)
- [ ] Alla sidor har unik title tag
- [ ] Alla sidor har unik meta description

### Högt (påverkar ranking direkt)
- [ ] H1 på ALLA sidor — 9 sidor saknar H1 på gamla sajten (se lista nedan)
- [ ] Fixa duplicerad title: "Stämpla i mobilen" har samma title som "Terminaler" — måste fixas
- [ ] Schema.org Organisation-markup i theme.liquid
- [ ] Schema.org Product-markup på alla produktsidor (automatiskt i Shopify-teman)
- [ ] Schema.org LocalBusiness på kontaktsidan

### Medel
- [ ] Alt-text på alla produktbilder (beskrivande, inte tom alt="")
- [ ] Breadcrumb-navigation (de flesta Shopify-teman har inbyggd)
- [ ] Interna länkar mellan undersidor (Tidredovisning-undersidorna ska länka till varandra)

### Sidor som saknar H1 (ska fixas vid innehållsinläggning)
| Sida | Ny Shopify-URL |
|------|----------------|
| Webshop | `/collections/all` (collections har automatisk H1) |
| Support | `/pages/support` |
| Integritetspolicy | `/policies/privacy-policy` |
| GDPR | `/pages/gdpr` |
| Kontakt | `/pages/kontakt` |
| Om FeroxTid | `/pages/om-feroxtid` |
| DK Webshop | `/pages/dk-webshop` |
| DK Kontakt | `/pages/dk-kontakt` |

---

## Bilder att ladda ner

**Innan Hemsida24-kontot stängs — ladda ner ALLA bilder.**
Bilder ligger på CloudFront CDN: `dst15js82dk7j.cloudfront.net` och `dbvjpegzift59.cloudfront.net`

Uppskattningsvis 30-40 unika bilder:
- Produktbilder (stämpelklockor K675, Z120, TP-6)
- Stämpelkort-bilder (varianterna)
- Skärmdumpar av FeroxTid-systemet
- Terminalbilder (touch, RFID, fingeravtryck)
- Mobilapp-skärmdumpar
- Logo + favicon

---

## Checklista — vad är klart vs återstår

> Viktor: uppdatera denna löpande

### Shopify-setup
- [ ] Shopify-konto skapat
- [ ] feroxkonsult.se kopplad till Shopify
- [ ] Tema valt och installerat
- [ ] Grundläggande tema-inställningar (färger, logo, typsnitt)

### Produkter och kategorier
- [ ] 4 collections skapade (stampelur, stampelkort, tillbehor-stampelur, tillbehor-tidredovisning)
- [ ] Alla 17 produkter inlagda med SEO-slug, pris, artnr, bilder, alt-text
- [ ] Produktbeskrivningar skrivna (be Claude skriva baserat på gamla sajten)

### Informationssidor (Pages)
- [ ] Startsida (/)
- [ ] /pages/stampelur
- [ ] /pages/tidredovisning (ingångssida med länkar till alla undersidor)
- [ ] /pages/support
- [ ] /policies/privacy-policy
- [ ] /pages/gdpr
- [ ] /pages/kontakt
- [ ] /pages/personalregister
- [ ] /pages/avtal-berakningar
- [ ] /pages/schema
- [ ] /pages/export-till-lon
- [ ] /pages/franvarohantering
- [ ] /pages/terminaler
- [ ] /pages/stampla-i-mobilen
- [ ] /pages/rapporter
- [ ] /pages/personalliggare
- [ ] /pages/narvarotabla
- [ ] /pages/projekt-kostnadsstallen
- [ ] /pages/leveransprocess
- [ ] /pages/priser
- [ ] /pages/om-feroxtid
- [ ] /pages/demonstration

### SEO
- [ ] Redirects.csv importerad (50+ redirects)
- [ ] Alla title tags ifyllda
- [ ] Alla meta descriptions ifyllda
- [ ] H1 på alla sidor
- [ ] Schema Organisation i theme.liquid
- [ ] Alt-text på alla bilder
- [ ] Google Search Console: verifiera ny sajt, skicka sitemap
- [ ] Google Analytics migrerad (ny GA4-property eller uppdatera befintlig)
- [ ] Facebook Pixel migrerad

### Tekniskt
- [ ] DNS feroxkonsult.se (apex) → www.feroxkonsult.se (Shopify hanterar)
- [ ] SSL verifierat
- [ ] Sitemap.xml genereras korrekt (automatisk i Shopify)
- [ ] Mobiltest av alla viktiga sidor
- [ ] Kontaktformulär testat (kontakt + demonstration)

---

## Innehållsstruktur på Shopify — navigationsmenyn

**Huvudnavigation:**
```
Stämpelur | Tidredovisning | Webshop | Support | Kontakt
```

**Tidredovisning (dropdown):**
```
Om FeroxTid
Personalregister
Avtal & beräkningar
Schema
Export till lön
Frånvarohantering
Terminaler
Stämpla i mobilen
Rapporter
Personalliggare
Närvarotablå
Projekt & kostnadsställen
Priser
Leveransprocess
Demonstration
```

**Footer:**
```
Ferox Konsult AB
Solsa 419, SE-149 91 Nynäshamn
+46 (0)8-525 093 50
Org.nr: 556454-8294

Integritetspolicy | GDPR
Copyright © 1997–2026 Ferox Konsult AB
```

---

## Snabbguide: Shopify-specifika saker Viktor kan be Claude om

**Tema-anpassning:**
- "Skriv Liquid-kod för att lägga till schema Organisation i theme.liquid"
- "Hur lägger jag till en custom section med hero-bild på startsidan?"
- "Skriv CSS för att ändra knappfärgen till #003366"

**Innehåll:**
- "Skriv produktbeskrivning för K675 stämpelklocka baserat på: [klistra in gammal text]"
- "Skriv om /pages/franvarohantering — den gamla texten är för kort, utöka med fördelar och use cases"
- "Skriv title + meta description för /pages/personalliggare med nyckelord personalliggare"

**Redirects:**
- "Kontrollera att min redirects.csv är korrekt formaterad för Shopify-import"

**SEO-checklista:**
- "Kör SOP-checklistan för SEO Basic mot feroxkonsult.se"
