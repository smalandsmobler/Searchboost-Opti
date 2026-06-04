# tobler — Tasks & Status

> Kund: tobler.se | GSC: OK | Kontakt: jakob@tobler.se
> Senast uppdaterad: 2026-06-04

## VIKTIGT — plattformsbyte 2026-06-04
tobler.se är INTE längre WordPress/Elementor. Sajten är nu en **Next.js App Router-sajt**
(statisk export, `output: 'export'`), kodbas `tobler-next-final`, byggd och hostad på
**EC2 51.21.116.7** (samma server som nso/arbetsro). Gamla Elementor-tasks är inaktuella.

- Apex `tobler.se`, `www.tobler.se` och `ny.tobler.se` serveras ALLA från EC2 nginx.
- Deploy: rsync källkod till EC2, bygg på EC2 (kräver WP-API-åtkomst vid byggtid, se nextjs_deploy_skill.md).
- Verifiera live med curl externt efter varje deploy.

## Migrering Beebyte — MISSLYCKADES (2026-06-04)
Försök att flytta www → Beebyte Plesk via redirect-arkitektur (EC2 apex 301 → www på Beebyte).
Let's Encrypt SSL på www.tobler.se via Plesk gav upprepad HTTPS-timeout trots korrekt DNS + HTTP 301.
**Rollback: båda domänerna tillbaka på EC2.** Slutsats: EC2 nginx hanterar apex+www+SSL pålitligt.
Lärdom: verifiera SSL-aktivering INNAN DNS-cutover vid split-host.

## SEO-lansering 2026-06-04 (Health Score 38/100 → fixat)
Genomförda fixar (deployade + curl-verifierade live):
- robots.txt: platshållarfil → produktionskonfiguration
- canonical + og:image i ALLA page metadata (root layout.tsx + per-route generateMetadata):
  butik, om-oss, kontakt, kunskapsbank, produkt/[slug], produkt-kategori/[slug]
- robots: noindex på transaktionssidor: kassan, varukorg, mitt-konto
- Organization JSON-LD: hårdkodad staging-logo-URL → prod-URL, sameAs fixat
- BreadcrumbList (Hem → Sortiment → Kategori → Produkt) i ProductJsonLd.tsx
- Villkorlig FAQPage JSON-LD på produktsidor (renderas bara om FAQ finns för kategorin)
  - faq-data.ts: getCategoryFaq(slug) med fuzzy slug-matchning (ramstallning-aluminium → ramstallning)

## Betalning — PÅGÅR
- **Swedbank Pay valt** över Stripe (beslut 2026-06-04).
- Väntar på Jakobs credentials: access token + Payee ID + miljöbekräftelse (prod/sandbox).
- När mottaget: lagra i SSM, integrera kassan.

## Publicerade artiklar (WP-era — kan behöva migreras till Next.js)

| Datum | Titel | URL |
|-------|-------|-----|
| 2026-05-03 | Modulställning — vad du behöver veta | https://tobler.se/kopa-modulstallning-vad-du-behover-veta-om-system-pris-och-leverantorer/ |
| 2026-05-11 | Ställningsnät — krav, typer och rätt användning (⚠ status oklar efter migrering) | — |

## Nästa artikelidéer

| Prioritet | Ämne | Fokuskeyword |
|-----------|------|-------------|
| Hög | Skyddsräcke på byggställning | skyddsräcke byggställning |
| Hög | Ställning för takrenovering | ställning takrenovering |
| Medium | Ställningsarbete regler | ställningsarbete regler |
| Medium | Transport av ställning | transport byggställning |

## Status
- Plattform: Next.js statisk export på EC2 51.21.116.7
- GSC: EJ konfigurerad (—)
- Kontakt: jakob@tobler.se
- Betalning: Swedbank Pay (väntar creds)
