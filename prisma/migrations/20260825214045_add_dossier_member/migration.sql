-- CreateEnum
CREATE TYPE "DossierMemberRole" AS ENUM ('OWNER', 'RESPONSIBLE', 'ATTORNEY', 'COLLABORATOR', 'VIEWER');

-- CreateTable
CREATE TABLE "DossierMember" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "dossierId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "DossierMemberRole" NOT NULL DEFAULT 'COLLABORATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DossierMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DossierMember_tenantId_idx" ON "DossierMember"("tenantId");

-- CreateIndex
CREATE INDEX "DossierMember_dossierId_idx" ON "DossierMember"("dossierId");

-- CreateIndex
CREATE INDEX "DossierMember_userId_idx" ON "DossierMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "DossierMember_dossierId_userId_key" ON "DossierMember"("dossierId", "userId");

-- AddForeignKey
ALTER TABLE "DossierMember" ADD CONSTRAINT "DossierMember_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DossierMember" ADD CONSTRAINT "DossierMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
