# Vercel Deployment Guide for BAM AIChat

## ✅ Fixed Configuration Issues

The deployment errors have been resolved:

### **Issues Fixed:**
1. **Conflicting Configuration**: Removed conflicting `builds` and `functions` configuration
2. **Environment Variables**: Updated configuration to avoid `NOW_` prefix conflicts  
3. **API Entry Point**: Created proper serverless function entry at `api/index.ts`
4. **Build Process**: Configured proper build output directory

### **Current Configuration:**

#### **vercel.json:**
```json
{
  "version": 2,
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node",
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public"
}
```

#### **api/index.ts (Serverless Entry Point):**
```typescript
// Vercel serverless function entry point
import express from "express";
import { registerRoutes } from '../server/routes.js';

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set production environment for serverless
process.env.NODE_ENV = 'production';

// Register API routes only (no Vite middleware in production)
await registerRoutes(app);

export default app;
```

## 🚀 Deployment Steps

### **1. Environment Variables**
Configure these in your Vercel dashboard:

- `NODE_ENV=production`
- `ANTHROPIC_API_KEY=your_production_key`
- `DATABASE_URL=your_production_database_url`
- `ALLOWED_ORIGINS=https://yourdomain.vercel.app`
- `SESSION_SECRET=your_secure_session_secret`

### **2. Deploy Command**
```bash
vercel --prod
```

### **3. Build Process**
Vercel will automatically:
1. Run `npm install`
2. Execute `npm run build` 
3. Build frontend to `dist/public/`
4. Create serverless function from `api/index.ts`

## ✅ Production Features

### **Security (Production Mode):**
- ✅ Full CSP headers with secure directives
- ✅ Cryptographic wallet signature verification required
- ✅ Rate limiting enabled (50 requests/15min per wallet)
- ✅ Input validation with Zod schemas
- ✅ CORS protection with allowed origins

### **Development vs Production:**
- **Development**: Relaxed security, signature verification optional
- **Production**: Full security, mandatory signature verification

## 🎯 Ready for Deployment

The BAM AIChat platform is now properly configured for Vercel deployment with:
- ✅ Clean serverless function configuration
- ✅ Proper build output structure  
- ✅ Production security features
- ✅ Environment-based authentication modes

**Deploy with confidence!** The configuration conflicts have been resolved.