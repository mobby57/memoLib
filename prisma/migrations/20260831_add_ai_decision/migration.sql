-- CreateEnum
CREATE TYPE "TypeCompte" AS ENUM ('ACTIF', 'PASSIF', 'CHARGE', 'PRODUIT');

-- CreateEnum
CREATE TYPE "TypeJournal" AS ENUM ('VENTES', 'ACHATS', 'BANQUE', 'CAISSE', 'OD', 'CARPA');

-- CreateEnum
CREATE TYPE "StatutEcriture" AS ENUM ('BROUILLON', 'VALIDEE', 'LETTREE');

-- CreateEnum
CREATE TYPE "SourceEcriture" AS ENUM ('MANUELLE', 'FACTURE', 'PAIEMENT', 'BANQUE', 'IA');

-- CreateEnum
CREATE TYPE "RegimeTVA" AS ENUM ('MENSUEL', 'TRIMESTRIEL', 'ANNUEL_SIMPLIFIE');

-- CreateEnum
CREATE TYPE "TypeMouvementCARPA" AS ENUM ('PROVISION', 'RESTITUTION', 'REGLEMENT_TIERS', 'HONORAIRES');

-- CreateEnum
CREATE TYPE "ArchiveStatus" AS ENUM ('ACTIVE', 'PENDING_ARCHIVE', 'ARCHIVED', 'PENDING_DELETION', 'DELETED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'EXPORT', 'IMPORT', 'APPROVE', 'REJECT', 'ESCALATE', 'ARCHIVE');

-- CreateEnum
CREATE TYPE "DeadlineStatus" AS ENUM ('PENDING', 'APPROACHING', 'URGENT', 'CRITICAL', 'OVERDUE', 'COMPLETED', 'CANCELLED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "DeadlineType" AS ENUM ('RECOURS_GRACIEUX', 'RECOURS_HIERARCHIQUE', 'RECOURS_CONTENTIEUX', 'APPEL', 'CASSATION', 'REPONSE_PREFECTURE', 'CONVOCATION_AUDIENCE', 'PRODUCTION_PIECES', 'EXECUTION_DECISION', 'OQTF', 'RETENTION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "InformationUnitSource" AS ENUM ('EMAIL', 'UPLOAD', 'API', 'MANUAL', 'SCAN', 'FAX');

-- CreateEnum
CREATE TYPE "InformationUnitStatus" AS ENUM ('RECEIVED', 'CLASSIFIED', 'ANALYZED', 'INCOMPLETE', 'AMBIGUOUS', 'HUMAN_ACTION_REQUIRED', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ProofStatus" AS ENUM ('PENDING_VALIDATION', 'VALIDATED', 'REJECTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('DOCUMENT_RECEPTION', 'DOCUMENT_ENVOI', 'ACCUSE_RECEPTION', 'DEPOT_RECOURS', 'NOTIFICATION_DECISION', 'AUDIENCE_PRESENCE', 'SIGNATURE_ELECTRONIQUE', 'HORODATAGE_CERTIFIE', 'CAPTURE_EMAIL', 'SCREENSHOT', 'RAPPORT_IA', 'AUTRE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('DOSSIER_SUMMARY', 'CLIENT_PORTFOLIO', 'DEADLINE_STATUS', 'FINANCIAL_STATEMENT', 'AUDIT_TRAIL', 'COMPLIANCE_CHECK', 'AI_ANALYSIS', 'CUSTOM');

-- CreateTable
CREATE TABLE "AIUsageLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "provider" TEXT,
    "tokensUsed" INTEGER,
    "costEur" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "operation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" TEXT,

    CONSTRAINT "AIUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchivePolicy" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "status" "ArchiveStatus" NOT NULL DEFAULT 'ACTIVE',
    "retentionDays" INTEGER NOT NULL,
    "retentionReason" TEXT,
    "lastAccessAt" TIMESTAMP(3),
    "archiveAt" TIMESTAMP(3),
    "deleteAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedBy" TEXT,
    "holdUntil" TIMESTAMP(3),
    "holdReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchivePolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" "AuditAction" NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestampHash" TEXT,
    "previousLogId" TEXT,
    "hash" TEXT,
    "previousHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dossierId" TEXT,
    "clientId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL DEFAULT 'rdv',
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "googleEventId" TEXT,
    "outlookEventId" TEXT,
    "reminders" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "civilite" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nomNaissance" TEXT,
    "prenomUsuel" TEXT,
    "email" TEXT NOT NULL,
    "emailSecondaire" TEXT,
    "phone" TEXT,
    "phoneSecondaire" TEXT,
    "telephoneUrgence" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "lieuNaissance" TEXT,
    "nationality" TEXT,
    "nationaliteOrigine" TEXT,
    "address" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'France',
    "passportNumber" TEXT,
    "passportExpiry" TIMESTAMP(3),
    "passportCountry" TEXT,
    "status" TEXT NOT NULL DEFAULT 'actif',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunityTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "typeDossier" TEXT NOT NULL,
    "typeRecours" TEXT,
    "juridiction" TEXT,
    "content" TEXT NOT NULL,
    "variables" JSONB DEFAULT '[]',
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommunityTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeadlineAlert" (
    "id" TEXT NOT NULL,
    "deadlineId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentTo" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedBy" TEXT,

    CONSTRAINT "DeadlineAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dossierId" TEXT,
    "clientId" TEXT,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "ocrProcessed" BOOLEAN NOT NULL DEFAULT false,
    "ocrText" TEXT,
    "ocrConfidence" DOUBLE PRECISION,
    "extractedData" TEXT,
    "aiAnalyzed" BOOLEAN NOT NULL DEFAULT false,
    "aiSummary" TEXT,
    "aiMetadata" TEXT,
    "uploadedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "antivirusScannedAt" TIMESTAMP(3),
    "antivirusEngine" TEXT,
    "antivirusDetails" TEXT,
    "sha256" TEXT,
    "antivirusStatus" TEXT,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "typeDossier" TEXT NOT NULL,
    "articleCeseda" TEXT,
    "categorieJuridique" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "priorite" TEXT NOT NULL DEFAULT 'normale',
    "phase" TEXT NOT NULL DEFAULT 'instruction',
    "confidentialMode" BOOLEAN NOT NULL DEFAULT false,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOuverture" TIMESTAMP(3),
    "dateEcheance" TIMESTAMP(3),
    "dateProchaineEtape" TIMESTAMP(3),
    "dateCloture" TIMESTAMP(3),
    "juridiction" TEXT,
    "numeroJuridiction" TEXT,
    "typeRecours" TEXT,
    "responsableId" TEXT,
    "collaborateurs" TEXT,
    "objet" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "inboxEmail" TEXT,
    "checklistComplete" BOOLEAN DEFAULT false,
    "checklistTotal" INTEGER DEFAULT 0,
    "checklistReceived" INTEGER DEFAULT 0,
    "outcome" TEXT,
    "outcomeDate" TIMESTAMP(3),
    "outcomeNotes" TEXT,

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dossierId" TEXT,
    "clientId" TEXT,
    "description" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "duration" INTEGER NOT NULL,
    "tarifHoraire" DOUBLE PRECISION,
    "montant" DOUBLE PRECISION,
    "isBillable" BOOLEAN NOT NULL DEFAULT true,
    "isBilled" BOOLEAN NOT NULL DEFAULT false,
    "factureId" TEXT,
    "category" TEXT NOT NULL DEFAULT 'travail',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DossierChecklistItem" (
    "id" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'document',
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'missing',
    "documentId" TEXT,
    "receivedAt" TIMESTAMP(3),
    "receivedVia" TEXT,
    "notes" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Draft" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "extractedData" TEXT NOT NULL,
    "confidence" TEXT,
    "sourceEmailId" TEXT,
    "createdDossierId" TEXT,
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAccount" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "imapHost" TEXT,
    "imapPort" INTEGER,
    "imapUser" TEXT,
    "imapPassword" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSync" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "messageId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "bodyEncrypted" TEXT,
    "htmlBody" TEXT,
    "htmlBodyEncrypted" TEXT,
    "preview" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general-inquiry',
    "urgency" TEXT NOT NULL DEFAULT 'medium',
    "sentiment" TEXT NOT NULL DEFAULT 'neutral',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isProcessed" BOOLEAN NOT NULL DEFAULT false,
    "aiAnalysis" TEXT,
    "tags" TEXT,
    "clientId" TEXT,
    "dossierId" TEXT,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" TIMESTAMP(3),
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "bcc" TEXT,
    "bodyText" TEXT,
    "cc" TEXT,
    "contentHash" TEXT,
    "fromAddress" TEXT,
    "hasAttachments" BOOLEAN NOT NULL DEFAULT false,
    "inReplyTo" TEXT,
    "internetMessageId" TEXT,
    "normalizedPayload" TEXT,
    "providerMessageId" TEXT,
    "rawContent" TEXT,
    "rawFormat" TEXT,
    "rawHeaders" TEXT,
    "rawPayload" TEXT,
    "receivedDate" TIMESTAMP(3),
    "referenceIds" TEXT,
    "replyTo" TEXT,
    "sourceChannel" TEXT NOT NULL DEFAULT 'email',
    "sourceDirection" TEXT NOT NULL DEFAULT 'inbound',
    "sourceProvider" TEXT,
    "threadId" TEXT,
    "toAddresses" TEXT,

    CONSTRAINT "Email_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailAttachment" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "storageKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checksum" TEXT,
    "contentId" TEXT,
    "disposition" TEXT,
    "metadata" TEXT,

    CONSTRAINT "EmailAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "dossierId" TEXT,
    "numero" TEXT NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "tauxTVA" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "montantTVA" DOUBLE PRECISION NOT NULL,
    "montantTTC" DOUBLE PRECISION NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "dateEmission" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" TIMESTAMP(3) NOT NULL,
    "datePaiement" TIMESTAMP(3),
    "modePaiement" TEXT,
    "referencePayment" TEXT,
    "notes" TEXT,
    "conditions" TEXT,
    "pdfUrl" TEXT,
    "stripeInvoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Facture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformationStatusHistory" (
    "id" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "fromStatus" "InformationUnitStatus",
    "toStatus" "InformationUnitStatus" NOT NULL,
    "reason" TEXT,
    "changedBy" TEXT NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestampHash" TEXT,

    CONSTRAINT "InformationStatusHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InformationUnit" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "source" "InformationUnitSource" NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "currentStatus" "InformationUnitStatus" NOT NULL DEFAULT 'RECEIVED',
    "sourceMetadata" TEXT,
    "linkedWorkspaceId" TEXT,
    "metadata" TEXT,
    "lastStatusChangeBy" TEXT,
    "lastStatusChangeAt" TIMESTAMP(3),
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "classifiedAt" TIMESTAMP(3),
    "analyzedAt" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InformationUnit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurisprudence" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "juridiction" TEXT NOT NULL,
    "numero" TEXT,
    "chambre" TEXT,
    "formation" TEXT,
    "solution" TEXT,
    "resume" TEXT,
    "texte" TEXT NOT NULL,
    "url" TEXT,
    "themes" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'huggingface',
    "searchVector" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jurisprudence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalDeadline" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "DeadlineType" NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "referenceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "status" "DeadlineStatus" NOT NULL DEFAULT 'PENDING',
    "legalBasis" TEXT,
    "legalDays" INTEGER,
    "alertJ7Sent" BOOLEAN NOT NULL DEFAULT false,
    "alertJ3Sent" BOOLEAN NOT NULL DEFAULT false,
    "alertJ1Sent" BOOLEAN NOT NULL DEFAULT false,
    "alertSmsSent" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" TIMESTAMP(3),
    "suspendedReason" TEXT,
    "suspendedAt" TIMESTAMP(3),
    "suspendedBy" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "escalatedTo" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "completionNote" TEXT,
    "proofId" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalDeadline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LegalReference" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "article" TEXT NOT NULL,
    "version" TEXT,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "category" TEXT NOT NULL,
    "keywords" TEXT,
    "defaultDeadlineDays" INTEGER,
    "deadlineType" TEXT,
    "legifrance_url" TEXT,
    "eurlex_url" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneFacture" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "montantHT" DOUBLE PRECISION NOT NULL,
    "ordre" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LigneFacture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "data" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Paiement" (
    "id" TEXT NOT NULL,
    "factureId" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "mode" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "stripePaymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Paiement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" DOUBLE PRECISION NOT NULL,
    "priceYearly" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "maxWorkspaces" INTEGER NOT NULL DEFAULT 1,
    "maxDossiers" INTEGER NOT NULL DEFAULT 100,
    "maxClients" INTEGER NOT NULL DEFAULT 20,
    "maxStorageGb" INTEGER NOT NULL DEFAULT 5,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "aiAutonomyLevel" INTEGER NOT NULL DEFAULT 1,
    "humanValidation" BOOLEAN NOT NULL DEFAULT true,
    "advancedAnalytics" BOOLEAN NOT NULL DEFAULT false,
    "externalAiAccess" BOOLEAN NOT NULL DEFAULT false,
    "prioritySupport" BOOLEAN NOT NULL DEFAULT false,
    "customBranding" BOOLEAN NOT NULL DEFAULT false,
    "apiAccess" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proof" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "ProofType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dossierId" TEXT,
    "clientId" TEXT,
    "documentId" TEXT,
    "informationUnitId" TEXT,
    "fileStorageKey" TEXT,
    "fileHash" TEXT,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "proofDate" TIMESTAMP(3) NOT NULL,
    "capturedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedBy" TEXT NOT NULL,
    "status" "ProofStatus" NOT NULL DEFAULT 'PENDING_VALIDATION',
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "timestampHash" TEXT,
    "chainPreviousId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proof_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotaEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "quotaType" TEXT NOT NULL,
    "currentValue" DOUBLE PRECISION NOT NULL,
    "limitValue" DOUBLE PRECISION NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "eventType" TEXT NOT NULL,
    "actionTaken" TEXT,
    "metadata" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotaEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" "ReportType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "parameters" TEXT,
    "dossierId" TEXT,
    "clientId" TEXT,
    "periodStart" TIMESTAMP(3),
    "periodEnd" TIMESTAMP(3),
    "status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "fileStorageKey" TEXT,
    "fileMimeType" TEXT,
    "fileSize" INTEGER,
    "generatedAt" TIMESTAMP(3),
    "generatedBy" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL,
    "stripeEventId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'stripe',
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "payload" TEXT,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeSubscriptionId" TEXT,
    "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
    "currentPeriodStart" TIMESTAMP(3) NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "trialEnd" TIMESTAMP(3),
    "canceledAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "pricePerMonth" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "autoRenew" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TemplateVote" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "domain" TEXT,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "stripeCustomerId" TEXT,
    "trialEndsAt" TIMESTAMP(3),
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "vatNumber" TEXT,
    "currentWorkspaces" INTEGER NOT NULL DEFAULT 0,
    "currentDossiers" INTEGER NOT NULL DEFAULT 0,
    "currentClients" INTEGER NOT NULL DEFAULT 0,
    "currentStorageGb" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currentUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tenant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "ollamaEnabled" BOOLEAN NOT NULL DEFAULT true,
    "ollamaUrl" TEXT NOT NULL DEFAULT 'http://localhost:11434',
    "ollamaModel" TEXT NOT NULL DEFAULT 'llama3.2:latest',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPass" TEXT,
    "maxDossiers" INTEGER NOT NULL DEFAULT 100,
    "maxUsers" INTEGER NOT NULL DEFAULT 5,
    "storageLimit" INTEGER NOT NULL DEFAULT 1000,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitCost" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tenantId" TEXT,
    "clientId" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLogin" TIMESTAMP(3),
    "language" TEXT NOT NULL DEFAULT 'fr',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkflowExecution" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "workflowId" TEXT NOT NULL,
    "workflowName" TEXT NOT NULL,
    "emailId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "currentStep" TEXT,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "triggerType" TEXT NOT NULL DEFAULT 'email',
    "triggerData" TEXT,
    "steps" TEXT,
    "result" TEXT,
    "error" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkflowExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompteComptable" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "classe" INTEGER NOT NULL,
    "type" "TypeCompte" NOT NULL,
    "parentId" TEXT,
    "solde" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompteComptable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "libelle" TEXT NOT NULL,
    "type" "TypeJournal" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Journal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ecriture" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "journalId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "libelle" TEXT NOT NULL,
    "reference" TEXT,
    "factureId" TEXT,
    "dossierId" TEXT,
    "statut" "StatutEcriture" NOT NULL DEFAULT 'BROUILLON',
    "source" "SourceEcriture" NOT NULL DEFAULT 'MANUELLE',
    "validatedBy" TEXT,
    "validatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ecriture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneEcriture" (
    "id" TEXT NOT NULL,
    "ecritureId" TEXT NOT NULL,
    "compteId" TEXT NOT NULL,
    "libelle" TEXT,
    "debit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credit" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lettrage" TEXT,

    CONSTRAINT "LigneEcriture_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementBancaire" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "compteBancaire" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "libelle" TEXT NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "reference" TEXT,
    "isRapproche" BOOLEAN NOT NULL DEFAULT false,
    "ecritureId" TEXT,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementBancaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeclarationTVA" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "periode" TEXT NOT NULL,
    "regime" "RegimeTVA" NOT NULL,
    "tvaCollectee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tvaDeductible" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tvaNette" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "dateLimite" TIMESTAMP(3) NOT NULL,
    "declaredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeclarationTVA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MouvementCARPA" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "type" "TypeMouvementCARPA" NOT NULL,
    "montant" DOUBLE PRECISION NOT NULL,
    "libelle" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reference" TEXT,
    "soldeApres" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MouvementCARPA_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'email_verification',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIDecision" (
    "blockchainHash" TEXT,
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "decisionType" TEXT NOT NULL,
    "input" JSONB NOT NULL,
    "output" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "source" TEXT NOT NULL,
    "humanReviewed" BOOLEAN NOT NULL DEFAULT false,
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AIDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AIUsageLog_createdAt_idx" ON "AIUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AIUsageLog_tenantId_idx" ON "AIUsageLog"("tenantId");

-- CreateIndex
CREATE INDEX "ArchivePolicy_archiveAt_idx" ON "ArchivePolicy"("archiveAt");

-- CreateIndex
CREATE INDEX "ArchivePolicy_deleteAt_idx" ON "ArchivePolicy"("deleteAt");

-- CreateIndex
CREATE INDEX "ArchivePolicy_status_idx" ON "ArchivePolicy"("status");

-- CreateIndex
CREATE INDEX "ArchivePolicy_tenantId_idx" ON "ArchivePolicy"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ArchivePolicy_entityType_entityId_key" ON "ArchivePolicy"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_idx" ON "AuditLog"("tenantId");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_createdAt_idx" ON "AuditLog"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_hash_idx" ON "AuditLog"("hash");

-- CreateIndex
CREATE INDEX "CalendarEvent_dossierId_idx" ON "CalendarEvent"("dossierId");

-- CreateIndex
CREATE INDEX "CalendarEvent_tenantId_startDate_idx" ON "CalendarEvent"("tenantId", "startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_userId_idx" ON "CalendarEvent"("userId");

-- CreateIndex
CREATE INDEX "Client_tenantId_email_idx" ON "Client"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Client_tenantId_status_idx" ON "Client"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Client_tenantId_email_key" ON "Client"("tenantId", "email");

-- CreateIndex
CREATE INDEX "CommunityTemplate_isPublic_upvotes_idx" ON "CommunityTemplate"("isPublic", "upvotes");

-- CreateIndex
CREATE INDEX "CommunityTemplate_typeDossier_idx" ON "CommunityTemplate"("typeDossier");

-- CreateIndex
CREATE INDEX "DeadlineAlert_deadlineId_idx" ON "DeadlineAlert"("deadlineId");

-- CreateIndex
CREATE INDEX "Document_clientId_idx" ON "Document"("clientId");

-- CreateIndex
CREATE INDEX "Document_dossierId_idx" ON "Document"("dossierId");

-- CreateIndex
CREATE INDEX "Document_sha256_idx" ON "Document"("sha256");

-- CreateIndex
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");

-- CreateIndex
CREATE INDEX "Dossier_clientId_idx" ON "Dossier"("clientId");

-- CreateIndex
CREATE INDEX "Dossier_createdAt_idx" ON "Dossier"("createdAt");

-- CreateIndex
CREATE INDEX "Dossier_inboxEmail_idx" ON "Dossier"("inboxEmail");

-- CreateIndex
CREATE INDEX "Dossier_juridiction_outcome_idx" ON "Dossier"("juridiction", "outcome");

-- CreateIndex
CREATE INDEX "Dossier_priorite_idx" ON "Dossier"("priorite");

-- CreateIndex
CREATE INDEX "Dossier_statut_idx" ON "Dossier"("statut");

-- CreateIndex
CREATE INDEX "Dossier_tenantId_createdAt_idx" ON "Dossier"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Dossier_tenantId_priorite_idx" ON "Dossier"("tenantId", "priorite");

-- CreateIndex
CREATE INDEX "Dossier_tenantId_statut_idx" ON "Dossier"("tenantId", "statut");

-- CreateIndex
CREATE INDEX "Dossier_typeDossier_outcome_idx" ON "Dossier"("typeDossier", "outcome");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_tenantId_numero_key" ON "Dossier"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "TimeEntry_tenantId_userId_idx" ON "TimeEntry"("tenantId", "userId");

-- CreateIndex
CREATE INDEX "TimeEntry_tenantId_dossierId_idx" ON "TimeEntry"("tenantId", "dossierId");

-- CreateIndex
CREATE INDEX "TimeEntry_tenantId_date_idx" ON "TimeEntry"("tenantId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_isBillable_isBilled_idx" ON "TimeEntry"("isBillable", "isBilled");

-- CreateIndex
CREATE INDEX "DossierChecklistItem_dossierId_idx" ON "DossierChecklistItem"("dossierId");

-- CreateIndex
CREATE INDEX "DossierChecklistItem_status_idx" ON "DossierChecklistItem"("dossierId", "status");

-- CreateIndex
CREATE INDEX "Draft_sourceEmailId_idx" ON "Draft"("sourceEmailId");

-- CreateIndex
CREATE INDEX "Draft_tenantId_status_idx" ON "Draft"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Draft_tenantId_createdAt_idx" ON "Draft"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Draft_tenantId_status_createdAt_idx" ON "Draft"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailAccount_tenantId_idx" ON "EmailAccount"("tenantId");

-- CreateIndex
CREATE INDEX "EmailAccount_userId_idx" ON "EmailAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_tenantId_email_key" ON "EmailAccount"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Email_contentHash_idx" ON "Email"("contentHash");

-- CreateIndex
CREATE INDEX "Email_from_idx" ON "Email"("from");

-- CreateIndex
CREATE INDEX "Email_tenantId_category_idx" ON "Email"("tenantId", "category");

-- CreateIndex
CREATE INDEX "Email_tenantId_fromAddress_idx" ON "Email"("tenantId", "fromAddress");

-- CreateIndex
CREATE INDEX "Email_tenantId_isProcessed_idx" ON "Email"("tenantId", "isProcessed");

-- CreateIndex
CREATE INDEX "Email_tenantId_receivedDate_idx" ON "Email"("tenantId", "receivedDate");

-- CreateIndex
CREATE INDEX "Email_tenantId_sourceProvider_idx" ON "Email"("tenantId", "sourceProvider");

-- CreateIndex
CREATE INDEX "Email_tenantId_threadId_idx" ON "Email"("tenantId", "threadId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_tenantId_contentHash_key" ON "Email"("tenantId", "contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Email_tenantId_internetMessageId_key" ON "Email"("tenantId", "internetMessageId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_tenantId_messageId_key" ON "Email"("tenantId", "messageId");

-- CreateIndex
CREATE UNIQUE INDEX "Email_tenantId_providerMessageId_key" ON "Email"("tenantId", "providerMessageId");

-- CreateIndex
CREATE INDEX "EmailAttachment_emailId_idx" ON "EmailAttachment"("emailId");

-- CreateIndex
CREATE INDEX "Facture_clientId_idx" ON "Facture"("clientId");

-- CreateIndex
CREATE INDEX "Facture_dateEcheance_idx" ON "Facture"("dateEcheance");

-- CreateIndex
CREATE INDEX "Facture_tenantId_statut_idx" ON "Facture"("tenantId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_tenantId_numero_key" ON "Facture"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "InformationStatusHistory_changedAt_idx" ON "InformationStatusHistory"("changedAt");

-- CreateIndex
CREATE INDEX "InformationStatusHistory_unitId_idx" ON "InformationStatusHistory"("unitId");

-- CreateIndex
CREATE UNIQUE INDEX "InformationUnit_contentHash_key" ON "InformationUnit"("contentHash");

-- CreateIndex
CREATE INDEX "InformationUnit_contentHash_idx" ON "InformationUnit"("contentHash");

-- CreateIndex
CREATE INDEX "InformationUnit_currentStatus_idx" ON "InformationUnit"("currentStatus");

-- CreateIndex
CREATE INDEX "InformationUnit_tenantId_currentStatus_idx" ON "InformationUnit"("tenantId", "currentStatus");

-- CreateIndex
CREATE INDEX "InformationUnit_tenantId_idx" ON "InformationUnit"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Jurisprudence_externalId_key" ON "Jurisprudence"("externalId");

-- CreateIndex
CREATE INDEX "Jurisprudence_date_idx" ON "Jurisprudence"("date");

-- CreateIndex
CREATE INDEX "Jurisprudence_juridiction_idx" ON "Jurisprudence"("juridiction");

-- CreateIndex
CREATE INDEX "Jurisprudence_search_idx" ON "Jurisprudence" USING GIN ("searchVector");

-- CreateIndex
CREATE INDEX "Jurisprudence_themes_idx" ON "Jurisprudence"("themes");

-- CreateIndex
CREATE INDEX "LegalDeadline_dossierId_idx" ON "LegalDeadline"("dossierId");

-- CreateIndex
CREATE INDEX "LegalDeadline_dueDate_idx" ON "LegalDeadline"("dueDate");

-- CreateIndex
CREATE INDEX "LegalDeadline_status_dueDate_idx" ON "LegalDeadline"("status", "dueDate");

-- CreateIndex
CREATE INDEX "LegalDeadline_status_idx" ON "LegalDeadline"("status");

-- CreateIndex
CREATE INDEX "LegalDeadline_tenantId_status_idx" ON "LegalDeadline"("tenantId", "status");

-- CreateIndex
CREATE INDEX "LegalDeadline_tenantId_createdAt_idx" ON "LegalDeadline"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "LegalDeadline_tenantId_status_createdAt_idx" ON "LegalDeadline"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "LegalDeadline_acknowledgedBy_idx" ON "LegalDeadline"("acknowledgedBy");

-- CreateIndex
CREATE INDEX "LegalReference_category_idx" ON "LegalReference"("category");

-- CreateIndex
CREATE INDEX "LegalReference_code_idx" ON "LegalReference"("code");

-- CreateIndex
CREATE INDEX "LegalReference_isActive_idx" ON "LegalReference"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "LegalReference_code_article_version_key" ON "LegalReference"("code", "article", "version");

-- CreateIndex
CREATE INDEX "LigneFacture_factureId_idx" ON "LigneFacture"("factureId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "Paiement_factureId_idx" ON "Paiement"("factureId");

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE INDEX "Plan_isActive_idx" ON "Plan"("isActive");

-- CreateIndex
CREATE INDEX "Proof_dossierId_idx" ON "Proof"("dossierId");

-- CreateIndex
CREATE INDEX "Proof_proofDate_idx" ON "Proof"("proofDate");

-- CreateIndex
CREATE INDEX "Proof_status_idx" ON "Proof"("status");

-- CreateIndex
CREATE INDEX "Proof_tenantId_idx" ON "Proof"("tenantId");

-- CreateIndex
CREATE INDEX "Proof_type_idx" ON "Proof"("type");

-- CreateIndex
CREATE INDEX "QuotaEvent_occurredAt_idx" ON "QuotaEvent"("occurredAt");

-- CreateIndex
CREATE INDEX "QuotaEvent_quotaType_idx" ON "QuotaEvent"("quotaType");

-- CreateIndex
CREATE INDEX "QuotaEvent_tenantId_idx" ON "QuotaEvent"("tenantId");

-- CreateIndex
CREATE INDEX "Report_dossierId_idx" ON "Report"("dossierId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");

-- CreateIndex
CREATE INDEX "Report_tenantId_idx" ON "Report"("tenantId");

-- CreateIndex
CREATE INDEX "Report_tenantId_status_idx" ON "Report"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Report_tenantId_createdAt_idx" ON "Report"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Report_tenantId_status_createdAt_idx" ON "Report"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Report_type_idx" ON "Report"("type");

-- CreateIndex
CREATE UNIQUE INDEX "StripeWebhookEvent_stripeEventId_key" ON "StripeWebhookEvent"("stripeEventId");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent"("createdAt");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_provider_eventType_idx" ON "StripeWebhookEvent"("provider", "eventType");

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_status_idx" ON "StripeWebhookEvent"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_tenantId_key" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_tenantId_idx" ON "Subscription"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVote_templateId_userId_key" ON "TemplateVote"("templateId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_stripeCustomerId_key" ON "Tenant"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Tenant_planId_idx" ON "Tenant"("planId");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE INDEX "UsageRecord_createdAt_idx" ON "UsageRecord"("createdAt");

-- CreateIndex
CREATE INDEX "UsageRecord_tenantId_idx" ON "UsageRecord"("tenantId");

-- CreateIndex
CREATE INDEX "UsageRecord_type_idx" ON "UsageRecord"("type");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clientId_key" ON "User"("clientId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- CreateIndex
CREATE INDEX "User_tenantId_email_idx" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "WorkflowExecution_emailId_idx" ON "WorkflowExecution"("emailId");

-- CreateIndex
CREATE INDEX "WorkflowExecution_tenantId_status_idx" ON "WorkflowExecution"("tenantId", "status");

-- CreateIndex
CREATE INDEX "WorkflowExecution_tenantId_createdAt_idx" ON "WorkflowExecution"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowExecution_tenantId_status_createdAt_idx" ON "WorkflowExecution"("tenantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "WorkflowExecution_workflowId_idx" ON "WorkflowExecution"("workflowId");

-- CreateIndex
CREATE INDEX "CompteComptable_tenantId_classe_idx" ON "CompteComptable"("tenantId", "classe");

-- CreateIndex
CREATE INDEX "CompteComptable_tenantId_type_idx" ON "CompteComptable"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CompteComptable_tenantId_numero_key" ON "CompteComptable"("tenantId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Journal_tenantId_code_key" ON "Journal"("tenantId", "code");

-- CreateIndex
CREATE INDEX "Ecriture_tenantId_date_idx" ON "Ecriture"("tenantId", "date");

-- CreateIndex
CREATE INDEX "Ecriture_tenantId_statut_idx" ON "Ecriture"("tenantId", "statut");

-- CreateIndex
CREATE INDEX "Ecriture_factureId_idx" ON "Ecriture"("factureId");

-- CreateIndex
CREATE INDEX "Ecriture_dossierId_idx" ON "Ecriture"("dossierId");

-- CreateIndex
CREATE UNIQUE INDEX "Ecriture_tenantId_numero_key" ON "Ecriture"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "LigneEcriture_ecritureId_idx" ON "LigneEcriture"("ecritureId");

-- CreateIndex
CREATE INDEX "LigneEcriture_compteId_idx" ON "LigneEcriture"("compteId");

-- CreateIndex
CREATE INDEX "LigneEcriture_lettrage_idx" ON "LigneEcriture"("lettrage");

-- CreateIndex
CREATE INDEX "MouvementBancaire_tenantId_date_idx" ON "MouvementBancaire"("tenantId", "date");

-- CreateIndex
CREATE INDEX "MouvementBancaire_tenantId_isRapproche_idx" ON "MouvementBancaire"("tenantId", "isRapproche");

-- CreateIndex
CREATE UNIQUE INDEX "DeclarationTVA_tenantId_periode_key" ON "DeclarationTVA"("tenantId", "periode");

-- CreateIndex
CREATE INDEX "MouvementCARPA_tenantId_dossierId_idx" ON "MouvementCARPA"("tenantId", "dossierId");

-- CreateIndex
CREATE INDEX "MouvementCARPA_clientId_idx" ON "MouvementCARPA"("clientId");

-- CreateIndex
CREATE INDEX "MouvementCARPA_date_idx" ON "MouvementCARPA"("date");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_email_idx" ON "VerificationToken"("email");

-- CreateIndex
CREATE INDEX "VerificationToken_token_idx" ON "VerificationToken"("token");

-- CreateIndex
CREATE INDEX "VerificationToken_expiresAt_idx" ON "VerificationToken"("expiresAt");

-- CreateIndex
CREATE INDEX "AIDecision_tenantId_idx" ON "AIDecision"("tenantId");

-- CreateIndex
CREATE INDEX "AIDecision_entityId_idx" ON "AIDecision"("entityId");

-- CreateIndex
CREATE INDEX "AIDecision_createdAt_idx" ON "AIDecision"("createdAt");

-- AddForeignKey
ALTER TABLE "AIUsageLog" ADD CONSTRAINT "AIUsageLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivePolicy" ADD CONSTRAINT "ArchivePolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeadlineAlert" ADD CONSTRAINT "DeadlineAlert_deadlineId_fkey" FOREIGN KEY ("deadlineId") REFERENCES "LegalDeadline"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_createdDossierId_fkey" FOREIGN KEY ("createdDossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_sourceEmailId_fkey" FOREIGN KEY ("sourceEmailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Draft" ADD CONSTRAINT "Draft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Email" ADD CONSTRAINT "Email_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAttachment" ADD CONSTRAINT "EmailAttachment_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Facture" ADD CONSTRAINT "Facture_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationStatusHistory" ADD CONSTRAINT "InformationStatusHistory_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "InformationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationUnit" ADD CONSTRAINT "InformationUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDeadline" ADD CONSTRAINT "LegalDeadline_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDeadline" ADD CONSTRAINT "LegalDeadline_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDeadline" ADD CONSTRAINT "LegalDeadline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneFacture" ADD CONSTRAINT "LigneFacture_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Paiement" ADD CONSTRAINT "Paiement_factureId_fkey" FOREIGN KEY ("factureId") REFERENCES "Facture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_informationUnitId_fkey" FOREIGN KEY ("informationUnitId") REFERENCES "InformationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotaEvent" ADD CONSTRAINT "QuotaEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TenantSettings" ADD CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageRecord" ADD CONSTRAINT "UsageRecord_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteComptable" ADD CONSTRAINT "CompteComptable_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompteComptable" ADD CONSTRAINT "CompteComptable_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CompteComptable"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Journal" ADD CONSTRAINT "Journal_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ecriture" ADD CONSTRAINT "Ecriture_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ecriture" ADD CONSTRAINT "Ecriture_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneEcriture" ADD CONSTRAINT "LigneEcriture_ecritureId_fkey" FOREIGN KEY ("ecritureId") REFERENCES "Ecriture"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneEcriture" ADD CONSTRAINT "LigneEcriture_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "CompteComptable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementBancaire" ADD CONSTRAINT "MouvementBancaire_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DeclarationTVA" ADD CONSTRAINT "DeclarationTVA_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MouvementCARPA" ADD CONSTRAINT "MouvementCARPA_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

