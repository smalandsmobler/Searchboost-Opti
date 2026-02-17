#!/bin/bash
# Deploy Lambda functions for SEO MCP System
# Usage: ./deploy-lambda-functions.sh

set -e

REGION="eu-north-1"

echo "=== Deploying SEO Lambda Functions ==="
echo "Region: $REGION"
echo ""

# Create temp directory
TMPDIR=$(mktemp -d)
echo "Working in: $TMPDIR"

# Copy Lambda code and install deps
cp -r lambda-functions/* "$TMPDIR/"
cd "$TMPDIR"
npm install --production
echo ""

# Deploy each function
for FUNC in weekly-audit autonomous-optimizer weekly-report data-collector; do
  echo "--- Deploying seo-${FUNC} ---"

  # Create zip with the specific handler + node_modules
  cp "${FUNC}.js" index.js
  zip -qr "function.zip" index.js node_modules/ package.json

  aws lambda update-function-code \
    --function-name "seo-${FUNC}" \
    --zip-file "fileb://function.zip" \
    --region "$REGION" \
    --no-cli-pager

  rm -f index.js function.zip
  echo "  Deployed seo-${FUNC}"
  echo ""
done

# Cleanup
rm -rf "$TMPDIR"

echo "=== All Lambda functions deployed! ==="
echo ""
echo "Test with:"
echo "  aws lambda invoke --function-name seo-weekly-audit --region $REGION response.json && cat response.json"
