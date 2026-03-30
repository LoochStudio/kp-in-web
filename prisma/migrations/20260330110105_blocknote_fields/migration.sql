/*
  Warnings:

  - You are about to drop the column `cases` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `nextStepsText` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `pricingItems` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `projectStages` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `rates` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `taskGuidelines` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `taskText` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `timeline` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `totalPrice` on the `Proposal` table. All the data in the column will be lost.
  - You are about to drop the column `workProcess` on the `Proposal` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Proposal" DROP COLUMN "cases",
DROP COLUMN "nextStepsText",
DROP COLUMN "pricingItems",
DROP COLUMN "projectStages",
DROP COLUMN "rates",
DROP COLUMN "taskGuidelines",
DROP COLUMN "taskText",
DROP COLUMN "timeline",
DROP COLUMN "totalPrice",
DROP COLUMN "workProcess",
ADD COLUMN     "casesContent" TEXT,
ADD COLUMN     "nextContent" TEXT,
ADD COLUMN     "pricingContent" TEXT,
ADD COLUMN     "processContent" TEXT,
ADD COLUMN     "ratesContent" TEXT,
ADD COLUMN     "stagesContent" TEXT,
ADD COLUMN     "taskContent" TEXT,
ADD COLUMN     "timelineContent" TEXT;
