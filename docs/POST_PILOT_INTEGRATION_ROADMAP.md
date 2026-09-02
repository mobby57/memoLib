# Feuille de route des intégrations post-pilote

**Statut :** proposition soumise à décisions — 1 septembre 2026  
**Périmètre :** cette feuille de route ne déclenche ni appel fournisseur, ni
configuration externe, ni création d'API. Une intégration ne passe en delivery
qu'après son gate de décision.

## Point de départ vérifié

| Domaine                       | Réutilisable dans le dépôt                                                                                                 | Limite constatée / conclusion                                                                                                                                                                                                      |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API publiques et institutions | Client OAuth PISTE/Légifrance et route de recherche authentifiée/rate-limitée ; export FEC et modèles comptables présents. | Légifrance est de la **consultation** ; RPVA, Télérecours, ANTS et aide juridictionnelle sont seulement des options de `ROADMAP.md`. Aucun dépôt institutionnel ne doit être déduit de l'existant.                                 |
| Signature                     | Route de demande Yousign et preuves métier ; guide eIDAS.                                                                  | La demande bascule en simulation sans clé et `eidas-signature.service.ts` est explicitement un stub : pas de signature opposable ni de vérification fournisseur à ce stade.                                                        |
| Google / Outlook Calendar     | `CalendarEvent` persistant, connecteurs Google/Graph, pont de mapping, ICS et écrans d'intégration.                        | `CalendarService` conserve ses synchronisations en mémoire ; les connecteurs internes sont des stubs. La route Google transmet un token reçu dans le body. Ce n'est pas une synchronisation de production.                         |
| PWA / hors connexion          | Manifest, `public/sw.js` et composant d'enregistrement existent.                                                           | Le composant désenregistre actuellement tous les service workers à cause de CSP ; le manifest démarre sur la démo. Le cache d'API du SW est incompatible par défaut avec des réponses tenant/PII : aucune promesse offline métier. |
| Billing / facturation         | Factures tenant-scopées, lignes, paiements, Checkout Stripe et webhook transactionnel/idempotent sont présents.            | Deux parcours Stripe coexistent (abonnement et paiement de facture) et certains handlers historiques ne portent pas systématiquement le tenant. L'intégration nécessite une consolidation, pas un nouveau fournisseur d'abord.     |

**Socle transversal existant :** `Tenant`, `User`, `Subscription`, `Facture`,
`CalendarEvent`, `Proof`, `AuditLog` et `ActionProposal` sont tenant-scopés
dans Prisma ; `ActionProposal` dispose déjà d'une clé d'idempotence par tenant.
Le RBAC distingue notamment les permissions factures/paiement. Ces éléments
sont à réemployer, après vérification route par route.

Les documents de pilote imposent déjà une session, un scope tenant côté serveur,
Zod, validation humaine des mutations et des webhooks signés/idempotents
(`MEMOLIB_PILOT_ARCHITECTURE.md`, `CADRAGE_DECISION_TECHNIQUE.md`). Les
documents plus anciens qui décrivent Flask/NextAuth sont historiques et ne
constituent pas le contrat cible.

## Préconditions communes — gate 0

Avant tout epic :

1. **Socle d'identité.** Stabiliser l'adaptateur d'authentification en cours de
   migration et définir une fonction serveur unique qui obtient
   `userId`, `tenantId`, rôle et permissions. Le tenant ne provient jamais du
   body, de `state` ou d'un claim externe non vérifié.
2. **Modèle d'autorisation.** Une connexion appartient à
   `(tenantId, provider, externalAccountId)` et est administrée par
   `cabinet-admin`/`billing-manager` selon le domaine ; l'utilisateur
   consentant peut seulement agir dans son compte autorisé. Les données
   synchronisées restent tenant-scopées et, lorsqu'elles visent un dossier,
   respectent aussi `DossierMember`.
3. **Secrets et OAuth.** Coffre de secrets, chiffrement applicatif des tokens
   au repos, rotation/révocation, PKCE, `state` signé à usage unique, liaison
   session-utilisateur-tenant, redirect URIs figées et scopes minimaux. Les
   implémentations actuelles qui encodent simplement le tenant et l'utilisateur
   dans `state`, ou stockent des tokens sans chiffrement visible, ne satisfont
   pas ce gate.
4. **Contrat d'intégration.** Créer un registre versionné de capacités et une
   table de connexion/audit dédiée ; aucune clé ou payload fournisseur brut
   dans les logs. Chaque commande externe porte `tenantId`, acteur, corrélation,
   clé d'idempotence, version de contrat et état de synchronisation.
