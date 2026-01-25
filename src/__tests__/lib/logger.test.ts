/**
 * Tests pour le systeme de logging professionnel
 * Verifie RGPD, anonymisation, niveaux de log, contexte
 */

import { logger, logDossierAction, logIAUsage, logRGPDAction } from '@/lib/logger';
import type { ActionJuridique, TypeDossier } from '@/lib/logger';

describe('Logger - Systeme de logging professionnel', () => {
  // Mock console.error pour eviter les sorties dans les tests
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Reset de l'environnement
    process.env.NODE_ENV = 'development';
    console.error = jest.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  describe('Niveaux de log', () => {
    test('debug() log uniquement en developpement', () => {
      // Le logger verifie NODE_ENV qui est 'test' dans Jest
      // donc debug() ne loggera rien (pas de console.log appele)
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.debug('Test debug', { data: 'test' });
      
      // En environnement test (pas development), debug ne devrait rien logger
      const newLogs = logger.getBufferedLogs();
      expect(newLogs.length).toBe(initialCount);
    });

    test('info() log visible en dev', () => {
      // info() bufferise toujours les logs
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.info('Test info', { data: 'info' });
      
      const newLogs = logger.getBufferedLogs();
      expect(newLogs.length).toBeGreaterThan(initialCount);
      expect(newLogs[newLogs.length - 1].message).toBe('Test info');
      expect(newLogs[newLogs.length - 1].level).toBe('info');
    });

    test('warn() toujours visible', () => {
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.warn('Test warning', { issue: 'minor' });
      
      const newLogs = logger.getBufferedLogs();
      expect(newLogs.length).toBeGreaterThan(initialCount);
      const lastLog = newLogs[newLogs.length - 1];
      expect(lastLog.message).toBe('Test warning');
      expect(lastLog.level).toBe('warn');
    });

    test('error() log avec stack trace', () => {
      const testError = new Error('Test error');
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.error('Erreur de test', testError, { context: 'test' });
      
      const newLogs = logger.getBufferedLogs();
      expect(newLogs.length).toBeGreaterThan(initialCount);
      const lastLog = newLogs[newLogs.length - 1];
      expect(lastLog.level).toBe('error');
      expect(lastLog.message).toContain('Test error');
      expect(lastLog.context?.stackTrace).toBeDefined();
    });

    test('critical() log critique avec alerte', () => {
      const criticalError = new Error('Critical error');
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.critical('Erreur critique', criticalError);
      
      const newLogs = logger.getBufferedLogs();
      expect(newLogs.length).toBeGreaterThan(initialCount);
      const lastLog = newLogs[newLogs.length - 1];
      expect(lastLog.level).toBe('critical');
      expect(lastLog.message).toContain('Critical error');
    });
  });

  describe('RGPD - Anonymisation des donnees', () => {
    test('Anonymise les emails', () => {
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.info('Test email', {
        email: 'john.doe@example.com',
        rgpdCompliant: false
      });
      
      const newLogs = logger.getBufferedLogs();
      const lastLog = newLogs[newLogs.length - 1];
      
      // L'email doit etre anonymise
      expect(lastLog.context?.email).toMatch(/\*\*\*@example\.com/);
      expect(lastLog.context?.email).not.toContain('john.doe');
    });

    test('Redacte les mots de passe', () => {
      logger.info('Test password', {
        password: 'super-secret-123',
        token: 'abc123token'
      });
      
      const logs = logger.getBufferedLogs();
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog.context?.password).toBe('[REDACTED]');
      expect(lastLog.context?.token).toBe('[REDACTED]');
    });

    test('Protege les donnees personnelles si non-RGPD compliant', () => {
      logger.info('Test donnees personnelles', {
        nom: 'Dupont',
        prenom: 'Jean',
        telephone: '0612345678',
        rgpdCompliant: false
      });
      
      const logs = logger.getBufferedLogs();
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog.context?.nom).toBe('[DONNeES PERSONNELLES]');
      expect(lastLog.context?.prenom).toBe('[DONNeES PERSONNELLES]');
      expect(lastLog.context?.telephone).toBe('[DONNeES PERSONNELLES]');
    });

    test('Conserve les donnees si RGPD compliant', () => {
      logger.info('Test RGPD OK', {
        dossierId: 'DOSSIER-123',
        actionType: 'CREATE',
        rgpdCompliant: true
      });
      
      const logs = logger.getBufferedLogs();
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog.context?.dossierId).toBe('DOSSIER-123');
      expect(lastLog.context?.actionType).toBe('CREATE');
    });
  });

  describe('Logs metier - Actions dossiers', () => {
    test('logDossierAction() trace action juridique', () => {
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logDossierAction(
        'CREATE_DOSSIER',
        'user-123',
        'tenant-456',
        'dossier-789',
        {
          clientId: 'client-001',
          typeDossier: 'OQTF',
          documentName: 'arrete_oqtf.pdf'
        }
      );
      
      const newLogs = logger.getBufferedLogs();
      expect(newLogs.length).toBeGreaterThan(initialCount);
      const lastLog = newLogs[newLogs.length - 1];
      
      expect(lastLog.actionJuridique).toBe('CREATE_DOSSIER');
      expect(lastLog.userId).toBe('user-123');
      expect(lastLog.tenantId).toBe('tenant-456');
      expect(lastLog.dossierId).toBe('dossier-789');
      expect(lastLog.typeDossier).toBe('OQTF');
    });

    test('logIAUsage() trace utilisation IA', () => {
      logIAUsage(
        'ANALYSIS',
        'user-456',
        'tenant-789',
        'dossier-123',
        {
          confidence: 0.95,
          modelUsed: 'llama3.2',
          inputType: 'OQTF',
          outputType: 'deadlines'
        }
      );
      
      const logs = logger.getBufferedLogs();
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog.message).toContain('IA ANALYSIS');
      expect(lastLog.context?.confidence).toBe(0.95);
      expect(lastLog.context?.modelUsed).toBe('llama3.2');
      expect(lastLog.context?.dataAnonymized).toBe(true);
    });

    test('logRGPDAction() trace actions RGPD', () => {
      logRGPDAction(
        'EXPORT_DATA',
        'user-789',
        'tenant-123',
        'client-456',
        { reason: 'Demande client', format: 'PDF' }
      );
      
      const logs = logger.getBufferedLogs();
      const lastLog = logs[logs.length - 1];
      
      expect(lastLog.message).toContain('RGPD: EXPORT_DATA');
      expect(lastLog.context?.clientId).toBe('client-456');
      expect(lastLog.context?.reason).toBe('Demande client');
    });
  });

  describe('Buffer de logs', () => {
    test('getBufferedLogs() retourne copie du buffer', () => {
      const logs1 = logger.getBufferedLogs();
      const initialLength = logs1.length;
      
      logger.info('Test buffer 1');
      logger.info('Test buffer 2');
      
      const logs2 = logger.getBufferedLogs();
      
      expect(logs2.length).toBe(initialLength + 2);
      expect(logs2[logs2.length - 1].message).toBe('Test buffer 2');
      
      // Verifier que c'est une copie (pas de mutation)
      logs2.pop();
      const logs3 = logger.getBufferedLogs();
      expect(logs3.length).toBe(initialLength + 2); // Toujours 2 logs
    });

    test('Buffer limite a 100 entrees (flush automatique)', () => {
      // Vider le buffer d'abord
      const currentLogs = logger.getBufferedLogs();
      
      // Ajouter 101 logs
      for (let i = 0; i < 101; i++) {
        logger.info(`Test log ${i}`);
      }
      
      const logs = logger.getBufferedLogs();
      
      // Le buffer doit avoir ete flush, donc < 100 entrees
      expect(logs.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Performance logging', () => {
    test('performance() log operations rapides en debug', () => {
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.performance('Fast operation', 150, { operation: 'query' });
      
      // Operation rapide (<1000ms) [Next] debug log (mais pas de buffer en test)
      // Verifier qu'aucun warning n'a ete cree
      const newLogs = logger.getBufferedLogs();
      const warnLogs = newLogs.filter(l => l.level === 'warn' && l.message.includes('Slow'));
      expect(warnLogs.length).toBe(0);
    });

    test('performance() warn si operation lente', () => {
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.performance('Slow operation', 2500, { operation: 'pdf-export' });
      
      // Operation lente (>1000ms) [Next] warning
      const newLogs = logger.getBufferedLogs();
      expect(newLogs.length).toBeGreaterThan(initialCount);
      const lastLog = newLogs[newLogs.length - 1];
      expect(lastLog.level).toBe('warn');
      expect(lastLog.message).toContain('Slow operation');
      expect(lastLog.context?.durationMs).toBe(2500);
    });
  });

  describe('Audit juridique', () => {
    test('audit() trace actions avec RGPD compliance', () => {
      const logs = logger.getBufferedLogs();
      const initialCount = logs.length;
      
      logger.audit(
        'Modification dossier OQTF',
        'user-audit',
        'tenant-audit',
        { dossierId: 'DOSSIER-999', changes: ['deadline', 'status'] }
      );
      
      const newLogs = logger.getBufferedLogs();
      expect(newLogs.length).toBeGreaterThan(initialCount);
      const lastLog = newLogs[newLogs.length - 1];
      
      expect(lastLog.userId).toBe('user-audit');
      expect(lastLog.tenantId).toBe('tenant-audit');
      expect(lastLog.context?.auditType).toBe(true);
      expect(lastLog.context?.rgpdCompliant).toBe(true);
    });
  });
});
