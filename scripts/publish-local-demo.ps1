$ErrorActionPreference = 'Stop'

$projectDir = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $projectDir 'dist\local-demo'

Write-Host 'Build demo package...'
if (Test-Path $outDir) {
  Remove-Item -Recurse -Force $outDir
}

Push-Location $projectDir
try {
  dotnet publish .\MemoLib.Api.csproj -c Release -r win-x64 --self-contained true -o $outDir
}
finally {
  Pop-Location
}

$runPs1 = @"
`$ErrorActionPreference = 'Stop'

`$candidatePorts = 8091..8100
`$selectedPort = `$null

foreach (`$port in `$candidatePorts) {
  `$inUse = Get-NetTCPConnection -LocalPort `$port -State Listen -ErrorAction SilentlyContinue
  if (-not `$inUse) {
    `$selectedPort = `$port
    break
  }
}

if (-not `$selectedPort) {
  throw 'Aucun port libre trouvé entre 8091 et 8100.'
}

`$env:ASPNETCORE_ENVIRONMENT = 'Production'
`$env:ASPNETCORE_URLS = "http://localhost:`$selectedPort"
`$env:JwtSettings__SecretKey = 'MEMOLIB_LOCAL_DEMO_SECRET_2026_32_CHARS_MIN'
`$env:DisableHttpsRedirection = 'true'

`$dbDir = Join-Path `$env:LOCALAPPDATA 'MemoLib'
if (-not (Test-Path `$dbDir)) {
  New-Item -ItemType Directory -Path `$dbDir | Out-Null
}

`$env:ConnectionStrings__Default = "Data Source=`$dbDir\\memolib.demo.db"

Write-Host "MemoLib demo: http://localhost:`$selectedPort"
Start-Process "http://localhost:`$selectedPort/health"

& .\MemoLib.Api.exe
"@

$runBat = @"
@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0run-demo.ps1"
"@

Set-Content -Path (Join-Path $outDir 'run-demo.ps1') -Value $runPs1 -Encoding UTF8
Set-Content -Path (Join-Path $outDir 'run-demo.bat') -Value $runBat -Encoding ASCII

$installPs1 = @"
`$ErrorActionPreference = 'Stop'

`$sourceDir = Split-Path -Parent `$MyInvocation.MyCommand.Path
`$targetDir = Join-Path `$env:LOCALAPPDATA 'MemoLib\DemoApp'

if (Test-Path `$targetDir) {
  Remove-Item -Recurse -Force `$targetDir
}

New-Item -ItemType Directory -Path `$targetDir | Out-Null
Copy-Item -Path (Join-Path `$sourceDir '*') -Destination `$targetDir -Recurse -Force

`$shell = New-Object -ComObject WScript.Shell
`$desktop = [Environment]::GetFolderPath('Desktop')

`$shortcut = `$shell.CreateShortcut((Join-Path `$desktop 'MemoLib Demo.lnk'))
`$shortcut.TargetPath = Join-Path `$targetDir 'run-demo.bat'
`$shortcut.WorkingDirectory = `$targetDir
`$shortcut.IconLocation = Join-Path `$targetDir 'MemoLib.Api.exe'
`$shortcut.Save()

Write-Host "Installé: `$targetDir"
Write-Host 'Raccourci créé: Bureau > MemoLib Demo'
"@

$installBat = @"
@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0install-demo.ps1"
pause
"@

$uninstallPs1 = @"
`$ErrorActionPreference = 'Stop'

`$targetDir = Join-Path `$env:LOCALAPPDATA 'MemoLib\DemoApp'
`$desktop = [Environment]::GetFolderPath('Desktop')
`$shortcutPath = Join-Path `$desktop 'MemoLib Demo.lnk'

if (Test-Path `$shortcutPath) {
  Remove-Item -Force `$shortcutPath
}

if (Test-Path `$targetDir) {
  Remove-Item -Recurse -Force `$targetDir
}

Write-Host 'MemoLib Demo désinstallé.'
"@

$uninstallBat = @"
@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0uninstall-demo.ps1"
pause
"@

Set-Content -Path (Join-Path $outDir 'install-demo.ps1') -Value $installPs1 -Encoding UTF8
Set-Content -Path (Join-Path $outDir 'install-demo.bat') -Value $installBat -Encoding ASCII
Set-Content -Path (Join-Path $outDir 'uninstall-demo.ps1') -Value $uninstallPs1 -Encoding UTF8
Set-Content -Path (Join-Path $outDir 'uninstall-demo.bat') -Value $uninstallBat -Encoding ASCII

$readme = @"
MemoLib.Api - Demo locale

Option A (portable):
1) Double-cliquez run-demo.bat
2) Le script choisit automatiquement un port libre entre 8091 et 8100
3) Vérifiez l'URL /health affichée dans la console

Option B (installer local):
1) Double-cliquez install-demo.bat
2) Lancez "MemoLib Demo" depuis le Bureau
3) Pour supprimer, exécutez uninstall-demo.bat

La base est stockée ici:
%LOCALAPPDATA%\MemoLib\memolib.demo.db

HTTPS redirection est désactivée en mode démo locale.
"@
Set-Content -Path (Join-Path $outDir 'README-DEMO.txt') -Value $readme -Encoding UTF8

Write-Host "Done: $outDir"
