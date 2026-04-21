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
- [x] Följ upp med Micke — löst 2026-04-21
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

## Klart 2026-04-22 (nattjobb) — stor SEO-audit
- [x] **GSC sitemap_index.xml submittad** och **Lyckades** — 1 093 upptäckta sidor (property: https://www.smalandskontorsmobler.se/)
- [x] **Interlinking 71/71 artiklar** — "Relaterade artiklar"-block med 3 ämnes-matchade länkar + kategorilänkar (/sittmobler/kontorsstolar/, /bord/hoj-och-sankbara-skrivbord/, /butik/). Ämnes-matchning: stol/skrivbord/förvaring/konferens/ergonomi/akustik/belysning/reception/lounge
- [x] **llms.txt expanderad** (1017 → 5 474 bytes, snippet #15) — full produktkategori-träd, 15 top guides, landningssidor, villkor. Cache-Control: max-age=300.
- [x] **robots.txt härdning** — nytt snippet #171 "SBS: robots.txt härdning". Disallow: /cart/, /checkout/, /my-account/, /varukorg/, /?s=, /?orderby=, /?filter_*, /?min_price=, /?max_price=, /?pa_*, /search/, /feed/, /xmlrpc.php. Allow Googlebot-Image på /wp-content/uploads/.
- [x] **ContactPage + AboutPage schema** (snippet #173) — JSON-LD på /kontakt/ (ContactPage + ContactPoint) och /om-oss/ (AboutPage). Verifierat live.
- [x] **H-struktur fixad** — 3 artiklar hade duplicate H1 (content + Flatsome entry-title): 18342 kontorsstol-ergonomi-guide, 17820 konferensmobler-guide, 18334 kontorsmobler-begagnade. Content-H1 konverterad till H2.
- [x] **Schema-audit OK** — Organization+LocalBusiness (startsida), BlogPosting+BreadcrumbList (artiklar), Product+BreadcrumbList (produkter), CollectionPage (kategorier), FAQPage (/vanliga-fragor/).
- [x] **Snippets rensade**: #153 ONE-SHOT deaktiverad, #150 fått namn "SBS: Rank Math taxonomy meta REST". 170 totalt, 39 aktiva.
- [x] **Flatsome demo-post** ID 17854 trashad.
- [x] **Sanity-check**: Startsida + kategorier + produkt + artikel + /kontakt/ + /om-oss/ = alla 200 OK, 0 fatal errors, 1 H1 per sida, CSS intakt.

## Klart 2026-04-21 (nattjobb — vecka 24)
- [x] 3 artiklar publicerade vecka 24 (kat ID:180 Guider):
  - ID:18343 /kontorsmobler-oppet-kontorslandskap/ (focus: kontorsmöbler öppet kontorslandskap)
  - ID:18344 /chefsstol-guide/ (focus: chefsstol)
  - ID:18345 /konferensbord-motesrum-guide/ (focus: konferensbord mötesrum)
- [x] SMK-mail till Micke om bilder (draft: r-1165472324737637616) — "antingen skickar du bilderna eller AI-genererar vi"

## Klart 2026-04-20 (vecka 23)
- [x] 3 artiklar publicerade vecka 23 (kat ID:180 Guider):
  - ID:18340 /stabord-kontor-guide/ (focus: ståbord kontor)
  - ID:18341 /loungemobler-kontor-guide/ (focus: loungemöbler kontor)
  - ID:18342 /kontorsstol-ergonomi-guide/ (focus: kontorsstol ergonomi)

## Klart 2026-04-20 (vecka 22)
- [x] 3 artiklar publicerade vecka 22 (kat ID:180 Guider):
  - ID:18337 /pausrum-moblerguide/ (focus: pausrum möbler)
  - ID:18338 /skarmvagg-kontor-guide/ (focus: skärmvägg kontor)
  - ID:18339 /motesstol-guide-konferensrum/ (focus: mötesstol)

## Klart 2026-04-20 (vecka 21)
- [x] 3 artiklar publicerade vecka 21 (kat ID:180 Guider):
  - ID:18334 /kontorsmobler-begagnade-guide/ (focus: kontorsmöbler begagnade)
  - ID:18335 /moblera-mottagning-receptionsmobler/ (focus: möblera mottagning)
  - ID:18336 /tysta-rum-kontor-fokuszoner-akustik/ (focus: tysta rum kontor)

## Klart 2026-04-13 (internlänkar — kannibalisering)
- [x] Internlänkar tillagda i 5 artiklar för kontorsstolar, konferensbord, förvaring:
  - ID:14270 /top-kontorsstolar-for-smaforetag-4/ → "receptionsdiskar" länkat till `/forvaring/`, "Kontorsstolar" länkat till `/kontorsstolar/`
  - ID:18203 /konferensbord-guide-2026/ → "konferensbord" länkat till `/konferensbord/`
  - ID:18204 /kontorsforvaring-guide-2026/ → "förvaring" länkat till `/forvaring/`
  - ID:18199 /kontorsmobler-guide-2026/ → kontorsstolar + förvaring länkade till resp. kategorisidor
  - ID:18208 /inreda-kontor-guide-2026/ → kontorsstolar + förvaring länkade till resp. kategorisidor

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
