# 🎯 Guide Rapide : Mise à Jour GitHub après Migration Cloudflare

## ⚡ Actions à Faire sur GitHub (5 minutes)

### 1️⃣ Mettre à Jour les Webhooks

**URL à utiliser partout :**
```
https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
```

#### Étapes :

1. **Aller sur votre dépôt GitHub :**
   ```
   https://github.com/mobby57/iapostemanager
   ```

2. **Ouvrir les paramètres des webhooks :**
   - Cliquer sur **Settings** (en haut)
   - Dans le menu de gauche : **Webhooks**

3. **Éditer chaque webhook existant :**
   - Cliquer sur le webhook
   - Cliquer sur **Edit**
   - Dans **Payload URL**, remplacer l'ancienne URL par :
     ```
     https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
     ```
   - Vérifier que **Secret** contient bien :
     ```
     117545e495b30c6228735edbe127455173f2082a5dc1cabd5408ccba0bf7f889
     ```
   - Cliquer sur **Update webhook**

4. **Tester le webhook :**
   - En bas de la page du webhook
   - Onglet **Recent Deliveries**
   - Cliquer sur **Redeliver** sur un événement récent
   - Vérifier que vous recevez une ✅ réponse (code 200)

### 2️⃣ Mettre à Jour les GitHub Actions (si utilisées)

Si vous avez des fichiers dans `.github/workflows/` :

1. **Ouvrir chaque fichier `.yml`**
2. **Chercher les anciennes URLs ngrok**
3. **Remplacer par l'URL Cloudflare :**

```yaml
# Avant
env:
  WEBHOOK_URL: https://baaf048af00d.ngrok-free.app/api/webhooks/github

# Après ✅
env:
  WEBHOOK_URL: https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
```

### 3️⃣ Mettre à Jour les Secrets GitHub

1. **Aller dans Settings → Secrets and variables → Actions**

2. **Ajouter/Mettre à jour ces secrets :**

```
Name: CLOUDFLARE_TUNNEL_URL
Value: https://votes-additional-filed-definitions.trycloudflare.com

Name: WEBHOOK_URL
Value: https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github
```

3. **Supprimer les anciens secrets ngrok (optionnel) :**
   - `NGROK_URL`
   - `NGROK_AUTHTOKEN`

### 4️⃣ Mettre à Jour le README du Dépôt GitHub

Si votre README.md sur GitHub mentionne ngrok, le mettre à jour :

```markdown
<!-- Avant -->
## Configuration Webhook
Utiliser ngrok pour exposer localhost...

<!-- Après ✅ -->
## Configuration Webhook
Utiliser Cloudflare Tunnel pour exposer localhost de manière permanente.

URL du webhook : https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github

Voir [GITHUB_CLOUDFLARE_INTEGRATION.md](./GITHUB_CLOUDFLARE_INTEGRATION.md) pour la configuration complète.
```

## ✅ Checklist Complète

```
Configuration GitHub :
- [ ] Webhooks mis à jour avec URL Cloudflare
- [ ] Test de webhook effectué (Recent Deliveries ✅)
- [ ] GitHub Actions .yml mis à jour (si applicable)
- [ ] Secrets GitHub configurés
- [ ] README.md GitHub mis à jour (si nécessaire)

Configuration Locale :
- [x] .env mis à jour (déjà fait ✅)
- [x] .env.local mis à jour (déjà fait ✅)
- [x] Documentation mise à jour (déjà fait ✅)

Tests de Validation :
- [ ] Cloudflare Tunnel actif
- [ ] Push test sur GitHub → webhook reçu
- [ ] GitHub Actions fonctionnent (si applicable)
```

## 🧪 Tests de Validation

### Test 1 : Webhook Fonctionne

```powershell
# 1. S'assurer que l'app tourne
npm run dev

# 2. S'assurer que Cloudflare Tunnel est actif
.\cloudflare-start.ps1

# 3. Faire un push sur GitHub
git add .
git commit -m "test: vérification webhook cloudflare"
git push

# 4. Vérifier dans GitHub
# → Settings → Webhooks → Recent Deliveries → Voir la ✅ réponse 200
```

### Test 2 : URL Accessible

```powershell
# Test depuis votre machine
curl https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github

# Devrait retourner : "Method not allowed" ou un message similaire
# (car GET n'est pas autorisé, seul POST l'est - c'est normal ✅)
```

## 📝 Commandes Git Utiles

### Committer les Changements de Migration

```bash
# Ajouter tous les fichiers modifiés
git add .

# Commit avec message descriptif
git commit -m "chore: migration de ngrok vers Cloudflare Tunnel

- Mise à jour des URLs dans .env et .env.local
- Documentation mise à jour
- Nouveau guide GITHUB_CLOUDFLARE_INTEGRATION.md
- Guide de migration MIGRATION_NGROK_TO_CLOUDFLARE.md"

# Push vers GitHub
git push origin main
```

## 🚨 Problèmes Courants

### ❌ Webhook retourne 404
**Solution :** Vérifier que Next.js tourne sur le port 3000

### ❌ Webhook retourne 500
**Solution :** Vérifier les logs de l'application et le secret GitHub

### ❌ "Could not connect"
**Solution :** Vérifier que Cloudflare Tunnel est actif

### ❌ URL Cloudflare change
**Solution :** Créer un tunnel nommé pour URL permanente (voir guide complet)

## 📚 Documentation

- [Guide Complet Cloudflare](./GITHUB_CLOUDFLARE_INTEGRATION.md)
- [Guide Migration Détaillé](./MIGRATION_NGROK_TO_CLOUDFLARE.md)
- [Setup Cloudflare Tunnel](./CLOUDFLARE_TUNNEL_SETUP.md)

## 🎉 Terminé !

Une fois ces étapes complétées, vous aurez :

✅ GitHub configuré avec Cloudflare Tunnel  
✅ Webhooks fonctionnels avec URL permanente  
✅ Plus besoin de mettre à jour les URLs  
✅ Meilleure sécurité et performance  

---

**Durée totale : ~5 minutes**  
**Dernière mise à jour : 6 janvier 2026**
