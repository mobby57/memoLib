$ErrorActionPreference = 'Stop'

$targetDir = Join-Path $env:LOCALAPPDATA 'MemoLib\DemoApp'
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcutPath = Join-Path $desktop 'MemoLib Demo.lnk'

if (Test-Path $shortcutPath) {
  Remove-Item -Force $shortcutPath
}

if (Test-Path $targetDir) {
  Remove-Item -Recurse -Force $targetDir
}

Write-Host 'MemoLib Demo dÃ©sinstallÃ©.'
