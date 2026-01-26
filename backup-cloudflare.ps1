# Backup Cloudflare Resources
# IA Poste Manager

param(
    [switch]$D1,
    [switch]$KV,
    [switch]$Pages,
    [switch]$All
)

$ErrorActionPreference = "Stop"
$ProjectName = "iapostemanager"
$BackupDir = "backups/cloudflare-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Output ""
Write-Output "========================================"
Write-Output "  BACKUP CLOUDFLARE"
Write-Output "========================================"
Write-Output ""

# Creer dossier backup
New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
Write-Output "[OK] Dossier backup: $BackupDir"
Write-Output ""

# ========================================
# Backup D1 Database
# ========================================
if ($D1 -or $All) {
    Write-Output "[1] Backup D1 Database..."
    Write-Output "----------------------------------------"
    
    try {
        # Lister les bases D1
        $databases = wrangler d1 list --json 2>$null | ConvertFrom-Json
        
        foreach ($db in $databases) {
            Write-Output "   [INFO] Backup: $($db.name)"
            
            $dbBackupDir = "$BackupDir/d1-$($db.name)"
            New-Item -ItemType Directory -Path $dbBackupDir -Force | Out-Null
            
            # Export schema
            wrangler d1 execute $db.name --command=".schema" --remote > "$dbBackupDir/schema.sql"
            
            # Export data (tables principales)
            $tables = @("User", "Client", "Dossier", "Document", "Message", "Invoice", "Notification")
            foreach ($table in $tables) {
                try {
                    wrangler d1 execute $db.name --command="SELECT * FROM $table;" --remote --json > "$dbBackupDir/$table.json"
                    Write-Output "      [OK] $table"
                } catch {
                    Write-Output "      [WARN] $table (non trouve)"
                }
            }
        }
        
        Write-Output "   [OK] Backup D1 termine"
        
    } catch {
        Write-Output "   [ERREUR] Backup D1: $_"
    }
    Write-Output ""
}

# ========================================
# Backup KV Namespace
# ========================================
if ($KV -or $All) {
    Write-Output "[2] Backup KV Namespace..."
    Write-Output "----------------------------------------"
    
    try {
        # Lister les namespaces KV
        $namespaces = wrangler kv:namespace list --json 2>$null | ConvertFrom-Json
        
        foreach ($ns in $namespaces) {
            Write-Output "   [INFO] Backup: $($ns.title)"
            
            $kvBackupDir = "$BackupDir/kv-$($ns.title)"
            New-Item -ItemType Directory -Path $kvBackupDir -Force | Out-Null
            
            # Lister les cles
            $keys = wrangler kv:key list --namespace-id=$($ns.id) --json 2>$null | ConvertFrom-Json
            
            # Sauvegarder info
            $keys | ConvertTo-Json | Out-File "$kvBackupDir/keys.json"
            
            # Sauvegarder quelques cles importantes
            $importantKeys = $keys | Select-Object -First 100
            foreach ($key in $importantKeys) {
                try {
                    $value = wrangler kv:key get $key.name --namespace-id=$($ns.id) 2>$null
                    @{ key = $key.name; value = $value } | ConvertTo-Json | Out-File "$kvBackupDir/key-$($key.name -replace '[^a-zA-Z0-9]', '_').json"
                } catch {
                    # Ignorer les erreurs silencieusement
                }
            }
            
            Write-Output "      [OK] $($keys.Count) cles sauvegardees"
        }
        
        Write-Output "   [OK] Backup KV termine"
        
    } catch {
        Write-Output "   [ERREUR] Backup KV: $_"
    }
    Write-Output ""
}

# ========================================
# Backup Pages Config
# ========================================
if ($Pages -or $All) {
    Write-Output "[3] Backup Pages Configuration..."
    Write-Output "----------------------------------------"
    
    try {
        $pagesBackupDir = "$BackupDir/pages"
        New-Item -ItemType Directory -Path $pagesBackupDir -Force | Out-Null
        
        # Sauvegarder wrangler.toml
        if (Test-Path "wrangler.toml") {
            Copy-Item "wrangler.toml" "$pagesBackupDir/wrangler.toml"
            Write-Output "   [OK] wrangler.toml"
        }
        
        # Lister les projets Pages
        $projects = wrangler pages project list 2>$null
        $projects | Out-File "$pagesBackupDir/projects.txt"
        Write-Output "   [OK] Liste projets"
        
        # Lister les domaines
        wrangler pages domain list --project-name=$ProjectName 2>$null | Out-File "$pagesBackupDir/domains.txt"
        Write-Output "   [OK] Liste domaines"
        
        Write-Output "   [OK] Backup Pages termine"
        
    } catch {
        Write-Output "   [ERREUR] Backup Pages: $_"
    }
    Write-Output ""
}

# ========================================
# Resume
# ========================================
Write-Output "========================================"
Write-Output "  BACKUP TERMINE"
Write-Output "========================================"
Write-Output ""
Write-Output "Dossier: $BackupDir"
Write-Output ""

# Lister le contenu
Get-ChildItem -Path $BackupDir -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Replace("$BackupDir\", "")
    if ($_.PSIsContainer) {
        Write-Output "  [DIR] $relativePath"
    } else {
        $sizeKB = [math]::Round($_.Length / 1KB, 2)
        Write-Output "  [FILE] $relativePath ($sizeKB KB)"
    }
}

Write-Output ""
Write-Output "[INFO] Pour restaurer, utilisez wrangler d1 execute avec les fichiers SQL"
