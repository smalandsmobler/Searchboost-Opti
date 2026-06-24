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

## Inloggning

Sidan är skyddad med ett enda privat konto (login-skärm + JWT, token gäller 30
dagar). Lösenordet lagras aldrig i klartext — bara en bcrypt-hash i `server.js`.

Standardkonto: `fridalindgren0@gmail.com`. Byt vid behov via env vid deploy:

```bash
COACH_EMAIL=ny@epost.se
COACH_PASS_HASH='$2b$12$...'   # generera: node -e "console.log(require('bcryptjs').hashSync('NyttLösen',12))"
COACH_JWT_SECRET=valfri-lång-slumpsträng   # rekommenderas i produktion
```

## Datakälla — filformat

Stödjer både **.zip** och **.tgz / .tar.gz** (de format Google Takeout erbjuder).
Allt packas upp och parsas i webbläsaren (JSZip för zip, pako + tar-parser för tgz).

## Deploy (Loopia, subdomän t.ex. coachning.searchboost.se)

Det här är en vanlig Node-app — inga moln-specifika beroenden. På Loopias
Node.js-hosting:

```bash
npm install --omit=dev
# Sätt miljövariabler (Loopias kontrollpanel eller .env-motsvarighet):
#   ANTHROPIC_API_KEY=sk-ant-...      (krävs)
#   COACH_JWT_SECRET=...              (rekommenderas)
#   COACH_EMAIL / COACH_PASS_HASH     (om kontot ska bytas)
#   PORT=...                          (om Loopia kräver en viss port)
npm start
```

Peka subdomänen mot appen enligt Loopias instruktioner och se till att HTTPS är
på. API-nyckeln läses i första hand från `ANTHROPIC_API_KEY` (på AWS faller den
tillbaka på SSM `/seo-mcp/anthropic/api-key`).

## Modell

`claude-sonnet-4-6` (sätts om med env-var `COACH_MODEL`). Coach-personan och
säkerhetsreglerna (inte vård, hänvisa till 1177/112 vid behov) ligger i
`server.js`.
