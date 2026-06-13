# 17 — BillionMail (self-hosted prospekt-utskick)

> Verifierat live 2026-05-30. Ersätter beroendet av betal-SMTP/SaaS för 2000+ prospekt-utskick. Vi äger leveranskedjan (Postfix + Rspamd + DKIM/SPF/DMARC).

## Vad det är

BillionMail (aaPanel/BillionMail) — open-source, AGPL-3.0, Go + Postgres + Redis. Docker Compose-stack med 8 containers: Postfix (MTA), Dovecot (IMAP/POP3), Rspamd (spam-filter + DKIM-signing), Roundcube (webmail), Postgres, Redis, BillionMail Core (Go), BillionMail UI.

Vi använder den primärt som **SMTP-relay för kalla utskick + sequence-engine** mot prospekt — inte som mottagande inkorg för team.

## Live-fakta

| Sak | Värde |
|-----|-------|
| EC2 | `i-01df92c92d878f95f`, t3.medium, eu-north-1b, 27 GB disk |
| Elastic IP | `13.61.132.229` |
| Security Group | `sg-0662a999ad1b0b820` ("SearchBoost-Mail-SG") — TCP 25, 80, 443, 465, 587, 993, 995, 143, 110 öppna 0.0.0.0/0; 22 från min IP |
| Hostname | `mail.searchboost.se` |
| Webadmin | https://mail.searchboost.se (SSL appliceras via UI; HTTPS 200/302 verifierat) |
| BillionMail-katalog | `/opt/BillionMail` |
| CLI | `sudo bash /opt/BillionMail/bm.sh <command>` (add-domain, show-record, default, restart, etc.) |
| Aktiv mejldomän | `utskick.searchboost.se` |

## DNS (utskick.searchboost.se)

Satta via Loopia XML-RPC API 2026-05-30 — verifierade propagerade via `dig @8.8.8.8`:

| Typ | Värde |
|-----|-------|
| A `mail.utskick.searchboost.se` | `13.61.132.229` |
| MX `utskick.searchboost.se` | `10 mail.utskick.searchboost.se.` |
| TXT (SPF) `utskick.searchboost.se` | `v=spf1 mx ~all` |
| TXT (DMARC) `_dmarc.utskick.searchboost.se` | `v=DMARC1; p=quarantine; rua=mailto:postmaster@searchboost.se` |
| TXT (DKIM) `default._domainkey.utskick.searchboost.se` | (publik nyckel som `bm show-record` genererade) |

## SSM

| Path | Värde |
|------|-------|
| `/seo-mcp/billionmail/admin-user` | `sbadmin` |
| `/seo-mcp/billionmail/admin-password` | (genererad vid install) |
| `/seo-mcp/billionmail/safe-path` | `d0b5acaa64f8` |
| `/seo-mcp/billionmail/url` | `https://mail.searchboost.se/d0b5acaa64f8` |
| `/seo-mcp/billionmail/instance-id` | `i-01df92c92d878f95f` |
| `/seo-mcp/billionmail/eip` | `13.61.132.229` |
| `/seo-mcp/loopia/api-user` | `sbadmin@loopiaapi` |
| `/seo-mcp/loopia/api-password` | (Mikaels XML-RPC-lösen) |

## GÖR vs BORDE GÖRA

| Område | GÖR idag | BORDE GÖRA (gap) |
|--------|----------|-------------------|
| Stack live + UI | ✅ 8 containers Up, HTTPS svarar | — |
| DNS (utskick.searchboost.se) | ✅ A/MX/SPF/DKIM/DMARC live | — |
| **AWS port 25 utgående blockerad** | ❌ Default AWS-restriktion | Mikael ansöker manuellt via Console-formulär (det går inte via API). Samtidigt: PTR/rDNS för EIP → `mail.searchboost.se`. **Detta är enda blockern för faktiskt utskick.** |
| Let's Encrypt SSL via UI | ⚠️ Inte applicerat (kräver port 80 + manuellt klick i UI) | Logga in i webadmin → SSL → Let's Encrypt för `mail.searchboost.se` |
| Inboxtester | ❌ | Skicka testmail från `utskick.searchboost.se` → `mail-tester.com`, `glockapps`. Mål: 9+/10. |
| IP-warmup | ❌ | Börja låga volymer (50-100/dag), öka 20% per dag i 2-3 veckor innan vi tryck-skickar 2000 prospekt |
| Sequence-engine (drip) | ❌ Använder BillionMail-UI men inte automatiserat | Bygg `lambda-functions/prospect-sequence-engine.js` som läser från BQ `prospect_pipeline` → schemalägger 4-stegs sekvens (intro → audit-rapport → casestudy → "är detta något?") via BillionMail SMTP |
| Suppression / klagomål | ❌ | Inkommande bounce/feedback från Rspamd loggas, men ingen koppling till BQ `prospect_pipeline` ännu |

## Driftkommandon

```bash
# SSH
aws ec2 authorize-security-group-ingress --group-id sg-0662a999ad1b0b820 --protocol tcp --port 22 \
  --cidr "$(curl -s -4 ifconfig.me)/32" --region eu-north-1 --profile mikael
aws ec2-instance-connect send-ssh-public-key --instance-id i-01df92c92d878f95f --instance-os-user ubuntu \
  --ssh-public-key file://~/.ssh/id_ed25519.pub --region eu-north-1 --profile mikael
ssh -i ~/.ssh/id_ed25519 ubuntu@13.61.132.229

# Status
sudo docker compose -f /opt/BillionMail/docker-compose.yml ps
sudo bash /opt/BillionMail/bm.sh default

# Lägg till en ny utskicksdomän
sudo bash /opt/BillionMail/bm.sh add-domain ny-domän.searchboost.se
sudo bash /opt/BillionMail/bm.sh show-record ny-domän.searchboost.se   # ger DNS-poster

# Skapa SMTP-användare
sudo bash /opt/BillionMail/bm.sh add-email kampanj@utskick.searchboost.se '<lösenord>'
```

## Säkerhet / deliverability

- DKIM genereras automatiskt vid `add-domain`; publik nyckel måste sättas i Loopia som TXT under `default._domainkey.<domän>`.
- SPF `v=spf1 mx ~all` — softfail. Strikt `-all` när vi är säkra på att inga andra IP:n skickar för domänen.
- DMARC börjar på `p=quarantine`, höjs till `p=reject` efter 30 dagar utan abuse-rapporter.
- Postmaster på Google Postmaster Tools efter port 25 är fri — för leveransstatistik.

## Roadmap

1. AWS port 25 utgående + PTR/rDNS (Mikael ansöker via Console).
2. Let's Encrypt-SSL appliceras via UI.
3. mail-tester.com 9+/10 score uppnådd från `utskick.searchboost.se`.
4. IP-warmup-schema startas (50/dag dag 1 → 2000/dag dag 21).
5. `prospect-sequence-engine.js` Lambda byggs → läser `prospect_pipeline` → SMTP via BillionMail.
6. BQ-tabell `email_send_log` skrivs per skickat mail (open/click via Rspamd webhooks).
