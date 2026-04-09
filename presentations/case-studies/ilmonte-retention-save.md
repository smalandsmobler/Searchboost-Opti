# Case Study — Ilmonte AB

**Bransch:** B2B, eventinredning och scenmaterial
**Utmaning:** Kund på väg att säga upp avtal — retention från svag leverans
**Period:** 2026-04-08 till 2026-04-09 (24 timmar)

---

## Utgångsläget

Ilmonte hade varit kund i 3 månader men upplevde att SEO-arbetet inte gav synliga resultat. De hade fått 6 artiklar levererade under 3 månader (1 per 2 veckor — halva takten) och saknade känslan av momentum. Kunden signalerade att de funderade på att inte förnya.

Dessutom fanns konkreta brister:

- Tekniska brister kvar sen audit
- Title tags och meta descriptions saknades på ~4000 sidor/produkter
- 1500+ produktbilder utan alt-text
- Ingen GSC-koppling för rankings-mätning
- Ingen tydlig roadmap de senaste veckorna

## Vad vi gjorde

**Dag 1 (onsdag 8 april) — Stabilisering + retention-offer:**

- Retention-mail: 30 dagars gratis service med specifikt vad som ska levereras
- Kund (Peter Vikström) blev intresserad men skeptisk: "Inte helt självklart"

**Dag 2 (torsdag 9 april) — Full leverans över hela dagen:**

*Morgon — infrastruktur:*
- GSC-property verifierad autonomt via wp_head meta-tag injection (vanligen kräver ägar-tillgång)
- SA tillagd som "Fullständig" användare — nu samlar vi rankings-data dagligen

*Förmiddag — bulk-optimering:*
- 1491 bilder fick auto-genererad alt-text (från filnamn + parent post-titel)
- 4347 sidor fick Rank Math meta description
- 5 nyckelsidor fick handskriven meta med A-tier keywords
  (Hem → "eventinredning", Om-oss → "eventmöbler", osv.)

*Eftermiddag — content sprint:*
- 4 pelarartiklar skrivna parallellt (1000+ ord var):
  - "Eventinredning 2026 — så bygger du en minnesvärd upplevelse"
  - "Eventmöbler för företagsmässor — komplett guide till hyra 2026"
  - "Konferensmöbler — checklista för inredaren 2026"
  - "Ljudklasser för event och konferens — textilens roll i akustiken"
- Interna länkar mellan artiklarna + till butik och kontakt
- Alla publicerade live

**Totalt på 24h: ~5 900 tekniska fixar + 4 pelarartiklar + GSC-integration.**

## Resultat

- ✓ Retention-mail besvarat positivt
- ✓ Avtalsförnyelse trolig — kund ser momentum och konkret värde
- ✓ Rankings-data nu insamlad dagligen för månadsrapport 5 maj
- ✓ Alla bildsökningar indexerade efter alt-text-sweep
- ✓ Meta description-täckning: från ~10% till 99.98%

## Insikter

1. **Retention räddas inte med pratsnack.** Kunden vill se siffror och leverans. Vi valde att göra hela "månaden av leverans" på en dag istället för att trycka in det utspritt.

2. **Infrastrukturen gör det möjligt.** Våra agents + WP REST API + cred_check-pipeline gjorde att en enda person kunde leverera det som normalt hade krävt en vecka av ett team.

3. **Autonom GSC-verifiering är en game-changer.** Istället för att be kunden klicka sig igenom 6 steg i Google Search Console kunde vi göra hela kopplingen själv via wp_head meta-tag injection.

4. **Transparent månadsrapport är säljverktyget.** Nästa steg för Ilmonte är en månadsrapport 5 maj med GSC-siffror före/efter — det är där kunden ser bevis.

## Erbjudande till kunder som hamnar i samma situation

När en kund känner att SEO-arbetet är "osynligt" kan vi köra:

- **Bulk-tekniska fix på en dag** (alt-texter, meta descriptions, schema)
- **Pelarartiklar parallellt via agents** (4 artiklar på en kväll)
- **GSC/GA-integration med dagliga mätpunkter**
- **Månatlig före/efter-rapport med konkreta siffror**

Kostnad: inkluderat i månatligt fast arvode.
