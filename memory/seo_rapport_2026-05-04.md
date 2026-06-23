# SEO-rapport — alla kunder 2026-05-04

Genererad av seo-agent (OpenRouter free LLMs) mot alla 8 aktiva kunder.
Analysmetod: wp_get_credentials → wp_list_pages → wp_get_seo → wp_get_images_no_alt

---

## Sammanfattningstabell

| Kund | Sidor | Bilder utan alt | Topp-problem | Tokens |
|------|-------|-----------------|--------------|--------|
| Jelmtech | 17 | 4 st | Saknade title/meta + alt-text | 33k |
| Ilmonte | ~20 | Okänt | Saknade meta + 401-fel på credentials | 14k |
| Traficator | 58 | 0 (koll ok) | Saknade title/meta på 58 sidor + tunn platsinnehåll | 15k |
| Humanpower | 29 | 16 st | Startsidan utan meta + 16 bilder utan alt | 8.6k |
| Möbelrondellen | 29 | 6 st | Startsidan utan meta + 6 bilder utan alt | 27k |
| Nordic Snus Online | 100 | 0 st | Hela sajten saknar Rank Math-metadata | 24k |
| Smålands Kontorsmöbler | 50+ | 0 st (bra) | Avbrutna meta-descriptions + robots-fält tomt | 31k |
| Tobler | ~15 | 8 st | Startsidan utan meta + 8 bilder utan alt | 7k |

---

## Jelmtech (jelmtech.se)

**Topp-5 problem:**
1. **Saknade title/meta-description** på 17 sidor — kritisk prioritet
2. **4 bilder utan alt-text** (ID 7810-7815)
3. **Felaktig H1-hierarki** — multipla H1 eller saknas helt
4. **Tunn innehåll** (Jobba hos oss, Kontakt, Nyheter)
5. **Saknade focus keywords** i Rank Math

**Åtgärder:**
- Skriv unika titles 55-60 tecken med primärt nyckelord + varumärke på alla 17 sidor
- Lägg till alt-text: "Jelmtech logotyp svart", "Prototyp plastdetalj 3D-skrivare", "Designer CAD-modell", "Produktutveckling abstrakt"
- Sätt H1 = sidans huvudämne + nyckelord på varje sida
- Expandera tunna sidor med 300-500 ord unik text
- Välj specifika focus keywords (t.ex. "plastkonstruktion Ängelholm", "prototypfabrik Skåne")

---

## Ilmonte (ilmonte.se)

**OBS:** Credentials ger 401 — kan behöva uppdateras i SSM/wp_credentials.md

**Topp-5 problem:**
1. **Saknade/svaga meta-descriptions** på transaktionssidor (kassan, varukorg, mitt-konto, butik)
2. **Tunn innehåll** på transaktionella sidor
3. **Bilder utan alt-text** i produktbiblioteket
4. **Ojämn H1-struktur** (kontakt, nyheter, pdf-info)
5. **Saknade focus keywords**

**Åtgärder:**
- Skriv unika meta-descriptions 150-160 tecken med CTA och geografisk relevans
- Lägg till min 300 ord per sida med köpguide/FAQ/tips
- Kör wp_get_images_no_alt och uppdatera alt-text med produktnamn
- Sätt exakt 1x H1 per sida med fokus-nyckelord
- Välj specifika keywords per sida (t.ex. "scenpodier uthyrning", "eventmöbler Stockholm")

---

## Traficator (traficator.se)

**Topp-5 problem:**
1. **Saknade/svaga title-taggar** på alla 58 sidor
2. **Saknade meta-descriptions** på hela sajten
3. **Tunn/duplicerat innehåll** på platsspecifika gjuterisidor (Stockholm, Malmö, Göteborg m.fl.)
4. **Ojämn H1-hierarki** på undersidor
5. **Bilder saknar meningsfull alt-text** trots att inga formellt saknas

