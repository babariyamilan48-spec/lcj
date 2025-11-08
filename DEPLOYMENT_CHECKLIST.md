# 🚀 LCJ Deployment Checklist

## Pre-Deployment Setup

### 1. **Supabase Configuration** ✅
- [ ] Create Supabase project at [supabase.com](https://supabase.com)
- [ ] Get Project URL: `https://[YOUR_PROJECT_REF].supabase.co`
- [ ] Get Anon Key from Settings → API
- [ ] Get Service Role Key from Settings → API
- [ ] Get Database URL from Settings → Database
- [ ] Update `backend/.env.production` with Supabase credentials

### 2. **Upstash Redis Configuration** ✅
- [ ] Create Redis database at [upstash.com](https://upstash.com)
- [ ] Get Redis URL: `rediss://:[password]@[endpoint]:6380`
- [ ] Update `backend/.env.production` with Redis URL
- [ ] Test Redis connection locally

### 3. **Environment Variables Setup** ✅
- [ ] Copy and update `backend/.env.production`
- [ ] Copy and update `frontend/.env.production`
- [ ] Generate secure SECRET_KEY and JWT_SECRET_KEY
- [ ] Set GEMINI_API_KEY for AI features
- [ ] Configure CORS origins for production

## Backend Deployment (Render)

### 4. **Render Web Service Setup** ✅
- [ ] Push code to GitHub repository
- [ ] Create new Web Service on [render.com](https://render.com)
- [ ] Connect GitHub repository
- [ ] Configure build settings:
  ```
  Build Command: pip install -r requirements.txt
  Start Command: python start_production.py
  Environment: Python 3.11
  ```
- [ ] Add all environment variables from `.env.production`
- [ ] Deploy and verify health endpoint: `/health`

### 5. **Render Celery Worker Setup** ✅
- [ ] Create Background Worker service on Render
- [ ] Use same repository and branch
- [ ] Configure worker settings:
  ```
  Build Command: pip install -r requirements.prod.txt
  Start Command: python start_celery_production.py
  ```
- [ ] Add same environment variables as web service
- [ ] Deploy worker service

### 6. **Database Migration** ✅
- [ ] Access Render web service shell
- [ ] Run: `python migrate_production.py`
- [ ] Verify database tables created
- [ ] Check Supabase dashboard for tables
- [ ] Test database health: `/health/database`

## Frontend Deployment (Vercel)

### 7. **Vercel Setup** ✅
- [ ] Import project at [vercel.com](https://vercel.com)
- [ ] Set root directory to `frontend`
- [ ] Configure environment variables:
  ```
  NEXT_PUBLIC_API_URL=https://your-render-app.onrender.com
  NEXT_PUBLIC_APP_ENV=production
  NEXT_PUBLIC_APP_VERSION=1.0.0
  ```
- [ ] Deploy and test frontend

### 8. **URL Configuration Updates**
- [ ] Update `backend/core/middleware/middlewares.py` with actual Vercel URL
- [ ] Update `frontend/.env.production` with actual Render URL
- [ ] Update `frontend/vercel.json` rewrites with actual Render URL
- [ ] Redeploy both services

## Post-Deployment Verification

### 9. **Health Checks** ✅
- [ ] Backend health: `https://your-render-app.onrender.com/health`
- [ ] Database health: `https://your-render-app.onrender.com/health/database`
- [ ] Supabase health: `https://your-render-app.onrender.com/health/supabase`
- [ ] Frontend loads correctly
- [ ] API calls work from frontend to backend

### 10. **Feature Testing**
- [ ] User registration/authentication works
- [ ] Assessment functionality works
- [ ] Results are saved to database
- [ ] Email notifications work (if configured)
- [ ] Celery background tasks execute
- [ ] Redis caching works

### 11. **Performance Verification**
- [ ] Page load times < 3 seconds
- [ ] API response times < 1 second
- [ ] Database queries optimized
- [ ] Supabase connection pooling active
- [ ] No memory leaks in Celery workers

## Configuration Files Created ✅

### Backend Files:
- ✅ `backend/.env.production` - Production environment variables
- ✅ `backend/render.yaml` - Render deployment configuration
- ✅ `backend/requirements.prod.txt` - Production dependencies
- ✅ `backend/start_production.py` - Production server startup
- ✅ `backend/start_celery_production.py` - Celery worker startup
- ✅ `backend/migrate_production.py` - Database migration script
- ✅ `backend/core/supabase_client.py` - Supabase singleton client
- ✅ `backend/core/database_service.py` - Hybrid database service
- ✅ `backend/core/services/supabase_service.py` - Example service
- ✅ `backend/SUPABASE_INTEGRATION_GUIDE.md` - Integration documentation

### Frontend Files:
- ✅ `frontend/vercel.json` - Vercel deployment configuration
- ✅ `frontend/.env.production` - Production environment variables

## Security Checklist

### 12. **Security Verification**
- [ ] No sensitive data in environment variables exposed to client
- [ ] HTTPS enabled on all services
- [ ] CORS properly configured for production domains only
- [ ] Database access restricted to application services
- [ ] API rate limiting enabled
- [ ] Input validation on all endpoints

## Monitoring Setup

### 13. **Monitoring Configuration**
- [ ] Set up Render service monitoring
- [ ] Configure Supabase monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure log aggregation
- [ ] Set up uptime monitoring
- [ ] Create alerting for critical failures

## Backup Strategy

### 14. **Backup Configuration**
- [ ] Enable Supabase automatic backups
- [ ] Configure Redis persistence (if needed)
- [ ] Set up code repository backups
- [ ] Document recovery procedures
- [ ] Test backup restoration process

## Performance Optimization

### 15. **Performance Tuning**
- [ ] Enable Supabase connection pooling
- [ ] Configure Redis caching strategies
- [ ] Optimize database queries
- [ ] Enable frontend caching (CDN)
- [ ] Compress static assets
- [ ] Enable gzip compression

## Final Deployment Steps

### 16. **Go Live**
- [ ] Update DNS records (if using custom domain)
- [ ] Configure SSL certificates
- [ ] Update any external service webhooks
- [ ] Notify team of deployment
- [ ] Monitor for 24 hours post-deployment
- [ ] Document any issues and resolutions

## Rollback Plan

### 17. **Rollback Preparation**
- [ ] Document current deployment versions
- [ ] Prepare rollback scripts
- [ ] Test rollback procedure in staging
- [ ] Have database backup ready
- [ ] Prepare communication plan for rollback

## Success Metrics

### 18. **Deployment Success Criteria**
- [ ] All health checks passing
- [ ] Zero critical errors in logs
- [ ] Response times within acceptable limits
- [ ] All core features functional
- [ ] User authentication working
- [ ] Background tasks processing
- [ ] Database operations successful

---

## Quick Reference Commands

### Render Shell Commands:
```bash
# Check application status
python -c "import asyncio; from core.database_service import db_health_check; print(asyncio.run(db_health_check()))"

# Run migrations
python migrate_production.py

# Test Supabase connection
python -c "from core.supabase_client import supabase_health; print(supabase_health())"
```

### Local Testing Commands:
```bash
# Install production dependencies
pip install -r requirements.prod.txt

# Test production startup
python start_production.py

# Test Celery worker
python start_celery_production.py
```

## Support Contacts

- **Render Support**: [render.com/support](https://render.com/support)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Supabase Support**: [supabase.com/support](https://supabase.com/support)
- **Upstash Support**: [upstash.com/support](https://upstash.com/support)

---

**✅ Deployment Complete!** Your LCJ application is now running in production with:
- Fast, efficient Supabase integration with singleton pattern
- Automatic fallback between Supabase and SQLAlchemy
- Optimized connection pooling and caching
- Comprehensive health monitoring
- Scalable architecture ready for growth
