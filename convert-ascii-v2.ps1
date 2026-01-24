# Script de conversion des caracteres non-ASCII en ASCII pur
# Version simplifiee - ASCII only

$srcPath = "c:\Users\moros\Desktop\iaPostemanage\src"
$logFile = "c:\Users\moros\Desktop\iaPostemanage\ascii-conversion-report.txt"

$modifiedFiles = @()

Write-Host "=== Conversion des fichiers en ASCII pur ===" -ForegroundColor Cyan
Write-Host "Repertoire source: $srcPath" -ForegroundColor Yellow
Write-Host ""

# Trouver tous les fichiers TypeScript/JavaScript avec caracteres non-ASCII
$files = Get-ChildItem -Path $srcPath -Recurse -Include *.ts,*.tsx,*.js,*.jsx -ErrorAction SilentlyContinue | Where-Object {
    $content = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
    if ($content) {
        return $content -match '[^\x00-\x7F]'
    }
    return $false
}

$totalFiles = $files.Count
Write-Host "Fichiers avec caracteres non-ASCII trouves: $totalFiles" -ForegroundColor Green
Write-Host ""

$counter = 0
foreach ($file in $files) {
    $counter++
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Remplacer les caracteres accentues avec codes Unicode
    # e accentue
    $content = $content -replace [char]0x00E9, 'e'  # e
    $content = $content -replace [char]0x00E8, 'e'  # e
    $content = $content -replace [char]0x00EA, 'e'  # e
    $content = $content -replace [char]0x00EB, 'e'  # e
    $content = $content -replace [char]0x00C9, 'E'  # E
    $content = $content -replace [char]0x00C8, 'E'  # E
    $content = $content -replace [char]0x00CA, 'E'  # E
    $content = $content -replace [char]0x00CB, 'E'  # E
    
    # a accentue
    $content = $content -replace [char]0x00E0, 'a'  # a
    $content = $content -replace [char]0x00E2, 'a'  # a
    $content = $content -replace [char]0x00E4, 'a'  # a
    $content = $content -replace [char]0x00C0, 'A'  # A
    $content = $content -replace [char]0x00C2, 'A'  # A
    $content = $content -replace [char]0x00C4, 'A'  # A
    
    # u accentue
    $content = $content -replace [char]0x00F9, 'u'  # u
    $content = $content -replace [char]0x00FB, 'u'  # u
    $content = $content -replace [char]0x00FC, 'u'  # u
    $content = $content -replace [char]0x00D9, 'U'  # U
    $content = $content -replace [char]0x00DB, 'U'  # U
    $content = $content -replace [char]0x00DC, 'U'  # U
    
    # i accentue
    $content = $content -replace [char]0x00EE, 'i'  # i
    $content = $content -replace [char]0x00EF, 'i'  # i
    $content = $content -replace [char]0x00CE, 'I'  # I
    $content = $content -replace [char]0x00CF, 'I'  # I
    
    # o accentue
    $content = $content -replace [char]0x00F4, 'o'  # o
    $content = $content -replace [char]0x00F6, 'o'  # o
    $content = $content -replace [char]0x00D4, 'O'  # O
    $content = $content -replace [char]0x00D6, 'O'  # O
    
    # c cedille
    $content = $content -replace [char]0x00E7, 'c'  # c
    $content = $content -replace [char]0x00C7, 'C'  # C
    
    # Ligatures
    $content = $content -replace [char]0x0153, 'oe' # oe
    $content = $content -replace [char]0x00E6, 'ae' # ae
    $content = $content -replace [char]0x0152, 'OE' # OE
    $content = $content -replace [char]0x00C6, 'AE' # AE
    
    # Guillemets francais
    $content = $content -replace [char]0x00AB, '"'  # <<
    $content = $content -replace [char]0x00BB, '"'  # >>
    
    # Apostrophes typographiques
    $content = $content -replace [char]0x2018, "'"  # '
    $content = $content -replace [char]0x2019, "'"  # '
    $content = $content -replace [char]0x201C, '"'  # "
    $content = $content -replace [char]0x201D, '"'  # "
    
    # Points de suspension
    $content = $content -replace [char]0x2026, '...' # ...
    
    # Tirets longs
    $content = $content -replace [char]0x2014, '-'  # em dash
    $content = $content -replace [char]0x2013, '-'  # en dash
    
    # Espaces insecables
    $content = $content -replace [char]0x00A0, ' '  # nbsp
    
    # Degre
    $content = $content -replace [char]0x00B0, ' deg'  # degree
    
    # Middot / bullet
    $content = $content -replace [char]0x00B7, '-'  # middot
    $content = $content -replace [char]0x2022, '-'  # bullet
    
    # Emojis et symboles courants - remplacer par texte entre crochets
    # Fleches
    $content = $content -replace [char]0x2190, '[Back]'    # left arrow
    $content = $content -replace [char]0x2192, '[Next]'    # right arrow
    $content = $content -replace [char]0x2191, '[Up]'      # up arrow
    $content = $content -replace [char]0x2193, '[Down]'    # down arrow
    
    # Checkmarks
    $content = $content -replace [char]0x2713, '[Check]'   # checkmark
    $content = $content -replace [char]0x2714, '[Check]'   # heavy checkmark
    $content = $content -replace [char]0x2717, '[X]'       # ballot x
    $content = $content -replace [char]0x2718, '[X]'       # heavy ballot x
    
    # Divers symboles
    $content = $content -replace [char]0x00D7, 'x'  # multiplication
    $content = $content -replace [char]0x00F7, '/'  # division
    $content = $content -replace [char]0x2212, '-'  # minus sign
    $content = $content -replace [char]0x00B1, '+/-' # plus-minus
    
    # Supprimer les emojis (caracteres Unicode > U+1F000) en les remplacant par du texte
    # Emoji patterns - remplacer par du texte descriptif
    $content = $content -replace '\p{So}', ''  # Supprimer les symboles restants
    
    # Remplacer les sequences d'emojis connues
    $content = $content -replace '\uD83D[\uDC00-\uDFFF]', '[emoji]'  # Emoji range 1
    $content = $content -replace '\uD83E[\uDD00-\uDDFF]', '[emoji]'  # Emoji range 2
    $content = $content -replace '[\u2600-\u26FF]', '[symbol]'       # Misc symbols
    $content = $content -replace '[\u2700-\u27BF]', '[symbol]'       # Dingbats
    
    # Verifier si le fichier a ete modifie
    if ($content -ne $originalContent) {
        # Sauvegarder avec encodage UTF8 sans BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        
        $modifiedFiles += $file.FullName
        
        $relativePath = $file.FullName.Replace($srcPath, "src")
        Write-Host "[$counter/$totalFiles] Modifie: $relativePath" -ForegroundColor Green
    } else {
        $relativePath = $file.FullName.Replace($srcPath, "src")
        Write-Host "[$counter/$totalFiles] Inchange: $relativePath" -ForegroundColor DarkGray
    }
}

# Generer le rapport
$reportContent = @"
===========================================
RAPPORT DE CONVERSION ASCII
===========================================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Repertoire: $srcPath

STATISTIQUES:
- Fichiers analyses: $totalFiles
- Fichiers modifies: $($modifiedFiles.Count)

FICHIERS MODIFIES:
"@

$reportContent | Out-File -FilePath $logFile -Encoding UTF8

foreach ($f in $modifiedFiles) {
    "  - $f" | Out-File -FilePath $logFile -Encoding UTF8 -Append
}

Write-Host ""
Write-Host "=== CONVERSION TERMINEE ===" -ForegroundColor Cyan
Write-Host "Fichiers modifies: $($modifiedFiles.Count) / $totalFiles" -ForegroundColor Green
Write-Host "Rapport sauvegarde: $logFile" -ForegroundColor Yellow
