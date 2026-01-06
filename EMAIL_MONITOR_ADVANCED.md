# 🚀 Configuration Avancée - Email Monitor

Ce guide détaille toutes les options de configuration avancées pour le monitoring d'emails.

## 📁 Fichier de Configuration

Le fichier `email-monitor.config.json` contient toutes les options configurables.

## ⚙️ Options Disponibles

### 1. 📊 Monitoring de Base

```json
"monitoring": {
  "enabled": true,              // Activer/désactiver le monitoring
  "intervalSeconds": 30,         // Intervalle de vérification (secondes)
  "maxResults": 10,              // Nombre max d'emails à traiter par cycle
  "markAsRead": false            // Marquer automatiquement comme lu
}
```

**Recommandations :**
- `intervalSeconds: 30` pour usage normal
- `intervalSeconds: 60-300` pour réduire les appels API
- `intervalSeconds: 5-10` pour surveillance critique

### 2. 🎯 Filtres et Classification

```json
"filters": {
  "laposte": {
    "enabled": true,
    "priority": "high",
    "keywords": ["laposte", "colissimo", "suivi"],
    "senders": ["@laposte.fr", "@colissimo.fr"],
    "notification": true,
    "autoLabel": "LaPoste"
  }
}
```

**Personnalisation :**
- Ajoutez vos propres filtres pour différents types d'emails
- `priority`: "low" | "medium" | "high" | "urgent"
- `keywords`: Liste de mots-clés à rechercher (insensible à la casse)
- `senders`: Domaines ou adresses email spécifiques
- `autoLabel`: Créer/appliquer automatiquement un label Gmail

**Exemple - Ajouter un filtre personnalisé :**
```json
"factures": {
  "enabled": true,
  "priority": "medium",
  "keywords": ["facture", "invoice", "paiement"],
  "senders": ["@comptabilite.com"],
  "notification": false,
  "autoLabel": "Factures"
}
```

### 3. 🔔 Notifications

```json
"notifications": {
  "enabled": true,
  "desktop": true,               // Notifications Windows/Mac
  "sound": false,                // Son lors de notification
  "webhook": {
    "enabled": false,
    "url": "https://hooks.slack.com/services/YOUR/WEBHOOK",
    "events": ["urgent", "laposte"]
  },
  "email": {
    "enabled": false,
    "to": "admin@example.com",
    "conditions": ["urgent"]     // Envoyer email uniquement pour urgents
  }
}
```

**Intégrations disponibles :**
- **Notifications desktop** : Natif Windows/Mac
- **Webhook** : Slack, Discord, Microsoft Teams, etc.
- **Email** : Notifications par email pour événements critiques

**Configuration Slack :**
1. Créer un Incoming Webhook sur Slack
2. Copier l'URL du webhook
3. Activer dans la config :
```json
"webhook": {
  "enabled": true,
  "url": "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX",
  "events": ["urgent", "laposte", "nouveauClient"]
}
```

### 4. 🏷️ Gestion des Labels Gmail

```json
"labels": {
  "autoCreate": true,            // Créer automatiquement les labels
  "autoApply": true,             // Appliquer automatiquement
  "removeAfterProcessed": false  // Retirer après traitement
}
```

**Fonctionnalités :**
- Création automatique de labels dans Gmail
- Application basée sur les filtres
- Gestion du cycle de vie des labels

### 5. 💾 Export et Sauvegarde

```json
"export": {
  "enabled": true,
  "format": "json",              // "json" | "csv" | "xml"
  "path": "logs/emails",
  "includeAttachments": false,   // Télécharger les pièces jointes
  "exportInterval": "daily"      // "realtime" | "hourly" | "daily"
}
```

**Formats supportés :**
- **JSON** : Données structurées complètes
- **CSV** : Import facile dans Excel/Google Sheets
- **XML** : Compatible avec systèmes legacy

**Gestion des pièces jointes :**
```json
"includeAttachments": true  // Télécharge dans logs/emails/attachments/
```

### 6. 📈 Statistiques et Métriques

```json
"statistics": {
  "enabled": true,
  "trackMetrics": true,
  "exportPath": "logs/stats",
  "metrics": [
    "emailsPerHour",          // Volume par heure
    "emailsByPriority",       // Répartition par priorité
    "emailsBySender",         // Top expéditeurs
    "responseTime",           // Temps de réponse moyen
    "attachmentCount"         // Nombre de pièces jointes
  ]
}
```

**Métriques générées :**
- Graphiques d'activité
- Rapports quotidiens/hebdomadaires
- Tendances et anomalies
- Alertes sur pics d'activité

### 7. 🤖 Réponses Automatiques

```json
"autoResponse": {
  "enabled": false,              // ATTENTION: Nécessite scope gmail.send
  "conditions": {
    "nouveauClient": {
      "enabled": false,
      "template": "Bonjour,\n\nNous avons bien reçu votre message..."
    }
  }
}
```

