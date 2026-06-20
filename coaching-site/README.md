# Coachning 🌿

En privat, varsam tränings-, kost- och livscoach. Byggd för en närstående som är
sjukskriven för utmattning — därför är hela tonen **återhämtning först**: ingen
prestationspress, inga streaks, ingen skuld.

## Vad den gör

- **Översikt** — lugn vy av sömn, vilopuls, HRV, steg och aktiva minuter
- **Incheckning** — daglig avstämning av energi/humör/vila (emoji + fritext)
- **Kost & energi** — snälla, näringsfokuserade tips + AI-genererade måltidsidéer
- **Coachen** — AI-chatt som förenar PT, dietist, livscoach och peppare i en varm röst
- **Ton-reglage** — hon väljer själv hur mjuk/peppig coachen ska vara (1–5)

## Integritet (viktigast)

All hälsodata **parsas och lagras i webbläsaren** (localStorage). Servern lagrar
ingenting. När hon chattar med coachen skickas bara en kort textsammanfattning av
datan + meddelandet till Claude — aldrig råfilerna. "Radera all data" rensar enheten.

## Datakälla

Google Takeout-export (Fitbit och/eller Google Fit). Hon hämtar sin zip på
[takeout.google.com](https://takeout.google.com/), väljer **Fitbit**/**Fit**, och
laddar upp zip-filen under fliken "Min data". Parsern är tolerant och plockar det
den känner igen (Fitbit JSON + Google Fit CSV).

## Köra lokalt

```bash
cd coaching-site
npm install
# API-nyckel: antingen via env...
export ANTHROPIC_API_KEY=sk-ant-...
# ...eller låt den hämtas från SSM /seo-mcp/anthropic/api-key (kräver AWS-cred)
npm start
# → http://localhost:3100
```

## Deploy (subdomän coachning.searchboost.se)

Samma mönster som resten av systemet (PM2 + Nginx på EC2):

```bash
# På servern:
cd /home/ubuntu/Searchboost-Opti/coaching-site && npm install --omit=dev
pm2 start server.js --name coachning
pm2 save
```

Nginx server-block: peka `coachning.searchboost.se` → `http://localhost:3100`,
sätt upp DNS A-record mot `51.21.116.7` och certifikat (Let's Encrypt).
API-nyckeln hämtas automatiskt från SSM `/seo-mcp/anthropic/api-key` precis som
huvudservern, så ingen extra config behövs på EC2.

> Tips: lägg gärna `auth_basic` i Nginx-blocket så sidan är lösenordsskyddad —
> det är hennes privata hälsodata.

## Modell

`claude-sonnet-4-6` (sätts om med env-var `COACH_MODEL`). Coach-personan och
säkerhetsreglerna (inte vård, hänvisa till 1177/112 vid behov) ligger i
`server.js`.
