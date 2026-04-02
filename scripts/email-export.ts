import * as fs from 'fs';
import * as path from 'path';

interface ExportOptions {
  format: 'json' | 'csv' | 'txt';
  days?: number;
  outputPath?: string;
}

class EmailExporter {
  private logsDir = path.join(process.cwd(), 'logs', 'emails');

  async export(options: ExportOptions = { format: 'json' }): Promise<void> {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   💾 Export Email Monitor               ║');
    console.log('╚══════════════════════════════════════════╝\n');

    if (!fs.existsSync(this.logsDir)) {
      console.log('❌ Aucun email trouvé dans logs/emails/\n');
      return;
    }

    const files = fs.readdirSync(this.logsDir)
      .filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      console.log('📭 Aucun email à exporter\n');
      return;
    }

    // Filtrer par date si nécessaire
    let filteredFiles = files;
    if (options.days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - options.days);
      
      filteredFiles = files.filter(file => {
        const filepath = path.join(this.logsDir, file);
        const stats = fs.statSync(filepath);
        return stats.mtime >= cutoffDate;
      });
    }

    console.log(`📧 Export de ${filteredFiles.length} email(s) au format ${options.format.toUpperCase()}...\n`);

    // Lire tous les emails
    const emails = [];
    for (const file of filteredFiles) {
      const filepath = path.join(this.logsDir, file);
      try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
        emails.push(data);
      } catch (error) {
        console.error(`⚠️  Erreur lecture ${file}`);
      }
    }

    // Exporter selon le format
    let outputContent = '';
    let extension = '';

    switch (options.format) {
      case 'json':
        outputContent = JSON.stringify(emails, null, 2);
        extension = 'json';
        break;
      
      case 'csv':
        outputContent = this.toCSV(emails);
        extension = 'csv';
        break;
      
      case 'txt':
        outputContent = this.toText(emails);
        extension = 'txt';
        break;
    }

    // Sauvegarder
    const exportsDir = path.join(process.cwd(), 'exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `emails_export_${timestamp}.${extension}`;
    const outputPath = options.outputPath || path.join(exportsDir, filename);

    fs.writeFileSync(outputPath, outputContent, 'utf-8');

    console.log(`✅ Export terminé!\n`);
    console.log(`📁 Fichier : ${outputPath}`);
    console.log(`📊 ${emails.length} email(s) exporté(s)\n`);
  }

  private toCSV(emails: any[]): string {
    const headers = ['Date', 'De', 'Sujet', 'Type', 'Priorité', 'Pièces jointes'];
    const rows = [headers.join(',')];

    for (const email of emails) {
      const row = [
        email.timestamp || '',
        this.escapeCSV(email.from || ''),
        this.escapeCSV(email.subject || ''),
        email.classification?.type || '',
        email.classification?.priority || '',
        email.attachmentCount || '0'
      ];
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  private toText(emails: any[]): string {
    const lines = [];
    
    lines.push('='.repeat(80));
    lines.push('EXPORT EMAIL MONITOR');
    lines.push('='.repeat(80));
    lines.push('');

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      
      lines.push(`Email #${i + 1}`);
      lines.push('-'.repeat(80));
      lines.push(`Date       : ${email.timestamp || 'N/A'}`);
      lines.push(`De         : ${email.from || 'N/A'}`);
      lines.push(`Sujet      : ${email.subject || '(pas de sujet)'}`);
      lines.push(`Type       : ${email.classification?.type || 'N/A'}`);
      lines.push(`Priorité   : ${email.classification?.priority || 'N/A'}`);
      lines.push(`Pièces j.  : ${email.attachmentCount || 0}`);
      
      if (email.preview) {
        lines.push(`Aperçu     : ${email.preview.substring(0, 100)}...`);
      }
      
      lines.push('');
    }

    lines.push('='.repeat(80));
    lines.push(`Total: ${emails.length} email(s)`);
    lines.push('='.repeat(80));

    return lines.join('\n');
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

// Démarrage
async function main() {
  const args = process.argv.slice(2);
  
  const options: ExportOptions = {
    format: 'json'
  };

  // Parser les arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--format' && args[i + 1]) {
      options.format = args[i + 1] as 'json' | 'csv' | 'txt';
      i++;
    } else if (args[i] === '--days' && args[i + 1]) {
      options.days = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--output' && args[i + 1]) {
      options.outputPath = args[i + 1];
      i++;
    }
  }

  const exporter = new EmailExporter();
  await exporter.export(options);
}

main().catch(console.error);
