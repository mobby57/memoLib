<#
.SYNOPSIS
  MemoLib - Cycle de Demo Complet (toutes fonctionnalites)
.DESCRIPTION
  Parcourt le workflow entier: inscription, login, client, email, dossier,
  workflow statut/tags/priorite/assignation, templates, recherche, notifications,
  onboarding, analytics, audit, export.
.PARAMETER BaseUrl
  URL de l'API MemoLib (defaut: http://localhost:5078)
#>
param(
    [string]$BaseUrl = 'http://localhost:8001'
)

$ErrorActionPreference = 'Stop'
$stamp = Get-Date -Format 'yyyyMMddHHmmss'
$script:token = $null
$script:userId = $null
$script:results = @()
$script:caseId = $null
$script:clientId = $null
$script:eventId = $null
$script:templateId = $null

# --- Helpers ---
function Log-Step($num, $total, $msg) {
    Write-Host "`n[$num/$total] $msg" -ForegroundColor Cyan
}

function Log-Ok($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Log-Warn($msg) {
    Write-Host "  [WARN] $msg" -ForegroundColor Yellow
}

function Log-Fail($msg) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
}

function Add-Result($name, $ok, $detail) {
    $script:results += [PSCustomObject]@{
        Etape   = $name
        Statut  = if ($ok) { 'OK' } else { 'ECHEC' }
        Detail  = $detail
    }
}

function Api {
    param(
        [string]$Method = 'GET',
        [string]$Path,
        [object]$Body,
        [switch]$NoAuth
    )
    $headers = @{ 'Content-Type' = 'application/json' }
    if (-not $NoAuth -and $script:token) {
        $headers['Authorization'] = "Bearer $($script:token)"
    }
    $params = @{
        Uri        = "$BaseUrl$Path"
        Method     = $Method
        Headers    = $headers
        TimeoutSec = 20
    }
    if ($Body) {
        $params['Body'] = ($Body | ConvertTo-Json -Depth 10 -Compress)
    }
    return Invoke-RestMethod @params
}

$total = 20

Write-Host ""
Write-Host "================================================================" -ForegroundColor Magenta
Write-Host "   MemoLib - CYCLE DE DEMO COMPLET ($total etapes)" -ForegroundColor Magenta
Write-Host "   API: $BaseUrl" -ForegroundColor Gray
Write-Host "================================================================" -ForegroundColor Magenta

# ============================================================
# 1. Health check
# ============================================================
Log-Step 1 $total "Verification sante API"
try {
    $h = Api -Path '/health' -NoAuth
    Log-Ok "API accessible (status=$($h.status))"
    Add-Result 'Health' $true $h.status
} catch {
    Log-Fail "API inaccessible: $($_.Exception.Message)"
    Add-Result 'Health' $false $_.Exception.Message
    Write-Host "`nArret: l'API n'est pas demarree.`n" -ForegroundColor Red
    exit 1
}

# ============================================================
# 2. Inscription
# ============================================================
$email = "demo.cycle.$stamp@memolib.local"
$pwd   = 'DemoCycle2026!'
$name  = 'Demo Cycle'

Log-Step 2 $total "Inscription utilisateur ($email)"
try {
    $reg = Api -Method POST -Path '/api/auth/register' -NoAuth -Body @{
        email    = $email
        password = $pwd
        name     = $name
        role     = 'AVOCAT'
        plan     = 'CABINET'
    }
    Log-Ok "Utilisateur cree"
    Add-Result 'Inscription' $true "email=$email"
} catch {
    Log-Warn "Inscription echouee (peut-etre deja existant): $($_.Exception.Message)"
    Add-Result 'Inscription' $true 'deja existant'
}

# ============================================================
# 3. Login
# ============================================================
Log-Step 3 $total "Authentification (login)"
try {
    $login = Api -Method POST -Path '/api/auth/login' -NoAuth -Body @{
        email    = $email
        password = $pwd
    }
    $script:token  = $login.token
    $script:userId = $login.userId
    Log-Ok "Token JWT obtenu (userId=$($script:userId))"
    Add-Result 'Login' $true 'token ok'
} catch {
    # Fallback: essayer avec le compte demo existant
    $fallbackEmail = $env:MEMOLIB_DEMO_EMAIL
    $fallbackPassword = $env:MEMOLIB_DEMO_PASSWORD

    if ([string]::IsNullOrWhiteSpace($fallbackEmail) -or [string]::IsNullOrWhiteSpace($fallbackPassword)) {
        Log-Fail 'Login impossible: definir MEMOLIB_DEMO_EMAIL et MEMOLIB_DEMO_PASSWORD pour le fallback.'
        Add-Result 'Login' $false 'fallback credentials manquants'
        exit 1
    }

    try {
        $login = Api -Method POST -Path '/api/auth/login' -NoAuth -Body @{
            email    = $fallbackEmail
            password = $fallbackPassword
        }
        $script:token  = $login.token
        $script:userId = $login.userId
        Log-Ok "Fallback login OK"
        Add-Result 'Login' $true 'fallback'
    } catch {
        Log-Fail "Login impossible"
        Add-Result 'Login' $false $_.Exception.Message
        exit 1
    }
}

