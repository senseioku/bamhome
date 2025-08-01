#!/bin/bash

# BAM AIChat Production Setup Script

echo "🚀 Setting up BAM AIChat for production deployment..."

# Environment check
if [ "$NODE_ENV" != "production" ]; then
    echo "⚠️  Warning: NODE_ENV is not set to 'production'"
    echo "Please set NODE_ENV=production for production deployment"
fi

# Required environment variables
required_vars=("ANTHROPIC_API_KEY" "DATABASE_URL")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    printf '%s\n' "${missing_vars[@]}"
    echo ""
    echo "Please set these variables before deploying to production:"
    echo "export ANTHROPIC_API_KEY=your_production_api_key"
    echo "export DATABASE_URL=your_production_database_url"
    echo "export NODE_ENV=production"
    echo "export ALLOWED_ORIGINS=https://yourdomain.com"
    exit 1
fi

echo "✅ Environment variables configured"

# Database setup
echo "📦 Setting up production database..."
npm run db:push

if [ $? -eq 0 ]; then
    echo "✅ Database schema updated"
else
    echo "❌ Database setup failed"
    exit 1
fi

# Build application
echo "🔨 Building application for production..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Application built successfully"
else
    echo "❌ Build failed"
    exit 1
fi

# Security audit
echo "🔐 Running security audit..."
npm audit --audit-level=high --production

echo ""
echo "🎉 Production setup complete!"
echo ""
echo "✅ Security Features Enabled:"
echo "   - Wallet signature verification"
echo "   - Rate limiting (50 requests/15min for chat)"
echo "   - Input validation with Zod schemas"
echo "   - Security headers via Helmet"
echo "   - CORS protection"
echo ""
echo "📋 Production Checklist:"
echo "   - [ ] Set up SSL/TLS certificates"
echo "   - [ ] Configure firewall rules" 
echo "   - [ ] Set up monitoring and logging"
echo "   - [ ] Configure database backups"
echo "   - [ ] Test wallet signature verification"
echo ""
echo "🚀 Ready for production deployment!"