#!/bin/bash
# Nginx Configuration Script

set -e

DOMAIN="babylovesgrowth.yourdomain.com"  # ÄNDRA DETTA!

echo "🌐 Setting up Nginx for $DOMAIN"

# Create Nginx configuration
sudo tee /etc/nginx/sites-available/babylovesgrowth << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Redirect all HTTP to HTTPS
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    # SSL certificates (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Proxy to Node.js app
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/babylovesgrowth-access.log;
    error_log /var/log/nginx/babylovesgrowth-error.log;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/babylovesgrowth /etc/nginx/sites-enabled/

# Test Nginx configuration
echo "🧪 Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo ""
echo "✅ Nginx configured!"
echo ""
echo "Next step: Get SSL certificate"
echo "Run: sudo certbot --nginx -d $DOMAIN"
