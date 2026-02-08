# Förutsättningar — Searchboost Opti

> Senast uppdaterad: 2026-02-08

## 1. Tekniska förutsättningar

### Systemkrav

| Krav | Minimum | Faktisk setup |
|------|---------|---------------|
| Node.js | v18+ | v20 LTS |
| npm | v9+ | v10+ |
| RAM | 512 MB | 1 GB (t3.micro) |
| Disk | 100 MB | 8 GB EBS |
| OS | Linux | Ubuntu 22.04 LTS |

### Node.js-beroenden

| Paket | Syfte |
|-------|-------|
| `express` | Webbserver + API-endpoints |
| `@aws-sdk/client-ssm` | AWS SSM Parameter Store |
| `@aws-sdk/client-ses` | AWS SES e-postutskick |
| `@google-cloud/bigquery` | BigQuery-klient |
| `@anthropic-ai/sdk` | Claude AI (optimeringar) |
| `google-auth-library` | GSC OAuth2-autentisering |
| `axios` | HTTP-klient (WordPress, SE Ranking, Trello) |

---

## 2. AWS-infrastruktur

### EC2 Instance
| Parameter | Värde |
|-----------|-------|
| Instans-ID | `i-0c36714c9c343698d` |
| Typ | t3.micro |
| Region | eu-north-1 (Stockholm) |
| Availability Zone | eu-north-1b |
| Elastic IP | 51.21.116.7 |
| Security Group | `sg-03cb7d131df0fbfb7` |
| SSH-nyckel | `~/.ssh/id_ed25519` via Instance Connect |

**Security Group-regler (inbound):**

| Port | Protokoll | Källa | Syfte |
|------|-----------|-------|-------|
| 80 | TCP | 0.0.0.0/0 | HTTP (Nginx → Express) |
| 443 | TCP | 0.0.0.0/0 | HTTPS (self-signed) |
| 22 | TCP | Öppnas temporärt | SSH via Instance Connect (60s-fönster) |

**SSH-åtkomst:**
```bash
# 1. Pusha SSH-nyckel (ger 60 sekunder)
aws ec2-instance-connect send-ssh-public-key \
  --instance-id i-0c36714c9c343698d \
  --availability-zone eu-north-1b \
  --instance-os-user ubuntu \
  --ssh-public-key file://~/.ssh/id_ed25519.pub \
  --region eu-north-1 \
  --profile mickedanne@gmail.com

# 2. Öppna port 22 om stängd
aws ec2 authorize-security-group-ingress \
  --group-id sg-03cb7d131df0fbfb7 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region eu-north-1 --profile mickedanne@gmail.com

# 3. SSH inom 60 sekunder
ssh -i ~/.ssh/id_ed25519 ubuntu@51.21.116.7

# 4. Stäng port 22 efteråt
aws ec2 revoke-security-group-ingress \
  --group-id sg-03cb7d131df0fbfb7 \
  --protocol tcp --port 22 --cidr 0.0.0.0/0 \
  --region eu-north-1 --profile mickedanne@gmail.com
```

### Lambda Functions

| Funktion | Trigger | Runtime |
|----------|---------|---------|
| `seo-weekly-audit` | `cron(0 6 ? * MON *)` (Måndag 06:00 UTC) | Node.js 20.x |
| `seo-autonomous-optimizer` | `rate(6 hours)` | Node.js 20.x |
| `seo-weekly-report` | `cron(0 8 ? * MON *)` (Måndag 08:00 UTC) | Node.js 20.x |

- Minne: 512 MB per funktion
- Timeout: 5 minuter
- Execution Role: SSM GetParameter, SES SendEmail, CloudWatch Logs

### SSM Parameter Store

Alla parametrar under `/seo-mcp/`:

**Globala:**
```
/seo-mcp/anthropic/api-key          (SecureString) — Claude AI API-nyckel
/seo-mcp/bigquery/credentials       (SecureString) — GCP WIF JSON
/seo-mcp/bigquery/project-id        (String)       — searchboost-485810
/seo-mcp/bigquery/dataset           (String)       — seo_data
/seo-mcp/trello/api-key             (SecureString) — ⚠️ BEHÖVER UPPDATERAS (401)
/seo-mcp/trello/token               (SecureString) — ⚠️ BEHÖVER UPPDATERAS (401)
/seo-mcp/trello/board-id            (String)       — fKo0y1Wk
/seo-mcp/seranking/api-key          (SecureString) — ⚠️ INTE FUNGERANDE (403)
```

**Per kund (9 st aktiva):**
```
/seo-mcp/wordpress/{site-id}/url            (String)
/seo-mcp/wordpress/{site-id}/username       (String)
/seo-mcp/wordpress/{site-id}/app-password   (SecureString)
/seo-mcp/integrations/{site-id}/company-name     (String)
/seo-mcp/integrations/{site-id}/contact-email    (String)
/seo-mcp/integrations/{site-id}/gsc-property     (String)
/seo-mcp/integrations/{site-id}/ga-property-id   (String)
/seo-mcp/integrations/{site-id}/google-ads-id    (String)
/seo-mcp/integrations/{site-id}/meta-pixel-id    (String)
/seo-mcp/integrations/{site-id}/contract-tier    (String)
```

