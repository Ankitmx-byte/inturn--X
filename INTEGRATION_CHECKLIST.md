# ✅ Vercel + Railway Integration Checklist

## 🎯 Goal
Connect your existing Vercel frontend with Railway backend to make all features work.

---

## 📋 Step-by-Step Checklist

### ☐ Step 1: Add Environment Variables to Vercel (5 minutes)

**Action**: Go to Vercel Dashboard and add environment variables

**URL**: https://vercel.com/hariomsharma2644s-projects/inturn-x/settings/environment-variables

**Variables to Add**:

1. **VITE_API_URL**
   - Value: `https://inturnx-production.up.railway.app`
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

2. **VITE_SOCKET_URL**
   - Value: `https://inturnx-production.up.railway.app`
   - Environments: ✅ Production ✅ Preview ✅ Development
   - Click "Save"

**How to verify**: You should see both variables listed in the Environment Variables section.

---

### ☐ Step 2: Update Railway Backend CORS (2 minutes)

**Action**: Run the setup script or manually update Railway

**Option A - Automated (Recommended)**:
```bash
.\setup-vercel-railway.ps1
```

**Option B - Manual**:
```bash
# First, get your Vercel URL from the dashboard
# Then run:
railway variables --set "CLIENT_URL=https://your-vercel-url.vercel.app"
```

**How to verify**: 
```bash
railway variables
# Should show CLIENT_URL with your Vercel URL
```

---

### ☐ Step 3: Redeploy Vercel (3 minutes)

**Action**: Trigger a new Vercel deployment to pick up environment variables

**Choose one method**:

**Method A - Vercel Dashboard** (Easiest):
1. Go to: https://vercel.com/hariomsharma2644s-projects/inturn-x
2. Click "Deployments" tab
3. Click on the latest deployment
4. Click "Redeploy" button
5. Wait for deployment to complete (~2 minutes)

**Method B - Git Push**:
```bash
git commit --allow-empty -m "Configure Vercel + Railway integration"
git push
```

**Method C - Vercel CLI**:
```bash
cd client
vercel --prod
```

**How to verify**: Check deployment status in Vercel dashboard. Should show "Ready" status.

---

### ☐ Step 4: Test the Integration (5 minutes)

**Action**: Verify everything works

**Tests to perform**:

1. **Open your Vercel app**
   - URL: https://inturn-x.vercel.app (or your Vercel URL)
   - Should load without errors

2. **Check Browser Console** (F12 → Console)
   - ✅ No CORS errors
   - ✅ Should see API requests to Railway backend
   - ✅ Should see "Connected to server" (Socket.IO)

3. **Test Authentication**
   - Try logging in
   - Should work without errors
   - Check localStorage for token

4. **Test API Calls**
   - Navigate to Dashboard
   - Should load user data
   - Check Network tab (F12 → Network)
   - Should see requests to `inturnx-production.up.railway.app`

5. **Test Socket.IO** (if applicable)
   - Go to Battle Arena or real-time features
   - Should connect without errors
   - Check console for "Connected to server"

**How to verify**: All features work, no errors in console.

---

### ☐ Step 5: Update OAuth Callbacks (Optional, 5 minutes)

**Action**: Update OAuth provider settings if you're using social login

**Only if you're using OAuth**:

#### GitHub OAuth
1. Go to: https://github.com/settings/developers
2. Click on your OAuth App
3. Update:
   - Homepage URL: `https://your-vercel-url.vercel.app`
   - Callback URL: `https://inturnx-production.up.railway.app/api/auth/github/callback`
4. Click "Update application"

#### Google OAuth
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click on your OAuth 2.0 Client ID
3. Update:
   - Authorized JavaScript origins: Add `https://your-vercel-url.vercel.app`
   - Authorized redirect URIs: Add `https://inturnx-production.up.railway.app/api/auth/google/callback`
4. Click "Save"

**How to verify**: Try social login, should redirect correctly.

---

## 🐛 Troubleshooting

