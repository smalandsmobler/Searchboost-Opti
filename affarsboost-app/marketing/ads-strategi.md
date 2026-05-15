# Affärsboost — Ads-strategi

**Mål:** Bygga en betalande prenumerantbas utan att kampanjerna kan kopplas direkt till Searchboost AB eller Mikaels personliga varumärke.

---

## Fas 1 — Organisk gratis-spridning (Vecka 1-4)

**Syfte:** Samla de första 50-100 e-postadresser via personlig lista + väntetid-sida.
Inga annonspengar ännu. Validera att budskapet konverterar.

**Åtgärder:**
- Mikael skickar till sin 6-åriga kontaktlista (mall: `personlig-lista-mall.md`)
- LinkedIn-inlägg från Mikaels privata profil (ej Searchboost-sidan)
- Länk till affarsboost.se i Searchboost-signatur och bio

**KPI att nå innan Fas 2:**
- Minst 30 anmälningar på waitlist-formuläret
- Open rate > 35 % på personliga mail
- Bounce rate < 60 % på landningssidan

---

## Fas 2 — Meta-annonsering (Vecka 4-8)

### Pixel-setup (krävs innan annonser)
1. Skapa Meta Business Manager under nytt konto (inte Searchboost-sidan)
2. Skapa Meta Pixel → installera i affarsboost-app via `NEXT_PUBLIC_META_PIXEL_ID`
3. Skapa Custom Conversion: `Lead` (pixelkod redan installerad i WaitlistForm)
4. Konfigurationsbok: `affarsboost.se` → Business Manager → affarsboost.se-sida

### Kampanj A — Retargeting av besökare (prioritet 1)
- **Audience:** Website Visitors senaste 30 dagar (behöver ~500 besök)
- **Budskap:** "Du var inne och tittade — vi öppnar platser den här veckan"
- **Format:** Single image + short-form video (30 sek)
- **Budget:** 50-100 kr/dag
- **CTA:** Gå till formuläret, anmäl dig

### Kampanj B — Lookalike av e-postlistan (Fas 2b)
- **Audience:** Custom Audience av anmälda e-poster → 1-3 % Lookalike Sverige
- **Kräver:** Minst 200 e-poster med Meta-matchning (e-post eller telefon)
- **Budskap:** "299 kr/mån — allt en soloföretagare behöver"
- **Budget:** 200-300 kr/dag

### Kampanj C — Intressebaserat kallstart (om Lookalike saknas)
**Targeting-kombinationer att testa:**

| Segment | Intressen/Beteenden |
|---|---|
| Nystartat | "Starta företag", "egenanställd", "frilans", "F-skatt" |
| Etapperade | "Bokföring", "Fortnox", "Visma", "faktura" |
| E-handlare | "WooCommerce", "Shopify", "dropshipping", "e-handel Sverige" |
| Konsulter | "IT-konsult", "redovisning", "HR-konsult" |

**Exkludera:** Anmälda e-poster (Custom Audience), anställda med fast lön

**Targeting-rad i Meta:**
- Land: Sverige
- Ålder: 25-55
- Språk: Svenska
- Intressen: (ett segment ovan per ad set)
- Exkludera: Custom Audience från waitlist-formuläret

### Kreativt — Meta

**Video (primärt):**
- Linnéa-avataren (valda kandidaten) berättar 30 sek
- Text: "Tröttnat på att inte veta vad du kan dra av? Affärsboost fixar det."
- Hook: "Jag sparade 4 000 kr förra månaden — och jag visste inte ens om bidraget"
- Voice: Gemini TTS svenska (script i `avatar-scripts.md`)

**Stillbild (sekundärt):**
- Mockup av veckonyhetsbrevet på laptop/mobil
- Text overlay: "299 kr/mån — no BS, bara det du faktiskt behöver"

---

## Fas 3 — Google Ads (Vecka 6-12)

### Varför Google Ads för Affärsboost?
Sökvolumsbaserat — folk googlar aktivt på problem Affärsboost löser.
Intentionen är redan hög. Konverteringsgraden är ofta högre än Meta.

### Sökord att köpa

**Tier A — Hög intention, köp direkt (CPC ~5-15 kr)**

| Sökord | Månadsvolym (est.) | Matchtyp |
|---|---|---|
| "startbidrag 2026" | 1 200 | Phrase |
| "startbidrag hur ansöka" | 600 | Broad |
| "starta eget bidrag" | 800 | Phrase |
| "F-skatt avdrag" | 400 | Exact |
| "momsavdrag egenföretagare" | 700 | Phrase |
| "uppdragsavtal mall" | 500 | Phrase |
| "fakturamall gratis" | 900 | Phrase |

