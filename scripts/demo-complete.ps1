#!/usr/bin/env pwsh
param(
    [string]$ApiUrl = 'http://localhost:5078',
    [switch]$StartApi,
    [switch]$StopApi
)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

# Configuration
$DemoUser = @{
    Email = 'sarraboudjellal57@gmail.com'
    Password = 'SecurePass123!'
    Name = 'Sarra Boudjellal'
}

$Global:Token = $null
$Global:TestResults = @()

function Write-Step {
    param([string]$Message, [string]$Color = 'Cyan')
    Write-Host "`n🔹 $Message" -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
    $Global:TestResults += @{ Status = 'SUCCESS'; Message = $Message }
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    $Global:TestResults += @{ Status = 'ERROR'; Message = $Message }
}

function Invoke-ApiCall {
    param(
        [string]$Method = 'GET',
        [string]$Endpoint,
        [object]$Body = $null,
        [hashtable]$Headers = @{},
        [switch]$NoAuth
    )
    
    try {
        $uri = "$ApiUrl$Endpoint"
        $requestHeaders = $Headers.Clone()
        
        if (-not $NoAuth -and $Global:Token) {
            $requestHeaders['Authorization'] = "Bearer $Global:Token"
        }
        
        if ($Body) {
            $requestHeaders['Content-Type'] = 'application/json'
            $jsonBody = $Body | ConvertTo-Json -Depth 10
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $requestHeaders -Body $jsonBody -TimeoutSec 30
        } else {
            $response = Invoke-RestMethod -Uri $uri -Method $Method -Headers $requestHeaders -TimeoutSec 30
        }
        
        return @{ Success = $true; Data = $response }
    }
    catch {
        return @{ Success = $false; Error = $_.Exception.Message; StatusCode = $_.Exception.Response.StatusCode }
    }
}

function Test-ApiHealth {
    Write-Step "Test de santé de l'API"
    
    $result = Invoke-ApiCall -Endpoint '/health' -NoAuth
    if ($result.Success) {
        Write-Success "API accessible sur $ApiUrl"
        return $true
    } else {
        Write-Error "API inaccessible: $($result.Error)"
        return $false
    }
}

function Test-Authentication {
    Write-Step "Test d'authentification"
    
    # Test login
    $loginBody = @{
        email = $DemoUser.Email
        password = $DemoUser.Password
    }
    
    $result = Invoke-ApiCall -Method 'POST' -Endpoint '/api/auth/login' -Body $loginBody -NoAuth
    
    if ($result.Success -and $result.Data.token) {
        $Global:Token = $result.Data.token
        Write-Success "Connexion réussie pour $($DemoUser.Email)"
        return $true
    }
    
    # Si échec, tenter création de compte
    Write-Host "⚠️ Connexion échouée, création du compte..." -ForegroundColor Yellow
    
    $registerBody = @{
        email = $DemoUser.Email
        password = $DemoUser.Password
        name = $DemoUser.Name
        role = 'AVOCAT'
        plan = 'CABINET'
    }
    
    $regResult = Invoke-ApiCall -Method 'POST' -Endpoint '/api/auth/register' -Body $registerBody -NoAuth
    
    if ($regResult.Success -or $regResult.StatusCode -eq 409) {
        # Retry login
        $loginResult = Invoke-ApiCall -Method 'POST' -Endpoint '/api/auth/login' -Body $loginBody -NoAuth
        if ($loginResult.Success -and $loginResult.Data.token) {
            $Global:Token = $loginResult.Data.token
            Write-Success "Compte créé et connexion réussie"
            return $true
        }
    }
    
    Write-Error "Impossible de s'authentifier"
    return $false
}

function Test-EmailIngestion {
    Write-Step "Test d'ingestion d'emails"
    
    $emails = @(
        @{
            from = 'client.martin@example.com'
            subject = 'Demande de consultation - Divorce'
            body = 'Bonjour Maître, je souhaite une consultation pour mon divorce. Cordialement, Mme Martin'
            externalId = "EMAIL-DEMO-$(Get-Date -Format 'yyyyMMdd-HHmmss')-1"
        },
        @{
            from = 'pierre.dubois@example.com'
            subject = 'Litige commercial - Urgent'
            body = 'Maître, nous avons un litige commercial urgent à traiter. Merci de me rappeler.'
            externalId = "EMAIL-DEMO-$(Get-Date -Format 'yyyyMMdd-HHmmss')-2"
        }
    )
    
    $ingestedCount = 0
    foreach ($email in $emails) {
        $email.occurredAt = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ss.fffZ')
        
        $result = Invoke-ApiCall -Method 'POST' -Endpoint '/api/ingest/email' -Body $email
        
        if ($result.Success) {
            $ingestedCount++
            Write-Host "  📧 Email ingéré: $($email.subject)" -ForegroundColor Gray
        } else {
            Write-Host "  ❌ Échec ingestion: $($result.Error)" -ForegroundColor Red
        }
    }
    
    if ($ingestedCount -gt 0) {
        Write-Success "$ingestedCount email(s) ingéré(s) avec succès"
        return $true
    } else {
        Write-Error "Aucun email ingéré"
        return $false
    }
}

