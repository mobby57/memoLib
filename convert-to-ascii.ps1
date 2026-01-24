# Script de conversion des caracteres non-ASCII en ASCII pur
# Pour les fichiers TypeScript/JavaScript du projet

$srcPath = "c:\Users\moros\Desktop\iaPostemanage\src"
$logFile = "c:\Users\moros\Desktop\iaPostemanage\ascii-conversion-report.txt"

# Mapping des caracteres accentues vers ASCII
$replacements = @{
    # Voyelles accentuees
    'e' = '[éèêë]'
    'a' = '[àâä]'
    'u' = '[ùûü]'
    'i' = '[îï]'
    'o' = '[ôö]'
    'c' = 'ç'
    'E' = '[ÉÈÊË]'
    'A' = '[ÀÂÄ]'
    'U' = '[ÙÛÜ]'
    'I' = '[ÎÏ]'
    'O' = '[ÔÖ]'
    'C' = 'Ç'
    
    # Ligatures
    'oe' = 'œ'
    'ae' = 'æ'
    'OE' = 'Œ'
    'AE' = 'Æ'
    
    # Guillemets et apostrophes
    '"' = '«'
    '"' = '»'
    "'" = '''
    "'" = '''
    
    # Ponctuation
    '...' = '…'
    '-' = '—'
    '-' = '–'
}

# Emojis courants -> texte descriptif
$emojiReplacements = @{
    '[Chart]' = '📊'
    '[Search]' = '🔍'
    '[Back]' = '←'
    '[+]' = '➕'
    '[OK]' = '✅'
    '[ERROR]' = '❌'
    '[Warning]' = '⚠️'
    '[Alert]' = '🚨'
    '[Info]' = 'ℹ️'
    '[User]' = '👤'
    '[Lock]' = '🔒'
    '[Chat]' = '💬'
    '[Folder]' = '📁'
    '[File]' = '📄'
    '[PDF]' = '📄'
    '[IMG]' = '🖼️'
    '[DOC]' = '📝'
    '[XLS]' = '📊'
    '[Clip]' = '📎'
    '[Mail]' = '📧'
    '[Calendar]' = '📅'
    '[Clock]' = '⏰'
    '[Star]' = '⭐'
    '[Check]' = '✓'
    '[X]' = '✗'
    '[Arrow]' = '→'
    '[Refresh]' = '🔄'
    '[Download]' = '📥'
    '[Upload]' = '📤'
    '[Play]' = '▶️'
    '[Pause]' = '⏸️'
    '[Settings]' = '⚙️'
    '[Home]' = '🏠'
    '[Bell]' = '🔔'
    '[Key]' = '🔑'
    '[Shield]' = '🛡️'
    '[Fire]' = '🔥'
    '[Sparkle]' = '✨'
    '[Rocket]' = '🚀'
    '[Money]' = '💰'
    '[Dollar]' = '💵'
    '[Euro]' = '💶'
    '[Credit]' = '💳'
    '[Phone]' = '📞'
    '[Globe]' = '🌍'
    '[Cloud]' = '☁️'
    '[Sun]' = '☀️'
    '[Moon]' = '🌙'
    '[Thumb]' = '👍'
    '[Heart]' = '❤️'
    '[Smile]' = '😊'
    '[Think]' = '🤔'
    '[Party]' = '🎉'
    '[Gift]' = '🎁'
    '[Bulb]' = '💡'
    '[Pencil]' = '✏️'
    '[Trash]' = '🗑️'
    '[Link]' = '🔗'
    '[Pin]' = '📌'
    '[Tag]' = '🏷️'
    '[Book]' = '📖'
    '[List]' = '📋'
    '[Eye]' = '👁️'
    '[Success]' = '✅'
    '[Fail]' = '❌'
}

$modifiedFiles = @()
$totalReplacements = 0

Write-Host "=== Conversion des fichiers en ASCII pur ===" -ForegroundColor Cyan
Write-Host "Repertoire source: $srcPath" -ForegroundColor Yellow
Write-Host ""

