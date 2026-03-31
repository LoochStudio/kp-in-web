import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import UserManager from "@/components/admin/UserManager";

export default async function UsersPage() {
  const session = await auth();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      _count: { select: { proposals: true } },
    },
  });

  const currentUser = await prisma.user.findUnique({
    where: { email: session?.user?.email ?? "" },
    select: { id: true },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 px-6 py-4">
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
              <Link href="/admin" className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors duration-300">
                Предложения
              </Link>
              <Link href="/admin/users" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                Менеджеры
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-zinc-400">{session?.user?.name}</span>
            <form action={async () => { "use server"; await signOut({ redirectTo: "/login" }); }}>
              <button
                type="submit"
                className="text-sm text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors duration-300"
              >
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Менеджеры</h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            {users.length} {users.length === 1 ? "пользователь" : "пользователей"}
          </p>
        </div>
        <UserManager
          users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
          currentUserId={currentUser?.id ?? ""}
        />
      </main>
    </div>
  );
}
