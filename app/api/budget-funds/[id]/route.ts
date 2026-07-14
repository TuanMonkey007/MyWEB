import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, monthsToData, parseMonths } from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

export async function PUT(req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.budgetFund.findUnique({ where: { id } });
  if (!existing) return jsonError("Không tìm thấy quỹ", 404);

  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return jsonError("Tên quỹ là bắt buộc");

  const months = parseMonths(body.months);
  if ("error" in months) return jsonError(months.error);

  const fund = await prisma.budgetFund.update({
    where: { id },
    data: {
      name,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
      ...monthsToData(months),
    },
  });
  return NextResponse.json(fund);
}

export async function DELETE(_req: Request, { params }: Params) {
  const { id } = await params;
  const existing = await prisma.budgetFund.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!existing) return jsonError("Không tìm thấy quỹ", 404);
  if (existing._count.items > 0)
    return jsonError(
      `Không thể xóa: quỹ đang có ${existing._count.items} hạng mục đề xuất tham chiếu`,
      409
    );

  await prisma.budgetFund.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
