#!/bin/bash

# ============================================================
# SCRIPT D'AUTODIAGNOSTIC DU PROJET MEMOLIB
# ============================================================
# Date: $(date +"%Y-%m-%d %H:%M:%S")
# Auteur: Assistant IA
#
# Ce script lance une batterie de tests et d'analyses pour
# évaluer la santé du projet.
# ============================================================

# --- Couleurs pour une meilleure lisibilité ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# --- Fonctions Utilitaires ---

# Affiche un message de début de section
print_section() {
    echo -e "\n${BOLD}${BLUE}============================================================${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}============================================================${NC}\n"
}

# Affiche un message de succès
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# Affiche un message d'erreur
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Affiche un message d'avertissement
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Affiche la durée d'exécution d'une commande
print_duration() {
    local start=$1
    local end=$2
    local duration=$((end - start))
    echo -e "Durée: ${duration}s"
}

# --- Vérification des prérequis ---
print_section "Vérification de l'environnement"

# Vérifier si les commandes existent
for cmd in npm node npx; do
    if ! command -v $cmd &> /dev/null; then
        print_error "La commande '$cmd' est introuvable. Veuillez l'installer."
        exit 1
    fi
done

print_success "Environnement vérifié avec succès."

# --- 1. Nettoyage des caches ---
print_section "1. Nettoyage des caches"
echo "Exécution de 'npm run clean' pour supprimer les caches..."
npm run clean > /dev/null 2>&1
print_success "Cache nettoyé."

# --- 2. Vérification des dépendances (audit) ---
print_section "2. Audit des dépendances"
echo "Analyse des vulnérabilités NPM..."
npm run security:audit > security-audit-report.txt 2>&1
# La commande 'npm audit' retourne un code d'erreur s'il y a des vulnérabilités, on ignore.
print_success "Audit terminé. Rapport généré dans 'security-audit-report.txt'."

# --- 3. TypeScript Type Check ---
print_section "3. Vérification des types TypeScript"
echo "Lancement de 'type-check' (peut prendre plusieurs minutes)..."
start_time=$(date +%s)
npm run type-check > type-check-report.txt 2>&1
TYPE_CHECK_EXIT_CODE=$?
end_time=$(date +%s)
print_duration $start_time $end_time

if [ $TYPE_CHECK_EXIT_CODE -eq 0 ]; then
    print_success "Type Check passé avec succès."
else
    print_error "Le Type Check a échoué. Voir 'type-check-report.txt'."
    # On affiche les 10 premières erreurs pour donner un aperçu
    echo -e "\n${YELLOW}Aperçu des 10 premières erreurs :${NC}"
    head -n 20 type-check-report.txt | grep -E "error TS[0-9]+"
fi

# --- 4. Linting (strict) ---
print_section "4. Analyse du code (Linting)"
echo "Lancement de 'lint:strict'..."
start_time=$(date +%s)
npm run lint:strict > lint-report.txt 2>&1
LINT_EXIT_CODE=$?
end_time=$(date +%s)
print_duration $start_time $end_time

if [ $LINT_EXIT_CODE -eq 0 ]; then
    print_success "Linting terminé sans erreurs."
else
    print_error "Le linting a trouvé des problèmes. Voir 'lint-report.txt'."
    echo -e "\n${YELLOW}Aperçu des problèmes :${NC}"
    head -n 20 lint-report.txt
fi

# --- 5. Build de production ---
print_section "5. Build de production"
echo "Lancement de 'build' (peut prendre plusieurs minutes)..."
start_time=$(date +%s)
npm run build > build-report.txt 2>&1
BUILD_EXIT_CODE=$?
end_time=$(date +%s)
print_duration $start_time $end_time

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    print_success "Build réussi."
    # On extrait la taille du bundle des logs
    echo -e "\n${YELLOW}Taille du bundle Next.js :${NC}"
    grep -E "Page" build-report.txt | tail -n 10
else
    print_error "Le build a échoué. Voir 'build-report.txt'."
    echo -e "\n${YELLOW}Aperçu de l'erreur :${NC}"
    tail -n 20 build-report.txt
fi

# --- 6. Tests Unitaires et d'Intégration (en mode CI) ---
print_section "6. Tests (CI mode)"
echo "Lancement des tests en mode CI (rapide)..."
start_time=$(date +%s)
npm run test:ci > test-report.txt 2>&1
TEST_EXIT_CODE=$?
end_time=$(date +%s)
print_duration $start_time $end_time

if [ $TEST_EXIT_CODE -eq 0 ]; then
    print_success "Tous les tests sont passés."
else
    print_error "Des tests ont échoué. Voir 'test-report.txt'."
    echo -e "\n${YELLOW}Détails des échecs :${NC}"
    grep -E "FAIL|●" test-report.txt | head -n 20
fi

# --- 7. Analyse des dépendances inutilisées ---
print_section "7. Analyse des dépendances"
echo "Recherche des paquets NPM inutilisés..."
npx depcheck --ignores='@types/*,eslint-*,@testing-library/*' > depcheck-report.txt 2>&1

echo -e "\n${YELLOW}Résumé des dépendances inutilisées (si applicable) :${NC}"
grep -E "Unused dependencies|Unused devDependencies|Missing dependencies" depcheck-report.txt

print_success "Rapport généré dans 'depcheck-report.txt'."

# --- 8. Résumé et recommandations ---
print_section "Résumé du diagnostic"

echo -e "Voici un résumé des points à vérifier :"
echo "----------------------------------------"

if [ $TYPE_CHECK_EXIT_CODE -eq 0 ]; then echo -e "${GREEN}✅ TypeScript Type Check : OK${NC}"; else echo -e "${RED}❌ TypeScript Type Check : ÉCHEC${NC}"; fi
if [ $LINT_EXIT_CODE -eq 0 ]; then echo -e "${GREEN}✅ Linting : OK${NC}"; else echo -e "${RED}❌ Linting : ÉCHEC${NC}"; fi
if [ $BUILD_EXIT_CODE -eq 0 ]; then echo -e "${GREEN}✅ Build Production : OK${NC}"; else echo -e "${RED}❌ Build Production : ÉCHEC${NC}"; fi
if [ $TEST_EXIT_CODE -eq 0 ]; then echo -e "${GREEN}✅ Tests CI : OK${NC}"; else echo -e "${RED}❌ Tests CI : ÉCHEC${NC}"; fi

echo "----------------------------------------"
echo "Les fichiers de rapport suivants ont été générés :"
echo " - security-audit-report.txt"
echo " - type-check-report.txt"
echo " - lint-report.txt"
echo " - build-report.txt"
echo " - test-report.txt"
echo " - depcheck-report.txt"
echo "----------------------------------------"
echo "Consultez ces fichiers pour plus de détails."

print_section "Diagnostic terminé"