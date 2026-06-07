# Möbelrondellen — Ändringslista (svar från Mattias, juni 2026)

> Källa: Mail från Mattias Andersson — tråden "Re: Hemsidan" + mailet "priser lägga till"
> Sammanställd: 2026-06-07
> Status: **EJ DEPLOYAT** — väntar på Mikaels godkännande + svar på öppna punkter

---

## 1. Öppettider (sommar)
- **Lägg till söndagsöppet** för sommaren (har kört stängt söndagar tidigare somrar pga personalbrist/semester, nu löst).
- ⚠️ **Saknas:** exakta klockslag för söndagar.

---

## 2. Nya produkter att skapa — med priser (Bröderna Andersson)
| Produkt | Specifikation | Pris |
|---|---|---|
| Patronen | ink. pall, fårskinn 4 färger | 20 340 kr |
| Särö 3-sits | tyg Millo | 35 800 kr |
| Dixie | tyg Millo | 14 900 kr |
| Focus | fårskinn 4 färger, ink. pall | 24 980 kr |
| Kapten | fårskinn 4 färger, ink. pall | 20 980 kr |
| Cruze | fårskinn 4 färger | 24 900 kr |

---

## 3. Lagerstatus & leveranstid — befintliga produkter

### Normalt lagervara (I lager)
- **Havanna** soffbord (Bordbirger) — **6 800 kr**, i svart, rökt ek och ek
- **Roomers** (Tvilum) — TV-bänkar = lagervara *(vitrinskåp utgått, se §4)*
- **Stockholm** (Englesson) — vitrinskåp = lagervara *(skänkvitrin = 4–6 v, se nedan)*
- **Pocketresår** 80 cm / 120 cm
- **Bäddmadrass Roma** — storlekar 80/90/120/140/160/180 cm
- **Como 3+1+1+bord** (Atleve) — säsongsvara = begränsat antal

### Beställningsvara / leveranstid
- **Tuva X-Deep** (Buhréns) — 6–8 veckor · pris: **utan dun 14 990 kr / med dun 15 990 kr** (två varianter)
- **Oxford** (Buhréns) — 6–8 veckor
- **Hartford** — 8–10 veckor
- **Madrid** soffbord — 2–4 veckor
- **Öland** (Möbelform) — 4–6 veckor, ej i butik
- **Toulouse** matbord — lagervara i 140 cm; även i 200×95, 240×95, 300×100 (rökfärgad ek el. natur ek), 4–5 veckor
- **Stockholm skänkvitrin** (Englesson) — 4–6 veckor
- **Möbelskydd** — vissa storlekar i lager, annars beställningsvara

---

## 4. Produkter att ta bort / utgå
- **Pan** (Kleppe) — **TA BORT** helt
- **Dessie** — utgått
- **Aspen** 180 cm Continental — utgått
- **Monza** (Torkelson) — utgår
- **Lotus** (Möbelform) — utgår
- **Roomers vitrinskåp** (Tvilum) — utgått
- **Ekeberg TV-bänk** — utgår, men **visningsex finns kvar**
- **Allt Ekeberg** (sideboard m.m.) — utgår, men finns kvar i lager/butik än så länge. **OBS: Ekeberg matbord finns ej** → ta bort
- **Chic** (Bröderna Andersson) — utgått, **visningsex kvar → sälj reducerat: 19 980 kr − 30 %**
- **Norris** demoex (Rowico) — behåll, **säljs bort till reducerat pris**
- **Rio fåtöljset** (Atleve) — slut för säsongen, **låt finnas kvar**
- **Hastings utegrupp** — slut för säsongen, **behåll synlig**

---

## 5. Produkter att lägga till (ej i butik)
- **Borgholm förvaring** — kan läggas till, ej representerad i butik
- **Cathrine fåtölj / Genova fåtölj** — **JA, läggs till.** Paketpris fåtölj + pall **5 990 kr**, separat: fåtölj **5 290 kr**, pall **1 190 kr**
- **Vaxholm** — ❌ ska **INTE** läggas till
- **Skanör "paket" Continental 180** — normalt lagervara, kombination medium/fast *(tygangivelse svårläst i bilden)*

---

## ⚠️ Behöver förtydligas innan deploy
1. **Söndagens öppettider** — exakta klockslag saknas.
2. **Cathrine vs Genova** — gäller paketpriserna (5 990 / 5 290 / 1 190) **Genova**? Cathrine angavs separat som fåtölj 7 200 / pall 1 890 i ursprungsfrågan. Vilket pris gäller vilken produkt?
3. **Skanör Continental 180** — tyg/spec otydlig i bilden — bekräfta exakt text.
4. **"Utgår" vs "ta bort"** — för Monza, Lotus, Dessie, Aspen: radera helt från sajten, eller bara markera utgången/slut i lager men låta ligga kvar?

---

## Process (enligt Mikaels mail till Mattias)
- Mattias kan ändra lagerstatus + produkttexter själv (PDF-manual bifogad i tråden).
- Ändrade texter skickas till Mikael → publiceras inom 5 min.
- Deploy mot mobelrondellen.se sker via WooCommerce (REST API / WP-admin).

---

## Deploy-status (2026-06-07)

> ⚠️ Remote-sandboxen når INTE mobelrondellen.se (nätverkspolicy: `403 Host not in allowlist`).
> Deploy måste köras från laptop/EC2 där sajten är nåbar. Allt nedan är **förberett, ej kört**.

### Körklara artefakter
1. **Nya produkter (6 st, Bröderna Andersson)** → `scripts/mobelrondellen-nya-produkter-juni2026.csv`
   - Importeras via WP-admin → WooCommerce → Produkter → Importera.
   - Simple products m. pris + attribut (Material, Varumärke). 4 färger ej uppdelade i varianter (färgnamn saknas).
2. **Pris + lagerstatus på befintliga produkter** → `scripts/mobelrondellen-pris-leverans-2026.js`
   - Kör dry-run först: `node scripts/mobelrondellen-pris-leverans-2026.js`
   - Sätt creds först: `export WP_USER=... WP_APP_PASSWORD=...`
   - Genomför: `... --execute`
   - Täcker: Havanna(6800), Chic(rea 19980→13986), instock-varor, beställningsvaror (onbackorder + leveransinfo), Rio/Hastings (outofstock men synliga).

### GATED — kör EJ förrän kundsvar finns
- **Borttag/utgående** (radera vs markera): Pan, Monza, Lotus, Dessie, Aspen, Roomers vitrinskåp, Ekeberg-gruppen, Ekeberg matbord → väntar på öppen punkt 4.
- **Tuva X-Deep**: två priser (utan dun 14990 / med dun 15990) → kräver variant-uppsättning, sätt manuellt.
- **Norris demoex**: "reducerat pris" men belopp saknas → fråga Mattias.
- **Nya produkters färgvarianter**: 4 färgnamn saknas (fårskinn) för Patronen/Focus/Kapten/Cruze.
- Övriga öppna punkter: söndagstider, Cathrine/Genova-pris, Skanör-spec.

### Säkerhetsnotis
- `scripts/mobelrondellen-seo-fix.js` har WP app-password **hårdkodat i klartext** (mot policy). Bör roteras. Nya scriptet läser från env istället.
