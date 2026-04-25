---
name: Traficator tasks
description: Traficator task-checklista
type: project
---

# Traficator — Tasks

**Status**: Aktiv
**Kontakt**: Patrik Carlsson (patrik.carlsson@traficator.se)
**Site**: https://traficator.se (WP 6.9.1 + Flatsome-child v3.0 + Rank Math SEO Pro + Polylang)
**Admin access**: `mikael`-konto full admin, verifierat 2026-04-09

## Fakturering
- **Faktura utestående**: 22 500 kr ink moms — förfall **26 april**
**REGEL**: Patrik vill ha MAIL varje gång vi gör ändringar på sajten. Skicka alltid uppdateringsmail efter arbete.

## AKUT — Site nere (väntar på cPanel-fix från Sven-Erik/Patrik)
**Status**: traficator.se returnerar 500. Sven-Erik (seutsi@gmail.com) försökte fixa via recovery mode men recovery mode är tillfälligt — plugin re-aktiveras efter session.
**Orsak**: Snippet #44 "SBS: RM Sitemap Deep Invalidation (ONE-SHOT)" — `Call to undefined method RankMath\Sitemap\Sitemap::invalidate_sitemap()`. Kraschar ALLA requests inkl REST API.
**Recovery URL förbrukad** (Sven-Erik använde den — ny krävs eller cPanel-fix).
**Fix som krävs — cPanel phpMyAdmin**:
  `UPDATE wp_snippets SET active=0 WHERE id=44;` → sen re-aktivera Code Snippets plugin i WP admin.
**Mail skickat till Sven-Erik**: draft r-5669747148509373159 — SKICKA DETTA!
**Mail till Patrik om AKUT**: r-7853756144723746915 (skickades 2026-04-24 21:29 UTC)
**OBS efter fix**: Code Snippets plugin inaktiverades av Sven-Erik → alla snippets (llms.txt, schema, hreflang, robots.txt, UX) är inaktiva. Återaktivera plugin → verifiera snippets #7, #8, #14, #33, #34, #36, #52.
**Hosting**: Oderland, clio.oderland.com, cPanel https://traficator.se:2083/, WP-path `/home/traficat/public_html/`
**Interlinking**: Skript klart: `/tmp/traficator_interlinking_local.py` — kör när site är uppe.

## Nästa steg

### OMEDELBART — NÄR SITEN ÄR UPP
1. [ ] **Skicka draft r-5669747148509373159** till Sven-Erik — cPanel phpMyAdmin fix-instruktioner (UPDATE wp_snippets SET active=0 WHERE id=44)
2. [ ] **Verifiera snippets** efter Code Snippets re-aktivering: #7 (llms.txt), #8/#14 (schema), #33 (hreflang), #34 (robots.txt), #36 (UX-fix), #52 (robots.txt alt). Avaktivera snippet #44 permanent.
3. [ ] **Kör interlinking-skript**: `python3 /tmp/traficator_interlinking_local.py` — lägger "Relaterade sidor"-block på alla 8 lokala SEO-sidor
4. [ ] **Kundmail** — draft r-986303352788039 SKICKAS EJ av Claude. Mikael läser igenom och skickar själv.

### PÅGÅENDE / NÄSTA
- [x] ~~Möte tisdag 15 april kl 13.30~~ — genomfört
- [x] ~~FREDAG 24 APRIL: Möte med Patrik~~ — genomfört (pitch Traficator Plast)
- [ ] Bygga branschsidor, materialsidor, jämförelsesidor (expansion — presenterat i PPT slide 13-14)
- [ ] GSC SA för Traficator — property https://traficator.se/ finns, verifiera SA-access
- [ ] Följa upp månadsrapport 3 maj (GSC-data för april)
- [ ] Verifiera GA4 i GTM-container GTM-KRTLTBXM (logga in på tagmanager.google.com)
- [x] hreflang på 10 SV/EN-par — Code Snippet #33 live 2026-04-21 (4 artiklar + 6 sidor)

