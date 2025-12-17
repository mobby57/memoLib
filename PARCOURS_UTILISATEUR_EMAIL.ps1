# ====================================================================
#  PARCOURS UTILISATEUR COMPLET - EMAIL PROVISIONING CLOUD
#  Script d'automatisation pour iaPostemanage
# ====================================================================

param(
    [switch]$SkipServerCheck,
    [switch]$Verbose,
    [string]$Username = "",
    [string]$Provider = "sendgrid"
)

# Configuration
$script:BaseUrl = "http://localhost:5000"
$script:TestMode = $true
$script:Colors = @{
    Header = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Info = "Gray"
    Highlight = "Magenta"
}

# ====================================================================
# FONCTIONS UTILITAIRES
# ====================================================================

function Write-Header {
    param([string]$Title)
    Write-Host "`n" ("=" * 70) -ForegroundColor $script:Colors.Header
    Write-Host "  $Title" -ForegroundColor $script:Colors.Highlight
    Write-Host ("=" * 70) -ForegroundColor $script:Colors.Header
}

function Write-Step {
    param([string]$Message, [int]$Step, [int]$Total)
    Write-Host "`n[$Step/$Total] " -NoNewline -ForegroundColor $script:Colors.Highlight
    Write-Host $Message -ForegroundColor $script:Colors.Info
}

function Write-Success {
    param([string]$Message)
    Write-Host "  ✓ $Message" -ForegroundColor $script:Colors.Success
}

function Write-InfoLine {
    param([string]$Label, [string]$Value, [string]$Color = "Gray")
    Write-Host "    $Label " -NoNewline -ForegroundColor $script:Colors.Info
    Write-Host $Value -ForegroundColor $Color
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "  ✗ $Message" -ForegroundColor $script:Colors.Error
}

function Test-ServerHealth {
    Write-Host "`n[PREREQUIS] Verification du serveur..." -ForegroundColor $script:Colors.Info
    try {
        $health = Invoke-RestMethod -Uri "$script:BaseUrl/api/health" -TimeoutSec 5
        Write-Success "Serveur actif et operationnel"
        return $true
    }
    catch {
        Write-ErrorMsg "Serveur non disponible"
        Write-Host "`n  Action requise:" -ForegroundColor $script:Colors.Warning
        Write-Host "    1. Ouvrez un nouveau terminal" -ForegroundColor $script:Colors.Info
        Write-Host "    2. Executez: " -NoNewline -ForegroundColor $script:Colors.Info
        Write-Host ".\RUN_SERVER.bat" -ForegroundColor $script:Colors.Highlight
        Write-Host "    3. Relancez ce script`n" -ForegroundColor $script:Colors.Info
        return $false
    }
}

# ====================================================================
# ETAPE 1: VERIFICATION DE DISPONIBILITE
# ====================================================================

function Test-EmailAvailability {
    param([string]$Username)
    
    Write-Step "Verification de la disponibilite de l'email" 1 6
    
    $body = @{username = $Username} | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/check-availability" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $body `
            -TimeoutSec 10
        
        Write-Success "Verification reussie"
        Write-InfoLine "Email demande:" $result.email "Cyan"
        Write-InfoLine "Disponible:" $result.available $(if($result.available){"Green"}else{"Yellow"})
        
        if ($result.suggestions -and $result.suggestions.Count -gt 0) {
            Write-InfoLine "Suggestions:" ($result.suggestions -join ", ") "Yellow"
        }
        
        return $result
    }
    catch {
        Write-ErrorMsg "Echec de la verification: $($_.Exception.Message)"
        return $null
    }
}

# ====================================================================
# ETAPE 2: CREATION DU COMPTE EMAIL
# ====================================================================