**Åtgärder:**
- Skriv unik title per sida: "Gjuteri [Stad] | Traficator" (55-60 tecken)
- Skriv meta-description med lokal relevans + CTA "Kontakta oss för offert"
- Expandera platsidor till 400-600 unika ord med lokala kundcase och marknadsinfo
- Korrigera H1 på varje sida — ett per sida, innehåller primärt nyckelord
- Skriv beskrivande alt-text med produktionskontext ("pressgjutning aluminiumdelar Traficator")

---

## Humanpower (humanpower.se)

**Topp-5 problem:**
1. **Startsidan helt utan SEO-meta** (title/description saknas — 404 från Rank Math)
2. **16 bilder utan alt-text** i mediebiblioteket
3. **Tunn innehåll** på kassa, varukorg, mitt-konto, integritetspolicy, kontakt
4. **Inkonsekvent H1/H2/H3-struktur** på sidor
5. **Focus keywords för breda** (t.ex. "kosttillskott välmående" — bör vara singular)

**Konkreta alt-texter att lägga till:**
- ID 819: "Astaxantin-burk – Human Power kosttillskott"
- ID 818: "AstaSkin-burk – isländsk astaxanthin för hudvård"
- ID 817: "AstaEye-burk – naturligt stöd för ögonhälsa"
- ID 816: "SagaPRO-burk – probiotika för urinvägsfunktion"
- ID 815: "Kosttillskott-hero med Island-bakgrund"
- (+ 11 till)

**Startsida title:** "Human Power – Samtalspedagog & kosttillskott för välmående" (55 tecken)
**Startsida description:** "På Human Power erbjuder vi samtalsterapi, kosttillskott och retreat-upplevelser för att stärka din mentala och fysiska hälsa. Boka ett första samtal idag!" (158 tecken)

---

## Möbelrondellen (mobelrondellen.se)

**Topp-5 problem:**
1. **Startsidan saknar title och meta-description** (Rank Math 404)
2. **6 bilder utan alt-text** — specifika ID:n identifierade
3. **Tunn/duplicerat innehåll** på lokala ortssidor (Sveg, Mora, Orsa m.fl.)
4. **Ojämn H-tagg-struktur** på startsidan
5. **Tomma rank_math_robots-fält** — risk för oklart indexeringsstatus

**Konkreta bilder att åtgärda:**
- ID 5534 (COMO.png): "COMO soffa – grå tygsoffa med träben från Möbelrondellen"
- ID 5452 (TUVA XDEEP): "Tuva X-Deep 1,5-sits soffa i everglade-grönt tyg – Möbelrondellen"
- ID 5410 (ALL IN 3,5-SEATER): "All-In 3,5-sits hörnsoffa med Brooks Flint tyg – Möbelrondellen"
- ID 5407 (ALL-IN 1,5+COZY): "All-In 1,5-sits + coffert soffa i Raymond Rosemary tyg – Möbelrondellen"
- ID 5318 (mr-pay-swish.png): "MR Pay Swish-logotyp – betalningsalternativ hos Möbelrondellen"
- ID 5317 (mr-pay-visa.png): "MR Pay Visa-logotyp – kortbetalning hos Möbelrondellen"

**Startsida title:** "Möbler i Mora – kvalitetssängar, soffor & inredning | Möbelrondellen"
**Startsida description:** "Handla kvalitetsmöbler hos familjeägda Möbelrondellen i Mora. Soffor, sängar, matbord & leverans över hela Dalarna. Fri frakt över 5 000 kr – beställ idag!"

---

## Nordic Snus Online (nordicsnusonline.com)

**Topp-5 problem:**
1. **Hela sajten saknar Rank Math-metadata** — title/description/focus keyword/robots tomt på 100 sidor
2. **Plats-/stadssidor** saknar optimerade lokala titles och descriptions
3. **Produkt- och varumärkessidor** saknar SEO-metadata
4. **Guider har svag H-struktur** och tunt innehåll (<300 ord)
5. **Ingen intern länkning** från startsida/guider till plats-/stadssidor

