"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ProposalFormData } from "@/types/proposal";

const BlockEditor = dynamic(() => import("@/components/admin/BlockEditor"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 h-32 bg-zinc-50 dark:bg-zinc-800 animate-pulse" />
  ),
});

const INPUT =
  "w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all";

interface CustomBlock {
  id: string;
  title: string;
  content: string;
  show: boolean;
}

const DEFAULT_SECTION_ORDER = [
  "summary", "task", "stages", "timeline", "process",
  "rates", "pricing", "cases", "next",
];

interface FixedSectionConfig {
  title: string;
  contentKey: keyof ProposalFormData;
  showKey: keyof ProposalFormData;
  placeholder: string;
}

const FIXED_SECTIONS: Record<string, FixedSectionConfig> = {
  summary: {
    title: "Саммари",
    contentKey: "summaryContent",
    showKey: "showSummary",
    placeholder: "Краткое резюме КП — для тех, кто читает по диагонали.",
  },
  task: {
    title: "Задача проекта и ориентиры",
    contentKey: "taskContent",
    showKey: "showTask",
    placeholder: "Опишите задачу. / — вставить блок (список, заголовок, картинка...)",
  },
  stages: {
    title: "Этапы проекта",
    contentKey: "stagesContent",
    showKey: "showStages",
    placeholder: "Опишите этапы проекта. Используйте списки или таблицу...",
  },
  timeline: {
    title: "Сроки",
    contentKey: "timelineContent",
    showKey: "showTimeline",
    placeholder: "Укажите сроки. Удобно использовать таблицу (/)...",
  },
  process: {
    title: "Как будем работать",
    contentKey: "processContent",
    showKey: "showProcess",
    placeholder: "Опишите процесс работы. Нумерованный список подойдёт...",
  },
  rates: {
    title: "Ставки специалистов в час",
    contentKey: "ratesContent",
    showKey: "showRates",
    placeholder: "Укажите ставки. Таблица (/) — удобный формат...",
  },
  pricing: {
    title: "Стоимость работ",
    contentKey: "pricingContent",
    showKey: "showPricing",
    placeholder: "Распишите стоимость. Таблица или нумерованный список...",
  },
  cases: {
    title: "Релевантные кейсы",
    contentKey: "casesContent",
    showKey: "showCases",
    placeholder: "Добавьте примеры работ. Можно вставлять картинки (/)...",
  },
  next: {
    title: "Что дальше?",
    contentKey: "nextContent",
    showKey: "showNext",
    placeholder: "Опишите следующие шаги для клиента...",
  },
};

const defaultForm: ProposalFormData = {
  clientName: "",
  title: "",
  slug: "",
  summaryContent: "",
  taskContent: "",
  stagesContent: "",
  timelineContent: "",
  processContent: "",
  ratesContent: "",
  pricingContent: "",
  casesContent: "",
  nextContent: "",
  customBlocks: "",
  sectionOrder: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  showSummary: false,
  showTask: true,
  showStages: true,
  showTimeline: true,
  showProcess: true,
  showRates: true,
  showPricing: true,
  showCases: true,
  showNext: true,
};

function generateSlug(clientName: string) {
  return clientName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
}

function parseJsonSafe<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

interface Props {
  mode: "new" | "edit";
  id?: string;
  initialData?: Partial<ProposalFormData>;
}

