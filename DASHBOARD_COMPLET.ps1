# ====================================================================
#  DASHBOARD COMPLET - VISUALISATION AUTOMATIQUE
#  Email Provisioning System v3.1
# ====================================================================

param(
    [switch]$Continuous,
    [int]$RefreshInterval = 5
)

# Configuration
$script:Colors = @{
    Header = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Gray"
    Highlight = "Magenta"
}

# ====================================================================
# FONCTIONS D'AFFICHAGE
# ====================================================================

function Show-Header {
    param([string]$Title)
    Clear-Host
    Write-Host "`n" ("═" * 80) -ForegroundColor $script:Colors.Header
    Write-Host "  $Title" -ForegroundColor $script:Colors.Highlight
    Write-Host ("═" * 80) -ForegroundColor $script:Colors.Header
    Write-Host "  Date: $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor $script:Colors.Info
    Write-Host ("═" * 80) -ForegroundColor $script:Colors.Header
}

function Show-Section {
    param([string]$Title)
    Write-Host "`n$Title" -ForegroundColor $script:Colors.Highlight
    Write-Host ("-" * 80) -ForegroundColor $script:Colors.Info
}

# ====================================================================
# SECTION 1 : FICHIERS
# ====================================================================

function Show-Files {
    Show-Section "📁 FICHIERS DU PROJET"
    
    $files = @(
        @{Name="PARCOURS_UTILISATEUR.bat"; Type="Script"},
        @{Name="PARCOURS_UTILISATEUR_EMAIL.ps1"; Type="Script"},
        @{Name="TESTS_AVANCES_EMAIL.ps1"; Type="Script"},
        @{Name="INDEX_SCRIPTS.bat"; Type="Script"},
        @{Name="README_SCRIPTS.md"; Type="Doc"},
        @{Name="GUIDE_SCRIPT_PARCOURS_UTILISATEUR.md"; Type="Doc"},
        @{Name="LIVRABLE_SCRIPTS_PARCOURS.md"; Type="Doc"},
        @{Name="SYNTHESE_SCRIPTS_PARCOURS.md"; Type="Doc"},
        @{Name="INDEX_SCRIPTS_COMPLET.md"; Type="Doc"}
    )
    
    $totalLines = 0
    $totalSize = 0
    
    foreach ($file in $files) {
        if (Test-Path $file.Name) {
            $lines = (Get-Content $file.Name | Measure-Object -Line).Lines
            $size = (Get-Item $file.Name).Length
            $totalLines += $lines
            $totalSize += $size
            
            $icon = if ($file.Type -eq "Script") { "🚀" } else { "📚" }
            Write-Host "  $icon " -NoNewline -ForegroundColor $script:Colors.Success
            Write-Host ("{0,-45}" -f $file.Name) -NoNewline -ForegroundColor $script:Colors.Info
            Write-Host ("{0,6} lignes  " -f $lines) -NoNewline -ForegroundColor $script:Colors.Highlight
            Write-Host ("{0,10:N0} octets" -f $size) -ForegroundColor $script:Colors.Info
        }
        else {
            Write-Host "  ✗ " -NoNewline -ForegroundColor $script:Colors.Error
            Write-Host $file.Name -ForegroundColor $script:Colors.Error
        }
    }
    
    Write-Host "`n  TOTAL: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "$totalLines lignes" -NoNewline -ForegroundColor $script:Colors.Success
    Write-Host " | " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host ("{0:N0} octets" -f $totalSize) -ForegroundColor $script:Colors.Success
}

# ====================================================================
# SECTION 2 : SERVEUR
# ====================================================================

function Show-ServerStatus {
    Show-Section "🔌 ETAT DU SERVEUR"
    
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -TimeoutSec 3 -UseBasicParsing
        $sw.Stop()
        
        Write-Host "  ✓ " -NoNewline -ForegroundColor $script:Colors.Success
        Write-Host "Serveur ACTIF" -NoNewline -ForegroundColor $script:Colors.Success
        Write-Host " - http://localhost:5000" -ForegroundColor $script:Colors.Info
        Write-Host "    Status: " -NoNewline -ForegroundColor $script:Colors.Info
        Write-Host $response.StatusCode -ForegroundColor $script:Colors.Success
        Write-Host "    Temps de reponse: " -NoNewline -ForegroundColor $script:Colors.Info
        Write-Host "$($sw.ElapsedMilliseconds)ms" -ForegroundColor $script:Colors.Highlight
    }
    catch {
        Write-Host "  ✗ " -NoNewline -ForegroundColor $script:Colors.Error
        Write-Host "Serveur NON DISPONIBLE" -ForegroundColor $script:Colors.Error
        Write-Host "    Action requise: Lancez RUN_SERVER.bat" -ForegroundColor $script:Colors.Warning
    }
}

