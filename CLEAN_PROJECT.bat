@echo off
echo Nettoyage du projet - Suppression des dossiers inutiles...

rmdir /s /q archive
rmdir /s /q assistant_demarches
rmdir /s /q backend
rmdir /s /q backend_minimal
rmdir /s /q chronology
rmdir /s /q frontend
rmdir /s /q frontend-pro
rmdir /s /q gui
rmdir /s /q k8s
rmdir /s /q landing
rmdir /s /q microservices
rmdir /s /q migrations
rmdir /s /q mobile-app
rmdir /s /q models
rmdir /s /q monitoring
rmdir /s /q scripts_personnalises
rmdir /s /q services
rmdir /s /q uploads

echo Suppression des fichiers de documentation redondants...
del /q README_*.md
del /q GUIDE_*.md
del /q CHANGELOG_*.md
del /q AMELIORATIONS_*.md
del /q CORRECTIONS_*.md
del /q POINTS_*.md
del /q STATUS_*.md
del /q ROADMAP_*.md
del /q ARCHITECTURE_*.md
del /q PRODUCTION_*.md
del /q ENTERPRISE_*.md
del /q FINAL_*.md
del /q PHASE_*.md
del /q REFONTE_*.md
del /q INTEGRATION_*.md
del /q WORKFLOW_*.md
del /q DESIGN_*.md
del /q DEVELOPPEMENT_*.md
del /q SMART_*.md
del /q VISION_*.md
del /q NAVIGATION_*.md
del /q ORGANISATION_*.md
del /q PAGES_*.md
del /q ROUTES_*.md
del /q STRUCTURE_*.md
del /q TOUTES_*.md
del /q TODO_*.md
del /q VERIFICATION_*.md
del /q DEMO_*.md
del /q DEMARRAGE_*.md
del /q INSTALLATION_*.md
del /q IMPLEMENTATIONS_*.md
del /q INDEX_*.md
del /q LISEZMOI_*.md
del /q LOGO_*.md
del /q ANALYSE_*.md
del /q ATTENTION_*.txt
del /q BACKEND_*.md
del /q CORRECTION_*.md
del /q LISEZ_*.txt
del /q RESUME_*.txt
del /q SOLUTION_*.txt
del /q SOLUTION_*.md

echo Suppression des scripts redondants...
del /q *.bat
del /q *.py
del /q *.ps1

echo Suppression des configs redondants...
del /q docker-compose.*.yml
del /q .env.*
del /q Dockerfile
del /q Procfile
del /q Makefile
del /q webpack.config.js
del /q package.json
del /q pyproject.toml
del /q pytest.ini
del /q alembic.ini

echo.
echo ✅ Nettoyage terminé!
echo.
echo Fichiers conservés:
echo - app_unified.py (application principale)
echo - requirements_unified.txt
echo - start_unified.bat
echo - README_UNIFIED.md
echo - src/ (code source principal)
echo - templates/ (templates HTML)
echo - static/ (assets)
echo - data/ (données)
echo.
pause