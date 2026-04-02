import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlockContent from "@/components/cp/BlockContent";
import StagesTabs from "@/components/cp/StagesTabs";
import GanttChart from "@/components/cp/GanttChart";

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
    day: "numeric", month: "long", year: "numeric",
  });

  const validity = new Date(proposal.createdAt);
  validity.setDate(validity.getDate() + 30);
  const validityStr = validity.toLocaleDateString("ru-RU", {
    day: "numeric", month: "long", year: "numeric",
  });

  const sectionOrder = parseJsonSafe<string[]>(proposal.sectionOrder, DEFAULT_SECTION_ORDER);
  const customBlocks = parseJsonSafe<CustomBlock[]>(proposal.customBlocks, []);

  const fixedSectionsData: Record<string, { show: boolean; content: string | null; title: string }> = {
    task:     { show: proposal.showTask,     content: proposal.taskContent,     title: "Задача проекта" },
    stages:   { show: proposal.showStages,   content: proposal.stagesContent,   title: "Этапы проекта" },
    timeline: { show: proposal.showTimeline, content: proposal.timelineContent, title: "Таймлайн" },
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
        sections.push({ id: "summary", title: "Краткое саммари", content: proposal.summaryContent, number: "", type: "summary" });
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
    <div style={{ background: "#F5F5F5", color: "#333037", minHeight: "100vh" }}>

      {/* ── Sticky navbar ──────────────────────────────────── */}
      <nav
        className="sticky top-0 z-50 flex items-center"
        style={{
          height: 60,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          background: "rgba(245, 245, 245, 0.88)",
          borderBottom: "1px solid #E5E5E5",
        }}
      >
        <div
          className="flex items-center justify-between w-full"
          style={{ maxWidth: 896, margin: "0 auto", padding: "0 32px" }}
        >
          {/* Лого */}
          <div
            style={{
              background: "#333037", color: "#fff",
              borderRadius: 100, padding: "5px 18px",
              fontSize: 14, fontWeight: 500,
            }}
          >
            Луч
          </div>

          {/* Ссылки на секции */}
          <div className="hidden md:flex items-center" style={{ gap: 24 }}>
            {sections.map((s) => (
              <a
                key={s.id}
                href={`#section-${s.id}`}
                style={{ fontSize: 13, color: "#999", textDecoration: "none" }}
              >
                {s.type !== "summary" && (
                  <span style={{ marginRight: 4, opacity: 0.5 }}>{s.number}</span>
                )}
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section style={{ background: "#fff", borderBottom: "1px solid #E5E5E5" }}>
        <div
          className="hero-reveal hero-reveal-1"
          style={{ maxWidth: 896, margin: "0 auto", padding: "100px 32px" }}
        >

          {/* Pill tag */}
          <div
            className="hero-reveal hero-reveal-1 inline-flex items-center"
            style={{
              gap: 8, border: "1px solid #D9D9D9", borderRadius: 100,
              padding: "6px 16px", marginBottom: 40,
            }}
          >
            <span
              style={{ width: 6, height: 6, borderRadius: "50%", background: "#333037", flexShrink: 0 }}
            />
            <span style={{ fontSize: 13, color: "#666" }}>
              Коммерческое предложение
              {proposal.clientName && ` · ${proposal.clientName}`}
            </span>
          </div>

          {/* Заголовок */}
          <h1
            className="hero-reveal hero-reveal-2"
            style={{
              fontSize: "clamp(40px, 5vw, 68px)",
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: "-1.5px",
              color: "#000",
              marginBottom: 56,
              maxWidth: 820,
            }}
          >
            {proposal.title}
          </h1>

          {/* Мета-данные */}
          <div
            className="hero-reveal hero-reveal-3 flex flex-wrap"
            style={{ gap: 40 }}
          >
            {proposal.clientName && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>
                  Клиент
                </span>
                <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.3px", color: "#333037" }}>
                  {proposal.clientName}
                </span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>
                Дата
              </span>
              <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.3px", color: "#333037" }}>
                {date}
              </span>
            </div>
            {proposal.contactName && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>
                  Менеджер
                </span>
                <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.3px", color: "#333037" }}>
                  {proposal.contactName}
                </span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#999" }}>
                Срок действия
              </span>
              <span style={{ fontSize: 18, fontWeight: 500, letterSpacing: "-0.3px", color: "#333037" }}>
                до {validityStr}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Контент ────────────────────────────────────────── */}
      <div style={{ maxWidth: 896, margin: "0 auto", padding: "0 32px" }}>
        {sections.map((section, i) => {
          const isFirst = i === 0;
          const borderStyle = isFirst ? "none" : "1px solid #E5E5E5";

          /* ── Краткое саммари ── */
          if (section.type === "summary") {
            return (
              <section
                key="summary"
                id="section-summary"
                className="py-20"
                style={{ borderTop: borderStyle }}
              >
                <div className="flex gap-16 md:gap-20">
                  <div className="hidden md:block shrink-0" style={{ width: 80 }} />
                  <div className="flex-1 min-w-0">
                    <span
                      style={{
                        display: "block",
                        fontSize: 11, fontWeight: 600,
                        textTransform: "uppercase", letterSpacing: "0.25em",
                        color: "#999", marginBottom: 32,
                      }}
                    >
                      Краткое саммари
                    </span>
                    <div style={{ fontSize: "1.125rem", lineHeight: 1.75, color: "#555", fontWeight: 300 }}>
                      <BlockContent content={section.content} />
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          /* ── Что дальше (контакт) ── */
          if (section.type === "next") {
            return (
              <section
                key="next"
                id="section-next"
                className="py-20"
                style={{ borderTop: borderStyle }}
              >
                <div className="flex gap-16 md:gap-20">
                  <div
                    className="hidden md:flex shrink-0 justify-end"
                    style={{ width: 80, paddingTop: 4 }}
                    aria-hidden="true"
                  >
                    <span
                      style={{
                        fontSize: "5.5rem", fontWeight: 400,
                        lineHeight: 1, color: "#EBEBEB",
                        letterSpacing: "-0.04em", userSelect: "none",
                      }}
                    >
                      {section.number}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h2
                      style={{
                        fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400,
                        letterSpacing: "-0.5px", color: "#333037", marginBottom: 32,
                      }}
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
                        className="rounded-2xl flex items-start"
                        style={{
                          padding: "28px 32px", gap: 20,
                          border: "1px solid #E5E5E5", background: "#fff",
                        }}
                      >
                        <div
                          className="flex items-center justify-center shrink-0"
                          style={{
                            width: 48, height: 48, borderRadius: "50%",
                            background: "#F5F5F5", border: "1px solid #E5E5E5",
                            fontSize: 16, fontWeight: 500, color: "#333037",
                          }}
                        >
                          {proposal.contactName?.charAt(0)?.toUpperCase() ?? "М"}
                        </div>
                        <div>
                          <p style={{ fontWeight: 500, fontSize: 16, color: "#333037", lineHeight: 1.3 }}>
                            {proposal.contactName}
                          </p>
                          {proposal.contactRole && (
                            <p style={{ fontSize: 14, color: "#999", marginTop: 4 }}>
                              {proposal.contactRole}
                            </p>
                          )}
                          <div className="flex flex-wrap mt-5" style={{ gap: 24 }}>
                            {proposal.contactEmail && (
                              <a
                                href={`mailto:${proposal.contactEmail}`}
                                style={{ fontSize: 14, color: "#555", textDecoration: "none" }}
                              >
                                {proposal.contactEmail}
                              </a>
                            )}
                            {proposal.contactPhone && (
                              <a
                                href={`tel:${proposal.contactPhone}`}
                                style={{ fontSize: 14, color: "#555", textDecoration: "none" }}
                              >
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

          /* ── Обычная секция ── */
          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              className="py-20"
              style={{ borderTop: borderStyle }}
            >
              <div className="flex gap-16 md:gap-20">
                {/* Большой декоративный номер */}
                <div
                  className="hidden md:flex shrink-0 justify-end"
                  style={{ width: 80, paddingTop: 4 }}
                  aria-hidden="true"
                >
                  <span
                    style={{
                      fontSize: "5.5rem", fontWeight: 400,
                      lineHeight: 1, color: "#EBEBEB",
                      letterSpacing: "-0.04em", userSelect: "none",
                    }}
                  >
                    {section.number}
                  </span>
                </div>

                {/* Контент */}
                <div className="flex-1 min-w-0">
                  <h2
                    style={{
                      fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400,
                      letterSpacing: "-0.5px", color: "#333037", marginBottom: 32,
                    }}
                  >
                    {section.title}
                  </h2>

                  {section.id === "stages" ? (
                    <StagesTabs content={section.content} />
                  ) : section.id === "timeline" ? (
                    <GanttChart content={section.content} />
                  ) : (
                    <BlockContent content={section.content} />
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer
        className="mt-8 py-10"
        style={{ borderTop: "1px solid #E5E5E5", background: "#fff" }}
      >
        <div
          className="flex items-center justify-between"
          style={{ maxWidth: 896, margin: "0 auto", padding: "0 32px" }}
        >
          <span style={{ fontSize: 13, color: "#999" }}>loo.ch</span>
          <span style={{ fontSize: 13, color: "#999" }}>
            {proposal.clientName && `${proposal.clientName} · `}{date}
          </span>
        </div>
      </footer>
    </div>
  );
}
