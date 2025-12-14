@echo off
echo.
echo ============================================
echo     ANALYSE DES RESULTATS DE TESTS E2E
echo ============================================
echo.

cd frontend-react

echo Lecture du fichier test-results.json...
echo.

powershell -Command "$json = Get-Content test-results.json -Raw | ConvertFrom-Json; $specs = $json.suites | ForEach-Object { $_.specs }; $passed = 0; $failed = 0; $specs | ForEach-Object { $_.tests | ForEach-Object { $_.results | ForEach-Object { if ($_.status -eq 'passed') { $passed++ } elseif ($_.status -eq 'failed') { $failed++ } } } }; $total = $passed + $failed; Write-Host ''; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  RESULTATS DES TESTS E2E PLAYWRIGHT' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; Write-Host \"Tests reussis   : $passed\" -ForegroundColor Green; Write-Host \"Tests echoues   : $failed\" -ForegroundColor Red; Write-Host \"Total           : $total\" -ForegroundColor White; Write-Host ''; if ($total -gt 0) { $pct = [math]::Round(($passed/$total)*100, 1); Write-Host \"Taux de reussite: $pct%%\" -ForegroundColor $(if ($pct -gt 80) {'Green'} elseif ($pct -gt 50) {'Yellow'} else {'Red'}); }; Write-Host ''; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '';"

echo.
echo Appuyez sur une touche pour voir le rapport HTML...
pause > nul

npm run test:e2e:report
