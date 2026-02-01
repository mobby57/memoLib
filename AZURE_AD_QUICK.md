# ⚡ Azure AD Setup - Guide Rapide (10 min)

## 🎯 Étapes Essentielles

### 1️⃣ Créer l'App Azure AD
- Aller sur https://portal.azure.com
- Azure Active Directory → Enregistrements d'applications → Nouvel enregistrement
- Nom: **MemoLib CESEDA**
- URI de redirection: **https://memolib-ceseda.vercel.app/api/auth/callback/azure-ad**
- Cliquer "Enregistrer"

### 2️⃣ Créer le Secret
- Certificats et secrets → Nouveau secret client
- Copier la VALEUR (pas l'ID!)

### 3️⃣ Récupérer les IDs
- Vue d'ensemble, copier:
  - **Application (client) ID** → `AZURE_CLIENT_ID`
  - **Directory (tenant) ID** → `AZURE_TENANT_ID`
  - Secret → `AZURE_CLIENT_SECRET`

### 4️⃣ Ajouter dans Vercel
```
Settings → Environment Variables

AZURE_CLIENT_ID = [votre-client-id]
AZURE_CLIENT_SECRET = [votre-secret]
AZURE_TENANT_ID = [votre-tenant-id]
```

### 5️⃣ Redéployer
```
Deployments → Redeploy
```

## ✅ Vérification
```
https://memolib-ceseda.vercel.app/auth/signin
→ Vous devriez voir "Sign in with Azure AD"
```

## 📚 Documentation Complète
→ Voir [AZURE_AD_SETUP.md](AZURE_AD_SETUP.md) pour tous les détails

---

**Besoin d'aide?** Consultez le guide complet: [AZURE_AD_SETUP.md](AZURE_AD_SETUP.md)
