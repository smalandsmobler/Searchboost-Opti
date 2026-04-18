---
name: Artikelproduktion standard
description: Grundregel — artikelproduktion är en standard-leverabel på ALLA aktiva kunder. Minst 2-3 artiklar/vecka per kund, optimerade mot A-tier-keywords.
type: feedback
---

## Regel

**Artikelproduktion är en standard-leverabel på alla aktiva kunder.**

**Why:** Insikt efter Ilmonte-retention 2026-04-08: kundens #1 anledning att säga upp sig var bristen på synligt arbete. Innehåll är det som faktiskt flyttar rankings och är det enda kunden kan "se". Optimizer-fixar är osynliga utan content som drar trafik. SMK har 13 artiklar och bra trend, Ilmonte har 6 artiklar och riskerar förlora kunden — mönstret är tydligt.

**How to apply:**

1. **Minst 2–3 artiklar per vecka per aktiv kund**, publicerade direkt på kundens WordPress
2. **Alla artiklar ska**:
   - Vara optimerade för ett specifikt **A-tier-keyword** från kundens keyword-lista
   - Ha komplett Rank Math-setup: focus keyword, title, meta description, schema
   - Innehålla interna länkar till produkt/tjänste-sidor
   - Ha optimerade bilder med alt-text
   - Vara minst 800 ord, helst 1200+
3. **Produktionsflöde**:
   - Måndag: välj 3 keywords från A-tier för kunden (hög volym, låg konkurrens först)
   - Tis–tors: skriv + publicera artiklarna (1 om dagen)
   - Fredag: verifiera att de indexerats + internlänkat från andra sidor
4. **Spåra i work-log**: varje artikel loggas i Opti-dashboarden via `/api/customers/:id/manual-work-log` så det syns i veckorapporten
5. **Månadsrapport** måste innehålla: lista på publicerade artiklar + deras första GSC-data

## Aktiva kunder — artikel-status per 2026-04-08

| Kund | Nuv. antal artiklar | Status | Nästa batch |
|---|---|---|---|
| Searchboost (eget) | ? | ? | Kolla |
| Smålands Kontorsmöbler | ~13 (mars) | ✓ Bra takt | Fortsätt |
| Möbelrondellen | ? | Kolla | Starta om inte igång |
| Ilmonte | **6 (6 veckor utan)** | 🔴 AKUT RETENTION | 5 st senast fre 11 apr |
| Jelmtech | Har artiklar (tidigare producerade) | 🟡 Nya behövs | Fortsätt takt — B2B produktutveckling, plast/industridesign/prototyper |
| Tobler | ? | Kolla | Starta om inte igång |
| Traficator | 0 (innan 2026-04-09) | `mikael`-konto full admin (cred_check 2026-04-09) | Publicera 4 pelarartiklar inför omsignering 2026-04-10 10:30 |
| Nordic Snus Online | 0 (ny) | 🟡 Premium-kund | AI-sök som enda kanal (ej Google Ads) |
| Human Power | ? (nyligen) | Kolla | Bygg runt Reboot + Utvecklande samtal |
| Ferox | 0 (flyttat deadline) | 🟡 Efter lansering | Tidrapportering-keywords |

**Avslutade kunder — INGEN produktion:**
- Kompetensutveckla (avslutad 2026-03-13)
- Wedosigns (avslutad 2026-04-03)
- Phvast (avslutad 2026-04-07)

**First priority på morgonen 2026-04-09:**
1. Kör artikel-revision per kund — hur många har publicerats senaste 30 dagarna?
2. Identifiera kunder under 2/vecka → lägg upp kö direkt
3. Börja med Ilmonte (akut retention) + Jelmtech (0 artiklar sen onboarding 7 mars)
4. Ferox-lanseringen är flyttad så vi har mer tid till contentprio

## Jelmtech — inte ny kund, onboardad 2026-03-07
Se `kunder.md` för full info. Kort:
- **WP-login**: mikael_searchboost (kolla SSM för aktuell)
- **CMS**: WordPress + Divi-tema
- **Kontakt**: Camilla Lundström, camilla.lundstrom@jelmtech.se
- **Deal**: 3 mån × 8 000 kr = 24 000 kr
- **Bransch**: B2B produktutveckling — plastkonstruktioner, industridesign, prototyper
- **30 ABC-keywords** redan inlagda (från 2026-02-17 audit, score 62/100)
- **Status**: 0 artiklar producerade sen onboarding. Måste in i flödet direkt.
- **Kritiska tekniska fixar kvar**: language en-US→sv-SE, ingen SEO-plugin installerad, tunna meta-desc

## SOP: Artikelproduktion per artikel

1. Välj keyword från A-tier (högst volym, lägst position)
2. Kolla GSC current position (om tillgängligt)
3. Research: top-5 sökresultat på Google, notera vad som saknas
4. Outline: H1, 4-6 H2:or, intern länk-mål (3-5 produktsidor)
5. Skriv (800–1500 ord), semantiskt rich
6. Bilder: hämta eller generera, sätt alt-text med keyword-variation
7. Publish via WP REST: `/wp/v2/posts` med `meta` för Rank Math focus_keyword
8. Intern länk: lägg in på 2–3 andra sidor som pekar till den nya
9. Logga i Opti: `POST /api/customers/:id/manual-work-log` med typ "content"
10. Submit till GSC via URL inspection (om tillgängligt)

## Automation-förslag (bygg ut 2026-04-15)
- Ny Lambda `weekly-content-producer` som kör söndag 18:00
- Läser kundens action-plan + A-keywords
- Använder Claude Sonnet för att skriva 3 artiklar/vecka/kund
- Publicerar som draft, inte live (säkerhet)
- Skickar summary-mail till mikael@searchboost.se
- Mikael approvar/publicerar via dashboard
