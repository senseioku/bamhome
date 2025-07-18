# BAM Ecosystem - Vercel Deployment Guide

## Quick Deployment Steps

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "Initial BAM Ecosystem deployment"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy to Vercel
1. Visit [vercel.com](https://vercel.com)
2. Click "Import Project"
3. Select your GitHub repository
4. Vercel will automatically detect the configuration

### 3. Environment Variables (Optional)
If you plan to add database functionality later:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NODE_ENV` - Set to "production"

## Project Structure for Deployment

```
BAM Ecosystem/
├── dist/
│   ├── index.js          # Backend server bundle
│   └── public/           # Frontend static files
│       ├── index.html
│       └── assets/
│           ├── bamToken_1752877645023.png
│           ├── index-[hash].js
│           └── index-[hash].css
├── vercel.json           # Vercel configuration
└── package.json          # Build scripts and dependencies
```

## Build Process

The project uses a dual-build system:
1. **Frontend**: Vite builds React app to `dist/public/`
2. **Backend**: ESBuild bundles Express server to `dist/index.js`

Build command: `npm run build`

## Custom Domain Setup

After deployment, you can configure custom domains:
- Primary: `bam-ecosystem.com`
- Subdomains: 
  - `apex.bam-ecosystem.com` (BAM ApexMiner)
  - `vip.bam-ecosystem.com` (BAM VIP Access)

## Performance Features

✅ **Optimized Build**: 710KB frontend (208KB gzipped)
✅ **Serverless Functions**: Lightweight 4.5KB backend
✅ **CDN Distribution**: Global edge network
✅ **Automatic HTTPS**: SSL certificates included
✅ **Image Optimization**: BAM Token logo properly served

## Troubleshooting

- **Functions Configuration**: Using @vercel/node for serverless functions
- **Asset Serving**: Logo and static files properly routed with @vercel/static
- **Build Success**: All components build without errors
- **Runtime Error**: Fixed invalid runtime specification in vercel.json

## Common Issues Fixed

### ✅ Function Runtime Error
- **Issue**: "Function Runtimes must have a valid version"
- **Solution**: Switched to `@vercel/static-build` for pure React SPA deployment

### ✅ Vite Build Error 
- **Issue**: Rollup failed to resolve import "/src/main.tsx" during Vercel build
- **Solution**: Simplified Vercel configuration to use direct `vite build` command

### ✅ 404 Not Found Error
- **Issue**: Static files not properly served
- **Solution**: Simplified to static deployment with proper routing fallback

### Build Process
1. Vercel runs `npm run build` 
2. Vite builds React app to `dist/public/`
3. All routes fallback to `index.html` for SPA routing
4. Static assets served directly from CDN

### Simplified Static Deployment
- Uses `@vercel/static-build` for optimal React SPA deployment
- All routes fallback to `index.html` for client-side routing
- Static assets (BAM Token logo, CSS, JS) served directly from CDN
- No server-side routing complexity - pure static deployment

### Benefits
- Faster loading with CDN distribution
- Simpler deployment configuration
- Better caching for static assets
- No server functions needed for this landing page

Ready for production deployment!