### Issue: CORS Errors in Browser Console

**Error**: `Access-Control-Allow-Origin` error

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

---

### Issue: Environment Variables Not Working

**Error**: API calls go to wrong URL or fail

**Solution**:
1. Check Vercel environment variables are added
2. Make sure you redeployed Vercel after adding variables
3. Clear browser cache and hard refresh (Ctrl+Shift+R)
4. Check browser console:
   ```javascript
   console.log(import.meta.env.VITE_API_URL)
   // Should show: https://inturnx-production.up.railway.app
   ```

---

### Issue: Socket.IO Not Connecting

**Error**: WebSocket connection fails

**Solution**:
1. Check `VITE_SOCKET_URL` is set on Vercel
2. Verify Railway backend is running:
   ```bash
   railway logs
   ```
3. Check browser console for connection errors
4. Verify CORS is configured for Socket.IO in `server/server.js`

---

## ✅ Final Verification

After completing all steps, verify:

- [ ] Vercel app loads successfully
- [ ] No CORS errors in browser console
- [ ] Login/authentication works
- [ ] API calls reach Railway backend
- [ ] Socket.IO connects (if applicable)
- [ ] All features work as expected
- [ ] OAuth redirects work (if using)

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    User's Browser                       │
└────────────────┬────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
    ▼                         ▼
┌─────────────────┐    ┌──────────────────┐
│     Vercel      │    │     Railway      │
│   (Frontend)    │───▶│    (Backend)     │
│                 │    │                  │
│ • React/Vite    │    │ • Express.js     │
│ • Static Files  │    │ • Socket.IO      │
│ • Global CDN    │    │ • MongoDB        │
└─────────────────┘    └──────────────────┘
  inturn-x.vercel.app   inturnx-production
                        .up.railway.app
```

---

## 🎯 Expected Results

### Before Integration
- ❌ API calls fail or go to wrong URL
- ❌ CORS errors
- ❌ Socket.IO doesn't connect
- ❌ Features don't work

### After Integration
- ✅ Frontend loads from Vercel CDN (fast!)
- ✅ API calls go to Railway backend
- ✅ No CORS errors
- ✅ Socket.IO connects successfully
- ✅ All features work
- ✅ Authentication works
- ✅ Real-time features work

---

## 📝 Quick Reference

### Important URLs

- **Vercel Dashboard**: https://vercel.com/hariomsharma2644s-projects/inturn-x
- **Vercel Settings**: https://vercel.com/hariomsharma2644s-projects/inturn-x/settings/environment-variables
- **Railway Dashboard**: https://railway.com/project/4e7f0c4f-7bf0-4b77-9c6d-c7ca08f756c9
- **Frontend URL**: https://inturn-x.vercel.app (or your custom URL)
- **Backend URL**: https://inturnx-production.up.railway.app

### Quick Commands

```bash
# Check Railway variables
railway variables

# Update Railway CLIENT_URL
railway variables --set "CLIENT_URL=https://your-vercel-url.vercel.app"

# View Railway logs
railway logs

# Redeploy Vercel
cd client
vercel --prod
```

---

## 🚀 Time Estimate

- **Total Time**: ~15-20 minutes
- **Step 1**: 5 minutes (Add Vercel env vars)
- **Step 2**: 2 minutes (Update Railway)
- **Step 3**: 3 minutes (Redeploy Vercel)
- **Step 4**: 5 minutes (Testing)
- **Step 5**: 5 minutes (OAuth - optional)

---

## 🎉 Success!

Once all checkboxes are complete, your Vercel frontend will be fully integrated with your Railway backend!

**Your app will be:**
- ⚡ Fast (Vercel's global CDN)
- 🔒 Secure (HTTPS everywhere)
- 🌍 Scalable (Independent scaling)
- 💰 Cost-effective (Free tiers!)

---

**Need help?** Check `VERCEL_RAILWAY_INTEGRATION.md` for detailed troubleshooting.

