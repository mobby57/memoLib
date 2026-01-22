# Configuration automatique Stripe pour IA Poste Manager
# Auteur: GitHub Copilot
# Date: 21 janvier 2026

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION STRIPE COMPLETE" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour demander une confirmation
function Get-Confirmation {
    param([string]$Message)
    $response = Read-Host "$Message (o/n)"
    return $response -eq "o" -or $response -eq "O" -or $response -eq "oui"
}

# Fonction pour vérifier si .env.local existe
function Test-EnvFile {
    if (-not (Test-Path ".env.local")) {
        Write-Host "[!] Fichier .env.local manquant" -ForegroundColor Yellow
        if (Test-Path ".env.local.example") {
            Write-Host "[i] Copie de .env.local.example vers .env.local..." -ForegroundColor Cyan
            Copy-Item ".env.local.example" ".env.local"
            Write-Host "[OK] Fichier .env.local cree" -ForegroundColor Green
        } else {
            Write-Host "[ERREUR] Fichier .env.local.example manquant" -ForegroundColor Red
            exit 1
        }
    }
}

# Fonction pour ajouter/mettre à jour une variable dans .env.local
function Set-EnvVariable {
    param(
        [string]$Key,
        [string]$Value
    )
    
    $envContent = Get-Content ".env.local" -Raw
    
    if ($envContent -match "$Key=") {
        # Mettre à jour
        $envContent = $envContent -replace "(?m)^$Key=.*$", "$Key=$Value"
        Write-Host "[OK] $Key mis a jour" -ForegroundColor Green
    } else {
        # Ajouter
        $envContent += "`n$Key=$Value"
        Write-Host "[OK] $Key ajoute" -ForegroundColor Green
    }
    
    Set-Content ".env.local" $envContent -NoNewline
}

# ============================================
# ÉTAPE 1 : Vérifications préalables
# ============================================

Write-Host "[1/6] Verifications prealables..." -ForegroundColor Yellow
Write-Host ""

# Vérifier .env.local
Test-EnvFile

# Vérifier Node.js
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] Node.js non installe" -ForegroundColor Red
    exit 1
}

