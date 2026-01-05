# Configuration Figma

## Fichier Figma
- **File Key**: auVG69j7QrCFGBt5svFre0
- **URL**: https://www.figma.com/design/auVG69j7QrCFGBt5svFre0/moro-sidibe-s-team-library

## Token d'accès
Le token d'accès Figma est stocké dans le fichier `.env` :
```
FIGMA_ACCESS_TOKEN=votre_token_ici
```

## Structure attendue dans Figma

### Design Tokens
Pour que la synchronisation fonctionne correctement, organisez vos design tokens dans Figma :

#### Couleurs
- Créez un frame/page nommé "Colors" ou "Palette"
- Chaque rectangle représente une couleur
- Nommez chaque rectangle selon la convention : `primary`, `secondary`, `accent`, etc.

#### Typographies
- Créez un frame/page nommé "Typography"
- Utilisez des éléments TEXT pour définir les styles
- Nommez selon la convention : `heading-1`, `body-text`, `caption`, etc.

#### Espacements
- Créez un frame nommé "Spacing"
- Utilisez des rectangles pour définir les tailles
- Nommez selon : `spacing-xs`, `spacing-sm`, `spacing-md`, etc.

#### Icônes
- Créez vos icônes en tant que COMPOSANTS
- Incluez "icon" dans le nom du composant
- Nommez selon : `icon-close`, `icon-menu`, `icon-search`, etc.

## Commandes disponibles

### Synchroniser les design tokens
```bash
npm run figma:sync
```
Extrait les couleurs, typographies, espacements et ombres depuis Figma et génère :
- `src/styles/tokens/tokens.ts` (types TypeScript)
- `src/styles/tokens/tokens.css` (variables CSS)

### Synchroniser les icônes
```bash
npm run figma:icons
```
Télécharge les icônes SVG et génère :
- `public/icons/*.svg` (fichiers SVG optimisés)
- `src/components/icons/*.tsx` (composants React)
- `src/components/icons/index.ts` (exports)

### Synchroniser tout
```bash
npm run figma:all
```
Exécute les deux synchronisations.

## Utilisation dans le code

### Design Tokens (TypeScript)
```typescript
import { colors, typography, spacing } from '@/styles/tokens/tokens';

const MyComponent = () => (
  <div style={{ 
    color: colors.primary,
    fontSize: typography['heading-1'].fontSize,
    padding: spacing['spacing-md']
  }}>
    Hello
  </div>
);
```

### Design Tokens (CSS)
```css
@import '../styles/tokens/tokens.css';

.my-class {
  color: var(--color-primary);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-card);
}
```

### Icônes (React)
```typescript
import { IconClose, IconMenu } from '@/components/icons';

const MyComponent = () => (
  <>
    <IconClose size={24} color="#000" />
    <IconMenu size={32} className="my-icon" />
  </>
);
```

## Automatisation

### Avec GitHub Actions
Ajoutez un workflow pour synchroniser automatiquement :

```yaml
name: Sync Figma
on:
  schedule:
    - cron: '0 0 * * *' # Tous les jours à minuit
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run figma:all
        env:
          FIGMA_ACCESS_TOKEN: ${{ secrets.FIGMA_ACCESS_TOKEN }}
      - uses: stefanzweifel/git-auto-commit-action@v4
        with:
          commit_message: "chore: sync design tokens from Figma"
```

### Avec un hook pre-commit
```bash
# .husky/pre-commit
npm run figma:sync
git add src/styles/tokens/
```

## Dépannage

### Erreur 403
- Vérifiez que votre token a le scope "File content - Read"
- Vérifiez que le fichier Figma est accessible avec vos permissions

### Aucun token trouvé
- Assurez-vous que vos éléments Figma sont bien nommés
- Vérifiez la structure de votre fichier Figma

### Erreur de parsing
- Assurez-vous que vos composants ont une structure valide
- Les SVG doivent être des composants Figma, pas des groupes
