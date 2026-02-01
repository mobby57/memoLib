# 🔐 Configuration Azure Active Directory (SSO CESEDA)

**Date**: 1er février 2026
**Objectif**: Authentification SSO pour avocats CESEDA
**Statut**: Guide de configuration

---

## 📋 Vue d'ensemble

Azure Active Directory (Azure AD) permet à vos avocats de se connecter avec leurs identifiants professionnels (Microsoft 365 / Office 365). C'est **l'authentification la plus sécurisée** pour les utilisateurs professionnels.

---

## 🎯 Prérequis

✅ Un compte **Microsoft Azure** (gratuit ou payant)
✅ Un tenant **Azure AD** (créé automatiquement avec Azure)
✅ Accès **Admin** à votre tenant Azure AD
✅ Vercel déployé (vous aurez besoin du callback URL)

---

## 🚀 Étapes de Configuration (15 min)

### 1️⃣ Créer l'Application Azure AD

**A. Aller sur Azure Portal**

```
https://portal.azure.com
```

**B. Naviguer à Azure Active Directory**

```
Accueil → Azure Active Directory
```

**C. Créer une nouvelle app**

```
Gérer → Enregistrements d'applications → Nouvel enregistrement
```

**D. Remplir les infos**

```
Nom: MemoLib CESEDA
Types de comptes pris en charge: Comptes dans cet annuaire organisationnel uniquement
URI de redirection:
  - Plateforme: Web
  - URI: https://memolib-ceseda.vercel.app/api/auth/callback/azure-ad
```

✅ **Cliquer "Enregistrer"**

---

### 2️⃣ Configurer le Certificat/Secret Client

**A. Aller à "Certificats et secrets"**

```
Gérer → Certificats et secrets
```

**B. Créer un secret client**

```
Secrets clients → Nouveau secret client
  Description: NextAuth Client Secret
  Expire: 24 mois
```

✅ **Cliquer "Ajouter"**

**C. Copier la valeur**

```
⚠️ IMPORTANT: Copier immédiatement la VALEUR (pas l'ID)
Vous ne pourrez pas la voir après cette page!
```

---

### 3️⃣ Récupérer les Identifiants

**A. Aller à "Vue d'ensemble"**

```
Gérer → Vue d'ensemble
```

**B. Copier ces valeurs:**

```
1. ID d'application (client):     AZURE_CLIENT_ID
2. ID de répertoire (tenant):     AZURE_TENANT_ID
3. Secret client (copié plus haut): AZURE_CLIENT_SECRET
```

### 4️⃣ Configurer les Permissions

**A. Aller à "Permissions API"**

```
Gérer → Permissions API
```

**B. Ajouter une permission**

```
Ajouter une permission → Microsoft Graph
```

**C. Sélectionner "Permissions déléguées"**

```
Rechercher et sélectionner:
  ✅ email
  ✅ profile
  ✅ openid
  ✅ User.Read
```

✅ **Cliquer "Ajouter des permissions"**

---

## 🔧 Configuration Vercel

### Ajouter les Variables d'Environnement

Sur Vercel, aller à:

```
Settings → Environment Variables
```

Ajouter ces 3 variables (values from Azure AD):

```env
AZURE_CLIENT_ID=<your-client-id>
AZURE_CLIENT_SECRET=<your-client-secret>
AZURE_TENANT_ID=<your-tenant-id>
```

✅ **Redéployer le site** (auto-redeploy ou manual)

---

## 💾 Configuration NextAuth

### NextAuth est déjà configuré! ✅

Le fichier `src/app/api/auth/[...nextauth]/route.ts` doit avoir ce provider:

```typescript
import AzureADProvider from 'next-auth/providers/azure-ad';

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_CLIENT_ID!,
      clientSecret: process.env.AZURE_CLIENT_SECRET!,
      tenantId: process.env.AZURE_TENANT_ID!,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
    // ... autres providers (GitHub, Email, Credentials)
  ],
  // ...
};
```

Si ce code n'existe pas, veuillez l'ajouter manuellement.

---

## 🔑 Variables d'Environnement Local

Ajouter à votre `.env.local`:

```env
# Azure AD
AZURE_CLIENT_ID=your-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_TENANT_ID=your-tenant-id

# NextAuth (existant)
NEXTAUTH_SECRET=li+95I281EhJlwgImcfdszt79uTItIipFuZ23gQrbYs=
NEXTAUTH_URL=http://localhost:3000
```

---

## 🧪 Tester Localement

```bash
# 1. Terminal 1: Démarrer le frontend
cd src/frontend
npm run dev

# 2. Terminal 2: (optionnel) Démarrer le backend
cd backend-python
python -m flask run --debug --port 5000

# 3. Ouvrir le navigateur
http://localhost:3000/auth/signin
```

**Vous devriez voir** un bouton "Sign in with Azure AD"

---

## ✅ Vérification Post-Déploiement

### 1. Vérifier la Page de Connexion

```
https://memolib-ceseda.vercel.app/auth/signin
```

**Vous devriez voir:**

- ✅ Bouton "Sign in with Azure AD"
- ✅ Autres options (GitHub, Email, etc.)

### 2. Tester la Connexion

