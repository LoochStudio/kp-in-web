import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlockContent from "@/components/cp/BlockContent";

interface CustomBlock {
  id: string;
  title: string;
  content: string;
  show?: boolean;
}

interface SectionItem {
  id: string;
  title: string;
  content: string;
  number: string;
  type: "summary" | "next" | "regular";
}

const DEFAULT_SECTION_ORDER = [
  "summary", "task", "stages", "timeline", "process",
  "rates", "pricing", "cases", "next",
];

function parseJsonSafe<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export default async function KpPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const proposal = await prisma.proposal.findUnique({ where: { slug } });
  if (!proposal) notFound();

  const date = new Date(proposal.createdAt).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const sectionOrder = parseJsonSafe<string[]>(proposal.sectionOrder, DEFAULT_SECTION_ORDER);
  const customBlocks = parseJsonSafe<CustomBlock[]>(proposal.customBlocks, []);

  const fixedSectionsData: Record<string, { show: boolean; content: string | null; title: string }> = {
    task:     { show: proposal.showTask,     content: proposal.taskContent,     title: "Задача проекта и ориентиры" },
    stages:   { show: proposal.showStages,   content: proposal.stagesContent,   title: "Этапы проекта" },
    timeline: { show: proposal.showTimeline, content: proposal.timelineContent, title: "Сроки" },
    process:  { show: proposal.showProcess,  content: proposal.processContent,  title: "Как будем работать" },
    rates:    { show: proposal.showRates,    content: proposal.ratesContent,    title: "Ставки специалистов" },
    pricing:  { show: proposal.showPricing,  content: proposal.pricingContent,  title: "Стоимость работ" },
    cases:    { show: proposal.showCases,    content: proposal.casesContent,    title: "Релевантные кейсы" },
  };

  let counter = 0;
  const sections: SectionItem[] = [];

  for (const sectionId of sectionOrder) {
    if (sectionId === "summary") {
      if (proposal.showSummary && proposal.summaryContent) {
        sections.push({ id: "summary", title: "Саммари", content: proposal.summaryContent, number: "", type: "summary" });
      }
      continue;
    }
    if (sectionId === "next") {
      if (proposal.showNext && (proposal.nextContent || proposal.contactName)) {
        counter++;
        sections.push({ id: "next", title: "Что дальше?", content: proposal.nextContent ?? "", number: String(counter).padStart(2, "0"), type: "next" });
      }
      continue;
    }
    const fixed = fixedSectionsData[sectionId];
    if (fixed) {
      if (fixed.show && fixed.content) {
        counter++;
        sections.push({ id: sectionId, title: fixed.title, content: fixed.content, number: String(counter).padStart(2, "0"), type: "regular" });
      }
      continue;
    }
    const custom = customBlocks.find((b) => b.id === sectionId);
    if (custom && custom.show !== false && custom.content) {
      counter++;
      sections.push({ id: sectionId, title: custom.title, content: custom.content, number: String(counter).padStart(2, "0"), type: "regular" });
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FDFCFB", color: "#333037" }}>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #1A1210 0%, #0D0B0A 55%, #111010 100%)" }}
      >
        {/* Тонкая сетка-текстура */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle, #3A2F2A 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            opacity: 0.18,
          }}
        />

        {/* Тёплый градиент сверху */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse 80% 50% at 50% -10%, #2E1F18 0%, transparent 70%)",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-8 pt-16 pb-20">

          {/* Верхняя строка */}
          <div className="hero-reveal hero-reveal-1 flex items-center justify-between mb-14">
            <span
              className="text-[11px] font-medium uppercase tracking-[0.25em]"
              style={{ color: "#6B5E55" }}
            >
              Коммерческое предложение
            </span>
            <span className="text-[11px]" style={{ color: "#5A4E48" }}>{date}</span>
          </div>

          {/* Клиент + заголовок */}
          <div className="max-w-3xl">
            <p className="hero-reveal hero-reveal-2 text-base font-light mb-4" style={{ color: "#7A6B63" }}>
              {proposal.clientName}
            </p>
            <h1
              className="hero-reveal hero-reveal-3 font-bold leading-[1.05] tracking-tight"
              style={{
                color: "#FDFAF8",
                fontSize: "clamp(2.8rem, 6vw, 4.5rem)",
              }}
            >
              {proposal.title}
            </h1>
          </div>

          {/* Навигация по секциям */}
          {sections.length > 0 && (
            <div className="hero-reveal hero-reveal-4 mt-14 flex flex-wrap gap-2">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#section-${s.id}`}
                  className="text-[11px] font-medium rounded-full px-3.5 py-1.5 transition-all duration-500 text-[#6B5E55] hover:text-[#C4B0A5] border border-[#2E2420] hover:border-[#5A4A42]"
                >
                  {s.type !== "summary" && (
                    <span className="mr-1.5 opacity-50">{s.number}</span>
                  )}
                  {s.title}
                </a>
              ))}
            </div>
          )}

          {/* Декоративная линия внизу */}
          <div
            className="hero-reveal-fade hero-reveal-fade-1 mt-16 h-px w-full"
            style={{ background: "linear-gradient(90deg, transparent, #2E2420 30%, #2E2420 70%, transparent)" }}
          />
        </div>
      </section>

      {/* ── Контент ────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-8">
        {sections.map((section, i) => {
          const isFirst = i === 0;

          /* ── Саммари ── */
          if (section.type === "summary") {
            return (
              <section
                key="summary"
                id="section-summary"
                className="py-20"
                style={!isFirst ? { borderTop: "1px solid #EDE8E2" } : {}}
              >
                <div className="flex gap-12 md:gap-20">
                  <div className="hidden md:block shrink-0 w-20" />
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-[10px] font-semibold uppercase tracking-[0.25em] mb-8"
                      style={{ color: "#B0A89E" }}
                    >
                      Резюме
                    </span>
                    <div
                      className="leading-relaxed font-light"
                      style={{ fontSize: "1.175rem", color: "#5C5550" }}
                    >
                      <BlockContent content={section.content} />
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          /* ── Что дальше ── */
          if (section.type === "next") {
            return (
              <section
                key="next"
                id="section-next"
                className="py-20"
                style={{ borderTop: isFirst ? "none" : "1px solid #EDE8E2" }}
              >
                <div className="flex gap-12 md:gap-20">
                  <div
                    className="hidden md:flex shrink-0 w-20 justify-end pt-1"
                    aria-hidden="true"
                  >
                    <span
                      className="text-[5.5rem] leading-none font-bold select-none"
                      style={{ color: "#EDE8E2", letterSpacing: "-0.04em" }}
                    >
                      {section.number}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2
                      className="text-2xl font-semibold mb-8 tracking-tight"
                      style={{ color: "#2E2B28" }}
                    >
                      {section.title}
                    </h2>

                    {section.content && (
                      <div className="mb-10">
                        <BlockContent content={section.content} />
                      </div>
                    )}

                    {(proposal.contactName || proposal.contactEmail) && (
                      <div
                        className="rounded-2xl p-7 md:p-9 flex items-start gap-5"
                        style={{ background: "linear-gradient(135deg, #171210 0%, #110E0C 100%)" }}
                      >
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: "#2A1F18" }}
                        >
                          <span className="text-base font-semibold" style={{ color: "#C4A898" }}>
                            {proposal.contactName?.charAt(0)?.toUpperCase() ?? "М"}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-white text-base leading-tight">
                            {proposal.contactName}
                          </p>
                          {proposal.contactRole && (
                            <p className="text-sm mt-1" style={{ color: "#7A6B63" }}>{proposal.contactRole}</p>
                          )}
                          <div className="mt-5 flex flex-wrap gap-5">
                            {proposal.contactEmail && (
                              <a
                                href={`mailto:${proposal.contactEmail}`}
                                className="text-sm transition-colors duration-300 flex items-center gap-2 text-[#8A7B72] hover:text-[#D4C4BA]"
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                                  <path d="M1 4.5l6 4 6-4" stroke="currentColor" strokeWidth="1.2" />
                                </svg>
                                {proposal.contactEmail}
                              </a>
                            )}
                            {proposal.contactPhone && (
                              <a
                                href={`tel:${proposal.contactPhone}`}
                                className="text-sm transition-colors duration-300 flex items-center gap-2 text-[#8A7B72] hover:text-[#D4C4BA]"
                              >
                                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                  <path d="M2 2.5C2 2.5 3 5 5 7s4.5 3 4.5 3l1.5-1.5c.3-.3.7-.3 1 0l1.5 1.5c.3.3.3.7 0 1L12 12.5C11 13.5 9 13 7 11S1 7 1 5c0-1 .5-2 1.5-3l1-.5c.3-.1.7 0 .9.3L5.5 3c.3.3.3.7 0 1L4 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                                </svg>
                                {proposal.contactPhone}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          }

          /* ── Обычная секция (фиксированная или свободная) ── */
          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              className="py-20"
              style={{ borderTop: isFirst ? "none" : "1px solid #EDE8E2" }}
            >
              <div className="flex gap-12 md:gap-20">
                {/* Большой декоративный номер */}
                <div
                  className="hidden md:flex shrink-0 w-20 justify-end pt-1"
                  aria-hidden="true"
                >
                  <span
                    className="font-bold select-none leading-none"
                    style={{
                      fontSize: "5.5rem",
                      color: "#EDE8E2",
                      letterSpacing: "-0.04em",
                    }}
                  >
                    {section.number}
                  </span>
                </div>

                {/* Контент */}
                <div className="flex-1 min-w-0">
                  <h2
                    className="text-2xl font-semibold mb-8 tracking-tight"
                    style={{ color: "#2E2B28" }}
                  >
                    {section.title}
                  </h2>
                  <BlockContent content={section.content} />
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        className="mt-8 py-10"
        style={{ borderTop: "1px solid #EDE8E2" }}
      >
        <div className="max-w-4xl mx-auto px-8 flex items-center justify-between">
          <span className="text-xs" style={{ color: "#C4BCB6" }}>{proposal.clientName}</span>
          <span className="text-xs" style={{ color: "#C4BCB6" }}>{date}</span>
        </div>
      </footer>
    </div>
  );
}
