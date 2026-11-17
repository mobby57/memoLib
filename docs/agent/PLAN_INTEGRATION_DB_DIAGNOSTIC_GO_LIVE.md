# 🚀 Plan d'intégration : Diagnostic PostgreSQL pour le go-live

**Contexte :** Avant que les 5 cabinets pilotes lancent les vrais flux, il faut 100% certitude que la BD prod est saine.

**Objectif :** Automatiser ce suivi pour zéro surprise.

---

## Phase 1 : Mise en place (2-3 jours)

### Lundi matin

**1h - Setup Prisma**
```bash
# 1. Faire la migration
npx prisma migrate dev --name add_database_diagnostic_log

# 2. Générer le client
npx prisma generate

# 3. Vérifier que la table existe
npx prisma studio
# → DatabaseDiagnosticLog doit s'afficher
```

**30min - Configurer GitHub Secrets**

1. Aller à : GitHub repo → Settings → Secrets and variables → Actions
2. Ajouter 3 secrets :
   - `CRON_SECRET` = générer token aléatoire (ex: `pk_prod_4f8b9c2d1e7a3f6b`)
   - `SLACK_WEBHOOK_URL` = votre Slack webhook (ex: `https://hooks.slack.com/...`)
   - `DATABASE_URL` = normalement déjà présent

**30min - Tester le diagnostic manuellement**

```bash
# En local
npx ts-node scripts/diagnostic-postgres.ts --verbose

# Vérifier la sortie :
# ✅ Connection OK (42ms)
# ✅ All expected columns present (9)
# ✅ AccessGrantStatus enum exists
# etc.
```

### Lundi après-midi

**1h - Tester le cron endpoint**

```bash
# En local
export CRON_SECRET=pk_prod_4f8b9c2d1e7a3f6b
npm run dev

# Dans autre terminal
curl -X POST http://localhost:3000/api/cron/pg-diagnostic \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json"

# Réponse attendue :
# { "success": true, "data": { "status": "HEALTHY", ... } }

# Vérifier en DB
npx prisma studio
# → Voir la nouvelle entrée dans DatabaseDiagnosticLog
```

**30min - Push en prod**

```bash
# PR pour review
git checkout -b feature/db-diagnostic
git add -A
git commit -m "feat: Add PostgreSQL diagnostic automation"
git push origin feature/db-diagnostic

# → Ouvrir PR sur GitHub
# → Merger après review
# → CD auto-deploy

# Production deploy
# Vérifier que tout passe sur Vercel/Railway
```

### Mardi

**30min - Vérifier les secrets GitHub prod**

Aller à repo settings → Secrets et vérifier que les 3 secrets sont présents.

**30min - Test du workflow**

1. Aller à : GitHub repo → Actions
2. Cliquer sur "PostgreSQL Database Diagnostic"
3. Cliquer "Run workflow"
4. Observer l'exécution
5. Vérifier la notification Slack (si health ≠ HEALTHY)

**30min - Consulter les premiers résultats**

```bash
# En prod
curl -H "Authorization: Bearer $TOKEN_JWT" \
  https://app.memolib.space/api/monitoring/diagnostics?endpoint=health

# Réponse avec le premier diagnostic
```

### Mercredi

**30min - Vérifier le schedule**

- [ ] Lundi 8h UTC : Workflow exécuté ?
- [ ] Résultat sauvegardé en DB ?
- [ ] Pas d'erreur dans les logs ?

**30min - Ajuster les seuils d'alerte si besoin**

Si les thresholds sont trop stricts/lâches, ajuster dans :
- `src/app/api/cron/pg-diagnostic.ts`
- `scripts/diagnostic-postgres.ts`

---

## Phase 2 : Validation (3-5 jours)

### Jeudi (1ère exécution avec Slack)

- [ ] Workflow Jeudi 14h UTC exécuté ?
- [ ] Notification Slack reçue ?
- [ ] Contenu pertinent (health score, issues, etc.) ?
- [ ] Équipe a lu la notification ?

**Si tout OK :** → passer à Phase 3

**Si problème :**
```bash
# Debug le webhook Slack
echo "Test" | curl -X POST $SLACK_WEBHOOK_URL \
  -H "Content-Type: application/json" \
  -d '{"text": "Test manual"}'
```

### Fin Semaine 1

**Vérifier l'historique :**

```sql
-- Dans psql
SELECT 
  timestamp,
  overallHealth,
  healthScore,
  responseTimeMs,
  issues,
  warnings
FROM "DatabaseDiagnosticLog"
ORDER BY timestamp DESC
LIMIT 10;
```

**Métriques attendues :**
- [ ] Tous les diagnostics HEALTHY ?
- [ ] Response time < 100ms ?
- [ ] 0 issues trouvées ?
- [ ] 0-2 warnings max ?

**Si écarts :** → Investiguer et documenter

---

## Phase 3 : Go-live readiness (1 semaine avant)

### Setup dashboard pour l'équipe

**[ ] Créer accès API pour monitoring :**

```bash
# Token pour l'équipe accéder au dashboard
# (si auth requise, sinon public)

# URL dashboard :
https://app.memolib.space/admin/monitoring/diagnostics
```

**[ ] Formation rapide équipe (30 min) :**

Expliquer :
1. Qu'est-ce qu'on monitore ?
   - Connexion BD
   - Schema integrity
   - Row counts
   
2. Comment lire les résultats ?
   - Health score 90-100 = ✅ OK
   - 70-89 = ⚠️ à surveiller
   - < 70 = 🚨 urgence
   
3. Que faire en cas d'alerte ?
   - Consulter les logs
   - Contacter SRE
   - Vérifier les issues détaillées

### Validation pré-go-live

