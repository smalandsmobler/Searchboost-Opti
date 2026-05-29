# ilmonte — Tasks & Status

> Kund: ilmonte.se | GSC: Ej ägare | WP-creds: OK
> Senast uppdaterad: 2026-05-29

## Regressionsvarningar

_Ingen GSC-data: Inte ägare i GSC. Regressionscheck ej möjlig._

Be ilmonte-ägaren lägga till service account `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com` som "Fullständig" i GSC.

Inga regressioner 2026-05-20 (ej ägare i GSC)
Inga regressioner 2026-05-21 (ej ägare i GSC)
Inga regressioner 2026-05-22 (ej ägare i GSC)
Inga regressioner 2026-05-26 (ej ägare i GSC)
Inga regressioner 2026-05-27 (ej ägare i GSC)
Inga regressioner 2026-05-28 (ej ägare i GSC)
Senaste check: 2026-05-28
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

## Internlänkanalys — 2026-05-29

> Analysmetod: WordPress REST API (22 inlägg analyserade, content.rendered parsing).
> perispa_* ej tillgängligt — skript byggt för WP REST API via EC2/SSM.
> Script: `scripts/internlankar-ilmonte.js`

### Struktur — Inkommande länkar per inlägg

| Inlägg | Inkommande | Status |
|--------|------------|--------|
| scenpodier-guide-event-konferens | 10 | Hubb ✓ |
| eventinredning-2026-minnesvard-upplevelse | 6 | Stark ✓ |
| scentextil-bakgrundsdukar-guide | 5 | Stark ✓ |
| konferensmobler-checklista-inredaren-2026 | 4 | OK ✓ |
| scen-foretagsevent-guide | 3 | OK ✓ |
| eventpodium-kopa-eller-hyra | 3 | OK ✓ |
| eventmobler-foretagsmassor-guide | 3 | OK ✓ |
| scenbygge-utomhus-guide | 3 | OK ✓ |
| scenpodier-skolor-guide-2 | 0 | **ÖN** ← fix |
| scenpodier-skolor-guide | 0 | **ÖN** ← fix |
| scenbelysning-event-guide-2 | 0 | **ÖN** ← fix |
| hyra-scen-pris-guide | 0 | **ÖN** ← fix (A-keyword) |
| podium-scen-foretagsevent-guide | 0 | **ÖN** ← fix |
| laktare-gradanger-event-guide | 0 | **ÖN** ← fix |
| horsalsstolar-teaterinredning-guide | 0 | **ÖN** ← fix |
| ridaskenor-scenridaer-guide | 0 | **ÖN** ← fix |
| dansmatta-for-event-guide | 1 | Svag |
| uthyrning-eventmobler-guide | 1 | Svag |
| dansmatta-guide-2026 | 1 | Svag |
| modular-scen-guide | 1 | Svag |

### OBS: Brutna utgående länkar i post 20566

scenpodier-guide-event-konferens har 4 brutna href som pekar på gamla slugs:
- `/eventmobler-for-event-och-konferens` → `/eventmobler-foretagsmassor-guide-hyra-2026/`
- `/konferensmobler-for-moten-och-utbildning` → `/konferensmobler-checklista-inredaren-2026/`
- `/ljudklasser-for-kontor-och-konferenslokaler` → `/ludklasser-event-konferens-textil-akustik/`
- `/eventinredning-for-mass-och-konferens` → `/eventinredning-2026-minnesvard-upplevelse/`
Åtgärda via WP-admin eller ett dedikerat fix-skript.

### Länkplan — 9 jobb (kör scripts/internlankar-ilmonte.js från EC2)

| # | Från | Till | Ankartext | Status |
|---|------|------|-----------|--------|
| 1 | scenpodier-guide (20566) | hyra-scen-pris-guide (20596) | uthyrning | ⏳ Väntar EC2 |
| 2 | scenpodier-guide (20566) | scenbelysning-event-guide-2 (20580) | ljussättningen | ⏳ Väntar EC2 |
| 3 | scenbygge-utomhus (20595) | modular-scen-guide (20578) | scensystem | ⏳ Väntar EC2 |
| 4 | scenbygge-utomhus (20595) | podium-scen-foretagsevent (20597) | talarpodier | ⏳ Väntar EC2 |
| 5 | scenbygge-utomhus (20595) | scenbelysning-event-guide-2 (20580) | scenbelysning | ⏳ Väntar EC2 |
| 6 | scen-foretagsevent (20582) | podium-scen-foretagsevent (20597) | talarpodium | ⏳ Väntar EC2 |
| 7 | scen-foretagsevent (20582) | scenbelysning-event-guide-2 (20580) | Scenbelysning | ⏳ Väntar EC2 |
| 8 | eventmoblering-kontor (20608) | uthyrning-eventmobler (20571) | hyrs in | ⏳ Väntar EC2 |
| 9 | eventmoblering-kontor (20608) | konferensstolar (20609) | konferensstolar | ⏳ Väntar EC2 |

**Körkommando på EC2:**
```bash
node scripts/internlankar-ilmonte.js
```

**Förväntade förbättringar efter körning:**
- hyra-scen-pris-guide (A-keyword): 0 → 1 inkommande
- scenbelysning-event-guide-2: 0 → upp till 3 inkommande
- podium-scen-foretagsevent-guide: 0 → upp till 2 inkommande
- modular-scen-guide (svag): 1 → 2 inkommande
- uthyrning-eventmobler-guide (svag): 1 → 2 inkommande

## Keywords
- 30 st inlagda (9A + 14B + 7C)

## Status
- WP-creds: OK
- GSC: EJ ägare → be ilmonte lägga till SA
- Aktiv (ingen GSC-data)
