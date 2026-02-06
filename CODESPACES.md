# 🚀 GitHub Codespaces Guide

## Vad är GitHub Codespaces?

**GitHub Codespaces** = VS Code i molnet! Ingen lokal installation behövs.

✅ Fullständig utvecklingsmiljö
✅ Node.js 18 förinstallerat
✅ Alla dependencies automatiskt installerade
✅ Port forwarding för API-testing
✅ Spara ingenting lokalt - allt i molnet

---

## 🎯 Starta Babylovesgrowth i Codespaces

### Metod 1: Via GitHub.com

1. Gå till: https://github.com/smalandsmobler/Babylovesgrowth
2. Klicka på **Code** (grön knapp)
3. Välj **Codespaces** tab
4. Klicka **Create codespace on claude/integrate-babylovesgrowth-blogging-at2mC**

**KLART!** 🎉 Codespace startar automatiskt med allt installerat!

### Metod 2: Via VS Code Desktop

1. Installera [GitHub Codespaces extension](https://marketplace.visualstudio.com/items?itemName=GitHub.codespaces)
2. Öppna Command Palette (`Ctrl+Shift+P` eller `Cmd+Shift+P`)
3. Skriv: **Codespaces: Create New Codespace**
4. Välj `smalandsmobler/Babylovesgrowth`
5. Välj branch: `claude/integrate-babylovesgrowth-blogging-at2mC`

### Metod 3: Direkt Länk

Öppna denna URL:
```
https://github.dev/smalandsmobler/Babylovesgrowth/tree/claude/integrate-babylovesgrowth-blogging-at2mC
```

---

## ⚙️ Automatisk Setup

När Codespace startar händer detta automatiskt:

```
✅ Node.js 18 installeras
✅ npm install körs
✅ TypeScript kompileras (npm run build)
✅ .env skapas från .env.example
✅ Port 3000 forward-as för API access
✅ VS Code extensions installeras:
   - ESLint
   - Prettier
   - TypeScript
   - GitLens
   - GitHub Copilot (om du har det)
```

**Du behöver bara:**
1. Vänta 2-3 minuter (första gången)
2. Uppdatera `.env` med dina Abicart credentials
3. Kör `npm run dev`

---

## 🎮 Använd Babylovesgrowth i Codespaces

### 1. Uppdatera .env

```bash
# Öppna .env fil
code .env

# Lägg till dina credentials:
ABICART_API_KEY=YXV0aDp4sbc1Skvs2bkiLsHrC9FUCDCjalXHlk4YaF2rRzFqhS+4
ABICART_SHOP_ID=smalandskontorsmobler.se
ENABLE_AUTO_PUBLISH=true
```

### 2. Starta Servern

```bash
# Development mode (hot reload)
npm run dev

# Production mode
npm start
```

**Output:**
```
✅ Auto-publisher started with schedule: 0 9 * * * (Every day at 09:00)
Server listening on http://localhost:3000
Blog API available at http://localhost:3000/api/blog
```

### 3. Testa API:et

Codespaces forward-ar automatiskt port 3000!

**I Codespaces Terminal:**
```bash
# Kolla status
curl http://localhost:3000/health

# Lista blogginlägg
curl http://localhost:3000/api/blog

# Publicera nu!
curl -X POST http://localhost:3000/api/publish/now

# Kolla queue status
curl http://localhost:3000/api/publish/status

# SEO internal links
curl http://localhost:3000/api/seo/internal-links
```

**Från Internet (din browser):**

Codespaces ger dig en publik URL:
```
https://mystical-space-garbanzo-abc123.github.dev
```

Öppna:
```
https://mystical-space-garbanzo-abc123.github.dev/api/blog
```

---

## 🔒 Port Forwarding

Codespaces forward-ar automatiskt port 3000!

**Se forwarded ports:**
1. Klicka på **PORTS** tab i VS Code
2. Port 3000 syns där
3. Klicka på 🌐 för att öppna i browser

**Visibility:**
- **Private** (default) - Bara du kan accessa
- **Public** - Vem som helst med länken

För testing av webhooks, sätt port till **Public**.

---

## 💾 Spara Ändringar

Alla ändringar i Codespace är automatiskt synkade med Git!

```bash
# Spara ändringar
git add .
git commit -m "Test changes in Codespaces"
git push

# Eller använd VS Code Source Control GUI
```

---

## 🎯 Exempel-Workflow

### Testa Auto-Publishing:

```bash
# 1. Starta server
npm run dev

# 2. Kolla content queue
curl http://localhost:3000/api/publish/status

# 3. Publicera första bloggen
curl -X POST http://localhost:3000/api/publish/now

# 4. Verifiera i Abicart admin
# Gå till https://admin.abicart.se och kolla artiklar
```

### Testa SEO Features:

```bash
# 1. Hämta internlänk-förslag
curl http://localhost:3000/api/seo/internal-links | jq

# 2. Applicera en länk
curl -X POST http://localhost:3000/api/seo/internal-links/apply \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "123",
    "targetPostId": "456",
    "anchorText": "barnmöbler"
  }'

# 3. Generera sitemap
curl http://localhost:3000/api/seo/sitemap > sitemap.xml
cat sitemap.xml
```

### Testa CRUD Operations:

```bash
# Skapa ny blogg
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test från Codespaces",
    "content": "<h1>Hej!</h1><p>Detta skapades i Codespaces!</p>",
    "excerpt": "Test blogg",
    "tags": ["test", "codespaces"]
  }'

# Lista alla bloggar
curl http://localhost:3000/api/blog

# Uppdatera blogg
curl -X PUT http://localhost:3000/api/blog/12345 \
  -H "Content-Type: application/json" \
  -d '{"title": "Uppdaterad titel"}'

# Ta bort blogg
curl -X DELETE http://localhost:3000/api/blog/12345
```

---

## 🐛 Debugging i Codespaces

### VS Code Debugger

1. Öppna **Run and Debug** (Ctrl+Shift+D)
2. Sätt breakpoints i koden
3. Klicka **Start Debugging**

### Logs

```bash
# Application logs
npm run dev
# Ser alla console.log outputs

# PM2 logs (om du kör med PM2)
pm2 logs babylovesgrowth
```

---

## 💰 Kostnad

**GitHub Free:**
- 120 core hours/månad gratis
- 15 GB storage

**GitHub Pro:**
- 180 core hours/månad
- 20 GB storage

**För Babylovesgrowth:**
- ~2 core hours/dag om du använder 8h/dag
- = ~60 core hours/månad
- = **GRATIS** med Free tier! 🎉

---

## 🚀 Pro Tips

### 1. Spara Codespace Template

Efter setup, kan du:
- Stoppa Codespace (sparas automatiskt)
- Starta senare = allt är kvar!

### 2. Prebuilds

För snabbare startup:
- GitHub Actions prebuild konfigurerad
- Dependencies pre-installerade
- Start på 30 sekunder istället för 3 minuter!

### 3. Secrets i Codespaces

Lagra Abicart credentials säkert:

1. Gå till GitHub repo → Settings → Secrets → Codespaces
2. Lägg till:
   - `ABICART_API_KEY`
   - `ABICART_SHOP_ID`
3. Codespace laddar automatiskt!

### 4. Dela Codespace

Gör port public och dela URL:
```
https://mystical-space-abc123.github.dev/api/blog
```

Perfekt för att visa demos!

---

## 🆘 Troubleshooting

**Problem:** Codespace startar inte
- **Lösning:** Checka GitHub status, vänta 1 min, försök igen

**Problem:** Port 3000 inte forwarded
- **Lösning:** PORTS tab → Add Port → 3000 → Set to Public

**Problem:** npm install errors
- **Lösning:** Radera `node_modules`, kör `npm ci`

**Problem:** .env inte laddad
- **Lösning:** Restart terminal, eller restart Codespace

**Problem:** Abicart 403 error
- **Lösning:** Codespace IP inte whitelistad hos Abicart. Använd för testing utan Abicart först!

---

## ✅ Checklist för Codespaces

- [ ] Codespace skapad
- [ ] `.env` uppdaterad med credentials
- [ ] `npm run dev` körs
- [ ] Port 3000 forwarded
- [ ] Test: `curl http://localhost:3000/health`
- [ ] Test: Publicera blogg
- [ ] Test: SEO features
- [ ] Kolla logs för errors

---

## 🎓 Nästa Steg Efter Codespaces-Test

Efter du har testat i Codespaces:

1. ✅ Deploy till AWS för produktion
2. ✅ Whitelist AWS IP hos Abicart
3. ✅ Sätt upp GitHub Actions för CI/CD
4. ✅ Konfigurera custom domain
5. ✅ Enable auto-publishing i produktion

---

**Enjoy Codespaces! 🚀**

Det är PERFEKT för att testa Babylovesgrowth utan att behöva sätta upp något lokalt!
