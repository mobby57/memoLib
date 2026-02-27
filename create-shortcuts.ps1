$WshShell = New-Object -ComObject WScript.Shell
$Desktop = [Environment]::GetFolderPath("Desktop")

# Raccourci Lancer MemoLib
$Shortcut = $WshShell.CreateShortcut("$Desktop\MemoLib START.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$PWD\start.ps1`""
$Shortcut.WorkingDirectory = "$PWD"
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Lancer MemoLib Platform"
$Shortcut.Save()

# Raccourci Arreter MemoLib
$Shortcut = $WshShell.CreateShortcut("$Desktop\MemoLib STOP.lnk")
$Shortcut.TargetPath = "powershell.exe"
$Shortcut.Arguments = "-ExecutionPolicy Bypass -File `"$PWD\stop.ps1`""
$Shortcut.WorkingDirectory = "$PWD"
$Shortcut.IconLocation = "powershell.exe,0"
$Shortcut.Description = "Arreter MemoLib Platform"
$Shortcut.Save()

# Raccourci Frontend
$Shortcut = $WshShell.CreateShortcut("$Desktop\MemoLib Frontend.lnk")
$Shortcut.TargetPath = "http://localhost:3000"
$Shortcut.IconLocation = "shell32.dll,13"
$Shortcut.Description = "Ouvrir Frontend Utilisateur"
$Shortcut.Save()

# Raccourci Admin
$Shortcut = $WshShell.CreateShortcut("$Desktop\MemoLib Admin.lnk")
$Shortcut.TargetPath = "http://localhost:8091"
$Shortcut.IconLocation = "shell32.dll,13"
$Shortcut.Description = "Ouvrir Admin Panel"
$Shortcut.Save()

Write-Host "Raccourcis crees sur le bureau!" -ForegroundColor Green
Write-Host "  - MemoLib START.lnk" -ForegroundColor White
Write-Host "  - MemoLib STOP.lnk" -ForegroundColor White
Write-Host "  - MemoLib Frontend.lnk" -ForegroundColor White
Write-Host "  - MemoLib Admin.lnk" -ForegroundColor White
