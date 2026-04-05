# Cahier des Charges MemoLib (version a jour)

Date de reference: 2026-04-04
Version document: 2026.04
Statut: valide pour cadrage produit, execution et recette

## 1. Contexte et objectif

MemoLib est une plateforme de gestion d'emails et de dossiers pour cabinets juridiques.
Le produit doit reduire le temps de traitement, fiabiliser les decisions, et garantir une tracabilite complete des actions.

Objectifs business cibles:
- Reduire de 40% le temps moyen entre reception email et decision operateur.
- Atteindre un taux de perte email de 0% sur les boites connectees.
- Garantir 100% des actions critiques journalisees (audit trail).
- Maintenir un cout d'exploitation local a 0 EUR/mois et un mode cloud optionnel.

## 2. Perimetre

### 2.1 Inclus (MVP+/Prod)
- Collecte email (IMAP) avec surveillance periodique.
- Envoi email (SMTP) depuis l'application.
- Extraction intelligente des metadonnees client (nom, email, telephone, adresse).
- Creation et suivi des dossiers juridiques.
- Gestion clients (fiche, historique, dedoublonnage).
- Workflow de statut dossier (OPEN -> IN_PROGRESS -> CLOSED).
- Attribution, tags, priorites, echeances.
- Recherche textuelle et semantique (si IA activee).
- Dashboard operationnel et indicateurs de performance.
- Authentification JWT, roles et permissions (RBAC).
- Journal d'audit des operations sensibles.
- Interface web de demonstration et parcours onboarding.

### 2.2 Hors perimetre (version actuelle)
- Facturation integree.
- Signature electronique integree native.
- Connecteurs CRM proprietaires non standards.
- Multilingue complet en temps reel.

## 3. Parties prenantes

- Sponsor metier: direction du cabinet.
- Product owner: responsable operationnel MemoLib.
- Utilisateurs finaux: assistants juridiques, avocats, administrateurs.
- Equipe technique: backend .NET, frontend web, QA, exploitation.

## 4. Exigences fonctionnelles

### 4.1 Ingestion et traitement des emails
- EF-001: Le systeme doit scanner une boite email IMAP selon un intervalle configurable (defaut 60 secondes).
- EF-002: Le systeme doit detecter les nouveaux emails sans doublon sur id/message.
- EF-003: Le systeme doit permettre un scan manuel complet des emails historiques.
- EF-004: Le systeme doit extraire les informations client avec score de confiance.
- EF-005: Le systeme doit permettre la validation humaine des suggestions IA (approve/reject).

### 4.2 Gestion des dossiers et clients
- EF-010: Un dossier doit pouvoir etre cree en 1 clic depuis un email.
- EF-011: Le systeme doit pre-remplir les informations client detectees.
- EF-012: Chaque dossier doit exposer un historique des evenements.
- EF-013: Les statuts du workflow doivent etre traques avec horodatage.
- EF-014: Les utilisateurs doivent pouvoir assigner un dossier a un responsable.
- EF-015: Les tags et priorites doivent etre modifiables sans rechargement complet.

### 4.3 Recherche et consultation
- EF-020: Le systeme doit proposer une recherche unifiee (emails, dossiers, documents).
- EF-021: La recherche doit supporter filtres combines (statut, tag, priorite, date).
- EF-022: Les resultats doivent afficher source, date, et extrait pertinent.

### 4.4 Reporting et pilotage
- EF-030: Le dashboard doit afficher les KPI quotidiens (emails recus, en attente, delai moyen).
- EF-031: Le dashboard doit afficher le taux d'acceptation des suggestions IA.
- EF-032: Le systeme doit signaler les anomalies workflow sur les 24 dernieres heures.

Implementation de reference (API):
- Endpoint pipeline metrics: GET /api/pipeline/metrics?tenantId={tenantId}&days={n}
- Indicateurs exposes: total, pending, approved, rejected, approvalRate, averageDecisionSeconds.

### 4.5 Securite et conformite
- EF-040: L'authentification doit se faire via JWT.
- EF-041: Les mots de passe doivent etre haches (BCrypt).
- EF-042: Les operations critiques doivent etre journalisees dans un audit trail.
- EF-043: Les secrets (password IMAP, credentials) ne doivent pas etre stockes en clair dans le code source.
- EF-044: Le systeme doit supporter un mode invite-only pour controler l'acces.

## 5. Exigences non fonctionnelles

- ENF-001 Performance UI: ecrans coeur charges en < 2 secondes (95e percentile, environnement cible).
- ENF-002 Performance recherche: reponse cible < 300 ms sur corpus nominal.
- ENF-003 Disponibilite locale: redemarrage service < 2 minutes.
- ENF-004 Observabilite: logs techniques et metiers exploitables, traces d'erreurs centralisables.
- ENF-005 Qualite: tests unitaires et tests d'integration automatises dans la pipeline.
- ENF-006 Portabilite: execution locale Windows et deploiement cloud optionnel.
- ENF-007 Securite: aucune fuite de secrets (.env, .pem) dans le repository.

