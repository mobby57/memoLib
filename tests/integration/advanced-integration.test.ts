import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { EmailProcessor } from '@/lib/services/email-processor';
import { AIAssistant } from '@/lib/services/ai-assistant';
import { BillingService } from '@/lib/services/billing';

describe('Tests Intégration Avancés', () => {
  let prisma: PrismaClient;
  let emailProcessor: EmailProcessor;
  let aiAssistant: AIAssistant;
  let billingService: BillingService;

  beforeEach(async () => {
    prisma = new PrismaClient();
    emailProcessor = new EmailProcessor();
    aiAssistant = new AIAssistant();
    billingService = new BillingService();
    
    // Clean test data
    await prisma.email.deleteMany();
    await prisma.case.deleteMany();
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    await prisma.$disconnect();
  });

  describe('Traitement Email Intelligent', () => {
    it('doit classifier et router automatiquement', async () => {
      const email = {
        from: 'client@urgent.com',
        subject: 'URGENT: Expulsion demain',
        body: 'Bonjour, je reçois une expulsion demain matin...',
        receivedAt: new Date()
      };

      const result = await emailProcessor.process(email);

      expect(result.priority).toBe('URGENT');
      expect(result.category).toBe('HOUSING_LAW');
      expect(result.suggestedActions).toContain('IMMEDIATE_RESPONSE');
      expect(result.estimatedResponseTime).toBeLessThan(60); // minutes
    });

    it('doit détecter les pièces jointes sensibles', async () => {
      const email = {
        attachments: [
          { name: 'passeport.pdf', content: Buffer.from('fake-pdf') },
          { name: 'contrat.docx', content: Buffer.from('fake-docx') }
        ]
      };

      const result = await emailProcessor.analyzeAttachments(email.attachments);

      expect(result.containsSensitiveData).toBe(true);
      expect(result.gdprCompliance).toBe('REQUIRES_ENCRYPTION');
      expect(result.detectedDocuments).toContain('IDENTITY_DOCUMENT');
    });
  });

  describe('Assistant IA CESEDA', () => {
    it('doit analyser cas complexe regroupement familial', async () => {
      const caseData = {
        clientNationality: 'Algerian',
        familyMembers: [
          { relation: 'spouse', inFrance: false },
          { relation: 'child', age: 16, inFrance: false }
        ],
        applicantStatus: 'RESIDENT_PERMIT',
        income: 2500,
        housing: 'ADEQUATE'
      };

      const analysis = await aiAssistant.analyzeFamilyReunification(caseData);

      expect(analysis.eligibility).toBe('ELIGIBLE');
      expect(analysis.requiredDocuments).toContain('PROOF_OF_INCOME');
      expect(analysis.legalBasis).toContain('L411-1');
      expect(analysis.estimatedProcessingTime).toBeGreaterThan(0);
    });

    it('doit identifier jurisprudence pertinente', async () => {
      const query = 'Refus de titre de séjour pour défaut d\'intégration';
      
      const result = await aiAssistant.searchJurisprudence(query);

      expect(result.cases).toHaveLength(expect.any(Number));
      expect(result.cases[0]).toHaveProperty('court');
      expect(result.cases[0]).toHaveProperty('date');
      expect(result.cases[0]).toHaveProperty('relevanceScore');
      expect(result.legalPrinciples).toContain('INTEGRATION_CRITERIA');
    });
  });

  describe('Facturation Automatique', () => {
    it('doit calculer facturation complexe multi-tâches', async () => {
      const timeEntries = [
        { task: 'CONSULTATION', duration: 120, rate: 150 },
        { task: 'DOCUMENT_REVIEW', duration: 60, rate: 100 },
        { task: 'COURT_HEARING', duration: 180, rate: 200 }
      ];

      const invoice = await billingService.generateInvoice({
        clientId: 'client-1',
        timeEntries,
        expenses: [{ description: 'Frais de dossier', amount: 50 }]
      });

      expect(invoice.subtotal).toBe(900); // (2*150 + 1*100 + 3*200)
      expect(invoice.expenses).toBe(50);
      expect(invoice.tax).toBe(190); // 20% TVA
      expect(invoice.total).toBe(1140);
      expect(invoice.paymentTerms).toBe(30);
    });

    it('doit gérer remises et paiements partiels', async () => {
      const invoice = await billingService.createInvoice({
        amount: 1000,
        discount: { type: 'PERCENTAGE', value: 10 },
        payments: [
          { amount: 300, date: new Date('2024-01-15') },
          { amount: 200, date: new Date('2024-02-15') }
        ]
      });

      expect(invoice.discountedAmount).toBe(900);
      expect(invoice.paidAmount).toBe(500);
      expect(invoice.remainingAmount).toBe(400);
      expect(invoice.status).toBe('PARTIALLY_PAID');
    });
  });

  describe('Conformité RGPD', () => {
    it('doit tracer toutes les actions sensibles', async () => {
      const user = await prisma.user.create({
        data: { email: 'test@test.com', name: 'Test User' }
      });

      // Action sensible
      await prisma.client.create({
        data: {
          name: 'Client Sensible',
          email: 'client@test.com',
          phone: '0123456789',
          createdBy: user.id
        }
      });

      const auditLogs = await prisma.auditLog.findMany({
        where: { userId: user.id }
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('CLIENT_CREATED');
      expect(auditLogs[0].sensitiveData).toBe(true);
      expect(auditLogs[0].ipAddress).toBeDefined();
    });

    it('doit anonymiser données expirées', async () => {
      const oldClient = await prisma.client.create({
        data: {
          name: 'Client Ancien',
          email: 'ancien@test.com',
          createdAt: new Date('2020-01-01'),
          gdprRetentionExpiry: new Date('2023-01-01')
        }
      });

      await billingService.processGdprRetention();

      const anonymizedClient = await prisma.client.findUnique({
        where: { id: oldClient.id }
      });

      expect(anonymizedClient?.name).toBe('ANONYMIZED');
      expect(anonymizedClient?.email).toBe('ANONYMIZED');
      expect(anonymizedClient?.phone).toBeNull();
    });
  });

  describe('Performance & Scalabilité', () => {
    it('doit gérer charge élevée emails', async () => {
      const emails = Array.from({ length: 100 }, (_, i) => ({
        from: `client${i}@test.com`,
        subject: `Email ${i}`,
        body: `Contenu email ${i}`,
        receivedAt: new Date()
      }));

      const startTime = Date.now();
      const results = await Promise.all(
        emails.map(email => emailProcessor.process(email))
      );
      const processingTime = Date.now() - startTime;

      expect(results).toHaveLength(100);
      expect(processingTime).toBeLessThan(5000); // < 5s pour 100 emails
      expect(results.every(r => r.processed)).toBe(true);
    });

    it('doit optimiser requêtes base de données', async () => {
      // Créer données test
      const users = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          prisma.user.create({
            data: { email: `user${i}@test.com`, name: `User ${i}` }
          })
        )
      );

      const cases = await Promise.all(
        users.flatMap(user =>
          Array.from({ length: 5 }, (_, i) =>
            prisma.case.create({
              data: {
                title: `Case ${i}`,
                clientName: `Client ${i}`,
                assignedToId: user.id
              }
            })
          )
        )
      );

      // Test requête optimisée
      const startTime = Date.now();
      const dashboard = await prisma.user.findMany({
        include: {
          assignedCases: {
            include: {
              _count: { select: { documents: true, emails: true } }
            }
          }
        }
      });
      const queryTime = Date.now() - startTime;

      expect(dashboard).toHaveLength(10);
      expect(queryTime).toBeLessThan(100); // < 100ms
    });
  });
});