#!/bin/bash
# Deploy Lambda functions for SEO MCP System
# Usage: ./deploy-lambda-functions.sh [function-name]
# Om inget argument ges deployas alla funktioner.
# Exempel: ./deploy-lambda-functions.sh content-publisher

set -e

REGION="eu-north-1"
PROFILE="mickedanne@gmail.com"
ACCOUNT="176823989073"
ROLE="arn:aws:iam::${ACCOUNT}:role/SEO-Lambda-Execution-Role"
RUNTIME="nodejs20.x"
TIMEOUT=600
MEMORY=1024

echo "=== Deploying SEO Lambda Functions ==="
echo "Region: $REGION"
echo ""

# Befintliga funktioner (update-function-code)
EXISTING_FUNCS="weekly-audit autonomous-optimizer weekly-report data-collector viktor-day-scheduler"

# Nya funktioner (create-function om de inte finns)
NEW_FUNCS="content-publisher keyword-researcher content-blueprint-generator ai-visibility-tracker sales-morning-briefing sales-meet-processor"

# Välj vilka som ska deployas
if [ -n "$1" ]; then
  TARGET="$1"
  echo "Deployar bara: seo-${TARGET}"
else
  TARGET=""
  echo "Deployar alla funktioner"
fi

echo ""

# Create temp directory
TMPDIR=$(mktemp -d)
echo "Working in: $TMPDIR"

# Copy Lambda code and install deps
cp -r lambda-functions/* "$TMPDIR/"
cd "$TMPDIR"
npm install --production 2>&1 | tail -5
echo ""

# ── Hjälpfunktion: deploya en funktion ──
deploy_function() {
  local FUNC=$1
  local IS_NEW=$2

  # Filtrera om specifik funktion angavs
  if [ -n "$TARGET" ] && [ "$FUNC" != "$TARGET" ]; then
    return
  fi

  echo "--- Deploying seo-${FUNC} ---"

  if [ ! -f "${FUNC}.js" ]; then
    echo "  VARNING: ${FUNC}.js saknas — hoppar över"
    echo ""
    return
  fi

  cp "${FUNC}.js" index.js
  zip -qr "function.zip" index.js node_modules/ package.json
  rm -f index.js

  if [ "$IS_NEW" = "new" ]; then
    # Kolla om funktionen redan finns
    if aws lambda get-function --function-name "seo-${FUNC}" --region "$REGION" --profile "$PROFILE" --no-cli-pager 2>/dev/null; then
      echo "  Funktionen finns redan — uppdaterar kod"
      aws lambda update-function-code \
        --function-name "seo-${FUNC}" \
        --zip-file "fileb://function.zip" \
        --region "$REGION" \
        --profile "$PROFILE" \
        --no-cli-pager
    else
      echo "  Skapar ny Lambda-funktion..."
      aws lambda create-function \
        --function-name "seo-${FUNC}" \
        --runtime "$RUNTIME" \
        --role "$ROLE" \
        --handler "index.handler" \
        --zip-file "fileb://function.zip" \
        --timeout "$TIMEOUT" \
        --memory-size "$MEMORY" \
        --region "$REGION" \
        --profile "$PROFILE" \
        --no-cli-pager
    fi
  else
    aws lambda update-function-code \
      --function-name "seo-${FUNC}" \
      --zip-file "fileb://function.zip" \
      --region "$REGION" \
      --profile "$PROFILE" \
      --no-cli-pager
  fi

  rm -f function.zip
  echo "  Deployed seo-${FUNC}"
  echo ""
}

# ── Deploya befintliga ──
for FUNC in $EXISTING_FUNCS; do
  deploy_function "$FUNC" "existing"
done

# ── Deploya nya ──
for FUNC in $NEW_FUNCS; do
  deploy_function "$FUNC" "new"
done

# Cleanup
cd /
rm -rf "$TMPDIR"

echo "=== Alla Lambda-funktioner deployade! ==="
echo ""
echo "Kör setup-eventbridge.sh för att aktivera scheman."
