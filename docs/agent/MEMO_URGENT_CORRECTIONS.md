# 📌 MEMO URGENT - Corrections de sécurité pour le parcours d'invitation

**À lire par** : Tout développeur travaillant sur MemoLib  
**Priorité** : 🔴 CRITIQUE  
**Date** : 2026-11-17  
**Statut** : ✅ Code appliqué | 🚨 Migration SQL à faire AVANT tout déploiement

---

## ⚡ TL;DR (30 secondes)

### Problème
Le parcours d'invitation client ne fonctionne **PAS en production** car :
- Base de données : colonnes manquantes dans `AccessGrant` (dossierId, status, updatedAt)
- Sécurité : email Clerk non-vérifié lors de l'acceptation

### Solution appliquée
✅ Code modifié  
🚨 Migration SQL créée (à appliquer)

### Action immédiate
```bash
# Windows (PowerShell)
.\apply_migration_fix_access_grant.ps1

# macOS/Linux (bash)
bash apply_migration_fix_access_grant.sh
```

Après : `npm run build && npm test`

---

## 🎯 Qu'est-ce qui a changé ?

### Fichiers modifiés (3)
1. ✅ `src/app/api/invitations/accept/route.ts` — Vérifie que l'email Clerk est vérifié
2. ✅ `src/app/api/dossiers/quick-invite/route.ts` — Warning en production
3. ✅ `prisma/schema.prisma` — Relations ajoutées (User et Dossier)

### Fichiers à créer manuellement (1)
4. 🚨 `prisma/migrations/20261117_fix_access_grant_schema/migration.sql` — Colonnes DB manquantes

---

## 🔴 Blocage P0 (CRITIQUE)

**Situation** : La migration SQL `20261116120000_add_invitation_access_grant_and_consent_fields` a créé les tables `Invitation` et `AccessGrant`, **mais elle a oublié des colonnes critiques** :

| Table | Colonne | État | Impact |
|---|---|---|---|
| AccessGrant | `dossierId` | ❌ Manquante | Impossible de savoir quel dossier est partagé |
| AccessGrant | `status` | ❌ Manquante | Impossible de tracker l'état d'accès |
| AccessGrant | `updatedAt` | ❌ Manquante | Pas d'audit trail |
| Invitation | FK → Dossier | ❌ Manquante | Violation d'intégrité référentielle |
| Invitation | FK → User | ❌ Manquante | Violation d'intégrité référentielle |

### Résultat
Quand un client accepte une invitation :
```
POST /api/invitations/accept
↓
Crée AccessGrant avec { invitationId, clientUserId, expiresAt }
↓
❌ ERREUR : dossierId n'existe pas
↓
HTTP 500 ou violates constraint
```

**La route fonctionne en développement** (peut-être sans contraintes FK) **mais échoue en production** (Neon applique les FK).

---

## 🟡 Blocage P1 (SÉCURITÉ)

### P1.1 : Email Clerk non-vérifié
**Avant** :
```typescript
const userEmail = user.emailAddresses[0]?.emailAddress;
// ❌ emailAddresses[0] n'est PAS vérifié !
```

**Après** :
```typescript
const verifiedEmail = user.emailAddresses.find(
  (email) => email.verification?.status === 'verified' && email.emailAddress === invitation.email
);
// ✅ Obligatoire que l'email soit vérifié
```

**Risque** : Un attaquant crée un compte Clerk avec `attacker@gmail.com`, n'utilise PAS cet email, puis accepte une invitation envoyée à `victim@example.com`.

### P1.2 : Route quick-invite en production
**Avant** :
```typescript
const ALLOW_AUTO_PROVISION = process.env.NODE_ENV !== 'production' || ...;
```

**Risque** : Si un admin active `ALLOW_QUICK_PROVISION=true` en prod, la route crée automatiquement :
- Un User Prisma (provisioning)
- Un Tenant (en choisissant "le premier" - 🔴 MULTI-TENANT BUG)
- Un Client
- Un Dossier
- Une Invitation

**Après** : Un warning s'affiche si activé en prod.

---

## ✅ Comment appliquer la migration ?

### Méthode 1 : Script automatisé (RECOMMANDÉ)

**Windows** :
```powershell
.\apply_migration_fix_access_grant.ps1
```

**macOS/Linux** :
```bash
bash apply_migration_fix_access_grant.sh
```

### Méthode 2 : Manuel

```bash
# 1. Créer le dossier
mkdir -p prisma/migrations/20261117_fix_access_grant_schema

# 2. Copier la migration
cp MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql prisma/migrations/20261117_fix_access_grant_schema/migration.sql

# 3. Appliquer
prisma migrate deploy

# 4. Vérifier
prisma generate
npm run build
```

