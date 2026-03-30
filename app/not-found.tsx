import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-200 dark:text-zinc-800">404</p>
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 mt-4">Страница не найдена</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Возможно, ссылка устарела или КП было удалено.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
        >
          На главную
        </Link>
      </div>
    </div>
  );
}
