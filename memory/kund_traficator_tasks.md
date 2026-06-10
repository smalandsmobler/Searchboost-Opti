# traficator — Tasks & Status

> Kund: traficator.se | GSC: Ej konfigurerad | WP-creds: OK
> Senast uppdaterad: 2026-06-10

## Regressionsvarningar

_Ingen GSC-data: GSC ej konfigurerad. Regressionscheck ej möjlig._

Inga regressioner 2026-05-20 (GSC ej konfigurerad)
Inga regressioner 2026-05-21 (GSC ej konfigurerad)
Inga regressioner 2026-05-22 (GSC ej konfigurerad)
Inga regressioner 2026-05-26 (GSC ej konfigurerad)
Inga regressioner 2026-05-27 (GSC ej konfigurerad)
Inga regressioner 2026-05-28 (GSC ej konfigurerad)
Inga regressioner 2026-05-30 (GSC ej konfigurerad)
Inga regressioner 2026-06-02 (GSC ej konfigurerad)
Inga regressioner 2026-06-03 (GSC ej konfigurerad)
Inga regressioner 2026-06-05 (GSC ej konfigurerad)
Inga regressioner 2026-06-06 (GSC ej konfigurerad)
Inga regressioner 2026-06-07 (GSC ej konfigurerad)
Inga regressioner 2026-06-08 (GSC ej konfigurerad)
Inga regressioner 2026-06-07 (GSC ej konfigurerad)
Inga regressioner 2026-06-09 (GSC ej konfigurerad)
Senaste check: 2026-06-09

## Publicerade artiklar

| Datum | Titel | URL |
|-------|-------|-----|
| 2026-06-10 | Sandgjutning — komplett guide 2026: metod, material och tillämpningar | ⏳ Kör `node scripts/publish-traficator-sandgjutning.js` från EC2 |

## Deploy — väntande artiklar

**Artikel 1 (2026-06-10):**
- Fil: `content-pages/traficator-sandgjutning-guide-2026.html`
- Script: `scripts/publish-traficator-sandgjutning.js`
- Titel: "Sandgjutning — komplett guide 2026: metod, material och tillämpningar"
- Slug: `sandgjutning-guide-2026`
- Focus keyword: `sandgjutning`
- Meta title: "Sandgjutning — komplett guide 2026 | Traficator"
- ~1 050 ord, ÅÄÖ ok, 3 interna länkar, FAQ-schema (3 frågor), materialöversiktstabell
- Kategori-ID: 1 (OBS: verifiera rätt kategori i traficator.se/wp-admin → Inlägg → Kategorier)

**OBS inför deploy:**
- Kontrollera att app-password är satt (ej "placeholder") i SSM `/seo-mcp/wordpress/traficator/app-password`
- WP REST gav 500 vid kontakt 2026-05-06 — trolig orsak: placeholder-lösenord
- Kör scriptet och se felmeddelandet för diagnos

```bash
cd /home/ubuntu/Searchboost-Opti
node scripts/publish-traficator-sandgjutning.js
```

## Nästa artikelidéer

| Prioritet | Ämne | Fokuskeyword |
|-----------|------|-------------|
| ✅ KLAR | Sandgjutning komplett guide | sandgjutning — kör scripts/publish-traficator-sandgjutning.js |
| Hög | Stålgjutning — egenskaper och tillämpningar | stålgjutning |
| Hög | Gjutgods kostnad — vad påverkar priset? | gjutgods kostnad |
| Medel | Centrifugalgjutning — metod och fördelar | centrifugalgjutning |
| Medel | Sourcing metallkomponenter från Asien | sourcing metallkomponenter |

## Status
- WP-creds: OK (men WP REST gav 500 vid kontakt 2026-05-06 — sannolikt placeholder-lösenord)
- GSC: EJ konfigurerad (—)
- Kontakt: patrik.carlsson@traficator.se
- Senaste artikel skriven: 2026-06-10 (ej deployad)
