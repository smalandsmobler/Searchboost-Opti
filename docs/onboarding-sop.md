# Onboarding — Ny kund i Searchboost Opti

> Används när: avtal är signerat, analys klar, ABC-nyckelord finns
> Vem kör: Viktor (steg 1–5) + Mikael/Claude (steg 6–8, SSM)
> Uppdaterad: 2026-02-23

---

## Förutsättningar — ha detta klart INNAN du börjar

| Vad | Var hämtar du det |
|-----|-------------------|
| Domän / webb-URL | Avtalsdokumentet |
| Företagsnamn (exakt) | Avtalsdokumentet |
| Kontaktperson | Avtalsdokumentet |
| Kontaktmail (kundens) | Avtalsdokumentet |
| WordPress-användarnamn | Kunden skapar det (se Steg 3) |
| WordPress Application Password | Kunden skapar det (se Steg 3) |
| GSC Property-URL | Google Search Console → kunden delar SA |
| GA4 Property-ID | Google Analytics → Settings → Property ID |
| ABC-nyckelord (A/B/C) | Från analysen (nyckelordsrapporten) |

---

## Steg 1 — Lägg till i Pipeline

**Vem:** Viktor eller Mikael

1. Öppna Dashboard → **Pipeline**
2. Klicka **+ Manuell prospect**
3. Fyll i: Företagsnamn, webbadress, kontaktperson, kontaktmail
4. Klicka Spara → kunden hamnar i "Analys"-kolumnen

> Trello-kort skapas automatiskt.

---

## Steg 2 — Flytta kunden till rätt stadie

**Vem:** Viktor

Pipeline-ordning efter avtal:
```
Analys → Offert → Orderbekräftelse → Uppstart → Åtgärdsplan → Aktiv
```

Klicka på kundens kort → **Flytta till "Uppstart"** (eller "Aktiv" om allt är klart).

---

## Steg 3 — WordPress Application Password

**Vem:** Viktor hjälper kunden

Be kunden göra detta i sin WordPress-admin:

1. Logga in på WordPress → **Användare → Din profil**
2. Scrolla ned till **"Appliktionslösenord"**
3. Skriv in namn: `Searchboost`
4. Klicka **Lägg till nytt appliktionslösenord**
5. Kopiera lösenordet som visas (visas bara en gång)
6. Skicka till Viktor: `användarnamn` + `lösenordet`

**Spara det ordentligt** — du ser det inte igen.

---

## Steg 4 — GSC: Lägg till Searchboost Service Account

**Vem:** Viktor hjälper kunden

Be kunden göra detta i Google Search Console:

