# Viktor — Guide till Opti-dashboarden

> Senast uppdaterad: 2026-02-15
> Skriven av: Mikael / Searchboost

---

## 1. Verifiering och inloggning

### Claude Code — Verifieringskod

När du startar en ny Claude Code-session kommer den fråga efter en verifieringskod.

- **Din verifieringskod:** `0195`

Ange koden när Claude frågar "Verifieringskod?" — annars kan du inte börja jobba.

### Dashboard — Logga in

1. Öppna **http://51.21.116.7/** i din webbläsare
2. Ange dina inloggningsuppgifter:
   - **Användare:** `searchboost.web@gmail.com`
   - **Lösenord:** `Opti0195`
3. Klicka **Logga in**

Du hamnar automatiskt på **Dashboard-vyn** (översikt med statistik).

---

## 2. Översikt av vyerna

Högst upp finns navigeringen med 6 vyer:

| Vy | Vad den visar |
|----|---------------|
| **Dashboard** | Aktiva kunder, optimeringar senaste 7 dagarna, arbetskö, MRR |
| **Pipeline** | Kanban-board med alla kunder i olika stadier |
| **Optimeringar** | Logg över alla utförda optimeringar (automatiska + manuella) |
| **Arbetsflöde** | Kö av väntande uppgifter |
| **Rapporter** | Veckorapporter per kund |

---

## 3. Lägga till en ny kund (Prospect)

### Steg 1: Gå till Pipeline-vyn

Klicka **Pipeline** i navigeringen.

### Steg 2: Klicka "+ Manuell prospect"

Knappen ligger högst upp i pipeline-vyn.

### Steg 3: Fyll i formuläret

| Fält | Obligatoriskt | Beskrivning |
|------|:---:|-------------|
| **Företagsnamn** | Ja | Kundens företag, t.ex. "Möblernas Rike AB" |
| **Webbplats** | Ja | Full URL: `https://moblernarike.se` |
| **Kontaktperson** | Nej | Namn på kontakten |
| **E-post** | Nej | Kontaktens e-post |
| **Anteckningar** | Nej | Valfri info |
| **Trafiktrend** | Nej | Okänd / Växande / Minskande / Stabil |

### Steg 4: Klicka "Spara"

Kunden hamnar i **Analys**-kolumnen i pipeline och ett Trello-kort skapas automatiskt.

---

## 4. Flytta en kund genom pipelinen

Varje kund går genom dessa stadier (i ordning):

```
Analys → Offert → Orderbekräftelse → Uppstart → Åtgärdsplan → Aktiv
```

### Så här gör du:

1. **Klicka på kundens kort** i pipeline-vyn
2. Du hamnar i **kunddetalj-vyn**
3. Klicka på nästa stadie-knapp (t.ex. "Flytta till Offert")

### Vid Orderbekräftelse — extra information krävs:

När du flyttar till **Orderbekräftelse** behöver du fylla i:

| Fält | Beskrivning |
|------|-------------|
| **Tjänstetyp** | SEO Basic / SEO Standard / SEO Premium |
| **Månadsbelopp** | I kronor, t.ex. 5000 |
| **Startdatum** | När kontraktet startar |

### Vid Uppstart — nyckelord + geografi:

| Fält | Beskrivning |
|------|-------------|
| **Geografiskt fokus** | T.ex. "Jönköping", "Småland", "Hela Sverige" |
| **A-nyckelord** | 5 huvudnyckelord (viktigast) |
| **B-nyckelord** | 5 sekundära nyckelord |
| **C-nyckelord** | 10 långsvans-nyckelord (valfritt) |

---

## 5. Kunddetalj — Alla flikar

När du klickar på en kund ser du en detaljsida med flikar längst ner:

### 5.1 SEO-analys

Här klistrar du in en SEO-analys (t.ex. från SE Ranking).

**Fyll i:**
- **Sammanfattning** — Fritext om kundens SEO-läge
- **Problem-tabell** — Rader med:
  - URL (vilken sida)
  - Problemtyp (t.ex. "Titel saknas", "Tunt innehåll")
  - Allvarlighetsgrad (låg/medel/hög)
  - Prioritet (1-10)
  - Beskrivning

