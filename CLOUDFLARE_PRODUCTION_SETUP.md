# Cloudflare Production Setup for BAM Ecosystem AI Chat

## Issue Resolution: AI Chat Not Working in Production

### Root Cause
The AI chat functionality was failing in production due to:
1. **CORS restrictions** between bam-ecosystem.com and Vercel serverless functions
2. **Cloudflare proxy settings** interfering with API calls
3. **Missing environment variables** in production deployment

### ✅ FIXED: API Configuration Updates

#### 1. Enhanced CORS Headers
Updated both `/api/ai.js` and `/api/wallet/verify.js` with:
- Explicit domain whitelist for bam-ecosystem.com
- Cloudflare-compatible headers
- Origin validation and fallback handling

#### 2. Vercel Configuration
Updated `vercel.json` with:
- Global CORS headers for all API routes
- Proper cache control settings
- Origin variance handling

### 🔧 Required Cloudflare Settings

#### SSL/TLS Configuration
```
SSL/TLS Mode: Full (strict)
Always Use HTTPS: ON
Minimum TLS Version: 1.2
```

#### Page Rules for API Routes
Create page rule: `bam-ecosystem.com/api/*`
```
Cache Level: Bypass
Security Level: Medium
Browser Cache TTL: Respect Existing Headers
```

#### Security Settings
```
Security Level: Medium
Challenge Passage: 30 minutes
Browser Integrity Check: ON
Privacy Pass: ON
```

#### Speed Settings
```
Auto Minify: JavaScript ON, CSS ON, HTML OFF
Brotli: ON
Rocket Loader: OFF (important for web3 apps)
```

### 🔑 Required Environment Variables

In Vercel deployment, ensure these are set:
```
ANTHROPIC_API_KEY=your_actual_api_key
NODE_ENV=production
```

### 🧪 Testing Production API

Test endpoints directly:
```bash
# Test AI API
curl -X POST https://bamhome-dffukcgji-bamswaps-projects.vercel.app/api/ai \
  -H "Content-Type: application/json" \
  -H "Origin: https://bam-ecosystem.com" \
  -d '{"message": "Hello", "category": "general"}'

# Test Wallet Verification
curl -X POST https://bamhome-dffukcgji-bamswaps-projects.vercel.app/api/wallet/verify \
  -H "Content-Type: application/json" \
  -H "Origin: https://bam-ecosystem.com" \
  -d '{"walletAddress": "0x123...abc", "signature": "test", "message": "test"}'
```

### 🚀 Deployment Checklist

Before deploying to production:
- [ ] ANTHROPIC_API_KEY configured in Vercel
- [ ] Cloudflare SSL set to Full (strict)
- [ ] API route page rules configured
- [ ] Domain added to CORS whitelist
- [ ] Test API endpoints from production domain

### 🔍 Debugging Steps

If AI chat still doesn't work:

1. **Check Browser Console**
   - Look for CORS errors
   - Check API response status codes
   - Verify network requests are reaching endpoints

2. **Verify Cloudflare Settings**
   - Temporarily pause Cloudflare proxy
   - Test direct connection to Vercel
   - Check Cloudflare Analytics for blocked requests

3. **API Key Validation**
   - Verify ANTHROPIC_API_KEY in Vercel dashboard
   - Test API key with direct Anthropic API call
   - Check usage limits and billing status

### 📞 Support Contacts

- Cloudflare Support: For proxy and DNS issues
- Vercel Support: For serverless function deployment
- Anthropic Support: For API key and usage issues

### 🔄 Update Schedule

This configuration should be reviewed:
- After any Cloudflare plan changes
- When adding new domains
- Monthly for security updates