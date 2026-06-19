# smalandskontorsmobler — Tasks & Status

> Kund: smalandskontorsmobler.se (ny: ny.smalandskontorsmobler.se) | GSC: OK | WP-creds: SAKNAS
> Senast uppdaterad: 2026-05-07

## Regressionsvarningar

_Ingen data — Blockerad (2026-06-15, **22 körningar i rad** — 14/16/18/19/20/21/22/23/26/27/28/30 maj + 2/3/5/6/7/8/9/10/13/15 jun):_
- _EC2-API: Ej nåbar från remote environment (self-signed TLS / Envoy-proxy, `-k` fungerar ej — bekräftad 2026-06-10)_
- _Supermetrics GSC (ds\_id: GW): **FINNS** men NOT\_AUTHENTICATED — kräver engångsinloggning av Mikael_
- _AWS CLI saknas → kan ej hämta BigQuery-credentials från SSM_

**⚠️ KRITISK BLOCKERARE:** Se kund_searchboost_tasks.md — Supermetrics GSC-autentisering = snabbaste fix (2 min).

Inga regressioner 2026-06-16 (Blockerad — se searchboost_tasks.md)
Inga regressioner 2026-06-17 (Blockerad — EC2 503 + perispa_* saknas)
Inga regressioner 2026-06-18 (Blockerad — körning #25, EC2 503 + perispa saknas + BQ-creds saknas)
Inga regressioner 2026-06-19 (Blockerad — körning #26, EC2 503 + perispa_* saknas + BQ-creds saknas)
Senaste check: 2026-06-19

## Pågående arbete
- 896 produkter importerade till ny WooCommerce-sajt
- ~3 700 produkter saknar bilder (pågår)
- 46/47 kategoritexter klara
- 4 blogginlägg publicerade

## Väntande
- Rank Math PRO: aktivera licens när den kommer till mikael@searchboost.se
- Swedbank Pay: kunden fixar själv
- Schema-markup: kör när Rank Math PRO är aktivt
- WP app-password: SAKNAS — kunden måste generera ett

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-27

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| **Mikael: Generera WP app-password** (blockerar ALL automation och deploy-scripts) | **BRÅDSKANDE** | Utan detta: noll automatisk optimering, inga scripts kör |
| Bildoptimering: prioritera top-200 mest sålda produkter inför WooCommerce-launch | **HÖG** | AJ Produkter har Product schema med bilder — Google Shopping kräver detta |
| Skriv lokal landningssida: `/kontorsmobler-jonkoping/` (~500 ord) | **HÖG** | AJ = nationell, Morekontor = ej Småland — ingen konkurrent äger sökorden |
| Skriv: "Ergonomisk arbetsplats hemma 2026 — 7 tips från Smålands Kontorsmöbler" | **HÖG** | AJ Produkter skiftat till industriell ergonomi, Morekontor = storkontors-fokus — hemmakontor-nischen fri |
| FAQ-schema på kategorisidor (när Rank Math PRO aktivt) | Medel | Morekontor har FAQ schema — SMK bör matcha |
| Skriv: "Höj-sänkbart skrivbord — vad kostar det? Guide 2026" | Medel | Ingen konkurrent har djup prisguide |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-13

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| Skriv: "Ergonomisk arbetsplats hemma 2026 — 7 tips från Smålands Kontorsmöbler" | **HÖG** | AJ Produkter skiftat till industriell ergonomi (verkstad/tillverkning) — hemmakontor-nischen fri |
| Skapa lokala landningssidor: /kontorsmobler-jonkoping/ + /kontorsmobler-vaxjo/ | **HÖG** | Varken AJ (nationell) eller Morekontor (Halmstad/storstad) äger Småland-sökorden |
| Bildoptimering: ~3 700 produkter saknar bilder — prioritera inför WooCommerce-launch | **HÖG** | Blockerar Google Shopping-synlighet vid launch |
| Lägg till FAQ-schema på kategorier (när Rank Math PRO aktivt) | Medel | Morekontor har FAQ-sektion men inget schema markup |
| "Höj-sänkbart skrivbord — vad kostar det? Guide 2026" | Medel | Ingen konkurrent har djup prisguide |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-06 (arkiverade)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| Skriv artikel: "Ergonomi på hemmakontoret 2026 — 7 tips" | **HÖG** | Uppdaterad ovan med mer specifik vinkel |
| Skapa lokala landningssidor: "Kontorsmöbler Jönköping", "Kontorsmöbler Växjö" | **HÖG** | Kvar — ny bekräftelse att ingen konkurrent äger lokala sökord |
| Lägg till FAQ-schema på kategorier | Medel | Kvar — väntar på Rank Math PRO |

## Status
- WP-creds: SAKNAS (automatisk optimering avstängd)
- GSC: OK (https://www.smalandskontorsmobler.se/)
- Deal: 6 mån × 7 000 kr/mån = 42 000 kr (WooCommerce-migrering)
- Kontakt: mikael@smalandskontorsmobler.se
