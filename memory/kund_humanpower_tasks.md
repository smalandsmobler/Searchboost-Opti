---
name: Humanpower tasks
description: Humanpower task-checklista
type: project
---

# Humanpower — Tasks

**Status**: Aktiv (sajt byggd, Reboot + priser inlagda 2026-04-07)
**Site**: https://humanpower.se

## Nästa steg
- [ ] Lägg till SA i GSC: seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com (Fullständig) — Mikael gör manuellt i GSC > Inställningar > Användare och behörigheter
- [x] Org.nr i footer: Human Power Sweden AB · Org.nr: 559256-7464 · info@humanpower.se (hittad via allabolag.se, Anette Brink ledamot)
- [ ] Ny batch artiklar vecka 22

## Klart 2026-04-16
- [x] Utvecklande samtal (ID 26): hero nu full viewport-bredd. Kadence meta satt: `_kad_post_layout=fullwidth`, `_kad_post_content_style=unboxed`, `_kad_post_vertical_padding=remove`. CSS-override injicerad överst i content för att bryta ut `.wp-block-cover.alignfull` från `.content-container.site-container`.
- [x] Kosttillskott (ID 27): komplett ombyggd till clean butikssida i SagaPro-stil. Fyra produkter i 2x2-grid med stora burk-bilder på mjuk grön bakgrund, produktnamn (serif), italic quote, 4 fördelar per produkt med gröna checkmarkar, pris (399 kr/burk) och "Se produkten"-CTA. WooCommerce-shortcode ersatt med handbyggd HTML för full kontroll över design. Samma Kadence fullwidth-meta + CSS-override applicerad.

## Klart 2026-04-15 (kväll)
- [x] Utvecklande samtal-sida (ID 26) helt ombyggd:
  - Hero: therapy-room.webp (ID 140, stolen/terapirum) — soffa-bilden borttagen
  - Grön fördelar-box (border-left #3d7a5a, bakgrund #f3faf5)
  - Mörk citat-ruta (#1F2A28) med grön accenttext för "Det är här skiftet sker"
  - Praktisk info-kort (vit, grön kantlinje, subtil skugga)
  - Boka-sektion (mörkgrön #0f1f1a) med CF7-formulär + !important CSS override
- [x] Kosttillskott-sida (ID 27) helt ombyggd:
  - Hero 80vh med kosttillskott-hero-1.png + Island-tema
  - Science strip: 4200+ studier, 100% isländskt, biotillgänglighet, klinisk
  - Produktgrid 2x2 med rätt burk-bilder (WooCommerce shortcode)
  - Ursprungssektion med formulaitons-1.jpg + Island-text
  - Avslutande brand statement-sektion
- [x] Alla 4 produktbilder fixade: AstaEye→622, AstaSkin→620, SagaPRO→619, Astaxanthin→663
- [x] wp_credentials.md korrigerad: humanpower username = searchboost, pw = JSiE s6jV sw1T LTfz pUnw Xv5X

## Klart 2026-04-15 (vecka 21)
- [x] Footer Lorem ipsum ersatt med riktig text: Anette Brink, samtalspedagog och grundare av Human Power (widget block-8)
- [x] 11 Reboot-bilder konverterade (HEIC→JPEG) och uppladdade (IDs 745-755) med alt-texter
- [x] Nytt fotogalleri ("Platsen") lagt till på humanpower.se/reboot/
- [x] 3 artiklar publicerade vecka 21 (kat ID:46 Inspiration & insikt):
  - ID:739 /sjalvkarlek-sjalvmedkansla-personlig-forandring/ (focus: självkärlek personlig utveckling)
  - ID:740 /nervsystemet-stress-spanning-i-kroppen/ (focus: nervsystemet stress kroppen)
  - ID:741 /livshjulet-sjalvinsikt-guide/ (focus: livshjulet självinsikt)

## Klart 2026-04-13 (vecka 20)
- [x] 3 artiklar publicerade vecka 20 (kat ID:46):
  - ID:724 /stresshantering-tips-guide/ (focus: stresshantering tips)
  - ID:725 /livscoach-vs-samtalspedagog/ (focus: livscoach vad gör)
  - ID:726 /utbrandhet-aterhamtning-guide/ (focus: utbrändhet återhämtning)

## Klart 2026-04-12 (kväll)
- [x] 3 retreatfoton uppladdade och publicerade på humanpower.se/reboot/ (IDs 717-719)
- [x] 3 artiklar publicerade vecka 19:
  - ID:721 /samtalspedagog-i-stockholm-guide/ (focus: samtalspedagog stockholm)
  - ID:722 /livshjulet-personlig-forandring/ (focus: livshjul coaching)
  - ID:723 /reboot-retreat-litauen-guide/ (focus: reboot retreat)

## Klart 2026-04-12
- [x] GSC URL-prefix property skapad: https://humanpower.se/ — verifierad av Mikael
- [x] HTML-verifieringstoken deployad via Code Snippets ID:18 (ubACGXFod2aRbU5FkdAi_sbihsdt8zN2h4sOHDCOzk8)
- [x] GSC-property sparad i SSM: /seo-mcp/integrations/humanpower-se/gsc-property

## Klart 2026-04-12
- [x] 3 artiklar publicerade vecka 18 (kat ID:46 Inspiration & insikt):
  - ID:684 /livshjulet-verktyg-sjalvinsikt/ (focus: livshjul coaching)
  - ID:685 /stresshantering-metoder-nervsystem/ (focus: stresshantering)
  - ID:686 /bi-terapi-bio-integrationsterapi/ (focus: BI-terapi)
- [x] SSM-credentials sparade (url, username, app-password)

## Klart 2026-04-10
- [x] 2026-04-10: 10 ABC-keywords inlagda (4A / 4B / 2C): samtalspedagog, holistisk aterhamtning, reboot retreat, personlig utveckling retreat, samtalspedagog stockholm / BI-terapi, samtasterapi, aterhamtning retreat, livshjul coaching / reboot litauen
- [x] 2026-04-10: "Hello world!"-inlägg raderat
- [x] 2026-04-10: Kategori "Inspiration & insikt" skapad (ID:46)
- [x] 2026-04-10: 3 artiklar publicerade vecka 16:
  - ID:671 /holistisk-aterhamtning/ — Vad är holistisk återhämtning
  - ID:672 /samtasterapi-vad-hander-i-kroppen/ — Samtasterapi
  - ID:673 /personlig-utveckling-retreat/ — Personlig utveckling retreat
- [x] 2026-04-10: 3 artiklar publicerade vecka 17 (batch 2):
  - ID:681 /samtalspedagog-vad-gor-och-nar-soka-hjalp/ — Samtalspedagog guide
  - ID:682 /reboot-retreat-ateruppladda-kropp-och-sjal/ — Reboot Retreat
  - ID:683 /bi-terapi-bio-integrationsterapi-guide/ — BI-terapi guide

## Klart senaste
- [x] Sajten byggd
- [x] Reboot-datum + priser inlagda 2026-04-07

## Pausad
- Innehåll från Anette Brink om Utvecklande samtal — i Mikaels inkorg, väntar på vidarebefordran

## Referenser
- `kunder_humanpower.md`