# Trouver tous les fichiers TypeScript/JavaScript avec caracteres non-ASCII
$files = Get-ChildItem -Path $srcPath -Recurse -Include *.ts,*.tsx,*.js,*.jsx | Where-Object {
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
    $fileReplacements = 0
    
    # Remplacer les emojis par du texte
    foreach ($replacement in $emojiReplacements.GetEnumerator()) {
        if ($content -match [regex]::Escape($replacement.Value)) {
            $content = $content -replace [regex]::Escape($replacement.Value), $replacement.Key
            $fileReplacements++
        }
    }
    
    # Remplacer les caracteres accentues
    # e accentue
    $content = $content -replace 'é', 'e'
    $content = $content -replace 'è', 'e'
    $content = $content -replace 'ê', 'e'
    $content = $content -replace 'ë', 'e'
    $content = $content -replace 'É', 'E'
    $content = $content -replace 'È', 'E'
    $content = $content -replace 'Ê', 'E'
    $content = $content -replace 'Ë', 'E'
    
    # a accentue
    $content = $content -replace 'à', 'a'
    $content = $content -replace 'â', 'a'
    $content = $content -replace 'ä', 'a'
    $content = $content -replace 'À', 'A'
    $content = $content -replace 'Â', 'A'
    $content = $content -replace 'Ä', 'A'
    
    # u accentue
    $content = $content -replace 'ù', 'u'
    $content = $content -replace 'û', 'u'
    $content = $content -replace 'ü', 'u'
    $content = $content -replace 'Ù', 'U'
    $content = $content -replace 'Û', 'U'
    $content = $content -replace 'Ü', 'U'
    
    # i accentue
    $content = $content -replace 'î', 'i'
    $content = $content -replace 'ï', 'i'
    $content = $content -replace 'Î', 'I'
    $content = $content -replace 'Ï', 'I'
    
    # o accentue
    $content = $content -replace 'ô', 'o'
    $content = $content -replace 'ö', 'o'
    $content = $content -replace 'Ô', 'O'
    $content = $content -replace 'Ö', 'O'
    
    # c cedille
    $content = $content -replace 'ç', 'c'
    $content = $content -replace 'Ç', 'C'
    
    # Ligatures
    $content = $content -replace 'œ', 'oe'
    $content = $content -replace 'æ', 'ae'
    $content = $content -replace 'Œ', 'OE'
    $content = $content -replace 'Æ', 'AE'
    
    # Guillemets francais
    $content = $content -replace '«', '"'
    $content = $content -replace '»', '"'
    
    # Apostrophes typographiques
    $content = $content -replace ''', "'"
    $content = $content -replace ''', "'"
    
    # Points de suspension
    $content = $content -replace '…', '...'
    
    # Tirets longs
    $content = $content -replace '—', '-'
    $content = $content -replace '–', '-'
    
    # Espaces insecables
    $content = $content -replace ' ', ' '
    
    # Degre
    $content = $content -replace '°', 'deg'
    
    # Verifier si le fichier a ete modifie
    if ($content -ne $originalContent) {
        # Sauvegarder avec encodage UTF8 sans BOM
        $utf8NoBom = New-Object System.Text.UTF8Encoding $false
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        
        $modifiedFiles += $file.FullName
        $totalReplacements++
        
        $relativePath = $file.FullName.Replace($srcPath, "src")
        Write-Host "[$counter/$totalFiles] Modifie: $relativePath" -ForegroundColor Green
    } else {
        $relativePath = $file.FullName.Replace($srcPath, "src")
        Write-Host "[$counter/$totalFiles] Inchange: $relativePath" -ForegroundColor DarkGray
    }
}

# Generer le rapport
$report = @"
===========================================
RAPPORT DE CONVERSION ASCII
===========================================
Date: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
Repertoire: $srcPath

STATISTIQUES:
- Fichiers analyses: $totalFiles
- Fichiers modifies: $($modifiedFiles.Count)

FICHIERS MODIFIES:
$($modifiedFiles | ForEach-Object { "  - $_" } | Out-String)

CARACTERES REMPLACES:
  e <- e, e, e, e (et majuscules)
  a <- a, a, a (et majuscules)
  u <- u, u, u (et majuscules)
  i <- i, i (et majuscules)
  o <- o, o (et majuscules)
  c <- c (et majuscule)
  oe <- oe
  ae <- ae
  " <- << >>
  ' <- typographic quotes
  ... <- ...
  - <- - -
  Emojis -> [Description]
===========================================
"@

$report | Out-File -FilePath $logFile -Encoding UTF8

Write-Host ""
Write-Host "=== CONVERSION TERMINEE ===" -ForegroundColor Cyan
Write-Host "Fichiers modifies: $($modifiedFiles.Count) / $totalFiles" -ForegroundColor Green
Write-Host "Rapport sauvegarde: $logFile" -ForegroundColor Yellow