5. **Sécurité/RGPD.** DPA, région et sous-traitance approuvés par le DPO/RSSI ;
   AIPD si le traitement le justifie ; registre de traitement, base légale,
   information/consentement, rétention, export/effacement et procédure
   d'incident. Le registre actuel signale notamment les DPA Neon, Vercel,
   Upstash, Stripe et Sentry comme « à signer » : ce sont des bloqueurs à
   traiter, non des validations acquises.
6. **Plateforme.** CSP compatible avec les domaines strictement nécessaires,
   HSTS en production, rate limiting Upstash sur connect/callback/webhook,
   journal d'audit minimisé, alertes d'échec et runbook de révocation.

## Contrat de données et compatibilité

Adopter un modèle canonique interne, plutôt que d'exposer les payloads
fournisseurs :

```text
IntegrationConnection v1: id, tenantId, provider, externalAccountId,
capabilities[], scopes[], status, tokenRef, consentedBy, consentedAt,
revokedAt, createdAt, updatedAt

IntegrationOperation v1: id, tenantId, connectionId, resourceType,
internalResourceId, providerResourceId, direction, payloadVersion,
idempotencyKey, status, cursor/version, occurredAt, completedAt, errorCode
```

- `tokenRef` référence un secret chiffré ; il ne contient jamais le token.
- Un identifiant externe est unique au moins par `connectionId`; les upserts et
  webhooks ont une clé d'idempotence unique par tenant. Les mutations liées
  (ressource, opération, audit) sont transactionnelles.
- Les schémas Zod valident **entrée, callback et webhook**. Les champs
  inconnus sont rejetés ou ignorés explicitement ; dates ISO 8601, montants
  décimaux/centimes et fuseau sont normalisés.
- Publier des contrats JSON Schema/OpenAPI internes en version majeure
  (`v1`). Une extension est rétrocompatible ; une suppression, sémantique
  modifiée ou migration de fournisseur introduit `v2`, une période de
  lecture double et un plan de dépréciation.
- Conserver seulement un extrait minimisé de payload, hashé si suffisant, avec
  durée par domaine ; ne jamais réinjecter directement texte/OCR/email vers
  une mutation métier. Le flux reste : brut → adaptation → brouillon
  structuré → validation humaine → action autorisée.

## Epics ordonnés et gates

| Ordre | Epic et livraison proposée                                                                                                                                                                                                                                        | Prérequis spécifiques                                                                                                                     | Gate de décision, métrique de succès                                                                                                                                                                                 |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | **Stabiliser les fondations de connecteurs.** Mettre en place le contrat ci-dessus, consentement, chiffrement, jobs idempotents et observabilité commune sur un environnement sandbox.                                                                            | Gate 0 complet ; propriétaire produit, RSSI/DPO et support désignés.                                                                      | **Go** si 100 % des callbacks/webhooks invalides sont rejetés, aucune donnée sensible n'apparaît dans les logs de test et restauration/révocation sont répétables.                                                   |
| 2     | **Agenda Google puis Outlook, lecture seule.** Import incrémental borné d'événements vers `CalendarEvent`, aperçu des conflits et consentement explicite. Écriture et bidirectionnel restent désactivés.                                                          | App OAuth vérifiée, scopes minimaux (`calendar.events.readonly` puis `Calendars.Read`), token chiffré, mapping/fuseau/récurrence définis. | **Go écriture** seulement après ≥ 99,5 % d'upserts sans doublon sur le corpus pilote, aucun événement cross-tenant et ≥ 95 % de concordance des dates/fuseaux validée par utilisateurs.                              |
| 3     | **PWA consultation offline.** Réactiver un SW seulement après revue CSP ; cache chiffré/expirable limité à une liste explicitement marquée offline-safe, écran de fraîcheur et file de commandes sans mutation automatique.                                       | Threat model appareil perdu, stratégie de session/offline, invalidation logout, stratégie de conflits et tests navigateur.                | **Go pilote** si 100 % des pages/réponses hors-ligne autorisées respectent l'isolation d'utilisateur, purge au logout et reprise de file idempotente ; aucune API authentifiée générique n'est mise en cache.        |
| 4     | **Signature électronique eIDAS.** Choisir un prestataire qualifié compatible avec le besoin (simple/avancée/qualifiée), créer la demande depuis un document figé/hashé, suivre les webhooks et vérifier signature/certificat/horodatage.                          | Avis juridique sur niveau requis, DPA/région, preuve de mandat/consentement du signataire, sandbox et politique de rétention.             | **Go production** si 100 % des signatures de recette sont vérifiables indépendamment, webhooks signés et dédupliqués, et aucune signature réelle n'est simulée ou déclenchée sans validation habilitée.              |
| 5     | **API/institutions, une à la fois.** Commencer par une capacité officiellement documentée et en lecture seule (veille Légifrance/PISTE déjà amorcée) ; évaluer ensuite RPVA, Télérecours, ANTS et aide juridictionnelle séparément. Aucun dépôt/envoi automatisé. | Convention/agrément officiel, matrice d'habilitation par cabinet, sandbox, conditions d'usage, propriétaire de la décision juridique.     | **Go mutation** uniquement après accord institutionnel écrit, preuve d'identité/mandat, validation humaine à deux niveaux si dépôt, taux d'accusés de réception rapprochés ≥ 99 % et plan de reprise manuelle testé. |
| 6     | **Facturation et billing Stripe consolidés.** Unifier les flux abonnement SaaS et facture client derrière le contrat, rendre `Facture`/paiement/webhook tenant-scopés de bout en bout et rapprocher comptabilité sans faire échouer le paiement.                  | DPA Stripe, politique de taxe/TVA et numérotation validée par comptable, catalogue/prix approuvés, clés sandbox, matrice RBAC billing.    | **Go production** si 100 % des événements de recette sont vérifiés/dédupliqués, rapprochement facture-paiement ≥ 99,9 %, aucun paiement cross-tenant et reprise sans double écriture.                                |

