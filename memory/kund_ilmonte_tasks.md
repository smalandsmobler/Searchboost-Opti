# ilmonte — Tasks & Status

> Kund: ilmonte.se | GSC: Ej ägare | WP-creds: OK
> Senast uppdaterad: 2026-05-20

## Regressionsvarningar

_Ingen GSC-data: Inte ägare i GSC. Regressionscheck ej möjlig._

Be ilmonte-ägaren lägga till service account `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com` som "Fullständig" i GSC.

Inga regressioner 2026-05-20 (ej ägare i GSC)
Inga regressioner 2026-05-21 (ej ägare i GSC)
Inga regressioner 2026-05-22 (ej ägare i GSC)
Inga regressioner 2026-05-26 (ej ägare i GSC)
Inga regressioner 2026-05-27 (ej ägare i GSC)
Senaste check: 2026-05-26

## Publicerade artiklar

| Datum | Titel | URL |
|-------|-------|-----|
| 2026-04-25 | Scenpodium-guide höjd/storlek | https://ilmonte.se/scenpodium-guide-hojd-storlek-ratt-val/ |
| 2026-05-06 | Hyra eller köpa scenpodium? — 5 faktorer | *Redo att deployas — kör `node scripts/publish-ilmonte-hyra-kopa-scenpodium.js` från EC2* |
| 2026-05-27 | Köpa scenpodium 2026 — storlekar, material och priser | *Redo att deployas — kör `node scripts/publish-ilmonte-kopa-scenpodium-2026.js` från EC2* |

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

## Prioriterade uppgifter — uppdaterad 2026-05-27

| Uppgift | Prioritet | Källa |
|---------|-----------|-------|
| **DEPLOY**: Båda väntande artiklarna — kör scripts ovan från EC2 | **BRÅDSKANDE** | 21 dagar sedan artikel 1 skrevs |
| Product schema på de 5 mest sålda produktsidorna | **HÖG** | Ingen konkurrent (Scenkonsult, Evivent, Eventkraft) har Product schema |
| FAQ-schema på /produkt-kategori/podier/ | Medel | Ingen konkurrent har FAQ schema |
| Geografisk guide: "Scenpodium för utomhusevenemang — vad ska du tänka på?" | Medel | Scenkonsult = Stockholm only, Evivent = Staffanstorp only |

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
