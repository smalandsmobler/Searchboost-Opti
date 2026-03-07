# WeDoSign SEO Fix-plan — 2026-03-03 (v2 — Dannis feedback integrerad)

## Nuläge

| Parameter | Värde |
|-----------|-------|
| URL | wedosigns.se |
| CMS | WordPress + Divi 4.27.6 |
| SEO-plugin | Rank Math |
| Sidor i sitemap | 20 pages + 1 post (Hello World) |
| PHP | 7.4.33 (EOL — KRITISKT) |
| Schema | Organization + WebSite + WebPage + Article (generiskt) |
| LocalBusiness | SAKNAS |
| Service-schema | SAKNAS |
| FAQ-schema | SAKNAS |

---

## Alla sidor (nuvarande + ny)

| # | URL | Typ | I meny |
|---|-----|-----|--------|
| 1 | / | Startsida | Ja |
| 2 | /skyltar-goteborg/ | Tjänst | Ja (Produkter) |
| 3 | /platskyltar-goteborg/ | Tjänst | Nej (dold) |
| 4 | /ljusskyltar-goteborg/ | Tjänst | Nej (dold) |
| 5 | /namnskyltar-goteborg/ | Tjänst | Nej (dold) |
| 6 | /flaggskylt-fasad-goteborg/ | Tjänst | Nej (dold) |
| 7 | /klistermarken-goteborg/ | Tjänst | Ja (Produkter) |
| 8 | /folie-dekor-goteborg/ | Tjänst | Nej (dold) |
| 9 | /golvdekor-goteborg/ | Tjänst | Nej (dold) |
| 10 | /frost-film-goteborg/ | Tjänst | Nej (dold) |
| 11 | /insynsskydd-goteborg/ | Tjänst | Ja (Produkter) |
| 12 | /solfilm-goteborg/ | Tjänst | Nej (dold) |
| 13 | /print-goteborg-2/ → /print-goteborg/ | Tjänst | Ja (Produkter) |
| 14 | /event-exponering-goteborg/ | Tjänst | Ja (Produkter) |
| 15 | /banderoller-goteborg/ | Tjänst | Ja (Produkter) |
| 16 | /bildekor-goteborg/ | Tjänst | Ja (Produkter) |
| 17 | /dekaler-goteborg/ | Tjänst (NY SIDA) | Ja (Produkter) |
| 18 | /produkter/ | Översikt | Ja |
| 19 | /offerter-wedosigns/ | Kontakt/Offert | Ja |
| 20 | /galleri/ | Portfolio | Ja |
| 21 | /om-oss/ | Om företaget | Ja |

**Ska raderas:** /hello-world/ (default WordPress-inlägg)

---

## Produkter-meny (Dannis önskan)

**8 poster i menyn:**
1. Bildekor → /bildekor-goteborg/
2. Banderoller → /banderoller-goteborg/
3. Dekaler → /dekaler-goteborg/ (NY SIDA)
4. Event & exponering → /event-exponering-goteborg/
5. Insynsskydd → /insynsskydd-goteborg/
6. Klistermärken → /klistermarken-goteborg/
7. Print → /print-goteborg/ (slug-fix från -2)
8. Skyltar → /skyltar-goteborg/

**Dolda sidor** (behålls publicerade, tas bort från navigation):
- Plåtskyltar, Ljusskyltar, Namnskyltar, Flaggskyltar
- Foliedekor, Golvdekor, Frost film, Solfilm

---

## PRIO 1 — Dannis 6 punkter + extra brister (Dag 1 — ~75 min)

### 1.1 "WeDo Signs" → "Wedo Signs" (BEKRÄFTAD)

| Plats | Nuläge | Åtgärd |
|-------|--------|--------|
| Rubrik startsidan | "WeDo Signs – Skyltar som syns..." | Ändra till "Wedo Signs" |
| Logo alt-text | "WEDO SIGNS" | Ändra till "Wedo Signs" |
| Footer | "Wedosigns" (ihopskrivet) | Ändra till "Wedo Signs" |
| Title-tag | "Wedo Signs" (korrekt) | Ingen åtgärd |
| Brödtext | "Wedo Signs" (korrekt) | Ingen åtgärd |

**Tid**: 15 min

### 1.2 Sociala länkar (BEKRÄFTAD — alla pekar på "#")

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| "Följ på Facebook" | href="#" | Byt till riktigt URL |
| "Följ på Instagram" | href="#" | Byt till riktigt URL |
| Footer Facebook-ikon | href="#" | Byt till riktigt URL |
| Footer Instagram-ikon | href="#" | Byt till riktigt URL |
| LinkedIn (nämns i text) | Ingen länk | Lägg till URL eller ta bort texten |

