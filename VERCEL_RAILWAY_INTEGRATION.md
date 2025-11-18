# 🔗 Vercel Frontend + Railway Backend Integration Guide

## Current Status

- ✅ **Vercel Frontend**: https://vercel.com/hariomsharma2644s-projects/inturn-x
- ✅ **Railway Backend**: https://inturnx-production.up.railway.app
- ⚠️ **Status**: Not connected yet - needs configuration

## 🚀 Quick Fix (3 Steps)

### Step 1: Add Environment Variables to Vercel

Go to your Vercel project settings and add these environment variables:

**URL**: https://vercel.com/hariomsharma2644s-projects/inturn-x/settings/environment-variables

Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_API_URL` | `https://inturnx-production.up.railway.app` | Production, Preview, Development |
| `VITE_SOCKET_URL` | `https://inturnx-production.up.railway.app` | Production, Preview, Development |

**How to add:**
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Click "Add New"
3. Enter variable name: `VITE_API_URL`
4. Enter value: `https://inturnx-production.up.railway.app`
5. Select all environments (Production, Preview, Development)
6. Click "Save"
7. Repeat for `VITE_SOCKET_URL`

### Step 2: Update Railway Backend CORS

Update Railway to allow your Vercel domain:

```bash
# Get your Vercel URL first (check your Vercel dashboard)
# It should be something like: https://inturn-x.vercel.app or https://inturn-x-git-main-hariomsharma2644s-projects.vercel.app

# Then update Railway
railway variables --set "CLIENT_URL=https://your-vercel-url.vercel.app"
```

Or add multiple allowed origins:
```bash
railway variables --set "ALLOWED_ORIGINS=https://inturn-x.vercel.app,https://inturn-x-git-main-hariomsharma2644s-projects.vercel.app,https://inturnx-production.up.railway.app"
```

### Step 3: Redeploy Vercel

After adding environment variables, trigger a new deployment:

**Option A: Via Vercel Dashboard**
1. Go to Deployments tab
2. Click on the latest deployment
3. Click "Redeploy"

**Option B: Via Git**
```bash
git commit --allow-empty -m "Trigger Vercel redeploy"
git push
```

**Option C: Via Vercel CLI**
```bash
cd client
vercel --prod
```

## 🔧 Backend CORS Configuration

Your Railway backend needs to be updated to allow Vercel domain. Let me check the current CORS setup:

**Current CORS in `server/server.js`:**
```javascript
cors: {
  origin: [process.env.CLIENT_URL || "http://localhost:5173", ...],
  credentials: true
}
```

This is already configured correctly! Just need to set the `CLIENT_URL` environment variable on Railway.

## 📋 Detailed Steps

### A. Configure Vercel Environment Variables

1. **Login to Vercel**: https://vercel.com
2. **Navigate to your project**: inturn-x
3. **Go to Settings** → **Environment Variables**
4. **Add these variables**:

```env
VITE_API_URL=https://inturnx-production.up.railway.app
VITE_SOCKET_URL=https://inturnx-production.up.railway.app
```

5. **Important**: Select all three environments:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

### B. Update Railway Backend

1. **Get your Vercel deployment URL**:
   - Go to Vercel Dashboard
   - Find your production URL (e.g., `https://inturn-x.vercel.app`)

2. **Update Railway environment variables**:
```bash
# Replace with your actual Vercel URL
railway variables --set "CLIENT_URL=https://inturn-x.vercel.app"
```

3. **Verify the variable is set**:
```bash
railway variables
```

### C. Redeploy Both Services

1. **Redeploy Vercel** (to pick up new environment variables):
   - Go to Vercel Dashboard → Deployments
   - Click "Redeploy" on latest deployment

2. **Railway will auto-redeploy** when you update environment variables

## 🧪 Testing the Integration

After deployment, test these features:

### 1. API Calls
Open browser console on your Vercel site and check:
```javascript
// Should see requests to Railway backend
console.log('API URL:', import.meta.env.VITE_API_URL);
```

### 2. Authentication
- Try logging in
- Check browser console for any CORS errors
- Verify token is stored in localStorage

