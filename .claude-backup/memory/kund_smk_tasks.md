---
name: SMK tasks
description: Smålands Kontorsmöbler task-checklista
type: project
originSessionId: 63fdf8cc-30f5-498e-8229-aa4f52589808
---
# Smålands Kontorsmöbler — Tasks

**Status**: Aktiv (WooCommerce-migrering från Abicart, 6 mån × 7000 kr)
**Kontakt**: Mikael Nilsson (mikael@smalandskontorsmobler.se)
**Site**: https://smalandskontorsmobler.se

## Nästa steg
- [ ] Skapa Excel-dokument: alla produkter uppdelade per kategori — kolumner: pris, kampanj, bildnotering, produktinfo. Micke ska kunna jobba i det. Exportera från WC → skicka till Micke.
- [ ] Boka lunchmöte Halmstad — Micke vill komma och sitta ned, gå igenom hur sajten ska se ut
- [ ] Byt permalink-struktur från date-based till /%postname%/ i WP-admin → Inställningar → Permalänkar (artiklar ligger just nu under /2026/04/12/slug/)
- [ ] Skapa GSC URL-prefix property + SA-access
- [ ] Social media Lambda deploy — `social-scheduler.js` klar lokalt, behöver manuell Lambda-deploy (EventBridge cron(0/15 * * * ? *))
- [ ] 8 variabla produkter saknar per-färgbilder — Micke/Mikael laddar upp leverantörsfoto per färg i WP-admin → Variationer-tab:
  Fluffy Fåtöljer (4547), Anton soffa (4560), Antibes soffa (4552), Big Alex (4603), Telemarket soffbord (4579), Berlin ståbord (4422), Trotsig lampa (4409), Bokhylla DNA (4343)
- [ ] 137 produkter saknar varumärke — behöver manuell granskning/tilldelning
- [ ] Byt avsändarnamn i WC → Inställningar → E-post om kunden vill ha annat visningsnamn
- [x] 13 produkter utan beskrivning — AI-genererade beskrivningar tillagda (klädhängare, paraplyställ, kabelprodukter)

## Pågående
- Loopia API-user `searchboost@loopiaapi` lösenord: SbLoopia2026! (satt 2026-04-10, DNS-metoder aktiverade)

## Klart 2026-04-18 (kväll) — efter samtal med Micke
- [x] **Samtal med Micke** — kund stannar kvar, nöjd med responstid, vill boka lunchmöte i Halmstad
- [x] Faktura skapad: 21 000 kr + 1 000 kr (Flatsome-licens) = 22 000 kr
- [x] Trust-bar garanti: "Upp till 10 års garanti / På utvalda produkter" → "2 års garanti / På alla produkter" (snippet 47)
- [x] Trust-bar leveranstid: "3–7 arbetsdagar" → "2-3 arbetsdagar" (snippet 47)
- [x] Default leveranstid alla produkter: 1-3 → **2-3 arbetsdagar** (snippet 46) — hörnskrivbord fortfarande 3-4 veckor
- [x] Höj-sänkbara skrivbord ur undantagslistan — visar nu Lagervara-badge korrekt (snippet 48)
- [x] WC fri frakt: inaktiverade felaktig "Gratis frakt" ID:7 (min:0, alltid fri) — nu kör bara ID:8 (min:5000kr, korrekt)
- [x] Fri frakt verifierad: ID:8 enabled, min_amount=5000, requires=min_amount, zon Sverige

## Klart 2026-04-18 (förmiddag)
- [x] Mail till Micke (SMK) skrivet och klart att skicka — `content-pages/mail-smk-micke-status.md`. Ämne: "Version 2.0 är live — här är allt som är fixat och vad jag behöver från dig"
- [x] Mail dokumenterar alla 10 fixes: leveranstider, produktkort, bilder (888 produkter 240×240 uniform), sidfot, Inter Tight-typografi, trust-bar, knappstilar, produktbeskrivningar (5 bullets + accordion per produkt), SEO-grund (Rank Math Pro, H1:or, schema 888 produkter, cookie policy, 68 demo-drafts raderade)
- [x] Bildpunkten i mailet formulerad korrekt — lägger bildansvar hos leverantör, CSS-fix är klar

## Klart 2026-04-17
- [x] Premium produktkort CSS (snippet #154) — rensa Flatsome hover-popups (quick-view "Snabbkoll", image-tools), clean typografi, proportionell bildruta, lugn kant + hover-skugga. Kundfeedback: "ocleant vid hover, inte premium". Verifierat live på https://smalandskontorsmobler.se/produkt-kategori/hoj-och-sankbara-skrivbord/
- [x] Inter Tight font på hela sajten
- [x] Trust-bar under header (fri frakt / garanti / leverans / telefon) på alla sidor
- [x] Knappstilar: pill-formade, mörkgrön primär, konsekvent
- [x] 888 produkters beskrivningar: 5 fördelsbullets + accordion (AI-genererade via Fortnox NL-agent)
- [x] Rank Math Pro aktiverat, H1:or injicerade, Product schema på 888 produkter, Cookie Policy fylld

## Klart 2026-04-16
- [x] Meta-sweep 2026-04-16: 40 sidor fick rank_math_title/description/focus_keyword (pages med saknad meta, inkl Flatsome-demos som bör raderas i städkörning)

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
