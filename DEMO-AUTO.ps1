# MEMOLIB - DEMO AUTOMATIQUE ADAPTEE
# Script de demonstration complete avec donnees de test

param(
    [switch]$Quick,
    [switch]$Full
)

$API_URL = "http://localhost:5078"
$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MEMOLIB - DEMO AUTOMATIQUE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verification API
Write-Host "Verification de l'API..." -NoNewline
try {
    $health = Invoke-RestMethod -Uri "$API_URL/health" -Method Get -TimeoutSec 5
    Write-Host " OK" -ForegroundColor Green
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host ""
    Write-Host "L'API n'est pas demarree. Lancez d'abord:" -ForegroundColor Yellow
    Write-Host "  .\START.bat" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ETAPE 1: CREATION COMPTE DEMO" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

# Creer un utilisateur de demo
$timestamp = Get-Date -Format "HHmmss"
$demoUser = @{
    email = "demo$timestamp@memolib.fr"
    password = "Demo123456!"
    fullName = "Maitre Dupont (Demo)"
}

Write-Host "Creation du compte: $($demoUser.email)..." -NoNewline
try {
    $registerResponse = Invoke-RestMethod -Uri "$API_URL/api/auth/register" -Method Post -Body ($demoUser | ConvertTo-Json) -ContentType "application/json"
    Write-Host " OK" -ForegroundColor Green
    Write-Host "  Token: $($registerResponse.token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host " ERREUR" -ForegroundColor Red
    Write-Host "  $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$token = $registerResponse.token
$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ETAPE 2: CREATION CLIENTS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$clients = @(
    @{
        fullName = "Jean Martin"
        email = "jean.martin@example.com"
        phone = "0601020304"
        address = "15 rue de la Paix, 75002 Paris"
    },
    @{
        fullName = "Marie Dubois"
        email = "marie.dubois@example.com"
        phone = "0612345678"
        address = "28 avenue des Champs, 75008 Paris"
    },
    @{
        fullName = "Pierre Durand"
        email = "pierre.durand@example.com"
        phone = "0623456789"
        address = "42 boulevard Saint-Germain, 75006 Paris"
    }
)

$clientIds = @()
foreach ($client in $clients) {
    Write-Host "Creation client: $($client.fullName)..." -NoNewline
    try {
        $clientResponse = Invoke-RestMethod -Uri "$API_URL/api/client" -Method Post -Body ($client | ConvertTo-Json) -Headers $headers
        $clientIds += $clientResponse.id
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERREUR" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Yellow
Write-Host "ETAPE 3: CREATION DOSSIERS" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Yellow
Write-Host ""

$cases = @(
    @{
        title = "Divorce amiable - Martin"
        clientId = $clientIds[0]
        description = "Procedure de divorce par consentement mutuel"
    },
    @{
        title = "Succession - Dubois"
        clientId = $clientIds[1]
        description = "Reglement succession familiale"
    },
    @{
        title = "Litige commercial - Durand"
        clientId = $clientIds[2]
        description = "Contentieux avec fournisseur"
    }
)

$caseIds = @()
foreach ($case in $cases) {
    Write-Host "Creation dossier: $($case.title)..." -NoNewline
    try {
        $caseResponse = Invoke-RestMethod -Uri "$API_URL/api/cases" -Method Post -Body ($case | ConvertTo-Json) -Headers $headers
        $caseIds += $caseResponse.id
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERREUR" -ForegroundColor Yellow
    }
}

if (-not $Quick) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "ETAPE 4: AJOUT TAGS ET PRIORITES" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""

    # Tags pour dossier 1
    Write-Host "Ajout tags dossier 1..." -NoNewline
    try {
        $tags = @{ tags = @("urgent", "famille", "divorce") }
        Invoke-RestMethod -Uri "$API_URL/api/cases/$($caseIds[0])/tags" -Method Patch -Body ($tags | ConvertTo-Json) -Headers $headers | Out-Null
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERREUR" -ForegroundColor Yellow
    }

    # Priorite pour dossier 1
    Write-Host "Definition priorite dossier 1..." -NoNewline
    try {
        $priority = @{ priority = 5; dueDate = (Get-Date).AddDays(30).ToString("yyyy-MM-dd") }
        Invoke-RestMethod -Uri "$API_URL/api/cases/$($caseIds[0])/priority" -Method Patch -Body ($priority | ConvertTo-Json) -Headers $headers | Out-Null
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERREUR" -ForegroundColor Yellow
    }

    # Tags pour dossier 2
    Write-Host "Ajout tags dossier 2..." -NoNewline
    try {
        $tags = @{ tags = @("succession", "famille") }
        Invoke-RestMethod -Uri "$API_URL/api/cases/$($caseIds[1])/tags" -Method Patch -Body ($tags | ConvertTo-Json) -Headers $headers | Out-Null
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERREUR" -ForegroundColor Yellow
    }

    # Priorite pour dossier 2
    Write-Host "Definition priorite dossier 2..." -NoNewline
    try {
        $priority = @{ priority = 3; dueDate = (Get-Date).AddDays(60).ToString("yyyy-MM-dd") }
        Invoke-RestMethod -Uri "$API_URL/api/cases/$($caseIds[1])/priority" -Method Patch -Body ($priority | ConvertTo-Json) -Headers $headers | Out-Null
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERREUR" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "ETAPE 5: CHANGEMENT STATUTS" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""

    # Passer dossier 1 en IN_PROGRESS
    Write-Host "Dossier 1 -> IN_PROGRESS..." -NoNewline
    try {
        $status = @{ status = "IN_PROGRESS" }
        Invoke-RestMethod -Uri "$API_URL/api/cases/$($caseIds[0])/status" -Method Patch -Body ($status | ConvertTo-Json) -Headers $headers | Out-Null
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERREUR" -ForegroundColor Yellow
    }

    # Passer dossier 2 en IN_PROGRESS
    Write-Host "Dossier 2 -> IN_PROGRESS..." -NoNewline
    try {
        $status = @{ status = "IN_PROGRESS" }
        Invoke-RestMethod -Uri "$API_URL/api/cases/$($caseIds[1])/status" -Method Patch -Body ($status | ConvertTo-Json) -Headers $headers | Out-Null
        Write-Host " OK" -ForegroundColor Green
    } catch {
        Write-Host " ERREUR" -ForegroundColor Yellow
    }
}

if ($Full) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "ETAPE 6: CREATION TEMPLATES EMAIL" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host ""

    $templates = @(
        @{
            name = "Accuse de reception"
            subject = "Accuse de reception - Votre dossier"
            body = "Bonjour,\n\nNous avons bien recu votre demande et l'etudions actuellement.\n\nCordialement,\nMaitre Dupont"
        },
        @{
            name = "Demande de documents"
            subject = "Documents necessaires"
            body = "Bonjour,\n\nPour avancer sur votre dossier, nous aurions besoin des documents suivants:\n- Piece d'identite\n- Justificatif de domicile\n\nCordialement,\nMaitre Dupont"
        }
    )

    foreach ($template in $templates) {
        Write-Host "Creation template: $($template.name)..." -NoNewline
        try {
            Invoke-RestMethod -Uri "$API_URL/api/email/templates" -Method Post -Body ($template | ConvertTo-Json) -Headers $headers | Out-Null
            Write-Host " OK" -ForegroundColor Green
        } catch {
            Write-Host " ERREUR" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEMO TERMINEE AVEC SUCCES!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "DONNEES CREEES:" -ForegroundColor Cyan
Write-Host "  Utilisateur: $($demoUser.email)" -ForegroundColor White
Write-Host "  Mot de passe: $($demoUser.password)" -ForegroundColor White
Write-Host "  Clients: $($clients.Count)" -ForegroundColor White
Write-Host "  Dossiers: $($cases.Count)" -ForegroundColor White
if (-not $Quick) {
    Write-Host "  Tags: Configures" -ForegroundColor White
    Write-Host "  Priorites: Configurees" -ForegroundColor White
}
if ($Full) {
    Write-Host "  Templates: $($templates.Count)" -ForegroundColor White
}

Write-Host ""
Write-Host "ACCES:" -ForegroundColor Cyan
Write-Host "  Interface: http://localhost:5078/demo.html" -ForegroundColor White
Write-Host "  Email: $($demoUser.email)" -ForegroundColor White
Write-Host "  Mot de passe: $($demoUser.password)" -ForegroundColor White

Write-Host ""
Write-Host "Ouvrez l'interface et connectez-vous avec ces identifiants!" -ForegroundColor Yellow
Write-Host ""

# Ouvrir automatiquement le navigateur
Start-Process "http://localhost:5078/demo.html"
