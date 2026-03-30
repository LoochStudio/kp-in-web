import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ProposalActions from "@/components/admin/ProposalActions";
import ThemeToggle from "@/components/ui/ThemeToggle";

const statusColor: Record<string, string> = {
  DRAFT: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
  SENT: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
  ACCEPTED: "bg-green-50 text-green-600 dark:bg-green-950/50 dark:text-green-400",
  REJECTED: "bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400",
};

const statusLabel: Record<string, string> = {
  DRAFT: "Черновик",
  SENT: "Отправлен",
  ACCEPTED: "Принят",
  REJECTED: "Отклонён",
};

export default async function AdminPage() {
  const session = await auth();

  const proposals = await prisma.proposal.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, slug: true, title: true, clientName: true, status: true, createdAt: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-zinc-900 dark:bg-zinc-100 rounded-lg flex items-center justify-center">
              <span className="text-white dark:text-zinc-900 text-xs font-bold">КП</span>
            </div>
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Предложения</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-sm text-zinc-400">{session?.user?.name}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button type="submit" className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Все КП</h1>
            <p className="text-sm text-zinc-400 mt-0.5">{proposals.length} предложений</p>
          </div>
          <Link href="/admin/cp/new" className="bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors font-medium">
            + Создать КП
          </Link>
        </div>

        {proposals.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm py-20 text-center">
            <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 rounded-xl flex items-center justify-center mx-auto mb-4 border border-zinc-100 dark:border-zinc-700">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">КП пока нет</p>
            <p className="text-sm text-zinc-400 mt-1">Создайте первое коммерческое предложение</p>
            <Link href="/admin/cp/new" className="inline-block mt-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-sm px-4 py-2 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors">
              Создать КП
            </Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
            {proposals.map((p, i) => (
              <div key={p.id} className={`flex items-center gap-4 px-6 py-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${i !== proposals.length - 1 ? "border-b border-zinc-50 dark:border-zinc-800" : ""}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{p.clientName}</p>
                  <p className="text-xs text-zinc-400 mt-0.5 truncate">{p.title}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${statusColor[p.status]}`}>
                  {statusLabel[p.status]}
                </span>
                <span className="text-xs text-zinc-300 dark:text-zinc-600 shrink-0">
                  {new Date(p.createdAt).toLocaleDateString("ru-RU")}
                </span>
                <ProposalActions id={p.id} slug={p.slug} status={p.status} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
