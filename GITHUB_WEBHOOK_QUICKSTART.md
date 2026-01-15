# 🚀 Test Rapide - Webhook GitHub

## Configuration Express (2 minutes)

### 1. Ajouter le secret dans .env.local

```bash
GITHUB_WEBHOOK_SECRET=test_secret_123456
```

### 2. Redémarrer l'app

```bash
# Ctrl+C puis:
npm run dev
```

### 3. Tester le statut

```bash
# Vérifier que le webhook répond
curl http://localhost:3000/api/webhooks/github

# Réponse attendue:
# {
#   "status": "active",
#   "message": "GitHub webhook endpoint",
#   "supported_events": ["push", "pull_request", "issues", "star", "ping"]
# }
```

### 4. Simuler un événement push

```bash
node scripts/test-github-webhook.js push
```

**Résultat attendu** :
```
🔧 GitHub Webhook Test Utility

📤 Envoi webhook de test...
   Event: push
   URL: http://localhost:3000/api/webhooks/github
   Delivery: uuid-xxx

✅ Webhook traité avec succès!

Réponse: {
  "success": true,
  "event": "push",
  "delivery": "uuid-xxx"
}
```

### 5. Vérifier les logs

Dans les logs de l'app Next.js, vous devriez voir :

```
ℹ️ [INFO] Webhook GitHub reçu {
  event: 'push',
  repository: 'iapostemanager/app',
  commits: [...],
  branch: 'main'
}
```

## Tests Disponibles

```bash
# Vérifier le statut
node scripts/test-github-webhook.js status

# Événement ping
node scripts/test-github-webhook.js ping

# Push sur main
node scripts/test-github-webhook.js push

# Pull Request
node scripts/test-github-webhook.js pull_request

# Nouvelle issue bug
node scripts/test-github-webhook.js issues

# Nouveau star
node scripts/test-github-webhook.js star

# Tous les événements
node scripts/test-github-webhook.js all
```

## 🌐 Avec Cloudflare Tunnel (GitHub réel)

### 1. Lancer Cloudflare Tunnel

```powershell
.\cloudflare-start.ps1
```

Copier l'URL permanente : `https://votes-additional-filed-definitions.trycloudflare.com`

### 2. Configurer sur GitHub

1. **Repository** → **Settings** → **Webhooks** → **Add webhook**
2. **Payload URL** : `https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github`
3. **Content type** : `application/json`
4. **Secret** : `test_secret_123456`
5. **Events** : Choisir "Send me everything" ou sélectionner individuellement
6. **Add webhook**

### 3. Déclencher un événement réel

```bash
# Faire un commit
echo "# Test" >> README.md
git add .
git commit -m "test: webhook GitHub"
git push
```

### 4. Vérifier la livraison

GitHub → Settings → Webhooks → Recent Deliveries → Voir le payload et la réponse

## ✅ Checklist

- [x] Route webhook créée : `/api/webhooks/github/route.ts`
- [x] Vérification signature HMAC SHA256
- [x] Gestion événements : push, pull_request, issues, star, ping
- [x] Logging avec système professionnel
- [x] Script de test local
- [x] Documentation complète
- [ ] Variables .env configurées
- [ ] Tests exécutés avec succès
- [ ] Cloudflare Tunnel actif (optionnel pour webhook GitHub)
- [ ] Webhook GitHub configuré (optionnel)

## 🎯 Prochaines Étapes

Implémenter les actions automatisées (TODO dans le code) :

1. **Push sur main** → Déploiement automatique
2. **Nouveau bug** → Créer ticket dans système interne
3. **PR ouvert** → Notification équipe
4. **Star** → Enregistrer métriques

Voir `src/app/api/webhooks/github/route.ts` pour les TODOs.
