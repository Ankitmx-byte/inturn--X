# 🔷 Deploy Frontend to Vercel + Backend to Railway

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                               │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│    Vercel     │         │   Railway    │
│   Frontend    │────────▶│   Backend    │
│ (React/Vite)  │   API   │  (Express)   │
└───────────────┘  Calls  └──────┬───────┘
                                 │
                                 ▼
                          ┌──────────────┐
                          │   MongoDB    │
                          │   Database   │
                          └──────────────┘
```

## ✅ Current Status

- ✅ **Backend on Railway**: https://inturnx-production.up.railway.app
- ⬜ **Frontend on Vercel**: To be deployed

## 🚀 Step-by-Step Deployment

### Step 1: Prepare Frontend for Vercel

1. **Update API endpoint in frontend**

Create/update `client/.env.production`:
```env
VITE_API_URL=https://inturnx-production.up.railway.app
VITE_SOCKET_URL=https://inturnx-production.up.railway.app
```

2. **Update API calls in your React code**

Make sure your frontend uses the environment variable:
```javascript
// client/src/config/api.js or similar
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export { API_URL, SOCKET_URL };
```

3. **Create `vercel.json` in client directory**

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://inturnx-production.up.railway.app/api/:path*"
    }
  ]
}
```

### Step 2: Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to client directory
cd client

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? inturnx-frontend
# - Directory? ./
# - Override settings? No

# Deploy to production
vercel --prod
```

**Option B: Using Vercel Dashboard**
1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your Git repository
4. Set root directory to `client`
5. Framework preset: Vite
6. Build command: `npm run build`
7. Output directory: `dist`
8. Add environment variables:
   - `VITE_API_URL`: `https://inturnx-production.up.railway.app`
   - `VITE_SOCKET_URL`: `https://inturnx-production.up.railway.app`
9. Click "Deploy"

### Step 3: Update Backend CORS

Update Railway backend to allow Vercel domain:

```bash
# Set the Vercel frontend URL
railway variables --set "CLIENT_URL=https://your-app.vercel.app"

# Or set multiple allowed origins
railway variables --set "ALLOWED_ORIGINS=https://your-app.vercel.app,https://inturnx-production.up.railway.app"
```

Update `server/server.js` CORS configuration:
```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : [process.env.CLIENT_URL || 'http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Step 4: Update OAuth Callbacks

Update OAuth provider callback URLs to use Vercel domain:

**GitHub OAuth**:
- Homepage URL: `https://your-app.vercel.app`
- Callback URL: `https://inturnx-production.up.railway.app/api/auth/github/callback`

**Google OAuth** (if using):
- Authorized JavaScript origins: `https://your-app.vercel.app`
- Authorized redirect URIs: `https://inturnx-production.up.railway.app/api/auth/google/callback`

## 📝 Configuration Files Needed

### 1. `client/.env.production`
```env
VITE_API_URL=https://inturnx-production.up.railway.app
VITE_SOCKET_URL=https://inturnx-production.up.railway.app
```

### 2. `client/vercel.json`
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://inturnx-production.up.railway.app/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### 3. Update `client/vite.config.js`
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_SOCKET_URL || 'http://localhost:3001',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
```

## 🔧 Backend Updates Needed

### Update Railway Environment Variables

```bash
# Allow Vercel frontend
railway variables --set "CLIENT_URL=https://your-app.vercel.app"

# Or multiple origins
railway variables --set "ALLOWED_ORIGINS=https://your-app.vercel.app,https://inturnx-production.up.railway.app"
```

### Update CORS in `server/server.js`

```javascript
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
```

### Update Socket.IO CORS

```javascript
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});
```

## ✅ Deployment Checklist

- [ ] Create `client/.env.production` with Railway backend URL
- [ ] Create `client/vercel.json` configuration
- [ ] Update frontend API calls to use environment variables
- [ ] Deploy frontend to Vercel
- [ ] Get Vercel deployment URL
- [ ] Update Railway `CLIENT_URL` environment variable
- [ ] Update backend CORS configuration
- [ ] Redeploy Railway backend with new CORS settings
- [ ] Update OAuth callback URLs
- [ ] Test frontend → backend communication
- [ ] Test WebSocket/Socket.IO connections
- [ ] Test authentication flow

## 🧪 Testing

After deployment, test these:

1. **API Calls**: Frontend can call backend APIs
2. **Authentication**: Login/signup works
3. **WebSockets**: Real-time features work
4. **CORS**: No CORS errors in browser console
5. **OAuth**: Social login redirects work correctly

## 💡 Pro Tips

1. **Environment Variables**: Use Vercel's environment variables UI for sensitive data
2. **Preview Deployments**: Vercel creates preview URLs for each PR
3. **Custom Domain**: Add custom domain in Vercel dashboard
4. **Analytics**: Enable Vercel Analytics for frontend monitoring
5. **Edge Functions**: Use Vercel Edge Functions for API routes if needed

## 🐛 Common Issues & Solutions

### CORS Errors
**Problem**: `Access-Control-Allow-Origin` errors
**Solution**: Ensure Vercel URL is in Railway's `ALLOWED_ORIGINS`

### WebSocket Connection Failed
**Problem**: Socket.IO can't connect
**Solution**: 
- Check Socket.IO CORS settings
- Ensure using `https://` not `http://`
- Verify Railway backend is running

### OAuth Redirect Issues
**Problem**: OAuth redirects to wrong URL
**Solution**: Update OAuth callback URLs to use Railway backend URL

### API 404 Errors
**Problem**: API calls return 404
**Solution**: Check `vercel.json` rewrites configuration

## 📊 Architecture Benefits

✅ **Performance**: Vercel's edge network for fast frontend delivery
✅ **Scalability**: Independent scaling of frontend and backend
✅ **Reliability**: Both platforms have excellent uptime
✅ **Developer Experience**: Easy deployments and rollbacks
✅ **Cost**: Free tiers available on both platforms

## 🚀 Next Steps

1. Deploy frontend to Vercel
2. Update environment variables
3. Test the integration
4. (Optional) Add custom domain
5. (Optional) Set up CI/CD with GitHub

---

**Your Setup**:
- Frontend: Vercel (https://your-app.vercel.app)
- Backend: Railway (https://inturnx-production.up.railway.app)
- Database: MongoDB (connected to Railway)

