import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { syncFromNotion } from "@/lib/notion-import";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await syncFromNotion(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка синхронизации";
    console.error("[notion-sync]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
