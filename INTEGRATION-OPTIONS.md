# 🔌 BabyLoveGrowth Integration Options

Du har **två sätt** att integrera babylovesgrowth.ai med Smålandsmöbler:

---

## 🎯 Option 1: WEBHOOK (Rekommenderat)

**Hur det fungerar:**
- Babylovesgrowth.ai **pushar** artiklar till din server när de är klara
- Real-time publicering (ingen fördröjning)
- Ingen polling behövs

**Setup:**
1. Konfigurera webhook i babylovesgrowth.ai dashboard
2. Peka till: `https://yourdomain.com/api/webhook/babylovegrowth`
3. Lägg till Bearer token (från `WEBHOOK_API_KEY`)
4. Klart! Artiklar publiceras automatiskt

**Fördelar:**
- ✅ Real-time (artikel färdig → direkt publicerad)
- ✅ Ingen ständig polling
- ✅ Lägre serverbelastning
- ✅ Perfekt för auto-publishing

**Nackdelar:**
- ⚠️ Kräver publik URL (AWS/ngrok/Codespaces public port)
- ⚠️ Babylovesgrowth.ai styr när artiklar pushas

**Status:** ✅ **Implementerad och klar att använda!**

---

## 🔄 Option 2: API POLLING

**Hur det fungerar:**
- Din server **pullar** babylovesgrowth.ai API regelbundet (ex. varje timme)
- Hämtar nya artiklar och publicerar dem

**Setup:**
1. Få API credentials från babylovesgrowth.ai
2. Konfigurera polling interval (cron)
3. Servern checkar automatiskt för nya artiklar

**Fördelar:**
- ✅ Ingen publik URL behövs
- ✅ Du styr timing och frekvens
- ✅ Enklare att testa lokalt

**Nackdelar:**
- ⚠️ Fördröjning (beroende på polling interval)
- ⚠️ Mer serverbelastning (konstant polling)
- ⚠️ Risk för duplicerade publiseringar

**Status:** ⚪ **Ej implementerad (kan byggas på 30 min om du behöver)**

---

## 📊 Jämförelse

| Feature | Webhook | API Polling |
|---------|---------|-------------|
| **Real-time** | ✅ Ja | ❌ Nej (delay) |
| **Publik URL krävs** | ✅ Ja | ❌ Nej |
| **Serverbelastning** | 🟢 Låg | 🟡 Medel |
| **Setup komplexitet** | 🟡 Medel | 🟢 Enkel |
| **Duplicering risk** | 🟢 Låg | 🟡 Medel |
| **Bäst för** | Produktion | Lokal testing |

---

## 🚀 Vad finns redan byggt?

### ✅ Webhook Integration (KLAR)
- **Endpoint:** `/api/webhook/babylovegrowth`
- **Authentication:** Bearer token
- **Transformation:** Automatisk konvertering till Abicart format
- **Error handling:** Ja
- **Logging:** Ja

**Files:**
- `src/services/babylovegrowth-webhook.service.ts`
- `src/routes/webhook.routes.ts`
- Integrerad i `src/app.ts`

### ✅ Abicart CRUD API (KLAR)
- **Create:** `POST /api/blog`
- **Read:** `GET /api/blog`, `GET /api/blog/:id`
- **Update:** `PUT /api/blog/:id`
- **Delete:** `DELETE /api/blog/:id`
- **Publish:** `POST /api/publish/now`

**Files:**
- `src/services/abicart.client.ts`
- `src/services/blog.service.ts`
- `src/routes/blog.routes.ts`

### ✅ Auto-Publisher (KLAR)
- Cron-baserad daglig publicering
- Content queue management
- Manuell trigger via `/api/publish/now`

**Files:**
- `src/services/auto-publisher.service.ts`
- `src/services/content-manager.service.ts`

### ✅ SEO Features (KLAR)
- Google Search Console integration
- Internal linking suggestions
- Sitemap generation
- Schema.org structured data

**Files:**
- `src/services/seo.service.ts`
- `src/services/internal-linking.service.ts`
- `src/services/structured-data.service.ts`
- `src/routes/seo.routes.ts`

### ✅ MCP Integration (KLAR)
- Anslutning till seo-mcp-server
- Multi-platform SEO data
- Competitor analysis
- Keyword tracking

**Files:**
- `src/services/mcp.service.ts`
- `src/routes/mcp.routes.ts`

---

## 🎯 Rekommendation

**För produktion: Använd WEBHOOK**

Eftersom:
1. ✅ Babylovesgrowth.ai har redan webhook "Connected" (enligt dina screenshots)
2. ✅ Real-time publicering (ingen delay)
3. ✅ Lägre serverbelastning
4. ✅ Perfekt för "auto-publish daily" use case

**Setup-tid:** ~10 minuter
1. Generera webhook API key
2. Uppdatera .env
3. Konfigurera i babylovesgrowth.ai dashboard
4. Testa med `/api/webhook/test`
5. Klart!

---

## 📝 Vad behöver göras nu?

### Steg 1: Deploy servern
```bash
# AWS EC2 (rekommenderat)
cd deploy
./server-setup.sh

# ELLER Codespaces för quick test
# Already configured in .devcontainer/
```

### Steg 2: Konfigurera Webhook
```bash
# Generera API key
openssl rand -hex 32

# Uppdatera .env
WEBHOOK_API_KEY=<din-genererade-nyckel>

# Restart server
npm run dev
```

### Steg 3: Anslut babylovesgrowth.ai
1. Gå till: https://babylovesgrowth.ai/dashboard
2. Integrations → Webhook
3. URL: `https://yourdomain.com/api/webhook/babylovegrowth`
4. Bearer Token: (från WEBHOOK_API_KEY)
5. Test Webhook

### Steg 4: Verifiera
```bash
# Testa endpoint
curl https://yourdomain.com/api/webhook/test

# Publicera första artikeln i babylovesgrowth.ai
# → Check Abicart admin för att verifiera
```

---

## 💡 Om du vill ha API Polling istället

Säg till så bygger jag det! Tar ~30 min att implementera:

```typescript
// Exempel implementation:
class BabyLoveGrowthAPIPoller {
  async pollForNewPosts() {
    const newPosts = await babylovegrowthAPI.getNewArticles();
    for (const post of newPosts) {
      await blogService.createBlogPost(post);
    }
  }
}

// Cron: Poll varje timme
cron.schedule('0 * * * *', () => poller.pollForNewPosts());
```

Men webhook är bättre för ditt use case! 🚀
