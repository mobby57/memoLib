#!/bin/bash
# MemoLib - Script de Nettoyage Automatique
# Usage: ./clean-project.sh [--deep] [--dry-run]

set -e

DEEP=false
DRY_RUN=false

# Parse arguments
for arg in "$@"; do
    case $arg in
        --deep)
            DEEP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
    esac
done

echo "🧹 MemoLib - Nettoyage du Projet"
echo "================================="
echo ""

ITEMS_REMOVED=0

# Function to remove item
remove_item() {
    local item=$1
    if [ -e "$item" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo "  [DRY-RUN] Supprimerait: $item"
        else
            rm -rf "$item"
            echo "  ✓ Supprimé: $item"
            ((ITEMS_REMOVED++))
        fi
    fi
}

# Cache et Build Artifacts
echo "📦 Nettoyage des caches..."
remove_item ".jest-cache"
remove_item ".next"
remove_item ".swc"
remove_item ".turbo"
remove_item ".wrangler"
remove_item ".open-next"
remove_item "coverage"
remove_item "out-azure"
remove_item "nextjs-app"
remove_item ".cache_ggshield"
remove_item ".tsbuildinfo"

# Logs
echo ""
echo "📝 Nettoyage des logs..."
for log in *.log dev-error.log dev-output.log dev-server.log server.log build.log build-full.log build-output.log dev.log; do
    remove_item "$log"
done

# Fichiers temporaires
echo ""
echo "🗑️  Nettoyage des fichiers temporaires..."
for temp in temp_*.txt test-upload-temp.txt syntaxiquement valide; do
    remove_item "$temp"
done

# Reports
echo ""
echo "📊 Nettoyage des rapports..."
remove_item "bugs-report.json"
remove_item "database-test-report.json"
remove_item "migration-report.json"
remove_item "performance-metrics.json"
remove_item "ascii-conversion-report.txt"
remove_item "type-errors.txt"
remove_item "type-errors-new.txt"

# Test Results
echo ""
echo "🧪 Nettoyage des résultats de tests..."
remove_item "test-results"
remove_item "playwright-report"

# Nettoyage profond
if [ "$DEEP" = true ]; then
    echo ""
    echo "🔥 Nettoyage PROFOND activé..."
    remove_item "node_modules"
    remove_item "backups"
    remove_item "dbcodeio-public"
    remove_item "app-sentry-backup"
fi

echo ""
echo "================================="
if [ "$DRY_RUN" = true ]; then
    echo "🔍 Mode DRY-RUN: Aucun fichier supprimé"
    echo "   Exécutez sans --dry-run pour nettoyer réellement"
else
    echo "✅ Nettoyage terminé!"
    echo "   $ITEMS_REMOVED éléments supprimés"
fi

if [ "$DEEP" = true ] && [ "$DRY_RUN" = false ]; then
    echo ""
    echo "💡 N'oubliez pas de réinstaller les dépendances:"
    echo "   npm install"
fi

echo ""
