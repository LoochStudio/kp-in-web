-- CreateEnum
CREATE TYPE "Status" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proposal" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "clientName" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "taskText" TEXT,
    "taskGuidelines" JSONB NOT NULL DEFAULT '[]',
    "projectStages" JSONB NOT NULL DEFAULT '[]',
    "timeline" JSONB NOT NULL DEFAULT '[]',
    "workProcess" JSONB NOT NULL DEFAULT '[]',
    "rates" JSONB NOT NULL DEFAULT '[]',
    "pricingItems" JSONB NOT NULL DEFAULT '[]',
    "totalPrice" TEXT,
    "cases" JSONB NOT NULL DEFAULT '[]',
    "nextStepsText" TEXT,
    "contactName" TEXT,
    "contactRole" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "showTask" BOOLEAN NOT NULL DEFAULT true,
    "showStages" BOOLEAN NOT NULL DEFAULT true,
    "showTimeline" BOOLEAN NOT NULL DEFAULT true,
    "showProcess" BOOLEAN NOT NULL DEFAULT true,
    "showRates" BOOLEAN NOT NULL DEFAULT true,
    "showPricing" BOOLEAN NOT NULL DEFAULT true,
    "showCases" BOOLEAN NOT NULL DEFAULT false,
    "showNext" BOOLEAN NOT NULL DEFAULT true,
    "managerId" TEXT NOT NULL,

    CONSTRAINT "Proposal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proposal_slug_key" ON "Proposal"("slug");

-- AddForeignKey
ALTER TABLE "Proposal" ADD CONSTRAINT "Proposal_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
