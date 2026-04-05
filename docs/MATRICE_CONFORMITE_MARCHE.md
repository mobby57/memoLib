# Matrice de Conformite Marche - MemoLib

Date de reference: 2026-04-05
Version: 1.0
Objet: trame de reponse aux exigences du DCE (CCTP/RC/CCAP) avec preuves verifiables

## Mode d'emploi

- Colonne Exigence acheteur: reprendre mot pour mot la clause du DCE.
- Colonne Reponse MemoLib: indiquer conforme, partiellement conforme, ou hors perimetre.
- Colonne Preuve: lier document, test, capture, journal, ou rapport.
- Colonne Ecart/Action: decrire l'action de comblement avec responsable et date cible.

Statuts recommandes:
- Conforme
- Partiellement conforme
- Non conforme
- Hors perimetre

## 1. Exigences fonctionnelles

| ID DCE | Exigence acheteur | Reponse MemoLib | Niveau | Preuve | Ecart/Action | Responsable | Date cible |
|---|---|---|---|---|---|---|---|
| F-001 | Collecte automatique des emails | Conforme (scan IMAP periodique configurable) | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section EF-001 | Neant | Produit | 2026-04-05 |
| F-002 | Creation dossier depuis email | Conforme (creation en 1 clic + pre-remplissage) | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section EF-010/EF-011 | Neant | Produit | 2026-04-05 |
| F-003 | Validation humaine des suggestions IA | Conforme | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section EF-005 | Neant | Produit | 2026-04-05 |
| F-004 | Recherche transverse multi-criteres | Conforme | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section EF-020/EF-021 | Neant | Produit | 2026-04-05 |
| F-005 | Tableau de bord KPI | Conforme | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section EF-030/EF-031/EF-032 | Neant | Produit | 2026-04-05 |

## 2. Exigences techniques et performance

| ID DCE | Exigence acheteur | Reponse MemoLib | Niveau | Preuve | Ecart/Action | Responsable | Date cible |
|---|---|---|---|---|---|---|---|
| T-001 | Temps de chargement ecran coeur | Conforme (objectif p95 < 2s) | Partiellement conforme | docs/CAHIER_DES_CHARGES_V2026-04.md ENF-001 | Joindre rapport de mesure en environnement cible | Tech lead | A planifier |
| T-002 | Latence recherche | Conforme (objectif < 300 ms) | Partiellement conforme | docs/CAHIER_DES_CHARGES_V2026-04.md ENF-002 | Joindre resultats de bench reproduisibles | Tech lead | A planifier |
| T-003 | Non-regression automatisee | Conforme | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md ENF-005 + section recette | Harmoniser matrice tests vs exigences DCE | QA | A planifier |

## 3. Securite, RGPD, conformite

| ID DCE | Exigence acheteur | Reponse MemoLib | Niveau | Preuve | Ecart/Action | Responsable | Date cible |
|---|---|---|---|---|---|---|---|
| S-001 | Authentification et controle d'acces | Conforme (JWT + RBAC) | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md EF-040 | Neant | Securite | 2026-04-05 |
| S-002 | Tracabilite des actions sensibles | Conforme (audit trail) | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md EF-042 | Neant | Securite | 2026-04-05 |
| S-003 | Gestion des secrets | Conforme | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md EF-043 + SEC-004 | Ajouter preuve de rotation periodique | Securite | A planifier |
| S-004 | Politique RGPD complete | Partiellement conforme | Partiellement conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section 17 | Completer registre de traitement et DPA | Juridique + DPO | A planifier |

## 4. Exploitation, SLA, continuite

| ID DCE | Exigence acheteur | Reponse MemoLib | Niveau | Preuve | Ecart/Action | Responsable | Date cible |
|---|---|---|---|---|---|---|---|
| E-001 | SLA de disponibilite | Conforme (>= 99.0% plage ouvrable) | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md SLA-001 | Neant | Exploitation | 2026-04-05 |
| E-002 | Delais de prise en charge incidents | Conforme (P1/P2 defines) | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md SLA-002/SLA-003 | Neant | Support | 2026-04-05 |
| E-003 | PRA/PCA et restauration testee | Partiellement conforme | Partiellement conforme | docs/CAHIER_DES_CHARGES_V2026-04.md OPS-001 a OPS-005 | Joindre PV de test restauration et test PRA | Exploitation | A planifier |
| E-004 | Reversibilite contractuelle | Conforme | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section 16.3 | Neant | Direction projet | 2026-04-05 |

## 5. Economique et engagement contractuel

| ID DCE | Exigence acheteur | Reponse MemoLib | Niveau | Preuve | Ecart/Action | Responsable | Date cible |
|---|---|---|---|---|---|---|---|
| C-001 | Decomposition des couts | Conforme (trame complete) | Partiellement conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section 21 | Renseigner montants reellement proposes | Direction | A planifier |
| C-002 | Conditions de revision de prix | Conforme | Conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section 21.3 | Neant | Direction | 2026-04-05 |
| C-003 | Planning contractualise | Partiellement conforme | Partiellement conforme | docs/CAHIER_DES_CHARGES_V2026-04.md section 12 + 19 | Ajouter dates fermes et jalons de livraison | PMO | A planifier |

