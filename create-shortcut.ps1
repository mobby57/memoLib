$ws = New-Object -ComObject WScript.Shell
$desktop = [Environment]::GetFolderPath('Desktop')
$shortcut = $ws.CreateShortcut("$desktop\MemoLib.lnk")
$shortcut.TargetPath = "C:\Users\moros\Desktop\memolib\start-memolib.bat"
$shortcut.WorkingDirectory = "C:\Users\moros\Desktop\memolib"
$shortcut.IconLocation = "C:\Users\moros\Desktop\memolib\public\favicon.ico,0"
$shortcut.Description = "MemoLib - Plateforme Juridique Intelligente"
$shortcut.Save()
Write-Host "Raccourci MemoLib cree sur le Bureau!"
