# Cold email-mall — Searchboost B2B SEO + AI-sök

**Version:** 1 (2026-04-09)
**Mål:** Bokad 20-min-demo, inte direktsälj
**Målgrupp:** Svenska B2B-företag med WooCommerce/Shopify + synlig tillverknings/industri/tjänste-nisch

---

## Variant A — "Vi hittade något på er sajt"

**Ämne:** Hittade ett problem på {domän} — tar 5 min att fixa

```
Hej {förnamn},

Jag körde en snabb genomgång av {domän} i morse och hittade tre saker
som kostar er trafik just nu:

1. {konkret fynd #1 från Lighthouse eller HTML-scan}
2. {konkret fynd #2}
3. {konkret fynd #3}

Det är inget ni nödvändigtvis ser från er sida, men Google ser det.

Jag är Mikael från Searchboost. Vi bygger en semi-autonom SEO-plattform
som just nu sköter sju svenska B2B-siter. Det vi gör är att identifiera
problem som det jag hittade ovan, och fixa dem dagligen utan att ni
behöver vara inblandade.

Har du 20 minuter nästa vecka? Jag visar er de tre problemen på er
sajt, hur vi skulle fixa dem, och vad det kostar. Ingen försäljning,
bara information.

{signature}

P.S. Vi har också precis publicerat llms.txt-standarden på alla våra
kunders sajter — det gör att ChatGPT, Perplexity, Claude och Gemini
hittar er på rätt sätt. Vi är förmodligen första svenska byrån som
kör det systematiskt. Kan visa hur det fungerar i samma möte.
```

**Obligatorisk data att samla innan sändning:**
- Kör Playwright + Lighthouse mot prospectens sajt
- Hitta 3 konkreta problem (saknade meta descriptions, stora bilder, långsamma script)
- Skriv in dem i punkt 1-3 ovan

---

## Variant B — "Referens från liknande bransch"

**Ämne:** Som {liknande kund}, vad ni rankar på pressgjutning-söket

```
Hej {förnamn},

Jag hjälper {liknande-kund-typ} som ni att bli synligare på Google.
{Exempel på kund, t.ex. "Traficator International"} gick från 525 till
1 463 impressioner på en månad efter att vi börjat — en ökning på 179%.

Jag tittade på {domän} och ser att ni har liknande potential inom
{relevant nisch}. Ni rankar redan på sidan 3-5 för {3-4 viktiga sökord}
vilket betyder att jobbet är att flytta er uppåt, inte starta från noll.

Har du 20 minuter nästa vecka? Jag kan visa exakt vilka sökord vi
skulle prioritera och vad det skulle ge på tre månader.

{signature}
```

---

## Variant C — "Det tråkiga läget"

**Ämne:** {domän} på mobil — några bekanta problem?

```
Hej {förnamn},

Jag körde {domän} genom vår mobile-QA-pipeline i natt och fick fyra
flaggor som kunder oftast upplever som att "sajten är buggig":

- {fynd 1, t.ex. "touch-targets under 40px på 22% av klickbara element"}
- {fynd 2, t.ex. "startsidans totala scroll-höjd är 8000+ px på iPhone"}
- {fynd 3, t.ex. "tre JS-filer blockerar första rendering"}
- {fynd 4, t.ex. "/butik/ returnerar 404 via er nuvarande navigation"}

Det här är saker som INTE syns i Google Analytics men som påverkar
konverteringen på mobil. Vi har precis fixat exakt samma problem på
två andra svenska B2B-butiker.

20 minuter nästa vecka, jag visar vad vi skulle göra. Ingen försäljning.

{signature}
```

---

## Uppföljningssekvens (om inget svar)

**+3 dagar:** Bumpa samma tråd, lägg till en ny observation

```
{förnamn},

Bumpar. Jag kollade sajten igen och såg att {ny-observation}. Om det
inte är rätt tid just nu, inga problem — jag hör av mig om en månad.

{signature}
```

**+7 dagar:** Close-tråden med värdeerbjudande

```
{förnamn},

Sista bumpen. Jag skickar en kort PDF-analys av er sajt även om vi inte
hinner prata — 5 sidor, konkret, du kan använda den hur du vill.

Vill du ha den? Svara bara "ja" så skickar jag den.

{signature}
```

---

## Signature

```
Mikael Larsson
Searchboost Sverige
mikael@searchboost.se
0760 194 905
searchboost.se
```

---

## Spåra

Varje outreach loggas i BQ customer_pipeline som stage="prospect" med
notes-fält som innehåller vilket mail som skickades. Behåll spårning
av öppningar + svar för att kunna optimera malleterna över tid.
