CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DataSubjectRequest_tenantId_userId_requestType_status_idx"
ON "DataSubjectRequest"("tenantId", "userId", "requestType", "status");

CREATE INDEX "DataSubjectRequest_status_scheduledFor_idx"
ON "DataSubjectRequest"("status", "scheduledFor");

ALTER TABLE "DataSubjectRequest"
ADD CONSTRAINT "DataSubjectRequest_tenantId_fkey"
FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DataSubjectRequest"
ADD CONSTRAINT "DataSubjectRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
