@echo off
setlocal
powershell -ExecutionPolicy Bypass -File "%~dp0uninstall-demo.ps1"
pause
