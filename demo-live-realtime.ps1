Write-Host "🎬 DÉMO LIVE - RÉCEPTION & TRAITEMENT EN TEMPS RÉEL" -ForegroundColor Cyan
Write-Host ""

# Configuration
$apiUrl = "http://localhost:5078"
$appUrl = "http://localhost:5078/app.html"
$adminUrl = "http://localhost:8091"

# Vérifier que l'API est démarrée
Write-Host "🔍 Vérification système..." -ForegroundColor Yellow
try {
    $health = Invoke-RestMethod -Uri "$apiUrl/health" -Method Get -TimeoutSec 5
    Write-Host "✅ API opérationnelle" -ForegroundColor Green
} catch {
    Write-Host "❌ API non accessible!" -ForegroundColor Red
    Write-Host "Lancez d'abord: .\start.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "📱 CANAUX CONFIGURÉS:" -ForegroundColor Cyan
Write-Host "  📧 Email: sarraboudjellal57+[secteur]@gmail.com" -ForegroundColor White
Write-Host "  📱 SMS/WhatsApp/Signal: +33603983709" -ForegroundColor White
Write-Host ""

Write-Host "🎯 SECTEURS DISPONIBLES:" -ForegroundColor Cyan
Write-Host "  1. legal (Avocat)" -ForegroundColor White
Write-Host "  2. medical (Médecin)" -ForegroundColor White
Write-Host "  3. consulting (Consultant)" -ForegroundColor White
Write-Host "  4. accounting (Comptable)" -ForegroundColor White
Write-Host "  5. architecture (Architecte)" -ForegroundColor White
Write-Host "  6. realty (Immobilier)" -ForegroundColor White
Write-Host ""

$secteur = Read-Host "Choisissez un secteur (1-6)"

$secteurMap = @{
    "1" = @{ name="legal"; label="Avocat"; email="sarraboudjellal57+legal@gmail.com" }
    "2" = @{ name="medical"; label="Médecin"; email="sarraboudjellal57+medical@gmail.com" }
    "3" = @{ name="consulting"; label="Consultant"; email="sarraboudjellal57+consulting@gmail.com" }
    "4" = @{ name="accounting"; label="Comptable"; email="sarraboudjellal57+accounting@gmail.com" }
    "5" = @{ name="architecture"; label="Architecte"; email="sarraboudjellal57+architecture@gmail.com" }
    "6" = @{ name="realty"; label="Immobilier"; email="sarraboudjellal57+realty@gmail.com" }
}

$config = $secteurMap[$secteur]
if (-not $config) {
    Write-Host "❌ Choix invalide" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎯 SCÉNARIO: $($config.label)" -ForegroundColor Green
Write-Host ""

# Ouvrir les interfaces
Write-Host "🌐 Ouverture des interfaces..." -ForegroundColor Yellow
Start-Process $appUrl
Start-Process $adminUrl
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host "  ÉTAPE 1: ENVOI EMAIL" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host ""

Write-Host "📧 Envoyez cet email depuis votre Gmail/téléphone:" -ForegroundColor Cyan
Write-Host ""
Write-Host "À: $($config.email)" -ForegroundColor White
Write-Host "Sujet: URGENT - Demande $($config.label)" -ForegroundColor White
Write-Host ""
Write-Host "Corps suggéré:" -ForegroundColor White

switch ($secteur) {
    "1" {
        Write-Host @"
Bonjour Maître,

Je souhaite entamer une procédure de divorce en urgence.
Mon conjoint a vidé nos comptes bancaires hier.

Marie Dubois
06 12 34 56 78
15 rue de la Paix, 75001 Paris

Merci de me rappeler rapidement.
"@ -ForegroundColor Gray
    }
    "2" {
        Write-Host @"
Bonjour Docteur,

Je souhaite prendre RDV pour des douleurs abdominales depuis 3 jours.

Jean Martin
06 98 76 54 32
Mutuelle: MGEN
"@ -ForegroundColor Gray
    }
    "3" {
        Write-Host @"
Bonjour,

Nous cherchons consultant pour transformation digitale.
Budget: 50k€, Délai: 6 mois

Sophie Bernard
Directrice - TechCorp SAS
01 23 45 67 89
"@ -ForegroundColor Gray
    }
    "4" {
        Write-Host @"
Bonjour,

J'ai oublié ma déclaration TVA qui est due demain!
Pouvez-vous m'aider en urgence?

Pierre Leroy
SARL Leroy & Fils
"@ -ForegroundColor Gray
    }
    "5" {
        Write-Host @"
Bonjour,

Nous souhaitons agrandir notre maison (30m²).
Besoin plans + dépôt permis de construire.

Famille Rousseau
12 chemin des Vignes, 69000 Lyon
"@ -ForegroundColor Gray
    }
    "6" {
        Write-Host @"
Bonjour,

Intéressé par l'appartement ref: LY6-2025-042
Disponible samedi matin?

Thomas Petit
06 11 22 33 44
"@ -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "⏳ Envoyez l'email maintenant..." -ForegroundColor Yellow
Read-Host "Appuyez sur Entrée après l'envoi"

Write-Host ""
Write-Host "🔄 Monitoring réception (60 secondes)..." -ForegroundColor Yellow
Write-Host ""

# Monitoring en temps réel
$startTime = Get-Date
$timeout = 60
$found = $false

while (((Get-Date) - $startTime).TotalSeconds -lt $timeout -and -not $found) {
    try {
        $elapsed = [int]((Get-Date) - $startTime).TotalSeconds
        Write-Host "`r⏱️  $elapsed s - Vérification..." -NoNewline -ForegroundColor Cyan
        
        # Vérifier si email reçu (via API stats)
        $stats = Invoke-RestMethod -Uri "$apiUrl/api/debug/stats" -Method Get -ErrorAction SilentlyContinue
        
        if ($stats.totalEvents -gt 0) {
            $found = $true
            Write-Host ""
            Write-Host ""
            Write-Host "✅ EMAIL REÇU!" -ForegroundColor Green
            Write-Host ""
            Write-Host "📊 DÉTECTION AUTOMATIQUE:" -ForegroundColor Yellow
            Write-Host "  • Événements: $($stats.totalEvents)" -ForegroundColor White
            Write-Host "  • Dossiers: $($stats.totalCases)" -ForegroundColor White
            Write-Host "  • Clients: Créé automatiquement" -ForegroundColor White
            break
        }
        
        Start-Sleep -Seconds 3
    } catch {
        Start-Sleep -Seconds 3
    }
}

if (-not $found) {
    Write-Host ""
    Write-Host ""
    Write-Host "⚠️  Timeout - Email pas encore reçu" -ForegroundColor Yellow
    Write-Host "Vérifiez manuellement dans l'interface" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host "  ÉTAPE 2: VÉRIFICATION INTERFACE" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host ""

Write-Host "🖥️  Dans l'interface $appUrl :" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Onglet INBOX" -ForegroundColor White
Write-Host "   → Voir le message reçu" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Onglet CLIENTS" -ForegroundColor White
Write-Host "   → Voir le client créé automatiquement" -ForegroundColor Gray
Write-Host "   → Coordonnées extraites (téléphone, adresse)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Onglet CASES" -ForegroundColor White
Write-Host "   → Voir le dossier créé automatiquement" -ForegroundColor Gray
Write-Host "   → Cliquer pour voir la timeline" -ForegroundColor Gray
Write-Host ""

Read-Host "Appuyez sur Entrée pour continuer"

Write-Host ""
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host "  ÉTAPE 3: ENVOI SMS (OPTIONNEL)" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host ""

$sendSms = Read-Host "Voulez-vous envoyer un SMS de relance? (o/n)"

if ($sendSms -eq "o") {
    Write-Host ""
    Write-Host "📱 Envoyez ce SMS depuis votre téléphone:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "À: +33603983709" -ForegroundColor White
    Write-Host "Message: C'est urgent! Avez-vous reçu mon email?" -ForegroundColor White
    Write-Host ""
    
    Read-Host "Appuyez sur Entrée après l'envoi"
    
    Write-Host ""
    Write-Host "🔄 Attente réception SMS (30 secondes)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    Write-Host ""
    Write-Host "✅ SMS devrait être reçu!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🖥️  Vérifiez dans INBOX:" -ForegroundColor Cyan
    Write-Host "   → 2 messages sur le même dossier" -ForegroundColor Gray
    Write-Host "   → Timeline mise à jour" -ForegroundColor Gray
    Write-Host ""
}

Write-Host ""
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host "  ÉTAPE 4: TRAITEMENT PAR L'UTILISATEUR" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host ""

Write-Host "🎯 Actions à faire dans l'interface:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Cliquer sur le dossier" -ForegroundColor White
Write-Host ""
Write-Host "2. Définir PRIORITÉ:" -ForegroundColor White
Write-Host "   → Urgent (5/5)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Ajouter TAGS:" -ForegroundColor White
Write-Host "   → urgent, $($config.name)" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Changer STATUT:" -ForegroundColor White
Write-Host "   → IN_PROGRESS" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Ajouter NOTE:" -ForegroundColor White
Write-Host "   → 'Client prioritaire - Traiter aujourd'hui'" -ForegroundColor Gray
Write-Host ""

Read-Host "Appuyez sur Entrée après avoir fait ces actions"

Write-Host ""
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host "  ÉTAPE 5: RÉPONSE AU CLIENT" -ForegroundColor Yellow
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host ""

Write-Host "📧 Dans l'onglet SEND:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Sélectionner canal: Email" -ForegroundColor White
Write-Host "2. Destinataire: (auto-rempli)" -ForegroundColor White
Write-Host "3. Sujet: RE: URGENT - Demande $($config.label)" -ForegroundColor White
Write-Host "4. Message suggéré:" -ForegroundColor White
Write-Host ""

switch ($secteur) {
    "1" {
        Write-Host @"
Madame Dubois,

J'ai bien reçu votre demande. Je vous propose un RDV demain 14h.

Merci de confirmer par retour.

Cordialement,
Me Dupont
"@ -ForegroundColor Gray
    }
    "2" {
        Write-Host @"
M. Martin,

RDV confirmé aujourd'hui 16h.
Cabinet Dr Durand, 10 av Victor Hugo.

Cordialement
"@ -ForegroundColor Gray
    }
    default {
        Write-Host @"
Bonjour,

J'ai bien reçu votre demande.
Je reviens vers vous rapidement.

Cordialement
"@ -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "5. Cliquer ENVOYER" -ForegroundColor White
Write-Host ""

Read-Host "Appuyez sur Entrée après l'envoi"

Write-Host ""
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host "  RÉSULTATS DE LA DÉMO" -ForegroundColor Green
Write-Host "=" -ForegroundColor Cyan * 70
Write-Host ""

Write-Host "✅ FLUX COMPLET DÉMONTRÉ:" -ForegroundColor Green
Write-Host ""
Write-Host "1. ✅ Réception automatique (email)" -ForegroundColor White
Write-Host "2. ✅ Détection & création (client + dossier)" -ForegroundColor White
Write-Host "3. ✅ Extraction données (téléphone, adresse)" -ForegroundColor White
Write-Host "4. ✅ Organisation (priorité, tags, statut)" -ForegroundColor White
Write-Host "5. ✅ Traitement utilisateur (notes, actions)" -ForegroundColor White
Write-Host "6. ✅ Réponse client (email envoyé)" -ForegroundColor White
Write-Host "7. ✅ Traçabilité (timeline complète)" -ForegroundColor White
Write-Host ""

Write-Host "📊 À MONTRER MAINTENANT:" -ForegroundColor Cyan
Write-Host ""
Write-Host "• Onglet STATS - Dashboard mis à jour" -ForegroundColor White
Write-Host "• Onglet SEARCH - Rechercher 'urgent'" -ForegroundColor White
Write-Host "• Timeline du dossier - Tous les événements" -ForegroundColor White
Write-Host "• Onglet CLIENTS - Fiche client complète" -ForegroundColor White
Write-Host ""

Write-Host "🎯 POINTS CLÉS À SOULIGNER:" -ForegroundColor Yellow
Write-Host ""
Write-Host "✨ Automatisation:" -ForegroundColor White
Write-Host "   → Zéro saisie manuelle" -ForegroundColor Gray
Write-Host "   → Détection intelligente" -ForegroundColor Gray
Write-Host "   → Extraction coordonnées" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 Unification:" -ForegroundColor White
Write-Host "   → Tous les canaux centralisés" -ForegroundColor Gray
Write-Host "   → Une seule interface" -ForegroundColor Gray
Write-Host "   → Timeline unifiée" -ForegroundColor Gray
Write-Host ""
Write-Host "📈 Productivité:" -ForegroundColor White
Write-Host "   → Gain 2h/jour" -ForegroundColor Gray
Write-Host "   → Zéro message perdu" -ForegroundColor Gray
Write-Host "   → Réponse rapide" -ForegroundColor Gray
Write-Host ""
Write-Host "🔒 Conformité:" -ForegroundColor White
Write-Host "   → RGPD compliant" -ForegroundColor Gray
Write-Host "   → Audit complet" -ForegroundColor Gray
Write-Host "   → Données sécurisées" -ForegroundColor Gray
Write-Host ""

Write-Host "=" -ForegroundColor Green * 70
Write-Host "  DÉMO TERMINÉE AVEC SUCCÈS!" -ForegroundColor Green
Write-Host "=" -ForegroundColor Green * 70
Write-Host ""

Write-Host "💡 PROCHAINES ÉTAPES:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Questions du prospect" -ForegroundColor White
Write-Host "2. Montrer autres secteurs (36 disponibles)" -ForegroundColor White
Write-Host "3. Discuter pricing (20-40€/mois)" -ForegroundColor White
Write-Host "4. Proposer essai gratuit 14 jours" -ForegroundColor White
Write-Host ""

$repeat = Read-Host "Refaire une démo? (o/n)"
if ($repeat -eq "o") {
    Write-Host ""
    & $PSCommandPath
}
