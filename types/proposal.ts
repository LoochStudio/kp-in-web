export interface ProposalFormData {
  clientName: string;
  title: string;
  slug: string;

  // BlockNote JSON строки для каждой секции
  summaryContent: string;
  taskContent: string;
  stagesContent: string;
  timelineContent: string;
  processContent: string;
  ratesContent: string;
  pricingContent: string;
  casesContent: string;
  nextContent: string;

  // Свободные блоки и порядок секций (JSON строки)
  customBlocks: string;
  sectionOrder: string;

  // Контакты
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;

  // Видимость секций
  showSummary: boolean;
  showTask: boolean;
  showStages: boolean;
  showTimeline: boolean;
  showProcess: boolean;
  showRates: boolean;
  showPricing: boolean;
  showCases: boolean;
  showNext: boolean;
}
