# Guide de Déploiement - Webhook Pattern Adapter

## 📋 Checklist Pré-Déploiement

### Code & Tests

- [ ] Tous les tests passent localement
- [ ] `npm run lint` sans erreurs
- [ ] `npm run build` sans erreurs
- [ ] Tests E2E Playwright réussissent

### Base de Données

- [ ] Prisma migrations appliquées
- [ ] Table `ChannelMessage` existe avec `checksum @unique`
- [ ] Backups récents configurés

### Configuration

- [ ] Variables d'environnement vérifiées
- [ ] Sentry DSN configuré
- [ ] PostgreSQL URI correcte
- [ ] CORS configuré si nécessaire

### Monitoring

- [ ] Sentry project créé et configuré
- [ ] Logs centralisés activés
- [ ] Alertes configurées pour les erreurs

---

## 🚀 Étapes de Déploiement

### 1. Préparation locale

```bash
# Vérifier que le code compile
cd src/frontend
npm run build

# Vérifier que les tests passent
npm run test

# Vérifier le lint
npm run lint
```

### 2. Déploiement des migrations Prisma

```bash
# Sur l'environnement de staging
npx prisma migrate deploy

# Vérifier que les migrations ont réussi
npx prisma db execute --stdin < check_schema.sql
```

### 3. Déploiement du code

Pour **Vercel**:

```bash
vercel deploy --prod
```

Pour **Render.com**:

```bash
# Push vers la branche main
git push origin main
# Render redéploiera automatiquement
```

Pour **Azure AppService**:

```bash
az webapp up --resource-group <group> --name <app-name>
```

### 4. Validation post-déploiement

```bash
# Tester l'endpoint
curl https://<production-url>/api/webhooks/test-multichannel

# Tester avec un payload
curl -X POST https://<production-url>/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d '{"channel":"EMAIL","from":"test@example.com","text":"Test"}'

# Vérifier Sentry
# → Aller sur dashboard.sentry.io pour confirmer les rapports d'erreurs
```

### 5. Tests de fumée (Smoke Tests)

```bash
# Test 1: GET endpoint
curl -s https://<production-url>/api/webhooks/test-multichannel | jq '.endpoint'

# Test 2: POST email
curl -s -X POST https://<production-url>/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d '{"channel":"EMAIL","from":"smoke@test.com","text":"Smoke test"}' | jq '.success'

# Test 3: Vérifier deduplication
PAYLOAD='{"channel":"EMAIL","from":"dup@test.com","text":"Test"}'
curl -s -X POST https://<production-url>/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq '.checksum' > checksum.txt

curl -s -X POST https://<production-url>/api/webhooks/test-multichannel \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" | jq '.error'  # Doit être DUPLICATE_MESSAGE
```

---

## 🔄 Rollback

Si un problème est détecté après déploiement:

### Vercel

```bash
vercel rollback
```

### Render

```bash
# Aller dans le dashboard Render et cliquer "Redeploy" sur la version précédente
```

### Git-based

```bash
git revert <commit-hash>
git push origin main
```

---

## 📊 Monitoring Post-Déploiement

### Indicateurs clés

| Métrique                | Seuil d'alerte |
| ----------------------- | -------------- |
| Erreurs 5xx             | > 5/minute     |
| Latence P95             | > 500ms        |
| Taux de doublons        | > 10%          |
| Erreurs de connexion DB | > 1/minute     |

### Dashboards Sentry

1. Créer un dashboard pour les webhooks:
   - Graphique: Nombre de messages par canal
   - Graphique: Taux d'erreurs
   - Graphique: Performance (latence)
   - Table: Erreurs récentes

### Logs

Vérifier les logs de l'application:

```bash
# Vercel
vercel logs <deployment-id>

# Render
# → Dashboard → Logs

# Azure
az webapp log tail --resource-group <group> --name <app-name>
```

---

## 🔐 Configuration Sécurité

### Headers de sécurité

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

### Rate Limiting

```
Max 100 requêtes par minute par IP
```

### Validation

```
- Taille max payload: 5MB
- Timeout de requête: 30 secondes
- Validation JSON stricte
```

---

## 📝 Documentation

Après déploiement:

1. Mettre à jour la documentation API avec l'URL en prod
2. Documenter les credentials/tokens pour intégrations externes
3. Créer un runbook pour les incidents

---

## ✅ Checklist de Production

- [ ] Tous les tests passent
- [ ] Database backups automatiques configurés
- [ ] Monitoring et alertes actifs
- [ ] Logs centralisés
- [ ] Sentry connecté et validé
- [ ] Smoke tests réussissent
- [ ] Performance acceptable (< 200ms P95)
- [ ] Pas d'erreurs 5xx dans logs
- [ ] Documentation mise à jour
- [ ] Team informée et formée

---

## 🆘 Troubleshooting

### 502 Bad Gateway

```
Vérifier:
1. Application démarre correctement
2. PORT 3000 est accessible
3. Logs Sentry pour les crashs
```

### Timeout sur webhook

```
Vérifier:
1. Connexion PostgreSQL active
2. Requête SELECT sur checksum est rapide
3. INSERT est rapide
4. Pas de long locks sur la table
```

### Doublons non détectés

```
Vérifier:
1. checksum @unique constraint existe
2. Checksum calculation est déterministe
3. JSON.stringify() produit la même sortie
```

---

## 📞 Support

En cas de problème critique:

- Ping l'équipe backend
- Vérifier les logs Sentry en temps réel
- Préparer un rollback si nécessaire
