# ⚠️ Förutsättningar & Begränsningar

**System:** MCP SEO Platform
**Syfte:** Tekniska requirements, incompatibilities & limitations
**Datum:** 2026-02-06

---

## 📋 Innehållsförteckning

1. [Systemkrav](#systemkrav)
2. [Stödda Plattformar](#stödda-plattformar)
3. [OMÖJLIGA Plattformar](#omöjliga-plattformar)
4. [Plugin-konflikter](#plugin-konflikter)
5. [API-begränsningar](#api-begränsningar)
6. [Tekniska blockers](#tekniska-blockers)
7. [Kund-förutsättningar](#kund-förutsättningar)

---

## ✅ Systemkrav

### För MCP Platform (vår sida)

**Server:**
- Node.js 18+
- 2GB RAM minimum
- 20GB SSD storage
- Linux (Ubuntu 20.04+/Debian 11+)
- Static IP (för Abicart whitelist)

**Nätverk:**
- Publikt tillgänglig HTTPS endpoint
- Port 443 öppen (SSL)
- Port 3000 för API (eller custom)
- Ingen firewall-blockering av utgående API-calls

**Dependencies:**
- npm/yarn package manager
- Git för deployment
- PM2 eller liknande process manager

---

### För Kunden

**Minimum:**
- ✅ Aktivt e-handelsabonnemang (Abicart/WooCommerce/Shopify)
- ✅ Admin-access till plattformen
- ✅ Domän med SSL-certifikat
- ✅ Email för support & notifikationer

**Rekommenderat:**
- ✅ Google Search Console-konto (för SEO-data)
- ✅ Google Analytics-konto (för tracking)
- ✅ Befintlig content-strategi eller content guidelines

**Nice to have:**
- Brand guidelines (tone of voice, prohibited words, etc.)
- SEO keyword-lista
- Competitor list

---

## 🟢 Stödda Plattformar

### Tier 1: Fullt Stödda ✅

**Abicart**
- ✅ JSON-RPC 2.0 API
- ✅ Blog/artikel-publicering
- ✅ Product integration
- ✅ Categories & tags
- ✅ Image upload
- ⚠️ **Kräver:** IP whitelisting hos Abicart support

**WooCommerce (WordPress)**
- ✅ WordPress REST API
- ✅ WooCommerce API v3
- ✅ Gutenberg blocks
- ✅ Product sync
- ✅ Plugin: Application Passwords (WP 5.6+)
- ⚠️ **Kräver:** WordPress 5.9+ och WooCommerce 6.0+

**Shopify**
- ✅ Shopify Admin API 2024-01
- ✅ Blog & pages
- ✅ Product metafields
- ✅ Collections
- ⚠️ **Kräver:** Shopify Plus eller högre för vissa features

---

### Tier 2: Möjliga (med extra arbete) ⚠️

**Wix**
- ⚠️ Wix REST API (begränsad)
- ⚠️ Blog via API finns, men begränsad formatting
- ⚠️ SEO-fält tillgängliga
- ❗ **Begränsning:** Wix API är mycket restriktiv
- ⏱️ **Extra utvecklingstid:** 2-3 veckor
- 💰 **Setup fee:** +5,000 SEK

**Squarespace**
- ⚠️ Squarespace API beta
- ⚠️ Blogging endpoints finns
- ❗ **Begränsning:** API inte fully documented
- ⏱️ **Extra utvecklingstid:** 3-4 veckor
- 💰 **Setup fee:** +8,000 SEK

**BigCommerce**
- ✅ BigCommerce API v3
- ✅ Content Management API
- ⚠️ Mindre testad än Tier 1
- ⏱️ **Utvecklingstid:** 1-2 veckor
- 💰 **Setup fee:** +3,000 SEK

**Magento 2**
- ✅ REST API
- ✅ GraphQL support
- ⚠️ Komplex setup (Magento är tungt)
- ❗ **Kräver:** Magento 2.4+
- ⏱️ **Utvecklingstid:** 3-4 veckor
- 💰 **Setup fee:** +10,000 SEK

---

## 🔴 OMÖJLIGA Plattformar

### Blockerade av tekniska skäl

**Webflow**
- ❌ **Ingen officiell API för CMS** (endast site design API)
- ❌ CMS-access kräver manuell Zapier/Make integration
- 🚫 **Status:** OMÖJLIG direkt integration
- 💡 **Workaround:** Webhook → Zapier → Webflow (kunden sköter själv)

**Weebly**
- ❌ API avslutades 2021
- ❌ Ingen programmatic content management
- 🚫 **Status:** OMÖJLIG

**GoDaddy Website Builder**
- ❌ Ingen public API
- ❌ Helt closed ecosystem
- 🚫 **Status:** OMÖJLIG

**Wix ADI (Artificial Design Intelligence)**
- ❌ ADI-sites har ingen API-access
- ❌ Måste migrera till Wix Editor först
- 🚫 **Status:** OMÖJLIG för ADI-sites

**Jimdo**
- ❌ Ingen public content API
- ❌ Endast site-builder interface
- 🚫 **Status:** OMÖJLIG

**One.com**
- ❌ Ingen API
- ❌ Ingen webhook support
- 🚫 **Status:** OMÖJLIG

---

### Blockerade av licensing/ToS

**WordPress.com (Hosted)**
- ❌ Free tier: Ingen API-access
- ⚠️ Personal/Premium: Begränsad API
- ✅ Business/Commerce: Full REST API
- 🚫 **Status:** OMÖJLIG för Free/Personal plans

**Shopify Starter**
- ❌ Ingen Admin API-access på Starter-plan
- ✅ Endast Basic Shopify och högre
- 🚫 **Status:** OMÖJLIG för Starter-plan

---

## ⚠️ Plugin-konflikter

### WordPress/WooCommerce

#### Caching Plugins 🔥 HÖG RISK

**WP Rocket**
- ⚠️ Kan cacha API-responses
- ✅ **Fix:** Exclude `/wp-json/` från cache
- ✅ **Fix:** Disable cache för inloggade användare

**W3 Total Cache**
- ⚠️ Aggressive database caching kan blocka updates
- ✅ **Fix:** Exclude object cache för `posts` & `postmeta`

**LiteSpeed Cache**
- ⚠️ Edge Side Includes kan bryta REST API
- ✅ **Fix:** Disable ESI för API endpoints

**Cloudflare (Page Rules)**
- ⚠️ Om satt till "Cache Everything"
- ✅ **Fix:** Bypass cache för `/wp-json/*`

---

#### Security Plugins 🔥 HÖG RISK

**Wordfence**
- 🔥 Rate limiting kan blocka våra API-calls
- 🔥 Firewall rules kan blocka webhook POST requests
- ✅ **Fix:** Whitelist vår server-IP
- ✅ **Fix:** Disable rate limiting för `/wp-json/wp/v2/posts`

**Sucuri Security**
- 🔥 Blockar POST requests från okända IPs
- ✅ **Fix:** Whitelist vår IP i Sucuri firewall

**iThemes Security**
- ⚠️ Kan blockera REST API helt
- ✅ **Fix:** Enable REST API i settings
- ✅ **Fix:** Whitelist vår IP

**All In One WP Security**
- ⚠️ Login lockdown kan påverka Application Passwords
- ✅ **Fix:** Allow Application Passwords

---

#### SEO Plugins ⚠️ MEDEL RISK

**Yoast SEO**
- ✅ Generellt OK - vi använder deras metadata
- ⚠️ Kan overwrite våra meta titles/descriptions
- ✅ **Fix:** Sätt våra meta fields som priority

**Rank Math**
- ✅ Generellt kompatibel
- ⚠️ Auto-generate meta kan kollidera
- ✅ **Fix:** Disable auto-generation för posts från vår API

**All in One SEO**
- ✅ Kompatibel
- ⚠️ Breadcrumbs-generering kan konfliktera
- ✅ **Fix:** Manual breadcrumb config

---

#### Incompatible Plugins 🚫 OMÖJLIGA

**Disable REST API**
- 🚫 Blockerar ALL REST API-access
- 🚫 **Fix:** INGEN - pluginen måste avinstalleras

**Disable WP REST API**
- 🚫 Samma som ovan
- 🚫 **Fix:** Måste avaktiveras helt

**WP REST API Disable**
- 🚫 Samma problem
- 🚫 **Fix:** Avinstallera

---

### Abicart

#### Konfliktande Moduler

**Custom Blog Plugins (tredje parts)**
- ⚠️ Om kunden har custom blog-system redan
- ✅ **Fix:** Vi kan ofta köra parallellt, men risk för dubbelposter
- ✅ **Rekommendation:** Disable deras plugin först

**SEO-tillägg för Abicart**
- ⚠️ Kan overwrite våra meta-tags
- ✅ **Fix:** Koordinera med deras setup

---

### Shopify

#### Konfliktande Apps

**Blog Studio**
- ⚠️ Kan ta ownership av blog posts
- ✅ **Fix:** Använd Shopify native blog istället

**PageFly / Shogun Page Builder**
- ⚠️ Om de "tar över" blog-templates
- ✅ **Fix:** Exclude blog från page builder

**SEO Manager / Plug in SEO**
- ⚠️ Kan overwrite metafields
- ✅ **Fix:** Priority för våra metafields

---

## 🔒 API-begränsningar

### Rate Limits (per plattform)

**Abicart**
- ❗ **Limit:** 100 requests/minut
- ❗ **Daily:** 10,000 requests/dag
- ⚠️ **Risk:** Stora batch-imports kan trigga limit
- ✅ **Fix:** Vi throttlar automatiskt till 80 req/min

**WordPress REST API**
- ✅ **Ingen hard limit** (beror på hosting)
- ⚠️ Hosting kan ha egna limits (typ Kinsta: 120 req/min)
- ✅ **Fix:** Check med kundens hosting provider

**Shopify**
- ❗ **Limit:** 2 requests/sekund (Basic Shopify)
- ❗ **Limit:** 4 requests/sekund (Shopify Plus)
- ❗ **Bucket:** 40 credits, refill 2/sek
- ✅ **Fix:** Vi använder leaky bucket algorithm

**BabyLoveGrowth.ai**
- ❗ **Limit:** 30 artiklar/månad (Professional plan)
- ❗ **Limit:** 100 artiklar/månad (Enterprise)
- ⚠️ **Risk:** Om kunden vill >100 måste vi förhandla custom deal
- ✅ **Fix:** Multiple accounts eller enterprise negotiation

**Google Search Console API**
- ❗ **Limit:** 1,200 requests/minut
- ❗ **Daily:** Unlimited (men subject to quota)
- ✅ Generellt inget problem för oss

**Claude API (Anthropic)**
- ❗ **Limit:** Tier-based (vi är Tier 2: 50k tokens/min)
- ⚠️ **Risk:** Vid >50 samtidiga kunder kan vi nå limit
- ✅ **Fix:** Queue system + caching
- ✅ **Plan:** Upgrade till Tier 3 vid >40 kunder

---

## 🚫 Tekniska Blockers

### Hosting-relaterade

**Delad Hosting med IP-blacklist**
- 🔥 Om kundens shared hosting-IP är blacklistad av Cloudflare/AWS
- 🚫 Våra API-calls kan blockas
- ✅ **Check:** Test API-connectivity före signup

**Ingen HTTPS**
- 🔥 Webhooks kräver HTTPS
- 🔥 Många APIs kräver SSL
- 🚫 **Blocker:** Kunden MÅSTE ha SSL-cert
- ✅ **Fix:** Free SSL via Let's Encrypt (vi kan hjälpa)

**Firewall-restriktioner (företagsnätverk)**
- ⚠️ Om kunden kör site bakom corporate firewall
- ⚠️ Utgående API-calls kan vara blockerade
- ✅ **Fix:** Whitelist våra endpoints i deras firewall

**HTTP Basic Auth på staging/development**
- ⚠️ Webhooks kan inte autentisera mot Basic Auth
- ✅ **Fix:** Disable Basic Auth för vårt webhook endpoint
- ✅ **Alt:** Use IP whitelist instead

---

### Abicart-specifika

**IP Whitelist Requirement**
- ❗ **KRITISKT:** Abicart kräver IP whitelist
- ⏱️ **Lead time:** 2-5 arbetsdagar för Abicart support att lägga till
- 🚫 **Blocker:** Vi kan inte gå live förrän IP är whitelistad
- ✅ **Process:**
  1. Vi ger kunden vår static IP
  2. Kunden kontaktar Abicart support
  3. Abicart whitelistar vår IP
  4. Vi kan börja integrera

**Abicart-konto måste vara aktivt**
- 🔥 Om kunden har pausat/avslutat Abicart-abonnemang
- 🚫 API fungerar inte
- ✅ **Check:** Verify account status före onboarding

---

### WordPress-specifika

**Application Passwords ej stödda**
- ❗ Kräver WordPress 5.6+
- ❗ Kräver HTTPS
- ❗ Måste aktiveras i wp-config.php
- ✅ **Fix:** Vi guidar kunden att enable Application Passwords

**XML-RPC disabled**
- ⚠️ Om XML-RPC är disabled (säkerhetsskäl)
- ✅ **OK:** Vi använder REST API istället (ej XML-RPC)

**Old WordPress version**
- 🔥 WordPress <5.9 har begränsad REST API
- 🚫 **Requirement:** WordPress 5.9+ minimum
- ✅ **Fix:** Kunden måste uppdatera WP först

---

### Shopify-specifika

**Shopify Starter Plan**
- 🚫 Ingen API-access
- 🚫 **Blocker:** Kunden måste uppgradera till Basic Shopify minimum
- 💰 **Cost impact:** Shopify Basic = 299 SEK/mån (vs Starter 49 SEK/mån)

**Custom Storefront (Hydrogen)**
- ⚠️ Shopify Hydrogen (headless) kräver custom integration
- ⏱️ **Extra dev:** 4-6 veckor
- 💰 **Setup fee:** +15,000 SEK

---

## ✅ Kund-förutsättningar

### Tekniska

**Måste ha:**
- ✅ Admin-access till e-handelsplattform
- ✅ API credentials (vi hjälper att generera)
- ✅ Email för notifikationer
- ✅ Domän med fungerande SSL

**Bra att ha:**
- ✅ FTP/SSH access (för debugging)
- ✅ Google Search Console-access
- ✅ Google Analytics-access

---

### Innehållsmässiga

**Rekommenderat:**
- Brand guidelines (tone of voice)
- List of prohibited words/topics
- Target keywords (vi kan hjälpa ta fram)
- Competitor list

**Nice to have:**
- Existing content examples
- Product catalog (för product-blog integration)
- FAQs (för AI training)

---

### Organisatoriska

**Nödvändigt:**
- ✅ Beslutsbefogenhet att signera avtal
- ✅ Tillgång till betalning (autogiro/kort)
- ✅ Kontaktperson för tech support

**Rekommenderat:**
- Dedikerad marketing contact
- Feedback-process för innehåll
- Editorial calendar (vi kan skapa om saknas)

---

## 🎯 Pre-signup Checklist

### För Sales Rep

Innan du stänger dealen, verifiera:

**Plattform:**
- [ ] Vilken e-handelsplattform? (Abicart/WooCommerce/Shopify/Annat)
- [ ] Vilken plan/tier? (Check att API-access finns)
- [ ] Version? (WordPress: 5.9+, Shopify: Basic+, etc.)

**Technical Access:**
- [ ] Har kunden admin-access?
- [ ] Har kunden SSL-certifikat?
- [ ] Finns företagsfirewall som kan blocka?

**Plugins/Apps:**
- [ ] Använder kunden Wordfence/security plugins?
- [ ] Använder kunden caching?
- [ ] Har kunden "Disable REST API" plugins?

**API Limitations:**
- [ ] (Abicart) Har kunden kontaktat support för IP whitelist?
- [ ] (WordPress) Är Application Passwords enabled?
- [ ] (Shopify) Är kunden på Basic+ plan?

**Content:**
- [ ] Har kunden brand guidelines?
- [ ] Finns prohibited topics?
- [ ] Accepterar kunden AI-genererat content?

---

## 🚨 Red Flags (avböj kund)

**Instant disqualifiers:**
- 🚫 Plattform på "OMÖJLIGA" listan
- 🚫 Vill inte uppgradera från Shopify Starter
- 🚫 Vägrar whitelista IP (Abicart-kunder)
- 🚫 Har "Disable REST API" och vägrar ta bort
- 🚫 Ingen admin-access (vill köra via mellanhand)
- 🚫 Inget SSL-certifikat och vägrar fixa

**Yellow flags (gå vidare med försiktighet):**
- ⚠️ WordPress <5.9 (kräver update först)
- ⚠️ Wordfence/security plugins (kan fixas med whitelist)
- ⚠️ Shared hosting med låga API limits (kan vara långsamt)
- ⚠️ Vill ha >100 artiklar/mån (kräver custom BabyLoveGrowth-deal)

---

## 🔧 Troubleshooting Guide

### "API calls blocked"

**Check:**
1. SSL-certifikat giltigt?
2. Firewall whitelisting?
3. Rate limits nådda?
4. Security plugin blockar?

**Fix:**
1. Verify SSL med `curl -I https://kundendomain.se`
2. Whitelist vår IP i security plugin
3. Check API response headers för rate limit info
4. Temporary disable security plugin för test

---

### "Webhook inte mottagen"

**Check:**
1. Är endpoint publicly accessible?
2. Returnerar endpoint 200 OK?
3. Finns Basic Auth på URL?
4. Cloudflare/CDN cachar POST requests?

**Fix:**
1. Test med `curl -X POST https://endpoint.se/webhook/test`
2. Check webhook logs i BabyLoveGrowth dashboard
3. Disable Basic Auth för webhook path
4. Bypass cache för `/api/webhook/*`

---

### "Content inte publiceras"

**Check:**
1. API credentials korrekta?
2. User permissions tillräckliga?
3. Post status = "draft" eller "publish"?
4. Finns required fields (title, content)?

**Fix:**
1. Regenerate API keys
2. Verify user har `publish_posts` capability
3. Check post status i API response
4. Validate payload mot API schema

---

## 📊 Sammanfattning: Compatibility Matrix

| Plattform | Status | Setup Time | Setup Fee | Notes |
|-----------|--------|------------|-----------|-------|
| **Abicart** | ✅ Tier 1 | 1 vecka | 1,490 SEK | Kräver IP whitelist |
| **WooCommerce** | ✅ Tier 1 | 3-5 dagar | 990 SEK | Kräver WP 5.9+ |
| **Shopify** | ✅ Tier 1 | 3-5 dagar | 1,490 SEK | Kräver Basic+ plan |
| **BigCommerce** | ⚠️ Tier 2 | 1-2 veckor | 3,000 SEK | Mindre testad |
| **Magento** | ⚠️ Tier 2 | 3-4 veckor | 10,000 SEK | Komplex |
| **Wix** | ⚠️ Tier 2 | 2-3 veckor | 5,000 SEK | API-begränsningar |
| **Squarespace** | ⚠️ Tier 2 | 3-4 veckor | 8,000 SEK | Beta API |
| **Webflow** | 🚫 Omöjlig | - | - | Ingen CMS API |
| **Weebly** | 🚫 Omöjlig | - | - | API discontinued |
| **GoDaddy Builder** | 🚫 Omöjlig | - | - | Closed system |

---

## 📞 Support & Frågor

**För Sales:**
- "Är min plattform kompatibel?" → Check compatibility matrix ovan
- "Vilka plugins måste jag avinstallera?" → Endast "Disable REST API"-plugins
- "Hur lång setup-tid?" → Check matrix ovan

**För Tech Support:**
- "Integration fungerar inte" → Använd troubleshooting guide ovan
- "API calls blockas" → Check security plugins & firewall
- "Webhooks kommer inte fram" → Verify endpoint accessibility

**Kontakt:**
- Tech Lead: [Din email]
- Sales Engineering: [Sales engineer email]
- Documentation: [Link till denna fil]

---

**Uppdaterad:** 2026-02-06
**Version:** 1.0
**Status:** Referensdokument för Sales & Support
