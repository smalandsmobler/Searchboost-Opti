# Systeminfo — Searchboost Opti

## EC2-server
- **IP**: 51.21.116.7
- **PM2-process**: seo-mcp
- **Dashboard-login**: searchboost.web@gmail.com / Opti0195
- **API-nyckel**: SSM `/seo-mcp/dashboard/api-key`
- **SSL**: Let's Encrypt via Nginx (opti.searchboost.nu)

## Deploy-process (kortversion)
1. Öppna port 22: `aws ec2 authorize-security-group-ingress --group-id sg-03cb7d131df0fbfb7 --protocol tcp --port 22 --cidr "$(curl -s ifconfig.me)/32" --region eu-north-1 --profile mickedanne@gmail.com`
2. Push SSH-nyckel (60s fönster!): `aws ec2-instance-connect send-ssh-public-key --instance-id i-0c36714c9c343698d --instance-os-user ubuntu --ssh-public-key file://~/.ssh/id_ed25519.pub --region eu-north-1 --profile mickedanne@gmail.com`
3. SCP + PM2 restart
4. Stäng port 22 (samma kommando men `revoke`)
Se CLAUDE.md för fullständiga kommandon.

## Autonomous Optimizer
- **Modell**: claude-haiku-4-5-20251001 (bytt 2026-02-20, var Sonnet)
- **Frekvens**: var 6:e timme (EventBridge)
- **Kostnad**: ~$0.0002/optimering (vs $0.003 med Sonnet)

## SE Ranking API
- **Auth**: `?apikey=KEY&output=json` (INTE Authorization-header)
- **Fungerande**: `/backlinks/summary`, `/backlinks/refdomains`, `/backlinks/anchors`
- **Ej tillgängligt**: `/domain/overview/*`, `/keywords/*` (kräver högre tier)
- **Credits**: utgick 2026-02-20 — kolla SSM om förnyas

## Lessons Learned
- Keywords API: max ~10 per POST (annars 504)
- Möbelrondellen: Sucuri WAF → HTTP 455 på curl, men OK i browser
- Loopia FTP: filer >10KB → 451-fel → använd base64+PHP
- CSS Grid + clearfix = tom första cell (GeneratePress/WooCommerce-bugg)
- npm global install kräver sudo → använd npx eller lokal install
- Playwright: kör från projektkatalogen (där node_modules/playwright ligger)
