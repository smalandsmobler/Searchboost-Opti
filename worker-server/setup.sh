#!/bin/bash
# ============================================================
# Searchboost Worker Server — Oracle Cloud ARM Setup
# Kör på en färsk Ubuntu 22.04/24.04 ARM64-instans
# Usage: chmod +x setup.sh && sudo ./setup.sh
# ============================================================

set -euo pipefail

# Färger för output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[SETUP]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Kolla att vi kör som root
[[ $EUID -ne 0 ]] && err "Kör som root: sudo ./setup.sh"

# Kolla ARM-arkitektur
ARCH=$(uname -m)
if [[ "$ARCH" != "aarch64" ]]; then
    warn "Inte ARM64 ($ARCH) — scriptet är optimerat för Oracle ARM men bör fungera ändå"
fi

# ============================================================
# KONFIGURATIONS-VARIABLER
# ============================================================
WORKER_USER="ubuntu"
WORKER_HOME="/home/$WORKER_USER"
WORKER_DIR="$WORKER_HOME/searchboost-worker"
N8N_PORT=5678
WORKER_API_PORT=4000
DOMAIN="" # Sätts interaktivt nedan

echo ""
echo "========================================"
echo "  Searchboost Worker Server Setup"
echo "  Oracle Cloud ARM Free Tier"
echo "========================================"
echo ""

# Fråga om domän
read -p "Ange domän för worker-servern (t.ex. worker.searchboost.se): " DOMAIN
if [[ -z "$DOMAIN" ]]; then
    warn "Ingen domän angiven — skippar SSL. Använder IP-adress."
    DOMAIN="$(curl -s ifconfig.me)"
fi

# ============================================================
# STEG 1: Systemuppdatering + baspaket
# ============================================================
log "Steg 1/8: Systemuppdatering..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl wget git build-essential \
    nginx certbot python3-certbot-nginx \
    ufw chromium-browser \
    jq htop tmux unzip

# ============================================================
# STEG 2: Swap (2 GB säkerhetsmarginal)
# ============================================================
log "Steg 2/8: Konfigurerar swap..."
if [[ ! -f /swapfile ]]; then
    fallocate -l 2G /swapfile
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log "2 GB swap aktiverad"
else
    log "Swap finns redan"
fi

# ============================================================
# STEG 3: Node.js 20 LTS
# ============================================================
log "Steg 3/8: Installerar Node.js 20 LTS..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi
NODE_VERSION=$(node --version)
log "Node.js $NODE_VERSION installerad"

# ============================================================
# STEG 4: PM2 + n8n
# ============================================================
log "Steg 4/8: Installerar PM2 + n8n..."
npm install -g pm2 n8n 2>/dev/null

# Puppeteer: använd system-Chromium (ARM-kompatibel)
echo "PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true" >> /etc/environment
echo "PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser" >> /etc/environment

PM2_VERSION=$(pm2 --version)
N8N_VERSION=$(n8n --version 2>/dev/null || echo "okänd")
log "PM2 $PM2_VERSION, n8n $N8N_VERSION installerade"

# ============================================================
# STEG 5: Skapa katalogstruktur + Worker API
# ============================================================
log "Steg 5/8: Skapar worker-katalog..."
mkdir -p "$WORKER_DIR/worker-api"
mkdir -p "$WORKER_DIR/n8n-workflows"
mkdir -p "$WORKER_DIR/logs"
mkdir -p "$WORKER_HOME/.n8n"
mkdir -p "$WORKER_HOME/.config/gcloud"

# Kopiera worker-api-filer (antar att de finns i samma mapp som setup.sh)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -d "$SCRIPT_DIR/worker-api" ]]; then
    cp -r "$SCRIPT_DIR/worker-api/"* "$WORKER_DIR/worker-api/"
    log "Worker API-filer kopierade"
fi

if [[ -f "$SCRIPT_DIR/ecosystem.config.js" ]]; then
    cp "$SCRIPT_DIR/ecosystem.config.js" "$WORKER_DIR/"
    log "PM2 ecosystem-config kopierad"
fi

# Installera worker-api dependencies
cd "$WORKER_DIR/worker-api"
if [[ -f package.json ]]; then
    npm install --production 2>/dev/null
    log "Worker API dependencies installerade"
fi

# Fixa ägande
chown -R "$WORKER_USER:$WORKER_USER" "$WORKER_DIR"
chown -R "$WORKER_USER:$WORKER_USER" "$WORKER_HOME/.n8n"
chown -R "$WORKER_USER:$WORKER_USER" "$WORKER_HOME/.config"

