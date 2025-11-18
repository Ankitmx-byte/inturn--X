# Railway Deployment Script for InturnX
# PowerShell script for Windows

Write-Host "🚂 InturnX Railway Deployment Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
Write-Host "📦 Checking Railway CLI..." -ForegroundColor Yellow
try {
    $railwayVersion = railway --version 2>&1
    Write-Host "✅ Railway CLI is installed: $railwayVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Railway CLI is not installed!" -ForegroundColor Red
    Write-Host "Please install it from: https://docs.railway.app/guides/cli" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# Check if user is logged in
Write-Host "🔐 Checking Railway authentication..." -ForegroundColor Yellow
try {
    $whoami = railway whoami 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Logged in to Railway" -ForegroundColor Green
    } else {
        Write-Host "🔑 Please log in to Railway..." -ForegroundColor Yellow
        railway login
    }
} catch {
    Write-Host "🔑 Please log in to Railway..." -ForegroundColor Yellow
    railway login
}
Write-Host ""

# Ask if user wants to create a new project or use existing
Write-Host "Select an option:" -ForegroundColor Cyan
Write-Host "1) Create a new Railway project" -ForegroundColor White
Write-Host "2) Link to an existing Railway project" -ForegroundColor White
Write-Host "3) Just deploy to current linked project" -ForegroundColor White
$choice = Read-Host "Enter choice (1, 2, or 3)"
Write-Host ""

switch ($choice) {
    "1" {
        Write-Host "🆕 Creating new Railway project..." -ForegroundColor Yellow
        railway init
    }
    "2" {
        Write-Host "🔗 Linking to existing project..." -ForegroundColor Yellow
        railway link
    }
    "3" {
        Write-Host "📦 Using current linked project..." -ForegroundColor Yellow
    }
    default {
        Write-Host "❌ Invalid choice. Exiting." -ForegroundColor Red
        exit 1
    }
}
Write-Host ""

# Ask about MongoDB
Write-Host "💾 Database Setup" -ForegroundColor Cyan
Write-Host "Do you want to add Railway MongoDB to your project?" -ForegroundColor Yellow
Write-Host "1) Yes, add Railway MongoDB (Recommended)" -ForegroundColor White
Write-Host "2) No, I'll use MongoDB Atlas or external MongoDB" -ForegroundColor White
$dbChoice = Read-Host "Enter choice (1 or 2)"
Write-Host ""

if ($dbChoice -eq "1") {
    Write-Host "📦 Adding MongoDB to Railway project..." -ForegroundColor Yellow
    railway add
    Write-Host "✅ MongoDB added! Railway will automatically set MONGODB_URI" -ForegroundColor Green
    Write-Host ""
}

# Set environment variables
Write-Host "🔧 Environment Variables Setup" -ForegroundColor Cyan
Write-Host "Let's set up your environment variables..." -ForegroundColor Yellow
Write-Host ""

# JWT Secret
$jwtSecret = Read-Host "Enter JWT_SECRET (or press Enter to generate random)"
if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
    $jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "Generated JWT_SECRET: $jwtSecret" -ForegroundColor Green
}
railway variables set JWT_SECRET="$jwtSecret"

# Session Secret
$sessionSecret = Read-Host "Enter SESSION_SECRET (or press Enter to generate random)"
if ([string]::IsNullOrWhiteSpace($sessionSecret)) {
    $sessionSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
    Write-Host "Generated SESSION_SECRET: $sessionSecret" -ForegroundColor Green
}
railway variables set SESSION_SECRET="$sessionSecret"

# MongoDB URI (if not using Railway MongoDB)
if ($dbChoice -ne "1") {
    $mongoUri = Read-Host "Enter MONGODB_URI"
    railway variables set MONGODB_URI="$mongoUri"
}

# Set NODE_ENV
railway variables set NODE_ENV="production"

Write-Host ""
Write-Host "✅ Basic environment variables set!" -ForegroundColor Green
Write-Host ""

# Optional OAuth setup
Write-Host "🔑 OAuth Setup (Optional)" -ForegroundColor Cyan
$setupOAuth = Read-Host "Do you want to set up OAuth providers? (y/n)"
if ($setupOAuth -eq "y") {
    Write-Host ""
    Write-Host "Google OAuth:" -ForegroundColor Yellow
    $googleClientId = Read-Host "Google Client ID (or press Enter to skip)"
    if (![string]::IsNullOrWhiteSpace($googleClientId)) {
        railway variables set GOOGLE_CLIENT_ID="$googleClientId"
        $googleClientSecret = Read-Host "Google Client Secret"
        railway variables set GOOGLE_CLIENT_SECRET="$googleClientSecret"
    }
    
    Write-Host ""
    Write-Host "GitHub OAuth:" -ForegroundColor Yellow
    $githubClientId = Read-Host "GitHub Client ID (or press Enter to skip)"
    if (![string]::IsNullOrWhiteSpace($githubClientId)) {
        railway variables set GITHUB_CLIENT_ID="$githubClientId"
        $githubClientSecret = Read-Host "GitHub Client Secret"
        railway variables set GITHUB_CLIENT_SECRET="$githubClientSecret"
    }
}

Write-Host ""
Write-Host "🚀 Starting deployment..." -ForegroundColor Cyan
railway up

Write-Host ""
Write-Host "🌐 Generating domain..." -ForegroundColor Cyan
railway domain

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "1. Get your Railway domain with: railway domain" -ForegroundColor White
Write-Host "2. Update CLIENT_URL: railway variables set CLIENT_URL='https://your-domain.up.railway.app'" -ForegroundColor White
Write-Host "3. View logs: railway logs" -ForegroundColor White
Write-Host "4. Open app: railway open" -ForegroundColor White
Write-Host ""

