# 🚀 SEO Powerhouse Features

## Översikt

Babylovesgrowth har nu **avancerade SEO-funktioner** med Google Search Console, Analytics, SEranking integration, smart internlänkning och strukturerad data!

---

## 📊 Funktioner

### 1. **Google Search Console Integration**

Hämta search performance data direkt från GSC.

**Endpoint:** `GET /api/seo/gsc`

**Exempel:**
```bash
curl "http://localhost:3000/api/seo/gsc?startDate=2024-01-01&endDate=2024-01-31"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalClicks": 1250,
    "totalImpressions": 45000,
    "averageCTR": 0.0278,
    "averagePosition": 8.5,
    "topQueries": [
      {
        "keys": ["barnmöbler"],
        "clicks": 150,
        "impressions": 5000,
        "ctr": 0.03,
        "position": 5.2
      }
    ],
    "topPages": [...]
  }
}
```

---

### 2. **SEO Report per Blogginlägg**

Få detaljerad SEO-rapport för varje blogginlägg.

**Endpoint:** `GET /api/seo/report/:id`

**Exempel:**
```bash
curl http://localhost:3000/api/seo/report/12345
```

**Response:**
```json
{
  "success": true,
  "data": {
    "post": {
      "id": "12345",
      "title": "Säkra Barnmöbler",
      "url": "https://babylovesgrowth.se/blog/sakra-barnmobler"
    },
    "seo": {
      "clicks": 45,
      "impressions": 1200,
      "ctr": 0.0375,
      "position": 7.8,
      "topKeywords": [
        "barnmöbler säkerhet",
        "säkra möbler baby",
        "barnrum säkerhet"
      ]
    }
  }
}
```

---

### 3. **Smart Internlänkning** 🔗

Automatisk analys och förslag på internlänkar mellan blogginlägg.

**Hur det fungerar:**
1. Analyserar keywords i alla blogginlägg
2. Beräknar relevans mellan inlägg
3. Föreslår smart anchor text
4. Genererar länkförslag med relevans-score

**Endpoint:** `GET /api/seo/internal-links`

**Exempel:**
```bash
curl "http://localhost:3000/api/seo/internal-links?limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestions": [
      {
        "sourcePostId": "123",
        "sourcePostTitle": "Säkra Barnmöbler",
        "targetPostId": "456",
        "targetPostTitle": "Inred Barnrummet",
        "anchorText": "barnrum",
        "relevanceScore": 0.45,
        "reason": "Common keywords: barnrum, möbler, säkerhet"
      }
    ],
    "total": 25
  }
}
```

**Applicera Länk Automatiskt:**
```bash
curl -X POST http://localhost:3000/api/seo/internal-links/apply \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "123",
    "targetPostId": "456",
    "anchorText": "barnrum"
  }'
```

---

### 4. **XML Sitemap med Internlänk-struktur**

Genererar sitemap.xml med annotations om internlänkar.

**Endpoint:** `GET /api/seo/sitemap`

**Exempel:**
```bash
curl http://localhost:3000/api/seo/sitemap
```

**Output:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://babylovesgrowth.se/blog/sakra-barnmobler</loc>
    <lastmod>2024-01-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    <!-- Internal Links -->
    <!-- Link to: Inred Barnrummet -->
    <!-- Link to: Babyrummet Checklista -->
  </url>
</urlset>
```

---

### 5. **Schema.org Strukturerad Data** 📋

Genererar rich snippets för Google.

**Typer:**
- ✅ BlogPosting
- ✅ Product
- ✅ FAQ
- ✅ HowTo
- ✅ Breadcrumb
- ✅ Organization

**Endpoint:** `GET /api/seo/structured-data/:id`

**Exempel:**
```bash
curl http://localhost:3000/api/seo/structured-data/12345
```

**Response:**
```json
{
  "success": true,
  "data": {
    "schemas": [
      {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": "Säkra Barnmöbler - Guide",
        "description": "Komplett guide om säkra barnmöbler",
        "image": "https://...",
        "author": {...},
        "publisher": {...},
        "datePublished": "2024-01-15"
      },
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [...]
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Smålandsmöbler",
        "url": "https://..."
      }
    ],
    "htmlSnippet": "<script type=\"application/ld+json\">...</script>"
  }
}
```

---

## 🎯 Setup

### 1. Google Search Console

**Få API Key:**
1. Gå till [Google Cloud Console](https://console.cloud.google.com/)
2. Skapa nytt projekt
3. Aktivera "Google Search Console API"
4. Skapa OAuth 2.0 credentials
5. Ladda ner credentials.json

**Konfigurera i .env:**
```env
# Google Search Console
GSC_API_KEY=your_oauth_token_here
GSC_SITE_URL=https://babylovesgrowth.se
```

### 2. SEranking (Valfritt)

**Få API Key:**
1. Logga in på [SEranking](https://seranking.com/)
2. Gå till Settings → API
3. Generera API key

**Konfigurera i .env:**
```env
# SEranking
SERANKING_API_KEY=your_seranking_key_here
```

---

## 💡 Användningsfall

### Case 1: Optimera Befintliga Bloggar

```bash
# 1. Hämta SEO-rapport för alla bloggar
curl http://localhost:3000/api/seo/gsc?startDate=2024-01-01&endDate=2024-01-31

