# Ferox Konsult — Shopify: Åtgärdslista och implementationsguide

> Skapad: 2026-03-14
> Butik: feroxkonsult-se.myshopify.com

---

## SVAR PÅ FRÅGORNA

### Behöver man Paysson?
Nej. Rekommendation:
- **Kreditkort**: Shopify Payments (aktivera i Settings → Payments). Funkar direkt utan extra konto. Alternativt Stripe.
- **Faktura**: Installera appen **"Klarna"** (gratis integration, kunderna väljer faktura eller delbetalning vid kassan). Alternativt appen **"Billogram"** om ni redan använder den för fakturering.

### Kan kunden välja frakt?
Ja — PostNord OCH DSV visas som valbara alternativ i kassan. Shopify visar alla aktiva fraktmetoder och kunden väljer.

---

## A. MOMSHANTERING — INSTÄLLNINGAR

### A1. Settings → Taxes and duties
- **"Charge taxes on shipping rates"** = ON
- **"Include tax in prices"** = **OFF** (priserna är ex moms → moms läggs på vid kassan)
- **"Show all prices with tax"** = OFF

→ Nu försvinner texten "skatter ingår" / "Tax included" på produktsidorna. ✅

### A2. Settings → Markets — Skapa marknader

Behåll Sverige som primärmarknad. Skapa sedan:

| Marknad | Länder | Moms | Valuta |
|---------|--------|------|--------|
| Sverige | SE | 25% | SEK |
| Finland | FI | 25,5% (varor) | SEK |
| Danmark | DK | 25% | SEK |
| Norge | NO | 0% (utanför EU) | SEK |
| Åland | AX | 0% (skattefri zon) | SEK |

**Hur man lägger till Åland**: Markets → Add market → sök "Åland" (finns som separat region i Shopify).

### A3. Moms för EU B2B — VAT-nummer input

Standard Shopify saknar inbyggt VAT-nummer-fält. Två alternativ:

**Alternativ 1 (enkelt, gratis)**: Installera appen **"Sufio"** eller **"B2B VAT Exempt"** från Shopify App Store.
- Kunden anger VAT-nummer vid kassan
- Appen verifierar mot VIES (EU:s VAT-databas)
- Moms tas automatiskt bort om VAT-numret är giltigt
- Pris: ca $10-15/mån

**Alternativ 2 (utan app)**: Skapa ett kontaktformulär där B2B-kunder registrerar sig med VAT-nummer. Ni taggar kunden manuellt med "tax-exempt" i Shopify Admin → Customers. Kunden får sedan rabattkod eller konto utan moms. Mer manuellt men gratis.

---

## B. KASSAN — SPECIFIKATIONSFORMAT

Mikaels önskade format visas automatiskt i standard Shopify-kassan om A1 är konfigurerat rätt:

```
Art 1232            2 st          500 kr
Frakt               1 st          150 kr
Totalt ex moms                    650 kr
Moms (25%)                        162,50 kr
Att betala                        812,50 kr
```

Shopify visar detta som standard när "Include tax in prices" = OFF. Momsraden visas automatiskt. Åland/Norge → momsraden visas som 0 kr (eller döljs).

---

## C. FRAKT — SHIPPING PROFILES

### C1. Settings → Shipping and delivery → Shipping profiles

Skapa profil **"Standard frakt"** med dessa regler:

**Sverige**:
- PostNord varubrev (< 3 kg): 0–2,99 kg → pris: [valfritt, t.ex. 79 kr]
- DSV paket: 3+ kg → pris: [valfritt, t.ex. 149 kr]

**Övriga länder (FI, DK, NO, AX)**:
- PostNord brev (< 2 kg): 0–1,99 kg → pris: [valfritt, t.ex. 119 kr]
- DSV internationellt: 2+ kg → pris: [valfritt, t.ex. 199 kr]

### C2. Produktvikter — VIKTIGT
Alla produkter behöver en fraktdragande vikt. Gå till:
**Products → [produkt] → Shipping → Weight**

| Produkt | Rekommenderad vikt |
|---------|-------------------|
| K675 stämpelklocka | 2,5 kg |
| Z120 stämpelklocka | 2,0 kg |
| TP-6 stämpelklocka | 1,8 kg |
| Stämpelkort (100 st) | 0,2 kg |
| Färgband | 0,1 kg |
| Nyckel | 0,05 kg |
| RFID-tagg | 0,01 kg |
| Kortfack | 0,3 kg |

---

## D. BRUTNA PRODUKT-URL:ER

Orsak: Felaktiga handles i gamla länkarna. Produkterna finns men under andra URL:er.

**Importera redirects direkt**: Admin → Online Store → Navigation → URL Redirects → Import CSV

Fil: `content-pages/ferox-url-redirects.csv`

| Gammal URL | Ny URL |
|-----------|--------|
| /products/artnr-1203-stampelkort-z120-100-st | /products/artnr-1203-stampelkort-z120 |
| /products/artnr-1250 | /products/artnr-1250-fargband |
| /products/artnr-1280 | /products/artnr-1280-nyckel-seiko |
| /products/artnr-1001-tp-6 | /products/artnr-1020-tp-6 |

