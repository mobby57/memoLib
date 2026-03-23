# fix-accents.ps1 - Restaure les accents français dans les fichiers TSX
# Uniquement des remplacements sûrs (mots qui n'existent PAS en anglais)

param(
    [switch]$DryRun
)

# Remplacements sûrs: ces mots n'existent pas en anglais
# Format: regex pattern => replacement
# On utilise des word boundaries pour éviter les faux positifs
$safeReplacements = @(
    # Mots uniques au français (aucun risque de collision anglais)
    @{ pattern = '\bParametres\b'; replacement = 'Paramètres' }
    @{ pattern = '\bparametres\b'; replacement = 'paramètres' }
    @{ pattern = '\bParametre\b'; replacement = 'Paramètre' }
    @{ pattern = '\bparametre\b'; replacement = 'paramètre' }
    @{ pattern = '\bSecurite\b'; replacement = 'Sécurité' }
    @{ pattern = '\bsecurite\b'; replacement = 'sécurité' }
    @{ pattern = '\bSecurise\b'; replacement = 'Sécurisé' }
    @{ pattern = '\bsecurise\b'; replacement = 'sécurisé' }
    @{ pattern = '\bGerez\b'; replacement = 'Gérez' }
    @{ pattern = '\bgerez\b'; replacement = 'gérez' }
    @{ pattern = '\bCreez\b'; replacement = 'Créez' }
    @{ pattern = '\bcreez\b'; replacement = 'créez' }
    @{ pattern = '\bCreer\b'; replacement = 'Créer' }
    @{ pattern = '\bcreer\b'; replacement = 'créer' }
    @{ pattern = '\bAccedez\b'; replacement = 'Accédez' }
    @{ pattern = '\baccedez\b'; replacement = 'accédez' }
    @{ pattern = '\bCategorie\b'; replacement = 'Catégorie' }
    @{ pattern = '\bcategorie\b'; replacement = 'catégorie' }
    @{ pattern = '\bCategories\b'; replacement = 'Catégories' }
    @{ pattern = '\bcategories\b'; replacement = 'catégories' }
    @{ pattern = '\bPriorite\b'; replacement = 'Priorité' }
    @{ pattern = '\bpriorite\b'; replacement = 'priorité' }
    @{ pattern = '\bPriorites\b'; replacement = 'Priorités' }
    @{ pattern = '\bpriorites\b'; replacement = 'priorités' }
    @{ pattern = '\bActivite\b'; replacement = 'Activité' }
    @{ pattern = '\bactivite\b'; replacement = 'activité' }
    @{ pattern = '\bActivites\b'; replacement = 'Activités' }
    @{ pattern = '\bactivites\b'; replacement = 'activités' }
    @{ pattern = '\bResultat\b'; replacement = 'Résultat' }
    @{ pattern = '\bresultat\b'; replacement = 'résultat' }
    @{ pattern = '\bResultats\b'; replacement = 'Résultats' }
    @{ pattern = '\bresultats\b'; replacement = 'résultats' }
    @{ pattern = '\bConformite\b'; replacement = 'Conformité' }
    @{ pattern = '\bconformite\b'; replacement = 'conformité' }
    @{ pattern = '\bPreferences\b'; replacement = 'Préférences' }
    @{ pattern = '\bpreferences\b'; replacement = 'préférences' }
    @{ pattern = '\bPreference\b'; replacement = 'Préférence' }
    @{ pattern = '\bpreference\b'; replacement = 'préférence' }
    @{ pattern = '\bPrecedent\b'; replacement = 'Précédent' }
    @{ pattern = '\bprecedent\b'; replacement = 'précédent' }
    @{ pattern = '\bPrecedente\b'; replacement = 'Précédente' }
    @{ pattern = '\bprecedente\b'; replacement = 'précédente' }
    @{ pattern = '\bSpecifique\b'; replacement = 'Spécifique' }
    @{ pattern = '\bspecifique\b'; replacement = 'spécifique' }
    @{ pattern = '\bSpecifiques\b'; replacement = 'Spécifiques' }
    @{ pattern = '\bspecifiques\b'; replacement = 'spécifiques' }
    @{ pattern = '\bNecessaire\b'; replacement = 'Nécessaire' }
    @{ pattern = '\bnecessaire\b'; replacement = 'nécessaire' }
    @{ pattern = '\bNecessaires\b'; replacement = 'Nécessaires' }
    @{ pattern = '\bnecessaires\b'; replacement = 'nécessaires' }
    @{ pattern = '\bSupplementaire\b'; replacement = 'Supplémentaire' }
    @{ pattern = '\bsupplementaire\b'; replacement = 'supplémentaire' }
    @{ pattern = '\bSupplementaires\b'; replacement = 'Supplémentaires' }
    @{ pattern = '\bsupplementaires\b'; replacement = 'supplémentaires' }
    @{ pattern = '\bProbleme\b'; replacement = 'Problème' }
    @{ pattern = '\bprobleme\b'; replacement = 'problème' }
    @{ pattern = '\bProblemes\b'; replacement = 'Problèmes' }
    @{ pattern = '\bproblemes\b'; replacement = 'problèmes' }
    @{ pattern = '\bSysteme\b'; replacement = 'Système' }
    @{ pattern = '\bsysteme\b'; replacement = 'système' }
    @{ pattern = '\bSystemes\b'; replacement = 'Systèmes' }
    @{ pattern = '\bsystemes\b'; replacement = 'systèmes' }
    @{ pattern = '\bPeriode\b'; replacement = 'Période' }
    @{ pattern = '\bperiode\b'; replacement = 'période' }
    @{ pattern = '\bPeriodes\b'; replacement = 'Périodes' }
    @{ pattern = '\bperiodes\b'; replacement = 'périodes' }
    @{ pattern = '\bGenerale\b'; replacement = 'Générale' }
    @{ pattern = '\bgenerale\b'; replacement = 'générale' }
    @{ pattern = '\bGeneral\b'; replacement = 'Général' }
    @{ pattern = '\bgeneral\b'; replacement = 'général' }
    @{ pattern = '\bTelephone\b'; replacement = 'Téléphone' }
    @{ pattern = '\btelephone\b'; replacement = 'téléphone' }
    @{ pattern = '\bTelephones\b'; replacement = 'Téléphones' }
    @{ pattern = '\btelephones\b'; replacement = 'téléphones' }
    @{ pattern = '\bNumero\b'; replacement = 'Numéro' }
    @{ pattern = '\bnumero\b'; replacement = 'numéro' }
    @{ pattern = '\bNumeros\b'; replacement = 'Numéros' }
    @{ pattern = '\bnumeros\b'; replacement = 'numéros' }
    @{ pattern = '\bEcheance\b'; replacement = 'Échéance' }
    @{ pattern = '\becheance\b'; replacement = 'échéance' }
    @{ pattern = '\bEcheances\b'; replacement = 'Échéances' }
    @{ pattern = '\becheances\b'; replacement = 'échéances' }
    @{ pattern = '\bEcheancier\b'; replacement = 'Échéancier' }
    @{ pattern = '\becheancier\b'; replacement = 'échéancier' }
    @{ pattern = '\bEvenement\b'; replacement = 'Événement' }
    @{ pattern = '\bevenement\b'; replacement = 'événement' }
    @{ pattern = '\bEvenements\b'; replacement = 'Événements' }
    @{ pattern = '\bevenements\b'; replacement = 'événements' }
    @{ pattern = '\bRecurrence\b'; replacement = 'Récurrence' }
    @{ pattern = '\brecurrence\b'; replacement = 'récurrence' }
    @{ pattern = '\bRecurrent\b'; replacement = 'Récurrent' }
    @{ pattern = '\brecurrent\b'; replacement = 'récurrent' }
    @{ pattern = '\bReglement\b'; replacement = 'Règlement' }
    @{ pattern = '\breglement\b'; replacement = 'règlement' }
    @{ pattern = '\bReglements\b'; replacement = 'Règlements' }
    @{ pattern = '\breglements\b'; replacement = 'règlements' }
    @{ pattern = '\bReglementaire\b'; replacement = 'Réglementaire' }
    @{ pattern = '\breglementaire\b'; replacement = 'réglementaire' }
    @{ pattern = '\bIntegration\b'; replacement = 'Intégration' }
    @{ pattern = '\bintegration\b'; replacement = 'intégration' }
    @{ pattern = '\bIntegrations\b'; replacement = 'Intégrations' }
    @{ pattern = '\bintegrations\b'; replacement = 'intégrations' }
    @{ pattern = '\bDependance\b'; replacement = 'Dépendance' }
    @{ pattern = '\bdependance\b'; replacement = 'dépendance' }
    @{ pattern = '\bDependances\b'; replacement = 'Dépendances' }
    @{ pattern = '\bdependances\b'; replacement = 'dépendances' }
    @{ pattern = '\bRecuperation\b'; replacement = 'Récupération' }
    @{ pattern = '\brecuperation\b'; replacement = 'récupération' }
    @{ pattern = '\bVerification\b'; replacement = 'Vérification' }
    @{ pattern = '\bverification\b'; replacement = 'vérification' }
    @{ pattern = '\bDeconnexion\b'; replacement = 'Déconnexion' }
    @{ pattern = '\bdeconnexion\b'; replacement = 'déconnexion' }
    @{ pattern = '\bTelechargement\b'; replacement = 'Téléchargement' }
    @{ pattern = '\btelechargement\b'; replacement = 'téléchargement' }
    @{ pattern = '\bTelecharger\b'; replacement = 'Télécharger' }
    @{ pattern = '\btelecharger\b'; replacement = 'télécharger' }
    @{ pattern = '\bProcedure\b'; replacement = 'Procédure' }
    @{ pattern = '\bprocedure\b'; replacement = 'procédure' }
    @{ pattern = '\bProcedures\b'; replacement = 'Procédures' }
    @{ pattern = '\bprocedures\b'; replacement = 'procédures' }
    @{ pattern = '\bStrategie\b'; replacement = 'Stratégie' }
    @{ pattern = '\bstrategie\b'; replacement = 'stratégie' }
    @{ pattern = '\bScenario\b'; replacement = 'Scénario' }
    @{ pattern = '\bscenario\b'; replacement = 'scénario' }
    @{ pattern = '\bScenarios\b'; replacement = 'Scénarios' }
    @{ pattern = '\bscenarios\b'; replacement = 'scénarios' }
    @{ pattern = '\bConfidentialite\b'; replacement = 'Confidentialité' }
    @{ pattern = '\bconfidentialite\b'; replacement = 'confidentialité' }
    @{ pattern = '\bDisponibilite\b'; replacement = 'Disponibilité' }
    @{ pattern = '\bdisponibilite\b'; replacement = 'disponibilité' }
    @{ pattern = '\bFonctionnalite\b'; replacement = 'Fonctionnalité' }
    @{ pattern = '\bfonctionnalite\b'; replacement = 'fonctionnalité' }
    @{ pattern = '\bFonctionnalites\b'; replacement = 'Fonctionnalités' }
    @{ pattern = '\bfonctionnalites\b'; replacement = 'fonctionnalités' }
    @{ pattern = '\bLegalite\b'; replacement = 'Légalité' }
    @{ pattern = '\blegalite\b'; replacement = 'légalité' }
    @{ pattern = '\bDetaille\b'; replacement = 'Détaillé' }
    @{ pattern = '\bdetaille\b'; replacement = 'détaillé' }
    @{ pattern = '\bDetaillee\b'; replacement = 'Détaillée' }
    @{ pattern = '\bdetaillee\b'; replacement = 'détaillée' }
    @{ pattern = '\bSelectionne\b'; replacement = 'Sélectionné' }
    @{ pattern = '\bselectionne\b'; replacement = 'sélectionné' }
    @{ pattern = '\bSelectionnee\b'; replacement = 'Sélectionnée' }
    @{ pattern = '\bselectionnee\b'; replacement = 'sélectionnée' }
    @{ pattern = '\bSelectionner\b'; replacement = 'Sélectionner' }
    @{ pattern = '\bselectionner\b'; replacement = 'sélectionner' }
    @{ pattern = '\bSelection\b'; replacement = 'Sélection' }
    @{ pattern = '\bselection\b'; replacement = 'sélection' }
    @{ pattern = '\bGenere\b'; replacement = 'Généré' }
    @{ pattern = '\bgenere\b'; replacement = 'généré' }
    @{ pattern = '\bGeneree\b'; replacement = 'Générée' }
    @{ pattern = '\bgeneree\b'; replacement = 'générée' }
    @{ pattern = '\bGenerer\b'; replacement = 'Générer' }
    @{ pattern = '\bgenerer\b'; replacement = 'générer' }
    @{ pattern = '\bDesactive\b'; replacement = 'Désactivé' }
    @{ pattern = '\bdesactive\b'; replacement = 'désactivé' }
    @{ pattern = '\bDesactivee\b'; replacement = 'Désactivée' }
    @{ pattern = '\bdesactivee\b'; replacement = 'désactivée' }
    @{ pattern = '\bDesactiver\b'; replacement = 'Désactiver' }
    @{ pattern = '\bdesactiver\b'; replacement = 'désactiver' }
    @{ pattern = '\bRecupere\b'; replacement = 'Récupéré' }
    @{ pattern = '\brecupere\b'; replacement = 'récupéré' }
    @{ pattern = '\bRecuperer\b'; replacement = 'Récupérer' }
    @{ pattern = '\brecuperer\b'; replacement = 'récupérer' }
    @{ pattern = '\bDemarre\b'; replacement = 'Démarré' }
    @{ pattern = '\bdemarre\b'; replacement = 'démarré' }
    @{ pattern = '\bDemarrer\b'; replacement = 'Démarrer' }
    @{ pattern = '\bdemarrer\b'; replacement = 'démarrer' }
    @{ pattern = '\bPlanifie\b'; replacement = 'Planifié' }
    @{ pattern = '\bplanifie\b'; replacement = 'planifié' }
    @{ pattern = '\bPlanifiee\b'; replacement = 'Planifiée' }
    @{ pattern = '\bplanifiee\b'; replacement = 'planifiée' }
    @{ pattern = '\bPlanifier\b'; replacement = 'Planifier' }
    @{ pattern = '\bplanifier\b'; replacement = 'planifier' }
    @{ pattern = '\bAuthentifie\b'; replacement = 'Authentifié' }
    @{ pattern = '\bauthentifie\b'; replacement = 'authentifié' }
    @{ pattern = '\bDeconnecte\b'; replacement = 'Déconnecté' }
    @{ pattern = '\bdeconnecte\b'; replacement = 'déconnecté' }
    @{ pattern = '\bEchelonne\b'; replacement = 'Échelonné' }
    @{ pattern = '\bechelonne\b'; replacement = 'échelonné' }
    @{ pattern = '\bDiffere\b'; replacement = 'Différé' }
    @{ pattern = '\bdiffere\b'; replacement = 'différé' }
    @{ pattern = '\bDifferent\b'; replacement = 'Différent' }
    @{ pattern = '\bdifferent\b'; replacement = 'différent' }
    @{ pattern = '\bDifferente\b'; replacement = 'Différente' }
    @{ pattern = '\bdifferente\b'; replacement = 'différente' }
    @{ pattern = '\bDifferents\b'; replacement = 'Différents' }
    @{ pattern = '\bdifferents\b'; replacement = 'différents' }
    @{ pattern = '\bPremiere\b'; replacement = 'Première' }
    @{ pattern = '\bpremiere\b'; replacement = 'première' }
    @{ pattern = '\bDerniere\b'; replacement = 'Dernière' }
    @{ pattern = '\bderniere\b'; replacement = 'dernière' }
    @{ pattern = '\bReguliere\b'; replacement = 'Régulière' }
    @{ pattern = '\breguliere\b'; replacement = 'régulière' }
    @{ pattern = '\bImmediat\b'; replacement = 'Immédiat' }
    @{ pattern = '\bimmediat\b'; replacement = 'immédiat' }
    @{ pattern = '\bImmediatement\b'; replacement = 'Immédiatement' }
    @{ pattern = '\bimmediatement\b'; replacement = 'immédiatement' }
    
    # Accents graves dans contexte français (safe car entre mots français)
    @{ pattern = "(?<=\s)a(?=\s+l')"; replacement = 'à' }
    @{ pattern = "(?<=\s)a(?=\s+la\s)"; replacement = 'à' }
    @{ pattern = "(?<=\s)a(?=\s+votre\s)"; replacement = 'à' }
    @{ pattern = "(?<=\s)a(?=\s+deux\s)"; replacement = 'à' }
    @{ pattern = "(?<=\s)a(?=\s+jour)"; replacement = 'à' }
    @{ pattern = '\bRetour a\b'; replacement = 'Retour à' }
    @{ pattern = '\bgrace a\b'; replacement = 'grâce à' }
    @{ pattern = '\bGrace a\b'; replacement = 'Grâce à' }
    @{ pattern = '\bjusqu''a\b'; replacement = "jusqu'à" }
    
    # Mots avec è
    @{ pattern = '\bsucces\b'; replacement = 'succès' }
    @{ pattern = '\bSucces\b'; replacement = 'Succès' }
    @{ pattern = '\bacces\b'; replacement = 'accès' }
    @{ pattern = '\bAcces\b'; replacement = 'Accès' }
    @{ pattern = '\bapres\b'; replacement = 'après' }
    @{ pattern = '\bApres\b'; replacement = 'Après' }
    @{ pattern = '\bprogres\b'; replacement = 'progrès' }
    @{ pattern = '\bProgres\b'; replacement = 'Progrès' }
    
    # été (dans contexte français)
    @{ pattern = '(?<=\s)ete(?=\s)'; replacement = 'été' }
    @{ pattern = '(?<=\s)ete(?=\.)'; replacement = 'été' }
    
    # Mots spécifiques supplémentaires
    @{ pattern = '\bResume\b'; replacement = 'Résumé' }
    @{ pattern = '\bresume\b'; replacement = 'résumé' }
    @{ pattern = '\bReleve\b'; replacement = 'Relevé' }
    @{ pattern = '\breleve\b'; replacement = 'relevé' }
    @{ pattern = '\bEleve\b'; replacement = 'Élevé' }
    @{ pattern = '\beleve\b'; replacement = 'élevé' }
    @{ pattern = '\bLegal\b'; replacement = 'Légal' }
    @{ pattern = '\blegal\b'; replacement = 'légal' }
    @{ pattern = '\bLegale\b'; replacement = 'Légale' }
    @{ pattern = '\blegale\b'; replacement = 'légale' }
    @{ pattern = '\bLegaux\b'; replacement = 'Légaux' }
    @{ pattern = '\blegaux\b'; replacement = 'légaux' }
    @{ pattern = '\bintegree\b'; replacement = 'intégrée' }
    @{ pattern = '\bIntegree\b'; replacement = 'Intégrée' }
    @{ pattern = '\bintegre\b'; replacement = 'intégré' }
    @{ pattern = '\bIntegre\b'; replacement = 'Intégré' }
    @{ pattern = '\bintegrer\b'; replacement = 'intégrer' }
    @{ pattern = '\bIntegrer\b'; replacement = 'Intégrer' }
)

$files = Get-ChildItem -LiteralPath 'src\app' -Recurse -Filter '*.tsx'
$fixedCount = 0

foreach ($file in $files) {
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    
    # Retirer BOM UTF-8
    $offset = 0
    if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $offset = 3
    }
    
    $content = [System.Text.Encoding]::UTF8.GetString($bytes, $offset, $bytes.Length - $offset)
    $original = $content
    
    foreach ($r in $safeReplacements) {
        $content = [regex]::Replace($content, $r.pattern, $r.replacement)
    }
    
    if ($content -ne $original) {
        if ($DryRun) {
            Write-Host "WOULD FIX: $($file.Name)"
        } else {
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
            Write-Host "FIXED: $($file.Name)"
        }
        $fixedCount++
    }
}

Write-Host "`n$fixedCount fichiers $(if($DryRun){'a corriger'}else{'corriges'})"
