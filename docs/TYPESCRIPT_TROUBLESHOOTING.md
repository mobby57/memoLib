# Guide TypeScript - Résolution du problème "Terminated" (Code 143)

## 🔴 Problème

Lorsque vous exécutez `npx tsc --noEmit`, le processus se termine avec le code 143 (SIGTERM).

### Causes

1. **Trop de fichiers** : 729 fichiers TypeScript dans le projet
2. **Mémoire limitée** : Environnement Codespaces avec ressources limitées
3. **OOM Killer** : Le système tue le processus pour éviter un crash

## ✅ Solutions

### Option 1 : Vérifier seulement les fichiers modifiés (RECOMMANDÉ)

```bash
npm run type-check:changed
```

Ce script vérifie uniquement les fichiers TypeScript que vous avez modifiés depuis le dernier commit.

### Option 2 : Utiliser Next.js build

```bash
npm run build
```

Next.js optimise la vérification TypeScript et utilise le cache incrémental.

**Note** : Actuellement `typescript.ignoreBuildErrors: true` dans `next.config.js`. Pour activer la vérification :

```javascript
// next.config.js
typescript: {
  ignoreBuildErrors: false, // Activer la vérification
}
```

### Option 3 : Vérification manuelle par fichier

```bash
# Vérifier un fichier spécifique
npx tsc --noEmit --skipLibCheck src/app/page.tsx

# Vérifier un dossier
npx tsc --noEmit --skipLibCheck src/components/**/*.tsx
```

### Option 4 : Utiliser l'extension VS Code

L'extension TypeScript de VS Code vérifie les fichiers en temps réel sans surcharger la mémoire.

1. Ouvrir un fichier `.ts` ou `.tsx`
2. Les erreurs apparaissent automatiquement
3. Voir tous les problèmes : `Ctrl+Shift+M` (ou `Cmd+Shift+M` sur Mac)

## 🔧 Configuration optimisée

### tsconfig.json

```json
{
  "compilerOptions": {
    "skipLibCheck": true,      // Ignorer node_modules
    "incremental": true,       // Cache pour builds plus rapides
    "jsx": "preserve"          // Next.js gère la transformation
  }
}
```

### package.json scripts

```json
{
  "scripts": {
    "type-check": "tsc --noEmit --incremental --skipLibCheck",
    "type-check:changed": "bash scripts/type-check-changed.sh",
    "type-check:watch": "tsc --noEmit --watch"
  }
}
```

## 📊 Statistiques du projet

- **Fichiers TypeScript** : 729
- **Mémoire recommandée** : 4-8 GB
- **Temps de vérification** : 2-5 minutes (selon la machine)

## 🚀 Workflow recommandé

1. **Développement** : Utiliser l'extension VS Code TypeScript
2. **Avant commit** : `npm run type-check:changed`
3. **CI/CD** : `npm run build` (avec `ignoreBuildErrors: false`)

## 🐛 Debugging

Si le problème persiste :

```bash
# Vérifier la mémoire disponible
free -h

# Augmenter la limite Node.js
export NODE_OPTIONS="--max-old-space-size=8192"
npm run type-check

# Nettoyer le cache TypeScript
rm -rf .next tsconfig.tsbuildinfo
npm run type-check
```

## 📝 Notes

- Le code 143 = SIGTERM (processus terminé manuellement ou par le système)
- Dans Codespaces, les ressources sont limitées par défaut
- Next.js 16 avec Turbopack optimise automatiquement la vérification TypeScript
