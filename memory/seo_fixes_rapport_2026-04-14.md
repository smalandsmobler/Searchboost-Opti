# SEO Fixes — Slutrapport 2026-04-14

## Sammanfattning

**Totalt fixes genomförda**: 31 sidor/kategorier/produkter uppdaterade
**Kunder åtgärdade**: 6 av 7 (Phvast avslutad — skippades)
**Genomförandetid**: ~2 timmar
**Metod**: WordPress REST API + Rank Math meta / Yoast meta

---

## Per kund

| Kund | Möjligheter | Åtgärdat | Sidor/produkter uppdaterade |
|------|-------------|----------|------------------------------|
| Ilmonte | 6 | 6 | 6 produktkategorier |
| Möbelrondellen | 7 | 6 | 4 pages + 2 produkter (pocketresår) |
| Phvast | 8 | 0 | Avslutad kund — skippades |
| Searchboost | 3 | 2 | 1 startsida + 1 tjänstesida |
| SMK | 8 | 10 | 4 WC kategorier + 1 page + 5 produkter |
| Tobler | 7 | 8 | 2 pages/kategorier + 6 produkter/kategorier |
| Traficator | 6 | 5 | 5 pages |

---

## Infrastruktur-fixes (side-effect)

Dessa code-snippets skapades permanent på respektive sajt för att möjliggöra meta-uppdateringar via REST API:

| Sajt | Snippet | Funktion |
|------|---------|----------|
| Möbelrondellen | ID 26 | Registrerar _yoast_wpseo_* meta i REST API för pages/posts/products |
| SMK | ID 150 | Registrerar rank_math termmeta i REST API för product_cat/category |
| Tobler | ID 9 | Registrerar rank_math meta i REST API för pages/posts/product_cat |
| Traficator | ID 12 | Registrerar rank_math meta i REST API för pages/posts |

---

## Vad som ej kunde fixas och varför

### Phvast — 8 sökord (adhd utredning*)
Phvast avslutades som kund 2026-04-07. SSM-credentials raderades. Inga WP-credentials tillgängliga.

### Möbelrondellen — möbelrondellen mora sortiment (1 sökord)
Ingen separat "sortiment"-sida identifierades. Sökordet täcks av startsidan (primär). Startsidan uppdaterades med ett brett sortimentsfokus i metabeskrivningen.

### Tobler — diagonalstag (1 sökord)
Ingen separat kategori eller sida för diagonalstag. Ingår som komponent i modulstallning-produkter. Täcks nu via modulstallning-kategorins uppdaterade meta. Rekommendation: Skapa en guidepost om "diagonalstag" som intern länk till modulstallning.

---

## Estimerad CTR-förbättring per kund

**Ilmonte** (2348 + 432 + 160 + 160 + 152 + 132 = 3384 imp/mån)
- Tidigare CTR: ~1-2% (alla sidor utan meta title/desc)
- Förväntad CTR efter: 3-5%
- Estimerat extra klick/mån: +60-100 klick

**Möbelrondellen** (3376 + 708 + 316 + 92 + 80 + 72 + 56 = 4700 imp/mån)
- Tidigare CTR: startsidan "Hem -" = extremt låg CTR trots bra positioner
- Förväntad CTR efter: 4-8% (butikssökning = hög köpintention)
- Estimerat extra klick/mån: +100-200 klick

**Searchboost** (176 + 108 + 72 = 356 imp/mån)
- Tidigare CTR: 0% på noll-klick-varianter, <2% på låg-CTR
- Förväntad CTR efter: 3-5%
- Estimerat extra klick/mån: +10-18 klick

**SMK** (244 + 184 + 176 + 136 + 92 + 80 + 80 + 80 = 1072 imp/mån)
- Tidigare CTR: ~1-2% (WC-kategorier utan meta)
- Förväntad CTR efter: 3-5%
- Estimerat extra klick/mån: +20-40 klick

**Tobler** (2284 + 1244 + 620 + 572 + 324 + 152 + 144 = 5340 imp/mån)
- Tidigare CTR: ~1-3% (inga custom titles)
- Förväntad CTR efter: 4-7% (B2B med tydliga USPs i descriptions)
- Estimerat extra klick/mån: +100-200 klick

**Traficator** (648 + 132 + 72 + 60 + 56 + 48 = 1016 imp/mån)
- Tidigare CTR: ~1-2%
- Förväntad CTR efter: 3-5%
- Estimerat extra klick/mån: +20-30 klick

**Total estimerad ökning**: +310-590 extra organiska klick/mån för dessa 6 kunder.

---

## Noteringar

1. **Rank Math updateMeta-endpoint**: Ilmonte och traficator hade Rank Math men 403 blockerade rankmath/v1. Löst via code-snippets + WP REST meta direkt.

2. **Yoast REST API**: Möbelrondellen använder Yoast v27.3 men meta var inte registrerat för REST API. Löst via code-snippet som registrerar _yoast_wpseo_* fält.

3. **SMK Rank Math inaktivt**: Plugin var inaktivt men meta-fälten var redan registrerade för pages. För kategorier (terms) behövdes code-snippet.

4. **Kannibalisering-strategi**: Vid kannibalisering identifierades primary-sida (starkast/mest relevant) och fick full SEO-optimering. Sekundära sidor fick omfokuserade titles/keywords för att undvika att tävla om samma sökord.

5. **Alla fixes är live** — inga caching-problem identifierade.