**Behövs från Danni**: Facebook-URL, Instagram-URL, LinkedIn-URL (om finns)
**Tid**: 10 min

### 1.3 Ta bort X/Twitter (BEKRÄFTAD)

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| "Följ på X" i footer | href="#" | Ta bort helt |
| Footer X-ikon | href="#" | Ta bort helt |

**Tid**: 5 min

### 1.4 "Slå en pling" → "Tlf till Wedo Signs" (BEKRÄFTAD)

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Rubrik ovanför telefonnummer | "Slå en pling" | Ändra till "Tlf till Wedo Signs" |

**Tid**: 5 min

### 1.5 Tennis center-bild i Galleri (ATT VERIFIERA I WP-ADMIN)

- Galleriet laddar bilder dynamiskt — kunde inte verifiera fullt via DOM
- Åtgärd: WP-admin → Sidor → Galleri → Divi Builder → hitta och ta bort
- Ersätt med kundens egen bild (från searchboost.zip)

**Tid**: 10 min

### 1.6 Printer-bild på startsidan (BEKRÄFTAD)

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Bild under rubrik | Alt: "print.goteborg" (stockfoto) | Byt till kundens egen bild |

**Tid**: 10 min

### 1.7 Copyright-text felaktig (EXTRA)

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Footer copyright | "Copyright © 2026 Divi. All Rights Reserved." | Ändra till "© 2026 Wedo Signs AB. Alla rättigheter förbehållna." |

**Tid**: 5 min

### 1.8 Stavfel i footer (EXTRA)

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Öppettider-text | "Utanförr öppettider" | Ändra till "Utanför öppettider" |

**Tid**: 2 min

### 1.9 Bild-alt-texter (EXTRA)

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| 3 tjänstekort-bilder | Alla: "co-working-112 kopiera" | Byt till: "Skyltar Göteborg", "Bildekor Göteborg", "Event exponering Göteborg" |

**Tid**: 10 min

### 1.10 RSS-ikon i footer (EXTRA)

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| RSS-länk | Pekar på /feed/ | Ta bort helt (irrelevant) |

**Tid**: 2 min

**TOTAL DAG 1: ~75 min**

---

## PRIO 2 — Meny + nytt innehåll + bilder (Dag 2 — ~2 tim 15 min)

### 2.1 Produkter-meny
Ändra från 15 → 8 poster i navigation (se menystruktur ovan).
Sidor som tas bort från menyn behålls publicerade.

**Tid**: 30 min

### 2.2 Skapa Dekaler-sida
Ny sida /dekaler-goteborg/ med komplett innehåll.
Se: `content-pages/wedosigns-dekaler-goteborg.md`

Innehåll:
- H1: Dekaler i Göteborg
- 5 x H2-sektioner: typer, material, process, priser, FAQ
- FAQ med 5 frågor
- Interna länkar till relaterade tjänster

SEO-metadata:
- Title: Dekaler i Göteborg | Skräddarsydda dekaler för företag — Wedo Signs
- Meta description: Beställ dekaler i Göteborg. Vi producerar företagsdekaler, bildekor, fönsterdekaler och produktmärkning med hållbar vinylfolie.
- Focus keyword: dekaler göteborg

**Tid**: 60 min

### 2.3 Ladda upp kundens bilder
Bilderna från searchboost.zip (142 MB) — ersätta stockfoton och felaktiga bilder.

**Tid**: 30 min

### 2.4 Ta bort Hello World
WP-admin → Inlägg → "Hello World" → Papperskorgen

**Tid**: 5 min

### 2.5 Fixa /print-goteborg-2/ → /print-goteborg/
Byt slug, Rank Math skapar redirect automatiskt.

**Tid**: 10 min

**TOTAL DAG 2: ~2 tim 15 min**

---

## PRIO 3 — SEO + tekniskt (Dag 3-5 — ~3 tim 30 min)

### 3.1 Deploy schema mu-plugin
Fil: `content-pages/wedosigns-schema-muplugin.php` (v1.1)
→ Ladda upp till `/wp-content/mu-plugins/sb-wedosigns-schema.php`

Innehåller:
- LocalBusiness-schema (startsidan)
- Service-schema (17 tjänstesidor inkl dekaler + print)
- FAQ-schema (via sb_faq_data custom field)
- OG locale fix (sv_SE)
- Article-schema cleanup på tjänstesidor

