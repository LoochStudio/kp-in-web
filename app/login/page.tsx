"use client";

import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [error, action, pending] = useActionState(loginAction, "");

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(160deg, #1A1210 0%, #0D0B0A 55%, #111010 100%)" }}
    >
      {/* Тонкая сетка-текстура */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #3A2F2A 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          opacity: 0.15,
        }}
      />

      <div className="relative w-full max-w-sm hero-reveal hero-reveal-2">
        {/* Логотип */}
        <div className="mb-10 text-center">
          <div
            className="inline-flex items-center justify-center w-10 h-10 rounded-2xl mb-5"
            style={{ background: "#2A1F18", border: "1px solid #3A2A22" }}
          >
            <span className="text-sm font-semibold" style={{ color: "#C4A898" }}>КП</span>
          </div>
          <h1 className="text-xl font-semibold" style={{ color: "#FDFAF8" }}>
            Вход в систему
          </h1>
          <p className="text-sm mt-1.5 font-light" style={{ color: "#6B5E55" }}>
            Управление коммерческими предложениями
          </p>
        </div>

        {/* Форма */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid #2A1F18",
            backdropFilter: "blur(12px)",
          }}
        >
          <form action={action} className="space-y-5">
            <div>
              <label
                className="block text-[10px] font-medium uppercase tracking-[0.2em] mb-2"
                style={{ color: "#6B5E55" }}
              >
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="manager@studio.ru"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid #2A1F18",
                  color: "#FDFAF8",
                }}
                onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "#5A4A42")}
                onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "#2A1F18")}
                required
              />
            </div>

            <div>
              <label
                className="block text-[10px] font-medium uppercase tracking-[0.2em] mb-2"
                style={{ color: "#6B5E55" }}
              >
                Пароль
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full rounded-xl px-4 py-3 text-sm outline-none transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid #2A1F18",
                  color: "#FDFAF8",
                }}
                onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "#5A4A42")}
                onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "#2A1F18")}
                required
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2.5 rounded-xl px-4 py-3"
                style={{ background: "rgba(255,100,80,0.08)", border: "1px solid rgba(255,100,80,0.15)" }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                  <circle cx="7" cy="7" r="6" stroke="#FF7A7A" strokeWidth="1.5" />
                  <path d="M7 4v3.5M7 9.5v.5" stroke="#FF7A7A" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span className="text-xs" style={{ color: "#FF9A8A" }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-xl py-3 text-sm font-medium mt-2 transition-all duration-500 disabled:opacity-40"
              style={{
                background: pending ? "#2A1F18" : "linear-gradient(135deg, #3A2820 0%, #2A1E16 100%)",
                color: "#C4A898",
                border: "1px solid #4A3528",
              }}
              onMouseEnter={(e) => {
                if (!pending) (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #4A3228 0%, #3A2A1E 100%)";
              }}
              onMouseLeave={(e) => {
                if (!pending) (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, #3A2820 0%, #2A1E16 100%)";
              }}
            >
              {pending ? "Вход..." : "Войти"}
            </button>
          </form>
        </div>

        {/* Лейбл студии */}
        <p className="text-center text-[11px] mt-8 font-light" style={{ color: "#3A302C" }}>
          loo.ch · design studio
        </p>
      </div>
    </div>
  );
}
