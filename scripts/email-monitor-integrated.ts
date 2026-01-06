import { EmailPrismaService } from '../src/lib/email/prisma-service';
import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import * as fs from 'fs';
import * as path from 'path';
import { OAuth2Client } from 'google-auth-library';

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

class IntegratedEmailMonitor {
  private gmail: any = null;
  private auth: OAuth2Client | null = null;
  private emailService: EmailPrismaService;
  private tenantId: string | undefined;

  constructor() {
    console.log('🚀 Initialisation moniteur email intégré...\n');
    this.emailService = new EmailPrismaService();
    this.tenantId = process.env.DEFAULT_TENANT_ID;
  }

  private async loadSavedCredentials(): Promise<OAuth2Client | null> {
    try {
      if (!fs.existsSync(TOKEN_PATH)) return null;
      const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
      const credentials = JSON.parse(content);
      const auth = google.auth.fromJSON(credentials);
      // Type guard: check if it's an OAuth2Client
      if (auth && 'credentials' in auth && 'getAccessToken' in auth) {
        return auth as OAuth2Client;
      }
      return null;
    } catch (err) {
      return null;
    }
  }

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

  async connect(): Promise<void> {
    console.log('🔐 Authentification Gmail API...\n');

    this.auth = await this.loadSavedCredentials();

    if (!this.auth) {
      this.auth = await authenticate({
        scopes: SCOPES,
        keyfilePath: CREDENTIALS_PATH,
      });

      if (this.auth.credentials) {
        await this.saveCredentials(this.auth);
      }
    }

    this.gmail = google.gmail({ version: 'v1', auth: this.auth });
    
    // Connecter le service Prisma
    await this.emailService.connect();
    
    console.log('✅ Authentifié avec succès!\n');
  }

