# Babylovesgrowth - Lanseringsplan

## Sajt: smalandskontorsmobler.se

---

## STEG 1: Publicera (idag)

### 1.1 Deploy på Render (gratis)
- [ ] Gå till https://render.com och logga in med GitHub
- [ ] Klicka "New" > "Web Service"
- [ ] Välj repot `smalandsmobler/Babylovesgrowth`
- [ ] Branch: `claude/upload-functionality-AlyxQ` (eller merga till main först)
- [ ] Render hittar render.yaml automatiskt
- [ ] Lägg till environment variables:
  - `SERANKING_API_KEY` = e39fc947-bf42-2815-921e-4ab8a04286d9
  - `RANKMATH_API_KEY` = e5478611cf9f458ff5a7534019b6fe12
  - `WP_SITE_URL` = https://smalandskontorsmobler.se
  - `API_KEY` = (valfri - sätt en nyckel för att skydda API:et)
- [ ] Klicka "Create Web Service"
- [ ] Vänta 2-3 minuter - du får en URL typ: babylovesgrowth.onrender.com

### 1.2 Verifiera att allt fungerar
- [ ] Öppna URL:en i webbläsaren - se dashboarden
- [ ] Testa filuppladdning
- [ ] Testa SE Ranking (klicka "Konto" och "Sajter")
- [ ] Testa RankMath (klicka "Inlägg" och "Sidor")

---

## STEG 2: Koppla ihop med smalandskontorsmobler.se

### 2.1 WordPress / RankMath
- [ ] Logga in på smalandskontorsmobler.se/wp-admin
- [ ] Gå till RankMath > Allmänna inställningar > REST API
- [ ] Verifiera att API-nyckeln e5478611cf9f458ff5a7534019b6fe12 är aktiv
- [ ] Testa: klicka "Inlägg" på dashboarden - ser du WP-inlägg?

### 2.2 SE Ranking
- [ ] Logga in på SE Ranking
- [ ] Verifiera att smalandskontorsmobler.se finns som sajt
- [ ] Notera sajt-ID:t
- [ ] Testa: skriv in sajt-ID på dashboarden och klicka "Nyckelord"

### 2.3 Google Search Console
- [ ] Lägg till smalandskontorsmobler.se i GSC om den inte redan finns
- [ ] Verifiera ägande via DNS eller HTML-tagg
- [ ] Koppla GSC till SE Ranking (under Inställningar > Analytics)

### 2.4 Google Analytics
- [ ] Verifiera att GA4 är installerat på smalandskontorsmobler.se
- [ ] Koppla GA till SE Ranking

---

## STEG 3: SEO-uppstart (vecka 1)

### 3.1 Nyckelordsanalys (ABC-modellen)
- [ ] A-ord (primära): 5-10 huvudnyckelord
  - Exempel: "kontorsmöbler småland", "skrivbord jönköping"
- [ ] B-ord (sekundära): 15-20 stödord
  - Exempel: "ergonomiskt skrivbord", "kontorsstol billig"
- [ ] C-ord (long-tail): 20-30 långa sökfraser
  - Exempel: "bästa kontorsstolen för hemmakontor småland"
- [ ] Lägg in alla i SE Ranking

### 3.2 Site Audit
- [ ] Kör audit via SE Ranking eller dashboarden
- [ ] Lista alla kritiska fel (röda)
- [ ] Lista varningar (gula)
- [ ] Prioritera: snabbhet, mobil, brutna länkar, meta-taggar

### 3.3 On-page SEO (RankMath)
- [ ] Granska alla sidors meta-titel och beskrivning
- [ ] Uppdatera via dashboarden (PUT /rankmath/posts/:id/seo)
- [ ] Sätt fokus-nyckelord per sida
- [ ] Sikta på RankMath-poäng 80+ per sida

---

## STEG 4: 3-månaders arbetsplan

### Månad 1 - Teknisk SEO & On-page
- Åtgärda alla kritiska audit-fel
- Optimera meta-titlar och beskrivningar
- Fixa sidladdningstid (Core Web Vitals)
- Sätta upp interna länkar
- Skapa XML-sitemap och robots.txt

### Månad 2 - Innehåll & Optimering
- Skapa/uppdatera landningssidor för A-nyckelord
- Blogginlägg riktade mot B- och C-nyckelord (2 per vecka)
- Optimera bilder (alt-text, filstorlek)
- Schema markup (LocalBusiness, Product)

### Månad 3 - Auktoritet & Lokal SEO
- Google Business Profile optimering
- Lokal länkbyggning (branschkataloger, lokala sajter)
- Kundrecensioner-strategi
- Uppföljning och rapportering
- Jämföra rankings: start vs nu

---

## STEG 5: Löpande (varje vecka)

### Veckologg-rutin
- [ ] Måndag: Kolla rankings i SE Ranking
- [ ] Tisdag-torsdag: Utför veckans uppgifter
- [ ] Fredag: Skriv veckologg (punktform):
  - Vad gjordes
  - Ranking-förändringar
  - Nästa veckas prioriteringar

### Rapportering (månatlig)
- [ ] Looker Studio-rapport till kund
- [ ] Innehåll: Trafik, Rankings, Audit-score, Utfört arbete
- [ ] Skicka till kund med kort sammanfattning

---

## STEG 6: Trello-tavla (kundhantering)

### Listor att skapa:
1. **Inkorg** - Nya förfrågningar/uppgifter
2. **Uppstart** - Kundinfo, tillgångar, nyckelordsanalys
3. **Denna vecka** - Veckans uppgifter
4. **Pågår** - Under arbete
5. **Granskning** - Väntar på kundens OK
6. **Klart** - Avslutade uppgifter

---

## Checklista - Redo för lansering?

- [x] API byggt (upload, SE Ranking, RankMath)
- [x] Testsida/Dashboard byggd
- [x] 24 tester gröna
- [x] Docker-stöd
- [x] CI/CD pipeline
- [x] Render deploy-config
- [ ] Deployad på Render
- [ ] SE Ranking kopplat
- [ ] RankMath kopplat
- [ ] GSC kopplat
- [ ] GA kopplat
- [ ] Nyckelordsanalys klar
- [ ] Site audit körd
- [ ] Arbetsplan skapad
- [ ] Trello-tavla skapad
- [ ] Första veckologgen skriven
