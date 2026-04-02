"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type State = "idle" | "loading" | "done" | "error";

export default function NotionImportButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ slug: string; clientName: string; title: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/notion-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Неизвестная ошибка");
        setState("error");
        return;
      }

      setResult(data);
      setState("done");
      router.refresh();
    } catch {
      setError("Сетевая ошибка");
      setState("error");
    }
  }

  function handleClose() {
    setOpen(false);
    setState("idle");
    setUrl("");
    setError("");
    setResult(null);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-sm px-4 py-2 rounded-lg font-medium transition-colors duration-300 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        Импорт из Notion
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => e.target === e.currentTarget && handleClose()}
        >
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
              Импорт из Notion
            </h2>
            <p className="text-sm text-zinc-400 mb-5">
              Вставьте ссылку на страницу КП из Notion. Страница должна быть расшарена с интеграцией.
            </p>

            {state === "done" && result ? (
              <div className="space-y-4">
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 p-4">
                  <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    КП создано
                  </p>
                  <p className="text-sm text-zinc-500 mt-1">
                    {result.clientName} — {result.title}
                  </p>
                </div>
                <div className="flex gap-3">
                  <a
                    href={`/kp/${result.slug}`}
                    target="_blank"
                    className="flex-1 text-center text-sm px-4 py-2 rounded-lg font-medium bg-[#333037] text-[#FDFAF8] hover:bg-[#1C1917] transition-colors duration-300"
                  >
                    Открыть КП
                  </a>
                  <button
                    onClick={handleClose}
                    className="flex-1 text-sm px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-300"
                  >
                    Закрыть
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.notion.so/workspace/..."
                    required
                    disabled={state === "loading"}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-zinc-600 disabled:opacity-50"
                  />
                  {state === "error" && (
                    <p className="text-xs text-red-500 mt-2">{error}</p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={state === "loading" || !url}
                    className="flex-1 text-sm px-4 py-2 rounded-lg font-medium bg-[#333037] text-[#FDFAF8] hover:bg-[#1C1917] transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {state === "loading" ? "Импортирую..." : "Импортировать"}
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={state === "loading"}
                    className="flex-1 text-sm px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors duration-300"
                  >
                    Отмена
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