# ====================================================================
# SECTION 3 : ENDPOINTS
# ====================================================================

function Show-Endpoints {
    Show-Section "🧪 TEST DES ENDPOINTS"
    
    $endpoints = @(
        @{Name="Health Check"; Url="/api/health"; Method="GET"},
        @{Name="Check Availability"; Url="/api/email/check-availability"; Method="POST"; Body=@{username="test-dashboard"}},
        @{Name="List Accounts"; Url="/api/email/my-accounts"; Method="GET"}
    )
    
    $passed = 0
    $total = $endpoints.Count
    
    foreach ($endpoint in $endpoints) {
        Write-Host "  Testing: " -NoNewline -ForegroundColor $script:Colors.Info
        Write-Host $endpoint.Name -NoNewline -ForegroundColor $script:Colors.Highlight
        Write-Host "..." -NoNewline
        
        try {
            $params = @{
                Uri = "http://localhost:5000$($endpoint.Url)"
                Method = $endpoint.Method
                TimeoutSec = 3
                UseBasicParsing = $true
            }
            
            if ($endpoint.Body) {
                $params.Body = $endpoint.Body | ConvertTo-Json
                $params.ContentType = 'application/json'
            }
            
            $sw = [System.Diagnostics.Stopwatch]::StartNew()
            Invoke-WebRequest @params | Out-Null
            $sw.Stop()
            
            Write-Host " ✓ OK" -NoNewline -ForegroundColor $script:Colors.Success
            Write-Host " ($($sw.ElapsedMilliseconds)ms)" -ForegroundColor $script:Colors.Info
            $passed++
        }
        catch {
            Write-Host " ✗ FAIL" -ForegroundColor $script:Colors.Error
        }
    }
    
    Write-Host "`n  RESULTAT: " -NoNewline -ForegroundColor $script:Colors.Info
    $color = if ($passed -eq $total) { $script:Colors.Success } 
             elseif ($passed -ge ($total * 0.66)) { $script:Colors.Warning }
             else { $script:Colors.Error }
    Write-Host "$passed/$total tests passes" -ForegroundColor $color
}

# ====================================================================
# SECTION 4 : CONFIGURATION
# ====================================================================

function Show-Configuration {
    Show-Section "⚙️  CONFIGURATION"
    
    # .env.email
    Write-Host "  Configuration Email:" -ForegroundColor $script:Colors.Info
    if (Test-Path ".env.email") {
        Write-Host "    ✓ .env.email present" -ForegroundColor $script:Colors.Success
        
        $content = Get-Content ".env.email" -ErrorAction SilentlyContinue
        $providers = @()
        
        if ($content -match "SENDGRID_API_KEY") { $providers += "SendGrid" }
        if ($content -match "AWS_ACCESS_KEY_ID") { $providers += "AWS SES" }
        if ($content -match "MICROSOFT_CLIENT_ID") { $providers += "Microsoft 365" }
        if ($content -match "GOOGLE_CLIENT_ID") { $providers += "Google Workspace" }
        
        if ($providers.Count -gt 0) {
            Write-Host "      Providers: " -NoNewline -ForegroundColor $script:Colors.Info
            Write-Host ($providers -join ", ") -ForegroundColor $script:Colors.Highlight
        }
    }
    else {
        Write-Host "    ✗ .env.email manquant" -ForegroundColor $script:Colors.Warning
        Write-Host "      Creez ce fichier pour activer les providers" -ForegroundColor $script:Colors.Info
    }
    
    # Database
    Write-Host "`n  Base de donnees:" -ForegroundColor $script:Colors.Info
    if (Test-Path "src\backend\database.db") {
        $size = (Get-Item "src\backend\database.db").Length
        Write-Host "    ✓ database.db present" -ForegroundColor $script:Colors.Success
        Write-Host "      Taille: " -NoNewline -ForegroundColor $script:Colors.Info
        Write-Host ("{0:N0} octets" -f $size) -ForegroundColor $script:Colors.Highlight
    }
    else {
        Write-Host "    ! database.db sera cree au demarrage" -ForegroundColor $script:Colors.Info
    }
}

