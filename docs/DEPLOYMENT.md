# Deployment Guide

## Overview

This guide covers deploying the Mildenberg Project Platform to production environments.

## Prerequisites

- Node.js 18+ 
- Redis server
- Database (PostgreSQL recommended for production)
- Domain name and SSL certificate
- Server with at least 2GB RAM and 1 CPU core

## Environment Isolation

This application implements comprehensive environment isolation to prevent conflicts between production and staging environments, especially when they share the same domain with different subdomains.

### Isolation Features
- **Cookie Names**: Environment-specific prefixes prevent cookie collisions
- **Redis Keys**: Environment-specific prefixes and database separation
- **Domain Scoping**: Optional cookie domain configuration for subdomain isolation
- **Session Management**: Complete separation of user sessions between environments

### Recommended Setup
- **Production**: `prod.yourdomain.com` with Redis database 0
- **Staging**: `staging.yourdomain.com` with Redis database 1
- **Development**: `localhost:3000` with Redis database 2

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/mildenberg_prod"

# Redis (use database 0 for production)
REDIS_URL="redis://localhost:6379/0"

# Session
SESSION_SECRET="your-super-secure-session-secret-here"

# Cookie Domain (for subdomain isolation)
COOKIE_DOMAIN="prod.yourdomain.com"

# Next.js
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="your-nextauth-secret"

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID="your-analytics-id"
```

### 2. Database Setup

#### PostgreSQL (Recommended)

1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   ```

2. **Create Database**
   ```sql
   CREATE DATABASE mildenberg_prod;
   CREATE USER mildenberg_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE mildenberg_prod TO mildenberg_user;
   ```

3. **Update Prisma Schema**
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

4. **Deploy Schema**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

### 3. Redis Setup

1. **Install Redis**
   ```bash
   # Ubuntu/Debian
   sudo apt install redis-server
   
   # macOS
   brew install redis
   ```

2. **Configure Redis**
   ```bash
   # Edit /etc/redis/redis.conf
   requirepass your_redis_password
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

3. **Start Redis**
   ```bash
   sudo systemctl start redis-server
   sudo systemctl enable redis-server
   ```

## Deployment Options

### Option 1: Vercel (Recommended)

1. **Connect Repository**
   - Connect your GitHub repository to Vercel
   - Set environment variables in Vercel dashboard

2. **Configure Build Settings**
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install"
   }
   ```

3. **Environment Variables**
   - Add all production environment variables
   - Use Vercel's environment variable management

4. **Deploy**
   - Automatic deployments on git push
   - Preview deployments for pull requests

### Option 2: Docker

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base
   
   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   
   # Install dependencies
   COPY package.json package-lock.json ./
   RUN npm ci --only=production
   
   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   
   # Build the application
   RUN npm run build
   
   # Production image
   FROM base AS runner
   WORKDIR /app
   
   ENV NODE_ENV production
   
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   
   USER nextjs
   
   EXPOSE 3000
   
   ENV PORT 3000
   
   CMD ["node", "server.js"]
   ```

2. **Create docker-compose.yml**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - DATABASE_URL=postgresql://user:pass@db:5432/mildenberg_prod
         - REDIS_URL=redis://redis:6379
       depends_on:
         - db
         - redis
     
     db:
       image: postgres:15
       environment:
         - POSTGRES_DB=mildenberg_prod
         - POSTGRES_USER=mildenberg_user
         - POSTGRES_PASSWORD=secure_password
       volumes:
         - postgres_data:/var/lib/postgresql/data
     
     redis:
       image: redis:7-alpine
       command: redis-server --requirepass your_redis_password
       volumes:
         - redis_data:/data
   
   volumes:
     postgres_data:
     redis_data:
   ```

3. **Deploy with Docker**
   ```bash
   docker-compose up -d
   ```

### Option 3: Traditional Server

1. **Server Setup**
   ```bash
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   
   # Install PM2
   npm install -g pm2
   
   # Install Nginx
   sudo apt install nginx
   ```

2. **Application Setup**
   ```bash
   # Clone repository
   git clone <repository-url>
   cd p-manager-use-cache
   
   # Install dependencies
   npm install
   
   # Build application
   npm run build
   
   # Start with PM2
   pm2 start npm --name "mildenberg-app" -- start
   pm2 save
   pm2 startup
   ```

3. **Nginx Configuration**
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

## SSL Certificate

### Let's Encrypt (Free)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Monitoring & Logging

### 1. Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Logs
pm2 logs mildenberg-app
```

### 2. Database Monitoring
```sql
-- Check connections
SELECT count(*) FROM pg_stat_activity;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC;
```

### 3. Redis Monitoring
```bash
# Redis CLI
redis-cli info memory
redis-cli monitor
```

## Backup Strategy

### 1. Database Backup
```bash
# Daily backup script
#!/bin/bash
pg_dump mildenberg_prod > backup_$(date +%Y%m%d).sql
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

### 2. Redis Backup
```bash
# Redis persistence is enabled by default
# Backup RDB files
cp /var/lib/redis/dump.rdb /backup/redis_$(date +%Y%m%d).rdb
```

## Performance Optimization

### 1. Database Optimization
- Enable connection pooling
- Add appropriate indexes
- Regular VACUUM and ANALYZE

### 2. Redis Optimization
- Configure appropriate memory limits
- Use Redis clustering for high availability
- Monitor memory usage

### 3. Application Optimization
- Enable gzip compression
- Use CDN for static assets
- Implement proper caching headers

## Security Checklist

- [ ] Change default passwords
- [ ] Enable firewall (ports 22, 80, 443 only)
- [ ] Install fail2ban
- [ ] Regular security updates
- [ ] SSL certificate installed
- [ ] Database access restricted
- [ ] Redis password protected
- [ ] Session secrets are secure
- [ ] Environment variables secured

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database server is running
   - Check firewall settings

2. **Redis Connection Errors**
   - Verify Redis server is running
   - Check REDIS_URL format
   - Verify Redis password

3. **Build Errors**
   - Check Node.js version
   - Clear node_modules and reinstall
   - Check environment variables

4. **Performance Issues**
   - Monitor database queries
   - Check Redis memory usage
   - Review application logs

### Log Locations
- Application logs: PM2 logs or Docker logs
- Nginx logs: `/var/log/nginx/`
- Database logs: PostgreSQL log directory
- Redis logs: `/var/log/redis/`

## Maintenance

### Regular Tasks
- [ ] Weekly database backups
- [ ] Monthly security updates
- [ ] Quarterly performance reviews
- [ ] Annual SSL certificate renewal

### Monitoring Alerts
- Set up alerts for:
  - High CPU usage
  - Memory usage
  - Database connection errors
  - Application errors
  - Disk space


