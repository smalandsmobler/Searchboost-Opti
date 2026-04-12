---
name: SMK tasks
description: Smålands Kontorsmöbler task-checklista
type: project
---

# Smålands Kontorsmöbler — Tasks

**Status**: Aktiv (WooCommerce-migrering från Abicart, 6 mån × 7000 kr)
**Kontakt**: Mikael Nilsson (mikael@smalandskontorsmobler.se)
**Site**: https://smalandskontorsmobler.se

## Nästa steg
- [ ] Byt avsändarnamn i WC → Inställningar → E-post om kunden vill ha annat visningsnamn än "Smålands Kontorsmöbler"
- [ ] Följ upp med Micke: var är ordrarna sedan 2026-03-28?
- [ ] Byt permalink-struktur från date-based till /%postname%/ i WP-admin → Inställningar → Permalänkar (artiklar ligger just nu under /2026/04/12/slug/)
- [ ] Skapa GSC URL-prefix property + SA-access
- [ ] Möbelrondellen GA4 — ingen analytics-kod i React SPA. Behöver GA4 Measurement ID från Mikael innan vi kan lägga till det.
- [ ] Social media Lambda deploy — `social-scheduler.js` klar lokalt, behöver manuell Lambda-deploy (EventBridge cron(0/15 * * * ? *))
- [ ] 8 variabla produkter saknar per-färgbilder — Micke/Mikael laddar upp leverantörsfoto per färg i WP-admin → Variationer-tab:
  Fluffy Fåtöljer (4547), Anton soffa (4560), Antibes soffa (4552), Big Alex (4603), Telemarket soffbord (4579), Berlin ståbord (4422), Trotsig lampa (4409), Bokhylla DNA (4343)
- [ ] 137 produkter saknar varumärke — behöver manuell granskning/tilldelning
- [x] 13 produkter utan beskrivning — AI-genererade beskrivningar tillagda (klädhängare, paraplyställ, kabelprodukter)

## Pågående
- Loopia API-user `searchboost@loopiaapi` lösenord: SbLoopia2026! (satt 2026-04-10, DNS-metoder aktiverade)

## Klart 2026-04-13 (kväll)
- [x] Snippet #141: Frakt inkl. avisering (490 kr) obligatorisk för privatpersoner
- [x] Snippet #142: Personnummer krävs för privatpersoner + org-nummer krävs för företag + faktura blockeras för privatpersoner
- [x] Swedbank Pay återaktiverat (plugin var inaktivt, API-nycklar intakta)
- [x] SMTP löst: order@smalandskontorsmobler.se skapad i Loopia, WP Mail SMTP aktiverat + konfigurerat (mailcluster.loopia.se:587 TLS) — testmail bekräftat levererat

## Klart 2026-04-13 (vecka 20)
- [x] 3 artiklar publicerade vecka 20 (kat ID:180 Guider):
  - ID:18297 /kontorsstol-guide-2026/ (focus: kontorsstol guide)
  - ID:18298 /skrivbord-kontor-guide/ (focus: skrivbord kontor)
  - ID:18299 /inreda-konferensrum-guide/ (focus: inreda konferensrum)
- [x] 13 produktbeskrivningar AI-genererade och publicerade (klädhängare Lucca/Faido, paraplyställ, kabelhanteringsprodukter, gasdrivet bildskärmsstativ — IDs 3766-3797)

## Klart 2026-04-12 (natt)
- [x] Bildaudit: alla 896 produkter har bilder, 307/315 variabla har 2+ imgs
- [x] 6 Småland Skjutdörrsskåp-produkter fick extra galleribilder importerade från Abicart
- [x] Bokhylla DNA (3917) fick 2 extra bilder (nu 3 totalt)
- [x] 10 produkter med noll-meta fick AI-genererade meta descriptions (125-137 tecken)
- [x] 558 produkters meta descriptions fixade (505 trimmade, 43 utökade, 10 genererade)

## Klart 2026-04-12 (kväll)
- [x] SMK hem-sida ÅTERSTÄLLD efter mobil-Claude-session förstörde den (kl 18:10) — 32592 tecken återhämtade från rev 18198