## 6. Decision de conformite

Synthese a renseigner avant depot:
- Nombre exigences conformes:
- Nombre exigences partiellement conformes:
- Nombre exigences non conformes:
- Risques residuels majeurs:
- Plan de levee des ecarts:

Decision recommandee:
- Depot possible sans reserve
- Depot possible avec reserves explicites
- Depot a differer

## 7. Pieces a joindre au dossier de reponse

- Cahier des charges a jour: docs/CAHIER_DES_CHARGES_V2026-04.md
- Matrice de conformite presente
- Catalogue de preuves (tests, journaux, captures)
- Offre financiere detaillee (BPU/DPGF selon marche)
- Planning detaille avec jalons dates
- Engagements SLA et support
- Annexes RGPD (registre, roles, retention, DPA)

## 8. Matrice d'execution prioritaire (Go/No-Go recette)

Objectif: transformer les exigences critiques en preuves verifiables avant decision de mise en service.

| Ref | Exigence source | Test associe | Seuil d'acceptation | Preuve attendue | Statut |
|---|---|---|---|---|---|
| G-001 | EF-001 Scan IMAP automatique | Test integration ingestion auto (intervalle 60s) | Nouveau message detecte < 90s, sans doublon | Rapport test + logs horodates | A executer |
| G-002 | EF-002 Anti-doublon message id | Rejouer 2 fois le meme lot email | 0 doublon cree en base | Export requete de controle + log | A executer |
| G-003 | EF-003 Scan manuel historique | Lancer scan manuel sur boite de test | 100% des messages cibles importes | Compte-rendu execution + compteur import | A executer |
| G-004 | EF-005 Validation humaine IA | Scenario approve/reject sur suggestions | 100% des decisions IA tracees | Capture UI + trace audit | A executer |
| G-005 | EF-010 Creation dossier depuis email | Test API/UI creation en 1 clic | Dossier cree sans erreur, lien email conserve | Reponse API + capture dossier | A executer |
| G-006 | EF-013 Historisation workflow | Transition OPEN -> IN_PROGRESS -> CLOSED | 100% transitions horodatees | Journal evenements dossier | A executer |
| G-007 | EF-014 Attribution dossier | Affecter puis re-affecter un dossier | Attribution visible en temps reel | Capture UI + evenement audit | A executer |
| G-008 | EF-021 Recherche multi-criteres | Recherche combinee statut/tag/priorite/date | Resultats corrects et filtres respectes | Script de test + sortie resultat | A executer |
| G-009 | EF-030 Dashboard KPI quotidiens | Verification KPI sur jeu de donnees connu | KPI coherents avec donnees source | Test execute: `dotnet test tests/Pipeline.IntegrationTests/Pipeline.IntegrationTests.csproj --filter "FullyQualifiedName~Metrics_ReturnsExpectedAggregates_ForTenantWindow"` (resultat: 1/1 succes, 0 echec) + endpoint `/api/pipeline/metrics` retourne HTTP 200 | Valide (local) |
| G-010 | EF-040 Endpoint protege JWT | Appel endpoint protege sans token | HTTP 401 obligatoire | Test existant: `tests/e2e/critical-features.spec.ts` (assertions 401/403 sur endpoints proteges) + log requete/reponse | A executer (test identifie) |
| G-011 | EF-042 Audit actions sensibles | Executer creation, update, suppression sensible | 100% actions critiques journalisees | Tests existants: `tests/e2e/advanced-scenarios.spec.ts` (audit trail) et `tests/e2e/legal-proof.spec.ts` (check-audit) + extrait audit | A executer (test identifie) |
| G-012 | EF-043 Secrets hors code | Controle repository et config runtime | 0 secret en clair versionne | Rapport scan secrets + .gitignore | A executer |
| G-013 | ENF-001 Performance UI | Mesure p95 ecrans coeur | p95 < 2s | Rapport performance versionne | A executer |
| G-014 | ENF-005 Tests auto pipeline | Execution pipeline CI complete | 100% jobs obligatoires green | Preuve locale: `dotnet test tests/Pipeline.IntegrationTests/Pipeline.IntegrationTests.csproj` (dernier run local: exit code 0) + commit `04bab307afca16373d415ff4f98ab6b868743268` (`feat(pipeline): add metrics endpoint and integration coverage`) | Partiellement valide (local OK, CI a confirmer) |
| G-015 | OPS-004 Test restauration | Restauration depuis sauvegarde de reference | RPO <= 24h et RTO <= 8h | PV restauration signe | A executer |

Regle de decision Go/No-Go:
- Go si toutes les lignes G-001 a G-015 sont au statut Valide.
- No-Go si au moins 1 ligne critique securite (G-010, G-011, G-012) est en echec.
- No-Go conditionnel si performance/ops (G-013, G-015) non valides sans plan de mitigation signe.
