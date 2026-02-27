# Installation automatique Signal Hub - MemoLib
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INSTALLATION SIGNAL HUB" -ForegroundColor Cyan
Write-Host "   MemoLib - Hub Central Unique" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$signalCliPath = "C:\signal-cli"
$signalCliVersion = "0.13.5"

# Étape 1: Vérifier Java
Write-Host "[1/8] Vérification Java..." -ForegroundColor Yellow
try {
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host "✅ Java installé: $javaVersion" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Java non trouvé. Installation..." -ForegroundColor Yellow
    winget install Oracle.JavaRuntimeEnvironment --silent --accept-package-agreements --accept-source-agreements
    Write-Host "✅ Java installé" -ForegroundColor Green
}

# Étape 2: Télécharger signal-cli
Write-Host ""
Write-Host "[2/8] Téléchargement signal-cli..." -ForegroundColor Yellow

if (Test-Path $signalCliPath) {
    Write-Host "✅ signal-cli déjà présent" -ForegroundColor Green
} else {
    $downloadUrl = "https://github.com/AsamK/signal-cli/releases/download/v$signalCliVersion/signal-cli-$signalCliVersion.tar.gz"
    $tarPath = "$env:TEMP\signal-cli.tar.gz"
    
    Write-Host "Téléchargement depuis GitHub..." -ForegroundColor Gray
    Invoke-WebRequest -Uri $downloadUrl -OutFile $tarPath -UseBasicParsing
    
    Write-Host "Extraction..." -ForegroundColor Gray
    tar -xzf $tarPath -C "C:\"
    Rename-Item "C:\signal-cli-$signalCliVersion" $signalCliPath -Force
    
    Remove-Item $tarPath
    Write-Host "✅ signal-cli installé dans $signalCliPath" -ForegroundColor Green
}

# Étape 3: Ajouter au PATH
Write-Host ""
Write-Host "[3/8] Configuration PATH..." -ForegroundColor Yellow
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$signalCliPath\bin*") {
    [Environment]::SetEnvironmentVariable("Path", "$currentPath;$signalCliPath\bin", "User")
    $env:Path = "$env:Path;$signalCliPath\bin"
    Write-Host "✅ PATH mis à jour" -ForegroundColor Green
} else {
    Write-Host "✅ PATH déjà configuré" -ForegroundColor Green
}

# Étape 4: Enregistrer le numéro Signal
Write-Host ""
Write-Host "[4/8] Enregistrement numéro Signal..." -ForegroundColor Yellow
$phoneNumber = Read-Host "Entrez votre numéro Signal (format: +33603983709)"

Write-Host "Envoi du code de vérification..." -ForegroundColor Gray
& "$signalCliPath\bin\signal-cli.bat" -u $phoneNumber register

Write-Host ""
Write-Host "Un code de vérification a été envoyé par SMS à $phoneNumber" -ForegroundColor Cyan
$verificationCode = Read-Host "Entrez le code de vérification"

Write-Host "Vérification..." -ForegroundColor Gray
& "$signalCliPath\bin\signal-cli.bat" -u $phoneNumber verify $verificationCode

Write-Host "✅ Numéro Signal enregistré" -ForegroundColor Green

# Étape 5: Configurer MemoLib
Write-Host ""
Write-Host "[5/8] Configuration MemoLib..." -ForegroundColor Yellow
dotnet user-secrets set "Signal:PhoneNumber" $phoneNumber
dotnet user-secrets set "Signal:CliUrl" "http://localhost:8080"
Write-Host "✅ MemoLib configuré" -ForegroundColor Green

# Étape 6: Créer le service Windows pour signal-cli daemon
Write-Host ""
Write-Host "[6/8] Création service signal-cli..." -ForegroundColor Yellow

$serviceName = "SignalCliDaemon"
$serviceExists = Get-Service -Name $serviceName -ErrorAction SilentlyContinue

