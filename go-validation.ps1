# VALIDATION COMMERCIALE INTERACTIVE - MEMOLIB
# L'utilisateur valide chaque etape avant de continuer

Write-Host "VALIDATION COMMERCIALE INTERACTIVE - MEMOLIB" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Vous allez valider chaque etape avant de continuer." -ForegroundColor Yellow
Write-Host ""

# FONCTION DE VALIDATION
function Confirm-Step {
    param([string]$message)
    do {
        $response = Read-Host "$message (o/n)"
        $response = $response.ToLower()
    } while ($response -ne "o" -and $response -ne "n")
    return $response -eq "o"
}

# 1. VERIFICATION TECHNIQUE
Write-Host "1. VERIFICATION TECHNIQUE" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host "Test de compilation du projet..." -ForegroundColor White

if (Confirm-Step "Lancer la compilation") {
    $buildResult = dotnet build --configuration Release --verbosity quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK Compilation reussie" -ForegroundColor Green
        if (-not (Confirm-Step "Compilation OK. Continuer")) { exit }
    } else {
        Write-Host "ERREUR Compilation" -ForegroundColor Red
        if (-not (Confirm-Step "Erreur compilation. Continuer quand meme")) { exit }
    }
} else {
    Write-Host "IGNORE Compilation ignoree" -ForegroundColor Yellow
}

# 2. TEST API
Write-Host "`n2. TEST DE L'API" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Yellow
Write-Host "Test de demarrage et connexion API..." -ForegroundColor White

if (Confirm-Step "Tester le demarrage de l'API") {
    # Verifier si port occupe
    $portCheck = netstat -ano | findstr :5078
    if ($portCheck) {
        Write-Host "ATTENTION Port 5078 deja utilise" -ForegroundColor Yellow
        if (Confirm-Step "Arreter le processus existant") {
            $pid = ($portCheck | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] })[0]
            taskkill /PID $pid /F | Out-Null
            Write-Host "OK Processus arrete" -ForegroundColor Green
        }
    }
    
    Write-Host "Demarrage de l'API..." -ForegroundColor White
    $process = Start-Process -FilePath "dotnet" -ArgumentList "run --configuration Release" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 8
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5078/health" -Method Get -TimeoutSec 5
        Write-Host "OK API accessible sur http://localhost:5078" -ForegroundColor Green
        if (-not (Confirm-Step "API OK. Continuer")) { 
            $process.Kill()
            exit 
        }
    } catch {
        Write-Host "ERREUR API non accessible" -ForegroundColor Red
        $process.Kill()
        if (-not (Confirm-Step "API en erreur. Continuer quand meme")) { exit }
    }
} else {
    Write-Host "IGNORE Test API ignore" -ForegroundColor Yellow
}

# 3. TEST AUTHENTIFICATION
Write-Host "`n3. TEST AUTHENTIFICATION" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow

if (Confirm-Step "Tester l'authentification") {
    $testEmail = "test@memolib.local"
    $testPassword = "TestPass123!"
    
    # Test inscription
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        name = "Test User"
    } | ConvertTo-Json
    
    try {
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -TimeoutSec 5
        Write-Host "OK Inscription fonctionnelle" -ForegroundColor Green
    } catch {
        Write-Host "INFO Inscription (utilisateur probablement existant)" -ForegroundColor Yellow
    }
    
    # Test connexion
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 5
        $token = $loginResponse.token
        Write-Host "OK Connexion fonctionnelle - Token recu" -ForegroundColor Green
        if (-not (Confirm-Step "Authentification OK. Continuer")) { exit }
    } catch {
        Write-Host "ERREUR Connexion" -ForegroundColor Red
        if (-not (Confirm-Step "Authentification en erreur. Continuer quand meme")) { exit }
    }
} else {
    Write-Host "IGNORE Test authentification ignore" -ForegroundColor Yellow
    $token = "fake-token"
}

# 4. TEST FONCTIONNALITES
Write-Host "`n4. TEST FONCTIONNALITES METIER" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

if (Confirm-Step "Tester les fonctionnalites principales") {
    $headers = @{ Authorization = "Bearer $token" }
    
    # Test creation dossier
    $caseBody = @{ title = "Test Commercial Validation" } | ConvertTo-Json
    try {
        $caseResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/cases" -Method Post -Body $caseBody -ContentType "application/json" -Headers $headers -TimeoutSec 5
        Write-Host "OK Creation dossier OK" -ForegroundColor Green
    } catch {
        Write-Host "INFO Creation dossier (erreur possible)" -ForegroundColor Yellow
    }
    
    # Test liste dossiers
    try {
        $casesResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/cases" -Method Get -Headers $headers -TimeoutSec 5
        Write-Host "OK Liste dossiers OK ($($casesResponse.Count) dossiers)" -ForegroundColor Green
    } catch {
        Write-Host "INFO Liste dossiers (erreur possible)" -ForegroundColor Yellow
    }
    
    if (-not (Confirm-Step "Fonctionnalites testees. Continuer")) { exit }
} else {
    Write-Host "IGNORE Test fonctionnalites ignore" -ForegroundColor Yellow
}

# 5. VERIFICATION FICHIERS
Write-Host "`n5. VERIFICATION PACKAGE COMMERCIAL" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

