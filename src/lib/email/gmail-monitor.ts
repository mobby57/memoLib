import { google } from 'googleapis';
import { emailMonitor } from './email-monitor-service';
import { prisma } from '@/lib/prisma';

export class GmailMonitor {
  private gmail: any;
  private oauth2Client: any;

  async initialize() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );

    this.oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN
    });

    this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  // Récupérer les nouveaux emails
  async fetchNewEmails(tenantId: string, lastCheckTime?: Date) {
    const query = lastCheckTime 
      ? `after:${Math.floor(lastCheckTime.getTime() / 1000)}`
      : 'is:unread';

    const response = await this.gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    });

    const messages = response.data.messages || [];
    const results = [];

    for (const message of messages) {
      const result = await this.processMessage(tenantId, message.id);
      results.push(result);
    }

    return results;
  }

  private async processMessage(tenantId: string, messageId: string) {
    const msg = await this.gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'raw'
    });

    const rawEmail = Buffer.from(msg.data.raw, 'base64').toString('utf-8');
    
    // Traiter avec le service email
    const result = await emailMonitor.processEmail(tenantId, rawEmail);

    // Marquer comme lu
    await this.gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });

    return result;
  }

  // Monitoring continu (polling toutes les 30s)
  async startMonitoring(tenantId: string) {
    console.log(`📧 Monitoring Gmail pour tenant ${tenantId}...`);
    
    let lastCheck = new Date();

    setInterval(async () => {
      try {
        const results = await this.fetchNewEmails(tenantId, lastCheck);
        
        if (results.length > 0) {
          console.log(`✅ ${results.length} nouveaux emails traités`);
          results.forEach(r => {
            console.log(`  - ${r.action}: ${r.classification?.typeDossier}`);
          });
        }
        
        lastCheck = new Date();
      } catch (error) {
        console.error('Erreur monitoring:', error);
      }
    }, 30000); // 30 secondes
  }
}

export const gmailMonitor = new GmailMonitor();
