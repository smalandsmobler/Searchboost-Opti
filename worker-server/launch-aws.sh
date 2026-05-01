#!/bin/bash
# ============================================================
# Searchboost Worker — Launch på AWS (Spot Instance)
# t4g.small ARM Graviton, ~$3-4/mån som spot
# Kör från din lokala maskin (kräver AWS CLI)
# ============================================================

set -euo pipefail

PROFILE="mickedanne@gmail.com"
REGION="eu-north-1"
INSTANCE_TYPE="t4g.small"    # 2 vCPU, 2 GB RAM, ARM Graviton
AMI=""                        # Sätts automatiskt nedan
KEY_NAME="worker-key"
SG_NAME="searchboost-worker-sg"
WORKER_NAME="searchboost-worker"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[LAUNCH]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "========================================"
echo "  Searchboost Worker — AWS Launch"
echo "  Spot Instance: $INSTANCE_TYPE"
echo "========================================"
echo ""

# ── Verifiera AWS CLI ──
aws sts get-caller-identity --profile "$PROFILE" --region "$REGION" > /dev/null 2>&1 \
  || err "AWS CLI inte konfigurerad. Kör: aws configure --profile \"$PROFILE\""

ACCOUNT_ID=$(aws sts get-caller-identity --profile "$PROFILE" --query Account --output text)
log "AWS-konto: $ACCOUNT_ID"

# ── Hitta senaste Ubuntu 24.04 ARM AMI ──
log "Söker Ubuntu 24.04 ARM AMI..."
AMI=$(aws ec2 describe-images \
  --profile "$PROFILE" --region "$REGION" \
  --owners 099720109477 \
  --filters \
    "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-arm64-server-*" \
    "Name=state,Values=available" \
  --query 'Images | sort_by(@, &CreationDate) | [-1].ImageId' \
  --output text)

[[ "$AMI" == "None" || -z "$AMI" ]] && err "Kunde inte hitta Ubuntu ARM AMI"
log "AMI: $AMI"

# ── SSH-nyckel ──
KEY_EXISTS=$(aws ec2 describe-key-pairs --profile "$PROFILE" --region "$REGION" \
  --key-names "$KEY_NAME" --query 'KeyPairs[0].KeyName' --output text 2>/dev/null || echo "None")

if [[ "$KEY_EXISTS" == "None" ]]; then
  log "Skapar SSH-nyckelpar: $KEY_NAME"
  aws ec2 create-key-pair --profile "$PROFILE" --region "$REGION" \
    --key-name "$KEY_NAME" --key-type ed25519 \
    --query 'KeyMaterial' --output text > ~/.ssh/${KEY_NAME}.pem
  chmod 600 ~/.ssh/${KEY_NAME}.pem
  log "Nyckel sparad: ~/.ssh/${KEY_NAME}.pem"
else
  log "SSH-nyckel finns redan: $KEY_NAME"
fi

# ── Security Group ──
SG_ID=$(aws ec2 describe-security-groups --profile "$PROFILE" --region "$REGION" \
  --filters "Name=group-name,Values=$SG_NAME" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "None")

if [[ "$SG_ID" == "None" ]]; then
  log "Skapar security group: $SG_NAME"

  # Hämta default VPC
  VPC_ID=$(aws ec2 describe-vpcs --profile "$PROFILE" --region "$REGION" \
    --filters "Name=isDefault,Values=true" \
    --query 'Vpcs[0].VpcId' --output text)

  SG_ID=$(aws ec2 create-security-group --profile "$PROFILE" --region "$REGION" \
    --group-name "$SG_NAME" \
    --description "Searchboost Worker Server" \
    --vpc-id "$VPC_ID" \
    --query 'GroupId' --output text)

  # Port 22 (SSH) — öppna bara temporärt
  MY_IP=$(curl -4 -s ifconfig.me)
  aws ec2 authorize-security-group-ingress --profile "$PROFILE" --region "$REGION" \
    --group-id "$SG_ID" --protocol tcp --port 22 --cidr "${MY_IP}/32"

  # Port 80 + 443 — alltid öppna
  aws ec2 authorize-security-group-ingress --profile "$PROFILE" --region "$REGION" \
    --group-id "$SG_ID" --protocol tcp --port 80 --cidr "0.0.0.0/0"
  aws ec2 authorize-security-group-ingress --profile "$PROFILE" --region "$REGION" \
    --group-id "$SG_ID" --protocol tcp --port 443 --cidr "0.0.0.0/0"

  # Port 4000 — Worker API, bara från EC2-servern
  aws ec2 authorize-security-group-ingress --profile "$PROFILE" --region "$REGION" \
    --group-id "$SG_ID" --protocol tcp --port 4000 --cidr "51.21.116.7/32"

  log "Security group skapad: $SG_ID"
else
  log "Security group finns redan: $SG_ID"
fi

