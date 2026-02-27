#!/usr/bin/env pwsh
# Script de stress test - Envoi massif de messages

param(
    [int]$Count = 50,
    [string]$ApiUrl = "http://localhost:5078"
)

Write-Host "🔥 STRESS TEST MEMOLIB" -ForegroundColor Red
Write-Host "📊 Envoi de $Count messages..." -ForegroundColor Yellow
Write-Host ""

# Données de test
$sectors = @("legal", "medical", "consulting", "accounting", "architecture", "realty")
$firstNames = @("Marie", "Jean", "Sophie", "Pierre", "Claire", "Thomas", "Julie", "Marc", "Emma", "Lucas")
$lastNames = @("Dubois", "Martin", "Bernard", "Petit", "Robert", "Richard", "Durand", "Leroy", "Moreau", "Simon")
$subjects = @(
    "URGENT - Besoin d'aide",
    "Demande de rendez-vous",
    "Question importante",
    "Nouveau projet",
    "Demande d'information",
    "Suivi dossier",
    "Confirmation",
    "Documents à envoyer",
    "Problème urgent",
    "Consultation"
)

# Compteurs
$success = 0
$failed = 0
$startTime = Get-Date

# Boucle d'envoi
for ($i = 1; $i -le $Count; $i++) {
    $firstName = $firstNames | Get-Random
    $lastName = $lastNames | Get-Random
    $sector = $sectors | Get-Random
    $subject = $subjects | Get-Random
    $phone = "06 {0:D2} {1:D2} {2:D2} {3:D2}" -f (Get-Random -Min 10 -Max 99), (Get-Random -Min 10 -Max 99), (Get-Random -Min 10 -Max 99), (Get-Random -Min 10 -Max 99)
    
    $email = @{
        from = "$firstName.$lastName@example.com"
        to = "sarraboudjellal57+$sector@gmail.com"
        subject = "$subject #$i"
        body = @"
Bonjour,

Message de test automatique #$i

Coordonnées:
$firstName $lastName
$phone
$(Get-Random -Min 1 -Max 100) rue de la Paix, 75001 Paris

Cordialement
"@
        receivedAt = (Get-Date).ToString("o")
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$ApiUrl/api/ingest/email" -Method Post -Body $email -ContentType "application/json" -ErrorAction Stop
        $success++
        Write-Host "✅ [$i/$Count] Message envoyé: $firstName $lastName" -ForegroundColor Green
    } catch {
        $failed++
        Write-Host "❌ [$i/$Count] Erreur: $_" -ForegroundColor Red
    }
    
    # Pause pour éviter surcharge
    if ($i % 10 -eq 0) {
        Start-Sleep -Milliseconds 500
    }
}

$endTime = Get-Date
$duration = ($endTime - $startTime).TotalSeconds

Write-Host ""
Write-Host "📊 RÉSULTATS STRESS TEST" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "✅ Succès: $success" -ForegroundColor Green
Write-Host "❌ Échecs: $failed" -ForegroundColor Red
Write-Host "⏱️  Durée: $([math]::Round($duration, 2))s" -ForegroundColor Yellow
Write-Host "📈 Débit: $([math]::Round($Count / $duration, 2)) msg/s" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Vérifiez les résultats sur: $ApiUrl/demo-pro.html" -ForegroundColor White
