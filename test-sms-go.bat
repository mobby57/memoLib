@echo off
chcp 65001 >nul
title Test SMS MemoLib

echo.
echo ========================================
echo   TEST SMS MEMOLIB
echo ========================================
echo.

echo [1/2] Demarrage API...
start "MemoLib API" dotnet run

echo.
echo Attendez que l'API demarre (environ 15 secondes)
echo Vous verrez "MemoLib API demarree avec succes!" dans l'autre fenetre
echo.
echo Appuyez sur une touche quand l'API est prete...
pause >nul

echo.
echo [2/2] Test SMS vers +33603983706
echo.

powershell -ExecutionPolicy Bypass -File test-sms-simple.ps1

echo.
pause
