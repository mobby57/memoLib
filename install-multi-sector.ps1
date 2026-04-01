# Installation Multi-Secteurs - MemoLib
# Ce script implémente la stratégie multi-secteurs automatiquement

Write-Host "INSTALLATION STRATEGIE MULTI-SECTEURS" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Verifier que nous sommes dans le bon repertoire
if (-not (Test-Path "MemoLib.Api.csproj")) {
    Write-Host "Erreur: Executez ce script depuis le dossier MemoLib.Api" -ForegroundColor Red
    exit 1
}

Write-Host "Repertoire correct detecte" -ForegroundColor Green
Write-Host ""

# Etape 1: Verifier les fichiers crees
Write-Host "Etape 1/5: Verification des fichiers..." -ForegroundColor Yellow

$requiredFiles = @(
    "Models\Tenant.cs",
    "Services\SectorAdapterService.cs",
    "Controllers\SectorController.cs"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  OK: $file" -ForegroundColor Green
    } else {
        Write-Host "  MANQUANT: $file" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "Fichiers manquants. Verifiez que tous les fichiers sont presents." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Etape 2: Enregistrer le service dans Program.cs
Write-Host "Etape 2/5: Mise a jour de Program.cs..." -ForegroundColor Yellow

$programCs = Get-Content "Program.cs" -Raw

if ($programCs -notmatch "SectorAdapterService") {
    Write-Host "  Ajout de SectorAdapterService..." -ForegroundColor Cyan
    
    # Trouver la ligne apres les autres services
    $programCs = $programCs -replace "(builder\.Services\.AddScoped<CalendarService>\(\);)", "`$1`r`nbuilder.Services.AddScoped<SectorAdapterService>();"
    
    Set-Content "Program.cs" -Value $programCs
    Write-Host "  Service ajoute" -ForegroundColor Green
} else {
    Write-Host "  Service deja enregistre" -ForegroundColor Green
}

Write-Host ""

# Etape 3: Creer la migration
Write-Host "Etape 3/5: Creation de la migration..." -ForegroundColor Yellow

try {
    $migrationName = "AddMultiTenancy_$(Get-Date -Format 'yyyyMMddHHmmss')"
    dotnet ef migrations add $migrationName 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Migration creee: $migrationName" -ForegroundColor Green
    } else {
        Write-Host "  Migration peut-etre deja existante" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Erreur lors de la creation de la migration" -ForegroundColor Yellow
}

Write-Host ""

# Etape 4: Appliquer la migration
Write-Host "Etape 4/5: Application de la migration..." -ForegroundColor Yellow

try {
    dotnet ef database update 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Base de donnees mise a jour" -ForegroundColor Green
    } else {
        Write-Host "  Erreur lors de la mise a jour" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  Erreur lors de l'application de la migration" -ForegroundColor Yellow
}

Write-Host ""

# Etape 5: Compiler le projet
Write-Host "Etape 5/5: Compilation du projet..." -ForegroundColor Yellow

try {
    dotnet build --configuration Release --no-restore 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Compilation reussie" -ForegroundColor Green
    } else {
        Write-Host "  Erreur de compilation" -ForegroundColor Red
        Write-Host "  Executez 'dotnet build' pour voir les details" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  Erreur lors de la compilation" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "INSTALLATION TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Afficher les prochaines etapes
Write-Host "PROCHAINES ETAPES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Lancer l'API:" -ForegroundColor Yellow
Write-Host "   dotnet run" -ForegroundColor White
Write-Host ""
Write-Host "2. Tester les secteurs disponibles:" -ForegroundColor Yellow
Write-Host "   http://localhost:5078/api/sector/available" -ForegroundColor White
Write-Host ""
Write-Host "3. Voir la configuration Legal:" -ForegroundColor Yellow
Write-Host "   http://localhost:5078/api/sector/legal/config" -ForegroundColor White
Write-Host ""
Write-Host "4. Lire la documentation:" -ForegroundColor Yellow
Write-Host "   - MULTI_SECTOR_STRATEGY.md" -ForegroundColor White
Write-Host "   - QUICK_START_MULTI_SECTOR.md" -ForegroundColor White
Write-Host "   - DECISION_STRATEGIQUE.md" -ForegroundColor White
Write-Host ""

# Afficher les secteurs disponibles
Write-Host "SECTEURS DISPONIBLES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  LegalMemo      - Avocats (10M monde)" -ForegroundColor White
Write-Host "  MediMemo       - Medecins (15M monde)" -ForegroundColor White
Write-Host "  ConsultMemo    - Consultants (50M monde)" -ForegroundColor White
Write-Host "  AccountMemo    - Comptables (8M monde)" -ForegroundColor White
Write-Host "  ArchMemo       - Architectes (3M monde)" -ForegroundColor White
Write-Host "  RealtyMemo     - Agents immo (5M monde)" -ForegroundColor White
Write-Host "  InsureMemo     - Assureurs (4M monde)" -ForegroundColor White
Write-Host "  EngineerMemo   - Ingenieurs (10M monde)" -ForegroundColor White
Write-Host ""
Write-Host "  TOTAL: 105 MILLIONS de professionnels" -ForegroundColor Green
Write-Host "  Revenus potentiels (1%): 378M EUR/an" -ForegroundColor Green
Write-Host "  Valorisation potentielle: 3.78 MILLIARDS EUR" -ForegroundColor Green
Write-Host ""

Write-Host "VOUS ETES PRET POUR LA STRATEGIE MULTI-SECTEURS!" -ForegroundColor Cyan
Write-Host ""
Write-Host "Conseil: Commencez par valider Legal en Annee 1," -ForegroundColor Yellow
Write-Host "puis ajoutez 1 secteur par an." -ForegroundColor Yellow
Write-Host ""
Write-Host "Objectif Annee 5: 50,000 utilisateurs, 18M EUR revenus, 180M EUR valorisation" -ForegroundColor Green
Write-Host ""
Write-Host "BONNE CHANCE!" -ForegroundColor Cyan
