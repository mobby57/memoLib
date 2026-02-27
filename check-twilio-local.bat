@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

title Check Twilio Local - MemoLib

echo.
echo ========================================
echo   CHECK TWILIO LOCAL - MEMOLIB
echo ========================================
echo.

set "BASE_URL=http://localhost:5078"
set "HEALTH_URL=%BASE_URL%/health"
set "SMS_WEBHOOK=%BASE_URL%/api/messaging/sms/webhook"
set "WA_WEBHOOK=%BASE_URL%/api/messaging/whatsapp/webhook"

echo [1/4] Verification API locale...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri '%HEALTH_URL%' -UseBasicParsing -TimeoutSec 8; if($r.StatusCode -eq 200){ exit 0 } else { exit 1 } } catch { exit 1 }"
if errorlevel 1 (
  echo [KO] API indisponible sur %HEALTH_URL%
  echo      Lancez l'API puis relancez ce script.
) else (
  echo [OK] API disponible sur %HEALTH_URL%
)
echo.

echo [2/4] Verification ngrok local API...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:4040/api/tunnels' -UseBasicParsing -TimeoutSec 8; $json = $r.Content | ConvertFrom-Json; $httpsTunnel = $json.tunnels | Where-Object { $_.public_url -like 'https://*' } | Select-Object -First 1; if($httpsTunnel){ Write-Output ('NGROK_HTTPS=' + $httpsTunnel.public_url); exit 0 } else { Write-Output 'NGROK_HTTPS=NONE'; exit 2 } } catch { Write-Output 'NGROK_HTTPS=DOWN'; exit 1 }" > ngrok_status.tmp
set "NGROK_LINE="
for /f "usebackq delims=" %%i in ("ngrok_status.tmp") do set "NGROK_LINE=%%i"
if "%NGROK_LINE%"=="NGROK_HTTPS=DOWN" (
  echo [KO] ngrok non detecte. Lancez : ngrok http 5078
) else if "%NGROK_LINE%"=="NGROK_HTTPS=NONE" (
  echo [KO] ngrok actif mais aucun tunnel HTTPS trouve.
) else (
  echo [OK] !NGROK_LINE!
  for /f "tokens=2 delims==" %%u in ("!NGROK_LINE!") do set "PUBLIC_URL=%%u"
)
del ngrok_status.tmp >nul 2>&1
echo.

echo [3/4] Endpoints webhook locaux (existence route)...
powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%SMS_WEBHOOK%' -Method Post -UseBasicParsing -TimeoutSec 8 | Out-Null; Write-Output 'SMS_WEBHOOK=200'; exit 0 } catch { if($_.Exception.Response){ Write-Output ('SMS_WEBHOOK=' + [int]$_.Exception.Response.StatusCode) } else { Write-Output 'SMS_WEBHOOK=DOWN' }; exit 0 }" > sms_status.tmp
set "SMS_STATUS="
for /f "usebackq delims=" %%i in ("sms_status.tmp") do set "SMS_STATUS=%%i"
del sms_status.tmp >nul 2>&1
echo      %SMS_WEBHOOK% -> !SMS_STATUS!

powershell -NoProfile -Command "try { Invoke-WebRequest -Uri '%WA_WEBHOOK%' -Method Post -UseBasicParsing -TimeoutSec 8 | Out-Null; Write-Output 'WA_WEBHOOK=200'; exit 0 } catch { if($_.Exception.Response){ Write-Output ('WA_WEBHOOK=' + [int]$_.Exception.Response.StatusCode) } else { Write-Output 'WA_WEBHOOK=DOWN' }; exit 0 }" > wa_status.tmp
set "WA_STATUS="
for /f "usebackq delims=" %%i in ("wa_status.tmp") do set "WA_STATUS=%%i"
del wa_status.tmp >nul 2>&1
echo      %WA_WEBHOOK% -> !WA_STATUS!
echo.

echo [4/4] Rappel configuration Twilio
if defined PUBLIC_URL (
  echo      SMS webhook      : !PUBLIC_URL!/api/messaging/sms/webhook
  echo      WhatsApp webhook : !PUBLIC_URL!/api/messaging/whatsapp/webhook
) else (
  echo      URL ngrok indisponible: impossible de generer les webhooks publics.
)
echo.
echo ========================================
echo   CHECK TERMINE
echo ========================================
echo.
pause
endlocal
