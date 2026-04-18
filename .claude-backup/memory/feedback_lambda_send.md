---
name: Lambda send — kräver explicit godkännande
description: Aldrig invoká Lambda-funktioner som skickar mail eller kommunicerar utåt utan att Mikael explicit säger "kör nu" eller "skicka"
type: feedback
originSessionId: 82e7c927-86e2-4e1d-a6b9-73065ea3f1e9
---
ALDRIG invoká dessa Lambda-funktioner utan explicit godkännande från Mikael:
- `seo-weekly-report` — skickar kundmail + intern rapport
- `seo-autonomous-optimizer` — skriver till kunders WordPress-sidor
- Alla Lambdas som kommunicerar utåt (mail, Slack, SMS)

**Why:** 2026-04-15 invokades `seo-weekly-report` med `force: true` två gånger under felsökning. Alla 7 kunder fick dubbelmail på en onsdag. Veckorapporter går ut FREDAG kl 15:00 — aldrig annars.

**How to apply:**
- Felsökning = läs loggarna, ändra koden, testa lokalt — men invoká ALDRIG live utan godkännande
- Om Mikael frågar "varför fungerar inte X?" → analysera koden, svara med diagnosen — tryck INTE på send
- Godkännande måste vara explicit: "kör rapporten nu", "skicka ut", "invoká" — inte implicit via "fixa det"
- Vid tveksamhet: fråga "Vill du att jag kör detta live eller bara fixar koden?"
