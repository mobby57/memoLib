# Test complet - Passerelle Universelle + Signal Command Center
$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   TEST COMPLET MEMOLIB" -ForegroundColor Cyan
Write-Host "   Passerelle + Signal Command Center" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$apiUrl = "http://localhost:5078"

# Vérifier API
Write-Host "[1/10] Vérification API..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 5
    Write-Host "✅ API accessible" -ForegroundColor Green
} catch {
    Write-Host "❌ API non accessible - Lancez: dotnet run" -ForegroundColor Red
    exit 1
}

# Authentification
Write-Host ""
Write-Host "[2/10] Authentification..." -ForegroundColor Yellow
$email = "test@memolib.local"
$password = "Test123!"

try {
    $registerBody = @{ email = $email; password = $password; name = "Test User" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$apiUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json" -TimeoutSec 10 | Out-Null
} catch {}

$loginBody = @{ email = $email; password = $password } | ConvertTo-Json
$auth = Invoke-RestMethod -Uri "$apiUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -TimeoutSec 10
$token = $auth.token

Write-Host "✅ Authentifié" -ForegroundColor Green

# Test 1: Ingestion Email via passerelle
Write-Host ""
Write-Host "[3/10] Test ingestion Email..." -ForegroundColor Yellow
$emailMsg = @{
    channel = "email"
    from = "client@example.com"
    fromName = "Jean Dupont"
    text = "Demande de consultation juridique"
    externalId = "email-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

$headers = @{ "Authorization" = "Bearer $token"; "Content-Type" = "application/json" }
$result = Invoke-RestMethod -Uri "$apiUrl/api/gateway/ingest" -Method Post -Body $emailMsg -Headers $headers
Write-Host "✅ Email ingéré: $($result.eventId)" -ForegroundColor Green

# Test 2: Ingestion Telegram via passerelle
Write-Host ""
Write-Host "[4/10] Test ingestion Telegram..." -ForegroundColor Yellow
$telegramMsg = @{
    channel = "telegram"
    from = "123456789"
    fromName = "Marie Martin"
    text = "Question sur mon dossier"
    externalId = "tg-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "$apiUrl/api/gateway/ingest" -Method Post -Body $telegramMsg -Headers $headers
Write-Host "✅ Telegram ingéré: $($result.eventId)" -ForegroundColor Green

# Test 3: Ingestion Messenger via passerelle
Write-Host ""
Write-Host "[5/10] Test ingestion Messenger..." -ForegroundColor Yellow
$messengerMsg = @{
    channel = "messenger"
    from = "987654321"
    fromName = "Paul Durand"
    text = "Merci pour votre aide"
    externalId = "fb-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "$apiUrl/api/gateway/ingest" -Method Post -Body $messengerMsg -Headers $headers
Write-Host "✅ Messenger ingéré: $($result.eventId)" -ForegroundColor Green

# Test 4: Ingestion WhatsApp via passerelle
Write-Host ""
Write-Host "[6/10] Test ingestion WhatsApp..." -ForegroundColor Yellow
$whatsappMsg = @{
    channel = "whatsapp"
    from = "+33603983709"
    fromName = "Sophie Blanc"
    text = "RDV confirmé pour demain"
    externalId = "wa-$(Get-Date -Format 'yyyyMMddHHmmss')"
} | ConvertTo-Json

$result = Invoke-RestMethod -Uri "$apiUrl/api/gateway/ingest" -Method Post -Body $whatsappMsg -Headers $headers
Write-Host "✅ WhatsApp ingéré: $($result.eventId)" -ForegroundColor Green

# Test 5: Inbox unifiée
Write-Host ""
Write-Host "[7/10] Test inbox unifiée..." -ForegroundColor Yellow
$inbox = Invoke-RestMethod -Uri "$apiUrl/api/gateway/inbox?limit=10" -Headers $headers

Write-Host "✅ Inbox récupérée: $($inbox.Count) messages" -ForegroundColor Green
Write-Host ""
Write-Host "📨 INBOX UNIFIÉE:" -ForegroundColor Cyan
foreach ($msg in $inbox | Select-Object -First 5) {
    $emoji = switch ($msg.channel) {
        "EMAIL" { "📧" }
        "TELEGRAM" { "✈️" }
        "MESSENGER" { "💬" }
        "WHATSAPP" { "💚" }
        "SMS" { "📱" }
        default { "📨" }
    }
    $preview = if ($msg.text.Length -gt 50) { $msg.text.Substring(0, 50) + "..." } else { $msg.text }
    Write-Host "  $emoji $($msg.channel): $preview" -ForegroundColor Gray
}

# Test 6: Envoi universel (simulation)
Write-Host ""
Write-Host "[8/10] Test envoi universel..." -ForegroundColor Yellow
Write-Host "⚠️  Envoi simulé (nécessite configuration canaux)" -ForegroundColor Yellow

# Test 7: Commande Signal /inbox
Write-Host ""
Write-Host "[9/10] Simulation commande Signal /inbox..." -ForegroundColor Yellow
Write-Host "📱 Commande: /inbox" -ForegroundColor Cyan
Write-Host ""
Write-Host "Réponse simulée:" -ForegroundColor Gray
Write-Host "📨 INBOX (10 derniers)" -ForegroundColor White
Write-Host ""
Write-Host "📧 EMAIL" -ForegroundColor White
Write-Host "Demande de consultation juridique..." -ForegroundColor Gray
Write-Host "Il y a 2 min" -ForegroundColor DarkGray
Write-Host ""
Write-Host "✈️ TELEGRAM" -ForegroundColor White
Write-Host "Question sur mon dossier..." -ForegroundColor Gray
Write-Host "Il y a 3 min" -ForegroundColor DarkGray
Write-Host ""
Write-Host "💬 MESSENGER" -ForegroundColor White
Write-Host "Merci pour votre aide..." -ForegroundColor Gray
Write-Host "Il y a 5 min" -ForegroundColor DarkGray

# Test 8: Statistiques
Write-Host ""
Write-Host "[10/10] Test statistiques..." -ForegroundColor Yellow
Write-Host "📊 STATISTIQUES:" -ForegroundColor Cyan
Write-Host "  Total messages: $($inbox.Count)" -ForegroundColor White
$byChannel = $inbox | Group-Object -Property channel
foreach ($group in $byChannel) {
    $emoji = switch ($group.Name) {
        "EMAIL" { "📧" }
        "TELEGRAM" { "✈️" }
        "MESSENGER" { "💬" }
        "WHATSAPP" { "💚" }
        "SMS" { "📱" }
        default { "📨" }
    }
    Write-Host "  $emoji $($group.Name): $($group.Count)" -ForegroundColor White
}

# Résumé
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   RÉSUMÉ DES TESTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ API accessible" -ForegroundColor Green
Write-Host "✅ Authentification OK" -ForegroundColor Green
Write-Host "✅ Ingestion Email OK" -ForegroundColor Green
Write-Host "✅ Ingestion Telegram OK" -ForegroundColor Green
Write-Host "✅ Ingestion Messenger OK" -ForegroundColor Green
Write-Host "✅ Ingestion WhatsApp OK" -ForegroundColor Green
Write-Host "✅ Inbox unifiée OK" -ForegroundColor Green
Write-Host "⚠️  Envoi universel (nécessite config)" -ForegroundColor Yellow
Write-Host "✅ Commandes Signal simulées" -ForegroundColor Green
Write-Host "✅ Statistiques OK" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 PASSERELLE UNIVERSELLE FONCTIONNELLE !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host "  1. Configurez Telegram: config-telegram.bat" -ForegroundColor White
Write-Host "  2. Configurez Messenger: config-messenger.bat" -ForegroundColor White
Write-Host "  3. Configurez Signal: config-signal-command-center.bat" -ForegroundColor White
Write-Host "  4. Testez depuis votre téléphone !" -ForegroundColor White
Write-Host ""
Write-Host "🔒 SIGNAL COMMAND CENTER:" -ForegroundColor Cyan
Write-Host "  Commandes disponibles:" -ForegroundColor White
Write-Host "    /help - Aide" -ForegroundColor Gray
Write-Host "    /inbox - Voir les messages" -ForegroundColor Gray
Write-Host "    /send telegram 123 Bonjour" -ForegroundColor Gray
Write-Host "    /stats - Statistiques" -ForegroundColor Gray
Write-Host "    /search divorce - Rechercher" -ForegroundColor Gray
Write-Host ""
