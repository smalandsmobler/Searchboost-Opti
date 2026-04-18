---
name: Multi-session arbetsrutin
description: Koordineringsregler när 3-4 Claude-processer kör parallellt — task-lås, deploy-lås, kod-ägande, git-hygien
type: feedback
originSessionId: d1f3d6e7-b940-49d0-b60d-b931741a905d
---
## MULTI-SESSION RUTIN

### SESSION-START (körs ALLTID först)

Claude frågar: "Vad jobbar vi med idag?"

Mikael svarar t.ex: "ilmonte — vecka 23 + robots.txt"

Claude gör direkt:
1. Läser memory/kund_{slug}_tasks.md
2. Hittar första obockade uppgift under "Nästa steg"
3. Bekräftar: "Jag tar [uppgift]. Låser nu."
4. Skriver 🔒 LÅST [kund, uppgift, tid] i task-filen
5. Börjar arbeta

---

### UNDER ARBETET

Task-lås:
  Markera i kund_{slug}_tasks.md:
  🔒 LÅST [ilmonte | bulk Rank Math | 17:23]
  Frigörs när "klart" (bockad ✅) eller "pausad" (med nästa-steg-kommentar).
  Andra Claudes hoppar alltid över 🔒-märkta uppgifter.

Kod-ägande:
  Bara deploy-sessionen rör index.js / app.js / Lambda-filer.
  Alla andra sessioner är strikt kund-content:
  artiklar, WP-optimering, mail, task-filer.

Git-hygien:
  git pull --rebase innan varje edit på delade filer.
  Commit direkt när uppgift är klar — aldrig stora ostagade batchar.

---

### DEPLOY-LÅS (obligatoriskt vid all server-deploy)

Innan SSH/SCP/PM2:
  aws ssm put-parameter --name /seo-mcp/deploy-lock \
    --value "CLAUDE-X|$(date -u +%Y-%m-%dT%H:%M)" \
    --type String --overwrite

Kontrollera alltid innan deploy:
  aws ssm get-parameter --name /seo-mcp/deploy-lock
  → Om värde finns och är <2h gammalt: vänta, meddela Mikael.
  → Om >2h gammalt: stale, ignoreras.

Efter deploy:
  aws ssm delete-parameter --name /seo-mcp/deploy-lock

---

### SESSION-SLUT

1. Bocka av slutförda uppgifter i task-filen (✅)
2. Flytta oavslutade till "Pausad" med nästa-steg-kommentar
3. Frigör alla 🔒-lås
4. git commit + push om kod ändrats
