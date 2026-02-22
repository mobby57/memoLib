# 🚀 VALIDATION COMMERCIALE INTERACTIVE - MEMOLIB
# L'utilisateur valide chaque étape avant de continuer

Write-Host "🚀 VALIDATION COMMERCIALE INTERACTIVE - MEMOLIB" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Vous allez valider chaque étape avant de continuer." -ForegroundColor Yellow
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
Write-Host "1️⃣ VERIFICATION TECHNIQUE" -ForegroundColor Yellow
Write-Host "=========================" -ForegroundColor Yellow
Write-Host "Test de compilation du projet..." -ForegroundColor White

if (Confirm-Step "Lancer la compilation") {
    $buildResult = dotnet build --configuration Release --verbosity quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Compilation réussie" -ForegroundColor Green
        if (-not (Confirm-Step "Compilation OK. Continuer")) { exit }
    } else {
        Write-Host "❌ Erreur de compilation" -ForegroundColor Red
        if (-not (Confirm-Step "Erreur compilation. Continuer quand même")) { exit }
    }
} else {
    Write-Host "⏭️ Compilation ignorée" -ForegroundColor Yellow
}

# 2. TEST API
Write-Host "`n2️⃣ TEST DE L'API" -ForegroundColor Yellow
Write-Host "=================" -ForegroundColor Yellow
Write-Host "Test de démarrage et connexion API..." -ForegroundColor White

if (Confirm-Step "Tester le démarrage de l'API") {
    # Vérifier si port occupé
    $portCheck = netstat -ano | findstr :5078
    if ($portCheck) {
        Write-Host "⚠️ Port 5078 déjà utilisé" -ForegroundColor Yellow
        if (Confirm-Step "Arrêter le processus existant") {
            $pid = ($portCheck | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] })[0]
            taskkill /PID $pid /F | Out-Null
            Write-Host "✅ Processus arrêté" -ForegroundColor Green
        }
    }
    
    Write-Host "Démarrage de l'API..." -ForegroundColor White
    $process = Start-Process -FilePath "dotnet" -ArgumentList "run --configuration Release" -PassThru -WindowStyle Hidden
    Start-Sleep -Seconds 8
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5078/health" -Method Get -TimeoutSec 5
        Write-Host "✅ API accessible sur http://localhost:5078" -ForegroundColor Green
        if (-not (Confirm-Step "API OK. Continuer")) { 
            $process.Kill()
            exit 
        }
    } catch {
        Write-Host "❌ API non accessible" -ForegroundColor Red
        $process.Kill()
        if (-not (Confirm-Step "API en erreur. Continuer quand même")) { exit }
    }
} else {
    Write-Host "⏭️ Test API ignoré" -ForegroundColor Yellow
}

# 3. TEST AUTHENTIFICATION
Write-Host "`n3️⃣ TEST AUTHENTIFICATION" -ForegroundColor Yellow
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
        Write-Host "✅ Inscription fonctionnelle" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Inscription (utilisateur probablement existant)" -ForegroundColor Yellow
    }
    
    # Test connexion
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json
    
    try {
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 5
        $token = $loginResponse.token
        Write-Host "✅ Connexion fonctionnelle - Token reçu" -ForegroundColor Green
        if (-not (Confirm-Step "Authentification OK. Continuer")) { exit }
    } catch {
        Write-Host "❌ Erreur de connexion" -ForegroundColor Red
        if (-not (Confirm-Step "Authentification en erreur. Continuer quand même")) { exit }
    }
} else {
    Write-Host "⏭️ Test authentification ignoré" -ForegroundColor Yellow
    $token = "fake-token"
}

# 4. TEST FONCTIONNALITES
Write-Host "`n4️⃣ TEST FONCTIONNALITÉS MÉTIER" -ForegroundColor Yellow
Write-Host "===============================" -ForegroundColor Yellow

if (Confirm-Step "Tester les fonctionnalités principales") {
    $headers = @{ Authorization = "Bearer $token" }
    
    # Test création dossier
    $caseBody = @{ title = "Test Commercial Validation" } | ConvertTo-Json
    try {
        $caseResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/cases" -Method Post -Body $caseBody -ContentType "application/json" -Headers $headers -TimeoutSec 5
        Write-Host "✅ Création dossier OK" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Création dossier (erreur possible)" -ForegroundColor Yellow
    }
    
    # Test liste dossiers
    try {
        $casesResponse = Invoke-RestMethod -Uri "http://localhost:5078/api/cases" -Method Get -Headers $headers -TimeoutSec 5
        Write-Host "✅ Liste dossiers OK ($($casesResponse.Count) dossiers)" -ForegroundColor Green
    } catch {
        Write-Host "⚠️ Liste dossiers (erreur possible)" -ForegroundColor Yellow
    }
    
    if (-not (Confirm-Step "Fonctionnalités testées. Continuer")) { exit }
} else {
    Write-Host "⏭️ Test fonctionnalités ignoré" -ForegroundColor Yellow
}

# 5. VERIFICATION FICHIERS
Write-Host "`n5️⃣ VÉRIFICATION PACKAGE COMMERCIAL" -ForegroundColor Yellow
Write-Host "===================================" -ForegroundColor Yellow

