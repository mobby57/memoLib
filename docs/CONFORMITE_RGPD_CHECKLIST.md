# Gouvernance RGPD — état technique à valider

**Dernière revue technique :** 1er septembre 2026
**Statut :** contrôle manuel requis — ce document ne constitue ni un avis juridique ni une attestation de conformité.

## Périmètre effectivement implémenté

| Sujet | État technique | Limites et validation requise |
| --- | --- | --- |
| Authentification | Les routes RGPD résolvent la session Clerk vers le compte local et refusent un compte sans tenant. | Vérifier le provisioning Clerk ↔ compte local et les rôles avant mise en production. |
| Consentement | `POST /api/compliance/consent` accepte uniquement une liste Zodée, avec type, choix booléen et version de politique courante (`2026-10-01`). Chaque modification est horodatée dans `UserConsent`, dans une transaction. | La collecte IP/User-Agent n’est pas effectuée par ces routes. Le DPO doit déterminer si une preuve complémentaire est nécessaire et proportionnée. |
| Accès/export | Export JSON immédiat limité au profil, aux préférences de consentement et aux événements d’audit de l’utilisateur, filtrés par `tenantId` et `userId`. Réponse privée sans cache. | L’export n’inclut pas les données partagées du cabinet (dossiers, courriels, documents) car leur périmètre ne peut pas être attribué de façon sûre à un seul compte. Définir une procédure d’export cabinet validée. |
| Effacement | Une confirmation explicite crée une `DataSubjectRequest` isolée par tenant. Elle reste `PENDING_REVIEW` et peut être annulée. Aucune suppression automatique n’est exposée par l’API. | Le DPO/responsable habilité doit vérifier identité, rôle, conservation, litige/gel légal et coordination Clerk avant toute exécution. |
| Conservation | `checkLegalRetention` bloque un dossier actif, hors tenant ou avant le délai configuré. | Les durées configurées ne sont pas une qualification juridique. Le registre des durées, les bases légales et le processus de purge doivent être validés et opérés manuellement. |
| Journalisation | Les routes ne journalisent ni la charge utile, ni le motif libre, ni les données d’export. | Vérifier les politiques de conservation et l’accès aux journaux applicatifs/monitoring. |

## Routes et contrôles

| Route | Contrôles |
| --- | --- |
| `GET` / `POST /api/compliance/consent` | Session Clerk, schéma Zod strict, consentement essentiel non désactivable par cette interface. |
| `POST /api/compliance/export` | Session Clerk + tenant, JSON seulement, catégories connues. |
| `GET /api/user/export` | Même périmètre utilisateur, paramètres de catégories validés. |
| `GET` / `POST` / `DELETE /api/compliance/delete` | Session Clerk, tenant à la création, confirmation `true`, lecture/annulation limitées à l’utilisateur authentifié. |

## Actions avant production

- [ ] Désigner le responsable de traitement, le sous-traitant et, le cas échéant, le DPO ; compléter leurs coordonnées.
- [ ] Faire valider le registre des traitements, les bases légales, la politique cookies et les durées par le conseil/DPO.
- [ ] Définir le workflow documenté d’examen, d’identité, d’exception de conservation, de gel légal et de clôture des demandes.
- [ ] Définir le processus d’export et d’effacement au niveau cabinet sans divulgation inter-utilisateurs.
- [ ] Vérifier contractuellement les sous-traitants, transferts, sauvegardes et délais de purge réels.
- [ ] Tester les restrictions d’accès, les restaurations de sauvegardes et la procédure d’incident dans l’environnement de production.