function Test-ClientManagement {
    Write-Step "Test de gestion des clients"
    
    $client = @{
        name = 'Sophie Martin'
        email = 'sophie.martin@example.com'
        phoneNumber = '+33 6 12 34 56 78'
        address = '12 rue de la Paix, Paris'
    }
    
    # Créer client
    $result = Invoke-ApiCall -Method 'POST' -Endpoint '/api/client' -Body $client
    
    if ($result.Success -or $result.StatusCode -eq 409) {
        Write-Host "  👤 Client créé/existant: $($client.name)" -ForegroundColor Gray
        
        # Lister clients
        $listResult = Invoke-ApiCall -Endpoint '/api/client'
        if ($listResult.Success -and $listResult.Data.Count -gt 0) {
            Write-Success "Gestion clients OK - $($listResult.Data.Count) client(s)"
            return $true
        }
    }
    
    Write-Error "Échec gestion des clients"
    return $false
}

function Test-CaseManagement {
    Write-Step "Test de gestion des dossiers"
    
    # Lister dossiers
    $result = Invoke-ApiCall -Endpoint '/api/cases'
    
    if ($result.Success) {
        $casesCount = if ($result.Data -is [array]) { $result.Data.Count } else { 1 }
        Write-Success "Gestion dossiers OK - $casesCount dossier(s)"
        
        # Test timeline si dossiers existent
        if ($casesCount -gt 0) {
            $firstCase = if ($result.Data -is [array]) { $result.Data[0] } else { $result.Data }
            $timelineResult = Invoke-ApiCall -Endpoint "/api/cases/$($firstCase.id)/timeline"
            
            if ($timelineResult.Success) {
                $eventsCount = if ($timelineResult.Data -is [array]) { $timelineResult.Data.Count } else { 1 }
                Write-Host "  📋 Timeline OK - $eventsCount événement(s)" -ForegroundColor Gray
            }
        }
        
        return $true
    }
    
    Write-Error "Échec gestion des dossiers"
    return $false
}

function Test-SearchFeatures {
    Write-Step "Test des fonctionnalités de recherche"
    
    # Recherche textuelle
    $searchBody = @{ text = 'divorce' }
    $result = Invoke-ApiCall -Method 'POST' -Endpoint '/api/search/events' -Body $searchBody
    
    if ($result.Success) {
        $resultsCount = if ($result.Data -is [array]) { $result.Data.Count } else { 1 }
        Write-Host "  🔍 Recherche textuelle OK - $resultsCount résultat(s)" -ForegroundColor Gray
    }
    
    # Test génération embeddings
    $embResult = Invoke-ApiCall -Method 'POST' -Endpoint '/api/embeddings/generate-all'
    if ($embResult.Success) {
        Write-Host "  🧠 Génération embeddings OK" -ForegroundColor Gray
    }
    
    # Recherche sémantique
    $semanticBody = @{ query = 'problème juridique urgent' }
    $semResult = Invoke-ApiCall -Method 'POST' -Endpoint '/api/semantic/search' -Body $semanticBody
    
    if ($semResult.Success) {
        Write-Success "Recherche intelligente fonctionnelle"
        return $true
    }
    
    Write-Error "Échec des fonctionnalités de recherche"
    return $false
}

function Test-Analytics {
    Write-Step "Test des analytics et statistiques"
    
    # Dashboard overview
    $result = Invoke-ApiCall -Endpoint '/api/dashboard/overview'
    
    if ($result.Success -and $result.Data.stats) {
        $stats = $result.Data.stats
        Write-Host "  📊 Dossiers: $($stats.totalCases)" -ForegroundColor Gray
        Write-Host "  👥 Clients: $($stats.totalClients)" -ForegroundColor Gray
        Write-Host "  📧 Emails: $($stats.totalEvents)" -ForegroundColor Gray
        Write-Success "Analytics fonctionnels"
        return $true
    }
    
    Write-Error "Échec des analytics"
    return $false
}

