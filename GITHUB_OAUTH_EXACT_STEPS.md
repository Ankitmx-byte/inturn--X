# 🔧 GitHub OAuth - Exact Steps to Fix

## 🎯 The Issue

You're getting: "The redirect_uri is not associated with this application"

This means the callback URL in your GitHub OAuth App doesn't match what Railway is sending.

---

## 📝 EXACT Steps to Fix

### Step 1: Find Your GitHub OAuth App

1. Go to: https://github.com/settings/developers
2. Click **"OAuth Apps"** tab
3. Look for your app with Client ID: `Ov23lixWoGnmdDbtJH6l`
4. Click on it

---

### Step 2: Check Current Callback URL

**What do you see in the "Authorization callback URL" field?**

Common wrong values:
- ❌ `http://localhost:3001/api/auth/github/callback`
- ❌ `https://inturn-x.vercel.app/api/auth/github/callback`
- ❌ `http://localhost:5173/api/auth/github/callback`

---

### Step 3: Update to Correct Callback URL

**REPLACE** the callback URL with this EXACT value:

```
https://inturnx-production.up.railway.app/api/auth/github/callback
```

**Important:**
- ✅ Must start with `https://` (not `http://`)
- ✅ Must be `inturnx-production.up.railway.app` (Railway domain)
- ✅ Must end with `/api/auth/github/callback`
- ✅ NO trailing slash at the end
- ✅ Copy-paste to avoid typos!

---

### Step 4: Update Homepage URL

**Set Homepage URL to:**

```
https://inturn-x.vercel.app
```

---

### Step 5: Save Changes

Click **"Update application"** button

---

## 🔍 Screenshot of What It Should Look Like

```
┌──────────────────────────────────────────────────────┐
│ OAuth Apps                                           │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Application name: [Your App Name]                   │
│                                                      │
│ Homepage URL:                                        │
│ ┌──────────────────────────────────────────────┐   │
│ │ https://inturn-x.vercel.app                  │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ Application description: (optional)                  │
│                                                      │
│ Authorization callback URL:                          │
│ ┌──────────────────────────────────────────────┐   │
│ │ https://inturnx-production.up.railway.app/   │   │
│ │ api/auth/github/callback                     │   │
│ └──────────────────────────────────────────────┘   │
│                                                      │
│ [Update application]                                 │
│                                                      │
│ Client ID: Ov23lixWoGnmdDbtJH6l                     │
│ Client secrets: ●●●●●●●●                            │
│                                                      │
└──────────────────────────────────────────────────────┘
```

---

## ⚠️ Common Mistakes

### Mistake 1: Wrong Domain
❌ `https://inturn-x.vercel.app/api/auth/github/callback`
✅ `https://inturnx-production.up.railway.app/api/auth/github/callback`

**Why:** OAuth callback must go to the BACKEND (Railway), not frontend (Vercel)!

### Mistake 2: Trailing Slash
❌ `https://inturnx-production.up.railway.app/api/auth/github/callback/`
✅ `https://inturnx-production.up.railway.app/api/auth/github/callback`

### Mistake 3: HTTP instead of HTTPS
❌ `http://inturnx-production.up.railway.app/api/auth/github/callback`
✅ `https://inturnx-production.up.railway.app/api/auth/github/callback`

### Mistake 4: Typo in Domain
❌ `https://inturnx-production.railway.app/api/auth/github/callback`
✅ `https://inturnx-production.up.railway.app/api/auth/github/callback`

Note the `.up.` in the correct version!

---

## 🧪 Test After Updating

1. **Clear browser cache** or use **Incognito mode**
2. Go to: https://inturn-x.vercel.app
3. Click **"Login with GitHub"**
4. Should redirect to GitHub ✅
5. Approve the app
6. Should redirect back to your app ✅
7. You should be logged in! 🎉

---

## 🔍 Debugging

### If you still get the error:

**Tell me:**
1. What EXACT callback URL do you see in your GitHub OAuth App settings?
2. Take a screenshot if possible

**I'll verify it matches:**
```
https://inturnx-production.up.railway.app/api/auth/github/callback
```

---

## 📋 Verification Checklist

- [ ] Opened GitHub OAuth Apps settings
- [ ] Found app with Client ID: `Ov23lixWoGnmdDbtJH6l`
- [ ] Homepage URL is: `https://inturn-x.vercel.app`
- [ ] Callback URL is: `https://inturnx-production.up.railway.app/api/auth/github/callback`
- [ ] No typos in callback URL
- [ ] No trailing slash
- [ ] Clicked "Update application"
- [ ] Tested login in incognito mode

---

## 🎯 What Railway is Sending

Railway is configured to use this callback URL:
```
https://inturnx-production.up.railway.app/api/auth/github/callback
```

Your GitHub OAuth App MUST have this EXACT URL in the "Authorization callback URL" field.

---

## 💡 Alternative: Create New OAuth App

If you're still having issues, you can create a fresh OAuth App:

1. Go to: https://github.com/settings/developers
2. Click **"New OAuth App"**
3. Fill in:
   - **Application name**: `InturnX Production`
   - **Homepage URL**: `https://inturn-x.vercel.app`
   - **Authorization callback URL**: `https://inturnx-production.up.railway.app/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the new **Client ID**
6. Generate and copy the new **Client Secret**
7. Update Railway:
   ```bash
   railway variables --set "GITHUB_CLIENT_ID=new_client_id"
   railway variables --set "GITHUB_CLIENT_SECRET=new_client_secret"
   ```

---

## 🚀 Current Railway Configuration

```json
{
  "GITHUB_CLIENT_ID": "Ov23lixWoGnmdDbtJH6l",
  "GITHUB_CLIENT_SECRET": "77219dd6ce4e7fe96a92d3a405b70e2cf93106c2",
  "GITHUB_CALLBACK_URL": "https://inturnx-production.up.railway.app/api/auth/github/callback",
  "CLIENT_URL": "https://inturn-x.vercel.app"
}
```

This is correct! ✅

Now your GitHub OAuth App needs to match this configuration.

---

**Please check your GitHub OAuth App settings and tell me what callback URL you see there!**