## 6. Parcours utilisateur cibles

- Parcours 1: reception email -> analyse IA -> validation humaine -> creation/mise a jour dossier.
- Parcours 2: ouverture dossier -> mise a jour statut/priorite -> notification equipe.
- Parcours 3: recherche transverse -> consultation historique -> action rapide.
- Parcours 4: suivi dashboard -> detection anomalie -> correction operationnelle.

## 7. Architecture cible (haut niveau)

- Backend: ASP.NET Core 9.0, EF Core 9.0, API REST.
- Base de donnees: SQLite (mode local), migration possible vers cible cloud.
- Email: MailKit IMAP/SMTP.
- Frontend: interface web responsive (HTML/CSS/JS + composants UI du projet).
- Securite: JWT + RBAC + audit trail.
- IA: extraction, classification, recherche semantique (selon configuration).

## 8. Donnees et gouvernance

- Donnees sensibles: identites clients, contenus email, pieces jointes.
- Retention: definir une politique de conservation par type de dossier.
- Journalisation: conserver les evenements d'acces et de modification critiques.
- Export: prevoir export dossier/audit en format lisible pour controle interne.

## 9. KPI et seuils d'acceptation

- KPI-001 Delai moyen email -> decision: cible <= 10 minutes en regime nominal.
- KPI-002 Taux de validation humaine tracee: cible 100% des decisions IA.
- KPI-003 Taux de dossiers sans information client manquante: cible >= 95%.
- KPI-004 Taux d'erreur de workflow bloquant: cible <= 1%.
- KPI-005 Taux de disponibilite sur plage ouvrable: cible >= 99%.

## 10. Strategie de recette

### 10.1 Recette fonctionnelle
- Verifier ingestion IMAP automatique et manuelle.
- Verifier creation dossier depuis email et synchronisation client.
- Verifier transitions de statuts et historisation complete.
- Verifier recherche multi-criteres et pertinence des resultats.
- Verifier affichage dashboard et coherences des KPI.

### 10.2 Recette technique
- Verifier migration base de donnees et rollback.
- Verifier robustesse auth JWT/RBAC et scenarios d'acces interdit.
- Verifier non-regression API sur endpoints critiques.
- Verifier tests automatises dans pipeline CI.
- Verifier l'endpoint GET /api/pipeline/metrics (fenetre de temps, agregats et taux d'approbation).

### 10.3 Recette securite
- Verifier absence de secrets versionnes.
- Verifier chiffrement/hachage des credentials.
- Verifier audit des actions sensibles.

## 11. Livrables attendus

- L-001 Code source versionne et documente.
- L-002 Documentation de demarrage et exploitation.
- L-003 Documentation API (collection HTTP / swagger si active).
- L-004 Scripts de test et de verification rapide.
- L-005 Rapport de validation de recette.

## 12. Planning macro (indicatif)

- Semaine 1: cadrage, reprise backlog, alignement UX.
- Semaine 2: consolidation flux email + dossier + audit.
- Semaine 3: durcissement securite, tests, performance.
- Semaine 4: recette finale, corrections, go-live.

## 13. Risques et plans de mitigation

- R-001 Qualite extraction IA variable -> imposer validation humaine et seuil de confiance.
- R-002 Mauvaise configuration email -> checklist de configuration + script de diagnostic.
- R-003 Regressions lors des evolutions -> tests auto obligatoires avant merge.
- R-004 Exposition de secrets -> regles .gitignore + controles pre-commit/CI.

## 14. Definition of Done (DoD)

Une version est consideree conforme si:
- Toutes les exigences fonctionnelles critiques sont validees.
- Aucun incident bloquant P1/P2 n'est ouvert.
- Les tests obligatoires passent.
- Les KPI minimum sont atteints sur la periode de verification.
- La documentation d'exploitation est a jour.

## 15. Historique du document

- 2026-04-04: creation de la version 2026.04 (mise a jour globale, alignement code/repo/UX).

## 16. Conditions contractuelles et engagement de service

### 16.1 Perimetre contractuel
- CC-001: Le titulaire fournit la licence d'usage, la maintenance corrective, et l'assistance pendant la duree du marche.
- CC-002: Le titulaire garantit la disponibilite des artefacts de livraison (code, doc, scripts, procedures).
- CC-003: Le titulaire maintient la compatibilite des interfaces API annoncees sur la periode contractuelle, sauf evolution validee par comite.

### 16.2 SLA contractuels (cibles minimales)
- SLA-001: Disponibilite du service en plage ouvrable >= 99.0% par mois.
- SLA-002: Delai de prise en charge incident P1 <= 30 minutes.
- SLA-003: Delai de prise en charge incident P2 <= 4 heures.
- SLA-004: Delai de retablissement cible P1 <= 4 heures (contournement ou correction).
- SLA-005: Delai de retablissement cible P2 <= 1 jour ouvre.