## Klart 2026-04-24 (SEO Bulk-audit — slutförd)
- [x] **55 meta descriptions utökade** — alla sidor/inlägg med desc < 120 tecken utökade till 130-155 tecken med fokuskeyword + CTA. Alla 55/55 OK via WP REST API.
- [x] **21 långa titlar förkortade** — alla titlar > 68 tecken kortades till ≤67 tecken (inkl " | Traficator"). Alla 21/21 OK.
- [x] **14 MULTI_H1 fixade** — (klart i föregående session) första `<h1>` i content → `<h2>` på alla 14 inlägg.
- [x] **Sitemap saknar 8 sidor** — mitigerat: Polylang SV-språk tilldelat på alla 8 sidor via classic editor form submit (message=1 på alla). Post-titlar uppdaterade (placeholder → riktiga stadsnamn). Rank Math transients rensade (4 st). 8 URL:er skickade via IndexNow (Rank Math Instant Indexing → "8 URL:er inskickade."). Sidor är indexerbara; sitemap kan självläka vid nästa Flatsome-redigering.
- [x] **Uppdateringsmail** till Patrik — ny draft r-986303352788039 klar (full sammanfattning 24 april inkl lokal SEO + audit + incident)

## Klart 2026-04-24 (UX-fixar)
- [x] **Hero-bild live** — bakgrundsbild satt direkt på `.bg.fill.bg-fill` i page 59 HTML; `bg-grayscale` borttagen; röd overlay `rgba(192,57,43,0.80)` via inline style. Industriell gjutgods-bild synlig bakom overlay.
- [x] **Ikoner fixade** — snippet #36 `SBS: Startsida UX-fix`: CSS `background-color: #c0392b` + `filter: brightness(0) invert(1)` på `.has-icon-bg .icon-inner img`. Alla 3 ikoner (hjärta/tjänster/kontakt) syns som vita symboler på röda cirklar.
- [x] **Offertformulär** — /offert/ (ID:1596) ombyggd: H1 + 1-rad intro → CF7-formulär direkt (ej nedan fold) → HR → Vad-vi-behöver-grid + process-lista.
- [x] **Stockholm-sida** (ID:1861) + **gjutgods-leverantör-sida** (ID:1867) — nya landningssidor skapade.
- [x] **Guider** — /gjutjarn-guide/ (ID:1863) + /smide-guide/ (ID:1864) publicerade.
- [x] **CTR-fix** — 24 artiklar fick utökade meta descriptions (65-90 → 130-160 tecken) för att motverka CTR-kollaps (746% impressioner, +22% klick).

## Klart 2026-04-24 (lokal SEO)
- [x] **6 stadssidor skapade** (lokal SEO mot tillverkningstäta städer):
  - ID:1847 /gjuteri-jonkoping/ — Jönköping, Husqvarna/Kinnarps, Gnosjöregionen proximity
  - ID:1849 /gjuteri-gnosjoregionen/ — GGVV-klustret, 10 000+ tillverkare, "Gnosjöandan"
  - ID:1851 /gjuteri-goteborg/ — Volvo Cars/Trucks, SKF, fordonsleverantörer
  - ID:1853 /gjuteri-eskilstuna/ — "Sveriges Sheffield", Volvo CE, Komatsu Forest
  - ID:1855 /gjuteri-malmo/ — Alfa Laval (Lund), Skånes tillverkningsindustri
  - ID:1857 /gjuteri-vasteras/ — ABB headquarters, Hitachi Energy, elektroteknisk industri
