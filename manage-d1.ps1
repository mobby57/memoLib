# Gestion Cloudflare D1 avec OAuth
param([Parameter(ValueFromRemainingArguments=$true)][string[]]$WranglerArgs)
Write-Host "`nGestion D1 avec OAuth...`n" -ForegroundColor Cyan
$envExists = Test-Path ".env"
if ($envExists) { Rename-Item ".env" ".env.backup" -Force -ErrorAction SilentlyContinue }
try {
    & wrangler @WranglerArgs
    if ($LASTEXITCODE -eq 0) { Write-Host "`nReussi!`n" -ForegroundColor Green }
} finally {
    if ($envExists) { Rename-Item ".env.backup" ".env" -Force -ErrorAction SilentlyContinue }
}
