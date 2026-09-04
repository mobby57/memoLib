
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {

  // Création de AIUsageLog
  await prisma.aiusagelog.upsert({
    where: { id: 'aiusagelog-1' },
    update: {},
    create: {
      id: 'aiusagelog-1',
      tenantId: ''default-tenantId'',
      costEur: '0',
      createdAt: new Date(),
      Tenant: 'tenant-1',
      updatedAt: new Date(),
    },
  });

  // Création de ArchivePolicy
  await prisma.archivepolicy.upsert({
    where: { id: 'archivepolicy-1' },
    update: {},
    create: {
      id: 'archivepolicy-1',
      tenantId: ''default-tenantId'',
      entityType: ''default-entityType'',
      entityId: ''default-entityId'',
      status: null,
      retentionDays: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de AuditLog
  await prisma.auditlog.upsert({
    where: { id: 'auditlog-1' },
    update: {},
    create: {
      id: 'auditlog-1',
      tenantId: ''default-tenantId'',
      userId: ''default-userId'',
      userEmail: ''default-userEmail'',
      userRole: ''default-userRole'',
      action: null,
      entityType: ''default-entityType'',
      entityId: ''default-entityId'',
      timestamp: new Date(),
      createdAt: new Date(),
      Tenant: 'tenant-1',
      updatedAt: new Date(),
    },
  });

  // Création de CalendarEvent
  await prisma.calendarevent.upsert({
    where: { id: 'calendarevent-1' },
    update: {},
    create: {
      id: 'calendarevent-1',
      tenantId: ''default-tenantId'',
      userId: ''default-userId'',
      title: ''default-title'',
      startDate: new Date(),
      endDate: new Date(),
      allDay: false,
      type: "rdv",
      status: "confirmed",
      isRecurring: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      User: 'user-1',
    },
  });

  // Création de Client
  await prisma.client.upsert({
    where: { id: 'client-1' },
    update: {},
    create: {
      id: 'client-1',
      tenantId: ''default-tenantId'',
      firstName: ''default-firstName'',
      lastName: ''default-lastName'',
      email: ''default-email'',
      pays: "France",
      status: "actif",
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de CommunityTemplate
  await prisma.communitytemplate.upsert({
    where: { id: 'communitytemplate-1' },
    update: {},
    create: {
      id: 'communitytemplate-1',
      title: ''default-title'',
      category: ''default-category'',
      typeDossier: ''default-typeDossier'',
      content: ''default-content'',
      authorId: ''default-authorId'',
      authorName: ''default-authorName'',
      tenantId: ''default-tenantId'',
      isPublic: false,
      upvotes: '0',
      downvotes: '0',
      usageCount: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de DeadlineAlert
  await prisma.deadlinealert.upsert({
    where: { id: 'deadlinealert-1' },
    update: {},
    create: {
      id: 'deadlinealert-1',
      deadlineId: ''default-deadlineId'',
      alertType: ''default-alertType'',
      sentAt: new Date(),
      sentTo: ''default-sentTo'',
      channel: ''default-channel'',
      acknowledged: false,
      LegalDeadline: 'legaldeadline-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de Document
  await prisma.document.upsert({
    where: { id: 'document-1' },
    update: {},
    create: {
      id: 'document-1',
      tenantId: ''default-tenantId'',
      filename: ''default-filename'',
      originalName: ''default-originalName'',
      mimeType: ''default-mimeType'',
      size: '0',
      storageKey: ''default-storageKey'',
      ocrProcessed: false,
      aiAnalyzed: false,
      uploadedBy: ''default-uploadedBy'',
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      User: 'user-1',
    },
  });

  // Création de Dossier
  await prisma.dossier.upsert({
    where: { id: 'dossier-1' },
    update: {},
    create: {
      id: 'dossier-1',
      tenantId: ''default-tenantId'',
      numero: ''default-numero'',
      clientId: ''default-clientId'',
      typeDossier: ''default-typeDossier'',
      statut: "en_cours",
      priorite: "normale",
      phase: "instruction",
      confidentialMode: false,
      dateCreation: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      Client: 'client-1',
      Tenant: 'tenant-1',
    },
  });

  // Création de TimeEntry
  await prisma.timeentry.upsert({
    where: { id: 'timeentry-1' },
    update: {},
    create: {
      id: 'timeentry-1',
      tenantId: ''default-tenantId'',
      userId: ''default-userId'',
      description: ''default-description'',
      date: new Date(),
      duration: '0',
      isBillable: true,
      isBilled: false,
      category: "travail",
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      User: 'user-1',
    },
  });

  // Création de DossierChecklistItem
  await prisma.dossierchecklistitem.upsert({
    where: { id: 'dossierchecklistitem-1' },
    update: {},
    create: {
      id: 'dossierchecklistitem-1',
      dossierId: ''default-dossierId'',
      tenantId: ''default-tenantId'',
      label: ''default-label'',
      category: "document",
      required: true,
      status: "missing",
      order: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de Draft
  await prisma.draft.upsert({
    where: { id: 'draft-1' },
    update: {},
    create: {
      id: 'draft-1',
      tenantId: ''default-tenantId'',
      status: "PENDING",
      extractedData: ''default-extractedData'',
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de EmailAccount
  await prisma.emailaccount.upsert({
    where: { id: 'emailaccount-1' },
    update: {},
    create: {
      id: 'emailaccount-1',
      tenantId: ''default-tenantId'',
      userId: ''default-userId'',
      email: ''default-email'',
      provider: ''default-provider'',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
      User: 'user-1',
    },
  });

  // Création de Email
  await prisma.email.upsert({
    where: { id: 'email-1' },
    update: {},
    create: {
      id: 'email-1',
      tenantId: ''default-tenantId'',
      from: ''default-from'',
      to: ''default-to'',
      subject: ''default-subject'',
      body: ''default-body'',
      category: "general-inquiry",
      urgency: "medium",
      sentiment: "neutral",
      isRead: false,
      isStarred: false,
      isArchived: false,
      isProcessed: false,
      receivedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      hasAttachments: false,
      sourceChannel: "email",
      sourceDirection: "inbound",
      Tenant: 'tenant-1',
    },
  });

  // Création de EmailAttachment
  await prisma.emailattachment.upsert({
    where: { id: 'emailattachment-1' },
    update: {},
    create: {
      id: 'emailattachment-1',
      emailId: ''default-emailId'',
      filename: ''default-filename'',
      mimeType: ''default-mimeType'',
      size: '0',
      createdAt: new Date(),
      Email: 'email-1',
      updatedAt: new Date(),
    },
  });

  // Création de Facture
  await prisma.facture.upsert({
    where: { id: 'facture-1' },
    update: {},
    create: {
      id: 'facture-1',
      tenantId: ''default-tenantId'',
      clientId: ''default-clientId'',
      numero: ''default-numero'',
      montantHT: '0',
      tauxTVA: '20',
      montantTVA: '0',
      montantTTC: '0',
      statut: "brouillon",
      dateEmission: new Date(),
      dateEcheance: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      Client: 'client-1',
      Tenant: 'tenant-1',
    },
  });

  // Création de InformationStatusHistory
  await prisma.informationstatushistory.upsert({
    where: { id: 'informationstatushistory-1' },
    update: {},
    create: {
      id: 'informationstatushistory-1',
      unitId: ''default-unitId'',
      toStatus: null,
      changedBy: ''default-changedBy'',
      changedAt: new Date(),
      InformationUnit: 'informationunit-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de InformationUnit
  await prisma.informationunit.upsert({
    where: { id: 'informationunit-1' },
    update: {},
    create: {
      id: 'informationunit-1',
      tenantId: ''default-tenantId'',
      source: null,
      content: ''default-content'',
      contentHash: ''default-contentHash'',
      currentStatus: null,
      receivedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de Jurisprudence
  await prisma.jurisprudence.upsert({
    where: { id: 'jurisprudence-1' },
    update: {},
    create: {
      id: 'jurisprudence-1',
      externalId: ''default-externalId'',
      titre: ''default-titre'',
      date: new Date(),
      juridiction: ''default-juridiction'',
      texte: ''default-texte'',
      source: "huggingface",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de LegalDeadline
  await prisma.legaldeadline.upsert({
    where: { id: 'legaldeadline-1' },
    update: {},
    create: {
      id: 'legaldeadline-1',
      tenantId: ''default-tenantId'',
      dossierId: ''default-dossierId'',
      clientId: ''default-clientId'',
      type: null,
      label: ''default-label'',
      referenceDate: new Date(),
      dueDate: new Date(),
      status: null,
      alertJ7Sent: false,
      alertJ3Sent: false,
      alertJ1Sent: false,
      alertSmsSent: false,
      createdBy: ''default-createdBy'',
      createdAt: new Date(),
      updatedAt: new Date(),
      Client: 'client-1',
      Dossier: 'dossier-1',
      Tenant: 'tenant-1',
    },
  });

  // Création de LegalReference
  await prisma.legalreference.upsert({
    where: { id: 'legalreference-1' },
    update: {},
    create: {
      id: 'legalreference-1',
      code: ''default-code'',
      article: ''default-article'',
      title: ''default-title'',
      content: ''default-content'',
      category: ''default-category'',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de LigneFacture
  await prisma.lignefacture.upsert({
    where: { id: 'lignefacture-1' },
    update: {},
    create: {
      id: 'lignefacture-1',
      factureId: ''default-factureId'',
      description: ''default-description'',
      quantite: '1',
      prixUnitaire: '0',
      montantHT: '0',
      ordre: '0',
      createdAt: new Date(),
      Facture: 'facture-1',
      updatedAt: new Date(),
    },
  });

  // Création de Notification
  await prisma.notification.upsert({
    where: { id: 'notification-1' },
    update: {},
    create: {
      id: 'notification-1',
      userId: ''default-userId'',
      type: ''default-type'',
      title: ''default-title'',
      message: ''default-message'',
      isRead: false,
      priority: "normal",
      createdAt: new Date(),
      User: 'user-1',
      updatedAt: new Date(),
    },
  });

  // Création de Paiement
  await prisma.paiement.upsert({
    where: { id: 'paiement-1' },
    update: {},
    create: {
      id: 'paiement-1',
      factureId: ''default-factureId'',
      montant: '0',
      date: new Date(),
      mode: ''default-mode'',
      createdAt: new Date(),
      Facture: 'facture-1',
      updatedAt: new Date(),
    },
  });

  // Création de Plan
  await prisma.plan.upsert({
    where: { id: 'plan-1' },
    update: {},
    create: {
      id: 'plan-1',
      name: ''default-name'',
      displayName: ''default-displayName'',
      priceMonthly: '0',
      priceYearly: '0',
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
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de Proof
  await prisma.proof.upsert({
    where: { id: 'proof-1' },
    update: {},
    create: {
      id: 'proof-1',
      tenantId: ''default-tenantId'',
      type: null,
      title: ''default-title'',
      proofDate: new Date(),
      capturedAt: new Date(),
      capturedBy: ''default-capturedBy'',
      status: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de QuotaEvent
  await prisma.quotaevent.upsert({
    where: { id: 'quotaevent-1' },
    update: {},
    create: {
      id: 'quotaevent-1',
      tenantId: ''default-tenantId'',
      quotaType: ''default-quotaType'',
      currentValue: '0',
      limitValue: '0',
      percentage: '0',
      eventType: ''default-eventType'',
      occurredAt: new Date(),
      Tenant: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de Report
  await prisma.report.upsert({
    where: { id: 'report-1' },
    update: {},
    create: {
      id: 'report-1',
      tenantId: ''default-tenantId'',
      type: null,
      title: ''default-title'',
      status: null,
      generatedBy: ''default-generatedBy'',
      isPublic: false,
      accessCount: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de StripeWebhookEvent
  await prisma.stripewebhookevent.upsert({
    where: { id: 'stripewebhookevent-1' },
    update: {},
    create: {
      id: 'stripewebhookevent-1',
      stripeEventId: ''default-stripeEventId'',
      provider: "stripe",
      eventType: ''default-eventType'',
      status: "PROCESSING",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de Subscription
  await prisma.subscription.upsert({
    where: { id: 'subscription-1' },
    update: {},
    create: {
      id: 'subscription-1',
      tenantId: ''default-tenantId'',
      planId: ''default-planId'',
      status: "active",
      billingCycle: "monthly",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(),
      pricePerMonth: '0',
      currency: "EUR",
      autoRenew: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      Plan: 'plan-1',
      Tenant: 'tenant-1',
    },
  });

  // Création de TemplateVote
  await prisma.templatevote.upsert({
    where: { id: 'templatevote-1' },
    update: {},
    create: {
      id: 'templatevote-1',
      templateId: ''default-templateId'',
      userId: ''default-userId'',
      vote: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de Tenant
  await prisma.tenant.upsert({
    where: { id: 'tenant-1' },
    update: {},
    create: {
      id: 'tenant-1',
      name: ''default-name'',
      subdomain: ''default-subdomain'',
      planId: ''default-planId'',
      status: "active",
      currentWorkspaces: '0',
      currentDossiers: '0',
      currentClients: '0',
      currentStorageGb: '0',
      currentUsers: '0',
      createdAt: new Date(),
      updatedAt: new Date(),
      Plan: 'plan-1',
    },
  });

  // Création de TenantSettings
  await prisma.tenantsettings.upsert({
    where: { id: 'tenantsettings-1' },
    update: {},
    create: {
      id: 'tenantsettings-1',
      tenantId: ''default-tenantId'',
      ollamaEnabled: true,
      ollamaUrl: "http://localhost:11434",
      ollamaModel: "llama3.2:latest",
      emailEnabled: false,
      maxDossiers: '100',
      maxUsers: '5',
      storageLimit: '1000',
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de UsageRecord
  await prisma.usagerecord.upsert({
    where: { id: 'usagerecord-1' },
    update: {},
    create: {
      id: 'usagerecord-1',
      tenantId: ''default-tenantId'',
      type: ''default-type'',
      quantity: '0',
      unitCost: '0',
      totalCost: '0',
      createdAt: new Date(),
      Tenant: 'tenant-1',
      updatedAt: new Date(),
    },
  });

  // Création de User
  await prisma.user.upsert({
    where: { id: 'user-1' },
    update: {},
    create: {
      id: 'user-1',
      email: ''default-email'',
      name: ''default-name'',
      password: ''default-password'',
      role: ''default-role'',
      status: "active",
      language: "fr",
      timezone: "Europe/Paris",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de WorkflowExecution
  await prisma.workflowexecution.upsert({
    where: { id: 'workflowexecution-1' },
    update: {},
    create: {
      id: 'workflowexecution-1',
      tenantId: ''default-tenantId'',
      workflowId: ''default-workflowId'',
      workflowName: ''default-workflowName'',
      status: "pending",
      progress: '0',
      triggerType: "email",
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de CompteComptable
  await prisma.comptecomptable.upsert({
    where: { id: 'comptecomptable-1' },
    update: {},
    create: {
      id: 'comptecomptable-1',
      tenantId: ''default-tenantId'',
      numero: ''default-numero'',
      libelle: ''default-libelle'',
      classe: '0',
      type: null,
      solde: '0',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de Journal
  await prisma.journal.upsert({
    where: { id: 'journal-1' },
    update: {},
    create: {
      id: 'journal-1',
      tenantId: ''default-tenantId'',
      code: ''default-code'',
      libelle: ''default-libelle'',
      type: null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de Ecriture
  await prisma.ecriture.upsert({
    where: { id: 'ecriture-1' },
    update: {},
    create: {
      id: 'ecriture-1',
      tenantId: ''default-tenantId'',
      journalId: ''default-journalId'',
      numero: ''default-numero'',
      date: new Date(),
      libelle: ''default-libelle'',
      statut: null,
      source: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      Journal: 'journal-1',
      Tenant: 'tenant-1',
    },
  });

  // Création de LigneEcriture
  await prisma.ligneecriture.upsert({
    where: { id: 'ligneecriture-1' },
    update: {},
    create: {
      id: 'ligneecriture-1',
      ecritureId: ''default-ecritureId'',
      compteId: ''default-compteId'',
      debit: '0',
      credit: '0',
      Ecriture: 'ecriture-1',
      Compte: 'comptecomptable-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de MouvementBancaire
  await prisma.mouvementbancaire.upsert({
    where: { id: 'mouvementbancaire-1' },
    update: {},
    create: {
      id: 'mouvementbancaire-1',
      tenantId: ''default-tenantId'',
      compteBancaire: ''default-compteBancaire'',
      date: new Date(),
      libelle: ''default-libelle'',
      montant: '0',
      isRapproche: false,
      importedAt: new Date(),
      Tenant: 'tenant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de DeclarationTVA
  await prisma.declarationtva.upsert({
    where: { id: 'declarationtva-1' },
    update: {},
    create: {
      id: 'declarationtva-1',
      tenantId: ''default-tenantId'',
      periode: ''default-periode'',
      regime: null,
      tvaCollectee: '0',
      tvaDeductible: '0',
      tvaNette: '0',
      statut: "brouillon",
      dateLimite: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      Tenant: 'tenant-1',
    },
  });

  // Création de MouvementCARPA
  await prisma.mouvementcarpa.upsert({
    where: { id: 'mouvementcarpa-1' },
    update: {},
    create: {
      id: 'mouvementcarpa-1',
      tenantId: ''default-tenantId'',
      dossierId: ''default-dossierId'',
      clientId: ''default-clientId'',
      type: null,
      montant: '0',
      libelle: ''default-libelle'',
      date: new Date(),
      soldeApres: '0',
      createdAt: new Date(),
      Tenant: 'tenant-1',
      Dossier: 'dossier-1',
      Client: 'client-1',
      updatedAt: new Date(),
    },
  });

  // Création de VerificationToken
  await prisma.verificationtoken.upsert({
    where: { id: 'verificationtoken-1' },
    update: {},
    create: {
      id: 'verificationtoken-1',
      email: ''default-email'',
      token: ''default-token'',
      type: "email_verification",
      expiresAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  // Création de AIDecision
  await prisma.aidecision.upsert({
    where: { id: 'aidecision-1' },
    update: {},
    create: {
      id: 'aidecision-1',
      tenantId: ''default-tenantId'',
      entityType: ''default-entityType'',
      entityId: ''default-entityId'',
      decisionType: ''default-decisionType'',
      input: {},
      output: {},
      confidence: '0',
      source: ''default-source'',
      humanReviewed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  console.log('✅ Seed généré automatiquement terminé.');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
