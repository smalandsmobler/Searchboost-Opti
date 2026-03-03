#!/bin/bash
# setup-eventbridge.sh — Aktivera + skapa alla EventBridge-scheman
# Usage: ./setup-eventbridge.sh
#
# Scheman (alla CET = UTC+1):
#   weekly-audit          Måndag 06:00 CET   → cron(0 5 ? * MON *)
#   weekly-report         Måndag 08:00 CET   → cron(0 7 ? * MON *)
#   autonomous-optimizer  Var 6:e timme      → cron(0 */6 * * ? *)
#   data-collector        Dagligen 04:00 CET → cron(0 3 * * ? *)
#   viktor-day-scheduler  Torsdag 17:00 CET  → cron(0 16 ? * THU *)
#   content-publisher     Dagligen 09:00 CET → cron(0 8 * * ? *)
#   keyword-researcher    Måndag 07:00 CET   → cron(0 6 ? * MON *)
#   content-blueprint     1:a varje mån 07:00→ cron(0 6 1 * ? *)
#   ai-visibility-tracker Måndag 07:30 CET   → cron(30 6 ? * MON *)

set -e

REGION="eu-north-1"
PROFILE="mickedanne@gmail.com"
ACCOUNT="176823989073"

echo "=== EventBridge Setup ==="
echo "Region: $REGION"
echo ""

# ── Hjälpfunktion: skapa/uppdatera regel + target + permission ──
setup_rule() {
  local NAME=$1
  local SCHEDULE=$2
  local DESC=$3
  local FUNC_NAME=$4

  local FUNC_ARN="arn:aws:lambda:${REGION}:${ACCOUNT}:function:${FUNC_NAME}"
  local RULE_ARN

  echo "--- ${NAME} ---"
  echo "  Schema: ${SCHEDULE}"

  # Skapa eller uppdatera regeln
  RULE_ARN=$(aws events put-rule \
    --name "$NAME" \
    --schedule-expression "$SCHEDULE" \
    --description "$DESC" \
    --state ENABLED \
    --region "$REGION" \
    --profile "$PROFILE" \
    --no-cli-pager \
    --query 'RuleArn' \
    --output text 2>&1)

  echo "  Regel: $RULE_ARN"

  # Kolla om Lambda-funktionen finns
  if ! aws lambda get-function --function-name "$FUNC_NAME" --region "$REGION" --profile "$PROFILE" --no-cli-pager 2>/dev/null; then
    echo "  VARNING: Lambda ${FUNC_NAME} finns inte — target skapas inte"
    echo ""
    return
  fi

  # Lägg till target
  aws events put-targets \
    --rule "$NAME" \
    --targets "Id=${FUNC_NAME},Arn=${FUNC_ARN}" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --no-cli-pager > /dev/null

  echo "  Target: $FUNC_ARN"

  # Ge EventBridge rätt att trigga Lambda (idempotent)
  aws lambda add-permission \
    --function-name "$FUNC_NAME" \
    --statement-id "eventbridge-${NAME}" \
    --action "lambda:InvokeFunction" \
    --principal "events.amazonaws.com" \
    --source-arn "$RULE_ARN" \
    --region "$REGION" \
    --profile "$PROFILE" \
    --no-cli-pager 2>/dev/null || echo "  Permission finns redan"

  echo "  OK"
  echo ""
}

# ── Befintliga regler (aktivera + uppdatera targets) ──

setup_rule \
  "seo-weekly-audit-trigger" \
  "cron(0 5 ? * MON *)" \
  "Weekly SEO audit — måndag 06:00 CET" \
  "seo-weekly-audit"

setup_rule \
  "seo-weekly-report-trigger" \
  "cron(0 7 ? * MON *)" \
  "Veckorapport — måndag 08:00 CET" \
  "seo-weekly-report"

setup_rule \
  "seo-optimizer-trigger" \
  "cron(0 */6 * * ? *)" \
  "Autonomous optimizer var 6:e timme" \
  "seo-autonomous-optimizer"

setup_rule \
  "seo-data-collector-daily" \
  "cron(0 3 * * ? *)" \
  "Daglig datainsamling — 04:00 CET" \
  "seo-data-collector"

setup_rule \
  "seo-viktor-day-thursday" \
  "cron(0 16 ? * THU *)" \
  "Viktor-dag Trello-kort — torsdag 17:00 CET" \
  "seo-viktor-day-scheduler"

# ── Nya regler ──

setup_rule \
  "seo-content-publisher-daily" \
  "cron(0 8 * * ? *)" \
  "Content Publisher — dagligen 09:00 CET (max 3 artiklar/körning)" \
  "seo-content-publisher"

setup_rule \
  "seo-keyword-researcher-weekly" \
  "cron(0 6 ? * MON *)" \
  "Keyword Researcher — måndag 07:00 CET (kör efter audit)" \
  "seo-keyword-researcher"

setup_rule \
  "seo-content-blueprint-monthly" \
  "cron(0 6 1 * ? *)" \
  "Content Blueprint Generator — 1:a varje månad 07:00 CET" \
  "seo-content-blueprint-generator"

setup_rule \
  "seo-ai-visibility-weekly" \
  "cron(30 6 ? * MON *)" \
  "AI Visibility Tracker — måndag 07:30 CET" \
  "seo-ai-visibility-tracker"

setup_rule \
  "seo-sales-briefing-daily" \
  "cron(0 6 ? * MON-FRI *)" \
  "Sales Morning Briefing — vardagar 07:00 CET" \
  "seo-sales-morning-briefing"

setup_rule \
  "seo-sales-meet-processor" \
  "cron(0/30 * * * ? *)" \
  "Sales Meet Processor — var 30:e minut" \
  "seo-sales-meet-processor"

echo "=== EventBridge setup klart! ==="
echo ""
echo "Alla aktiva scheman:"
aws events list-rules \
  --region "$REGION" \
  --profile "$PROFILE" \
  --no-cli-pager \
  --query 'Rules[?State==`ENABLED`].[Name,ScheduleExpression,State]' \
  --output table
