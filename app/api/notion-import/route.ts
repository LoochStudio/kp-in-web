import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { importFromNotion } from "@/lib/notion-import";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let url: string;
  try {
    ({ url } = await req.json());
  } catch {
    return NextResponse.json({ error: "Неверный формат запроса" }, { status: 400 });
  }

  if (!url?.includes("notion")) {
    return NextResponse.json({ error: "Укажите ссылку на страницу Notion" }, { status: 400 });
  }

  try {
    const result = await importFromNotion(url, session.user.email);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ошибка импорта";
    console.error("[notion-import]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