function New-EmailAccount {
    param(
        [string]$Username,
        [string]$Provider,
        [string]$DisplayName = "",
        [string]$Description = ""
    )
    
    Write-Step "Creation du compte email" 2 6
    
    if ([string]::IsNullOrEmpty($DisplayName)) {
        $DisplayName = $Username.Substring(0,1).ToUpper() + $Username.Substring(1)
    }
    
    $body = @{
        username = $Username
        provider = $Provider
        display_name = $DisplayName
        description = $Description
    } | ConvertTo-Json
    
    Write-Host "    Configuration:" -ForegroundColor $script:Colors.Info
    Write-InfoLine "  Username:" $Username
    Write-InfoLine "  Provider:" $Provider
    Write-InfoLine "  Nom d'affichage:" $DisplayName
    
    try {
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/create" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $body `
            -TimeoutSec 15
        
        Write-Success "Compte cree avec succes!"
        Write-InfoLine "Email:" $result.email "Green"
        Write-InfoLine "Status:" $result.status "Green"
        Write-InfoLine "ID:" $result.account_id
        
        if ($result.smtp_username) {
            Write-InfoLine "SMTP Username:" $result.smtp_username
        }
        
        return $result
    }
    catch {
        Write-ErrorMsg "Echec de la creation: $($_.Exception.Message)"
        
        if ($_.Exception.Message -like "*API key*" -or $_.Exception.Message -like "*credentials*") {
            Write-Host "`n    Configuration manquante:" -ForegroundColor $script:Colors.Warning
            Write-Host "      1. Creez un fichier .env.email" -ForegroundColor $script:Colors.Info
            Write-Host "      2. Ajoutez vos cles API (voir DEMARRAGE_RAPIDE_EMAIL_CLOUD.md)" -ForegroundColor $script:Colors.Info
            Write-Host "      3. Relancez le serveur`n" -ForegroundColor $script:Colors.Info
        }
        
        return $null
    }
}

# ====================================================================
# ETAPE 3: LISTE DES COMPTES
# ====================================================================

function Get-MyEmailAccounts {
    Write-Step "Liste de vos comptes emails" 3 6
    
    try {
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/my-accounts" `
            -Method GET `
            -TimeoutSec 10
        
        Write-Success "Comptes recuperes"
        Write-InfoLine "Total:" $result.accounts.Count "Cyan"
        
        if ($result.accounts.Count -gt 0) {
            Write-Host "`n    Vos comptes:" -ForegroundColor $script:Colors.Info
            foreach ($account in $result.accounts) {
                Write-Host "`n      " ("-" * 50) -ForegroundColor $script:Colors.Info
                Write-InfoLine "    Email:" $account.email "Green"
                Write-InfoLine "    Provider:" $account.provider
                Write-InfoLine "    Status:" $account.status $(if($account.status -eq "active"){"Green"}else{"Yellow"})
                Write-InfoLine "    Cree le:" $account.created_at
                if ($account.display_name) {
                    Write-InfoLine "    Nom:" $account.display_name
                }
            }
            Write-Host "      " ("-" * 50) -ForegroundColor $script:Colors.Info
        }
        else {
            Write-Host "    Aucun compte pour le moment" -ForegroundColor $script:Colors.Info
        }
        
        return $result
    }
    catch {
        Write-ErrorMsg "Echec de la recuperation: $($_.Exception.Message)"
        return $null
    }
}

# ====================================================================
# ETAPE 4: ENVOI D'EMAIL TEST
# ====================================================================

function Send-TestEmail {
    param(
        [string]$FromEmail,
        [string]$ToEmail,
        [string]$Subject = "Test depuis iaPostemanage",
        [string]$Body = "Ceci est un email de test automatique."
    )
    
    Write-Step "Envoi d'un email de test" 4 6
    
    $emailBody = @{
        from = $FromEmail
        to = $ToEmail
        subject = $Subject
        body = $Body
    } | ConvertTo-Json
    
    Write-InfoLine "De:" $FromEmail
    Write-InfoLine "A:" $ToEmail
    Write-InfoLine "Sujet:" $Subject
    
    try {
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/send" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $emailBody `
            -TimeoutSec 15
        
        Write-Success "Email envoye avec succes!"
        if ($result.message_id) {
            Write-InfoLine "Message ID:" $result.message_id
        }
        
        return $result
    }
    catch {
        Write-ErrorMsg "Echec de l'envoi: $($_.Exception.Message)"
        Write-Host "    Note: L'envoi d'email necessite une configuration complete du provider" -ForegroundColor $script:Colors.Warning
        return $null
    }
}

