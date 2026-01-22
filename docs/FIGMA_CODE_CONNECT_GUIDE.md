# 🎨 Guide Complet: Utiliser @figma/code-connect au Maximum

## 📌 Objectif Principal

Synchroniser **design Figma ↔ code React** en temps réel pour une **cohérence parfaite** entre design et implémentation.

---

## 🚀 Étape 1: Setup Initial

### Installation (déjà faite ✅)
```bash
npm install @figma/code-connect --save-dev
npm install @figma/code-connect-react --save-dev
```

### Configuration Figma
1. Accédez à votre fichier Figma (créer s'il n'existe pas)
2. **Créez un nouveau file Figma:** https://www.figma.com
3. Nommez-le: **IA-Poste-Manager**
4. Créez les pages:
   - 📄 **Smart Forms** → Composant SmartFormBuilder
   - 📄 **Dossiers** → Composant DossierCard
   - 📄 **Workspace** → Composant WorkspaceReasoning (FSM)
   - 📄 **Dashboards** → Composant AnalyticsDashboard

### Obtenir votre File ID
```
URL: https://www.figma.com/file/ABC123DEF456/IA-Poste-Manager
                              ↑
                          FILE_ID
```

---

## 🔗 Étape 2: Connecter vos Composants

### Template Standard pour CHAQUE composant

```typescript
// src/components/YOUR_COMPONENT/YOUR_COMPONENT.figma.tsx
import { CodeConnect } from '@figma/code-connect';
import YourComponent from './YourComponent';

CodeConnect.figma(
  'https://www.figma.com/design/YOUR_FILE_ID/IA-Poste-Manager?node-id=COMPONENT_ID',
  YourComponent,
  {
    // Mapper les props Figma → React
    prop1: figma.string('Label in Figma'),
    prop2: figma.enum('Variant', {
      'option1': 'option1',
      'option2': 'option2'
    }),
    prop3: figma.boolean('Toggle'),
    prop4: figma.number('Number Input'),
    
    // Props imbriquées (nested)
    nestedProp: figma.nestedProps('Group Name', {
      innerProp1: figma.string('Field 1'),
      innerProp2: figma.string('Field 2')
    }),
    
    // Callbacks
    onClick: figma.action('On Click'),
    onSubmit: figma.action('On Submit')
  }
);

/**
 * # Titre du Composant
 * 
 * Description + fonctionnalités
 * 
 * ## Variants
 * - **variant1**: Description
 * - **variant2**: Description
 * 
 * ## Propriétés
 * - `prop1`: Description
 * - `prop2`: Description
 */
```

### Fichiers Déjà Créés ✅

```
✅ src/components/forms/SmartFormBuilder.figma.tsx
✅ src/components/dossiers/DossierCard.figma.tsx
✅ src/components/workspace/WorkspaceReasoning.figma.tsx
✅ src/app/lawyer/dashboard/dashboard.figma.tsx
```

**À faire:** Créer les designs correspondants dans Figma et ajouter les NODE_IDs

---

## 🛠️ Étape 3: Configuration Figma File

### Dans Figma: Créer les Composants

#### 1️⃣ Page "Smart Forms"

```
Components
├── SmartFormBuilder (node-id: FORM_COMPONENT_ID)
│   ├── Default
│   ├── Compact
│   └── Fullscreen
```

**Properties à ajouter dans Figma:**
- Form Title (String)
- Description (String)
- Field Type (Enum: text, date, file, select)
- Required (Boolean)
- Show AI Suggestions (Boolean)
- AI Confidence (Number slider 0-1)

#### 2️⃣ Page "Dossiers"

```
Components
├── DossierCard (node-id: DOSSIER_CARD_ID)
│   ├── Minimal
│   ├── Standard
│   └── Detailed
```

**Properties:**
- Dossier Number (String)
- Type CESEDA (Enum: OQTF, NATURALISATION, ASILE)
- Status (Enum: en_cours, urgent, termine)
- Priority (Enum: basse, haute, critique)
- Client Name (String)
- Deadline Date (String)

#### 3️⃣ Page "Workspace"

