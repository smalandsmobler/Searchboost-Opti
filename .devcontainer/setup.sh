#!/bin/bash
# Codespaces Setup Script
# Runs automatically when Codespace is created

set -e

echo "🚀 Setting up Babylovesgrowth in GitHub Codespaces..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Create .env from example if not exists
if [ ! -f .env ]; then
  echo "⚙️  Creating .env file..."
  cp .env.example .env
  echo "✅ .env created - Remember to add your Abicart credentials!"
fi

# Display welcome message
cat << 'EOF'

╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🎉 Babylovesgrowth Ready! 🎉                   ║
║                                                           ║
║  Auto-Publishing Blog Platform for Smålandsmöbler        ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝

📝 Next Steps:

1. Update .env with your Abicart credentials:
   - ABICART_API_KEY=your_token
   - ABICART_SHOP_ID=smalandskontorsmobler.se

2. Start the server:
   npm run dev

3. Open in browser:
   https://<your-codespace-url>:3000

4. Test the API:
   - GET  /api/blog              - List blog posts
   - POST /api/blog              - Create blog post
   - GET  /api/seo/internal-links - Get link suggestions
   - POST /api/publish/now       - Publish now!

📚 Documentation:
   - AUTO-PUBLISH.md  - Auto-publishing guide
   - SEO-FEATURES.md  - SEO features guide
   - AWS-DEPLOYMENT.md - Production deployment

🚀 Happy coding!

EOF

echo ""
echo "✅ Setup complete! Run 'npm run dev' to start the server."