**Aktiva kunder:** searchboost, ferox, ilmonte, mobelrondellen, phvast, smalandskontorsmobler, tobler, traficator, wedosigns

### Nginx

Reverse proxy: port 80/443 → localhost:3000

```nginx
server {
    listen 80;
    listen 443 ssl;
    server_name 51.21.116.7;

    ssl_certificate     /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### PM2

| Parameter | Värde |
|-----------|-------|
| Process | `seo-mcp` |
| Sökväg | `/home/ubuntu/Searchboost-Opti/mcp-server-code/` |
| Entry point | `index.js` |
| Port | 3000 |

---

## 3. Google Cloud Platform

### Projekt

| Projekt | ID | Syfte |
|---------|----|----- |
| SA-hem | `searchboost-485810` (numeric: 775229795883) | Service account, BigQuery |
| GSC API | `seo-aouto` (org: mikael-searchboost-org) | GSC API aktiverad |

### Service Account
- **Email:** `seo-mcp-bigquery@searchboost-485810.iam.gserviceaccount.com`
- **Roller på searchboost-485810:** BigQuery Data Editor, BigQuery Job User
- **Roller på seo-aouto:** Service Usage Consumer
- **Autentisering:** Workload Identity Federation (WIF) config JSON i SSM

### BigQuery-tabeller

| Tabell | Syfte | Skapas automatiskt |
|--------|-------|:------------------:|
| `seo_optimization_log` | Alla SEO-optimeringar | Nej (manuellt) |
| `seo_work_queue` | Arbetskö (pending/completed tasks) | Nej (manuellt) |
| `weekly_reports` | Veckorapporter | Nej (manuellt) |
| `customer_pipeline` | Kundlivscykel + kontrakt | Ja (vid startup) |
| `customer_keywords` | ABC-nyckelord per kund | Ja (vid startup) |
| `action_plans` | 3-månaders åtgärdsplaner | Ja (vid startup) |

### Google Search Console
- SA tillagd till **searchboost.se** (Fullständig)
- ⚠️ Övriga kunder: SA ej tillagd ännu
- Varje ny kund-property kräver manuell tillägning av SA

---

## 4. WordPress-krav (per kund)

| Krav | Detalj |
|------|--------|
| WordPress-version | 5.6+ (Application Passwords) |
| Plugin | Rank Math SEO (gratis) |
| REST API | Aktiverat (`/wp-json/wp/v2/`) |
| App Password | Genererad per kund |
| HTTPS | Obligatoriskt (sslverify=false för shared hosting) |
| PHP | 8.0+ |

**OBS:** Shared hosting blockerar ofta utgående HTTP till icke-standard portar. Systemet kommunicerar via HTTPS (443) med `sslverify=false`.

---

## 5. Kända problem

| Problem | Status | Åtgärd |
|---------|--------|--------|
| Trello API 401 | ⚠️ Väntar | Generera nya credentials på trello.com/app-key |
| SE Ranking API 403 | ⚠️ Väntar | Nytt API-nyckel / API-addon krävs |
| GSC: bara searchboost.se | ⚠️ Pågående | Lägg till SA per kund-property manuellt |
| Dashboard: simple hash-login | Låg prio | Byta till JWT eller OAuth |
| SSL: self-signed cert | Låg prio | Byta till Let's Encrypt |

---

## 6. Checklista — ny installation

### Infrastruktur
- [ ] AWS-konto med admin-rättigheter (eu-north-1)
- [ ] EC2 t3.micro skapad med Ubuntu 22.04
- [ ] Elastic IP kopplad
- [ ] Security Group: port 80, 443 öppna
- [ ] Node.js 20 LTS installerat på EC2
- [ ] PM2 installerat globalt (`npm i -g pm2`)
- [ ] Nginx installerat och konfigurerat
- [ ] Git-repo klonat till `/home/ubuntu/Searchboost-Opti/`
- [ ] `npm install` i `mcp-server-code/`
- [ ] PM2 process startad (`pm2 start index.js --name seo-mcp`)

### API-nycklar (SSM)
- [ ] Anthropic API-nyckel (claude.ai)
- [ ] BigQuery WIF credentials JSON
- [ ] BigQuery project-id + dataset
- [ ] Trello API-key + token + board-id
- [ ] SE Ranking API-key (valfritt)

### Google Cloud
- [ ] GCP-projekt skapat
- [ ] Service Account skapad
- [ ] BigQuery API aktiverat
- [ ] GSC API aktiverat (separat projekt om nödvändigt)
- [ ] Service Usage Consumer-roll på GSC-projektet
- [ ] SA tillagd i kundens GSC-property

### Lambda
- [ ] 3 Lambda-funktioner deployade
- [ ] EventBridge-regler konfigurerade
- [ ] Lambda execution role med SSM + SES + CloudWatch

### E-post
- [ ] SES: sender-adress verifierad
- [ ] SES: production access (inte sandbox)

### DNS
- [ ] A-record: opti.searchboost.se → EC2 IP
- [ ] SSL-certifikat (self-signed eller Let's Encrypt)

---

## 7. AWS-profil (lokal utveckling)

```
AWS Profile: mickedanne@gmail.com
Region: eu-north-1
Account: 176823989073
```