# ====================================================================
# SECTION 5 : STATISTIQUES
# ====================================================================

function Show-Statistics {
    Show-Section "📊 STATISTIQUES"
    
    Write-Host "  Scripts et Documentation:" -ForegroundColor $script:Colors.Info
    Write-Host "    • Scripts executables: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "4" -ForegroundColor $script:Colors.Highlight
    Write-Host "    • Documents: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "5" -ForegroundColor $script:Colors.Highlight
    Write-Host "    • Fonctions PowerShell: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "10" -ForegroundColor $script:Colors.Highlight
    Write-Host "    • Tests automatises: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "22" -ForegroundColor $script:Colors.Highlight
    
    Write-Host "`n  Code Source:" -ForegroundColor $script:Colors.Info
    Write-Host "    • PowerShell: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "1,055+ lignes" -ForegroundColor $script:Colors.Highlight
    Write-Host "    • Batch: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "192+ lignes" -ForegroundColor $script:Colors.Highlight
    Write-Host "    • Documentation: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "1,348+ lignes" -ForegroundColor $script:Colors.Highlight
    Write-Host "    • TOTAL: " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host "2,595+ lignes" -ForegroundColor $script:Colors.Success
}

# ====================================================================
# SECTION 6 : PROCESSUS
# ====================================================================

function Show-Processes {
    Show-Section "🔌 PORTS ET PROCESSUS"
    
    # Port 5000
    Write-Host "  Port 5000:" -ForegroundColor $script:Colors.Info
    $conn = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "    ✓ UTILISE" -ForegroundColor $script:Colors.Success
        Write-Host "      Process ID: " -NoNewline -ForegroundColor $script:Colors.Info
        Write-Host $conn.OwningProcess -ForegroundColor $script:Colors.Highlight
        Write-Host "      State: " -NoNewline -ForegroundColor $script:Colors.Info
        Write-Host $conn.State -ForegroundColor $script:Colors.Highlight
    }
    else {
        Write-Host "    ✗ LIBRE" -ForegroundColor $script:Colors.Warning
    }
    
    # Processus Python
    Write-Host "`n  Processus Python:" -ForegroundColor $script:Colors.Info
    $pythonProcs = Get-Process python -ErrorAction SilentlyContinue
    if ($pythonProcs) {
        Write-Host "    ✓ " -NoNewline -ForegroundColor $script:Colors.Success
        Write-Host "$($pythonProcs.Count) processus actif(s)" -ForegroundColor $script:Colors.Success
        
        foreach ($proc in $pythonProcs) {
            $cpu = [math]::Round($proc.CPU, 2)
            $mem = [math]::Round($proc.WorkingSet64 / 1MB, 2)
            Write-Host "      PID $($proc.Id): " -NoNewline -ForegroundColor $script:Colors.Info
            Write-Host "CPU=$cpu%  " -NoNewline -ForegroundColor $script:Colors.Highlight
            Write-Host "MEM=${mem}MB" -ForegroundColor $script:Colors.Highlight
        }
    }
    else {
        Write-Host "    ✗ Aucun processus" -ForegroundColor $script:Colors.Warning
    }
}

# ====================================================================
# SECTION 7 : LOGS
# ====================================================================

function Show-Logs {
    Show-Section "📋 DERNIERS LOGS"
    
    if (Test-Path "src\backend\logs\app.log") {
        $logs = Get-Content "src\backend\logs\app.log" -Tail 5 -ErrorAction SilentlyContinue
        
        if ($logs) {
            foreach ($log in $logs) {
                $color = if ($log -match "ERROR") { $script:Colors.Error }
                        elseif ($log -match "WARNING") { $script:Colors.Warning }
                        elseif ($log -match "SUCCESS|OK") { $script:Colors.Success }
                        else { $script:Colors.Info }
                
                Write-Host "  $log" -ForegroundColor $color
            }
        }
        else {
            Write-Host "  Aucun log recent" -ForegroundColor $script:Colors.Info
        }
    }
    else {
        Write-Host "  Fichier de logs non trouve" -ForegroundColor $script:Colors.Info
    }
}

