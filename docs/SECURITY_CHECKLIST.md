# ===========================================

# CHECKLIST DEV → PROD - SANS FUITE DE SECRETS

# IAPosteManager

# ===========================================

## ✅ AVANT CHAQUE COMMIT

### 1. Vérifier qu'aucun secret n'est staged

```bash
# Rechercher les patterns sensibles
git diff --cached | grep -iE "(password|secret|key|token|api_key|auth)" || echo "✅ OK"

# Vérifier les fichiers .env
git status | grep -E "\.env" && echo "⚠️ ATTENTION: fichier .env détecté!" || echo "✅ OK"
```

### 2. Vérifier le .gitignore

```bash
# S'assurer que ces patterns sont présents
cat .gitignore | grep -E "^\.env" || echo "⚠️ Ajouter .env* au .gitignore!"
```

### 3. Lancer les checks

```bash
# Dans VS Code: Ctrl+Shift+P → "Tasks: Run Task" → "Pre-Commit: Full Check"
# Ou manuellement:
cd src/frontend && npm run lint && npx tsc --noEmit
```

---

## ✅ AVANT MERGE SUR MAIN

### 1. Revue des GitHub Secrets

- [ ] Tous les secrets PROD sont dans GitHub Secrets
- [ ] Aucun secret en clair dans les workflows
- [ ] Variables différentes pour DEV/STAGING/PROD

### 2. Check des workflows CI/CD

- [ ] Tests passent en CI
- [ ] Build réussit
- [ ] Aucun warning de sécurité

### 3. Revue du code

- [ ] Pas de `console.log` avec des données sensibles
- [ ] Pas de commentaires avec des secrets
- [ ] Pas de TODO avec des credentials

---

## ✅ CONFIGURATION PRODUCTION

### 1. Azure Key Vault

```bash
# Créer le Key Vault
az keyvault create --name iapostemanager-kv --resource-group iapostemanager-rg

# Ajouter les secrets
az keyvault secret set --vault-name iapostemanager-kv --name "DATABASE-URL" --value "..."
az keyvault secret set --vault-name iapostemanager-kv --name "NEXTAUTH-SECRET" --value "..."
az keyvault secret set --vault-name iapostemanager-kv --name "TWILIO-AUTH-TOKEN" --value "..."
```

### 2. GitHub Secrets (pour CI/CD)

Aller dans: Repository → Settings → Secrets and variables → Actions

Secrets requis:

- `AZURE_CREDENTIALS` (JSON de service principal)
- `AZURE_STATIC_WEB_APPS_API_TOKEN`
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

### 3. Azure Static Web Apps - Variables d'environnement

```bash
az staticwebapp appsettings set \
  --name iapostemanager \
  --setting-names \
    DATABASE_URL="@Microsoft.KeyVault(...)" \
    NEXTAUTH_SECRET="@Microsoft.KeyVault(...)"
```

---

## ✅ ROTATION DES SECRETS

### Fréquence recommandée

| Secret              | Rotation      |
| ------------------- | ------------- |
| NEXTAUTH_SECRET     | 6 mois        |
| AZURE_CLIENT_SECRET | 12 mois (max) |
| TWILIO_AUTH_TOKEN   | Si compromis  |
| DATABASE_URL        | Si compromis  |

### Procédure de rotation

1. Générer le nouveau secret
2. Mettre à jour Azure Key Vault
3. Redéployer l'application
4. Vérifier que tout fonctionne
5. Révoquer l'ancien secret

---

## ✅ EN CAS DE FUITE DE SECRET

### Action immédiate (< 5 minutes)

1. **Révoquer** le secret compromis
2. **Générer** un nouveau secret
3. **Mettre à jour** Key Vault / GitHub Secrets
4. **Redéployer** l'application

### Actions de suivi

1. Analyser les logs pour détecter une utilisation malveillante
2. Faire un audit git: `git log --all -p -S "le-secret-leak"` (avec prudence)
3. Utiliser `git filter-branch` ou BFG pour nettoyer l'historique si nécessaire
4. Notifier l'équipe sécurité si données sensibles exposées

---

## ✅ OUTILS RECOMMANDÉS

### 1. Pre-commit hooks

```bash
# Installer pre-commit
pip install pre-commit

# Créer .pre-commit-config.yaml (voir fichier séparé)
pre-commit install
```

### 2. Secret scanning

```bash
# Gitleaks - scanner local
gitleaks detect --source . --verbose

# GitHub Secret Scanning (activer dans Settings → Security)
```

### 3. Dependency scanning

```bash
# npm audit
cd src/frontend && npm audit

# Snyk (optionnel)
npx snyk test
```

---

## 📋 RÉSUMÉ DES RÈGLES D'OR

| ✅ FAIRE               | ❌ NE JAMAIS FAIRE           |
| ---------------------- | ---------------------------- |
| Utiliser Key Vault     | Commit un .env               |
| GitHub Secrets pour CI | Hardcoder des secrets        |
| .env.local en dev      | Utiliser secrets PROD en dev |
| Rotation régulière     | Logger des credentials       |
| Revue avant merge      | Push sans vérification       |
