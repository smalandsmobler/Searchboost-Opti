#!/bin/bash
# ── Let's Encrypt SSL-setup för affarsboost.se ──────────────────────────────
#
# Kör som: sudo bash setup-ssl.sh
#
# Förutsättning: DNS A-record för affarsboost.se pekar mot denna servers IP.
# Verifiera med: dig +short affarsboost.se
#
# Domäner som täcks:
#   affarsboost.se
#   www.affarsboost.se
#   xn--affrsboost-s5a.se   (punycode för affärsboost.se)
#   www.xn--affrsboost-s5a.se

set -euo pipefail

DOMAIN="affarsboost.se"
EMAIL="hej@affarsboost.se"
CERTBOT_DIR="/var/www/certbot"
NGINX_AVAILABLE="/etc/nginx/sites-available"
NGINX_ENABLED="/etc/nginx/sites-enabled"

echo "=== Affärsboost — Let's Encrypt SSL Setup ==="
echo "Domain: $DOMAIN"
echo ""

# 1. Installera certbot om det saknas
if ! command -v certbot &> /dev/null; then
    echo "Installerar certbot..."
    apt-get update -qq
    apt-get install -y certbot python3-certbot-nginx
fi

# 2. Skapa certbot-mappen för http-challenge
mkdir -p "$CERTBOT_DIR"

# 3. Aktivera nginx-konfigurationen om den inte redan är aktiv
if [ ! -L "$NGINX_ENABLED/affarsboost" ]; then
    if [ -f "$NGINX_AVAILABLE/affarsboost" ]; then
        ln -s "$NGINX_AVAILABLE/affarsboost" "$NGINX_ENABLED/affarsboost"
        echo "Nginx-konfiguration aktiverad."
    else
        echo "FEL: $NGINX_AVAILABLE/affarsboost saknas."
        echo "Kopiera deploy/nginx-affarsboost.conf dit först."
        exit 1
    fi
fi

# 4. Inaktivera SSL-blocken tillfälligt (certifikaten finns inte än)
#    Kommentera bort ssl_certificate-raderna i en temporär kopia
TEMP_CONF=$(mktemp)
sed 's/^\(\s*ssl_certificate\)/#DISABLED \1/g' \
    "$NGINX_AVAILABLE/affarsboost" > "$TEMP_CONF"

# 5. Starta om nginx med HTTP-only config
echo "Testar nginx-konfiguration..."
nginx -t -c /etc/nginx/nginx.conf 2>/dev/null || true
systemctl reload nginx

# 6. Utfärda certifikat
echo ""
echo "Begär Let's Encrypt-certifikat..."
certbot certonly \
    --nginx \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    -d "$DOMAIN" \
    -d "www.$DOMAIN" \
    -d "xn--affrsboost-s5a.se" \
    -d "www.xn--affrsboost-s5a.se" \
    --expand

echo ""
echo "Certifikat utfärdat!"

# 7. Aktivera full nginx-konfiguration (med SSL)
echo "Laddar om nginx med SSL..."
nginx -t
systemctl reload nginx

# 8. Sätt upp auto-förnyelse via cron
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -
    echo "Automatisk förnyelse konfigurerad (varje dag 03:00)."
fi

echo ""
echo "=== Klart! ==="
echo "https://affarsboost.se bör nu svara med giltigt SSL-certifikat."
echo ""
echo "Verifiera med: curl -I https://affarsboost.se"
echo "SSL-rapport:   https://www.ssllabs.com/ssltest/analyze.html?d=affarsboost.se"
