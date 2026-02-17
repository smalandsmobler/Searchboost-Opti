# Betallosningar for WooCommerce — Smalands Kontorsmobler

> Underlag for val av betallosning vid WooCommerce-migrering.
> Framtaget av Searchboost, 2026-02-13.

---

## Innehall

1. [Vad ar Swedbank Pay?](#1-vad-ar-swedbank-pay)
2. [WooCommerce-integration](#2-woocommerce-integration)
3. [Vad behover butiksagaren tillhandahalla?](#3-vad-behover-butiksagaren-tillhandahalla)
4. [Alternativ — Klarna, Stripe, Swish](#4-alternativ--klarna-stripe-swish)
5. [Priser och kostnader](#5-priser-och-kostnader)
6. [Rekommendation](#6-rekommendation)
7. [Checklista — Vad vi behover fran SMK](#7-checklista--vad-vi-behover-fran-smk)

---

## 1. Vad ar Swedbank Pay?

### Oversikt

Swedbank Pay (tidigare PayEx) ar Sveriges storsta betallosning for e-handel, agd av Swedbank. De erbjuder en komplett betalplattform som hanterar:

- **Kortbetalningar** (Visa, Mastercard, Amex)
- **Swish** (direkt i kassan)
- **Faktura** (konsument och foretag)
- **Delbetalning** (3-24 manader)
- **Vipps** (norskt alternativ)
- **Apple Pay / Google Pay**

### Hur fungerar det?

1. Kunden valjer betalmetod i WooCommerce-kassan
2. Swedbank Pay hanterar hela betaltransaktionen (PCI DSS-kompatibelt)
3. Pengarna satter in pa foretagens bankkonto (normalt 1-2 bankdagar)
4. Butiken far en samlad rapport och adminpanel for alla transaktioner

### Varfor Swedbank Pay for B2B?

- **Faktura for foretag** — Viktig for B2B-kunder som inte betalar med kort
- **Hogre belopp** — Inga problem med ordervarden pa 5 000-20 000 kr
- **Svenskt stod** — Kundtjanst pa svenska, svensk avtalspart
- **Kreditkontroll** — Inbyggd kreditkontroll vid fakturakop

---

## 2. WooCommerce-integration

### Plugin: Swedbank Pay for WooCommerce

| Detalj | Information |
|--------|-------------|
| **Pluginnamn** | Swedbank Pay Payments / Swedbank Pay Checkout |
| **Kallkod** | GitHub: `SwedbankPay/swedbank-pay-woocommerce-payments` |
| **WordPress.org** | Finns i officiella plugin-katalogen |
| **Krav** | WooCommerce 5.0+, PHP 7.4+, SSL-certifikat (HTTPS) |
| **Kostnad plugin** | Gratis (oppet kallkod) |
| **Tva varianter** | **Payments** (enskilda betalmetoder) och **Checkout** (komplett kassalosning) |

### Installation steg-for-steg

1. **Installera plugin** i WordPress:
   - WordPress Admin → Tillagg → Lagg till nytt → Sok "Swedbank Pay"
   - Alternativt: Ladda ner fran GitHub och ladda upp manuellt

2. **Konfigurera koppling**:
   - Ga till WooCommerce → Installningar → Betalningar
   - Aktivera "Swedbank Pay Checkout" (rekommenderas for komplett kassa)
   - Mata in **Merchant ID** och **Access Token** (fas fran Swedbank Pay)

3. **Valja betalmetoder**:
   - Kryssa i vilka betalmetoder som ska vara aktiva
   - Rekommenderat for SMK: Kort + Swish + Foretagsfaktura

4. **Testlage**:
   - Aktivera "Test Mode" och gor testtransaktioner
   - Swedbank Pay har en sandlademiljo med testkortnummer

5. **Go live**:
   - Byt fran test-credentials till produktions-credentials
   - Gor en skarp testtransaktion

### Checkout v3 (senaste versionen)

Swedbank Pay Checkout v3 ar den nyaste varianten som erbjuder:
- **One-click checkout** for aterkommande kunder
- **Inbaddad kassa** (kunden stannar pa sajten)
- **Responsiv design** (mobilanpassad automatiskt)
- **Tokenisering** (spara kort for framtida kop)

---

## 3. Vad behover butiksagaren tillhandahalla?

### For att teckna avtal med Swedbank Pay

Butiksagaren (SMK) behover:

| Krav | Detalj |
|------|--------|
| **Organisationsnummer** | Foretaget maste vara registrerat i Sverige |
| **F-skattsedel** | Giltigt F-skatteintyg |
| **Bankkonto** | Foretagskonto (helst Swedbank, men inte krav) |
| **E-handelssajt** | Fungerande webbshop med HTTPS |
| **Foretagsuppgifter** | Adress, kontaktperson, telefon, e-post |
| **Villkor pa sajten** | Kopvillkor, integritetspolicy, aterbetalningspolicy |
| **Produktbeskrivning** | Vad som saljs (kontorsmobler = lagriskkategori) |
| **Forvantat transaktionsvolym** | Uppskattat antal ordrar/manad och genomsnittligt ordervarde |
| **ID-handling** | Legitimation for firmatecknare (vid avtal) |
| **Kreditkontroll** | Swedbank Pay gor en kreditkontroll pa foretaget |

### Tidsram for uppsattning

- **Avtalsteckning**: 1-3 veckor (beroende pa kreditkontroll)
- **Teknisk integration**: 1-2 dagar (nar credentials ar pa plats)
- **Testning**: 1-2 dagar
- **Totalt**: Rakna med 2-4 veckor fran start till live

---

## 4. Alternativ — Klarna, Stripe, Swish

### Jamforelsetabell

| Funktion | Swedbank Pay | Klarna | Stripe | Swish (direkt) |
|----------|-------------|--------|--------|----------------|
| **Kortbetalning** | Ja | Ja | Ja | Nej |
| **Swish** | Ja (inbyggt) | Nej | Nej | Ja |
| **Foretagsfaktura** | Ja | Begransat | Nej | Nej |
| **Delbetalning** | Ja | Ja (karnprodukt) | Nej | Nej |
| **B2B-fokus** | Bra | Svagt | Svagt | Nej |
| **Svenska** | Fullt stod | Fullt stod | Begransat | Fullt stod |
| **WooCommerce-plugin** | Ja (gratis) | Ja (gratis) | Ja (gratis) | Via tredjepart |
| **Avtalskomplexitet** | Medel | Lag | Lag | Lag |
| **Hogre belopp (10k+)** | Inga problem | Kan varas begransat | Inga problem | Max 150 000 kr |
| **Payout-tid** | 1-2 dagar | 7-14 dagar | 2-7 dagar | Direkt |
| **Kreditkontroll kund** | Ja (vid faktura) | Ja | Nej | Nej |

### Detaljerad analys per alternativ

#### Klarna

- **Fordelar**: Mycket kant varumarke, konsumenter alskar "betala senare", latt att komma igang
- **Nackdelar**: **Svagt for B2B**. Klarna ar byggt for konsumenthandel. Foretagsfaktura ar begransat och kraver extra avtal. Lagen utbetalningsperiod (7-14 dagar) paverkar kassaflodet. Hogre belopp kan stoppas av Klarnas riskbedomning.
- **Passar for SMK?** Nej — for B2B med ordervarden 5-20k ar Klarna inte optimalt.

#### Stripe

- **Fordelar**: Extremt latt att satta upp, bra API, snabbt igang, globalt
- **Nackdelar**: **Ingen Swish**, ingen fakturafunktion, begransat svenskt stod. Stripe ar utmarkt for SaaS och internationell handel men saknar de lokala svenska betalmetoderna som B2B-kunder forvantar sig.
- **Passar for SMK?** Kan fungera som komplement for kortbetalningar, men inte som ensam losning.

#### Swish for handel (direkt integration)

- **Fordelar**: Alla svenskar har det, direkt betalning, inga kreditrisker
- **Nackdelar**: **Inget kundskydd**, ingen faktura, ingen delbetalning, kraver eget Swish-avtal med banken. Otympligt for hogre belopp. Ingen automatisk matchning mot ordrar utan bra plugin.
- **Passar for SMK?** Bra som *komplement*, inte som ensam losning.

---

## 5. Priser och kostnader

### Swedbank Pay — Prisstruktur

> **OBS:** Exakta priser forhandlas individuellt. Nedanstaende ar riktpriser baserat pa typiska e-handelsavtal. Kontakta Swedbank Pay for en offert.

| Kostnadstyp | Riktpris |
|-------------|----------|
| **Uppstartskostnad** | 0-3 000 kr (varierar) |
| **Manadskostnad** | 0-395 kr/man (beroende pa paket) |
| **Kortbetalning (Visa/MC)** | 1,35-1,85 % per transaktion |
| **Swish** | 2-3 kr per transaktion |
| **Faktura** | 15-29 kr per transaktion + kreditrisk (Swedbank Pay tar risken) |
| **Delbetalning** | 2,5-3,5 % + rantekostnad (betalas av kund) |
| **Minsta transaktionsavgift** | Varierar |
| **Bindningstid** | Normalt 12 manader |

### Kostnadsexempel for SMK

Antaganden: 30 ordrar/manad, snittvarde 8 000 kr, 60% kort, 20% faktura, 20% Swish.

| Betalmetod | Antal | Kostnad/st | Totalt |
|------------|-------|------------|--------|
| Kort (18 ordrar x 8000 kr x 1,5%) | 18 | ~120 kr | ~2 160 kr |
| Faktura (6 ordrar x 25 kr) | 6 | 25 kr | 150 kr |
| Swish (6 ordrar x 3 kr) | 6 | 3 kr | 18 kr |
| Manadskostnad | 1 | 295 kr | 295 kr |
| **Totalt/manad** | | | **~2 623 kr** |
| **I % av omsattning (240 000 kr)** | | | **~1,1%** |

### Jamforelse — Klarna och Stripe kostnader

| Leverantor | Kortbetalning | Faktura | Swish | Manadskostnad |
|------------|---------------|---------|-------|---------------|
| Swedbank Pay | 1,35-1,85% | 15-29 kr | 2-3 kr | 0-395 kr |
| Klarna | 1,49-2,49% | 20-35 kr | Ej tillgangligt | 0 kr |
| Stripe | 1,5% + 1,80 kr | Ej tillgangligt | Ej tillgangligt | 0 kr |

---

## 6. Rekommendation

### For Smalands Kontorsmobler rekommenderar vi: **Swedbank Pay Checkout**

#### Varfor?

1. **B2B-krav**: SMK saljer primart till foretag. Foretagsfaktura ar ett *maste* — manga foretagskunder forvantar sig att kunna betala pa faktura med 30 dagars betalningsvillkor. Swedbank Pay ar den enda losningen som hanterar detta smidigt.

2. **Ordervarden**: Med genomsnittliga ordrar pa 5 000-20 000 kr behover ni en betallosning som:
   - Inte blockerar stora transaktioner (Klarna kan neka hoga belopp)
   - Erbjuder faktura (foretag vill inte lagga 15 000 kr pa kort)
   - Ger kreditkontroll (minskar risken for ej betalda fakturor)

3. **Komplett paket**: En enda integration ger kort + Swish + faktura + delbetalning. Ni slipper hantera flera olika plugins och leverantorer.

4. **Kassaflode**: Utbetalning inom 1-2 bankdagar (jamfort med Klarna 7-14 dagar). Viktigt for ett mindre foretag.

5. **Svenskt stod**: Avtal, kundtjanst och dokumentation pa svenska. Viktigt nar man inte ar en teknikintensiv organisation.

6. **Kontorsmobler = lagriskkategori**: Swedbank Pay kommer inte ha problem med att godkanna en kontorsmobelsbutik. Riskbedomningen ar enkel for denna typ av varor.

### Alternativ uppstallning (om Swedbank Pay tar for lang tid)

Om avtalsteckning med Swedbank Pay drar ut pa tiden kan vi satta upp i tva steg:

1. **Steg 1 (dag 1)**: Stripe for kortbetalningar + Swish via separat plugin
2. **Steg 2 (vecka 3-4)**: Lagg till Swedbank Pay for faktura och delbetalning, behall Swish

---

## 7. Checklista — Vad vi behover fran SMK

For att vi ska kunna satta upp betalningen pa den nya WooCommerce-butiken behover vi foljande fran Smalands Kontorsmobler:

### Maste ha (for att komma igang)

- [ ] **Organisationsnummer** for foretaget
- [ ] **Firmatecknarens namn och personnummer** (for kreditkontroll)
- [ ] **Foretagets adress** (besoks- och postadress)
- [ ] **Bankkontonummer** (foretagskonto for utbetalningar, helst med IBAN)
- [ ] **Kontaktperson** (namn, e-post, telefon — den som hanterar betalfragor)
- [ ] **F-skattsedel** (kopia eller verifiering att det ar aktivt)
- [ ] **Uppskattad omsattning** (manadlig forvantat omsattning via webshopen)
- [ ] **Uppskattad snittorder** (genomsnittligt ordervarde)

### Behover finnas pa sajten (vi kan hjalpa till att skriva)

- [ ] **Kopvillkor** (leveranstider, retur, garanti)
- [ ] **Integritetspolicy** (GDPR-anpassad)
- [ ] **Aterbetalningspolicy** (aterlamning, bytesratt)
- [ ] **Foretagsinformation** i sidfoten (org.nr, adress, VAT-nr)

### Swedbank Pay-specifikt (kunden gor sjalv eller vi hjalper via telefon)

- [ ] **Kontakta Swedbank Pay** (via swedbank-pay.se eller ring 08-411 10 80)
- [ ] **Alternativt**: Besok lokalt Swedbank-kontor for att teckna e-handelsavtal
- [ ] **Valja paket**: Vi rekommenderar Checkout (komplett)
- [ ] **Signera avtal** (digital signering)
- [ ] **Fa Merchant ID + Access Token** (ges av Swedbank Pay efter godkannande)
- [ ] **Skicka credentials till oss** (Merchant ID + Access Token — vi lagger in i WooCommerce)

### Tidsplan

| Vecka | Aktivitet | Ansvarig |
|-------|-----------|----------|
| Vecka 1 | Samla in uppgifter fran SMK, kontakta Swedbank Pay | SMK + Searchboost |
| Vecka 2 | Swedbank Pay granskar ansokan | Swedbank Pay |
| Vecka 2-3 | Bygga WooCommerce-butiken (parallellt) | Searchboost |
| Vecka 3-4 | Fa credentials, konfigurera betalning | Searchboost |
| Vecka 4 | Testning och go-live | Searchboost + SMK |

---

## Sammanfattning

| Fraga | Svar |
|-------|------|
| **Vilken betallosning?** | Swedbank Pay Checkout |
| **Varfor?** | B2B-faktura, Swish, kort — allt i ett |
| **Plugin-kostnad?** | Gratis |
| **Transaktionskostnad?** | ~1,1% av omsattning (blandad betalmetod) |
| **Tid att satta upp?** | 2-4 veckor |
| **Vad behover kunden gora?** | Kontakta Swedbank Pay, signera avtal, skicka credentials |
| **Vad gor Searchboost?** | Allt tekniskt — installation, konfiguration, testning |

---

*Framtaget av Searchboost. Fragor? Kontakta mikael@searchboost.se*
