import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError } from "@/lib/api";

export async function POST(req: Request) {
  const body = await req.json();
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const code = typeof body.code === "string" ? body.code.trim() : "";
  if (!name) return jsonError("Tên nhóm là bắt buộc");
  if (!code) return jsonError("Mã nhóm là bắt buộc (vd: 01)");

  const budgetYear = await prisma.budgetYear.findUnique({
    where: { id: String(body.budgetYearId ?? "") },
    include: { _count: { select: { groups: true } } },
  });
  if (!budgetYear) return jsonError("Năm ngân sách không tồn tại");

  const dup = await prisma.budgetGroup.findUnique({
    where: { budgetYearId_code: { budgetYearId: budgetYear.id, code } },
  });
  if (dup) return jsonError(`Mã nhóm ${code} đã tồn tại trong năm`, 409);

  const group = await prisma.budgetGroup.create({
    data: {
      budgetYearId: budgetYear.id,
      code,
      name,
      sortOrder: budgetYear._count.groups,
    },
  });
  return NextResponse.json(group, { status: 201 });
}
