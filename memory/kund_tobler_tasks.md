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

### Deal — vad som ingår i 18k
- Ny hemsida i Flatsome (WooCommerce)
- **Fortnox-integration** (WooCommerce → Fortnox, automatisk fakturahantering)
- **3 Facebook-annonser** (ingår i priset)
- LinkedIn & Facebook organisk postning
- Bedrägeriskydd (org.nr-validering vid checkout)

**Totalt fakturerat:** 15k (skuld) + 18k (paket) = **33 000 kr** ✅

## Status 2026-04-16 kväll
- ✅ FB Manager setup pågår (Mikael satte upp web@searchboost.se, under granskning)
- ⏳ **Jakob fixar imorgon:** Produktbilder (3 st) + Fortnox API-nyckel + eventuellt annat
- ✅ WP credentials för tobler.se finns i SSM (username: mikael, app-password: mxln FGug xkKb eZo6 VKFy SzHm)
- ✅ Beebyte hosting-credentials sparade i SSM:
  - URL: https://shwl-0136.s.beebyte.se/
  - SSM: /seo-mcp/integrations/tobler/beebyte-{url,username,password}

## Klart 2026-04-17
- [x] 3 artiklar publicerade vecka 21 (kat: Branschkunskap ID:249):
  - ID:1999 /vad-kostar-en-byggstallning-komplett-prisguide-2026-2/ (focus: byggställning pris)
  - ID:2000 /starta-stallningsforetag-vad-kravs-och-hur-du-lyckas-2026-2/ (focus: starta ställningsföretag)
  - ID:2001 /stallningstrailer-guide-till-transport-av-byggstallning-2/ (focus: ställningstrailer)
- [x] 3 artiklar publicerade vecka 22 (kat: Branschkunskap ID:249):
  - ID:2002 /certifiering-stallningsentreprenorer/ (focus: ställningsentreprenör certifiering)
  - ID:2003 /kopa-modullstallning/ (focus: köpa modulställning)
  - ID:2004 /fallskydd-arbete-hog-hojd/ (focus: fallskydd arbete på hög höjd)

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
- [ ] ABC-keyword-kontroll (lägga in 30-50 nyckelord baserat på branschen)
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