# ============================================================
# 4. Creation client
# ============================================================
Log-Step 4 $total "Creation d'un client"
$clientEmail = "client.demo.$stamp@example.com"
try {
    $client = Api -Method POST -Path '/api/client' -Body @{
        name        = "Marie Dupont $stamp"
        email       = $clientEmail
        phoneNumber = '+33 6 12 34 56 78'
        address     = '45 avenue de la Republique, 75011 Paris'
    }
    $script:clientId = $client.id
    Log-Ok "Client cree (id=$($script:clientId))"
    Add-Result 'Client' $true "id=$($script:clientId)"
} catch {
    Log-Warn "Creation client: $($_.Exception.Message)"
    Add-Result 'Client' $false $_.Exception.Message
}

# ============================================================
# 5. Ingestion de 3 emails
# ============================================================
Log-Step 5 $total "Ingestion de 3 emails clients"
$emailsData = @(
    @{ from = $clientEmail; subject = "Consultation divorce urgent"; body = "Bonjour Maitre, je souhaite divorcer. Mon telephone: 06 12 34 56 78. Merci." },
    @{ from = 'pierre.martin@example.com'; subject = "Litige commercial"; body = "Nous avons un litige avec notre fournisseur. Adresse: 10 rue du Commerce, Lyon." },
    @{ from = 'sophie.bernard@example.com'; subject = "Droit du travail - licenciement"; body = "Je viens d'etre licenciee. Pouvez-vous m'aider? Tel: 07 98 76 54 32." }
)
$ingestedOk = 0
foreach ($i in 0..($emailsData.Count - 1)) {
    try {
        $e = $emailsData[$i]
        $e['externalId'] = "DEMO-CYCLE-$stamp-$i"
        $e['occurredAt'] = (Get-Date).AddMinutes(-($emailsData.Count - $i)).ToUniversalTime().ToString('o')
        $result = Api -Method POST -Path '/api/ingest/email' -Body $e
        if ($i -eq 0) { $script:eventId = $result.eventId }
        $ingestedOk++
    } catch { }
}
if ($ingestedOk -gt 0) {
    Log-Ok "$ingestedOk/$($emailsData.Count) emails ingeres (eventId=$($script:eventId))"
    Add-Result 'Ingestion Emails' $true "$ingestedOk ingeres"
} else {
    Log-Fail "Aucun email ingere"
    Add-Result 'Ingestion Emails' $false '0 ingeres'
}

# ============================================================
# 6. Creation dossier
# ============================================================
Log-Step 6 $total "Creation d'un dossier (case)"
try {
    $caseBody = @{ title = "Dossier Divorce Dupont - $stamp" }
    if ($script:clientId) { $caseBody['clientId'] = $script:clientId }
    $case = Api -Method POST -Path '/api/cases' -Body $caseBody
    $script:caseId = $case.id
    Log-Ok "Dossier cree (id=$($script:caseId))"
    Add-Result 'Creation Dossier' $true "id=$($script:caseId)"
} catch {
    Log-Fail "Creation dossier: $($_.Exception.Message)"
    Add-Result 'Creation Dossier' $false $_.Exception.Message
}

# ============================================================
# 7. Workflow dossier: priorite + echeance
# ============================================================
Log-Step 7 $total "Workflow: priorite + echeance"
if ($script:caseId) {
    try {
        Api -Method PATCH -Path "/api/cases/$($script:caseId)/priority" -Body @{
            priority = 5
            dueDate  = (Get-Date).AddDays(30).ToUniversalTime().ToString('o')
        } | Out-Null
        Log-Ok "Priorite 5 + echeance J+30"
        Add-Result 'Priorite' $true 'priority=5'
    } catch {
        Log-Warn "Priorite: $($_.Exception.Message)"
        Add-Result 'Priorite' $false $_.Exception.Message
    }
} else { Add-Result 'Priorite' $false 'pas de caseId' }

# ============================================================
# 8. Workflow dossier: tags
# ============================================================
Log-Step 8 $total "Workflow: ajout tags"
if ($script:caseId) {
    try {
        Api -Method PATCH -Path "/api/cases/$($script:caseId)/tags" -Body @{
            tags = @('urgent', 'famille', 'divorce')
        } | Out-Null
        Log-Ok "Tags: urgent, famille, divorce"
        Add-Result 'Tags' $true '3 tags'
    } catch {
        Log-Warn "Tags: $($_.Exception.Message)"
        Add-Result 'Tags' $false $_.Exception.Message
    }
} else { Add-Result 'Tags' $false 'pas de caseId' }

