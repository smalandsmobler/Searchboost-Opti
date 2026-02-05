# Abicart Integration för Babylovesgrowth

## Översikt

Detta projekt integrerar **Babylovesgrowth** med **Smålandsmöblers Abicart e-handel** för att hämta och visa blogginlägg med SEO-optimering.

## Funktioner

✅ **Abicart JSON-RPC 2.0 API Integration**
- Hämtar blogginlägg från Abicart
- Stöd för sökning och filtrering
- Automatisk datatransformering

✅ **SEO-Optimering**
- Meta tags (title, description, keywords)
- Open Graph för sociala medier
- Twitter Cards
- Schema.org strukturerad data (JSON-LD)
- Canonical URLs

✅ **Prestanda**
- Inbyggd caching (5 minuter TTL)
- Effektiv API-användning
- Snabba svarstider

✅ **API Endpoints**
- `GET /api/blog` - Lista alla blogginlägg
- `GET /api/blog/:id` - Hämta enskilt blogginlägg
- `GET /api/blog/:id/seo` - Hämta SEO-metadata
- `POST /api/blog/cache/clear` - Rensa cache

## Installation

### 1. Installera dependencies

```bash
npm install
```

### 2. Konfigurera Abicart API

Skapa en `.env` fil baserad på `.env.example`:

```bash
cp .env.example .env
```

Redigera `.env` och lägg till dina Abicart credentials:

```env
# Server Configuration
PORT=3000
BASE_URL=https://babylovesgrowth.se

# Abicart API Configuration
ABICART_API_URL=https://admin.abicart.se/backend/jsonrpc/v1
ABICART_API_KEY=din_auth_token_här
ABICART_SHOP_ID=din_butiks_id_här
```

### 3. Skaffa Abicart API Credentials

**Steg 1: Skapa gratis demokonto**

För att använda Abicart API behöver du först skapa ett **gratis demokonto**:

1. Gå till [Abicart](https://www.abicart.com/)
2. Skapa ett gratis demokonto
3. Du får tillgång till en testbutik där du kan skapa artiklar och blogginlägg

**Steg 2: Få API-token**

Det finns två typer av tokens i Abicart:

1. **Temporär token (24h)** - För testning:
   ```javascript
   // Använd Admin.login för att få en 24h token
   method: "Admin.login"
   params: ["användarnamn", "lösenord"]
   ```

2. **Persistent token** - För produktion:
   ```javascript
   // Använd AuthToken.create för att skapa en persistent token
   method: "AuthToken.create"
   // Denna kan bara anropas från en session autentiserad via Admin.login
   ```

**Steg 3: Konfigurera credentials**

När du har din token:
1. Lägg till token i `.env` filen som `ABICART_API_KEY`
2. Lägg till ditt shop ID som `ABICART_SHOP_ID`

**API Endpoint:**
```
https://admin.abicart.se/backend/jsonrpc/v1/
```

**Autentisering:**
Abicart använder context-baserad autentisering där auth token skickas som GET parameter eller cookie, inte via Bearer header.

## Användning

### Starta utvecklingsserver

```bash
npm run dev
```

Servern startar på `http://localhost:3000`

### Testa API:et

**Hämta alla blogginlägg:**
```bash
curl http://localhost:3000/api/blog
```

**Hämta specifikt blogginlägg:**
```bash
curl http://localhost:3000/api/blog/123
```

**Hämta SEO-metadata:**
```bash
curl http://localhost:3000/api/blog/123/seo
```

**Sök blogginlägg:**
```bash
curl "http://localhost:3000/api/blog?search=barnmöbler&limit=5"
```

**Filtrera efter kategori:**
```bash
curl "http://localhost:3000/api/blog?category=baby&limit=10"
```

## API Dokumentation

### GET /api/blog

Hämta lista med blogginlägg.

**Query parameters:**
- `limit` (number) - Antal inlägg att hämta (default: 10)
- `offset` (number) - Offset för paginering (default: 0)
- `search` (string) - Sökfråga
- `tag` (string) - Filtrera efter tag
- `category` (string) - Filtrera efter kategori
- `author` (string) - Filtrera efter författare

**Response:**
```json
{
  "success": true,
  "data": {
    "posts": [...],
    "total": 25,
    "limit": 10,
    "offset": 0
  }
}
```

### GET /api/blog/:identifier

Hämta enskilt blogginlägg via UID eller slug.

**Response:**
```json
{
  "success": true,
  "data": {
    "uid": "123",
    "title": "Bästa barnmöblerna 2024",
    "content": "...",
    "excerpt": "...",
    "author": "Smålandsmöbler",
    "publishedDate": "2024-01-15",
    "imageUrl": "...",
    "slug": "basta-barnmoblerna-2024",
    "seoTitle": "...",
    "metaDescription": "..."
  }
}
```

### GET /api/blog/:identifier/seo

Hämta SEO-metadata för blogginlägg.

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Bästa barnmöblerna 2024 | Smålandsmöbler",
    "description": "...",
    "keywords": "...",
    "canonical": "https://babylovesgrowth.se/blog/basta-barnmoblerna-2024",
    "ogTitle": "...",
    "ogDescription": "...",
    "ogImage": "...",
    "structuredData": {...}
  }
}
```

## Arkitektur

```
src/
├── types/
│   └── abicart.types.ts      # TypeScript typer för Abicart
├── services/
│   ├── abicart.client.ts     # JSON-RPC 2.0 API klient
│   └── blog.service.ts       # Blog service med caching
├── routes/
│   └── blog.routes.ts        # Express API routes
├── utils/
│   └── seo.helper.ts         # SEO metadata generering
├── app.ts                    # Express app konfiguration
└── index.ts                  # Server entry point
```

## Tester

Kör tester:

```bash
npm test
```

Kör med coverage:

```bash
npm test -- --coverage
```

## SEO Features

### Meta Tags
Automatiskt genererade meta tags för varje blogginlägg:
- Title, description, keywords
- Canonical URL
- Open Graph tags
- Twitter Card tags

### Strukturerad Data
Schema.org BlogPosting markup för bättre sökmotorsynlighet.

### URL-vänliga Slugs
Automatisk generering av SEO-vänliga URL slugs från titlar.

## Caching

Bloggdata cachas automatiskt i 5 minuter för bättre prestanda. Cache kan rensas manuellt:

```bash
curl -X POST http://localhost:3000/api/blog/cache/clear
```

## Produktion

### Bygg projektet

```bash
npm run build
```

### Kör i produktion

```bash
npm start
```

### Docker

```bash
docker build -t babylovesgrowth .
docker run -p 3000:3000 --env-file .env babylovesgrowth
```

## Support

- Abicart API Dokumentation: https://developer.abicart.se/
- Abicart Support: https://www.abicart.com/

## Nästa Steg

För att använda detta i produktion:

1. ✅ Konfigurera Abicart API credentials
2. ✅ Verifiera att blogginlägg kan hämtas
3. 🔄 Bygg frontend för att visa blogginlägg
4. 🔄 Implementera fullständig SEO i frontend
5. 🔄 Sätt upp domän och SSL
6. 🔄 Deploy till produktion

## Kontakt

För frågor om integrationen, kontakta utvecklingsteamet.