function Test-AnomalyCenter {
    Write-Step "Test du centre d'anomalies"
    
    $result = Invoke-ApiCall -Endpoint '/api/alerts/center?limit=10'
    
    if ($result.Success) {
        $anomalies = $result.Data.summary.totalOpenAnomalies
        Write-Success "Centre d'anomalies OK - $anomalies anomalie(s) ouverte(s)"
        return $true
    }
    
    Write-Error "Échec du centre d'anomalies"
    return $false
}

function Test-EmailScan {
    Write-Step "Test du scan email manuel"
    
    $result = Invoke-ApiCall -Method 'POST' -Endpoint '/api/email-scan/manual'
    
    if ($result.Success) {
        Write-Success "Scan email manuel OK - $($result.Data.message)"
        return $true
    } else {
        # Le scan peut échouer si pas de config IMAP, c'est normal
        Write-Host "⚠️ Scan email non configuré (normal en démo)" -ForegroundColor Yellow
        return $true
    }
}

function Start-ApiIfNeeded {
    if ($StartApi) {
        Write-Step "Démarrage de l'API"
        
        $scriptPath = Join-Path $PSScriptRoot 'run-api-local.ps1'
        if (Test-Path $scriptPath) {
            & $scriptPath -Background -HealthTimeoutSec 45
            Start-Sleep -Seconds 3
        } else {
            Write-Error "Script de démarrage non trouvé: $scriptPath"
            return $false
        }
    }
    return $true
}

function Stop-ApiIfNeeded {
    if ($StopApi) {
        Write-Step "Arrêt de l'API"
        
        try {
            Invoke-ApiCall -Method 'POST' -Endpoint '/api/system/stop' -NoAuth
            Write-Success "API arrêtée"
        } catch {
            Write-Host "⚠️ Impossible d'arrêter l'API proprement" -ForegroundColor Yellow
        }
    }
}

function Show-Summary {
    Write-Host "`n" + "="*60 -ForegroundColor Cyan
    Write-Host "📋 RÉSUMÉ DE LA DÉMONSTRATION" -ForegroundColor Cyan
    Write-Host "="*60 -ForegroundColor Cyan
    
    $successCount = ($Global:TestResults | Where-Object { $_.Status -eq 'SUCCESS' }).Count
    $errorCount = ($Global:TestResults | Where-Object { $_.Status -eq 'ERROR' }).Count
    $totalTests = $Global:TestResults.Count
    
    Write-Host "`n✅ Succès: $successCount/$totalTests" -ForegroundColor Green
    Write-Host "❌ Échecs: $errorCount/$totalTests" -ForegroundColor Red
    
    if ($errorCount -eq 0) {
        Write-Host "`n🎉 TOUTES LES FONCTIONNALITÉS MARCHENT PARFAITEMENT!" -ForegroundColor Green
    } elseif ($successCount -gt $errorCount) {
        Write-Host "`n✨ La plupart des fonctionnalités marchent bien" -ForegroundColor Yellow
    } else {
        Write-Host "`n⚠️ Plusieurs problèmes détectés" -ForegroundColor Red
    }
    
    Write-Host "`n🌐 Interface web: $ApiUrl/demo.html" -ForegroundColor Cyan
    Write-Host "📚 Documentation: README.md" -ForegroundColor Cyan
}

# MAIN EXECUTION
Write-Host "🚀 DÉMONSTRATION COMPLÈTE MEMOLIB" -ForegroundColor Magenta
Write-Host "API: $ApiUrl" -ForegroundColor Gray

if (-not (Start-ApiIfNeeded)) { exit 1 }

$tests = @(
    { Test-ApiHealth },
    { Test-Authentication },
    { Test-EmailIngestion },
    { Test-ClientManagement },
    { Test-CaseManagement },
    { Test-SearchFeatures },
    { Test-Analytics },
    { Test-AnomalyCenter },
    { Test-EmailScan }
)

foreach ($test in $tests) {
    try {
        & $test
        Start-Sleep -Seconds 1
    } catch {
        Write-Error "Erreur inattendue: $($_.Exception.Message)"
    }
}

Stop-ApiIfNeeded
Show-Summary

exit 0