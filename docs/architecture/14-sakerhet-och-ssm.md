# 14 — Säkerhet & SSM

> Verifierat 2026-05-30. **Inga secrets roteras automatiskt** — detta är en åtgärdslista för Mikael. Värden visas aldrig i klartext här.

## 🔴 KRITISKA larm (åtgärda först)

### 1. GitHub PAT i klartext i `.git/config`
Remote-URL för `origin` innehåller en inbäddad personal access token (`https://<TOKEN>@github.com/smalandsmobler/Searchboost-Opti.git`). Verifierat: token-literal finns i `.git/config`.

**Åtgärd:**
1. Rotera token på GitHub (Settings → Developer settings → revoke + skapa ny).
2. Byt remote till SSH eller credential-helper:
   ```bash
   git remote set-url origin git@github.com:smalandsmobler/Searchboost-Opti.git
   # eller credential helper:
   git config --global credential.helper osxkeychain
   git remote set-url origin https://github.com/smalandsmobler/Searchboost-Opti.git
   ```

### 2. `memory/wp_credentials.md` ligger i git-historiken
Filen är **committad** (IN HISTORY). WP-credentials har därmed exponerats i repo-historiken.

**Åtgärd:**
1. Rotera berörda WP-lösenord (per kund i filen).
2. Överväg historik-scrub (`git filter-repo --path memory/wp_credentials.md --invert-paths`) — destruktivt, kräver force-push + koordinering. Gör endast efter beslut.
3. Filen är nu i `.gitignore` (skyddar framåt).

### 3. Hårdkodade secret-mönster i spårade filer
Filer som innehåller `ghp_`/`sk-`/`sb-api-`-mönster (kräver manuell granskning — kan vara riktiga nycklar eller placeholders):
`dashboard/app.js`, `mcp-server-code/index.js`, `lambda-functions/social-scheduler.js`, `perispa/http-server.js`, `memory/CLAUDE_GLOBAL.md`, `.claude-backup/CLAUDE.md`, `NATTJOBB_2026-04-13.md`, `docs/manual-content-blueprint.md`, `docs/plan-n8n-migration.md`. (`affarsboost-app/.env.example` = sannolikt placeholder.)

**Åtgärd:** granska var och en. Riktiga secrets → flytta till SSM, ersätt med `getParam()`. Regeln "SSM för ALL config — inga hårdkodade secrets" ska gälla utan undantag.

### 4. Hårdkodad X-Api-Key (`sb-api-...`) i CLAUDE.md/MemPalace
Flytta resonemang/exempel till SSM-only referens; visa aldrig nyckeln i dokumentation.

## ✅ Skyddsåtgärd redan vidtagen
`.gitignore` utökad 2026-05-30 med `memory/*credentials*`, `perispa/bq-credentials.json`, `*-credentials.json`, `*service-account*.json`, `.env.*` — så de fyra untrackade känsliga filerna (`memory/api-keys.md`, `memory/wp_credentials.md`, `perispa/bq-credentials.json`, `perispa/config.json`) inte kan committas av misstag.

## SSM-namnschema — förslag

Nuvarande träd (~200 params) är funktionellt men spretigt. Förslag på enhetligt schema så "inlogg och skit" alltid hittas per kund:

```
/seo-mcp/{kategori}/{kund}/{nyckel}
```

| Kategori | Exempel |
|----------|---------|
| `wordpress` | `/seo-mcp/wordpress/{kund}/app-password` |
| `integrations` | `/seo-mcp/integrations/{kund}/ga4-property-id` |
| `social` | `/seo-mcp/social/{kund}/linkedin-token` |
| `ads` | `/seo-mcp/ads/{kund}/google-ads-customer-id` |
| `shopify` | `/seo-mcp/shopify/{kund}/access-token` |
| `shared` | `/seo-mcp/shared/openrouter-api-key` (ej kundbundet) |

### Credentials-index (hittbarhet per kund)
Skapa ett manifest så allt per kund kan listas på ett ställe:
- **Alternativ A:** BQ-tabell `customer_credentials_index` (kund, kategori, ssm_path, sist_verifierad, status).
- **Alternativ B:** SSM-manifest `/seo-mcp/index/{kund}` (JSON med alla paths).

`cred-check` (daglig Lambda) fyller redan `customer_cred_status` — utöka den till att också uppdatera indexet. Då blir "var ligger X för kund Y" en enda query.

## SSM-hygien — principer
1. Alla secrets som `SecureString`, inte `String`.
2. Aldrig secrets i kod, CLAUDE.md, MemPalace eller git — endast SSM-path + `getParam()`.
3. Auto-spara nya kund-credentials direkt i schemat vid onboarding (via `/api/onboard` + credentials-endpoint, [10](10-dashboards.md)).
4. `cred-check` verifierar dagligen + larmar vid utgångna.

## Åtgärdslista — sammanfattning för Mikael
- [ ] Rotera GitHub PAT, byt remote till SSH/helper
- [ ] Rotera WP-lösenord som låg i historiken; besluta om history-scrub
- [ ] Granska 9 filer med secret-mönster → flytta riktiga till SSM
- [ ] Migrera till `/seo-mcp/{kategori}/{kund}/{nyckel}`-schema
- [ ] Bygg `customer_credentials_index`
- [ ] Konvertera alla SSM-params till SecureString
