#!/bin/bash
# Plausible ClickHouse-direct MCP launcher.
# Hanterar SSH-tunnel + startar MCP-servern.
#
# Fördelar mot Plausible Stats API:
# - Ingen API-key krävs (free oavsett Plausible-version)
# - Snabbare (direkt SQL, ingen Phoenix-controller-overhead)
# - Full SQL-frihet om vi vill bygga custom-aggregat
#
# Förutsättningar:
# - SSH-key ~/.ssh/id_ed25519 har access till Plausible-EC2
# - EC2 SG sg-037d1bb607429ace7 har port 22 öppen från min IP (sköts av wrappern nedan)

set -e

INSTANCE_ID="i-0ae6ac46c2d6adf28"
SG_ID="sg-037d1bb607429ace7"
EIP="13.63.66.148"
LOCAL_PORT="18123"
REMOTE_PORT="8123"

MY_IP=$(curl -s -4 ifconfig.me)

# Öppna SSH-port (idempotent — tar emot "already exists"-fel)
aws ec2 authorize-security-group-ingress --group-id "$SG_ID" --protocol tcp --port 22 \
  --cidr "${MY_IP}/32" --region eu-north-1 --profile mikael >/dev/null 2>&1 || true

# Re-push SSH-key (60s-window varje gång)
aws ec2-instance-connect send-ssh-public-key --instance-id "$INSTANCE_ID" --instance-os-user ubuntu \
  --ssh-public-key file://~/.ssh/id_ed25519.pub --region eu-north-1 --profile mikael >/dev/null

# Säkerställ tunnel — döda gammal om finns
pkill -f "ssh.*-L $LOCAL_PORT:127.0.0.1:$REMOTE_PORT.*$EIP" 2>/dev/null || true
sleep 1

# Starta tunnel i bakgrunden
ssh -fN -o StrictHostKeyChecking=no -o ExitOnForwardFailure=yes \
  -i ~/.ssh/id_ed25519 \
  -L "$LOCAL_PORT:127.0.0.1:$REMOTE_PORT" \
  "ubuntu@$EIP"

# Vänta tills tunneln är uppe
for i in 1 2 3 4 5; do
  if curl -s -o /dev/null "http://localhost:$LOCAL_PORT/ping" --max-time 2; then break; fi
  sleep 1
done

export CH_URL="http://localhost:$LOCAL_PORT"
export CH_DATABASE="plausible_events_db"

exec node "$(dirname "$0")/plausible-ch-mcp/src/index.js"
