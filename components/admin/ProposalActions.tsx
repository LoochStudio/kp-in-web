"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConfirmModal from "@/components/ui/ConfirmModal";

const statusLabel: Record<string, string> = {
  DRAFT: "Черновик",
  SENT: "Отправлен",
  ACCEPTED: "Принят",
  REJECTED: "Отклонён",
};

interface Props {
  id: string;
  slug: string;
  status: string;
}

export default function ProposalActions({ id, slug, status }: Props) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(status);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  async function copyLink() {
    const url = `${window.location.origin}/kp/${slug}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function changeStatus(newStatus: string) {
    setCurrentStatus(newStatus);
    await fetch(`/api/cp/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  }

  async function handleDelete() {
    await fetch(`/api/cp/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function handleDuplicate() {
    const res = await fetch(`/api/cp/${id}`);
    const data = await res.json();

    await fetch("/api/cp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        id: undefined,
        slug: `${data.slug}-copy`,
        status: "DRAFT",
        title: `${data.title} (копия)`,
      }),
    });
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center gap-2 justify-end">
        <select
          value={currentStatus}
          onChange={(e) => changeStatus(e.target.value)}
          className="text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2 py-1.5 text-zinc-600 dark:text-zinc-400 outline-none focus:border-zinc-400 dark:focus:border-zinc-500 bg-white dark:bg-zinc-900 cursor-pointer"
        >
          {Object.entries(statusLabel).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>

        <button
          onClick={copyLink}
          className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          {copied ? "Скопировано ✓" : "Ссылка"}
        </button>

        <a
          href={`/kp/${slug}`}
          target="_blank"
          className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          ↗
        </a>

        <a
          href={`/admin/cp/${id}/edit`}
          className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Изменить
        </a>

        <button
          onClick={handleDuplicate}
          className="text-xs text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors px-2 py-1.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Дублировать
        </button>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="text-xs text-zinc-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50"
        >
          Удалить
        </button>
      </div>

      {showDeleteModal && (
        <ConfirmModal
          title="Удалить КП?"
          description="Это действие нельзя отменить. КП будет удалено безвозвратно."
          confirmLabel="Удалить"
          danger
          onConfirm={() => {
            setShowDeleteModal(false);
            handleDelete();
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </>
  );
}