**Tid**: 15 min

### 3.2 FAQ-sektioner på 5 tjänstesidor + Dekaler
Lägga in FAQ-innehåll via Divi Builder + spara JSON i sb_faq_data.
Se: `content-pages/wedosigns-faq-content.md`

Sidor:
1. /skyltar-goteborg/ (5 frågor)
2. /bildekor-goteborg/ (5 frågor)
3. /ljusskyltar-goteborg/ (5 frågor)
4. /folie-dekor-goteborg/ (5 frågor)
5. /banderoller-goteborg/ (5 frågor)
6. /dekaler-goteborg/ (5 frågor — ingår i sidinnehållet)

**Tid**: 60 min

### 3.3 Meta descriptions för alla sidor
Rank Math → varje sida behöver unik meta description.

| Sida | Meta description |
|------|-----------------|
| / | Wedo Signs — skyltföretag i Göteborg. Plåtskyltar, ljusskyltar, bildekor, folie och banderoller. Begär kostnadsfri offert. |
| /skyltar-goteborg/ | Professionella skyltar i Göteborg. Plåtskyltar, ljusskyltar, flaggskyltar och fasadskyltar med lång livslängd. Begär offert från Wedo Signs. |
| /bildekor-goteborg/ | Bildekor och fordonsfoliering i Göteborg. Helfoliering, delfoliering och bilreklam med 3M-folie. Offert samma dag från Wedo Signs. |
| /banderoller-goteborg/ | Banderoller i Göteborg. PVC- och mesh-banderoller för fasad, event och reklam. Snabb leverans från Wedo Signs. |
| /klistermarken-goteborg/ | Klistermärken i Göteborg. Stickers och dekaler för reklam, produktmärkning och dekoration. Wedo Signs levererar i hela Västra Götaland. |
| /insynsskydd-goteborg/ | Insynsskydd med fönsterfolie i Göteborg. Frostad film, dekorfolie och solfilm för kontor och butik. Wedo Signs monterar. |
| /event-exponering-goteborg/ | Event och exponering i Göteborg. Roll-ups, banderoller, mässmaterial och eventproduktion för företag. Wedo Signs levererar snabbt. |
| /print-goteborg/ | Print och tryck i Göteborg. Storformatstryck, affischer, roll-ups och mässmaterial med hög kvalitet. Begär offert från Wedo Signs. |
| /dekaler-goteborg/ | Beställ dekaler i Göteborg. Företagsdekaler, bildekaler, fönsterdekaler och produktmärkning med hållbar vinylfolie. Begär offert. |
| /platskyltar-goteborg/ | Plåtskyltar i Göteborg. Hållbara skyltar för fasad, entré och vägvisning. Pulverlackerade med lång livslängd. Wedo Signs. |
| /ljusskyltar-goteborg/ | Ljusskyltar i Göteborg. LED-belysta skyltar för fasad och skyltfönster. Energieffektiva med hög synlighet. Wedo Signs. |
| /namnskyltar-goteborg/ | Namnskyltar i Göteborg. Aluminium, akryl och mässing för kontor, dörrar och reception. Wedo Signs levererar snabbt. |
| /flaggskylt-fasad-goteborg/ | Flaggskyltar och fasadskyltar i Göteborg. Dubbelsidig profil för maximal synlighet. Offert från Wedo Signs. |
| /folie-dekor-goteborg/ | Foliedekor i Göteborg. Fönsterfolie, väggdekor och fordonsdekor. Skräddarsydda lösningar från Wedo Signs. |
| /golvdekor-goteborg/ | Golvdekor och golvgrafik i Göteborg. Halkfria laminat för butiker, mässor och kontor. Wedo Signs. |
| /frost-film-goteborg/ | Frostad glasfilm i Göteborg. Frostad glasfilm för insynsskydd och dekoration. Elegant uttryck. Wedo Signs monterar. |
| /solfilm-goteborg/ | Solfilm i Göteborg. Reducerar värme och UV-strålning. Professionell montering av Wedo Signs. |
| /offerter-wedosigns/ | Begär offert från Wedo Signs i Göteborg. Snabb återkoppling på skyltar, bildekor, folie och tryck. Ring 0793-020787. |
| /galleri/ | Se exempel på vårt arbete. Skyltar, bildekor, folieringar och banderoller producerade av Wedo Signs i Göteborg. |
| /om-oss/ | Om Wedo Signs — skyltföretag i Askim, Göteborg. Vi tillverkar skyltar, bildekor, folie och tryck för företag. |

