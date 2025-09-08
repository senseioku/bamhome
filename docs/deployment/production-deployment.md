# Production Deployment

This guide covers deploying the BAM Ecosystem to production using Vercel with proper configuration for optimal performance and security.

## Vercel Deployment

The BAM Ecosystem is optimized for deployment on Vercel's serverless platform, providing excellent performance, scalability, and global distribution.

### Prerequisites

Before deploying, ensure you have:

- **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- **GitHub Repository**: Code must be in a GitHub repository
- **Environment Variables**: All required secrets and configuration
- **Database**: Production PostgreSQL database (Neon recommended)

### Initial Setup

#### 1. Connect Repository

1. Log into your Vercel dashboard
2. Click "New Project"
3. Import your BAM Ecosystem repository from GitHub
4. Configure build settings (see below)

#### 2. Build Configuration

**Build Command**: `vite build`
**Output Directory**: `dist`
**Install Command**: `npm install --legacy-peer-deps`

### Environment Variables

Configure these environment variables in your Vercel project settings:

#### Database Configuration
```env
DATABASE_URL=postgresql://username:password@host:port/database
PGDATABASE=bam_ecosystem
PGHOST=your-neon-host.neon.tech
PGUSER=your-username
PGPASSWORD=your-password
PGPORT=5432
```

#### Blockchain Configuration
```env
VITE_CHAINSTACK_BSC_ENDPOINT=https://bsc-dataseed1.binance.org/
CHAINSTACK_BSC_ENDPOINT=https://bsc-dataseed1.binance.org/
```

#### AI Integration
```env
ANTHROPIC_API_KEY=your-anthropic-api-key
```

#### Application Settings
```env
NODE_ENV=production
VITE_API_URL=https://your-domain.com/api
```

### Vercel Configuration Files

#### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "/dist/index.html"
    }
  ],
  "functions": {
    "server/index.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

#### .vc-config.json (for AI endpoints)
```json
{
  "runtime": "nodejs18.x",
  "memory": 512,
  "maxDuration": 30,
  "regions": ["iad1"]
}
```

### Database Deployment

#### Using Neon Database

1. **Create Database**:
   - Sign up at [neon.tech](https://neon.tech)
   - Create new project
   - Copy connection string

2. **Schema Migration**:
   ```bash
   # Set DATABASE_URL environment variable
   export DATABASE_URL="your-neon-connection-string"
   
   # Push schema to production database
   npm run db:push
   ```

3. **Verify Connection**:
   ```bash
   # Test database connection
   npm run db:studio
   ```

### Deployment Process

#### Automatic Deployment

1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Configure Settings**: Set environment variables and build settings
3. **Deploy**: Push to main branch to trigger automatic deployment
4. **Monitor**: Check deployment logs and performance

#### Manual Deployment

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod

# Set environment variables
vercel env add ANTHROPIC_API_KEY
vercel env add DATABASE_URL
```

### Domain Configuration

#### Custom Domain Setup

1. **Add Domain**: In Vercel dashboard, go to Project Settings > Domains
2. **DNS Configuration**: Add CNAME record pointing to `cname.vercel-dns.com`
3. **SSL Certificate**: Automatically provisioned by Vercel
4. **Verification**: Verify domain ownership and SSL status

#### Domain Configuration Example
```
Type: CNAME
Name: @
Value: cname.vercel-dns.com
```

### Performance Optimization

#### Build Optimizations

**package.json** build script:
```json
{
  "scripts": {
    "build": "vite build --mode production",
    "build:analyze": "vite build --mode production && npx vite-bundle-analyzer"
  }
}
```

#### Caching Strategy

**Response Headers**:
```javascript
// Static assets
'Cache-Control': 'public, max-age=31536000, immutable'

// API responses
'Cache-Control': 'public, max-age=60, s-maxage=300'

// HTML pages
'Cache-Control': 'public, max-age=0, must-revalidate'
```

### Security Configuration

#### HTTP Security Headers

```javascript
// Implemented via Helmet.js
{
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline';"
}
```

#### CORS Configuration

```javascript
const corsOptions = {
  origin: ['https://bam-ecosystem.com', 'https://www.bam-ecosystem.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};
```

### Monitoring & Analytics

#### Application Monitoring

1. **Vercel Analytics**: Built-in performance monitoring
2. **Error Tracking**: Integrated error logging and alerting
3. **Performance Metrics**: Core Web Vitals monitoring
4. **Real User Monitoring**: Actual user experience metrics

#### Custom Monitoring

```javascript
// Performance monitoring
const performanceObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    // Log performance metrics
    console.log('Performance metric:', entry);
  });
});

performanceObserver.observe({ entryTypes: ['navigation', 'paint'] });
```

### Backup & Recovery

#### Database Backups

1. **Automated Backups**: Neon provides automatic backups
2. **Point-in-Time Recovery**: Available for the last 7 days
3. **Manual Backups**: Regular export of critical data
4. **Disaster Recovery**: Multi-region backup strategy

#### Code Backups

1. **Git Repository**: Primary code backup via GitHub
2. **Release Tags**: Version-tagged releases
3. **Deployment History**: Vercel maintains deployment history
4. **Rollback Capability**: One-click rollback to previous deployments

### Scaling Considerations

#### Auto-Scaling

- **Serverless Functions**: Automatic scaling based on traffic
- **Global CDN**: Content distribution across edge locations
- **Database Scaling**: Connection pooling and read replicas
- **Rate Limiting**: Automatic protection against traffic spikes

#### Performance Monitoring

```javascript
// Monitor key metrics
const metrics = {
  responseTime: performance.now(),
  memoryUsage: process.memoryUsage(),
  cpuUsage: process.cpuUsage(),
  activeConnections: connectionPool.totalCount
};
```

### Deployment Checklist

#### Pre-Deployment

- [ ] All environment variables configured
- [ ] Database schema migrated
- [ ] API endpoints tested
- [ ] Security headers configured
- [ ] Domain DNS configured
- [ ] SSL certificate verified

#### Post-Deployment

- [ ] Application loads correctly
- [ ] Wallet connection works
- [ ] AI Chat functionality verified
- [ ] Swap operations tested
- [ ] Database connections stable
- [ ] Performance metrics acceptable
- [ ] Error rates within acceptable limits

### Troubleshooting

#### Common Issues

**Build Failures**:
```bash
# Check build logs
vercel logs your-deployment-url

# Local build test
npm run build
```

**Environment Variable Issues**:
```bash
# List environment variables
vercel env ls

# Pull environment variables locally
vercel env pull .env.local
```

**Database Connection Issues**:
- Verify DATABASE_URL format
- Check Neon database status
- Test connection string locally
- Ensure IP allowlist configuration

#### Performance Issues

1. **Slow Response Times**:
   - Check Vercel function logs
   - Monitor database query performance
   - Analyze bundle size and loading times

2. **High Error Rates**:
   - Review error logs and stack traces
   - Check external API status (Anthropic, Chainlink)
   - Verify rate limiting configuration

### Maintenance

#### Regular Tasks

**Weekly**:
- Review error logs and performance metrics
- Check security alerts and updates
- Monitor database performance
- Verify backup integrity

**Monthly**:
- Update dependencies and security patches
- Review and optimize database queries
- Analyze user feedback and performance data
- Plan feature deployments and improvements

**Quarterly**:
- Security audit and penetration testing
- Performance optimization review
- Infrastructure cost analysis
- Disaster recovery testing

---

This production deployment guide ensures a secure, performant, and scalable deployment of the BAM Ecosystem on Vercel with proper monitoring and maintenance procedures.