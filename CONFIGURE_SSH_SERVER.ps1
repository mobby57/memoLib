# Configuration SSH GitHub Actions - Version Simple
param([string]$ServerAddress, [string]$Username)

Write-Host "`n==============================================================" -ForegroundColor Cyan
Write-Host "  CONFIGURATION SSH POUR GITHUB ACTIONS" -ForegroundColor White
Write-Host "==============================================================`n" -ForegroundColor Cyan

# Vérifier la clé
$keyFile = Join-Path $env:USERPROFILE ".ssh\github_deploy.pub"
if (-not (Test-Path $keyFile)) {
    Write-Host "ERREUR: Clé publique introuvable!`n" -ForegroundColor Red
    Write-Host "Fichier attendu: $keyFile`n" -ForegroundColor Gray
    exit 1
}

Write-Host "OK - Clé trouvée: $keyFile`n" -ForegroundColor Green

# Demander les infos
if (-not $ServerAddress) {
    $ServerAddress = Read-Host "Adresse du serveur (IP ou domaine)"
}
if (-not $Username) {
    $Username = Read-Host "Utilisateur SSH"
}

if (-not $ServerAddress -or -not $Username) {
    Write-Host "`nERREUR: Informations manquantes`n" -ForegroundColor Red
    exit 1
}

Write-Host "`nRÉCAPITULATIF:" -ForegroundColor Yellow
Write-Host "- Serveur: $ServerAddress" -ForegroundColor Cyan
Write-Host "- User: $Username`n" -ForegroundColor Cyan

$confirm = Read-Host "Continuer? (O/N)"
if ($confirm -notmatch '^[OoYy]') {
    Write-Host "`nAnnulé.`n" -ForegroundColor Yellow
    exit 0
}

# Test connexion
Write-Host "`nÉTAPE 1: Test de connexion..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------" -ForegroundColor Gray

$sshCmd = "ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no ${Username}@${ServerAddress} echo test_ok"
Write-Host "Commande: $sshCmd" -ForegroundColor Gray

try {
    $output = Invoke-Expression $sshCmd 2>&1
    if ($output -match "test_ok") {
        Write-Host "OK - Connexion réussie`n" -ForegroundColor Green
    } else {
        Write-Host "ERREUR: Impossible de se connecter" -ForegroundColor Red
        Write-Host "Output: $output`n" -ForegroundColor Gray
        exit 1
    }
} catch {
    Write-Host "ERREUR: $($_.Exception.Message)`n" -ForegroundColor Red
    exit 1
}

# Copier la clé
Write-Host "ÉTAPE 2: Copie de la clé publique..." -ForegroundColor Cyan
Write-Host "--------------------------------------------------------------" -ForegroundColor Gray

$publicKey = Get-Content $keyFile

Write-Host "Clé: $($publicKey.Substring(0,50))..." -ForegroundColor Gray

# Méthode: copier la clé via cat |
$tempFile = Join-Path $env:TEMP "github_deploy_key.pub"
Copy-Item $keyFile $tempFile

Write-Host "`nEnvoi de la clé...`n" -ForegroundColor White

$cmd1 = "ssh ${Username}@${ServerAddress} `"mkdir -p .ssh`""
$cmd2 = "type `"$tempFile`" | ssh ${Username}@${ServerAddress} `"cat >> .ssh/authorized_keys`""
$cmd3 = "ssh ${Username}@${ServerAddress} `"chmod 700 .ssh; chmod 600 .ssh/authorized_keys`""

Write-Host "1. Création dossier .ssh..." -ForegroundColor Gray
Invoke-Expression $cmd1 | Out-Null

Write-Host "2. Ajout de la clé..." -ForegroundColor Gray
Invoke-Expression $cmd2 | Out-Null

Write-Host "3. Configuration permissions..." -ForegroundColor Gray
Invoke-Expression $cmd3 | Out-Null

Remove-Item $tempFile -Force

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nOK - Clé publique copiée avec succès!`n" -ForegroundColor Green
    
    # Test avec la clé
    Write-Host "ÉTAPE 3: Test avec la clé SSH..." -ForegroundColor Cyan
    Write-Host "--------------------------------------------------------------" -ForegroundColor Gray
    
    $privKeyFile = Join-Path $env:USERPROFILE ".ssh\github_deploy"
    $testKeyCmd = "ssh -i `"$privKeyFile`" -o StrictHostKeyChecking=no ${Username}@${ServerAddress} echo key_ok"
    
    Write-Host "Commande: $testKeyCmd" -ForegroundColor Gray
    
    $keyTest = Invoke-Expression $testKeyCmd 2>&1
    if ($keyTest -match "key_ok") {
        Write-Host "`nSUCCÈS! La clé SSH fonctionne!`n" -ForegroundColor Green
        
        Write-Host "==============================================================" -ForegroundColor Cyan
        Write-Host "  CONFIGURATION TERMINÉE" -ForegroundColor Green
        Write-Host "==============================================================`n" -ForegroundColor Cyan
        
        Write-Host "PROCHAINES ÉTAPES:" -ForegroundColor Yellow
        Write-Host "`n1. Ajouter dans GitHub Secrets:" -ForegroundColor White
        Write-Host "   https://github.com/mooby865/iapostemanager/settings/secrets/actions`n" -ForegroundColor Gray
        
        Write-Host "   Secret: SSH_PRIVATE_KEY" -ForegroundColor Cyan
        Write-Host "   Valeur: Contenu du fichier $privKeyFile" -ForegroundColor Gray
        Write-Host "   Pour afficher: Get-Content `"$privKeyFile`"`n" -ForegroundColor Gray
        
        Write-Host "   Secret: PRODUCTION_HOST" -ForegroundColor Cyan
        Write-Host "   Valeur: $ServerAddress`n" -ForegroundColor Gray
        
        Write-Host "   Secret: PRODUCTION_USER" -ForegroundColor Cyan
        Write-Host "   Valeur: $Username`n" -ForegroundColor Gray
        
        Write-Host "2. Tester la connexion:" -ForegroundColor White
        Write-Host "   ssh -i `"$privKeyFile`" ${Username}@${ServerAddress}`n" -ForegroundColor Gray
        
    } else {
        Write-Host "`nATTENTION: Clé copiée mais test échoué" -ForegroundColor Yellow
        Write-Host "Output: $keyTest`n" -ForegroundColor Gray
        Write-Host "Testez manuellement:" -ForegroundColor Yellow
        Write-Host "  ssh -i `"$privKeyFile`" ${Username}@${ServerAddress}`n" -ForegroundColor Cyan
    }
    
} else {
    Write-Host "`nERREUR lors de la copie de la clé`n" -ForegroundColor Red
}
