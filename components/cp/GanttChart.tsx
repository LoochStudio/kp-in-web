"use client";

import BlockContent from "./BlockContent";

// ── Типы BlockNote ────────────────────────────────────────────

type InlineNode =
  | { type: "text"; text: string; styles?: object }
  | { type: "link"; href: string; content: InlineNode[] };

type TableCell = InlineNode[] | { type: string; content: InlineNode[] };

interface TableBlock {
  id: string;
  type: "table";
  content: {
    type: "tableContent";
    rows: { cells: TableCell[] }[];
  };
}

interface AnyBlock {
  id: string;
  type: string;
  content?: unknown;
  props?: Record<string, unknown>;
  children?: AnyBlock[];
}

// ── Парсинг дат ───────────────────────────────────────────────

const MONTHS: Record<string, number> = {
  янв: 0, январь: 0, января: 0,
  фев: 1, февраль: 1, февраля: 1,
  мар: 2, март: 2, марта: 2,
  апр: 3, апрель: 3, апреля: 3,
  май: 4, мая: 4,
  июн: 5, июнь: 5, июня: 5,
  июл: 6, июль: 6, июля: 6,
  авг: 7, август: 7, августа: 7,
  сен: 8, сентябрь: 8, сентября: 8,
  окт: 9, октябрь: 9, октября: 9,
  ноя: 10, ноябрь: 10, ноября: 10,
  дек: 11, декабрь: 11, декабря: 11,
};

function parseDate(raw: string): Date | null {
  const s = raw.trim().toLowerCase().replace(/\s+/g, " ");

  // DD.MM.YYYY или DD.MM.YY
  const dotMatch = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/);
  if (dotMatch) {
    const d = parseInt(dotMatch[1]);
    const m = parseInt(dotMatch[2]) - 1;
    let y = parseInt(dotMatch[3]);
    if (y < 100) y += 2000;
    return new Date(y, m, d);
  }

  // D месяца [YYYY]  →  "7 апр 2026", "20 апреля"
  const ruDay = s.match(/^(\d{1,2})\s+([а-яё]+\.?)\s*(\d{4})?$/);
  if (ruDay) {
    const d = parseInt(ruDay[1]);
    const m = MONTHS[ruDay[2].replace(/\.$/, "")];
    if (m === undefined) return null;
    const y = ruDay[3] ? parseInt(ruDay[3]) : new Date().getFullYear();
    return new Date(y, m, d);
  }

  // месяц YYYY  →  "апрель 2026"
  const ruMonth = s.match(/^([а-яё]+\.?)\s+(\d{4})$/);
  if (ruMonth) {
    const m = MONTHS[ruMonth[1].replace(/\.$/, "")];
    if (m === undefined) return null;
    return new Date(parseInt(ruMonth[2]), m, 1);
  }

  return null;
}

// ── Получить текст из ячейки таблицы ─────────────────────────

function cellText(cell: TableCell): string {
  const nodes: InlineNode[] = Array.isArray(cell)
    ? cell
    : (cell as { content: InlineNode[] }).content ?? [];
  return nodes
    .filter((n): n is { type: "text"; text: string; styles?: object } => n.type === "text")
    .map((n) => n.text)
    .join("");
}

// ── Форматирование даты ───────────────────────────────────────

function fmt(date: Date): string {
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

// ── Основные типы ─────────────────────────────────────────────

interface Phase {
  name: string;
  start: Date;
  end: Date;
}

// ── Парсинг фаз из таблицы ────────────────────────────────────

function parsePhases(table: TableBlock): Phase[] {
  const rows = table.content?.rows ?? [];
  const phases: Phase[] = [];

  for (let i = 0; i < rows.length; i++) {
    const { cells } = rows[i];
    if (cells.length < 3) continue;

    const name = cellText(cells[0]);
    const startStr = cellText(cells[1]);
    const endStr = cellText(cells[2]);

    // Пропускаем заголовок
    if (
      i === 0 &&
      (startStr.toLowerCase().includes("начал") ||
        startStr.toLowerCase().includes("start") ||
        startStr.toLowerCase().includes("дата"))
    ) {
      continue;
    }

    const start = parseDate(startStr);
    const end = parseDate(endStr);
    if (name && start && end) phases.push({ name, start, end });
  }

  return phases;
}

// ── Компонент ─────────────────────────────────────────────────

interface Props {
  content: string;
}

export default function GanttChart({ content }: Props) {
  let blocks: AnyBlock[];
  try {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) return <BlockContent content={content} />;
    blocks = parsed;
  } catch {
    return <BlockContent content={content} />;
  }

  const tableBlock = blocks.find((b): b is TableBlock => b.type === "table");
  if (!tableBlock) return <BlockContent content={content} />;

  const phases = parsePhases(tableBlock);
  if (phases.length === 0) return <BlockContent content={content} />;

  const minDate = new Date(Math.min(...phases.map((p) => p.start.getTime())));
  const maxDate = new Date(Math.max(...phases.map((p) => p.end.getTime())));
  const totalMs = maxDate.getTime() - minDate.getTime();

  const pct = (d: Date) => ((d.getTime() - minDate.getTime()) / totalMs) * 100;

  // Милестоуны: старт каждой фазы + финальная дата
  const milestones = [
    ...phases.map((p) => ({ date: p.start, label: p.name })),
    { date: maxDate, label: "Финал" },
  ];

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ border: "1px solid #E5E5E5", background: "#fff" }}
    >
      {/* Заголовок */}
      <div
        className="flex items-center justify-between px-8 py-5"
        style={{ borderBottom: "1px solid #E5E5E5" }}
      >
        <span style={{ fontSize: 15, fontWeight: 500, color: "#333037" }}>Таймлайн проекта</span>
        <span
          className="text-xs px-3 py-1 rounded-full"
          style={{ background: "#DDEAF3", color: "#4A7A9B" }}
        >
          {fmt(minDate)} — {fmt(maxDate)}
        </span>
      </div>

      {/* Фазы */}
      <div className="px-8 py-6 space-y-4">
        {phases.map((phase, i) => {
          const leftPct = pct(phase.start);
          const widthPct = pct(phase.end) - leftPct;

          return (
            <div key={i} className="flex items-center gap-4">
              {/* Название фазы */}
              <div
                className="shrink-0 text-sm"
                style={{ width: 180, color: "#555", lineHeight: 1.3 }}
              >
                {phase.name}
              </div>

              {/* Прогресс-бар */}
              <div className="flex-1 relative" style={{ height: 6, background: "#F0F0F0", borderRadius: 100 }}>
                <div
                  style={{
                    position: "absolute",
                    left: `${leftPct}%`,
                    width: `${Math.max(widthPct, 2)}%`,
                    height: "100%",
                    background: "#333037",
                    borderRadius: 100,
                  }}
                />
              </div>

              {/* Диапазон дат */}
              <div
                className="shrink-0 text-xs text-right"
                style={{ width: 140, color: "#999" }}
              >
                {fmt(phase.start)} — {fmt(phase.end)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Милестоуны */}
      <div
        className="px-8 py-6"
        style={{ borderTop: "1px solid #E5E5E5", background: "#FAFAF9" }}
      >
        <div
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${Math.min(milestones.length, 4)}, 1fr)` }}
        >
          {milestones.slice(0, 4).map((m, i) => (
            <div key={i}>
              <div style={{ fontSize: 18, fontWeight: 500, color: "#333037", letterSpacing: "-0.3px" }}>
                {fmt(m.date)}
              </div>
              <div style={{ fontSize: 12, color: "#999", marginTop: 2 }}>
                {m.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
