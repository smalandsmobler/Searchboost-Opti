# GDPR Cookie Consent — Smålands Kontorsmöbler

> Underlag för val av cookie consent-lösning på ny.smalandskontorsmobler.se
> Framtaget av Searchboost, 2026-02-13.

---

## Nuläge

ny.smalandskontorsmobler.se har **ingen cookie consent-lösning** idag. WooCommerce sätter tekniska cookies (varukorg, session) men det finns ingen:
- Cookie-banner som informerar besökare
- Möjlighet för besökare att välja vilka cookies de godkänner
- Integritetspolicy kopplad till cookies
- Cookie-deklaration (lista på alla cookies)

### Varför behövs det?

**EU:s ePrivacy-direktiv** (implementerat via svensk lag, LEK) och **GDPR** kräver att:
1. Besökare **informeras** om vilka cookies som används
2. Besökare ger **samtycke** innan icke-nödvändiga cookies sätts
3. Det ska vara lika lätt att **neka** som att **godkänna**
4. En **cookie-deklaration** finns tillgänglig (lista på alla cookies)

**Konsekvens utan**: IMY (Integritetsskyddsmyndigheten) kan utfärda sanktioner. I praktiken fokuserar de på stora aktörer, men det ser oprofessionellt ut för B2B-kunder.

---

## Jämförelse — Cookie Consent-lösningar för WooCommerce

| Funktion | Cookiebot | Complianz | CookieYes | Real Cookie Banner |
|----------|-----------|-----------|-----------|---------------------|
| **Typ** | Molntjänst | WP-plugin | Molntjänst + plugin | WP-plugin |
| **Auto-scan** | Ja (scanner sajten) | Ja | Ja | Ja |
| **Geoblocking** | Ja (visar bara i EU) | Ja | Ja | Ja |
| **WooCommerce-stöd** | Bra | Utmärkt | Bra | Bra |
| **Google Consent Mode v2** | Ja | Ja | Ja | Ja |
| **GTM-integration** | Ja | Ja | Ja | Ja |
| **Design/anpassning** | Begränsat | Bra | Bra | Bra |
| **Svenskt språk** | Ja | Ja | Ja | Ja |
| **Lagring av samtycke** | Molnet (Cookiebot) | Lokalt (WP) | Molnet | Lokalt (WP) |
| **GDPR + CCPA + ePrivacy** | Ja | Ja | Ja | Ja |
| **IAB TCF 2.2** | Ja (Premium) | Nej | Ja (Pro) | Nej |
| **Prestanda-påverkan** | Liten (externt script) | Minimal (lokalt) | Liten | Minimal |
| **Kostnad (1 domän)** | 108 €/år (~1 250 kr) | 49 €/år (~565 kr) | 89 $/år (~970 kr) | 58 €/år (~670 kr) |
| **Gratis tier** | Ja (<100 sidor) | Ja (begränsad) | Ja (begränsad) | Nej |
| **Popularitet WP** | 1M+ installationer | 900K+ | 300K+ | 200K+ |

---

## Detaljerad analys

### Cookiebot (Cybot A/S)
- **Fördelar**: Branschstandard, extremt robust juridiskt, auto-scanner som hittar ALLA cookies/trackers. Används av myndigheter och stora företag. IAB TCF 2.2-certifierad.
- **Nackdelar**: Dyrare, designen är svår att anpassa utan Premium, externt beroende (script laddas från Cookiebot-servrar).
- **Passar SMK?** Överdimensionerat för en WooCommerce-butik med <1000 produkter. Bra om man vill vara 100% juridiskt säker.

### Complianz (Really Simple Plugins)
- **Fördelar**: Bästa WooCommerce-integrationen. Allt körs lokalt (ingen extern tjänst). Wizard som guidar genom hela GDPR-setupen. Genererar integritetspolicy, cookie-deklaration automatiskt. Mycket anpassningsbar design.
- **Nackdelar**: Kräver lite mer initial konfiguration. Ingen IAB TCF 2.2.
- **Passar SMK?** **Ja — bäst val.** Billig, lokal, bra WooCommerce-stöd, genererar alla juridiska sidor automatiskt.

