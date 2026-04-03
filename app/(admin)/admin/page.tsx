import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProposalActions from "@/components/admin/ProposalActions";
import NotionImportButton from "@/components/admin/NotionImportButton";

const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
  DRAFT:    { bg: "bg-zinc-100",        color: "text-zinc-500",  label: "Черновик" },
  SENT:     { bg: "bg-blue-50",         color: "text-blue-600",  label: "Отправлен" },
  ACCEPTED: { bg: "bg-emerald-50",      color: "text-emerald-600", label: "Принят" },
  REJECTED: { bg: "bg-red-50",          color: "text-red-500",   label: "Отклонён" },
};

export default async function AdminPage() {
  const session = await auth();

  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, clientName: true, status: true, createdAt: true, notionUrl: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b border-zinc-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #2A1E16 0%, #1A140F 100%)" }}
              >
                <span className="text-[10px] font-semibold" style={{ color: "#C4A898" }}>КП</span>
              </div>
            </div>
            <nav className="flex items-center gap-4">
              <Link href="/admin" className="text-sm font-semibold text-zinc-900">
                Предложения
              </Link>
              <Link href="/admin/users" className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors duration-300">
                Менеджеры
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-zinc-400">{session?.user?.name}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button
                type="submit"
                className="text-sm text-zinc-400 hover:text-zinc-700 transition-colors duration-300"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900">Все КП</h1>
            <p className="text-sm text-zinc-400 mt-0.5">
              {proposals.length} {proposals.length === 1 ? "предложение" : "предложений"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <NotionImportButton />
            <Link
              href="/admin/cp/new"
              className="text-sm px-4 py-2 rounded-lg font-medium transition-colors duration-300 bg-[#333037] hover:bg-[#1C1917] text-[#FDFAF8]"
            >
              + Создать КП
            </Link>
          </div>
        </div>

        {proposals.length === 0 ? (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm py-20 text-center">
            <div className="w-12 h-12 bg-zinc-50 rounded-xl flex items-center justify-center mx-auto mb-4 border border-zinc-100">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3v12M3 9h12" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-900">КП пока нет</p>
            <p className="text-sm text-zinc-400 mt-1">Создайте первое коммерческое предложение</p>
            <Link
              href="/admin/cp/new"
              className="inline-block mt-5 text-sm px-4 py-2 rounded-lg transition-colors duration-300 bg-[#333037] hover:bg-[#1C1917] text-[#FDFAF8]"
            >
              Создать КП
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-zinc-100 shadow-sm overflow-hidden">
            {proposals.map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 transition-colors duration-300 ${
                  i !== proposals.length - 1 ? "border-b border-zinc-50" : ""
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">
                    {p.clientName}
                  </p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{p.title}</p>
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusStyles[p.status].bg} ${statusStyles[p.status].color}`}
                >
                  {statusStyles[p.status].label}
                </span>
                <span className="text-xs text-zinc-300 shrink-0 tabular-nums">
                  {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                </span>
                <ProposalActions id={p.id} slug={p.slug} status={p.status} notionUrl={p.notionUrl} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
