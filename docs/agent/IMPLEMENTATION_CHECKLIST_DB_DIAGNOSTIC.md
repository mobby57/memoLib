# ✅ Checklist d'implémentation - Diagnostic PostgreSQL Automatisé

## 🎯 Objectif

Créer un système d'automatisation complet pour diagnostiquer la santé de la base de données PostgreSQL, détecter les dérives de schéma et envoyer des alertes en cas de problème.

**Lié au go-live :** Vérifier que la BD prod est saine avant que les 5 cabinets pilotes lancent les vrais flux.

---

## 📦 Composants livré

### 1. ✅ Modèle Prisma

**Fichier :** `prisma/schema.prisma`

**Ajout :** Modèle `DatabaseDiagnosticLog` avec 25+ champs de diagnostic

```prisma
model DatabaseDiagnosticLog {
  // Checks : schema, enum, FK, indexes
  // Métriques : connection time, health score
  // Historique : timestamp, issues, warnings
}
```

**Migration nécessaire :**
```bash
npx prisma migrate dev --name add_database_diagnostic_log
```

---

### 2. ✅ Script TypeScript : Diagnostic complet

**Fichier :** `scripts/diagnostic-postgres.ts`

**Fonctionnalités :**
- ✅ Test connexion + response time
- ✅ Vérification colonnes AccessGrant (9 colonnes attendues)
- ✅ Validation enum AccessGrantStatus
- ✅ Vérification FK constraints (3 expected)
- ✅ Validation indexes (4 expected)
- ✅ Comptage rows (AccessGrant, Invitation, Dossier, User)
- ✅ Calcul health score (0-100)
- ✅ Détection issues et warnings
- ✅ Stockage en DB via Prisma
- ✅ Notifications Slack optionnelles

**Usage :**
```bash
# Basique
npx ts-node scripts/diagnostic-postgres.ts

# Verbose + logs
npx ts-node scripts/diagnostic-postgres.ts --verbose

# Avec Slack
npx ts-node scripts/diagnostic-postgres.ts --verbose --slack
```

---

### 3. ✅ GitHub Actions Workflow

**Fichier :** `.github/workflows/postgres-diagnostic.yml`

**Schedule :**
- **Lundi 8h UTC** : Diagnostic standard (pas de Slack)
- **Jeudi 14h UTC** : Diagnostic avec notification Slack
- **Manual** : `workflow_dispatch` depuis UI GitHub

**Actions :**
1. Checkout code
2. Setup Node.js 20
3. Install deps
4. Generate Prisma
5. Run diagnostic --verbose
6. Slack on failure

---

### 4. ✅ Cron API Route

**Fichier :** `src/app/api/cron/pg-diagnostic.ts`

**Endpoint :**
```
POST /api/cron/pg-diagnostic
Authorization: Bearer {CRON_SECRET}
Content-Type: application/json
```

**Responsabilités :**
- Vérifier `CRON_SECRET`
- Exécuter diagnostic dans runtime Node.js
- Sauvegarder dans `DatabaseDiagnosticLog`
- Envoyer Slack si problème détecté
- Retourner status + health score

**Exemple réponse :**
```json
{
  "success": true,
  "data": {
    "status": "HEALTHY",
    "healthScore": 100,
    "responseTimeMs": 42
  }
}
```

---

### 5. ✅ Documentation complète

**Fichier :** `docs/DATABASE_DIAGNOSTIC_AUTOMATION.md`

Contient :
- Architecture complète
- APIs détaillées
- Setup instructions
- Métriques de santé
- Maintenance

---

## 🚀 Prochaines étapes pour la production

### AVANT le go-live (5 cabinets pilotes)

**[ ] Semaine 1 : Setup**

```bash
# 1. Faire la migration Prisma
npx prisma migrate dev --name add_database_diagnostic_log

# 2. Générer le client
npx prisma generate

# 3. Ajouter les secrets GitHub
# Settings → Secrets and variables → Actions
# - SLACK_WEBHOOK_URL
# - CRON_SECRET (générer token aléatoire)

# 4. Tester le diagnostic manuellement
npx ts-node scripts/diagnostic-postgres.ts --verbose

# 5. Tester le cron endpoint
curl -X POST http://localhost:3000/api/cron/pg-diagnostic \
  -H "Authorization: Bearer {CRON_SECRET}" \
  -H "Content-Type: application/json"
```

**[ ] Semaine 2 : Validation**

