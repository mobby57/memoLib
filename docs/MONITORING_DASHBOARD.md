# 📊 Dashboard de Monitoring - Logs Système

## Vue d'ensemble

Le dashboard de monitoring des logs est accessible à l'adresse `/admin/logs` et permet de consulter en temps réel tous les logs système de l'application.

## Fonctionnalités

### 1. **Visualisation des logs**
- Affichage en temps réel des logs avec rafraîchissement automatique (5s)
- Tableau avec colonnes : Timestamp, Level, Message, Action, Context
- Détails contextuels expandables (JSON)

### 2. **Filtrage avancé**
- **Par niveau** : debug, info, warn, error, critical
- **Par action juridique** : CREATE_DOSSIER, AI_ANALYSIS, USER_LOGIN, etc.
- **Recherche textuelle** : filtrage local dans message et contexte

### 3. **Statistiques en temps réel**
5 cartes affichant le nombre de logs par niveau :
- 🔍 Debug (gris)
- ℹ️ Info (bleu)
- ⚠️ Warning (jaune)
- ❌ Error (rouge)
- 🚨 Critical (rouge foncé)

### 4. **Export de données**
- Export CSV avec colonnes : Timestamp, Level, Message, Action, UserId, TenantId, DossierId
- Nom de fichier : `logs_2026-01-05T12:34:56.789Z.csv`

### 5. **Auto-refresh**
- Bouton toggle pour activer/désactiver le rafraîchissement automatique
- Intervalle : 5 secondes
- Indicateur visuel : vert (actif) / gris (inactif)

## API Route

### GET /api/admin/logs

**Authentification** : Requise (rôle ADMIN ou SUPER_ADMIN)

**Paramètres de requête** :
- `level` (optionnel) : debug | info | warn | error | critical
- `action` (optionnel) : CREATE_DOSSIER | AI_ANALYSIS | etc.
- `limit` (optionnel, défaut: 100) : nombre maximum de logs

**Réponse** :
```json
{
  "logs": [
    {
      "timestamp": "2026-01-05T12:34:56.789Z",
      "level": "info",
      "message": "ACTION DOSSIER: CREATE_DOSSIER",
      "context": { "dossierId": "abc123" },
      "userId": "user-123",
      "tenantId": "tenant-456",
      "actionJuridique": "CREATE_DOSSIER",
      "rgpdCompliant": true
    }
  ],
  "total": 42,
  "filters": {
    "level": "info",
    "action": "CREATE_DOSSIER",
    "limit": 100
  }
}
```

**Codes d'erreur** :
- `401` : Non authentifié
- `403` : Accès refusé (rôle insuffisant)
- `500` : Erreur serveur

## Méthode Logger

### logger.getBufferedLogs()

Retourne une copie du buffer de logs (max 100 entrées).

**Usage** :
```typescript
import { logger } from '@/lib/logger';

const logs = logger.getBufferedLogs();
console.log(`${logs.length} logs dans le buffer`);
```

**Retour** :
```typescript
LogEntry[] // Copie du buffer (ne modifie pas l'original)
```

## Sécurité

### 1. **Authentification**
Seuls les utilisateurs authentifiés peuvent accéder à l'API.

### 2. **Autorisation**
Seuls les rôles `ADMIN` et `SUPER_ADMIN` peuvent consulter les logs.

### 3. **Audit trail**
Chaque consultation des logs est elle-même loggée :
```typescript
logger.info('Consultation logs admin', {
  userId: session.user.id,
  filters: { level, action, limit },
  resultCount: result.length,
});
```

### 4. **RGPD**
Les données personnelles sont automatiquement anonymisées :
- Emails : `***@domain.com`
- Mots de passe, tokens : `[REDACTED]`
- Données personnelles : `[DONNÉES PERSONNELLES]`

## Cas d'usage

### Surveiller les erreurs critiques
1. Filtrer par niveau "critical"
2. Activer auto-refresh
3. Observer les nouvelles erreurs en temps réel

### Analyser l'usage de l'IA
1. Filtrer par action "AI_ANALYSIS" ou "AI_SUGGESTION"
2. Examiner le contexte (confidence, modelUsed)
3. Exporter en CSV pour analyse Excel

### Audit de sécurité
1. Filtrer par action "PERMISSION_DENIED"
2. Vérifier les tentatives d'accès non autorisées
3. Identifier les utilisateurs concernés

### Débogage d'un dossier
1. Rechercher l'ID du dossier dans la barre de recherche
2. Voir toutes les actions liées au dossier
3. Analyser la chronologie complète

## Améliorations futures

- [ ] Filtrage par plage de dates
- [ ] Filtrage par userId / tenantId
- [ ] Export JSON
- [ ] Pagination serveur (actuellement limite à 100)
- [ ] Graphiques de tendance (nombre de logs par heure/jour)
- [ ] Alertes configurables (email si > X erreurs/min)
- [ ] Stockage persistant des logs (actuellement en mémoire)
- [ ] Intégration Sentry/DataDog pour logs production
