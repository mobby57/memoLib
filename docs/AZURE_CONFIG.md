# 🔐 CONFIGURATION AZURE — WORKSPACE JURIDIQUE

**Variables d'environnement à ajouter dans Azure Static Web Apps**

---

## 📋 Variables existantes (à conserver)

```env
DATABASE_URL=<votre_neon_url>
NEXTAUTH_URL=https://green-stone-023c52610.6.azurestaticapps.net
NEXTAUTH_SECRET=<votre_secret>
OLLAMA_BASE_URL=<votre_ollama_url>
PISTE_SANDBOX_CLIENT_ID=<votre_client_id>
PISTE_SANDBOX_CLIENT_SECRET=<votre_client_secret>
STRIPE_SECRET_KEY=<votre_stripe_key>
```

---

## 🆕 Nouvelles variables à ajouter

### 1. CRON_SECRET
**Description** : Secret pour sécuriser les endpoints cron  
**Valeur** : Générer un secret aléatoire fort

```bash
# Générer un secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Exemple** :
```env
CRON_SECRET=a3f5b8c2d9e1f4a7b6c3d8e2f5a9b4c7d1e6f3a8b5c2d9e4f7a1b8c5d2e9f6a3
```

---

## 🔧 Comment ajouter dans Azure

### Via le portail Azure

1. Aller sur https://portal.azure.com
2. Chercher "Static Web Apps"
3. Sélectionner "green-stone-023c52610"
4. Menu "Configuration" → "Application settings"
5. Cliquer "Add"
6. Ajouter :
   - Name: `CRON_SECRET`
   - Value: `<votre_secret_généré>`
7. Cliquer "Save"

### Via Azure CLI

```bash
az staticwebapp appsettings set \
  --name green-stone-023c52610 \
  --setting-names CRON_SECRET=<votre_secret>
```

---

## 🔄 Redéploiement

Après avoir ajouté les variables :

1. Commit et push sur `main`
2. Le workflow GitHub Actions se déclenche automatiquement
3. Vérifier le déploiement : https://green-stone-023c52610.6.azurestaticapps.net

---

## ✅ Vérification

### Tester le cron
```bash
curl -X POST https://green-stone-023c52610.6.azurestaticapps.net/api/cron/deadline-alerts \
  -H "Authorization: Bearer <votre_CRON_SECRET>"
```

**Réponse attendue** :
```json
{
  "success": true,
  "message": "Alertes vérifiées",
  "stats": {
    "j7": 0,
    "j3": 0,
    "j1": 0,
    "overdue": 0
  }
}
```

---

## 📊 Variables complètes (référence)

```env
# Base de données
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_URL=https://green-stone-023c52610.6.azurestaticapps.net
NEXTAUTH_SECRET=...

# IA
OLLAMA_BASE_URL=...

# Légifrance
PISTE_SANDBOX_CLIENT_ID=...
PISTE_SANDBOX_CLIENT_SECRET=...

# Paiement
STRIPE_SECRET_KEY=...

# Cron (NOUVEAU)
CRON_SECRET=...
```

---

**Document créé le** : 24/01/2025  
**Statut** : CONFIGURATION REQUISE
