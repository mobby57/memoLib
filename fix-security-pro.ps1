# ============================================
# SECURITY FIX PRO - memoLib
# ============================================

Write-Output ""
Write-Output "[START] DEMARRAGE DU FIX PROFESSIONNEL"
Write-Output ""

# ============================================
# 1. NETTOYAGE & MISE A JOUR
# ============================================
Write-Output "[STEP 1/4] Mise a jour des dependances..."

# Backup package-lock.json
Copy-Item package-lock.json package-lock.json.backup -Force
Write-Output "   [OK] Backup package-lock.json cree"

# Audit et fix automatique
Write-Output ""
Write-Output "[INFO] Audit des vulnerabilites..."
npm audit fix --legacy-peer-deps

# Si echec, forcer les mises a jour
if ($LASTEXITCODE -ne 0) {
    Write-Output "[WARN] Fix automatique incomplet, forcage..."
    npm audit fix --force --legacy-peer-deps
}

# ============================================
# 2. VERIFICATION BUILD
# ============================================
Write-Output ""
Write-Output "[STEP 2/4] Verification du build..."

npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Output ""
    Write-Output "[ERREUR] Build echoue! Restauration du backup..."
    Copy-Item package-lock.json.backup package-lock.json -Force
    npm install --legacy-peer-deps
    Write-Output "   [OK] Restauration reussie"
    exit 1
}

Write-Output "   [OK] Build reussi"

# ============================================
# 3. COMMIT DES CHANGEMENTS
# ============================================
Write-Output ""
Write-Output "[STEP 3/4] Commit des corrections..."

git add package*.json
git commit -m "fix: Correction vulnerabilites de securite (npm audit fix)"

Write-Output "   [OK] Changements commites"

# ============================================
# 4. PUSH VERS GITHUB
# ============================================
Write-Output ""
Write-Output "[STEP 4/4] Push vers GitHub..."

git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Output ""
    Write-Output "========================================"
    Write-Output "[OK] CORRECTION TERMINEE AVEC SUCCES!"
    Write-Output "========================================"
    Write-Output ""
    Write-Output "Resume:"
    Write-Output "   - Vulnerabilites corrigees automatiquement"
    Write-Output "   - Build verifie et valide"
    Write-Output "   - Changements pousses sur GitHub"
    Write-Output "   - Backup conserve: package-lock.json.backup"
    Write-Output ""
    Write-Output "Verifier les vulnerabilites restantes:"
    Write-Output "   https://github.com/mobby57/memoLib/security/dependabot"
    Write-Output ""
} else {
    Write-Output ""
    Write-Output "[ERREUR] Erreur lors du push"
    exit 1
}
