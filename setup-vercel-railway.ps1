# PowerShell Script to Configure Vercel + Railway Integration

Write-Host "🔗 Vercel + Railway Integration Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Get Vercel URL
Write-Host "📝 Step 1: Vercel Configuration" -ForegroundColor Yellow
Write-Host "--------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "Please enter your Vercel deployment URL:" -ForegroundColor White
Write-Host "Example: https://inturn-x.vercel.app" -ForegroundColor Gray
Write-Host "You can find this in your Vercel dashboard" -ForegroundColor Gray
Write-Host ""
$vercelUrl = Read-Host "Vercel URL"

if ([string]::IsNullOrWhiteSpace($vercelUrl)) {
    Write-Host "❌ Error: Vercel URL is required!" -ForegroundColor Red
    exit 1
}

# Remove trailing slash if present
$vercelUrl = $vercelUrl.TrimEnd('/')

Write-Host ""
Write-Host "✅ Vercel URL: $vercelUrl" -ForegroundColor Green
Write-Host ""

# Step 2: Railway Backend URL
$railwayUrl = "https://inturnx-production.up.railway.app"
Write-Host "📝 Step 2: Railway Backend URL" -ForegroundColor Yellow
Write-Host "-------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Railway Backend: $railwayUrl" -ForegroundColor Green
Write-Host ""

# Step 3: Update Railway Environment Variables
Write-Host "📝 Step 3: Updating Railway Environment Variables" -ForegroundColor Yellow
Write-Host "--------------------------------------------------" -ForegroundColor Yellow
Write-Host ""

Write-Host "Setting CLIENT_URL on Railway..." -ForegroundColor White
railway variables --set "CLIENT_URL=$vercelUrl"

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ CLIENT_URL updated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to update CLIENT_URL. Make sure you're logged in to Railway." -ForegroundColor Red
    Write-Host "Run: railway login" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Step 4: Display Vercel Environment Variables
Write-Host "📝 Step 4: Vercel Environment Variables" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  IMPORTANT: Add these environment variables to Vercel manually:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Go to: https://vercel.com/hariomsharma2644s-projects/inturn-x/settings/environment-variables" -ForegroundColor Cyan
Write-Host ""
Write-Host "Add the following variables:" -ForegroundColor White
Write-Host ""
Write-Host "Variable 1:" -ForegroundColor Cyan
Write-Host "  Name:  VITE_API_URL" -ForegroundColor White
Write-Host "  Value: $railwayUrl" -ForegroundColor Green
Write-Host "  Environments: ✅ Production ✅ Preview ✅ Development" -ForegroundColor Gray
Write-Host ""
Write-Host "Variable 2:" -ForegroundColor Cyan
Write-Host "  Name:  VITE_SOCKET_URL" -ForegroundColor White
Write-Host "  Value: $railwayUrl" -ForegroundColor Green
Write-Host "  Environments: ✅ Production ✅ Preview ✅ Development" -ForegroundColor Gray
Write-Host ""

# Step 5: Instructions for redeployment
Write-Host "📝 Step 5: Redeploy Vercel" -ForegroundColor Yellow
Write-Host "--------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "After adding the environment variables to Vercel:" -ForegroundColor White
Write-Host ""
Write-Host "Option A - Via Vercel Dashboard:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://vercel.com/hariomsharma2644s-projects/inturn-x" -ForegroundColor White
Write-Host "  2. Click on 'Deployments' tab" -ForegroundColor White
Write-Host "  3. Click on the latest deployment" -ForegroundColor White
Write-Host "  4. Click 'Redeploy' button" -ForegroundColor White
Write-Host ""
Write-Host "Option B - Via Git:" -ForegroundColor Cyan
Write-Host "  git commit --allow-empty -m 'Trigger Vercel redeploy'" -ForegroundColor White
Write-Host "  git push" -ForegroundColor White
Write-Host ""
Write-Host "Option C - Via Vercel CLI:" -ForegroundColor Cyan
Write-Host "  cd client" -ForegroundColor White
Write-Host "  vercel --prod" -ForegroundColor White
Write-Host ""

# Step 6: Verification
Write-Host "📝 Step 6: Verification" -ForegroundColor Yellow
Write-Host "-----------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "After redeployment, test these:" -ForegroundColor White
Write-Host ""
Write-Host "✅ Open your Vercel app: $vercelUrl" -ForegroundColor Green
Write-Host "✅ Open browser DevTools (F12) → Console" -ForegroundColor Green
Write-Host "✅ Check for CORS errors (should be none)" -ForegroundColor Green
Write-Host "✅ Try logging in" -ForegroundColor Green
Write-Host "✅ Test Socket.IO features (Battle Arena)" -ForegroundColor Green
Write-Host ""

# Step 7: OAuth Configuration
Write-Host "📝 Step 7: Update OAuth Callbacks (if using)" -ForegroundColor Yellow
Write-Host "---------------------------------------------" -ForegroundColor Yellow
Write-Host ""
Write-Host "If you're using OAuth (GitHub, Google, LinkedIn):" -ForegroundColor White
Write-Host ""
Write-Host "GitHub OAuth:" -ForegroundColor Cyan
Write-Host "  URL: https://github.com/settings/developers" -ForegroundColor White
Write-Host "  Homepage URL: $vercelUrl" -ForegroundColor Green
Write-Host "  Callback URL: $railwayUrl/api/auth/github/callback" -ForegroundColor Green
Write-Host ""
Write-Host "Google OAuth:" -ForegroundColor Cyan
Write-Host "  URL: https://console.cloud.google.com/apis/credentials" -ForegroundColor White
Write-Host "  Authorized JavaScript origins: $vercelUrl" -ForegroundColor Green
Write-Host "  Authorized redirect URIs: $railwayUrl/api/auth/google/callback" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Railway Configuration Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Yellow
Write-Host "  ✅ Railway CLIENT_URL set to: $vercelUrl" -ForegroundColor Green
Write-Host "  ⏳ Vercel environment variables: Pending (add manually)" -ForegroundColor Yellow
Write-Host "  ⏳ Vercel redeployment: Pending" -ForegroundColor Yellow
Write-Host ""
Write-Host "📝 Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Add environment variables to Vercel (see above)" -ForegroundColor White
Write-Host "  2. Redeploy Vercel" -ForegroundColor White
Write-Host "  3. Test your application" -ForegroundColor White
Write-Host "  4. Update OAuth callbacks (if needed)" -ForegroundColor White
Write-Host ""
Write-Host "📚 For detailed instructions, see: VERCEL_RAILWAY_INTEGRATION.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Happy deploying!" -ForegroundColor Green
Write-Host ""