**Séquençage recommandé :** 1 → 2 et 3 en parallèle seulement après gate 0 ;
4, 5 et 6 sont des décisions séparées, pas un lot « intégrations ». Chaque
epic est arrêté si son fournisseur impose un transfert hors UE incompatible,
des scopes disproportionnés ou une mutation sans contrôle humain.

## Recette, exploitation et revue de sortie

| Niveau              | Cas obligatoires                                                                                                                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Unitaire/contrat    | Schémas Zod, mapping canonique, versions, montants/dates/fuseaux, permissions, chiffrement et idempotence.                                                                                               |
| Intégration sandbox | OAuth PKCE/state/session, refresh/révocation, signatures de webhooks, retries, pagination/cursors, quota/rate limit, erreur fournisseur et transaction/rollback.                                         |
| Sécurité/RGPD       | Tests cross-tenant et rôle insuffisant (403), secret absent/expiré, replay webhook, injection payload, CSP/HSTS, purge offline/logout, export/effacement et revue de logs sans PII inutile.              |
| E2E/pilote contrôlé | Connexion → consentement → aperçu → validation humaine → synchronisation/réconciliation → audit ; scénario déconnecté et reprise ; procédure manuelle en cas d'indisponibilité.                          |
| Exploitation        | Dashboard par fournisseur : disponibilité, p95, échecs/retry, doublons, dérive de mapping, coût/opération, révocations et tickets. Mesures agrégées par tenant, accès restreint et rétention documentée. |

Pour chaque gate, conserver un dossier de décision : résultats de tests,
échantillon anonymisé de rapprochement, DPA/conditions vérifiés, avis DPO/RSSI
et responsable métier signataire. Les métriques des tableaux ci-dessus sont des
seuils d'acceptation proposés ; elles doivent être confirmées avant
engagement commercial ou institutionnel.

## Références de preuve

- `prisma/schema.prisma` : modèles tenant, événements, factures, preuves,
  comptes email et `ActionProposal`.
- `src/lib/calendar/calendar-service.ts`,
  `src/lib/oauth/calendar-bridge.ts`, `src/lib/oauth/integrations.ts` :
  connecteurs/calendrier partiels et store mémoire.
- `src/components/ServiceWorkerRegistration.tsx`, `public/sw.js`,
  `src/app/manifest.ts` : PWA présente mais désactivée/non prête pour les
  données métier.
- `src/app/api/signatures/request/route.ts`,
  `src/lib/services/eidas-signature.service.ts` : simulation/stub signature.
- `src/app/api/legifrance/search/route.ts`,
  `src/lib/legifrance/api-client.ts` : consultation PISTE/Légifrance.
- `src/app/api/factures/route.ts`,
  `src/app/api/payments/create-checkout/route.ts`,
  `src/app/api/payments/webhook/route.ts` : flux facturation et Stripe.
- `docs/MEMOLIB_PILOT_ARCHITECTURE.md`,
  `docs/CADRAGE_DECISION_TECHNIQUE.md`, `docs/legal/DPA-REGISTER.md`,
  `docs/legal/EIDAS_TIMESTAMP_GUIDE.md`, `docs/ROADMAP.md`.
