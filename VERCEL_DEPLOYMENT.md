# Vercel Deployment Guide for BAM AIChat

## ✅ Fixed Configuration Issues

The deployment errors have been resolved:

### **Issues Fixed:**
1. **404 Routing Error**: Fixed by switching to `functions`/`rewrites` configuration instead of `builds`/`routes`
2. **Runtime Configuration**: Using proper `@vercel/node@3.0.7` runtime specification
3. **Output Directory**: Correctly configured `outputDirectory: "dist/public"` for frontend files
4. **File Exclusion**: Updated `.vercelignore` to include necessary server files for deployment
5. **API Entry Point**: Created proper serverless function entry at `api/index.ts`
6. **Build Process**: Configured proper build command and output structure

### **Current Configuration:**

#### **vercel.json:**
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": "dist/public",
  "functions": {
    "api/index.ts": {
      "runtime": "@vercel/node@3.0.7"
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.ts"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
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