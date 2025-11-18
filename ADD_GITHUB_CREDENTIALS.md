# 🔑 Add GitHub OAuth Credentials to Railway

## ❌ The Problem

You added GitHub credentials to **Vercel**, but they need to be on **Railway** (the backend)!

**Current Railway Variables:**
```json
{
  "CLIENT_URL": "https://inturn-x.vercel.app",
  "GITHUB_CALLBACK_URL": "https://inturnx-production.up.railway.app/api/auth/github/callback",
  "JWT_SECRET": "***",
  "SESSION_SECRET": "***"
}
```

**Missing:**
- ❌ `GITHUB_CLIENT_ID`
- ❌ `GITHUB_CLIENT_SECRET`

---

## 🎯 Quick Fix (3 Steps)

### Step 1: Get Your GitHub OAuth Credentials

Go to your GitHub OAuth App:
👉 https://github.com/settings/developers

1. Click on your OAuth App (InturnX)
2. Copy the **Client ID**
3. Click **"Generate a new client secret"** (if you don't have one visible)
4. Copy the **Client Secret** (you can only see it once!)

---

### Step 2: Add Credentials to Railway

Run these commands (replace with your actual values):

```bash
railway variables --set "GITHUB_CLIENT_ID=your_github_client_id_here"
railway variables --set "GITHUB_CLIENT_SECRET=your_github_client_secret_here"
```

**Example:**
```bash
railway variables --set "GITHUB_CLIENT_ID=Iv1.a1b2c3d4e5f6g7h8"
railway variables --set "GITHUB_CLIENT_SECRET=1234567890abcdef1234567890abcdef12345678"
```

---

### Step 3: Verify GitHub OAuth App Settings

Make sure your GitHub OAuth App has these settings:

**Homepage URL:**
```
https://inturn-x.vercel.app
```

**Authorization callback URL:**
```
https://inturnx-production.up.railway.app/api/auth/github/callback
```

---

## 📋 Complete Checklist

### GitHub OAuth App Settings

- [ ] **Application name**: InturnX (or your app name)
- [ ] **Homepage URL**: `https://inturn-x.vercel.app`
- [ ] **Authorization callback URL**: `https://inturnx-production.up.railway.app/api/auth/github/callback`
- [ ] **Client ID**: Copied
- [ ] **Client Secret**: Generated and copied

### Railway Environment Variables

- [x] ✅ `CLIENT_URL` = `https://inturn-x.vercel.app`
- [x] ✅ `GITHUB_CALLBACK_URL` = `https://inturnx-production.up.railway.app/api/auth/github/callback`
- [ ] ⏳ `GITHUB_CLIENT_ID` = (your client ID)
- [ ] ⏳ `GITHUB_CLIENT_SECRET` = (your client secret)

### Vercel Environment Variables (Frontend)

These are for the frontend to know where to send requests:
- [x] ✅ `VITE_API_URL` = `https://inturnx-production.up.railway.app`
- [x] ✅ `VITE_SOCKET_URL` = `https://inturnx-production.up.railway.app`

**Note:** GitHub credentials should NOT be on Vercel - they belong on Railway!

---

## 🎯 Why This Matters

### Where OAuth Credentials Should Be:

```
┌─────────────────────────────────────────────────┐
│ Vercel (Frontend)                               │
│ ✅ VITE_API_URL                                 │
│ ✅ VITE_SOCKET_URL                              │
│ ❌ NO GitHub credentials here!                  │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ Railway (Backend)                               │
│ ✅ CLIENT_URL                                   │
│ ✅ GITHUB_CLIENT_ID        ← MUST BE HERE!      │
│ ✅ GITHUB_CLIENT_SECRET    ← MUST BE HERE!      │
│ ✅ GITHUB_CALLBACK_URL                          │
│ ✅ JWT_SECRET                                   │
│ ✅ SESSION_SECRET                               │
│ ✅ MONGODB_URI                                  │
└─────────────────────────────────────────────────┘
```

---

## 🔍 How to Get GitHub Credentials

### If You Already Have a GitHub OAuth App:

1. Go to: https://github.com/settings/developers
2. Click **"OAuth Apps"**
3. Click on your app (InturnX)
4. **Client ID** is visible on the page
5. **Client Secret**: 
   - If you see one, copy it
   - If not, click **"Generate a new client secret"**
   - Copy it immediately (you can only see it once!)

### If You Need to Create a New GitHub OAuth App:

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `InturnX`
   - **Homepage URL**: `https://inturn-x.vercel.app`
   - **Application description**: (optional)
   - **Authorization callback URL**: `https://inturnx-production.up.railway.app/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"**
7. Copy the **Client Secret**

---

## 🚀 After Adding Credentials

Railway will automatically redeploy when you add environment variables.

**Wait ~1-2 minutes**, then test:

1. Go to: https://inturn-x.vercel.app
2. Click **"Login with GitHub"**
3. Should redirect to GitHub ✅
4. Approve the app
5. Should redirect back and log you in! 🎉

---

## 🧪 Verify It's Working

After adding credentials, check Railway logs:

```bash
railway logs
```

You should see:
```
Initializing GitHub OAuth Strategy
GitHub Client ID: SET
GitHub Callback URL: https://inturnx-production.up.railway.app/api/auth/github/callback
```

---

## 🐛 Troubleshooting

### Error: "redirect_uri is not associated with this application"

**Cause**: Callback URL in GitHub OAuth App doesn't match

**Fix**: 
1. Go to GitHub OAuth App settings
2. Make sure callback URL is EXACTLY: `https://inturnx-production.up.railway.app/api/auth/github/callback`
3. No trailing slash!
4. Must be HTTPS

### Error: "GitHub OAuth is not configured"

**Cause**: Missing `GITHUB_CLIENT_ID` or `GITHUB_CLIENT_SECRET` on Railway

**Fix**: Add them using the commands above

### Error: "Invalid client credentials"

**Cause**: Wrong Client ID or Client Secret

**Fix**: 
1. Double-check you copied them correctly
2. Make sure there are no extra spaces
3. Regenerate client secret if needed

---

## 📝 Quick Commands

```bash
# Add GitHub credentials to Railway
railway variables --set "GITHUB_CLIENT_ID=your_client_id"
railway variables --set "GITHUB_CLIENT_SECRET=your_client_secret"

# Verify they're set
railway variables --json

# Check logs
railway logs

# Force redeploy if needed
railway up
```

---

## ✅ Final Configuration

After completing all steps, your Railway should have:

```json
{
  "CLIENT_URL": "https://inturn-x.vercel.app",
  "GITHUB_CLIENT_ID": "Iv1.xxxxxxxxxxxxx",
  "GITHUB_CLIENT_SECRET": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "GITHUB_CALLBACK_URL": "https://inturnx-production.up.railway.app/api/auth/github/callback",
  "JWT_SECRET": "***",
  "SESSION_SECRET": "***",
  "MONGODB_URI": "***",
  "NODE_ENV": "production"
}
```

And your GitHub OAuth App should have:
- **Homepage URL**: `https://inturn-x.vercel.app`
- **Callback URL**: `https://inturnx-production.up.railway.app/api/auth/github/callback`

---

**Ready?** Get your GitHub Client ID and Client Secret, then run the Railway commands above! 🚀

