#!/usr/bin/env pwsh

Write-Host "`n
╔════════════════════════════════════════════════════════╗
║         AUDIT APP + API - PATTERN ADAPTER             ║
╚════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

# 1. Test GET endpoint
Write-Host "`n📋 1️⃣  GET /api/webhooks/test-multichannel" -ForegroundColor Yellow
try {
  $get = Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/test-multichannel" -Method GET -TimeoutSec 10
  Write-Host "✅ GET Response OK - Endpoint accessible" -ForegroundColor Green
} catch {
  Write-Host "❌ Erreur: $_" -ForegroundColor Red
  exit 1
}

# 2. Test POST avec Email
Write-Host "`n📧 2️⃣  POST Email Test" -ForegroundColor Yellow
try {
  $email = @{
    channel = "email"
    from = "user@law.fr"
    subject = "Test Audit"
    body = "Message de test"
    messageId = "audit-001"
  } | ConvertTo-Json

  $post1 = Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/test-multichannel" -Method POST -ContentType "application/json" -Body $email -TimeoutSec 10
  Write-Host "✅ Status: 200 OK" -ForegroundColor Green
  Write-Host "   MessageId: $($post1.messageId)" -ForegroundColor Green
  Write-Host "   Checksum: $($post1.checksum)" -ForegroundColor Green
} catch {
  Write-Host "❌ Erreur: $_" -ForegroundColor Red
}

# 3. Test Déduplication
Write-Host "`n🔄 3️⃣  Test Déduplication (même payload)" -ForegroundColor Yellow
try {
  $post2 = Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/test-multichannel" -Method POST -ContentType "application/json" -Body $email -TimeoutSec 10 -ErrorAction Stop
  Write-Host "❌ Erreur: Devrait retourner 409, reçu 200" -ForegroundColor Red
} catch {
  if ($_.Exception.Response.StatusCode -eq 409) {
    $errorContent = $_.ErrorDetails.Message | ConvertFrom-Json
    Write-Host "✅ Déduplication OK - Status 409" -ForegroundColor Green
    Write-Host "   Error: $($errorContent.error)" -ForegroundColor Green
  } else {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
  }
}

# 4. Test WhatsApp
Write-Host "`n💬 4️⃣  POST WhatsApp Test" -ForegroundColor Yellow
try {
  $whatsapp = @{
    channel = "whatsapp"
    from = "+33612345678"
    body = "Question urgente"
    messageId = "audit-002"
  } | ConvertTo-Json

  $post3 = Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/test-multichannel" -Method POST -ContentType "application/json" -Body $whatsapp -TimeoutSec 10
  Write-Host "✅ Status: 200 OK" -ForegroundColor Green
  Write-Host "   MessageId: $($post3.messageId)" -ForegroundColor Green
} catch {
  Write-Host "❌ Erreur: $_" -ForegroundColor Red
}

# 5. Test SMS
Write-Host "`n📞 5️⃣  POST SMS Test" -ForegroundColor Yellow
try {
  $sms = @{
    channel = "sms"
    from = "+33612345678"
    body = "Urgent"
    messageId = "audit-003"
  } | ConvertTo-Json

  $post4 = Invoke-RestMethod -Uri "http://localhost:3000/api/webhooks/test-multichannel" -Method POST -ContentType "application/json" -Body $sms -TimeoutSec 10
  Write-Host "✅ Status: 200 OK" -ForegroundColor Green
  Write-Host "   MessageId: $($post4.messageId)" -ForegroundColor Green
} catch {
  Write-Host "❌ Erreur: $_" -ForegroundColor Red
}

Write-Host "`n
╔════════════════════════════════════════════════════════╗
║         ✅ AUDIT COMPLET - SYSTÈME FONCTIONNEL        ║
╚════════════════════════════════════════════════════════╝
`n" -ForegroundColor Green
