-- CreateTable
CREATE TABLE "Plan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "priceMonthly" REAL NOT NULL,
    "priceYearly" REAL NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "subdomain" TEXT NOT NULL,
    "domain" TEXT,
    "planId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "trialEndsAt" DATETIME,
    "billingEmail" TEXT,
    "billingAddress" TEXT,
    "vatNumber" TEXT,
    "currentDossiers" INTEGER NOT NULL DEFAULT 0,
    "currentClients" INTEGER NOT NULL DEFAULT 0,
    "currentStorageGb" REAL NOT NULL DEFAULT 0,
    "currentUsers" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tenant_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TenantSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TenantSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "tenantId" TEXT,
    "clientId" TEXT,
    "avatar" TEXT,
    "phone" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lastLogin" DATETIME,
    "language" TEXT NOT NULL DEFAULT 'fr',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Paris',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "User_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "procedureType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "urgencyLevel" TEXT NOT NULL DEFAULT 'moyen',
    "notificationDate" DATETIME,
    "deadlineDate" DATETIME,
    "closedAt" DATETIME,
    "createdById" TEXT NOT NULL,
    "assignedToId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workspace_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Workspace_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChecklistItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ChecklistItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "storagePath" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "description" TEXT,
    "aiProcessed" BOOLEAN NOT NULL DEFAULT false,
    "aiExtractedData" TEXT,
    "aiConfidence" REAL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" DATETIME,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkspaceDocument_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceDocument_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "draftType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "reviewedById" TEXT,
    "reviewedAt" DATETIME,
    "exported" BOOLEAN NOT NULL DEFAULT false,
    "exportedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkspaceDraft_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WorkspaceAlert_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TimelineEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TimelineEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TenantMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "workspacesCreated" INTEGER NOT NULL DEFAULT 0,
    "workspacesClosed" INTEGER NOT NULL DEFAULT 0,
    "documentsUploaded" INTEGER NOT NULL DEFAULT 0,
    "aiCallsTotal" INTEGER NOT NULL DEFAULT 0,
    "averageTimeToClose" REAL,
    "deadlinesRespected" INTEGER NOT NULL DEFAULT 0,
    "deadlinesMissed" INTEGER NOT NULL DEFAULT 0,
    "oqtfCount" INTEGER NOT NULL DEFAULT 0,
    "asileCount" INTEGER NOT NULL DEFAULT 0,
    "titreCount" INTEGER NOT NULL DEFAULT 0,
    "regroupementCount" INTEGER NOT NULL DEFAULT 0,
    "naturalisationCount" INTEGER NOT NULL DEFAULT 0,
    "aiSuggestionsAccepted" INTEGER NOT NULL DEFAULT 0,
    "aiSuggestionsRejected" INTEGER NOT NULL DEFAULT 0,
    "aiDraftsUsed" INTEGER NOT NULL DEFAULT 0,
    "aiCostEur" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TenantMetrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Jurisprudence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jurisdiction" TEXT NOT NULL,
    "decisionNumber" TEXT,
    "decisionDate" DATETIME NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "url" TEXT,
    "procedureTypes" TEXT NOT NULL,
    "articles" TEXT NOT NULL,
    "keywords" TEXT NOT NULL,
    "fullText" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ClientWorkspace" (
    "clientId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'primary',

    PRIMARY KEY ("clientId", "workspaceId"),
    CONSTRAINT "ClientWorkspace_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClientWorkspace_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "dateOfBirth" DATETIME,
    "lieuNaissance" TEXT,
    "nationality" TEXT,
    "nationaliteOrigine" TEXT,
    "address" TEXT,
    "codePostal" TEXT,
    "ville" TEXT,
    "pays" TEXT NOT NULL DEFAULT 'France',
    "adresseCorrespondance" TEXT,
    "codePostalCorrespondance" TEXT,
    "villeCorrespondance" TEXT,
    "paysCorrespondance" TEXT,
    "passportNumber" TEXT,
    "passportExpiry" DATETIME,
    "passportCountry" TEXT,
    "idCardNumber" TEXT,
    "idCardExpiry" DATETIME,
    "titreSejourNumber" TEXT,
    "titreSejourType" TEXT,
    "titreSejourExpiry" DATETIME,
    "numeroOFII" TEXT,
    "numeroAgrefe" TEXT,
    "situationFamiliale" TEXT,
    "nombreEnfants" INTEGER DEFAULT 0,
    "personneACharge" INTEGER DEFAULT 0,
    "profession" TEXT,
    "employeur" TEXT,
    "secteurActivite" TEXT,
    "situationPro" TEXT,
    "revenusAnnuels" REAL,
    "iban" TEXT,
    "bic" TEXT,
    "titulaireBancaire" TEXT,
    "contactUrgenceNom" TEXT,
    "contactUrgenceLien" TEXT,
    "contactUrgenceTel" TEXT,
    "languePrincipale" TEXT NOT NULL DEFAULT 'fr',
    "languesSecondaires" TEXT,
    "prefCommunication" TEXT NOT NULL DEFAULT 'email',
    "accepteNotifications" BOOLEAN NOT NULL DEFAULT true,
    "accepteNewsletter" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "categorie" TEXT,
    "source" TEXT,
    "qualite" TEXT,
    "scoreRisque" INTEGER,
    "tarifHoraire" REAL,
    "plafondHoraire" REAL,
    "modeFacturation" TEXT,
    "delaiPaiement" INTEGER DEFAULT 30,
    "origineClient" TEXT,
    "datePremiereVisite" DATETIME,
    "dateDernierContact" DATETIME,
    "frequenceContact" TEXT,
    "satisfactionScore" INTEGER,
    "niveauConfidentialite" TEXT NOT NULL DEFAULT 'normal',
    "consentementRGPD" BOOLEAN NOT NULL DEFAULT false,
    "dateConsentementRGPD" DATETIME,
    "notes" TEXT,
    "notesPrivees" TEXT,
    "tags" TEXT,
    "couleurEtiquette" TEXT,
    "emoji" TEXT,
    "dateArchivage" DATETIME,
    "raisonArchivage" TEXT,
    "champsPersonnalises" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Client_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "typeDossier" TEXT NOT NULL,
    "articleCeseda" TEXT,
    "categorieJuridique" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'en_cours',
    "priorite" TEXT NOT NULL DEFAULT 'normale',
    "phase" TEXT NOT NULL DEFAULT 'instruction',
    "dateCreation" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateOuverture" DATETIME,
    "dateEcheance" DATETIME,
    "dateProchaineEtape" DATETIME,
    "dateCloture" DATETIME,
    "dateArchivage" DATETIME,
    "juridiction" TEXT,
    "numeroJuridiction" TEXT,
    "typeRecours" TEXT,
    "instanceRecours" TEXT,
    "responsableId" TEXT,
    "collaborateurs" TEXT,
    "avocatAdverse" TEXT,
    "objet" TEXT,
    "description" TEXT,
    "contexteLegal" TEXT,
    "notes" TEXT,
    "notesPrivees" TEXT,
    "honorairesEstimes" REAL,
    "honorairesReel" REAL,
    "avanceSurFrais" REAL,
    "fraisDossier" REAL,
    "tauxHoraire" REAL,
    "tempsEstime" INTEGER,
    "tempsReel" INTEGER,
    "modeFacturation" TEXT,
    "niveauConfidentialite" TEXT NOT NULL DEFAULT 'normal',
    "accessRestreint" BOOLEAN NOT NULL DEFAULT false,
    "autorisationsAcces" TEXT,
    "dureeConservation" INTEGER,
    "dateDestructionPrevue" DATETIME,
    "archivePhysique" TEXT,
    "archiveNumerique" TEXT,
    "etapesWorkflow" TEXT,
    "checklistItems" TEXT,
    "jalons" TEXT,
    "aiAnalysis" TEXT,
    "riskScore" INTEGER,
    "successProbability" INTEGER,
    "aiRecommendations" TEXT,
    "aiSummary" TEXT,
    "predictedOutcome" TEXT,
    "tempsReponseJuridiction" INTEGER,
    "tauxReussite" REAL,
    "scoreComplexite" INTEGER,
    "dossiersPrecedents" TEXT,
    "jurisprudence" TEXT,
    "dossiersLies" TEXT,
    "dernierContactClient" DATETIME,
    "prochaineRelance" DATETIME,
    "frequenceRelance" TEXT,
    "canalContact" TEXT,
    "tags" TEXT,
    "couleurEtiquette" TEXT,
    "emoji" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastActivityAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Dossier_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Dossier_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Echeance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateEcheance" DATETIME NOT NULL,
    "dateReference" DATETIME,
    "delaiJours" INTEGER,
    "statut" TEXT NOT NULL DEFAULT 'a_venir',
    "priorite" TEXT NOT NULL DEFAULT 'normale',
    "source" TEXT NOT NULL DEFAULT 'manuel',
    "aiConfidence" REAL,
    "extractedText" TEXT,
    "documentId" TEXT,
    "validePar" TEXT,
    "valideAt" DATETIME,
    "rappelAvant" INTEGER NOT NULL DEFAULT 7,
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "dateRappel" DATETIME,
    "notificationEnvoyee" BOOLEAN NOT NULL DEFAULT false,
    "rappelJ7" BOOLEAN NOT NULL DEFAULT false,
    "rappelJ3" BOOLEAN NOT NULL DEFAULT false,
    "rappelJ1" BOOLEAN NOT NULL DEFAULT false,
    "metadata" TEXT,
    "completedAt" DATETIME,
    "cancelledAt" DATETIME,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Echeance_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Echeance_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Facture" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "dossierId" TEXT,
    "clientName" TEXT NOT NULL,
    "montant" REAL NOT NULL,
    "devise" TEXT NOT NULL DEFAULT 'EUR',
    "statut" TEXT NOT NULL DEFAULT 'brouillon',
    "dateEmission" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateEcheance" DATETIME NOT NULL,
    "datePaiement" DATETIME,
    "description" TEXT,
    "notes" TEXT,
    "methodePaiement" TEXT,
    "referencePaiement" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Facture_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Facture_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RendezVous" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dossierId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "dateDebut" DATETIME NOT NULL,
    "dateFin" DATETIME NOT NULL,
    "lieu" TEXT,
    "lienVisio" TEXT,
    "statut" TEXT NOT NULL DEFAULT 'planifie',
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RendezVous_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dossierId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "documentType" TEXT,
    "extractedText" TEXT,
    "aiAnalysis" TEXT,
    "confidenceScore" REAL,
    "uploadedBy" TEXT,
    "hash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "hash" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changeReason" TEXT,
    "metadata" TEXT,
    CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "userId" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectId" TEXT,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "hash" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "errorMessage" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aIActionId" TEXT,
    CONSTRAINT "AuditLog_aIActionId_fkey" FOREIGN KEY ("aIActionId") REFERENCES "AIAction" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIAction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actionType" TEXT NOT NULL,
    "autonomyLevel" TEXT NOT NULL,
    "confidence" REAL NOT NULL,
    "requiresValidation" BOOLEAN NOT NULL,
    "validationLevel" TEXT NOT NULL,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "content" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "dossierId" TEXT,
    "tenantId" TEXT NOT NULL,
    "createdBy" TEXT NOT NULL DEFAULT 'IA_POSTE_MANAGER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "validationComment" TEXT,
    "metadata" TEXT,
    CONSTRAINT "AIAction_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AIAction_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "deadline" DATETIME,
    "suggestedAction" TEXT,
    "notificationChannels" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "snoozedUntil" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Alert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentDraft" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "documentType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dossierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "placeholders" TEXT NOT NULL,
    "validationLevel" TEXT NOT NULL,
    "validationStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "recipient" TEXT,
    "attachments" TEXT,
    "createdBy" TEXT NOT NULL DEFAULT 'IA_POSTE_MANAGER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "sentBy" TEXT,
    "sentAt" DATETIME,
    CONSTRAINT "DocumentDraft_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DocumentDraft_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CollectionForm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formType" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "questions" TEXT NOT NULL,
    "estimatedTime" TEXT NOT NULL,
    "responses" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SENT',
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "reminders" TEXT,
    CONSTRAINT "CollectionForm_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CollectionForm_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodStart" DATETIME NOT NULL,
    "periodEnd" DATETIME NOT NULL,
    "draftRejectionRate" REAL NOT NULL,
    "classificationErrorRate" REAL NOT NULL,
    "avgValidationTime" REAL NOT NULL,
    "untreatedEscalations" INTEGER NOT NULL,
    "actionsByType" TEXT NOT NULL,
    "avgConfidence" REAL NOT NULL,
    "calculatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIMetrics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TacheDossier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dossierId" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "priorite" TEXT NOT NULL DEFAULT 'normale',
    "statut" TEXT NOT NULL DEFAULT 'a_faire',
    "assigneA" TEXT,
    "dateEcheance" DATETIME,
    "dateDebut" DATETIME,
    "dateFin" DATETIME,
    "tempsEstime" INTEGER,
    "tempsReel" INTEGER,
    "dependances" TEXT,
    "sousCategorie" TEXT,
    "rappelEnvoye" BOOLEAN NOT NULL DEFAULT false,
    "rappelDate" DATETIME,
    "pieceJointes" TEXT,
    "commentaires" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "completedBy" TEXT,
    CONSTRAINT "TacheDossier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvenementDossier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dossierId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "description" TEXT,
    "dateEvenement" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateSaisie" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "auteur" TEXT,
    "participants" TEXT,
    "importance" TEXT NOT NULL DEFAULT 'normale',
    "categorie" TEXT,
    "localisation" TEXT,
    "duree" INTEGER,
    "documentsLies" TEXT,
    "resultats" TEXT,
    "suitesDonner" TEXT,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EvenementDossier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommentaireDossier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "dossierId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurNom" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'note',
    "important" BOOLEAN NOT NULL DEFAULT false,
    "prive" BOOLEAN NOT NULL DEFAULT false,
    "reponseA" TEXT,
    "mentions" TEXT,
    "pieceJointes" TEXT,
    "tags" TEXT,
    "modifie" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "editedAt" DATETIME,
    CONSTRAINT "CommentaireDossier_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Email" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "messageId" TEXT NOT NULL,
    "threadId" TEXT,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyText" TEXT,
    "bodyHtml" TEXT,
    "receivedDate" DATETIME NOT NULL,
    "tenantId" TEXT,
    "clientId" TEXT,
    "dossierId" TEXT,
    "attachments" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isStarred" BOOLEAN NOT NULL DEFAULT false,
    "needsResponse" BOOLEAN NOT NULL DEFAULT false,
    "responseGenerated" BOOLEAN NOT NULL DEFAULT false,
    "responseDraft" TEXT,
    "trackingNumbers" TEXT,
    "extractedDates" TEXT,
    "extractedPhones" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Email_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Email_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Email_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailClassification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "emailId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "tags" TEXT,
    "suggestedAction" TEXT,
    "actionTaken" TEXT,
    "actionTakenBy" TEXT,
    "actionTakenAt" DATETIME,
    "validated" BOOLEAN NOT NULL DEFAULT false,
    "validatedBy" TEXT,
    "validatedAt" DATETIME,
    "correctedType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmailClassification_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "tenantId" TEXT,
    "dossierId" TEXT,
    "subject" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" DATETIME,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "attachments" TEXT,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Message_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FormSubmission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "formType" TEXT NOT NULL,
    "submitterId" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "data" TEXT NOT NULL,
    "impactScore" INTEGER,
    "impactAreas" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvalLevel" INTEGER NOT NULL DEFAULT 0,
    "aiAnalysis" TEXT,
    "metadata" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StrategicDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "context" TEXT,
    "proposedSolution" TEXT NOT NULL,
    "expectedImpact" TEXT,
    "risks" TEXT,
    "timeline" TEXT,
    "kpis" TEXT,
    "riskScore" INTEGER,
    "impactScore" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending-approval',
    "submitterId" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "rejectedBy" TEXT,
    "rejectedAt" DATETIME,
    "rejectionNote" TEXT,
    "implementedAt" DATETIME,
    "implementedBy" TEXT,
    "implementStatus" TEXT,
    "kpiResults" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RiskAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "probability" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "riskScore" INTEGER NOT NULL,
    "priorityLevel" TEXT NOT NULL,
    "mitigationPlan" TEXT,
    "responsiblePerson" TEXT,
    "targetDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'active',
    "submitterId" TEXT NOT NULL,
    "submitterEmail" TEXT NOT NULL,
    "reviewDate" DATETIME,
    "lastReviewed" DATETIME,
    "reviewedBy" TEXT,
    "aiActionPlan" TEXT,
    "materialized" BOOLEAN NOT NULL DEFAULT false,
    "materializedAt" DATETIME,
    "actualImpact" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ApprovalTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "submissionId" TEXT NOT NULL,
    "approverRole" TEXT NOT NULL,
    "approverEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "level" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "decision" TEXT,
    "comments" TEXT,
    "decidedAt" DATETIME,
    "decidedBy" TEXT,
    "dueDate" DATETIME,
    "reminded" BOOLEAN NOT NULL DEFAULT false,
    "remindedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ApprovalTask_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "FormSubmission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "targetRole" TEXT,
    "targetEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "actionUrl" TEXT,
    "acknowledgedBy" TEXT,
    "acknowledgedAt" DATETIME,
    "resolvedBy" TEXT,
    "resolvedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SystemAlert_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "query" TEXT NOT NULL,
    "resultCount" INTEGER NOT NULL,
    "executionTime" REAL NOT NULL,
    "types" TEXT,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SearchLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Plan_name_key" ON "Plan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_subdomain_key" ON "Tenant"("subdomain");

