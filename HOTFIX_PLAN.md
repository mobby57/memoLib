# 🔧 Hotfix - Bugs Critiques à Corriger

## 3 bugs critiques trouvés et leurs solutions

---

## Bug #1: Import Sentry Manquant

**Fichier**: `src/app/api/webhooks/test-multichannel/route.ts`
**Ligne**: Top du fichier
**Sévérité**: 🔴 CRITIQUE (Crash à l'exécution)

### ❌ Problème

Le code utilise `Sentry.captureMessage()` mais ne l'importe jamais.

```typescript
// Ligne 1-5 (ACTUEL)
import { computeChecksum } from '@/lib/deduplication-service';
import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

// Sentry manque ici!
```

### ✅ Solution

Ajouter l'import Sentry au top du fichier.

---

## Bug #2: Variable `startTime` Non Définie

**Fichier**: `src/app/api/webhooks/test-multichannel/route.ts`
**Ligne**: 70+ (dans POST handler)
**Sévérité**: 🔴 CRITIQUE (ReferenceError)

### ❌ Problème

`startTime` est utilisé mais jamais initialisé avant le try-catch.

```typescript
// Ligne 70 (ACTUEL)
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    // ... code ...
    const duration = performance.now() - startTime; // ❌ startTime n'existe pas!
```

### ✅ Solution

Initialiser `startTime` au début de la fonction.

```typescript
export async function POST(req: NextRequest) {
  const startTime = performance.now(); // ✅ Ajouter ici
  try {
    // ... reste du code
  }
}
```

---

## Bug #3: Fonction `computeChecksumLocal` Inutilisée

**Fichier**: `src/app/api/webhooks/test-multichannel/route.ts`
**Ligne**: 10-14
**Sévérité**: 🟡 MOYENNE (Code mort)

### ❌ Problème

```typescript
// Ligne 10-14 (JAMAIS UTILISÉE)
function computeChecksumLocal(payload: any): string {
  const data = JSON.stringify(payload);
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}
// Cette fonction existe mais n'est JAMAIS appelée
// On appelle computeChecksum() du service à la place
```

### ✅ Solution

Supprimer cette fonction (elle est en double avec le service).

---

## 📋 Checklist de Correction

- [ ] **Ajouter import Sentry** au top
- [ ] **Initialiser startTime** au début du POST
- [ ] **Supprimer computeChecksumLocal** (fonction morte)
- [ ] **Tester la compilation**: `npm run build`
- [ ] **Tester le webhook**: `npm run dev` puis test avec cURL
- [ ] **Vérifier Sentry logs** pour confirmer tracking

---

## 🧪 Tests de Validation

Après correction, valider avec:

```bash
# 1. Compilation
npm run build

# 2. Lancer serveur
npm run dev

# 3. Tester GET
curl http://localhost:3000/api/webhooks/test-multichannel

# 4. Tester POST
curl -X POST http://localhost:3000/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d '{"channel":"EMAIL","from":"test@example.com","text":"Test"}'

# 5. Vérifier logs Sentry console
# Devrait afficher message capturé (pas d'erreur)
```

---

## ⏱️ Temps Estimé

- **Correction**: 5 minutes
- **Test de compilation**: 2 minutes
- **Test manuel**: 3 minutes
- **Total**: ~10 minutes

---

## 🚨 Impact si Non Corrigé

| Bug          | Impact               | Symptôme                     |
| ------------ | -------------------- | ---------------------------- |
| #1 Sentry    | Code crash           | `Sentry is not defined`      |
| #2 startTime | Code crash           | `startTime is not defined`   |
| #3 Code mort | Performance dégradée | Compilation lente, confusion |

**Recommandation**: Corriger AVANT tout déploiement.
