@echo off
echo ========================================
echo   Nettoyage + Push GitHub
echo ========================================
echo.

echo [1/6] Nettoyage fichiers build...
rmdir /s /q _build_check 2>nul
rmdir /s /q bin 2>nul
rmdir /s /q obj 2>nul
rmdir /s /q publish 2>nul
echo       OK

echo [2/6] Nettoyage logs...
rmdir /s /q logs 2>nul
rmdir /s /q backups 2>nul
del /q *.log 2>nul
echo       OK

echo [3/6] Nettoyage DB test...
del /q memolib.*.db 2>nul
del /q memolib.*.db-shm 2>nul
del /q memolib.*.db-wal 2>nul
del /q dev.db 2>nul
echo       OK (memolib.db conserve)

echo [4/6] Git add...
git add -A
echo       OK

echo [5/6] Git commit...
git commit -m "feat: Demo auto sarraboudjellal57 + scripts + nettoyage repo"
echo       OK

echo [6/6] Git push...
git push origin main
echo       OK

echo.
echo ========================================
echo   Push GitHub termine!
echo ========================================
echo.
git status
pause