  async startMonitoring(): Promise<void> {
    if (!this.gmail) {
      await this.connect();
    }

    console.log('📬 Accès à la boîte de réception...\n');
    await this.showAccountInfo();

    console.log('👀 SURVEILLANCE ACTIVE - Vérification toutes les 30 secondes');
    console.log('   (Appuyez sur Ctrl+C pour arrêter)\n');

    // Traiter emails existants
    await this.processNewEmails();

    // Polling continu
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
      const to = headers.find((h: any) => h.name === 'To')?.value || 'Inconnu';
      const dateStr = headers.find((h: any) => h.name === 'Date')?.value || new Date().toISOString();
      const receivedDate = new Date(dateStr);

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📧 Email ID: ${messageId.substring(0, 12)}...`);
      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`📤 De: ${from}`);
      console.log(`📋 Sujet: ${subject}`);
      console.log(`📅 Date: ${dateStr}`);

      // Extraire le corps
      const bodyText = this.extractBody(message.data.payload);
      const preview = bodyText.substring(0, 100).replace(/\n/g, ' ');
      console.log(`📝 Aperçu: ${preview}...`);

      // Pièces jointes
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
      const classification = this.classifyEmail({
        subject,
        from: { text: from },
        text: bodyText
      });

      console.log(`🏷️  Type: ${classification.type}`);
      console.log(`⚡ Priorité: ${classification.priority}`);
      console.log(`📊 Confiance: ${(classification.confidence * 100).toFixed(0)}%`);
      console.log(`🏷️  Tags: ${classification.tags.join(', ')}`);
      if (classification.suggestedAction) {
        console.log(`💡 Action suggérée: ${classification.suggestedAction}`);
      }

      // 💾 SAUVEGARDER DANS PRISMA
      await this.emailService.saveEmail({
        messageId,
        threadId: message.data.threadId,
        from,
        to,
        subject,
        bodyText,
        receivedDate,
        classification,
        attachments: attachments.map((a: any) => ({
          filename: a.filename,
          size: a.body.size || 0,
          mimeType: a.mimeType
        })),
        tenantId: this.tenantId
      });

      console.log(`💾 Sauvegardé dans la base de données`);

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

  private classifyEmail(email: any): any {
    const subject = (email.subject || '').toLowerCase();
    const from = (typeof email.from === 'string' ? email.from : email.from?.text || '').toLowerCase();
    const text = (email.text || '').toLowerCase();
    const fullContent = `${subject} ${from} ${text}`;

    let type: any = 'general';
    let priority: any = 'medium';
    let confidence = 0.5;
    const tags: string[] = [];

    // CESEDA (priorité maximale)
    const cesedaKeywords = ['ceseda', 'titre de séjour', 'carte de resident', 'ofpra', 'oqtf', 'préfecture', 'asile', 'réfugié'];
    const cesedaScore = cesedaKeywords.filter(k => fullContent.includes(k)).length;
    if (cesedaScore >= 2) {
      type = 'ceseda';
      priority = 'critical';
      confidence = Math.min(0.7 + (cesedaScore * 0.1), 0.95);
      tags.push('CESEDA', 'Droit des étrangers');
      return { type, priority, confidence, tags, suggestedAction: 'Traiter en urgence - Délais CESEDA critiques' };
    }

    // NOUVEAU CLIENT
    const newClientKeywords = ['premier contact', 'nouveau dossier', 'besoin avocat', 'consultation', 'rendez-vous'];
    const newClientScore = newClientKeywords.filter(k => fullContent.includes(k)).length;
    if (newClientScore >= 2 || (subject.includes('demande') && (text.includes('avocat') || text.includes('aide juridique')))) {
      type = 'nouveau_client';
      priority = 'high';
      confidence = Math.min(0.6 + (newClientScore * 0.15), 0.9);
      tags.push('Nouveau client', 'Premier contact');
      return { type, priority, confidence, tags, suggestedAction: 'Créer dossier et programmer consultation' };
    }

    // RÉPONSE CLIENT
    const responseKeywords = ['re:', 'réponse', 'suite à', 'comme convenu', 'ci-joint'];
    const responseScore = responseKeywords.filter(k => fullContent.includes(k)).length;
    if (responseScore >= 1 && !from.includes('noreply') && !from.includes('no-reply')) {
      type = 'reponse_client';
      priority = 'high';
      confidence = Math.min(0.55 + (responseScore * 0.15), 0.85);
      tags.push('Réponse client', 'Suivi dossier');
      return { type, priority, confidence, tags, suggestedAction: 'Mettre à jour le dossier client' };
    }

    // LA POSTE
    if (from.includes('laposte') || from.includes('colissimo') || subject.includes('suivi') || 
        subject.includes('colis') || text.includes('numéro de suivi') || text.includes('lettre recommandée')) {
      type = 'laposte_notification';
      priority = 'high';
      confidence = 0.9;
      tags.push('La Poste', 'Suivi courrier');
      return { type, priority, confidence, tags, suggestedAction: 'Extraire numéro de suivi et associer au dossier' };
    }

    // URGENT
    const urgentKeywords = ['urgent', 'important', 'immédiat', 'expulsion', 'délai', 'deadline', '!!', '!!!'];
    const urgentScore = urgentKeywords.filter(k => fullContent.includes(k)).length;
    if (urgentScore >= 2) {
      type = 'urgent';
      priority = 'critical';
      confidence = Math.min(0.65 + (urgentScore * 0.1), 0.85);
      tags.push('Urgent', 'Prioritaire');
      return { type, priority, confidence, tags, suggestedAction: 'Notifier avocat immédiatement' };
    }

    // SPAM
    const spamKeywords = ['viagra', 'casino', 'lottery', 'prize', 'click here', 'unsubscribe', 'marketing'];
    const spamScore = spamKeywords.filter(k => fullContent.includes(k)).length;
    if (spamScore >= 2 || from.includes('noreply') || from.includes('newsletter')) {
      type = 'spam';
      priority = 'low';
      confidence = Math.min(0.7 + (spamScore * 0.1), 0.95);
      tags.push('Spam', 'À ignorer');
      return { type, priority, confidence, tags, suggestedAction: 'Marquer comme spam et archiver' };
    }

    return { type, priority, confidence, tags: tags.length > 0 ? tags : ['Non classifié'], suggestedAction: 'Révision manuelle nécessaire' };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Lancement
const monitor = new IntegratedEmailMonitor();

monitor.connect().then(() => {
  monitor.startMonitoring();
}).catch((err) => {
  console.error('❌ Erreur fatale:', err);
  process.exit(1);
});

// Gestion arrêt propre
process.on('SIGINT', async () => {
  console.log('\n\n📪 Arrêt du monitoring...');
  console.log('📪 Arrêt du monitoring');
  console.log('✅ Arrêté proprement\n');
  process.exit(0);
});
