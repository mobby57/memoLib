@echo off
echo ========================================
echo   MemoLib - Push vers GitHub
echo ========================================
echo.

echo [1/4] Ajout de tous les fichiers...
git add -A
echo       OK Fichiers ajoutes

echo [2/4] Commit des changements...
git commit -m "feat: Configuration complete avec demo auto sarraboudjellal57 + scripts automatises"
echo       OK Commit effectue

echo [3/4] Push vers GitHub...
git push origin main
echo       OK Push termine

echo [4/4] Verification...
git status
echo.
echo ========================================
echo   Push GitHub termine!
echo ========================================
echo.
pause
