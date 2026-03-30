import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlockContent from "@/components/cp/BlockContent";

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

  const sections = [
    { show: proposal.showTask, content: proposal.taskContent, number: "01", title: "Задача проекта и ориентиры" },
    { show: proposal.showStages, content: proposal.stagesContent, number: "02", title: "Этапы проекта" },
    { show: proposal.showTimeline, content: proposal.timelineContent, number: "03", title: "Сроки" },
    { show: proposal.showProcess, content: proposal.processContent, number: "04", title: "Как будем работать" },
    { show: proposal.showRates, content: proposal.ratesContent, number: "05", title: "Ставки специалистов" },
    { show: proposal.showPricing, content: proposal.pricingContent, number: "06", title: "Стоимость работ" },
    { show: proposal.showCases, content: proposal.casesContent, number: "07", title: "Релевантные кейсы" },
  ].filter((s) => s.show && s.content);

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">

      {/* Hero */}
      <section className="relative bg-zinc-950 overflow-hidden">
        {/* Декоративная сетка */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />

        <div className="relative max-w-4xl mx-auto px-8 pt-20 pb-24">
          {/* Шапка */}
          <div className="flex items-center justify-between mb-16">
            <span className="text-xs font-medium text-zinc-600 uppercase tracking-[0.2em]">
              Коммерческое предложение
            </span>
            <span className="text-xs text-zinc-600">{date}</span>
          </div>

          {/* Заголовок */}
          <div className="max-w-2xl">
            <p className="text-zinc-500 text-lg mb-3">{proposal.clientName}</p>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-[1.1] tracking-tight">
              {proposal.title}
            </h1>
          </div>

          {/* Навигация по секциям */}
          {sections.length > 0 && (
            <div className="mt-16 flex flex-wrap gap-2">
              {sections.map((s) => (
                <a
                  key={s.number}
                  href={`#section-${s.number}`}
                  className="text-xs text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 rounded-full px-3 py-1.5 transition-colors"
                >
                  {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Контент */}
      <div className="max-w-4xl mx-auto px-8">

        {sections.map((s, i) => (
          <section
            key={s.number}
            id={`section-${s.number}`}
            className={`py-16 ${i !== 0 ? "border-t border-zinc-100 dark:border-zinc-800" : ""}`}
          >
            <div className="flex gap-10 md:gap-16">
              {/* Номер секции */}
              <div className="hidden md:block shrink-0 pt-1">
                <span className="text-4xl font-bold text-zinc-100 dark:text-zinc-800 select-none leading-none">
                  {s.number}
                </span>
              </div>

              {/* Содержимое */}
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">{s.title}</h2>
                <BlockContent content={s.content!} />
              </div>
            </div>
          </section>
        ))}

        {/* Секция "Что дальше" */}
        {proposal.showNext && (proposal.nextContent || proposal.contactName) && (
          <section className="py-16 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex gap-10 md:gap-16">
              <div className="hidden md:block shrink-0 pt-1">
                <span className="text-4xl font-bold text-zinc-100 dark:text-zinc-800 select-none leading-none">
                  08
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Что дальше?</h2>

                {proposal.nextContent && (
                  <div className="mb-8">
                    <BlockContent content={proposal.nextContent} />
                  </div>
                )}

                {(proposal.contactName || proposal.contactEmail) && (
                  <div className="bg-zinc-950 rounded-2xl p-6 md:p-8 flex items-start gap-5">
                    <div className="w-11 h-11 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                      <span className="text-zinc-300 text-sm font-semibold">
                        {proposal.contactName?.charAt(0)?.toUpperCase() ?? "М"}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white text-base">
                        {proposal.contactName}
                      </p>
                      {proposal.contactRole && (
                        <p className="text-sm text-zinc-500 mt-0.5">{proposal.contactRole}</p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-4">
                        {proposal.contactEmail && (
                          <a
                            href={`mailto:${proposal.contactEmail}`}
                            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
                              <path d="M1 4.5l6 4 6-4" stroke="currentColor" strokeWidth="1.2"/>
                            </svg>
                            {proposal.contactEmail}
                          </a>
                        )}
                        {proposal.contactPhone && (
                          <a
                            href={`tel:${proposal.contactPhone}`}
                            className="text-sm text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                          >
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M2 2.5C2 2.5 3 5 5 7s4.5 3 4.5 3l1.5-1.5c.3-.3.7-.3 1 0l1.5 1.5c.3.3.3.7 0 1L12 12.5C11 13.5 9 13 7 11S1 7 1 5c0-1 .5-2 1.5-3l1-.5c.3-.1.7 0 .9.3L5.5 3c.3.3.3.7 0 1L4 5.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
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
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 border-t border-zinc-100 dark:border-zinc-800 py-10">
        <div className="max-w-4xl mx-auto px-8 flex items-center justify-between">
          <span className="text-xs text-zinc-300 dark:text-zinc-600">{proposal.clientName}</span>
          <span className="text-xs text-zinc-300 dark:text-zinc-600">{date}</span>
        </div>
      </footer>
    </div>
  );
}
