# 🚂 Railway Deployment - Quick Reference

## ✅ What's Been Done

1. **Railway CLI Installed** ✅
2. **Logged in to Railway** ✅ (as 24f2007973@ds.study.iitm.ac.in)
3. **Project Created** ✅
   - Project Name: inturnX
   - Project URL: https://railway.com/project/4e7f0c4f-7bf0-4b77-9c6d-c7ca08f756c9
4. **Configuration Files Created** ✅
   - `railway.json` - Railway configuration
   - `nixpacks.toml` - Build configuration (Node.js 22 + Python 3.11)
   - `Procfile` - Process definition
5. **Initial Deployment Started** ✅

## 🔧 Next Steps

### 1. Monitor Build Progress
The build is currently in progress. Check the Railway dashboard:
```
https://railway.com/project/4e7f0c4f-7bf0-4b77-9c6d-c7ca08f756c9
```

Or view logs in terminal:
```bash
railway logs
```

### 2. Set Up Environment Variables

Once the build completes, you MUST set these environment variables:

```bash
# Required Variables
railway variables --set "MONGODB_URI=your-mongodb-connection-string"
railway variables --set "JWT_SECRET=your-jwt-secret-key"
railway variables --set "SESSION_SECRET=your-session-secret-key"
railway variables --set "NODE_ENV=production"
```

**Get MongoDB Connection String:**
- **Option A**: Add Railway MongoDB
  ```bash
  railway add
  # Select MongoDB from the list
  # Railway will automatically set MONGODB_URI
  ```

- **Option B**: Use MongoDB Atlas
  1. Go to https://cloud.mongodb.com
  2. Create a free cluster
  3. Get connection string
  4. Set it: `railway variables --set "MONGODB_URI=mongodb+srv://..."`

### 3. Generate Public Domain

```bash
railway domain
```

This will give you a URL like: `https://inturnx-production.up.railway.app`

### 4. Update CLIENT_URL

After getting your domain, update the CLIENT_URL:
```bash
railway variables --set "CLIENT_URL=https://your-actual-domain.up.railway.app"
```

### 5. (Optional) Set Up OAuth

If you want social login:

```bash
# Google OAuth
railway variables --set "GOOGLE_CLIENT_ID=your-google-client-id"
railway variables --set "GOOGLE_CLIENT_SECRET=your-google-client-secret"

# GitHub OAuth
railway variables --set "GITHUB_CLIENT_ID=your-github-client-id"
railway variables --set "GITHUB_CLIENT_SECRET=your-github-client-secret"

# LinkedIn OAuth
railway variables --set "LINKEDIN_CLIENT_ID=your-linkedin-client-id"
railway variables --set "LINKEDIN_CLIENT_SECRET=your-linkedin-client-secret"
```

## 📝 Useful Commands

```bash
# View logs
railway logs

# View deployment logs
railway logs --deployment

# Open project in browser
railway open

# Check status
railway status

# Redeploy
railway up

# View environment variables
railway variables

# Link to different environment
railway environment

# SSH into container (for debugging)
railway run bash
```

## 🐛 Troubleshooting

### Build Failed
```bash
# Check build logs
railway logs --deployment

# Try redeploying
railway up
```

### App Not Starting
```bash
# Check runtime logs
railway logs

# Verify environment variables are set
railway variables
```

### Database Connection Issues
- Ensure MONGODB_URI is set correctly
- If using MongoDB Atlas, whitelist all IPs: `0.0.0.0/0`
- Check database user has correct permissions

### 502 Bad Gateway
- App might still be starting (wait 1-2 minutes)
- Check logs for errors: `railway logs`
- Verify PORT is not hardcoded (Railway sets it automatically)

## 📊 Project Structure

```
inturnX/
├── client/              # React frontend (built to dist/)
├── server/              # Express.js backend (runs on Railway)
├── ai_service/          # FastAPI AI service (dependencies installed)
├── railway.json         # Railway config
├── nixpacks.toml        # Build config (Node 22 + Python 3.11)
└── Procfile             # Start command: cd server && node server.js
```

## 🎯 Environment Variables Checklist

- [ ] MONGODB_URI (Required)
- [ ] JWT_SECRET (Required)
- [ ] SESSION_SECRET (Required)
- [ ] NODE_ENV=production (Required)
- [ ] CLIENT_URL (Required - set after getting domain)
- [ ] GOOGLE_CLIENT_ID (Optional)
- [ ] GOOGLE_CLIENT_SECRET (Optional)
- [ ] GITHUB_CLIENT_ID (Optional)
- [ ] GITHUB_CLIENT_SECRET (Optional)
- [ ] LINKEDIN_CLIENT_ID (Optional)
- [ ] LINKEDIN_CLIENT_SECRET (Optional)

## 🚀 Deployment Workflow

1. Make changes to code
2. Commit to git (optional but recommended)
3. Run `railway up`
4. Monitor logs: `railway logs`
5. Test your app at the Railway domain

## 💡 Tips

- Railway auto-deploys from GitHub if you connect your repo
- Use `railway logs` to debug issues
- Environment variables can be set in Railway dashboard too
- Free tier includes 500 hours/month and $5 credit

---

**Current Status**: Build in progress
**Next Action**: Wait for build to complete, then set environment variables

