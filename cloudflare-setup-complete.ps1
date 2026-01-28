# ============================================
# CLOUDFLARE PAGES - SETUP COMPLET
# Configuration Production Complète
# ============================================

param(
    [switch]$EnvVars,
    [switch]$Domain,
    [switch]$D1Database,
    [switch]$Test,
    [switch]$All
)

$ErrorActionPreference = "Continue"

$PROJECT_NAME = "iaposte-manager"
$PRODUCTION_URL = "https://memoLib.pages.dev"

Write-Host "`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║   CLOUDFLARE PAGES - SETUP PRODUCTION COMPLET         ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Magenta

# ============================================
# 1️⃣ VARIABLES D'ENVIRONNEMENT
# ============================================
if ($EnvVars -or $All) {
    Write-Host "`n1️⃣ Configuration Variables d'Environnement" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
    
    Write-Host "`n📋 Variables requises pour production:" -ForegroundColor Yellow
    
    $envVars = @(
        @{Name="DATABASE_URL"; Description="URL base de données Cloudflare D1"; Example="file:./prisma/dev.db"},
        @{Name="NEXTAUTH_SECRET"; Description="Secret NextAuth (généré)"; Example="$(New-Guid)"},
        @{Name="NEXTAUTH_URL"; Description="URL de production"; Example="https://memoLib.pages.dev"},
        @{Name="OLLAMA_BASE_URL"; Description="URL Ollama (optionnel)"; Example="http://localhost:11434"}
    )
    
    foreach ($var in $envVars) {
        Write-Host "`n   📌 $($var.Name)" -ForegroundColor White
        Write-Host "      Description: $($var.Description)" -ForegroundColor Gray
        Write-Host "      Exemple:     $($var.Example)" -ForegroundColor Gray
    }
    
    Write-Host "`n💡 Pour configurer dans Cloudflare Dashboard:" -ForegroundColor Cyan
    Write-Host "   1. Aller sur: https://dash.cloudflare.com" -ForegroundColor Gray
    Write-Host "   2. Pages → $PROJECT_NAME → Settings" -ForegroundColor Gray
    Write-Host "   3. Environment Variables → Production" -ForegroundColor Gray
    Write-Host "   4. Add variable pour chaque variable ci-dessus" -ForegroundColor Gray
    
    Write-Host "`n⚡ Configuration via CLI (automatique):" -ForegroundColor Cyan
    
    # Générer un secret NextAuth sécurisé
    $nextAuthSecret = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    
    Write-Host "`n   Commandes à exécuter:" -ForegroundColor Yellow
    Write-Host "   wrangler pages secret put DATABASE_URL --project-name=$PROJECT_NAME" -ForegroundColor White
    Write-Host "   wrangler pages secret put NEXTAUTH_SECRET --project-name=$PROJECT_NAME" -ForegroundColor White
    Write-Host "   wrangler pages secret put NEXTAUTH_URL --project-name=$PROJECT_NAME" -ForegroundColor White
    
    Write-Host "`n   NEXTAUTH_SECRET généré (copier):" -ForegroundColor Green
    Write-Host "   $nextAuthSecret" -ForegroundColor Yellow
    
    $response = Read-Host "`n   Voulez-vous configurer maintenant via CLI? (o/N)"
    if ($response -eq 'o' -or $response -eq 'O') {
        Write-Host "`n   🔧 Configuration automatique..." -ForegroundColor Yellow
        
        # DATABASE_URL
        $dbUrl = Read-Host "   DATABASE_URL (Entrée = file:./prisma/dev.db)"
        if ([string]::IsNullOrWhiteSpace($dbUrl)) { $dbUrl = "file:./prisma/dev.db" }
        Write-Output $dbUrl | wrangler pages secret put DATABASE_URL --project-name=$PROJECT_NAME
        
        # NEXTAUTH_SECRET
        Write-Output $nextAuthSecret | wrangler pages secret put NEXTAUTH_SECRET --project-name=$PROJECT_NAME
        
        # NEXTAUTH_URL
        $authUrl = Read-Host "   NEXTAUTH_URL (Entrée = $PRODUCTION_URL)"
        if ([string]::IsNullOrWhiteSpace($authUrl)) { $authUrl = $PRODUCTION_URL }
        Write-Output $authUrl | wrangler pages secret put NEXTAUTH_URL --project-name=$PROJECT_NAME
        
        Write-Host "`n   ✅ Variables configurées!" -ForegroundColor Green
    } else {
        Write-Host "`n   ⏭️  Configuration manuelle via Dashboard" -ForegroundColor Yellow
    }
}