1. Gå till [search.google.com/search-console](https://search.google.com/search-console)
2. Välj rätt property (domänen)
3. Klicka **Inställningar** (kugghjulet nere till vänster)
4. Välj **Användare och behörigheter → Lägg till användare**
5. Mail: `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
6. Behörighet: **Fullständig**
7. Klicka Lägg till

> GSC-data börjar samlas in efter att onboarden är klar.

---

## Steg 5 — Samla ihop all info

Innan du går vidare — säkerställ att du har:

- [ ] Domän: `https://www.foretagsnamn.se/`
- [ ] Företagsnamn: `Företaget AB`
- [ ] Kontaktperson: `Förnamn Efternamn`
- [ ] Kontaktmail: `namn@foretagsnamn.se`
- [ ] WP-URL: `https://www.foretagsnamn.se`
- [ ] WP-användarnamn: `admin` (eller vad kunden har)
- [ ] WP App-lösenord: `xxxx xxxx xxxx xxxx xxxx xxxx`
- [ ] GSC Property: `https://www.foretagsnamn.se/` (exakt som i GSC)
- [ ] GA4 Property-ID: `123456789`

---

## Steg 6 — Registrera kunden i systemet

**Vem:** Viktor via Dashboard → Onboarding ELLER Mikael/Claude via API

### Alt A — Dashboard (enklast)

1. Öppna Dashboard → **Onboarding** (fliken i toppraden)
2. Fyll i alla fält (se steg 5-checklistan ovan)
3. Klicka **Registrera kund**
4. System-ID skapas automatiskt från domänen (t.ex. `foretagsnamn-se`)
5. Kunden dyker upp i Pipeline och i alla listvyer

### Alt B — Via Claude Code (om Dashboard-formen ej fungerar)

Säg till Claude:
> "Onboarda [företagsnamn] med dessa uppgifter: domän = X, kontakt = Y, WP-user = Z, WP-pass = W, GSC = V, GA4 = U"

Claude anropar `/api/onboard` och registrerar kunden i SSM + BigQuery + Trello.

---

## Steg 7 — Lägg in ABC-nyckelord

**Vem:** Viktor

1. Dashboard → **Pipeline** → klicka på kunden
2. Klicka **"ABC-nyckelord"**
3. Fyll i A-ord, B-ord, C-ord med sökvolymer
4. Klicka **Spara nyckelord**

Format: ett ord per rad, eller kommaseparerat.

---

## Steg 8 — Generera åtgärdsplan

**Vem:** Viktor

1. Dashboard → kundkortet → **"Åtgärdsplan"**
2. Klicka **"Generera med AI"**
3. Granska planen (AI skapar 3 månader med konkreta uppgifter)
4. Om godkänd → klicka **"Aktivera månad 1"**

> Systemet börjar nu köa uppgifter för den här kunden.

---

## Steg 9 — Skapa kundportal-konto

**Vem:** Viktor via Dashboard ELLER Claude

1. Dashboard → kundkortet → **"Kundportal"** → **Skapa konto**
2. Ange kundens mail → temporärt lösenord genereras
3. Notera: `mail` + `temporärt lösenord`

Kunden loggar in på: `https://opti.searchboost.se/portal.html`

---

## Steg 10 — Flytta till "Aktiv" + Skicka välkomstmail

**Vem:** Viktor

1. Flytta kunden till **"Aktiv"** i Pipeline
2. Skicka mail till kunden med:
   - Länk till kundportalen: `https://opti.searchboost.se/portal.html`
   - Inloggningsmail
   - Temporärt lösenord
   - Be dem byta lösenord vid inloggning

**Malltext:**
```
Hej [Namn],

Välkommen som kund hos Searchboost! Vi har nu satt upp allt i vårt system och
din kundzon är redo.

Inloggning:
Adress: https://opti.searchboost.se/portal.html
Mail: [kundens mail]
Lösenord (temporärt): [lösenord]

Byt lösenordet direkt när du loggat in.

I kundportalen kan du följa dina sökordpositioner, se vad vi optimerat och
chatta med vår AI om din SEO.

Hör av dig om du har frågor.

Hälsningar,
Mikael
Searchboost
```

---

## Kontrollista — färdig onboarding

- [ ] Kund registrerad i systemet (system-ID skapas)
- [ ] WP-credentials sparade och testade
- [ ] GSC Service Account tillagd av kunden
- [ ] ABC-nyckelord inlagda (minst 3 A-ord)
- [ ] Åtgärdsplan genererad och aktiverad (månad 1)
- [ ] Kundportal-konto skapat
- [ ] Kund flyttad till "Aktiv" i Pipeline
- [ ] Välkomstmail skickat
- [ ] Trello-kort uppdaterat med "Onboarding klar [datum]"

---

## Vanliga problem

| Problem | Lösning |
|---------|---------|
| WP-lösenordet fungerar inte | Kunden måste ha rollen **Redaktör** eller **Administratör** |
| GSC visar "Ej ägare" | Det är OK — "Fullständig" räcker för oss |
| System-ID krockar (409-fel) | Kunden finns redan — sök i Pipeline |
| ABC-nyckelord sparas inte | Max 10 st per klick — spara i omgångar |
| Åtgärdsplan skapas tom | ABC-nyckelord måste vara ifyllda först |

---

## Teknisk info (för Claude/Mikael)

API-anrop för manuell registrering:
```
POST http://51.21.116.7/api/onboard
Headers: X-Api-Key: [från SSM /seo-mcp/dashboard/api-key]

Body:
{
  "company_name": "Företaget AB",
  "contact_person": "Förnamn Efternamn",
  "contact_email": "namn@foretagsnamn.se",
  "wordpress_url": "https://www.foretagsnamn.se",
  "wordpress_username": "admin",
  "wordpress_app_password": "xxxx xxxx xxxx xxxx xxxx xxxx",
  "gsc_property": "https://www.foretagsnamn.se/",
  "ga_property_id": "123456789"
}
```
