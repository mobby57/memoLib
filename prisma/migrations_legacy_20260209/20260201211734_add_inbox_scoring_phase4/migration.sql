-- AlterEnum
ALTER TYPE "EventType" ADD VALUE 'FLOW_SCORED';

-- CreateTable
CREATE TABLE "inbox_scores" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "factors" JSONB NOT NULL,
    "model" TEXT NOT NULL DEFAULT 'llama3.2',
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inbox_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "inbox_scores_emailId_key" ON "inbox_scores"("emailId");

-- CreateIndex
CREATE INDEX "inbox_scores_score_idx" ON "inbox_scores"("score");

-- CreateIndex
CREATE INDEX "inbox_scores_calculatedAt_idx" ON "inbox_scores"("calculatedAt");

-- AddForeignKey
ALTER TABLE "inbox_scores" ADD CONSTRAINT "inbox_scores_emailId_fkey" FOREIGN KEY ("emailId") REFERENCES "Email"("id") ON DELETE CASCADE ON UPDATE CASCADE;
