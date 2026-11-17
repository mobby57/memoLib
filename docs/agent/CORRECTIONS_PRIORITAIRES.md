# 🚨 CORRECTIONS PRIORITAIRES - MemoLib

## ✅ DÉJÀ CORRIGÉ

### 1. SmartFormBuilder.tsx
**Statut:** ✅ FIXÉ

Corrections appliquées:
- ✅ Typo `'eleve'` → `'Élevé'` (ligne 328)
- ✅ Symboles vides → Emojis (ligne 254): 🔴 ⚡ ⚙️ ✅
- ✅ Icône approbation (ligne 335): `?` → 📋
- ✅ Ternaire redondant (ligne 281): `{hasError && errorMessage ? ... : null}` → `{hasError && errorMessage && ...}`
- ✅ Variables inutilisées: `currentStep`, `setValue` supprimées

**Vérification:**
```bash
git diff src/components/forms/SmartFormBuilder.tsx
```

---

## 🔴 BLOQUANT - À FAIRE IMMÉDIATEMENT

### 2. Ajouter model ChannelMessage dans Prisma

**Problème:**
- Routes utilisent `prisma.channelMessage.create/findMany/update`
- **Mais le modèle n'existe pas dans schema.prisma**
- Résultat: Crashes en production

**Fichiers affectés:**
```
❌ src/lib/multichannel/channel-service.ts (7 appels)
❌ src/app/api/webhooks/channel/[channel]/route.ts
❌ src/app/api/multichannel/messages/route.ts
```

**Solution:**

1. Vérifier d'abord si le modèle Channel existe:
```bash
grep -n "model Channel" prisma/schema.prisma
```

2. Si besoin, ajouter à `prisma/schema.prisma` (avant la dernière ligne):

```prisma
model Channel {
  id            String   @id @default(cuid())
  tenantId      String
  platform      String   // 'whatsapp', 'facebook', 'telegram', etc.
  externalId    String   // ID de la plateforme externe
  name          String
  status        String   @default("active")
  config        Json?    // Configuration plateforme
  messages      ChannelMessage[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  Tenant        Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, platform, externalId])
  @@index([tenantId])
  @@index([status])
}

model ChannelMessage {
  id            String    @id @default(cuid())
  channelId     String
  channel       Channel   @relation(fields: [channelId], references: [id], onDelete: Cascade)
  messageType   String    // 'inbound', 'outbound', 'system'
  externalMessageId String?
  content       String
  metadata      Json?
  status        String    @default("received")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  @@index([channelId])
  @@index([messageType])
  @@index([createdAt])
}
```

3. Générer Prisma et créer migration:
```bash
npx prisma generate
npx prisma migrate dev --name "add-channel-and-channel-message"
```

---

## 🟠 HAUTE PRIORITÉ

### 3. Supprimer @ts-nocheck progressivement

**Fichiers avec @ts-nocheck (7 total):**
```
❌ src/components/ActivityMonitor.tsx
❌ src/components/GlobalCommandPalette.tsx
❌ src/components/SessionTimeoutManager.tsx (⚠️ sécurité)
❌ src/components/Sidebar.tsx (⚠️ navigation)
❌ src/components/SuperAdminNavigation.tsx
❌ src/lib/audit.ts
❌ src/lib/ai/ai-cache.ts
❌ src/lib/ai/ai-workspace-extraction-service.ts
```

**Approche par étapes:**

1. **Étape 1:** Identifier les erreurs
```bash
npx tsc --noEmit 2>&1 | grep -A2 "error TS"
```

2. **Étape 2:** Corriger les fichiers critiques d'abord
```bash
# SessionTimeoutManager: sécurité
# Sidebar: navigation (tout le site dépend)
# ai-cache: performance
```

3. **Étape 3:** Remplacer progressivement les `any`
```tsx
// ❌ AVANT
function renderField(field: FormField) {
  const errorMessage = errors[field.id]?.message; // any implicite
  
// ✅ APRÈS
function renderField(field: FormField) {
  const errorMessage = errors[field.id]?.message as string | undefined;
```

---

## 🟡 MOYENNE PRIORITÉ

### 4. Hooks: Vérifier dépendances

**Fichiers à auditer (107 hooks):**
```
⚠️ src/hooks/useWorkspaceReasoning.ts (8 useCallback)
⚠️ src/hooks/useValidation.ts (8 useCallback)
⚠️ src/hooks/useRealtime.ts (7 useCallback, memory leaks?)
⚠️ src/app/[locale]/dossiers/page.tsx (10 useMemo)
```

**Commande ESLint pour vérifier:**
```bash
npx eslint src --rule "react-hooks/exhaustive-deps: error" 2>&1 | head -50
```

**Pattern à chercher:**
```tsx
// ❌ MAUVAIS: Fermeture fermée
const data = useCallback(() => {
  console.log(state); // state n'est pas mis à jour
}, []); // Oups: state manquant en dépendances

// ✅ BON: Fermeture correcte
const data = useCallback(() => {
  console.log(state); // ✅ state est mis à jour
}, [state]); // ✅ state dans les dépendances
```

---

## 📋 CHECKLIST AVANT DÉMARRAGE APP

```bash
# 1. Dépendances
[ ] npm install
[ ] npm audit (zéro vulnérabilités critiques)

# 2. Prisma
[ ] Vérifier Channel/ChannelMessage exists
[ ] npx prisma generate
[ ] npx prisma migrate dev (si dev) OU npx prisma db push (si prod)

# 3. Linting
[ ] npm run lint (< 50 warnings)
[ ] npm run lint:strict (optionnel)

# 4. Build
[ ] npm run build:fast
[ ] Vérifier zéro erreurs TypeScript
[ ] npm run preview (accédé à http://localhost:3000)

# 5. Tests
[ ] npm run test:unit (tous passent)
[ ] npm run test:smoke (validation basique)

# 6. Routes critiques
[ ] GET / (homepage)
[ ] GET /api/health (health check)
[ ] POST /api/auth/login (authentification)
[ ] GET /admin/dashboard (admin panel)
[ ] GET/POST /api/multichannel/* (nouveau)
```

---

## 🎯 COMMANDES RAPIDES

```bash
# Tout faire en ordre
npm install && \
npx prisma generate && \
npx prisma migrate dev && \
npm run lint:fix && \
npm run build:fast && \
npm run test:unit && \
npm run preview

# Ou démarrer dev directement
npm run dev

# Si crash multichannel:
grep -r "channelMessage" src/app/api/
npx prisma studio # Vérifier schéma visuel
```

---

## 📊 RÉSULTAT ATTENDU

Après ces corrections:

| Métrique | Avant | Cible |
|----------|-------|-------|
| Build success | ⚠️ ? | ✅ 100% |
| @ts-nocheck | 7 | 0 |
| Linting errors | ? | < 50 |
| Routes working | ? | ✅ Toutes |
| Tests passing | ? | ✅ > 90% |

---

## 🚀 DÉMARRAGE PRODUCTION

Une fois tout corrigé:

```bash
# Build optimisé
npm run build:fast

# Démarrer
npm start

# Ou avec Docker
docker build -t memolib .
docker run -p 3000:3000 memolib
```

---

**Généré:** 2026-11-17  
**Prochaine étape:** Exécuter Prisma + Build pour confirmer
