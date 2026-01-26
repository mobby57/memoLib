# Configuration GitHub User-to-Server Authentication
# Ce script aide a configurer l'authentification utilisateur

Write-Output "[INFO] GitHub User-to-Server Authentication - Configuration"
Write-Output ""

# Verifier si .env.local existe
if (-not (Test-Path ".env.local")) {
    Write-Output "[WARN] Fichier .env.local non trouve"
    Write-Output "[INFO] Creation depuis .env.local.example..."
    Copy-Item ".env.local.example" ".env.local"
    Write-Output "[OK] Fichier .env.local cree"
    Write-Output ""
}

# Lire le fichier .env.local
$envContent = Get-Content ".env.local" -Raw

# Verifier les variables critiques
Write-Output "[INFO] Verification de la configuration:"
Write-Output ""

$checks = @(
    @{
        Name = "GITHUB_APP_ID"
        Pattern = "GITHUB_APP_ID=(\d+)"
        Required = $true
    },
    @{
        Name = "GITHUB_CLIENT_ID"
        Pattern = "GITHUB_CLIENT_ID=(Iv\w+)"
        Required = $true
    },
    @{
        Name = "GITHUB_CLIENT_SECRET"
        Pattern = "GITHUB_CLIENT_SECRET=(\w+)"
        Required = $true
    },
    @{
        Name = "GITHUB_CALLBACK_URL"
        Pattern = "GITHUB_CALLBACK_URL=(https?://[^\s]+)"
        Required = $true
    }
)

$allValid = $true

foreach ($check in $checks) {
    if ($envContent -match $check.Pattern) {
        $value = $Matches[1]
        if ($value -match "your-|example") {
            Write-Output "  [X] $($check.Name): A configurer"
            $allValid = $false
        } else {
            if ($check.Name -eq "GITHUB_CLIENT_SECRET") {
                Write-Output "  [OK] $($check.Name): Configure"
            } else {
                Write-Output "  [OK] $($check.Name): $value"
            }
        }
    } else {
        Write-Output "  [X] $($check.Name): Manquant"
        $allValid = $false
    }
}

Write-Output ""

if ($allValid) {
    Write-Output "[OK] Configuration complete!"
    Write-Output ""
    Write-Output "Prochaines etapes:"
    Write-Output "1. Tester la connexion: npm run dev"
    Write-Output "2. Aller sur http://localhost:3000/login"
    Write-Output "3. Cliquer sur 'Se connecter avec GitHub'"
} else {
    Write-Output "[ERREUR] Configuration incomplete"
    Write-Output ""
    Write-Output "Actions requises:"
    Write-Output "1. Aller sur https://github.com/settings/apps"
    Write-Output "2. Configurer votre GitHub App"
    Write-Output "3. Mettre a jour .env.local avec les valeurs"
    Write-Output ""
    Write-Output "Documentation: docs/github-oauth-setup.md"
}
Write-Output ""