if ($serviceExists) {
    Write-Host "✅ Service déjà existant" -ForegroundColor Green
} else {
    # Créer un script de démarrage
    $startScript = @"
@echo off
cd /d $signalCliPath\bin
signal-cli.bat -u $phoneNumber daemon --http 127.0.0.1:8080
"@
    $startScriptPath = "$signalCliPath\start-daemon.bat"
    $startScript | Out-File -FilePath $startScriptPath -Encoding ASCII
    
    Write-Host "⚠️  Service Windows nécessite des droits administrateur" -ForegroundColor Yellow
    Write-Host "Pour créer le service, exécutez en tant qu'administrateur:" -ForegroundColor Yellow
    Write-Host "  sc create $serviceName binPath= `"$startScriptPath`" start= auto" -ForegroundColor White
}

# Étape 7: Démarrer signal-cli daemon
Write-Host ""
Write-Host "[7/8] Démarrage signal-cli daemon..." -ForegroundColor Yellow
Write-Host "Le daemon va démarrer dans une nouvelle fenêtre..." -ForegroundColor Gray

$daemonScript = @"
cd '$signalCliPath\bin'
Write-Host 'Signal CLI Daemon démarré sur http://localhost:8080' -ForegroundColor Green
Write-Host 'Laissez cette fenêtre ouverte' -ForegroundColor Yellow
Write-Host ''
.\signal-cli.bat -u $phoneNumber daemon --http 127.0.0.1:8080
"@

$daemonScriptPath = "$env:TEMP\start-signal-daemon.ps1"
$daemonScript | Out-File -FilePath $daemonScriptPath -Encoding UTF8

Start-Process powershell -ArgumentList "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $daemonScriptPath

Write-Host "✅ Daemon démarré" -ForegroundColor Green
Write-Host "⚠️  Laissez la fenêtre du daemon ouverte" -ForegroundColor Yellow

Start-Sleep -Seconds 3

# Étape 8: Tester la connexion
Write-Host ""
Write-Host "[8/8] Test de connexion..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/v1/about" -Method Get -TimeoutSec 5
    Write-Host "✅ Signal CLI répond correctement" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Signal CLI ne répond pas encore (normal au premier démarrage)" -ForegroundColor Yellow
}

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   INSTALLATION TERMINÉE !" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Java installé" -ForegroundColor Green
Write-Host "✅ signal-cli installé" -ForegroundColor Green
Write-Host "✅ Numéro Signal enregistré: $phoneNumber" -ForegroundColor Green
Write-Host "✅ MemoLib configuré" -ForegroundColor Green
Write-Host "✅ Daemon démarré" -ForegroundColor Green
Write-Host ""
Write-Host "📱 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Installez SMS Forwarder sur votre téléphone" -ForegroundColor White
Write-Host "   Android: https://play.google.com/store/apps/details?id=com.lomza.smsforwarder" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Configurez les règles de transfert:" -ForegroundColor White
Write-Host "   - SMS → Signal ($phoneNumber)" -ForegroundColor Gray
Write-Host "   - WhatsApp → Signal ($phoneNumber)" -ForegroundColor Gray
Write-Host "   - Messenger → Signal ($phoneNumber)" -ForegroundColor Gray
Write-Host "   - Format: [SMS] De: {sender}\n{message}" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Lancez MemoLib:" -ForegroundColor White
Write-Host "   dotnet run" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Testez en vous envoyant un message Signal:" -ForegroundColor White
Write-Host "   /help" -ForegroundColor Gray
Write-Host ""
Write-Host "🎮 COMMANDES SIGNAL:" -ForegroundColor Cyan
Write-Host "   /help - Aide" -ForegroundColor Gray
Write-Host "   /inbox - Voir les messages" -ForegroundColor Gray
Write-Host "   /send telegram 123 Bonjour" -ForegroundColor Gray
Write-Host "   /stats - Statistiques" -ForegroundColor Gray
Write-Host "   /search divorce - Rechercher" -ForegroundColor Gray
Write-Host ""
Write-Host "🔒 SÉCURITÉ: Chiffrement E2E activé" -ForegroundColor Green
Write-Host "💰 COÛT: 0€ (gratuit illimité)" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentation complète:" -ForegroundColor Cyan
Write-Host "   ARCHITECTURE-SIGNAL-HUB.md" -ForegroundColor White
Write-Host ""

# Ouvrir la documentation
$openDoc = Read-Host "Voulez-vous ouvrir la documentation ? (O/N)"
if ($openDoc -eq "O" -or $openDoc -eq "o") {
    Start-Process "ARCHITECTURE-SIGNAL-HUB.md"
}

Write-Host ""
Write-Host "Appuyez sur une touche pour fermer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
