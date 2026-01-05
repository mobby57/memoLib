# Figma CLI - Guide d'utilisation

## 📦 Installation

Les packages nécessaires sont déjà installés:
- `figma-js` - Client API Figma
- `axios` - Requêtes HTTP
- `svgo` - Optimisation des SVG
- `@svgr/core` - Conversion SVG → Composants React
- `tsx` - Exécution TypeScript
- `dotenv` - Variables d'environnement

## 🔑 Configuration

1. **Obtenir un token d'accès Figma:**
   - Connectez-vous à Figma
   - Allez dans Settings → Account → Personal Access Tokens
   - Cliquez sur "Generate new token"
   - Copiez le token généré

2. **Configurer les variables d'environnement:**
   
   Créez un fichier `.env.local` à la racine du projet:
   ```bash
   FIGMA_ACCESS_TOKEN="figd_votre_token_ici"
   FIGMA_FILE_KEY="auVG69j7QrCFGBt5svFre0"
   ```

   > 💡 Le `FIGMA_FILE_KEY` est déjà configuré pour votre fichier Figma actuel

## 🚀 Utilisation

### Commandes disponibles

```bash
# Afficher l'aide
npm run figma

# Synchroniser les design tokens (couleurs, typos, espacements)
npm run figma:sync

# Synchroniser les icônes
npm run figma:icons

# Synchroniser tout (tokens + icônes)
npm run figma:all
```

### Utilisation du CLI interactif

```bash
node scripts/figma-cli.js help
node scripts/figma-cli.js sync
node scripts/figma-cli.js icons
node scripts/figma-cli.js all
```

## 📂 Structure des fichiers générés

```
public/
  └── icons/              # Icônes SVG optimisées
      ├── icon-dashboard.svg
      ├── icon-search.svg
      └── ...

src/
  ├── components/icons/   # Composants React d'icônes
  │   ├── IconDashboard.tsx
  │   ├── IconSearch.tsx
  │   └── ...
  │
  └── styles/tokens/      # Design tokens
      ├── colors.json     # Couleurs du design system
      ├── typography.json # Typographies
      └── spacing.json    # Espacements
```

## 🎨 Design Tokens

Les design tokens sont extraits automatiquement depuis Figma:

- **Couleurs**: Palette complète avec variantes
- **Typographies**: Familles de police, tailles, hauteurs de ligne
- **Espacements**: Grille d'espacement cohérente

Exemple d'utilisation:
```typescript
import colors from '@/styles/tokens/colors.json'

const primaryColor = colors.primary.default
```

## 🖼️ Icônes

Les icônes sont:
1. Téléchargées depuis Figma
2. Optimisées avec SVGO (réduction de taille)
3. Converties en composants React TypeScript

Exemple d'utilisation:
```tsx
import IconDashboard from '@/components/icons/IconDashboard'

<IconDashboard className="w-6 h-6 text-blue-500" />
```

## 🔄 Workflow recommandé

1. **Designers** mettent à jour Figma
2. **Développeurs** exécutent `npm run figma:all`
3. Les tokens et icônes sont automatiquement synchronisés
4. Commit et push des changements

## ⚙️ Configuration avancée

### Changer le fichier Figma source

Modifiez `FIGMA_FILE_KEY` dans `.env.local` ou directement dans les scripts:

```typescript
// scripts/figma-sync.ts et scripts/figma-icons.ts
const FIGMA_FILE_KEY = 'votre-nouvelle-cle'
```

### Personnaliser les chemins de sortie

```typescript
// Dans figma-icons.ts
const ICONS_OUTPUT_DIR = path.join(__dirname, '../public/icons')
const ICONS_COMPONENT_DIR = path.join(__dirname, '../src/components/icons')

// Dans figma-sync.ts
const OUTPUT_DIR = path.join(__dirname, '../src/styles/tokens')
```

## 🐛 Dépannage

### Erreur: "Invalid access token"
- Vérifiez que `FIGMA_ACCESS_TOKEN` est correctement défini dans `.env.local`
- Le token doit commencer par `figd_`
- Générez un nouveau token si nécessaire

### Erreur: "File not found"
- Vérifiez que `FIGMA_FILE_KEY` correspond à votre fichier
- La clé se trouve dans l'URL Figma: `figma.com/design/[VOTRE_CLE]/...`

### Les icônes ne s'affichent pas
- Vérifiez que les icônes sont dans un frame nommé "Icons" dans Figma
- Les composants doivent être nommés avec le préfixe "icon-"

## 📚 Ressources

- [Documentation Figma API](https://www.figma.com/developers/api)
- [figma-js sur npm](https://www.npmjs.com/package/figma-js)
- [SVGO Documentation](https://github.com/svg/svgo)

## 🤝 Contribution

Pour ajouter de nouvelles fonctionnalités au CLI:

1. Modifiez `scripts/figma-cli.js` pour ajouter une commande
2. Créez le script correspondant dans `scripts/`
3. Ajoutez la commande dans `package.json` scripts
4. Mettez à jour cette documentation

---

**Dernière mise à jour:** 1er janvier 2026
