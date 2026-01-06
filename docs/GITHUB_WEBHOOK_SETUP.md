# Configuration Webhook GitHub - IA Poste Manager

## 📋 Prérequis

- Compte GitHub avec droits admin sur le repository
- Cloudflare Tunnel configuré (voir [CLOUDFLARE_TUNNEL_SETUP.md](../CLOUDFLARE_TUNNEL_SETUP.md))
- Application Next.js lancée sur localhost:3000

## 🔧 Configuration

### 1. Générer un secret webhook

```bash
# Générer un secret aléatoire sécurisé
openssl rand -hex 32
```

Ajouter dans `.env.local` :
```env
GITHUB_WEBHOOK_SECRET=votre_secret_genere_ici
```

### 2. Exposer localhost avec Cloudflare Tunnel

```bash
# Terminal 1: Démarrer Next.js
npm run dev

# Terminal 2: Lancer Cloudflare Tunnel
.\cloudflare-start.ps1
```

Votre URL Cloudflare permanente sera affichée (ex: `https://votes-additional-filed-definitions.trycloudflare.com`)

### 3. Configurer le webhook sur GitHub

1. Aller sur votre repository GitHub
2. **Settings** → **Webhooks** → **Add webhook**
3. Remplir :
   - **Payload URL** : `https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github`
   - **Content type** : `application/json`
   - **Secret** : Coller le `GITHUB_WEBHOOK_SECRET`
   - **Events** : 
     - ✅ Push events
     - ✅ Pull requests
     - ✅ Issues
     - ✅ Stars
     - ✅ Let me select individual events
4. **Add webhook**

### 4. Tester le webhook

GitHub envoie automatiquement un événement `ping` :

```bash
# Vérifier les logs de l'application
# Vous devriez voir dans la console :
# ℹ️ [INFO] Webhook GitHub ping reçu { zen: '...' }
```

## 🧪 Tests Manuels

### Test 1: Push Event

```bash
# Faire un commit et push
echo "# Test webhook" >> README.md
git add README.md
git commit -m "Test: webhook GitHub"
git push origin main
```

**Résultat attendu** :
```json
{
  "event": "push",
  "repository": "user/repo",
  "commits": [...],
  "branch": "main"
}
```

### Test 2: Create Issue

1. Créer une nouvelle issue sur GitHub
2. Vérifier les logs : événement `issues` avec `action: opened`

### Test 3: Star Repository

1. Cliquer sur ⭐ Star
2. Vérifier les logs : événement `star` avec `action: created`

## 📊 Endpoints Disponibles

### POST /api/webhooks/github
Reçoit les événements GitHub

**Headers requis** :
- `x-hub-signature-256` : Signature HMAC SHA256
- `x-github-event` : Type d'événement (push, pull_request, etc.)
- `x-github-delivery` : UUID unique de la livraison

**Réponse** :
```json
{
  "success": true,
  "event": "push",
  "delivery": "uuid-xxx"
}
```

### GET /api/webhooks/github
Vérifier le statut du webhook

**Réponse** :
```json
{
  "status": "active",
  "supported_events": ["push", "pull_request", "issues", "star", "ping"]
}
```

## 🔒 Sécurité

### Vérification de signature
Chaque webhook GitHub est signé avec HMAC SHA256 :

```typescript
const signature = headers.get('x-hub-signature-256');
// Format: "sha256=abc123..."

const hmac = crypto.createHmac('sha256', GITHUB_WEBHOOK_SECRET);
const digest = 'sha256=' + hmac.update(payload).digest('hex');

// Vérification timing-safe
crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
```

### Protection contre replay attacks
- GitHub envoie `x-github-delivery` unique
- Stocker les delivery IDs déjà traités (TODO: implémenter)

## 📝 Logs & Monitoring

Tous les événements sont loggés via le système de logging professionnel :

```typescript
logger.info('Webhook GitHub reçu', {
  event: 'push',
  repository: 'user/repo',
  delivery: 'uuid-xxx'
});
```

Consulter les logs dans `/admin/logs` (Dashboard monitoring - Task 3)

## 🎯 Actions Automatisées

### Push sur main/master
```typescript
if (ref === 'refs/heads/main') {
  // TODO: Déclencher déploiement automatique
  await triggerDeployment(repository.full_name);
}
```

### Nouveau Bug (issue avec label "bug")
```typescript
if (action === 'opened' && labels.includes('bug')) {
  // TODO: Créer ticket dans système interne
  await createTicket(issue);
}
```

### Pull Request ouvert
```typescript
if (action === 'opened') {
  // TODO: Notifier l'équipe
  await notifyTeam(pull_request);
}
```

## 🐛 Dépannage

### Webhook non reçu
1. Vérifier Cloudflare Tunnel : `curl https://votes-additional-filed-definitions.trycloudflare.com/api/webhooks/github`
2. Vérifier les logs GitHub : Settings → Webhooks → Recent Deliveries
3. Vérifier GITHUB_WEBHOOK_SECRET correspond

### Signature invalide
1. Vérifier le secret dans .env.local
2. Redémarrer l'app Next.js après changement .env
3. Re-tester avec un nouveau push

### Erreur 500
1. Vérifier les logs console Next.js
2. Vérifier la structure du payload GitHub
3. Consulter `/admin/logs` pour détails

## 📚 Ressources

- [GitHub Webhooks Documentation](https://docs.github.com/webhooks)
- [Securing Webhooks](https://docs.github.com/webhooks/using-webhooks/validating-webhook-deliveries)
- [Webhook Events](https://docs.github.com/webhooks/webhook-events-and-payloads)

## ✅ Checklist Production

- [ ] Configurer URL Cloudflare Tunnel permanente (ou utiliser domaine production)
- [ ] Secret fort (32+ caractères aléatoires)
- [ ] HTTPS obligatoire
- [ ] Rate limiting activé
- [ ] Logs centralisés
- [ ] Monitoring alertes actif
- [ ] Replay protection implémentée
- [ ] Backup webhooks configuré
