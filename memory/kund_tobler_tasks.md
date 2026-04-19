---
name: Tobler tasks
description: Tobler task-checklista
type: project
---

# Tobler — Tasks

**Status**: Aktiv
**Företag**: Tobler Ställningsprodukter AB
**Ort**: Torslanda, Göteborg
**Ägare**: Bröderna Viktor & Jakob Frostenäs
**Kontakt**: jakob@tobler.se
**Site**: https://tobler.se
**Bransch**: B2B — byggställningar (ramställning + modulställning), formsystem för betonggjutning, fallskydd/taksäkerhet, väderskyddstak, ställningstrailer, arbetskläder (Portwest, Blåkläder, Snickers, L.Brador)
**Målgrupp**: Ställningsentreprenörer + byggföretag + nya ställningsbolag (startpaket)

## Status 2026-04-16
**DEAL KLART.** Möte 16 april — de köpte 18k-paketet + betalar 15k-skulden.

**15k-skulden betald ✅ (2026-04-19)**
**18k faktura skickas 23 april** — Jakob ska se tobler.searchboost.se staging först.

### Deal — vad som ingår i 18k
- Ny hemsida i Flatsome (WooCommerce)
- **Fortnox-integration** (WooCommerce → Fortnox, automatisk fakturahantering)
- **3 Facebook-annonser** (ingår i priset)
- LinkedIn & Facebook organisk postning
- Bedrägeriskydd (org.nr-validering vid checkout)

**Totalt fakturerat:** 15k (skuld) + 18k (paket) = **33 000 kr** ✅

## Status 2026-04-16 kväll
- ✅ FB Business Manager godkänt 2026-04-20 — BM ID: 667764620301167
- ⏳ **Jakob fixar imorgon:** Produktbilder (3 st) + Fortnox API-nyckel + eventuellt annat
- ✅ WP credentials för tobler.se finns i SSM (username: mikael, app-password: mxln FGug xkKb eZo6 VKFy SzHm)
- ✅ Beebyte hosting-credentials sparade i SSM:
  - URL: https://shwl-0136.s.beebyte.se/
  - SSM: /seo-mcp/integrations/tobler/beebyte-{url,username,password}

## Klart 2026-04-20 (vecka 24)
- [x] 3 artiklar publicerade vecka 24 (kat: Branschkunskap ID:249):
  - ID:2088 /fasadstallning-guide/ (focus: fasadställning)
  - ID:2089 /rullstallning-guide-3/ (focus: rullställning)
  - ID:2090 /begagnad-byggstallning-guide/ (focus: begagnad byggställning)

## Klart 2026-04-17
- [x] 3 artiklar publicerade vecka 21 (kat: Branschkunskap ID:249):
  - ID:1999 /vad-kostar-en-byggstallning-komplett-prisguide-2026-2/ (focus: byggställning pris)
  - ID:2000 /starta-stallningsforetag-vad-kravs-och-hur-du-lyckas-2026-2/ (focus: starta ställningsföretag)
  - ID:2001 /stallningstrailer-guide-till-transport-av-byggstallning-2/ (focus: ställningstrailer)
- [x] 3 artiklar publicerade vecka 22 (kat: Branschkunskap ID:249):
  - ID:2002 /certifiering-stallningsentreprenorer/ (focus: ställningsentreprenör certifiering)
  - ID:2003 /kopa-modullstallning/ (focus: köpa modulställning)
  - ID:2004 /fallskydd-arbete-hog-hojd/ (focus: fallskydd arbete på hög höjd)
- [x] 3 artiklar publicerade vecka 23 (kat: Branschkunskap ID:249):
  - ID:2085 /hyra-byggstalning-vs-kopa/ (focus: ställning hyra / hyra byggställning)
  - ID:2086 /byggstalning-sakerhetskrav-afs-2013-4/ (focus: byggställning regler / säkerhetsregler)
  - ID:2087 /aluminiumstallning-vs-stalstallning/ (focus: aluminiumställning)

