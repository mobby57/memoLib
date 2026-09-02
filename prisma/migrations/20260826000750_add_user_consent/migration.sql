-- CreateTable
CREATE TABLE "UserConsent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "granted" BOOLEAN NOT NULL DEFAULT true,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "policyVersion" TEXT,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConsent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserConsent_userId_idx" ON "UserConsent"("userId");

-- CreateIndex
CREATE INDEX "UserConsent_type_idx" ON "UserConsent"("type");

-- CreateIndex
CREATE INDEX "UserConsent_userId_type_idx" ON "UserConsent"("userId", "type");

-- AddForeignKey
ALTER TABLE "UserConsent" ADD CONSTRAINT "UserConsent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