**Prioriterat flöde (max 15 opt):**
- 10 platsidor (Västerås, Örebro, Göteborg m.fl.): title + description + focus keyword + robots = 40 fält
- Format title: "Snus [Stad] – Köp Online | Nordic Snus Online"
- Format desc: "Köp snus online till [Stad] – snabb leverans 1-3 dagar, stort sortiment ZYN, VELO och portionssnus. Beställ idag!"
- 0 bilder saknar alt — redan OK

---

## Smålands Kontorsmöbler (smalandskontorsmobler.se)

**Topp-5 problem:**
1. **Startsidan saknar Rank Math-meta** (404 från endpoint)
2. **Avbrutna meta-descriptions** på ortssidor ("Snabb leverans till Karlstad och." — avbruten text)
3. **Focus keywords med flera ord/fraser** i stället för singular
4. **Tomma rank_math_robots-fält** på de flesta sidor
5. **Title-längder fel** — vissa för långa (68t), vissa för korta (44t)

**Åtgärder:**
- Skriv klara descriptions 150-160 tecken med stadsnamn + CTA
- Singularisera focus keywords: "konferensmöbler" inte "konferensmöbler, fällbord & fällstolar"
- Sätt rank_math_robots = "index,follow" på alla publika sidor
- Justera alla titles till 55-60 tecken, nyckelord så tidigt som möjligt
- 0 bilder utan alt (bra!) — men filnamn generiska, byt vid framtida uppladdning

---

## Tobler (tobler.se)

**Topp-5 problem:**
1. **Startsidan saknar title, meta-description, focus keyword** (Rank Math 404)
2. **Mega Menu Arbetskläder Final** — tom title och focus keyword
3. **8 bilder utan alt-text** i mediebiblioteket
4. **Saknade focus keywords** på flera sidor
5. **Robots-meta oklar** — inte bekräftat index,follow på alla sidor

**Konkreta bilder att åtgärda (30 min total):**
- formsystem-2-mp4-image.jpg: "Formsystem för byggställningar – Tobler"
- arbetsklader-mp4-image.jpg: "Arbetskläder från Portwest och Blåkläder – Tobler"
- bygg-och-montage-mp4-image.jpg: "Bygg- och montagearbete med ställningar – Tobler"
- u-profilsplankor-mp4-image.jpg: "U-profilsplankor för ställningsbyggnad – Tobler"
- fallskydd-till-tak-mp4-image.jpg: "Fallskyddsutrustning för takarbete – Tobler"
- stallningstrailer-mp4-image.jpg: "Ställningstrailer för transport av byggställningar – Tobler"
- modulstallningar-mp4-image.jpg: "Modulställningar för flexibla byggprojekt – Tobler"
- ramstallningar-mp4-image.jpg: "Ramställningar – stabila lösningar från Tobler"

**Startsida title:** "Byggställningar Göteborg | Tobler – Lokalt lager i Torslanda" (57 tecken)

---

## Tekniska noteringar

- `/rankmath/v1/getHead` REST-endpoint 404 på alla sajter — Rank Math REST API ej aktiverat
- seo-agent fallback till `/wp/v2/pages?slug=...` fungerar och hämtar meta-fält
- Ilmonte credentials ger 401 — uppdatera i `memory/wp_credentials.md` + SSM
- Bäst att köra seo-agent i batch om 3 (OpenRouter free-tier rate limit)

## Nästa steg (rekommenderat)

1. **Kör perispa_fix_missing_meta** på alla kunder för att auto-fixa saknade title/description
2. **Kör perispa_fix_missing_alt** för bilder utan alt-text (Humanpower 16st, Tobler 8st, Möbelrondellen 6st, Jelmtech 4st)
3. **Uppdatera Ilmonte-credentials** — testa och bekräfta i wp_credentials.md
4. **Nordic Snus Online** — kräver manuell Rank Math-konfiguration (REST API aktivering)
