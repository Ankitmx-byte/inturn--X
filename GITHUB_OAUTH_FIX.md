# 🔧 GitHub OAuth Configuration Fix

## ✅ What I Fixed

### Railway Backend Configuration
✅ **DONE** - Set `GITHUB_CALLBACK_URL` on Railway:
```
GITHUB_CALLBACK_URL=https://inturnx-production.up.railway.app/api/auth/github/callback
```

### What YOU Need to Do

⏳ **Update GitHub OAuth App Settings**

---

## 📝 Step-by-Step Instructions

### Go to GitHub Developer Settings

I already opened this page for you:
👉 **https://github.com/settings/developers**

### Update Your OAuth App

1. **Find your OAuth App** (the one for InturnX)
2. **Click on it** to edit
3. **Update these fields:**

   **Homepage URL:**
   ```
   https://inturn-x.vercel.app
   ```

   **Authorization callback URL:**
   ```
   https://inturnx-production.up.railway.app/api/auth/github/callback
   ```

4. **Click "Update application"**

---

## 🎯 Why This Was Broken

### The Problem

Your GitHub OAuth was configured to redirect to:
```
❌ https://inturn-x.vercel.app/api/auth/github/callback
```

But Vercel only has your **frontend** - it doesn't have the backend code to handle OAuth!

### The Solution

GitHub should redirect to your **Railway backend**:
```
✅ https://inturnx-production.up.railway.app/api/auth/github/callback
```

Railway has the backend code that processes OAuth and creates the JWT token.

---

## 🔄 How OAuth Works Now

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User clicks "Login with GitHub" on Vercel               │
│    https://inturn-x.vercel.app                              │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Redirects to GitHub.com for authorization                │
│    User approves the app                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. GitHub redirects to Railway Backend ✅                   │
│    https://inturnx-production.up.railway.app/               │
│           api/auth/github/callback                          │
│                                                             │
│    Backend processes OAuth:                                 │
│    - Verifies user with GitHub                              │
│    - Creates/updates user in MongoDB                        │
│    - Generates JWT token                                    │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. Railway redirects back to Vercel Frontend ✅             │
│    https://inturn-x.vercel.app/auth/callback?token=...      │
│                                                             │
│    Frontend:                                                │
│    - Receives JWT token                                     │
│    - Stores in localStorage                                 │
│    - Logs user in                                           │
│    - Redirects to dashboard                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Verification Checklist

After updating GitHub OAuth App:

- [ ] GitHub OAuth App Homepage URL: `https://inturn-x.vercel.app`
- [ ] GitHub OAuth App Callback URL: `https://inturnx-production.up.railway.app/api/auth/github/callback`
- [ ] Clicked "Update application"
- [ ] Test GitHub login on your app

---

## 🧪 Testing GitHub OAuth

After updating the GitHub OAuth App:

1. **Go to your app**: https://inturn-x.vercel.app
2. **Click "Login with GitHub"**
3. **You should be redirected to GitHub**
4. **Approve the app** (if first time)
5. **You should be redirected back to your app and logged in!** ✅

---

## 🐛 Troubleshooting

### Issue: Still not working after updating GitHub

**Solution**: 
1. Clear browser cache and cookies
2. Try in incognito/private window
3. Check Railway logs: `railway logs`
4. Check browser console for errors

### Issue: "Redirect URI mismatch" error

**Error**: GitHub shows "The redirect_uri MUST match the registered callback URL"

**Solution**:
1. Double-check the callback URL in GitHub OAuth App settings
2. Make sure it's exactly: `https://inturnx-production.up.railway.app/api/auth/github/callback`
3. No trailing slash!
4. Must be HTTPS

### Issue: GitHub redirects but login fails

**Solution**:
1. Check Railway logs: `railway logs`
2. Look for errors in the OAuth callback
3. Make sure `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set on Railway
4. Verify MongoDB is connected

---

## 📊 Current Configuration

### Railway Environment Variables

```json
{
  "CLIENT_URL": "https://inturn-x.vercel.app",
  "GITHUB_CALLBACK_URL": "https://inturnx-production.up.railway.app/api/auth/github/callback",
  "JWT_SECRET": "***",
  "SESSION_SECRET": "***",
  "NODE_ENV": "production"
}
```

### GitHub OAuth App (What you need to set)

```
Homepage URL: https://inturn-x.vercel.app
Authorization callback URL: https://inturnx-production.up.railway.app/api/auth/github/callback
```

---

## 🎯 Summary

**What's Done:**
- ✅ Railway `GITHUB_CALLBACK_URL` configured
- ✅ Railway `CLIENT_URL` configured

**What You Need to Do:**
- ⏳ Update GitHub OAuth App callback URL
- ⏳ Test GitHub login

**Time Required:** 2 minutes

**Result:** GitHub OAuth will work! 🎉

---

## 📝 Additional OAuth Providers

If you want to configure other OAuth providers (Google, LinkedIn), use the same pattern:

### Google OAuth
- **Callback URL**: `https://inturnx-production.up.railway.app/api/auth/google/callback`
- **Authorized JavaScript origins**: `https://inturn-x.vercel.app`

### LinkedIn OAuth
- **Callback URL**: `https://inturnx-production.up.railway.app/api/auth/linkedin/callback`
- **Authorized redirect URLs**: `https://inturnx-production.up.railway.app/api/auth/linkedin/callback`

---

**Need Help?**
- Check Railway logs: `railway logs`
- Check browser console (F12)
- Verify GitHub OAuth App settings

