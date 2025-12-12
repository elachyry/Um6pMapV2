# Health Check Failed - Troubleshooting Guide

## ✅ Good News
- Docker build **SUCCEEDED**!
- Image pushed successfully (552.8 MB)
- Container started

## ❌ Problem
- Health check at `/api/health` failing
- Service unavailable after 14 attempts (5 minutes)
- Application not responding

## 🔍 Most Likely Causes

### 1. Missing DATABASE_URL (Most Common)
**Symptom**: App crashes on startup trying to connect to database

**Solution**:
```bash
# In Railway Dashboard:
1. Click on your project
2. Go to "Variables" tab
3. Add: DATABASE_URL

# OR add PostgreSQL database:
1. Click "New" → "Database" → "PostgreSQL"
2. Railway auto-sets DATABASE_URL
```

### 2. Port Binding Issue
**Symptom**: Server listening on wrong port

**Check**: Does your server use `process.env.PORT`?

**Fix in server code** (`server/src/index.ts`):
```typescript
const PORT = process.env.PORT || 8082
```

### 3. Missing Environment Variables
**Required**:
- `DATABASE_URL` - PostgreSQL connection
- `JWT_SECRET` - For authentication
- `NODE_ENV=production`

**Optional but recommended**:
- `VITE_MAPBOX_API_KEY`
- `FRONTEND_URL`
- `CLIENT_URL`

### 4. Database Migrations Not Applied
**Symptom**: Prisma errors in logs

**Solution**: CMD in Dockerfile runs migrations:
```dockerfile
CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]
```

## 🛠️ Immediate Actions

### Step 1: Check Railway Logs
```bash
# In Railway Dashboard:
Deployments → Click failed deployment → View Logs

# Look for:
- "Error: DATABASE_URL not found"
- "ECONNREFUSED"
- "Prisma Client initialization error"
- Port binding errors
```

### Step 2: Add PostgreSQL Database
```bash
# In Railway:
1. Click "New" in your project
2. Select "Database" → "PostgreSQL"
3. Wait for it to provision
4. DATABASE_URL is auto-set
5. Redeploy your service
```

### Step 3: Set Required Environment Variables
```env
# Minimum required:
DATABASE_URL=<auto-set by Railway PostgreSQL>
JWT_SECRET=your-super-secret-key-min-32-chars
NODE_ENV=production

# Generate JWT_SECRET:
# Use: openssl rand -base64 32
```

### Step 4: Update Health Check Endpoint (if needed)

If `/api/health` doesn't exist, update Dockerfile:
```dockerfile
# Change healthcheck path
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8082}/ || exit 1
```

Or add health endpoint in your server:
```typescript
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() }
})
```

## 📋 Checklist

Before redeploying:
- [ ] PostgreSQL database added to Railway project
- [ ] DATABASE_URL environment variable set (or auto-set)
- [ ] JWT_SECRET environment variable set
- [ ] NODE_ENV=production set
- [ ] Server code uses `process.env.PORT`
- [ ] Health check endpoint exists at `/api/health`

## 🔄 Redeploy Steps

### Option 1: Automatic (if env vars added)
Railway will auto-redeploy when you add PostgreSQL or change env vars.

### Option 2: Manual
```bash
# Make a small change and push
git commit --allow-empty -m "trigger redeploy"
git push origin railway
```

### Option 3: Railway Dashboard
```bash
Deployments → Latest deployment → "Redeploy"
```

## 📊 Expected Logs (Success)

When working correctly, you should see:
```
✓ Prisma client generated
✓ Database schema pushed
✓ Server starting on port 8082
✓ Database connected
✓ Server listening on 0.0.0.0:8082
```

## 🚨 Common Error Messages

### "DATABASE_URL is not defined"
```bash
Solution: Add PostgreSQL database in Railway
```

### "Port 8082 is already in use"
```bash
Solution: Use process.env.PORT in your code
```

### "Prisma Client could not connect"
```bash
Solution: Check DATABASE_URL format and database is running
```

### "Cannot find module 'dist/index.js'"
```bash
Solution: TypeScript build failed - check build logs
```

## 🎯 Quick Fix Commands

### Check if dist folder exists:
```dockerfile
# Add to Dockerfile after build:
RUN ls -la dist/ && cat dist/index.js | head -20
```

### Test database connection:
```bash
# In Railway shell:
railway run npx prisma db push
```

### View real-time logs:
```bash
railway logs --follow
```

## 📞 Next Steps

1. **Check Railway logs** - Most important!
2. **Add PostgreSQL** if not already added
3. **Set environment variables**
4. **Redeploy**
5. **Monitor logs** during startup

## 💡 Pro Tip

Enable Railway's "Deploy Logs" to see:
- Build output
- Container startup
- Application logs
- Error messages

This will show exactly why the health check is failing!

---

## 🆘 Still Failing?

Share the Railway logs and I can help debug further. Look for:
- Red error messages
- Stack traces
- "Error:" lines
- Connection failures
