export interface ProposalFormData {
  clientName: string;
  title: string;
  slug: string;

  // BlockNote JSON строки для каждой секции
  taskContent: string;
  stagesContent: string;
  timelineContent: string;
  processContent: string;
  ratesContent: string;
  pricingContent: string;
  casesContent: string;
  nextContent: string;

  // Контакты
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;

  // Видимость секций
  showTask: boolean;
  showStages: boolean;
  showTimeline: boolean;
  showProcess: boolean;
  showRates: boolean;
  showPricing: boolean;
  showCases: boolean;
  showNext: boolean;
}