# ============================================================
# STEG 6: n8n-konfiguration
# ============================================================
log "Steg 6/8: Konfigurerar n8n..."
cat > "$WORKER_HOME/.n8n/.env" << EOF
N8N_HOST=0.0.0.0
N8N_PORT=$N8N_PORT
N8N_PROTOCOL=http
N8N_EDITOR_BASE_URL=https://$DOMAIN/n8n/
N8N_PATH=/n8n/
WEBHOOK_URL=https://$DOMAIN/n8n/
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=searchboost
N8N_BASIC_AUTH_PASSWORD=SBworker2026!
N8N_LOG_LEVEL=info
N8N_DEFAULT_BINARY_DATA_MODE=filesystem
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336
N8N_DIAGNOSTICS_ENABLED=false
GENERIC_TIMEZONE=Europe/Stockholm
N8N_PAYLOAD_SIZE_MAX=64
EOF
chown "$WORKER_USER:$WORKER_USER" "$WORKER_HOME/.n8n/.env"
chmod 600 "$WORKER_HOME/.n8n/.env"
log "n8n konfigurerad (byt lösenord i .env!)"

# ============================================================
# STEG 7: Brandvägg (UFW)
# ============================================================
log "Steg 7/8: Konfigurerar brandvägg..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP (certbot + redirect)
ufw allow 443/tcp   # HTTPS
# Port 4000 och 5678 nås bara via Nginx reverse proxy
ufw --force enable
log "UFW aktiverad (22, 80, 443 öppna)"

# ============================================================
# STEG 8: Nginx reverse proxy
# ============================================================
log "Steg 8/8: Konfigurerar Nginx..."
cat > /etc/nginx/sites-available/worker << NGINX
server {
    listen 80;
    server_name $DOMAIN;

    # Worker API
    location /worker/ {
        proxy_pass http://127.0.0.1:$WORKER_API_PORT/worker/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300s;
        proxy_connect_timeout 10s;
    }

    # n8n UI + webhooks
    location /n8n/ {
        proxy_pass http://127.0.0.1:$N8N_PORT/n8n/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }

    # Hälsokontroll
    location /health {
        proxy_pass http://127.0.0.1:$WORKER_API_PORT/worker/health;
    }
}
NGINX

# Aktivera site
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/worker /etc/nginx/sites-enabled/worker
nginx -t && systemctl reload nginx
log "Nginx konfigurerad"

# SSL via certbot (om domän är angiven och inte bara IP)
if [[ "$DOMAIN" != *"."*"."* ]] || [[ "$DOMAIN" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    warn "Ingen riktig domän — skippar SSL. Lägg till certbot manuellt senare:"
    warn "  certbot --nginx -d $DOMAIN"
else
    log "Kör certbot för SSL..."
    certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email mikael@searchboost.se || {
        warn "Certbot misslyckades — kör manuellt: certbot --nginx -d $DOMAIN"
    }
fi

# ============================================================
# STARTA TJÄNSTER
# ============================================================
log "Startar tjänster via PM2..."
cd "$WORKER_DIR"
sudo -u "$WORKER_USER" bash -c "cd $WORKER_DIR && pm2 start ecosystem.config.js"
sudo -u "$WORKER_USER" pm2 save
sudo -u "$WORKER_USER" pm2 startup systemd -u "$WORKER_USER" --hp "$WORKER_HOME" | tail -1 | bash

# ============================================================
# SAMMANFATTNING
# ============================================================
ORACLE_IP=$(curl -s ifconfig.me)

echo ""
echo "========================================"
echo "  SETUP KLAR!"
echo "========================================"
echo ""
echo "  Server IP:    $ORACLE_IP"
echo "  Domän:        $DOMAIN"
echo "  Worker API:   https://$DOMAIN/worker/health"
echo "  n8n UI:       https://$DOMAIN/n8n/"
echo "  n8n login:    searchboost / SBworker2026!"
echo ""
echo "  NÄSTA STEG:"
echo "  1. Byt n8n-lösenord i $WORKER_HOME/.n8n/.env"
echo "  2. Skapa .env i $WORKER_DIR/worker-api/"
echo "     med WORKER_API_KEY och BigQuery-credentials"
echo "  3. Kopiera GCP service account JSON till"
echo "     $WORKER_HOME/.config/gcloud/service-account.json"
echo "  4. Peka DNS: $DOMAIN → $ORACLE_IP"
echo "  5. Kör certbot om SSL inte lyckades"
echo ""
echo "  PM2-kommandon:"
echo "  pm2 status        — se alla processer"
echo "  pm2 logs          — se loggar"
echo "  pm2 restart all   — starta om allt"
echo ""
