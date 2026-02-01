import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import { simpleParser, ParsedMail } from 'mailparser';
import * as fs from 'fs';
import * as path from 'path';
import { OAuth2Client } from 'google-auth-library';

// Chemins pour les credentials
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

class EmailMonitor {
  private gmail: any = null;
  private auth: OAuth2Client | null = null;

  constructor() {
    console.log('🚀 Initialisation du moniteur email...\n');
  }

  /**
   * Charge les credentials sauvegardés s'ils existent
   */
  private async loadSavedCredentials(): Promise<OAuth2Client | null> {
    try {
      if (!fs.existsSync(TOKEN_PATH)) {
        return null;
      }

      const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      
      return google.auth.fromJSON(credentials) as any as OAuth2Client;
    } catch (err) {
      return null;
    }
  }

  /**
   * Sauvegarde les credentials pour une utilisation future
   */
  private async saveCredentials(client: OAuth2Client): Promise<void> {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const keys = JSON.parse(content);
    const key = keys.installed || keys.web;
    
    const payload = JSON.stringify({
      type: 'authorized_user',
      client_id: key.client_id,
      client_secret: key.client_secret,
      refresh_token: client.credentials.refresh_token,
    });
    
    fs.writeFileSync(TOKEN_PATH, payload);
  }

  /**
   * Authentification avec Gmail API
   */
  async connect(): Promise<void> {
    try {
      console.log('🔐 Authentification Gmail API...\n');

      // Vérifier que credentials.json existe
      if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('❌ ERREUR: Le fichier credentials.json est manquant!\n');
        console.log('📝 Instructions pour configurer Gmail API:');
        console.log('1. Aller sur https://console.cloud.google.com/');
        console.log('2. Créer un nouveau projet ou sélectionner un projet existant');
        console.log('3. Activer Gmail API pour ce projet');
        console.log('4. Créer des credentials OAuth 2.0 (Application de bureau)');
        console.log('5. Télécharger le fichier JSON et le renommer en credentials.json');
        console.log('6. Placer credentials.json à la racine du projet\n');
        process.exit(1);
      }

      // Charger les credentials sauvegardés ou authentifier
      let client = await this.loadSavedCredentials();
      
      if (!client) {
        console.log('🌐 Première connexion - authentification OAuth requise...');
        console.log('   (Une fenêtre de navigateur va s\'ouvrir)\n');
        
        client = await authenticate({
          scopes: SCOPES,
          keyfilePath: CREDENTIALS_PATH,
        });
        
        if (client.credentials) {
          await this.saveCredentials(client);
        }
      }

      this.auth = client;
      this.gmail = google.gmail({ version: 'v1', auth: client as any });
      
      console.log('✅ Authentifié avec succès!\n');
    } catch (err: any) {
      console.error('❌ Erreur d\'authentification:', err.message);
      throw err;
    }
  }

  async startMonitoring(): Promise<void> {
    if (!this.gmail) {
      await this.connect();
    }

    console.log('📬 Accès à la boîte de réception...\n');

    // Afficher les infos du compte
    await this.showAccountInfo();

    console.log('👀 SURVEILLANCE ACTIVE - Vérification toutes les 30 secondes');
    console.log('   (Appuyez sur Ctrl+C pour arrêter)\n');

    // Traiter les emails non lus existants
    await this.processNewEmails();

    // Polling toutes les 30 secondes
    setInterval(async () => {
      await this.processNewEmails();
    }, 30000);
  }

  private async showAccountInfo(): Promise<void> {
    try {
      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      console.log(`📧 Compte: ${profile.data.emailAddress}`);
      console.log(`📊 Messages totaux: ${profile.data.messagesTotal}`);
      console.log(`📬 Threads totaux: ${profile.data.threadsTotal}\n`);
    } catch (err: any) {
      console.error('⚠️ Impossible de récupérer les infos du compte:', err.message);
    }
  }

  private async processNewEmails(): Promise<void> {
    try {
      // Rechercher les emails non lus
      const response = await this.gmail.users.messages.list({
        userId: 'me',
        q: 'is:unread',
        maxResults: 10,
      });

      const messages = response.data.messages;

      if (!messages || messages.length === 0) {
        console.log(`[${new Date().toLocaleTimeString()}] 📭 Aucun email non lu`);
        return;
      }

      console.log(`\n🔔 ${messages.length} email(s) non lu(s) trouvé(s)!\n`);

      for (const message of messages) {
        await this.processEmailById(message.id!);
      }

      console.log(`\n[${new Date().toLocaleTimeString()}] ✅ Traitement terminé\n`);
    } catch (err: any) {
      console.error('❌ Erreur lors de la recherche:', err.message);
    }
  }

  private async processEmailById(messageId: string): Promise<void> {
    try {
      const message = await this.gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      const headers = message.data.payload.headers;
      const subject = headers.find((h: any) => h.name === 'Subject')?.value || '(pas de sujet)';
      const from = headers.find((h: any) => h.name === 'From')?.value || 'Inconnu';
      const date = headers.find((h: any) => h.name === 'Date')?.value || 'Inconnue';

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📧 Email ID: ${messageId.substring(0, 12)}...`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📤 De: ${from}`);
      console.log(`📋 Sujet: ${subject}`);
      console.log(`📅 Date: ${date}`);

      // Extraire le corps du message
      const body = this.extractBody(message.data.payload);
      const preview = body.substring(0, 100).replace(/\n/g, ' ');
      console.log(`📝 Aperçu: ${preview}...`);

      // Vérifier les pièces jointes
      const parts = this.getAllParts(message.data.payload);
      const attachments = parts.filter((part: any) => part.filename && part.filename.length > 0);
      
      if (attachments.length > 0) {
        console.log(`📎 Pièces jointes: ${attachments.length}`);
        attachments.forEach((att: any, i: number) => {
          const size = att.body.size || 0;
          console.log(`   ${i + 1}. ${att.filename} (${this.formatBytes(size)})`);
        });
      }

      // Classification
      const emailData: ParsedMail = {
        subject,
        from: { text: from } as any,
        date: new Date(date),
        text: body,
        attachments: attachments.map((a: any) => ({
          filename: a.filename,
          size: a.body.size || 0
        })) as any
      };

      const classification = this.classifyEmail(emailData);
      console.log(`🏷️  Type: ${classification.type}`);
      console.log(`⚡ Priorité: ${classification.priority}`);
      console.log(`📊 Confiance: ${(classification.confidence * 100).toFixed(0)}%`);
      console.log(`🏷️  Tags: ${classification.tags.join(', ')}`);
      if (classification.suggestedAction) {
        console.log(`💡 Action suggérée: ${classification.suggestedAction}`);
      }

      // Sauvegarder
      this.saveEmailForAnalysis(emailData, classification);

    } catch (err: any) {
      console.error(`❌ Erreur traitement email ${messageId}:`, err.message);
    }
  }

  private extractBody(payload: any): string {
    let body = '';

    if (payload.body?.data) {
      body = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    } else if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body = Buffer.from(part.body.data, 'base64').toString('utf-8');
          break;
        }
      }
      
      // Si pas de text/plain, chercher text/html
      if (!body) {
        for (const part of payload.parts) {
          if (part.mimeType === 'text/html' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
        }
      }
    }

    return body;
  }

  private getAllParts(payload: any, parts: any[] = []): any[] {
    if (payload.parts) {
      for (const part of payload.parts) {
        parts.push(part);
        if (part.parts) {
          this.getAllParts(part, parts);
        }
      }
    }
    return parts;
  }

  private classifyEmail(email: ParsedMail | any): { 
    type: 'nouveau_client' | 'reponse_client' | 'laposte_notification' | 'ceseda' | 'urgent' | 'spam' | 'general';
    priority: 'critical' | 'high' | 'medium' | 'low';
    confidence: number;
    tags: string[];
    suggestedAction?: string;
  } {
    const subject = (email.subject || '').toLowerCase();
    const from = (typeof email.from === 'string' ? email.from : email.from?.text || '').toLowerCase();
    const text = (email.text || '').toLowerCase();
    const fullContent = `${subject} ${from} ${text}`;

    let type: any = 'general';
    let priority: any = 'medium';
    let confidence = 0.5;
    const tags: string[] = [];

    // === DÉTECTION CESEDA (Priorité maximale) ===
    const cesedaKeywords = ['ceseda', 'titre de séjour', 'carte de resident', 'ofpra', 'oqtf', 'préfecture', 'asile', 'réfugié'];
    const cesedaScore = cesedaKeywords.filter(k => fullContent.includes(k)).length;
    if (cesedaScore >= 2) {
      type = 'ceseda';
      priority = 'critical';
      confidence = Math.min(0.7 + (cesedaScore * 0.1), 0.95);
      tags.push('CESEDA', 'Droit des étrangers');
      return { type, priority, confidence, tags, suggestedAction: 'Traiter en urgence - Délais CESEDA critiques' };
    }

    // === DÉTECTION NOUVEAU CLIENT (Haute priorité) ===
    const newClientKeywords = ['premier contact', 'nouveau dossier', 'besoin avocat', 'consultation', 'rendez-vous'];
    const newClientScore = newClientKeywords.filter(k => fullContent.includes(k)).length;
    if (newClientScore >= 2 || 
        (subject.includes('demande') && (text.includes('avocat') || text.includes('aide juridique')))) {
      type = 'nouveau_client';
      priority = 'high';
      confidence = Math.min(0.6 + (newClientScore * 0.15), 0.9);
      tags.push('Nouveau client', 'Premier contact');
      return { type, priority, confidence, tags, suggestedAction: 'Créer dossier et programmer consultation' };
    }

    // === DÉTECTION RÉPONSE CLIENT ===
    const responseKeywords = ['re:', 'réponse', 'suite à', 'comme convenu', 'ci-joint'];
    const responseScore = responseKeywords.filter(k => fullContent.includes(k)).length;
    if (responseScore >= 1 && !from.includes('noreply') && !from.includes('no-reply')) {
      type = 'reponse_client';
      priority = 'high';
      confidence = Math.min(0.55 + (responseScore * 0.15), 0.85);
      tags.push('Réponse client', 'Suivi dossier');
      return { type, priority, confidence, tags, suggestedAction: 'Mettre à jour le dossier client' };
    }

    // === DÉTECTION LA POSTE ===
    if (from.includes('laposte') || from.includes('colissimo') || 
        subject.includes('suivi') || subject.includes('colis') ||
        text.includes('numéro de suivi') || text.includes('lettre recommandée')) {
      type = 'laposte_notification';
      priority = 'high';
      confidence = 0.9;
      tags.push('La Poste', 'Suivi courrier');
      return { type, priority, confidence, tags, suggestedAction: 'Extraire numéro de suivi et associer au dossier' };
    }

    // === DÉTECTION URGENT ===
    const urgentKeywords = ['urgent', 'important', 'immédiat', 'expulsion', 'délai', 'deadline', '!!', '!!!'];
    const urgentScore = urgentKeywords.filter(k => fullContent.includes(k)).length;
    if (urgentScore >= 2) {
      type = 'urgent';
      priority = 'critical';
      confidence = Math.min(0.65 + (urgentScore * 0.1), 0.85);
      tags.push('Urgent', 'Prioritaire');
      return { type, priority, confidence, tags, suggestedAction: 'Notifier avocat immédiatement' };
    }

    // === DÉTECTION SPAM ===
    const spamKeywords = ['viagra', 'casino', 'lottery', 'prize', 'click here', 'unsubscribe', 'marketing'];
    const spamScore = spamKeywords.filter(k => fullContent.includes(k)).length;
    if (spamScore >= 2 || from.includes('noreply') || from.includes('newsletter')) {
      type = 'spam';
      priority = 'low';
      confidence = Math.min(0.7 + (spamScore * 0.1), 0.95);
      tags.push('Spam', 'À ignorer');
      return { type, priority, confidence, tags, suggestedAction: 'Marquer comme spam et archiver' };
    }

    // === PAR DÉFAUT ===
    return { 
      type, 
      priority, 
      confidence, 
      tags: tags.length > 0 ? tags : ['Non classifié'], 
      suggestedAction: 'Révision manuelle nécessaire' 
    };
  }

  private saveEmailForAnalysis(email: ParsedMail | any, classification: any): void {
    const logsDir = path.join(process.cwd(), 'logs', 'emails');
    
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `email_${timestamp}.json`;
    const filepath = path.join(logsDir, filename);

    const data = {
      timestamp: new Date().toISOString(),
      from: typeof email.from === 'string' ? email.from : email.from?.text,
      to: typeof email.to === 'string' ? email.to : email.to?.text,
      subject: email.subject,
      date: email.date,
      classification,
      hasAttachments: (email.attachments?.length || 0) > 0,
      attachmentCount: email.attachments?.length || 0,
      preview: email.text?.substring(0, 200)
    };

    try {
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      console.log(`💾 Sauvegardé: logs/emails/${filename}`);
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error.message);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async disconnect(): Promise<void> {
    console.log('📪 Arrêt du monitoring');
  }
}

// Démarrage
async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   📧 IA POSTE MANAGER - Email Monitor   ║');
  console.log('╚══════════════════════════════════════════╝\n');

  const monitor = new EmailMonitor();

  try {
    await monitor.startMonitoring();
  } catch (error: any) {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  }

  // Gestion arrêt propre
  process.on('SIGINT', async () => {
    console.log('\n\n📪 Arrêt du monitoring...');
    await monitor.disconnect();
    console.log('✅ Arrêté proprement\n');
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    await monitor.disconnect();
    process.exit(0);
  });
}

main();
