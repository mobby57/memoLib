import * as fs from 'fs';
import * as path from 'path';

interface EmailData {
  timestamp: string;
  from: string;
  subject: string;
  classification: {
    type: string;
    priority: string;
  };
  hasAttachments: boolean;
  attachmentCount: number;
}

interface Stats {
  total: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  bySender: Record<string, number>;
  withAttachments: number;
  totalAttachments: number;
  perDay: Record<string, number>;
  perHour: Record<string, number>;
}

class EmailStats {
  private logsDir = path.join(process.cwd(), 'logs', 'emails');

  async generateStats(): Promise<void> {
    console.log('╔══════════════════════════════════════════╗');
    console.log('║   📊 Statistiques Email Monitor         ║');
    console.log('╚══════════════════════════════════════════╝\n');

    if (!fs.existsSync(this.logsDir)) {
      console.log('❌ Aucun email trouvé dans logs/emails/\n');
      console.log('💡 Lancez d\'abord le monitoring : npm run email:monitor\n');
      return;
    }

    const files = fs.readdirSync(this.logsDir)
      .filter(f => f.endsWith('.json'));

    if (files.length === 0) {
      console.log('📭 Aucun email enregistré pour le moment\n');
      return;
    }

    console.log(`📧 Analyse de ${files.length} email(s)...\n`);

    const stats: Stats = {
      total: files.length,
      byPriority: {},
      byType: {},
      bySender: {},
      withAttachments: 0,
      totalAttachments: 0,
      perDay: {},
      perHour: {}
    };

    // Analyser chaque fichier
    for (const file of files) {
      const filepath = path.join(this.logsDir, file);
      try {
        const data: EmailData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));

        // Compter par priorité
        const priority = data.classification.priority || 'unknown';
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;

        // Compter par type
        const type = data.classification.type || 'unknown';
        stats.byType[type] = (stats.byType[type] || 0) + 1;

        // Compter par expéditeur
        const sender = this.extractDomain(data.from);
        stats.bySender[sender] = (stats.bySender[sender] || 0) + 1;

        // Pièces jointes
        if (data.hasAttachments) {
          stats.withAttachments++;
          stats.totalAttachments += data.attachmentCount || 0;
        }

        // Par jour
        const day = data.timestamp.split('T')[0];
        stats.perDay[day] = (stats.perDay[day] || 0) + 1;

        // Par heure
        const hour = new Date(data.timestamp).getHours();
        stats.perHour[hour] = (stats.perHour[hour] || 0) + 1;

      } catch (error) {
        console.error(`⚠️  Erreur lecture ${file}`);
      }
    }

    // Afficher les statistiques
    this.displayStats(stats);

    // Sauvegarder
    this.saveStats(stats);
  }

  private extractDomain(email: string): string {
    if (!email) return 'unknown';
    const match = email.match(/@([^\s>]+)/);
    return match ? match[1] : email;
  }

  private displayStats(stats: Stats): void {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 RÉSUMÉ GÉNÉRAL');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log(`   Total d'emails : ${stats.total}`);
    console.log(`   Avec pièces jointes : ${stats.withAttachments}`);
    console.log(`   Total pièces jointes : ${stats.totalAttachments}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚡ PAR PRIORITÉ');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const sortedPriority = Object.entries(stats.byPriority)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [priority, count] of sortedPriority) {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      const icon = this.getPriorityIcon(priority);
      console.log(`   ${icon} ${priority.padEnd(10)} : ${count.toString().padStart(3)} (${percentage}%)`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏷️  PAR TYPE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const sortedType = Object.entries(stats.byType)
      .sort((a, b) => b[1] - a[1]);
    
    for (const [type, count] of sortedType) {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`   ${type.padEnd(20)} : ${count.toString().padStart(3)} (${percentage}%)`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📤 TOP 10 EXPÉDITEURS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const topSenders = Object.entries(stats.bySender)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [sender, count] of topSenders) {
      console.log(`   ${sender.padEnd(30)} : ${count}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📅 PAR JOUR');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    const sortedDays = Object.entries(stats.perDay)
      .sort((a, b) => a[0].localeCompare(b[0]));
    
    for (const [day, count] of sortedDays) {
      const bar = '█'.repeat(Math.min(count, 50));
      console.log(`   ${day} : ${count.toString().padStart(3)} ${bar}`);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🕐 PAR HEURE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    for (let hour = 0; hour < 24; hour++) {
      const count = stats.perHour[hour] || 0;
      if (count > 0) {
        const bar = '█'.repeat(Math.min(count, 50));
        const hourStr = `${hour.toString().padStart(2, '0')}h`;
        console.log(`   ${hourStr} : ${count.toString().padStart(3)} ${bar}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  }

  private getPriorityIcon(priority: string): string {
    const icons: Record<string, string> = {
      'urgent': '🔴',
      'high': '🟠',
      'medium': '🟡',
      'low': '🟢',
      'unknown': '⚪'
    };
    return icons[priority] || '⚪';
  }

  private saveStats(stats: Stats): void {
    const statsDir = path.join(process.cwd(), 'logs', 'stats');
    if (!fs.existsSync(statsDir)) {
      fs.mkdirSync(statsDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const filename = `stats_${timestamp}.json`;
    const filepath = path.join(statsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(stats, null, 2));
    console.log(`💾 Statistiques sauvegardées : logs/stats/${filename}\n`);
  }
}

// Démarrage
async function main() {
  const stats = new EmailStats();
  await stats.generateStats();
}

main().catch(console.error);