# ====================================================================
# ETAPE 5: STATISTIQUES
# ====================================================================

function Get-EmailStats {
    Write-Step "Statistiques d'utilisation" 5 6
    
    try {
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/stats" `
            -Method GET `
            -TimeoutSec 10
        
        Write-Success "Statistiques recuperees"
        Write-Host "`n    Vos statistiques:" -ForegroundColor $script:Colors.Info
        Write-InfoLine "  Total comptes:" $result.total_accounts "Cyan"
        Write-InfoLine "  Comptes actifs:" $result.active_accounts "Green"
        Write-InfoLine "  Emails envoyes:" $result.emails_sent
        Write-InfoLine "  Emails recus:" $result.emails_received
        
        if ($result.providers) {
            Write-Host "`n    Par provider:" -ForegroundColor $script:Colors.Info
            foreach ($provider in $result.providers.PSObject.Properties) {
                Write-InfoLine "    $($provider.Name):" $provider.Value
            }
        }
        
        return $result
    }
    catch {
        Write-Host "    Statistiques non disponibles (endpoint optionnel)" -ForegroundColor $script:Colors.Warning
        return $null
    }
}

# ====================================================================
# ETAPE 6: VALIDATION FINALE
# ====================================================================

function Test-SystemValidation {
    Write-Step "Validation complete du systeme" 6 6
    
    $tests = @()
    
    # Test 1: Health check
    Write-Host "`n    Test 1: Health check..." -ForegroundColor $script:Colors.Info
    try {
        $health = Invoke-RestMethod -Uri "$script:BaseUrl/api/health" -TimeoutSec 5
        Write-Success "Health check OK"
        $tests += $true
    }
    catch {
        Write-ErrorMsg "Health check failed"
        $tests += $false
    }
    
    # Test 2: Check availability endpoint
    Write-Host "`n    Test 2: Endpoint check-availability..." -ForegroundColor $script:Colors.Info
    try {
        $body = @{username='validation-test'} | ConvertTo-Json
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/check-availability" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $body `
            -TimeoutSec 5
        Write-Success "Endpoint check-availability OK"
        $tests += $true
    }
    catch {
        Write-ErrorMsg "Endpoint check-availability failed"
        $tests += $false
    }
    
    # Test 3: List accounts endpoint
    Write-Host "`n    Test 3: Endpoint my-accounts..." -ForegroundColor $script:Colors.Info
    try {
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/my-accounts" `
            -Method GET `
            -TimeoutSec 5
        Write-Success "Endpoint my-accounts OK"
        $tests += $true
    }
    catch {
        Write-ErrorMsg "Endpoint my-accounts failed"
        $tests += $false
    }
    
    # Test 4: Special characters
    Write-Host "`n    Test 4: Caracteres speciaux..." -ForegroundColor $script:Colors.Info
    try {
        $body = @{username='test-user_2025'} | ConvertTo-Json
        $result = Invoke-RestMethod `
            -Uri "$script:BaseUrl/api/email/check-availability" `
            -Method POST `
            -ContentType 'application/json' `
            -Body $body `
            -TimeoutSec 5
        Write-Success "Support caracteres speciaux OK"
        $tests += $true
    }
    catch {
        Write-ErrorMsg "Support caracteres speciaux failed"
        $tests += $false
    }
    
    $passed = ($tests | Where-Object {$_}).Count
    $total = $tests.Count
    
    Write-Host "`n    " ("-" * 50) -ForegroundColor $script:Colors.Info
    Write-Host "    RESULTAT: $passed/$total tests reussis" -ForegroundColor $(
        if ($passed -eq $total) { $script:Colors.Success }
        elseif ($passed -ge ($total * 0.75)) { $script:Colors.Warning }
        else { $script:Colors.Error }
    )
    Write-Host "    " ("-" * 50) -ForegroundColor $script:Colors.Info
    
    return @{
        passed = $passed
        total = $total
        success = ($passed -eq $total)
    }
}

# ====================================================================
# PARCOURS INTERACTIF
# ====================================================================

function Start-InteractiveJourney {
    Write-Header "PARCOURS UTILISATEUR INTERACTIF"
    
    Write-Host "`nCe script va vous guider a travers:" -ForegroundColor $script:Colors.Info
    Write-Host "  1. Verification de disponibilite d'email" -ForegroundColor $script:Colors.Info
    Write-Host "  2. Creation d'un compte email" -ForegroundColor $script:Colors.Info
    Write-Host "  3. Liste de vos comptes" -ForegroundColor $script:Colors.Info
    Write-Host "  4. Envoi d'email de test (optionnel)" -ForegroundColor $script:Colors.Info
    Write-Host "  5. Statistiques d'utilisation" -ForegroundColor $script:Colors.Info
    Write-Host "  6. Validation du systeme" -ForegroundColor $script:Colors.Info
    
    Write-Host "`nAppuyez sur ENTREE pour commencer..." -ForegroundColor $script:Colors.Highlight
    Read-Host
    
    # Etape 1: Disponibilite
    $username = Read-Host "`nEntrez le nom d'utilisateur desire (ex: contact, support, info)"
    if ([string]::IsNullOrWhiteSpace($username)) {
        $username = "contact"
        Write-Host "Utilisation du nom par defaut: $username" -ForegroundColor $script:Colors.Info
    }
    
    $availability = Test-EmailAvailability -Username $username
    
    if (-not $availability) {
        Write-Host "`nImpossible de continuer sans verification de disponibilite" -ForegroundColor $script:Colors.Error
        return
    }
    
    if (-not $availability.available) {
        Write-Host "`nCe nom d'utilisateur n'est pas disponible." -ForegroundColor $script:Colors.Warning
        $continue = Read-Host "Voulez-vous continuer quand meme? (o/N)"
        if ($continue -ne "o" -and $continue -ne "O") {
            return
        }
    }
    
    # Etape 2: Creation
    Write-Host "`n" -NoNewline
    $create = Read-Host "Voulez-vous creer ce compte maintenant? (O/n)"
    
    $newAccount = $null
    if ($create -ne "n" -and $create -ne "N") {
        $provider = Read-Host "`nProvider a utiliser (sendgrid/aws/microsoft/google) [sendgrid]"
        if ([string]::IsNullOrWhiteSpace($provider)) {
            $provider = "sendgrid"
        }
        
        $displayName = Read-Host "Nom d'affichage [laisser vide pour auto]"
        $description = Read-Host "Description [optionnel]"
        
        $newAccount = New-EmailAccount `
            -Username $username `
            -Provider $provider `
            -DisplayName $displayName `
            -Description $description
    }
    
    # Etape 3: Liste des comptes
    Write-Host "`nAppuyez sur ENTREE pour voir vos comptes..." -ForegroundColor $script:Colors.Highlight
    Read-Host
    
    $accounts = Get-MyEmailAccounts
    
    # Etape 4: Envoi test (optionnel)
    if ($newAccount -and $newAccount.email) {
        Write-Host "`n" -NoNewline
        $sendTest = Read-Host "Voulez-vous envoyer un email de test? (o/N)"
        
        if ($sendTest -eq "o" -or $sendTest -eq "O") {
            $toEmail = Read-Host "Email destinataire"
            if (-not [string]::IsNullOrWhiteSpace($toEmail)) {
                Send-TestEmail -FromEmail $newAccount.email -ToEmail $toEmail
            }
        }
    }
    
    # Etape 5: Statistiques
    Write-Host "`nAppuyez sur ENTREE pour voir les statistiques..." -ForegroundColor $script:Colors.Highlight
    Read-Host
    
    Get-EmailStats
    
    # Etape 6: Validation
    Write-Host "`nAppuyez sur ENTREE pour valider le systeme..." -ForegroundColor $script:Colors.Highlight
    Read-Host
    
    $validation = Test-SystemValidation
    
    # Resultat final
    Write-Header "PARCOURS TERMINE"
    
    if ($validation.success) {
        Write-Host "`n  SUCCES COMPLET!" -ForegroundColor $script:Colors.Success
        Write-Host "  Le systeme de provisioning d'emails est pleinement operationnel." -ForegroundColor $script:Colors.Success
        Write-Host "`n  Prochaines etapes:" -ForegroundColor $script:Colors.Info
        Write-Host "    1. Configurez vos cles API (voir DEMARRAGE_RAPIDE_EMAIL_CLOUD.md)" -ForegroundColor $script:Colors.Info
        Write-Host "    2. Integrez le composant React dans votre frontend" -ForegroundColor $script:Colors.Info
        Write-Host "    3. Configurez votre domaine personnalise" -ForegroundColor $script:Colors.Info
    }
    else {
        Write-Host "`n  PARCOURS PARTIEL" -ForegroundColor $script:Colors.Warning
        Write-Host "  Certains tests ont echoue. Consultez les logs ci-dessus." -ForegroundColor $script:Colors.Warning
    }
    
    Write-Host "`n  Documentation complete:" -ForegroundColor $script:Colors.Info
    Write-Host "    - DEMARRAGE_RAPIDE_EMAIL_CLOUD.md" -ForegroundColor $script:Colors.Highlight
    Write-Host "    - RECAPITULATIF_EMAIL_CLOUD.md" -ForegroundColor $script:Colors.Highlight
    Write-Host "    - GUIDE_PRODUCTION_COMPLET.md (Section 8)" -ForegroundColor $script:Colors.Highlight
    Write-Host ""
}

# ====================================================================
# PARCOURS AUTOMATIQUE
# ====================================================================

function Start-AutomaticJourney {
    param(
        [string]$Username,
        [string]$Provider
    )
    
    Write-Header "PARCOURS UTILISATEUR AUTOMATIQUE"
    
    Write-Host "`nExecution automatique avec:" -ForegroundColor $script:Colors.Info
    Write-InfoLine "Username:" $Username "Cyan"
    Write-InfoLine "Provider:" $Provider "Cyan"
    Write-Host ""
    
    Start-Sleep -Seconds 2
    
    # Etape 1
    $availability = Test-EmailAvailability -Username $Username
    if (-not $availability) { return }
    Start-Sleep -Seconds 1
    
    # Etape 2
    if ($availability.available) {
        $newAccount = New-EmailAccount `
            -Username $Username `
            -Provider $Provider `
            -DisplayName ($Username.Substring(0,1).ToUpper() + $Username.Substring(1)) `
            -Description "Compte cree automatiquement via script"
        Start-Sleep -Seconds 1
    }
    
    # Etape 3
    Get-MyEmailAccounts | Out-Null
    Start-Sleep -Seconds 1
    
    # Etape 5
    Get-EmailStats | Out-Null
    Start-Sleep -Seconds 1
    
    # Etape 6
    $validation = Test-SystemValidation
    
    # Resultat
    Write-Header "RESULTAT FINAL"
    
    if ($validation.success) {
        Write-Host "`n  PARCOURS REUSSI!" -ForegroundColor $script:Colors.Success
        Write-Host "  Tous les tests sont passes avec succes.`n" -ForegroundColor $script:Colors.Success
    }
    else {
        Write-Host "`n  PARCOURS INCOMPLET" -ForegroundColor $script:Colors.Warning
        Write-Host "  $($validation.passed)/$($validation.total) tests reussis`n" -ForegroundColor $script:Colors.Warning
    }
}

# ====================================================================
# POINT D'ENTREE PRINCIPAL
# ====================================================================

function Main {
    Clear-Host
    
    Write-Host @"

    ╔═══════════════════════════════════════════════════════════════╗
    ║                                                               ║
    ║         PARCOURS UTILISATEUR - EMAIL PROVISIONING             ║
    ║                    iaPostemanage v3.1                         ║
    ║                                                               ║
    ╚═══════════════════════════════════════════════════════════════╝

"@ -ForegroundColor $script:Colors.Cyan
    
    # Verification serveur
    if (-not $SkipServerCheck) {
        if (-not (Test-ServerHealth)) {
            return
        }
    }
    
    # Mode automatique ou interactif
    if (-not [string]::IsNullOrWhiteSpace($Username)) {
        Start-AutomaticJourney -Username $Username -Provider $Provider
    }
    else {
        Start-InteractiveJourney
    }
}

# Execution
Main