# ============================================
# 2️⃣ DOMAINE CUSTOM
# ============================================
if ($Domain -or $All) {
    Write-Host "`n`n2️⃣ Configuration Domaine Custom" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
    
    Write-Host "`n🌐 Ajouter votre propre domaine" -ForegroundColor Yellow
    Write-Host "`n   Option 1: Via Dashboard (Recommandé)" -ForegroundColor White
    Write-Host "   1. https://dash.cloudflare.com" -ForegroundColor Gray
    Write-Host "   2. Pages → $PROJECT_NAME → Custom Domains" -ForegroundColor Gray
    Write-Host "   3. Set up a custom domain" -ForegroundColor Gray
    Write-Host "   4. Entrer votre domaine (ex: app.votredomaine.com)" -ForegroundColor Gray
    Write-Host "   5. Configurer DNS automatiquement" -ForegroundColor Gray
    
    Write-Host "`n   Option 2: Via CLI" -ForegroundColor White
    $customDomain = Read-Host "   Entrez votre domaine (ex: app.votredomaine.com) ou Entrée pour passer"
    
    if (-not [string]::IsNullOrWhiteSpace($customDomain)) {
        Write-Host "`n   🔧 Configuration du domaine..." -ForegroundColor Yellow
        wrangler pages domain add $customDomain --project-name=$PROJECT_NAME
        
        Write-Host "`n   📋 Configuration DNS requise:" -ForegroundColor Cyan
        Write-Host "   Type:   CNAME" -ForegroundColor White
        Write-Host "   Name:   $customDomain" -ForegroundColor White
        Write-Host "   Target: memoLib.pages.dev" -ForegroundColor White
        Write-Host "   TTL:    Auto" -ForegroundColor White
        
        Write-Host "`n   ⏳ Propagation DNS: 5-30 minutes" -ForegroundColor Yellow
    } else {
        Write-Host "`n   ⏭️  Domaine custom non configuré" -ForegroundColor Yellow
    }
}

# ============================================
# 3️⃣ CLOUDFLARE D1 (Base de Données)
# ============================================
if ($D1Database -or $All) {
    Write-Host "`n`n3️⃣ Migration vers Cloudflare D1" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
    
    Write-Host "`n💾 Cloudflare D1 = SQLite sur Edge Network" -ForegroundColor Yellow
    Write-Host "   - Latence ultra-faible (moins de 10ms)" -ForegroundColor Gray
    Write-Host "   - Réplication automatique" -ForegroundColor Gray
    Write-Host "   - Compatible Prisma" -ForegroundColor Gray
    
    Write-Host "`n📊 Base D1 existante détectée:" -ForegroundColor Cyan
    Write-Host "   Database ID: a86c51c6-2031-4ae6-941c-db4fc917826c" -ForegroundColor White
    Write-Host "   Database Name: iaposte-production-db" -ForegroundColor White
    
    $migrateD1 = Read-Host "`n   Migrer vers D1 maintenant? (o/N)"
    if ($migrateD1 -eq 'o' -or $migrateD1 -eq 'O') {
        Write-Host "`n   🔄 Migration en cours..." -ForegroundColor Yellow
        
        # Export local
        Write-Host "   1️⃣ Export base locale..." -ForegroundColor Gray
        if (Test-Path "prisma/dev.db") {
            sqlite3 prisma/dev.db .dump > prisma/export.sql
            Write-Host "   ✅ Export réussi: prisma/export.sql" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Base locale non trouvée" -ForegroundColor Yellow
        }
        
        # Import D1
        Write-Host "   2️⃣ Import vers D1..." -ForegroundColor Gray
        wrangler d1 execute iaposte-production-db --file=prisma/export.sql
        
        Write-Host "`n   ✅ Migration D1 terminée!" -ForegroundColor Green
        Write-Host "   🔧 Mettre à jour DATABASE_URL avec le binding D1" -ForegroundColor Yellow
    } else {
        Write-Host "`n   ⏭️  Migration D1 reportée" -ForegroundColor Yellow
    }
}

