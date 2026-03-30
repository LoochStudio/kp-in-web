"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import type { ProposalFormData } from "@/types/proposal";

const BlockEditor = dynamic(() => import("@/components/admin/BlockEditor"), {
  ssr: false,
  loading: () => (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 h-32 bg-zinc-50 dark:bg-zinc-800 animate-pulse" />
  ),
});

const INPUT =
  "w-full border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 bg-white dark:bg-zinc-800 placeholder:text-zinc-300 dark:placeholder:text-zinc-600 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100 dark:focus:ring-zinc-800 transition-all";

const defaultForm: ProposalFormData = {
  clientName: "",
  title: "",
  slug: "",
  taskContent: "",
  stagesContent: "",
  timelineContent: "",
  processContent: "",
  ratesContent: "",
  pricingContent: "",
  casesContent: "",
  nextContent: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  showTask: true,
  showStages: true,
  showTimeline: true,
  showProcess: true,
  showRates: true,
  showPricing: true,
  showCases: false,
  showNext: true,
};

function generateSlug(clientName: string) {
  return clientName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
}

interface Props {
  mode: "new" | "edit";
  id?: string;
  initialData?: Partial<ProposalFormData>;
}

export default function CpForm({ mode, id, initialData }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProposalFormData>({
    ...defaultForm,
    ...initialData,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      body: JSON.stringify(form),
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
        {/* Основное */}
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

        <Section number={1} title="Задача проекта и ориентиры" show={form.showTask} onToggle={() => set("showTask", !form.showTask)}>
          <BlockEditor value={form.taskContent} onChange={(v) => set("taskContent", v)} placeholder="Опишите задачу. / — вставить блок (список, заголовок, картинка...)" />
        </Section>

        <Section number={2} title="Этапы проекта" show={form.showStages} onToggle={() => set("showStages", !form.showStages)}>
          <BlockEditor value={form.stagesContent} onChange={(v) => set("stagesContent", v)} placeholder="Опишите этапы проекта. Используйте списки или таблицу..." />
        </Section>

        <Section number={3} title="Сроки" show={form.showTimeline} onToggle={() => set("showTimeline", !form.showTimeline)}>
          <BlockEditor value={form.timelineContent} onChange={(v) => set("timelineContent", v)} placeholder="Укажите сроки. Удобно использовать таблицу (/)..." />
        </Section>

        <Section number={4} title="Как будем работать" show={form.showProcess} onToggle={() => set("showProcess", !form.showProcess)}>
          <BlockEditor value={form.processContent} onChange={(v) => set("processContent", v)} placeholder="Опишите процесс работы. Нумерованный список подойдёт..." />
        </Section>

        <Section number={5} title="Ставки специалистов в час" show={form.showRates} onToggle={() => set("showRates", !form.showRates)}>
          <BlockEditor value={form.ratesContent} onChange={(v) => set("ratesContent", v)} placeholder="Укажите ставки. Таблица (/) — удобный формат..." />
        </Section>

        <Section number={6} title="Стоимость работ" show={form.showPricing} onToggle={() => set("showPricing", !form.showPricing)}>
          <BlockEditor value={form.pricingContent} onChange={(v) => set("pricingContent", v)} placeholder="Распишите стоимость. Таблица или нумерованный список..." />
        </Section>

        <Section number={7} title="Релевантные кейсы" show={form.showCases} onToggle={() => set("showCases", !form.showCases)}>
          <BlockEditor value={form.casesContent} onChange={(v) => set("casesContent", v)} placeholder="Добавьте примеры работ. Можно вставлять картинки (/)..." />
        </Section>

        <Section number={8} title="Что дальше?" show={form.showNext} onToggle={() => set("showNext", !form.showNext)}>
          <BlockEditor value={form.nextContent} onChange={(v) => set("nextContent", v)} placeholder="Опишите следующие шаги для клиента..." />
          <div>
            <label className="block text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wide mb-2">Контакт менеджера</label>
            <div className="grid grid-cols-2 gap-3">
              <input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="Имя" className={INPUT} />
              <input value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} placeholder="Должность" className={INPUT} />
              <input value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} placeholder="Email" type="email" className={INPUT} />
              <input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} placeholder="Телефон" className={INPUT} />
            </div>
          </div>
        </Section>

        <div className="pb-8" />
      </main>
    </div>
  );
}

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${enabled ? "bg-zinc-800 dark:bg-zinc-200" : "bg-zinc-200 dark:bg-zinc-700"}`}>
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white dark:bg-zinc-900 shadow-sm transition-transform ${enabled ? "translate-x-4.5" : "translate-x-0.5"}`} />
    </button>
  );
}

function Section({ number, title, show, onToggle, children }: {
  number: number;
  title: string;
  show: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 text-xs flex items-center justify-center font-semibold shrink-0">{number}</span>
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
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
