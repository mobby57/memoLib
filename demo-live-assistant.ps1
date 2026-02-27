Write-Host "🎬 DÉMO LIVE MEMOLIB - ASSISTANT INTERACTIF" -ForegroundColor Cyan
Write-Host ""

$scenarios = @(
    "1. Avocat - Divorce urgent (10 min)"
    "2. Médecin - RDV patient (8 min)"
    "3. Consultant - Nouveau projet (12 min)"
    "4. Comptable - Déclaration fiscale (10 min)"
    "5. Architecte - Permis construire (15 min)"
    "6. Agent Immobilier - Visite (8 min)"
    "7. COMPLET Multi-secteur (30 min)"
    "8. STRESS TEST - 50 messages (20 min)"
)

Write-Host "📋 SCÉNARIOS DISPONIBLES:" -ForegroundColor Yellow
foreach ($s in $scenarios) {
    Write-Host "  $s" -ForegroundColor White
}

Write-Host ""
$choice = Read-Host "Choisissez un scénario (1-8)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "🎯 SCÉNARIO 1: AVOCAT - DIVORCE URGENT" -ForegroundColor Green
        Write-Host ""
        Write-Host "📧 ÉTAPE 1: Envoyez cet email depuis votre Gmail" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "À: sarraboudjellal57+legal@gmail.com" -ForegroundColor Cyan
        Write-Host "Sujet: URGENT - Demande divorce" -ForegroundColor Cyan
        Write-Host "Corps:" -ForegroundColor Cyan
        Write-Host @"
Bonjour Maître,

Je souhaite entamer une procédure de divorce en urgence.
Mon conjoint a vidé nos comptes bancaires hier.

Coordonnées:
Marie Dubois
06 12 34 56 78
15 rue de la Paix, 75001 Paris

Merci de me rappeler rapidement.
"@ -ForegroundColor White
        
        Write-Host ""
        Read-Host "Appuyez sur Entrée après avoir envoyé l'email"
        
        Write-Host ""
        Write-Host "⏳ Attente réception (30-60 secondes)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 45
        
        Write-Host ""
        Write-Host "✅ Email devrait être reçu!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🖥️ VÉRIFICATIONS:" -ForegroundColor Yellow
        Write-Host "1. Ouvrir http://localhost:5078/app.html" -ForegroundColor Cyan
        Write-Host "2. Onglet INBOX - Voir le message" -ForegroundColor Cyan
        Write-Host "3. Onglet CLIENTS - Voir 'Marie Dubois' créé" -ForegroundColor Cyan
        Write-Host "4. Onglet CASES - Voir 'Divorce - Marie Dubois'" -ForegroundColor Cyan
        
        Write-Host ""
        Read-Host "Appuyez sur Entrée pour continuer"
        
        Write-Host ""
        Write-Host "📱 ÉTAPE 2: Envoyez ce SMS" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "De votre téléphone vers: +33603983709" -ForegroundColor Cyan
        Write-Host "Message: Maître, c'est Marie Dubois. Avez-vous reçu mon email? C'est très urgent!" -ForegroundColor White
        
        Write-Host ""
        Read-Host "Appuyez sur Entrée après avoir envoyé le SMS"
        
        Write-Host ""
        Write-Host "⏳ Attente réception SMS..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        Write-Host ""
        Write-Host "✅ SMS devrait être reçu!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🖥️ VÉRIFICATIONS:" -ForegroundColor Yellow
        Write-Host "1. Rafraîchir INBOX - Voir 2 messages" -ForegroundColor Cyan
        Write-Host "2. Cliquer sur dossier - Voir timeline avec 2 événements" -ForegroundColor Cyan
        
        Write-Host ""
        Read-Host "Appuyez sur Entrée pour continuer"
        
        Write-Host ""
        Write-Host "💬 ÉTAPE 3: Actions dans l'interface" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "1. Cliquer sur le dossier 'Divorce - Marie Dubois'" -ForegroundColor Cyan
        Write-Host "2. Définir priorité: 5 (Urgent)" -ForegroundColor Cyan
        Write-Host "3. Ajouter tags: divorce, urgent, famille" -ForegroundColor Cyan
        Write-Host "4. Changer statut: IN_PROGRESS" -ForegroundColor Cyan
        Write-Host "5. Onglet SEND - Répondre par email" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "📧 Message de réponse suggéré:" -ForegroundColor Yellow
        Write-Host @"
Madame Dubois,

J'ai bien reçu votre demande. Je vous propose un RDV demain 14h.

Merci de confirmer par retour.