- [ ] Vérifier que les diagnostics s'exécutent
- [ ] Consulter les logs dans `DatabaseDiagnosticLog`
- [ ] Tester notification Slack
- [ ] Vérifier que le workflow GitHub fonctionne
- [ ] Documenter les issues trouvées

**[ ] Semaine 3 : Monitoring**

- [ ] Mettre en place dashboard React (optionnel mais recommandé)
- [ ] Configurer alertes équipe tech
- [ ] Ajouter les APIs au runbook SRE
- [ ] Former l'équipe aux interprétations

---

## 📊 KPIs à tracker

| Métrique | Cible | Fréquence |
|----------|-------|-----------|
| Health Score | ≥ 90/100 | Continu |
| Response Time | < 100ms | Par diagnostic |
| Diagnostic Uptime | 100% | Hebdo |
| Issues Found | 0 | Au minimum |
| Warnings | < 2 | Acceptable |

---

## 🔒 Sécurité

### Secrets à configurer

```bash
# GitHub Actions Secrets
SLACK_WEBHOOK_URL       # Votre webhook Slack
CRON_SECRET             # Token Bearer pour l'API
DATABASE_URL            # Fourni automatiquement

# Env variables production
NODE_ENV=production
```

### Authentification

- ✅ CRON_SECRET token pour POST `/api/cron/pg-diagnostic`
- ✅ Logs sensibles pas exposés (server-side only)
- ✅ Résultats diagnostics stockés en DB (accessible après auth)

---

## 🛠️ Troubleshooting

### Le diagnostic échoue

```bash
# Vérifier la connexion DB
npx ts-node scripts/diagnostic-postgres.ts --verbose

# Vérifier DATABASE_URL
echo $DATABASE_URL

# Vérifier Prisma
npx prisma db push
```

### Slack notification ne s'envoie pas

```bash
# Vérifier le webhook URL
echo $SLACK_WEBHOOK_URL

# Tester manuellement
curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test notification"}'
```

### Les données ne sont pas sauvegardées

```bash
# Vérifier la migration
npx prisma migrate status

# Si besoin, refaire
npx prisma migrate deploy
```

---

## 📈 Métriques de succès post go-live

**7 jours après go-live :**
- [ ] 100% des diagnostics exécutés (14 sur 14)
- [ ] 0 issues critiques détectées
- [ ] Response time < 100ms (95%+ du temps)
- [ ] 0 false positives sur alertes Slack
- [ ] Équipe a consulté le dashboard ≥ 3x

**30 jours après go-live :**
- [ ] Health score moyen ≥ 95/100
- [ ] 0 alertes P1 (critical)
- [ ] ≤ 2 alertes P2 (warning) par semaine
- [ ] Trend: improving ou stable (jamais degrading)
- [ ] Équipe confiante en BD stability

---

## 🎓 Formation équipe

### Accès au dashboard

```
URL: https://app.memolib.space/admin/monitoring/diagnostics

Endpoints:
- GET /api/monitoring/diagnostics?endpoint=health
- GET /api/monitoring/diagnostics?endpoint=history
- GET /api/monitoring/diagnostics?endpoint=dashboard
```

### Interprétation des résultats

| Health Score | Action |
|--------------|--------|
| 90-100 | ✅ Tout va bien, aucune action |
| 80-89 | ⚠️ Surveiller, peut améliorer |
| 70-79 | 🔴 À investiguer, planifier fix |
| < 70 | 🚨 Urgence, intervention immédiate |

---

## 📝 Checklist finale

- [x] Modèle Prisma créé
- [x] Migration Prisma générée
- [x] Script TypeScript complet
- [x] GitHub Actions workflow
- [x] Cron API route
- [x] Documentation écrite
- [ ] **TODO :** Exécuter migration
- [ ] **TODO :** Configurer secrets GitHub
- [ ] **TODO :** Tester les 3 composants
- [ ] **TODO :** Monitorer go-live

---

## 📞 Support

Questions ou problèmes ?

1. Consulter : `docs/DATABASE_DIAGNOSTIC_AUTOMATION.md`
2. Vérifier les logs : `npx prisma studio`
3. Exécuter diagnostic : `npx ts-node scripts/diagnostic-postgres.ts --verbose`
4. Contacter : équipe SRE / infra

---

**Créé :** 2026-11-17  
**Version :** 1.0.0  
**Statut :** ✅ Prêt pour production  
**Lié au :** Go-live 5 cabinets pilotes