**⚠️ Important :**
- Nécessite le scope `https://www.googleapis.com/auth/gmail.send`
- À utiliser avec précaution
- Tester d'abord avec `enabled: false`

**Templates personnalisés :**
```json
"template": "Bonjour {name},\n\nMerci pour votre message du {date}.\n\nCordialement,\n{signature}"
```

Variables disponibles : `{name}`, `{date}`, `{subject}`, `{signature}`

### 8. ⚡ Options Avancées

```json
"advanced": {
  "batchProcessing": true,       // Traiter par lots
  "concurrentRequests": 3,       // Requêtes simultanées
  "retryFailedRequests": true,   // Réessayer en cas d'échec
  "maxRetries": 3,               // Nombre max de tentatives
  "cacheResults": true,          // Cache pour performances
  "cacheDuration": 300           // Durée cache (secondes)
}
```

**Optimisations :**
- `concurrentRequests: 3-5` : Bon équilibre performance/quota
- `cacheResults: true` : Réduit les appels API répétitifs
- `batchProcessing: true` : Améliore les performances

### 9. 🔒 Sécurité

```json
"security": {
  "logSensitiveData": false,     // Ne pas logger données sensibles
  "encryptLogs": false,          // Chiffrer les logs
  "allowedDomains": [],          // Whitelist de domaines
  "blockedSenders": []           // Blacklist d'expéditeurs
}
```

**Exemples :**
```json
"allowedDomains": ["@entreprise.com", "@partenaire.fr"],
"blockedSenders": ["spam@example.com", "@suspicious-domain.com"]
```

## 🎯 Scénarios d'Usage

### Scénario 1 : Support Client Basique

```json
{
  "monitoring": {
    "intervalSeconds": 30,
    "maxResults": 10
  },
  "filters": {
    "nouveauClient": {
      "enabled": true,
      "notification": true
    }
  },
  "notifications": {
    "desktop": true,
    "sound": true
  }
}
```

### Scénario 2 : Monitoring Intensif avec Analytics

```json
{
  "monitoring": {
    "intervalSeconds": 10,
    "maxResults": 50
  },
  "statistics": {
    "enabled": true,
    "trackMetrics": true
  },
  "export": {
    "format": "csv",
    "exportInterval": "hourly"
  }
}
```

### Scénario 3 : Intégration Slack

```json
{
  "notifications": {
    "webhook": {
      "enabled": true,
      "url": "YOUR_SLACK_WEBHOOK",
      "events": ["urgent", "laposte"]
    }
  },
  "filters": {
    "urgent": {
      "enabled": true,
      "priority": "urgent",
      "notification": true
    }
  }
}
```

## 🚀 Commandes Utiles

### Tester la configuration
```powershell
npm run email:monitor -- --test-config
```

### Voir les statistiques
```powershell
npm run email:stats
```

### Exporter les données
```powershell
npm run email:export --format csv --days 7
```

### Mode debug
```powershell
npm run email:monitor -- --debug
```

## 📊 Dashboard Web (À venir)

Fonctionnalités prévues :
- Interface web pour monitoring en temps réel
- Graphiques interactifs des statistiques
- Gestion des filtres et configurations
- Historique des emails traités
- Recherche avancée

## 🔧 Dépannage

### Problème de quota API

Si vous recevez des erreurs de quota :
```json
"monitoring": {
  "intervalSeconds": 60  // Augmenter l'intervalle
},
"advanced": {
  "cacheResults": true,
  "cacheDuration": 600   // Cache plus long
}
```

### Performance lente

```json
"advanced": {
  "concurrentRequests": 5,
  "batchProcessing": true
},
"monitoring": {
  "maxResults": 5  // Réduire le nombre d'emails par cycle
}
```

## 📚 Prochaines Fonctionnalités

- [ ] IA pour classification avancée
- [ ] Détection automatique de spam
- [ ] Intégration CRM (Salesforce, HubSpot)
- [ ] Réponses intelligentes avec GPT
- [ ] Dashboard web interactif
- [ ] Support multi-comptes Gmail
- [ ] Export vers base de données
- [ ] API REST pour intégrations

## 💡 Conseils

1. **Démarrez simple** : Activez progressivement les fonctionnalités
2. **Testez en local** : Vérifiez avant de déployer en production
3. **Surveillez les quotas** : Gmail API a des limites quotidiennes
4. **Sauvegardez la config** : Gardez des versions de `email-monitor.config.json`
5. **Logs réguliers** : Consultez `logs/` pour détecter les problèmes

## 📞 Support

Pour toute question sur la configuration :
- Consultez les logs dans `logs/emails/`
- Activez le mode debug pour plus d'informations
- Vérifiez les quotas API sur Google Cloud Console

---

**Dernière mise à jour** : 5 janvier 2026
