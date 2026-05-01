#!/bin/bash
# ============================================================
# Searchboost Worker — Deploy till AWS spot instance
# Kopierar worker-api + config, startar PM2
# Kör från din lokala maskin efter launch-aws.sh
# ============================================================

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
log() { echo -e "${GREEN}[DEPLOY]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# Läs sparad info från launch
if [[ -f ~/.searchboost-worker ]]; then
  source ~/.searchboost-worker
else
  err "Kör launch-aws.sh först"
fi

WORKER_IP="${WORKER_IP:-}"
WORKER_KEY="${WORKER_KEY:-~/.ssh/worker-key.pem}"
KEY_PATH=$(eval echo "$WORKER_KEY")

[[ -z "$WORKER_IP" ]] && err "WORKER_IP saknas i ~/.searchboost-worker"
[[ ! -f "$KEY_PATH" ]] && err "SSH-nyckel saknas: $KEY_PATH"

SSH_CMD="ssh -i $KEY_PATH -o StrictHostKeyChecking=no ubuntu@${WORKER_IP}"
SCP_CMD="scp -i $KEY_PATH -o StrictHostKeyChecking=no"

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REMOTE_DIR="/home/ubuntu/searchboost-worker"

echo ""
echo "========================================"
echo "  Deploy Worker → $WORKER_IP"
echo "========================================"
echo ""

# ── Vänta på att bootstrap är klar ──
log "Kollar om servern är redo..."
for i in {1..30}; do
  READY=$($SSH_CMD "test -f /home/ubuntu/.worker-bootstrap-done && echo yes || echo no" 2>/dev/null || echo "no")
  [[ "$READY" == "yes" ]] && break
  echo "  Väntar på bootstrap... ($i/30)"
  sleep 10
done
[[ "$READY" != "yes" ]] && err "Servern är inte redo efter 5 min. Kolla: $SSH_CMD 'tail /var/log/worker-setup.log'"

log "Server redo!"

# ── Skapa .env-fil ──
read -p "Worker API-nyckel (tryck enter för auto-genererad): " WORKER_API_KEY
if [[ -z "$WORKER_API_KEY" ]]; then
  WORKER_API_KEY="sbw-$(openssl rand -hex 16)"
  log "Auto-genererad nyckel: $WORKER_API_KEY"
fi

cat > /tmp/worker-env << EOF
WORKER_PORT=4000
WORKER_API_KEY=$WORKER_API_KEY
N8N_URL=http://127.0.0.1:5678
NODE_ENV=production
EOF

# ── Kopiera filer ──
log "Kopierar worker-api..."
$SCP_CMD -r "$SCRIPT_DIR/worker-api/" "ubuntu@${WORKER_IP}:/tmp/worker-api/"
$SCP_CMD "$SCRIPT_DIR/ecosystem.config.js" "ubuntu@${WORKER_IP}:/tmp/ecosystem.config.js"
$SCP_CMD /tmp/worker-env "ubuntu@${WORKER_IP}:/tmp/worker-env"

# ── Installera + starta ──
log "Installerar och startar..."
$SSH_CMD << 'REMOTE'
set -e

# Flytta filer
cp -r /tmp/worker-api/* /home/ubuntu/searchboost-worker/worker-api/
cp /tmp/ecosystem.config.js /home/ubuntu/searchboost-worker/
cp /tmp/worker-env /home/ubuntu/searchboost-worker/worker-api/.env
chmod 600 /home/ubuntu/searchboost-worker/worker-api/.env

# Installera dependencies
cd /home/ubuntu/searchboost-worker/worker-api
npm install --production 2>/dev/null

# n8n-konfiguration
mkdir -p /home/ubuntu/.n8n
if [[ ! -f /home/ubuntu/.n8n/.env ]]; then
  cat > /home/ubuntu/.n8n/.env << 'N8NENV'
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=searchboost
N8N_BASIC_AUTH_PASSWORD=SBworker2026!
N8N_LOG_LEVEL=info
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=336
N8N_DIAGNOSTICS_ENABLED=false
GENERIC_TIMEZONE=Europe/Stockholm
N8NENV
  chmod 600 /home/ubuntu/.n8n/.env
fi

# Nginx — worker proxy
sudo tee /etc/nginx/sites-available/worker > /dev/null << 'NGINX'
server {
    listen 80 default_server;
    server_name _;

    location /worker/ {
        proxy_pass http://127.0.0.1:4000/worker/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }

    location /n8n/ {
        proxy_pass http://127.0.0.1:5678/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://127.0.0.1:4000/worker/health;
    }
}
NGINX
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/worker /etc/nginx/sites-enabled/worker
sudo nginx -t && sudo systemctl reload nginx

# Starta PM2
cd /home/ubuntu/searchboost-worker
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

# Autostart vid reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu 2>/dev/null || true

echo "=== Deploy klar ==="
REMOTE

# ── Verifiera ──
log "Verifierar..."
sleep 3
HEALTH=$(curl -s "http://${WORKER_IP}/health" 2>/dev/null || echo "failed")

# ── Spara API-nyckel i AWS SSM ──
log "Sparar worker API-nyckel i SSM..."
aws ssm put-parameter \
  --profile "${WORKER_PROFILE}" --region "${WORKER_REGION}" \
  --name "/seo-mcp/worker/api-key" \
  --value "$WORKER_API_KEY" \
  --type SecureString \
  --overwrite 2>/dev/null || warn "Kunde inte spara i SSM — gör det manuellt"

# Rensa temp
rm -f /tmp/worker-env

echo ""
echo "========================================"
echo "  DEPLOY KLAR!"
echo "========================================"
echo ""
echo "  Worker API:  http://${WORKER_IP}/health"
echo "  n8n UI:      http://${WORKER_IP}/n8n/"
echo "  n8n login:   searchboost / SBworker2026!"
echo ""
echo "  Worker API-nyckel: $WORKER_API_KEY"
echo "  (sparad i SSM: /seo-mcp/worker/api-key)"
echo ""
echo "  SISTA STEGET:"
echo "  Lägg till WORKER_URL på EC2-servern:"
echo ""
echo "  ssh -i ~/.ssh/id_ed25519 ubuntu@51.21.116.7 \\"
echo "    \"cd /home/ubuntu/Searchboost-Opti/mcp-server-code && \\"
echo "     echo 'WORKER_URL=http://${WORKER_IP}:4000' >> .env && \\"
echo "     pm2 restart seo-mcp\""
echo ""
if echo "$HEALTH" | grep -q "ok"; then
  echo "  Status: ONLINE"
else
  echo "  Status: Väntar fortfarande... Kolla om 1 min:"
  echo "  curl http://${WORKER_IP}/health"
fi
echo ""
