#!/bin/bash
# Setup Data Collector Lambda + EventBridge Schedule
# Kors EN GANG for att skapa resurser. Anvand deploy-lambda-functions.sh for uppdateringar.
#
# Forutsatter att IAM-rollen seo-lambda-role redan finns (fran befintliga Lambdas)

set -e

REGION="eu-north-1"
PROFILE="mickedanne@gmail.com"
FUNCTION_NAME="seo-data-collector"
ROLE_ARN="arn:aws:iam::176823989073:role/SEO-Lambda-Execution-Role"

echo "=== Skapar $FUNCTION_NAME ==="
echo "Region: $REGION"
echo "Role: $ROLE_ARN"
echo ""

# 1. Skapa deployment package
TMPDIR=$(mktemp -d)
cp -r lambda-functions/* "$TMPDIR/"
cd "$TMPDIR"
npm install --production

cp data-collector.js index.js
zip -qr function.zip index.js node_modules/ package.json
echo "Package: $(du -h function.zip | cut -f1)"

# 2. Skapa Lambda-funktionen
echo "Skapar Lambda..."
aws lambda create-function \
  --function-name "$FUNCTION_NAME" \
  --runtime nodejs18.x \
  --handler index.handler \
  --role "$ROLE_ARN" \
  --timeout 300 \
  --memory-size 512 \
  --zip-file "fileb://function.zip" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --no-cli-pager \
  2>&1 || {
    echo "Lambda finns kanske redan — forsoker uppdatera..."
    aws lambda update-function-code \
      --function-name "$FUNCTION_NAME" \
      --zip-file "fileb://function.zip" \
      --region "$REGION" \
      --profile "$PROFILE" \
      --no-cli-pager
  }

echo "Lambda skapad/uppdaterad."

# 3. Skapa EventBridge-schema (varje dag kl 03:00 UTC = 04:00 CET)
echo ""
echo "Skapar EventBridge-schema..."

RULE_NAME="seo-data-collector-daily"

aws events put-rule \
  --name "$RULE_NAME" \
  --schedule-expression "cron(0 3 * * ? *)" \
  --state ENABLED \
  --description "Daglig datainsamling - GSC, Ads, Social Media -> BigQuery" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --no-cli-pager

# Hamta Lambda ARN
LAMBDA_ARN=$(aws lambda get-function \
  --function-name "$FUNCTION_NAME" \
  --query 'Configuration.FunctionArn' \
  --output text \
  --region "$REGION" \
  --profile "$PROFILE")

# Tillat EventBridge att anropa Lambda
aws lambda add-permission \
  --function-name "$FUNCTION_NAME" \
  --statement-id "EventBridgeInvoke" \
  --action "lambda:InvokeFunction" \
  --principal "events.amazonaws.com" \
  --source-arn "arn:aws:events:${REGION}:$(aws sts get-caller-identity --query Account --output text --profile "$PROFILE"):rule/${RULE_NAME}" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --no-cli-pager \
  2>/dev/null || echo "(Permission kanske redan finns)"

# Koppla Lambda som target
aws events put-targets \
  --rule "$RULE_NAME" \
  --targets "Id=DataCollectorTarget,Arn=${LAMBDA_ARN}" \
  --region "$REGION" \
  --profile "$PROFILE" \
  --no-cli-pager

echo "EventBridge: $RULE_NAME -> $FUNCTION_NAME (varje dag kl 04:00 CET)"

# 4. Cleanup
rm -rf "$TMPDIR"

echo ""
echo "=== KLART ==="
echo ""
echo "Testa manuellt:"
echo "  aws lambda invoke --function-name $FUNCTION_NAME --region $REGION --profile \"$PROFILE\" --no-cli-pager /tmp/data-collector-result.json && cat /tmp/data-collector-result.json"
echo ""
echo "Se resultat i BigQuery:"
echo "  gsc_daily_metrics, ads_daily_metrics, social_daily_metrics, data_collection_log"
