# 🔗 BabyLoveGrowth Webhook Integration Guide

## Översikt

Denna integration tar emot blogginlägg från **babylovesgrowth.ai** via webhook och publicerar dem automatiskt till **Smålandsmöbler's Abicart**.

```
babylovesgrowth.ai (AI-genererad blogg)
    ↓ (webhook POST)
Babylovesgrowth Bridge API (denna server)
    ↓ (Abicart JSON-RPC)
smalandskontorsmobler.se (Abicart e-handel)
```

---

## 📋 Förutsättningar

1. ✅ Server igång (AWS/Codespaces/lokal)
2. ✅ Publik URL (för webhook mottagning)
3. ✅ Abicart credentials konfigurerade
4. ✅ BabyLoveGrowth.ai konto med webhook aktiverat

---

## 🔧 Steg 1: Konfigurera Webhook API Key

### Generera Säker API-nyckel

```bash
# Generera stark API-nyckel
openssl rand -hex 32
# Output: a3f8c9d1e2b4a5f6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

### Uppdatera .env

```bash
# I .env fil, lägg till:
WEBHOOK_API_KEY=a3f8c9d1e2b4a5f6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

---

## 🌐 Steg 2: Få Publik URL

### Om du kör på **AWS EC2**:

```bash
# Din webhook URL blir:
https://yourdomain.com/api/webhook/babylovegrowth
```

### Om du kör i **GitHub Codespaces**:

1. Starta servern: `npm run dev`
2. Gå till **PORTS** tab i VS Code
3. Port 3000 → Högerklicka → **Set Port Visibility → Public**
4. Kopiera forwarded URL:
   ```
   https://mystical-space-abc123.github.dev
   ```
5. Din webhook URL blir:
   ```
   https://mystical-space-abc123.github.dev/api/webhook/babylovegrowth
   ```

### Om du kör **lokalt** (för testning):

Använd ngrok för att exponera lokal server:
```bash
# Installera ngrok
npm install -g ngrok

# Starta ngrok tunnel
ngrok http 3000

# Output:
# Forwarding: https://abc123.ngrok.io → http://localhost:3000
```

Webhook URL:
```
https://abc123.ngrok.io/api/webhook/babylovegrowth
```

---

## 🎯 Steg 3: Konfigurera i BabyLoveGrowth.ai

### 1. Logga in på babylovesgrowth.ai

Gå till: https://babylovesgrowth.ai/dashboard

### 2. Aktivera Webhook Integration

1. Klicka på **Integrations**
2. Välj **Webhook** (Custom Webhook)
3. Konfigurera:

```
Webhook URL: https://yourdomain.com/api/webhook/babylovegrowth
Method: POST
Authentication: Bearer Token
Bearer Token: a3f8c9d1e2b4a5f6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
```

### 3. Test Webhook

Klicka på **Test Webhook** för att verifiera att allt fungerar.

---

## 📦 Webhook Payload Format

BabyLoveGrowth.ai skickar följande JSON:

```json
{
  "title": "Så väljer du rätt barnmöbler för ditt hem",
  "slug": "valj-ratt-barnmobler",
  "content_html": "<h1>Introduktion</h1><p>När du ska inreda barnrummet...</p>",
  "metaDescription": "Komplett guide till att välja barnmöbler",
  "heroImageUrl": "https://cdn.babylovesgrowth.ai/images/hero.jpg",
  "status": "publish",
  "tags": ["barnmöbler", "inredning", "guide"]
}
```

### Payload Fields:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Bloggtitel |
| `slug` | string | ⚪ | URL-slug |
| `content_html` | string | ✅* | HTML-innehåll |
| `content_markdown` | string | ✅* | Markdown-innehåll |
| `metaDescription` | string | ⚪ | SEO meta description |
| `heroImageUrl` | string | ⚪ | Featured image URL |
| `status` | string | ⚪ | `publish`, `draft`, `pending` |
| `tags` | array | ⚪ | Tags/kategorier |

*Minst en av `content_html` eller `content_markdown` krävs

---

## ✅ Steg 4: Testa Integrationen

### Manuell Test med curl:

```bash
# Testa webhook endpoint
curl -X POST https://yourdomain.com/api/webhook/babylovegrowth \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer a3f8c9d1e2b4a5f6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0" \
  -d '{
    "title": "Test Blogg från Webhook",
    "content_html": "<h1>Test</h1><p>Detta är ett test-inlägg!</p>",
    "metaDescription": "Test blogg",
    "status": "draft",
    "tags": ["test"]
  }'
```