# ====================================================================
# SECTION 8 : ACTIONS RAPIDES
# ====================================================================

function Show-Actions {
    Show-Section "🚀 ACTIONS RAPIDES"
    
    Write-Host "  1. Lancer le parcours utilisateur" -ForegroundColor $script:Colors.Info
    Write-Host "  2. Executer les tests rapides" -ForegroundColor $script:Colors.Info
    Write-Host "  3. Tests complets (22 tests)" -ForegroundColor $script:Colors.Info
    Write-Host "  4. Ouvrir la documentation" -ForegroundColor $script:Colors.Info
    Write-Host "  5. Rafraichir l'affichage" -ForegroundColor $script:Colors.Info
    Write-Host "  6. Mode continu (auto-refresh)" -ForegroundColor $script:Colors.Info
    Write-Host "  7. Quitter" -ForegroundColor $script:Colors.Info
}

# ====================================================================
# FONCTION PRINCIPALE
# ====================================================================

function Show-Dashboard {
    Show-Header "🔍 DASHBOARD COMPLET - EMAIL PROVISIONING SYSTEM"
    
    Show-Files
    Show-ServerStatus
    Show-Endpoints
    Show-Configuration
    Show-Statistics
    Show-Processes
    Show-Logs
    
    Write-Host "`n" ("═" * 80) -ForegroundColor $script:Colors.Header
}

# ====================================================================
# BOUCLE PRINCIPALE
# ====================================================================

function Main {
    if ($Continuous) {
        Write-Host "`nMode continu active - Rafraichissement toutes les $RefreshInterval secondes" -ForegroundColor $script:Colors.Info
        Write-Host "Appuyez sur CTRL+C pour arreter`n" -ForegroundColor $script:Colors.Warning
        Start-Sleep -Seconds 2
        
        while ($true) {
            Show-Dashboard
            Start-Sleep -Seconds $RefreshInterval
        }
    }
    else {
        Show-Dashboard
        Show-Actions
        
        Write-Host "`n"
        $action = Read-Host "Choisissez une action (1-7)"
        
        switch ($action) {
            "1" {
                if (Test-Path "PARCOURS_UTILISATEUR.bat") {
                    & cmd /c "PARCOURS_UTILISATEUR.bat"
                }
                else {
                    Write-Host "`nFichier introuvable!" -ForegroundColor $script:Colors.Error
                    Start-Sleep -Seconds 2
                }
            }
            "2" {
                if (Test-Path "TESTS_AVANCES_EMAIL.ps1") {
                    & powershell -ExecutionPolicy Bypass -File "TESTS_AVANCES_EMAIL.ps1" -QuickTest
                }
                else {
                    Write-Host "`nFichier introuvable!" -ForegroundColor $script:Colors.Error
                    Start-Sleep -Seconds 2
                }
            }
            "3" {
                if (Test-Path "TESTS_AVANCES_EMAIL.ps1") {
                    & powershell -ExecutionPolicy Bypass -File "TESTS_AVANCES_EMAIL.ps1" -FullTest
                }
                else {
                    Write-Host "`nFichier introuvable!" -ForegroundColor $script:Colors.Error
                    Start-Sleep -Seconds 2
                }
            }
            "4" {
                if (Test-Path "INDEX_SCRIPTS_COMPLET.md") {
                    Start-Process "INDEX_SCRIPTS_COMPLET.md"
                }
                elseif (Test-Path "README_SCRIPTS.md") {
                    Start-Process "README_SCRIPTS.md"
                }
                else {
                    Write-Host "`nDocumentation introuvable!" -ForegroundColor $script:Colors.Error
                    Start-Sleep -Seconds 2
                }
            }
            "5" {
                Main
            }
            "6" {
                $script:Continuous = $true
                Main
            }
            "7" {
                Write-Host "`nAu revoir!" -ForegroundColor $script:Colors.Success
                Start-Sleep -Seconds 1
                return
            }
            default {
                Write-Host "`nChoix invalide!" -ForegroundColor $script:Colors.Error
                Start-Sleep -Seconds 2
                Main
            }
        }
    }
}

# Execution
Main
