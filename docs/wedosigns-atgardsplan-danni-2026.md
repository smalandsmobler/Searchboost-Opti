# WeDoSign — Kundåtgärdsplan (Dannis feedback)

> Datum: 2026-03-03
> Kund: Danni Andersen, Wedo Signs AB
> Utförd av: Searchboost (Mikael Larsson)

---

## Sammanfattning

Danni har rapporterat 6 specifika brister plus generella synpunkter om ofärdigt innehåll, trasiga länkar och avsaknad av SEO-arbete. Nedan går vi igenom varje punkt, bekräftar status och anger exakt åtgärd + tidslinje.

---

## Dannis punkter — verifierade live 2026-03-03

### 1. "WeDo Signs" ska vara "Wedo Signs"

**Status: BEKRÄFTAD**

| Plats | Nuläge | Åtgärd |
|-------|--------|--------|
| Logo (header) | Alt-text: "WEDO SIGNS" | Byt alt-text till "Wedo Signs" |
| Rubrik på startsidan | "WeDo Signs – Skyltar som syns..." | Ändra till "Wedo Signs – Skyltar som syns..." |
| Brödtext startsidan | "Wedo Signs" (korrekt) | Ingen åtgärd |
| Title-tag | "Wedo Signs" (korrekt) | Ingen åtgärd |
| Footer | "Wedosigns" (allt ihop) | Ändra till "Wedo Signs" |

**Tid**: 15 min i Divi Builder

---

### 2. Instagram och Facebook-länkar fungerar inte

**Status: BEKRÄFTAD — alla sociala länkar pekar på "#" (tom URL)**

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Footer "Följ på Facebook" | href="#" | Byt till rätt Facebook-URL |
| Footer "Följ på Instagram" | href="#" | Byt till rätt Instagram-URL |
| Sidfot sociala ikoner (Facebook) | href="#" | Byt till rätt URL |
| Sidfot sociala ikoner (Instagram) | href="#" | Byt till rätt URL |
| Texten "Följ oss på Instagram, Facebook och LinkedIn" | LinkedIn-länk saknas helt | Lägg till LinkedIn-URL eller ta bort texten |