-- CreateIndex
CREATE UNIQUE INDEX "Tenant_domain_key" ON "Tenant"("domain");

-- CreateIndex
CREATE INDEX "Tenant_planId_idx" ON "Tenant"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "TenantSettings_tenantId_key" ON "TenantSettings"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_clientId_key" ON "User"("clientId");

-- CreateIndex
CREATE INDEX "User_tenantId_email_idx" ON "User"("tenantId", "email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Workspace_reference_key" ON "Workspace"("reference");

-- CreateIndex
CREATE INDEX "Workspace_tenantId_idx" ON "Workspace"("tenantId");

-- CreateIndex
CREATE INDEX "Workspace_clientId_idx" ON "Workspace"("clientId");

-- CreateIndex
CREATE INDEX "Workspace_procedureType_idx" ON "Workspace"("procedureType");

-- CreateIndex
CREATE INDEX "Workspace_status_idx" ON "Workspace"("status");

-- CreateIndex
CREATE INDEX "Workspace_urgencyLevel_idx" ON "Workspace"("urgencyLevel");

-- CreateIndex
CREATE INDEX "Workspace_deadlineDate_idx" ON "Workspace"("deadlineDate");

-- CreateIndex
CREATE INDEX "ChecklistItem_workspaceId_idx" ON "ChecklistItem"("workspaceId");

-- CreateIndex
CREATE INDEX "ChecklistItem_category_idx" ON "ChecklistItem"("category");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_tenantId_idx" ON "WorkspaceDocument"("tenantId");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_workspaceId_idx" ON "WorkspaceDocument"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceDocument_documentType_idx" ON "WorkspaceDocument"("documentType");

-- CreateIndex
CREATE INDEX "WorkspaceDraft_workspaceId_idx" ON "WorkspaceDraft"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceDraft_status_idx" ON "WorkspaceDraft"("status");

-- CreateIndex
CREATE INDEX "WorkspaceAlert_workspaceId_idx" ON "WorkspaceAlert"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceAlert_level_idx" ON "WorkspaceAlert"("level");

-- CreateIndex
CREATE INDEX "WorkspaceAlert_read_idx" ON "WorkspaceAlert"("read");

-- CreateIndex
CREATE INDEX "TimelineEvent_workspaceId_idx" ON "TimelineEvent"("workspaceId");

-- CreateIndex
CREATE INDEX "TimelineEvent_createdAt_idx" ON "TimelineEvent"("createdAt");

-- CreateIndex
CREATE INDEX "TenantMetrics_tenantId_period_idx" ON "TenantMetrics"("tenantId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "TenantMetrics_tenantId_period_key" ON "TenantMetrics"("tenantId", "period");

-- CreateIndex
CREATE INDEX "Jurisprudence_jurisdiction_idx" ON "Jurisprudence"("jurisdiction");

-- CreateIndex
CREATE INDEX "Jurisprudence_decisionDate_idx" ON "Jurisprudence"("decisionDate");

-- CreateIndex
CREATE INDEX "ClientWorkspace_clientId_idx" ON "ClientWorkspace"("clientId");

-- CreateIndex
CREATE INDEX "ClientWorkspace_workspaceId_idx" ON "ClientWorkspace"("workspaceId");

-- CreateIndex
CREATE INDEX "Client_tenantId_email_idx" ON "Client"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Client_tenantId_status_idx" ON "Client"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Client_lastName_firstName_idx" ON "Client"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "Client_lastActivityAt_idx" ON "Client"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "Client_tenantId_email_key" ON "Client"("tenantId", "email");

-- CreateIndex
CREATE INDEX "Dossier_tenantId_statut_idx" ON "Dossier"("tenantId", "statut");

-- CreateIndex
CREATE INDEX "Dossier_tenantId_priorite_idx" ON "Dossier"("tenantId", "priorite");

-- CreateIndex
CREATE INDEX "Dossier_tenantId_phase_idx" ON "Dossier"("tenantId", "phase");

-- CreateIndex
CREATE INDEX "Dossier_clientId_idx" ON "Dossier"("clientId");

-- CreateIndex
CREATE INDEX "Dossier_responsableId_idx" ON "Dossier"("responsableId");

-- CreateIndex
CREATE INDEX "Dossier_dateEcheance_idx" ON "Dossier"("dateEcheance");

-- CreateIndex
CREATE INDEX "Dossier_dateProchaineEtape_idx" ON "Dossier"("dateProchaineEtape");

-- CreateIndex
CREATE INDEX "Dossier_lastActivityAt_idx" ON "Dossier"("lastActivityAt");

-- CreateIndex
CREATE UNIQUE INDEX "Dossier_tenantId_numero_key" ON "Dossier"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "Echeance_tenantId_idx" ON "Echeance"("tenantId");

-- CreateIndex
CREATE INDEX "Echeance_dossierId_idx" ON "Echeance"("dossierId");

-- CreateIndex
CREATE INDEX "Echeance_dateEcheance_idx" ON "Echeance"("dateEcheance");

-- CreateIndex
CREATE INDEX "Echeance_statut_idx" ON "Echeance"("statut");

-- CreateIndex
CREATE INDEX "Echeance_priorite_idx" ON "Echeance"("priorite");

-- CreateIndex
CREATE INDEX "Echeance_type_idx" ON "Echeance"("type");

-- CreateIndex
CREATE INDEX "Echeance_source_idx" ON "Echeance"("source");

-- CreateIndex
CREATE INDEX "Facture_tenantId_statut_idx" ON "Facture"("tenantId", "statut");

-- CreateIndex
CREATE INDEX "Facture_tenantId_dateEcheance_idx" ON "Facture"("tenantId", "dateEcheance");

-- CreateIndex
CREATE UNIQUE INDEX "Facture_tenantId_numero_key" ON "Facture"("tenantId", "numero");

-- CreateIndex
CREATE INDEX "RendezVous_dossierId_idx" ON "RendezVous"("dossierId");

-- CreateIndex
CREATE INDEX "RendezVous_dateDebut_idx" ON "RendezVous"("dateDebut");

-- CreateIndex
CREATE INDEX "Document_dossierId_idx" ON "Document"("dossierId");

-- CreateIndex
CREATE INDEX "DocumentVersion_documentId_version_idx" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_version_key" ON "DocumentVersion"("documentId", "version");

-- CreateIndex
CREATE INDEX "AuditLog_tenantId_timestamp_idx" ON "AuditLog"("tenantId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_action_timestamp_idx" ON "AuditLog"("action", "timestamp");

-- CreateIndex
CREATE INDEX "AuditLog_objectType_objectId_idx" ON "AuditLog"("objectType", "objectId");

-- CreateIndex
CREATE INDEX "AIAction_tenantId_actionType_idx" ON "AIAction"("tenantId", "actionType");

-- CreateIndex
CREATE INDEX "AIAction_tenantId_validationStatus_idx" ON "AIAction"("tenantId", "validationStatus");

-- CreateIndex
CREATE INDEX "AIAction_dossierId_idx" ON "AIAction"("dossierId");

-- CreateIndex
CREATE INDEX "AIAction_createdAt_idx" ON "AIAction"("createdAt");

-- CreateIndex
CREATE INDEX "Alert_tenantId_severity_idx" ON "Alert"("tenantId", "severity");

-- CreateIndex
CREATE INDEX "Alert_dossierId_idx" ON "Alert"("dossierId");

-- CreateIndex
CREATE INDEX "Alert_read_idx" ON "Alert"("read");

-- CreateIndex
CREATE INDEX "DocumentDraft_tenantId_status_idx" ON "DocumentDraft"("tenantId", "status");

-- CreateIndex
CREATE INDEX "DocumentDraft_dossierId_idx" ON "DocumentDraft"("dossierId");

-- CreateIndex
CREATE INDEX "CollectionForm_tenantId_status_idx" ON "CollectionForm"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CollectionForm_dossierId_idx" ON "CollectionForm"("dossierId");

-- CreateIndex
CREATE INDEX "AIMetrics_tenantId_period_idx" ON "AIMetrics"("tenantId", "period");

-- CreateIndex
CREATE INDEX "AIMetrics_periodStart_idx" ON "AIMetrics"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "AIMetrics_tenantId_period_periodStart_key" ON "AIMetrics"("tenantId", "period", "periodStart");

-- CreateIndex
CREATE INDEX "TacheDossier_dossierId_idx" ON "TacheDossier"("dossierId");

-- CreateIndex
CREATE INDEX "TacheDossier_assigneA_idx" ON "TacheDossier"("assigneA");

-- CreateIndex
CREATE INDEX "TacheDossier_statut_idx" ON "TacheDossier"("statut");

-- CreateIndex
CREATE INDEX "TacheDossier_dateEcheance_idx" ON "TacheDossier"("dateEcheance");

-- CreateIndex
CREATE INDEX "EvenementDossier_dossierId_idx" ON "EvenementDossier"("dossierId");

-- CreateIndex
CREATE INDEX "EvenementDossier_dateEvenement_idx" ON "EvenementDossier"("dateEvenement");

-- CreateIndex
CREATE INDEX "EvenementDossier_type_idx" ON "EvenementDossier"("type");

-- CreateIndex
CREATE INDEX "EvenementDossier_importance_idx" ON "EvenementDossier"("importance");

-- CreateIndex
CREATE INDEX "CommentaireDossier_dossierId_idx" ON "CommentaireDossier"("dossierId");

-- CreateIndex
CREATE INDEX "CommentaireDossier_auteurId_idx" ON "CommentaireDossier"("auteurId");

-- CreateIndex
CREATE INDEX "CommentaireDossier_createdAt_idx" ON "CommentaireDossier"("createdAt");

-- CreateIndex
CREATE INDEX "CommentaireDossier_important_idx" ON "CommentaireDossier"("important");

-- CreateIndex
CREATE UNIQUE INDEX "Email_messageId_key" ON "Email"("messageId");

-- CreateIndex
CREATE INDEX "Email_tenantId_idx" ON "Email"("tenantId");

-- CreateIndex
CREATE INDEX "Email_clientId_idx" ON "Email"("clientId");

-- CreateIndex
CREATE INDEX "Email_dossierId_idx" ON "Email"("dossierId");

-- CreateIndex
CREATE INDEX "Email_receivedDate_idx" ON "Email"("receivedDate");

-- CreateIndex
CREATE INDEX "Email_isRead_idx" ON "Email"("isRead");

-- CreateIndex
CREATE UNIQUE INDEX "EmailClassification_emailId_key" ON "EmailClassification"("emailId");

-- CreateIndex
CREATE INDEX "EmailClassification_type_idx" ON "EmailClassification"("type");

-- CreateIndex
CREATE INDEX "EmailClassification_priority_idx" ON "EmailClassification"("priority");

-- CreateIndex
CREATE INDEX "EmailClassification_confidence_idx" ON "EmailClassification"("confidence");

-- CreateIndex
CREATE INDEX "EmailClassification_validated_idx" ON "EmailClassification"("validated");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_tenantId_idx" ON "Message"("tenantId");

-- CreateIndex
CREATE INDEX "Message_dossierId_idx" ON "Message"("dossierId");

-- CreateIndex
CREATE INDEX "Message_isRead_idx" ON "Message"("isRead");

-- CreateIndex
CREATE INDEX "Message_type_idx" ON "Message"("type");

-- CreateIndex
CREATE INDEX "Message_createdAt_idx" ON "Message"("createdAt");

-- CreateIndex
CREATE INDEX "FormSubmission_formType_idx" ON "FormSubmission"("formType");

-- CreateIndex
CREATE INDEX "FormSubmission_status_idx" ON "FormSubmission"("status");

-- CreateIndex
CREATE INDEX "FormSubmission_submitterId_idx" ON "FormSubmission"("submitterId");

-- CreateIndex
CREATE INDEX "FormSubmission_impactScore_idx" ON "FormSubmission"("impactScore");

-- CreateIndex
CREATE INDEX "FormSubmission_submittedAt_idx" ON "FormSubmission"("submittedAt");

-- CreateIndex
CREATE INDEX "StrategicDecision_status_idx" ON "StrategicDecision"("status");

-- CreateIndex
CREATE INDEX "StrategicDecision_submitterId_idx" ON "StrategicDecision"("submitterId");

-- CreateIndex
CREATE INDEX "StrategicDecision_riskScore_idx" ON "StrategicDecision"("riskScore");

-- CreateIndex
CREATE INDEX "StrategicDecision_impactScore_idx" ON "StrategicDecision"("impactScore");

-- CreateIndex
CREATE INDEX "RiskAssessment_category_idx" ON "RiskAssessment"("category");

-- CreateIndex
CREATE INDEX "RiskAssessment_priorityLevel_idx" ON "RiskAssessment"("priorityLevel");

-- CreateIndex
CREATE INDEX "RiskAssessment_status_idx" ON "RiskAssessment"("status");

-- CreateIndex
CREATE INDEX "RiskAssessment_riskScore_idx" ON "RiskAssessment"("riskScore");

-- CreateIndex
CREATE INDEX "RiskAssessment_submitterId_idx" ON "RiskAssessment"("submitterId");

-- CreateIndex
CREATE INDEX "RiskAssessment_targetDate_idx" ON "RiskAssessment"("targetDate");

-- CreateIndex
CREATE INDEX "ApprovalTask_submissionId_idx" ON "ApprovalTask"("submissionId");

-- CreateIndex
CREATE INDEX "ApprovalTask_status_idx" ON "ApprovalTask"("status");

-- CreateIndex
CREATE INDEX "ApprovalTask_approverRole_idx" ON "ApprovalTask"("approverRole");

-- CreateIndex
CREATE INDEX "ApprovalTask_level_idx" ON "ApprovalTask"("level");

-- CreateIndex
CREATE INDEX "ApprovalTask_dueDate_idx" ON "ApprovalTask"("dueDate");

-- CreateIndex
CREATE INDEX "SystemAlert_tenantId_idx" ON "SystemAlert"("tenantId");

-- CreateIndex
CREATE INDEX "SystemAlert_type_idx" ON "SystemAlert"("type");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_status_idx" ON "SystemAlert"("status");

-- CreateIndex
CREATE INDEX "SearchLog_userId_idx" ON "SearchLog"("userId");

-- CreateIndex
CREATE INDEX "SearchLog_tenantId_idx" ON "SearchLog"("tenantId");

-- CreateIndex
CREATE INDEX "SearchLog_createdAt_idx" ON "SearchLog"("createdAt");

-- CreateIndex
CREATE INDEX "SearchLog_query_idx" ON "SearchLog"("query");
