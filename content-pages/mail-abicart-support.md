# Mail till Abicart Support

**Till:** support@abicart.se
**Från:** mikael@searchboost.nu
**Ämne:** Webshop 66230 — Produktnamn och priser visas inte på kategorisidor

---

Hej,

Vi hanterar SEO och webbutveckling åt Smålands Kontorsmöbler (webshop-ID: 66230, www.smalandskontorsmobler.se) och har upptäckt ett akut problem.

**Problem:**
Produktnamn och priser visas inte på kategorisidorna (t.ex. /kontorsstolar). Bilderna renderas korrekt, men under varje produktkort är det helt tomt — inga namn, inga priser, ingen köpknapp.

Enskilda produktsidor (t.ex. /dijon-prisvard-kontorsstol) fungerar normalt med pris och produktnamn.

**Vad vi kan se tekniskt:**
- Webbläsarkonsolen visar: **"Error fetching data"** från `tws-article-list` (v5.3.18) i themes.abicart.com/js/
- `window.twsReduxStartState.articles` är ett tomt objekt — ingen produktdata levereras till React-komponenterna
- `window.__PRELOADED_STATE_TWS_ARTICLE_LIST__` existerar inte
- `.caption`-diven i varje produktkort har `innerHTML: ""` — helt tomt
- Inga CSS-regler döljer elementen — problemet är att datan aldrig renderas
- Temat är Nordic v1.1

**Vad vi har testat:**
- Rensat eget innehåll i HEAD (hade ett redirect-script, nu borttaget) — ingen förändring
- Kontrollerat Auth Tokens under Externa kopplingar — båda aktiva (Admin + Nyheter)
- Kontrollerat temainställningar under Produktgruppsida — inget avvikande
- API:et var tillfälligt avstängt av butiksägaren men har satts igång igen — ingen förändring

**Påverkan:**
Kunden kan inte sälja något — besökare ser produktbilder men inga namn eller priser. Detta är akut.

Kan ni undersöka varför tws-article-list inte får produktdata på kategorisidorna för webshop 66230?

Tack på förhand,
Mikael Larsson
Searchboost.se
mikael@searchboost.nu
