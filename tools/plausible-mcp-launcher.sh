#!/bin/bash
# Wrapper som hämtar Plausible API-key från SSM och kör plausible-mcp lokalt.
# Används i .mcp.json istället för att hårdkoda nyckeln.
#
# Användning i .mcp.json (alternativ):
#   "plausible": {
#     "command": "/Users/weerayootandersson/Downloads/Searchboost-Opti/tools/plausible-mcp-launcher.sh"
#   }

set -e
KEY=$(aws ssm get-parameter --name /seo-mcp/plausible/api-key --with-decryption \
  --region eu-north-1 --profile mikael --query Parameter.Value --output text 2>/dev/null)

if [ -z "$KEY" ] || [ "$KEY" = "PLACEHOLDER_GENERATE_IN_PLAUSIBLE_SETTINGS" ]; then
  echo "Error: Plausible API-key inte konfigurerad. Skapa via Plausible Settings > API Keys, sen:" >&2
  echo "  aws ssm put-parameter --name /seo-mcp/plausible/api-key --value '<key>' --type SecureString --overwrite --region eu-north-1 --profile mikael" >&2
  exit 1
fi

export PLAUSIBLE_API_KEY="$KEY"
export PLAUSIBLE_BASE_URL="https://analytics.searchboost.se"

exec node /Users/weerayootandersson/Downloads/Searchboost-Opti/tools/vendor/plausible-mcp/dist/index.js