# 2. Identifiera låg CTR bloggar
# 3. Få internlänk-förslag
curl http://localhost:3000/api/seo/internal-links

# 4. Applicera top 5 internlänkar
# 5. Generera updated sitemap
curl http://localhost:3000/api/seo/sitemap > sitemap.xml
```

### Case 2: Publicera Ny Blogg med Max SEO

```bash
# 1. Skapa blogginlägg
curl -X POST http://localhost:3000/api/blog \
  -H "Content-Type: application/json" \
  -d @new-blog.json

# 2. Hämta strukturerad data
curl http://localhost:3000/api/seo/structured-data/NEW_ID

# 3. Få internlänk-förslag för nya bloggen
curl http://localhost:3000/api/seo/internal-links

# 4. Applicera relevanta länkar
# 5. Uppdatera sitemap
```

### Case 3: Månadsvis SEO-Rapport

```bash
#!/bin/bash
# monthly-seo-report.sh

START_DATE=$(date -d "30 days ago" +%Y-%m-%d)
END_DATE=$(date +%Y-%m-%d)

# GSC Data
curl "http://localhost:3000/api/seo/gsc?startDate=$START_DATE&endDate=$END_DATE" \
  > monthly-report.json

# Top performing posts
# Low CTR posts that need optimization
# New internal linking opportunities
```

---

## 🤖 Automation Ideas

### 1. **Auto-Internal Linking**

Kör dagligen efter ny blogg publiceras:
```javascript
// Auto-link after publish
const suggestions = await getSuggestions();
const topSuggestions = suggestions.slice(0, 3);

for (const suggestion of topSuggestions) {
  if (suggestion.relevanceScore > 0.3) {
    await applyInternalLink(suggestion);
  }
}
```

### 2. **Weekly SEO Digest**

Email med:
- Top performing posts
- Keyword opportunities
- Internal linking suggestions
- New backlinks
- Position changes

### 3. **Auto-Structured Data**

Lägg automatiskt till Schema.org vid publicering:
```javascript
// In auto-publisher
const post = await createBlogPost(...);
const schemas = await generateStructuredData(post.uid);
// Inject into post HTML
```

---

## 📈 Metrics Dashboard (Future)

Planerade features:
- Real-time SEO dashboard
- Keyword rank tracking graph
- CTR improvement suggestions
- Competitor analysis
- Backlink monitoring
- Page speed insights

---

## 🔗 Integration Examples

### Google Analytics 4

```javascript
// Track blog post views
gtag('event', 'page_view', {
  page_title: post.title,
  page_location: post.url,
  page_path: `/blog/${post.slug}`
});
```

### SEranking Webhook

```javascript
// Notify SEranking when new blog published
await axios.post('https://seranking.webhook.url', {
  event: 'blog_published',
  url: post.url,
  keywords: post.keywords
});
```

---

## 🎓 Best Practices

### Internlänkning

✅ **DO:**
- Använd relevanta anchor texts
- Länka till 2-5 relaterade inlägg
- Diversifiera anchor text
- Länka från äldre till nyare inlägg också

❌ **DON'T:**
- Överdriv (max 5-7 internlänkar per post)
- Använd samma anchor text överallt
- Länka irrelevanta inlägg
- Glöm nofollow på externa länkar

### Strukturerad Data

✅ **DO:**
- Testa med [Google Rich Results Test](https://search.google.com/test/rich-results)
- Använd alla relevanta schema types
- Håll data synkad med faktiskt innehåll
- Inkludera images och dates

❌ **DON'T:**
- Fake ratings eller reviews
- Duplicate schema på samma sida
- Missrepresentera innehåll

---

## 🆘 Troubleshooting

**Problem:** GSC API returnerar 403
- **Lösning:** Verifiera OAuth token, kontrollera att API är enabled

**Problem:** Inga internlänk-förslag
- **Lösning:** Behöver minst 3-5 blogginlägg för meningsfulla förslag

**Problem:** Strukturerad data validerar inte
- **Lösning:** Använd [Google's validator](https://validator.schema.org/)

---

## 🚀 Roadmap

- [ ] Google Analytics 4 integration
- [ ] Automated A/B testing för titles
- [ ] AI-powered content suggestions
- [ ] Backlink monitoring
- [ ] Competitor keyword tracking
- [ ] Auto-image optimization
- [ ] Page speed insights API

---

## 📞 Support

För frågor om SEO-features, se dokumentationen eller [open an issue](https://github.com/smalandsmobler/Babylovesgrowth/issues).

**Happy SEO! 📈🚀**
