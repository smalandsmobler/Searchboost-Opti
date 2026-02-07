# Searchboost Opti

Semi-autonomt SEO-optimeringssystem for Searchboost.se.

## Arkitektur

```
EC2 (MCP Server)  -->  WordPress REST API (Rank Math)
      |                 SE Ranking API
      |                 Trello API
      v
   BigQuery  <--  Lambda Functions (EventBridge triggers)
      |
      v
   Dashboard (opti.searchboost.se)
```

## Struktur

```
mcp-server-code/     MCP-server (Express + Claude AI)
lambda-functions/    3 Lambda-funktioner (audit, optimizer, report)
dashboard/           Frontend dashboard
```

## Deploy

```bash
# 1. MCP-server till EC2
scp -r mcp-server-code/* ubuntu@51.21.116.7:/home/ubuntu/seo-mcp-server/
ssh ubuntu@51.21.116.7 "cd seo-mcp-server && npm install && pm2 restart seo-mcp"

# 2. Lambda-funktioner
./deploy-lambda-functions.sh
```
