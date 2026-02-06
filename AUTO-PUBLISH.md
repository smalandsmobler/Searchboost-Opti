# Automatisk Bloggpublicering

## Översikt

Babylovesgrowth kan nu **automatiskt publicera blogginlägg till Smålandsmöblers Abicart varje dag**! 🚀

## Hur Det Fungerar

1. **Content Queue** - Blogginlägg lagras i `src/content/blog-queue.json`
2. **Cron Scheduler** - Kör automatiskt vid vald tid (standard: 09:00 dagligen)
3. **Auto-Publisher** - Hämtar nästa inlägg från kön och publicerar till Abicart
4. **Tracking** - Markerar publicerade inlägg som "published"

## Konfiguration

### 1. Aktivera Autopublicering

Redigera `.env` filen:

```env
# Aktivera autopublicering
ENABLE_AUTO_PUBLISH=true

# Schema för publicering (varje dag kl 9:00)
PUBLISH_SCHEDULE=0 9 * * *
```

### 2. Cron Schema Format

```
┌───────────── minut (0 - 59)
│ ┌───────────── timme (0 - 23)
│ │ ┌───────────── dag i månaden (1 - 31)
│ │ │ ┌───────────── månad (1 - 12)
│ │ │ │ ┌───────────── veckodag (0 - 6) (0 = Söndag)
│ │ │ │ │
* * * * *
```

**Exempel:**
```bash
# Varje dag kl 9:00
PUBLISH_SCHEDULE=0 9 * * *

# Varje dag kl 12:00
PUBLISH_SCHEDULE=0 12 * * *

# Varje måndag kl 8:00
PUBLISH_SCHEDULE=0 8 * * 1

# Varje halvtimme (för testing)
PUBLISH_SCHEDULE=*/30 * * * *
```

## Content Queue Management

### Lägg Till Nya Blogginlägg

Redigera `src/content/blog-queue.json`:

```json
[
  {
    "title": "Titel på blogginlägg",
    "content": "<h1>Titel</h1><p>Innehåll här...</p>",
    "excerpt": "Kort sammanfattning",
    "metaDescription": "SEO beskrivning",
    "metaKeywords": "nyckelord, här",
    "tags": ["tag1", "tag2"]
  }
]
```

### Kolla Status på Kön

```bash
curl http://localhost:3000/api/publish/status
```

**Svar:**
```json
{
  "success": true,
  "data": {
    "totalPosts": 3,
    "unpublished": 2,
    "published": 1
  }
}
```

## Manual Publicering

### Publicera Nu (Utan att vänta på schema)

```bash
curl -X POST http://localhost:3000/api/publish/now
```

Detta publicerar nästa inlägg från kön omedelbart.

## API Endpoints

### CRUD Operations

**Skapa nytt blogginlägg:**
```bash
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Mitt blogginlägg",
    "content": "<h1>Hej!</h1><p>Innehåll...</p>",
    "excerpt": "Sammanfattning",
    "metaDescription": "SEO text",
    "tags": ["baby", "möbler"]
  }'
```

**Uppdatera blogginlägg:**
```bash
curl -X PUT http://localhost:3000/api/blog/12345 \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Uppdaterad titel",
    "content": "<p>Nytt innehåll</p>"
  }'
```

**Ta bort blogginlägg:**
```bash
curl -X DELETE http://localhost:3000/api/blog/12345
```

**Hämta alla blogginlägg:**
```bash
curl http://localhost:3000/api/blog
```

**Sök blogginlägg:**
```bash
curl "http://localhost:3000/api/blog?search=barnmöbler&limit=5"
```

## Exempel-content

Projektet kommer med 3 färdiga blogginlägg i kön:

1. **Säkra Barnmöbler - Guide för Föräldrar**
2. **Inred Barnrummet - Inspiration och Idéer**
3. **Babyrummet - Komplett Checklista**

Dessa publiceras automatiskt när autopublicering är aktiverad!

## Utveckling och Testing

### Starta i Utvecklingsläge

```bash
npm run dev
```

### Testa Manuell Publicering

```bash
# Terminal 1: Kör servern
npm run dev

# Terminal 2: Trigga manuell publicering
curl -X POST http://localhost:3000/api/publish/now
```

### Återställ Kön (Markera alla som opublicerade)

Du kan skapa ett script för att återställa kön:

```javascript
const ContentManager = require('./dist/services/content-manager.service');
const manager = new ContentManager.ContentManager();
manager.resetQueue();
```

## Loggar

Autopublisher loggar till konsolen:

```
✅ Auto-publisher started with schedule: 0 9 * * * (Every day at 09:00)
🤖 Auto-publisher: Starting daily blog post...
📝 Published: "Säkra Barnmöbler - Guide för Föräldrar"
✅ Auto-publisher: Successfully published blog post
```

## Produktion

I produktion:

1. Använd en persistent token från Abicart (inte temporär 24h token)
2. Sätt upp process manager (PM2, systemd, etc.)
3. Konfigurera loggrotering
4. Övervaka publiceringsstatus

### PM2 Exempel

```bash
pm2 start npm --name "babylovesgrowth" -- start
pm2 logs babylovesgrowth
pm2 monit
```

## Felsökning

**Problem:** Autopublicering startar inte
- ✅ Kolla att `ENABLE_AUTO_PUBLISH=true` i `.env`
- ✅ Verifiera att cron schema är giltigt
- ✅ Kolla loggar för felmeddelanden

**Problem:** Inga blogginlägg publiceras
- ✅ Kolla att det finns opublicerade inlägg: `GET /api/publish/status`
- ✅ Verifiera Abicart credentials
- ✅ Testa manuell publicering: `POST /api/publish/now`

**Problem:** Fel vid publicering
- ✅ Kolla Abicart API token
- ✅ Verifiera Shop ID
- ✅ Kontrollera nätverksanslutning
- ✅ Läs error logs

## Nästa Steg

För att utöka systemet kan du:

1. 📝 **Integrera med CMS** - Hämta content från Contentful, Strapi, etc.
2. 🤖 **AI-generering** - Använd OpenAI/Claude för att generera innehåll
3. 📊 **Analytics** - Spåra publiceringsstatistik
4. 📧 **Notifikationer** - Email/Slack när blogginlägg publiceras
5. 🔄 **Import** - Importera befintliga bloggar från andra källor

Lycka till med autopubliceringen! 🎉
