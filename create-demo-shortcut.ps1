$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")

$Shortcut = $WshShell.CreateShortcut("$Desktop\MemoLib DEMO.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$PWD\demo.ps1`""
$Shortcut.WorkingDirectory = "$PWD"
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Demo MemoLib - Choix Secteur"
$Shortcut.Save()

Write-Host "Raccourci DEMO cree sur le bureau!" -ForegroundColor Green
