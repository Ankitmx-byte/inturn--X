# InturnX - AI-Powered Internship & Learning Platform

<p align="center">
  <img src="https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-Express-green?style=for-the-badge&logo=nodedotjs" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-Atlas-4EA94B?style=for-the-badge&logo=mongodb" alt="MongoDB Explorer" />
  <img src="https://img.shields.io/badge/Python-FastAPI-009688?style=for-the-badge&logo=python" alt="Python FastAPI" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" alt="Vercel Deployed" />
</p>

## 📖 Overview
InturnX is a comprehensive, production-ready full-stack platform built to bridge the gap between learning and real-world software engineering practice. Designed as an AI-driven internship preparation tool, InturnX helps students master coding through real-time 1v1 Battle Arenas, conversational AI mock interviews, interactive quizzes, and a structured Learning Hub. 

The system leverages a sophisticated monorepo structure combining a modern React SPA, a robust Node.js backend with Socket.io in-memory sync, and a separate Python-based AI microservice executing inference pipelines for resume generation, AI mentorship, and code evaluation.

---

## 🚀 Deep-Dive Features

### 🎙️ Conversational AI Mock Interviews (Two-Way Communication)
Replicating real-world technical interviews through dynamic, generative dialogue using local/remote LLM orchestration.
- **4 Distinct AI Personas**: 
  - **Rahul**: Technical SDE-2 evaluating React and System Design.
  - **Priya**: HR Manager assessing behavioral and leadership skills.
  - **Karan**: DSA Expert prioritizing algorithmic optimization.
  - **Aditi**: System Design Architect examining scalability decisions.
- **Text-to-Speech (TTS) & Speech-to-Text (STT)**: Enables a fully hands-free, interactive interview via browser native APIs or ElevenLabs integrations.
- **Judge0 Web Compiler Integration**: Executes candidate code (JavaScript, Python, C++, etc.) with hidden test cases live during technical rounds.
- **Intelligent Fallback Architecture**: Automatically degrades to a highly responsive, pre-computed question bank if API rate limits (Ollama/OpenAI) are reached, ensuring 100% offline uptime.
- **Branded Post-Interview Report Generation**: Server-side Puppeteer scripts generate beautiful PDF evaluations breaking down technical accuracy, communication skills, and code efficiency.

### ⚔️ Battle Arena (1v1 Real-Time Coding Battles)
A competitive platform emphasizing accuracy and speed. 
- **Socket.io Real-Time Matchmaking**: Instantly pairs users in a synchronized WebSockets room (`socket-server.js`).
- **Live Opponent Ghost Typing**: Streams keystrokes directly using highly optimized socket events for a shared real-time environment.
- **Anti-Cheat Ecosystem**: 
  - Overrides critical browser keyboard shortcuts (`Ctrl+C`, `Ctrl+V`).
  - Implements the Page Visibility API to penalize focus loss.
  - Hooks into WebRTC (MediaPipe Face Mesh/Hands tracking) ensuring users remain centered and engaged.
- **Judge0 Backend Verification**: The node server acts as a proxy verifying hidden base/edge test cases completely insulated from client tampering.

### 📄 Intelligent Resume Builder & Dashboard Analytics
- **Structured JSON-Based Resume Storage**: Extends user models (`user.resumeData`) to decouple view from logic. Supports uploading local PDFs or building granularly section-by-section.
- **Holistic User Gamification**: Activity Logs map directly to Dashboard visualizations calculating User XP, Learning Streaks, Average Quiz Scores (`user.progress`), and 1v1 Battle Win/Loss ratios (`user.battleStats.wins`).
- **Certificate Management System**: Stores multi-format achievement certificates to an Express-configured static folder utilizing `multer` multipart uploads.

### 🧠 Dedicated AI Microservices Engine (Python / FastAPI)
An isolated microservice boundary designed exclusively for expensive inference and data-science payloads:
- **Course Recommendation Pipeline**: Analyzes user metadata to output targeted learning paths.
- **Resume ATS Scanner**: Evaluates `.pdf` blobs directly to highlight missing keywords against job profiles.
- **Conversational AI Mentor Context**: Retains conversational memory across multiple turns for ad-hoc coding help.

### 🔒 Enterprise-Grade Security & Authentication
- **Multi-Tenant OAuth Architecture**: Supports Google, GitHub, and LinkedIn out-of-the-box leveraging `Passport.js` and standardizing callback strategies.
- **JWT Protection & express-validator**: Prevents SQL-like injection on MongoDB operations while safeguarding all user endpoints.
- **Vercel Serverless Optimization**: Adapts Node.js routes (`/api/*`) utilizing cold-start latency reduction techniques.

