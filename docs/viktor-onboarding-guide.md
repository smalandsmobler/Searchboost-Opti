# Viktor — Dashboard-guiden

> Uppdaterad: 2026-02-17

---

## Logga in

### Claude Code
Starta Claude i terminalen. Den fragar "Verifieringskod?" — skriv **0195**.

### Dashboard
- **URL:** http://51.21.116.7/
- **Mail:** searchboost.web@gmail.com
- **Losenord:** Opti0195

---

## Vad du ser nar du loggar in

5 vyer hogst upp:

| Vy | Vad den visar |
|----|---------------|
| **Dashboard** | Oversikt — antal kunder, optimeringar, intakter |
| **Pipeline** | Kanban-board — alla kunder i olika stadier |
| **Optimeringar** | Logg over allt som gjorts (auto + manuellt) |
| **Arbetsflode** | Ko med vantande uppgifter |
| **Rapporter** | Veckorapporter per kund |

---

## Lagga till en ny kund

1. Ga till **Pipeline**
2. Klicka **"+ Manuell prospect"**
3. Fyll i:
   - Foretagsnamn (obligatoriskt)
   - Webbplats (obligatoriskt)
   - Kontaktperson, e-post, anteckningar (valfritt)
4. Klicka **Spara**

Kunden hamnar i "Analys"-kolumnen. Ett Trello-kort skapas automatiskt.

---

## Flytta kunden genom pipelinen

```
Analys -> Offert -> Orderbekraftelse -> Uppstart -> Atgardsplan -> Aktiv
```

Klicka pa kunden -> klicka knappen for nasta steg.

**Vid Orderbekraftelse** behover du fylla i:
- Tjanstetyp (Basic / Standard / Premium)
- Manadsbelopp (kronor)
- Startdatum

**Vid Uppstart** behover du fylla i:
- Geografiskt fokus (t.ex. "Jonkoping" eller "Hela Sverige")
- A-nyckelord (5 st, viktigast)
- B-nyckelord (5 st)
- C-nyckelord (10 st, valfritt)

---

## Kunddetalj — 5 flikar

### 1. SEO-analys
Klistra in analysdata. Lagg till problem-rader:
- URL, problemtyp, allvarlighetsgrad, prioritet, beskrivning

### 2. Nyckelord (ABC)
Lagg in sokord sorterade:
- **A** = huvudnyckelord (viktigast, 5 st)
- **B** = sekundara (5 st)
- **C** = langsvans (10 st)

Per ord: sokordet + sokvolym + svrighetsgrad

Spara max 10 st per gang (annars timeout).

### 3. Atgardsplan
3 manader med uppgifter:
- Manad 1: Grundarbete
- Manad 2: Tillvaxt
- Manad 3: Forfining

Kan auto-genereras fran audit + nyckelord (klicka AI-knappen).

### 4. Logga arbete
Logga vad du gjort manuellt:
- Datum, typ, sida, beskrivning, tid, ditt namn

**Viktigt:** Allt du loggar syns i kundens veckorapport.

### 5. Credentials
Spara tekniska kopplingar:

| Falt | Vad det ar |
|------|-----------|
| WP-anvandare | Kundens WordPress-login |
| WP App-losenord | Genereras i WP: Anvandare -> Profil -> Application Passwords |
| GSC Property | Kundens Google Search Console URL |
| Kontakt-epost | Kundens mail |
| GA4 Property ID | Fran Google Analytics |
| GTM Container ID | Fran Google Tag Manager |
| Google Ads ID | Kundens Ads-konto |
| Meta Pixel ID | Fran Facebook/Meta |

Klicka **"Testa WP-anslutning"** for att kolla att det funkar.

---

## Aktivera en kund

Nar allt ar klart:

- [ ] Nyckelord sparade (minst A + B)
- [ ] WP-credentials ifyllda
- [ ] WP-test OK (gron bock)
- [ ] GSC-property ifylld
- [ ] Service Account tillagd i kundens GSC

Klicka den stora grona knappen **"Aktivera"**.

Nar en kund ar aktiv:
- Mandag 06:00 — automatisk SEO-audit
- Var 6:e timme — optimeringar kors
- Mandag 08:00 — veckorapport skickas
- Varje natt 04:00 — sokordsdata hamtas fran GSC

---

## Trello

Logga in pa trello.com med searchboost.web@gmail.com. Board: "Searchboost".

12 listor: Analys -> Offerter -> Kund -> Arkiv -> On-boarding -> SOPs -> BACKLOG -> TO DO -> IN PROGRESS -> REVIEW -> DONE -> REPORTS & ANALYTICS

Automatisk synk:
- Ny prospect i dashboard = Trello-kort i "Analys"
- Lambda gor optimering = Trello-kort i "DONE"
- Du loggar arbete = kommentar pa kundens kort

---

## Saljpresentation

I kunddetalj finns "Saljpresentation" med tva knappar:
- **Snabb** — mall-baserad, direkt
- **AI-genererad** — Claude skapar anpassat innehall (15-30 sek)

Oppnas som HTML-presentation i ny flik (12 slides).

---

## Nar nagt gar fel

| Meddelande | Vad du gor |
|-----------|-----------|
| "Foretag och webbplats kravs" | Fyll i bada falten |
| "Ange minst ett nyckelord" | Lagg till minst 1 nyckelord |
| "Anslutning misslyckades" | Kolla WP-URL och app-losenord |
| Timeout vid nyckelord | Spara max 10 per gang |

---

## Budget per tier

| Tier | Pris | Auto-uppgifter/manad |
|------|------|---------------------|
| Basic | max 5 000 kr | 15 |
| Standard | max 10 000 kr | 30 |
| Premium | over 10 000 kr | 50 |

---

## Kontakt

- **Mikael:** mikael@searchboost.se
- **Dashboard:** http://51.21.116.7/
- **Trello:** searchboost.web@gmail.com
