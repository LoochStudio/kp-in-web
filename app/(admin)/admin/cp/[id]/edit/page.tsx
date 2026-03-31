import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CpForm from "@/components/admin/CpForm";
import type { ProposalFormData } from "@/types/proposal";

export default async function EditCpPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) notFound();

  const initialData: Partial<ProposalFormData> = {
    clientName: proposal.clientName,
    title: proposal.title,
    slug: proposal.slug,
    summaryContent: proposal.summaryContent ?? "",
    taskContent: proposal.taskContent ?? "",
    stagesContent: proposal.stagesContent ?? "",
    timelineContent: proposal.timelineContent ?? "",
    processContent: proposal.processContent ?? "",
    ratesContent: proposal.ratesContent ?? "",
    pricingContent: proposal.pricingContent ?? "",
    casesContent: proposal.casesContent ?? "",
    nextContent: proposal.nextContent ?? "",
    customBlocks: proposal.customBlocks ?? "",
    sectionOrder: proposal.sectionOrder ?? "",
    contactName: proposal.contactName ?? "",
    contactRole: proposal.contactRole ?? "",
    contactEmail: proposal.contactEmail ?? "",
    contactPhone: proposal.contactPhone ?? "",
    showSummary: proposal.showSummary,
    showTask: proposal.showTask,
    showStages: proposal.showStages,
    showTimeline: proposal.showTimeline,
    showProcess: proposal.showProcess,
    showRates: proposal.showRates,
    showPricing: proposal.showPricing,
    showCases: proposal.showCases,
    showNext: proposal.showNext,
  };

  return <CpForm mode="edit" id={id} initialData={initialData} />;
}