---

## 💻 Technical Stack & Ecosystem

### Frontend (`/client`)
- **Core**: React 19, Vite Plugin Ecosystem, React Router DOM 6.
- **UI Design System**: Tailwind CSS v3, DaisyUI layout architecture.
- **Motion & Visualization**: GSAP (Timeline/ScrollTriggers), Framer Motion (Route transitions/Micro-interactions).
- **Specialized Editor**: `@monaco-editor/react` mapping directly to VS Code's editor kernel natively.
- **Networking & Media**: `socket.io-client`, `recordrtc`, `openai-whisper` (frontend inference).
- **Machine Learning Trackers**: `@mediapipe/face_mesh`, `@mediapipe/hands` (Client browser GPU execution).

### Backend Server (`/server`)
- **Runtime Environment**: Node.js & Express.js.
- **Database**: MongoDB Atlas handled via `mongoose` schema validation.
- **Real-time Pipeline**: `socket.io` handling Battle Arena state coordination.
- **Authentication Layers**: `passport.js` multiplexing strategies + `jsonwebtoken` + `bcryptjs`.
- **Media & File Handlers**: `puppeteer` (Headless Chromium PDF Rendered), `multer` (File extraction).

### AI Data Science Pipeline (`/ai_service`)
- **Server Framework**: Python FastAPI.
- **Integration Ecosystem**: Synchronizes with `/server` to exchange inference events via internal POST requests.

---

## 📁 Repository Architecture & Data Flow

```text
├── client/                     # React + Vite application shell
│   ├── src/                    # UI Components, Pages, Utilities
│   ├── dist/                   # Production minified bundle
│   └── package.json            # Client-specific dependencies
│
├── server/                     # Backend API logic + Express configurations
│   ├── api/index.js            # => Vercel Serverless Function entrypoint
│   ├── controllers/            # Business logic handlers
│   ├── models/                 # Mongoose schema definitions
│   ├── prompts/                # Configured AI LLM constraint files
│   └── services/               # Modularized feature services (AI, Code, PDF)
│
├── api/                        # Isolated serverless functions
│   └── ai/index.py             # => Python AI service edge entry
│
├── ai_service/                 # Full Python FastAPI application structure
├── antiCheat/                  # DOM/Browser anti-tampering logic modules (Battle Arena)
│
├── vercel.json                 # Vercel deployment edge routing config
└── package.json                # Root dependency bootstrapper (concurrently)
```

### Advanced Deployment Topology
Our deployment favors the **Vercel Edge Network**:
1. Static files `/client/dist/*` load globally off CDN caching limits.
2. Dynamic calls `/api/*` run isolated on serverless endpoints pointing to `server/api/index.js` or `api/ai/index.py`. 
3. Node variables pull securely into connection streams querying MongoDB Atlas on `0.0.0.0/0`.

---

## ⚙️ Getting Started & Local Development

### Prerequisites
- Node.js (v18.0.0+)
- Python (3.x)
- Active MongoDB Data Store (Local or Cloud Atlas)

### 1. Unified Dependency Bootstrap
InturnX handles multiple package repositories asynchronously. The main package implements `concurrently` configurations:
```bash
# This triggers sub-directory installs spanning the client and the node server.
npm run install:all
```

### 2. Configure Local Environment Secrets
Copy template models across both primary environments.
```bash
cp server/.env.example server/.env
# Example essential keys required for complete functionality:
# - MONGODB_URI
# - JWT_SECRET
# - SESSION_SECRET
# - OAuth Identity Keys (GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID)
```

### 3. Spin Up Developer Engines
Initiates both the React SPA Hot-Module-Replacement and the Express.js `nodemon` supervisor:
```bash
npm run dev
```
Navigate your browser to `http://localhost:5173`. Express mounts natively to `http://localhost:5000` by default.

---

## 🔑 System Security Considerations
* **File Upload Throttling**: Resumes limit out at 5MB boundaries. Certificates accept standard images up to 10MB through rigorous `multer` extraction profiles.
* **XSS Mitigation & Serialization**: React DOM manipulation limits arbitrary scripts; external requests securely enforce CORS routing parameters targeting known deployment headers.
* **Database Object Validation**: Express-validator middleware heavily constrains schema overrides restricting data injection exploits down to exact regex parameter limits.

---
**Designed and Engineered for InturnX. Bridging the gap between active learning and execution.**
