$ErrorActionPreference = 'Stop'

$sourceDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$targetDir = Join-Path $env:LOCALAPPDATA 'MemoLib\DemoApp'

if (Test-Path $targetDir) {
  Remove-Item -Recurse -Force $targetDir
}

New-Item -ItemType Directory -Path $targetDir | Out-Null
Copy-Item -Path (Join-Path $sourceDir '*') -Destination $targetDir -Recurse -Force

$shell = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')

$shortcut = $shell.CreateShortcut((Join-Path $desktop 'MemoLib Demo.lnk'))
$shortcut.TargetPath = Join-Path $targetDir 'run-demo.bat'
$shortcut.WorkingDirectory = $targetDir
$shortcut.IconLocation = Join-Path $targetDir 'MemoLib.Api.exe'
$shortcut.Save()

Write-Host "InstallÃ©: $targetDir"
Write-Host 'Raccourci crÃ©Ã©: Bureau > MemoLib Demo'