## Klart 2026-04-17 → 2026-04-18 (staging tobler.searchboost.se)

### Footer — ombyggd
- [x] Widget INFORMATION (id 4): `Vanliga fr\u00e5gor`-escape fixad → `Vanliga frågor`
- [x] Widget KONTAKT (id 5): Namn/telefon/email staplade vertikalt (`.fp-name`/`.fp-tel`/`.fp-mail` som `display:block`)
- [x] CSS: Tobler-blå bakgrund (#32508E), gula widgettitlar (#F1E400), kolumner staplas <900px, 4-col ≥900px
- [x] `absolute_footer`: "Copyright © Tobler Ställningsprodukter AB 2026" centrerad på mörkblå remsa (#1e3a6f)
- [x] Flatsome/UX Themes-länkar dolda via CSS

### Header — iterativt ombyggt
- [x] `header_elements_right` = `["button-1", "cart"]` (rensade bort "html" som renderade Flatsome-placeholder "Add anything here...")
- [x] Tax toggle (Privat/Företag) injiceras via JS som `li.tobler-tax-li` först i `ul.header-nav.nav-right`
- [x] **CSS Grid** placerar höger-gruppen: `[KONTAKT | toggle]` övre rad, `[KONTAKT | cart]` undre → toggle ovanför kassan (sparar horisontellt utrymme)
- [x] `align-items: flex-end` på flex-row → allt bottom-alignat med loggans underkant
- [x] Hög specificitet via `body #masthead.header-main`-prefix för att slå post 1994's `align-items:center`
- [x] Spacing: 38px padding från hörnan, 48px mellan logga och nav, 38px mellan varje menyord, 38px till höger-gruppen
- [x] PRIVAT inaktiv-opacity höjd 0.35 → 0.4 för synlighet mot vit bakgrund
- [x] `killDark()` + MutationObserver tar bort dubbel-loggan (`.header-logo-dark`) som Flatsome renderar serversidigt
- [x] `killPlaceholder()` säkerhet som tar bort `li.html_topbar_left` om den skulle dyka upp

### AI-chat
- [x] "Fråga AI"-FAB fixed bottom-right (ersätter sökfält) — klick öppnar `window.toblerAiChat.open()` eller faller till `/kontakt/`

### Schema
- [x] LocalBusiness/HardwareStore JSON-LD i `html_scripts_header` (name, telephone, email, Göteborg, grundat 1987)

### Lärdomar (sparade i `memory/`)
- `feedback_flatsome_css.md` — Flatsome serverar CSS från posten i `theme_mods.custom_css_post_id` (1994 för Tobler), INTE från `theme_mods_flatsome.custom_css`
- `feedback_wp_changes.md` — Max 3–5 CSS-rader per commit mot live, stegvis verifiering

### Öppet / att verifiera
- [x] Hårdladdning av staging för att bekräfta grid-layout för höger-gruppen + bottom-alignment — **VERIFIERAD 2026-04-20**: `grid-template-areas: ". toggle" / "kontakt cart"` bekräftad i live CSS. `align-items:flex-end` på flex-row OK. tobler-tax-li injicerad och placerad korrekt.
- [ ] Om KONTAKT-knappen inte hamnar i samma linje som loggans underkant: finjustera `padding-bottom` på `.header-inner.flex-row`
- [ ] `window.toblerAiChat` är inte implementerad — FAB-klicket faller till `/kontakt/` tills vidare

## Klart 2026-04-20 (vecka 25)
- [x] 3 artiklar publicerade vecka 25 (kat: Branschkunskap ID:249):
  - ID:2094 /ipaf-utbildning-stallning-guide/ (focus: IPAF utbildning ställning)
  - ID:2095 /besiktning-byggstallning-guide/ (focus: besiktning ställning)
  - ID:2096 /fasadrenovering-stallning-guide/ (focus: fasadrenovering ställning)

## Nästa steg (imorgon när Jakob skickar material)
- [ ] Motta bilder + Fortnox API-nyckel från Jakob
- [ ] Skicka faktura 18k + 15k till jakob@tobler.se (Mikael)
- [ ] Hämta/bekräfta WP app-password för tobler.searchboost.se (dev)
- [ ] Fortnox-integration: installera + konfigurera plugin (WooCommerce för Fortnox)
  - Plugin: t.ex. "Fortnox for WooCommerce" (WP repo eller Fortnox-marketplace)
  - Testa: lägg testorder → verifieras faktura skapas i Fortnox
- [ ] 3 Facebook-annonser — när FB-kontot är godkänt + bilder anlände
  - Kampanj setup i web@searchboost.se Business Manager
  - Budget 50–100 kr/dag per annons
- [ ] Flatsome-bygge starta — ny struktur, produktkategorier, checkout
- [ ] Publicera de 3 klara vecka-21-artiklarna (kräver WP-access)
- [ ] Kannibalisering — fixa internlänkar när WP-credentials är aktiverade: "modulställning" och "ramställning" pelar mot samma sidor. Kategori-sidor ska länkas konsekvent från produktsidor + bloggar med anchor "modulställning" resp "ramställning". Primary: tjänstesidorna under /produkter/ (behöver kartläggas). Lägg i köen inför nästa artikelbatch.
- [ ] Sätt upp GSC URL-prefix property + SA (autonomt via wp_head meta-tag)
- [x] ABC-keyword-kontroll — 35 keywords inlagda 2026-04-20 (12A / 12B / 11C) via Dashboard API
- [ ] Nästa batch vecka 22 — föreslagna keywords: "ställningsentreprenör certifiering", "köpa modulställning", "fallskydd arbete på hög höjd"
- [ ] Länkbygge från byggbranschmedia och ställningsföreningar
- [ ] Diskutera upsell: Google Ads på "startpaket ställning", "köpa ställning"

## Klart 2026-04-13 (vecka 21)
- [x] 3 artiklar skrivna (ej publicerade — kräver WP-access):
  - /content-pages/tobler/artikel-vecka21-stallning-pris.md (focus: byggställning pris)
  - /content-pages/tobler/artikel-vecka21-stallningsentreprenor-guide.md (focus: starta ställningsföretag)
  - /content-pages/tobler/artikel-vecka21-kundvagnar-stallningstrailer.md (focus: ställningstrailer)
  **OBS**: Tobler saknar WP app-password i SSM. Mikael måste publicera manuellt eller lägga in credentials.

## Klart 2026-04-10
- [x] 3 artiklar publicerade vecka 17 (kat: Branschkunskap ID:249):
  - ID:1972 /stallningsplan-vad-ar-det-och-nar-kravs-en-stallningsplan/
  - ID:1973 /stallningsentreprenor-certifiering-utbildning-och-krav/
  - ID:1974 /startpaket-stallning-vad-ingar-och-hur-valjer-du-ratt/

## Klart 2026-04-09 natten
- [x] 4 pelarartiklar publicerade LIVE (#1968-1971):
  - artikel-1: Ramställning vs modulställning (focus: ramställning vs modulställning)
  - artikel-2: Fallskydd till tak — komplett guide (focus: fallskydd till tak)
  - artikel-3: Formsystem för betonggjutning (focus: formsystem betong)
  - artikel-4: Väderskyddstak för ställning (focus: väderskyddstak ställning)
- [x] 284 bilder auto-alt-text + 135 sidor meta description (bulk SEO sweep)
- [x] Code Snippets plugin installerat
- [x] llms.txt publicerad (302 bytes)
- [x] Standards refererade i artiklar: SS-EN 12810/12811/13374/13670, AFS 2013:4, Eurokod 1, DIN 18218

## Pausad
(inget)

## Referenser
- Artiklarna i `content-pages/tobler/`
- `kunder.md`