# Vérifier npm
try {
    $npmVersion = npm --version
    Write-Host "[OK] npm version: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERREUR] npm non installe" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# ÉTAPE 2 : Installation SDK Stripe
# ============================================

Write-Host "[2/6] Installation SDK Stripe..." -ForegroundColor Yellow
Write-Host ""

if (Get-Confirmation "Installer Stripe SDK (npm install stripe @stripe/stripe-js)?") {
    Write-Host "[i] Installation en cours..." -ForegroundColor Cyan
    npm install stripe @stripe/stripe-js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Stripe SDK installe avec succes" -ForegroundColor Green
    } else {
        Write-Host "[ERREUR] Echec installation Stripe SDK" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "[i] Installation Stripe SDK ignoree" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# ÉTAPE 3 : Configuration clés API Stripe
# ============================================

Write-Host "[3/6] Configuration cles API Stripe..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Connectez-vous a votre compte Stripe :" -ForegroundColor Cyan
Write-Host "https://dashboard.stripe.com/test/apikeys" -ForegroundColor Blue
Write-Host ""

if (Get-Confirmation "Avez-vous vos cles API Stripe?") {
    Write-Host ""
    
    # Clé secrète
    $secretKey = Read-Host "Cle secrete (sk_test_...)"
    if ($secretKey -and $secretKey.StartsWith("sk_test_")) {
        Set-EnvVariable "STRIPE_SECRET_KEY" $secretKey
    } else {
        Write-Host "[ERREUR] Cle secrete invalide (doit commencer par sk_test_)" -ForegroundColor Red
    }
    
    # Clé publiable
    $publishableKey = Read-Host "Cle publiable (pk_test_...)"
    if ($publishableKey -and $publishableKey.StartsWith("pk_test_")) {
        Set-EnvVariable "STRIPE_PUBLISHABLE_KEY" $publishableKey
    } else {
        Write-Host "[ERREUR] Cle publiable invalide (doit commencer par pk_test_)" -ForegroundColor Red
    }
    
    Write-Host ""
} else {
    Write-Host "[!] Configuration cles API ignoree" -ForegroundColor Yellow
    Write-Host "[!] Ajoutez manuellement dans .env.local :" -ForegroundColor Yellow
    Write-Host "    STRIPE_SECRET_KEY=sk_test_..." -ForegroundColor Gray
    Write-Host "    STRIPE_PUBLISHABLE_KEY=pk_test_..." -ForegroundColor Gray
}

Write-Host ""

# ============================================
# ÉTAPE 4 : Création produits/prix dans Stripe
# ============================================

Write-Host "[4/6] Creation produits et prix dans Stripe..." -ForegroundColor Yellow
Write-Host ""

if (Get-Confirmation "Executer le script de synchronisation Stripe (npx tsx scripts/sync-stripe-plans.ts)?") {
    Write-Host "[i] Synchronisation en cours..." -ForegroundColor Cyan
    Write-Host ""
    
    npx tsx scripts/sync-stripe-plans.ts
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "[OK] Produits et prix crees dans Stripe" -ForegroundColor Green
        Write-Host ""
        Write-Host "[i] IMPORTANT : Copiez les Price IDs affiches ci-dessus" -ForegroundColor Yellow
        Write-Host ""
        
        if (Get-Confirmation "Voulez-vous entrer les Price IDs maintenant?") {
            Write-Host ""
            
            # SOLO
            Write-Host "--- Plan SOLO ---" -ForegroundColor Cyan
            $soloMonthly = Read-Host "Price ID mensuel SOLO (price_...)"
            if ($soloMonthly -and $soloMonthly.StartsWith("price_")) {
                Set-EnvVariable "STRIPE_PRICE_SOLO_MONTHLY" $soloMonthly
            }
            
            $soloYearly = Read-Host "Price ID annuel SOLO (price_...)"
            if ($soloYearly -and $soloYearly.StartsWith("price_")) {
                Set-EnvVariable "STRIPE_PRICE_SOLO_YEARLY" $soloYearly
            }
            
            # CABINET
            Write-Host ""
            Write-Host "--- Plan CABINET ---" -ForegroundColor Cyan
            $cabinetMonthly = Read-Host "Price ID mensuel CABINET (price_...)"
            if ($cabinetMonthly -and $cabinetMonthly.StartsWith("price_")) {
                Set-EnvVariable "STRIPE_PRICE_CABINET_MONTHLY" $cabinetMonthly
            }
            
            $cabinetYearly = Read-Host "Price ID annuel CABINET (price_...)"
            if ($cabinetYearly -and $cabinetYearly.StartsWith("price_")) {
                Set-EnvVariable "STRIPE_PRICE_CABINET_YEARLY" $cabinetYearly
            }
            
            # ENTERPRISE
            Write-Host ""
            Write-Host "--- Plan ENTERPRISE ---" -ForegroundColor Cyan
            $enterpriseMonthly = Read-Host "Price ID mensuel ENTERPRISE (price_...)"
            if ($enterpriseMonthly -and $enterpriseMonthly.StartsWith("price_")) {
                Set-EnvVariable "STRIPE_PRICE_ENTERPRISE_MONTHLY" $enterpriseMonthly
            }
            
            $enterpriseYearly = Read-Host "Price ID annuel ENTERPRISE (price_...)"
            if ($enterpriseYearly -and $enterpriseYearly.StartsWith("price_")) {
                Set-EnvVariable "STRIPE_PRICE_ENTERPRISE_YEARLY" $enterpriseYearly
            }
            
            Write-Host ""
        }
    } else {
        Write-Host "[ERREUR] Echec synchronisation Stripe" -ForegroundColor Red
    }
} else {
    Write-Host "[!] Synchronisation Stripe ignoree" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# ÉTAPE 5 : Configuration webhook Stripe
# ============================================

Write-Host "[5/6] Configuration webhook Stripe..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Options pour webhook :" -ForegroundColor Cyan
Write-Host "  1. Stripe CLI (developpement local)" -ForegroundColor Gray
Write-Host "  2. Webhook production (URL publique)" -ForegroundColor Gray
Write-Host ""

$webhookChoice = Read-Host "Choix (1 ou 2)"

if ($webhookChoice -eq "1") {
    Write-Host ""
    Write-Host "[i] Configuration webhook local avec Stripe CLI" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Etapes :" -ForegroundColor Yellow
    Write-Host "  1. Installer Stripe CLI : https://stripe.com/docs/stripe-cli" -ForegroundColor Gray
    Write-Host "  2. Executer : stripe login" -ForegroundColor Gray
    Write-Host "  3. Executer : stripe listen --forward-to localhost:3000/api/webhooks/stripe" -ForegroundColor Gray
    Write-Host "  4. Copier le webhook secret (whsec_...) affiche" -ForegroundColor Gray
    Write-Host ""
    
    if (Get-Confirmation "Avez-vous le webhook secret?") {
        $webhookSecret = Read-Host "Webhook secret (whsec_...)"
        if ($webhookSecret -and $webhookSecret.StartsWith("whsec_")) {
            Set-EnvVariable "STRIPE_WEBHOOK_SECRET" $webhookSecret
        } else {
            Write-Host "[ERREUR] Webhook secret invalide (doit commencer par whsec_)" -ForegroundColor Red
        }
    }
} elseif ($webhookChoice -eq "2") {
    Write-Host ""
    Write-Host "[i] Configuration webhook production" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Etapes :" -ForegroundColor Yellow
    Write-Host "  1. Aller sur : https://dashboard.stripe.com/test/webhooks" -ForegroundColor Gray
    Write-Host "  2. Cliquer 'Ajouter un endpoint'" -ForegroundColor Gray
    Write-Host "  3. URL : https://votre-domaine.com/api/webhooks/stripe" -ForegroundColor Gray
    Write-Host "  4. Evenements : invoice.paid, invoice.payment_failed, customer.subscription.*" -ForegroundColor Gray
    Write-Host "  5. Copier le webhook secret (whsec_...)" -ForegroundColor Gray
    Write-Host ""
    
    if (Get-Confirmation "Avez-vous le webhook secret?") {
        $webhookSecret = Read-Host "Webhook secret (whsec_...)"
        if ($webhookSecret -and $webhookSecret.StartsWith("whsec_")) {
            Set-EnvVariable "STRIPE_WEBHOOK_SECRET" $webhookSecret
        } else {
            Write-Host "[ERREUR] Webhook secret invalide (doit commencer par whsec_)" -ForegroundColor Red
        }
    }
} else {
    Write-Host "[!] Configuration webhook ignoree" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# ÉTAPE 6 : Mise à jour code checkout
# ============================================

Write-Host "[6/6] Mise a jour code checkout..." -ForegroundColor Yellow
Write-Host ""

$checkoutFile = "src\app\api\billing\checkout\route.ts"

if (Test-Path $checkoutFile) {
    Write-Host "[i] Fichier checkout trouve : $checkoutFile" -ForegroundColor Cyan
    
    if (Get-Confirmation "Remplacer les Price IDs placeholder par les vrais?") {
        try {
            $content = Get-Content $checkoutFile -Raw
            
            # Rechercher le code à remplacer
            $oldCode = @"
const priceId = billingCycle === 'yearly' 
      ? `price_`${planName.toLowerCase()}_yearly`
      : `price_`${planName.toLowerCase()}_monthly`;
"@
            
            $newCode = @"
const priceIds: Record<string, { monthly: string; yearly: string }> = {
      SOLO: {
        monthly: process.env.STRIPE_PRICE_SOLO_MONTHLY!,
        yearly: process.env.STRIPE_PRICE_SOLO_YEARLY!,
      },
      CABINET: {
        monthly: process.env.STRIPE_PRICE_CABINET_MONTHLY!,
        yearly: process.env.STRIPE_PRICE_CABINET_YEARLY!,
      },
      ENTERPRISE: {
        monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
        yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY!,
      },
    };

    const priceId = priceIds[planName][billingCycle === 'yearly' ? 'yearly' : 'monthly'];
"@
            
            if ($content -match [regex]::Escape($oldCode)) {
                $content = $content -replace [regex]::Escape($oldCode), $newCode
                Set-Content $checkoutFile $content -NoNewline
                Write-Host "[OK] Code checkout mis a jour" -ForegroundColor Green
            } else {
                Write-Host "[!] Code placeholder non trouve (peut-etre deja mis a jour)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "[ERREUR] Echec mise a jour code : $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "[!] Fichier checkout non trouve" -ForegroundColor Yellow
}

Write-Host ""

# ============================================
# RÉSUMÉ FINAL
# ============================================

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "   CONFIGURATION TERMINEE" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Recap de la configuration :" -ForegroundColor Yellow
Write-Host ""

# Vérifier les variables
$envContent = Get-Content ".env.local" -Raw

$checks = @(
    @{ Name = "STRIPE_SECRET_KEY"; Pattern = "sk_test_" },
    @{ Name = "STRIPE_PUBLISHABLE_KEY"; Pattern = "pk_test_" },
    @{ Name = "STRIPE_WEBHOOK_SECRET"; Pattern = "whsec_" },
    @{ Name = "STRIPE_PRICE_SOLO_MONTHLY"; Pattern = "price_" },
    @{ Name = "STRIPE_PRICE_SOLO_YEARLY"; Pattern = "price_" },
    @{ Name = "STRIPE_PRICE_CABINET_MONTHLY"; Pattern = "price_" },
    @{ Name = "STRIPE_PRICE_CABINET_YEARLY"; Pattern = "price_" },
    @{ Name = "STRIPE_PRICE_ENTERPRISE_MONTHLY"; Pattern = "price_" },
    @{ Name = "STRIPE_PRICE_ENTERPRISE_YEARLY"; Pattern = "price_" }
)

foreach ($check in $checks) {
    if ($envContent -match "$($check.Name)=$($check.Pattern)") {
        Write-Host "[OK] $($check.Name)" -ForegroundColor Green
    } else {
        Write-Host "[!] $($check.Name) manquant ou invalide" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Prochaines etapes :" -ForegroundColor Cyan
Write-Host "  1. Demarrer le serveur : npm run dev" -ForegroundColor Gray
Write-Host "  2. Tester la page : http://localhost:3000/admin/billing" -ForegroundColor Gray
Write-Host "  3. S'abonner avec carte test : 4242 4242 4242 4242" -ForegroundColor Gray
Write-Host "  4. Verifier dashboard SuperAdmin : http://localhost:3000/super-admin/dashboard" -ForegroundColor Gray
Write-Host ""

if (Get-Confirmation "Demarrer le serveur Next.js maintenant?") {
    Write-Host ""
    Write-Host "[i] Demarrage du serveur..." -ForegroundColor Cyan
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "[i] Configuration terminee !" -ForegroundColor Green
    Write-Host "[i] Demarrez le serveur avec : npm run dev" -ForegroundColor Cyan
    Write-Host ""
}
