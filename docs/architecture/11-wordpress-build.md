# 11 — WordPress-bygge (Rank Math + Perispa)

> Källor: `wordpress-plugin/searchboost-onboarding/`, perispa-MCP. Verifierat 2026-05-30.

## Bekräftat: Rank Math + Perispa

- **Rank Math** används för all SEO-meta + schema på WP-kunder. Optimizern skriver via `rank_math_*`-meta (se [02](02-optimizer.md)).
- **Perispa MCP** används ALLTID för WP-arbete på kundsajter (`perispa_*`-verktyg).
- **Respira-MCP** endast på tobler.searchboost.se (staging).

WP-kunder i Perispa: smalandskontorsmobler, mobelrondellen, jelmtech, searchboost, traficator, humanpower, nordicsnusonline, tobler, ilmonte.

## ABSOLUT FÖRBUD — Code Snippets

Code Snippets-pluginet kraschar sajter (traficator 4 ggr). **Aldrig** Code Snippets på kundsajter. Använd alltid perispa + Rank Math Pro. Inget undantag.

## Onboarding-plugin

`searchboost-onboarding.php`:
- Admin-sida (rad 12-13): inställningar för `api_url` (default `https://51.21.116.7/api/onboard`) + `api_key` (rad 30-34).
- AJAX-handler `sb_onboard_handler` (rad 47): nonce-check (rad 48), `wp_remote_post` till EC2-API (rad 72), svar tillbaka (rad 88).
- Hook i `wp_footer` (rad 98).

Flöde: kund installerar plugin → fyller i API-nyckel → onboarding-data POSTas till EC2 `/api/onboard` (egen auth, [10](10-dashboards.md) rad 103).

## Övriga WP-plugins i repo

| Fil | Roll |
|-----|------|
| `searchboost-security/searchboost-security.php` | Säkerhetshärdning |
| `sb-ku-design-fixes.php` | Kundunika designfixar |
| `smk-img-batch.php` | SMK bildbatch |
| `smk-ai-chat.php` | SMK AI-chat |
| `smk-product-schema.php` | SMK produktschema |

## GÖR vs BORDE GÖRA

| Område | GÖR | BORDE |
|--------|-----|-------|
| SEO-meta | ✅ Rank Math via Perispa | — |
| Onboarding | ✅ Plugin → /api/onboard | Verifiera HTTPS-cert på 51.21.116.7 (self-signed?) |
| Code Snippets | Förbjudet | — |
| WP best-practice-checklista | Saknas som dokument | Definiera: Rank Math-config, schema-typer per sidtyp, CWV-plugin, bildoptimering, säkerhetshärdning (se anti-slop [12](12-headless-webbygge.md) för motsvarande tankesätt) |

> En WP-byggstandard (motsvarande anti-slop för headless) bör skrivas som separat checklista i ett uppföljningspass.
