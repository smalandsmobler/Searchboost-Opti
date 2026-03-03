# Bokningsplugin-jämförelse: EduAdmin vs alternativ

**Datum:** 2026-02-17
**Kund:** Kompetensutveckla.se
**Syfte:** Utvärdera om EduAdmin kan ersättas med billigare alternativ

---

## Nuläge: EduAdmin (MultiNet Interactive)

| Parameter | Värde |
|-----------|-------|
| **Pris** | Från £279/mån (Starter) → £499/mån (Business) → £799/mån (Academy) |
| **I SEK** | ~4 000 kr/mån (Starter) → ~7 000 kr/mån (Business) → ~11 500 kr/mån (Academy) |
| **Årskostnad** | ~48 000 – 138 000 kr/år |
| **Per-bokning** | Inga extra avgifter |
| **WP-plugin** | Gratis (kräver EduAdmin-konto) |

**Fördelar:**
- Helhetslösning (kursadmin, fakturering, certifikat, deltagarlistor, instruktörsportal)
- Svenskt företag, svensk support
- Automatisk synk med WordPress
- Hanterar orter/datum/format

**Nackdelar:**
- Dyrt (48 000 – 138 000 kr/år)
- Låst ekosystem — all data bor i EduAdmin, inte i WordPress
- Begränsad kontroll över design/CSS (pluginet renderar sina egna templates)
- Kräver API-nyckel för integration
- Svårt att SEO-optimera kurssidor (EduAdmin genererar dem, inte WP)

---

## Alternativ 1: WooCommerce + Amelia (REKOMMENDATION)

| Parameter | Värde |
|-----------|-------|
| **Pris** | $69/år (Starter) → $179/år (Standard) → $149/år (Pro, 5 sajter) |
| **I SEK** | ~750 – 1 900 kr/år |
| **Engångslicens** | Pro Lifetime: $249 (~2 700 kr engång) |
| **Per-bokning** | Inga extra avgifter |

**Fördelar:**
- 95-99% billigare än EduAdmin
- Full kontroll i WordPress — kurser = WooCommerce-produkter, full SEO-kontroll
- Stöd för gruppbokningar, återkommande kurser, Zoom/Teams-integration
- WooCommerce-betalningar (Stripe, Klarna, Swish via tillägg)
- Modern UI, kundportal med bokningskalender
- Multicurrency, flerspråkigt

**Nackdelar:**
- Ingen inbyggd fakturering (behöver WooCommerce PDF Invoices)
- Ingen automatisk certifikatgenerering (behöver tillägg eller WPCode-snippet)
- Ingen deltagarlisthantering (behöver byggas manuellt eller med tillägg)
- Kräver mer konfiguration och underhåll

---

## Alternativ 2: WooCommerce + FooEvents

| Parameter | Värde |
|-----------|-------|
| **Pris** | Från $99/år (1 sajt) — bundles upp till ~$299/år |
| **I SEK** | ~1 100 – 3 200 kr/år |
| **Per-bokning** | Inga avgifter, obegränsat antal biljetter |

**Fördelar:**
- Byggt specifikt för kurser/event + WooCommerce
- Stöd för flerdagars-kurser, incheckning (gratis iOS/Android-app)
- Biljettmallar (20+ teman), QR-kod-incheckning
- POS-system för på-plats-registrering
- Zoom-integration (automatisk registrering vid köp)
- All data i WordPress, full SEO-kontroll

**Nackdelar:**
- Fokus på "event/biljetter" snarare än "utbildningsadministration"
- Bokningsplugin (klassrum + tider) kostar extra utöver core
- Ingen inbyggd kursadmin (schemaläggning, instruktörsportal)
- Ingen fakturering (WooCommerce hanterar det)
- Begränsad rapport/statistik jämfört med EduAdmin

---

## Alternativ 3: Arlo Training Management

| Parameter | Värde |
|-----------|-------|
| **Pris** | $125/mån (Simple) → $215/mån (Professional) → $285/mån (Enterprise) |
| **I SEK** | ~1 350 – 3 100 kr/mån (~16 000 – 37 000 kr/år) |
| **Per-bokning** | $1.80 per betald registrering, $0.90 per gratis registrering |

**Fördelar:**
- Mest jämförbar med EduAdmin — fullständig TMS (Training Management System)
- WP-plugin som synkar kurser automatiskt
- Inbyggd Zoom-integration, blended learning
- Fakturering, waitlists, rabatter, registreringsformulär
- Stöd för on-site + online + hybrid

**Nackdelar:**
- Fortfarande dyrt (billigare än EduAdmin men inte billigt)
- Per-registreringsavgift äter marginal vid hög volym
- Nyzeeländskt bolag — support i annan tidszon
- Data bor i Arlo, inte i WordPress (samma problem som EduAdmin)
- SEO-kontroll begränsad (Arlo genererar kurssidor)

---

## Jämförelsetabell

| | EduAdmin | WooCommerce + Amelia | WooCommerce + FooEvents | Arlo |
|---|---|---|---|---|
| **Årskostnad** | 48 000 – 138 000 kr | 750 – 1 900 kr | 1 100 – 3 200 kr | 16 000 – 37 000 kr |
| **Lifetime-option** | Nej | Ja ($249) | Nej | Nej |
| **Data i WordPress** | Nej | Ja | Ja | Nej |
| **SEO-kontroll** | Begränsad | Full | Full | Begränsad |
| **Kursadmin** | Komplett | Grundläggande | Grundläggande | Komplett |
| **Fakturering** | Inbyggd | Via tillägg | Via WooCommerce | Inbyggd |
| **Certifikat** | Inbyggd | Manuellt/tillägg | Nej | Inbyggd |
| **Svensk support** | Ja | Nej | Nej | Nej |
| **Zoom/Teams** | Ja | Ja | Ja | Ja |
| **Svårighetsgrad** | Plug & play | Kräver setup | Kräver setup | Plug & play |

---

## Rekommendation

**WooCommerce + Amelia Pro** ($249 engång) är den starkaste kandidaten.

Besparingen: från ~50 000-100 000 kr/år till under 3 000 kr engång.
SEO-kontrollen blir total, och allt bor i WordPress.

Det som saknas (certifikat, deltagarlistor) kan byggas med WPCode-snippets eller WooCommerce-tillägg.

Trade-off: Kräver mer setup-arbete initialt. Kompetensutveckla förlorar EduAdmins kursadmin-funktioner om de använder dem tungt.

---

## Källor

- [EduAdmin Pricing](https://www.eduadmin.com/pricing/)
- [EduAdmin WordPress Plugin](https://www.multinet.com/en/eduadmin/integrations/wordpress/)
- [Amelia Pricing](https://wpamelia.com/pricing/)
- [FooEvents Pricing](https://www.fooevents.com/pricing/)
- [Arlo Pricing](https://www.arlo.co/pricing)
- [EduAdmin on GetApp](https://www.getapp.com/hr-employee-management-software/a/eduadmin/)
- [Arlo on Capterra](https://www.capterra.com/p/141006/Arlo-Training-Event-Software/)