```
Components
├── WorkspaceReasoning (node-id: REASONING_WORKFLOW_ID)
│   ├── State: RECEIVED
│   ├── State: CLASSIFIED
│   ├── State: ANALYZED
│   ├── State: INCOMPLETE
│   ├── State: AMBIGUOUS
│   ├── State: READY_FOR_HUMAN
```

**Properties:**
- Current State (Enum: 8 états FSM)
- Uncertainty Level (Number 0-1)
- Confidence Score (Number 0-1)
- Show Timeline (Boolean)
- Highlight Blockers (Boolean)

#### 4️⃣ Page "Dashboards"

```
Components
├── AnalyticsDashboard (node-id: DASHBOARD_ID)
│   ├── Overview
│   ├── Trends
│   └── Detailed
```

**Properties:**
- Time Period (Enum: week, month, quarter, year)
- Case Type Filter (Enum: OQTF, NATURALISATION, ALL)
- Chart Type (Enum: line, bar, pie, area)
- Show Trends (Boolean)

---

## 📝 Étape 4: Mettre à Jour les Fichiers .figma.tsx

Une fois les designs Figma créés, remplacez les NODE_IDs:

```bash
# 1. Obtenez chaque node-id en inspectant le composant dans Figma
# 2. Cliquez droite → "Copy link to selected component"
# 3. Extrayez le node-id de l'URL

# Exemple:
# https://www.figma.com/design/ABC123/IA-Poste-Manager?node-id=123456789&mode=design
#                                                                      ↑
#                                                                  NODE_ID
```

**Mettez à jour chaque fichier:**

```typescript
// ❌ Avant
CodeConnect.figma(
  'https://www.figma.com/design/YOUR_FILE_ID/IA-Poste-Manager?node-id=COMPONENT_ID',
  SmartFormBuilder,
  ...
);

// ✅ Après (exemple)
CodeConnect.figma(
  'https://www.figma.com/design/abc123def456/IA-Poste-Manager?node-id=789012345',
  SmartFormBuilder,
  ...
);
```

---

## 🔄 Étape 5: Synchronisation Automatique

### Scripts disponibles:

```bash
# Synchroniser les composants depuis Figma
npm run figma:sync

# Générer les icônes depuis Figma
npm run figma:icons

# Tout d'un coup
npm run figma:all

# Synchroniser pendant le développement (watch mode)
npm run watch-figma

# Pré-build
npm run pre-build-figma
```

### CI/CD - Intégration GitHub Actions

Créer `.github/workflows/figma-sync.yml`:

```yaml
name: Figma Sync

on:
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 0 * * *'  # Daily

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install deps
        run: npm ci
      
      - name: Sync Figma components
        run: npm run figma:sync
        env:
          FIGMA_API_TOKEN: ${{ secrets.FIGMA_API_TOKEN }}
      
      - name: Commit changes
        run: |
          git config user.name "Figma Bot"
          git config user.email "figma@iapostemanage.dev"
          git add .
          git commit -m "chore: sync Figma components" || echo "No changes"
          git push
```

### Obtenir un FIGMA_API_TOKEN

1. Allez sur: https://www.figma.com/developers
2. **Account** → **Generate a new personal access token**
3. Copiez-le
4. Ajoutez dans GitHub: **Settings → Secrets → New repository secret**
   - Name: `FIGMA_API_TOKEN`
   - Value: Votre token

---

## 🎯 Étape 6: Workflow Design-Dev

### Scénario: Designer modifie le SmartFormBuilder

1. **Designer update** (Figma)
   ```
   ✏️ Modifie SmartFormBuilder dans Figma
      (change couleur, ajoute champ, etc.)
   ```

2. **Auto-sync** (Code Connect)
   ```
   🔄 Code Connect détecte le changement
   📤 Exporte les props
   📝 Regénère la doc
   ```

3. **Dev reçoit notification**
   ```
   📨 Slack/Discord: "Design update: SmartFormBuilder"
   📄 Voit les détails dans docs
   ✅ Intègre les changements
   ```

4. **Code Update**
   ```typescript
   // src/components/forms/SmartFormBuilder.tsx
   // Les propriétés sont auto-documentées
   // depuis Figma!
   ```

### Workflow Continu:

