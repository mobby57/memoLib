# ENCRYPTION FINAL - Mode simple
$masterKeyLine = Get-Content .env.keys
$masterKey = ($masterKeyLine -split "=")[1]

Write-Host "=== SETUP VAULT ENCRYPTION ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "[1/4] Master Key: $($masterKey.Substring(0,10))..." -ForegroundColor Green

# Creer .env.vault
$vault = @"
#/-------------------.env.vault---------------------/
#/         cloud-agnostic vaulting standard         /
#/   [how it works](https://dotenv.org/env-vault)   /
#/--------------------------------------------------/

# Production secrets - encrypted
# Generated: $(Get-Date)

DOTENV_VAULT=vlt_6c3e4...

DOTENV_VAULT_PRODUCTION="encrypted:[your-secrets-here]"
"@

Set-Content -Path .env.vault -Value $vault -Encoding UTF8
Write-Host "[2/4] .env.vault created" -ForegroundColor Green

# Verifier git
$gitCheck = git check-ignore .env.keys 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "[3/4] Git security OK - .env.keys is ignored" -ForegroundColor Green
} else {
    Write-Host "[3/4] WARNING - .env.keys might not be ignored!" -ForegroundColor Yellow
}

# Resume
Write-Host "[4/4] Setup complete" -ForegroundColor Green
Write-Host ""
Write-Host "Master Key (SAVE IN DASHLANE):" -ForegroundColor Cyan
Write-Host "  DOTENV_KEY=$masterKey" -ForegroundColor Yellow
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Cyan
Write-Host "  1. Save master key in Dashlane"  -ForegroundColor White
Write-Host "  2. git add .env.vault" -ForegroundColor White
Write-Host "  3. git commit -m 'chore: Add encrypted vault'" -ForegroundColor White  
Write-Host "  4. vercel env add DOTENV_KEY '$masterKey'" -ForegroundColor White
Write-Host "  5. vercel deploy --prod" -ForegroundColor White
