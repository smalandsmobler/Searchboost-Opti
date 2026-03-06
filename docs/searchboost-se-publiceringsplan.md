# Searchboost.se — Komplett publiceringsplan
> Skapad: 2026-02-19 | Status: Redo att köra när Loopia-hosting är uppe

---

## Vad vi har färdigt att publicera

### 📁 Tjänstesidor (3 st) — `content-pages/tjanster/`
| Fil | URL på searchboost.se | Status |
|-----|----------------------|--------|
| `lokal-seo.html` | `/tjanster/lokal-seo/` | ✅ Klar |
| `e-handel-seo.html` | `/tjanster/e-handel-seo/` | ✅ Klar |
| `seo-audit-tjanst.html` | `/tjanster/seo-audit/` | ✅ Klar |

### 📚 SEO-skolan (23 artiklar) — `content-pages/seo-skola/`
| Fil | URL | Status |
|-----|-----|--------|
| `vad-ar-seo.html` | `/seo-skola/vad-ar-seo/` | ✅ Klar |
| `hur-fungerar-google.html` | `/seo-skola/hur-fungerar-google/` | ✅ Klar |
| `rankingfaktorer.html` | `/seo-skola/rankingfaktorer/` | ✅ Klar |
| `nyckelordsforskning.html` | `/seo-skola/nyckelordsforskning/` | ✅ Klar |
| `teknisk-seo.html` | `/seo-skola/teknisk-seo/` | ✅ Klar |
| `title-meta-description.html` | `/seo-skola/title-meta-description/` | ✅ Klar |
| `interna-lankar.html` | `/seo-skola/interna-lankar/` | ✅ Klar |
| `lankbygge.html` | `/seo-skola/lankbygge/` | ✅ Klar |
| `lokal-seo.html` | `/seo-skola/lokal-seo/` | ✅ Klar |
| `lokala-citationer.html` | `/seo-skola/lokala-citationer/` | ✅ Klar |
| `google-business-profile.html` | `/seo-skola/google-business-profile/` | ✅ Klar |
| `google-search-console.html` | `/seo-skola/google-search-console/` | ✅ Klar |
| `page-speed-core-web-vitals.html` | `/seo-skola/page-speed-core-web-vitals/` | ✅ Klar |
| `mobile-seo.html` | `/seo-skola/mobile-seo/` | ✅ Klar |
| `schema-markup.html` | `/seo-skola/schema-markup/` | ✅ Klar |
| `content-gaps.html` | `/seo-skola/content-gaps/` | ✅ Klar |
| `domain-authority.html` | `/seo-skola/domain-authority/` | ✅ Klar |
| `seo-texter.html` | `/seo-skola/seo-texter/` | ✅ Klar |
| `seo-strategi-smaforetag.html` | `/seo-skola/seo-strategi-smaforetag/` | ✅ Klar |
| `seo-rapportering.html` | `/seo-skola/seo-rapportering/` | ✅ Klar |
| `seo-vs-sem.html` | `/seo-skola/seo-vs-sem/` | ✅ Klar |
| `hur-lang-tid-tar-seo.html` | `/seo-skola/hur-lang-tid-tar-seo/` | ✅ Klar |
| `vad-kostar-seo.html` | `/seo-skola/vad-kostar-seo/` | ✅ Klar |
| `varfor-seo-2026.html` | `/seo-skola/varfor-seo-2026/` | ✅ Klar |
| `wordpress-seo.html` | `/seo-skola/wordpress-seo/` | ✅ Klar |

### 📍 Lokala sidor (7 städer) — `content-pages/lokala/`
| Fil | URL | Status |
|-----|-----|--------|
| `seo-byra-jonkoping.html` | `/seo-byra-jonkoping/` | ✅ Klar |
| `seo-byra-vaxjo.html` | `/seo-byra-vaxjo/` | ✅ Klar |
| `seo-byra-kalmar.html` | `/seo-byra-kalmar/` | ✅ Klar |
| `seo-byra-linkoping.html` | `/seo-byra-linkoping/` | ✅ Klar |
| `seo-byra-halmstad.html` | `/seo-byra-halmstad/` | ✅ Klar |
| `seo-byra-norrkoping.html` | `/seo-byra-norrkoping/` | ✅ Klar |
| `seo-byra-varnamo.html` | `/seo-byra-varnamo/` | ✅ Klar |

### 📁 Case studies (3 st) — `content-pages/case-studies/`
| Fil | URL | Status |
|-----|-----|--------|
| `ehandel-kontorsmobler.html` | `/case-studies/ehandel-kontorsmobler/` | ✅ Klar |
| `konsultforetag-seo.html` | `/case-studies/konsultforetag-seo/` | ✅ Klar |
| `mobelforetag-smaland.html` | `/case-studies/mobelforetag-smaland/` | ✅ Klar |

