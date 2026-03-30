"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="text-center">
        <p className="text-6xl font-bold text-zinc-200">500</p>
        <h1 className="text-xl font-semibold text-zinc-900 mt-4">Что-то пошло не так</h1>
        <p className="text-sm text-zinc-400 mt-2">
          Произошла ошибка на сервере. Попробуйте ещё раз.
        </p>
        <button
          onClick={reset}
          className="inline-block mt-6 bg-zinc-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
