-- AlterTable
ALTER TABLE "Dossier" ADD COLUMN "outcome" TEXT;
ALTER TABLE "Dossier" ADD COLUMN "outcomeDate" TIMESTAMP(3);
ALTER TABLE "Dossier" ADD COLUMN "outcomeNotes" TEXT;

-- CreateTable for community templates
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

-- CreateTable for template votes
CREATE TABLE "TemplateVote" (
    "id" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vote" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TemplateVote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunityTemplate_typeDossier_idx" ON "CommunityTemplate"("typeDossier");
CREATE INDEX "CommunityTemplate_isPublic_upvotes_idx" ON "CommunityTemplate"("isPublic", "upvotes");
CREATE UNIQUE INDEX "TemplateVote_templateId_userId_key" ON "TemplateVote"("templateId", "userId");

-- CreateIndex for tribunal stats
CREATE INDEX "Dossier_juridiction_outcome_idx" ON "Dossier"("juridiction", "outcome");
CREATE INDEX "Dossier_typeDossier_outcome_idx" ON "Dossier"("typeDossier", "outcome");
