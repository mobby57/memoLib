@echo off
echo Suppression du frontend-pro (Next.js)...
rmdir /s /q frontend-pro

echo ✅ Frontend-pro supprimé!
echo ✅ Frontend (React + Vite) conservé
echo.
echo Structure finale:
echo - frontend/ (React + TypeScript + Vite) ✅
echo - app_unified.py (Application principale) ✅
echo.
pause