# 📧 Guide de Démarrage - Email Monitor

## Configuration Email Gmail

### Étape 1: Activer IMAP dans Gmail
1. Aller sur https://mail.google.com
2. Paramètres (engrenage) → Voir tous les paramètres
3. Onglet "Transfert et POP/IMAP"
4. **Activer IMAP**
5. Enregistrer les modifications

### Étape 2: Créer un mot de passe d'application
1. Aller sur https://myaccount.google.com/apppasswords
2. Sélectionner "Autre (nom personnalisé)"
3. Entrer "IA Poste Manager"
4. Cliquer sur "Générer"
5. **Copier le mot de passe** (format: xxxx xxxx xxxx xxxx)

### Étape 3: Configurer .env
Ouvrir `.env` et mettre à jour:
```env
EMAIL_ADDRESS="votre-email@gmail.com"
EMAIL_PASSWORD="xxxx xxxx xxxx xxxx"  # Mot de passe d'application
```

## Installation des Dépendances

```bash
# Installer les packages email
npm install imap mailparser @types/imap @types/mailparser tsx

# Ou utiliser le script setup
npm run setup:email
```

## Démarrage du Monitoring

### Terminal 1: Application Next.js
```bash
npm run dev
```

### Terminal 2: Email Monitor
```bash
npm run email:monitor
```

Vous devriez voir:
```
╔══════════════════════════════════════════╗
║   📧 IA POSTE MANAGER - Email Monitor   ║
╚══════════════════════════════════════════╝

🚀 Initialisation du moniteur email...
📧 Connexion à votre-email@gmail.com...
✅ Connecté avec succès!
📬 Ouverture de la boîte de réception...
✅ Boîte ouverte: 42 message(s) total
👀 SURVEILLANCE ACTIVE - En attente de nouveaux emails...
```

## Test du Système

### Test 1: Envoyer un email de test
Envoyez un email à votre adresse configurée avec:
- **Sujet**: "Nouveau client - Réclamation colis"
- **Corps**: "Bonjour, j'ai un problème avec un colis..."

Le monitor devrait afficher:
```
🔔 1 nouveau(x) email(s) reçu(s)!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📧 Email #1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📤 De: Vous <votre-email@gmail.com>
📋 Sujet: Nouveau client - Réclamation colis
📅 Date: 2026-01-05...
📝 Aperçu: Bonjour, j'ai un problème avec un colis...
🏷️  Type: nouveau_client
⚡ Priorité: high
💾 Sauvegardé: logs/emails/email_2026-01-05...json
```

### Test 2: Email La Poste
Transférez un email de tracking La Poste. Il devrait être classé:
```
🏷️  Type: laposte_notification
⚡ Priorité: high
```

### Test 3: Email urgent
Envoyez un email avec "URGENT" dans le sujet:
```
🏷️  Type: urgent
⚡ Priorité: urgent
```

## Vérification des Logs

Les emails sont sauvegardés dans:
```
logs/emails/email_2026-01-05T12-30-45.json
```

Contenu:
```json
{
  "timestamp": "2026-01-05T12:30:45.123Z",
  "from": "Client <client@email.com>",
  "subject": "Nouveau client - Réclamation",
  "classification": {
    "type": "nouveau_client",
    "priority": "high"
  },
  "hasAttachments": false,
  "preview": "Bonjour, j'ai un problème..."
}
```

## Commandes Utiles

```bash
# Démarrer le monitoring
npm run email:monitor

# Voir les logs en temps réel
tail -f logs/emails/*.json

# Arrêter le monitoring
Ctrl+C dans le terminal

# Vérifier la configuration
echo $EMAIL_ADDRESS

# Tester la connexion IMAP
telnet imap.gmail.com 993
```

## Dépannage

### Erreur: "Invalid credentials"
- Vérifiez que IMAP est activé dans Gmail
- Vérifiez le mot de passe d'application (pas votre mot de passe Gmail)
- Le mot de passe doit être sans espaces dans .env

### Erreur: "Connection timeout"
- Vérifiez votre connexion internet
- Vérifiez le pare-feu
- Essayez avec un autre réseau

### Pas d'emails détectés
- Vérifiez que vous avez des emails non lus
- Le monitor ne traite que les emails UNSEEN
- Marquez un email comme non lu pour le retraiter

### Emails marqués comme lus automatiquement
- C'est désactivé par défaut
- Pour activer: décommentez les lignes 164-165 dans `scripts/email-monitor.ts`

## Prochaines Étapes

Une fois le monitoring fonctionnel:

1. **Intégration IA**: Utiliser Anthropic Claude pour classification avancée
2. **Auto-création dossiers**: Créer automatiquement des dossiers depuis les emails
3. **Extraction données**: Extraire numéros de suivi, contacts, etc.
4. **Notifications**: Alerter l'avocat en temps réel
5. **Dashboard**: Afficher les emails dans le dashboard avocat

## Support

En cas de problème:
- Vérifier les logs: `logs/emails/`
- Tester la connexion manuellement
- Consulter la doc Gmail API
- Vérifier la configuration .env

---

**Créé le:** 5 janvier 2026
**Dernière mise à jour:** 5 janvier 2026