---

## E. NAVIGATION — LÄGG TILL "ALLA PRODUKTER"

Admin → Online Store → Navigation → Main menu → Add menu item:
- Name: `Alla produkter`
- Link: Collections → All products (`/collections/all`)

Flytta upp i menyn till önskad position. ✅

---

## F. STARTSIDA — TEXT ÖVERLAPP PÅ BILD

Problemet: Text flödar in i bilden till höger.

**Snabbfix i theme-editor**:
1. Admin → Online Store → Themes → Customize
2. Klicka på hero-sektionen (förstasidan)
3. Minska textstorleken eller ändra textbredden
4. Alternativt: Ändra bild till att ha tomt utrymme till vänster

**Kodfix om theme-editor inte räcker**:
Lägg till i `assets/custom.css` (eller via Admin → Online Store → Themes → Edit code → assets/custom.css):

```css
/* Fix: förhindra att hero-text överlappar bild */
.hero__text-wrapper,
.hero-section .content,
[class*="hero"] .rte {
  max-width: 50% !important;
}
@media (max-width: 768px) {
  .hero__text-wrapper,
  .hero-section .content,
  [class*="hero"] .rte {
    max-width: 100% !important;
  }
}
```

---

## G. TP-6 PRODUKTSIDA — TA BORT STÄMPELKORT-TEXT

Admin → Products → Artnr 1020 - TP-6 → Edit description
Ta bort texten: **"Köpa stämpelkort i bulk"** (och eventuell länk/sektion om stämpelkort).

Spara. ✅

---

## H. SUPPORT-SIDA — FORMULÄR + TEAMVIEWER

Admin → Online Store → Pages → Support → Edit

Växla till HTML-redigering (klicka `<>` ikonen i editorn).
Ersätt hela innehållet med koden i:
`content-pages/ferox-support-page.html`

**OBS**: TeamViewer-länken (`https://get.teamviewer.com/feroxkonsult`) — kontrollera att din TeamViewer-partner-URL stämmer. Om ni har en annan länk, uppdatera i HTML-filen.

---

## I. KONTAKT-SIDA — FORMULÄR + ADRESS

Admin → Online Store → Pages → Kontakt → Edit

Växla till HTML och klistra in koden från:
`content-pages/ferox-kontakt-page.html`

---

## J. GDPR OCH INTEGRITETSPOLICY — DOLDA SIDOR

Dessa sidor måste finnas för App Store och Google Play krav, men ska inte synas i menyn.

1. Admin → Online Store → Pages → Integritetspolicy (skapa om den saknas)
2. Admin → Online Store → Pages → GDPR (skapa om den saknas)
3. **Ta INTE bort** från Pages — men lägg INTE till i Navigation

URL:erna är:
- `https://feroxkonsult.se/pages/integritetspolicy`
- `https://feroxkonsult.se/pages/gdpr`

Dessa kan länkas direkt i app-inlämningarna utan att vara synliga i navigationen. ✅

---

## K. TIDREDOVISNING-SIDAN — DESIGN

Sidan är importerad rakt av från Hemsida24 och matchar inte resten av sajten.

Admin → Online Store → Pages → Tidredovisning → Edit

Rekommendation: Bygg om sidan med Shopify:s inbyggda page-sektioner istället för importerad HTML. Struktur:
- Hero-bild med rubrik "Tidredovisning på nätet"
- Feature-kolumner (personalregister, avtal, schema, export, etc.)
- CTA-knapp: "Boka demonstration"

Alternativt: Rensa bort all gammal HTML och klistra in välstrukturerat innehåll. Jag kan skriva innehållet på begäran.

---

## SAMMANFATTNING — PRIORITETSORDNING

| Prio | Åtgärd | Var | Tid |
|------|--------|-----|-----|
| 1 | Settings → Taxes: "Include tax in prices" = OFF | Admin | 2 min |
| 2 | Importera URL-redirects (CSV) | Admin | 2 min |
| 3 | Lägg till "Alla produkter" i navigationen | Admin | 2 min |
| 4 | Skapa marknader (FI, DK, NO, AX) | Admin | 15 min |
| 5 | Konfigurera frakt (PostNord + DSV + vikter) | Admin | 30 min |
| 6 | Uppdatera support-sida (formulär + TeamViewer) | Admin | 5 min |
| 7 | Uppdatera kontakt-sida (formulär + adress) | Admin | 5 min |
| 8 | Ta bort "stämpelkort"-text på TP-6 | Admin | 2 min |
| 9 | Aktivera betalning: Shopify Payments + Klarna faktura | Admin | 10 min |
| 10 | Installera B2B VAT-app | App Store | 10 min |
| 11 | Fix startsida text-overlap | Theme editor | 10 min |
| 12 | Bygg om Tidredovisning-sidan | Admin | 30 min |
| 13 | Ange produktvikter (alla 17 produkter) | Admin | 20 min |
