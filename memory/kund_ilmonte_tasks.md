# ilmonte — Tasks & Status

> Kund: ilmonte.se | GSC: Ej ägare | WP-creds: OK
> Senast uppdaterad: 2026-06-10

## Regressionsvarningar

_Ingen GSC-data: Inte ägare i GSC. Regressionscheck ej möjlig._

Be ilmonte-ägaren lägga till service account `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com` som "Fullständig" i GSC.

Inga regressioner 2026-06-16 (GSC ej ägare)
Inga regressioner 2026-06-17 (GSC ej ägare)
Inga regressioner 2026-06-18 (GSC ej ägare)
Inga regressioner 2026-06-19 (GSC ej ägare)
Inga regressioner 2026-06-20 (GSC ej ägare)
Inga regressioner 2026-06-21 (GSC ej ägare)
Inga regressioner 2026-06-22 (GSC ej ägare)
Senaste check: 2026-06-22

Inga regressioner 2026-05-20 (ej ägare i GSC)
Inga regressioner 2026-05-21 (ej ägare i GSC)
Inga regressioner 2026-05-22 (ej ägare i GSC)
Inga regressioner 2026-05-26 (ej ägare i GSC)
Inga regressioner 2026-05-27 (ej ägare i GSC)
Inga regressioner 2026-05-28 (ej ägare i GSC)
Inga regressioner 2026-05-30 (ej ägare i GSC)
Inga regressioner 2026-06-02 (ej ägare i GSC)
Inga regressioner 2026-06-03 (ej ägare i GSC)
Inga regressioner 2026-06-05 (ej ägare i GSC)
Inga regressioner 2026-06-06 (ej ägare i GSC)
Inga regressioner 2026-06-07 (ej ägare i GSC)
Inga regressioner 2026-06-08 (ej ägare i GSC)
Inga regressioner 2026-06-06 (ej ägare i GSC)
Inga regressioner 2026-06-05 (ej ägare i GSC)
Inga regressioner 2026-06-07 (ej ägare i GSC)
Inga regressioner 2026-06-09 (ej ägare i GSC)
Inga regressioner 2026-06-10 (ej ägare i GSC)
Inga regressioner 2026-06-13 (ej ägare i GSC)
Inga regressioner 2026-06-15 (ej ägare i GSC)
Senaste check: 2026-06-13

## Publicerade artiklar

| Datum | Titel | URL |
|-------|-------|-----|
| 2026-04-25 | Scenpodium-guide höjd/storlek | https://ilmonte.se/scenpodium-guide-hojd-storlek-ratt-val/ |
| 2026-05-06 | Hyra eller köpa scenpodium? — 5 faktorer | *Redo att deployas — kör `node scripts/publish-ilmonte-hyra-kopa-scenpodium.js` från EC2* |
| 2026-05-27 | Köpa scenpodium 2026 — storlekar, material och priser | *Redo att deployas — kör `node scripts/publish-ilmonte-kopa-scenpodium-2026.js` från EC2* |
| 2026-06-12 | Scenpodium för utomhusevenemang — checklista inför sommaren 2026 | *Redo att deployas — kör `node scripts/publish-ilmonte-utomhusevenemang.js` från EC2* |

## Deploy — väntande artiklar (2 st)

**Artikel 1 (sedan 2026-05-06):**
- Fil: `content-pages/ilmonte-hyra-eller-kopa-scenpodium.html`
- Script: `scripts/publish-ilmonte-hyra-kopa-scenpodium.js`
- Titel: "Hyra eller köpa scenpodium? — 5 faktorer som avgör ditt val"
- Slug: `hyra-eller-kopa-scenpodium-5-faktorer`
- Focus keyword: `hyra eller köpa scenpodium`

**Artikel 2 (2026-05-27):**
- Fil: `content-pages/ilmonte-kopa-scenpodium-2026.html`
- Script: `scripts/publish-ilmonte-kopa-scenpodium-2026.js`
- Titel: "Köpa scenpodium 2026 — komplett guide till storlekar, material och priser"
- Slug: `kopa-scenpodium-2026-storlekar-material-priser`
- Focus keyword: `köpa scenpodium`
- 988 ord, 5 H2:or + 3 H3:or (FAQ), 3 interna länkar, ÅÄÖ verifierade
- Kategori: Blogg (ID 1068)

**Kör båda på EC2 (har IAM-roll för SSM):**
```bash
node scripts/publish-ilmonte-hyra-kopa-scenpodium.js
node scripts/publish-ilmonte-kopa-scenpodium-2026.js
```

## Prioriterade uppgifter — Konkurrentbevakning 2026-06-10

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| **DEPLOY**: "Hyra eller köpa scenpodium?" (klar 2026-05-06 — **37 dagar!**): `node scripts/publish-ilmonte-hyra-kopa-scenpodium.js` från EC2 | **BRÅDSKANDE** | Ingen konkurrent (Scenkonsult/Evivent/Eventkraft) har denna content — total möjlighet att äga sökorden okontestas |
| **DEPLOY**: "Köpa scenpodium 2026" (klar 2026-05-27 — **16 dagar**): `node scripts/publish-ilmonte-kopa-scenpodium-2026.js` från EC2 | **BRÅDSKANDE** | Eventkraft = "priser på förfrågan", inga guider — Ilmonte kan äga köp-keyword direkt |
| **DEPLOY**: "Scenpodium utomhusevenemang" (klar 2026-06-12): `node scripts/publish-ilmonte-utomhusevenemang.js` från EC2 | **BRÅDSKANDE** | Midsommar 2026-06-20 — maximal säsongsrelevans, ingen konkurrent har utomhus-checklista |
| Product schema på de 5 mest sålda scenpodium-produktsidorna | **HÖG** | Scenkonsult, Evivent, Eventkraft = NOLL Product schema — Google Shopping-synlighet fri |
| FAQ-schema på /podier/-kategorisida | **HÖG** | Ingen konkurrent har FAQ schema — rich results i Google utan motstånd |
| ~~Skriv: "Scenpodium för utomhusevenemang — checklista inför sommaren"~~ | ~~Medel~~ | ✅ KLAR 2026-06-12 — kör publish-script från EC2 |

## Prioriterade uppgifter — uppdaterad 2026-05-27 (arkiverade)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| ~~DEPLOY: Båda väntande artiklarna~~ | ~~BRÅDSKANDE~~ | Kvar — EC2-blockerare (nu 35 resp. 14 dagar) |
| Product schema på 5 produktsidor | **HÖG** | Kvar — bekräftad 10/06 |
| FAQ-schema på /podier/ | **HÖG** | Uppgraderad från Medel — inga konkurrenter har det |
| Geografisk guide | Medel | Kvar |

## Prioriterade uppgifter — Konkurrentbevakning 2026-05-06 (arkiverade)

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| ~~DEPLOY: Artikel "Hyra eller köpa scenpodium?"~~ | ~~BRÅDSKANDE~~ | Kvar — ej utförd |
| Skriv köpguide: "Köpa scenpodium 2026 — storlekar, material och priser" | **HÖG** | Kvar — bekräftad 20/05 |
| Lägg till Product schema på alla scenpodium-produktsidor | **HÖG** | Kvar |
| Lägg till FAQ-schema på scenpodium-kategorisida (höjder, material, storlekar) | Medel | Kvar |

## Keywords
- 30 st inlagda (9A + 14B + 7C)

## Status
- WP-creds: OK
- GSC: EJ ägare → be ilmonte lägga till SA
- Aktiv (ingen GSC-data)
