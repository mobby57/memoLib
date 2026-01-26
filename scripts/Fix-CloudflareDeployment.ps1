# PowerShell script to fix Cloudflare Pages deployment

# Colors
$green = @{ ForegroundColor = 'Green' }
$yellow = @{ ForegroundColor = 'Yellow' }
$cyan = @{ ForegroundColor = 'Cyan' }
$red = @{ ForegroundColor = 'Red' }

Write-Host "`n🔧 CLOUDFLARE PAGES DEPLOYMENT FIX`n" @green

# The issue is that we need the correct Account ID from Cloudflare Dashboard

Write-Host "📋 Step 1: Get Your Cloudflare Account ID" @cyan
Write-Host "1. Go to: https://dash.cloudflare.com" @yellow
Write-Host "2. Click your profile icon (bottom left)" @yellow
Write-Host "3. Select 'Accounts' from the sidebar" @yellow
Write-Host "4. Your Account ID is displayed (e.g., a1b2c3d4...)" @yellow
Write-Host "`nOR in Account Home -> API Tokens -> Workspace ID" @yellow

Write-Host "`n📋 Step 2: Verify Your API Token Has Correct Permissions" @cyan
Write-Host "1. Go to: https://dash.cloudflare.com/profile/api-tokens" @yellow
Write-Host "2. Find your token used for deployment" @yellow
Write-Host "3. Required permissions:" @yellow
Write-Host "   - Cloudflare Pages (Edit)" @yellow
Write-Host "   - Zone.Workers (Edit)" @yellow
Write-Host "`nNote: Your token shows 'Super Administrator' which is good!" @green

Write-Host "`n📋 Step 3: Update GitHub Secrets" @cyan
Write-Host "1. Go to: https://github.com/mobby57/iapostemanager/settings/secrets/actions" @yellow
Write-Host "2. Update secret 'CLOUDFLARE_ACCOUNT_ID' with your Account ID" @yellow
Write-Host "3. Verify 'CLOUDFLARE_API_TOKEN' is still set correctly" @yellow

Write-Host "`n📋 Step 4: Alternative - Use Cloudflare Direct Upload" @cyan
Write-Host "If API issues persist, we can use GitHub + Cloudflare integration:" @yellow
Write-Host "  - Cloudflare API Token (you have it ✅)" @yellow
Write-Host "  - Pages project name: 'iapostemanage' or 'iapostemanager'" @yellow
Write-Host "  - Build command: npm run build" @yellow
Write-Host "  - Build output: .next" @yellow

Write-Host "`n🚀 Quick Fix Commands" @cyan
Write-Host "Once you have the Account ID, run locally:" @yellow
Write-Host '  export CLOUDFLARE_API_TOKEN="your-token-here"' @yellow
Write-Host '  export CLOUDFLARE_ACCOUNT_ID="your-account-id"' @yellow
Write-Host '  npx wrangler pages deploy .next' @yellow

Write-Host "`n📚 Debugging Info" @cyan
Write-Host "The error 'code: 10000' usually means:" @yellow
Write-Host "  • Account ID is missing or incorrect" @yellow
Write-Host "  • API Token doesn't have the right permissions" @yellow
Write-Host "  • Project doesn't exist in Cloudflare Pages" @yellow

Write-Host "`n✅ Next Steps:" @green
Write-Host "1. Gather the Account ID from Cloudflare Dashboard" @yellow
Write-Host "2. Update GitHub secret CLOUDFLARE_ACCOUNT_ID" @yellow
Write-Host "3. Retry the deployment workflow" @yellow
Write-Host "`n" @yellow
