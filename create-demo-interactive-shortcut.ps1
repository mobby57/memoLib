$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")

$Shortcut = $WshShell.CreateShortcut("$Desktop\DEMO INTERACTIVE.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$PWD\demo-interactive.ps1`""
$Shortcut.WorkingDirectory = "$PWD"
$Shortcut.IconLocation = "shell32.dll,21"
$Shortcut.Description = "Demo Interactive Complete MemoLib"
$Shortcut.Save()

Write-Host "Raccourci DEMO INTERACTIVE cree!" -ForegroundColor Green
