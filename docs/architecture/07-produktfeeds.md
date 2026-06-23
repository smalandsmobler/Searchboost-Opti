# 07 — Produktfeeds & merchandising

> Källa: `lambda-functions/adaptive-merchandiser.js` (448 rader, `seo-adaptive-merchandiser`, dagligen 04:00 UTC). Verifierat 2026-05-30.

## adaptive-merchandiser (ACE — Adaptive Commerce Engine)

Daglig momentum-driven omsortering av startsidans produkter för WooCommerce-kunder.

Flöde per kund (rad 278):
1. Hämtar parallellt (rad 292): GSC-klick (`getGSCClicks`, rad 98), GA4-sessions (`getGA4Sessions`, rad 122), WooCommerce-revenue (`getWooCommerceRevenue`, rad 147) — senaste 7d vs föregående 7d.
2. `calcMomentumScore()` (rad 175): viktning **GSC 40% / GA4 35% / WC 25%** (WC saknar data för många kunder).
3. `getStrategy(score)` (rad 182) → strategi-etikett.
4. Hämtar produkter: `getWPProducts()` (popularity, rad 190) + `getCheapestProducts()` (rad 203).
5. `updateHomepageACE()` (rad 216) — uppdaterar startsidan med vald produktstrategi.
6. `sendDailyReport()` (rad 356) — daglig sammanfattning.

### ⚠️ Gap
- Skriver till `ace_decisions` (rad 85/98) — **tabellen finns INTE i BQ** (live-tabellen heter `ace_momentum_log`). `ensureAceTable()` (rad 67) borde skapa den men live visar bara `ace_momentum_log`. Verifiera vilken tabell som faktiskt används och rätta namnet.
- Krav (rad 17): kund måste ha WP-credentials + GA4 property-id i SSM.

## Google Shopping / Merchant Center — NULÄGE

Det finns **ingen dedikerad feed-optimizer-Lambda** för Google Shopping / Merchant Center i nuläget. ACE omsorterar startsidan men optimerar inte produktfeeden (GTIN, brand, titlar, beskrivningar) mot Merchant Center.

## GÖR vs BORDE GÖRA

| Område | GÖR | BORDE (önskemål från Mikael) |
|--------|-----|------------------------------|
| Startsidans produkter | ✅ Daglig momentum-sortering (ACE) | — |
| Produktfeed → Merchant Center | ❌ Saknas | Bygg feed-optimizer: GTIN/brand-luckor, titel/beskrivning, Abicart/WooCommerce → Merchant Center |
| ace-tabellnamn | Skriver ace_decisions (saknas) | Rätta till ace_momentum_log eller skapa rätt tabell |
| Feed-källor | — | Kartlägg Abicart + WooCommerce-export per e-handelskund |

Feed-optimizern är ett **nytt bygge** (separat pass) — del av full-service-roadmappen [15](15-roadmap-fullservice.md).
