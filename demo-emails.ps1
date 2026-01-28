# ============================================
# DEMO EMAIL TEST - memoLib
# ============================================
# Usage: .\demo-emails.ps1
# Prerequis: npm run dev doit etre lance
# ============================================

$baseUrl = "http://localhost:3000/api/webhooks/email"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   DEMO EMAILS - memoLib" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$emails = @(
    @{
        from = "oqtf.jean.dupont@gmail.com"
        subject = "URGENT - OQTF recu hier"
        body = "Bonjour Maitre, Jai recu une OQTF hier datee du 24 janvier 2026. Jai 30 jours pour faire appel. Mon numero de dossier prefecture est 2026-OQTF-75-12345. Je suis desespere, pouvez-vous maider? Cordialement, Jean Dupont. Tel: 06 12 34 56 78"
        type = "OQTF"
    },
    @{
        from = "marie.martin@yahoo.fr"
        subject = "Demande de visa long sejour conjoint"
        body = "Bonjour, Je suis Marie Martin, de nationalite bresilienne. Je souhaite obtenir un visa long sejour pour rejoindre mon mari francais a Paris. Nous sommes maries depuis 2024. Pouvez-vous mexpliquer la procedure? Mon passeport numero BR123456789. Merci."
        type = "VISA"
    },
    @{
        from = "ahmed.naturalisation@outlook.com"
        subject = "Dossier naturalisation francaise"
        body = "Bonjour Maitre, Je reside en France depuis 10 ans avec un titre de sejour. Je travaille comme ingenieur et je parle francais couramment. Je souhaite deposer un dossier de naturalisation. Quels documents dois-je preparer? Ahmed Ben Ali"
        type = "NATURALISATION"
    },
    @{
        from = "famille.regroupement@gmail.com"
        subject = "Regroupement familial - question procedure"
        body = "Bonjour, Je suis titulaire dune carte de resident et je souhaite faire venir ma femme et mes 2 enfants du Maroc. Pouvez-vous mexpliquer les conditions et les delais? Mon numero etranger: 1234567890. Merci davance."
        type = "REGROUPEMENT FAMILIAL"
    },
    @{
        from = "etudiant.titre@hotmail.com"
        subject = "Changement de statut etudiant vers salarie"
        body = "Bonjour, Je termine mon Master en informatique en juin 2026. Jai une promesse dembauche dune entreprise francaise. Comment faire pour changer mon titre de sejour etudiant vers salarie? Urgent car mon titre expire en aout. Li Wei Chen"
        type = "CHANGEMENT STATUT"
    }
)

$success = 0
$failed = 0

foreach ($email in $emails) {
    Write-Host "[$($email.type)] Envoi: $($email.subject)..." -ForegroundColor Yellow
    
    $body = @{
        from = $email.from
        to = "cabinet@iaposte.fr"
        subject = $email.subject
        body = $email.body
        attachments = @()
    } | ConvertTo-Json -Compress
    
    try {
        $response = Invoke-RestMethod -Uri $baseUrl -Method POST -Body $body -ContentType "application/json" -TimeoutSec 30
        Write-Host "   [OK] Email traite avec succes" -ForegroundColor Green
        $success++
    }
    catch {
        Write-Host "   [ERREUR] $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "   RESULTATS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Reussis: $success" -ForegroundColor Green
Write-Host "   Echecs:  $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Ouvrez le dashboard pour voir les resultats:" -ForegroundColor White
Write-Host "   http://localhost:3000/admin/email-monitoring" -ForegroundColor Cyan
Write-Host ""