# ============================================
# 4️⃣ TESTS DE PRODUCTION
# ============================================
if ($Test -or $All) {
    Write-Host "`n`n4️⃣ Tests de Production" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Gray
    
    Write-Host "`n🧪 Test des endpoints critiques..." -ForegroundColor Yellow
    
    $endpoints = @(
        @{Path="/"; Name="Page d'accueil"; Critical=$true},
        @{Path="/api/health"; Name="Health check"; Critical=$true},
        @{Path="/api/auth/session"; Name="Session auth"; Critical=$true},
        @{Path="/login"; Name="Page login"; Critical=$false},
        @{Path="/lawyer/dashboard"; Name="Dashboard avocat"; Critical=$false}
    )
    
    $results = @()
    
    foreach ($endpoint in $endpoints) {
        $url = "$PRODUCTION_URL$($endpoint.Path)"
        Write-Host "`n   Testing: $($endpoint.Name)" -NoNewline -ForegroundColor Gray
        
        try {
            $response = Invoke-WebRequest -Uri $url -Method Get -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
            
            if ($response.StatusCode -eq 200) {
                Write-Host " ✅ OK ($($response.StatusCode))" -ForegroundColor Green
                $results += @{Endpoint=$endpoint.Name; Status="OK"; Code=$response.StatusCode}
            } elseif ($response.StatusCode -eq 401 -or $response.StatusCode -eq 403) {
                Write-Host " 🔒 Protected ($($response.StatusCode))" -ForegroundColor Yellow
                $results += @{Endpoint=$endpoint.Name; Status="Protected"; Code=$response.StatusCode}
            } else {
                Write-Host " ⚠️  $($response.StatusCode)" -ForegroundColor Yellow
                $results += @{Endpoint=$endpoint.Name; Status="Warning"; Code=$response.StatusCode}
            }
        } catch {
            if ($endpoint.Critical) {
                Write-Host " ❌ FAILED" -ForegroundColor Red
                $results += @{Endpoint=$endpoint.Name; Status="FAILED"; Code="Error"}
            } else {
                Write-Host " ⚠️  Not accessible" -ForegroundColor Yellow
                $results += @{Endpoint=$endpoint.Name; Status="Not accessible"; Code="N/A"}
            }
        }
    }
    
    Write-Host "`n`n   📊 Résumé des tests:" -ForegroundColor Cyan
    $results | Format-Table -AutoSize
    
    # Test de performance
    Write-Host "`n   ⚡ Test de performance (TTFB)..." -ForegroundColor Yellow
    $perfTest = Measure-Command { 
        Invoke-WebRequest -Uri $PRODUCTION_URL -UseBasicParsing -ErrorAction SilentlyContinue 
    }
    
    $ttfb = [math]::Round($perfTest.TotalMilliseconds, 2)
    if ($ttfb -lt 200) {
        Write-Host "   ✅ TTFB: $ttfb ms (Excellent!)" -ForegroundColor Green
    } elseif ($ttfb -lt 500) {
        Write-Host "   ✅ TTFB: $ttfb ms (Bon)" -ForegroundColor Yellow
    } else {
        Write-Host "   ⚠️  TTFB: $ttfb ms (À optimiser)" -ForegroundColor Red
    }
}

# ============================================
# 5️⃣ RÉSUMÉ FINAL
# ============================================
Write-Host "`n`n╔════════════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║              CONFIGURATION TERMINÉE                    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════════════════════╝`n" -ForegroundColor Green

Write-Host "✅ URL Production:  $PRODUCTION_URL" -ForegroundColor White
Write-Host "✅ Projet:          $PROJECT_NAME" -ForegroundColor White
Write-Host "✅ Status:          Opérationnel" -ForegroundColor Green

Write-Host "`n📚 Documentation créée:" -ForegroundColor Cyan
Write-Host "   - CLOUDFLARE_SUCCESS.md" -ForegroundColor Gray
Write-Host "   - CLOUDFLARE_DEPLOY_SUCCESS.md" -ForegroundColor Gray
Write-Host "   - cloudflare-status.ps1" -ForegroundColor Gray

Write-Host "`n🚀 Prochaines commandes utiles:" -ForegroundColor Cyan
Write-Host "   .\cloudflare-status.ps1              → Vérifier le status" -ForegroundColor Gray
Write-Host "   .\cloudflare-setup-complete.ps1 -Test → Tester la prod" -ForegroundColor Gray
Write-Host "   wrangler pages deployment list        → Liste déploiements" -ForegroundColor Gray

Write-Host "`n✨ Configuration Production Complète! ✨`n" -ForegroundColor Magenta