### CookieYes
- **Fördelar**: Enkelt att komma igång, snygg standard-banner, bra dashboard för statistik.
- **Nackdelar**: Externt beroende, dyrare än Complianz, mindre kontroll.
- **Passar SMK?** OK alternativ men Complianz är bättre värde.

### Real Cookie Banner (devowl.io)
- **Fördelar**: Tyskt företag (DSGVO-expertis), bra innehållsblockerare (blockerar YouTube/Google Maps tills samtycke ges).
- **Nackdelar**: Inget gratis alternativ, mindre community än Complianz.
- **Passar SMK?** Bra men dyrare utan tydlig fördel jämfört med Complianz.

---

## Rekommendation

### För SMK rekommenderar vi: **Complianz Premium**

| Aspekt | Detalj |
|--------|--------|
| **Plugin** | Complianz – GDPR/CCPA Cookie Consent (Premium) |
| **Kostnad** | 49 €/år (~565 kr/år) = **47 kr/mån** |
| **Varför** | Bäst WooCommerce-integration, allt lokalt (ingen extern tjänst), wizard genererar alla juridiska sidor, Google Consent Mode v2 inbyggt |
| **Alternativ** | Gratis-versionen fungerar också men saknar geo-blocking och avancerad scanning |
| **Installation** | 15 minuter — plugin + wizard |

### Vad ingår i Complianz Premium?

1. **Cookie-banner** — Anpassningsbar med SMK-färger (#566754 militärgrön)
2. **Cookie-scanner** — Hittar alla cookies automatiskt, kategoriserar dem
3. **Cookie-deklaration** — Autogenererad sida med alla cookies listade
4. **Integritetspolicy** — Mall som fylls i via wizard
5. **Google Consent Mode v2** — Krävs för Google Ads/Analytics sedan mars 2024
6. **Geo-blocking** — Visar bara banner i EU (slipper störa icke-EU-besökare)
7. **Statistik** — Se hur många godkänner/nekar
8. **A/B-test** — Testa olika banner-designs

---

## Implementeringsplan

| Steg | Tid | Ansvarig |
|------|-----|----------|
| 1. Installera Complianz-plugin | 5 min | Searchboost |
| 2. Köra GDPR-wizard (svara på frågor) | 10 min | Searchboost |
| 3. Anpassa banner-design (SMK-färger) | 10 min | Searchboost |
| 4. Skapa cookie-deklarationssida | 5 min | Searchboost (automatiskt) |
| 5. Skapa/uppdatera integritetspolicy | 10 min | Searchboost + SMK |
| 6. Konfigurera Google Consent Mode v2 | 5 min | Searchboost |
| 7. Testa banner + samtycke | 5 min | Searchboost |
| **Totalt** | **~50 min** | |

---

## Checklista — Vad vi behöver från SMK

- [ ] **Företagsnamn** (för integritetspolicyn) — Smålands Kontorsmöbler
- [ ] **Organisationsnummer** — behövs i policyn
- [ ] **Dataskyddsansvarigs kontaktuppgifter** (kan vara ägaren)
- [ ] **E-postadress för dataskyddsfrågor** (t.ex. info@smalandskontorsmobler.se)
- [ ] **Godkännande av integritetspolicy-text** (vi skriver, kunden granskar)

---

## Sammanfattning

| Fråga | Svar |
|-------|------|
| **Har SMK cookie consent idag?** | Nej — ingen banner, ingen deklaration |
| **Behövs det?** | Ja — lagkrav (GDPR + ePrivacy) |
| **Vilken lösning?** | Complianz Premium (WP-plugin) |
| **Kostnad?** | 49 €/år (~565 kr) |
| **Tid att implementera?** | ~50 minuter |
| **Vad behöver kunden göra?** | Granska integritetspolicyn |
| **Vad gör Searchboost?** | Allt tekniskt |

---

*Framtaget av Searchboost. Frågor? Kontakta mikael@searchboost.se*
