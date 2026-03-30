import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const proposal = await prisma.proposal.findUnique({ where: { id } });
    if (!proposal) {
      return NextResponse.json({ error: "КП не найдено" }, { status: 404 });
    }
    return NextResponse.json(proposal);
  } catch {
    return NextResponse.json({ error: "Ошибка при получении данных" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();

    // Если меняется slug — проверяем что он не занят другим КП
    if (body.slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(body.slug)) {
        return NextResponse.json(
          { error: "Slug может содержать только латинские буквы, цифры и дефис" },
          { status: 400 }
        );
      }

      const existing = await prisma.proposal.findUnique({ where: { slug: body.slug } });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: `Slug "${body.slug}" уже занят другим КП` },
          { status: 409 }
        );
      }
    }

    const proposal = await prisma.proposal.update({
      where: { id },
      data: body,
    });

    return NextResponse.json(proposal);
  } catch {
    return NextResponse.json({ error: "Ошибка при обновлении КП" }, { status: 500 });
  }
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    await prisma.proposal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Ошибка при удалении КП" }, { status: 500 });
  }
}