```
1. Cliquer "Sign in with Azure AD"
2. Vous êtes redirigé vers login.microsoft.com
3. Entrer vos identifiants Microsoft/Azure
4. Autoriser l'application
5. Vous êtes redirigé vers /dashboard
```

### 3. Vérifier le Token

```bash
curl -I https://memolib-ceseda.vercel.app/api/auth/session
```

**Réponse esperée:** Session JSON avec user data

---

## 🎯 Scénarios Courants

### Scénario 1: Utilisateurs avec Microsoft 365

```
Votre domaine: monorganisation.onmicrosoft.com
Utilisateurs: user@monorganisation.onmicrosoft.com

✅ Ils peuvent utiliser leurs identifiants M365
```

### Scénario 2: Domaine Personnalisé

Si votre organisation a un domaine personnalisé:

```
Domaine: monloi.fr
Tenant Azure AD: tenant-id

✅ Utilisateurs: avocat@monloi.fr
```

### Scénario 3: Comptes Multiples

Un avocat peut avoir **plusieurs comptes**:

- Compte professionnel (Azure AD) ✅
- Compte GitHub (pour dev) ✅
- Compte Email (magique link) ✅

NextAuth gérera automatiquement les sessions séparées.

---

## 🔒 Sécurité & Best Practices

### 1. Secret Client - À PROTÉGER! 🔐

```
❌ NE JAMAIS
- Committer le secret dans Git
- L'exposer en console log
- Le partager par email

✅ UTILISER
- Variables d'environnement Vercel
- Azure Key Vault (production)
- Secrets Manager (Doppler, 1Password)
```

### 2. Token Expiry

NextAuth gère automatiquement:

- ✅ Refresh tokens
- ✅ Token expiry
- ✅ Silent refresh

Aucune configuration requise.

### 3. Scope Minimalist

Ne demandez que les scopes nécessaires:

```
✅ openid, profile, email (pour auth basique)
❌ Mail.Read, Calendar.Read (sauf si vraiment nécessaire)
```

---

## 🐛 Troubleshooting

### Erreur 1: "Invalid Redirect URI"

**Symptôme:**

```
error=invalid_request
The provided value for 'redirect_uri' is not valid.
```

**Solution:**

```
1. Vérifier l'URI dans Azure AD exactement:
   https://memolib-ceseda.vercel.app/api/auth/callback/azure-ad

2. Attention aux:
   - http vs https
   - trailing slashes
   - majuscules/minuscules

3. Redéployer Vercel (Settings → Redeploy)
```

### Erreur 2: "Client Secret is Invalid"

**Symptôme:**

```
error: invalid_client
The OAuth client was not found.
```

**Solution:**

```
1. Vérifier les variables d'environnement Vercel
2. S'assurer que AZURE_CLIENT_SECRET est correctement copié
3. Attention: le secret n'est visible qu'une fois!
   → Si perdu, créer un nouveau secret
4. Redéployer
```

### Erreur 3: "User Not Found After Login"

**Symptôme:**

```
Connexion Azure AD OK, mais pas d'utilisateur créé
```

**Solution:**

```
1. Vérifier le callback JWT dans NextAuth
2. S'assurer que prisma.user.create() est appelé
3. Vérifier les logs Vercel (Deployments → Logs)
```

### Erreur 4: "Unauthorized - Tenant Not Allowed"

**Symptôme:**

```
L'utilisateur se connecte mais obtient "unauthorized"
```

**Solution:**

```
// Dans route.ts, restricting par tenant:
if (!allowed_tenants.includes(user.tenantId)) {
  throw new Error('Unauthorized');
}

// Vérifier: est-ce que l'utilisateur est dans le bon tenant?
```

---

## 📊 Monitoring & Analytics

### Voir les Connexions Azure AD

**Sur Azure Portal:**

```
Azure Active Directory
  → Tous les services
    → Audits
      → Connexions utilisateur
        → Filtrer par "MemoLib CESEDA"
```

### Sentry (Erreurs)

```
https://sentry.io → Votre projet MemoLib
  → Issues → Filtrer par "azure"
```

### Vercel (Logs)

```
https://vercel.com → memolib → Deployments
  → Cliquer sur le deploy → Logs
    → Chercher "azure" ou "nextauth"
```

---

## 🎓 Ressources

- **NextAuth Azure AD**: https://next-auth.js.org/providers/azure-ad
- **Azure Portal**: https://portal.azure.com
- **Microsoft Graph API**: https://docs.microsoft.com/graph
- **NextAuth Docs**: https://next-auth.js.org

---

## 📞 Support

**Problème de configuration?**

1. Vérifier Azure Portal (tous les IDs copiés?)
2. Vérifier Vercel Environment Variables (variables mises à jour?)
3. Vérifier les logs Vercel (Deployments → Logs)
4. Vérifier la console du navigateur (F12 → Console)
5. Vérifier Sentry (si configuré)

---

## ✨ Prochaines Étapes

**Après Azure AD configuré:**

1. ✅ Tester connexion avec votre compte
2. ✅ Tester avec d'autres utilisateurs du tenant
3. ✅ Configurer les rôles (ADMIN, CLIENT)
4. ✅ Ajouter les permissions par rôle
5. ✅ Configurer les restrictions par tenant

---

**Status**: 🟢 Prêt à configurer
**Temps estimé**: 15-20 minutes
**Complexité**: Facile 🟢

Good luck! 🚀