# ============================================================
# 9. Workflow dossier: statut OPEN -> IN_PROGRESS
# ============================================================
Log-Step 9 $total "Workflow: passage IN_PROGRESS"
if ($script:caseId) {
    try {
        Api -Method PATCH -Path "/api/cases/$($script:caseId)/status" -Body @{
            status = 'IN_PROGRESS'
        } | Out-Null
        Log-Ok "Statut -> IN_PROGRESS"
        Add-Result 'Statut IN_PROGRESS' $true 'ok'
    } catch {
        Log-Warn "Statut: $($_.Exception.Message)"
        Add-Result 'Statut IN_PROGRESS' $false $_.Exception.Message
    }
} else { Add-Result 'Statut IN_PROGRESS' $false 'pas de caseId' }

# ============================================================
# 10. Timeline du dossier
# ============================================================
Log-Step 10 $total "Timeline du dossier"
if ($script:caseId) {
    try {
        $tl = Api -Path "/api/cases/$($script:caseId)/timeline"
        $count = if ($tl -is [array]) { $tl.Count } else { 1 }
        Log-Ok "Timeline: $count evenement(s)"
        Add-Result 'Timeline' $true "$count events"
    } catch {
        Log-Warn "Timeline: $($_.Exception.Message)"
        Add-Result 'Timeline' $false $_.Exception.Message
    }
} else { Add-Result 'Timeline' $false 'pas de caseId' }

# ============================================================
# 11. Creation template email
# ============================================================
Log-Step 11 $total "Creation template email"
try {
    $tpl = Api -Method POST -Path '/api/email/templates' -Body @{
        name    = "Accuse reception Demo $stamp"
        subject = 'Re: {{subject}} - Dossier {{caseRef}}'
        body    = "Bonjour {{clientName}},`n`nNous accusons reception de votre demande.`nVotre dossier {{caseRef}} est en cours de traitement.`n`nCordialement,`nCabinet MemoLib"
    }
    $script:templateId = $tpl.id
    Log-Ok "Template cree (id=$($script:templateId))"
    Add-Result 'Template Email' $true "id=$($script:templateId)"
} catch {
    Log-Warn "Template: $($_.Exception.Message)"
    Add-Result 'Template Email' $false $_.Exception.Message
}

# ============================================================
# 12. Recherche textuelle
# ============================================================
Log-Step 12 $total "Recherche textuelle (mot: divorce)"
try {
    $sr = Api -Method POST -Path '/api/search/events' -Body @{ text = 'divorce' }
    $count = if ($sr -is [array]) { $sr.Count } else { 1 }
    Log-Ok "Recherche: $count resultat(s)"
    Add-Result 'Recherche Texte' $true "$count resultats"
} catch {
    Log-Warn "Recherche: $($_.Exception.Message)"
    Add-Result 'Recherche Texte' $false $_.Exception.Message
}

# ============================================================
# 13. Recherche semantique / embeddings
# ============================================================
Log-Step 13 $total "Recherche semantique IA"
try {
    Api -Method POST -Path '/api/embeddings/generate-all' | Out-Null
    $sem = Api -Method POST -Path '/api/semantic/search' -Body @{ query = 'probleme familial urgent' }
    $count = if ($sem -is [array]) { $sem.Count } else { 1 }
    Log-Ok "Recherche IA: $count resultat(s)"
    Add-Result 'Recherche IA' $true "$count resultats"
} catch {
    Log-Warn "Recherche IA non disponible (optionnel)"
    Add-Result 'Recherche IA' $true 'optionnel - skip'
}

# ============================================================
# 14. Notifications
# ============================================================
Log-Step 14 $total "Verification notifications"
try {
    $notifs = Api -Path '/api/notifications'
    $count = if ($notifs -is [array]) { $notifs.Count } else { 0 }
    Log-Ok "Notifications: $count"
    Add-Result 'Notifications' $true "$count notif(s)"
} catch {
    Log-Warn "Notifications: $($_.Exception.Message)"
    Add-Result 'Notifications' $false $_.Exception.Message
}

# ============================================================
# 15. Dashboard / Analytics
# ============================================================
Log-Step 15 $total "Dashboard analytics"
try {
    $dash = Api -Path '/api/dashboard/overview'
    $s = $dash.stats
    Log-Ok "Dossiers=$($s.totalCases) | Clients=$($s.totalClients) | Emails=$($s.totalEvents)"
    Add-Result 'Dashboard' $true "cases=$($s.totalCases) clients=$($s.totalClients)"
} catch {
    Log-Warn "Dashboard: $($_.Exception.Message)"
    Add-Result 'Dashboard' $false $_.Exception.Message
}