Klicka **"+ Lägg till rad"** för fler problem. Klicka **"Spara analys"** när klar.

### 5.2 Nyckelord (ABC)

Här lägger du in nyckelord sorterade i tre nivåer:

| Nivå | Antal | Beskrivning |
|------|-------|-------------|
| **A-ord** | 5 | Huvudnyckelord — det viktigaste kunden vill ranka på |
| **B-ord** | 5 | Sekundära — stödjer A-orden |
| **C-ord** | 10 | Långsvans — specifika frågor, lokala sökord |

**Per nyckelord:**
- Sökordet (text)
- Sökvolym (antal sökningar/månad)
- Svårighetsgrad (0-100)

Välj **fas**: "Från kund" (initial) eller "Efter uppstartsmötet" (final).

Klicka **"Spara nyckelord"**.

> **OBS:** Max ca 10 nyckelord per sparning (annars timeout). Spara i omgångar om du har fler.

### 5.3 Åtgärdsplan

3-månaders plan med uppgifter:

**Månad 1 — Grundarbete**
**Månad 2 — Tillväxt**
**Månad 3 — Förfining**

Per uppgift:
- Beskrivning (vad ska göras)
- Typ (Innehåll / Meta / Teknisk fix / Länkbygge / Schema / Hastighet)
- Nyckelord (kopplat till)
- Sida (URL)
- Insats (Manuell eller Auto)

Du kan också klicka **"Auto-generera från audit + nyckelord"** — då skapar AI:n en plan baserat på befintlig data.

### 5.4 Logga arbete

Här loggar du **manuellt utfört arbete** (t.ex. skrivit texter, fixat bilder, tekniska ändringar).

Per rad:
- **Datum/tid** — När arbetet gjordes
- **Typ** — Metadata / Innehåll / Teknisk SEO / Bilder / Intern länkning / Schema / Annat
- **Sida** — URL (om relevant)
- **Beskrivning** — Vad du gjorde
- **Tid (minuter)** — Hur lång tid det tog
- **Utfört av** — Mikael eller Viktor

> **VIKTIGT:** Allt du loggar här hamnar i kundens veckorapport. Det ser likadant ut för kunden oavsett om det är manuellt eller automatiskt arbete.

### 5.5 Credentials (Inloggningsuppgifter)

Här sparar du tekniska kopplingar till kundens sajt:

| Fält | Exempel | Varifrån |
|------|---------|----------|
| **WP-användarnamn** | mikael@example.se | Kundens WordPress-admin |
| **WP App-lösenord** | xxxx xxxx xxxx xxxx | Genereras i WP: Användare → Profil → Application Passwords |
| **GSC Property** | https://www.example.se/ | Google Search Console |
| **Kontakt-epost** | kund@example.se | Kundens mail |

Klicka **"Testa WP-anslutning"** för att verifiera att det fungerar.

---

## 6. Aktivera en kund för automatisk optimering

När allt är klart kan du aktivera kunden:

### Checklista innan aktivering:

- [ ] ABC-nyckelord sparade (minst A + B)
- [ ] WordPress-credentials ifyllda
- [ ] WP-anslutningstest OK
- [ ] GSC Property ifylld
- [ ] Service Account tillagd i kundens GSC som "Fullständig"

### Så aktiverar du:

1. Gå till kundens detaljsida
2. Klicka den stora gröna knappen **"Aktivera"**
3. Systemet validerar att allt är på plats
4. Första batchen av optimeringsuppgifter skapas
5. Lambda-funktionen börjar köra var 6:e timme

**När en kund är aktiv:**
- **Måndag 06:00** — Automatisk SEO-audit av sajten
- **Var 6:e timme** — Optimeringsuppgifter processas
- **Måndag 08:00** — Veckorapport skickas via e-post

---

## 7. Generera säljpresentation

I kunddetalj-vyn finns kortet **"Säljpresentation"** med två knappar:

| Knapp | Tid | Beskrivning |
|-------|-----|-------------|
| **Snabb** | Direkt | Mall-baserad, fyller i kundens data |
| **AI-genererad** | 15-30 sek | Claude skapar anpassat innehåll |

Resultatet är en HTML-presentation (reveal.js, 12 slides) som öppnas i ny flik.