# ── User Data (bootstrap-script) ──
USER_DATA=$(cat << 'USERDATA'
#!/bin/bash
set -e

# Logga allt
exec > /var/log/worker-setup.log 2>&1

echo "=== Worker bootstrap startar ==="

# Uppdatera system
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git build-essential nginx jq htop unzip

# Swap 2 GB
if [[ ! -f /swapfile ]]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs

# PM2 + n8n
npm install -g pm2 n8n

# Skapa katalogstruktur
mkdir -p /home/ubuntu/searchboost-worker/{worker-api,n8n-workflows,logs}
mkdir -p /home/ubuntu/.n8n
chown -R ubuntu:ubuntu /home/ubuntu/searchboost-worker
chown -R ubuntu:ubuntu /home/ubuntu/.n8n

# Brandvägg
apt-get install -y -qq ufw
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow from 51.21.116.7 to any port 4000  # Bara EC2-servern
ufw --force enable

# Markera som klar
touch /home/ubuntu/.worker-bootstrap-done
echo "=== Worker bootstrap klar ==="
USERDATA
)

# ── Kolla spot-pris ──
SPOT_PRICE=$(aws ec2 describe-spot-price-history --profile "$PROFILE" --region "$REGION" \
  --instance-types "$INSTANCE_TYPE" \
  --product-descriptions "Linux/UNIX" \
  --start-time "$(date -u +%Y-%m-%dT%H:%M:%S)" \
  --query 'SpotPriceHistory[0].SpotPrice' --output text 2>/dev/null || echo "okänt")
log "Aktuellt spot-pris: \$$SPOT_PRICE/timme"

# ── Beräkna månadskostnad ──
if [[ "$SPOT_PRICE" != "okänt" ]]; then
  MONTHLY=$(echo "$SPOT_PRICE * 730" | bc 2>/dev/null || echo "?")
  log "Uppskattad månadskostnad: ~\$$MONTHLY"
fi

echo ""
read -p "Starta spot instance? (j/n): " CONFIRM
[[ "$CONFIRM" != "j" ]] && { echo "Avbryter."; exit 0; }

# ── Starta Spot Instance ──
log "Startar spot instance..."

INSTANCE_ID=$(aws ec2 run-instances --profile "$PROFILE" --region "$REGION" \
  --image-id "$AMI" \
  --instance-type "$INSTANCE_TYPE" \
  --key-name "$KEY_NAME" \
  --security-group-ids "$SG_ID" \
  --instance-market-options '{"MarketType":"spot","SpotOptions":{"SpotInstanceType":"persistent","InstanceInterruptionBehavior":"stop"}}' \
  --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":30,"VolumeType":"gp3","DeleteOnTermination":true}}]' \
  --user-data "$USER_DATA" \
  --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$WORKER_NAME}]" \
  --query 'Instances[0].InstanceId' --output text)

log "Instance startad: $INSTANCE_ID"

# ── Vänta på IP ──
log "Väntar på publik IP..."
sleep 10

for i in {1..12}; do
  WORKER_IP=$(aws ec2 describe-instances --profile "$PROFILE" --region "$REGION" \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)

  [[ "$WORKER_IP" != "None" && -n "$WORKER_IP" ]] && break
  sleep 5
done

[[ "$WORKER_IP" == "None" || -z "$WORKER_IP" ]] && err "Ingen publik IP tilldelad"

# ── Elastic IP (fast IP som överlever stop/start) ──
log "Allokerar Elastic IP..."
ALLOC_ID=$(aws ec2 allocate-address --profile "$PROFILE" --region "$REGION" \
  --domain vpc --query 'AllocationId' --output text)

aws ec2 associate-address --profile "$PROFILE" --region "$REGION" \
  --instance-id "$INSTANCE_ID" --allocation-id "$ALLOC_ID" > /dev/null

ELASTIC_IP=$(aws ec2 describe-addresses --profile "$PROFILE" --region "$REGION" \
  --allocation-ids "$ALLOC_ID" --query 'Addresses[0].PublicIp' --output text)

log "Elastic IP: $ELASTIC_IP"

# ── Spara info ──
cat > ~/.searchboost-worker << EOF
WORKER_INSTANCE_ID=$INSTANCE_ID
WORKER_IP=$ELASTIC_IP
WORKER_ALLOC_ID=$ALLOC_ID
WORKER_SG_ID=$SG_ID
WORKER_KEY=~/.ssh/${KEY_NAME}.pem
WORKER_REGION=$REGION
WORKER_PROFILE=$PROFILE
EOF

echo ""
echo "========================================"
echo "  INSTANCE STARTAD!"
echo "========================================"
echo ""
echo "  Instance ID:  $INSTANCE_ID"
echo "  Elastic IP:   $ELASTIC_IP"
echo "  Typ:          $INSTANCE_TYPE (spot)"
echo "  SSH-nyckel:   ~/.ssh/${KEY_NAME}.pem"
echo ""
echo "  Bootstrap körs nu (~3-5 min)."
echo "  Kolla progress:"
echo "    ssh -i ~/.ssh/${KEY_NAME}.pem ubuntu@${ELASTIC_IP} 'tail -f /var/log/worker-setup.log'"
echo ""
echo "  NÄSTA STEG:"
echo "  1. Vänta på bootstrap (~3-5 min)"
echo "  2. Kör: ./deploy-worker.sh"
echo "  3. Peka DNS: worker.searchboost.se → $ELASTIC_IP"
echo "  4. Lägg till i EC2-servern: WORKER_URL=http://${ELASTIC_IP}:4000"
echo ""
echo "  Uppskattad kostnad: ~\$${MONTHLY:-4}/mån"
echo ""
echo "  Info sparad i: ~/.searchboost-worker"
echo ""
