/*
  Warnings:

  - You are about to drop the `MissingElement` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ProposedAction` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReasoningTrace` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ReasoningTransition` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkspaceReasoning` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MissingElement" DROP CONSTRAINT "MissingElement_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "ProposedAction" DROP CONSTRAINT "ProposedAction_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "ReasoningTrace" DROP CONSTRAINT "ReasoningTrace_workspaceId_fkey";

-- DropForeignKey
ALTER TABLE "ReasoningTransition" DROP CONSTRAINT "ReasoningTransition_workspaceId_fkey";

-- DropTable
DROP TABLE "MissingElement";

-- DropTable
DROP TABLE "ProposedAction";

-- DropTable
DROP TABLE "ReasoningTrace";

-- DropTable
DROP TABLE "ReasoningTransition";

-- DropTable
DROP TABLE "WorkspaceReasoning";

-- CreateIndex
CREATE INDEX "InformationUnit_tenantId_currentStatus_idx" ON "InformationUnit"("tenantId", "currentStatus");

-- CreateIndex
CREATE INDEX "LegalDeadline_status_dueDate_idx" ON "LegalDeadline"("status", "dueDate");

-- CreateIndex
CREATE INDEX "Plan_isActive_idx" ON "Plan"("isActive");

-- CreateIndex
CREATE INDEX "Tenant_status_idx" ON "Tenant"("status");

-- CreateIndex
CREATE INDEX "User_status_idx" ON "User"("status");

-- AddForeignKey
ALTER TABLE "LegalDeadline" ADD CONSTRAINT "LegalDeadline_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDeadline" ADD CONSTRAINT "LegalDeadline_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LegalDeadline" ADD CONSTRAINT "LegalDeadline_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InformationUnit" ADD CONSTRAINT "InformationUnit_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_dossierId_fkey" FOREIGN KEY ("dossierId") REFERENCES "Dossier"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proof" ADD CONSTRAINT "Proof_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchivePolicy" ADD CONSTRAINT "ArchivePolicy_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
