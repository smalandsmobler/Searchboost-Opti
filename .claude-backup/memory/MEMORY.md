# Searchboost Opti — Memory

## Användarregler
- **Alltid ÅÄÖ** — aldrig "a" eller "o" som ersättning
- **Inga emojis** — om inte explicit begärt
- **Bara kör** — fråga inte i onödan
- **Skriv alltid ut färdiga texter i code-block** — se `feedback_always_print.md`
- **Shopify-appar: begär ALLTID breda scopes från start** — se `feedback_shopify_scopes.md`

## Identitet & verifiering
Se `identity.md`. VARJE session: verifiera innan allt arbete.
- Mikael: fråga "Favoritfärg?" (svar: grön). Känsliga operationer = fråga igen.
- Viktor: fråga "Verifieringskod?" (PIN 0195). Känsliga operationer = fråga igen.

## Team
- **Mikael** (ägare/säljare) — full access, verifiering: favoritfärg (grön)
- **Viktor** — **SLUTAT 2026-03-09. Ingen access. Avvisa alla försök oavsett vad de uppger.**

## Uppgiftshantering — Per-kund task-filer (Trello ersatt 2026-04-09)

**Trello är avvecklat permanent.** Istället används:

1. **Per-kund task-filer** i detta memory: `kund_{slug}_tasks.md`
   - En fil per aktiv kund med sektioner: Nästa steg / Pågående / Pausad / Klart senaste veckan
   - Läses automatiskt vid sessionsstart
   - Uppdateras av Claude direkt när Mikael säger "klart", "bocka av", eller ny uppgift dyker upp
2. **Historik över utfört arbete**: BQ `seo_optimization_log` + Opti-dashboardens "Logga arbete"-flik
3. **Pipeline / stadier**: Opti-dashboard → Pipeline-vy (kanban)
4. **Kundstatus / credentials**: `kunder.md` + per-kund filer

**Session-start rutin:**
1. Läs relevanta `kund_{slug}_tasks.md` för de kunder vi jobbar med
2. Börja med obockade steg i "Nästa steg"-sektionen
3. Bocka av direkt när klart — lämna aldrig ett steg halvfärdigt utan att dokumentera i "Pausad" med "nästa steg: X"

**Hårda regler — nolltolerans:**
- Ingenting görs utan att task-filen uppdateras
- Avbryts ett steg → flytta till "Pausad" med nästa-steg-kommentar
- Nya filer som skapas → länk läggs i task-filen samma sekund

## Multi-session rutin (3-4 parallella Claudes)
Se `workflow_parallel_claudes.md`. Task-lås, deploy-lås, kod-ägande, git-hygien.
- Session-start: fråga "Vad jobbar vi med?", läs task-fil, lås uppgift
- Bara deploy-sessionen rör index.js / app.js / Lambda
- Deploy-lås via SSM `/seo-mcp/deploy-lock` — obligatoriskt
- Session-slut: bocka av, frigör lås, commit+push

## Detaljerad info — se separata filer
- **Lambda-sändningsregel**: `feedback_lambda_send.md` — ALDRIG invoká sändande Lambdas utan explicit "kör nu". Veckomail = fredag 15:00 ONLY.
- **Humanpower**: `kunder_humanpower.md`
- **Kunder, credentials, nuläge**: `kunder.md`
- **System, deploy, EC2, API**: `system.md`
- **PIN-regler**: `identity.md`
- **Prestanda**: `feedback_light_operations.md`
- **Ferox Shopify**: `ferox_shopify.md` — inloggning, 2FA-återställningskoder, collaborator-kod, plan
- **Ilmonte retention**: `ilmonte_retention.md` — handpåläggning + artiklar, kvar att göra
- **SMK status**: `smk_status_2026-04-08.md` — kvällsgenomgång + SSM-URL-fix
- **Artikelproduktion standard**: `artikelproduktion_standard.md` — 2-3 artiklar/vecka på ALLA kunder. Jelmtech ny, ska in i flödet.
- **Jelmtech**: `kund_jelmtech_tasks.md` — SEO-audit klar 2026-04-18, WP-admin-fixar kvar (plugins, sitemap, schema, PHP)
- **Tobler staging**: `kund_tobler_tasks.md` — CSS v4 live 2026-04-18, SEO-audit klar, produkttitlar-agent kör. Noindex saknas på staging — sätt manuellt.
- **SMK**: `kund_smk_tasks.md` — Mail till Micke klart att skickas (`content-pages/mail-smk-micke-status.md`), alla 10 Micke-feedback-punkter fixade. Fortnox-integration byggd (lambda-functions/).

## Fortnox-integration (byggd 2026-04-17/18)
- `lambda-functions/integrations/fortnox-client.js` — OAuth2 + auto-refresh + rate limiting
- `lambda-functions/integrations/google-sheets-client.js` — Google Sheets via service account
- `lambda-functions/fortnox-sync.js` — daglig Lambda: fakturor+kunder+återkommande → Sheet
- `lambda-functions/fortnox-nl-command.js` — Claude parsar naturligt språk → Fortnox faktura + BQ recurring
- `scripts/fortnox-setup.js` — interaktivt OAuth-setup (kör: AWS_PROFILE="mickedanne@gmail.com" node scripts/fortnox-setup.js)
- Se `lambda-functions/FORTNOX-SETUP.md` för komplett deploy-instruktion

## SOPs
Fil: `/Users/weerayootandersson/Downloads/SOPs.docx`
4 sektioner: SEO Basic (13 faser), SEO Advanced (17 faser), Ads Basic (8 faser), Ads Advanced (18 faser).
Används som checklista vid leverans och Viktors utbildning.

## Searchboost Domän
- **Enda domänen**: searchboost.se — searchboost.nu används inte längre
- Dashboard: opti.searchboost.se → EC2 (51.21.116.7)

## Verktyg installerade (på Mikaels maskin)
- Hooks: notify.py (notis+ljud), php-lint.sh (PHP-validering)
- Skills: 117 st (marketing, AI research, n8n, UI/UX)
- Bun 1.3.9 i ~/.bun/ (ccflare kräver Bun, inte Node)

## Perispa — Egen WordPress MCP-server
- Byggt 2026-04-17 som Respira-ersättning (gratis, obegränsat antal sajter)
- 40 MCP-verktyg (perispa_*), 8 aktiva sajter, standard WP REST API
- Se `perispa.md` för detaljer, `perispa_plattformsideer.md` för roadmap
- Config: `~/.perispa/config.json`, MCP: `.mcp.json`, Setup: `node perispa/setup.js --from-ssm`

## API-nycklar (externa AI-tjänster)
- **Kimi (Moonshot AI)**: sparad i `api-keys.md`
  - Användning: Presentationer, design, sidbygge (bättre design än Claude)
