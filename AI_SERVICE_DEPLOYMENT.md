# 🤖 AI Service Deployment (Future Step)

## Current Status

The AI service (`ai_service/`) has been **excluded** from the initial Railway deployment to simplify the build process. The main Node.js application (client + server) is being deployed first.

## Why AI Service is Separate

1. **Different Runtime**: AI service uses Python/FastAPI while the main app uses Node.js
2. **Build Complexity**: Python dependencies (ML libraries) can be large and complex
3. **Independent Scaling**: AI service can be scaled separately based on usage
4. **Faster Initial Deployment**: Get the main app running first, add AI features later

## AI Service Components

The `ai_service/` directory contains:
- `main.py` - FastAPI application
- `chat_mentor.py` - AI chat mentor functionality
- `code_eval.py` - Code evaluation
- `generate_report.py` - Report generation
- `programming_question_generator.py` - Question generation
- `question_generator.py` - General question generation
- `recommend.py` - Recommendation engine
- `resume_analyzer.py` - Resume analysis
- `transcribe_audio.py` - Audio transcription
- `video_analyzer.py` - Video analysis
- `requirements.txt` - Python dependencies

## How to Deploy AI Service Later

### Option 1: Separate Railway Service (Recommended)

1. **Create a new service in Railway**:
   ```bash
   # In the ai_service directory
   cd ai_service
   railway init
   railway up
   ```

2. **Create a simple nixpacks.toml for Python**:
   ```toml
   [phases.setup]
   nixPkgs = ["python311", "python311Packages.pip"]

   [phases.install]
   cmds = ["pip install -r requirements.txt"]

   [start]
   cmd = "uvicorn main:app --host 0.0.0.0 --port $PORT"
   ```

3. **Set environment variables**:
   ```bash
   railway variables --set "OPENAI_API_KEY=your-key"
   # Add any other required API keys
   ```

4. **Get the AI service URL** and update the main app:
   ```bash
   railway domain
   # Update main app's AI_SERVICE_URL environment variable
   ```

### Option 2: Deploy Together (More Complex)

If you want to deploy both services together:

1. **Update nixpacks.toml** to include Python:
   ```toml
   [phases.setup]
   nixPkgs = ["nodejs_22", "python311", "python311Packages.pip"]

   [phases.install]
   cmds = [
     "npm install --prefix server",
     "npm install --prefix client --legacy-peer-deps",
     "pip install -r ai_service/requirements.txt"
   ]

   [phases.build]
   cmds = ["cd client && npm run build"]

   [start]
   cmd = "cd server && node server.js"
   ```

2. **Modify server.js** to start both services:
   - Start FastAPI as a child process
   - Or use a process manager like PM2

### Option 3: Use Railway Templates

Railway has Python/FastAPI templates that can simplify deployment:

1. Go to Railway dashboard
2. Click "New Service"
3. Select "Deploy from Template"
4. Choose "FastAPI" template
5. Connect your `ai_service` directory

## Environment Variables Needed for AI Service

When deploying the AI service, you'll likely need:

```bash
# OpenAI API (for AI features)
OPENAI_API_KEY=sk-...

# Other potential API keys
ANTHROPIC_API_KEY=...
GOOGLE_AI_API_KEY=...

# Service configuration
PORT=8000  # Railway sets this automatically
ALLOWED_ORIGINS=https://your-main-app.up.railway.app
```

## Connecting Main App to AI Service

Once AI service is deployed:

1. **Get AI service URL**:
   ```bash
   railway domain
   ```

2. **Update main app environment variables**:
   ```bash
   # In the main app service
   railway variables --set "AI_SERVICE_URL=https://your-ai-service.up.railway.app"
   ```

3. **Update server code** to call AI service:
   ```javascript
   const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';
   
   // Example API call
   const response = await fetch(`${AI_SERVICE_URL}/analyze-resume`, {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ resume: resumeData })
   });
   ```

## Cost Considerations

- **Separate Service**: More flexible but uses additional Railway resources
- **Combined Service**: Single deployment but larger container
- **Free Tier**: Railway free tier includes $5 credit and 500 hours/month

## Recommended Approach

1. ✅ **Deploy main app first** (current step)
2. ⬜ Get main app working with database and authentication
3. ⬜ Deploy AI service as separate Railway service
4. ⬜ Connect the two services via environment variables
5. ⬜ Test AI features end-to-end

## Next Steps

For now, focus on:
1. Getting the main Node.js app deployed and running
2. Setting up MongoDB
3. Configuring environment variables
4. Testing core functionality

**AI service deployment can be added later once the main app is stable!**

---

**Note**: The current deployment excludes Python/AI dependencies to ensure a successful initial deployment. This is a best practice for complex multi-runtime applications.

