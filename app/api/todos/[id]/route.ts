import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, parseTodoBody } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy việc", 404);

  const body = await req.json();
  // PATCH nhanh chỉ đổi trạng thái (tick checkbox / kéo thả kanban)
  if (body.statusOnly) {
    const status = String(body.status);
    if (!["TODO", "DOING", "DONE"].includes(status))
      return jsonError("Trạng thái không hợp lệ");
    const todo = await prisma.todo.update({
      where: { id },
      data: {
        status,
        completedAt:
          status === "DONE" ? (existing.completedAt ?? new Date()) : null,
      },
    });
    return NextResponse.json(todo);
  }

  const parsed = parseTodoBody(body);
  if ("error" in parsed) return jsonError(parsed.error);

  const todo = await prisma.todo.update({
    where: { id },
    data: {
      ...parsed,
      completedAt:
        parsed.status === "DONE" ? (existing.completedAt ?? new Date()) : null,
    },
  });
  return NextResponse.json(todo);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.todo.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy việc", 404);

  await prisma.todo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