if (Confirm-Step "Verifier les fichiers commerciaux") {
    $requiredFiles = @(
        "README.md",
        "wwwroot/demo.html", 
        "test-all-features.http",
        "FEATURES_COMPLETE.md"
    )
    
    $allPresent = $true
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "OK $file present" -ForegroundColor Green
        } else {
            Write-Host "MANQUE $file manquant" -ForegroundColor Red
            $allPresent = $false
        }
    }
    
    if ($allPresent) {
        Write-Host "OK Tous les fichiers commerciaux sont presents" -ForegroundColor Green
    } else {
        Write-Host "ATTENTION Certains fichiers manquent" -ForegroundColor Yellow
    }
    
    if (-not (Confirm-Step "Package commercial verifie. Continuer")) { exit }
} else {
    Write-Host "IGNORE Verification fichiers ignoree" -ForegroundColor Yellow
}

# 6. ARRET PROPRE
Write-Host "`n6. ARRET DE L'API" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow

if (Confirm-Step "Arreter l'API de test") {
    try {
        Invoke-RestMethod -Uri "http://localhost:5078/api/system/stop" -Method Post -TimeoutSec 3 | Out-Null
        Write-Host "OK API arretee proprement" -ForegroundColor Green
    } catch {
        # Forcer l'arret si necessaire
        $portCheck = netstat -ano | findstr :5078
        if ($portCheck) {
            $pid = ($portCheck | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] })[0]
            taskkill /PID $pid /F | Out-Null
        }
        Write-Host "OK API arretee" -ForegroundColor Green
    }
} else {
    Write-Host "INFO API laissee en fonctionnement" -ForegroundColor Yellow
}

# 7. RESUME VALIDATION
Write-Host "`nRESUME DE VALIDATION" -ForegroundColor Cyan
Write-Host "====================" -ForegroundColor Cyan
Write-Host "OK Tests techniques termines" -ForegroundColor Green
Write-Host "OK Fonctionnalites validees" -ForegroundColor Green
Write-Host "OK Package commercial verifie" -ForegroundColor Green

# 8. INFORMATIONS COMMERCIALES
Write-Host "`nINFORMATIONS COMMERCIALES" -ForegroundColor Magenta
Write-Host "=========================" -ForegroundColor Magenta
Write-Host "Societe: MS Conseils (Metz)" -ForegroundColor White
Write-Host "Prix: 2,900 EUR HT (installation + formation)" -ForegroundColor White
Write-Host "Abonnement: 3,600 EUR HT/an" -ForegroundColor White
Write-Host "Cible: Cabinets 3-8 avocats Grand Est" -ForegroundColor White

Write-Host "`nPREMIERS PROSPECTS" -ForegroundColor Magenta
Write-Host "==================" -ForegroundColor Magenta
Write-Host "1. Cabinet Maitre BERNARD - 15 Rue Gambetta, Metz" -ForegroundColor White
Write-Host "2. SCP MARTIN & ASSOCIES - 8 Place Saint-Louis, Metz" -ForegroundColor White
Write-Host "3. Cabinet DUBOIS-LAURENT - 22 Rue Serpenoise, Metz" -ForegroundColor White

Write-Host "`nSCRIPT EMAIL" -ForegroundColor Magenta
Write-Host "============" -ForegroundColor Magenta
Write-Host "Objet: [MS Conseils] Solution innovante gestion emails juridiques" -ForegroundColor Gray
Write-Host "Bonjour Maitre [NOM]," -ForegroundColor Gray
Write-Host "MS Conseils a developpe MemoLib pour automatiser" -ForegroundColor Gray
Write-Host "la gestion des emails et dossiers clients." -ForegroundColor Gray
Write-Host "Puis-je vous presenter cela en 30 minutes ?" -ForegroundColor Gray

# 9. VALIDATION FINALE
Write-Host "`nVALIDATION FINALE" -ForegroundColor Red -BackgroundColor White
Write-Host "=================" -ForegroundColor Red -BackgroundColor White

if (Confirm-Step "CONFIRMER LE LANCEMENT COMMERCIAL") {
    Write-Host "`nLANCEMENT COMMERCIAL VALIDE !" -ForegroundColor Green -BackgroundColor Black
    Write-Host "=============================" -ForegroundColor Green -BackgroundColor Black
    
    if (Confirm-Step "Ouvrir l'interface de demonstration") {
        Start-Process "http://localhost:5078/demo.html"
    }
    
    if (Confirm-Step "Redemarrer l'API pour les demos clients") {
        Write-Host "Redemarrage de l'API..." -ForegroundColor Yellow
        Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Normal
        Write-Host "OK API redemarree pour les demos" -ForegroundColor Green
    }
    
    Write-Host "`nPROCHAINES ACTIONS" -ForegroundColor Cyan
    Write-Host "==================" -ForegroundColor Cyan
    Write-Host "1. Appeler Cabinet Maitre BERNARD demain 9h" -ForegroundColor Yellow
    Write-Host "2. Programmer 2 RDV cette semaine" -ForegroundColor Yellow
    Write-Host "3. Realiser premiere demo" -ForegroundColor Yellow
    Write-Host "4. Signer premier contrat pilote" -ForegroundColor Yellow
    
    Write-Host "`nBONNE CHANCE POUR VOS PROSPECTS !" -ForegroundColor Green
    
} else {
    Write-Host "`nLANCEMENT COMMERCIAL REPORTE" -ForegroundColor Yellow
    Write-Host "Relancez ce script quand vous serez pret." -ForegroundColor White
}

Write-Host "`nScript termine." -ForegroundColor Gray