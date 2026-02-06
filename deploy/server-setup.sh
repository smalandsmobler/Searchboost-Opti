#!/bin/bash
# Server Setup Script - Kör detta på EC2 instansen efter SSH

set -e

echo "🚀 Babylovesgrowth Server Setup"
echo "================================"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
echo "📦 Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
echo "📦 Installing PM2..."
sudo npm install -g pm2

# Install Nginx
echo "📦 Installing Nginx..."
sudo apt install -y nginx

# Install Certbot for SSL
echo "📦 Installing Certbot..."
sudo apt install -y certbot python3-certbot-nginx

# Install Git
echo "📦 Installing Git..."
sudo apt install -y git

# Create app directory
echo "📁 Creating application directory..."
sudo mkdir -p /var/www/babylovesgrowth
sudo chown -R $USER:$USER /var/www/babylovesgrowth

# Clone repository
echo "📥 Cloning Babylovesgrowth repository..."
cd /var/www/babylovesgrowth
git clone https://github.com/smalandsmobler/Babylovesgrowth.git .
git checkout claude/integrate-babylovesgrowth-blogging-at2mC

# Install dependencies
echo "📦 Installing application dependencies..."
npm install

# Build application
echo "🔨 Building application..."
npm run build

# Create .env file
echo "⚙️  Creating .env file..."
cat > .env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=production

# Base URL - CHANGE THIS to your domain
BASE_URL=https://babylovesgrowth.yourdomain.com

# Abicart API Configuration
ABICART_API_URL=https://admin.abicart.se/backend/jsonrpc/v1
ABICART_API_KEY=YXV0aDp4sbc1Skvs2bkiLsHrC9FUCDCjalXHlk4YaF2rRzFqhS+4
ABICART_SHOP_ID=smalandskontorsmobler.se

# Auto-Publishing Configuration
ENABLE_AUTO_PUBLISH=true
PUBLISH_SCHEDULE=0 9 * * *

# Cache settings
CACHE_TTL=300
EOF

echo "✅ .env file created (remember to update BASE_URL!)"

# Setup PM2
echo "🔧 Setting up PM2..."
pm2 start npm --name "babylovesgrowth" -- start
pm2 save
pm2 startup

echo ""
echo "✅ Application started with PM2!"
echo ""
echo "📊 Check status: pm2 status"
echo "📜 View logs: pm2 logs babylovesgrowth"
echo "🔄 Restart: pm2 restart babylovesgrowth"
echo ""
echo "Next steps:"
echo "1. Configure Nginx (see nginx-config.sh)"
echo "2. Setup SSL certificate"
echo "3. Update BASE_URL in .env"
echo "4. Whitelist this server's IP in Abicart"
