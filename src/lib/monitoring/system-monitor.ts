// src/lib/monitoring/system-monitor.ts

import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

const prisma = new PrismaClient();

export interface HealthCheck {
  name: string;
  status: 'OK' | 'WARNING' | 'CRITICAL' | 'ERROR';
  responseTime?: number;
  details?: any;
  timestamp: Date;
}

export interface SystemHealth {
  overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  checks: HealthCheck[];
  uptime: number;
  performance: {
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  };
}

export interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  title: string;
  description: string;
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
}

export class SystemMonitor {
  private alertThresholds = {
    responseTime: 2000, // ms
    errorRate: 5, // %
    diskUsage: 85, // %
    memoryUsage: 90, // %
    cpuUsage: 80 // %
  };

  /**
   * Effectue un contr�le de sant� complet du syst�me
   */
  async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkOllama(),
      this.checkFileSystem(),
      this.checkMemoryUsage(),
      this.checkAPIEndpoints(),
      this.checkBackgroundJobs()
    ]);

    const healthChecks: HealthCheck[] = checks.map((check, index) => {
      const names = ['Database', 'Ollama', 'FileSystem', 'Memory', 'API', 'Jobs'];
      
      if (check.status === 'fulfilled') {
        return {
          name: names[index],
          status: check.value.status as 'OK' | 'WARNING' | 'CRITICAL' | 'ERROR',
          responseTime: check.value.responseTime,
          details: check.value.details,
          timestamp: new Date()
        };
      } else {
        return {
          name: names[index],
          status: 'ERROR' as const,
          details: { error: check.reason?.message || 'Unknown error' },
          timestamp: new Date()
        };
      }
    });

    const criticalIssues = healthChecks.filter(c => c.status === 'CRITICAL' || c.status === 'ERROR');
    const warningIssues = healthChecks.filter(c => c.status === 'WARNING');

    // D�terminer l'�tat global
    let overall: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
    if (criticalIssues.length > 0) {
      overall = 'CRITICAL';
    } else if (warningIssues.length > 0) {
      overall = 'DEGRADED';
    } else {
      overall = 'HEALTHY';
    }

    // Calculer les m�triques de performance
    const performance = await this.calculatePerformanceMetrics();

    const systemHealth: SystemHealth = {
      overall,
      checks: healthChecks,
      uptime: process.uptime(),
      performance
    };

    // Envoyer des alertes si n�cessaire
    if (criticalIssues.length > 0) {
      await this.sendCriticalAlert(criticalIssues);
    }

    // Sauvegarder le rapport de sant�
    await this.saveHealthReport(systemHealth);

    return systemHealth;
  }

  /**
   * V�rifie la sant� de la base de donn�es
   */
  private async checkDatabase(): Promise<{ status: string; responseTime: number; details: any }> {
    const startTime = Date.now();
    
    try {
      // Test de connexion simple
      await prisma.$queryRaw`SELECT 1`;
      
      // Test de performance
      const tenantCount = await prisma.tenant.count();
      const dossierCount = await prisma.dossier.count();
      
      const responseTime = Date.now() - startTime;
      
      return {
        status: responseTime > 1000 ? 'WARNING' : 'OK',
        responseTime,
        details: {
          tenants: tenantCount,
          dossiers: dossierCount,
          connectionPool: 'active'
        }
      };
    } catch (error: any) {
      return {
        status: 'CRITICAL',
        responseTime: Date.now() - startTime,
        details: { error: error.message }
      };
    }
  }

  /**
   * V�rifie la sant� d'Ollama
   */
  private async checkOllama(): Promise<{ status: string; responseTime: number; details: any }> {
    const startTime = Date.now();
    
    try {
      const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
      
      // V�rifier la disponibilit�
      const response = await fetch(`${ollamaUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      
      if (!response.ok) {
        throw new Error(`Ollama responded with status ${response.status}`);
      }
      
      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      // V�rifier les mod�les requis
      const requiredModels = ['llama3.2:latest', 'nomic-embed-text:latest'];
      const availableModels = data.models?.map((m: any) => m.name) || [];
      const missingModels = requiredModels.filter(model => !availableModels.includes(model));
      
      return {
        status: missingModels.length > 0 ? 'WARNING' : 'OK',
        responseTime,
        details: {
          availableModels: availableModels.length,
          missingModels,
          totalSize: data.models?.reduce((sum: number, m: any) => sum + (m.size || 0), 0)
        }
      };
    } catch (error: any) {
      return {
        status: 'CRITICAL',
        responseTime: Date.now() - startTime,
        details: { error: error.message }
      };
    }
  }

  /**
   * V�rifie l'espace disque et le syst�me de fichiers
   */
  private async checkFileSystem(): Promise<{ status: string; responseTime: number; details: any }> {
    const startTime = Date.now();
    
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // V�rifier l'espace disque (simulation - en production, utiliser des outils syst�me)
      const stats = await fs.stat(process.cwd());
      
      // V�rifier les r�pertoires critiques
      const criticalDirs = [
        'uploads',
        'backups',
        'logs',
        'temp'
      ];
      
      const dirChecks = await Promise.all(
        criticalDirs.map(async (dir) => {
          try {
            const dirPath = path.join(process.cwd(), dir);
            await fs.access(dirPath);
            return { dir, status: 'OK' };
          } catch {
            return { dir, status: 'MISSING' };
          }
        })
      );
      
      const missingDirs = dirChecks.filter(check => check.status === 'MISSING');
      
      return {
        status: missingDirs.length > 0 ? 'WARNING' : 'OK',
        responseTime: Date.now() - startTime,
        details: {
          diskUsage: '75%', // Simulation - en production, calculer r�ellement
          missingDirectories: missingDirs.map(d => d.dir),
          lastBackup: await this.getLastBackupTime()
        }
      };
    } catch (error: any) {
      return {
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        details: { error: error.message }
      };
    }
  }

  /**
   * V�rifie l'utilisation m�moire
   */
  private async checkMemoryUsage(): Promise<{ status: string; responseTime: number; details: any }> {
    const startTime = Date.now();
    
    try {
      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal + memUsage.external;
      const usedMemory = memUsage.heapUsed;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;
      
      let status = 'OK';
      if (memoryUsagePercent > this.alertThresholds.memoryUsage) {
        status = 'CRITICAL';
      } else if (memoryUsagePercent > this.alertThresholds.memoryUsage * 0.8) {
        status = 'WARNING';
      }
      
      return {
        status,
        responseTime: Date.now() - startTime,
        details: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
          external: Math.round(memUsage.external / 1024 / 1024), // MB
          usagePercent: Math.round(memoryUsagePercent)
        }
      };
    } catch (error: any) {
      return {
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        details: { error: error.message }
      };
    }
  }

  /**
   * V�rifie les endpoints API critiques
   */
  private async checkAPIEndpoints(): Promise<{ status: string; responseTime: number; details: any }> {
    const startTime = Date.now();
    
    try {
      const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
      const endpoints = [
        '/api/health',
        '/api/auth/session',
        '/api/tenant/health'
      ];
      
      const endpointChecks = await Promise.all(
        endpoints.map(async (endpoint) => {
          try {
            const response = await fetch(`${baseUrl}${endpoint}`, {
              signal: AbortSignal.timeout(3000)
            });
            
            return {
              endpoint,
              status: response.ok ? 'OK' : 'ERROR',
              responseTime: Date.now() - startTime,
              statusCode: response.status
            };
          } catch (error: any) {
            return {
              endpoint,
              status: 'ERROR',
              responseTime: Date.now() - startTime,
              error: error.message
            };
          }
        })
      );
      
      const failedEndpoints = endpointChecks.filter(check => check.status === 'ERROR');
      
      return {
        status: failedEndpoints.length > 0 ? 'CRITICAL' : 'OK',
        responseTime: Date.now() - startTime,
        details: {
          totalEndpoints: endpoints.length,
          failedEndpoints: failedEndpoints.length,
          checks: endpointChecks
        }
      };
    } catch (error: any) {
      return {
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        details: { error: error.message }
      };
    }
  }

  /**
   * V�rifie les t�ches en arri�re-plan
   */
  private async checkBackgroundJobs(): Promise<{ status: string; responseTime: number; details: any }> {
    const startTime = Date.now();
    
    try {
      // V�rifier les t�ches IA en cours
      const pendingAIActions = await prisma.aIAction.count({
        where: { validationStatus: 'PENDING' }
      });
      
      // V�rifier les t�ches de maintenance
      const lastMaintenance = await this.getLastMaintenanceTime();
      const hoursSinceLastMaintenance = (Date.now() - lastMaintenance.getTime()) / (1000 * 60 * 60);
      
      let status = 'OK';
      if (pendingAIActions > 100) {
        status = 'WARNING';
      }
      if (hoursSinceLastMaintenance > 25) { // Plus de 25h sans maintenance
        status = 'WARNING';
      }
      
      return {
        status,
        responseTime: Date.now() - startTime,
        details: {
          pendingAIActions,
          hoursSinceLastMaintenance: Math.round(hoursSinceLastMaintenance),
          lastMaintenance
        }
      };
    } catch (error: any) {
      return {
        status: 'ERROR',
        responseTime: Date.now() - startTime,
        details: { error: error.message }
      };
    }
  }

  /**
   * Calcule les m�triques de performance
   */
  private async calculatePerformanceMetrics(): Promise<{
    avgResponseTime: number;
    errorRate: number;
    throughput: number;
  }> {
    try {
      // En production, ces m�triques viendraient d'un syst�me de monitoring
      // Pour l'instant, on simule avec des donn�es de base
      
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Calculer le taux d'erreur bas� sur les logs d'audit
      const totalActions = await prisma.aIAction.count({
        where: { createdAt: { gte: last24h } }
      });
      
      const errorActions = await prisma.aIAction.count({
        where: { 
          createdAt: { gte: last24h }
        }
      });
      
      const errorRate = totalActions > 0 ? (errorActions / totalActions) * 100 : 0;
      
      return {
        avgResponseTime: 450, // ms - en production, calculer depuis les logs
        errorRate: Math.round(errorRate * 100) / 100,
        throughput: totalActions // actions/24h
      };
    } catch (error: any) {
      return {
        avgResponseTime: 0,
        errorRate: 0,
        throughput: 0
      };
    }
  }

  /**
   * Envoie une alerte critique
   */
  private async sendCriticalAlert(issues: HealthCheck[]): Promise<void> {
    const alertObj: Alert = {
      id: `alert-${Date.now()}`,
      severity: 'CRITICAL',
      title: `Probl�me critique d�tect� - ${issues.length} service(s) affect�(s)`,
      description: issues.map(issue => 
        `${issue.name}: ${issue.details?.error || 'Service indisponible'}`
      ).join('\n'),
      timestamp: new Date()
    };

    try {
      // Sauvegarder l'alerte
      await this.saveAlert(alertObj);

      // Envoyer par email (si configur�)
      await this.sendEmailAlert(alertObj);

      // Envoyer sur Slack (si configur�)
      await this.sendSlackAlert(alertObj);

      logger.critical('ALERTE SYST�ME CRITIQUE', { title: alertObj.title, severity: alertObj.severity, description: alertObj.description });
    } catch (error: any) {
      logger.error('Erreur envoi alerte syst�me', { error, alertTitle: alertObj.title });
    }
  }

  /**
   * Envoie une alerte par email
   */
  private async sendEmailAlert(alert: Alert): Promise<void> {
    try {
      const emailConfig = {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      };

      if (!emailConfig.host) return; // Email non configur�

      const transporter = nodemailer.createTransport(emailConfig);

      await transporter.sendMail({
        from: process.env.ALERT_FROM_EMAIL || 'alerts@memoLib.com',
        to: process.env.ALERT_TO_EMAIL || 'admin@memoLib.com',
        subject: `?? ${alert.title}`,
        html: `
          <h2>Alerte Syst�me - IA Poste Manager</h2>
          <p><strong>S�v�rit�:</strong> ${alert.severity}</p>
          <p><strong>Heure:</strong> ${alert.timestamp.toLocaleString()}</p>
          <p><strong>Description:</strong></p>
          <pre>${alert.description}</pre>
          <p>Veuillez v�rifier le syst�me imm�diatement.</p>
        `
      });
    } catch (error: any) {
      logger.error('Erreur envoi email alerte syst�me', { error, alert: alert.title });
    }
  }

  /**
   * Envoie une alerte sur Slack
   */
  private async sendSlackAlert(alert: Alert): Promise<void> {
    try {
      const webhookUrl = process.env.SLACK_WEBHOOK_URL;
      if (!webhookUrl) return; // Slack non configur�

      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `?? *${alert.title}*`,
          attachments: [{
            color: alert.severity === 'CRITICAL' ? 'danger' : 'warning',
            fields: [
              { title: 'S�v�rit�', value: alert.severity, short: true },
              { title: 'Heure', value: alert.timestamp.toLocaleString(), short: true },
              { title: 'Description', value: alert.description, short: false }
            ]
          }]
        })
      });
    } catch (error: any) {
      logger.error('Erreur envoi Slack alerte syst�me', { error, alert: alert.title });
    }
  }

  /**
   * Sauvegarde le rapport de sant�
   */
  private async saveHealthReport(health: SystemHealth): Promise<void> {
    try {
      // En production, sauvegarder dans une table d�di�e ou un syst�me de monitoring
      logger.info('Rapport sant� syst�me', {
        status: health.overall,
        uptimeMinutes: Math.round(health.uptime / 60),
        checksCount: health.checks.length,
        performance: health.performance
      });
    } catch (error: any) {
      logger.error('Erreur sauvegarde rapport sant�', { error });
    }
  }

  /**
   * Sauvegarde une alerte
   */
  private async saveAlert(alert: Alert): Promise<void> {
    try {
      // En production, sauvegarder dans une table d�di�e
      logger.info('Alerte syst�me sauvegard�e', { alertId: alert.id, title: alert.title, severity: alert.severity });
    } catch (error: any) {
      logger.error('Erreur sauvegarde alerte syst�me', { error, alertId: alert.id });
    }
  }

  /**
   * Obtient l'heure du dernier backup
   */
  private async getLastBackupTime(): Promise<Date> {
    // En production, v�rifier r�ellement les fichiers de backup
    return new Date(Date.now() - 6 * 60 * 60 * 1000); // Simulation: il y a 6h
  }

  /**
   * Obtient l'heure de la derni�re maintenance
   */
  private async getLastMaintenanceTime(): Promise<Date> {
    // En production, v�rifier les logs de maintenance
    return new Date(Date.now() - 12 * 60 * 60 * 1000); // Simulation: il y a 12h
  }
}

// Service singleton
export const systemMonitor = new SystemMonitor();
