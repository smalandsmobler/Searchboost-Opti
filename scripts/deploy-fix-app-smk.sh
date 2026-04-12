#!/bin/bash
# === DEPLOY: fix-app-smk-URK36 ===
# 14 buggfixar: dashboard, portal, server
# Kör från din Searchboost-Opti mapp på datorn med AWS CLI + SSH
set -e

echo "=== Hämtar senaste koden ==="
git fetch origin claude/fix-app-smk-URK36
git checkout claude/fix-app-smk-URK36
git pull

echo "=== Öppnar port 22 ==="
MY_IP=$(curl -s ifconfig.me)
aws ec2 authorize-security-group-ingress --group-id sg-03cb7d131df0fbfb7 \
  --protocol tcp --port 22 --cidr "${MY_IP}/32" \
  --region eu-north-1 --profile "mickedanne@gmail.com" 2>/dev/null || true

echo "=== Pushar SSH-nyckel (60s fönster!) ==="
aws ec2-instance-connect send-ssh-public-key \
  --instance-id i-0c36714c9c343698d --instance-os-user ubuntu \
  --ssh-public-key file://~/.ssh/id_ed25519.pub \
  --region eu-north-1 --profile "mickedanne@gmail.com"

echo "=== Kopierar 7 filer till EC2 ==="
scp -i ~/.ssh/id_ed25519 \
  mcp-server-code/index.js \
  mcp-server-code/portal-auth.js \
  dashboard/app.js \
  dashboard/index.html \
  dashboard/portal.js \
  dashboard/portal.css \
  dashboard/style.css \
  ubuntu@51.21.116.7:/tmp/

echo "=== Installerar + restartar PM2 ==="
ssh -i ~/.ssh/id_ed25519 ubuntu@51.21.116.7 << 'REMOTE'
  cp /tmp/index.js /home/ubuntu/Searchboost-Opti/mcp-server-code/
  cp /tmp/portal-auth.js /home/ubuntu/Searchboost-Opti/mcp-server-code/
  cp /tmp/app.js /home/ubuntu/Searchboost-Opti/dashboard/
  cp /tmp/index.html /home/ubuntu/Searchboost-Opti/dashboard/
  cp /tmp/portal.js /home/ubuntu/Searchboost-Opti/dashboard/
  cp /tmp/portal.css /home/ubuntu/Searchboost-Opti/dashboard/
  cp /tmp/style.css /home/ubuntu/Searchboost-Opti/dashboard/
  cd /home/ubuntu/Searchboost-Opti/mcp-server-code && pm2 restart seo-mcp
  echo "=== PM2 RESTART KLAR ==="
REMOTE

echo "=== Stänger port 22 ==="
aws ec2 revoke-security-group-ingress --group-id sg-03cb7d131df0fbfb7 \
  --protocol tcp --port 22 --cidr "${MY_IP}/32" \
  --region eu-north-1 --profile "mickedanne@gmail.com"

echo ""
echo "=== DEPLOY KLAR! ==="
echo "Testa: http://51.21.116.7/"
echo "Portal: http://51.21.116.7/portal.html"