**Tid**: 45 min

### 3.4 Interna länkar
Varje tjänstesida ska länka till 2-3 relaterade tjänster + offertsidan.

| Sida | Länka till |
|------|-----------|
| /skyltar-goteborg/ | plåtskyltar, ljusskyltar, flaggskyltar, offert |
| /bildekor-goteborg/ | dekaler, folie-dekor, klistermärken, offert |
| /banderoller-goteborg/ | event-exponering, print, offert |
| /dekaler-goteborg/ | bildekor, klistermärken, folie-dekor, offert |
| /klistermarken-goteborg/ | dekaler, folie-dekor, offert |
| /insynsskydd-goteborg/ | frost-film, solfilm, offert |
| /event-exponering-goteborg/ | banderoller, print, offert |
| /print-goteborg/ | banderoller, event-exponering, offert |

**Tid**: 45 min

### 3.5 PHP-uppgradering 7.4 → 8.2
Via hosting-panelen. Kräver access från Danni.

**Tid**: 15 min

### 3.6 Google Business Profile
Verifiera om GBP finns. Om inte — skapa med:
- Namn: Wedo Signs
- Adress: Datavägen 14B, 436 32 Askim
- Kategori: Skyltföretag
- Telefon: 0793-020787
- Webb: wedosigns.se

**Tid**: 30 min

**TOTAL DAG 3-5: ~3 tim 30 min**

---

## ABC-nyckelord

**A-nyckelord** (hög sökvolym, primära):
skyltar göteborg, bildekor göteborg, skyltföretag göteborg, ljusskyltar göteborg, bilfoliering göteborg, skyltning göteborg, bildekor pris, fordonsdekor göteborg, skylttillverkare göteborg, plåtskyltar göteborg

**B-nyckelord** (medel):
neonskyltar göteborg, foliering göteborg, dekalproduktion göteborg, banderoller göteborg, dekaler göteborg, reklamskylt, skyltbelysning, företagsskyltar, fasadskylt göteborg, bilreklam göteborg, klisterdekor

**C-nyckelord** (lång svans):
golvdekor göteborg, solfilm göteborg, insynsskydd kontor, fönsterfolie företag, mässmaterial, roll-ups göteborg, frostat glas folie, bildekor design, namnskyltar dörr, eventmaterial göteborg, klistermärken göteborg

---

## Förberedda filer (redo att deploya)

| Fil | Beskrivning | Status |
|-----|-------------|--------|
| `content-pages/wedosigns-schema-muplugin.php` | mu-plugin v1.2 (LocalBusiness + Service 17 sidor + FAQ + OG) | KLAR |
| `content-pages/wedosigns-quote-button-muplugin.php` | mu-plugin v1.1 — flytande "Begär offert"-knapp (SVG-ikon, mobilvänlig) | KLAR |
| `content-pages/wedosigns-faq-content.md` | FAQ-innehåll för 5 tjänstesidor (5 frågor vardera) | KLAR |
| `content-pages/wedosigns-dekaler-goteborg.md` | Ny sida /dekaler-goteborg/ komplett innehåll + SEO | KLAR |
| `docs/wedosigns-atgardsplan-danni-2026.md` | Kundåtgärdsplan + svarsmejl till Danni | KLAR |

---

## Förutsättningar (BLOCKERANDE)

| Behövs | Status | Ansvarig |
|--------|--------|----------|
| WP-admin access | I SSM | ✅ |
| WP Application Password | I SSM | ✅ |
| Facebook-URL | SAKNAS | Danni |
| Instagram-URL | SAKNAS | Danni |
| LinkedIn-URL (om finns) | SAKNAS | Danni |
| Hosting-panel (PHP) | SAKNAS | Danni |
| GSC ägare | SAKNAS | Danni → Mikael |

---

## Deployment-ordning (när access finns)

1. Dannis 6 visuella fixar (namngivning, bilder, text)
2. Extra fixar (copyright, stavfel, alt-texter, RSS)
3. Ladda upp kundens bilder från searchboost.zip
4. Produkter-meny → 8 poster
5. Skapa Dekaler-sida
6. Hello World radering + slug-fix
7. mu-plugin deploy (schema + OG + offertknapp)
8. FAQ-sektioner + sb_faq_data
9. Meta descriptions alla 20 sidor
10. Interna länkar
11. PHP-uppgradering
12. GBP-verifiering
13. Searchboost-onboarding (app-password + keywords + GSC)

**TOTAL UPPSKATTAD TID: ~7 timmar**