**Tier B — Utbildning + need-creation (CPC ~3-8 kr)**

| Sökord | Månadsvolym (est.) |
|---|---|
| "egenföretagare tips 2026" | 300 |
| "soloföretagare avdrag" | 250 |
| "eget företag kostnader" | 800 |
| "vad kan jag dra av på skatten" | 1 500 |
| "frilansare skattefrågor" | 400 |

**Negativa sökord (viktigt — lägg till från start):**
- anställd, lön, jobb, blocket, köpa bolag, AB bolag registrera, aktiebolag starta

### Annonskonfiguration Google Ads

**Kampanjtyp:** Search + Performance Max parallellt (testa Performance Max vecka 4+)

**Annonstexter (3 rubriker + 2 beskrivningar):**

Rubriker:
1. "Affärsboost — 299 kr/mån"
2. "Startbidrag, avdrag & mallar"
3. "AI-coach för egenföretagare"

Alternativa rubriker (testa):
- "Ingen bindningstid — säg upp direkt"
- "Allt en soloföretagare behöver"
- "Veckonyhetsbrev + AI-stöd"

Beskrivningar:
1. "Veckonyhetsbrev, avtalsmallar, AI-coach och startbidragsguider. Allt samlat. Prova gratis en vecka."
2. "Vet du vilka bidrag du kan söka? Affärsboost håller koll åt dig. 299 kr/mån, säg upp när du vill."

**Landningssida:** affarsboost.se (mobil-first, formuläret synligt utan scroll)

**Conversion tracking:**
- Mål 1: Waitlist-anmälan (Lead) — primärt
- Mål 2: Klick på "Läs mer" — sekundärt

**Dagbudget att börja med:**
- Vecka 1-2: 50 kr/dag (validering)
- Vecka 3-4: 150 kr/dag (skala det som konverterar)
- Vecka 5+: 300-500 kr/dag (om CPA < 150 kr/anmälning)

---

## Fas 4 — TikTok / Reels (Vecka 8+)

Kräver att Linnéa-avatar-pipelinen är klar (Veo 3 + svensk röst).

**Innehållsformat:**
- 3-5 videos/vecka, 30-60 sek
- Formel: Hook (problem) → Lösung → CTA
- Exempel: "Visste du att du kan dra av den här typen av kostnad? Jag visste inte förrän..."
- Posta organiskt först → boosta det som organiskt presterar (Spark Ads på TikTok)

**TikTok Ads-setup:**
- Skapa TikTok for Business-konto (separat från allt annat)
- Kampanjtyp: Reach + Conversion
- Audience: Sverige, 25-50, Custom Intent (liknande Google)

---

## Annonseringskalender

| Vecka | Aktivitet | Budget |
|---|---|---|
| 1-2 | Personlig lista + LinkedIn | 0 kr |
| 3 | Meta Pixel aktiv, validerar tracking | 0 kr |
| 4 | Meta retargeting av besökare | 50 kr/dag |
| 5-6 | Meta interest targeting + Google Ads Tier A | 300 kr/dag |
| 7-8 | Google Ads Tier B + Lookalike om data finns | 500 kr/dag |
| 9+ | Performance Max + TikTok Spark Ads | 800 kr/dag |

---

## Spårnings-setup (sammanfattning)

Steg att göra:
1. Skapa Meta Business Manager → ny sida "Affärsboost"
2. Skapa Pixel → aktivera i `.env.local` med `NEXT_PUBLIC_META_PIXEL_ID=xxxxx`
3. Sätt upp GA4 Property → `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-xxxxx`
4. Sätt upp GTM Container → `NEXT_PUBLIC_GTM_ID=GTM-xxxxx`
5. Skapa Google Ads-konto → konverteringsspårning mot `/api/waitlist` 200-svar
6. Aktivera alla i `.env` på EC2 → `pm2 restart affarsboost-app`

Tracking-koden sitter redan i affarsboost-app — det är bara att fylla i ID:n.

---

## Budskap att INTE använda (risker)

- Nämn INTE Searchboost AB i annonserna
- Nämn INTE Mikael Larsson vid namn
- Nämn INTE "SEO" — det är för nischerat
- Använd INTE Searchboost.se-domänen i Meta-annonskontot
- Använd INTE klientfoton eller loggor utan tillstånd

Affärsboost ska stå som ett eget varumärke.