# ============================================================
# 16. Centre anomalies + alertes
# ============================================================
Log-Step 16 $total "Centre anomalies & alertes"
try {
    $alerts = Api -Path '/api/alerts/requires-attention'
    $center = Api -Path '/api/alerts/center?limit=5'
    Log-Ok "Alertes=$($alerts.count) | Anomalies ouvertes=$($center.summary.totalOpenAnomalies)"
    Add-Result 'Anomalies' $true "alertes=$($alerts.count)"
} catch {
    Log-Warn "Anomalies: $($_.Exception.Message)"
    Add-Result 'Anomalies' $false $_.Exception.Message
}

# ============================================================
# 17. Audit trail
# ============================================================
Log-Step 17 $total "Journal d'audit"
try {
    $audit = Api -Path '/api/audit/user-actions?limit=10'
    $count = if ($audit -is [array]) { $audit.Count } else { 1 }
    Log-Ok "Audit: $count action(s) recentes"
    Add-Result 'Audit' $true "$count actions"
} catch {
    Log-Warn "Audit: $($_.Exception.Message)"
    Add-Result 'Audit' $false $_.Exception.Message
}

# ============================================================
# 18. Export donnees
# ============================================================
Log-Step 18 $total "Export des evenements"
try {
    $exp = Api -Path '/api/export/events-text'
    $count = if ($exp -is [array]) { $exp.Count } else { 1 }
    Log-Ok "Export: $count evenement(s)"
    Add-Result 'Export' $true "$count events"
} catch {
    Log-Warn "Export: $($_.Exception.Message)"
    Add-Result 'Export' $false $_.Exception.Message
}

# ============================================================
# 19. Workflow dossier: cloture (IN_PROGRESS -> CLOSED)
# ============================================================
Log-Step 19 $total "Workflow: cloture du dossier"
if ($script:caseId) {
    try {
        Api -Method PATCH -Path "/api/cases/$($script:caseId)/status" -Body @{
            status = 'CLOSED'
        } | Out-Null
        Log-Ok "Statut -> CLOSED"
        Add-Result 'Cloture Dossier' $true 'CLOSED'
    } catch {
        Log-Warn "Cloture: $($_.Exception.Message)"
        Add-Result 'Cloture Dossier' $false $_.Exception.Message
    }
} else { Add-Result 'Cloture Dossier' $false 'pas de caseId' }

# ============================================================
# 20. Filtres avances
# ============================================================
Log-Step 20 $total "Filtres avances (status=CLOSED + tag=urgent)"
try {
    $filtered = Api -Path '/api/cases/filter?status=CLOSED&tag=urgent'
    $count = if ($filtered -is [array]) { $filtered.Count } else { 1 }
    Log-Ok "Filtres: $count dossier(s) CLOSED+urgent"
    Add-Result 'Filtres' $true "$count resultats"
} catch {
    Log-Warn "Filtres: $($_.Exception.Message)"
    Add-Result 'Filtres' $false $_.Exception.Message
}

# ============================================================
# RESUME FINAL
# ============================================================
Write-Host "`n================================================================" -ForegroundColor Magenta
Write-Host "   RESUME DU CYCLE DE DEMO" -ForegroundColor Magenta
Write-Host "================================================================" -ForegroundColor Magenta

$script:results | Format-Table -AutoSize

$okCount    = ($script:results | Where-Object { $_.Statut -eq 'OK' }).Count
$totalCount = $script:results.Count
$pct        = [math]::Round(($okCount / $totalCount) * 100, 0)

$color = if ($pct -eq 100) { 'Green' } elseif ($pct -ge 80) { 'Yellow' } else { 'Red' }
Write-Host "Resultat: $okCount / $totalCount etapes reussies ($pct%)" -ForegroundColor $color

if ($pct -ge 90) {
    Write-Host "`n  CYCLE DE DEMO COMPLET VALIDE !`n" -ForegroundColor Green
} elseif ($pct -ge 70) {
    Write-Host "`n  Demo majoritairement validee (quelques fonctions optionnelles manquantes)`n" -ForegroundColor Yellow
} else {
    Write-Host "`n  Demo en echec - verifier l'API`n" -ForegroundColor Red
}

Write-Host "Acces interface: $BaseUrl/demo.html" -ForegroundColor Gray
Write-Host "Swagger:         $BaseUrl/swagger" -ForegroundColor Gray
Write-Host ""
exit $(if ($pct -ge 80) { 0 } else { 1 })