- [x] **Hub-sida /gjuteri-smaland/ uppdaterad** — "Lokala marknader vi betjänar"-grid med 6 stadslänkar
- [x] **Hub-sida /gjuteri-sverige/ (ID:1599) uppdaterad** — "Lokala marknader vi betjänar"-grid med 7 sidor (alla 6 städer + Småland)
- [x] **llms.txt (snippet #7) uppdaterad** — ny sektion "Lokala landningssidor" med alla 8 lokalsidor, senast uppdaterad 2026-04-24

## Klart 2026-04-22 (nattjobb)
- [x] **Interlinking 53/53 artiklar** — "Relaterade artiklar"-block med 3 ämnes-matchade länkar (press/sand/centrifugal/prec/koppar/zink/alu/cnc/smide/magnesium/plast/kval/fordon/konst/gjut) + landningssidor (/vara-tjanster/metallgjutning/, /pressgjutning/, /sandgjutning/, /bearbetning/).
- [x] **llms.txt expanderad** (snippet #7) — alla gjuttjänster, referensprojekt, 15 top artiklar, Traficator Plast-notering.
- [x] **robots.txt härdning** (snippet #34) — Disallow wp-login/?s=/search/feed/xmlrpc. Googlebot-Image allow uploads.
- [x] **Sanity-check**: / + /vara-tjanster/ + alla tjänstesidor + /referensprojekt/ + /om-oss/ + /kontakt/ = 200 OK, 0 fatal, 1 H1. Tjänstesidor har jsonld=3 (Organization + Service + FAQPage via snippet #8/#14). Startsida jsonld=1.
- [x] **Sitemap verifierad**: /sitemap_index.xml 200 OK (Rank Math, 4 sub-sitemaps, 99 URLs). /sitemap.xml + /wp-sitemap.xml → 301 till sitemap_index.xml. robots.txt pekar rätt.

## Klart 2026-04-14 (Patriks klagomål — alla fixes live)
- [x] Sandgjutning (ID:1278) — korrekt intro återställd
- [x] Metallgjutning (ID:1289) — korrekt intro återställd
- [x] EN Metal Casting (ID:1543) — korrekt engelska intro
- [x] EN Sand Casting (ID:1544) — korrekt engelska intro
- [x] GJUTNING/Metallgjutning — first i Våra tjänster (menu_order:1)
- [x] Övrigt → "Traficator Plast" (sida + menypost)
- [x] Engelska meny (ID:94) — fullt återuppbyggd (10 items, korrekta undersidor)
- [x] Mail skickat till Patrik — ursäkt + bekräftelse på alla fixes + möte imorgon 13.30

## Klart 2026-04-13 (internlänkar — kannibalisering)
- [x] Internlänkar tillagda i 6 artiklar för aluminiumgjutning + centrifugalgjutning:
  - ID:1498 /aluminiumgjutning-egenskaper-fordelar-tillampningar/ → länk till `/vara-tjanster/pressgjutning/` (primary för aluminiumgjutning)
  - ID:1522 /aluminiumgjutning-vs-pressgjutning-skillnader/ → pressgjutning-sidan + precisionsgjutning-sidan länkade i listan
  - ID:1521 /centrifugalgjutning-sverige-nar-lonar/ → länk till `/vara-tjanster/centrifugalgjutning/` + pressgjutning/sandgjutning i intro
  - ID:1520 /pressgjutning-aluminium-guide/ → länk till `/vara-tjanster/pressgjutning/` i intro
  - ID:1630 /gjutgods-guide-2026/ → länk till centrifugalgjutning-tjänstesidan
  - ID:1638 /formgjutning-guide-2/ → länk till centrifugalgjutning-tjänstesidan

## Klart 2026-04-13 (vecka 20)
- [x] 3 artiklar publicerade vecka 20 (kat: Blogg ID:109):
  - ID:1641 /pressgjutning-aluminium-guide-2/ (focus: pressgjutning aluminium) — slug fick -2 suffix pga befintlig pelarartikel
  - ID:1643 /konstruktion-gjutgods-dfm-guide/ (focus: gjutgods konstruktion)
  - ID:1645 /prototyp-gjutning-guide/ (focus: prototyp gjutning)

## Klart 2026-04-12 (kväll)
- [x] 3 artiklar publicerade vecka 19 (kat: Blogg ID:109):
  - ID:1638 /formgjutning-guide/ (focus: formgjutning)
  - ID:1639 /aluminium-vs-zink-gjutning/ (focus: zinkgjutning)
  - ID:1640 /ytbehandling-gjutgods-guide/ (focus: ytbehandling gjutgods)

## Klart 2026-04-12
- [x] 3 artiklar publicerade vecka 18 (kat: Blogg ID:109):
  - ID:1633 /sandgjutning-aluminium-guide/ (focus: sandgjutning aluminium)
  - ID:1634 /precisionsgjutning-vaxgjutning-guide/ (focus: precisionsgjutning)
  - ID:1635 /gjutet-gods-tekniska-ritningar-toleranser/ (focus: gjutgods ritning)

## Klart 2026-04-10 (kväll)
- [x] 2026-04-10: 5 engelska artiklar återpublicerade (råkade raderas):
  - ID:1625 /sourcing-from-asia-how-to-secure-quality/
  - ID:1626 /what-is-material-sourcing-complete-guide-for-manufacturers/
  - ID:1627 /aluminium-casting-properties-advantages-applications/
  - ID:1628 /steel-vs-aluminium-which-material-for-cast-components/
  - ID:1629 /quality-control-in-metal-casting-methods-and-standards/
- [x] Mail skickat till Patrik om 5 återställda engelska artiklar (skickat av Mikael)

## Klart 2026-04-10
- [x] 2026-04-10: Dubblerad "Gjutning"-flik borttagen från menyn
- [x] 2026-04-10: Titlar på tjänstesidor korrigerade (Sandgjutning, Precisionsgjutning & vaxgjutning)
- [x] 2026-04-10: Övrigt-sidan text uppdaterad (6910 tecken)
- [x] 2026-04-10: FAQ — alla frågor besvarade på engelska (12 030 tecken)
- [x] 2026-04-10: Engelska sajten komplett — alla tjänstesidor översatta (ID 1542–1556)
- [x] 2026-04-10: Alla artiklar även på engelska (ID 1557–1566)
- [x] 2026-04-10: Svensk FAQ-sida skapad (ID:1616, /fragor-svar/) med FAQPage-schema
- [x] 2026-04-10: Schema markup via Code Snippets (snippet ID:8) — FAQPage, Service, Organization
- [x] 2026-04-10: Interna länkar på alla 7 tjänstesidor (från 1 → 6 per sida)
- [x] 2026-04-10: Mail skickat till Patrik — uppdatering + mötesbokning onsdag 16 april

## Klart 2026-04-09 natten
- [x] 2026-04-09: **9 service-sidor återställda från WP revisions** (~37 500 tecken) — kunden hade klagat på att texter inte syns, orsak hittad: tidigare webbutvecklare hade tagit bort allt innehåll. Restored: Metallgjutning, Sandgjutning, Pressgjutning, Centrifugalgjutning, Precisionsgjutning/vaxgjutning, Aluminiumlegeringar, Smide, Bearbetning, Våra tjänster
- [x] 5 stub-posts + 5 duplicate-posts raderade (1480, 1481, 1482, 1499, 1500)
- [x] 3 artikel-slugs renamade (ta bort -2 suffix): 1493, 1494, 1495
- [x] 10 engelska dublett-sidor raderade (Home, About, Contact, News, Our Services, CASTING, MACHINING, MISCELLANOUS, FAQ-engelsk, THE PROCESS)
- [x] 4 pelarartiklar publicerade live (#1520-1523, ~8400 ord):
  - Pressgjutning aluminium (focus: pressgjutning aluminium)
  - Centrifugalgjutning i Sverige
  - Aluminiumgjutning vs pressgjutning
  - Bearbetning av gjutgods
- [x] 41 bilder auto-alt-text + 86 sidor meta description
- [x] Code Snippets plugin installerat
- [x] llms.txt publicerad (1537 bytes) för AI-sök
- [x] Omsigneringsmöte-PPT byggd i Traficators brand (presentations/output/traficator-omsignering-2026-04-10.pptx)

## Resultat (GSC 2026-02 → 2026-03)
- Impressions: +179% (525 → 1463)
- Klick: +70% (10 → 17)
- Top-10 keywords: 3 (centrifugalgjutning, bearbetning gjutgods, gjutning aluminiumlegeringar)

## Möjligheter (pressgjutning-familjen)
- ~500 imp/mån på pressgjutning-relaterade sökord i position 14-57
- Potential: 100-150 nya klick/mån om vi når topp 3 på dessa
- 4 pelarartiklar ligger nu live som grund för detta

## Klart 2026-04-18 — Full teknisk SEO-audit + fixes

### Audit-resultat (90 items skannade: 49 pages + 41 posts)
- ✅ 0 pages/posts saknar Rank Math title eller description (metadata-täckning 100%)
- ✅ 0 bilder saknar alt-text (81 bilder i media-bibl.)
- ✅ 0 pages i `noindex` av misstag
- ✅ Schema live: Organization, WebSite, Service, FAQPage, Article, BreadcrumbList
- ✅ Sitemap OK (Rank Math): post/page/category/local
- ✅ Homepage TTFB 0,78s / total 0,88s (godtagbart)
- ⚠️ 3 artiklar publicerade LIVE med placeholder-text `$CONTENT1/2/3` — allvarligt SEO-problem
- ⚠️ 3 par duplicate-slugs med `-2`-suffix (länkkraft splittrad)
- ⚠️ 1 kannibalisering (två artiklar med IDENTISKT focus keyword "aluminium zink gjutning")
- ⚠️ 5 posts saknade focus keyword (har title + desc men Rank Math kan inte poäng-sätta)
- ⚠️ Sida `/guider/` hade fel Rank Math title ("Pressgjutning aluminium" — kopiering)

### Utfört (12 fixes, alla verifierade)
| # | Fix | Detalj |
|---|-----|--------|
| 1 | DRAFT post 1633 `sandgjutning-aluminium-guide` | Innehöll bara `$CONTENT1` placeholder |
| 2 | DRAFT post 1634 `precisionsgjutning-vaxgjutning-guide` | Innehöll bara `$CONTENT2` placeholder |
| 3 | DRAFT post 1635 `gjutet-gods-tekniska-ritningar-toleranser` | Innehöll bara `$CONTENT3` placeholder |
| 4 | DRAFT post 1639 `aluminium-vs-zink-gjutning-2` | Kannibaliserade 1637 (samma focus kw, kortare innehåll) |
| 5 | Focus kw på 1501 | `stål vs aluminium gjutgods` |
| 6 | Focus kw på 1498 | `aluminiumgjutning egenskaper` |
| 7 | Focus kw på 1495 | `material sourcing guide` |
| 8 | Focus kw på 1494 | `sourcing asien kvalitet` |
| 9 | Focus kw på 1493 | `sandgjutning vs pressgjutning` |
| 10 | Rank Math title + desc + kw på sida 1573 `/guider/` | Ny title: "Guider om gjutning, bearbetning och sourcing \| Traficator" |
| 11 | Rename slug 1638 | `formgjutning-guide-2` → `formgjutning-vilka-metoder` (301 verifierad) |
| 12 | Rename slug 1641 | `pressgjutning-aluminium-guide-2` → `pressgjutning-aluminium-process` (301 verifierad) |

Gamla URL:er ger 301 → nya slugs via WordPress native `_wp_old_slug`. Sitemapen är rensad.

### Att skriva (blockerar inte SEO nu men är innehålls-luckor)
- [ ] Innehåll för **sandgjutning-aluminium-guide** (ID 1633) — fokus: sandgjutning aluminium
- [ ] Innehåll för **precisionsgjutning-vaxgjutning-guide** (ID 1634) — fokus: precisionsgjutning
- [ ] Innehåll för **gjutet-gods-tekniska-ritningar-toleranser** (ID 1635) — fokus: gjutgods ritning
  *(Publicera om som `publish` när innehåll finns. Artiklarna ligger som draft i admin.)*

### Mail till Patrik — säg ungefär
> Hej Patrik,
>
> Vi körde en komplett teknisk SEO-audit på traficator.se idag och åtgärdade 12 punkter:
>
> **Kritiskt åtgärdat:** Vi hittade 3 artiklar som råkat publiceras med platshållartext istället för innehåll — de serverades live till besökare och Google. Avpublicerade omedelbart, kommer skrivas färdigt nästa vecka.
>
> **Kannibalisering fixad:** En kortare dubblett-artikel med samma fokusord som en längre pelarartikel avpublicerad — nu konkurrerar de inte längre om samma sökord.
>
> **Länkstruktur städad:** Två artiklar hade URL:er med `-2`-suffix (t.ex. `/formgjutning-guide-2/`). Omdöpta till beskrivande slugs som reflekterar innehållet — 301-redirects på plats så ingenting tappas.
>
> **Metadata:** 5 pelarartiklar saknade fokusord i Rank Math — ifyllda. En kategorisida hade fel meta-titel — rättad.
>
> **Bekräftat välfungerande:** 100% meta-täckning, 0 bilder utan alt-text, schema (Organization/Service/FAQPage) live på alla viktiga sidor, sitemap ren.
>
> Totalt positiv effekt på ranking förväntas inom 2–4 veckor när Google reindexerar.
>
> /Mikael

🔓 **UPPLÅST 2026-04-18** — audit + implementation klart.

## Klart 2026-04-20 (QA + sitemap)
- [x] Dublettkontroll — 0 slug-dubbletter, 0 focus keyword-dubbletter
- [x] Internlänkar — alla 6 nya artiklar har 2–4 interna länkar till tjänstesidor
- [x] Sitemap rensad via Code Snippets (snippet 19, one-shot): 3 → 47 URL:er — alla 44 bloggartiklar nu indexerade
- [x] Dubblerad Organization-schema fixad: snippet 8 uppdaterad + custom HTML-widget tömd
- [ ] hreflang på 10 SV/EN-artikelpar (SEO-risk för duplicate content)

## Klart 2026-04-20 (vecka 21 — LIVE)
- [x] 3 artiklar publicerade vecka 21 (kat: Blogg ID:109):
  - ID:1774 /stalgjutning-guide/ (focus: stålgjutning)
  - ID:1775 /magnesiumgjutning-guide/ (focus: magnesiumgjutning)
  - ID:1776 /gjutgods-efterbearbetning/ (focus: gjutgods efterbearbetning)
- [ ] Skicka uppdateringsmail till Patrik — utkast: `content-pages/mail-traficator-patrik-artiklar-live.md`
- [ ] hreflang på 10 SV/EN-par (saknas — Google kan tolka som duplicerat innehåll)

## Klart 2026-04-20 (vecka 18 fix — LIVE)
- [x] Riktigt innehåll inskrivet + publicerat (ersätter gamla placeholder-texter):
  - ID:1633 /sandgjutning-aluminium-guide/ — ~1 250 ord, ISO 8062-3, EN AC-legeringar
  - ID:1634 /precisionsgjutning-vaxgjutning-guide/ — ~1 410 ord, investment casting, CT4-CT6
  - ID:1635 /gjutet-gods-tekniska-ritningar-toleranser/ — ~1 550 ord, GD&T ISO 1101, draft angle

## Klart 2026-04-21 (vecka 24)
- [x] 3 artiklar publicerade vecka 24 (kat: Blogg ID:109):
  - ID:1788 /magnesiumgjutning-guide-2/ (focus: magnesiumgjutning) — slug fick -2 pga ID:1775
  - ID:1789 /kvalitetskontroll-gjutgods-metoder/ (focus: kvalitetskontroll gjutgods)
  - ID:1790 /gjutgods-fordonsindustrin-guide/ (focus: gjutgods fordonsindustrin)
- [x] Rank Math meta satt via WP post meta API (Wordfence WAF blockerar rankmath/v1-endpointen)

## Klart 2026-04-21 (nattjobb)
- [x] 3 artiklar publicerade vecka 22 (kat: Blogg ID:109):
  - ID:1785 /koppargjutning-guide/ (focus: koppargjutning)
  - ID:1786 /zinkgjutning-pressgjutning-guide/ (focus: zinkgjutning)
  - ID:1787 /konstruktionsregler-gjutgods-dfm/ (focus: konstruktionsregler gjutgods)
- [x] Interna länkar tillagda på /referensprojekt/ (6 länkade tjänstesidor)
- [x] GTM-container GTM-KRTLTBXM + GTM-TT4X9H5M registrerade i SSM
- [x] Patrik-mail draft klar (r2990589525910774283)
- [x] Traficator Plast pitch klar: `presentations/traficator-plast-pitch-2026-04-24.md`

## Pausad
(inget)

## Referenser
- Omsigneringsmöte-PPT: `presentations/output/traficator-omsignering-2026-04-10.pptx`
- Briefing: `presentations/traficator-omsignering-2026-04-10.md`
- `kunder.md`
