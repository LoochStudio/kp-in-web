import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const proposals = await prisma.proposal.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        slug: true,
        title: true,
        clientName: true,
        status: true,
        createdAt: true,
      },
    });
    return NextResponse.json(proposals);
  } catch {
    return NextResponse.json({ error: "Ошибка при получении данных" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();

    // Валидация обязательных полей
    if (!body.clientName?.trim()) {
      return NextResponse.json({ error: "Укажите имя клиента" }, { status: 400 });
    }
    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Укажите название КП" }, { status: 400 });
    }
    if (!body.slug?.trim()) {
      return NextResponse.json({ error: "Укажите slug" }, { status: 400 });
    }

    // Проверка формата slug
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(body.slug)) {
      return NextResponse.json(
        { error: "Slug может содержать только латинские буквы, цифры и дефис" },
        { status: 400 }
      );
    }

    // Проверка уникальности slug
    const existing = await prisma.proposal.findUnique({ where: { slug: body.slug } });
    if (existing) {
      return NextResponse.json(
        { error: `КП со slug "${body.slug}" уже существует. Измените slug.` },
        { status: 409 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
    });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }

    const proposal = await prisma.proposal.create({
      data: { ...body, managerId: user.id },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (e) {
    console.error("[POST /api/cp]", e);
    return NextResponse.json({ error: "Ошибка при создании КП" }, { status: 500 });
  }
}
