# Användarmanual — Content Blueprint + AI-synlighet

Senast uppdaterad: 2026-02-20

---

## Vad är Content Blueprint?

Content Blueprint är Searchboosts automatiska innehållsplanerare. Den ersätter och förbättrar
Planable-flödet och genererar varje månad en skräddarsydd innehållsplan per kund baserad på:

- Riktiga GSC-sökord med potential (position 4–25, hög synlighet, låg CTR)
- ABC-nyckelord som är konfigurerade i systemet
- Befintligt innehåll (undviker att föreslå sidor som redan optimerats)
- Claude AI-analys av semantiska gap och konkurrentmöjligheter

Resultatet: 4 konkreta artikelförslag med titel, URL, outline och motivering — direkt i Trello.

---

## Hur det fungerar

### Automatiskt (varje månad)

Lambda `content-blueprint-generator` körs den 1:a varje månad kl 07:00 CET.

Den:
1. Hämtar alla kunder som har ABC-nyckelord konfigurerade
2. Hämtar GSC-data (60 dagars sökord med potential)
3. Skickar data till Claude Haiku för analys
4. Skapar ett Trello-kort i TO DO-listan med hela planen
5. Sparar planen i BigQuery (`content_blueprints`-tabellen)

### Manuellt (när som helst)

Kör via AWS Lambda Console: `content-blueprint-generator` → Test → kör.

Eller lokalt (för testning):
```bash
cd lambda-functions
node -e "require('./content-blueprint-generator').handler({}).then(r => console.log(r.body))"
```

---

## Trello-kortets struktur

Varje kund får ett kort som ser ut så här:

```
Titel: Content Blueprint 2026-03: Möbelrondellen

# Content Blueprint — 2026-03
**Möbelrondellen**

**Tema:** Köpguider och expertinnehåll om kontorsmöbler

## Artiklar denna månad

1. **Så väljer du rätt kontorsstol 2026 — komplett guide**
   Nyckelord: kontorsstol
   URL: /guide/valja-kontorsstol
   Ordmål: ~1500 ord
   Varför: "kontorsstol" rankade pos 8.2, guide kan klättra till top 3

2. **Ergonomiska skrivbord — vad kostar ett höj- och sänkbart bord?**
   ...

## Quick wins (gör denna vecka)
- Uppdatera title på /kontorsstolar/ — den är 78 tecken (för lång)

## Mål
Målet är att klättra 3–5 positioner på "kontorsstol" och öka klick med 40%
```

---

## Viktors arbetsflöde med Content Blueprint

**Varje månad (runt den 5:e):**

1. Öppna Trello → hitta kortet "Content Blueprint [månad]: [kund]"
2. Läs igenom artikelförslagen
3. Välj 1–2 att skriva denna period (börja med högst prioritet)
4. Klicka på länken i "Kundzon" → "Åtgärdsplan" för att se om det finns överlapp
5. Skriv artikeln (Claude hjälper med outline, rubriker, fakta)
6. Publicera på kundens WP (Claude QA:ar mot SEO-checklista innan)
7. Bocka av Trello-kortet

**Viktigt:**
- Skriv INTE alla 4 på en gång — välj 1–2 per sprint
- Prioritet 1 = allra viktigast (bäst GSC-potential)
- Koordinera med Mikael om kunden vill godkänna ämnen före publicering

---

## AI-synlighet — vår Otterly

### Vad det är

Varje måndag mäter `ai-visibility-tracker` hur synliga kundernas varumärken är i AI-sökmotorer
(simulerat via Claude som stand-in för ChatGPT/Perplexity/Google AI).

5 frågor per kund → räknar hur många gånger varumärket nämns → Share of Model (SoM).

### Var det visas

**I dashboard (Mikael/Viktor):**
- Kunddetalj → nytt "AI-synlighet"-kort (implementeras i nästa sprint)

**I kundportalen:**
- Sektion "AI-synlighet" med SoM-mätare

**I BigQuery:**
- Tabell: `ai_visibility_metrics`
- Fält: `share_of_model`, `mention_count`, `sentiment`, `competitor_mentions`

### SoM-tolkning

| SoM | Vad det betyder |
|-----|----------------|
| 80–100% | Utmärkt — varumärket är välkänt i AI |
| 40–80% | Bra — syns i de flesta sökningar |
| 20–40% | Svag — konkurrenter nämns oftare |
| 0–20% | Saknas — varumärket finns knappt i AI-träningsdata |

### GEO-åtgärder vid låg SoM

Om en kund har SoM < 40%, rekommendera:
1. Skriv fler artiklar som citeras (Wikipedia, branschtidningar)
2. Pressreleaser och omnämnanden i media
3. Strukturerade data (schema.org Organization, FAQ)
4. Svara på Quora/Reddit-frågor i kundens bransch
5. Publicera på branschtidningarnas sajter (gästartiklar)

---

## Lead Generator med AI-synlighet

### Standardanvändning (utan AI)
```bash
node scripts/lead-generator.js exempel.se
```

### Med AI-synlighetstest (kräver API-nyckel)
```bash
ANTHROPIC_API_KEY=sk-ant-... node scripts/lead-generator.js exempel.se
```

AI-blocket läggs automatiskt till i rapporten:

```markdown
## AI-synlighet (Share of Model)
- Resultat: 1 av 5 AI-prompts nämner varumärket
- SoM-score: 20% (Svag)
- Möjlighet: Er konkurrent nämns troligen istället — GEO-optimering
  kan öka er synlighet i ChatGPT, Perplexity och Google AI Overviews
```

### I mailtext till prospektet

Automatisk tillägg om SoM < 40%:

```
Bonusfynd — AI-sökmotorer: Er webbplats nämns i 20% av AI-sökningar i er
bransch. Er konkurrent syns troligen istället. Vi hjälper er att optimera
för ChatGPT och Google AI Overviews.
```

### Försäljningstips

Det här är ett starkt säljargument:

"Visste du att när dina kunder frågar ChatGPT om [bransch] i Sverige,
nämns inte ditt företag? Vi har mätt det — din konkurrent nämns i 4 av 5
frågor. Vill du veta hur vi fixar det?"

---

## Prissättning för kunder

| Nivå | Pris | Vad ingår |
|------|------|-----------|
| Basic (≤5000 kr/mån) | Ingår | Content Blueprint (4 förslag/mån) |
| Standard (≤10 000 kr/mån) | +500 kr/mån | Blueprint + AI-synlighetsrapport |
| Premium (>10 000 kr/mån) | +1500 kr/mån | Blueprint + AI-synlighet + Viktor skriver 2 artiklar |
| Employee Content | +2000 kr/mån | Hjälp med medarbetarinnehåll på LinkedIn/blogg |

---

## Felsökning

| Problem | Lösning |
|---------|---------|
| Ingen blueprint genererades | Kontrollera att kunden har ABC-nyckelord i systemet |
| Trello-kort saknas | Kontrollera att `trello/board-id` är rätt i SSM |
| AI-synlighet visar 0% alltid | Varumärket kanske är för litet för AI-träningsdata — normalt för nya kunder |
| Lead generator kraschar | Kolla att domänen svarar på HTTPS. Testa: `curl -I https://domän.se` |

---

## Teknisk info (för Mikael)

| Lambda | Schema | Kostnad |
|--------|--------|---------|
| `content-blueprint-generator` | 1:a varje månad, 07:00 CET | ~$0.05/kund/mån |
| `ai-visibility-tracker` | Varje måndag, 07:30 CET | ~$0.02/kund/vecka |

Deploy-kommandon finns i `CLAUDE.md` under Deploy-process.
