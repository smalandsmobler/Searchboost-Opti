---
name: Uppdrag innan nästa veckomail (2026-05-22)
description: Veckans optimeringar ska visa alla typer separat (nyckelordsdensitet, thin content, sitemap, rubriker, meta, titlar) — inte bara schema_markup aggregerat.
type: project
---

# Uppdrag: nästa veckomail (2026-05-22 fredag 15:00)

## Bakgrund

2026-05-15 visade veckomailet 521 optimeringar — men alla loggade som `schema_markup` eftersom mega-runners `logToBq`-funktion prioriterade schema framför andra typer:

```js
// Buggig prioritering — skapar EN rad per sida med första matchande typen
const optType = ops.some(o => o.field === 'schema') ? 'schema_markup'
              : ops.some(o => o.field === 'title') ? 'meta_title'
              : ...
```

Verkligheten: varje sida fick title + description + focus_keyword + schema. Men logga visade bara "schema_markup". Mailet ser felaktigt monotont ut.

## Mål

Veckomailet 2026-05-22 ska visa minst följande typer fördelat över alla kunder:

| Typ | Förväntat antal |
|---|---|
| `meta_title` | 200-300 |
| `meta_description` | 200-300 |
| `focus_keyword` | 100-200 |
| `schema_markup` | 50-100 |
| `keyword_density_fix` | 30-80 |
| `thin_content_expand` | 30-60 |
| `h2_h3_optimization` | 50-100 |
| `internal_linking` | 30-80 |
| `alt_text_fix` | 50-100 |
| `sitemap_regenerate` | 8 (en per kund) |

## Vad som ska byggas

### 1. Logga per typ (snabbfix — högsta prio)

Refaktorera `processItem()` i mega-runner att skicka EN entry per åtgärdad fältfamilj istället för att aggregera. Resultat: 521 åtgärder hade blivit ~1500-2000 loggrader fördelade över alla typer.

### 2. Keyword-density-check (use existing utility)

Andra sessionen byggde `lambda-functions/lib/keyword-density.js`. Integrera i mega-runner och autonomous-optimizer:

- Innan WP-skriv: kör `analyzeDensity(pageText, focusKeyword)`.
- Om status `low` (<0.5%) → utöka content med keyword 2-3 gånger naturligt.
- Om status `high` (>3%) → variera till synonymer.
- Logga som `keyword_density_fix` med before/after-density.

### 3. Thin content expansion (ny task-typ)

Kriterier: <500 ord på en sida som har trafik eller kommersiell intent.

- Mät via `pageText.split(/\s+/).length`.
- Om <500: kalla AI-call (Claude Haiku via OpenRouter) med kontext (focus keyword + befintligt content + brand) för att utöka till 600-1200 ord.
- Behåll H1/H2/H3-struktur — utöka stycken, lägg INTE in nya rubriker om sidan redan har bra struktur.
- Spara med `respira_update_element` (om kund har Respira) eller direkt via WP REST API som content-uppdatering.
- Logga som `thin_content_expand` med before_word_count och after_word_count.

### 4. Sitemap-regenerering

Rank Math genererar sitemap automatiskt men ping till Google görs inte alltid:

- Lambda-task per kund: trigga Rank Math sitemap-regenerering + skicka ping till `https://www.google.com/ping?sitemap=<url>`.
- Logga som `sitemap_regenerate` med URL + ping-status.

### 5. Rubrik-optimering (H1/H2/H3)

Autonomous-optimizer har redan `h2_h3_optimization`-handler. Aktivera + ge varje aktiv kund minst 5 H-tasks i `seo_work_queue` innan nästa fredag.

### 6. Internlänkning

Autonomous-optimizer har `no_internal_links`-handler. Aktivera + ge varje aktiv kund minst 5 internal-link-tasks.

### 7. Alt-text

Autonomous-optimizer har `missing_alt_text`-handler. Hitta sidor med `<img>` utan alt och kör.

## Implementationsordning

| Dag | Vad |
|---|---|
| Mån 18 maj | Refaktorera mega-runner: logga per fält-typ (snabbfix, 1 tim) |
| Mån 18 maj | Integrera keyword-density i mega-runner + autonomous-optimizer |
| Tis 19 maj | Bygg thin_content_expand task-typ i autonomous-optimizer |
| Ons 20 maj | Bygg sitemap_regenerate Lambda + EventBridge tor 12:00 |
| Ons 20 maj | Aktivera h2_h3, internal_linking, alt_text per kund (seo_work_queue) |
| Tor 21 maj | Test-körning hela stacken på 1 kund, verifiera logga-fördelning |
| Tor 21 maj | Vid OK: kör på alla 8 kunder under natten |
| Fre 22 maj 15:00 | Veckomail med fördelad logg |

## Long-term: refaktor till kanban-flöde

Se `arkitektur_kanban_spindel.md` — alla åtgärder ska skapa work_queue-task först, sen done-transition → auto-logg per typ. Detta gör fördelat logg-format till default istället för per-script-bug.

## Status

- 2026-05-15: dokumenterat
- Implementation startar måndag 2026-05-18
