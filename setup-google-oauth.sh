#!/bin/bash
# setup-google-oauth.sh — One-time Google OAuth2 setup
#
# Används EN GÅNG för att hämta OAuth2 refresh_token och spara i AWS SSM.
# Scopar: Google Calendar (read) + Google Drive (read)
#
# Förutsättningar:
#   1. Ett Google Cloud-projekt med Calendar API + Drive API aktiverade
#   2. OAuth2 Desktop-klient skapad (Authorized redirect URI: urn:ietf:wg:oauth:2.0:oob)
#   3. AWS CLI konfigurerat med profil "mickedanne@gmail.com"
#
# Steg-för-steg:
#   ./setup-google-oauth.sh
#   → Klistra in Client ID + Client Secret
#   → Öppna URL i webbläsaren
#   → Logga in med mikael.searchboost@gmail.com
#   → Godkänn behörigheter
#   → Klistra in auktoriseringskoden
#   → Scriptet sparar credentials i SSM automatiskt

set -e

REGION="eu-north-1"
PROFILE="mickedanne@gmail.com"
SSM_PARAM="/seo-mcp/google/calendar-credentials"

echo "=== Google OAuth2 Setup ==="
echo ""
echo "Detta script konfigurerar Google Calendar + Drive-access för Sales Assistant."
echo ""

# ── Steg 1: Hämta klient-credentials ──

echo "--- Steg 1: Ange OAuth2-klientuppgifter ---"
echo ""
echo "Gå till: https://console.cloud.google.com/apis/credentials"
echo "Välj ditt projekt → OAuth 2.0 Client IDs → Desktop App (eller skapa ny)"
echo ""
read -p "Klistra in Client ID: " CLIENT_ID
read -p "Klistra in Client Secret: " CLIENT_SECRET

if [ -z "$CLIENT_ID" ] || [ -z "$CLIENT_SECRET" ]; then
  echo "FEL: Client ID och Client Secret krävs."
  exit 1
fi

echo ""

# ── Steg 2: Generera auktoriserings-URL ──

SCOPES="https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/drive.readonly"
ENCODED_SCOPES="${SCOPES// /%20}"
REDIRECT_URI="urn:ietf:wg:oauth:2.0:oob"

AUTH_URL="https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${REDIRECT_URI}&response_type=code&scope=${ENCODED_SCOPES}&access_type=offline&prompt=consent"

echo "--- Steg 2: Godkänn behörigheter ---"
echo ""
echo "Öppna denna URL i webbläsaren (Cmd+klick eller klistra in):"
echo ""
echo "$AUTH_URL"
echo ""
echo "Logga in med: mikael.searchboost@gmail.com"
echo "Godkänn: Google Calendar (läs) + Google Drive (läs)"
echo ""
read -p "Klistra in auktoriseringskoden (visas efter godkännande): " AUTH_CODE

if [ -z "$AUTH_CODE" ]; then
  echo "FEL: Auktoriseringskod krävs."
  exit 1
fi

echo ""

# ── Steg 3: Byt kod mot tokens ──

echo "--- Steg 3: Hämtar access_token och refresh_token ---"

TOKEN_RESPONSE=$(curl -s -X POST https://oauth2.googleapis.com/token \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "code=${AUTH_CODE}" \
  -d "redirect_uri=${REDIRECT_URI}" \
  -d "grant_type=authorization_code")

if echo "$TOKEN_RESPONSE" | grep -q '"error"'; then
  echo "FEL vid token-byte:"
  echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('error_description', d.get('error', 'Unknown')))"
  exit 1
fi

REFRESH_TOKEN=$(echo "$TOKEN_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['refresh_token'])" 2>/dev/null)

if [ -z "$REFRESH_TOKEN" ]; then
  echo "FEL: Ingen refresh_token i svaret. Kontrollera att du valt 'access_type=offline' och 'prompt=consent'."
  echo "Svar från Google:"
  echo "$TOKEN_RESPONSE"
  exit 1
fi

echo "  refresh_token mottagen."
echo ""

# ── Steg 4: Spara i SSM ──

echo "--- Steg 4: Sparar credentials i AWS SSM ---"

CREDENTIALS_JSON=$(python3 -c "import json; print(json.dumps({
  'client_id': '$CLIENT_ID',
  'client_secret': '$CLIENT_SECRET',
  'refresh_token': '$REFRESH_TOKEN'
}))")

aws ssm put-parameter \
  --name "$SSM_PARAM" \
  --value "$CREDENTIALS_JSON" \
  --type "SecureString" \
  --overwrite \
  --region "$REGION" \
  --profile "$PROFILE" \
  --no-cli-pager

echo "  Sparat i SSM: $SSM_PARAM"
echo ""

# ── Steg 5: Verifiera ──

echo "--- Steg 5: Verifierar SSM-parameter ---"

STORED=$(aws ssm get-parameter \
  --name "$SSM_PARAM" \
  --with-decryption \
  --region "$REGION" \
  --profile "$PROFILE" \
  --no-cli-pager \
  --query 'Parameter.Value' \
  --output text 2>/dev/null)

if echo "$STORED" | grep -q "refresh_token"; then
  echo "  Verifierat — credentials lagrade korrekt."
else
  echo "  VARNING: Kunde inte verifiera. Kontrollera SSM manuellt."
fi

echo ""
echo "=== Setup klar! ==="
echo ""
echo "Sales Morning Briefing Lambda kan nu:"
echo "  - Läsa Google Kalender (mikael.searchboost@gmail.com)"
echo "  - Bevaka Google Drive efter Meet-transkript"
echo ""
echo "Nästa körning: nästa vardag kl 07:00 CET (EventBridge)"
echo "Testa manuellt: aws lambda invoke --function-name seo-sales-morning-briefing --payload '{\"force\":true}' --region eu-north-1 --profile mickedanne@gmail.com /tmp/briefing-test.json"
