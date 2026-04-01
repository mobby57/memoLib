@echo off
chcp 65001 >nul
title Demarrage API + Test SMS

echo.
echo [1/2] Demarrage API MemoLib...
echo.

start "MemoLib API" /MIN dotnet run

echo Attente demarrage API (15 secondes)...
timeout /t 15 >nul

echo.
echo [2/2] Test SMS...
echo.

powershell -ExecutionPolicy Bypass -File test-sms-simple.ps1

pause
