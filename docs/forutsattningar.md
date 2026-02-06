# Förutsättningar — seo-mcp-server

## 1. Tekniska förutsättningar

### Systemkrav

| Krav | Minimum | Rekommenderat |
|------|---------|---------------|
| Node.js | v18+ | v20 LTS |
| npm | v9+ | v10+ |
| RAM | 512 MB | 1 GB+ |
| Disk | 100 MB | 500 MB (inkl. cache) |
| OS | Linux, macOS, Windows | Linux (Ubuntu 22.04+) |

### Beroenden

| Paket | Version | Syfte |
|-------|---------|-------|
| `@modelcontextprotocol/sdk` | ^1.0.0 | MCP-serverramverk |
| `zod` | ^3.0.0 | Schema-validering av verktygsparametrar |
| Node.js inbyggd `fetch` | — | HTTP-förfrågningar (kräver Node 18+) |

### Nätverkskrav
- Utgående HTTPS-åtkomst (port 443) till webbsidor som ska analyseras
- Ingen inkommande portöppning krävs (MCP använder stdio-transport)
- Stabil internetuppkoppling för realtidsanalys

---

## 2. Kunskapsförutsättningar

### Utvecklingsteamet
- **JavaScript/Node.js** — God förståelse för ES-moduler och asynkron programmering
- **MCP-protokollet** — Grundläggande förståelse för Model Context Protocol
- **SEO-kunskap** — Förståelse för on-page SEO, meta-taggar, sitemaps och robots.txt
- **HTML/DOM-parsning** — Erfarenhet av att parsa och analysera webbsidor

### Drift & underhåll
- Grundläggande Linux-serveradministration (om egenhostad)
- Git-versionhantering
- npm-pakethantering

---

## 3. Projektförutsättningar

### Innan utvecklingsstart

| # | Förutsättning | Status | Ansvarig |
|---|---------------|--------|----------|
| 1 | Node.js v18+ installerat i utvecklingsmiljö | ⬜ | Utvecklare |
| 2 | Git-repo uppsatt och tillgängligt | ✅ | Klart |
| 3 | MCP-klientmiljö för testning (t.ex. Claude Desktop) | ⬜ | Utvecklare |
| 4 | Testsidor identifierade för SEO-analys | ⬜ | Produktägare |
| 5 | SEO-regler och krav definierade | ⬜ | SEO-specialist |
| 6 | CI/CD-pipeline konfigurerad | ⬜ | DevOps |

### Innan produktion

| # | Förutsättning | Status | Ansvarig |
|---|---------------|--------|----------|
| 1 | Alla 6 kärnverktyg implementerade och testade | ⬜ | Utvecklare |
| 2 | Felhantering och rate limiting på plats | ⬜ | Utvecklare |
| 3 | Dokumentation komplett | ⬜ | Utvecklare |
| 4 | Hosting/deployment-miljö förberedd | ⬜ | DevOps |
| 5 | Övervakning och loggning konfigurerat | ⬜ | DevOps |
| 6 | Säkerhetsgranskning genomförd | ⬜ | Säkerhet |

---

## 4. Juridiska & regulatoriska förutsättningar

- **Web scraping** — Respektera robots.txt och webbplatsers användarvillkor
- **GDPR** — Ingen persondata samlas in vid standard SEO-analys, men verifiera vid utökad funktionalitet
- **Licensiering** — Projektet använder MIT-licens; verifiera att alla beroenden är kompatibla
- **API-villkor** — Följ användarvillkor för eventuella tredjepartstjänster (Google APIs etc.)

---

## 5. Antaganden

1. MCP-klienten (t.ex. Claude Desktop) hanterar autentisering och användaråtkomst
2. Servern körs lokalt eller i en betrodd miljö — ingen egen autentisering krävs initialt
3. Analyserade webbsidor är publikt tillgängliga (ingen inloggning krävs)
4. Grundfunktionaliteten byggs utan betalda tredjepartsverktyg
5. MVP levereras med de 6 definierade kärnverktygen innan eventuell utökning

---

## 6. Beroenden & risker

| Risk | Sannolikhet | Påverkan | Åtgärd |
|------|:-----------:|:--------:|--------|
| MCP SDK-uppdateringar bryter kompatibilitet | Medel | Hög | Pinnade versioner, regelbunden uppföljning |
| Rate limiting från analyserade webbplatser | Hög | Medel | Inbyggd fördröjning, caching, respektera robots.txt |
| Node.js-versionsändringar | Låg | Medel | Använda LTS-versioner, testa vid uppgradering |
| Webbsidor med komplexa JS-renderingar | Hög | Medel | Överväg headless browser som tillägg |
