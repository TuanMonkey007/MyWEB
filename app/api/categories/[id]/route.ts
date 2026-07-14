import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const body = await req.json();

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy danh mục", 404);

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Tên danh mục là bắt buộc");

  const dup = await prisma.category.findUnique({
    where: { name_kind: { name, kind: existing.kind } },
  });
  if (dup && dup.id !== id) return jsonError("Danh mục này đã tồn tại", 409);

  const category = await prisma.category.update({ where: { id }, data: { name } });
  return NextResponse.json(category);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { expenses: true, incomes: true } } },
  });
  if (!existing) return jsonError("Không tìm thấy danh mục", 404);

  const used = existing._count.expenses + existing._count.incomes;
  if (used > 0)
    return jsonError(
      `Không thể xóa: danh mục đang dùng trong ${used} giao dịch`,
      409
    );

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
