@echo off
echo ========================================
echo   Nettoyage Repo (reduction taille)
echo ========================================
echo.

echo [1/5] Suppression fichiers build...
rmdir /s /q _build_check 2>nul
rmdir /s /q bin\Debug 2>nul
rmdir /s /q obj 2>nul
rmdir /s /q publish 2>nul
echo       OK Build nettoye

echo [2/5] Suppression logs et backups...
rmdir /s /q logs 2>nul
rmdir /s /q backups 2>nul
del /q *.log 2>nul
del /q api.log 2>nul
echo       OK Logs nettoyes

echo [3/5] Suppression bases de donnees test...
del /q memolib.*.db 2>nul
del /q memolib.*.db-shm 2>nul
del /q memolib.*.db-wal 2>nul
del /q dev.db 2>nul
echo       OK DB test nettoyees (memolib.db conserve)

echo [4/5] Suppression node_modules et dist...
rmdir /s /q node_modules 2>nul
rmdir /s /q dist 2>nul
rmdir /s /q .next 2>nul
echo       OK Node nettoye

echo [5/5] Mise a jour .gitignore...
echo # Build outputs >> .gitignore
echo _build_check/ >> .gitignore
echo bin/ >> .gitignore
echo obj/ >> .gitignore
echo publish/ >> .gitignore
echo # Logs >> .gitignore
echo logs/ >> .gitignore
echo *.log >> .gitignore
echo # Test databases >> .gitignore
echo memolib.*.db >> .gitignore
echo *.db-shm >> .gitignore
echo *.db-wal >> .gitignore
echo dev.db >> .gitignore
echo # Node >> .gitignore
echo node_modules/ >> .gitignore
echo dist/ >> .gitignore
echo .next/ >> .gitignore
echo       OK .gitignore mis a jour

echo.
echo ========================================
echo   Nettoyage termine!
echo ========================================
echo.
echo Taille reduite significativement
echo Pret pour push GitHub
echo.
pause
