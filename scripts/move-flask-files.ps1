# Script simple pour déplacer fichiers Flask
$legacyDir = "src\backend\flask_legacy"

# Créer dossier si nécessaire
if (-not (Test-Path $legacyDir)) {
    New-Item -ItemType Directory -Path $legacyDir -Force | Out-Null
}

# Fichiers backend à déplacer
$backendFiles = @("app.py", "api.py", "api_endpoints.py", "missing_endpoints.py", "enterprise_features.py", "security_improvements.py")
foreach ($file in $backendFiles) {
    $src = "src\backend\$file"
    $dst = "$legacyDir\$file"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination $dst -Force
        Write-Host "Deplace: $file"
    }
}

# Routes à déplacer
$routeFiles = @("legal_routes.py", "smtp_routes.py", "realtime.py", "vector_stores.py", "batch.py", "webhooks.py")
foreach ($file in $routeFiles) {
    $src = "src\backend\routes\$file"
    $dst = "$legacyDir\$file"
    if (Test-Path $src) {
        Move-Item -Path $src -Destination $dst -Force
        Write-Host "Deplace: $file"
    }
}

# Supprimer fichiers JS
$jsFiles = Get-ChildItem "src\backend\routes\*.js" -ErrorAction SilentlyContinue
foreach ($file in $jsFiles) {
    Remove-Item $file.FullName -Force
    Write-Host "Supprime: $($file.Name)"
}

Write-Host "Termine"

