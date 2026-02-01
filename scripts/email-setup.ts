import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const CONFIG_PATH = path.join(process.cwd(), 'email-monitor.config.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');

interface Config {
  monitoring: any;
  filters: any;
  notifications: any;
  labels: any;
  export: any;
  statistics: any;
  advanced: any;
  security: any;
}

class EmailSetupWizard {
  private rl: readline.Interface;
  private config: Config;

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    // Charger la config par défaut
    this.config = this.loadDefaultConfig();
  }

  private loadDefaultConfig(): Config {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }

    // Config par défaut
    return {
      monitoring: {
        enabled: true,
        intervalSeconds: 30,
        maxResults: 10,
        markAsRead: false
      },
      filters: {
        laposte: {
          enabled: true,
          priority: 'high',
          keywords: ['laposte', 'colissimo', 'suivi', 'colis'],
          senders: ['@laposte.fr', '@colissimo.fr'],
          notification: true,
          autoLabel: 'LaPoste'
        },
        nouveauClient: {
          enabled: true,
          priority: 'high',
          keywords: ['nouveau', 'demande', 'réclamation', 'aide'],
          notification: true,
          autoLabel: 'NouveauClient'
        },
        urgent: {
          enabled: true,
          priority: 'urgent',
          keywords: ['urgent', 'important', '!!!'],
          notification: true,
          autoLabel: 'Urgent'
        }
      },
      notifications: {
        enabled: true,
        desktop: true,
        sound: false,
        webhook: {
          enabled: false,
          url: '',
          events: ['urgent', 'laposte']
        },
        email: {
          enabled: false,
          to: '',
          conditions: ['urgent']
        }
      },
      labels: {
        autoCreate: true,
        autoApply: true,
        removeAfterProcessed: false
      },
      export: {
        enabled: true,
        format: 'json',
        path: 'logs/emails',
        includeAttachments: false,
        exportInterval: 'daily'
      },
      statistics: {
        enabled: true,
        trackMetrics: true,
        exportPath: 'logs/stats',
        metrics: ['emailsPerHour', 'emailsByPriority', 'emailsBySender']
      },
      advanced: {
        batchProcessing: true,
        concurrentRequests: 3,
        retryFailedRequests: true,
        maxRetries: 3,
        cacheResults: true,
        cacheDuration: 300
      },
      security: {
        logSensitiveData: false,
        encryptLogs: false,
        allowedDomains: [],
        blockedSenders: []
      }
    };
  }

  private async question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(query, resolve);
    });
  }

  private async confirm(query: string): Promise<boolean> {
    const answer = await this.question(`${query} (o/n) : `);
    return answer.toLowerCase() === 'o' || answer.toLowerCase() === 'oui';
  }

  async run(): Promise<void> {
    console.clear();
    console.log('╔═══════════════════════════════════════════════════╗');
    console.log('║  📧 Assistant de Configuration Email Monitor     ║');
    console.log('╚═══════════════════════════════════════════════════╝\n');

    try {
      // Étape 1 : Vérification Gmail API
      await this.checkGmailAPI();

      // Étape 2 : Configuration monitoring
      await this.configureMonitoring();

      // Étape 3 : Configuration filtres
      await this.configureFilters();

      // Étape 4 : Configuration notifications
      await this.configureNotifications();

      // Étape 5 : Configuration statistiques
      await this.configureStatistics();

      // Étape 6 : Sauvegarder
      await this.saveConfig();

      console.log('\n✅ Configuration terminée avec succès!\n');
      console.log('📝 Prochaines étapes :');
      console.log('   1. Lancez le monitoring : npm run email:monitor');
      console.log('   2. Consultez les stats : npm run email:stats');
      console.log('   3. Éditez la config : email-monitor.config.json\n');

    } catch (error: any) {
      console.error('\n❌ Erreur:', error.message);
    } finally {
      this.rl.close();
    }
  }

  private async checkGmailAPI(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 Étape 1/5 : Vérification Gmail API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const hasCredentials = fs.existsSync(CREDENTIALS_PATH);
    const hasToken = fs.existsSync(TOKEN_PATH);

    console.log(`📄 credentials.json : ${hasCredentials ? '✅' : '❌'}`);
    console.log(`🔑 token.json       : ${hasToken ? '✅' : '❌'}\n`);

    if (!hasCredentials) {
      console.log('⚠️  Le fichier credentials.json est manquant!\n');
      console.log('📝 Instructions :');
      console.log('   1. Allez sur https://console.cloud.google.com/');
      console.log('   2. Créez un projet et activez Gmail API');
      console.log('   3. Créez des credentials OAuth 2.0');
      console.log('   4. Téléchargez et renommez en credentials.json');
      console.log('   5. Placez le fichier à la racine du projet\n');
      console.log('📖 Guide complet : GMAIL_API_SETUP.md\n');

      const continueAnyway = await this.confirm('Continuer la configuration malgré tout?');
      if (!continueAnyway) {
        process.exit(1);
      }
    }

    if (!hasToken && hasCredentials) {
      console.log('💡 Vous devrez vous authentifier lors du premier lancement.');
      console.log('   Une fenêtre de navigateur s\'ouvrira automatiquement.\n');
    }

    if (hasToken) {
      // Vérifier si le token contient le scope Gmail
      const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
      if (!token.scope || !token.scope.includes('gmail')) {
        console.log('⚠️  Votre token ne contient pas les permissions Gmail!\n');
        console.log('🔧 Solution :');
        console.log('   1. Supprimez token.json et credentials.json');
        console.log('   2. Configurez le scope Gmail dans Google Cloud Console');
        console.log('   3. Créez de nouveaux credentials\n');
        console.log('📖 Voir : GMAIL_API_SETUP.md (Section Dépannage)\n');

        const fixNow = await this.confirm('Voulez-vous supprimer les fichiers maintenant?');
        if (fixNow) {
          if (fs.existsSync(TOKEN_PATH)) fs.unlinkSync(TOKEN_PATH);
          if (fs.existsSync(CREDENTIALS_PATH)) fs.unlinkSync(CREDENTIALS_PATH);
          console.log('✅ Fichiers supprimés. Reconfigurez Gmail API puis relancez.\n');
          process.exit(0);
        }
      } else {
        console.log('✅ Configuration Gmail API valide!\n');
      }
    }
  }

  private async configureMonitoring(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚙️  Étape 2/5 : Configuration du Monitoring');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const interval = await this.question(
      `Intervalle de vérification (secondes) [${this.config.monitoring.intervalSeconds}] : `
    );
    if (interval) this.config.monitoring.intervalSeconds = parseInt(interval);

    const maxResults = await this.question(
      `Nombre max d'emails par cycle [${this.config.monitoring.maxResults}] : `
    );
    if (maxResults) this.config.monitoring.maxResults = parseInt(maxResults);

    const markAsRead = await this.confirm(
      'Marquer les emails comme lus automatiquement?'
    );
    this.config.monitoring.markAsRead = markAsRead;

    console.log('\n✅ Monitoring configuré!\n');
  }

  private async configureFilters(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 Étape 3/5 : Configuration des Filtres');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('Filtres disponibles :');
    console.log('  1. La Poste / Colissimo');
    console.log('  2. Nouveaux Clients');
    console.log('  3. Emails Urgents\n');

    this.config.filters.laposte.enabled = await this.confirm(
      '1. Activer le filtre La Poste?'
    );

    this.config.filters.nouveauClient.enabled = await this.confirm(
      '2. Activer le filtre Nouveaux Clients?'
    );

    this.config.filters.urgent.enabled = await this.confirm(
      '3. Activer le filtre Urgents?'
    );

    const addCustom = await this.confirm('\nAjouter un filtre personnalisé?');
    if (addCustom) {
      const name = await this.question('Nom du filtre : ');
      const keywords = await this.question('Mots-clés (séparés par des virgules) : ');
      const priority = await this.question('Priorité (low/medium/high/urgent) [medium] : ');

      this.config.filters[name] = {
        enabled: true,
        priority: priority || 'medium',
        keywords: keywords.split(',').map((k: string) => k.trim()),
        senders: [],
        notification: true,
        autoLabel: name
      };

      console.log(`\n✅ Filtre "${name}" créé!\n`);
    }
  }

  private async configureNotifications(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔔 Étape 4/5 : Configuration des Notifications');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    this.config.notifications.enabled = await this.confirm(
      'Activer les notifications?'
    );

    if (this.config.notifications.enabled) {
      this.config.notifications.desktop = await this.confirm(
        'Notifications desktop (Windows/Mac)?'
      );

      this.config.notifications.sound = await this.confirm(
        'Son lors des notifications?'
      );

      const useWebhook = await this.confirm(
        '\nConfigurer un webhook (Slack, Discord, Teams)?'
      );

      if (useWebhook) {
        console.log('\n📝 Pour obtenir une URL webhook :');
        console.log('   Slack: https://api.slack.com/messaging/webhooks');
        console.log('   Discord: Paramètres serveur → Intégrations → Webhooks');
        console.log('   Teams: Connecteur Incoming Webhook\n');

        const webhookUrl = await this.question('URL du webhook : ');
        if (webhookUrl) {
          this.config.notifications.webhook.enabled = true;
          this.config.notifications.webhook.url = webhookUrl;
          console.log('✅ Webhook configuré!\n');
        }
      }
    }
  }

  private async configureStatistics(): Promise<void> {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 Étape 5/5 : Configuration des Statistiques');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    this.config.statistics.enabled = await this.confirm(
      'Activer les statistiques?'
    );

    if (this.config.statistics.enabled) {
      this.config.export.enabled = true;

      const format = await this.question(
        'Format d\'export (json/csv) [json] : '
      );
      if (format) this.config.export.format = format;

      const includeAttachments = await this.confirm(
        'Télécharger les pièces jointes?'
      );
      this.config.export.includeAttachments = includeAttachments;

      console.log('\n✅ Statistiques activées!\n');
    }
  }

  private async saveConfig(): Promise<void> {
    console.log('\n💾 Sauvegarde de la configuration...\n');

    // Créer le répertoire logs si nécessaire
    const logsDir = path.join(process.cwd(), 'logs', 'emails');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const statsDir = path.join(process.cwd(), 'logs', 'stats');
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir, { recursive: true });
    }

    // Sauvegarder la config
    fs.writeFileSync(
      CONFIG_PATH,
      JSON.stringify(this.config, null, 2),
      'utf-8'
    );

    console.log(`✅ Configuration sauvegardée : ${CONFIG_PATH}\n`);

    // Afficher un résumé
    console.log('📋 Résumé de la configuration :');
    console.log(`   Intervalle : ${this.config.monitoring.intervalSeconds}s`);
    console.log(`   Notifications : ${this.config.notifications.enabled ? 'Activées' : 'Désactivées'}`);
    console.log(`   Statistiques : ${this.config.statistics.enabled ? 'Activées' : 'Désactivées'}`);
    console.log(`   Filtres actifs : ${Object.keys(this.config.filters).filter(k => this.config.filters[k].enabled).length}`);
    if (this.config.notifications.webhook.enabled) {
      console.log(`   Webhook : Configuré`);
    }
  }
}

// Démarrage
async function main() {
  const wizard = new EmailSetupWizard();
  await wizard.run();
}

main().catch(console.error);
