# ============================================================
# Script de correction et d'analyse automatique (v3)
# ============================================================

# --- 1. Vérification de la présence de package.json ---
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json introuvable. Exécutez ce script à la racine du projet." -ForegroundColor Red
    exit 1
}

# --- 2. Sauvegarde des fichiers actuels ---
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "package.json" "package.json.backup.$timestamp" -ErrorAction SilentlyContinue
Copy-Item "package-lock.json" "package-lock.json.backup.$timestamp" -ErrorAction SilentlyContinue
Write-Host "✅ Sauvegarde effectuée (package.json.backup.$timestamp)" -ForegroundColor Green

# --- 3. Correction des versions dans package.json ---
Write-Host "🔧 Mise à jour des dépendances Semantic Release..." -ForegroundColor Cyan

# Lecture du contenu du fichier package.json
$pkg = Get-Content "package.json" -Raw | ConvertFrom-Json

# Définir les versions cibles
$newDevDeps = @{
    "semantic-release" = "^24.2.9"
    "@semantic-release/npm" = "^12.0.0"
    "@semantic-release/git" = "^10.0.1"
    "@semantic-release/changelog" = "^6.0.3"
    "@semantic-release/commit-analyzer" = "^13.0.0"
    "@semantic-release/release-notes-generator" = "^14.0.0"
    "@semantic-release/github" = "^11.0.0"
}

# Créer un nouvel objet PSObject à partir du hashtable
$newDevDepsObject = New-Object PSObject
foreach ($key in $newDevDeps.Keys) {
    $newDevDepsObject | Add-Member -MemberType NoteProperty -Name $key -Value $newDevDeps[$key]
}

# Remplacer l'ancien devDependencies par le nouveau
if ($pkg.devDependencies) {
    $pkg.devDependencies = $newDevDepsObject
} else {
    $pkg | Add-Member -MemberType NoteProperty -Name "devDependencies" -Value $newDevDepsObject
}

# Sauvegarder le fichier avec l'encodage UTF-8 sans BOM
$pkg | ConvertTo-Json -Depth 10 | Set-Content -Encoding UTF8 "package.json"
Write-Host "✅ package.json mis à jour." -ForegroundColor Green

# --- 4. Nettoyage et réinstallation ---
Write-Host "🧹 Nettoyage des dépendances..." -ForegroundColor Cyan

# Forcer la suppression de node_modules avec cmd (plus robuste)
if (Test-Path "node_modules") {
    Write-Host "   Suppression de node_modules via cmd..." -ForegroundColor Gray
    cmd /c rmdir /s /q node_modules 2>nul
    # Si cela échoue, on tente avec Remove-Item avec -ErrorAction SilentlyContinue
    if (Test-Path "node_modules") {
        Remove-Item -Recurse -Force "node_modules" -ErrorAction SilentlyContinue
    }
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force "package-lock.json" -ErrorAction SilentlyContinue
}

Write-Host "📦 Installation des dépendances..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Erreur lors de npm install." -ForegroundColor Red
    exit 1
}

# --- 5. Correction automatique des vulnérabilités ---
Write-Host "🔍 npm audit fix..." -ForegroundColor Cyan
npm audit fix
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️ npm audit fix a rencontré des problèmes (peut-être des mises à jour majeures)." -ForegroundColor Yellow
}

# --- 6. Mise à jour manuelle des paquets critiques (identifiés par Trivy) ---
Write-Host "🛠️ Mise à jour manuelle des paquets critiques..." -ForegroundColor Cyan
$criticalPackages = @(
    "next-auth@4.24.15",
    "brace-expansion@5.0.9",
    "picomatch@4.0.4",
    "nodemailer@9.0.1",
    "next@16.2.11",
    "axios@1.18.0",
    "ip-address@10.3.1",
    "js-yaml@4.3.1"
)
foreach ($pkgName in $criticalPackages) {
    Write-Host "  Installation de $pkgName..." -ForegroundColor Gray
    npm install $pkgName
    if ($LASTEXITCODE -ne 0) {
        Write-Host "    ⚠️ Échec pour $pkgName, continuer..." -ForegroundColor Yellow
    }
}

# --- 7. Vérification finale avec npm audit ---
Write-Host "📊 Audit final..." -ForegroundColor Cyan
npm audit

# --- 8. Lancement de Trivy (si installé) ---
Write-Host "🔎 Scan Trivy..." -ForegroundColor Cyan
$trivyPath = (Get-Command "trivy" -ErrorAction SilentlyContinue).Source
if ($trivyPath) {
    Write-Host "✅ Trivy trouvé : $trivyPath" -ForegroundColor Green
    trivy fs --scanners vuln --skip-dirs "bin" --skip-dirs "obj" --skip-dirs "tests/bin" --severity HIGH,CRITICAL .
} else {
    Write-Host "❌ Trivy n'est pas installé ou n'est pas dans le PATH." -ForegroundColor Red
    Write-Host "👉 Pour l'installer : scoop install trivy (ou téléchargez depuis https://github.com/aquasecurity/trivy/releases)" -ForegroundColor Yellow
}

# --- 9. Lancement de Semgrep (avec correction d'encodage) ---
Write-Host "🔎 Scan Semgrep..." -ForegroundColor Cyan
$semgrepPath = (Get-Command "semgrep" -ErrorAction SilentlyContinue).Source
if ($semgrepPath) {
    Write-Host "✅ Semgrep trouvé : $semgrepPath" -ForegroundColor Green
    $env:PYTHONIOENCODING = "utf-8"
    semgrep scan --config auto --sarif --output .\semgrep-ts-new.sarif .
} else {
    Write-Host "❌ Semgrep n'est pas installé ou n'est pas dans le PATH." -ForegroundColor Red
    Write-Host "👉 Pour l'installer : pip install semgrep (ou via le Windows Store)" -ForegroundColor Yellow
}

Write-Host "✅ Script terminé." -ForegroundColor Green