---

## 8. Trello — Projekthantering

Vi använder Trello för att hålla koll på alla kunder och uppgifter.

### Board: "Searchboost"

Logga in med `searchboost.web@gmail.com` på [trello.com](https://trello.com).

### 12 listor (kolumner):

| Lista | Syfte |
|-------|-------|
| **Analys** | Nya kunder som behöver SEO-analys |
| **Offerter** | Offert skickad, väntar på svar |
| **Kund** | Aktiva betalande kunder |
| **Arkiv** | Avslutade/pausade kunder |
| **On-boarding** | Kunder som håller på att aktiveras |
| **SOPs** | Standard Operating Procedures (manualer) |
| **BACKLOG** | Uppgifter som ska göras någon gång |
| **TO DO** | Nästa uppgifter att ta tag i |
| **IN PROGRESS** | Pågående arbete |
| **REVIEW** | Klart men behöver granskas |
| **DONE** | Färdigt och verifierat |
| **REPORTS & ANALYTICS** | Rapporter och analyser |

### Automatisk synk med dashboarden

- När du skapar en prospect i dashboarden → Trello-kort skapas automatiskt i "Analys"
- När Lambda kör optimeringar → Trello-kort skapas i "DONE"
- Manuellt loggat arbete → kommentar på kundens Trello-kort

### ABC-nyckelord i Trello

Nyckelord lagras i kortbeskrivningar med formatet:
```
A= nyckelord1, nyckelord2
B= nyckelord3
C= nyckelord4, nyckelord5
```

---

## 9. Deploy och kodändringar (full access)

Du har full access till hela systemet — deploy, kodändringar, infrastruktur. Deploya enligt standardprocessen:

1. **Öppna port 22** (AWS CLI)
2. **Push SSH-nyckel** (60-sekunders fönster)
3. **SCP filer + restart PM2**
4. **Stäng port 22**

Se `CLAUDE.md` i repot för exakta kommandon. Git-push görs efter varje färdig feature.

---

## 10. Vanliga felmeddelanden

| Meddelande | Lösning |
|------------|---------|
| "Företag och webbplats krävs" | Fyll i båda obligatoriska fält |
| "Ange minst ett nyckelord" | Lägg till minst 1 nyckelord i A/B/C |
| "Anslutning misslyckades" | Kontrollera WP-URL och app-lösenord |
| "Fyll i minst en rad" | Ange beskrivning i arbetsloggen |
| Timeout vid nyckelord | Spara max 10 nyckelord per gång |

---

## 11. Komplett flöde: Ny kund från början till slut

```
1. Pipeline → "+ Manuell prospect"
   → Fyll i företagsnamn + webbplats
   → Spara

2. Klicka på kunden → Flytta till "Offert"

3. Flytta till "Orderbekräftelse"
   → Fyll i tjänstetyp + belopp + startdatum

4. Flytta till "Uppstart"
   → Fyll i geografi + ABC-nyckelord

5. Gå till Credentials-fliken
   → Fyll i WP-credentials + GSC property
   → Testa WP-anslutning

6. (Valfritt) SEO-analys
   → Klistra in från SE Ranking

7. (Valfritt) Åtgärdsplan
   → Auto-generera eller skriv manuellt

8. Klicka "Aktivera"
   → Kunden är nu aktiv med automatisk optimering
```

---

## 12. Bra att veta

- **API-nyckeln** skickas automatiskt vid varje anrop — du behöver inte göra något
- **Trello** synkas automatiskt när du skapar prospects eller loggar arbete
- **Veckorapporter** inkluderar ALLT — både automatiskt och manuellt arbete
- **Budgethantering** styrs av tier:
  - Basic (≤5000 kr): Max 15 uppgifter/månad
  - Standard (≤10000 kr): Max 30 uppgifter/månad
  - Premium: Max 50 uppgifter/månad
- **Dashboarden funkar bäst i Chrome** på desktop
- Alla data sparas i BigQuery — inget försvinner

---

## 13. Kontakt

- **Mikael:** mikael@searchboost.se
- **Dashboard:** http://51.21.116.7/
- **Trello:** searchboost.web@gmail.com

---

*Dokumentet är en del av Searchboost Opti.*
