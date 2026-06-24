# Deploy: coachning.searchboost.se

Allt nedan körs från din dator som har AWS-profil + SSH-nyckel. Appen körs på
befintliga EC2 (51.21.116.7) på port 3100 bakom Nginx; DNS sköts i Loopia.

På EC2 behövs **ingen** API-nyckel-config — `server.js` hämtar Claude-nyckeln
från SSM (`/seo-mcp/anthropic/api-key`) via instansens IAM-roll, precis som
huvudappen. Inloggningskontot (`fridalindgren0@gmail.com` / `Frida1234`) ligger
redan i koden.

---

## 1. DNS i Loopia (skapar "prefixet")

1. Logga in i **Loopia Kundzon** → **Mina domäner** → `searchboost.se`.
2. Öppna **DNS-redigeraren** (eller "Lägg till subdomän").
3. Lägg till subdomänen **`coachning`** med en **A-post**:
   - Typ: `A`
   - Namn/subdomän: `coachning`
   - Värde/IP: `51.21.116.7`
   - TTL: 3600
4. Spara. DNS-spridning tar oftast några minuter (upp till någon timme).

Verifiera när det slagit igenom:
```bash
dig +short coachning.searchboost.se   # ska svara 51.21.116.7
```

---

## 2. Kopiera koden + starta appen på EC2

Från repo-roten:
```bash
bash coaching-site/deploy/deploy.sh
```

Scriptet öppnar port 22 tillfälligt, pushar din SSH-nyckel, rsync:ar koden till
`/home/ubuntu/Searchboost-Opti/coaching-site`, kör `npm install --omit=dev`,
startar PM2-processen `coachning` och stänger port 22 igen.

> Alternativt manuellt på servern: `cd .../coaching-site && npm install --omit=dev && pm2 start server.js --name coachning && pm2 save`

Snabbtest (på servern, eller via SSH):
```bash
curl -s localhost:3100/health   # {"ok":true}
```

---

## 3. Nginx (proxy + subdomän)

Kopiera Nginx-blocket till servern och aktivera:
```bash
# på EC2:
sudo cp /home/ubuntu/Searchboost-Opti/coaching-site/deploy/nginx-coachning.conf \
        /etc/nginx/sites-available/coachning
sudo ln -sf /etc/nginx/sites-available/coachning /etc/nginx/sites-enabled/coachning
sudo nginx -t && sudo systemctl reload nginx
```

Nu svarar `http://coachning.searchboost.se` (när DNS slagit igenom).

---

## 4. HTTPS (Let's Encrypt)

```bash
# på EC2 (certbot brukar redan finnas; annars: sudo apt install certbot python3-certbot-nginx)
sudo certbot --nginx -d coachning.searchboost.se
```
Certbot lägger automatiskt till 443-block + 80→443-redirect och förnyar sig självt.

---

## 5. (Valfritt) Egen JWT-secret

Sessions-tokens signeras med en stabil intern fallback om inget sätts. Vill du
ha en egen secret, lägg en `.env` i `coaching-site/` på servern:
```
COACH_JWT_SECRET=EMjaOfr87V_U8vDnsYsFt-AlM-XVqXnrdnZyloAqFgVa7U2oRfAPk6wH71QxuDmz
```
och starta om: `pm2 restart coachning --update-env`. (`server.js` läser `.env`
automatiskt.)

---

## Klart ✅

`https://coachning.searchboost.se` → login → coachen.

**Verifiera live en gång:** logga in och ladda upp hennes riktiga Takeout-fil
(.zip eller .tgz) under "Min data" och se att rätt mätvärden plockas — då vet vi
att parsern matchar just hennes klockas exportstruktur.
