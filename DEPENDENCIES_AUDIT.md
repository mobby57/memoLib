# Audit des Dépendances MemoLib

## 🔍 Commandes d'Audit

```bash
# Vérifier les dépendances obsolètes
npm outdated

# Vérifier les vulnérabilités
npm audit

# Corriger automatiquement
npm audit fix

# Analyser les dépendances inutilisées
npx depcheck

# Analyser la taille du bundle
npm run analyze
```

## 📦 Dépendances à Vérifier

### Potentiellement Redondantes

```json
{
  "react-is": "^19.2.3",  // Déjà inclus dans React 19?
  "critters": "^0.0.23",  // Utilisé?
  "regression": "^2.0.1", // Utilisé?
  "pdf2json": "^4.0.0",   // Doublon avec pdf-parse?
  "mammoth": "^1.11.0",   // Utilisé?
  "ioredis": "^5.9.1"     // Doublon avec @upstash/redis?
}
```

### À Consolider

```json
{
  // Choisir un seul client Redis
  "ioredis": "^5.9.1",
  "@upstash/redis": "^1.36.1",
  
  // Choisir une seule lib PDF
  "pdf-parse": "^2.4.5",
  "pdf2json": "^4.0.0",
  "jspdf": "^4.0.0"
}
```

## 🎯 Actions Recommandées

### 1. Installer depcheck

```bash
npm install -g depcheck
```

### 2. Analyser

```bash
depcheck --ignores="@types/*,eslint-*,@testing-library/*"
```

### 3. Supprimer les inutilisées

```bash
npm uninstall <package-name>
```

### 4. Mettre à jour

```bash
npm update
```

## 📊 Taille Actuelle

```bash
# Analyser la taille
npm run analyze

# Vérifier node_modules
du -sh node_modules/  # Linux/Mac
# ou
Get-ChildItem node_modules | Measure-Object -Property Length -Sum  # Windows
```

## 🔒 Sécurité

```bash
# Audit complet
npm audit --production

# Rapport JSON
npm audit --json > audit-report.json

# Forcer les corrections (attention!)
npm audit fix --force
```

## 📋 Checklist

- [ ] Exécuter `npm outdated`
- [ ] Exécuter `npm audit`
- [ ] Exécuter `depcheck`
- [ ] Identifier les doublons
- [ ] Supprimer les inutilisées
- [ ] Tester que tout fonctionne
- [ ] Mettre à jour package.json
- [ ] Commit les changements

## 🚀 Script Automatique

Ajoutez à `package.json`:

```json
{
  "scripts": {
    "deps:audit": "npm outdated && npm audit",
    "deps:check": "npx depcheck --ignores='@types/*,eslint-*'",
    "deps:update": "npm update && npm audit fix",
    "deps:clean": "npm prune && npm dedupe"
  }
}
```

## 💡 Bonnes Pratiques

1. **Audit régulier**: Chaque semaine
2. **Mises à jour**: Chaque mois
3. **Dependabot**: Activé pour les updates auto
4. **Lock file**: Toujours commiter package-lock.json
5. **Production**: Utiliser `npm ci` en prod

## 📈 Objectifs

- Réduire node_modules de 30%
- 0 vulnérabilités critiques
- Toutes les dépendances à jour
- Aucune dépendance inutilisée

---

**Dernière vérification**: À faire régulièrement
