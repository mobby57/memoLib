# Matrice de traçabilité des tests critiques

**Statut :** inventaire statique à compléter par résultats de CI  
**Portée :** flux sensibles du pilote MemoLib

Cette matrice ne déduit pas qu'un contrôle est implémenté parce qu'un fichier de
test porte un nom similaire. Une ligne est validée uniquement après revue du
test, exécution réussie et lien de preuve dans
[`RELEASE_REQUIREMENTS.json`](RELEASE_REQUIREMENTS.json).

| Flux                        | Route ou service                                                        | Preuves de test repérées                                                                                             | Contrôles à confirmer                                                                       | Statut    |
| --------------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------- |
| Ingestion email             | `POST /api/emails/incoming` et service d'ingestion                      | `src/__tests__/api/emails/incoming-route.test.ts`, `src/__tests__/api/emails/incoming-route.integration.test.ts`     | Signature, rejeu, idempotence, Zod, rate limit, isolation tenant, audit                     | À auditer |
| Connexion messagerie        | `/api/email/connect/*`, synchronisation cron                            | tests d'email et de flux à inventorier                                                                               | État OAuth signé, PKCE, liaison à la session, chiffrement des tokens, tenant                | À auditer |
| Documents                   | `/api/documents/*`, `/api/client/documents/*`, `/api/admin/documents/*` | `tests/unit/document-security.test.ts`, `src/__tests__/domain/documents.test.ts`                                     | Auth, rôle, tenant, propriété dossier, MIME, taille, chemin, antivirus/quarantaine, audit   | À auditer |
| Dossiers                    | `/api/dossiers/*`, `/api/client/dossiers/*`, service dossier            | `src/__tests__/api/dossiers/dossiers.test.ts`, `src/__tests__/domain/dossier-status.test.ts`                         | Auth, rôle, tenant, transactions, audit, réponses 400/403/404                               | À auditer |
| Propositions d'action       | `/api/action-proposals/*`, `action-proposal.service`                    | `src/__tests__/api/action-proposals-route.test.ts`                                                                   | Auth Clerk réelle, rôle, tenant, décision concurrente, idempotence, audit                   | À auditer |
| Authentification            | Clerk, `src/lib/clerk-auth.ts`, middlewares                             | `tests/unit/rbac.test.ts`, `tests/unit/rbac-cross-role.test.ts`, `src/__tests__/lib/auth/dossier-access.test.ts`     | Session Clerk, pages protégées, rôle, tenant, récupération et révocation                    | À auditer |
| Passkeys                    | Écran Clerk `settings/security` et `SignIn`                             | Aucun test applicatif repéré                                                                                         | Affichage Clerk, inscription, connexion, révocation, perte d'appareil, politique production | À auditer |
| IA                          | `/api/ai/*`, `hybrid-client`, `prompt-sanitizer`                        | `tests/unit/ai-cache-tenant.test.ts`, `src/__tests__/lib/ai-cache.test.ts`, `src/__tests__/lib/ai-isolation.test.ts` | Minimisation réelle, tenant, schéma de sortie, timeout, fournisseur, cache, journalisation  | Partiel   |
| Consentement et droits RGPD | `/api/compliance/*`, `/api/user/export`, `/api/user/delete`             | `src/__tests__/compliance/gdpr-right-to-erasure.test.ts`, `src/__tests__/compliance/gdpr.coverage.test.ts`           | Auth Clerk, identité, tenant, conservation légale, export, annulation et audit              | À auditer |
| Délais CESEDA               | moteur de calcul et scénarios juridiques                                | `tests/unit/deadline-engine.test.ts`                                                                                 | Cas OQTF, jours fériés, jours ouvrés, exceptions, validation humaine et source juridique    | À auditer |
| Observabilité               | métriques, journaux, alertes                                            | tests à identifier                                                                                                   | Accès à `/api/metrics`, anonymisation, latence, erreurs, alertes, rétention                 | À auditer |

## Règle de preuve

Pour valider une exigence, ajouter au registre :

1. le chemin du test et la commande ciblée ;
2. le lien de configuration ou de procédure pour les contrôles externes ;
3. la date, l'environnement et le résultat ;
4. le propriétaire de la validation.

Les contrôles externes — configuration Clerk de production, PITR, alertes,
analyse antimalware et DPA fournisseurs — ne peuvent pas être validés par un
test unitaire seul.