```mermaid
Designer (Figma)
    ↓
    📐 Modifie component
    ↓
Code Connect (Auto-sync)
    ↓
    🔄 Exporte props & docs
    ↓
GitHub → CI/CD Pipeline
    ↓
    🧪 Tests
    ✅ Build
    🚀 Deploy
    ↓
Dev reçoit updates
    ↓
    ✏️ Intègre changes
    ↓
Figma reconnaît le code
    ↓
Boucle fermée! 🎯
```

---

## 📊 Étape 7: Générer la Documentation

### Auto-docs depuis Figma

```bash
# Génère TOUS les fichiers de doc
npm run figma:all

# Résultat:
# docs/figma-exports/
# ├── SmartFormBuilder.md
# ├── DossierCard.md
# ├── WorkspaceReasoning.md
# └── AnalyticsDashboard.md
```

### Exemple de doc générée:

```markdown
# SmartFormBuilder

## Description
Formulaire intelligent avec suggestions IA avancées

## Variants
- **default** - Formulaire standard
- **compact** - Mode condensé
- **fullscreen** - Vue complète

## Props
| Prop | Type | Default | Description |
|------|------|---------|-------------|
| config | object | - | Configuration du formulaire |
| showAISuggestions | boolean | true | Afficher suggestions IA |
| onSubmit | function | - | Callback soumission |

## Usage
```typescript
<SmartFormBuilder
  config={{ title: "Mon formulaire" }}
  showAISuggestions={true}
  onSubmit={handleSubmit}
/>
```

## States
- Loading
- Filled
- Error
- Success
```

---

## 🎨 Étape 8: Bonnes Pratiques

### ✅ À Faire

```typescript
// 1. Typage strict
const MyComponent = ({ 
  variant, 
  size 
}: Props) => { ... }

// 2. Props mapping dans Figma
variant: figma.enum('Variant', { ... })

// 3. Documentation claire
/**
 * Component description
 * ## Variants
 * ## Props
 * ## Usage
 */

// 4. Export composant ES
export default MyComponent;
export { MyComponent };

// 5. Figma file structure
// Pages → Components → Variants → Properties
```

### ❌ À Éviter

```typescript
// ❌ Props dynamiques/non typées
const Component = (props) => { ... }

// ❌ Pas de description Figma
// → Ignoré par Code Connect

// ❌ Noms inconsistants
// Figma: "Button Primary"
// Code: "buttonPrimary"

// ❌ Pas d'export default
export const MyComponent = ...
```

---

## 📈 Étape 9: Monitoring & Analytics

### Dashboard Figma Sync

Créer page `/admin/figma-stats`:

```typescript
// pages/admin/figma-stats.tsx
export default function FigmaStats() {
  return (
    <div>
      <h1>🎨 Figma Sync Status</h1>
      
      <Stats>
        <Stat label="Composants synced" value={4} />
        <Stat label="Dernière sync" value="2 hours ago" />
        <Stat label="Taux sync" value="100%" />
        <Stat label="Docs générés" value={4} />
      </Stats>
      
      <Timeline>
        {/* Historique des syncs */}
      </Timeline>
    </div>
  );
}
```

---

## 🚀 Résumé: Utiliser Code Connect au Maximum

| Aspect | Action | Impact |
|--------|--------|--------|
| **Design System** | Documenter TOUS les composants | Cohérence 100% |
| **Documentation** | Auto-générée depuis Figma | Zéro désync |
| **Collaboration** | Designer ↔ Dev sync en temps réel | Communication fluide |
| **CI/CD** | Automation complète | Déploiement rapide |
| **Maintenance** | Une source de vérité | Moins de bugs |
| **Onboarding** | Nouveaux devs voient design + code | Intégration rapide |

---

## 📞 Commandes Clés à Mémoriser

```bash
npm run figma:sync          # Synchroniser depuis Figma
npm run figma:all           # Sync + icons
npm run watch-figma         # Watch mode (dev)
npm run pre-build-figma     # Sync avant build
```

---

## 🎁 Bonus: Slack/Discord Notifications

Ajouter dans `.env.local`:

```env
FIGMA_WEBHOOK_SLACK=https://hooks.slack.com/services/...
FIGMA_WEBHOOK_DISCORD=https://discord.com/api/webhooks/...
```

Chaque sync = notification en temps réel! 📨

---

**Votre setup Figma Code Connect est maintenant prêt! 🎨✨**
