-- AlterTable
ALTER TABLE "Proposal" ADD COLUMN     "showSummary" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "summaryContent" TEXT;
