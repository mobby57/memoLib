import { google } from 'googleapis';
import { authenticate } from '@google-cloud/local-auth';
import { simpleParser, ParsedMail } from 'mailparser';
import * as fs from 'fs';
import * as path from 'path';
import { OAuth2Client } from 'google-auth-library';

const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

export const emailConfig = {
  labels: {
    inbox: 'INBOX',
    processed: 'Traité',
    clients: 'Clients',
    laPoste: 'LaPoste',
    urgent: 'Urgent',
    spam: 'SPAM'
  },

  autoClassify: process.env.EMAIL_AUTO_CLASSIFY === 'true',
  aiConfidenceThreshold: 0.75,
  attachmentMaxSize: 10 * 1024 * 1024, // 10MB
};

export interface EmailClassification {
  type: 'nouveau_client' | 'reponse_client' | 'laposte_notification' | 'urgent' | 'spam' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  confidence: number;
  clientInfo?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  laposteInfo?: {
    trackingNumber?: string;
    status?: string;
  };
  summary: string;
  suggestedActions: string[];
}

export class EmailService {
  private gmail: any = null;
  private auth: OAuth2Client | null = null;
  private isConnected = false;
  private onEmailCallback?: (email: ParsedMail, classification: EmailClassification) => Promise<void>;
  private monitoringInterval?: NodeJS.Timeout;

  constructor() {
    // Gmail API will be initialized on connect
  }

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
    try {
      if (!fs.existsSync(CREDENTIALS_PATH)) {
        throw new Error('credentials.json not found. Please follow setup instructions.');
      }

      let client = await this.loadSavedCredentials();
      
      if (!client) {
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
      this.isConnected = true;
    } catch (err: any) {
      throw new Error(`Gmail authentication failed: ${err.message}`);
    }
  }

  onNewEmail(callback: (email: ParsedMail, classification: EmailClassification) => Promise<void>) {
    this.onEmailCallback = callback;
  }

  async startMonitoring(): Promise<void> {
    if (!this.isConnected) {
      await this.connect();
    }

    console.log('📬 Email monitoring active (Gmail API)');

    // Initial check
    await this.processNewEmails();

    // Check for new emails every 30 seconds
    this.monitoringInterval = setInterval(async () => {
      await this.processNewEmails();
    }, 30000);
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
        return;
      }

      for (const message of messages) {
        try {
          const msg = await this.gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'raw',
          });

          if (msg.data.raw) {
            const buffer = Buffer.from(msg.data.raw, 'base64');
            const parsed = await simpleParser(buffer);
            const classification = this.classifyEmail(parsed);
            
            if (this.onEmailCallback) {
              await this.onEmailCallback(parsed, classification);
            }
          }
        } catch (err) {
          console.error(`Error processing message ${message.id}:`, err);
        }
      }
    } catch (err) {
      console.error('Error fetching emails:', err);
    }
  }

  private classifyEmail(email: ParsedMail): EmailClassification {
    const subject = (email.subject || '').toLowerCase();
    const from = (email.from?.text || '').toLowerCase();
    const text = (email.text || '').toLowerCase();

    let type: EmailClassification['type'] = 'general';
    let priority: EmailClassification['priority'] = 'medium';
    let confidence = 70;

    // Détection La Poste
    if (from.includes('laposte') || from.includes('colissimo') || 
        subject.includes('suivi') || subject.includes('colis')) {
      type = 'laposte_notification';
      priority = 'high';
      confidence = 90;
    }
    // Détection nouveau client
    else if (subject.includes('nouveau') || subject.includes('demande') ||
             subject.includes('réclamation')) {
      type = 'nouveau_client';
      priority = 'high';
      confidence = 85;
    }
    // Détection urgence
    else if (subject.includes('urgent') || subject.includes('important')) {
      type = 'urgent';
      priority = 'urgent';
      confidence = 95;
    }
    // Détection réponse client
    else if (subject.includes('re:') || subject.includes('fwd:')) {
      type = 'reponse_client';
      priority = 'medium';
      confidence = 80;
    }

    return {
      type,
      priority,
      confidence,
      summary: email.subject || '',
      suggestedActions: []
    };
  }

  disconnect(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    this.isConnected = false;
    console.log('📪 Email monitoring stopped');
  }
}