## Klart 2026-04-12
- [x] 3 artiklar publicerade vecka 18 (kat: Guider):
  - ID:18213 /kontorslandskap-mobler-guide/ (focus: kontorslandskap möbler)
  - ID:18214 /kopa-kontorsmobler-foretag/ (focus: kontorsmöbler företag)
  - ID:18215 /sittergonomi-kontoret-guide/ (focus: sittergonomi)
- [x] /gratis-seo-analys/ på searchboost.se uppdaterad — professionell design + audit-widget inbäddad

## Klart 2026-04-11
- [x] 2026-04-11: Snippet #9 ONE-SHOT deaktiverad (WC-permalinks körde fortfarande)
- [x] 2026-04-11: Snippet #22 "SMK: Mobile-first CSS v2" uppgraderad och aktiverad — fixar 100vw horisontell scroll, chat-widget på 420px, produktkort overflow, touch targets 44px, iOS font-zoom-fix
- [x] 2026-04-11: Rank Math REST API aktiverat (snippet 130 + 132)
- [x] 2026-04-11: Konferensbord-sidan (ID:18134) — fullt ombyggd med SMK brand-standard HTML, Rank Math meta, meny
- [x] 2026-04-11: Förvaring-sidan (ID:18135) — fullt ombyggd, Rank Math meta, meny
- [x] 2026-04-11: Artikel ID:18203 /konferensbord-guide-2026/ — ~1100 ord, kat: Guider
- [x] 2026-04-11: Artikel ID:18204 /kontorsforvaring-guide-2026/ — ~1050 ord, kat: Guider
- [x] 2026-04-11: Artikel ID:18199 /kontorsmobler-guide-2026/ — ~900 ord, kat: Guider
- [x] 2026-04-11: Artikel ID:18208 /inreda-kontor-guide-2026/ — ~1100 ord, kat: Guider
- [x] 2026-04-11: Social media posting infrastruktur deployad till EC2 — social-poster.js, 4 API-endpoints, Dashboard Social Media-flik

## Klart 2026-04-10
- [x] 2026-04-10: Flatsome 3.20.5 installerat + aktiverat
- [x] 2026-04-10: 34 Flatsome demo-sidor (ID:17855-17888) satta till draft — sajten rensad
- [x] 2026-04-10: Startsida (ID:9311) ombyggd med Flatsome — dark navy hero (#1a1a2e), kategorigrid 4-kol, ux_products 8st, USP-sektion med ikoner (pink #e91e8c), blogg-sektion, pink CTA-banner. Rank Math meta satt.
- [x] 2026-04-10: Kontorsstolar (ID:17851) /kontorsstolar/ — H1 hero, ergonomi-guide 2-kol, accordion 4 items, produktgrid, dark B2B CTA
- [x] 2026-04-10: Höj-sänkbara skrivbord (ID:17937) /hoj-sankbara-skrivbord/ — H1 hero, guide 2-kol, accordion, 4-ikon feature-bar, produktgrid, pink CTA
- [x] 2026-04-10: Om oss (ID:10525) /om-oss/ — H1 hero, historia + stats (500+ kunder, 1000+ prod, 10+ år, 3-7 dagar), icon-box grid, pink CTA
- [x] 2026-04-10: Artikel ID:18025 /ergonomiska-kontorsmobler-guide-2026/ (~1200 ord, kat: Guider)
- [x] 2026-04-10: Artikel ID:18082 /hoj-sankbart-skrivbord-guide-2026/ (~1200 ord, kat: Guider)
- [x] 2026-04-10: Meny (ID:179) uppdaterad — Kontorsstolar + Höj-sänkbara skrivbord tillagda som toppnivå

## Klart 2026-04-07 → 2026-04-09
- [x] Kassan fixad (shortcode, billing_company optional, FCF av)
- [x] SPF + DMARC via Loopia API
- [x] wp-mail-smtp aktivt
- [x] SSM-URL fixad (ny.→huvuddomän)
- [x] 2026-04-09: Produkt-permalinks /product/ → /produkt/ + 301-redirect
- [x] 2026-04-09: ~3300 bilder fick auto-alt-text
- [x] 2026-04-09: 16 sidor fick auto meta description

## Pausad
(inget)

## Referenser
- Full status: `smk_status_2026-04-08.md`
- Kund-info: `kunder.md`
