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

## Klart 2026-04-22 (nattjobb)
- [x] **Interlinking 13/13 artiklar** — "Relaterade artiklar"-block med 3 ämnesmatchade länkar (ställning/tak/form/väder/besiktning/köp/trapp/planera) + landningssidor /produkt-kategori/byggstallningar/, /fallskydd-taksakerhet/, /formsystem/.
- [x] **robots.txt härdning** (snippet #52) — Disallow cart/checkout/my-account/varukorg/kassan/?s=/?orderby=/?filter_*/feed/xmlrpc. Googlebot-Image allow uploads.
- [x] **SEO-grund verifierad OK**: Sitemap (213 URLer), Rank Math emittar JSON-LD + 7 OG + meta desc + canonical, llms.txt (1671 chars med alla produktkategorier).

## Status 2026-04-16
**DEAL KLART.** Möte 16 april — de köpte 18k-paketet + betalar 15k-skulden.

**15k-skulden betald ✅** — Viktor Frostenäs (Jakobs storebror) betalade på studs vid mötet
**18k faktura skickad ✅ (2026-04-21)** — Faktura #135, 22 500 kr ink moms, förfall 2026-05-11
⏳ **18k EJ betald ännu** — förfaller 2026-05-11

### Deal — vad som ingår i 18k
- Ny hemsida i Flatsome (WooCommerce)
- **Fortnox-integration** (WooCommerce → Fortnox, automatisk fakturahantering)
- **3 Facebook-annonser** (ingår i priset)
- LinkedIn & Facebook organisk postning
- Bedrägeriskydd (org.nr-validering vid checkout)

**Totalt fakturerat:** 15k (skuld) + 18k (paket) = **33 000 kr** ✅

## Status 2026-04-16 kväll
- ✅ FB Business Manager godkänt 2026-04-20 — BM ID: 667764620301167
- ✅ **Meta Pixel skapad + installerad 2026-04-20** — Pixel ID: `1997637907505774` ("Tobler Ställningsprodukter AB"), live på tobler.se via Code Snippets (snippet #16), sparad i SSM
- ⏳ **Jakob fixar imorgon:** Produktbilder (3 st) + Fortnox API-nyckel + eventuellt annat
- ✅ WP credentials för tobler.se finns i SSM (username: mikael, app-password: mxln FGug xkKb eZo6 VKFy SzHm)
- ✅ Beebyte hosting-credentials sparade i SSM:
  - URL: https://shwl-0136.s.beebyte.se/
  - SSM: /seo-mcp/integrations/tobler/beebyte-{url,username,password}

## Klart 2026-04-19 — Produktsida redesign (Snippet #21 v6)

### Snippet #21 v6 — Produktsida redesign (tobler.searchboost.se)
- [x] Snippet #21 aktiv (ID:21, `is_product()` guard, scope: front-end)
- [x] Trust bar via wp-custom-css (Snabb leverans / Upp till 10 år garanti / 031-92 80 15)
- [x] USP-lista server-side via `woocommerce_after_add_to_cart_button` (PHP hook, ingen JS)
- [x] 5 punkter, kategori-aware med korrekt ÅÄÖ:
  - Fallskydd: `fallskydd`, `personligt-fallskydd`, `fallskyddsselar`, `fallskyddsblock`, `fallskyddskit`, `fallskyddslinor`, `krokar-karbiner`, `takpaket`, `mato-pro-fallskydd` m.fl.
  - Kläder: `arbetsklader`, `portwest-arbetsklader`, `blaklader-arbetsklader`, `lbrador-arbetsklader`, `snickers-workwear`
  - Default (ställning): alla övriga produkter
- [x] WooCommerce tabs dolda: `.woocommerce-tabs.wc-tabs-wrapper{display:none!important}`
- [x] Produktbeskrivning visas direkt under produktlayouten via `woocommerce_after_single_product_summary` (priority 5)
- [x] Social share dold: `.share-icons{display:none!important}`
- [x] Verifierat Playwright: USP visible=True, tabs visible=False, alla 3 kategorityper testad
- [x] Gäller alla produktsidor (ca 100+ produkter)

## Klart 2026-04-19 morgon — Kategori-toggle SEO-block

### Snippet #19 v4 — Kategori SEO-text (tobler.searchboost.se)
- [x] Toggle-block placerat UNDER produktgridet (JS-repositionering via `.row.large-columns-3`)
- [x] "Läs mer om [kategorinamn] ▼" knapp — utfällbar, stängs med ▲
- [x] Egen click-handler med `dataset.bound`-guard (förhindrar dubbelbindning med `setupSeoBlocks()`)
- [x] H2/H3-transformation: `<p>Rubrik<br>Svar</p>` → `<h2>` (sektioner) / `<h3>` (frågor, avslutas med ?)
- [x] Fetstilta, centrerade rubriker med marginal till brödtexten — via CSS
- [x] FAQPage JSON-LD auto-genererad från H3+P-par i innehållet
- [x] Verifierat live via JS DOM: 12 barn-element, 4×H2, 2×H3, 2 FAQ-entries i schema, toggle öppnar/stänger
- [x] Beebyte server-cache rensad
- [x] Fungerar på alla 23 kategori-sidor (global scope, `is_product_category()` guard)

## Klart 2026-04-19 natt — SEO-batch (tobler.searchboost.se dev)

### Produktmeta — Rank Math (title + description + focus keyword)
- [x] Ramställning 6 st (ID:787, 792, 797, 806, 810, 811) — aluminium + stål, 18x6m/174m²/348m²
- [x] Ställningspaket + trailer 5 st (ID:241, 517, 606, 612, 616)
- [x] Blåkläder 6 st (ID:1696–1701)
- [x] L.Brador 2 st (ID:1702–1703)
- [x] Snickers 9 st (ID:1665, 1668, 1669, 1672, 1674, 1676, 1678, 1679, 1680)
- [x] Portwest 1 st (ID:1684) — från föregående session
- [x] Portwest 11 st (ID:1685–1695) — PW3 Vinterjacka, Skaljacka, Regnjacka, T-shirt, Shorts, DX4 Huvtröja, Regnställ, DX461 Vinterjacka, Hi-Vis T-shirt klass 3, Mesh T-shirt klass 2, Varsel T-shirt V-ringad

### Infrastruktur
- [x] product_cat-sitemap.xml aktiverad (Rank Math option `tax_product_cat_sitemap = '1'`) — 30 kategorier, HTTP 200
- [x] sitemap_index.xml uppdaterad med product_cat-sitemap.xml som 5:e post
- [x] llms.txt uppdaterad — alla kategori-URL:er ändrade till korrekt `/produkt-kategori/...` format (30 URL:ar fixade)
- [x] robots.txt utökad — AI-crawlers tillagda (GPTBot, ChatGPT-User, Claude-Web, ClaudeBot, anthropic-ai, PerplexityBot, Bytespider, cohere-ai) via Snippet #17
- [x] Debug-snippets #14 + #15 avaktiverade (ej raderade av API, men OFF = inaktiva)

## Klart 2026-04-19 (vecka 23)
- [x] 3 artiklar publicerade vecka 23 (kat: Branschkunskap ID:249):
  - ID:2057 /fallskydd-platt-tak-regler-produkter-och-installation/ (focus: fallskydd platt tak)
  - ID:2058 /vagmarken-och-regler-typer-placering-och-skyltplan/ (focus: vägmärken regler)
  - ID:2059 /arbetsmiljo-pa-bygget-afs-krav-och-skyddsutrustning/ (focus: arbetsmiljö bygge)

## Klart 2026-04-17 (SEO-batch kvällsoptimering)
- [x] 13 produkter fick meta descriptions (alla som saknade):
  - 8 MATO Pro Fallskydd (9m-30m) — alla med unika descriptions + EN-standard
  - 3 väggelement Alu (Strato/Alkus/formplywood) — formsystem för betonggjutning
  - 1 förankringsögla 12mm
  - 1 Blåkläder 1596 Hantverksshorts klass 1

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

## LinkedIn — postningsschema
- **Frekvens**: 2 ggr/vecka — torsdag + söndag
- **Innehåll**: Samma artiklar som publiceras på hemsidan
- **Första posten**: Skickad till Jakob 2026-04-21 — postar själv tills admin-access är given
- **Nästa post**: Torsdag 2026-04-24 — artikel: /rullstallning-guide-3/ eller /fasadstallning-guide/

## LinkedIn API — Status 2026-04-24
- **App**: "Searchboost Social Tobler" — Client ID: `77ka4qh59sk857`, Client Secret: `WPL_AP1.5yYw4vJcMxHWBIKy`
- **Community Management API**: Ansökan inskickad 2026-04-24 — **Review in progress** (1-5 dagar)
- **Redirect URI**: `http://localhost:3579/callback` — tillagd i appen
- **Blockerat**: Alla produkter låsta under granskning — "Share on LinkedIn" + "Sign In with OpenID Connect" kan ej aktiveras förrän LinkedIn godkänner
- **När godkänt**: Kör `LI_CLIENT_ID=77ka4qh59sk857 LI_CLIENT_SECRET="WPL_AP1.5yYw4vJcMxHWBIKy" CUSTOMER=tobler node scripts/linkedin-oauth-setup.js` → token sparas i SSM → autopostning live
- **OAuth script**: `scripts/linkedin-oauth-setup.js` — uppdaterat med scopes: w_member_social, w_organization_social, r_organization_social, openid, profile, email

## Klart 2026-04-20 — Vecka 24 artiklar (tobler.searchboost.se)
- [x] 3 artiklar publicerade vecka 24 (kat ID:249 Branschkunskap):
  - ID:2161 /hyra-byggstallning-eller-kopa-vad-ar-smartast-2026/ (focus: hyra byggställning)
  - ID:2162 /personligt-fallskydd-sele-lina-och-fastpunkter-forklarade/ (focus: personligt fallskydd)
  - ID:2163 /formgjutning-betong-sa-valjer-du-ratt-formsystem-for-vaggar-och-pelare/ (focus: formgjutning betong)

## Klart 2026-04-21 — Kategoribanners final fix (tobler.searchboost.se dev)

### Snippet #31 v2 — Kategori hero med parallax + zoom (ALLA problem fixade)
- [x] PHP `theme_mod_shop_page_title` filter tillagd (preventiv)
- [x] CSS konflikt hittad: gammal `KATEGORISIDOR`-block i WordPress wp-custom-css (display:flex !important på .shop-page-title) — BORTTAGET via snippet #56
- [x] Ny CSS: `html body.tax-product_cat .shop-page-title { display:none!important; ... }` (specificitet 0,2,2 > konfliktens 0,2,1)
- [x] JS `nukeTitle()`: querySelectorAll + inline setProperty('display','none','important') på alla selektorer
- [x] `MutationObserver` lagd till — fångar WP Rocket fragment-reinsertion
- [x] Slow-motion zoom uppgraderad: 8s → 18s (eased quad-out, scale 1.10→1.00)
- [x] Transparenta produktkort: `backdrop-filter:blur(10px)` + `rgba(255,255,255,.72)` + hover translateY(-5px)
- [x] Footer CSS injection (wp_footer priority 999) bevarad
- [x] VERIFIERAT: ingen `display:flex` konflikt, hero present, MutationObserver aktiv, 18s zoom, glass cards

## Klart 2026-04-20 — Produktsida-renovering (tobler.searchboost.se dev)

### Snippet #21 v12 — UI-förbättringar
- [x] Priser: snygg layoutbox (background #f8fafc, border #dde7f3, border-radius 10px) — exkl. + inkl. moms
- [x] USP-lista: gröna bockar borttagna → `list-style:disc` svarta punkter (padding-left:18px)
- [x] Produktbeskrivning-kort: CSS `.tobler-desc-card` (ljusblå, #f0f6fd) implementerat med JS-injektion under galleriet
- [x] Verifierat live: `tobler-full-desc-source` div i HTML, JS fungerar korrekt

### Kategori-videor
- [x] Alla 8 kategorikort uppdaterade med -2.mp4 på hemsidan (page ID 18)
  - ramstallningar-2.mp4, modulstallningar-2.mp4, formsystem-2.mp4, stallningstrailer-2.mp4
  - fallskydd-till-tak-2.mp4, u-profilsplankor-2.mp4, bygg-och-montage-2.mp4, arbetsklader-2.mp4
  - Media IDs: 2121, 2127–2133

### Produktbilder (bättre upplösning från brand-CDN)
- [x] **Portwest**: 12 produkter → 1100px JPEG från portwest CDN (media IDs 2135–2146)
- [x] **Snickers**: 19 produkter → Bynder CDN (hultaforsgroup.bynder.com), 5 unika bilder (media IDs 2154–2158)
- [x] **L.Brador**: 4 produkter → Viskan CDN /large/ (363–396KB JPEG), media IDs 2159–2160
  - T-shirt 6120P (IDs 1864, 1702) → lbrador-6120p-front.jpg
  - Shorts 1470PB (IDs 1862, 1703) → lbrador-1470pb-indigo-front.jpg

### Produktbeskrivningar
- [x] 17 ställnings-/verktygsprodukter fick fullständiga beskrivningar:
  - 10 st med 0 chars → nu 400-800 chars (Toppstolpe, Ändstop, ALU-ram, Förvaringshäck, MATO S, MATO Pro, Sparklist, Diagonalstag ×2, Aluminiumplank)
  - 7 st med <200 chars → nu 600-800 chars (Fotlist ALU, Innerhörnskonsol, Konsol dubbelkoppling, Nockstolpe, Räckeskoppling, Plattform med lucka, Ställningspaket)
- [x] Portwest (12 st ID:1684–1695) + Blåkläder äldre (4 st ID:1698–1701) + L.Brador äldre (2 st ID:1702–1703) → 1350-1550ch beskrivningar från brand-specs
- [x] Snickers äldre (9 st ID:1665–1680) → 1554-1721ch baserade på duplikat-produkters fullständiga beskrivningar

## Klart 2026-04-20 — Blåkläder produktbilder uppladdade

### Bilder från blaklader.se CDN → tobler.searchboost.se WordPress
- [x] 7 unika produktbilder nedladdade (1200px, 100–200KB) och uppladdade till WP media-biblioteket
- [x] 12 produkter uppdaterade med korrekt featured image via WC REST API

| Media ID | Bild | Produkt-ID:n |
|----------|------|--------------|
| 2147 | 18202513 Varselbyxa Softshell (fee3843f) | 1847, 1699 |
| 2148 | 3546 Varseltröja med luva (d45bceab) | 1860, 1698 |
| 2149 | 2890 Hängselbyxa Multinorm Inherent (4ddb3d8b) | 1858, 1697 |
| 2150 | Flamskyddad Overall Multinorm Inherent (180e266b) | 1855, 1696 |
| 2151 | 1596 Hantverksshorts (20bdd6f2) | 1851, 1700 |
| 2152 | Hi-Viz Bomulls-T-Shirt lång ärm (3d0b3883) | 1843, 1701 |
| 2153 | Hi-Viz Varsel-T-Shirt kortärmad (e74389e0) | (uppladdad, ej kopplad — ingen matchande produkt) |

## Klart 2026-04-20 — Formsystem videobakgrund

- [x] **Formsystem kategori-kort** — video overlay implementerat via Code Snippet #27 (front-end, aktiv):
  - `_bild_video_url` = `https://tobler.se/wp-content/uploads/2026/04/formsystem-2.mp4` (term meta, term 83)
  - JS injicerar `<video autoplay muted loop>` inuti `.jet-listing-dynamic-post-83 .elementor-element-90229af`
  - `.e-con-inner` får `position:relative; z-index:1` så rubriken syns ovanför videon
  - Fallback: statisk `Formsystem.jpg` visas medan JS kör (`_bild_kategori` = 1136, oförändrad)
  - Modulstallningar-videon var identisk (8,987,450 bytes) — ersatt med ny 480p-fil (ID:2097, 3.9MB)
  - **Utökning**: sätt `_bild_video_url` på övriga kategorier (term 16, 79, 28, 23, 20) med respektive mp4 från media-biblioteket

## Klart 2026-04-21 — SEO-optimering live (tobler.se)

### Deplouat från staging → live
- [x] **Snippet #42** — Kategoribanner (hero + parallax, 200px, gömmer Flatsome shop-page-title)
  - Aktivt på tobler.se. 9 kategorier med thumbnail, blå gradient + gul titel.
- [x] **Snippet #43** — Product Schema + BreadcrumbList (JSON-LD, alla produktsidor)
- [x] **Snippet #44** — Internlänkar + relaterade kategorier (4 produkter + 6 kategoripills)
- [x] WP Rocket inställningar aktiverade: lazyload=1, minify CSS+JS=1, defer JS=1, serve WebP=1, link_prefetch=1, image_dimensions=1
- [x] Imagify WebP-optimering: 377 av 379 bilder optimerade till WebP (1 BMP + 1 Elementor-screenshot hoppad)
- [x] WP Rocket cache rensad efter deploy

### Tekniskt
- Dubbletter 39/40/41 avaktiverade (samma kod, äldre version)
- Hjälp-snippets 29-38, 45 avaktiverade

## Klart 2026-04-22 — Dropdown + sidebar-fix (tobler.searchboost.se dev)
- [x] WP Rocket JS-delay avstängt på startsida + kategori/produkt/shop-sidor (snippet 63)
- [x] hoverIntent.min.js exkluderad från WP Rocket delay (fixar nav-dropdowns)
- [x] Tom "Shop Sidebar" gömd via CSS i snippet 31 (hindrar flash på kategorisidor)
- [x] Dropdown-problem debuggat: defer_all_js_safe sköt alla scripts efter ~3 sek och dödade Flatsomes init

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
- [x] ABC-keyword-kontroll — 21 sökord totalt i Opti (11 ställning + 10 fallskydd/vägmärken/trafiksäkerhet, tillagda 2026-04-18)
- [x] Ny 3-månaders åtgärdsplan i Opti (16 tasks, fokus fallskydd + vägmärken + trafiksäkerhet, skapad 2026-04-18)
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
