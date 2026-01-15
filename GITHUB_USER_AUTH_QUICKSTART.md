# 🚀 GITHUB USER-TO-SERVER - GUIDE D'INSTALLATION RAPIDE

## ⏱️ Installation en 10 minutes

---

## ✅ Prérequis

- [ ] Avoir une GitHub App créée (vous l'avez déjà : ID `2594935`)
- [ ] Avoir accès aux paramètres de l'application GitHub
- [ ] Avoir `.env.local` configuré

---

## 📋 Étapes d'Installation

### Étape 1: Configuration GitHub App (3 min)

1. **Aller sur votre GitHub App** :
   ```
   https://github.com/settings/apps/[your-app-name]
   ```

2. **Scroll vers "User permissions"** et activer :
   - ✅ **Issues:** Read & Write
   - ✅ **Pull requests:** Read & Write
   - ✅ **Contents:** Read & Write
   - ✅ **Deployments:** Read & Write (optionnel)

3. **Scroll vers "Identifying and authorizing users"** :
   - ✅ Cocher **"Request user authorization (OAuth) during installation"**
   - ✅ **Callback URL:** `http://localhost:3000/api/auth/callback/github`
   - ✅ **Setup URL (optionnel):** Laisser vide

4. **Sauvegarder** en bas de page

5. **Copier les credentials OAuth** :
   - Client ID (ex: `Iv23liQZx66Gmczb3xSp`)
   - Générer un nouveau Client Secret si nécessaire

---

### Étape 2: Configuration Variables d'Environnement (2 min)

1. **Ouvrir `.env.local`**

2. **Ajouter/Vérifier ces lignes** :

```env
# GitHub OAuth (User Authorization)
GITHUB_CLIENT_ID=Iv23liQZx66Gmczb3xSp
GITHUB_CLIENT_SECRET=your-client-secret-here
GITHUB_CALLBACK_URL=http://localhost:3000/api/auth/callback/github

# GitHub App (Installation)
GITHUB_APP_ID=2594935
GITHUB_APP_PRIVATE_KEY_PATH=./github-app-key.pem
GITHUB_WEBHOOK_SECRET=117545e495b30c6228735edbe127455173f2082a5dc1cabd5408ccba0bf7f889
GITHUB_REPOSITORY=mobby57/iapostemanager
```

3. **Sauvegarder** le fichier

---

### Étape 3: Vérification Configuration (1 min)

```bash
npx tsx scripts/test-github-user-auth.ts
```

**Résultat attendu :**
```
✅ Checklist de configuration:

  ✓ GitHub App ID
  ✓ GitHub OAuth Client ID
  ✓ GitHub OAuth Client Secret
  ✓ GitHub Callback URL

✅ Configuration complète!
```

---

### Étape 4: Démarrer le Serveur (1 min)

```bash
npm run dev
```

Serveur accessible sur : `http://localhost:3000`

---

### Étape 5: Test Utilisateur (3 min)

1. **Se connecter** : `http://localhost:3000/auth/login`

2. **Aller dans Settings** : `http://localhost:3000/lawyer/settings`

3. **Section GitHub** : Cliquer sur **"Autoriser GitHub"**

4. **Autoriser l'application** sur GitHub

5. **Vérifier la connexion** : Votre avatar GitHub devrait apparaître

---

## 🧪 Test d'Intégration

### Test 1: Créer une Issue

```javascript
// Console navigateur (F12)
fetch('/api/github/issues/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    repo: 'mobby57/iapostemanager',
    title: 'Test Issue via User-to-Server',
    body: 'Créée par IA Poste Manager pour le compte de l\'utilisateur',
    labels: ['test']
  })
}).then(r => r.json()).then(console.log);
```

**Résultat attendu :**
```json
{
  "success": true,
  "issue": {
    "number": 42,
    "url": "https://github.com/mobby57/iapostemanager/issues/42",
    "author": "votre-username"
  }
}
```

### Test 2: Vérifier sur GitHub

1. Aller sur : `https://github.com/mobby57/iapostemanager/issues`

2. **Vérifier l'issue créée** :
   - ✅ Auteur = Votre avatar
   - ✅ Badge application superposé
   - ✅ Titre et description corrects

---

## 🎨 Intégration UI (Optionnel)

### Ajouter le Bouton GitHub dans Settings

```tsx
// src/app/lawyer/settings/page.tsx
import { GitHubAuthButton } from '@/components/github/GitHubAuthButton';

export default function SettingsPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Paramètres</h1>
      
      {/* Section GitHub */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Intégration GitHub</h2>
        <GitHubAuthButton />
      </div>
      
      {/* Autres sections */}
    </div>
  );
}
```

### Ajouter la Sync dans Détails Dossier

```tsx
// src/app/lawyer/dossiers/[id]/page.tsx
import { DossierGitHubSync } from '@/components/github/DossierGitHubSync';

export default function DossierDetailPage({ params }) {
  return (
    <div className="p-6">
      <h1>Dossier {dossier.numero}</h1>
      
      {/* Section GitHub Sync */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-3">Synchronisation GitHub</h2>
        <DossierGitHubSync
          dossierId={dossier.id}
          dossierNumero={dossier.numero}
        />
      </div>
    </div>
  );
}
```

---

## ❓ FAQ Rapide

**Q: Différence entre App Token et User Token ?**
- **App Token** : Actions attribuées à l'application
- **User Token** : Actions attribuées à l'utilisateur (avec badge app)

**Q: Que faire si "User not connected to GitHub" ?**
- Vérifier que l'utilisateur a cliqué sur "Autoriser GitHub"
- Vérifier les variables d'environnement
- Vérifier le Callback URL dans GitHub App settings

**Q: Les tokens expirent-ils ?**
- Oui, mais NextAuth gère le refresh automatiquement
- Si problème : demander à l'utilisateur de se reconnecter

**Q: Fonctionne avec organisations ?**
- Oui, si l'utilisateur est membre
- L'application doit être installée sur l'organisation

---

## 🐛 Troubleshooting

### Erreur: "Callback URL mismatch"

**Cause :** URL de callback non configurée  
**Solution :**
1. Aller sur GitHub App settings
2. Vérifier "Callback URL" = `http://localhost:3000/api/auth/callback/github`

### Erreur: "Invalid client credentials"

**Cause :** Client ID ou Secret incorrect  
**Solution :**
1. Vérifier `.env.local`
2. Regénérer un nouveau Client Secret si nécessaire

### Erreur: "Scope not granted"

**Cause :** Permissions insuffisantes  
**Solution :**
1. Vérifier User Permissions dans GitHub App
2. Réautoriser l'application

---

## 📊 Statut Final

✅ **Configuration GitHub App**  
✅ **Variables d'environnement**  
✅ **API Routes créées**  
✅ **Composants UI prêts**  
✅ **Documentation complète**  
✅ **Tests disponibles**

---

## 🎉 Prêt à Utiliser !

**Vous pouvez maintenant :**

- ✅ Créer des issues pour le compte des utilisateurs
- ✅ Synchroniser les dossiers automatiquement
- ✅ Poster des commentaires et mises à jour
- ✅ Gérer les PRs et déploiements
- ✅ Tout en gardant la traçabilité

**Tout est attribué à l'utilisateur avec le badge de l'application sur GitHub !**

---

**Documentation complète : [GITHUB_USER_AUTH.md](GITHUB_USER_AUTH.md)**
