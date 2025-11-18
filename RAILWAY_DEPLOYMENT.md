# 🚂 Railway Deployment Guide for InturnX

## 📋 Overview

This guide will help you deploy the InturnX platform to Railway.app. The project consists of:
- **Frontend**: React (Vite) application
- **Backend**: Express.js server with Socket.IO
- **AI Service**: FastAPI Python service
- **Database**: MongoDB (via Railway or MongoDB Atlas)

## 🚀 Quick Deployment Steps

### Prerequisites
- Railway CLI installed ✅
- Railway account (free tier available)
- MongoDB connection string (Railway MongoDB or MongoDB Atlas)

### Step 1: Login to Railway
```bash
railway login
```

### Step 2: Create a New Project
```bash
railway init
```
Follow the prompts to create a new project.

### Step 3: Add MongoDB Database
You have two options:

**Option A: Use Railway's MongoDB (Recommended)**
```bash
railway add
# Select "MongoDB" from the list
```

**Option B: Use MongoDB Atlas**
- Create a cluster at https://cloud.mongodb.com
- Get your connection string
- Add it as an environment variable (see Step 4)

### Step 4: Set Environment Variables
```bash
railway variables set MONGODB_URI="your-mongodb-connection-string"
railway variables set JWT_SECRET="your-jwt-secret-key"
railway variables set SESSION_SECRET="your-session-secret-key"
railway variables set NODE_ENV="production"
railway variables set CLIENT_URL="https://your-app.up.railway.app"
```

**Optional OAuth Variables** (if using social login):
```bash
railway variables set GOOGLE_CLIENT_ID="your-google-client-id"
railway variables set GOOGLE_CLIENT_SECRET="your-google-client-secret"
railway variables set GITHUB_CLIENT_ID="your-github-client-id"
railway variables set GITHUB_CLIENT_SECRET="your-github-client-secret"
railway variables set LINKEDIN_CLIENT_ID="your-linkedin-client-id"
railway variables set LINKEDIN_CLIENT_SECRET="your-linkedin-client-secret"
```

### Step 5: Deploy
```bash
railway up
```

### Step 6: Generate Domain
```bash
railway domain
```

This will generate a public URL like `https://your-app.up.railway.app`

### Step 7: Update CLIENT_URL
After getting your domain, update the CLIENT_URL variable:
```bash
railway variables set CLIENT_URL="https://your-actual-domain.up.railway.app"
```

## 📁 Project Structure

```
inturnX/
├── client/              # React frontend (Vite)
├── server/              # Express.js backend
├── ai_service/          # FastAPI AI service
├── railway.json         # Railway configuration
├── nixpacks.toml        # Build configuration
├── Procfile             # Process definition
└── package.json         # Root package.json
```

## 🔧 Configuration Files

### railway.json
Defines Railway-specific deployment settings.

### nixpacks.toml
Configures the build process:
- Installs Node.js 18 and Python 3.11
- Installs dependencies for all services
- Builds the React frontend
- Starts the Express server

### Procfile
Defines the start command for the web service.

## 🌐 Multi-Service Architecture

For a more advanced setup with separate services:

1. **Create separate Railway services** for each component
2. **Backend Service**: Deploy `server/` directory
3. **AI Service**: Deploy `ai_service/` directory  
4. **Frontend**: Deploy as static site or serve from backend

## 📊 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | Secret for JWT tokens |
| `SESSION_SECRET` | ✅ | Secret for sessions |
| `NODE_ENV` | ✅ | Set to "production" |
| `CLIENT_URL` | ✅ | Frontend URL |
| `PORT` | ❌ | Auto-set by Railway |
| `GOOGLE_CLIENT_ID` | ❌ | Google OAuth |
| `GOOGLE_CLIENT_SECRET` | ❌ | Google OAuth |
| `GITHUB_CLIENT_ID` | ❌ | GitHub OAuth |
| `GITHUB_CLIENT_SECRET` | ❌ | GitHub OAuth |
| `LINKEDIN_CLIENT_ID` | ❌ | LinkedIn OAuth |
| `LINKEDIN_CLIENT_SECRET` | ❌ | LinkedIn OAuth |

## 🐛 Troubleshooting

### Build Fails
- Check Railway build logs: `railway logs`
- Ensure all dependencies are in package.json
- Verify Python requirements are correct

### App Not Starting
- Check runtime logs: `railway logs`
- Verify environment variables are set
- Check MongoDB connection

### 502 Bad Gateway
- App might be starting on wrong port
- Railway sets PORT automatically - ensure server uses `process.env.PORT`

### Database Connection Issues
- Verify MONGODB_URI is correct
- Check MongoDB Atlas IP whitelist (allow all: 0.0.0.0/0)
- Ensure database user has correct permissions

## 📝 Post-Deployment Checklist

- [ ] App is accessible via Railway domain
- [ ] Database connection working
- [ ] User registration/login working
- [ ] OAuth providers configured (if using)
- [ ] Frontend loads correctly
- [ ] API endpoints responding
- [ ] Socket.IO connections working
- [ ] AI service endpoints functional

## 🔄 Updating Your Deployment

To deploy updates:
```bash
railway up
```

To view logs:
```bash
railway logs
```

To open your app:
```bash
railway open
```

## 💡 Tips

1. **Use Railway's MongoDB** for easier setup
2. **Monitor logs** during first deployment
3. **Set up custom domain** in Railway dashboard
4. **Enable auto-deployments** from GitHub
5. **Use Railway's metrics** to monitor performance

## 🆘 Need Help?

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- Check logs: `railway logs`

---

**Ready to deploy!** Run `railway init` to get started.

