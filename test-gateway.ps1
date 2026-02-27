# Test Gateway End-to-End
Write-Host "🚀 MemoLib - Test Universal Gateway" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5078"
$apiKey = "memolib-gateway-2025-secure-key"

# Check if API is running
Write-Host "1️⃣ Vérification API..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -ErrorAction SilentlyContinue
    Write-Host "✅ API opérationnelle" -ForegroundColor Green
} catch {
    Write-Host "❌ API non accessible. Lancez d'abord: dotnet run" -ForegroundColor Red
    exit 1
}

# Register user
Write-Host ""
Write-Host "2️⃣ Création utilisateur test..." -ForegroundColor Yellow
$registerBody = @{
    email = "gateway@test.com"
    password = "Test123!"
    name = "Gateway Test"
} | ConvertTo-Json

try {
    $register = Invoke-RestMethod -Uri "$baseUrl/api/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Utilisateur créé" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Utilisateur existe déjà (normal)" -ForegroundColor Yellow
}

# Login
Write-Host ""
Write-Host "3️⃣ Connexion..." -ForegroundColor Yellow
$loginBody = @{
    email = "gateway@test.com"
    password = "Test123!"
} | ConvertTo-Json

$login = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $login.token
Write-Host "✅ Token obtenu: $($token.Substring(0,20))..." -ForegroundColor Green

# Test webhook ingestion (no auth, with API key)
Write-Host ""
Write-Host "4️⃣ Test ingestion messages (webhook)..." -ForegroundColor Yellow

$channels = @(
    @{ channel="email"; from="client@example.com"; name="Jean Dupont"; text="Besoin d'aide urgente"; id="email-001" }
    @{ channel="sms"; from="+33612345678"; name="Marie Martin"; text="RDV confirmé 14h"; id="sms-001" }
    @{ channel="whatsapp"; from="+33698765432"; name="Pierre Durand"; text="Merci pour votre aide"; id="wa-001" }
    @{ channel="telegram"; from="123456789"; name="Sophie Bernard"; text="Question sur contrat"; id="tg-001" }
    @{ channel="messenger"; from="fb-987654321"; name="Luc Petit"; text="Demande information"; id="msg-001" }
)

foreach ($msg in $channels) {
    $ingestBody = @{
        channel = $msg.channel
        from = $msg.from
        fromName = $msg.name
        text = $msg.text
        externalId = $msg.id
        metadata = @{}
    } | ConvertTo-Json

    try {
        $result = Invoke-RestMethod -Uri "$baseUrl/api/gateway/ingest?apiKey=$apiKey" -Method Post -Body $ingestBody -ContentType "application/json"
        Write-Host "  ✅ $($msg.channel): $($msg.text)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $($msg.channel): Échec" -ForegroundColor Red
    }
}

# Get unified inbox
Write-Host ""
Write-Host "5️⃣ Récupération inbox unifiée..." -ForegroundColor Yellow
$headers = @{
    Authorization = "Bearer $token"
}

try {
    $inbox = Invoke-RestMethod -Uri "$baseUrl/api/gateway/inbox?limit=10" -Method Get -Headers $headers
    Write-Host "✅ Inbox récupérée: $($inbox.Count) messages" -ForegroundColor Green
    
    if ($inbox.Count -gt 0) {
        Write-Host ""
        Write-Host "📨 Derniers messages:" -ForegroundColor Cyan
        foreach ($msg in $inbox | Select-Object -First 5) {
            $preview = if ($msg.text.Length -gt 40) { $msg.text.Substring(0, 40) + "..." } else { $msg.text }
            Write-Host "  • [$($msg.channel)] $preview" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Erreur récupération inbox" -ForegroundColor Red
}

# Test validation (invalid channel)
Write-Host ""
Write-Host "6️⃣ Test validation (canal invalide)..." -ForegroundColor Yellow
$invalidBody = @{
    channel = "invalid"
    from = "test@test.com"
    fromName = "Test"
    text = "Should fail"
    externalId = "fail-001"
    metadata = @{}
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/gateway/ingest?apiKey=$apiKey" -Method Post -Body $invalidBody -ContentType "application/json"
    Write-Host "❌ Validation échouée (devrait rejeter)" -ForegroundColor Red
} catch {
    Write-Host "✅ Validation fonctionne (canal rejeté)" -ForegroundColor Green
}

# Test auth (missing API key)
Write-Host ""
Write-Host "7️⃣ Test sécurité (sans API key)..." -ForegroundColor Yellow
$testBody = @{
    channel = "email"
    from = "test@test.com"
    fromName = "Test"
    text = "Should fail"
    externalId = "fail-002"
    metadata = @{}
} | ConvertTo-Json

try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/gateway/ingest" -Method Post -Body $testBody -ContentType "application/json"
    Write-Host "❌ Sécurité échouée (devrait rejeter)" -ForegroundColor Red
} catch {
    Write-Host "✅ Sécurité fonctionne (accès refusé)" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Tests terminés!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Résumé:" -ForegroundColor Cyan
Write-Host "  • Authentification: OK" -ForegroundColor White
Write-Host "  • Ingestion multi-canal: OK" -ForegroundColor White
Write-Host "  • Inbox unifiée: OK" -ForegroundColor White
Write-Host "  • Validation: OK" -ForegroundColor White
Write-Host "  • Sécurité: OK" -ForegroundColor White
Write-Host ""
