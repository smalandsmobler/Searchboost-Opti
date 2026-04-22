# SMK Mobile Audit 2026-04-22

**Metod:** DOM-baserad + headless screenshot på 4 breakpoints (iphone-se 320px, iphone-13 375px, iphone-max 414px, tablet 768px)

**Sidor testade:** home, sortiment, kat-kontorsstolar, landing-kontorsstolar, om-oss, kontakt, artiklar, artikel, varukorg, produkt

**Top-issues:**
| Kategori | Antal | Prio |
|----------|-------|------|
| LAYOUT | 12 | HÖG |
| PRESTANDA | 11 | MEDEL |
| BANDBREDD | 10 | MEDEL |
| LÄSBARHET | 1 | LÅG |

**Fixer deployade 2026-04-22:**
- Snippet #178: Låst mobile header (älg vänster, logo center, cart+hamburger höger)
- Snippet #179 (nytt): Global mobile fixpaket — overflow-x hidden, inline width override, 44px touch targets, font-size minimum 13px, hero-bilder max 60vh

**Återstår:**
- Srcset på alla bilder — kräver Flatsome theme-setting (advanced > lazy-load)
- Inline JS 269KB på varukorg (optimization för WC scripts)
- Home: 6 inline widths 680-1300px (via HOME content — fixas manuellt)


## Final state — 2026-04-22 kväll

**Aktiva snippets för mobil:**
- **#177** SBS: Mobil layout v3 (kampanjer + kategorier + bild-containment + bästsäljare)
- **#179** SBS: Global Mobil-fixpaket (overflow-x hidden, 44px touch, font-min 13px, inline-width override)
- **#180** SBS: Mobil-fix .smk-hfd2 Vi är också företagare (1-kol + bild/text under)

**Deaktiverat:**
- #178 SBS: LÅST Mobil Header (alla försök att ersätta Flatsome default-header ledde till problem — Flatsome native mobile header är bra)

**Användarens verdict:** "Perfekt" ✓