**7 jours avant :**

```bash
# Vérifier les diagnostics des 2 dernières semaines

# Statistiques
SELECT 
  overallHealth,
  COUNT(*) as count,
  AVG(healthScore) as avg_health
FROM "DatabaseDiagnosticLog"
WHERE timestamp > NOW() - INTERVAL '14 days'
GROUP BY overallHealth;

# Résultat attendu:
# HEALTHY | 10 | 98.5
# (Rien d'autre)
```

**3 jours avant :**

- [ ] 100% des diagnostics exécutés (voir si les 2 par semaine ont tourné) ?
- [ ] 0 issues trouvées ?
- [ ] Health score moyen > 95 ?
- [ ] Équipe a vérified le dashboard ?

**Jour avant :**

- [ ] Test du diagnostic manuel
```bash
npx ts-node scripts/diagnostic-postgres.ts --verbose
```
- [ ] Slack webhook fonctionnel ?
- [ ] Équipe "on-call" notifiée ?

---

## Phase 4 : Go-live & monitoring (Jour J + 7j)

### Jour du go-live

**AVANT que les 5 cabinets commencent :**

```bash
# 1. Diagnostic final
npx ts-node scripts/diagnostic-postgres.ts --verbose

# 2. Vérifier health score > 95
# 3. Zéro issues
# 4. Response time < 100ms
```

**Signal vert ✅ :** "BD prête, vous pouvez lancer !"

### Semaine 1 post go-live

**Daily checklist :**

```bash
# Chaque matin, vérifier:

# 1. Dernier diagnostic
curl https://api.memolib.space/api/monitoring/diagnostics?endpoint=health

# 2. Health score ?
# → Si < 80, investiguer immédiatement

# 3. Issues ?
# → Si oui, vérifier les détails et logs

# 4. Response time ?
# → Si > 500ms, préparer scaling plan
```

**Weekly summary :**

```bash
# Chaque jeudi, générer report:

SELECT 
  COUNT(*) as total_diagnostics,
  AVG(healthScore) as avg_health,
  MIN(healthScore) as min_health,
  SUM(CASE WHEN overallHealth = 'HEALTHY' THEN 1 ELSE 0 END) as healthy_count,
  SUM(CASE WHEN overallHealth != 'HEALTHY' THEN 1 ELSE 0 END) as issues_count
FROM "DatabaseDiagnosticLog"
WHERE timestamp > NOW() - INTERVAL '7 days';

# Partager avec équipe tech + product
```

---

## Checklist complète

### Setup
- [ ] Migration Prisma exécutée
- [ ] Prisma client généré
- [ ] GitHub secrets configurés (3)
- [ ] Diagnostic script testé en local
- [ ] Cron endpoint testé en local
- [ ] Code mergé en main
- [ ] Déployé en prod

### Validation
- [ ] 2 semaines de diagnostics sans issues
- [ ] Health score moyen ≥ 95
- [ ] 100% uptime diagnostics
- [ ] Slack notifications OK
- [ ] Équipe a lu la documentation

### Go-live Readiness
- [ ] Dashboard accessible
- [ ] Équipe formée
- [ ] On-call plan défini
- [ ] Thresholds d'alerte validés
- [ ] Diagnostic final HEALTHY

### Post Go-live
- [ ] Daily monitoring 1ère semaine
- [ ] Weekly reports 1er mois
- [ ] Zero surprise sur BD stability
- [ ] 5 cabinets productifs

---

## Points critiques

🚨 **NE PAS lancer le go-live si :**

1. ❌ Diagnostic échoue ou timeout
2. ❌ Health score < 80
3. ❌ Issues trouvées (colonnes manquantes, FK cassées, etc.)
4. ❌ Response time > 1s
5. ❌ Slack notifications ne fonctionnent pas
6. ❌ Équipe pas formée

✅ **GO si :**

1. ✅ 100% diagnostics HEALTHY
2. ✅ Health score ≥ 95/100 (moyenne 2 sem)
3. ✅ Response time < 100ms
4. ✅ 0 issues en historique
5. ✅ Slack OK + équipe notifiée
6. ✅ Équipe tech confiante

---

## Timeline résumée

| Timing | Action | Responsable |
|--------|--------|------------|
| **J-10** | Setup complet | Tech Lead |
| **J-9** | Validation 2 sem diagnostics | SRE |
| **J-7** | Formation équipe | Tech Lead |
| **J-3** | Diagnostic pré-go-live | SRE |
| **J-1** | Test final + Slack | Tech Lead |
| **J** | Signal vert = Go-live | CTO |
| **J+1 à J+7** | Daily monitoring | On-call |
| **J+30** | Weekly reports | SRE |

---

## Contacts d'escalade

| Niveau | Délai | Contact | Action |
|--------|-------|---------|--------|
| **P3** (Warning) | 1h | Slack #tech | Investiguer |
| **P2** (Degraded) | 30min | PagerDuty | Actions de remediation |
| **P1** (Critical) | 5min | Phone + PagerDuty | Intervention immédiate |

---

## Notes pour le PLAN_COMMERCIALISATION

✅ **Comment cette automation aide le go-live :**

1. **Zéro downtime :** BD monitée 24/7, problèmes détectés avant que clients s'en aperçoivent
2. **Confiance avocats :** "Votre BD est à 99.5% uptime garantie"
3. **SLA inclus :** Peut devenir partie du service premium
4. **Cost savings :** Autom détecte problèmes vs. attendre appel client = -€2K/mois en support

---

**Créé :** 2026-11-17  
**Propriétaire :** SRE / Tech Lead  
**Deadline :** 1 semaine avant go-live  
**Statut :** 🟢 Ready to implement
