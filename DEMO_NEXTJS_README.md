# 🎯 Démo Next.js - MemoLib

Démo interactive du système de raisonnement IA pour cabinets d'avocats.

## 🚀 Démarrage Rapide

### Option 1 : Script Automatique (Recommandé)

```powershell
.\start-nextjs-demo.ps1
```

### Option 2 : Manuel

```powershell
# 1. Installer les dépendances
npm install

# 2. Installer Next.js et React
npm install next@latest react@latest react-dom@latest lucide-react
npm install -D typescript @types/react @types/node

# 3. Lancer le serveur
npm run dev
```

## 🌐 Accès

Une fois lancé, ouvrez votre navigateur :

- **Page d'accueil** : http://localhost:3000
- **Démo Email** : http://localhost:3000/fr/demo/email-simulator
- **Raisonnement IA** : http://localhost:3000/fr/demo/workspace-reasoning
- **Preuve Légale** : http://localhost:3000/fr/demo/legal-proof

## 📋 Parcours de Démonstration

### Étape 1 : Email Entrant
Simulez la réception d'un email client avec un cas OQTF urgent.

### Étape 2 : Raisonnement Dossier (Fichier Actuel)
L'IA analyse automatiquement :
- ✅ Type de procédure (OQTF)
- ✅ Niveau d'urgence (CRITIQUE)
- ✅ Délais légaux
- ✅ Risques identifiés
- ✅ Plan d'actions prioritaires

### Étape 3 : Preuve Légale
Génération automatique de la preuve légale avec horodatage.

## 🛠️ Structure du Projet

```
src/app/[locale]/demo/
├── email-simulator/     # Étape 1
│   └── page.tsx
├── workspace-reasoning/ # Étape 2 (FICHIER ACTUEL)
│   └── page.tsx
└── legal-proof/         # Étape 3
    └── page.tsx
```

## 🎨 Technologies

- **Framework** : Next.js 14+ (App Router)
- **UI** : React + Tailwind CSS
- **Icônes** : Lucide React
- **TypeScript** : Support complet

## 📝 Développement

### Modifier le Raisonnement IA

Éditez `src/app/[locale]/demo/workspace-reasoning/page.tsx` :

```typescript
const analyzeCase = async () => {
  // Modifier la logique d'analyse ici
  setResult({
    procedureType: 'OQTF',
    urgency: 'CRITICAL',
    // ... vos modifications
  });
};
```

### Ajouter de Nouvelles Étapes

1. Créer un nouveau dossier dans `src/app/[locale]/demo/`
2. Ajouter un fichier `page.tsx`
3. Mettre à jour `DEMO_STEPS` dans les pages existantes

## 🐛 Dépannage

### Port 3000 déjà utilisé

```powershell
# Changer le port
$env:PORT=3001
npm run dev
```

### Erreurs TypeScript

```powershell
# Vérifier la configuration
npx tsc --noEmit
```

### Dépendances manquantes

```powershell
# Réinstaller tout
Remove-Item node_modules -Recurse -Force
Remove-Item package-lock.json
npm install
```

## 📚 Documentation Complète

Voir [README.md](../../README.md) pour la documentation complète du projet MemoLib.

## 🤝 Contribution

Les améliorations sont les bienvenues ! Ouvrez une issue ou une pull request.
