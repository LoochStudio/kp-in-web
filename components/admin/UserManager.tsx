"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  _count: { proposals: number };
}

interface Props {
  users: User[];
  currentUserId: string;
}

export default function UserManager({ users: initial, currentUserId }: Props) {
  const router = useRouter();
  const [users, setUsers] = useState(initial);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setUsers((prev) => [...prev, { ...data, _count: { proposals: 0 } }]);
      setForm({ name: "", email: "", password: "" });
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить пользователя?")) return;
    const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      {/* Список */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
        {users.length === 0 ? (
          <p className="text-sm text-zinc-400 text-center py-10">Нет пользователей</p>
        ) : (
          users.map((u, i) => (
            <div
              key={u.id}
              className={`flex items-center gap-4 px-6 py-4 ${i !== users.length - 1 ? "border-b border-zinc-50" : ""}`}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold"
                style={{ background: "#2A1E16", color: "#C4A898" }}
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-900">
                  {u.name}
                  {u.id === currentUserId && (
                    <span className="ml-2 text-[10px] text-zinc-400">(вы)</span>
                  )}
                </p>
                <p className="text-xs text-zinc-400">{u.email}</p>
              </div>
              <span className="text-xs text-zinc-300 shrink-0">
                {u._count.proposals} КП
              </span>
              <span className="text-xs text-zinc-300 shrink-0 tabular-nums">
                {new Date(u.createdAt).toLocaleDateString("ru-RU")}
              </span>
              {u.id !== currentUserId && (
                <button
                  onClick={() => handleDelete(u.id)}
                  className="text-xs text-zinc-300 hover:text-red-400 transition-colors duration-300 shrink-0"
                >
                  Удалить
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Форма создания */}
      <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-zinc-900 mb-5">Добавить менеджера</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Имя"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors"
          />
          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className="rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Пароль"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              required
              className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 pr-9 text-sm text-zinc-900 outline-none focus:border-zinc-400 transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M1 7.5C1 7.5 3.5 3 7.5 3s6.5 4.5 6.5 4.5S11.5 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
                  <path d="M2 2l11 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M1 7.5C1 7.5 3.5 3 7.5 3s6.5 4.5 6.5 4.5S11.5 12 7.5 12 1 7.5 1 7.5z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/>
                  <circle cx="7.5" cy="7.5" r="1.8" stroke="currentColor" strokeWidth="1.2"/>
                </svg>
              )}
            </button>
          </div>
          {error && (
            <p className="md:col-span-3 text-xs text-red-500">{error}</p>
          )}
          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              disabled={pending}
              className="text-sm px-4 py-2 rounded-lg font-medium transition-colors duration-300 bg-[#333037] hover:bg-[#1C1917] text-[#FDFAF8] disabled:opacity-40"
            >
              {pending ? "Создание..." : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
