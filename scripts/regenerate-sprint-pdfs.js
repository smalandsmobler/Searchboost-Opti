/**
 * Regenererar sprint-PDFer 2026-04-22 med uppdaterad avslutningssektion.
 * Ny avslutning inkluderar:
 * - Rubrik: "Vi har jobbat hårt med era åtgärdsplaner..."
 * - Kontaktinfo: mikael@searchboost.se / 0728-63 42 79
 */

const puppeteer = require('/Users/weerayootandersson/Downloads/Searchboost-Opti/mcp-server-code/node_modules/puppeteer');
const fs = require('fs');
const path = require('path');

const OUT_DIR = '/Users/weerayootandersson/Downloads/Searchboost-Opti/presentations/sprint-pdf-2026-04-22';

// ─── Kunddata ─────────────────────────────────────────────────────────────────

const customers = [
  {
    id: 'humanpower',
    filename: 'humanpower-sprint-2026-04-22.pdf',
    name: 'Human Power',
    site: 'humanpower.se',
    kpis: [
      { value: '61', label: 'BACKLINKS' },
      { value: '17', label: 'DOMAIN RANK' },
      { value: '33/33', label: 'ARTIKLAR<br>INTERLINKADE' },
      { value: '4', label: 'JSON-LD BLOCKS<br><small style="color:#e91e8c">(VAR 0!)</small>' },
    ],
    tagline: 'Human Power — humanpower.se · Backlinks-audit klar (0 spam-domäner) · Schema markup verifierad',
    done: [
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'KRITISK SEO-fix',
        text: `Rank Math var installerat men emittade ingenting (0 JSON-LD, 0 OG, 0 meta description, 0 Twitter cards).
Hela sajten var SEO-osynlig. Snippet #24 läser nu rank_math_-meta direkt och emittar full schema-output:
4 JSON-LD blocks (Organization, WebSite, Article, BreadcrumbList) + 7 OG + 4 Twitter + meta description + canonical.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Interlinking',
        text: `Alla 33 artiklar har "Relaterade artiklar"-block med 3 ämnesmatchade länkar (retreat/samtal/stress/coaching/kost/själv/bi/holistisk) + landningssidor till /reboot/, /utvecklande-samtal/, /kosttillskott/.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'llms.txt expanderad',
        text: `328 → 3 334 bytes med retreat-aktiviteter, samtalstyper, kosttillskotts-serie, 15 top artiklar.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'robots.txt härdning',
        text: `Snippet #25 — Disallow cart, varukorg, kassan, my-account, ?s=, ?orderby=, ?filter_*, ?pa_*, feeds, xmlrpc. Allow Googlebot-Image på uploads.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Backlinks-audit',
        text: `0 spam-domäner identifierade.`,
      },
    ],
    next: [
      { prio: 'HÖG', title: 'Mer artiklar', text: 'Bara 33 artiklar — Reboot/utvecklande samtal/kosttillskott är högvolyms-niche. Mål: 100 artiklar inom 6 mån. 3 art/v ger 78 nya inom 6 mån.' },
      { prio: 'HÖG', title: 'YouTube-kanal med Anette Brink', text: 'Terapi/återhämtnings-content. Ingen reklamrestriktion. Hög CTR via video-rich-snippets.' },
      { prio: 'MEDEL', title: 'Lokala pages', text: '"Samtalspedagog [stad]" för 10 städer. Reboot Litauen finns redan.' },
      { prio: 'MEDEL', title: 'Backlink-outreach', text: 'DR 17 är lågt. Kontakta hälsobloggar, terapi-magasin, retreat-recensionssajter.' },
      { prio: 'MEDEL', title: 'HowTo schema på övningar', text: '"Andningsövningar mot ångest", "Mindfulness-övningar hemma" — rich snippet med stegvisa instruktioner.' },
      { prio: 'MEDEL', title: 'LinkedIn-strategi för Anette', text: 'Personal brand som samtalspedagog → driver leads till Reboot + samtal. 2 inlägg/v.' },
    ],
    potential: '500 → 3 000 besök/mån (6x på 12 mån). Värde: medel — lead-gen för dyra retreat-bokningar (~25k/person).',
  },
  {
    id: 'ilmonte',
    filename: 'ilmonte-sprint-2026-04-22.pdf',
    name: 'Ilmonte (Eventinredning)',
    site: 'ilmonte.se',
    kpis: [
      { value: '1 223', label: 'BACKLINKS<br><small style="color:#e91e8c">(NÄST FLEST)</small>' },
      { value: '34', label: 'DOMAIN RANK<br><small style="color:#e91e8c">(HÖGST!)</small>' },
      { value: '43/43', label: 'ARTIKLAR<br>INTERLINKADE' },
      { value: '773', label: 'SITEMAP URLER' },
    ],
    tagline: 'Ilmonte (Eventinredning) — ilmonte.se · Backlinks-audit klar (0 spam-domäner) · Schema markup verifierad',
    done: [
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Interlinking',
        text: `43 artiklar har "Relaterade artiklar"-block (scen/matta/event/belysning/textil/möbler/konferens/ridå/akustik) + landningssidor till /produkt-kategori/scenpodier/, /eventmobler/, /g-track/.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'BreadcrumbList JSON-LD',
        text: `Snippet #35 lägger till BreadcrumbList på alla posts.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'SEO-grund verifierad OK',
        text: `Sitemap (773 URLer, 8 sub), Rank Math fungerar (1 JSON-LD + 6 OG + canonical + meta desc), robots.txt härdad.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Backlinks-audit',
        text: `0 spam-domäner. 1 223 backlinks från 174 domäner — utmärkt profil!`,
      },
    ],
    next: [
      { prio: 'KRITISK', title: '🔴 RETENTION beslut 9 maj', text: 'Peter Vikström beslutar då om fortsatt samarbete. Förbered retention-pitch senast 5 maj.' },
      { prio: 'HÖG', title: 'Hacking-incident efterspel', text: 'Om ~4 118 casino spam-URLs är cleanade och GSC inte längre flaggar, kommer trafik dramatiskt tillbaka.' },
      { prio: 'MEDEL', title: 'Event-marknad push', text: 'PR till eventbloggar för "scenpodier", "eventpodium", "ridåskenor".' },
      { prio: 'MEDEL', title: 'B2B-katalog (PDF)', text: 'Hela sortimentet i nedladdningsbar PDF → backlinks från arrangörer.' },
      { prio: 'MEDEL', title: 'Konkurrent-backlink-analys', text: 'Vilka eventuthyrare rankar bäst? Hitta deras källor och replikera.' },
      { prio: 'LÅG', title: 'LocalBusiness schema med adress', text: 'Höjer relevans för lokala eventarrangörer.' },
    ],
    potential: '3 000 → 10 000 besök/mån (3.3x på 12 mån). Värde: hög — event-uthyrning ger 50-500k per evenemang.',
  },
  {
    id: 'jelmtech',
    filename: 'jelmtech-sprint-2026-04-22.pdf',
    name: 'Jelmtech',
    site: 'jelmtech.se',
    kpis: [
      { value: '314', label: 'BACKLINKS' },
      { value: '21', label: 'DOMAIN RANK' },
      { value: '64/64', label: 'ARTIKLAR<br>INTERLINKADE' },
      { value: '4', label: 'JSON-LD BLOCKS<br><small style="color:#e91e8c">(VAR 0!)</small>' },
    ],
    tagline: 'Jelmtech — jelmtech.se · Backlinks-audit klar (0 spam-domäner) · Schema markup verifierad',
    done: [
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'KRITISK sitemap-fix',
        text: `/sitemap.xml gjorde 301-redirect till /wp-sitemap.xml som 404:ade — det här var BOVEN i GSC-felmeddelanden. Ny snippet #26 redirectar nu till /sitemap_index.xml (200 OK).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'KRITISK SEO-head-fix',
        text: `Rank Math emittade 0 JSON-LD, ofullständiga OG (1 tag), ingen canonical. Snippet #25 emittar nu full output: 4 JSON-LD blocks + 7 OG + 4 Twitter + canonical.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Interlinking',
        text: `64 artiklar har "Relaterade artiklar"-block med ämnesmatching (plast/prototyp/formsprut/design/material/mekanisk/kvalitet/hållbar/overmould/cert).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'robots.txt omskriven',
        text: `Snippet #27 + endpoint /sbs/v1/write-robots: nya regler för crawl budget, pekar på korrekt sitemap.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'llms.txt expanderad',
        text: `~700 → 3 162 bytes med produktutveckling-tjänster, 15 top artiklar, kontaktinfo.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Backlinks-audit',
        text: `0 spam-domäner. 314 backlinks från 201 unika domäner — bra spridning.`,
      },
    ],
    next: [
      { prio: 'HÖG', title: 'B2B-fokuserade case studies', text: 'Konvertera Swedish Match-projekt m.fl. till SEO-rich case studies med teknisk djup-analys.' },
      { prio: 'HÖG', title: 'Programmatisk material × tillverkningsteknik', text: '"PA6 + formsprutning", "PC + vakuumgjutning" osv. ~40 sidor med hög teknisk vikt.' },
      { prio: 'MEDEL', title: 'Industri-rapporter (gratis nedladdningsbara)', text: '"Plastkonstruktion 2026: trender". Genererar leads + backlinks från industri-press.' },
      { prio: 'MEDEL', title: 'YouTube — process-videor', text: 'Visuella videor från Ängelholm-verkstaden. Hög delningsgrad i tekniska forum.' },
      { prio: 'LÅG', title: 'Article schema med technicalArticle-subtyp', text: 'Rank Math stöder. Förbättrar relevans i Google för B2B-sökare.' },
      { prio: 'LÅG', title: 'Author markup', text: 'Carl-Fredrik Emilsson som expert på industridesign → E-A-T-boost.' },
    ],
    potential: '1 000 → 4 000 besök/mån (4x på 12 mån). Värde: hög — B2B-leads kan vara 100k+ per kund.',
  },
  {
    id: 'mobelrondellen',
    filename: 'mobelrondellen-sprint-2026-04-22.pdf',
    name: 'Möbelrondellen',
    site: 'mobelrondellen.se',
    kpis: [
      { value: '922', label: 'BACKLINKS' },
      { value: '15', label: 'DOMAIN RANK' },
      { value: '32/32', label: 'ARTIKLAR<br>INTERLINKADE' },
      { value: '157', label: 'YOAST→RM<br>META-RADER' },
    ],
    tagline: 'Möbelrondellen — mobelrondellen.se · Backlinks-audit klar (0 spam-domäner) · Schema markup verifierad',
    done: [
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Interlinking',
        text: `32 artiklar har "Relaterade artiklar"-block (sovrum/kök/vardagsrum/utomhus/förvaring/barn/hall/inredning) + landningssidor till /butik/, /produkt-kategori/sovrum/, /vardagsrum/.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Article + BreadcrumbList JSON-LD',
        text: `Snippet #124 emittar Article + BreadcrumbList på alla posts (Rank Math var blockerad av snippet #64).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Yoast → Rank Math meta-migration',
        text: `Snippet #125 ONE-SHOT — alla 157 Yoast-meta-rader kopierade till rank_math_*. Snippet #126 registrerar fält i REST API. Yoast plugin är inactive — kan raderas.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Rank Math emittar nu fullt schema',
        text: `Verifierat: home + articles ger Article + Person + Organization + ImageObject + WebPage + BreadcrumbList + ListItem (~7 schema-typer per artikelsida).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'SEO-grund verifierad OK',
        text: `Sitemap (/wp-sitemap.xml WP core), llms.txt 2 872 chars, robots.txt redan härdad.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Backlinks-audit',
        text: `0 spam-domäner. 922 backlinks från 59 domäner.`,
      },
    ],
    next: [
      { prio: 'HÖG', title: 'Lokala SEO-pages', text: '"Möbler Mora", "Möbler Rättvik", "Älvdalen" osv. MR är familjeägd 1990 = stark lokal-story.' },
      { prio: 'HÖG', title: 'Inredningsguider per rum × stil', text: '"Skandinavisk vardagsrum", "Industriell sovrum" etc. Långa-tail keywords med köp-intention.' },
      { prio: 'MEDEL', title: 'Varumärkes-sidor', text: 'Perfect Brands plugin är installerad men kan utnyttjas mer.' },
      { prio: 'MEDEL', title: 'YouTube room-tours', text: 'Visa hur möblerna ser ut i hem-miljö.' },
      { prio: 'KRÄVER GODKÄNNANDE', title: 'Permalink-migration /YYYY/MM/DD/slug/ → /%postname%/', text: 'Mattias måste godkänna (bryter befintliga länkar utan 301).' },
      { prio: 'KUND-AKTION', title: 'Mattias: ladda upp leverantörsbilder som kategori-thumbnails', text: 'Matmöbler, sängar etc. Visuellt lyft på kategorisidor.' },
    ],
    potential: '2 000 → 8 000 besök/mån (4x på 12 mån). Värde: medel — e-handel + lokal trafik till butik i Mora.',
  },
  {
    id: 'nordicsnusonline',
    filename: 'nordicsnusonline-sprint-2026-04-22.pdf',
    name: 'Nordic Snus Online',
    site: 'nordicsnusonline.com',
    kpis: [
      { value: '48', label: 'BACKLINKS' },
      { value: '9', label: 'DOMAIN RANK<br><small style="color:#e91e8c">(LÄGST)</small>' },
      { value: '44/44', label: 'ARTIKLAR<br>INTERLINKADE' },
      { value: '70 öre', label: 'PROVISION PER<br>DOSA' },
    ],
    tagline: 'Nordic Snus Online — nordicsnusonline.com · Backlinks-audit klar (0 spam-domäner) · Schema markup verifierad',
    done: [
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Interlinking',
        text: `44 SEO-artiklar har "Relaterade artiklar"-block (nikotin/vit/styrka/recension/guide/lag) + landningssidor /sv/snus/all-white/, /sv/snus/nicotine-free/, /sv/varumarken/.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Mötesunderlag fredag 25 april klart',
        text: `Komplett strategi-doc — 14 spår indelade i SEO på steroider, content marketing, LinkedIn, email/loyalty. Pris/effort-matris och konkret sprint-paket.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'SEO-grund verifierad OK',
        text: `Sitemap (434 URLer, 7 sub), robots.txt redan härdad, Rank Math emittar full schema + 13 OG, llms.txt auto-genererad, multilingual Polylang SV/EN, GA4 G-Z9R3KK4V5Y aktiv.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Backlinks-audit',
        text: `0 spam-domäner. DR 9 är lågt — länkbygge är prio.`,
      },
    ],
    next: [
      { prio: 'HÖG', title: 'Programmatisk SEO för varumärken × styrkor', text: '50 brands × 4 styrkor (3/6/10/20mg) = 200 nya sidor. Förväntad +15-30k besök/mån.' },
      { prio: 'HÖG', title: 'Jämförelsesidor', text: '"Zyn vs Velo", "Bästa starka nikotinpåsar 2026". 20-30 sidor med köp-intention.' },
      { prio: 'MEDEL', title: 'YouTube-kanal med produktrecensioner', text: '1 video/vecka. Inga ad-restriktioner på organisk YouTube-sök.' },
      { prio: 'HÖG', title: 'Email marketing (opt-in 18+)', text: 'Sverige tillåter. Veckonyhetsbrev → 3-8x bättre konvertering än cold outreach.' },
      { prio: 'MEDEL', title: 'Subscription-modell', text: 'Auto-leverans var 2/4/6 vecka. Highest LTV i e-handel (~5x engångsköp).' },
      { prio: 'MEDEL', title: 'LinkedIn — CEO personal brand', text: 'Personlig auktoritet i nikotin-branschen → spillover till varumärket.' },
      { prio: 'KRITISK', title: '🚨 BLOCKER: Code Snippets-perms', text: 'SSM-användaren mikael (id 192) har customer-roll, inte admin. Be Nordic Snus återställa rollen till Administrator.' },
    ],
    potential: '15 000 → 50 000 besök/mån (3.3x på 12 mån). Värde: linjär — provision 70 öre × dosor.',
  },
  {
    id: 'smk',
    filename: 'smk-sprint-2026-04-22.pdf',
    name: 'Smålands Kontorsmöbler',
    site: 'smalandskontorsmobler.se',
    kpis: [
      { value: '1 177', label: 'BACKLINKS' },
      { value: '33', label: 'DOMAIN RANK' },
      { value: '71/71', label: 'ARTIKLAR<br>INTERLINKADE' },
      { value: '5 474B', label: 'LLMS.TXT UTÖKAD' },
    ],
    tagline: 'Smålands Kontorsmöbler — smalandskontorsmobler.se · Backlinks-audit klar (0 spam-domäner) · Schema markup verifierad',
    done: [
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Interlinking',
        text: `Alla 71 artiklar har "Relaterade artiklar"-block med 3 ämnesmatchade länkar + 3 kategorilänkar.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'SEO-accordion på kategorisidor',
        text: `SEO-text döljs under "Läs mer om [kategori]"-knapp i bronsgrön outline-stil. SEO-säkert (text i DOM).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Köp-knappar olivgröna',
        text: `Förenade köpknappen i SMK-olivgrön (#3d4f3b) med bronsskugga. Force-aktiverat på alla produktarkiv (Flatsome customizer hade gömt dem).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Premium produktbild-CSS',
        text: `Beige gradient-bakgrund + mix-blend-mode för transparenta bilder + hover-lyft 4%. Enhetligt utseende på alla produktkort.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Lagervara + leveranstid 2-3 dagar',
        text: `Enhetlig pil-rad under priset på alla produkter. Leveranstid bulk-uppdaterad till 2-3 dagar (25 produkter med avvikande värden).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Schema markup',
        text: `ContactPage + AboutPage JSON-LD på /kontakt/ och /om-oss/. Article + BreadcrumbList på alla artiklar.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'robots.txt härdning',
        text: `Crawl budget-regler: blockerar cart, checkout, my-account, ?s=, ?orderby=, ?filter_*, feeds, xmlrpc.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'llms.txt expanderad',
        text: `1 017 → 5 474 bytes med fullständigt produktkategori-träd (sittmöbler, bord, förvaring, belysning) + 15 top guides + landningssidor.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'CSS-skydd från optimerare',
        text: `Snippet #176 flyttar inline CSS från 7 sidors content till wp_head så autonomous-optimizer inte rör dem.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'JS-läcka borttagen',
        text: `Tog bort 2 671 chars JS-kod som låg som plain text på startsidan (bröt slideshow).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Slideshow-fix',
        text: `Dubbla slideshow-skript orsakade halv-transition. Tog bort dubblett — nu smooth 5,5s autoplay.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'GSC sitemap submit',
        text: `sitemap_index.xml inskickad — 1 093 URLer indexerade av Google.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Backlinks-audit',
        text: `0 spam-domäner identifierade — ingen disavow behövs.`,
      },
    ],
    next: [
      { prio: 'HÖG', title: 'Programmatisk SEO för möbelvarumärken', text: 'Skapa 50 brands × 9 kategorier = 450 nya programmatiska sidor. Sprint 1: top 10 brands (90 sidor) under v18.' },
      { prio: 'HÖG', title: 'Lokala SEO-pages', text: '"Kontorsmöbler [stad]" för 30 svenska städer. Långa-tail keywords med köp-intention.' },
      { prio: 'MEDEL', title: 'FAQPage schema på top 50 produkter', text: 'Rank Math-genererat. Ger rich snippet i SERP. Förväntad CTR-lyft +15-25%.' },
      { prio: 'MEDEL', title: 'Snippets-konsolidering', text: 'Radera 130+ inaktiva ONE-SHOT-snippets. Strömlinjeforma kodbas.' },
      { prio: 'MEDEL', title: 'AI bilduppdatering', text: 'rembg-batch på alla produktbilder — transparent bakgrund = professionellt.' },
      { prio: 'LÅG', title: 'Author markup på guider', text: 'Mikael Nilsson + Searchboost → E-A-T-boost för B2B-guides.' },
    ],
    potential: '500 → 5 000 besök/mån (10x på 12 mån). Värde: hög — B2B-kunder med stora ordrar.',
  },
  {
    id: 'tobler',
    filename: 'tobler-sprint-2026-04-22.pdf',
    name: 'Tobler Ställningsprodukter',
    site: 'tobler.se',
    kpis: [
      { value: '33', label: 'BACKLINKS<br><small style="color:#e91e8c">(LÄGST!)</small>' },
      { value: '19', label: 'DOMAIN RANK' },
      { value: '13/13', label: 'ARTIKLAR<br>INTERLINKADE' },
      { value: '213', label: 'SITEMAP URLER' },
    ],
    tagline: 'Tobler Ställningsprodukter — tobler.se · Backlinks-audit klar (0 spam-domäner) · Schema markup verifierad',
    done: [
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Interlinking',
        text: `13 artiklar har "Relaterade artiklar"-block (ställning/tak/form/väder/besiktning/köp/trapp/planera) + landningssidor till /produkt-kategori/byggstallningar/, /fallskydd-taksakerhet/, /formsystem/.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'BreadcrumbList JSON-LD',
        text: `Snippet #53 lägger till BreadcrumbList på alla posts.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Duplicate H1 fixad',
        text: `Artikel byggstalning-sakerhetskrav-afs-2013-4 hade 2 H1. Content-H1 borttagen.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'robots.txt härdning',
        text: `Snippet #52 — crawl budget-regler.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'SEO-grund verifierad OK',
        text: `Sitemap (213 URLer), Rank Math emittar JSON-LD + 7 OG + meta desc + canonical, llms.txt 1 671 chars.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Backlinks-audit',
        text: `0 spam-domäner. 33 backlinks är dock LÅGT — länkbygge är PRIORITERAT.`,
      },
    ],
    next: [
      { prio: 'HÖG', title: 'Branschmedia-outreach', text: 'Byggvärlden, Building Sweden. 5-10 backlinks från auktoritativa byggmagasin = stort lyft för DR.' },
      { prio: 'HÖG', title: 'AFS 2013:4 + säkerhetsguider — push hårdare', text: 'Tobler har content. Outreach till säkerhetsblogger + byggsäkerhetsforum.' },
      { prio: 'MEDEL', title: 'YouTube — montagevideor', text: 'Visuell SEO för byggsökare. Frostenäs-bröderna kan visa 40 års erfarenhet.' },
      { prio: 'MEDEL', title: 'Lokala landningssidor', text: '"Byggställning Stockholm", "Byggställning Halmstad" osv. ~10 städer.' },
      { prio: 'LÅG', title: 'Author markup — E-A-T', text: 'Frostenäs-bröderna (40 års erfarenhet) → auktoritets-boost.' },
      { prio: 'FRAMTID', title: 'Google Ads-tillägg', text: 'Föreslå när budget tillåter. Köp-intention för "köpa byggställning" är hög.' },
    ],
    potential: '500 → 3 000 besök/mån (6x på 12 mån). Värde: hög — B2B-kunder är 50-200k per deal.',
  },
  {
    id: 'traficator',
    filename: 'traficator-sprint-2026-04-22.pdf',
    name: 'Traficator',
    site: 'traficator.se',
    kpis: [
      { value: '144', label: 'BACKLINKS' },
      { value: '18', label: 'DOMAIN RANK' },
      { value: '53/53', label: 'ARTIKLAR<br>INTERLINKADE' },
      { value: '99', label: 'SITEMAP URLER' },
    ],
    tagline: 'Traficator — traficator.se · Backlinks-audit klar (0 spam-domäner) · Schema markup verifierad',
    done: [
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'Interlinking',
        text: `53 artiklar har "Relaterade artiklar"-block med ämnesmatching (press/sand/centrifugal/precision/koppar/zink/aluminium/CNC/smide/magnesium).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'BreadcrumbList JSON-LD',
        text: `Snippet #35 lägger till BreadcrumbList på alla posts (Rank Math hade på home men inte artiklar).`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'llms.txt expanderad',
        text: `Med alla gjuttjänster, referensprojekt, 15 top artiklar och Traficator Plast-notering.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'robots.txt härdning',
        text: `Snippet #34 — crawl budget-regler.`,
      },
      {
        badge: 'KLART',
        badgeClass: 'badge-done',
        title: 'SEO-grund verifierad OK',
        text: `Sitemap (Rank Math, 99 URL), Rank Math emittar full schema, hreflang SV/EN aktiv (snippet #33).`,
      },
    ],
    next: [
      { prio: 'HÖG', title: 'Traficator Plast spin-off-sajt', text: 'Blå hav-keywords för avfallskorgar/hundlatriner. Pitch presenteras 24 april.' },
      { prio: 'HÖG', title: 'Engelska sidor (Polylang)', text: 'Internationella sourcing-kunder. Utöka EN-content beyond startsida.' },
      { prio: 'MEDEL', title: 'Material × användning-matris', text: '"Mässing + vägg-applikationer", "Aluminium + lättvikts-detaljer" etc.' },
      { prio: 'MEDEL', title: 'Branschsidor per industri', text: 'Fordon, vitvaror, möbler, marin osv. Talar till beställares språk.' },
      { prio: 'LÅG', title: 'Service-page schema per gjuttjänst', text: 'Rich result-möjligheter.' },
    ],
    potential: '1 500 → 6 000 besök/mån (4x på 12 mån). Värde: hög — B2B sourcing-deals kan vara 500k+.',
  },
];

