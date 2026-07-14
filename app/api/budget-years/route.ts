import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function GET() {
  const years = await prisma.budgetYear.findMany({
    orderBy: { year: "desc" },
    include: { _count: { select: { groups: true, proposals: true } } },
  });
  return NextResponse.json(years);
}

export async function POST(req: Request) {
  const body = await req.json();
  const year = Math.round(Number(body.year));
  if (!Number.isFinite(year) || year < 2000 || year > 2100)
    return jsonError("Năm không hợp lệ");

  const dup = await prisma.budgetYear.findUnique({ where: { year } });
  if (dup) return jsonError(`Năm ${year} đã tồn tại`, 409);

  const created = await prisma.budgetYear.create({
    data: {
      year,
      title: typeof body.title === "string" && body.title.trim() ? body.title.trim() : null,
      notes: typeof body.notes === "string" && body.notes.trim() ? body.notes.trim() : null,
    },
  });

  // Sao chép cấu trúc nhóm/quỹ từ năm khác (số tiền đặt 0 để lập kế hoạch mới)
  if (typeof body.copyFromId === "string" && body.copyFromId) {
    const source = await prisma.budgetGroup.findMany({
      where: { budgetYearId: body.copyFromId },
      orderBy: { sortOrder: "asc" },
      include: { funds: { orderBy: { sortOrder: "asc" } } },
    });
    for (const g of source) {
      await prisma.budgetGroup.create({
        data: {
          budgetYearId: created.id,
          code: g.code,
          name: g.name,
          sortOrder: g.sortOrder,
          funds: {
            create: g.funds.map((f) => ({
              name: f.name,
              notes: f.notes,
              sortOrder: f.sortOrder,
            })),
          },
        },
      });
    }
  }

  return NextResponse.json(created, { status: 201 });
}
