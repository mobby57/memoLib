# Script to replace [emoji] with real emojis
$files = Get-ChildItem -Path "src" -Recurse -Include "*.ts","*.tsx"
$count = 0

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    if ($content -match '\[emoji\]') {
        # Replace all [emoji] with 📌
        $newContent = $content.Replace('[emoji]', '📌')
        
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.UTF8Encoding]::new($false))
        $count++
        Write-Host "Modified: $($file.Name)"
    }
}

Write-Host "`n✅ Total files modified: $count"
