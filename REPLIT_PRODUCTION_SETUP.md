# Replit Production Setup for BAM Ecosystem AI Chat

## Issue Resolution: AI Chat Not Working in Production

### Root Cause
The AI chat functionality was failing in production due to:
1. **CORS restrictions** between bam-ecosystem.com and your Replit deployment
2. **Missing domain configuration** in server security settings
3. **Environment variables** not properly configured for production

### ✅ FIXED: Server Configuration Updates

#### 1. Enhanced CORS Configuration
Updated `server/security.ts` with:
- Explicit domain whitelist for bam-ecosystem.com
- Dynamic origin validation function
- Proper error handling for blocked origins

#### 2. Content Security Policy
Updated CSP headers to allow connections to your custom domain.

### 🔧 Required Replit Deployment Settings

#### Custom Domain Configuration
1. **Access Deployments Tab**: In your Replit workspace
2. **Go to Settings**: Click on your deployment settings
3. **Link Domain**: Add `bam-ecosystem.com` as custom domain
4. **DNS Setup**: Configure your domain registrar with:
   ```
   A Record: @ -> [Replit IP provided]
   TXT Record: @ -> [Replit verification code]
   ```

#### Environment Variables
In your Replit deployment, ensure these secrets are set:
```
ANTHROPIC_API_KEY=your_actual_anthropic_api_key
NODE_ENV=production
PORT=5000
```

### 🧪 Testing Production API

Your Replit deployment endpoints:
```bash
# Test AI API (replace with your actual Replit deployment URL)
curl -X POST https://[your-replit-deployment].repl.co/api/ai \
  -H "Content-Type: application/json" \
  -H "Origin: https://bam-ecosystem.com" \
  -d '{"message": "Hello", "category": "general"}'

# Test with your custom domain
curl -X POST https://bam-ecosystem.com/api/ai \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello", "category": "general"}'
```

### 🚀 Deployment Process

#### From Replit Workspace:
1. **Build Command**: `npm run build` (configured in .replit)
2. **Start Command**: `npm run start` (configured in .replit)
3. **Port**: 5000 (external port 80)

#### Deployment Type: Autoscale
- **Scaling**: Automatic based on traffic
- **Cost**: Pay per request
- **Suitable for**: Variable traffic AI chat applications

### 🔍 Debugging Steps

If AI chat still doesn't work:

1. **Check Replit Deployment Logs**
   - Go to Deployments tab in your workspace
   - Check deployment logs for errors
   - Look for CORS or API key errors

2. **Verify Environment Variables**
   - In Deployments settings, check Secrets tab
   - Ensure ANTHROPIC_API_KEY is properly set
   - Test API key with a simple curl request

3. **Domain Configuration**
   - Verify DNS records are pointing correctly
   - Check custom domain status in Replit
   - Test both .repl.co URL and custom domain

4. **Browser Console**
   - Check for CORS errors from bam-ecosystem.com
   - Verify API requests are reaching endpoints
   - Check network tab for failed requests

### 📊 Monitoring and Logs

Access your deployment logs:
1. **Replit Console**: Real-time application logs
2. **Deployment Metrics**: Request count, error rates
3. **Resource Usage**: CPU, memory, request patterns

### 🔄 Update Workflow

When making changes:
1. **Development**: Test locally with `npm run dev`
2. **Build**: Automatic via Replit deployment
3. **Deploy**: Push changes trigger auto-deployment
4. **Monitor**: Check logs and metrics post-deployment

### 🆘 Support Resources

- **Replit Docs**: https://docs.replit.com/cloud-services/deployments
- **Community**: Replit Discord for deployment issues
- **Support**: Replit support for billing/technical issues

### ⚠️ Important Notes

- **Rate Limiting**: AI calls limited to 10/minute to manage costs
- **Domain**: Ensure bam-ecosystem.com points to your Replit deployment
- **SSL**: Replit handles SSL certificates automatically for custom domains
- **Scaling**: Autoscale handles traffic spikes automatically

### 🔐 Security Considerations

- API endpoints protected with CORS for your domain only
- Rate limiting prevents abuse
- Environment variables secured in Replit Secrets
- Content Security Policy configured for production