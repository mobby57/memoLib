# Script de conversion des caracteres non-ASCII en ASCII pur
# Pour les fichiers TypeScript/JavaScript du projet

$srcPath = "c:\Users\moros\Desktop\iaPostemanage\src"
$logFile = "c:\Users\moros\Desktop\iaPostemanage\ascii-conversion-report.txt"

# Emojis courants -> texte descriptif (utilise codes Unicode)
$emojiReplacements = @{
    '[Chart]' = [char]::ConvertFromUtf32(0x1F4CA)
    '[Search]' = [char]::ConvertFromUtf32(0x1F50D)
    '[+]' = [char]::ConvertFromUtf32(0x2795)
    '[OK]' = [char]::ConvertFromUtf32(0x2705)
    '[ERROR]' = [char]::ConvertFromUtf32(0x274C)
    '[Warning]' = [char]::ConvertFromUtf32(0x26A0)
    '[Alert]' = [char]::ConvertFromUtf32(0x1F6A8)
    '[User]' = [char]::ConvertFromUtf32(0x1F464)
    '[Lock]' = [char]::ConvertFromUtf32(0x1F512)
    '[Chat]' = [char]::ConvertFromUtf32(0x1F4AC)
    '[Folder]' = [char]::ConvertFromUtf32(0x1F4C1)
    '[File]' = [char]::ConvertFromUtf32(0x1F4C4)
    '[Mail]' = [char]::ConvertFromUtf32(0x1F4E7)
    '[Calendar]' = [char]::ConvertFromUtf32(0x1F4C5)
    '[Star]' = [char]::ConvertFromUtf32(0x2B50)
    '[Arrow]' = [char]::ConvertFromUtf32(0x2192)
    '[Refresh]' = [char]::ConvertFromUtf32(0x1F504)
    '[Download]' = [char]::ConvertFromUtf32(0x1F4E5)
    '[Upload]' = [char]::ConvertFromUtf32(0x1F4E4)
    '[Settings]' = [char]::ConvertFromUtf32(0x2699)
    '[Home]' = [char]::ConvertFromUtf32(0x1F3E0)
    '[Bell]' = [char]::ConvertFromUtf32(0x1F514)
    '[Key]' = [char]::ConvertFromUtf32(0x1F511)
    '[Shield]' = [char]::ConvertFromUtf32(0x1F6E1)
    '[Fire]' = [char]::ConvertFromUtf32(0x1F525)
    '[Rocket]' = [char]::ConvertFromUtf32(0x1F680)
    '[Money]' = [char]::ConvertFromUtf32(0x1F4B0)
    '[Phone]' = [char]::ConvertFromUtf32(0x1F4DE)
    '[Globe]' = [char]::ConvertFromUtf32(0x1F30D)
    '[Cloud]' = [char]::ConvertFromUtf32(0x2601)
    '[Heart]' = [char]::ConvertFromUtf32(0x2764)
    '[Bulb]' = [char]::ConvertFromUtf32(0x1F4A1)
    '[Trash]' = [char]::ConvertFromUtf32(0x1F5D1)
    '[Link]' = [char]::ConvertFromUtf32(0x1F517)
    '[Eye]' = [char]::ConvertFromUtf32(0x1F441)
}

$modifiedFiles = @()
$totalReplacements = 0

Write-Output "=== Conversion des fichiers en ASCII pur ==="
Write-Output "Repertoire source: $srcPath"
Write-Output ""

# Trouver tous les fichiers TypeScript/JavaScript avec caracteres non-ASCII
$files = Get-ChildItem -Path $srcPath -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Where-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        return $content -match '[^\x00-\x7F]'
    }
    return $false
}

$totalFiles = $files.Count
Write-Output "Fichiers avec caracteres non-ASCII trouves: $totalFiles"
Write-Output ""

