# fix-double-encoding.ps1
$files = Get-ChildItem -LiteralPath 'src\app' -Recurse -Filter '*.tsx'
$fixedCount = 0

# Build replacement pairs from hex values to avoid encoding issues in the script itself
$pairs = @(
    # Most common French double-encoded chars
    @([char]0xC3, [char]0xA9, [char]0xE9)   # e-acute
    @([char]0xC3, [char]0xA8, [char]0xE8)   # e-grave
    @([char]0xC3, [char]0xAA, [char]0xEA)   # e-circumflex
    @([char]0xC3, [char]0xA0, [char]0xE0)   # a-grave
    @([char]0xC3, [char]0xA2, [char]0xE2)   # a-circumflex
    @([char]0xC3, [char]0xAE, [char]0xEE)   # i-circumflex
    @([char]0xC3, [char]0xAF, [char]0xEF)   # i-diaeresis
    @([char]0xC3, [char]0xB4, [char]0xF4)   # o-circumflex
    @([char]0xC3, [char]0xB9, [char]0xF9)   # u-grave
    @([char]0xC3, [char]0xBB, [char]0xFB)   # u-circumflex
    @([char]0xC3, [char]0xBC, [char]0xFC)   # u-diaeresis
    @([char]0xC3, [char]0xA7, [char]0xE7)   # c-cedilla
)

foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $offset = 0
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $offset = 3
    }
    $content = [System.Text.Encoding]::UTF8.GetString($bytes, $offset, $bytes.Length - $offset)
    $original = $content

    foreach ($p in $pairs) {
        $search = [string]::new($p[0]) + [string]::new($p[1])
        $replace = [string]::new($p[2])
        $content = $content.Replace($search, $replace)
    }

    # Also clean orphan 0xC2 before accented chars (another double-encoding artifact)
    $content = $content.Replace([string]::new([char]0xC2) + [string]::new([char]0xA9), [string]::new([char]0xA9))
    $content = $content.Replace([string]::new([char]0xC2) + [string]::new([char]0xAB), [string]::new([char]0xAB))
    $content = $content.Replace([string]::new([char]0xC2) + [string]::new([char]0xBB), [string]::new([char]0xBB))

    if ($content -ne $original) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        $fixedCount++
        Write-Host "FIXED: $($file.Name)"
    }
}

Write-Host "$fixedCount fichiers corriges"