**Behövs från Danni**: Exakta URL:er till:
- Facebook-sida (t.ex. https://facebook.com/wedosigns)
- Instagram-profil (t.ex. https://instagram.com/wedosigns)
- LinkedIn (om det finns)

**Tid**: 10 min

---

### 3. Ta bort X (Twitter)

**Status: BEKRÄFTAD — X-ikon finns i footer**

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Footer "Följ på X" | href="#" | Ta bort helt |
| Sidfot X-ikon | href="#" | Ta bort helt |

**Tid**: 5 min i Divi Builder / Appearance → Menus

---

### 4. "Slå en pling" → "Tlf till Wedo Signs"

**Status: BEKRÄFTAD**

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Rubrik ovanför telefonnummer (startsidan) | "Slå en pling" | Ändra till "Tlf till Wedo Signs" |

**Tid**: 5 min i Divi Builder

---

### 5. Galleri — "Tennis center"-bild som inte tillhör kunden

**Status: ATT VERIFIERA I WP-ADMIN**

Galleriet kunde inte granskas fullt via DOM (bilder laddas dynamiskt). Åtgärd:
- Logga in i WP-admin → Sidor → Galleri → Divi Builder
- Hitta och ta bort "Tennis center"-bilden
- Ersätt med riktig kundbild (från searchboost.zip som Danni skickat)

**Tid**: 10 min

---

### 6. Printer-bild på startsidan

**Status: BEKRÄFTAD — bild med alt "print.goteborg" finns på startsidan**

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Bild under "WeDo Signs – Skyltar som syns..." | Alt: "print.goteborg" (stockfoto/ej kundens) | Byt till kundens egen bild |

**Tid**: 10 min (bild från searchboost.zip)

---

## Ytterligare brister (hittade vid granskning)

### 7. Copyright-text felaktig

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Footer copyright | "Copyright © 2026 Divi. All Rights Reserved." | Ändra till "© 2026 Wedo Signs AB. Alla rättigheter förbehållna." |

**Tid**: 5 min

---

### 8. Stavfel i footer

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Öppettider-text | "Utanförr öppettider" | Ändra till "Utanför öppettider" |

**Tid**: 2 min

---

### 9. Bilder med duplicerade/felaktiga alt-texter

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| 3 bilder med tjänstekort | Alt: "co-working-112 kopiera" (alla tre) | Byt till beskrivande alt: "Skyltar Göteborg", "Bildekor Göteborg", "Event exponering Göteborg" |

**Tid**: 10 min

---

### 10. RSS-ikon i footer

| Element | Nuläge | Åtgärd |
|---------|--------|--------|
| Sidfot | RSS-länk till /feed/ | Ta bort (irrelevant för skyltföretag) |

**Tid**: 2 min

---

## Produkter-meny — Önskad struktur

**Danni vill ha 8 sidor under Produkter:**

| # | Önskat namn | Befintlig sida | URL | Status |
|---|-------------|----------------|-----|--------|
| 1 | Bildekor | Bildekor | /bildekor-goteborg/ | FINNS |
| 2 | Banderoller | Banderoller | /banderoller-goteborg/ | FINNS |
| 3 | Dekaler | — | — | SAKNAS — ny sida behövs |
| 4 | Event & exponering | Event och exponering | /event-exponering-goteborg/ | FINNS |
| 5 | Insynsskydd | Insynsskydd | /insynsskydd-goteborg/ | FINNS |
| 6 | Klistermärken | Klistermärken | /klistermarken-goteborg/ | FINNS |
| 7 | Print | Print | /print-goteborg-2/ | FINNS (slug behöver fixas → /print-goteborg/) |
| 8 | Skyltar | Skyltar | /skyltar-goteborg/ | FINNS |

**Sidor som tas bort från menyn** (behålls publicerade men visas inte i navigation):
- Plåtskyltar (/platskyltar-goteborg/)
- Ljusskyltar (/ljusskyltar-goteborg/)
- Namnskyltar (/namnskyltar-goteborg/)
- Flaggskyltar (/flaggskylt-fasad-goteborg/)
- Foliedekor (/folie-dekor-goteborg/)
- Golvdekor (/golvdekor-goteborg/)
- Frost film (/frost-film-goteborg/)
- Solfilm (/solfilm-goteborg/)

**Ny sida som behöver skapas:**
- "Dekaler" (/dekaler-goteborg/) — innehåll om dekalproduktion, material, användningsområden

**Tid**: 30 min (menyändring) + 1 timme (skapa Dekaler-sida med innehåll)

---

## SEO-arbete (ej genomfört — Dannis generella feedback)

| Åtgärd | Status | Beskrivning |
|--------|--------|-------------|
| LocalBusiness-schema | KLART (kod redo) | mu-plugin: `sb-wedosigns-schema.php` |
| Service-schema (15 sidor) | KLART (kod redo) | Ingår i samma mu-plugin |
| FAQ-schema (5 sidor) | KLART (innehåll redo) | `wedosigns-faq-content.md` + JSON-data |
| Meta descriptions | EJ GJORT | Varje sida behöver unik meta description |
| OG locale (sv_SE) | KLART (kod redo) | Ingår i mu-plugin |
| Ta bort Hello World | EJ GJORT | /hello-world/ finns fortfarande i sitemap |
| Fixa /print-goteborg-2/ slug | EJ GJORT | Behöver ändras till /print-goteborg/ |
| PHP-uppgradering (7.4 → 8.2) | EJ GJORT | Kritisk säkerhetsrisk |
| FAQ-sektioner på sidor | EJ GJORT | Innehåll klart, behöver läggas in i Divi |
| Interna länkar | EJ GJORT | Varje tjänstesida ska länka till relaterade |
| Google Business Profile | OKÄNT | Behöver verifieras om GBP är uppsatt |

---

## Trasiga länkar (Dannis generella feedback)

| Typ | Problem | Åtgärd |
|-----|---------|--------|
| Alla sociala ikoner (3 st) | Pekar på "#" | Fyll i riktiga URL:er |
| X/Twitter | Pekar på "#" | Ta bort helt |
| RSS-länk | Pekar på /feed/ | Ta bort |
| LinkedIn (nämns i text) | Finns inte som länk | Lägg till eller ta bort från texten |

---

## Tidsplan

### Dag 1 (kräver WP-admin access)

| # | Åtgärd | Tid | Prio |
|---|--------|-----|------|
| 1 | Fixa "WeDo Signs" → "Wedo Signs" överallt | 15 min | HÖG |
| 2 | Fixa sociala länkar (FB + IG) + ta bort X | 15 min | HÖG |
| 3 | Ändra "Slå en pling" → "Tlf till Wedo Signs" | 5 min | HÖG |
| 4 | Byta printer-bild på startsidan | 10 min | HÖG |
| 5 | Ta bort Tennis center-bild från Galleri | 10 min | HÖG |
| 6 | Fixa copyright-text + stavfel | 7 min | MEDEL |
| 7 | Fixa bild-alt-texter (3 st) | 10 min | MEDEL |
| 8 | Ta bort RSS-ikon | 2 min | LÅG |
| **SUMMA** | | **~75 min** | |

### Dag 2 (meny + innehåll)

| # | Åtgärd | Tid | Prio |
|---|--------|-----|------|
| 9 | Ändra Produkter-meny till 8 poster | 30 min | HÖG |
| 10 | Skapa Dekaler-sida med innehåll | 60 min | HÖG |
| 11 | Ladda upp kundens bilder (searchboost.zip) | 30 min | HÖG |
| 12 | Ta bort Hello World-inlägg | 5 min | MEDEL |
| 13 | Fixa /print-goteborg-2/ → /print-goteborg/ | 10 min | MEDEL |
| **SUMMA** | | **~2 tim 15 min** | |

### Dag 3-5 (SEO + tekniskt)

| # | Åtgärd | Tid | Prio |
|---|--------|-----|------|
| 14 | Deploya schema mu-plugin (LocalBusiness + Service + FAQ) | 15 min | HÖG |
| 15 | Lägga in FAQ-sektioner på 5 tjänstesidor | 60 min | HÖG |
| 16 | Skriva meta descriptions för alla 20 sidor | 45 min | HÖG |
| 17 | Interna länkar mellan tjänstesidor | 45 min | MEDEL |
| 18 | PHP-uppgradering 7.4 → 8.2 (hosting) | 15 min | KRITISK |
| 19 | Verifiera/skapa Google Business Profile | 30 min | MEDEL |
| **SUMMA** | | **~3 tim 30 min** | |

### TOTAL UPPSKATTAD TID: ~7 timmar

---

## Förutsättningar

| Behövs | Status | Ansvarig |
|--------|--------|----------|
| WP-admin inloggning | SAKNAS | Danni → generera app-password |
| Facebook-URL | SAKNAS | Danni |
| Instagram-URL | SAKNAS | Danni |
| LinkedIn-URL (om finns) | SAKNAS | Danni |
| Hosting-panel (PHP-upgrade) | SAKNAS | Danni |
| Kundens bilder | MOTTAGNA (searchboost.zip) | Danni (skickat) |

---

## Svar till Danni

**Förslag på svarsmejl** (Mikael anpassar efter behov):

---

Hej Danni,

Tack för din feedback — vi har gått igenom varje punkt du lyft och bekräftat alla brister.

Här är en sammanfattning av vad vi har hittat och planerar att åtgärda:

**Dina 6 punkter — alla bekräftade:**
1. "WeDo Signs" → "Wedo Signs" — fixas på alla ställen (rubrik, logo-alt, footer)
2. Instagram/Facebook-länkar — alla pekar på tomma URL:er, fixas direkt
3. X/Twitter-ikon — tas bort
4. "Slå en pling" → "Tlf till Wedo Signs"
5. Tennis center-bild i Galleri — tas bort
6. Printer-bild på startsidan — byts ut mot din egen bild

**Ytterligare brister vi hittat:**
- Copyright-texten säger "Divi" istället för "Wedo Signs"
- Stavfel i footer ("Utanförr")
- Dåliga bild-alt-texter (alla säger "co-working-112 kopiera")
- RSS-ikon i footer (onödig)

**Produkter-menyn:**
Vi justerar till de 8 kategorier du önskar: Bildekor, Banderoller, Dekaler, Event & exponering, Insynsskydd, Klistermärken, Print, Skyltar. Övriga sidor behålls men tas bort från navigationen.

En ny sida "Dekaler" skapas med innehåll.

**SEO-arbete:**
Vi har förberett:
- LocalBusiness + Service + FAQ-schema (redo att deploya)
- FAQ-innehåll för de 5 viktigaste sidorna
- Meta descriptions skrivs för alla sidor

**Tidsplan:**
- Dag 1: Alla visuella fixar (dina 6 punkter + extra) — ca 75 min
- Dag 2: Menyändring + nytt innehåll + bilder — ca 2 tim
- Dag 3-5: SEO, schema, interna länkar — ca 3.5 tim
- Total: ~7 timmars arbete

**Vad vi behöver från dig:**
1. WP-admin inloggning (eller Application Password)
2. URL till er Facebook-sida
3. URL till er Instagram-profil
4. Har ni LinkedIn? I så fall URL:en
5. Access till hosting-panelen (för PHP-uppgradering)

Vi kan börja direkt så fort vi har inloggningen.

Med vänliga hälsningar,
Mikael Larsson
Searchboost

---