$counter = 0
foreach ($file in $files) {
    $counter++
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    $fileReplacements = 0
    
    # Remplacer les emojis par du texte
    foreach ($replacement in $emojiReplacements.GetEnumerator()) {
        if ($content -match [regex]::Escape($replacement.Value)) {
            $content = $content -replace [regex]::Escape($replacement.Value), $replacement.Key
            $fileReplacements++
        }
    }
    
    # Remplacer les caracteres accentues (e)
    $content = $content -replace [char]0x00E9, 'e'
    $content = $content -replace [char]0x00E8, 'e'
    $content = $content -replace [char]0x00EA, 'e'
    $content = $content -replace [char]0x00EB, 'e'
    $content = $content -replace [char]0x00C9, 'E'
    $content = $content -replace [char]0x00C8, 'E'
    $content = $content -replace [char]0x00CA, 'E'
    $content = $content -replace [char]0x00CB, 'E'
    
    # a accentue
    $content = $content -replace [char]0x00E0, 'a'
    $content = $content -replace [char]0x00E2, 'a'
    $content = $content -replace [char]0x00E4, 'a'
    $content = $content -replace [char]0x00C0, 'A'
    $content = $content -replace [char]0x00C2, 'A'
    $content = $content -replace [char]0x00C4, 'A'
    
    # u accentue
    $content = $content -replace [char]0x00F9, 'u'
    $content = $content -replace [char]0x00FB, 'u'
    $content = $content -replace [char]0x00FC, 'u'
    $content = $content -replace [char]0x00D9, 'U'
    $content = $content -replace [char]0x00DB, 'U'
    $content = $content -replace [char]0x00DC, 'U'
    
    # i accentue
    $content = $content -replace [char]0x00EE, 'i'
    $content = $content -replace [char]0x00EF, 'i'
    $content = $content -replace [char]0x00CE, 'I'
    $content = $content -replace [char]0x00CF, 'I'
    
    # o accentue
    $content = $content -replace [char]0x00F4, 'o'
    $content = $content -replace [char]0x00F6, 'o'
    $content = $content -replace [char]0x00D4, 'O'
    $content = $content -replace [char]0x00D6, 'O'
    
    # c cedille
    $content = $content -replace [char]0x00E7, 'c'
    $content = $content -replace [char]0x00C7, 'C'
    
    # Ligatures
    $content = $content -replace [char]0x0153, 'oe'
    $content = $content -replace [char]0x00E6, 'ae'
    $content = $content -replace [char]0x0152, 'OE'
    $content = $content -replace [char]0x00C6, 'AE'
    
    # Guillemets francais
    $content = $content -replace [char]0x00AB, '"'
    $content = $content -replace [char]0x00BB, '"'
    
    # Apostrophes typographiques
    $content = $content -replace [char]0x2018, "'"
    $content = $content -replace [char]0x2019, "'"
    
    # Points de suspension
    $content = $content -replace [char]0x2026, '...'
    
    # Tirets longs
    $content = $content -replace [char]0x2014, '-'
    $content = $content -replace [char]0x2013, '-'
    
    # Espaces insecables
    $content = $content -replace [char]0x00A0, ' '
    
    # Verifier si le fichier a ete modifie
    if ($content -ne $originalContent) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        
        $modifiedFiles += $file.FullName
        $totalReplacements++
        
        $relativePath = $file.FullName.Replace($srcPath, "src")
        Write-Output "[$counter/$totalFiles] Modifie: $relativePath"
    } else {
        $relativePath = $file.FullName.Replace($srcPath, "src")
        Write-Output "[$counter/$totalFiles] Inchange: $relativePath"
    }
}

# Generer le rapport
$reportContent = "RAPPORT DE CONVERSION ASCII`n"
$reportContent += "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`n"
$reportContent += "Fichiers analyses: $totalFiles`n"
$reportContent += "Fichiers modifies: $($modifiedFiles.Count)`n"

$reportContent | Out-File -FilePath $logFile -Encoding UTF8

Write-Output ""
Write-Output "=== CONVERSION TERMINEE ==="
Write-Output "Fichiers modifies: $($modifiedFiles.Count) / $totalFiles"
Write-Output "Rapport sauvegarde: $logFile"
