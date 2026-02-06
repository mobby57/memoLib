# Guide de Contribution

Merci de contribuer à MemoLib! Ce guide vous aidera à soumettre des contributions de qualité.

## 🚀 Quick Start

1. **Fork** le projet
2. **Clone** votre fork: `git clone https://github.com/YOUR_USERNAME/memolib.git`
3. **Créer une branche**: `git checkout -b feature/ma-fonctionnalite`
4. **Installer**: `npm install`
5. **Développer** et tester
6. **Commit** et **Push**
7. **Ouvrir une Pull Request**

## 📋 Standards de Code

### Commits

Utilisez [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: ajouter la fonctionnalité X
fix: corriger le bug Y
docs: mettre à jour la documentation
style: formater le code
refactor: refactoriser le module Z
test: ajouter des tests pour W
chore: mettre à jour les dépendances
```

### Code Style

- **TypeScript**: Strict mode activé
- **Formatting**: Prettier (auto-format avec `npm run format`)
- **Linting**: ESLint (vérifier avec `npm run lint`)
- **Naming**:
  - Components: `PascalCase`
  - Functions: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `kebab-case.tsx`

### Structure des Fichiers

```typescript
// 1. Imports externes
import { useState } from 'react';
import { Button } from '@/components/ui/button';

// 2. Imports internes
import { useAuth } from '@/hooks/useAuth';
import type { User } from '@/types';

// 3. Types/Interfaces
interface Props {
  user: User;
}

// 4. Component
export function MyComponent({ user }: Props) {
  // Logic
  return <div>...</div>;
}
```

## ✅ Checklist Avant PR

- [ ] Le code compile sans erreur: `npm run build`
- [ ] Les tests passent: `npm run test`
- [ ] Le linting est OK: `npm run lint`
- [ ] Le type-checking passe: `npm run type-check`
- [ ] Le code est formaté: `npm run format`
- [ ] Les tests sont ajoutés/mis à jour
- [ ] La documentation est à jour
- [ ] Les commits suivent la convention
- [ ] La branche est à jour avec `main`

## 🧪 Tests

### Tests Unitaires

```bash
npm run test:unit
```

Placez les tests à côté des fichiers:
```
src/
  components/
    Button.tsx
    Button.test.tsx
```

### Tests E2E

```bash
npm run test:e2e
```

Placez dans `tests/e2e/`:
```
tests/
  e2e/
    login.spec.ts
```

### Couverture

Minimum requis: 30% (objectif: 80%)

```bash
npm run test:coverage
```

## 📝 Documentation

### Code Comments

```typescript
/**
 * Calcule le total d'une facture avec TVA
 * @param amount - Montant HT
 * @param vatRate - Taux de TVA (0.20 pour 20%)
 * @returns Montant TTC
 */
function calculateTotal(amount: number, vatRate: number): number {
  return amount * (1 + vatRate);
}
```

### README Updates

Si vous ajoutez une fonctionnalité majeure, mettez à jour:
- `README.md` (description)
- `docs/` (documentation détaillée)
- `CHANGELOG.md` (changements)

## 🔒 Sécurité

- **Jamais** de credentials dans le code
- Utilisez `.env.local` pour les secrets
- Validez toutes les entrées utilisateur
- Sanitisez les données avant affichage
- Suivez les principes OWASP

### Signaler une Vulnérabilité

Envoyez un email à: security@memolib.com

## 🐛 Rapporter un Bug

Utilisez le template GitHub Issues:

**Titre**: `[BUG] Description courte`

**Description**:
- Comportement attendu
- Comportement actuel
- Étapes pour reproduire
- Environnement (OS, navigateur, version)
- Screenshots si applicable

## 💡 Proposer une Fonctionnalité

**Titre**: `[FEATURE] Description courte`

**Description**:
- Problème résolu
- Solution proposée
- Alternatives considérées
- Impact sur l'existant

## 🔄 Processus de Review

1. **Automated checks**: CI/CD doit passer (tests, lint, build)
2. **Code review**: Au moins 1 approbation requise
3. **Testing**: Tester manuellement si nécessaire
4. **Merge**: Squash and merge (commits propres)

### Critères d'Acceptation

- ✅ Code propre et lisible
- ✅ Tests passent
- ✅ Documentation à jour
- ✅ Pas de régression
- ✅ Performance acceptable
- ✅ Sécurité respectée

## 📦 Release Process

1. Mettre à jour `CHANGELOG.md`
2. Bump version dans `package.json`
3. Tag: `git tag v1.2.3`
4. Push: `git push --tags`
5. GitHub Actions déploie automatiquement

## 🎯 Priorités

### High Priority
- Bugs critiques
- Failles de sécurité
- Performance

### Medium Priority
- Nouvelles fonctionnalités
- Améliorations UX
- Refactoring

### Low Priority
- Documentation
- Optimisations mineures
- Nice-to-have

## 💬 Communication

- **Questions**: GitHub Discussions
- **Bugs**: GitHub Issues
- **Features**: GitHub Issues
- **Chat**: Discord (si disponible)

## 📚 Ressources

- [Next.js Docs](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs)
- [React Best Practices](https://react.dev/learn)

## 🙏 Merci!

Votre contribution rend MemoLib meilleur pour tous. Merci de prendre le temps de suivre ces guidelines!

---

**Questions?** Ouvrez une Discussion GitHub ou contactez l'équipe.
