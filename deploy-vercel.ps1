# PowerShell Script to Deploy Frontend to Vercel

Write-Host "🔷 Deploying InturnX Frontend to Vercel" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Vercel CLI is installed
Write-Host "Checking Vercel CLI..." -ForegroundColor Yellow
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Red
    npm install -g vercel
    Write-Host "✅ Vercel CLI installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✅ Vercel CLI is already installed" -ForegroundColor Green
}

Write-Host ""

# Navigate to client directory
Write-Host "📁 Navigating to client directory..." -ForegroundColor Yellow
Set-Location -Path "client"

# Check if .env.production exists
if (Test-Path ".env.production") {
    Write-Host "✅ .env.production found" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env.production not found. Creating it..." -ForegroundColor Yellow
    @"
VITE_API_URL=https://inturnx-production.up.railway.app
VITE_SOCKET_URL=https://inturnx-production.up.railway.app
"@ | Out-File -FilePath ".env.production" -Encoding UTF8
    Write-Host "✅ .env.production created" -ForegroundColor Green
}

Write-Host ""

# Check if vercel.json exists
if (Test-Path "vercel.json") {
    Write-Host "✅ vercel.json found" -ForegroundColor Green
} else {
    Write-Host "❌ vercel.json not found. Please create it first!" -ForegroundColor Red
    Set-Location -Path ".."
    exit 1
}

Write-Host ""
Write-Host "🚀 Starting Vercel deployment..." -ForegroundColor Cyan
Write-Host ""

# Deploy to Vercel
Write-Host "Running: vercel --prod" -ForegroundColor Yellow
vercel --prod

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Deployment process completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "1. Copy the Vercel deployment URL from above" -ForegroundColor White
Write-Host "2. Update Railway backend CORS:" -ForegroundColor White
Write-Host "   railway variables --set `"CLIENT_URL=https://your-vercel-url.vercel.app`"" -ForegroundColor Cyan
Write-Host "3. Update OAuth callback URLs to use Vercel frontend URL" -ForegroundColor White
Write-Host "4. Test your application!" -ForegroundColor White
Write-Host ""

# Return to root directory
Set-Location -Path ".."

