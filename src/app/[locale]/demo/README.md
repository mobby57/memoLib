# 🎬 Parcours Démo MemoLib

Démonstration interactive du système de gestion juridique en 3 étapes.

---

## 🎯 Vue d'Ensemble

Ce parcours démontre le flux complet de traitement d'un dossier juridique:

1. **Réception** d'un email client
2. **Analyse IA** du dossier
3. **Génération** d'une preuve légale opposable

---

## 📍 Les 3 Étapes

### 1️⃣ Email Simulator
**URL**: `/demo/email-simulator`

Simulez la réception d'un email client avec un cas OQTF réaliste.

**Fonctionnalités**:
- 4 templates pré-remplis
- Sélection client/avocat
- Envoi vers l'API
- Affichage du résultat

**Durée**: 1 minute

---

### 2️⃣ Workspace Reasoning
**URL**: `/demo/workspace-reasoning`

Analyse automatique du dossier par l'IA.

**Résultats affichés**:
- Niveau d'urgence (CRITIQUE)
- Faits identifiés (4 points)
- Risques détectés (2 niveaux)
- Plan d'actions (3 prioritaires)

**Durée**: 2 minutes

---

### 3️⃣ Legal Proof
**URL**: `/demo/legal-proof`

Génération d'une preuve légale certifiée et opposable.

**Contenu de la preuve**:
- Hash SHA-256 (64 caractères)
- 2 signatures (Simple + TSA)
- Audit trail (4 événements)
- 5 validations de sécurité
- Export PDF/JSON

**Durée**: 2 minutes

---

## 🚀 Démarrage

### Option 1: Script Automatique
```bash
start-demo.bat
```

### Option 2: Manuel
```bash
npm run dev
```

Puis ouvrir: http://localhost:3000/demo/email-simulator

---

## 📊 Cas d'Usage Démontré

### Contexte
Sophie Dubois reçoit une OQTF le 15/01/2026 avec un délai de 30 jours.

### Problématique
- Délai court (expire le 14/02/2026)
- Pièces incomplètes
- Situation familiale complexe (2 enfants scolarisés)

### Solution MemoLib
1. **Détection automatique** de l'urgence
2. **Analyse IA** des risques et obligations
3. **Plan d'actions** priorisé pour l'avocat
4. **Preuve légale** opposable en justice

---

## 🎨 Design

### Palette de Couleurs
- **Step 1**: Bleu (`#3B82F6`)
- **Step 2**: Violet (`#9333EA`)
- **Step 3**: Indigo (`#4F46E5`)

### Composants
- `DemoJourneyStepper`: Navigation entre étapes
- Animations de chargement (2s et 1.5s)
- Cartes d'information colorées
- Boutons d'action proéminents

---

## 📁 Structure des Fichiers

```
src/app/[locale]/demo/
├── page.tsx                    # Page d'accueil démo
├── email-simulator/
│   └── page.tsx               # Step 1
├── workspace-reasoning/
│   ├── page.tsx               # Step 2 (version simplifiée)
│   └── page-complex.tsx.bak   # Backup version complexe
└── legal-proof/
    ├── page.tsx               # Step 3 (version simplifiée)
    └── page-complex.tsx.bak   # Backup version complexe
```

---

## 🔧 Personnalisation

### Modifier les Données de Démo

**Email Simulator** (`email-simulator/page.tsx`):
```typescript
const EMAIL_TEMPLATES = [
  {
    name: 'Votre template',
    subject: 'Sujet',
    body: 'Contenu...'
  }
];
```

**Workspace Reasoning** (`workspace-reasoning/page.tsx`):
```typescript
setResult({
  procedureType: 'OQTF',
  urgency: 'CRITICAL',
  // ... vos données
});
```

**Legal Proof** (`legal-proof/page.tsx`):
```typescript
setProof({
  id: `proof_${Date.now()}`,
  // ... vos données
});
```

---

## 🧪 Tests

### Test Manuel
1. Suivre les 3 étapes
2. Vérifier les animations
3. Tester tous les boutons
4. Vérifier la navigation

### Test Automatique (à venir)
```bash
npm run test:e2e:demo
```

---

## 📚 Documentation

- **DEMO_JOURNEY_COMPLETE.md**: Guide complet
- **NEXT_ACTIONS.md**: Roadmap
- **DEMO_COMPLETE_STATUS.md**: Statut actuel

---

## 🎯 Objectifs Pédagogiques

Ce parcours démontre:

✅ **Automatisation**: Réduction du temps de traitement  
✅ **Intelligence**: Analyse IA des risques  
✅ **Sécurité**: Preuves légales opposables  
✅ **Efficacité**: Plan d'actions priorisé  

---

## 🤝 Contribution

Pour améliorer le parcours démo:

1. Modifier les fichiers dans `src/app/[locale]/demo/`
2. Tester avec `npm run dev`
3. Documenter les changements
4. Créer une pull request

---

## 📞 Support

Questions ou problèmes?

- 📧 Email: support@memolib.space
- 📚 Documentation: `/docs`
- 🐛 Issues: GitHub Issues

---

**Dernière mise à jour**: 5 mars 2026  
**Version**: 1.0.0  
**Statut**: ✅ Production Ready