**Förväntat svar:**
```json
{
  "success": true,
  "message": "Blog post published successfully",
  "postId": "12345"
}
```

### Test Endpoint (inbyggd):

```bash
# Använd inbyggd test-endpoint
curl https://yourdomain.com/api/webhook/test

# Output:
{
  "success": true,
  "message": "Webhook endpoint is active",
  "endpoint": "/api/webhook/babylovegrowth",
  "method": "POST"
}
```

---

## 🔍 Steg 5: Verifiera i Abicart

1. Logga in på Abicart admin: https://admin.abicart.se
2. Gå till **Artiklar** → **Blogginlägg**
3. Verifiera att det nya inlägget finns där
4. Kolla status (publicerad eller utkast)

---

## 📊 Övervaka Webhook Logs

### I Servern:

```bash
# Om du kör med PM2
pm2 logs babylovesgrowth

# Om du kör npm run dev
# Logs visas direkt i terminalen
```

**Förväntade logs:**
```
🔔 Webhook triggered from BabyLoveGrowth.ai
📥 Received webhook from BabyLoveGrowth: { title: '...', status: 'publish', hasContent: true }
✅ Successfully published to Abicart: { postId: '12345', title: '...', visible: true }
```

---

## 🚨 Felsökning

### Problem: 401 Unauthorized

**Orsak:** Fel API-nyckel eller saknas helt.

**Lösning:**
1. Verifiera att `WEBHOOK_API_KEY` är satt i `.env`
2. Kontrollera att samma nyckel används i babylovesgrowth.ai webhook config
3. Testa med curl för att verifiera

### Problem: 403 Host not allowed (Abicart)

**Orsak:** Din server-IP är inte whitelistad hos Abicart.

**Lösning:**
1. Kontakta Abicart support
2. Be dem whitelist din AWS/server IP
3. Hitta din IP:
   ```bash
   curl https://api.ipify.org
   ```

### Problem: Webhook når inte servern

**Orsak:** Port inte public/forwarded, eller server nere.

**Lösning:**
1. Verifiera att servern körs: `curl https://yourdomain.com/health`
2. För Codespaces: Sätt port 3000 till Public
3. För AWS: Kontrollera Security Groups (port 3000/443 öppen)
4. Använd ngrok för lokal testning

### Problem: Content visas inte korrekt i Abicart

**Orsak:** HTML/Markdown format inte kompatibelt.

**Lösning:**
1. Kontrollera webhook logs för vad som skickades
2. Testa att publicera manuellt via `/api/blog` endpoint först
3. Verifiera att `content_html` innehåller giltig HTML

---

## 🎛️ Avancerade Inställningar

### Auto-Publish vs Draft

Styrs av `status` fältet i webhook payload:

```json
{
  "status": "publish"  // Publiceras direkt
}
```

```json
{
  "status": "draft"  // Sparas som utkast
}
```

### Custom Transformation Logic

Redigera `/src/services/babylovegrowth-webhook.service.ts`:

```typescript
private transformToAbicartFormat(payload: BabyLoveGrowthWebhookPayload) {
  // Lägg till custom transformation här
  // Ex: bildoptimering, custom tags, etc.
}
```

---

## 🔄 Alternativ: API Polling (istället för Webhook)

Om webhook inte fungerar, kan vi bygga en poller:

```typescript
// Poll babylovesgrowth.ai API varje timme
cron.schedule('0 * * * *', async () => {
  const newPosts = await babylovegrowthAPI.getNewPosts();
  for (const post of newPosts) {
    await blogService.createBlogPost(post);
  }
});
```

**Fördel:** Ingen public URL behövs
**Nackdel:** Fördröjning (upp till 1 timme)

---

## 📝 Sammanfattning

✅ **Webhook URL:** `https://yourdomain.com/api/webhook/babylovegrowth`
✅ **Authentication:** Bearer token (från `WEBHOOK_API_KEY`)
✅ **Payload format:** JSON med `title`, `content_html`, `status`, etc.
✅ **Transformation:** Automatisk konvertering till Abicart format
✅ **Publicering:** Direkt till smalandskontorsmobler.se via Abicart API

---

## 🎯 Nästa Steg

1. ✅ Generera webhook API key
2. ✅ Starta servern (AWS/Codespaces)
3. ✅ Konfigurera i babylovesgrowth.ai
4. ✅ Testa med test endpoint
5. ✅ Generera första bloggen i babylovesgrowth.ai
6. ✅ Verifiera i Abicart admin

**När webhook är konfigurerad: Varje gång babylovesgrowth.ai genererar en ny blogg → automatisk publicering till Smålandsmöbler! 🚀**
