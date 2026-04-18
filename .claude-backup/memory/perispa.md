---
name: Perispa MCP Server
description: Egen WordPress MCP-server (Respira-klon) — 40 verktyg, 8 sajter, gratis, standard WP REST API
type: project
originSessionId: 03fee07c-ff7f-42a2-8b76-d925172a6745
---
# Perispa — Searchboost WordPress MCP Server

Byggt 2026-04-17 som ersättning för Respira (som kräver betalplugin per sajt).

## Arkitektur
- MCP-server (Node.js, ESM) som pratar med standard WP REST API + Application Passwords
- Ingen proprietär WP-plugin behövs — fungerar med alla WordPress-sajter
- Multi-site stöd: alla kunders sajter i en config

## Filer
- `perispa/index.js` — MCP-server med 40 verktyg (~550 rader)
- `perispa/wp-client.js` — WordPress REST API-klient (~380 rader)
- `perispa/config.js` — Config-laddare (~60 rader)
- `perispa/setup.js` — SSM-import + anslutningstest (~150 rader)
- `~/.perispa/config.json` — Sajt-credentials (genererad från SSM)
- `.mcp.json` — MCP-servern registrerad för Claude Code

## 40 MCP-verktyg (perispa_*)
Sajt-hantering (4), Sidor (5), Inlägg (5), Media (5), SEO/Rank Math (3), Menyer (4), Kategorier/Taggar (4), Plugins (3), Användare (1), Kommentarer (1), Inställningar (2), Sök (1), Custom Post Types (1), Bulk SEO (1)

## 8 aktiva sajter (testade OK 2026-04-17)
humanpower, ilmonte, jelmtech, nordicsnusonline, searchboost, smalandskontorsmobler, tobler, traficator

## Setup-kommandon
```bash
node perispa/setup.js --from-ssm   # Generera config från AWS SSM
node perispa/setup.js --test        # Testa alla anslutningar
```

## Vs Respira
- Respira: ~EUR 150/år för 5 sajter + proprietärt WP-plugin
- Perispa: Gratis, obegränsat, standard WP REST API, inga beroenden

**Why:** Respira-licensen täckte bara 1 sajt, vi har 8+ kunder. Att betala per sajt skalade inte.
**How to apply:** Använd perispa_* verktygen i Claude Code för all WordPress-hantering. Starta om Claude Code efter ändringar i .mcp.json.
