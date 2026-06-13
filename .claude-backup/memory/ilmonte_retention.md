---
name: Ilmonte retention
description: Status Ilmonte 2026-04-08 + retention-plan (handpåläggning + artiklar)
type: project
---

## Ilmonte — risk att förlora kunden

**Kontakt**: Peter Vikström (sales@ilmonte.se)
**Site**: https://ilmonte.se
**Bransch**: scenpodier, dansmattor, scentextil, eventinredning
**Beslut 2026-04-08**: Mikael tar personlig handpåläggning, ingen möte — bara leverans (artiklar + fixar).

## Status 2026-04-08 kväll

### Data i Opti-systemet
- 13 optimeringar loggade (alla schema-markups 14-15 mars) MEN alla med `saved: false` → genererade men aldrig sparade på WP
- 10 tasks i action-plan (1 error, rest pending), 0/15 budget använt
- 86 ABC-nyckelord: 26 A-tier, 38 B-tier, 22 C-tier
- **0 rankings** i Opti eftersom GSC-ägarskap saknas (Peter ägare, vår SA ej inlagd)

### Site health (snabb audit)
- Title OK, meta desc 136 tecken OK
- H1 = "AB Ilmonte" (för generellt — borde innehålla huvudsökord)
- Schema finns: WebPage, Organization, Article, Person, ImageObject, WebSite, SearchAction
- **28 bilder på startsidan utan alt-text**
- 150 interna länkar
- **5 107 bilder** totalt i media library
- **Endast 6 blogginlägg** totalt — det är rotorsaken till att de inte rankar

### Top A-tier keywords med sökvolym
- eventinredning (320/mån)
- eventmöbler (210/mån)
- + 24 andra A-tier

## Retention-plan

### Mail skickat 2026-04-08 kväll
Transparent erkännande av att vi inte levererat konkret i mars.
Lovar handpåläggning + 2-3 artiklar/vecka + tekniska fixar + månadsrapport första måndagen i maj.

### GRATIS-MÅNAD (30 dagar från 2026-04-08)
Mikael bjöd på en månad vid senaste samtalet. I retention-mailet omformulerat: erbjudandet står kvar men räknas från **ikväll 2026-04-08 och 30 dagar framåt** (till ~2026-05-08).

**Lovade leveranser under gratis-månaden (MÅSTE uppfyllas):**
1. **8–12 artiklar publicerade på ilmonte.se**
   - Alla optimerade för A-tier-keywords
   - Schema markup, interna länkar till produktsidor, meta descriptions, optimerade bilder
2. **Minst 5 tekniska fixar per vecka** (20+ totalt)
   - H1 startsida rätt sökord
   - 28 bilder alt-texter
   - Tomma meta descriptions
   - Schema där saknas
3. **Månadsrapport första måndagen i maj (2026-05-05)**
   - Ranking-rörelser per nyckelord (kräver GSC-access)
   - Publicerade artiklars prestanda
   - Tekniska fixar-lista
   - Plan för nästa 30 dagar
4. **Realistisk målbild kommunicerad**: synligt utslag på long-tail och lågkonkurrens-keywords. Huvud-keywords rör sig långsammare men grunden läggs.

### Artikelplan — publicera senast fredag 11 april
1. "Eventinredning 2026 — så bygger du en minnesvärd upplevelse" (eventinredning, 320/mån)
2. "Eventmöbler för företagsmässor — guide till rätt uthyrning" (eventmöbler, 210/mån)
3. "Scenpodier — så väljer du rätt för ert event" (scenpodier)
4. "Konferensmöbler: checklista för inredaren" (konferensmöbler)
5. "Ljudabsorbenter och textil — vad säger ljudklasserna" (ljudklasser, matchar existerande sida)

### Takt: 2-3 artiklar/vecka framåt på A-tier-keywords

### Tekniska fixar att köra denna vecka
1. Alt-texter på 28 bilder på startsidan (+ fler i löp-auditen)
2. H1 startsidan → inkludera huvudsökord
3. Title + meta desc på tomma sidor
4. Schema där saknas

### Vad behövs från Peter
**GSC-ägarskap**: Lägg till vår SA `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com` som "Fullständig" i Search Console → ilmonte.se → Användare och behörigheter.

### Kvar att undersöka
- **Varför sparas optimeringar inte?** `saved:false` på alla 13 → buggen i autonomous-optimizer.js som inte persisterar schema-förändringar via Rank Math REST. Debugga efter Ferox-lansering.

## Inloggning
- WP URL: https://ilmonte.se
- Username: "Mikael Larsson" / Searchboost (se SSM)
- App password: i SSM `/seo-mcp/wordpress/ilmonte/app-password`
- Role: administrator (id 1097)
- GA4 property: 331290031
- GSC property: https://ilmonte.se/ (ägarskap saknas)
- Beebyte API key: sparad i SSM `/seo-mcp/integrations/ilmonte/beebyte-api-key`
