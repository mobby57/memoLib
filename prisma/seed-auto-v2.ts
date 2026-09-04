
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  // Plan
  await prisma.plan.upsert({
    where: { id: 'plan-1' },
    update: {},
    create: {
      id: 'plan-1',
      name: 'default-name',
      displayName: 'default-displayName',
      priceMonthly: 0,
      priceYearly: 0,
      currency: "EUR",
      maxWorkspaces: '1',
      maxDossiers: '100',
      maxClients: '20',
      maxStorageGb: '5',
      maxUsers: '5',
      aiAutonomyLevel: '1',
      humanValidation: true,
      advancedAnalytics: false,
      externalAiAccess: false,
      prioritySupport: false,
      customBranding: false,
      apiAccess: false,
      isActive: true,
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // Tenant
  await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      name: 'default-name',
      subdomain: 'default-subdomain',
      planId: 'default-planId',
      status: "active",
      currentWorkspaces: '0',
      currentDossiers: '0',
      currentClients: '0',
      currentStorageGb: '0',
      currentUsers: '0',
      createdAt: 'now(',
      updatedAt: new Date(),
      Plan: 'plan-1',
    },
  });

  // User
  await prisma.user.upsert({
    where: { id: 'user-1' },
    update: {},
    create: {
      id: 'user-1',
      email: 'default-email',
      name: 'default-name',
      password: 'default-password',
      role: 'default-role',
      status: "active",
      language: "fr",
      timezone: "Europe/Paris",
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // Client
  await prisma.client.upsert({
    where: { id: 'client-1' },
    update: {},
    create: {
      id: 'client-1',
      tenantId: 'default-tenantId',
      firstName: 'default-firstName',
      lastName: 'default-lastName',
      email: 'default-email',
      pays: "France",
      status: "actif",
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Dossier
  await prisma.dossier.upsert({
    where: { id: 'dossier-1' },
    update: {},
    create: {
      id: 'dossier-1',
      tenantId: 'default-tenantId',
      numero: 'default-numero',
      clientId: 'default-clientId',
      typeDossier: 'default-typeDossier',
      statut: "en_cours",
      priorite: "normale",
      phase: "instruction",
      confidentialMode: false,
      dateCreation: 'now(',
      createdAt: 'now(',
      updatedAt: new Date(),
      Client: 'client-1',
      Tenant: 'tenant-1',
    },
  });

  // Subscription
  await prisma.subscription.upsert({
    where: { id: 'subscription-1' },
    update: {},
    create: {
      id: 'subscription-1',
      tenantId: 'default-tenantId',
      planId: 'default-planId',
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      pricePerMonth: 0,
      currency: "EUR",
      autoRenew: true,
      createdAt: 'now(',
      updatedAt: new Date(),
      Plan: 'plan-1',
      Tenant: 'tenant-1',
    },
  });

  // Facture
  await prisma.facture.upsert({
    where: { id: 'facture-1' },
    update: {},
    create: {
      id: 'facture-1',
      tenantId: 'default-tenantId',
      clientId: 'default-clientId',
      numero: 'default-numero',
      montantHT: 0,
      tauxTVA: '20',
      montantTVA: 0,
      montantTTC: 0,
      statut: "brouillon",
      dateEmission: 'now(',
      dateEcheance: new Date(),
      createdAt: 'now(',
      updatedAt: new Date(),
      Client: 'client-1',
      Tenant: 'tenant-1',
    },
  });

  // Document
  await prisma.document.upsert({
    where: { id: 'document-1' },
    update: {},
    create: {
      id: 'document-1',
      tenantId: 'default-tenantId',
      filename: 'default-filename',
      originalName: 'default-originalName',
      mimeType: 'default-mimeType',
      size: 0,
      storageKey: 'default-storageKey',
      ocrProcessed: false,
      aiAnalyzed: false,
      uploadedBy: 'default-uploadedBy',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      User: 'user-1',
    },
  });

  // Email
  await prisma.email.upsert({
    where: { id: 'email-1' },
    update: {},
    create: {
      id: 'email-1',
      tenantId: 'default-tenantId',
      from: 'default-from',
      to: 'default-to',
      subject: 'default-subject',
      body: 'default-body',
      category: "general-inquiry",
      urgency: "medium",
      sentiment: "neutral",
      isRead: false,
      isStarred: false,
      isArchived: false,
      isProcessed: false,
      receivedAt: 'now(',
      createdAt: 'now(',
      updatedAt: new Date(),
      hasAttachments: false,
      sourceChannel: "email",
      sourceDirection: "inbound",
      Tenant: 'tenant-1',
    },
  });

  // Notification
  await prisma.notification.upsert({
    where: { id: 'notification-1' },
    update: {},
    create: {
      id: 'notification-1',
      userId: 'default-userId',
      type: 'default-type',
      title: 'default-title',
      message: 'default-message',
      isRead: false,
      priority: "normal",
      createdAt: 'now(',
      updatedAt: new Date(),
      User: 'user-1',
    },
  });

  // AuditLog
  await prisma.auditlog.upsert({
    where: { id: 'auditlog-1' },
    update: {},
    create: {
      id: 'auditlog-1',
      tenantId: 'default-tenantId',
      userId: 'default-userId',
      userEmail: 'default-userEmail',
      userRole: 'default-userRole',
      action: null,
      entityType: 'default-entityType',
      entityId: 'default-entityId',
      timestamp: 'now(',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // CalendarEvent
  await prisma.calendarevent.upsert({
    where: { id: 'calendarevent-1' },
    update: {},
    create: {
      id: 'calendarevent-1',
      tenantId: 'default-tenantId',
      userId: 'default-userId',
      title: 'default-title',
      startDate: new Date(),
      endDate: new Date(),
      allDay: false,
      type: "rdv",
      status: "confirmed",
      isRecurring: false,
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      User: 'user-1',
    },
  });

  // TimeEntry
  await prisma.timeentry.upsert({
    where: { id: 'timeentry-1' },
    update: {},
    create: {
      id: 'timeentry-1',
      tenantId: 'default-tenantId',
      userId: 'default-userId',
      description: 'default-description',
      date: 'now(',
      duration: 0,
      isBillable: true,
      isBilled: false,
      category: "travail",
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      User: 'user-1',
    },
  });

  // Draft
  await prisma.draft.upsert({
    where: { id: 'draft-1' },
    update: {},
    create: {
      id: 'draft-1',
      tenantId: 'default-tenantId',
      status: "PENDING",
      extractedData: 'default-extractedData',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Jurisprudence
  await prisma.jurisprudence.upsert({
    where: { id: 'jurisprudence-1' },
    update: {},
    create: {
      id: 'jurisprudence-1',
      externalId: 'default-externalId',
      titre: 'default-titre',
      date: new Date(),
      juridiction: 'default-juridiction',
      texte: 'default-texte',
      source: "huggingface",
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // LegalReference
  await prisma.legalreference.upsert({
    where: { id: 'legalreference-1' },
    update: {},
    create: {
      id: 'legalreference-1',
      code: 'default-code',
      article: 'default-article',
      title: 'default-title',
      content: 'default-content',
      category: 'default-category',
      isActive: true,
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // LegalDeadline
  await prisma.legaldeadline.upsert({
    where: { id: 'legaldeadline-1' },
    update: {},
    create: {
      id: 'legaldeadline-1',
      tenantId: 'default-tenantId',
      dossierId: 'default-dossierId',
      clientId: 'default-clientId',
      type: null,
      label: 'default-label',
      referenceDate: new Date(),
      dueDate: new Date(),
      status: 'PENDING',
      alertJ7Sent: false,
      alertJ3Sent: false,
      alertJ1Sent: false,
      alertSmsSent: false,
      createdBy: 'default-createdBy',
      createdAt: 'now(',
      updatedAt: new Date(),
      Client: 'client-1',
      Dossier: 'dossier-1',
      Tenant: 'tenant-1',
    },
  });

  // ArchivePolicy
  await prisma.archivepolicy.upsert({
    where: { id: 'archivepolicy-1' },
    update: {},
    create: {
      id: 'archivepolicy-1',
      tenantId: 'default-tenantId',
      entityType: 'default-entityType',
      entityId: 'default-entityId',
      status: 'ACTIVE',
      retentionDays: 0,
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Proof
  await prisma.proof.upsert({
    where: { id: 'proof-1' },
    update: {},
    create: {
      id: 'proof-1',
      tenantId: 'default-tenantId',
      type: null,
      title: 'default-title',
      proofDate: new Date(),
      capturedAt: 'now(',
      capturedBy: 'default-capturedBy',
      status: 'PENDING_VALIDATION',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Report
  await prisma.report.upsert({
    where: { id: 'report-1' },
    update: {},
    create: {
      id: 'report-1',
      tenantId: 'default-tenantId',
      type: null,
      title: 'default-title',
      status: 'PENDING',
      generatedBy: 'default-generatedBy',
      isPublic: false,
      accessCount: '0',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // UsageRecord
  await prisma.usagerecord.upsert({
    where: { id: 'usagerecord-1' },
    update: {},
    create: {
      id: 'usagerecord-1',
      tenantId: 'default-tenantId',
      type: 'default-type',
      quantity: 0,
      unitCost: 0,
      totalCost: 0,
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // QuotaEvent
  await prisma.quotaevent.upsert({
    where: { id: 'quotaevent-1' },
    update: {},
    create: {
      id: 'quotaevent-1',
      tenantId: 'default-tenantId',
      quotaType: 'default-quotaType',
      currentValue: 0,
      limitValue: 0,
      percentage: 0,
      eventType: 'default-eventType',
      occurredAt: 'now(',
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // StripeWebhookEvent
  await prisma.stripewebhookevent.upsert({
    where: { id: 'stripewebhookevent-1' },
    update: {},
    create: {
      id: 'stripewebhookevent-1',
      stripeEventId: 'default-stripeEventId',
      provider: "stripe",
      eventType: 'default-eventType',
      status: "PROCESSING",
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // TemplateVote
  await prisma.templatevote.upsert({
    where: { id: 'templatevote-1' },
    update: {},
    create: {
      id: 'templatevote-1',
      templateId: 'default-templateId',
      userId: 'default-userId',
      vote: 0,
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // CommunityTemplate
  await prisma.communitytemplate.upsert({
    where: { id: 'communitytemplate-1' },
    update: {},
    create: {
      id: 'communitytemplate-1',
      title: 'default-title',
      category: 'default-category',
      typeDossier: 'default-typeDossier',
      content: 'default-content',
      authorId: 'default-authorId',
      authorName: 'default-authorName',
      tenantId: 'default-tenantId',
      isPublic: false,
      upvotes: '0',
      downvotes: '0',
      usageCount: '0',
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // VerificationToken
  await prisma.verificationtoken.upsert({
    where: { id: 'verificationtoken-1' },
    update: {},
    create: {
      id: 'verificationtoken-1',
      email: 'default-email',
      token: 'default-token',
      type: "email_verification",
      expiresAt: new Date(),
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // AIDecision
  await prisma.aidecision.upsert({
    where: { id: 'aidecision-1' },
    update: {},
    create: {
      id: 'aidecision-1',
      tenantId: 'default-tenantId',
      entityType: 'default-entityType',
      entityId: 'default-entityId',
      decisionType: 'default-decisionType',
      input: null,
      output: null,
      confidence: 0,
      source: 'default-source',
      humanReviewed: false,
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // CompteComptable
  await prisma.comptecomptable.upsert({
    where: { id: 'comptecomptable-1' },
    update: {},
    create: {
      id: 'comptecomptable-1',
      tenantId: 'default-tenantId',
      numero: 'default-numero',
      libelle: 'default-libelle',
      classe: 0,
      type: null,
      solde: '0',
      isActive: true,
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Journal
  await prisma.journal.upsert({
    where: { id: 'journal-1' },
    update: {},
    create: {
      id: 'journal-1',
      tenantId: 'default-tenantId',
      code: 'default-code',
      libelle: 'default-libelle',
      type: null,
      isActive: true,
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Ecriture
  await prisma.ecriture.upsert({
    where: { id: 'ecriture-1' },
    update: {},
    create: {
      id: 'ecriture-1',
      tenantId: 'default-tenantId',
      journalId: 'default-journalId',
      numero: 'default-numero',
      date: new Date(),
      libelle: 'default-libelle',
      statut: 'BROUILLON',
      source: 'MANUELLE',
      createdAt: 'now(',
      updatedAt: new Date(),
      Journal: 'journal-1',
      Tenant: 'tenant-1',
    },
  });

  // LigneEcriture
  await prisma.ligneecriture.upsert({
    where: { id: 'ligneecriture-1' },
    update: {},
    create: {
      id: 'ligneecriture-1',
      ecritureId: 'default-ecritureId',
      compteId: 'default-compteId',
      debit: '0',
      credit: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
      Ecriture: 'ecriture-1',
      Compte: 'comptecomptable-1',
    },
  });

  // MouvementBancaire
  await prisma.mouvementbancaire.upsert({
    where: { id: 'mouvementbancaire-1' },
    update: {},
    create: {
      id: 'mouvementbancaire-1',
      tenantId: 'default-tenantId',
      compteBancaire: 'default-compteBancaire',
      date: new Date(),
      libelle: 'default-libelle',
      montant: 0,
      isRapproche: false,
      importedAt: 'now(',
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // DeclarationTVA
  await prisma.declarationtva.upsert({
    where: { id: 'declarationtva-1' },
    update: {},
    create: {
      id: 'declarationtva-1',
      tenantId: 'default-tenantId',
      periode: 'default-periode',
      regime: null,
      tvaCollectee: '0',
      tvaDeductible: '0',
      tvaNette: '0',
      statut: "brouillon",
      dateLimite: new Date(),
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // MouvementCARPA
  await prisma.mouvementcarpa.upsert({
    where: { id: 'mouvementcarpa-1' },
    update: {},
    create: {
      id: 'mouvementcarpa-1',
      tenantId: 'default-tenantId',
      dossierId: 'default-dossierId',
      clientId: 'default-clientId',
      type: null,
      montant: 0,
      libelle: 'default-libelle',
      date: 'now(',
      soldeApres: '0',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      Dossier: 'dossier-1',
      Client: 'client-1',
    },
  });

  // DossierChecklistItem
  await prisma.dossierchecklistitem.upsert({
    where: { id: 'dossierchecklistitem-1' },
    update: {},
    create: {
      id: 'dossierchecklistitem-1',
      dossierId: 'default-dossierId',
      tenantId: 'default-tenantId',
      label: 'default-label',
      category: "document",
      required: true,
      status: "missing",
      order: '0',
      createdAt: 'now(',
      updatedAt: new Date(),
    },
  });

  // InformationUnit
  await prisma.informationunit.upsert({
    where: { id: 'informationunit-1' },
    update: {},
    create: {
      id: 'informationunit-1',
      tenantId: 'default-tenantId',
      source: null,
      content: 'default-content',
      contentHash: 'default-contentHash',
      currentStatus: 'RECEIVED',
      receivedAt: 'now(',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // InformationStatusHistory
  await prisma.informationstatushistory.upsert({
    where: { id: 'informationstatushistory-1' },
    update: {},
    create: {
      id: 'informationstatushistory-1',
      unitId: 'default-unitId',
      toStatus: null,
      changedBy: 'default-changedBy',
      changedAt: 'now(',
      createdAt: new Date(),
      updatedAt: new Date(),
      InformationUnit: 'informationunit-1',
    },
  });

  // EmailAttachment
  await prisma.emailattachment.upsert({
    where: { id: 'emailattachment-1' },
    update: {},
    create: {
      id: 'emailattachment-1',
      emailId: 'default-emailId',
      filename: 'default-filename',
      mimeType: 'default-mimeType',
      size: 0,
      createdAt: 'now(',
      updatedAt: new Date(),
      Email: 'email-1',
    },
  });

  // LigneFacture
  await prisma.lignefacture.upsert({
    where: { id: 'lignefacture-1' },
    update: {},
    create: {
      id: 'lignefacture-1',
      factureId: 'default-factureId',
      description: 'default-description',
      quantite: '1',
      prixUnitaire: 0,
      montantHT: 0,
      ordre: '0',
      createdAt: 'now(',
      updatedAt: new Date(),
      Facture: 'facture-1',
    },
  });

  // Paiement
  await prisma.paiement.upsert({
    where: { id: 'paiement-1' },
    update: {},
    create: {
      id: 'paiement-1',
      factureId: 'default-factureId',
      montant: 0,
      date: 'now(',
      mode: 'default-mode',
      createdAt: 'now(',
      updatedAt: new Date(),
      Facture: 'facture-1',
    },
  });

  // DeadlineAlert
  await prisma.deadlinealert.upsert({
    where: { id: 'deadlinealert-1' },
    update: {},
    create: {
      id: 'deadlinealert-1',
      deadlineId: 'default-deadlineId',
      alertType: 'default-alertType',
      sentAt: 'now(',
      sentTo: 'default-sentTo',
      channel: 'default-channel',
      acknowledged: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      LegalDeadline: 'legaldeadline-1',
    },
  });

  // TenantSettings
  await prisma.tenantsettings.upsert({
    where: { id: 'tenantsettings-1' },
    update: {},
    create: {
      id: 'tenantsettings-1',
      tenantId: 'default-tenantId',
      ollamaEnabled: true,
      ollamaUrl: "http://localhost:11434",
      ollamaModel: "llama3.2:latest",
      emailEnabled: false,
      maxDossiers: '100',
      maxUsers: '5',
      storageLimit: '1000',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // AIUsageLog
  await prisma.aiusagelog.upsert({
    where: { id: 'aiusagelog-1' },
    update: {},
    create: {
      id: 'aiusagelog-1',
      tenantId: 'default-tenantId',
      costEur: '0',
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // WorkflowExecution
  await prisma.workflowexecution.upsert({
    where: { id: 'workflowexecution-1' },
    update: {},
    create: {
      id: 'workflowexecution-1',
      tenantId: 'default-tenantId',
      workflowId: 'default-workflowId',
      workflowName: 'default-workflowName',
      status: "pending",
      progress: '0',
      triggerType: "email",
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // EmailAccount
  await prisma.emailaccount.upsert({
    where: { id: 'emailaccount-1' },
    update: {},
    create: {
      id: 'emailaccount-1',
      tenantId: 'default-tenantId',
      userId: 'default-userId',
      email: 'default-email',
      provider: 'default-provider',
      isActive: true,
      createdAt: 'now(',
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      User: 'user-1',
    },
  });

  console.log('✅ Seed généré automatiquement terminé.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