### 📖 Övriga sidor
| Fil | URL | Status |
|-----|-----|--------|
| `faq/vanliga-fragor.html` | `/faq/` | ✅ Klar |
| `ordlista/seo-ordlista.html` | `/ordlista/seo-ordlista/` | ✅ Klar |

**TOTALT: 41 sidor redo att publicera**

---

## WordPress-struktur att sätta upp

### Sidtyper i WordPress
```
searchboost.se/
├── (Startsida — befintlig eller ny)
├── tjanster/                    ← Sida "Tjänster" (förälder)
│   ├── lokal-seo/
│   ├── e-handel-seo/
│   └── seo-audit/
├── seo-skola/                   ← Sida "SEO-skolan" (förälder)
│   ├── vad-ar-seo/
│   ├── hur-fungerar-google/
│   └── ... (22 fler)
├── seo-byra-jonkoping/          ← Root-nivå (lokala sidor)
├── seo-byra-vaxjo/
├── seo-byra-kalmar/
├── seo-byra-linkoping/
├── seo-byra-halmstad/
├── seo-byra-norrkoping/
├── seo-byra-varnamo/
├── case-studies/                ← Sida "Resultat" (förälder)
│   ├── ehandel-kontorsmobler/
│   ├── konsultforetag-seo/
│   └── mobelforetag-smaland/
├── faq/
└── ordlista/
    └── seo-ordlista/
```

### WP Permalinks
Inställning: `/%postname%/` (viktigt — gör det FÖRST)

### Rank Math — per sida
- Title: redan optimerad i HTML `<title>`
- Meta description: redan i HTML `<meta name="description">`
- Schema: redan som JSON-LD i varje sida
- Inget extraarbete behövs — kopiera bara in

---

## Publiceringsprocess — steg för steg

### Förutsättning: WordPress installerat på searchboost.se (Loopia)

### Steg 1 — WordPress grundsetup (30 min)
- [ ] Installera WordPress via Loopia (Softaculous)
- [ ] Permalinks → `/%postname%/`
- [ ] Installera plugins: Rank Math SEO, WP Rocket (eller LiteSpeed Cache), Wordfence
- [ ] Aktivera SSL (Let's Encrypt via Loopia)
- [ ] Tema: Minimalistiskt (GeneratePress eller Kadence)

### Steg 2 — Ersätt `{{DOMAIN}}` (5 min, terminal)
```bash
# Ersätt platshållare i alla HTML-filer
find /Users/weerayootandersson/Downloads/Searchboost-Opti/content-pages -name "*.html" \
  -exec sed -i '' 's|{{DOMAIN}}|https://searchboost.se|g' {} \;
```

### Steg 3 — Publicera via WP REST API (automatiserat)
Vi har en script-mall som POSTar alla sidor via API:
```bash
# WP App Password genereras i WP-admin → Profil → Application Passwords
WP_URL="https://searchboost.se"
WP_USER="mikael@searchboost.se"
WP_PASS="xxxx xxxx xxxx xxxx xxxx xxxx"

# Script publicerar alla 41 sidor automatiskt
node scripts/publish-to-wp.js
```

### Steg 4 — Verifiera (15 min)
- [ ] Kontrollera 5 slumpmässiga sidor i browser
- [ ] Google Rich Results Test på en tjänstsida + en SEO-skola-artikel
- [ ] PageSpeed Insights på startsidan
- [ ] Kolla att alla interna länkar fungerar

### Steg 5 — Google Search Console (10 min)
- [ ] Verifiera searchboost.se i GSC (om ej gjort)
- [ ] Skicka in sitemap.xml
- [ ] Begär indexering av startsida + tjänstesidor

---

## Script att skriva: publish-to-wp.js

Vi behöver ett litet Node.js-script som:
1. Läser alla HTML-filer från `content-pages/`
2. Extraherar title + content från varje fil
3. POSTar till `/wp-json/wp/v2/pages` med rätt slug + parent
4. Loggar vilka som lyckades / misslyckades

**Status: Ska skapas (30 min)**

---

## Nästa steg (blockerare)

| Blockerare | Vad behövs | Vem |
|-----------|-----------|-----|
| Loopia-hosting uppe | Loopia-konto aktivt + WordPress installerat | Mikael |
| WP App Password | Generera i WP-admin | Mikael |
| publish-to-wp.js | Vi skriver scriptet nu | Claude |

---

## Vad vi gör MEDAN vi väntar på Loopia

1. ✅ Skriva `publish-to-wp.js`-scriptet
2. ✅ Ersätta `{{DOMAIN}}` i alla filer
3. ✅ Kontrollera att alla 41 sidor är kompletta
4. ✅ Förbereda Rank Math-inställningar

*Så fort Loopia är uppe → kör vi scriptet → 41 sidor live på en timme.*
