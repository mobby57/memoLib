#!/usr/bin/env pwsh
# Script d'exécution automatique des scénarios

param(
    [ValidateSet("avocat", "medecin", "consultant", "comptable", "architecte", "immobilier", "complet", "stress")]
    [string]$Scenario = "avocat",
    [string]$ApiUrl = "http://localhost:5078"
)

Write-Host "🎬 EXÉCUTION SCÉNARIO: $($Scenario.ToUpper())" -ForegroundColor Cyan
Write-Host ""

function Send-Email {
    param($From, $To, $Subject, $Body)
    
    $email = @{
        from = $From
        to = $To
        subject = $Subject
        body = $Body
        receivedAt = (Get-Date).ToString("o")
    } | ConvertTo-Json
    
    try {
        Invoke-RestMethod -Uri "$ApiUrl/api/ingest/email" -Method Post -Body $email -ContentType "application/json" -ErrorAction Stop
        Write-Host "✅ Email envoyé: $Subject" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "❌ Erreur: $_" -ForegroundColor Red
        return $false
    }
}

# SCÉNARIO AVOCAT
if ($Scenario -eq "avocat") {
    Write-Host "📧 Minute 1: Email initial..." -ForegroundColor Yellow
    Send-Email -From "marie.dubois@example.com" -To "sarraboudjellal57+legal@gmail.com" -Subject "URGENT - Demande divorce" -Body @"
Bonjour Maître,

Je souhaite entamer une procédure de divorce en urgence.
Mon conjoint a vidé nos comptes bancaires hier.

Coordonnées:
Marie Dubois
06 12 34 56 78
15 rue de la Paix, 75001 Paris

Merci de me rappeler rapidement.
"@
    
    Start-Sleep -Seconds 3
    
    Write-Host "📱 Minute 3: SMS de relance..." -ForegroundColor Yellow
    Send-Email -From "marie.dubois@example.com" -To "sarraboudjellal57+legal@gmail.com" -Subject "SMS: Relance urgente" -Body "Maître, c'est Marie Dubois. Avez-vous reçu mon email? C'est très urgent!"
    
    Start-Sleep -Seconds 3
    
    Write-Host "💬 Minute 5: WhatsApp..." -ForegroundColor Yellow
    Send-Email -From "marie.dubois@example.com" -To "sarraboudjellal57+legal@gmail.com" -Subject "WhatsApp: Question" -Body "Bonjour, je peux passer à votre cabinet cet après-midi?"
}

# SCÉNARIO MÉDECIN
elseif ($Scenario -eq "medecin") {
    Write-Host "📧 Email RDV..." -ForegroundColor Yellow
    Send-Email -From "jean.martin@example.com" -To "sarraboudjellal57+medical@gmail.com" -Subject "Demande rendez-vous" -Body @"
Bonjour Docteur,

Je souhaite prendre RDV pour des douleurs abdominales depuis 3 jours.

Jean Martin
06 98 76 54 32
Mutuelle: MGEN
"@
    
    Start-Sleep -Seconds 3
    
    Write-Host "📱 Telegram urgent..." -ForegroundColor Yellow
    Send-Email -From "jean.martin@example.com" -To "sarraboudjellal57+medical@gmail.com" -Subject "Telegram: Urgent" -Body "Docteur, les douleurs s'aggravent. Possible aujourd'hui?"
}

# SCÉNARIO CONSULTANT
elseif ($Scenario -eq "consultant") {
    Write-Host "📧 Email prospect..." -ForegroundColor Yellow
    Send-Email -From "sophie.bernard@techcorp.fr" -To "sarraboudjellal57+consulting@gmail.com" -Subject "Transformation digitale PME" -Body @"
Bonjour,

Nous cherchons consultant pour accompagner notre transformation digitale.
Budget: 50k€
Délai: 6 mois

Sophie Bernard
Directrice - TechCorp SAS
sophie.bernard@techcorp.fr
01 23 45 67 89
"@
    
    Start-Sleep -Seconds 3
    
    Write-Host "💼 LinkedIn message..." -ForegroundColor Yellow
    Send-Email -From "sophie.bernard@techcorp.fr" -To "sarraboudjellal57+consulting@gmail.com" -Subject "LinkedIn: Suivi" -Body "J'ai envoyé un email. Disponible pour call cette semaine?"
}

# SCÉNARIO COMPLET
elseif ($Scenario -eq "complet") {
    Write-Host "🎯 Envoi multi-secteur..." -ForegroundColor Yellow
    
    Send-Email -From "marie.dubois@example.com" -To "sarraboudjellal57+legal@gmail.com" -Subject "URGENT - Divorce" -Body "Demande divorce urgente"
    Start-Sleep -Seconds 1
    
    Send-Email -From "jean.martin@example.com" -To "sarraboudjellal57+medical@gmail.com" -Subject "RDV médecin" -Body "Besoin RDV urgent"
    Start-Sleep -Seconds 1
    
    Send-Email -From "sophie.bernard@techcorp.fr" -To "sarraboudjellal57+consulting@gmail.com" -Subject "Projet digital" -Body "Nouveau projet 50k€"
    Start-Sleep -Seconds 1
    
    Send-Email -From "pierre.leroy@example.com" -To "sarraboudjellal57+accounting@gmail.com" -Subject "Déclaration TVA" -Body "Urgent - TVA demain"
    Start-Sleep -Seconds 1
    
    Send-Email -From "famille.rousseau@example.com" -To "sarraboudjellal57+architecture@gmail.com" -Subject "Extension maison" -Body "Projet extension 30m²"
    Start-Sleep -Seconds 1
    
    Send-Email -From "thomas.petit@example.com" -To "sarraboudjellal57+realty@gmail.com" -Subject "Visite appartement" -Body "Intéressé appartement Lyon 6"
}

# SCÉNARIO STRESS TEST
elseif ($Scenario -eq "stress") {
    Write-Host "🔥 Lancement stress test..." -ForegroundColor Red
    & "$PSScriptRoot\demo-stress-test.ps1" -Count 50 -ApiUrl $ApiUrl
    return
}

Write-Host ""
Write-Host "✅ Scénario $Scenario terminé!" -ForegroundColor Green
Write-Host "🌐 Vérifiez les résultats: $ApiUrl/demo-pro.html" -ForegroundColor White
