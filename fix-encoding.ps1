# fix-encoding.ps1 - Fix double-encoded UTF-8 (mojibake) in all source files
$srcPath = "c:\Users\moros\Desktop\memolib\MemoLib.Api\src"

# Mojibake → correct UTF-8 mapping (Latin-1 misread of UTF-8)
$replacements = @{
    'Ã©' = 'é'
    'Ã¨' = 'è'
    'Ã ' = 'à'
    'Ã§' = 'ç'
    'Ã®' = 'î'
    'Ã´' = 'ô'
    'Ã¹' = 'ù'
    'Ã«' = 'ë'
    'Ã¯' = 'ï'
    'Ã¢' = 'â'
    'Ãª' = 'ê'
    'Ã»' = 'û'
    'Ã¼' = 'ü'
    'Ã ' = 'À'
    'Ã‰' = 'É'
    'Ã€' = 'À'
    'Ã‡' = 'Ç'
    'Ã"' = 'Ô'
    'Ãˆ' = 'È'
    'Ã›' = 'Û'
    'Ãœ' = 'Ü'
    'Ã¦' = 'æ'
    'Å"' = 'œ'
}

$files = Get-ChildItem -Path $srcPath -Recurse -Include *.ts,*.tsx | Where-Object {
    $content = [System.IO.File]::ReadAllText($_.FullName, [System.Text.Encoding]::UTF8)
    $content -match 'Ã'
}

$count = 0
foreach ($f in $files) {
    $content = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $original = $content
    foreach ($key in $replacements.Keys) {
        $content = $content.Replace($key, $replacements[$key])
    }
    if ($content -ne $original) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($f.FullName, $content, $utf8NoBom)
        $count++
        Write-Host "Fixed: $($f.FullName)"
    }
}
Write-Host "`nTotal files fixed: $count"
