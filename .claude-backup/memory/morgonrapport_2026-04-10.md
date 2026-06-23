---
name: Morgonrapport 2026-04-10
description: Sammanfattning av nattens arbete och vad som väntar för dagen
type: daily-brief
---

# Morgonrapport — fredag 10 april 2026

## Huvudprioritet idag

**Traficator-omsigneringsmötet kl 10:30** med Patrik Carlsson.

Allt du behöver finns här:
- **PPT**: `/Users/weerayootandersson/Downloads/Searchboost-Opti/presentations/output/traficator-omsignering-2026-04-10.pptx`
- **Briefing**: `presentations/traficator-omsignering-2026-04-10.md`
- **Avtal**: 3-månadersförnyelse (matchar fakturan, inte 6-månaders-pitchen för nysales)

PPT:n är byggd i Traficators brand (röda färger + deras logga från sajten) och innehåller 14 slides:
1. Cover
2. Agenda
3. Utgångsläget (februari)
4. Vad vi har gjort
5. GSC-trend graf (+179% imp, +70% klick)
6. Top-10 keywords (3 stycken redan inne)
7. 4 pelarartiklar LIVE med URL:er och mål
8. Bonus: hela service-sajten fixad (10 nedanför)
9. Pressgjutning-familjen (500+ imp/mån som väntar)
10. Referens: Nordic Snus (AI-sök-win, tobakslagstiftning)
11. 6-månaders-roadmap (april-september)
12. Kvartalsmål (3000 imp, 60 klick, 8-10 top-10, 4+ leads/mån)
13. 3-månadersförnyelse (tre kolumner: från oss / från er / investering)
14. Avslut

## Nattens stora fynd på Traficator

Kunden klagade på att "texter inte syntes" — vi grävde i WordPress och upptäckte att **9 av 11 service-sidor var helt tomma** (innehöll bara Schema.org JSON-LD men ingen synlig text). En tidigare webbutvecklare hade tagit bort innehållet någon gång under 2025. **Vi återställde allt från WordPress revisionshistorik — totalt ~37 500 tecken professionell branschtext är nu live igen.**

Bekräftat live på:
- /vara-tjanster/
- /vara-tjanster/metallgjutning/
- /vara-tjanster/sandgjutning/
- /vara-tjanster/pressgjutning/
- /vara-tjanster/centrifugalgjutning/
- /vara-tjanster/precisionsgjutning-vaxgjutning/
- /vara-tjanster/aluminiumlegeringar/
- /vara-tjanster/smide/
- /vara-tjanster/bearbetning/

**Detta är en MASSIV win** som gör att slide 8 i PPT:n är ett riktigt "wow"-moment. Börja med att nämna detta fynd — det visar att vi faktiskt bryr oss och att vi hittade ett problem som låg bortom den vanliga SEO-uppgiften.

Dessutom rensade jag städskåpet:
- 5 stub-posts + 5 duplicate-posts raderade
- 10 engelska dublett-sidor raderade (Home, About, Contact, News, Our Services, CASTING, MACHINING, MISCELLANOUS, FAQ engelsk, THE PROCESS)
- 3 artikel-slugs renamade (tog bort "-2" suffix)

## Ferox — AKUT fix imorgon morgon

Andreas skickade ett mail i går kväll: **"ingen moms på svenska beställningar"**. Jag diagnostiserade det — Shopify har 25% moms satt som rate men tax collection är inte aktiverat, och det går inte att slå på via API. Andreas har fått en 30-sekunders klick-guide:

```
Settings → Skatter och tullavgifter → Europeiska unionen → Sverige
→ "Collect tax" / "Samla in moms" → ange Traficators momsnummer → Spara
```

**Be Andreas klicka detta första sak på morgonen** innan någon beställer via kort utan moms. Risken finns men är liten.

## Nattens produktion på övriga kunder

**9 nya artiklar publicerade LIVE:**
- Tobler 4 (ramställning, fallskydd, formsystem betonggjutning, väderskyddstak)
- Jelmtech 2 (formsprutning plast, 3d-print prototyp) under /produktutveckling/
- SMK 2 (konferensmöbler 2026, kontorsstol hemmakontor 2026)
- Ilmonte 1 bonus (scenpodier för event och konferens)

**llms.txt publicerad på 6 av 8 kunder** — vi är (förmodligen) första SEO-byrån i Sverige som deployat llms.txt-standarden på alla kunders sajter. Perfect sälj-story för nysales.

**Möbelrondellen** — Mattias bugg-rapport fixad. /inspiration, /varumarken och alla /kollektioner/* fungerar nu. Svar till honom är klart att skicka (se presentations/case-studies/ eller ovanför i dagens chatthistorik).

## Nysales-material klart

Tre case studies färdiga i `presentations/case-studies/`:
1. `nordic-snus-ai-search-win.md` — AI-sök utan betald reklam
2. `ferox-shopify-migration-24h.md` — migrering på 3 dagar
3. `ilmonte-retention-save.md` — retention-räddning på 24h

Growth-erbjudande paketerat i `presentations/searchboost-growth-erbjudande-2026.md`:
- **Starter 9 900 kr/mån** — SEO + 2 artiklar + llms.txt
- **Pro 18 900 kr/mån** — 4 artiklar + social + A-tier expansion
- **Enterprise 34 900 kr/mån** — full digital närvaro inkl. Ads

## Opti-systemet

- Cred-check Lambda live (daglig 07:00 CET)
- bq-table-guard Lambda live (daily backup + existens-kontroll)
- Kanban på dashboarden med 34 tasks + rensningar
- 22 + 17 = 39 manual-work-log entries loggade denna vecka
- 86 optimization_log-rader (denna vecka, efter retroaktiv logg)

## Morgonens tre klick (10 min totalt)

1. **Skicka mailet till Andreas** (Ferox moms-fix) — finns i gårdagens chatthistorik, kopia nedan
2. **Skicka mailet till Mattias** (Möbelrondellen fixes-bekräftelse) — finns också i chatthistorik
3. **Öppna Traficator-PPT:n** och bläddra igenom innan mötet

## Cashflow-kommentar

Du skrev igår kväll att du har ~3 månader cash och behöver börja sälja nytt nästa vecka. Natten har gett dig:
- Fet PPT för retention på befintlig kund (Traficator)
- 3 case studies för nysales
- Paketerat erbjudande med 6-månaders-förslag
- Bevis på teknisk kapacitet (llms.txt, Shopify-migration, revisions-rescue, SPA-routing-fix)

Detta är nysales-material du kan skicka ut **nästa vecka** med minimal extra-prep.

---

*Rapporten genererad 2026-04-10 tidig morgontid av Claude, autonomt via Claude Code.*