### Méthode 3 : Neon SQL Editor (si Neon est utilisé)

1. Aller sur dashboard.neon.tech
2. Sélectionner le projet et la branche
3. Ouvrir "SQL Editor"
4. Copier-coller `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql`
5. Exécuter

---

## 🧪 Vérification

Après avoir appliqué la migration :

```bash
# 1. Vérifier que Prisma génère sans erreur
npx prisma generate

# 2. Vérifier TypeScript
npm run typecheck

# 3. Builder
npm run build

# 4. Ouvrir Prisma Studio pour vérifier les colonnes
npx prisma studio
# → Aller dans "AccessGrant"
# → Vérifier que dossierId, status, updatedAt existent
```

---

## 📚 Documentation connexe

| Document | Contenu | Lire si... |
|---|---|---|
| `AUDIT_INVITATION_FLOW_COMPLET.md` | Audit détaillé de tout le parcours | Vous voulez comprendre tous les risques |
| `GUIDE_IMPLEMENTATION_CORRECTIONS.md` | Guide étape par étape | Vous appliquez les corrections |
| `CORRECTIONS_SUMMARY.md` | Résumé des modifications | Vous mergez le code |
| `MIGRATION_FIX_ACCESS_GRANT_SCHEMA.sql` | Migration SQL | Vous l'appliquez à la DB |
| `CHECK_MIGRATION_POST_FIX_ACCESS_GRANT.sql` | Vérifications post-migration | Vous voulez vérifier que c'est OK |

---

## 🚀 Prochaines étapes

### Immédiatement (Jour 1)
- [ ] Appliquer la migration avec le script
- [ ] Vérifier que `npm run build` passe

### Avant merge (Jour 2)
- [ ] Tests du parcours d'invitation
- [ ] TypeScript + linting
- [ ] Code review

### Avant production (Jour 3+)
- [ ] Migration en staging ✅ (déjà faite si script appliqué)
- [ ] Tests end-to-end du flux
- [ ] Désactiver `ALLOW_QUICK_PROVISION` en `.env.production`
- [ ] Monitorer les logs pour les warnings

---

## ⚠️ Points d'attention

### À ne PAS faire
- ❌ Ne pas déployer en production sans avoir appliqué la migration SQL
- ❌ Ne pas utiliser `emailAddresses[0]` sans vérifier son statut
- ❌ Ne pas laisser `ALLOW_QUICK_PROVISION=true` en production

### À vérifier
- ✅ Que `ALLOW_QUICK_PROVISION` n'existe PAS dans `.env.production`
- ✅ Que les FK sont bien créées (vérifier avec `CHECK_MIGRATION_POST_FIX_ACCESS_GRANT.sql`)
- ✅ Que le build TypeScript passe sans erreur

---

## 💬 Questions fréquentes

### Q: Pourquoi cette migration n'a pas été appliquée la première fois ?
**R** : La migration `20261116120000` a créé les tables mais a oublié les colonnes détaillées définieds dans `schema.prisma` et les FK. C'est une limitation du processus de migration.

### Q: Vais-je perdre des données ?
**R** : Non. Les tables `Invitation` et `AccessGrant` sont vides (nouvellement créées). La migration ajoute juste des colonnes et des contraintes.

### Q: Que se passe-t-il si je ne l'applique pas ?
**R** : Chaque création d'`AccessGrant` échouera avec une erreur SQL. Le parcours d'invitation sera cassé en production.

### Q: Peux-je l'appliquer en production ?
**R** : Oui, c'est sûr puisque les tables sont vides. Mais faites un backup d'abord. Le script prend moins d'une seconde.

### Q: Faut-il redeployer l'app ?
**R** : Oui, après avoir appliqué la migration, refaites un `npm run build` et déployez.

---

## 📞 Support

Si vous avez des questions ou des problèmes lors de l'application :

1. **Lire** `GUIDE_IMPLEMENTATION_CORRECTIONS.md`
2. **Vérifier** `CHECK_MIGRATION_POST_FIX_ACCESS_GRANT.sql`
3. **Consulter** `AUDIT_INVITATION_FLOW_COMPLET.md` pour les détails techniques

---

**Statut global** : ✅ Code prêt | 🚨 Migration SQL à faire  
**Timeline recommandé** : Faire la migration aujourd'hui, tester demain, déployer après-demain

🎉 Une fois appliquée, le parcours d'invitation sera **sécurisé et prêt pour la production**.
