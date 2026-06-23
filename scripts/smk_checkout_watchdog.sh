#!/usr/bin/env bash
# SMK kassa-watchdog — körs varje timme via cron, larmar om kassan är trasig
# Lägg i crontab: 0 * * * * /Users/weerayootandersson/Downloads/Searchboost-Opti/scripts/smk_checkout_watchdog.sh

LOG=/tmp/smk_kassa_watchdog.log
TS=$(date '+%Y-%m-%d %H:%M:%S')

# Lägg en testvara (ID 3969) i en isolerad cookie-session
COOKIE=$(mktemp)
trap "rm -f $COOKIE" EXIT

curl -sk -c "$COOKIE" -o /dev/null --max-time 15 "https://smalandskontorsmobler.se/produkt/starko-fallbord/"
curl -sk -b "$COOKIE" -c "$COOKIE" -o /dev/null --max-time 15 -L "https://smalandskontorsmobler.se/?add-to-cart=3969&quantity=1"

KASSA_CODE=$(curl -sk -b "$COOKIE" -o /dev/null -w "%{http_code}" --max-time 15 -L "https://smalandskontorsmobler.se/kassa/")
MITTKONTO_CODE=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "https://smalandskontorsmobler.se/mitt-konto/")
VARUKORG_CODE=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "https://smalandskontorsmobler.se/varukorg/")

ALL_OK=true
[ "$KASSA_CODE" != "200" ] && ALL_OK=false
[ "$MITTKONTO_CODE" != "200" ] && ALL_OK=false
[ "$VARUKORG_CODE" != "200" ] && ALL_OK=false

if [ "$ALL_OK" = true ]; then
  echo "[$TS] OK kassa=$KASSA_CODE mittkonto=$MITTKONTO_CODE varukorg=$VARUKORG_CODE" >> $LOG
else
  MSG="[$TS] FEL!! kassa=$KASSA_CODE mittkonto=$MITTKONTO_CODE varukorg=$VARUKORG_CODE"
  echo "$MSG" >> $LOG
  # Mac notifikation
  osascript -e "display notification \"SMK kassa trasig: kassa=$KASSA_CODE\" with title \"⚠️ SMK Watchdog\" sound name \"Sosumi\"" 2>/dev/null
  # Mail via Loopia SMTP (om Python tillgängligt)
  python3 - <<PYEOF 2>>$LOG
import smtplib, ssl
from email.message import EmailMessage
import os
msg = EmailMessage()
msg['Subject'] = '🚨 SMK Watchdog: Kassan trasig'
msg['From'] = 'info@searchboost.se'
msg['To'] = 'mikael@searchboost.se'
msg.set_content(f'''SMK kassa-watchdog larm:

$MSG

URL: https://smalandskontorsmobler.se/kassa/
Logg: $LOG

Senaste check: $TS''')
try:
    with smtplib.SMTP_SSL('mailcluster.loopia.se', 465, context=ssl.create_default_context()) as s:
        # Lösenord saknas i scriptet — ange manuellt eller via env
        pwd = os.environ.get('LOOPIA_PWD')
        if pwd:
            s.login('info@searchboost.se', pwd)
            s.send_message(msg)
            print('Mail skickat')
except Exception as e:
    print(f'Mail-fel: {e}')
PYEOF
fi
