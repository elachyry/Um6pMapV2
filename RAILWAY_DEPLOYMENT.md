# Railway Deployment Guide for UM6P Map

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository connected to Railway
- Mapbox API key

## 🚀 Deployment Steps

### 1. Create New Project on Railway
1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `Um6pMapV2` repository

### 2. Configure Environment Variables

Add these environment variables in Railway dashboard:

#### Required Variables:
```env
# Node Environment
NODE_ENV=production

# Server Configuration
PORT=8082

# Database (Railway will provide this automatically if you add PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database

# JWT Secret (generate a strong random string)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Frontend URL (your Railway app URL)
FRONTEND_URL=https://your-app.railway.app
CLIENT_URL=https://your-app.railway.app

# Mapbox
VITE_MAPBOX_API_KEY=your-mapbox-api-key

# API URL (your Railway app URL)
VITE_API_URL=https://your-app.railway.app

# Email Configuration (Optional - for password reset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
FROM_EMAIL=your-email@gmail.com
FROM_NAME=UM6P Map

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
```

### 3. Add PostgreSQL Database (Recommended)

**Option A: Railway PostgreSQL (Recommended)**
1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically set `DATABASE_URL` environment variable

**Option B: External Database**
1. Use any PostgreSQL provider (Supabase, Neon, etc.)
2. Set `DATABASE_URL` manually in environment variables

### 4. Build Configuration

Railway will automatically detect the Dockerfile and use it.

**Build Command:** (Automatic from Dockerfile)
```bash
docker build -t um6p-map .
```

**Start Command:** (Automatic from Dockerfile)
```bash
node dist/index.js
```

### 5. Domain Configuration

**Option A: Railway Subdomain (Free)**
- Railway provides: `your-app.railway.app`
- No configuration needed

**Option B: Custom Domain**
1. Go to Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### 6. Deploy

1. Push your code to GitHub:
```bash
git add -A
git commit -m "feat: add Railway deployment configuration"
git push origin master
```

2. Railway will automatically:
   - Detect the Dockerfile
   - Build the Docker image
   - Run Prisma migrations
   - Start the application

### 7. Verify Deployment

Check these endpoints:
- Health check: `https://your-app.railway.app/api/health`
- API: `https://your-app.railway.app/api`
- Frontend: `https://your-app.railway.app`

## 🔧 Troubleshooting

### Build Fails
1. Check Railway logs for errors
2. Verify all environment variables are set
3. Ensure `DATABASE_URL` is correct

### Database Connection Issues
```bash
# Check if Prisma can connect
npx prisma db push
```

### Port Issues
- Railway automatically sets `PORT` environment variable
- Make sure your server uses `process.env.PORT`

### File Upload Issues
- Check upload directories are created
- Verify file permissions in container

## 📊 Monitoring

### View Logs
```bash
# In Railway dashboard
Project → Deployments → View Logs
```

### Database Management
```bash
# Connect to Railway PostgreSQL
railway connect postgres
```

### Metrics
- Railway provides built-in metrics
- CPU, Memory, Network usage
- Request/Response times

## 🔄 Updates & Redeployment

### Automatic Deployment
Every push to `master` branch triggers automatic deployment.

### Manual Deployment
1. Go to Railway dashboard
2. Click "Deploy" → "Redeploy"

### Rollback
1. Go to Deployments
2. Select previous deployment
3. Click "Redeploy"

## 💰 Cost Estimation

### Free Tier
- $5 credit per month
- Enough for small projects
- Includes:
  - 500 hours of usage
  - 100GB bandwidth
  - 1GB RAM

### Pro Plan ($20/month)
- Unlimited projects
- More resources
- Better performance

## 🔐 Security Checklist

- ✅ Use strong JWT_SECRET
- ✅ Enable HTTPS (automatic on Railway)
- ✅ Set secure CORS origins
- ✅ Use environment variables for secrets
- ✅ Enable rate limiting
- ✅ Regular database backups
- ✅ Monitor logs for suspicious activity

## 📝 Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment | `production` |
| `PORT` | Auto | Server port | `8082` |
| `DATABASE_URL` | Yes | PostgreSQL URL | Auto-set by Railway |
| `JWT_SECRET` | Yes | JWT signing key | Random string |
| `FRONTEND_URL` | Yes | Frontend URL | `https://app.railway.app` |
| `VITE_MAPBOX_API_KEY` | Yes | Mapbox key | Your API key |
| `VITE_API_URL` | Yes | API URL | `https://app.railway.app` |
| `SMTP_HOST` | No | Email host | `smtp.gmail.com` |
| `SMTP_USER` | No | Email user | `email@gmail.com` |
| `SMTP_PASS` | No | Email password | App password |

## 🆘 Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: Create issue in your repo

## ✅ Post-Deployment Checklist

- [ ] Application is accessible
- [ ] Database is connected
- [ ] Health check endpoint works
- [ ] Login/Signup works
- [ ] Map loads correctly
- [ ] File uploads work
- [ ] Email notifications work (if configured)
- [ ] All API endpoints respond
- [ ] No errors in logs
- [ ] Custom domain configured (optional)

## 🎉 Success!

Your UM6P Map application is now live on Railway! 🚀

Access your application at: `https://your-app.railway.app`
