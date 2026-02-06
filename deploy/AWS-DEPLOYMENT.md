# 🚀 AWS Deployment Guide för Babylovesgrowth

## Översikt

Detta deployer Babylovesgrowth API till AWS EC2 för automatisk bloggpublicering till Smålandsmöbler's Abicart.

## Kostnader

- **EC2 t3.micro**: ~$10/mån (gratis första 12 månaderna med Free Tier)
- **Elastic IP**: Gratis när associerad med running instance
- **Domän**: ~$12/år (om du behöver köpa en)

**Total**: ~$10-15/mån efter free tier

---

## 🎯 Steg-för-Steg

### Steg 1: Skapa EC2 Instance

**Via AWS Console:**

1. Logga in på [AWS Console](https://console.aws.amazon.com/)
2. Gå till **EC2** → **Launch Instance**
3. Konfigurera:
   - **Name**: `babylovesgrowth-api`
   - **AMI**: Ubuntu Server 22.04 LTS
   - **Instance type**: `t3.micro` (Free Tier eligible)
   - **Key pair**: Skapa ny eller använd befintlig
   - **Security Group**: Skapa ny med portarna:
     - SSH (22) - Din IP
     - HTTP (80) - Anywhere
     - HTTPS (443) - Anywhere
     - Custom TCP (3000) - Anywhere (för testing)
4. **Launch Instance**

### Steg 2: Allokera Elastic IP

1. EC2 → **Elastic IPs** → **Allocate Elastic IP address**
2. **Associate** IP:n med din instance
3. **Notera IP-adressen** - denna ska whitelistas hos Abicart!

### Steg 3: Konfigurera Domän (Valfritt)

**Om du vill använda subdomän på smalandskontorsmobler.se:**

Lägg till DNS A-record:
```
babylovesgrowth.smalandskontorsmobler.se → [Din Elastic IP]
```

**Eller använd egen domän:**
```
babylovesgrowth.se → [Din Elastic IP]
api.babylovesgrowth.se → [Din Elastic IP]
```

### Steg 4: SSH till Servern

```bash
ssh -i your-key.pem ubuntu@[ELASTIC_IP]
```

### Steg 5: Kör Setup Script

```bash
# Ladda ner setup script
curl -O https://raw.githubusercontent.com/smalandsmobler/Babylovesgrowth/claude/integrate-babylovesgrowth-blogging-at2mC/deploy/server-setup.sh

# Gör körbara
chmod +x server-setup.sh

# Kör setup
./server-setup.sh
```

Detta installerar:
- ✅ Node.js 18
- ✅ PM2 (process manager)
- ✅ Nginx (reverse proxy)
- ✅ Certbot (SSL certificates)
- ✅ Babylovesgrowth applikationen

### Steg 6: Konfigurera Nginx (Om du använder domän)

```bash
# Redigera nginx-config.sh och ändra DOMAIN
nano deploy/nginx-config.sh

# Kör script
chmod +x deploy/nginx-config.sh
./deploy/nginx-config.sh

# Få SSL certifikat
sudo certbot --nginx -d babylovesgrowth.smalandskontorsmobler.se
```

### Steg 7: Whitelist IP hos Abicart

1. Logga in på Abicart admin
2. Gå till **Inställningar** → **API** → **IP-whitelist**
3. Lägg till din Elastic IP
4. Spara

### Steg 8: Testa!

```bash
# Från servern
curl http://localhost:3000/api/publish/status

# Från internet (ändra till din domän/IP)
curl https://babylovesgrowth.smalandskontorsmobler.se/api/publish/status
```

---

## 🔧 Hantering

### PM2 Kommandon

```bash
# Status
pm2 status

# Logs
pm2 logs babylovesgrowth

# Restart
pm2 restart babylovesgrowth

# Stop
pm2 stop babylovesgrowth

# Start
pm2 start babylovesgrowth
```

### Uppdatera Kod

```bash
cd /var/www/babylovesgrowth
git pull origin claude/integrate-babylovesgrowth-blogging-at2mC
npm install
npm run build
pm2 restart babylovesgrowth
```

### Manuell Publicering

```bash
curl -X POST https://babylovesgrowth.smalandskontorsmobler.se/api/publish/now
```

---

## 📊 Monitoring

### Logs

```bash
# Application logs
pm2 logs babylovesgrowth

# Nginx logs
sudo tail -f /var/log/nginx/babylovesgrowth-access.log
sudo tail -f /var/log/nginx/babylovesgrowth-error.log

# System logs
sudo journalctl -u nginx -f
```

### Health Check

```bash
curl https://babylovesgrowth.smalandskontorsmobler.se/health
```

---

## 🔐 Säkerhet

### Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Auto-updates

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

---

## 💰 Kostnadskontroll

### Stoppa Instance (spara pengar)

```bash
# Via AWS CLI
aws ec2 stop-instances --instance-ids i-XXXXXXXXX
```

**OBS:** Elastic IP kostar pengar när den inte är associerad med running instance!

### Monitoring

Sätt upp AWS CloudWatch alerts för:
- CPU usage > 80%
- Disk usage > 80%
- Monthly spend > threshold

---

## 🆘 Troubleshooting

### App startar inte

```bash
pm2 logs babylovesgrowth
# Kolla efter fel i logs
```

### Nginx error

```bash
sudo nginx -t  # Test config
sudo systemctl status nginx
```

### Kan inte nå från internet

1. Kolla Security Group portar
2. Kolla Nginx config
3. Kolla DNS records
4. Kolla SSL certifikat

### Abicart 403 error

1. Verifiera IP är whitelistad
2. Kolla auth token i .env
3. Testa direkt från servern: `curl localhost:3000/api/publish/status`

---

## 📞 Support

- AWS Support: [AWS Console](https://console.aws.amazon.com/support/)
- Repository: [GitHub Issues](https://github.com/smalandsmobler/Babylovesgrowth/issues)

---

## ✅ Checklist

- [ ] EC2 instance skapad
- [ ] Elastic IP allokerad och associerad
- [ ] DNS konfigurerad (om domän används)
- [ ] SSH access funkar
- [ ] Server setup script körts
- [ ] Nginx konfigurerad
- [ ] SSL certifikat installerat
- [ ] IP whitelistad hos Abicart
- [ ] Health check funkar
- [ ] Manuell publish funkar
- [ ] Cron schedule verifierat

**Lycka till! 🚀**
