#!/usr/bin/env bash
#
# Deploya coachning-appen till EC2 (51.21.116.7) från en dator med AWS-profil
# + SSH-nyckel. Följer samma mönster som huvudsystemets deploy (öppna port 22
# tillfälligt → pusha SSH-nyckel → kopiera filer → starta om → stäng port 22).
#
# Förutsätter:
#   - aws CLI inloggad med profilen nedan
#   - ~/.ssh/id_ed25519(.pub) finns
#   - körs från repo-roten ELLER coaching-site/ (hittar själv rätt)
#
# Användning:  bash coaching-site/deploy/deploy.sh
set -euo pipefail

# --- Konfiguration (från CLAUDE.md) ---------------------------------------
INSTANCE_ID="i-0c36714c9c343698d"
HOST="51.21.116.7"
SG_ID="sg-03cb7d131df0fbfb7"
REGION="eu-north-1"
PROFILE="mickedanne@gmail.com"
SSH_KEY="$HOME/.ssh/id_ed25519"
REMOTE_DIR="/home/ubuntu/Searchboost-Opti/coaching-site"

# Hitta lokal coaching-site-katalog oavsett varifrån scriptet körs.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCAL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

MY_IP="$(curl -s ifconfig.me)/32"
echo "▸ Min IP: $MY_IP"

cleanup() {
  echo "▸ Stänger port 22 igen..."
  aws ec2 revoke-security-group-ingress --group-id "$SG_ID" \
    --protocol tcp --port 22 --cidr "$MY_IP" \
    --region "$REGION" --profile "$PROFILE" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "▸ Öppnar port 22 tillfälligt..."
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" \
  --protocol tcp --port 22 --cidr "$MY_IP" \
  --region "$REGION" --profile "$PROFILE" >/dev/null 2>&1 || true

push_key() {
  aws ec2-instance-connect send-ssh-public-key \
    --instance-id "$INSTANCE_ID" --instance-os-user ubuntu \
    --ssh-public-key "file://${SSH_KEY}.pub" \
    --region "$REGION" --profile "$PROFILE" >/dev/null
}

SSH_OPTS="-i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=20"

echo "▸ Kopierar filer (utan node_modules)..."
push_key
rsync -az --delete \
  --exclude node_modules --exclude .env --exclude .git \
  -e "ssh $SSH_OPTS" \
  "$LOCAL_DIR/" "ubuntu@$HOST:$REMOTE_DIR/"

echo "▸ Installerar beroenden + (om)startar PM2..."
push_key
ssh $SSH_OPTS "ubuntu@$HOST" bash -s <<REMOTE
  set -e
  cd "$REMOTE_DIR"
  npm install --omit=dev --no-audit --no-fund
  pm2 startOrRestart server.js --name coachning --update-env
  pm2 save
  echo "PM2-status:"
  pm2 describe coachning | grep -E "status|name" || true
REMOTE

echo "✓ Klart. Appen kör på port 3100 bakom Nginx."
echo "  Glöm inte: DNS i Loopia + Nginx-block + certbot (se DEPLOY.md) om det inte redan är gjort."