export default function CpForm({ mode, id, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProposalFormData>({ ...defaultForm, ...initialData });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [sectionOrder, setSectionOrder] = useState<string[]>(() =>
    parseJsonSafe(initialData?.sectionOrder, DEFAULT_SECTION_ORDER)
  );

  const [customBlocks, setCustomBlocks] = useState<CustomBlock[]>(() =>
    parseJsonSafe(initialData?.customBlocks, [])
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function set<K extends keyof ProposalFormData>(key: K, value: ProposalFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleClientName(value: string) {
    setForm((prev) => ({
      ...prev,
      clientName: value,
      slug: mode === "new" ? generateSlug(value) : prev.slug,
    }));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSectionOrder((prev) => {
        const oldIndex = prev.indexOf(active.id as string);
        const newIndex = prev.indexOf(over.id as string);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  }

  function addCustomBlock() {
    const newId = crypto.randomUUID();
    setCustomBlocks((prev) => [...prev, { id: newId, title: "Новый блок", content: "", show: true }]);
    setSectionOrder((prev) => [...prev, newId]);
  }

  function removeCustomBlock(blockId: string) {
    setCustomBlocks((prev) => prev.filter((b) => b.id !== blockId));
    setSectionOrder((prev) => prev.filter((s) => s !== blockId));
  }

  function updateCustomBlock(blockId: string, updates: Partial<CustomBlock>) {
    setCustomBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b))
    );
  }

  async function handleSave() {
    setSaving(true);
    setError("");

    if (!form.slug.trim()) {
      setError("Slug не может быть пустым");
      setSaving(false);
      return;
    }

    const url = mode === "new" ? "/api/cp" : `/api/cp/${id}`;
    const method = mode === "new" ? "POST" : "PUT";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        sectionOrder: JSON.stringify(sectionOrder),
        customBlocks: JSON.stringify(customBlocks),
      }),
    });

    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Ошибка при сохранении");
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <a href="/admin" className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
              Предложения
            </a>
            <span className="text-zinc-200 dark:text-zinc-700">/</span>
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">
              {mode === "new" ? "Новое КП" : form.clientName || "Редактирование"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {mode === "edit" && form.slug && (
              <a href={`/kp/${form.slug}`} target="_blank" className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-3 py-2">
                Открыть ↗
              </a>
            )}
            <a href="/admin" className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-3 py-2">
              Отмена
            </a>
            <button
              onClick={handleSave}
              disabled={saving || !form.clientName || !form.title}
              className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 disabled:opacity-40 transition-colors font-medium"
            >
              {saving ? "Сохранение..." : "Сохранить"}
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 border-b border-red-100 dark:border-red-900/50 px-6 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-2 text-red-600 dark:text-red-400">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
              <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        {/* Основная информация */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Основная информация</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Клиент</label>
              <input value={form.clientName} onChange={(e) => handleClientName(e.target.value)} placeholder="Romashka LLC" className={INPUT} />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Название КП</label>
              <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Разработка сайта" className={INPUT} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Публичная ссылка</label>
            <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden focus-within:border-zinc-400 dark:focus-within:border-zinc-500 focus-within:ring-2 focus-within:ring-zinc-100 dark:focus-within:ring-zinc-800 transition-all">
              <span className="px-3 py-2.5 text-sm text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 whitespace-nowrap">/kp/</span>
              <input value={form.slug} onChange={(e) => set("slug", e.target.value)} placeholder="romashka-llc" className="flex-1 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-900 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none" />
            </div>
          </div>
        </div>

        {/* Секции с drag-and-drop */}
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sectionOrder} strategy={verticalListSortingStrategy}>
            <div className="space-y-4">
              {sectionOrder.map((sectionId) => {
                const config = FIXED_SECTIONS[sectionId];

                if (config) {
                  return (
                    <SortableSection key={sectionId} id={sectionId}>
                      {(dragHandle) => (
                        <Section
                          title={config.title}
                          show={form[config.showKey] as boolean}
                          onToggle={() => set(config.showKey, !form[config.showKey])}
                          dragHandle={dragHandle}
                        >
                          <BlockEditor
                            value={form[config.contentKey] as string}
                            onChange={(v) => set(config.contentKey, v)}
                            placeholder={config.placeholder}
                          />
                          {sectionId === "next" && (
                            <div>
                              <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Контакт менеджера</label>
                              <div className="grid grid-cols-2 gap-3">
                                <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Имя" className={INPUT} />
                                <input value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} placeholder="Должность" className={INPUT} />
                                <input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="Email" type="email" className={INPUT} />
                                <input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="Телефон" className={INPUT} />
                              </div>
                            </div>
                          )}
                        </Section>
                      )}
                    </SortableSection>
                  );
                }

                // Свободный блок
                const customBlock = customBlocks.find((b) => b.id === sectionId);
                if (!customBlock) return null;

                return (
                  <SortableSection key={sectionId} id={sectionId}>
                    {(dragHandle) => (
                      <Section
                        title={customBlock.title}
                        show={customBlock.show}
                        onToggle={() => updateCustomBlock(sectionId, { show: !customBlock.show })}
                        dragHandle={dragHandle}
                        onTitleChange={(title) => updateCustomBlock(sectionId, { title })}
                        onDelete={() => removeCustomBlock(sectionId)}
                        isCustom
                      >
                        <BlockEditor
                          value={customBlock.content}
                          onChange={(v) => updateCustomBlock(sectionId, { content: v })}
                          placeholder="Свободный контент блока..."
                        />
                      </Section>
                    )}
                  </SortableSection>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>

        {/* Добавить свободный блок */}
        <button
          type="button"
          onClick={addCustomBlock}
          className="w-full py-3 border border-dashed border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm text-zinc-400 dark:text-zinc-500 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors flex items-center justify-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Добавить свободный блок
        </button>

        <div className="pb-8" />
      </main>
    </div>
  );
}

function SortableSection({
  id,
  children,
}: {
  id: string;
  children: (dragHandle: React.ReactNode) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
    position: isDragging ? ("relative" as const) : undefined,
  };

  const dragHandle = (
    <button
      type="button"
      className="cursor-grab active:cursor-grabbing p-1 -m-1 text-zinc-300 hover:text-zinc-500 dark:text-zinc-600 dark:hover:text-zinc-400 transition-colors rounded shrink-0"
      {...attributes}
      {...listeners}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <circle cx="5" cy="3" r="1.2" fill="currentColor" />
        <circle cx="9" cy="3" r="1.2" fill="currentColor" />
        <circle cx="5" cy="7" r="1.2" fill="currentColor" />
        <circle cx="9" cy="7" r="1.2" fill="currentColor" />
        <circle cx="5" cy="11" r="1.2" fill="currentColor" />
        <circle cx="9" cy="11" r="1.2" fill="currentColor" />
      </svg>
    </button>
  );

  return (
    <div ref={setNodeRef} style={style}>
      {children(dragHandle)}
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        enabled ? "bg-zinc-800 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-900 shadow-sm transition-transform ${
          enabled ? "translate-x-4.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Section({
  title,
  show,
  onToggle,
  children,
  dragHandle,
  onTitleChange,
  onDelete,
  isCustom,
}: {
  title: string;
  show: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  dragHandle?: React.ReactNode;
  onTitleChange?: (title: string) => void;
  onDelete?: () => void;
  isCustom?: boolean;
}) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3 min-w-0">
          {dragHandle}
          {onTitleChange ? (
            <input
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent outline-none border-b border-transparent focus:border-zinc-300 dark:focus:border-zinc-600 transition-colors min-w-0"
            />
          ) : (
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">{title}</h2>
          )}
          {isCustom && (
            <span className="text-xs text-zinc-300 dark:text-zinc-600 border border-zinc-100 dark:border-zinc-800 rounded px-1.5 py-0.5 shrink-0">
              свободный
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              className="text-zinc-300 hover:text-red-400 dark:text-zinc-600 dark:hover:text-red-400 transition-colors p-1"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M5 4V2.5h4V4M5.5 6.5v4M8.5 6.5v4M3 4l.5 7.5h7L11 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <span className="text-xs text-zinc-400">{show ? "Показывать" : "Скрыто"}</span>
          <Toggle enabled={show} onToggle={onToggle} />
        </div>
      </div>
      {show && (
        <div className="px-6 pb-6 border-t border-zinc-50 dark:border-zinc-800">
          <div className="pt-4 space-y-4">{children}</div>
        </div>
      )}
    </section>
  );
}