// ─── HTML Template ─────────────────────────────────────────────────────────────

function prioBadge(prio) {
  const map = {
    'HÖG': '#e91e8c',
    'KRITISK': '#c62828',
    'MEDEL': '#0277bd',
    'LÅG': '#558b2f',
    'FRAMTID': '#6a1b9a',
    'KRÄVER GODKÄNNANDE': '#ef6c00',
    'KUND-AKTION': '#ef6c00',
  };
  const color = map[prio] || '#555';
  return `<span style="background:${color};color:#fff;padding:2px 8px;border-radius:3px;font-size:10px;font-weight:700;white-space:nowrap">${prio}</span>`;
}

function buildHTML(c) {
  const kpiCards = c.kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-label">${k.label}</div>
    </div>
  `).join('');

  const doneItems = c.done.map(d => `
    <div class="done-item">
      <div class="done-header">
        <span class="badge">${d.badge}</span>
        <strong>${d.title}</strong>
      </div>
      <p>${d.text}</p>
    </div>
  `).join('');

  const nextRows = c.next.map(n => `
    <tr>
      <td>${n.title}</td>
      <td style="text-align:center">${prioBadge(n.prio)}</td>
    </tr>
    <tr class="next-desc">
      <td colspan="2">${n.text}</td>
    </tr>
  `).join('');

  const doneSummary = c.done.map(d =>
    `<li><strong>${d.title}</strong> — ${d.text.substring(0, 120)}${d.text.length > 120 ? '…' : ''}</li>`
  ).join('');

  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="UTF-8">
<title>${c.name} — Sprint-aktiviteter</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 12px;
    color: #1a1a1a;
    background: #fff;
    line-height: 1.5;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 16mm 18mm 16mm 18mm;
    page-break-after: always;
  }
  .page:last-child { page-break-after: auto; }

  /* Header */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 3px solid #e91e8c;
    padding-bottom: 10px;
    margin-bottom: 16px;
  }
  .header-left h1 {
    font-size: 20px;
    font-weight: 800;
    color: #1a1a1a;
    line-height: 1.1;
  }
  .header-left .subtitle {
    font-size: 11px;
    color: #666;
    margin-top: 2px;
  }
  .header-right {
    text-align: right;
    font-size: 10px;
    color: #888;
  }
  .logo-text {
    font-size: 14px;
    font-weight: 800;
    color: #e91e8c;
    letter-spacing: -0.5px;
  }

  /* Section title */
  .section-title {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #e91e8c;
    margin: 16px 0 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid #f0f0f0;
  }

  /* KPI grid */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    margin-bottom: 8px;
  }
  .kpi-card {
    background: #fafafa;
    border: 1px solid #eee;
    border-top: 3px solid #e91e8c;
    padding: 10px;
    text-align: center;
    border-radius: 4px;
  }
  .kpi-value {
    font-size: 22px;
    font-weight: 800;
    color: #1a1a1a;
    line-height: 1.1;
  }
  .kpi-label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    color: #666;
    margin-top: 4px;
    letter-spacing: 0.3px;
  }
  .tagline {
    font-size: 10px;
    color: #888;
    text-align: center;
    margin-top: 6px;
    padding: 6px 10px;
    background: #fafafa;
    border-radius: 3px;
    border: 1px solid #eee;
  }

  /* Done items */
  .done-item {
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #f5f5f5;
  }
  .done-item:last-child { border-bottom: none; }
  .done-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 3px;
  }
  .done-header strong { font-size: 12px; }
  .badge {
    background: #e8f5e9;
    color: #2e7d32;
    font-size: 9px;
    font-weight: 700;
    padding: 2px 7px;
    border-radius: 3px;
    white-space: nowrap;
  }
  .done-item p {
    font-size: 11px;
    color: #444;
    padding-left: 57px;
  }

  /* Next sprint table */
  table.next-table {
    width: 100%;
    border-collapse: collapse;
  }
  table.next-table td {
    padding: 5px 8px;
    font-size: 11px;
    vertical-align: top;
  }
  table.next-table tr:nth-child(4n+1) { background: #fafafa; }
  table.next-table tr:nth-child(4n+3) { background: #fafafa; }
  tr.next-desc td {
    color: #555;
    font-size: 10.5px;
    padding-top: 1px;
    padding-bottom: 6px;
    border-bottom: 1px solid #f0f0f0;
  }

  /* Potential box */
  .potential-box {
    background: #1a1a1a;
    color: #fff;
    padding: 12px 16px;
    border-radius: 4px;
    margin-top: 12px;
    font-size: 11px;
  }
  .potential-box .label {
    font-size: 9px;
    font-weight: 700;
    text-transform: uppercase;
    color: #e91e8c;
    letter-spacing: 1px;
    margin-bottom: 5px;
  }

  /* Summary list */
  .summary-section {
    margin-top: 12px;
  }
  .summary-section h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #e91e8c;
    margin-bottom: 8px;
  }
  .summary-section ul {
    list-style: none;
    padding: 0;
  }
  .summary-section li {
    font-size: 10.5px;
    color: #333;
    padding: 4px 0 4px 12px;
    border-left: 2px solid #e91e8c;
    margin-bottom: 5px;
    line-height: 1.4;
  }

  /* NEW: Closing section */
  .closing-section {
    margin-top: 24px;
    padding: 18px 20px;
    background: #fff8fb;
    border: 1px solid #f8bbd0;
    border-left: 4px solid #e91e8c;
    border-radius: 4px;
  }
  .closing-section .closing-headline {
    font-size: 13px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 10px;
    line-height: 1.4;
  }
  .closing-section .closing-contact {
    font-size: 11.5px;
    color: #444;
    padding: 10px 14px;
    background: #fff;
    border-radius: 3px;
    border: 1px solid #eee;
    display: inline-block;
    margin-top: 2px;
  }
  .closing-section .closing-contact a {
    color: #e91e8c;
    text-decoration: none;
    font-weight: 600;
  }

  /* Footer */
  .footer {
    position: fixed;
    bottom: 10mm;
    left: 18mm;
    right: 18mm;
    font-size: 9px;
    color: #aaa;
    display: flex;
    justify-content: space-between;
    border-top: 1px solid #eee;
    padding-top: 4px;
  }
  @media print {
    .footer { position: fixed; }
  }
</style>
</head>
<body>

<!-- PAGE 1: Status + Gjort -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>${c.name}</h1>
      <div class="subtitle">Sprint-rapport 2026-04-22</div>
    </div>
    <div class="header-right">
      <div class="logo-text">Searchboost</div>
      <div>searchboost.se</div>
    </div>
  </div>

  <div class="section-title">1 Status idag</div>
  <div class="kpi-grid">${kpiCards}</div>
  <div class="tagline">${c.tagline}</div>

  <div class="section-title">2 Vad vi har gjort 22 april</div>
  ${doneItems}
</div>

<!-- PAGE 2: Sprint härnäst + Potential -->
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>${c.name}</h1>
      <div class="subtitle">${c.name} — sprint-aktiviteter</div>
    </div>
    <div class="header-right">
      <div class="logo-text">Searchboost</div>
      <div>searchboost.se</div>
    </div>
  </div>

  <div class="section-title">3 Sprint-aktiviteter härnäst</div>
  <table class="next-table">
    <thead>
      <tr>
        <th style="text-align:left;padding:4px 8px;font-size:10px;color:#888;font-weight:600;border-bottom:1px solid #eee">Aktivitet</th>
        <th style="text-align:center;padding:4px 8px;font-size:10px;color:#888;font-weight:600;border-bottom:1px solid #eee">Prio</th>
      </tr>
    </thead>
    <tbody>${nextRows}</tbody>
  </table>

  <div class="section-title">4 Tillväxtpotential 12 månader</div>
  <div class="potential-box">
    <div class="label">Uppskattad potential</div>
    ${c.potential}
  </div>

  <!-- NEW CLOSING SECTION -->
  <div class="closing-section">
    <div class="closing-headline">Vi har jobbat hårt med era åtgärdsplaner och har nu även identifierat och implementerat dessa utvecklingsfaktorer.</div>
    <div class="closing-contact">
      Har du frågor? Kontakta oss på <a href="mailto:mikael@searchboost.se">mikael@searchboost.se</a> eller <strong>0728-63 42 79</strong>
    </div>
  </div>

  <!-- Summary -->
  <div class="summary-section">
    <h3>Detta har vi gjort</h3>
    <ul>${doneSummary}</ul>
  </div>
</div>

<div class="footer">
  <span>Searchboost · mikael@searchboost.se · searchboost.se</span>
  <span>Sprint-rapport 2026-04-22</span>
</div>

</body>
</html>`;
}

// ─── Generate PDFs ─────────────────────────────────────────────────────────────

async function generateAll() {
  console.log('Startar Puppeteer...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const tmpDir = '/tmp/sprint-html-2026';
  fs.mkdirSync(tmpDir, { recursive: true });

  for (const c of customers) {
    console.log(`Genererar: ${c.name}...`);
    const html = buildHTML(c);
    const htmlPath = path.join(tmpDir, `${c.id}.html`);
    fs.writeFileSync(htmlPath, html, 'utf8');

    const page = await browser.newPage();
    await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });
    await page.emulateMediaType('print');

    const outPath = path.join(OUT_DIR, c.filename);
    await page.pdf({
      path: outPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });

    await page.close();
    const stat = fs.statSync(outPath);
    console.log(`  OK: ${c.filename} (${Math.round(stat.size / 1024)} KB)`);
  }

  await browser.close();
  console.log('\nAlla 8 PDFer genererade!');
  console.log(`Sparade i: ${OUT_DIR}`);
}

generateAll().catch(err => {
  console.error('FEL:', err);
  process.exit(1);
});