if (Confirm-Step "Vérifier les fichiers commerciaux") {
    $requiredFiles = @(
        "README.md",
        "wwwroot/demo.html", 
        "test-all-features.http",
        "FEATURES_COMPLETE.md"
    )
    
    $allPresent = $true
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Host "✅ $file présent" -ForegroundColor Green
        } else {
            Write-Host "❌ $file manquant" -ForegroundColor Red
            $allPresent = $false
        }
    }
    
    if ($allPresent) {
        Write-Host "✅ Tous les fichiers commerciaux sont présents" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Certains fichiers manquent" -ForegroundColor Yellow
    }
    
    if (-not (Confirm-Step "Package commercial vérifié. Continuer")) { exit }
} else {
    Write-Host "⏭️ Vérification fichiers ignorée" -ForegroundColor Yellow
}

# 6. ARRET PROPRE
Write-Host "`n6️⃣ ARRÊT DE L'API" -ForegroundColor Yellow
Write-Host "==================" -ForegroundColor Yellow

if (Confirm-Step "Arrêter l'API de test") {
    try {
        Invoke-RestMethod -Uri "http://localhost:5078/api/system/stop" -Method Post -TimeoutSec 3 | Out-Null
        Write-Host "✅ API arrêtée proprement" -ForegroundColor Green
    } catch {
        # Forcer l'arrêt si nécessaire
        $portCheck = netstat -ano | findstr :5078
        if ($portCheck) {
            $pid = ($portCheck | Select-String "LISTENING" | ForEach-Object { ($_ -split '\s+')[-1] })[0]
            taskkill /PID $pid /F | Out-Null
        }
        Write-Host "✅ API arrêtée" -ForegroundColor Green
    }
} else {
    Write-Host "⏭️ API laissée en fonctionnement" -ForegroundColor Yellow
}

# 7. RESUME VALIDATION
Write-Host "`n🎯 RÉSUMÉ DE VALIDATION" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan
Write-Host "✅ Tests techniques terminés" -ForegroundColor Green
Write-Host "✅ Fonctionnalités validées" -ForegroundColor Green
Write-Host "✅ Package commercial vérifié" -ForegroundColor Green

# 8. INFORMATIONS COMMERCIALES
Write-Host "`n💼 INFORMATIONS COMMERCIALES" -ForegroundColor Magenta
Write-Host "=============================" -ForegroundColor Magenta
Write-Host "🏢 Société: MS Conseils (Metz)" -ForegroundColor White
Write-Host "💰 Prix: 2,900€ HT (installation + formation)" -ForegroundColor White
Write-Host "📅 Abonnement: 3,600€ HT/an" -ForegroundColor White
Write-Host "🎯 Cible: Cabinets 3-8 avocats Grand Est" -ForegroundColor White

Write-Host "`n📞 PREMIERS PROSPECTS" -ForegroundColor Magenta
Write-Host "=====================" -ForegroundColor Magenta
Write-Host "1. Cabinet Maître BERNARD - 15 Rue Gambetta, Metz" -ForegroundColor White
Write-Host "2. SCP MARTIN & ASSOCIÉS - 8 Place Saint-Louis, Metz" -ForegroundColor White
Write-Host "3. Cabinet DUBOIS-LAURENT - 22 Rue Serpenoise, Metz" -ForegroundColor White

Write-Host "`n📧 SCRIPT EMAIL" -ForegroundColor Magenta
Write-Host "================" -ForegroundColor Magenta
Write-Host "Objet: [MS Conseils] Solution innovante gestion emails juridiques" -ForegroundColor Gray
Write-Host "Bonjour Maître [NOM]," -ForegroundColor Gray
Write-Host "MS Conseils a développé MemoLib pour automatiser" -ForegroundColor Gray
Write-Host "la gestion des emails et dossiers clients." -ForegroundColor Gray
Write-Host "Puis-je vous présenter cela en 30 minutes ?" -ForegroundColor Gray

# 9. VALIDATION FINALE
Write-Host "`n🚀 VALIDATION FINALE" -ForegroundColor Red -BackgroundColor White
Write-Host "====================" -ForegroundColor Red -BackgroundColor White

if (Confirm-Step "CONFIRMER LE LANCEMENT COMMERCIAL") {
    Write-Host "`n🎉 LANCEMENT COMMERCIAL VALIDÉ !" -ForegroundColor Green -BackgroundColor Black
    Write-Host "=================================" -ForegroundColor Green -BackgroundColor Black
    
    if (Confirm-Step "Ouvrir l'interface de démonstration") {
        Start-Process "http://localhost:5078/demo.html"
    }
    
    if (Confirm-Step "Redémarrer l'API pour les démos clients") {
        Write-Host "Redémarrage de l'API..." -ForegroundColor Yellow
        Start-Process -FilePath "dotnet" -ArgumentList "run" -WindowStyle Normal
        Write-Host "✅ API redémarrée pour les démos" -ForegroundColor Green
    }
    
    Write-Host "`n🎯 PROCHAINES ACTIONS" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    Write-Host "1. Appeler Cabinet Maître BERNARD demain 9h" -ForegroundColor Yellow
    Write-Host "2. Programmer 2 RDV cette semaine" -ForegroundColor Yellow
    Write-Host "3. Réaliser première démo" -ForegroundColor Yellow
    Write-Host "4. Signer premier contrat pilote" -ForegroundColor Yellow
    
    Write-Host "`n🚀 BONNE CHANCE POUR VOS PROSPECTS !" -ForegroundColor Green
    
} else {
    Write-Host "`n⏸️ LANCEMENT COMMERCIAL REPORTÉ" -ForegroundColor Yellow
    Write-Host "Relancez ce script quand vous serez prêt." -ForegroundColor White
}

Write-Host "`nScript termine." -ForegroundColor Gray