### 16.3 Reversibilite
- REV-001: Le titulaire fournit un export complet des donnees metier et journaux d'audit dans un format ouvert.
- REV-002: Le titulaire fournit la documentation de reconstruction environnement (procedure d'installation, configuration, migration).
- REV-003: Delai de remise du pack de reversibilite: <= 10 jours ouvres apres demande.

## 17. Conformite RGPD et securite detaillee

### 17.1 Regles de protection des donnees
- RGPD-001: Les roles de responsable de traitement et sous-traitant doivent etre explicitement identifies.
- RGPD-002: Les categories de donnees traitees doivent etre inventoriees (identite, contact, contenu email, pieces jointes).
- RGPD-003: Les finalites de traitement doivent etre documentees (gestion dossier, suivi relation client, conformite).
- RGPD-004: Les durees de conservation doivent etre definies par type de donnee et appliquees.
- RGPD-005: Un registre des demandes d'exercice de droits (acces, rectification, effacement) doit etre tenu.

### 17.2 Exigences de securite renforcees
- SEC-001: Chiffrement en transit obligatoire (TLS) sur tous les flux externes.
- SEC-002: Sauvegardes chiffrees avec politique de retention documentee.
- SEC-003: Journalisation des acces administrateur et operations sensibles.
- SEC-004: Gestion des secrets hors code source et rotation periodique.
- SEC-005: Revue de securite semestrielle et plan de correction trace.

## 18. Exploitation, support et continuite

### 18.1 MCO et support
- MCO-001: Le titulaire assure la supervision, le traitement des alertes et la maintenance corrective.
- MCO-002: Un guichet unique de support doit etre defini (email/ticket) avec horodatage.
- MCO-003: Un rapport mensuel d'exploitation doit etre fourni (incidents, SLA, actions preventives).

### 18.2 Sauvegarde, restauration, PRA/PCA
- OPS-001: Sauvegarde quotidienne des donnees critiques.
- OPS-002: RPO cible <= 24 heures.
- OPS-003: RTO cible <= 8 heures.
- OPS-004: Test de restauration au minimum trimestriel avec compte-rendu.
- OPS-005: Procedure PRA documentee et testee au minimum une fois par an.

## 19. Gouvernance projet et conduite du changement

### 19.1 Instances et pilotage
- GOV-001: Comite projet hebdomadaire (avancement, risques, arbitrages).
- GOV-002: Comite de pilotage mensuel (budget, qualite, planning, decisions majeures).
- GOV-003: Journal des decisions avec responsable et date d'effet.

### 19.2 RACI minimal
- Product Owner: priorisation backlog, validation metier.
- Responsable technique titulaire: architecture, qualite logicielle, securite.
- QA: strategie de test, preuve de recette, non-regression.
- Exploitation: supervision, support, capacite, continuite.

### 19.3 Gestion des changements
- CHG-001: Toute evolution fonctionnelle doit faire l'objet d'une demande de changement tracee.
- CHG-002: Chaque changement doit inclure analyse d'impact cout/delai/risque.
- CHG-003: Aucun changement majeur en production sans validation de recette et plan de retour arriere.

## 20. Matrice de tracabilite exigences -> tests -> preuves

Chaque exigence critique doit etre reliee a un cas de test et a une preuve de resultat.

Exemple de trame minimale:
- MT-001: EF-001 -> Test API ingestion auto -> Preuve: logs horodates + resultat test automatise.
- MT-002: EF-010 -> Test creation dossier depuis email -> Preuve: enregistrement dossier + evenement audit.
- MT-003: EF-040 -> Test acces endpoint protege sans token -> Preuve: HTTP 401.
- MT-004: ENF-001 -> Test performance ecran principal -> Preuve: mesure p95.
- MT-005: OPS-004 -> Test restauration sauvegarde -> Preuve: PV restauration signe.
- MT-006: EF-031/EF-032 -> Test API pipeline metrics -> Preuve: tests/Pipeline.IntegrationTests/PipelineEndpointsIntegrationTests.cs (cas Metrics_ReturnsExpectedAggregates_ForTenantWindow).

## 21. Cadre budgetaire et decomposition des couts

### 21.1 Postes de cout a chiffrer
- COUT-001: Integration initiale et parametrage.
- COUT-002: Maintenance corrective et evolutive.
- COUT-003: Hebergement et services techniques (si mode cloud).
- COUT-004: Support utilisateur et exploitation.
- COUT-005: Formation et transfert de competence.

### 21.2 Variante de deploiement
- Variante A (local): cout d'infrastructure cible 0 EUR/mois hors cout humain.
- Variante B (cloud): cout mensuel estime selon volumetrie, SLA et sauvegarde.

### 21.3 Regles de revision
- Les hypotheses de volumetrie (emails/jour, utilisateurs, stockage) doivent etre explicites.
- Les couts variables et fixes doivent etre distingues.
- Les conditions de revision de prix doivent etre documentees.

## 22. Reference annexe reponse a marche

Pour la preparation du dossier de reponse, utiliser la matrice de conformite:
- docs/MATRICE_CONFORMITE_MARCHE.md

Documents contractuels de base (a adapter selon DCE):
- docs/marche/CCTP_MEMOLIB_V2026-04.md
- docs/marche/RC_MEMOLIB_V2026-04.md
- docs/marche/CCAP_MEMOLIB_V2026-04.md

## 23. Positionnement marche et argumentaire professionnel

### 23.1 Secteur exact et cible

Positionnement produit:
- LegalTech (France / Europe) appliquee a la gestion documentaire et aux flux juridiques.
- Gestion de dossiers juridiques alimentee par les emails et pieces jointes.
- Assistant IA sous supervision humaine obligatoire.

Segments cibles prioritaires:
- Cabinets d'avocats de petite et moyenne taille.
- Juristes d'entreprise.
- Services juridiques internes.

### 23.2 Contexte d'usage reel

Situation terrain:
- Un avocat recoit un volume eleve d'emails (clients, juridictions, confreres, pieces jointes).

Points de douleur observes:
- Perte d'information dans la boite email.
- Double saisie entre email et logiciel metier.
- Risque d'oubli de delais et d'actions de suivi.
- Surcharge cognitive sur les taches de tri et qualification.

Proposition de valeur MemoLib:
- Transformer automatiquement les emails en dossiers structures.
- Proposer une analyse intelligente (classification, metadonnees, priorisation).
- Imposer une validation humaine avant toute action critique.

### 23.3 Niveau d'exigence du marche juridique

Principes d'adoption en cabinet:
- Fiabilite avant innovation.
- Securite avant rapidite.
- Controle utilisateur avant automatisation totale.

Positionnement a tenir en communication:
- MemoLib assiste et propose.
- MemoLib ne decide jamais a la place du professionnel du droit.

### 23.4 Questions specialists et reponses de reference

Securite - "Ou sont stockees les donnees ?"
- Les donnees sont hebergees en environnement securise (cloud ou local), avec chiffrement et controle d'acces strict.

Responsabilite - "Qui est responsable si l'IA se trompe ?"
- L'IA est un systeme de suggestion. La validation humaine est obligatoire, la responsabilite demeure celle du professionnel.

Fiabilite - "Quel est le taux de precision ?"
- Le systeme est concu pour assister et non remplacer. Les suggestions sont ajustables et soumises a validation utilisateur.

Integration - "Compatible avec nos outils actuels ?"
- MemoLib est concu pour une integration progressive via interop, export et API.

Gain reel - "Combien de temps gagne ?"
- Reduction significative de la saisie manuelle et du tri, avec un gain potentiel de plusieurs heures par semaine selon volumetrie.

### 23.5 Argumentaire client (version courte)

Version simple:
- MemoLib transforme vos emails en dossiers structures sans ressaisie, avec controle total de l'utilisateur.

Version impact:
- Vous ne gerez plus des emails, vous gerez directement vos dossiers.

### 23.6 Argumentaire technique (credible)

Architecture fonctionnelle:
- Ingestion multi-source (email, documents).
- Analyse par modeles IA.
- Moteur de workflow metier.
- Validation humaine obligatoire.
- Tracabilite complete des actions.

### 23.7 Argumentaire juridique et conformite

Principes juridico-reglementaires couverts:
- Confidentialite et minimisation des donnees (RGPD).
- Tracabilite des decisions et actions.
- Absence de decision automatisee sans controle humain.
- Supervision humaine systematique sur les etapes critiques.

### 23.8 Positionnement concurrentiel

Lecture concurrentielle:
- Solutions classiques: gestion dossier standard, IA limitee sur le flux entrant.
- MemoLib: email comme point d'entree natif du dossier juridique, puis transformation structuree et workflow intelligent.

Differentiateur principal:
- L'email devient l'entree operationnelle du dossier juridique.

### 23.9 Formulation institutionnelle de reference

Texte de reference (presentation client/expert):

MemoLib est une solution LegalTech concue pour assister les professionnels du droit
dans la gestion de leurs flux d'information.

La solution transforme automatiquement les emails et documents en dossiers structures,
tout en garantissant un controle humain total, une tracabilite complete et le respect
des exigences de confidentialite.

L'objectif est de faire gagner du temps sur les taches repetitives a faible valeur,
sans remplacer la responsabilite ni l'expertise du professionnel.

## 24. Kit de communication immediate

### 24.1 Pitch oral 30 secondes

MemoLib est une solution LegalTech qui transforme les emails entrants en dossiers juridiques structures.
Elle reduit la ressaisie, securise les flux et laisse toujours la decision au professionnel.
Resultat: moins de charge administrative, plus de temps pour le travail juridique a forte valeur.

### 24.2 Pitch oral 2 minutes

MemoLib repond a un probleme concret: les cabinets et services juridiques traitent un volume massif d'emails,
avec un risque de perte d'information, de double saisie et d'oubli de delais.

Notre approche est simple: l'email devient le point d'entree du dossier.
MemoLib analyse les messages et pieces jointes, propose une structuration du dossier,
et orchestre le workflow de traitement.

La valeur cle est le controle: l'IA assiste, mais ne decide pas.
Chaque etape sensible est validee par un utilisateur, avec une tracabilite complete.

Sur le plan metier, cela reduit le temps passe sur le tri et la saisie,
ameliore la fiabilite de traitement et renforce la conformite.

Sur le plan technique et juridique, la solution est modulaire, interoperable,
et alignee avec les exigences de confidentialite, de responsabilite professionnelle et de controle humain.

### 24.3 Demo client scenarisee (15 minutes)

Objectif demo:
- Montrer le passage email -> dossier exploitable avec validation humaine.

Scenario recommande:
1. Arrivee d'un email client avec piece jointe.
2. Detection automatique des metadonnees (client, sujet, priorite, echeance potentielle).
3. Proposition de creation/mise a jour dossier.
4. Validation humaine explicite (approve/reject).
5. Affichage de la tracabilite (qui, quoi, quand).
6. Recherche ulterieure du dossier et suivi de statut.

Messages a marteler en demo:
- Pas de remplacement du professionnel.
- Pas d'action critique sans validation.
- Gain de temps sur taches repetitives.

### 24.4 Trame de reponse appel d'offre (RC / CCTP / CCAP)

Structure conseillee:
1. Resume executif (enjeux metier, proposition de valeur, gains attendus).
2. Reponse au RC (capacite, references, organisation projet, planning).
3. Reponse au CCTP (couverture exigence par exigence avec preuves).
4. Reponse au CCAP (engagements contractuels, SLA, support, reversibilite).
5. Securite et RGPD (hebergement, chiffrement, gouvernance des acces, journalisation).
6. Methode de deploiement et conduite du changement.
7. Annexes techniques (architecture, API, plan de tests, matrice de conformite).

Pieces de preuve a fournir systematiquement:
- Matrice exigences -> fonctionnalites -> tests -> preuves.
- Procedure de gestion des incidents et engagements SLA.
- Procedure de sauvegarde/restauration et plan de continuite.
- Modalites de reversibilite et export des donnees/audits.

## 25. Version orale dirigeant (2 minutes)

Message cible:
- Montrer une vision claire, des gains mesurables et une maitrise du risque juridique.

Script recommande:

Aujourd'hui, la plupart des equipes juridiques travaillent sous pression informationnelle:
emails disperses, pieces jointes multiples, doubles saisies et risques d'oubli de delais.

MemoLib repond a ce probleme de facon tres pragmatique.
Nous prenons l'email comme point d'entree du dossier juridique,
et nous le transformons en dossier structure, exploitable et tracable.

Concretement, la solution propose une analyse intelligente des messages,
organise les informations utiles, puis declenche un workflow metier.
Le point cle est non negociable: l'humain garde le controle.
Aucune decision critique n'est automatisee sans validation explicite.

Pour le cabinet ou la direction juridique, le benefice est double:
un gain de temps operationnel sur les taches repetitives,
et une reduction du risque grace a la tracabilite et a la standardisation des traitements.

MemoLib n'est pas une IA qui remplace le professionnel.
MemoLib est une plateforme qui augmente la capacite des equipes,
securise le process et ameliore la qualite d'execution quotidienne.

## 26. Version ecrite reponse marche public (base reutilisable)

### 26.1 Resume executif

MemoLib est une solution LegalTech destinee aux cabinets d'avocats et services juridiques,
concue pour transformer les emails et documents entrants en dossiers structures,
avec validation humaine obligatoire et tracabilite complete des actions.

La solution vise trois resultats prioritaires:
- Gain de productivite sur les taches de tri et de ressaisie.
- Fiabilisation du traitement des flux juridiques.
- Renforcement de la conformite (confidentialite, auditabilite, controle humain).

### 26.2 Reponse type au RC (capacite et methode)

Le titulaire propose:
- Une methode de deploiement progressive limitee en risque.
- Un pilotage projet avec instances de gouvernance et jalons de validation.
- Une conduite du changement orientee usages metier (formation, adoption, support).

L'organisation de mise en oeuvre comprend:
- Cadrage fonctionnel et technique initial.
- Parametrage et integration avec l'existant.
- Recette fonctionnelle, technique et securite.
- Mise en production et accompagnement post-demarrage.

### 26.3 Reponse type au CCTP (couverture fonctionnelle)

MemoLib couvre les exigences cle suivantes:
- Ingestion des emails et detection des nouveaux flux.
- Extraction assistee des informations utiles au dossier.
- Creation/mise a jour de dossiers avec historisation.
- Workflow de traitement avec assignation, priorites et suivi.
- Recherche transverse et tableau de bord de pilotage.
- Journalisation des actions sensibles et controle d'acces.

Principe de preuve:
- Chaque exigence est rattachee a un cas de test et a une preuve de resultat,
conformement a la matrice de tracabilite.

### 26.4 Reponse type au CCAP (engagements)

Le titulaire s'engage sur:
- Niveaux de service cibles (disponibilite, prise en charge incident, retablissement).
- Support et maintenance corrective durant la periode contractuelle.
- Reversibilite avec export des donnees metier et journaux d'audit en format ouvert.

### 26.5 Securite, RGPD, responsabilite

MemoLib est aligne avec les principes attendus:
- Confidentialite des donnees et gestion stricte des acces.
- Tracabilite des actions et decisions.
- Controle humain obligatoire sur les etapes critiques.
- Absence de prise de decision automatisee autonome.

Positionnement de responsabilite:
- La solution assiste le professionnel et ne se substitue pas a sa responsabilite.

### 26.6 Clauses de langage recommandees (copier-coller)

Clause de controle humain:
- Le titulaire confirme que les mecanismes d'intelligence artificielle integres a la solution
ont un role d'assistance a la decision et ne produisent aucune decision juridique autonome.
Toute action critique demeure soumise a validation expresse d'un utilisateur habilite.

Clause de tracabilite:
- Le titulaire garantit la journalisation des actions sensibles,
incluant l'identification de l'utilisateur, l'horodatage et la nature de l'action,
afin de permettre audit, controle interne et reconstitution des traitements.

Clause de confidentialite:
- Le titulaire met en oeuvre des mesures techniques et organisationnelles appropriees
pour assurer la confidentialite, l'integrite et la disponibilite des donnees traitees.

## 27. Script de demo client minute par minute (15 minutes)

### 27.1 Objectif et message directeur

Objectif:
- Faire constater le passage fluide email -> dossier -> action,
avec maitrise du risque et controle utilisateur.

Message directeur:
- Gain de temps sans perte de controle.

### 27.2 Deroule conseille

Minute 0 a 1 - Introduction
- Presenter le probleme terrain: surcharge email, ressaisie, risque d'oubli.
- Annoncer le fil rouge: montrer comment MemoLib structure et securise le flux.

Minute 1 a 3 - Arrivee d'un email reel
- Afficher un email entrant avec piece jointe.
- Mettre en avant la detection automatique du nouveau flux.

Minute 3 a 5 - Analyse assistee
- Montrer les informations proposees: client, objet, priorite, elements de contexte.
- Expliquer que ce sont des suggestions, pas des decisions.

Minute 5 a 7 - Validation humaine
- Executer une validation explicite (approve/reject).
- Insister sur le controle humain obligatoire.

Minute 7 a 9 - Creation/mise a jour dossier
- Montrer le dossier structure genere.
- Illustrer le workflow (statut, assignation, priorite, echeance).

Minute 9 a 11 - Tracabilite et audit
- Afficher l'historique des actions (qui, quoi, quand).
- Souligner la valeur conformite et responsabilite.

Minute 11 a 13 - Recherche et suivi
- Rechercher le dossier via plusieurs criteres.
- Montrer l'acces rapide a l'information utile.

Minute 13 a 14 - Integration et deploiement
- Expliquer l'approche progressive d'integration (API/export/interoperabilite).
- Rassurer sur le faible impact de demarrage.

Minute 14 a 15 - Conclusion et call-to-action
- Resumer les gains: productivite, fiabilite, conformite.
- Proposer un pilote cadre sur un perimetre restreint.

### 27.3 Objections frequentes et reponses courtes

"L'IA peut-elle agir seule ?"
- Non. MemoLib propose, l'utilisateur valide.

"Quel est le risque en cas d'erreur de suggestion ?"
- La suggestion est revue par un professionnel avant action critique.

"Peut-on l'integrer sans changer tout notre SI ?"
- Oui. L'integration est progressive, avec interop et export.

"Quel gain concret attendre ?"
- Moins de tri manuel, moins de ressaisie, plus de temps sur les taches a valeur.

## 28. Trame de soutenance Q/R (20 questions difficiles)

### 28.1 Gouvernance, metier, responsabilite

Q1 - Pourquoi ne pas garder notre organisation actuelle basee sur email + tableurs ?
- Parce que ce mode ne scale pas: il augmente le risque d'oubli, la ressaisie et la variabilite de traitement. MemoLib standardise et trace.

Q2 - En quoi MemoLib est-il different d'un simple outil de gestion de dossiers ?
- Le point d'entree natif est l'email. La transformation email -> dossier est assistee et structuree, avec workflow et audit.

Q3 - Qui reste responsable en cas d'erreur ?
- Le professionnel habilite. L'IA est un assistant de proposition, la validation humaine est obligatoire.

Q4 - Comment evitez-vous l'effet "boite noire" de l'IA ?
- Par la tracabilite des suggestions et decisions utilisateur, avec journal d'action et justification operationnelle.

Q5 - Quels gains metier pouvons-nous promettre sans surpromettre ?
- Diminution de la ressaisie, reduction du temps de tri, meilleure continuite de suivi. Les gains chiffrent selon volumetrie reelle.

### 28.2 Securite, confidentialite, conformite

Q6 - Ou sont hebergees les donnees sensibles ?
- En environnement securise, local ou cloud selon choix client, avec controle des acces et chiffrement en transit.

Q7 - Quelles garanties de confidentialite sont prevues ?
- Gestion stricte des droits, journalisation des acces sensibles, politique de secrets hors code source et procedures d'exploitation.

Q8 - Etes-vous compatible avec les exigences RGPD ?
- Oui sur les principes de base: finalite, minimisation, tracabilite, gestion des droits, conservation parametree.

Q9 - Comment gerez-vous les preuves en cas d'audit interne ?
- Par export des journaux d'audit, historique des actions et matrice exigences -> tests -> preuves.

Q10 - Que se passe-t-il en cas d'incident de securite ?
- Processus de gestion d'incident, containment, analyse, correction, et communication selon cadre contractuel.

### 28.3 Technique, integration, exploitation

Q11 - Peut-on integrer MemoLib sans remplacer notre SI actuel ?
- Oui, l'approche est progressive: interop, API et export, avec migration par etapes.

Q12 - Le systeme est-il verrouille sur une technologie unique ?
- Non. L'architecture est modulaire, avec separation des couches et strategie de portabilite.

Q13 - Quelles performances cibles sont visees ?
- Reponse rapide sur les parcours coeur et recherche optimisee sur corpus nominal, avec suivi KPI.

Q14 - Quelle est votre strategie de continuite de service ?
- Sauvegarde reguliere, procedure de restauration testee, objectifs RPO/RTO documentes.

Q15 - Que se passe-t-il si la brique IA est indisponible ?
- Le fonctionnement coeur reste operable en mode degrade avec validation manuelle.

### 28.4 Projet, deploiement, engagement fournisseur

Q16 - Quel est le risque principal de projet et votre mitigation ?
- Risque d'adoption usage. Mitigation: pilote cible, formation, accompagnement, indicateurs d'adoption.

Q17 - Combien de temps pour une mise en service utile ?
- Une trajectoire en phases courtes permet un premier perimetre exploitable rapidement, puis extension progressive.

Q18 - Comment evitez-vous les regressions a chaque evolution ?
- Tests automatises, recette structuree, controle avant mise en production, et plan de retour arriere.

Q19 - Que garantit la reversibilite ?
- Export des donnees metier et journaux, documentation de reconstruction, et procedure de transfert.

Q20 - Pourquoi vous choisir face a un acteur etabli ?
- Parce que MemoLib adresse le vrai goulet d'etranglement operationnel: le flux email entrant, avec controle humain et conformite au centre.

### 28.5 Format de reponse court en soutenance

Reponse type recommandee (30 secondes):
- MemoLib n'automatise pas la decision juridique, il automatise la preparation du travail.
- Le professionnel conserve la main, chaque action critique est tracee.
- La valeur est immediate: moins de tri, moins de ressaisie, plus de fiabilite operationnelle.

## 29. Verification promesse client vs etat applicatif

### 29.1 Conclusion de conformite (etat actuel)

Statut global:
- Partiellement conforme a la promesse client.

Forces deja conformes:
- Workflow de validation humaine explicite (approve/reject) present.
- Traçabilite des transitions de workflow disponible.
- Ingestion email reelle (IMAP) et traitement d'evenements actifs.
- Authentification JWT et base RBAC presentes.

Ecarts bloquants avant promesse client contractuelle:
- Protection insuffisante des endpoints pipeline sensibles (auth/autorisation explicite a renforcer).
- Presence de resultats de recherche simules sur un endpoint pipeline.
- Mode invite-only non formalise de bout en bout pour l'usage client cible.
- Journalisation/audit a unifier pour preuve contractuelle et controle interne.

### 29.2 Plan de fermeture des ecarts (priorisation)

P0 - Obligatoire avant engagement client:
1. Securiser le groupe /api/pipeline avec authentification et autorisation explicites.
2. Remplacer les reponses de recherche simulees par une implementation connectee aux donnees reelles.
3. Definir et appliquer un mode invite-only operationnel (configuration, enforcement, tests).
4. Ajouter des tests d'acces non authentifie/insuffisamment autorise sur endpoints critiques.

P1 - Obligatoire avant generalisation multi-clients:
1. Unifier les evenements de workflow et les journaux d'audit pour une piste de preuve unique.
2. Ajouter export audit structure (filtrage periode, acteur, dossier, action).
3. Renforcer la documentation de responsabilite (qui valide, qui execute, qui audite).

P2 - Renforcement excellence produit:
1. Mettre en place indicateurs de completude d'audit (exhaustivite des transitions).
2. Ajouter controles anti-derive (alertes si action sensible sans trace attendue).
3. Industrialiser la recette de conformite dans la pipeline CI.

### 29.3 Criteres de sortie "Pret client"

Le produit est considere "pret client" si:
- Tous les endpoints critiques sont proteges et testes (401/403 valides).
- Aucun endpoint de production ne retourne de contenu simule pour un cas metier critique.
- La validation humaine est techniquement non contournable sur actions critiques.
- L'audit exportable permet de reconstituer un dossier de bout en bout.
- Les preuves de tests (fonctionnel, integration, securite) sont attachees a la matrice de conformite.

### 29.4 Message de transparence commerciale recommande

Formulation conseillee en rendez-vous:
- MemoLib est deja operationnel sur le flux email et la validation humaine.
- Nous finalisons les derniers verrous de conformite production (securisation endpoint, audit unifie, recette contractuelle).
- Cette trajectoire est planifiee et mesurable, avec jalons de preuve avant engagement generalise.

## 30. Check-list technique P0 executable (pret client)

### 30.1 Objectif

Fermer les ecarts bloquants identifies en section 29.2 afin d'atteindre un statut "pret client contractuel".

### 30.2 Chantier P0-1: securiser les endpoints pipeline

Etat d'avancement:
- Fait (2026-04-05): groupe /api/pipeline protege par authentification.
- Fait (2026-04-05): endpoint metrics protege par politique d'autorisation (role requis).
- Fait (2026-04-05): tests integration 401/403 ajoutes et valides.

Preuves techniques:
- Program.cs (groupe pipeline avec RequireAuthorization + restriction metrics).
- tests/Pipeline.IntegrationTests/PipelineEndpointsIntegrationTests.cs (cas PipelineEndpoints_Return401_WhenUnauthenticated et Metrics_Return403_WhenRoleInsufficient).
- Resultat test: 11 tests passes, 0 echec (Pipeline.IntegrationTests).

Livrable attendu:
- Endpoints pipeline critiques accessibles uniquement aux utilisateurs authentifies et autorises.

Actions techniques:
1. Appliquer une contrainte d'autorisation explicite au groupe /api/pipeline.
2. Verifier les politiques d'acces adaptees aux operations sensibles (review, metrics, search).
3. Ajouter des tests d'integration pour valider les cas 401 et 403.

Fichiers cibles:
- Program.cs
- tests/Pipeline.IntegrationTests/PipelineEndpointsIntegrationTests.cs

Critere d'acceptation:
- Un appel non authentifie sur endpoint critique retourne 401.
- Un appel authentifie sans role requis retourne 403.

### 30.3 Chantier P0-2: supprimer les reponses simulees sur la recherche pipeline

Livrable attendu:
- Endpoint de recherche alimente par donnees reelles (ou desactive en production si non finalise).

Actions techniques:
1. Remplacer les resultats statiques par une requete sur les sources metier.
2. Definir un comportement explicite en cas de source indisponible (erreur lisible, pas de faux positifs).
3. Ajouter tests de non-regression fonctionnelle (resultat vide, resultat partiel, filtres).

Fichiers cibles:
- Program.cs
- Services/AdvancedSearchService.cs (ou service equivalent)
- tests/Pipeline.IntegrationTests/PipelineEndpointsIntegrationTests.cs

Critere d'acceptation:
- Aucune reponse metier critique ne contient de contenu "simule" en production.

### 30.4 Chantier P0-3: formaliser le mode invite-only

Livrable attendu:
- Mode invite-only active/desactive par configuration, avec enforcement API et preuve testee.

Actions techniques:
1. Definir variables de configuration officielles (nommage stable, documentation).
2. Appliquer la regle en middleware/endpoint d'acces.
3. Ajouter tests d'acceptation (utilisateur non invite refuse, utilisateur invite accepte).

Fichiers cibles:
- Middleware/DemoAuthMiddleware.cs (ou middleware d'acces equivalent)
- Program.cs
- README.md
- tests/ (suite integration/auth)

Critere d'acceptation:
- Le mode invite-only est verifiable en environnement de test et reproductible.

### 30.5 Chantier P0-4: preuve d'audit minimale contractuelle

Livrable attendu:
- Reconstitution d'un cycle complet email -> decision -> dossier avec traces exportables.

Actions techniques:
1. Harmoniser la trace workflow et la trace d'audit exploitable.
2. Ajouter un endpoint ou export preuve pour audit interne.
3. Ajouter un test de bout en bout qui verifie la presence des evenements critiques.

Fichiers cibles:
- Services/PipelineWorkflowStore.cs
- Models/AuditLog.cs
- tests/Pipeline.IntegrationTests/PipelineEndpointsIntegrationTests.cs

Critere d'acceptation:
- Un auditeur peut reconstruire qui a decide, quoi, quand, sur un dossier cible.

### 30.6 Campagne de verification finale (go/no-go)

Tests obligatoires:
1. Tests pipeline integration:
	dotnet test tests/Pipeline.IntegrationTests/Pipeline.IntegrationTests.csproj --nologo --verbosity minimal
2. Tests d'acces (401/403) ajoutes sur endpoints critiques.
3. Verification manuelle d'un scenario complet en environnement de demonstration.

Preuves a archiver:
- Rapport de tests (CI ou execution locale signee date/commit).
- Extrait de logs/audit d'un scenario complet.
- Capture de reponse API prouvant blocage non authentifie.

Decision go/no-go:
- GO uniquement si tous les criteres d'acceptation P0-1 a P0-4 sont valides.