Cordialement,
Me Dupont
"@ -ForegroundColor White
        
        Write-Host ""
        Write-Host "✅ DÉMO TERMINÉE!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📊 RÉSULTATS À MONTRER:" -ForegroundColor Yellow
        Write-Host "- 2 messages reçus (email + SMS)" -ForegroundColor White
        Write-Host "- 1 client créé automatiquement" -ForegroundColor White
        Write-Host "- 1 dossier créé automatiquement" -ForegroundColor White
        Write-Host "- Coordonnées extraites (téléphone + adresse)" -ForegroundColor White
        Write-Host "- Timeline complète" -ForegroundColor White
        Write-Host "- Réponse envoyée" -ForegroundColor White
    }
    
    "2" {
        Write-Host ""
        Write-Host "🏥 SCÉNARIO 2: MÉDECIN - RDV PATIENT" -ForegroundColor Green
        Write-Host ""
        Write-Host "📧 ÉTAPE 1: Email" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "À: sarraboudjellal57+medical@gmail.com" -ForegroundColor Cyan
        Write-Host "Sujet: Demande rendez-vous" -ForegroundColor Cyan
        Write-Host @"
Bonjour Docteur,

Je souhaite prendre RDV pour des douleurs abdominales depuis 3 jours.

Jean Martin
06 98 76 54 32
Mutuelle: MGEN
"@ -ForegroundColor White
        
        Write-Host ""
        Read-Host "Envoyez l'email puis appuyez sur Entrée"
        Start-Sleep -Seconds 45
        
        Write-Host ""
        Write-Host "✅ Vérifiez l'inbox!" -ForegroundColor Green
        Read-Host "Appuyez sur Entrée pour continuer"
        
        Write-Host ""
        Write-Host "📱 ÉTAPE 2: SMS urgent" -ForegroundColor Yellow
        Write-Host "Message: Docteur, les douleurs s'aggravent. Possible aujourd'hui?" -ForegroundColor White
        
        Read-Host "Envoyez le SMS puis appuyez sur Entrée"
        Start-Sleep -Seconds 30
        
        Write-Host ""
        Write-Host "✅ DÉMO TERMINÉE!" -ForegroundColor Green
    }
    
    "7" {
        Write-Host ""
        Write-Host "🎯 SCÉNARIO COMPLET MULTI-SECTEUR" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️ ATTENTION: Démo longue (30 min)" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "📋 PRÉPARATION:" -ForegroundColor Yellow
        Write-Host "1. Préparer 6 emails différents" -ForegroundColor Cyan
        Write-Host "2. Préparer téléphone pour SMS/WhatsApp" -ForegroundColor Cyan
        Write-Host "3. Ouvrir toutes les interfaces" -ForegroundColor Cyan
        Write-Host ""
        
        $confirm = Read-Host "Continuer? (o/n)"
        if ($confirm -eq "o") {
            Write-Host ""
            Write-Host "📧 PHASE 1: Envoi simultané (5 min)" -ForegroundColor Yellow
            Write-Host ""
            Write-Host "Envoyez ces 6 emails rapidement:" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "1. sarraboudjellal57+legal@gmail.com - Divorce" -ForegroundColor White
            Write-Host "2. sarraboudjellal57+medical@gmail.com - RDV" -ForegroundColor White
            Write-Host "3. sarraboudjellal57+consulting@gmail.com - Projet" -ForegroundColor White
            Write-Host "4. sarraboudjellal57+accounting@gmail.com - Facture" -ForegroundColor White
            Write-Host "5. sarraboudjellal57+architecture@gmail.com - Plans" -ForegroundColor White
            Write-Host "6. sarraboudjellal57+realty@gmail.com - Visite" -ForegroundColor White
            
            Write-Host ""
            Read-Host "Appuyez sur Entrée après avoir envoyé tous les emails"
            
            Write-Host ""
            Write-Host "⏳ Attente réception (2 minutes)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 120
            
            Write-Host ""
            Write-Host "✅ Tous les emails devraient être reçus!" -ForegroundColor Green
            Write-Host ""
            Write-Host "🖥️ VÉRIFICATIONS:" -ForegroundColor Yellow
            Write-Host "- Inbox: 6 messages" -ForegroundColor Cyan
            Write-Host "- Clients: 6 nouveaux clients" -ForegroundColor Cyan
            Write-Host "- Cases: 6 nouveaux dossiers" -ForegroundColor Cyan
            Write-Host "- Stats: Dashboard mis à jour" -ForegroundColor Cyan
            
            Write-Host ""
            Write-Host "✅ DÉMO COMPLÈTE TERMINÉE!" -ForegroundColor Green
        }
    }
    
    "8" {
        Write-Host ""
        Write-Host "🔥 STRESS TEST - 50 MESSAGES" -ForegroundColor Red
        Write-Host ""
        Write-Host "⚠️ ATTENTION: Test intensif!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Ce test va:" -ForegroundColor Yellow
        Write-Host "- Envoyer 50 emails simultanés" -ForegroundColor White
        Write-Host "- Tester la performance du système" -ForegroundColor White
        Write-Host "- Vérifier la stabilité" -ForegroundColor White
        Write-Host ""
        
        $confirm = Read-Host "Lancer le stress test? (o/n)"
        if ($confirm -eq "o") {
            Write-Host ""
            Write-Host "🚀 Lancement du stress test..." -ForegroundColor Yellow
            Write-Host ""
            Write-Host "⚠️ MANUEL: Utilisez un outil d'envoi massif d'emails" -ForegroundColor Red
            Write-Host "Ou contactez l'équipe technique pour script automatisé" -ForegroundColor Red
        }
    }
    
    default {
        Write-Host ""
        Write-Host "❌ Choix invalide" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📚 Documentation complète: SCENARIOS_DEMO_COMPLETS.md" -ForegroundColor Cyan
Write-Host ""