### 3. Socket.IO Connection
- Go to Battle Arena or any real-time feature
- Check browser console for Socket.IO connection
- Should see: "Connected to server"

### 4. Check for CORS Errors
Open browser DevTools → Console
- ❌ If you see: `Access-Control-Allow-Origin` errors → CORS not configured
- ✅ If no CORS errors → Configuration successful!

## 🐛 Troubleshooting

### Issue 1: CORS Errors

**Error**: `Access to fetch at 'https://inturnx-production.up.railway.app/api/...' from origin 'https://inturn-x.vercel.app' has been blocked by CORS policy`

**Solution**:
1. Verify `CLIENT_URL` is set on Railway:
   ```bash
   railway variables
   ```
2. Make sure it matches your Vercel URL exactly
3. Redeploy Railway if needed:
   ```bash
   railway up
   ```

### Issue 2: Socket.IO Not Connecting

**Error**: Socket.IO connection fails or times out

**Solution**:
1. Check `VITE_SOCKET_URL` is set on Vercel
2. Verify Socket.IO CORS in `server/server.js`:
   ```javascript
   const io = socketIo(server, {
     cors: {
       origin: [process.env.CLIENT_URL, ...],
       methods: ["GET", "POST"]
     }
   });
   ```
3. Check Railway logs:
   ```bash
   railway logs
   ```

### Issue 3: Environment Variables Not Working

**Error**: `import.meta.env.VITE_API_URL` is undefined

**Solution**:
1. Verify variables are added to Vercel
2. Make sure variable names start with `VITE_`
3. Redeploy Vercel after adding variables
4. Clear browser cache

### Issue 4: OAuth Redirect Issues

**Error**: OAuth redirects to wrong URL

**Solution**:
Update OAuth provider callback URLs:
- **GitHub**: https://github.com/settings/developers
  - Homepage URL: `https://inturn-x.vercel.app`
  - Callback URL: `https://inturnx-production.up.railway.app/api/auth/github/callback`

## 📊 Architecture Diagram

```
User Browser
     │
     ├─── Static Assets (HTML, CSS, JS)
     │    └─── Vercel CDN (https://inturn-x.vercel.app)
     │
     ├─── API Calls (/api/*)
     │    └─── Railway Backend (https://inturnx-production.up.railway.app)
     │
     └─── WebSocket (Socket.IO)
          └─── Railway Backend (https://inturnx-production.up.railway.app)
```

## ✅ Verification Checklist

- [ ] Vercel environment variables added (`VITE_API_URL`, `VITE_SOCKET_URL`)
- [ ] Railway `CLIENT_URL` updated to Vercel URL
- [ ] Vercel redeployed with new environment variables
- [ ] No CORS errors in browser console
- [ ] Login/authentication works
- [ ] Socket.IO connects successfully
- [ ] API calls work (check Network tab)
- [ ] OAuth redirects work (if using)

## 🎯 Expected Results

After completing these steps:

✅ **Frontend (Vercel)**:
- Loads instantly from global CDN
- Makes API calls to Railway backend
- Socket.IO connects to Railway backend
- No CORS errors

✅ **Backend (Railway)**:
- Accepts requests from Vercel domain
- Socket.IO connections work
- OAuth redirects work
- Database operations work

## 📝 Quick Commands Reference

```bash
# Check Railway variables
railway variables

# Update Railway CLIENT_URL
railway variables --set "CLIENT_URL=https://your-vercel-url.vercel.app"

# View Railway logs
railway logs

# Redeploy Railway
railway up

# Redeploy Vercel (from client directory)
cd client
vercel --prod
```

## 🚀 Next Steps After Integration

1. ✅ Test all features thoroughly
2. ✅ Update OAuth callback URLs
3. ✅ Add custom domain (optional)
4. ✅ Set up monitoring
5. ✅ Configure production secrets (JWT_SECRET, etc.)

---

**Need Help?**
- Check browser console for errors
- Check Railway logs: `railway logs`
- Verify environment variables on both platforms

