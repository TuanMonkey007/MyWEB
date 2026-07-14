import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.budgetGroup.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy nhóm", 404);

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!name || !code) return jsonError("Mã và tên nhóm là bắt buộc");

  const dup = await prisma.budgetGroup.findUnique({
    where: {
      budgetYearId_code: { budgetYearId: existing.budgetYearId, code },
    },
  });
  if (dup && dup.id !== id) return jsonError(`Mã nhóm ${code} đã tồn tại`, 409);

  const group = await prisma.budgetGroup.update({
    where: { id },
    data: { name, code },
  });
  return NextResponse.json(group);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.budgetGroup.findUnique({
    where: { id },
    include: { funds: { include: { _count: { select: { items: true } } } } },
  });
  if (!existing) return jsonError("Không tìm thấy nhóm", 404);

  const itemCount = existing.funds.reduce((s, f) => s + f._count.items, 0);
  if (itemCount > 0)
    return jsonError(
      `Không thể xóa: các quỹ trong nhóm đang có ${itemCount} hạng mục đề xuất`,
      409
    );

  await prisma.budgetGroup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
