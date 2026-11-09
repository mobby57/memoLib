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

-- CreateIndex
CREATE INDEX "EmailAccount_tenantId_idx" ON "EmailAccount"("tenantId");

-- CreateIndex
CREATE INDEX "EmailAccount_userId_idx" ON "EmailAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailAccount_tenantId_email_key" ON "EmailAccount"("tenantId", "email");

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailAccount" ADD CONSTRAINT "EmailAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
